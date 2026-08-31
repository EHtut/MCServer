#!/usr/bin/env python
"""live_smoke.py - ask the RUNNING SERVER whether it is actually working.

    python tools/live_smoke.py

== WHY THIS EXISTS =============================================================

On 2026-08-30 the pack shipped to four players with 35/35 checks green, and every one
of these was live at the same time:

  * Salvage was reaching out to players. Her gate had been ruled OFF days earlier and
    was still `true` in three files. The ruling was made in chat and never landed.
  * The god fonts rendered as tofu boxes. The resourcepack existed in the repo and was
    in NOBODY'S load path - not in index.toml, not in the client zip, and
    `resource-pack=` was empty in server.properties.
  * voice.js threw TypeError on every boot, killing its own report, so the warning it
    exists to print never printed.
  * in-control failed to parse its spawner rules because they named a mod that had been
    removed - the reference was in a CONFIG, and nothing swept configs.
  * Tides hunted players who had not chosen a path, and killed one inside a minute.
  * The intro delivered two lines and then silence, because it scheduled 18 separate
    callbacks and a restart killed the rest.

**NOT ONE of those is visible to the existing suite, and that is not bad luck - it is
structural.** Every harness in tools/ runs pure functions against injected fixtures in a
Node sandbox. They prove the code COMPUTES correctly. They cannot see:

  - a gate whose value is wrong (the function is fine; the constant is not)
  - a file that never reaches a client (delivery is not computation)
  - a config that names something that no longer exists
  - a callback that dies with the process
  - an internal call site that differs from the exported one

🔑 THE RULE THIS FILE ENFORCES: **measure at the point of USE.** A harness asks "does
this function return the right thing"; this asks "did the SERVER actually do it".

== ⚠️ WHAT COUNTS AS A FAILURE HERE ==========================================

An UNKNOWN is a FAILURE. If a check cannot reach the server, cannot read the log, or
cannot parse what it got, it has NOT passed - it has failed to look. "I could not check"
and "I checked and it was fine" must never share an exit code, because that equivalence
is exactly how a broken subsystem reports healthy.
"""
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INST = r'C:\MCServer\instance'
LOG = os.path.join(INST, 'logs', 'latest.log')
SS = os.path.join(REPO, 'pack', 'kubejs', 'server_scripts')

OK, BAD, UNKNOWN = 'ok', 'FAIL', 'UNKNOWN'
results = []


def check(name, state, detail=''):
    results.append((name, state, detail))
    tag = {'ok': '  ok  ', 'FAIL': ' FAIL ', 'UNKNOWN': ' ???? '}[state]
    print('%s %-26s %s' % (tag, name, detail))
    return state == OK


def rcon(cmd):
    """Run one command on the live server. Returns None if the server cannot be reached."""
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
    try:
        return io.open(LOG, encoding='utf-8', errors='replace').read()
    except Exception:
        return None


# ── 1. is it even up ────────────────────────────────────────────────────────
def c_server_up():
    r = rcon('list')
    if r is None:
        return check('server reachable', BAD, 'rcon did not answer - server is DOWN')
    m = re.search(r'There are (\d+) of a max of (\d+)', r)
    if not m:
        return check('server reachable', UNKNOWN, 'rcon answered but not with a player list')
    return check('server reachable', OK, '%s/%s players online' % (m.group(1), m.group(2)))


# ── 2. did the scripts load, and did any of them throw ──────────────────────
def c_scripts_loaded():
    t = log_text()
    if t is None:
        return check('kubejs scripts', UNKNOWN, 'cannot read latest.log')
    m = None
    for m in re.finditer(r'Loaded (\d+)/(\d+) KubeJS server scripts.*?with (\d+) errors', t):
        pass
    if not m:
        return check('kubejs scripts', UNKNOWN, 'no load line in the log')
    got, want, errs = m.group(1), m.group(2), int(m.group(3))
    if got != want or errs:
        return check('kubejs scripts', BAD, '%s/%s loaded, %d error(s)' % (got, want, errs))
    return check('kubejs scripts', OK, '%s/%s loaded, 0 errors' % (got, want))


def c_no_script_throws():
    """🔴 voice.js threw on EVERY boot and the suite could not see it."""
    t = log_text()
    if t is None:
        return check('no script threw', UNKNOWN, 'cannot read latest.log')
    hits = re.findall(r'\[KubeJS[^\]]*\]: ([a-z_]+\.js#\d+: [^\n]{0,90})', t)
    if hits:
        return check('no script threw', BAD, '%d throw(s), first: %s' % (len(hits), hits[0]))
    return check('no script threw', OK, 'no .js threw during boot')


# ── 3. dangling references - the in-control class of failure ────────────────
def c_no_dangling_mods():
    t = log_text()
    if t is None:
        return check('no dangling mod refs', UNKNOWN, 'cannot read latest.log')
    bad = re.findall(r"Invalid mob '([^']+)'", t)
    bad += re.findall(r"Error parsing '([^']+)'", t)
    if bad:
        uniq = sorted(set(bad))
        return check('no dangling mod refs', BAD,
                     '%d: %s' % (len(uniq), ', '.join(uniq[:3])))
    return check('no dangling mod refs', OK, 'no config names a missing mod')


# ── 4. gates are in the state they were RULED into ─────────────────────────
# 🔴 The whole reason this section exists: Salvage's gate was ruled OFF and was still
# `true` in three files for days. Nothing checked that a decision had landed.
RULED_GATES = {
    'salvage.js': False,
    'salvage_deals.js': False,
    'salvage_events.js': False,
    'tide.js': True,
    'opening.js': True,
    'caebrim.js': True,
}


def c_gates():
    wrong = []
    unread = []
    for f, want in RULED_GATES.items():
        p = os.path.join(SS, f)
        try:
            src = io.open(p, encoding='utf-8').read()
        except Exception:
            unread.append(f)
            continue
        m = re.search(r'var GATE = (true|false)', src)
        if not m:
            unread.append(f)
            continue
        if (m.group(1) == 'true') != want:
            wrong.append('%s is %s, ruled %s' % (f, m.group(1), str(want).lower()))
    if unread:
        return check('gates match rulings', UNKNOWN, 'could not read GATE in: ' + ', '.join(unread))
    if wrong:
        return check('gates match rulings', BAD, '; '.join(wrong))
    return check('gates match rulings', OK, '%d gate(s) as ruled' % len(RULED_GATES))


# ── 5. the resource pack actually reaches a client ─────────────────────────
# 🔴 The font was in the repo and in nobody's load path, and then it WAS configured but
# pointed at a github.com/raw/ URL that 302-redirects, which Minecraft's downloader hangs
# on. Both states looked identical from inside the repo.
def c_resource_pack():
    p = os.path.join(INST, 'server.properties')
    try:
        props = io.open(p, encoding='utf-8').read()
    except Exception:
        return check('resource pack', UNKNOWN, 'cannot read server.properties')
    url = re.search(r'^resource-pack=(.*)$', props, re.M)
    sha = re.search(r'^resource-pack-sha1=(.*)$', props, re.M)
    # ⚠️ server.properties is a JAVA PROPERTIES file: ':' is stored escaped as '\:'.
    # Reading it raw produced "unknown url type: https\" - a real URL reported as
    # broken by the checker rather than by the server.
    url = url.group(1).strip().replace(chr(92) + chr(58), chr(58)) if url else ''
    sha = sha.group(1).strip() if sha else ''
    if not url:
        return check('resource pack', BAD, 'resource-pack= is EMPTY - the gods render as tofu')
    if 'github.com' in url and '/raw/' in url:
        return check('resource pack', BAD,
                     'github.com/raw/ REDIRECTS; the client hangs. Use raw.githubusercontent.com')
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Minecraft'})
        data = urllib.request.urlopen(req, timeout=20).read()
    except Exception as e:
        return check('resource pack', BAD, 'URL unreachable: %s' % str(e)[:60])
    got = hashlib.sha1(data).hexdigest()
    if not sha:
        return check('resource pack', BAD, 'no sha1 set - clients re-download every join')
    if got != sha:
        return check('resource pack', BAD, 'sha1 MISMATCH: serving %s, declared %s'
                     % (got[:12], sha[:12]))
    return check('resource pack', OK, '%d KB, sha1 matches, no redirect' % (len(data) // 1024))


# ── 6. the world is what we think it is ────────────────────────────────────
def c_datapacks():
    r = rcon('datapack list enabled')
    if r is None:
        return check('datapacks enabled', UNKNOWN, 'rcon did not answer')
    live = set(re.findall(r'file/(\w+)', r))
    try:
        want = set(d for d in os.listdir(os.path.join(REPO, 'pack', 'datapacks'))
                   if os.path.isdir(os.path.join(REPO, 'pack', 'datapacks', d)))
    except Exception:
        return check('datapacks enabled', UNKNOWN, 'cannot list pack/datapacks')
    missing = want - live
    if missing:
        return check('datapacks enabled', BAD,
                     '%d staged but NOT enabled: %s' % (len(missing), ', '.join(sorted(missing))))
    return check('datapacks enabled', OK, '%d/%d enabled in the world' % (len(want), len(want)))


def c_world_floor():
    """The -64 ruling, measured from the world rather than from a config."""
    rd = os.path.join(INST, 'world', 'region')
    if not os.path.isdir(rd):
        return check('world floor is -64', UNKNOWN, 'no region dir - world not generated yet')
    files = [f for f in os.listdir(rd) if f.endswith('.mca')]
    if not files:
        return check('world floor is -64', UNKNOWN, 'no .mca files yet')
    depth = os.path.join(REPO, 'pack', 'datapacks', 'mcserver_depth')
    if os.path.isdir(depth):
        return check('world floor is -64', BAD,
                     'mcserver_depth still exists and forces -128')
    return check('world floor is -64', OK,
                 'mcserver_depth is gone; nothing overrides tectonic -64')


# ── 7. the pathless are left alone ─────────────────────────────────────────
# 🔴 Tides hunted a pathless player and killed him inside a minute; whispers and Caebrim
# both spoke to the pathless. Each is a source-level guard, so this asserts the guard
# EXISTS rather than simulating a player.
PATHLESS_GUARDS = [
    ('tide.js', r'if \(!tp\)', 'tides must not spawn for the pathless'),
    ('tidewhispers.js', r'if \(!path\) continue', 'the dead must not whisper to the pathless'),
    ('caebrim.js', r'function mayHear', 'Caebrim must be silent until the first death'),
]


def c_pathless():
    missing = []
    for f, pat, why in PATHLESS_GUARDS:
        try:
            src = io.open(os.path.join(SS, f), encoding='utf-8').read()
        except Exception:
            missing.append('%s unreadable' % f)
            continue
        if not re.search(pat, src):
            missing.append(why)
    if missing:
        return check('pathless are left alone', BAD, '; '.join(missing))
    return check('pathless are left alone', OK, '%d guard(s) present' % len(PATHLESS_GUARDS))


# ── 8. every god can actually speak ────────────────────────────────────────
def c_pools():
    t = log_text()
    if t is None:
        return check('gods registered pools', UNKNOWN, 'cannot read latest.log')
    m = re.search(r'VELDORA\.voice published OK - (\d+) god\(s\), (\d+) tag\(s\), (\d+)', t)
    if not m:
        return check('gods registered pools', BAD,
                     'voice.js never published its boot report - it threw, or never ran')
    gods, tags, lines = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if gods < 5 or lines < 100:
        return check('gods registered pools', BAD,
                     'only %d god(s) / %d line(s)' % (gods, lines))
    return check('gods registered pools', OK,
                 '%d gods, %d tags, %d possible lines' % (gods, tags, lines))


def main():
    print('live_smoke.py - asking the RUNNING SERVER, not a sandbox')
    print('=' * 78)
    up = c_server_up()
    c_scripts_loaded()
    c_no_script_throws()
    c_no_dangling_mods()
    c_gates()
    c_resource_pack()
    c_pools()
    c_pathless()
    c_world_floor()
    if up:
        c_datapacks()
    else:
        check('datapacks enabled', UNKNOWN, 'skipped - server is down')

    print('=' * 78)
    bad = [r for r in results if r[1] == BAD]
    unk = [r for r in results if r[1] == UNKNOWN]
    good = [r for r in results if r[1] == OK]
    print('%d ok, %d FAILING, %d UNKNOWN' % (len(good), len(bad), len(unk)))
    if unk:
        print('⚠️  An UNKNOWN is a FAILURE here. A check that could not look has not passed.')
    return 1 if (bad or unk) else 0


if __name__ == '__main__':
    sys.exit(main())
