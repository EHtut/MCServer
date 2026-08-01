<#
.SYNOPSIS
  Start the server.

.DESCRIPTION
  Invokes Java directly rather than shelling through NeoForge's generated
  run.bat, for two reasons learned the hard way:

    1. run.bat calls bare `java`, taking whatever is first on PATH. On a machine
       with an old JRE installed (very common - Java 8 ships with all sorts of
       things) that is the wrong Java and the server dies with
       UnsupportedClassVersionError, which reads like a mod problem and is not.
    2. run.bat ends with `pause`, which blocks forever under any non-interactive
       caller - a scheduled task, a service wrapper, CI.

  We resolve a Java 21+ ourselves and pass NeoForge's own argument files, so the
  launch is identical minus those two traps.

.PARAMETER InstanceDir
  The runtime instance. Default C:\MCServer\instance.
#>
[CmdletBinding()]
param(
    [string]$InstanceDir = "C:\MCServer\instance",
    [switch]$Gui
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Die($msg) { Write-Host "XX  $msg" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $InstanceDir)) {
    Die "no instance at $InstanceDir - run server\scripts\setup-server.ps1 first"
}

$eula = Join-Path $InstanceDir "eula.txt"
if ((-not (Test-Path $eula)) -or -not (Select-String -Path $eula -Pattern '^eula\s*=\s*true' -Quiet)) {
    Die "EULA not accepted. Read https://aka.ms/MinecraftEULA then run setup-server.ps1 -AcceptEula"
}

# --- find a Java 21+ ---------------------------------------------------------
# `java -version` prints to STDERR. Under PowerShell 5.1 with ErrorActionPreference
# = Stop, redirecting a native command's stderr raises a terminating
# NativeCommandError - which makes a working JDK look missing. Probe under
# 'Continue'.
function Get-Java21 {
    $candidates = @()
    if ($env:JAVA_HOME) { $candidates += (Join-Path $env:JAVA_HOME "bin\java.exe") }
    foreach ($root in @("$env:ProgramFiles\Eclipse Adoptium", "$env:ProgramFiles\Java",
                        "$env:ProgramFiles\Microsoft", "$env:ProgramFiles\Zulu",
                        "$env:LOCALAPPDATA\Programs\Eclipse Adoptium")) {
        if (Test-Path $root) {
            Get-ChildItem $root -Directory -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -match 'jdk-?2[1-9]|jdk-?[3-9][0-9]' } |
                ForEach-Object { $candidates += (Join-Path $_.FullName "bin\java.exe") }
        }
    }
    $candidates += "java"

    foreach ($c in $candidates) {
        if ($c -ne "java" -and -not (Test-Path $c)) { continue }
        $prev = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try { $out = (& $c -version 2>&1 | Out-String) } catch { $out = "" } finally { $ErrorActionPreference = $prev }
        if ($out -match '(?:version\s+")(\d+)' -and [int]$Matches[1] -ge 21) { return $c }
    }
    return $null
}

$javaCmd = Get-Java21
if (-not $javaCmd) {
    Die @"
No Java 21+ found. Minecraft 1.21.1 will not run on anything older.

  winget install EclipseAdoptium.Temurin.21.JDK

If it is installed but not detected, set JAVA_HOME to it and re-run.
NOTE: having Java 8 on PATH is fine - this script looks past it.
"@
}

# --- NeoForge's own argument file --------------------------------------------
$packToml = Join-Path $RepoRoot "pack\pack.toml"
$neoVersion = $null
if (Test-Path $packToml) {
    if ((Get-Content $packToml -Raw) -match 'neoforge\s*=\s*"([^"]+)"') { $neoVersion = $Matches[1] }
}
$argsFile = $null
if ($neoVersion) {
    $candidate = Join-Path $InstanceDir "libraries\net\neoforged\neoforge\$neoVersion\win_args.txt"
    if (Test-Path $candidate) { $argsFile = $candidate }
}
if (-not $argsFile) {
    # Fall back to whatever NeoForge actually installed.
    $argsFile = Get-ChildItem (Join-Path $InstanceDir "libraries\net\neoforged\neoforge") `
        -Recurse -Filter "win_args.txt" -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
}
if (-not $argsFile) { Die "NeoForge argument file not found - the install did not complete" }

$jvmArgs = Join-Path $InstanceDir "user_jvm_args.txt"
if (-not (Test-Path $jvmArgs)) { Die "user_jvm_args.txt missing - re-run setup-server.ps1" }

$modCount = (Get-ChildItem (Join-Path $InstanceDir "mods") -Filter *.jar -ErrorAction SilentlyContinue |
             Measure-Object).Count
if ($modCount -lt 300) {
    Write-Host "!!  only $modCount mods present; expected ~351 server-side." -ForegroundColor Yellow
}

Write-Host "==> java:     $javaCmd" -ForegroundColor Cyan
Write-Host "==> instance: $InstanceDir ($modCount mods)" -ForegroundColor Cyan
Write-Host "    First boot after a mod change generates configs and is SLOW. Be patient." -ForegroundColor DarkGray
Write-Host "    Stop with the 'stop' console command - never by closing the window," -ForegroundColor DarkGray
Write-Host "    which skips the world save." -ForegroundColor DarkGray
Write-Host ""

$serverArgs = @("@$jvmArgs", "@$argsFile")
if (-not $Gui) { $serverArgs += "nogui" }

Push-Location $InstanceDir
try { & $javaCmd @serverArgs } finally { Pop-Location }
