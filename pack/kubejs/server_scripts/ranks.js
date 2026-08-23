// ranks.js — how the NON-COMBATANT paths hold, and lose, their god's attention.
// docs/63 §6 and §9.
//
// ⭐⭐ THEY DO NOT CLIMB. THEY DECAY. Ethan, 2026-08-24:
//
//     "wall starts at their strongest and loses strength as they keep dying and their
//      gods focus shifts to others. We can do the inverse for forge, they have to keep
//      placing blocks and crafting otherwise their god's focus will shift away and
//      bother other players (like a child). So each start at full strength and each
//      have a way to lose it."
//
// 🔴 THIS FILE PREVIOUSLY HAD BOTH OF THEM CLIMBING FROM RANK 0. That was the wrong
// sign, and the reason is worth keeping: **a god's attention is something you already
// have and can lose.** Climbing implies you must earn their notice — but these two
// noticed you the moment you claimed them. Wall smothers from day one and Milantros has
// never stopped talking. Decay is the correct shape for both, and it is what makes them
// play unlike the combatants rather than like them with different inputs.
//
// ── ⭐ ONE MODEL, TWO DEBTS ────────────────────────────────────────────────
// Both are the same sentence: **rank = TRUST_MAX minus a debt.** Only what accrues the
// debt differs, which keeps the file small and keeps the two gods legible against each
// other.
//
//     wall     debt rises per DEATH          falls with days survived
//     forge    debt rises while you are IDLE  falls when you make things
//
// 🔑 And the debt is what is stored, never the rank. A stored rank plus a stored debt is
// two numbers that can disagree; deriving the rank means they cannot.
//
// ── 🚨 THE SPIRAL, AND WHY WALL HAS A FLOOR ───────────────────────────────
// Wall's debt is per-death, so the naive version is: die → weaker → die more → weaker.
// That is exactly the loop Ethan has designed against everywhere else in this project
// ("we don't take items from players, that is how you cause them to quit").
//
// Two guards, and neither is optional:
//   · a FLOOR — she never abandons you completely, which is also just true of her
//     (release.js has her at mode `never`, and blade's gossip has her unable to let go)
//   · RECOVERY — days survived pay the debt back down, so a bad night is a setback and
//     never a state you cannot leave
//
// ── ⚠️ FORGE'S DEBT ONLY ACCRUES WHILE YOU ARE ONLINE ─────────────────────
// Ethan, explicitly: "attention should not decrease while they are not logged in."
//
// So her boredom is counted in SWEEPS, not in world days. The sweep only ever sees
// online players, so time spent logged out is invisible to it for free — no session
// tracking, no join/leave bookkeeping, nothing to get wrong. A player who leaves for a
// fortnight comes back exactly as bored as they left.
//
// 🚨 A WORLD-DAY CLOCK WOULD HAVE BEEN THE OBVIOUS IMPLEMENTATION AND IT WOULD HAVE BEEN
// WRONG — the world advances while they sleep, so a week away would read as total
// abandonment. This is the one place the two gods must NOT share a mechanism.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[ranks] '
  var GATE = true

  var SWEEP = 1200          // 60s. A slow clock; it does not need to be fast.

  // ── WALL ─────────────────────────────────────────────────────────────────
  var WALL_FLOOR = 1        // ⭐ she never drops you entirely. mode `never`, in a number.
  var WALL_RECOVER_DAYS = 6 // in-game days alive to pay off one death

  // ── FORGE ────────────────────────────────────────────────────────────────
  // Sweeps of ONLINE idleness before she loses interest by one step. 20 sweeps = 20
  // real minutes of not making anything, which for a Create player is a long pause.
  var FORGE_BORED_SWEEPS = 20
  var FORGE_MADE_PER_STEP = 40   // things made to win a step of attention back
  var FORGE_FLOOR = 0            // ⚠️ she CAN wander off completely. That is the point.

  var K_DEBT = 'veldora_rank_debt'        // both gods: steps below max
  var K_LAST_DEATH = 'veldora_rank_lastdeath'
  var K_IDLE = 'veldora_rank_idle'        // forge: consecutive idle sweeps
  var K_SEEN_MADE = 'veldora_rank_seenmade'
  var K_BORED_AT = 'veldora_rank_boredat' // forge: last complaint, so she nags once

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null                              // ⚠️ null, never 0
  }

  function pathOf(p) {
    try { return (VELDORA.paths && VELDORA.paths.pathOf(p)) || '' } catch (e) { return '' }
  }
  function maxRank() {
    try { return VELDORA.trustMax ? VELDORA.trustMax() : 5 } catch (e) { return 5 }
  }
  function getI(p, k) { try { return p.persistentData.getInt(k) || 0 } catch (e) { return 0 } }
  function putI(p, k, v) { try { p.persistentData.putInt(k, v) } catch (e) { } }

  // ⭐ THE ONE WRITE PATH. awardTrust takes a DELTA, so handing it an absolute rank
  // would compound every sweep. Everything below decides a target and this reconciles.
  function setRank(server, p, god, want, why) {
    var have = 0
    try { have = VELDORA.trust ? VELDORA.trust(server, p, god) : 0 } catch (e) { return }
    if (want === have) return
    try { VELDORA.awardTrust(server, p, want - have, why) } catch (e) {
      console.warn(TAG + 'awardTrust threw :: ' + e)
    }
  }

  function clampDebt(d, floor) {
    var max = maxRank()
    if (!(d > 0)) d = 0
    if (d > max - floor) d = max - floor
    return d
  }

  // ── WALL — she is strongest the day she takes you, and grief costs her ───
  function wallSweep(server, p) {
    var day = dayNow(server)
    if (day === null) return                  // no clock, no ranking. Not zero.
    var last = getI(p, K_LAST_DEATH)
    if (!(last > 0)) { putI(p, K_LAST_DEATH, day); last = day }

    var alive = day - last
    if (alive < 0) { putI(p, K_LAST_DEATH, day); return }   // clock ran backwards

    var debt = getI(p, K_DEBT)
    // Recovery is DERIVED from time alive, then banked - so a long safe stretch pays
    // off several deaths at once and the player never has to be online at the moment
    // a timer ticks over.
    var paid = Math.floor(alive / WALL_RECOVER_DAYS)
    if (paid > 0 && debt > 0) {
      debt = clampDebt(debt - paid, WALL_FLOOR)
      putI(p, K_DEBT, debt)
      putI(p, K_LAST_DEATH, day)              // re-anchor so it is not paid twice
      console.info(TAG + p.username + ' survived ' + alive + ' day(s) - wall debt now ' + debt)
    }
    setRank(server, p, 'wall', maxRank() - clampDebt(debt, WALL_FLOOR), 'wall: survival')
  }

  // ── FORGE — a child's attention, and it wanders ──────────────────────────
  function forgeSweep(server, p) {
    var made = null
    try { if (VELDORA.counter) made = VELDORA.counter.get(p, 'forge') } catch (e) { return }
    if (made === null) return                 // could not read ≠ made nothing

    var seen = getI(p, K_SEEN_MADE)
    var debt = getI(p, K_DEBT)
    var idle = getI(p, K_IDLE)

    if (made > seen) {
      // They made something. Attention comes back, and boredom resets.
      var steps = Math.floor((made - seen) / FORGE_MADE_PER_STEP)
      if (steps > 0 && debt > 0) {
        debt = clampDebt(debt - steps, FORGE_FLOOR)
        putI(p, K_DEBT, debt)
        console.info(TAG + p.username + ' made ' + (made - seen) + ' - forge debt now ' + debt)
      }
      putI(p, K_SEEN_MADE, made)
      putI(p, K_IDLE, 0)
      putI(p, K_BORED_AT, 0)
      idle = 0
    } else {
      // ⚠️ ONLY REACHED WHILE ONLINE, because the sweep only iterates server.players.
      // That is the whole of "attention should not decrease while they are not logged
      // in" - no session bookkeeping, nothing to get wrong.
      idle++
      putI(p, K_IDLE, idle)
      if (idle >= FORGE_BORED_SWEEPS) {
        debt = clampDebt(debt + 1, FORGE_FLOOR)
        putI(p, K_DEBT, debt)
        putI(p, K_IDLE, 0)
        // ⭐ SHE SAYS SO. docs/63 §9 named an unexplained rank drop as a falsifier: a
        // player returning to a lower number with no idea why. She is the chattiest
        // god in the game - the one thing she would never do is go quiet about it.
        try { if (VELDORA.voice) VELDORA.voice.say(p, 'forge', 'bored') } catch (e) { }
        console.info(TAG + p.username + ' bored forge for ' + FORGE_BORED_SWEEPS +
          ' sweep(s) - debt now ' + debt)
      }
    }
    setRank(server, p, 'forge', maxRank() - clampDebt(debt, FORGE_FLOOR), 'forge: attention')
  }

  function sweep(server) {
    try {
      if (!GATE) { schedule(server); return }
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        var god = pathOf(p)
        if (god === 'wall') wallSweep(server, p)
        else if (god === 'forge') forgeSweep(server, p)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    schedule(server)
  }
  function schedule(server) { server.scheduleInTicks(SWEEP, function () { sweep(server) }) }

  // ── a death costs Wall's champion one step of her attention ──────────────
  EntityEvents.death(function (event) {
    try {
      var e = event.entity
      if (!e || !e.player) return
      if (pathOf(e) !== 'wall') return
      var day = dayNow(e.server)
      if (day === null) return
      var debt = clampDebt(getI(e, K_DEBT) + 1, WALL_FLOOR)
      putI(e, K_DEBT, debt)
      putI(e, K_LAST_DEATH, day)              // the survival clock restarts here
      setRank(e.server, e, 'wall', maxRank() - debt, 'wall: died')
      console.info(TAG + e.username + ' died - wall debt ' + debt + '/' +
        (maxRank() - WALL_FLOOR) + ', floor keeps them at rank ' + WALL_FLOOR + ' or better')
    } catch (x) { }
  })

  VELDORA.ranks = {
    wallFloor: WALL_FLOOR, forgeFloor: FORGE_FLOOR,
    wallRecoverDays: WALL_RECOVER_DAYS, forgeBoredSweeps: FORGE_BORED_SWEEPS,
  }

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF - wall and forge do not decay'); return }
    schedule(event.server)
    console.info(TAG + 'non-combatant ranks live - they START AT MAX and DECAY. ' +
      'wall loses a step per DEATH (floor ' + WALL_FLOOR + ', one back per ' +
      WALL_RECOVER_DAYS + ' days alive); forge loses one per ' + FORGE_BORED_SWEEPS +
      ' idle sweeps ONLINE ONLY (floor ' + FORGE_FLOOR + ', one back per ' +
      FORGE_MADE_PER_STEP + ' things made).')
    if (!(VELDORA.trust && VELDORA.awardTrust)) {
      console.error(TAG + '!! VELDORA.trust / awardTrust MISSING - wall and forge ' +
        'cannot be ranked at all, which means they sit wherever they are forever. ' +
        'That is a bug, not a quiet path.')
    }
  })
})();
