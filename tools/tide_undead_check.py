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
WAVES = REPO / "pack" / "kubejs" / "server_scripts" / "waves.js"

# Vanilla's own undead. Not in any mod jar, so it is stated here.
VANILLA = {
    "minecraft:zombie", "minecraft:skeleton", "minecraft:husk", "minecraft:drowned",
    "minecraft:stray", "minecraft:wither_skeleton", "minecraft:zombie_villager",
    "minecraft:phantom", "minecraft:bogged", "minecraft:zoglin", "minecraft:wither",
    "minecraft:skeleton_horse", "minecraft:zombie_horse", "minecraft:giant",
}


# 🔴 THIS READER DROPPED NESTED TAGS AND MANUFACTURED FOUR FALSE FINDINGS.
#
# It kept only ids and threw away every value starting with "#". But goety's
# contribution to `#minecraft:undead` is almost entirely nested:
#
#     data/minecraft/tags/entity_type/undead.json
#         values: ["#goety:reapers", "#goety:wraiths", "goety:haunted_armor", ...]
#
# So wraith / border_wraith / muck_wraith / reaper ARE undead in the running game, and
# this tool reported all four as "NOT THE GODDESS'S". ⚠️ Minecraft resolves nested tags
# transitively; a reader that does not is not reading the same set the game is.
#
# 🔑 MEASURE AT THE POINT OF USE. Third time this exact class of error has cost this
# project a day: a value written one way and read another, and the read is wrong.
def read_all_tags():
    """Every entity_type tag in every jar, keyed '#ns:path'. Un-resolved."""
    raw, jars = {}, 0
    pat = re.compile(r"data/([a-z0-9_.-]+)/tags/entity_type/(.+)\.json$")
    for jar in sorted(MODS.glob("*.jar")):
        try:
            z = zipfile.ZipFile(jar)
        except Exception:
            continue
        for n in z.namelist():
            m = pat.search(n)
            if not m:
                continue
            try:
                d = json.loads(z.read(n))
            except Exception:
                continue
            key = "#%s:%s" % (m.group(1), m.group(2))
            if key == "#minecraft:undead":
                jars += 1
            # ⚠️ MERGE, never replace. Entity tags merge across jars - that is how
            # vanilla's tag gets contributions from ten different mods at once.
            bucket = raw.setdefault(key, set())
            for v in d.get("values", []):
                vid = v if isinstance(v, str) else v.get("id", "")
                if vid:
                    bucket.add(vid)
    return raw, jars


def read_tag():
    raw, jars = read_all_tags()

    # Resolve "#ns:path" references transitively. `seen` is cycle protection: a tag
    # that references itself would otherwise recurse forever, and mod data does that.
    def expand(key, seen):
        if key in seen:
            return set()
        seen.add(key)
        out = set()
        for v in raw.get(key, ()):
            if v.startswith("#"):
                out |= expand(v, seen)
            else:
                out.add(v)
        return out

    return expand("#minecraft:undead", set()), jars


# Which file each roster lives in, and whether an empty read is survivable.
# 🔴 THIS TOOL VERIFIED NOTHING FOR A DAY, AND IT REPORTED THAT AS SUCCESS.
# It read SHALLOW / DEEP / DEEPER - three depth bands DELETED on 2026-08-29 when the
# roster was rewritten. `re.search` returned None, the bands read as empty lists, every
# loop over them ran zero times, and the summary was "OK - every mob in every band is
# undead". Zero mobs checked, printed as a clean bill of health. It only exited non-zero
# by accident, on an unrelated allowlist branch.
#
# ⭐ THE RULE THAT WOULD HAVE CAUGHT IT IS THE PROJECT'S OWN, AND IT IS NOW ENFORCED
# BELOW: "I failed" and "I found nothing" must never share a return value. A band that
# reads empty is a FAILURE TO READ. There is no roster in this game that is legitimately
# empty, so there is no case where silence is the right answer.
BANDS = [
    ("BULK", "tide"), ("ARCHERS", "tide"), ("SPECIALISTS", "tide"), ("BOSSES", "tide"),
    ("BONE_FODDER", "waves"), ("GHOST_FODDER", "waves"),
    ("BONE_LIGHT", "waves"), ("GHOST_LIGHT", "waves"),
    ("BONE_TANK", "waves"), ("GHOST_TANK", "waves"),
    ("RANGED", "waves"),
]


def read_rosters():
    src = {
        "tide": TIDE.read_text(encoding="utf-8"),
        "waves": WAVES.read_text(encoding="utf-8"),
    }
    out, unread = {}, []
    for band, where in BANDS:
        m = re.search(r"var %s = \[(.*?)\]" % band, src[where], re.S)
        ids = re.findall(r"'([a-z_0-9]+:[a-z_0-9]+)'", m.group(1)) if m else []
        if not ids:
            unread.append("%s (expected in %s.js)" % (band, where))
        out[band] = ids

    m = re.search(r"var UNTAGGED_UNDEAD = \[(.*?)\]", src["tide"], re.S)
    out["UNTAGGED_UNDEAD"] = (
        re.findall(r"'([a-z_0-9]+:[a-z_0-9]+)'", m.group(1)) if m else [])

    # ⭐ THE GOD ROSTERS ARE EXEMPT, DELIBERATELY, AND REPORTED RATHER THAN HIDDEN.
    # Ethan's god-augmented waves are the OTHER gods reaching into her water - Wall's
    # spiders, Blade's zombies. A mob that is not hers is the entire point of that wave,
    # so testing it against #minecraft:undead would be testing the wrong rule. It is
    # listed in the output so the exemption stays visible; an exemption nobody can see
    # is an allowlist.
    # 🔴 THIS REGEX BROKE THE DAY AFTER IT WAS WRITTEN AND PRINTED AN EMPTY SECTION
    # UNDER AN "OK". It matched `ids: [...]`; the god rosters were split into
    # `fodder:`/`spec:` on 2026-08-30 and it matched nothing, so the exemption list this
    # tool exists to make VISIBLE became invisible - which is D-109 all over again, in
    # the tool repaired for D-109, one day later.
    #
    # ⭐ TWO FIXES, NOT ONE. Match the real shape, AND treat "no gods parsed" as a
    # failure below - because the regex will break again the next time the shape moves,
    # and the only durable defence is that empty is never silent.
    gods = {}
    for m in re.finditer(r"(\w+): \{\s*at: \d+, tier: '(\w+)',(.*?)\n    \},",
                         src["waves"], re.S):
        body = m.group(3)
        ids = []
        for field in ("fodder", "spec"):
            fm = re.search(r"%s: \[(.*?)\]" % field, body, re.S)
            if fm:
                ids += re.findall(r"'([a-z_0-9]+:[a-z_0-9]+)'", fm.group(1))
        bm = re.search(r"boss: '([a-z_0-9]+:[a-z_0-9]+)'", body)
        gods[m.group(1)] = {"ids": ids, "boss": bm.group(1) if bm else None}
    return out, unread, gods


def main():
    tag, jars = read_tag()
    if not tag:
        print("could not read #minecraft:undead from any jar in %s" % MODS)
        print("That is a FAILURE TO READ, not a pass - nothing was verified.")
        return 2
    undead = tag | VANILLA
    r, unread, gods = read_rosters()
    allow = set(r["UNTAGGED_UNDEAD"])

    print("=" * 66)
    print("THE TIDE - undead check")
    print("=" * 66)
    print("  #minecraft:undead   %d ids, from %d jar tag file(s) + vanilla"
          % (len(undead), jars))
    print()

    # ⛔ EMPTY IS A FAILURE, AND IT COMES FIRST. This is the exact bug that made this
    # tool certify nothing for a day: bands renamed out from under it, read as empty,
    # counted as clean. Nothing below this point is trustworthy if a band did not parse.
    if unread:
        print("  !! %d ROSTER(S) COULD NOT BE READ - THIS IS A FAILURE, NOT A PASS."
              % len(unread))
        for u in unread:
            print("       " + u)
        print()
        print("     A roster that reads empty means the source moved or was renamed,")
        print("     NOT that it contains nothing objectionable. Nothing was verified.")
        return 2

    bad = []
    used = set()
    for band, _where in BANDS:
        ids = r[band]
        used |= set(ids)
        print("  %-14s %d mob(s)" % (band, len(ids)))
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

    # ⭐ THE GOD ROSTERS, EXEMPT AND SAID OUT LOUD.
    # ⛔ AN EMPTY PARSE IS A FAILURE, NOT AN EMPTY SECTION. This tool printed a blank
    # god list under an "OK" the first time waves.js changed shape - the exact defect
    # (D-109) it had just been repaired for. There are always gods; zero means the
    # reader broke.
    if not gods:
        print("  !! COULD NOT PARSE ANY GOD ROSTER from waves.js.")
        print("     That is a FAILURE TO READ, not a pack with no god waves. The")
        print("     exemption list this tool exists to make visible is invisible.")
        return 2
    print("  GOD WAVES - exempt by design, listed so the exemption is visible:")
    for g in sorted(gods):
        ids = gods[g]["ids"]
        off = [i for i in ids if i not in undead and i not in allow]
        print("      %-10s %d mob(s), %d not-undead  %s"
              % (g, len(ids), len(off), ", ".join(off) if off else ""))
        if not gods[g]["boss"]:
            print("                 !! no boss declared - her miniboss leads it (D-117)")
    print("     Another god reaching into her water is BY DEFINITION not her undead -")
    print("     that is the whole point of the wave. Testing these against the tag")
    print("     would be testing the wrong rule.")
    print()

    stray = sorted(a for a in allow if a not in used)
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
        print("  OK - %d mobs across %d rosters, every one of them undead."
              % (len(used), len(BANDS)))
        if allow:
            print("       %d allowlisted exception(s), all Rotten Creatures." % len(allow))
        else:
            # ⚠️ Do not print "the one exception is Rotten Creatures" when there is no
            # exception. The summary line is the only part of this most people read.
            print("       No allowlisted exceptions at all - the rule holds outright.")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
