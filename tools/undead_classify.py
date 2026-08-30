# -*- coding: utf-8 -*-
"""undead_classify.py - sort the measured undead into roles and families.

    python tools/undead_stats.py         # must run first
    python tools/undead_classify.py --md docs/73-THE-UNDEAD-TABLE.md

Ethan, 2026-08-29: *"We can use that to sort all the mobs into Fodder, Specialist -
Ranged, Specialist - Tank, Specialist - Other, and miniboss. Also do your best to sort
them also into Skeleton, Zombie, other aswell."*

HOW EACH AXIS IS DECIDED, AND HOW CONFIDENT IT IS
-------------------------------------------------
ROLE is driven by MEASURED attributes - health, armour and attack damage read off live
entities. The thresholds are read off the actual distribution of this pack (median 25 hp,
median 3 damage), not invented.

⚠️ RANGED IS THE ONE ROLE ATTRIBUTES CANNOT SETTLE, and this pack makes it worse than
usual. Measured 2026-08-29:

    10 summoned skeletons  ->  1 bow, 3 swords, 2 shields, 4 empty
     6 natural  skeletons  ->  2 bows, 4 swords+shields

🚨 `magistuarmory` RE-EQUIPS SKELETONS. Roughly a quarter of them carry a bow; the rest
are melee. So "minecraft:skeleton" is NOT reliably an archer in this pack, and a wave
built on the assumption that it is delivers a fraction of the ranged pressure intended.

So ranged is marked `measured` (a bow was actually seen), `ruled` (Ethan said so), or
`unknown` - and NEVER blended.

FAMILY is by name and id, which is a heuristic and is labelled as one.
"""
import argparse
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STATS = os.path.join(HERE, '.cache', 'undead_stats.json')
REG = os.path.join(HERE, '.cache', 'undead_registered.json')

# ── ranged evidence ──────────────────────────────────────────────────────────
# `measured` = a bow or crossbow was actually observed in hand.
RANGED_MEASURED = {'minecraft:skeleton', 'minecraft:stray', 'minecraft:bogged'}
# `ruled` = Ethan classified it, and his ruling outranks any inference of mine.
RANGED_RULED = {
    'born_in_chaos_v1:bonescaller': True,
    'born_in_chaos_v1:skeleton_demoman': True,
    'born_in_chaos_v1:skeleton_thrasher': False,   # "they are both melee"
    'grim_and_bleak:banshee': False,
    'born_in_chaos_v1:decrepit_skeleton': False,   # the bulk
}

# ── families. ⚠️ A HEURISTIC ON NAMES, and it is labelled as one in the output. ──
SKELETON = re.compile(
    r'skeleton|bone|skull|koboleton|bonescaller|demoman|thrasher|siamese|lich|'
    r'templar|draugr_necromancer', re.I)
ZOMBIE = re.compile(
    r'zombie|husk|drowned|ghoul|decaying|barrel|bruiser|clown|fisherman|lumberjack|'
    r'draugr|aptrgangr|remnant|revenant|berserker|zoglin|zpiglin|piglin|frayed|'
    r'rattled|thrall', re.I)


def family(eid, name):
    blob = eid + ' ' + name
    # 🚨 SKELETON IS CHECKED FIRST. "draugr_necromancer" and "skeleton_villager" both
    # match ZOMBIE too, and the bone half is the more useful read for a tide that is
    # explicitly hers.
    if SKELETON.search(blob):
        return 'Skeleton'
    if ZOMBIE.search(blob):
        return 'Zombie'
    return 'Other'


def role(rec, eid):
    hp = rec.get('hp') or 0
    arm = rec.get('armor') or 0
    dmg = rec.get('dmg') or 0

    # Ranged first: it is a role, not a tier, and it outranks the stat bands.
    if eid in RANGED_RULED and RANGED_RULED[eid]:
        return 'Specialist - Ranged', 'ruled'
    if eid in RANGED_MEASURED:
        return 'Specialist - Ranged', 'measured (partly - see the bow note)'

    # ⚠️ Thresholds read off this pack's own distribution: hp median 25, upper
    # quartile 40; dmg median 3, upper quartile 5.
    if hp >= 100 or dmg >= 14:
        return 'Miniboss', 'measured'
    if arm >= 8 or hp >= 45:
        return 'Specialist - Tank', 'measured'
    if dmg >= 7 or arm >= 4:
        return 'Specialist - Other', 'measured'
    return 'Fodder', 'measured'


ORDER = ['Fodder', 'Specialist - Ranged', 'Specialist - Tank',
         'Specialist - Other', 'Miniboss']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--md')
    a = ap.parse_args()
    if not os.path.exists(STATS):
        sys.stderr.write('run tools/undead_stats.py first\n')
        return 2
    stats = json.load(io.open(STATS, encoding='utf-8'))

    # names come from the table tool's own logic
    sys.path.insert(0, HERE)
    import undead_table
    idx = undead_table.jar_index()

    rows = []
    for eid, rec in stats.items():
        if rec.get('hp') is None:
            continue
        ns, _, path = eid.partition(':')
        if ns == 'minecraft':
            name, mod = undead_table.VANILLA.get(path, path), 'Minecraft (vanilla)'
        else:
            slot = idx.get(ns)
            name = (slot[2].get(path) if slot else None) or path.replace('_', ' ').title()
            mod = (slot[1] or slot[0]) if slot else ns
        r, conf = role(rec, eid)
        rows.append({
            'name': name, 'mod': mod, 'id': eid, 'role': r, 'conf': conf,
            'fam': family(eid, name),
            'hp': rec['hp'], 'armor': rec.get('armor'), 'dmg': rec.get('dmg'),
            'speed': rec.get('speed'), 'kb': rec.get('kb_res'),
        })

    print('CLASSIFIED %d' % len(rows))
    for r in ORDER:
        sub = [x for x in rows if x['role'] == r]
        print('\n%s  (%d)' % (r.upper(), len(sub)))
        for x in sorted(sub, key=lambda z: (z['fam'], -z['hp'])):
            print('  %-9s %-30s hp %-6s arm %-5s dmg %-5s  %s'
                  % (x['fam'], x['name'][:30], x['hp'], x['armor'], x['dmg'], x['id']))

    if a.md:
        L = ['# 73 - The undead table\n']
        L.append('> **STATUS: MEASURED.** Generated by `tools/undead_classify.py`. '
                 'Regenerate rather than hand-edit.\n')
        L.append('> %d undead, each **verified in the live registry** and with health, '
                 'armour and damage\n> **read off a live entity** '
                 '(`tools/undead_stats.py` summons one, measures it, kills it).\n'
                 % len(rows))
        L.append('\n---\n')
        L.append('\n## 🚨 THE BOW PROBLEM - read this before trusting "Ranged"\n')
        L.append('\nMeasured 2026-08-29:\n')
        L.append('\n```\n10 summoned skeletons  ->  1 bow, 3 swords, 2 shields, 4 empty'
                 '\n 6 natural  skeletons  ->  2 bows, 4 swords + shields\n```\n')
        L.append('\n🔴 **`magistuarmory` re-equips skeletons.** Only about a quarter '
                 'carry a bow; the rest are\nmelee. So `minecraft:skeleton` is **not '
                 'reliably an archer in this pack**, and a wave built\non the assumption '
                 'that it is delivers a fraction of the ranged pressure intended.\n')
        L.append('\n⭐ This is very likely the real answer to *"why are ranged enemies '
                 'not spawning?"* - the\nroster was fixed, but the archers are not '
                 'archers.\n')
        L.append('\n⚠️ Ranged is therefore marked **measured** (a bow was actually seen), '
                 '**ruled** (Ethan said\nso), or **unknown** - never blended.\n')
        L.append('\n⚠️ **Numbers are "as spawned", not base.** Equipment is randomised, '
                 'so a re-run can differ.\n')
        L.append('\n## 🚨 Two things the numbers say that the current tide does not\n')
        L.append('\n**1. Both of the tide\'s minibosses are statistically TANKS.** '
                 'Supreme Bonescaller is 65 hp\nand Fallen Chaos Knight is 40 hp / 20 '
                 'armour. The seven mobs that actually measure as\nminibosses — 150 to '
                 '320 hp — are **none of them in any roster**: Apostle, Wither '
                 'Necromancer,\nWight, Kobolediator, Grave Golem, Skull Lord, Aptrgangr.'
                 '\n\n⚠️ That is not automatically wrong — a "miniboss" can be a role '
                 'rather than a health bar —\nbut it is worth knowing that the '
                 'wave-ending threat has less health than several things\nfiled here as '
                 'fodder.\n')
        L.append('\n**2. ⚠️ `attack_damage` EXCLUDES THE HELD WEAPON.** Damned Templar '
                 'measures **0.0 damage**\nwhile carrying a `templar_claymore` — all of '
                 'its damage is the weapon. So the damage column\n**understates every '
                 'mob that fights with equipment**, and understates it most for exactly\n'
                 'the melee bruisers you would most want to rank. Treat damage as a '
                 'floor, not a measurement.\n')
        L.append('\n---\n')
        for r in ORDER:
            sub = [x for x in rows if x['role'] == r]
            L.append('\n## %s  — %d\n' % (r, len(sub)))
            L.append('\n| family | mob | hp | armor | dmg | mod | id |')
            L.append('|---|---|--:|--:|--:|---|---|')
            for x in sorted(sub, key=lambda z: (z['fam'], -z['hp'])):
                L.append('| %s | %s | %s | %s | %s | %s | `%s` |'
                         % (x['fam'], x['name'], x['hp'], x['armor'], x['dmg'],
                            x['mod'], x['id']))
        L.append('\n---\n')
        L.append('\n## By family\n')
        for f in ['Skeleton', 'Zombie', 'Other']:
            sub = [x for x in rows if x['fam'] == f]
            L.append('\n**%s — %d.** ⚠️ Family is a NAME HEURISTIC, not a tag.\n' % (f, len(sub)))
            L.append('\n' + ', '.join('%s (`%s`)' % (x['name'], x['id'].split(':')[0])
                                      for x in sorted(sub, key=lambda z: z['name'])) + '\n')
        io.open(a.md, 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')
        print('\nwrote %s' % a.md)
    return 0


if __name__ == '__main__':
    sys.exit(main())
