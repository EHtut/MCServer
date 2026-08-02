// Telemetry producer - the events only KubeJS can see.
//
// Contract: docs/14-TELEMETRY-SEAM.md. Ethan owns the memory architecture; this
// owns production. The two meet at a JSONL file that logq.py writes.
//
// WHY THIS EMITS TO THE LOG INSTEAD OF WRITING A FILE
//
// KubeJS is sandboxed - "You can't access files outside Minecraft directory" -
// and the sink lives outside the instance on purpose, so a world regen cannot
// wipe the DM's memory. Python is not sandboxed, so KubeJS prints and logq.py
// writes. That also means append is free and a crash cannot corrupt earlier
// events, which a read-modify-write JSON file could.
//
// WHY IT EXISTS BEFORE ANYTHING READS IT
//
// nemesis_tally.js already made the argument: "a nemesis picked from an empty
// dataset is not a nemesis. Its whole value is in being early." Every session
// played untracked is context that cannot be reconstructed.
//
// ---------------------------------------------------------------------------
// THE FAILURE MODES THIS FILE IS WRITTEN AGAINST - all paid for in this repo
//
//   * PlayerEvents has NO `death`. Use EntityEvents.death and filter.
//   * KubeJS does not throw on an unknown event name - it logs once and
//     registers a no-op, so a typo yields a file that loads clean and does
//     nothing.
//   * entity.type is an EntityType OBJECT, not a string. Use
//     String(e.getType().id).
//   * Rhino will not return a bare Java method reference, so
//     `obj.m ? obj.m() : fallback` takes the fallback EVEN WHERE m EXISTS.
//     Call inside try/catch instead of probing.
//   * "could not read" and "nothing to record" must NEVER be the same value.
//   * SERVER SCRIPTS SHARE ONE GLOBAL SCOPE. A top-level `const` in one file
//     collides with the same name in another - this file failed to load on its
//     first deploy with "redeclaration of const UNREADABLE", because
//     nemesis_tally.js already declares one. Everything below therefore lives
//     inside an IIFE, which is immune to it by construction rather than by
//     everyone remembering to pick unique names.
// ---------------------------------------------------------------------------

(function () {
  const V = 1

  // Rate-limit flags live in this file's own scope, NOT on `global`.
  //
  // KubeJS refuses it outright: "'global' cannot be assigned to in client or
  // server scripts". So the guard written to STOP a per-event error flooding
  // the log was itself throwing on every single event - the exact failure it
  // existed to prevent, wearing its own disguise.
  var warnedPair = false
  var warnedPlace = false
  const MARK = '[CC-TELEMETRY]'

  // Bumped by hand whenever the world is regenerated, so events stay attributable
  // to the world they happened in and a regen reads as a story beat rather than
  // amnesia. If this is ever forgotten the events are still ordered by ts.
  const WORLD_ID = 'w2026-08-02'

  function emit(type, player, data) {
    try {
      console.info(MARK + ' ' + JSON.stringify({
        v: V,
        type: type,
        player: player || null,
        world: WORLD_ID,
        data: data || {},
      }))
    } catch (e) {
      // Never let telemetry break gameplay. But never swallow it silently either.
      console.error('[telemetry] emit failed for ' + type + ': ' + e)
    }
  }

  // Distinct from null. null = "there was genuinely no entity"; this = "the API
  // moved and we could not read it", which is the distinction that made every
  // previous silent failure in this repo invisible.
  const UNREADABLE = '?unreadable'

  function idOf(entity) {
    if (!entity) return null
    try {
      return String(entity.getType().id)
    } catch (e) {
      return UNREADABLE
    }
  }

  function posOf(entity) {
    try {
      return { x: Math.round(entity.x), y: Math.round(entity.y), z: Math.round(entity.z) }
    } catch (e) {
      return {}
    }
  }

  function dimOf(entity) {
    try {
      return String(entity.level.dimension)
    } catch (e) {
      try { return String(entity.level().dimension) } catch (e2) { return UNREADABLE }
    }
  }

  function biomeOf(entity) {
    try {
      return String(entity.level.getBiome(entity.blockPosition()))
    } catch (e) {
      return UNREADABLE
    }
  }

  // ===========================================================================
  // deaths and kills
  // ===========================================================================

  EntityEvents.death(event => {
    const victim = event.entity
    if (!victim) return
    const source = event.source
    const killer = source ? source.player : null

    if (victim.player) {
      const p = posOf(victim)
      emit('player.death', victim.username, {
        killer: idOf(source ? source.actual : null),
        cause: source ? String(source.type) : null,
        dim: dimOf(victim),
        biome: biomeOf(victim),
        x: p.x, y: p.y, z: p.z,
      })
      return
    }

    // A player killed something. Weapon is what the DM actually wants here - it
    // is the difference between "fights everything" and "has a favourite sword".
    if (killer) {
      let weapon = null
      try { weapon = String(killer.mainHandItem.id) } catch (e) { weapon = UNREADABLE }
      emit('player.kill', killer.username, {
        victim: idOf(victim),
        weapon: weapon,
        dim: dimOf(victim),
        y: posOf(victim).y,
      })
    }
  })

  // ===========================================================================
  // sessions
  // ===========================================================================

  PlayerEvents.loggedIn(event => {
    const p = posOf(event.player)
    emit('player.join', event.player.username, {
      dim: dimOf(event.player), x: p.x, y: p.y, z: p.z,
    })
  })

  PlayerEvents.loggedOut(event => {
    const p = posOf(event.player)
    emit('player.leave', event.player.username, {
      dim: dimOf(event.player), x: p.x, y: p.y, z: p.z,
    })
  })

  // ===========================================================================
  // depth, biome dwell, and build clusters
  //
  // All three are sampled on one slow timer rather than per-event. Depth and
  // biome cannot be event-driven at all, and block placement MUST NOT be one
  // event per block - that is thousands of lines an hour and buries everything
  // else. Placements accumulate per chunk and flush here.
  // ===========================================================================

  const SAMPLE_TICKS = 200          // 10s - cheap, and fine for depth/biome
  const BUILD_FLUSH_TICKS = 6000    // 5min - the volume decision, see the doc

  // Ethan, 2026-08-02: "most communication is done through vc and chat is
  // unreliable". Chat is therefore NOT recorded - it is a biased sample, since
  // the things people bother to TYPE are the atypical ones, and a DM modelling
  // this group from chat would over-weight its least representative channel.
  //
  // The consequence: the DM is permanently deaf to most of what is actually
  // said. So the behaviour that coordination LEAVES BEHIND has to carry the
  // weight instead. A plan agreed in voice still shows up as two players moving
  // to the same place and staying there, and that is capturable.
  //
  // 24 blocks is roughly "in sight and working on the same thing" - close
  // enough to exclude two people who merely share a biome.
  const TOGETHER_RANGE = 24
  const TOGETHER_FLUSH_TICKS = 6000

  const state = {}                  // username -> tracking state
  const builds = {}                 // username -> { "dim|cx,cz": {n, blocks:{}} }
  const together = {}               // "a|b" -> samples spent within range

  function stateOf(name) {
    if (!state[name]) {
      state[name] = { deepest: null, biome: null, biomeSince: 0 }
    }
    return state[name]
  }

  ServerEvents.tick(event => {
    const server = event.server
    const tick = server.tickCount

    if (tick % SAMPLE_TICKS === 0) {
      server.players.forEach(player => {
        const name = player.username
        const s = stateOf(name)
        const y = Math.round(player.y)

        // Depth: only when a NEW low is reached. A player sitting in a mine
        // should not produce a line every ten seconds.
        if (s.deepest === null || y < s.deepest) {
          s.deepest = y
          emit('player.depth', name, { y: y, deepest_session: s.deepest, dim: dimOf(player) })
        }

        // Biome: on CHANGE only, carrying how long the previous one was occupied.
        // Dwell is the whole point - it is what separates "walked through" from
        // "lived there" from "fled", which is how the DM learns what is AVOIDED.
        const b = biomeOf(player)
        if (b !== s.biome) {
          if (s.biome !== null) {
            emit('player.biome', name, {
              from: s.biome, to: b,
              dwell_seconds: Math.round((tick - s.biomeSince) / 20),
            })
          }
          s.biome = b
          s.biomeSince = tick
        }
      })

      // Co-location. The behavioural residue of everything agreed in voice
      // chat, which is the channel the DM cannot hear. Counted in samples here
      // and converted to seconds at flush, so the arithmetic stays integer.
      // `var`, NOT `const`, and this is a Rhino rule rather than a style choice.
      //
      // A `const` declared inside a NESTED BLOCK of a repeatedly-invoked
      // callback is re-declared on every invocation and throws:
      //     TypeError: redeclaration of var online
      // Renaming it changed nothing - the second attempt threw
      // "redeclaration of var tmOnline" - which is what proved it is the
      // DECLARATION KIND, not the identifier.
      //
      // The consts at the top of this callback (`server`, `tick`) are fine, as
      // are consts inside a forEach callback, because those get a fresh function
      // scope each call. Only consts inside a bare `{ }` block here are hoisted
      // into a scope that persists between ticks. `var` is function-scoped and
      // simply reassigns.
      //
      // It threw 330 times before anyone looked, so session.together has never
      // once fired. The error was in the log the entire time.
      var tmOnline = server.players
      for (var i = 0; i < tmOnline.length; i++) {
        for (var j = i + 1; j < tmOnline.length; j++) {
          var a = tmOnline[i], bb = tmOnline[j]
          try {
            if (String(a.level.dimension) !== String(bb.level.dimension)) continue
            var dx = a.x - bb.x, dy = a.y - bb.y, dz = a.z - bb.z
            if (dx * dx + dy * dy + dz * dz > TOGETHER_RANGE * TOGETHER_RANGE) continue
            // Sorted so "a|b" and "b|a" are the same bucket.
            var pair = [a.username, bb.username].sort().join('|')
            together[pair] = (together[pair] || 0) + 1
          } catch (e) {
            // pairwise runs every 10s; a per-error log would flood. Once only.
            if (!warnedPair) {
              warnedPair = true
              console.error('[telemetry] co-location unreadable: ' + e)
            }
          }
        }
      }
    }

    if (tick % TOGETHER_FLUSH_TICKS === 0) {
      Object.keys(together).forEach(pair => {
        const names = pair.split('|')
        emit('session.together', null, {
          players: names,
          seconds: together[pair] * (SAMPLE_TICKS / 20),
          range: TOGETHER_RANGE,
        })
        delete together[pair]
      })
    }

    if (tick % BUILD_FLUSH_TICKS === 0) {
      Object.keys(builds).forEach(name => {
        const chunks = builds[name]
        Object.keys(chunks).forEach(key => {
          const c = chunks[key]
          const parts = key.split('|')
          const cxz = parts[1].split(',')
          // Only the most-placed types. The DM wants "a stone tower went up here",
          // not a bill of materials.
          const top = Object.keys(c.blocks)
            .sort((a, b) => c.blocks[b] - c.blocks[a])
            .slice(0, 4)
          emit('player.build', name, {
            dim: parts[0],
            chunk_x: parseInt(cxz[0]), chunk_z: parseInt(cxz[1]),
            count: c.n, top_blocks: top,
          })
        })
        delete builds[name]
      })
    }
  })

  BlockEvents.placed(event => {
    const player = event.player
    if (!player || !player.username) return
    try {
      const name = player.username
      const cx = event.block.x >> 4
      const cz = event.block.z >> 4
      const key = dimOf(player) + '|' + cx + ',' + cz
      if (!builds[name]) builds[name] = {}
      if (!builds[name][key]) builds[name][key] = { n: 0, blocks: {} }
      const c = builds[name][key]
      c.n += 1
      const id = String(event.block.id)
      c.blocks[id] = (c.blocks[id] || 0) + 1
    } catch (e) {
      // Placement fires constantly; a per-event error log would be a denial of
      // service on the log. Loud once, then silent.
      if (!warnedPlace) {
        warnedPlace = true
        console.error('[telemetry] block placement not recordable: ' + e)
      }
    }
  })

  console.info('[telemetry] producer active, schema v' + V + ', world ' + WORLD_ID)
})()
