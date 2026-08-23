// wall_aura_harness.js — prove the web bites, and prove it never kills.
//
//     node tools/wall_aura_harness.js
//
// ⭐ WHY THIS EXISTS. The whole design of wall_aura.js is a NEGATIVE: hostiles near a
// Wall champion get wounded and slowed, and are NEVER finished. That invariant cannot
// be play-tested — nobody can stand in a cave and confirm they observed a mob failing
// to die. It is also the one thing that, if broken, quietly steals the player's own
// income: a mob killed by setHealth(0) has no killer, so no drop payout and no counter
// credit.
//
// 🚨 AND IT IS FULL OF ACCESSORS THAT LIE. `e.maxHealth` was in the first draft and is
// not the accessor — stalker.js already had `getAttribute('...max_health').getValue()`
// with a fallback of 20. Reading a mob's max health as `undefined` gives a floor of
// NaN, every comparison against NaN is false, and the aura would have bitten straight
// through to zero while looking correct. That is precisely what this checks.
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

// ── a mob you can describe in a sentence ──────────────────────────────────────
function mob(opts) {
  const o = opts || {}
  const m = {
    health: o.hp === undefined ? 20 : o.hp,
    _max: o.max === undefined ? 20 : o.max,
    _monster: o.monster === undefined ? true : o.monster,
    _tags: o.tags || [],
    _throwMax: !!o.throwMax,
    effects: [],
    player: !!o.player,
    tags: { contains: (t) => (o.tags || []).indexOf(t) !== -1 },
    isMonster: () => {
      if (o.monsterThrows) throw new Error('no such method')
      return m._monster
    },
    // The REAL accessor, shaped exactly as stalker.js reaches for it.
    getAttribute: (id) => {
      if (m._throwMax) throw new Error('no attribute')
      if (id !== 'minecraft:generic.max_health') throw new Error('wrong attribute id: ' + id)
      return { getValue: () => m._max }
    },
    setHealth: (v) => { m.health = v },
    potionEffects: { add: (id, ticks, amp) => m.effects.push([id, ticks, amp]) },
  }
  return m
}

let NEAR = []
let INFLATED = null
const player = {
  username: 'Webbed', uuid: 'u-W', player: true,
  isAlive: () => true,
  boundingBox: { inflate: (r) => { INFLATED = r; return 'box:' + r } },
  level: { getEntitiesWithin: () => NEAR },
}

global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {
  paths: { pathOf: () => 'wall' },
  trust: () => 5,
}

const ri = console.info, rw = console.warn, re = console.error
const hush = () => { console.info = console.warn = console.error = () => { } }
const speak = () => { console.info = ri; console.warn = rw; console.error = re }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'wall_aura.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: wall_aura.js threw on load :: ' + e); process.exit(1) }
speak()

const A = global.VELDORA.wallAura
if (!A) { console.error('FAIL: wall_aura.js published nothing'); process.exit(1) }
if (typeof A._bite !== 'function') {
  console.error('FAIL: _bite is not exported - the floor invariant cannot be tested')
  process.exit(1)
}
const server = {}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 IT NEVER KILLS — the invariant the whole design rests on')
{
  // A 20hp mob, floor 25% = 5hp. Rank 5 bites 3.0 per sweep. Twenty sweeps would
  // take it to -40 if the floor were not honoured.
  const m = mob({ hp: 20, max: 20 })
  NEAR = [m]
  for (let i = 0; i < 20; i++) A._bite(server, player, 5)
  ok('🚨 twenty sweeps do NOT kill it', m.health > 0, true)
  ok('...it rests exactly on the floor', m.health, 5)
  ok('...which is floorFrac of its max', m.health, 20 * A.floorFrac)
}

grp('🔴 THE CLAMP ITSELF — the case my own first test could not see')
{
  // 🚨 THE NEGATIVE CONTROL CAUGHT THIS TEST, NOT THE CODE. Deleting the
  // `if (next < floor) next = floor` clamp left the suite at 28/28 green, because
  // every mob I had written divided evenly: 20hp, floor 5, bite 3 walks
  // 20-17-14-11-8-5 and lands ON the floor, where the `hp <= floor` guard above
  // catches it. The clamp was never reached, so removing it changed nothing.
  //
  // 🔑 A CLAMP IS ONLY TESTED BY AN OVERSHOOT. 21hp gives a floor of 5.25, and a
  // bite of 3 walks 21-18-15-12-9-6-3 — straight PAST it. Without the clamp the mob
  // rests at 3, below its own floor. With it, 5.25.
  const m = mob({ hp: 21, max: 21 })
  NEAR = [m]
  for (let i = 0; i < 20; i++) A._bite(server, player, 5)
  ok('🚨 an overshooting bite is clamped to the floor, not past it', m.health, 21 * A.floorFrac)
  ok('...and that floor is NOT a whole number, which is the point', m.health, 5.25)

  // The tightest case: one bite from just above the floor, straight through it.
  const tight = mob({ hp: 6, max: 20 })      // floor 5, bite 3 -> would land on 3
  NEAR = [tight]
  A._bite(server, player, 5)
  ok('🚨 a single bite cannot cross the floor either', tight.health, 5)
}

grp('⭐ IT WOUNDS, AND THE FIRST BITE IS THE RANK')
{
  const m = mob({ hp: 20, max: 20 })
  NEAR = [m]
  A._bite(server, player, 5)
  ok('rank 5 takes biteAt(5)', m.health, 20 - A.biteAt(5))

  const m2 = mob({ hp: 20, max: 20 })
  NEAR = [m2]
  A._bite(server, player, 1)
  ok('rank 1 takes much less', m2.health, 20 - A.biteAt(1))
  ok('🚨 and rank 1 hurts LESS than rank 5 - scaling is an increase',
    A.biteAt(1) < A.biteAt(5), true)
}

grp('⚠️ RANK 0 IS OFF, NOT NEGATIVE')
{
  const m = mob({ hp: 20, max: 20 })
  NEAR = [m]
  const touched = A._bite(server, player, 0)
  ok('rank 0 touches nothing', touched, 0)
  ok('...and the mob is untouched', m.health, 20)
  ok('🚨 no rank ever HEALS a hostile (Ethan: never below 1, always an increase)',
    [0, 1, 2, 3, 4, 5].every(r => A.biteAt(r) >= 0), true)
}

grp('⭐ THE RADIUS GROWS WITH RANK')
{
  NEAR = []
  A._bite(server, player, 1); const r1 = INFLATED
  A._bite(server, player, 5); const r5 = INFLATED
  ok('rank 5 reaches further than rank 1', r5 > r1, true)
  ok('...and it matches the published radiusAt', r5, A.radiusAt(5))
}

grp('🚨 WHAT IT MUST NOT TOUCH')
{
  const friend = mob({ hp: 20, max: 20, tags: ['veldora_wall_actor'] })
  const harvest = mob({ hp: 20, max: 20, tags: ['veldora_wall_harvest'] })
  const cow = mob({ hp: 10, max: 10, monster: false })
  const pl = mob({ hp: 20, max: 20, player: true })
  NEAR = [friend, harvest, cow, pl]
  const touched = A._bite(server, player, 5)
  ok('🚨 her own actors are not bitten by her own web', friend.health, 20)
  ok('🚨 nor her harvest actors', harvest.health, 20)
  ok('passive mobs are not bitten', cow.health, 10)
  ok('🚨 players are never bitten', pl.health, 20)
  ok('...so nothing at all was touched', touched, 0)
}

grp('⭐ IT WEBS WHAT IT BITES — and webs what it has already floored')
{
  const m = mob({ hp: 20, max: 20 })
  NEAR = [m]
  A._bite(server, player, 5)
  ok('a bitten mob is slowed', m.effects.length > 0, true)
  ok('...with slowness', m.effects[0][0], 'minecraft:slowness')

  // Drive it to the floor, then confirm it KEEPS being slowed. A mob parked at the
  // floor must not silently stop being webbed - it is still standing next to her.
  for (let i = 0; i < 20; i++) A._bite(server, player, 5)
  const atFloor = m.effects.length
  A._bite(server, player, 5)
  ok('🚨 a mob already at the floor is still webbed', m.effects.length > atFloor, true)
  ok('...and is not damaged further', m.health, 5)
}

grp('🔴 THE ACCESSOR THAT LIED — max health must come from getAttribute')
{
  // A mob whose max is 100. If max health were read as `undefined`, the floor would
  // be NaN, every `hp <= floor` and `next < floor` comparison would be false, and the
  // bite would run straight through zero. This is the first draft's bug, pinned.
  const big = mob({ hp: 100, max: 100 })
  NEAR = [big]
  for (let i = 0; i < 200; i++) A._bite(server, player, 5)
  ok('🚨 a 100hp mob floors at 25, not at zero or NaN', big.health, 25)
  ok('...and the helper reads the attribute, not a property', A._maxHealthOf(big), 100)

  // And when the attribute is unreadable it must fall back to 20, never to NaN.
  const blind = mob({ hp: 20, max: 20, throwMax: true })
  ok('an unreadable attribute falls back to 20, never NaN', A._maxHealthOf(blind), 20)
  NEAR = [blind]
  for (let i = 0; i < 50; i++) A._bite(server, player, 5)
  ok('🚨 ...so even a blind mob is not killed', blind.health, 5)
}

grp('⚠️ A BROKEN isMonster() DISABLES IT, LOUDLY — it must not bite everything')
{
  const angry = mob({ hp: 20, max: 20, monsterThrows: true })
  NEAR = [angry]
  hush()
  const touched = A._bite(server, player, 5)
  speak()
  ok('🚨 it bails rather than treating an unreadable mob as hostile', touched, 0)
  ok('...and the mob is untouched', angry.health, 20)
}

grp('⚠️ THE PER-SWEEP CEILING HOLDS')
{
  NEAR = []
  for (let i = 0; i < 60; i++) NEAR.push(mob({ hp: 20, max: 20 }))
  const touched = A._bite(server, player, 5)
  ok('never touches more than the ceiling in one sweep', touched <= 24, true)
  ok('...and the ceiling is actually reached with 60 candidates', touched, 24)
}

console.log('\n' + (fail === 0
  ? G + pass + '/' + (pass + fail) + ' passed' + X
  : R + fail + ' FAILED' + X + ', ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
