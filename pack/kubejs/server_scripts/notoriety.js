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
  function dayNow(server) {
    try { return Math.floor(server.overworld().dayTime() / 24000) }
    catch (e) { return 0 }
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
    var fresh = allRecords(server).getCompound(uuid)   // an empty compound
    fresh.putInt('lastHarvestDay', dayNow(server))
    fresh.putInt('harvestCount', 0)
    fresh.putString('name', player.username)
    writeRecord(server, uuid, fresh)
    console.info('[notoriety] anchored ' + player.username + ' at day ' + dayNow(server))
    return recordOf(server, uuid)
  }

  // ------------------------------------------------------------------ the API
  // Returns a breakdown, never a bare number, so callers and the audit can see
  // WHICH term is dominant - and so "could not read XP" never masquerades as 0.
  function breakdown(server, player) {
    var rec = ensure(server, player)
    var day = dayNow(server)
    var last = rec.getInt('lastHarvestDay')
    var hc = rec.getInt('harvestCount')
    var rate = rateFor(hc)
    var since = day - last
    if (since < 0) since = 0                       // clock ran backwards; do not go negative
    var floor = Math.floor(since * rate)
    var xp = xpLevelOf(player)
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
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands

    event.register(Commands.literal('notoriety').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) { ctx.source.sendSystemMessage(Text.of('[notoriety] run this as a player')); return 0 }
      var b = breakdown(ctx.source.server, p)

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
    event.register(Commands.literal('notoriety_setday')
      .then(Commands.argument('day', event.arguments.INTEGER.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          var uuid = String(p.uuid)
          var rec = ensure(ctx.source.server, p)
          rec.putInt('lastHarvestDay', ctx.getArgument('day', Java.loadClass('java.lang.Integer')))
          writeRecord(ctx.source.server, uuid, rec)
          p.tell(Text.of('[notoriety] lastHarvestDay set - run /notoriety'))
          return 1
        })))

    event.register(Commands.literal('notoriety_harvests')
      .then(Commands.argument('n', event.arguments.INTEGER.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          var uuid = String(p.uuid)
          var rec = ensure(ctx.source.server, p)
          rec.putInt('harvestCount', ctx.getArgument('n', Java.loadClass('java.lang.Integer')))
          writeRecord(ctx.source.server, uuid, rec)
          p.tell(Text.of('[notoriety] harvestCount set - run /notoriety'))
          return 1
        })))
  })
})()
