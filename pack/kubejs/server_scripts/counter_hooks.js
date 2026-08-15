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
//   forge    items crafted     the only patron who pays for your actual output
//   wall     blocks placed     the household, made of walls
//   art      new biomes seen   she sends you out; arriving is the point
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

  // ── WALL: blocks placed ───────────────────────────────────────────────────
  BlockEvents.placed(function (event) {
    if (!GATE) return
    try { if (event.player) bump(event.player, 'wall', 1, 'placed') } catch (e) { }
  })

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
    console.info(TAG + 'counter hooks live - blade:slain forge:crafted+smelted ' +
      'wall:placed art:new-biomes (salvage:trades lives in salvage.js)')
  })
})();
