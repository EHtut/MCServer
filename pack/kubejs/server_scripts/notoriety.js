// Shared namespace for the Stalker build. Declared OUTSIDE the IIFE so sibling
// server scripts can see it; `global` is rejected by KubeJS in server scripts.
// The trailing semicolon is load-bearing: without it, ASI does NOT insert one
// before the `(` of the IIFE below, so this line parses as `{}(function(){...})`
// and dies with "{} is not a function".
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

// notoriety.js — C1 of the Stalker build.  docs/19-STALKER-BUILD.md
//
//   notoriety = max( current XP level , daysSinceLastHarvest × rate )
//
// The number the stalker feeds on. Nothing hunts anyone yet; this chunk only
// establishes the value, persists what it needs, and shows it.
//
// DESIGN NOTE — the floor is DERIVED, not accumulated.
// The plan described a daily tick that adds to a stored floor. It does not need
// one: (currentDay − lastHarvestDay) × rate is a pure function of the world clock
// and one stored integer. Deriving it removes an entire class of bug — missed
// ticks, double ticks, drift across restarts, and the "what happens to the timer
// while the server is down" question all stop existing. Only lastHarvestDay is
// stored, and only the Harvest writes it.
//
// Consequence worth knowing: the clock is the WORLD's, so days that pass while
// you are offline still count. On this server the world clock only advances when
// somebody is playing (idle_stop), so in practice the floor tracks "days the
// server ran". That reads as intended — the world moved on, and it got hungrier.
//
// C0 findings applied here:
//  · reading a zero-arg Java accessor as a property returns the METHOD, so every
//    XP-level candidate is typeof-checked rather than trusted
//  · state lives on server.persistentData keyed by UUID (build plan rule 5)
(function () {
  var ROOT = 'veldora_notoriety'
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴🔴 THE HARVEST CUT TURNED THIS CURVE INTO A ONE-WAY RATCHET. Fixed 2026-08-24.
  //
  // ⚠️ AND THE COMMENT THAT STOOD HERE FOR HALF A DAY SAID THE EXACT OPPOSITE. It
  // claimed harvestCount "can no longer increment" and that the curve was DEAD, and a
  // boot banner announced "PINNED AT 1" to match. Both were wrong, and wrong in the
  // most embarrassing direction available: I asserted a value was frozen without
  // checking who writes it.
  //
  // 🔑 WHAT IS ACTUALLY TRUE. recordHarvest lives in THIS file, not harvest.js, so
  // the gate never touched it - and fall.js still calls it on every fall:
  //
  //       var next = won ? 0 : hc + 1
  //
  // Only harvest.js ever passed won=true. So WINS - the sole thing that reset the
  // counter - are gone, LOSSES still fire, and the count now only ever climbs. Four
  // falls pin a player at RATES[4] = 3.0 forever, with no way back down.
  //
  // 🚨 That is strictly worse than the frozen curve I invented. Frozen would have made
  // the game slower; a ratchet makes a player who has struggled accrue THREE TIMES
  // faster than a player who has not, permanently - and it compounds with the banding
  // bug (phase.js multiplies the phase coefficient BEFORE banding, so raw n=57 bands
  // as 114 for blade x2 and 171 for art x3 against a threshold of 100). A fallen Art
  // walker would hit the top band almost immediately.
  //
  // ⭐ THE FIX IS FORGIVENESS, AND IT COSTS NO NEW STATE. `lastHarvestDay` is already
  // written on every record and `since` is already computed in breakdown(), so the
  // effective count is DERIVED at read time - no sweep, no extra writes, nothing to
  // drift. See effectiveHarvestCount() below.
  //
  // ⚠️ FORGIVE_DAYS IS MINE, NOT ETHAN'S — one constant to tune. 12 in-game days per
  // step means a single fall's penalty is gone in under a fortnight while serial
  // falling still compounds faster than it forgives, which is the behaviour the
  // original design wanted from a Harvest loss.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 THE SIGN IS FLIPPED. Ethan ruled B, 2026-08-24 (docs/63 §4).
  //
  // This curve used to ASCEND - [1.0, 1.5, 2.0, 2.5, 3.0] - because "it comes back
  // sooner each time" was a THREAT: the thing coming back was a Harvest that could
  // cost you your path.
  //
  // 🚨 The Trial reframe inverted that overnight. Losing a Trial is FREE (docs/63
  // ruling 3: notoriety resets either way, trust simply does not move), so a sooner
  // Trial is a sooner free chance at +1 rank. Under the old numbers:
  //
  //       fall repeatedly -> rate 3.0 -> Trials 3x as often -> level 3x faster
  //
  // Falling was the optimal strategy. No amount of tuning fixes a wrong sign.
  //
  // ⭐ DESCENDING NOW, and the machinery below needed NO other change. Index 0 is
  // still "clean", forgiveness still walks you toward index 0, effectiveHarvestCount
  // is untouched - only what the numbers MEAN flipped. Four falls make the next Trial
  // take 3.3x longer, and 12 in-game days of not falling forgives one step of that.
  //
  // ⚠️ The stored key is still `harvestCount` so existing saves keep working. It has
  // always counted FALLS - fall.js is the only thing that writes it now.
  var RATES = [1.0, 0.75, 0.55, 0.4, 0.3]   // by EFFECTIVE fall count. LOWER = slower.
  var FORGIVE_DAYS = 12                     // in-game days to forgive one step

  // ⭐ THE RANK. docs/63: trust replaces notoriety as the thing that buys buffs and
  // drops. Stored per PATH (`trust_blade`, `trust_wall`, ...) so switching paths does
  // not spend a rank you earned somewhere else, and re-claiming a path you fell from
  // returns you to where you were.
  var TRUST_MAX = 5
  var TRUST_KEY = 'trust_'
  var CAP = 100

  // ---------------------------------------------------------------- helpers
  // null, never 0. Returning 0 on failure anchored a first-seen player at day 0,
  // so the moment the clock read correctly their floor was the entire age of the
  // world and they were harvested on arrival - the exact bug the anchor exists to
  // prevent. It also silently skipped the 30-day absence after a Harvest.
  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    if (!dayWarned) {
      dayWarned = true
      console.error('[notoriety] !! CANNOT READ THE WORLD CLOCK. Anchoring and the')
      console.error('[notoriety] !! 30-day absence are both suspended until it reads.')
    }
    return null
  }
  var dayWarned = false

  // the raw tick count, not the day - the Companion rolls once per in-game HOUR
  function rawDayTime(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return d
    } catch (e) { }
    return null
  }

  // ⭐ DERIVED, NEVER STORED. A stored decay would need a sweep, and a sweep that
  // misses a tick silently leaves a player on the wrong rate forever - the exact
  // class of drift this file's own comments warn about. This reads two numbers that
  // already exist and computes the answer every time it is asked.
  //
  // `since` is days since the last fall. It is ALSO what the day-floor is built from,
  // which makes the two halves cohere: right after a fall the patron is impatient
  // (full escalated rate, floor starting from zero), and as the days pass the floor
  // climbs while the impatience cools.
  function effectiveHarvestCount(stored, since) {
    if (typeof stored !== 'number' || !isFinite(stored) || stored <= 0) return 0
    if (typeof since !== 'number' || !isFinite(since) || since <= 0) return stored
    var forgiven = stored - Math.floor(since / FORGIVE_DAYS)
    return forgiven < 0 ? 0 : forgiven
  }

  function rateFor(harvestCount) {
    var i = harvestCount < 0 ? 0 : (harvestCount >= RATES.length ? RATES.length - 1 : harvestCount)
    return RATES[i]
  }

  // C0: a property read can hand back the method object instead of the value,
  // so accept a candidate only once it is genuinely a number.
  function xpLevelOf(p) {
    var cands = [
      function () { return p.xpLevel },
      function () { return p.experienceLevel },
      function () { return p.getXpLevel() },
      function () { return p.experienceLevel() },
    ]
    for (var i = 0; i < cands.length; i++) {
      try {
        var v = cands[i]()
        if (typeof v === 'number' && isFinite(v)) return v
      } catch (e) { }
    }
    return null   // null means "could not read", NOT "zero" - the caller decides
  }

  function allRecords(server) { return server.persistentData.getCompound(ROOT) }

  function recordOf(server, uuid) {
    var all = allRecords(server)
    return all.contains(uuid) ? all.getCompound(uuid) : null
  }

  function writeRecord(server, uuid, rec) {
    var all = allRecords(server)
    all.put(uuid, rec)
    server.persistentData.put(ROOT, all)
  }

  // First sight of a player must anchor lastHarvestDay to TODAY. Without this a
  // newcomer joining on day 500 would read a floor of 500 and be harvested on
  // arrival.
  function ensure(server, player) {
    var uuid = String(player.uuid)
    var rec = recordOf(server, uuid)
    if (rec) return rec
    var today = dayNow(server)
    if (today === null) return null                   // refuse to anchor blind
    var fresh = allRecords(server).getCompound(uuid)   // an empty compound
    fresh.putInt('lastHarvestDay', today)
    fresh.putInt('harvestCount', 0)
    fresh.putString('name', player.username)
    writeRecord(server, uuid, fresh)
    console.info('[notoriety] anchored ' + player.username + ' at day ' + today)
    return recordOf(server, uuid)
  }

  // ------------------------------------------------------------------ the API
  // Returns a breakdown, never a bare number, so callers and the audit can see
  // WHICH term is dominant - and so "could not read XP" never masquerades as 0.
  var xpWarned = false
  function breakdown(server, player) {
    var rec = ensure(server, player)
    if (!rec) return null                            // no clock, no anchor, no answer
    var day = dayNow(server)
    if (day === null) return null
    var last = rec.getInt('lastHarvestDay')
    var hc = rec.getInt('harvestCount')
    var since = day - last
    // ⭐ THE OFFSET, docs/63 §3. Ethan ruled that notoriety "resets to 0" on a Trial,
    // but notoriety is DERIVED - there is no number to zero. Zeroing it directly would
    // mean wiping the player's XP level, and 🚨 that is taking something from the
    // player, against his own standing rule.
    //
    // 🔑 So both terms are RELATIVE now. `xpAtLastTrial` is the level they stood at
    // when their last Trial resolved; resetting is re-anchoring, and it costs nothing.
    // The player keeps every level they earned - notoriety just starts counting again
    // from where they are standing.
    //
    // And it makes the number honest: notoriety always claimed to be "how far you have
    // come" while actually meaning "how far since you first logged in".
    var xpBase = rec.getInt('xpAtLastTrial')
    if (since < 0) since = 0                       // clock ran backwards; do not go negative
    // 🚨 ORDER MATTERS AND IT WAS WRONG THE OTHER WAY. `since` is now computed BEFORE
    // the rate, because the rate depends on it. Reading the rate first - as this did
    // - would have applied zero forgiveness on every single call.
    var rate = rateFor(effectiveHarvestCount(hc, since))
    var floor = Math.floor(since * rate)
    var xp = xpLevelOf(player)
    if (xp === null && !xpWarned) {
      xpWarned = true
      console.error('[notoriety] !! CANNOT READ XP LEVEL for ' + player.username + '.')
      console.error('[notoriety] !! Notoriety is running on the day-floor ALONE. Power,')
      console.error('[notoriety] !! drops and phases are all wrong. That is a BUG.')
    }
    var earned = (xp === null) ? 0 : (xp - xpBase)
    if (earned < 0) earned = 0        // they lost levels since the anchor; not negative
    var value = Math.max(earned, floor)
    return {
      value: value > CAP ? CAP : value,
      raw: value,
      xp: xp,                                      // null = unreadable
      floor: floor,
      since: since,
      rate: rate,
      day: day,
      dayTime: rawDayTime(server),                 // for the Companion's hourly roll
      lastHarvestDay: last,
      harvestCount: hc,
      dominant: (xp !== null && xp > floor) ? 'xp' : 'floor',
    }
  }

  // Display only. C6 owns the real phase machine, with hysteresis; this label is
  // derived fresh every call and stores nothing.
  function phaseLabel(n) {
    if (n >= 100) return 'THE HARVEST'
    if (n >= 75) return 'THE ABSENCE'
    if (n >= 25) return 'THE COMPANION'
    return 'THE HELPER'
  }

  // ------------------------------------------------------------- expose to C2/C3
  // `global` is REJECTED in server scripts ("'global' cannot be assigned to in
  // client or server scripts") - it took the whole file down on first load. So
  // publish onto the shared top-level namespace declared above, and VERIFY it is
  // visible from another file rather than assuming it. A later chunk that
  // silently read `undefined` here would compute every drop off notoriety 0 and
  // look completely healthy doing it.
  VELDORA.notoriety = function (server, player) { return breakdown(server, player) }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ TRUST — the rank. docs/63.
  //
  // Per PATH, because a rank is a relationship with one god. Reading a path this file
  // does not know about returns 0 rather than throwing: an unclaimed player has no
  // rank with anybody, which is true rather than an error.
  // ═══════════════════════════════════════════════════════════════════════════
  function pathOf(player) {
    try { return (VELDORA.paths && VELDORA.paths.pathOf(player)) || '' } catch (e) { return '' }
  }

  VELDORA.trust = function (server, player, god) {
    var key = god || pathOf(player)
    if (!key) return 0
    var rec = ensure(server, player)
    if (!rec) return 0
    var t = rec.getInt(TRUST_KEY + key)
    if (!(t > 0)) return 0
    return t > TRUST_MAX ? TRUST_MAX : t
  }

  VELDORA.trustMax = function () { return TRUST_MAX }

  // 🔑 SCALE, 0..1. This is what power.js and the drop curve consume, so neither has
  // to know how many ranks there are or where they are stored.
  VELDORA.trustScale = function (server, player, god) {
    return VELDORA.trust(server, player, god) / TRUST_MAX
  }

  VELDORA.awardTrust = function (server, player, n, why) {
    var key = pathOf(player)
    if (!key) {
      console.warn('[notoriety] awardTrust with no path for ' +
        (player.username || '?') + ' - nothing to rank. Not an error, but not a rank.')
      return null
    }
    var rec = ensure(server, player)
    if (!rec) return null
    var cur = rec.getInt(TRUST_KEY + key)
    if (!(cur > 0)) cur = 0
    var next = cur + (typeof n === 'number' ? n : 1)
    if (next < 0) next = 0
    if (next > TRUST_MAX) next = TRUST_MAX
    rec.putInt(TRUST_KEY + key, next)
    writeRecord(server, String(player.uuid), rec)
    console.info('[notoriety] TRUST ' + player.username + ' ' + key + ' ' +
      cur + ' -> ' + next + '/' + TRUST_MAX + ' (' + (why || 'unspecified') + ')')
    return next
  }

  // ⭐ RE-ANCHOR. This is Ethan's "notoriety resets to 0", and it is the ONLY way it
  // happens. Both terms move together or the reset is half-done: the day anchor stops
  // the floor, the xp anchor stops the level term. Missing either leaves a player who
  // re-triggers a Trial instantly.
  VELDORA.resetTrialClock = function (server, player, why) {
    var rec = ensure(server, player)
    if (!rec) return false
    var day = dayNow(server)
    if (day === null) {
      console.error('[notoriety] !! TRIAL CLOCK NOT RESET for ' + player.username +
        ' - world clock unreadable. They will re-trigger immediately.')
      return false
    }
    var xp = xpLevelOf(player)
    rec.putInt('lastHarvestDay', day)
    rec.putInt('xpAtLastTrial', xp === null ? 0 : xp)
    writeRecord(server, String(player.uuid), rec)
    console.info('[notoriety] trial clock reset for ' + player.username +
      ' - day ' + day + ', xp anchor ' + (xp === null ? '?' : xp) +
      ' (' + (why || 'unspecified') + ')')
    return true
  }
  VELDORA.phaseLabel = phaseLabel

  // C7 writes here, and ONLY C7. lastHarvestDay is the anchor the whole floor is
  // derived from, so a stray write anywhere else would silently reset every
  // player's clock. The rate resets on a win and escalates on a loss - it has
  // tasted you, so it comes back sooner.
  VELDORA.recordHarvest = function (server, player, won) {
    var uuid = String(player.uuid)
    var rec = ensure(server, player)
    if (!rec) {
      console.error('[stalker] !! recordHarvest could not anchor ' + player.username +
        ' - the cycle did NOT advance and the absence was NOT set')
      return null
    }
    var hc = rec.getInt('harvestCount')
    var next = won ? 0 : hc + 1
    var day = dayNow(server)
    // dayNow returns NULL on failure, and Rhino coerces null to 0 for an int
    // parameter - writing lastHarvestDay = 0 and handing this player a floor
    // equal to the entire age of the world. That is exactly the bug dayNow's own
    // comment describes, reintroduced at the ONE site that writes the anchor.
    // ensure() guards it; this did not.
    if (day === null) {
      console.error('[notoriety] !! HARVEST NOT RECORDED for ' + player.username +
        ' - world clock unreadable. Cycle did not advance, absence not set.')
      return null
    }
    rec.putInt('lastHarvestDay', day)
    rec.putInt('harvestCount', next)
    writeRecord(server, uuid, rec)
    console.info('[notoriety] HARVEST ' + (won ? 'WON' : 'LOST') + ' by ' + player.username +
      ' - day ' + day + ', harvestCount ' + hc + ' -> ' + next +
      ', next rate ' + rateFor(next) + '/day')
    return { day: day, harvestCount: next, rate: rateFor(next) }
  }

  ServerEvents.loaded(function (event) {
    var ok = (typeof VELDORA.notoriety === 'function')
    console.info('[notoriety] C1 active - ' + (ok
      ? 'VELDORA.notoriety published OK'
      : '!! PUBLISH FAILED - C2/C3 must not be built until this is fixed'))
    console.info('[notoriety] world day is ' + dayNow(event.server) +
      '; TRUST is the rank (0-' + TRUST_MAX + ', per path) and it buys the buffs. ' +
      'Notoriety is the countdown to the next Trial and buys nothing - measured ' +
      'since the LAST Trial, not since first login. Fall rates ' +
      RATES.join('/') + ' (docs/63 ruling B: falling makes the next Trial arrive ' +
      'LATER), forgiving one step per ' + FORGIVE_DAYS + ' in-game days.')
  })

  PlayerEvents.loggedIn(function (event) { ensure(event.server, event.player) })

  // ------------------------------------------------------------------ command
  // ADMIN GATE. Everything that can mint items, force a boss, or opt a player out
  // of the hunt is level 2. It FAILS CLOSED - if hasPermission ever throws, the
  // answer is no. On a four-player server with a brother, /stalker harvest was
  // three diamonds a go on repeat and /notoriety_setday was a permanent opt-out
  // of the one thing the design says you cannot opt out of.
  function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands

    event.register(Commands.literal('notoriety').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) { ctx.source.sendSystemMessage(Text.of('[notoriety] run this as a player')); return 0 }
      var b = breakdown(ctx.source.server, p)
      if (!b) { p.tell(Text.of('§cnotoriety unavailable - see the server log. This is a bug.')); return 0 }

      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7Notoriety  §f§l' + b.value + (b.raw > CAP ? ' §8(capped from ' + b.raw + ')' : '')))
      p.tell(Text.of('§8  ' + phaseLabel(b.value)))
      p.tell(Text.of('§7  XP level    §f' + (b.xp === null ? '§cUNREADABLE' : b.xp) +
        (b.dominant === 'xp' ? '  §a<- dominant' : '')))
      p.tell(Text.of('§7  floor       §f' + b.floor + ' §8(' + b.since + ' days x ' + b.rate + ')' +
        (b.dominant === 'floor' ? '  §a<- dominant' : '')))
      p.tell(Text.of('§7  world day   §f' + b.day + ' §8(last harvest: day ' + b.lastHarvestDay + ')'))
      p.tell(Text.of('§7  harvests    §f' + b.harvestCount + ' §8(next rate ' + b.rate + '/day)'))
      p.tell(Text.of('§8  your kills pay ' +
        Math.round((0.08 + 0.002 * b.value) * 1000) / 10 + '%'))
      return 1
    }))

    // audit helpers - C1 only, removed when the chunk is signed off
    event.register(Commands.literal('notoriety_setday').requires(ADMIN)
      .then(Commands.argument('day', event.arguments.INTEGER.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          // From the console there IS no player, and reaching for p.uuid threw
          // "An unexpected error occurred" rather than saying so.
          if (!p) { ctx.source.sendSystemMessage(Text.of('[notoriety] run this as a player')); return 0 }
          var uuid = String(p.uuid)
          var rec = ensure(ctx.source.server, p)
          if (!rec) { p.tell(Text.of('§cno world clock - cannot anchor. See the log.')); return 0 }
          rec.putInt('lastHarvestDay', ctx.getArgument('day', Java.loadClass('java.lang.Integer')))
          writeRecord(ctx.source.server, uuid, rec)
          p.tell(Text.of('[notoriety] lastHarvestDay set - run /notoriety'))
          return 1
        })))

    event.register(Commands.literal('notoriety_harvests').requires(ADMIN)
      .then(Commands.argument('n', event.arguments.INTEGER.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          // From the console there IS no player, and reaching for p.uuid threw
          // "An unexpected error occurred" rather than saying so.
          if (!p) { ctx.source.sendSystemMessage(Text.of('[notoriety] run this as a player')); return 0 }
          var uuid = String(p.uuid)
          var rec = ensure(ctx.source.server, p)
          if (!rec) { p.tell(Text.of('§cno world clock - cannot anchor. See the log.')); return 0 }
          rec.putInt('harvestCount', ctx.getArgument('n', Java.loadClass('java.lang.Integer')))
          writeRecord(ctx.source.server, uuid, rec)
          p.tell(Text.of('[notoriety] harvestCount set - run /notoriety'))
          return 1
        })))
  })
})()
