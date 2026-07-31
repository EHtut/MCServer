<#
.SYNOPSIS
  Back up the world (and the configs needed to make it mean anything).

.DESCRIPTION
  Backs up world data plus the small files that make a restore actually usable -
  server.properties, ops, whitelist, and the config directory. A world folder
  without the 400 mod configs that generated it is only half a backup.

  Retention is generational rather than "keep the last N": recent backups are
  worth more, but you also want something from a week ago when you discover the
  corruption three days late.

  If the server is RUNNING, this script tells you to flush saves first rather
  than quietly copying region files mid-write. Use:
      save-off / save-all flush   ... back up ...   save-on
  or just stop the server. A backup taken during a save is not a backup.

.PARAMETER InstanceDir
  Runtime instance to back up. Default C:\MCServer\instance.

.PARAMETER DestDir
  Where archives go. Default C:\MCServer\backups.
#>
[CmdletBinding()]
param(
    [string]$InstanceDir = "C:\MCServer\instance",
    [string]$DestDir     = "C:\MCServer\backups",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Say($m)  { Write-Host "==> $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "!!  $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "XX  $m" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $InstanceDir)) { Die "no instance at $InstanceDir" }
New-Item -ItemType Directory -Force -Path $DestDir | Out-Null

# Is the server up? A java process with this instance in its command line.
$running = $false
try {
    $procs = Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        if ($p.CommandLine -and $p.CommandLine -like "*$InstanceDir*") { $running = $true; break }
    }
} catch { }

if ($running -and -not $Force) {
    Die @"
The server appears to be RUNNING.

Copying region files while the server writes them produces a backup that looks
fine and restores broken. Do one of these first:

  In the server console:   save-off
                           save-all flush
      (run this backup)
                           save-on

  Or stop the server:      stop

Then re-run. Pass -Force only if you know the world is idle.
"@
}

$stamp   = Get-Date -Format "yyyy-MM-dd_HHmmss"
$archive = Join-Path $DestDir "world-$stamp.zip"

$items = @()
foreach ($n in @("world", "world_nether", "world_the_end", "config",
                 "server.properties", "ops.json", "whitelist.json",
                 "usercache.json", "kubejs")) {
    $p = Join-Path $InstanceDir $n
    if (Test-Path $p) { $items += $p }
}
if (-not $items) { Die "nothing to back up in $InstanceDir" }

Say "archiving $($items.Count) item(s) -> $archive"
Compress-Archive -Path $items -DestinationPath $archive -CompressionLevel Optimal

$sizeMb = [math]::Round((Get-Item $archive).Length / 1MB, 1)
Say "wrote $archive ($sizeMb MB)"

# --- generational retention -------------------------------------------------
# Keep: every backup from the last 2 days, one per day for 14 days, one per
# week beyond that. Deleting the middle of the curve rather than the tail is
# what makes "I noticed the problem on Thursday" recoverable.
$all = Get-ChildItem $DestDir -Filter "world-*.zip" | Sort-Object LastWriteTime -Descending
$now = Get-Date
$keep = New-Object System.Collections.Generic.HashSet[string]
$seenDay  = New-Object System.Collections.Generic.HashSet[string]
$seenWeek = New-Object System.Collections.Generic.HashSet[string]

foreach ($f in $all) {
    $age = ($now - $f.LastWriteTime).TotalDays
    if ($age -le 2) { [void]$keep.Add($f.FullName); continue }
    if ($age -le 14) {
        $d = $f.LastWriteTime.ToString("yyyy-MM-dd")
        if ($seenDay.Add($d)) { [void]$keep.Add($f.FullName) }
        continue
    }
    $w = "{0}-{1}" -f $f.LastWriteTime.Year, [int]($f.LastWriteTime.DayOfYear / 7)
    if ($seenWeek.Add($w)) { [void]$keep.Add($f.FullName) }
}

$drop = $all | Where-Object { -not $keep.Contains($_.FullName) }
foreach ($f in $drop) {
    Write-Host "    pruning $($f.Name)" -ForegroundColor DarkGray
    Remove-Item $f.FullName -Force
}

$remaining = (Get-ChildItem $DestDir -Filter "world-*.zip" | Measure-Object).Count
$totalGb = [math]::Round(((Get-ChildItem $DestDir -Filter "world-*.zip" |
            Measure-Object -Property Length -Sum).Sum / 1GB), 2)
Say "$remaining backup(s) retained, $totalGb GB total"
