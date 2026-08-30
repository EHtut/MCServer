// blade_events.js - THE WARRIOR'S EVENTS.  docs/40 PART 10
//
// The first two of his twelve. Both run on godevents.js, so the cadence, the
// one-at-a-time lock, the cooldowns and THE HEALTH FLOOR are not this file's
// problem - it only says what happens.
//
//   1. THE GAUNTLET  escalating waves, scaled by trust. The reward for surviving
//                    is that he says NOTHING.
//   2. THE MARK      his signature. Name a rival champion of a hostile god, one
//                    to two days, a buff if they die, and if they do not - he
//                    grumbles and that is all.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[bladeev] '
  var GOD = 'blade'

  // ── THE GAUNTLET ───────────────────────────────────────────────────────────
  // docs/23 PART VI #1: "escalating waves, narrated. The reward for surviving is
  // that he says nothing."
  //
  // Scaled by trust, which is the whole point of the tiers: at LOW he is training
  // you, at HIGH he is testing you, and the wave sizes say so without a word.
  var GAUNTLET = {
    low: { waves: 2, size: 3, gap: 200 },
    medium: { waves: 3, size: 4, gap: 200 },
    high: { waves: 5, size: 6, gap: 240 },
  }
  var GAUNTLET_ROSTER = [
    'born_in_chaos_v1:decaying_zombie',
    'born_in_chaos_v1:decrepit_skeleton',
    'born_in_chaos_v1:baby_skeleton',
  ]
  // At HIGH the last wave brings something that is not a mob you have seen all day.
  var GAUNTLET_ELITE = ['born_in_chaos_v1:fallen_chaos_knight']

  function runGauntlet(server, p, tier) {
    var cfg = GAUNTLET[tier] || GAUNTLET.low
    if (!VELDORA.spawner) { console.error(TAG + 'no spawner'); return false }

    // Announce BEFORE anything spawns. 23 §2: a raid you saw coming is content,
    // the same raid unannounced is a bug report.
    if (VELDORA.voice) {
      VELDORA.voice.say(p, GOD, tier === 'high' ? 'high_test' : (tier === 'medium' ? 'medium_test' : 'low_push'))
    }

    var name = '?'
    try { name = String(p.username) } catch (e) { }
    var sent = 0

    for (var w = 0; w < cfg.waves; w++) {
      (function (waveIndex) {
        server.scheduleInTicks(waveIndex * cfg.gap, function () {
          try {
            if (!p.isAlive()) return
            var last = (waveIndex === cfg.waves - 1)
            var ids = (last && tier === 'high') ? GAUNTLET_ELITE : GAUNTLET_ROSTER
            var n = last ? cfg.size : Math.max(2, cfg.size - (cfg.waves - 1 - waveIndex))
            if (last && tier === 'high') n = 1        // the elite arrives alone
            VELDORA.spawner.wave(p, { ids: ids, count: n })
          } catch (e) { console.warn(TAG + 'gauntlet wave threw :: ' + e) }
        })
      })(w)
      sent++
    }

    // 🔑 THE REWARD FOR SURVIVING IS THAT HE SAYS NOTHING.
    // At high trust he permits himself one oblique line - which is the trust arc
    // paying out. Below that, silence, and the silence is the point.
    var endAt = cfg.waves * cfg.gap + 200
    server.scheduleInTicks(endAt, function () {
      try {
        if (!p.isAlive()) return
        if (tier === 'high' && VELDORA.voice) VELDORA.voice.say(p, GOD, 'high_silence')
      } catch (e) { }
    })

    console.info(TAG + 'Gauntlet on ' + name + ' - tier ' + tier + ', ' +
      sent + ' waves of ~' + cfg.size)
    return true
  }

  // ── THE MARK ───────────────────────────────────────────────────────────────
  // docs/40 PART 4.5. He despises a champion of a god he is HOSTILE to, names
  // them, and gives one to two days.
  //
  // 🔑 THE REFUSAL COSTS NOTHING, AND THAT IS THE MECHANIC. A god who punishes you
  // for sparing a friend forces the fight and poisons a four-player server. One
  // who merely grumbles leaves it a real choice - and choosing not to becomes a
  // thing you did rather than a thing you avoided.
  var HOSTILE_TO = ['wall', 'crown']       // crown until the reset folds it into wall
  var MARK_DAYS = 2
  var K_TARGET = 'veldora_mark_target'
  var K_DUE = 'veldora_mark_due'           // world day, offset by one

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  // A rival champion of a hostile god who is ONLINE. Offline players are not
  // targets - a deadline you cannot act on is a punishment, not a choice.
  function findTarget(server, p) {
    var me = ''
    try { me = String(p.uuid) } catch (e) { return null }
    var out = []
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var o = players[i]
        try { if (String(o.uuid) === me) continue } catch (e) { continue }
        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(o) || '' } catch (e) { }
        if (path && HOSTILE_TO.indexOf(path) >= 0) out.push(o)
      }
    } catch (e) { }
    if (!out.length) return null
    return out[Math.floor(Math.random() * out.length)]
  }

  function runMark(server, p, tier) {
    var t = findTarget(server, p)
    if (!t) {
      // No rival online. NOT a failure of the event - there is simply nobody to
      // hate today, and returning false keeps the slot open for when there is.
      console.info(TAG + 'Mark: no champion of a hostile god online')
      return false
    }
    var today = dayNow(server)
    if (today === null) return false

    var tname = '?'
    try { tname = String(t.username) } catch (e) { return false }
    try {
      p.persistentData.putString(K_TARGET, tname)
      p.persistentData.putInt(K_DUE, today + MARK_DAYS + 1)
    } catch (e) { return false }

    if (VELDORA.voice) VELDORA.voice.sayAbout(p, GOD, 'mark_declare', { target: tname })

    // ⭐ THE WARNING (docs/49 §2). The Mark is Blade NAMING another god's champion,
    // so it is an assassination declaration and the target's god hears about it.
    // 🔑 This is the ONLY live trigger today: his `contract` event is held on an
    // empty pool and killorder reports him deliberately absent, so the Mark is how
    // the whole retaliation family can actually be exercised right now.
    try {
      if (VELDORA.warn) VELDORA.warn.incoming(server, GOD, tname)
    } catch (e) { console.warn(TAG + 'warn layer threw :: ' + e) }

    console.info(TAG + 'Mark on ' + p.username + ' -> ' + tname + ', due day ' + (today + MARK_DAYS))
    return true
  }

  // Kill attribution. A marked target dying to the marked player resolves it.
  EntityEvents.death(function (event) {
    try {
      var victim = event.entity
      if (!victim || !victim.player) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      var want = ''
      try { want = killer.persistentData.getString(K_TARGET) || '' } catch (e) { return }
      if (!want) return
      var vname = ''
      try { vname = String(victim.username) } catch (e) { return }
      if (vname !== want) return

      try {
        killer.persistentData.putString(K_TARGET, '')
        killer.persistentData.putInt(K_DUE, 0)
      } catch (e) { }
      if (VELDORA.voice) VELDORA.voice.say(killer, GOD, 'mark_success')

      // ⭐ A CONTRACT is the same kill, bought rather than ordered - so it resolves
      // through this exact hook and only differs in that it pays. docs/23 §VI.0.
      // ⚠️ tierOf() does NOT exist in this file - blade_voice.js owns it and
      // publishes VELDORA.blade.tier. Reading it any other way is how a null tier
      // silently becomes 'low' and quietly underpays every contract.
      try {
        var kt = 'low'
        try { if (VELDORA.blade && VELDORA.blade.tier) kt = VELDORA.blade.tier(killer) || 'low' } catch (x) { }
        payContract(killer, kt)
      } catch (e) { console.warn(TAG + 'payContract threw :: ' + e) }

      // The reward. Maintenance-grade and temporary - he does not hand out power
      // you did not earn (docs/40 PART 7).
      try {
        var srv = killer.server
        srv.runCommandSilent('effect give ' + killer.username + ' minecraft:strength 600 0 false')
        srv.runCommandSilent('effect give ' + killer.username + ' minecraft:resistance 600 0 false')
        // ⭐ HE ARMED YOU. release.js counts the gifts you waste - die with this on
        // and it is a strike, four in a row and he is done (Ethan, 2026-08-16).
        // 600 SECONDS above, so 12000 TICKS here. Getting that conversion wrong is
        // the difference between a 10-minute window and a 30-second one.
        try {
          if (VELDORA.release) VELDORA.release.armed(srv, killer, GOD, 600 * 20)
          else console.warn(TAG + 'release.js missing - the mark reward arms NOTHING')
        } catch (e2) { console.warn(TAG + 'arm threw :: ' + e2) }
      } catch (e) { console.warn(TAG + 'mark reward failed :: ' + e) }
      console.info(TAG + 'Mark resolved - ' + killer.username + ' killed ' + vname)
    } catch (e) { console.warn(TAG + 'mark death hook threw :: ' + e) }
  })

  // The deadline. Checked on a slow tick; expiry costs NOTHING but a line.
  function markSweep(server) {
    try {
      var today = dayNow(server)
      if (today === null) { server.scheduleInTicks(1200, function () { markSweep(server) }); return }
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        var want = ''
        try { want = p.persistentData.getString(K_TARGET) || '' } catch (e) { continue }
        if (!want) continue
        var due = 0
        try { due = p.persistentData.getInt(K_DUE) } catch (e) { continue }
        if (!due) continue
        if (today < (due - 1)) continue          // still time

        try {
          p.persistentData.putString(K_TARGET, '')
          p.persistentData.putInt(K_DUE, 0)
        } catch (e) { }
        // ⭐ No penalty. He grumbles.
        if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'mark_ignored')
        console.info(TAG + 'Mark expired for ' + p.username + ' (target ' + want + ') - no penalty')
      }
    } catch (e) { console.warn(TAG + 'markSweep threw :: ' + e) }
    server.scheduleInTicks(1200, function () { markSweep(server) })
  }


  // ── ICARUS ─────────────────────────────────────────────────────────────────
  // docs/23 PART VI #2: "above y100 he sends fliers. The one event that punishes
  // going UP."
  //
  // 🔑 His myth made mechanical. Every other event in the pack punishes going DOWN,
  // because the whole depth loop rewards descending - this is the only one that
  // says the sky is his too, and it is the god of Icarus saying it.
  var ICARUS_Y = 100
  var FLIERS = ['minecraft:phantom', 'born_in_chaos_v1:bloody_gadfly',
    'born_in_chaos_v1:bone_imp']
  var ICARUS_COUNT = { low: 3, medium: 4, high: 6 }

  function aboveTheLine(server, p) {
    try { return p.y >= ICARUS_Y } catch (e) { return false }
  }

  function runIcarus(server, p, tier) {
    if (!VELDORA.spawner) return false
    if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'icarus')
    var n = ICARUS_COUNT[tier] || 3
    // Spawned closer than a ground wave: fliers cover the distance instantly, and
    // a ring at 40 blocks would arrive as a surprise rather than as a warning.
    VELDORA.spawner.wave(p, { ids: FLIERS, count: n, minDist: 12, maxDist: 24 })
    console.info(TAG + 'Icarus on ' + p.username + ' at y' + Math.round(p.y) +
      ' - ' + n + ' fliers')
    return true
  }

  // ── HOLLOW VICTORY ─────────────────────────────────────────────────────────
  // docs/23 PART VI #7: "a full wave that drops NOTHING, announced as such."
  //
  // 🔑 THE ANNOUNCEMENT IS THE ENTIRE EVENT. An unannounced dropless wave is a bug
  // report; an announced one is a statement about why you fight. 23 §2 is explicit
  // that difficulty is good when it is legible and chosen.
  var HOLLOW_TAG = 'veldora_hollow'
  var HOLLOW_COUNT = { low: 4, medium: 5, high: 7 }

  function runHollow(server, p, tier) {
    if (!VELDORA.spawner) return false
    if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'hollow')
    var n = HOLLOW_COUNT[tier] || 4
    VELDORA.spawner.wave(p, {
      ids: GAUNTLET_ROSTER, count: n,
      nbt: '{Tags:["' + HOLLOW_TAG + '"]}',
    })
    console.info(TAG + 'Hollow Victory on ' + p.username + ' - ' + n + ' that pay nothing')
    return true
  }

  // The suppression. EntityEvents.drops is proven in paths.js.
  // ⚠️ Tags are read defensively: if the tag cannot be read the drops are LEFT
  // ALONE, because silently eating a player's loot is far worse than an event that
  // failed to be hollow.
  EntityEvents.drops(function (event) {
    try {
      var e = event.entity
      if (!e) return
      var tags = null
      try { tags = e.tags } catch (x) { return }
      if (!tags) return
      var has = false
      try { has = tags.contains ? tags.contains(HOLLOW_TAG) : (String(tags).indexOf(HOLLOW_TAG) >= 0) } catch (x) { return }
      if (has) event.cancel()
    } catch (e) { }
  })

  // ── THE BROKEN RUNG ────────────────────────────────────────────────────────
  // docs/23 PART VI #10: "three of whatever killed you wait at your respawn."
  //
  // REACTIVE, not swept: it fires from the respawn hook rather than the sweep, so
  // it is requested by name and the framework still applies its cooldown.
  //
  // 🔑 It is legal by construction under the health floor - you respawn at full
  // hearts, so the rule and the event agree without being made to.
  var K_KILLER = 'veldora_lastkiller'
  var RUNG_COUNT = 3

  EntityEvents.death(function (event) {
    try {
      var victim = event.entity
      if (!victim || !victim.player) return
      var src = event.source ? event.source.entity : null
      if (!src) return
      var id = ''
      try { id = String(src.type) } catch (e) { return }
      // String(entity.type) is NOT the bare id - the spawner learned this the hard
      // way. Pull a namespaced id out of whatever shape it renders as.
      var m = id.match(/([a-z0-9_.-]+:[a-z0-9_./-]+)/)
      if (!m) return
      if (m[1].indexOf('minecraft:player') >= 0) return    // PvP is the Mark, not this
      try { victim.persistentData.putString(K_KILLER, m[1]) } catch (e) { }
    } catch (e) { }
  })

  function runBrokenRung(server, p, tier) {
    var killer = ''
    try { killer = p.persistentData.getString(K_KILLER) || '' } catch (e) { }
    if (!killer) return false
    if (!VELDORA.spawner) return false
    if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'broken_rung')
    VELDORA.spawner.wave(p, { ids: [killer], count: RUNG_COUNT, minDist: 14, maxDist: 26 })
    try { p.persistentData.putString(K_KILLER, '') } catch (e) { }
    console.info(TAG + 'Broken Rung on ' + p.username + ' - ' + RUNG_COUNT + ' x ' + killer)
    return true
  }

  // ⚠️ RE-ENABLED 2026-08-15 after Ethan's diagnosis: "the issue is stemming from
  // anything that messes with respawn mechanics. Not necessarily what happens after
  // a respawn."
  //
  // That line draws the right boundary. instant_respawn.js INTERCEPTED the respawn
  // and moved the player - it is deleted. The Broken Rung only READS that a respawn
  // happened and then sends a wave; it never touches where or whether you respawn.
  //
  // Kept behind a flag anyway. If a join ever hangs again this is one edit, and
  // "it only reacts" is a claim about code, not a guarantee about a client.
  var RESPAWN_HOOK = true

  PlayerEvents.respawned(function (event) {
    if (!RESPAWN_HOOK) return
    var p = event.player
    if (!p) return
    var server = null
    try { server = p.server } catch (e) { }
    if (!server) return
    // Delayed so it lands after the respawn settles rather than over the top of it.
    // ⚠️ The second half of this note used to read "and so instant_respawn has
    // finished moving the player" - that file was DELETED in eb900e3 and nothing
    // moves a respawning player any more. The delay is still right, for the first
    // reason alone.
    server.scheduleInTicks(120, function () {
      try {
        if (!p.isAlive()) return
        var killer = ''
        try { killer = p.persistentData.getString(K_KILLER) || '' } catch (e) { }
        if (!killer) return
        if (VELDORA.events) VELDORA.events.attempt(p.server, p, true, 'broken_rung')
      } catch (e) { console.warn(TAG + 'broken rung hook threw :: ' + e) }
    })
  })


  // ── SHARPEN ────────────────────────────────────────────────────────────────
  // docs/23 PART VI #11: "temporary damage buff; spawns quadruple for its
  // duration, stated up front."
  //
  // ⭐ THE ONLY EVENT OF HIS TWELVE THAT IS UNAMBIGUOUSLY A BARGAIN (23 §3b) - good
  // for you, and YOU choose. So it runs through the ritual, exactly as Salvage's
  // trades do, and the price is named before it is paid. `23` §2: every cost is
  // named before it is paid, and a raid you chose to provoke is content.
  //
  // The difference from her trades is who benefits. She takes a piece of you and
  // gives you something. He gives you something and makes the world harder - the
  // price is not paid TO him, it is paid to whatever comes.
  var SHARP_SECONDS = 180
  var SHARP_WAVE_EVERY = 400          // 20s
  var SHARP_WAVE_SIZE = { low: 2, medium: 3, high: 4 }

  function runSharpen(server, p, tier) {
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    if (VELDORA.ritual.active(p)) return false

    var size = SHARP_WAVE_SIZE[tier] || 2
    var mins = Math.round(SHARP_SECONDS / 60)

    return VELDORA.ritual.begin(p, {
      lines: [
        'You are swinging like a man who expects to live.',
        'I can fix that. Strength, for as long as it lasts.',
        'And everything within a mile will come to see what changed.',
        'Three minutes. Say yes or do not waste my time.',
      ],
      options: [
        { id: 'yes', label: 'Sharpen me.' },
        { id: 'no', label: 'Not now.' },
      ],
      holdAfterChoice: 40,
      onChoose: function (player, id) {
        if (id !== 'yes') {
          if (VELDORA.voice) VELDORA.voice.say(player, GOD, 'idling')
          return
        }
        var name = '?'
        try { name = String(player.username) } catch (e) { }
        var granted = 0
        try {
          server.runCommandSilent('effect give ' + name + ' minecraft:strength ' +
            SHARP_SECONDS + ' 1 false')
          granted++
        } catch (e) { console.error(TAG + 'sharpen buff failed :: ' + e) }
        if (!granted) {
          // Took nothing, so nothing is owed - but say so rather than going quiet.
          if (VELDORA.voice) VELDORA.voice.say(player, GOD, 'medium_gift')
          return
        }

        // ⭐ HE ARMED YOU. Only on the branch where the buff ACTUALLY LANDED - a
        // sharpen that failed to apply must not arm a window, or the player takes a
        // strike for dying with a gift they never received.
        try {
          if (VELDORA.release) VELDORA.release.armed(server, player, GOD, SHARP_SECONDS * 20)
          else console.warn(TAG + 'release.js missing - sharpen arms NOTHING')
        } catch (e2) { console.warn(TAG + 'arm threw :: ' + e2) }

        // The price, and it starts immediately. Stated up front, so this is the
        // bargain being honoured rather than a trap being sprung.
        var waves = Math.floor((SHARP_SECONDS * 20) / SHARP_WAVE_EVERY)
        for (var w = 1; w <= waves; w++) {
          (function (n) {
            server.scheduleInTicks(n * SHARP_WAVE_EVERY, function () {
              try {
                if (!player.isAlive()) return
                if (VELDORA.spawner) {
                  VELDORA.spawner.wave(player, { ids: GAUNTLET_ROSTER, count: size })
                }
              } catch (e) { }
            })
          })(w)
        }
        console.info(TAG + 'Sharpen on ' + name + ' - ' + mins + 'm Strength II, ' +
          waves + ' waves of ' + size)
      },
      onTimeout: function (player) {
        if (VELDORA.voice) VELDORA.voice.say(player, GOD, 'idling')
      },
    })
  }

  // ── FIRST BLOOD ────────────────────────────────────────────────────────────
  // docs/23 PART VI #4: "the next mob you strike gets x3 health. 60s, or the wave
  // arrives."
  //
  // A DEMAND, not a bargain: you did not choose it, and both outcomes cost you -
  // kill it fast, or fight the wave you earned by being slow.
  var FB_FLAG = 'veldora_firstblood'         // player: armed
  var FB_WINDOW = 1200                       // 60s
  var FB_MULT = 3
  var armed = {}                             // uuid -> true, in memory

  function runFirstBlood(server, p, tier) {
    var uuid = null
    try { uuid = String(p.uuid) } catch (e) { return false }
    armed[uuid] = true
    if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'first_blood')

    server.scheduleInTicks(FB_WINDOW, function () {
      try {
        if (!armed[uuid]) return               // they struck something; it is live
        delete armed[uuid]
        if (!p.isAlive()) return
        // Sixty seconds and they did not swing at anything. The wave arrives.
        if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'first_blood_late')
        if (VELDORA.spawner) {
          VELDORA.spawner.wave(p, { ids: GAUNTLET_ROSTER, count: 4 })
        }
      } catch (e) { }
    })
    return true
  }

  // The next thing they hit gets three times the health. beforeHurt is the proven
  // hook (stalker.js); `hurt` does not exist.
  EntityEvents.beforeHurt(function (event) {
    try {
      var victim = event.entity
      if (!victim || victim.player || !victim.living) return
      var attacker = event.source ? event.source.player : null
      if (!attacker) return
      var uuid = null
      try { uuid = String(attacker.uuid) } catch (e) { return }
      if (!armed[uuid]) return
      delete armed[uuid]

      var max = 20
      try { max = victim.getAttribute('minecraft:generic.max_health').getValue() } catch (e) { }
      try {
        victim.modifyAttribute('minecraft:generic.max_health',
          'mcserver:veldora_firstblood', max * (FB_MULT - 1), 'add_value')
        victim.setHealth(max * FB_MULT)
      } catch (e) { console.warn(TAG + 'first blood scaling failed :: ' + e) }
      if (VELDORA.voice) VELDORA.voice.say(attacker, GOD, 'first_blood_hit')
      console.info(TAG + 'First Blood - ' + attacker.username + ' struck something at x' + FB_MULT)
    } catch (e) { }
  })

  // ── THE DUEL ───────────────────────────────────────────────────────────────
  // docs/23 PART VI #3: "one named elite, no adds. Flee and he taunts for a full
  // day."
  //
  // HIGH TRUST ONLY. This is the fight he offers a champion he respects, and the
  // taunt for fleeing is the only lasting consequence in his whole set - which is
  // why it costs a day of comment rather than anything mechanical.
  var DUEL_ELITE = 'born_in_chaos_v1:fallen_chaos_knight'
  var DUEL_CHECK = 200                       // 10s
  var DUEL_FLEE_DIST = 64                    // player-to-CHALLENGER, not to origin
  var DUEL_LEASH = 40                        // past this the challenger is pulled back
  var DUEL_RETURN = 12                       // ...to this many blocks in front of you
  var DUEL_TIMEOUT = 6000                    // 5 minutes

  function runDuel(server, p, tier) {
    if (!VELDORA.spawner) return false
    // ⚠️ Needed by the watcher's selectors below. Read ONCE here rather than inside
    // the loop - a stale player handle can throw on .username, and this must not be
    // the thing that kills a duel already in progress.
    var name = ''
    try { name = String(p.username) } catch (e) { return false }
    if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'duel')

    var r = VELDORA.spawner.wave(p, {
      ids: [DUEL_ELITE], count: 1, minDist: 10, maxDist: 16,
      nbt: '{Tags:["veldora_duel"],CustomNameVisible:1b,CustomName:\'{"text":"The Challenger\\u0027s Champion","color":"dark_red","bold":true}\'}',
    })

    // ═══════════════════════════════════════════════════════════════════════
    // 🚨 THE DUEL ACCUSED PEOPLE OF FLEEING A MOB THAT HAD WANDERED OFF.
    //
    // Liam, live 2026-08-22: "blade gives me one opponent to fight it wanders off
    // and he gives me shit for it. tf is his deal" ... "HE WASNT ANYWHERE NEAR ME"
    //
    // He is completely right, and there were THREE causes stacked:
    //
    //  1. FLEEING WAS MEASURED FROM WHERE THE PLAYER STOOD, not from the
    //     challenger. Walk 64 blocks in ANY direction and he taunts you - including
    //     walking straight TOWARDS the thing you were told to kill.
    //  2. NOTHING KEPT THE CHALLENGER NEAR YOU. It is an ordinary mob; it
    //     pathfinds, wanders, falls in a hole. Its behaviour became your cowardice.
    //  3. IT MAY NEVER HAVE ARRIVED AT ALL. DUEL_ELITE is fallen_chaos_knight -
    //     the exact mob from Ethan's "asked 1, measured 0" placement failure. The
    //     ground-finder landed 2026-08-18, but before it, a duel could taunt you
    //     for running from something that was never spawned.
    //
    // Now: distance is measured to the CHALLENGER, he is LEASHED so he keeps
    // coming, and if he is gone the duel is simply void. Blade does not get to
    // call you a coward for his own champion's pathfinding.
    // ═══════════════════════════════════════════════════════════════════════
    var elapsed = 0

    // Present anywhere in the loaded world? `execute if entity` is the same probe
    // spawner.js validates ids with, and it cannot throw the way a JS entity scan
    // can on a stale handle.
    function challengerLives(srv) {
      try {
        return String(srv.runCommand('execute if entity @e[tag=veldora_duel,limit=1]'))
          .indexOf('passed') >= 0
      } catch (e) { return false }
    }
    // Within `dist` of the player specifically.
    function challengerNear(srv, name, dist) {
      try {
        return String(srv.runCommand('execute as ' + name + ' at @s if entity ' +
          '@e[tag=veldora_duel,distance=..' + dist + ',limit=1]')).indexOf('passed') >= 0
      } catch (e) { return false }
    }

    function watch() {
      try {
        if (!p.isAlive()) return
        var srv = p.server
        elapsed += DUEL_CHECK

        if (!challengerLives(srv)) {
          // Killed, despawned, or never arrived. NOT fleeing, and he says nothing -
          // a taunt here is the bug Liam reported.
          console.info(TAG + 'Duel: the challenger is gone - ' + p.username +
            ' is not taunted for it')
          return
        }

        if (!challengerNear(srv, name, DUEL_LEASH)) {
          // ⭐ HIS CHAMPION, HIS PROBLEM. Drag it back in front of the player
          // rather than blaming them for the distance. ^ ^ ^N is local space, so
          // this puts it in FRONT of where they are looking - which reads as the
          // thing stalking them, not teleport jank behind their head.
          try {
            srv.runCommandSilent('execute as ' + name + ' at @s run tp ' +
              '@e[tag=veldora_duel,limit=1] ^ ^ ^' + DUEL_RETURN)
            console.info(TAG + 'Duel: challenger strayed past ' + DUEL_LEASH +
              ' - pulled back to ' + p.username)
          } catch (e) { }
        } else if (!challengerNear(srv, name, DUEL_FLEE_DIST)) {
          // It is near enough to matter and they are still outside the flee
          // radius FROM IT. That is a real refusal, and only now does he speak.
          if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'duel_fled')
          console.info(TAG + 'Duel: ' + p.username + ' stayed away from the challenger')
          return
        }

        if (elapsed >= DUEL_TIMEOUT) return
        srv.scheduleInTicks(DUEL_CHECK, watch)
      } catch (e) { }
    }
    p.server.scheduleInTicks(DUEL_CHECK, watch)

    console.info(TAG + 'Duel on ' + p.username + ' - one elite, flee radius ' + DUEL_FLEE_DIST)
    return true
  }


  // ── THE HARVEST: HIS CHALLENGE ─────────────────────────────────────────────
  // docs/40 PART 8. Every other god COLLECTS. He GRADUATES you.
  //
  // 🔑 It is the only Harvest that can be WON, and that is what separates the god
  // of war from four gods who feed on you: he wanted a champion, not a meal.
  //
  // 🔑 And the offer to stay is the whole character spent at once. He tells you he
  // does not need you constantly - then at the one moment he could keep you, he
  // asks.
  var CHAMPION = 'born_in_chaos_v1:fallen_chaos_knight'
  var CHAMPION_TAG = 'veldora_harvest_champion'
  var K_TRIAL = 'veldora_blade_trial'        // uuid of the champion, while it lives
  var Q = String.fromCharCode(39)            // a single quote that cannot be mangled

  // ⭐ A CUTSCENE, NOT A CHAT LINE. Ethan wrote the Harvest opening as a fixed
  // sequence, so it runs through the RITUAL - blind, rooted, staggered - which is
  // the one thing in the pack that can hold a player still and make them read.
  //
  // It is also the only time he talks about himself. He had a champion once, and
  // that man is gone, and his end was merciful. He does not explain further, and
  // the silence at the end of it is deliberate: the scene stops before the answer.
  var HARVEST_SCENE = [
    'You have proven yourself capable.',
    'In a sense I feel almost proud.',
    'However, to slay the goddess of death we will need more.',
    'Centuries ago I had a champion. A man who stood by my side above all else.',
    'He is long since gone.',
    'His end merciful.',
  ]

  function harvestArrive(server, p) {
    if (!VELDORA.spawner) return false

    // 🚨 REFUSE IF A SCENE IS ALREADY RUNNING, do not push through it. The Speaker's
    // confession is the first AUTONOMOUS ritual in the game - every earlier one was
    // player-initiated, so a collision was not really possible and this used to just
    // skip the cutscene and spawn the champion anyway. That would now drop the
    // strongest thing Blade has on a player who is blind, rooted and 35 seconds from
    // being released.
    //
    // Returning false means harvest.js does NOT stamp it as begun and the phase
    // sweep tries again later, which is the rule this file already lives by: a
    // Harvest that did not arrive did not happen.
    try {
      if (VELDORA.ritual && VELDORA.ritual.active(p)) {
        console.info(TAG + 'Harvest held for ' + p.username + ' - already in a scene')
        return false
      }
    } catch (e) { }

    var opened = false
    if (VELDORA.ritual && typeof VELDORA.ritual.begin === 'function') {
      opened = VELDORA.ritual.begin(p, {
        lines: HARVEST_SCENE,
        options: [],                 // no choice. This is not an offer.
        onTimeout: function () { },
      })
    }
    // ⚠️ TIMED OFF THE RITUAL'S OWN CONSTANTS, not off a number that looked right.
    // ritual.js: LEAD 20 + lines x GAP 50 + TAIL 40, and a scene with no options
    // releases at exactly that. Hard-coding 420 here would have put the silence
    // AFTER the world came back, which is the one thing it must not do.
    var sceneEnd = opened ? (20 + (HARVEST_SCENE.length * 50) + 40) : 0
    if (opened) {
      // The silence lands inside the dark, 40t after his last line and 40t before
      // release. It IS the end of the cutscene; Ethan marked the beat himself.
      server.scheduleInTicks(sceneEnd - 40, function () {
        // Grey italic - the same narration style the introduction uses. It is not
        // him speaking, and that is the whole point of the beat.
        try { p.tell(Text.of('§7§oYou feel a heavy silence.')) } catch (e) { }
      })
    }
    // Then the world returns, and only then the order.
    server.scheduleInTicks(sceneEnd + 40, function () {
      try { VELDORA.voice.chat(p, '§4§lFace him and win.') } catch (e) { }
    })

    var spawnAt = sceneEnd + 80
    server.scheduleInTicks(spawnAt, function () {
      var r = VELDORA.spawner.wave(p, {
        ids: [CHAMPION], count: 1, minDist: 12, maxDist: 20,
        // Built with a quote CONSTANT rather than escapes. The NBT wants single
        // quotes around a JSON text component, and every attempt to escape those
        // through a tool chain mangled them. A char code cannot be mangled.
        nbt: '{Tags:["' + CHAMPION_TAG + '"],CustomNameVisible:1b,CustomName:' + Q +
          '{"text":"The Strongest He Has","color":"dark_red","bold":true}' + Q + '}',
      }, function (placed) {
        // The half that answers "did it ARRIVE", which is only knowable a second
        // later. See the issued() note in spawner.js - this rescue used to test
        // r.placed synchronously, where it is ALWAYS null, and so never ran.
        if (placed !== 0) return
        console.error(TAG + '!! Harvest champion did not ARRIVE for ' + p.username +
          ' - releasing the lock so the sweep retries')
        try { p.persistentData.putString('veldora_harvest_active', '') } catch (e) { }
        if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'harvest_open')
      })
      // 🚨 THE DEFERRED-ARRIVAL HAZARD. harvestArrive now returns true BEFORE the
      // champion exists, so harvest.js has already stamped the Harvest as begun. If
      // placement then fails the player is locked in a Harvest with nothing to
      // fight - exactly the state harvest.js refuses to create synchronously. So
      // the failure is caught HERE and the lock is released, which puts the phase
      // sweep back in charge and it retries. A Harvest that did not arrive did not
      // happen.
      try {
        if (!VELDORA.spawner.issued(r)) {
          console.error(TAG + '!! Harvest champion was REFUSED by the spawner for ' +
            p.username + ' - releasing the lock so the sweep retries')
          try { p.persistentData.putString('veldora_harvest_active', '') } catch (e) { }
          if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'harvest_open')
        }
      } catch (e) { console.warn(TAG + 'harvest arrival check threw :: ' + e) }
    })
    console.info(TAG + 'Harvest scene opened for ' + p.username + ' (' +
      (opened ? HARVEST_SCENE.length + ' lines, ends ' + sceneEnd + 't' : 'NO SCENE - ritual busy') +
      ') - champion arrives at ' + spawnAt + 't')
    return true
  }

  // Winning is killing it. The tag is how we know which corpse mattered.
  EntityEvents.death(function (event) {
    try {
      var victim = event.entity
      if (!victim || victim.player) return
      var tags = null
      try { tags = victim.tags } catch (x) { return }
      if (!tags) return
      var has = false
      try { has = tags.contains ? tags.contains(CHAMPION_TAG) : (String(tags).indexOf(CHAMPION_TAG) >= 0) } catch (x) { return }
      if (!has) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      if (VELDORA.harvest) VELDORA.harvest.resolve(killer.server, killer, true)
    } catch (e) { console.warn(TAG + 'harvest kill hook threw :: ' + e) }
  })

  // Losing is dying to it. Dying at all while a Harvest is active counts - he does
  // not care what technically landed the blow, only that you did not survive it.
  EntityEvents.death(function (event) {
    try {
      var victim = event.entity
      if (!victim || !victim.player) return
      if (!VELDORA.harvest || !VELDORA.harvest.active(victim)) return
      VELDORA.harvest.resolve(victim.server, victim, false)
    } catch (e) { }
  })

  // ⚠️ The closing lines are DELAYED. They fire from the death hook, so undelayed
  // they print above "Rehykt was slain by..." and read as commentary arriving too
  // early. The god speaks after the world has finished saying what happened.
  function harvestWin(server, p) {
    // He releases you. The path is set down, and this is the ONE exit that is not
    // a failure - docs/40 PART 9 leaves the fall and absence as the others.
    server.scheduleInTicks(20, function () {
      try { if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'harvest_won') } catch (e) { }
    })
    server.scheduleInTicks(80, function () {
      try { if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'harvest_offer') } catch (e) { }
    })
    // 🚨 THIS LINE USED TO BE A LIE. It logged "released" while nothing released
    // anything - the path stayed claimed and the player stayed his. Winning is the
    // one honest exit in his design and it did not work.
    //
    // The release lands AFTER both closing lines, so he finishes speaking before the
    // world tells everyone. He offers the stay; taking it is re-claiming the path.
    server.scheduleInTicks(140, function () {
      try {
        if (VELDORA.paths && typeof VELDORA.paths.release === 'function') {
          VELDORA.paths.release(server, p)
        } else {
          console.error(TAG + '!! cannot release ' + p.username +
            ' - VELDORA.paths.release is missing. They WON and are still bound.')
        }
      } catch (e) { console.error(TAG + 'release threw :: ' + e) }
    })
    console.info(TAG + p.username + ' WON the Harvest - releasing in 140t, and offered the stay')
  }

  function harvestLose(server, p) {
    // A trust hit, and it is INTENDED. The test is meant to be failed before it is
    // passed - a setback, never a revocation.
    server.scheduleInTicks(20, function () {
      try { if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'harvest_lost') } catch (e) { }
    })
    try {
      if (VELDORA.counter) {
        var cur = VELDORA.counter.get(p, GOD)
        if (cur !== null) VELDORA.counter.add(p, GOD, -Math.ceil(cur * 0.25), 'harvest lost')
      }
    } catch (e) { console.warn(TAG + 'trust hit failed :: ' + e) }
    console.info(TAG + p.username + ' lost the Harvest - trust down a quarter, path kept')
  }



  // ── THE TITHE OF STEEL ─────────────────────────────────────────────────────
  // docs/23 PART VI #6: "double durability loss for a day. Fight with a ruined
  // blade."
  //
  // 🚨 THERE IS NO ITEM-DAMAGE EVENT. Checked against the whole ItemEvents registry
  // (23 PART V.7): crafted, smelted, pickedUp, dropped, destroyed, foodEaten,
  // canPickUp, entityInteracted, the clicks, tooltips. Nothing fires when an item
  // TAKES damage - only when it is finally destroyed.
  //
  // So it is SAMPLED, not hooked: watch the held item's damage on a tick, and when
  // it rises by d, add another d. That is genuinely double loss rather than an
  // approximation of it.
  //
  // ⚠️ IT NEVER LANDS THE KILLING BLOW. Our added damage is capped so the item
  // always survives with at least 1 durability - the player's own next swing
  // breaks it. Doubling someone's wear is the event; reaching into their inventory
  // and destroying an enchanted weapon outright is a bug report wearing an event's
  // name, and the difference is entirely in who struck last.
  var TITHE_DAYS = 1
  var TITHE_TICK = 20                        // 1s - fine enough to catch each swing
  var K_TITHE = 'veldora_tithe_until'        // world day, offset by one
  var titheSeen = {}                         // uuid -> {id, dmg}

  function runTithe(server, p, tier) {
    var today = dayNow(server)
    if (today === null) return false
    try { p.persistentData.putInt(K_TITHE, today + TITHE_DAYS + 1) } catch (e) { return false }
    if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'tithe')
    console.info(TAG + 'Tithe of Steel on ' + p.username + ' until day ' + (today + TITHE_DAYS))
    return true
  }

  function titheActive(p, today) {
    var v = 0
    try { v = p.persistentData.getInt(K_TITHE) } catch (e) { return false }
    if (!v) return false
    var until = v - 1
    // A stamp from the future means the clock moved (admins run /time set).
    if (until - today > TITHE_DAYS) {
      try { p.persistentData.putInt(K_TITHE, 0) } catch (e) { }
      return false
    }
    if (today > until) {
      try { p.persistentData.putInt(K_TITHE, 0) } catch (e) { }
      if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'tithe_over')
      return false
    }
    return true
  }

  function titheSweep(server) {
    try {
      var today = dayNow(server)
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        var uuid = null
        try { uuid = String(p.uuid) } catch (e) { continue }
        if (today === null || !titheActive(p, today)) { delete titheSeen[uuid]; continue }

        var st = null
        try { st = p.mainHandItem } catch (e) { continue }
        if (!st) { delete titheSeen[uuid]; continue }
        var id = '', dmg = null, max = 0
        try { id = String(st.id) } catch (e) { continue }
        if (!id || id === 'minecraft:air') { delete titheSeen[uuid]; continue }
        try { dmg = st.damageValue; max = st.maxDamage } catch (e) { }
        if (typeof dmg !== 'number' || typeof max !== 'number' || max <= 0) {
          delete titheSeen[uuid]
          continue
        }

        var prev = titheSeen[uuid]
        // A different item means a different history - never carry a delta across
        // a swap, or sheathing a pickaxe would "cost" the sword its wear.
        if (!prev || prev.id !== id) { titheSeen[uuid] = { id: id, dmg: dmg }; continue }

        var d = dmg - prev.dmg
        if (d > 0) {
          // Cap so at least 1 durability survives. We double the wear; we do not
          // land the final blow.
          var room = (max - 1) - dmg
          var add = Math.max(0, Math.min(d, room))
          if (add > 0) {
            try { st.damageValue = dmg + add } catch (e) { }
            try { dmg = st.damageValue } catch (e) { }
          }
        }
        titheSeen[uuid] = { id: id, dmg: dmg }
      }
    } catch (e) { console.warn(TAG + 'titheSweep threw :: ' + e) }
    server.scheduleInTicks(TITHE_TICK, function () { titheSweep(server) })
  }

  // ── UNDERSTUDY ─────────────────────────────────────────────────────────────
  // docs/23 PART VI #9: "a mob mirrors your own gear and stats." Marked [M] in the
  // design as the non-obvious one, and it is.
  //
  // Attributes are written through the SUMMON NBT rather than modifyAttribute after
  // the fact, because a spawned entity is not queryable in the tick it is created -
  // the spawner learned that when its own measurement read zero with four hounds
  // standing in the ring. Setting them at creation sidesteps the race entirely.
  //
  // It mirrors what it can reach honestly: health, damage, armour, and the weapon
  // in your hand. It does not clone your enchantments - an Understudy that swings
  // your own Sharpness V is not a mirror, it is a punishment.
  var UNDERSTUDY_BASE = 'born_in_chaos_v1:fallen_chaos_knight'
  var UNDERSTUDY_TAG = 'veldora_understudy'

  function attrOf(p, id, dflt) {
    try {
      var v = p.getAttribute(id).getValue()
      return (typeof v === 'number' && isFinite(v)) ? v : dflt
    } catch (e) { return dflt }
  }

  function runUnderstudy(server, p, tier) {
    var hp = attrOf(p, 'minecraft:generic.max_health', 20)
    var dmg = attrOf(p, 'minecraft:generic.attack_damage', 1)
    var arm = attrOf(p, 'minecraft:generic.armor', 0)

    var weapon = ''
    try {
      var st = p.mainHandItem
      var wid = st ? String(st.id) : ''
      if (wid && wid !== 'minecraft:air') weapon = wid
    } catch (e) { }

    var name = '?'
    try { name = String(p.username) } catch (e) { return false }

    if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'understudy')

    var nbt = '{Tags:["' + UNDERSTUDY_TAG + '"],CustomNameVisible:1b,' +
      'CustomName:' + Q + '{"text":"' + name + '","color":"dark_red","bold":true}' + Q + ',' +
      'Health:' + Math.round(hp) + 'f,' +
      'Attributes:[' +
        '{id:"minecraft:generic.max_health",base:' + Math.round(hp) + '},' +
        '{id:"minecraft:generic.attack_damage",base:' + (Math.round(dmg * 10) / 10) + '},' +
        '{id:"minecraft:generic.armor",base:' + Math.round(arm) + '}' +
      ']' +
      (weapon ? ',HandItems:[{id:"' + weapon + '",count:1},{}]' : '') +
      '}'

    if (!VELDORA.spawner) return false
    VELDORA.spawner.wave(p, {
      ids: [UNDERSTUDY_BASE], count: 1, minDist: 10, maxDist: 16, nbt: nbt,
    })
    console.info(TAG + 'Understudy of ' + name + ' - hp ' + Math.round(hp) +
      ', dmg ' + (Math.round(dmg * 10) / 10) + ', armour ' + Math.round(arm) +
      (weapon ? ', holding ' + weapon : ', empty-handed'))
    return true
  }


  // ── THE WATCHER ────────────────────────────────────────────────────────────
  // docs/23 PART VI #8: "he stands at range and does not attack. While he watches,
  // everything else hits harder."
  //
  // ⭐ THE ONE EVENT THE RETIRED STALKER TOOK WITH IT - and it comes back smaller.
  // The stalker was a PERMANENT presence on a leash, and the leash is what produced
  // every entity bug in the project. This is a BOUNDED one: it arrives, it watches
  // for ninety seconds, and it goes. No keepDistance, no owner tag, no migration.
  //
  // A presence with an end time is not a leash. That distinction is the whole
  // reason this is buildable again.
  var WATCH_TAG = 'veldora_watcher'
  var WATCH_SECONDS = 90
  var WATCH_TICK = 40
  var WATCH_RADIUS = 32

  function runWatcher(server, p, tier) {
    if (!VELDORA.spawner) return false
    if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'watcher')

    VELDORA.spawner.wave(p, {
      ids: [CHAMPION], count: 1, minDist: 20, maxDist: 28,
      nbt: '{Tags:["' + WATCH_TAG + '"],CustomNameVisible:1b,Silent:1b,' +
        'CustomName:' + Q + '{"text":"The Challenger","color":"dark_red","bold":true}' + Q + '}',
    })

    var ticks = 0
    function watch() {
      try {
        ticks += WATCH_TICK
        var done = ticks >= WATCH_SECONDS * 20
        var near = p.level.getEntitiesWithin(p.boundingBox.inflate(WATCH_RADIUS))
        var watcher = null
        for (var i = 0; i < near.length; i++) {
          var e = near[i]
          if (!e || e.player) continue
          var tags = null
          try { tags = e.tags } catch (x) { continue }
          var isWatcher = false
          try {
            isWatcher = tags && (tags.contains ? tags.contains(WATCH_TAG)
                                               : String(tags).indexOf(WATCH_TAG) >= 0)
          } catch (x) { }
          if (isWatcher) {
            watcher = e
            // HE DOES NOT ATTACK. Cleared every sweep rather than once, because a
            // single clear is cosmetic - stalker.js proved that the hard way: its
            // AI re-acquires between sweeps and swings.
            try { e.setTarget(null) } catch (x) { }
            if (done) { try { e.kill() } catch (x) { } }
            continue
          }
          // While he watches, everything else hits harder.
          if (!done) {
            try { e.potionEffects.add('minecraft:strength', WATCH_TICK + 20, 0, false, false) } catch (x) { }
          }
        }
        if (done) {
          if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'watcher_gone')
          console.info(TAG + 'Watcher left ' + p.username)
          return
        }
        if (!watcher && ticks > 200) {
          // Killed, or never placed. Either way there is nothing to watch with.
          console.info(TAG + 'Watcher is gone early for ' + p.username + ' - ending')
          return
        }
        p.server.scheduleInTicks(WATCH_TICK, watch)
      } catch (e) { console.warn(TAG + 'watcher threw :: ' + e) }
    }
    p.server.scheduleInTicks(WATCH_TICK, watch)
    console.info(TAG + 'Watcher on ' + p.username + ' - ' + WATCH_SECONDS + 's')
    return true
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE THREE EMPTY ROWS.  docs/23 §VI.0, built 2026-08-16.
  //
  // The taxonomy found that SEVEN of his eleven events were Challenges, and that he
  // had NOTHING in three categories rated at his top band:
  //
  //     Duels      +++   wave spawns / CHOICE      -> `wager`
  //     Buffs      ++++  status effects / FORCED   -> `harden`, `burden`
  //     Contracts  +++   kill orders / CHOICE      -> `contract`
  //
  // The rule that separates the halves: A CHOICE ALWAYS PAYS. Forced events often
  // pay nothing. So `wager` and `contract` carry a reward and `harden`/`burden` do
  // not - the player is being told, and being told is the demanding branch.
  //
  // 🚨 EVERY LINE POOL BELOW SHIPS EMPTY. Ethan writes the dialogue; voice.js
  // returns false for an empty pool and its own rule is that "callers must not
  // substitute". So these events REFUSE TO FIRE until their lines exist, rather
  // than running mute or wearing text I wrote. The boot log names every empty pool,
  // and `/events` will show them held.
  // ═══════════════════════════════════════════════════════════════════════════

  // Does this god actually have something to say for this tag? An event that cannot
  // speak must not consume its cooldown slot.
  function hasVoice(p, tag) {
    try {
      if (!VELDORA.voice || typeof VELDORA.voice.line !== 'function') return false
      var l = VELDORA.voice.line(GOD, tag, p)
      return !!(l && String(l).length)
    } catch (e) { return false }
  }

  function mute(id, tag) {
    console.info(TAG + id + ' HELD - "' + tag + '" has no lines yet (TODO(ethan)). ' +
      'The mechanic is built; it fires the moment the pool is written.')
    return false
  }

  // ── BUFFS: forced status effects, no choice, no reward ─────────────────────
  // ⚠️ `harden` ARMS the release window - it is a gift, and dying with his gift on
  // is what release.js counts (docs/47). `burden` does NOT: it is a handicap, and
  // punishing a player for dying under a penalty he imposed would be a trap.
  var HARDEN_SECONDS = 180
  var BURDEN_SECONDS = 90

  function runHarden(server, p, tier) {
    if (!hasVoice(p, 'harden')) return mute('harden', 'harden')
    var name = '?'
    try { name = String(p.username) } catch (e) { return false }
    var ok = false
    try {
      // Resistance AND Weakness together: he makes you HARDER TO KILL and LESS able
      // to kill, which forces a longer fight. That is the thesis as a status effect -
      // he does not want you to win quickly, he wants you to last.
      server.runCommandSilent('effect give ' + name + ' minecraft:resistance ' +
        HARDEN_SECONDS + ' 1 false')
      server.runCommandSilent('effect give ' + name + ' minecraft:weakness ' +
        HARDEN_SECONDS + ' 0 false')
      ok = true
    } catch (e) { console.error(TAG + 'harden failed :: ' + e) }
    if (!ok) return false
    try {
      if (VELDORA.release) VELDORA.release.armed(server, p, GOD, HARDEN_SECONDS * 20)
    } catch (e) { }
    VELDORA.voice.say(p, GOD, 'harden')
    console.info(TAG + name + ' HARDENED - resistance II + weakness for ' +
      HARDEN_SECONDS + 's (armed)')
    return true
  }

  function runBurden(server, p, tier) {
    if (!hasVoice(p, 'burden')) return mute('burden', 'burden')
    var name = '?'
    try { name = String(p.username) } catch (e) { return false }
    try {
      server.runCommandSilent('effect give ' + name + ' minecraft:slowness ' +
        BURDEN_SECONDS + ' 1 false')
    } catch (e) { console.error(TAG + 'burden failed :: ' + e); return false }
    // 🚫 deliberately NOT armed - see the note above.
    VELDORA.voice.say(p, GOD, 'burden')
    console.info(TAG + name + ' BURDENED - slowness II for ' + BURDEN_SECONDS + 's')
    return true
  }

  // ── DUELS: a wave you were ASKED about, and winning pays ───────────────────
  var WAGER_TAG = 'veldora_blade_wager'
  var WAGER_ACTOR = 'born_in_chaos_v1:fallen_chaos_knight'
  // His own idiom, tiered the way his drop table is: carried metal, never armour.
  var WAGER_PRIZE = {
    low: ['minecraft:iron_ingot', 3],
    medium: ['magistuarmory:steel_ingot', 2],
    high: ['minecraft:diamond', 2],
  }

  function runWager(server, p, tier) {
    if (!hasVoice(p, 'wager_offer')) return mute('wager', 'wager_offer')
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }
    if (!VELDORA.spawner) return false

    return VELDORA.ritual.begin(p, {
      lines: [VELDORA.voice.line(GOD, 'wager_offer', p)],
      // Functional, not characterful - two words a player clicks. If Ethan wants
      // these in his voice they move into the pool like every other line.
      options: [{ id: 'yes', label: 'Send it.' }, { id: 'no', label: 'No.' }],
      holdAfterChoice: 40,
      onChoose: function (pl, id) {
        if (id !== 'yes') {
          VELDORA.voice.say(pl, GOD, 'wager_declined')
          return
        }
        var prize = WAGER_PRIZE[tier] || WAGER_PRIZE.low
        var r = VELDORA.spawner.wave(pl, {
          ids: [WAGER_ACTOR], count: 1, minDist: 10, maxDist: 16,
          nbt: '{Tags:["' + WAGER_TAG + '"],CustomNameVisible:1b,CustomName:' + Q +
            '{"text":"The Wager","color":"dark_red","bold":true}' + Q + '}',
        }, function (placed) {
          if (placed === 0) {
            console.error(TAG + '!! wager placed NOTHING for ' + pl.username +
              ' - they said yes to an empty field')
          }
        })
        if (!VELDORA.spawner.issued(r)) {
          console.warn(TAG + 'wager was REFUSED by the spawner for ' + pl.username)
          return
        }
        // The prize rides on the ENTITY, not on a timer: kill it and it pays.
        try { pl.persistentData.putString('veldora_wager_prize', prize[0] + ' ' + prize[1]) } catch (e) { }
        console.info(TAG + pl.username + ' TOOK the wager (' + tier + ') - prize ' +
          prize[1] + 'x ' + prize[0])
      },
      onTimeout: function () { },
    })
  }

  // Winning the wager pays. A choice ALWAYS pays - that is the rule the whole
  // taxonomy rests on, so this hook is the rule made real.
  EntityEvents.death(function (event) {
    try {
      var e = event.entity
      if (!e || e.player) return
      var tags = null
      try { tags = e.tags } catch (x) { return }
      if (!tags) return
      var has = false
      try { has = tags.contains ? tags.contains(WAGER_TAG) : (String(tags).indexOf(WAGER_TAG) >= 0) } catch (x) { return }
      if (!has) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      var prize = ''
      try { prize = killer.persistentData.getString('veldora_wager_prize') || '' } catch (x) { }
      if (!prize) return
      try { killer.persistentData.putString('veldora_wager_prize', '') } catch (x) { }
      try { killer.server.runCommandSilent('give ' + killer.username + ' ' + prize) } catch (x) { }
      VELDORA.voice.say(killer, GOD, 'wager_won')
      console.info(TAG + killer.username + ' WON the wager - paid ' + prize)
    } catch (err) { console.warn(TAG + 'wager death hook threw :: ' + err) }
  })

  // ── CONTRACTS: a kill order you were ASKED about, and it pays ──────────────
  // Reuses the Mark's whole apparatus - K_TARGET, K_DUE, markSweep, and the death
  // hook that resolves it - so there is ONE implementation of "kill that player by
  // day N". The only new state is a flag saying this one was bought rather than
  // ordered, which is what makes it pay.
  var K_CONTRACT = 'veldora_mark_paid'
  var CONTRACT_PRIZE = {
    low: ['minecraft:iron_ingot', 4],
    medium: ['magistuarmory:steel_ingot', 3],
    high: ['minecraft:netherite_scrap', 1],
  }

  function runContract(server, p, tier) {
    if (!hasVoice(p, 'contract_offer')) return mute('contract', 'contract_offer')
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }
    // Already carrying a mark? One kill order at a time.
    try { if ((p.persistentData.getString(K_TARGET) || '')) return false } catch (e) { }

    var t = findTarget(server, p)
    if (!t) return false                     // nobody to point at. Not a failure.
    var today = dayNow(server)
    if (today === null) return false
    var tname = '?'
    try { tname = String(t.username) } catch (e) { return false }

    return VELDORA.ritual.begin(p, {
      // ⚠️ voice.js has say/sayAbout and line, but NO `lineAbout` - and the ritual
      // takes STRINGS, not a speak call, so the {target} substitution has to happen
      // here. My first version probed for a lineAbout that does not exist and fell
      // back to line(), which would have shown a player the literal text "{target}".
      // Same substitution rule as sayAbout, deliberately.
      lines: [String(VELDORA.voice.line(GOD, 'contract_offer', p) || '')
        .split('{target}').join(tname)],
      options: [{ id: 'yes', label: 'It is done.' }, { id: 'no', label: 'No.' }],
      holdAfterChoice: 40,
      onChoose: function (pl, id) {
        if (id !== 'yes') return
        try {
          pl.persistentData.putString(K_TARGET, tname)
          pl.persistentData.putInt(K_DUE, today + MARK_DAYS + 1)
          pl.persistentData.putInt(K_CONTRACT, 1)
        } catch (e) { return }
        console.info(TAG + pl.username + ' SIGNED a contract on ' + tname +
          ', due day ' + (today + MARK_DAYS))
      },
      onTimeout: function () { },
    })
  }

  // Paid on resolution. The existing mark death-hook clears K_TARGET; this runs
  // beside it and only pays when the kill was BOUGHT.
  function payContract(killer, tier) {
    var paid = 0
    try { paid = killer.persistentData.getInt(K_CONTRACT) || 0 } catch (e) { return }
    if (!paid) return
    try { killer.persistentData.putInt(K_CONTRACT, 0) } catch (e) { }
    var prize = CONTRACT_PRIZE[tier] || CONTRACT_PRIZE.low
    try {
      killer.server.runCommandSilent('give ' + killer.username + ' ' + prize[0] + ' ' + prize[1])
    } catch (e) { return }
    VELDORA.voice.say(killer, GOD, 'contract_paid')
    console.info(TAG + killer.username + ' was PAID for the contract - ' +
      prize[1] + 'x ' + prize[0])
  }

  ServerEvents.loaded(function (event) {
    if (!VELDORA.events) { console.error(TAG + 'godevents.js missing'); return }
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐ HIS HORDES ARE UNDERGROUND ONLY.  Ethan, 2026-08-16, refining his
    // brother's "spawn challenges should only be during the day":
    //     "Hordes events for blade should only be underground."
    //
    // It also fixes the complaint that started this: "im sending people to fight
    // you every 10-20 minutes" was landing while he was standing in a field.
    //
    // ⚠️ ONLY THE TWO AMBIENT HORDES ARE GATED. The other two waves are exempt and
    // both exemptions are deliberate:
    //
    //   icarus       is the ABOVE-ground counterpart - its own guard is y >= 100.
    //                Gating it underground makes it y>=100 AND y<50, which is
    //                unsatisfiable, and the event would have gone silently dead.
    //                Together they now read as one idea: he sends fliers when you
    //                are high, hordes when you are deep, and nothing at all while
    //                you stand in a field at sea level.
    //   broken_rung  is a consequence of DYING, not a fact about a place, and it
    //                fires from the respawn hook - where you are standing is your
    //                bed, which is on the surface. Gating it would have killed it.
    //                (force:true skips the roll and the cooldown but NOT guards.)
    // ═══════════════════════════════════════════════════════════════════════
    var underground = VELDORA.events.whenDeep

    VELDORA.events.register(GOD, {
      id: 'gauntlet', kind: 'challenge', does: 'spawns a wave scaled by trust and announces it; the player must survive it. UNDERGROUND ONLY',
      hostile: true, cooldown: 2, weight: 3,
      tiers: ['low', 'medium', 'high'], guard: underground, run: runGauntlet,
    })
    VELDORA.events.register(GOD, {
      id: 'mark', kind: 'assassination', does: 'marks the player for 2 world days - no penalty, it only changes what he says',
      hostile: false, cooldown: 3, weight: 2,
      tiers: ['medium', 'high'], run: runMark,
    })
    VELDORA.events.register(GOD, {
      id: 'icarus', kind: 'challenge', does: 'spawns a wave ABOVE y100 only - punishes being high and comfortable',
      hostile: true, cooldown: 2, weight: 3,
      tiers: ['low', 'medium', 'high'], guard: aboveTheLine, run: runIcarus,
    })
    VELDORA.events.register(GOD, {
      id: 'hollow', kind: 'challenge', does: 'spawns a tagged wave whose drops are CANCELLED - the kills pay nothing. UNDERGROUND ONLY',
      hostile: true, cooldown: 3, weight: 2,
      tiers: ['medium', 'high'], guard: underground, run: runHollow,
    })
    VELDORA.events.register(GOD, {
      id: 'broken_rung', kind: 'challenge', does: 'fires on respawn - sends a wave at a player who has just died',
      hostile: true, cooldown: 1, weight: 1,
      tiers: ['low', 'medium', 'high'], run: runBrokenRung,
    })
    VELDORA.events.register(GOD, {
      id: 'sharpen', kind: 'boon', scene: true, does: 'offers a BARGAIN via the ritual: Strength for 3 min, but everything nearby is drawn to you',
      hostile: false, cooldown: 2, weight: 2,
      tiers: ['low', 'medium', 'high'], run: runSharpen,
    })
    VELDORA.events.register(GOD, {
      id: 'first_blood', kind: 'challenge', does: 'two staged demands, and BOTH stages cost the player something',
      hostile: true, cooldown: 2, weight: 2,
      tiers: ['low', 'medium', 'high'], run: runFirstBlood,
    })
    VELDORA.events.register(GOD, {
      id: 'duel', kind: 'challenge', does: 'high trust only - sends one strong actor; fleeing earns a taunt, not a penalty',
      hostile: true, cooldown: 4, weight: 2,
      tiers: ['high'], run: runDuel,
    })
    VELDORA.events.register(GOD, {
      id: 'tithe', kind: 'buff', does: 'takes extra durability from the held item each second, CAPPED so it never breaks it',
      hostile: true, cooldown: 4, weight: 1,
      tiers: ['medium', 'high'], run: runTithe,
    })
    VELDORA.events.register(GOD, {
      id: 'understudy', kind: 'challenge', does: 'summons a buffed actor with attributes written at spawn time',
      hostile: true, cooldown: 5, weight: 1,
      tiers: ['high'], run: runUnderstudy,
    })
    // ═══════════════════════════════════════════════════════════════════════
    // THE THREE ROWS THE TAXONOMY FOUND EMPTY (docs/23 §VI.0)
    //
    // ⭐ RESOLVED 2026-08-29 (F2) - AND THE REBALANCE IS NOT NEEDED.
    //
    // This block used to say: weights are per-event but his chart is per-category, so
    // seven Challenges against two Buffs left Challenges ~3.5x heavier than the chart
    // asks for; w4/w3 here closed some of it and the rest wanted "a rebalance of the
    // seven Challenges downward, which is a separate pass and Ethan's call".
    //
    // 🔑 THE TWO-STAGE ROLL ALREADY FIXED IT (godevents.js). The roll now picks a KIND
    // from the chart first, then an event inside that kind - so event weights are
    // RELATIVE WITHIN A CATEGORY and the number of Challenges cannot move the category
    // share at all. Measured on the live boot 2026-08-29:
    //
    //     blade rolls BY KIND: challenge 20% (8 ev) - the chart asks for exactly 20%
    //
    // The old note recorded 47.1% against a wanted 20.0% with the same eight events.
    // Nothing was rebalanced; the selection stopped being wrong.
    //
    // ⚠️ SO THE w4/w3 BELOW NO LONGER MEAN WHAT THEY SAY. They were chosen to inflate
    // the Buff CATEGORY, and a per-event weight can no longer do that - all they do
    // now is split the Buff band between harden, burden and tithe (4:3:1). That ratio
    // has never been decided on its own merits, and it makes tithe ~2.5% of all rolls.
    // Left alone rather than quietly re-tuned: it is a real question for Ethan, and
    // it is a different question from the one this comment used to ask.
    // ═══════════════════════════════════════════════════════════════════════
    VELDORA.events.register(GOD, {
      id: 'harden', kind: 'buff', run: runHarden, hostile: false, cooldown: 2, weight: 4,
      tiers: ['low', 'medium', 'high'],
      does: 'BUFF (forced) - resistance II AND weakness together, 3 min. He makes ' +
        'you hard to kill and slow to kill, so the fight lasts. ARMS the release ' +
        'window.',
    })
    VELDORA.events.register(GOD, {
      id: 'burden', kind: 'buff', run: runBurden, hostile: false, cooldown: 3, weight: 3,
      tiers: ['medium', 'high'],
      does: 'BUFF (forced) - slowness II for 90s, a handicap not a gift. Does NOT ' +
        'arm the release window: punishing a death under a penalty he imposed would ' +
        'be a trap.',
    })
    VELDORA.events.register(GOD, {
      id: 'wager', kind: 'duel', scene: true, run: runWager, hostile: true, cooldown: 3, weight: 3,
      tiers: ['low', 'medium', 'high'],
      does: 'DUEL (choice) - he OFFERS one strong opponent. Say yes and it arrives ' +
        'tagged; kill it and it pays iron/steel/diamond by tier. A choice always ' +
        'pays.',
    })
    VELDORA.events.register(GOD, {
      id: 'contract', kind: 'contract', scene: true, run: runContract, hostile: false, cooldown: 4, weight: 3,
      tiers: ['medium', 'high'],
      does: 'CONTRACT (choice) - a kill order he ASKS for, on the same machinery as ' +
        'the Mark, and it pays on success.',
    })

    VELDORA.events.register(GOD, {
      id: 'watcher', kind: 'challenge', does: 'places a bounded, non-attacking presence near the player - it only watches',
      hostile: true, cooldown: 3, weight: 2,
      tiers: ['medium', 'high'], run: runWatcher,
    })
    if (VELDORA.harvest) {
      VELDORA.harvest.register(GOD, {
        arrive: harvestArrive, onWin: harvestWin, onLose: harvestLose,
        tag: CHAMPION_TAG,      // resolve() removes it, win or lose
      })
    } else console.error(TAG + 'harvest.js missing - his Harvest will not arrive')
    markSweep(event.server)
    titheSweep(event.server)
    console.info(TAG + 'The Warrior sends: gauntlet, icarus (above y' + ICARUS_Y +
      '), hollow (drops nothing), broken_rung (on respawn), mark (' + MARK_DAYS +
      'd, no penalty), sharpen (a BARGAIN, via the ritual), first_blood, duel (high only)')
  })
})();
