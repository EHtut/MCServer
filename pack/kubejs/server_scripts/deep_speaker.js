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
  // 🔴🔴🔴 THE SPEAKER IS CAEBRIM. Ethan, 2026-08-23:
  //
  //     "no speaker for everyone except mera and kayer should be caebrim. (except
  //      salvage). kayer speaks for herself and alice speaks to mera."
  //
  // ⚠️ I GUESSED KAYER YESTERDAY (docs/60 §2) AND I WAS WRONG. The line I leaned on -
  // "I had to rescue my goddess from that church" - I read as Kayer's war. It is not.
  // It is CAEBRIM'S LITERAL BOOK-5 PLOT: Kayer refused the rescue and turned to war;
  // Caebrim refused BOTH and led a small party to free Alice from the Church.
  //
  // ⭐⭐ AND THE CLUE WAS IN THIS FILE THE WHOLE TIME. "She is not a god." Caebrim is a
  // FALSEHOOD - explicitly not a god - and her core wound is that she feels false:
  // "the false representation of the family Alice lost". Ethan wrote that comment in
  // August and I read straight past it.
  //
  // Every stanza of his confession is hers, and it is worse than it was as Kayer's:
  //
  //   "Tell your god I'm sorry. For everything I did."
  //          she raised him. She calls Gregor MY BOY.
  //   "He chose the wrong path. He was one of us. OUR FAMILY."
  //          Gregor COURT. She IS Court - she carries the found-family's name forever.
  //   "someone I was meant to protect, but I was too weak"
  //          🔑 the maternal anchor of the found family, saying it out loud
  //   "I was too focused on the mission."
  //          the rescue party. The one she led. The one that stalled.
  //   "I had to rescue my goddess from that church"
  //          ⭐ not a metaphor. That is the plot of her book.
  //   "Blinded by faith." / "I was destroying us."
  //          faith in FAMILY - she stays bound to Kayer knowing what Kayer did,
  //          because "family isn't healthy, but it's family"
  //
  // 🚨 NOT ONE WORD OF ETHAN'S TEXT BELOW IS CHANGED. Only the nameplate and the
  // colour, so that she matches her other registration (forge, further down). She is
  // ONE character with TWO entries because she says different things to the boy she
  // raised than to the girl she raised - that is not a workaround, it is the point.
  register('blade', {
    id: 'death_speaker',                 // ⚠️ id unchanged on purpose: it keys the met/stage
                                         // flags and the line pools, so renaming it would
                                         // reset every player's confession progress.
    name: 'the Shadow',
    colour: '§8',                        // was §7 grey. Now matches her forge entry.
                                         // "She is not a god" was always true and is now
                                         // the tell: a falsehood, not a god.
    lines: {
      // [CLAUDE-DRAFT] the Speaker's tide herald
      // 🚨 tide.js CALLS speaker.say(p, 'warn_wave') AND NO SPEAKER HAD THE POOL. The
      // deep herald silently fell through to the god's own voice - which is the exact
      // thing the design says cannot happen down here. Found by diffing the tags
      // speakers DEFINE against the tags anything CONSUMES.
      warn_wave: [
        'They have noticed you. That is not a thing I can undo.',
        'Something is coming up the corridor. He cannot help you with it.',
        'Be still. They are already moving.',
      ],
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
    //
    // 🔴🔴 SHE MAY BE KAYER. OPEN QUESTION, 2026-08-23 - docs/60 §2. NOT A CHANGE, AND
    // NOT ONE LINE OF ETHAN'S TEXT BELOW HAS BEEN TOUCHED. Read against the book canon,
    // every stanza fits the Matriarch:
    //
    //   "I had to make a choice"        she sees the whole future and chooses it anyway
    //   "He was one of us. Our family."  Gregor KAYER Court - she named and bound him,
    //                                    and he left the Court for the Church
    //   "someone I was meant to protect, but I was too weak"
    //                                    canon: KAYER kills him, by cutting him off
    //                                    from the link
    //   "rescue my goddess from that church"
    //                                    her entire war is "because the church took Alice"
    //   "Blinded by faith."             ⭐ the dark shepherd. This fits nothing else.
    //
    // ⚠️ THE COUNTER-CASE IS REAL AND IS WHY THIS IS A COMMENT, NOT AN EDIT: the header
    // above says of the Speaker "grey. She is not a god", and Kayer already has her own
    // entry in this file (death_matriarch, for art). Whoever rules on it should read
    // docs/60 §2 first - and either way these lines stay exactly as written.
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
    // ⭐⭐⭐ THE DOCTOR IS ALICE - AND ETHAN ALREADY WROTE THAT, IN AUGUST.
    //
    // His ruling 2026-08-23 was "alice speaks to mera". Wall IS Mera (docs/59). And the
    // colour comment on the very next line, written 2026-08-15, already says "She IS
    // the goddess." Nothing needs implementing. It was done before either of us knew
    // who Wall was.
    //
    // 🔑 SO THE MOTHER SPEAKS TO HER DAUGHTER'S CHAMPION. Mera is Alice's daughter
    // (docs/59 §3), believes she is a manufactured clone, and in the books attacks
    // Alice on sight. Alice knows. Alice says nothing. And Ethan's existing
    // characterisation - "the only voice in the world that is CURIOUS about you",
    // a scientist among the things she has finished looking at - is exactly what a
    // mother sounds like when she is not allowed to be one.
    //
    // 🚨 THE NAME STAYS "the Doctor". docs/40 §0: a name is the most expensive word
    // in the game and Alice is never printed. Naming her here would spend the most
    // expensive word in the project on a debug string.
    id: 'death_doctor',
    name: 'the Doctor',
    colour: '§b',                        // light blue. She IS the goddess.
    lines: {
      // [CLAUDE-DRAFT] the Doctor's tide herald
      warn_wave: [
        'Oh. Oh dear. They are awake, and they are coming.',
        'You should not be here for this. Neither should I.',
        'Hold on to something. Please.',
      ],
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
  // ⭐ THE EXPLICIT EXCEPTION. Ethan, 2026-08-23, handing Caebrim every other path:
  // "(except salvage)". He keeps his Keeper, and the reason is the same reason Salvage
  // is the freest god in the pantheon: "she isn't a real character in the actual
  // story", so there is no book character for a speaker to defer to. Nothing here can
  // contradict canon, so nothing here has to move. docs/61 §2.
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
      // [CLAUDE-DRAFT] the Keeper's tide herald
      warn_wave: [
        "That sound? That's them. I'd get ready.",
        "Something's coming. I'm sorry, I can't stop it.",
        "Brace yourself. It gets loud down here.",
      ],
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
  // ⭐ THE MATRIARCH IS HER OWN SPEAKER. Ethan, 2026-08-22: "she is her own depth
  // speaker, those lines should switch from cold to irritated and impatient."
  //
  // Every other entry in this file is a STAND-IN - a third party who meets you where
  // your god cannot reach. Kayer has no stand-in and needs none: she comes down
  // herself, and she is furious about having to.
  //
  // 🔑 SO SHE IS THE ONLY GOD IN THE PANTHEON WHOSE VOICE CHANGES WITH LOCATION.
  // Composed and clinical on the surface (art_voice.js); openly impatient and
  // insulting down here. Descending her path reveals CHARACTER, not just danger -
  // and that is the whole reason this file was worth extending rather than leaving
  // her silent, which is what I had originally written as canon and got wrong.
  //
  // ⚠️ AND SHE STILL GIVES NOTHING. Her `rare` lines are the one place another god
  // would slip; hers are where she notices you fishing and shuts it down. The truth
  // about her devotion is not learnable from her mouth, here or anywhere.
  //
  // ⚠️ NO `confession` ARRAY, DELIBERATELY. The three cutscenes are the moment a
  // speaker opens up over three descents. She does not open up. Registering an empty
  // one would be a lie about her; omitting it is the character.
  //
  // [CLAUDE-DRAFT] art/deep_intro · art/deep_common · art/deep_abandoned · art/deep_rare
  register('art', {
    id: 'death_matriarch',
    name: 'the Matriarch',
    colour: '§b',                        // pale blue - hers, and colder than the rest
    lines: {
      // [CLAUDE-DRAFT] her tide herald - the only one who is ANNOYED by it
      warn_wave: [
        'Something is coming. Deal with it.',
        'Company. Try not to embarrass either of us.',
        'They are moving. I am not going to say it twice.',
      ],
      intro: [
        'You have gone deep enough that I had to come myself. Do not make a habit of it.',
        'I do not usually come this far down. Consider that a mark against the depth, not a favour to you.',
        'This is what it costs to make me leave the surface. Try to be worth it.',
      ],
      common: [
        'Move faster. I have patience. It is thinner than yours.',
        'You are doing that wrong. I would fix it myself if I could. I cannot. That is the whole problem.',
        'Every step down here costs me something to watch. Make it worth the cost.',
        'I do not like it down here. I like waiting for you to finish even less.',
        'You hesitate more in the dark. Noted. Not admired.',
        'This is the part where you usually make a mistake. Go on, then.',
        'I would do this myself if I had hands. I do not. That is why you are here, and why I am irritated about it.',
        'Slower than last time. Explain that to yourself, not to me.',
        'The dark does not frighten me. Watching you fumble in it does something close to it.',
        'Finish. Elsewhere is waiting.',
      ],
      // ⭐ Said to ANOTHER god's champion, whose patron cannot reach them down here.
      // She is contemptuous of the absent god and makes sure they notice.
      abandoned: [
        'Your god is not coming. I am here, and I am not even yours.',
        'Alone down here, are you. Whoever sent you did not think that far ahead.',
        'I notice who follows their champion into the dark and who does not. Yours does not.',
        'No one is watching you but me. Make of that what you will. I already have.',
      ],
      // ⭐⭐ THE FIRST LINE SURVIVES THE BOOK CANON AND GETS BETTER (docs/58 §2).
      // I wrote it as DISMISSAL. It is not. Caebrim is her closest bond in the entire
      // series - "her rock, more than her husband" - and the four words that matter are
      // **"she'd never admit it"**. She timed the siege of Harrowfen so her sister would
      // be safely gone first.
      //
      // 🔑 So this is a WALL, not a shrug, and it needs no rewrite - only the note that
      // the person shutting the question down is shutting it down about the person she
      // loves most. Which is also exactly Ethan's own ruling that she never gives
      // secrets, now with a reason underneath it.
      //
      // 🚨 A later editor must NOT soften this line to show the warmth. The whole point
      // is that the warmth is never visible from outside; his own craft note says
      // showing her cold for 22 chapters is what made it land when we finally got in.
      rare: [
        'Caebrim and Ank are down here somewhere. That is the whole of what you are getting.',
        'You are hoping I keep talking. Everyone does, down here. It works on nobody.',
        'I have two names I do not use and reasons I do not explain. Enjoy the arithmetic.',
        'Whatever you think you have worked out about me, you have not. Dig.',
      ],
    },
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // FORGE'S — THE SHADOW.  Dark grey. She is Caebrim, and she is not a stand-in.
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan, 2026-08-22, asked directly whether Milantros gets a speaker in the dark:
  // "Her deep speaker is caebrim again."
  //
  // ⭐ EVERY OTHER GOD SENDS SOMEBODY THEY CHOSE. Forge's is the only speaker with a
  // claim on the god she is standing in for: Caebrim is the one who BEGGED ALICE TO
  // RAISE MILANTROS (docs/56 §0). She asked, Alice spent centuries, the ritual
  // collapsed, and Caebrim has been under the world ever since. So the voice that
  // meets the Goat's champion in the dark belongs to the reason the Goat exists.
  //
  // ── ⭐ SHE IS NOT HUNTING YOU TO KILL YOU ──────────────────────────────────
  // Ethan: "She is the one who hunts you in the depth, and the stalker is the closest
  // form to her." `nightmare_stalker` is RESERVED as her body (docs/57 §2) - so the
  // thing that follows you down here and the thing that talks to you down here are
  // THE SAME PERSON, which is the whole reason this pairing works.
  //
  // 🔑 But she follows you because you are MILANTROS'S, and that is the closest she
  // has come to her in centuries. Being pursued by something that is pleased to see
  // you is worse than being pursued by something that is not. Do not write her as
  // menace; write her as a want. The menace is free.
  //
  // ── ⚠️ THE NAME IS HELD BACK, AND THAT IS A RULE ──────────────────────────
  // docs/40 §0: a name is the most expensive word in the game and Caebrim is a
  // "title-in-waiting, not a label to print". So she is THE SHADOW everywhere except
  // the last line of the last confession stage - exactly the shape Ethan used for
  // Blade's Speaker, whose three stanzas end "Gregor, I am sorry."
  // ⚠️ `the Shadow` is MINE. One string to change.
  //
  // ✅ NO LONGER SCOPED TO FORGE - RULED 2026-08-23. She also holds BLADE (see the
  // long note on that entry above, where she was "the Speaker"). The final map:
  //
  //     blade    CAEBRIM      she raised Gregor. Her confession is to him.
  //     forge    CAEBRIM      she raised Milantros. Her confession is about her.
  //     wall     the Doctor   ⭐ = ALICE, speaking to her own daughter's champion
  //     art      the Matriarch = Kayer herself, the only god who comes down
  //     salvage  the Keeper   ⚠️ explicitly exempted by Ethan
  //
  // 🔑 TWO ENTRIES, ONE WOMAN. Distinct ids because the pools and the confession
  // stages key off `id` - and because she has a different history with each of them.
  // docs/61 §1.
  register('forge', {
    id: 'death_shadow',
    name: 'the Shadow',
    colour: '§8',                        // dark grey. The form the depths give her.
    lines: {
      // [CLAUDE-DRAFT] shadow/warn_wave
      warn_wave: [
        'They are moving. Stand near me if you like. It will not help, but you may.',
        'Something is coming up. Not mine. I do not command anything down here.',
        'Listen. There - that. Get your back to a wall.',
      ],
      // [CLAUDE-DRAFT] shadow/intro
      // 🔴 REWRITTEN 2026-08-23. The draft had "Nobody sent me and I came anyway" -
      // she does not do that. docs/61 §3, her behavioural tell: **she will not reach
      // out to anyone unless she feels fully welcome.** Feeling false, she refuses to
      // impose herself where she is not sure she is wanted. **She waits to be invited.**
      // So she is ALREADY HERE and has been; you are the one who arrived.
      intro: [
        'I know whose you are. I knew before you were down here.',
        'You came down to me. I want that noted. I did not come up.',
        'The one you follow cannot reach this far. I can. I have always been this far.',
      ],
      // [CLAUDE-DRAFT] shadow/common
      // ⭐ THE REGISTER: pleased, patient, and never once threatening. She has nothing
      // to gain from you and she is not going anywhere.
      // ⭐ REGISTER CORRECTED 2026-08-23 (docs/61 §3). Two changes, both from the dump:
      //
      //   1. **DEADPAN AND DRY.** The draft was lyrical. She is not. Flatter, shorter,
      //      no cadence. Her shadow-form art note generalises straight into dialogue:
      //      "cryptid = LESS information, not more." **She says less than you want.**
      //   2. **SHE IS A MOTHER.** She raised Pille (who calls her "Mom"), Gregor ("my
      //      boy"), and Milantros. I wrote her as a want. The want is maternal - and
      //      it is the thing she will not impose on you.
      //
      // ⭐ "Waiting is most of what I am" was in the first draft and turns out to be her
      // canon exactly. It stays, and everything else is built around it.
      common: [
        'Keep going. I am not going to stop you and I am not going to leave.',
        'You build the way she does. Badly, and then again, and then it works.',
        'Do not look behind you. It is only me. Looking makes it worse for you, not for me.',
        'She talks to you constantly. I can hear the shape of it from here. Not the words.',
        'Rest if you want. I will wait. Waiting is most of what I am.',
        'You are not afraid of me yet. That is fine.',
        'Everything down here used to be somebody.',
        'I am closer than I was. Not on purpose.',
        'Eat something. I am aware of how that sounded.',
        'Mind the ceiling.',
        'Go on.',
      ],
      // ⚠️ STILL DEAD ACROSS ALL FIVE SPEAKERS - defined, consumed by nothing. Kept
      // for parity so whoever wires it does not have to write five pools first. For
      // HER it is the sharpest of the five: she is the reason the god who cannot
      // follow you down here exists at all.
      // [CLAUDE-DRAFT] shadow/abandoned
      abandoned: [
        'Your god is not coming down here. Mine did not either.',
        'She would if she could. That is not a comfort, it is just true.',
        'Alone, then. I have some experience of it. Sit down.',
      ],
      // [CLAUDE-DRAFT] shadow/rare
      // ⭐ HER rare IS THE OPPOSITE OF KAYER'S. Kayer's rare pool is where she CATCHES
      // you fishing and shuts it down (docs/53). Caebrim leaks. She has been alone for
      // centuries and cannot help herself - which is why she gets a confession and her
      // sister deliberately does not.
      // ⭐ HER rare IS THE OPPOSITE OF KAYER'S. Kayer's is where she CATCHES you fishing
      // and shuts it down (docs/53). Caebrim leaks - she has been alone a long time and
      // cannot help it. That is why she gets a confession and her sister does not.
      //
      // 🔑 The last two are the load-bearing ones: "family isn't healthy, but it's
      // family" is her actual position on the sister who burned everything, and
      // **the kids don't know it was Kayer - and would walk if they did** (docs/61 §5).
      rare: [
        'I asked for something once. I got it. That is not the same as it going well.',
        'She used to call me a name. I am not going to tell you what it was.',
        'There is another one of me up there somewhere, and a third. We do not speak.',
        'You are carrying something she made. I can feel it from here. It is very loud.',
        'Family is not healthy. It is still family. I have had three hundred years to find a way around that sentence.',
        'There is a thing your god does not know, and I am the one who decided she would not. Do not ask again.',
      ],
    },
    // ═════════════════════════════════════════════════════════════════════════
    // 🚨 THE CONFESSION. Three staged cutscenes, phase-gated, one per descent.
    //
    // ⚠️ THIS IS THE MOST REWRITE-WORTHY THING IN THE REPO. The EVENTS are Ethan's,
    // verbatim from docs/56 §0 - she begged, Alice did not know how, it took
    // centuries, Alice made a choice the night before, and the ritual collapsed. The
    // WORDING is mine and it should not survive contact with him. Blade's equivalent
    // is his own writing and it is the best text in the game; this is a placeholder
    // holding the mechanic open, nothing more.
    //
    // ⭐ THE SHAPE IS DELIBERATELY BLADE'S: three stanzas, and the name lands as the
    // last words of the last one. "Gregor, I am sorry." / "Milantros. I am sorry."
    // ═════════════════════════════════════════════════════════════════════════
    // [CLAUDE-DRAFT] shadow/confession
    // 🔴 REWRITTEN after the book dump (docs/56 §0b). The first draft had her as the
    // one who ASKED for Milantros. She is her MOTHER - she found her standing in a
    // village that had been burned with a letter D left in the tracks, Momma Pille
    // insisted on keeping her, and Caebrim raised her and put a silver rifle in her
    // hands. Stanza 2 is now built on Ethan's own beat, which he wrote for the Ank
    // book and which is the single best thing either character has:
    //     "you called me ugly and tripped"
    confession: [
      [
        'You are the first one of hers to come this far down.',
        'I did not expect that to matter to me. It does.',
        'Go back up. Not because it is dangerous. Because I would like to be able to look forward to it.',
      ],
      [
        'I found her in a village that had been put to the torch. There was a letter carved in the mud and she was the only thing still standing in it.',
        'Pille said we were keeping her. I did not argue. It is the one thing I have never once regretted not arguing about.',
        'She called me Uggo. Tripped straight over her own feet doing it, flat on her face, got up and did it again.',
        'That is the first thing she ever said to me and I have had four hundred years to think about it.',
      ],
      [
        'So when she died I went to the only person I have ever begged for anything, and I begged.',
        'It took her centuries. She never once told me it could not be done.',
        'The night before, she made a choice. I do not know what it cost and she would never have said.',
        'And it worked. That is the part nobody believes - it WORKED. She woke up new and she looked right at me.',
        'And then the whole of it came apart, and I watched her go straight up through the ceiling.',
        '',
        'She does not remember any of it. She is happy. I have decided that is enough.',
        '',
        'Milantros. I am sorry.',
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

  // How often an ordinary deep line becomes "your god is not coming" instead.
  // Deliberately low: it is a reminder, not a theme.
  var ABANDONED_CHANCE = 0.15

  // Say something as whoever is down there. Handles the one-time introduction
  // itself, because the first thing a speaker ever says is not a random line.
  // ⭐⭐ D2 - THE INTRODUCTION, EXTRACTED SO TWO ROUTES SHARE ONE IMPLEMENTATION.
  //
  // She can now be met two ways: **in the depths**, as always, or **on the 30th
  // night**, per Ethan's 2026-08-29 ruling (`docs/70`). Both are the same event and
  // both must set the same `met` flag, or a player could be introduced twice - and the
  // first thing a speaker ever says is precisely the line that must not repeat.
  //
  // 🔑 EXTRACTED RATHER THAN DUPLICATED. A second copy of "set met, log, say intro"
  // in night.js would be one edit away from drifting, and the drift would be invisible:
  // two introductions look like one introduction plus a bug nobody can reproduce.
  //
  // ⚠️ NO DEPTH CHECK HERE, DELIBERATELY. The caller decides WHY she is introducing
  // herself; this function only knows that she is. `say()` keeps its own depth gating.
  //
  // Returns true only if an introduction actually happened.
  function introduce(p, why) {
    var s = speakerFor(p)
    if (!s || !VELDORA.voice) return false
    var met = false
    try { met = !!p.persistentData.getBoolean(metKey(s)) } catch (e) { }
    if (met) return false
    try { p.persistentData.putBoolean(metKey(s), true) } catch (e) { }
    console.info(TAG + p.username + ' has met ' + s.name +
      (why ? ' (' + why + ')' : ''))
    return VELDORA.voice.say(p, s.id, 'intro')
  }

  function say(p, tag) {
    var s = speakerFor(p)
    if (!s || !VELDORA.voice) return false
    var met = false
    try { met = !!p.persistentData.getBoolean(metKey(s)) } catch (e) { }
    if (!met) return introduce(p, 'the depths')
    // ⭐⭐ `abandoned` FINALLY HAS A CONSUMER (2026-08-23). Five speakers have written
    // this pool since 2026-08-15 and NOTHING had ever spoken it - a pool with no
    // consumer is the same defect as a gate with no consumer, and it had been flagged
    // and left three times.
    //
    // 🔑 THE SEMANTIC THAT MAKES IT WORK ONLY EXISTS NOW. Its comment says it is for
    // a champion "whose patron cannot reach them down here" - which was true of nobody
    // in particular until Kayer became her own deep speaker. She is the ONE god who
    // comes down herself (docs/53 §3). Everyone else's god genuinely cannot follow.
    //
    // So: on an ordinary line, a non-art champion sometimes hears that their god is
    // not coming, from the thing that is here instead. Art's champion never does,
    // because hers IS here - and that asymmetry is the entire point of her register.
    //
    // ⚠️ MY CALL, not a ruling. One constant to revert.
    if (!tag && s.lines && s.lines.abandoned && s.lines.abandoned.length) {
      var mine = ''
      try { mine = (VELDORA.paths && VELDORA.paths.pathOf(p)) || '' } catch (e) { }
      if (mine !== 'art' && Math.random() < ABANDONED_CHANCE) {
        if (VELDORA.voice.say(p, s.id, 'abandoned')) return true
      }
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
    introduce: introduce,
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
    var lost = []
    for (var path in SPEAKERS) {
      if (!SPEAKERS.hasOwnProperty(path)) continue
      try {
      var s = SPEAKERS[path]
      VELDORA.voice.setColour(s.id, s.colour)
      var n = 0
      for (var k in s.lines) {
        if (!s.lines.hasOwnProperty(k)) continue
        if (VELDORA.voice.registerLines(s.id, k, s.lines[k])) n += s.lines[k].length
      }
      // 🔴🔴 THIS LINE TOOK TWO SPEAKERS OFF THE MAP FOR A DAY. Fixed 2026-08-23.
      //
      // `confession` is OPTIONAL - Kayer's entry has none deliberately ("her three
      // cutscenes are the ritual, she does not confess"). This loop read
      // s.confession.length unguarded, threw on her, and killed ServerEvents.loaded
      // where it stood. Everything registered BEFORE her survived; everything after
      // her did not:
      //
      //     blade  ✅   wall  ✅   salvage  ✅   art  🔴 THREW   forge  🔴 NEVER REGISTERED
      //
      // ⚠️ HOW IT HID: this file's own ServerEvents.loaded only runs on a RESTART, and
      // every deploy since Kayer was built said "deployed, NOT restarted". The
      // 21-assertion harness passed the whole time because it calls the functions
      // directly and never runs the boot block. That is this project's oldest lesson
      // arriving again - run_all cannot see liveness, and a gate ships with a live
      // consumer or not at all.
      //
      // 🚨 The guard is not the real fix; ORDER-INDEPENDENCE is. One malformed entry
      // must cost its own registration and nothing else, so the loop body is wrapped
      // and reports the casualty by name instead of dying silently in the middle.
      var conf = (s.confession && s.confession.length) ? s.confession : []
      var cl = 0
      for (var i = 0; i < conf.length; i++) cl += conf[i].length
      console.info(TAG + path + ' -> ' + s.name + ' (' + s.id + ') - ' + n +
        ' lines + ' + conf.length + ' confession cutscenes (' + cl + ' lines)' +
        (conf.length ? '' : ' - NO CONFESSION, and that is deliberate for her'))
      names.push(path + ':' + s.name)
      } catch (e) {
        // One bad entry costs ITSELF and nothing downstream. Named loudly, because a
        // path that silently has no deep voice is indistinguishable from a path that
        // deliberately has none.
        lost.push(path)
        console.error(TAG + '!! ' + path + ' FAILED TO REGISTER and has NO deep voice :: ' + e)
      }
    }
    if (lost.length) {
      console.error(TAG + '!! ' + lost.length + ' speaker(s) lost: ' + lost.join(', ') +
        ' - their champions hear SILENCE below the cutoff. This is a bug, not a design.')
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
