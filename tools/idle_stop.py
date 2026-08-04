#!/usr/bin/env python3
"""idle_stop - stop the server once nobody has been on for a while.

WHY THIS EXISTS, AND WHY IT IS NOT ABOUT CPU

Ethan, 2026-08-03: "am i free to leave the server on overnight or should we
implement some server idle freeze ... to atleast save some cpu life".

CPU is the smaller half. The real cost is the WORLD CLOCK.

A Minecraft day is 20 real minutes and it advances whenever the server ticks,
players or not - this world reached day 43 in about 14 hours of uptime, roughly
3 in-game days per real hour. The difficulty escalation in
`config/incontrol/spawner.json` gates on `mindaycount` (waves at day 75 / 175 /
350), so an empty server left up overnight burns ~30 in-game days of challenge
curve for nobody. The pacing you tuned quietly drains while everyone sleeps.

Stopping when empty makes "days survived" mean roughly what it says.

WHAT IT DOES

Polls the player count over RCON. After GRACE consecutive empty checks it issues
a clean `stop`, which flushes the world - the same path serverctl uses, never a
kill. One empty check is not enough: someone reconnecting after a crash, or a
brief disconnect, would otherwise take the server down under them.

It also refuses to act if RCON is unreachable, because "cannot see the server"
and "nobody is on the server" must never be the same answer. That distinction is
the one this repo keeps paying for.

PAIRS WITH the 3pm scheduled start (server/scripts/scheduled_start.ps1): the
server comes up on a timer and puts itself away when the last player leaves.

  python tools/idle_stop.py                 # one poll, honours the state file
  python tools/idle_stop.py --watch         # loop until it stops the server
  python tools/idle_stop.py --grace 4 --interval 300
"""

from __future__ import annotations

import argparse
import pathlib
import re
import subprocess
import sys
import time

HERE = pathlib.Path(__file__).resolve().parent
INSTANCE = r"C:\MCServer\instance"
STATE = HERE / ".cache" / "idle_stop.state"


def players() -> int | None:
    """Player count, or None if the server could not be reached.

    None is NOT zero. An unreachable server must never be mistaken for an empty
    one - that would stop a server that is merely busy, or already down.
    """
    try:
        out = subprocess.run(
            [sys.executable, str(HERE / "rcon.py"), "--instance", INSTANCE, "list"],
            capture_output=True, text=True, timeout=30).stdout
    except Exception:
        return None
    m = re.search(r"There are (\d+) of a max of \d+ players online", out)
    return int(m.group(1)) if m else None


def read_state() -> int:
    try:
        return int(STATE.read_text().strip())
    except Exception:
        return 0


def write_state(n: int) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(str(n), encoding="utf-8")


def stop_server() -> None:
    subprocess.run([sys.executable, str(HERE / "serverctl.py"), "stop"], timeout=300)


def poll(grace: int, dry: bool) -> str:
    n = players()
    if n is None:
        write_state(0)
        return "unreachable - doing nothing (this is NOT 'empty')"
    if n > 0:
        write_state(0)
        return "%d online - counter reset" % n
    streak = read_state() + 1
    write_state(streak)
    if streak < grace:
        return "empty %d/%d consecutive checks" % (streak, grace)
    if dry:
        return "empty %d/%d - WOULD STOP (dry run)" % (streak, grace)
    stop_server()
    write_state(0)
    return "empty %d/%d - STOPPED cleanly" % (streak, grace)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--grace", type=int, default=3,
                    help="consecutive empty polls before stopping (default 3)")
    ap.add_argument("--interval", type=int, default=300,
                    help="seconds between polls in --watch (default 300)")
    ap.add_argument("--watch", action="store_true", help="loop until it stops the server")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    while True:
        msg = poll(a.grace, a.dry_run)
        print("[%s] %s" % (time.strftime("%H:%M:%S"), msg))
        if not a.watch or "STOPPED" in msg:
            return 0
        time.sleep(a.interval)


if __name__ == "__main__":
    sys.exit(main())
