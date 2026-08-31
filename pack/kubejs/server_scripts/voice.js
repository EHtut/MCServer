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
    // ⚠️ Fragments too. A drafted OPEN joined to a written CLOSE is still a placeholder
    // on somebody's screen, and the combinatorial engine would hide it in 1-in-N.
    if (opens && closes) {
      opens = undrafted(god, tag + '/opens', opens)
      closes = undrafted(god, tag + '/closes', closes)
    }
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
  // ⭐⭐ A PLACEHOLDER NEVER REACHES A PLAYER.
  //
  // 🔴 Ethan, 2026-08-30: *"there are lines playing that say [Claude-draft] lines playing
  // across liam's screen."* 113 of them are registered across twelve files, and every one
  // was reachable. Somebody who is not building this game read my scaffolding as content.
  //
  // 🔑 THE RULE WAS ALREADY WRITTEN, in salvage_voice.js's header, and I did not enforce
  // it: *"A placeholder line is worse than an empty pool - it anchors the writing and gets
  // mistaken for content later. Empty is honest, and the boot log shouts about it."*
  //
  // 🔴 THE FIRST VERSION OF THIS DELETED THE LINES, AND THAT WAS WRONG. Filtering them out
  // silenced whole pools that are entirely draft - `warn_incoming` for blade and wall, and
  // Wall's crashout. ⚠️ A SILENCED WARNING IS WORSE THAN A VISIBLE PLACEHOLDER: the tag is
  // embarrassing, a warning that does not arrive is a player dying to something the game
  // promised to tell them about.
  //
  // ⭐ Three harnesses caught it within a minute of the change - warn, crashout_two and
  // grudge - which is the only reason it is not live right now.
  //
  // 🔑 SO THE MARKER IS STRIPPED, NOT THE LINE. The scaffolding stops being visible; every
  // system keeps working; nothing goes quiet. The debt does not disappear either - the
  // boot log counts what is still unwritten, so it stays a number somebody can see rather
  // than a tag a player reads.
  //
  // ⛔ Stripped at REGISTRATION, not at the point of speaking. Several things read pools
  // directly, and a marker that survives into the pool can escape through any of them.
  var DRAFT_MARK = '[CLAUDE-DRAFT]'
  var draftSilenced = []

  function undrafted(god, tag, lines) {
    var out = [], n = 0
    for (var i = 0; i < lines.length; i++) {
      var t = String(lines[i])
      var at = t.indexOf(DRAFT_MARK)
      if (at !== -1) {
        n++
        t = (t.substring(0, at) + t.substring(at + DRAFT_MARK.length))
          .replace(/^\s+/, '').replace(/\s+$/, '')
      }
      if (t) out.push(t)
    }
    if (n) draftSilenced.push(god + '/' + tag + ' ' + n + '/' + lines.length)
    return out
  }

  function registerLines(god, tag, lines) {
    if (!lines || !lines.length) {
      console.error(TAG + 'refusing to register ' + god + '/' + tag + ' - empty')
      return false
    }
    lines = undrafted(god, tag, lines)
    if (!lines.length) return false
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
  // ⛔⛔ OFF AGAIN, 2026-08-30, AND THE MEASUREMENT THAT TURNED IT ON WAS MINE AND WRONG.
  //
  // Ethan, from play: *"Text still fades before it fully plays out. Pretty much every
  // scene gets 1 or 2 characters then gone."*
  //
  // 🔴 THE ARITHMETIC IS UNAMBIGUOUS. A real emitted command:
  //
  //     sendcustom Rehykt {...,typewriter:1b} 2.6 Do not run deeper.
  //
  // Eighteen characters, 2.6 seconds, and he sees one or two of them.
  //
  // ⚠️ THIS WAS READ AS "~1 character per second" AND THAT WAS ALSO WRONG. It was an
  // inference from a symptom, made while the only instrument was broken. When that was
  // fixed - one message, nothing else queued - 50 characters took "a few seconds", so the
  // real rate is usable and typing is ON. The symptom had another cause entirely: three
  // messages were queued and the one on screen was not the one being timed.
  //
  // 🚨 HOW THE WRONG NUMBER GOT WRITTEN DOWN. This file claimed *"the speed WAS MEASURED.
  // /gd type on 2026-08-30 showed a character costs a TICK, not a second - Ethan: 'yes
  // both tests works'."* That confirmation was him answering about the Y-SIGN fix in a
  // different message. I attached it to the typing test, wrote it up as a measurement,
  // and every duration in this file was then built on it.
  //
  // ⚠️ A QUOTED CONFIRMATION IS EVIDENCE OF WHATEVER IT WAS ACTUALLY ANSWERING. Attaching
  // one to the nearest open question is how a guess acquires a citation - and a cited
  // guess is harder to dislodge than an uncited one, because the next reader stops
  // checking.
  //
  // ⛔ AND THE SPEED IS NOT TUNABLE. `sendcustom` hardcodes `typewriter(1.0f, false)`;
  // reflection into the mod is dead (D-123). So this is not "slow typing", it is no
  // usable typing at all from this route, and the only honest state is off.
  //
  // 🔑 TO RE-TEST: `/gd type` sends 26 letters at 30s and at 6s. If the 6s line finishes
  // the alphabet, the rate is usable and this may flip. If it shows six letters, it is a
  // character a second and it may not. That command exists for exactly this question and
  // should have been read before this was ever set true.
  var TYPEWRITER = true

  // ⭐⭐ HOW FAST IT TYPES, AS ONE NUMBER — because it has never been measured precisely
  // and this is the honest way to hold a value you are unsure of.
  //
  // Ethan, 2026-08-30, from the first instrument that could actually answer: 50 characters
  // "takes a few seconds". That is roughly 15 a second, and it is an ESTIMATE from an
  // eyeball reading with a queue backlog in the way — not a measurement.
  //
  // 🔑 EVERY DURATION IS DERIVED FROM THIS, so refining it is one edit rather than a
  // sweep. If lines start finishing early, raise it; if they truncate, lower it.
  //
  // ⚠️ THREE NUMBERS FOR THIS RATE HAVE NOW BEEN WRONG - "a character a tick" (a
  // misattributed quote), "a character a second" (inferred from a symptom), and the
  // instrument meant to settle it sent three messages into a one-at-a-time queue so the
  // control blocked both typed lines. Treat this one as provisional too, and prefer a
  // reading over an argument.
  var TYPE_CHARS_PER_SEC = 15

  // ⭐ THE MINIMUM ANY LINE STAYS ON SCREEN, in ticks.
  //
  // 🔴 200 (10s) -> 140 (7s) -> 240 (12s). He tried seven in play and it was too quick:
  // *"increase back to 10-15 seconds again for dialogue."* Twelve sits in the middle of
  // the band he named twice, which is the value to keep unless play says otherwise.
  //
  // ⚠️ SCALED BY beatScale PER GOD - see beatFor. That is what makes Forge quick without
  // making anyone else quick, and without touching the typing rate, which is fixed.
  var MIN_ON_SCREEN = 240

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
  // 🔴🔴 -60 -> -170. Ethan, from play 2026-08-30:
  //     *"anything that crosses against the chat bar is no longer rendered."*
  //
  // ⚠️ NOT CLIPPED - NOT RENDERED AT ALL. A line overlapping the chat region silently
  // does not appear, which is the worst failure shape this project has: it looks
  // identical to a god having nothing to say. Every earlier "it didn't show" may have
  // been this rather than a duration.
  //
  // 🔑 The interior voice sat 60px off the bottom, which is squarely in it. Lifted clear
  // while staying LOW - being near the hotbar is the characterisation (it is your own
  // head, not a god above you), so the fix is height, not a different anchor.
  var HOTBAR_LIFT = -170

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

  // ══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ COLOUR IS EMPHASIS NOW, NOT IDENTITY.
  //
  // Ethan, 2026-08-30, on first seeing the fonts actually render:
  //     "God colors need to go away, color will only be used for emphasis now."
  //
  // 🔑 THE FONTS ARE WHAT CHANGED. No god font had ever rendered until 13:18 that day
  // (D-130 - every provider was rejected for a doubled `font/`), so a standing colour
  // was carrying identity by itself. Now Cinzel, Cormorant, Metamorphous and Rye do
  // that, and a permanent per-god colour spends the loudest signal on the one thing the
  // typeface already says.
  //
  // ⚠️ NULL MEANS "LET THE MOD PICK", NOT WHITE-BY-HARDCODE. immersive.js omits the tag
  // entirely when there is no colour, and the mod's own default is white. Writing
  // #FFFFFF here would be a colour decision wearing the costume of no decision.
  //
  // ⭐ EMPHASIS STILL GETS THROUGH, and that is the whole point of the rule rather than
  // an exception to it - a per-CALL `color` still wins, so a moment that means something
  // can still be coloured. The crashout's flat line is dark red for exactly that reason.
  // What is gone is colour that is true of a god permanently, which says nothing.
  //
  // 🔴 THE SCREEN ONLY. The chat copy keeps colourOf(god): chat has no fonts, so colour
  // is the only thing separating speakers in a scrolling record. That distinction was
  // already drawn in blade_voice.js when he went white alone, and this ruling extends
  // the screen half of it to everyone - it does not reach chat.
  function overlayColour(god, st, o) {
    if (st && st.color) return st.color        // a god may still ask, deliberately
    if (o && o.color) return o.color           // a moment may still ask, deliberately
    return null
  }

  // ⭐⭐ NOTHING MAY LAND ON THE CROSSHAIR. Ethan, from play 2026-08-30:
  //     *"We cannot have any text be on the cross hair, or across the cross hair,
  //      that is unreadable."*
  //
  // 🔴 AND IT WAS ALWAYS GOING TO HAPPEN. A CENTER_CENTER anchor puts text at the exact
  // middle of the screen, which is precisely where the crosshair is - so a scatter box
  // centred on the origin does not merely sometimes clip it, it is CENTRED on it. The
  // most likely single position was the one unreadable position.
  //
  // 🔑 THE FIX IS A DEAD BAND, NOT A SMALLER BOX. Shrinking the scatter would push every
  // line closer to the middle, which is worse. Instead the vertical result is pushed OUT
  // of a central band: a line is thrown either clearly above or clearly below, never
  // through it. The horizontal spread is untouched, because a line to the left or right
  // of the crosshair is perfectly readable - it is only the vertical overlap that ruins
  // it, since text is a horizontal band.
  var CROSSHAIR_BAND = 34

  // 🔴 THE CHAT BAR EATS ANYTHING THAT OVERLAPS IT (2026-08-30, from play). A scattered
  // line thrown far enough DOWN lands in that region and is never drawn - so the box is
  // asymmetric now: it may go as high as it likes and only so low.
  //
  // ⚠️ Asymmetric ON PURPOSE. Shrinking the box evenly would pull every line toward the
  // crosshair, which is the other thing that must not happen; the two constraints push
  // in opposite directions and only an asymmetric box satisfies both.
  var CHAT_FLOOR = 60        // max distance BELOW centre a line may be thrown

  // ⭐⭐ THE BIOME TITLE IS TERRAIN, AND THE GODS GO AROUND IT. Ethan, 2026-08-30:
  // *"Turn travelers titles back on instead make god dialogue move around it."*
  //
  // 🔴 MY FIRST ATTEMPT MOVED THE TITLES, AND THAT WAS THE WRONG WAY ROUND. Traveler's
  // Titles draws biome names centred at y=-33 (size 2.1) and dimension names at y=-32
  // (size 3.0), straight through art, forge and wall. I shifted the mod's config to -200
  // and Ethan overruled it: the mod is a feature he chose, and it is not the thing that
  // should give way. **Ours is the layer that knows how to move.**
  //
  // 🔑 SO IT IS A SECOND DEAD BAND, exactly like the crosshair one above. The numbers
  // come from that mod's own config: a 27px dimension title centred on -32 spans roughly
  // -46..-18, and our own line is ~14px tall at SIZE_BOOST, so the keep-out is that span
  // widened by half a line each way.
  //
  // ⚠️ THESE NUMBERS ARE COUPLED TO A CONFIG WE DO NOT OWN. `tools/hud_zone_check.py`
  // reads the live travelerstitles config and fails if it has moved out from under this
  // band - because a dead band aimed at where a title USED to be is worse than none: it
  // costs screen space and protects nothing.
  var TITLE_BAND = { lo: -53, hi: -11 }

  function keepOuts() {
    return [
      { lo: -CROSSHAIR_BAND, hi: CROSSHAIR_BAND },   // the crosshair
      { lo: TITLE_BAND.lo, hi: TITLE_BAND.hi },      // the biome / dimension title
    ]
  }

  // 🔴 IT RESAMPLES FROM THE ALLOWED SPACE; IT DOES NOT SHOVE THE VALUE TO AN EDGE.
  //
  // The obvious implementation - "if it landed in a band, push it to the nearer edge" -
  // was measured over 200k throws and **55.6% of Wall's lines piled into one 20px strip**.
  // Of course they did: everything ejected from a band lands on that band's rim. A row of
  // text reappearing at a fixed height reads as a rendering fault, which is the very thing
  // scatter exists to avoid, so the cure was producing the disease.
  //
  // 🔑 Building the allowed intervals and picking uniformly by LENGTH is both simpler and
  // correct. It also degrades honestly: if the bands ever eat the whole box, there is no
  // allowed interval to pick from and the value is left where it was rather than being
  // silently jammed against an edge - see the fallback at the end.
  function dodgeCrosshair(y, reach) {
    var r = Math.abs(reach) || CROSSHAIR_BAND
    var bands = keepOuts()

    // ⚠️ THE BOX IS ASYMMETRIC. It may go as high as the god's reach allows and only as
    // low as the chat bar, which eats anything overlapping it.
    var lo = -r, hi = Math.min(r, CHAT_FLOOR)

    // Cut the keep-outs out of [lo, hi].
    var free = [{ lo: lo, hi: hi }]
    for (var b = 0; b < bands.length; b++) {
      var next = []
      for (var f = 0; f < free.length; f++) {
        var seg = free[f], band = bands[b]
        if (band.hi <= seg.lo || band.lo >= seg.hi) { next.push(seg); continue }
        if (band.lo > seg.lo) next.push({ lo: seg.lo, hi: band.lo })
        if (band.hi < seg.hi) next.push({ lo: band.hi, hi: seg.hi })
      }
      free = next
    }

    var total = 0
    for (var s = 0; s < free.length; s++) total += Math.max(0, free[s].hi - free[s].lo)

    // 🚨 NO ROOM IS A REAL OUTCOME, NOT AN ERROR TO PAPER OVER. A god whose whole box is
    // inside the keep-outs gets her original value back and the boot audit is where that
    // should be caught - inventing a position here would hide it.
    if (total <= 0) return y

    var pick = Math.random() * total
    for (var k = 0; k < free.length; k++) {
      var w = Math.max(0, free[k].hi - free[k].lo)
      if (pick < w) return Math.round(free[k].lo + pick)
      pick -= w
    }
    return Math.round(free[free.length - 1].hi)
  }

  function scatterOf(st) {
    if (!st.scatter) return null
    var sp = st.scatter
    return {
      x: Math.round((Math.random() * 2 - 1) * (sp.x || 0)),
      y: dodgeCrosshair(Math.round((Math.random() * 2 - 1) * (sp.y || 0)), sp.y || 0),
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
  //
  // ⭐ A GOD CAN SET ITS OWN PACE. Ethan wants Forge *"more akin to rambling"*, and
  // rambling is not only shorter sentences - it is sentences arriving faster than you
  // can finish considering the last one. Her existing lines already average 2.41
  // sentences each, so the delivery already breaks them up; `beatScale` is what makes
  // that read as a tumble rather than a list.
  //
  // ⚠️ THE FLOOR IS NOT SCALED. Below about half a second a sentence is gone before it
  // can be read, and "unreadable" is not a personality - it is a bug that looks like one.
  // 🔴🔴 REWRITTEN 2026-08-30. THE OLD FORMULA CUT LONG LINES OFF MID-WORD.
  //
  // Ethan, from play: *"the text frequently fades before the full line is spoken. 1-5s
  // depending on the line up to 10s. Art talks slowly, same with caebrim which means they
  // get cut off sooner."*
  //
  // It was `max(30, min(110, 25 + n * 2))` — a READING estimate, written before the
  // typewriter was switched on, and never revisited afterwards. Typing costs ONE TICK PER
  // CHARACTER (measured), so the 110-tick ceiling was below the typing cost of anything
  // over 110 characters:
  //
  //     110 chars -> types 110t, given 110t   ZERO reading time
  //     161 chars -> types 161t, given 110t   fades 2.5s BEFORE it finishes typing
  //
  // The longest line in the game is 161 characters and the 90th percentile is 95, which
  // is exactly why this looked fine: most lines are short enough to survive it, and the
  // tail — the long, slow, deliberate lines — was the half that broke.
  //
  // ⚠️ AND IT HIT ART AND CAEBRIM HARDEST, precisely as he noticed. Not because they are
  // "slow" in any setting — the typewriter speed is fixed and unreachable — but because
  // their lines are the longest, and the ceiling punished length.
  //
  // ⭐⭐ SO DURATION IS NOW TWO THINGS ADDED, NOT ONE THING CAPPED:
  //
  //     typing   n ticks. NOT optional, NOT negotiable, NOT scaled.
  //     reading  time to absorb it AFTER it has finished appearing.
  //
  // 🚨 `beatScale` SCALES ONLY THE READING HALF. Scaling the typing half is what a
  // "faster" god would appear to want and it would guarantee her lines are cut off —
  // Forge is 0.6, so under the old formula her pace setting was actively truncating her.
  // A pace dial must never be able to make a line unreadable.
  //
  // ⚠️ The reading tail is CAPPED, unlike the typing half. You read a long line while it
  // types, so the tail is about finishing the last clause, not re-reading the whole
  // thing — without the cap a 161-character line would sit on screen for 15 seconds.
  // ⭐⭐ ONE KNOB FOR HOW BIG EVERY GOD IS.
  //
  // Ethan, from play 2026-08-30: *"text needs to be bigger, right now it's too thin and
  // you need to squint to see it."*
  //
  // 🔑 A MULTIPLIER, NOT FIVE EDITED NUMBERS. The relative sizes are a design — Art is
  // the loudest presence, Forge the smallest because she is chattering rather than
  // proclaiming — and editing each god's file to fix a global legibility problem would
  // flatten that by hand and lose the intent. This scales all of them and keeps the
  // shape, so the next adjustment is one number rather than another five-file sweep.
  //
  // ⚠️ IT REACHES THE CRASHOUT TOO. Those add a fixed bump to the god's own size, so the
  // boost is applied AFTER the bump rather than to the base - otherwise the loudest
  // moment in the game would be the one thing that did not get bigger.
  var SIZE_BOOST = 1.5

  function sized(n) {
    var v = (typeof n === 'number' && isFinite(n)) ? n : 1
    return Math.round(v * SIZE_BOOST * 100) / 100
  }

  function beatFor(sentence, st) {
    var n = String(sentence).length
    // ⚠️ `typing` is 0 while TYPEWRITER is off, and the term stays here on purpose: the
    // day it flips back, the duration has to account for it again or long lines truncate
    // exactly as they did before. Deleting it would remove the fix along with the symptom.
    // Typing time in TICKS, from the measured-ish rate. ⚠️ Never scaled by beatScale:
    // a pace dial that shortens the typing half guarantees a line is cut off mid-word.
    var typing = TYPEWRITER ? Math.round(n * 20 / TYPE_CHARS_PER_SEC) : 0
    var read = 30 + Math.min(90, Math.round(n * 0.9))
    var k = (st && typeof st.beatScale === 'number') ? st.beatScale : 1
    // ⭐⭐ A FLOOR, NOT A SCALE. Ethan, 2026-08-30: *"right now text stays for like 1-2
    // seconds. For text with animation that means it either fails to decode itself or it
    // shows up and vanishes instantly... 10-15 seconds is probably a good test part."*
    //
    // 🔑 SHORT LINES WERE THE PROBLEM, and scaling could never have fixed them. "Sister."
    // is seven characters: typing plus reading came to ~2.2s, which is correct as
    // arithmetic and useless as a duration, because an ANIMATION has a cost that has
    // nothing to do with how long the text is. A typewriter needs time to run and the
    // mod's obfuscate needs time to DECODE - both are fixed overheads, so the answer is a
    // minimum time on screen rather than a bigger multiplier.
    //
    // ⚠️ It is a MAX against the computed value, so long lines are untouched: a
    // 123-character sentence still gets its full time and is not clipped to the floor.
    //
    // ⭐⭐ AND THE FLOOR IS SCALED PER GOD. Ethan: *"forge needs to talk faster like an
    // excited child, her lines type incredibly fast."*
    //
    // 🔑 THE TYPING RATE CANNOT BE CHANGED - it is fixed in the mod and unreachable
    // (D-123, confirmed twice). So "faster" cannot mean faster characters; it has to
    // mean LESS TIME SITTING THERE once the words have arrived. Scaling her floor is
    // what does that: at 0.45 her beats clear in about three seconds while everyone
    // else holds seven, so she tumbles and they do not.
    //
    // 🚨 THE FLOOR IS SCALED, THE TYPING IS NOT. A pace dial that ate into typing time
    // would cut her off mid-word - which is exactly what the old formula did to her.
    var floor = Math.round(MIN_ON_SCREEN * k)
    return Math.max(floor, typing + Math.max(15, Math.round(read * k)))
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
        // ⭐ TYPING IS ON. The rate is whatever the mod does by default, and the only
        // reading ever taken of it is Ethan's: 50 characters "takes a few seconds", which
        // is roughly the 15/sec in TYPE_CHARS_PER_SEC. That is an ESTIMATE and is labelled
        // as one everywhere it is used.
        //
        // ⛔ THE SPEED IS NOT SETTABLE, by any route. `sendcustom` has no typewriterSpeed
        // tag key (read from ImmersiveMessagesCommands, not guessed), the direct Java call
        // fails because Rhino will not expose statics on a loaded class, and reflection
        // via Class.getMethod fails the same way - it cannot reach java.lang.Class either.
        // /improbe tested all of it. Changing the rate needs a client mixin or a fork.
        //
        // 🚨 THIS COMMENT PREVIOUSLY CLAIMED THE SPEED "WAS MEASURED" and cited Ethan
        // saying "yes both tests works" - a confirmation he gave about the Y-SIGN fix, in
        // a different message. It survived here for hours AFTER being corrected forty
        // lines up, because that fix went to the mention being read rather than to every
        // instance. A sweep is done when the tree is empty.
        typewriter: TYPEWRITER,
        seconds: o.seconds,
        // 🔑 A GOD'S STYLE OVERRIDES ITS TONE, INCLUDING TO SWITCH SOMETHING OFF.
        // This was `o.shake || st.shake`, which could only ever ADD - so the `weight`
        // tone forced a shake onto Art, who is characterised by NOT moving. Shaking
        // reads as panic; she plants herself in the middle and does not flinch.
        //
        // ⚠️ `hasOwnProperty`, not truthiness: a style that says `shake: false` is
        // stating something, and `||` cannot tell that apart from saying nothing.
        shake: !!(st.hasOwnProperty('shake') ? st.shake : o.shake),
        italic: !!(st.hasOwnProperty('italic') ? st.italic : o.italic),
        wave: !!st.wave,
        bold: !!st.bold,
        background: !!o.background,
        size: sized((typeof st.size === 'number') ? st.size : o.size),
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
        color: overlayColour(god, st, o),
        // ⭐ The mod obfuscates properly, so a garbled speaker does not need §k woven in
        // by hand for THIS surface. garble.js still owns the chat copy.
        obfuscate: GARBLED[god] ? 'RANDOM' : null,
        // A god addressing you. Outranks the dead and your own head; yields to a
        // warning about what is coming.
        priority: 'GOD',
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
  // 🔴🔴 THE MOD SHOWS ONE MESSAGE AT A TIME AND QUEUES THE REST. Read out of
  // ImmersiveMessagesManager, not guessed:
  //
  //     showToPlayer(msg) -> tooltipQueue.add(msg)        ENQUEUE, never replace
  //     render()          -> if (currentTooltip == null && !queue.isEmpty())
  //                              currentTooltip = queue.remove()
  //     on expiry         -> currentTooltip = null
  //                          countdownToNextTooltip = timeBetweenMessages   (0.5s)
  //
  // ⚠️ SO THE QUEUE IS ALREADY THE SEQUENCER, and the first version of this fought it.
  // It scheduled each sentence with scheduleInTicks AND gave each one the tone's full
  // duration, so four of Forge's sentences at 5s each cost 4 x (5 + 0.5) = TWENTY-TWO
  // SECONDS of screen with everything else stuck behind them. The harness "measured"
  // 5s because it measured MY SCHEDULER rather than the mod's playback - the same
  // error as every other one today: measuring the thing I control instead of the thing
  // that happens.
  //
  // 🔑 SEND THEM ALL AT ONCE, EACH SHORT. The queue plays them in order, so a beat is
  // the sentence's own DURATION rather than a delay before sending it. No scheduling at
  // all, which also removes a failure mode: a scheduled callback firing after the
  // player has logged out.
  function speak(player, god, s, tag, opts) {
    try {
      var parts = sentences(s)
      var st = styleOf(god)

      // 🔴🔴 THE ONE-SENTENCE PATH USED TO SKIP beatFor ENTIRELY, and it is the most
      // common path in the pack.
      //
      // It read `return overlay(player, god, s, tag, opts)` with no `seconds`, so overlay
      // fell through to the TONE table's flat 5/6/8s. MIN_ON_SCREEN, the per-god
      // beatScale and Ethan's *"10-15 seconds"* ruling never applied to it at all.
      //
      // ⚠️ MEASURED OVER THE REAL POOLS: 208 single-sentence utterances, every one shown
      // for less time than beatFor asks, and NINETEEN shown for less than their own
      // typing time - they fade mid-word. The pack's longest beat wants 14.2s and needs
      // 8.2s just to type; it was being sent as 5.0s.
      //
      // 🔑 THIS IS THE EXACT SYMPTOM THE 08-30 REWRITE WAS WRITTEN TO FIX. Ethan, from
      // play: *"the text frequently fades before the full line is spoken."* The fix went
      // into the multi-sentence loop below and the single-sentence early return was left
      // behind it, so the bug survived its own fix on the commonest path.
      //
      // 🚨 And it defeated the instrument too: tools/line_duration_check.js measures
      // beatFor for these beats - a number this path never used. It certified 14.2s while
      // the client was told 5.0.
      if (parts.length < 2) {
        var one = {}
        if (opts) for (var q in opts) if (opts.hasOwnProperty(q)) one[q] = opts[q]
        // ⚠️ Only when the caller did not ask for a specific duration. A crashout or a
        // cutscene beat sets its own and must keep it.
        if (typeof one.seconds !== 'number') {
          one.seconds = Math.max(0.6, beatFor(s, st) / 20)
        }
        return overlay(player, god, s, tag, one)
      }

      var first = false
      for (var i = 0; i < parts.length; i++) {
        // beatFor is in ticks; the command wants seconds. 0.5s of each is eaten by the
        // mod's own gap, so the visible hold is a little shorter than this.
        var secs = Math.max(0.6, beatFor(parts[i], st) / 20)
        var o = {}
        if (opts) for (var k in opts) if (opts.hasOwnProperty(k)) o[k] = opts[k]
        // ⚠️ AFTER the copy: a caller's `seconds` was written for a WHOLE line and
        // would put every sentence back to full length, which is the bug above.
        o.seconds = secs
        // ⭐ Only the FIRST sentence asks for the screen. The rest are the same
        // utterance continuing, so they are never refused - a god cut off three
        // quarters of the way through a line reads as a bug, not as a pause.
        o.continuation = (i > 0)
        var okd = overlay(player, god, parts[i], tag, o)
        if (i === 0) {
          first = okd
          // 🔴🔴 IF THE OPENING SENTENCE IS REFUSED, THE WHOLE UTTERANCE IS ABANDONED.
          //
          // This loop used to carry on. Sentences 1..N go out with continuation=true, and
          // screen.claim() skips the backlog check entirely for continuations - so they
          // were sent UNCONDITIONALLY while only the opening line was dropped.
          //
          // ⚠️ The player then reads a line that starts mid-thought:
          //     "I gave you a blade. Now put it down. Slowly."
          //   from an utterance that opened "You should not have done that."
          //
          // 🔑 The protection above was real and it was applied to the WRONG END. The
          // comment promised a god is never cut off three quarters through; the code
          // guaranteed she is never cut off at the TAIL, and cut her off at the HEAD
          // instead - which is strictly worse, because a missing opening reads as the
          // god making no sense rather than as a pause.
          //
          // 🚨 REACHABLE FROM ONE ORDINARY LINE: ~93% of the pack (2608/2816 utterances)
          // is multi-sentence, and each leaves 25s+ of modelled backlog against GOD's 13s
          // tolerance - so ANY god line within ~12s of another one lost its opening.
          if (!okd) return false
        }
      }
      return first
    } catch (e) { return false }
  }

  // ⭐⭐ THE SAME THING, BUT THE BEATS ARE GIVEN RATHER THAN FOUND.
  //
  // Ethan, 2026-08-30, on the bickering documents:
  //     "When the lines are like this — line1 / line 2 — this is a single speaker, they
  //      will be typed out. Depending on the god speaking, it will use the same system
  //      the gods use normally to speak and their font. Blade: his words will be in his
  //      standard area. Wall: her responses will be scattered as standard."
  //
  // 🔑 SO A CHUNKED TURN IS NOT A NEW PRESENTATION - IT IS THE NORMAL ONE. Everything
  // that makes a god recognisable (placement, font, scatter, shake, size, typing) already
  // lives in `overlay`, and this reuses it wholesale. A bickering line and a line said
  // straight to you should be indistinguishable in HOW they arrive; only who it is aimed
  // at differs.
  //
  // ⛔ THE ONE DIFFERENCE FROM speak(): IT DOES NOT RE-SPLIT. `speak` runs `sentences()`
  // because it is handed a paragraph and has to find the beats. Here Ethan ALREADY chose
  // them - a single newline in his document is a beat, and that is authorship rather than
  // formatting. Splitting "I am sad." / "I am broken." further, or merging them back
  // together, would be overruling the writing.
  function speakChunks(player, god, chunks, tag, opts) {
    try {
      if (!chunks || !chunks.length) return false
      var st = styleOf(god)
      var first = false
      for (var i = 0; i < chunks.length; i++) {
        var secs = Math.max(0.6, beatFor(chunks[i], st) / 20)
        var o = {}
        if (opts) for (var k in opts) if (opts.hasOwnProperty(k)) o[k] = opts[k]
        o.seconds = secs
        // ⭐ Only the first beat asks for the screen; the rest are the same utterance
        // continuing and are never refused. A god cut off three chunks into a seven-chunk
        // lament reads as a bug - and Wall's laments run seven chunks.
        o.continuation = (i > 0)
        var okd = overlay(player, god, chunks[i], tag, o)
        if (i === 0) {
          first = okd
          // 🔴 SAME ABANDON-ON-REFUSAL AS speak(). This is the BICKERING path, where it
          // is worse: broadcast.js ignores the return value and counts `delivered++`
          // regardless, so a decapitated turn was reported as sent and the scene carried
          // on around a god whose opening line never arrived.
          if (!okd) return false
        }
      }
      return first
    } catch (e) { return false }
  }

  /** How long a chunked turn will hold the screen, in TICKS - so a scene can pace the
   *  next speaker instead of talking over the previous one. */
  function chunksTicks(god, chunks) {
    try {
      var st = styleOf(god)
      var t = 0
      for (var i = 0; i < (chunks || []).length; i++) t += Math.max(12, beatFor(chunks[i], st))
      return t
    } catch (e) { return 20 * ((chunks && chunks.length) || 1) }
  }

  // ════════════════════════════════════════════════════════════════════════
  // ⭐⭐ THE CRASHOUT — a god going off at somebody, in their own face.
  //
  // Ethan, 2026-08-30: *"god based waves should be gated off for now ... the crashout
  // can be used when gods attack each other."*
  //
  // 🔑 SO IT MOVED, AND THE NEW HOME IS BETTER. It was designed for a god-augmented
  // tide; it now fires on the grudge REPRISAL - the moment two gods stop arguing and
  // one of them actually strikes. That earns the volume in a way a scheduled tide never
  // did: it is rare (a champion has to have killed another god's champion), it is
  // personal (the target is the killer, not the room), and the argument has already
  // happened in front of you, so the escalation is something you WATCHED build.
  //
  // ⚠️ EVERYTHING IS BIGGER, NOTHING IS NEW. Same style registry, same font, same
  // colour - dialled up. A crashout that looked like a different system would read as a
  // different character.
  //
  // 🚨 CRASHOUT PRIORITY, which screen.js never refuses. This is the one message that
  // is allowed to be rude, and it is rude on purpose.
  function crashout(player, god, text, opts) {
    try {
      if (!VELDORA.im || typeof VELDORA.im.show !== 'function') return false
      var st = styleOf(god)
      var parts = sentences(String(text))
      var first = false
      for (var i = 0; i < parts.length; i++) {
        var show = {
          // ⚠️ DEAD CENTRE regardless of where this god usually lives. Blade normally
          // talks down from the top and Wall is never in one place - but a god losing
          // their temper does not keep to their corner, and the break from their usual
          // position is itself the signal that something is wrong.
          anchor: 'CENTER_CENTER',
          // ⚠️ LIFTED OFF THE CROSSHAIR (2026-08-30). A crashout is the biggest text in
          // the game and sat exactly on it - the loudest line was the least readable.
          y: -70,
          size: sized((typeof st.size === 'number' ? st.size : 1) + 0.55),
          shake: true,
          font: st.font,
          color: overlayColour(god, st, opts),
          typewriter: TYPEWRITER,
          seconds: Math.max(1.6, beatFor(parts[i], st) / 20),
          priority: 'CRASHOUT',
          continuation: (i > 0),
        }
        if (opts) for (var k in opts) if (opts.hasOwnProperty(k)) show[k] = opts[k]
        if (i > 0) show.continuation = true
        var okd = VELDORA.im.show(player, VELDORA.garble ? VELDORA.garble.strip(parts[i]) : parts[i], show)
        if (i === 0) first = okd
      }
      return first
    } catch (e) { return false }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ THE TWO-MOVEMENT CRASHOUT — docs/75 §2. Ethan's brief, for Wall:
  //
  //     "normal and garbled text across your screen before a flat 'I will kill you' in
  //      slow dark red slightly shaking typed text in the middle of the screen."
  //
  // Two movements, and `75` is explicit that THE CONTRAST IS THE EFFECT:
  //
  //   1. THE PANIC. Short lines in quick succession, scattered, alternating clean and
  //      garbled, shaking. She is coming apart and you are watching it happen.
  //   2. THE FLAT LINE. Everything stops. One line, dead centre, dark red, still-ish,
  //      held.
  //
  // 🔑 THE SILENCE BETWEEN THEM IS PART OF THE CONTENT, not a delay. `75`: *"the second
  // only lands because the first was noisy ... the silence before that line is
  // load-bearing and must be protected."* So it is RESERVED on the screen model
  // (screen.reserve) rather than merely waited out — otherwise the panic drains, the
  // model reads empty, and the first whisper in the queue speaks into the pause.
  //
  // ── ⚠️ WHAT IS NOT DELIVERED, AND IS NOT FAKED ────────────────────────────────
  // 🔴 SLOW IS NOT REACHABLE (B2). `sendcustom` hardcodes `typewriter(1.0f, false)`, so
  // the typing SPEED cannot be set from the command route, and reflection into this mod
  // is dead (D-123). The flat line types at the same rate as everything else and is
  // then HELD on screen — which buys the STILLNESS the movement needs, but not the
  // slowness Ethan asked for. Holding it longer is not the same effect and is not
  // claimed to be. This is the whole of B2's remaining cost, in one line of dialogue.
  //
  // ⚠️ SHE SHAKES HERE AND NOWHERE ELSE. wall_voice.js sets `shake: false` deliberately
  // — her menace is that she is STILL and in the wrong place. The panic overrides it,
  // and it only reads as coming apart BECAUSE she has never trembled before.

  // Vanilla dark_red. ⚠️ Deliberately NOT the god's own colour: the break from her
  // purple is part of the movement — this is not her talking to you any more.
  var FLAT_RED = '#AA0000'
  var FLAT_HOLD = 6.0          // seconds the flat line is held after it finishes typing
  var SILENCE = 1.5            // seconds of protected nothing between the movements

  /**
   * @param panicLines array of short lines — movement 1
   * @param flatLine   the single line — movement 2
   */
  function crashoutTwo(player, god, panicLines, flatLine, opts) {
    try {
      if (!VELDORA.im || typeof VELDORA.im.show !== 'function') return false
      var st = styleOf(god)
      var lines = [].concat(panicLines || [])
      if (!lines.length && !flatLine) return false

      var gap = 0.5
      try { if (VELDORA.screen && VELDORA.screen.gap) gap = VELDORA.screen.gap() } catch (e) { }

      // ── movement 1 ────────────────────────────────────────────────────────
      var held = 0, first = false
      for (var i = 0; i < lines.length; i++) {
        // ⚠️ STRIPPED, like crashout() does. The overlay has no § parser, so a line
        // written with a colour code for the chat copy would render "§4" as two visible
        // characters. Missing this in the first version made the two paths disagree
        // about the same pool.
        var txt = String(VELDORA.garble ? VELDORA.garble.strip(lines[i]) : lines[i])
        var secs = Math.max(0.9, beatFor(txt, st) / 20)
        var sc = scatterOf(st) || { x: 0, y: 0 }
        var okd = VELDORA.im.show(player, txt, {
          anchor: st.anchor || 'CENTER_CENTER',
          x: sc.x,
          y: sc.y,
          // ⭐ ALTERNATING, NOT RANDOM. Random garbling would sometimes produce three
          // legible lines in a row and sometimes none; the effect is the FLICKER
          // between readable and not, and only a deterministic alternation gives it.
          obfuscate: (i % 2 === 1) ? 'RANDOM' : null,
          size: sized((typeof st.size === 'number' ? st.size : 1) + 0.2),
          shake: true,
          font: st.font,
          color: overlayColour(god, st, opts),
          typewriter: TYPEWRITER,
          seconds: secs,
          priority: 'CRASHOUT',
          continuation: (i > 0),
        })
        if (i === 0) first = okd
        held += secs + gap
      }

      if (!flatLine) return first

      // ── the silence, held rather than hoped for ───────────────────────────
      try {
        if (VELDORA.screen && typeof VELDORA.screen.reserve === 'function') {
          VELDORA.screen.reserve(player, SILENCE)
        }
      } catch (e) { }

      // ── movement 2 ────────────────────────────────────────────────────────
      var flat = String(flatLine)
      function send(p) {
        var show = {
          anchor: 'CENTER_CENTER',
          x: 0,
          // 🔑 Centred horizontally, and LIFTED clear of the crosshair. She does not
          // scatter here - the stillness is the point - but "still" must not mean
          // "unreadable", and this is the one line in her crashout that has to land.
          y: -70,
          size: sized((typeof st.size === 'number' ? st.size : 1) + 0.35),
          shake: true,               // "slightly shaking"
          font: st.font,
          color: FLAT_RED,
          typewriter: TYPEWRITER,
          seconds: FLAT_HOLD,
          priority: 'CRASHOUT',
        }
        if (opts) for (var k in opts) if (opts.hasOwnProperty(k)) show[k] = opts[k]
        // ⚠️ Never garbled. This is the one line she means.
        VELDORA.im.show(p, VELDORA.garble ? VELDORA.garble.strip(flat) : flat, show)
      }

      var srv = null, uid = null
      try { srv = player.server; uid = String(player.uuid) } catch (e) { }
      if (!srv || !uid) {
        // 🔑 Cannot schedule, so there is no silence to give. Send it anyway: the line
        // arriving flat-but-early beats the line not arriving.
        send(player)
        return first
      }
      srv.scheduleInTicks(Math.round((held + SILENCE) * 20), function () {
        try {
          // ⚠️ RE-LOOKED-UP, not captured. A player reference held across several
          // seconds can outlive the player; someone who logged out mid-crashout gets
          // nothing, and that is correct rather than an error.
          var ps = srv.players
          for (var j = 0; j < ps.length; j++) {
            if (String(ps[j].uuid) === uid) { send(ps[j]); return }
          }
        } catch (e) { }
      })
      return first
    } catch (e) { return false }
  }

  /**
   * ⭐ WHICH CRASHOUT A GOD GETS IS DECIDED BY WHAT IS WRITTEN FOR THEM, not by a name
   * in a branch. A god with a `crashout_flat` pool comes apart in two movements; a god
   * without one gets the single-movement version. Wall is the only one written that way
   * today, and nothing here knows her name.
   *
   * 🔑 That keeps Ethan's half and mine separate the way the rest of the pass does:
   * adding the pool is a WRITING decision that changes the staging by itself.
   */
  function crashoutFor(player, god, opts) {
    try {
      // ⭐ THE ENRAGED SOUND FIRES HERE, and it has to, because the crashout path does
      // NOT go through say() and therefore never reaches chime(). Registering a third
      // sound register with nothing calling it would be a gate with no live consumer -
      // the failure this project keeps paying for, shipped as a feature.
      //
      // ⚠️ Fired ONCE for the whole crashout, not per beat. Five lines is five sounds and
      // that is a malfunction, not a mood.
      try {
        if (VELDORA.patronSound && typeof VELDORA.patronSound.play === 'function') {
          VELDORA.patronSound.play(player, god, 'crashout')
        }
      } catch (e) { }
      var flat = line(god, 'crashout_flat', player)
      if (!flat) {
        var one = line(god, 'crashout', player)
        return one ? crashout(player, god, one, opts) : false
      }
      // Movement 1 wants SEVERAL lines. `line()` picks one at a time, so it is called
      // repeatedly and deduped — a pool of three that returns the same line twice reads
      // as a stutter, not a panic.
      var panic = [], seen = {}
      for (var i = 0; i < 8 && panic.length < 3; i++) {
        var s = line(god, 'crashout', player)
        if (!s || seen[s]) continue
        seen[s] = true
        panic.push(s)
      }
      return crashoutTwo(player, god, panic, flat, opts)
    } catch (e) { return false }
  }

  // ⭐⭐ THE CHAT COPY IS OFF. Ethan, from play 2026-08-30:
  //     *"We still have text in the chat bar. That should be gone by now."*
  //
  // 🔑 IT WAS KEPT DELIBERATELY AND THAT REASONING IS NOW SPENT. The argument was that
  // chat is a scrolling record where COLOUR is the only thing separating speakers - true
  // while the overlay was unreliable and while gods had no fonts. Both changed: the
  // fonts render, and each god has a place on screen. The record is no longer the only
  // way to tell who spoke, so it is just a second copy of every line.
  //
  // ⚠️ ONE SWITCH, because "the gods are silent" is the hardest symptom in this project
  // to diagnose. If the overlay ever breaks, flipping this back puts every god's words
  // somewhere visible in one edit rather than a hunt.
  //
  // 🚨 IT CHANGED WHAT say() RETURNS, and that is worth knowing. The tell was inside the
  // try/catch whose failure returned false, so "did the god speak" USED to mean "did the
  // chat line land". Callers key off it - blade_events.js gates events on hasVoice/mute -
  // so the answer now comes from whether a line existed and was dispatched, which is what
  // the question always meant.
  var CHAT_COPY = false

  // ⭐⭐ THE ONE DOOR TO CHAT, and it exists because turning the chat copy off at two
  // chokepoints was not turning it off.
  //
  // 🔴 CHAT_COPY was added to say()/sayAbout() and broadcast, and reported as done. A
  // sweep afterwards found ~16 OTHER places writing god dialogue straight to chat -
  // stalker, whispers, regard, forge_talk, salvage_events, art_deal, reckoning, ritual,
  // release, fall, blade_events, salvage_deals. Every one bypassed the switch, so Ethan
  // still had dialogue in his chat bar after being told it was gone.
  //
  // ⚠️ SAME CLASS AS THE FALSE CITATION EARLIER THE SAME DAY: the instance in front of me
  // got fixed and the tree did not get swept. A switch is only a switch if everything
  // goes through it.
  //
  // 🔑 So every dialogue line to chat calls THIS, and `rhino_lint.py` fails the build if a
  // new `.tell()` carrying a god colour appears outside the allowed list. The gate cannot
  // be forgotten by the next call site, because the next call site cannot compile.
  //
  // ⛔ ADMIN AND UI OUTPUT DOES NOT COME THROUGH HERE. /notoriety's readout, a trust bar,
  // a command's answer - those are the operator surface and are always shown. The test is
  // "is a CHARACTER saying this", not "does it have a colour code in it".
  function chat(player, text) {
    if (!CHAT_COPY) return false
    try { player.tell(Text.of(String(text))) } catch (e) { return false }
    return true
  }

  function say(player, god, tag) {
    if (silenced(player, god)) return false
    var s = line(god, tag, player)
    if (!s) return false
    chat(player, paint(player, god, s))
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
    chat(player, paint(player, god, s))
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
        // ⚠️ Was a flat 5s, which predates typing. An aside types too, so it needs the
        // same room to finish as anything else.
        seconds: MIN_ON_SCREEN / 20,
        color: '#AAAAAA',
        // Your own head, not a speaker. It may follow closely behind one thing, but it
        // never talks over a god and never delays a warning.
        priority: 'ASIDE',
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
    speakChunks: speakChunks,
    chunksTicks: chunksTicks,
    crashout: crashout,
    crashoutTwo: crashoutTwo,
    crashoutFor: crashoutFor,
    SILENCE_SECONDS: SILENCE,
    setStyle: setStyle,
    styleOf: styleOf,
    sentences: sentences,
    // ⚠️ Exported for the harness, which asserts the one thing that cannot be seen
    // from outside: that a line is always given at least its TYPING time. That was
    // false for every line over 110 characters until 2026-08-30.
    beatFor: beatFor,
    draftSilenced: function () { return draftSilenced },
    CHAT_COPY: CHAT_COPY,
    chat: chat,
    TYPE_CHARS_PER_SEC: TYPE_CHARS_PER_SEC,
    MIN_ON_SCREEN: MIN_ON_SCREEN,
    dodgeCrosshair: dodgeCrosshair,
    CROSSHAIR_BAND: CROSSHAIR_BAND,
    sized: sized,
    SIZE_BOOST: SIZE_BOOST,
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
      // 🔴🔴 REWRITTEN 2026-08-30, AND THE OLD VERSION COULD NEVER HAVE WORKED.
      //
      // It sent THREE messages at once - a control and two typed - and the mod shows ONE
      // AT A TIME, FIFO (screen.js's entire premise, documented by me). So the 30-second
      // CONTROL played first and blocked both typed lines behind it for half a minute.
      // Ethan ran it and reported "didn't type anything", which is exactly what it does.
      //
      // 🚨 SO THIS INSTRUMENT NEVER MEASURED TYPING, and two different "measurements" of
      // the typewriter speed were then built on it - first "a character costs a tick",
      // later "a character per second". Neither was ever observed. An instrument that
      // cannot produce the reading it claims to take is worse than no instrument, because
      // its output gets quoted.
      //
      // ⭐ ONE MESSAGE. Nothing else in the queue, a long duration so it cannot expire
      // mid-reveal, and a string whose progress can be read at a glance.
      .then(Commands.literal('type').executes(function (ctx) {
        var p = ctx.source.player
        // 🔴 REFUSE TO MEASURE INTO A BACKLOG. Ethan: "there's like a backlog of text so
        // i can't cycle to the latest test one. Might be wrong." He was right to doubt
        // it - the mod plays one message at a time, so a queued message means the thing
        // on screen is an OLDER one and any reading taken from it is of the wrong line.
        // An instrument that will happily report a stale value is how the last three
        // wrong numbers happened.
        var owed = 0
        try { owed = VELDORA.screen ? VELDORA.screen.backlog(p) : 0 } catch (e) { }
        if (owed > 1) {
          p.tell(Text.of('§c§lWAIT §7- §f' + owed.toFixed(1) + 's§7 of text is still queued.'))
          p.tell(Text.of('§8Anything on screen now is an OLDER message. Re-run when clear.'))
          return 1
        }
        // Numbered every ten so the count is readable WITHOUT counting letters.
        var line = 'ABCDEFGHIJ1234567890abcdefghij1234567890KLMNOPQRST'
        VELDORA.im.show(p, line, {
          anchor: 'TOP_CENTER', y: 40, seconds: 60, typewriter: true, size: 1.4,
        })
        p.tell(Text.of('§8§m                                        '))
        p.tell(Text.of('§750 characters, ONE message, 60s. Nothing else is queued.'))
        p.tell(Text.of('§8· finishes almost instantly §7-> typing is fast, and usable'))
        p.tell(Text.of('§8· takes a few seconds      §7-> usable, tune the durations'))
        p.tell(Text.of('§8· still crawling at 30s    §7-> far slower than 15/sec; tell me'))
        p.tell(Text.of('§8· never appears at all     §7-> the typewriter flag does nothing'))
        p.tell(Text.of('§eTell me which of those four it was.'))
        return 1
      }))
      // ⭐ THE TWO-MOVEMENT CRASHOUT, on demand. It is otherwise only reachable by
      // getting killed by a god's champion, which is not a test loop.
      //
      // ⚠️ WATCH FOR THE SILENCE, not just the lines. The whole movement is whether the
      // pause between the panic and the flat line reads as a stop or as a stutter.
      .then(Commands.literal('crash').executes(function (ctx) {
        var p = ctx.source.player
        var g = 'wall'
        var flat = line(g, 'crashout_flat', p)
        p.tell(Text.of('§8' + g + ': §f' + (flat ? 'TWO-movement' : 'one-movement') +
          '§8 (decided by whether a crashout_flat pool exists)'))
        p.tell(Text.of('§8panic scattered + alternating garble, then §f' +
          VELDORA.voice.SILENCE_SECONDS + 's§8 of PROTECTED silence, then the flat line'))
        p.tell(Text.of('§c⚠ the flat line is NOT slow §8- speed is unreachable from the ' +
          'command route (B2). It types at normal rate and is HELD.'))
        crashoutFor(p, g)
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
    // 🚨 SAY WHAT WENT SILENT. A pool emptied by the draft filter is a REAL loss of
    // content, and the one failure mode this project keeps paying for is a subsystem that
    // is configured, running, and producing nothing without saying so.
    // 🔴 `draftSilenced` IS THE ARRAY, NOT THE ACCESSOR. This read `draftSilenced()` and
    // threw TypeError on every boot, killing the rest of this report - so the "what went
    // silent" warning it exists to print never printed, which is the exact failure it was
    // written to prevent.
    //
    // ⚠️ My sandbox test passed because it called the EXPORT (line ~1332), which IS a
    // function. Testing the public surface proved nothing about the internal call.
    var ds = draftSilenced
    if (ds.length) {
      var dn = 0
      for (var q = 0; q < ds.length; q++) dn += parseInt(String(ds[q]).split(' ')[1], 10) || 0
      console.warn(TAG + dn + ' UNWRITTEN line(s) across ' + ds.length + ' pool(s) are ' +
        'live with their [CLAUDE-DRAFT] marker stripped. They PLAY - stripping the tag ' +
        'is not writing them. Ethan replaces them; this count is the debt.')
      for (var d = 0; d < ds.length; d++) console.warn(TAG + '  ' + ds[d])
    }
    console.info(TAG + 'VELDORA.voice published OK - ' + gods + ' god(s), ' + tags +
      ' tag(s), ' + total + ' possible lines')
    if (!gods) console.warn(TAG + 'no pools registered yet - every god is silent ' +
      'through this file. That is the expected state until content lands.')
  }
})();
