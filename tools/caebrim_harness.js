// caebrim_harness.js — she is one voice, her tier is the tide, and she reaches the screen.
//
//     node tools/caebrim_harness.js
//
// ⚠️ Not the words - those are Ethan's and caebrim_import.py reports on them. This is the
// wiring: does a whisper actually arrive, does her tier track the TIDE rather than a
// relationship, and is the tide announcement centred where her document says it must be.
'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

function build(tideState) {
  const sent = []
  const player = { uuid: 'p1', username: 'p1', tell: () => { }, get server() { return server } }
  const server = { tickCount: 0, players: [player], scheduleInTicks: (t, f) => { try { f() } catch (e) { } } }
  const VELDORA = {
    // 🔴 SHE IS SILENT TO THE PATHLESS UNTIL THEIR FIRST DEATH (Ethan, 2026-08-30), so
    // the sandbox has to say which the test player is. These tests are about WHAT she
    // says at each tier, not about who may hear her, so they run as a champion.
    paths: { pathOf: () => 'wall' },
    tide: { state: () => tideState },
    voice: {
      speakChunks: (p, god, chunks, tag, o) => {
        sent.push({ god, chunks: chunks.slice(), o: o || {} })
        return true
      },
      setColour: () => { }, setStyle: () => { }, line: () => null,
    },
  }
  const ctx = {
    VELDORA, Math,
    console: { info() { }, warn() { }, error() { } },
    Text: { of: s => s },
    ServerEvents: { loaded: () => { }, commandRegistry: () => { } },
    PlayerEvents: { loggedOut: () => { } },
    Commands: null,
  }
  vm.createContext(ctx)
  for (const f of ['caebrim_lines.js', 'caebrim.js']) {
    vm.runInContext(fs.readFileSync(path.join(SS, f), 'utf8'), ctx, { filename: f })
  }
  return { ctx, sent, player, server }
}

const CASES = []
const t = (n, f) => CASES.push([n, f])
function assert(c, m) { if (!c) throw new Error(m || 'failed') }

// 🔴 THE CROSSHAIR BAND IS voice.js's NUMBER, AND THIS FILE CARRIED ITS OWN COPY.
// The announcement case asserted `Math.abs(y) >= 34` - 34 being `voice.CROSSHAIR_BAND`,
// a value the engine owns and has already moved once. A copy here goes stale silently:
// widen the band in voice.js and this keeps clearing the OLD one, reports green, and her
// one un-missable line sits on the crosshair - which is the exact play report that put
// the band there.
//
// ⚠️ voice.js is not loaded in this sandbox (she only needs speakChunks), so the value is
// read from its source. 🚨 A MISSED READ IS A FAILURE, NOT A DEFAULT - falling back to a
// literal would quietly restore the stale copy this removes.
const CROSSHAIR_BAND = (() => {
  const m = /var CROSSHAIR_BAND = (\d+)/.exec(
    fs.readFileSync(path.join(SS, 'voice.js'), 'utf8'))
  if (!m) {
    console.error('FAIL: voice.js no longer declares CROSSHAIR_BAND where this can read ' +
      'it - the crosshair assertion below would be measuring a number nobody owns')
    process.exit(1)
  }
  return +m[1]
})()

t('her tier is the TIDE, not a relationship', () => {
  assert(build(null).ctx.VELDORA.caebrim.tierOf({ uuid: 'p1' }) === null,
    'no tide must be null, not "low" - she has no register for a quiet world')
  assert(build({ active: true, waves: 0 }).ctx.VELDORA.caebrim.tierOf({}) === 'low')
  assert(build({ active: true, waves: 5 }).ctx.VELDORA.caebrim.tierOf({}) === 'med')
  assert(build({ active: true, waves: 12 }).ctx.VELDORA.caebrim.tierOf({}) === 'high')
})

t('an inactive tide is not a tide', () => {
  assert(build({ active: false, waves: 9 }).ctx.VELDORA.caebrim.tierOf({}) === null,
    'waves on a finished run must not still speak')
})

t('she says NOTHING when there is no tide', () => {
  const e = build(null)
  assert(e.ctx.VELDORA.caebrim.whisper(e.player) === false, 'must refuse')
  assert(e.sent.length === 0, 'and must send nothing, got ' + e.sent.length)
})

t('a whisper arrives, scattered, in her own pool', () => {
  const e = build({ active: true, waves: 0 })
  assert(e.ctx.VELDORA.caebrim.whisper(e.player) === true, 'should speak in a tide')
  assert(e.sent.length === 1, 'one whisper, got ' + e.sent.length)
  const s = e.sent[0]
  assert(s.god === 'caebrim', 'must use her shared pool, got ' + s.god)
  assert(s.o.priority === 'WHISPER', 'a whisper must not outrank a warning')
  assert(s.o.scatter, 'she is always in random areas - her document says so')
  assert(s.o.font === 'veldora:wall', "she shares Wall's font")
  assert(s.o.color === '#AA0000', 'always red')
})

t('⭐ the tide announcement is CENTRED and does not scatter', () => {
  // His header: "Tide announcements are in the middle."
  const e = build({ active: true, waves: 3 })
  assert(e.ctx.VELDORA.caebrim.tide(e.player, 'start') === true, 'should announce')
  const s = e.sent[0]
  assert(!s.o.scatter, 'the one thing she says that must not be missed must not scatter')
  // ⚠️ CENTRED HORIZONTALLY, AND CLEAR OF THE CROSSHAIR. "In the middle" was the brief
  // and x:0 is still exactly that; y was lifted on 2026-08-30 because text sitting ON the
  // crosshair is unreadable (Ethan, from play) - and this is the one line of hers that
  // must not be missed, so it is the last one that should be sitting there.
  assert(s.o.x === 0, 'must be horizontally centred, got x=' + s.o.x)
  assert(Math.abs(s.o.y) >= CROSSHAIR_BAND,
    'must clear voice.js\'s crosshair band (' + CROSSHAIR_BAND + '), got y=' + s.o.y)
  assert(s.o.priority === 'ANNOUNCE',
    'a warning behind ambience arrives after the thing it warned about')
})

t('the three tide phases are distinct pools', () => {
  const seen = {}
  for (const ph of ['start', 'during', 'end']) {
    const e = build({ active: true, waves: 3 })
    // drain the pool a few times so a shared pool would collide
    for (let i = 0; i < 12; i++) e.ctx.VELDORA.caebrim.tide(e.player, ph)
    seen[ph] = new Set(e.sent.map(s => s.chunks.join('|')))
  }
  const overlap = [...seen.start].filter(x => seen.end.has(x))
  assert(overlap.length === 0, 'start and end must not share lines: ' + overlap.join(' / '))
})

t('every whisper tier has content, and they differ', () => {
  const all = build(null).ctx.VELDORA.caebrimLines.all()
  for (const k of ['low', 'med', 'high']) {
    assert(all.whispers[k].length > 0, k + ' whispers are empty')
  }
  const lo = JSON.stringify(all.whispers.low)
  const hi = JSON.stringify(all.whispers.high)
  assert(lo !== hi, 'low and high must not be the same pool')
})

t('she has scenes with more than one god, each with two voices', () => {
  const e = build(null)
  const gods = e.ctx.VELDORA.caebrim.gods()
  assert(gods.length >= 2, 'expected scenes with several gods, got ' + gods.join(','))
  for (const sc of e.ctx.VELDORA.caebrimLines.scenes()) {
    const voices = new Set(sc.turns.map(t2 => t2.god))
    assert(voices.size === 2, 'a scene with ' + sc.god + ' had voices: ' + [...voices].join(','))
    assert(voices.has('caebrim'), 'she must be in her own scene with ' + sc.god)
  }
})

let failed = 0
for (const [n, f] of CASES) {
  try { f(); console.log('  ok    ' + n) } catch (e) {
    failed++; console.log('  FAIL  ' + n); console.log('        ' + e.message)
  }
}
// 🚨 AN EMPTY CASE LIST IS A FAILURE, NOT A CLEAN RUN. `0/0` and `9/9` both exited 0
// and both printed a summary run_all.js cannot parse - its regex wants the word "passed" -
// so this file showed a BLANK count next to a green tick either way. A case list that
// stopped being populated (a refactor, a bad merge, an early `return`) was therefore
// indistinguishable, in the sweep, from a file passing everything it has.
//
// ⭐ Two fixes, because either alone still hides it: say "passed" so the sweep can READ
// the count, and refuse to report success on a count of zero.
if (!CASES.length) {
  console.error('FAIL: no cases were registered - this file asserted NOTHING. ' +
    'An empty run is a failure to test, never a pass.')
  process.exit(1)
}
console.log((CASES.length - failed) + '/' + CASES.length + ' passed')
process.exit(failed ? 1 : 0)
