// art_voice.js — the Matriarch's lines.  docs/53 (brief) · docs/54 (chart) · docs/55
//
// Kayer Alice Rysor. The most powerful undead ever raised by the goddess of death; an
// ice witch in life; publicly the leader of the gods against her maker, and in truth
// the only one who loves her.
//
// ── 🚨 SHE IS COLD. THAT IS THE WHOLE BRIEF ────────────────────────────────
// Ethan, 2026-08-22: "kayer needs to be cold and sound cold and almost cruel... We
// can insult the player too."
//
// A first draft was rejected as "too light" because the brief it was written from
// said "unfailingly warm, and it is never kindness" - and WARM is what came out. She
// is not warm-pretending-to-be-cold. She is cold. Insults are IN CHARACTER. Cruelty
// is delivered at room temperature and she never raises her voice.
//
// She still ASKS rather than commands, because she cannot compel anyone - but the
// asking is contemptuous. She asks the way a surgeon asks for an instrument.
//
// ── ⭐ TWO REGISTERS, SPLIT BY DEPTH ───────────────────────────────────────
// Nobody else in the pantheon changes voice with LOCATION:
//
//     surface     composed, clinical, performing being a god
//     underground OPENLY IRRITATED - she has had to come down herself
//
// Her deep pools live in deep_speaker.js, because SHE IS HER OWN SPEAKER. Every other
// god sends a stand-in; hers is her, annoyed. docs/53 §3.
//
// ── ⭐ SHE DOES NOT GIVE SECRETS ───────────────────────────────────────────
// Ethan, 2026-08-22: "cut all of them and rewrite, kayer does not give secrets."
//
// Every other god's `rare_*` pool is where they slip - Wall's past leaks, Blade
// becomes a person. HERS ARE WHERE SHE CATCHES YOU FISHING AND SHUTS IT DOWN. A
// character who almost tells you is ordinary; one who notices you listening is not.
//
// 🔑 CONSEQUENCE, for whoever writes her next: the truth about her devotion can NEVER
// be learned from her mouth. If it is ever revealed it comes from somewhere else.
//
// ⚠️ EVERY LINE HERE IS A DRAFT (docs/55) and is registered in docs/51 for Ethan's
// pass. He notices the difference between his voice and a generated one, and so will
// players - these exist so the mechanics can be built and tested, not to be final.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[art] '
  var GOD = 'art'
  var COLOUR = '§b§l'          // pale blue. The ice witch, and nothing warm.

  // Trust is the COUNTER: new biomes seen. ⚠️ A FIRST GUESS - replace with a measured
  // curve once there is play data rather than arguing about the numbers.
  var MEDIUM_AT = 8
  var HIGH_AT = 25

  var LINES = {
    // [CLAUDE-DRAFT] art/guidance · art/low_silence · art/high_silence
    // [CLAUDE-DRAFT] art/combat · art/returned
    // ⭐ EVERY GUIDANCE LINE POINTS AWAY FROM HERE. She is the errand god - the only
    // patron who moves you across the map, while Wall pulls you home. docs/54 §2.
    guidance: [
      'Source pools do not fill themselves. Go dig some.',
      'You will not find glyphs standing here. Walk.',
      'Essence is scattered. So is your attention. Fix one of those.',
      'A ritual needs a circle. A circle needs work. Go do it.',
      'There is nothing left to learn from me today. Leave.',
      'Archwood does not grow near me. That should tell you something.',
      'Every apprentice thinks the answer is closer than it is. It is not.',
      'Go further out. The easy sources are already spent.',
    ],
    low_silence: [
      'Nothing.',
      'I have nothing for you yet. Come back when that changes.',
      "You haven't done enough to warrant words.",
      'Speak to someone who cares what you did today. Not me.',
    ],
    // ⭐⭐ SILENCE IS FORESIGHT. docs/53 §4 upgraded this pool from apathy to
    // surveillance; the book canon (docs/58 §5) upgrades it again, and further.
    //
    // She was formed from the THREE ORACLES - Past, Present and Future - reunited, and
    // Ethan's phrase for it is divination "in the most brutal sense": she does not plan
    // using foresight, she has SEEN THE WHOLE THING, including the end, and chosen it.
    //
    // 🔑 So she is not watching you. SHE ALREADY WATCHED. Years ago. That is a colder
    // thing than surveillance and nobody else in the pantheon can do it - and it is
    // why his note on her first POV says she is "serene and BORED, not seething".
    // There is no suspense anywhere in her life.
    high_silence: [
      'I already know how this goes. Saying it would only slow you down.',
      'Nothing to say. Everything to see. Those are not the same and I have both.',
      'I watched this a long time ago. Go on.',
      "There is nothing you can do in front of me that I have not already had time to get bored of.",
      "I don't need to speak to know what you did. Or what you are going to.",
    ],
    // ⚠️ REWRITTEN AGAINST docs/58 §4. Ethan on his own weakest voice: she "rides the
    // Homelander archetype... the template does the work, so the uniquely-Kayer verbal
    // print stays thin." Three lines here were exactly that - "Finish it. Now.",
    // "That opening was obvious.", "You are slower than the last one" - stock menace
    // any cold villain in any story could say.
    //
    // 🔑 THE TEST, and it applies to every future line of hers: does it touch the
    // FORESIGHT, the FOLD, ALICE, CAEBRIM, or the two daughters? If it touches none of
    // them, the archetype is writing itself and the line is replaceable.
    combat: [
      "Don't die. It's inconvenient for me.",
      'I have already seen how this ends. Get there.',
      "You will step left. You always step left. Do it faster this time.",
      'Efficient. Barely.',
      "I am not worried. I am incapable of being worried. Try to find that comforting.",
    ],
    returned: [
      'You went somewhere. Nothing here noticed.',
      'Back. Fine.',
      "I didn't wonder where you went. Don't mistake this for that.",
      "Time passed. You're still adequate. Barely.",
    ],

    // [CLAUDE-DRAFT] art/low_gift · art/medium_gift · art/high_gift
    // ⭐ THE GIFT LADDER IS AN APPRAISAL, NOT AFFECTION. The warmer she sounds, the
    // closer the champion is to being too capable to control - and high_gift is
    // currently carrying the entire warning for `cut_down`, which docs/55 flags as
    // load-bearing by accident rather than by design.
    low_gift: [
      'Take it. Try not to lose it in the first hour.',
      'A starting tool. Everyone gets one. Few keep it long.',
      'This costs me nothing to give. Remember that.',
      'Small hands need small things. Here.',
      "I don't expect this to matter. Take it anyway.",
    ],
    medium_gift: [
      'You did something correct. This is the reward for that, not for you.',
      'Better work earns better tools. Simple arithmetic.',
      "You've stopped being useless. This reflects that, narrowly.",
      'Consider this a raised ceiling, not a compliment.',
      'Fewer hands could do what you did. Take this and keep doing it.',
    ],
    high_gift: [
      'This is more than I give most. Note the word most.',
      'You are becoming difficult to replace. I am already thinking about that.',
      'Few champions reach this. Fewer enjoy what comes after.',
      "Take it. You've earned the attention, which is worse than earning nothing.",
      "I'm running out of things to withhold from you. That should concern you more than it does.",
    ],

    // [CLAUDE-DRAFT] art/harvest_won · art/harvest_lost · art/cut_down
    harvest_won: [
      'You passed. I did not expect that, and I do not enjoy being wrong.',
      'That was almost adequate. Almost is new, for you.',
      'The trial is behind you. What comes next is worse.',
    ],
    harvest_lost: [
      "You failed. I'm not surprised, and I'm not disappointed. Disappointment requires expectation.",
      "That's the end of it, then. I'll find another hand.",
      "Some fail quietly. You didn't even manage that.",
    ],
    // ⭐ THE POOL NOTHING ELSE IN THE PANTHEON HAS. Every other god RELEASES a champion
    // for failing; she comes and kills one for SUCCEEDING. docs/53 §2 - her release
    // condition is capability, and it is the only cap that can keep up with Ars.
    cut_down: [
      "You got too good at this. I don't reward that. I end it.",
      'This was never going to end with you retiring somewhere warm. You knew that. I know you knew that.',
      "You were the closest thing I've had to a hand of my own. That's exactly the problem.",
      'No speech. No last lesson. You already learned the one that mattered: everything I lend, I take back.',
      "Hold still. I've done this before, and it goes faster when you don't fight it.",
    ],

    // [CLAUDE-DRAFT] art/contract_offer
    // ⚠️ art_events.js calls sayAbout(GOD, 'contract_offer') and this pool did not
    // exist - the commission would have opened a real kill order and said NOTHING.
    // Caught by grepping the tags the events file CONSUMES against the tags the
    // voice file DEFINES, which is the same diff that found the tide's missing
    // speaker herald an hour ago.
    contract_offer: [
      '{target} is in my way. I would move them myself. You know why I cannot.',
      'Kill {target}. I am asking, which is more courtesy than the request deserves.',
      'There is a name I want removed. {target}. Three days.',
      '{target}. Before the week turns. I will not explain and you will not ask.',
    ],

    // [CLAUDE-DRAFT] art/demand_blade · art/demand_wall · art/demand_salvage
    // ⭐ SHE SPEAKS TO OTHER GODS' CHAMPIONS. Nothing else does. She has no authority
    // over them and asks anyway, which is exactly what a manipulator with no hands
    // does - and it is the mechanic that unblocks docs/49 §1 B without needing the
    // ruling that has been holding it. docs/54 §4d.
    demand_blade: [
      "You don't answer to me. Answer anyway. It's faster.",
      "Your god isn't here. I am. Draw your own conclusions.",
      "I asked. That was the courtesy. There isn't a second one.",
      "Blade's champion, doing Blade's work, standing in front of me. Interesting choices.",
    ],
    // ⚠️ ALSO A MERA POOL (docs/58 §0), and colder than the others for it - she is
    // shorter with Wall's champion than with anybody else's, and will not say why.
    demand_wall: [
      "You belong to Wall. That's not an argument, it's a fact I'm setting aside.",
      "She isn't watching right now. I am. Use the difference.",
      "I don't need you to be loyal. I need you to be useful for one minute.",
      "Wall's champion. I'll keep this brief, for both our sakes.",
      "Of all of them, hers. Fine. Stand there and let me get through this.",
    ],
    demand_salvage: [
      "Salvage would tell you this is a bad trade. She'd be right. Do it anyway.",
      "You work for the honest one. I'm not going to pretend I am. Do it regardless.",
      "One task. She'd have told you the price first. I won't.",
      "Salvage's champion. Tell her I said hello. Tell her nothing else.",
    ],
  }

  var CONTEXT = {
    // [CLAUDE-DRAFT] art/loc_above · art/rare_loc_above
    loc_above: [
      'Nothing is happening. That is usually preferable.',
      'The sky is doing what it does. So am I.',
      'Stand there if you like. It changes nothing.',
      'This place is quiet. I prefer it that way.',
      'I have no orders for you. Find your own use.',
    ],
    // ⭐ SHE DOES NOT LEAK. Every other god's rare pool opens them up; hers is where
    // she notices you listening and closes. See the header.
    rare_loc_above: [
      "I had hands once. Warm ones. I don't discuss the rest.",
      'Ice meant something simpler, before. That is the entire story and you have had all of it.',
      'You are waiting for me to continue. I have noticed. I am not going to.',
      'There was a before. There is no version of this where I describe it to you.',
    ],

    // 🚫 NO `loc_below` OR `rare_loc_below`, DELIBERATELY. Underground she speaks as
    // her own deep speaker (deep_speaker.js) in a different register entirely, and an
    // ordinary calm underground line would undercut the one thing that makes her
    // distinct - that descending changes her voice. If she ever needs a composed
    // underground line, that is a decision to take on purpose, not a gap to fill.

    // [CLAUDE-DRAFT] art/near_blade · art/near_wall · art/near_salvage
    // 🔑 SHE MADE HIM. docs/58 §3 - the naming convention gives Blade as "Gregor
    // KAYER Court", and a falsehood's middle name is the maker. docs/15 calls his
    // deference to her a mystery; it is not one. She will not spell it out.
    near_blade: [
      'Blade thinks strength has to come from your own arm. Naive, but I understand the appeal.',
      "He defers to me and he has never once asked himself why. I would rather he didn't start.",
      "He'll tell you my gifts make you weaker. He's wrong about most things.",
      'Ask him why he still needs a champion, if his own arm is so sufficient.',
    ],
    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 THIS IS THE MERA POOL, AND IT IS THE MOST LOADED THING SHE HAS. docs/58 §0.
    //
    // Wall is MERA - Alice and Arkh's genetic heir - and Kayer's core wound, in her own
    // words: "I am the daughter of Alice, not her." On a news broadcast Mera is hailed
    // as the possible "real daughter of our master Alice" and Kayer snaps the TV off in
    // fury. "WE ARE HER CHILDREN!"
    //
    // ⭐ Alice made Kayer "in the image of the one she loved most, out of the bones of
    // the one she loved most" - and she is still denied the title, while the one who
    // simply INHERITED it gets it for free.
    //
    // ⚠️ AND SHE CANNOT SAY ANY OF THAT to a stranger. She never gives secrets (Ethan's
    // ruling, docs/53). So these lines are the pressure with the cause sealed inside:
    // she talks about Wall's champion and cannot stop talking about lineage.
    //
    // 🚨 DO NOT LET HER NAME ALICE HERE. That is a confession, and she does not make
    // them. The wound shows in what she keeps circling, not in what she admits.
    near_wall: [
      'Wall will love you the way she loves everything. Completely, and past the point you wanted it.',
      "That one was born into it. Some of us were assembled. I am told the difference does not matter.",
      "She grieves everyone before they're gone. Exhausting to watch. Worse to receive.",
      "Ask her sometime whose daughter she is. Ask her slowly. I want it to take a while.",
      "Don't let her hold on too long. She doesn't know how to stop.",
      "She inherited hers. Every single thing I have, I was given, and giving can be revoked.",
    ],
    near_salvage: [
      'Salvage will tell you the truth and then let you walk away from it. Unusual, for one of us.',
      "She's the only one who means it when she says you can go.",
      "Trade with her if you must. She won't lie to sweeten it.",
    ],
  }

  ServerEvents.loaded(function (event) {
    if (!VELDORA.voice) { console.error(TAG + 'voice.js missing'); return }
    VELDORA.voice.setColour(GOD, COLOUR)
    var n = 0, tags = 0
    for (var k in LINES) {
      if (!LINES.hasOwnProperty(k)) continue
      if (VELDORA.voice.registerLines(GOD, k, LINES[k])) { n += LINES[k].length; tags++ }
    }
    var ctxn = 0
    for (var c in CONTEXT) {
      if (!CONTEXT.hasOwnProperty(c)) continue
      if (VELDORA.voice.registerLines(GOD, c, CONTEXT[c])) { ctxn += CONTEXT[c].length; tags++ }
    }
    if (!n && !ctxn) {
      console.error(TAG + 'THE MATRIARCH HAS NO VOICE - every pool is empty')
    } else {
      console.info(TAG + 'The Matriarch speaks - ' + n + ' fixed + ' + ctxn +
        ' contextual, across ' + tags + ' tags. Tiers at ' + MEDIUM_AT + '/' +
        HIGH_AT + ' biomes. Underground she speaks as her OWN deep speaker, ' +
        'in a different register - see deep_speaker.js.')
    }
  })
})();
