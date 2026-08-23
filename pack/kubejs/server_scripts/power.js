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

// The shared-namespace idiom. This file only READS the namespace, but declares it
// like every sibling so that publishing from here later is not a trap: assigning
// onto an undefined VELDORA throws at load and takes the whole file with it, which
// is exactly what nearly happened when E6 briefly added a VELDORA.powerBoost here.
//
// That boost is GONE, deliberately. It multiplied the E3 power axis to pay for
// Salvage's sight trade, and Ethan's verdict on taking it was that an invisible
// number is the wrong reward: "use strength and speed effects instead so the player
// can see what they traded". The trade now grants potion effects, so this file has
// no consumer for a boost - and a mechanism with no live consumer is a bug, not a
// spare part. It is in git if it is ever wanted.
//
// The trailing semicolon is LOAD-BEARING (ASI), same as ritual.js and notoriety.js.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var MOD = 'mcserver:veldora_power'
  var CAP = 100
  var EVERY = 100          // ticks between sweeps (5s) — this is not a per-tick hook

  // ═══════════════════════════════════════════════════════════════════════════
  // attribute, bonus at notoriety 100 (x1.0), and the HARD CEILING for that
  // attribute no matter what the coefficient says.
  //
  // ⭐ THE CEILING IS THE POINT.  Blade's power coefficient is 5.0, and without a
  // cap that reads as +30 health, +20 ARMOUR and +1.0 KNOCKBACK RESISTANCE at
  // notoriety 100 - which is the vanilla armour cap and total knockback immunity.
  // Not "the strong path": unkillable by anything that is not armour-piercing.
  //
  // So the multiplier now decides HOW FAST you reach the ceiling, not how far past
  // it you go. Blade maxes every attribute around notoriety 35 and stays there;
  // Forge at 1.0 never reaches one. The spread survives, the absurdity does not.
  //
  //                                  at x1.0/n100   ceiling   who reaches it
  //   max_health                          6.0        10.0     blade ~n35
  //   armor                               4.0         8.0     blade ~n40
  //   attack_damage                       2.0         4.0     blade ~n40
  //   knockback_resistance                0.2         0.5     blade ~n50
  // ═══════════════════════════════════════════════════════════════════════════
  var CURVE = [
    ['minecraft:generic.max_health', 6.0, 10.0],
    ['minecraft:generic.armor', 4.0, 8.0],
    ['minecraft:generic.attack_damage', 2.0, 4.0],
    ['minecraft:generic.knockback_resistance', 0.2, 0.5],
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
      var v = CURVE[i][1] * scale * m
      var ceiling = CURVE[i][2]
      // The cap is per ATTRIBUTE, not on the multiplier - so a big coefficient is
      // still felt (you get there far sooner) without leaving the game's own limits.
      if (typeof ceiling === 'number' && v > ceiling) v = ceiling
      out.push([CURVE[i][0], Math.round(v * 100) / 100])
    }
    return out
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
    return c
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴🔴 POWER COMES FROM TRUST NOW, NOT NOTORIETY. docs/63, ruling 1 ("Replacing").
  //
  // ⭐ WHY THIS IS THE WHOLE POINT OF THE CHANGE. Notoriety is max(xp, days x rate) -
  // it climbs on a CLOCK whether you play well or not, and it was what bought these
  // four attributes. So the game paid for elapsed time. Trust only moves when a god
  // decides it has: a Trial won, days survived, things made.
  //
  // 🔑 THE CURVE BELOW IS UNTOUCHED ON PURPOSE. trustScale() returns 0..1 and it is
  // multiplied back up to CAP, so CURVE, the ceilings and every tuned number still
  // mean exactly what they meant - only the INPUT changed. Blade still reaches his
  // ceilings around "35 points", which is now rank 2 of 5 rather than notoriety 35.
  // That is "strongest champion" as a rank instead of as a stopwatch.
  function apply(server, player, force) {
    if (typeof VELDORA === 'undefined' || typeof VELDORA.trustScale !== 'function') {
      return null      // the seam is missing — say nothing here, the sweep reports once
    }
    var scale
    try { scale = VELDORA.trustScale(server, player) } catch (e) { return null }
    if (typeof scale !== 'number' || !isFinite(scale)) return null
    if (scale < 0) scale = 0
    if (scale > 1) scale = 1
    // Re-expressed in the old units so nothing downstream has to be re-tuned.
    var b = { value: scale * CAP }

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
          console.warn('[power] TRUST unreadable - NO power is being applied to anyone.')
          console.warn('[power] That is a BUG, not a mode. VELDORA.trustScale is the')
          console.warn('[power] seam now (docs/63), not VELDORA.notoriety. Check')
          console.warn('[power] [notoriety] on boot - it publishes both.')
        }
      }
    } catch (e) { console.warn('[power] sweep threw :: ' + e) }
    server.scheduleInTicks(EVERY, function () { sweep(server) })
  }

  ServerEvents.loaded(function (event) {
    console.info('[power] C3 active - ' + CURVE.length + ' attributes, sweep every ' +
      EVERY + 't. Driven by TRUST (docs/63), not notoriety: rank 0 gives nothing, ' +
      'max rank gives the full curve.')
    console.info('[power] at max rank: +6 health, +4 armour, +2 damage, +0.2 ' +
      'knockback resist, before the path coefficient and under the per-attribute cap.')
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
