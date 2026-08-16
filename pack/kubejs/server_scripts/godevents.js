// godevents.js - THE EVENT FRAMEWORK, for every god.  docs/23 PART VI, docs/40
//
// Ethan, 2026-08-15: "the base patron behaviors will extend to everyone" - and
// "events are something that need to be planned out individually per event rather
// than assuming. Each patron's events are a whole project on their own."
//
// Both are true at once, and this file is the seam between them: the CADENCE, the
// guards and the bookkeeping are shared, and the EVENT ITSELF is per-god and
// bespoke. Nothing here knows what an event does; it only decides whether one may
// happen, and to whom.
//
// ── WHAT AN EVENT REGISTERS ──────────────────────────────────────────────────
//   id        unique per god
//   tiers     which trust tiers it may fire at - ['low','medium','high']
//   hostile   true if it sends danger. Hostile events obey the HEALTH FLOOR.
//   cooldown  world days before this same event may repeat
//   weight    relative likelihood among the eligible
//   guard(server, player) -> bool, optional. A condition only this event cares
//             about - Icarus only exists above y100. Kept per-event rather than in
//             the framework, because the framework must not learn what altitude
//             means to a god of falling.
//   run(server, player, tier)  -> true if it actually happened
//
// ── THE HEALTH FLOOR ─────────────────────────────────────────────────────────
// docs/40 §2.1. "The Warrior never targets a wounded champion" - hostile events
// only fire at >=75% hearts AND hunger. Written HERE rather than in Blade's file
// because it is a per-god setting other gods will want inverted: Salvage opens
// exactly when you are dying, and that is the same dial at the other end.
//
// ── EVERY GUARD IS A FAILURE THIS PROJECT ALREADY HAD ────────────────────────
//   · ONE AT A TIME, globally. Two events on one champion is a bug report.
//   · never over a ritual scene.
//   · a run() that returns false does NOT stamp the cooldown - a failed event must
//     not consume its own slot, or it silently never happens again.
//   · no world clock, no events. A cooldown that cannot be measured is not a
//     cooldown, and stamps from the future are re-anchored rather than clamped
//     (admins run /time set; measured 2026-08-15).
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[events] '
  var GATE = true

  var TICK = 600                    // 30s between rolls
  var CHANCE = 0.08                 // per roll, per eligible champion
  var GLOBAL_COOLDOWN = 1           // world days between ANY two events for one player
  var K_LAST = 'veldora_ev_'        // + god + '_' + id -> world day, offset by one
  var K_ANY = 'veldora_ev_any_'     // + god -> world day of the last event of any kind

  // Per-god health rules. `floor` = fraction of hearts AND hunger required for a
  // HOSTILE event. Salvage's is inverted and lives with her own trigger already;
  // this table is for gods whose events run through this framework.
  var HEALTH = {
    blade: { floor: 0.75 },
  }

  var REG = {}                      // god -> [event, ...]
  var busy = false

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  function stamp(p, key, today) {
    try { p.persistentData.putInt(key, today + 1) } catch (e) { }
  }

  // Returns days since, or null for never. Re-anchors a future stamp rather than
  // clamping it - clamping freezes the cooldown forever when the clock moves back.
  function daysSince(p, key, today) {
    var v = 0
    try { v = p.persistentData.getInt(key) } catch (e) { return null }
    if (!v) return null
    var last = v - 1
    if (last > today) {
      console.warn(TAG + 'stamp ' + last + ' > today ' + today + ' - clock moved, re-anchoring')
      stamp(p, key, today)
      return 0
    }
    return today - last
  }

  function register(god, ev) {
    if (!god || !ev || !ev.id || typeof ev.run !== 'function') {
      console.error(TAG + 'refusing to register a malformed event for ' + god)
      return false
    }
    if (!REG[god]) REG[god] = []
    REG[god].push({
      id: ev.id,
      tiers: ev.tiers || ['low', 'medium', 'high'],
      hostile: !!ev.hostile,
      cooldown: (typeof ev.cooldown === 'number') ? ev.cooldown : 2,
      weight: (typeof ev.weight === 'number') ? ev.weight : 1,
      guard: (typeof ev.guard === 'function') ? ev.guard : null,
      // ⭐ ADMIN TRANSPARENCY (Ethan, 2026-08-15). One plain-English sentence saying
      // what this event DOES TO THE PLAYER. The log used to say only
      // "Rehykt <- blade/hollow", which names the event and hides the effect - so
      // reading the log could not tell you whether a player's drops vanishing was
      // the game working or the game broken.
      does: (typeof ev.does === 'string' && ev.does) ? ev.does : null,
      run: ev.run,
    })
    return true
  }

  // Fraction of max, for hearts and for hunger. null if unreadable - and unreadable
  // must never read as "healthy enough", or the floor silently stops guarding.
  function healthFrac(p) {
    try {
      var max = p.getAttribute('minecraft:generic.max_health').getValue()
      if (!max || !isFinite(max) || max <= 0) return null
      return p.health / max
    } catch (e) { return null }
  }
  function hungerFrac(p) {
    try {
      var f = p.foodData.foodLevel
      if (typeof f !== 'number' || !isFinite(f)) return null
      return f / 20
    } catch (e) { return null }
  }

  // Is this champion well enough to be sent something hostile?
  function aboveFloor(god, p) {
    var rule = HEALTH[god]
    if (!rule) return true                      // no rule = no floor
    var h = healthFrac(p), f = hungerFrac(p)
    if (h === null || f === null) return false  // unreadable is NOT healthy
    return h >= rule.floor && f >= rule.floor
  }

  function tierOf(god, p) {
    // Each god owns its own tier logic; blade publishes VELDORA.blade.tier.
    try {
      var g = VELDORA[god]
      if (g && typeof g.tier === 'function') return g.tier(p)
    } catch (e) { }
    return 'low'
  }

  function eligible(server, p, god, today) {
    var list = REG[god] || []
    var tier = tierOf(god, p)
    if (!tier) return { tier: null, list: [] }
    var out = []
    var wellEnough = aboveFloor(god, p)
    for (var i = 0; i < list.length; i++) {
      var ev = list[i]
      if (ev.tiers.indexOf(tier) < 0) continue
      if (ev.hostile && !wellEnough) continue   // THE FLOOR
      var since = daysSince(p, K_LAST + god + '_' + ev.id, today)
      if (since !== null && since < ev.cooldown) continue
      if (ev.guard) {
        var ok = false
        try { ok = !!ev.guard(server, p) } catch (e) {
          console.warn(TAG + ev.id + ' guard threw :: ' + e)   // a throwing guard
        }                                                       // is a CLOSED guard
        if (!ok) continue
      }
      out.push(ev)
    }
    return { tier: tier, list: out, wellEnough: wellEnough }
  }

  function weightedPick(list) {
    var total = 0
    for (var i = 0; i < list.length; i++) total += list[i].weight
    if (total <= 0) return null
    var r = Math.random() * total
    for (var j = 0; j < list.length; j++) {
      r -= list[j].weight
      if (r <= 0) return list[j]
    }
    return list[list.length - 1]
  }

  // Fire one. `force` skips the chance roll and the global cooldown, never the
  // floor - a test command that ignores the floor would test the wrong thing.
  function attempt(server, p, force, onlyId) {
    if (!GATE) return null
    if (busy) return null
    var god = ''
    try { if (VELDORA.paths) god = VELDORA.paths.pathOf(p) || '' } catch (e) { }
    if (!god || !REG[god]) return null
    try { if (VELDORA.ritual && VELDORA.ritual.active(p)) return null } catch (e) { }

    var today = dayNow(server)
    if (today === null) {
      console.warn(TAG + 'no world clock - events SUPPRESSED (cannot measure a cooldown)')
      return null
    }
    if (!force) {
      var anySince = daysSince(p, K_ANY + god, today)
      if (anySince !== null && anySince < GLOBAL_COOLDOWN) return null
    }

    var e = eligible(server, p, god, today)
    if (!e.tier || !e.list.length) return null

    var ev = null
    if (onlyId) {
      for (var i = 0; i < e.list.length; i++) if (e.list[i].id === onlyId) ev = e.list[i]
      if (!ev) return null
    } else {
      ev = weightedPick(e.list)
    }
    if (!ev) return null

    busy = true
    var ok = false
    try { ok = ev.run(server, p, e.tier) } catch (err) {
      console.error(TAG + god + '/' + ev.id + ' threw :: ' + err)
    }
    busy = false

    if (!ok) {
      // A failed event must NOT consume its slot, or it silently never runs again.
      console.warn(TAG + god + '/' + ev.id + ' did not happen - NOT stamping cooldown')
      return null
    }
    stamp(p, K_LAST + god + '_' + ev.id, today)
    stamp(p, K_ANY + god, today)
    console.info(TAG + p.username + ' <- ' + god + '/' + ev.id + ' (tier ' + e.tier +
      ') :: ' + (ev.does || 'NO DESCRIPTION - add a `does:` to its register() call'))
    return ev.id
  }

  function sweep(server) {
    try {
      if (!GATE) { schedule(server); return }
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        if (Math.random() > CHANCE) continue
        attempt(server, players[i], false, null)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    schedule(server)
  }

  function schedule(server) { server.scheduleInTicks(TICK, function () { sweep(server) }) }

  VELDORA.events = {
    register: register,
    attempt: attempt,
    aboveFloor: aboveFloor,
    health: HEALTH,
    registry: REG,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    var root = Commands.literal('events').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var god = ''
      try { if (VELDORA.paths) god = VELDORA.paths.pathOf(p) || '' } catch (e) { }
      var today = dayNow(srv)
      p.tell(Text.of('§8§m                                        '))
      if (!god) { p.tell(Text.of('§7You walk no path. Nobody sends you anything.')); return 1 }
      if (today === null) { p.tell(Text.of('§cno world clock - events are SUPPRESSED')); return 1 }

      var e = eligible(srv, p, god, today)
      p.tell(Text.of('§6' + god + ' §8- tier §f' + (e.tier || '?') +
        '§8, health floor ' + (e.wellEnough ? '§aPASS' : '§cHOLD')))
      var all = REG[god] || []
      for (var i = 0; i < all.length; i++) {
        var ev = all[i]
        var since = daysSince(p, K_LAST + god + '_' + ev.id, today)
        var why = ''
        if (ev.tiers.indexOf(e.tier) < 0) why = 'wrong tier'
        else if (ev.hostile && !e.wellEnough) why = 'below the health floor'
        else if (since !== null && since < ev.cooldown) why = 'cooldown ' + since + '/' + ev.cooldown + 'd'
        else if (ev.guard) {
          var g = false
          try { g = !!ev.guard(srv, p) } catch (e) { }
          if (!g) why = 'its own condition is not met'
        }
        p.tell(Text.of((why ? '§8  --   ' : '§a  OK   ') + '§f' + ev.id +
          (ev.hostile ? ' §8(hostile)' : '') + (why ? ' §8' + why : '')))
      }
      return 1
    })

    root = root.then(Commands.literal('fire')
      .then(Commands.argument('id', event.arguments.STRING.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var id = ctx.getArgument('id', Java.loadClass('java.lang.String'))
          var r = attempt(ctx.source.server, p, true, id)
          p.tell(Text.of(r ? '§7fired ' + r : '§cdid not fire - see /events'))
          return 1
        })))
    event.register(root)
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'event framework GATED OFF'); return }
    schedule(event.server)
    var n = 0, gods = 0
    for (var g in REG) { if (REG.hasOwnProperty(g)) { gods++; n += REG[g].length } }
    console.info(TAG + 'framework LIVE - ' + n + ' event(s) across ' + gods +
      ' god(s), ' + Math.round(CHANCE * 100) + '% per ' + TICK + 't, one at a time')
    if (!n) console.warn(TAG + 'no events registered - nothing will ever fire')

    // ⭐ THE ROSTER, IN PLAIN ENGLISH. Printed at every boot so an admin reading the
    // log knows what each event actually does to a player WITHOUT opening the source
    // - and so an event that was registered without a description is visible now
    // rather than the first time it fires on someone.
    var missing = []
    for (var gg in REG) {
      if (!REG.hasOwnProperty(gg)) continue
      for (var i = 0; i < REG[gg].length; i++) {
        var ev = REG[gg][i]
        if (!ev.does) { missing.push(gg + '/' + ev.id); continue }
        console.info(TAG + '  ' + gg + '/' + ev.id +
          ' [' + (ev.hostile ? 'hostile' : 'safe') + ', cd ' + ev.cooldown +
          'd, w' + ev.weight + ', ' + ev.tiers.join('/') + '] :: ' + ev.does)
      }
    }
    if (missing.length) {
      console.warn(TAG + 'NO DESCRIPTION on: ' + missing.join(', ') +
        ' - add a `does:` so the log says what they do')
    }
  })
})();
