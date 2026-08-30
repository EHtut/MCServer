# -*- coding: utf-8 -*-
"""rhino_lint.py - catch the two script hazards `node --check` cannot see.

    python tools/rhino_lint.py

WHY THIS EXISTS, AND WHAT I GOT WRONG BUILDING IT
-------------------------------------------------
First version flagged let / const / arrow functions / template literals as "Rhino
wants ES5". It fired 170 times across eight files that LOAD FINE on the live server -
paths.js uses `const BOOKS` at line 59 and has never failed. KubeJS 2101 ships a
modernised Rhino and ES6 syntax is fine.

A linter that cries wolf on working code is worse than no linter: it teaches you to
ignore it. Those rules are deleted rather than downgraded.

What survives is only what is actually verifiable from here:

  * TOP-LEVEL DECLARATION COLLISIONS. paths.js line 26 states the real hazard in its
    own header: "server scripts share ONE global scope - a top-level const collides
    across". Every script in this pack wraps itself in an IIFE for exactly this
    reason. A name declared outside that wrapper in two files is a live collision,
    and the loser is decided by load order - so the symptom is a script that works
    until an unrelated file is added.

  * NUL BYTES. One stray NUL in nemesis_tally.js made the whole file read as BINARY
    to grep, hiding it from a tree-wide sweep. Silent, and it defeats the exact
    instrument used to prove a sweep is finished.

NOT CHECKED ANY MORE: duplicate `var` in one scope. It is legal in both ES5 and ES6,
the nested-scope detection produced four false positives on wall_events.js (a live
file), and I could not reproduce the original failure to confirm the diagnosis. It
does not go in a linter on a maybe.

A clean run here is NOT proof a script loads. Only a live boot is: deploy, restart,
and read the script count and `0 real error(s)` off the boot log.
"""
import collections
import io
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SS = os.path.join(ROOT, 'pack', 'kubejs', 'server_scripts')

# Deliberately shared across every file - the namespace the whole pack hangs off.
SHARED = set(['VELDORA'])


def strip(src):
    """Blank out comments and string literals, preserving offsets and newlines."""
    out = []
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ''
        if c == '/' and nxt == '/':
            j = src.find('\n', i)
            j = n if j < 0 else j
            out.append(' ' * (j - i))
            i = j
        elif c == '/' and nxt == '*':
            j = src.find('*/', i + 2)
            j = n if j < 0 else j + 2
            out.append(''.join(ch if ch == '\n' else ' ' for ch in src[i:j]))
            i = j
        elif c in '"\'`':
            j = i + 1
            while j < n:
                if src[j] == '\\':
                    j += 2
                    continue
                if src[j] == c:
                    j += 1
                    break
                j += 1
            out.append(' ' * (j - i))
            i = j
        else:
            out.append(c)
            i += 1
    return ''.join(out)


# ── control characters ────────────────────────────────────────────────────────
# Started as a NUL check: one stray NUL in nemesis_tally.js made the whole file read
# as BINARY to grep, hiding it from a tree-wide sweep.
#
# 🔴 Widened 2026-08-29 after a worse one. A shell heredoc ate a backslash level and
# wrote a real 0x08 BACKSPACE into a harness where `\b` was meant. The regex became
# `/<BS>(blade|wall|...)<BS>/`, which searches for a backspace byte, matches nothing
# ever, and made the assertion pass VACUOUSLY - it would no longer catch the thing it
# was written to catch. Nothing about the file looked wrong, grep showed nothing, and
# the suite was green.
#
# ⚠️ A GREEN ASSERTION THAT CANNOT FAIL IS WORSE THAN A MISSING ONE.
_ALLOWED = set(['\t', '\n', '\r'])


def ctrl_chars(raw):
    seen = {}
    for ch in raw:
        if ord(ch) < 32 and ch not in _ALLOWED:
            seen[ord(ch)] = seen.get(ord(ch), 0) + 1
    if not seen:
        return None
    return ', '.join('0x%02x x%d' % (k, v) for k, v in sorted(seen.items()))


def line_of(src, idx):
    return src.count('\n', 0, idx) + 1


def top_level_spans(src):
    """Byte ranges of every TOP-LEVEL function body. Nested ones are inside these
    already, so the scan skips past a match's end rather than re-entering it - the
    bug that produced the first round of false positives.

    ARROW BODIES COUNT. the_hunt.js and nemesis_tally.js do not use an IIFE at all;
    they hang everything off `EntityEvents.death(event => { ... })`. Missing that
    reported `const victim` inside an arrow as a global collision - the second round
    of false positives from this same tool. An arrow body is a scope."""
    spans, pos = [], 0
    pat = re.compile(r'\bfunction\b[^(){}]*\([^()]*\)\s*\{|=>\s*\{')
    while True:
        m = pat.search(src, pos)
        if not m:
            return spans
        depth, i = 1, m.end()
        while i < len(src) and depth:
            if src[i] == '{':
                depth += 1
            elif src[i] == '}':
                depth -= 1
            i += 1
        spans.append((m.start(), i))
        pos = i


def globals_in(path):
    raw = io.open(path, encoding='utf-8').read()
    src = strip(raw)
    spans = top_level_spans(src)

    def inside(idx):
        for a, b in spans:
            if a <= idx < b:
                return True
        return False

    found = []
    for m in re.finditer(r'\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)', src):
        if not inside(m.start()):
            found.append((m.group(1), line_of(src, m.start())))
    for m in re.finditer(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(', src):
        if not inside(m.start()):
            found.append((m.group(1), line_of(src, m.start())))
    return raw, found


def main():
    if not os.path.isdir(SS):
        sys.stderr.write('no server_scripts at %s\n' % SS)
        return 2

    files = sorted(f for f in os.listdir(SS) if f.endswith('.js'))
    owners = collections.defaultdict(list)   # name -> [(file, line)]
    nul = []

    for f in files:
        raw, found = globals_in(os.path.join(SS, f))
        bad = ctrl_chars(raw)
        if bad:
            nul.append((f, bad))
        for name, ln in found:
            if name in SHARED:
                continue
            owners[name].append((f, ln))

    # The harnesses too. The worst control character this repo has seen landed in a
    # HARNESS, not a script, and this tool was not looking there.
    TOOLS = os.path.join(ROOT, 'tools')
    for f in sorted(os.listdir(TOOLS)):
        if not f.endswith('.js'):
            continue
        try:
            bad = ctrl_chars(io.open(os.path.join(TOOLS, f), encoding='utf-8').read())
        except Exception:
            continue
        if bad:
            nul.append(('tools/' + f, bad))

    problems = 0

    if nul:
        print('\nCONTROL CHARACTERS - invisible in every editor, and they do not')
        print('always announce themselves by breaking something:')
        for f, c in nul:
            print('  %-30s %s' % (f, c))
        problems += len(nul)

    collisions = dict((k, v) for k, v in owners.items() if len(v) > 1)
    if collisions:
        print('\nTOP-LEVEL COLLISIONS - server scripts share ONE global scope, so')
        print('these fight, and load order picks the winner:')
        for name in sorted(collisions):
            print('  %s' % name)
            for f, ln in sorted(collisions[name]):
                print('      %s:%s' % (f, ln))
        problems += len(collisions)

    lone = sorted(k for k, v in owners.items() if len(v) == 1)
    if lone:
        print('\nUNWRAPPED but not yet colliding - one name each, outside any IIFE.')
        print('Not broken; just the next collision waiting for a file to be added:')
        for name in lone:
            f, ln = owners[name][0]
            print('  %-22s %s:%s' % (name, f, ln))

    print('\n%d script(s) scanned, %d problem(s), %d unwrapped name(s).'
          % (len(files), problems, len(lone)))
    if not problems:
        print('No collisions. NOT proof a script loads - only a live boot is.')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
