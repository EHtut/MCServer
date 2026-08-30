# -*- coding: utf-8 -*-
"""undead_classify.py - sort the measured undead into roles and families.

    python tools/undead_stats.py         # must run first
    python tools/undead_classify.py --md docs/73-THE-UNDEAD-TABLE.md

Ethan, 2026-08-29: *"We can use that to sort all the mobs into Fodder, Specialist -
Ranged, Specialist - Tank, Specialist - Other, and miniboss. Also do your best to sort
them also into Skeleton, Zombie, other aswell."* — and 2026-08-29:
*"lets sort the table into 3 different subfactions aswell: Skeleton, Zombie,
Ghost, other."*

HOW EACH AXIS IS DECIDED, AND HOW CONFIDENT IT IS
-------------------------------------------------
ROLE is driven by MEASURED attributes - health, armour and attack damage read off live
entities. The thresholds are read off the actual distribution of this pack (median 25 hp,
median 3 damage), not invented.

⚠️ RANGED IS THE ONE ROLE ATTRIBUTES CANNOT SETTLE, and this pack breaks it twice over.
Measured 2026-08-29 by summoning and reading HandItems:

    minecraft:skeleton   6 bows / 20 summons  (~30%)
    minecraft:stray      0 bows /  6 summons
    minecraft:bogged     0 bows /  6 summons

🚨 TWO CAUSES, AND ONLY ONE IS A MOD'S DOING:

  1. `config/epicknights/mobs_equipment.json5` lists `minecraft:skeleton` against ~13
     possible items, exactly ONE of which is `minecraft:bow`. That IS the 30%, and it
     is a config line rather than a mystery.
  2. stray and bogged are not in that config at all. They arrive empty-handed because
     `/summon` does not run the vanilla equip step - so in the wild they are archers,
     and summoned into a tide they are melee.

⭐ The tide summons, so the table classifies by what a WAVE actually gets. A fix exists
and is proven: `spawner.js` already accepts an `nbt` option, and
`{Tags:[...],NoAI:1b,HandItems:[{id:"minecraft:bow",count:1},{}]}` puts a bow in a stray.
⚠️ Key order matters - putting `Tags` after `HandItems` silently dropped the tag.

⚠️ STABILITY WAS CHECKED. Six mobs summoned three times each returned identical health
every time, so the numbers here are reproducible rather than a single lucky sample.

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
# 🔴 CLASSIFIED BY WHAT HAPPENS IN A TIDE, which is the only context that matters here.
# The tide summons (`spawner.js` uses /summon), so "is it an archer in the wild" is the
# wrong question - the question is whether it arrives holding a bow.
#
# MEASURED 2026-08-29, by summoning and reading HandItems:
#     minecraft:skeleton   6 bows / 20 summons   (~30%)
#     minecraft:stray      0 bows / 6  summons
#     minecraft:bogged     0 bows / 6  summons
#
# 🚨 TWO SEPARATE CAUSES, AND ONLY ONE IS A MOD'S FAULT:
#   · `config/epicknights/mobs_equipment.json5` lists minecraft:skeleton against ~13
#     possible items, exactly ONE of which is minecraft:bow. That is the 30%.
#   · stray and bogged are NOT in that config at all - they come out empty-handed
#     because /summon does not run the vanilla equip step. In the wild they are
#     archers; summoned into a tide they are melee.
RANGED_SUMMONED = {
    'minecraft:skeleton': '~30% (6/20 summons carried a bow)',
}
# ⚠️ ARCHERS BY DESIGN THAT ARRIVE UNARMED WHEN SUMMONED. They are filed by their
# measured STATS instead, because that is what a tide would actually get.
RANGED_IF_EQUIPPED = {
    'minecraft:stray': '0/6 summons carried a bow - needs forced NBT',
    'minecraft:bogged': '0/6 summons carried a bow - needs forced NBT',
}
# `ruled` = Ethan classified it, and his ruling outranks any inference of mine.
# ⚠️ These two show EMPTY hands, and that is expected rather than contradictory: their
# ranged attacks are mod code (summoned bones, thrown charges), not a held bow.
RANGED_RULED = {
    'born_in_chaos_v1:bonescaller': True,
    'born_in_chaos_v1:skeleton_demoman': True,
    'born_in_chaos_v1:skeleton_thrasher': False,   # "they are both melee"
    'grim_and_bleak:banshee': False,
    'born_in_chaos_v1:decrepit_skeleton': False,   # the bulk
}

# ── families. ⚠️ A HEURISTIC ON NAMES, and it is labelled as one in the output. ──
# ⭐ FOUR SUBFACTIONS, Ethan 2026-08-29: Skeleton · Zombie · Ghost · other.
SKELETON = re.compile(
    r'skeleton|bone|skull|koboleton|bonescaller|demoman|thrasher|siamese|lich|'
    r'templar|draugr_necromancer', re.I)
GHOST = re.compile(
    r'ghost|wraith|spirit|phantom|haunt|banshee|reaper|shade|spect|apparition|'
    r'poltergeist|soul|revenant', re.I)
ZOMBIE = re.compile(
    r'zombie|husk|drowned|ghoul|decaying|barrel|bruiser|clown|fisherman|lumberjack|'
    r'draugr|aptrgangr|remnant|berserker|zoglin|zpiglin|piglin|frayed|'
    r'rattled|thrall', re.I)


def family(eid, name):
    blob = eid + ' ' + name
    # 🚨 ORDER IS LOAD-BEARING and each position is a decision:
    #
    #   SKELETON first - "draugr_necromancer" and "haunted_skull" match other patterns
    #   too, and the BONE half is the more useful read for a tide that is explicitly
    #   hers. A skull is hers before it is anything else.
    #
    #   GHOST before ZOMBIE - "ignited_revenant" is a revenant (a returned spirit)
    #   rather than a corpse, and "possessed_phantom" would otherwise never be reached.
    #
    #   ⚠️ These are NAME MATCHES, not tags. Nothing in the game says "ghost"; this is
    #   a reading of what each mob is called, and it can be argued with.
    if SKELETON.search(blob):
        return 'Skeleton'
    if GHOST.search(blob):
        return 'Ghost'
    if ZOMBIE.search(blob):
        return 'Zombie'
    return 'Other'


def role(rec, eid):
    hp = rec.get('hp') or 0
    arm = rec.get('armor') or 0
    dmg = rec.get('dmg') or 0

    # Ranged first: it is a role, not a tier, and it outranks the stat bands.
    if eid in RANGED_RULED and RANGED_RULED[eid]:
        return 'Specialist - Ranged', "ruled by Ethan (attack is mod code, not a bow)"
    if eid in RANGED_SUMMONED:
        return 'Specialist - Ranged', RANGED_SUMMONED[eid]
    # ⚠️ NOT filed as ranged. An archer that arrives with empty hands is a melee mob
    # until something puts a bow in them - see RANGED_IF_EQUIPPED.

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
            'note': RANGED_IF_EQUIPPED.get(eid, '') or (RANGED_SUMMONED.get(eid, '') if eid in RANGED_SUMMONED else ''),
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
        L.append('\n**The tide summons**, so the only question that matters is whether a '
                 'mob arrives\n**holding a bow**. Measured 2026-08-29:\n')
        L.append('\n```\nminecraft:skeleton   6 bows / 20 summons  (~30%)\n'
                 'minecraft:stray      0 bows /  6 summons\n'
                 'minecraft:bogged     0 bows /  6 summons\n```\n')
        L.append('\n### 🚨 Two causes, and only one is a mod\'s doing\n')
        L.append('\n**1. `config/epicknights/mobs_equipment.json5`** lists '
                 '`minecraft:skeleton` against ~13\npossible items, **exactly one of '
                 'which is `minecraft:bow`**. That is the 30%, and it is a\nconfig line '
                 'rather than a mystery — editable, and the melee entries could simply '
                 'be\nremoved from the skeleton row.\n')
        L.append('\n**2. Stray and bogged are not in that config at all.** They arrive '
                 'empty-handed because\n`/summon` does not run the vanilla equip step. '
                 '**In the wild they are archers; summoned\ninto a tide they are '
                 'melee.** ⚠️ This refutes an earlier proposal of mine in `docs/72`,\n'
                 'which suggested adding them *as archers*. They would have added none.\n')
        L.append('\n### ⭐ A fix exists and is proven\n')
        L.append('\n`spawner.js` already accepts an `nbt` option. This puts a bow in a '
                 'stray:\n')
        L.append('\n```\n{Tags:[...],NoAI:1b,HandItems:[{id:"minecraft:bow",count:1},{}]}'
                 '\n```\n')
        L.append('\n⚠️ **Key order matters** — putting `Tags` *after* `HandItems` '
                 'silently dropped the tag,\nwhich cost a round of debugging.\n')
        L.append('\n⭐ This is very likely the real answer to *"why are ranged enemies '
                 'not spawning?"* — the\nroster was fixed in T1, but **the archers are '
                 'not archers**.\n')
        L.append('\n⚠️ Ranged is therefore marked with its **measured rate**, or as '
                 '**ruled by Ethan** (for mobs\nwhose ranged attack is mod code rather '
                 'than a held bow) — never blended.\n')
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
        L.append('\n## ⭐ THE FOUR WAVE VARIATIONS — Ethan, 2026-08-29\n')
        L.append('\n> *"Tides are scaled by difficulty depending on god trust through a '
                 'stepped ladder but\n> there are 3 main variations"* — four are listed, '
                 'and the roles below map onto them\n> directly.\n')
        L.append('\n| wave | composition |')
        L.append('|---|---|')
        L.append('| **General** | fodder + light specialists |')
        L.append('| **Horde** | fodder + **tank** specialists · ⛔ no ranged |')
        L.append('| **Ranged** | *low* fodder + **high** ranged specialists |')
        L.append('| **Miniboss** | *high* fodder + a miniboss |')
        L.append('\n### 🚨 This is NOT what is live, and two of the four change meaning\n')
        L.append('\n| | live in `tide.js` | his spec |')
        L.append('|---|---|---|')
        L.append('| `horde` | bulk ONLY, 0% ranged | fodder + **tank specialists** |')
        L.append('| `general` | bulk + archers at 15% | fodder + **light** specialists |')
        L.append('| `specialist` | 40% ranged | **renamed `Ranged`** — low fodder, high ranged |')
        L.append('| `miniboss` | bulk + a boss | **high** fodder + a miniboss |')
        L.append('\n⚠️ So this is a rename *and* a re-composition, not a tuning pass. '
                 '`specialist` disappears\nas a name.\n')
        L.append('\n### 🔴 And the Ranged wave has a problem the table just exposed\n')
        L.append('\n*"Low fodder + high ranged specialists"* needs a deep ranged pool. '
                 '**There are three\nranged mobs in the entire pack**, and one of them '
                 '(`minecraft:skeleton`) arrives armed only\nabout 30% of the time.\n')
        L.append('\n⭐ A Ranged wave built today would be **mostly melee skeletons** — '
                 'the exact failure the\nbow section above describes, but concentrated '
                 'into the one wave type whose entire\nidentity is being shot at. '
                 '**The bow fix is a prerequisite for this variation, not a\npolish '
                 'item.**\n')
        L.append('\n---\n')
        for r in ORDER:
            sub = [x for x in rows if x['role'] == r]
            L.append('\n## %s  — %d\n' % (r, len(sub)))
            L.append('\n| family | mob | hp | armor | dmg | mod | id |')
            L.append('|---|---|--:|--:|--:|---|---|')
            for x in sorted(sub, key=lambda z: (z['fam'], -z['hp'])):
                L.append('| %s | %s | %s | %s | %s | %s | `%s` |'
                         % (x['fam'], x['name'] + (' ⚠️' if x['note'] else ''),
                            x['hp'], x['armor'], x['dmg'], x['mod'], x['id']))
        L.append('\n---\n')
        L.append('\n## By family\n')
        for f in ['Skeleton', 'Zombie', 'Ghost', 'Other']:
            sub = [x for x in rows if x['fam'] == f]
            L.append('\n**%s — %d.** ⚠️ Family is a NAME HEURISTIC, not a tag.\n' % (f, len(sub)))
            L.append('\n' + ', '.join('%s (`%s`)' % (x['name'], x['id'].split(':')[0])
                                      for x in sorted(sub, key=lambda z: z['name'])) + '\n')
        io.open(a.md, 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')
        print('\nwrote %s' % a.md)
    return 0


if __name__ == '__main__':
    sys.exit(main())
