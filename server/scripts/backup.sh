#!/usr/bin/env bash
# Back up the world plus the configs that make it restorable.
#
#   ./backup.sh
#   ./backup.sh --instance /srv/mc/instance --dest /srv/mc/backups
#   ./backup.sh --live            # flush saves over RCON first, no downtime
#
# A world folder without the 400 mod configs that generated it is half a
# backup, so config/, kubejs/, ops, whitelist and server.properties come too.
#
# Retention is generational: everything from the last 2 days, one per day for
# 14 days, one per week beyond. Backups matter most exactly when you notice the
# problem late.

set -euo pipefail

INSTANCE_DIR="${MC_INSTANCE:-/srv/mc/instance}"
DEST_DIR="${MC_BACKUPS:-/srv/mc/backups}"
LIVE=0

say()  { printf '\033[36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[33m!!  %s\033[0m\n' "$*"; }
die()  { printf '\033[31mXX  %s\033[0m\n' "$*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --instance) INSTANCE_DIR="$2"; shift 2 ;;
    --dest)     DEST_DIR="$2";     shift 2 ;;
    --live)     LIVE=1;            shift ;;
    -h|--help)  sed -n '2,16p' "$0"; exit 0 ;;
    *)          die "unknown argument: $1" ;;
  esac
done

[[ -d "$INSTANCE_DIR" ]] || die "no instance at $INSTANCE_DIR"
mkdir -p "$DEST_DIR"

# --- quiesce ----------------------------------------------------------------
# Copying region files mid-write yields an archive that looks fine and restores
# broken. With --live we ask the server to flush and hold writes; without it we
# refuse to run against a live server at all.
RCON_DONE=0
if (( LIVE )); then
  if command -v mcrcon >/dev/null 2>&1; then
    PW="$(sed -nE 's/^rcon\.password=(.*)$/\1/p' "$INSTANCE_DIR/server.properties")"
    PORT="$(sed -nE 's/^rcon\.port=(.*)$/\1/p' "$INSTANCE_DIR/server.properties")"
    say "flushing saves over RCON"
    mcrcon -H 127.0.0.1 -P "${PORT:-25575}" -p "$PW" "save-off" "save-all flush" >/dev/null
    RCON_DONE=1
    trap 'mcrcon -H 127.0.0.1 -P "${PORT:-25575}" -p "$PW" "save-on" >/dev/null 2>&1 || true' EXIT
  else
    die "--live needs mcrcon installed, or the backup can silently capture a torn save"
  fi
elif pgrep -f "$INSTANCE_DIR" >/dev/null 2>&1; then
  die "server appears to be RUNNING.
Either stop it, or use --live (requires mcrcon) to flush saves first.
Manual equivalent in the console: save-off / save-all flush / ... / save-on"
fi

STAMP="$(date +%Y-%m-%d_%H%M%S)"
ARCHIVE="$DEST_DIR/world-$STAMP.tar.zst"
COMPRESS=(zstd -T0 -19 --long)
if ! command -v zstd >/dev/null 2>&1; then
  ARCHIVE="$DEST_DIR/world-$STAMP.tar.gz"
  COMPRESS=(gzip -6)
  warn "zstd not found; falling back to gzip (bigger and slower)"
fi

ITEMS=()
for n in world world_nether world_the_end config kubejs \
         server.properties ops.json whitelist.json usercache.json; do
  [[ -e "$INSTANCE_DIR/$n" ]] && ITEMS+=("$n")
done
(( ${#ITEMS[@]} )) || die "nothing to back up in $INSTANCE_DIR"

say "archiving ${#ITEMS[@]} item(s) -> $ARCHIVE"
tar -C "$INSTANCE_DIR" -cf - "${ITEMS[@]}" | "${COMPRESS[@]}" > "$ARCHIVE"
(( RCON_DONE )) && say "saves re-enabled"

say "wrote $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# --- generational retention -------------------------------------------------
NOW=$(date +%s)
declare -A SEEN_DAY SEEN_WEEK
while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  MTIME=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f")
  AGE_DAYS=$(( (NOW - MTIME) / 86400 ))
  if   (( AGE_DAYS <= 2 ));  then continue
  elif (( AGE_DAYS <= 14 )); then
    KEY="$(date -d "@$MTIME" +%Y-%m-%d 2>/dev/null || date -r "$MTIME" +%Y-%m-%d)"
    [[ -z "${SEEN_DAY[$KEY]:-}" ]] && { SEEN_DAY[$KEY]=1; continue; }
  else
    KEY="$(date -d "@$MTIME" +%Y-%V 2>/dev/null || date -r "$MTIME" +%Y-%V)"
    [[ -z "${SEEN_WEEK[$KEY]:-}" ]] && { SEEN_WEEK[$KEY]=1; continue; }
  fi
  echo "    pruning $(basename "$f")"
  rm -f "$f"
done < <(ls -1t "$DEST_DIR"/world-*.tar.* 2>/dev/null || true)

COUNT=$(ls -1 "$DEST_DIR"/world-*.tar.* 2>/dev/null | wc -l)
say "$COUNT backup(s) retained, $(du -sh "$DEST_DIR" | cut -f1) total"
