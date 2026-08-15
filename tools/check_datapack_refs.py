#!/usr/bin/env python3
"""Find references to uninstalled mods inside OUR OWN datapacks.

WHY THIS EXISTS
---------------
The fourth way a mod cut breaks the server is our own files naming the mod, and it
is the only one no dependency scan can see. It has now happened three times:

  legendary-monsters  -> mcserver_spawnbalance spawned legendary_monsters:bomber,
                         and the server died on "Failed to load registries".
  securitycraft       -> the Veldora guidebook used securitycraft:reinforced_stone
                         as an icon. Modonomicon syncs books on login, an
                         unresolvable item encodes as an empty ItemStack, and
                         "Empty ItemStack not allowed" kicked the player at join
                         with a netty error that names neither the mod nor the book.
  jurassic-reborn     -> leftover fossil blocks in loaded chunks (recoverable).

Run it after ANY mod cut, before restarting.

    python tools/check_datapack_refs.py
"""
import json
import pathlib
import re
import sys
import zipfile

BASE = pathlib.Path(__file__).resolve().parent.parent.parent
REPO = BASE / 'repo'
INST = BASE / 'instance'

# Namespaces that are never a mod id.
IGNORE = {
    'minecraft', 'neoforge', 'forge', 'c', 'common', 'mcserver', 'kubejs',
    'fabric', 'data', 'tag', 'item', 'block', 'entity_type', 'biome',
}

REF = re.compile(r'"([a-z][a-z0-9_]{2,}):[a-z0-9_./-]+"')


def installed_namespaces() -> set:
    """Every mod id actually present in the instance, from the jars."""
    ns = set()
    for jar in (INST / 'mods').glob('*.jar'):
        try:
            z = zipfile.ZipFile(jar)
        except Exception:
            continue
        for name in ('META-INF/mods.toml', 'META-INF/neoforge.mods.toml'):
            try:
                txt = z.read(name).decode('utf-8', 'ignore')
            except Exception:
                continue
            ns.update(re.findall(r'modId\s*=\s*"([^"]+)"', txt))
        # a jar may also carry data under its own namespace without declaring it
        for n in z.namelist():
            m = re.match(r'(?:data|assets)/([a-z0-9_.-]+)/', n)
            if m:
                ns.add(m.group(1))
    return ns


def main() -> int:
    have = installed_namespaces() | IGNORE
    if len(have) < 20:
        print('only %d namespaces found - is the instance populated?' % len(have))
        return 1

    roots = [REPO / 'pack' / 'datapacks', INST / 'world' / 'datapacks',
             REPO / 'pack' / 'kubejs', INST / 'kubejs']
    bad = {}
    scanned = 0
    for root in roots:
        if not root.is_dir():
            continue
        for f in root.rglob('*'):
            if not f.is_file() or f.suffix.lower() not in ('.json', '.json5', '.js', '.mcfunction'):
                continue
            scanned += 1
            try:
                txt = f.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                continue
            for ns in set(REF.findall(txt)):
                if ns not in have:
                    bad.setdefault(ns, []).append(f)

    print('scanned %d files against %d installed namespaces\n' % (scanned, len(have)))
    if not bad:
        print('  clean - no datapack references an uninstalled mod')
        return 0

    for ns in sorted(bad):
        print('  *** %s - NOT INSTALLED, referenced by %d file(s):' % (ns, len(bad[ns])))
        for f in sorted(bad[ns])[:6]:
            try:
                rel = f.relative_to(BASE)
            except ValueError:
                rel = f
            print('        %s' % rel)
    print('\n  An unresolvable ITEM in a Modonomicon book kicks players at login.')
    print('  An unresolvable ENTITY in a biome modifier fails registry load.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
