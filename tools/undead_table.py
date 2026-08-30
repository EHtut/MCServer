# -*- coding: utf-8 -*-
"""undead_table.py - the registered undead as name / mod / id, for faction building.

    python tools/undead_probe.py          # must run first
    python tools/undead_table.py [--md docs/73-THE-UNDEAD-TABLE.md]

WHY
---
The census answers "which ids exist". Building tide factions by difficulty and theme
needs the READABLE NAME and the SOURCE MOD next to each id, because `goety:frayed` and
`cataclysm:aptrgangr` tell you nothing about what you are putting in a wave.

WHERE THE NAMES COME FROM
-------------------------
`assets/<namespace>/lang/en_us.json`, key `entity.<namespace>.<path>` - read out of the
jar that ships the entity. The mod's own display name comes from
`META-INF/neoforge.mods.toml` (or the older `mods.toml`).

⚠️ A LANG ENTRY IS NOT PROOF OF REGISTRATION - this project has been burned by exactly
that. It is not being used as proof here: existence was already established by
`undead_probe.py` against the live registry. Lang is only supplying a label.

⚠️ VANILLA'S LANG LIVES IN THE CLIENT JAR, which a server does not have. The eleven
vanilla mobs are therefore labelled from a small explicit table, and it SAYS SO rather
than silently rendering them as raw ids.
"""
import argparse
import io
import json
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
MODS = r'C:\MCServer\instance\mods'
REG = os.path.join(HERE, '.cache', 'undead_registered.json')

# ⚠️ EXPLICIT, because the server has no client lang. Named as a known gap rather than
# left to fall through to the raw id.
VANILLA = {
    'zombie': 'Zombie', 'skeleton': 'Skeleton', 'husk': 'Husk', 'drowned': 'Drowned',
    'stray': 'Stray', 'bogged': 'Bogged', 'wither_skeleton': 'Wither Skeleton',
    'zombified_piglin': 'Zombified Piglin', 'zombie_villager': 'Zombie Villager',
    'phantom': 'Phantom', 'zoglin': 'Zoglin',
}


def jar_index():
    """namespace -> (jarfile, mod display name, {entitypath: name})"""
    out = {}
    if not os.path.isdir(MODS):
        return out
    for fn in sorted(os.listdir(MODS)):
        if not fn.endswith('.jar'):
            continue
        try:
            with zipfile.ZipFile(os.path.join(MODS, fn)) as z:
                names = z.namelist()

                # the mod's own display name
                disp = None
                for meta in ('META-INF/neoforge.mods.toml', 'META-INF/mods.toml'):
                    if meta in names:
                        try:
                            t = z.read(meta).decode('utf-8', 'replace')
                            # ⚠️ CLOSE ON THE SAME QUOTE THAT OPENED. The first version
                            # accepted either, so "L_Ender's Cataclysm" was truncated at
                            # the apostrophe to "L_Ender", and "Iron's Spells 'n
                            # Spellbooks" to "Iron". A name that is merely WRONG looks
                            # exactly like a name that is short.
                            m = re.search(r'^\s*displayName\s*=\s*(["\'])(.+?)\1',
                                          t, re.M)
                            if m:
                                disp = m.group(2)
                        except Exception:
                            pass
                        break

                for n in names:
                    m = re.match(r'^assets/([^/]+)/lang/en_us\.json$', n)
                    if not m:
                        continue
                    ns = m.group(1)
                    try:
                        doc = json.loads(z.read(n).decode('utf-8-sig'))
                    except Exception:
                        continue
                    ents = {}
                    pre = 'entity.%s.' % ns
                    for k, v in doc.items():
                        if k.startswith(pre) and isinstance(v, str):
                            ents[k[len(pre):]] = v
                    if not ents:
                        continue
                    # ⚠️ A namespace can appear in several jars (an addon shipping lang
                    # for its parent). MERGE rather than overwrite, or the last jar
                    # scanned silently wins.
                    if ns in out:
                        out[ns][2].update(ents)
                        if disp and not out[ns][1]:
                            out[ns] = (out[ns][0], disp, out[ns][2])
                    else:
                        out[ns] = (fn, disp, ents)
        except Exception:
            continue
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--md', help='write a markdown table here')
    a = ap.parse_args()

    if not os.path.exists(REG):
        sys.stderr.write('run tools/undead_probe.py first\n')
        return 2
    ids = json.load(io.open(REG, encoding='utf-8'))['registered']
    idx = jar_index()

    rows, unnamed = [], []
    for eid in sorted(ids):
        ns, _, path = eid.partition(':')
        if ns == 'minecraft':
            name = VANILLA.get(path)
            mod = 'Minecraft (vanilla)'
        else:
            slot = idx.get(ns)
            name = slot[2].get(path) if slot else None
            mod = (slot[1] or slot[0]) if slot else ns
        if not name:
            unnamed.append(eid)
            # \u26a0\ufe0f Fall back to a de-slugged id, and MARK it, so a missing lang entry
            # is visible instead of looking like a real name.
            name = path.replace('_', ' ').title() + ' *'
        rows.append((name, mod, eid, ns))

    bymod = {}
    for name, mod, eid, ns in rows:
        bymod.setdefault((mod, ns), []).append((name, eid))

    print('REGISTERED UNDEAD - %d, across %d mod(s)\n' % (len(rows), len(bymod)))
    for (mod, ns) in sorted(bymod, key=lambda k: (-len(bymod[k]), k[0])):
        print('%s   [%s]  %d' % (mod, ns, len(bymod[(mod, ns)])))
        for name, eid in sorted(bymod[(mod, ns)]):
            print('    %-34s %s' % (name, eid))
        print('')
    if unnamed:
        print('!  %d had NO lang entry and are shown de-slugged with a *:' % len(unnamed))
        for u in unnamed:
            print('     %s' % u)

    if a.md:
        L = []
        L.append('# 73 - The undead table\n')
        L.append('> **STATUS: REFERENCE.** Generated by `tools/undead_table.py`. '
                 'Regenerate rather than hand-edit.\n')
        L.append('> %d registered undead across %d mods. Every id was verified against '
                 'the live registry\n> by `tools/undead_probe.py`; names come from each '
                 "mod's own `en_us.json`.\n" % (len(rows), len(bymod)))
        L.append('> \u26a0\ufe0f A name marked `*` had **no lang entry** and is de-slugged from '
                 'the id.\n')
        L.append('> \u26a0\ufe0f **Attack type, health and behaviour are NOT here** and are not '
                 'knowable from a jar scan.\n')
        L.append('\n---\n')
        L.append('\n## ⭐ Why this is grouped BY MOD\n')
        L.append('\nEthan, 2026-08-29: *"the idea is we create more tide factions based '
                 'on difficulty and just theming."*\n')
        L.append('\n\U0001f511 **A mod IS a theme.** Each of these rosters was designed by '
                 'one person to hang together,\nso grouping by mod gives coherent '
                 'factions for free - and a faction drawn from a single\nmod will look '
                 'and sound like it belongs together in a way a hand-picked mix will '
                 'not.\n')
        L.append('\n| mod | the theme it already has |')
        L.append('|---|---|')
        L.append('| **Born in Chaos** | carnival horror - clowns, fishermen, '
                 'lumberjacks, bonecallers. Hers already |')
        L.append("| **L_Ender's Cataclysm** | norse draugr and the ignited - the heavy "
                 'end |')
        L.append('| **Ice and Fire** | the DREAD line - thralls, ghouls, the knights of '
                 'a lich |')
        L.append('| **Goety** | necromancy - ⚠️ most of these RAISE MORE UNDEAD |')
        L.append('| **Occultism** | the Wild Hunt - ⚠️ all twelve are event mobs |')
        L.append('| **Grim & bleak** | folk horror - banshee, templar, ghoul |')
        L.append('| **Vanilla** | the baseline everyone reads instantly |')
        L.append('\n⚠️ **DIFFICULTY IS NOT IN THIS TABLE AND CANNOT BE SCANNED FOR.** '
                 'Health, damage and attack\ntype live in mod code, not in data files. '
                 'Any difficulty tiering has to be play-tested\nor read off each '
                 "mod's own documentation - it is not derivable from here.\n")
        for (mod, ns) in sorted(bymod, key=lambda k: (-len(bymod[k]), k[0])):
            L.append('\n## %s\n' % mod)
            L.append('`%s` - %d entities\n' % (ns, len(bymod[(mod, ns)])))
            L.append('\n| mob | id |')
            L.append('|---|---|')
            for name, eid in sorted(bymod[(mod, ns)]):
                L.append('| %s | `%s` |' % (name, eid))
        io.open(a.md, 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')
        print('\nwrote %s' % a.md)
    return 0


if __name__ == '__main__':
    sys.exit(main())
