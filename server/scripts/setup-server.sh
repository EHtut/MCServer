#!/usr/bin/env bash
# Build a runnable server instance from this repo. Linux/macOS counterpart of
# setup-server.ps1 - same contract, same layout, so the instance the dedicated
# box runs is the one this repo describes.
#
#   ./setup-server.sh --accept-eula
#   ./setup-server.sh --instance /srv/mc/instance --accept-eula
#
# Idempotent. Never touches the world directory.

set -euo pipefail

INSTANCE_DIR="${MC_INSTANCE:-/srv/mc/instance}"
CACHE_DIR="${MC_CACHE:-/srv/mc/cache}"
ACCEPT_EULA=0
SKIP_MODS=0

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

say()  { printf '\033[36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[33m!!  %s\033[0m\n' "$*"; }
die()  { printf '\033[31mXX  %s\033[0m\n' "$*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --instance)    INSTANCE_DIR="$2"; shift 2 ;;
    --cache)       CACHE_DIR="$2";    shift 2 ;;
    --accept-eula) ACCEPT_EULA=1;     shift ;;
    --skip-mods)   SKIP_MODS=1;       shift ;;
    -h|--help)     sed -n '2,12p' "$0"; exit 0 ;;
    *)             die "unknown argument: $1" ;;
  esac
done

say "repo:     $REPO_ROOT"
say "instance: $INSTANCE_DIR"

# --- 1. Java 21 -------------------------------------------------------------
say "checking Java"
JAVA_BIN="${JAVA_HOME:+$JAVA_HOME/bin/java}"
JAVA_BIN="${JAVA_BIN:-java}"
command -v "$JAVA_BIN" >/dev/null 2>&1 || die "no java on PATH"
JAVA_MAJOR="$("$JAVA_BIN" -version 2>&1 | head -1 | sed -E 's/.*"([0-9]+).*/\1/')"
[[ "$JAVA_MAJOR" =~ ^[0-9]+$ ]] || die "could not parse java version"
if (( JAVA_MAJOR < 21 )); then
  die "Java $JAVA_MAJOR found; Minecraft 1.21.1 requires Java 21+.
  Debian/Ubuntu:  sudo apt install openjdk-21-jre-headless
  Fedora/RHEL:    sudo dnf install java-21-openjdk-headless"
fi
say "using $JAVA_BIN (Java $JAVA_MAJOR)"

# --- 2. versions from the manifest ------------------------------------------
PACK_TOML="$REPO_ROOT/pack/pack.toml"
[[ -f "$PACK_TOML" ]] || die "pack/pack.toml missing - run tools/gen_pack.py"
NEO_VERSION="$(sed -nE 's/^neoforge[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/p'  "$PACK_TOML")"
MC_VERSION="$( sed -nE 's/^minecraft[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/p' "$PACK_TOML")"
[[ -n "$NEO_VERSION" ]] || die "no neoforge version in pack.toml"
say "minecraft $MC_VERSION / neoforge $NEO_VERSION"

mkdir -p "$INSTANCE_DIR" "$CACHE_DIR"

# --- 3. NeoForge ------------------------------------------------------------
INSTALLER="$CACHE_DIR/neoforge-$NEO_VERSION-installer.jar"
MARKER="$INSTANCE_DIR/.neoforge-$NEO_VERSION.installed"

if [[ -f "$MARKER" ]]; then
  say "NeoForge $NEO_VERSION already installed"
else
  if [[ ! -f "$INSTALLER" ]]; then
    URL="https://maven.neoforged.net/releases/net/neoforged/neoforge/$NEO_VERSION/neoforge-$NEO_VERSION-installer.jar"
    say "downloading NeoForge installer"
    echo "    $URL"
    if command -v curl >/dev/null 2>&1; then curl -fSL -o "$INSTALLER" "$URL"
    else wget -O "$INSTALLER" "$URL"; fi
  fi
  say "installing NeoForge server"
  ( cd "$INSTANCE_DIR" && "$JAVA_BIN" -jar "$INSTALLER" --installServer "$INSTANCE_DIR" )
  touch "$MARKER"
fi

# --- 4. configuration -------------------------------------------------------
say "writing configuration"
SRC_CFG="$REPO_ROOT/server/config"
cp -f "$SRC_CFG/user_jvm_args.txt" "$INSTANCE_DIR/"

# Preserve an existing RCON password instead of rotating it every run.
RCON_PW=""
if [[ -f "$INSTANCE_DIR/server.properties" ]]; then
  RCON_PW="$(sed -nE 's/^rcon\.password=(.*)$/\1/p' "$INSTANCE_DIR/server.properties" || true)"
  [[ "$RCON_PW" == "CHANGE_ME_AT_SETUP" ]] && RCON_PW=""
fi
if [[ -z "$RCON_PW" ]]; then
  RCON_PW="$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32)"
  say "generated a new RCON password (instance only, never committed)"
fi
sed "s|rcon.password=CHANGE_ME_AT_SETUP|rcon.password=$RCON_PW|" \
    "$SRC_CFG/server.properties" > "$INSTANCE_DIR/server.properties"

if [[ -d "$REPO_ROOT/pack/config" ]]; then
  mkdir -p "$INSTANCE_DIR/config"
  cp -rf "$REPO_ROOT/pack/config/." "$INSTANCE_DIR/config/"
  say "applied pack config overrides"
fi

for f in ops whitelist; do
  if [[ ! -f "$INSTANCE_DIR/$f.json" && -f "$SRC_CFG/$f.example.json" ]]; then
    cp "$SRC_CFG/$f.example.json" "$INSTANCE_DIR/$f.json"
    warn "created $f.json from the example - PUT THE REAL UUIDs IN IT before first join"
  fi
done

# --- 5. EULA ----------------------------------------------------------------
if (( ACCEPT_EULA )); then
  printf '# Accepted via setup-server.sh --accept-eula\neula=true\n' > "$INSTANCE_DIR/eula.txt"
  say "eula.txt written (you accepted)"
elif [[ ! -f "$INSTANCE_DIR/eula.txt" ]]; then
  warn "eula.txt NOT written; the server will refuse to start."
  warn "Read https://aka.ms/MinecraftEULA then re-run with --accept-eula"
fi

# --- 6. mods ----------------------------------------------------------------
if (( SKIP_MODS )); then
  warn "skipping mod install (--skip-mods)"
else
  say "installing mods (verified by sha512; ~1.7 GB on first run)"
  PY="$(command -v python3 || command -v python)" || die "python3 required to install mods"
  "$PY" "$REPO_ROOT/tools/install_mods.py" \
      --side server --dest "$INSTANCE_DIR/mods" --cache "$CACHE_DIR" --prune
fi

say "done"
cat <<EOF

Next:
  1. Put real player UUIDs in $INSTANCE_DIR/whitelist.json and ops.json
  2. Start it:  ./server/scripts/start.sh --instance "$INSTANCE_DIR"
  3. First boot generates ~400 mod configs and takes several minutes.
     It is not frozen. Watch logs/latest.log.

  RCON is enabled on 25575 for the future DM harness. Keep it firewalled to
  localhost - it is a plaintext protocol.
EOF
