<#
.SYNOPSIS
  One-command launcher: start the server, wait until it is actually joinable,
  and print how to connect.

.DESCRIPTION
  Written for the case where the server and the client run on the SAME machine.
  Starting both at once makes each look broken - the server is generating configs
  while the client loads ~380 mods, and they fight over the same cores. So this
  starts the server, waits for it to report Done, and only then tells you to
  launch the game.

  The server keeps running in this window. Stop it with the 'stop' command typed
  into this console, or from anywhere with:
      python tools\rcon.py --instance C:\MCServer\instance --stop

  Never close the window to stop it - that skips the world save.
#>
[CmdletBinding()]
param(
    [string]$InstanceDir = "C:\MCServer\instance",
    [switch]$NoWait
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$log = Join-Path $InstanceDir "logs\latest.log"

Write-Host ""
Write-Host "  Cogs & Cadavers - starting server" -ForegroundColor Cyan
Write-Host "  ---------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Truncate nothing; just note where we start reading from so we only watch this run.
$startMark = if (Test-Path $log) { (Get-Item $log).Length } else { 0 }

$job = Start-Job -ScriptBlock {
    param($repo, $instance)
    & (Join-Path $repo "server\scripts\start.ps1") -InstanceDir $instance
} -ArgumentList $RepoRoot, $InstanceDir

if ($NoWait) {
    Write-Host "server starting in background (job $($job.Id))" -ForegroundColor DarkGray
    return
}

Write-Host "  Loading ~355 mods. First boot after a change takes several minutes." -ForegroundColor DarkGray
Write-Host "  This is not frozen." -ForegroundColor DarkGray
Write-Host ""

$deadline = (Get-Date).AddMinutes(20)
$ready = $false
$spin = @('|','/','-','\'); $i = 0

while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
    if (Test-Path $log) {
        $tail = Get-Content $log -Tail 200 -ErrorAction SilentlyContinue
        if ($tail -match 'Done \(') { $ready = $true; break }
        if ($tail -match 'Failed to start the minecraft server') {
            Write-Host "`r  XX  server failed to start - see $log" -ForegroundColor Red
            Write-Host "      most likely a mod problem; run:" -ForegroundColor DarkGray
            Write-Host "      python tools\check_deps.py $InstanceDir\mods --side=SERVER" -ForegroundColor DarkGray
            return
        }
    }
    if ($job.State -eq 'Completed' -or $job.State -eq 'Failed') { break }
    Write-Host "`r  $($spin[$i % 4]) starting..." -NoNewline -ForegroundColor DarkGray
    $i++
}

Write-Host "`r                        " -NoNewline
Write-Host ""

if (-not $ready) {
    Write-Host "  !!  server did not report ready within 20 minutes." -ForegroundColor Yellow
    Write-Host "      Watch $log" -ForegroundColor DarkGray
    return
}

$doneLine = (Get-Content $log -Tail 300 | Select-String 'Done \(' | Select-Object -Last 1).ToString()
if ($doneLine -match 'Done \(([^)]+)\)') { $bootTime = $Matches[1] } else { $bootTime = "?" }

$lan = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
        Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host "  SERVER READY  ($bootTime)" -ForegroundColor Green
Write-Host ""
Write-Host "  You:            localhost" -ForegroundColor White
if ($lan) { Write-Host "  Same network:   $lan" -ForegroundColor White }
Write-Host "  Voice chat:     UDP 24454 (separate from the game port)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Launch Minecraft now. Starting it earlier just makes both fight" -ForegroundColor DarkGray
Write-Host "  over the same cores." -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To stop cleanly:" -ForegroundColor DarkGray
Write-Host "    python tools\rcon.py --instance $InstanceDir --stop" -ForegroundColor DarkGray
Write-Host ""

Receive-Job $job -Wait -AutoRemoveJob
