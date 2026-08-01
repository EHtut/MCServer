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
    [switch]$Force,
    [switch]$Live
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

# --- -Live: flush and hold saves over the copy, via RCON --------------------
#
# Why this exists: without it the ONLY safe path required stopping the server,
# and on a box where the server is always up that meant no backup was EVER
# taken. An unusable safe path is not a safe path - it is just an absent one.
#
# -Force is the trap it replaces. Compress-Archive succeeds against a live
# world (session.lock's exclusive handle does not stop it), so -Force yields an
# archive that looks perfectly healthy and is a torn mid-write copy. The
# failure only appears when you restore it, which is the worst possible moment
# to discover it.
$heldSaves = $false
if ($running -and $Live) {
    $rcon = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "tools\rcon.py"
    if (-not (Test-Path $rcon)) { Die "-Live needs tools\rcon.py and it is missing" }
    $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    try {
        Say "server is up - flushing and holding saves"
        & python $rcon "save-off"        | Out-Null
        & python $rcon "save-all flush"  | Out-Null
        Start-Sleep -Seconds 3
        $heldSaves = $true
    } finally { $ErrorActionPreference = $prev }
    if (-not $heldSaves) { Die "could not reach RCON; refusing to copy a live world" }
}
elseif ($running -and -not $Force) {
    Die @"
The server appears to be RUNNING.

Copying region files while the server writes them produces a backup that looks
fine and restores broken. Either:

  Run this with -Live       (flushes and holds saves over the copy via RCON,
                             then releases them - no downtime)

  Or stop the server:       stop

-Force does NOT make a live copy safe. It only skips this check, and the
archive it produces looks valid while being torn. Use -Live.
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
$stage = Join-Path $env:TEMP "mcbackup-$stamp"
try {
    # Stage first, then zip the stage.
    #
    # Compress-Archive cannot read world\session.lock - the server holds it
    # exclusively and the whole archive fails with UnauthorizedAccessError. So
    # a direct archive of a running instance does not merely risk a torn copy,
    # it produces NOTHING. robocopy skips what it cannot open (/R:0, no
    # retries) and we exclude the lock explicitly.
    #
    # Staging is also what makes the -Live window short: saves stay held only
    # for the copy, not for compression, which is the slow half.
    New-Item -ItemType Directory -Force -Path $stage | Out-Null
    foreach ($src in $items) {
        $leaf = Split-Path $src -Leaf
        if (Test-Path $src -PathType Container) {
            $null = robocopy $src (Join-Path $stage $leaf) /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS /NP /XF session.lock
            # robocopy exit codes < 8 are success; 8+ are real failures.
            if ($LASTEXITCODE -ge 8) { Die "robocopy failed on $src (exit $LASTEXITCODE)" }
        } else {
            Copy-Item $src (Join-Path $stage $leaf) -Force
        }
    }
    Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $archive -CompressionLevel Optimal
}
finally {
    if (Test-Path $stage) { Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue }
    # ALWAYS release saves, including on failure. A backup that dies partway
    # through and leaves save-off set would give a server that never writes to
    # disk again - silently, until the next restart loses everything since.
    # That failure is far worse than the missing backup that caused it.
    if ($heldSaves) {
        $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
        try { & python $rcon "save-on" | Out-Null; Say "saves released" }
        catch { Warn "COULD NOT RE-ENABLE SAVES - run 'save-on' in the console NOW" }
        finally { $ErrorActionPreference = $prev }
    }
}

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
