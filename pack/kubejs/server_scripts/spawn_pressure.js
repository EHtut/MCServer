// spawn_pressure.js - E3's `spawns` axis, wired at last.  docs/23 §7a, §7b
//
// THE LAST UNWIRED COEFFICIENT. Blade's headline number is ×4 and until now it did
// nothing at all.
//
// ── TWO REGIMES, BECAUSE A COEFFICIENT MULTIPLIES NATURAL SPAWNS ─────────────
// In Control denies every natural hostile above y=40 in the overworld (the
// two-realm thesis, measured 2026-08-15). A multiplier applied to zero is zero, so
// the axis alone would leave a combat path hunted only underground - the opposite
// of a path whose events include Icarus, the one that punishes going UP.
//
//   coefficient < 1   SUPPRESSION   cancel a share of natural spawns (checkSpawn)
//   coefficient > 1   PRESSURE      actively send waves (spawner.js)
//
// They are not alternatives. They are the same intent split across two regimes:
// the coefficient carries the deep, the spawner carries the surface. `23` §7b.
//
// ── MODULAR ON PURPOSE ───────────────────────────────────────────────────────
// Ethan, 2026-08-15: "keep it modular because blade will make the most use of it."
// So the roster is a per-path table, the cadence is a per-path number, and both are
// exposed on VELDORA.pressure for Blade's twelve events to read, extend or ignore.
// Nothing here assumes it is the only caller.
//
// ── COST ─────────────────────────────────────────────────────────────────────
// checkSpawn fires CONSTANTLY - 828+ observed in E0 P9 over a short sample. So it
// must be cheap: the handler reads a cache refreshed on a slow tick and takes a
// squared-distance comparison, and it early-outs entirely when nobody online has a
// coefficient that differs from 1.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[pressure] '
  var GATE = true

  var CACHE_TICKS = 40            // refresh player coefficients every 2s
  var PRESSURE_TICKS = 600        // consider sending a wave every 30s
  var NEAR = 64                   // a spawn this close to a walker is "theirs"
  var NEAR_SQ = NEAR * NEAR

  // Per-path ambient rosters. Blade's events may use these or supply their own.
  // Every id is boot-validated by spawner.js before anything is sent.
  // ⚠️ ONLY THE RETIRED `AMBIENT` TRICKLE READS THIS. Density needs no roster - it
  // duplicates whatever the world chose - so these lists are kept solely so that
  // flipping AMBIENT back on still works. wall/forge/art being empty was the reason
  // the above-1 half did nothing for three of five paths, and density removes that
  // failure mode rather than asking anyone to fill them in.
  var ROSTER = {
    blade: ['born_in_chaos_v1:decaying_zombie', 'born_in_chaos_v1:decrepit_skeleton'],
    salvage: ['born_in_chaos_v1:dread_hound'],
    forge: [],
    wall: [],
    art: [],
    crown: [],
  }

  // ⚠️ AMBIENT PRESSURE IS OFF. Measured in play 2026-08-15 and Ethan's verdict was
  // one word: "noise". Two mobs every thirty seconds is not a world that hunts you,
  // it is a tap left running - and a constant trickle makes the DELIBERATE waves
  // (a reckoning, a Gauntlet, the Mark) indistinguishable from background.
  //
  // "it shouldn't be a 2 mob spawner unless this is testing. it should be event
  // related."
  //
  // So the above-1 half of the axis now sends NOTHING on its own. The spawner and
  // VELDORA.pressure.send() remain, and EVENTS call them - which is the whole point
  // of having built it modular. Set AMBIENT true to restore the trickle.
  var AMBIENT = false

  // ⭐ DENSITY is the replacement for AMBIENT, and it is ON. AMBIENT was a trickle
  // from a fixed roster ("noise"); DENSITY multiplies what the world was already
  // going to spawn. They are different mechanisms and only this one is live.
  var DENSITY = true
  var WAVE_PER_EXCESS = 1.0
  var WAVE_CAP = 6

  var cache = {}                  // uuid -> {x,y,z,coeff,path}
  var anyNonNeutral = false       // the fast path: nobody on a path, do nothing

  function refresh(server) {
    var next = {}
    var any = false
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        var c = 1.0
        try {
          if (VELDORA.coeff && typeof VELDORA.coeff.of === 'function') {
            var v = VELDORA.coeff.of(server, p, 'spawns')
            if (typeof v === 'number' && isFinite(v)) c = v
          }
        } catch (e) { }
        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { }
        var uuid = null
        try { uuid = String(p.uuid) } catch (e) { continue }
        next[uuid] = { x: p.x, y: p.y, z: p.z, coeff: c, path: path, player: p }
        if (c !== 1.0) any = true
      }
    } catch (e) { console.warn(TAG + 'refresh threw :: ' + e) }
    cache = next
    anyNonNeutral = any
  }

  // Nearest cached walker to a point, or null.
  function nearestWalker(x, y, z) {
    var best = null, bestSq = NEAR_SQ
    for (var k in cache) {
      if (!cache.hasOwnProperty(k)) continue
      var c = cache[k]
      if (c.coeff === 1.0) continue
      var dx = c.x - x, dy = c.y - y, dz = c.z - z
      var sq = dx * dx + dy * dy + dz * dz
      if (sq <= bestSq) { bestSq = sq; best = c }
    }
    return best
  }

  // ── SUPPRESSION: the below-1 half ─────────────────────────────────────────
  //
  // ⚠️ checkSpawn's event shape has NEVER been used in this codebase - E0 P9 only
  // proved it fires and can be cancelled. So the position is read defensively and
  // the shape is LOGGED ONCE, because J6's lesson is that an unverified accessor
  // silently returning undefined is indistinguishable from a quiet subsystem.
  var SHAPE_LOGGED = false
  function posOfSpawn(event) {
    var x = null, y = null, z = null
    try { if (typeof event.x === 'number') { x = event.x; y = event.y; z = event.z } } catch (e) { }
    if (x === null) {
      try {
        var e2 = event.entity
        if (e2) { x = e2.x; y = e2.y; z = e2.z }
      } catch (e) { }
    }
    if (!SHAPE_LOGGED) {
      SHAPE_LOGGED = true
      var have = []
      try { if (typeof event.x === 'number') have.push('event.x') } catch (e) { }
      try { if (event.entity) have.push('event.entity') } catch (e) { }
      try { if (event.level) have.push('event.level') } catch (e) { }
      console.info(TAG + 'checkSpawn shape: ' + (have.join(', ') || 'NOTHING READABLE') +
        ' -> position ' + (x === null ? 'UNREADABLE - suppression is INERT' : 'ok'))
    }
    return (x === null || typeof x !== 'number') ? null : { x: x, y: y, z: z }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ ONE HOOK, BOTH DIRECTIONS - Ethan, 2026-08-16:
  //     "Mob spawns should be just general spawn rate increasers no?"
  //
  // Yes, and it is a better design than the one it replaces. The old above-1 half
  // injected a TRICKLE FROM A FIXED ROSTER - two named zombies every thirty
  // seconds - which he had already seen in play and called "noise". It is noise for
  // a structural reason: a fixed roster ignores where you are standing, so the same
  // two mobs arrive in a birch forest and at y-110, and nothing about them says
  // anything about the place.
  //
  // A DENSITY MULTIPLIER has none of that problem. `checkSpawn` fires when the world
  // has ALREADY decided to spawn something appropriate to this biome, this light
  // level and this depth. So:
  //
  //     coeff < 1    cancel a share of what the world was going to do
  //     coeff > 1    DUPLICATE a share of what the world was going to do
  //
  // Same hook, same event, symmetrical. Nothing is ever injected - the world is
  // simply denser or thinner around a walker, and what arrives is always whatever
  // belonged there anyway. That reads as "this place is worse" rather than "two
  // zombies appeared", and it deletes the per-path ROSTER problem entirely: wall,
  // forge and art had empty lists and therefore no above-1 behaviour at all.
  //
  // 🚨 MONSTERS ONLY. checkSpawn fires for cows and bats too, and doubling the
  // passive population is not a difficulty setting, it is a farm.
  //
  // ⚠️ Duplicating is a WRITE inside a spawn event, so it is rate-limited hard
  // (DUP_COOLDOWN) and capped per player. An unbounded multiplier on an event that
  // fired 828+ times in one short sample is a server-killer, not a mechanic.
  var DUP_COOLDOWN = 40                     // ticks between duplicates, per player
  var lastDup = {}                          // uuid -> world ticks

  function isMonster(event) {
    // Two readers, because neither has been proven on this event shape and a wrong
    // answer here doubles the wrong things. Unreadable = NOT a monster = do nothing.
    try {
      var e = event.entity
      if (!e) return false
      var id = null
      try { id = String(e.type).toLowerCase() } catch (x) { }
      if (!id) { try { id = String(e.getType()).toLowerCase() } catch (x) { } }
      if (!id) return false
      // A hostile check by capability is more honest than a name list.
      try { if (typeof e.monster === 'boolean') return e.monster } catch (x) { }
      // Fall back to the ids this pack actually spawns as threats.
      var marks = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman', 'witch',
        'drowned', 'husk', 'stray', 'phantom', 'slime', 'hound', 'chaos', 'ghoul',
        'wraith', 'knight', 'nightmare', 'stalker', 'pumpkin', 'bonescaller']
      for (var i = 0; i < marks.length; i++) if (id.indexOf(marks[i]) >= 0) return true
      return false
    } catch (e2) { return false }
  }

  if (GATE) {
    EntityEvents.checkSpawn(function (event) {
      if (!anyNonNeutral) return              // the common case, costs nothing
      var pos = posOfSpawn(event)
      if (!pos) return
      var w = nearestWalker(pos.x, pos.y, pos.z)
      if (!w) return

      // ── below 1: SUPPRESSION ────────────────────────────────────────────
      // coeff 0.5 cancels half. A floor keeps a path from emptying the world
      // entirely - "quieter" is a coefficient, "sterile" is a bug report.
      if (w.coeff < 1.0) {
        if (Math.random() < (1.0 - w.coeff)) {
          try { event.cancel() } catch (e) { }
        }
        return
      }

      // ── above 1: DENSITY ────────────────────────────────────────────────
      if (w.coeff <= 1.0 || !DENSITY) return
      if (Math.random() >= (w.coeff - 1.0)) return
      if (!isMonster(event)) return

      var p = w.player
      var uuid = null
      try { uuid = String(p.uuid) } catch (e) { return }
      var server = null
      try { server = p.server } catch (e) { return }
      if (!server) return

      var now = null
      try { now = server.overworld().dayTime() } catch (e) { }
      if (now === null) return
      if (lastDup[uuid] && (now - lastDup[uuid]) < DUP_COOLDOWN &&
          (now - lastDup[uuid]) >= 0) return
      lastDup[uuid] = now

      // Never during a scene - being ambushed mid-ritual is not the design.
      try { if (VELDORA.ritual && VELDORA.ritual.active(p)) return } catch (e) { }

      var id = null
      try { id = String(event.entity.type) } catch (e) { return }
      if (!id || id.indexOf(':') < 0) {
        // String(entity.type) is NOT the bare id - it is an EntityType whose
        // toString is a description key. This project has shipped that bug twice.
        // If it does not look like an id, do nothing and say so once.
        if (!DUP_SHAPE_LOGGED) {
          DUP_SHAPE_LOGGED = true
          console.warn(TAG + 'density: entity id unreadable ("' + id +
            '") - the above-1 half is INERT until this is fixed')
        }
        return
      }

      // /summon, never createEntity().spawn() - the latter skips finalizeSpawn,
      // which is where Born in Chaos sets hostility.
      var dim = 'minecraft:overworld'
      try { dim = String(p.level.dimension) } catch (e) { }
      if (dim.indexOf(':') < 0) dim = 'minecraft:overworld'
      try {
        server.runCommandSilent('execute in ' + dim + ' run summon ' + id + ' ' +
          (Math.round(pos.x * 100) / 100) + ' ' + (Math.round(pos.y * 100) / 100) +
          ' ' + (Math.round(pos.z * 100) / 100))
        dupCount++
      } catch (e) { }
    })
  }

  var DUP_SHAPE_LOGGED = false
  var dupCount = 0

  // ── PRESSURE: the above-1 half ────────────────────────────────────────────
  function pressureTick(server) {
    try {
      if (!GATE || !AMBIENT || !anyNonNeutral) { schedule(server); return }
      for (var k in cache) {
        if (!cache.hasOwnProperty(k)) continue
        var c = cache[k]
        if (c.coeff <= 1.0) continue
        var roster = ROSTER[c.path]
        if (!roster || !roster.length) continue

        // Never during a scene - being ambushed mid-ritual is not the design.
        try { if (VELDORA.ritual && VELDORA.ritual.active(c.player)) continue } catch (e) { }

        var excess = c.coeff - 1.0
        var n = Math.min(WAVE_CAP, Math.round(excess * WAVE_PER_EXCESS))
        if (n <= 0) continue

        if (!VELDORA.spawner) {
          console.warn(TAG + 'spawner missing - the above-1 half of the axis is INERT')
          break
        }
        // ⚠️ `placed` is null at return and measured a second later - see issued()
        // in spawner.js. Read synchronously, this warning could never print.
        VELDORA.spawner.wave(c.player, { ids: roster, count: n },
          function (placed, asked) {
            if (placed === 0 && asked > 0) {
              console.warn(TAG + 'ambient wave for ' + c.path + ' placed nothing')
            }
          })
      }
    } catch (e) { console.warn(TAG + 'pressureTick threw :: ' + e) }
    schedule(server)
  }

  function schedule(server) {
    server.scheduleInTicks(PRESSURE_TICKS, function () { pressureTick(server) })
  }

  // ── the seam, for Blade and anything else ─────────────────────────────────
  VELDORA.pressure = {
    roster: ROSTER,                              // mutable on purpose
    coeffOf: function (uuid) { return cache[uuid] ? cache[uuid].coeff : 1.0 },
    // Blade's events call this with their OWN roster and count; it is a thin,
    // honest pass-through to the spawner rather than a second mechanism.
    send: function (player, ids, count) {
      if (!VELDORA.spawner) return { asked: 0, placed: null, valid: [] }
      return VELDORA.spawner.wave(player, { ids: ids, count: count })
    },
  }

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'spawns axis GATED OFF'); return }
    refresh(event.server)
    event.server.scheduleInTicks(CACHE_TICKS, function tick() {
      refresh(event.server)
      event.server.scheduleInTicks(CACHE_TICKS, tick)
    })
    schedule(event.server)
    console.info(TAG + 'spawns axis LIVE - suppression via checkSpawn (<1) is ON. ' +
      'Ambient pressure (>1) is OFF by design: waves are EVENT-driven now, through ' +
      'VELDORA.pressure.send(). Set AMBIENT=true to restore the trickle.')
    console.info(TAG + 'DENSITY ' + (DENSITY ? 'ON' : 'off') + ' - checkSpawn ' +
      'multiplies what the world already chose: below 1 cancels a share, above 1 ' +
      'duplicates a share. Monsters only, ' + DUP_COOLDOWN + 't between duplicates.')
    console.info(TAG + 'rosters: ' + Object.keys(ROSTER).filter(function (k) {
      return ROSTER[k].length
    }).join(', ') + ' - the rest are empty and send nothing')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('pressure').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var uuid = String(p.uuid)
      var c = cache[uuid]
      p.tell(Text.of('§8§m                                        '))
      if (!c) { p.tell(Text.of('§cnot in the cache yet - wait 2s')); return 1 }
      p.tell(Text.of('§6spawns ×' + (Math.round(c.coeff * 100) / 100) +
        ' §8(path ' + (c.path || 'none') + ')'))
      if (c.coeff < 1) p.tell(Text.of('§7SUPPRESSING §8' +
        Math.round((1 - c.coeff) * 100) + '% of natural spawns within ' + NEAR + ' blocks'))
      else if (c.coeff > 1) {
        var roster = ROSTER[c.path] || []
        p.tell(Text.of('§7PRESSURE §8' + Math.min(WAVE_CAP, Math.round((c.coeff - 1) * WAVE_PER_EXCESS)) +
          ' every ' + PRESSURE_TICKS + 't §8roster: ' + (roster.length ? roster.join(', ') : '§cEMPTY - sends nothing')))
      } else p.tell(Text.of('§7neutral - the axis does nothing for you'))
      return 1
    }))
  })
})();
