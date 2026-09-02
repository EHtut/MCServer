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
    """Every class-name shape a mod might use for `dread_thrall`.

    ⚠️ THREE SHAPES WERE NOT ENOUGH AND THE GAP WAS INVISIBLE. This returned only
    DreadThrall / DreadThrallEntity / EntityDreadThrall, and 12 of 45 rostered ids matched
    none of them - 27% of the roster went unscreened while the tool reported "no rostered
    mob carries a KNOWN targeting goal".

    L_Ender's Cataclysm keeps the underscores and suffixes the class:
        royal_draugr -> Royal_Draugr_Entity
    """
    parts = name.split('_')
    cam = ''.join(w.capitalize() for w in parts)
    snake = '_'.join(w.capitalize() for w in parts)      # Royal_Draugr
    return (
        cam, cam + 'Entity', 'Entity' + cam,
        snake, snake + '_Entity', snake + 'Entity',
    )


# ⭐ CLIENT-SIDE CLASSES CANNOT CARRY AI GOALS, and matching one is worse than matching
# nothing: it makes the id look screened when the thing that decides its targeting was
# never read. The first broadened pass "matched" cataclysm mobs to their Renderers.
CLIENT_ONLY = ('Renderer', 'Model', 'Layer', 'Animation', 'ClientSetup', 'ModelLayers')


def is_client_class(simple_name):
    return any(k in simple_name for k in CLIENT_ONLY)


def find_by_id(index_by_jar, ns, name):
    """Fallback: the class that actually CARRIES the registry id.

    🔑 GUESSING NAMES DOES NOT SCALE - every mod invents its own convention and the tool
    silently skips whatever it has not been taught. So when no name shape matches, look
    for the id string itself in the jar's bytes and take the non-client classes that hold
    it. That adapts to a mod nobody has seen instead of needing a new guess per author.

    ⚠️ The id appears in registries (ModEntities) and renderers too, so client classes are
    excluded and the registry aggregators are skipped - they name every mob in the mod and
    would attribute one mob's goal to all of them.
    """
    # 🔴 THE FALLBACK MUST BE NAMESPACED OR IT INVENTS FINDINGS. The first version searched
    # EVERY jar for the bare id, and reported `minecraft:skeleton` as carrying Goety's
    # `Summoned$NaturalAttackGoal` - because the string "skeleton" appears in Goety's
    # servant class. Vanilla skeletons carry no mod goal.
    #
    # ⚠️ A FALSE POSITIVE IS WORSE THAN THE GAP IT REPLACED: the gap was at least honest
    # about being a gap, while a wrong finding sends somebody hunting a bug that is not
    # there - and teaches them the screen cries wolf.
    #
    # 🔑 Vanilla ids are never searched: their classes are in the game jar, not a mod, and
    # a mod jar mentioning "skeleton" is talking about its own thing. For a modded id, only
    # jars whose filename plausibly belongs to that namespace are read.
    if ns == 'minecraft':
        return []
    needle = name.encode('utf-8')
    stem = ns.replace('_', '')
    out = []
    for jar, entries in index_by_jar.items():
        base = os.path.basename(jar).lower().replace("'", '').replace('_', '').replace('-', '')
        if stem not in base and base.split('.')[0] not in stem:
            continue        # a different mod's jar cannot define this namespace's entity
        try:
            z = zipfile.ZipFile(jar)
        except Exception:
            continue
        for entry in entries:
            simple = entry.rsplit('/', 1)[-1][:-6]
            if is_client_class(simple):
                continue
            if simple.startswith('Mod') or simple.startswith('CM') or 'Config' in simple:
                continue      # registry/config aggregators name every mob in the mod
            try:
                if needle in z.read(entry):
                    out.append((jar, entry))
            except Exception:
                continue
    return out


def scan():
    findings, unreadable = [], []
    ids, missing = rostered()
    if missing:
        return None, None, missing, ids, [], (0, 0)
    if not ids:
        return None, None, ['<no ids parsed at all>'], ids, [], (0, 0)

    jars = [os.path.join(MODS, f) for f in sorted(os.listdir(MODS))
            if f.endswith('.jar')]
    if not jars:
        return None, None, ['<no jars at %s>' % MODS], ids, [], (0, 0)

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

    # For the id fallback: every class entry, grouped by the jar that holds it.
    by_jar = {}
    for simple, hits in index.items():
        for jar, entry in hits:
            by_jar.setdefault(jar, []).append(entry)

    checked = 0
    by_name = 0
    by_id = 0
    for ns, name in ids:
        cands = []
        for v in camel_variants(name):
            # ⚠️ Skip client-side matches. A Renderer makes an id LOOK screened while the
            # class that decides its targeting was never read - worse than no match at all.
            cands += [(j, e) for (j, e) in index.get(v, [])
                      if not is_client_class(e.rsplit('/', 1)[-1][:-6])]
        if cands:
            by_name += 1
        else:
            # 🔑 No name shape matched - go and find the class that carries the id.
            cands = find_by_id(by_jar, ns, name)
            if cands:
                by_id += 1
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
    return findings, checked, [], ids, unreadable, (by_name, by_id)


def main():
    findings, checked, failed, ids, unreadable, how = scan()

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

    # ⛔ ZERO MATCHED IS A FAILURE TO READ, NOT A PEACEFUL ROSTER.
    #
    # 🔴 Found by an adversarial audit, 2026-09-01. `checked` was computed and printed and
    # never TESTED, so if every camel-case guess missed - a mod renaming its classes, an
    # obfuscated jar, the mods folder pointed somewhere else - this fell straight through
    # to "OK - no rostered mob carries a KNOWN mob-vs-mob targeting goal." Forty-five ids
    # screened against nothing, reported as a clean bill of health.
    #
    # That is this file's own stated rule ("an empty roster read is a failure, not a clean
    # run") applied one step further along: the roster parsed fine, and then nothing was
    # matched to it. Both are "nothing was screened".
    if not checked:
        print('  !! NOT ONE ROSTERED ID MATCHED A CLASS FILE - this is a FAILURE, not a')
        print('     pass. The rosters parsed, and then nothing was screened against them.')
        print('     Check that %s is the live mods folder and that the' % MODS)
        print('     naming guesses in camel_variants() still match this pack.')
        return 2

    # ⚠️ SAY WHAT WAS NOT SCREENED. The header promises this ("Say what was NOT screened")
    # and the list was being collected and then DISCARDED at the return - so a run where
    # only one mob in forty-five resolved looked exactly like a run where all of them did.
    # A screen that cannot state its own coverage is not a screen, it is a reassurance.
    # 🔑 VANILLA AND MODDED GAPS ARE DIFFERENT FACTS AND MUST NOT SHARE A LIST. A vanilla
    # id has no mod jar to read and carries no mod goal - that is expected and permanent.
    # A MODDED id here means the tool failed to find a class it should have found.
    #
    # ⚠️ Printing them together buried the real signal: 12 unscreened ids read as one blob
    # ending "most are vanilla", when five of them were modded cataclysm mobs that nothing
    # had ever screened.
    if unreadable:
        pct = (100 * checked) // max(1, len(ids))
        vanilla = sorted(u for u in unreadable if u.startswith('minecraft:'))
        modded = sorted(u for u in unreadable if not u.startswith('minecraft:'))
        print('  %d of %d id(s) screened (%d%%)' % (checked, len(ids), pct))
        if vanilla:
            print('    %d vanilla id(s) have no mod jar to read - expected, not a gap:'
                  % len(vanilla))
            print('       ' + ', '.join(v.split(':', 1)[1] for v in vanilla))
        if modded:
            print()
            print('  🔴 %d MODDED id(s) WERE NOT SCREENED. The tool could not find their'
                  % len(modded))
            print('     class under any name shape OR by searching their own mod jar for')
            print('     the id. That is a hole in this screen, not a clean bill:')
            for u in modded:
                print('       ' + u)
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
