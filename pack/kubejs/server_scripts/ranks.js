// ranks.js — how the NON-COMBATANT paths gain trust.  docs/63 §6
//
// ⭐ NOT EVERY GOD LEVELS BY FIGHTING. Ethan, 2026-08-24:
//
//     "forge and wall play differently as non-combatant classes... we give the harvest
//      only to combatant classes then to raise trust. Wall's trust raises on days
//      survived, and forge can be items crafted."
//
// blade / salvage / art rank up by winning a Trial (harvest.js). Wall and Forge never
// reach that threshold for anything — they rank on their own metric, here.
//
// 🚨 THIS FILE IS LOAD-BEARING, NOT A NICETY. docs/63 moved buffs and drop chance onto
// trust (power.js, paths.js both read trustScale). Without this, a Wall or Forge walker
// would sit at rank 0 permanently: no attribute bonuses and base drop chance, forever.
// The moment trust replaced notoriety, these two paths lost all progression until this
// existed.
//
// ── ⭐ WHAT EACH GOD'S RANK MEASURES ───────────────────────────────────────
//
//     blade · salvage · art      win a fight
//     wall                       come home
//     forge                      make something
//
// 🔑 Wall's is the sharpest thing in the design. Her release mode is literally `never`,
// Blade's gossip has her weeping for every champion she loses, and docs/59 has her
// holding on to the one thing that still needs her. Her champion now ranks up BY NOT
// DYING. That is her whole character rendered as a progression curve.
//
// ── ⚠️ WHY WALL USES A HIGH-WATER MARK AND NOT A LIVE STREAK ───────────────
// "Days survived" has two readings and they are not close in feel:
//
//   a live streak   your rank IS your current run. Dying drops you to rank 0, which
//                   strips every buff at the exact moment you are weakest. That is a
//                   death spiral, and Ethan has designed against those consistently
//                   ("we don't take items from players, that is how you cause them to
//                   quit").
//   a high-water    your rank is the BEST streak you have ever achieved. Dying resets
//                   the streak but never the rank; to rank up you must beat your own
//                   record.
//
// ⭐ HIGH-WATER, and it is the better version of her rather than the softer one: she
// remembers the longest you ever managed to stay alive, and asks you to do better than
// that. You are never punished, and you are never done.
//
// ⚠️ MY CALL, not his — he said "days survived" and both readings are that. One
// constant table and one comparison to change if the streak version is wanted.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[ranks] '
  var GATE = true

  var SWEEP = 1200          // 60s. This is a slow clock; it does not need to be fast.

  // ⚠️ FIRST GUESSES, AND THEY WANT PLAY DATA RATHER THAN ARGUMENT. The two metrics
  // move at wildly different speeds - a Create setup crafts thousands of items in an
  // evening, while surviving twelve in-game days straight is a real ask. Expect these
  // to move once there is a session to measure.
  //
  // Five thresholds = five ranks, matching TRUST_MAX in notoriety.js. Read as "the
  // rank you have earned is the highest threshold you have passed".
  var WALL_DAYS = [1, 4, 10, 20, 35]          // best unbroken run, in in-game days
  var FORGE_MADE = [50, 250, 800, 2000, 5000] // cumulative crafted/smelted/placed

  var K_LAST_DEATH = 'veldora_rank_lastdeath'  // world day of the last death
  var K_BEST_RUN = 'veldora_rank_bestrun'      // longest run in days, ever

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null                                 // ⚠️ null, never 0 - a 0 here would
  }                                             // read as "day zero" and hand out ranks

  function pathOf(p) {
    try { return (VELDORA.paths && VELDORA.paths.pathOf(p)) || '' } catch (e) { return '' }
  }

  // The rank a value has earned: the count of thresholds it has passed.
  function rankFor(table, value) {
    if (typeof value !== 'number' || !isFinite(value) || value < 0) return 0
    var n = 0
    for (var i = 0; i < table.length; i++) if (value >= table[i]) n = i + 1
    return n
  }

  // ⭐ AWARD ONLY UPWARD, AND ONLY THE DIFFERENCE. awardTrust() takes a delta, so
  // handing it an absolute rank would compound every sweep. And a rank must never be
  // taken back: docs/63's whole payout model is that you gain or you gain nothing.
  function lift(server, p, god, want) {
    var have = 0
    try { have = VELDORA.trust ? VELDORA.trust(server, p, god) : 0 } catch (e) { return }
    if (!(want > have)) return
    try {
      VELDORA.awardTrust(server, p, want - have, god === 'wall'
        ? 'survived ' + want + ' threshold(s)'
        : 'made ' + want + ' threshold(s) worth')
    } catch (e) { console.warn(TAG + 'awardTrust threw :: ' + e) }
  }

  // ── WALL — the longest you have ever stayed alive ────────────────────────
  function wallRank(server, p) {
    var day = dayNow(server)
    if (day === null) return                    // no clock, no ranking. Not zero.
    var last, best
    try {
      last = p.persistentData.getInt(K_LAST_DEATH)
      best = p.persistentData.getInt(K_BEST_RUN)
    } catch (e) { return }

    // First sight: anchor to today rather than to day 0, or a player joining on world
    // day 66 is instantly credited with a 66-day run. Same class as notoriety.js's
    // own anchoring bug, which its comments describe at length.
    if (!(last > 0)) {
      try { p.persistentData.putInt(K_LAST_DEATH, day) } catch (e) { }
      return
    }

    var run = day - last
    // 🚨 A BACKWARDS CLOCK MUST NOT MINT A RANK. /time set is a real thing an admin
    // does, and finding K9 in this repo is exactly this shape wearing a different hat.
    if (run < 0) {
      try { p.persistentData.putInt(K_LAST_DEATH, day) } catch (e) { }
      return
    }
    if (run > best) {
      best = run
      try { p.persistentData.putInt(K_BEST_RUN, best) } catch (e) { }
    }
    lift(server, p, 'wall', rankFor(WALL_DAYS, best))
  }

  // ── FORGE — how much you have made ───────────────────────────────────────
  function forgeRank(server, p) {
    var made = null
    try { if (VELDORA.counter) made = VELDORA.counter.get(p, 'forge') } catch (e) { return }
    if (made === null) return                   // could not read ≠ made nothing
    lift(server, p, 'forge', rankFor(FORGE_MADE, made))
  }

  function sweep(server) {
    try {
      if (!GATE) { schedule(server); return }
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        var god = pathOf(p)
        if (god === 'wall') wallRank(server, p)
        else if (god === 'forge') forgeRank(server, p)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    schedule(server)
  }
  function schedule(server) { server.scheduleInTicks(SWEEP, function () { sweep(server) }) }

  // ── the streak breaks on death, and ONLY on death ────────────────────────
  EntityEvents.death(function (event) {
    try {
      var e = event.entity
      if (!e || !e.player) return
      if (pathOf(e) !== 'wall') return
      var day = dayNow(e.server)
      if (day === null) return
      var last = 0
      try { last = e.persistentData.getInt(K_LAST_DEATH) } catch (x) { }
      var run = (last > 0) ? (day - last) : 0
      try { e.persistentData.putInt(K_LAST_DEATH, day) } catch (x) { }
      // ⭐ The RANK is untouched here on purpose - see the header. She remembers your
      // best; she does not take it back because you died. Only the run resets.
      console.info(TAG + e.username + ' died - wall run of ' + run + ' day(s) ends. ' +
        'Best run and rank are kept.')
    } catch (x) { }
  })

  VELDORA.ranks = {
    wallDays: WALL_DAYS, forgeMade: FORGE_MADE, rankFor: rankFor,
  }

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF - wall and forge cannot rank'); return }
    schedule(event.server)
    var seam = !!(VELDORA.trust && VELDORA.awardTrust)
    console.info(TAG + 'non-combatant ranks live - wall on DAYS SURVIVED ' +
      '(best run ever: ' + WALL_DAYS.join('/') + ' days), forge on THINGS MADE (' +
      FORGE_MADE.join('/') + '). Swept every ' + Math.round(SWEEP / 20) + 's.')
    if (!seam) {
      console.error(TAG + '!! VELDORA.trust / awardTrust MISSING - wall and forge ' +
        'can never rank, which means NO buffs and base drops for both paths, ' +
        'permanently. That is a bug, not a quiet path.')
    }
  })
})();
