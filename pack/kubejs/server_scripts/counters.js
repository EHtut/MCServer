// counters.js - ONE COUNTER PER PATRON.  docs/23 PART V
//
// Ethan, 2026-08-15: "it'd probably work better if we gave a new counter for all of
// these patrons."
//
// Everything used to key off NOTORIETY - one number shared by all six patrons - and
// the design had already noticed the symptom without naming the cause. `23` says
// trading levels away is "the ONLY player-chosen brake in the system", which is true
// only because levels are the single input to notoriety a player controls. That is a
// consequence of one shared counter, not a feature of the design.
//
// So: each patron gets its own. Salvage's DEBT and Forge's QUOTA stop being two
// bolt-on numbers and become the same mechanism wearing two names, each escalating
// on its own terms.
//
// Notoriety does NOT die. It stays the global "how ripe are you" that drives the
// Harvest and the power curve. This is what each character wants FROM you, which is
// how the twelve-events-per-patron in `23` PART VI are already written.
//
// ── TWO RULES THIS FILE EXISTS TO ENFORCE ────────────────────────────────────
// 1. STORED AS A WORLD DAY, NEVER tickCount. Finding K9: tickCount is per-session,
//    so anything stored from it silently resets on restart. fall.js and
//    introductions.js already carry this rule; it is written down once more here
//    because a debt that forgets itself overnight cancels every raid.
//
// 2. "COULD NOT READ" AND "IS ZERO" MUST NEVER SHARE AN ANSWER. This is the
//    dropChanceFor lesson (paths.js), and it bites harder here: a debt that reads
//    an unreadable value as 0 cancels the raid it was supposed to call, and looks
//    perfectly healthy doing it. get() returns null for "could not read".
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[counter] '
  var PREFIX = 'veldora_ctr_'

  // Known patrons. crown is still claimable until the world reset folds it into
  // wall, so it keeps its own counter rather than aliasing - two walkers' debts
  // must never share a number.
  var PATRONS = ['blade', 'salvage', 'forge', 'wall', 'art', 'crown']

  function keyOf(patron) { return PREFIX + String(patron) }
  function dayKeyOf(patron) { return PREFIX + String(patron) + '_day' }

  function dayNow(server) {
    // P6a: overworld is a METHOD, not a property.
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  var warned = false
  function warnOnce(msg) {
    if (warned) return
    warned = true
    console.warn(TAG + 'FALLBACK: ' + msg)
    console.warn(TAG + 'a counter that cannot be read is a BUG, not a zero.')
  }

  // null means COULD NOT READ. 0 means owes nothing. Never conflate them.
  function get(player, patron) {
    if (!player || !patron) return null
    try {
      var v = player.persistentData.getInt(keyOf(patron))
      if (typeof v === 'number' && isFinite(v)) return v
      warnOnce('getInt returned a non-number for ' + patron)
      return null
    } catch (e) {
      warnOnce('could not read ' + keyOf(patron) + ' :: ' + e)
      return null
    }
  }

  // Returns the new value, or null if it could not be written. A caller that
  // charges a price must check this - "the debt rose" and "the write failed"
  // are different outcomes and only one of them should let a trade complete.
  function add(player, patron, n, why) {
    if (!player || !patron) return null
    var cur = get(player, patron)
    if (cur === null) return null
    var next = cur + (typeof n === 'number' && isFinite(n) ? n : 0)
    if (next < 0) next = 0
    try {
      player.persistentData.putInt(keyOf(patron), next)
    } catch (e) {
      warnOnce('could not WRITE ' + keyOf(patron) + ' :: ' + e)
      return null
    }
    // Stamp the world day of the change. Interest (E7) scales the raid by what has
    // accrued SINCE the last one, so it needs a when, not only a how-much.
    var server = null
    try { server = player.server } catch (e) { }
    var d = server ? dayNow(server) : null
    if (d !== null) { try { player.persistentData.putInt(dayKeyOf(patron), d) } catch (e) { } }
    else console.warn(TAG + 'no world clock - ' + patron + ' counter has NO DAY STAMP')

    var name = '?'
    try { name = String(player.username) } catch (e) { }
    console.info(TAG + name + ' ' + patron + ' ' + cur + ' -> ' + next +
      (why ? ' (' + why + ')' : '') + (d !== null ? ' day=' + d : ''))
    return next
  }

  function setTo(player, patron, v) {
    var cur = get(player, patron)
    if (cur === null) return null
    return add(player, patron, (v | 0) - cur, 'set')
  }

  // The world day this counter last moved, or null. Not the same as "days since" -
  // the caller does that subtraction, because only the caller knows what it means.
  function dayOf(player, patron) {
    try {
      var v = player.persistentData.getInt(dayKeyOf(patron))
      return (typeof v === 'number' && isFinite(v)) ? v : null
    } catch (e) { return null }
  }

  function daysSince(player, patron) {
    var then = dayOf(player, patron)
    if (then === null) return null
    var server = null
    try { server = player.server } catch (e) { }
    var now = server ? dayNow(server) : null
    if (now === null) return null
    // ⚠️ A stamp from the future means the world clock moved backwards (admins run
    // /time set; measured 2026-08-15). Clamping to 0 would freeze every dry-spell
    // and neglect check silently forever, so RE-STAMP to today and say so - the
    // ledger loses one interval rather than all of them.
    if (then > now) {
      console.warn(TAG + 'day stamp ' + then + ' > today ' + now +
        ' for ' + patron + ' - clock moved, re-stamping')
      try { player.persistentData.putInt(dayKeyOf(patron), now) } catch (e) { }
      return 0
    }
    return now - then
  }

  VELDORA.counter = {
    get: get, add: add, set: setTo,
    dayOf: dayOf, daysSince: daysSince,
    patrons: PATRONS,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // The legibility law, same as /path coefficients: a number that acts on you is
    // a number you can read.
    var root = Commands.literal('counters').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6What each patron says you owe'))
      var any = false
      for (var i = 0; i < PATRONS.length; i++) {
        var v = get(p, PATRONS[i])
        if (v === null) { p.tell(Text.of('§c  ' + PATRONS[i] + ' §8-> unreadable (bug)')); any = true; continue }
        if (v === 0) continue
        var since = daysSince(p, PATRONS[i])
        p.tell(Text.of('§7  ' + PATRONS[i] + ' §f' + v +
          (since === null ? '' : ' §8(last moved ' + since + 'd ago)')))
        any = true
      }
      if (!any) p.tell(Text.of('§7  nothing. You owe no one - yet.'))
      return 1
    })

    root = root.then(Commands.literal('clear').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      for (var i = 0; i < PATRONS.length; i++) setTo(p, PATRONS[i], 0)
      p.tell(Text.of('§7All counters zeroed.'))
      return 1
    }))

    event.register(root)
  })

  ServerEvents.loaded(function () {
    var ok = VELDORA.counter && typeof VELDORA.counter.add === 'function'
    if (ok) console.info(TAG + 'VELDORA.counter published OK - ' + PATRONS.length +
      ' patrons, world-day stamped')
    else console.error(TAG + 'VELDORA.counter MISSING - every debt will silently not accrue')
  })
})();
