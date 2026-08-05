// stalker.js — C5 + C6 of the Stalker build.  docs/19-STALKER-BUILD.md
//
// C5  THE INVARIANT: in phases 1–3 a stalker cannot die. Below the flee
//     threshold the incoming damage is CANCELLED, it leaves, and it is
//     discarded. If a stalker dies even once, every player learns it is killable
//     and the illusion is over. This has no partial credit.
//
// C6  THE PHASES: one creature, four faces.
//       0–24   THE HELPER      appears only at low health, kills your attacker,
//                              stays a few seconds, leaves
//       25–74  THE COMPANION   a tamed dog. follows, retaliates — including
//                              against other players
//       75–99  THE ABSENCE     gone. no warning, no message.
//       100    THE HARVEST     C7 owns this; C6 only stands aside for it
//
// ── How the damage guard works ───────────────────────────────────────────────
// It is PRE-EMPTIVE, not reactive. Watching health and reacting when it drops
// cannot work — a large hit lands before any sweep could run. Every incoming hit
// is inspected BEFORE it applies, and if it would cross the threshold it is
// cancelled ENTIRELY, so health can never fall below the line whatever the blow.
// Damage that would NOT cross it is allowed through, so friends helping in a
// fight genuinely push it toward leaving.
//
// ── C0 findings this is built on (each fails SILENTLY if ignored) ────────────
//  · the event is EntityEvents.beforeHurt — `hurt` does not exist
//  · event.cancel() unwinds by THROWING; inside a try/catch it is swallowed
//  · attribute ids are minecraft:generic.*
;(function () {
  var OWNER = 'veldora_stalker_owner'
  var PATHKEY = 'veldora_stalker_path'
  var FLEEING = 'veldora_stalker_fleeing'
  var STATE = 'veldora_stalker_state'     // server.persistentData: uuid -> { phase }
  var FLEE_AT = 0.35
  var SCALE = 1.25
  // A mob closes roughly 10 blocks in 2 seconds, so a 2s sweep was letting a
  // Companion cross from MIN_DIST to arm's reach between checks. The distance
  // ring runs every second; the EXPENSIVE part (an 80-block entity scan for
  // duplicates) only every fifth pass, since orphans do not appear mid-second.
  var SWEEP = 20                          // ticks between phase sweeps (1s)
  // The scan box grew with the ring (176 blocks a side), so run it less often.
  // Orphans do not appear mid-second; duplicates only ever arise across restarts
  // or dimension changes.
  var CULL_EVERY = 10                     // sweeps between duplicate scans
  var HYST = 3                            // notoriety points of stickiness at every edge
  var HELPER_AT = 0.35                    // owner health fraction that summons the Helper
  var HELPER_STAY = 100                   // ticks the Helper lingers (5s)
  // DISTANCE. Ethan: "make it always spawn far, far enough that it is still
  // following you but at a large distance."
  //
  // This is not only taste - it is the fix for "if i get too close it kills me".
  // A Companion is a Born in Chaos hostile whose AI keeps re-acquiring its owner
  // between our sweeps, so the reliable answer is that it never gets to ARM'S
  // REACH in the first place. Distance is the safety, the damage cancel below is
  // the guarantee, and clearing the target is only cosmetic.
  // DISTANCE IS DYNAMIC (Ethan, 2026-08-05): "creeping closer the lower the
  // player's health is... lets do 30, at the edge of the player's chunk."
  //
  // At full health it keeps two chunks back and simply paces you. As you weaken
  // it closes - not to attack (it cannot; damage to its owner is cancelled) but
  // because it is paying attention. Being hurt is what makes it interested, which
  // is the same instinct as the Helper and reads as appetite rather than AI.
  var DIST_FAR = 128                      // at full health (Ethan, 2026-08-05)
  var DIST_NEAR = 12                      // at death's door
  var BAND = 14                            // slack before we bother repositioning
  // Must exceed DIST_FAR or EVERY correction is a snap. It was 48 against a
  // 30-block ring; at 128 that would have meant it never walked once.
  var TELEPORT_AT = 200

  // ⚠️ simulation-distance is 8 chunks = EXACTLY 128 blocks. An entity parked at
  // the far end of the ring sits on that boundary: view-distance 12 means the
  // chunk is still sent, so you SEE it, but it is outside the ticking set, so its
  // own AI does not run. Our sweep still positions it every second, so it follows
  // - it simply does not animate or path for itself out there.
  //
  // That is arguably the better horror: a figure at the treeline that is only
  // ever exactly where it was put. But it is a real behaviour change, not a
  // detail, so it is written down rather than discovered.
  //
  // The CULL RADIUS has to cover the ring or the sweep cannot see its own
  // stalker and mints a second one. 80 was fine for a 30-block ring and is a bug
  // at 128.
  var SCAN_RADIUS = DIST_FAR + 48
  var HARVEST = 'veldora_harvest'         // entity flag: this one CAN die
  var ABSENT_DAYS = 30                    // gone this long after a Harvest, either way

  // "it is fat too" - the Harvest instance has been eating for a hundred days.
  // Without this the fight is trivial against a player carrying C3's bonuses.
  var HARVEST_MULT = { health: 1.6, damage: 1.3, armor: 1.2 }

  // ONE LINE. Not a stats book - that was clever rather than good. Its whole job
  // is to make the player ask what this was all for, at the exact moment the game
  // takes their path away and asks them to choose again.
  var FRAGMENTS = [
    'It was never hungry.',
    'You were chosen the day you chose.',
    'There were five others. It ate them first.',
    'It has done this before. You have done this before.',
    'It did not want you strong. It wanted you worth taking.',
    'Nothing was ever watching. It was only ever waiting.',
  ]

  // Explicit stat block per casting. NOT optional, and not merely tuning:
  // a KubeJS createEntity().spawn() bypasses finalizeSpawn, which is where Born
  // in Chaos applies its own configured health/damage/armour. Proven by H1 - a
  // chaff mob reads its raw code default through this path and its CONFIGURED
  // value through /summon. So a stalker spawned our way would inherit whatever
  // the class happens to declare, silently, and drift the day the mod updates.
  // We state the numbers ourselves and stop depending on a hook we do not call.
  var STATS = {
    forge:   { health: 250, damage: 14, armor: 10 },
    art:     { health: 70, damage: 7, armor: 4 },
    blade:   { health: 600, damage: 12, armor: 12 },
    salvage: { health: 100, damage: 10, armor: 0.5 },
    crown:   { health: 150, damage: 9, armor: 10 },
    wall:    { health: 90, damage: 6, armor: 0 },
  }

  var CAST = {
    forge:   ['born_in_chaos_v1:krampus', 'The Thief'],
    art:     ['born_in_chaos_v1:nightmare_stalker', 'The Nightmare'],
    blade:   ['born_in_chaos_v1:lord_pumpkinhead', 'The Challenger'],
    salvage: ['born_in_chaos_v1:dire_hound_leader', 'The Hound'],
    crown:   ['born_in_chaos_v1:missioner', 'The False King'],
    wall:    ['born_in_chaos_v1:mother_spider', 'The Mother'],
  }

  //  name,      low (inclusive), high (exclusive)
  var BANDS = [
    ['helper', 0, 25],
    ['companion', 25, 75],
    ['absence', 75, 100],
    ['harvest', 100, Infinity],
  ]

  var SERVER = null
  var sweepCount = 0
  var live = {}                 // uuid -> stalker entity (in-memory; always re-checked)
  var damageAccessorLogged = false
  var sourceAccessorLogged = false

  // ------------------------------------------------------------------ helpers
  function isStalker(e) {
    try { return !!e && !!e.persistentData.getString(OWNER) } catch (x) { return false }
  }
  function ownerOf(e) {
    try { return e.persistentData.getString(OWNER) } catch (x) { return '' }
  }
  function isFleeing(e) {
    try { return e.persistentData.getBoolean(FLEEING) } catch (x) { return false }
  }
  function maxHealthOf(e) {
    try { return e.getAttribute('minecraft:generic.max_health').getValue() } catch (x) { return 20 }
  }
  function alive(e) {
    try { return !!e && e.isAlive() } catch (x) { return false }
  }

  // The damage amount, or null if unreadable.
  //
  // ⚠️ `typeof v === 'number'` IS NOT ENOUGH. event.damage answers with
  // Long.MAX_VALUE here - a perfectly valid number that is not a damage amount.
  // It sailed through the type check, so `hp - dmg` came out at -9.2e18, every
  // single hit read as lethal, and every stalker fled on first contact. The
  // "friends can push it toward leaving" behaviour never once ran.
  //
  // A value has to be PLAUSIBLE, not merely numeric. Nothing in this pack deals
  // five figures of damage in one blow.
  var DMG_MAX = 100000
  function plausible(v) {
    return typeof v === 'number' && isFinite(v) && v >= 0 && v <= DMG_MAX
  }

  function damageOf(event) {
    var cands = [
      ['event.damage', function () { return event.damage }],
      ['event.getDamage()', function () { return event.getDamage() }],
      ['event.amount', function () { return event.amount }],
      ['event.getAmount()', function () { return event.getAmount() }],
      ['event.source.damage', function () { return event.source.damage }],
    ]
    var chosen = null, chosenLabel = ''
    var report = []
    for (var i = 0; i < cands.length; i++) {
      var raw
      try { raw = cands[i][1]() } catch (x) { raw = '<threw>' }
      report.push(cands[i][0] + '=' + raw)
      if (chosen === null && plausible(raw)) { chosen = raw; chosenLabel = cands[i][0] }
    }
    if (!damageAccessorLogged) {
      damageAccessorLogged = true
      console.info('[stalker] damage candidates: ' + report.join('  '))
      console.info('[stalker] using ' + (chosen === null ? 'NONE - worst case per hit' : chosenLabel))
    }
    return chosen
  }

  // Who threw the punch. C0 found src.getEntity() throws and zero-arg accessors
  // read back as METHODS when touched as properties, so every candidate is
  // called and type-checked.
  var ATTACKER_CANDS = [
    ['source.actor', function (s) { return s.actor }],
    ['source.player', function (s) { return s.player }],
    ['source.entity', function (s) { return s.entity }],
    ['source.directEntity', function (s) { return s.directEntity }],
    ['source.getEntity()', function (s) { return s.getEntity() }],
    ['source.getDirectEntity()', function (s) { return s.getDirectEntity() }],
  ]
  var attackerPick = -1
  function attackerOf(event) {
    var src = null
    try { src = event.source } catch (x) { return null }
    if (!src) return null
    // Once we know which accessor this runtime exposes, stop re-discovering it.
    // This runs on EVERY damage tick - standing in fire is 20/s per player - and
    // several candidates throw, which is the expensive part in Rhino.
    if (attackerPick >= 0) {
      try {
        var q = ATTACKER_CANDS[attackerPick][1](src)
        if (q && typeof q !== 'function' && alive(q)) return q
      } catch (x) { }
      return null
    }
    var cands = ATTACKER_CANDS.map(function (c) {
      return [c[0], function () { return c[1](src) }]
    })
    for (var i = 0; i < cands.length; i++) {
      try {
        var v = cands[i][1]()
        if (v && typeof v !== 'function' && alive(v)) {
          attackerPick = i
          if (!sourceAccessorLogged) {
            sourceAccessorLogged = true
            console.info('[stalker] attacker read via ' + cands[i][0])
          }
          return v
        }
      } catch (x) { }
    }
    return null   // environmental damage (fall, lava, starve) has no attacker
  }

  // ------------------------------------------------------------------- fleeing
  function flee(e, why) {
    if (isFleeing(e)) return
    try { e.persistentData.putBoolean(FLEEING, true) } catch (x) { }
    console.info('[stalker] ' + (e.type || '?') + ' fleeing from ' + ownerOf(e) + ' (' + why + ')')
    try { e.potionEffects.add('minecraft:invisibility', 60, 0, false, false) } catch (x) { }
    try { e.potionEffects.add('minecraft:speed', 60, 3, false, false) } catch (x) { }
    try { e.setTarget(null) } catch (x) { }
    var srv = SERVER
    if (srv) srv.scheduleInTicks(30, function () { try { if (alive(e)) e.discard() } catch (x) { } })
    else { try { e.discard() } catch (x) { } }
  }

  // --------------------------------------------------------------- THE GUARD
  EntityEvents.beforeHurt(function (event) {
    var e = event.entity
    if (!isStalker(e)) return

    // THE HARVEST is the one time it can die. The thing that was invulnerable for
    // weeks becomes mortal at the exact moment it turns on you - which is why the
    // Harvest must not be guaranteed. A fight you cannot win is not a fight.
    if (isHarvestInstance(e)) return

    if (isFleeing(e)) { event.cancel(); return }     // nothing touches it on the way out

    var hp = 20
    try { hp = e.health } catch (x) { }
    var max = maxHealthOf(e)
    var threshold = max * FLEE_AT
    var dmg = damageOf(event)
    var after = (dmg === null) ? -1 : (hp - dmg)     // unreadable => worst case

    if (after > threshold) return                    // survivable: let it land

    flee(e, 'health would fall to ' + (dmg === null ? 'unknown' : Math.round(after)) +
      ' of ' + Math.round(max))
    event.cancel()                                   // MUST be outside any try/catch (C0)
  })

  // It pays nothing, in any phase. A stalker that drops anything stops being a
  // predator and becomes a resource.
  EntityEvents.drops(function (event) {
    if (!isStalker(event.entity)) return
    // Design: "no loot, no XP". drops covers ITEMS only - a killed Harvest was
    // still dropping experience orbs, which fed the very notoriety it exists to
    // reset. Zero the xp on the event where the API allows it.
    var zeroed = false
    var cands = [
      function () { event.experience = 0; return event.experience === 0 },
      function () { event.setExperience(0); return true },
      function () { event.xp = 0; return event.xp === 0 },
    ]
    for (var i = 0; i < cands.length; i++) { try { if (cands[i]()) { zeroed = true; break } } catch (x) { } }
    if (!zeroed && !xpDropWarned) {
      xpDropWarned = true
      console.warn('[stalker] could not zero XP drop - a killed Harvest still pays experience')
    }
    event.cancel()
  })
  var xpDropWarned = false

  EntityEvents.death(function (event) {
    var e = event.entity
    if (!SERVER) return

    // --- a stalker died ---
    if (isStalker(e)) {
      var owner = ownerOf(e)
      if (isHarvestInstance(e)) {
        // WON - but the owner has to have BEEN THERE. The old check only asked
        // whether they were online, so a brother could find your boss and kill
        // it while you were asleep 5000 blocks away, and you would take the
        // fragment, the escrow and the 30-day absence for a fight you never saw.
        //
        // Proximity rather than last-hit, because design rule 3 says friends may
        // help: someone else landing the final blow beside you still counts.
        var p = null
        try { p = SERVER.getPlayer(owner) } catch (x) { }
        if (!p) { console.warn('[stalker] harvest died but owner ' + owner + ' is offline - no credit'); return }
        var near = false
        try {
          var ddx = p.x - e.x, ddy = p.y - e.y, ddz = p.z - e.z
          near = (ddx * ddx + ddy * ddy + ddz * ddz) <= (64 * 64)
        } catch (x) { }
        if (!near) {
          console.warn('[stalker] harvest died far from ' + owner + ' - no credit, it simply left')
          return
        }
        harvestWon(SERVER, p, e)
        return
      }
      console.error('[stalker] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      console.error('[stalker] !! INVARIANT BREACH: a NON-harvest stalker DIED.')
      console.error('[stalker] !! owner=' + owner + ' type=' + e.type)
      try { console.error('[stalker] !! source=' + event.source.type()) } catch (x) { }
      console.error('[stalker] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      return
    }

    // --- a player died: was it OUR doing? ---
    var isPlayer = false
    try { isPlayer = !!e && !!e.username } catch (x) { }
    if (!isPlayer) return
    if (phaseStored(SERVER, e) !== 'harvest') return

    // ATTRIBUTION. The wipe fires only on the stalker's kill. When the source is
    // unclear we fail toward the LESSER penalty - a fall during a Harvest must
    // not cost someone everything.
    var killer = attackerOf(event)
    if (!killer || !isStalker(killer) || !isHarvestInstance(killer)) {
      console.info('[stalker] ' + e.username + ' died mid-Harvest but NOT to the stalker - no wipe')
      return
    }
    if (ownerOf(killer) !== e.username) {
      console.info('[stalker] ' + e.username + ' was killed by another player stalker - no wipe')
      return
    }
    harvestLost(SERVER, e, killer)
  })

  // ---------------------------------------------------- the stat block, VERIFIED
  //
  // Two faults this replaces:
  //
  // 1. It was twelve empty catch blocks. If any setBaseValue failed the stalker
  //    silently kept its code default - the exact drift the block exists to
  //    remove - and nothing anywhere said so.
  //
  // 2. THE NUMBERS DID NOT LAND. Live logs showed Krampus at 273 / 310 / 318 /
  //    355 against a configured 250: L2Hostility applies a level modifier ON TOP
  //    of our base, after we set it. The Harvest then multiplied that unknown
  //    number by 1.6, so a fight balanced for 400 could arrive at 570.
  //
  // So: set the base, then RE-READ a second later - after everything else has had
  // its say - and correct the base by whatever the difference turns out to be.
  // Self-correcting against any modifier from any mod, present or future, because
  // it measures the total rather than assuming it owns it.
  function setAttr(e, attr, want) {
    try {
      var a = e.getAttribute(attr)
      if (!a) return null
      a.setBaseValue(want)
      return a.getValue()
    } catch (x) { return null }
  }

  function applyStats(e, st, mult, label) {
    var m = (typeof mult === 'number') ? { health: mult, damage: mult, armor: mult } : mult
    var wantHp = st.health * m.health
    var plan = [
      ['minecraft:generic.max_health', wantHp],
      ['minecraft:generic.attack_damage', st.damage * m.damage],
      ['minecraft:generic.armor', st.armor * m.armor],
    ]
    var failed = []
    for (var i = 0; i < plan.length; i++) {
      if (setAttr(e, plan[i][0], plan[i][1]) === null) failed.push(plan[i][0])
    }
    if (failed.length) {
      console.warn('[stalker] ' + label + ': could not set ' + failed.join(', ') +
        ' - it is running on mod defaults for those')
    }
    try { e.setHealth(wantHp) } catch (x) { }

    // The correction pass. Anything else that scales this mob has acted by now.
    if (!SERVER) return
    SERVER.scheduleInTicks(20, function () {
      if (!alive(e)) return
      try {
        var a = e.getAttribute('minecraft:generic.max_health')
        var actual = a.getValue()
        if (Math.abs(actual - wantHp) > 0.5) {
          var base = a.getBaseValue()
          a.setBaseValue(base + (wantHp - actual))
          var now = a.getValue()
          console.info('[stalker] ' + label + ' health corrected ' +
            Math.round(actual) + ' -> ' + Math.round(now) + ' (wanted ' + Math.round(wantHp) + ')')
          if (Math.abs(now - wantHp) > 0.5) {
            console.warn('[stalker] ' + label + ' STILL off: ' + Math.round(now) +
              ' vs ' + Math.round(wantHp) + ' - something is re-applying after us')
          }
        }
        e.setHealth(e.getAttribute('minecraft:generic.max_health').getValue())
      } catch (x) { console.warn('[stalker] ' + label + ' health check threw :: ' + x) }
    })
  }

  // ------------------------------------------------------------------ summoning
  function summon(player, pathKey, near) {
    var spec = CAST[pathKey]
    if (!spec) return null
    var e = player.level.createEntity(spec[0])
    if (!e) return null
    var d = near || DIST_FAR
    e.persistentData.putString(OWNER, player.username)
    e.persistentData.putString(PATHKEY, pathKey)
    e.setCustomName(Text.of('§c' + spec[1]))
    e.setCustomNameVisible(true)
    placeBehind(player, e, d)      // set the position BEFORE it enters the world
    e.spawn()

    var st = STATS[pathKey]
    if (st) applyStats(e, st, 1, pathKey)
    try { e.getAttribute('minecraft:generic.scale').setBaseValue(SCALE) } catch (x) { }
    // NO GLOW. It was my idea for making a common species read as singular, and
    // Ethan is right that it looks wrong - an outline through walls is a game-UI
    // tell, not a horror one. The name and the size do that job without
    // announcing themselves.

    // NO PERSISTENCE on a Companion or Helper - deliberately.
    // Pinning them meant every stalker outlived its session, and since they also
    // CANNOT DIE the world was accumulating immortal minibosses forever. Letting
    // them despawn naturally is self-healing: the sweep notices and re-summons
    // within 2 seconds when the owner is actually around. Only the Harvest pins
    // itself (summonHarvest), because despawning mid-boss-fight would be absurd.
    return e
  }

  // --------------------------------------------------------------- distance
  function healthFrac(p) {
    try {
      var m = p.getAttribute('minecraft:generic.max_health').getValue()
      if (m > 0) return Math.max(0, Math.min(1, p.health / m))
    } catch (x) { }
    return 1
  }

  function yawOf(p) {
    var cands = [
      function () { return p.yaw },
      function () { return p.getYRot() },
      function () { return p.rotationYaw },
    ]
    for (var i = 0; i < cands.length; i++) {
      try { var v = cands[i](); if (typeof v === 'number' && isFinite(v)) return v } catch (x) { }
    }
    return null
  }

  // Place it BEHIND the player rather than at a random bearing. A snap you can
  // see is a bug; a snap at your back is the mod working, and when you turn
  // around it is simply there.
  function placeBehind(player, e, dist) {
    var yaw = yawOf(player)
    var ang
    if (yaw === null) {
      ang = Math.random() * Math.PI * 2
    } else {
      // MC yaw: the player faces (-sin, +cos). Behind is that negated, widened
      // +/-50 degrees so it is not mechanically dead-centre.
      ang = (yaw + 180) * Math.PI / 180 + (Math.random() - 0.5) * (100 * Math.PI / 180)
    }
    try {
      e.setPos(player.x - Math.sin(ang) * dist, player.y, player.z + Math.cos(ang) * dist)
      e.setTarget(null)
    } catch (x) { }
  }

  var navWarned = false

  function keepDistance(player, e) {
    var want = DIST_NEAR + (DIST_FAR - DIST_NEAR) * healthFrac(player)
    var dx, dz, d
    try {
      dx = e.x - player.x; dz = e.z - player.z
      d = Math.sqrt(dx * dx + dz * dz)
    } catch (x) { return }
    if (Math.abs(d - want) <= BAND) return          // close enough; leave it be
    if (d > TELEPORT_AT) { placeBehind(player, e, want); return }   // off-screen: snap

    // Otherwise WALK it - pathing there looks like a creature deciding to move.
    var tx = player.x + (dx / (d || 1)) * want
    var tz = player.z + (dz / (d || 1)) * want
    var moved = false
    var cands = [
      function () { e.navigation.moveTo(tx, e.y, tz, 1.0); return true },
      function () { e.getNavigation().moveTo(tx, e.y, tz, 1.0); return true },
      function () { e.ai.navigation.moveTo(tx, e.y, tz, 1.0); return true },
    ]
    for (var i = 0; i < cands.length; i++) {
      try { if (cands[i]()) { moved = true; break } } catch (x) { }
    }
    if (!moved) {
      if (!navWarned) {
        navWarned = true
        console.warn('[stalker] no navigation API - repositioning behind the player instead')
      }
      placeBehind(player, e, want)
    }
    try { e.setTarget(null) } catch (x) { }
  }

  // ----------------------------------------------------------- C7: the Harvest
  function summonHarvest(player, pathKey) {
    var e = summon(player, pathKey, 6)
    if (!e) return null
    e.persistentData.putBoolean(HARVEST, true)
    // the ONE case that must not despawn - a boss fight that evaporates is worse
    // than no boss fight at all
    try { e.mergeNbt({ PersistenceRequired: 1 }) } catch (x) { }
    var st = STATS[pathKey]
    if (st) applyStats(e, st, HARVEST_MULT, pathKey)
    try { e.setCustomName(Text.of('§4§l' + CAST[pathKey][1])) } catch (x) { }
    try { e.setTarget(player) } catch (x) { }
    return e
  }

  function closeHarvest(server, player, won) {
    var b = readNotoriety(server, player)
    var day = b ? b.day : 0
    if (typeof VELDORA !== 'undefined' && typeof VELDORA.recordHarvest === 'function') {
      VELDORA.recordHarvest(server, player, won)
    } else {
      console.error('[stalker] !! VELDORA.recordHarvest missing - the cycle did NOT advance')
    }
    setAbsentUntil(server, player, day + ABSENT_DAYS)
    phaseStore(server, player, 'absence')
    dismiss(String(player.uuid))
  }

  function harvestWon(server, player, entity) {
    var pathKey = ''
    try { pathKey = entity.persistentData.getString(PATHKEY) } catch (x) { }

    // the line, first - before anything mechanical happens
    var line = FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)]
    player.tell(Text.of(''))
    player.tell(Text.of('§8§o' + line))
    player.tell(Text.of(''))

    // materials: a garnish, deliberately the least interesting part
    try { server.runCommandSilent('give ' + player.username + ' minecraft:diamond 3') } catch (x) { }

    // ESCROW - the real reward is losing the path and having to choose again
    var freed = ''
    if (typeof VELDORA !== 'undefined' && VELDORA.paths) {
      freed = VELDORA.paths.escrowFor(server, player)
    } else {
      console.error('[stalker] !! VELDORA.paths missing - the path was NOT escrowed')
    }
    if (freed) {
      var nm = VELDORA.paths.nameOf(freed)
      player.tell(Text.of('§7You set down §f' + nm + '§7.'))
      player.tell(Text.of('§7It is held for you. Choose again with §f/path§7 - the same, or another.'))
      player.tell(Text.of('§8Walk away without choosing and it opens to the others.'))
      server.tell(Text.of('§8' + player.username + ' killed what was hunting them, and set down ' + nm + '.'))
    }
    closeHarvest(server, player, true)
  }

  function harvestLost(server, player, entity) {
    wipeXp(server, player)
    player.tell(Text.of(''))
    player.tell(Text.of('§8§oIt took what it came for.'))
    player.tell(Text.of(''))
    closeHarvest(server, player, false)
    try { if (alive(entity)) entity.discard() } catch (x) { }
  }

  // ------------------------------------------------------------- C6: the phases
  function stateAll(server) { return server.persistentData.getCompound(STATE) }

  function phaseStored(server, player) {
    var all = stateAll(server), u = String(player.uuid)
    return all.contains(u) ? all.getCompound(u).getString('phase') : ''
  }
  function phaseStore(server, player, phase) {
    var all = stateAll(server), u = String(player.uuid)
    var rec = all.getCompound(u)
    rec.putString('phase', phase)
    all.put(u, rec)
    server.persistentData.put(STATE, all)
  }

  function bandOf(n) {
    for (var i = 0; i < BANDS.length; i++) {
      if (n >= BANDS[i][1] && n < BANDS[i][2]) return BANDS[i][0]
    }
    return 'helper'
  }

  // Hysteresis. Enchanting drops a player from 30 to 0 in one click, so without
  // stickiness the stalker would blink in and out all evening. A phase is only
  // left once the number is HYST clear of the band it is in.
  function resolvePhase(n, prev) {
    var now = bandOf(n)
    if (!prev || prev === now) return now
    for (var i = 0; i < BANDS.length; i++) {
      if (BANDS[i][0] !== prev) continue
      var lo = BANDS[i][1] - HYST
      var hi = BANDS[i][2] + HYST
      if (n >= lo && n < hi) return prev      // still inside the sticky range
    }
    return now
  }

  function readNotoriety(server, player) {
    if (typeof VELDORA === 'undefined' || typeof VELDORA.notoriety !== 'function') return null
    try {
      var b = VELDORA.notoriety(server, player)
      return (b && typeof b.value === 'number' && isFinite(b.value)) ? b : null
    } catch (x) { return null }
  }
  function notorietyOf(server, player) {
    var b = readNotoriety(server, player)
    return b === null ? null : b.value
  }

  // ---- C7 state: the 30-day absence -----------------------------------------
  function absentUntil(server, player) {
    var all = stateAll(server), u = String(player.uuid)
    return all.contains(u) ? all.getCompound(u).getInt('absentUntil') : 0
  }
  function setAbsentUntil(server, player, day) {
    var all = stateAll(server), u = String(player.uuid)
    var rec = all.getCompound(u)
    rec.putInt('absentUntil', day)
    all.put(u, rec)
    server.persistentData.put(STATE, all)
  }

  function isHarvestInstance(e) {
    try { return !!e && e.persistentData.getBoolean(HARVEST) } catch (x) { return false }
  }

  // The wipe. Verified at the point of USE - "I set it to 0" and "it is 0" are
  // different claims, and a silent failure here would let a player keep every
  // level after losing everything.
  function wipeXp(server, player) {
    var before = -1
    try { before = player.xpLevel } catch (x) { }
    var cands = [
      ['xp set command', function () { server.runCommandSilent('xp set ' + player.username + ' 0 levels') }],
      ['xpLevel setter', function () { player.xpLevel = 0 }],
      ['setExperienceLevels', function () { player.setExperienceLevels(0) }],
    ]
    for (var i = 0; i < cands.length; i++) {
      try {
        cands[i][1]()
        var after = player.xpLevel
        if (typeof after === 'number' && after === 0) {
          console.info('[stalker] XP wiped for ' + player.username + ' (' + before + ' -> 0) via ' + cands[i][0])
          return true
        }
      } catch (x) { }
    }
    console.error('[stalker] !! XP WIPE FAILED for ' + player.username + ' - still at ' + before)
    console.error('[stalker] !! The Harvest took nothing. That is a BUG, not a mercy.')
    return false
  }

  // The in-memory map is not the world's opinion. It is empty after every
  // restart, so orphans from the previous session are invisible to it and the
  // sweep cheerfully summons another one alongside them. That is how Ethan got
  // multiple Krampuses. Ask the world instead.
  // Returns an array, or NULL if the scan could not run. null is NOT "none" -
  // treating a failed scan as an empty world is what minted duplicate immortal
  // stalkers every time an owner walked 85 blocks away or through a portal.
  function findOwned(player) {
    var out = []
    try {
      var near = player.level.getEntitiesWithin(player.boundingBox.inflate(SCAN_RADIUS))
      for (var i = 0; i < near.length; i++) {
        var e = near[i]
        // fleeing ones are INCLUDED: a flee interrupted by a restart leaves an
        // immortal that nothing else can remove, since the guard cancels all
        // damage to it forever.
        if (isStalker(e) && ownerOf(e) === player.username && alive(e)) out.push(e)
      }
    } catch (x) { return null }
    return out
  }

  // null  = could not determine (caller must NOT summon)
  // false = determined, nothing there (caller may summon)
  function cull(player, uuid) {
    var owned = findOwned(player)
    if (owned === null) return null
    if (!owned.length) return false
    var keep = null
    for (var i = 0; i < owned.length; i++) if (isHarvestInstance(owned[i])) { keep = owned[i]; break }
    if (!keep) keep = owned[0]
    var killed = 0
    for (var j = 0; j < owned.length; j++) {
      if (owned[j] === keep) continue
      try { owned[j].discard(); killed++ } catch (x) { }
    }
    if (killed) console.warn('[stalker] culled ' + killed + ' duplicate stalker(s) for ' + player.username)
    // a stalker that was mid-flee is not a companion; drop it rather than adopt
    if (isFleeing(keep)) { try { keep.discard() } catch (x) { } ; delete live[uuid]; return false }
    live[uuid] = keep
    return keep
  }

  function dismiss(uuid) {
    var e = live[uuid]
    delete live[uuid]
    if (alive(e)) { try { e.discard() } catch (x) { } }
  }

  var warnedNoC1 = false
  function sweepPlayer(server, player) {
    var uuid = String(player.uuid)
    var b = readNotoriety(server, player)
    if (b === null) {
      if (!warnedNoC1) {
        warnedNoC1 = true
        console.warn('[stalker] C1 unreadable - NO phase logic is running for anyone.')
        console.warn('[stalker] That is a BUG, not a mode.')
      }
      return
    }
    var n = b.value

    var cur0 = live[uuid]
    if (!alive(cur0)) delete live[uuid]

    // THE 30-DAY ABSENCE after a Harvest, won or lost. It overrides every phase:
    // enough for you to forget what they did.
    if (b.day < absentUntil(server, player)) {
      if (live[uuid]) dismiss(uuid)
      return
    }

    var prev = phaseStored(server, player)
    var phase = resolvePhase(n, prev)
    if (phase !== prev) {
      phaseStore(server, player, phase)
      console.info('[stalker] ' + player.username + ' ' + (prev || '-') + ' -> ' + phase + ' (n=' + n + ')')
    }

    var cur = live[uuid]
    if (!alive(cur)) { delete live[uuid]; cur = null }
    // adopt orphans and kill duplicates - the costly scan, so not every pass
    var scanned = true
    if (sweepCount % CULL_EVERY === 0 || !cur) {
      var found = cull(player, uuid)
      if (found === null) { scanned = false }            // could not tell - do NOT summon
      else if (found) { cur = found }
      else { delete live[uuid]; cur = null }
    }

    // THE ABSENCE: gone. no warning, no message.
    if (phase === 'absence') {
      if (cur) dismiss(uuid)
      return
    }

    // NO PATH is a perfectly legitimate way to play (Ethan, 2026-08-05: "paths
    // can be opted out, that's fine"). It must be a clean state, not a wedged
    // one: nothing follows you, and the stored phase does not stick on 'harvest'
    // leaving you unprotected and unpaid with no signal that anything is wrong.
    var myPath = ''
    try { myPath = player.persistentData.getString('veldora_path') } catch (x) { }
    if (!myPath || !CAST[myPath]) {
      if (cur) dismiss(uuid)
      if (phase !== 'none') phaseStore(server, player, 'none')
      return
    }

    // THE HARVEST: it comes for you, and now it can die.
    if (phase === 'harvest') {
      if (cur && isHarvestInstance(cur)) return
      if (cur) dismiss(uuid)                       // a companion does not become the harvest
      var hk = myPath
      if (!scanned) return
      var he = summonHarvest(player, hk)
      if (he) {
        live[uuid] = he
        console.info('[stalker] HARVEST begun for ' + player.username + ' (' + hk + ')')
        player.tell(Text.of('§4§l' + CAST[hk][1] + '§c has come for you.'))
      }
      return
    }

    // THE HELPER only ever appears at low health - it is summoned by the damage
    // hook below, never by this sweep. But a player who enchants from 30 down to
    // 20 was leaving their Companion standing there indefinitely, which made
    // "the Helper appears ONLY at low health" plainly untrue.
    if (phase === 'helper') {
      if (cur && !isHarvestInstance(cur)) dismiss(uuid)
      return
    }

    // THE COMPANION: a tamed dog. Present, and kept on a leash.
    if (!cur) {
      if (!scanned) return                          // the scan failed: never summon blind
      var e = summon(player, myPath, DIST_FAR)
      if (e) { live[uuid] = e; console.info('[stalker] companion joined ' + player.username) }
      return
    }
    // 🚨 A Companion is still a Born in Chaos HOSTILE. Left alone its own AI
    // acquires the nearest player - which is its owner - and it mauls the person
    // it is supposed to be protecting. Nothing in C6 prevented that; the
    // owner-damage hook only ever SETS a target, it never clears a wrong one.
    // Outside the Harvest, the owner is never a valid target.
    try {
      var tgt = cur.getTarget()
      if (tgt && tgt.username === player.username) cur.setTarget(null)
    } catch (x) {
      try { if (cur.target && cur.target.username === player.username) cur.setTarget(null) } catch (y) { }
    }

    keepDistance(player, cur)
  }

  // The owner got hit. This is what makes a Helper appear, and what makes a
  // Companion retaliate - INCLUDING against another player, which is the whole
  // consequence layer PvP currently lacks.
  EntityEvents.beforeHurt(function (event) {
    var p = event.entity
    var isPlayer = false
    try { isPlayer = !!p && !!p.username } catch (x) { }
    if (!isPlayer || !SERVER) return

    // YOUR OWN STALKER CANNOT HURT YOU outside the Harvest. Clearing its target
    // on a 2s sweep is cosmetic; between sweeps its AI re-acquires and swings,
    // which is exactly how it was killing Ethan. This is the hard stop, and it is
    // event-driven so there is no window.
    var biter = attackerOf(event)
    if (biter && isStalker(biter) && ownerOf(biter) === p.username && !isHarvestInstance(biter)) {
      try { biter.setTarget(null) } catch (x) { }
      event.cancel()
      return
    }

    var uuid = String(p.uuid)
    var phase = phaseStored(SERVER, p)
    if (phase === 'absence' || phase === 'harvest') return

    var attacker = attackerOf(event)
    var cur = live[uuid]
    if (!alive(cur)) { delete live[uuid]; cur = null }

    if (cur) {
      if (attacker) { try { cur.setTarget(attacker) } catch (x) { } }
      return
    }

    if (phase !== 'helper') return

    // THE HELPER: only at genuinely low health. That gate is also what keeps the
    // bait exploit self-limiting - siccing it on someone means nearly dying first.
    var hp = 20, max = 20
    try { hp = p.health } catch (x) { }
    try { max = p.getAttribute('minecraft:generic.max_health').getValue() } catch (x) { }
    var dmg = damageOf(event)
    var after = (dmg === null) ? hp : (hp - dmg)
    if (after > max * HELPER_AT) return

    var pathKey = ''
    try { pathKey = p.persistentData.getString('veldora_path') } catch (x) { }
    if (!pathKey || !CAST[pathKey]) return

    var e = summon(p, pathKey, 10)
    if (!e) return
    live[uuid] = e
    // point it at the threat immediately; if there is no attacker (fall, lava)
    // make sure it does not default to the owner it came to help
    if (attacker) { try { e.setTarget(attacker) } catch (x) { } }
    else { try { e.setTarget(null) } catch (x) { } }
    console.info('[stalker] helper answered for ' + p.username + ' at ' + Math.round(after) + ' hp')
    SERVER.scheduleInTicks(HELPER_STAY, function () {
      if (live[uuid] === e) { delete live[uuid]; if (alive(e)) flee(e, 'helper visit over') }
    })
  })

  // -------------------------------------------------------------------- boot
  function sweep(server) {
    sweepCount++
    // PER PLAYER, not per loop. The try used to wrap the whole loop, so one
    // deterministic fault on the first player silently starved everyone behind
    // them in the list - which is exactly what the undefined-helper bug would
    // have done to all four of them at once.
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        try { sweepPlayer(server, players[i]) }
        catch (one) { console.warn('[stalker] sweep threw for ' + players[i].username + ' :: ' + one) }
      }
    } catch (e) { console.warn('[stalker] sweep loop threw :: ' + e) }
    server.scheduleInTicks(SWEEP, function () { sweep(server) })
  }

  ServerEvents.loaded(function (event) {
    SERVER = event.server
    live = {}
    console.info('[stalker] C5 active - flee at ' + Math.round(FLEE_AT * 100) +
      '% health, ' + Object.keys(CAST).length + ' castings, scale x' + SCALE)
    console.info('[stalker] C6 active - sweep ' + SWEEP + 't, hysteresis ' + HYST +
      ', helper at ' + Math.round(HELPER_AT * 100) + '% owner health')
    console.info('[stalker] C7 active - harvest x' + HARVEST_MULT.health +
      ' health, ' + ABSENT_DAYS + '-day absence, ' + FRAGMENTS.length + ' fragments')
    console.info('[stalker] a stalker DEATH will log an INVARIANT BREACH banner')
    event.server.scheduleInTicks(SWEEP, function () { sweep(event.server) })
  })

  // ------------------------------------------------------------------ commands
  // ADMIN GATE. Everything that can mint items, force a boss, or opt a player out
  // of the hunt is level 2. It FAILS CLOSED - if hasPermission ever throws, the
  // answer is no. On a four-player server with a brother, /stalker harvest was
  // three diamonds a go on repeat and /notoriety_setday was a permanent opt-out
  // of the one thing the design says you cannot opt out of.
  function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    var root = Commands.literal('stalker')

    root = root.then(Commands.literal('clear').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var n = 0
      try {
        var near = p.level.getEntitiesWithin(p.boundingBox.inflate(128))
        for (var i = 0; i < near.length; i++) if (isStalker(near[i])) { near[i].discard(); n++ }
      } catch (e) { p.tell(Text.of('§c' + e)) }
      delete live[String(p.uuid)]
      p.tell(Text.of('§7Cleared §f' + n + '§7 stalker(s) within 128 blocks.'))
      return 1
    }))

    root = root.then(Commands.literal('harvest').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var hk = ''
      try { hk = p.persistentData.getString('veldora_path') } catch (x) { }
      if (!hk || !CAST[hk]) { p.tell(Text.of('§cWalk a path first: /path <name>')); return 0 }
      dismiss(String(p.uuid))
      setAbsentUntil(srv, p, 0)
      phaseStore(srv, p, 'harvest')
      var e = summonHarvest(p, hk)
      if (!e) { p.tell(Text.of('§ccould not summon')); return 0 }
      live[String(p.uuid)] = e
      p.tell(Text.of('§4§l' + CAST[hk][1] + '§c has come for you.'))
      p.tell(Text.of('§8It CAN die now. Kill it, or let it kill you - both close the cycle.'))
      p.tell(Text.of('§8health §f' + Math.round(maxHealthOf(e)) + '§8 (x' + HARVEST_MULT.health + ')'))
      return 1
    }))

    root = root.then(Commands.literal('phase').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var n = notorietyOf(srv, p)
      var stored = phaseStored(srv, p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7notoriety §f' + (n === null ? '§cUNREADABLE' : n)))
      p.tell(Text.of('§7raw band  §f' + (n === null ? '?' : bandOf(n))))
      p.tell(Text.of('§7stored    §f' + (stored || '§8none yet')))
      p.tell(Text.of('§8  hysteresis ' + HYST + ': the stored phase only changes once'))
      p.tell(Text.of('§8  notoriety is ' + HYST + ' clear of its band'))
      var au = absentUntil(srv, p)
      var bb = readNotoriety(srv, p)
      if (bb && bb.day < au) {
        p.tell(Text.of('§7absent    §funtil day ' + au + ' §8(today is ' + bb.day + ')'))
      }
      var cur = live[String(p.uuid)]
      p.tell(Text.of('§7stalker   §f' + (alive(cur) ? cur.type +
        (isHarvestInstance(cur) ? ' §4§lHARVEST' : '') : '§8none present')))
      return 1
    }))

    Object.keys(CAST).forEach(function (key) {
      root = root.then(Commands.literal(key).requires(ADMIN).executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        var e = summon(p, key, DIST_FAR)
        if (!e) { p.tell(Text.of('§ccould not summon ' + key)); return 0 }
        p.tell(Text.of('§7Summoned §f' + CAST[key][1] + ' §8(' + CAST[key][0] + ')'))
        p.tell(Text.of('§7max health §f' + Math.round(maxHealthOf(e)) +
          ' §8· flees below §f' + Math.round(maxHealthOf(e) * FLEE_AT)))
        return 1
      }))
    })

    event.register(root)
  })
})()
