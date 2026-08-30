# -*- coding: utf-8 -*-
"""undead_probe.py - which shortlisted undead are ACTUALLY REGISTERED on this server.

    python tools/undead_census.py --json tools/.cache/undead.json
    python tools/undead_shortlist.py
    python tools/undead_probe.py

WHY
---
A tag can name an id no mod provides, and a wrong id in a roster spawns nothing and logs
nothing. Three of four miniboss ids in this project did not exist; the failure was found
in play, not in a test.

🚨 THE DETECTION IS THE HARD PART, AND THE OBVIOUS VERSION IS WRONG.

    data get entity @e[type=<id>,limit=1]

A REAL id with no live instance answers "No entity was found". But a REAL id that IS
currently alive answers with the entity's data instead - and a check that treats only
"No entity was found" as proof-of-real reads every living mob as FAKE. That exact flaw
made `minecraft:skeleton` look fake on 2026-08-29.

⭐ SO DETECT THE FAILURE, NOT THE SUCCESS. A fake id produces "Unknown entity type" or a
`<--[HERE]` parse caret. Everything else is real. And a KNOWN-FAKE CONTROL is included in
every run, because a detector that never fails is not a detector.
"""
import argparse
import io
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SHORT = os.path.join(HERE, '.cache', 'undead_shortlist.json')
OUT = os.path.join(HERE, '.cache', 'undead_registered.json')
CONTROL = 'veldora:definitely_not_a_real_entity'

FAKE = re.compile(r'Unknown entity type|<--\[HERE\]', re.I)


def probe(ids, chunk=25):
    """id -> True (registered) / False (not) / None (no answer)."""
    result = {}
    for i in range(0, len(ids), chunk):
        batch = ids[i:i + chunk]
        cmds = ['data get entity @e[type=%s,limit=1]' % e for e in batch]
        try:
            p = subprocess.run([sys.executable, os.path.join(HERE, 'rcon.py')] + cmds,
                               capture_output=True, text=True, timeout=180)
            out = p.stdout
        except Exception as e:
            sys.stderr.write('rcon failed on batch %d: %s\n' % (i, e))
            for e2 in batch:
                result[e2] = None
            continue

        # Responses are echoed as "> <command>" then the reply. Split on the echo so a
        # reply is attributed to the command that produced it, rather than to position -
        # a dropped line would otherwise shift every verdict after it.
        parts = re.split(r'^> ', out, flags=re.M)
        seen = {}
        for chunk_text in parts:
            m = re.match(r'data get entity @e\[type=([^,\]]+)', chunk_text)
            if not m:
                continue
            seen[m.group(1)] = chunk_text
        for e2 in batch:
            body = seen.get(e2)
            if body is None:
                result[e2] = None            # no answer is NOT a verdict
            else:
                result[e2] = not bool(FAKE.search(body))
        sys.stderr.write('  probed %d/%d\n' % (min(i + chunk, len(ids)), len(ids)))
    return result


def main():
    # ⭐ PARAMETERISED 2026-08-30. The technique here - detect the FAILURE, never the
    # success, with a known-fake control in the same batch shape - is not specific to
    # the undead, and Ethan asked for the same run over Wall's spiders. A second copy
    # of this file would have been a second place for the control to rot.
    global OUT
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='src', default=SHORT,
                    help='JSON: {"candidates": [...]} or a bare list of ids')
    ap.add_argument('--out', dest='dst', default=OUT)
    a = ap.parse_args()
    OUT = a.dst

    if not os.path.exists(a.src):
        sys.stderr.write('no such id list: %s\n' % a.src)
        sys.stderr.write('for the undead run: undead_census.py then undead_shortlist.py\n')
        return 2
    doc = json.load(io.open(a.src, encoding='utf-8'))
    ids = list(doc['candidates']) if isinstance(doc, dict) else list(doc)
    # ⚠️ An empty list is a FAILURE TO READ, not a clean run over nothing. This is the
    # D-109 class and it is cheap to refuse here.
    if not ids:
        sys.stderr.write('!! %s contained NO ids - a failure to read, not a result.\n'
                         % a.src)
        return 2

    # !! The control goes in the SAME batch shape as the real work.
    res = probe(ids + [CONTROL])

    control = res.get(CONTROL)
    print('\nCONTROL: %s -> %s' % (CONTROL,
                                   {True: 'REGISTERED', False: 'not registered',
                                    None: 'NO ANSWER'}[control]))
    if control is not False:
        print('  !! THE DETECTOR IS BROKEN. A known-fake id must come back NOT')
        print('     registered. Every verdict below is untrustworthy - do not use them.')
        return 1
    print('  OK  the detector can fail, so its passes mean something.\n')

    real = sorted(k for k, v in res.items() if v is True and k != CONTROL)
    fake = sorted(k for k, v in res.items() if v is False and k != CONTROL)
    noans = sorted(k for k, v in res.items() if v is None and k != CONTROL)

    print('REGISTERED: %d' % len(real))
    by = {}
    for r in real:
        by.setdefault(r.split(':')[0], []).append(r)
    for ns in sorted(by, key=lambda n: (-len(by[n]), n)):
        print('  %-22s %d  %s' % (ns, len(by[ns]),
                                  ', '.join(x.split(':')[1] for x in sorted(by[ns]))))

    if fake:
        print('\n!! TAGGED BUT NOT REGISTERED: %d - a roster naming these spawns NOTHING'
              % len(fake))
        for f in fake:
            print('    %s' % f)
    if noans:
        print('\n!  NO ANSWER (not a verdict, re-run): %d' % len(noans))
        for n in noans:
            print('    %s' % n)

    io.open(OUT, 'w', encoding='utf-8').write(json.dumps({
        'registered': real, 'tagged_but_absent': fake, 'no_answer': noans,
    }, indent=1))
    print('\nwrote %s' % OUT)
    print('X  STILL NOT ANSWERED: how any of them fights. The registry cannot say.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
