// spawner_harness.js — does a spawn actually reach the player?
//
// ⭐ WHY THIS FILE EXISTS. On 2026-08-24 Ethan reported that his brother had never seen
// a single tide mob. The tide was firing correctly and placing whole waves into SEALED
// POCKETS IN OTHER CAVES: findSpot() asked "can a mob stand here" and never "can it get
// to the player from here". Underground at 8-22 blocks almost every candidate that
// passes is a disconnected air pocket.
//
// 🚨 NOTHING COULD HAVE CAUGHT THAT. spawner.js had no harness at all, and the tide's
// harness stubs the spawner out entirely — so both suites were green while the headline
// mechanic was invisible in play.
//
// This builds SYNTHETIC WORLDS with known topology and asserts the fill's answers
// against them. A corridor is reachable. A sealed vault ten blocks away is not, however
// perfect a standing spot it is.
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

// ── a world you can describe in a sentence ────────────────────────────────
// AIR is a set of "x,y,z" that are open. Everything else is stone. The floor under an
// open cell is stone unless that cell is also in AIR, which is what makes a shaft.
let AIR = new Set()
const air = (x, y, z) => AIR.add(x + ',' + y + ',' + z)
function corridor(x0, x1, y, z) { for (let x = x0; x <= x1; x++) { air(x, y, z); air(x, y + 1, z) } }
function room(cx, cy, cz, r) {
  for (let x = cx - r; x <= cx + r; x++)
    for (let z = cz - r; z <= cz + r; z++) { air(x, cy, z); air(x, cy + 1, z) }
}

const level = {
  getBlock: (x, y, z) => ({ id: AIR.has(x + ',' + y + ',' + z) ? 'minecraft:cave_air' : 'minecraft:stone' }),
}
let YAW = 0
const player = {
  username: 'T', uuid: 'u-T', level,
  get yaw() { return YAW },
  blockPosition: () => ({ x: 0, y: 64, z: 0 }),
}

global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {}

const ri = console.info, rw = console.warn, re = console.error
const hush = () => { console.info = console.warn = console.error = () => { } }
const speak = () => { console.info = ri; console.warn = rw; console.error = re }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'spawner.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: spawner.js threw on load :: ' + e); process.exit(1) }
speak()

const S = global.VELDORA.spawner
if (!S) { console.error('FAIL: spawner.js published nothing'); process.exit(1) }
// reachableSpots is module-private by design; reach it the way the tide does, through
// a wave() call, OR expose it for the test. It is exported for exactly this reason.
const spots = S.reachableSpots
if (typeof spots !== 'function') {
  console.error('FAIL: VELDORA.spawner.reachableSpots is not exported - the guarantee cannot be tested')
  process.exit(1)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ A CORRIDOR IS REACHABLE')
{
  AIR = new Set()
  corridor(-2, 20, 64, 0)                    // straight east from the player
  const r = spots(player, 5, 11)
  ok('the fill ran', Array.isArray(r), true)
  ok('it found somewhere', r.length > 0, true)
  ok('🚨 every spot is inside the ring', r.every(s => s.d >= 5 && s.d <= 11), true)
  ok('...and all of them are on the corridor', r.every(s => Math.round(s.z - 0.5) === 0), true)
}

grp('🚨 A SEALED VAULT IS NOT — the bug this exists to prevent')
{
  AIR = new Set()
  corridor(-2, 2, 64, 0)                     // a tiny stub the player stands in
  room(8, 64, 0, 2)                          // a perfect room 8 blocks east, NO opening
  const r = spots(player, 5, 11)
  // The vault is full of flawless standing spots. findSpot() would have loved it.
  ok('🚨 the fill refuses the sealed vault entirely', r.length, 0)

  // ...and prove the vault really is a valid-looking place to stand, so the assertion
  // above is about REACHABILITY and not about the room being malformed.
  const inVault = AIR.has('8,64,0') && AIR.has('8,65,0') && !AIR.has('8,63,0')
  ok('...even though it is a textbook standing spot', inVault, true)
}

grp('⭐ A DOORWAY MAKES IT REACHABLE AGAIN')
{
  AIR = new Set()
  corridor(-2, 2, 64, 0)
  room(8, 64, 0, 2)
  corridor(2, 6, 64, 0)                      // punch the connection through
  const r = spots(player, 5, 11)
  ok('🚨 one opening changes the answer', r.length > 0, true)
}

grp('⚠️ THE GUARDS')
{
  AIR = new Set()
  corridor(-2, 20, 64, 0)
  const blind = { username: 'B', uuid: 'u-B', get yaw() { return 0 },
    blockPosition: () => ({ x: 0, y: 64, z: 0 }), level: { } }   // no getBlock
  ok('🚨 "cannot read blocks" returns null, never an empty list', spots(blind, 5, 11), null)

  AIR = new Set()                            // solid stone in every direction
  ok('...and "nowhere to stand" returns an empty list, not null',
    Array.isArray(spots(player, 5, 11)) && spots(player, 5, 11).length === 0, true)
}

grp('⭐ IT CLIMBS AND DROPS ONE BLOCK, LIKE A MOB')
{
  AIR = new Set()
  corridor(-2, 3, 64, 0)
  corridor(4, 12, 65, 0)                     // a one-block step up partway along
  const r = spots(player, 5, 11)
  ok('a single step up does not stop it', r.some(s => s.y === 65), true)

  AIR = new Set()
  corridor(-2, 3, 64, 0)
  corridor(4, 12, 60, 0)                     // a four-block drop - too far to walk
  const r2 = spots(player, 5, 11)
  ok('🚨 a four-block drop DOES stop it', r2.length, 0)
}

console.log('\n' + (fail === 0
  ? G + pass + '/' + (pass + fail) + ' passed' + X
  : R + fail + ' FAILED' + X + ', ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
