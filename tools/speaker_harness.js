// speaker_harness.js — the general speaker tool, tested at ITS OWN boundary.
//
// ⚠️ NOT through voice.js or pantheon.js. A tool is used by strangers who have not read
// the thing underneath, so it is exercised the way they would.
//
// ⭐ THE TWO ASSERTIONS THAT MATTER MOST are Ethan's hard rules, carried here from
// tools/opening_harness.js so they hold for ANY story built on this toolkit, not just the
// Opening:
//
//     ONE SENTENCE PER SEND   *"every sentence is on a new line, that is a hard rule with
//                              everything I write that goes here"*
//     ALWAYS TYPED            *"anytime type is not the method used to show text it looks
//                              terrible"*
//
// Rule 1 slipped three separate times in one session while being written down each time.
// A rule that is only documented is a rule that gets broken.
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

// A sandbox whose voice.js is a RECORDER, so we see exactly what the tool asked for.
function build(lineFor) {
  const calls = { colours: [], styles: [], pools: [], frags: [], spoke: [], garbled: [] }
  const warned = []
  const ctx = {
    VELDORA: {
      voice: {
        setColour: (id, c) => calls.colours.push([id, c]),
        setStyle: (id, s) => calls.styles.push([id, s]),
        setGarbled: (id) => calls.garbled.push(id),
        registerLines: (id, tag, lines) => { calls.pools.push([id, tag, lines.length]); return true },
        register: (id, tag, o, c) => { calls.frags.push([id, tag, o.length, c.length]); return true },
        line: (id, tag) => (lineFor ? lineFor(id, tag) : 'A single line.'),
        speak: (p, id, text, tag, opts) => { calls.spoke.push({ id, text, tag, opts }); return true },
      },
    },
    Math,
    console: { info() { }, warn: (m) => warned.push(String(m)), error: (m) => warned.push(String(m)) },
    ServerEvents: { loaded() { } },
  }
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(path.join(SS, 'speaker.js'), 'utf8'), ctx)
  return { ctx, calls, warned, S: ctx.VELDORA.speaker, player: { uuid: 'p1', username: 'T' } }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('* A SPEAKER IS NOT A GOD')
{
  const e = build()
  const r = e.S.define('narrator', {
    colour: '§7',
    style: { anchor: 'TOP_LEFT' },
    lines: { greeting: ['You again.', 'Still here, then.'] },
    frags: { warning: { opens: ['Go back'], closes: ['while you can.'] } },
  })
  ok('it defines', !!r, true)
  ok('...registers the colour explicitly', e.calls.colours[0], ['narrator', '§7'])
  ok('...the style', e.calls.styles[0][0], 'narrator')
  ok('...the whole-line pool', e.calls.pools[0], ['narrator', 'greeting', 2])
  ok('...and the fragment pool', e.calls.frags[0], ['narrator', 'warning', 1, 1])
  ok('it counts what was registered', r.lines, 2)
  ok('...and the combinations', r.combos, 1)
  // ⭐ The whole point: no god, no tier, no path, no tide anywhere in the API.
  ok('the tool knows nothing of gods or tiers',
    e.S.specKeys.indexOf('tiers') === -1 && e.S.specKeys.indexOf('god') === -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 RULE 1 - ONE SENTENCE PER SEND, ENFORCED NOT DOCUMENTED')
{
  // ⚠️ The renderer shows ONE LINE PER MESSAGE (measured - see immersive.js). A send
  // carrying two sentences does not become two lines; it becomes one wrapped paragraph,
  // which is exactly what Ethan kept reporting from play.
  const two = build(() => 'First sentence. Second sentence.')
  two.S.define('n', { colour: '§7', lines: { t: ['x'] } })
  ok('a two-sentence line is REFUSED', two.S.say(two.player, 'n', 't'), false)
  ok('...nothing was sent', two.calls.spoke.length, 0)
  ok('...and it says which line and why', /more than one sentence/.test(two.warned.join(' ')), true)

  // 🔑 NEGATIVE CONTROL. Without this a tool that refused EVERYTHING would pass above.
  const one = build(() => 'A single sentence.')
  one.S.define('n', { colour: '§7', lines: { t: ['x'] } })
  ok('...while one sentence goes through', one.S.say(one.player, 'n', 't'), true)
  ok('...and is actually sent', one.calls.spoke.length, 1)

  // 🔴 AN ABBREVIATION *IS* TREATED AS TWO SENTENCES, AND THAT IS CORRECT HERE.
  // I first wrote this expecting "Mr. Smith is waiting." to pass, and it does not - but
  // the test was wrong, not the check. voice.sentences(), the engine's OWN splitter, also
  // breaks on a full stop followed by a space, so the renderer really would send that as
  // two messages. The check agreeing with the engine is the whole point of it.
  //
  // ⚠️ THE REAL LIMITATION IS THE SPLITTER, and it belongs to voice.js, not here. Until it
  // understands abbreviations, prose for this toolkit should avoid them - which is worth
  // knowing BEFORE writing an act, and is exactly what this refusal surfaces.
  const abbrev = build(() => 'Mr. Smith is waiting.')
  abbrev.S.define('n', { colour: '§7', lines: { t: ['x'] } })
  ok('an abbreviation splits, matching the engine splitter - a known limitation',
    abbrev.S.say(abbrev.player, 'n', 't'), false)

  const ellipsis = build(() => 'Wait...')
  ellipsis.S.define('n', { colour: '§7', lines: { t: ['x'] } })
  ok('nor is a trailing ellipsis', ellipsis.S.say(ellipsis.player, 'n', 't'), true)

  // And the check is exposed so a project can lint its own writing before shipping.
  ok('the rule is available to callers',
    e_two(), true)
  function e_two() {
    const s = build().S
    return s.carriesTwoSentences('One. Two.') === true &&
           s.carriesTwoSentences('Just one.') === false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 RULE 2 - TYPED BY DEFAULT')
{
  const e = build(() => 'A line.')
  e.S.define('n', { colour: '§7', lines: { t: ['x'] } })
  e.S.say(e.player, 'n', 't')
  ok('every line is typed without asking', e.calls.spoke[0].opts.typewriter, true)

  // ⚠️ A caller may still override deliberately - the default is a default, not a cage.
  const e2 = build(() => 'A line.')
  e2.S.define('n', { colour: '§7', lines: { t: ['x'] } })
  e2.S.speak(e2.player, 'n', 'A line.', 't', { typewriter: false })
  ok('...but an explicit false is respected', e2.calls.spoke[0].opts.typewriter, false)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⛔ IT REFUSES WHAT IT CANNOT DELIVER')
{
  const e = build()
  ok('an unknown spec key is refused', e.S.define('n', { colour: '§7', wobble: 1 }), null)
  ok('...and named', /wobble/.test(e.warned.join(' ')), true)
  ok('no id', e.S.define(null, {}), null)

  const bare = build()
  delete bare.ctx.VELDORA.voice
  ok('no voice.js underneath', bare.S.define('n', { colour: '§7' }), null)
  ok('...and it says so', /not loaded/.test(bare.warned.join(' ')), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⚠️ A COLOUR IS EXPLICIT OR IT IS A BUG')
{
  // 🔴 A speaker with no colour silently inherits the engine default, so a change to that
  // default moves them with nothing in any log. blade shipped that way once.
  const e = build()
  e.S.define('n', { lines: { t: ['x'] } })
  ok('an undeclared colour is warned about', /declares no colour/.test(e.warned.join(' ')), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ AN EMPTY POOL IS A MISS, NOT A FAILURE')
{
  // 🔑 "I failed" and "I found nothing" must never share a return value. An empty pool is
  // a speaker with nothing written for that tag - a real answer, and not an error.
  const e = build(() => null)
  e.S.define('n', { colour: '§7', lines: { t: [] } })
  ok('nothing to say returns false', e.S.say(e.player, 'n', 't'), false)
  ok('...quietly - no error logged for an honest miss',
    /REFUSED/.test(e.warned.join(' ')), false)
}

console.log('\n' + (fail ? R + fail + ' FAILED, ' + X : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
