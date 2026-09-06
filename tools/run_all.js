// run_all.js — every harness and every check, one command.
//
//     node tools/run_all.js            all of them
//     node tools/run_all.js voice      only those matching "voice"
//
// ⭐ WHY THIS EXISTS. There are 30 test files and there was no runner, so "everything is
// green" was a claim somebody made after running a handful by hand. On 2026-08-30 that
// claim was made about FIVE of them while SEVEN were red - and the seven had been red
// for a while, because nothing ever ran them together.
//
// ── ⚠️ KNOWN-RED, WITH A REASON AND AN ID ─────────────────────────────────
// A suite that is red on arrival for a reason nobody intends to fix today trains you to
// ignore the colour, and the next REAL failure then lands in an already-red result. This
// project has that lesson written into prefire.js's `knownFailing` for D-134.
//
// ⛔ AN ENTRY HERE IS A DEBT, NOT A DISMISSAL. It still runs, its output is still printed,
// and the id says where the backlog is written down. Remove the entry the moment it goes
// green — a known-failing note that has been fixed is the next stale claim.
const KNOWN_RED = {
  // ⚠️ KEYED WITHOUT `.js` - that is what the sweep calls a file, and the first version
  // of this entry used the filename and silently never matched.
  'gods_in_chat_check':
    'D-148 - 53 chat sends from bodiless speakers across 14 files, found when this check ' +
    'was rewritten. The rule is new (2026-09-06); the backlog is not triaged yet.',
}

// 🚨 A FILE THAT CRASHES IS NOT A FILE THAT FAILED. `deep_speaker_harness` threw on an
// undefined property and lost every assertion after it with no summary line at all. This
// runner reports CRASH separately from FAIL for exactly that reason: a crash means the
// count you are reading is not the count that exists.
'use strict'
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

// Checks that WRITE to the running game. Excluded unless --live is passed.
const LIVE_MUTATING = ['im_live_check.py', 'spawn_persist_check.py']

const T = __dirname
const filter = process.argv[2] || ''
const files = fs.readdirSync(T)
  // ⚠️ .py CHECKS COUNT TOO. hud_zone_check.py was written, run once by hand and then
  // would never have run again - a check outside the sweep is a check that rots. The
  // interpreter is chosen per file rather than assuming everything is node.
  .filter(f => /_(harness|check)\.(js|py)$/.test(f))
  // 🔴🔴 SOME CHECKS WRITE TO THE LIVE GAME, AND THEY MUST NOT RUN IN A SWEEP.
  //
  // I folded *_check.py into this runner earlier and did not ask what those checks DO.
  // Two of them mutate a running server:
  //
  //   im_live_check       sends test overlays to whoever is online. Ethan spent a play
  //                       session with `a "quoted" word` appearing at the top of his
  //                       screen, and could not test the game because of it.
  //   spawn_persist_check SPAWNS MOBS next to a player to see whether they persist.
  //
  // Every time I ran the suite - dozens of times tonight, while he was trying to play -
  // both fired at him. That is my change doing it, not a pre-existing fault.
  //
  // 🔑 A test that changes the thing it measures cannot be part of an automatic sweep.
  // Run them deliberately, with nobody in the world or with a player who has agreed to it:
  //     node tools/run_all.js --live
  .filter(f => LIVE_MUTATING.indexOf(f) === -1 || process.argv.includes('--live'))
  .filter(f => !filter || f.indexOf(filter) !== -1)
  .sort()

const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', B = '\x1b[1m', X = '\x1b[0m'
const strip = s => s.replace(/\x1b\[[0-9;]*m/g, '')

let green = 0, red = 0, crashed = 0
const bad = []

for (const f of files) {
  const name = f.replace(/\.(js|py)$/, '')
  let out = '', code = 0
  const py = f.endsWith('.py')
  const exe = py ? 'python' : process.execPath
  try {
    out = execFileSync(exe, [path.join(T, f)], { encoding: 'utf8', stdio: 'pipe' })
  } catch (e) {
    code = e.status === undefined ? -1 : e.status
    out = (e.stdout || '') + (e.stderr || '')
  }
  const clean = strip(out)
  // The summary line each file prints, in any of the shapes they use.
  //
  // 🔴 A SHAPE THIS MISSES TURNS EVERY FAILURE IN THAT FILE INTO A "CRASH", which is the
  // one distinction this runner exists to keep. `crashout_two_harness` ends on a bare
  // `22/22` and `story_format_check` on `10 checks passed`; neither matched, so when
  // crashout_two flaked to 21/22 on 2026-08-31 this runner would have called it CRASH and
  // printed a truncated stack-shaped last line - sending the reader looking for a thrown
  // exception that was never there.
  //
  // ⚠️ Widened by MEASUREMENT, not by guess: the old and new patterns were run against all
  // 36 files and differ on exactly those two, both from blank to their real summary.
  const sum = (clean.match(/^\s*(?:\d+\/\d+(?: passed)?\.?|\d+(?: \w+)? passed|\d+ FAILED, \d+ passed|\d+ passed, \d+ failed)\s*$/m) || [''])[0].trim()
  // ⚠️ A missing summary on a non-zero exit is a CRASH, not a failure. They are different
  // facts and collapsing them is how a dead file passes for a failing one.
  // 🔴 EXIT 3 IS A THIRD STATE, NOT A CRASH. spawn_persist_check returns it for
  // "some mobs could not be tested - re-run needed", which is deliberately distinct from
  // both clean(0) and failing(1). Collapsing it into CRASH made a check that was working
  // correctly look broken, and buried what it was actually telling us: the mobs it could
  // not verify included the Hunt crew swapped in the same day.
  const needsRerun = code === 3
  const isCrash = code !== 0 && !sum && !needsRerun
  // KNOWN-RED IS ITS OWN STATE, like RERUN. It is not green - the debt prints with its id
  // every run - but it does not turn the sweep red, because a suite that is red on arrival
  // is a suite nobody reads. A CRASH is never excused this way: known-red says "these
  // assertions fail", not "this file does not run".
  const known = code !== 0 && !isCrash && KNOWN_RED[name]
  if (isCrash) { crashed++; bad.push([name, 'CRASH', (clean.trim().split(String.fromCharCode(10)).pop() || '').slice(0, 70)]) }
  else if (needsRerun) { bad.push([name, 'RERUN', sum || 'some cases untested']) }
  else if (known) { bad.push([name, 'KNOWN', KNOWN_RED[name]]) }
  else if (code !== 0) { red++; bad.push([name, 'FAIL', sum]) }
  else green++

  const badge = isCrash ? (R + 'CRASH' + X)
    : needsRerun ? (Y + 'RERUN' + X)
    : known ? (Y + 'KNOWN' + X)
    : code !== 0 ? (R + ' FAIL' + X) : (G + '   ok' + X)
  console.log(badge + '  ' + name.padEnd(26) + (sum || ''))
}

console.log('\n' + B + files.length + ' file(s): ' + X +
  G + green + ' green' + X +
  (red ? ', ' + R + red + ' failing' + X : '') +
  (crashed ? ', ' + R + crashed + ' CRASHED' + X : ''))

if (bad.length) {
  console.log('\n' + Y + 'needs attention:' + X)
  for (const [n, kind, detail] of bad) console.log('  ' + kind + '  ' + n + '  ' + detail)
}
// 🔑 A crash exits non-zero even if it printed nothing - silence must not read as success.
//
// ⚠️ KNOWN and RERUN DO NOT FAIL THE SWEEP. They are still printed under "needs attention"
// every run, with their id - but a suite that is red on arrival for a triaged, written-down
// debt is a suite people stop reading, and then the next real failure lands in an
// already-red result. ⛔ red and crashed still fail, always.
process.exit((red || crashed) ? 1 : 0)
