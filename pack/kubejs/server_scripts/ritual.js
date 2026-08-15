// ritual.js - I1 of the Introductions build.  docs/26-INTRODUCTIONS.md
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

  // ---------------------------------------------------------------------------
  // THE RELEASE. Everything that ends a ritual comes through here, including the
  // login recovery, so there is exactly one definition of "released".
  // Safe to call on a player who is not in a ritual - that is the point.
  // ---------------------------------------------------------------------------
  function release(p, why) {
    if (!p) return
    for (var i = 0; i < EFFECTS.length; i++) {
      try { p.potionEffects.remove(EFFECTS[i][0]) } catch (e) { }
    }
    try { p.persistentData.putBoolean(FLAG, false) } catch (e) { }
    var k = keyOf(p)
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

    var speakFor = LEAD + (lines.length * gap) + TAIL
    var whole = speakFor + (options.length ? TIMEOUT : 0) + hold

    STATE[k] = {
      awaiting: false, options: options, hold: hold,
      onChoose: spec.onChoose, onTimeout: spec.onTimeout,
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

    // The lines.
    for (var i = 0; i < lines.length; i++) {
      (function (idx, text) {
        server.scheduleInTicks(LEAD + (idx * gap), function () {
          try {
            if (!STATE[k]) return                 // cancelled or logged out
            tell(p, text)
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
            var line = Text.of('  §f§n' + options[o].label)
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
    release(p, 'LOGIN RECOVERY - was mid-ritual')
    console.error(TAG + 'recovered ' + safeName(p) + ' from an interrupted ritual. ' +
      'If this fires often, something is ending scenes without releasing.')
    tell(p, '§8You come back to yourself.')
  })

  PlayerEvents.loggedOut(function (event) {
    try { release(event.player, 'logged out') } catch (e) { }
  })

  // A death mid-scene would otherwise leave the state map holding a corpse.
  EntityEvents.death(function (event) {
    try {
      var e = event.entity
      if (e && e.player) release(e, 'died mid-ritual')
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
            pl.tell(Text.of(id === 'accept' ? '§4§lGood.' : '§4§lOf course.'))
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
        release(p, 'manual /ritual clear')
        p.tell(Text.of('§7Released.'))
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
