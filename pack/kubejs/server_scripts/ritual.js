// ritual.js - I1 of the Introductions build.  docs/archive/26-INTRODUCTIONS.md
//
// THE ATTENTION RITUAL. A primitive, deliberately NOT an introduction feature.
// Three known consumers: the introductions (I2), Salvage's trades, Wall's requests.
// It takes the player's control away, speaks, and gives it back.
//
// Ethan's spec: "the screen goes back and they speak to you", and "halfway
// cinematic so the player is forced to read the dialogue but its not so long its a
// grind". Taking somebody's control away is a promise as much as a mechanic - if
// you do it you owe them something worth the time.
//
// ── THE HAZARD THIS FILE EXISTS TO NOT SHIP ──────────────────────────────────
// A player who disconnects mid-scene must NOT come back blind, slowed and rooted
// with the scene that would have released them already over. Potion effects live
// in player data and survive both logout AND a server restart, while the in-memory
// state map does not. So the release CANNOT depend on the state map surviving.
//
// Three independent layers, because J4 (does a scheduled callback survive its
// player leaving?) is STILL UNPROVEN and this ships before the answer:
//   1. the scheduled end, for the normal case
//   2. loggedOut, best-effort, may or may not fire in time
//   3. a PERSISTENT FLAG checked on loggedIn - the one that cannot be outlived,
//      because it is written to the same player data the effects are
// Layer 3 alone is sufficient. 1 and 2 are for grace, not for correctness.
//
// ── C0/E0 findings this chunk is built on ────────────────────────────────────
//  · clickable chat is `clickRunCommand`. `.click(String)` throws a THROWABLE that
//    escapes a JS catch and kills the whole command (E0 P3). Never use .click().
//  · a single detarget sweep measured 0 releases against 9 hostiles (E2a) - the
//    mobs acquire the player across the window, so the sweep must repeat.
//  · scheduleInTicks is the timer. tickCount is per-session; never store it.

// Same shared-namespace idiom as notoriety.js, and for the same two reasons:
// declared OUTSIDE the IIFE so sibling scripts can see it (`global` is rejected in
// server scripts), and the trailing semicolon is LOAD-BEARING - without it ASI does
// not insert one before the `(` below, so it parses as `{}(function(){...})` and
// dies with "{} is not a function".
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[ritual] '

  // The window. ~2.5s a line matches the scene budget in docs/27.
  var GAP = 50                    // ticks between spoken lines
  var LEAD = 20                   // ticks of black before the first line
  var TAIL = 40                   // ticks after the last line before options appear
  var TIMEOUT = 1200              // 60s to choose before the scene gives up
  var MARGIN = 60                 // effect duration slack past the scheduled end

  var DETARGET_RADIUS = 24
  var SWEEP_EVERY = 20            // re-sweep this often for the whole window

  // Rooted, blind, unseen, and unkillable for the duration. Resistance is not in
  // the spec and is not optional: a player who is blind and cannot move must not
  // be able to die to a skeleton while a patron monologues at them.
  var EFFECTS = [
    ['minecraft:blindness', 0],
    ['minecraft:slowness', 6],    // amp 6 is a full stop, not a limp
    ['minecraft:invisibility', 0],
    ['minecraft:resistance', 4],
    ['minecraft:weakness', 0],    // no swinging your way out of a conversation
  ]

  var FLAG = 'veldora_ritual_active'   // PERSISTENT. survives logout and restart.

  // uuid -> { lines, options, onChoose, onTimeout, awaiting, endsAt }
  var STATE = {}

  function keyOf(p) { try { return String(p.uuid) } catch (e) { return null } }
  function tell(p, s) { try { p.tell(Text.of(s)) } catch (e) { } }

  // ⭐ The scene's speech, on screen. CENTER_CENTER because a ritual has already taken
  // the world away - there is nothing else on the screen to avoid, and centre is where
  // somebody in the dark is looking.
  //
  // ⚠️ Fails soft and silently: a scene that half-renders is worse than one that
  // renders plainly, and the chat copy has already gone out by the time this runs.
  var STATE_ANCHOR = null, STATE_TYPE = null, STATE_ALIGN = null, STATE_MULTI = false, STATE_PERCHAR = false, STATE_X = null, STATE_Y = null
  function ritualOverlay(p, text, colour, secs) {
    try {
      if (!VELDORA.im || typeof VELDORA.im.show !== 'function') return false
      var t = String(text)
      if (t.charAt(0) === '*') t = t.substring(1)      // narration marker, not speech
      if (!t) return false
      return VELDORA.im.show(p, VELDORA.garble ? VELDORA.garble.strip(t) : t, {
        // 🔴 WAS A HARDCODED 4s. Fine for a deal, wrong for anything paced differently:
        // the Opening runs beats ~4.2s apart, so a flat 4s left each line overlapping the
        // next and truncating mid-sentence on screen. The caller knows its own pace.
        // ⚠️ A TYPED LINE MUST OUTLIVE ITS OWN TYPING. A flat duration cuts long lines
        // off mid-word and leaves short ones sitting there - both reported from play. When
        // the caller sets `perChar`, each line gets time from its OWN length instead.
        seconds: (STATE_PERCHAR
          ? Math.max(3, Math.round(String(text).length / 11) + 2)
          : ((typeof secs === 'number' && secs > 0) ? secs : 4)),
        anchor: (STATE_ANCHOR || 'CENTER_CENTER'),
        align: (typeof STATE_ALIGN === 'number') ? STATE_ALIGN : undefined,
        // 🔴🔴 x AND y WERE NEVER FORWARDED, and that silently ate three fixes. The Opening
        // set y to 30, then 60, then 110 to clear the Serene Seasons HUD, and this function
        // dropped every one of them on the floor - so the entry kept rendering in exactly
        // the same place and looked like the deploy had not landed.
        //
        // ⚠️ A pass-through that quietly omits a field is worse than one that errors: the
        // caller has no way to tell "ignored" from "applied and wrong", so the same fix
        // gets made repeatedly against a boundary that never carried it.
        x: (typeof STATE_X === 'number') ? STATE_X : undefined,
        y: (typeof STATE_Y === 'number') ? STATE_Y : undefined,
        // Lets a scene keep its newlines - see immersive.js. Off by default, because a
        // real newline truncates the command's greedy text argument.
        multiline: STATE_MULTI || undefined,
        // 🔴 A BOOK PAGE DOES NOT TYPE ITSELF. The Opening accumulates - each beat re-sends
        // the whole page so far - and with the typewriter on, every beat re-typed all of
        // it from scratch. Ethan screenshotted two beats caught mid-type and both looked
        // like the text had been TRUNCATED mid-word, which is what sent me hunting a
        // length cap that does not exist.
        typewriter: (STATE_TYPE === false) ? undefined : 1.0,
        fade: true,
        wrap: 260,
      })
    } catch (e) { return false }
  }

  // ── ⭐ SCENES ARE PATRON SPEECH, SO THEY ARE PATRON-COLOURED ────────────────
  // Measured live 2026-08-15 (Ethan): the Sharpen bargain rendered in plain WHITE,
  // and so did the Harvest cutscene and Salvage's trade. Every caller was passing
  // bare strings and nothing painted them - only introductions.js pre-coloured its
  // own lines, so the fault was invisible from that one call site.
  //
  // Fixed HERE rather than in the three callers, because a god who forgets to paint
  // his own scene is a bug that will happen again with every new god. docs/41 §4:
  // if it must be true for every god, it does not live in the god's file.
  //
  // A line that already carries its own § keeps it - that is how narration stays
  // grey-italic and how the Speaker stays grey. A blank line stays blank.
  var DEFAULT_COLOUR = '§4§l'      // the patron channel: bold dark red

  function paint(s, colour) {
    if (s === null || s === undefined) return ''
    var str = String(s)
    if (!str.length) return str                     // a blank line is a beat
    if (str.charAt(0) === '§') return str      // caller already chose
    return (colour || DEFAULT_COLOUR) + str
  }

  // ---------------------------------------------------------------------------
  // THE RELEASE. Everything that ends a ritual comes through here, including the
  // login recovery, so there is exactly one definition of "released".
  // Safe to call on a player who is not in a ritual - that is the point.
  // ---------------------------------------------------------------------------
  // 🚨 potionEffects.remove(id) DOES NOT EXIST. Measured live 2026-08-14:
  //     TypeError: Cannot find function remove in object EntityPotionEffectsJS
  //
  // It was the ONLY way this file took effects off, it was wrapped in a silent
  // catch, and so release() reported "released <player>" while clearing nothing -
  // for every one of its nine call sites. The panic button logged success and did
  // nothing. Players escaped a ritual by running /unstuck, which is `kill`.
  //
  // Two lessons, and the second is the bigger one:
  //   1. The whole codebase never once removed an effect, so nothing contradicted
  //      an invented API. `add` working is not evidence that `remove` exists.
  //   2. THE THREE RECOVERY LAYERS WERE NEVER INDEPENDENT. The scheduled end,
  //      loggedOut and the login-flag recovery all funnel through this one
  //      function. Three layers over a single unproven call is one layer.
  //
  // The vanilla command is the proven route - `effect clear` cannot be missing.
  // Failure is now LOUD: a safety path may not fail quietly.
  function clearEffects(p, keep) {
    var name = null, srv = null
    try { name = String(p.username) } catch (e) { }
    try { srv = p.server } catch (e) { }
    if (!srv || !name) {
      console.error(TAG + '!! CANNOT CLEAR EFFECTS - no server handle or username. ' +
        'A player may be left blind and rooted.')
      return false
    }
    // `keep` is an optional list of effect ids this release must NOT clear.
    //
    // Added for E6. Salvage's third trade is "give me your sight and i will grant
    // you the power to kill", and its price is blindness that FOLLOWS YOU OUT - up
    // to five minutes, still blind, holding something that kills better. Every
    // other cost in the design resolves when the scene closes; that one IS the
    // trade. Measured 2026-08-15 via /salvageprobe sight: blindness is in EFFECTS,
    // so release() wiped it - the trade would have been built broken and looked
    // completely fine.
    //
    // The primitive stays dumb about WHY, exactly as holdAfterChoice does. It is
    // told what to spare, never what the scene means by it.
    var spare = {}
    if (keep && keep.length) {
      for (var s = 0; s < keep.length; s++) spare[String(keep[s])] = true
    }

    var failed = 0
    for (var i = 0; i < EFFECTS.length; i++) {
      if (spare[EFFECTS[i][0]]) {
        console.info(TAG + 'sparing ' + EFFECTS[i][0] + ' on release - caller asked')
        continue
      }
      try {
        // The FIRST clear of the session uses runCommand rather than the silent
        // form, because runCommand returns the command's FEEDBACK TEXT (E0 P12b)
        // and runCommandSilent returns undefined for valid and invalid alike (K8).
        // One line of proof in the log, once, that this actually removes anything -
        // the previous version's problem was believing itself.
        if (!PROVEN) {
          PROVEN = true
          var fb = srv.runCommand('effect clear ' + name + ' ' + EFFECTS[i][0])
          console.info(TAG + 'clear proof :: ' + EFFECTS[i][0] + ' -> ' + fb)
        } else {
          srv.runCommandSilent('effect clear ' + name + ' ' + EFFECTS[i][0])
        }
      } catch (e) {
        failed++
        console.error(TAG + '!! effect clear threw for ' + EFFECTS[i][0] + ' :: ' + e)
      }
    }
    return failed === 0
  }
  var PROVEN = false

  // release(p, why)        - clears everything, the old behaviour
  // release(p, why, keep)  - spares the listed effect ids
  //
  // If the caller passes nothing, the scene's own `keep` (from begin's spec) is
  // used. An explicit [] therefore means "clear everything, I mean it" and is what
  // the panic button and the login recovery pass.
  function release(p, why, keep) {
    if (!p) return
    var k = keyOf(p)
    var spare = keep
    if (spare === undefined) spare = (k && STATE[k] && STATE[k].keep) || null
    clearEffects(p, spare)
    try { p.persistentData.putBoolean(FLAG, false) } catch (e) { }
    if (k && STATE[k]) delete STATE[k]
    if (why) console.info(TAG + 'released ' + safeName(p) + ' (' + why + ')')
  }

  function safeName(p) { try { return String(p.username) } catch (e) { return '?' } }

  function applyEffects(p, ticks) {
    for (var i = 0; i < EFFECTS.length; i++) {
      try {
        // (id, ticks, amplifier, ambient, showParticles) - particles OFF, this is
        // a black screen and a voice, not a status bar.
        p.potionEffects.add(EFFECTS[i][0], ticks, EFFECTS[i][1], false, false)
      } catch (e) { console.error(TAG + 'effect ' + EFFECTS[i][0] + ' failed: ' + e) }
    }
  }

  function detargetOnce(p) {
    var cleared = 0
    try {
      var near = p.level.getEntitiesWithin(p.boundingBox.inflate(DETARGET_RADIUS))
      for (var i = 0; i < near.length; i++) {
        var m = near[i]
        try {
          if (!m || m.player || !m.living) continue
          var t = null
          try { t = m.getTarget() } catch (x) { try { t = m.target } catch (y) { } }
          if (t && String(t.uuid) === String(p.uuid)) { m.setTarget(null); cleared++ }
        } catch (x) { }
      }
    } catch (e) { }
    return cleared
  }

  // ---------------------------------------------------------------------------
  // THE SCENE. Lines land one at a time; options appear only after the last one,
  // so a fast reader cannot skip the speech by clicking early.
  // ---------------------------------------------------------------------------
  function begin(p, spec) {
    if (!p || !spec) return false
    var k = keyOf(p)
    if (!k) return false
    if (STATE[k]) { console.info(TAG + 'refused: ' + safeName(p) + ' already in a ritual'); return false }

    var lines = spec.lines || []
    var options = spec.options || []
    var gap = spec.gap || GAP
    var server = null
    try { server = p.server } catch (e) { }
    if (!server) { console.error(TAG + 'no server handle - refusing to blind a player I cannot release'); return false }

    // holdAfterChoice keeps the player in the dark for N ticks AFTER they pick, so
    // the patron's closing lines land inside the scene instead of over the top of
    // a world that has already come back. Added for I2, which is the first
    // consumer that needed it - the primitive stays dumb about why.
    var hold = spec.holdAfterChoice || 0
    var colour = spec.colour || DEFAULT_COLOUR

    // ⚠️ With perChar the lines are different lengths, so a uniform gap would land the
    // next one on top of a long one still typing. Pace off the longest.
    var speakFor = LEAD + (lines.length * gap) + TAIL
    if (spec.perChar) {
      // ⚠️ Sized from the REAL total, not lines x gap - the dark must outlast the words.
      var total = LEAD
      for (var pi = 0; pi < lines.length; pi++) {
        total += Math.max(40, Math.round((String(lines[pi]).length / 11 + 2) * 20))
      }
      speakFor = total + TAIL
    }
    // ⚠️ `whole` IS COMPUTED BELOW THE FINALE BLOCK, NOT HERE - it used to be on this
    // line. The finale extends `speakFor`, and `whole` sizes the blindness and the
    // detarget sweep, so computing it first let the world come back ~9s BEFORE the scene
    // released - on top of the title card, with mobs live again. It was unreachable only
    // because the gate below was dead; fixing that gate is what made it reachable, so
    // both move in the same commit.

    // ⭐ THE FINALE - a closing card with its OWN staging. The Opening needs its title
    // centred and large after the prose has run left-aligned, and a scene cannot switch
    // anchor mid-flight otherwise. Optional; nothing else uses it.
    //
    // 🔴 THIS GATE WAS `spec.finale.text` ALONE, AND IT SILENTLY KILLED EVERY POPUP CARD.
    // A popup finale carries `title`/`subtitle` and needs no `text` at all - so the
    // Opening's title card, the thing the whole cutscene builds to, never rendered once.
    // It shipped 2026-08-30 under a commit message saying it landed.
    //
    // ⚠️ NO HARNESS COULD SEE IT. opening_harness.js asserts on the spec the caller
    // PASSED, through a ritual stub that returns true - so it proved the Opening ASKED
    // for a card, never that one appeared. Check a gate against what the callee requires,
    // not against what the caller sent.
    if (spec.finale && (spec.finale.text || spec.finale.popup)) {
      var fat = LEAD
      for (var fi = 0; fi < lines.length; fi++) {
        fat += spec.perChar
          ? Math.max(40, Math.round((String(lines[fi]).length / 11 + 2) * 20))
          : gap
      }
      fat += (spec.finale.after || 30)
      ;(function (fin, when) {
        server.scheduleInTicks(when, function () {
          try {
            if (!STATE[k]) return
            if (!VELDORA.im) return
            // ⭐ A popup finale is the two-line card; anything else is a plain overlay.
            if (fin.popup && typeof VELDORA.im.popup === 'function') {
              VELDORA.im.popup(p, fin.title, fin.subtitle, fin.seconds || 8)
              return
            }
            if (typeof VELDORA.im.show !== 'function') return
            VELDORA.im.show(p, fin.text, {
              seconds: fin.seconds || 8,
              anchor: fin.anchor || 'CENTER_CENTER',
              size: fin.size || 1.6,
              typewriter: 1.0,
              fade: true,
            })
          } catch (e) { }
        })
      })(spec.finale, fat)
      speakFor = fat + Math.round((spec.finale.seconds || 8) * 20)
    }

    // ⭐ AFTER the finale, so the dark outlasts the card. Every consumer of `whole`
    // (applyEffects, the detarget sweep, the boot log) must see the EXTENDED window.
    var whole = speakFor + (options.length ? TIMEOUT : 0) + hold

    STATE[k] = {
      awaiting: false, options: options, hold: hold, colour: colour,
      onChoose: spec.onChoose, onTimeout: spec.onTimeout,
      // Opt-in, so every existing caller keeps the behaviour it was written against.
      noChat: !!spec.noChat,
      overlaySeconds: spec.overlaySeconds || 0,
      anchor: spec.anchor || null,
      typewriter: (spec.typewriter === false) ? false : null,
      align: (typeof spec.align === 'number') ? spec.align : null,
      multiline: !!spec.multiline,
      perChar: !!spec.perChar,
      x: (typeof spec.x === 'number') ? spec.x : null,
      y: (typeof spec.y === 'number') ? spec.y : null,
      // effect ids this scene's own release must not clear - see clearEffects
      keep: spec.keep || null,
    }
    try { p.persistentData.putBoolean(FLAG, true) } catch (e) { }
    applyEffects(p, whole + MARGIN)

    // Sweep for the WHOLE window. E2a proved one sweep at t=0 releases nothing:
    // the mobs had not acquired him yet at the instant it ran.
    detargetOnce(p)
    for (var s = SWEEP_EVERY; s < whole; s += SWEEP_EVERY) {
      (function (t) {
        server.scheduleInTicks(t, function () {
          try { if (STATE[k]) detargetOnce(p) } catch (e) { }
        })
      })(s)
    }

    // ════════════════════════════════════════════════════════════════════════
    // ⭐ THE TEXT MOVES; NOTHING ELSE DOES. Ethan, 2026-08-29:
    //
    //     "for ritual, no week keep all the affects, we're just moving where the text
    //      goes."
    //
    // 🔑 SO THE BLINDNESS, THE HOLD, THE PACING AND THE DETARGET ALL STAY. A ritual is
    // supposed to stop the world - that IS what a ritual is here, and replacing it with
    // an overlay would have changed the thing rather than where it renders. The only
    // change is that the SPEECH is drawn on screen instead of in the chat log.
    //
    // ⚠️ THE OPTIONS DO NOT MOVE, AND THEY CANNOT. They are clickable chat components
    // (`clickRunCommand`), and an ImmersiveMessage overlay is drawn, not clicked. Moving
    // them would leave a scene nobody can answer. Speech on screen, choices in chat.
    //
    // ⚠️ AND CHAT STILL GETS THE SPEECH TOO. Same reasoning as voice.js: an overlay is
    // gone in seconds and a ritual line is often the only place a thing is ever said.
    // ⭐⭐ PER-LINE TIMING. With perChar the lines are different lengths, so a UNIFORM gap
    // either lands the next sentence on top of a long one still typing, or leaves a short
    // one sitting in silence. Each line now waits for the one before it to finish.
    var at = LEAD, offsets = []
    for (var oi = 0; oi < lines.length; oi++) {
      offsets.push(at)
      at += spec.perChar
        ? Math.max(40, Math.round((String(lines[oi]).length / 11 + 2) * 20))
        : gap
    }
    for (var i = 0; i < lines.length; i++) {
      (function (idx, text) {
        server.scheduleInTicks(offsets[idx], function () {
          try {
            if (!STATE[k]) return                 // cancelled or logged out
            // 🔴 CHAT IS OPT-OUT NOW. A deal wants its lines in chat - an overlay is gone
            // in seconds and the offer is often said only once. A MONTAGE does not: the
            // Opening is 18 beats, and 18 chat lines is a wall of spam scrolling under a
            // cutscene, which is exactly what it looked like in play.
            if (!STATE[k].noChat) tell(p, paint(text, colour))
            STATE_ANCHOR = STATE[k].anchor || null
            STATE_TYPE = (STATE[k].typewriter === false) ? false : null
            STATE_ALIGN = (typeof STATE[k].align === 'number') ? STATE[k].align : null
            STATE_MULTI = !!STATE[k].multiline
            STATE_PERCHAR = !!STATE[k].perChar
            STATE_X = (typeof STATE[k].x === 'number') ? STATE[k].x : null
            STATE_Y = (typeof STATE[k].y === 'number') ? STATE[k].y : null
            ritualOverlay(p, text, colour, STATE[k].overlaySeconds)
          } catch (e) { }
        })
      })(i, lines[i])
    }

    // The options, after the speech.
    if (options.length) {
      server.scheduleInTicks(speakFor, function () {
        try {
          if (!STATE[k]) return
          STATE[k].awaiting = true
          tell(p, '')
          for (var o = 0; o < options.length; o++) {
            // clickRunCommand ONLY. .click(String) throws a Throwable that escapes
            // the JS catch and takes the whole command with it (E0 P3).
            // `label` is the contract. Accept `text` too rather than rendering the
            // word "undefined" at a player - E6 passed `text` and four options came
            // out as `undefined`, which looked like a scene bug rather than a
            // one-word mismatch. Loud, not silent, and never unreadable.
            var lab = options[o].label
            if (lab === undefined || lab === null) lab = options[o].text
            if (lab === undefined || lab === null) {
              lab = '(unlabelled option ' + (o + 1) + ')'
              console.error(TAG + '!! option ' + (o + 1) + ' has neither .label nor .text')
            }
            var line = Text.of('  §f§n' + lab)
            try { line = line.clickRunCommand('/ritual pick ' + (o + 1)) } catch (e) {
              console.error(TAG + 'clickRunCommand failed, options are unclickable: ' + e)
            }
            p.tell(line)
          }
        } catch (e) { console.error(TAG + 'option delivery failed: ' + e) }
      })
      server.scheduleInTicks(speakFor + TIMEOUT, function () {
        try {
          var st = STATE[k]
          if (!st || !st.awaiting) return
          var cb = st.onTimeout
          release(p, 'timeout')
          if (cb) cb(p)
        } catch (e) { }
      })
    } else {
      server.scheduleInTicks(speakFor, function () { release(p, 'scene end') })
    }

    console.info(TAG + safeName(p) + ' entered a ritual: ' + lines.length + ' lines, ' +
      options.length + ' options, window ' + whole + 't')
    return true
  }

  function choose(p, idx) {
    var k = keyOf(p)
    if (!k) return false
    var st = STATE[k]
    if (!st || !st.awaiting) { tell(p, '§8Nothing is waiting on you.'); return false }
    var opt = st.options[idx - 1]
    if (!opt) return false
    var cb = st.onChoose
    var id = opt.id || idx

    // Consume the choice FIRST. Without this a double-click - which is exactly what
    // a player does to a clickable option they are not sure registered - runs the
    // accept branch twice, and the accept branch grants a path and strips XP.
    st.awaiting = false

    if (st.hold > 0) {
      // Stay in the dark for the closing lines; the caller staggers them itself.
      var server = null
      try { server = p.server } catch (e) { }
      if (server) server.scheduleInTicks(st.hold, function () { release(p, 'scene end after ' + id) })
      else release(p, 'chose ' + id + ' (no server handle - released early)')
      try { if (cb) cb(p, id) } catch (e) { console.error(TAG + 'onChoose threw: ' + e) }
    } else {
      release(p, 'chose ' + id)
      try { if (cb) cb(p, id) } catch (e) { console.error(TAG + 'onChoose threw: ' + e) }
    }
    return true
  }

  // ---------------------------------------------------------------------------
  // LAYER 3 - the recovery that cannot be outlived.
  //
  // The persistent flag lives in the same player data the effects do, so if the
  // effects survived, the flag survived with them. This is the ONLY layer that
  // still works after a server restart, and it is why the ritual is safe to ship
  // before J4 is answered.
  // ---------------------------------------------------------------------------
  PlayerEvents.loggedIn(function (event) {
    var p = event.player
    var stuck = false
    try { stuck = p.persistentData.getBoolean(FLAG) } catch (e) { }
    if (!stuck) return
    release(p, 'LOGIN RECOVERY - was mid-ritual', [])
    console.error(TAG + 'recovered ' + safeName(p) + ' from an interrupted ritual. ' +
      'If this fires often, something is ending scenes without releasing.')
    tell(p, '§8You come back to yourself.')
  })

  PlayerEvents.loggedOut(function (event) {
    try { release(event.player, 'logged out', []) } catch (e) { }
  })

  // A death mid-scene would otherwise leave the state map holding a corpse.
  EntityEvents.death(function (event) {
    try {
      var e = event.entity
      if (e && e.player) release(e, 'died mid-ritual', [])
    } catch (x) { }
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands

    // Fixed literals rather than a string argument: the introductions always offer
    // exactly two choices, and this avoids the argument-type plumbing entirely.
    var pick = Commands.literal('pick')
    for (var n = 1; n <= 4; n++) {
      (function (i) {
        pick = pick.then(Commands.literal(String(i)).executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          choose(p, i)
          return 1
        }))
      })(n)
    }

    event.register(Commands.literal('ritual')
      .then(pick)
      .then(Commands.literal('test').executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        begin(p, {
          lines: [
            '§4§lYou already reached for it.',
            '§4§lI felt the reach before you understood you had made it.',
            '§4§lStand still. You have already begun to disappoint me.',
            '§4§lChoose. I am already losing interest.',
          ],
          options: [
            { label: 'Close your hand.', id: 'accept' },
            { label: 'Pull it back.', id: 'refuse' },
          ],
          onChoose: function (pl, id) {
            VELDORA.voice.chat(pl, id === 'accept' ? '§4§lGood.' : '§4§lOf course.')
            console.info(TAG + 'test: ' + safeName(pl) + ' chose ' + id)
          },
          onTimeout: function (pl) {
            pl.tell(Text.of('§8The moment passes.'))
          },
        })
        return 1
      }))
      // The panic button. If anything ever strands a player, this is the fix, and
      // it must exist before the thing that could strand them.
      .then(Commands.literal('clear').executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        // Report what actually happened. The old version printed "Released."
        // unconditionally while clearing nothing, which is how a broken panic
        // button passed for a working one.
        var ok = clearEffects(p)
        release(p, 'manual /ritual clear', [])
        p.tell(Text.of(ok ? '§7Released.'
          : '§c/ritual clear could not remove your effects. Tell Ethan, then use /unstuck.'))
        return 1
      })))
  })

  // ---------------------------------------------------------------------------
  // THE CROSS-FILE SEAM. I2, Salvage's trades and Wall's requests all reach the
  // ritual through this and nothing else.
  //
  // Published at SCRIPT-EVAL time, not inside ServerEvents.loaded - otherwise the
  // seam would depend on the relative order of two loaded() callbacks, and a
  // consumer that happened to run first would read undefined. notoriety.js
  // establishes the pattern.
  // ---------------------------------------------------------------------------
  VELDORA.ritual = {
    begin: begin,
    release: release,
    active: function (p) { var k = keyOf(p); return !!(k && STATE[k]) },

    // Set what this scene's release must spare, DURING the scene.
    //
    // spec.keep on begin() was wrong for E6 and shipped a real bug: it applied to
    // the whole scene, so blindness survived EVERY outcome - refusing, a failed
    // trade, running out of levels - and left the player permanently blind for
    // choices that cost them nothing. A price may only be kept by the choice that
    // actually charged it.
    //
    // Safe to call from inside onChoose: with holdAfterChoice the release is
    // SCHEDULED and onChoose runs before it fires, so this still lands in time.
    keepOnRelease: function (p, ids) {
      var k = keyOf(p)
      if (!k || !STATE[k]) return false
      STATE[k].keep = ids || null
      return true
    },
  }

  // Assert it at boot anyway. A silent failure here does not look like a failure -
  // it looks like the scene simply never ran, which is the exact shape of bug this
  // project keeps producing.
  ServerEvents.loaded(function () {
    var ok = (typeof VELDORA !== 'undefined') && VELDORA.ritual &&
      (typeof VELDORA.ritual.begin === 'function')
    if (ok) console.info(TAG + 'VELDORA.ritual published OK (begin/release/active)')
    else console.error(TAG + 'VELDORA.ritual MISSING - every scene will silently not run')
  })
})()
