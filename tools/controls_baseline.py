#!/usr/bin/env python
"""controls_baseline.py - the ONE authoritative options.txt, and the check that it holds.

    python tools/controls_baseline.py            report drift, change nothing
    python tools/controls_baseline.py --write    rebuild the baseline from the live client
    python tools/controls_baseline.py --apply    push the baseline onto the live client

Ethan, 2026-09-06:

    "the controls pass never applied. I know because pressing r reloads the shaders and we
     directly set that to be changed. baseline yourself against the original controls and
     mod options pass, put that somewhere you can easily reference."

== WHY A BASELINE FILE AND NOT A LIVE INSTANCE ==============================

He was right, and it was worse than one key. Measured 2026-09-06 against his instance:

    key_iris.keybind.reload      f13 ruled  ->  r          in his client
    key_key.sneak                ctrl ruled ->  shift      in his client
    key_key.sprint               shift ruled ->  ctrl      in his client

Sneak and sprint were BACKWARDS from his own 2026-08-02 ruling, and R still reloaded
shaders, which is the one he could feel.

THE REASON IS STRUCTURAL. There were two sources and no authority between them:

  * `tools/make_prism_instance.py`'s OPTIONS template - the RULINGS, 21 lines
  * `tools/controls_pass.py` - the mod keybind collision pass, ~40 rebinds

and neither owned the file. Minecraft rewrites options.txt on every exit, so whichever
ran last won, and a fresh import could silently revert either. There was no artifact
anybody could point at and say "this is the controls".

Now there is: `client/baseline/options.txt`. It is what ships, it is what the check
compares against, and it is in git.

== THE MERGE ORDER, WHICH IS THE WHOLE POINT ================================

    his live file          - 281 keybinds, everything the mods declare
    + the collision pass   - controls_pass.py's rebinds
    + THE RULINGS LAST     - sneak, sprint, iris, resource packs, render settings

The rulings win. Always. A live options.txt is whatever he last had selected, and if he
turns Faithful on for an evening that must not become everybody's default.
"""

from __future__ import annotations

import io
import os
import re
import shutil
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BASELINE = os.path.join(ROOT, 'client', 'baseline', 'options.txt')
LIVE = os.path.join(os.path.expanduser('~'), 'AppData', 'Roaming', 'PrismLauncher',
                    'instances', 'ArkhdottirNewBlood-PrismInstance', '.minecraft',
                    'options.txt')


def rulings():
    """The OPTIONS template out of make_prism_instance.py - the single source.

    READ, NOT COPIED. A second copy of these 21 lines is a second thing to forget to
    update, and this whole file exists because two sources with no authority between them
    let the rulings quietly lose.
    """
    src = io.open(os.path.join(HERE, 'make_prism_instance.py'), encoding='utf-8').read()
    i = src.index('OPTIONS = """')
    j = src.index('"""', i + len('OPTIONS = """'))
    body = src[i + len('OPTIONS = """'):j].lstrip('\\\n')
    out = {}
    for line in body.splitlines():
        if ':' in line:
            out[line.split(':', 1)[0]] = line
    if not out:
        raise SystemExit('could not read the OPTIONS template')
    return out


def merge(live_text, forced):
    """The live file with every ruling applied over it, order preserved."""
    out, seen = [], set()
    for line in live_text.splitlines():
        k = line.split(':', 1)[0] if ':' in line else None
        if k in forced:
            out.append(forced[k])
            seen.add(k)
        else:
            out.append(line)
    for k, line in forced.items():
        if k not in seen:
            out.append(line)
    return '\n'.join(out) + '\n'


def main():
    write = '--write' in sys.argv
    apply_ = '--apply' in sys.argv
    forced = rulings()

    if not os.path.exists(LIVE):
        print('no live client at %s' % LIVE)
        if not os.path.exists(BASELINE):
            return 2
        live_text = io.open(BASELINE, encoding='utf-8').read()
    else:
        live_text = io.open(LIVE, encoding='utf-8').read()

    # WHICH RULINGS THE LIVE CLIENT IS BREAKING RIGHT NOW. This is the report he asked
    # for: not "is there drift" but "which of my decisions is not in effect".
    broken = []
    have = {}
    for line in live_text.splitlines():
        if ':' in line:
            have[line.split(':', 1)[0]] = line
    for k, want in forced.items():
        got = have.get(k)
        if got is not None and got != want:
            broken.append((k, got.split(':', 1)[1], want.split(':', 1)[1]))

    print('%d ruling(s) in the template, %d keybind(s) in the live client'
          % (len(forced), sum(1 for l in live_text.splitlines() if l.startswith('key_'))))
    if broken:
        print('\n%d RULING(S) NOT IN EFFECT:' % len(broken))
        for k, got, want in broken:
            print('   %-34s is %-24s should be %s' % (k, got, want))
    else:
        print('\nevery ruling is in effect on the live client.')

    merged = merge(live_text, forced)

    if write:
        os.makedirs(os.path.dirname(BASELINE), exist_ok=True)
        open(BASELINE + '.tmp', 'wb').write(merged.encode('utf-8'))
        os.replace(BASELINE + '.tmp', BASELINE)
        print('\nwrote %s' % os.path.relpath(BASELINE, ROOT))
    if apply_:
        if not os.path.exists(LIVE):
            print('\ncannot apply - no live client')
            return 2
        shutil.copy(LIVE, LIVE + '.prebaseline.bak')
        base = io.open(BASELINE, encoding='utf-8').read() if os.path.exists(BASELINE) else merged
        open(LIVE + '.tmp', 'wb').write(base.encode('utf-8'))
        os.replace(LIVE + '.tmp', LIVE)
        print('\napplied the baseline to the live client (backup: options.txt.prebaseline.bak)')
        print('RESTART THE CLIENT - Minecraft reads options.txt once, at launch.')
    if not write and not apply_:
        print('\nreport only. --write to rebuild the baseline, --apply to push it live.')
    # A broken ruling is a failure: it is a decision that is not in effect.
    return 1 if broken and not apply_ else 0


if __name__ == '__main__':
    raise SystemExit(main())
