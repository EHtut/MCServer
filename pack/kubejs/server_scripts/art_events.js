// art_events.js — what the Matriarch sends.  docs/53 · docs/54 §3 · docs/55
//
// ── ⭐ SHE IS THE RIGHT-HAND COLUMN, AND THAT IS THE WHOLE FILE ─────────────
// docs/23's taxonomy splits every event into five mechanics x two agencies. The left
// column is THINGS A GOD DOES; the right is THINGS A GOD ASKS FOR. Ethan, 2026-08-22:
//
//     "she's powerful but cannot physically touch the world, not really, so she needs
//      to manipulate the player into doing things for her."
//
// So she has FIVE ZEROES and they are all the forced column. Not a dial set low - a
// thing she is incapable of:
//
//     Challenges  0    she cannot spawn anything
//     Duels       0    nor offer to
//     Buffs       0    acting ON you unasked is the one thing she cannot do
//     Boons    ++++    her gift economy, and every gift is an appraisal
//     Invade      0    she cannot reach other players either
//     Attacks   +++    she asks YOU to do the hurting
//     Aids        0    -
//     Support    ++    she asks you to help someone, for her own reasons
//     Assassin.   0    🔑 SHE CANNOT COMPEL. The sharpest contrast with Blade there is
//     Contracts ++++   her signature: the errand
//
// ⚠️ THE CHART IS MINE, NOT ETHAN'S. He said "propose the chart, build her
// functional", so every 0 above is a ruling I made on his behalf. The SHAPE is
// derived from his own sentence; the NUMBERS are a guess and want his pass.
//
// ⭐ FOUR KINDS WHERE THE OTHERS HAVE EIGHT. Fewer, heavier, all asked. If she feels
// thin in play the fix is MORE CONTRACTS WITH DIFFERENT ERRANDS, never opening a
// forced kind - that would cost the only thing that makes her distinct.
//
// ── ⭐ HER EVENTS ARE ERRANDS ───────────────────────────────────────────────
// role `explorer`, counter `new biomes seen`, phase coefficient 3.0 - the highest of
// any path. She is already the only god whose progression is GOING SOMEWHERE, and
// combined with "cannot touch the world" that gives her the one shape nobody else
// has: Blade says fight HERE, Wall says stay home, Salvage says trade NOW, and Kayer
// says GO THERE AND DO THIS FOR ME. Wall pulls you home; she sends you out.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[artev] '
  var GOD = 'art'
  var GATE = true

  var ALL = ['low', 'medium', 'high']
  var MID_HIGH = ['medium', 'high']
  var HIGH = ['high']

  var ORDER_DAYS = 3
  var BOON_SECONDS = 240
  var ERRAND_MIN = 400        // how far away an errand is, in blocks
  var ERRAND_MAX = 900

  function wAlways(n) { return function () { return n } }

  function say(p, tag) {
    try { if (VELDORA.voice) return !!VELDORA.voice.say(p, GOD, tag) } catch (e) { }
    return false
  }

  function others(server, p) {
    var out = []
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        try { if (String(ps[i].username) !== String(p.username)) out.push(ps[i]) } catch (e) { }
      }
    } catch (e) { }
    return out
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BOONS - the gift economy. ALWAYS a choice, because she cannot put anything on
  // you unasked; and every gift is an appraisal rather than a kindness.
  //
  // ⚠️ high_gift IS CURRENTLY THE ONLY WARNING FOR cut_down (docs/55). Its lines say
  // "you are becoming difficult to replace, I am already thinking about that" - which
  // is the approach to her execution, carried by a gift pool by accident rather than
  // by design. If a dedicated warning pool is ever written, these stop being
  // load-bearing.
  // ═══════════════════════════════════════════════════════════════════════════
  function tierOf(p) {
    var n = 0
    try { if (VELDORA.counter) { var v = VELDORA.counter.get(p, GOD); if (v !== null) n = v } } catch (e) { }
    return n >= 25 ? 'high' : (n >= 8 ? 'medium' : 'low')
  }

  function evBoon(server, p) {
    if (!VELDORA.ritual) return false
    if (VELDORA.ritual.active(p)) return false
    var tier = tierOf(p)
    return VELDORA.ritual.begin(p, {
      lines: [
        VELDORA.voice ? (VELDORA.voice.line(GOD, tier + '_gift', p) || 'Take it.') : 'Take it.',
        'It is yours if you reach for it. I am not going to put it on you.',
      ],
      options: [
        { id: 'yes', label: 'Take it.' },
        { id: 'no', label: 'No.' },
      ],
      holdAfterChoice: 30,
      onChoose: function (player, id) {
        if (id !== 'yes') {
          // ⭐ REFUSAL COSTS NOTHING AND SHE SAYS SO. She cannot compel; pretending
          // otherwise by punishing a refusal would break the one rule she has.
          say(player, 'high_silence')
          return
        }
        var name = '?'
        try { name = String(player.username) } catch (e) { return }
        try {
          server.runCommandSilent('effect give ' + name + ' minecraft:strength ' + BOON_SECONDS + ' 0 false')
          server.runCommandSilent('effect give ' + name + ' minecraft:regeneration ' + Math.round(BOON_SECONDS / 4) + ' 0 false')
        } catch (e) { console.error(TAG + 'boon failed :: ' + e) }
        // She armed you, so release.js's window opens - same contract every other
        // god's gift honours.
        try {
          if (VELDORA.release) VELDORA.release.armed(server, player, GOD, BOON_SECONDS * 20)
        } catch (e) { }
      },
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACTS - the errand. Her signature, and the reason `killorder.js` was
  // extracted in the first place: "when a THIRD god wants one, extract it."
  // ═══════════════════════════════════════════════════════════════════════════
  function evContract(server, p) {
    if (!VELDORA.killorder) return false
    var rivals = others(server, p)
    if (!rivals.length) return false
    var t = rivals[Math.floor(Math.random() * rivals.length)]
    var tname = '?'
    try { tname = String(t.username) } catch (e) { return false }
    if (!VELDORA.killorder.open(server, p, GOD, tname)) return false
    if (VELDORA.voice) VELDORA.voice.sayAbout(p, GOD, 'contract_offer', { target: tname })
    return true
  }

  // ⭐ THE ERRAND PROPER - go THERE. No other god sends you anywhere, and this is the
  // mechanical form of "she cannot touch the world". A direction and a distance, and
  // the reward is on your return.
  function evErrand(server, p) {
    if (!VELDORA.ritual || VELDORA.ritual.active(p)) return false
    var dist = ERRAND_MIN + Math.floor(Math.random() * (ERRAND_MAX - ERRAND_MIN))
    var ang = Math.random() * Math.PI * 2
    var dx = Math.round(Math.cos(ang) * dist), dz = Math.round(Math.sin(ang) * dist)
    var ox = 0, oz = 0
    try { ox = Math.round(p.x); oz = Math.round(p.z) } catch (e) { return false }
    var tx = ox + dx, tz = oz + dz

    return VELDORA.ritual.begin(p, {
      lines: [
        VELDORA.voice ? (VELDORA.voice.line(GOD, 'guidance', p) || 'Go further out.') : 'Go further out.',
        'There is something ' + dist + ' blocks from here, near ' + tx + ', ' + tz + '.',
        'I cannot go and get it. That is the entire reason you exist to me.',
      ],
      options: [
        { id: 'yes', label: 'I will go.' },
        { id: 'no', label: 'No.' },
      ],
      holdAfterChoice: 30,
      onChoose: function (player, id) {
        if (id !== 'yes') { say(player, 'low_silence'); return }
        try {
          player.persistentData.putInt('veldora_art_errand_x', tx)
          player.persistentData.putInt('veldora_art_errand_z', tz)
        } catch (e) { }
        console.info(TAG + player.username + ' took an errand to ' + tx + ', ' + tz +
          ' (' + dist + ' blocks)')
      },
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTACKS + SUPPORT - she asks YOU to act on somebody else. Both are the same
  // shape: she cannot reach another player, so she reaches you and points.
  // ═══════════════════════════════════════════════════════════════════════════
  function evAttack(server, p) {
    if (!VELDORA.ritual || VELDORA.ritual.active(p)) return false
    var rivals = others(server, p)
    if (!rivals.length) return false
    var t = rivals[Math.floor(Math.random() * rivals.length)]
    var tname = '?'
    try { tname = String(t.username) } catch (e) { return false }
    return VELDORA.ritual.begin(p, {
      lines: [
        tname + ' is becoming a problem I cannot solve from here.',
        'Slow them down. You will not be thanked and I will not explain.',
      ],
      options: [
        { id: 'yes', label: 'Done.' },
        { id: 'no', label: 'No.' },
      ],
      holdAfterChoice: 30,
      onChoose: function (player, id) {
        if (id !== 'yes') { say(player, 'low_silence'); return }
        try {
          server.runCommandSilent('effect give ' + tname + ' minecraft:slowness 45 0 false')
          // 🔴 THE CROWN ALIAS, MISSED FOR THE THIRD TIME. Found by
          // tools/completeness.py 2026-08-23, which expands a concatenated tag over
          // every god instead of reporting the stub. `crown` aliases wall in
          // coefficients.js, warn.js, grudge.js and paths.js - and it was missing
          // here, so Kayer hindering a Crown walker resolved to `demand_crown`, a
          // pool that has never existed, and she said nothing.
          //
          // ⚠️ Same defect, same shape, third file. Resolved through the alias rather
          // than by writing a fifth pool, so the two can never drift.
          if (VELDORA.voice) {
            var tp = ''
            try { tp = (VELDORA.paths && VELDORA.paths.pathOf(t)) || '' } catch (e) { }
            if (tp === 'crown') tp = 'wall'
            VELDORA.voice.say(t, GOD, 'demand_' + (tp || 'blade'))
          }
        } catch (e) { }
      },
    })
  }

  function evSupport(server, p) {
    if (!VELDORA.ritual || VELDORA.ritual.active(p)) return false
    var rivals = others(server, p)
    if (!rivals.length) return false
    var t = rivals[Math.floor(Math.random() * rivals.length)]
    var tname = '?'
    try { tname = String(t.username) } catch (e) { return false }
    return VELDORA.ritual.begin(p, {
      lines: [
        tname + ' is going to die out there, and I have use for them yet.',
        'Keep them breathing. Not for their sake.',
      ],
      options: [
        { id: 'yes', label: 'Fine.' },
        { id: 'no', label: 'No.' },
      ],
      holdAfterChoice: 30,
      onChoose: function (player, id) {
        if (id !== 'yes') { say(player, 'low_silence'); return }
        try {
          server.runCommandSilent('effect give ' + tname + ' minecraft:regeneration 30 0 false')
          server.runCommandSilent('effect give ' + tname + ' minecraft:absorption 120 0 false')
        } catch (e) { }
      },
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ HER TRIAL — and the one design problem worth reading before touching it.
  //
  // docs/63 §6 makes art a COMBATANT path, so she ranks by Trial like blade and
  // salvage. But this file's entire premise is that she has FIVE ZEROES on the forced
  // column because - Ethan, 2026-08-22 - "she's powerful but cannot physically touch
  // the world, not really." She cannot spawn things. That is not a dial set low.
  //
  // 🔑 SO SHE DOES NOT SEND IT. SHE TELLS IT WHERE YOU ARE.
  //
  // The Persecutor is not hers and was never hers. It already existed, somewhere, and
  // she is an Oracle with perfect information and a mouth. Pointing is not touching.
  // That keeps her constraint completely intact while still producing a fight - and
  // it is a better version of the Trial than "your god sends a champion", because it
  // is the only one in the game where the thing hunting you was never anybody's.
  //
  // ⚠️ The distinction has to survive in the WRITING or it is just a spawn with a
  // fancy comment. Every line below is about her having spoken, never about her
  // having sent. If a future editor writes "I am sending something", that is the
  // whole character gone.
  //
  // ⚠️ ACTOR PROBED LIVE, not read off a lang file: `data get entity
  // @e[type=born_in_chaos_v1:scarlet_persecutor,limit=1]` parses and answers "No
  // entity was found", which is a real registered type. The lang-file lesson
  // (magistuarmory:bronze_ingot) is why this is stated.
  //
  // 🚨 NOT nightmare_stalker - that is RESERVED as Caebrim's form (docs/57 §2) and
  // no path may cast it.
  var TRIAL_ACTOR = 'born_in_chaos_v1:scarlet_persecutor'
  var TRIAL_TAG = 'veldora_art_trial'
  var QQ = String.fromCharCode(39)
  var TRIAL_COLOUR = '§b§l'      // hers, matching art_voice.js. Pale blue, nothing warm.

  // [CLAUDE-DRAFT] art/trial_scene
  // Cold, bored, already-seen. She is not threatening you - she is telling you what
  // is about to happen, which is worse, and she has known for some time.
  var TRIAL_SCENE = [
    'Something is coming. I did not send it - I do not send things.',
    'I simply mentioned where you were, to something that wanted to know.',
    'I have already watched how this goes. Several times.',
    'Do not ask me which way it went. Earn it.',
  ]

  function trialArrive(server, p) {
    if (!VELDORA.spawner) {
      console.error(TAG + 'spawner.js missing - her Trial cannot arrive')
      return false
    }
    try {
      if (VELDORA.ritual && VELDORA.ritual.active(p)) {
        console.info(TAG + 'Trial held for ' + p.username + ' - already in a scene')
        return false
      }
    } catch (e) { }

    var opened = false
    if (VELDORA.ritual && typeof VELDORA.ritual.begin === 'function') {
      opened = VELDORA.ritual.begin(p, { colour: TRIAL_COLOUR, lines: TRIAL_SCENE, options: [] })
    }
    // The actor lands AFTER the scene, never during it - the last thing that happens
    // is her finishing, not something swinging.
    var after = (opened ? (20 + TRIAL_SCENE.length * 50 + 40) : 0) + 40

    server.scheduleInTicks(after, function () {
      try {
        VELDORA.spawner.wave(p, {
          ids: [TRIAL_ACTOR], count: 1, minDist: 12, maxDist: 20,
          nbt: '{Tags:["' + TRIAL_TAG + '"],CustomNameVisible:1b,CustomName:' + QQ +
            '{"text":"The Persecutor","color":"aqua","bold":true}' + QQ + '}',
        }, function (placed) {
          // ⚠️ "placed 0" and "could not measure" must not read the same. A Trial that
          // silently never arrived would leave a player waiting at the threshold with
          // their clock already reset.
          if (placed === 0) {
            console.error(TAG + '!! her Trial actor PLACED NOTHING for ' + p.username +
              ' - no valid spot. They are owed a Trial and did not get one.')
          } else {
            console.info(TAG + 'her Trial arrived for ' + p.username + ' (' + placed + ')')
          }
        })
      } catch (e) { console.error(TAG + 'Trial spawn threw :: ' + e) }
    })
    return true
  }

  function trialWin(server, p) { say(p, 'harvest_won') }
  function trialLose(server, p) { say(p, 'harvest_lost') }

  // ═══════════════════════════════════════════════════════════════════════════
  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'the Matriarch is GATED OFF'); return }
    if (!VELDORA.events) { console.error(TAG + 'godevents.js missing'); return }

    // ⚠️ EVERY ONE OF THESE IS `kind: choice-side`. There is deliberately no event
    // registered under challenge/buff/invade/aid/assassination - see the header. The
    // boot report below prints the zeroes so an absent kind and a decided-zero kind
    // are never confused, which docs/23 §VI.0 requires.
    VELDORA.events.register(GOD, {
      id: 'boon', kind: 'boon', scene: true, run: evBoon, hostile: false,
      cooldown: 1, weight: wAlways(4), tiers: ALL,
      does: 'BOON (choice) - strength + regeneration, ASKED. Refusing costs nothing',
    })
    VELDORA.events.register(GOD, {
      id: 'errand', kind: 'contract', scene: true, run: evErrand, hostile: false,
      cooldown: 2, weight: wAlways(4), tiers: ALL,
      does: 'CONTRACT (choice) - the ERRAND. Sends you 400-900 blocks away. Nothing ' +
        'else in the pantheon moves you across the map',
    })
    VELDORA.events.register(GOD, {
      id: 'commission', kind: 'contract', run: evContract, hostile: false,
      cooldown: 4, weight: wAlways(2), tiers: MID_HIGH,
      does: 'CONTRACT (choice) - a kill order on another champion, via killorder.js',
    })
    VELDORA.events.register(GOD, {
      id: 'hinder', kind: 'attack', scene: true, run: evAttack, hostile: false,
      cooldown: 3, weight: wAlways(3), tiers: MID_HIGH,
      does: 'ATTACK (choice) - she asks YOU to slow another player. She cannot reach them',
    })
    VELDORA.events.register(GOD, {
      id: 'preserve', kind: 'support', scene: true, run: evSupport, hostile: false,
      cooldown: 3, weight: wAlways(2), tiers: HIGH,
      does: 'SUPPORT (choice) - she asks you to keep a RIVAL alive, for her own reasons',
    })

    // 🔴 SHE HAD NO TRIAL HANDLER UNTIL NOW, AND IT WAS A LIVE BUG. From Ethan's own
    // session, 2026-08-23: "[harvest] no handler for art - the Harvest fired and
    // nothing was sent. That is a bug, not a quiet Harvest." He crossed the threshold
    // and the game did nothing. docs/62 §1.
    if (VELDORA.harvest) {
      VELDORA.harvest.register(GOD, {
        arrive: trialArrive, onWin: trialWin, onLose: trialLose, tag: TRIAL_TAG,
      })
    } else console.error(TAG + 'harvest.js missing - her Trial will not arrive')

    if (VELDORA.killorder) {
      VELDORA.killorder.register(GOD, {
        days: ORDER_DAYS,
        onSettle: function (server, p) { say(p, 'medium_gift') },
        onLapse: function (server, p) { say(p, 'harvest_lost') },
      })
    }

    event.server.scheduleInTicks(1, function () {
      console.info(TAG + 'The Matriarch sends: boon, errand (400-900 blocks), ' +
        'commission (kill order), hinder (slow a rival), preserve (heal a rival). ' +
        'FIVE events, all of them ASKED.')
      console.info(TAG + 'she will NEVER do: challenges, duels, buffs, invasions, ' +
        'aids, assassinations - she cannot touch the world, so the entire FORCED ' +
        'column is zero. That is the character, not a gap. Chart proposed by Claude ' +
        '2026-08-22 (docs/54 s3) and wants his pass.')
    })
  })
})();
