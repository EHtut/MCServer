// salvage_voice.js - The Hound's lines + trust tiers.
//
// ⭐ ETHAN'S WRITING, 2026-08-15. Marked ★ in the source of this fill.
// He wrote the gifts, praise, deal, Harvest and idle pools, and the four
// relationship openers. He asked Claude to supply the per-event pools, the
// remaining idle fields, and the FRAGMENTS - all of that is FOR HIS REVIEW.
//
// (previous note, kept:)
// ⚠️ ETHAN WRITES THESE. Claude wrote a full set on 2026-08-15 and they were cut:
// "the lines you write are usually obviously ai generated. You only do code unless
// I ask you to bulk lines." The TAGS and the comments are the brief; the arrays are
// his. Same list as a fill-in sheet: docs/44-SALVAGE-LINES.md
//
// A placeholder line is worse than an empty pool - it anchors the writing and gets
// mistaken for content later. Empty is honest, and the boot log shouts about it.
//
// ⚠️ GENERATED SKELETON (tools/new_god.py). The STRUCTURE is correct and carries
// the invariants from docs/41 §3; the WRITING is not here yet. Every pool below is
// empty and marked TODO(ethan), and the boot log says so out loud.
//
// Trust is the COUNTER (counters.js). This god counts: harness - deals struck.
//
// Read docs/41-BUILDING-A-GOD.md before editing. Read docs/40-BLADE-THE-WARRIOR.md
// for a finished example of every pattern used here.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[salvage] '
  var GOD = 'salvage'
  var COLOUR = '§6§l'

  // Thresholds on: harness - deals struck.
  // ⚠️ A FIRST GUESS, and meant to be. Replace with a measured curve once there is
  // play data - do not argue about these numbers, measure them.
  var MEDIUM_AT = 5
  var HIGH_AT = 20

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
    // ── lifted out of salvage.js, 2026-08-15 · COMPLETED 2026-08-29 (F2) ────
    // These were string literals inside the trade code. They are the lines a player
    // hears MOST - "you're too poor even for me" fires far more often than any idle
    // line - and they were the nine Ethan could not edit without opening a script.
    //
    // ⭐ ALL TWELVE TRADE TAGS NOW ROUTE THROUGH HERE. Add an array under any of
    // these names and it overrides the literal immediately; leave it out and the
    // literal still fires, byte for byte. Nothing to un-break while writing.
    //
    //     open           her greeting, once per trade
    //     took_hunger    took_levels    took_sight      what she says as she takes it
    //     refused        you walked away
    //     deal_poor      you cannot pay
    //     no_stock       she has nothing to sell
    //     need_gun       you are not holding the thing you want fed
    //     unreadable     she cannot read your state
    //     kept_hunger    kept_levels    kept_sight      ⚠️ THE CHARGE DIDN'T STICK
    //
    // ⚠️ THOSE LAST THREE WERE ONE TAG (`kept_it`) UNTIL 2026-08-29, and filling it
    // would have been a trap: the three call sites say "You kept it", "You kept
    // them" and "Keep your eyes", so one shared pool would have answered a single
    // item with "You kept them. How." Split on the same hunger/levels/sight axis
    // TOOK already uses.
    //
    // 🔑 AND HER REGISTER WAS THE REAL FINDING. The nine carried NO contractions
    // while her own rules below mandate them - "You are having a bad night" from the
    // same god as "Something's coming. Count your ammo." That is what "her trade
    // voice and her collection voice are audibly different people" (`34` §3) meant,
    // and it was countable rather than a matter of taste. Fixed in salvage.js with
    // CONTRACTIONS ONLY - not one image changed, because authorship of those nine
    // predates the voice split and is unclear.
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐ THE FOUR ROWS HER CHART RATED AND SHE HAD NOTHING IN (docs/23 §VI.0).
    // [CLAUDE-DRAFT] salvage/bounty_offer · salvage/bounty_paid
    // [CLAUDE-DRAFT] salvage/sabotage_offer · salvage/favour_offer
    // [CLAUDE-DRAFT] salvage/favour_done · salvage/favour_told
    // Drafts, 2026-08-16 - Ethan authorised these, the loop being: he plays, and
    // anything that does not fit comes back as "here's a better line".
    //
    // Her rules, applied: SHORT · contractions · trade vocabulary (cost, worth,
    // margin, bad buy) · ⭐ NEVER MORE THAN THREE SENTENCES, she is the one god who
    // stops talking · jokes are deflection · never the words chosen, destiny or fate
    // except to take the piss out of them.
    // ═══════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════
    // THE ARGUMENT (docs/49 §4).
    //
    // [CLAUDE-DRAFT] salvage/argue_accuse · salvage/argue_answer
    // [CLAUDE-DRAFT] salvage/argue_threat · salvage/argue_refuse
    // [CLAUDE-DRAFT] salvage/argue_unanswered
    //
    // Her rules hold even here: <=3 sentences, contractions, trade vocabulary, and
    // she is the one who stops talking. The other four SERMONISE at each other -
    // that contrast is most of the joke, and she should read as the only adult in
    // a room full of gods. Her threat is the shortest thing she ever says.
    // ═══════════════════════════════════════════════════════════════════════
    // [CLAUDE-DRAFT] salvage/warn_wave
    // ⭐ THE TELL (docs/50). Flat, practical, <=3 sentences - and she is the only one
    // who mentions the exit, because she is the only one who thinks leaving counts.
    warn_wave: [
      "Something's coming. Count your ammo.",
      "That's a lot of feet. I'd find a corner.",
      "Incoming. You can still walk out of this one.",
      "Heads up. This is the part you paid me for.",
    ],

    argue_accuse: [
      "Your one keeps killing mine. I'd like that to stop being a habit.",
      "We're going to have a problem, and I hate problems. They cost.",
      "Mine's died to yours four times now. I counted. I always count.",
    ],
    argue_answer: [
      "Mine did what it was paid to. Take it up with the buyer.",
      "That's a fight, not a crime. You've met fights before.",
      "You want an apology? I don't stock them.",
    ],
    argue_threat: [
      "Fix it, or I will.",
      "I'm not going to shout about this. I'm just going to make it expensive.",
      "Last time I asked nicely. Note the tense.",
    ],
    argue_refuse: [
      "No.",
      "You've mistaken me for someone who bargains from behind.",
      "Try it. I'll be interested to see what it costs you.",
    ],
    argue_unanswered: [
      "Nothing. Right. That's an answer too, and I'll price it as one.",
      "Not even a word. Gods, the lot of you.",
      "Fine. I'll assume that's a yes and act accordingly.",
    ],

    // [CLAUDE-DRAFT] salvage/warn_incoming
    // ⭐ THE WARNING (docs/49 §2). DRAFT, 2026-08-18 - Ethan: "we will draft them
    // the same way i did for wall", the loop being that he plays and anything that
    // does not fit comes back as "here's a better line". Reasoning in docs/44 §0c.
    //
    // She INFORMS, and PERMITS YOU TO LEAVE. Wall shields you, Blade demands you
    // win, and she is the only one who treats walking away as a legitimate outcome.
    // Never edit this pool toward either of theirs - the contrast is the system.
    //
    // 🔑 HER OWN BRIEF SAYS THIS IS THE POOL THAT MATTERS MOST FOR HER: "because she
    // has never once oversold you anything, this is the only warning in the game
    // that lands." So it is flat and practical, never dramatic.
    //
    // Her rules: <=3 sentences EVERY line (she is the one god who stops talking) ·
    // contractions · the threat carried in trade vocabulary · never chosen/destiny/
    // fate. ⭐ Line 3 is the one no other god can say. ⭐ Line 6 is the one that does
    // not deflect - "jokes are deflection, always; when she is not joking, pay
    // attention" - so exactly one in six drops it, or the tell means nothing.
    warn_incoming: [
      "Someone's coming for you. {rival}'s champion, and they're not here to talk.",
      "Heads up - {rival} put money on your name. I'd take that seriously.",
      "You've got someone incoming. You can leave. Nobody else is going to tell you that's allowed.",
      "{rival}'s sent someone. Fight or go - the margin's yours to work out.",
      "Bad buy, this one. I'd walk.",
      "Someone's on their way. I'm not going to tell you you'll be fine.",
    ],

    // DUELS - a job, never a test. She has a buyer; that is the only reason.
    bounty_offer: [
      "Got a buyer for something with a pulse. You interested, or are we just talking?",
      "There's work. The kind with teeth. It pays and I'm not pretending otherwise.",
      "One job, one thing to kill. I'd tell you if it was a bad buy.",
      "You look like you need the money. I'd like to be wrong about that.",
      "This one's been sitting a while. Nobody's taken it. Draw your own conclusions.",
    ],
    bounty_paid: [
      "Clean. There's your cut.",
      "Paid. That's what paid looks like, in case anyone's told you different.",
      "Told you it was worth it. I don't say that often.",
      "Good. Go spend it on something stupid.",
    ],

    // ATTACKS - she'll make somebody's evening worse. Costs you, not them.
    sabotage_offer: [
      "I can make their next hour miserable. Costs you a meal. Your call.",
      "Want them slowed down? It's cheap and it's petty and I'm not judging.",
      "Say the word and they'll be walking like it's uphill. You'll feel it in your gut.",
      "Not permanent, not lethal, not free. Three things worth knowing up front.",
    ],

    // SUPPORT - the only event in the game that helps somebody else. Still priced.
    favour_offer: [
      "They're in a bad way. I can patch them up. Comes out of your pocket.",
      "You want to help them? Fine. It's your levels, not theirs.",
      "I'll do it. I'm not made of it, but I'll do it.",
      "Cheaper than a funeral. That's not a joke, that's the arithmetic.",
    ],
    favour_done: [
      "Done. Don't make a thing of it.",
      "They'll live. You paid for that. Remember it when they forget.",
      "Worst margin I've taken all week. Tell nobody.",
    ],
    // ⭐ What the OTHER player hears. She tells them somebody paid, not who.
    favour_told: [
      "Someone covered that for you. Ask them who - they'll be unbearable about it.",
      "You're welcome. Not from me. I only handled it.",
      "That was bought and paid for. Not by you.",
    ],

    // CONTRACTS - a commission. {target} is substituted.
    commission_offer: [
      "There's paper out on {target}. I'm not telling you to take it.",
      "{target}. Three days, standard terms. Want the number or not?",
      "Someone wants {target} off the board. It's a job. It shouldn't be personal.",
      "I'd take it, if I were still the sort who did. That's not advice.",
    ],
    commission_paid: [
      "Settled. Your rate just got better, for what that's worth.",
      "Paid, and the books are clean. I like clean books.",
      "That's the last of it. You did the thing, I paid the thing.",
    ],
    commission_lapsed: [
      "Expired. Happens. I'll not hold it against you.",
      "You let it run out. Honestly? Probably the right call.",
      "Gone cold. Don't apologise, I hate that.",
    ],

    // 🔴 THESE FOUR WERE EMPTY, AND AN EMPTY POOL IS SILENT, NOT SAFE. voice.say()
    // returns false on an empty pool, so seven call sites across salvage.js and
    // gun_ammo.js produced NOTHING - ask her for ammo bare-handed and she simply did
    // not answer. Unlike Blade's, these gate no event: they are the FAILURE paths,
    // which is exactly where a trader who says nothing reads as broken rather than
    // terse.
    //
    // ⭐ WRITTEN TOWARD THE REGISTER 7b ASKS FOR - the coaxing has to already contain
    // the appetite, so even her refusals sound like someone keeping a customer.
    // Each pool below carries its own marker, so all four land in docs/51.
    //
    // [CLAUDE-DRAFT] salvage/need_gun
    need_gun: [
      'Ammo for what? Your hands are empty.',
      'Bring me the gun and I will fill it. That is the order of operations.',
      'Hold something first. Then we can start owing each other.',
    ],
    // [CLAUDE-DRAFT] salvage/unreadable
    unreadable: [
      'I cannot read you. That is new, and I do not like new.',
      'Nothing is coming back off you. No hunger, no levels, no handle.',
      'Something is wrong with you, and I mean that professionally.',
    ],
    // [CLAUDE-DRAFT] salvage/no_stock
    no_stock: [
      'Nothing on the shelf. My supplier and I are going to have words.',
      'Empty. Not your fault, and not mine either, which is the annoying part.',
      'I have got nothing for you today. Do not tell anyone, it is bad for business.',
    ],
    // [CLAUDE-DRAFT] salvage/kept_it
    kept_it: [
      'Huh. You paid and it stayed with you. That is not supposed to happen.',
      'It did not take. You keep it. I will be thinking about that one.',
      'Well. That is yours, and so is the price. Let us both pretend that is normal.',
    ],
    low_gift: [
      "It's ok to reach out. I don't bite.",
      "I have things for you. Things you need.",
      "Come, come. Reach out more.",
      "You need what I have. Trust me.",
      "First one's easy. They always are.",
      "No, no — take it. We'll talk later.",
    ],
    medium_gift: [
      "You are a repeat customer. Good.",
      "I have an endless supply. There is no limit.",
      "Come and let me grant your desires.",
      "You cannot survive without me.",
      "You know the way to my counter by now.",
      "Held this back. For you.",
    ],
    high_gift: [
      "Approach as you have done before.",
      "Take the deal. Now!",
      "Why are you dawdling? You need more power!",
      "I'll give you true strength. Take my hand. Now.",
      "Do not think. Thinking is how customers leave.",
      "Everything I have. Say the word.",
    ],
    low_silence: [
      "You are doing well.",
      "See, I am treating you well.",
      "Don't hesitate. Quell your shaking.",
      "You're allowed to stare.",
      "Better. Much better.",
    ],
    medium_silence: [
      "I have shown you what you are with me.",
      "You are showing those other champions our power.",
      "Continue taking my hand and I will continue giving you everything you could ever desire.",
      "Let those other champions envy us.",
      "You are becoming profitable.",
    ],
    high_silence: [
      "See what you are with me? Imagine what you would be without. Pathetic.",
      "Take my hand, champion. You are redundant without me.",
      "The other champions envy us. They envy our wealth. Even that disgusting Forge god.",
      "Let them envy us.",
      "There is no version of you now that does not have my hand in it.",
      "I have never invested this heavily. Do not waste it.",
    ],
    deal_open: [
      "Come closer, champion. I have something for you.",
      "You look lost, friend. Shall I show you the way?",
      "Follow. I have wares.",
      "Take my hand, Gunner.",
      "Let's do a deal.",
    ],
    deal_done: [
      "Transaction complete.",
      "Ledger signed.",
      "Shake on it.",
      "You will not regret this.",
      "My favourite customer.",
    ],
    deal_refused: [
      "HAHAHA.",
      "My wares are not up to spec? Fine.",
      "I do love a difficult customer. I will be back.",
      "Fair trades.",
    ],
    deal_poor: [
      "You need more wealth in your life, Gunner.",
      "I will lower my deals. Only for you.",
      "Hm.",
    ],
    ev_credit: [
      "Pay me another day. I am generous like that.",
      "No coin now. We'll call it an arrangement.",
      "Take it on account, Gunner. I keep very good records.",
    ],
    ev_collect: [
      "The arrangement, champion. You remember the arrangement.",
      "I said another day. It is another day.",
      "Nothing unpleasant. Just the ledger.",
    ],
    ev_sample: [
      "A taste. On me.",
      "No charge. Note that I said no charge.",
      "Try it. Then try being without it.",
    ],
    ev_markup: [
      "Strangers pay more. That is not personal, it is arithmetic.",
      "My price for you today is my price for anyone. Change that.",
      "You could be paying less. You know how.",
    ],
    ev_tipoff: [
      "Free, this one. Do not get used to it.",
      "A gift of information. The cheapest thing I sell.",
      "You did not hear this from me. You did.",
    ],
    ev_insurance: [
      "You die often, Gunner. I can make that cheaper.",
      "Pay a little now. Bleed a little less later.",
      "Consider it a policy. I do honour policies.",
    ],
    ev_insurance_paid: [
      "Told you it would hurt less.",
      "The policy holds. I always honour a policy.",
      "See? Worth every drop.",
    ],
    harvest_won: [
      "Interesting. I lost.",
      "How unexpected.",
      "Truly.",
    ],
    harvest_lost: [
      "Hm.",
      "Seems your debt has been paid.",
      "Well. For now, at least.",
    ],
    combat: [
      "Shoot it. That is what it is for.",
      "Two shells, Gunner. Make them count.",
      "You are low. Low is a thing I sell a fix for.",
      "Do not die owing me.",
    ],
    hold_weapon: [
      "That thing eats. I am the only one selling.",
      "Loaded is expensive. Empty is fatal. Choose.",
      "A fine piece. I remember selling it.",
    ],
    hold_food: [
      "You could give me that. I would give you something better.",
      "Eat it or trade it. Both end well for me.",
    ],
    returned: [
      "There you are. I had almost written you off.",
      "I kept the account open. Sentimental of me.",
      "Back again. They always come back.",
    ],
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FRAGS - the combinatorial layer.  opens x closes
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️ voice.js joins `open + ' ' + close` and picks each half INDEPENDENTLY, so
  // every close must read after EVERY open in its pool. Hers get away with more
  // than most: a dealer's second sentence is usually a deflection, and a deflection
  // fits after anything.
  var FRAGS = {
    lore: {
      opens: [
        "This world runs on need. Always has.",
        "Everyone here is paying somebody.",
        "The gods do not trade. That is their whole problem.",
        "I have been doing this for centuries, Gunner.",
        "There was a city once, and it was gold, or near enough.",
        "Nothing in this land is free. The others simply hide the invoice.",
        "You are not the first champion to take my hand.",
        "The fracture cost everybody something. I am still counting mine.",
        "Champions come and go. The arrangement stays.",
        "The court decided what we would all become. Nobody asked.",
        "Wealth outlived the people who made it. It usually does.",
        "I remember when the church still thought it was winning.",
      ],
      closes: [
        "That is not a complaint. It is a business model.",
        "I am the honest one. Consider that.",
        "You'll see it eventually.",
        "Anyway. What do you need?",
        "Do not quote me.",
        "It is only sad if you were there.",
        "I have made my peace. Handsomely.",
        "That is between us.",
        "Ask me again when you can afford the answer.",
        "History is unpaid accounts, Gunner.",
        "None of it changes the rate.",
        "Enough of that.",
      ],
    },
    push: {
      opens: [
        "You could be carrying more than that.",
        "There is better out there, and you know where I am.",
        "Deeper pays. I do not set the rates, I only quote them.",
        "You are leaving value on the floor down there.",
        "Come and see me before you go. Not after.",
        "That gun of yours is thirsty.",
        "Somebody will find it first. Might as well be you.",
        "You will want to be holding something when it finds you.",
        "The dark is not going to loot itself.",
        "Every day you do not descend, you get poorer.",
        "There is a version of you with better equipment. Go and be him.",
        "I have stock. You have nothing. Do the arithmetic.",
      ],
      closes: [
        "Just a thought.",
        "No pressure. There is never any pressure.",
        "I will be here.",
        "Mind how you go.",
        "Come back in one piece. Preferably.",
        "You know where to find me.",
        "Take your time. I have plenty.",
        "That is all I am saying.",
        "Off you go, Gunner.",
        "And do not die owing me.",
        "I will keep the counter warm.",
        "We will settle after.",
      ],
    },
    idling: {
      opens: [
        "Quiet one today.",
        "You have been staring at that a while.",
        "I do not sleep either. Occupational.",
        "Funny thing about being needed. You are never lonely.",
        "I could tell you what you are worth. You would not enjoy the precision.",
        "Everyone has a price. Yours has moved twice this week.",
        "I keep a list. You are on it. Fondly.",
        "There is a version of you that never met me. He is doing worse.",
        "Go on, ask me for something. I am bored.",
        "I have been counting. Not of anything. Just counting.",
        "Do you ever wonder what I look like?",
        "Nobody wants anything yet. I like this part.",
      ],
      closes: [
        "Anyway.",
        "Where was I.",
        "Never mind.",
        "Forget I said anything.",
        "It will come to me.",
        "That is the trade talking.",
        "Ignore me, friend.",
        "Right.",
        "Do not read into it.",
        "We will call that one free.",
        "Pretend I said something useful.",
        "Back to business.",
      ],
    },
    // ⭐ REBUILT 2026-08-15 FROM THE ACTUAL MOD GUIDES, and deliberately naming
    // no mod, no menu and no item id. A god does not know what a thing is called
    // in a wiki; it knows there is a shape you draw and something answers. If the
    // progression cannot survive being spoken by somebody who never read the
    // guide, we did not understand it. FOR ETHAN'S REVIEW.
    guidance: {
      opens: [
        "You will not make a gun, Gunner. Nobody makes them any more. You find one and you feed it forever.",
        "The feeding is the business. That is where I come in.",
        "Rounds are built on a bench, not pulled out of the ground.",
        "The wrong round does nothing at all. Not a misfire - nothing.",
        "Match the round to the piece. Every piece takes one kind and only one.",
        "A short double takes two. Two. Count them before you need to.",
        "Powder and iron come off the things you kill. Deeper things carry better powder.",
        "You can pay me in hunger, in levels, or in sight. Your choice, always.",
      ],
      closes: [
        "That is free advice. Note the word.",
        "I would not tell a stranger that.",
        "Do with it what you like.",
        "You will work out the rest.",
        "Come and see me when you do.",
        "There is more where that came from.",
        "Write it down, Gunner.",
        "You are welcome.",
      ],
    },
    blade: {
      opens: [
        "The Warrior needs our deals even if he scorns us.",
        "Follow their champion. Make them owe you.",
        "He buries his champions. I keep mine in credit.",
        "War is the only god here who thinks he is above a transaction.",
      ],
      closes: [
        "Nothing personal. We simply want different things from you.",
        "He would say the same about me, and he would be right.",
        "Debt travels further than loyalty.",
        "I would never say that to his face. I say it to yours.",
      ],
    },
    wall: {
      opens: [
        "I do not dislike the Spider as the other gods do.",
        "I simply find her annoying. She rejects my deals and has no sense of profit. Shame.",
        "She wants to be owed nothing and owned everything.",
        "That one has never once asked for a fair price.",
      ],
      closes: [
        "At least I tell you there is a bill.",
        "I would rather be owed than owned.",
        "No head for margins. None at all.",
        "She would say I am the dangerous one.",
      ],
    },
    art: {
      opens: [
        "I despise the Matriarch.",
        "She claims to lead the court yet does nothing but hide in her words.",
        "No deals. Just orders. Disgusting.",
        "She has never needed a thing in her life.",
      ],
      closes: [
        "An order is a deal where only one side profits.",
        "I have never had her custom. I never will.",
        "That is why she is up there and I am down here with you.",
        "Careful what you agree to while you are asleep.",
      ],
    },
    forge: {
      opens: [
        "The Goat claims to profit from the world yet he does so without the same level of guile we do.",
        "What is the point of a machine that digs ore, when its destination is a pit?",
        "He builds because stopping would mean noticing.",
        "There is nothing left in that one to negotiate with.",
      ],
      closes: [
        "Volume without margin. Pitiful.",
        "Bad for him. Worse for business.",
        "Take what he makes. It is honest work, which is his whole failing.",
        "I stopped taking his money years ago.",
      ],
    },
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT - what she says about where you are standing
  // ═══════════════════════════════════════════════════════════════════════════
  var CONTEXT = {
    loc_above: [
      "Wealth. Profit. Currency. It is the only thing that matters in this world.",
      "The other champions call us greedy. They aren't exactly wrong.",
      "The gods of this world, my folk. They don't understand what we do.",
      "Everything above ground is somebody's inventory.",
      "Daylight is bad for margins.",
    ],
    loc_below: [
      "The realm of death. It is said there is a goddess down here.",
      "Cut down the minions of death, they hold the wealth you need.",
      "Scan the walls, there are gems about.",
      "Now we are somewhere worth being.",
      "Everything down here is worth something to somebody.",
    ],
    rare_loc_above: [
      "The Goat does not understand us. He never will. He is blinded by centuries of rage and anger. How he became the annoyance that he is? I have no idea.",
      "The Matriarch rules the court, but it was once said she ruled the entire land. Take from that what you will.",
      "I lived in a city once. It was gold, or near enough. It is not there now.",
      "There is a version of me that would have liked you honestly. She is not the one talking.",
    ],
    rare_loc_below: [
      "The realm of the goddess. I have never met her. I know some of the others are... close... to her. She is of no interest.",
      "It is said the generals of the goddess of death lurk the depths. They are terrible traders. I'd recommend not attempting a barter.",
      "Something down here knew my name before I had one. I do not come this far.",
    ],
    near_blade: [
      "The champion of the Warrior. I wouldn't recommend talking to him. He feels very... boring.",
      "This champion gives me a headache. Why are you around him?",
      "His. You can tell by the walk. Ask what it cost them.",
    ],
    near_wall: [
      "The Spider's lover... gross.",
      "I'd honestly recommend you attempt a barter, but how much can you get out of one who stocks their pockets with dead things?",
      "That one is owned, not employed. There is a difference.",
    ],
    // 🔴 TWO POOLS SHE DID NOT HAVE (added 2026-08-23). idle.js: "a god with no pool
    // for the chosen context says NOTHING" - so a Salvage champion standing next to
    // Kayer's or Milantros's heard silence. With forge about to open that is two live
    // gaps, not one.
    //
    // ⚠️ HER OTHER near_ POOLS ARE ETHAN'S. These two are mine and marked as such, so
    // they land in docs/51 for his pass rather than quietly passing as his voice.
    // [CLAUDE-DRAFT] salvage/near_art · salvage/near_forge
    //
    // ⭐ near_art: Kayer has no quarrel with her - the only god she has none with
    // (art_voice.js near_salvage). It runs both ways, and it is a professional
    // courtesy between two people who lie for a living in opposite directions.
    near_art: [
      "That one belongs to the cold woman. Be polite. Be brief.",
      "Her patron and I have an understanding. It is mostly that we stay out of each other's ledgers.",
      "She never haggles. That should worry you more than haggling.",
    ],
    // ⭐⭐ near_forge: MILANTROS GIVES THINGS AWAY FOR NOTHING (docs/56). To the one god
    // in the pantheon who runs on debt, that is not charity, it is a competitor
    // destroying the price of everything. The funniest relationship available and it
    // costs three lines.
    near_forge: [
      "That one gets given things. Free. I have opinions about it.",
      "The Goat is ruining the market and does not know what a market is.",
      "Ask them what they paid. Watch them not understand the question.",
    ],
    near_salvage: [
      "Ah. A colleague.",
      "Two of mine in one place. I do well.",
      "Do not compare your rates. It never ends pleasantly.",
    ],
  }

  // 🚨 COUNTED AT SCRIPT-EVAL TIME, NOT INSIDE ServerEvents.loaded.
  //
  // <god>_events.js has to know whether this god has a voice before it registers
  // anything - and BOTH files do their work in `loaded`, which fires in SCRIPT LOAD
  // ORDER. `<god>_events.js` sorts before `<god>_voice.js`, so the events file asked
  // the voice registry a question the voice file had not answered yet, and every god
  // booted HELD while simultaneously reporting all pools written.
  //
  // Publishing the count at eval time removes the race entirely: this runs when the
  // file is READ, long before any loaded handler.
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

  VELDORA.salvage = {
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

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('salvage').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var t = tierOf(p)
      var n = null
      try { if (VELDORA.counter) n = VELDORA.counter.get(p, GOD) } catch (e) { }
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7The Hound §8- counter §f' + (n === null ? 'UNREADABLE' : n) +
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

    // ⭐⭐ THE CRASHOUT POOL. Fired by grudge.js when this god stops arguing and
    // actually STRIKES - the reprisal after a champion of theirs was killed. It is
    // the one message screen.js never refuses, so it had better be worth it.
    //
    // 🗊️ [CLAUDE-DRAFT] - PLACEHOLDER, Ethan's to write. The register: this is not
    // a threat made calmly, it is a god who has lost their composure in front of
    // somebody. Short. Present tense. Addressed to ONE person, because only the
    // killer ever sees it.
    //
    // ⚠️ Only the three gods who RETALIATE have one. Forge and Art never reach
    // this line at all, and their silence is a posture rather than a missing pool.
    if (typeof VELDORA.voice.registerLines === 'function') {
      VELDORA.voice.registerLines(GOD, 'crashout', [
        '[CLAUDE-DRAFT] Oh. Oh, that was a mistake.',
        '[CLAUDE-DRAFT] I was going to be kind to you. I have changed my mind.',
        '[CLAUDE-DRAFT] Everything has a price. You have not paid this one.',
      ])
    }

    // ⭐⭐ TOP RIGHT, LIKE A QUEST LOG. Ethan ruled it 2026-08-30 (E2a) after holding the
    // question open: *"Salvage speaks top-right, like a quest log."*
    //
    // 🔑 AND IT CHARACTERISES HER BETTER THAN THE ALTERNATIVE DID. The other four gods
    // take the middle of your screen because they are addressing you and expect to be
    // looked at. She sits where the game puts its BOOKKEEPING - offers, objectives, the
    // things you get round to. That is exactly her: a standing offer in the corner of
    // your eye that never once demands you turn your head.
    //
    // ⚠️ SO SHE IS THE ONE GOD YOU CAN IGNORE, and that is the design rather than a
    // weakness of it. Blade talks down from the top, Art plants herself dead centre,
    // Wall arrives wherever you were not looking. Salvage waits. Ignoring her costs
    // nothing right up until it costs everything, which is the whole shape of a deal.
    //
    // 🔴 y IS POSITIVE HERE. TOP_RIGHT anchors at the top and y grows DOWNWARD (D-123),
    // so this pushes DOWN and clear of the vanilla effect icons that live in that corner.
    // A negative y would put her off the top of the screen - the sign error that cost a
    // whole evening once already.
    if (typeof VELDORA.voice.setStyle === 'function') {
      VELDORA.voice.setStyle(GOD, {
        anchor: 'TOP_RIGHT',
        y: 30,

        // ⚠️ Pulled in off the edge. At x:0 a long line runs to the screen border and
        // the last characters sit in the bezel of the reader's attention.
        x: -12,

        // Special Elite - a struck typewriter, uneven and inky. Ethan: *"Salvage -
        // Typed."* ⭐ It also happens to be the only font here that looks FILED, which
        // is the joke of putting her in the quest log.
        font: 'veldora:salvage',

        // 🔑 SMALLER THAN THE OTHERS, deliberately. A quest-log entry is not a
        // proclamation. She is the only god not competing for the middle, so she does
        // not need the size that competition buys.
        size: 0.9,

        // She never trembles. Whatever else she is, she is composed - the offer is
        // always calm, because it is always in her favour.
        shake: false,

        // ⛔ NO `color`. Colour is emphasis now, not identity (voice.js overlayColour,
        // Ethan 2026-08-30). Her font and her corner say who she is.
      })
    }
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
    if (!n && !combo && !ctxn) {
      console.error(TAG + 'THE HOUND HAS NO VOICE - every pool is empty')
    } else {
      console.info(TAG + 'The Hound speaks - ' + n + ' fixed + ' + ctxn +
        ' contextual + ' + combo + ' combinatorial, across ' + tags +
        ' tags. Harness tiers at ' + MEDIUM_AT + '/' + HIGH_AT + ' deals.')
    }
  })
})();
