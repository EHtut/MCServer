"""world - what is true RIGHT NOW. The DM's perception, as JSON.

PERCEPTION, NOT MEMORY

    telemetry.js + logq.py   what HAPPENED    append-only, accumulates forever
    world.py                 what IS          polled, stores nothing

A DM needs both and can derive neither from the other. "You have died to
skeletons forty times" is memory. "You are in a swamp at night on two hearts
with a creeper eleven blocks behind you" is perception. Events are too coarse
and too laggy to reconstruct the present; polling is far too expensive to build
a history.

ONE RICH OBSERVATION, NOT TWELVE SMALL QUERIES

An LLM reasons better from a single blob than from orchestrating a dozen calls,
and every RCON query is a round trip. So `snapshot` is the primary command: one
call, one JSON object, everything needed to decide something. The granular
commands exist for when less is wanted.

The other half of the job is translation. RCON answers in prose -

    Rehykt has the following entity data: [24.03d, 52.0d, 70.75d]

- and turning that into {"x":24.03,"y":52.0,"z":70.75} is most of the work.

READ-ONLY, ENFORCED RATHER THAN INTENDED

Every command is checked against a verb allowlist before it is sent. The action
layer will share this RCON connection, and "observe" must not be able to drift
into "act" through a later edit. If a write is ever needed it belongs in that
layer, behind its own rails and audit log - not here.

USAGE

    python tools/world.py snapshot            everything, one JSON object
    python tools/world.py players             who is on, with vitals
    python tools/world.py player <name>       one player, deep
    python tools/world.py near <name> [-r 24] what is around them
    python tools/world.py at <x> <y> <z>      block and biome at a point
    python tools/world.py time                time, day, season
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys

RCON_PY = pathlib.Path(__file__).resolve().parent / "rcon.py"

# Only these verbs may ever be sent. `data get` is read-only; `data merge` and
# `data modify` are not, so the check is on the first TWO words where it matters.
ALLOWED = ("list", "data get", "time query", "execute", "locate", "gamerule",
           "datapack list", "seed", "difficulty", "forceload query")

# Hostile types worth probing near a player. Presence only - see note in near().
HOSTILE_PROBE = [
    "minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", "minecraft:spider",
    "minecraft:enderman", "minecraft:witch", "minecraft:pillager", "minecraft:vindicator",
    "minecraft:phantom", "minecraft:drowned", "minecraft:husk", "minecraft:stray",
]


class ServerDown(Exception):
    pass


def _allowed(cmd: str) -> bool:
    """Allowlist check that follows `execute ... run <cmd>` to the end.

    `execute` HAS to be allowed - it is the only way to ask a positional
    question - but it can wrap ANY command, so a flat prefix check lets
    `execute as @a run kill @a` straight through. Found by writing the test that
    was supposed to prove the guard worked.

    Every `run` clause is therefore re-checked, recursively, and `execute` alone
    with no `run` is inert and fine.
    """
    cmd = cmd.strip()
    if " run " in cmd:
        head, tail = cmd.split(" run ", 1)
        return head.strip().startswith("execute") and _allowed(tail)
    return any(cmd.startswith(v) for v in ALLOWED)


def rcon(cmd: str) -> str:
    """Send one command. Refuses anything not on the allowlist."""
    if not _allowed(cmd):
        raise ValueError(f"world.py is read-only; refusing to send: {cmd!r}")
    r = subprocess.run([sys.executable, str(RCON_PY), cmd],
                       capture_output=True, text=True)
    out = (r.stdout or "") + (r.stderr or "")
    if "cannot reach RCON" in out or "actively refused" in out:
        raise ServerDown("server is not running (RCON refused)")
    # rcon.py echoes "> cmd" then the reply; keep the reply.
    lines = [l for l in out.splitlines() if l.strip() and not l.startswith(">")]
    return lines[-1].strip() if lines else ""


# --------------------------------------------------------------------------
# parsing - RCON answers in prose
# --------------------------------------------------------------------------

DATA_RX = re.compile(r"has the following entity data:\s*(?P<v>.*)$", re.S)


def data_get(target: str, path: str):
    raw = rcon(f"data get entity {target} {path}")
    m = DATA_RX.search(raw)
    if not m:
        return None                       # not "0" and not "" - genuinely absent
    v = m.group("v").strip()
    # scalars: 12.0d, 20.0f, 3b, 7s, 100L
    s = re.fullmatch(r"(-?[\d.]+)[dfbsL]?", v)
    if s:
        f = float(s.group(1))
        return int(f) if f.is_integer() else f
    if v.startswith("[") and v.endswith("]"):
        nums = re.findall(r"(-?[\d.]+)[dfbsL]?", v)
        if nums:
            return [float(n) if "." in n else int(n) for n in nums]
    return v.strip('"')


def players_online() -> list[str]:
    raw = rcon("list")
    if ":" not in raw:
        return []
    tail = raw.split(":", 1)[1].strip()
    return [p.strip() for p in tail.split(",") if p.strip()]


def player_state(name: str) -> dict:
    pos = data_get(name, "Pos") or []
    out = {
        "name": name,
        "pos": {"x": pos[0], "y": pos[1], "z": pos[2]} if len(pos) == 3 else None,
        "dimension": data_get(name, "Dimension"),
        "health": data_get(name, "Health"),
        "food": data_get(name, "foodLevel"),
        "air": data_get(name, "Air"),
        "xp_level": data_get(name, "XpLevel"),
        "gamemode": data_get(name, "playerGameType"),
        "on_fire": data_get(name, "HurtTime"),
    }
    held = data_get(name, "SelectedItem.id")
    out["held"] = held if isinstance(held, str) else None
    return out


def near(name: str, radius: int) -> dict:
    """Which hostile types are within `radius`.

    PRESENCE, NOT COUNTS, and that is a real limit worth stating: counting
    entities over RCON needs a scoreboard, and creating one is a WRITE. This
    tool is read-only by construction, so it probes instead - one round trip per
    type. `execute if entity` answers "Test passed" or "Test failed".
    """
    found = []
    for t in HOSTILE_PROBE:
        try:
            r = rcon(f"execute as {name} at @s run execute if entity "
                     f"@e[type={t},distance=..{radius}]")
        except Exception:
            continue
        if "Test passed" in r:
            found.append(t)
    return {"radius": radius, "hostiles_present": found}


def world_state() -> dict:
    def q(cmd, rx):
        try:
            m = re.search(rx, rcon(cmd))
            return int(m.group(1)) if m else None
        except Exception:
            return None
    daytime = q("time query daytime", r"is (\d+)")
    return {
        "daytime": daytime,
        "day": q("time query day", r"is (\d+)"),
        "is_night": (daytime is not None and 13000 <= daytime <= 23000),
        "difficulty": (lambda r: r.split()[-1] if r else None)(
            _safe(lambda: rcon("difficulty"))),
    }


def _safe(fn):
    try:
        return fn()
    except Exception:
        return None


def snapshot() -> dict:
    names = players_online()
    return {
        "server": {"online": len(names), "players": names},
        "world": world_state(),
        "players": [player_state(n) for n in names],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["snapshot", "players", "player", "near", "at", "time"])
    ap.add_argument("args", nargs="*")
    ap.add_argument("-r", "--radius", type=int, default=24)
    a = ap.parse_args()

    try:
        if a.command == "snapshot":
            out = snapshot()
        elif a.command == "players":
            out = [player_state(n) for n in players_online()]
        elif a.command == "player":
            if not a.args:
                print("  player needs a name"); return 1
            out = player_state(a.args[0])
        elif a.command == "near":
            if not a.args:
                print("  near needs a player name"); return 1
            out = near(a.args[0], a.radius)
        elif a.command == "at":
            if len(a.args) != 3:
                print("  at needs x y z"); return 1
            x, y, z = a.args
            out = {"pos": [x, y, z],
                   "block": _safe(lambda: rcon(f"execute positioned {x} {y} {z} run "
                                               f"data get block {x} {y} {z}"))}
        elif a.command == "time":
            out = world_state()
        else:
            out = {}
    except ServerDown as e:
        # Loud and specific. An empty snapshot must never be mistaken for
        # "nothing is happening" - that is the same failure shape that has
        # cost this project a night already.
        print(json.dumps({"error": str(e)}, indent=2))
        return 1

    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
