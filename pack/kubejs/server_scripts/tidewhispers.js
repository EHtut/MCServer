// tidewhispers.js — the dead, getting louder as the tide closes.
//
// Ethan, 2026-08-30:
//     "as a tide progresses, you begin to hear the whispers of the undead attacking you.
//      These are broken phrases that type out in random sizes in random areas of your
//      screen. It increases intensity as difficulty increases and the wave progresses."
//
// ── ⚠️ NOT whispers.js ────────────────────────────────────────────────────────
// That file is YOUR GOD muttering at you, keyed by god and trust tier, on a 30s roll.
// This is the DEAD, during a tide, keyed by how far into it you are. Different source,
// different trigger, different register — so a different file, sharing the surface.
//
// ── 🔴 "SEVERAL AT ONCE" IS NOT POSSIBLE, AND THAT CHANGED THE DESIGN ─────────
// The brief asks for several fragments on screen together, larger and closer to centre
// as it worsens. The mod cannot do it: ImmersiveMessagesManager holds ONE
// `currentTooltip` and a FIFO queue, so everything is sequential (D-123 follow-up).
//
// 🔑 So intensity is built from what IS available:
//
//     FREQUENCY   how often a fragment arrives at all
//     SIZE        how big it is
//     BROKENNESS  how much of it you can actually read
//     REACH       how far from the edge toward the middle it lands
//
// ⭐ That is arguably the better instrument anyway. Four dials that each ramp beats one
// dial that only counts, and the player still cannot point at the moment it got worse.
//
// ── 🚨 AND THE DEAD NEVER OUTRANK A GOD ───────────────────────────────────────
// Every fragment goes out at WHISPER priority, which `screen.js` only grants into a
// genuinely empty screen. A tide warning arriving behind five whispers would be a
// warning delivered, perfectly, to a corpse.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[tidewhispers] '
  var GATE = true

  var TICK = 60                  // 3s between rolls; the dial is CHANCE, not cadence
  var GOD = 'undead'             // a pseudo-speaker: no colour, no style, no chime

  // ⭐ THE RAMP. Wave number -> how bad it is. Each band is a whole different pressure
  // rather than a scalar, because a curve tuned by four numbers is a curve nobody can
  // reason about later.
  //
  // ⚠️ `reach` is a FRACTION of the way from the screen edge toward the middle. Early
  // fragments happen at the edges, where you half-notice them; late ones are in front
  // of your face.
  var BANDS = [
    // waves   chance  size   broken   reach   tag
    [0, 0.10, 0.75, 0.00, 0.25, 'far'],
    [3, 0.20, 0.85, 0.20, 0.45, 'near'],
    [6, 0.35, 1.00, 0.40, 0.70, 'close'],
    [9, 0.55, 1.20, 0.60, 0.95, 'inside'],
  ]

  // ⚠️ Where a fragment may land, in the same units as voice.js's scatter. Kept short
  // of the extremes: past this it lands under the hotbar or off the top, and being
  // caught in the corner of the eye is exactly what is lost.
  var SPREAD = { x: 200, y: 105 }

  // ══════════════════════════════════════════════════════════════════════════
  // 🖊️ ETHAN'S, NOT MINE. These are [CLAUDE-DRAFT] placeholders so the system can be
  // built and seen; the dead are his to write.
  //
  // 🔴 THIS COMMENT USED TO CLAIM `dialogue_doc.py extract undead` produced a document
  // for them. IT DOES NOT - the tool answers "unknown god 'undead'", because its FILES
  // map holds five gods and one file each. Registering through the normal voice pools
  // is necessary and not sufficient; the extractor also has to have been told the
  // speaker exists. The claim was never true and was never run.
  //
  // ⚠️ So these lines are currently unreachable by the writing pass - C6/E7 in
  // docs/76, along with 591 others.
  //
  // 🔑 THE REGISTER THEY HAVE TO HOLD: these are not sentences. They are the pieces of
  // one that never finished — no capital, no full stop, no speaker. A whisper that
  // reads as a complete thought reads as somebody talking to you, and the dead are not
  // addressing you. They are leaking.
  var DRAFT = {
    far: [
      '[CLAUDE-DRAFT] cold down here',
      '[CLAUDE-DRAFT] we were told to wait',
      '[CLAUDE-DRAFT] something moved',
    ],
    near: [
      '[CLAUDE-DRAFT] it knows your name',
      '[CLAUDE-DRAFT] closer than that',
      '[CLAUDE-DRAFT] we were told to wait and we waited',
    ],
    close: [
      '[CLAUDE-DRAFT] you are standing on us',
      '[CLAUDE-DRAFT] it has already started',
      '[CLAUDE-DRAFT] there is no further down',
    ],
    inside: [
      '[CLAUDE-DRAFT] we are already inside',
      '[CLAUDE-DRAFT] stop',
      '[CLAUDE-DRAFT] it is wearing your',
    ],
  }

  function bandFor(waves) {
    var b = BANDS[0]
    for (var i = 0; i < BANDS.length; i++) if (waves >= BANDS[i][0]) b = BANDS[i]
    return b
  }

  /** How far into a tide this player is, or null if they are not in one. */
  function wavesOf(p) {
    try {
      if (!VELDORA.tide || typeof VELDORA.tide.state !== 'function') return null
      var st = VELDORA.tide.state(p)
      if (!st || !st.active) return null
      return Number(st.waves) || 0
    } catch (e) { return null }
  }

  // ⭐ Difficulty multiplies the ramp where it is available. ⚠️ Late-bound and optional:
  // difficulty.js belongs to another channel, and a missing multiplier must cost the
  // ramp its steepness, never the whispers themselves.
  function difficultyScale(p) {
    try {
      if (VELDORA.difficulty && typeof VELDORA.difficulty.scale === 'function') {
        var d = Number(VELDORA.difficulty.scale(p))
        if (isFinite(d) && d > 0) return Math.max(0.5, Math.min(2, d))
      }
    } catch (e) { }
    return 1
  }

  function fragment(p, band) {
    try {
      if (!VELDORA.voice || typeof VELDORA.voice.line !== 'function') return null
      return VELDORA.voice.line(GOD, band[5], p)
    } catch (e) { return null }
  }

  // ⭐ HOW LONG A FRAGMENT STAYS UP. Reading speed, not a vibe: ~13 characters a second
  // is a slow, unhurried read, which is the register these are in - you are not meant to
  // be scanning them.
  //
  // ⚠️ CAPPED at HOLD.WHISPER in screen.js (4.0s). The dead may be readable; they may
  // not own the screen. If that cap is lowered, this silently follows it, which is the
  // right direction - the referee wins.
  // 🔴 RAISED 2026-08-30. These predate the typewriter being on. A fragment now has to
  // TYPE before it can be read, and at ~15 chars/sec a 40-character fragment spends 2.7s
  // just appearing - which left almost nothing to read it in at the old 4.0s ceiling.
  var WHISPER_FLOOR = 6.0
  var WHISPER_CEIL = 9.0
  var CHARS_PER_SEC = 13

  function whisperSeconds(text, band) {
    var n = String(text || '').length
    var s = n / CHARS_PER_SEC
    // Broken text is read twice: once to see it, once to work it out.
    if (band && band[3] > 0) s *= (1 + band[3] * 0.5)
    return Math.max(WHISPER_FLOOR, Math.min(WHISPER_CEIL, s))
  }

  function speak(p, band) {
    var text = fragment(p, band)
    if (!text) return false                 // nothing written for this band: say nothing
    try {
      if (!VELDORA.voice || typeof VELDORA.voice.aside !== 'function') return false
      var reach = band[4]
      // reach 0 = at the edges, 1 = in the middle. So the SPREAD shrinks as it worsens.
      var spread = 1 - reach
      return VELDORA.voice.aside(p, text, {
        anchor: 'CENTER_CENTER',
        x: Math.round((Math.random() * 2 - 1) * SPREAD.x * spread),
        y: Math.round((Math.random() * 2 - 1) * SPREAD.y * spread),
        size: band[2],
        // ⚠️ Presence-only in the mod: the KEY existing switches it on. So brokenness
        // is a per-fragment coin flip, not a value that gets passed through.
        obfuscate: (Math.random() < band[3]) ? 'RANDOM' : null,

        // 🔴 WAS A FLAT 1.4s. Ethan, 2026-08-30: *"Whispers disappear way too fast and
        // are unreadable. 1-2s"* - and a fragment you cannot finish reading is not
        // atmosphere, it is a rendering glitch you learn to ignore.
        //
        // ⚠️ A FLAT DURATION WAS THE BUG, not just a short one. "we were told to wait
        // and we waited" and "stop" had the same 1.4s, so the long ones were unreadable
        // while the short ones sat there. Scaled by length, with a floor that covers the
        // shortest fragment being noticed at all.
        //
        // 🔑 AND BROKEN TEXT NEEDS LONGER, NOT THE SAME. An obfuscated fragment has to
        // be read THROUGH the noise, so it gets a second pass worth of time - the
        // brokenness is the point, and it costs reading speed by design.
        seconds: whisperSeconds(text, band),
        italic: true,
        color: '#6E6E6E',
        // 🚨 The dead never outrank a god, and never delay a warning. screen.js grants
        // WHISPER only into an empty screen.
        priority: 'WHISPER',
      })
    } catch (e) { return false }
  }

  var sent = 0, skipped = 0

  function roll(server) {
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        // ⭐ QUIET MODE - the SOURCE declines, so the backlog model stays honest.
        try { if (VELDORA.screen && VELDORA.screen.isQuiet(p)) continue } catch (e) { }
        var waves = wavesOf(p)
        if (waves === null) continue
        var band = bandFor(waves)
        if (Math.random() > band[1] * difficultyScale(p)) continue
        if (speak(p, band)) sent++; else skipped++
      }
    } catch (e) { console.warn(TAG + 'roll threw :: ' + e) }
    schedule(server)
  }

  function schedule(server) { server.scheduleInTicks(TICK, function () { roll(server) }) }

  VELDORA.tideWhispers = {
    bands: BANDS,
    bandFor: bandFor,
    stats: function () { return { sent: sent, skipped: skipped } },
    _speak: speak,
    _waves: wavesOf,
  }

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF'); return }
    var n = 0, tags = 0
    if (VELDORA.voice && typeof VELDORA.voice.registerLines === 'function') {
      for (var k in DRAFT) {
        if (!DRAFT.hasOwnProperty(k)) continue
        if (VELDORA.voice.registerLines(GOD, k, DRAFT[k])) { n += DRAFT[k].length; tags++ }
      }
    }
    console.info(TAG + 'the dead get louder as the tide runs - ' + n +
      ' fragments across ' + tags + ' bands. ⚠️ ALL PLACEHOLDER: they are marked ' +
      '[CLAUDE-DRAFT] and are Ethan\'s to write. Sequential, never simultaneous - the ' +
      'mod queues - so intensity is frequency, size, brokenness and reach.')
    schedule(event.server)
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    if (!Commands) return
    try {
      event.register(Commands.literal('whisperband')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        // 🔴 WAS `Commands.integer(0, 40)`, which does not exist - `Commands` is the
        // raw Java class and the factory lives on IntegerArgumentType. The whole
        // command failed to register on the 12:12 boot; it failed LOUDLY because the
        // registration is wrapped, so it cost a log line rather than a silent absence.
        //
        // ⚠️ The working idiom in this pack is `event.arguments.INTEGER.create(event)`,
        // read back with an explicit java.lang.Integer class - copied from
        // notoriety.js rather than guessed a second time.
        .then(Commands.argument('waves', event.arguments.INTEGER.create(event))
          .executes(function (ctx) {
          var p = ctx.source.player
          var w = ctx.getArgument('waves', Java.loadClass('java.lang.Integer'))
          var b = bandFor(w)
          p.tell(Text.of('§8wave §f' + w + '§8 -> band §f' + b[5] +
            '§8  chance §f' + b[1] + '§8 size §f' + b[2] +
            '§8 broken §f' + b[3] + '§8 reach §f' + b[4]))
          for (var i = 0; i < 3; i++) speak(p, b)
          return 1
        }))
        .executes(function (ctx) {
          var p = ctx.source.player
          var w = wavesOf(p)
          p.tell(Text.of('§8in a tide: §f' + (w === null ? 'no' : 'yes, wave ' + w)))
          for (var i = 0; i < BANDS.length; i++) {
            var b = BANDS[i]
            p.tell(Text.of('§8from wave §f' + b[0] + '§8: §f' + b[5] +
              '§7 chance ' + b[1] + ', size ' + b[2] + ', broken ' + b[3]))
          }
          p.tell(Text.of('§8/whisperband <waves> §7to see and hear a band'))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
