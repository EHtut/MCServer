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
      // The tag rides along so the overlay can pick a tone for it, exactly as say()
      // does. Dropping it here would make every bickering line render as "everything
      // else" while the same line said directly got its proper presentation.
      out.push({ god: lines[i].god, text: s, tag: lines[i].tag })
    }

    busy = true
    var sent = 0
    // 🚨 AUDIT 2026-08-18: `busy` was set BEFORE this loop and released only by a
    // scheduled callback. If scheduleInTicks itself threw, the flag latched true and
    // the pantheon went permanently mute with nothing in the log saying why - a total
    // failure behind a one-line window. Low odds, unbounded consequence.
    try {
      for (var j = 0; j < out.length; j++) {
        (function (row, delay) {
          server.scheduleInTicks(delay, function () {
            try {
              var ps = audience(server)
              for (var k = 0; k < ps.length; k++) {
                // ⛔ CHAT COPY OFF (2026-08-30) - see voice.js CHAT_COPY. The overlay
                // carries every god now, with their own place and font.
                if (VELDORA.voice && VELDORA.voice.CHAT_COPY) {
                  try { ps[k].tell(Text.of(colourOf(row.god) + row.text)) } catch (e) { }
                }
                // ⭐ THE GODS ON SCREEN WHILE THEY BICKER. Ethan, 2026-08-30:
                // *"during god bickering, the gods you aren't aligned to should be
                // garbled."*
                //
                // 🔑 PER LISTENER, NOT PER LINE. The same exchange is readable to the
                // player whose god is speaking and garbled to everyone else - so an
                // argument between two gods is half-legible to each of their followers,
                // which is the point of it being an argument you are only half inside.
                //
                // ⚠️ SCOPED TO BICKERING ON PURPOSE. voice.js's own header explains why
                // this must not become the global rule: the path OFFER is read by a
                // pathless player by definition, and garbling the one prompt that asks
                // "will you walk my path?" would make the game's most load-bearing UI
                // 75% legible. An exchange between gods is not that.
                try {
                  if (VELDORA.voice && typeof VELDORA.voice.overlay === 'function') {
                    var mine = (typeof VELDORA.voice.alignedTo === 'function')
                      ? VELDORA.voice.alignedTo(ps[k], row.god)
                      : true
                    VELDORA.voice.overlay(ps[k], row.god, row.text, row.tag,
                      mine ? null : { obfuscate: 'RANDOM' })
                  }
                } catch (e) { }
              }
              sent++
            } catch (e) { console.warn(TAG + 'line threw :: ' + e) }
          })
        })(out[j], LEAD + j * GAP)
      }
    } catch (e) {
      busy = false
      console.error(TAG + 'could not schedule "' + (opts.why || '?') + '" :: ' + e)
      return 'threw'
    }

    // ⚠️ Release on a timer, not in the last line's callback. If a line throws, the
    // callback never completes and `busy` would latch true forever - one bad line
    // silencing every future exchange, with nothing in the log to explain it.
    server.scheduleInTicks(LEAD + out.length * GAP + GAP, function () {
      busy = false
      console.info(TAG + '"' + (opts.why || 'exchange') + '" delivered ' + sent + '/' +
        out.length + ' lines to ' + who.length + ' player(s)')
      // ⭐ onDone exists so a caller can land something AFTER the words. The Grudge
      // needs it: its reprisal was firing on the same tick the argument STARTED, so
      // the punishment beat its own explanation by eight seconds.
      if (typeof opts.onDone === 'function') {
        try { opts.onDone() } catch (e) { console.warn(TAG + 'onDone threw :: ' + e) }
      }
    })

    return 'sent'
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ A SCENE — an AUTHORED exchange, in turns, where a turn may be many beats.
  //
  // `exchange` above composes from POOLS: one random line per god, assembled at runtime.
  // That is right for the Grudge, where the argument is generated.
  //
  // 🔑 THE BICKERING DOCUMENTS ARE NOT THAT. They are written scenes with a shape — a
  // turn is one speaker, and a turn may run seven beats before the other god answers.
  // Flattening them into `exchange`'s uniform list would put 2.5s between every beat of
  // Wall's lament, turning a seven-line collapse into a seventeen-second monologue.
  //
  // Ethan, 2026-08-30: *"When the lines are like this — line1 / line 2 — this is a single
  // speaker, they will be typed out. Depending on the god speaking, it will use the same
  // system the gods use normally to speak and their font."*
  //
  // ⭐ SO THE OVERLAY GOES THROUGH `voice.speakChunks`, which IS the god's ordinary
  // presentation — his placement, her scatter, their font, typed. A bickering line and a
  // line said straight to you arrive identically; only who it is aimed at differs.
  //
  // ⚠️ CHAT STAYS ONE LINE PER BEAT. Chat is the scrolling record, and the record should
  // read the way he wrote it.
  //
  //   turns  [{god, chunks:[…]}] in speaking order
  //   opts   { minPlayers, why, tag, onDone }
  function scene(server, turns, opts) {
    opts = opts || {}
    if (!server || !turns || !turns.length) return 'bad-args'
    if (busy) {
      console.info(TAG + 'an exchange is already running - scene "' +
        (opts.why || '?') + '" dropped')
      return 'busy'
    }
    var who = audience(server)
    var need = (typeof opts.minPlayers === 'number') ? opts.minPlayers : 2
    if (who.length < need) return 'too-few'
    if (!VELDORA.voice || typeof VELDORA.voice.speakChunks !== 'function') {
      console.warn(TAG + 'voice.speakChunks missing - a scene cannot be presented')
      return 'no-voice'
    }

    busy = true
    var delivered = 0
    var at = LEAD
    try {
      for (var i = 0; i < turns.length; i++) {
        (function (turn, delay) {
          server.scheduleInTicks(delay, function () {
            try {
              var ps = audience(server)
              for (var k = 0; k < ps.length; k++) {
                for (var c = 0; c < turn.chunks.length; c++) {
                  if (VELDORA.voice && VELDORA.voice.CHAT_COPY) {
                    try { ps[k].tell(Text.of(colourOf(turn.god) + turn.chunks[c])) } catch (e) { }
                  }
                }
                try {
                  // ⭐ Same garbling rule as `exchange`: readable to that god's own
                  // champion, broken to everyone else. An argument between two gods is
                  // half-legible to each of their followers, which is the point of it
                  // being an argument you are only half inside.
                  var mine = (typeof VELDORA.voice.alignedTo === 'function')
                    ? VELDORA.voice.alignedTo(ps[k], turn.god) : true
                  VELDORA.voice.speakChunks(ps[k], turn.god, turn.chunks, opts.tag || null,
                    mine ? null : { obfuscate: 'RANDOM' })
                } catch (e) { }
              }
              delivered++
            } catch (e) { console.warn(TAG + 'turn threw :: ' + e) }
          })
        })(turns[i], at)
        // ⚠️ THE NEXT SPEAKER WAITS FOR THIS ONE TO STOP TALKING, not for a fixed beat.
        // A seven-chunk turn holds the screen far longer than a one-chunk reply, and a
        // uniform gap would land the answer on top of the question.
        var hold = 40
        try { hold = VELDORA.voice.chunksTicks(turns[i].god, turns[i].chunks) } catch (e) { }
        at += hold + GAP
      }
    } catch (e) {
      busy = false
      console.error(TAG + 'could not schedule scene "' + (opts.why || '?') + '" :: ' + e)
      return 'threw'
    }

    // Same rule as `exchange`: release on a timer, never in the last callback.
    var total = turns.length
    server.scheduleInTicks(at + GAP, function () {
      busy = false
      console.info(TAG + 'scene "' + (opts.why || '?') + '" delivered ' + delivered +
        '/' + total + ' turn(s) to ' + who.length + ' player(s)')
      if (typeof opts.onDone === 'function') {
        try { opts.onDone() } catch (e) { console.warn(TAG + 'onDone threw :: ' + e) }
      }
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
    scene: scene,
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
