#!/usr/bin/env bash
# Start the server. Thin wrapper over NeoForge's generated run.sh that fails
# with a useful message instead of a Java stack trace.
#
#   ./start.sh
#   ./start.sh --instance /srv/mc/instance
#
# Recommended on the dedicated box: run this under systemd or inside tmux, so
# the console stays reachable for `stop`, `save-all` and `spark profiler`.

set -euo pipefail

INSTANCE_DIR="${MC_INSTANCE:-/srv/mc/instance}"
[[ "${1:-}" == "--instance" ]] && { INSTANCE_DIR="$2"; shift 2; }

die() { printf '\033[31mXX  %s\033[0m\n' "$*" >&2; exit 1; }

[[ -d "$INSTANCE_DIR" ]] || die "no instance at $INSTANCE_DIR - run setup-server.sh first"
grep -qE '^eula\s*=\s*true' "$INSTANCE_DIR/eula.txt" 2>/dev/null \
  || die "EULA not accepted. Read https://aka.ms/MinecraftEULA then run setup-server.sh --accept-eula"
[[ -f "$INSTANCE_DIR/run.sh" ]] || die "run.sh missing - the NeoForge install did not complete"

MOD_COUNT="$(find "$INSTANCE_DIR/mods" -maxdepth 1 -name '*.jar' 2>/dev/null | wc -l)"
if (( MOD_COUNT < 300 )); then
  printf '\033[33m!!  only %s mods present; expected ~357 server-side. Re-run setup-server.sh.\033[0m\n' "$MOD_COUNT"
fi

printf '\033[36m==> starting server (%s mods) from %s\033[0m\n' "$MOD_COUNT" "$INSTANCE_DIR"
echo "    Stop with the 'stop' console command, never SIGKILL - that skips the world save."
echo

chmod +x "$INSTANCE_DIR/run.sh" 2>/dev/null || true
cd "$INSTANCE_DIR"
exec ./run.sh nogui
