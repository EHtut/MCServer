// speaker.js — the general "somebody says something" tool.
//
// ⭐ Chunk 3 of the toolkit arc. Ethan, 2026-08-30: *"we turn them from dedicated
// functions into tools"* — the open-source way to build stories and acts under
// Arkhdottir: New Bloods.
//
// ── ⭐ WHAT A SPEAKER IS ─────────────────────────────────────────────────────
// A named voice with a look and some things to say. It is NOT a god, a patron, a champion
// or a tide. Those are the CALLER's vocabulary, and this tool has never heard of them.
//
//     VELDORA.cast.define('narrator', {
//       colour: '§7',
//       style:  { anchor: 'TOP_LEFT', font: 'veldora:art', beatScale: 0.6 },
//       lines:  { greeting: ['You again.', 'Still here, then.'] },
//       frags:  { warning: { opens: ['Go back'], closes: ['while you can.'] } },
//     })
//     VELDORA.cast.say(player, 'narrator', 'greeting')
//
// ── 🔑 WHY THIS IS THIN, AND WHY THAT IS THE FINDING ────────────────────────
// docs/80 measured the coupling instead of grepping for it. `voice.js` looks Veldora-bound
// — 195 lines mention god/tide/path — but almost all of that is **the parameter named
// `god`**, which is already just an opaque speaker key, plus comments. Every core function
// already takes it first and never asks what it means:
//
//     registerLines(god, tag, lines)   line(god, tag, player)   setStyle(god, style)
//     speak(player, god, s, tag, opts) say(player, god, tag)    sayAbout(...)
//
// The five real hardcoded names live in the `/gd` DEBUG COMMAND (voice.js:1407-1531), not
// in the engine. So there is no Veldora logic to cut out of the speech path — the engine
// was general the whole time and nobody had said so.
//
// ⇒ This file is therefore a VOCABULARY and a CONTRACT, not a rewrite. Same call as
//   cutscene.js made, for the same reason: moving working code Ethan cannot test buys
//   nothing, and the thing genuinely missing was a documented surface with rules attached.
//
// ── 🚨 THE TWO RULES THAT ARE NOT NEGOTIABLE ────────────────────────────────
// These are Ethan's, stated repeatedly in play, and they must survive into any project
// that picks this toolkit up:
//
//   1. ONE SENTENCE PER SEND. *"every sentence is on a new line, that is a hard rule with
//      everything I write that goes here."* The renderer shows one line per message, so a
//      send carrying two sentences silently becomes a wrapped paragraph.
//
//   2. ALWAYS TYPED. *"it needs to be typed, no other appearance method... anytime type is
//      not the method used to show text it looks terrible."*
//
// ⚠️ Both are ENFORCED here, not documented and hoped for. `say()` refuses a line that
// carries two sentences rather than rendering it wrong, and reports which. Rule 1 slipped
// three separate times across one session while being written down each time.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[speaker] '

  // What a speaker may declare. ⚠️ Anything else is REFUSED rather than dropped — the same
  // rule cutscene.js enforces, for the same reason: a pass-through that silently omits a
  // field cannot be told apart from one that applied it wrongly.
  var SPEC_KEYS = ['colour', 'style', 'lines', 'frags', 'context', 'garbled', 'label', 'note']

  var KNOWN = {}          // id -> the spec it was defined with, for reporting

  function unknown(obj, allowed) {
    var bad = []
    for (var k in (obj || {})) {
      if (obj.hasOwnProperty(k) && allowed.indexOf(k) === -1) bad.push(k)
    }
    return bad
  }

  /**
   * Define a speaker. Returns a small report, or null if it was refused.
   *
   * ⚠️ Idempotent by id: defining the same id twice replaces it. That is deliberate — a
   * story reloaded mid-session should not accumulate ghosts of its own earlier speakers.
   */
  function define(id, spec) {
    if (!id) { console.error(TAG + 'refused: a speaker needs an id'); return null }
    spec = spec || {}

    var bad = unknown(spec, SPEC_KEYS)
    if (bad.length) {
      console.error(TAG + 'REFUSED ' + id + ' - keys this tool cannot deliver: ' +
        bad.join(', ') + '. Ignoring them silently is how a setting gets "fixed" repeatedly.')
      return null
    }

    var v = VELDORA.voice
    if (!v) { console.error(TAG + id + ': voice.js is not loaded - this speaker has no voice'); return null }

    var report = { id: id, pools: 0, written: 0, lines: 0, combos: 0 }

    // 🔴 A COLOUR IS EXPLICIT OR IT IS A BUG. A speaker with none silently inherits the
    // engine default, so a change to that default moves them with nothing in any log.
    if (spec.colour) v.setColour(id, spec.colour)
    else console.warn(TAG + id + ' declares no colour - it will inherit the shared default, ' +
      'which means a change to that default silently changes this speaker')

    if (spec.style && typeof v.setStyle === 'function') v.setStyle(id, spec.style)
    if (spec.garbled && typeof v.setGarbled === 'function') v.setGarbled(id, true)

    var k
    for (k in (spec.lines || {})) {
      if (!spec.lines.hasOwnProperty(k)) continue
      report.pools++
      if (spec.lines[k] && spec.lines[k].length) report.written++
      if (v.registerLines(id, k, spec.lines[k])) report.lines += spec.lines[k].length
    }
    for (k in (spec.context || {})) {
      if (!spec.context.hasOwnProperty(k)) continue
      report.pools++
      if (spec.context[k] && spec.context[k].length) report.written++
      if (v.registerLines(id, k, spec.context[k])) report.lines += spec.context[k].length
    }
    for (k in (spec.frags || {})) {
      if (!spec.frags.hasOwnProperty(k)) continue
      var f = spec.frags[k]
      report.pools++
      if (f && f.opens && f.opens.length && f.closes && f.closes.length) report.written++
      if (f && v.register(id, k, f.opens, f.closes)) {
        report.combos += f.opens.length * f.closes.length
      }
    }

    KNOWN[id] = { spec: spec, report: report }
    return report
  }

  // ⭐ RULE 1, ENFORCED. One sentence per send. The renderer shows a single line per
  // message, so a send carrying two sentences does not become two lines - it becomes one
  // wrapped paragraph, which is exactly what Ethan kept reporting.
  //
  // ⚠️ IT MATCHES THE ENGINE'S SPLITTER, INCLUDING ITS FLAW. voice.sentences() breaks on a
  // terminator followed by a space, so "Mr. Smith is waiting." really would be sent as TWO
  // messages - and this refuses it for that reason, not by accident.
  //
  // 🔑 The limitation is the splitter's, and it lives in voice.js. Until it understands
  // abbreviations, prose written for this toolkit should avoid them. Surfacing that at
  // write time is far better than discovering it on somebody's screen mid-act.
  function carriesTwoSentences(text) {
    var t = String(text || '').replace(/[.!?]+\s*$/, '')
    return /[.!?]\s+\S/.test(t)
  }

  /**
   * Say one line from a speaker's pool. Returns false if nothing was said.
   *
   * ⚠️ FALSE IS A REAL ANSWER, not an error - an empty pool means this speaker has nothing
   * written for that tag. "I failed" and "I found nothing" must stay distinguishable, so a
   * refusal is logged and a miss is not.
   */
  function say(player, id, tag, opts) {
    if (!player || !id || !tag) return false
    var v = VELDORA.voice
    if (!v || typeof v.line !== 'function') return false

    var text = null
    try { text = v.line(id, tag, player) } catch (e) { return false }
    if (!text) return false

    if (carriesTwoSentences(text)) {
      console.error(TAG + 'REFUSED ' + id + '/' + tag + ' - this line carries more than ' +
        'one sentence and the renderer shows ONE LINE PER MESSAGE, so it would arrive as a ' +
        'wrapped paragraph. Split it: "' + String(text).slice(0, 70) + '"')
      return false
    }
    return speak(player, id, text, tag, opts)
  }

  /**
   * Say a specific line. ⭐ RULE 2 lives here: it is TYPED unless the caller has gone out
   * of its way to say otherwise, because every other appearance method looks wrong.
   */
  function speak(player, id, text, tag, opts) {
    var v = VELDORA.voice
    if (!v || typeof v.speak !== 'function') return false
    var o = {}
    for (var k in (opts || {})) if (opts.hasOwnProperty(k)) o[k] = opts[k]
    if (o.typewriter === undefined) o.typewriter = true
    try { return v.speak(player, id, text, tag || null, o) } catch (e) { return false }
  }

  function known() {
    var out = []
    for (var k in KNOWN) if (KNOWN.hasOwnProperty(k)) out.push(k)
    return out
  }

  function reportFor(id) { return KNOWN[id] ? KNOWN[id].report : null }

  // 🔴 THIS IS `VELDORA.cast`, NOT `VELDORA.speaker`, AND THE RENAME IS THE FIX.
  //
  // deep_speaker.js:758 has published `VELDORA.speaker` since long before this tool
  // existed - the Doctor and the other deep voices. This file sorts AFTER it, so
  // claiming the same key wiped `active`, `met`, `forPath`, `introduce`, `register`,
  // `speakers` and `cutoff` on every boot. idle.js then called `.active(p)` inside a
  // try/catch and swallowed the TypeError, so THE DEEP SPEAKER WENT SILENT BELOW THE
  // CUTOFF with nothing in any log to say why.
  //
  // ⚠️ A MERGE GUARD WOULD NOT HAVE FIXED IT. Both objects define `say`, with different
  // signatures - deep_speaker's is say(player, tag), this tool's is say(player, id, tag).
  // Merging just moves the collision onto one key and picks a winner by load order. Two
  // different systems sharing a word need two words, which is the lesson doc 78 already
  // records about introductions.js: "Two systems called the same thing is how the wrong
  // one gets edited at two in the morning."
  //
  // ⭐ THE NEW TOOL MOVED, NOT THE INCUMBENT - it had zero live consumers (verified by
  // grep) while deep_speaker has four. And `cast` reads better in the toolkit docs
  // anyway: a cast is the set of named voices a story can call on.
  VELDORA.cast = VELDORA.cast || {}
  var _castPub = {
    define: define,
    say: say,
    speak: speak,
    known: known,
    report: reportFor,
    specKeys: SPEC_KEYS,
    // Exposed so a project can check its own writing before it ships, rather than
    // discovering a two-sentence line on somebody's screen.
    carriesTwoSentences: carriesTwoSentences,
  }
  for (var _ck in _castPub) {
    if (_castPub.hasOwnProperty(_ck)) VELDORA.cast[_ck] = _castPub[_ck]
  }

  ServerEvents.loaded(function () {
    // ⚠️ Shout if the key this tool used to own has been taken by something that is not
    // the deep speaker. A silent namespace fight is what this whole comment is about.
    if (VELDORA.speaker && typeof VELDORA.speaker.active !== 'function') {
      console.error(TAG + 'VELDORA.speaker exists but is NOT deep_speaker - something ' +
        'else has claimed that key. Check for a third writer.')
    }
    console.info(TAG + 'the general speaker tool is live as VELDORA.cast - ' + known().length +
      ' speaker(s) defined through it. Enforces ONE SENTENCE PER SEND and TYPED BY ' +
      'DEFAULT, both of which are rules that slipped repeatedly while merely written down.')
  })
})();
