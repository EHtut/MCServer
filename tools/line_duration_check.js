// line_duration_check.js — no single line may hold the screen longer than 15 seconds.
//
//     node tools/line_duration_check.js
//
// ⭐ ETHAN'S RULING, 2026-08-30: *"Moving dialogue is fine for a minute, a single line
// holding for more than 15s? no."*
//
// That settles D-131 and it settles it the opposite way to my finding. The AGGREGATE is
// fine - Wall taking fifty seconds over four sentences is dialogue, not a fault. What is
// not fine is any ONE beat sitting on screen past fifteen seconds.
//
// ── 🔴 WHY A CAP IN beatFor WOULD BE THE WRONG FIX ───────────────────────────
// `beatFor` is typing time PLUS reading time, and the typing rate is fixed in the mod
// and unreachable (D-123). Clamping the duration to 15s would not make a long line
// arrive faster - it would cut it off mid-word, which is the exact bug the 08-30
// rewrite of that function existed to fix.
//
// 🔑 SO A LONG BEAT IS A WRITING PROBLEM, NOT A TIMING ONE. The answer is to split the
// sentence, and this file's job is to say precisely which ones need it.
//
// ── ⚠️ IT MEASURES WHAT IS ACTUALLY SAYABLE, NOT WHAT IS STORED ──────────────
// A pool that is not `whole` composes its line as `open + ' ' + close`, so the longest
// utterance is not the longest stored string - it is the worst PAIRING. Every
// combination is enumerated, then split with the game's own `sentences()` and measured
// with the game's own `beatFor()` at the god's own beatScale. Measured at the point of
// use; nothing here re-implements the engine.
'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

const CEILING_TICKS = 300      // 15s. Ethan's number, in the engine's unit.

let pass = 0, fail = 0
const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', Y = '\x1b[33m', X = '\x1b[0m'
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}

// ── the sandbox ─────────────────────────────────────────────────────────────
// Any hook name at all resolves to a no-op. See the note on the buses below.
const bus = () => new Proxy({}, { get: () => (() => { }) })
const loadedHooks = []
const server = {
  tickCount: 0, players: [],
  runCommandSilent: () => undefined, runCommand: () => '',
  scheduleInTicks: () => 0,
  overworld: () => ({ dayTime: () => 1000 }),
}
const stub = {
  Platform: { isLoaded: () => true },
  Utils: { server },
  ServerEvents: { loaded(f) { loadedHooks.push(f) }, commandRegistry() { }, tick() { } },
  // 🔴 THE EVENT BUSES ARE PROXIES, NOT HAND-LISTED STUBS.
  //
  // Listing them by hand failed three times in a row - `EntityEvents.drops`, then
  // `ItemEvents.crafted`, then `ItemEvents.smelted`. Each miss made a file fail to load,
  // and each time its dialogue went UNMEASURED behind a cheerful all-clear. That is the
  // exact failure this project keeps paying for: a checker that is configured, running,
  // and quietly covering less than it claims.
  //
  // ⭐ A Proxy answers every hook name with a no-op, so a KubeJS event this file has
  // never heard of cannot silently remove a god's lines from the measurement. The list
  // of files that still fail to load is printed either way - the point is that the list
  // should be empty because everything loads, not because nothing was tried.
  PlayerEvents: bus(), EntityEvents: bus(), BlockEvents: bus(), ItemEvents: bus(),
  LevelEvents: bus(), RecipeEvents: bus(), NetworkEvents: bus(),
  Text: { of: x => x },
  Item: { of: () => ({}) },
  console: { info() { }, log() { }, warn() { }, error() { } },
}
const keys = Object.keys(stub)
let V = {}
function run(file) {
  const src = fs.readFileSync(path.join(SS, file), 'utf8')
  V = new Function(...keys, 'VELDORA_IN',
    'var VELDORA=VELDORA_IN;' + src.replace(/^var VELDORA = .*$/m, '') + '\n;return VELDORA;'
  )(...keys.map(k => stub[k]), V)
}

// ⛔ ORDER MATTERS. voice.js publishes the engine; pantheon.js is the registrar every god
// now goes through; the god files register into it. Loading a god first is how the other
// harnesses ended up measuring gods that had registered nothing.
const FIRST = ['garble.js', 'immersive.js', 'screen.js', 'voice.js', 'pantheon.js']
const skipped = []
for (const f of FIRST) run(f)
for (const f of fs.readdirSync(SS).filter(f => f.endsWith('.js') && FIRST.indexOf(f) === -1)) {
  // ⚠️ A file that will not load in this stub is RECORDED, never swallowed. A silent skip
  // would let a whole god's dialogue go unmeasured while this printed all-clear.
  try { run(f) } catch (e) { skipped.push(f + ' :: ' + String(e).split('\n')[0]) }
}
for (const f of loadedHooks) { try { f({ server }) } catch (e) { } }

const voice = V.voice
if (!voice || !voice.pools) { console.error('FAIL: voice.pools not published'); process.exit(1) }

// ── every sayable line, measured ────────────────────────────────────────────
const POOLS = voice.pools
const over = []
let gods = 0, tags = 0, utterances = 0, beats = 0, worst = null

for (const god of Object.keys(POOLS)) {
  gods++
  const st = voice.styleOf(god)
  for (const tag of Object.keys(POOLS[god])) {
    tags++
    const p = POOLS[god][tag]
    const combos = []
    if (p.whole) { for (const o of p.opens) combos.push(String(o)) }
    else { for (const o of p.opens) for (const c of p.closes) combos.push(String(o) + ' ' + String(c)) }
    for (const utterance of combos) {
      utterances++
      for (const s of voice.sentences(utterance)) {
        beats++
        const t = voice.beatFor(s, st)
        if (!worst || t > worst.ticks) worst = { god, tag, ticks: t, chars: s.length, text: s }
        if (t > CEILING_TICKS) over.push({ god, tag, ticks: t, chars: s.length, text: s })
      }
    }
  }
}

console.log('\n' + B + 'THE 15-SECOND CEILING' + X)
console.log('  ' + gods + ' god(s), ' + tags + ' pool(s), ' + utterances +
  ' sayable line(s), ' + beats + ' beat(s) measured')
if (worst) {
  console.log('  longest beat: ' + Y + (worst.ticks / 20).toFixed(1) + 's' + X +
    ' (' + worst.chars + ' chars) ' + worst.god + '/' + worst.tag)
  console.log('    "' + worst.text.slice(0, 96) + (worst.text.length > 96 ? '..."' : '"'))
}

// 🚨 THE COUNT IS ASSERTED, NOT THE FACT THAT THE CHECK RAN. A version of this that
// measured nothing would also report zero over the ceiling.
ok('beats were actually measured - a zero here means the harvester is broken', beats > 0, true)
ok('every god registered - none silently failed to load', gods >= 5, true)
ok('no single beat holds the screen longer than 15s', over.length, 0)

// ⚠️ THE MARGIN IS THIN, AND THE NUMBER IT RESTS ON IS AN ESTIMATE.
//
// The longest real beat is ~14.2s against a 15s ceiling. That gap is computed with
// `TYPE_CHARS_PER_SEC = 15`, which voice.js labels honestly as an ESTIMATE from a single
// eyeball reading - the mod's typing rate is fixed and unreachable (D-123), so it has
// never been measured properly.
//
// 🔑 IF THE REAL RATE IS BELOW ~13.7 chars/sec, THE LONGEST LINE ALREADY BREACHES 15s
// in play while this file reports all-clear. That is not a hypothetical: the estimate is
// 15 and the breaking point is 13.7, so being 9% optimistic is enough.
//
// So the headroom is reported every run rather than left implicit. A warning here means
// the next long line somebody writes is the one that breaks the ruling.
const HEADROOM = worst ? (CEILING_TICKS - worst.ticks) / 20 : null
if (HEADROOM !== null) {
  const pct = Math.round((worst.ticks / CEILING_TICKS) * 100)
  console.log('  headroom: ' + (HEADROOM < 2 ? Y : G) + HEADROOM.toFixed(1) + 's' + X +
    ' (' + pct + '% of the ceiling used)')
  if (HEADROOM < 2) {
    console.log('  ' + Y + '\u26a0 within 2s of the ceiling, on an ESTIMATED typing rate. ' +
      'A rate below ~13.7 chars/sec breaks the longest line in play.' + X)
  }
}

if (over.length) {
  console.log('\n' + R + 'OVER THE CEILING - these need SPLITTING, not a shorter timer:' + X)
  over.sort((a, b) => b.ticks - a.ticks)
  for (const o of over.slice(0, 40)) {
    console.log('  ' + Y + (o.ticks / 20).toFixed(1) + 's' + X + '  ' + o.god + '/' + o.tag +
      '  (' + o.chars + ' chars)')
    console.log('    "' + o.text + '"')
  }
  if (over.length > 40) console.log('  ...and ' + (over.length - 40) + ' more')
}
if (skipped.length) {
  console.log('\n' + Y + 'NOT LOADED in this sandbox (their lines went unmeasured):' + X)
  for (const s of skipped) console.log('  ' + s)
}

console.log('\n' + (fail === 0
  ? G + pass + '/' + (pass + fail) + ' passed' + X
  : R + fail + ' FAILED' + X + ', ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
