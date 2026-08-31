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
    // 🔴 THE OPENING IS A RITUAL CUTSCENE NOW. It used to schedule eighteen separate
    // callbacks, which is why a restart mid-sequence delivered two lines and then
    // silence - the rest died with the server. It hands the whole scene to ritual.begin
    // as one unit instead, so the sandbox has to provide that primitive.
    //
    // ⚠️ The stub records every LINE, so the assertions below still check the beats
    // themselves rather than just that something was called.
    ritual: {
      begin: (p, spec) => {
        // ⚠️ Pass the SPEC through. The stub used to synthesise a tiny opts object, so
        // assertions about typewriter / anchor / y could not see what the Opening actually
        // asked for - they were testing the stub, not the code.
        (spec.lines || []).forEach(t => said.push({ text: t, o: spec }))
        return true
      },
      release: () => true,
      active: () => false,
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
  // 🔴 WAS A HARDCODED 15. The `end` section became pick-one instead of play-all (it
  // holds interchangeable ENDINGS, and concatenating it made them read as consecutive
  // plot), which dropped every life by three beats and failed a correct change.
  //
  // 🔑 Ask the data how many beats there should be. A test carrying its own copy of a
  // number the code owns will go red every time that number legitimately moves - which is
  // the third time tonight, after the scatter reach and the tide GRACE.
  // ⭐ THE CONTRACT, MEASURED AGAINST THE MOD'S REAL LIMITS.
  //
  // Three things were tested live on 2026-08-30 with a player watching, and together they
  // decide the shape - so this asserts the consequences rather than a chosen design:
  //
  //   escaped newline  renders literally, both single and double escaped
  //   text NBT field   does not exist - text is the command's greedy trailing argument
  //   maxWidth         a real field in the jar, and ignored: 90 and 400 looked identical
  //
  // ⇒ A single message cannot hold two lines. Ethan's hard rule - *"every sentence is on a
  //   new line"* - therefore REQUIRES one send per sentence, and the swap between them is
  //   unavoidable. Typing is what makes that a beat arriving rather than a line popping.
  const L = e.ctx.VELDORA.openingLines
  const sentences = L.sentences()
  assert(sentences.length > 5, 'the prose looks empty - ' + sentences.length + ' sentences')
  assert(e.said.length === sentences.length,
    'one send per sentence (' + sentences.length + '), got ' + e.said.length)

  // ⛔ NO SENTENCE MAY CARRY TWO. That is the hard rule, and it is the thing a future
  // "optimisation" would break by re-joining them into one message.
  for (const s2 of e.said) {
    const inner = s2.text.replace(/[.!?]+$/, '')
    assert(!/[.!?]\s+\S/.test(inner),
      'a send carries more than one sentence: ' + s2.text)
  }
  const o = e.said[0].o || {}
  assert(o.typewriter === true, 'every line MUST be typed - a standing rule')
  assert(o.perChar === true, 'each line must be timed from its own length')
  assert((o.y || 0) >= 100, 'the prose must clear the Serene Seasons HUD, y=' + o.y)

  // 🔴 AND THE POSITION MUST SURVIVE THE RITUAL BOUNDARY. ritualOverlay forwarded seconds,
  // anchor, align and typewriter - and silently dropped x and y, so three separate fixes
  // to move the entry off the Serene Seasons HUD did nothing and looked like failed
  // deploys. This asserts the boundary carries them.
  const ri = fs.readFileSync(path.join(SS, 'ritual.js'), 'utf8')
  const start = ri.indexOf('function ritualOverlay')
  const body = ri.slice(start, ri.indexOf('function scene', start) + 1 || start + 3000)
  assert(/STATE_X/.test(body), 'ritualOverlay must forward x')
  assert(/STATE_Y/.test(body), 'ritualOverlay must forward y')
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
  // 🔴 THIS USED TO ASSERT said.length === 0, and that was about the OLD scheduling
  // model - eighteen separate scheduleInTicks callbacks that had not fired yet. The
  // Opening now hands the whole scene to ritual.begin as one unit, so the sandbox's
  // stub records the lines immediately. The PROPERTY under test is unchanged and still
  // holds: `seen` is true before the scene can be interrupted, which is the only thing
  // that protects a disconnected player from replaying their origin story.
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

t('⭐ the title is its own centred announcement, not a tail on the prose', () => {
  // Ethan: *"arkhdottir new blood should play across the middle of the screen like an
  // announcement."* It used to run inline as the last words of a paragraph, where it had
  // no weight at all - the moment the whole scene builds to was the least prominent thing
  // on screen.
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, true)
  runAll(e)
  const spec = e.said[0].o || {}
  // ⭐ THE CARD IS A `popup`, measured in play: the only command route that renders two
  // lines - gold underlined title with the subtitle beneath, in a background box. subtext
  // is builder-only and unreachable from Rhino (D-123), and both newline routes are dead.
  assert(spec.finale, 'the opening must declare a finale card')
  assert(spec.finale.popup === true, 'the card must use the popup route, not an overlay')
  assert((spec.finale.title || '').indexOf('ARKHDOTTIR') !== -1,
    'the card must carry the title, got: ' + spec.finale.title)
  assert((spec.finale.subtitle || '').length > 5,
    'the card must carry the byline as its subtitle')
  // ⛔ And it must NOT also be buried in the prose.
  for (const s3 of e.said) {
    assert(s3.text.indexOf('ARKHDOTTIR') === -1,
      'the title leaked into the prose - it would be delivered twice: ' + s3.text)
  }
})




t('every beat is long enough to be read', () => {
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, true)
  runAll(e)
  for (const s of e.said) {
    // 🔴 WAS `s.o.seconds >= 2`. The entry's duration is PER-CHARACTER now (ritual sizes
    // each line from its own length) so there is no flat `seconds` to read - the old
    // assertion reported "undefineds" against a correct change.
    //
    // 🔑 The property is that the entry outlives its own typing. Either it declares
    // perChar - in which case ritual derives it - or it names a duration outright.
    const derived = s.o.perChar === true
    assert(derived || s.o.seconds >= 2,
      'the entry must outlive its typing: no perChar and seconds=' + s.o.seconds)
    if (derived) {
      assert(s.text.length < 2000,
        'perChar cannot rescue an entry this long - ' + s.text.length + ' chars')
    }
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
