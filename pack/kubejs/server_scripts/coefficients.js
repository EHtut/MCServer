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
  // ⚠️ SPAWNS IS A DENSITY MULTIPLIER, not a roster count. The number IS the
  // world's own spawn rate around that walker, and the excess is how many EXTRA
  // mobs each eligible spawn becomes:
  //     1.0  untouched
  //     2.0  every eligible monster spawn comes twice
  //     3.0  three times, and so on - see spawn_pressure.js, which reads the whole
  //          and fractional parts rather than rolling once against the excess.
  //
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ NOTHING GOES BELOW 1.  Ethan, 2026-08-16: "we should never have a
  // coeffecient go under 1 it should always be an increase."
  //
  // The old table used sub-1 values as the PRICE of a path: Blade paid for his
  // pressure with 0.6 drops, Forge paid for his economy with 0.6 spawns and 0.4
  // power. That is a trade-off design, and this is now explicitly not one. A path
  // is a set of things you are BETTER at, never a set of things you are worse at.
  //
  // What changed, and it is worth being able to see at a glance:
  //     blade   drops   0.6 -> 1.0
  //     salvage drops   0.8 -> 1.0
  //     wall    spawns  0.7 -> 1.0     power 0.6 -> 1.0
  //     forge   spawns  0.6 -> 1.0     power 0.4 -> 1.0
  //
  // Blade keeps every number he had. Ethan: "keep the difficulty. for blade its
  // needed. they should have constant pressure."
  //
  // 🚨 THIS KILLS THE SUPPRESSION HALF OF spawn_pressure.js. `checkSpawn`'s cancel
  // branch can only fire for a coefficient BELOW 1, and there is no longer one -
  // so that code is now unreachable by construction. It is left in place, because
  // the rule is a design decision that could be revisited and the mechanism costs
  // nothing while idle, but NOBODY SHOULD SPEND AN HOUR WONDERING WHY IT NEVER
  // FIRES. It never fires. That is the intent.
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ ETHAN'S NUMBERS, 2026-08-16. Wider spread than the first pass - the top of
  // each axis roughly doubled, so a path's specialism is unmistakable rather than
  // a nudge. Art gains a real identity for the first time (2/2/1/3).
  var TABLE = {
    blade:   { role: 'combat',     spawns: 3.0, power: 5.0, drops: 1.0, phase: 2.0 },
    salvage: { role: 'combat',     spawns: 2.5, power: 3.0, drops: 2.0, phase: 1.5 },
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐ WALL IS INVERTED, and it is the best idea in the table.  Ethan, 2026-08-16:
    //     "Wall starts at their strongest but as you take damage and die her focus
    //      shifts which means more attacks on other players and more minion spawns.
    //      So as you get weaker she gets stronger and more active."
    //
    // Rage is ATTENTION, not anger (his earlier ruling), so her champion's numbers
    // read it BACKWARDS from everyone else's:
    //
    //     rage 0    all of her is pointed at you   -> power 2.5, world quiet (1.0)
    //     rage 90   none of it is                  -> power 1.0, world loud (2.5)
    //
    // 🔑 SO HER ATTENTION IS A RESOURCE THE PLAYER MANAGES. Stay whole and she
    // shields you. Get hurt and she drifts off to punish whoever did it - which
    // leaves you weaker AND the world around you louder, at exactly the moment you
    // are least able to take it. Her protectiveness is what abandons you.
    //
    // ⚠️ It is a spiral, deliberately, but NOT a trap: healing lowers rage (-1 per 6
    // healed), so retreating and recovering pulls her focus back. The way out is the
    // thing her dialogue has been begging for all along.
    //
    // ⚠️ And it resolves the counter-rewiring problem instead of dodging it. Rage was
    // going to have to drive both her mood AND her progression - one number, two
    // jobs, which is what produced the 274-rage bug. Inverted, it does ONE job
    // (attention) and both readings fall out of it.
    //
    // drops and phase stay flat: her economy and her Harvest clock have nothing to
    // do with where she is looking.
    // ═══════════════════════════════════════════════════════════════════════
    wall: {
      role: 'mercantile',
      spawns: function (server, p) {
        var m = wallMood(p)
        return m === null ? 1.0 : 1.0 + 1.5 * m     // 1.0 calm -> 2.5 fury
      },
      power: function (server, p) {
        var m = wallMood(p)
        return m === null ? 2.5 : 2.5 - 1.5 * m     // 2.5 calm -> 1.0 fury
      },
      drops: 3.0,
      phase: 1.0,
    },

    // Her mood, read from the file that owns it. null propagates as "unreadable",
    // and every curve above treats that as her BEST state rather than her worst -
    // a storage hiccup must not quietly strip a player's power.
    // (declared after the table so the function objects above close over it)
    forge:   { role: 'mercantile', spawns: 1.0, power: 1.0, drops: 5.0, phase: 1.0 },
    art:     { role: 'explorer',   spawns: 2.0, power: 2.0, drops: 1.0, phase: 3.0 },
  }

  // Crown is retirement-bound (docs/35 §6) but is STILL a claimable key in paths.js
  // until the world reset removes it. Aliasing it to Wall means a live Crown walker
  // gets Wall's numbers instead of silently falling through to neutral - which would
  // look identical to "no path" and be invisible.
  function wallMood(p) {
    try {
      if (VELDORA.wall && typeof VELDORA.wall.mood === 'function') return VELDORA.wall.mood(p)
    } catch (e) { }
    return null
  }

  TABLE.crown = TABLE.wall

  var AXES = ['spawns', 'power', 'drops', 'phase']
  var NEUTRAL = 1.0

  // Which axes have a live consumer TODAY. Used by the boot report and by
  // /path coefficients, so a number nobody reads is never presented as if it acts.
  // ⭐ spawns IS TRUE as of 2026-08-16. This note used to say FALSE and explain at
  // length why - the suppression half never fired because no path was below 1, and
  // the wave half was gated off by AMBIENT. Both reasons are now dead: DENSITY
  // replaced the wave trickle and is live, and the sub-1 half is unreachable by
  // design under the no-path-is-worse rule. Left as a record because a flag that
  // silently flipped from false to true is worth a sentence.
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

  // ⭐ THE FLOOR IS NEUTRAL NOW, not 0.05. Under the no-path-is-worse rule a value
  // below 1 is not a punishing edge case, it is a mistake - so the floor catches it
  // at the one number that cannot make anybody worse off.
  var FLOOR = 1.0

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ DEPTH SCALING - `spawns` ONLY.  Ethan, 2026-08-16: "add a multiplier to spawn
  // rate scaling with -y and then also add flat increases per depth level."
  //
  // Two separate things, on purpose, because they do different jobs:
  //
  //   MULTIPLIER  smooth, continuous in -y. Every block down is slightly worse,
  //               so descending FEELS like a gradient rather than a set of doors.
  //   FLAT        a step at each named depth band. These are the doors, and they
  //               line up with the ones the world already has - paths.js tiers its
  //               loot at y>=0 / y<0 / y<=-64, and mcserver_depth extends the
  //               overworld to -128 with sealed floor below -120.
  //
  //       effective = base x mult(y) + flat(y)
  //
  // ⚠️ It is applied HERE rather than in spawn_pressure.js so that `/path
  // coefficients` and the boot report show the number a player is ACTUALLY under,
  // not the table value. A readout that shows 3.0 while the game runs 5.5 is the
  // stale-banner defect wearing arithmetic.
  //
  // 🚨 AND IT IS SPAWNS-ONLY. Depth must not touch drops, power or phase - a deep
  // player would otherwise get more loot AND more strength AND a faster Harvest for
  // standing still, which is the "strictly best" trap docs/23 §7 warns about.
  // ⚠️ SOFTENED 2026-08-16, and the reason is a ceiling rather than taste. Density
  // caps at MAX_DUP_PER_EVENT (4) as a TPS guard, and the first numbers pushed
  // blade and salvage past that cap from y-64 downward - so the two DEEPEST bands
  // produced identical pressure and the gradient died exactly where it should have
  // been sharpest. These values keep everyone under the cap until the sealed floor,
  // which is the one place it is meant to bite.
  var DEPTH_FULL = 64            // -y at which the multiplier reaches its cap
  var DEPTH_MAX_MULT = 1.5        // was 2.0

  //  y at or below, flat addition
  // 🔴 RESCALED FOR A -64 FLOOR, 2026-08-30. Ethan ruled min_y back to -64, which puts
  // the old -120 "sealed floor" and the -64..-120 "deep works" OUTSIDE THE WORLD - every
  // band below -64 was unreachable, so the deepest tier paid nothing and the gradient
  // ended at the surface tier. The three-tier descent is preserved by rescaling it into
  // the depth that actually exists (0 to -64). DEPTH_FULL moved 128 -> 64 for the same
  // reason: it is the depth at which the multiplier caps, and it could never be reached.
  var DEPTH_FLAT = [
    [-52, 1.0],                   // the sealed floor      (was -120)
    [-32, 0.5],                   // the deep works        (was -64)
    [0, 0.25],                    // below the surface
  ]

  function depthOf(player) {
    try {
      var y = player.y
      if (typeof y === 'number' && isFinite(y)) return y
    } catch (e) { }
    return null
  }

  function withDepth(v, player) {
    var y = depthOf(player)
    if (y === null) return v      // unreadable depth: no bonus, never a penalty
    if (y >= 0) return v          // surface is the baseline, exactly as written
    var down = -y
    var mult = 1.0 + Math.min(1.0, down / DEPTH_FULL) * (DEPTH_MAX_MULT - 1.0)
    var flat = 0
    for (var i = 0; i < DEPTH_FLAT.length; i++) {
      if (y <= DEPTH_FLAT[i][0]) { flat = DEPTH_FLAT[i][1]; break }
    }
    return v * mult + flat
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 THE ONLINE SOFTENING IS GONE.  Ethan, 2026-08-16: "im thinking that we
  // remove the 2am coefficent scaling tbh. we will never have a full squad so
  // there's no point."
  //
  // It divided the `spawns` axis by player count - docs/24 §E3's "2am decision" -
  // on the reasoning that four people sharing a world should not each carry the
  // full solo pressure. The premise was four players. This is a two-player server
  // and will stay one, so the mechanism only ever did one thing: quietly take 13%
  // off Blade at the exact moment somebody else logged in.
  //
  //     1 player -> 1.00   2 -> 0.87   3 -> 0.77   4 -> 0.69
  //
  // Blade's headline 1.6 was worth 1.39 in every session either of them played,
  // and 1.10 if the pack ever hit four - so the ONE path built around constant
  // pressure was also the one path that got quieter the more people showed up.
  // Ethan: "keep the difficulty. for blade its needed."
  //
  // Removed rather than set to zero, so nothing has to remember it exists. If a
  // full squad ever happens, the whole idea is nine lines in git history.
  // ═══════════════════════════════════════════════════════════════════════════

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

    // ⭐ A TABLE VALUE MAY BE A FUNCTION of (server, player). Wall needs it - her
    // numbers move with her own counter - and the same door is open to any future
    // god. Same rule godevents' chart bands already use.
    //
    // The try/catch is a BACKSTOP for curves yet to be written. Wall's own curves
    // cannot reach it: wallMood() swallows its own failure and returns null, which
    // the curves map to her CEILING. That is deliberate and the two must not be
    // confused - a curve that throws for an unforeseen reason should fall to
    // neutral, but a counter that is merely unreadable must never cost a player
    // power they had a second ago.
    var v = row[axis]
    if (typeof v === 'function') {
      try { v = v(server, player) } catch (e) { return NEUTRAL }
    }

    // ⭐ DEPTH, and only on `spawns`. Ethan, 2026-08-16: "add a multiplier to spawn
    // rate scaling with -y and then also add flat increases per depth level."
    if (axis === 'spawns') v = withDepth(v, player)

    // No player-count scaling any more - see the note above the FLOOR. The only
    // adjustment left is the floor itself, and it is now NEUTRAL: an axis can make
    // a path better and can never make it worse.
    if (!isFinite(v) || v < FLOOR) v = FLOOR
    return v
  }

  // A whole-player readout, for /path coefficients and for the boot report.
  function baseOf(key, a, server, player) {
    var row = TABLE[key]
    if (!row) return NEUTRAL
    var b = row[a]
    if (typeof b === 'function') {
      try { return 'curve(' + (Math.round(b(server, player) * 100) / 100) + ')' }
      catch (e) { return 'curve(?)' }
    }
    return (typeof b === 'number') ? b : NEUTRAL
  }

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
        // ⚠️ A base may be a FUNCTION now (Wall's are). Printing one gives
        // "[object Function]" in /path coefficients, so a curve reports itself as
        // a curve and the `value` beside it is the number actually in force.
        base: baseOf(key, a, server, player),
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
    // ⚠️ READ FROM CONSUMED, never hardcoded. This line listed all four axes as a
    // string literal, so flipping the flag changed /path coefficients and left the
    // boot log still claiming spawns was live - the report and the truth drifting
    // apart in the one file whose job is stopping exactly that.
    var liveAx = [], deadAx = []
    for (var ai = 0; ai < AXES.length; ai++) {
      (CONSUMED[AXES[ai]] ? liveAx : deadAx).push(AXES[ai])
    }
    console.info(TAG + 'LIVE axes: ' + (liveAx.join(', ') || 'NONE') +
      (deadAx.length ? ' | INERT: ' + deadAx.join(', ') : '') + '. ' +
      'spawns is TWO regimes (23 §7b): below 1 suppresses natural spawns via ' +
      'checkSpawn, above 1 sends waves via spawner.js - because a multiplier on ' +
      'zero is zero, and In Control denies naturals above y=40.')
  })
})();
