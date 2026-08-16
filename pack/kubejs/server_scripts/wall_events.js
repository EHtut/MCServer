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

      // 🚨 CREDIT ONCE, EVER. This hook tagged the entity on the way OUT and never
      // read that tag on the way IN, so the same minion could be credited again and
      // again. EntityEvents.spawned sits on the entity JOINING THE LEVEL, which
      // includes chunk load - and Occultism familiars and Goety servants persist.
      // A player with three familiars would have gained rage every time they walked
      // back into their own base, from nothing, forever.
      //
      // Found 2026-08-16 by reading the hook rather than by playing it: nobody has
      // ever walked Wall, so creditNearest() has returned null on every summon this
      // world has ever seen and the whole mechanic is still UNPLAYED. The tag is
      // stored in entity NBT and survives save/load, which is what makes this the
      // correct guard rather than an in-memory set.
      if (hasTag(e, MINION_TAG)) return

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
  // ⭐ RAGE ALSO ANSWERS TO DEATH AND TO TIME
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan, 2026-08-15: "Rage should slowly decrease over days that you do not die,
  // rage itself increasing with death."
  //
  // That turns the counter from a tally into a MOOD. Minions raised and slain are
  // the slow half; YOUR death is the loud half. Every input is the same feeling
  // measured differently - something of hers was taken:
  //
  //     +1   a minion raised          the family grows
  //     -1   a minion slain           something of hers is killed
  //   +DEATH you died                 the worst thing that can happen to her
  //   -DECAY a whole day, nobody died  nothing was lost. She settles.
  //
  // ⭐ THE SHAPE OF IT: she is calm when you are safe and dangerous when you are
  // not, and the danger points at everyone except you. A player who dies repeatedly
  // does not get punished - the SERVER does. That is the most coherent thing about
  // her, and it came out of Ethan's two sentences rather than out of a design.
  var RAGE_ON_DEATH = 8         // ~10% of the way to fury per death
  var RAGE_DECAY_DAY = 2        // so four quiet days undo one death
  var K_CALM_DAY = 'veldora_wall_calmday'   // last world day decay was applied, +1

  function worldDay(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  // Her champion died. This is the loudest input she has.
  EntityEvents.death(function (event) {
    if (!GATE) return
    try {
      var p = event.entity
      if (!p || !p.player) return
      var path = ''
      try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { return }
      if (path !== GOD) return

      if (VELDORA.counter) VELDORA.counter.add(p, GOD, RAGE_ON_DEATH, 'champion died')
      // Reset the calm clock: today is emphatically not a quiet day.
      var server = null
      try { server = p.server } catch (e) { }
      var d = server ? worldDay(server) : null
      if (d !== null) { try { p.persistentData.putInt(K_CALM_DAY, d + 1) } catch (e) { } }
      console.info(TAG + p.username + ' died - rage +' + RAGE_ON_DEATH)
    } catch (err) { console.warn(TAG + 'death->rage hook threw :: ' + err) }
  })

  // ⚠️ DECAY IS APPLIED PER WHOLE DAY ELAPSED, not per tick, and the day is STORED
  // AS day+1 because getInt() returns 0 for a missing key - a first-ever check would
  // otherwise read as "the beginning of the world" and calm her all the way down in
  // one sweep. A stamp from the future (an admin ran /time set) re-stamps instead.
  var CALM_SWEEP = 1200                       // 60s; the day check does the real work

  function calmSweep(server) {
    try {
      var today = worldDay(server)
      if (today === null) { server.scheduleInTicks(CALM_SWEEP, function () { calmSweep(server) }); return }
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { continue }
        if (path !== GOD) continue

        var stored = 0
        try { stored = p.persistentData.getInt(K_CALM_DAY) } catch (e) { continue }
        if (!stored) {                         // first time we have looked at them
          try { p.persistentData.putInt(K_CALM_DAY, today + 1) } catch (e) { }
          continue
        }
        var last = stored - 1
        if (last >= today) continue            // same day, or the clock moved back
        if (last > today) { try { p.persistentData.putInt(K_CALM_DAY, today + 1) } catch (e) { } continue }

        var days = today - last
        var cur = null
        try { if (VELDORA.counter) cur = VELDORA.counter.get(p, GOD) } catch (e) { }
        try { p.persistentData.putInt(K_CALM_DAY, today + 1) } catch (e) { }
        if (cur === null || cur <= 0) continue

        var drop = Math.min(cur, days * RAGE_DECAY_DAY)
        if (drop <= 0) continue
        if (VELDORA.counter) VELDORA.counter.add(p, GOD, -drop, 'quiet days')
        console.info(TAG + p.username + ' had ' + days + ' quiet day(s) - rage -' + drop)
      }
    } catch (e) { console.warn(TAG + 'calm sweep threw :: ' + e) }
    server.scheduleInTicks(CALM_SWEEP, function () { calmSweep(server) })
  }

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

  function sendSpiders(server, me) {
    var target = pickTarget(server, me)
    if (!target) {
      console.info(TAG + 'no valid target for ' + me.username + ' - nobody else ' +
        'online, or everyone is hurt / in a scene. Nothing sent.')
      return false
    }
    if (!VELDORA.spawner) { console.error(TAG + 'no spawner'); return false }

    // ⚠️ BUFFED BY MOOD, NOT BY TIER. The tier is what she SAYS; the slider is what
    // she IS. Keying the buff to the voice tier would have meant a champion at rage
    // 41 (just into 'high') sending the same wave as one at rage 89, which is
    // exactly the stepped behaviour the slider exists to remove.
    var m = mood(me)
    if (m === null) return false
    var buffed = (m >= 0.5)
    var count = 3 + Math.round(m * 3)          // 3 at calm, 6 at fury
    var r = VELDORA.spawner.wave(target, {
      ids: SPIDERS, count: count, minDist: 10, maxDist: 18,
      nbt: spiderNbt(buffed),
    }, function (placed, asked) {
      if (placed === 0) {
        console.error(TAG + '!! spiders for ' + target.username + ' placed NOTHING ' +
          '(asked ' + asked + ') - she attacked and nothing arrived')
      }
    })
    if (!VELDORA.spawner.issued(r)) {
      console.warn(TAG + 'spiders for ' + target.username +
        ' were REFUSED by the spawner - not stamping')
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


  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE SLIDER — rage decides what she is, continuously
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan, 2026-08-15: "we can frame it like a sliding scale against rage. Low rage
  // = Boons. High rage = Attacks. Incrementally increasing. Example 10: only boons,
  // 90: only attacks."
  //
  // Three tiers could not express that. `low/medium/high` is three buckets, and the
  // whole point is that there is no step - she does not BECOME cruel at a threshold,
  // she stops being able to help herself by degrees.
  //
  // So `mood(p)` is a number from 0 to 1, and every event's weight is a CURVE over
  // it (`godevents.js` accepts a weight function for exactly this):
  //
  //      rage   0 ......... 10 ................... 90 ......... MAX
  //      mood   0            0    ---------->       1            1
  //
  //      boons        ████████████▓▓▓▓▒▒▒▒░░░░
  //      she asks              ░░▒▒▓▓████▓▓▒▒░░
  //      attacks                   ░░░░▒▒▒▒▓▓████████████
  //
  // ⭐ THE ASK PEAKS IN THE MIDDLE AND VANISHES AT BOTH ENDS. At low rage she has no
  // reason to ask; at high rage she no longer waits for an answer. The band where
  // you get a say is the band where she is still conflicted, and it closes on its
  // own. That is Ethan's "you slowly lose the ability to choose" as a shape rather
  // than as a rule.
  var RAGE_CALM = 10        // at or below: pure boons, she is only ever kind
  var RAGE_FURY = 90        // at or above: pure attacks, she has stopped asking

  // ⭐ PUBLISHED so godevents can build her chart out of it (docs/23 §VI.0).
  // ⚠️ Merged, never assigned - wall_voice.js also writes VELDORA.wall and sorts
  // after this file. It merges too, now; both halves are defensive on purpose.
  // null propagates: an unreadable counter must NOT read as calm.
  VELDORA.wall = VELDORA.wall || {}

  function mood(p) {
    var n = null
    try { if (VELDORA.counter) n = VELDORA.counter.get(p, GOD) } catch (e) { }
    // ⚠️ UNREADABLE IS NOT CALM. Returning 0 would make a storage failure look like
    // serenity and quietly hand out boons forever. null propagates and every weight
    // below scores 0, so she says nothing at all - which is the honest answer.
    if (n === null) return null
    if (n <= RAGE_CALM) return 0
    if (n >= RAGE_FURY) return 1
    return (n - RAGE_CALM) / (RAGE_FURY - RAGE_CALM)
  }
  VELDORA.wall.mood = mood

  // The three curves. Each returns a weight for godevents' weighted pick.
  function wBoon(base) {
    return function (server, p) {
      var m = mood(p)
      if (m === null) return 0
      return base * (1 - m)
    }
  }
  function wAttack(base) {
    return function (server, p) {
      var m = mood(p)
      if (m === null) return 0
      // Nothing to point at means the attack half of the slider does not exist -
      // and then she is all boons regardless of rage, which is correct: a fury with
      // nobody to be furious at is just a mother alone with her champion.
      if (!pickTarget(server, p)) return 0
      return base * m
    }
  }
  // 4*m*(1-m) is a parabola: 0 at both ends, exactly 1.0 in the middle.
  function wAsk(base) {
    return function (server, p) {
      var m = mood(p)
      if (m === null) return 0
      if (!pickTarget(server, p)) return 0
      return base * 4 * m * (1 - m)
    }
  }

  // ── HER EVENTS ────────────────────────────────────────────────────────────
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
  function evOffer(server, p) {
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
            try { sendSpiders(server, pl) } catch (e) { }
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
  function evWeb(server, p) {
    return sendSpiders(server, p)
  }


  // ── BOONS.  Weight falls as rage rises. ──────────────────────────────────
  function eff(p, id, secs, amp) {
    try { p.potionEffects.add(id, secs * 20, amp || 0, false, false); return true }
    catch (e) { console.warn(TAG + 'effect ' + id + ' threw :: ' + e); return false }
  }

  function evFeast(server, p) {
    // "Eat and feast, you need your strength." She feeds you before anything else.
    if (!eff(p, 'minecraft:saturation', 6, 1)) return false
    eff(p, 'minecraft:regeneration', 10, 0)
    try { if (VELDORA.wall) VELDORA.wall.speak(p, 'gift') } catch (e) { }
    return true
  }

  function evCarry(server, p) {
    // "I will live in the walls you build." The web moves you through the world.
    if (!eff(p, 'minecraft:speed', 90, 1)) return false
    eff(p, 'minecraft:jump_boost', 90, 1)
    eff(p, 'minecraft:slow_falling', 90, 0)
    try { if (VELDORA.wall) VELDORA.wall.speak(p, 'gift') } catch (e) { }
    return true
  }

  // ⭐ SHE GIVES YOU FAMILY, AND THAT RAISES HER RAGE.
  // goety:spider_servant is a player-owned summon, so the minion hook credits it
  // and rage goes UP - which slides her further toward attacking somebody. She
  // cannot give you a gift without becoming more dangerous to everyone else. That
  // loop was not designed; it fell out of her counter being what it is, and it is
  // the most her thing in the file.
  var BROOD = 'goety:spider_servant'
  function evBrood(server, p) {
    if (!VELDORA.spawner) return false
    // ⚠️ TWO QUESTIONS, TWO TIMES. issued() answers "did the spawner take the
    // request" NOW; the callback answers "did anything arrive" a second later. The
    // old code read r.placed synchronously, where it is ALWAYS null, so the guard
    // never fired and this line printed "Rehykt <- null of her brood".
    var r = VELDORA.spawner.wave(p, {
      ids: [BROOD], count: 2, minDist: 3, maxDist: 6,
      nbt: '{Tags:["veldora_wall_brood"]}',
    }, function (placed, asked) {
      if (placed === null) return                    // unmeasurable, already logged
      if (placed === 0) {
        console.error(TAG + '!! brood placed NOTHING for ' + p.username +
          ' (asked ' + asked + ') - she promised family and sent none')
      } else {
        console.info(TAG + p.username + ' <- ' + placed + ' of her brood')
      }
    })
    if (!VELDORA.spawner.issued(r)) {
      console.warn(TAG + 'brood was REFUSED by the spawner for ' + p.username +
        ' - not stamping')
      return false
    }
    if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'low_gift')
    return true
  }

  // ── ATTACKS.  Weight rises with rage. All of these land on SOMEBODY ELSE. ──
  function evSnare(server, me) {
    var target = pickTarget(server, me)
    if (!target) return false
    if (!eff(target, 'minecraft:slowness', 12, 2)) return false
    eff(target, 'minecraft:weakness', 12, 0)
    if (VELDORA.voice) VELDORA.voice.say(target, GOD, 'high_hostile')
    console.info(TAG + '!! ' + me.username + ' -> snared ' + target.username)
    return true
  }

  function evDark(server, me) {
    var target = pickTarget(server, me)
    if (!target) return false
    if (!eff(target, 'minecraft:blindness', 8, 0)) return false
    if (VELDORA.voice) VELDORA.voice.say(target, GOD, 'high_hostile')
    console.info(TAG + '!! ' + me.username + ' -> blinded ' + target.username)
    return true
  }

  // The far end of the slider. Twice the wave, and only once she is nearly all fury.
  function evSwarm(server, me) {
    var target = pickTarget(server, me)
    if (!target || !VELDORA.spawner) return false
    var r = VELDORA.spawner.wave(target, {
      ids: SPIDERS, count: 9, minDist: 10, maxDist: 20, nbt: spiderNbt(true),
    }, function (placed, asked) {
      if (placed === null) return
      if (placed === 0) {
        console.error(TAG + '!! SWARM at ' + target.username + ' placed NOTHING ' +
          '(asked ' + asked + ')')
      } else {
        console.info(TAG + '!! ' + me.username + ' -> SWARM of ' + placed + ' at ' +
          target.username)
      }
    })
    if (!VELDORA.spawner.issued(r)) {
      console.warn(TAG + 'swarm at ' + target.username +
        ' was REFUSED by the spawner - not stamping')
      return false
    }
    if (VELDORA.voice) VELDORA.voice.say(target, GOD, 'high_hostile')
    return true
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
      }, function (placed) {
        // The other half: the spawner accepted it and nothing arrived anyway.
        if (placed !== 0) return
        console.error(TAG + '!! Harvest champion did not ARRIVE for ' + p.username +
          ' - releasing the lock so the sweep retries')
        try { p.persistentData.putString('veldora_harvest_active', '') } catch (e) { }
      })
      // 🚨 A Harvest that did not arrive did not happen. harvest.js has already
      // stamped this begun, so a failed placement must release the lock or the player
      // sits in the harvest phase with nothing to fight.
      //
      // ⚠️ THIS RESCUE HAD NEVER RUN. It tested `r.placed === 0` synchronously, where
      // placed is ALWAYS null - so the one piece of code written to free a player
      // sealed in a broken Harvest was structurally unreachable. Fixed 2026-08-16 by
      // asking the question at the time it can be answered.
      if (!VELDORA.spawner.issued(r)) {
        console.error(TAG + '!! Harvest was REFUSED by the spawner for ' + p.username +
          ' - releasing the lock so the sweep retries')
        try { p.persistentData.putString('veldora_harvest_active', '') } catch (e) { }
      }
    })
    console.info(TAG + 'Harvest scene opened for ' + p.username +
      ' - hers arrives at ' + spawnAt + 't')
    return true
  }

  // Delayed, so she speaks AFTER the world has said what happened.
  // ⭐ THE ONLY DOOR SHE HAS.
  // Ethan: "the wall doesn't ever drop or release you. the only way to be released
  // is from winning the harvest." fall.js will not let her go, /path release is
  // admin-only, and absence does not exist - so if this does not fire, a Spider
  // champion is bound forever. It is the single most load-bearing call in her file.
  //
  // Her closing lines are Ethan's and they are already a release: "I guess this is
  // the end. I didn't want it to end like this. I had no choice. Not really. You are
  // ready." The release lands after them.
  function harvestWin(server, p) {
    server.scheduleInTicks(20, function () {
      try { if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'harvest_won') } catch (e) { }
    })
    server.scheduleInTicks(160, function () {
      try {
        if (VELDORA.paths && typeof VELDORA.paths.release === 'function') {
          VELDORA.paths.release(server, p)
        } else {
          console.error(TAG + '!! cannot release ' + p.username + ' - ' +
            'VELDORA.paths.release is missing. She has NO other exit; they are stuck.')
        }
      } catch (e) { console.error(TAG + 'release threw :: ' + e) }
    })
    console.info(TAG + p.username + ' WON her Harvest - releasing in 160t (her ONLY exit)')
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
      var m = mood(p)
      p.tell(Text.of('§8rage: §f+1§8 per minion raised, §f-1§8 per minion slain'))
      if (m === null) {
        p.tell(Text.of('§cmood UNREADABLE - she will say nothing at all'))
      } else {
        var pct = Math.round(m * 100)
        var bar = ''
        for (var b = 0; b < 20; b++) bar += (b < Math.round(m * 20)) ? '§c|' : '§a|'
        p.tell(Text.of('§8boons ' + bar + ' §8attacks  §f' + pct + '%§8 toward fury'))
        p.tell(Text.of('§8calm at §f' + RAGE_CALM + '§8, fury at §f' + RAGE_FURY +
          '§8 · she asks most at §f' + Math.round((RAGE_CALM + RAGE_FURY) / 2)))

        // THE LEGIBILITY LAW. Gating every attack to night means a furious Spider
        // does NOTHING all day - correct, and indistinguishable from broken unless
        // the player is told. This is the telling.
        var night = null
        try { if (VELDORA.events) night = VELDORA.events.isNight(ctx.source.server) } catch (e) { }
        if (night === null) {
          p.tell(Text.of('§8reach: §cclock unreadable §8- gates are open by default'))
        } else if (night) {
          p.tell(Text.of('§8it is §fNIGHT§8. She can reach the others.' +
            (m >= 0.7 ? ' §c§lAnd she wants to.' : '')))
        } else {
          p.tell(Text.of('§8it is §fDAY§8. Nothing of hers touches another player.'))
          if (m > 0.9) {
            p.tell(Text.of('§c§lShe is at fury and cannot act. She is only waiting.'))
          }
        }
      }
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF'); return }
    if (!VELDORA.events) { console.error(TAG + 'godevents.js missing'); return }

    // ⭐ NO TIER GATING. Every event is registered for every tier and the CURVE
    // decides - that is what makes the change incremental instead of stepped. The
    // voice still uses low/medium/high, because what she SAYS does step.
    var ALL = ['low', 'medium', 'high']

    VELDORA.events.register(GOD, {
      id: 'boon', kind: 'buff', run: evBoon, hostile: false, cooldown: 1, weight: wBoon(4), tiers: ALL,
      does: 'BOON - regeneration + absorption on her own champion. Weight falls as ' +
        'rage rises',
    })
    VELDORA.events.register(GOD, {
      id: 'feast', kind: 'buff', run: evFeast, hostile: false, cooldown: 1, weight: wBoon(3), tiers: ALL,
      does: 'BOON - saturation + regeneration. She feeds you before anything else',
    })
    VELDORA.events.register(GOD, {
      id: 'carry', kind: 'buff', run: evCarry, hostile: false, cooldown: 2, weight: wBoon(3), tiers: ALL,
      does: 'BOON - speed, jump and slow-fall for 90s. The web carries you',
    })
    VELDORA.events.register(GOD, {
      id: 'brood', kind: 'buff', run: evBrood, hostile: false, cooldown: 3, weight: wBoon(2), tiers: ALL,
      does: 'BOON - gives you 2 goety spider servants. NOTE: they count as raised ' +
        'minions, so this gift RAISES her rage and slides her toward attacking',
    })

    // ═══════════════════════════════════════════════════════════════════════
    // ⭐ SHE ONLY REACHES ANOTHER PLAYER AT NIGHT.  Ethan, 2026-08-16:
    //     "Attacks from wall should only be at night."
    //
    // All FIVE things that touch someone else are gated, not just the four called
    // ATTACK. `offer` is the ask - and saying yes runs sendSpiders() twenty ticks
    // later, so leaving it open would have let her attack at noon through the one
    // event that has a consent screen on it. The rule is "nothing of hers reaches
    // another player in daylight", and that is what is implemented.
    //
    // ⭐ WHAT THIS DOES TO HER, AND IT IS THE GOOD PART. Her weights already swing
    // with rage: wBoon is base x (1-mood) and wAttack is base x mood. So
    //
    //     day, low rage     boons. She feeds you, carries you, gives you spiders
    //     day, high rage    wBoon -> 0 and every attack is gated -> SHE SAYS
    //                       NOTHING. Total weight is 0 and godevents fires nothing
    //     night, high rage  all of it lands at once
    //
    // 🚨 THAT DAYTIME SILENCE IS DELIBERATE AND IT IS ALSO THE §8.3 TRAP - "a god
    // whose state never fires goes silent, and a silent god reads as broken". The
    // difference here is that the player can SEE it coming: /rage shows the number
    // and now says so in words, and her idle voice still speaks. A whole day of a
    // furious Spider doing nothing, paid off at dusk, is the mechanic. If it reads
    // as broken instead of as dread, the fix is a daylight event she can spend her
    // fury on - NOT removing the gate.
    // ═══════════════════════════════════════════════════════════════════════
    var atNight = VELDORA.events.atNight
    var andNight = function (fn) { return VELDORA.events.allOf(fn, atNight) }

    VELDORA.events.register(GOD, {
      id: 'offer', kind: 'attack', scene: true, run: evOffer, hostile: false, cooldown: 2, weight: wAsk(5), tiers: ALL,
      guard: atNight,
      does: 'THE ASK - permission to attack another player, via the ritual. Refusable. ' +
        'Weight PEAKS in the middle of the rage range and vanishes at both ends',
    })

    VELDORA.events.register(GOD, {
      id: 'snare', kind: 'invade', run: evSnare, hostile: false, cooldown: 1, weight: wAttack(3), tiers: ALL,
      guard: atNight,
      does: 'ATTACK - slowness II + weakness on another player for 12s. NIGHT ONLY',
    })
    VELDORA.events.register(GOD, {
      id: 'dark', kind: 'invade', run: evDark, hostile: false, cooldown: 2, weight: wAttack(3), tiers: ALL,
      guard: atNight,
      does: 'ATTACK - blindness on another player for 8s. NIGHT ONLY',
    })
    VELDORA.events.register(GOD, {
      id: 'web', kind: 'invade', run: evWeb, hostile: false, cooldown: 2, weight: wAttack(4), tiers: ALL,
      guard: atNight,
      does: 'ATTACK - 5 buffed spiders at another player, no choice. NIGHT ONLY',
    })
    VELDORA.events.register(GOD, {
      id: 'swarm', kind: 'invade', run: evSwarm, hostile: false, cooldown: 4, weight: wAttack(2), tiers: ALL,
      // Only at the far end. A 9-spider wave should be the thing that happens when
      // she has stopped being a person about it.
      //
      // ⚠️ COMPOSED, never replaced. Writing the night check into this function by
      // hand would have made "is it night" have two implementations in one file -
      // which is exactly how veldora_refused_ ended up load-bearing for a mechanic
      // that lived somewhere else.
      guard: andNight(function (server, p) { var m = mood(p); return m !== null && m >= 0.7 }),
      does: 'ATTACK - NINE buffed spiders at another player. NIGHT ONLY, and guarded ' +
        'to rage >= 70% of the way to fury',
    })

    if (VELDORA.harvest) {
      VELDORA.harvest.register(GOD, {
        arrive: harvestArrive, onWin: harvestWin, onLose: harvestLose,
        tag: ACTOR_TAG,
      })
    } else console.error(TAG + 'harvest.js missing - her Harvest will not arrive')

    calmSweep(event.server)
    console.info(TAG + 'rage: +1 raised, -1 slain, +' + RAGE_ON_DEATH + ' on YOUR ' +
      'death, -' + RAGE_DECAY_DAY + ' per quiet day. She never lets go - winning ' +
      'her Harvest is the only exit.')
    console.info(TAG + 'The Spider - 9 events on a SLIDING SCALE against rage. ' +
      'Boons at ' + RAGE_CALM + ' and below, attacks at ' + RAGE_FURY + ' and above, ' +
      'and she only ASKS in between. Rage = +1 per minion raised, -1 per slain. ' +
      'PvP ' + (HOSTILE_TO_PLAYERS ? 'ON' : 'OFF') + ', target floor ' +
      Math.round(TARGET_FLOOR * 100) + '%.')
  })
})();
