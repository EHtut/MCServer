// salvage_voice.js - The Hound's lines + trust tiers.
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
    low_gift: [
      "Take it. We'll settle later.",
      "On the house. The first one always is.",
      "You'll want this. You don't know why yet.",
      "No charge, friend. I'm not counting.",
      "Here. I had it spare and you looked like you didn't.",
    ],
    medium_gift: [
      "You've earned better terms than you're getting.",
      "This is the good stuff. I don't hand it to everyone.",
      "Between us, I'd have asked more from somebody else.",
      "Take it. You're good for it.",
    ],
    high_gift: [
      "For you? Cost price. Less, if we're being honest, and we are.",
      "I keep the best of it back. You know who for.",
      "Nobody else gets this. That is not a figure of speech.",
      "You stopped being a customer a while ago.",
    ],
    low_silence: [
      "Well now.",
      "That's the way. Do it again.",
      "You're worth more than you were this morning.",
      "See? And you doubted the arrangement.",
    ],
    medium_silence: [
      "You're becoming an investment.",
      "I'd lend you real money on that.",
      "People are going to start asking who you deal with.",
      "That'll do nicely.",
    ],
    high_silence: [
      "I've stopped pricing you. There's no number left that fits.",
      "You could walk away from me now and be fine. I know that.",
      "Whatever you need. Whenever. Do not make me say it twice.",
      "I don't do this. Ask anyone. I don't do this.",
      "You are the best thing I ever put money on.",
    ],
    deal_open: [
      "Let's do a deal.",
      "You've got that look. The one that wants something.",
      "Come here. I've been saving something.",
      "Long day? I can take some of that off you.",
    ],
    deal_done: [
      "Pleasure doing business.",
      "There. Lighter already, aren't you.",
      "Don't count it now. Count it later.",
      "You won't feel that until tomorrow.",
      "See? Painless.",
      "Everyone says that afterwards.",
    ],
    deal_refused: [
      "Course. No hurry.",
      "It'll keep. So will I.",
      "Think on it. I'm not going anywhere.",
      "Suit yourself, friend.",
      "That's fine. That's absolutely fine.",
    ],
    deal_poor: [
      "You haven't got it. That's all right - you will.",
      "Come back when there's more of you.",
      "Nothing to take today. Shame.",
    ],
    harvest_won: [
      "Well. Look at you.",
      "Debt cleared. I hate a cleared debt.",
      "Go on then. Before I think of something else you owe me.",
    ],
    harvest_lost: [
      "Oh, friend.",
      "I did warn you. Didn't I warn you?",
      "Never mind. We'll put it on the tab.",
    ],
    combat: [
      "Shoot it. That's what it's for.",
      "Two shells. Make them count, or come and see me.",
      "You're low. I can fix low.",
    ],
    hold_weapon: [
      "That thing eats. I'm the only one selling.",
      "Keep it loaded. Loaded is expensive.",
    ],
    hold_food: [
      "You could give me that, you know. I'd give you something better.",
      "Eat it or trade it. Both work for me.",
    ],
    returned: [
      "There you are. I'd almost written you off.",
      "I kept your account open. Sentimental of me.",
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
        "Every god here took something from somebody to get where they are.",
        "The church had a ledger too. Theirs just called it faith.",
        "I was here before the rift and I'll be here after the interest clears.",
        "Somebody built the thing that broke this place. Somebody always does.",
        "This world runs on need, friend. Always has.",
        "Everyone here is paying somebody.",
        "The gods don't trade. That's their whole problem.",
        "There were more of us once. Fewer buyers, though.",
        "Nothing in this land is free. The others just hide the invoice.",
        "I've been doing this a very long time.",
        "The curse is just a debt nobody can service.",
        "You want to know what killed this place? Bad terms.",
        "Champions come and go. The arrangement stays.",
        "I remember when the church still thought it was winning.",
      ],
      closes: [
        "You'd have liked it. Probably.",
        "History's just unpaid accounts, friend.",
        "I only bring it up because you asked. You did ask.",
        "None of it changes the rate.",
        "That's not a complaint. It's a business model.",
        "I'm the honest one. Think about that.",
        "You'll see it eventually.",
        "Anyway. What do you need?",
        "Don't quote me.",
        "It's not sad if you're on the right side of it.",
        "I've made my peace. Handsomely.",
        "That's between us.",
      ],
    },
    blade: {
      opens: [
        "The Warrior doesn't deal. He requisitions.",
        "He'll tell you strength is free. Ask him what it cost the last one.",
        "War's the only god here who thinks he's above a transaction.",
        "He buries his champions. I keep mine in credit.",
      ],
      closes: [
        "Nothing personal. We just want different things from you.",
        "He'd say the same about me and he'd be right.",
        "You could do worse. You could do better.",
        "I'd never say that to his face. I'd say it to yours.",
      ],
    },
    wall: {
      opens: [
        "The Spider doesn't want your custom, friend. She wants YOU.",
        "She'll give you everything and call it love.",
        "That one has never once asked for a fair price.",
        "She was somebody's daughter. It shows.",
      ],
      closes: [
        "At least I tell you there's a bill.",
        "I'd rather be owed than owned.",
        "Careful there. That's all I'll say.",
        "She'd say I'm the dangerous one.",
      ],
    },
    forge: {
      opens: [
        "The Goat still pays his debts. Out of habit, I think.",
        "He builds because stopping would mean noticing.",
        "There's nothing left in that one to negotiate with.",
      ],
      closes: [
        "Sad, that. Bad for business too.",
        "Take what he makes. It's honest work.",
        "I don't take his money any more.",
      ],
    },
    art: {
      opens: [
        "The Matriarch has never needed a thing in her life.",
        "She runs a court. I run a counter. Guess which one you'll actually visit.",
        "Careful what you agree to while you're asleep.",
      ],
      closes: [
        "That's why she's up there and I'm down here with you.",
        "I've never had her custom. Never will.",
        "She's not lying to you either. That's the trouble.",
      ],
    },
    push: {
      opens: [
        "There's a whole world of other people's things down there.",
        "You'll hit a wall soon. I sell ladders.",
        "Somebody's going to find it first. Might as well be you.",
        "The good stuff doesn't come up on its own.",
        "You could be carrying more than that.",
        "There's better out there and you know where I am.",
        "Deeper pays. I don't set the rates, I just quote them.",
        "You're leaving value on the floor down there.",
        "Come see me before you go. Not after.",
        "You'll want to be holding something when it finds you.",
        "That gun of yours is thirsty.",
        "Go on. The dark's not going to loot itself.",
      ],
      closes: [
        "Off you go.",
        "I'll keep the counter warm.",
        "Say hello to whatever's down there.",
        "And friend - be quick about it.",
        "Just a thought.",
        "No pressure. There's never any pressure.",
        "I'll be here.",
        "Mind how you go.",
        "And come back in one piece. Preferably.",
        "You know where to find me.",
        "Take your time. I've got plenty.",
        "That's all I'm saying.",
      ],
    },
    idling: {
      opens: [
        "You ever wonder what I do when you're not here? Nothing. That's the joke.",
        "I like this bit. Nobody wants anything yet.",
        "Go on, ask me for something. I'm bored.",
        "There's a version of you that never met me. He's doing worse.",
        "I've been keeping count. Not of anything. Just keeping count.",
        "Quiet one today.",
        "You've been staring at that for a while.",
        "I don't sleep either. Occupational.",
        "Funny thing about being needed - you're never lonely.",
        "I could tell you what you're worth. You wouldn't like the precision.",
        "Everyone's got a price. Yours has moved twice this week.",
        "I keep a list. You're on it. Fondly.",
        "Don't mind me.",
      ],
      closes: [
        "Don't read into it.",
        "That's the quiet talking.",
        "Pretend I said something useful.",
        "We'll call that one free.",
        "Anyway.",
        "Where was I.",
        "Never mind.",
        "Forget I said anything.",
        "It'll come to me.",
        "That's the trade talking.",
        "Ignore me, friend.",
        "Right.",
      ],
    },
    guidance: {
      opens: [
        "TaCZ guns need the right calibre. Wrong ammo does nothing at all.",
        "A double barrel holds two. That is the entire lesson.",
        "Your kills pay in gunpowder and iron. Deeper pays better.",
        "Ammo is the bottleneck. It was always going to be the bottleneck.",
        "You can pay me in hunger, in levels, or in sight. Your choice.",
        "Everything I take from you is something you were carrying anyway.",
      ],
      closes: [
        "That's free advice. Note the word.",
        "I'd not tell a stranger that.",
        "Do with it what you like.",
        "You'll work the rest out.",
        "Come and see me when you do.",
        "There's more where that came from.",
      ],
    },
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT - what she says about where you are standing
  // ═══════════════════════════════════════════════════════════════════════════
  var CONTEXT = {
    loc_above: [
      "Nothing up here but weather and witnesses.",
      "Daylight's bad for my line of work.",
      "You're safe. Safe doesn't pay.",
      "Enjoy it. Go on. I'll wait.",
    ],
    loc_below: [
      "Now we're talking.",
      "Everything down here is worth something to somebody.",
      "Mind the dark. Mind what's counting in it.",
      "This is where you'll need me.",
    ],
    rare_loc_above: [
      "I had a name before this. It wasn't much of one.",
      "I was owed something once. I never collected. Still think about it.",
      "You know the worst part? I'd do it for free. Don't tell anyone.",
      "Everyone I ever dealt with is dead. That's not a threat, it's just arithmetic.",
    ],
    rare_loc_below: [
      "Something down here doesn't trade. I don't come this far.",
      "There's a woman at the bottom who never wanted anything. Unnatural.",
    ],
    near_blade: [
      "His. You can tell by the walk.",
      "Ask them what he charged. Watch them not know.",
    ],
    near_wall: [
      "Oh, that one's hers. Poor thing.",
      "Don't get between them. I've seen how that goes.",
    ],
    near_salvage: [
      "Ah. A colleague.",
      "Two of mine in one place. I do well.",
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
