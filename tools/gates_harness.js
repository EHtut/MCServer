// gates_harness.js — prove the WHERE and WHEN gates without a server.
//
//     node tools/gates_harness.js
//
// Ethan, 2026-08-16: "Hordes events for blade should only be underground.
// Attacks from wall should only be at night."
//
// Both rules are invisible when they are wrong. A broken night check does not
// throw - it just means the Spider never attacks, or attacks at noon, and either
// one looks like "the event system is quiet today". The clock arithmetic in
// particular has a trap the pack has already been bitten by twice: dayTime() is
// ABSOLUTE and accumulates forever, so a raw comparison is right on day 0 and
// wrong on every day after.

'use strict'
const fs = require('fs')
const path = require('path')

const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

let DAYTIME = 0
const server = {
  overworld: () => ({ dayTime: () => DAYTIME }),
  players: [],
  scheduleInTicks: () => { },
}

// ── stubs ───────────────────────────────────────────────────────────────────
global.EntityEvents = { death: () => { }, beforeHurt: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { respawned: () => { }, loggedIn: () => { }, loggedOut: () => { } }
global.ServerEvents = { commandRegistry: () => { }, loaded: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = { paths: { pathOf: () => '' } }

const realWarn = console.warn, realInfo = console.info, realErr = console.error
const hush = () => { console.warn = () => { }; console.info = () => { }; console.error = () => { } }
const speak = () => { console.warn = realWarn; console.info = realInfo; console.error = realErr }

hush()
// eslint-disable-next-line no-eval
;(0, eval)(fs.readFileSync(path.join(SS, 'godevents.js'), 'utf8'))
speak()

const E = global.VELDORA.events
if (!E) { console.error('FAIL: godevents.js did not publish VELDORA.events'); process.exit(1) }

// A player whose sky-readability we control, to test both modes.
function mkPlayer(y, sky) {
  return {
    y, username: 'P',
    blockPosition: () => ({ x: 0, y, z: 0 }),
    level: sky === null ? null : { canSeeSky: () => sky },
  }
}

let pass = 0, fail = 0
function ok(name, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want)
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name) }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
const grp = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m')

// ═══════════════════════════════════════════════════════════════════════════
grp('NIGHT — and the absolute-clock trap')
const nightAt = (t) => { DAYTIME = t; return E.isNight(server) }
ok('dawn 0 is day', nightAt(0), false)
ok('noon 6000 is day', nightAt(6000), false)
ok('12000 (dusk, pre-mobs) is still day', nightAt(12000), false)
ok('13000 is night - mobs spawn', nightAt(13000), true)
ok('18000 midnight is night', nightAt(18000), true)
ok('22999 is night', nightAt(22999), true)
ok('23000 sunrise is day again', nightAt(23000), false)

// 🚨 the one that matters. dayTime() accumulates: day 40 midnight is 978000.
ok('day 40 midnight is STILL night (absolute clock, modulo works)', nightAt(40 * 24000 + 18000), true)
ok('day 40 noon is still day', nightAt(40 * 24000 + 6000), false)
ok('a NEGATIVE clock does not produce a negative modulo', nightAt(-6000), true)
{
  const broken = { overworld: () => ({ dayTime: () => NaN }) }
  ok('an unreadable clock returns null, not false', E.isNight(broken), null)
  const thrower = { overworld: () => { throw new Error('nope') } }
  ok('a throwing clock returns null, not false', E.isNight(thrower), null)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('UNDERGROUND — roofed AND below the world')
ok('y20 with no sky = underground', E.isUnderground(server, mkPlayer(20, false)), true)
ok('y20 WITH sky (an open ravine) is NOT underground', E.isUnderground(server, mkPlayer(20, true)), false)
ok('y90 with no sky (a surface base) is NOT underground', E.isUnderground(server, mkPlayer(90, false)), false)
ok('y64 with sky = plainly not underground', E.isUnderground(server, mkPlayer(64, true)), false)
ok('y49 no sky = just under the line', E.isUnderground(server, mkPlayer(49, false)), true)
ok('y50 no sky = exactly on the line, not under it', E.isUnderground(server, mkPlayer(50, false)), false)
ok('an unreadable y returns null, not false', E.isUnderground(server, { y: NaN }), null)

// ═══════════════════════════════════════════════════════════════════════════
grp('GUARD FORMS — unreadable must FAIL OPEN')
// eligible() treats a throwing guard as closed, so a broken clock would otherwise
// mute a god forever with no error anywhere.
{
  const broken = { overworld: () => { throw new Error('nope') } }
  ok('atNight lets it through when the clock is unreadable', E.atNight(broken), true)
  ok('whenDeep lets it through when y is unreadable', E.whenDeep(server, { y: NaN }), true)
  DAYTIME = 6000
  ok('...but atNight still says NO in plain daylight', E.atNight(server), false)
  DAYTIME = 18000
  ok('...and YES at midnight', E.atNight(server), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('allOf — composition, not replacement')
{
  const T = () => true, F = () => false
  const boom = () => { throw new Error('x') }
  ok('all true -> true', E.allOf(T, T, T)(server, {}), true)
  ok('any false -> false', E.allOf(T, F, T)(server, {}), false)
  ok('a THROWING member closes the whole guard', E.allOf(T, boom)(server, {}), false)
  ok('empty -> true', E.allOf()(server, {}), true)

  // swarm's real shape: rage >= 0.7 AND night. Both halves must still bite.
  const moody = (m) => () => m >= 0.7
  DAYTIME = 18000
  ok('swarm: furious at night -> fires', E.allOf(moody(0.9), E.atNight)(server, {}), true)
  ok('swarm: calm at night -> held by its OWN guard', E.allOf(moody(0.3), E.atNight)(server, {}), false)
  DAYTIME = 6000
  ok('swarm: furious by day -> held by the night gate', E.allOf(moody(0.9), E.atNight)(server, {}), false)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('WIRING — the right events, and only the right events')
const blade = fs.readFileSync(path.join(SS, 'blade_events.js'), 'utf8')
const wall = fs.readFileSync(path.join(SS, 'wall_events.js'), 'utf8')

// Pull each registration block so a guard can be attributed to its own id.
function guardsById(src) {
  const out = {}
  const re = /id:\s*'([a-z_]+)'([\s\S]*?)\n\s*\}\)/g
  let m
  while ((m = re.exec(src))) {
    const body = m[2]
    if (!/run:|does:/.test(body)) continue
    out[m[1]] = /guard:\s*(\S+)/.exec(body) ? /guard:\s*([^\n,]+)/.exec(body)[1].trim() : null
  }
  return out
}
const B = guardsById(blade), W = guardsById(wall)

ok('blade/gauntlet is UNDERGROUND', B.gauntlet, 'underground')
ok('blade/hollow is UNDERGROUND', B.hollow, 'underground')
ok('blade/icarus keeps its ABOVE-y100 guard (gating it deep = unsatisfiable)', B.icarus, 'aboveTheLine')
ok('blade/broken_rung is EXEMPT - it is a consequence of dying, not of a place', B.broken_rung, null)
ok('blade/mark is not gated', B.mark, null)
ok('blade/duel (one actor, not a horde) is not gated', B.duel, null)
ok('blade/understudy (one actor) is not gated', B.understudy, null)

ok('wall/offer is NIGHT - saying yes runs sendSpiders', W.offer, 'atNight')
ok('wall/snare is NIGHT', W.snare, 'atNight')
ok('wall/dark is NIGHT', W.dark, 'atNight')
ok('wall/web is NIGHT', W.web, 'atNight')
ok('wall/swarm COMPOSES night with its own mood guard',
  (W.swarm || '').indexOf('andNight(') === 0, true)
ok('wall/boon (a boon, not an attack) is ungated', W.boon, null)
ok('wall/feast is ungated', W.feast, null)
ok('wall/carry is ungated', W.carry, null)
ok('wall/brood is ungated', W.brood, null)

ok('every one of her 5 outward events is gated',
  ['offer', 'snare', 'dark', 'web', 'swarm'].filter((k) => !W[k]).length, 0)
ok('and none of her 4 boons are', ['boon', 'feast', 'carry', 'brood'].filter((k) => W[k]).length, 0)

console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed.\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m of ' + (pass + fail)))
process.exit(fail === 0 ? 0 : 1)
