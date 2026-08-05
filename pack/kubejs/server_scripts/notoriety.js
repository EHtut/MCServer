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
  var RATES = [1.0, 1.5, 2.0, 2.5, 3.0]   // by harvestCount; it comes back sooner each time
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
    var rate = rateFor(hc)
    var since = day - last
    if (since < 0) since = 0                       // clock ran backwards; do not go negative
    var floor = Math.floor(since * rate)
    var xp = xpLevelOf(player)
    if (xp === null && !xpWarned) {
      xpWarned = true
      console.error('[notoriety] !! CANNOT READ XP LEVEL for ' + player.username + '.')
      console.error('[notoriety] !! Notoriety is running on the day-floor ALONE. Power,')
      console.error('[notoriety] !! drops and phases are all wrong. That is a BUG.')
    }
    var value = Math.max(xp === null ? 0 : xp, floor)
    return {
      value: value > CAP ? CAP : value,
      raw: value,
      xp: xp,                                      // null = unreadable
      floor: floor,
      since: since,
      rate: rate,
      day: day,
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
      '; rates by harvest count = [' + RATES.join(', ') + ']')
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
      p.tell(Text.of('§8  drop chance would be ' +
        Math.round((0.08 + 0.002 * b.value) * 1000) / 10 + '%  §8(not wired until C2)'))
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
