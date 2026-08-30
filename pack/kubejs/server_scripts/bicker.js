// bicker.js — the gods talking to each other while you happen to be standing there.
//
// Ethan wrote the scenes; this decides WHEN one is overheard and WHO may overhear it.
// The words are `docs/dialogue/Bickering Doc *.txt` -> bicker_scenes.js (generated).
//
// ── ⭐ WHAT MAKES A SCENE ELIGIBLE ───────────────────────────────────────────
// Two things, taken straight from the header he put on every document:
//
//   "Champion - agnostic: Can play if only one of the champions is a god of either."
//   "Champion - Champion: Requires a champion of [the named god] on the other end."
//
// So an AGNOSTIC scene needs one online champion of either god in the pair; a GATED
// scene needs a champion of the god named in the section header. And the section's
// trust tier must match THAT champion's tier with THEIR OWN god.
//
// ⚠️ THAT LAST PART IS AN INTERPRETATION, and it is the one worth arguing with. The
// documents say "Low Trust" without saying whose. Reading it as the listening champion's
// own trust is the only version that makes the tiers mean anything from where the player
// is standing: at low trust you overhear Art approving of the Warrior, and at high trust
// you overhear her extracting a promise from him. The scene escalates as YOUR
// relationship does, which is what a trust tier is for.
//
// ── 🚨 AN UNREADABLE TIER MATCHES NOTHING ────────────────────────────────────
// docs/41 invariant #4. If the counter cannot be read, the champion satisfies no tier and
// no scene fires. Defaulting to `low` would make every storage hiccup produce the
// low-trust scene, which is the version where the gods are politest - so the failure
// would look like content rather than a fault.
//
// ── ⚠️ IT NEEDS TWO PLAYERS, AND THAT IS NOT THIS FILE'S RULE ────────────────
// broadcast.js enforces it, from Ethan's original: "for both of the players to hear IF
// THERE'S MORE THAN ONE." A solo player must never be able to tell this exists and is
// missing, so there is no teaser and no log line they could see.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[bicker] '
  var GATE = true

  // ⭐ AMBIENT, NOT FREQUENT. This is contempt overheard in passing; a pair of gods who
  // bicker every two minutes are a sitcom. Rolled every ROLL ticks at CHANCE, so the
  // expected wait is long and the arrival is unpredictable.
  var ROLL = 20 * 90            // roll every 90s
  var CHANCE = 0.18
  var COOLDOWN = 20 * 60 * 6    // ...and never within 6 minutes of the last one

  // ⚠️ Ethan's documents write "Med"; the counter tiers are named "medium". One
  // translation, here, rather than either side bending to the other.
  var TIER = { low: 'low', med: 'medium', high: 'high' }

  var lastAt = -999999
  var recent = []               // scene indices lately played, so they do not repeat
  var RECENT_MAX = 12
  var played = 0, skipped = 0

  function scenes() {
    try {
      if (VELDORA.bickerScenes && typeof VELDORA.bickerScenes.all === 'function') {
        return VELDORA.bickerScenes.all() || []
      }
    } catch (e) { }
    return []
  }

  function godOf(p) {
    try {
      if (VELDORA.paths && typeof VELDORA.paths.pathOf === 'function') {
        return VELDORA.paths.pathOf(p) || null
      }
    } catch (e) { }
    return null
  }

  function tierOf(god, p) {
    try {
      if (VELDORA.pantheon && typeof VELDORA.pantheon.tierOf === 'function') {
        return VELDORA.pantheon.tierOf(god, p)
      }
    } catch (e) { }
    return null
  }

  /**
   * Can this scene be overheard right now?
   *
   * ⭐ Returns the QUALIFYING PLAYER rather than a boolean — useful in the test command,
   * and it makes "why did nothing fire" answerable instead of a shrug.
   */
  function qualifies(sc, players) {
    var want = TIER[sc.tier]
    if (!want) return null
    for (var i = 0; i < players.length; i++) {
      var p = players[i]
      var g = godOf(p)
      if (!g) continue                                   // pathless: overhears nothing
      if (sc.needs) {
        if (g !== sc.needs) continue
      } else if (g !== sc.pair[0] && g !== sc.pair[1]) {
        continue
      }
      // 🚨 null (unreadable) never equals a tier name, which is the intended behaviour
      // rather than an accident of comparison - see the header.
      if (tierOf(g, p) === want) return p
    }
    return null
  }

  function eligible(players) {
    var all = scenes()
    var out = []
    for (var i = 0; i < all.length; i++) {
      if (recent.indexOf(i) >= 0) continue
      if (qualifies(all[i], players)) out.push(i)
    }
    // ⚠️ If EVERY eligible scene has been played recently, forget the history rather
    // than going silent. A pair with three scenes would otherwise stop talking forever.
    if (!out.length) {
      recent = []
      for (var j = 0; j < all.length; j++) if (qualifies(all[j], players)) out.push(j)
    }
    return out
  }

  function fire(server, forced) {
    var all = scenes()
    if (!all.length) return 'no-scenes'
    var ps = []
    try { ps = server.players || [] } catch (e) { return 'no-players' }

    var pool = eligible(ps)
    if (!pool.length) return 'none-eligible'

    var idx = pool[Math.floor(Math.random() * pool.length)]
    var sc = all[idx]
    var why = sc.pair.join('+') + '/' + sc.tier + (sc.needs ? '/' + sc.needs : '')

    var r = 'no-broadcast'
    try {
      if (VELDORA.broadcast && typeof VELDORA.broadcast.scene === 'function') {
        r = VELDORA.broadcast.scene(server, sc.turns, {
          why: 'bicker ' + why,
          // ⚠️ Only the forced (admin) path relaxes the two-player rule, and only so a
          // single tester can see it at all. The ambient path never does.
          minPlayers: forced ? 1 : 2,
        })
      }
    } catch (e) { return 'threw' }

    if (r === 'sent') {
      played++
      recent.push(idx)
      while (recent.length > RECENT_MAX) recent.shift()
      try { lastAt = server.tickCount } catch (e) { }
    } else {
      skipped++
    }
    return r
  }

  function roll(server) {
    try {
      if (!GATE) return
      var now = 0
      try { now = server.tickCount } catch (e) { }
      if (now - lastAt < COOLDOWN) return
      if (Math.random() > CHANCE) return
      fire(server, false)
    } catch (e) { console.warn(TAG + 'roll threw :: ' + e) }
  }

  function schedule(server) {
    server.scheduleInTicks(ROLL, function () { roll(server); schedule(server) })
  }

  VELDORA.bicker = {
    fire: fire,
    qualifies: qualifies,
    eligible: eligible,
    stats: function () { return { played: played, skipped: skipped } },
  }

  ServerEvents.loaded(function (event) {
    var all = scenes()
    if (!GATE) { console.info(TAG + 'GATED OFF'); return }
    if (!all.length) {
      console.error(TAG + 'no scenes - run `python tools/bicker_import.py --write`')
      return
    }
    var turns = 0, chunks = 0, gated = 0, pairs = {}
    for (var i = 0; i < all.length; i++) {
      turns += all[i].turns.length
      for (var t = 0; t < all[i].turns.length; t++) chunks += all[i].turns[t].chunks.length
      if (all[i].needs) gated++
      pairs[all[i].pair.join('+')] = true
    }
    var np = 0
    for (var k in pairs) if (pairs.hasOwnProperty(k)) np++
    console.info(TAG + all.length + ' authored scenes across ' + np + ' pairings - ' +
      turns + ' turns, ' + chunks + ' beats, ' + gated + ' gated on a specific champion. ' +
      'Ethan\'s words, from docs/dialogue. Rolled every ' + (ROLL / 20) + 's at ' +
      Math.round(CHANCE * 100) + '%, never within ' + (COOLDOWN / 1200) + ' minutes of ' +
      'the last, and never to fewer than two players.')
    schedule(event.server)
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    if (!Commands) return
    try {
      event.register(Commands.literal('bicker')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .executes(function (ctx) {
          var p = ctx.source.player
          var srv = null
          try { srv = p.server } catch (e) { }
          if (!srv) return 0
          var ps = []
          try { ps = srv.players || [] } catch (e) { }
          var pool = eligible(ps)
          p.tell(Text.of('§8' + scenes().length + ' scenes, §f' + pool.length +
            '§8 eligible right now'))
          // ⭐ Say WHY when nothing is eligible. "Nothing happened" is the least useful
          // possible answer, and this is exactly the surface where it would be given.
          if (!pool.length) {
            var g = godOf(p)
            p.tell(Text.of('§8your path: §f' + (g || 'none') + '§8, tier §f' +
              (g ? (tierOf(g, p) || 'UNREADABLE') : '-')))
            p.tell(Text.of('§7a scene needs an online champion of one of its two gods, ' +
              'at the scene\'s trust tier'))
            return 1
          }
          p.tell(Text.of('§8firing one: §f' + fire(srv, true)))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
