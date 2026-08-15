// instant_respawn.js — E2a of the Path System build. docs/24
//
// YOU WAKE WHERE YOU FELL.
//
// Ethan, 2026-08-11: "What if dying doesn't bring you back to your bed? you just
// wake up where you fell?"
//
// This REPLACES the old behaviour (respawn, then teleport to the bed 0.75s later)
// and in doing so DELETES a whole class of bug rather than working around it. The
// cross-dimension guard, the dimId() normaliser and the "vanilla owns this one"
// branch are all gone: if you never move the player to another dimension, the
// client never needs a dimension-change handshake it did not agree to, and the
// cemented-to-the-bed / placing-netherrack / shaking failures cannot happen.
//
// ── WHY THIS IS NOT SIMPLY CRUELLER ──────────────────────────────────────────
// The documented design was "death costs the run, never the base - the cost is
// THE TRIP BACK". Waking in place removes the trip back entirely and replaces it
// with something better: THERE IS NO SAFE RESET. You are still in the room, with
// whatever is in it.
//
// ── THE MEASUREMENT THIS IS BUILT ON ─────────────────────────────────────────
// E0 probe P8, taken live on 2026-08-12 from a real death:
//
//     at the DEATH SITE : 7 living mobs within 24 blocks, ALL 7 hostile
//     at the bed        : 1 mob, 0 hunting the player
//
// So waking in place drops the player in front of seven hostiles. Without a grace
// window this is not a risk of a death spiral, it is a guarantee of one - and the
// first version of that probe measured the BED and would have reported it safe.
;(function () {
  var INVASION_FLAG = 'invasion_active'   // set by D4 later; absent for now

  var GRACE_TICKS = 100                   // 5s of Resistance on waking
  var GRACE_AMP = 2                       // Resistance III
  var DETARGET_RADIUS = 24                // matches what P8 sampled
  var RESPAWN_DELAY = 15                  // ticks; see THE 15-TICK NOTE below

  // Where each player died, remembered only between death and respawn.
  var fell = {}

  // ---------------------------------------------------------------------------
  // THE SECOND-DEATH RULE — the general answer to "what if I cannot get out?"
  //
  // Ethan, 2026-08-12: "what if you die in lava or are stuck in a hole with no way
  // out?"
  //
  // Lava is handled below by hazardAt(). The hole is not, and CANNOT be, by
  // inspection: a sealed pocket, a ravine with nothing left to pillar with, no
  // pickaxe, suffocating inside a block, a mob pack unsurvivable at any health -
  // the list of ways a spot can be inescapable has no end, and every hazard we
  // fail to enumerate becomes an infinite death loop that costs a level a cycle.
  //
  // So do not predict the trap. DETECT THE LOOP. If a player dies twice in
  // essentially the same place in quick succession, the place is the problem, and
  // the second respawn goes to the bed. That covers every hazard at once,
  // including the ones nobody has thought of yet.
  //
  // It also composes with E2c: a death inside the grace window must not advance
  // the regard counter, so a spiral costs a path nothing either.
  // ---------------------------------------------------------------------------
  var REPEAT_RADIUS = 8         // blocks; "essentially the same place"
  var REPEAT_TICKS = 2400       // 2 minutes of server uptime
  var recent = {}               // uuid -> {x,y,z,dim,tick}

  function diedHereBefore(player, x, y, z, dim) {
    var r = recent[String(player.uuid)]
    if (!r || r.dim !== dim) return false
    var now = 0
    try { now = player.server.tickCount } catch (e) { return false }
    // A stamp from the FUTURE means the server restarted between the two deaths -
    // that is finding K9 exactly, where uptime was compared across a restart and
    // silently disabled a whole system. Treat it as no prior death.
    if (r.tick > now) return false
    if (now - r.tick > REPEAT_TICKS) return false
    var dx = r.x - x, dy = r.y - y, dz = r.z - z
    return (dx * dx + dy * dy + dz * dz) <= (REPEAT_RADIUS * REPEAT_RADIUS)
  }

  // ---------------------------------------------------------------------------
  // THE HAZARD RULE — the one thing that would make this WORSE than the bed.
  //
  // The death site is normally survivable by definition: the player was standing
  // in it a moment ago. The exceptions are precisely the deaths people rage-quit
  // over - lava, fire, and falling out of the world. Waking a player into lava is
  // an infinite loop that costs them a level every cycle.
  //
  // Block reads use `.id`, NOT `.isAir()`. E0 probe P11 measured `.isAir()` three
  // times on three different blocks and got
  //     TypeError: Cannot find function isAir
  // every time. That is the same call the K7 footing probe shipped on, which is
  // why K7 never worked once.
  // ---------------------------------------------------------------------------
  function hazardAt(level, x, y, z) {
    if (y < -100) return 'the void'
    try {
      var here = String(level.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)).id)
      var below = String(level.getBlock(Math.floor(x), Math.floor(y) - 1, Math.floor(z)).id)
      var bad = function (id) {
        return id.indexOf('lava') >= 0 || id.indexOf('fire') >= 0 || id.indexOf('magma') >= 0
      }
      if (bad(here)) return here
      if (bad(below)) return below
    } catch (e) {
      return 'unreadable'                 // fail toward the bed, never into a guess
    }
    return null
  }

  // ---------------------------------------------------------------------------
  // THE GRACE WINDOW — Resistance, plus a REPEATED detarget.
  //
  // ⚠️ The first version swept once, immediately after the teleport, and the very
  // first live test proved it useless:
  //
  //     [respawn] Rehykt woke where they fell (470,-41,227) - 0 mob(s) detargeted
  //
  // ...while the probe had measured TEN living mobs, NINE hostile, at that exact
  // spot. Nothing was cleared because at the instant of arrival nothing had
  // acquired the player YET - their previous target died a moment ago, and they
  // re-acquire over the following ticks. A single sweep fires into the one window
  // where there is provably nothing to clear.
  //
  // So sweep REPEATEDLY across the whole grace period. Anything that locks on gets
  // let go again, which is what "they have to find you again" actually requires.
  // Only targets pointing at THIS player are cleared, so a nearby fight belonging
  // to somebody else is left alone.
  // ---------------------------------------------------------------------------
  var SWEEPS = [0, 20, 40, 60, 80]        // ticks into the window

  function detargetOnce(player) {
    var cleared = 0
    try {
      var near = player.level.getEntitiesWithin(player.boundingBox.inflate(DETARGET_RADIUS))
      for (var i = 0; i < near.length; i++) {
        var m = near[i]
        try {
          if (!m || m.player || !m.living) continue
          var t = null
          try { t = m.getTarget() } catch (x) { try { t = m.target } catch (y) { } }
          if (t && String(t.uuid) === String(player.uuid)) { m.setTarget(null); cleared++ }
        } catch (x) { }
      }
    } catch (e) { }
    return cleared
  }

  function grace(player) {
    try { player.potionEffects.add('minecraft:resistance', GRACE_TICKS, GRACE_AMP, false, false) } catch (e) { }
    var total = detargetOnce(player)
    var server = null
    try { server = player.server } catch (e) { }
    if (server) {
      for (var s = 1; s < SWEEPS.length; s++) {
        (function (delay) {
          server.scheduleInTicks(delay, function () {
            try {
              if (!player.alive) return
              var n = detargetOnce(player)
              if (n) console.info('[respawn] grace sweep +' + delay + 't released ' +
                n + ' mob(s) from ' + player.username)
            } catch (e) { }
          })
        })(SWEEPS[s])
      }
    }
    return total
  }

  EntityEvents.death(function (event) {
    var player = event.entity
    if (!player || !player.player) return    // EntityEvents fires for everything

    // D4 hook: while an invasion runs, the spectator rule owns death instead.
    // Reading a flag that does not exist yet is harmless - it is simply never
    // true until D4 sets it.
    try {
      if (player.server.persistentData.getBoolean(INVASION_FLAG)) return
    } catch (e) { }

    try {
      var uuid = String(player.uuid)
      var dim = String(player.level.dimension)
      var repeat = diedHereBefore(player, player.x, player.y, player.z, dim)
      fell[uuid] = {
        x: player.x, y: player.y, z: player.z,
        dim: dim,
        repeat: repeat,          // second death in the same spot -> take the bed
      }
      var tick = 0
      try { tick = player.server.tickCount } catch (e2) { }
      recent[uuid] = { x: player.x, y: player.y, z: player.z, dim: dim, tick: tick }
    } catch (e) { }

    // ---------------------------------------------------------------------------
    // THE 15-TICK NOTE, kept from the previous version because the reason still
    // holds. At 1 tick the server moved the player before the client had processed
    // the death packet at all, and the log named it exactly:
    //     18:02:05.15  Rehykt was killed
    //     18:02:05.23  Rehykt moved too quickly!  266.4, -44.4, 284.9
    // The client still believed it was at the death position, so every movement
    // packet disagreed with the server. That is the shake. 15 ticks lets the death
    // sequence finish and be acknowledged first.
    // ---------------------------------------------------------------------------
    var deadUuid = null
    try { deadUuid = String(player.uuid) } catch (e) { }
    var srv = null
    try { srv = player.server } catch (e) { }
    if (!srv || !deadUuid) { console.error('[respawn] no server/uuid - cannot schedule'); return }

    srv.scheduleInTicks(RESPAWN_DELAY, function () {
      try {
        // 🚨 THE PLAYER MAY HAVE LEFT IN THESE 15 TICKS.
        //
        // Ethan, 2026-08-15: "the death respawn mechanic is blocking people from
        // getting into the server."
        //
        // Dying and quitting to title inside 0.75s is not an edge case, it is what
        // people DO on a death screen. The previous version captured `player` and
        // called playerList.respawn() on it unconditionally, so a disconnected
        // ServerPlayer got respawned - which corrupts the session server-side and
        // the symptom is a player who cannot get back in.
        //
        // This is J4, the same hazard ritual.js built three independent layers
        // against and explicitly recorded as UNPROVEN. This file had none of them.
        //
        // Re-resolve from the LIVE player list rather than trusting the captured
        // reference: if they are gone, there is nothing to respawn and vanilla will
        // place them normally on their next login.
        var live = null
        try {
          var list = srv.players
          for (var i = 0; i < list.length; i++) {
            if (String(list[i].uuid) === deadUuid) { live = list[i]; break }
          }
        } catch (e) { console.warn('[respawn] could not read the player list :: ' + e) }

        if (!live) {
          console.info('[respawn] ' + deadUuid.substring(0, 8) +
            ' left within ' + RESPAWN_DELAY + 't of dying - NOT respawning a ghost')
          try { delete fell[deadUuid] } catch (e) { }
          return
        }

        // Verified against neoforge-21.1.247-server.jar:
        //   MinecraftServer.getPlayerList() -> PlayerList
        //   PlayerList.respawn(ServerPlayer, boolean, Entity$RemovalReason)
        srv.playerList.respawn(live, false, 'killed')
      } catch (e) {
        // Loud. A respawn that quietly stops working is indistinguishable from a
        // player choosing to sit on the death screen, which is how this class of
        // bug survives for months.
        console.error('[respawn] respawn failed, players will see the death screen: ' + e)
      }
    })
  })

  // The player is back in the world - at their bed. Move them to where they fell.
  PlayerEvents.respawned(function (event) {
    var p = event.player
    if (!p) return
    var uuid = String(p.uuid)
    var at = fell[uuid]
    delete fell[uuid]
    if (!at) return

    // ---------------------------------------------------------------------------
    // CROSS-DIMENSION DEATH FALLS BACK TO THE BED.
    //
    // I first wrote this with no dimension check, and a comment claiming the
    // distinction did not exist here. It does, and getting it wrong would be worse
    // than the bug this rewrite was meant to remove:
    //
    //   After respawn the player is at their BED. If they died in the Nether and
    //   the bed is in the Overworld, p.level is the OVERWORLD - so reading the
    //   block at the death coords reads a different dimension entirely, and
    //   teleportTo(x,y,z) would drop them at those coordinates in the WRONG WORLD.
    //   Nether coordinates are Overworld coordinates divided by eight, so that
    //   lands somewhere real, somewhere arbitrary, and somewhere they have never
    //   been.
    //
    // A dimension-aware teleport exists in principle, but the API is unproven in
    // this runtime and E0 exists precisely because unproven APIs here fail
    // SILENTLY. Same-dimension is the overwhelmingly common case and the one this
    // feature was designed for - "dying underground is cheap". The rare
    // cross-dimension death takes the bed, and is told so.
    // ---------------------------------------------------------------------------
    // /unstuck asked for the bed explicitly.
    if (forceBed[uuid]) {
      delete forceBed[uuid]
      console.info('[respawn] ' + p.username + ' woke at their bed via /unstuck')
      grace(p)
      return
    }

    // THE SECOND DEATH. Whatever is there, it has now killed them twice inside two
    // minutes, so it wins and they get the bed. This runs BEFORE the hazard check
    // because it does not care what the hazard was - that is the entire point.
    if (at.repeat) {
      console.info('[respawn] ' + p.username + ' died twice in the same place - ' +
        'taking the bed rather than feeding a loop')
      try {
        p.tell(Text.of('§8Twice in the same place. §7You wake at your bed instead.'))
      } catch (e) { }
      grace(p)
      return
    }

    var nowDim = null
    try { nowDim = String(p.level.dimension) } catch (e) { }
    if (!nowDim || nowDim !== at.dim) {
      console.info('[respawn] ' + p.username + ' died in ' + at.dim + ' but woke in ' +
        nowDim + ' - cross-dimension, taking the bed')
      try {
        p.tell(Text.of('§8You died in another world. You wake at your bed.'))
      } catch (e) { }
      grace(p)
      return
    }

    var haz = null
    try { haz = hazardAt(p.level, at.x, at.y, at.z) } catch (e) { haz = 'unreadable' }

    if (haz) {
      // DECLINE, OUT LOUD. The legibility law applies to a feature choosing not to
      // fire just as much as to one that does: a player who expected to wake where
      // they fell and did not must be told why, or it reads as a bug.
      console.info('[respawn] ' + p.username + ' died in ' + haz +
        ' - waking at their bed instead')
      try {
        p.tell(Text.of('§8You did not wake where you fell. §7' + haz.replace('minecraft:', '') +
          '§8 was there.'))
      } catch (e) { }
      grace(p)
      return
    }

    var moved = false
    try {
      p.teleportTo(at.x, at.y, at.z)
      moved = true
    } catch (e) {
      try { p.setPos(at.x, at.y, at.z); moved = true } catch (e2) {
        console.warn('[respawn] could not move ' + p.username + ' to the death site :: ' + e2)
      }
    }

    var cleared = grace(p)
    if (moved) {
      console.info('[respawn] ' + p.username + ' woke where they fell (' +
        Math.round(at.x) + ',' + Math.round(at.y) + ',' + Math.round(at.z) +
        ') - ' + cleared + ' mob(s) detargeted, ' + (GRACE_TICKS / 20) + 's grace')
      try {
        p.tell(Text.of('§8You wake where you fell.'))
      } catch (e) { }
    }
  })

  // ---------------------------------------------------------------------------
  // /unstuck — the manual escape, for being trapped while still ALIVE.
  //
  // The second-death rule only fires after the place has killed you twice. If you
  // are merely sealed in with no way out and in no danger, nothing kills you and
  // nothing rescues you either. This is that door.
  //
  // It is deliberately NOT a free teleport: it marks the next respawn as bed-bound
  // and then kills you. Escaping costs a death, which is exactly what giving up
  // should cost, and it means the command cannot be used as fast travel or as a
  // combat exit - dying is strictly worse than running.
  //
  // Implemented with proven calls only. A bed-teleport would need the respawn
  // position API, which is unproven in this runtime, and E0 exists because
  // unproven APIs here fail silently.
  // ---------------------------------------------------------------------------
  var forceBed = {}

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    event.register(Commands.literal('unstuck').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      forceBed[String(p.uuid)] = true
      p.tell(Text.of('§7You give up. §8It costs you a death.'))
      console.info('[respawn] ' + p.username + ' used /unstuck')
      try {
        ctx.source.server.runCommandSilent('kill ' + p.username)
      } catch (e) {
        console.warn('[respawn] /unstuck could not kill ' + p.username + ' :: ' + e)
        p.tell(Text.of('§cThat did not work. Tell Ethan.'))
        delete forceBed[String(p.uuid)]
        return 0
      }
      return 1
    }))
  })

  ServerEvents.loaded(function () {
    console.info('[respawn] E2a active - you wake WHERE YOU FELL, not at your bed')
    console.info('[respawn] grace ' + (GRACE_TICKS / 20) + 's Resistance ' + (GRACE_AMP + 1) +
      ', detarget radius ' + DETARGET_RADIUS + ', lava/fire/void falls back to the bed')
  })
})()
