#!/usr/bin/env python3
"""Deploy KubeJS scripts from the repo pack to the running instance.

WHY THIS EXISTS
---------------
`repo/pack/kubejs/` is the source of truth; `instance/kubejs/` is what the server
actually reads. They are separate copies with no link between them, so editing the
repo and restarting produces a server running the OLD code while the log cheerfully
reports "Loaded 18/18 KubeJS server scripts ... 0 errors".

That happened while building E3 on 2026-08-15: a whole new script plus three wired
consumers sat in the repo, the boot looked perfect, and none of it was live. The
only reason it was caught was checking for the subsystem's own seam line rather
than trusting the error count.

    "It did nothing" and "it failed" are different results.

Run this after ANY script edit and before restarting.

    python tools/sync_scripts.py            # show what would change
    python tools/sync_scripts.py --deploy   # actually copy
"""
import argparse
import filecmp
import pathlib
import shutil
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
SRC = REPO / 'pack' / 'kubejs'
DST = REPO.parent / 'instance' / 'kubejs'


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--deploy', action='store_true',
                    help='copy the files (default is a dry run)')
    args = ap.parse_args()

    if not SRC.is_dir():
        print('no source at %s' % SRC)
        return 1
    if not DST.is_dir():
        print('no instance at %s' % DST)
        return 1

    new, changed, ahead = [], [], []
    for s in sorted(SRC.rglob('*.js')):
        rel = s.relative_to(SRC)
        d = DST / rel
        if not d.exists():
            new.append(rel)
        elif not filecmp.cmp(s, d, shallow=False):
            # A file newer on the INSTANCE side means someone edited the live
            # server directly. Copying would destroy it, so say so and refuse.
            if d.stat().st_mtime > s.stat().st_mtime:
                ahead.append(rel)
            else:
                changed.append(rel)

    for rel in new:
        print('  NEW      %s' % rel)
    for rel in changed:
        print('  CHANGED  %s' % rel)
    for rel in ahead:
        print('  !! INSTANCE IS NEWER, NOT COPYING: %s' % rel)

    if not (new or changed or ahead):
        print('  in sync - nothing to do')
        return 0

    if ahead and not args.deploy:
        print('\n  resolve the instance-newer files by hand before deploying')

    if not args.deploy:
        print('\n  dry run. re-run with --deploy to copy %d file(s)'
              % (len(new) + len(changed)))
        return 0

    if ahead:
        print('\n  REFUSING to deploy while %d file(s) are newer on the instance.'
              % len(ahead))
        return 1

    for rel in new + changed:
        d = DST / rel
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SRC / rel, d)
        print('  deployed %s' % rel)
    print('\n  %d file(s) deployed. RESTART for them to load - '
          '/kubejs reload does not re-fire ServerEvents.loaded.'
          % (len(new) + len(changed)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
