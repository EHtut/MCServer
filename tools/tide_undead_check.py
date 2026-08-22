#!/usr/bin/env python3
"""tide_undead_check - the Tide is the goddess of death's army. Prove it.

Ethan, 2026-08-22: "i want only undead mobs to be apart of the tide. Creepers and
spiders, etc are not apart of the goddess of death's army or control."

WHY THIS IS A TOOL AND NOT A COMMENT
------------------------------------
The first roster was SIX of twenty-one undead, and it did not look wrong. It was
lifted from spawner.json's depth tiers - a list that exists to make caves dangerous
and has no opinion about whose army anything belongs to.

⚠️ AND THE NAMES LIE. Three entries read as undead and are not:

    grim_and_bleak:flesh_eater        NOT undead
    grim_and_bleak:night_abomination  NOT undead
    born_in_chaos_v1:restless_spirit  NOT undead

So "check the list looks undead" is not a check. This reads `#minecraft:undead` out
of every installed jar and tests every id in every band against it.

🔑 ONE ALLOWLIST, AND IT IS THE POINT OF FAILURE TO WATCH. Rotten Creatures tags
nothing into the vanilla tag despite being an undead mod. Those ids are permitted by
name in tide.js's UNTAGGED_UNDEAD. If that list grows beyond Rotten Creatures,
somebody has allowlisted their way out of the rule - which is the original bug
wearing a permission slip - and this says so.

RULES (shared with genq / mcq / lifeq)
-------------------------------------
  * An empty tag set is reported as a FAILURE to read, never as "everything passed".
  * READ ONLY.
"""

import json
import pathlib
import re
import sys
import zipfile

REPO = pathlib.Path(__file__).resolve().parent.parent
MODS = pathlib.Path(r"C:\MCServer\instance\mods")
TIDE = REPO / "pack" / "kubejs" / "server_scripts" / "tide.js"

# Vanilla's own undead. Not in any mod jar, so it is stated here.
VANILLA = {
    "minecraft:zombie", "minecraft:skeleton", "minecraft:husk", "minecraft:drowned",
    "minecraft:stray", "minecraft:wither_skeleton", "minecraft:zombie_villager",
    "minecraft:phantom", "minecraft:bogged", "minecraft:zoglin", "minecraft:wither",
    "minecraft:skeleton_horse", "minecraft:zombie_horse", "minecraft:giant",
}


def read_tag():
    found = set()
    jars = 0
    for jar in MODS.glob("*.jar"):
        try:
            z = zipfile.ZipFile(jar)
        except Exception:
            continue
        for n in z.namelist():
            if not re.search(r"data/minecraft/tags/entity_type/undead\.json$", n):
                continue
            try:
                d = json.loads(z.read(n))
            except Exception:
                continue
            jars += 1
            for v in d.get("values", []):
                vid = v if isinstance(v, str) else v.get("id", "")
                if vid and not vid.startswith("#"):
                    found.add(vid)
    return found, jars


def read_rosters():
    src = TIDE.read_text(encoding="utf-8")
    out = {}
    for band in ("SHALLOW", "DEEP", "DEEPER", "UNTAGGED_UNDEAD"):
        m = re.search(r"var %s = \[(.*?)\]" % band, src, re.S)
        out[band] = re.findall(r"'([a-z_0-9]+:[a-z_0-9]+)'", m.group(1)) if m else []
    return out


def main():
    tag, jars = read_tag()
    if not tag:
        print("could not read #minecraft:undead from any jar in %s" % MODS)
        print("That is a FAILURE TO READ, not a pass - nothing was verified.")
        return 2
    undead = tag | VANILLA
    r = read_rosters()
    allow = set(r["UNTAGGED_UNDEAD"])

    print("=" * 66)
    print("THE TIDE - undead check")
    print("=" * 66)
    print("  #minecraft:undead   %d ids, from %d jar tag file(s) + vanilla"
          % (len(undead), jars))
    print()

    bad = []
    for band in ("SHALLOW", "DEEP", "DEEPER"):
        ids = r[band]
        print("  %-8s %d mob(s)" % (band, len(ids)))
        for i in ids:
            if i in undead:
                mark = "undead"
            elif i in allow:
                mark = "ALLOWED (untagged, see tide.js)"
            else:
                mark = "!! NOT UNDEAD"
                bad.append(band + " :: " + i)
            print("      %-44s %s" % (i, mark))
        print()

    stray = sorted(a for a in allow
                   if a not in set(r["SHALLOW"] + r["DEEP"] + r["DEEPER"]))
    wrong_mod = sorted(a for a in allow if not a.startswith("rottencreatures:"))

    if bad:
        print("  !! %d MOB(S) IN THE TIDE ARE NOT THE GODDESS'S:" % len(bad))
        for b in bad:
            print("       " + b)
    if stray:
        print("  !! allowlist entries used by no band (delete them): %s" % ", ".join(stray))
    if wrong_mod:
        print("  !! ALLOWLIST HAS GROWN BEYOND ROTTEN CREATURES: %s" % ", ".join(wrong_mod))
        print("     That is the rule being worked around rather than followed.")

    if not (bad or stray or wrong_mod):
        print("  OK - every mob in every band is undead, and the one exception is")
        print("       exactly Rotten Creatures, whose whole roster is undead.")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
