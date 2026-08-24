// phase_harness.js — where does the Trial actually land?
//
//     node tools/phase_harness.js
//
// ⭐ WHY THIS EXISTS. The phase coefficient multiplied notoriety BEFORE banding, so the
// Trial arrived at raw 50 for Blade and raw 34 for Art against a bar everything in the
// game described as 100. Nothing was broken — every piece behaved exactly as written —
// and it still took a measurement to notice, because no single file contained both the
// multiply and the band edge.
//
// 🔴 THAT IS THE SHAPE OF BUG A HARNESS EXISTS FOR: not a crash, a NUMBER that nobody
// could see end to end. So this asserts the numbers a player actually meets.
//
// Ethan's ruling, 2026-08-24: keep the curve, stretch the bands — faster paths still
// arrive first, but every Trial lands nearer 75–100.
'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

let pass = 0, fail = 0
const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', X = '\x1b[0m'
function grp(t) { console.log('\n' + B + t + X) }
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}

// ── the fake world ────────────────────────────────────────────────────────────
let COEFF = 1
const server = {
  persistentData: {
    getCompound: () => ({ contains: () => false, getCompound: () => ({ getString: () => '' }) }),
  },
  players: [],
}
const player = { username: 'P', uuid: 'u-P' }

global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { }, spawned: () => { } }
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {
  coeff: { of: () => COEFF },
  notoriety: () => ({ value: 0 }),
}

const ri = console.info, rw = console.warn, re = console.error
const hush = () => { console.info = console.warn = console.error = () => { } }
const speak = () => { console.info = ri; console.warn = rw; console.error = re }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'phase.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: phase.js threw on load :: ' + e); process.exit(1) }
speak()

const PH = global.VELDORA.phase
if (!PH) { console.error('FAIL: phase.js published nothing'); process.exit(1) }
if (typeof PH.factor !== 'function' || typeof PH.trialAt !== 'function') {
  console.error('FAIL: phase.factor / phase.trialAt not exported - the bar cannot be tested')
  process.exit(1)
}

const trialAt = (c) => { COEFF = c; return PH.trialAt(server, player) }
const factorAt = (c) => { COEFF = c; return PH.factor(server, player) }

// ═══════════════════════════════════════════════════════════════════════════
grp("⭐ THE RULING — every Trial lands in 75–100 raw notoriety")
{
  ok('x1 paths still need the full 100', trialAt(1), 100)
  ok('blade (x2) needs 86, not 50', trialAt(2), 86)
  ok('art (x3) needs 75, not 34', trialAt(3), 75)

  const all = [1, 2, 3].map(trialAt)
  ok('🚨 every path is inside 75-100', all.every(v => v >= 75 && v <= 100), true)
}

grp('⭐ THE CURVE IS KEPT — a bigger coefficient still arrives sooner')
{
  const a = trialAt(1), b = trialAt(2), c = trialAt(3)
  ok('x3 arrives before x2', c < b, true)
  ok('x2 arrives before x1', b < a, true)
  ok('🚨 the ordering is strict, not merely non-increasing', c < b && b < a, true)
}

grp('🚨 THE FLOOR HOLDS AGAINST A COEFFICIENT NOBODY HAS INVENTED YET')
{
  ok('x4 is clamped, not extrapolated', trialAt(4), 75)
  ok('x10 too', trialAt(10), 75)
  ok('x1000 too', trialAt(1000), 75)
  ok('🚨 no coefficient can drag a Trial below the floor',
    [4, 10, 50, 1000].every(c => trialAt(c) >= PH.trialRawFloor), true)
  ok('...and the floor is the published one', PH.trialRawFloor, 75)
}

grp("⚠️ NEVER BELOW 1 — Ethan's standing rule, at the ladder")
{
  ok('a sub-1 coefficient does NOT lengthen the ladder', factorAt(0.5), 1)
  ok('...so the Trial still lands at 100, never later', trialAt(0.5), 100)
  ok('exactly 1 is exactly 1', factorAt(1), 1)
  ok('🚨 no coefficient ever produces a factor under 1',
    [0.01, 0.5, 0.99, 1, 2, 3].every(c => factorAt(c) >= 1), true)
}

grp('⚠️ A BROKEN OR MISSING COEFFICIENT READS AS 1, NOT AS ZERO')
{
  const real = global.VELDORA.coeff
  global.VELDORA.coeff = null
  ok('no coeff module at all -> factor 1', PH.factor(server, player), 1)
  ok('...and the default bar, not an unreachable one', PH.trialAt(server, player), 100)

  global.VELDORA.coeff = { of: () => { throw new Error('boom') } }
  ok('a coeff that THROWS -> factor 1', PH.factor(server, player), 1)

  global.VELDORA.coeff = { of: () => NaN }
  ok('NaN -> factor 1, never NaN', PH.factor(server, player), 1)

  global.VELDORA.coeff = { of: () => 0 }
  ok('zero -> factor 1, never a divide-by-zero bar', PH.trialAt(server, player), 100)

  global.VELDORA.coeff = real
}

grp('🔑 ONE IMPLEMENTATION — paths.js must not recompute the bar')
{
  const src = fs.readFileSync(path.join(SS, 'paths.js'), 'utf8')
  ok('🚨 /path consumes phase.trialAt', src.indexOf('VELDORA.phase.trialAt') !== -1, true)
  // The old line divided 100 by the RAW coefficient. If that ever comes back, the
  // display and the mechanic disagree again - which is exactly the bug this fixes.
  ok("...and no longer divides by the raw coeff itself",
    src.indexOf("Math.ceil(100 / pc)") === -1, true)
}

grp('⭐ THE BANDS THEMSELVES ARE UNTOUCHED')
{
  const edges = PH.bands.map(b => [b[0], b[1]])
  ok('still four bands', PH.bands.length, 4)
  ok('...with the same names and edges', edges,
    [['helper', 0], ['companion', 25], ['absence', 75], ['harvest', 100]])
  ok('🚨 harvest still starts at 100 in SCALED space', PH.bands[3][1], 100)
  ok('...and runs to infinity, so a fast path is never parked below it',
    PH.bands[3][2], Infinity)
}

grp('⚠️ HYSTERESIS SURVIVED THE REWRITE')
{
  ok('still sticky by 3', PH.hyst, 3)
  ok('a clean value bands normally', PH.resolve(10, ''), 'helper')
  ok('...and 80 is absence', PH.resolve(80, ''), 'absence')
  // Just inside the sticky zone below companion's floor: it should NOT drop back.
  ok('🚨 a value inside the hysteresis band does not fall out',
    PH.resolve(23, 'companion'), 'companion')
  ok('...but one clear of it does', PH.resolve(15, 'companion'), 'helper')
}

console.log('\n' + (fail === 0
  ? G + pass + '/' + (pass + fail) + ' passed' + X
  : R + fail + ' FAILED' + X + ', ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
