<#
.SYNOPSIS
  Build the player client pack.

.DESCRIPTION
  Produces a ready-to-drop instance folder for each player: the client-side mods
  (hash-verified), the shared configs, and a shaderpacks folder with instructions.

  Everyone must run the SAME pack. A mod mismatch on a both-sides mod is an
  instant connection refusal, and the error blames the mod rather than the
  mismatch - so this is generated from the same manifest as the server rather
  than assembled by hand.

.PARAMETER Dest
  Where to build the bundle. Default C:\MCServer\clientpack.

.PARAMETER Zip
  Also produce a .zip for sending to the other three players.
#>
[CmdletBinding()]
param(
    [string]$Dest = "C:\MCServer\clientpack",
    [string]$CacheDir = "C:\MCServer\cache",
    [switch]$Zip
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Say($m)  { Write-Host "==> $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "!!  $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "XX  $m" -ForegroundColor Red; exit 1 }

$packToml = Join-Path $RepoRoot "pack\pack.toml"
if (-not (Test-Path $packToml)) { Die "pack/pack.toml missing - run tools/gen_pack.py" }
$packText = Get-Content $packToml -Raw
$null = $packText -match 'neoforge\s*=\s*"([^"]+)"'; $NeoVersion = $Matches[1]
$null = $packText -match 'minecraft\s*=\s*"([^"]+)"'; $McVersion = $Matches[1]

Say "building client pack for Minecraft $McVersion / NeoForge $NeoVersion"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

# --- mods -------------------------------------------------------------------
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { Die "python not found - needed to install mods from the manifest" }
& python (Join-Path $RepoRoot "tools\install_mods.py") `
    --side client --dest (Join-Path $Dest "mods") --cache $CacheDir --prune
if ($LASTEXITCODE -ne 0) { Die "client mod install reported failures" }

# --- shared configs ---------------------------------------------------------
# Only configs that MUST match the server. Client-local preferences (video
# settings, keybinds) are deliberately left alone - four people on four machines
# should not share a render distance.
$packCfg = Join-Path $RepoRoot "pack\config"
if (Test-Path $packCfg) {
    $destCfg = Join-Path $Dest "config"
    New-Item -ItemType Directory -Force -Path $destCfg | Out-Null
    Copy-Item "$packCfg\*" $destCfg -Recurse -Force
    Say "copied shared configs"
}

# --- shaderpacks ------------------------------------------------------------
$shaders = Join-Path $Dest "shaderpacks"
New-Item -ItemType Directory -Force -Path $shaders | Out-Null
@"
Put shader .zip files in this folder, then select one in
Options > Video Settings > Shader Packs.

RECOMMENDED, in order:

1. Complementary Shaders - Unbound      https://modrinth.com/shader/complementary-unbound
   The pack ships Euphoria Patches, which is what gives Complementary its
   Distant Horizons support. Unbound's lighting is dramatic and dark, which
   suits a horror server; Reimagined is the softer, more stylised sibling.

2. Complementary Shaders - Reimagined   https://modrinth.com/shader/complementary-reimagined
   Same engine, gentler look, slightly cheaper.

3. MakeUp - Ultra Fast                  https://modrinth.com/shader/makeup-ultra-fast-shaders
   The fallback if frames are tight. Real shader lighting at a fraction of the cost.

NOT recommended here: Rethinking Voxels and Photon look extraordinary but are
very heavy, and you are rendering next to a dedicated server on the same machine.

DISTANT HORIZONS + SHADERS is the fragile combination in this pack. If the world
flickers, tears at the LOD boundary, or the game hangs on shader reload:
  - confirm Euphoria Patches is installed (it is, in this pack)
  - in Distant Horizons settings, try lowering LOD quality before blaming shaders
  - as a last resort turn shaders off; Distant Horizons alone still transforms
    how the world reads
"@ | Set-Content (Join-Path $shaders "README.txt") -Encoding utf8

# --- notes ------------------------------------------------------------------
$modCount = (Get-ChildItem (Join-Path $Dest "mods") -Filter *.jar).Count
@"
CLIENT PACK - Minecraft $McVersion / NeoForge $NeoVersion
$modCount mods

SETUP
  1. Install NeoForge $NeoVersion for Minecraft $McVersion.
     Easiest route is Prism Launcher: create an instance, Edit > Version >
     Install NeoForge, pick $NeoVersion.
  2. Copy the 'mods', 'config' and 'shaderpacks' folders from this bundle into
     the instance folder, replacing what is there.
  3. Allocate 8 GB to the instance. Not more - Minecraft clients gain nothing
     past ~8 GB and garbage-collection pauses get longer.
  4. Launch once before joining, so ~380 mods can generate their configs.

EVERYONE MUST RUN THE SAME PACK. A single missing both-sides mod is an instant
connection refusal, and the error message blames the mod rather than the
mismatch.

FIRST-RUN SETTINGS THAT MATTER
  Render distance          8-12 chunks. Deliberately LOW - Distant Horizons
                           draws everything beyond it far more cheaply. This is
                           the single biggest framerate lever in the pack.
  Distant Horizons         Set its own distance high (64-128). That is the point.
  Simulation distance      Leave at the server's value; the client cannot exceed it.
  Sound Physics            On. It is what makes caves echo, and it applies to
                           voice chat too, not just world sounds.
  Simple Voice Chat        Set your microphone in its settings before the first
                           session, not during one.
"@ | Set-Content (Join-Path $Dest "README.txt") -Encoding utf8

Say "client pack built: $modCount mods -> $Dest"

if ($Zip) {
    $zipPath = "$Dest.zip"
    Say "zipping (this takes a minute at ~1.5 GB)"
    Compress-Archive -Path "$Dest\*" -DestinationPath $zipPath -CompressionLevel Optimal -Force
    Say "wrote $zipPath ($([math]::Round((Get-Item $zipPath).Length/1MB,0)) MB)"
}

Write-Host ""
Write-Host "Send the folder (or -Zip archive) to the other three players." -ForegroundColor Green
Write-Host "They need NeoForge $NeoVersion and 8 GB allocated." -ForegroundColor Green
