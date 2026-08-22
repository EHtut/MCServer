// tide_harness.js — THE TIDE, docs/50.
//
//     node tools/tide_harness.js
//
// Every failure mode here is SILENT, and two of them are the kind a player
// experiences as the game being broken rather than as a mechanic:
//
//   · a run that starts from stepping into a doorway
//   · a run that survives death, so the next descent opens at wave six
//   · a wave that follows you into daylight - the one thing Ethan ruled out
//   · a wave that lands on a player who logged out mid-arrival
//   · a wave nobody was warned about, which is the effect-from-nowhere the whole
//     design exists to prevent
//
// None of them throw. All of them are asserted.

'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

let SKY = false            // true = open sky, false = enclosed, null = unreadable
let Y = -20
let ALIVE = true
let ONLINE = []
let WAVES = []             // {count, ids}
let SOUNDS = []
let SAID = []
let TIMERS = []
let DEATH = [], LOGOUT = [], LOADED = []
let SPEAKER_HAS = true

const server = {
  scheduleInTicks: (d, fn) => { TIMERS.push([d, fn]) },
  runCommandSilent: (c) => { if (c.indexOf('playsound') >= 0) SOUNDS.push(c) },
  runCommand: () => '',
  overworld: () => ({ dayTime: () => 1000 }),
}
Object.defineProperty(server, 'players', { get: () => ONLINE })

// Fire scheduled callbacks ONCE, in delay order. The sweep re-schedules itself, so
// draining recursively would spin forever - this is one tick of the world.
function drain() {
  const t = TIMERS.slice().sort((a, b) => a[0] - b[0])
  TIMERS = []
  for (const [, fn] of t) { try { fn() } catch (e) { } }
}
// ⚠️ THE SWEEP IS DRIVEN DIRECTLY, NOT THROUGH THE TIMER QUEUE. Wave pulses are
// scheduled at 0/100/200/... and the sweep re-arms at 100, so "fire everything with
// delay 100" cannot tell them apart - it fired leaked pulses as if they were sweeps
// and 15 of them bled from one test into the next (21 arrivals where 6 were
// expected). Holding the sweep separately makes TIMERS contain ONLY pulses, which
// is what lets fresh() clear it safely.
let SWEEP_FN = null
function captureSweep() {
  // ⚠️ TAKE THE LAST delay-100 ENTRY, NOT THE FIRST. sweep() schedules wave pulses
  // (0/100/200/...) DURING its body and re-arms itself as its final act, so the
  // first match is a PULSE and grabbing it loses the sweep entirely - every run
  // after that silently refused to start.
  let idx = -1
  for (let i = 0; i < TIMERS.length; i++) if (TIMERS[i][0] === 100) idx = i
  if (idx >= 0) { SWEEP_FN = TIMERS[idx][1]; TIMERS.splice(idx, 1) }
}
function ticks(n) {
  for (let i = 0; i < n; i++) {
    const fn = SWEEP_FN
    SWEEP_FN = null
    try { fn() } catch (e) { }      // it re-schedules itself...
    captureSweep()                  // ...and we take that back out of the queue
  }
}

global.EntityEvents = { death: (f) => DEATH.push(f), beforeHurt: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { respawned: () => { }, loggedIn: () => { }, loggedOut: (f) => LOGOUT.push(f), tick: () => { } }
global.ServerEvents = { commandRegistry: () => { }, loaded: (f) => LOADED.push(f), tick: () => { } }
global.ItemEvents = { rightClicked: () => { }, entityInteracted: () => { } }
global.BlockEvents = { placed: () => { }, broken: () => { }, rightClicked: () => { } }
global.Text = { of: (s) => s }
global.Item = { of: () => ({}) }

global.VELDORA = {
  paths: { pathOf: () => 'wall' },
  voice: { say: (p, g, tag) => { SAID.push(g + '/' + tag); return true } },
  speaker: {
    active: () => Y < 0,
    say: (p, tag) => { if (!SPEAKER_HAS) return false; SAID.push('speaker/' + tag); return true },
  },
  spawner: { wave: (p, o) => { WAVES.push({ count: o.count, ids: o.ids }) } },
}

const rw = console.warn, ri = console.info, re = console.error
const hush = () => { console.warn = console.info = console.error = () => { } }
const speak = () => { console.warn = rw; console.info = ri; console.error = re }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'tide.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: tide.js threw :: ' + e); process.exit(1) }

const T = global.VELDORA.tide
if (!T) { speak(); console.error('FAIL: VELDORA.tide not published'); process.exit(1) }

function mkP(name) {
  return {
    username: name, uuid: 'u-' + name, player: true, server,
    get y() { return Y },
    isAlive: () => ALIVE,
    blockPosition: () => ({ x: 0, y: Y, z: 0 }),
    get level() { return SKY === null ? null : { canSeeSky: () => SKY } },
    tell: () => { },
    persistentData: { getInt: () => 0, putInt: () => { }, getDouble: () => 0, putDouble: () => { }, getBoolean: () => true, getString: () => '', putString: () => { }, contains: () => true },
  }
}

let pass = 0, fail = 0
function ok(n, got, want) {
  const g = JSON.stringify(got) === JSON.stringify(want)
  if (g) { pass++; console.log('  \x1b[32mok  \x1b[0m' + n) }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + n + '\n         got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
const grp = (t) => { speak(); console.log('\n\x1b[1m' + t + '\x1b[0m'); hush() }

// ⚠️ BOOT EXACTLY ONCE. sweep() runs its body IMMEDIATELY and then re-schedules, so
// every extra boot() stacks another sweep chain and every player gets swept twice per
// tick. My first version called it per test, which both double-counted the enter
// timer AND carried run state between tests - four failures, all of them the harness.
ONLINE = []
for (const fn of LOADED) { try { fn({ server }) } catch (e) { } }
captureSweep()

// ⚠️ A FRESH NAME PER TEST. Run state is keyed by uuid and deliberately never
// cleared by anything except death or logout, so reusing "P" leaks a previous
// test's waves into the next one.
let seq = 0
function fresh() {
  // ⚠️ CLEAR PENDING PULSES TOO. A test that forces waves and never drains leaves
  // them queued, and they land in whichever test drains next.
  TIMERS = []
  WAVES = []; SOUNDS = []; SAID = []; ALIVE = true; SPEAKER_HAS = true
  const p = mkP('P' + (++seq))
  ONLINE = [p]
  return p
}

// ═══════════════════════════════════════════════════════════════════════════
grp('ENTERING IS DELIBERATE — a doorway is not a descent')
{
  const p = fresh(); Y = -20; SKY = false
  ticks(2)                                   // 10s enclosed
  ok('10s under is not yet a run', T.inRun(p), false)
  SKY = true; ticks(1); SKY = false          // ducked back into daylight
  ticks(2)
  ok('...and the counter RESET on seeing sky', T.inRun(p), false)
  ticks(3)                                   // now 15s continuous
  ok('15s continuous under STARTS the run', T.inRun(p), true)
}

grp('🚨 A WAVE NEVER LANDS UNDER OPEN SKY')
{
  const p = fresh(); Y = -20; SKY = false; ticks(3)
  ok('in a run', T.inRun(p), true)
  WAVES = []
  T.force(p)                                 // queue a full wave
  SKY = true                                 // ...and surface before it arrives
  drain()
  ok('every pulse is cancelled once the sky is visible', WAVES.length, 0)
}

grp('...and never on a player who died or left mid-arrival')
{
  const p = fresh(); Y = -20; SKY = false; ticks(3); WAVES = []
  T.force(p); ALIVE = false; drain()
  ok('death cancels the remaining pulses', WAVES.length, 0)
  ALIVE = true
}

grp('DEATH ENDS THE RUN — the next descent starts at wave one')
{
  const p = fresh(); Y = -20; SKY = false; ticks(3)
  T.force(p); T.force(p); T.force(p)
  ok('three waves deep', T.state(p).waves, 3)
  for (const fn of DEATH) fn({ entity: p })
  ok('the run is over', T.inRun(p), false)
  ticks(3)
  ok('...and going back under starts a NEW one', T.inRun(p), true)
  ok('🚨 at wave ZERO, not six', T.state(p).waves, 0)
}

grp('SURFACING ENDS IT, after a beat')
{
  const p = fresh(); Y = -20; SKY = false; ticks(3)
  SKY = true; ticks(1)
  ok('one tick of sky is not enough - a skylight is not an exit', T.inRun(p), true)
  ticks(2)
  ok('...10s of it is', T.inRun(p), false)
}

grp('⭐ THE WAVE IS AN ARRIVAL — 30s of pulses, never a drop')
{
  const p = fresh(); Y = -20; SKY = false; ticks(3); WAVES = []
  T.force(p); drain()
  ok('six separate pulses, not one dump', WAVES.length, 6)
  ok('...each a handful', WAVES.every(w => w.count >= 1 && w.count <= 5), true)
}

grp('ESCALATION — wave five is bigger than wave one, and it caps')
{
  const p = fresh(); Y = -20; SKY = false; ticks(3)
  WAVES = []; T.force(p); drain(); const first = WAVES[0].count
  for (let i = 0; i < 8; i++) { T.force(p); TIMERS = [] }
  WAVES = []; T.force(p); drain(); const later = WAVES[0].count
  ok('it grows', later > first, true)
  ok('🚨 ...and is capped, so a long run cannot become unfightable', later <= 5, true)
}

grp('THE HERALD IS CHOSEN BY DEPTH')
{
  let p = fresh()
  Y = -20; SKY = false; ticks(3)
  SAID = []; T.force(p)
  ok('below y0 the SPEAKER warns you', SAID, ['speaker/warn_wave'])

  p = fresh(); Y = 20; SKY = false; ticks(3)
  SAID = []; T.force(p)
  ok('above y0 your own god does', SAID, ['wall/warn_wave'])
}

grp('🚨 A WAVE IS NEVER UNANNOUNCED, even with no lines at all')
{
  const p = fresh(); Y = -20; SKY = false; ticks(3)
  SPEAKER_HAS = false
  global.VELDORA.voice.say = () => false      // nobody has a line
  SAID = []; SOUNDS = []
  T.force(p); drain()
  ok('not a word was said', SAID.length, 0)
  ok('🔑 but the SOUND still fired - the tell is the contract', SOUNDS.length > 0, true)
  ok('...and the wave still arrived', WAVES.length > 0, true)
  global.VELDORA.voice.say = (p2, g, tag) => { SAID.push(g + '/' + tag); return true }
}

grp('UNREADABLE SKY DOES NOTHING, EVER')
{
  const p = fresh(); Y = -20; SKY = null; ticks(20)
  ok('no run is started on a guess', T.inRun(p), false)
  ok('...and no waves were sent', WAVES.length, 0)
}

grp('THE DEEPER YOU ARE, THE WORSE IT IS')
{
  SKY = false
  const seen = {}
  for (const [y, label] of [[20, 'shallow'], [-20, 'deep'], [-90, 'deeper']]) {
    const p = fresh(); Y = y; ticks(3); WAVES = []; T.force(p); drain()
    seen[label] = WAVES[0].ids[0]
  }
  ok('y20 draws vanilla', seen.shallow.indexOf('minecraft:') === 0, true)
  ok('y-20 draws the horror roster', seen.deep.indexOf('minecraft:') !== 0, true)
  ok('the three bands are not the same roster', new Set(Object.values(seen)).size > 1, true)
}

speak()
console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
