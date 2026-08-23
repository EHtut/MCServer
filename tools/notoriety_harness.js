// notoriety_harness.js — the rate curve, and the ratchet the Harvest cut created.
//
// ⭐ WHY THIS FILE EXISTS. notoriety.js drives the day-floor, the phase bands, power
// scaling and drop rates, and until 2026-08-24 it had ZERO test coverage. The Harvest
// cut then removed the only thing that reset harvestCount — a WIN — while leaving
// fall.js free to keep incrementing it, turning the curve into a one-way ratchet that
// nothing would have caught.
//
// 🚨 IT ALSO CAUGHT ME ASSERTING THE OPPOSITE. For half a day this repo carried a
// comment and a boot banner claiming harvestCount "can never increment" and the curve
// was "PINNED AT 1". Both were wrong. A test would have said so in a second.
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

// ── the smallest NBT-alike that notoriety.js actually uses ────────────────
function Compound(seed) {
  const m = Object.assign({}, seed || {})
  return {
    _m: m,
    getInt: (k) => (typeof m[k] === 'number' ? m[k] : 0),
    putInt: (k, v) => { m[k] = v },
    getString: (k) => (typeof m[k] === 'string' ? m[k] : ''),
    putString: (k, v) => { m[k] = v },
    contains: (k) => Object.prototype.hasOwnProperty.call(m, k),
  }
}
function Store() {
  const kids = {}
  return {
    getCompound: (k) => { if (!kids[k]) kids[k] = Compound(); return kids[k] },
    put: (k, v) => { kids[k] = v },
    contains: (k) => Object.prototype.hasOwnProperty.call(kids, k),
    _kids: kids,
  }
}

let DAY = 100
const root = Store()
const server = {
  persistentData: {
    _root: null,
    getCompound: (k) => { if (!server.persistentData._root) server.persistentData._root = root; return root },
    put: (k, v) => { server.persistentData._root = v },
    contains: () => !!server.persistentData._root,
  },
  overworld: () => ({ dayTime: () => DAY * 24000 + 6000 }),
}
let XP = 0
const player = { uuid: 'u-1', username: 'Tester', xpLevel: 0 }
Object.defineProperty(player, 'xpLevel', { get: () => XP })

global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { }, beforeHurt: () => { } }
global.PlayerEvents = { loggedIn: () => { }, tick: () => { }, respawned: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {}

const ri = console.info, rw = console.warn, re = console.error
const hush = () => { console.info = console.warn = console.error = () => { } }
const speak = () => { console.info = ri; console.warn = rw; console.error = re }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'notoriety.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: notoriety.js threw on load :: ' + e); process.exit(1) }
speak()

const N = global.VELDORA
if (typeof N.notoriety !== 'function' || typeof N.recordHarvest !== 'function') {
  console.error('FAIL: notoriety.js did not publish its seam'); process.exit(1)
}
const rateNow = () => { hush(); const r = N.notoriety(server, player); speak(); return r && r.rate }
const fall = () => { hush(); N.recordHarvest(server, player, false); speak() }

// ═══════════════════════════════════════════════════════════════════════════
grp('THE SEAM')
{
  ok('notoriety.js publishes VELDORA.notoriety', typeof N.notoriety, 'function')
  ok('a fresh player anchors at rate 1.0', rateNow(), 1)
}

grp('🚨 THE RATCHET — the Harvest cut removed the only reset')
{
  // fall.js still calls recordHarvest(won=false) on every fall. Nothing calls it with
  // won=true any more, because only harvest.js ever did.
  fall()
  ok('one fall escalates the rate', rateNow(), 1.5)
  fall(); fall(); fall()
  ok('four falls reach the ceiling', rateNow(), 3)
  fall(); fall(); fall()
  ok('...and it CAPS rather than growing forever', rateNow(), 3)
}

grp('⭐ FORGIVENESS — what stops it being one-way')
{
  // Each fall re-anchors lastHarvestDay to today, so time only starts running after
  // the last one. Seven falls are stored; forgiveness is one step per FORGIVE_DAYS.
  DAY += 12
  ok('12 days on, still pinned (7 stored falls, 1 forgiven)', rateNow(), 3)
  DAY += 36                                    // 48 days since the last fall
  // 48/12 = 4 steps forgiven, 7 stored -> effective 3 -> RATES[3] = 2.5.
  // ⚠️ MY FIRST EXPECTATION HERE WAS 3 AND THE CODE WAS RIGHT. Writing the arithmetic
  // into the label so the next person checks it rather than trusting the number.
  ok('48 days on: 7 falls - 4 forgiven = 3 -> rate 2.5', rateNow(), 2.5)
  DAY += 48                                    // 96 days
  ok('🚨 96 days on it is FULLY forgiven - not a ratchet', rateNow(), 1)
}

grp('⚠️ THE GUARDS — a clock that misbehaves must not corrupt the rate')
{
  const before = rateNow()
  DAY -= 500                                   // admin ran /time set; clock goes backwards
  // ⚠️ THIS ASSERTS THE HARSH DIRECTION ON PURPOSE, AND IT IS WORTH KNOWING.
  // breakdown() clamps a negative `since` to 0 ("do not go negative" — its own
  // comment, guarding finding K9). Zero elapsed days means zero forgiveness, so a
  // backwards clock momentarily restores the FULL stored escalation rather than
  // softening it.
  //
  // 🚨 KNOWN LIMITATION, NOT A BUG TODAY: if a clock were set backwards PERMANENTLY,
  // `since` would sit at 0 forever, forgiveness would never accrue, and the ratchet
  // this whole fix removes would come back. The next fall re-anchors lastHarvestDay
  // and repairs it, and a permanently-rewound world clock means notoriety is moot
  // anyway — but if that ever stops being true, re-anchor on read instead of clamping.
  ok('a backwards clock suspends forgiveness (harsh, and deliberate)', rateNow(), 3)
  DAY += 500
  ok('...and it recovers the moment the clock does', rateNow(), before)
}

console.log('\n' + (fail === 0
  ? G + pass + '/' + (pass + fail) + ' passed' + X
  : R + fail + ' FAILED' + X + ', ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
