// power.js — C3 of the Stalker build.  docs/19-STALKER-BUILD.md
//
// XP is not only a drop multiplier, it is POWER. As notoriety climbs you get
// harder to kill and hit harder — which is what closes the design's loop: the
// thing fattening you is the same thing making you strong enough to fight it.
// It feeds you until you are worth eating, and by then you can hold a knife.
//
// Deliberately modest. This is not a class system; it is the reason the Harvest
// is survivable at all, and the reason a fat player FEELS fat.
//
// ── C0 findings this chunk is built on ────────────────────────────────────────
//  · attribute ids are minecraft:generic.* in 1.21.1 — the unprefixed form THROWS
//  · removeModifier(...) is UNUSABLE from Rhino: ambiguous overload for String,
//    ResourceLocation and AttributeModifier alike. The only working removal is
//    removeModifiers(), which strips EVERY modifier on that attribute — armour,
//    potions, L2Hostility included.
//  · so we use modifyAttribute(), verified to REPLACE cleanly (24→29, not 24→33)
//    and to be SELECTIVE (a foreign +6 modifier survived our update)
//
// ── Consequence: there is no removal, only a write of zero ───────────────────
// The build plan asked for "modifiers absent at notoriety 0, not present-at-zero".
// That is not achievable here — precise removal does not exist from this runtime,
// and the blunt one would delete other mods' modifiers. So the degenerate case is
// a modifier of amount 0, which is functionally identical and cannot damage
// anything else. The rollback is therefore a WRITE, not a delete: /power_clear
// zeroes all four on the caller, and is written and exposed before the applying
// code below.

// E6 note: this file previously only ever READ the shared namespace defensively
// (`typeof VELDORA !== 'undefined'`) and never declared it. It now PUBLISHES
// VELDORA.powerBoost, so the declaration is required - assigning onto an undefined
// VELDORA throws at load and takes every script in the file down with it.
// The trailing semicolon is LOAD-BEARING (ASI), same as ritual.js and notoriety.js.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var MOD = 'mcserver:veldora_power'
  var CAP = 100
  var EVERY = 100          // ticks between sweeps (5s) — this is not a per-tick hook

  // attribute, bonus at notoriety 100
  var CURVE = [
    ['minecraft:generic.max_health', 6.0],
    ['minecraft:generic.armor', 4.0],
    ['minecraft:generic.attack_damage', 2.0],
    ['minecraft:generic.knockback_resistance', 0.2],
  ]

  var lastApplied = {}     // uuid -> notoriety, so a sweep only writes on CHANGE
  var lastMax = {}         // uuid -> last max health, so a GAIN can be topped up

  // ---------------------------------------------------------------- rollback
  // Written first, on purpose. If anything below misbehaves this is the undo.
  function clearPower(player) {
    var done = []
    for (var i = 0; i < CURVE.length; i++) {
      try {
        player.modifyAttribute(CURVE[i][0], MOD + '_' + i, 0, 'add_value')
        done.push(CURVE[i][0].replace('minecraft:generic.', ''))
      } catch (e) {
        console.warn('[power] clear failed on ' + CURVE[i][0] + ' :: ' + e)
      }
    }
    delete lastApplied[String(player.uuid)]
    delete lastMax[String(player.uuid)]
    return done
  }

  // ----------------------------------------------------------------- applying
  // E3. `mult` is the walker's `power` coefficient - 1.0 for a pathless player and
  // for anything that cannot read it, so this is byte-identical arithmetic to what
  // shipped before coefficients existed. Forge's is 0.4: the merchant stays soft no
  // matter how famous, which is what makes Forge need Blade.
  function bonusesFor(n, mult) {
    var scale = Math.min(n, CAP) / CAP
    var m = (typeof mult === 'number' && isFinite(mult) && mult >= 0) ? mult : 1.0
    var out = []
    for (var i = 0; i < CURVE.length; i++) {
      out.push([CURVE[i][0], Math.round(CURVE[i][1] * scale * m * 100) / 100])
    }
    return out
  }

  // ── E6: the temporary boost the sight trade buys ──────────────────────────
  // "Give me your sight and i will grant you the power to kill." Rather than a new
  // buff system, it rides the axis that already exists - so it shows up in
  // /path coefficients and /power like everything else.
  //
  // ⚠️ PERSISTED, and deliberately. The PRICE (blindness) lives in player data and
  // survives a restart; if the BENEFIT lived only in memory, a restart mid-trade
  // would leave someone blind for five minutes having been given nothing. Stored
  // against the world clock, never tickCount (K9) - dayTime() is cumulative and
  // survives; tickCount is per-session and silently resets.
  var BOOST_KEY = 'veldora_power_boost'
  var BOOST_END = 'veldora_power_boost_end'

  function worldTicks(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return d
    } catch (e) { }
    return null
  }

  function boostOf(server, player) {
    var now = worldTicks(server)
    if (now === null) return 1.0
    var end = 0, mult = 1.0
    try { end = player.persistentData.getDouble(BOOST_END) } catch (e) { return 1.0 }
    if (!end || !isFinite(end) || now >= end) {
      // expired - clear it once so the cache stamp changes and power drops back
      try {
        if (end) {
          player.persistentData.putDouble(BOOST_END, 0)
          player.persistentData.putDouble(BOOST_KEY, 1.0)
          console.info('[power] boost expired for ' + player.username)
        }
      } catch (e) { }
      return 1.0
    }
    try { mult = player.persistentData.getDouble(BOOST_KEY) } catch (e) { return 1.0 }
    return (typeof mult === 'number' && isFinite(mult) && mult > 0) ? mult : 1.0
  }

  // Returns true only if the boost was actually written. The caller charges a
  // price, so "I failed" and "done" must not share an answer.
  VELDORA.powerBoost = function (player, mult, seconds) {
    var server = null
    try { server = player.server } catch (e) { }
    if (!server) return false
    var now = worldTicks(server)
    if (now === null) {
      console.error('[power] no world clock - REFUSING a boost that could never expire')
      return false
    }
    try {
      player.persistentData.putDouble(BOOST_KEY, mult)
      player.persistentData.putDouble(BOOST_END, now + (seconds * 20))
    } catch (e) {
      console.error('[power] could not write boost :: ' + e)
      return false
    }
    apply(server, player, true)
    console.info('[power] boost x' + mult + ' for ' + seconds + 's on ' + player.username)
    return true
  }

  function powerCoeff(server, player) {
    var c = 1.0
    try {
      if (typeof VELDORA !== 'undefined' && VELDORA.coeff &&
          typeof VELDORA.coeff.of === 'function') {
        var v = VELDORA.coeff.of(server, player, 'power')
        if (typeof v === 'number' && isFinite(v)) c = v
      }
    } catch (e) { console.warn('[power] VELDORA.coeff threw :: ' + e) }
    return c * boostOf(server, player)
  }

  function apply(server, player, force) {
    if (typeof VELDORA === 'undefined' || typeof VELDORA.notoriety !== 'function') {
      return null      // C1 missing — say nothing here, the sweep reports it once
    }
    var b
    try { b = VELDORA.notoriety(server, player) } catch (e) { return null }
    if (!b || typeof b.value !== 'number' || !isFinite(b.value)) return null

    var uuid = String(player.uuid)

    // E3. The cache used to key on notoriety ALONE, which was correct only while
    // every path shared one curve. It no longer is: taking a path changes the
    // multiplier without moving the number, so a walker would keep the previous
    // path's power until their notoriety happened to tick. Key on both.
    var mult = powerCoeff(server, player)
    var stamp = b.value + '|' + mult
    if (!force && lastApplied[uuid] === stamp) return b        // nothing changed

    var list = bonusesFor(b.value, mult)
    for (var i = 0; i < list.length; i++) {
      try {
        player.modifyAttribute(list[i][0], MOD + '_' + i, list[i][1], 'add_value')
      } catch (e) {
        console.warn('[power] could not set ' + list[i][0] + ' :: ' + e)
      }
    }
    // K14. A max-health bonus does NOT heal you into it - vanilla leaves the new
    // hearts empty. So the moment power was granted, the player saw their heart
    // bar grow and immediately read as damaged, which is alarming at exactly the
    // wrong moment. Top up by the INCREASE only: never a free heal, just the
    // hearts we ourselves just added, and only when max health actually went up.
    try {
      var newMax = player.getAttribute('minecraft:generic.max_health').getValue()
      var prevMax = lastMax[uuid]
      if (typeof prevMax === 'number' && newMax > prevMax) {
        var gain = newMax - prevMax
        player.setHealth(Math.min(newMax, player.health + gain))
      }
      lastMax[uuid] = newMax
    } catch (e) { /* cosmetic only - never let this block the buff itself */ }

    lastApplied[uuid] = stamp
    return b
  }

  // ------------------------------------------------------------------- sweep
  var warnedMissing = false
  function sweep(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var r = apply(server, players[i], false)
        if (r === null && !warnedMissing) {
          warnedMissing = true
          console.warn('[power] C1 unreadable - NO power is being applied to anyone.')
          console.warn('[power] That is a BUG, not a mode. Check [notoriety] on boot.')
        }
      }
    } catch (e) { console.warn('[power] sweep threw :: ' + e) }
    server.scheduleInTicks(EVERY, function () { sweep(server) })
  }

  ServerEvents.loaded(function (event) {
    console.info('[power] C3 active - ' + CURVE.length + ' attributes, sweep every ' +
      EVERY + 't, cap at notoriety ' + CAP)
    console.info('[power] at 100: +6 health, +4 armour, +2 damage, +0.2 knockback resist')
    event.server.scheduleInTicks(EVERY, function () { sweep(event.server) })
  })

  // Apply immediately on login rather than waiting up to 5s for the sweep, and
  // force it, because a relog rebuilds the player object and drops our cache.
  PlayerEvents.loggedIn(function (event) {
    apply(event.server, event.player, true)
  })

  // ---------------------------------------------------------------------------
  // RESPAWN MUST INVALIDATE THE CACHE.
  //
  // Ethan, 2026-08-11: "after i died in the nether the hearts and armor
  // disappeared but then came back after a relog."
  //
  // Death builds a NEW ServerPlayer, and the attribute modifiers do not come with
  // it. But `lastApplied[uuid]` survived - it is keyed by UUID in our own memory,
  // not on the player - so the next sweep read "already applied at notoriety N",
  // took the early return on the force check, and never re-applied. The bonuses
  // stayed gone until loggedIn forced them back, which is exactly why relogging
  // looked like the fix.
  //
  // The cache was an optimisation to avoid writing four attributes every 5s. It
  // was correct about the NUMBER not changing and wrong about the PLAYER being the
  // same one. Any event that replaces the player object has to drop it.
  //
  // Both `respawned` and `cloned` are hooked: cloned fires when the player data is
  // copied to the new entity, respawned when they are back in the world. Doing
  // both is deliberate - one of them is redundant, and which one is redundant is
  // not worth being wrong about for a bonus the player can see missing.
  // ---------------------------------------------------------------------------
  function reapply(player) {
    if (!player) return
    delete lastApplied[String(player.uuid)]
    delete lastMax[String(player.uuid)]
    try { apply(player.server, player, true) } catch (e) {
      console.warn('[power] re-apply after respawn failed :: ' + e)
    }
  }

  PlayerEvents.respawned(function (event) { reapply(event.player) })
  PlayerEvents.cloned(function (event) { reapply(event.player) })

  // ---------------------------------------------------------------- commands
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    event.register(Commands.literal('power').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var b = apply(ctx.source.server, p, true)
      p.tell(Text.of('§8§m                                        '))
      if (!b) {
        p.tell(Text.of('§cnotoriety unreadable - no power applied. This is a bug.'))
        return 0
      }
      // E3. This readout MUST use the same multiplier apply() just used, or it
      // reports numbers nobody has - the readout-disagrees-with-reality class of
      // bug this codebase has now hit three times.
      var pm = powerCoeff(ctx.source.server, p)
      p.tell(Text.of('§7Power at notoriety §f§l' + b.value +
        (pm === 1 ? '' : ' §8(path power ×' + (Math.round(pm * 100) / 100) + ')')))
      var list = bonusesFor(b.value, pm)
      for (var i = 0; i < list.length; i++) {
        var attr = list[i][0]
        var shown = attr.replace('minecraft:generic.', '')
        var actual = '?'
        // Report the LIVE attribute value, not the number we intended to write.
        // "I set it to +4" and "it is +4" are different claims, and only the
        // second one is evidence.
        try { actual = Math.round(p.getAttribute(attr).getValue() * 100) / 100 } catch (e) { }
        p.tell(Text.of('§7  ' + shown + ' §8bonus §f+' + list[i][1] + ' §8-> live value §f' + actual))
      }
      p.tell(Text.of('§8  relog and re-run: the live values must NOT grow'))
      return 1
    }))

    event.register(Commands.literal('power_clear').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var done = clearPower(p)
      p.tell(Text.of('§7Zeroed: §f' + done.join(', ')))
      p.tell(Text.of('§8The next sweep will re-apply unless C3 is removed.'))
      return 1
    }))
  })
})()
