# -*- coding: utf-8 -*-
"""undead_stats.py - measure health, armour, damage and weapons off the LIVE server.

    python tools/undead_probe.py     # must run first
    python tools/undead_stats.py

WHY THIS EXISTS
---------------
A jar scan cannot tell you how hard a mob hits. Attributes CAN be read from a live
entity, so this summons one of each undead, reads it, and kills it.

⚠️ IT MEASURES "AS SPAWNED", NOT "BASE", AND THAT IS THE MORE USEFUL NUMBER. A summoned
zombie in this pack arrives holding a `magistuarmory:rusted_bastardsword` - finalizeSpawn
equipment is applied - so the damage figure is what you would actually fight, not what the
mod's code declares. It also means a re-run can differ slightly for anything with random
gear, and the tool says so rather than pretending the numbers are exact.

⛔ WHAT IT STILL CANNOT SEE: spellcasting, summoning, teleporting, exploding. Those are
code. `HandItems` is the one honest ability signal available - a bow or crossbow is REAL
evidence of ranged, not a guess from the name.

🚨 SAFETY
---------
Every mob is summoned with NoAI, NoGravity and Silent, at the CONSOLE'S OWN POSITION
(entities further away are not reachable by `@e` here - measured, see below), carries a
unique tag, and is killed in the same batch it was summoned in. A final sweep kills
anything left over and REPORTS what it had to clean up.

⚠️ MEASURED, NOT ASSUMED: summoning at 3000/3000 - even force-loaded - produced "No entity
was found" for every read. Distance from the command source is what matters, so the probe
happens where the console is.
"""
import argparse
import io
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REG = os.path.join(HERE, '.cache', 'undead_registered.json')
OUT = os.path.join(HERE, '.cache', 'undead_stats.json')

# The console's own position. ⚠️ Not a preference - a requirement, see the header.
X, Y, Z = -80, 250, 160

ATTRS = [
    ('hp', 'minecraft:generic.max_health'),
    ('armor', 'minecraft:generic.armor'),
    ('dmg', 'minecraft:generic.attack_damage'),
    ('tough', 'minecraft:generic.armor_toughness'),
    ('speed', 'minecraft:generic.movement_speed'),
    ('kb_res', 'minecraft:generic.knockback_resistance'),
]

VALUE = re.compile(r'\bis\s+(-?[0-9.]+)\s*$', re.M)


def rcon(cmds, timeout=240):
    p = subprocess.run([sys.executable, os.path.join(HERE, 'rcon.py')] + cmds,
                       capture_output=True, text=True, timeout=timeout)
    return p.stdout


def main():
    # ⭐ PARAMETERISED 2026-08-30, alongside undead_probe.py, so any faction can be
    # measured with the same instrument. Ethan: *"you probably need to do a run for
    # spiders too for wall."* Same safety rules, same resumability, one file.
    global OUT
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='src', default=REG,
                    help='JSON: {"registered": [...]} or a bare list of ids')
    ap.add_argument('--out', dest='dst', default=OUT)
    a = ap.parse_args()
    OUT = a.dst

    if not os.path.exists(a.src):
        sys.stderr.write('no such id list: %s\n' % a.src)
        sys.stderr.write('for the undead run: tools/undead_probe.py first\n')
        return 2
    doc = json.load(io.open(a.src, encoding='utf-8'))
    ids = doc['registered'] if isinstance(doc, dict) else list(doc)
    # ⚠️ D-109 class: an empty list is a failure to read, not a clean run.
    if not ids:
        sys.stderr.write('!! %s contained NO ids - a failure to read, not a result.\n'
                         % a.src)
        return 2

    # 🔴 PREFLIGHT. The first run of this tool happened while the server was down
    # (a client-only mod had failed the boot) and it cheerfully produced 89 rows of
    # nulls - a table of nothing that LOOKS like a measurement of nothing. "The server
    # is unreachable" and "these mobs have no attributes" must never be the same result.
    ping = rcon(['list'], timeout=60)
    if 'players online' not in ping:
        print('!! CANNOT REACH THE SERVER. Refusing to run - a probe against a dead')
        print('   server returns nulls that are indistinguishable from real readings')
        print('   of zero. Bring it up and re-run.')
        print('   rcon said: %s' % ping.strip()[:160])
        return 1

    # ⭐ RESUMABLE. The server restarted twice during the first two runs, so a tool
    # that starts from zero every time never finishes. Anything already measured is
    # kept; only the gaps are asked for again.
    stats = {}
    if os.path.exists(OUT):
        try:
            stats = json.load(io.open(OUT, encoding='utf-8'))
        except Exception:
            stats = {}
    todo = [e for e in ids if stats.get(e, {}).get('hp') is None]
    if not todo:
        print('OK  all %d already measured - nothing to do.' % len(ids))
        todo = []
    else:
        print('resuming: %d already measured, %d to go'
              % (len(ids) - len(todo), len(todo)))

    BATCH = 4
    for start in range(0, len(todo), BATCH):
        chunk = todo[start:start + BATCH]
        cmds = []
        for n, eid in enumerate(chunk):
            tag = 'vst%d' % (start + n)
            cmds.append('summon %s %d %d %d {NoAI:1b,NoGravity:1b,Silent:1b,'
                        'PersistenceRequired:1b,Tags:["%s"]}' % (eid, X, Y, Z, tag))
            for _key, attr in ATTRS:
                cmds.append('attribute @e[tag=%s,limit=1] %s get' % (tag, attr))
            cmds.append('data get entity @e[tag=%s,limit=1] HandItems' % tag)
            # 🚨 Killed in the SAME batch it was summoned in, not at the end.
            cmds.append('kill @e[tag=%s]' % tag)
        try:
            out = rcon(cmds)
        except Exception as e:
            sys.stderr.write('batch at %d failed: %s\n' % (start, e))
            continue

        if start == 0 and os.environ.get('VDEBUG'):
            sys.stderr.write('--- RAW len=%d ---\n' % len(out))
            sys.stderr.write(out[:600])
            sys.stderr.write('\n--- END RAW ---\n')
        # Attribute each reply to the command that produced it, by the echoed "> cmd".
        blocks = re.split(r'^> ', out, flags=re.M)
        byname = {}
        for b in blocks:
            m = re.match(r'(attribute|data get entity) @e\[tag=(vst\d+)[,\]]', b)
            if m:
                byname.setdefault(m.group(2), []).append(b)
            m2 = re.match(r'summon (\S+)', b)
            if m2:
                byname.setdefault('summon:' + m2.group(1), []).append(b)

        # 🔴 THE SERVER CAN GO AWAY MID-RUN, AND IT DID. A restart landed partway
        # through the first full pass and 56 of 89 came back "summon failed" - which is
        # NOT what happened. They were never asked. The preflight only checked once, at
        # the start, so a run that began healthy silently produced a half-poisoned table.
        #
        # ⚠️ "unreachable" is now recorded as UNREACHABLE, distinct from a real
        # failure, and those ids are retried rather than written off.
        if 'cannot reach RCON' in out or not out.strip():
            for n, eid in enumerate(chunk):
                stats[eid] = {'id': eid, 'summoned': None, 'unreachable': True,
                              'hands': []}
            sys.stderr.write('  !! server unreachable at %d - marked for retry\n' % start)
            continue

        for n, eid in enumerate(chunk):
            tag = 'vst%d' % (start + n)
            rec = {'id': eid}
            blocks_for = byname.get(tag, [])
            summoned = any('Summoned new' in b
                           for b in byname.get('summon:' + eid, []))
            rec['summoned'] = summoned
            for i, (key, _attr) in enumerate(ATTRS):
                b = blocks_for[i] if i < len(blocks_for) else ''
                mv = VALUE.search(b)
                rec[key] = float(mv.group(1)) if mv else None
            hb = blocks_for[len(ATTRS)] if len(blocks_for) > len(ATTRS) else ''
            hands = re.findall(r'id:\s*"([^"]+)"', hb)
            rec['hands'] = hands
            stats[eid] = rec
        sys.stderr.write('  %d/%d\n' % (min(start + BATCH, len(ids)), len(ids)))

    # 🚨 Final sweep. Anything left is a leak and gets REPORTED, not silently killed.
    left = []
    for i in range(len(todo) + BATCH):
        left.append('kill @e[tag=vst%d]' % i)
    swept = rcon(left)
    killed = len(re.findall(r'^Killed ', swept, flags=re.M))
    if killed:
        print('!! CLEANUP killed %d leftover probe entit(y/ies) - they should have been'
              % killed)
        print('   killed in their own batch. Worth knowing about.')
    else:
        print('OK  cleanup found nothing left over.')

    ok = [k for k, v in stats.items() if v.get('hp') is not None]
    bad = [k for k, v in stats.items() if v.get('hp') is None]
    print('\nMEASURED %d/%d' % (len(ok), len(ids)))
    if bad:
        print('!! NO READING for %d - not a verdict, these are UNKNOWN not zero:' % len(bad))
        for b in sorted(bad):
            print('     %-46s summoned=%s' % (b, stats[b].get('summoned')))

    io.open(OUT, 'w', encoding='utf-8').write(json.dumps(stats, indent=1))
    print('\nwrote %s' % OUT)
    return 0


if __name__ == '__main__':
    sys.exit(main())
