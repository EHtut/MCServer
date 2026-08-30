# -*- coding: utf-8 -*-
"""undead_census.py - every entity this pack tags as undead, and where it came from.

    python tools/undead_census.py [--json out.json]

WHY THIS EXISTS
---------------
The tide is the goddess of death's and she is skeletons (docs/DEFECTS §T1). Making the
waves more dynamic without diluting that thesis needs a real answer to "what undead does
this pack actually contain", and nobody has one - the current rosters were assembled by
hand from whatever was remembered.

HOW IT WORKS, AND WHY IT IS THE JARS AND NOT THE SERVER
-------------------------------------------------------
Entity type tags MERGE. Vanilla declares `minecraft:undead`, and any mod may add to it by
shipping its own `data/minecraft/tags/entity_type/undead.json`. There is no single file to
read - the answer is the union across every jar on the server, plus the pack's datapacks.

The live server could answer this too, via a KubeJS script - but that needs a restart, and
one is deliberately being held. This is static, complete, and re-runnable at any time.

WHAT IT HANDLES
---------------
  * both `tags/entity_type/` (1.21) and the older `tags/entities/` layout
  * entries as plain strings, and as {"id": ..., "required": false} objects
  * NESTED TAG REFERENCES (`#modid:some_tag`), resolved transitively
  * `"replace": true`, which DISCARDS everything merged before it

WHAT IT CANNOT DO
-----------------
It reads what the pack DECLARES. It cannot tell you how a mob fights, whether it actually
spawns, or whether the entity id is registered - a tag may name an id that does not exist.
Cross-check anything you intend to use against the live registry.
"""
import argparse
import io
import json
import os
import re
import sys
import zipfile

INSTANCE = r'C:\MCServer\instance'
MODS = os.path.join(INSTANCE, 'mods')
REPO = os.path.dirname(os.path.abspath(os.path.join(__file__, '..')))

TAG_RE = re.compile(
    r'^data/([^/]+)/tags/(?:entity_type|entity_types|entities)/(.+)\.json$')


def parse_entries(doc):
    """Return (replace, [entry, ...]). Entries keep their leading # if a tag ref."""
    if not isinstance(doc, dict):
        return False, []
    out = []
    for e in doc.get('values', []) or []:
        if isinstance(e, str):
            out.append(e)
        elif isinstance(e, dict) and 'id' in e:
            out.append(str(e['id']))
    return bool(doc.get('replace', False)), out


def collect():
    """tagkey -> {'entries': [...], 'sources': {source: [entries]}}"""
    tags = {}

    def add(tagkey, source, doc):
        replace, entries = parse_entries(doc)
        slot = tags.setdefault(tagkey, {'entries': [], 'sources': {}})
        if replace:
            # ⚠️ "replace": true discards everything merged before it. Recorded rather
            # than silently applied - a mod that does this to minecraft:undead has
            # rewritten the pack's idea of undead and somebody should know.
            slot['entries'] = []
            slot.setdefault('replaced_by', []).append(source)
        slot['entries'].extend(entries)
        slot['sources'].setdefault(source, []).extend(entries)

    scanned = 0
    unreadable = []
    if os.path.isdir(MODS):
        for fn in sorted(os.listdir(MODS)):
            if not fn.endswith('.jar'):
                continue
            p = os.path.join(MODS, fn)
            try:
                with zipfile.ZipFile(p) as z:
                    scanned += 1
                    for name in z.namelist():
                        m = TAG_RE.match(name)
                        if not m:
                            continue
                        ns, tagpath = m.group(1), m.group(2)
                        try:
                            doc = json.loads(z.read(name).decode('utf-8-sig'))
                        except Exception:
                            continue
                        add('%s:%s' % (ns, tagpath), fn, doc)
            except Exception as e:
                unreadable.append((fn, str(e)[:60]))

    # 🔴 VANILLA ITSELF. The first run of this scan reported ZERO `minecraft:` ids,
    # which is impossible - zombie and skeleton are the tag's whole point. Vanilla's
    # data lives in the SERVER JAR under libraries/, not in mods/, so scanning mods
    # alone silently omits the single most important source. A census missing its
    # biggest contributor still LOOKS like a census.
    libs = os.path.join(INSTANCE, 'libraries', 'net', 'minecraft', 'server')
    vanilla_found = False
    if os.path.isdir(libs):
        for root, _d, files in os.walk(libs):
            for f in sorted(files):
                if not f.endswith('.jar'):
                    continue
                try:
                    with zipfile.ZipFile(os.path.join(root, f)) as z:
                        for name in z.namelist():
                            m = TAG_RE.match(name)
                            if not m:
                                continue
                            doc = json.loads(z.read(name).decode('utf-8-sig'))
                            add('%s:%s' % (m.group(1), m.group(2)), 'VANILLA/' + f, doc)
                            vanilla_found = True
                except Exception:
                    continue
    if not vanilla_found:
        unreadable.append(('VANILLA', 'no vanilla tags found under libraries/ - '
                           'the census is INCOMPLETE'))

    # The pack's own datapacks can add to the same tags.
    dp = os.path.join(REPO, 'pack', 'datapacks')
    for root, _dirs, files in os.walk(dp):
        for f in files:
            if not f.endswith('.json'):
                continue
            full = os.path.join(root, f)
            rel = full[len(dp) + 1:].replace('\\', '/')
            # strip the datapack folder name to get data/...
            parts = rel.split('/', 1)
            if len(parts) != 2:
                continue
            m = TAG_RE.match(parts[1])
            if not m:
                continue
            try:
                doc = json.loads(io.open(full, encoding='utf-8-sig').read())
            except Exception:
                continue
            add('%s:%s' % (m.group(1), m.group(2)),
                'datapack/' + parts[0], doc)

    return tags, scanned, unreadable


def resolve(tags, key, seen=None):
    """Flatten a tag to concrete ids, following #tag references."""
    if seen is None:
        seen = set()
    if key in seen:
        return set(), {key}          # cycle
    seen = seen | {key}
    slot = tags.get(key)
    if not slot:
        return set(), set()
    ids, missing = set(), set()
    for e in slot['entries']:
        if e.startswith('#'):
            sub, sm = resolve(tags, e[1:], seen)
            ids |= sub
            if not sub and e[1:] not in tags:
                missing.add(e[1:])
            missing |= sm
        else:
            ids.add(e)
    return ids, missing


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--json', help='also write the full result here')
    ap.add_argument('--tag', default='minecraft:undead')
    a = ap.parse_args()

    tags, scanned, unreadable = collect()
    ids, missing = resolve(tags, a.tag)

    print('UNDEAD CENSUS - tag %s' % a.tag)
    print('  %d jar(s) scanned, %d entity-type tag(s) found across the pack'
          % (scanned, len(tags)))
    if unreadable:
        print('  !! %d jar(s) COULD NOT BE READ:' % len(unreadable))
        for fn, err in unreadable:
            print('       %-50s %s' % (fn, err))

    slot = tags.get(a.tag)
    if not slot:
        print('  !! THE TAG DOES NOT EXIST IN ANY JAR. That is a FAILURE of this scan,')
        print('     not a pack with no undead - check the path regex.')
        return 2
    if slot.get('replaced_by'):
        print('  !! "replace": true was used by: %s' % ', '.join(slot['replaced_by']))
        print('     Everything merged before it was DISCARDED.')

    by_ns = {}
    for i in sorted(ids):
        by_ns.setdefault(i.split(':')[0], []).append(i)

    print('\n  %d entity id(s), across %d namespace(s):\n' % (len(ids), len(by_ns)))
    for ns in sorted(by_ns, key=lambda n: (-len(by_ns[n]), n)):
        print('  %-28s %d' % (ns, len(by_ns[ns])))
        for i in by_ns[ns]:
            print('      %s' % i)

    print('\n  WHO ADDED TO THIS TAG:')
    for src in sorted(slot['sources']):
        print('  %-52s %d entr(y/ies)' % (src, len(slot['sources'][src])))

    if missing:
        print('\n  !! %d referenced tag(s) DO NOT EXIST - their contents are absent:'
              % len(missing))
        for m in sorted(missing):
            print('       #%s' % m)

    print('\n  NOT ANSWERED HERE: whether these ids are REGISTERED, whether they spawn,')
    print('  and how any of them fight. A tag may name an id no mod provides.')

    if a.json:
        io.open(a.json, 'w', encoding='utf-8').write(json.dumps({
            'tag': a.tag, 'ids': sorted(ids),
            'sources': slot['sources'], 'missing_tags': sorted(missing),
        }, indent=1))
        print('\n  wrote %s' % a.json)
    return 0


if __name__ == '__main__':
    sys.exit(main())
