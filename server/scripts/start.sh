#!/usr/bin/env bash
# Start the server.
#
#   ./start.sh
#   ./start.sh --instance /srv/mc/instance
#
# Invokes Java directly rather than shelling through NeoForge's generated
# run.sh, for the same two reasons as the PowerShell version:
#
#   1. run.sh calls bare `java`, taking whatever is first on PATH. On a box with
#      an older JRE installed that is the wrong Java, and the server dies with
#      UnsupportedClassVersionError - an error that reads like a mod problem and
#      is not one.
#   2. It makes the launch identical under systemd, tmux and a bare shell.
#
# Recommended on the dedicated box: run under systemd or inside tmux, so the
# console stays reachable for `stop`, `save-all` and `spark profiler`.

set -euo pipefail

INSTANCE_DIR="${MC_INSTANCE:-/srv/mc/instance}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GUI=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --instance) INSTANCE_DIR="$2"; shift 2 ;;
    --gui)      GUI=1; shift ;;
    -h|--help)  sed -n '2,18p' "$0"; exit 0 ;;
    *)          echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

die() { printf '\033[31mXX  %s\033[0m\n' "$*" >&2; exit 1; }

[[ -d "$INSTANCE_DIR" ]] || die "no instance at $INSTANCE_DIR - run setup-server.sh first"
grep -qE '^eula\s*=\s*true' "$INSTANCE_DIR/eula.txt" 2>/dev/null \
  || die "EULA not accepted. Read https://aka.ms/MinecraftEULA then run setup-server.sh --accept-eula"

# --- find a Java 21+ ---------------------------------------------------------
find_java21() {
  local candidates=()
  [[ -n "${JAVA_HOME:-}" ]] && candidates+=("$JAVA_HOME/bin/java")
  for d in /usr/lib/jvm/*/bin/java /opt/java/*/bin/java /usr/local/lib/jvm/*/bin/java; do
    [[ -x "$d" ]] && candidates+=("$d")
  done
  command -v java >/dev/null 2>&1 && candidates+=("$(command -v java)")

  for c in "${candidates[@]}"; do
    [[ -x "$c" ]] || continue
    local major
    major="$("$c" -version 2>&1 | head -1 | sed -E 's/.*"([0-9]+).*/\1/')"
    [[ "$major" =~ ^[0-9]+$ ]] || continue
    (( major >= 21 )) && { echo "$c"; return 0; }
  done
  return 1
}

JAVA_BIN="$(find_java21)" || die "No Java 21+ found. Minecraft 1.21.1 requires it.
  Debian/Ubuntu:  sudo apt install openjdk-21-jre-headless
  Fedora/RHEL:    sudo dnf install java-21-openjdk-headless
Having an older Java on PATH is fine - this script looks past it."

# --- NeoForge's own argument file --------------------------------------------
ARGS_FILE=""
if [[ -f "$REPO_ROOT/pack/pack.toml" ]]; then
  NEO="$(sed -nE 's/^neoforge[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/p' "$REPO_ROOT/pack/pack.toml")"
  [[ -n "$NEO" && -f "$INSTANCE_DIR/libraries/net/neoforged/neoforge/$NEO/unix_args.txt" ]] \
    && ARGS_FILE="$INSTANCE_DIR/libraries/net/neoforged/neoforge/$NEO/unix_args.txt"
fi
if [[ -z "$ARGS_FILE" ]]; then
  ARGS_FILE="$(find "$INSTANCE_DIR/libraries/net/neoforged/neoforge" -name unix_args.txt 2>/dev/null | head -1)"
fi
[[ -n "$ARGS_FILE" ]] || die "NeoForge argument file not found - the install did not complete"
[[ -f "$INSTANCE_DIR/user_jvm_args.txt" ]] || die "user_jvm_args.txt missing - re-run setup-server.sh"

MOD_COUNT="$(find "$INSTANCE_DIR/mods" -maxdepth 1 -name '*.jar' 2>/dev/null | wc -l)"
(( MOD_COUNT < 300 )) && printf '\033[33m!!  only %s mods present; expected ~351 server-side.\033[0m\n' "$MOD_COUNT"

printf '\033[36m==> java:     %s\033[0m\n' "$JAVA_BIN"
printf '\033[36m==> instance: %s (%s mods)\033[0m\n' "$INSTANCE_DIR" "$MOD_COUNT"
echo "    Stop with the 'stop' console command, never SIGKILL - that skips the world save."
echo

cd "$INSTANCE_DIR"
if (( GUI )); then
  exec "$JAVA_BIN" "@user_jvm_args.txt" "@$ARGS_FILE"
else
  exec "$JAVA_BIN" "@user_jvm_args.txt" "@$ARGS_FILE" nogui
fi
