// salvage_rate_harness.js — how OFTEN she opens, against the real maybeOpen().
//
//     node tools/salvage_rate_harness.js
//
// Ethan, live-testing 2026-08-18: "the biggest thing for salvage is that it bothers
// the player too much."
//
// The cause was a one-word distinction that is INVISIBLE in the file and 10x in play:
// the chance rolled once per 2-SECOND SAMPLE, not once per approach. So
// `0.15 // the unprompted approach, deliberately rare` was 99.2% certain within a
// minute of every cooldown expiry. Nothing about the code looked wrong. The log
// saying "she opened ... dry spell" twice in thirteen minutes was the only evidence
// that existed.
//
// A rate cannot be eyeballed and cannot be asserted one call at a time, so this
// SIMULATES HOURS of sampling against the real exported function and measures what
// comes out the other end.

'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

const SAMPLE = 40                 // must match SAMPLE_TICKS in salvage.js
const MIN = 20 * 60               // ticks per real minute
const LAST_OFFER = 'veldora_salvage_last_offer'

let DAYTIME = 100000
let OPEN_SUCCEEDS = true
let DEBT = 0
let opened = []

const server = {
  overworld: () => ({ dayTime: () => DAYTIME }),
  players: [],
  scheduleInTicks: () => { },
  runCommandSilent: () => { },
  runCommand: () => '',
}

global.EntityEvents = { death: () => { }, beforeHurt: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { respawned: () => { }, loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.ServerEvents = { commandRegistry: () => { }, loaded: () => { }, tick: () => { } }
global.ItemEvents = { rightClicked: () => { }, entityInteracted: () => { } }
global.BlockEvents = { placed: () => { }, broken: () => { }, rightClicked: () => { } }
global.Text = { of: (s) => s }
global.Item = { of: () => ({}) }

global.VELDORA = {
  paths: { pathOf: () => 'salvage' },
  counter: { get: () => DEBT, add: () => { }, daysSince: () => 99 },
  voice: {
    say: () => true, sayAbout: () => true, line: () => 'x',
    register: () => { }, registerLines: () => { }, setColour: () => { },
  },
  ritual: {
    active: () => false,
    begin: () => { if (OPEN_SUCCEEDS) { opened.push(DAYTIME); return true } return false },
    keepOnRelease: () => { },
  },
}

const realWarn = console.warn, realInfo = console.info, realErr = console.error
const hush = () => { console.warn = () => { }; console.info = () => { }; console.error = () => { } }
const speak = () => { console.warn = realWarn; console.info = realInfo; console.error = realErr }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'salvage.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: salvage.js threw on load :: ' + e); process.exit(1) }
speak()

// Stay hushed for the whole run. Every open logs "[salvage] she opened on ...", and
// a 25-hour simulation prints thousands of them - the measurements are the output
// here, not the events. Only console.log (this harness's own voice) survives.
hush()

const S = global.VELDORA.salvage
if (!S || typeof S.maybeOpen !== 'function') {
  speak()
  console.error('FAIL: VELDORA.salvage.maybeOpen is not exported')
  process.exit(1)
}

// LAST_OFFER lives in persistentData, and the entire fix is about WHEN it is
// stamped — so the harness has to be able to read it back.
function mkPlayer() {
  const store = {}
  return {
    username: 'P', uuid: 'uuid-1', health: 4,
    getAttribute: () => ({ getValue: () => 20 }),
    mainHandItem: { id: 'minecraft:air', count: 1 },
    persistentData: {
      getDouble: (k) => store[k] || 0,
      putDouble: (k, v) => { store[k] = v },
      getInt: (k) => store[k] || 0,
      putInt: (k, v) => { store[k] = v },
      getString: (k) => (k === 'veldora_path' ? 'salvage' : ''),
      putString: (k, v) => { store[k] = v },
      contains: () => true,
    },
    tell: () => { },
    _store: store,
  }
}

let pass = 0, fail = 0
function ok(name, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want)
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name) }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
function okBand(name, got, lo, hi) {
  const good = got >= lo && got <= hi
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name + '  (' + got + ')') }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + got + '  want ' + lo + '..' + hi) }
}
const grp = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m')

// Drive the real function exactly the way the real sampler does: every SAMPLE ticks.
function simulate(minutes, chance, debt) {
  DEBT = debt || 0
  opened = []
  const p = mkPlayer()
  DAYTIME = 100000
  const steps = Math.floor((minutes * MIN) / SAMPLE)
  for (let i = 0; i < steps; i++) {
    DAYTIME += SAMPLE
    S.maybeOpen(p, server, 'harness', chance)
  }
  return opened
}

// ═══════════════════════════════════════════════════════════════════════════
grp('ONE ROLL PER WINDOW — the fix itself')
{
  // chance 1.0 takes randomness out: she must open once per COOLDOWN, not once per
  // 2s sample. Before the fix those were the same number.
  const o = simulate(60, 1.0, 0)
  okBand('chance 1.0 over 1h opens ~12x (once per 5 min), not ~1800x', o.length, 11, 13)
  const gaps = []
  for (let i = 1; i < o.length; i++) gaps.push(o[i] - o[i - 1])
  ok('every gap is at least the 6000t cooldown', gaps.every(g => g >= 6000), true)
}

grp('...and a LOST roll SPENDS the window')
{
  // 🔑 THE WHOLE BUG. If a lost roll did not stamp, she would still open within
  // seconds of every expiry and a 0.15 chance would measure the same as 1.0.
  const o = simulate(600, 0.15, 0)          // 10 hours
  okBand('chance 0.15 gives ~1.8 approaches/h, NOT 12/h', o.length / 10, 0.9, 3.0)
}

grp('THE RATE TABLE — what a player actually experiences')
{
  const rows = [
    ['combat  0.15', 0.15, 20, 60],
    ['death   0.30', 0.30, 10, 30],
    ['dry     0.40', 0.40, 7, 22],
  ]
  for (const r of rows) {
    const o = simulate(1500, r[1], 0)       // 25h for a stable mean
    const mean = o.length > 1 ? (1500 / o.length) : 9999
    okBand(r[0] + ' -> mean minutes between approaches', Math.round(mean), r[2], r[3])
  }
}

grp('THE DEBT RATCHET still shortens, and still floors')
{
  const mZero = 1500 / simulate(1500, 0.40, 0).length
  const mFloor = 1500 / simulate(1500, 0.40, 40).length   // far past the 12 to floor
  ok('debt makes her faster', mFloor < mZero, true)
  okBand('...but never faster than floor 2400t / 0.40 = ~5 min', Math.round(mFloor), 3, 9)
}

grp('🚨 A FAILED OPEN MUST NOT SPEND THE WINDOW')
{
  // She WON the roll and something else stopped her. Charging her the window for
  // that would make her quieter every time the machinery hiccups, silently.
  // godevents states the same rule: "a run() that returns false does NOT stamp".
  OPEN_SUCCEEDS = false
  DEBT = 0
  DAYTIME = 100000
  const p = mkPlayer()
  S.maybeOpen(p, server, 'harness', 1.0)          // chance 1.0 - the roll cannot lose
  ok('a failed open leaves LAST_OFFER unstamped', p._store[LAST_OFFER] || 0, 0)
  OPEN_SUCCEEDS = true

  // ...whereas a LOST roll must stamp. That asymmetry IS the fix.
  const q = mkPlayer()
  let sawStamp = false
  for (let i = 0; i < 200 && !sawStamp; i++) {
    DAYTIME += SAMPLE
    S.maybeOpen(q, server, 'harness', 0.0)        // chance 0 - the roll always loses
    if ((q._store[LAST_OFFER] || 0) > 0) sawStamp = true
  }
  ok('a lost roll DOES stamp', sawStamp, true)
}

grp('SANITY — the gates that must still hold')
{
  DEBT = 0; DAYTIME = 100000
  global.VELDORA.ritual.active = () => true
  ok('silent while another scene is running', S.maybeOpen(mkPlayer(), server, 'x', 1.0), false)
  global.VELDORA.ritual.active = () => false

  const noClock = { overworld: () => ({ dayTime: () => NaN }), players: [], scheduleInTicks: () => { } }
  ok('no world clock -> suppressed, never spam', S.maybeOpen(mkPlayer(), noClock, 'x', 1.0), false)

  global.VELDORA.paths.pathOf = () => 'blade'
  ok('never opens on someone who does not walk salvage', S.maybeOpen(mkPlayer(), server, 'x', 1.0), false)
  global.VELDORA.paths.pathOf = () => 'salvage'
}

console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
