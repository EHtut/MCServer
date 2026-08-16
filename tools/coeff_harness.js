// coeff_harness.js — prove the coefficient table, and Wall's inversion, without a server.
//
//     node tools/coeff_harness.js
//
// Ethan, 2026-08-16: "maybe lets do it inversely? Wall starts at their strongest but
// as you take damage and die her focus shifts which means more attacks on other
// players and more minion spawns. So as you get weaker she gets stronger and more
// active."
//
// That turned TABLE values into FUNCTIONS, and a function in a numeric table is the
// kind of change that fails quietly in every direction at once:
//
//   · a curve that is never called reads as "[object Function]" and multiplies to NaN
//   · a curve that throws takes down every axis read on the server tick
//   · a curve that dips below 1.0 breaks his standing rule ("we should never have a
//     coefficient go under 1 it should always be an increase")
//   · an unreadable counter must not silently strip a player's power
//
// None of those throw where anyone would see them. So they are asserted here.

'use strict'
const fs = require('fs')
const path = require('path')

const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

// ── stubs ───────────────────────────────────────────────────────────────────
global.EntityEvents = { death: () => { }, beforeHurt: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { respawned: () => { }, loggedIn: () => { }, loggedOut: () => { } }
global.ServerEvents = { commandRegistry: () => { }, loaded: () => { } }
global.Text = { of: (s) => s }

// The Wall counter the curves read. RAGE is what the test drives.
let RAGE = 0
let MOOD_THROWS = false
global.VELDORA = {
  paths: { pathOf: (p) => (p && p.path) || '' },
  wall: {
    mood: () => {
      if (MOOD_THROWS) throw new Error('counter store is down')
      if (RAGE === null) return null
      return Math.max(0, Math.min(1, RAGE / 90))   // matches wall_events RAGE_CALM/FURY
    },
  },
}

const realWarn = console.warn, realInfo = console.info, realErr = console.error
const hush = () => { console.warn = () => { }; console.info = () => { }; console.error = () => { } }
const speak = () => { console.warn = realWarn; console.info = realInfo; console.error = realErr }

hush()
// eslint-disable-next-line no-eval
;(0, eval)(fs.readFileSync(path.join(SS, 'coefficients.js'), 'utf8'))
speak()

const C = global.VELDORA.coeff
if (!C) { console.error('FAIL: coefficients.js did not publish VELDORA.coeff'); process.exit(1) }

const server = { players: [{}], overworld: () => ({ dayTime: () => 0 }) }
// ⚠️ coefficients.js reads persistentData DIRECTLY - it does not go through
// VELDORA.paths. Stubbing the wrong door made every read fall back to neutral, and
// the floor assertion then passed against a table of 1.0s. A green harness proving
// nothing is worse than a red one.
// ⚠️ ...and depthOf reads player.y, NOT blockPosition(). Two different doors in one
// file. Without `y` the whole depth sweep below compared 2.5 against 2.5 and called
// it a pass.
const mk = (p, y) => ({
  username: 'P',
  y: (y === undefined ? 64 : y),
  persistentData: { getString: (k) => (k === 'veldora_path' ? p : ''), contains: () => true },
  blockPosition: () => ({ x: 0, y: (y === undefined ? 64 : y), z: 0 }),
})

let pass = 0, fail = 0
function ok(name, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want)
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name) }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
function okNear(name, got, want, tol) {
  const good = typeof got === 'number' && isFinite(got) && Math.abs(got - want) <= (tol || 0.001)
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name + '  (' + got + ')') }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + got + '  want ~' + want) }
}
const grp = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m')

const AXES = ['spawns', 'power', 'drops', 'phase']
const PATHS = ['blade', 'salvage', 'wall', 'forge', 'art', 'crown']

// ═══════════════════════════════════════════════════════════════════════════
grp('WALL INVERTED — her attention is the resource')
const wall = mk('wall')

RAGE = 0
okNear('rage 0  (all of her on you): power is her CEILING', C.of(server, wall, 'power'), 2.5)
okNear('rage 0: the world around you is QUIET', C.of(server, wall, 'spawns'), 1.0)

RAGE = 45
okNear('rage 45 (half): power has slid halfway down', C.of(server, wall, 'power'), 1.75)
okNear('rage 45: spawns have climbed halfway up', C.of(server, wall, 'spawns'), 1.75)

RAGE = 90
okNear('rage 90 (fury, none of her on you): power at the FLOOR', C.of(server, wall, 'power'), 1.0)
okNear('rage 90: the world is at its LOUDEST', C.of(server, wall, 'spawns'), 2.5)

RAGE = 200
okNear('rage past fury clamps, does not overshoot (power)', C.of(server, wall, 'power'), 1.0)
okNear('rage past fury clamps, does not overshoot (spawns)', C.of(server, wall, 'spawns'), 2.5)

// 🔑 THE WHOLE POINT. The two curves must move in OPPOSITE directions, or this is
// just a difficulty slider with extra steps.
grp('...and they must actually cross')
{
  let prevPow = Infinity, prevSpawn = -Infinity, monoPow = true, monoSpawn = true
  for (let r = 0; r <= 90; r += 5) {
    RAGE = r
    const pw = C.of(server, wall, 'power'), sp = C.of(server, wall, 'spawns')
    if (pw > prevPow + 1e-9) monoPow = false
    if (sp < prevSpawn - 1e-9) monoSpawn = false
    prevPow = pw; prevSpawn = sp
  }
  ok('power falls monotonically across the whole range', monoPow, true)
  ok('spawns rises monotonically across the whole range', monoSpawn, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp("THE FLOOR — Ethan's standing rule: never below 1.0, ever")
{
  let worst = Infinity, where = ''
  for (const r of [null, 0, 1, 17, 45, 89, 90, 500, -5]) {
    RAGE = r
    for (const pth of PATHS) {
      for (const y of [320, 64, 0, -64, -120, -200]) {
        const p = mk(pth, y)
        for (const a of AXES) {
          const v = C.of(server, p, a)
          if (!(typeof v === 'number' && isFinite(v))) { worst = NaN; where = pth + '.' + a + ' @rage' + r + ' y' + y }
          else if (v < worst) { worst = v; where = pth + '.' + a + ' @rage' + r + ' y' + y }
        }
      }
    }
  }
  ok('no path/axis/rage/depth combination EVER dips below 1.0 (worst: ' + where + ')', worst >= 1.0, true)
}
RAGE = 0

// ═══════════════════════════════════════════════════════════════════════════
grp('FAILURE MODES — a broken curve must not break the server')
MOOD_THROWS = true
// 🔑 A COUNTER THAT THROWS AND A COUNTER THAT RETURNS null ARE THE SAME EVENT: the
// store is unreadable. So they must produce the SAME numbers, and that number is her
// ceiling - see the note below. This asserted 1.0 first, which would have meant a
// database hiccup silently halving a player's power while a null read did not. Two
// failure paths for one failure is how you get a bug nobody can reproduce.
okNear('a throwing counter reads exactly like an unreadable one (power)', C.of(server, wall, 'power'), 2.5)
okNear('a throwing counter reads exactly like an unreadable one (spawns)', C.of(server, wall, 'spawns'), 1.0)
ok('...and never throws out of of()', (() => { try { C.of(server, wall, 'spawns'); return 'no throw' } catch (e) { return 'THREW' } })(), 'no throw')
MOOD_THROWS = false

RAGE = null
// 🚨 An unreadable counter must read as her BEST state, not her worst. A storage
// hiccup taking a player's power away is a bug they would experience as the game
// randomly deciding they are weak.
okNear('unreadable mood -> her CEILING, never a silent nerf', C.of(server, wall, 'power'), 2.5)
okNear('unreadable mood -> the quiet world', C.of(server, wall, 'spawns'), 1.0)
RAGE = 0

ok('a pathless player is neutral on every axis',
  AXES.map(a => C.of(server, mk(''), a)), [1, 1, 1, 1])

// ═══════════════════════════════════════════════════════════════════════════
grp('EVERYONE ELSE — static rows are untouched by the change')
ok('blade', AXES.map(a => C.of(server, mk('blade'), a)), [3, 5, 1, 2])
ok('salvage', AXES.map(a => C.of(server, mk('salvage'), a)), [2.5, 3, 2, 1.5])
ok('forge', AXES.map(a => C.of(server, mk('forge'), a)), [1, 1, 5, 1])
ok('art', AXES.map(a => C.of(server, mk('art'), a)), [2, 2, 1, 3])
ok('crown still aliases wall (power tracks her curve)',
  C.of(server, mk('crown'), 'power'), C.of(server, mk('wall'), 'power'))

// ═══════════════════════════════════════════════════════════════════════════
grp('DEPTH — still applies, and stacks ON TOP of the curve')
RAGE = 90                       // her loudest, so the depth bonus is visible
{
  const surface = C.of(server, mk('wall', 64), 'spawns')
  const deep = C.of(server, mk('wall', -120), 'spawns')
  ok('depth raises her spawns below the surface', deep > surface, true)
  ok('depth does NOT touch power (spawns-only, as designed)',
    C.of(server, mk('wall', -120), 'power'), C.of(server, mk('wall', 320), 'power'))
}
RAGE = 0

// ═══════════════════════════════════════════════════════════════════════════
grp('THE READOUT — /path coefficients must not print "[object Function]"')
{
  const ex = C.explain(server, mk('wall'))
  const bases = ex.axes.map(a => a.axis + '=' + a.base).join(' ')
  ok('no [object Function] anywhere in the readout', /object Function/.test(bases), false)
  ok('no NaN in the readout', /NaN/.test(bases), false)
  ok("wall's curved axes report themselves as curves", /power=curve\(/.test(bases) && /spawns=curve\(/.test(bases), true)
  ok("wall's flat axes still report plain numbers", /drops=3/.test(bases) && /phase=1/.test(bases), true)
  const bex = C.explain(server, mk('blade'))
  ok('a static path reports plain numbers throughout',
    bex.axes.map(a => a.base), [3, 5, 1, 2])
  ok('every reported value is a finite number',
    ex.axes.every(a => typeof a.value === 'number' && isFinite(a.value)), true)
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
