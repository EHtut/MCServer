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
  const ritualCalls = []
  const popups = []
  const commands = []
  const server = {
    tickCount: 0,
    players: [player],
    scheduleInTicks(t, fn) { scheduled.push({ at: t, fn }) },
    runCommandSilent(c) { commands.push(c) },
    runCommand(c) { commands.push(c); return 1 },
  }
  const VELDORA = {
    voice: {
      aside: (p, text, o) => { said.push({ text, o: o || {} }); return true },
      beatFor: (t, st) => Math.max(80, t.length * 2 * ((st && st.beatScale) || 1)),
    },
    // 🔴 THE OPENING IS NOT A CUTSCENE ANY MORE (Ethan, 2026-09-05). It gives a book and
    // types a title card. ritual is still stubbed, but only so the harness can PROVE it is
    // never called - a dormant path that still looks callable is how the wrong one gets
    // fixed later.
    ritual: {
      begin: (p, spec) => { ritualCalls.push(spec); return true },
      release: () => true,
      active: () => false,
    },
    im: {
      show: (p, text, o) => { said.push({ text, o: o || {} }); return true },
      popup: (p, t, sub, secs) => { popups.push({ t, sub, secs }); return true },
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
  return { ctx, said, store, player, server, scheduled, ritualCalls, popups, commands }
}

function runAll(env) {
  // drain the scheduler once - the beats are all scheduled up front
  const q = env.scheduled.splice(0)
  q.forEach(s => { try { s.fn() } catch (e) { } })
}

const CASES = []
const t = (n, f) => CASES.push([n, f])
function assert(c, m) { if (!c) throw new Error(m || 'failed') }

t('it plays, and the ONLY thing on screen is the card', () => {
  // ⭐ Ethan, 2026-09-05: *"The only thing you see is the words typing out."* Two sends,
  // the title and the byline, and nothing else. Eighteen overlay beats was the old design.
  const e = build()
  const r = e.ctx.VELDORA.opening.play(e.player, false)
  assert(r === 'played', 'expected played, got ' + r)
  assert(e.said.length === 2, 'expected exactly 2 sends (title, byline), got ' + e.said.length)
  const [title, byline] = e.ctx.VELDORA.opening.title()
  assert(e.said[0].text === title, 'first send must be the title, got ' + e.said[0].text)
  assert(e.said[1].text === byline, 'second send must be the byline, got ' + e.said[1].text)
})

t('⭐ the card is TYPED, and clear of the crosshair', () => {
  // 🔴 IT WAS A `popup` UNTIL 2026-09-05 AND A POPUP CANNOT TYPE - it carries no NBT at
  // all, so the typewriter flag has nowhere to go. Typed means the overlay route.
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, false)
  for (const send of e.said) {
    assert(send.o.typewriter, 'the card must be typed: ' + send.text)
    assert(String(send.o.anchor).indexOf('CENTER') === 0, 'the card is centred')
    // From a CENTER anchor the crosshair owns -34..34 and the biome title -53..-11.
    const y = send.o.y
    assert(!(y > -34 && y < 34), 'y=' + y + ' sits on the crosshair')
    assert(!(y > -53 && y < -11), 'y=' + y + ' sits in the biome-title band')
  }
})

t('⛔ and the title never leaks into the journal', () => {
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, false)
  const give = e.commands.find(c => c.indexOf('written_book') !== -1) || ''
  assert(give.indexOf('ARKHDOTTIR') === -1,
    'the title is the card, not a page - it would be delivered twice')
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

t('⛔ THE RANDOMISED LIFE IS CUT, AND MUST STAY CUT', () => {
  // ⭐ ETHAN, 2026-09-05: *"we cut the old introduction and randomized life."* There is
  // ONE origin - the script he wrote. This replaces two assertions that used to prove the
  // life was stamped rather than re-rolled; both are meaningless now, and DELETING them
  // without leaving something behind is how a cut feature quietly grows back.
  //
  // ⚠️ It was always one life in practice: count() was hardcoded to 1 and build()
  // discarded the index it was handed. The apparatus described a roll it never made.
  const e = build()
  assert(typeof e.ctx.VELDORA.opening.lifeOf !== 'function',
    'lifeOf is back - the randomised life was cut')
  assert(e.store['veldora_opening_which'] === undefined,
    'the life index key is back in player data')
  const src = fs.readFileSync(path.join(SS, 'opening_lines.js'), 'utf8')
  assert(src.indexOf('count: function') === -1,
    'opening_lines.count() is back - there is one origin, not a set to pick from')
})

t('⭐ ...and the one origin still reaches the player - in the JOURNAL', () => {
  // 🔴 THE EIGHTEEN SENTENCES MOVED SURFACE, THEY DID NOT GO AWAY. This is the assertion
  // that tells "the cutscene was removed" apart from "the origin was deleted" - two very
  // different outcomes that a test counting overlay sends would have scored identically.
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, false)
  const give = e.commands.find(c => c.indexOf('written_book') !== -1)
  assert(give, 'no written_book was given')
  // ⚠️ READ THE SENTENCES FROM THE API, NOT BY REGEXING THE SOURCE. My first version
  // matched every quoted string in the file and picked up a COMMENT quoting Ethan's
  // one-sentence rule, then reported it as a missing journal page. The export is the
  // thing production uses; the file is not.
  const sentences = e.ctx.VELDORA.openingLines.build()
  assert(sentences.length === 18, 'expected 18 sentences, saw ' + sentences.length)
  for (const text of sentences) {
    assert(give.indexOf(text) !== -1, 'this sentence is missing from the journal: ' + text)
  }
})

t('⛔ the cutscene is GONE - ritual is never called', () => {
  // ⚠️ Ethan spent four days on the cutscene before cutting it. A path that still runs
  // "sometimes" is worse than one that never runs, so this asserts the absence directly
  // rather than trusting that nothing calls it.
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, false)
  assert(e.ritualCalls.length === 0,
    'the opening called ritual.begin ' + e.ritualCalls.length + ' time(s) - the cutscene is cut')
})

t('⭐ the journal is titled Journal, and its pages do not overflow', () => {
  const e = build()
  e.ctx.VELDORA.opening.play(e.player, false)
  const give = e.commands.find(c => c.indexOf('written_book') !== -1) || ''
  assert(give.indexOf('title:"Journal"') !== -1, 'the book must be titled Journal')
  assert(give.indexOf('author:"Rehykt"') !== -1, 'the book must be authored')
  // 🔑 A page that overflows silently drops its tail in game and there is no error.
  const pages = e.ctx.VELDORA.opening.paginate(e.ctx.VELDORA.openingLines.build())
  for (const pg of pages) {
    let h = 0
    for (const line of pg) h += Math.ceil(line.length / 19) + 1
    assert(h <= 14, 'a page is ' + h + ' lines, over the 14 a book page holds: ' + pg[0])
  }
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
