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

// 🔴 THIS HARNESS USED TO LOAD tide.js ALONE, AND THAT MADE IT LIE.
// When composition moved into waves.js, `composeFor` started asking for
// `VELDORA.waves` - which did not exist here - and correctly took its fallback path:
// a plain bulk horde, no ranged, no boss. Five assertions went red against CORRECT
// code, and had the fallback been silent instead of loud they would have gone GREEN
// against a game where every wave was the same horde.
//
// ⚠️ So load the real dependencies, in dependency order, and prove each one published.
// A missing file here must fail as a missing file, not as a composition result.
hush()
for (const f of ['difficulty.js', 'waves.js', 'tide.js']) {
  try { (0, eval)(fs.readFileSync(path.join(SS, f), 'utf8')) }
  catch (e) { speak(); console.error('FAIL: ' + f + ' threw :: ' + e); process.exit(1) }
}

const T = global.VELDORA.tide
if (!T) { speak(); console.error('FAIL: VELDORA.tide not published'); process.exit(1) }
const W = global.VELDORA.waves
if (!W) { speak(); console.error('FAIL: VELDORA.waves not published'); process.exit(1) }
if (!global.VELDORA.difficulty) {
  speak(); console.error('FAIL: VELDORA.difficulty not published'); process.exit(1)
}

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

grp('🔴 THE TIDE IS HERS AT EVERY DEPTH — reversed 2026-08-29')
{
  // ⚠️ THIS GROUP USED TO ASSERT THE OPPOSITE: that y20, y-20 and y-90 drew three
  // DIFFERENT rosters. Ethan ruled the thesis instead - "Alice is the goddess of death.
  // She has a focus on skeletons, not zombies" - so composition comes from the MODIFIER
  // now and depth survives only in tier and count.
  //
  // ⭐ The assertion becomes its own inverse rather than being deleted: the tide must
  // read as ONE author's at every depth.
  // ⚠️ VARIATION IS SUPPRESSED HERE. The first version of this test was FLAKY: a
  // varied wave is a DESIGNED outcome, so three samples occasionally drew a god's
  // roster and the "same author" check failed at random. A test that fails sometimes
  // teaches you to re-run it, which is worse than not having it.
  SKY = false
  const seen = {}
  const realRandom = Math.random
  Math.random = () => 0.99                    // above both VARY_ chances
  for (const [y, label] of [[20, 'shallow'], [-20, 'deep'], [-90, 'deeper']]) {
    const p = fresh(); Y = y; ticks(3); WAVES = []; T.force(p); drain()
    seen[label] = WAVES[0].ids[0]
  }
  Math.random = realRandom
  ok('🚨 every depth draws the same author', new Set(Object.values(seen)).size, 1)
  // 🔴 WAS `/skeleton/i.test(seen.deeper)`, and it failed against CORRECT code.
  // Math.random is pinned to 0.99 four lines up (to suppress the god roll), and 0.99
  // also selects the ALTERNATE variant - her GHOSTS. A wraith is not spelled
  // "skeleton". ⭐ Both are hers: Normal is the skeleton faction, Alternate is the
  // ghosts, and only a GOD variant is somebody else's. So assert what the design
  // actually claims - the author is HER - instead of matching one faction's name.
  const HERS = new Set([].concat(
    W.table.general.normal.fodder, W.table.general.alternate.fodder,
    W.table.horde.normal.fodder, W.table.horde.alternate.fodder,
    W.table.ranged.normal.fodder, W.table.ranged.alternate.fodder))
  ok('⭐ ...and that author is HERS - skeleton or ghost, never a god\'s',
    HERS.has(seen.deeper), true)
  // ⚠️ NEGATIVE CONTROL. `HERS` is built from waves.js, so an empty or broken table
  // would make the assertion above vacuous rather than red.
  ok('   (control: a god\'s mob is NOT in her factions)',
    HERS.has(W.gods.wall.ids[0]), false)
  ok('🚨 no zombie is the bulk of a tide any more',
    Object.values(seen).some(id => /zombie|ghoul|husk|drowned/i.test(id)), false)
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

// ═══════════════════════════════════════════════════════════════════════════
// D3 - STEPPED TIERS. Trust decides which waves you can get and how big they are.
// None of this is checkable in play: counting a 40% ranged mix by eye across a
// 30-second wave is not something a person can do.
let TRUST = 0
global.VELDORA.trust = () => TRUST
const tp = { username: 'Tiered', uuid: 'u-tier', server: {} }

grp('D3 - THE TIER LADDER')
{
  const at = (t) => { TRUST = t; return T._tierFor({}, tp) }
  ok('trust 0 is tier 0', at(0).at, 0)
  ok('trust 1 is still tier 0', at(1).at, 0)
  ok('trust 2 steps up', at(2).at, 2)
  ok('trust 3 steps up', at(3).at, 3)
  ok('trust 4 steps up', at(4).at, 4)
  ok('trust 5 is the top', at(5).at, 5)
  ok('trust above the table clamps to the top', at(99).at, 5)

  // Ethan's standing rule: a coefficient is always an increase, never a reduction.
  ok('EVERY tier multiplier is >= 1', T.tiers.every(x => x.mult >= 1), true)
  ok('...and they only ever climb',
    T.tiers.every((x, i) => i === 0 || x.mult >= T.tiers[i - 1].mult), true)
}

grp('D3 - WHAT EACH TIER MAY SEND')
{
  const modsAt = (t) => { TRUST = t; return T._tierFor({}, tp).mods }
  ok('tier 0 sends ONLY a pure horde', modsAt(0), ['horde'])
  // 🔴 `specialist` IS A RETIRED NAME, 2026-08-30. Ethan's four are
  // general/horde/ranged/miniboss. Renamed here rather than deleted: the RULE - that
  // the shooting wave is not available to a low-trust player - is unchanged, and a
  // deleted assertion is an untested rule.
  ok('ranged waves do not appear before trust 3', modsAt(2).indexOf('ranged'), -1)
  ok('...and do at 3', modsAt(3).indexOf('ranged') >= 0, true)
  // ⚠️ The retired name must not come back through a tier table nobody re-read.
  ok('⛔ no tier still offers the retired `specialist`',
    T.tiers.every(t => t.mods.indexOf('specialist') === -1), true)
  ok('minibosses do not appear before trust 4', modsAt(3).indexOf('miniboss'), -1)
  ok('...and do at 4', modsAt(4).indexOf('miniboss') >= 0, true)
}

grp('D3 - COMPOSITION')
{
  TRUST = 5
  // ⚠️ y -20, NOT -60. rosterFor() returns DEEP above -40 and DEEPER below it, and my
  // first attempt used -60 - which lands in DEEPER, where there are no ranged entries
  // at all, so a "specialist wave" was correctly 0% ranged and the test was wrong.
  // ⚠️ The old note here said "y -20, NOT -60, because DEEPER has no ranged entries".
  // That is history: depth no longer picks the roster at all. The value is kept only
  // because _composeFor still takes a y.
  const deep = -20

  // 🚨 VARIATION MUST BE SUPPRESSED TO MEASURE COMPOSITION. A varied wave swaps in
  // a god's roster, which has no archers - so the ranged ratio legitimately collapses
  // and these assertions failed about one run in five. FLAKY IS WORSE THAN ABSENT: it
  // teaches you to re-run instead of to look.
  //
  // ⚠️ AND THE PINNED VALUE NOW PICKS THE VARIANT TOO. `pick()` rolls twice off the
  // same function: once against the god chance (0.08 here, since the path stub answers
  // "wall"), then once against 0.5 for normal-vs-alternate. So 0.25 is NORMAL - her
  // skeletons - and 0.99 is ALTERNATE - her ghosts. Both must be measured: the old
  // single-value version only ever tested one half of the table and would not have
  // noticed the other half being empty.
  const ROLL = { normal: 0.25, alternate: 0.99 }
  const frac = (mod, which) => {
    const realRandom = Math.random
    Math.random = () => ROLL[which || 'alternate']
    try {
      const c = T._composeFor({}, tp, deep, mod)
      const r = c.ids.filter(id => T.ranged[id]).length
      return { r: r / c.ids.length, boss: c.boss, n: c.ids.length, v: c.variant }
    } finally { Math.random = realRandom }
  }
  ok('the roll really does select the variant', frac('general', 'normal').v, 'normal')
  ok('   ...and the other one', frac('general', 'alternate').v, 'alternate')

  for (const which of ['normal', 'alternate']) {
    // ⭐ EXPECTED RATIOS ARE READ FROM waves.js, NOT COPIED. Ethan's numbers live in
    // one place; a literal here would be a second source of truth, and the one nobody
    // updated would be the one this harness certified.
    const want = (mod) => W.table[mod][which].ranged
    ok(which + ': a pure horde has NO ranged at all', frac('horde', which).r, 0)
    ok('   ...and waves.js agrees that is deliberate', want('horde'), 0)

    const rg = frac('ranged', which)
    ok(which + ': a RANGED wave matches its spec (' + want('ranged') + ')',
      Math.abs(rg.r - want('ranged')) < 0.06, true)
    const gen = frac('general', which)
    ok(which + ': a general wave is lighter than a ranged one', gen.r < rg.r, true)
    ok('   ...but not zero', gen.r > 0, true)

    ok(which + ': only the miniboss modifier brings a boss', frac('horde', which).boss, null)
    ok('   ...and miniboss does', typeof frac('miniboss', which).boss, 'string')
  }

  // 🔴 THE RULING THAT CAME OUT OF PLAY, ASSERTED. Ethan: *"i did a test on miniboss
  // waves and they genuinly should not have specialists, at the lower tiers."*
  // MINIBOSS_LIGHT is [0,0,1,2] by difficulty index, and 0 must mean ZERO - not "few".
  {
    const realRandom = Math.random
    Math.random = () => 0.99
    try {
      for (let d = 0; d < 4; d++) {
        const spec = W.pick('miniboss', d, 0)
        ok('miniboss light specialists at difficulty ' + d,
          spec.light.length, W.minibossLight[d])
      }
    } finally { Math.random = realRandom }
    ok('⭐ ...and the two lowest tiers get NONE',
      W.minibossLight[0] === 0 && W.minibossLight[1] === 0, true)
  }
}

grp('D3 - THE FALLBACK, AND WHO IS NOT IN THE ROSTER')
{
  // The SHALLOW roster at y>=0 - if it had no ranged entries the wave must still be a
  // wave. Spawning nothing reads exactly like the tide being broken.
  TRUST = 5
  for (const y of [10, -20, -60, -200]) {
    const c = T._composeFor({}, tp, y, 'ranged')
    ok('a ranged wave at y' + y + ' is never empty', c.ids.length > 0, true)
  }
  // ⚠️ AND AN UNKNOWN MODIFIER MUST STILL BE A WAVE. `waves.pick` returns null for a
  // type it does not know, and composeFor's fallback is the only thing standing
  // between a typo'd modifier and a tide that spawns nothing - which reads to a player
  // exactly like the tide being broken.
  {
    const c = T._composeFor({}, tp, -20, 'specialist')   // the retired name, on purpose
    ok('⛔ the RETIRED modifier name still produces a wave, not silence',
      c.ids.length > 0, true)
  }

  // 🔴 A REAL GAP, ENCODED SO IT IS VISIBLE AND WILL FAIL LOUDLY WHEN FIXED.
  // The DEEPER roster (below y-40) contains NO entry in RANGED, so a specialist wave
  // down there silently degrades into an ordinary horde - and the deep is exactly where
  // the tide actually happens.
  //
  // ⚠️ Not guessed at: `skeleton_thrasher` and `banshee` are plausible archers but
  // nothing has probed how they FIGHT, and the registry can only confirm that an id
  // exists. Mislabelling melee as ranged makes a wave less special; the reverse makes
  // it a wall of arrows. This assertion documents the current state rather than
  // pretending it is fine, and it turns red the moment somebody adds one.
  {
    // 🔴 THIS ASSERTION USED TO ENCODE THE GAP AS `=== 0`. Ethan asked the obvious
    // question - "Why are ranged enemies not spawning?" - and the answer was that at
    // tide depth there were none: rosterFor returns DEEPER below y-40, DEEPER held no
    // archer, and the composer correctly fell back to melee. The mechanism was right
    // and the roster was empty. Now it asserts the FIX instead.
    // ⚠️ WAS "DEEPER now HAS archers", then "the SPECIALIST pool must not be
    // archerless". Both structures are gone - `poolFor` was deleted with the rename -
    // but THE DEFECT IS NOT: a ranged wave whose pool contains no archer degrades
    // silently into a horde, which is exactly what Ethan noticed in play. Third
    // structure, same rule, asserted against the pool waves.js actually publishes.
    ok('🚨 the RANGED pool is not empty - or every ranged wave degrades to a horde',
      W.rangedPool.length >= 1, true)
    ok('🚨 ...and every one of them is actually classed ranged by tide.js',
      W.rangedPool.every(id => !!T.ranged[id]), true)
    // 🚨 A pure horde must contain no archer, measured on the COMPOSED wave rather
    // than on a pool - the composer is what adds archers, so the pool is not where
    // this can go wrong any more.
    {
      const realRandom = Math.random
      let worst = 0
      try {
        for (const roll of [0.25, 0.99]) {
          Math.random = () => roll
          const c = T._composeFor({}, tp, -20, 'horde')
          worst = Math.max(worst, c.ids.filter(id => T.ranged[id]).length)
        }
      } finally { Math.random = realRandom }
      ok('🚨 a PURE HORDE composes with none, or it is not a pure horde', worst, 0)
    }
    // 🚨 The bulk must be MELEE. It was listed ranged, which would have inverted
    // every general and ranged wave - the mob meant to BE the horde becoming the
    // archers, and the archers the filler.
    ok('🚨 the BULK is melee', !!T.ranged['born_in_chaos_v1:decrepit_skeleton'], false)

    // ⚠️ Ethan ruled banshee and skeleton_thrasher are MELEE despite the names. They
    // belong in the roster and must stay OUT of the ranged pool.
    ok('banshee is not treated as ranged', !!T.ranged['grim_and_bleak:banshee'], false)
    ok('skeleton_thrasher is not either - a name is not an attack type',
      !!T.ranged['born_in_chaos_v1:skeleton_thrasher'], false)

    // And the thing that actually failed in play: a ranged wave IN THE DEEP.
    // ⚠️ Both variants, both against waves.js's own number.
    {
      const realRandom = Math.random
      try {
        for (const which of ['normal', 'alternate']) {
          Math.random = () => (which === 'normal' ? 0.25 : 0.99)
          const deepR = T._composeFor({}, tp, -200, 'ranged')
          const dr = deepR.ids.filter(id => T.ranged[id]).length / deepR.ids.length
          ok('🚨 a ' + which + ' ranged wave at y-200 is genuinely ranged',
            Math.abs(dr - W.table.ranged[which].ranged) < 0.06, true)
        }
      } finally { Math.random = realRandom }
    }

    // 🔴 THE ROOT CAUSE ETHAN'S QUESTION ACTUALLY HAD, ASSERTED.
    // Measured over rcon (docs/73): `minecraft:skeleton` arrives holding a bow only
    // ~30% of the time - 6 of 20 - because `config/epicknights/mobs_equipment.json5`
    // offers it ~13 items with ONE bow in them, and stray/bogged came up 0 for 12
    // because they are not in that config at all and /summon does not run the vanilla
    // equip step. A "ranged wave" of unarmed archers is a horde with extra steps.
    ok('🚨 a ranged wave FORCES a bow rather than hoping for one',
      T._composeFor({}, tp, -20, 'ranged').wantsRangedNbt, true)
    ok('   ...and a horde does not', T._composeFor({}, tp, -20, 'horde').wantsRangedNbt, false)
    ok('   ...and the NBT it forces is actually a bow',
      String(W.rangedNbt).indexOf('minecraft:bow') !== -1, true)
  }

  // 🔴 REVERSED BY ITS AUTHOR, 2026-08-29. This asserted the opposite - "Blade's
  // stalker avatar must never turn up in a generic tide wave", from a ruling that it
  // "stays his". Ethan then listed it himself as one of the tide's two minibosses.
  //
  // ⭐ It is a LORE CHANGE rather than a roster tweak: the goddess of death sends a
  // FALLEN version of the Warrior at his own champions. The assertion is inverted so
  // the reversal is deliberate and visible, not a quietly deleted line.
  ok('⭐ fallen_chaos_knight IS a tide miniboss now',
    T.bosses.indexOf('born_in_chaos_v1:fallen_chaos_knight') !== -1, true)
  ok('...and she has exactly two', T.bosses.length, 2)
  ok('🚨 both of hers are bone',
    T.bosses.every(x => /bonescaller|chaos_knight/.test(x)), true)
  // The Taker is a CLUE about Art, so it is not in the ordinary rotation.
  ok('The Taker is not in the ordinary boss list', T.bosses.indexOf(T.taker), -1)
  ok('...and it is the lifestealer', T.taker, 'born_in_chaos_v1:lifestealer')
}

grp('D3/D4 - THE PULSE GUARD: bench bypasses, and each mode checks its own')
{
  // Measured in play 2026-08-29: six /tide_wave calls logged perfect waves and placed
  // NOTHING, because the per-pulse enclosure check fired while Ethan stood at y104
  // under open sky. sendWave was never the problem - the PULSE refused.
  const src = fs.readFileSync(path.join(SS, 'tide.js'), 'utf8')

  ok('a forced modifier marks the call as a bench',
    src.indexOf('var bench = !!forcedMod') !== -1, true)

  // Isolate the pulse's guard block and reason about THAT, rather than measuring how
  // many characters apart two strings happen to sit - the first version of this test
  // did the latter and broke on a comment being added.
  const bi = src.indexOf('if (!bench) {')
  ok('the pulse has a !bench branch at all', bi !== -1, true)
  const block = src.slice(bi, src.indexOf('}', src.indexOf('else if (enclosed(p) === false) return', bi)))

  ok('the enclosure check lives INSIDE that branch',
    block.indexOf('enclosed(p) === false) return') !== -1, true)

  // D4: a night run must not be judged by the deep rule, or every surface wave would
  // return here without spawning - the exact bug the bench flag was added to fix.
  ok('a night run re-checks DARKNESS, not enclosure',
    block.indexOf("st2.mode === 'night'") !== -1 && block.indexOf('isNightNow(srv)') !== -1, true)

  // isAlive is not part of the bypass - a dead player never receives a pulse.
  const ai = src.indexOf('if (!p.isAlive || !p.isAlive()) return')
  ok('isAlive is checked BEFORE the bench branch, so it always applies',
    ai !== -1 && ai < bi, true)
}

grp('D4 - THE TWO MODES ARE MIRROR IMAGES')
{
  const src = fs.readFileSync(path.join(SS, 'tide.js'), 'utf8')
  ok('a night run can begin on the surface', src.indexOf("st.mode = 'night'") !== -1, true)
  ok('a deep run is labelled too', src.indexOf("st.mode = 'deep'") !== -1, true)

  // enc === false EXPLICITLY. enclosed() returns null when the sky is unreadable, and
  // null is falsy - `!enc` would start a surface run inside a cave on any glitch.
  ok('the night door tests enc === false, never !enc',
    src.indexOf('enc === false && due <= 0 && isNightNow(server)') !== -1, true)

  ok('dawn ends a night run', src.indexOf('dawn. The night tide ends after') !== -1, true)
  ok('surfacing still ends a DEEP run - the original ruling survives',
    src.indexOf('surfaced - tide ends after') !== -1, true)

  // The clock is shared, so this does not double the tide in the game.
  ok('a night tide still requires the persistent clock to be due',
    src.indexOf('due <= 0 && isNightNow(server)') !== -1, true)
}

grp('D3 - A PATHLESS PLAYER IS TIER 0')
{
  const noTrust = global.VELDORA.trust
  global.VELDORA.trust = () => { throw new Error('no path') }
  ok('an unreadable trust reads as 0, not as a crash', T._trustOf({}, tp), 0)
  ok('...so they get tier 0', T._tierFor({}, tp).at, 0)
  global.VELDORA.trust = noTrust
}

grp('⭐ THE VARIATION — rare, and rarer if you have a god')
{
  const tp = { username: 'V', uuid: 'v1' }
  const realPathOf = VELDORA.paths.pathOf
  const realRandom = Math.random

  // 🔴 `_variedRoster` BECAME `_godChanceFor` ON 2026-08-30. waves.js chooses WHICH
  // god reaches in; tide.js keeps only the RATE, because the pathed/pathless split is
  // this file's design and waves.js cannot see a player's path.
  //
  // ⭐ AND THE RATE IS NOW TESTED DIRECTLY RATHER THAN SAMPLED. The old version rolled
  // 8000 times and compared frequencies - which is slow, and which passes or fails on
  // the RNG. Reading the number is exact.
  function rateFor(p) { VELDORA.paths.pathOf = () => p; return T._godChanceFor(tp) }

  ok('⭐ a pathed player rarely sees one', rateFor('wall'), T.varyChance.pathed)
  ok('🚨 a GODLESS player sees them far more often - his weighting',
    rateFor('') > rateFor('wall') * 2, true)
  ok('...and it is still rare even for them', rateFor('') < 0.35, true)

  // 🚨 An unreadable path must take the RARER branch. A read failure that made every
  // tide somebody else's would erase the thesis by accident.
  ok('🚨 an unreadable path is treated as PATHED, not godless',
    rateFor(undefined), T.varyChance.pathed)
  ok('   ...and so is a thrown one', (() => {
    VELDORA.paths.pathOf = () => { throw new Error('boom') }
    return T._godChanceFor(tp)
  })(), T.varyChance.pathed)

  // 🔴 THE END-TO-END RATE, WHICH IS WHAT ACTUALLY REGRESSED. The first pass of the
  // rewiring passed waves.js a FLAT 0.15 and this whole distinction stopped reaching
  // the game - `_godChanceFor` would still have returned the right numbers while
  // nothing consumed them. So sample the COMPOSED wave, not the helper.
  //
  // ⚠️ Difficulty 3 (Damnation), because at Uprising no god is available at all and
  // both rates would correctly measure zero - a green result meaning nothing.
  const realDiff = VELDORA.difficulty.index
  VELDORA.difficulty.index = () => 3
  const seenRate = (p) => {
    VELDORA.paths.pathOf = () => p
    let hits = 0
    for (let i = 0; i < 3000; i++) if (T._composeFor({}, tp, -20, 'general').varied) hits++
    return hits / 3000
  }
  const ePathed = seenRate('wall'), ePathless = seenRate('')
  ok('🚨 END TO END: a godless player really is reached for more often',
    ePathless > ePathed * 2, true)
  ok('   ...and the pathed rate matches the constant, not a flat 0.15',
    Math.abs(ePathed - T.varyChance.pathed) < 0.03, true)
  VELDORA.difficulty.index = realDiff

  Math.random = realRandom
  VELDORA.paths.pathOf = realPathOf
}

grp('🚨 A VARIED WAVE IS ONE GOD, AND THE BOSS STAYS HERS')
{
  const tp = { username: 'V', uuid: 'v2' }
  const realPathOf = VELDORA.paths.pathOf
  const realDiff = VELDORA.difficulty.index
  VELDORA.paths.pathOf = () => ''             // godless: the common case
  VELDORA.difficulty.index = () => 3          // Damnation: all three unlocked

  let sawGod = {}
  let mixed = 0
  for (let i = 0; i < 1200; i++) {
    const c = T._composeFor({}, tp, -20, 'general')
    if (!c.varied) continue
    sawGod[c.varied] = true
    // Every id must belong to that ONE god - a wave that mixes two gods reads as a bug.
    if (!c.ids.every(id => W.gods[c.varied].ids.indexOf(id) !== -1)) mixed++
  }
  ok('🚨 a varied wave never mixes two gods', mixed, 0)

  // 🔴 REVERSED, 2026-08-30, AND THIS IS THE SECOND TIME THIS ASSERTION HAS FLIPPED.
  // It read `all five gods can reach in`. Ethan's ruling for the wave table was
  // *"No special god waves for forge or salvage"* - she sends nothing at anyone and
  // Salvage deals rather than attacks - so THREE reach in, and the other two having no
  // wave is the design rather than a missing roster.
  ok('⭐ exactly THREE gods send waves - forge and salvage send none, ruled',
    Object.keys(sawGod).sort(), ['art', 'blade', 'wall'])

  // ⭐ AND THEY UNLOCK BY DIFFICULTY, CUMULATIVELY. At Uprising nobody reaches in at
  // all, which is the assertion that makes the one above mean something: without it,
  // "three gods" could be true while the gate that admits them never opened.
  for (const [d, want] of [[0, []], [1, ['blade']], [2, ['blade', 'wall']],
                           [3, ['art', 'blade', 'wall']]]) {
    ok('difficulty ' + d + ' admits ' + (want.length ? want.join('+') : 'NOBODY'),
      W.godsAt(d).sort(), want)
  }
  {
    VELDORA.difficulty.index = () => 0
    let any = 0
    for (let i = 0; i < 800; i++) if (T._composeFor({}, tp, -20, 'general').varied) any++
    ok('🚨 at UPRISING no god reaches into her water, ever', any, 0)
    VELDORA.difficulty.index = () => 3
  }

  // 🔴🔴 A RECORDED RULING WAS REVERSED HERE AND IT IS FLAGGED, NOT BURIED.
  //
  // This used to assert "the boss is chosen from BOSSES, never from the varied pool",
  // on the note *"the variation is who CAME, not who sent them"*. `waves.js` gives a
  // GOD miniboss wave the GOD's own boss - Mother Spider, Dark Vortex, the Fallen
  // Chaos Knight - which is the opposite.
  //
  // ⚠️ THAT WAS MY DESIGN NOTE, NOT A QUOTED RULING FROM ETHAN, and the new behaviour
  // is the deliberate one: a wave that Wall reached into, led by one of HER minibosses,
  // reads as neither god's. It is asserted rather than assumed so the reversal is
  // visible, and it is raised with him rather than settled here. DEFECTS.md D-108.
  {
    // ⚠️ EVERY observation, not the last one per god. `bosses[g] = ...` overwrote,
    // so a single stray value could be masked by the next iteration - and one WAS:
    // the Taker substitutes for any boss 6% of the time and this read as a failure
    // against correct code. The Taker is a TELL and is allowed everywhere; what must
    // never appear is a THIRD id.
    let bosses = {}, strays = []
    for (let i = 0; i < 1200; i++) {
      const c = T._composeFor({}, tp, -20, 'miniboss')
      if (!c.varied || !c.boss) continue
      const b = String(c.boss)
      bosses[c.varied] = true
      if (b !== W.gods[c.varied].boss && b !== T.taker) strays.push(c.varied + '->' + b)
    }
    const godsSeen = Object.keys(bosses).sort()
    ok('⭐ a god miniboss wave is led by THAT GOD\'s boss (reversal, D-108)',
      strays.slice(0, 3), [])
    // ⚠️ NEGATIVE CONTROL: an empty loop would make the line above vacuously true.
    ok('   (control: god minibosses were actually observed)', godsSeen.length >= 2, true)
  }

  // 🚨 AND HER OWN MINIBOSS WAVES STILL DRAW FROM HER LIST. The reversal above is
  // scoped to god waves; a normal tide handing out somebody else's champion is the
  // failure the original assertion existed to catch, and it is still caught.
  {
    const realRandom = Math.random
    let bad = []
    try {
      for (const roll of [0.25, 0.99]) {
        Math.random = () => roll
        const c = T._composeFor({}, tp, -20, 'miniboss')
        if (!c.varied && T.bosses.indexOf(String(c.boss)) === -1 &&
            String(c.boss) !== T.taker) bad.push(String(c.boss))
      }
    } finally { Math.random = realRandom }
    ok('🚨 HER miniboss is hers - from BOSSES, or the Taker', bad, [])
  }

  VELDORA.paths.pathOf = realPathOf
  VELDORA.difficulty.index = realDiff
}

grp('⭐ THE GOD ROSTERS ARE THE SAME LIST IN BOTH FILES')
{
  // 🚨 tide.js needs them for varied waves and spawn_pressure.js needs them for the
  // gods' own attacks. Two hand-maintained copies WILL drift, and the drift is
  // invisible - a god attacking with somebody else's mobs looks like a design choice.
  const sp = fs.readFileSync(path.join(SS, 'spawn_pressure.js'), 'utf8')
  const gods = ['blade', 'wall', 'salvage', 'forge', 'art']
  const missing = []
  gods.forEach(g => {
    T.rosters.gods[g].forEach(id => { if (sp.indexOf(id) === -1) missing.push(g + '/' + id) })
  })
  ok('🚨 every mob tide.js gives a god is in its spawn_pressure roster too',
    missing, [])

  // Ethan's rosters, checked against what he actually wrote.
  ok('blade has his four', T.rosters.gods.blade.length, 4)
  ok('wall has both spiders', T.rosters.gods.wall.length, 2)
  ok('salvage has the dread hound', T.rosters.gods.salvage, ['born_in_chaos_v1:dread_hound'])
  ok('forge has the krampus henchman', T.rosters.gods.forge, ['born_in_chaos_v1:krampus_henchman'])
  ok('art has her three', T.rosters.gods.art.length, 3)

  // 🚨 The bulk is HERS and must not be in a god's list, or his attacks become
  // indistinguishable from her tide.
  const allGodMobs = gods.reduce((a, g) => a.concat(T.rosters.gods[g]), [])
  ok('🚨 no god borrows her bulk',
    allGodMobs.indexOf('born_in_chaos_v1:decrepit_skeleton'), -1)
}

console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
