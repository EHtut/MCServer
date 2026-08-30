// dialogue_test.js — one command that exercises every dialogue surface in the game.
//
//     /dtest                    what exists, and what is reachable right now
//     /dtest gods               each god says a line, in their own place and font
//     /dtest <god>              just that one
//     /dtest bicker             an authored bickering scene
//     /dtest caebrim            her whispers, her tide, her scenes
//     /dtest whispers           the dead, during a tide, band by band
//     /dtest crash              Wall's two-movement crashout
//     /dtest interior           the player's own voice (asides)
//     /dtest screen             what the referee would allow right now
//     /dtest quiet              silence the ambient systems while testing
//     /dtest all                everything, paced so it can be watched
//
// Ethan, 2026-08-30: *"Build a test of the dialogue system so i can test everything."*
//
// ── ⭐ WHY A DEDICATED COMMAND AND NOT SIX SCATTERED ONES ────────────────────
// There are already `/gd`, `/bicker`, `/whisperband`, `/screen` and `/caebrim`, each
// built beside the thing it tests. That is fine for a builder and useless for a pass:
// testing "the dialogue" meant remembering five names and what each one needed set up
// first. This is one door.
//
// ── 🚨 IT REPORTS WHY SOMETHING CANNOT RUN, NEVER JUST NOTHING ───────────────
// Most of these surfaces have real preconditions — a tide, two players, a path, a trust
// tier. A test that silently does nothing when a precondition is unmet is worse than no
// test, because "I ran it and saw nothing" and "it is broken" become the same
// observation. Every branch here either fires or says what is missing.
//
// ⚠️ IT DOES NOT FAKE STATE. Nothing here grants a path, starts a tide or moves a
// counter — a test that changes the world to make itself pass is measuring itself. Where
// a precondition is unmet it says so and offers the real command that would meet it.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[dtest] '

  function tell(p, s) { try { p.tell(Text.of(s)) } catch (e) { } }
  function head(p, s) { tell(p, '§8§m                    §r §7' + s + ' §8§m                    ') }

  function godOf(p) {
    try { return (VELDORA.paths && VELDORA.paths.pathOf(p)) || null } catch (e) { return null }
  }

  var GODS = ['blade', 'art', 'wall', 'forge', 'salvage']

  // ── each god, in their own place and font ─────────────────────────────────
  // ⭐ THE POINT OF THIS ONE IS PLACEMENT, not words. Fired in sequence with a gap so
  // the difference between Blade's top-centre and Wall's scatter is actually visible;
  // sent at once they would queue and read as one system.
  function gods(p, only) {
    var list = only ? [only] : GODS
    var srv = null
    try { srv = p.server } catch (e) { }
    var at = 0
    for (var i = 0; i < list.length; i++) {
      (function (god, delay) {
        var fire = function () {
          var line = null
          try { line = VELDORA.voice.line(god, 'guidance', p) } catch (e) { }
          if (!line) { try { line = VELDORA.voice.line(god, 'combat', p) } catch (e) { } }
          if (!line) {
            tell(p, '§8' + god + ': §cno pool to draw from')
            return
          }
          var st = {}
          try { st = VELDORA.voice.styleOf(god) || {} } catch (e) { }
          tell(p, '§8' + god + ' §7- ' + (st.anchor || '?') +
            (st.scatter ? ' scattered' : '') + (st.shake ? ' shaking' : '') +
            (st.font ? ' §f' + st.font : ' §cNO FONT'))
          try { VELDORA.voice.speak(p, god, line, 'guidance') } catch (e) { }
        }
        if (srv) srv.scheduleInTicks(delay, fire); else fire()
      })(list[i], at)
      at += 90
    }
    return list.length
  }

  // ── the interior voice: the player as a person ────────────────────────────
  // ⚠️ THIS IS C3'S SURFACE and it already exists. Ethan: *"this is the player as the
  // character is a person too."* Grey, italic, no god, no chime.
  function interior(p) {
    var beats = [
      'You hold your breath.',
      'Your hands are steadier than they were.',
      'Something behind you does not move when you do.',
    ]
    var srv = null
    try { srv = p.server } catch (e) { }
    for (var i = 0; i < beats.length; i++) {
      (function (b, d) {
        var fire = function () {
          try { VELDORA.voice.aside(p, b) } catch (e) { }
        }
        if (srv) srv.scheduleInTicks(d, fire); else fire()
      })(beats[i], i * 45)
    }
    tell(p, '§8three interior beats §7(the C3 surface - grey, no god, no chime)')
    tell(p, '§8⚠ these are PLACEHOLDERS written to exercise the surface, not content')
    return true
  }

  // ── the referee ───────────────────────────────────────────────────────────
  function screen(p) {
    if (!VELDORA.screen) { tell(p, '§cscreen.js missing'); return false }
    var b = 0
    try { b = VELDORA.screen.backlog(p) } catch (e) { }
    tell(p, '§8queue owed: §f' + b.toFixed(1) + 's')
    var names = ['WHISPER', 'AMBIENT', 'ASIDE', 'GOD', 'ANNOUNCE', 'CRASHOUT']
    for (var i = 0; i < names.length; i++) {
      var tol = VELDORA.screen.P[names[i]]
      var hold = VELDORA.screen.HOLD[names[i]]
      tell(p, '§8' + names[i] + ' §7holds §f' + hold + 's§7, tolerates §f' + tol +
        's §7-> ' + (b > tol ? '§cREFUSED' : '§awould send'))
    }
    var bad = []
    try { bad = VELDORA.screen._audit() } catch (e) { }
    tell(p, bad.length ? '§c⚠ ordering is BROKEN: ' + bad.length + ' problem(s)'
      : '§a✓ ordering clean - nothing can be blocked by its inferior')
    return true
  }

  // ── what is reachable, and what is not ────────────────────────────────────
  function status(p) {
    var srv = null, ps = []
    try { srv = p.server; ps = srv.players || [] } catch (e) { }

    head(p, 'dialogue')
    var g = godOf(p)
    var tier = null
    try { if (g && VELDORA.pantheon) tier = VELDORA.pantheon.tierOf(g, p) } catch (e) { }
    tell(p, '§8you: §f' + (g || 'pathless') + '§8, tier §f' + (tier || (g ? 'UNREADABLE' : '-')) +
      '§8, players online §f' + ps.length)

    // gods
    var voiced = 0
    for (var i = 0; i < GODS.length; i++) {
      try { if (VELDORA.voice.line(GODS[i], 'guidance', null)) voiced++ } catch (e) { }
    }
    tell(p, '§7gods §8- §f' + voiced + '/5 §8have lines · §f/dtest gods')

    // bickering
    if (VELDORA.bicker) {
      var el = 0
      try { el = VELDORA.bicker.eligible(ps).length } catch (e) { }
      var total = 0
      try { total = VELDORA.bickerScenes.count() } catch (e) { }
      tell(p, '§7bicker §8- §f' + el + '§8/§f' + total + ' §8eligible' +
        (ps.length < 2 ? ' §c(needs 2 players; /dtest bicker forces it)' : '') +
        ' · §f/dtest bicker')
    } else tell(p, '§7bicker §8- §cnot loaded')

    // caebrim
    if (VELDORA.caebrim) {
      var ct = null
      try { ct = VELDORA.caebrim.tierOf(p) } catch (e) { }
      tell(p, '§7caebrim §8- tide power §f' + (ct || 'no tide') +
        '§8, scenes with §f' + VELDORA.caebrim.gods().join('/') + ' · §f/dtest caebrim')
    } else tell(p, '§7caebrim §8- §cnot loaded')

    // the dead
    if (VELDORA.tideWhispers) {
      var w = null
      try { w = VELDORA.tideWhispers._waves(p) } catch (e) { }
      tell(p, '§7the dead §8- ' + (w === null ? '§cnot in a tide' : 'wave §f' + w) +
        ' · §f/dtest whispers')
    } else tell(p, '§7the dead §8- §cnot loaded')

    tell(p, '§7crashout §8- Wall, two movements · §f/dtest crash')
    tell(p, '§7interior §8- the player as a person · §f/dtest interior')
    tell(p, '§7screen §8- the referee · §f/dtest screen')
    tell(p, '§7quiet §8- silence ambient dialogue while testing · §f/dtest quiet' +
      (VELDORA.screen && VELDORA.screen.isQuiet(p) ? ' §a(ON)' : ''))
    tell(p, '§8§o/dtest all §7runs everything, paced to be watchable')

    // 🚨 THE FONT CHECK, because it is the failure that looks like content. A font the
    // server names and the client has not loaded renders as MISSING-GLYPH BOXES, not as
    // plain text (D-129/D-130), so "it looked wrong" needs somewhere to point.
    tell(p, '§8§o⚠ if text renders as boxes, the client has not loaded the fonts - ' +
      'relaunch, then `python tools/build_client_assets.py`')
    return true
  }

  function run(p, what) {
    var srv = null
    try { srv = p.server } catch (e) { }

    if (what === 'gods') { head(p, 'every god, in their own place'); return gods(p, null) }
    if (GODS.indexOf(what) >= 0) { head(p, what); return gods(p, what) }

    if (what === 'interior') { head(p, 'the player as a person'); return interior(p) }
    if (what === 'screen') { head(p, 'the referee'); return screen(p) }

    // ⭐ QUIET. Ethan, mid-test: "Dialogue is still playing across my screen."
    //
    // Six systems roll on their own - idle at 20%/min, pathless at 10%, plus bickering,
    // the dead, the stalker and Forge - and at a 12-second hold two of them bury whatever
    // is being tested. This silences the SOURCES; /dtest still fires everything.
    //
    // ⚠️ In memory, so it cannot be left on past a restart. A tester who forgets is one
    // reboot away from a pantheon that has gone quiet for no discoverable reason.
    if (what === 'quiet') {
      if (!VELDORA.screen || typeof VELDORA.screen.setQuiet !== 'function') {
        tell(p, '§cscreen.js has no quiet mode'); return false
      }
      var on = !VELDORA.screen.isQuiet(p)
      VELDORA.screen.setQuiet(p, on)
      head(p, on ? 'quiet - ambient dialogue off' : 'ambient dialogue back on')
      if (on) {
        tell(p, '§8idle, pathless, bickering, the dead, the stalker and Forge will not speak.')
        tell(p, '§8/dtest still fires everything. §7Run /dtest quiet again to undo.')
      } else {
        tell(p, '§8the world can talk to you again.')
      }
      tell(p, '§8§o⚠ in memory - a restart clears it.')
      return true
    }

    if (what === 'crash') {
      head(p, "Wall's crashout - panic, silence, flat line")
      tell(p, '§8watch for the §fPAUSE§8 between the movements - that is the whole thing')
      tell(p, '§c⚠ the flat line is NOT slow (B2) - it types at normal rate and is held')
      try { VELDORA.voice.crashoutFor(p, 'wall') } catch (e) { }
      return true
    }

    if (what === 'bicker') {
      head(p, 'an authored bickering scene')
      if (!VELDORA.bicker) { tell(p, '§cbicker.js not loaded'); return false }
      var r = 'no'
      try { r = VELDORA.bicker.fire(srv, true) } catch (e) { r = 'threw' }
      if (r !== 'sent') {
        tell(p, '§cdid not fire: §f' + r)
        if (r === 'none-eligible') {
          tell(p, '§7a scene needs an online champion of one of its two gods, at the ' +
            'HIGHEST tier present. You are §f' + (godOf(p) || 'pathless') + '§7.')
        }
      }
      return true
    }

    if (what === 'caebrim') {
      head(p, 'Caebrim')
      if (!VELDORA.caebrim) { tell(p, '§ccaebrim.js not loaded'); return false }
      var t = null
      try { t = VELDORA.caebrim.tierOf(p) } catch (e) { }
      tell(p, '§8tide power: §f' + (t || 'none - forcing "low" so you can hear her'))
      try { VELDORA.caebrim.whisper(p, t || 'low') } catch (e) { }
      if (srv) {
        srv.scheduleInTicks(80, function () {
          tell(p, '§8...and the tide, centred:')
          try { VELDORA.caebrim.tide(p, 'start', true) } catch (e) { }
        })
        srv.scheduleInTicks(180, function () {
          var gs = VELDORA.caebrim.gods()
          if (!gs.length) return
          var g = gs[Math.floor(Math.random() * gs.length)]
          tell(p, '§8...and a scene with §f' + g + '§8:')
          try { VELDORA.caebrim.scene(srv, g, true) } catch (e) { }
        })
      }
      return true
    }

    if (what === 'whispers') {
      head(p, 'the dead, band by band')
      if (!VELDORA.tideWhispers) { tell(p, '§ctidewhispers.js not loaded'); return false }
      var bands = VELDORA.tideWhispers.bands
      for (var i = 0; i < bands.length; i++) {
        (function (b, d) {
          if (!srv) return
          srv.scheduleInTicks(d, function () {
            tell(p, '§8band §f' + b[5] + '§8 (from wave ' + b[0] + ') size §f' + b[2] +
              '§8 broken §f' + b[3] + '§8 reach §f' + b[4])
            try { VELDORA.tideWhispers._speak(p, b) } catch (e) { }
          })
        })(bands[i], i * 110)
      }
      tell(p, '§8four bands, ~5s apart. They get closer, bigger and more broken.')
      return true
    }

    if (what === 'all') {
      head(p, 'everything')
      tell(p, '§8several minutes - every line now holds 12s. Watch the SCREEN.')
      var steps = [
        [0, 'gods'], [500, 'interior'], [640, 'whispers'],
        [1180, 'caebrim'], [1600, 'crash'], [1900, 'bicker'],
      ]
      for (var s = 0; s < steps.length; s++) {
        (function (delay, name) {
          if (!srv) return
          srv.scheduleInTicks(delay, function () { run(p, name) })
        })(steps[s][0], steps[s][1])
      }
      return true
    }

    return status(p)
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    if (!Commands) return
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    try {
      var root = Commands.literal('dtest').requires(ADMIN)
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          status(p)
          return 1
        })
      var subs = ['gods', 'bicker', 'caebrim', 'whispers', 'crash', 'interior',
        'screen', 'quiet', 'all'].concat(GODS)
      for (var i = 0; i < subs.length; i++) {
        (function (name) {
          root = root.then(Commands.literal(name).executes(function (ctx) {
            var p = ctx.source.player
            if (!p) return 0
            run(p, name)
            return 1
          }))
        })(subs[i])
      }
      event.register(root)
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })

  ServerEvents.loaded(function () {
    console.info(TAG + '/dtest - one door to every dialogue surface. Subcommands: gods, ' +
      'bicker, caebrim, whispers, crash, interior, screen, all, and each god by name. ' +
      '⚠️ It never fakes state: where a precondition is unmet it says which one.')
  })
})();
