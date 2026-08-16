// counter_hooks.js - what RAISES each patron's counter.  docs/23 PART V.8
//
// counters.js is the storage; this is the sensor. Split because the storage is
// general and these are opinions about what each character cares about.
//
// THE COUNTER IS THE PATH'S OWN VERB, which is what makes the verb mechanically
// load-bearing rather than flavour text:
//
//   blade    enemies slain     he set a test; you take it
//   salvage  trades taken      ALREADY BUILT in salvage.js - she is the inversion
//   forge    BUILDING          blocks placed + items crafted + smelted. He is the
//                              Builder, and the only direct non-combat path
//   wall     RAGE              🔴 NOT a verb, and NOT counted here - see below
//   art      new biomes seen   she sends you out; arriving is the point
//
// 🚨 WALL IS THE EXCEPTION AND THIS FILE USED TO GET IT WRONG. Her counter is not
// something you DO, it is how she FEELS, and it is written only by wall_events.js
// (+1 minion raised / -1 slain / +8 your death / -2 per quiet day). This file
// counted `blocks placed` into that same key for a Wall that stopped existing on
// 2026-08-15, which meant building a house made the Spider angrier. Removed
// 2026-08-16 after it was found live at 274 against a fury threshold of 90.
//
// ── ART IS NOT SLEEP, AND THE REASON IS THE SERVER ───────────────────────────
// Sleep is her written demand and it is unbuildable here. There is no sleep event
// in any KubeJS group, and `playersSleepingPercentage` is 50 on this server, so
// half of everyone must be in bed. Ethan: "on a multiplayer server sleep is
// annoying." A counter that needs other players to cooperate is a group vote.
//
// So she counts what she actually sends you to do. Every one of her events is a map
// or a named biome, and telemetry.js has read biomes since 2026-08-02.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[hooks] '
  var GATE = true

  // Art's ledger of what she has already shown you. A biome only counts ONCE -
  // she rewards arriving somewhere new, never pacing the same forest.
  var SEEN = 'veldora_biomes_seen'
  var BIOME_TICKS = 200            // 10s, matching telemetry's sampler

  function pathOf(p) {
    try { if (VELDORA.paths) return VELDORA.paths.pathOf(p) || '' } catch (e) { }
    return ''
  }

  // Raise a patron's counter ONLY for the player who walks it. A Forge walker
  // killing something is not Blade's business.
  function bump(p, patron, n, why) {
    if (!GATE) return
    if (pathOf(p) !== patron) return
    try {
      if (VELDORA.counter) VELDORA.counter.add(p, patron, n, why)
    } catch (e) { console.warn(TAG + 'bump threw for ' + patron + ' :: ' + e) }
  }

  // ── BLADE: enemies slain ──────────────────────────────────────────────────
  // ⚠️ isMonster() DIRECTLY. the_hunt.js records three attempts at this line:
  // getMobCategory() exists on nothing; getCategory() threw on every kill because
  // Rhino does not hand back a bare Java method reference, so probing for it read
  // FALSY where the method exists and every kill took the broken branch.
  EntityEvents.death(function (event) {
    if (!GATE) return
    try {
      var victim = event.entity
      if (!victim || !victim.living || victim.player) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      var monster = false
      try { monster = victim.isMonster() } catch (e) { return }
      if (!monster) return              // farming cows is not answering a test
      bump(killer, 'blade', 1, 'slain')
    } catch (e) { console.warn(TAG + 'blade hook threw :: ' + e) }
  })

  // ── FORGE: items crafted ──────────────────────────────────────────────────
  // Counted by the STACK, not the item: a crafted stack of 64 rails is one act of
  // production, and paying per-item would make his quota a macro rather than a job.
  ItemEvents.crafted(function (event) {
    if (!GATE) return
    try { if (event.player) bump(event.player, 'forge', 1, 'crafted') } catch (e) { }
  })
  ItemEvents.smelted(function (event) {
    if (!GATE) return
    try { if (event.player) bump(event.player, 'forge', 1, 'smelted') } catch (e) { }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ FORGE: BLOCKS PLACED — re-homed 2026-08-16, finishing a ruling from earlier
  // the same day. Ethan, on the event taxonomy: "Forge will be block placed."
  //
  // The hook was DELETED from Wall when it turned out to be driving her rage, and
  // the design doc recorded it as "re-homed to Forge" - but nothing ever moved it,
  // so for several hours the Builder's counter was `crafted + smelted` and did not
  // count a single placed block. Ethan, 2026-08-16: "Forge - Builder."
  //
  // ⚠️ CRAFTING STILL COUNTS TOO. It is not either/or: he is the production path,
  // and a Create contraption is built out of both acts. Placing is the cheaper of
  // the two per-action, which is exactly what §6.2's step-weighting is for - a
  // block placed should be worth a fraction of a crafted stack when that lands.
  BlockEvents.placed(function (event) {
    if (!GATE) return
    try { if (event.player) bump(event.player, 'forge', 1, 'placed') } catch (e) { }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 WALL'S HOOK IS GONE — REMOVED 2026-08-16, found live.
  //
  // Rehykt's rage read 274 with fury at 90. Triple fury, inside an hour, climbing
  // three points a second while he built a wall.
  //
  // WHY. This file counted `blocks placed` for the OLD Wall - "the household, made
  // of walls", the header of this very file still says it. That Wall stopped
  // existing on 2026-08-15 when she was rewritten into the Spider and the same
  // counter became RAGE. Nobody updated this file, so two systems wrote one key
  // meaning opposite things:
  //
  //     counter_hooks.js   +1 per block placed                "the household grows"
  //     wall_events.js     +1 minion raised, +8 YOUR death    "she is getting angrier"
  //
  // mood() maps that key from 10..90 onto boons..attacks, so PLACING A BLOCK MADE
  // HER ANGRIER. Building a house was arithmetically indistinguishable from watching
  // her champion die eleven times. Her sliding scale - the best thing in her design,
  // and the reason she has three registers instead of tiers - has never once been
  // reachable in play, because anyone who builds anything is pinned at fury within
  // minutes of claiming her.
  //
  // 🚨 THE LESSON, AND IT IS THE THIRD TIME: when a character is redesigned, the
  // counter's MEANING changes, and every writer to that key has to be re-read. Same
  // shape as docs/35 (the Crown merge lived in one doc while six others called him
  // live) and as `veldora_refused_` (a cooldown stamp load-bearing for an unlock in
  // another file). A merge that lives in one file is not a merge.
  //
  // Rage now has exactly FOUR sources and all four are in wall_events.js, which is
  // where anyone looking for them would look.
  //
  // ⚠️ AN INFLATED NUMBER DOES NOT HEAL ITSELF. Decay is -2 per quiet day, so 274
  // would take 92 quiet days to fall back to fury. Existing walkers need
  // `/counters set wall <n>` by hand.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── ART: new biomes ───────────────────────────────────────────────────────
  // Sampled rather than hooked - there is no biome-entered event (23 PART V.7 §2).
  // The seen-set is persistent, so a world's worth of discovery survives restarts.
  function biomeOf(p) {
    try {
      var b = p.level.getBiome(p.block.pos)
      if (b) return String(b)
    } catch (e) { }
    try { return String(p.block.biome) } catch (e) { }
    return null
  }

  var BIOME_LOGGED = false
  function sampleBiomes(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        if (pathOf(p) !== 'art') continue
        var b = biomeOf(p)
        if (!BIOME_LOGGED) {
          BIOME_LOGGED = true
          console.info(TAG + 'biome reads as: ' + (b === null ? 'UNREADABLE - ' +
            "art's counter is INERT" : '"' + b + '"'))
        }
        if (!b) continue
        var seen = ''
        try { seen = p.persistentData.getString(SEEN) || '' } catch (e) { continue }
        if (seen.indexOf('|' + b + '|') >= 0) continue      // already shown you this
        try { p.persistentData.putString(SEEN, seen + '|' + b + '|') } catch (e) { continue }
        bump(p, 'art', 1, 'new biome ' + b)
      }
    } catch (e) { console.warn(TAG + 'biome sampler threw :: ' + e) }
    server.scheduleInTicks(BIOME_TICKS, function () { sampleBiomes(server) })
  }

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'counter hooks GATED OFF'); return }
    sampleBiomes(event.server)
    // ⚠️ This line is the surface an admin uses to CHECK the hooks, so it said
    // "wall:placed" for one boot after the hook was removed - advertising the exact
    // defect that had just been fixed. A banner that describes intent instead of
    // state is the same rot as a doc that does; if a hook changes, change this too.
    console.info(TAG + 'counter hooks live - blade:slain forge:crafted+smelted ' +
      'art:new-biomes (salvage:trades lives in salvage.js)')
    console.info(TAG + 'wall is NOT hooked here - her counter is RAGE, written only ' +
      'by wall_events.js. `blocks placed` was removed 2026-08-16 after it drove her ' +
      'to 274 against a fury threshold of 90.')
  })
})();
