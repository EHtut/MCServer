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
// notoriety.js asks paths.js who this player follows, because a rank is a
// relationship with ONE god. Without this stub awardTrust correctly refuses to rank
// an unclaimed player - which is right, and which made four assertions fail until the
// stub existed. The refusal is the feature; the missing stub was the bug.
let PATH = 'blade'
global.VELDORA = { paths: { pathOf: () => PATH } }

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

grp('🚨 RULING B — falling must make the next Trial arrive LATER')
{
  // 🔴 THE SIGN OF THIS CURVE IS THE WHOLE TEST. It used to ASCEND, because a sooner
  // Harvest was a threat. Under the Trial reframe losing is FREE, so a sooner Trial is
  // a free chance at +1 rank — and ascending made falling the optimal strategy. Ethan
  // ruled B on 2026-08-24: falling delays you.
  //
  // ⭐ ASSERTED AS A DIRECTION, NOT A TABLE. If somebody restores the old numbers this
  // fails on the invariant rather than on a value that could be "re-tuned" past it.
  const clean = rateNow()
  ok('a clean player runs at full speed', clean, 1)

  fall()
  const one = rateNow()
  ok('🚨 one fall makes notoriety SLOWER, never faster', one < clean, true)

  fall(); fall(); fall()
  const four = rateNow()
  ok('...and four falls are slower still', four < one, true)

  fall(); fall(); fall()
  ok('...but it FLOORS rather than stalling forever', rateNow(), four)
  ok('...and the floor is still forward progress, not zero', four > 0, true)
}

grp('⭐ FORGIVENESS — the delay is a debt, not a brand')
{
  // Each fall re-anchors lastHarvestDay, so time only runs from the last one.
  const worst = rateNow()
  DAY += 48
  ok('48 days of not falling walks it back', rateNow() > worst, true)
  DAY += 48                                    // 96 days since the last fall
  ok('🚨 96 days on it is FULLY forgiven', rateNow(), 1)
}

grp('⚠️ THE GUARDS — a clock that misbehaves must not corrupt the rate')
{
  const before = rateNow()
  DAY -= 500                                   // admin ran /time set; clock goes backwards
  // breakdown() clamps a negative `since` to 0 (its own comment, guarding finding K9).
  // Zero elapsed days means zero forgiveness, so a backwards clock momentarily restores
  // the full stored penalty rather than softening it.
  //
  // 🚨 KNOWN LIMITATION: a PERMANENTLY rewound clock would sit at since=0 forever and
  // never forgive. The next fall re-anchors and repairs it, and a permanently rewound
  // world clock means notoriety is moot anyway — but if that stops being true,
  // re-anchor on read instead of clamping.
  ok('a backwards clock suspends forgiveness (harsh, and deliberate)', rateNow() < before, true)
  DAY += 500
  ok('...and it recovers the moment the clock does', rateNow(), before)
}

grp('⭐ TRUST — the rank that actually buys the buffs')
{
  ok('the seam is published', typeof N.trust, 'function')
  ok('an unranked player is rank 0', N.trust(server, player), 0)
  ok('...and scales to 0.0 for power.js', N.trustScale(server, player), 0)

  hush(); N.awardTrust(server, player, 1, 'test'); speak()
  ok('a Trial win raises the rank', N.trust(server, player), 1)
  ok('...and the scale moves with it', N.trustScale(server, player), 1 / N.trustMax())

  hush(); for (let i = 0; i < 20; i++) N.awardTrust(server, player, 1, 'test'); speak()
  ok('🚨 it CAPS at trustMax - no runaway power', N.trust(server, player), N.trustMax())
  ok('...and the scale caps at exactly 1.0', N.trustScale(server, player), 1)

  // ⭐ PER PATH. A rank is a relationship with one god; switching paths must not spend
  // or inherit a rank earned somewhere else.
  ok('a DIFFERENT path has its own rank', N.trust(server, player, 'salvage'), 0)
  // ⭐ And the refusal path is worth pinning: an unclaimed player cannot be ranked,
  // because a rank is a relationship and they are not in one.
  PATH = ''
  hush(); const orphan = N.awardTrust(server, player, 1, 'test'); speak()
  ok('a pathless player CANNOT be ranked', orphan, null)
  PATH = 'blade'
}

grp('⭐ THE RESET — "notoriety resets to 0" without taking anything')
{
  // docs/63 §3: notoriety is derived, so the reset is an OFFSET, not a wipe. The player
  // keeps every XP level they earned.
  // ⚠️ Re-anchor FIRST. Earlier groups advanced the clock ~100 days, so the day-floor
  // term dominates and the xp term is invisible. Testing the offset means starting
  // from a clean anchor, or the assertion measures the wrong half of the max().
  hush(); N.resetTrialClock(server, player, 'setup'); speak()
  XP = 40
  ok('40 levels earned SINCE the anchor reads as 40', N.notoriety(server, player).value, 40)
  hush(); N.resetTrialClock(server, player, 'test'); speak()
  ok('🚨 after a Trial it reads 0', N.notoriety(server, player).value, 0)
  ok('...and the player still HAS their 40 levels', XP, 40)
  XP = 55
  ok('...and only progress SINCE the Trial counts', N.notoriety(server, player).value, 15)
}

console.log('\n' + (fail === 0
  ? G + pass + '/' + (pass + fail) + ' passed' + X
  : R + fail + ' FAILED' + X + ', ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
