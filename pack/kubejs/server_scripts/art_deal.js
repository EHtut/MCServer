// art_deal.js — she tells you the price, and you say yes anyway.
//
// `docs/67`, Ethan 2026-08-29:
//     "Chosen on respawn, however she takes all your levels. im adding a requirement
//      of 50"
//
// ── ⭐ THE STRONGEST CONDITION IN THE DOCUMENT, AND THE MOST HER ───────────────
// It is not a test of survival or skill. It is a test of **preparation and
// willingness**: you grind to 50, you carry the whole pile down past y0 into the dark,
// and you hand it to something that has already told you it will kill you.
//
// 🔑 AND "ALL OF THEM" RATHER THAN "50" IS THE CHARACTER. A god who took exactly the
// price would be a trader - that is Salvage, and she is two files over. Art takes what
// you HAVE, because she is appraising you, and the appraisal is *what were you willing
// to bring*. Arriving with 80 costs you 80.
//
// ── 🔴 SHE DOES NOT EXPLAIN. REWRITTEN 2026-08-29. ──────────────────────────────
// Ethan: *"Art will be blunt but also noninformative, she will never reveal her cards
// or tell you what she wants. She will simply demand."*
//
// ⚠️ THE FIRST VERSION HAD HER SPELL OUT THE TERMS - every level, not fifty, and then
// I kill you, I am telling you before you answer. `docs/67` carried "She tells you this
// first" in bold, and I built to it.
//
// 🚨 THAT LINE WAS MINE. His only verbatim ruling was *"Chosen on respawn, however she
// takes all your levels. im adding a requirement of 50"* - the tell-first clause was
// doc prose I wrote and then treated as canon a week later. Checked, not assumed.
//
// ⭐ SO SHE DEMANDS INSTEAD. She names no price, no prize, no reason and no outcome.
// She says give it to me, and the player decides with nothing to go on but her. That
// is a harder ask than an informed one, and it is the character: she is appraising
// you, and explaining herself would mean she needed something from you.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[artdeal] '
  var GATE = true
  var COLOUR = '§f'                 // the Stranger's - uncoloured, see deep_speaker.js

  // ⭐ 50. Ethan's number, and it is a FLOOR to be allowed to speak, not the price.
  var MIN_LEVELS = 50

  // She may only do this where she can reach you at all.
  var DEPTH_Y = 0

  var K_TOOK = 'veldora_art_took'    // she has been paid; chosen.js reads it on respawn
  var K_LAST = 'veldora_art_last'    // tick stamp, so she is not constant
  var COOLDOWN = 24000               // ~1 in-game day between offers
  var SWEEP = 600                    // 30s
  var CHANCE = 0.20                  // per sweep once eligible - she is not shy

  // ═══════════════════════════════════════════════════════════════════════════
  // [CLAUDE-DRAFT] art/deal_offer · art/deal_taken · art/deal_refused
  //
  // ⚠️ Her register, from art_voice.js: cold, precise, no warmth, and she does not
  // flatter. The offer states the price in the SECOND line, before the options render,
  // because the ruling says she tells you first.
  // ═══════════════════════════════════════════════════════════════════════════
  var OFFER = [
    'You brought all of that down here. With nobody behind you.',
    'Give it to me.',
    'I am not going to ask twice, and I am not going to explain.',
  ]
  var YES = 'Give her everything.'
  var NO = 'No.'

  // ⚠️ She does not gloat and she does not clarify afterwards either. Whatever just
  // happened, the player works out on their own.
  var TAKEN = [
    'Good.',
    'That will do.',
  ]
  var REFUSED = [
    'Then go back up.',
    'No. Fine.',
  ]

  // ⭐ PATHLESS DIALOGUE ARRIVES BROKEN. These lines are only ever spoken to a player
  // with no god, so they take the same 25% obfuscation the Stranger does - nothing is
  // translating for you. See garble.js.
  //
  // ⚠️ Fails SOFT to plain text: a missing garble.js should not silence a deal.
  function broken(t) {
    try {
      if (VELDORA.garble && typeof VELDORA.garble.line === 'function') {
        return VELDORA.garble.line(t, COLOUR)
      }
    } catch (e) { }
    return t
  }

  function brokenAll(a) {
    var out = [], i
    for (i = 0; i < a.length; i++) out.push(broken(a[i]))
    return out
  }

  function say(p, s) { try { p.tell(Text.of(COLOUR + broken(s))) } catch (e) { } }
  function pick(a) { return a[Math.floor(Math.random() * a.length)] }

  // ── eligibility ──────────────────────────────────────────────────────────────
  function levelsOf(p) {
    try {
      var x = p.xpLevel
      if (typeof x === 'number' && isFinite(x)) return x
    } catch (e) { }
    return null                      // unreadable, NOT zero
  }

  function pathless(p) {
    try {
      if (VELDORA.paths && typeof VELDORA.paths.pathOf === 'function') {
        var path = VELDORA.paths.pathOf(p)
        // 🔴 `typeof path !== 'string'` WAS HERE AND IT BROKE EVERY GODLESS CHECK.
        // paths.pathOf returns persistentData.getString(...) - a JAVA String - and in
        // Rhino `typeof javaString` is "object". This returned null for every player
        // alive, so `/deal`, `/artdeal` and `/forgetalk` all read "godless: UNREADABLE"
        // and none of the three gods would ever have offered anything on its own.
        //
        // ⚠️ I ADDED THAT CHECK TO BE DEFENSIVE and it WAS the bug. The harness stayed
        // green because its mock returns a real JS string - Node is not the engine, in
        // the mocks as much as in the syntax.
        if (path === null || path === undefined) return null
        return String(path) === ''
      }
    } catch (e) { }
    return null
  }

  // ⚠️ Reuses the Speaker's OWN depth test rather than re-deriving it. `docs/67` is
  // explicit that y alone was never enough - the sky test is what means underground,
  // the y test is what means deep - and this repo has paid for that confusion twice.
  function inTheDeep(p) {
    try {
      if (VELDORA.speaker && typeof VELDORA.speaker.active === 'function') {
        return VELDORA.speaker.active(p) === true
      }
    } catch (e) { }
    // No fallback that guesses. If the Speaker cannot say, she does not offer.
    return false
  }

  function hasMet(p) {
    try {
      if (VELDORA.speaker && typeof VELDORA.speaker.met === 'function') {
        return VELDORA.speaker.met(p) === true
      }
    } catch (e) { }
    return false
  }

  function alreadyTook(p) {
    try { return (p.persistentData.getInt(K_TOOK) || 0) > 0 } catch (e) { return false }
  }

  function eligible(server, p) {
    if (!GATE) return false
    if (alreadyTook(p)) return false
    if (pathless(p) !== true) return false        // godless only; null is not true
    var lv = levelsOf(p)
    if (lv === null || lv < MIN_LEVELS) return false
    if (!inTheDeep(p)) return false
    if (!hasMet(p)) return false                  // she introduces herself first
    var now = 0
    try { now = server.overworld().dayTime() } catch (e) { return false }
    var last = 0
    try { last = p.persistentData.getInt(K_LAST) || 0 } catch (e) { }
    if (last && (now - last) < COOLDOWN) return false
    return true
  }

  // ── the deal ─────────────────────────────────────────────────────────────────
  function offer(server, p) {
    if (!p) return false
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') {
      console.warn(TAG + 'ritual.js missing - she cannot make the offer')
      return false
    }
    var lv = levelsOf(p)
    if (lv === null) {
      console.warn(TAG + 'cannot read ' + p.username + "'s levels - NOT offering. " +
        'This is a FAILURE, not a player who is too poor.')
      return false
    }

    return VELDORA.ritual.begin(p, {
      colour: COLOUR,
      lines: brokenAll(OFFER),
      options: [{ id: 'yes', label: YES }, { id: 'no', label: NO }],
      holdAfterChoice: 60,
      onChoose: function (player, id) {
        if (id !== 'yes') {
          say(player, pick(REFUSED))
          console.info(TAG + player.username + ' refused her - nothing taken')
          return
        }

        // 🚨 TAKE FIRST, THEN KILL, AND VERIFY THE TAKE. The reverse order pays her
        // out of a corpse: death_cost.js fires on the death and the levels question
        // becomes a race. Charging first also means a failed charge can abort the
        // whole thing with the player still alive and still holding everything.
        var before = levelsOf(player)
        var took = false
        try {
          player.xpLevel = 0
          took = (levelsOf(player) === 0)
        } catch (e) { took = false }
        if (!took) {
          try { server.runCommandSilent('xp set ' + player.username + ' 0 levels') } catch (e) { }
          took = (levelsOf(player) === 0)
        }
        if (!took) {
          console.error(TAG + '!! could not take levels from ' + player.username +
            ' - NOTHING happens. She is not paid, so she does not collect.')
          say(player, 'Something is holding on to them. Come back.')
          return
        }

        // ⭐ THE STAMP GOES DOWN BEFORE THE KILL. A server that dies between the two
        // would otherwise have emptied the player and owed them nothing.
        try { player.persistentData.putInt(K_TOOK, 1) } catch (e) { }
        say(player, pick(TAKEN))
        console.info(TAG + player.username + ' GAVE HER ' + before + ' levels - ' +
          'she takes them all and kills them. Chosen on respawn.')

        // ⚠️ death_cost.js becomes MOOT for this one death, and `docs/67` asks that it
        // read as intentional rather than as the death cost silently failing. It
        // charges 5 levels from a player now holding zero, which is a no-op by
        // arithmetic, not by accident. Said out loud here so the log explains itself.
        console.info(TAG + 'the 5-level death cost will find nothing to take - that is ' +
          'correct, she already has all of it. Not a failure.')

        try { player.setHealth(0.0) } catch (e) {
          try { server.runCommandSilent('kill ' + player.username) } catch (e2) { }
        }
      },
    })
  }

  function sweep(server) {
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        try {
          if (!eligible(server, p)) continue
          if (Math.random() >= CHANCE) continue
          var now = 0
          try { now = server.overworld().dayTime() } catch (e) { }
          try { p.persistentData.putInt(K_LAST, now) } catch (e) { }
          offer(server, p)
        } catch (e) { }
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    try { server.scheduleInTicks(SWEEP, function () { sweep(server) }) } catch (e) { }
  }

  VELDORA.artdeal = {
    took: alreadyTook,
    minLevels: MIN_LEVELS,
    offer: offer,
    eligible: eligible,
    lines: { offer: OFFER, taken: TAKEN, refused: REFUSED },
    enabled: function () { return GATE },
    _levelsOf: levelsOf,
    _pathless: pathless,
  }

  ServerEvents.loaded(function (event) {
    try { sweep(event.server) } catch (e) { console.warn(TAG + 'could not start :: ' + e) }
    console.info(TAG + 'her deal is live - godless only, ' + MIN_LEVELS + '+ levels, ' +
      'below y' + DEPTH_Y + ' with no sky, and only after she has introduced herself. ' +
      'She takes ALL of them, not ' + MIN_LEVELS + ', and SHE SAYS SO FIRST. Chosen on respawn.')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    try {
      event.register(Commands.literal('artdeal')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .then(Commands.literal('offer').executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          if (!offer(ctx.source.server, p)) p.tell(Text.of('§8no offer opened - already in a ritual, or levels unreadable'))
          return 1
        }))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var pl = pathless(p)
          p.tell(Text.of('§8godless: §f' + (pl === null ? 'UNREADABLE' : (pl ? 'yes' : 'no'))))
          p.tell(Text.of('§8levels: §f' + levelsOf(p) + '§8 / ' + MIN_LEVELS))
          p.tell(Text.of('§8in the deep: §f' + inTheDeep(p) + '§8 · met her: §f' + hasMet(p)))
          p.tell(Text.of('§8already paid her: §f' + alreadyTook(p)))
          p.tell(Text.of('§8eligible right now: §f' + eligible(ctx.source.server, p)))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
