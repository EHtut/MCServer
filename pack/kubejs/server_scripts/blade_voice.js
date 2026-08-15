// blade_voice.js - THE WARRIOR'S LINES + his trust tiers.  docs/40
//
// The first god to get a real voice. Content written 2026-08-15; the grammar and
// the tiers are docs/40 PART 2 and PART 4.
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
    low_gift: [
      'Take this. You cannot yet feed yourself.',
      'Eat. A corpse is no use to me.',
      'Arrows, for hands too weak to make their own.',
      'Iron, since yours could not survive a single blow.',
      'I arm you the way one arms a child.',
      'This is charity, not reward. Do not confuse them.',
      'Take what I give. You have earned nothing.',
      'Bread, so you last long enough to fail properly.',
      'Even Icarus needed wax before he needed wings.',
      'Here. Try not to lose it in the first hour.',
    ],
    low_push: [
      'Go. Bleed somewhere useful.',
      'Move. Standing still will not make you stronger.',
      'Find something and lose to it. Learn why.',
      'Walk into danger. It is the only teacher I trust.',
      'Fight. I did not arm a statue.',
      'Go find your betters and be humbled.',
      'There is a fall waiting for you. Go meet it.',
      'Do not thank me. Go and bleed.',
      'Test the edge I gave you. On something that bites.',
      'Go. Disappoint me somewhere with witnesses.',
    ],
    medium_gift: [
      'A little iron. You have earned a little.',
      'Take this. Do not mistake it for trust.',
      'Fewer arrows this time. You are wasting fewer.',
      'This will do. Barely.',
      'I give less because you need less. Do not preen.',
      'Small mercy. It is still mercy.',
      'Take it. I am not proud of you.',
      'A scrap. You have climbed one rung.',
      'This is not praise. It is arithmetic.',
      'You broke less than expected. Here.',
    ],
    medium_test: [
      'I am testing you now. Do not embarrass me.',
      'You are past charity. Now you are examined.',
      'Something harder comes. Try not to fall.',
      'I am watching more closely now. Mind yourself.',
      'The easy part ends here.',
      'You have my attention. That is not a gift.',
      'Now I see what you are made of.',
      'The floor rises. Try to keep pace.',
      'I raise the height. Most fall from here.',
      'This is the test. Most think they have already passed it.',
    ],
    high_test: [
      'Something worse hunts you now. Good.',
      'I send you what I would fight myself.',
      'Let us see if the sky still holds you.',
      'This one will not go easy. Neither will I.',
      'You climb high enough to be worth killing.',
      'I send real danger now. Do not waste it.',
      'The sun is closer now. Feel it.',
      'Face this. I want to see if it breaks you.',
      'You are close enough to the height that falling matters.',
      'This is worth my attention. Do not waste that either.',
    ],
    // What he uses INSTEAD of praise. His highest praise is silence, so these are
    // the lines that acknowledge without ever approving.
    high_silence: [
      'I have nothing more to give you.',
      'Stand there. I am not required to say more.',
      'You are still standing. Note it yourself.',
      'I watched. That is all you get.',
      'Nothing broke. Say nothing about it.',
      'You did not fall. I noticed.',
      'There is nothing left to teach you here.',
      'Silence, from me, is the whole of it.',
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
      'Dead. As it should be.',
      "Good. One less parasite wearing someone else's strength.",
      'You did what was needed. Nothing more needs saying.',
      'It is done. I expected nothing less.',
      "The spider's champion falls. Unremarkable, as intended.",
      'Good.',
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
    ],
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
              "The Nightmare speaks little and rules the most.",
              "Her realm is magic. Her opinions are few.",
              "The shadow moves. The Nightmare rarely does.",
              "She leads five gods and argues with none of them.",
              "The Nightmare's silence says more than her voice.",
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
              "You are still standing here.",
              "Nothing moves. Not even you.",
              "This is not what strength looks like.",
              "You have been idle long enough to insult me.",
              "The ground remembers stillness. It does not reward it.",
              "You call this rest. I call it rot.",
              "Stillness suits corpses, not champions.",
              "You have not moved in some time.",
              "This is the version of you I despise.",
              "Doing nothing is its own kind of failure."
          ],
          "closes": [
              "Move, or explain why you have not.",
              "I do not have patience for statues.",
              "Stillness is the only thing I cannot forgive.",
              "Even the dust is doing more than you.",
              "This is how champions are forgotten.",
              "Silence would insult me less than this.",
              "Time is the only thing I never give back.",
              "Idle hands do not become legends.",
              "I have seen corpses with more urgency.",
              "Begin. Or do not call yourself a champion."
          ]
      }
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
    },
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
    if (!VELDORA.voice) {
      console.error(TAG + 'voice.js missing - The Warrior has no mouth')
      return
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
    console.info(TAG + 'The Warrior speaks - ' + n + ' fixed lines + ' + combo +
      ' combinatorial, across ' + tags + ' tags. Tiers at ' + MEDIUM_AT + '/' +
      HIGH_AT + ' slain.')
  })
})();
