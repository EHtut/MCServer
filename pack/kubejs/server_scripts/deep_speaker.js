// deep_speaker.js - THE VOICES BELOW THE CUTOFF.  docs/15 §0b, docs/40, docs/43
//
// Ethan, 2026-08-15:
//   "the gods cannot see you when you descend after a certain level. Instead
//    dialogue is replaced by the goddess of death's speaker."
//   "each patron has their own speaker when they go down aswell."
//
// ── ⭐ WHY THIS IS THE BEST MECHANIC IN THE PROJECT ──────────────────────────
// Every other system makes the world louder as it gets more dangerous. This one
// makes YOUR GOD GO SILENT.
//
// Below the cutoff your patron cannot reach you. The voice that has been arming
// you, testing you and grudgingly approving of you is simply GONE - and something
// else is talking instead. It costs nothing to build and it changes what descending
// MEANS: you are not going somewhere dangerous, you are going somewhere OUT OF
// EARSHOT.
//
// ── ⭐ ONE SPEAKER PER PATRON (2026-08-15) ──────────────────────────────────
// This began as a single grey voice for Blade. It is a REGISTRY now, because who
// meets you at the bottom of the world depends on whose champion you are - and that
// is a far better idea than one narrator for everybody.
//
//   blade -> THE SPEAKER   grey.       Speaks FOR the goddess of death.
//                                      Confesses about Gregor.
//   wall  -> THE DOCTOR    light blue. IS the goddess of death.
//                                      Confesses about the machine, and Mera.
//
// 🚨 THE TWO CONFESSIONS ARE THE SAME EVENT FROM OPPOSITE ENDS, and nothing in the
// code says so. Blade's champion hears an apology for killing Gregor. Wall's
// champion is told to carry a sentence to Mera - who IS Wall, who is Gregor's
// daughter, who never knew him. The player assembles that, or does not. Do not add
// a hint, a flag or a journal entry. It is the best thing in the writing precisely
// because the game never points at it.
//
// A path with no registered speaker gets SILENCE below the cutoff, never a stand-in
// voice. The god going quiet is the entire point; a fallback narrator would undo it.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[speaker] '

  // ── ⚠️ THE CUTOFF, AND WHY IT IS NOT -40 ───────────────────────────────────
  // It was -40 briefly, taken from `15-LORE.md` - which said the Sealed Floor ran
  // "minus sixty to the bottom". That doc PREDATES the world extension: the
  // overworld floor is -128, not -64 (`tools/make_depth_datapack.py`, NEW_MIN_Y).
  //
  // What the game actually tells a player (`help.js`):
  //     0 to -64     the old diggings
  //   -64 to -120    the deep works
  //  -120 to -128    THE SEALED FLOOR
  var CUTOFF_Y = -64
  var CONFESSION_Y = -120           // the lowest level of the world
  var CONFESSION_CHANCE = 0.10      // per sweep, at that depth
  var CONFESSION_SWEEP = 1200       // 60s - so ~10 minutes SPENT on the floor
  var CONF_GAP = 45                 // 2.25s between lines; these voices are halting

  var SPEAKERS = {}                 // path key -> speaker

  function register(path, spec) {
    if (!path || !spec || !spec.id) return false
    SPEAKERS[path] = spec
    return true
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BLADE'S — THE SPEAKER.  Grey. She speaks FOR the goddess of death.
  // ═══════════════════════════════════════════════════════════════════════════
  register('blade', {
    id: 'death_speaker',
    name: 'the Speaker',
    colour: '§7',                        // grey. She is not a god.
    lines: {
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
      abandoned: [
        'Listen. Nothing. That is what his protection is worth down here.',
        'Call for him if you like. I will wait.',
        'He is still speaking, somewhere above. Not to you.',
      ],
    },
    // Three cutscenes, one per descent, in order. She is a character who cannot
    // finish a sentence, so being stopped three times mid-thought makes the FORM
    // match the writing.
    confession: [
      [
        'When you get up there... Tell your god I... Tell him I\'m sorry. For everything I did.',
        'I didn\'t want to. But I had to make a choice.',
        'He chose the wrong path. He was one of us. Our family. But he...',
        'I never meant it to end like this.',
      ],
      [
        'He was... He was someone I was meant to protect, but I was too weak.',
        'None of this, none of what happened was his fault.',
        'It was mine.',
      ],
      [
        'I was too focused on the mission.',
        'I had to rescue my goddess from that church to see what I was really doing.',
        'I was destroying us.',
        'Blinded by faith.',
        '',
        '',
        'Gregor, I am sorry.',
      ],
    ],
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // WALL'S — THE DOCTOR.  Light blue. She IS the goddess of death.
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan's writing, 2026-08-15. She is the only voice in the world that is
  // CURIOUS about you. Everyone else wants something; she wants to know how you
  // work. That is exactly why she is frightening - a scientist is not cruel, and
  // these corridors are full of what she has already finished looking at.
  //
  // ⚠️ SHE TRAILS OFF AND MUMBLES. Do not tidy the ellipses; they are the
  // character. She is the cleverest thing in the world and she is not entirely
  // present in the room.
  register('wall', {
    id: 'death_doctor',
    name: 'the Doctor',
    colour: '§b',                        // light blue. She IS the goddess.
    lines: {
      intro: [
        'You. You\'re like me.',
        'Interesting. Fascinating. You seem almost... determined?',
        'Are you the champion of the spider?',
        'You may call me Doctor.',
        'No matter. Come into the depths. Let us speak.',
      ],
      common: [
        'Your powers are fascinating. In truth mine have bowed.',
        'The dead that walk these tunnels are but failed experiments. My experiments.',
        'I wonder what the world above looks like. I would not be against a gift, by the way.',
        'The dead here are far less... complex than my previous. I am not sure why. Well, sentience in general was something that...',
        'Do not touch that one. It is still deciding what it is.',
        'You heal faster than you should. I have been counting.',
        'She sent you down here, did she. She would not come herself.',
        'I have not been wrong often. Twice. It was enough.',
        'Ask her what her name was. Watch what she does with her hands.',
        'Everything down here was somebody, once. I do keep the records.',
      ],
      abandoned: [
        'She cannot hear you at this depth. Convenient. For both of us.',
        'Go on, call for her. I would like to observe it.',
        'No answer. Note the time.',
      ],
    },
    // ⭐ Ethan's six stanzas, grouped into THREE cutscenes so the last one ends on
    // the name. Blade's champion is asked to carry an apology to a god; Wall's
    // champion is asked to carry a sentence to one.
    confession: [
      [
        'You have come deep. Deep enough that I cannot justify hiding the truth.',
        'You won\'t find me down here. It is no fault of your own.',
        'You are fighting against the entire world, after all.',
        'Truly a shame.',
        '',
        'For centuries I have walked this earth.',
        'I was mortal, like you. Once.',
        'Like the gods themselves, I was forced to ascend.',
        'But unlike them? I was forced down here.',
      ],
      [
        'In truth, how the world is, is my fault.',
        'Centuries ago I built a machine.',
        'I thought I could harness the energy between dimensions.',
        'See, I lost my family in ascension. Each one becoming gods themselves.',
        'But gods are not so easily brought back.',
        '',
        'The rift tore the world apart. My family lost forever.',
        'I was hunted like a criminal.',
        'Guilty.',
      ],
      [
        'The gods above want me dead. Yea.',
        'I want me dead too.',
        'But the thing about being a god?',
        'About being the god of death?',
        'You are banished from your own domain.',
        '',
        'Tell Mera that... Tell her...',
        '*You take a breath in anticipation.',
        '',
        'Tell Mera that it\'s her time.',
      ],
    ],
  })

  // ═══════════════════════════════════════════════════════════════════════════

  function speakerFor(p) {
    try {
      var path = VELDORA.paths ? (VELDORA.paths.pathOf(p) || '') : ''
      return path ? (SPEAKERS[path] || null) : null
    } catch (e) { return null }
  }

  function belowCutoff(p) {
    try { return p.y <= CUTOFF_Y } catch (e) { return false }
  }

  // Both must be true: deep enough, AND their patron has somebody waiting.
  function speakerActive(p) {
    return belowCutoff(p) && !!speakerFor(p)
  }

  function metKey(s) { return 'veldora_spk_met_' + s.id }
  function stageKey(s) { return 'veldora_spk_stage_' + s.id }

  // ⚠️ STORED AS stage+1, so 0 means "never heard any of it". getInt() returns 0
  // for a missing key, so a plain index would make "never started" and "heard the
  // first one" the same number. docs/41 invariant #5.
  function stageOf(p, s) {
    if (!s) return 0
    try {
      var v = p.persistentData.getInt(stageKey(s))
      if (typeof v === 'number' && isFinite(v) && v > 0) return v - 1
    } catch (e) { }
    return 0
  }

  function finished(p, s) {
    if (!s || !s.confession) return true
    return stageOf(p, s) >= s.confession.length
  }

  // Say something as whoever is down there. Handles the one-time introduction
  // itself, because the first thing a speaker ever says is not a random line.
  function say(p, tag) {
    var s = speakerFor(p)
    if (!s || !VELDORA.voice) return false
    var met = false
    try { met = !!p.persistentData.getBoolean(metKey(s)) } catch (e) { }
    if (!met) {
      try { p.persistentData.putBoolean(metKey(s), true) } catch (e) { }
      console.info(TAG + p.username + ' has met ' + s.name)
      return VELDORA.voice.say(p, s.id, 'intro')
    }
    return VELDORA.voice.say(p, s.id, tag || 'common')
  }

  // Open the NEXT unheard confession stage.
  //
  // 🚨 The stage advances AFTER begin() succeeds, never before. Burning it on a
  // refused ritual would silently cost a player a scene they can never get back,
  // and there would be no way to tell it had happened.
  function confess(p, why) {
    var s = speakerFor(p)
    if (!s || !s.confession) return false
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') {
      console.error(TAG + 'ritual.js missing - a confession cannot be staged')
      return false
    }
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }

    var stage = stageOf(p, s)
    if (stage >= s.confession.length) return false
    var stanza = s.confession[stage]

    // Her own colour; narration keeps its own. ritual.js only paints a line that
    // has not already chosen one.
    var lines = []
    for (var i = 0; i < stanza.length; i++) {
      var ln = stanza[i]
      if (ln === '') { lines.push(''); continue }
      lines.push(ln.charAt(0) === '*' ? '§7§o' + ln.substring(1) : s.colour + ln)
    }

    var began = false
    try {
      began = VELDORA.ritual.begin(p, { lines: lines, gap: CONF_GAP, options: [] })
    } catch (e) { console.error(TAG + 'confession threw :: ' + e); return false }
    if (!began) return false

    try { p.persistentData.putInt(stageKey(s), stage + 2) } catch (e) { }
    var last = (stage + 1 >= s.confession.length)
    console.info(TAG + '!! ' + p.username + ' HEARD ' + s.name + ' CONFESS ' +
      (stage + 1) + '/' + s.confession.length + ' (' + why + ') - ' + stanza.length +
      ' lines, ' + (20 + stanza.length * CONF_GAP + 40) + 't' +
      (last ? ' - SHE IS FINISHED' : ''))
    return true
  }

  // Eligible = has met them, has stages left, and is standing on the floor.
  function confessionEligible(p) {
    var s = speakerFor(p)
    if (!s || !s.confession) return false
    if (finished(p, s)) return false
    try { if (!p.persistentData.getBoolean(metKey(s))) return false } catch (e) { return false }
    try { return p.y <= CONFESSION_Y } catch (e) { return false }
  }

  // ⚠️ ITS OWN SWEEP, deliberately NOT the god's once-per-world-day idle cooldown.
  // Riding that would have meant ~10 IN-GAME DAYS at the floor per stage, which is
  // not rare, it is unreachable. This way each stage is ~10 real minutes SPENT down
  // there - three expeditions, which is the thing being rewarded.
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

  VELDORA.speaker = {
    register: register,
    speakers: SPEAKERS,
    cutoff: CUTOFF_Y,
    floor: CONFESSION_Y,
    active: speakerActive,
    forPath: speakerFor,
    say: say,
    confess: confess,
    confessed: function (p) { return finished(p, speakerFor(p)) },
    stage: function (p) { return stageOf(p, speakerFor(p)) },
    eligible: confessionEligible,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    var root = Commands.literal('speaker').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var s = speakerFor(p)
      var below = belowCutoff(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7y §f' + Math.round(p.y) + '§8, cutoff §f' + CUTOFF_Y +
        ' §8- your god ' + (below ? '§ccannot reach you' : '§acan still hear you')))
      if (!s) {
        p.tell(Text.of('§8no speaker for your path - below the cutoff you get SILENCE'))
        return 1
      }
      p.tell(Text.of('§8down here you meet §f' + s.name + '§8 · floor §f' + CONFESSION_Y))
      p.tell(Text.of('§8confession §f' + stageOf(p, s) + '§8/§f' + s.confession.length +
        '§8: ' + (finished(p, s) ? '§7finished' :
          (confessionEligible(p) ? '§aELIGIBLE, rolling ' +
            Math.round(CONFESSION_CHANCE * 100) + '% every ' + CONFESSION_SWEEP + 't' :
            '§8not eligible here'))))
      p.tell(Text.of('§8/speaker confess §7force the next §8· /speaker reset §7forget you'))
      say(p, 'common')
      return 1
    })
    // Force the NEXT stage. Ethan tests at the end of a build, and a 10% roll at
    // y-120 is not something you can wait out during a polish pass.
    root = root.then(Commands.literal('confess').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var s = speakerFor(p)
      if (!s) { p.tell(Text.of('§cno speaker for your path')); return 0 }
      // Replay the last one rather than rewinding to zero, so an ending can be
      // re-watched without discarding the whole sequence.
      if (finished(p, s)) {
        try { p.persistentData.putInt(stageKey(s), s.confession.length) } catch (e) { }
        p.tell(Text.of('§8she was finished - replaying the last one'))
      }
      if (!confess(p, 'forced by ' + p.username)) {
        p.tell(Text.of('§cdid not open - already in a scene? see the log'))
      }
      return 1
    }))
    root = root.then(Commands.literal('reset').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      // Forget EVERY speaker, not just this path's - a tester swaps paths.
      for (var k in SPEAKERS) {
        if (!SPEAKERS.hasOwnProperty(k)) continue
        try {
          p.persistentData.putBoolean(metKey(SPEAKERS[k]), false)
          p.persistentData.putInt(stageKey(SPEAKERS[k]), 0)
        } catch (e) { }
      }
      p.tell(Text.of('§7they do not know you.'))
      return 1
    }))
    event.register(root)
  })

  ServerEvents.loaded(function (event) {
    if (!VELDORA.voice) { console.error(TAG + 'voice.js missing'); return }
    var names = []
    for (var path in SPEAKERS) {
      if (!SPEAKERS.hasOwnProperty(path)) continue
      var s = SPEAKERS[path]
      VELDORA.voice.setColour(s.id, s.colour)
      var n = 0
      for (var k in s.lines) {
        if (!s.lines.hasOwnProperty(k)) continue
        if (VELDORA.voice.registerLines(s.id, k, s.lines[k])) n += s.lines[k].length
      }
      var cl = 0
      for (var i = 0; i < s.confession.length; i++) cl += s.confession[i].length
      console.info(TAG + path + ' -> ' + s.name + ' (' + s.id + ') - ' + n +
        ' lines + ' + s.confession.length + ' confession cutscenes (' + cl + ' lines)')
      names.push(path + ':' + s.name)
    }
    confessionSweep(event.server)
    console.info(TAG + 'below y' + CUTOFF_Y + ' your god cannot reach you. ' +
      names.length + ' speaker(s): ' + names.join(', ') +
      '. Confessions at or below y' + CONFESSION_Y + ', ' +
      Math.round(CONFESSION_CHANCE * 100) + '% per ' + CONFESSION_SWEEP + 't.')
    console.info(TAG + 'a path with no speaker gets SILENCE down there, not a stand-in.')
  })
})();
