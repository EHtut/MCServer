// forge_voice.js — the Goat's lines.  docs/56 (brief) · docs/57 §3 (her deep speaker)
//
// Milantros. Orphaned when her village was razed - an ornate "D" left in the tracks -
// and found standing in it by CAEBRIM and MOMMA PILLE, who kept her. Alice adopted her
// ("Pretty eyes"), and she grew up in an undead camp with a silver rifle Caebrim gave
// her. She died a child at the siege of the demon lord's castle. Caebrim begged Alice
// to bring her back; it took centuries, and the night before the ritual Alice made a
// choice and poured everything into a single wish. Milantros woke up new, just in time
// to watch the ritual collapse and her own soul go up.
//
// ── ⭐ WHAT SHE LOOKS LIKE (docs/56 §0b — Ethan's book notes) ───────────────
// Curly blonde hair. Large outward-curling goat horns under a WIDE-BRIMMED COWBOY HAT.
// Pale blue eyes, buck teeth, tan skin. Cheerful, energetic, LOVES MEAT AND GUNS.
//
// 🔑 The hat and the rifle are why the accent exists. It is not a flavour note bolted
// onto a goat - it is the whole silhouette, and it has been sitting in Ethan's own
// whisper line since 2026-08-05.
//
// ── ⭐ THE ONE VOICE RULE ───────────────────────────────────────────────────
// **EVERY LINE ARRIVES MID-CONVERSATION.** She is not starting a sentence, she is
// continuing one you were not part of. No greetings, no preamble, no landing. That is
// what Ethan's "just her rambling in your ear" is, mechanically, and it is the thing
// that should make a line hers before you read the name.
//
//     her:   "- and that's before you even get to the water wheel, which I would
//             not have put there, but you did, so."
//     NOT:   "Hello. I have been thinking about your water wheel."
//
// ── ⭐ "WILD IDEAS" ARE THIS FILE, NOT forge_events.js ──────────────────────
// Ethan, 2026-08-22: "wild ideas, these are less real ideas and just her rambling in
// your ear."
//
// An earlier draft had her events allowed to be WRONG - the gift slightly too strong,
// the contraption that misfires. That is retired. **Nothing she does mechanically is
// ever wrong**; the wildness is entirely in here, where a bad idea costs a player a
// line they scroll past instead of something they own. docs/56 §3.
//
// ── ⭐ SHE IS CHATTY BY COVERAGE, NOT BY RATE ──────────────────────────────
// idle.js: "⚠️ A god with no pool for the chosen context says NOTHING. It does not
// fall back." So the chattiest god in the pantheon is simply the one with NO GAPS.
// No new gate, no rate change - she just answers every context, including the two
// that NOBODY else in the game has ever filled:
//
//     hold_none   you are holding nothing
//     hold_item   you are holding something that is not a weapon and not food
//
// 🔑 She is the only god who talks to you while you are doing nothing at all. Keep it
// that way - if a later editor trims these pools "for noise", they are deleting the
// character, not the noise.
//
// ── THE ACCENT: WORD CHOICE AND RHYTHM. NEVER SPELLING. ────────────────────
// Ethan's own whisper line, live since 2026-08-05:
//     "*The goat whispers in a distinctly southern accent. You don't get the reference*"
// The game TELLS you what she sounds like. So: "reckon", "a mess of", "right quick",
// "well now", "bless", "yonder", "I swear". NEVER "fixin'", "somethin'", "y'all's".
// Eye-dialect makes a pool unreadable at a glance and he did not ask for it.
//
// ── ⭐ SHE KNOWS SHE IS DEAD AND IT IS NOT A WOUND ─────────────────────────
// Ethan: "She knows, she's been dead for a very long time."
//
// Not denial, not grief, not a reveal. She understood perfectly and stopped finding it
// interesting several centuries ago. **She can mention it the way you mention weather.**
// 🚨 No pool may treat her death as a secret, a twist, or a sad thing. She is the only
// god in the pantheon who is AT PEACE - and she is the one nobody meant to create.
//
// ── SHE NEVER ASKS FOR ANYTHING BACK ───────────────────────────────────────
// Every other patron's gift is a hook. Blade's is a test, Salvage's is a debt, Wall's
// is a leash, Kayer's is an appraisal. **Hers is a gift.** If a line here starts to
// sound like a trade, it is wrong. Her coefficient row agrees: spawns 1.0, power 1.0 -
// the floor on both, the only path in the game that makes the world no more dangerous.
//
// ⚠️ EVERY LINE HERE IS A DRAFT and is registered in docs/51 for Ethan's pass.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[forge] '
  var GOD = 'forge'
  var COLOUR = '§2§l'          // dark green. Reserved for her centrally in arrival.js.

  // Trust is the COUNTER: things built - blocks placed + items crafted + smelted
  // (counter_hooks.js, already live). ⭐ It was written for "The Thief" and it fits the
  // Goat better than it ever fit him: her trust in you IS how much you have made.
  // ⚠️ FIRST GUESS. Building numbers climb far faster than kills or biomes, so these
  // are deliberately higher than any other god's - replace with a measured curve.
  var MEDIUM_AT = 250
  var HIGH_AT = 1200

  var LINES = {
    // [CLAUDE-DRAFT] forge/guidance
    // ⭐ NOT GUIDANCE. Every other god's guidance pool tells you what to go and do.
    // Hers is her thinking out loud at you and occasionally landing on something
    // useful by accident. The player is welcome to ignore all of it.
    guidance: [
      '- and if you put the second one underneath the first one, it goes twice as fast. Probably. I have not done the arithmetic.',
      'You could build it out of stone. You could also build it out of something else. I am not going to tell you what to do.',
      'I reckon that would work better upside down. Most things do.',
      'Somebody made one of these once that could lift a horse. I never found out why they wanted to.',
      "- anyway that's the third time you've walked past that spot, so either you're thinking about it or you're lost.",
      'Build the ugly one first. The pretty one never gets finished, that is just a rule.',
      'I have a mess of ideas about what you should do next and most of them are bad, so I will just say: more of it.',
      "You don't need my permission. That's not what I'm for.",
      'A thing that works and looks stupid is still a thing that works. Write that down.',
      "- which is when I realised nobody had ever asked me. So. Build whatever you want.",
    ],

    // ⭐ SILENCE POOLS FOR THE CHATTIEST GOD ARE A JOKE, AND THEY SHOULD BE. She does
    // not go quiet. She announces that she has nothing, at length.
    // [CLAUDE-DRAFT] forge/low_silence · forge/medium_silence · forge/high_silence
    low_silence: [
      'Nothing from me. I am still working out who you are.',
      "I've got nothing. That happens about once a century, enjoy it.",
      'Hm. No. Lost it.',
    ],
    medium_silence: [
      "I had something and it's gone. It'll come back around, they always do.",
      'Nothing worth saying. I will say something anyway later, do not worry.',
      "Quiet for a bit. I'm watching what you're doing with that.",
    ],
    high_silence: [
      "I'm not going to fill this one. You're busy and you know what you're doing.",
      'Nothing. And that is me choosing, which you should feel flattered by.',
      "- no. Never mind. You'd have thought of it.",
    ],

    // [CLAUDE-DRAFT] forge/combat
    // 🔑 SHE IS NO USE IN A FIGHT AND SHE IS FINE ABOUT IT. spawns 1.0 / power 1.0 -
    // she is the only god who never made the world harder for you, so she has no
    // standing to coach you through it. She worries out loud instead.
    combat: [
      "- oh. Oh, that's a lot of them. Right. You know what you're doing.",
      'I would run. I am saying that as somebody who cannot.',
      "Hit it again! That's my whole contribution. Hit it again.",
      'I do not like this part. I never like this part.',
      "You're doing better than the last one. He was very brave and it did not help him.",
      "Is it supposed to do that? Is it? I don't know what any of these are.",
    ],

    // [CLAUDE-DRAFT] forge/returned
    returned: [
      "- and then you were gone for a while, so I just kept going without you. You didn't miss much.",
      "You're back. I've had four ideas and I've forgotten three.",
      'I did wonder. Not for long, I do not have the attention for it, but I did wonder.',
      "Good. Now: the thing you left half-built is still half-built, in case that was on your mind.",
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // THE GIFT LADDER. ⚠️ THE OPPOSITE OF KAYER'S. Hers is an appraisal that gets
    // colder as you get more valuable (docs/54). Milantros's just gets more excited.
    // 🚨 If one of these starts to sound like a trade or a test, it is wrong.
    // [CLAUDE-DRAFT] forge/low_gift · forge/medium_gift · forge/high_gift
    // ═══════════════════════════════════════════════════════════════════════
    low_gift: [
      'Here. I do not need it and you might.',
      "Take that. No, there's nothing attached to it, why does everyone ask that.",
      "I found it. Well - I made it, but I found the idea, so it's about the same.",
      'A small one to start. I have a lot of these.',
      "That's yours now. I've already forgotten I had it.",
    ],
    medium_gift: [
      "You've built enough that I've started paying proper attention, which is worse for you than it sounds.",
      'Better one. I made it thinking about the thing you built by the water, actually.',
      "Here. And before you ask - no. Still nothing attached. I'm not like the others.",
      "This one took me a while, which for me means I liked doing it.",
      "You've earned it, except you haven't, because that's not how I do this. Take it anyway.",
    ],
    high_gift: [
      "I've been saving this one. Not for you specifically. But now it's for you specifically.",
      "There's nobody else I'd hand this to, and I've had a very long time to find somebody.",
      "Take it. And keep building, because watching you do it is the only thing down here that's new.",
      "That's the best thing I have ever made and I am giving it to a person who will probably drop it in lava.",
      "- so I thought, well, she'd have liked this. And then I thought, she's not here, and you are.",
    ],

    // [CLAUDE-DRAFT] forge/harvest_won · forge/harvest_lost
    // ⚠️ SHE DOES NOT PUT HER CHAMPION DOWN. There is no cut_down pool and there must
    // not be one - docs/56 §4 gives her zeroes on every harmful row, and the Harvest
    // is the one place a god's cruelty usually shows. Hers shows as relief.
    harvest_won: [
      "You're alive. I'm going to be honest, I did not have a plan for if you weren't.",
      "That's done, then. I did not enjoy a second of it and I am very proud of you.",
      "- and it's over, and you're standing, and I'm going to talk about something else now.",
    ],
    harvest_lost: [
      "Oh. Oh no. Well - that's alright. That's alright, you can do it again.",
      "You lost. Nothing happens. Nobody takes anything from you. That's how I do it.",
      "I would say I told you so, except I didn't, and I wouldn't.",
    ],

    // [CLAUDE-DRAFT] forge/warn_incoming
    // 🔑 SHE IS ALARMED, NOT MENACING. Every other god's warn_incoming is a threat
    // relayed with relish. Hers is a friend shouting across a yard. {rival} is
    // substituted by warn.js - do NOT hardcode a god's title here.
    warn_incoming: [
      "- someone's coming. {rival} sent them. I don't know what you did and I don't care, but move.",
      "{rival} has put somebody on you. That's not a thing I would ever do and I want that on the record. Go.",
      "Trouble. {rival}'s. Coming your way right now, I'm not going to be any use, RUN.",
    ],

    // [CLAUDE-DRAFT] forge/warn_wave
    // The tide herald above the cutoff. Below it Caebrim takes over (docs/57 §3).
    warn_wave: [
      "- something's coming up out of the ground and there is a great deal of it.",
      'Oh, I know that sound. I have not heard that sound in a very long time. Get somewhere with a roof.',
      "That's the dead moving all at once. Not mine. I don't have any.",
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // THE ARGUMENT FAMILY (grudge.js / broadcast.js). A god's champion was killed and
    // the gods say something about it in public.
    //
    // 🚨 SHE CANNOT THREATEN AND SHE DOES NOT RETALIATE. docs/56 §4 zeroes every
    // harmful row, and grudge.js's LASH table gives her the gentlest entry in the
    // game. `argue_threat` is therefore the one pool in this file that fights its own
    // tag: she is given the slot and refuses to use it. That is deliberate.
    // [CLAUDE-DRAFT] forge/argue_accuse · forge/argue_answer · forge/argue_threat
    // [CLAUDE-DRAFT] forge/argue_refuse · forge/argue_unanswered
    // ═══════════════════════════════════════════════════════════════════════
    argue_accuse: [
      'That was mine. You knew that was mine.',
      "- and I'd only just got them to build the roof properly, so thank you for that.",
      'You did not have to. That is the whole of what I have to say. You did not have to.',
    ],
    argue_answer: [
      "I'm not going to pretend I understood a word of that.",
      'Fine. Fine! I have heard you.',
      "You always have a reason. Everyone down here always has a reason.",
    ],
    argue_threat: [
      "And I'd threaten you, except we both know I'm not going to, so let's skip it.",
      "I've got nothing to hurt you with. I never built one of those.",
      'Consider yourself glared at.',
    ],
    argue_refuse: [
      "No. I'm not doing this bit.",
      "I'd rather go back to what I was doing, honestly.",
      'You can have the last word. You always take it anyway.',
    ],
    argue_unanswered: [
      "- and nobody says anything. They never do. That's fine. I'll talk.",
      'Silence. From all of you. Wonderful.',
      "Right. Well. I said it, and it's said.",
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // HER EVENT POOLS - consumed by forge_events.js. docs/56 §4: four kinds, and not
    // one of them harms anybody.
    //
    // ⭐ SHE IS THE ONLY GOD WHO USES THE **FORCED** COLUMN GENEROUSLY. docs/23's rule
    // is "choice always gives a reward, no choice often gives none" - which reads as
    // forced = demanding. She breaks it the other way: she buffs you without asking
    // because it did not occur to her to ask.
    // [CLAUDE-DRAFT] forge/notion · forge/notion_aid
    // [CLAUDE-DRAFT] forge/gift_open · forge/gift_taken · forge/gift_left
    // [CLAUDE-DRAFT] forge/lend_ask · forge/lend_done · forge/lend_no
    // ═══════════════════════════════════════════════════════════════════════
    notion: [
      '- oh! Hold still. Hold still, I want to try something.',
      "I had a notion. It's on you now. You'll be fine.",
      "Right, so I've done a thing and I should probably have asked first, but I didn't.",
      "Don't worry about what that is. It's good. It's mostly good.",
    ],
    notion_aid: [
      "- and I've done the same for your friend over there, because it seemed rude not to.",
      "Your neighbour's got one too. I don't play favourites, I just play.",
      "I gave one to the other one as well. Don't tell them it was an afterthought.",
    ],
    gift_open: [
      "I made you something. You have to take it, though. I'm not going to put it on you twice in one day.",
      "There's a thing here for you. It's yours if you want it and it's mine if you don't, and either way I'm fine.",
      "- so I built it, and then I remembered you existed. Do you want it?",
    ],
    gift_taken: [
      "Good! Good. Right. Now go and break it on something.",
      "That's the correct answer. There was no incorrect answer, but that's still the correct one.",
      'Ha! Yours.',
    ],
    gift_left: [
      "Suit yourself. It'll be here. I don't throw things away.",
      "No? Alright. That's allowed, you know. Not everyone tells you that.",
      "Fine. More for- well. Nobody. More for nobody.",
    ],
    lend_ask: [
      "The one who follows {rival} is having a bad time of it. Would you go and help? For me, not for them.",
      "- and somebody out there is stuck, and you're the only one I can ask, and I am asking.",
      "I want you to go and help {rival}'s. I know. I KNOW. Do it anyway.",
    ],
    lend_done: [
      "You went. You actually went. I'm going to think about that for a while.",
      "That's the nicest thing anyone's done because I asked. Admittedly I don't ask much.",
      "Good. Now nobody owes anybody anything, which is how I like it.",
    ],
    lend_no: [
      "That's fair. They're not your problem. I just thought I'd ask.",
      "No, I understand. It was a lot to ask and I asked it anyway.",
      "Alright. Forget I said anything. I will bring it up again in a week.",
    ],
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE CONTEXT POOLS - idle.js's weighted picker. ⭐ THIS IS WHERE THE RAMBLING
  // LIVES, and the coverage IS the characterisation (docs/56 §3). Every context
  // answered, most with a rare_ twin.
  // ═══════════════════════════════════════════════════════════════════════════
  var CONTEXT = {
    // [CLAUDE-DRAFT] forge/loc_above · forge/rare_loc_above
    loc_above: [
      "- and the sky's still up there, which I check, because one day it might not be.",
      'Good weather for building. All weather is good weather for building.',
      "You've got a lot of room out here. Use more of it than you need to.",
      "I like it up here. I'm not up here, but I like it.",
    ],
    rare_loc_above: [
      "I remember weather. Not the cold or the wet, just - that it happened, and that I was in it. That's most of what's left.",
      "There was a castle. There was a siege. I was very small and then I was not anything. Anyway - what are you making?",
    ],
    // ⚠️ Below the cutoff Caebrim speaks, not her (docs/57 §3). These are for the
    // shallow enclosed spaces that are still ABOVE it, which is most caving.
    // [CLAUDE-DRAFT] forge/loc_below · forge/rare_loc_below
    loc_below: [
      "- indoors. Fine. I can talk indoors.",
      'Everything worth having is under something. That is not wisdom, it is just true.',
      'Mind the ceiling. I have seen more people killed by a ceiling than by anything with teeth.',
      "It's very close in here. I don't mind. I don't breathe.",
    ],
    // 🔴 SECOND LINE REWRITTEN. The draft had "she asked for me" - true but thin.
    // docs/56 §0d: **Caebrim RAISED her**, with Momma Pille, in Alice's undead camp,
    // and the first thing Milantros ever said to her was "Uggo" while falling over.
    // That beat is Ethan's canon and it is the best thing either of them has.
    rare_loc_below: [
      "Do not go all the way down. There's somebody down there who'd want to see you, and I would rather she didn't.",
      "She raised me. Her and Momma Pille. I called her Uggo the day we met and she has never once let me forget it.",
    ],

    // ⭐⭐ THE TWO CONTEXTS NO OTHER GOD IN THE GAME HAS EVER FILLED. This is the
    // ruling, implemented. Do not trim these.
    // [CLAUDE-DRAFT] forge/hold_none · forge/rare_hold_none
    hold_none: [
      "Empty hands. That's a waste of two perfectly good hands.",
      "- nothing? You're carrying nothing? What do you DO all day.",
      "You're not holding anything, which means you're thinking, which means I should be quiet. I won't be.",
      'Idle hands. I would love idle hands. I would love hands.',
      "Pick something up. Anything. I'm not going to talk about the weather again.",
    ],
    rare_hold_none: [
      "I had hands like that. Small ones. I remember being annoyed about how small they were, and now that's the only thing I remember about them.",
    ],
    // [CLAUDE-DRAFT] forge/hold_item · forge/rare_hold_item
    hold_item: [
      "What's that for? No, genuinely, what is that for.",
      "- and you could make about four things out of that, and you're going to make none of them, I can tell.",
      "Oh, I like that one. Turn it over. TURN IT OVER.",
      "Hold onto that. Not for a reason. I just like knowing you have it.",
      "That's the third one of those. You're collecting them. You don't know you're collecting them.",
    ],
    rare_hold_item: [
      "Somebody made that. Some person, with a name, who is not around any more. Everything's like that if you look at it long enough. Anyway.",
    ],
    // 🔴 REWRITTEN 2026-08-22 AFTER THE BOOK DUMP. The first draft had her
    // weapon-averse - "I never understood these", "one of those went through me" -
    // which is the exact opposite of the character. docs/56 §0b: **she loves meat and
    // guns**, and Caebrim gave her a silver rifle. Enthusiasm, not squeamishness.
    // [CLAUDE-DRAFT] forge/hold_weapon · forge/rare_hold_weapon
    hold_weapon: [
      'Oh, let me see it. Let me SEE it.',
      "- and if you put a longer barrel on that it'd carry twice as far, which is about the only advice I'm any good at.",
      "Swords are fine. Swords are FINE. I'm only saying there are quicker ways to be right about something.",
      'Good weight on that. You can tell by how you are standing.',
      "Point it at something. Not at me, obviously. Not that it'd do anything.",
    ],
    rare_hold_weapon: [
      "Mine was silver. Somebody wrapped it up like it was a secret and it absolutely was not, everybody knew. I still had it at the end. I have no idea where it went.",
    ],
    // ⭐ MEAT FIRST (docs/56 §0b), chocolate second - his own item ruling gave Forge
    // the chocolate, and the dump gave her the appetite.
    // [CLAUDE-DRAFT] forge/hold_food · forge/rare_hold_food
    hold_food: [
      'Meat. Good. Eat it before it turns - that is not a suggestion.',
      "- and I would give a great deal to know what that tastes like, so do me a favour and pay attention while you do it.",
      "That is a vegetable. Why is that a vegetable. Go and find something that used to run.",
      "Chocolate! Get chocolate. I don't remember why that's the right answer but it is.",
      "You've been carrying that for two days. It is not a pet.",
    ],
    rare_hold_food: [
      "I can't remember any of it. Not one taste. That's the only part I ever actually mind, and I only mind it when you're eating.",
    ],

    // ⭐ ALL FOUR near_ POOLS. Nobody else has all four - and near_art is where the
    // one-sided grudge pays off: Kayer hates her (docs/57 §4) and she is DELIGHTED
    // to see Kayer's champion. She has no idea.
    // [CLAUDE-DRAFT] forge/near_blade · forge/near_wall · forge/near_salvage · forge/near_art
    near_blade: [
      "- that one's his. He's very serious about it. He was serious about everything, even before.",
      'Say hello. He will not say it back, that is not a slight, that is just him.',
      "The war god's. All that armour and he still gets hit.",
    ],
    near_wall: [
      "Hers. Don't let her hear you say I said this, but I think she means well. Mostly.",
      "- and that one hasn't been allowed to go anywhere on their own in weeks, poor thing.",
      "The spider's. Wave. Do not get closer than waving.",
    ],
    near_salvage: [
      "Oh, that one owes somebody something. They all do. That's the whole arrangement over there.",
      "- careful, that one will trade you something you needed for something you wanted.",
      "The hound's. I like her, actually. She's loud and she never pretends she isn't.",
    ],
    // ⭐⭐ THE PAYOFF POOL. Kayer hates her (docs/57 §4) and the cause is now canon
    // rather than my guess: a small goat girl called her **"Short, Ugly, Weird,
    // Smelly"** the day they met, and was then adopted by Kayer's own mother.
    //
    // 🔑 THE EXACT CALIBRATION: she knows about the NICKNAME. She does not know it is
    // a GRUDGE. She thinks it is a running family joke - "it's our little thing" -
    // and Kayer has been carrying it for four centuries. That gap is the whole gag,
    // and a later editor must not close it by having her notice.
    near_art: [
      "That one's Kayer's! Oh, tell her I said hello. Tell her I said hello TWICE.",
      "Kayer's. Tell Short I said hello. She pretends to hate that. It's our little thing.",
      "- and that's the Matriarch's, which means they're clever and cold and they didn't pick either of those, she did.",
      "She's never once written back. I keep sending things anyway, it isn't a chore.",
      "Be kind to that one. She isn't. Somebody ought to be.",
    ],
  }

  ServerEvents.loaded(function () {
    if (!VELDORA.voice) { console.error(TAG + 'voice.js missing'); return }
    VELDORA.voice.setColour(GOD, COLOUR)

    var n = 0, tags = 0
    for (var k in LINES) {
      if (!LINES.hasOwnProperty(k)) continue
      if (VELDORA.voice.registerLines(GOD, k, LINES[k])) { n += LINES[k].length; tags++ }
    }
    var ctxn = 0, ctxtags = 0
    for (var c in CONTEXT) {
      if (!CONTEXT.hasOwnProperty(c)) continue
      if (VELDORA.voice.registerLines(GOD, c, CONTEXT[c])) { ctxn += CONTEXT[c].length; ctxtags++ }
    }

    if (!n && !ctxn) {
      console.error(TAG + 'THE GOAT HAS NO VOICE - every pool is empty')
      return
    }
    // ⚠️ DERIVED FROM THE POOLS, NOT RESTATED. Five banners lied in one day this
    // month because they hardcoded a rule another file owned. This one counts what
    // actually registered, so it cannot drift.
    var holds = 0, hl = ['hold_none', 'hold_item', 'hold_weapon', 'hold_food']
    for (var i = 0; i < hl.length; i++) if (CONTEXT[hl[i]] && CONTEXT[hl[i]].length) holds++
    console.info(TAG + 'The Goat speaks - ' + n + ' fixed + ' + ctxn + ' contextual, ' +
      'across ' + (tags + ctxtags) + ' tags. Trust at ' + MEDIUM_AT + '/' + HIGH_AT +
      ' things built. ' + holds + '/4 hold contexts answered (no other god fills more ' +
      'than 2). Below the deep cutoff she does NOT speak - Caebrim does.')
  })
})();
