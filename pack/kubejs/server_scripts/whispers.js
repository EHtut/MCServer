// whispers.js — E2f of the Path System build. docs/24, lines from docs/25 Part II
//
// THE AMBIENT LAYER. Not what the patron SAYS - what you NOTICE.
//
// Ethan, 2026-08-12: "sensory sounds, chain rattling, irritation, animal noises,
// etc to add more fluff to the patron's irritation."
//
// A different register from regard.js's dialogue. These are third person, present
// tense, in asterisks, and they only ever OBSERVE. The voice already exists in
// stalker.js and is Ethan's own:
//     *The goat whispers in a distinctly southern accent you don't get the reference*
//     *The spider attempts to have a tea party. The tea is all over the floor*
//     *AWOOOO*
// Atmospheric and absurd at once - deliberately NOT pure horror.
//
// ── ANCHORED REFRAINS: the reason this is not just a random pool ─────────────
// The Art writing agent produced the best structural idea in the whole design. It
// took Ethan's own canon line and made it MUTATE across the tiers:
//
//     tier 1   She wants you to sleep. She wants you to rest.
//     tier 2   She wants you to sleep. She wants you safe.
//     tier 3   She wants you to sleep now. She wants you warm.
//     tier 4   She wants you to sleep forever. She wants you here.
//
// The first half barely moves; the second drifts from "rest" to "here"; "forever"
// arrives only at the end. A player HEARS that change in a way they can never hear
// a random pool changing. So every patron gets one anchor line, and it fires often
// enough to be recognised - roughly one whisper in three.
//
// ── WHY THIS ONLY STARTS AFTER YOU HAVE BEEN DYING ───────────────────────────
// stalker.js already whispers on proximity and line of sight. A second unconditional
// source would double the chat noise and make both meaningless. This layer stays
// SILENT until regard reaches the first beat - it is pressure that arrives because
// you earned it, not weather.

var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  // ═══════════════════════════════════════════════════════════════════════════
  // 🪦 RETIRED 2026-08-15. Ethan: "Whispers can be scrapped for idle dialogue."
  //
  // They described a body that no longer exists. "The helm turns toward you. It
  // does not turn away" fired during the Harvest test, and nothing is turning any
  // more - the stalker retired the same afternoon. They were written for a creature
  // that follows you; idle.js speaks for a god that watches you.
  //
  // Kept rather than deleted: the four-line escalation-by-regard shape is a good
  // idea that the contextual system does not yet cover, and the lines themselves
  // are the only surviving writing for four gods who have no other voice yet.
  //
  // To revive: RETIRED = false.
  // ═══════════════════════════════════════════════════════════════════════════
  var RETIRED = true
  if (RETIRED) {
    ServerEvents.loaded(function () {
      console.info('[whispers] RETIRED - idle.js speaks for the gods now.')
    })
    return
  }

  var EVERY = 600                      // check each player every 30s
  var ANCHOR_CHANCE = 0.34             // ~1 whisper in 3 is the refrain

  // regard value -> tier. Mirrors regard.js's beats (10/30/50/70/100).
  var TIERS = [10, 30, 50, 70]
  var TIER_CHANCE = [0.08, 0.15, 0.25, 0.40]   // per 30s check, by tier

  // The mutating refrain, one per patron, tier 1..4. Art's and Wall's came from
  // the writing agents; the other four are DRAFTS built on each patron's strongest
  // sensory motif. Ethan's own writing outranks all of it.
  var ANCHOR = {
    blade: [
      'Somewhere, a helm turns toward you.',
      'The helm turns toward you. It does not turn away.',
      'The helm has not turned away for some time.',
      'He is not looking at you any more. He is looking at where you will be.',
    ],
    forge: [
      'A chain drags, somewhere far off.',
      'The chain is shorter than it was.',
      'The chain is taut.',
      'The chain is not moving. Neither is he.',
    ],
    salvage: [
      'Something is panting, a long way off.',
      'The panting keeps pace with you now.',
      'The panting is close enough to feel.',
      'The panting has stopped. She is holding her breath.',
    ],
    wall: [
      'The house breathes when you do.',
      'The breathing has a rhythm now. It matches yours.',
      'The breathing is in the room.',
      'Her breath mingles with yours.',
    ],
    crown: [
      'Somewhere, a page is turned.',
      'Somewhere, your name is written down.',
      'Somewhere, your name is underlined.',
      'The ledger closes.',
    ],
    art: [
      'She wants you to sleep. She wants you to rest.',
      'She wants you to sleep. She wants you safe.',
      'She wants you to sleep now. She wants you warm.',
      'She wants you to sleep forever. She wants you here.',
    ],
  }

  // The pools, curated in docs/25 Part II. Index 0..3 = tier 1..4.
  var POOL = {
    blade: [
      ['The wind sounds like old armor breathing', 'His blade considers you from a great distance'],
      ['He drags his sword through stone. Leaving a score', 'The fallen knight finds your technique insulting. So does his sword', 'SKKRRRRRREEEEE'],
      ['The dead knight attempts to settle. His armor disagrees. Loudly', 'CLANNNG CLANNNG CLANNNG'],
      ['He stands directly behind you. The armor no longer hides', 'He breathes. Or the armor does. The distinction has stopped mattering'],
    ],
    forge: [
      ['A faint bell chimes somewhere beyond the mountains', 'You feel watched. A goat does not approve of your output', 'Hooves. Distant. Deliberate.'],
      ['Chain scrapes closer. The goat has opinions about delays', 'Something is dragged that does not wish to be dragged', 'The bells smell like rust and failed quotas'],
      ['Chains snap taut. The goat curses in an impossible register', 'A sack shifts. Something inside shifts in answer.'],
      ['His breath behind you. It reeks of missed deadlines', 'BLEEEEEAT', 'The bells stop. Everything stops. He is deciding.'],
    ],
    salvage: [
      ['Awoooooo', 'Claws scrape stone somewhere far. Again. Again.'],
      ['She snuffles at your heels with the care of an appraiser.', 'Whine whine whine'],
      ['The hound whines with what sounds exactly like laughter.', 'She is so close her fur brushes your spine. You turn. Nothing.', 'Click click click'],
      ['Teeth click. Teeth click. She is smiling about this.', 'The wolf presses close, almost gentle. Almost grateful.', 'All that noise stops. Silence. Perfect readiness.'],
    ],
    wall: [
      ['Walls creak in patterns walls should not creak.', 'She knits the dark. The stitches glow faintly.'],
      ['Too many legs. The counting is wrong.', 'She attempts to learn to knock. She has too many joints.'],
      ['A leg extends from shadow. She is testing how close.', 'She tries to give you space. It is all her now.', 'Soft clicking. Like needles. Like waiting.'],
      ['The spider legs fold around you. Gentle. So gentle.', 'Something soft presses against your shoulders. It is everything.'],
    ],
    crown: [
      ['Something is being written down. Far away. Carefully.', 'Quills scratch against parchment. Someone keeps count.'],
      ['The procession has changed course. It will not go around.', 'Robes on stone. Bone on bone. The sound is patient.', 'Your actions are being noted. Everything is being noted.'],
      ['The ledger is being checked. Your name appears often.', 'The robed figure does not hurry. Patience is protocol.'],
      ['Each footfall marks a syllable in judgment.', 'Everything you have done is now accounted for.'],
    ],
    art: [
      ['Pages turn where no book exists, over and over', 'The air is warmer than it was a moment ago', 'A breath not your own, slightly out of step with yours'],
      ['Pages turn behind you. You turn around. There are no pages.', 'Everything has become very quiet. Exactly how quiet, you cannot say.', 'Your pillow was not this soft when you arrived'],
      ['You are so tired. When did you become so tired?', 'The blankets are tucking themselves around you. This is fine.'],
      ['Your eyelids are so heavy. She has made them kind.', 'Everything smells like home. You have never been here.', 'Being tucked in. Being held. Being found at last.'],
    ],
  }

  var recent = {}          // uuid -> last few lines, so a small pool does not loop

  function pathOf(p) {
    try { return p.persistentData.getString('veldora_path') || '' } catch (e) { return '' }
  }

  function tierOf(v) {
    var t = 0
    for (var i = 0; i < TIERS.length; i++) if (v >= TIERS[i]) t = i + 1
    return t                            // 0 = silent
  }

  function pick(uuid, pool) {
    var seen = recent[uuid] || []
    var fresh = pool.filter(function (l) { return seen.indexOf(l) < 0 })
    var from = fresh.length ? fresh : pool
    var line = from[Math.floor(Math.random() * from.length)]
    seen.push(line)
    while (seen.length > 3) seen.shift()
    recent[uuid] = seen
    return line
  }

  function whisper(server, p) {
    var key = pathOf(p)
    if (!key || !POOL[key]) return

    // Read regard through its own accessor rather than the NBT, so the decay is
    // paid down on read and this can never act on a stale value.
    var v = 0
    try {
      if (typeof VELDORA.regard === 'function') v = VELDORA.regard(server, p).value
      else return                       // no counter, no ambient. Silent, not wrong.
    } catch (e) { return }

    var tier = tierOf(v)
    if (tier < 1) return                // below the first beat this layer says nothing

    if (Math.random() > TIER_CHANCE[tier - 1]) return

    var line
    if (Math.random() < ANCHOR_CHANCE) {
      line = ANCHOR[key][tier - 1]      // the refrain - recognisable, and it CHANGES
    } else {
      line = pick(String(p.uuid), POOL[key][tier - 1])
    }
    try { VELDORA.voice.chat(p, '§8§o*' + line + '*') } catch (e) { }
    try { if (VELDORA.voice && typeof VELDORA.voice.aside === 'function') VELDORA.voice.aside(p, line) } catch (e) { }

  }

  ServerEvents.loaded(function (event) {
    console.info('[whispers] E2f active - ambient by regard tier, ' +
      Math.round(ANCHOR_CHANCE * 100) + '% anchored refrain, silent below regard ' + TIERS[0])

    function sweep(server) {
      try {
        var ps = server.players
        for (var i = 0; i < ps.length; i++) whisper(server, ps[i])
      } catch (e) { console.warn('[whispers] sweep threw :: ' + e) }
      server.scheduleInTicks(EVERY, function () { sweep(server) })
    }
    event.server.scheduleInTicks(EVERY, function () { sweep(event.server) })
  })

  // Admin: hearing tier 4 by dying seven times is not a review loop anybody runs.
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('whisper_test').requires(ADMIN)
      .then(Commands.argument('tier', event.arguments.INTEGER.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var t = ctx.getArgument('tier', Java.loadClass('java.lang.Integer'))
          var key = pathOf(p)
          if (!key || !POOL[key]) { p.tell(Text.of('§cYou walk no path.')); return 0 }
          if (t < 1 || t > 4) { p.tell(Text.of('§cTier 1-4.')); return 0 }
          p.tell(Text.of('§8§oANCHOR: *' + ANCHOR[key][t - 1] + '*'))
          var pool = POOL[key][t - 1]
          for (var i = 0; i < pool.length; i++) p.tell(Text.of('§8§o*' + pool[i] + '*'))
          return 1
        })))
  })
})()
