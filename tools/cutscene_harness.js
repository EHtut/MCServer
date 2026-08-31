// cutscene_harness.js — the general scene tool, tested at ITS OWN boundary.
//
// ⚠️ NOT THROUGH ritual.js. The point of a tool is that a stranger can use it without
// reading the thing underneath, so it is exercised the way they would: build a scene
// object, call play(), assert what reached the layer below.
//
// 🔑 THE ASSERTION THAT MATTERS MOST is that an unknown key is REFUSED. Yesterday
// `ritualOverlay` silently dropped x and y while forwarding four other fields, and three
// separate fixes to move the Opening off the Serene Seasons HUD were discarded at that
// boundary with no error anywhere. A pass-through that quietly omits a field is worse than
// one that errors - the caller cannot tell "ignored" from "applied and wrong".
'use strict'
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')
const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', X = '\x1b[0m'

let pass = 0, fail = 0
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}
function grp(t) { console.log('\n' + B + t + X) }

// A sandbox whose ritual.begin RECORDS its spec instead of playing anything, so we can see
// exactly what the tool handed down.
function build() {
  const seen = []
  const warned = []
  const ctx = {
    VELDORA: {
      ritual: {
        begin: (p, spec) => { seen.push(spec); return true },
        release: () => true,
        active: () => false,
      },
    },
    Math,
    console: { info() { }, warn: (m) => warned.push(String(m)), error: (m) => warned.push(String(m)) },
    ServerEvents: { loaded() { } },
  }
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(path.join(SS, 'cutscene.js'), 'utf8'), ctx)
  return { ctx, seen, warned, C: ctx.VELDORA.cutscene, player: { uuid: 'p1', username: 'T' } }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('* IT PUBLISHES A TOOL, NOT A RITUAL')
{
  const e = build()
  ok('the tool exists', typeof e.C.play, 'function')
  ok('...and can end a scene', typeof e.C.end, 'function')
  ok('...and can be asked whether one is running', typeof e.C.active, 'function')
  // ⭐ A stranger must be able to ask what is deliverable BEFORE writing a scene.
  ok('it advertises what it can deliver', e.C.stagingKeys.length > 4, true)
  ok('...including position, the field that was being dropped',
    e.C.stagingKeys.indexOf('x') !== -1 && e.C.stagingKeys.indexOf('y') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 AN UNDELIVERABLE KEY IS REFUSED, NOT SILENTLY DROPPED')
{
  const e = build()
  const r = e.C.play(e.player, {
    lines: ['a line'],
    staging: { anchor: 'TOP_LEFT', wobble: true },   // wobble is not a thing
  })
  ok('the scene is REFUSED', r, false)
  ok('...nothing was passed down', e.seen.length, 0)
  ok('...and it names the offending key', /wobble/.test(e.warned.join(' ')), true)

  // 🔑 THE NEGATIVE CONTROL. Without this, a tool that refused EVERYTHING would pass the
  // three assertions above and look correct.
  const e2 = build()
  ok('...while a valid scene is accepted',
    e2.C.play(e2.player, { lines: ['a line'], staging: { anchor: 'TOP_LEFT' } }), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ EVERY ADVERTISED KEY ACTUALLY ARRIVES')
{
  // ⚠️ This is the regression test for the exact bug: the tool advertising a key it does
  // not forward. Set every staging key to a distinctive value and read the spec back.
  const e = build()
  e.C.play(e.player, {
    lines: ['a line'],
    staging: { anchor: 'TOP_LEFT', align: 0, x: 21, y: 111, colour: '§6', typewriter: false, multiline: true, chat: false },
    pacing: { gap: 44, perChar: true, holdAfterChoice: 7 },
  })
  const s = e.seen[0] || {}
  ok('anchor arrives', s.anchor, 'TOP_LEFT')
  ok('align arrives, and 0 is not treated as absent', s.align, 0)
  ok('🔴 x arrives', s.x, 21)
  ok('🔴 y arrives', s.y, 111)
  ok('colour arrives', s.colour, '§6')
  ok('typewriter:false arrives as false, not undefined', s.typewriter, false)
  ok('multiline arrives', s.multiline, true)
  ok('chat:false becomes noChat', s.noChat, true)
  ok('gap arrives', s.gap, 44)
  ok('perChar arrives', s.perChar, true)
  ok('holdAfterChoice arrives', s.holdAfterChoice, 7)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ PRESETS - a stranger should not have to know this pack\'s numbers')
{
  const e = build()
  e.C.play(e.player, { lines: ['x'], preset: 'journal' })
  const s = e.seen[0] || {}
  ok('the journal preset hangs from the top left', s.anchor, 'TOP_LEFT')
  // ⚠️ 110 clears the Serene Seasons readout on THIS client. The number is local; the
  // preset exists so a consumer inherits a working value rather than guessing.
  ok('...clear of the HUD', s.y >= 100, true)
  ok('...and is typed', s.typewriter, undefined)

  const e2 = build()
  e2.C.play(e2.player, { lines: ['x'], preset: 'journal', staging: { y: 250 } })
  ok('🔑 caller values WIN over the preset', (e2.seen[0] || {}).y, 250)

  const e3 = build()
  e3.C.play(e3.player, { lines: ['x'], preset: 'monologue' })
  ok('a monologue centres, because the world is already gone',
    (e3.seen[0] || {}).anchor, 'CENTER_CENTER')
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⛔ IT REFUSES WHAT IT CANNOT PLAY')
{
  const e = build()
  ok('a scene with no lines', e.C.play(e.player, { lines: [] }), false)
  ok('no scene at all', e.C.play(e.player, null), false)
  ok('no player', e.C.play(null, { lines: ['x'] }), false)

  // 🚨 And it must fail LOUDLY rather than pretending, when the layer below is missing.
  const bare = build()
  delete bare.ctx.VELDORA.ritual
  ok('no ritual.js underneath', bare.C.play(bare.player, { lines: ['x'] }), false)
  ok('...and it says so', /not loaded/.test(bare.warned.join(' ')), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE FINALE CARD - the measured two-line route')
{
  // ⚠️ popup is the ONLY command route to a second line. Escaped newlines render
  // literally, a real newline renders as an LF glyph AND dropped a player's connection,
  // maxWidth is ignored, and subtext is builder-only. All measured in play 2026-08-30.
  const e = build()
  e.C.play(e.player, {
    lines: ['x'],
    finale: { popup: true, title: 'ACT ONE', subtitle: 'a new day', seconds: 9 },
  })
  const f = (e.seen[0] || {}).finale || {}
  ok('the card is carried through', f.title, 'ACT ONE')
  ok('...with its subtitle', f.subtitle, 'a new day')
  ok('...by the popup route', f.popup, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⚠️ THE GEOMETRY IS DECLARED, NOT BURIED')
{
  const e = build()
  ok('the tool states its screen assumptions', typeof e.C.geometry, 'object')
  ok('...and admits they are local',
    /local|override/.test(String(e.C.geometry.note || '')), true)
  // 🔴 docs/80 named this the highest-risk coupling in the codebase: keep-out bands encode
  // THIS client's HUD, and a hardcoded band is wrong on someone else's screen with no way
  // for them to tell why.
  ok('...naming the HUD it dodges', e.C.geometry.hudTopLeft >= 100, true)
  ok('...and the chat floor that eats text', e.C.geometry.chatFloor > 0, true)
}

console.log('\n' + (fail ? R + fail + ' FAILED, ' + X : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
