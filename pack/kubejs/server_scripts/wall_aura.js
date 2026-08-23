// wall_aura.js — the web bites.
//
// Ethan, 2026-08-24:
//     "we can also have wall begin to attack enemy mobs around wall aswell if that
//      makes it feel level"
//
// ── WHY SHE NEEDED THIS ─────────────────────────────────────────────────────────
// Wall is a NON-COMBATANT (docs/63 §6). She has no Trial, and her rank starts at MAX
// and DECAYS - she is the only patron whose progression is something you lose rather
// than something you win. That is deliberate and it is her character, but it left her
// champion with no moment where being high-rank is visible in the world. A combatant
// feels their trust every time a drop lands. Wall's felt like an absence.
//
// ── 🔑 SHE WOUNDS AND WEBS. SHE DOES NOT KILL. ──────────────────────────────────
// The obvious build is a damage aura that clears mobs. It was rejected for two
// reasons, and the second one is the real one:
//
//   1. A mob killed by setHealth(0) has NO KILLER. No drop payout, no counter credit,
//      no path progress - so an aura that finished mobs would quietly steal the
//      player's own income, and the stronger her champion got the poorer they would
//      be. The mechanic would fight the rest of the game.
//
//   2. ⭐ IT IS NOT WHO SHE IS. `34` §4's coupling table already ruled it:
//      **"protection - it is not a weapon. Her coupling is what stands between you
//      and the world."** A goddess who kills for you is Blade with extra steps.
//
// So the aura takes hostiles DOWN TO A FLOOR and never through it, and slows them.
// The kill is still yours; the fact that you survived to make it is hers. A player at
// full rank walks through a cave with everything around them already bleeding and
// staggering, and every one of those kills still pays them.
//
// ── ⚠️ SCALING IS AN INCREASE, NEVER A PENALTY ──────────────────────────────────
// Ethan's standing rule - "we should never have a coefficient go under 1 it should
// always be an increase" - so rank scales the aura UP from nothing. At rank 0 it is
// simply off; there is no state in which Wall makes the world harder for you. Her
// floor is 1 (`ranks.js` WALL_FLOOR: "she never drops you entirely"), so a Wall
// champion always has some of this.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[wallaura] '
  var GOD = 'wall'
  var GATE = true

  var SWEEP = 40                 // 2s. Slow on purpose - this is presence, not a laser
  var BASE_RADIUS = 4.0
  var RADIUS_PER_RANK = 1.2      // rank 1 -> 5.2 blocks, rank 5 -> 10
  var BITE_PER_RANK = 0.6        // rank 1 -> 0.6 dmg/sweep, rank 5 -> 3.0
  var HP_FLOOR_FRAC = 0.25       // 🚨 never take anything below a quarter of its max
  var SLOW_TICKS = 60            // 3s, refreshed every sweep while they stay in range
  var MAX_PER_SWEEP = 24         // hard ceiling on entities touched, per player

  // Her own summons and actors must never be bitten by her own web.
  var FRIENDLY_TAGS = ['veldora_wall_actor', 'veldora_wall_harvest']

  function pathOf(p) {
    try { return (VELDORA.paths && VELDORA.paths.pathOf(p)) || '' } catch (e) { return '' }
  }

  function rankOf(server, p) {
    try {
      if (typeof VELDORA.trust !== 'function') return 0
      var t = VELDORA.trust(server, p, GOD)
      return (typeof t === 'number' && isFinite(t) && t > 0) ? t : 0
    } catch (e) { return 0 }
  }

  function friendly(e) {
    try {
      for (var i = 0; i < FRIENDLY_TAGS.length; i++) {
        if (e.tags.contains(FRIENDLY_TAGS[i])) return true
      }
    } catch (x) { }
    return false
  }

  // 🔴 warned-once, because a broken accessor must be LOUD but must not write a line
  // every two seconds for every player forever.
  var warnedMonster = false
  var warnedScan = false

  // ⚠️ `e.maxHealth` WAS A GUESS AND IT IS NOT THE ACCESSOR. stalker.js already
  // solved this - `getAttribute('minecraft:generic.max_health').getValue()`, with 20
  // as the fallback. Caught before shipping only because the tree had a helper with
  // that exact name, which is the whole argument for reading the pack before adding
  // to it. Duplicated rather than imported: stalker.js keeps it module-private, and
  // an aura that silently reads every mob's max health as `undefined` would compute a
  // floor of NaN and quietly never bite anything.
  function maxHealthOf(e) {
    try { return e.getAttribute('minecraft:generic.max_health').getValue() } catch (x) { return 20 }
  }

  function bite(server, p, rank) {
    var radius = BASE_RADIUS + RADIUS_PER_RANK * rank
    var dmg = BITE_PER_RANK * rank
    if (dmg <= 0) return 0

    var near = null
    try {
      near = p.level.getEntitiesWithin(p.boundingBox.inflate(radius))
    } catch (e) {
      if (!warnedScan) {
        warnedScan = true
        console.error(TAG + 'cannot scan for entities, the aura does NOTHING ' +
          '(logged once per start) :: ' + e)
      }
      return 0
    }
    if (!near) return 0

    var touched = 0
    for (var i = 0; i < near.length && touched < MAX_PER_SWEEP; i++) {
      var e = near[i]
      if (!e) continue
      try { if (e.player) continue } catch (x) { continue }
      if (friendly(e)) continue

      // ⚠️ CALL isMonster() DIRECTLY. paths.js:1157 records the reason: probing for
      // it first ("typeof e.isMonster === 'function'") reads as FALSY under Rhino, so
      // a defensive check silently disables the whole thing.
      var monster = false
      try {
        monster = e.isMonster()
      } catch (x) {
        if (!warnedMonster) {
          warnedMonster = true
          console.error(TAG + 'cannot read mob category, the aura does NOTHING ' +
            '(logged once per start) :: ' + x)
        }
        return touched
      }
      if (!monster) continue

      var hp = null, max = null
      try { hp = e.health } catch (x) { continue }
      max = maxHealthOf(e)
      if (typeof hp !== 'number' || !isFinite(hp) || hp <= 0) continue
      if (typeof max !== 'number' || !isFinite(max) || max <= 0) continue

      // 🚨 THE FLOOR IS THE WHOLE DESIGN. Anything already at or under it is left
      // exactly alone - she has done her part and the rest is the player's.
      var floor = max * HP_FLOOR_FRAC
      if (hp <= floor) {
        try { e.potionEffects.add('minecraft:slowness', SLOW_TICKS, 0, false, true) } catch (x) { }
        touched++
        continue
      }

      var next = hp - dmg
      if (next < floor) next = floor
      try { e.setHealth(next) } catch (x) { continue }
      try { e.potionEffects.add('minecraft:slowness', SLOW_TICKS, 0, false, true) } catch (x) { }
      touched++
    }
    return touched
  }

  function sweep(server) {
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        if (pathOf(p) !== GOD) continue
        try { if (!p.isAlive || !p.isAlive()) continue } catch (x) { continue }
        var rank = rankOf(server, p)
        if (rank <= 0) continue
        bite(server, p, rank)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    try { server.scheduleInTicks(SWEEP, function () { sweep(server) }) } catch (e) { }
  }

  VELDORA.wallAura = {
    enabled: function () { return GATE },
    radiusAt: function (rank) { return BASE_RADIUS + RADIUS_PER_RANK * rank },
    biteAt: function (rank) { return BITE_PER_RANK * rank },
    floorFrac: HP_FLOOR_FRAC,
    // exposed for tools/wall_aura_harness.js - the same reason release.js exposes
    // _strike. The floor invariant ("it never kills") is the entire design, and it
    // cannot be play-tested by standing in a cave hoping to notice a mob NOT dying.
    _bite: bite,
    _maxHealthOf: maxHealthOf,
  }

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF - the web does not bite'); return }
    sweep(event.server)
    console.info(TAG + 'THE WEB BITES - hostiles within ' + BASE_RADIUS + '+' +
      RADIUS_PER_RANK + '/rank blocks of a wall champion take ' + BITE_PER_RANK +
      '/rank damage every ' + (SWEEP / 20) + 's and are slowed.')
    console.info(TAG + '\U0001f6a8 IT NEVER KILLS - nothing is taken below ' +
      Math.round(HP_FLOOR_FRAC * 100) + '% of its max health. The kill stays the ' +
      'player\'s, so drops and counters still pay. She is protection, not a weapon.')
    if (typeof VELDORA.trust !== 'function') {
      console.error(TAG + '!! VELDORA.trust MISSING - every wall champion reads as ' +
        'rank 0 and the aura is DEAD for everyone. That is a bug, not a quiet path.')
    }
  })
})();
