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
  var SWEEP = 40                          // ticks between phase sweeps (2s)
  var HYST = 3                            // notoriety points of stickiness at every edge
  var HELPER_AT = 0.35                    // owner health fraction that summons the Helper
  var HELPER_STAY = 100                   // ticks the Helper lingers (5s)
  var LEASH = 24                          // blocks before the Companion is pulled back

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

  // The damage amount, or null if unreadable. null is NOT zero — the caller
  // treats "unreadable" as the worst case, never as "harmless".
  function damageOf(event) {
    var cands = [
      ['event.damage', function () { return event.damage }],
      ['event.getDamage()', function () { return event.getDamage() }],
      ['event.amount', function () { return event.amount }],
      ['event.getAmount()', function () { return event.getAmount() }],
    ]
    for (var i = 0; i < cands.length; i++) {
      try {
        var v = cands[i][1]()
        if (typeof v === 'number' && isFinite(v)) {
          if (!damageAccessorLogged) {
            damageAccessorLogged = true
            console.info('[stalker] damage amount read via ' + cands[i][0])
          }
          return v
        }
      } catch (x) { }
    }
    if (!damageAccessorLogged) {
      damageAccessorLogged = true
      console.warn('[stalker] NO damage accessor works on beforeHurt.')
      console.warn('[stalker] Falling back to worst-case: any hit triggers the flee. Blunt but safe.')
    }
    return null
  }

  // Who threw the punch. C0 found src.getEntity() throws and zero-arg accessors
  // read back as METHODS when touched as properties, so every candidate is
  // called and type-checked.
  function attackerOf(event) {
    var src = null
    try { src = event.source } catch (x) { return null }
    if (!src) return null
    var cands = [
      ['source.actor', function () { return src.actor }],
      ['source.player', function () { return src.player }],
      ['source.entity', function () { return src.entity }],
      ['source.directEntity', function () { return src.directEntity }],
      ['source.getEntity()', function () { return src.getEntity() }],
      ['source.getDirectEntity()', function () { return src.getDirectEntity() }],
    ]
    for (var i = 0; i < cands.length; i++) {
      try {
        var v = cands[i][1]()
        if (v && typeof v !== 'function' && alive(v)) {
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
    try { e.setGlowing(false) } catch (x) { }
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
    event.cancel()
  })

  // The invariant's alarm.
  EntityEvents.death(function (event) {
    if (!isStalker(event.entity)) return
    console.error('[stalker] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.error('[stalker] !! INVARIANT BREACH: a stalker DIED.')
    console.error('[stalker] !! owner=' + ownerOf(event.entity) + ' type=' + event.entity.type)
    try { console.error('[stalker] !! source=' + event.source.type()) } catch (x) { }
    console.error('[stalker] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  })

  // ------------------------------------------------------------------ summoning
  function summon(player, pathKey, near) {
    var spec = CAST[pathKey]
    if (!spec) return null
    var e = player.level.createEntity(spec[0])
    if (!e) return null
    var d = near || 4
    e.setPos(player.x + d, player.y, player.z)
    e.persistentData.putString(OWNER, player.username)
    e.persistentData.putString(PATHKEY, pathKey)
    e.setCustomName(Text.of('§c' + spec[1]))
    e.setCustomNameVisible(true)
    e.spawn()

    // stats first, health last - setting health before max_health clamps it
    var st = STATS[pathKey]
    if (st) {
      try { e.getAttribute('minecraft:generic.max_health').setBaseValue(st.health) } catch (x) { }
      try { e.getAttribute('minecraft:generic.attack_damage').setBaseValue(st.damage) } catch (x) { }
      try { e.getAttribute('minecraft:generic.armor').setBaseValue(st.armor) } catch (x) { }
      try { e.setHealth(st.health) } catch (x) { }
    }
    try { e.getAttribute('minecraft:generic.scale').setBaseValue(SCALE) } catch (x) { }
    try { e.setGlowing(true) } catch (x) { }

    // setPersistenceRequired(boolean) DOES NOT EXIST here - it throws
    // "Can't find method Mob.setPersistenceRequired(boolean)". NBT is the route,
    // and it is tried FIRST rather than as a fallback behind a call we know fails.
    // Without this a stalker despawns on its own and the illusion dies quietly.
    var persisted = false
    try { e.mergeNbt({ PersistenceRequired: 1 }); persisted = true } catch (x) {
      try { e.setPersistenceRequired(); persisted = true } catch (y) { }
    }
    if (!persisted) console.warn('[stalker] could not pin persistence - it may despawn on its own')
    return e
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

  function notorietyOf(server, player) {
    if (typeof VELDORA === 'undefined' || typeof VELDORA.notoriety !== 'function') return null
    try {
      var b = VELDORA.notoriety(server, player)
      return (b && typeof b.value === 'number' && isFinite(b.value)) ? b.value : null
    } catch (x) { return null }
  }

  function dismiss(uuid) {
    var e = live[uuid]
    delete live[uuid]
    if (alive(e)) { try { e.discard() } catch (x) { } }
  }

  var warnedNoC1 = false
  function sweepPlayer(server, player) {
    var uuid = String(player.uuid)
    var n = notorietyOf(server, player)
    if (n === null) {
      if (!warnedNoC1) {
        warnedNoC1 = true
        console.warn('[stalker] C1 unreadable - NO phase logic is running for anyone.')
        console.warn('[stalker] That is a BUG, not a mode.')
      }
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

    // THE ABSENCE, and the Harvest (C7's business): nothing of ours stands here.
    if (phase === 'absence' || phase === 'harvest') {
      if (cur) dismiss(uuid)
      return
    }

    // THE HELPER only ever appears at low health - it is summoned by the damage
    // hook below, never by this sweep. All the sweep does is expire it.
    if (phase === 'helper') return

    // THE COMPANION: a tamed dog. Present, and kept on a leash.
    if (!cur) {
      var pathKey = ''
      try { pathKey = player.persistentData.getString('veldora_path') } catch (x) { }
      if (!pathKey || !CAST[pathKey]) return        // no path, no stalker
      var e = summon(player, pathKey, 6)
      if (e) { live[uuid] = e; console.info('[stalker] companion joined ' + player.username) }
      return
    }
    try {
      var dx = cur.x - player.x, dy = cur.y - player.y, dz = cur.z - player.z
      if ((dx * dx + dy * dy + dz * dz) > LEASH * LEASH) {
        cur.setPos(player.x + 3, player.y, player.z + 3)
      }
    } catch (x) { }
  }

  // The owner got hit. This is what makes a Helper appear, and what makes a
  // Companion retaliate - INCLUDING against another player, which is the whole
  // consequence layer PvP currently lacks.
  EntityEvents.beforeHurt(function (event) {
    var p = event.entity
    var isPlayer = false
    try { isPlayer = !!p && !!p.username } catch (x) { }
    if (!isPlayer || !SERVER) return

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

    var e = summon(p, pathKey, 3)
    if (!e) return
    live[uuid] = e
    if (attacker) { try { e.setTarget(attacker) } catch (x) { } }
    console.info('[stalker] helper answered for ' + p.username + ' at ' + Math.round(after) + ' hp')
    SERVER.scheduleInTicks(HELPER_STAY, function () {
      if (live[uuid] === e) { delete live[uuid]; if (alive(e)) flee(e, 'helper visit over') }
    })
  })

  // -------------------------------------------------------------------- boot
  function sweep(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) sweepPlayer(server, players[i])
    } catch (e) { console.warn('[stalker] sweep threw :: ' + e) }
    server.scheduleInTicks(SWEEP, function () { sweep(server) })
  }

  ServerEvents.loaded(function (event) {
    SERVER = event.server
    live = {}
    console.info('[stalker] C5 active - flee at ' + Math.round(FLEE_AT * 100) +
      '% health, ' + Object.keys(CAST).length + ' castings, scale x' + SCALE)
    console.info('[stalker] C6 active - sweep ' + SWEEP + 't, hysteresis ' + HYST +
      ', helper at ' + Math.round(HELPER_AT * 100) + '% owner health')
    console.info('[stalker] a stalker DEATH will log an INVARIANT BREACH banner')
    event.server.scheduleInTicks(SWEEP, function () { sweep(event.server) })
  })

  // ------------------------------------------------------------------ commands
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    var root = Commands.literal('stalker')

    root = root.then(Commands.literal('clear').executes(function (ctx) {
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
      var cur = live[String(p.uuid)]
      p.tell(Text.of('§7stalker   §f' + (alive(cur) ? cur.type : '§8none present')))
      return 1
    }))

    Object.keys(CAST).forEach(function (key) {
      root = root.then(Commands.literal(key).executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        var e = summon(p, key, 4)
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
