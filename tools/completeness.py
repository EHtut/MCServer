#!/usr/bin/env python3
"""completeness.py — is Veldora actually finished?

Read-only. Answers one question per section, and answers it by MEASURING rather
than by trusting a doc or a banner.

    A  PATH READINESS      does every god have every part a god needs?
    B  VOICE TAG AUDIT     is every tag someone SAYS actually written down?
    C  LIVE BOOT CHECK     did the running server agree, on its last restart?
    D  DEAD POOLS          what is written and never spoken?

⭐ WHY THIS EXISTS. On 2026-08-23 a restart revealed that two deep speakers had
been silently dead for a day: deep_speaker.js threw mid-loop on a god with no
confession, and everything registered after her never happened. The 21-assertion
harness stayed green the whole time because it never loaded the file. This tool
is the standing version of that lesson - it compares what the SOURCE claims
against what the LOG says actually happened.

🚨 A ZERO HERE IS NOT PROOF OF ABSENCE. Every check prints what it searched for,
so a surprisingly clean result is a prompt to re-check the query, not a finding.
"""
import os
import re
import sys
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SS = os.path.join(ROOT, 'pack', 'kubejs', 'server_scripts')
LOG = os.path.join(os.path.dirname(ROOT), 'instance', 'logs', 'latest.log')

GODS = ['blade', 'wall', 'salvage', 'art', 'forge', 'crown']

G, R, Y, B, DIM, X = '\033[32m', '\033[31m', '\033[33m', '\033[1m', '\033[2m', '\033[0m'
problems = []


def read(name):
    p = os.path.join(SS, name)
    if not os.path.exists(p):
        return None
    with open(p, encoding='utf-8') as f:
        return f.read()


def allsrc():
    out = {}
    for p in glob.glob(os.path.join(SS, '*.js')):
        with open(p, encoding='utf-8') as f:
            out[os.path.basename(p)] = f.read()
    return out


def hdr(t):
    print('\n' + B + t + X)
    print(DIM + '-' * len(t) + X)


def flag(msg):
    problems.append(msg)
    return R + 'NO ' + X


# ══════════════════════════════════════════════════════════════════════════
# A. PATH READINESS
# ══════════════════════════════════════════════════════════════════════════
def section_a(src):  # noqa: C901 - a wide table, deliberately flat
    hdr('A. PATH READINESS — every part a claimable god needs')
    paths_js = src.get('paths.js', '')
    godev = src.get('godevents.js', '')
    release = src.get('release.js', '')
    warn = src.get('warn.js', '')
    deep = src.get('deep_speaker.js', '')
    coeff = src.get('coefficients.js', '')
    hooks = src.get('counter_hooks.js', '')

    closed = re.search(r'var CLOSED = \{(.*?)\}', paths_js, re.S)
    closed_keys = re.findall(r'^\s*(\w+):', closed.group(1), re.M) if closed else []

    print('%-9s %-6s %-7s %-6s %-7s %-6s %-8s %-7s %-6s' % (
        'god', 'voice', 'events', 'deep', 'chart', 'warn', 'release', 'counter', 'open'))
    for g in GODS:
        vo = src.get(g + '_voice.js')
        ev = src.get(g + '_events.js')
        pools = len(re.findall(r'^    ([a-z_0-9]+): \[', vo, re.M)) if vo else 0
        nev = len(re.findall(r"id: '", ev)) if ev else 0
        has_deep = ("register('%s'" % g) in deep
        has_chart = re.search(r'^    %s: \{' % g, godev, re.M) is not None
        has_warn = re.search(r"^    %s: '" % g, warn, re.M) is not None
        rel = re.search(r"^    %s: \{ mode: '(\w+)'" % g, release, re.M)
        if not rel:
            rel = re.search(r"^    %s: \{\s*\n\s*mode: '(\w+)'" % g, release, re.M)
        relmode = rel.group(1) if rel else '?'
        # 🔴 MEASURE AT THE POINT OF USE. The first version of this check looked
        # only in counter_hooks.js and reported wall and salvage as missing - which is
        # this repo's oldest error class, committed by the tool written to catch it.
        # Their counters are hooked deliberately elsewhere: salvage's in salvage.js
        # and salvage_events.js (trades, bounties, commissions), and wall's ONLY in
        # wall_events.js because her counter is RAGE, not an activity tally.
        has_counter = any(("'%s'" % g) in body and 'counter' in body
                          for name, body in src.items()
                          if name in ('counter_hooks.js', g + '_events.js', g + '.js'))
        has_coeff = re.search(r'^    %s:\s*\{' % g, coeff, re.M) is not None
        is_open = g not in closed_keys

        # crown is a deliberate ALIAS, not a built god - judged by a different bar
        alias = (g == 'crown')

        def mark(b, label=None):
            if b:
                return G + 'yes' + X
            if alias:
                return Y + 'alias' + X
            return flag('%s has no %s' % (g, label))

        print('%-9s %-15s %-16s %-15s %-16s %-15s %-17s %-16s %-15s' % (
            g,
            (G + str(pools) + X) if pools else (Y + 'alias' + X if alias else flag(g + ' has no voice file')),
            (G + str(nev) + X) if nev else (Y + 'alias' + X if alias else flag(g + ' has no events file')),
            mark(has_deep, 'deep speaker'),
            mark(has_chart, 'godevents CHART row'),
            mark(has_warn, 'warn title'),
            (G + relmode + X) if relmode not in ('?', 'regard') else (Y + relmode + X),
            mark(has_counter, 'counter hook'),
            (G + 'yes' + X) if is_open else Y + 'CLOSED' + X,
        ))
    print(DIM + '  release "regard" = the legacy door: inherited, not decided.' + X)
    print(DIM + '  crown is an ALIAS of wall by design (coefficients/warn/grudge). Not a gap.' + X)
    if not closed_keys:
        print('\n  ' + G + 'CLOSED is empty — every path is claimable.' + X)
    else:
        print('\n  ' + Y + 'still CLOSED: ' + ', '.join(closed_keys) + X)


# ══════════════════════════════════════════════════════════════════════════
# B. VOICE TAG AUDIT — the diff that has caught four real bugs
# ══════════════════════════════════════════════════════════════════════════
CONSUME = [
    # voice.say(p, GOD, 'tag') / sayAbout(...) / line(GOD, 'tag'
    (r"\.say\(\s*\w+\s*,\s*(?:GOD|'(\w+)')\s*,\s*'([a-z_0-9]+)'", 2, 1),
    (r"\.sayAbout\(\s*\w+\s*,\s*(?:GOD|'(\w+)')\s*,\s*'([a-z_0-9]+)'", 2, 1),
    (r"\.line\(\s*(?:GOD|'(\w+)'|\w+)\s*,\s*'([a-z_0-9]+)'", 2, 1),
    # a file-local helper: function say(p, tag) { ... voice.say(p, GOD, tag) }
    (r"(?<![.\w])say\(\s*\w+\s*,\s*'([a-z_0-9]+)'\s*\)", 1, None),
]


def section_b(src):
    hdr('B. VOICE TAG AUDIT — every tag SPOKEN must be WRITTEN')
    defined = {}
    for g in GODS:
        vo = src.get(g + '_voice.js')
        defined[g] = set(re.findall(r'^    ([a-z_0-9]+): \[', vo, re.M)) if vo else set()
    # deep speakers define their own pools, keyed by speaker id not god
    deep = src.get('deep_speaker.js', '')
    speaker_pools = set(re.findall(r'^      ([a-z_0-9]+): \[', deep, re.M))

    # tags each *_events / *_voice file consumes, attributed to its own god
    missing = []
    checked = 0
    for fname, body in src.items():
        m = re.search(r"var GOD = '(\w+)'", body)
        god = m.group(1) if m else None
        for pat, tag_i, god_i in CONSUME:
            for mt in re.finditer(pat, body):
                tag = mt.group(tag_i)
                owner = (mt.group(god_i) if god_i and mt.group(god_i) else god)
                if not owner or owner not in defined:
                    continue
                checked += 1
                if tag in defined[owner] or tag in speaker_pools:
                    continue
                # tier + '_gift' style is expanded by the caller, not a literal
                if tag.startswith('_'):
                    continue
                # ⭐ DYNAMIC TAGS: `'demand_' + pathOf(target)`. The literal ends in an
                # underscore, so instead of reporting the stub, EXPAND IT over every
                # god and check each one. This is the check that found demand_forge
                # and demand_art missing - both invisible to a plain grep, and both
                # newly live the moment forge opened.
                if tag.endswith('_'):
                    # ⚠️ `crown` is an ALIAS of wall everywhere in this codebase, so a
                    # caller that resolves it before building the tag legitimately has
                    # no demand_crown / near_crown pool. Only expect one from a file
                    # that does NOT resolve the alias - otherwise this check reports
                    # the fix as the bug.
                    resolves_crown = ("'crown'" in body and "'wall'" in body)
                    for suffix in GODS:
                        if suffix == 'crown' and resolves_crown:
                            continue
                        if (tag + suffix) not in defined[owner]:
                            missing.append((fname, owner, tag + suffix))
                    continue
                missing.append((fname, owner, tag))
    print('  checked %d call sites across %d files' % (checked, len(src)))
    if missing:
        for f, g, t in sorted(set(missing)):
            print('  ' + flag('%s says %s/%s and NO POOL EXISTS' % (f, g, t)))
    else:
        print('  ' + G + 'every tag spoken has a pool' + X)
        print(DIM + '  (searched .say / .sayAbout / .line / bare say(p, tag))' + X)

    # the near_ matrix — a missing pool is SILENCE, which is a real defect
    print('\n  near_<god> matrix — a blank cell is a god with nothing to say:')
    for g in GODS:
        if not defined[g]:
            continue
        row = []
        for o in GODS:
            if o == g or o == 'crown':
                row.append(DIM + '—' + X)
            elif ('near_' + o) in defined[g]:
                row.append(G + o[:2] + X)
            elif g == 'blade':
                # ⭐ EXPECTED, NOT A GAP. Blade has no near_ pools because he uses a
                # separate gossip structure keyed by god ("wall": {opens, closes}).
                # Counting these as findings buried the four REAL ones in noise the
                # first time this ran.
                row.append(DIM + o[:2] + X)
            else:
                row.append(flag('%s has no near_%s pool (silence)' % (g, o)) + o[:2])
        print('    %-9s %s' % (g, ' '.join(row)))
    print(DIM + '    blade uses a separate gossip structure, not near_ pools — expected blanks.' + X)


# ══════════════════════════════════════════════════════════════════════════
# C. LIVE BOOT CHECK — what the SERVER said, not what the source claims
# ══════════════════════════════════════════════════════════════════════════
def section_c(src):
    hdr('C. LIVE BOOT CHECK — the running server, last restart')
    if not os.path.exists(LOG):
        print('  ' + Y + 'no latest.log at ' + LOG + X)
        print('  ' + Y + 'COULD NOT READ — this is not "everything is fine".' + X)
        return
    with open(LOG, encoding='utf-8', errors='replace') as f:
        log = f.read()

    # 🔴 "THE SERVER IS OFF" AND "THE CHECK FAILED" ARE NOT THE SAME ANSWER, and this
    # tool opened by saying so before committing the error itself: with the server
    # stopped it reported five confident findings that were only an absent log.
    # 'I failed' and 'I found nothing' must never share a return value.
    if '[paths] active' not in log and 'KubeJS Server' not in log:
        print('  ' + Y + 'NO BOOT IN latest.log — the server has not started since it was cleared.' + X)
        print('  ' + Y + 'COULD NOT MEASURE. This section is UNKNOWN, not clean and not failing.' + X)
        print(DIM + '  Start the server and re-run to check the live half.' + X)
        return

    checks = [
        ('every path claimable', r'CLOSED \(unbuilt, cannot be claimed\): none'),
        ('all drop ids resolve', r'all (\d+) drop ids resolve'),
        ('claim store OK', r'claim store OK'),
        ('five written voices', r'(\d+) written voice\(s\)'),
        ('the tide is live', r'THE TIDE live'),
        ('the grudge is live', r'THE GRUDGE live'),
        ('the warning is live', r'THE WARNING live'),
    ]
    for label, pat in checks:
        m = re.search(pat, log)
        val = (' ' + DIM + m.group(0)[:60] + X) if m else ''
        print('  %s %s%s' % (G + 'yes' + X if m else flag('boot never said: ' + label), label, val))

    # every registered speaker must have reached the voice system
    spk = re.findall(r'\[speaker\] (\w+) -> ([^(]+)\((\w+)\) - (\d+) lines', log)
    print('\n  deep speakers that actually registered: %d' % len(spk))
    for path, name, sid, n in spk:
        print('    %-9s %-16s %-16s %s lines' % (path, name.strip(), sid, n))
    deep = src.get('deep_speaker.js', '')
    expect = set(re.findall(r"register\('(\w+)'", deep))
    got = set(p for p, _, _, _ in spk)
    if expect - got:
        print('  ' + flag('registered in source but NOT at boot: ' + ', '.join(sorted(expect - got))))
        print('  ' + R + '  ^ this is the 2026-08-23 defect class: the loop died mid-way.' + X)
    elif spk:
        print('  ' + G + 'source and boot agree — nobody was lost mid-loop' + X)

    errs = re.findall(r"(\w+\.js)#\d+: Error", log)
    if errs:
        for e in sorted(set(errs)):
            print('  ' + flag('SCRIPT ERROR at boot in ' + e))
    else:
        print('  ' + G + 'no script errors in the log' + X)


# ══════════════════════════════════════════════════════════════════════════
# D. DEAD POOLS — written, never spoken
# ══════════════════════════════════════════════════════════════════════════
def section_d(src):
    hdr('D. DEAD POOLS — written and never spoken')
    body = '\n'.join(src.values())
    spoken = set()
    for pat, tag_i, _ in CONSUME:
        for mt in re.finditer(pat, body):
            spoken.add(mt.group(tag_i))
    # idle.js builds these dynamically, so they are consumed without a literal
    dynamic = re.compile(r'^(near_|rare_|hold_|loc_|low_|medium_|high_|demand_|argue_)')
    dead = []
    for g in GODS:
        vo = src.get(g + '_voice.js')
        if not vo:
            continue
        for tag in re.findall(r'^    ([a-z_0-9]+): \[', vo, re.M):
            if tag not in spoken and not dynamic.match(tag):
                dead.append((g, tag))
    # 🔴 RETIRED-BY-DESIGN POOLS ARE NOT GAPS, AND THIS TOOL MUST SAY SO. A pool
    # that a RULING made unreachable will look identical to one that was never wired
    # up - and the whole point of this section is to distinguish those. Listing a
    # deliberate decision as a finding trains a reader to ignore the findings.
    #
    # 🔑 art/cut_down is the case that forced this. Ethan, 2026-08-24: "there should
    # be no ending anymore, this is story now, not just a game. there is no end."
    # release.js put all six gods on `mode: 'never'`, so her execution beat can never
    # fire. The lines are KEPT on purpose - they are the sharpest writing she has and
    # they still say what she is - and art_voice.js carries the same note.
    #
    # ⚠️ ADD TO THIS ONLY FOR A RULING, never to quiet a pool you have not explained.
    # The reason string is mandatory because it is the thing a future audit reads.
    RETIRED = {
        'art/cut_down': 'no-endings ruling 2026-08-24 - release.js has every god on '
                        'mode:never, so she never cuts anyone down. Kept deliberately.',
    }
    retired_hits = [(g, t) for g, t in dead if ('%s/%s' % (g, t)) in RETIRED]
    dead = [(g, t) for g, t in dead if ('%s/%s' % (g, t)) not in RETIRED]
    for g, t in retired_hits:
        print('  ' + (G + 'retired ' + X) + ' %s/%s' % (g, t))
        print(DIM + '    ' + RETIRED['%s/%s' % (g, t)] + X)
    # 🚨 AND IF A "RETIRED" POOL STARTS BEING SPOKEN AGAIN, SAY SO. The exception
    # is only valid while the ruling holds; a pool that came back to life without this
    # list being updated means the two have silently diverged.
    for key, why in RETIRED.items():
        g, t = key.split('/', 1)
        if (g, t) not in retired_hits and g in pools and t in pools.get(g, ()):
            problems.append('%s is listed as RETIRED (%s) but is being spoken again - '
                            'the exception list and the code disagree' % (key, why))

    if dead:
        for g, t in dead:
            print('  ' + Y + 'unspoken' + X + '  %s/%s' % (g, t))
        print(DIM + '  ^ not necessarily bugs: some are consumed by a caller that builds' + X)
        print(DIM + '    the tag dynamically. Verify at the point of USE before deleting.' + X)
    else:
        print('  ' + G + 'no obviously unspoken pools' + X)
    # the one known-dead pool, tracked by name
    if 'abandoned' in '\n'.join(src.values()):
        used = len(re.findall(r"'abandoned'", body))
        print('\n  ' + (Y + 'KNOWN' + X) + '  speaker/abandoned is defined by all five speakers'
              ' and consumed %d time(s)' % used)
        if used == 0:
            problems.append('speaker/abandoned is defined by five speakers and consumed by nothing')


def section_e():
    """Can every script still be READ by the tools that audit it?

    🔴 nemesis_tally.js carried a single stray NUL byte for weeks. It parsed,
    it ran, and it behaved correctly - the byte sat inside a sentinel that is only
    ever compared against itself. But ONE such byte is enough for grep and ripgrep
    to stop printing matches and say "Binary file matches" instead, so every
    tree-wide search in this project silently skipped that file.

    🔑 A FILE THAT CANNOT BE GREPPED CANNOT BE AUDITED, and it fails in the
    worst direction: the search comes back clean because the file was skipped,
    which is indistinguishable from the file being fine. It was found only because
    an audit looking for something else tripped over it.

    ⚠️ This checks the property that actually bit us - readable as text - and not
    "is it valid JavaScript", which node already answers and which stayed TRUE the
    entire time the file was invisible.
    """
    hdr('E. every script is readable as text')
    NUL = bytes([0])
    NL = bytes([10])
    bad = []
    for p in sorted(glob.glob(os.path.join(SS, '*.js'))):
        name = os.path.basename(p)
        try:
            raw = open(p, 'rb').read()
        except Exception as e:
            bad.append((name, 'could not be read :: %s' % e))
            continue
        if NUL in raw:
            n = raw.count(NUL)
            i = raw.index(NUL)
            line = raw[:i].count(NL) + 1
            bad.append((name,
                        '%d null byte(s), first at line %d - grep reads this file '
                        'as BINARY and silently skips it' % (n, line)))
            continue
        try:
            raw.decode('utf-8')
        except Exception as e:
            bad.append((name, 'not valid UTF-8 :: %s' % e))

    if bad:
        for name, why in bad:
            print('  ' + R + 'BINARY' + X + '  %s' % name)
            print(DIM + '    ' + why + X)
            problems.append('%s is not readable as text: %s' % (name, why))
    else:
        print('  ' + G + 'all scripts are plain UTF-8 text - every one is greppable' + X)


def main():
    src = allsrc()
    print(B + 'VELDORA COMPLETENESS AUDIT' + X)
    print(DIM + '%d server scripts · read-only · measures, does not trust' % len(src) + X)
    section_a(src)
    section_b(src)
    section_c(src)
    section_d(src)
    section_e()

    hdr('VERDICT')
    if not problems:
        print('  ' + G + 'no gaps found by the checks above.' + X)
        print(DIM + '  This is not "Veldora is finished" — it is "these five questions' + X)
        print(DIM + '  came back clean". Open design rulings are tracked in docs, not here.' + X)
        return 0
    print('  ' + R + '%d finding(s):' % len(problems) + X)
    for p in problems:
        print('    - ' + p)
    return 1


if __name__ == '__main__':
    sys.exit(main())
