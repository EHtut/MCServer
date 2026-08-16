// arrival.js - THE FIRST THING THAT EVER HAPPENS TO YOU.  docs/28 "THE ARRIVAL"
//
// Ethan wrote this scene on 2026-08-14. It is marked CANON in docs/28 and it was
// NEVER BUILT - no script fired it, which is why he had never seen it. The text
// below is his, quoted exactly.
//
// ── ⭐ WHY IT IS THE BEST SCENE IN THE PROJECT ──────────────────────────────
// `30-THE-THESIS.md` complained that none of the patron scenes are actually OF
// Veldora - nobody mentions the descent, the watching, or that you cannot die. The
// proposed fix was exposition: give each god one line that could only be said here.
//
// Ethan wrote AN ARGUMENT instead, and you learn the world from how they disagree.
// Every god states their entire thesis in one line and NONE OF THEM IS TALKING TO
// YOU. You are the thing being argued over, before you have done anything at all.
//
// ── THREE RULES THIS SCENE MADE CANON ──────────────────────────────────────
// 1. THEY ADDRESS EACH OTHER BY SPECIES, NEVER BY NAME - spider, wolf, Goat.
//    Nobody in this world uses proper names for these things, including them.
// 2. ART HAS AUTHORITY. "ENOUGH!" and the argument stops dead. The gentlest patron
//    is the one the others obey.
// 3. WALL IS CUT OFF TWICE. Her shrinking ask never gets finished, and that is the
//    whole character before she has a single line of her own.
//
// ⚠️ EVERY GOD SPEAKS IN THEIR OWN COLOUR. This is the payoff for fixing the colour
// system: five voices arguing with no name tags, and you can still follow who is
// who. Forge and Art have no voice files yet, so their colours are declared HERE
// and registered centrally - when those gods are built they inherit them rather
// than picking new ones.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[arrival] '
  var GATE = true

  var K_SEEN = 'veldora_arrival_seen'   // once ever, per player
  var GAP = 55                          // ticks between lines
  // ⏱️ ONE MINUTE. Ethan, 2026-08-15: "the intro needs to be a minute after joining
  // to allow for actually loading in."
  //
  // 5s was wrong and would have wasted the scene: on a 218-mod pack a client is
  // still streaming chunks, resolving Distant Horizons and settling its framerate
  // for most of the first minute. The best writing in the project would have played
  // over a loading screen.
  var JOIN_DELAY = 1200                 // 60s

  // ⚠️ FORGE AND ART GET THEIR COLOURS HERE because this scene needs them before
  // either god exists. Registered into voice.js so there is still exactly ONE place
  // that knows what colour a god is.
  var COLOUR = {
    blade: '§4§l',      // dark red
    wall: '§5§l',       // dark purple
    salvage: '§6§l',    // gold
    forge: '§2§l',      // dark green - the Goat, and everything he builds
    art: '§d§l',        // light purple - the Dreamwalker, and not the Spider's
  }

  var NARRATE = '§7§o'

  // ── Ethan's text, exactly. Speaker keys drive the colour. ────────────────
  // A `*` entry is narration; a two-element entry is [who, what].
  var SCENE = [
    ['*', 'Your head spins. You feel nauseous.'],
    ['', ''],
    ['blade', 'A new one has joined our plane.'],
    ['wall', 'They look lost. Lonely. Perhaps I can...'],
    ['blade', 'No, they must prove themself, spider. Prove they can stand above all the other.'],
    ['wall', 'What if they can\'t? What if they need someone to-'],
    ['', ''],
    ['*', 'You blink as five shapes flash across your vision for half a second. You look forwards again.'],
    ['', ''],
    ['salvage', 'Silence, Spider. To live in a world such as this they need to forge a pact. To make a deal. The cost of survival. The price to thrive!'],
    ['forge', 'Please spare us the rhetoric, wolf. To survive in this world they must thrive not from your pathetic pacts or deals. No. They must build. They must overcome.'],
    ['salvage', 'You exploit my lands, Goat.'],
    ['forge', 'Fight back then, or perhaps you\'d prefer to hide away in your shadowy dealings-'],
    ['', ''],
    ['art', 'ENOUGH!'],
    ['art', 'You confuse the youngling. They must understand, and to understand they must have a moment of silence.'],
    ['', ''],
    ['*', 'The figures fade from your vision.'],
  ]

  function seen(p) {
    try { return (p.persistentData.getInt(K_SEEN) || 0) > 0 } catch (e) { return true }
  }

  function colourOf(god) {
    try {
      if (VELDORA.voice && typeof VELDORA.voice.colourOf === 'function') {
        return VELDORA.voice.colourOf(god)
      }
    } catch (e) { }
    return COLOUR[god] || '§4§l'
  }

  function play(server, p) {
    // 🚨 STAMPED BEFORE THE SCENE, not after. "Once ever" has to survive the ritual
    // refusing to open - otherwise a player who logs in mid-scene gets the arrival
    // again on every single join, forever.
    try { p.persistentData.putInt(K_SEEN, 1) } catch (e) { }

    var lines = []
    for (var i = 0; i < SCENE.length; i++) {
      var who = SCENE[i][0], what = SCENE[i][1]
      if (!what) { lines.push(''); continue }
      if (who === '*') { lines.push(NARRATE + what); continue }
      lines.push(colourOf(who) + what)
    }

    var began = false
    if (VELDORA.ritual && typeof VELDORA.ritual.begin === 'function') {
      try {
        // ⭐ THROUGH THE RITUAL, so they are blind and rooted. Art ends the scene by
        // demanding "a moment of silence" - the player is ALREADY being held in one
        // while she says it, which is the closest this project gets to a joke.
        began = VELDORA.ritual.begin(p, { lines: lines, gap: GAP, options: [] })
      } catch (e) { console.error(TAG + 'ritual threw :: ' + e) }
    }

    if (!began) {
      // Fail LOUD and still deliver it. A player only ever gets one first join, and
      // silently skipping the scene because a primitive was busy would cost them the
      // opening of the game with nothing in the log to say why.
      console.error(TAG + '!! ritual refused for ' + p.username +
        ' - delivering the Arrival as plain chat instead')
      for (var j = 0; j < lines.length; j++) {
        (function (idx, text) {
          server.scheduleInTicks(idx * GAP, function () {
            try { p.tell(Text.of(text)) } catch (e) { }
          })
        })(j, lines[j])
      }
    }
    console.info(TAG + '!! ' + p.username + ' SAW THE ARRIVAL - ' + lines.length +
      ' lines, five voices' + (began ? ' (held)' : ' (PLAIN CHAT - ritual was busy)'))
  }

  PlayerEvents.loggedIn(function (event) {
    if (!GATE) return
    try {
      var p = event.player
      if (!p || seen(p)) return
      var server = null
      try { server = p.server } catch (e) { return }
      if (!server) return
      // 🚨 A MINUTE IS LONG ENOUGH TO LEAVE IN. The stamp lives in play(), so a
      // player who joins and disconnects inside the window would be marked as having
      // seen the Arrival and would NEVER get it - they only ever get one first join.
      // So the timer re-checks that they are still online, and if they are not it
      // does nothing at all: no stamp, no scene, and it fires on their next join.
      //
      // It also re-checks `seen`, because two logins inside one minute would
      // otherwise queue two timers and play the scene twice.
      server.scheduleInTicks(JOIN_DELAY, function () {
        try {
          var still = null
          try { still = server.getPlayer(p.username) } catch (e) { }
          if (!still) {
            console.info(TAG + p.username + ' left before the Arrival could play - ' +
              'NOT stamped, they will get it next time')
            return
          }
          if (seen(still)) return
          play(server, still)
        } catch (e) { console.error(TAG + 'play threw :: ' + e) }
      })
    } catch (err) { console.warn(TAG + 'login hook threw :: ' + err) }
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    var root = Commands.literal('arrival').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      try { p.persistentData.putInt(K_SEEN, 0) } catch (e) { }
      play(ctx.source.server, p)
      return 1
    })
    root = root.then(Commands.literal('reset').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      try { p.persistentData.putInt(K_SEEN, 0) } catch (e) { }
      p.tell(Text.of('§7You have not arrived yet.'))
      return 1
    }))
    event.register(root)
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF'); return }
    // Register Forge's and Art's colours centrally, so those gods inherit them when
    // they are eventually built instead of choosing new ones.
    if (VELDORA.voice && typeof VELDORA.voice.setColour === 'function') {
      for (var g in COLOUR) {
        if (!COLOUR.hasOwnProperty(g)) continue
        try {
          if (!VELDORA.voice.pools || !VELDORA.voice.pools[g]) {
            VELDORA.voice.setColour(g, COLOUR[g])
          }
        } catch (e) { }
      }
    }
    var spoken = 0
    for (var i = 0; i < SCENE.length; i++) if (SCENE[i][1]) spoken++
    console.info(TAG + 'THE ARRIVAL armed - ' + spoken + ' lines, five voices, once ' +
      'per player on first join. They argue about you before you have done anything.')
  })
})();
