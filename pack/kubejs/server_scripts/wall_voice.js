// wall_voice.js - The Spider's lines + trust tiers.
//
// ⚠️ GENERATED SKELETON (tools/new_god.py). The STRUCTURE is correct and carries
// the invariants from docs/41 §3; the WRITING is not here yet. Every pool below is
// empty and marked TODO(ethan), and the boot log says so out loud.
//
// Trust is the COUNTER (counters.js). This god counts: rage - minions raised, minus minions slain.
//
// Read docs/41-BUILDING-A-GOD.md before editing. Read docs/40-BLADE-THE-WARRIOR.md
// for a finished example of every pattern used here.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[wall] '
  var GOD = 'wall'
  var COLOUR = '§5§l'

  // Thresholds on: rage - minions raised, minus minions slain.
  // ⚠️ A FIRST GUESS, and meant to be. Replace with a measured curve once there is
  // play data - do not argue about these numbers, measure them.
  var MEDIUM_AT = 10
  // 40 -> 50 so the VOICE agrees with the SLIDER. The behaviour curve runs calm at
  // 10 and fury at 90 (wall_events.js), which puts the midpoint - where she asks
  // most - at 50. Leaving high at 40 meant she spoke her "you're hers now" register
  // through most of the range where she was still asking permission.
  //   low     <= 10   pure boons
  //   medium  10-50   she asks
  //   high    50+     attacks dominate
  // One number; move it if it plays wrong.
  var HIGH_AT = 50

  // 🚨 UNREADABLE IS NOT 'low'. A god who cannot read his own counter must say
  // NOTHING. Defaulting to the low tier turns every storage hiccup into contempt,
  // which is docs/41 invariant #4 and the most expensive one on the list.
  function tierOf(player) {
    var n = null
    try { if (VELDORA.counter) n = VELDORA.counter.get(player, GOD) } catch (e) { }
    if (n === null) return null
    if (n >= HIGH_AT) return 'high'
    if (n >= MEDIUM_AT) return 'medium'
    return 'low'
  }

  // ── the lines ──────────────────────────────────────────────────────────────
  // A `rare_<tag>` pool is rolled by idle.js at 15% BEFORE its common twin. Put the
  // lines where this god is a person in there, and nowhere else.
  var LINES = {
    // ⭐ REBUILT 2026-08-15 FROM THE ACTUAL MOD GUIDES, and deliberately naming
    // no mod, no menu and no item id. A god does not know what a thing is called
    // in a wiki; it knows there is a shape you draw and something answers. If the
    // progression cannot survive being spoken by somebody who never read the
    // guide, we did not understand it. FOR ETHAN'S REVIEW.
    guidance: [
      "Chalk first, love. A shape on the floor, drawn exactly, or nothing comes.",
      "The shape is the whole of it. One line wrong and you have drawn nothing at all.",
      "Stand something at each corner and speak. The first thing that answers will be small. Let it be small.",
      "Small ones first. The ones worth having will not come for a beginner's chalk.",
      "Bind one into a book and it is yours to call again. Loose ones belong to nobody.",
      "The dead carry a kind of power in them. Take it before it goes out.",
      "That power is the currency down here. Everything I can teach you is bought with it.",
      "A rod is only a rod until you seat something in it. Then it speaks.",
      "What you seat in it decides what it says. Collect them.",
      "Raise them, keep them, feed them. Every one that stands is one more of us.",
      "Do not let them die, love. I feel every one.",
    ],
    low_gift: [
      "Heal, love. Heal.",
      "Eat and feast, you need your strength.",
      "Let me in, I can assist.",
      "I will stand by your side. Always.",
      "Take it. I have no one else to give it to.",
      "You are hurt. I felt it before you did.",
      "I made this for you. I have had a long time to learn.",
      "Do not thank me. Just keep it close.",
    ],
    medium_gift: [
      "Stay safe. Please.",
      "Our work isn't done. It will never be done.",
      // CUT 2026-08-16. "You have been gone eleven minutes. I counted." - Ethan saw
      // it fire in play and asked what it even meant. Three things were wrong:
      //   · "eleven minutes" was a HARDCODED string. Nothing measured anything, so
      //     it said eleven whether you had been away thirty seconds or three days.
      //   · it sat in `medium_gift`, which fires while she HANDS YOU SOMETHING - so
      //     it arrived attached to a regeneration buff, about nothing.
      //   · a real absence system already exists and works: K_SEEN stamps the world
      //     day on logout and the `returned` pool fires on login after >= 2 world
      //     days. That pool already says this better - "How long was that? Do not
      //     tell me."
      // The counting is very her; the fake number was not. Cut rather than moved,
      // at his call.
      "Rest. I will keep watch. I do not sleep.",
      "Closer. You can stand closer than that.",
      "I have been alone a very long time. You should know that about me.",
    ],
    medium_hostile: [
      "They dare. They Dare.",
      "We need to hurt them. They need to be hurt. Please.",
      "Say the word. Only the word. I will do the rest.",
      "They walked past you as though you were furniture.",
      "I am not angry. I am not. I am not.",
      "You do not have to watch. Just do not stop me.",
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐ ONE VOICE PER ATTACK.  Ethan, 2026-08-16 - he asked for the split and
    // authorised these lines, the loop being: he plays, and anything that does not
    // fit comes back as "here's a better line". Every line here is a FIRST DRAFT
    // awaiting that.
    //
    // [CLAUDE-DRAFT] wall/snare_hit · wall/dark_hit
    // [CLAUDE-DRAFT] wall/web_hit · wall/swarm_hit
    //
    // Until now snare, dark, web and swarm ALL said `high_hostile`. Blindness,
    // slowness, five spiders and nine spiders are mechanically distinct and were
    // audibly identical - and it is her most distinctive content in the game.
    //
    // 🔑 EVERY LINE BELOW IS SAID TO THE VICTIM, not to her champion. She explains
    // herself to the person she is killing, which is worse than threatening them.
    //
    // Her rules, applied: never `gone`, `lost` or `dead` · endearments and never a
    // name, because the gods do not see you for you (Ethan, 2026-08-16) · fast, with
    // run-ons and sentences that change direction halfway · never cruel, and that is
    // the horror.
    // ═══════════════════════════════════════════════════════════════════════

    // SNARE - slowness II + weakness, 12s. She is not hurting them, she is HOLDING
    // them, and holding is the whole of her.
    snare_hit: [
      "Stay. Just for a moment, stay.",
      "There. Now you are easier to hold.",
      "I am not hurting you. I am holding you. There is a difference and you will feel it.",
      "Slower. Slower. That is better, that is - there.",
      "You were going somewhere. You are not, now.",
      "It does not hurt, love. It only stops.",
    ],

    // DARK - blindness, 8s. She takes the seeing, not the life.
    dark_hit: [
      "Do not look. It is easier if you do not look.",
      "There. Now you cannot see how many of us there are.",
      "I am still here. I am always still here.",
      "Close them. It is the same either way.",
      "You do not need those for this part.",
      "Shh. It is dark for me too, most of the time.",
    ],

    // WEB - five spiders, no choice. Her children, and she introduces them.
    web_hit: [
      "They have been waiting to meet you.",
      "Do not hurt them. They are only doing what I asked.",
      "Five. That is not many. I could have asked for more.",
      "They are mine and they are gentle and they are coming.",
      "You will not be alone. I would not do that to anyone.",
      "Be kind to them. They are very young.",
    ],

    // SWARM - nine, at the far end of the slider. She counts. She always counts.
    swarm_hit: [
      "All of them. I am sorry, I am - all of them.",
      "I asked nicely. I did ask.",
      "There are nine. I counted. I always count.",
      "Do not fight it. It takes longer that way and I do not want it to take longer.",
      "This is the last time we do this. I keep saying that.",
      "I would rather you sat down.",
    ],

    // ── CONTRACTS (+++). She never orders. She asks, and the ask is worse. ──────
    // ⚠️ Framed as HELPING YOU GROW, never as wanting somebody dead (Ethan,
    // 2026-08-16: "every battle is a choice she offers to help the player grow
    // stronger"). Same event as an assassination; completely different god.
    // {target} is substituted.
    contract_ask: [
      "{target} is in your way. I can feel you stopping when they are near.",
      "You are not growing, love, and I think I know why. I think it is {target}.",
      "Say yes and I will not ask again for a while. {target}. Only that.",
      "I want you bigger than you are. {target} is what is between.",
      "It would be quick. I am not asking you to enjoy it, I am asking you to do it.",
      "{target}. Please. I have been so patient about this.",
    ],
    contract_done: [
      "There. Do you feel it? You should feel it.",
      "Good. Good. That is one less thing standing between you and the rest of it.",
      "I knew you would. I did not doubt it, not once, not really.",
      "You are bigger than you were this morning.",
      "Thank you. I do not say that enough and I should.",
    ],
    contract_lapsed: [
      "You did not. That is all right. I will hold it for you.",
      "It is fine. It is - no, it is fine. There will be another.",
      "I am not upset. I want you to know that I am not upset.",
    ],

    // ── THE QUIET (⭐). Once per session, and only when she is at her worst. ────
    // Her brief: "She goes quiet exactly once per conversation, and that's when the
    // true thing comes out. One short sentence, then straight back to talking."
    // 🚨 SHORT. Every other pool of hers runs on; this one must not. The contrast IS
    // the mechanic - if these get long the beat disappears.
    quiet: [
      "I do not think I am catching any of them.",
      "It has been a very long time.",
      "I cannot remember the last one I reached in time.",
      "Sometimes I think they are not falling. I think they are being pushed.",
      "I do not know how to stop.",
      "You would tell me. If it were not working. You would tell me.",
    ],

    high_hostile: [
      "You will never be a part of us.",
      "You. Die.",
      "I cannot let you live. You may be a champion but you are a monster.",
      "Worse than him...",
      "Do not run. It is not that kind of thing.",
      "I gave them everything. What did your god give you?",
      "Stand still. This is not for you to understand.",
    ],
    low_silence: [
      "You are growing well.",
      "Like a flower in a sunlit field.",
      "They will never understand what we are. What we need. Throw them away.",
      "The champions of the other gods are but insects compared to us.",
      "Good. Good. Again.",
      "I knew. Before you did, I knew.",
    ],
    medium_silence: [
      "The family grows. Hearth and home.",
      "Let us rest tonight, there is more work to do in the morning.",
      "I can feel your power growing, perhaps... perhaps it is enough to hurt them. To make them suffer.",
      "Let our people grow in the light so we may save those in the dark.",
      "Every one you raise is one more that cannot leave. Is that not lovely?",
      "You are becoming something. I would like to be there when you finish.",
    ],
    high_silence: [
      "I have never made a good choice in my life. This is the first.",
      "Do you know what led me to you? It was knowing that you were the one.",
      "My goddess... Mother. Perhaps you will be the one...",
      "I have never known companionship until now. Thank you.",
      "A union. Mother, we are coming.",
      "Alice... That name feels... Familiar.",
      "There is no version of this where I let you go.",
      "I would burn the other four for one more hour of this.",
    ],
    loc_above: [
      "The gods have never understood us.",
      "This land was once beautiful. Now? It is a playground for forces that should not belong.",
      "There is but one god. And it is not the matriarch. It is not me.",
      "Can you feel the grass beneath your feet? I have. Once.",
      "Perhaps one day...",
      "Stand there a moment longer. The light suits you.",
      "They are watching us. Let them.",
    ],
    loc_below: [
      "Be safe. Please.",
      "There are things down here. Things that shouldn't be.",
      "Lead from the back, love.",
      "The dead walk these realms. We are not so dissimilar.",
      "It is colder here. I do not know why I can tell.",
      "Do not go deeper than I can follow.",
    ],
    rare_loc_above: [
      "I... I can't help but feel...",
      "A kinship. One with the dead.",
      "There were once gods... now? Now we are shadows.",
      "The goddess of death walks this realm alongside her three generals.",
      "I carried a light once. It is not mine any more.",
      "My father was a soldier. I am told. I was not there.",
      "Something in me broke open. It had been waiting my whole life.",
      "I was somebody's daughter. That is the part nobody kept.",
    ],
    rare_loc_below: [
      "She is down here. I can feel the shape of her.",
      "I do not come this deep. I am not welcome this deep.",
      "The failed things down here were somebody's work. Somebody careful.",
      "If she speaks to you... do not believe all of it.",
    ],
    combat: [
      "Behind you. Always behind you, love.",
      "Do not let it touch you.",
      "Kill it. Kill it and come back.",
      "I cannot reach you in there. Hurry.",
    ],
    hold_weapon: [
      "Good. Keep it drawn.",
      "That will do. It does not have to be beautiful.",
    ],
    hold_food: [
      "Eat. All of it.",
      "You forget. I do not.",
    ],
    returned: [
      "You are back!",
      "I missed you.",
      "The realm barely changed in your absence, as did I.",
      "I did not move. I want you to know that I did not move.",
      "How long was that? Do not tell me.",
    ],
    harvest_won: [
      "You fought them off. I...",
      "I guess this is the end. I didn't want it to end like this.",
      "I had no choice.",
      "Not really.",
      "You are ready.",
    ],
    harvest_lost: [
      "*You awaken. Your body is deeply warm, like something held you and only recently let go.",
      "You're awake. It was a very, very bad dream.",
      "It won't happen again.",
      "Come. We have things to do.",
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // THE ARGUMENT (docs/49 §4). Spoken ALOUD, to every player, when a grudge
    // fires. Line 1 of accuse and line 1 of threat are ETHAN'S, verbatim.
    //
    // [CLAUDE-DRAFT] wall/argue_accuse[keep1] · wall/argue_answer
    // [CLAUDE-DRAFT] wall/argue_threat[keep1] · wall/argue_refuse
    // [CLAUDE-DRAFT] wall/argue_unanswered
    //
    // Her register: grief, never rage. She does not say "how dare you", she says
    // "look what you did to it". A champion is a possession that has been damaged,
    // and the horror is that she means it kindly.
    //
    // ⭐⭐ AND THE GRIEF HAS A SOURCE NOW (docs/59 §2). Wall is MERA: built and hyped her
    // whole life for one role, held it eight formative years, then peace took it away.
    // A person whose entire self WAS a role holds onto the one thing that still needs
    // her and cannot stop. So "I put that one back together four times" is not
    // motherhood - it is the last job she has, being taken from her again.
    //
    // 🔴 When the rival is BLADE she is arguing with her own father and neither of
    // them knows (docs/59 §1). Do not hint. See the matching note in blade_voice.js.
    // ═══════════════════════════════════════════════════════════════════════
    // [CLAUDE-DRAFT] wall/warn_wave
    // ⭐ THE TELL (docs/50). She is not pleased - she is frightened FOR you, which is
    // the same information delivered as dread instead of appetite.
    warn_wave: [
      'Something is awake down there and it has noticed you.',
      'Get your back to a wall. Please. Now.',
      'They are coming. I cannot stop this one.',
      'Do not run deeper. Whatever you do, not deeper.',
    ],

    argue_accuse: [
      'Your champion keeps hurting mine, they keep murdering mine!',
      'Do you know what they look like when they come back? Do you ever look?',
      'I put that one back together four times. Four.',
      'You let yours do this. You could have called them off and you did not.',
    ],
    argue_answer: [
      'Mine has never touched yours. Mine stays home.',
      'You say that as though I started it.',
      'I do not send them anywhere. That is the difference between us.',
    ],
    argue_threat: [
      'You will regret your words, warrior.',
      'Then I will stop asking, and you will not enjoy what comes after.',
      'I have been very patient. Ask anyone who is left.',
    ],
    argue_refuse: [
      'No. Not this time.',
      'You may have that opinion. You may not have my champion.',
      'I am not going to argue with you. I am going to do something about it.',
    ],
    argue_unanswered: [
      'Nothing. It never answers. It just watches them bleed and calls it weather.',
      'Say something. Say anything. ...No. Of course not.',
      'It does not even look up. That is what you are all like, underneath.',
    ],

    // ⭐ THE WARNING (docs/49 §2). ETHAN'S WRITING, 2026-08-16.
    //
    // She says RUN, and offers to stand in front of you. Blade's equivalent says
    // win and offers nothing; Salvage's says you are allowed to leave. Three gods,
    // three relationships - never edit this pool toward either of theirs.
    //
    // ⚠️ {rival} WAS HARDCODED. He wrote "The champion of the blade comes for you",
    // which is right until Salvage sends somebody and the Spider names the wrong
    // god. Substituted through sayAbout, the same mechanism the Mark already uses
    // for {target}. No other word changed.
    //
    // 🔑 That she names the rival at all is characterisation: she has been watching
    // them. Blade's pool has no substitution because he does not care who it is.
    warn_incoming: [
      'The champion of {rival} comes for you. Run!',
      'I will hold them off, you get to safety.',
      'They will regret what they have sown.',
    ],
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FRAGS - the combinatorial layer.  opens x closes
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE LAYER SHE WAS MISSING. Ethan, 2026-08-15, having read Blade's files:
  // "they have so so much more in them that she doesn't have. that should be the
  // baseline."
  //
  // He was right, and the gap was one whole mechanism rather than a word count:
  // Blade had 796 possible lines to her 105, and 616 of his came from HERE. She
  // was using only registerLines() - whole lines, no recombination - so every pool
  // she had was as deep as the number of sentences typed into it.
  //
  // ⚠️ THE CONSTRAINT: voice.js joins `open + ' ' + close`, picking each half
  // INDEPENDENTLY. Every close must therefore read correctly after EVERY open in
  // its own pool. That is why hers are short and self-contained, and connected to
  // the opens emotionally rather than logically - which suits her, because she
  // does not argue a point. She just keeps talking to you.
  // ⚠️ THE on_blade / on_salvage / on_forge / on_art POOLS WERE REMOVED HERE.
  // They held Ethan's verdicts on the other four as WHOLE lines, and nothing in the
  // codebase ever read them - a dead pool is the dialogue version of a gate with no
  // live consumer. The same writing now lives in FRAGS below under the tag names
  // Blade already uses (blade/salvage/forge/art), which ARE consumed, and gains a
  // second half in the bargain.
  var FRAGS = {
    lore: {
      opens: [
        "This land is an old one. A nameless one.",
        "The gods have never understood us.",
        "There were once gods. Now we are shadows.",
        "The church came first. Then your gods. Then the quiet.",
        "Everything here was somebody's home, once.",
        "Five of us hold what is left, and not one of us agreed to it.",
        "The world broke long before you arrived in it.",
        "Champions have knelt on this ground for a thousand years.",
        "The dead outnumber the living here, and they are better company.",
        "Nobody chose to be what they are. Not one of us.",
        "There is a rift under everything. You can feel it if you stand still.",
        "This place remembers more than it forgives.",
      ],
      closes: [
        "I have had a long time to think about it.",
        "Stay close while I tell you.",
        "You are the first person I have said that to.",
        "Do not repeat it to them.",
        "It does not matter now. You are here.",
        "I would rather talk about you.",
        "None of that reaches us. Not here.",
        "I stopped counting the years somewhere in the middle.",
        "You will understand it eventually. I am patient.",
        "It is only sad if you were there.",
        "That is enough of that.",
        "Come closer, love.",
      ],
    },
    blade: {
      opens: [
        "The Warrior is a plight on this land.",
        "He preaches strength and speed yet hides behind his veil.",
        "He speaks of champions. He has buried more than he has kept.",
        "The Warrior was somebody's soldier once. He does not say whose.",
        "Ask him about the veil. Watch him change the subject.",
        "He calls himself the Golden God. Gold is soft, love.",
      ],
      closes: [
        "He will not say it to my face.",
        "I knew him before the name.",
        "Do not take anything he offers you.",
        "He is not wrong about everything. Only about me.",
        "There is nothing behind it. I have looked.",
        "He would have made a good father to somebody.",
        "Let him have the sun. I have you.",
        "I am not jealous. I am not.",
      ],
    },
    salvage: {
      opens: [
        "I do not trust the Wolf in any manner.",
        "Perhaps once she was tolerable. Once.",
        "She will offer you a fair deal. That is how you will know.",
        "The Wolf keeps her promises. That is the trap, not the comfort.",
        "She has never once asked for something she needed.",
        "Everything she gives you, she has already priced.",
      ],
      closes: [
        "Say no. For me.",
        "I would take it back from her if you asked.",
        "She has nobody. She earned that.",
        "You do not need her. You have me.",
        "Do not be alone in a room with her.",
        "I am telling you because I want you safe.",
        "She smiles at everyone. Notice that.",
        "Promise me.",
      ],
    },
    forge: {
      opens: [
        "I have known the Goat for centuries.",
        "Centuries before he was what he was before. Across all transformations.",
        "He loved the goddess of death. Now? Now he's a shell.",
        "The Goat builds because he cannot sit still with himself.",
        "There is nothing left in him to talk to. I have tried.",
        "He was kind, before. That is the part people forget.",
      ],
      closes: [
        "Grief does that. I know what it does.",
        "Do not pity him where he can hear you.",
        "He will not remember this conversation either.",
        "Take what he makes. It is honest work.",
        "That could happen to anyone. It could happen to me.",
        "I would not let it happen to you.",
        "He does not know he is gone.",
        "Leave him to it, love.",
      ],
    },
    art: {
      opens: [
        "The Matriarch has led us gods for centuries.",
        "In all that time she has never granted me a place amongst them.",
        "What did I do wrong?",
        "I was not invited. I was never invited.",
        "She calls it a court. A court has a door.",
        "The Dreamwalker decides who counts. She always has.",
      ],
      closes: [
        "I stopped asking a long time ago.",
        "You would have said yes. I know you would.",
        "It does not matter. It does not.",
        "Do not sleep where she can find you.",
        "She has never once said my name.",
        "I am not asking for your sympathy. I am telling you.",
        "We do not need a court. We have a family.",
        "Let her keep it.",
      ],
    },
    push: {
      opens: [
        "You are growing. Good.",
        "I can feel your trepidation. Descend, champion.",
        "Grow, love. Hone yourself against what threatens us.",
        "There is more of you than there was last week.",
        "Do not stop. Not now, not when it is working.",
        "The others are getting stronger too. I watch them.",
        "You are close to something. I can feel it from here.",
        "Keep going. I will be here when you turn around.",
        "I need you to be strong. I am sorry, but I do.",
        "You have been careful. Be a little less careful.",
        "Every day you get better and every day I get worse at waiting.",
        "Go on. I am watching.",
      ],
      closes: [
        "Please.",
        "For me.",
        "Do not get hurt doing it.",
        "I will be right here.",
        "Come back and tell me about it.",
        "That is all I ask. It is not much.",
        "You are doing so well.",
        "I would do it myself if I could reach.",
        "Do not make me wait long.",
        "Stay whole.",
        "I mean it kindly.",
        "Then rest. Then again.",
      ],
    },
    idling: {
      opens: [
        "I am still here.",
        "You have not said anything for a while.",
        "I was thinking about you. I am usually thinking about you.",
        "The light is going. I like this part.",
        "Do you ever wonder what I look like?",
        "It is quiet where I am.",
        "I counted. It has been four days since you rested properly.",
        "There is a spider in the corner of wherever you are. That is not me. Probably.",
        "I do not need anything. I want to be clear about that.",
        "Say something. Anything is fine.",
        "You breathe differently when you are worried.",
        "I have been alone for a very long time and then you happened.",
      ],
      closes: [
        "That is all.",
        "Do not mind me.",
        "I will stop now.",
        "You do not have to answer.",
        "It is nice, this.",
        "I am not going anywhere.",
        "Take your time.",
        "Sorry. Go on.",
        "I like the sound of you moving about.",
        "Stay a moment longer.",
        "Anyway.",
        "I will be quiet now. I will try.",
      ],
    },

  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT - what she says about the situation you are standing in
  // ═══════════════════════════════════════════════════════════════════════════
  // idle.js picks a context (what you hold, where you are, whether you are
  // fighting, whose champion is beside you) and asks for that tag. A god with no
  // pool for the chosen context says NOTHING - silence is a legitimate answer.
  //
  // ⭐ near_<path> is where the pantheon becomes real to a player: she has an
  // opinion about the person standing next to you, and so does their god.
  var CONTEXT = {
    near_blade: [
      "His champion. Do not let them stand behind you.",
      "You can walk away from them. You can. Look at me.",
      "The Warrior's. Of course it is.",
      "Be polite. Be brief. Come back.",
    ],
    near_salvage: [
      "The Wolf's. Whatever they offer you, no.",
      "Count your things after they leave.",
      "They cannot help it. She chose them for that.",
    ],
    near_forge: [
      "The Goat's. That one is safe enough.",
      "They build things. I have never minded builders.",
      "Ask them for something. They like being asked.",
    ],
    near_art: [
      "Hers. The Matriarch's.",
      "Do not fall asleep near that one.",
      "Ask them if the court has a door. Watch their face.",
    ],
    near_wall: [
      "Another of mine. Oh.",
      "You are not the only one. You are still the one.",
      "Be kind to them. They are family, in a way.",
    ],
  }

  // 🚨 COUNTED AT SCRIPT-EVAL TIME, NOT INSIDE ServerEvents.loaded - wall_events.js
  // sorts BEFORE wall_voice.js, so asking the voice registry from its `loaded`
  // handler is a race it always loses. See tools/new_god.py for the full note.
  var WRITTEN = 0
  var POOL_COUNT = 0
  for (var _k in LINES) {
    if (!LINES.hasOwnProperty(_k)) continue
    POOL_COUNT++
    if (LINES[_k].length) WRITTEN++
  }
  for (var _f in FRAGS) {
    if (!FRAGS.hasOwnProperty(_f)) continue
    POOL_COUNT++
    if (FRAGS[_f].opens.length && FRAGS[_f].closes.length) WRITTEN++
  }
  for (var _c in CONTEXT) {
    if (!CONTEXT.hasOwnProperty(_c)) continue
    POOL_COUNT++
    if (CONTEXT[_c].length) WRITTEN++
  }

  // ⚠️ MERGE, DO NOT CLOBBER. This file sorts AFTER wall_events.js, so a plain
  // `VELDORA.wall = {...}` silently wipes anything that file published - which is
  // exactly what happened to `mood` on the first attempt at her dynamic chart. Same
  // idempotent-merge pattern the VELDORA namespace itself uses, and for the same
  // reason: relying on file NAMES for load order breaks months later during a rename.
  VELDORA.wall = VELDORA.wall || {}
  var _wallPub = {
    tier: tierOf,
    colour: COLOUR,
    written: WRITTEN,
    pools: POOL_COUNT,
    // Speak whatever this tier calls for. Returns false if there is nothing - which
    // is a legitimate answer, not a failure.
    speak: function (player, kind) {
      var t = tierOf(player)
      if (!t) return false
      if (!VELDORA.voice) return false
      return VELDORA.voice.say(player, GOD, t + '_' + kind)
    },
  }
  for (var _wk in _wallPub) {
    if (_wallPub.hasOwnProperty(_wk)) VELDORA.wall[_wk] = _wallPub[_wk]
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('wall').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var t = tierOf(p)
      var n = null
      try { if (VELDORA.counter) n = VELDORA.counter.get(p, GOD) } catch (e) { }
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7The Spider §8- counter §f' + (n === null ? 'UNREADABLE' : n) +
        '§8, tier §f' + (t || 'UNREADABLE')))
      return 1
    }))
  })

  // ⚠️ TAKE THE `event` PARAMETER. Omitting it makes `event.server` throw a
  // ReferenceError that KubeJS logs WITHOUT a level - invisible to `logq errors`
  // until that tool was repaired on 2026-08-15. docs/41 invariant #13.
  ServerEvents.loaded(function (event) {
    if (!VELDORA.voice) { console.error(TAG + 'voice.js missing'); return }
    VELDORA.voice.setColour(GOD, COLOUR)
    var n = 0, tags = 0
    for (var k in LINES) {
      if (!LINES.hasOwnProperty(k)) continue
      if (VELDORA.voice.registerLines(GOD, k, LINES[k])) { n += LINES[k].length; tags++ }
    }
    var combo = 0
    for (var fr in FRAGS) {
      if (!FRAGS.hasOwnProperty(fr)) continue
      if (VELDORA.voice.register(GOD, fr, FRAGS[fr].opens, FRAGS[fr].closes)) {
        combo += FRAGS[fr].opens.length * FRAGS[fr].closes.length
        tags++
      }
    }
    var ctxn = 0
    for (var c in CONTEXT) {
      if (!CONTEXT.hasOwnProperty(c)) continue
      if (VELDORA.voice.registerLines(GOD, c, CONTEXT[c])) { ctxn += CONTEXT[c].length; tags++ }
    }
    // 🚨 AN UNWRITTEN GOD IS LOUD, NOT SILENT. "loaded fine" and "has anything to
    // say" are different claims, and a subsystem configured on that produces nothing
    // is the failure mode this project keeps paying for.
    if (!n && !combo && !ctxn) {
      console.error(TAG + 'THE SPIDER HAS NO VOICE - every pool is empty')
    } else {
      console.info(TAG + 'The Spider speaks - ' + n + ' fixed + ' + ctxn +
        ' contextual + ' + combo + ' combinatorial, across ' + tags +
        ' tags. Tiers at ' + MEDIUM_AT + '/' + HIGH_AT + ' rage.')
    }
  })
})();
