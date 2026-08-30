// voice.js - THE COMBINATORIAL LINE ENGINE.  docs/40 PART 4
//
// Ethan, 2026-08-15: "I want to make it dynamic for most of these with dialogue
// snippets combined together to keep things fresh."
//
// NOTHING in this pack was combinatorial before this file. Every pool - whispers,
// regard beats, the scenes - is whole lines picked at random, so a player hears the
// same sentence twice and the character stops being a character.
//
// THE GRAMMAR: one OPEN + one CLOSE, drawn from the same TAG, joined with a space.
// Blade's best written line is already this shape:
//
//     "Phaethon reached for the sun's chariot too."   <- open
//     "They still find pieces of him in the river."   <- close
//
// ── THE RULE THAT KEEPS IT FROM PRODUCING NONSENSE ───────────────────────────
// Fragments only ever combine WITHIN a tag. A verdict about the spider must never
// land on an observation about the engineer. The tag IS the subject, so any open
// in a tag must read correctly against any close in that same tag - that is a
// constraint on the WRITING, and speak() checks the shape at boot rather than
// trusting it.
//
// ── ROLLBACK ─────────────────────────────────────────────────────────────────
// A god with no pools registered simply never speaks through this file; every
// existing whisper and beat is untouched. It adds a voice, it replaces nothing.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[voice] '

  // god -> tag -> { opens: [], closes: [] }
  var POOLS = {}

  // god -> colour code. The gods speak in bold dark red (23 §5, the pack's one
  // delivery channel). The Speaker below does NOT - she is not a god, she is what
  // is left when yours cannot reach you, and grey is the whole point.
  var COLOUR = {}
  var DEFAULT_COLOUR = '§4§l'

  function setColour(god, code) { COLOUR[god] = code }

  // ⭐ THE ONE PLACE THAT KNOWS WHAT COLOUR A GOD IS.
  //
  // Every other file that made a patron speak hardcoded '§4§l' - Blade's bold red -
  // because for months Blade was the only patron with a voice. The moment the Spider
  // arrived, her death lines, her fall, her entry line and her reckoning all came out
  // in HIS colour. Ethan, 2026-08-15: "we need to make sure all her dialogue stays in
  // her color."
  //
  // Callers ask here now. A god with no registered colour still falls back to the
  // patron channel, so nothing goes uncoloured.
  function colourOf(god) { return COLOUR[god] || DEFAULT_COLOUR }

  // What a player last heard, so the same pairing does not repeat back to back.
  // In memory: a repeat across a restart is not worth persisting state for.
  var lastSaid = {}

  function register(god, tag, opens, closes) {
    if (!god || !tag) return false
    if (!opens || !opens.length || !closes || !closes.length) {
      console.error(TAG + 'refusing to register ' + god + '/' + tag +
        ' - a pool with an empty half can only ever produce half a line')
      return false
    }
    if (!POOLS[god]) POOLS[god] = {}
    POOLS[god][tag] = { opens: opens, closes: closes }
    return true
  }

  // Some pools are WHOLE lines rather than fragments - a declaration, a verdict,
  // a refusal. Those are registered with an empty `closes` and joined to nothing,
  // so one engine serves both shapes and callers never need to know which is which.
  function registerLines(god, tag, lines) {
    if (!lines || !lines.length) {
      console.error(TAG + 'refusing to register ' + god + '/' + tag + ' - empty')
      return false
    }
    if (!POOLS[god]) POOLS[god] = {}
    POOLS[god][tag] = { opens: lines, closes: null, whole: true }
    return true
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)] }

  // Build a line. Returns null if that god has nothing for that tag - and null
  // means "say nothing", which callers must respect rather than substituting a
  // placeholder. A god with nothing to say is silent, not broken.
  function line(god, tag, player) {
    var g = POOLS[god]
    if (!g) return null
    var p = g[tag]
    if (!p) return null

    // Two tries to avoid an immediate repeat, then take what we get. Looping
    // until unique would spin forever on a one-line pool.
    var key = null
    try { key = player ? String(player.uuid) + '|' + god + '|' + tag : null } catch (e) { }
    var out = null
    for (var i = 0; i < 2; i++) {
      out = p.whole ? pick(p.opens) : (pick(p.opens) + ' ' + pick(p.closes))
      if (!key || lastSaid[key] !== out) break
    }
    if (key) lastSaid[key] = out
    return out
  }

  // Speak it, in the patron register: bold red, the pack's one delivery channel
  // (23 §5 - "all the events need to be bolded in red over chat").
  // ⭐ THE ONE PLACE A GOD IS AUDIBLE. Every patron utterance in the game funnels
  // through say/sayAbout, so hanging the sound here means no call site had to change
  // and none can be forgotten - which is the whole reason it goes here rather than at
  // the ~100 places that speak.
  //
  // 🔑 LATE-BOUND, DELIBERATELY. KubeJS loads server_scripts alphabetically, so
  // patron_sound.js is already in memory by the time voice.js loads - but reading it
  // at CALL time rather than load time means the order stops mattering at all, and a
  // missing or failed patron_sound.js costs exactly the sound and nothing else.
  //
  // ⚠️ AND IT NEVER AFFECTS THE RETURN VALUE. say() answers "did the god speak",
  // not "did the god make a noise". A caller that keys off this - and hasVoice()/mute()
  // in blade_events.js does - must not start behaving differently because a sound id
  // was wrong.
  function chime(player, god, tag) {
    try {
      if (VELDORA.patronSound && typeof VELDORA.patronSound.play === 'function') {
        VELDORA.patronSound.play(player, god, tag)
      }
    } catch (e) { }
  }

  // ⭐⭐ THE NIGHT GATE. `night.js` decides whether this god may reach this player right
  // now; after the Speaker's arrival, blade and salvage cannot, between dusk and dawn.
  //
  // 🔑 SAME CHOKEPOINT, SAME REASON AS THE CHIME. Every patron utterance funnels
  // through say/sayAbout, so one check here silences a god everywhere instead of at the
  // ~100 places that speak - and none of them can be forgotten.
  //
  // ⚠️ IT RETURNS FALSE, WHICH IS THE HONEST ANSWER. say() means "did the god speak",
  // and a silenced god did not. Callers that branch on it behave correctly by
  // construction: warn.js, for instance, falls back to its SOUND when the voice returns
  // false - so a silenced night still warns you, it just does not talk to you. That is
  // exactly the intended shape.
  //
  // 🚨 LATE-BOUND AND FAILS OPEN. If night.js is missing or throws, everyone speaks.
  // A gate that fails closed would mute the pantheon on any glitch, and silence is the
  // one symptom nobody reports because it looks like nothing happening.
  function silenced(player, god) {
    try {
      if (!VELDORA.night || typeof VELDORA.night.silencedNow !== 'function') return false
      return !!VELDORA.night.silencedNow(player.server, player, god)
    } catch (e) { return false }
  }

  // ════════════════════════════════════════════════════════════════════════
  // ⭐ WHO ARRIVES BROKEN. Ethan, 2026-08-29: *"all pathless dialogue needs to have
  // some of those 'obscure' characters, randomly spread across the entire dialogue so
  // it's only 75% readable."*
  //
  // 🔑 A REGISTRY, EXACTLY LIKE `COLOUR` ABOVE, and for the same reason: one place
  // that knows. A speaker declares itself garbled once; nothing else has to remember.
  //
  // 🚨 SCOPED ON PURPOSE, AND THIS IS THE IMPORTANT PART. "Pathless dialogue" here
  // means *the dialogue that exists BECAUSE you have no god* - the Stranger, and the
  // two deals. It does NOT mean everything a pathless player reads, because the path
  // OFFER is read by a pathless player by definition, and garbling the one piece of UI
  // that asks "will you walk my path?" would make the game's most load-bearing prompt
  // 75% legible. Widen this if Ethan wants it wider; do not widen it by accident.
  var GARBLED = {}

  function setGarbled(god) { GARBLED[god] = true }

  function paint(player, god, s) {
    var c = COLOUR[god] || DEFAULT_COLOUR
    if (GARBLED[god]) {
      try {
        if (VELDORA.garble && typeof VELDORA.garble.line === 'function') {
          return c + VELDORA.garble.line(s, c)
        }
      } catch (e) { }
    }
    return c + s
  }

  // ════════════════════════════════════════════════════════════════════════
  // ⭐ THE GODS ON SCREEN. Ethan, 2026-08-29: *"we could use this and documentation to
  // transfer all god dialogue making it more immersive instead of just creating
  // workarounds."*
  //
  // 🚨 AND CHAT KEEPS THE RECORD. This is an ADDITION, never a move. announce.js's
  // own header states the reason and it has not changed: *"a god says load-bearing
  // things and a bar is gone in four seconds - a line missed mid-fight would be missed
  // forever. Chat is the only surface in the game that keeps a record."*
  //
  // ⭐ So the overlay carries PRESENCE - typewriter, her colour, obfuscated if she is
  // reaching somebody with no god - and the chat line carries the WORDS. Neither is a
  // workaround for the other; they are doing different jobs.
  //
  // ⚠️ BOTTOM_CENTER, not TOP. announce.js owns the top of the screen for things that
  // are ABOUT to happen, and a god talking is not that. Two systems on one anchor would
  // fight over the same pixels the first time a tide landed mid-conversation.
  // ⭐ ABOVE THE HOTBAR. Ethan, 2026-08-30: *"lets move the location of the text to
  // above the hotbar."* BOTTOM_CENTER sits ON the hotbar, so it is lifted clear.
  // ⚠️ ONE NUMBER, ON PURPOSE — this is the value to change if it sits wrong on screen,
  // and there is exactly one of it.
  // 🔴 MEASURED ON SCREEN, and it corrected a wrong diagnosis. Ethan, 2026-08-30,
  // after running the `/gd place` sweep: *"80 or 60, that being said negative and
  // positive values were in the same place."*
  //
  // ⚠️ THE SIGN IS IGNORED. `y` is a MAGNITUDE — a distance from the anchor — so -60
  // and +60 render identically. I had reasoned that y grows downward in GUI space and
  // that +40 was pushing the line off the bottom edge. That was wrong. +40 was simply
  // only 40px up, which puts it BEHIND the hearts and the hotbar: visible in principle,
  // unreadable in practice, and indistinguishable from not rendering at all.
  //
  // 🔑 Reading it off the screen took one command. Reasoning about it from the
  // bytecode produced a confident wrong answer twice.
  //
  // 60 is what the sweep showed sitting clear above the armour bar. 80 is the other
  // value Ethan named and is the number to raise it to if a shaking or oversized line
  // ever clips the HUD — the `weight` tone uses both.
  // ⛔ ONE SWITCH. Flip to true the moment `/gd type` shows the speed is usable.
  var TYPEWRITER = true

  // 🔴 NEGATIVE, AND THE SIGN IS THE WHOLE BUG. y grows DOWNWARD in GUI space, so from a
  // BOTTOM anchor a POSITIVE y pushes the line off the bottom edge of the screen. It
  // renders perfectly and nobody can see it.
  //
  // ⚠️ I DIAGNOSED THIS CORRECTLY AND THEN TALKED MYSELF OUT OF IT. The `/gd place` sweep
  // rendered `y = -60` in a screenshot; Ethan then recalled that negative and positive
  // landed in the same place, and I took the recollection over the photograph and flipped
  // it to +60. Every god line has been off-screen since. The commit history reads:
  //
  //     3d5b728  -40  -> "i saw something type out ... at my hotbar level"
  //     e8eb228  +60  -> nothing, for the rest of the night
  //
  // 🔑 A SCREENSHOT OUTRANKS A RECOLLECTION. He was reporting seven stacked lines from
  // memory; only one of them was in the picture, and that one was negative.
  //
  // -60 is what the sweep showed sitting clear above the armour bar; -80 was his other
  // named value and is the number to raise it to if a shaking or oversized line clips.
  var HOTBAR_LIFT = -60

  // ⭐ A DIALOGUE TYPE PER WHAT THE DIALOGUE IS. Ethan, 2026-08-30: *"we can assign a
  // type of dialogue per what the dialogue is. Tone, emotion, context, impact, etc."*
  //
  // 🔑 MATCHED ON THE TAG, which the voice system already carries everywhere — so a new
  // line gets its presentation for free by being named honestly, and nothing has to be
  // registered twice. First match wins, so the list runs specific -> general.
  //
  // ⚠️ Deliberately FOUR. A bespoke presentation per god per tag is how this becomes
  // unmaintainable; these are tones, not costumes.
  var TONE = [
    // A threat, a death, a demand. It should land like one.
    [/threat|kill|death|died|demand|punish|betray|fail|warn|incoming|blood|mark_/,
      { shake: true, size: 1.15, seconds: 6 }],
    // A bargain being put to you. Longer, because you are meant to weigh it.
    [/offer|deal|contract|wager|trade|bargain|gift|reward|paid/,
      { background: true, seconds: 8 }],
    // Something said quietly - guidance, an aside, an observation.
    [/guidance|idle|ambient|muse|observe|greet|about_/,
      { italic: true, seconds: 5 }],
    // Everything else.
    [/./, { seconds: 5 }],
  ]

  function toneFor(tag) {
    var t = String(tag || '')
    for (var i = 0; i < TONE.length; i++) if (TONE[i][0].test(t)) return TONE[i][1]
    return { seconds: 5 }
  }

  // 🔑 ALIGNMENT IS PER PLAYER, NOT PER GOD. `GARBLED` is a registry of speakers who
  // arrive broken for everyone (the Stranger); this is a different question — *is this
  // god YOURS?* — and only broadcast.js asks it, for the reason given at its call site.
  //
  // ⚠️ FAILS OPEN. If the path system cannot answer, the text is READABLE. Unreadable
  // dialogue caused by a missing lookup is indistinguishable from unreadable dialogue
  // that was meant, and only one of those is a feature.
  function alignedTo(player, god) {
    try {
      if (!VELDORA.paths || typeof VELDORA.paths.pathOf !== 'function') return true
      var p = VELDORA.paths.pathOf(player)
      if (p === null || p === undefined) return false
      return String(p) === String(god)
    } catch (e) { return true }
  }

  // ════════════════════════════════════════════════════════════════════════
  // ⭐⭐ WHERE EACH GOD LIVES ON THE SCREEN. Ethan, 2026-08-30: *"each god have their
  // own speaking style."*
  //
  // 🔑 THIS MAKES **WHO IS SPEAKING** THE PRIMARY KEY, and the TONE table below only
  // modulates it. That is the right way round: a player learns where on the screen
  // their god lives, and the position becomes characterisation rather than decoration.
  // Blade looks DOWN at you from above; Art plants herself in the middle and blocks
  // your view. Same mechanism, opposite meaning.
  //
  // ⚠️⚠️ THE `y` SIGN, WRITTEN DOWN SO NOBODY RE-DERIVES IT (D-123 cost a whole
  // session to it). y grows DOWNWARD, as GUI space always does:
  //
  //     BOTTOM anchor -> y must be NEGATIVE to lift text UP into view
  //     TOP anchor    -> y must be POSITIVE to bring text DOWN into view
  //
  // A positive y on a BOTTOM anchor renders perfectly, off the bottom edge, where
  // nobody can see it. It does not error and it does not log.
  var STYLE = {}

  // Anything a god has not declared falls back to this - the pre-2026-08-30 behaviour,
  // so a god with no registered style is plain rather than broken.
  var DEFAULT_STYLE = { anchor: 'BOTTOM_CENTER', y: HOTBAR_LIFT }

  function setStyle(god, style) { STYLE[god] = style || null }
  function styleOf(god) { return STYLE[god] || DEFAULT_STYLE }

  // A scattered god gets a fresh position per line. Wall is "whispering into your
  // skull" and Forge rambles - neither should sit still.
  // A god's registered § colour as a real hex value, for the overlay. Falls back to
  // null - which means "let the mod pick" - rather than to a guess.
  function hexOfGod(god) {
    try {
      if (VELDORA.im && typeof VELDORA.im.hexFor === 'function') {
        return VELDORA.im.hexFor(colourOf(god))
      }
    } catch (e) { }
    return null
  }

  function scatterOf(st) {
    if (!st.scatter) return null
    var sp = st.scatter
    return {
      x: Math.round((Math.random() * 2 - 1) * (sp.x || 0)),
      y: Math.round((Math.random() * 2 - 1) * (sp.y || 0)),
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // ⭐ SENTENCE BY SENTENCE. Ethan: *"All dialogue should be typed and cut into
  // sentences that generate after each other."*
  //
  // 🔑 Split on the PUNCTUATION, keeping it - a sentence without its full stop reads
  // as a fragment, and Forge's whole character is short bursts with hard stops.
  //
  // ⚠️ Abbreviations are not special-cased. The pools are hand-written dialogue with
  // no "Mr." or "e.g." in them, and a regex that tried to be clever here would be a
  // new class of bug for no gain. If one ever appears, it splits early and looks odd -
  // it does not break.
  function sentences(text) {
    var t = String(text)
    var out = []
    var buf = ''
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i)
      buf += c
      if (c === '.' || c === '!' || c === '?') {
        // consume the run, so "..." and "?!" stay together
        while (i + 1 < t.length && '.!?'.indexOf(t.charAt(i + 1)) !== -1) {
          i++; buf += t.charAt(i)
        }
        if (i + 1 >= t.length || t.charAt(i + 1) === ' ') {
          out.push(buf.replace(/^\s+/, ''))
          buf = ''
        }
      }
    }
    var tail = buf.replace(/^\s+/, '').replace(/\s+$/, '')
    if (tail) out.push(tail)
    return out.length ? out : [String(text)]
  }

  // How long one sentence owns the screen before the next arrives. Scaled by length so
  // a short burst does not linger and a long line is not cut off mid-read.
  function beatFor(sentence) {
    var n = String(sentence).length
    return Math.max(30, Math.min(110, 25 + n * 2))   // ticks
  }

  function overlay(player, god, s, tag, opts) {
    try {
      if (!VELDORA.im || typeof VELDORA.im.show !== 'function') return false
      var o = toneFor(tag)
      // ⭐ THE GOD'S OWN STYLE FIRST, the tone only on top of it.
      var st = styleOf(god)
      var sc = scatterOf(st)
      var show = {
        anchor: st.anchor || 'BOTTOM_CENTER',
        y: (sc ? (st.y || 0) + sc.y : st.y),
        x: (sc ? sc.x : st.x),
        // ⭐ TYPING IS ON, AND THE SPEED WAS MEASURED. `/gd type` on 2026-08-30
        // showed a character costs a TICK, not a second - Ethan: "yes both tests works".
        //
        // ⚠️ The speed itself is NOT reachable from this route: the command hardcodes
        // typewriter(1.0f, false), and tickTypewriter reveals one character per
        // `1.0 / typewriterSpeed`. It happens to be usable at the hardcoded value. If a
        // slower, deliberate crawl is ever wanted - Wall's flat line in docs/75 asks for
        // exactly that - it needs the Java API, not this command.
        typewriter: TYPEWRITER,
        seconds: o.seconds,
        shake: !!(o.shake || st.shake),
        italic: !!(o.italic || st.italic),
        background: !!o.background,
        size: (typeof st.size === 'number') ? st.size : o.size,
        font: st.font,
        // 🔴 THE COLOUR COMES FROM THE REGISTRY, NOT FROM THE TEXT. im.show() sniffs a
        // leading § code, but garble.strip() runs FIRST and removes every code - so the
        // sniffer never saw one through this path and on-screen god dialogue has been
        // rendering colourless since the overlay was added. Nobody noticed because it
        // was not rendering at all (D-123).
        //
        // ⭐ colourOf() is already the one place that knows what colour a god is - the
        // registry that exists because every file used to hardcode Blade's red. Reading
        // it here is the same fix as setColour() was, applied to the second surface.
        color: st.color || hexOfGod(god),
        // ⭐ The mod obfuscates properly, so a garbled speaker does not need §k woven in
        // by hand for THIS surface. garble.js still owns the chat copy.
        obfuscate: GARBLED[god] ? 'RANDOM' : null,
      }
      if (opts) for (var k in opts) if (opts.hasOwnProperty(k)) show[k] = opts[k]
      return VELDORA.im.show(player, VELDORA.garble ? VELDORA.garble.strip(s) : s, show)
    } catch (e) { return false }
  }

  // ⭐ ONE LINE, DELIVERED AS SENTENCES. The chat copy stays whole - chat is the
  // record - and only the SCREEN is cut up, because that is where the pacing lives.
  //
  // ⚠️ A single-sentence line takes the direct path with no scheduling at all. Most
  // lines are one sentence, and routing them through a scheduler would add a frame of
  // latency and a failure mode to the common case for nothing.
  function speak(player, god, s, tag, opts) {
    try {
      var parts = sentences(s)
      if (parts.length < 2) return overlay(player, god, s, tag, opts)

      var server = null
      try { server = player.server } catch (e) { }
      if (!server) return overlay(player, god, s, tag, opts)

      var first = overlay(player, god, parts[0], tag, opts)
      var at = 0
      for (var i = 1; i < parts.length; i++) {
        at += beatFor(parts[i - 1])
        ;(function (part, delay) {
          try {
            server.scheduleInTicks(delay, function () {
              try { overlay(player, god, part, tag, opts) } catch (e) { }
            })
          } catch (e) { }
        })(parts[i], at)
      }
      return first
    } catch (e) { return false }
  }

  function say(player, god, tag) {
    if (silenced(player, god)) return false
    var s = line(god, tag, player)
    if (!s) return false
    try { player.tell(Text.of(paint(player, god, s))) } catch (e) { return false }
    speak(player, god, s, tag)       // ⚠️ additive - a failure here costs nothing
    chime(player, god, tag)
    return true
  }

  // Substitution for lines that name somebody - the Mark uses {target}.
  function sayAbout(player, god, tag, subs) {
    if (silenced(player, god)) return false
    var s = line(god, tag, player)
    if (!s) return false
    if (subs) for (var k in subs) {
      if (subs.hasOwnProperty(k)) s = s.split('{' + k + '}').join(String(subs[k]))
    }
    try { player.tell(Text.of(paint(player, god, s))) } catch (e) { return false }
    // 🔴 THIS LINE DID NOT EXIST, and that was the biggest hole in the transfer.
    // `say()` has had an overlay since 08-29; `sayAbout()` never did — so the Mark,
    // the contract offer and the incoming warning were chat-only while every other
    // god line was on screen. Three of the most consequential lines in the game,
    // silently on the older surface, and nothing distinguished them from a god who
    // simply had nothing to say.
    speak(player, god, s, tag)       // ⚠️ additive - a failure here costs nothing
    chime(player, god, tag)
    return true
  }

  // ⭐ THE INTERIOR LINES. A coverage audit on 2026-08-30 found three files emitting
  // real dialogue straight to chat, never reaching the overlay:
  //
  //   whispers.js   the refrains and intrusive thoughts   `§8§o*like this*`
  //   stalker.js    its lines and the fragments it leaves
  //   pathless.js   FEELINGS / HOW / BODY - what it is like to walk no path
  //
  // 🔑 THESE ARE NOT GOD DIALOGUE and must not be dressed as it. Nobody is addressing
  // you — it is your own head, so there is no speaker, no god colour, no chime, and no
  // tone table. Italic and quiet, at the same place on screen, and that is all.
  //
  // ⚠️ It takes NO god, deliberately. Routing these through say() would have given them
  // a colour, a chime and a silencing rule that none of them should have.
  function aside(player, s, opts) {
    try {
      if (!VELDORA.im || typeof VELDORA.im.show !== 'function') return false
      var show = {
        anchor: 'BOTTOM_CENTER',
        y: HOTBAR_LIFT,
        typewriter: TYPEWRITER,
        italic: true,
        seconds: 5,
        color: '#AAAAAA',
      }
      if (opts) for (var k in opts) if (opts.hasOwnProperty(k)) show[k] = opts[k]
      return VELDORA.im.show(player, VELDORA.garble ? VELDORA.garble.strip(s) : s, show)
    } catch (e) { return false }
  }

  VELDORA.voice = {
    setGarbled: setGarbled,
    garbled: function (god) { return !!GARBLED[god] },
    aside: aside,
    // ⭐ Published for broadcast.js so the bickering exchange gets the same surface,
    // the same tones and the same hotbar lift as every other god line - rather than a
    // second copy of this that drifts. The overlay is the god dialogue system now.
    overlay: overlay,
    speak: speak,
    setStyle: setStyle,
    styleOf: styleOf,
    sentences: sentences,
    alignedTo: alignedTo,
    toneFor: toneFor,
    hotbarLift: function () { return HOTBAR_LIFT },
    register: register,
    setColour: setColour,
    colourOf: colourOf,
    registerLines: registerLines,
    line: line,
    say: say,
    sayAbout: sayAbout,
    pools: POOLS,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // ------------------------------------------------------------------
    // /gd - the god dialogue pass, testable without waiting for the game to
    // produce each case. Ethan, 2026-08-30: "throw in test commands aswell."
    //
    // Every subcommand drives the REAL overlay() with a real tag, so what you see is
    // what a god would actually produce - not a mock that can drift away from it.
    // ⭐ TEST DURATIONS ARE LONG ON PURPOSE. Ethan, 2026-08-30: "for the command
    // messages they should last alot longer for testing purposes."
    //
    // ⚠️ This overrides ONLY the duration, and only for /gd. The tone table keeps its
    // real gameplay values (6s weight, 8s bargain, 5s quiet) - a test that changed the
    // thing being tested would be measuring itself.
    var TEST_SECONDS = 45
    function shot(label, god, tag, text) {
      return Commands.literal(label).executes(function (ctx) {
        var p = ctx.source.player
        var okd = overlay(p, god, text, tag, { seconds: TEST_SECONDS })
        p.tell(Text.of('§8' + label + ' §7tag=§f' + tag +
          ' §8-> §f' + (okd ? 'sent' : 'FAILED')))
        return 1
      })
    }
    event.register(Commands.literal('gd').requires(ADMIN)
      // one per tone, so the table is visible rather than described
      .then(shot('weight', 'blade', 'mark_declare',
        'You are marked. Everything that follows is a consequence.'))
      .then(shot('bargain', 'salvage', 'contract_offer',
        'Something wonderful, and it will cost you almost nothing.'))
      .then(shot('quiet', 'art', 'guidance',
        'Go further out. You are not far enough for me to reach.'))
      .then(shot('plain', 'forge', 'nothing_matching',
        'This one matches no tone and should render plain.'))
      // the interior surface - no god, no colour, no chime
      // ⭐ ONE PER GOD, added as each is styled. Ethan wanted the pass done god by god
      // so he can refine the writing alongside it, so each of these is a standalone
      // check of ONE god's placement and manner.
      .then(Commands.literal('blade').executes(function (ctx) {
        var p = ctx.source.player
        speak(p, 'blade',
          'You are marked. Everything that follows is a consequence. I did warn you.',
          'mark_declare', { seconds: TEST_SECONDS })
        var st = styleOf('blade')
        p.tell(Text.of('\u00a78blade \u00a77-> \u00a7f' + st.anchor + ' y=' + st.y +
          '\u00a78, 3 sentences in sequence, typed'))
        return 1
      }))
      .then(Commands.literal('aside').executes(function (ctx) {
        var p = ctx.source.player
        var okd = aside(p, 'You have been holding your breath again.',
          { seconds: TEST_SECONDS })
        p.tell(Text.of('§8aside -> §f' + (okd ? 'sent' : 'FAILED')))
        return 1
      }))
      // ⭐ THE ONE THAT NEEDS TWO STATES. Shows the same line as YOUR god and as
      // one that is not, so the bickering rule can be seen rather than reasoned about.
      .then(Commands.literal('bicker').executes(function (ctx) {
        var p = ctx.source.player
        var mine = null
        try { mine = VELDORA.paths && VELDORA.paths.pathOf(p) } catch (e) { }
        var other = null
        for (var g in COLOUR) { if (COLOUR.hasOwnProperty(g) && g !== mine) { other = g; break } }
        p.tell(Text.of('§8your path: §f' + (mine || 'NONE') +
          '§8   other: §f' + (other || 'none registered')))
        if (mine) {
          overlay(p, mine, 'This one is yours and should read clean.', 'about_' + mine,
            alignedTo(p, mine) ? { seconds: TEST_SECONDS }
                               : { seconds: TEST_SECONDS, obfuscate: 'RANDOM' })
        }
        if (other) {
          var delay = mine ? 40 : 0
          p.server.scheduleInTicks(delay, function () {
            overlay(p, other, 'This one is not yours and should be garbled.',
              'about_' + other, alignedTo(p, other)
                ? { seconds: TEST_SECONDS }
                : { seconds: TEST_SECONDS, obfuscate: 'RANDOM' })
          })
        }
        if (!mine) p.tell(Text.of('§8pathless, so EVERY god garbles - that is correct'))
        return 1
      }))
      // position check - the reason this needs eyes on it at all
      // 🔴 A SWEEP, NOT A SINGLE SHOT - and it earned its keep immediately.
      // Every /gd rendered nothing on the first test while /im worked, and the only
      // difference was that /gd sets `y`. My reasoning from the bytecode said a
      // positive y from a BOTTOM anchor pushes the line off the bottom edge. WRONG:
      // the sign is ignored entirely, y is a magnitude, and +40 was simply too small
      // a lift - the line sat behind the hearts and the hotbar.
      //
      // 🔑 The sweep answered in one command what two rounds of reading the jar
      // got wrong. Keep it; the next person to move this text will need it too.
      //
      // ⚠️ THE CONTROL MATTERS MOST. The first line uses NO y at all. If that one
      // is also invisible then y is not the problem and the fault is elsewhere -
      // without it, "nothing showed" cannot tell those two apart.
      // ⭐ THE MEASUREMENT. One character is revealed per `1.0 / speed`, and the
      // command hardcodes speed 1.0 - so this answers whether that unit is a TICK
      // (0.05s, effect is free) or a SECOND (effect is unusable from the command).
      .then(Commands.literal('type').executes(function (ctx) {
        var p = ctx.source.player
        var line = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        VELDORA.im.show(p, 'CONTROL no typewriter - ' + line,
          { anchor: 'TOP_CENTER', seconds: 30 })
        VELDORA.im.show(p, 'TYPING 30s - ' + line,
          { anchor: 'TOP_CENTER', y: 40, seconds: 30, typewriter: true })
        VELDORA.im.show(p, 'TYPING 6s - ' + line,
          { anchor: 'TOP_CENTER', y: 80, seconds: 6, typewriter: true })
        p.tell(Text.of('§8Three lines, 26 letters each, at the TOP of the screen.'))
        p.tell(Text.of('§8If TYPING 30s finishes the alphabet, a character is a TICK'))
        p.tell(Text.of('§8and typing is usable. If it crawls a letter a second, it is not.'))
        return 1
      }))
      .then(Commands.literal('place').executes(function (ctx) {
        var p = ctx.source.player
        VELDORA.im.show(p, 'CONTROL - no y at all, top of screen',
          { anchor: 'TOP_CENTER', seconds: TEST_SECONDS })
        var YS = [-80, -60, -40, -20, 0, 20, 40]
        for (var i = 0; i < YS.length; i++) {
          (function (yv) {
            VELDORA.im.show(p, 'y = ' + yv,
              { anchor: 'BOTTOM_CENTER', y: yv, seconds: TEST_SECONDS, typewriter: false })
          })(YS[i])
        }
        p.tell(Text.of('§8Look at the screen. Whichever §fy = N§8 sits just above'))
        p.tell(Text.of('§8the hotbar is the value. Current §fHOTBAR_LIFT = ' + HOTBAR_LIFT))
        p.tell(Text.of('§8If even CONTROL is invisible, y is NOT the problem.'))
        return 1
      }))
      .executes(function (ctx) {
        var p = ctx.source.player
        p.tell(Text.of('§8/gd §fweight bargain quiet plain aside bicker place type§8 | gods: §fblade'))
        p.tell(Text.of('§8tones are matched on the TAG; lift=§f' + HOTBAR_LIFT +
          '§8  test duration=§f' + TEST_SECONDS + 's'))
        return 1
      }))

    // Read a tag out loud. The only honest way to review combinatorial writing is
    // to see the JOINS, not the fragments - a pool can look fine and pair badly.
    event.register(Commands.literal('voice').requires(ADMIN)
      .then(Commands.argument('god', event.arguments.STRING.create(event))
        .then(Commands.argument('tag', event.arguments.STRING.create(event))
          .executes(function (ctx) {
            var p = ctx.source.player
            if (!p) return 0
            var god = ctx.getArgument('god', Java.loadClass('java.lang.String'))
            var tag = ctx.getArgument('tag', Java.loadClass('java.lang.String'))
            var g = POOLS[god]
            if (!g || !g[tag]) {
              p.tell(Text.of('§cno pool for ' + god + '/' + tag))
              var have = []
              for (var k in POOLS) if (POOLS.hasOwnProperty(k)) {
                for (var t in POOLS[k]) if (POOLS[k].hasOwnProperty(t)) have.push(k + '/' + t)
              }
              p.tell(Text.of('§8registered: ' + (have.join(', ') || 'nothing')))
              return 0
            }
            var pool = g[tag]
            p.tell(Text.of('§8§m                                        '))
            p.tell(Text.of('§6' + god + '/' + tag + ' §8- ' +
              (pool.whole ? pool.opens.length + ' whole lines'
                          : pool.opens.length + ' x ' + pool.closes.length + ' = ' +
                            (pool.opens.length * pool.closes.length) + ' possible')))
            for (var i = 0; i < 8; i++) {
              p.tell(Text.of((COLOUR[god] || DEFAULT_COLOUR) + line(god, tag, null)))
            }
            return 1
          }))))
  })

  // 🚨 REPORTED ONE TICK LATE, like godevents and harvest.
  // ServerEvents.loaded fires in SCRIPT LOAD ORDER and this file sorts before every
  // <god>_voice.js - so counting here counted only the gods that happened to load
  // first. It printed "828 possible lines" on the boot where the Spider had just
  // gained 624 of her own, because none of hers existed yet when it looked.
  // One tick is after every loaded handler and long before anybody speaks.
  ServerEvents.loaded(function (event) {
    event.server.scheduleInTicks(1, function () { report() })
  })

  function report() {
    var gods = 0, tags = 0, total = 0
    for (var g in POOLS) {
      if (!POOLS.hasOwnProperty(g)) continue
      gods++
      for (var t in POOLS[g]) {
        if (!POOLS[g].hasOwnProperty(t)) continue
        tags++
        var pp = POOLS[g][t]
        total += pp.whole ? pp.opens.length : (pp.opens.length * pp.closes.length)
      }
    }
    console.info(TAG + 'VELDORA.voice published OK - ' + gods + ' god(s), ' + tags +
      ' tag(s), ' + total + ' possible lines')
    if (!gods) console.warn(TAG + 'no pools registered yet - every god is silent ' +
      'through this file. That is the expected state until content lands.')
  }
})();
