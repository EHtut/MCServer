// wall_events.js - THE SPIDER'S RAGE.  docs/43
//
// Ethan, 2026-08-15:
//   "her counter is rage."
//   "counter can be a plus for every minion raised and a loss for every minion slain"
//     ^ SUPERSEDED 2026-08-16: "wall should no longer be based on minions...
//       deaths + losing hearts increase rage. gaining hearts and not dying for a
//       quarter of a day decreases it."
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
  // 🔴 THE MINION APPARATUS IS GONE.  Ethan, 2026-08-16:
  //     "wall should no longer be based on minions... Minion counts feel a bit too
  //      uncountable especially with goety's timegated minions"
  //
  // He is right, and it is the correct call even though this machinery was built
  // and repaired the same day. Goety gates summons behind cooldowns and durations,
  // so "minions raised" measured a mod's timers as much as a player's intent - and
  // the attribution alone needed a namespace filter, an NBT owner search and a
  // once-ever tag guard, all to answer a question that was the wrong one.
  //
  // Removed with it: isGoety, idOf, isMinion, wallWalkers, nbtOf, ownerFromNbt,
  // creditNearest, ownerFromTags, hasTag, the spawned hook and the minion death
  // hook. ~120 lines. RAGE NOW WATCHES THE PLAYER - see below.
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ RAGE WATCHES THE PLAYER.  Ethan, 2026-08-16: "deaths + losing hearts
  // increase rage. gaining hearts and not dying for a quarter of a day decreases
  // it."
  //
  // This is a better fit for what rage MEANS than counting summons ever was. It is
  // her attention, and her attention is on your body - so it rises when you are
  // hurt and falls when you are safe. The minion master reading is preserved where
  // it belongs, in her EVENTS, which still hand you spiders.
  //
  // SAMPLED, not hooked. Health is compared on a slow sweep rather than on every
  // damage event: regeneration ticks would otherwise fire dozens of times a second
  // and a hurt hook cannot see healing at all. One mechanism reads both directions.
  //
  // ⚠️ FRACTIONS ARE CARRIED IN MEMORY. The counter is an integer store, so a half
  // heart cannot be written - the accumulator holds the remainder and only whole
  // points are committed. Without it every small hit would round to zero and rage
  // would never move outside of deaths.
  var RAGE_ON_DEATH = 8         // ~10% of the way to fury per death
  var DMG_PER_RAGE = 4.0        // 4 damage (2 hearts) LOST  = +1 rage
  var HEAL_PER_RAGE = 6.0       // 6 healing (3 hearts) GAINED = -1 rage
  var HEALTH_TICKS = 40         // sample every 2s
  var QUIET_TICKS = 6000        // a QUARTER world day without dying
  var QUIET_DROP = 2            // ...takes this much off

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
      // Restart the calm clock - this is emphatically not staying alive.
      var server = null
      try { server = p.server } catch (e) { }
      var nt = server ? nowTicks(server) : null
      if (nt !== null) { try { p.persistentData.putInt(K_LAST_DEATH, nt + 1) } catch (e) { } }
      // 🚨 And forget the body baseline, or the respawn's full heal reads as the
      // biggest heal in the game and refunds the +8 this death just cost her.
      forgetBody(p)
      console.info(TAG + p.username + ' died - rage +' + RAGE_ON_DEATH)
    } catch (err) { console.warn(TAG + 'death->rage hook threw :: ' + err) }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // THE CALM: a QUARTER of a world day without dying takes rage off.
  //
  // Ethan, 2026-08-16: "not dying for a quarter of a day decreases it." A world day
  // is 24000 ticks, so this is 6000 - about five real minutes of staying alive.
  // Measured from the LAST DEATH, not from the last time rage moved: getting hurt
  // and healing should not reset her patience, only dying should.
  //
  // ⚠️ TICKS, AND THE CLOCK CAN MOVE. dayTime() is absolute and an admin can rewind
  // it, so a stamp from the future is re-anchored rather than trusted - finding K9,
  // which this project has now paid for in six places.
  // ═══════════════════════════════════════════════════════════════════════════
  var K_LAST_DEATH = 'veldora_wall_lastdeath'   // world tick of the last death, +1
  var CALM_SWEEP = 200                          // 10s

  function nowTicks(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d)
    } catch (e) { }
    return null
  }

  function calmSweep(server) {
    try {
      var now = nowTicks(server)
      if (now === null) { server.scheduleInTicks(CALM_SWEEP, function () { calmSweep(server) }); return }
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { continue }
        if (path !== GOD) continue

        var stored = 0
        try { stored = p.persistentData.getInt(K_LAST_DEATH) } catch (e) { continue }
        if (!stored) {                          // never seen them die - start the clock
          try { p.persistentData.putInt(K_LAST_DEATH, now + 1) } catch (e) { }
          continue
        }
        var last = stored - 1
        if (last > now) {                       // clock rewound; re-anchor, do not decay
          try { p.persistentData.putInt(K_LAST_DEATH, now + 1) } catch (e) { }
          continue
        }
        var chunks = Math.floor((now - last) / QUIET_TICKS)
        if (chunks <= 0) continue

        var cur = null
        try { if (VELDORA.counter) cur = VELDORA.counter.get(p, GOD) } catch (e) { }
        // Advance the stamp by exactly the quarters consumed, so the remainder
        // carries instead of being thrown away every sweep.
        try { p.persistentData.putInt(K_LAST_DEATH, last + chunks * QUIET_TICKS + 1) } catch (e) { }
        if (cur === null || cur <= 0) continue

        var drop = Math.min(cur, chunks * QUIET_DROP)
        if (drop <= 0) continue
        if (VELDORA.counter) VELDORA.counter.add(p, GOD, -drop, 'stayed alive')
        console.info(TAG + p.username + ' survived ' + chunks + ' quarter-day(s) - rage -' + drop)
      }
    } catch (e) { console.warn(TAG + 'calm sweep threw :: ' + e) }
    server.scheduleInTicks(CALM_SWEEP, function () { calmSweep(server) })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE BODY: hearts lost raise her, hearts regained settle her.
  //
  // Sampled rather than hooked - see the note on the constants. Two accumulators in
  // MEMORY carry the fractional remainder, because the counter store is integers and
  // a half-heart would otherwise round to nothing forever.
  //
  // 🚨 DEATH MUST NOT READ AS HEALING. Respawning restores full health, which on the
  // next sample looks like the largest heal in the game and would immediately refund
  // the +8 the death just cost her. The death hook clears the baseline, and a sample
  // with no baseline only re-baselines.
  // ═══════════════════════════════════════════════════════════════════════════
  var lastHp = {}                 // uuid -> health at the last sample
  var hurtAcc = {}                // uuid -> damage not yet worth a whole rage point
  var healAcc = {}                // uuid -> healing, same

  function forgetBody(p) {
    try {
      var u = String(p.uuid)
      delete lastHp[u]; delete hurtAcc[u]; delete healAcc[u]
    } catch (e) { }
  }

  function bodySweep(server) {
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { continue }
        if (path !== GOD) continue
        var u = null, hp = null
        try { u = String(p.uuid); hp = p.health } catch (e) { continue }
        if (typeof hp !== 'number' || !isFinite(hp)) continue

        var prev = lastHp[u]
        lastHp[u] = hp
        if (typeof prev !== 'number') continue   // first sample, or just respawned

        var delta = hp - prev
        if (delta === 0) continue

        if (delta < 0) {
          hurtAcc[u] = (hurtAcc[u] || 0) + (-delta)
          var up = Math.floor(hurtAcc[u] / DMG_PER_RAGE)
          if (up > 0) {
            hurtAcc[u] -= up * DMG_PER_RAGE
            if (VELDORA.counter) VELDORA.counter.add(p, GOD, up, 'hurt')
          }
        } else {
          healAcc[u] = (healAcc[u] || 0) + delta
          var down = Math.floor(healAcc[u] / HEAL_PER_RAGE)
          if (down > 0) {
            healAcc[u] -= down * HEAL_PER_RAGE
            var cur = null
            try { if (VELDORA.counter) cur = VELDORA.counter.get(p, GOD) } catch (e) { }
            if (cur !== null && cur > 0) {
              if (VELDORA.counter) VELDORA.counter.add(p, GOD, -Math.min(cur, down), 'healed')
            }
          }
        }
      }
    } catch (e) { console.warn(TAG + 'body sweep threw :: ' + e) }
    server.scheduleInTicks(HEALTH_TICKS, function () { bodySweep(server) })
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

  function sendSpiders(server, me, tag) {
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

    // ⭐ SHE SPEAKS TO THE TARGET, not to her champion - she explains herself to the
    // person she is killing, which is worse than threatening them.
    //
    // One pool PER ATTACK since 2026-08-16. `high_hostile` was a single voice for
    // blindness, slowness, five spiders and nine - four mechanically distinct things
    // that were audibly identical, in her most distinctive content in the game.
    if (VELDORA.voice) VELDORA.voice.say(target, GOD, tag || 'web_hit')
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ CONTRACTS (+++) — the row her chart rated and she had nothing in.
  //
  // Ethan, 2026-08-16: "switch to contracts, what we can do is every battle is a
  // choice she offers to help the player grow stronger."
  //
  // Mechanically this is Blade's contract. Tonally it is the opposite, and the
  // difference is the entire character: he BUYS a kill, she offers to remove
  // something that is holding you back. Neither of them says the quiet part.
  //
  // ⚠️ DUPLICATED FROM blade_events.js ON PURPOSE, FOR NOW. His version is welded
  // into the Mark's apparatus (K_TARGET/K_DUE/markSweep) which is his alone. Two
  // implementations of "kill that player by day N" is exactly the kind of thing this
  // codebase gets bitten by, so this is flagged rather than hidden: when a THIRD god
  // wants one, extract it - do not write it a third time.
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ MIGRATED to killorder.js, 2026-08-16. She kept her own target/deadline/sweep
  // for exactly one day; Salvage became the third god to want the same thing, so the
  // storage moved to one shared file and she kept only what is HERS - the ask, and
  // what settling it means. See killorder.js for why Blade did not move.
  var CONTRACT_DAYS = 3                    // gentler than Blade's 2. She is patient.

  function evContract(server, me) {
    if (!HOSTILE_TO_PLAYERS) return false
    if (!VELDORA.killorder) { console.error(TAG + 'killorder.js missing'); return false }
    if (VELDORA.killorder.held(me, GOD)) return false
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    try { if (VELDORA.ritual.active(me)) return false } catch (e) { return false }

    var target = pickTarget(server, me)
    if (!target) return false
    var tname = '?'
    try { tname = String(target.username) } catch (e) { return false }

    var ask = ''
    try { ask = VELDORA.voice.line(GOD, 'contract_ask', me) || '' } catch (e) { }
    if (!ask) {
      console.info(TAG + 'contract HELD - `contract_ask` has no lines yet')
      return false
    }

    return VELDORA.ritual.begin(me, {
      colour: '§5§l',
      lines: [ask.split('{target}').join(tname)],
      options: [{ id: 'yes', label: 'Yes.' }, { id: 'no', label: 'Not them.' }],
      holdAfterChoice: 60,
      onChoose: function (pl, id) {
        if (id !== 'yes') return
        VELDORA.killorder.open(pl.server, pl, GOD, tname)
      },
      onTimeout: function () { },
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE QUIET — once per session, and it is the only time she is short.
  //
  // Her brief: "She goes quiet exactly once per conversation, and that's when the
  // true thing comes out. One short sentence, then straight back to talking."
  //
  // ⚠️ ONCE PER SESSION, NOT PER WORLD DAY. Every other cadence in this project is
  // day-stamped, and a day is twenty minutes - which would fire this three times an
  // hour and destroy it. "Conversation" means since you logged in, so the flag lives
  // in MEMORY and dies with the session on purpose. It is the one piece of state
  // here that must NOT persist.
  // ═══════════════════════════════════════════════════════════════════════════
  var QUIET_TICK = 2400            // 2 min between rolls
  var QUIET_CHANCE = 0.08          // ~25 min of eligible play before it lands
  var quietDone = {}               // uuid -> true, in memory, cleared on login

  PlayerEvents.loggedIn(function (event) {
    try { delete quietDone[String(event.player.uuid)] } catch (e) { }
  })

  function quietSweep(server) {
    try {
      if (!GATE) { server.scheduleInTicks(QUIET_TICK, function () { quietSweep(server) }); return }
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        var uuid = ''
        try { uuid = String(p.uuid) } catch (e) { continue }
        if (quietDone[uuid]) continue
        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { continue }
        if (path !== GOD) continue
        if (Math.random() > QUIET_CHANCE) continue
        try { if (VELDORA.ritual && VELDORA.ritual.active(p)) continue } catch (e) { }
        if (!VELDORA.voice || !VELDORA.voice.say(p, GOD, 'quiet')) continue
        quietDone[uuid] = true
        console.info(TAG + p.username + ' heard THE QUIET - once this session, and ' +
          'that is the whole point of it')
      }
    } catch (e) { console.warn(TAG + 'quietSweep threw :: ' + e) }
    server.scheduleInTicks(QUIET_TICK, function () { quietSweep(server) })
  }

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
  // goety:spider_servant is a player-owned summon. It no longer feeds her counter
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
    if (VELDORA.voice) VELDORA.voice.say(target, GOD, 'snare_hit')
    console.info(TAG + '!! ' + me.username + ' -> snared ' + target.username)
    return true
  }

  function evDark(server, me) {
    var target = pickTarget(server, me)
    if (!target) return false
    if (!eff(target, 'minecraft:blindness', 8, 0)) return false
    if (VELDORA.voice) VELDORA.voice.say(target, GOD, 'dark_hit')
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
    if (VELDORA.voice) VELDORA.voice.say(target, GOD, 'swarm_hit')
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
      p.tell(Text.of('§8rage: §f+8§8 death, §f+1§8 per 4 damage taken, §f-1§8 per 6 healed, §f-2§8 per quarter-day alive'))
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
      does: 'BOON - gives you 2 goety spider servants. (Since 2026-08-16 they no ' +
        'longer feed her rage: rage watches the player, not the minion count.)',
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

    // +++ on her chart, and she had nothing in it until 2026-08-16.
    VELDORA.events.register(GOD, {
      id: 'contract', kind: 'contract', scene: true, run: evContract,
      hostile: false, cooldown: 4, weight: 3, tiers: ALL,
      does: 'CONTRACT (choice) - she ASKS you to remove another champion, framed as ' +
        'helping you grow rather than as wanting them dead. Settling it takes RAGE ' +
        'OFF her (-4) instead of paying loot. Letting it lapse costs NOTHING - she ' +
        'absorbs a refusal, which is worse',
    })

    // Her half of the shared kill order: what settling it MEANS. Her reward is rage
    // DOWN, not loot - she is calmer once the thing between you is removed - and a
    // lapse costs nothing at all, because she absorbs a refusal rather than punishing
    // it, which is worse. "She never turns cruel. She just never stops."
    if (VELDORA.killorder) {
      VELDORA.killorder.register(GOD, {
        days: CONTRACT_DAYS,
        onSettle: function (p) {
          if (VELDORA.counter) VELDORA.counter.add(p, GOD, -4, 'contract settled')
          if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'contract_done')
        },
        onLapse: function (p) {
          if (VELDORA.voice) VELDORA.voice.say(p, GOD, 'contract_lapsed')
        },
      })
    } else console.error(TAG + 'killorder.js missing - her contract cannot resolve')

    calmSweep(event.server)
    bodySweep(event.server)
    quietSweep(event.server)
    // ⚠️ "+1 raised, -1 slain" survived here when the minion apparatus was deleted, so
    // this line claimed minions still fed her rage while the line immediately BELOW
    // it said "Rage watches YOUR BODY, not minions" - the boot report contradicting
    // itself in two consecutive sentences. Found by reading the live log after the
    // restart, not by any test: a banner is a string, and no harness reads strings.
    console.info(TAG + 'rage: +' + RAGE_ON_DEATH + ' on YOUR ' +
      'death, +1 per ' + DMG_PER_RAGE + ' damage taken, -1 per ' + HEAL_PER_RAGE +
      ' healed, -' + QUIET_DROP + ' per quarter-day alive. She never lets go - and ' +
      'with the Harvest cut (docs/62) there is now NO exit at all, which suits her ' +
      'better than the old rule did.')
    console.info(TAG + 'The Spider - 9 events on a SLIDING SCALE against rage. ' +
      'Boons at ' + RAGE_CALM + ' and below, attacks at ' + RAGE_FURY + ' and above, ' +
      'and she only ASKS in between. Rage watches YOUR BODY, not minions. ' +
      'PvP ' + (HOSTILE_TO_PLAYERS ? 'ON' : 'OFF') + ', target floor ' +
      Math.round(TARGET_FLOOR * 100) + '%.')
  })
})();
