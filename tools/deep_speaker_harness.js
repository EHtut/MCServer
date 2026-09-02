// deep_speaker_harness.js — the voice below the cutoff actually gets to speak.
//
//     node tools/deep_speaker_harness.js
//
// Ethan, live 2026-08-18: "i am on level -127 and we got no deepspeaker."
//
// 🔴 THE BUG THIS LOCKS DOWN. The Speaker was billed to `veldora_idle_day_<god>` -
// the SAME once-per-world-day allowance as ordinary idle chatter. Every
// "wall/combat" and "wall/guidance" collected on the surface spent the deep voice
// before the player ever descended.
//
// ⚠️ AND THE SYMPTOM WAS SILENCE, which is why it survived. The session log was full
// of [idle] lines and contained not one [speaker] line, and that reads exactly like
// a mechanic whose whole premise is "your god goes quiet down here". A test is the
// only thing that can tell "he is out of earshot" from "he was never billed a turn".

'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

const IDLE_KEY = 'veldora_idle_day_'
const DEEP_KEY = 'veldora_deep_at_'    // world TICKS since 2026-08-18, not days

let DAY = 5
let SAID = []
let RITUAL_ACTIVE = false
let PLAYER_Y = 64

// 🔴🔴 THIS WAS `const CUTOFF = -64`, AND BOTH HALVES OF IT WERE WRONG.
//
// Found by an adversarial audit, 2026-09-01. The literal was a copy of a number
// deep_speaker.js had already MOVED - `CUTOFF_Y` is -40, and that file's own comment
// says why: at -64 the Speaker "would have fired essentially never". So the boundary
// group below asserted an edge the game has not had for some time, and passed, because
// the only thing it consulted was this harness's own copy of the number.
//
// ⚠️ AND THE RULE WAS WRONG TOO, WHICH IS THE WORSE HALF. -40 is only the FALLBACK for
// a build that cannot read sky. The rule the game runs is `y < 0 && !sky` - "the depths"
// is enclosure PLUS negative y, not a flat number (Ethan, 2026-08-22: *"anything that's
// no ceilling and in negative y"*). A stub written as `PLAYER_Y <= CUTOFF` reproduced
// the DEGRADED path and called it the contract.
//
// 🔑 THE FIX IS THIS PROJECT'S OLDEST RULE: measure at the point of USE. The stub below
// no longer re-implements the boundary - it borrows deep_speaker.js's own `active`. A
// change to that rule now moves this harness with it instead of out from under it.
let CUTOFF = null            // deep_speaker.js's published fallback cutoff
let REAL_ACTIVE = null       // ...and the real depth predicate it publishes

const server = {
  players: [], overworld: () => ({ dayTime: () => DAY * 24000 + 6000 }),
  scheduleInTicks: () => { }, runCommandSilent: () => { },
}

global.EntityEvents = { death: () => { }, beforeHurt: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { respawned: () => { }, loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
// 🔴🔴 THIS STUB WAS A NO-OP AND IT COST TWO SPEAKERS A DAY OF BEING DEAD.
//
// deep_speaker.js does its ENTIRE registration inside ServerEvents.loaded. Swallowing
// the handler meant 21/21 passed green while the live boot block threw on Kayer (who
// has no confession, deliberately) and took `art` and `forge` down with it. The
// harness was testing pure functions against fixtures and calling that coverage.
//
// ⭐ Captured now, and RUN below. This is the repo's own oldest rule finally applied
// to this file: run_all cannot see liveness, so the test has to run the boot path.
const LOADED = []
global.ServerEvents = { commandRegistry: () => { }, loaded: (fn) => LOADED.push(fn), tick: () => { } }
global.ItemEvents = { rightClicked: () => { }, entityInteracted: () => { } }
global.BlockEvents = { placed: () => { }, broken: () => { }, rightClicked: () => { } }
global.Text = { of: (s) => s }
global.Item = { of: () => ({}) }

// ═══════════════════════════════════════════════════════════════════════════
// ⭐ BORROW THE REAL DEPTH PREDICATE BEFORE ANYTHING ELSE LOADS.
//
// deep_speaker.js publishes `VELDORA.speaker` in its SCRIPT BODY (`cutoff`, `active`,
// `speakers`); `registerLines` runs exclusively inside `ServerEvents.loaded`, which is
// NOT run here - the handler is popped straight back off `LOADED`. So this capture is
// side-effect-free and cannot disturb the boot-path group at the bottom, which still
// loads the file itself and counts the registrations for real.
//
// 🚨 IT FAILS LOUD. If the seam moves, this must not quietly fall back to a literal -
// that is the "I failed / I found nothing" collision, and a stale literal is exactly
// what this block exists to remove.
{
  const savedLoaded = LOADED.length
  global.VELDORA = {
    paths: { pathOf: () => 'blade' },
    ritual: { begin: () => true, active: () => false },
    voice: { registerLines: () => true, setColour: () => { }, say: () => true, line: () => 'x' },
    phase: { of: () => 'early' },
  }
  const rw = console.warn, ri = console.info, re = console.error
  console.warn = () => { }; console.info = () => { }; console.error = () => { }
  let err = null
  try { (0, eval)(fs.readFileSync(path.join(SS, 'deep_speaker.js'), 'utf8')) }
  catch (e) { err = e }
  console.warn = rw; console.info = ri; console.error = re
  LOADED.length = savedLoaded
  const pub = global.VELDORA.speaker
  if (err) { console.error('FAIL: deep_speaker.js threw while reading its cutoff :: ' + err); process.exit(1) }
  if (!pub || typeof pub.active !== 'function' || typeof pub.cutoff !== 'number') {
    console.error('FAIL: deep_speaker.js does not publish {cutoff, active} - the ' +
      'boundary cannot be tested, and a hardcoded copy is what this replaced')
    process.exit(1)
  }
  CUTOFF = pub.cutoff
  REAL_ACTIVE = pub.active
}

global.VELDORA = {
  paths: { pathOf: () => 'blade' },
  ritual: { active: () => RITUAL_ACTIVE },
  voice: {
    // Ordinary idle. Always has something to say, so a silent result is never
    // "the pool was empty" — it is the cooldown, which is what we are testing.
    say: (p, god, tag) => { SAID.push({ kind: 'idle', god, tag }); return true },
    sayAbout: () => true,
    line: () => 'x',
  },
  speaker: {
    cutoff: CUTOFF,
    // ⭐ THE REAL PREDICATE, not a re-implementation of it. `say`/`forPath` stay stubs
    // because this half of the file is testing idle.js's BILLING, and a recording stub
    // is what lets us see which voice was charged. But WHICH voice is on duty is
    // deep_speaker.js's decision, and it is now deep_speaker.js that makes it.
    active: (p) => REAL_ACTIVE(p),
    forPath: () => ({ name: 'the Speaker' }),
    say: (p, tag) => { SAID.push({ kind: 'speaker', tag }); return true },
  },
}

const realWarn = console.warn, realInfo = console.info, realErr = console.error
const hush = () => { console.warn = () => { }; console.info = () => { }; console.error = () => { } }
const speak = () => { console.warn = realWarn; console.info = realInfo; console.error = realErr }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'idle.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: idle.js threw on load :: ' + e); process.exit(1) }

const I = global.VELDORA.idle
if (!I || typeof I.attempt !== 'function') {
  speak(); console.error('FAIL: VELDORA.idle.attempt not exported'); process.exit(1)
}

function mkPlayer() {
  const store = {}
  return {
    username: 'P', uuid: 'u1', health: 20,
    get y() { return PLAYER_Y },
    getAttribute: () => ({ getValue: () => 20 }),
    mainHandItem: { id: 'minecraft:air', count: 1 },
    blockPosition: () => ({ x: 0, y: PLAYER_Y, z: 0 }),
    level: { canSeeSky: () => PLAYER_Y > 0, getEntitiesWithin: () => [] },
    boundingBox: { inflate: () => ({}) },
    persistentData: {
      getInt: (k) => store[k] || 0, putInt: (k, v) => { store[k] = v },
      getDouble: (k) => store[k] || 0, putDouble: (k, v) => { store[k] = v },
      getString: (k) => (k === 'veldora_path' ? 'blade' : ''), putString: (k, v) => { store[k] = v },
      contains: () => true,
    },
    tell: () => { }, _store: store,
  }
}

let pass = 0, fail = 0
function ok(name, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want)
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name) }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
const grp = (t) => { speak(); console.log('\n\x1b[1m' + t + '\x1b[0m'); hush() }

// ═══════════════════════════════════════════════════════════════════════════
grp("🔴 ETHAN'S BUG — surface chatter must not spend the deep voice")
{
  const p = mkPlayer()
  SAID = []; DAY = 5; RITUAL_ACTIVE = false

  PLAYER_Y = 64                       // up top: the god talks, as it does all day
  // ⚠️ ASSERT THE INVARIANT, NOT THE LITERAL. This first read `=== 'guidance'` and
  // was FLAKY - RARE_CHANCE swaps in 'rare_guidance' 15% of the time, so it passed
  // one run and failed the next. Same trap the release harness hit twice with
  // hardcoded streak counts: what matters is that the GOD spoke, not which line.
  ok('the god speaks on the surface', !!I.attempt(server, p, true), true)
  ok('...and it was ordinary idle, not the Speaker', SAID[0].kind, 'idle')

  PLAYER_Y = -127                     // the exact depth Ethan reported
  SAID = []
  // Before the fix this returned null: the day's allowance was already spent by the
  // line above, and descending produced silence that looked like the feature.
  ok('descending to y-127 STILL gets the Speaker', I.attempt(server, p, true), 'speaker')
  ok('...and it is the Speaker, not the god', SAID[0].kind, 'speaker')
}

grp('THE TWO LEDGERS ARE GENUINELY SEPARATE')
{
  const p = mkPlayer()
  DAY = 7; RITUAL_ACTIVE = false
  // ⚠️ ASSERT WHICH LEDGER MOVED, NOT WHAT IT HOLDS. These read `=== DAY + 1` and
  // broke the moment the cap became a stopwatch instead of a calendar - the
  // BEHAVIOUR was unchanged and correct, only the units moved. The invariant that
  // actually matters is that the two ledgers are independent.
  PLAYER_Y = 64; SAID = []; I.attempt(server, p, true)
  const idleStamp = p._store[IDLE_KEY + 'blade'] || 0
  ok('surface speech stamps the IDLE ledger', idleStamp > 0, true)
  ok('...and leaves the DEEP ledger untouched', p._store[DEEP_KEY + 'blade'] || 0, 0)

  PLAYER_Y = -127; SAID = []; I.attempt(server, p, true)
  ok('deep speech stamps the DEEP ledger', (p._store[DEEP_KEY + 'blade'] || 0) > 0, true)
  ok('...and does not re-stamp the idle one', p._store[IDLE_KEY + 'blade'], idleStamp)
}

grp('EACH LEDGER STILL CAPS ITSELF — the fix must not uncap anything')
{
  const p = mkPlayer()
  DAY = 9; RITUAL_ACTIVE = false

  PLAYER_Y = -127
  ok('first deep line of the day lands', I.attempt(server, p, false), 'speaker')
  ok('🚨 a SECOND deep line the same day is refused', I.attempt(server, p, false), null)
  DAY = 10
  ok('...and a new world day frees it again', I.attempt(server, p, false), 'speaker')

  const q = mkPlayer()
  DAY = 9; PLAYER_Y = 64
  ok('first surface line of the day lands', !!I.attempt(server, q, false), true)
  ok('🚨 a SECOND surface line the same day is refused', I.attempt(server, q, false), null)
}

grp("⭐ ETHAN'S CHANGE — a god may speak MORE THAN ONCE per world day")
{
  // "we don't play daily or for long periods". A world day is 20 real minutes, so
  // the old cap gave a player three lines in an hour. This is the assertion that
  // would have caught it going back.
  const p = mkPlayer()
  DAY = 40; RITUAL_ACTIVE = false; PLAYER_Y = 64
  let spoke = 0
  // Walk a single world day forward in 2-minute steps. dayTime is DAY*24000+6000,
  // so nudge the clock by overriding the getter for this block only.
  let extra = 0
  const realOw = server.overworld
  server.overworld = () => ({ dayTime: () => DAY * 24000 + 6000 + extra })
  for (let i = 0; i < 10; i++) {
    if (I.attempt(server, p, false)) spoke++
    extra += 2400            // 2 real minutes, well inside ONE world day
  }
  server.overworld = realOw
  ok('speaks repeatedly within a single world day (was capped at 1)', spoke > 1, true)

  // 🔴 THIS ASSERTED `spoke <= 10` INSIDE A TEN-ITERATION LOOP. `spoke` increments at
  // most once per pass, so the condition was arithmetically incapable of being false -
  // and it was the only thing in this file claiming the anti-stacking floor existed.
  // A green tick that cannot go red is worse than no tick: it occupies the slot.
  //
  // ⚠️ AND THE OLD LOOP COULD NOT HAVE SEEN THE FLOOR EVEN IF IT HAD ASSERTED ONE. It
  // steps 2400 ticks a pass, which is ABOVE the floor, so every attempt was legitimately
  // allowed. Testing a floor requires stepping BELOW it.
  //
  // 🔑 MEASURED, NOT PINNED. idle.js does not export GAP_TICKS, so this asserts the
  // floor's BEHAVIOUR - refused immediately, allowed eventually - and carries no copy of
  // its value. A retune moves the measured gap; it does not break this.
  {
    const f = mkPlayer()
    DAY = 41; PLAYER_Y = 64; RITUAL_ACTIVE = false
    let clock = 0
    server.overworld = () => ({ dayTime: () => DAY * 24000 + 6000 + clock })
    ok('the first line of a fresh stretch lands', !!I.attempt(server, f, false), true)
    ok('🚨 an immediate second attempt is refused - there IS a floor',
      I.attempt(server, f, false), null)

    // Walk forward in small steps until it speaks again. The guard is far past any
    // plausible floor, so a floor that never lifts fails here rather than hanging.
    let waited = 0, guard = 0
    while (guard++ < 400) {
      clock += 100
      waited += 100
      if (I.attempt(server, f, false)) break
    }
    ok('...and it does lift - the floor is a gap, not a mute', guard < 400, true)
    ok('🚨 ...having actually held the line back for a real span, not one tick',
      waited > 100, true)

    // ⭐ THE RELATIONSHIP, WHICH IS THE PART THAT CARRIES MEANING. idle.js picks
    // `deep ? DEEP_GAP : GAP_TICKS`, and the deep floor is deliberately the shorter of
    // the two - *"he is why you came down"*. Their VALUES are tunable and neither is
    // exported; their ORDER is the design. Measuring both and comparing catches the two
    // failures that matter - a swapped ternary, or one floor collapsing to zero -
    // without this file carrying a copy of either number.
    const d = mkPlayer()
    DAY = 42; PLAYER_Y = -127
    clock = 0
    server.overworld = () => ({ dayTime: () => DAY * 24000 + 6000 + clock })
    ok('the first deep line lands', I.attempt(server, d, false), 'speaker')
    let deepWait = 0, dguard = 0
    while (dguard++ < 400) {
      clock += 100
      deepWait += 100
      if (I.attempt(server, d, false)) break
    }
    server.overworld = realOw
    ok('the deep floor lifts too', dguard < 400, true)
    ok('🚨 the DEEP floor is shorter than the surface one - he is why you came down',
      deepWait < waited, true)
    console.log('      (measured floors: surface ' + waited + 't / ' + (waited / 20).toFixed(0) +
      's, deep ' + deepWait + 't / ' + (deepWait / 20).toFixed(0) + 's)')
  }
}

grp('THE GUARDS THE COMMENT WARNS ABOUT ARE INTACT')
{
  // idle.js carries a note that the Speaker once sat ABOVE these guards, ignored the
  // cooldown entirely and could have landed a line inside the Harvest. This change
  // moved which LEDGER he is billed to - it must not have moved him back out.
  const p = mkPlayer()
  DAY = 12; PLAYER_Y = -127; RITUAL_ACTIVE = true
  ok('🚨 the Speaker never talks over a running scene', I.attempt(server, p, true), null)
  RITUAL_ACTIVE = false
  ok('...and speaks once the scene ends', I.attempt(server, p, true), 'speaker')

  const q = mkPlayer()
  DAY = 12; PLAYER_Y = 64; RITUAL_ACTIVE = true
  ok('ordinary idle never talks over a scene either', I.attempt(server, q, true), null)
  RITUAL_ACTIVE = false
}

grp('THE DEPTHS DECIDE WHICH VOICE - and "the depths" is enclosure AND negative y')
{
  // 🔴 THIS GROUP USED TO READ "-64 IS INCLUSIVE" AND TEST NOTHING BUT ITS OWN STUB.
  // See the note at the top of the file. The boundary is now deep_speaker.js's, and
  // the sandbox player reports sky exactly where a real one would: above y0.
  const p = mkPlayer()
  DAY = 20; RITUAL_ACTIVE = false
  PLAYER_Y = -1; SAID = []
  I.attempt(server, p, true)
  ok('y-1 under a roof is ALREADY the Speaker - the depths start at y0',
    SAID[0].kind, 'speaker')

  const q = mkPlayer()
  PLAYER_Y = 1; SAID = []
  I.attempt(server, q, true)
  ok('y1 is still the god - positive y is never the depths', SAID[0].kind, 'idle')

  // 🚨 THE OTHER HALF OF THE RULE, AND THE ONE A FLAT NUMBER CANNOT EXPRESS. Deep AND
  // enclosed. A player below y0 who can still see sky (a ravine, a deep valley) is not
  // in the depths - the In Control README records this exact mistake twice, where an
  // absolute height was used as a proxy for being underground.
  const r = mkPlayer()
  r.level = { canSeeSky: () => true, getEntitiesWithin: () => [] }
  PLAYER_Y = -100; SAID = []
  I.attempt(server, r, true)
  ok('🚨 y-100 WITH SKY is the god, not the Speaker - depth alone is not the rule',
    SAID[0].kind, 'idle')

  // ⭐ AND THE OTHER CONJUNCT, ISOLATED THE SAME WAY. A roof over your head at a
  // POSITIVE y is a basement, not the depths. Without this the two assertions above
  // pass unchanged if the y term is deleted or its threshold drifts upward, because
  // the sandbox player's sky is a function of its y and the two never disagree.
  const u = mkPlayer()
  u.level = { canSeeSky: () => false, getEntitiesWithin: () => [] }
  PLAYER_Y = 1; SAID = []
  I.attempt(server, u, true)
  ok('🚨 an ENCLOSED player at y1 is still the god - enclosure alone is not the rule',
    SAID[0].kind, 'idle')

  // 🔑 THE NEGATIVE CONTROL. Every assertion above reads `SAID[0].kind`, so all three
  // would pass against a system that had stopped consulting the predicate at all and
  // simply always answered the same way. Flip the predicate and the SAME inputs must
  // give the opposite answers; if they do not, this group is measuring nothing.
  const realActive = REAL_ACTIVE
  REAL_ACTIVE = (pl) => !realActive(pl)
  const s = mkPlayer()
  PLAYER_Y = 1; SAID = []
  I.attempt(server, s, true)
  ok('...with the predicate inverted, y1 becomes the Speaker (the group can fail)',
    SAID[0].kind, 'speaker')
  REAL_ACTIVE = realActive

  // ...and the published fallback is still a real number, because a build that cannot
  // read sky falls back to it. `null` here would mean the seam moved.
  ok('deep_speaker.js still publishes a numeric fallback cutoff', typeof CUTOFF, 'number')
}

grp('A PATHLESS PLAYER HEARS NOBODY, AT ANY DEPTH')
{
  const p = mkPlayer()
  DAY = 30; RITUAL_ACTIVE = false; PLAYER_Y = -127
  global.VELDORA.paths.pathOf = () => ''
  ok('no path, no voice - not even down there', I.attempt(server, p, true), null)
  global.VELDORA.paths.pathOf = () => 'blade'
}

speak()

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 deep_speaker.js IS ACTUALLY LOADED AND BOOTED — both were missing')
{
  // 🔴🔴 TWO HOLES, FOUND 2026-08-23 WHEN A RESTART BROKE:
  //
  //   1. This file is called deep_speaker_harness and it NEVER LOADED
  //      deep_speaker.js. Everything above is idle.js talking to a STUBBED speaker -
  //      real coverage of the cutoff and the cooldowns, and zero coverage of the file
  //      in the name.
  //   2. ServerEvents.loaded was stubbed to a no-op, so the registration loop - which
  //      is where deep_speaker.js does ALL of its work - never ran.
  //
  // Together they let 21/21 stay green while the live boot threw on Kayer (no
  // confession, deliberately) and took `art` AND `forge` down with it, silently.
  //
  // ⭐ Loaded in isolation and restored afterwards, so the stub the tests above rely
  // on is untouched.
  const stubSpeaker = global.VELDORA.speaker
  const before = LOADED.length
  // 🔑 MEASURE AT THE POINT OF USE. A first version of this asserted on
  // VELDORA.speaker.speakers - which is filled by register() in the SCRIPT BODY and is
  // therefore always complete, boot loop or no boot loop. It passed against the broken
  // code. The actual casualty was the VOICE POOLS: art threw, so forge never reached
  // registerLines and its champion heard silence. So that is what gets counted.
  const REGISTERED = []
  global.VELDORA.voice.registerLines = (id, tag) => { REGISTERED.push(id); return true }
  global.VELDORA.voice.setColour = () => { }
  global.VELDORA.ritual.begin = () => true
  global.VELDORA.phase = { of: () => 'early' }

  hush()
  let loadErr = null, bootErr = null
  try { (0, eval)(fs.readFileSync(path.join(SS, 'deep_speaker.js'), 'utf8')) }
  catch (e) { loadErr = e }
  if (!loadErr) {
    try { for (let i = before; i < LOADED.length; i++) LOADED[i]({ server }) }
    catch (e) { bootErr = e }
  }
  speak()

  ok('deep_speaker.js loads', loadErr === null ? true : String(loadErr), true)
  ok('🚨 and its ServerEvents.loaded RUNS without throwing', bootErr === null ? true : String(bootErr), true)

  const spk = (global.VELDORA.speaker && global.VELDORA.speaker.speakers) || {}
  const gotLines = [...new Set(REGISTERED)].sort()
  ok('🚨 ALL SIX SPEAKERS GOT THEIR LINES INTO THE VOICE SYSTEM', gotLines,
    ['death_doctor', 'death_keeper', 'death_matriarch', 'death_shadow',
     'death_speaker', 'death_stranger'])

  // 🔴 THE CONFESSION IS RETCONNED AWAY, SO THIS GROUP INVERTED. Ethan, 2026-08-30:
  // *"so we remove deep speaker confession"*, alongside *"im retconning the rule for
  // unique deep speakers. It will always just be caebrim."*
  //
  // ⭐ HIS WRITING IS NOT LOST - all four scripts are archived verbatim in
  // docs/archive/deep-speaker-confessions-2026-08-30.md. Nothing reads them.
  //
  // ⚠️ THIS USED TO CRASH THE FILE, not fail it: `spk.forge.confession.length` threw on
  // undefined and took the remaining assertions with it. A harness that dies partway
  // reports the tests it never ran as nothing at all.
  //
  // 🔑 The old canary is kept in its inverted form. It asked whether an entry WITHOUT a
  // confession broke the entries after it; now none of them have one, so the question is
  // whether every speaker still registers with none - and forge, enumerating after art,
  // is still the one that would show it first.
  ok('NO speaker carries a confession any more - the retcon holds',
    Object.keys(spk).filter(k => spk[k] && spk[k].confession).length, 0)
  ok('...and forge still registered without one', !!spk.forge, true)
  // 🔴 SHE IS NAMED, NOT TITLED. `the Shadow` was my placeholder - deep_speaker.js
  // still flags it as such - and Ethan's retcon replaced it with her actual name:
  // *"im retconning the rule for unique deep speakers. It will always just be
  // caebrim."* All five entries now read Caebrim.
  ok('caebrim holds BOTH blade and forge, by name (docs/61)',
    [spk.blade && spk.blade.name, spk.forge && spk.forge.name], ['Caebrim', 'Caebrim'])

  global.VELDORA.speaker = stubSpeaker
}


console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
