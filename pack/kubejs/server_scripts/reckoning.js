// reckoning.js - THE RECKONING ENGINE.  docs/23 PART V.9
//
// The general form of E7. One engine, five faces: the counter is a lifetime tally
// of your path's verb, and the engine watches THE RATE IT MOVES AT rather than the
// number, firing that patron's characteristic collection when you go quiet.
//
//   delivered = counter − counterAtLastReckoning
//   expected  = demandRate × daysSince(lastReckoning)
//   shortfall = expected − delivered          ← the pressure
//
// That is Forge's "quota that grows" generalised. His written mechanic turned out
// to be the engine every patron needed; he is just the one honest enough to call it
// a quota, and his "Compound Interest - every missed quota raises the next by 50%"
// is the escalator for the same reason.
//
// ── TWO MODES, AND SALVAGE IS THE INVERSION ──────────────────────────────────
//   NEGLECT   pressure = shortfall     blade · forge · wall · art   you stopped
//   APPETITE  pressure = delivered     salvage                      you took too much
//
// Salvage is not an exception bolted on, it is the character. Every other patron
// reckons because you went quiet; she reckons because you kept coming back. One
// field expresses the whole difference between "serve me" and "need me".
//
// ── THE GUARDS, EVERY ONE OF WHICH THIS PROJECT HAS ALREADY BEEN BURNED BY ───
//   · zero pressure sends NOTHING - never a default wave (docs/24 §E7)
//   · a GRACE PERIOD: a fresh walker has counter 0 and daysSince 0, which reads
//     naively as maximum neglect. Reckoning someone on their first hour is the
//     bug this guard exists for.
//   · ONE AT A TIME (Ethan). The ritual guard covers overlapping SCENES; a raid
//     and a seizure are not scenes.
//   · ANNOUNCED. `23` §2 - a raid you saw coming is content, unannounced is a bug
//     report. /counters has shown the number the whole time.
//   · NO CLOCK, NO RECKONING. A shortfall measured against an unreadable day is
//     meaningless; suppress and say so.
//   · the baseline resets on firing. Not resetting it re-fires immediately and
//     turns a reckoning into a loop - the failure the design doc names explicitly.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[reckon] '
  var GATE = true

  var TICKS = 400                  // 20s. Reckonings are measured in days.
  var GRACE_DAYS = 2               // no reckoning before the relationship exists
  var COOLDOWN_DAYS = 1            // never twice in a day, whatever the numbers say

  var K_DAY = 'veldora_reck_day_'      // world day of the last reckoning
  var K_BASE = 'veldora_reck_base_'    // counter value it was measured from
  var K_N = 'veldora_reck_n_'          // how many times - drives the escalator

  var ESCALATOR = 0.5              // Forge's +50% per miss, generalised

  // demand  - counter units per in-game day this patron expects
  // trigger - pressure at which they collect
  // live    - false ships the config without the consequence, which is the
  //           honest first state: the ledger keeps counting either way.
  var PATRONS = {
    salvage: { mode: 'appetite', demand: 0, trigger: 6, live: true },
    blade:   { mode: 'neglect',  demand: 25, trigger: 50, live: false },
    forge:   { mode: 'neglect',  demand: 20, trigger: 40, live: false },
    wall:    { mode: 'neglect',  demand: 40, trigger: 80, live: false },
    art:     { mode: 'neglect',  demand: 1,  trigger: 3,  live: false },
  }

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  function getNum(p, key, dflt) {
    try {
      var v = p.persistentData.getInt(key)
      return (typeof v === 'number' && isFinite(v)) ? v : dflt
    } catch (e) { return dflt }
  }

  // ── the measurement ───────────────────────────────────────────────────────
  // Returns {pressure, delivered, expected, days, n} or null if it cannot be
  // measured. null is NOT zero - a counter that cannot be read must never read as
  // "owes nothing", which is the dropChanceFor lesson.
  function assess(server, p, patron) {
    var cfg = PATRONS[patron]
    if (!cfg) return null
    var counter = null
    try { if (VELDORA.counter) counter = VELDORA.counter.get(p, patron) } catch (e) { }
    if (counter === null) return null

    var today = dayNow(server)
    if (today === null) return null

    // 🚨 persistentData.getInt() RETURNS 0 FOR A MISSING KEY, not a sentinel.
    // The first version defaulted to -1 and tested `lastDay < 0`, so the "first
    // sight, anchor rather than judge" branch NEVER RAN: lastDay read 0, and a
    // brand-new walker measured as 82 days neglected on a day-82 world - straight
    // past the grace period the guard exists to provide.
    //
    // So the day is stored OFFSET BY ONE. 0 now unambiguously means never anchored,
    // which is the only thing getInt cannot fake.
    var stored = getNum(p, K_DAY + patron, 0)
    var base = getNum(p, K_BASE + patron, 0)
    var n = getNum(p, K_N + patron, 0)

    // First sight of this walker: anchor rather than judge.
    if (stored === 0) {
      try {
        p.persistentData.putInt(K_DAY + patron, today + 1)
        p.persistentData.putInt(K_BASE + patron, counter)
      } catch (e) { }
      return { pressure: 0, delivered: 0, expected: 0, days: 0, n: 0, fresh: true }
    }
    var lastDay = stored - 1

    // ⚠️ THE WORLD CLOCK CAN GO BACKWARDS. Measured 2026-08-15: `time query day`
    // read 10004 in the morning and 82 in the afternoon, because dayTime is
    // absolute and /time set rewrites it. Every day-stamp in this design assumes
    // the number only rises; a stamp from the future makes `days` negative, which
    // clamps to 0 and silently freezes the ledger forever.
    //
    // Re-anchor instead of clamping, and say so once.
    if (lastDay > today) {
      console.warn(TAG + 'world clock moved BACKWARDS (stamp ' + lastDay +
        ' > today ' + today + ') - re-anchoring ' + patron)
      try {
        p.persistentData.putInt(K_DAY + patron, today + 1)
        p.persistentData.putInt(K_BASE + patron, counter)
      } catch (e) { }
      return { pressure: 0, delivered: 0, expected: 0, days: 0, n: n, fresh: true }
    }

    var days = today - lastDay
    var delivered = Math.max(0, counter - base)
    var demand = cfg.demand * (1 + n * ESCALATOR)
    var expected = demand * days
    var pressure = (cfg.mode === 'appetite') ? delivered : (expected - delivered)
    return {
      pressure: pressure, delivered: delivered, expected: expected,
      days: days, n: n, fresh: false,
    }
  }

  // ── settlement ────────────────────────────────────────────────────────────
  // The BASELINE moves, never the counter. Ethan, 2026-08-15: the tally is a score
  // and should never go down, which keeps /counters meaningful across a world.
  function settle(server, p, patron) {
    var today = dayNow(server)
    var counter = 0
    try { if (VELDORA.counter) { var c = VELDORA.counter.get(p, patron); if (c !== null) counter = c } } catch (e) { }
    try {
      if (today !== null) p.persistentData.putInt(K_DAY + patron, today + 1)
      p.persistentData.putInt(K_BASE + patron, counter)
      p.persistentData.putInt(K_N + patron, getNum(p, K_N + patron, 0) + 1)
    } catch (e) { console.error(TAG + 'could not settle ' + patron + ' :: ' + e) }
  }

  // ── the collections ───────────────────────────────────────────────────────
  // The ONLY per-patron part. Each returns true if it actually happened - a
  // reckoning that could not fire must not settle, or the pressure is forgiven for
  // free and the player never sees why.
  // Ask voice.js what colour this god is - it is the only file that knows.
  function godColour(key) {
    try {
      if (VELDORA.voice && typeof VELDORA.voice.colourOf === 'function') {
        return VELDORA.voice.colourOf(key)
      }
    } catch (e) { }
    return '§4§l'
  }

  function speak(p, s, god) { try { p.tell(Text.of(godColour(god) + s)) } catch (e) { } }

  function fireSalvage(server, p, a) {
    // Interest. Her own pack collects, scaled by what she has been given.
    var n = Math.max(2, Math.min(8, Math.round(a.pressure)))
    if (!VELDORA.spawner) { console.error(TAG + 'no spawner - Interest cannot fire'); return false }
    speak(p, 'You have been such good custom, friend.', 'salvage')
    speak(p, 'I have brought the family.', 'salvage')

    // The count is measured a few ticks later (a summon is not queryable in the
    // tick it is issued), so settlement waits for the callback. A reckoning that
    // placed nothing must NOT settle - the pressure stands and she comes again.
    VELDORA.spawner.wave(p, {
      ids: ['born_in_chaos_v1:dread_hound_not_despawn'],
      count: n,
    }, function (placed, asked) {
      if (placed === 0 && asked > 0) {
        console.error(TAG + '!! Interest asked ' + asked + ' and placed NOTHING - ' +
          'NOT settling, the debt stands')
        return
      }
      settle(server, p, 'salvage')
      console.info(TAG + 'Interest on ' + p.username + ' - asked ' + asked +
        ', placed ' + placed + ' (pressure ' + Math.round(a.pressure) + ') - settled')
    })
    return true
  }

  var FIRE = {
    salvage: fireSalvage,
    // blade/forge/wall/art are configured above and NOT live. They are absent here
    // on purpose: a handler that exists and does nothing is worse than one that is
    // honestly missing, because the boot report can see this.
  }

  // ── the loop ──────────────────────────────────────────────────────────────
  var busy = false                 // ONE AT A TIME, across all patrons and players

  function tick(server) {
    try {
      if (!GATE) { schedule(server); return }
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        if (busy) break
        var p = players[i]
        var patron = ''
        try { if (VELDORA.paths) patron = VELDORA.paths.pathOf(p) || '' } catch (e) { }
        if (!patron) continue                       // never for non-walkers
        var cfg = PATRONS[patron]
        if (!cfg || !cfg.live || !FIRE[patron]) continue

        // Never over a scene.
        try { if (VELDORA.ritual && VELDORA.ritual.active(p)) continue } catch (e) { }

        var a = assess(server, p, patron)
        if (a === null) continue                    // unmeasurable - NOT zero
        if (a.fresh) continue
        if (a.days < GRACE_DAYS) continue           // the relationship is too new
        if (a.days < COOLDOWN_DAYS) continue
        if (a.pressure < cfg.trigger) continue
        if (a.pressure <= 0) continue               // zero sends NOTHING

        busy = true
        var ok = false
        try { ok = FIRE[patron](server, p, a) } catch (e) {
          console.error(TAG + patron + ' reckoning threw :: ' + e)
        }
        // NOTE: a handler that spawns settles itself from its measurement callback,
        // because whether it landed is not known synchronously. `ok` here means only
        // "it was issued". Handlers that need no measurement settle here.
        if (!ok) console.warn(TAG + patron + ' did not fire - NOT settling, pressure stands')
        busy = false
      }
    } catch (e) { console.warn(TAG + 'tick threw :: ' + e); busy = false }
    schedule(server)
  }

  function schedule(server) {
    server.scheduleInTicks(TICKS, function () { tick(server) })
  }

  VELDORA.reckoning = {
    assess: function (server, p, patron) { return assess(server, p, patron) },
    patrons: PATRONS,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // The legibility half. A patron about to collect should be readable as such.
    event.register(Commands.literal('reckoning').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var patron = ''
      try { if (VELDORA.paths) patron = VELDORA.paths.pathOf(p) || '' } catch (e) { }
      p.tell(Text.of('§8§m                                        '))
      if (!patron) { p.tell(Text.of('§7You walk no path. Nobody is counting.')); return 1 }
      var cfg = PATRONS[patron]
      var a = assess(srv, p, patron)
      if (!cfg) { p.tell(Text.of('§c' + patron + ' has no ledger')); return 1 }
      if (a === null) { p.tell(Text.of('§cUNMEASURABLE - that is a bug, not a zero.')); return 1 }
      p.tell(Text.of('§6' + patron + ' §8- ' + cfg.mode +
        (cfg.live ? '' : ' §8(reckoning GATED OFF)')))
      p.tell(Text.of('§7  delivered §f' + a.delivered + '§7 over §f' + a.days + '§7d' +
        (cfg.mode === 'neglect' ? '§8, expected §7' + Math.round(a.expected) : '')))
      var pct = cfg.trigger > 0 ? Math.round(Math.max(0, a.pressure) / cfg.trigger * 100) : 0
      p.tell(Text.of('§7  pressure §f' + Math.round(a.pressure) + '§8/' + cfg.trigger +
        ' §8(' + pct + '%)' + (a.n ? ' §8· reckoned ' + a.n + '× so far' : '')))
      if (a.days < GRACE_DAYS) p.tell(Text.of('§8  within the ' + GRACE_DAYS + 'd grace'))
      return 1
    }))

    // Force one, for testing what cannot be waited for.
    event.register(Commands.literal('reckon_test').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var patron = ''
      try { if (VELDORA.paths) patron = VELDORA.paths.pathOf(p) || '' } catch (e) { }
      if (!patron || !FIRE[patron]) {
        p.tell(Text.of('§cno live reckoning for "' + (patron || 'none') + '"'))
        return 0
      }
      var a = assess(ctx.source.server, p, patron) || { pressure: 6 }
      var ok = FIRE[patron](ctx.source.server, p, a)
      p.tell(Text.of(ok ? '§7fired.' : '§cdid not fire - see the log'))
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'reckoning engine GATED OFF'); return }
    schedule(event.server)
    var live = [], held = []
    for (var k in PATRONS) {
      if (!PATRONS.hasOwnProperty(k)) continue
      if (PATRONS[k].live && FIRE[k]) live.push(k); else held.push(k)
    }
    console.info(TAG + 'engine LIVE - grace ' + GRACE_DAYS + 'd, one at a time, ' +
      'escalator +' + Math.round(ESCALATOR * 100) + '%/reckoning')
    console.info(TAG + 'collecting: ' + (live.join(', ') || 'NOBODY') +
      ' | counting but NOT collecting: ' + held.join(', '))
  })
})();
