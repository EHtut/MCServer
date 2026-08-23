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

// ⭐ READ THE CEILING FROM THE SOURCE. Copying it here is how this file broke.
const MAX_PER_BATCH = Number(
  (fs.readFileSync(path.join(SS, 'tide.js'), 'utf8').match(/var MAX_PER_BATCH = (\d+)/) || [])[1])
if (!MAX_PER_BATCH) { console.error('FAIL: could not read MAX_PER_BATCH from tide.js'); process.exit(1) }


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
  runCommandSilent: (c) => {
    CMDS.push(c)
    if (c.indexOf('playsound') >= 0) SOUNDS.push(c)
    return 1
  },
  runCommand: () => '',
  overworld: () => ({ dayTime: () => 1000 }),
}
Object.defineProperty(server, 'players', { get: () => ONLINE })

// Fire scheduled callbacks ONCE, in delay order. The sweep re-schedules itself, so
// draining recursively would spin forever - this is one tick of the world.
let CMDS = []

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
  // 🔴 THIS STUB USED TO DROP EVERY FIELD IT WAS NOT ALREADY ASSERTING ON, so the
  // first test of the new `nbt` tag failed against CORRECT code - the harness threw
  // away the thing under test. Record the whole opts object; a stub that filters is a
  // stub that decides what can be tested.
  spawner: { wave: (p, o) => { WAVES.push(Object.assign({}, o)) } },
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
    // 🔴 THIS WAS A WRITE-ONLY BLACK HOLE: getInt returned 0 forever, putInt discarded,
    // and getBoolean returned TRUE UNCONDITIONALLY. Three consequences, all silent:
    //   · the tide's persistent countdown always read 0, so a tide was always "due" -
    //     the first-wave test passed for entirely the wrong reason
    //   · every boolean flag in every file read as already-set
    //   · lifetime escalation could never advance, so the ramp tested as flat
    // A stub that cannot remember is a stub that decides what can be tested. Real map.
    persistentData: (() => {
      const m = {}
      return {
        getInt: (k) => (typeof m[k] === 'number' ? m[k] : 0),
        putInt: (k, v) => { m[k] = v },
        getDouble: (k) => (typeof m[k] === 'number' ? m[k] : 0),
        putDouble: (k, v) => { m[k] = v },
        getBoolean: (k) => m[k] === true,
        putBoolean: (k, v) => { m[k] = v },
        getString: (k) => (typeof m[k] === 'string' ? m[k] : ''),
        putString: (k, v) => { m[k] = v },
        contains: (k) => Object.prototype.hasOwnProperty.call(m, k),
      }
    })(),
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
  ok('...each within the configured per-pulse ceiling',
    WAVES.every(w => w.count >= 1 && w.count <= MAX_PER_BATCH), true)
}

grp('ESCALATION — wave five is bigger than wave one, and it caps')
{
  const p = fresh(); Y = -20; SKY = false; ticks(3)
  WAVES = []; T.force(p); drain(); const first = WAVES[0].count
  for (let i = 0; i < 8; i++) { T.force(p); TIMERS = [] }
  WAVES = []; T.force(p); drain(); const later = WAVES[0].count
  ok('it grows', later > first, true)
  // 🔴 THIS ASSERTION USED TO HARDCODE `<= 5` — the value of MAX_PER_BATCH at the time
  // it was written. That is a test restating a constant the SOURCE owns, which is the
  // same defect as a boot banner restating another file's rule, and it broke the
  // moment the tide was rescaled on 2026-08-23. Two fixes, both applied:
  //
  //   1. the NUMBER is read from tide.js rather than copied (see MAX_PER_BATCH above)
  //   2. the PROPERTY is tested directly - run it far past the cap and assert it
  //      PLATEAUS. That survives any future tuning, because "there is a ceiling" is
  //      the thing that actually matters, not what the ceiling happens to be.
  ok('🚨 ...and is capped, so a long run cannot become unfightable', later <= MAX_PER_BATCH, true)
  for (let i = 0; i < 20; i++) { T.force(p); TIMERS = [] }
  WAVES = []; T.force(p); drain(); const late1 = WAVES[0].count
  for (let i = 0; i < 5; i++) { T.force(p); TIMERS = [] }
  WAVES = []; T.force(p); drain(); const late2 = WAVES[0].count
  ok('...and it PLATEAUS — 20 more waves add nothing', [late1, late2], [MAX_PER_BATCH, MAX_PER_BATCH])
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

// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 HARD MODE — the three changes of 2026-08-23')
{
  // ⭐ Each of these tests a behaviour that did not exist this morning. The suite was
  // 27/27 green with all three unwritten, which is the whole reason they are here.

  // 1. MORE UNDEAD, NOT TANKIER (Ethan's ruling). The old wave one was SIX mobs
  //    across thirty seconds; anything in that region is ambient spawning with a
  //    sound cue, not a tide.
  const p = fresh(); Y = -20; SKY = false; ticks(3)
  WAVES = []; T.force(p); drain()
  const total = WAVES.reduce((a, w) => a + w.count, 0)
  ok('wave one is a CROWD, not a trickle (>= 18)', total >= 18, true)
  ok('...and it is tagged, so it can be counted later',
    WAVES.every(w => String(w.nbt || '').indexOf('veldora_tide') >= 0), true)

  // 2. 🔴 ESCAPING TO THE SURFACE ENDS THE RUN — REVERSED 2026-08-24.
  //
  // This block previously asserted the OPPOSITE: that surfacing mid-wave could not end
  // a run, so the scariest sound in the game was not an instruction to leave. Ethan
  // then asked about hard-blocking a player from surfacing, took the pushback that a
  // hard block reads as the game breaking, and ruled: "we stop the tide once the
  // player escapes to the overworld."
  //
  // 🔑 The surface IS the escape, and the cost is the event itself - at a 1-2 hour
  // cadence, leaving early spends the whole tide. That is a real decision; a run you
  // cannot leave is a trap, not a roguelike.
  const q = fresh(); Y = -20; SKY = false; ticks(3)
  ok('in a run', T.inRun(q), true)
  T.force(q)                                  // a wave is now arriving
  Y = 80; SKY = true                          // ...and they climb out through it
  ticks(4)                                    // 20s of sky - twice LEAVE_TICKS
  ok('🚨 surfacing MID-WAVE ends the run - the surface is the escape', T.inRun(q), false)

  // 3. And the arrivals stop with it. The pulse guards do this on their own: each
  // checks st2.active and refuses when enclosed(p) === false, so no wave can land
  // under open sky and none had to be cancelled by hand.
  WAVES = []
  drain()
  ok('...and no queued pulse lands above ground', WAVES.length, 0)

  // 4. 🔴 THE LOOT REFRESH IS NOT THIS FILE'S JOB - reversed 2026-08-24.
  //
  // These two assertions passed for one day against code that could never have
  // worked: `/lootr clear <player>` does not exist, and probing the live server
  // showed Lootr has NO per-player clear in any spelling. The refresh belongs in
  // Lootr's own [refresh] config, scoped by loot table so the depths recycle and the
  // surface does not.
  //
  // ⭐ INVERTED RATHER THAN DELETED. A guard is worth more than a gap here: if
  // somebody re-adds a per-wave loot command, this fails and points at the config.
  const r = fresh(); Y = -20; SKY = false; ticks(3)
  CMDS = []; T.force(r); drain()
  ok('the tide issues NO loot command - that lives in Lootr config now',
    CMDS.filter(c => c.indexOf('lootr') >= 0).length, 0)
}


// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 THE PERSISTENT CLOCK — what the force() tests cannot see')
{
  // 🚨 EVERY OTHER WAVE TEST USES T.force(), WHICH BYPASSES THE CLOCK ENTIRELY. That is
  // how the suite sat green through two separate scheduling bugs:
  //   · GRACE was a floor used as an offset, so the first wave needed 6-11 minutes of
  //     unbroken enclosure and Ethan reported "the tide never tided"
  //   · the countdown lived in the run and was wiped on surfacing, which at the new
  //     1-2 hour cadence would have meant nobody ever saw a tide again
  // These run the REAL clock.
  // 🔴 THIS BLOCK USED TO FLAKE, AND THE FLAKE WAS THE TEST, NOT THE SOURCE. It
  // read `veldora_tide_due` several sweeps AFTER the value was written - and every
  // sweep decrements it by 100. A roll near the bottom of its range had already been
  // decremented below that range by the time it was asserted, so the suite failed
  // roughly two runs in five while the code under test was entirely correct.
  //
  // 🔑 SO THE CLOCK IS OBSERVED AT THE MOMENT IT IS SET. One sweep at a time, reading
  // the value on the exact sweep the event fires. A countdown cannot be asserted from
  // a distance, because the distance is subtracted from it.
  //
  // ⚠️ AND A FLAKY TEST IS WORSE THAN A MISSING ONE - it trains you to re-run until
  // green, which is how a real failure gets waved through. Guarded loops rather than
  // fixed tick counts, so the assertion does not depend on which window was rolled.
  const p = fresh(); Y = -20; SKY = false

  // ⚠️ STILL THREE SWEEPS - the run needs them. Seeding happens on the FIRST sweep
  // but enclosure is only confirmed by the third, so a loop that stopped at the seed
  // left the run un-started and broke the very next assertion. Capture on the way past
  // instead of stopping early: the value is taken on the sweep it is written, and the
  // clock still advances to where the rest of the block expects it.
  let seeded = -1
  for (let i = 0; i < 3; i++) {
    ticks(1)
    if (seeded < 0 && p.persistentData.getBoolean('veldora_tide_seed')) {
      seeded = p.persistentData.getInt('veldora_tide_due')
    }
  }
  ok('the run started', T.inRun(p), true)
  ok('a first-time player was SEEDED, not fired at instantly', seeded >= 0, true)
  ok('...with a window inside the opening range (2-8 min)',
    seeded >= 2400 && seeded <= 9600, true)

  WAVES = []
  ticks(5)                                     // 25s - inside GRACE and inside the window
  ok('🚨 nothing lands while the countdown is still running', WAVES.length, 0)

  // 🚨 STEP UNTIL IT LANDS, and read the NEXT countdown on that same sweep. The
  // guard is 200 sweeps against a worst-case first window of 96, so a genuine failure
  // to fire still fails rather than hanging.
  let next = -1, guard = 0
  while (next < 0 && guard++ < 200) {
    ticks(1); drain()
    if (WAVES.length > 0) next = p.persistentData.getInt('veldora_tide_due')
  }
  ok('🚨 once the countdown elapses, the tide LANDS', WAVES.length > 0, true)

  // ⭐ AND THE NEXT ONE IS AN HOUR OUT, not five minutes. This is the whole ruling.
  ok('...and the next is 1-2 hours of play away', next >= 72000 && next <= 144000, true)
}

grp('⭐ THE CLOCK RUNS WHEREVER YOU ARE')
{
  // "it can happen at any time" — the countdown must not pause because you went up
  // for supplies, and it must not fire into the sky either. It waits.
  const p = fresh(); Y = 80; SKY = true       // on the surface, never enclosed
  ticks(3)
  ok('no run while under open sky', T.inRun(p), false)
  const a = p.persistentData.getInt('veldora_tide_due')
  ticks(20)
  const b = p.persistentData.getInt('veldora_tide_due')
  ok('🚨 the countdown ticks down ON THE SURFACE too', b < a, true)

  WAVES = []
  ticks(120)                                   // let it come fully due up here
  ok('...but a due tide NEVER lands under open sky', WAVES.length, 0)
  ok('...and it is still waiting, at zero', p.persistentData.getInt('veldora_tide_due'), 0)

  // Now go under: the tide that has been waiting should arrive.
  Y = -20; SKY = false
  ticks(3 + Math.ceil(1200 / 100) + 2); drain()   // enter, clear GRACE, land
  ok('🚨 going under while DUE brings it immediately', WAVES.length > 0, true)
}

console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
