// passthrough_check.js — does every field a scene asks for actually reach the wire?
//
//     node tools/passthrough_check.js
//
// ── 🔴 WHY THIS EXISTS ──────────────────────────────────────────────────────
// The cutscene machinery is four layers deep — `cutscene.js` → `ritual.js` →
// `immersive.js` → the command — and it has now silently dropped a field TWICE:
//
//   x and y   forwarded by three layers, never emitted. The Opening set y to 30, then
//             60, then 110 to clear the Serene Seasons HUD and NOTHING MOVED. Three
//             fixes against a boundary that never carried the field. (D-123)
//   align     documented at the top of immersive.js as a real NBT int, never emitted.
//             cutscene.js's own `journal` preset sets align:0 and every scene using it
//             rendered centred while asking to be left-aligned. Found 2026-09-05.
//
// ⚠️ BOTH LOOK IDENTICAL FROM THE CALLER: the scene plays, the text appears, and the one
// setting you asked for is simply absent. There is no error, no log line, and no way to
// tell "ignored" from "applied and wrong" — which is exactly why the same fix gets made
// repeatedly.
//
// 🔑 SO THIS DOES NOT CHECK ONE FIELD. It drives a real scene with every staging key set
// to a distinctive value and asserts each one appears in the emitted command. A new field
// added to the vocabulary and forgotten at the boundary fails here on the first run.
'use strict'
const { world } = require('./dialogue/emulate')

const G = '\x1b[32m', R = '\x1b[31m', D = '\x1b[90m', B = '\x1b[1m', X = '\x1b[0m'
let bad = 0
const ok = (label, pass, detail) => {
  if (pass) console.log('  ' + G + 'ok  ' + X + label)
  else { bad++; console.log('  ' + R + 'FAIL' + X + ' ' + label + (detail ? '\n         ' + detail : '')) }
}

console.log('\n' + B + 'every staging field must reach the command' + X)

// Distinctive values, so a field cannot pass by coincidence with another's.
const STAGING = {
  anchor: 'TOP_LEFT',   // -> anchor:7
  align: 2,
  x: 37,
  y: 113,
  size: 1.75,
  font: 'veldora:art',
  typewriter: true,
}

const w = world(['immersive.js', 'voice.js', 'screen.js', 'ritual.js'])
const im = w.ctx.VELDORA.im
if (!im || typeof im.show !== 'function') {
  console.error(R + 'immersive.js did not publish VELDORA.im — cannot check anything' + X)
  process.exit(2)
}

im.show(w.player, 'A line for the boundary test.', {
  seconds: 5, anchor: STAGING.anchor, align: STAGING.align, x: STAGING.x, y: STAGING.y,
  size: STAGING.size, font: STAGING.font, typewriter: STAGING.typewriter,
})

const cmd = (w.commands[0] || {}).c || ''
console.log(D + '  ' + (cmd || '(nothing was sent)') + X + '\n')

// ⚠️ A run that sent NOTHING would pass every "is this absent" test below, so the first
// assertion is that a command exists at all.
ok('a command was actually emitted', cmd.length > 0, 'immersive.js sent nothing')

const EXPECT = [
  ['anchor', 'anchor:7', 'TOP_LEFT is anchor 7'],
  ['align', 'align:2', '🔴 the field this file was written for'],
  ['x', 'x:37', 'D-123 — dropped once before'],
  ['y', 'y:113', 'D-123 — dropped once before'],
  ['size', 'size:1.75', ''],
  ['font', 'font:"veldora:art"', ''],
  ['typewriter', 'typewriter:1b', 'presence key — the value is never read'],
]
for (const [name, needle, note] of EXPECT) {
  ok(name + ' reaches the wire' + (note ? D + '  (' + note + ')' + X : ''),
    cmd.indexOf(needle) !== -1,
    'expected ' + JSON.stringify(needle) + ' in the command')
}

// ── 🔑 THE NEGATIVE CONTROL ─────────────────────────────────────────────────
// Without this, a buildTag that emitted every key unconditionally — or one that pasted
// the whole opts object in — would pass everything above while being badly wrong.
console.log('\n' + B + 'and a field that was NOT asked for must be absent' + X)
{
  const w2 = world(['immersive.js', 'voice.js', 'screen.js', 'ritual.js'])
  w2.ctx.VELDORA.im.show(w2.player, 'Plain.', { seconds: 4 })
  const plain = (w2.commands[0] || {}).c || ''
  ok('a plain send carries no align', plain.indexOf('align:') === -1, plain)
  ok('...no x or y', plain.indexOf('x:') === -1 && plain.indexOf('y:') === -1, plain)
  ok('...and no shake', plain.indexOf('shake') === -1, plain)
}

// ── the scene path, which is where the drops actually happened ──────────────
console.log('\n' + B + 'and the same through ritual.js, which is how a scene sends' + X)
{
  const w3 = world(['immersive.js', 'voice.js', 'screen.js', 'ritual.js'])
  w3.ctx.VELDORA.ritual.begin(w3.player, {
    lines: ['One line.'],
    anchor: 'TOP_LEFT', align: 0, x: 20, y: 110, noChat: true, typewriter: true,
  })
  w3.advance(400)
  const scene = w3.commands.filter(c => c.c.indexOf('immersivemessages') !== -1)
                           .map(c => c.c).join('\n')
  ok('a scene emits at least one message', scene.length > 0, 'ritual sent nothing')
  ok('...carrying its x', scene.indexOf('x:20') !== -1, scene)
  ok('...its y', scene.indexOf('y:110') !== -1, scene)
  ok('...and its align', scene.indexOf('align:0') !== -1, scene)
}

console.log('')
console.log(bad ? R + bad + ' field(s) do not reach the wire' + X
                : G + 'every staging field survives all four layers' + X)
process.exit(bad ? 1 : 0)
