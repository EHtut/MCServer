// chosen_harness.js — prove the Wall kill-route WITHOUT a server.
//
//     node tools/chosen_harness.js
//
// Ethan rewrote Wall's unlock on 2026-08-16: no items, no timers, no refusal.
// Somebody kills you while you walk no path, and she makes her offer ON YOUR
// RESPAWN. That is two event hooks talking to each other through persistent data,
// and it is about to be tested by two people on a live server - so the wiring gets
// checked here first rather than costing them an evening.
//
// 🚨 SAME CAVEAT AS release_harness.js. This runs the real chosen.js against
// stubbed KubeJS globals, so the state machine is genuinely exercised - but it
// cannot prove that KubeJS delivers `event.player` on respawned, or that
// runCommandSilent reaches paths.js. Those are boot- and play-checks.

'use strict'
const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts', 'chosen.js')

let DAYTIME = 5000
const scheduled = []
const server = {
  overworld: () => ({ dayTime: () => DAYTIME }),
  players: [],
  scheduleInTicks: (t, fn) => scheduled.push(fn),
}
// ⚠️ DRAIN REPEATEDLY. makeOffer() schedules a callback from INSIDE a callback
// that was itself scheduled (respawn -> 5s -> makeOffer -> 60t -> /path wall), so
// a single-level drain silently swallows the actual offer and leaves it to fire
// during the NEXT test. That produced four failures that all looked like code bugs
// and were not. The sweep re-schedules itself forever, hence the round cap.
const runScheduled = (rounds) => {
  for (let i = 0; i < (rounds || 6) && scheduled.length; i++) {
    scheduled.splice(0).forEach((f) => f())
  }
}

const commands = []                      // what makeOffer told paths.js to run

function mkPlayer(name, pathKey, uuid) {
  const data = {}
  const p = {
    username: name, player: true, server, uuid: uuid || name,
    persistentData: {
      getInt: (k) => (typeof data[k] === 'number' ? data[k] : 0),
      putInt: (k, v) => { data[k] = v },
      getString: (k) => (typeof data[k] === 'string' ? data[k] : ''),
      putString: (k, v) => { data[k] = v },
    },
    tell: () => { },
    runCommandSilent: (c) => commands.push(name + ' -> /' + c),
    _data: data,
  }
  data['veldora_path'] = pathKey || ''
  return p
}

// ── stubs ───────────────────────────────────────────────────────────────────
const deathHooks = [], respawnHooks = [], hurtHooks = []
global.EntityEvents = { death: (f) => deathHooks.push(f), beforeHurt: (f) => hurtHooks.push(f) }
global.PlayerEvents = { respawned: (f) => respawnHooks.push(f), loggedIn: () => { } }
// Captured, not discarded: ServerEvents.loaded is what STARTS the sweep, and
// without it the closed-god test below would pass because nothing ran at all.
const loadedHooks = []
global.ServerEvents = { commandRegistry: () => { }, loaded: (f) => loadedHooks.push(f) }
global.Text = { of: (s) => s }

let WALL_HOLDER = ''
let CLOSED = { art: true, forge: true }
global.VELDORA = {
  paths: {
    pathOf: (p) => { try { return p.persistentData.getString('veldora_path') || '' } catch (e) { return '' } },
    holderOf: (srv, k) => (k === 'wall' ? WALL_HOLDER : ''),
    nameOf: (k) => 'The ' + k,
    isClosed: (k) => !!CLOSED[k],
  },
  ritual: { active: () => false },
  pathBlocked: () => ({ blocked: false }),
}

const realInfo = console.info, realWarn = console.warn, realErr = console.error
const hush = () => { console.info = () => { }; console.warn = () => { }; console.error = () => { } }
const speak = () => { console.info = realInfo; console.warn = realWarn; console.error = realErr }

hush()
// eslint-disable-next-line no-eval
;(0, eval)(fs.readFileSync(FILE, 'utf8'))
speak()

const C = global.VELDORA.chosen
if (!C) { console.error('FAIL: chosen.js did not publish VELDORA.chosen'); process.exit(1) }

const kill = (victim, killer) => {
  hush(); deathHooks.forEach((f) => f({ entity: victim, source: { player: killer } })); speak()
}
const respawn = (p) => {
  hush(); respawnHooks.forEach((f) => f({ player: p })); runScheduled(); speak()
}
const hurt = (p) => { hush(); hurtHooks.forEach((f) => f({ entity: p })); speak() }

// ── assertions ──────────────────────────────────────────────────────────────
let pass = 0, fail = 0
function ok(name, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want)
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name) }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
const grp = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m')
const struck = (p) => p._data['veldora_wall_struck'] || 0
const unlocked = (p) => C.unlocked(p, 'wall')

// ═══════════════════════════════════════════════════════════════════════════
grp('THE KILL — who counts')
{
  const me = mkPlayer('Rehykt', '', 'u1')
  const bro = mkPlayer('Lehykt', 'blade', 'u2')
  kill(me, bro)
  ok('killed by a CHAMPION while pathless -> struck', struck(me), 1)
}
{
  const me = mkPlayer('Rehykt', '', 'u1')
  const rando = mkPlayer('Nobody', '', 'u3')
  kill(me, rando)
  ok('killed by a PATHLESS player -> struck (the killer is not checked)', struck(me), 1)
}
{
  const me = mkPlayer('Pathed', 'salvage', 'u1')
  kill(me, mkPlayer('Lehykt', 'blade', 'u2'))
  ok('a player who ALREADY walks a path is never struck', struck(me), 0)
}
{
  const me = mkPlayer('Lonely', '', 'u1')
  kill(me, null)
  ok('dying to a mob is not being struck', struck(me), 0)
  kill(me, me)
  ok('killing yourself does not count', struck(me), 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('THE RESPAWN — she arrives')
{
  commands.length = 0
  const me = mkPlayer('Rehykt', '', 'u1')
  kill(me, mkPlayer('Lehykt', 'blade', 'u2'))
  ok('not unlocked by the death alone', unlocked(me), false)
  respawn(me)
  ok('the RESPAWN unlocks wall', unlocked(me), true)
  ok('and makes the offer', commands, ['Rehykt -> /path wall'])
  ok('the one-offer flag is stamped', me._data['veldora_offered_wall'], 1)

  commands.length = 0
  respawn(me)
  ok('respawning again does NOT re-offer', commands, [])
}

// ═══════════════════════════════════════════════════════════════════════════
grp('THE COMBAT GATE — the bug that would have made this never fire')
{
  commands.length = 0
  const me = mkPlayer('Bleeding', '', 'u9')
  hurt(me)                             // you were damaged - because you died
  DAYTIME += 10
  kill(me, mkPlayer('Lehykt', 'blade', 'u2'))
  respawn(me)
  ok('being hurt a moment before dying does not block her', commands, ['Bleeding -> /path wall'])
}

// ═══════════════════════════════════════════════════════════════════════════
grp('THE GUARDS')
{
  commands.length = 0
  WALL_HOLDER = 'SomebodyElse'
  const me = mkPlayer('TooLate', '', 'u4')
  kill(me, mkPlayer('Lehykt', 'blade', 'u2'))
  respawn(me)
  ok('wall already held: still UNLOCKED for later', unlocked(me), true)
  ok('...but the one offer is NOT spent on a path he cannot take', commands, [])
  ok('...and the offer flag stays clean', me._data['veldora_offered_wall'] || 0, 0)
  WALL_HOLDER = ''
}
{
  commands.length = 0
  const me = mkPlayer('Blocked', '', 'u5')
  kill(me, mkPlayer('Lehykt', 'blade', 'u2'))
  global.VELDORA.pathBlocked = () => ({ blocked: true })
  respawn(me)
  ok('on a fall cooldown: unlocked, but no offer', [unlocked(me), commands], [true, []])
  global.VELDORA.pathBlocked = () => ({ blocked: false })
}
{
  commands.length = 0
  const me = mkPlayer('Quick', '', 'u6')
  kill(me, mkPlayer('Lehykt', 'blade', 'u2'))
  hush()
  respawnHooks.forEach((f) => f({ player: me }))
  me._data['veldora_path'] = 'salvage'      // took a path in the 5s window
  runScheduled()
  speak()
  ok('taking a path during the 5s delay cancels her offer', commands, [])
}

// ═══════════════════════════════════════════════════════════════════════════
grp('CLOSED GODS NO LONGER SPEND THE ONE OFFER')
// Driven through the REAL sweep - ServerEvents.loaded starts it. An earlier version
// of this block drained an empty queue and passed without executing one line of
// pendingOffer(), which is the exact shape of test this project keeps being bitten
// by. The blade case below is the positive control that proves the sweep runs.
{
  commands.length = 0
  const me = mkPlayer('Newbie', '', 'u7')
  me._data['veldora_unlocked_art'] = 1        // lapis, within minutes of spawning
  server.players = [me]
  hush(); loadedHooks.forEach((f) => f({ server })); runScheduled(); speak()
  ok('art is CLOSED, so it never becomes the pending offer', commands, [])
  ok('and the one-offer flag is untouched', me._data['veldora_offered_art'] || 0, 0)
  server.players = []
}
{
  commands.length = 0
  const me = mkPlayer('Fighter', '', 'u8')
  me._data['veldora_unlocked_blade'] = 1      // an OPEN god
  server.players = [me]
  hush(); runScheduled(); speak()
  ok('POSITIVE CONTROL - an open god DOES offer through the same sweep',
    commands, ['Fighter -> /path blade'])
  server.players = []
}

// ═══════════════════════════════════════════════════════════════════════════
grp('THE LISTING')
{
  const me = mkPlayer('Lister', '', 'uA')
  me._data['veldora_unlocked_wall'] = 1
  me._data['veldora_unlocked_salvage'] = 1
  ok('unlockedList reports both', C.unlockedList(me).sort(), ['salvage', 'wall'])
}

// ═══════════════════════════════════════════════════════════════════════════
grp('WIRING — the dead machinery is really gone')
const src = fs.readFileSync(FILE, 'utf8')
const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
const has = (s) => code.indexOf(s) >= 0
ok('driftDays() is gone', has('function driftDays'), false)
ok('hasRefused() is gone', has('function hasRefused'), false)
ok('WALL_DAYS / WALL_LONG are gone', has('WALL_DAYS') || has('WALL_LONG'), false)
ok('nothing reads veldora_refused_ any more', has('veldora_refused_'), false)
ok('pendingOffer filters closed gods', has('if (isClosed(keys[i])) continue'), true)
ok('the respawn hook clears the combat stamp', has('delete lastHurt['), true)

const paths = fs.readFileSync(path.join(__dirname, '..', 'pack', 'kubejs',
  'server_scripts', 'paths.js'), 'utf8')
ok('paths.js publishes isClosed', paths.indexOf('isClosed: function (key)') >= 0, true)

console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed.\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m of ' + (pass + fail)))
process.exit(fail === 0 ? 0 : 1)
