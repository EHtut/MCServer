<#
.SYNOPSIS
  Build a runnable server instance from this repo.

.DESCRIPTION
  Turns the recipe (manifest + configs) into a runtime. Safe to re-run: it is
  idempotent, it never touches the world directory, and mods are verified by
  hash rather than trusted.

  The instance is created OUTSIDE the repo on purpose. Worlds, logs and jars do
  not belong in git, and the repo lives in a synced folder often enough that a
  live world inside it is a corruption risk.

.PARAMETER InstanceDir
  Where the runnable server goes. Default C:\MCServer\instance.

.PARAMETER AcceptEula
  Required to write eula.txt. Omitted deliberately by default: accepting
  Mojang's EULA is your decision, not this script's. Read it at
  https://aka.ms/MinecraftEULA and pass -AcceptEula if you agree.

.EXAMPLE
  .\setup-server.ps1 -AcceptEula
  .\setup-server.ps1 -InstanceDir D:\mc\instance -AcceptEula
#>
[CmdletBinding()]
param(
    [string]$InstanceDir = "C:\MCServer\instance",
    [string]$CacheDir    = "C:\MCServer\cache",
    [switch]$AcceptEula,
    [switch]$SkipMods
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Say($msg)  { Write-Host "==> $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "!!  $msg" -ForegroundColor Yellow }
function Die($msg)  { Write-Host "XX  $msg" -ForegroundColor Red; exit 1 }

Say "repo:     $RepoRoot"
Say "instance: $InstanceDir"

# --- 1. Java 21 -------------------------------------------------------------
# Minecraft 1.21.1 requires Java 21. This is the single most common setup
# failure, and the error it produces otherwise (UnsupportedClassVersionError)
# is unhelpful, so check it up front and say exactly what to install.
Say "checking Java"
$javaOk = $false
$javaCmd = $null
# Built explicitly rather than with a ternary: this has to parse on Windows
# PowerShell 5.1, which has no ?: operator.
$javaCandidates = @()
if ($env:JAVA_HOME) { $javaCandidates += (Join-Path $env:JAVA_HOME "bin\java.exe") }
$javaCandidates += "java"
foreach ($candidate in $javaCandidates) {
    if (-not $candidate) { continue }
    # `java -version` writes to STDERR, not stdout. Under Windows PowerShell 5.1
    # with $ErrorActionPreference = 'Stop', redirecting a native command's stderr
    # raises a terminating NativeCommandError - which would make a perfectly good
    # JDK look absent. Drop to 'Continue' for the duration of the probe.
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $out = (& $candidate -version 2>&1 | Out-String)
    } catch {
        $out = ""
    } finally {
        $ErrorActionPreference = $prevEAP
    }
    if ($out -match '(?:version\s+")(\d+)') {
        $major = [int]$Matches[1]
        if ($major -ge 21) { $javaOk = $true; $javaCmd = $candidate; break }
        Warn "found Java $major at '$candidate' - too old"
    }
}
if (-not $javaOk) {
    Die @"
Java 21+ not found. Minecraft 1.21.1 will not run on anything older.

Install a JDK 21 (either is fine):
  winget install EclipseAdoptium.Temurin.21.JDK
  winget install Microsoft.OpenJDK.21

Then re-run this script. If you have Java 21 installed but not on PATH, set
JAVA_HOME to it first.
"@
}
Say "using $javaCmd"

# --- 2. versions from the pack manifest ------------------------------------
$packToml = Join-Path $RepoRoot "pack\pack.toml"
if (-not (Test-Path $packToml)) { Die "pack/pack.toml missing - run tools/gen_pack.py" }
$packText = Get-Content $packToml -Raw
if ($packText -notmatch 'neoforge\s*=\s*"([^"]+)"')  { Die "no neoforge version in pack.toml" }
$NeoVersion = $Matches[1]
if ($packText -notmatch 'minecraft\s*=\s*"([^"]+)"') { Die "no minecraft version in pack.toml" }
$McVersion = $Matches[1]
Say "minecraft $McVersion / neoforge $NeoVersion"

New-Item -ItemType Directory -Force -Path $InstanceDir, $CacheDir | Out-Null

# --- 3. NeoForge server ------------------------------------------------------
$installer = Join-Path $CacheDir "neoforge-$NeoVersion-installer.jar"
$marker    = Join-Path $InstanceDir ".neoforge-$NeoVersion.installed"

if (Test-Path $marker) {
    Say "NeoForge $NeoVersion already installed"
} else {
    if (-not (Test-Path $installer)) {
        $url = "https://maven.neoforged.net/releases/net/neoforged/neoforge/$NeoVersion/neoforge-$NeoVersion-installer.jar"
        Say "downloading NeoForge installer"
        Write-Host "    $url"
        Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
    }
    Say "installing NeoForge server (this takes a minute)"
    Push-Location $InstanceDir
    try {
        & $javaCmd -jar $installer --installServer $InstanceDir
        if ($LASTEXITCODE -ne 0) { Die "NeoForge installer failed ($LASTEXITCODE)" }
    } finally { Pop-Location }
    New-Item -ItemType File -Path $marker -Force | Out-Null
}

# --- 4. configuration --------------------------------------------------------
Say "writing configuration"
$srcCfg = Join-Path $RepoRoot "server\config"

Copy-Item (Join-Path $srcCfg "user_jvm_args.txt") $InstanceDir -Force

# server.properties: preserve an existing rcon password rather than rotating it
# on every setup run, which would break anything already pointed at it.
$destProps = Join-Path $InstanceDir "server.properties"
$existingRcon = $null
if (Test-Path $destProps) {
    $m = Select-String -Path $destProps -Pattern '^rcon\.password=(.*)$'
    if ($m -and $m.Matches[0].Groups[1].Value -and
        $m.Matches[0].Groups[1].Value -ne "CHANGE_ME_AT_SETUP") {
        $existingRcon = $m.Matches[0].Groups[1].Value
    }
}
if (-not $existingRcon) {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $existingRcon = [Convert]::ToBase64String($bytes) -replace '[^A-Za-z0-9]', ''
    Say "generated a new RCON password (instance only, never committed)"
}
(Get-Content (Join-Path $srcCfg "server.properties") -Raw) `
    -replace 'rcon\.password=CHANGE_ME_AT_SETUP', "rcon.password=$existingRcon" |
    Set-Content -Path $destProps -Encoding utf8

# Pack config overrides, if any have been captured.
$packCfg = Join-Path $RepoRoot "pack\config"
if (Test-Path $packCfg) {
    $destCfg = Join-Path $InstanceDir "config"
    New-Item -ItemType Directory -Force -Path $destCfg | Out-Null
    Copy-Item "$packCfg\*" $destCfg -Recurse -Force
    Say "applied pack config overrides"
}

# KubeJS scripts - the buried-tech gating lives here. Server scripts reload with
# /kubejs reload, so this is safe to re-copy over a live instance.
$packKube = Join-Path $RepoRoot "pack\kubejs"
if (Test-Path $packKube) {
    $destKube = Join-Path $InstanceDir "kubejs"
    New-Item -ItemType Directory -Force -Path $destKube | Out-Null

    # MIRROR, don't merge. Copy alone never removes a script deleted from the
    # repo, so a retired script keeps running forever - and a stale gating script
    # is worse than none, because it silently enforces rules nobody can find in
    # source. Only the fully repo-managed script directories are cleared;
    # anything KubeJS generates itself (exported/, config) is left alone.
    foreach ($sub in @("server_scripts", "startup_scripts", "client_scripts")) {
        $src = Join-Path $packKube $sub
        $dst = Join-Path $destKube $sub
        if ((Test-Path $src) -and (Test-Path $dst)) {
            Remove-Item "$dst\*" -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    Copy-Item "$packKube\*" $destKube -Recurse -Force
    Say "applied KubeJS scripts (mirrored - retired scripts removed)"
}

# World datapacks - the depth extension. These are read WHEN THE WORLD IS
# CREATED, so they must be in place before first generation. Copying them into
# an existing world does nothing for terrain that already generated.
$packData = Join-Path $RepoRoot "pack\datapacks"
if (Test-Path $packData) {
    $worldDir = Join-Path $InstanceDir "world"
    $destData = Join-Path $worldDir "datapacks"
    New-Item -ItemType Directory -Force -Path $destData | Out-Null
    Copy-Item "$packData\*" $destData -Recurse -Force
    $packNames = (Get-ChildItem $packData -Directory | Select-Object -ExpandProperty Name) -join ", "
    Say "installed world datapacks: $packNames"
    if (Test-Path (Join-Path $worldDir "level.dat")) {
        Warn "A world ALREADY EXISTS. Datapacks that change worldgen (the depth"
        Warn "extension) only affect chunks generated from now on - already-generated"
        Warn "terrain keeps the old shape, leaving a seam. Delete the world to apply"
        Warn "it cleanly."
    }
}

foreach ($f in @("ops.json", "whitelist.json")) {
    $dst = Join-Path $InstanceDir $f
    $src = Join-Path $srcCfg ($f -replace '\.json$', '.example.json')
    if ((-not (Test-Path $dst)) -and (Test-Path $src)) {
        Copy-Item $src $dst
        Warn "created $f from the example - PUT THE REAL UUIDs IN IT before first join"
    }
}

# --- 5. EULA ----------------------------------------------------------------
$eula = Join-Path $InstanceDir "eula.txt"
if ($AcceptEula) {
    "# Accepted via setup-server.ps1 -AcceptEula`neula=true" | Set-Content $eula -Encoding utf8
    Say "eula.txt written (you accepted)"
} elseif (-not (Test-Path $eula)) {
    Warn "eula.txt NOT written. The server will refuse to start until you accept."
    Warn "Read https://aka.ms/MinecraftEULA then re-run with -AcceptEula"
}

# --- 6. mods ----------------------------------------------------------------
if ($SkipMods) {
    Warn "skipping mod install (-SkipMods)"
} else {
    Say "installing mods (verified by sha512; ~1.7 GB on first run)"
    $py = (Get-Command python -ErrorAction SilentlyContinue)
    if (-not $py) { Die "python not found - needed to install mods from the manifest" }
    & python (Join-Path $RepoRoot "tools\install_mods.py") `
        --side server --dest (Join-Path $InstanceDir "mods") --cache $CacheDir --prune
    if ($LASTEXITCODE -ne 0) { Die "mod install reported failures - see above" }
}

Say "done"
Write-Host ""
Write-Host "Next:" -ForegroundColor Green
Write-Host "  1. Put real player UUIDs in $InstanceDir\whitelist.json and ops.json"
Write-Host "  2. Start it:  .\server\scripts\start.ps1"
Write-Host "  3. First boot generates ~400 mod configs and takes several minutes."
Write-Host "     It is not frozen. Watch logs\latest.log."
Write-Host ""
Write-Host "  RCON is enabled on port 25575 for the future DM harness." -ForegroundColor DarkGray
Write-Host "  Keep it bound to localhost - it is a plaintext protocol." -ForegroundColor DarkGray
