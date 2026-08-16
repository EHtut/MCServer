"""logq - read the server log honestly, and turn it into events.

TWO JOBS

1. **Answer questions about the log** without the traps that made me draw three
   wrong conclusions in one night.
2. **Ingest** it into the telemetry sink defined in docs/14-TELEMETRY-SEAM.md,
   normalising both the `[CC-TELEMETRY]` lines KubeJS prints and the vanilla
   events the log already carries.

THE TRAP THIS TOOL EXISTS TO REMOVE

`latest.log` contains binary bytes. `grep` therefore treats it as a binary file
and prints *nothing at all* rather than matching, and a naive text read raises.
Three separate times I concluded "the server did not boot" from a search that
could not have matched. Everything here reads with `errors="replace"`.

The second trap: `Done (` from the PREVIOUS boot is still in the file. A wait
loop that greps for it exits instantly and reports success for a server that
never started. Boot detection here is timestamp-aware.

WHY IT ALSO PARSES VANILLA EVENTS, redundantly with KubeJS

* it works **retroactively** - the rotated `.log.gz` archives hold sessions
  already played, so some history can be recovered instead of lost
* it keeps producing when a KubeJS script breaks, which has happened three times
* deaths, joins and advancements only exist in the log anyway

USAGE

    python tools/logq.py boot                 did it boot, when, how long
    python tools/logq.py errors [--since H]   real errors, minus the known noise
    python tools/logq.py grep <pattern>       search that cannot silently fail
    python tools/logq.py deaths               player deaths, parsed
    python tools/logq.py ingest [--all]       -> the telemetry sink
    python tools/logq.py events [--type T]    read the sink back
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import pathlib
import re
import sys
from datetime import datetime

LOGS = pathlib.Path(r"C:\MCServer\instance\logs")
SINK = pathlib.Path(r"C:\MCServer\telemetry")
STATE = SINK / ".ingest-state.json"

MARK = "[CC-TELEMETRY]"
SCHEMA_V = 1

# [02Aug2026 15:41:25.963] [Server thread/INFO] [logger/]: message
LINE = re.compile(
    r"^\[(?P<d>\d{2})(?P<mon>[A-Za-z]{3})(?P<y>\d{4}) (?P<t>\d{2}:\d{2}:\d{2})\.\d+\]"
    r"\s*\[(?P<thread>[^\]]*)\]\s*\[(?P<logger>[^\]]*)\]:\s*(?P<msg>.*)$")
MONTHS = {m: i for i, m in enumerate(
    "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), 1)}

# Player deaths come from the MinecraftServer logger. Mob deaths come from
# LivingEntity as "Named entity InfectedPlayer[...] died: ...", and Spore's
# InfectedPlayer mobs are NAMED AFTER REAL USERNAMES - so matching the death
# text alone would record hundreds of deaths for players who never logged in.
# The logger is the discriminator, not the wording.
DEATH_LOGGER = "net.minecraft.server.MinecraftServer/"
DEATH_VERBS = re.compile(
    r"^(?P<who>\w{3,16}) (?:was |tried |fell |drowned|burned|starved|died|suffocated|"
    r"blew up|hit the ground|went off|withered|froze|discovered|walked into|"
    r"experienced|didn't want to live|got |left the confines)")

JOIN = re.compile(r"^(\w{3,16}) joined the game$")
LEAVE = re.compile(r"^(\w{3,16}) left the game$")
ADVANCEMENT = re.compile(r"^(\w{3,16}) has made the advancement \[(.+)\]$")
LOGGED_IN = re.compile(r"^(\w{3,16})\[/[\d.:]+\] logged in with entity id \d+ at \(([-\d.]+), ([-\d.]+), ([-\d.]+)\)")

# Noise that is expected and would drown a real error.
NOISE = re.compile(
    r"(?i)VersionChecker|update information|HttpConnect|Failed to process update|"
    r"Reference map|refmap|mixin.*could not be read|Epic Fight web server|"
    r"unknown or non-serializable data attachment|Recoverable errors when loading|"
    r"using default\)|Ignoring unknown attribute|custom color set definition")

# 🚨 KUBEJS DOES NOT LOG SCRIPT ERRORS AT ERROR LEVEL.
#
# It logs them under `KubeJS Server/` with no level at all, so the `/ERROR` test
# below skipped every one of them. `logq errors` printed "0 real error(s)" while
# deep_speaker.js was dying on `ReferenceError: "event" is not defined` and the
# confession never armed — the boot log said the Speaker was live because the line
# BEFORE the throw had already printed.
#
# That is the whole failure mode this tool was written to prevent, in the tool
# itself: a search that could not have matched, reported as a clean result. Any
# line carrying a script-failure signature is now a real error whatever level it
# claims, and it is labelled so it cannot be mistaken for a Java stack trace.
SCRIPT_ERR = re.compile(
    r"Error in '|EcmaError|ReferenceError|TypeError:|SyntaxError|"
    r"Failed to load script|is not a function|Error loading KubeJS|"
    r"\.js#\d+:.*[Ee]rror")


def read_text(p: pathlib.Path) -> str:
    """errors='replace' ALWAYS. The log has binary bytes in it."""
    try:
        if p.suffix == ".gz":
            with gzip.open(p, "rt", encoding="utf-8", errors="replace") as f:
                return f.read()
        return p.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        print(f"  !! could not read {p.name}: {e}", file=sys.stderr)
        return ""


def log_files(all_logs: bool) -> list[pathlib.Path]:
    if not LOGS.is_dir():
        return []
    cur = [LOGS / "latest.log"] if (LOGS / "latest.log").is_file() else []
    if not all_logs:
        return cur
    # ONLY the rotated server logs: YYYY-MM-DD-N.log.gz.
    #
    # `*.log.gz` also matches debug-N.log.gz, and debug.log is a SUPERSET of
    # latest.log - same lines, plus DEBUG/TRACE. Including it double-counts
    # every event that is in both, which is exactly how one death showed up
    # twice in the sink. It was not the dual-source redundancy I first assumed;
    # `grep --all` proved it by naming both files.
    arch = sorted(p for p in LOGS.glob("*.log.gz")
                  if re.match(r"^\d{4}-\d{2}-\d{2}-\d+\.log\.gz$", p.name))
    return arch + cur


def parsed_lines(p: pathlib.Path):
    for n, raw in enumerate(read_text(p).splitlines(), 1):
        m = LINE.match(raw)
        if not m:
            continue
        ts = datetime(int(m["y"]), MONTHS.get(m["mon"], 1), int(m["d"]),
                      *(int(x) for x in m["t"].split(":")))
        yield n, ts, m["logger"], m["msg"], raw


# --------------------------------------------------------------------------
# question answering
# --------------------------------------------------------------------------

def cmd_boot(all_logs: bool) -> int:
    boots = []
    for p in log_files(all_logs):
        for _n, ts, _lg, msg, _raw in parsed_lines(p):
            if msg.startswith("Done ("):
                boots.append((ts, msg.split("Done (")[1].split(")")[0], p.name))
    if not boots:
        print("  no completed boot in the log(s) searched")
        print("  NOTE: that is 'not found', not 'did not boot'. A boot in progress")
        print("        has not written this line yet.")
        return 1
    for ts, took, src in boots[-5:]:
        print(f"  {ts:%Y-%m-%d %H:%M:%S}  booted in {took:<10} [{src}]")
    print(f"\n  {len(boots)} boot(s) found. The LAST one is the current server.")
    return 0


def cmd_errors(all_logs: bool, since_hours: float | None) -> int:
    now = datetime.now()
    n = scripts = 0
    for p in log_files(all_logs):
        for _ln, ts, logger, msg, _raw in parsed_lines(p):
            # A script error counts REGARDLESS of the level it claims - see the
            # SCRIPT_ERR note. Levelled errors still count the old way.
            is_script = bool(SCRIPT_ERR.search(msg))
            if not is_script and "/ERROR" not in logger and "/FATAL" not in logger:
                continue
            if NOISE.search(msg):
                continue
            if since_hours and (now - ts).total_seconds() > since_hours * 3600:
                continue
            mark = " SCRIPT " if is_script else ""
            print(f"  {ts:%H:%M:%S}{mark}[{logger.split('/')[0][:26]:<26}] {msg[:110]}")
            n += 1
            scripts += is_script
    print(f"\n  {n} real error(s)" + (f" in the last {since_hours}h" if since_hours else "")
          + (f", {scripts} of them SCRIPT errors" if scripts else ""))
    if n == 0:
        print("  (known noise is filtered: version checks, mixin refmaps, removed-mod")
        print("   attachments, recoverable chunk errors. Use `grep` to see everything.)")
        print("   KubeJS script errors ARE included - they log without a level.")
    return 0


def cmd_grep(pattern: str, all_logs: bool) -> int:
    rx = re.compile(pattern, re.I)
    n = 0
    for p in log_files(all_logs):
        for ln, ts, _lg, msg, raw in parsed_lines(p):
            if rx.search(raw):
                print(f"  {p.name}:{ln} {ts:%H:%M:%S} {msg[:130]}")
                n += 1
    print(f"\n  {n} match(es) for /{pattern}/ across {len(log_files(all_logs))} file(s)")
    if n == 0:
        print("  NOTE: zero matches is 'this search found nothing'. It is NOT proof")
        print("        of absence - check the pattern can match before concluding.")
    return 0


def cmd_deaths(all_logs: bool) -> int:
    n = 0
    for ev in collapse_dual_source(list(harvest(all_logs))):
        if ev["type"] != "player.death":
            continue
        d = ev["data"]
        print(f"  {ev['ts'][:19]}  {ev['player']:<14} {d.get('message','')[:80]}")
        n += 1
    print(f"\n  {n} player death(s)")
    return 0


# --------------------------------------------------------------------------
# ingest
# --------------------------------------------------------------------------

def harvest(all_logs: bool):
    """Every event the log can yield, normalised. Order preserved."""
    known_players: set[str] = set()
    for p in log_files(all_logs):
        for _ln, ts, logger, msg, _raw in parsed_lines(p):
            iso = ts.astimezone().isoformat(timespec="seconds")

            # 1. KubeJS telemetry - already schema-shaped, just normalise numbers
            if MARK in msg:
                try:
                    ev = json.loads(msg.split(MARK, 1)[1].strip())
                except Exception:
                    continue
                ev["ts"] = iso
                ev["src"] = "kubejs"
                yield normalise(ev)
                continue

            # 2. vanilla events
            m = LOGGED_IN.match(msg)
            if m:
                known_players.add(m.group(1))
                continue

            m = JOIN.match(msg)
            if m:
                known_players.add(m.group(1))
                yield {"ts": iso, "v": SCHEMA_V, "type": "player.join",
                       "player": m.group(1), "src": "log", "data": {}}
                continue

            m = LEAVE.match(msg)
            if m:
                yield {"ts": iso, "v": SCHEMA_V, "type": "player.leave",
                       "player": m.group(1), "src": "log", "data": {}}
                continue

            m = ADVANCEMENT.match(msg)
            if m:
                yield {"ts": iso, "v": SCHEMA_V, "type": "player.advancement",
                       "player": m.group(1), "src": "log", "data": {"id": m.group(2)}}
                continue

            if DEATH_LOGGER in logger:
                m = DEATH_VERBS.match(msg)
                # The logger check alone is not enough: only accept names we have
                # actually seen log in. Spore's InfectedPlayer mobs carry real
                # usernames, and a death line for someone who never joined is a mob.
                if m and m.group("who") in known_players:
                    yield {"ts": iso, "v": SCHEMA_V, "type": "player.death",
                           "player": m.group("who"), "src": "log",
                           "data": {"message": msg}}


def normalise(ev: dict) -> dict:
    """Rhino has no integer type, so KubeJS emits v:1.0 and y:66.0.

    Normalising is this tool's job by design - the alternative is fighting
    JSON.stringify inside Rhino, which cannot be won.
    """
    def fix(x):
        if isinstance(x, float) and x.is_integer():
            return int(x)
        if isinstance(x, dict):
            return {k: fix(v) for k, v in x.items()}
        if isinstance(x, list):
            return [fix(v) for v in x]
        return x
    return fix(ev)


# KubeJS and the log BOTH see deaths, joins and leaves. That redundancy is
# deliberate - the log keeps producing when a script breaks - but it must not
# reach the sink as two events, or the store double-counts every death.
#
# Found by reading the output, not the code: the same death appeared twice,
# once per source, and the content hashes differed because the payloads do.
DUAL_SOURCE = {"player.death", "player.join", "player.leave"}
DUAL_WINDOW = 5          # seconds


def collapse_dual_source(events: list[dict]) -> list[dict]:
    """Drop the log's copy where KubeJS reported the same thing.

    KubeJS wins: its payload carries coordinates, dimension, biome and the
    killer's entity id. The log version has only the death message, and exists
    for the case where the script is broken or was not yet installed.
    """
    kube = {}
    for ev in events:
        if ev.get("src") == "kubejs" and ev.get("type") in DUAL_SOURCE:
            kube.setdefault((ev["type"], ev.get("player")), []).append(ev["ts"])

    out, dropped = [], 0
    for ev in events:
        if ev.get("src") == "log" and ev.get("type") in DUAL_SOURCE:
            stamps = kube.get((ev["type"], ev.get("player")), [])
            if any(abs((datetime.fromisoformat(ev["ts"])
                        - datetime.fromisoformat(t)).total_seconds()) <= DUAL_WINDOW
                   for t in stamps):
                dropped += 1
                continue
        out.append(ev)
    if dropped:
        print(f"  collapsed {dropped} duplicate(s) where KubeJS already reported it")
    return out


def event_key(ev: dict) -> str:
    return hashlib.sha1(
        json.dumps([ev.get("ts"), ev.get("type"), ev.get("player"), ev.get("data")],
                   sort_keys=True).encode()).hexdigest()[:16]


def cmd_ingest(all_logs: bool) -> int:
    SINK.mkdir(parents=True, exist_ok=True)
    seen: set[str] = set()
    if STATE.is_file():
        try:
            seen = set(json.loads(STATE.read_text(encoding="utf-8")).get("seen", []))
        except Exception:
            pass

    written = 0
    by_day: dict[str, list[str]] = {}
    for ev in collapse_dual_source(list(harvest(all_logs))):
        k = event_key(ev)
        if k in seen:
            continue
        seen.add(k)
        by_day.setdefault(ev["ts"][:10], []).append(json.dumps(ev, separators=(",", ":")))
        written += 1

    for day, lines in sorted(by_day.items()):
        f = SINK / f"events-{day}.jsonl"
        with f.open("a", encoding="utf-8", newline="\n") as fh:
            fh.write("\n".join(lines) + "\n")
        print(f"  {f.name:<28} +{len(lines)}")

    # Bounded: the key set is only for de-duplication across runs, and the log
    # itself is the source of truth, so old keys can age out safely.
    STATE.write_text(json.dumps({"seen": sorted(seen)[-200000:]}), encoding="utf-8")
    print(f"\n  {written} new event(s) -> {SINK}")
    if written == 0:
        print("  (nothing new - already ingested, or the log has no events yet)")
    return 0


def cmd_events(etype: str | None, player: str | None) -> int:
    if not SINK.is_dir():
        print(f"  no sink at {SINK} - run `ingest` first")
        return 1
    n = 0
    for f in sorted(SINK.glob("events-*.jsonl")):
        for line in f.read_text(encoding="utf-8", errors="replace").splitlines():
            if not line.strip():
                continue
            try:
                ev = json.loads(line)
            except Exception:
                continue
            if etype and not ev.get("type", "").startswith(etype):
                continue
            if player and ev.get("player") != player:
                continue
            print(f"  {ev['ts'][:19]}  {ev['type']:<20} {str(ev.get('player')):<12} "
                  f"{json.dumps(ev.get('data'))[:80]}")
            n += 1
    print(f"\n  {n} event(s)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["boot", "errors", "grep", "deaths", "ingest", "events"])
    ap.add_argument("pattern", nargs="?")
    ap.add_argument("--all", action="store_true", help="include rotated .log.gz archives")
    ap.add_argument("--since", type=float, help="errors: only the last N hours")
    ap.add_argument("--type", help="events: filter by type prefix")
    ap.add_argument("--player", help="events: filter by player")
    a = ap.parse_args()

    if a.command == "boot":    return cmd_boot(a.all)
    if a.command == "errors":  return cmd_errors(a.all, a.since)
    if a.command == "grep":
        if not a.pattern:
            print("  grep needs a pattern"); return 1
        return cmd_grep(a.pattern, a.all)
    if a.command == "deaths":  return cmd_deaths(a.all)
    if a.command == "ingest":  return cmd_ingest(a.all)
    if a.command == "events":  return cmd_events(a.type, a.player)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
