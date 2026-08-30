# -*- coding: utf-8 -*-
"""spawn_persist_check - does every rostered mob SURVIVE being summoned?

    python tools/spawn_persist_check.py            # every roster in waves.js + tide.js
    python tools/spawn_persist_check.py --ids a:b c:d

WHY THIS EXISTS
---------------
🔴 IT FOUND THREE SHIPPED IDS THAT SPAWN NOTHING, on the day it was written:

    goety:haunted_armor            was in GHOST_FODDER
    born_in_chaos_v1:restless_spirit   was in ART's roster
    born_in_chaos_v1:dark_vortex       was ART's BOSS

All three answer `summon` with "Summoned new ..." and are GONE a second later. Nothing
else in this repo could see that:

  * the registry probe says they are real ids - they are
  * the stats probe measured two of them - it reads faster than they despawn
  * the undead check says they are undead - they are
  * every harness passes - the id is a string in a list, and it is the right string

⭐ SO THE PROPERTY THAT MATTERS IS NOT "does this id exist", IT IS "does this id still
exist a moment after you place it". A tide places mobs by summoning them. A roster entry
that vanishes on arrival is a wave that quietly gets smaller, and it looks exactly like
correct code.

⚠️ THE SCORPIONS TAUGHT THIS. `naturalist:desert_scorpion` and `jungle_scorpion` were
dropped from Wall's shortlist for this reason and not because of the mod they came from -
a measured, operational disqualification instead of a guess about a critter mod.

🚨 THE CONTROL IS IN EVERY BATCH, NOT ONCE AT THE END
-----------------------------------------------------
The first version appended one known-good mob at the end. It collided with the same id
appearing as a candidate, one verdict overwrote the other, and the tool threw away all 47
results instead of one batch. A per-batch control localises the failure AND proves the
test could still pass at that moment. A batch whose control fails yields NO verdicts -
those ids are reported UNTESTED, which is not the same as passing.

RULES (shared with genq / mcq / lifeq / tide_undead_check)
---------------------------------------------------------
  * A failure to read is never reported as a pass.
  * "Vanished" and "untested" are different results with different exit codes.
  * READ ONLY as far as the world is concerned: every mob is summoned Silent, with
    NoGravity, at the console's own position, and killed in the same run. A final
    sweep reports anything it had to clean up.
"""
import argparse
import io
import json
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SS = os.path.join(REPO, 'pack', 'kubejs', 'server_scripts')
OUT = os.path.join(HERE, '.cache', 'spawn_persist.json')

# ⚠️ The console's own position, not a preference - entities further from the command
# source are unreachable by @e here. Measured; see undead_stats.py.
X, Y, Z = -80, 250, 160

# Blocks between each mob in a batch. ⚠️ Not cosmetic - see the note in check(): at 0
# the batch crushes its own low-hp subjects and the tool reports them as broken.
SPREAD = 3

# The bulk of every wave. If IT cannot be placed, nothing else measured in that batch
# means anything.
CONTROL = 'born_in_chaos_v1:decrepit_skeleton'

# How long to wait before asking whether it is still there. The three known failures
# are gone well inside a second; 2.5s is slack, not a threshold to tune.
SETTLE = 2.5

ID = re.compile(r"'([a-z_0-9]+:[a-z_0-9]+)'")


def rcon(cmds, timeout=180):
    p = subprocess.run([sys.executable, os.path.join(HERE, 'rcon.py')] + cmds,
                       capture_output=True, text=True, timeout=timeout)
    return p.stdout


def rostered():
    """Every entity id named in the wave files. Deliberately over-broad - a false
    positive costs one summon, a false negative costs a silently smaller wave."""
    ids = set()
    for f in ('waves.js', 'tide.js'):
        path = os.path.join(SS, f)
        if os.path.exists(path):
            ids |= set(ID.findall(io.open(path, encoding='utf-8').read()))
    # Not entities: sounds, tags and config keys share the ns:path shape.
    return sorted(i for i in ids
                  if not i.startswith(('minecraft:entity.', 'minecraft:block.',
                                       'minecraft:item.', 'minecraft:ambient.',
                                       'minecraft:music', 'minecraft:ui.')))


def check(ids, batch_size=6):
    out, broken = {}, []
    ids = [i for i in ids if i != CONTROL]
    for i in range(0, len(ids), batch_size):
        batch = ids[i:i + batch_size] + [CONTROL]
        tags = ['vsp%d_%d' % (i, n) for n in range(len(batch))]
        # 🔴 SPREAD THEM OUT. THE FIRST VERSION PUT THE WHOLE BATCH ON ONE BLOCK AND
        # KILLED ITS OWN SUBJECTS. It reported goety:haunt (6 hp), goety:reaper and
        # born_in_chaos_v1:corpse_fly (10 hp) as vanishing - three GOOD roster entries -
        # while each passed 5/5 when summoned alone. Seven mobs sharing a block crush
        # the fragile ones, so the tool was measuring its own crowding.
        #
        # ⚠️ A SURPRISINGLY BAD RESULT IS A PROMPT TO RE-CHECK THE QUERY, exactly as a
        # surprisingly clean one is. Believing this run would have deleted three mobs
        # that work, on evidence produced by the instrument rather than the game.
        # SPREAD is wider than any mob's hitbox and every position is still well within
        # @e range of the console.
        rcon(['summon %s %d %d %d {NoGravity:1b,Silent:1b,PersistenceRequired:1b,'
              'Tags:["%s"]}' % (e, X + n * SPREAD, Y, Z, t)
              for n, (e, t) in enumerate(zip(batch, tags))])
        time.sleep(SETTLE)
        txt = rcon(['attribute @e[tag=%s,limit=1] minecraft:generic.max_health get' % t
                    for t in tags])
        parts = txt.split('> ')
        got = {}
        for e, t in zip(batch, tags):
            seg = next((s for s in parts if ('tag=%s,' % t) in s), '')
            got[t] = ('No entity was found' not in seg) and ('is ' in seg)
        rcon(['kill @e[tag=%s]' % t for t in tags])
        if not got[tags[-1]]:
            broken.append(i)
            sys.stderr.write('  !! batch %d CONTROL FAILED - no verdicts taken\n' % i)
        else:
            for e, t in zip(batch[:-1], tags[:-1]):
                out[e] = got[t]
        sys.stderr.write('  %d/%d\n' % (min(i + batch_size, len(ids)), len(ids)))
    return out, broken


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ids', nargs='*', help='check these instead of the rosters')
    ap.add_argument('--out', default=OUT)
    a = ap.parse_args()

    ids = a.ids if a.ids else rostered()
    if not ids:
        # ⚠️ D-109 class. An empty roster read is a failure, never a clean run.
        print('!! NO IDS FOUND. That is a failure to read the rosters, not a pack')
        print('   with no mobs in it. Nothing was checked.')
        return 2

    # 🔴 PREFLIGHT. A probe against a dead server returns "No entity was found" for
    # everything - indistinguishable from every mob despawning. Refuse instead.
    ping = rcon(['list'], timeout=60)
    if 'players online' not in ping:
        print('!! CANNOT REACH THE SERVER. Refusing to run - against a dead server')
        print('   every mob reads as vanished, which is the same output as a real')
        print('   catastrophe and would be believed.')
        print('   rcon said: %s' % ping.strip()[:160])
        return 2

    print('=' * 66)
    print('SPAWN PERSISTENCE - %d id(s), control %s' % (len(ids), CONTROL))
    print('=' * 66)
    res, broken = check(ids)

    gone = sorted(k for k, v in res.items() if not v)
    ok = sorted(k for k, v in res.items() if v)
    untested = sorted(set(i for i in ids if i != CONTROL) - set(res))

    print('\n  SURVIVES: %d' % len(ok))
    if gone:
        print('\n  !! %d ID(S) VANISH ON ARRIVAL - a wave naming these gets quietly' % len(gone))
        print('     smaller, and every other check in this repo passes them:')
        for g in gone:
            print('       ' + g)
    if untested:
        print('\n  !  UNTESTED - their batch control failed. NOT a pass: %d' % len(untested))
        for u in untested:
            print('       ' + u)

    # A leftover sweep, reported rather than silent.
    left = rcon(['kill @e[tag=!nonexistent,type=!player,nbt={Tags:["vsp0_0"]}]'])
    if 'No entity' not in left and 'Killed' in left:
        print('\n  !  cleanup killed leftovers: %s' % left.strip()[:120])

    io.open(a.out, 'w', encoding='utf-8').write(json.dumps(
        {'survives': ok, 'vanishes': gone, 'untested': untested}, indent=1))
    print('\n  wrote %s' % a.out)

    if gone:
        return 1
    if untested or broken:
        return 3        # ⚠️ distinct from both clean and failing - re-run needed
    print('  OK - every rostered mob is still there a moment after it is placed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
