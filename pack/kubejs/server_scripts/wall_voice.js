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
  var HIGH_AT = 40

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
      "You have been gone eleven minutes. I counted.",
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
    on_blade: [
      "The Warrior is a plight on this land. He preaches strength and speed yet hides behind his veil.",
      "He speaks of champions. He has buried more than he has kept.",
      "Ask him about the veil. He will talk about something else.",
    ],
    on_salvage: [
      "I do not trust the Wolf in any manner. Perhaps once she was tolerable. Once.",
      "She will offer you a fair deal. That is how you will know.",
    ],
    on_forge: [
      "I have known the Goat for centuries. Centuries before he was what he was before. Across all transformations.",
      "He loved the goddess of death. Now? Now he's a shell.",
      "There is nothing left in him to talk to. I have tried.",
    ],
    on_art: [
      "The Matriarch has led us gods for centuries yet in that time she has never granted me a place amongst them.",
      "What did I do wrong?",
      "I was not invited. I was never invited.",
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

  VELDORA.wall = {
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
    var total = 0
    var written = 0
    var empty = []
    for (var k in LINES) {
      if (!LINES.hasOwnProperty(k)) continue
      total++
      if (LINES[k].length) {
        written++
        VELDORA.voice.registerLines(GOD, k, LINES[k])
      } else empty.push(k)
    }
    // 🚨 AN UNWRITTEN GOD IS LOUD, NOT SILENT. "loaded fine" and "has anything to
    // say" are different claims, and a subsystem that is configured on and produces
    // nothing is the failure mode this project keeps paying for.
    if (!written) {
      console.error(TAG + '0 of ' + total + ' pools written - THIS GOD HAS NO VOICE YET')
    } else if (empty.length) {
      console.warn(TAG + written + ' of ' + total + ' pools written. Still empty: ' +
        empty.join(', '))
    } else {
      console.info(TAG + 'The Spider speaks - all ' + total + ' pools written. ' +
        'Tiers at ' + MEDIUM_AT + '/' + HIGH_AT + '.')
    }
  })
})();
