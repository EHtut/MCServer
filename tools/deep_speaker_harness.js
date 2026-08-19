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
const CUTOFF = -64

const server = {
  players: [], overworld: () => ({ dayTime: () => DAY * 24000 + 6000 }),
  scheduleInTicks: () => { }, runCommandSilent: () => { },
}

global.EntityEvents = { death: () => { }, beforeHurt: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { respawned: () => { }, loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.ServerEvents = { commandRegistry: () => { }, loaded: () => { }, tick: () => { } }
global.ItemEvents = { rightClicked: () => { }, entityInteracted: () => { } }
global.BlockEvents = { placed: () => { }, broken: () => { }, rightClicked: () => { } }
global.Text = { of: (s) => s }
global.Item = { of: () => ({}) }

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
    active: (p) => PLAYER_Y <= CUTOFF,
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
  ok('...but never twice inside the 90s floor', spoke <= 10, true)
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

grp('THE CUTOFF DECIDES WHICH VOICE, AND -64 IS INCLUSIVE')
{
  const p = mkPlayer()
  DAY = 20; RITUAL_ACTIVE = false
  PLAYER_Y = -63; SAID = []
  I.attempt(server, p, true)
  ok('y-63 is still the god (one block above the cutoff)', SAID[0].kind, 'idle')

  const q = mkPlayer()
  PLAYER_Y = -64; SAID = []
  I.attempt(server, q, true)
  ok('y-64 is already the Speaker (cutoff is inclusive)', SAID[0].kind, 'speaker')
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
console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
