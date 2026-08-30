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
// 🚨 A FILE THAT CRASHES IS NOT A FILE THAT FAILED. `deep_speaker_harness` threw on an
// undefined property and lost every assertion after it with no summary line at all. This
// runner reports CRASH separately from FAIL for exactly that reason: a crash means the
// count you are reading is not the count that exists.
'use strict'
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const T = __dirname
const filter = process.argv[2] || ''
const files = fs.readdirSync(T)
  // ⚠️ .py CHECKS COUNT TOO. hud_zone_check.py was written, run once by hand and then
  // would never have run again - a check outside the sweep is a check that rots. The
  // interpreter is chosen per file rather than assuming everything is node.
  .filter(f => /_(harness|check)\.(js|py)$/.test(f))
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
  // The summary line each file prints, in either of the two shapes they use.
  const sum = (clean.match(/^\s*(?:\d+\/\d+ passed\.?|\d+ passed|\d+ FAILED, \d+ passed|\d+ passed, \d+ failed)\s*$/m) || [''])[0].trim()
  // ⚠️ A missing summary on a non-zero exit is a CRASH, not a failure. They are different
  // facts and collapsing them is how a dead file passes for a failing one.
  const isCrash = code !== 0 && !sum
  if (isCrash) { crashed++; bad.push([name, 'CRASH', (clean.trim().split('\n').pop() || '').slice(0, 70)]) }
  else if (code !== 0) { red++; bad.push([name, 'FAIL', sum]) }
  else green++

  const badge = isCrash ? (R + 'CRASH' + X) : code !== 0 ? (R + ' FAIL' + X) : (G + '   ok' + X)
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
process.exit(bad.length ? 1 : 0)
