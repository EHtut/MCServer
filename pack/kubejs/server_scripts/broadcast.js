// broadcast.js — the gods speaking where EVERYONE can hear.  docs/49 §4, docs/50 §4
//
// Ethan, 2026-08-18: "Bickering between two gods as dialogue for both of the players
// to hear if there's more than one."
//
// ── ⭐ WHY THIS IS ITS OWN FILE ──────────────────────────────────────────────
// Everything in this pack until now speaks to ONE player. `voice.say(p, god, tag)`
// takes a player and always has; there was no broadcast anywhere in the codebase,
// verified - zero hits for tellAll or an equivalent. That is not an oversight, it is
// the shape of a game about a patron and a champion.
//
// The gods talking to EACH OTHER is a different act and needs a different door. Two
// unrelated features want it, which is the argument for building it once:
//
//     docs/49 §4  THE ARGUMENT   the accusation before a reprisal lands
//     docs/50 §4  THE BICKERING  ambient contempt, when two champions are online
//
// The loud version and the quiet one. Build the quiet one and the loud one gets its
// baseline: if the gods only ever address each other in anger, the anger has nothing
// to be measured against.
//
// ── ⭐ THE COLOURS DO THE ATTRIBUTION, SO NOTHING IS NAMED ───────────────────
// voice.js already carries COLOUR[god]. An exchange is just an ordered list of
// (god, line) pairs, each rendered in its own colour - so a player can tell who is
// speaking without a single name tag, which matters because "part of all the gods is
// they don't actually see you for you" and that cuts both ways. They do not introduce
// themselves either.
//
// ── 🚨 IT NEVER TAKES CONTROL ───────────────────────────────────────────────
// `ritual.begin` blinds, slows and roots the player. That is correct for a scene you
// are IN and indefensible for a conversation you are merely overhearing - and the
// tide design (docs/50 §5) already establishes that anything control-taking cannot
// fire while a player might be fighting. An exchange is chat. It can land at any
// moment, safely, forever.
//
// ── ⚠️ A LINE THAT CANNOT BE SPOKEN MUST NOT LEAVE A HOLE ───────────────────
// Half an argument is worse than none - "Your champion keeps murdering mine!" with no
// reply reads as a bug, not as a snub. So an exchange is RESOLVED IN FULL BEFORE ANY
// OF IT IS SENT. If any line is missing, nothing is sent and the log says which.
// (Art is the deliberate exception - see hasVoice below.)
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[bcast] '

  var GAP = 50            // ticks between lines - ritual.js's pacing, ~2.5s
  var LEAD = 10           // a beat before the first line

  // ⚠️ ONE EXCHANGE AT A TIME, SERVER-WIDE. Two arguments interleaving would render
  // as one conversation between four gods and nobody could follow it. In memory on
  // purpose: it must not survive a restart, or a crash mid-exchange would mute the
  // pantheon permanently with no way to tell why.
  var busy = false

  function colourOf(god) {
    try {
      if (VELDORA.voice && typeof VELDORA.voice.colourOf === 'function') {
        var c = VELDORA.voice.colourOf(god)
        if (c) return c
      }
    } catch (e) { }
    return '§7'
  }

  // Resolve a line: either given verbatim (`text`) or drawn from a pool (`tag`).
  function resolve(entry) {
    if (!entry || !entry.god) return null
    if (entry.text) return String(entry.text)
    if (!entry.tag) return null
    try {
      if (VELDORA.voice && typeof VELDORA.voice.line === 'function') {
        var s = VELDORA.voice.line(entry.god, entry.tag, null)
        if (s) return String(s)
      }
    } catch (e) { }
    return null
  }

  function audience(server) {
    try { return server.players || [] } catch (e) { return [] }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE ONE ENTRY POINT.
  //
  //   lines    [{god, text}] or [{god, tag}], in speaking order
  //   opts     { minPlayers, why }
  //
  // Returns a REASON STRING, never a bare boolean - same rule warn.js follows. An
  // exchange that did not happen has five causes and they are not the same event.
  // ═══════════════════════════════════════════════════════════════════════════
  function exchange(server, lines, opts) {
    opts = opts || {}
    if (!server || !lines || !lines.length) return 'bad-args'
    if (busy) {
      console.info(TAG + 'an exchange is already running - ' + (opts.why || '?') + ' dropped')
      return 'busy'
    }

    var who = audience(server)
    // ⭐ Ethan: "for both of the players to hear IF THERE'S MORE THAN ONE." Gods
    // bickering to an empty room is a tree falling in a forest, and a solo player
    // must never be able to tell this exists and is missing - so no teaser, no
    // "somewhere, the gods are arguing". It simply does not happen.
    var need = (typeof opts.minPlayers === 'number') ? opts.minPlayers : 2
    if (who.length < need) return 'too-few'

    // Resolve EVERYTHING first. See the header - half an exchange reads as a bug.
    var out = []
    for (var i = 0; i < lines.length; i++) {
      var s = resolve(lines[i])
      if (!s) {
        console.warn(TAG + 'exchange "' + (opts.why || '?') + '" ABANDONED - ' +
          lines[i].god + '/' + (lines[i].tag || '(verbatim)') +
          ' has no line. Nothing was sent; half a conversation is worse than none.')
        return 'incomplete'
      }
      out.push({ god: lines[i].god, text: s })
    }

    busy = true
    var sent = 0
    for (var j = 0; j < out.length; j++) {
      (function (row, delay) {
        server.scheduleInTicks(delay, function () {
          try {
            var ps = audience(server)
            for (var k = 0; k < ps.length; k++) {
              try { ps[k].tell(Text.of(colourOf(row.god) + row.text)) } catch (e) { }
            }
            sent++
          } catch (e) { console.warn(TAG + 'line threw :: ' + e) }
        })
      })(out[j], LEAD + j * GAP)
    }

    // ⚠️ Release on a timer, not in the last line's callback. If a line throws, the
    // callback never completes and `busy` would latch true forever - one bad line
    // silencing every future exchange, with nothing in the log to explain it.
    server.scheduleInTicks(LEAD + out.length * GAP + GAP, function () {
      busy = false
      console.info(TAG + '"' + (opts.why || 'exchange') + '" delivered ' + sent + '/' +
        out.length + ' lines to ' + who.length + ' player(s)')
    })

    return 'sent'
  }

  // Does this god have anything to say under this tag? Callers use it to decide
  // whether an exchange is even possible before composing one.
  //
  // ⭐ ART'S SILENCE IS A REAL ANSWER. She has no argue pools by design - "Art will
  // do nothing" - so an exchange naming her resolves `incomplete` and is dropped.
  // That is correct, but the CALLER should notice and say something else instead:
  // the other god remarking that the dreamer did not answer is content, and an
  // exchange that silently never happens is not.
  function hasVoice(god, tag) {
    try {
      if (VELDORA.voice && typeof VELDORA.voice.line === 'function') {
        return !!VELDORA.voice.line(god, tag, null)
      }
    } catch (e) { }
    return false
  }

  VELDORA.broadcast = {
    exchange: exchange,
    hasVoice: hasVoice,
    running: function () { return busy },
    gap: GAP,
  }

  ServerEvents.loaded(function (event) {
    event.server.scheduleInTicks(1, function () {
      var ok = !!(VELDORA.voice && typeof VELDORA.voice.line === 'function')
      if (!ok) {
        console.error(TAG + 'voice.js missing - no exchange can ever be composed')
        return
      }
      console.info(TAG + 'VELDORA.broadcast published OK - the gods can address each ' +
        'other where everyone hears. ' + GAP + 't between lines, one exchange at a ' +
        'time, 2+ players required, chat only (NEVER the ritual).')
    })
  })
})();
