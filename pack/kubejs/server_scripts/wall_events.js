// wall_events.js - THE SPIDER'S RAGE.  docs/43
//
// Ethan, 2026-08-15:
//   "her counter is rage."
//   "counter can be a plus for every minion raised and a loss for every minion slain"
//   "rage for the wall is something directed as less boons for you, more attacks on
//    other players"
//   "she will never send anything but boons to you. To other players? She spawns
//    spiders to attack them."
//
// ── ⭐ SHE IS THE FIRST GOD WHO POINTS AT SOMEBODY ELSE ─────────────────────
// Every other patron's events happen TO their champion. Hers happen to everyone
// else, and that inverts the whole relationship: Blade's champion is being TESTED,
// hers is being PROTECTED. You are not the target of your own god. You are the
// reason other people are.
//
// RAGE IS ONE SLIDER, NOT TWO SYSTEMS. It does not switch modes at a threshold; it
// slides. At 0 she is entirely gifts. At the top she is entirely spiders. The middle
// is where she ASKS, and that question is the best thing she does:
//
//     0 ............... rage ............... MAX
//     [ boons to you ]                  [ spiders at them ]
//              [ she asks first ]
//
// ⚠️ THE MIDDLE BAND DISAPPEARS AS RAGE CLIMBS. Ethan: "as the counters increase you
// lose the ability slowly to choose to take the boon." She stops asking - not
// because she is angry with you, but because she has stopped believing you say no.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[wallev] '
  var GOD = 'wall'
  var GATE = true

  // ⚠️ THE PVP SWITCH. Everything that points at another player reads this first.
  // A real flag, not a comment, because "she attacks other players" is a
  // server-social decision and it must be revocable in one edit without unpicking
  // her character.
  var HOSTILE_TO_PLAYERS = true

  // ═══════════════════════════════════════════════════════════════════════════
  // WHAT COUNTS AS A MINION  (audited from the jars, 2026-08-15)
  // ═══════════════════════════════════════════════════════════════════════════
  // Goety ships 85 entities ending `_servant` - that suffix IS its marker for a
  // player-owned summon (bear_servant, bone_spider_servant, cave_spider_servant...).
  // Occultism uses `_familiar`. Their UNBOUND variants carry `wild`/`unbound` and
  // are explicitly NOT yours.
  //
  // ⚠️ MATCHED BY SUBSTRING, NEVER EQUALITY. `String(entity.type)` is not the bare
  // id - it resolves to an EntityType object whose toString is a description key.
  // This project shipped that bug twice (the_hunt, nemesis_tally) and both times it
  // failed SILENTLY, because "could not read" and "not a minion" shared a value.
  // isMinion() returns null for unreadable and false for no. They are different.
  var MINION_MARKS = ['_servant', '_familiar']
  var NOT_YOURS = ['wild', 'unbound']

  function idOf(e) {
    var s = null
    try { s = String(e.type) } catch (x) { }
    if (!s) { try { s = String(e.getType()) } catch (x) { } }
    return s ? s.toLowerCase() : null
  }

  function isMinion(e) {
    var id = idOf(e)
    if (id === null) return null                  // unreadable is NOT "no"
    for (var i = 0; i < NOT_YOURS.length; i++) if (id.indexOf(NOT_YOURS[i]) >= 0) return false
    for (var j = 0; j < MINION_MARKS.length; j++) if (id.indexOf(MINION_MARKS[j]) >= 0) return true
    return false
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RAGE - the counter
  // ═══════════════════════════════════════════════════════════════════════════
  var OWNER_PREFIX = 'veldora_wall_owner_'
  var MINION_TAG = 'veldora_wall_minion'
  var CREDIT_RANGE = 16                           // a summon appears beside you

  function wallWalkers(server) {
    var out = []
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(ps[i]) || '' } catch (e) { continue }
        if (path === GOD) out.push(ps[i])
      }
    } catch (e) { }
    return out
  }

  // ⚠️ AN APPROXIMATION, DECLARED AS ONE. Goety and Occultism both store an owner in
  // NBT, but the shape differs per mod and per entity, and reading it wrong would
  // fail silently - the exact class of bug this file's header warns about. A summon
  // appears NEXT TO its summoner, so "nearest Wall walker within 16 blocks" is right
  // in every case that actually happens; when it is wrong it credits a Wall walker
  // standing beside another Wall walker, which is a rounding error, not a broken
  // mechanic.
  //
  // The owner is then STAMPED ON THE ENTITY, so the debit on death is exact even if
  // the minion dies alone on the far side of the world.
  function creditNearest(server, e) {
    var walkers = wallWalkers(server)
    if (!walkers.length) return null
    var best = null, bestD = CREDIT_RANGE * CREDIT_RANGE
    for (var i = 0; i < walkers.length; i++) {
      var p = walkers[i]
      try {
        var dx = p.x - e.x, dy = p.y - e.y, dz = p.z - e.z
        var d2 = dx * dx + dy * dy + dz * dz
        if (d2 <= bestD) { bestD = d2; best = p }
      } catch (x) { }
    }
    return best
  }

  function ownerFromTags(server, tags) {
    try {
      var all = String(tags)
      var at = all.indexOf(OWNER_PREFIX)
      if (at < 0) return null
      var rest = all.substring(at + OWNER_PREFIX.length)
      var name = rest.split(/[,\]\s]/)[0]
      if (!name) return null
      return server.getPlayer(name)
    } catch (e) { return null }
  }

  function hasTag(e, tag) {
    try {
      var tags = e.tags
      if (!tags) return false
      return tags.contains ? tags.contains(tag) : (String(tags).indexOf(tag) >= 0)
    } catch (x) { return false }
  }

  EntityEvents.spawned(function (event) {
    if (!GATE) return
    try {
      var e = event.entity
      if (!e || e.player) return
      if (isMinion(e) !== true) return
      var server = null
      try { server = e.server } catch (x) { return }
      if (!server) return
      var owner = creditNearest(server, e)
      if (!owner) return
      try {
        e.addTag(MINION_TAG)
        e.addTag(OWNER_PREFIX + owner.username)
      } catch (x) { }
      if (VELDORA.counter) VELDORA.counter.add(owner, GOD, 1, 'minion raised')
    } catch (err) { console.warn(TAG + 'spawn hook threw :: ' + err) }
  })

  EntityEvents.death(function (event) {
    if (!GATE) return
    try {
      var e = event.entity
      if (!e || e.player) return
      if (!hasTag(e, MINION_TAG)) return
      var server = null
      try { server = e.server } catch (x) { return }
      var owner = ownerFromTags(server, e.tags)
      if (!owner) return
      if (VELDORA.counter) VELDORA.counter.add(owner, GOD, -1, 'minion slain')
    } catch (err) { console.warn(TAG + 'minion death hook threw :: ' + err) }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // WHO SHE POINTS AT
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan: "the player who's either nearby or killed the champion the most."
  // A grudge first, proximity second.
  var GRUDGE = {}                                 // username -> how many of hers
  var ACTOR_TAG = 'veldora_wall_actor'
  var HARVEST_TAG = 'veldora_wall_harvest'

  EntityEvents.death(function (event) {
    try {
      var e = event.entity
      if (!e || e.player) return
      if (!hasTag(e, ACTOR_TAG)) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      var n = killer.username
      GRUDGE[n] = (GRUDGE[n] || 0) + 1
      console.info(TAG + n + ' has now killed ' + GRUDGE[n] + ' of hers')
    } catch (err) { }
  })

  // ⚠️ HER OWN HEALTH FLOOR, ON THE TARGET.
  // godevents' floor guards the player an event fires FOR. Hers fires for her
  // champion and lands on somebody else, so that floor is guarding the wrong person
  // entirely. Dropping a spider wave on someone at two hearts is not an event, it is
  // an execution.
  var TARGET_FLOOR = 0.6

  function healthyEnough(p) {
    try {
      var max = p.getAttribute('minecraft:generic.max_health').getValue()
      if (!max) return false
      return (p.health / max) >= TARGET_FLOOR
    } catch (e) { return false }                  // unreadable = leave them alone
  }

  function pickTarget(server, me) {
    if (!HOSTILE_TO_PLAYERS) return null
    var cands = []
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        try { if (String(p.uuid) === String(me.uuid)) continue } catch (x) { continue }
        if (!healthyEnough(p)) continue
        try { if (VELDORA.ritual && VELDORA.ritual.active(p)) continue } catch (x) { }
        cands.push(p)
      }
    } catch (e) { return null }
    if (!cands.length) return null

    var best = null, bestG = 0
    for (var j = 0; j < cands.length; j++) {
      var g = GRUDGE[cands[j].username] || 0
      if (g > bestG) { bestG = g; best = cands[j] }
    }
    if (best) return best

    var near = null, nearD = Infinity
    for (var k = 0; k < cands.length; k++) {
      try {
        var dx = cands[k].x - me.x, dy = cands[k].y - me.y, dz = cands[k].z - me.z
        var d2 = dx * dx + dy * dy + dz * dz
        if (d2 < nearD) { nearD = d2; near = cands[k] }
      } catch (x) { }
    }
    return near
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WHAT SHE SENDS
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan's phasing, 2026-08-15:
  //   med / high    minecraft:spider  +  born_in_chaos_v1:baby_spider
  //   high (rare)   waves of BUFFED spiders
  //
  // Both ids validated live against this server with the E0 P13 probe. Sightstealer
  // was CUT - it does not exist in this pack under any id or display name, and a
  // buffed wave is the better answer anyway: it scales with her rage instead of
  // introducing a mob nobody has a relationship with.
  var SPIDERS = ['minecraft:spider', 'born_in_chaos_v1:baby_spider']

  var Q = String.fromCharCode(39)

  function spiderNbt(buffed) {
    var base = '{Tags:["' + ACTOR_TAG + '"]'
    if (!buffed) return base + '}'
    // ⚠️ ATTRIBUTES ARE WRITTEN AT SUMMON, never set afterwards - the same route
    // Understudy uses. Setting them post-spawn races the mod's own finalizeSpawn.
    return base + ',CustomNameVisible:1b,CustomName:' + Q +
      '{"text":"Hers","color":"dark_purple","bold":true}' + Q +
      ',attributes:[' +
      '{id:"minecraft:generic.max_health",base:40},' +
      '{id:"minecraft:generic.movement_speed",base:0.36},' +
      '{id:"minecraft:generic.attack_damage",base:6}' +
      '],Health:40f}'
  }

  function sendSpiders(server, me, tier) {
    var target = pickTarget(server, me)
    if (!target) {
      console.info(TAG + 'no valid target for ' + me.username + ' - nobody else ' +
        'online, or everyone is hurt / in a scene. Nothing sent.')
      return false
    }
    if (!VELDORA.spawner) { console.error(TAG + 'no spawner'); return false }

    var buffed = (tier === 'high')
    var count = buffed ? 5 : 3
    var r = VELDORA.spawner.wave(target, {
      ids: SPIDERS, count: count, minDist: 10, maxDist: 18,
      nbt: spiderNbt(buffed),
    })
    if (!r || r.placed === 0) {
      console.warn(TAG + 'spiders asked for ' + target.username +
        ' and placed NOTHING - not stamping')
      return false
    }

    // ⭐ SHE SPEAKS TO THE TARGET, not to her champion. That is what high_hostile is
    // for - she is explaining herself to the person she is killing, which is worse
    // than threatening them.
    if (VELDORA.voice) VELDORA.voice.say(target, GOD, 'high_hostile')
    console.info(TAG + '!! ' + me.username + ' -> ' + count +
      (buffed ? ' BUFFED' : '') + ' spiders sent at ' + target.username +
      ' (grudge ' + (GRUDGE[target.username] || 0) + ')')
    return true
  }

  // ── the three events ──────────────────────────────────────────────────────
  // ⭐ A BOON. Never anything else at her own champion.
  function evBoon(server, p) {
    var ok = false
    try {
      p.potionEffects.add('minecraft:regeneration', 300, 1, false, false)
      p.potionEffects.add('minecraft:absorption', 1200, 1, false, false)
      ok = true
    } catch (e) { console.warn(TAG + 'boon effects threw :: ' + e) }
    if (!ok) return false
    try { if (VELDORA.wall) VELDORA.wall.speak(p, 'gift') } catch (e) { }
    return true
  }

  // Two different lines from her own pool, so the ask is never word-for-word the
  // same twice. Falls back only if the pool is unreadable - and says so.
  function offerLines(p) {
    var out = []
    try {
      if (VELDORA.voice && typeof VELDORA.voice.line === 'function') {
        for (var i = 0; i < 4 && out.length < 2; i++) {
          var s = VELDORA.voice.line(GOD, 'medium_hostile', p)
          if (s && out.indexOf(s) < 0) out.push(s)
        }
      }
    } catch (e) { }
    if (!out.length) {
      console.warn(TAG + 'medium_hostile pool is empty or unreadable - the offer ' +
        'is falling back to a stub line. That is a content bug, not a scene bug.')
      out = ['They dare.']
    }
    return out
  }

  // ⭐ THE OFFER - the middle of the slider, and the best thing she does. She asks.
  // You may still say no, and saying no costs you nothing except her.
  function evOffer(server, p, tier) {
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }
    if (!pickTarget(server, p)) return false      // nobody to offer. Do not ask.

    return VELDORA.ritual.begin(p, {
      colour: '§5§l',
      // 🚨 DRAWN FROM HER medium_hostile POOL, not typed in here. I originally
      // hardcoded two lines into this event while Ethan's own -
      // "They dare. They Dare." / "We need to hurt them. They need to be hurt.
      // Please." - sat in a pool with ZERO consumers. A dead dialogue pool is the
      // same defect as a gate with no live consumer, and it is harder to notice
      // because the scene still reads fine.
      lines: offerLines(p),
      options: [
        { label: 'Do it.', id: 'yes' },
        { label: 'Leave them.', id: 'no' },
      ],
      holdAfterChoice: 60,
      onChoose: function (pl, id) {
        if (id === 'yes') {
          server.scheduleInTicks(20, function () {
            try { sendSpiders(server, pl, tier) } catch (e) { }
          })
        } else {
          // ⚠️ REFUSING COSTS NOTHING MECHANICALLY and she does not punish it. She
          // is disappointed, and being disappointed by her is the entire price.
          if (VELDORA.voice) VELDORA.voice.say(pl, GOD, 'medium_gift')
          console.info(TAG + pl.username + ' refused her the kill')
        }
      },
      onTimeout: function () { },
    })
  }

  // ⭐ NO CHOICE. At high rage she has stopped asking.
  function evWeb(server, p, tier) {
    return sendSpiders(server, p, tier || 'high')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE HARVEST - she collects, and she is sorry about it
  // ═══════════════════════════════════════════════════════════════════════════
  var HARVEST_SCENE = [
    'I\'m sorry about this.',
    'My family grows restless.',
    'They want to feast.',
    'And I can\'t hold them back.',
    'I want to. But...',
  ]

  function harvestArrive(server, p) {
    if (!VELDORA.spawner) return false
    try {
      if (VELDORA.ritual && VELDORA.ritual.active(p)) {
        console.info(TAG + 'Harvest held for ' + p.username + ' - already in a scene')
        return false
      }
    } catch (e) { }

    var opened = false
    if (VELDORA.ritual && typeof VELDORA.ritual.begin === 'function') {
      opened = VELDORA.ritual.begin(p, {
        colour: '§5§l', lines: HARVEST_SCENE, options: [],
      })
    }
    // Timed off ritual.js's OWN constants: LEAD 20 + n x GAP 50 + TAIL 40.
    var sceneEnd = opened ? (20 + (HARVEST_SCENE.length * 50) + 40) : 0
    var spawnAt = sceneEnd + 40

    server.scheduleInTicks(spawnAt, function () {
      var r = VELDORA.spawner.wave(p, {
        ids: ['born_in_chaos_v1:mother_spider'], count: 1, minDist: 12, maxDist: 20,
        nbt: '{Tags:["' + ACTOR_TAG + '","' + HARVEST_TAG + '"],CustomNameVisible:1b,' +
          'CustomName:' + Q + '{"text":"Her Family","color":"dark_purple","bold":true}' +
          Q + '}',
      })
      // 🚨 A Harvest that did not arrive did not happen. harvest.js has already
      // stamped this begun, so a failed placement must release the lock or the player
      // sits in the harvest phase with nothing to fight.
      if (!r || r.placed === 0) {
        console.error(TAG + '!! Harvest FAILED to place for ' + p.username +
          ' - releasing the lock so the sweep retries')
        try { p.persistentData.putString('veldora_harvest_active', '') } catch (e) { }
      }
    })
    console.info(TAG + 'Harvest scene opened for ' + p.username +
      ' - hers arrives at ' + spawnAt + 't')
    return true
  }

  // Delayed, so she speaks AFTER the world has said what happened.
  function harvestWin(server, p) {
    server.scheduleInTicks(20, function () {
      try { if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'harvest_won') } catch (e) { }
    })
  }
  function harvestLose(server, p) {
    server.scheduleInTicks(20, function () {
      try { if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'harvest_lost') } catch (e) { }
    })
  }

  EntityEvents.death(function (event) {
    try {
      var v = event.entity
      if (!v || v.player) return
      if (!hasTag(v, HARVEST_TAG)) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      if (VELDORA.harvest) VELDORA.harvest.resolve(killer.server, killer, true)
    } catch (e) { }
  })

  EntityEvents.death(function (event) {
    try {
      var v = event.entity
      if (!v || !v.player) return
      if (!VELDORA.harvest || !VELDORA.harvest.active(v)) return
      var path = ''
      try { if (VELDORA.paths) path = VELDORA.paths.pathOf(v) || '' } catch (x) { }
      if (path !== GOD) return
      VELDORA.harvest.resolve(v.server, v, false)
    } catch (e) { }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // ABSENCE - her single best register, and it had no consumer either
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan wrote "You are back! / I missed you. / The realm barely changed in your
  // absence, as did I." into a `returned` pool that nothing ever asked for.
  //
  // A codependent who does not notice you were gone is not a codependent. Login is
  // the honest moment for it: it is when the player is looking, and it is the only
  // moment the game can tell how long they were away.
  //
  // ⚠️ day+1 STORAGE. getInt() returns 0 for a missing key, so a first-ever login
  // would otherwise read as "away since the beginning of the world".
  var K_SEEN = 'veldora_wall_seen'
  var AWAY_DAYS = 2                          // world days before she says anything

  PlayerEvents.loggedIn(function (event) {
    if (!GATE) return
    try {
      var p = event.player
      if (!p) return
      var path = ''
      try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { return }
      if (path !== GOD) return

      var server = null
      try { server = p.server } catch (e) { return }
      var now = null
      try {
        var d = server.overworld().dayTime()
        if (typeof d === 'number' && isFinite(d)) now = Math.floor(d / 24000)
      } catch (e) { }
      if (now === null) return

      var stored = 0
      try { stored = p.persistentData.getInt(K_SEEN) } catch (e) { }
      try { p.persistentData.putInt(K_SEEN, now + 1) } catch (e) { }
      if (!stored) return                     // never seen before: she says nothing yet

      var last = stored - 1
      // A stamp from the future means an admin moved the clock. Re-stamp rather
      // than treating it as ten thousand days of neglect.
      if (last > now) return
      if ((now - last) < AWAY_DAYS) return

      // A beat after login, so it does not land under the join spam.
      server.scheduleInTicks(60, function () {
        try {
          if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'returned')
          console.info(TAG + p.username + ' came back after ' + (now - last) +
            ' day(s) - she noticed')
        } catch (e) { }
      })
    } catch (err) { console.warn(TAG + 'absence hook threw :: ' + err) }
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('rage').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var n = null
      try { if (VELDORA.counter) n = VELDORA.counter.get(p, GOD) } catch (e) { }
      var t = null
      try { if (VELDORA.wall) t = VELDORA.wall.tier(p) } catch (e) { }
      var tgt = pickTarget(ctx.source.server, p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§5§lRAGE §f' + (n === null ? 'UNREADABLE' : n) +
        ' §8· tier §f' + (t || 'UNREADABLE')))
      p.tell(Text.of('§8she would point at: §f' + (tgt ? tgt.username : 'nobody') +
        (tgt ? ' §8(grudge ' + (GRUDGE[tgt.username] || 0) + ')' : '')))
      p.tell(Text.of('§8pvp ' + (HOSTILE_TO_PLAYERS ? '§aON' : '§cOFF') +
        ' §8· target health floor §f' + Math.round(TARGET_FLOOR * 100) + '%'))
      p.tell(Text.of('§8rage: §f+1§8 per minion raised, §f-1§8 per minion slain'))
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF'); return }
    if (!VELDORA.events) { console.error(TAG + 'godevents.js missing'); return }

    // ⭐ THE WEIGHTS AND TIERS *ARE* THE SLIDER. `offer` exists only at medium, so
    // the band where she asks your permission opens as rage rises and closes again
    // when it gets high - which is exactly "you slowly lose the ability to choose".
    VELDORA.events.register(GOD, {
      id: 'boon', run: evBoon, hostile: false, cooldown: 1, weight: 4,
      tiers: ['low', 'medium', 'high'],
      does: 'gives HER champion regeneration + absorption. She never sends anything ' +
        'hostile at her own walker, at any rage',
    })
    VELDORA.events.register(GOD, {
      id: 'offer', run: evOffer, hostile: false, cooldown: 2, weight: 3,
      tiers: ['medium'],
      does: 'ASKS her champion permission to attack another player, via the ritual. ' +
        'Refusing costs nothing but her approval. MEDIUM RAGE ONLY - she stops ' +
        'asking once rage is high',
    })
    VELDORA.events.register(GOD, {
      id: 'web', run: evWeb, hostile: false, cooldown: 2, weight: 3,
      tiers: ['high'],
      does: 'SENDS SPIDERS AT ANOTHER PLAYER, no choice. 5 buffed spiders (40hp, ' +
        'fast, 6 dmg) at whoever has killed most of hers, else the nearest. Skips ' +
        'anyone under 60% health or in a scene',
    })

    if (VELDORA.harvest) {
      VELDORA.harvest.register(GOD, {
        arrive: harvestArrive, onWin: harvestWin, onLose: harvestLose,
        tag: ACTOR_TAG,
      })
    } else console.error(TAG + 'harvest.js missing - her Harvest will not arrive')

    console.info(TAG + 'The Spider: boon (all tiers) / offer (MEDIUM - she asks) / ' +
      'web (HIGH - no choice). Rage = +1 per minion raised, -1 per minion slain. ' +
      'PvP ' + (HOSTILE_TO_PLAYERS ? 'ON' : 'OFF') + ', target floor ' +
      Math.round(TARGET_FLOOR * 100) + '%.')
  })
})();
