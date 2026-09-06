#!/usr/bin/env python
"""act0_smoke.py - ask the RUNNING SERVER whether Act 0 actually works.

    python tools/act0_smoke.py              what the server can answer by itself
    python tools/act0_smoke.py --script     the by-hand playtest, in order, with ids
    python tools/act0_smoke.py --pass <id> --note "..."     record an eyes-only answer
    python tools/act0_smoke.py --fail <id> --note "..."
    python tools/act0_smoke.py --answers    what has been answered so far

== WHY THIS IS NOT live_smoke.py ==============================================

`live_smoke.py` asks whether the SERVER is healthy: scripts loaded, gates as ruled, fonts
delivered, datapacks on. It is about the machine.

This asks whether ACT 0 HAPPENS. Different question, and almost none of it is answerable
the same way - because most of Act 0 is a person in a cave looking at a screen. An NPC
that spawns, wears the wrong skin, stands still and says nothing passes every check a
server can run.

== THIS FILE HAS TWO HALVES AND REFUSES TO MERGE THEM ========================

  RCON        things the server can be asked. Answered here, now, honestly.
  EYES        things only somebody playing can answer. NOT answered here - printed as a
              numbered script, and recorded ONLY when a human says so.

An EYES item is never green because the RCON half passed. That substitution is this
project's signature failure: the pack shipped 35/35 green with fonts rendering as tofu,
a gate ruled off and still on, and a title card that had never once rendered. Every one
of those was "provable" by something adjacent.

AND AN UNKNOWN IS A FAILURE. A check that could not look has not passed.

== THE ANSWERS LEDGER =======================================================

`tools/act0_answers.json` records who answered which EYES item, when, and what they saw.
`prefire.js` reads it, so an answered NEEDS-GAME marker stops being owed - the owed list
shrinks as testing happens instead of standing at 16 forever.

An id is a hash of the item's TEXT, not its file and line, so moving it does not orphan
its answer - and editing what it CLAIMS does, which is correct: a changed claim has not
been tested.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import subprocess
import sys
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INST = r'C:\MCServer\instance'
LOG = os.path.join(INST, 'logs', 'latest.log')
LEDGER = os.path.join(REPO, 'tools', 'act0_answers.json')

OK, BAD, UNKNOWN = 'ok', 'FAIL', 'UNKNOWN'
results = []


def check(name, state, detail=''):
    results.append((name, state, detail))
    tag = {'ok': '  ok  ', 'FAIL': ' FAIL ', 'UNKNOWN': ' ???? '}[state]
    print('%s %-28s %s' % (tag, name, detail))
    return state == OK


def rcon(cmd):
    """One command on the live server. None if it could not be reached.

    None means COULD NOT ASK. An empty string means the server answered with nothing,
    which is a different thing entirely, and several checks below depend on the difference.
    """
    try:
        out = subprocess.run(
            [sys.executable, os.path.join(REPO, 'tools', 'rcon.py'), cmd],
            capture_output=True, text=True, timeout=25)
        if out.returncode != 0:
            return None
        return out.stdout
    except Exception:
        return None


def log_text():
    """The most recent boot's log, walking back through rotations.

    Minecraft rotates at midnight, so reading only latest.log makes every boot-evidence
    check expire overnight on a perfectly healthy server. live_smoke.py learned this the
    hard way; the same walk-back is used here rather than a second, worse copy.
    """
    import glob
    import gzip
    try:
        t = io.open(LOG, encoding='utf-8', errors='replace').read()
    except Exception:
        t = None
    if t and 'KubeJS server scripts' in t:
        return t
    try:
        d = os.path.dirname(LOG)
        for f in sorted(glob.glob(os.path.join(d, '*.log.gz')),
                        key=os.path.getmtime, reverse=True)[:6]:
            try:
                with gzip.open(f, 'rt', encoding='utf-8', errors='replace') as fh:
                    g = fh.read()
            except Exception:
                continue
            if 'KubeJS server scripts' in g:
                return g
    except Exception:
        pass
    return t


# ==========================================================================
# THE RCON HALF - what the server can answer
# ==========================================================================

def c_up():
    r = rcon('list')
    if r is None:
        return check('server reachable', BAD, 'rcon did not answer - the server is DOWN')
    m = re.search(r'(\d+)\s*(?:of|/)\s*(?:a max(?:imum)? of\s*)?(\d+)', r)
    if not m:
        return check('server reachable', UNKNOWN, 'rcon answered, but not with a player list')
    return check('server reachable', OK, '%s/%s players online' % (m.group(1), m.group(2)))


# EVERY ACT 0 SCRIPT MUST ANNOUNCE ITSELF. A script that loads and reports nothing is
# indistinguishable from one that never loaded, which is the whole reason these banners
# exist. What the banner CLAIMS is checked below, not merely that a file is present.
BANNERS = [
    ('ank.js', r'\[ank\] Ank is live'),
    ('story.js', r'\[story\] \d+ Act 0 beats registered'),
    ('opening.js', r'\[opening\] \d+ beats'),
    ('urge.js', r'\[urge\]'),
]


def act0_boot(t):
    """Is this log from a boot that actually loaded the Act 0 code?

    THE FIRST VERSION OF THIS FILE ASKED THE WRONG QUESTION and printed green because of
    it. log_text() walks back through rotated logs to find *a* boot, and the one it found
    was from 2026-09-01 - before Ank existed. It carried `[opening]`, so a naive
    "does any Act 0 tag appear" guard was satisfied, and `no act 0 script threw` reported
    ok about a boot that had never run the script it was clearing.

    So the marker is the newest thing in the act: Ank announcing himself. A log without it
    cannot answer any question about Ank, and the checks that depend on it say UNKNOWN
    rather than ok or FAIL - "I could not look" is neither.
    """
    return bool(t) and bool(re.search(r'\[ank\] Ank is live', t))


# The deployed copies. Their mtimes are what the boot has to be NEWER than.
DEPLOYED = os.path.join(INST, 'kubejs', 'server_scripts')
ACT0_FILES = ('ank.js', 'ank_lines.js', 'story.js', 'opening.js', 'opening_lines.js',
              'urge.js')


def stale_since_boot():
    """Which Act 0 scripts were deployed AFTER the log's boot - i.e. have never run.

    THE BOOT MARKER ALONE WAS NOT ENOUGH, and this is the second time the same hole was
    found in this file. act0_boot() only asks whether Ank ever announced himself in some
    log; it cannot tell yesterday's boot from this morning's. So: boot once, then rewrite
    ank.js and never restart - exactly what happened when the greeting moved to the chat
    bar - and three checks keep reporting ok about a build that has never loaded.

    Returns [] when nothing is stale, a list of filenames when something is, and None when
    the question cannot be answered at all. THREE OUTCOMES, NOT TWO: "I could not read the
    boot time" must not look like "nothing is stale".
    """
    t = log_text()
    if not t:
        return None
    # KubeJS prints the boot with a wall clock: `[12:34:56] [main/INFO] ...`. The log has
    # no date, so the file's own mtime is the anchor and the clock only orders within it.
    src = None
    import glob
    for f in [LOG] + sorted(glob.glob(os.path.join(os.path.dirname(LOG), '*.log.gz')),
                            key=os.path.getmtime, reverse=True)[:6]:
        try:
            if f.endswith('.gz'):
                import gzip
                with gzip.open(f, 'rt', encoding='utf-8', errors='replace') as fh:
                    g = fh.read()
            else:
                g = io.open(f, encoding='utf-8', errors='replace').read()
        except Exception:
            continue
        if 'KubeJS server scripts' in g:
            src = f
            break
    if src is None:
        return None
    try:
        boot = os.path.getmtime(src)
    except Exception:
        return None
    out = []
    for f in ACT0_FILES:
        try:
            if os.path.getmtime(os.path.join(DEPLOYED, f)) > boot:
                out.append(f)
        except Exception:
            pass          # not deployed at all is c_banners' problem, not this one
    return out


def c_boot_is_current():
    """Is the evidence about the code that is deployed RIGHT NOW?"""
    stale = stale_since_boot()
    if stale is None:
        return check('the boot is current', UNKNOWN, 'cannot date the newest boot')
    if stale:
        return check('the boot is current', BAD,
                     'deployed AFTER the last boot, so never loaded: ' + ', '.join(stale) +
                     ' - restart before trusting anything below')
    return check('the boot is current', OK, 'every Act 0 script predates the last boot')


def c_banners():
    t = log_text()
    if not t:
        return check('act 0 scripts booted', UNKNOWN, 'cannot read any log')
    missing = [n for n, pat in BANNERS if not re.search(pat, t)]
    if missing:
        return check('act 0 scripts booted', BAD,
                     'silent on boot: ' + ', '.join(missing))
    # A BANNER FROM A BOOT THAT PREDATES THE DEPLOY IS NOT EVIDENCE. See stale_since_boot.
    if stale_since_boot():
        return check('act 0 scripts booted', UNKNOWN,
                     'all four announced themselves, but on a boot older than the '
                     'deployed files - see `the boot is current`')
    return check('act 0 scripts booted', OK,
                 '%d/%d announced themselves' % (len(BANNERS), len(BANNERS)))


def c_no_throws():
    """Scoped to Act 0's own files. live_smoke.py owns the tree-wide version, and a second
    copy of that check here would only disagree with it eventually."""
    t = log_text()
    if not t:
        return check('no act 0 script threw', UNKNOWN, 'cannot read any log')
    # NOTHING THREW and NOTHING RAN are the project's oldest collapse, and it reappeared
    # inside the tool written to prevent it - see act0_boot().
    if not act0_boot(t):
        return check('no act 0 script threw', UNKNOWN,
                     'the newest boot in the log predates Ank - nothing throwing proves '
                     'nothing about code that never loaded')
    if stale_since_boot():
        return check('no act 0 script threw', UNKNOWN,
                     'the boot predates the deployed files - a clean OLD boot says nothing '
                     'about what is on disk now')
    # THE FIRST VERSION LOOKED FOR THE WRONG WORDS and would have missed every real
    # failure. It required Error|Exception|threw on the line; KubeJS reports a script throw
    # as `<file>.js#<line>: <message>` under a `[KubeJS ...]` tag, and the real examples in
    # this repo carry none of those words:
    #     paths.js#1304: Failed to read item stack from magistuarmory:bronze_ingot:
    #     the_hunt.js#121: Cannot find function getGameTime
    # So `ank.js#317: Cannot find function forDay` would have printed ok.
    #
    # THE SHAPE IS live_smoke.py:168's, deliberately - that detector was written after
    # voice.js threw on every boot for days without the suite seeing it. Two patterns for
    # one log format is how they come to disagree; this narrows the same pattern to Act 0's
    # files rather than inventing a second one.
    ours = ('ank', 'ank_lines', 'story', 'opening', 'opening_lines', 'urge')
    hits = re.findall(r'\[KubeJS[^\]]*\]: ([a-z_]+\.js#\d+: [^\n]{0,90})', t)
    mine = [h for h in hits if h.split('.js#')[0] in ours]
    if mine:
        return check('no act 0 script threw', BAD,
                     '%d throw(s), first: %s' % (len(mine), mine[0]))
    if hits:
        # OTHER SCRIPTS THREW. Not this file's business to fail on - but staying silent
        # lets somebody read "Act 0 is fine" off a boot that was on fire.
        return check('no act 0 script threw', OK,
                     'none of the 6 Act 0 scripts - but %d other script(s) threw. Run '
                     'live_smoke.py' % len(hits))
    return check('no act 0 script threw', OK, 'no .js threw on this boot')


def c_his_words():
    """Did Ethan's writing actually reach the running server?

    THIS IS THE CHECK THAT WOULD HAVE CAUGHT ank_lines.js HAVING NO CONSUMER. The file
    existed, the harness was green, and nothing read it. The boot line reports what the
    RUNNING process holds, which is the only number that means anything.
    """
    t = log_text()
    if not t:
        return check('his dialogue reached him', UNKNOWN, 'cannot read any log')
    m = re.search(r'\[ank\][^\n]*?(\d+) written day\(s\)[^0-9]*(\d+) rotation quote', t)
    if not act0_boot(t):
        return check('his dialogue reached him', UNKNOWN,
                     'the newest boot in the log predates Ank - there is nothing to read')
    if stale_since_boot():
        return check('his dialogue reached him', UNKNOWN,
                     'the boot predates the deployed files - this reports what an OLD '
                     'build held')
    if not m:
        return check('his dialogue reached him', BAD,
                     'he booted but reported no lines - ank_lines.js is not deployed to '
                     'the instance, or it loaded after ank.js read it')
    days, gen = int(m.group(1)), int(m.group(2))
    if days == 0:
        return check('his dialogue reached him', BAD,
                     'ZERO written days live - the importer output never reached the '
                     'instance, or the file loaded after ank.js read it')
    return check('his dialogue reached him', OK,
                 '%d written day(s) + %d rotation quote(s) live' % (days, gen))


def c_datapacks():
    r = rcon('datapack list enabled')
    if r is None:
        return check('act 0 datapacks on', UNKNOWN, 'rcon did not answer')
    want = ['mcserver_npcs', 'mcserver_story']
    off = [w for w in want if w not in r]
    if off:
        return check('act 0 datapacks on', BAD, 'not enabled: ' + ', '.join(off))
    return check('act 0 datapacks on', OK, '%d/%d enabled' % (len(want), len(want)))


def c_presets():
    """THE SUBCOMMAND THIS USED TO RUN DOES NOT EXIST, and its guard could not save it.

    `/easy_npc preset list` was written from a NEEDS-GAME marker that had itself invented
    the command. The mod's PresetCommand carries export / generate / import (the import
    tree knows base_presets, custom, data, local, world) - read out of
    easy_npc-neoforge-1.21.1-7.10.0.jar, not guessed a second time. There is a separate
    top-level `list`, for NPCs, not presets.

    So the old check would have taken the 'lists NO ank preset' branch and reported the
    confidently wrong diagnosis 'the datapack load path is wrong' - about the one question
    B1 is blocked on. A check that answers the wrong question loudly is worse than one that
    says it cannot answer.
    """
    return check('ank presets registered', UNKNOWN,
                 'no rcon command lists datapack presets. In game: /easy_npc preset '
                 'import_new and tab-complete - the suggestions are the answer')


def c_story_audit():
    """THIS CHECK USED TO BE INCAPABLE OF FAILING, and it is kept only to say so.

    `/story audit` opens with `var p = ctx.source.player; if (!p) return 0` - every one of
    these commands needs a player, and RCON has none. So the command returned nothing, and
    none of the three BAD conditions could ever fire. Worse, rcon.py echoes `> story audit`
    before the response, so the answer was never even empty: the detail column printed the
    echoed command as though it were the audit's reply.

    Two separate false greens stacked: the check could not fail, AND the command it trusted
    could not fail either (its `missing` counter was declared and never incremented).

    The DRIFT question moved offline to story_harness.js, where both the key list and the
    datapack directory can actually be read. What is left here is a probe that the command
    exists at all - which c_commands already does - so this reports the honest answer
    rather than a green one.
    """
    return check('the 9 beats agree', UNKNOWN,
                 'not answerable over rcon - every /story path needs a player. Drift is '
                 'offline now: node tools/story_harness.js')


ACT0_COMMANDS = ['ank', 'urge', 'story', 'opening']


def c_commands():
    """Run from the console these return nothing useful - every one needs a player. That
    is fine and is the point: this tests that the command PARSES, and an unregistered one
    is refused by Brigadier with a distinct message before it ever reaches our code."""
    missing = []
    for c in ACT0_COMMANDS:
        r = rcon(c)
        if r is None:
            return check('act 0 commands registered', UNKNOWN, 'rcon stopped answering')
        if 'Unknown or incomplete command' in r:
            missing.append('/' + c)
    if missing:
        return check('act 0 commands registered', BAD, 'not registered: ' + ', '.join(missing))
    return check('act 0 commands registered', OK,
                 '%d/%d parse' % (len(ACT0_COMMANDS), len(ACT0_COMMANDS)))


# ==========================================================================
# THE EYES HALF - the numbered playtest
# ==========================================================================
#
# IN PLAY ORDER, not in build order. You test Act 0 by playing Act 0; a checklist grouped
# by which file owns each thing makes somebody jump around a cave for an hour.
SCRIPT = [
    ('the opening', [
        ('a fresh player sees the title card type itself out, and NOTHING else',
         '/opening reset then relog'),
        ('the card is legible, clear of the crosshair and the Seasons HUD',
         'watch it - the fade is half the question, a screenshot cannot answer it'),
        ('a book titled Journal is in the inventory, and it opens',
         '/opening journal'),
        ('the journal holds all 18 sentences and reads as one piece',
         'open it and read to the end'),
        ('reaching a beat fires a toast, and the Act 0 tab renders with icons',
         '/story reach the_caves'),
    ]),
    ('Ank arrives', [
        ('he spawns when you enter a cave, without you doing anything',
         'walk into the upper caves and wait up to 2s'),
        ('he wears his own skin, not a missing-texture check pattern',
         'look at him. F3+T first if you suspect the client cache'),
        ('he follows you around the cave',
         'walk 20 blocks and look back'),
        ('he survives being hit - a player cannot kill him',
         'hit him repeatedly with the best weapon you have'),
        # THESE TWO ARE THE SAME COMMAND AND OPPOSITE ANSWERS, and writing them as one
        # item is a trap. /kill @e[tag=veldora_ank] is EXACTLY what ank.js's despawn runs.
        # If he survives it, unkillability works AND the despawn is broken - so a tester
        # who filed one pass for "he cannot be killed" would be recording a green for the
        # observation that proves the boundary cannot remove him.
        ('/kill on him REMOVES him - if it does not, the despawn path is broken and '
         'needs `easy_npc despawn` instead',
         '/kill @e[tag=veldora_ank] then look for him'),
    ]),
    ('Ank talks', [
        ('his greeting arrives in the CHAT BAR as <Ank>, like any person speaking',
         '/ank greet 7'),
        ('a five-line day reads as somebody talking, not as a wall of text',
         '/ank greet 7 and watch the pacing'),
        ('he greets ONCE a day - leaving and returning does not repeat it',
         'go below -32, then come back up'),
        ('right-clicking him opens his dialogue with three options',
         'right-click him'),
        ('picking "Its none of your business" gets the sheriff answer',
         'the branch with three reply lines'),
    ]),
    ('Ank trades', [
        ('the trade UI opens, and the price is wheat rather than emeralds',
         'right-click him, or the trade button in his dialogue'),
        ('a first-time player can actually afford the tier-0 trade',
         'count the wheat it asks for against what a new player has'),
        ('after descending, his next offer is visibly better',
         'go below -32, come back, trade again'),
    ]),
    ('Ank leaves', [
        ('going below -32 despawns him and prints "A chill runs up your spine."',
         'dig down past the deep-works boundary'),
        ('stepping into daylight does the same',
         'walk out of the cave'),
        ('bobbing on the boundary does NOT loop the chill',
         'stand at y -31 and jump'),
        ('the chill reads as coming from nobody, not from Ank',
         'it is at the top of the screen; his own lines are in chat'),
    ]),
    ('the urge', [
        ('a day spent out of the deep produces an urge line',
         'sleep through a day topside. The pools are EMPTY until Ethan writes them'),
    ]),
]


# The code's own claims. prefire.js OWNS this format; this is a reader, not a second
# authority - and the ids are hashes of the CLAIM TEXT, which is what makes the same
# answer readable from both tools without either importing the other.
#
# THE REGEX IS DUPLICATED FROM prefire.js ON PURPOSE, and the duplication is safe in one
# direction only: if the two ever drift, prefire lists a marker this file cannot answer -
# visible on the next run. The reverse (this file answering something prefire does not
# list) cannot mark anything green, because prefire is what prints the owed list.
MARKER = re.compile(r'NEEDS-GAME:\s*(.+?)\s*::\s*(.+)$')
SCAN_DIRS = ['pack/kubejs/server_scripts', 'tools', 'docs']


def scan_markers():
    out = []
    for d in SCAN_DIRS:
        root = os.path.join(REPO, d)
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [x for x in dirnames if x not in ('archive', '.cache')]
            for fn in filenames:
                # THIS FILE AND prefire.js BOTH DESCRIBE THE MARKER, so scanning
                # them lists the regex itself as an outstanding item. prefire
                # already learned this; it appeared here on the first run anyway,
                # because the exclusion was copied and the new filename was not
                # added to it. A checklist whose entries include its own source
                # teaches you to stop reading it.
                if (not fn.endswith(('.js', '.py', '.md'))
                        or fn in ('prefire.js', 'act0_smoke.py')):
                    continue
                try:
                    lines = io.open(os.path.join(dirpath, fn),
                                    encoding='utf-8', errors='replace').read().splitlines()
                except Exception:
                    continue
                for ln in lines:
                    ln = re.sub(r'\s*-->\s*$', '', ln).rstrip()
                    m = MARKER.search(ln)
                    if m:
                        out.append((m.group(1), m.group(2)))
    return out


def sid(text):
    """A stable id for an eyes-only item: 6 hex of its own text.

    NOT file:line. An item that moves keeps its answer; an item whose CLAIM is edited
    loses it, which is right - a changed claim has not been tested.
    """
    return hashlib.sha256(text.encode('utf-8')).hexdigest()[:6]


def load_ledger():
    """Every recorded answer, or a hard stop.

    THE FIRST VERSION RETURNED {} ON ANY FAILURE, which meant a ledger that was corrupt,
    locked or half-written became an EMPTY one - and the very next `--pass` would write
    that empty dict back over every answer anybody had recorded. A file of human testing,
    destroyed by a bare `except`.

    "The file does not exist yet" and "the file exists and I could not read it" are two
    different states, and only one of them is fine.
    """
    if not os.path.exists(LEDGER):
        return {}
    try:
        d = json.load(io.open(LEDGER, encoding='utf-8'))
    except Exception as e:
        print('THE ANSWERS LEDGER IS UNREADABLE: %s' % e)
        print('  %s' % LEDGER)
        print('  Refusing to continue - writing now would overwrite every recorded answer.')
        print('  Fix or delete the file deliberately.')
        raise SystemExit(2)
    if not isinstance(d, dict):
        print('THE ANSWERS LEDGER IS NOT AN OBJECT. Refusing to continue.')
        raise SystemExit(2)
    # A STATE THAT IS NEITHER pass NOR fail MAKES AN ITEM VANISH from every list - not
    # owed, not failed, not answered. Loud, because invisible is the one thing it must
    # not be.
    for k, v in d.items():
        if k == '_totals':
            continue
        if not isinstance(v, dict) or v.get('state') not in ('pass', 'fail'):
            print('ledger entry %s has an unusable state %r - IGNORED, and its item '
                  'counted as unanswered.' % (k, (v or {}).get('state')))
    return d


def passed_count(led):
    """Items a person recorded as PASSING. Not "answered" - a failed item is answered and
    is the opposite of done, and counting the two together printed '38/38 answered' for a
    playtest in which every single item had failed."""
    return sum(1 for _, items in all_items() for w, _ in items
               if (led.get(sid(w)) or {}).get('state') == 'pass')


def failed_count(led):
    return sum(1 for _, items in all_items() for w, _ in items
               if (led.get(sid(w)) or {}).get('state') == 'fail')


def save_ledger(d):
    # WRITTEN WHOLE, THEN MOVED. Opening the real file for writing truncates it
    # before the first byte lands, so a serialisation error leaves an EMPTY
    # ledger - which is exactly how tools/story_harness.js was reduced to zero
    # bytes earlier today by a patch script that did the same thing.
    blob = (json.dumps(d, indent=1, ensure_ascii=False, sort_keys=True) +
            '\n').encode('utf-8')
    tmp = LEDGER + '.tmp'
    with open(tmp, 'wb') as fh:
        fh.write(blob)
    os.replace(tmp, LEDGER)

def all_items():
    """Every answerable item: the play-ordered script, then the code's own claims.

    ONE NAMESPACE, TWO SOURCES. A marker in the tree and a step in the playtest are both
    "something only a person can answer", and giving them separate ledgers is how one of
    them ends up never being looked at.
    """
    groups = list(SCRIPT)
    mk = scan_markers()
    if mk:
        groups.append(("the code's own claims (NEEDS-GAME markers)", mk))
    return groups


def print_script(led):
    print('')
    print('THE PLAYTEST - in play order. Record each with:')
    print('    python tools/act0_smoke.py --pass <id> --note "what you saw"')
    print('    python tools/act0_smoke.py --fail <id> --note "what went wrong"')
    n = 0
    for group, items in all_items():
        print('')
        print('  ' + group.upper())
        for what, how in items:
            n += 1
            i = sid(what)
            a = led.get(i)
            mark = '  ' if not a else ('ok' if a['state'] == 'pass' else 'XX')
            print('  %s %2d. [%s] %s' % (mark, n, i, what))
            print('            %s' % how)
            if a:
                print('            -> %s by %s, %s%s'
                      % (a['state'].upper(), a.get('who', '?'), a.get('when', '?'),
                         (' - ' + a['note']) if a.get('note') else ''))
    passed, failed = passed_count(led), failed_count(led)
    print('')
    print('  %d/%d PASSED%s.' % (passed, n,
          ', %d FAILED' % failed if failed else ''))
    if passed < n:
        print('  An unanswered item is NOT a passing one. Nothing here is green by default.')


def record(idx, state, note, who):
    led = load_ledger()
    known = {sid(w): w for _, items in all_items() for w, _ in items}
    if idx not in known:
        print('no such id: %s' % idx)
        print('run `python tools/act0_smoke.py --script` for the list')
        return 2
    led[idx] = {'what': known[idx], 'state': state, 'note': note or '',
                'who': who, 'when': datetime.now().strftime('%Y-%m-%d %H:%M')}
    # THE PLAYTEST IS INVISIBLE TO prefire WITHOUT THIS. prefire's owed list comes from the
    # NEEDS-GAME markers in the tree; the 22 play-ordered steps - the title card, the skin,
    # the <Ank> chat bar, the wheat price, the chill - exist only inside this file, which
    # prefire deliberately does not scan. So it could print "nothing is waiting on the
    # game" with the entire playtest untouched, which is the half that actually matters.
    #
    # Written on every answer rather than computed by prefire, because prefire cannot
    # import a Python file - and a total it cannot recompute is one it must be TOLD, with
    # the timestamp so a stale one is visible rather than trusted.
    led['_totals'] = {
        'script': sum(len(i) for g, i in SCRIPT),
        'markers': len(scan_markers()),
        'passed': sum(1 for k, v in led.items()
                      if k != '_totals' and isinstance(v, dict) and v.get('state') == 'pass'),
        'failed': sum(1 for k, v in led.items()
                      if k != '_totals' and isinstance(v, dict) and v.get('state') == 'fail'),
        'when': datetime.now().strftime('%Y-%m-%d %H:%M'),
    }
    save_ledger(led)
    print('%s  %s' % (state.upper(), known[idx]))
    if note:
        print('      %s' % note)
    return 0


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument('--script', action='store_true', help='print the by-hand playtest')
    ap.add_argument('--answers', action='store_true', help='what has been answered')
    ap.add_argument('--pass', dest='ok', metavar='ID')
    ap.add_argument('--fail', dest='no', metavar='ID')
    ap.add_argument('--note', default='')
    ap.add_argument('--who', default='Ethan')
    a = ap.parse_args()

    if a.ok or a.no:
        return record(a.ok or a.no, 'pass' if a.ok else 'fail', a.note, a.who)

    led = load_ledger()
    if a.answers:
        if not led:
            print('nothing answered yet.')
            return 1
        for k, v in sorted(led.items(), key=lambda kv: kv[1]['when']):
            print('%s  %s  %s' % (v['state'].upper().ljust(4), v['when'], v['what']))
            if v.get('note'):
                print('      %s' % v['note'])
        return 0

    if a.script:
        print_script(led)
        return 0

    print('act0_smoke.py - asking the RUNNING SERVER about Act 0')
    print('=' * 78)
    up = c_up()
    c_boot_is_current()
    c_banners()
    c_no_throws()
    c_his_words()
    if up:
        c_datapacks()
        c_presets()
        c_story_audit()
        c_commands()
    else:
        for n in ('act 0 datapacks on', 'ank presets registered',
                  'the 9 beats agree', 'act 0 commands registered'):
            check(n, UNKNOWN, 'skipped - the server is down')

    print('=' * 78)
    bad = [r for r in results if r[1] == BAD]
    unk = [r for r in results if r[1] == UNKNOWN]
    print('%d ok, %d FAILING, %d UNKNOWN' % (len(results) - len(bad) - len(unk),
                                             len(bad), len(unk)))
    if unk:
        print('An UNKNOWN is a FAILURE here. A check that could not look has not passed.')

    total = sum(len(i) for _, i in all_items())
    done = passed_count(led)
    eyes_failed = failed_count(led)
    print('')
    print('AND THE ABOVE IS THE SMALL HALF. %d/%d eyes-only items PASSED%s - run'
          % (done, total, ', %d FAILED' % eyes_failed if eyes_failed else ''))
    print('   `python tools/act0_smoke.py --script`. A green RCON half does not make any')
    print('   of them true; that substitution is how this pack shipped with fonts')
    print('   rendering as tofu and a title card that had never once rendered.')
    # THE EXIT CODE USED TO CONSULT ONLY THE RCON HALF, so this file could exit 0 with
    # every eyes-only item unanswered - the precise substitution its own header condemns.
    # An unanswered eyes item is an UNKNOWN, and this file's rule is that an UNKNOWN is a
    # failure.
    if eyes_failed:
        print('   %d eyes-only item(s) FAILED. Somebody looked and they were wrong.'
              % eyes_failed)
    return 1 if (bad or unk or eyes_failed or done < total) else 0


if __name__ == '__main__':
    sys.exit(main())
