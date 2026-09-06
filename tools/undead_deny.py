#!/usr/bin/env python
"""undead_deny.py - keep the ambient-undead deny rule true as mods change.

    python tools/undead_deny.py            report what the rule should contain
    python tools/undead_deny.py --write    rewrite it in the live spawn.json

Ethan, 2026-09-06:

    "ambient spawning. It should only be non-undead mobs. Undead mobs only spawn during
     tides or scripted events"

== WHY THIS IS A TOOL AND NOT A HAND-EDITED LIST =============================

The list is 101 entity types and it is NOT a judgement call - it is the `minecraft:undead`
entity-type tag, which eight installed mods contribute to. Hand-maintaining it means it is
wrong the first time a mod is added or updated, and wrong SILENTLY: an untagged new undead
just starts wandering the surface and nothing reports it.

So the list is READ from the jars every time, and this tool is the check.

== THE ORDER OF THE RULE IS THE WHOLE RULE ==================================

In Control takes the FIRST matching rule. The deny goes AFTER the SPAWNER and STRUCTURE
passthroughs, never before, or every dungeon spawner and every structure-generated undead
goes inert. spawn.json's own README states the principle it would break:

    "suppress AMBIENT spawning, never DELIBERATE placement"

And scripted spawns need no allow-rule: tide.js and the event system place mobs with
COMMANDS, and In Control never sees a command-spawned entity. "Undead only during tides or
scripted events" is what REMAINS once ambient is denied - it is not something to add.

== ONE THING THIS CANNOT SEE ================================================

A mod whose undead are not in the `minecraft:undead` tag. Those are invisible here by
definition, and the only symptom is a skeleton on a hill. `rottencreatures` was checked by
hand on 2026-09-06 and contributes nothing to the tag; if its mobs ever appear ambiently,
that is where to look first.
"""

from __future__ import annotations

import io
import json
import os
import shutil
import sys
import zipfile

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INST = r'C:\MCServer\instance'
MODS = os.path.join(INST, 'mods')
SPAWN = os.path.join(INST, 'config', 'incontrol', 'spawn.json')

# VANILLA'S OWN UNDEAD live in the server jar, not in any mod, so the tag scan below
# cannot see them. They are listed rather than read because the server jar's layout is
# not ours to depend on - and because this list does not change between 1.21.x releases.
VANILLA = [
    'minecraft:zombie', 'minecraft:husk', 'minecraft:drowned', 'minecraft:zombie_villager',
    'minecraft:zombified_piglin', 'minecraft:skeleton', 'minecraft:stray', 'minecraft:bogged',
    'minecraft:wither_skeleton', 'minecraft:phantom', 'minecraft:zoglin', 'minecraft:wither',
    'minecraft:skeleton_horse', 'minecraft:zombie_horse', 'minecraft:giant',
]

MARK = 'AMBIENT UNDEAD DENY'


def scan():
    """Every entity type in the minecraft:undead tag, plus vanilla's own."""
    found, srcs = set(VANILLA), {}
    for f in sorted(os.listdir(MODS)):
        if not f.endswith('.jar'):
            continue
        try:
            z = zipfile.ZipFile(os.path.join(MODS, f))
        except Exception:
            continue
        for n in z.namelist():
            if not (n.endswith('tags/entity_type/undead.json')
                    or n.endswith('tags/entity_types/undead.json')):
                continue
            try:
                d = json.loads(z.read(n).decode('utf-8'))
            except Exception:
                continue
            for v in d.get('values', []):
                s = v if isinstance(v, str) else v.get('id', '')
                if s and not s.startswith('#'):
                    found.add(s)
                    srcs.setdefault(f, set()).add(s)
    return sorted(found), srcs


def main():
    write = '--write' in sys.argv
    undead, srcs = scan()
    print('%d undead entity types (%d mods contribute to the tag, + %d vanilla)'
          % (len(undead), len(srcs), len(VANILLA)))
    for k, v in sorted(srcs.items(), key=lambda kv: -len(kv[1]))[:6]:
        print('   %-46s %d' % (k[:46], len(v)))

    rules = json.load(io.open(SPAWN, encoding='utf-8'))
    cur = next((r for r in rules if MARK in str(r.get('_comment', ''))), None)
    if cur is None:
        print('\nNO DENY RULE IN spawn.json AT ALL - ambient undead are unrestricted.')
    else:
        have = set(cur.get('mob') or [])
        miss, extra = set(undead) - have, have - set(undead)
        if not miss and not extra:
            print('\nthe live rule matches the tags exactly.')
            return 0
        # A MOD ADDED SINCE THE RULE WAS WRITTEN is the case this exists to catch, and it
        # is silent in game: the new undead simply starts spawning on the surface.
        if miss:
            print('\n%d UNDEAD NOT DENIED (they can spawn ambiently right now):' % len(miss))
            for m in sorted(miss)[:12]:
                print('   ' + m)
        if extra:
            print('\n%d denied entities are no longer tagged undead (mod removed?):' % len(extra))
            for m in sorted(extra)[:8]:
                print('   ' + m)

    if not write:
        print('\nreport only. re-run with --write to update spawn.json.')
        return 1

    # ORDER IS THE RULE. After SPAWNER/STRUCTURE, never before - see the header.
    rules = [r for r in rules if MARK not in str(r.get('_comment', ''))]
    at = 0
    for i, r in enumerate(rules):
        if r.get('spawntype') in ('SPAWNER', 'STRUCTURE'):
            at = i + 1
    rules.insert(at, {
        'mob': undead,
        'result': 'deny',
        '_comment': (MARK + " - Ethan 2026-09-06: ambient spawning is non-undead only; "
                     "undead arrive via tides or scripted events. Regenerate with "
                     "tools/undead_deny.py --write."),
    })
    shutil.copy(SPAWN, SPAWN + '.preundead.bak')
    blob = (json.dumps(rules, indent=2, ensure_ascii=False) + '\n').encode('utf-8')
    open(SPAWN + '.tmp', 'wb').write(blob)
    os.replace(SPAWN + '.tmp', SPAWN)
    print('\nwrote the rule at index %d of %d. RESTART for In Control to reload it.' % (at, len(rules)))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
