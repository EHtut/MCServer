// finale_check.js — does a closing card ACTUALLY reach the renderer?
//
//     node tools/finale_check.js
//
// ── 🔴 WHY THIS FILE EXISTS ─────────────────────────────────────────────────
// The Opening's title card — "ARKHDOTTIR: NEW BLOOD / A story written by Rehykt", the
// beat the whole 96-second cutscene builds to — NEVER RENDERED ONCE. It shipped
// 2026-08-30 under a commit message saying it landed, and sat dead until 2026-09-05.
//
// ritual.js gated its entire finale block on `spec.finale.text`. A popup card carries
// `title`/`subtitle` and has no `text` at all, so the block was skipped and
// `VELDORA.im.popup` was never called. One missing key, no error, no log line.
//
// ── ⚠️ AND 36/36 HARNESSES WERE GREEN OVER IT ───────────────────────────────
// opening_harness.js asserts the finale card exists, uses the popup route, and carries
// the title and the byline. All four pass. They assert on the spec the Opening PASSED,
// through a ritual stub that returns true — so they prove the Opening ASKED for a card.
// Nothing anywhere asked whether one appeared.
//
// 🔑 THE LESSON, AND THE REASON THIS IS A SEPARATE FILE: check a gate against what the
// CALLEE requires, not against what the caller sent. A stub cannot fail a contract it
// does not implement, so a test built on one can only ever measure the stub.
//
// ⇒ So this check RUNS ritual.js for real — the actual file, in a vm, with the real
//   scheduler drained — and asks the only question that mattered: did the card come out?
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

// A sandbox that runs the REAL ritual.js and records what reached the renderer.
// ⚠️ Everything ritual.js touches on a player or a server is wrapped in try/catch in the
// source, so a thin double is enough — but the SCHEDULER is not optional: the finale is
// scheduled, never immediate, so a harness that does not drain it sees nothing either way.
function build() {
  const shown = [], popped = [], effects = [], commands = []
  const pending = []                       // [ticks, fn]
  const server = {
    players: [],
    runCommand: (c) => { commands.push(c); return 1 },
    runCommandSilent: (c) => { commands.push(c) },
    scheduleInTicks: (t, fn) => { pending.push([t, fn]) },
    getPlayer: () => player,
  }
  const player = {
    username: 'T', uuid: 'p1', server,
    tell: () => { },
    potionEffects: { add: (id, ticks) => effects.push({ id, ticks }) },
    persistentData: {
      _d: {},
      putBoolean(k, v) { this._d[k] = v },
      getBoolean(k) { return !!this._d[k] },
    },
    level: { getEntitiesWithin: () => [] },
    boundingBox: { inflate: () => ({}) },
  }
  const ctx = {
    VELDORA: {
      im: {
        show: (p, text, o) => { shown.push({ text, o }); return true },
        popup: (p, title, subtitle, secs) => { popped.push({ title, subtitle, secs }); return true },
      },
    },
    Text: { of: (s) => s },
    Math, JSON, String, Number, Object, Array,
    console: { info() { }, warn() { }, error() { } },
    ServerEvents: { loaded() { }, commandRegistry() { }, tick() { } },
    PlayerEvents: { loggedIn() { }, loggedOut() { }, tick() { } },
    EntityEvents: { death() { } },
  }
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(path.join(SS, 'ritual.js'), 'utf8'), ctx)

  // Fire every callback whose tick has come, in schedule order.
  function drain() {
    const due = pending.splice(0, pending.length).sort((a, b) => a[0] - b[0])
    due.forEach(([, fn]) => { try { fn() } catch (e) { } })
  }
  return { ctx, R: ctx.VELDORA.ritual, player, shown, popped, effects, pending, drain }
}

const LINES = ['You were a traveler.', 'A life of adventure before you.']

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 A POPUP FINALE MUST REACH THE RENDERER — the bug that shipped')
{
  const e = build()
  // ⭐ EXACTLY the shape opening.js sends. No `text` key, because a popup does not take
  // one — that absence is what silently killed the card for six days.
  const began = e.R.begin(e.player, {
    lines: LINES,
    perChar: true,
    noChat: true,
    finale: {
      popup: true,
      title: 'ARKHDOTTIR: NEW BLOOD',
      subtitle: 'A story written by Rehykt',
      seconds: 9,
      after: 40,
    },
  })
  ok('the scene starts', began, true)
  e.drain()
  ok('⭐ the card actually came out', e.popped.length, 1)
  ok('...carrying the title', (e.popped[0] || {}).title, 'ARKHDOTTIR: NEW BLOOD')
  ok('...and the byline beneath it', (e.popped[0] || {}).subtitle, 'A story written by Rehykt')
  ok('...for the seconds it asked for', (e.popped[0] || {}).secs, 9)
  // ⛔ And it must NOT also go out as an overlay - that would double the card.
  const asOverlay = e.shown.filter(s => String(s.text).indexOf('ARKHDOTTIR') !== -1)
  ok('the title did not ALSO render as prose', asOverlay.length, 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE TEXT ROUTE STILL WORKS — the fix widened the gate, it did not move it')
{
  const e = build()
  e.R.begin(e.player, {
    lines: LINES,
    finale: { text: 'THE END', seconds: 6 },
  })
  e.drain()
  ok('a text finale renders as a centred overlay',
    e.shown.filter(s => s.text === 'THE END').length, 1)
  ok('...and does NOT take the popup route', e.popped.length, 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🔑 NEGATIVE CONTROL — without this the check would pass on a gate that fires always')
{
  // ⚠️ THIS IS THE ASSERTION THAT GIVES THE ONES ABOVE THEIR MEANING. A gate rewritten to
  // `if (spec.finale)` would satisfy every test above and quietly fire a blank card for
  // any caller who passed an empty finale object.
  const e = build()
  e.R.begin(e.player, { lines: LINES, finale: { seconds: 5 } })
  e.drain()
  ok('a finale with neither text nor popup renders NOTHING', e.popped.length, 0)
  ok('...and does not fall through to an overlay either',
    e.shown.filter(s => !LINES.includes(s.text)).length, 0)

  const none = build()
  none.R.begin(none.player, { lines: LINES })
  none.drain()
  ok('a scene with no finale at all is unaffected', none.popped.length, 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⚠️ THE DARK MUST OUTLAST THE CARD')
{
  // 🔴 A SECOND BUG, REACHABLE ONLY ONCE THE FIRST WAS FIXED. `whole` sizes the blindness
  // and the detarget sweep; the finale extends `speakFor` AFTER the scene ends. While
  // `whole` was computed above the finale block, the world came back ~9 seconds early -
  // mid-card, with mobs live again on a player who is still rooted and blind.
  //
  // ⭐ Assert the RELATION, not a tick count. A number here would be a copy of a constant
  // the code owns, and five assertions broke in one session from exactly that.
  const withCard = build()
  withCard.R.begin(withCard.player, {
    lines: LINES, perChar: true,
    finale: { popup: true, title: 'A', subtitle: 'B', seconds: 9, after: 40 },
  })
  const cardEnd = Math.max.apply(null, withCard.pending.map(x => x[0]))
  const cardBlind = Math.max.apply(null, withCard.effects.map(x => x.ticks))
  ok('blindness outlasts every scheduled beat, card included', cardBlind >= cardEnd, true)

  // And the same scene WITHOUT a finale must be strictly shorter - proving the window
  // actually grew rather than having been generously padded all along.
  const bare = build()
  bare.R.begin(bare.player, { lines: LINES, perChar: true })
  const bareBlind = Math.max.apply(null, bare.effects.map(x => x.ticks))
  ok('...and a finale genuinely lengthens that window', cardBlind > bareBlind, true)
}

console.log('\n' + (fail ? R + fail + ' FAILED, ' + X : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
