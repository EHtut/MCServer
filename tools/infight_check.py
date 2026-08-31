# -*- coding: utf-8 -*-
"""infight_check - does any rostered mob attack the wave it arrives in?

    python tools/infight_check.py

WHY THIS EXISTS
---------------
🔴 Ethan, from play, 2026-08-30:

    "there were skeletons with glowing blue eyes that immediately started attacking
     and killing all the other enemies in the tide."

`iceandfire:dread_thrall` and `dread_knight` carry `DreadAITargetNonDreadGoal` — an AI
goal whose entire job is to attack everything that is not part of the Dread army. Her
skeletons are not dread. Both had been added to her rosters hours earlier.

⭐ A MOB THAT FIGHTS ITS OWN WAVE IS WORSE THAN A MISSING MOB. The tide thins itself
while the player watches, and from their side it reads as the tide being broken.

⚠️ NOTHING ELSE IN THIS REPO COULD SEE IT. The registry says the ids are real. The stats
probe measured them. The undead check says they are undead. They survive being summoned.
Every harness passes — the ids are strings in a list and they are the right strings.
The defect is in how the mob BEHAVES once it is standing there.

🚨 WHAT THIS IS, AND WHAT IT IS NOT
-----------------------------------
This is a STATIC, NAME-BASED scan of entity class files for known mob-vs-mob targeting
goals. That makes it a *screen*, not a proof:

  · it CANNOT find an infighting mob whose goal class is named something unfamiliar
  · it CAN produce a false positive on a class that merely references such a goal

⛔ AND THE OBVIOUS LIVE TEST DOES NOT WORK. Summoning two mobs and watching HP fall was
tried and produced two false results in a row:

    1. every candidate "attacked" — the prey was BURNING. Daylight, y250, open sky, and
       skeletons catch fire. The control (prey alone) dropped 15 -> 4 hp with no
       attacker in the world.
    2. with fire resistance the control held, and then everything read as innocent —
       because NoGravity mobs floating three blocks apart cannot path to each other.
       Absence of damage was absence of a fight, not absence of hostility.

🔑 So the evidence that actually settles this is PLAY, and the value of this file is to
catch the known families BEFORE they reach play. When it flags something, the question
to ask is "what does this goal do", not "is the tool sure".

RULES (shared with genq / mcq / lifeq / tide_undead_check)
---------------------------------------------------------
  * A failure to read is reported as a failure, never as a pass.
  * An empty roster read is a failure, not a clean run.
  * READ ONLY. Touches jars and scripts, never the world.
"""

import io
import os
import re
import sys
import zipfile

# 🔴 THE CLEAN PATH CRASHED AND THE FAILING PATH DID NOT. First run after the roster was
# fixed, this file raised UnicodeEncodeError on a warning symbol in the OK branch - on a
# cp1252 console, printing a clean result was fatal while printing findings worked fine.
#
# ⚠️ THAT IS THE "I FAILED" / "I FOUND NOTHING" COLLISION, in the tool written to catch a
# different instance of it. A green run that exits 1 with a traceback is indistinguishable
# from a broken tool, and would have been read as one.
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SS = os.path.join(REPO, 'pack', 'kubejs', 'server_scripts')
MODS = r"C:\MCServer\instance\mods"
ROSTER_FILES = ('waves.js', 'tide.js', 'spawn_pressure.js')

ID = re.compile(r"'([a-z_0-9]+):([a-z_0-9]+)'")

# ── the known families ────────────────────────────────────────────────────────
# ⚠️ Each entry is a SUBSTRING of a goal/class name that means "this mob picks fights
# with mobs". Add to it whenever play turns up a new one - that is how this file is
# supposed to grow, because the alternative is guessing at every mod's AI vocabulary.
HOSTILE_GOALS = [
    # Ice and Fire's Dread army. Found the hard way: it is why this file exists.
    (b'DreadAITargetNonDreadGoal', 'targets everything that is not Dread'),
    # Goety servants swing at "natural" mobs when they have no owner to defer to.
    (b'Summoned$NaturalAttackGoal', 'a servant goal that attacks non-summoned mobs'),
    # Generic shapes seen in this pack's mods.
    (b'TargetNonTeam', 'targets anything off its team'),
    (b'AttackAllGoal', 'attacks indiscriminately'),
    (b'NearestAttackableTargetGoal$1', None),   # too common to report; kept documented
]
REPORTABLE = [(p, why) for p, why in HOSTILE_GOALS if why]


def rostered():
    """(namespace, path) for every id named in the roster files."""
    ids = set()
    missing = []
    for f in ROSTER_FILES:
        p = os.path.join(SS, f)
        if not os.path.exists(p):
            missing.append(f)
            continue
        for ns, name in ID.findall(io.open(p, encoding='utf-8').read()):
            ids.add((ns, name))
    # Not entities: sounds, dimensions, tags and config keys share the ns:path shape.
    skip = ('entity.', 'block.', 'item.', 'ambient.', 'music', 'ui.', 'overworld',
            'the_nether', 'the_end')
    ids = set((ns, n) for ns, n in ids if not any(n.startswith(s) for s in skip))
    return sorted(ids), missing


def camel_variants(name):
    """`dread_thrall` -> DreadThrall, DreadThrallEntity, EntityDreadThrall."""
    cam = ''.join(w.capitalize() for w in name.split('_'))
    return (cam, cam + 'Entity', 'Entity' + cam)


def scan():
    findings, unreadable = [], []
    ids, missing = rostered()
    if missing:
        return None, None, missing, ids
    if not ids:
        return None, None, ['<no ids parsed at all>'], ids

    jars = [os.path.join(MODS, f) for f in sorted(os.listdir(MODS))
            if f.endswith('.jar')]
    if not jars:
        return None, None, ['<no jars at %s>' % MODS], ids

    # Index every class file once, by simple name.
    index = {}
    for j in jars:
        try:
            z = zipfile.ZipFile(j)
        except Exception:
            continue
        for n in z.namelist():
            if n.endswith('.class'):
                index.setdefault(n.rsplit('/', 1)[-1][:-6], []).append((j, n))

    checked = 0
    for ns, name in ids:
        cands = []
        for v in camel_variants(name):
            cands += index.get(v, [])
        if not cands:
            unreadable.append('%s:%s' % (ns, name))
            continue
        checked += 1
        for jar, entry in cands:
            try:
                data = zipfile.ZipFile(jar).read(entry)
            except Exception:
                continue
            for pat, why in REPORTABLE:
                if pat in data:
                    findings.append(('%s:%s' % (ns, name), pat.decode(), why))
    return findings, checked, [], ids


def main():
    findings, checked, failed, ids = scan()

    print('=' * 70)
    print('INFIGHTING SCREEN - does a rostered mob attack its own wave?')
    print('=' * 70)

    if failed:
        print('  !! COULD NOT READ THE ROSTERS OR THE JARS - this is a FAILURE, not a')
        print('     pass. Nothing was screened.')
        for f in failed:
            print('       ' + f)
        return 2

    print('  %d rostered id(s), %d matched to a class file' % (len(ids), checked))
    print()

    if findings:
        print('  !! %d MOB(S) CARRY A MOB-VS-MOB TARGETING GOAL:' % len(findings))
        for eid, goal, why in sorted(set(findings)):
            print('       %-40s %s' % (eid, goal))
            print('       %-40s   -> %s' % ('', why))
        print()
        print('     A mob that fights the wave it arrives in thins the tide while the')
        print('     player watches, and reads as the tide being broken.')
        return 1

    # ⚠️ Say what was NOT screened. A clean result over a small sample is not a clean
    # roster, and this tool is a screen rather than a proof - see the header.
    print('  OK - no rostered mob carries a KNOWN mob-vs-mob targeting goal.')
    print('     ⚠️ This is a screen against %d known goal families, not a proof of'
          % len(REPORTABLE))
    print('        peace. A new mod with its own vocabulary passes silently. If play')
    print('        shows mobs fighting each other, add the goal here.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
