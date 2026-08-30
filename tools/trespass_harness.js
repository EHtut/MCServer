// trespass_harness.js — prove the lines come from nobody, and keep coming from nobody.
//
//     node tools/trespass_harness.js
//
// ⭐ WHY THIS EXISTS. The whole value of this layer is a NEGATIVE: no speaker, no
// patron colour, no path awareness. Every one of those is invisible in play - a line
// that quietly acquired Blade's red would look fine to anyone who was not already
// looking for it, and the effect would just... deflate, with nothing to report.
//
// 🚨 SO THE ASSERTIONS THAT MATTER ARE THE ONES THAT PROVE AN ABSENCE.
'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

let pass = 0, fail = 0
const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', X = '\x1b[0m'
function grp(t) { console.log('\n' + B + t + X) }
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}

// ⚠️ Strip comments before ANY source assertion. This file's own header explains that
// the lines do not vary by PATH and that they carry no god COLOUR - so a naive
// indexOf('path') or indexOf('COLOUR') matches the prose that promises the opposite.
// That exact weak-assertion error has been made twice in this repo already.
function code(file) {
  const raw = fs.readFileSync(path.join(SS, file), 'utf8')
  let out = '', i = 0
  while (i < raw.length) {
    const c = raw[i], n = raw[i + 1]
    if (c === '/' && n === '/') { const j = raw.indexOf('\n', i); i = j < 0 ? raw.length : j }
    else if (c === '/' && n === '*') { const j = raw.indexOf('*/', i + 2); i = j < 0 ? raw.length : j + 2 }
    else { out += c; i++ }
  }
  return out
}

// ── a world you drive by hand ─────────────────────────────────────────────────
let DIM = 'minecraft:overworld'
let DIM_MODE = 'property'          // 'property' | 'method' | 'broken'
const sent = []
const pending = []

const server = {
  players: [],
  runCommand: (c) => { sent.push(c); return 1 },
  runCommandSilent: (c) => { sent.push(c) },
  scheduleInTicks: (t, fn) => { pending.push(fn) },
}
function drain(max) {
  let n = 0
  while (pending.length && n < max) { pending.shift()(); n++ }
  return n
}

function mkPlayer(name) {
  const lvl = {}
  if (DIM_MODE === 'property') lvl.dimension = DIM
  else if (DIM_MODE === 'method') lvl.dimension = () => DIM
  return {
    username: name,
    uuid: '11111111-2222-3333-4444-555555555555',
    level: lvl,
    tell: () => { },
  }
}

global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { } }
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {}

const ri = console.info, rw = console.warn
let warns = []
console.warn = (m) => { warns.push(String(m)) }
console.info = () => { }
try { (0, eval)(fs.readFileSync(path.join(SS, 'trespass.js'), 'utf8')) }
catch (e) { console.info = ri; console.warn = rw; console.error('FAIL: trespass.js threw on load :: ' + e); process.exit(1) }
console.info = ri; console.warn = rw
const T = global.VELDORA.trespass
if (!T) { console.error('FAIL: trespass.js published nothing'); process.exit(1) }

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 THE ABSENCE — no speaker, no colour, no path')
{
  const src = code('trespass.js')

  // The single most important assertion in this file. voice.js colours by god; the
  // moment these route through it, the Nether becomes a place a god can reach you.
  ok('🚨 it NEVER calls voice.js', src.indexOf('VELDORA.voice') === -1, true)
  ok('🚨 it never calls say() or sayAbout()',
    src.indexOf('say(') === -1 && src.indexOf('sayAbout(') === -1, true)

  // No god's colour code, and no legacy § formatting inside a LINE. The §8 in the
  // command feedback is operator chrome, not a line, so assert on the pools directly.
  const anyGodColour = ['§4', '§5', '§6', '§2', '§b', '§e'].some(c =>
    T.lines('nether').concat(T.lines('end')).some(l => l.indexOf(c) !== -1))
  ok('🚨 no line carries a god colour code', anyGodColour, false)
  ok('the bar name is explicitly white', T._nameJson('x').indexOf('"color":"white"') !== -1, true)

  // ⚠️ Comments stripped, or the header's own promise about paths matches.
  ok('🚨 it never consults a path', src.indexOf('path') === -1, true)
  ok('...nor trust, nor a patron', src.indexOf('trust') === -1 && src.indexOf('patron') === -1, true)
}

grp('⭐ THE LINES — Ethan\'s, touched up, not rewritten')
{
  const N = T.lines('nether'), E = T.lines('end')
  ok('four Nether lines', N.length, 4)
  ok('four End lines', E.length, 4)

  // The two he wrote that must survive verbatim: the flattest line in the set, and
  // the one that asks a question.
  ok('⭐ "You are afraid." is untouched', N.indexOf('You are afraid.') !== -1, true)
  ok('⭐ the End still asks a question', E.indexOf('What do you seek here?') !== -1, true)
  ok('⭐ "Run." is untouched', E.indexOf('Run.') !== -1, true)

  // The comma splices became beats - his images, his order, regularised punctuation.
  ok('the scream line keeps every element',
    N.some(l => l.indexOf('girl scream') !== -1 && l.indexOf('murder') !== -1 &&
      l.indexOf('silence') !== -1), true)
  ok('...and is no longer a comma splice',
    N.some(l => l.indexOf('scream, fighting, a murder,') !== -1), false)
  ok('the bestiary line still points at what you have fought',
    E.some(l => l.indexOf('fought it many times') !== -1), true)

  ok('every line ends in real punctuation',
    N.concat(E).every(l => '.?!'.indexOf(l[l.length - 1]) !== -1), true)
  ok('no line names a god',
    N.concat(E).every(l => !/blade|wall|salvage|forge|art|crown/i.test(l)), true)
}

grp('🔑 THE DIMENSION READ — and the failure that must not look like silence')
{
  DIM_MODE = 'property'; DIM = 'minecraft:overworld'
  ok('the overworld is neither', T.dimOf(mkPlayer('A')), null)
  DIM = 'minecraft:the_nether'; ok('the Nether reads', T.dimOf(mkPlayer('A')), 'nether')
  DIM = 'minecraft:the_end'; ok('the End reads', T.dimOf(mkPlayer('A')), 'end')

  // ⚠️ P6a: server.overworld() is a METHOD, and a property read there returns
  // undefined rather than throwing. The same shape may well be hiding here, so the
  // reader must survive dimension being a function.
  DIM_MODE = 'method'; DIM = 'minecraft:the_nether'
  ok('🚨 it still reads when dimension is a METHOD, not a property',
    T.dimOf(mkPlayer('A')), 'nether')

  // A ResourceKey wrapper stringifies with the id inside it - substring, not equality.
  DIM_MODE = 'property'; DIM = 'ResourceKey[minecraft:dimension / minecraft:the_end]'
  ok('a ResourceKey wrapper still resolves', T.dimOf(mkPlayer('A')), 'end')

  // A modded dimension is not the Nether just because it is hot.
  DIM = 'somemod:scorched_wastes'; ok('a modded dimension is neither', T.dimOf(mkPlayer('A')), null)

  // 🚨 "I failed" and "I found nothing" must NOT share a return value.
  DIM_MODE = 'broken'
  warns = []
  const before = warns.length
  console.warn = (m) => { warns.push(String(m)) }
  const r = T.dimOf({ username: 'X', uuid: 'u', level: {} })
  console.warn = rw
  ok('an unreadable dimension returns null', r, null)
  ok('🚨 ...but SHOUTS, so it cannot be mistaken for "nobody is in the Nether"',
    warns.length > before && warns.join(' ').indexOf('INERT') !== -1, true)
}

grp('⚠️ THE BAR — what actually reaches the screen')
{
  DIM_MODE = 'property'; DIM = 'minecraft:the_nether'
  const p = mkPlayer('Ethan')
  sent.length = 0; pending.length = 0
  const fired = T.fire(server, p, 'nether')
  ok('it reports success honestly', fired, true)

  const all = sent.join('\n')
  ok('a bar is created', all.indexOf('bossbar add veldora:trespass_') !== -1, true)
  ok('⭐ the bar is WHITE - the unowned colour', all.indexOf('color white') !== -1, true)
  ok('it is shown to that player only', all.indexOf('players Ethan') !== -1, true)
  ok('a real line went into the name',
    T.lines('nether').some(l => all.indexOf(l) !== -1), true)

  // The tremor must run and then STOP, leaving nothing on screen.
  const ran = drain(200)
  ok('the tremor scheduled and drained', ran > 5, true)
  ok('🚨 the bar is REMOVED at the end - no line sticks',
    sent[sent.length - 1].indexOf('bossbar remove') === 0, true)
  ok('...and nothing is left pending', pending.length, 0)
}

grp('⭐ THE TREMOR IS COSMETIC — it may move text, never change it')
{
  for (let i = 0; i < 200; i++) {
    const j = T._jitter('You are afraid.')
    if (j.trim() !== 'You are afraid.') {
      ok('🚨 jitter altered the TEXT, not just its position', j, 'padding only')
      break
    }
  }
  ok('200 jitters never changed a character', true, true)
  ok('jitter only ever pads with spaces',
    T._jitter('x').replace(/ /g, ''), 'x')
}

grp('⚠️ ESCAPING — a quote in a line must not break the JSON')
{
  ok('a double quote is escaped',
    T._nameJson('say "no"').indexOf('\\"no\\"') !== -1, true)
  ok('a backslash is escaped',
    T._nameJson('a\\b').indexOf('a\\\\b') !== -1, true)
  ok('the result is parseable JSON', (() => {
    try { JSON.parse(T._nameJson('a "b" c\\d')); return true } catch (e) { return false }
  })(), true)
}

grp('🔑 NEVER THE SAME LINE TWICE RUNNING — a four-line pool needs it')
{
  let repeats = 0
  let last = -1
  for (let i = 0; i < 500; i++) {
    const n = T._pick(['a', 'b', 'c', 'd'], last)
    if (n === last) repeats++
    last = n
  }
  ok('🚨 500 picks, zero immediate repeats', repeats, 0)
  ok('a one-line pool does not loop forever', T._pick(['only'], 0), 0)
}

grp('⚠️ THE FLOOR — it must not fire every sweep')
{
  DIM = 'minecraft:the_nether'
  const p = mkPlayer('Floor')
  sent.length = 0; pending.length = 0
  // Force the roll to always succeed, then prove the FLOOR still gates it.
  const realRandom = Math.random
  Math.random = () => 0
  T._consider(server, p)
  const firstCount = sent.filter(c => c.indexOf('bossbar add') === 0).length
  for (let i = 0; i < 20; i++) T._consider(server, p)
  const totalCount = sent.filter(c => c.indexOf('bossbar add') === 0).length
  Math.random = realRandom
  ok('the first roll fires', firstCount, 1)
  ok('🚨 twenty more sweeps inside the floor fire NOTHING', totalCount, 1)
}

grp('🔑 THE DEEP SPEAKER IS KEPT OUT — and fails open')
{
  const ds = code('deep_speaker.js')
  ok('speakerActive consults the dimension',
    ds.indexOf('if (wrongDimension(p)) return false') !== -1, true)
  ok('it reuses trespass.dimOf rather than a second reader',
    ds.indexOf('VELDORA.trespass.dimOf') !== -1, true)
  // ⚠️ Opposite of the confession gate: silence everywhere is the bug nobody traces.
  ok('🚨 it FAILS OPEN when trespass is missing',
    ds.indexOf("typeof VELDORA.trespass.dimOf !== 'function') return false") !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
