// coefficients.js - E3 of the path system build.  docs/24 §E3, table in docs/23 §7
//
// THE COEFFICIENT SUBSTRATE. The whole design of "Blade does not play like Forge"
// is this one table, and nothing else.
//
// Notoriety is ONE number. Three things already read it:
//
//   drops   paths.js   dropChanceFor   - chance a kill pays patron loot
//   power   power.js   bonusesFor      - health / armour / damage / knockback
//   phase   stalker.js resolvePhase    - how fast your patron escalates
//
// Until now all three were PATH-BLIND: every walker got the identical curve, so a
// path was a different drop table and a different set of whispers and nothing else.
// This file inserts one per-path multiplier between the number and its consumers.
//
// It is deliberately NOT a mechanism. It is a table plus an honest reader. Every
// consumer keeps its own logic and simply asks "what is this player's multiplier".
//
// ── ROLLBACK, written first and on purpose ───────────────────────────────────
// Set EVERY value in TABLE to 1.0 and behaviour returns EXACTLY to what shipped
// before this file existed. There is no gate to flip and no state to migrate,
// because a coefficient of 1.0 is arithmetically invisible. That is the whole
// reason the substrate multiplies instead of branching.
//
// ── THE SPAWNS AXIS ✅ WIRED 2026-08-15 (spawn_pressure.js) ──────────────────
// It was INERT from this file's creation until then, for the reason below. It is
// now live in TWO regimes: below 1 suppresses natural spawns through checkSpawn,
// above 1 sends waves through spawner.js. See 23 §7b - a multiplier applied to
// zero is zero, and In Control denies natural hostiles above y=40, so the
// coefficient carries the deep and the spawner carries the surface.
//
// ── the original argument, kept because it is why it waited ─────────────────
// docs/23 §7 lists four axes. Three are weightings on numbers that already exist.
// The fourth, `spawns`, is NOT a weighting - it is a mechanism that does not exist:
//
//   E0 P9 proved `checkSpawn` fires (828+ observed) and is CANCELLABLE.
//   Cancelling can only ever implement a coefficient BELOW 1. You cannot cancel
//   your way to MORE mobs, and Blade's headline number is ×4.
//
// A ×4 needs an ACTIVE spawner near the player - the mechanism the_hunt.js already
// has (SPAWN_MIN/SPAWN_MAX ring placement). That is a build, not a multiply, so it
// is scoped separately rather than faked here. `spawns` values live in the table
// below so the design is in one place, and `VELDORA.coeff.of()` will serve them the
// moment a consumer exists - but NOTHING READS THEM TODAY and this file says so out
// loud at boot rather than looking healthy while doing nothing.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[coeff] '
  var PATH_KEY = 'veldora_path'

  // ── THE TABLE ──────────────────────────────────────────────────────────────
  // docs/23 §7, as amended 2026-08-15: five paths, not six. Crown merged into Wall
  // (docs/35 §6) and Wall stays MERCANTILE because Wall is about building.
  //
  // ⚠️ Blade's `drops` goes DOWN, and that is the load-bearing number in the whole
  // design. All three consumers read the SAME notoriety, so raising Blade would
  // give it faster phases AND more drops AND more power - strictly the best path.
  // The challenger fights; somebody else arms it. This one coefficient is what
  // makes Blade need Forge.
  var TABLE = {
    blade:   { role: 'combat',     spawns: 4.0, power: 3.0, drops: 0.6, phase: 2.0 },
    salvage: { role: 'combat',     spawns: 4.0, power: 2.5, drops: 0.8, phase: 1.5 },
    forge:   { role: 'mercantile', spawns: 1.0, power: 0.4, drops: 3.0, phase: 1.0 },
    wall:    { role: 'mercantile', spawns: 1.5, power: 0.6, drops: 2.5, phase: 1.0 },
    art:     { role: 'explorer',   spawns: 1.5, power: 1.2, drops: 1.0, phase: 1.0 },
  }

  // Crown is retirement-bound (docs/35 §6) but is STILL a claimable key in paths.js
  // until the world reset removes it. Aliasing it to Wall means a live Crown walker
  // gets Wall's numbers instead of silently falling through to neutral - which would
  // look identical to "no path" and be invisible.
  TABLE.crown = TABLE.wall

  var AXES = ['spawns', 'power', 'drops', 'phase']
  var NEUTRAL = 1.0

  // Which axes have a live consumer TODAY. Used by the boot report and by
  // /path coefficients, so a number nobody reads is never presented as if it acts.
  var CONSUMED = { drops: true, power: true, phase: true, spawns: true }

  // ⚠️ SUBCLASSES ARE CUT (Ethan, 2026-08-15). This used to stack half of a
  // subclass's DEVIATION from neutral on top of the primary's. The mechanism was
  // correct and the feature was not: a subclass would have meant serving two
  // patrons with two verbs, and subclasses were ruled not to get patrons at all -
  // which left them a skill tree with no patron, no counter and no reckoning.
  //
  // They existed because six paths and four players orphans content. Crown merging
  // into Wall makes it five and four, so the problem they solved has dissolved.
  // See 23 §8. puffish_skills stays as the per-path tree; there is no second choice.

  // Floor. A stack of negative deviations must never reach zero, because zero is
  // indistinguishable from "the subsystem is broken" - the failure mode this whole
  // codebase keeps relearning. 0.05 is small enough to feel punishing and large
  // enough to prove the pipe is alive.
  var FLOOR = 0.05

  // ── PLAYERS ONLINE ─────────────────────────────────────────────────────────
  // docs/24 §E3: "scale costs by players online (the 2am decision)."
  // Only COSTS soften, never rewards - four people sharing a world should not each
  // carry the full solo spawn pressure. Gentle and tunable; 1 player is exactly 1.0
  // so a solo session is unaffected and the curve can be measured before it matters.
  //
  //   1 player -> 1.00   2 -> 0.87   3 -> 0.77   4 -> 0.69
  var ONLINE_SOFTEN = 0.15
  var COST_AXES = { spawns: true }

  function onlineScale(server, axis) {
    if (!COST_AXES[axis]) return 1.0
    var n = 1
    try { n = server.players.length || 1 } catch (e) { return 1.0 }
    if (n <= 1) return 1.0
    return 1 / (1 + (n - 1) * ONLINE_SOFTEN)
  }

  // ── reading the player ─────────────────────────────────────────────────────
  // "could not read" and "walks no path" must never share an answer. The first is
  // a bug and says so once; the second is the commonest state on the server and is
  // silent. Both return neutral, but only one of them warns.
  var warned = false
  function warnOnce(msg) {
    if (warned) return
    warned = true
    console.warn(TAG + 'FALLBACK: ' + msg)
    console.warn(TAG + 'coefficients are running NEUTRAL. That is a BUG, not a mode.')
  }

  function pathOf(player) {
    try { return player.persistentData.getString(PATH_KEY) || '' }
    catch (e) { warnOnce('could not read ' + PATH_KEY + ' :: ' + e); return null }
  }

  // ── the one function everything else calls ─────────────────────────────────
  // Returns a NUMBER, always finite, always usable as a multiplier. Never null -
  // a consumer that has to null-check a multiplier will eventually forget to.
  function of(server, player, axis) {
    if (!axis || AXES.indexOf(axis) === -1) {
      warnOnce('unknown axis "' + axis + '"')
      return NEUTRAL
    }
    var key = pathOf(player)
    if (key === null) return NEUTRAL          // unreadable - already warned
    if (!key) return NEUTRAL                  // pathless - the normal quiet case

    var row = TABLE[key]
    if (!row) {
      warnOnce('path "' + key + '" has no row in TABLE')
      return NEUTRAL
    }

    var v = row[axis]

    v *= onlineScale(server, axis)
    if (!isFinite(v) || v < FLOOR) v = FLOOR
    return v
  }

  // A whole-player readout, for /path coefficients and for the boot report.
  function explain(server, player) {
    var key = pathOf(player)
    var out = {
      path: key || '', sub: '',
      role: (TABLE[key] && TABLE[key].role) || '',
      online: 1, axes: [],
    }
    try { out.online = server.players.length || 1 } catch (e) { }
    for (var i = 0; i < AXES.length; i++) {
      var a = AXES[i]
      out.axes.push({
        axis: a,
        value: Math.round(of(server, player, a) * 1000) / 1000,
        base: (TABLE[key] && TABLE[key][a]) || NEUTRAL,
        live: !!CONSUMED[a],
      })
    }
    return out
  }

  // ── the seam ───────────────────────────────────────────────────────────────
  VELDORA.coeff = {
    of: of,
    explain: explain,
    table: TABLE,
    axes: AXES,
    consumed: CONSUMED,
    neutral: NEUTRAL,
  }

  ServerEvents.loaded(event => {
    var ok = (typeof VELDORA !== 'undefined') && VELDORA.coeff &&
      (typeof VELDORA.coeff.of === 'function')
    if (!ok) {
      console.error(TAG + 'VELDORA.coeff MISSING - every path runs identical, silently')
      return
    }
    var paths = []
    for (var k in TABLE) if (TABLE.hasOwnProperty(k)) paths.push(k)
    console.info(TAG + 'VELDORA.coeff published OK - ' + paths.length +
      ' path keys (crown aliases wall), ' + AXES.length + ' axes')
    console.info(TAG + 'LIVE axes: drops, power, phase, spawns. ' +
      'spawns is TWO regimes (23 §7b): below 1 suppresses natural spawns via ' +
      'checkSpawn, above 1 sends waves via spawner.js - because a multiplier on ' +
      'zero is zero, and In Control denies naturals above y=40.')
  })
})();
