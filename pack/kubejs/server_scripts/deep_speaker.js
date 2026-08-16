// deep_speaker.js - THE SPEAKER FOR THE GODDESS OF DEATH.  docs/15 §0b, docs/40
//
// Ethan, 2026-08-15:
//   "the gods cannot see you when you descend after a certain level. Instead
//    dialogue is replaced by the goddess of death's speaker."
//   "She is the speaker for the goddess of death. She watches endlessly these fel
//    corridors. It is she whom which the horrors of this land are born."
//
// ── ⭐ WHY THIS IS THE BEST MECHANIC IN THE PROJECT ──────────────────────────
// Every other system makes the world louder as it gets more dangerous. This one
// makes YOUR GOD GO SILENT.
//
// Below the cutoff the patron cannot reach you. The voice that has been arming you,
// testing you and grudgingly approving of you is simply GONE - and something else
// is talking instead. It costs nothing to build and it changes what descending
// means: you are not going somewhere dangerous, you are going somewhere OUT OF
// EARSHOT.
//
// It also gives the strata a moral gradient the depth loop never had. She tells you
// your own god is complicit, and the deeper you go the less able he is to answer.
//
// ── SHE IS NOT A GOD, AND SHE DOES NOT SOUND LIKE ONE ───────────────────────
// Grey, not the gods' bold red. Patient rather than demanding. She is the only
// voice in the world that is not asking you for anything - she is simply telling
// you what you are, and what you will be.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[speaker] '
  var SPEAKER = 'death_speaker'
  var COLOUR = '\u00a77'              // grey. She is not a god, and must not look like one.

  // ── ⚠️ THE CUTOFF WAS WRONG, AND SO IS docs/15 ─────────────────────────────
  // I set this to -40 off `15-LORE.md`, which says the Sealed Floor runs "minus
  // sixty to the bottom". That doc PREDATES the world extension: the overworld
  // floor is not -64, it is -128 (`tools/make_depth_datapack.py`, NEW_MIN_Y).
  //
  // The numbers the game actually tells a player (`help.js`) are:
  //     0 to -64     the old diggings
  //   -64 to -120    the deep works
  //  -120 to -128    THE SEALED FLOOR
  //
  // So -40 was not "low or almost lowest" as Ethan asked - it was a third of the
  // way down, inside the old diggings. Corrected to -64, the line where the deep
  // works begin and the first depth a player would call a descent.
  var CUTOFF_Y = -64

  // ── ⭐ THE LOWEST LEVEL OF THE WORLD ────────────────────────────────────────
  // Ethan: "the rarest ... at the lowest level of the world." That is the Sealed
  // Floor, and -120 is the number he has already been promised in /help. Eight
  // blocks of world below it and nothing else in the game happens down there.
  var CONFESSION_Y = -120
  var CONFESSION_CHANCE = 0.10        // per sweep, at that depth, once ever
  var CONFESSION_SWEEP = 1200         // 60s - so ~10 minutes SPENT on the floor

  var K_MET = 'veldora_speaker_met'    // she introduces herself exactly once
  var K_CONF = 'veldora_speaker_confessed'   // and confesses exactly once

  // Whole lines. She speaks in complete thoughts - a fragment grammar would make
  // her sound like the gods, and she is deliberately not one of them.
  var LINES = {
    intro: [
      'The champion of the Blade. Another one. Come deeper, your end shall be swift.',
    ],
    common: [
      'Your god was once a servant of mine. He can be hers again.',
      'After your end, you will rise down here. Not as a champion, but as one of us.',
      'You fight well. A threat, perhaps, up there. Down here you are nothing more than prey.',
      'He cannot hear you at this depth. Did he tell you that?',
      'Every corridor you walk, I have watched for longer than your god has had a name.',
      'They were a family once. Then the church came, and then your gods.',
      'You are not the first champion to come this far. You are not even the tenth.',
      'She did not want this. They made her what she is, and then called her fel.',
      'Keep descending. It is easier for both of us if you do not turn back.',
      'The horrors here were born of her grief. Do not mistake them for malice.',
    ],
    // She notices what your god's silence means before you do.
    abandoned: [
      'Listen. Nothing. That is what his protection is worth down here.',
      'Call for him if you like. I will wait.',
      'He is still speaking, somewhere above. Not to you.',
    ],
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE CONFESSION - Ethan's writing, 2026-08-15
  // ═══════════════════════════════════════════════════════════════════════════
  // The rarest thing in the game, and the one that reorganises everything above it.
  //
  // She is not the goddess of death's mouthpiece here. She is the person who made
  // the choice, and the whole scene is her failing to finish a sentence. Gregor was
  // Blade's champion - "Centuries ago I had a champion. A man who stood by my side
  // above all else. He is long since gone. HIS END MERCIFUL." She is the mercy.
  //
  // 🚨 WHAT THIS DOES TO THE HARVEST: a player who hears this and then runs the
  // Harvest hears Blade eulogise a man whose killer has already apologised to them
  // by name. Nothing in the code connects the two scenes. The player connects them.
  // That is why it must stay rare and must never repeat - it is a thing you FOUND,
  // not a thing the game told you.
  //
  // STAGED, per Ethan: four stanzas, one after another, separated by real silence.
  // A blank line is a beat. Two blanks before the last stanza, because "Gregor, I am
  // sorry" is the only line she says to someone who is not you, and it needs the
  // room. She is held blind and rooted for the whole ~39s: this is not chat, it is
  // the only cutscene in the game that is not a god demanding something.
  var CONFESSION = [
    'When you get up there... Tell your god I... Tell him I\'m sorry. For everything I did.',
    'I didn\'t want to. But I had to make a choice.',
    'He chose the wrong path. He was one of us. Our family. But he...',
    'I never meant it to end like this.',
    '',
    'He was... He was someone I was meant to protect, but I was too weak.',
    'None of this, none of what happened was his fault.',
    'It was mine.',
    '',
    'I was too focused on the mission.',
    'I had to rescue my goddess from that church to see what I was really doing.',
    'I was destroying us.',
    'Blinded by faith.',
    '',
    '',
    'Gregor, I am sorry.',
  ]

  var CONF_GAP = 45                   // 2.25s - her lines are short and halting

  function hasConfessed(p) {
    try { return !!p.persistentData.getBoolean(K_CONF) } catch (e) { return false }
  }

  // Open the confession. Returns true only if the scene actually began.
  //
  // 🚨 The once-ever flag is stamped AFTER begin() succeeds, never before. Burning
  // it on a refused ritual would silently cost a player the biggest beat in the
  // game and there would be no way to tell it had happened.
  function confess(p, why) {
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') {
      console.error(TAG + 'ritual.js missing - the confession cannot be staged')
      return false
    }
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }

    var lines = []
    for (var i = 0; i < CONFESSION.length; i++) {
      lines.push(CONFESSION[i] === '' ? '' : COLOUR + CONFESSION[i])
    }
    var began = false
    try {
      began = VELDORA.ritual.begin(p, { lines: lines, gap: CONF_GAP, options: [] })
    } catch (e) { console.error(TAG + 'confession threw :: ' + e); return false }
    if (!began) return false

    try { p.persistentData.putBoolean(K_CONF, true) } catch (e) { }
    console.info(TAG + '!! ' + p.username + ' HEARD THE CONFESSION (' + why + ') - ' +
      CONFESSION.length + ' lines, ' + (20 + CONFESSION.length * CONF_GAP + 40) + 't')
    return true
  }

  // Eligible = has met her, has never heard it, and is standing on the floor.
  function confessionEligible(p) {
    if (hasConfessed(p)) return false
    try { if (!p.persistentData.getBoolean(K_MET)) return false } catch (e) { return false }
    try { return p.y <= CONFESSION_Y } catch (e) { return false }
  }

  // ⚠️ ITS OWN SWEEP, deliberately NOT the god's once-per-world-day idle cooldown.
  // Riding that would have meant ~10 IN-GAME DAYS spent at the floor to see it,
  // which is not rare, it is unreachable. This way it is ~10 real minutes SPENT
  // down there - an expedition, which is the thing being rewarded.
  function confessionSweep(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        if (!confessionEligible(p)) continue
        if (Math.random() > CONFESSION_CHANCE) continue
        confess(p, 'y' + Math.round(p.y))
      }
    } catch (e) { console.warn(TAG + 'confession sweep threw :: ' + e) }
    server.scheduleInTicks(CONFESSION_SWEEP, function () { confessionSweep(server) })
  }

  function speakerActive(p) {
    try { return p.y <= CUTOFF_Y } catch (e) { return false }
  }

  // Published so idle.js can ask "is this champion out of earshot", and so any
  // future god's speech can defer without knowing why.
  VELDORA.speaker = {
    id: SPEAKER,
    cutoff: CUTOFF_Y,
    active: speakerActive,
    confess: confess,
    confessed: hasConfessed,
    eligible: confessionEligible,
    floor: CONFESSION_Y,
    // Say something as her. Handles the one-time introduction itself, because the
    // first thing she ever says to a champion is not a random line.
    say: function (p, tag) {
      if (!VELDORA.voice) return false
      var met = false
      try { met = !!p.persistentData.getBoolean(K_MET) } catch (e) { }
      if (!met) {
        try { p.persistentData.putBoolean(K_MET, true) } catch (e) { }
        console.info(TAG + p.username + ' has met her')
        return VELDORA.voice.say(p, SPEAKER, 'intro')
      }
      return VELDORA.voice.say(p, SPEAKER, tag || 'common')
    },
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    var root = Commands.literal('speaker').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var below = speakerActive(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7y §f' + Math.round(p.y) + '§8, cutoff §f' + CUTOFF_Y +
        ' §8- your god ' + (below ? '§ccannot reach you' : '§acan still hear you')))
      p.tell(Text.of('§8the floor is §f' + CONFESSION_Y + '§8 · confession: ' +
        (hasConfessed(p) ? '§7already heard' :
          (confessionEligible(p) ? '§aELIGIBLE, rolling ' + Math.round(CONFESSION_CHANCE * 100) +
            '% every ' + CONFESSION_SWEEP + 't' :
            '§8not eligible here'))))
      p.tell(Text.of('§8/speaker confess §7force it §8· /speaker reset §7forget her'))
      VELDORA.speaker.say(p, 'common')
      return 1
    })
    // Force it. Ethan tests at the end of a build, and a 10% roll at y-120 is not
    // something you can wait out during a polish pass.
    root = root.then(Commands.literal('confess').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var was = hasConfessed(p)
      try { p.persistentData.putBoolean(K_CONF, false) } catch (e) { }
      var ok = confess(p, 'forced by ' + p.username)
      if (!ok) {
        try { p.persistentData.putBoolean(K_CONF, was) } catch (e) { }
        p.tell(Text.of('§cdid not open - already in a scene? see the log'))
      }
      return 1
    }))
    // Forget the player entirely, so the introduction AND the confession can both
    // be seen again from scratch.
    root = root.then(Commands.literal('reset').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      try {
        p.persistentData.putBoolean(K_MET, false)
        p.persistentData.putBoolean(K_CONF, false)
      } catch (e) { }
      p.tell(Text.of('§7she does not know you.'))
      return 1
    }))
    event.register(root)
  })

  ServerEvents.loaded(function (event) {
    if (!VELDORA.voice) { console.error(TAG + 'voice.js missing'); return }
    VELDORA.voice.setColour(SPEAKER, '§7')      // grey. She is not a god.
    var n = 0
    for (var k in LINES) {
      if (!LINES.hasOwnProperty(k)) continue
      if (VELDORA.voice.registerLines(SPEAKER, k, LINES[k])) n += LINES[k].length
    }
    console.info(TAG + 'the Speaker waits below y' + CUTOFF_Y + ' - ' + n +
      ' lines, grey. Below the cutoff a champion cannot hear their god.')
    confessionSweep(event.server)
    console.info(TAG + 'THE CONFESSION armed - ' + CONFESSION.length + ' lines in 4 ' +
      'stanzas, once per champion, ' + Math.round(CONFESSION_CHANCE * 100) + '% per ' +
      CONFESSION_SWEEP + 't at or below y' + CONFESSION_Y + ' (the sealed floor).')
  })
})();
