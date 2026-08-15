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

      // The reward. Maintenance-grade and temporary - he does not hand out power
      // you did not earn (docs/40 PART 7).
      try {
        var srv = killer.server
        srv.runCommandSilent('effect give ' + killer.username + ' minecraft:strength 600 0 false')
        srv.runCommandSilent('effect give ' + killer.username + ' minecraft:resistance 600 0 false')
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

  PlayerEvents.respawned(function (event) {
    var p = event.player
    if (!p) return
    var server = null
    try { server = p.server } catch (e) { }
    if (!server) return
    // Delayed so it lands after the respawn settles rather than over the top of it,
    // and so instant_respawn has finished moving the player.
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

  ServerEvents.loaded(function (event) {
    if (!VELDORA.events) { console.error(TAG + 'godevents.js missing'); return }
    VELDORA.events.register(GOD, {
      id: 'gauntlet', hostile: true, cooldown: 2, weight: 3,
      tiers: ['low', 'medium', 'high'], run: runGauntlet,
    })
    VELDORA.events.register(GOD, {
      id: 'mark', hostile: false, cooldown: 3, weight: 2,
      tiers: ['medium', 'high'], run: runMark,
    })
    VELDORA.events.register(GOD, {
      id: 'icarus', hostile: true, cooldown: 2, weight: 3,
      tiers: ['low', 'medium', 'high'], guard: aboveTheLine, run: runIcarus,
    })
    VELDORA.events.register(GOD, {
      id: 'hollow', hostile: true, cooldown: 3, weight: 2,
      tiers: ['medium', 'high'], run: runHollow,
    })
    VELDORA.events.register(GOD, {
      id: 'broken_rung', hostile: true, cooldown: 1, weight: 1,
      tiers: ['low', 'medium', 'high'], run: runBrokenRung,
    })
    markSweep(event.server)
    console.info(TAG + 'The Warrior sends: gauntlet, icarus (above y' + ICARUS_Y +
      '), hollow (drops nothing), broken_rung (on respawn), mark (' + MARK_DAYS +
      'd, no penalty on refusal)')
  })
})();
