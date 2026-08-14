// death_cost.js — E2b of the Path System build. docs/24
//
// DEATH COSTS LEVELS. It never did.
//
// Ethan, 2026-08-11: "the lose xp on death was never implemented."
//
// Verified before writing a line: the ONLY XP writer anywhere in this codebase was
// `wipeXp` in stalker.js, called from exactly one place - the Harvest loss. The
// original design's "roughly 5 levels on death" has never existed. Combined with
// `keepInventory = true` (which in vanilla keeps EXPERIENCE as well as items) and
// a 0.75s respawn, dying has cost literally nothing: not gear, not levels, not
// even the walk back. Ethan died 20 times on 2026-08-11 and paid nothing, which is
// exactly why it read as annoying rather than tense.
//
// ── THE FLOOR IS FREE. DO NOT BUILD ONE ──────────────────────────────────────
// The worry was that a player could die on purpose to push the Harvest away.
// notoriety.js already prevents it, structurally:
//
//     notoriety = max(xpLevel, floor)      where floor = (days since harvest) x rate
//
// Taking levels only lowers the FIRST term. Notoriety can never fall below the
// days term, which keeps accruing whatever the player does. The variable in
// notoriety.js is even called `floor`. Deliberate dying buys a little time and
// then stops working, which is the correct amount of exploit: a desperate move
// that is real but self-limiting.
;(function () {
  var LEVELS_LOST = 5

  // Two deaths inside this window are ONE bad moment, not two mistakes, and are
  // charged once. Same principle as instant_respawn.js's second-death rule and as
  // E2c's counter: a spiral must never be billed per-cycle, or one bad cave
  // empties a player who never made a second decision.
  var REPEAT_GUARD = 100        // ticks (5s), matches the respawn grace window
  var lastCharged = {}          // uuid -> server tick

  function levelsOf(player) {
    try {
      var v = player.xpLevel
      return (typeof v === 'number' && isFinite(v)) ? v : null
    } catch (e) { return null }
  }

  EntityEvents.death(function (event) {
    var p = event.entity
    if (!p || !p.player) return                 // EntityEvents fires for everything
    var uuid = String(p.uuid)
    var server = null
    try { server = p.server } catch (e) { return }
    if (!server) return

    // THE HARVEST OWNS ITS OWN COST. stalker.js wipes XP to zero on a lost
    // Harvest; charging another five on top would be double billing, and worse,
    // it would look like the wipe had under-delivered.
    try {
      if (typeof VELDORA !== 'undefined' && typeof VELDORA.stalkerPhase === 'function') {
        if (VELDORA.stalkerPhase(server, p) === 'harvest') return
      }
    } catch (e) { }

    // The spiral guard. A stamp from the FUTURE means the server restarted between
    // the two deaths - finding K9 exactly, where uptime was compared across a
    // restart and silently disabled a system for good. Treat it as no prior death.
    var now = 0
    try { now = server.tickCount } catch (e) { }
    var prev = lastCharged[uuid]
    if (typeof prev === 'number' && prev <= now && (now - prev) < REPEAT_GUARD) {
      console.info('[death] ' + p.username + ' died again within ' + (REPEAT_GUARD / 20) +
        's - not charging twice for one bad moment')
      return
    }
    lastCharged[uuid] = now

    var before = levelsOf(p)
    if (before === null) {
      // "could not read" and "had none" must never share an answer.
      console.error('[death] CANNOT READ XP LEVEL for ' + p.username +
        ' - no death cost was applied. That is a BUG, not a mode.')
      return
    }
    if (before <= 0) return                     // nothing to take, say nothing

    var take = Math.min(LEVELS_LOST, before)
    var after = before - take

    var ok = false
    try { p.xpLevel = after; ok = true } catch (e) {
      try {
        server.runCommandSilent('xp set ' + p.username + ' ' + after + ' levels')
        ok = true
      } catch (e2) {
        console.error('[death] could not take levels from ' + p.username + ' :: ' + e2)
      }
    }
    if (!ok) return

    // VERIFY AT THE POINT OF USE. "I set it to N" and "it is N" are different
    // claims, and this project has shipped the first while believing the second.
    var actual = levelsOf(p)
    if (actual !== after) {
      console.warn('[death] level write did not stick for ' + p.username +
        ' - wanted ' + after + ', read back ' + actual)
    }

    console.info('[death] ' + p.username + ' lost ' + take + ' levels (' +
      before + ' -> ' + (actual === null ? '?' : actual) + ')')

    // ANNOUNCE IT. The legibility law: every cost is named as it is paid. A player
    // who quietly loses levels and never learns why is being punished by a bug as
    // far as they can tell.
    try {
      p.tell(Text.of('§cYou lost §f' + take + '§c levels. §8(' + before + ' -> ' + after + ')'))
    } catch (e) { }
  })

  ServerEvents.loaded(function () {
    console.info('[death] E2b active - death costs ' + LEVELS_LOST +
      ' levels, once per ' + (REPEAT_GUARD / 20) + 's, never during a Harvest')
    console.info('[death] no floor needed: notoriety = max(xp, days x rate), so the ' +
      'days term already floors it')
  })
})()
