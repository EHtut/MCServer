<#
.SYNOPSIS
  Start the server.

.DESCRIPTION
  A thin wrapper over the run script NeoForge's installer generates. It exists
  to fail loudly and usefully when the instance is not actually ready, rather
  than dumping a Java stack trace on you.

.PARAMETER InstanceDir
  The runtime instance. Default C:\MCServer\instance.
#>
[CmdletBinding()]
param(
    [string]$InstanceDir = "C:\MCServer\instance"
)

$ErrorActionPreference = "Stop"

function Die($msg) { Write-Host "XX  $msg" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $InstanceDir)) {
    Die "no instance at $InstanceDir - run server\scripts\setup-server.ps1 first"
}

$eula = Join-Path $InstanceDir "eula.txt"
if ((-not (Test-Path $eula)) -or -not (Select-String -Path $eula -Pattern '^eula\s*=\s*true' -Quiet)) {
    Die "EULA not accepted. Read https://aka.ms/MinecraftEULA then run setup-server.ps1 -AcceptEula"
}

$run = Join-Path $InstanceDir "run.bat"
if (-not (Test-Path $run)) { Die "run.bat missing - the NeoForge install did not complete" }

$modCount = (Get-ChildItem (Join-Path $InstanceDir "mods") -Filter *.jar -ErrorAction SilentlyContinue |
             Measure-Object).Count
if ($modCount -lt 300) {
    Write-Host "!!  only $modCount mods present; expected ~357 server-side." -ForegroundColor Yellow
    Write-Host "!!  run setup-server.ps1 again to repair the instance." -ForegroundColor Yellow
}

Write-Host "==> starting server ($modCount mods) from $InstanceDir" -ForegroundColor Cyan
Write-Host "    First boot after a mod change generates configs and is SLOW. Be patient." -ForegroundColor DarkGray
Write-Host "    Stop it with the 'stop' command in the console - never by closing the window," -ForegroundColor DarkGray
Write-Host "    which skips the world save." -ForegroundColor DarkGray
Write-Host ""

Push-Location $InstanceDir
try { & cmd /c run.bat } finally { Pop-Location }
