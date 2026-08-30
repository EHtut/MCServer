// release.js — THE PATH RELEASE SYSTEM. Ethan, 2026-08-16.
//
//   "Wall will never release you. Blade will release you only if you die too many
//    times after he gave you a buff, 4x in a row. Salvage will release you if you
//    keep denying her trades, 3x in a row."
//
// ── WHAT THIS REPLACES, AND WHY ──────────────────────────────────────────────
// Until now there was ONE way to lose a path: regard.js counts every death, maxes
// at 100, and calls VELDORA.theFall. That is a good pressure gauge and a BAD
// release condition, because it is the same condition for all six gods. Six
// characters were losing you for identical reasons.
//
// The word that decides the design is Ethan's own: Blade releases you "ONLY if".
// So regard stops being the door for any god that has its own, and becomes what it
// always was better at - the escalating voice that tells you where you stand.
//
//   wall     never           winning her Harvest is the only exit (docs/43)
//   blade    4 buff-deaths   he armed you and you died anyway, four times running
//   salvage  3 denials       you kept saying no
//   others   regard          unchanged legacy - forge/art/crown are closed anyway
//
// 🔴🔴 THE TABLE ABOVE IS HISTORY. Every entry in it is now `never` - see the
// ruling on the RULES table below. It is kept because the ARGUMENT is still the best
// statement of why six gods should not share one door, and if release conditions ever
// return, they return to this design and not to regard-for-everyone.
//
// ── THE RESET RULE IS THE WHOLE MECHANIC ─────────────────────────────────────
// "In a row" is not decoration. Both streaks are CONSECUTIVE and both have a
// specific, earnable reset:
//
//   blade    SURVIVE one buff and you are forgiven, all the way back to zero.
//   salvage  ACCEPT one trade and you are forgiven. Even a trade you were too poor
//            to complete counts - the streak measures denial, not success.
//
// That asymmetry is right for who they are. His forgiveness is earned by not
// dying; hers is bought.
//
// ── WHAT DOES *NOT* COUNT ────────────────────────────────────────────────────
// 🚨 A death with no buff on it is not a strike against Blade. He is not counting
// deaths - regard already does that. He is counting GIFTS HE WASTED.
//
// 🚨 A timeout is not a denial. Walking away from her counter is ambiguous: it is
// AFK as often as it is refusal, and this file can not tell them apart. It is
// LOGGED (VELDORA.release.ignored) so the rate is visible, and it is never
// counted. Same doctrine as fall.js's cooldown: a punishment that cannot be
// verified must not be enforced.

var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[release] '

  // ═══════════════════════════════════════════════════════════════════════════
  // THE REGISTRY. One row per god, and it is the ONLY place the answer lives.
  //
  // `mode`
  //   never    nothing releases you. The Harvest is the only door.
  //   streak   a consecutive counter of `kind`, `need` long.
  //   regard   the legacy behaviour - regard.js maxing out calls theFall.
  //
  // `speaksAtMax` — whether the god still says their beat-5 regard line once
  //   regard no longer falls. This is NOT cosmetic. Four of the five beat-5 lines
  //   are collection threats:
  //       blade    "As Phaethon fell, so do you."
  //       salvage  "Enough. I am taking what I am owed."
  //   ...and a threat that cannot happen is a lie the game tells. Suppressed.
  //
  //   ⭐ Wall is the exception and it is the best line in the game:
  //       "This is mercy, darling. This is me keeping my promise.
  //        I will not lose you again."
  //   Hers is a PROMISE, not a threat, and nothing happening is the promise being
  //   kept. She keeps beat 5.
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴🔴 THERE IS NO ENDING ANY MORE. Ethan, 2026-08-24:
  //
  //     "there should be no ending anymore, this is story now, not just a game.
  //      there is no end."
  //
  // 🔑 THIS FILE WAS THE ENDING SYSTEM, so the ruling lands here hardest. A release
  // is a god deciding you are finished - six wasted gifts, three refusals, a filled
  // regard bar - and every one of those is a last chapter. In a story that continues,
  // your patron does not fire you.
  //
  // ⭐ AND IT DELETED TWO OPEN PROBLEMS RATHER THAN SOLVING THEM. The audit an hour
  // earlier had two findings here:
  //     · art's `cut_down` was written and never fired - her signature mechanic,
  //       "she kills you for getting too good", unreachable
  //     · art and crown were still on the LEGACY `regard` door, inherited not chosen
  // Both were "build the ending" problems. Neither exists now.
  //
  // ⚠️ EVERY MODE IS `never`. The machinery below - streaks, armed windows, denial
  // counters - is LEFT INTACT and simply unreachable, exactly as harvest.js was: this
  // project reverses rulings, and a mode string is cheaper to restore than a system.
  //
  // 🚨 A FUTURE EDITOR ADDING A NEW GOD SHOULD ADD `never`. If a release condition ever
  // looks tempting again, read the ruling above first - the answer was that endings are
  // a game's idea, not a story's.
  var RULES = {
    wall: { mode: 'never', speaksAtMax: true },

    blade: {
      // ⚠️ 4 -> 6 on 2026-08-16, and the reason is not balance, it is the event
      // taxonomy (docs/23 §VI.0). Blade's weight vector puts **Buffs at ++++**, so
      // forced status effects become one of the commonest things he does - which
      // means his armed window is open far more often than when this number was
      // chosen, and a release designed to be nearly unreachable would start firing.
      //
      // Ethan's ruling was to move THIS rather than bend his weights: the vector is
      // the character, and distorting a god's shape to protect a mechanic is
      // backwards. If Buffs ever drop a band for him, this comes back down.
      //
      // 🔴 AND NONE OF THAT MATTERS ANY MORE - `never` as of 2026-08-24. The
      // argument above is preserved because it is the record of a ruling, and because
      // if streaks ever return this is the number they return to.
      mode: 'never', speaksAtMax: false,
      _retired: { mode: 'streak', kind: 'buff_death', need: 6 },
      // What the player sees. Grey system text, never dialogue - Ethan writes the
      // lines, and there is no voice tag for this beat yet. If he wants Blade to
      // speak here, the hook is speakOnStrike() below and it needs one tag name.
      noun: 'gift wasted',
      blurb: 'He armed you, and you died with it on.',
    },

    salvage: {
      // ⚠️ WAS `streak` / denial / need 3 until 2026-08-24 - three refusals and she was
      // done with you. Retired with the rest; her refusals now cost nothing but her
      // patience, which is the version of her that survives a story.
      mode: 'never', speaksAtMax: false,
      _retired: { mode: 'streak', kind: 'denial', need: 3 },
      noun: 'refusal',
      blurb: 'You said no to her.',
    },

    // ⭐⭐ THE GOAT NEVER PUTS YOU DOWN — ruled 2026-08-23, when forge opened.
    //
    // She was on the legacy `regard` door below because she was CLOSED. She is not any
    // more, so this had to be decided rather than inherited - and the answer was
    // already written, in her own harvest_lost pool:
    //
    //     "You lost. Nothin' happens. Don't nobody take nothin' from you.
    //      That's how I do it."
    //
    // 🔑 SO SHE SHARES `never` WITH WALL, AND IT MEANS THE OPPOSITE THING. Wall never
    // releases you because she will not let a champion go - possession. Milantros
    // never releases you because she would never do that to anybody - kindness. Same
    // mechanic, opposite meaning, which is the exact pattern her chart already runs on
    // (docs/56 §4: the only god whose FORCED column is generous).
    //
    // ⚠️ It also belts-and-braces forge_events.js: even if a future editor calls
    // release.refused() on one of her refusals, `never` has no counter to strike.
    forge: { mode: 'never', speaksAtMax: true },

    // ⭐ ART'S WAS THE LAST UNDECIDED ONE AND IT NEVER HAD TO BE DECIDED. docs/53 gave
    // her release condition as CAPABILITY - she executes a champion who becomes too
    // good to control - and `art_voice.js` still carries the five `cut_down` lines
    // written for it. They are the sharpest thing she has and they will never fire.
    //
    // 🚨 THE POOL STAYS, MARKED UNREACHABLE. Deleting it would be tidying away the one
    // piece of writing that says plainly what she is, and this project has twice been
    // glad it kept something a ruling retired. See the note in art_voice.js.
    art: { mode: 'never', speaksAtMax: true },
    crown: { mode: 'never', speaksAtMax: true },
  }

  // ⚠️ THE ARMED WINDOW IS STORED IN TICKS, AND server.tickCount RESETS TO ZERO ON
  // RESTART. That is finding K9 wearing a different hat: a stamp written before a
  // restart reads as enormously far in the future afterwards, so the player looks
  // permanently armed and every later death is a strike.
  //
  // A window can never legitimately sit further ahead than the longest buff we
  // ever grant (Blade's mark reward, 600s = 12000t). Anything beyond this ceiling
  // is a clock that moved, and is resolved as SURVIVED - fail toward the player,
  // because a player who was logged out through a restart certainly did not die to
  // that buff.
  var MAX_ARM_TICKS = 24000            // 2x the longest real window, as headroom

  var K_GOD = 'veldora_rel_god'        // which god this streak belongs to
  var K_N = 'veldora_rel_n'            // the streak itself
  var K_ARM = 'veldora_rel_arm'        // tick the armed window ENDS. 0 = not armed

  // ⚠️ NO TIME DECAY, and that is a deliberate reading of the spec rather than an
  // oversight. Ethan said "4x in a row" and "3x in a row"; consecutiveness IS the
  // forgiveness rule, so a second one would be a different mechanic.
  //
  // It does cut against the grain of regard.js, which decays 25/day precisely so
  // one bad week cannot eat a path. The difference is that regard rises on things
  // that happen TO you (dying in a cave) and these rise only on things you DID
  // (spent his buff badly, told her no). Left at 0 = off, as one line, so the
  // argument is reversible if it plays badly.
  var DECAY_DAYS = 0                   // 0 = off. >0 = a streak lapses after N days idle

  // ------------------------------------------------------------------- helpers
  function pathOf(p) {
    try { return p.persistentData.getString('veldora_path') || '' } catch (e) { return '' }
  }

  function ruleFor(key) {
    if (!key) return null
    return RULES[key] || null
  }

  function ticksNow(server) {
    try {
      var t = server.tickCount
      if (typeof t === 'number' && isFinite(t)) return t
    } catch (e) { }
    return null
  }

  function getInt(p, k) {
    // getInt returns 0 for a MISSING key as well as a stored zero. Every key here
    // treats 0 as "none", so that collision is harmless by construction - but it
    // is the reason none of them store a meaningful zero.
    try { return p.persistentData.getInt(k) || 0 } catch (e) { return 0 }
  }

  function putInt(p, k, v) {
    try { p.persistentData.putInt(k, v); return true } catch (e) {
      console.warn(TAG + 'could not store ' + k + ' for ' + (p.username || '?') + ' :: ' + e)
      return false
    }
  }

  function sys(p, text) {
    try { p.tell(Text.of(text)) } catch (e) { }
  }

  // ---------------------------------------------------------------------------
  // THE STREAK STORE.
  //
  // Tagged with the god it belongs to, so losing blade and later taking salvage
  // does not carry three of his strikes across. Checked lazily on every read
  // rather than hooked into the claim - one place to be wrong instead of two.
  // ---------------------------------------------------------------------------
  function streakOf(p, key) {
    var owner = ''
    try { owner = p.persistentData.getString(K_GOD) || '' } catch (e) { }
    if (owner !== key) return 0
    return getInt(p, K_N)
  }

  function setStreak(p, key, n) {
    try { p.persistentData.putString(K_GOD, key) } catch (e) { }
    putInt(p, K_N, n)
  }

  function clearStreak(p, key, why) {
    var had = streakOf(p, key)
    setStreak(p, key, 0)
    if (had > 0) {
      console.info(TAG + (p.username || '?') + ' ' + key + ' streak ' + had +
        ' -> 0 (' + why + ')')
    }
    return had
  }

  // ---------------------------------------------------------------------------
  // THE ARMED WINDOW — "he gave you something and it is still on you".
  //
  // resolveArmed() is the lazy evaluator, and it is called from EVERY read and
  // write. There is no tick loop: a window that closes while you are alive is
  // noticed the next time anybody looks, which is enough because the only thing
  // that consumes it is a death.
  //
  // Returns one of:
  //   'live'      the window is open right now - a death now is a STRIKE
  //   'survived'  it closed and you are still here - the streak is cleared
  //   'none'      nothing was armed
  // ---------------------------------------------------------------------------
  function resolveArmed(server, p, key) {
    var until = getInt(p, K_ARM)
    if (!until) return 'none'

    var now = ticksNow(server)
    if (now === null) {
      // No clock means we cannot prove the window is open OR closed. Do nothing at
      // all rather than guess - "I could not read it" and "it is closed" are
      // different answers and must not share a return value.
      console.warn(TAG + 'no tickCount - cannot resolve the armed window for ' +
        (p.username || '?') + '. Not striking, not clearing.')
      return 'none'
    }

    if (until - now > MAX_ARM_TICKS) {
      console.warn(TAG + 'armed stamp ' + until + ' is impossibly far past tick ' +
        now + ' - the server restarted under it. Resolving as SURVIVED rather ' +
        'than leaving ' + (p.username || '?') + ' permanently armed.')
      putInt(p, K_ARM, 0)
      clearStreak(p, key, 'clock moved under an armed window')
      return 'survived'
    }

    if (now <= until) return 'live'

    putInt(p, K_ARM, 0)
    clearStreak(p, key, 'survived a gift')
    return 'survived'
  }

  // ---------------------------------------------------------------------------
  // THE DOOR. One call, one place to be wrong.
  // ---------------------------------------------------------------------------
  function fire(server, p, key, why) {
    if (typeof VELDORA.theFall !== 'function') {
      // A gate ships with a live consumer or not at all. This project has shipped
      // a counter that maxed out and silently did nothing; say so instead.
      console.error(TAG + '!! ' + (p.username || '?') + ' hit the release condition on ' +
        key + ' (' + why + ') but VELDORA.theFall is MISSING. NOTHING HAPPENED. BUG.')
      return false
    }
    console.warn(TAG + '======== RELEASE: ' + (p.username || '?') + ' loses ' +
      key + ' - ' + why + ' ========')
    setStreak(p, key, 0)
    putInt(p, K_ARM, 0)
    return !!VELDORA.theFall(server, p, key)
  }

  // A strike of any kind. Returns the new streak, or -1 if this god does not use
  // streaks (which is NOT the same as a streak of zero, and must not read as one).
  function strike(server, p, key, kind, why) {
    var rule = ruleFor(key)
    if (!rule || rule.mode !== 'streak') return -1
    if (rule.kind !== kind) return -1

    var n = streakOf(p, key) + 1
    setStreak(p, key, n)
    console.info(TAG + (p.username || '?') + ' ' + key + ' ' + rule.noun + ' ' +
      n + '/' + rule.need + ' :: ' + (why || kind))

    if (n >= rule.need) {
      fire(server, p, key, rule.need + ' ' + rule.noun + 's in a row')
      return n
    }

    // THE LEGIBILITY LAW (regard.js, /regard): the player must be able to SEE the
    // thing that is about to take their path. Grey system text, deliberately not
    // in anyone's voice - the gods' lines are Ethan's to write.
    speakOnStrike(p, key, rule, n)
    return n
  }

  function speakOnStrike(p, key, rule, n) {
    var left = rule.need - n
    sys(p, '§8' + rule.blurb + ' §7(' + n + '/' + rule.need + ')')
    if (left === 1) {
      sys(p, '§c§lOne more and ' + nameOf(key) + ' is done with you.')
    }
  }

  function nameOf(key) {
    try {
      if (VELDORA.paths && typeof VELDORA.paths.nameOf === 'function') {
        return VELDORA.paths.nameOf(key)
      }
    } catch (e) { }
    return key
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE PUBLIC SEAM. Deliberately generic verbs, not per-god ones - the next god
  // registers a row in RULES and calls the same four functions.
  // ═══════════════════════════════════════════════════════════════════════════

  // A god gave this player something that lasts `ticks`. Blade's two buff sites
  // call this; anyone else's may.
  function armed(server, p, key, ticks) {
    var rule = ruleFor(key)
    if (!rule || rule.mode !== 'streak' || rule.kind !== 'buff_death') return false

    // Resolve the PREVIOUS window before opening a new one. If they lived through
    // the last gift, that forgiveness lands here.
    resolveArmed(server, p, key)

    var now = ticksNow(server)
    if (now === null) {
      console.warn(TAG + 'no tickCount - ' + (p.username || '?') +
        ' was armed by ' + key + ' but the window was NOT stored. No strike can follow.')
      return false
    }
    var span = (typeof ticks === 'number' && isFinite(ticks) && ticks > 0) ? ticks : 1200
    if (span > MAX_ARM_TICKS) span = MAX_ARM_TICKS
    putInt(p, K_ARM, now + span)
    console.info(TAG + (p.username || '?') + ' armed by ' + key + ' for ' + span +
      't (streak ' + streakOf(p, key) + '/' + (rule.need) + ')')
    return true
  }

  // The player refused an offer, explicitly.
  function denied(server, p, key, what) {
    return strike(server, p, key, 'denial', what || 'refused an offer')
  }

  // The player took one. Forgiveness, and it does not care whether the trade
  // actually completed - the streak measures denial, not success.
  function accepted(server, p, key, what) {
    var rule = ruleFor(key)
    if (!rule || rule.mode !== 'streak' || rule.kind !== 'denial') return false
    return clearStreak(p, key, 'accepted (' + (what || '?') + ')') >= 0
  }

  // The player never answered. LOGGED, NEVER COUNTED - see the header.
  function ignored(server, p, key, what) {
    var rule = ruleFor(key)
    if (!rule || rule.mode !== 'streak' || rule.kind !== 'denial') return false
    console.info(TAG + (p.username || '?') + ' let a ' + key + ' offer time out (' +
      (what || '?') + ') - NOT counted as a refusal. Streak stays at ' +
      streakOf(p, key) + '/' + rule.need)
    return true
  }

  function fallsOnRegard(key) {
    var rule = ruleFor(key)
    // ⚠️ AN UNKNOWN GOD FALLS. If a key is not in the registry the old behaviour
    // must survive, or adding a god silently makes it unloseable.
    if (!rule) return true
    return rule.mode === 'regard'
  }

  function speaksAtMax(key) {
    var rule = ruleFor(key)
    if (!rule) return true
    return rule.speaksAtMax !== false
  }

  function read(server, p) {
    var key = pathOf(p)
    var rule = ruleFor(key)
    if (!key) return { path: '', mode: 'none' }
    if (!rule) return { path: key, mode: 'regard', n: 0, need: 0 }
    if (rule.mode !== 'streak') return { path: key, mode: rule.mode, n: 0, need: 0 }
    var arm = resolveArmed(server, p, key)
    return {
      path: key, mode: 'streak', kind: rule.kind, noun: rule.noun,
      n: streakOf(p, key), need: rule.need, armed: arm,
    }
  }

  VELDORA.release = {
    armed: armed,
    denied: denied,
    accepted: accepted,
    ignored: ignored,
    fallsOnRegard: fallsOnRegard,
    speaksAtMax: speaksAtMax,
    read: read,
    rules: RULES,
    // exposed for the harness in tools/release_harness.js - the state machine is
    // the part worth testing without a server
    _strike: strike,
    _resolveArmed: resolveArmed,
    _streakOf: streakOf,
  }

  // ---------------------------------------------------------------------- death
  // Blade's half. Salvage never strikes on a death and Wall never strikes at all,
  // so this hook does nothing for them by construction rather than by an if.
  EntityEvents.death(function (event) {
    try {
      var p = event.entity
      if (!p || !p.player) return
      var server = null
      try { server = p.server } catch (e) { return }
      if (!server) return

      var key = pathOf(p)
      var rule = ruleFor(key)
      if (!rule || rule.mode !== 'streak' || rule.kind !== 'buff_death') return

      var state = resolveArmed(server, p, key)

      // 'survived' already cleared the streak inside resolveArmed - the window
      // closed BEFORE this death, so the gift was honoured and this death is
      // somebody else's problem (regard's).
      if (state !== 'live') return

      // One buff can only ever cost one strike: the window is consumed here. That
      // is also the spiral guard for free - P8 measured seven hostiles waiting at a
      // death site, and dying three more times on the way out cannot compound.
      putInt(p, K_ARM, 0)
      strike(server, p, key, 'buff_death', 'died with his gift still on')
    } catch (e) { console.warn(TAG + 'death hook threw :: ' + e) }
  })

  // -------------------------------------------------------------------- login
  // Resolve a window that closed while they were offline, so the forgiveness is
  // already banked by the time they look at /release.
  PlayerEvents.loggedIn(function (event) {
    try {
      var p = event.player
      if (!p) return
      var key = pathOf(p)
      var rule = ruleFor(key)
      if (!rule || rule.mode !== 'streak') return
      var server = null
      try { server = p.server } catch (e) { return }
      if (server) resolveArmed(server, p, key)
    } catch (e) { }
  })

  // ----------------------------------------------------------------- commands
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    event.register(Commands.literal('release').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var r = read(ctx.source.server, p)
      p.tell(Text.of('§8§m                                        '))
      if (!r.path) { p.tell(Text.of('§7You walk no path. Nobody can put you down.')); return 1 }

      var nm = nameOf(r.path)
      if (r.mode === 'never') {
        // 🔴 THIS SECOND LINE WAS A LIE TWICE OVER. It promised "winning the Harvest is
        // the only way out" - and the Harvest was cut on 2026-08-23 (docs/62), so the
        // way out did not exist; then 2026-08-24 removed endings entirely, so there is
        // no way out to describe. It now says the true thing, which is also worse.
        VELDORA.voice.chat(p, '§5§l' + nm + '§7 will never let you go.')
        p.tell(Text.of('§8Nor will any of them. That is not a threat - it is the arrangement.'))
        return 1
      }
      if (r.mode === 'regard') {
        p.tell(Text.of('§7' + nm + '§7 releases you when their regard fills.'))
        p.tell(Text.of('§8Use §f/regard§8 to see it.'))
        return 1
      }
      p.tell(Text.of('§7' + nm + '§7 counts §f' + r.n + '§7/' + r.need + ' ' +
        r.noun + 's in a row.'))
      var bar = ''
      for (var i = 0; i < r.need; i++) bar += (i < r.n) ? '§c[X]' : '§8[ ]'
      p.tell(Text.of(bar))
      if (r.kind === 'buff_death') {
        p.tell(Text.of('§8Survive one of his gifts and it goes back to zero.'))
        if (r.armed === 'live') p.tell(Text.of('§c§lHis gift is on you now. Do not die.'))
      } else {
        p.tell(Text.of('§8Take one deal and it goes back to zero.'))
      }
      return 1
    }))

    // Testing the whole condition by dying four times with a buff on, or by
    // waiting out three of her offers, is not a loop anybody will run. Same
    // reasoning as /fall_test, which this deliberately mirrors.
    var root = Commands.literal('release_test').requires(ADMIN)

    root = root.then(Commands.literal('strike').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var key = pathOf(p)
      var rule = ruleFor(key)
      if (!rule || rule.mode !== 'streak') {
        p.tell(Text.of('§c' + (key || 'no path') + ' does not use a streak.'))
        return 0
      }
      var n = strike(ctx.source.server, p, key, rule.kind, 'ADMIN /release_test')
      p.tell(Text.of('§7strike -> ' + n + '/' + rule.need))
      return 1
    }))

    root = root.then(Commands.literal('arm').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var key = pathOf(p)
      var ok = armed(ctx.source.server, p, key, 600)
      p.tell(Text.of(ok ? '§7armed for 600t - die inside it to take a strike'
        : '§c' + (key || 'no path') + ' does not arm.'))
      return 1
    }))

    root = root.then(Commands.literal('clear').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var key = pathOf(p)
      clearStreak(p, key, 'ADMIN /release_test clear')
      putInt(p, K_ARM, 0)
      p.tell(Text.of('§7streak and armed window cleared'))
      return 1
    }))

    event.register(root)
  })

  ServerEvents.loaded(function () {
    var rows = []
    for (var k in RULES) {
      if (!RULES.hasOwnProperty(k)) continue
      var r = RULES[k]
      rows.push(k + '=' + (r.mode === 'streak' ? (r.need + 'x ' + r.noun) : r.mode))
    }
    console.info(TAG + 'active - ' + rows.join(' · '))
    console.info(TAG + 'regard.js no longer falls for: ' +
      (function () {
        var out = []
        for (var k2 in RULES) {
          if (RULES.hasOwnProperty(k2) && RULES[k2].mode !== 'regard') out.push(k2)
        }
        return out.join(', ')
      })() + ' - they have their own condition')
    if (DECAY_DAYS > 0) console.info(TAG + 'streaks lapse after ' + DECAY_DAYS + ' idle days')
    else console.info(TAG + 'streaks do NOT decay - "in a row" is the only forgiveness')
  })
})()
