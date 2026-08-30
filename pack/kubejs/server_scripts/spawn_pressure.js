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
  // 🔴 ETHAN'S ROSTERS, 2026-08-29. Every id probed against the live registry with
  // a known-fake control in both directions.
  //
  // ⭐ THE POINT OF THE LIST IS THAT IT IS NOT THE TIDE'S. The tide is the goddess of
  // death's and she is skeletons; these are what each god sends on their OWN behalf, so
  // a player can tell who is attacking them without being told.
  //
  // 🚨 blade LOST `decrepit_skeleton` - that is HER bulk now, and leaving it here
  // would have made his attacks indistinguishable from her tide, which is the exact
  // confusion this pass exists to remove.
  //
  // ⚠️ forge HAS ONE, and it is a Krampus Henchman. She is the god whose forced
  // column is generous and who sends nothing at her own champion - so this roster is
  // for the rare varied tide and for anything future, not for hunting her people.
  var ROSTER = {
    blade: ['born_in_chaos_v1:barrel_zombie', 'born_in_chaos_v1:door_knight',
      'born_in_chaos_v1:zombie_bruiser', 'born_in_chaos_v1:skeleton_thrasher'],
    wall: ['born_in_chaos_v1:baby_spider', 'born_in_chaos_v1:mother_spider'],
    // ⭐⭐ SALVAGE'S DIRE WOLVES — the faction run, 2026-08-30. `docs/68` R2 gives her
    // dire wolves and she had ONE mob. There is no `#minecraft:wolf` tag to census, so
    // this was enumerated from every jar's lang file by name (13 candidates), then
    // shortlisted, registry-probed with a known-fake control, measured live, and
    // persistence-checked. All six below survive being summoned.
    //
    //   hostile_black_wolf  10 hp / 0 arm / 4 dmg      winter_wolf   10 / 0 / 4
    //   hellhound           10 hp / 0 arm / 4 dmg      hunter_wolf    8 / 0 / 4
    //   stormhound          10 hp / 0 arm / 4 dmg      dread_hound   17 / 0.5 / 5
    //
    // ⚠️ ALL SIX ARE FODDER on his rule, and that is the finding rather than an
    // oversight: the wolves in this pack are 8-17 hp with no armour. Salvage has NO
    // specialist tier and no tank. Her pressure is numbers and speed, which suits a
    // pack — but if she should hit harder, the mobs for it do not currently exist.
    //
    // ⛔ `goety:black_wolf` EXCLUDED — extends `Summoned`, i.e. a servant entity;
    //    `hostile_black_wolf` is the same statline without that. Same-looking mob,
    //    different class, and only one of them is a hostile.
    // ⛔ `goety:skeleton_wolf` EXCLUDED — it is HERS, in BONE_FODDER. A mob cannot be
    //    two factions or the faction says nothing.
    // ⛔ `minecraft:wolf` EXCLUDED — tameable and neutral.
    // ⛔ `ars_nouveau:summon_wolf`, `archers:spirit_wolf` EXCLUDED — summons.
    //
    // ⭐⭐ THE PACK LEADER CALLS ITS PACK, AND THAT IS NOW THE POINT.
    // `born_in_chaos_v1:dire_hound_leader` — 100 hp / 10 dmg / 0.7 knockback-resist —
    // spawns Dread Hounds (its class references `DreadHound` + `EntityType` + `spawn` +
    // `finalizeSpawn`). It was held back pending a ruling and Ethan gave one on
    // 2026-08-30: *"Yes that. No summoner rule no longer applies that is redundant."*
    //
    // 🔑 So a dire wolf pack arrives WITH a leader that grows it, which is what a pack
    // is. Salvage's whole pressure is numbers and speed (D-119) and this is the shape
    // of that rather than an exception to it.
    salvage: ['born_in_chaos_v1:dread_hound', 'goety:hostile_black_wolf',
      'goety:hellhound', 'goety:stormhound', 'goety:winter_wolf',
      'rottencreatures:hunter_wolf', 'born_in_chaos_v1:dire_hound_leader'],
    forge: ['born_in_chaos_v1:krampus_henchman'],
    // 🔴 TWO OF ART'S THREE DO NOT SPAWN, so this list has been two-thirds inert for
    // his OWN attacks, not only for the tide. `restless_spirit` and `dark_vortex`
    // measured 0/3 each against a control that passed 3/3 - they answer `summon` and
    // are gone before the next command (tools/spawn_persist_check.py, D-117).
    // ⚠️ Removed rather than kept "in case": an id that spawns nothing makes an attack
    // quietly smaller and every other check in this repo passes it.
    art: ['born_in_chaos_v1:scarlet_persecutor'],
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
  // ════════════════════════════════════════════════════════════════════════
  // 🔴🔴 THE SPAWN TYPE, AND THE BUG IT FIXES (2026-08-29).
  //
  // Ethan: *"spawned the devil from the devil mod and it spawned 4 of them."*
  //
  // 🚨 THIS FILE'S OWN HEADER SAYS "A COEFFICIENT MULTIPLIES NATURAL SPAWNS" AND
  // NOTHING EVER CHECKED THAT. checkSpawn fires for every spawn there is, so the
  // density branch below was multiplying:
  //
  //     SPAWN_EGG    an egg placed by hand
  //     COMMAND      /summon - including spawner.js, which is how the TIDE spawns
  //     SPAWNER      mob spawner blocks
  //     STRUCTURE    structure-placed mobs
  //
  // At blade's 3.0 that is +2 guaranteed, and deep it hits MAX_DUP_PER_EVENT. One
  // devil became four. ⚠️ The tide was bounded by DUP_COOLDOWN to +4 per wave rather
  // than 4x, which is why this was survivable rather than obvious.
  //
  // ⭐ THE ACCESSOR WAS READ OUT OF THE JAR, NOT GUESSED. From
  // dev/latvian/mods/kubejs/entity/CheckLivingEntitySpawnKubeEvent:
  //
  //     public final transient MobSpawnType type;
  //     public MobSpawnType getType();
  //
  // ⚠️ AND IT FAILS CLOSED. An unreadable type does NOT fall through to the old
  // behaviour - falling back to "apply to everything" is the exact bug being fixed.
  // It returns and it SHOUTS, because "blade got quieter" and "the accessor broke"
  // must never look the same.
  var TYPES_SEEN = {}
  var TYPE_WARNED = false

  function spawnTypeOf(event) {
    var t = null
    try { t = event.type } catch (e) { }
    if (t === null || t === undefined) { try { t = event.getType() } catch (e) { } }
    if (t === null || t === undefined) return null
    try {
      var s2 = String(t)
      return s2 ? s2.toUpperCase() : null
    } catch (e) { return null }
  }

  // ⚠️ SUBSTRING, not equality. A Java enum stringifies to its name here, but a
  // wrapper or a remap could hand back "MobSpawnType.NATURAL" instead of "NATURAL" -
  // and an equality test would then silently disable density everywhere, which is a
  // difficulty regression nobody would trace. CHUNK_GENERATION does not contain the
  // word, so it is excluded on purpose until the log says it should not be.
  function isNaturalSpawn(kind) {
    return !!kind && kind.indexOf('NATURAL') !== -1
  }

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
  var DUP_COOLDOWN = 40                     // ticks between duplicate EVENTS, per player
  // Hard cap on how many extra mobs one spawn event may become. Blade underground
  // asks for more than this; the guard is deliberate and the log says when it bites.
  var MAX_DUP_PER_EVENT = 4
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

      // 🚨 NATURAL ONLY. See the block above spawnTypeOf. This gate covers BOTH
      // regimes - the density branch below and the (currently unreachable) suppression
      // branch - because if suppression is ever revived it has exactly the same bug.
      var kind = spawnTypeOf(event)
      if (kind === null) {
        if (!TYPE_WARNED) {
          TYPE_WARNED = true
          console.warn(TAG + '!! CANNOT READ THE SPAWN TYPE. Density is now DISABLED ' +
            'rather than applied to every spawn - failing the other way is the bug ' +
            'this check exists to fix. This is a FAILURE, not a quiet coefficient.')
        }
        return
      }
      // Log each distinct type once. ⭐ The point is to find out what actually reaches
      // this hook on a 300-mod server instead of deciding it from memory - if
      // CHUNK_GENERATION turns up often, that is a conversation, not a guess.
      if (!TYPES_SEEN[kind]) {
        TYPES_SEEN[kind] = true
        console.info(TAG + 'spawn type seen for the first time: ' + kind + ' - ' +
          (isNaturalSpawn(kind) ? 'COUNTS toward the coefficient'
            : 'IGNORED, not a natural spawn'))
      }
      if (!isNaturalSpawn(kind)) return

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
          // Counted for the same reason as the duplicates: "she is quieter" and
          // "the hook never ran" looked identical before this.
          try { suppressBy[w.player.username] = (suppressBy[w.player.username] || 0) + 1 } catch (e) { }
        }
        return
      }

      // ── above 1: DENSITY ────────────────────────────────────────────────
      //
      // 🚨 THIS USED TO SILENTLY CAP AT 2.0. The old line was
      //     if (Math.random() >= (w.coeff - 1.0)) return
      // which at coeff >= 2.0 compares against >= 1.0 and is NEVER true - so it
      // always proceeded and always added exactly ONE mob. Every coefficient from
      // 2.0 upward behaved identically, and Ethan's new table has blade at 3.0,
      // salvage at 2.5, and depth scaling that pushes blade past 5 underground.
      // All of that would have been thrown away by a comparison.
      //
      // The excess is now read properly: the WHOLE part is guaranteed extra mobs
      // and the FRACTION is the chance of one more.
      //
      //     coeff 1.4 -> 0 guaranteed, 40% of one     (0.4 mobs on average)
      //     coeff 3.0 -> 2 guaranteed                 (2.0)
      //     coeff 5.5 -> 4 guaranteed, 50% of a fifth (4.5)
      if (w.coeff <= 1.0 || !DENSITY) return
      if (!isMonster(event)) return

      var excess = w.coeff - 1.0
      var extra = Math.floor(excess)
      if (Math.random() < (excess - extra)) extra++
      if (extra <= 0) return
      // ⚠️ TPS GUARD. checkSpawn fires 828+ times in a short sample (E0 P9), so an
      // uncapped multiplier on a hot event is a server-killer rather than a
      // difficulty setting. Deep blade can ask for five; it gets four.
      if (extra > MAX_DUP_PER_EVENT) extra = MAX_DUP_PER_EVENT

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
      // n copies, not one. `extra` is the whole+fractional excess computed above.
      for (var d = 0; d < extra; d++) {
        try {
          server.runCommandSilent('execute in ' + dim + ' run summon ' + id + ' ' +
            (Math.round(pos.x * 100) / 100) + ' ' + (Math.round(pos.y * 100) / 100) +
            ' ' + (Math.round(pos.z * 100) / 100))
          dupCount++
          try { dupBy[p.username] = (dupBy[p.username] || 0) + 1 } catch (e2) { }
        } catch (e) { }
      }
    })
  }

  var DUP_SHAPE_LOGGED = false
  var dupCount = 0

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 dupCount WAS WRITTEN AND NEVER READ.  Found 2026-08-16, while Ethan asked
  // why no mobs were spawning around Lehykt - and I could not answer, because this
  // subsystem had NO TELEMETRY AT ALL. The counter was incremented on every
  // duplicate and printed nowhere, so "the log shows no density activity" meant
  // exactly nothing: there was nothing for it to show.
  //
  // That is the same defect this project keeps paying for in other clothes - a
  // thing that runs in shadow with no consumer. `paths.js` already got this right
  // (it reports paidOut every 5 minutes, and that report is what proved the drop
  // economy was alive tonight). This is the same idea for the spawn axis.
  //
  // Counted PER PLAYER, because "density is working" and "density is working FOR
  // THE PERSON ASKING" are different questions and the second is the one that gets
  // asked.
  // ═══════════════════════════════════════════════════════════════════════════
  var DUP_REPORT_TICKS = 6000              // 5 min, matching paths.js
  var dupBy = {}                           // name -> count since boot
  var suppressBy = {}                      // name -> cancelled since boot

  function dupReport(server) {
    try {
      var parts = []
      for (var n in dupBy) if (dupBy.hasOwnProperty(n)) parts.push(n + '+' + dupBy[n])
      for (var s in suppressBy) if (suppressBy.hasOwnProperty(s)) parts.push(s + '-' + suppressBy[s])
      if (parts.length) {
        console.info(TAG + 'density since boot: ' + parts.join(' , ') +
          '   (+n = extra mobs added near that walker, -n = spawns cancelled)')
      } else if (anyNonNeutral) {
        // The honest negative. Somebody IS on a non-neutral path and the world has
        // not offered this hook a single eligible spawn near them - which usually
        // means their area is lit, not that the multiplier is broken. Density can
        // only multiply what the world already chose; 1.6 x nothing is nothing.
        console.info(TAG + 'density since boot: NOTHING - no eligible spawn has ' +
          'occurred near a walker. Density multiplies what the world already chose, ' +
          'so a lit area produces nothing to multiply.')
      }
    } catch (e) { }
    server.scheduleInTicks(DUP_REPORT_TICKS, function () { dupReport(server) })
  }

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
    // Exposed for tools/pressure_harness.js. The spawn-type gate is the difference
    // between multiplying what the WORLD chose and multiplying what a PLAYER chose,
    // and that distinction is invisible in play until somebody summons one mob and
    // gets four.
    _spawnTypeOf: spawnTypeOf,
    _isNatural: isNaturalSpawn,
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
    dupReport(event.server)
    console.info(TAG + 'spawns axis LIVE - suppression via checkSpawn (<1) is ON. ' +
      'Ambient pressure (>1) is OFF by design: waves are EVENT-driven now, through ' +
      'VELDORA.pressure.send(). Set AMBIENT=true to restore the trickle.')
    // ⚠️ "what the world already chose" was the claim, and until 2026-08-29 it was
    // not true - the hook never checked the spawn type, so it also multiplied spawn
    // eggs, /summon, spawner blocks and structures. The banner now says the thing the
    // code actually does.
    console.info(TAG + 'DENSITY ' + (DENSITY ? 'ON' : 'off') + ' - checkSpawn ' +
      'multiplies NATURAL spawns ONLY: below 1 cancels a share, above 1 duplicates ' +
      'a share. Spawn eggs, /summon, spawner blocks and structures are NOT touched ' +
      '(fixed 2026-08-29 - one summoned mob was becoming four). Monsters only, ' +
      DUP_COOLDOWN + 't between duplicates.')
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
