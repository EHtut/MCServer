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
    // ── lifted out of salvage.js, 2026-08-15 ────────────────────────────────
    // These were string literals inside the trade code. They are the lines a player
    // hears MOST - "you are too poor even for me" fires far more often than any idle
    // line - and they were the nine Ethan could not edit without opening a script.
    // Empty here means the old literal is still used, so nothing breaks while he
    // writes. TODO(ethan).
    need_gun: [],       // you asked for ammo with nothing in your hand
    unreadable: [],     // she cannot read your hunger/levels. Something is wrong with you
    no_stock: [],       // the ammo mint failed. Her supplier let her down
    kept_it: [],        // you paid a price and it did not take. She is surprised
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
    guidance: {
      opens: [
        "TaCZ guns want the right calibre. The wrong ammo does nothing at all.",
        "A double barrel holds two. That is the entire lesson.",
        "Your kills pay in gunpowder and iron. Deeper pays better.",
        "Ammo is the bottleneck. It was always going to be the bottleneck.",
        "You can pay me in hunger, in levels, or in sight. Your choice.",
        "Everything I take is something you were carrying anyway.",
      ],
      closes: [
        "That is free advice. Note the word.",
        "I would not tell a stranger that.",
        "Do with it what you like.",
        "You will work out the rest.",
        "Come and see me when you do.",
        "There is more where that came from.",
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
