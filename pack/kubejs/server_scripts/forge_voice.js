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
// ── 🔴 THE ACCENT IS WRITTEN. Ethan, 2026-08-22 ────────────────────────────
// "can we actually alter all the dialogue so the accent is written?"
//
// ⚠️ THIS REVERSES MY OWN RULING, AND HE IS RIGHT TO REVERSE IT. I argued for word
// choice and rhythm only, on the grounds that his whisper line TELLS you she sounds
// southern rather than performing it. But that line is a NARRATOR describing her from
// outside; these pools are her actually talking. A narrator can say "she has an
// accent". A character has to have one.
//
// ── ⭐ THE ONE RULE THAT KEEPS IT READABLE: CONSONANTS YES, VOWELS NO ──────
// This is the whole style guide and it is not negotiable, because the failure mode of
// written dialect is a pool nobody can scan:
//
//     ✅ DROP THE G           buildin', somethin', nothin', fixin', reckonin'
//     ✅ CONTRACT FREELY      y'all, ain't, gonna, oughta, 'em, 'bout, 'cause, s'pose
//     ✅ REGIONAL VOCABULARY  reckon, yonder, a mess of, right quick, fixin' to,
//                             well now, shoot, lord, mighty, bless
//     🚨 NEVER RESPELL A VOWEL     no "Ah", no "yew", no "mah", no "thang"
//
// Eye-dialect on vowels is where written accent stops being a voice and becomes a
// costume. Consonants and contractions carry the whole sound and cost nothing to read.
//
// 🔑 SHE IS ALSO A CHILD, so the accent rides on top of a kid's grammar: run-ons,
// repeated words for emphasis, sentences that change their mind halfway.
//
// ── ⭐ THE ONE VOICE RULE ───────────────────────────────────────────────────
// **EVERY LINE ARRIVES MID-CONVERSATION.** She is not starting a sentence, she is
// continuing one you were not part of. No greetings, no preamble, no landing.
//
//     her:   "- an' that's before y'all even get to the water wheel, which I wouldn't
//             have put there, but you did, so."
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

  // ════════════════════════════════════════════════════════════════════════
  // ⭐ HER REGISTER. Ethan, 2026-08-29:
  //
  //     "Forge dialogue should be childish and will often go off on rambling tangents,
  //      this is both in her pathless dialogue and path dialogue."
  //
  // 🔑 CHILDISH IS NOT STUPID. She is the best builder in the pantheon and the
  // rambling is not confusion - it is a nine-year-old showing you her workshop.
  //
  //   · SHORT WORDS. If a longer one exists she does not reach for it.
  //   · "an' then" as connective tissue. Sentences run on because stopping is boring.
  //   · TANGENTS THAT DO NOT COME BACK. A second thought starts before the first
  //     finishes, and the first is simply gone.
  //   · QUESTIONS SHE ANSWERS HERSELF, immediately, without waiting.
  //   · SHOWING OFF, then undercutting it.
  //   · ⚠️ NEVER MEAN. She is the one god whose FORCED column is generous, and the
  //     childishness must read as warmth, not as a brat.
  //
  // ⭐ A LINE STARTING "- " IS JOINED MID-RAMBLE: she was already talking and you just
  // walked into earshot. That device predates this ruling and is the best thing in her
  // voice. Keep it. Use it more.
  //
  // ⚠️ SCOPE OF THIS PASS: `guidance`, `bored` and `notion` are rewritten below as the
  // worked example. Her other ~17 pools still read FOLKSY-ADULT ("reckon", "oughta",
  // "I ain't got the trick for stoppin' that") and want the same treatment. They are
  // all [CLAUDE-DRAFT] and therefore listed in `docs/51` - not silently left.
  var LINES = {
    // [CLAUDE-DRAFT] forge/guidance
    // ⭐ NOT GUIDANCE. Every other god's guidance pool tells you what to go and do.
    // Hers is her thinkin' out loud at you and occasionally landing on something
    // useful by accident. The player is welcome to ignore all of it.
    guidance: [
      "- an' that's BEFORE the water wheel! I wouldn't of put it there. You did. That's fine.",
      "You could build it out of stone. Or not stone! I'm not the boss of it.",
      "It'd work better upside down. Most things do. I don't know why.",
      "Somebody made one that could lift a whole horse once. A HORSE. Nobody ever said why.",
      "- anyway that's three times you walked past that spot so you're either thinkin' or you're lost, an' both is fine.",
      "Build the ugly one first! The pretty one never gets finished. That's just true.",
      "I got about a hundred ideas an' most of 'em are bad so just - more. Do more.",
      "You don't need me to say yes. I'm not for that.",
      "If it works an' it looks stupid it still WORKS. That's the whole thing.",
      "- an' that's when I figured out nobody ever asked me. So. Whatever you want!",
    ],

    // ⭐ SILENCE POOLS FOR THE CHATTIEST GOD ARE A JOKE, AND THEY SHOULD BE. She does
    // not go quiet. She announces that she has nothing, at length.
    // [CLAUDE-DRAFT] forge/low_silence · forge/medium_silence · forge/high_silence
    low_silence: [
      "Nothin' from me. Still workin' out who you are.",
      "I got nothin'. Happens 'bout once a century, enjoy it.",
      'Hm. Nope. Lost it.',
    ],
    medium_silence: [
      "I had somethin' an' it's gone. It'll come back 'round, they always do.",
      "Nothin' worth sayin'. I'll say somethin' anyway later, don't you worry.",
      "Quiet a spell. I'm watchin' what you're doin' with that.",
    ],
    high_silence: [
      "I ain't gonna fill this one. You're busy an' you know what you're doin'.",
      "Nothin'. An' that's me choosin', which you oughta feel real flattered by.",
      "- no. Never mind. You'd have thought of it.",
    ],

    // [CLAUDE-DRAFT] forge/combat
    // 🔑 SHE IS NO USE IN A FIGHT AND SHE IS FINE ABOUT IT. spawns 1.0 / power 1.0 -
    // she is the only god who never made the world harder for you, so she has no
    // standing to coach you through it. She worries out loud instead.
    combat: [
      "- oh. Oh, that's a lot of 'em. Right. You know what you're doin'.",
      "I'd run. An' I'm sayin' that as somebody who can't.",
      "Hit it again! That's my whole contribution. Hit it again.",
      "I don't like this part. I never like this part.",
      "You're doin' better'n the last one. He was real brave an' it didn't help him none.",
      "Is it s'posed to do that? Is it? I don't know what any of these are.",
    ],

    // [CLAUDE-DRAFT] forge/returned
    returned: [
      "- an' then you were gone a while, so I just kept goin' without you. You didn't miss much.",
      "You're back. I've had four ideas an' I forgot three.",
      "I did wonder. Not for long, I ain't got the attention for it, but I did wonder.",
      "Good. Now: that thing you left half-built is still half-built, case that was on your mind.",
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // THE GIFT LADDER. ⚠️ THE OPPOSITE OF KAYER'S. Hers is an appraisal that gets
    // colder as you get more valuable (docs/54). Milantros's just gets more excited.
    // 🚨 If one of these starts to sound like a trade or a test, it is wrong.
    // [CLAUDE-DRAFT] forge/low_gift · forge/medium_gift · forge/high_gift
    // ═══════════════════════════════════════════════════════════════════════
    low_gift: [
      "Here. I don't need it an' you might.",
      "Take that. No, there ain't nothin' attached to it, why's everybody always ask that.",
      "I found it. Well - I made it, but I found the idea, so it's 'bout the same.",
      "A little one to start. I got a whole mess of these.",
      "That's yours now. I already forgot I had it.",
    ],
    medium_gift: [
      "You've built enough that I started payin' proper attention, which is worse for you than it sounds.",
      "Better one. Made it thinkin' 'bout that thing you put up by the water, matter of fact.",
      "Here. An' 'fore you ask - no. Still nothin' attached. I ain't like the others.",
      "This one took me a while, which for me means I liked doin' it.",
      "You earned it, 'cept you didn't, 'cause that ain't how I do this. Take it anyhow.",
    ],
    high_gift: [
      "Been savin' this one. Not for you specifically. But now it's for you specifically.",
      "Ain't nobody else I'd hand this to, an' I've had a real long time to go lookin'.",
      "Take it. An' keep buildin', 'cause watchin' you do it's the only thing down here that's new.",
      "That's the finest thing I ever made an' I'm givin' it to a fella who'll drop it in lava inside a week.",
      "- so I thought, well, she'd have liked this. An' then I thought, she ain't here, an' you are.",
    ],

    // [CLAUDE-DRAFT] forge/harvest_won · forge/harvest_lost
    // ⚠️ SHE DOES NOT PUT HER CHAMPION DOWN. There is no cut_down pool and there must
    // not be one - docs/56 §4 gives her zeroes on every harmful row, and the Harvest
    // is the one place a god's cruelty usually shows. Hers shows as relief.
    harvest_won: [
      "You're alive. I'll be honest, I didn't have a plan for if you weren't.",
      "That's done, then. Didn't enjoy a second of it an' I'm real proud of you.",
      "- an' it's over, an' you're standin', an' I'm gonna talk about somethin' else now.",
    ],
    harvest_lost: [
      "Oh. Oh no. Well - that's alright. That's alright, you can go do it again.",
      "You lost. Nothin' happens. Don't nobody take nothin' from you. That's how I do it.",
      "I'd say I told you so, 'cept I didn't, an' I wouldn't.",
    ],

    // [CLAUDE-DRAFT] forge/warn_incoming
    // 🔑 SHE IS ALARMED, NOT MENACING. Every other god's warn_incoming is a threat
    // relayed with relish. Hers is a friend shouting across a yard. {rival} is
    // substituted by warn.js - do NOT hardcode a god's title here.
    warn_incoming: [
      "- somebody's comin'. {rival} sent 'em. I don't know what you did an' I don't care, but move.",
      "{rival}'s put somebody on you. That ain't a thing I'd ever do an' I want that on the record. Go.",
      "Trouble. {rival}'s. Headed your way right this second, I ain't gonna be any use, RUN.",
    ],

    // [CLAUDE-DRAFT] forge/bored
    // ⭐⭐ CONSUMED BY ranks.js WHEN HER ATTENTION SLIPS. docs/63 §9 named an
    // unexplained rank drop as a falsifier - a player logging back in to a lower
    // number with no idea why. She is the chattiest god in the game; going quiet
    // about it is the one thing she would never do.
    //
    // 🔑 SHE IS NOT THREATENING YOU AND SHE IS NOT SULKING. She is a child whose
    // attention has genuinely wandered, and she says so the way a child would -
    // cheerfully, mid-thought, with no idea it lands as a warning. The mechanic is
    // punishing; the voice must not be.
    bored: [
      "- an' now I've looked at everything over here. Twice. Both times.",
      "You haven't made anything in AGES. I counted. I wasn't tryin' to count.",
      "I might go see what the others are doin'. I'll come back though. I always come back.",
      "Build somethin'! Anythin'! It doesn't even have to be good, that's the best part.",
      "My brain wandered off an' I don't know the trick for gettin' it back yet.",
    ],

    // [CLAUDE-DRAFT] forge/warn_wave
    // The tide herald above the cutoff. Below it Caebrim takes over (docs/57 §3).
    warn_wave: [
      "- somethin's comin' up outta the ground an' there is a great deal of it.",
      "Oh, I know that sound. Ain't heard that sound in a real long time. Get somewhere with a roof.",
      "That's the dead movin' all at once. Not mine. I don't got any.",
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
      "- an' I'd only just got 'em buildin' the roof proper, so thank you kindly for that.",
      "You didn't have to. That's the whole of what I got to say. You didn't have to.",
    ],
    argue_answer: [
      "I ain't gonna pretend I understood a word of that.",
      'Fine. Fine! I heard you.',
      "Y'all always got a reason. Everybody down here's always got a reason.",
    ],
    argue_threat: [
      "An' I'd threaten you, 'cept we both know I ain't gonna, so let's skip it.",
      "I got nothin' to hurt you with. Never did build one of those.",
      'Consider yourself glared at.',
    ],
    argue_refuse: [
      "Nope. I ain't doin' this bit.",
      "I'd sooner go back to what I was doin', honestly.",
      'You can have the last word. You take it anyhow.',
    ],
    argue_unanswered: [
      "- an' don't nobody say nothin'. They never do. That's fine. I'll talk.",
      'Quiet. From all of y\'all. Wonderful.',
      "Right. Well. I said it, an' it's said.",
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
      "- oh! OH. Hold still, hold still, I wanna try somethin'.",
      "I had an idea an' now it's on you. You'll be fine. Probably fine.",
      "Okay so I did a thing an' I should of asked first an' I didn't, an' now we both know.",
      "Don't worry about what that is! It's good. It's mostly good.",
    ],
    notion_aid: [
      "- an' I done the same for your friend over yonder, 'cause it seemed rude not to.",
      "Your neighbour's got one too. I don't play favourites, I just play.",
      "Gave one to the other fella as well. Don't tell 'em it was an afterthought.",
    ],
    gift_open: [
      "I made you somethin'. You gotta take it, though. I ain't puttin' somethin' on you twice in one day.",
      "There's a thing here for you. Yours if you want it, mine if you don't, an' either way I'm fine.",
      "- so I built it, an' then I remembered you existed. You want it?",
    ],
    gift_taken: [
      "Good! Good. Right. Now go break it on somethin'.",
      "That's the right answer. Weren't a wrong answer, but that's still the right one.",
      'Ha! Yours.',
    ],
    gift_left: [
      "Suit yourself. It'll keep. I don't throw nothin' away.",
      "No? Alright. That's allowed, y'know. Ain't everybody tells you that.",
      "Fine. More for- well. Nobody. More for nobody.",
    ],
    lend_ask: [
      "The one that follows {rival}'s havin' a bad time of it. Would you go help? For me, not for them.",
      "- an' somebody out there's stuck, an' you're the only one I got to ask, an' I'm askin'.",
      "I want you to go help {rival}'s. I know. I KNOW. Do it anyhow.",
    ],
    lend_done: [
      "You went. You actually went. I'm gonna be thinkin' on that a while.",
      "That's the nicest thing anybody's done 'cause I asked. Grant you I don't ask much.",
      "Good. Now don't nobody owe nobody nothin', which is how I like it.",
    ],
    lend_no: [
      "That's fair. They ain't your problem. I just figured I'd ask.",
      "No, I understand. Was a lot to ask an' I asked it anyhow.",
      "Alright. Forget I said anything. I'll bring it up again in a week.",
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
      "- an' the sky's still up there, which I check, 'cause one day it might not be.",
      "Good weather for buildin'. All weather's good weather for buildin'.",
      "You got a lot of room out here. Use more of it than you need to.",
      "I like it up here. I ain't up here, but I like it.",
    ],
    rare_loc_above: [
      "I remember weather. Not the cold or the wet, just - that it happened, an' that I was out in it. That's 'bout all that's left.",
      "There was a castle. There was a siege. I was real small an' then I wasn't anything. Anyway - what're you makin'?",
    ],
    // ⚠️ Below the cutoff Caebrim speaks, not her (docs/57 §3). These are for the
    // shallow enclosed spaces that are still ABOVE it, which is most caving.
    // [CLAUDE-DRAFT] forge/loc_below · forge/rare_loc_below
    loc_below: [
      "- indoors. Fine. I can talk indoors.",
      "Everything worth havin' is under somethin'. That ain't wisdom, it's just true.",
      "Mind that ceilin'. I seen more folks killed by a ceilin' than by anything with teeth.",
      "It's awful close in here. I don't mind. I don't breathe.",
    ],
    // 🔴 SECOND LINE IS ETHAN'S CANON. docs/56 §0d: **Caebrim RAISED her**, with Momma
    // Pille, in Alice's undead camp, and the first thing Milantros ever said to her
    // was "Uggo" while falling over. That beat is his and it is the best thing either
    // of them has.
    rare_loc_below: [
      "Don't go all the way down. There's somebody down there'd want to see you, an' I'd rather she didn't.",
      "She raised me. Her an' Momma Pille. I called her Uggo the day we met an' she ain't never once let me forget it.",
    ],

    // ⭐⭐ THE TWO CONTEXTS NO OTHER GOD IN THE GAME HAS EVER FILLED. This is the
    // ruling, implemented. Do not trim these.
    // [CLAUDE-DRAFT] forge/hold_none · forge/rare_hold_none
    hold_none: [
      "Empty hands. That's a waste of two perfectly good hands.",
      "- nothin'? You're carryin' nothin'? What do you DO all day.",
      "You ain't holdin' anything, which means you're thinkin', which means I oughta be quiet. I won't be.",
      "Idle hands. I'd love idle hands. I'd love hands.",
      "Pick somethin' up. Anything. I ain't gonna talk about the weather again.",
    ],
    rare_hold_none: [
      "I had hands like that. Little ones. I remember bein' put out about how little they were, an' now that's the only thing I remember about 'em at all.",
    ],
    // [CLAUDE-DRAFT] forge/hold_item · forge/rare_hold_item
    hold_item: [
      "What's that for? No, genuinely, what is that for.",
      "- an' you could make about four things outta that, an' you're gonna make none of 'em, I can tell.",
      "Oh, I like that one. Turn it over. TURN IT OVER.",
      "Hold onto that. Not for a reason. I just like knowin' you got it.",
      "That's the third one of those. You're collectin' 'em. You don't know you're collectin' 'em.",
    ],
    rare_hold_item: [
      "Somebody made that. Some person, with a name, who ain't around no more. Everything's like that if you look at it long enough. Anyway.",
      "She gave me a dragon once. A little dead one, all bones. I called it Dragon. I was not a clever child.",
    ],
    // 🔴 SHE LOVES GUNS (docs/56 §0b) - Caebrim gave her a silver rifle. An earlier
    // draft had her weapon-averse, which is the exact opposite of the character.
    // [CLAUDE-DRAFT] forge/hold_weapon · forge/rare_hold_weapon
    hold_weapon: [
      "Oh, lemme see it. Lemme SEE it.",
      "- an' if you put a longer barrel on that it'd carry twice as far, which is 'bout the only advice I'm any good at.",
      "Swords are fine. Swords are FINE. I'm only sayin' there's quicker ways to be right about somethin'.",
      "Good weight on that. You can tell by how you're standin'.",
      "Point it at somethin'. Not at me, obviously. Not that it'd do anything.",
    ],
    rare_hold_weapon: [
      "Mine was silver. Somebody wrapped it up like it was a secret an' it purely was not, everybody knew. Still had it at the end. Got no idea where it went.",
    ],
    // ⭐ MEAT FIRST (docs/56 §0b), chocolate second - his own item ruling gave Forge
    // the chocolate, and the dump gave her the appetite.
    // [CLAUDE-DRAFT] forge/hold_food · forge/rare_hold_food
    hold_food: [
      "Meat. Good. Eat it 'fore it turns - that ain't a suggestion.",
      "- an' I'd give a great deal to know what that tastes like, so do me a kindness an' pay attention while you're doin' it.",
      "That's a vegetable. Why is that a vegetable. Go find somethin' that used to run.",
      "Chocolate! Get chocolate. Don't remember why that's the right answer but it is.",
      "You been carryin' that two days. It ain't a pet.",
    ],
    rare_hold_food: [
      "I can't remember any of it. Not one taste. That's the only part I ever do mind, an' I only mind it when you're eatin'.",
    ],

    // ⭐ ALL FOUR near_ POOLS. Nobody else has all four - and near_art is where the
    // one-sided grudge pays off.
    // [CLAUDE-DRAFT] forge/near_blade · forge/near_wall · forge/near_salvage · forge/near_art
    // ⭐⭐ THEY ARE FOSTER-SIBLINGS AND NOBODY HAD NOTICED. Caebrim raised Gregor -
    // calls him "my boy" - and Caebrim also raised HER (docs/61 §3). Blade and Forge
    // grew up under the same woman.
    //
    // 🔑 And the first line of this pool already said so by accident: "He was serious
    // about everything, EVEN BEFORE." Before what? She knew him before. Keep it.
    //
    // ⚠️ SHE REMEMBERS AND HE DOES NOT SAY. Blade's own pools have no warmth in them
    // for anyone - that is the severance (docs/60 §1). So this is entirely one-sided,
    // like everything else she has: she is fond of a man who is a rank now.
    near_blade: [
      "- that one's his. He's real serious about it. He was serious about everything, even before.",
      "Say hello. He won't say it back, that ain't a slight, that's just him.",
      "War god's. All that armour an' he still gets hit.",
      "Him an' me got raised by the same woman, y'know. He don't bring it up. He don't bring anything up.",
      "I knew him when he was somebody's boy an' not somebody's general. Long time ago now.",
    ],
    // ⭐⭐ SHE IS THE ONE WHO IS KIND TO MERA. Wall is Mera (docs/59), and in the books
    // Milantros is the one who insists to her face: **"you're not a clone to me."**
    // Everyone else - Kayer especially - treats Mera as a manufactured copy.
    //
    // 🔑 SO THE TWO GODS KAYER CANNOT FORGIVE ARE KIND TO EACH OTHER, and neither of
    // them knows that is why. That is the warmest thing in the pantheon and it costs
    // nothing to have.
    near_wall: [
      "Hers. Don't let her hear I said this, but I reckon she means well. Mostly.",
      "- an' that one ain't been allowed to go anywhere on their own in weeks, poor thing.",
      "The spider's. Wave. Don't get no closer than wavin'.",
      "Tell her she ain't a copy of anybody. She'll know what I mean. She won't believe me, she never does.",
      "I like her. Everybody's got a reason not to an' I ain't never been able to find mine.",
    ],
    near_salvage: [
      "Oh, that one owes somebody somethin'. They all do. That's the whole arrangement over there.",
      "- careful, that one'll trade you somethin' you needed for somethin' you wanted.",
      "The hound's. I like her, matter of fact. She's loud an' she don't never pretend she ain't.",
    ],
    // ⭐⭐ THE PAYOFF POOL. Kayer hates her (docs/57 §4) and the cause is canon rather
    // than my guess: a small goat girl called her **"Short, Ugly, Weird, Smelly"** the
    // day they met, and was then adopted by Kayer's own mother.
    //
    // 🔑 THE EXACT CALIBRATION: she knows about the NICKNAME. She does not know it is
    // a GRUDGE. She thinks it is a running family joke - "it's our little thing" - and
    // Kayer has been carrying it for four centuries. That gap is the whole gag, and a
    // later editor must not close it by having her notice.
    near_art: [
      "That one's Kayer's! Oh, tell her I said hey. Tell her I said hey TWICE.",
      "Kayer's. Tell Short I said hey. She lets on she hates that. It's our little thing.",
      "- an' that's the Matriarch's, which means they're clever an' cold an' they didn't pick either of those, she did.",
      "She ain't never once written back. I keep sendin' things anyhow, it ain't a chore.",
      "Be kind to that one. She ain't. Somebody oughta be.",
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
      'across ' + (tags + ctxtags) + ' tags, accent written. Trust at ' + MEDIUM_AT +
      '/' + HIGH_AT + ' things built. ' + holds + '/4 hold contexts answered (no other ' +
      'god fills more than 2). Below the deep cutoff she does NOT speak - Caebrim does.')
  })
})();
