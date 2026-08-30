# -*- coding: utf-8 -*-
"""undead_shortlist.py - which of the tagged undead could actually carry a wave.

    python tools/undead_census.py --json tools/.cache/undead.json
    python tools/undead_shortlist.py

WHY THIS IS A SEPARATE STEP
---------------------------
The census answers "what does this pack call undead". That is 150 ids, and a large
fraction of them would be wrong or dangerous in a tide:

  * SUMMONS. Goety's `*_servant` entities are minions of its necromancy system. They
    normally spawn with an OWNER, and an ownerless summon is at best confused and at
    worst an NPE every tick. ~25 of the 59 goety entries are these.
  * NOT-DESPAWN TWINS. Born in Chaos ships `x` and `x_not_despawn` for several mobs.
    They are the same creature; picking both just weights it twice.
  * PARTS AND PHASES. `siamese_skeletonsleft` / `right` are halves of one entity, and
    `supreme_bonescaller_stage_2` is a phase the boss enters, not something to place.
  * MOUNTS. skeleton_horse and zombie_horse are undead and are not a threat.
  * BOSSES. `minecraft:wither` is tagged undead. It is not a horde member.

⚠️ EXCLUSION IS BY NAME PATTERN, WHICH IS A HEURISTIC AND SAYS SO. Every exclusion is
printed WITH ITS REASON so the call can be argued with. A mob wrongly excluded is a lost
option; a mob wrongly INCLUDED is a crash in a live wave, so the rules lean strict.

⛔ THIS DOES NOT PROVE ANYTHING SPAWNS. It narrows 150 to a list worth probing against
the live registry. Attack type is not knowable from here at all.
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CENSUS = os.path.join(HERE, '.cache', 'undead.json')

# (regex, reason). Order matters only for which reason gets reported first.
EXCLUDE = [
    (r'_servant$', 'a Goety summon - expects an owner'),
    (r'_minion$', 'a summon - expects an owner'),
    (r'^.*:controlled_', 'a controlled summon - expects an owner'),
    (r'_not_despawn$', 'persistence twin of another entry - same creature'),
    (r'_stage_2$', 'a boss PHASE, not a placeable mob'),
    (r'skeletonsleft$|skeletonsright$', 'half of a composite entity'),
    (r'_horse$', 'a mount, not a threat'),
    (r'^minecraft:wither$', 'a boss'),
    (r'^cataclysm:(ancient_remnant|modern_remnant|maledictus|wadjet)$',
     'a Cataclysm BOSS - these have arenas and loot tables'),
    (r'^iceandfire:(dread_lich|gorgon)$', 'a boss'),
    (r'^born_in_chaos_v1:(lifestealer|lifestealer_true_form)$',
     'The Taker - reserved as a CLUE about Art, never an ordinary spawn'),
    (r'^born_in_chaos_v1:(spirit_guide|spirit_guide_assistant)$',
     'a friendly guide entity'),
    (r'^grim_and_bleak:bug_skinwalker$', 'the Skinwalker - its own system'),
    (r'^born_in_chaos_fc:shy_spirit$', 'passive'),
    (r'^easy_npc:', 'an NPC framework entity, not a mob'),
]


def why_excluded(eid):
    for pat, reason in EXCLUDE:
        if re.search(pat, eid):
            return reason
    return None


def main():
    if not os.path.exists(CENSUS):
        sys.stderr.write('run: python tools/undead_census.py --json %s\n' % CENSUS)
        return 2
    doc = json.load(io.open(CENSUS, encoding='utf-8'))
    ids = doc['ids']

    keep, drop = [], []
    for i in ids:
        r = why_excluded(i)
        (drop if r else keep).append((i, r))

    print('UNDEAD SHORTLIST')
    print('  %d tagged -> %d excluded -> %d candidates\n' % (len(ids), len(drop), len(keep)))

    by_ns = {}
    for i, _ in keep:
        by_ns.setdefault(i.split(':')[0], []).append(i)
    for ns in sorted(by_ns, key=lambda n: (-len(by_ns[n]), n)):
        print('  %-22s %d' % (ns, len(by_ns[ns])))
        for i in sorted(by_ns[ns]):
            print('      %s' % i)

    print('\n  EXCLUDED, with the reason - argue with any of these:')
    byreason = {}
    for i, r in drop:
        byreason.setdefault(r, []).append(i)
    for r in sorted(byreason, key=lambda k: -len(byreason[k])):
        print('  %-3d %s' % (len(byreason[r]), r))
        for i in sorted(byreason[r]):
            print('        %s' % i)

    out = os.path.join(HERE, '.cache', 'undead_shortlist.json')
    io.open(out, 'w', encoding='utf-8').write(json.dumps({
        'candidates': sorted(i for i, _ in keep),
        'excluded': {i: r for i, r in drop},
    }, indent=1))
    print('\n  wrote %s' % out)
    print('  ⛔ NOTHING HERE IS PROVEN TO SPAWN. Probe the candidates against the live')
    print('     registry before any of them goes in a roster.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
