// blade_voice.js - THE WARRIOR'S LINES + his trust tiers.  docs/40
//
// The first god to get a real voice. Content written 2026-08-15; the grammar and
// the tiers are docs/40 PART 2 and PART 4.
//
// ── ⚠️ REWRITTEN 2026-08-15. THE FIRST DRAFT HAD THE WRONG CHARACTER ────────
// Ethan, reading it: "my only issue with the blade is he's condescending and he puts
// you down... he is a complicated character because he wants the character to thrive
// but he's tough."
//
// The first brief said "contemptuous, disappointed constantly", so the writing came
// back contemptuous AT the champion - "Bread, so you last long enough to fail
// properly", "Go. Disappoint me somewhere with witnesses." That is a bully.
//
// He is a DRILL SERGEANT: the edge is real and it is pointed at the champion's
// weakness, never at the champion. He is INVESTED. Every hard word exists to make
// them stronger, and he is impatient to see them try again rather than pleased when
// they fail.
//
// And the register MOVES with trust: harsh at low, grudging at medium, and at high
// he opens up - praising DISCREETLY, obliquely, never outright. "A leader you follow
// despite the edge." He must never be actively encouraging; the warmth is in what he
// does not say, and in the fact that he says anything at all.
//
// ── TRUST INVERTS, AND THAT IS THE CHARACTER ─────────────────────────────────
// He gives MOST at LOW trust - the god of war arms the weak so they can fight -
// then stops helping and starts testing. Generosity is contempt; danger is
// respect. By HIGH he gives almost nothing, because by then YOU are the weapon,
// and the closest he comes to approval is refusing to say anything at all.
//
// Trust is the COUNTER (counters.js), and his counter is ENEMIES SLAIN.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[blade] '
  var GOD = 'blade'

  // Thresholds on enemies slain. FIRST GUESS - Lehykt walks blade and the counter
  // is already running, so these get replaced by a measured curve rather than
  // argued about. docs/40 §5.3.
  var MEDIUM_AT = 50
  var HIGH_AT = 200

  function tierOf(player) {
    var n = null
    try { if (VELDORA.counter) n = VELDORA.counter.get(player, GOD) } catch (e) { }
    if (n === null) return null            // unreadable is NOT "low" - say nothing
    if (n >= HIGH_AT) return 'high'
    if (n >= MEDIUM_AT) return 'medium'
    return 'low'
  }

  // ── the lines ──────────────────────────────────────────────────────────────
  var LINES = {
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐ THE THREE ROWS THE TAXONOMY FOUND EMPTY (docs/23 §VI.0, built 2026-08-16)
    //
    // 🔴 THESE SAT EMPTY FOR EIGHT DAYS AND KEPT FOUR REGISTERED EVENTS OFF THE
    // SERVER. harden, burden, wager and contract each open with
    // `if (!hasVoice(...)) return mute(...)`, so an unwritten pool here is not a
    // cosmetic gap - it is four of Blade's nineteen events silently declining to
    // happen. The gate is still the right design (an event that runs mute is worse
    // than one that waits); the pools were simply never filled.
    //
    // ⭐ FILLED 2026-08-24 AS DRAFTS, against the writing sheets in
    // `docs/45-BLADE-LINES.md` - line counts and voice constraints taken from there
    // rather than invented. Every one is marked [CLAUDE-DRAFT] and appears in
    // `docs/51` for Ethan's pass.
    // ═══════════════════════════════════════════════════════════════════════
    // [CLAUDE-DRAFT] blade/harden
    // Resistance II AND Weakness together, 3 min, forced. Hard to kill and slow to
    // kill, so the fight has to LAST - his thesis as a status effect.
    harden: [
      'Harder to kill. Slower to kill. Now it lasts.',
      'I have made this take a while. Do not thank me.',
      'You will not win quickly. That is the point of it.',
      'Endure. Winning fast teaches you nothing worth keeping.',
      'Stand up longer than you want to.',
    ],
    // [CLAUDE-DRAFT] blade/burden
    // Slowness II, 90s, forced. A handicap, not a gift. 🚨 He does NOT explain
    // himself here - the sheet is explicit that explaining is stage two.
    burden: [
      'Slow. Deal with it.',
      'Carry it.',
      'You do not get to leave this one.',
      'No. Stay where you are.',
    ],
    // [CLAUDE-DRAFT] blade/wager_offer
    // He OFFERS one strong opponent - iron/steel/diamond by tier, because a choice
    // always pays. He is not selling it and he will not repeat it.
    wager_offer: [
      'One opponent. Strong. Yes or no.',
      'I have something worth fighting. Say the word or do not.',
      'There is a fight here if you want it. I will not offer twice.',
      'Something better than what you have been killing. Your call.',
    ],
    // [CLAUDE-DRAFT] blade/wager_won
    // 🚨 PAYING IS NOT PRAISING - `high_silence` already owns approval. This is a
    // debt settled, which is a colder thing.
    wager_won: [
      'You killed it. Take the payment.',
      'Settled. That is all this is.',
      'Yours. I said it would pay, and it pays.',
      'Debt closed. Do not read anything into it.',
    ],
    // [CLAUDE-DRAFT] blade/wager_declined
    // 🚨 NOT FLEEING. `duel_fled` is contempt for running; HE ASKED this time, and
    // refusing an offer is allowed. Whatever this is, it is not that.
    wager_declined: [
      'Then no.',
      'Fair. I asked.',
      'Another time, or not.',
    ],
    // [CLAUDE-DRAFT] blade/contract_offer
    // A kill order he ASKS for. {target} is substituted by runContract. The
    // difference from `mark_declare` is the whole point: that pool COMMANDS, this
    // one asks, and asking is the generous branch.
    contract_offer: [
      '{target} is still walking around. I would take it as a favour.',
      'Would you kill {target} for me. You may say no.',
      '{target}. I am asking, not ordering. The difference is yours to spend.',
      'I want {target} dead, and I am willing to ask for it.',
      'If you have the time: {target}. If not, say so and I will stop.',
    ],
    // [CLAUDE-DRAFT] blade/contract_paid
    // The only time in the game he settles a debt. `mark_success` covers the kill
    // itself; this is the PAYMENT, and he should like it less than you do.
    contract_paid: [
      'Paid. I do not enjoy owing anyone.',
      'Take it. The asking cost me more than the coin did.',
      'Settled. We are even, which I prefer to grateful.',
    ],

    // ⭐ REBUILT 2026-08-15 FROM THE ACTUAL MOD GUIDES, and deliberately naming
    // no mod, no menu and no item id. A god does not know what a thing is called
    // in a wiki; it knows there is a shape you draw and something answers. If the
    // progression cannot survive being spoken by somebody who never read the
    // guide, we did not understand it. FOR ETHAN'S REVIEW.
    guidance: [
      "Learn one weapon until it is boring. Then learn what it does that the others cannot.",
      "Every weapon swings its own way. A man who carries five has mastered none.",
      "You can roll out of a blow. Learn where that is bound before you need it.",
      "Nothing above the treeline will ever be worth killing. Go down.",
      "Deeper corpses pay better. Descend, Champion.",
      "Armour is borrowed. A weapon in your hand is not. Carry your power where it cannot be raided.",
      "Two hands on it. Even that will not be enough yet.",
      "Do not let short sightedness blind you. Master every blade.",
    ],
    low_gift: [
      "Take it. You're no use to me dead.",
      "Iron. Don't waste it standing still.",
      "This keeps you breathing. Use it well.",
      "Armour. Put it on before you bleed.",
      "You need this more than I need to give it.",
      "Take the blade. Earn the next one.",
      "Supplies. Spend them like they matter.",
      "You can't fight with empty hands. Here.",
      "This isn't strength. It's a chance to reach it.",
      "Gear up. I don't waste effort on corpses.",
    ],
    low_push: [
      "Move. The fight won't come to you.",
      "Enough standing. Fight.",
      "Find something and kill it.",
      "You are wasting time, Champion.",
      "There's no strength in waiting. Go.",
      "Something out there needs killing. Find it.",
      "You don't grow standing still. Move.",
      "Get out there and bleed for it.",
      "Fight now. Rest when you've earned it.",
      "The only way through this is through it. Go.",
    ],
    medium_gift: [
      "Not much. You don't need much anymore.",
      "Small, but you've earned that much.",
      "Take it. You're closer to not needing me.",
      "This, and no more. You're managing well enough.",
      "A little help. You've been managing without it.",
      "This is less charity now, more habit.",
      "Here. Call it a formality.",
      "You need this less than you did. Take it anyway.",
      "Small gift. Don't get comfortable.",
      "This should cover what's left of your weakness.",
    ],
    medium_test: [
      "This one's a test. Don't waste it.",
      "I'm watching this fight closely.",
      "Show me the last one wasn't luck.",
      "This is a measure, not a gift.",
      "I want to see how you handle this.",
      "Consider this an exam.",
      "Fight like I'm keeping score. I am.",
      "This is harder on purpose. Show me why.",
      "Let's see what you've actually learned.",
      "I'm paying attention now. Don't waste it.",
    ],
    high_test: [
      "Something worth your time, finally.",
      "Let's see what you're really made of.",
      "This might actually challenge you.",
      "I sent something dangerous. Good.",
      "Now we find your limit.",
      "This one could kill you. Good.",
      "Show me something I haven't seen.",
      "Finally, an opponent worth the name.",
      "Fly as high as you like. I'll be watching how you land.",
      "This is the kind of fight I remember.",
    ],
    // What he uses INSTEAD of praise. His highest praise is silence, so these are
    // the lines that acknowledge without ever approving.
    high_silence: [
      "Noted.",
      "That's not nothing.",
      "Few make it this far.",
      "I've stopped worrying about you.",
      "You didn't need me for that one.",
      "Keep that up and I'll run out of things to teach you.",
      "I don't say this often.",
      "You're becoming a problem for your enemies.",
      "I have seen worse stand where you are standing.",
      "That was competent. I will not say it twice.",
      "You are no longer the weakest thing I am watching.",
      "Hm.",
      "I would have done it differently. It worked anyway.",
      "There are fewer things above you than there were.",
      "You have stopped needing me to say anything.",
      "Good.",
    ],
    // Event announcements. 23 §2: every event announces itself, and the cost is
    // named before it is paid.
    icarus: [
      "For it was Icarus who flew too close to the sun. You will share his fate.",
      "You climbed. Of course you climbed.",
      "The sky was never yours. Come down, or be brought down.",
      "Height is a debt. They are here to collect it.",
      "Phaethon took the reins too. Look up.",
    ],
    hollow: [
      "These carry nothing. Kill them anyway.",
      "There is no reward in this. Fight.",
      "Nothing drops from these. That was never the point.",
      "You will gain nothing here but the doing of it.",
      "No spoils. Only the work.",
    ],
    broken_rung: [
      "The thing that killed you brought company.",
      "It killed you once. Correct that.",
      "You fell to this. Do not fall twice.",
      "Three of them now. Learn faster.",
      "It is waiting where you left it. So am I.",
    ],
    first_blood: [
      "The next thing you swing at, I am making harder.",
      "Pick your target carefully. I am about to improve it.",
      "Whatever you strike next will strike back properly.",
    ],
    first_blood_hit: [
      "There. Now it is worth killing.",
      "Now finish what you started.",
      "Better. Deal with it.",
    ],
    first_blood_late: [
      "You did not swing at anything. So I sent something to swing at you.",
      "A minute, and no fight in you. Here is one.",
      "You waited. Now you do not have to look.",
    ],
    duel: [
      "One of mine. No crowd, no help, no excuses.",
      "This one is not a wave. It is a single opponent, and it is better than you.",
      "Alone against one. That is the oldest test there is.",
    ],
    duel_fled: [
      "You ran.",
      "You left the ground. I will remember that longer than you will.",
      "Noted. You had one opponent and chose distance.",
    ],
    harvest_open: [
      "It is time. I am sending the best thing I have.",
      "Everything until now was preparation. This is the test.",
      "One opponent. Mine. Now we find out.",
    ],
    harvest_won: [
      "Predictable.",
      "I always knew I made the right choice.",
      "The goddess of death awaits below.",
      "Find her. End her.",
    ],
    harvest_offer: [
      "You could stay. I would not ask twice.",
      "There is a place here if you want it. Go, if you do not.",
      "Stay, or go. Either is yours now. That is the whole point.",
    ],
    harvest_lost: [
      "Predictable.",
      "You are not yet ready.",
    ],
    tithe: [
      "Your steel owes me. It will wear twice as fast until it has paid.",
      "A day of doubled wear. Fight anyway.",
      "Everything you swing is on loan. I am calling in the interest.",
    ],
    tithe_over: [
      "Your steel is your own again.",
      "The debt is paid. Look after it better.",
      "Done. It held, or it did not.",
    ],
    understudy: [
      "I made one of you. Let us see which is better.",
      "It has your health, your reach, your weapon. Nothing else.",
      "Fight yourself. Most champions lose.",
    ],
    watcher: [
      "I am going to stand here and watch. Do not mind me.",
      "I will not lift a hand. Everything else will lift two.",
      "Consider yourself observed. It will make the rest bolder.",
    ],
    watcher_gone: [
      "Enough. I have seen what I came to see.",
      "I am done watching.",
      "That will do. For now.",
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // THE ARGUMENT (docs/49 §4). Line 1 of answer and line 1 of refuse are
    // ETHAN'S, verbatim - and "Then let me." is the best line in the exchange.
    //
    // [CLAUDE-DRAFT] blade/argue_accuse · blade/argue_answer[keep1]
    // [CLAUDE-DRAFT] blade/argue_threat · blade/argue_refuse[keep1]
    // [CLAUDE-DRAFT] blade/argue_unanswered
    //
    // His register: contempt as DOCTRINE, not as insult. He is not being cruel to
    // annoy her, he genuinely believes a champion who can be killed repeatedly has
    // told you what it is. He never raises his voice and never apologises.
    //
    // 🔴🔴 AND WHEN THE RIVAL IS WALL, THIS IS A FATHER ARGUING WITH HIS DAUGHTER OVER
    // A CORPSE. docs/59 §1 - Blade is Gregor, Wall is Mera, she was brainwashed as an
    // infant to forget him, and neither of them can know. These pools do not name the
    // rival, so nothing here needs changing and nothing here should HINT.
    //
    // ⚠️ IF PER-RIVAL ARGUE POOLS ARE EVER BUILT (argue_accuse_wall etc), that exchange
    // is the single most loaded thing available in the game - and the rule stays the
    // same: total contempt, no recognition, the player works it out or nobody does.
    // ═══════════════════════════════════════════════════════════════════════
    // [CLAUDE-DRAFT] blade/warn_wave
    // ⭐ THE TELL (docs/50). Must NEVER share a pool with ordinary lines - the whole
    // value is that hearing it means something is coming. He is pleased about it.
    warn_wave: [
      'Something is coming up behind you. Good.',
      'Do you hear that? Stand where you are.',
      'Company. Earn the ground you are standing on.',
      'Here. Now we find out.',
    ],

    // 🔴 SPOKEN TWICE BY blade_events.js AND NEVER WRITTEN — found by the
    // completeness audit 2026-08-23. It fires when you DECLINE his Sharpen offer, or
    // let it time out, so the most common way to say no to Blade produced silence.
    //
    // ⭐ HIS REGISTER, AND IT IS THE EASY ONE: he does not mind. A refusal is
    // information, not an insult - he told you your ceiling and you declined to raise
    // it, which only confirms the ceiling. Salvage's refusals are strikes (3 and she
    // releases you); his are nothing at all, and that difference is characterising.
    // [CLAUDE-DRAFT] blade/idling
    idling: [
      'Then no. It costs me nothing.',
      'Suit yourself. The offer was the whole of my interest.',
      'Noted. I will not ask twice in a row.',
      'You will want it later. I may be busy later.',
      'As you like. Standing still is also a choice.',
    ],

    argue_accuse: [
      'Your champion has put mine in the dirt three times. I am beginning to take it personally.',
      'Call it off, or admit you enjoy this.',
      'You are wasting a good fighter on ambushes. That is what offends me.',
    ],
    argue_answer: [
      'So? That means they were weak.',
      'Then it should not have died. I fail to see the complaint.',
      'You are describing a fight. I do not know what you want from me.',
    ],
    argue_threat: [
      'Do it again and I stop being polite about it.',
      'I will take it out of yours. Slowly, and where it can be seen.',
      'You have one more. Spend it carefully.',
    ],
    argue_refuse: [
      'Then let me.',
      'I have been threatened by better and buried them.',
      'Do what you like. I will not pretend to be frightened.',
    ],
    argue_unanswered: [
      'Silence. From a god. What a waste of a throne.',
      'It says nothing, so it agrees with me. That is how I will take it.',
      'Answer me. ...No? Then I was right, and we are done.',
    ],

    // ⭐ THE WARNING (docs/49 §2). ETHAN'S WRITING, 2026-08-16 - fixed a typo
    // ("challege") and a comma splice, no words changed.
    //
    // He says WIN, and offers NOTHING. Wall's equivalent says run and offers to
    // stand in front of you; Salvage's says you are allowed to leave. Three gods,
    // three relationships, and the contrast IS the system - so this pool must never
    // be edited toward either of theirs.
    //
    // ⭐ NO {rival} SUBSTITUTION, deliberately. Wall names who is coming because she
    // has been watching them; he does not, because to him a challenger is a
    // challenger. The absence of the substitution is the characterisation.
    warn_incoming: [
      'A champion comes for you. Ensure you win.',
      'Seems a challenger approaches...',
      'A challenge, one you are fit for. Win.',
    ],

    // THE MARK. {target} is substituted with the rival champion's name.
    mark_declare: [
      '{target} fights with borrowed strength. Kill them within two days.',
      'Find {target}. End them before the sun sets twice.',
      '{target} serves a spider and calls it power. I want them dead.',
      'Two days. {target} does not see a third.',
      "Bring me {target}'s fall, not their excuses.",
      '{target} wears strength that is not theirs. Cut it off them.',
      'I despise {target}. You have two days to matter to me.',
      'Kill {target}. Do it before I forget I asked.',
    ],
    mark_success: [
      "Dead. As it should be.",
      "Good. One less parasite wearing someone else's strength.",
      "You did what was needed. Nothing more needs saying.",
      "It is done. I expected nothing less.",
      "The spider's champion falls. Unremarkable, as intended.",
      "Good.",
      "That is one fewer borrowed sword in this world.",
      "Clean. I have no notes.",
      "She will feel that. Let her.",
    ],
    // ⭐ He does NOT punish a refusal. He grumbles. That is the whole mechanic:
    // a god who punishes you for sparing a friend forces the fight and poisons a
    // four-player server; a god who merely grumbles leaves it a real choice.
    mark_ignored: [
      'You did not kill them. Of course you did not.',
      'The days passed. So did my interest.',
      'I asked one thing. You gave me nothing.',
      'Fine. Let the spider keep her borrowed strength.',
      'I will not punish you. I will simply expect less.',
      'You failed to matter today. Try not to make it a habit.',
      'The moment passed you by, as most do.',
      'Forget it. I already have.',
    ]
  }

  // -- COMBINATORIAL POOLS: one open + one close, joined within a tag --------
  //
  // PRONOUNS CORRECTED ON INTAKE. The writer made both the Hound and the
  // Nightmare 'he'; both are SHE (23 PART III), and one line had Blade referring
  // to himself in the third person. Voice errors survive review far more easily
  // than logic errors do - nothing throws when a god is misgendered.
  var FRAGS = {
      "lore": {
          "opens": [
              "This world was cursed before you were born.",
              "Five gods rule what is left of this place.",
              "Champions have kneeled on this ground for a thousand years.",
              "Every champion before you believed he was the last.",
              "This world has buried better than you.",
              "The gods do not agree on much.",
              "There were champions here before the curse had a name.",
              "The ground beneath you has swallowed a hundred like you.",
              "None of the five gods forgive.",
              "This world rewards nothing it has not first broken.",
              "The champions before you are dust now, all of them.",
              "The curse does not care whose fault it was."
          ],
          "closes": [
              "Their names did not survive the telling.",
              "That has never once been true.",
              "You are one more attempt among many.",
              "War is the only honest one among them.",
              "I was already old when it began.",
              "That does not make you interesting.",
              "The dust does not complain.",
              "You will learn this, or you will join them.",
              "That is the only mercy this place has ever offered.",
              "None of that concerns me.",
              "It has done worse to better champions.",
              "I have outlasted every one of them."
          ]
      },
      // ⭐⭐ AND HIS COLDNESS IS THE COST, NOT THE CHARACTER (docs/60 §1). The book
      // Gregor is "the most human of the entire undead cast" - kind, humble, warm, no
      // irony and no god-distance. That looks unrecoverable against the god of war
      // until you read his TWO CARDS:
      //
      //     GREGOR KAYER COURT   Companion . Friend . Brother   -> defined by PEOPLE
      //     GREGOR CROSS         Soldier . Veteran . General    -> defined by RANK
      //     "He goes from being known to being positioned."
      //
      // 🔑 Veldora's Blade is the SECOND card. The hardness is what is left when you
      // take the Court out of Gregor Kayer Court, and the player only ever meets the
      // general. The warmth survives as a mechanic instead: Ethan's own chart note,
      // "the warrior focuses on you and really only tests you" - he is the one god
      // whose entire attention is on the person in front of him.
      //
      // 🔴🔴 HE IS DESCRIBING HIS DAUGHTER. docs/59 §1.
      //
      // Blade is GREGOR (docs/40 §0). Wall is MERA - and per Ethan's book canon she is
      // Gregor and Marlynn's daughter, raised by him until Alison killed him and
      // BRAINWASHED her, erasing her father and installing himself as her maker.
      //
      // So this pool - written months before either of us knew - is a father calling
      // his own child's love an obsession and her devotion a weakness. Neither of them
      // can know: she was one or two years old and the memory was deleted.
      //
      // 🚨 DO NOT SOFTEN THESE LINES AND DO NOT ADD A HINT. The contempt has to be
      // total and unknowing or the whole thing collapses into foreshadowing. If it ever
      // surfaces it surfaces to the PLAYER, through a third party - never through
      // either of them noticing.
      //
      // ⭐ And docs/15 calls his contempt a temperament clash between a warrior and a
      // smotherer. It is not a temperament clash.
      "wall": {
          "opens": [
              "The spider spins her nests and calls it love.",
              "The Mother weeps for every champion she loses.",
              "Her web holds diligently, her champions less so.",
              "The spider's champions borrow their strength from her silk.",
              "She calls her obsession devotion.",
              "The Mother would drown this world in her mercy.",
              "Her champions fight with someone else's hands.",
              "The spider never lets a champion go."
          ],
          "closes": [
              "Weakness, dressed up as devotion.",
              "Love has never won a war.",
              "Strength borrowed is strength you do not own.",
              "Mercy is a debt she cannot stop paying.",
              "Her champions have never once stood alone.",
              "That is not strength. That is dependence.",
              "I have no patience for what she calls love.",
              "She mistakes attachment for power."
          ]
      },
      "salvage": {
          "opens": [
              "The dog barters where a blade would do.",
              "The Hound strikes another deal nobody asked for.",
              "Her champions hit harder than her trades ever will.",
              "The dog trades favours like they mean something.",
              "The Hound is loyal to a fault, and loud about it.",
              "Her champions do not need her deals to win.",
              "The dog collects debts nobody remembers owing.",
              "The Hound calls it diplomacy. I call it noise."
          ],
          "closes": [
              "Tolerable. Barely.",
              "A bargain never won a war.",
              "Her champions earn respect. She does not.",
              "That much, at least, I respect.",
              "Noise, mostly. But not nothing.",
              "Her bark carries further than her deals.",
              "Strength does not need a contract.",
              "Annoying. Her champions are not wrong to follow her."
          ]
      },
      "forge": {
          "opens": [
              "The Thief builds what your arm alone cannot.",
              "The engineer forges the war you fight.",
              "The Thief is tolerable. His work is not.",
              "No champion wins alone. The engineer sees to that.",
              "The forge burns for every battle you have yet to fight.",
              "The Thief demands cooperation, and he has earned the right to.",
              "His engines carry weight your sword cannot.",
              "The Thief builds glory. You still have to claim it."
          ],
          "closes": [
              "Respect that. Few of the five deserve it.",
              "Glory built alone is glory half-made.",
              "Work with him. That is not weakness.",
              "He is the engine. You are still the war.",
              "That much I do not dispute.",
              "Cooperation is not the same as dependence.",
              "Use it. Waste is the only sin here.",
              "He has earned that much from me."
          ]
      },
      "art": {
          "opens": [
              "The Matriarch speaks little and rules the most.",
              "Her realm is magic. Her opinions are few.",
              "Her hand moves. She rarely does.",
              "She leads five gods and argues with none of them.",
              "The Matriarch's silence says more than her voice.",
              "Magic answers to her. Little else does."
          ],
          "closes": [
              "Simple, and I have no complaint with simple.",
              "That is the only obedience I have, and it is enough.",
              "I have nothing to say about that. Neither does she.",
              "Neutral is not the same as absent.",
              "She does not need my opinion of her.",
              "That is her business, not mine."
          ]
      },
      "push": {
          "opens": [
              "Pick up the blade.",
              "Find something worth fighting.",
              "Strength does not arrive. You take it.",
              "Fight something. Anything.",
              "Bleed for it, or do not bother.",
              "Test yourself against something that can kill you.",
              "Grow, or get out of my sight.",
              "Chase the ones stronger than you.",
              "Icarus flew before you did. Fly anyway.",
              "Prove it with your hands, not your excuses.",
              "The strong do not wait to be told twice.",
              "You are not finished. Not close."
          ],
          "closes": [
              "That is the only prayer I answer.",
              "Nothing else earns my attention.",
              "Weakness is a choice you keep making.",
              "I will not ask you again.",
              "There is no version of this that waits.",
              "Comfort has killed more champions than I have.",
              "You do not get to rest yet.",
              "That is the only path I recognise.",
              "Strength or nothing. There is no middle.",
              "The sun does not wait for Phaethon either.",
              "Move, or move aside.",
              "I have watched better men choose worse."
          ]
      },
      "idling": {
        "opens": [
            "You've been standing there a while.",
            "Nothing's died by your hand today.",
            "I don't see a fight near you.",
            "That's a long time doing nothing.",
            "The arena's empty because you're not in it.",
            "Your blade hasn't moved in a while.",
            "You're still here.",
            "Something should be dying right now.",
            "This is not what strength looks like.",
            "You've gone quiet for too long."
        ],
        "closes": [
            "Go waste it on something that fights back.",
            "Stillness won't make you stronger.",
            "I didn't equip you to watch.",
            "Find something worth killing.",
            "You're wasting what you've got.",
            "Move before I lose interest.",
            "Something out there is waiting to test you.",
            "Go earn something.",
            "Every idle moment is one you don't get back.",
            "Get moving."
        ]
    }
  }

  // -- CONTEXTUAL IDLE POOLS -------------------------------------------------
  //
  // Selected by idle.js from what the champion is holding, where they are,
  // whether they are fighting, and who is standing next to them. Whole lines
  // rather than fragments: a contextual remark is one thought, and splitting it
  // would produce 'Technique over power. Get moving.'
  //
  // Register note: these are more FORMAL than the trust-tier lines. He declaims
  // about the world and instructs the champion - the same split the canon
  // arrival lines already had, where he is mythic when speaking of the world and
  // clipped when speaking to you.
  var CONTEXT = {
      "loc_above": [
          "The goddess below rules the underworld unchecked.",
          "You are growing. Good.",
          "I am not disappointed in your growth. There is still room to grow.",
          "I can feel your trepidation. Descend, champion.",
          "The Goat god and their champion are your path to sustenance. Lean on your allies.",
          "Be wary of the Wolf's deals, for one day she may offer you one. Deny her.",
          "The Matriarch has led the Court for centuries. Do not mistake authority for power.",
          "The spider. I despise that damnable god. She is but a step away from the evil we fight against."
      ],
      "loc_below": [
          "The minions of death swarm.",
          "Be on your guard. You will be tested.",
          "I want this clean. No mistakes. No retreat.",
          "Grow, champion. Hone your blade against those who threaten our lands above.",
          "She was banished down here for a reason, the goddess of death. We will remind her why."
      ],
      "rare_loc_above": [
          "This land is an old one. A nameless one.",
          "You have no memories of arrival. That is all right. Instead, focus on your blade.",
          "I had a name in life once. That was centuries ago.",
          "I am a prisoner here, like you. Know that we fight for the same cause.",
          "The Spider and her consort... they are the closest to my kind. I cannot help but feel attachment.",
          "What does the sun feel like on your skin? I barely remember.",
          "The Spider... Why can I hear her name?",
          "The goat, he has caused thousands of atrocities and yet he was deemed worthy of ascension.",
          "The Matriarch once led my kind. Once. Be wary of her champion."
      ],
      "near_salvage": [
          "The emissary of the wolf. Do not trust them.",
          "That one deals before they draw. Watch which they reach for first.",
          "Their might is respectable. Their patron is noise."
      ],
      "near_wall": [
          "The spider's underling. Keep distance from that one, lest they bore you.",
          "They fight with borrowed strength. Do not learn it from them.",
          "Mercy, dressed up as devotion. Walk on."
      ]
  }

  VELDORA.blade = {
    tier: tierOf,
    thresholds: { medium: MEDIUM_AT, high: HIGH_AT },
    // Speak whatever this tier calls for. Returns false if he has nothing - which
    // is a legitimate answer for him specifically, and callers must not substitute.
    speakTier: function (player, kind) {
      var t = tierOf(player)
      if (!t) return false
      return VELDORA.voice ? VELDORA.voice.say(player, GOD, t + '_' + kind) : false
    }
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    event.register(Commands.literal('blade').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var n = null
      try { if (VELDORA.counter) n = VELDORA.counter.get(p, GOD) } catch (e) { }
      var t = tierOf(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6The Warrior §8- slain §f' + (n === null ? '?' : n) +
        '§8, tier §f' + (t || 'UNREADABLE')))
      p.tell(Text.of('§8thresholds: medium at ' + MEDIUM_AT + ', high at ' + HIGH_AT))
      if (t) {
        p.tell(Text.of('§8he would say, at this tier:'))
        VELDORA.voice.say(p, GOD, t + (t === 'high' ? '_test' : '_gift'))
        VELDORA.voice.say(p, GOD, t === 'low' ? 'low_push' : (t === 'medium' ? 'medium_test' : 'high_silence'))
      }
      return 1
    }))
  })

  ServerEvents.loaded(function () {
    if (!VELDORA.pantheon) {
      console.error(TAG + 'pantheon.js missing - The Warrior has no mouth')
      return
    }

    // ⭐ The plumbing moved to pantheon.js; not one word he says moved with it.
    //
    // 🔴 HE DECLARES NO COLOUR, AND THAT IS DELIBERATELY LEFT AS IT WAS. Blade has
    // never called setColour - he silently inherits voice.js's DEFAULT_COLOUR, which
    // happens to be his red, so a change to that default would move him with nothing in
    // any log. The registrar now WARNS about it at boot. Fixing it is a one-line change
    // with its own baseline update, kept out of this refactor so that "nothing changed"
    // stays literally true here.
    VELDORA.pantheon.define(GOD, {
      label: 'The Warrior',
      lines: LINES,
      frags: FRAGS,
      context: CONTEXT,
      note: 'Tiers at ' + MEDIUM_AT + '/' + HIGH_AT + ' slain',
    // ⭐⭐ WHERE HE STANDS. Ethan, 2026-08-30: *"Blade - Upper middle of screen - He
    // talks down to you."*
    //
    // 🔑 THE POSITION IS THE CHARACTERISATION. He is not merely placed at the top; he
    // is placed ABOVE YOU, and every line he says arrives from over your head. Art sits
    // dead centre and blocks your view instead. Same mechanism, opposite meaning - so
    // this number is not a layout preference and should not be "tidied" to match anyone
    // else.
    //
    // ⚠️ y is POSITIVE here because the anchor is TOP. y grows downward: a TOP anchor
    // needs a positive y to come DOWN into view, a BOTTOM anchor needs a negative one
    // to lift UP into view. Getting that backwards renders the line perfectly, just
    // off the edge of the screen, with nothing in the log (D-123).
    // ⭐⭐ THE CRASHOUT POOL. Fired by grudge.js when this god stops arguing and
    // actually STRIKES - the reprisal after a champion of theirs was killed. It is
    // the one message screen.js never refuses, so it had better be worth it.
    //
    // 🗊️ [CLAUDE-DRAFT] - PLACEHOLDER, Ethan's to write. The register: not a
    // threat made calmly, but a god who has lost their composure in front of
    // somebody. Short. Present tense. Addressed to ONE person, because only the
    // killer ever sees it.
    //
    // ⚠️ Only the three gods who RETALIATE have one. Forge and Art never reach this
    // line at all, and their silence is a posture rather than a missing pool.
      crashout: [
        '[CLAUDE-DRAFT] You killed one of mine. Now you find out what that costs.',
        '[CLAUDE-DRAFT] I gave you a blade. I did not give you permission.',
        '[CLAUDE-DRAFT] Look at me. I want you to know it was me.',
      ],

      style: {
        anchor: 'TOP_CENTER',
        y: 40,

        // ⛔ NO `color`, AND IT IS NOW THE RULE RATHER THAN HIS EXCEPTION.
        //
        // He went white alone earlier on 2026-08-30 - the first god whose colour stopped
        // carrying identity once placement and font could do it. Later the same day
        // Ethan generalised it: *"God colors need to go away, color will only be used
        // for emphasis now."*
        //
        // 🔑 So the decision moved to voice.js `overlayColour`, which returns null and
        // lets the mod default. An explicit #FFFFFF here would be Blade opting IN to a
        // colour that happens to equal the default - a special case that only looks like
        // agreement, and drifts silently the moment the default moves.
        //
        // ⚠️ THE SCREEN ONLY, still. The chat copy keeps colourOf(GOD): chat has no
        // fonts, so colour is the only thing separating speakers in a scrolling record.

        // ⭐ A REAL FONT, AND NO CAXTON NEEDED. `font(String)` goes straight to vanilla
        // Style.withFont(ResourceLocation), so ANY font resource works.
        //
        // ⛔ The five fonts the MOD ships - kalam, roboto, minecrafter, norse, anton -
        // are a different path: ImmersiveFont.getLocation() checks isModLoaded("caxton")
        // and returns minecraft:font/default when it is absent. Caxton is not installed
        // anywhere in this pack, so naming one of those would silently render as vanilla
        // and look like nothing happened.
        //
        // ⭐ HIS OWN FONT. Cinzel - Roman inscriptional capitals, carved rather than
        // written. Ethan's brief: *"Blade - Straight, hard"*, and *"all fonts should
        // still be rustic"*. Built by tools/fetch_fonts.py into
        // pack/resourcepacks/veldora; SIL OFL, so it may ship with the pack.
        //
        // ⚠️ FONTS ARE CLIENT-SIDE. The server only NAMES this; a player without the
        // resource pack renders the vanilla default and nothing errors. "It works on
        // the server" is not a statement about anybody's screen.
        font: 'veldora:blade',
      },
    })
  })
})();
