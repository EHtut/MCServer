// pathless.js - WHAT YOU HEAR BEFORE YOU CHOOSE.  docs/23, docs/41
//
// Ethan, 2026-08-15:
//   "what if we cut books entirely and we deliver hints through the dialogue?
//    So a pathless player would hear the whispers of gods discussing plus their
//    own feelings towards progression. And a path player would have their god
//    tell them how to progress."
//
// ── ⭐ WHY THIS IS BETTER THAN THE BOOK IT REPLACES ─────────────────────────
// A guidebook is handed to everyone, says the same thing to all of them, and is
// stale the day a mod changes. This is the opposite on every axis: it arrives in a
// god's own voice, at a moment you happen to be standing still, and it says
// something different depending on who is talking.
//
// And it makes the emptiest state in the game - having no patron - into the most
// atmospheric one. A pathless player is not being ignored by the pantheon. They are
// being ARGUED OVER, and they can hear it.
//
// ── HOW IT READS ────────────────────────────────────────────────────────────
// Two gods speak, one after the other, EACH IN THEIR OWN COLOUR. You do not get an
// introduction, a name tag or an explanation - you get red saying something and
// purple answering it, and you work out the rest. The colour system does the
// attribution for free, which is the whole reason it was worth fixing.
//
//     §4§lThe ground beneath you has swallowed a hundred like you.
//     §5§lHe says that to everyone. He said it to me.
//
// Between those, and on their own, come the player's OWN feelings - grey italic
// narration, because a voice cannot tell you what you want without it becoming an
// order. Narration can.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[pathless] '
  var GATE = true

  var TICK = 1200                  // 60s between rolls, same beat as idle.js
  var CHANCE = 0.10                // slightly likelier than a walker's idle - this
                                   // is the state we WANT a player to leave

  // ⚠️ ONCE PER WORLD DAY IS RIGHT FOR A GOD AND WRONG FOR WEATHER. A patron's idle
  // line is an event; "you take a breath" is texture, and texture that fires once a
  // day is not texture, it is a rare event that reads as broken. Ambience ignores
  // the daily stamp; the legible pieces still respect it.
  var AMBIENT_CAP = false
  var LAST_KEY = 'veldora_pathless_day'   // world day + 1; 0 means never
  var PAIR_GAP = 55                // ticks between the two speakers

  // ⚠️ ONLY GODS WITH A REGISTERED VOICE. A pathless player must never overhear a
  // god who has nothing to say - an empty half of a conversation reads as a bug,
  // and Forge, Salvage and Art are not written yet. This list is checked against
  // the live voice registry at speak time, never assumed.
  var CANDIDATES = ['blade', 'wall', 'salvage', 'forge', 'art']

  // ── what they say about each other, overheard ────────────────────────────
  // These are DELIBERATELY not addressed to you. Each god's own `<other>` fragment
  // pool already holds their verdicts, so the opener is drawn from there and stays
  // in character automatically - Blade's contempt for the Spider and her wound about
  // the Matriarch are already written, and this is simply where a stranger gets to
  // hear them.
  //
  // The REPLIES are here, because a god answering another god is a register neither
  // of them has anywhere else.
  var REPLIES = {
    blade: [
      'He says that to everyone.',
      'The Warrior has buried more champions than he has kept.',
      'Listen to him if you want to die competent.',
      'He is not lying. He is only leaving things out.',
    ],
    wall: [
      'She has been alone a long time. It shows.',
      'The Spider will love you until there is nothing left of you.',
      'Do not let her get close. That is the whole of it.',
      'She is kinder than me. That is not a recommendation.',
    ],
    salvage: [
      'The Wolf deals fairly. That is the trap, not the comfort.',
      'Count your things after she leaves.',
    ],
    forge: [
      'The Goat does not answer any more.',
      'He builds. It is all that is left of him.',
    ],
    art: [
      'The Matriarch is watching this conversation.',
      'She decides who counts. She always has.',
    ],
  }

  // ── your own feelings. Grey italic, never a voice. ───────────────────────
  // ⭐ A GOD CANNOT SAY "you want this" WITHOUT IT BECOMING AN ORDER. Narration can,
  // because it is not coming from anyone - the same reason the introduction uses it
  // for bodies and rooms. This is the only place the game tells you what you feel,
  // and it is the one place that is honest.
  var FEELINGS = [
    'Something is paying attention to you. It has been for a while.',
    'You could keep going like this. You are fairly sure you could not keep going like this.',
    'The deep pulls at you. You have not decided whether that is the danger or the point.',
    'You are the only thing in this world that belongs to nobody.',
    'Whatever they are arguing about, it is you.',
    'You want to be stronger. The wanting has started to feel like somebody else\'s.',
    'You have not chosen. That is also a choice, and it is getting heavier.',
    'You could ask. You know you could ask.',
    'They will not wait forever. You are not certain they will not.',
    'The quiet is not empty. It never was.',
  ]

  // ⭐ HOW YOU ACTUALLY CHOOSE. The one practical line in the file, and it is rare
  // on purpose - a hint you get every minute is a tutorial, and a hint you get once
  // in a while is the world telling you something.
  var HOW = [
    'Speak a name and it will answer. /path',
    'There is a way to choose. There has always been a way to choose. /path',
  ]

  function hasVoice(god) {
    try {
      var g = VELDORA.voice && VELDORA.voice.pools ? VELDORA.voice.pools[god] : null
      if (!g) return false
      for (var k in g) if (g.hasOwnProperty(k)) return true
    } catch (e) { }
    return false
  }

  function written() {
    var out = []
    for (var i = 0; i < CANDIDATES.length; i++) {
      if (hasVoice(CANDIDATES[i])) out.push(CANDIDATES[i])
    }
    return out
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)] }

  function colourOf(god) {
    try {
      if (VELDORA.voice && typeof VELDORA.voice.colourOf === 'function') {
        return VELDORA.voice.colourOf(god)
      }
    } catch (e) { }
    return '§4§l'
  }

  function tell(p, s) { try { p.tell(Text.of(s)) } catch (e) { } }

  // One god's line of an overheard argument, on the overlay, garbled unless that
  // god is yours. Goes through voice.overlay so it shares the hotbar lift and the
  // tone table rather than being a second implementation that drifts.
  // ⚠️ NAMED `overheardOverlay`, NOT `overheard` - this file already has a
  // `function overheard(server, p)` twelve lines below. Rhino REJECTS the
  // redeclaration outright ("TypeError: redeclaration of function overheard") and
  // the whole file fails to load; Node accepts it silently, and rhino_lint only
  // checked cross-FILE collisions. The 01:27 boot loaded 65/66 because of this.
  function overheadOverlay(p, god, s) {
    try {
      if (!VELDORA.voice || typeof VELDORA.voice.overlay !== 'function') return false
      var mine = (typeof VELDORA.voice.alignedTo === 'function')
        ? VELDORA.voice.alignedTo(p, god) : true
      return VELDORA.voice.overlay(p, god, s, 'about_' + god,
        mine ? null : { obfuscate: 'RANDOM' })
    } catch (e) { return false }
  }

  // Two gods, one after the other. The first speaks from their own verdict pool
  // ABOUT the second; the second answers.
  function overheard(server, p) {
    var live = written()
    if (live.length < 2) return false

    var a = pick(live)
    var b = pick(live)
    for (var i = 0; i < 4 && b === a; i++) b = pick(live)
    if (b === a) return false

    // a's opinion of b, straight from a's own fragment pool - so it is in character
    // without anything being written twice.
    var opener = null
    try {
      if (VELDORA.voice && typeof VELDORA.voice.line === 'function') {
        opener = VELDORA.voice.line(a, b, p)
      }
    } catch (e) { }
    if (!opener) return false

    var reply = REPLIES[a] ? pick(REPLIES[a]) : null   // b answers ABOUT a
    tell(p, colourOf(a) + opener)

    // ⭐ GODS OVERHEARD ARGUING, ON SCREEN. Ethan, 2026-08-30: "during god
    // bickering, the gods you aren't aligned to should be garbled."
    //
    // 🔑 THIS AUDIENCE IS PATHLESS BY DEFINITION - that is the whole entry
    // condition for this file - so BOTH speakers are garbled, always. alignedTo() is
    // still asked rather than assumed: if this ever fires for somebody with a path,
    // the god who is theirs comes through clean, which is the rule working, not an
    // exception to it.
    overheadOverlay(p, a, opener)
    if (reply) {
      server.scheduleInTicks(PAIR_GAP, function () {
        tell(p, colourOf(b) + reply)
        overheadOverlay(p, b, reply)
      })
    }
    console.info(TAG + p.username + ' overheard ' + a + ' -> ' + b)
    return true
  }

  function feel(p) {
    var _f = pick(FEELINGS)
    tell(p, '§7§o' + _f)
    try { if (VELDORA.voice && typeof VELDORA.voice.aside === 'function') VELDORA.voice.aside(p, _f) } catch (e) { }

    return true
  }

  function how(p) {
    var _h = pick(HOW)
    tell(p, '§7§o' + _h)
    try { if (VELDORA.voice && typeof VELDORA.voice.aside === 'function') VELDORA.voice.aside(p, _h) } catch (e) { }

    return true
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ AMBIENCE - what the world does while nobody has claimed you
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan, 2026-08-16: "just things like 'You take a breath' 'You wipe sweat from
  // your brow' With random whispers from the gods arguing above but it shouldn't be
  // anything understandable."
  //
  // Two registers doing opposite jobs:
  //
  //   BODY      grey italic. Small, physical, ordinary. Nothing is happening to you
  //             and that IS the content - being pathless is the only stretch of the
  //             game where the world is just weather.
  //
  //   WHISPER   the gods, still arguing, still about you, and UNREADABLE. The
  //             Arrival is the one time you hear them clearly; everything after is
  //             a fragment through a wall.
  //
  // 🚨 THE WHISPERS MUST NOT DECODE. A fragment a player can piece together is just
  // quiet exposition, and they WILL piece it together. So the meaning-bearing middle
  // of every whisper is §k - Minecraft's obfuscated text, which renders as characters
  // scrambling in place. You get the COLOUR, so you know who is speaking, and the
  // rhythm of an argument. Nothing else.
  var BODY = [
      "You take a breath.",
      "You wipe sweat from your brow.",
      "You roll your shoulders. Something in your back clicks.",
      "Your hands are cold.",
      "You catch yourself listening for something.",
      "You shift your grip on nothing in particular.",
      "You blink hard. The light is wrong here, or your eyes are.",
      "You breathe out, slowly, and it steadies less than you wanted.",
      "You rub your thumb across your palm. There is dirt in the lines of it.",
      "You look up. There is nothing to look up at.",
      "Your ears ring for a second, then stop.",
      "You swallow. Your throat is dry.",
      "You stand still for a moment longer than you meant to.",
      "You are aware of your own heartbeat, briefly.",
      "Something behind you. Nothing behind you."
  ]

  // [god, before the scramble, after it]
  var WHISPER = [
      [
          "blade",
          "...must prove",
          "or be nothing at all-"
      ],
      [
          "blade",
          "-stand above the",
          "like every other one before-"
      ],
      [
          "blade",
          "...I will not carry",
          "again-"
      ],
      [
          "wall",
          "-but they are so",
          "and nobody has even-"
      ],
      [
          "wall",
          "...please, just let me",
          "once-"
      ],
      [
          "wall",
          "-you always say that when I",
          "-"
      ],
      [
          "salvage",
          "...everything has a",
          "and they will learn it-"
      ],
      [
          "salvage",
          "-hardly my fault if the terms are",
          "-"
      ],
      [
          "salvage",
          "...I could have them by",
          "if you two would-"
      ],
      [
          "forge",
          "-built nothing, owed nothing, and you call that",
          "-"
      ],
      [
          "forge",
          "...they will break before they",
          "-"
      ],
      [
          "art",
          "-ENOUGH of this. You will all",
          "-"
      ],
      [
          "art",
          "...they cannot hear us properly and that is",
          "-"
      ],
      [
          "art",
          "-let them be",
          "for once-"
      ]
  ]

  var SCRAMBLE = ["§k▓▓▓▓§r", "§k▓▓▓▓▓▓§r", "§k▓▓▓§r", "§k▓▓▓▓▓§r", "§k▓▓▓▓▓▓▓§r"]

  function whisperLine(p) {
    var w = pick(WHISPER)
    var mid = pick(SCRAMBLE)
    // The god's own colour, dimmed to italic - they are not addressing you, and a
    // full-weight patron line would read as being spoken TO the player.
    var c = colourOf(w[0])
    return c + '§o' + w[1] + ' ' + mid + c + '§o ' + w[2]
  }

  function ambience(p) {
    // Bodies more often than whispers. The gods are far away and mostly not
    // thinking about you, which is the point of the stretch.
    if (Math.random() < 0.62) {
      var _b = pick(BODY)
      tell(p, '§7§o' + _b)
    try { if (VELDORA.voice && typeof VELDORA.voice.aside === 'function') VELDORA.voice.aside(p, _b) } catch (e) { }

    } else {
      tell(p, whisperLine(p))
    }
    return true
  }

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  function attempt(server, p, force) {
    // Anyone WITH a path is idle.js's business, not ours.
    var path = ''
    try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { return null }
    if (path) return null

    // Never over a scene.
    try { if (VELDORA.ritual && VELDORA.ritual.active(p)) return null } catch (e) { }

    var now = dayNow(server)
    // Roll FIRST, so the daily cap can be applied only to the legible pieces.
    var roll = Math.random()

    if (!force && !(roll < 0.55 && !AMBIENT_CAP)) {
      if (now === null) return null
      var stored = 0
      try { stored = p.persistentData.getInt(LAST_KEY) } catch (e) { }
      if (stored) {
        var last = stored - 1
        // A stamp from the future means an admin moved the clock - re-stamp rather
        // than going silent for ten thousand days.
        if (last > now) { try { p.persistentData.putInt(LAST_KEY, now + 1) } catch (e) { } return null }
        if (last >= now) return null
      }
    }

    // Weighted. AMBIENCE is the common case now - the small physical beats and the
    // unreadable argument overhead are what the pathless stretch actually sounds
    // like, and the bigger pieces (a legible exchange, a feeling, the /path hint)
    // are the rarer punctuation.
    var r = roll
    var did = false
    if (r < 0.55) did = ambience(p)
    else if (r < 0.78) did = overheard(server, p)
    else if (r < 0.94) did = feel(p)
    else did = how(p)
    if (!did) did = ambience(p)          // whatever failed, the body still happens

    // Ambience does not consume the day. Only the legible pieces do.
    if (did && now !== null && r >= 0.55) {
      try { p.persistentData.putInt(LAST_KEY, now + 1) } catch (e) { }
    }
    return did ? 'pathless' : null
  }

  function sweep(server) {
    try {
      if (!GATE) { schedule(server); return }
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        if (Math.random() > CHANCE) continue
        attempt(server, ps[i], false)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    schedule(server)
  }

  function schedule(server) { server.scheduleInTicks(TICK, function () { sweep(server) }) }

  VELDORA.pathless = { attempt: attempt, overheard: overheard }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('pathless').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var live = written()
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7gods with a written voice: §f' + (live.join(', ') || 'NONE')))
      p.tell(Text.of('§8they can only be overheard arguing if TWO are written'))
      if (!attempt(ctx.source.server, p, true)) {
        p.tell(Text.of('§8nothing - do you walk a path? this only speaks to the pathless'))
      }
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF'); return }
    schedule(event.server)
    // Reported a tick late: the god voices register in their own loaded handlers,
    // which run after this one.
    event.server.scheduleInTicks(1, function () {
      var live = written()
      console.info(TAG + BODY.length + ' body beats, ' + WHISPER.length +
        ' unreadable whispers (the gods, still arguing, still about you).')
      console.info(TAG + 'the pathless overhear the pantheon - ' + live.length +
        ' written voice(s): ' + (live.join(', ') || 'NONE') + '. ' +
        FEELINGS.length + ' feelings, ' + Math.round(CHANCE * 100) + '% per ' +
        TICK + 't, once per world day.')
      if (live.length < 2) {
        console.warn(TAG + 'fewer than TWO written gods - they cannot be overheard ' +
          'arguing, so a pathless player will only ever get their own feelings.')
      }
    })
  })
})();
