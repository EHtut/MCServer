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
    return done
  }

  // ----------------------------------------------------------------- applying
  function bonusesFor(n) {
    var scale = Math.min(n, CAP) / CAP
    var out = []
    for (var i = 0; i < CURVE.length; i++) {
      out.push([CURVE[i][0], Math.round(CURVE[i][1] * scale * 100) / 100])
    }
    return out
  }

  function apply(server, player, force) {
    if (typeof VELDORA === 'undefined' || typeof VELDORA.notoriety !== 'function') {
      return null      // C1 missing — say nothing here, the sweep reports it once
    }
    var b
    try { b = VELDORA.notoriety(server, player) } catch (e) { return null }
    if (!b || typeof b.value !== 'number' || !isFinite(b.value)) return null

    var uuid = String(player.uuid)
    if (!force && lastApplied[uuid] === b.value) return b      // nothing changed

    var list = bonusesFor(b.value)
    for (var i = 0; i < list.length; i++) {
      try {
        player.modifyAttribute(list[i][0], MOD + '_' + i, list[i][1], 'add_value')
      } catch (e) {
        console.warn('[power] could not set ' + list[i][0] + ' :: ' + e)
      }
    }
    lastApplied[uuid] = b.value
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

  // ---------------------------------------------------------------- commands
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands

    event.register(Commands.literal('power').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var b = apply(ctx.source.server, p, true)
      p.tell(Text.of('§8§m                                        '))
      if (!b) {
        p.tell(Text.of('§cnotoriety unreadable - no power applied. This is a bug.'))
        return 0
      }
      p.tell(Text.of('§7Power at notoriety §f§l' + b.value))
      var list = bonusesFor(b.value)
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

    event.register(Commands.literal('power_clear').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var done = clearPower(p)
      p.tell(Text.of('§7Zeroed: §f' + done.join(', ')))
      p.tell(Text.of('§8The next sweep will re-apply unless C3 is removed.'))
      return 1
    }))
  })
})()
