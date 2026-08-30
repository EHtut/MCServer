// opening_harness.js — it fires once, it remembers which life you had, and it is silent.
//
//     node tools/opening_harness.js
//
// ⚠️ Not the words - those are Ethan's and opening_import.py reports on them. This is the
// three things that would be WRONG WITHOUT ANYONE NOTICING:
//
//   1. it fires twice, so a player on day 30 gets their origin story again
//   2. the life re-rolls, so "you were a fisherman" becomes "you were a merchant"
//   3. a god leaks into it, which spends the reveal the whole design is built on
'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

function build() {
  const said = []
  const store = {}
  const player = {
    uuid: 'p1', username: 'p1',
    tell: () => { },
    get server() { return server },
    persistentData: {
      getBoolean: (k) => !!store[k],
      putBoolean: (k, v) => { store[k] = v },
      getInt: (k) => store[k] | 0,
      putInt: (k, v) => { store[k] = v },
    },
  }
  const scheduled = []
  const server = {
    tickCount: 0,
    players: [player],
    scheduleInTicks(t, fn) { scheduled.push({ at: t, fn }) },
  }
  const VELDORA = {
    voice: {
      aside: (p, text, o) => { said.push({ text, o: o || {} }); return true },
      beatFor: (t, st) => Math.max(80, t.length * 2 * ((st && st.beatScale) || 1)),
    },
  }
  const ctx = {
    VELDORA, Math,
    console: { info() { }, warn() { }, error() { } },
    Text: { of: s => s },
    ServerEvents: { loaded: () => { }, commandRegistry: () => { } },
    PlayerEvents: { loggedIn: (f) => (ctx._in = f), loggedOut: (f) => (ctx._out = f) },
    Commands: null,
  }
  vm.createContext(ctx)
  for (const f of ['opening_lines.js', 'opening.js']) {
    vm.runInContext(fs.readFileSync(path.join(SS, f), 'utf8'), ctx, { filename: f })
  }
  return { ctx, said, store, player, server, scheduled }
}

function runAll(env) {
  // drain the scheduler once - the beats are all scheduled up front
  const q = env.scheduled.splice(0)
  q.forEach(s => { try { s.fn() } catch (e) { } })
}

const CASES = []
const t = (n, f) => CASES.push([n, f])
function assert(c, m) { if (!c) throw new Error(m || 'failed') }

t('it plays, and every beat reaches the player', () => {
  const e = build()
  assert(e.ctx.VELDORA.opening.play(e.player, true) === 'played', 'should play')
  runAll(e)
  assert(e.said.length >= 15, 'expected the whole cutscene, got ' + e.said.length + ' beats')
})

t('🔴 it plays ONCE - a second attempt is refused', () => {
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, false)
  const second = e.ctx.VELDORA.opening.play(e.player, false)
  assert(second === 'already-seen', 'a second play must be refused, got ' + second)
})

t('🚨 the flag is stamped BEFORE the beats, so a disconnect cannot replay it', () => {
  // The player logs out mid-cutscene: the beats never fire, but "seen" must already be
  // true. Stamping after the last beat cannot survive the exact case it is for.
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, false)
  assert(e.ctx.VELDORA.opening.seen(e.player) === true,
    'seen must be true before any beat has run')
  assert(e.said.length === 0, 'the setup is wrong: no beat should have fired yet')
})

t('⭐ the life is STAMPED, not re-rolled', () => {
  // A randomised backstory that changes is not a backstory.
  const e = build()
  const first = e.ctx.VELDORA.opening.lifeOf(e.player)
  for (let i = 0; i < 40; i++) {
    assert(e.ctx.VELDORA.opening.lifeOf(e.player) === first,
      'the life changed between reads: ' + first + ' then ' +
      e.ctx.VELDORA.opening.lifeOf(e.player))
  }
})

t('...and a reset clears the life too, not just the flag', () => {
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, false)
  e.ctx.VELDORA.opening.reset(e.player)
  assert(e.ctx.VELDORA.opening.seen(e.player) === false, 'reset must clear seen')
  assert(e.store['veldora_opening_which'] === 0,
    'reset must clear the life, or replaying gives the same three beats')
})

t('🚨 NO GOD APPEARS ANYWHERE IN IT', () => {
  // The whole design rests on the first god voice arriving AFTER the death. A god here
  // spends that, and it would look like content rather than a bug.
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, true)
  runAll(e)
  for (const s of e.said) {
    assert(!s.o.god, 'a beat carried a god: ' + JSON.stringify(s.o))
    assert(!s.o.color || s.o.color === '#AAAAAA',
      'a beat carried a god colour: ' + s.o.color)
  }
})

t('⭐ the doctor never speaks', () => {
  // "She spoke no words. Made no sounds." Nothing in the cutscene may be dialogue FROM
  // her - it is all the player's own narration. A quoted line would be the one thing
  // that could leak her.
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, true)
  runAll(e)
  const quoted = e.said.filter(s => /["""]/.test(s.text))
  assert(quoted.length === 0,
    'something is quoted, which means somebody spoke: ' +
    quoted.map(s => s.text).join(' / '))
})

t('the last beat is the upbeat one', () => {
  // Ethan's tone rule, asserted rather than trusted: the cutscene must END glad. If a
  // future edit reorders the passages, the ending is the first thing to go.
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, true)
  runAll(e)
  const last = e.said[e.said.length - 1].text.toLowerCase()
  assert(/bright|awaits|glee|life/.test(last),
    'the cutscene should end on something glad, got: ' + last)
})

t('every beat is long enough to be read', () => {
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, true)
  runAll(e)
  for (const s of e.said) {
    assert(s.o.seconds >= 2, 'a beat got ' + s.o.seconds + 's: ' + s.text)
  }
})

let failed = 0
for (const [n, f] of CASES) {
  try { f(); console.log('  ok    ' + n) } catch (e) {
    failed++; console.log('  FAIL  ' + n); console.log('        ' + e.message)
  }
}
console.log((CASES.length - failed) + '/' + CASES.length)
process.exit(failed ? 1 : 0)
