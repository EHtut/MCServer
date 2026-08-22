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
  // ⚠️ NO LONGER A GATE. Confessions are phase-paced now (see below); this is kept
  // only because it is the published `VELDORA.speaker.floor` and other systems and
  // the /speaker readout still want to name the bottom of the world.
  var CONFESSION_Y = -120           // the sealed floor, for reference
  var CONFESSION_CHANCE = 0.10      // per sweep, once a stage is DUE
  var CONFESSION_SWEEP = 1200       // 60s between rolls
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
  // SALVAGE'S — THE KEEPER.  Yellow.  He knew her before she was a god.
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan's writing, 2026-08-15.
  //
  // ⭐ THE ONLY SPEAKER WHO IS NOT TALKING ABOUT YOU. The Speaker apologises to
  // Blade; the Doctor explains herself to the Spider's champion. He is grieving
  // somebody, and you happen to be standing there wearing her mark.
  //
  // He is gentle, apologetic, and out of his depth - "watch your step, there's a
  // few cliff edges" is the only line in the game where a voice from the dark is
  // WORRIED FOR YOU. He mistakes you for her for a second and then says "Shame."
  //
  // 🚨 HE NAMED HER. That is the confession, and it lands harder than either of the
  // others because it is not a crime - it is a man who did his job well and lost
  // her anyway. "She didn't have one before me, and it was my job." Then: "she left
  // to find a new life away from us" - and Ethan's hidden lore says what happened
  // next. The fracture split her mind in two and the court forced her ascension.
  // He does not know that. He thinks she simply left.
  register('salvage', {
    id: 'death_keeper',
    name: 'the Keeper',
    colour: '§e',                        // yellow
    lines: {
      intro: [
        "You aren't supposed to be down here. It's dangerous.",
        "Oh... you're a champion of the wolf.",
        "I thought you were... you looked a lot like her for a second.",
        "Shame.",
        "Well... welcome to hell, I guess.",
      ],
      common: [
        "The undead down here are a bit more broken than their predecessors.",
        "Watch your step, there's a few cliff edges.",
        "According to my master, her undead were broken by the ritual. I do my best to make them feel welcome, however.",
        "From my books, the wolf is someone to not be trusted, yet you took her hand.",
      ],
      abandoned: [
        "A bit too low, aren't you?",
        "Getting closer. Your wolf can't hear you any more.",
        "There are things down here that even scare me.",
      ],
    },
    confession: [
      [
        'I did my best.',
        'That wolf, before she ascended... I was her keeper.',
        'Well, a keeper of all our people. But her? I knew her name.',
      ],
      [
        "I was the one who named her.",
        "She didn't have one before me, and it was my job.",
        "But then she left. She left to find a new life away from us.",
      ],
      [
        "And that was ok, because it was her choice.",
        "I just wish I could've done more.",
        '',
        "Maybe I'm just weak. I've known that for a long time.",
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE CUTOFF IS "IN THE DEPTHS", NOT A NUMBER.  Ethan, 2026-08-22:
  //     "when you go into the depths at all, you get the speaker. anything that's
  //      no ceilling and in negative y"
  //
  // Two conditions, and BOTH must hold: **below y 0** and **no sky above you**.
  //
  // ⚠️ Y ALONE WAS NEVER ENOUGH, and this repo has already paid for that once. The
  // In Control README records the same mistake twice: `minheight: 40` treated an
  // absolute height as a measure of being underground, so a cave inside a mountain
  // was "the surface" and a mountain valley was not. The sky test is what actually
  // means "enclosed"; the y test is what means "deep". Neither is the other.
  //
  // 🔑 IT ALSO REPAIRS A DEAD BAND. Below y-64 is 100% air across the whole world
  // (measured, docs/50 §1) - the old cutoff put the Speaker exclusively in a void
  // nobody can stand in, which is a large part of why he had never once been heard.
  // y 0 with a roof is where players actually mine.
  //
  // ⚠️ Sky-readability is PROBED, not assumed - godevents' rule. If this build has
  // no canSeeSky, fall back to the old absolute cutoff rather than either silencing
  // him everywhere or letting him speak in daylight.
  // ═══════════════════════════════════════════════════════════════════════════
  var DEPTH_Y = 0                 // "in negative y"
  // The rule, in one place, so no banner can restate it wrongly. See the note at
  // the boot report.
  var DESCRIBE = 'the depths (below y' + DEPTH_Y + ' with no sky above; falls back ' +
    'to a flat y' + CUTOFF_Y + ' if this build cannot read sky)'

  function seesSky(p) {
    try {
      var lvl = p.level
      if (lvl && typeof lvl.canSeeSky === 'function') return !!lvl.canSeeSky(p.blockPosition())
      var b = p.block
      if (b && typeof b.canSeeSky === 'boolean') return !!b.canSeeSky
      if (b && typeof b.canSeeSky === 'function') return !!b.canSeeSky()
    } catch (e) { }
    return null                   // unreadable - the caller decides, see below
  }

  function belowCutoff(p) {
    var y = null
    try { y = p.y } catch (e) { return false }
    if (typeof y !== 'number' || !isFinite(y)) return false

    var sky = seesSky(p)
    if (sky === null) {
      // No sky test available. Fall back to the old absolute floor, which is
      // conservative in the right direction: he stays rare rather than becoming
      // wrong. Warned once so a silent regression is not mistaken for tuning.
      if (!skyWarned) {
        skyWarned = true
        console.warn(TAG + 'canSeeSky unavailable - falling back to the flat y' +
          CUTOFF_Y + ' cutoff. The Speaker will be much rarer than intended.')
      }
      return y <= CUTOFF_Y
    }
    return y < DEPTH_Y && !sky
  }
  var skyWarned = false

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

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE CONFESSIONS ARE PACED BY THE PHASE, NOT BY DEPTH (Ethan, 2026-08-15)
  // ═══════════════════════════════════════════════════════════════════════════
  //   "I kinda want to stage the confessions as something that happens right
  //    before a harvest."
  //
  // They used to roll at 10% a minute while you stood at y-120, which meant the
  // story was told to whoever camped the sealed floor longest and had NO relation
  // to what was happening to that player. Riding `phase.js` instead ties each stage
  // to how close the god is to collecting you:
  //
  //   stage 1 -> companion   the phase where you stop being new
  //   stage 2 -> absence     the phase where the god starts to lose patience
  //   stage 3 -> harvest     the phase that IS the Harvest
  //
  // So the last thing you hear before something comes for you is "Gregor, I am
  // sorry" - or, if you walk with the Spider, "Tell Mera that it's her time."
  // That line was written to be a herald. Now it is one.
  //
  // ⚠️ DEPTH STILL GATES *WHO*, NEVER *WHEN*. You must have gone below y-64 at
  // least once to have MET them - the descent is still how you find these voices.
  // But having met them, they will reach up to you. Her breaking her own silence to
  // finish the story is the point, not a loophole.
  var CONFESSION_PHASES = ['companion', 'absence', 'harvest']

  function phaseRank(ph) {
    if (ph === 'helper') return 0
    if (ph === 'companion') return 1
    if (ph === 'absence') return 2
    if (ph === 'harvest') return 3
    return -1                                  // unreadable is NOT 'helper'
  }

  // Eligible = has met them, has stages left, and has climbed far enough that the
  // next stage is due.
  function confessionEligible(p, server) {
    var s = speakerFor(p)
    if (!s || !s.confession) return false
    if (finished(p, s)) return false
    try { if (!p.persistentData.getBoolean(metKey(s))) return false } catch (e) { return false }

    var ph = ''
    try {
      if (!server) server = p.server
      if (VELDORA.phase) ph = VELDORA.phase.of(server, p) || ''
    } catch (e) { return false }
    var have = phaseRank(ph)
    if (have < 0) return false                 // no phase = no pacing = say nothing

    var stage = stageOf(p, s)
    var need = phaseRank(CONFESSION_PHASES[stage] || 'harvest')
    return have >= need
  }

  // The roll is still a roll - a stage that fired the instant a band changed would
  // read as a cutscene bolted to a number. It should feel like she chose a moment.
  function confessionSweep(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        if (!confessionEligible(p, server)) continue
        if (Math.random() > CONFESSION_CHANCE) continue
        var ph = ''
        try { if (VELDORA.phase) ph = VELDORA.phase.of(server, p) || '?' } catch (e) { ph = '?' }
        confess(p, 'phase ' + ph)
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
      var st = stageOf(p, s)
      var nowPh = ''
      try { if (VELDORA.phase) nowPh = VELDORA.phase.of(ctx.source.server, p) || '?' } catch (e) { nowPh = '?' }
      p.tell(Text.of('§8down here you meet §f' + s.name))
      p.tell(Text.of('§8confession §f' + st + '§8/§f' + s.confession.length +
        '§8 · phase §f' + nowPh + '§8, next stage needs §f' +
        (CONFESSION_PHASES[st] || 'harvest')))
      p.tell(Text.of('§8  ' + (finished(p, s) ? '§7finished' :
        (confessionEligible(p, ctx.source.server) ? '§aDUE - rolling ' +
          Math.round(CONFESSION_CHANCE * 100) + '% every ' + CONFESSION_SWEEP + 't' :
          '§8not yet - climb further'))))
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
    // ⚠️ THE FIFTH STALE BANNER IN FOUR DAYS. This announced "below y-64" for hours
    // after the rule became "below y0 AND no sky" - and it is the ONE line that
    // tells anyone what the rule is. The others were wall_events crediting minions
    // for rage, salvage advertising the wrong interval, killorder denying its own
    // registry, idle claiming a cap that had been deleted.
    //
    // 🔑 THE PATTERN IS NOT CARELESSNESS, IT IS DUPLICATION. Every one of them
    // restated a rule that lived somewhere else, so editing the rule left the
    // sentence behind. DESCRIBE() is derived from the same values belowCutoff()
    // actually reads, so the two cannot disagree.
    console.info(TAG + DESCRIBE + ' - your god cannot reach you there. ' +
      names.length + ' speaker(s): ' + names.join(', ') + '.')
    console.info(TAG + 'confessions are PHASE-PACED (' + CONFESSION_PHASES.join(' -> ') +
      '), ' + Math.round(CONFESSION_CHANCE * 100) + '% per ' + CONFESSION_SWEEP +
      't once due. You must have MET them there first.')
    console.info(TAG + 'a path with no speaker gets SILENCE down there, not a stand-in.')
  })
})();
