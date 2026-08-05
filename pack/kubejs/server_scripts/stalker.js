// stalker.js — C5 of the Stalker build.  docs/19-STALKER-BUILD.md
//
// THE INVARIANT: in phases 1–3 the stalker cannot die. Below the flee threshold
// the incoming damage is CANCELLED, it leaves, and it is discarded. If a stalker
// dies even once, every player learns it is killable and the illusion is over
// permanently. This chunk has no partial credit.
//
// ── How the guard actually works ─────────────────────────────────────────────
// It is PRE-EMPTIVE, not reactive. We do not watch health and react when it gets
// low — a single large hit would land before any sweep could run. Instead every
// incoming hit is inspected BEFORE it applies, and if it would cross the
// threshold it is cancelled ENTIRELY. Health therefore can never go below the
// threshold, no matter how large the blow.
//
// Damage that would NOT cross the threshold is allowed through, so friends
// helping in a fight genuinely push it toward leaving (design rule 4.3).
//
// ── C0 findings this chunk is built on ───────────────────────────────────────
//  · the event is EntityEvents.beforeHurt — `hurt` does not exist, and a wrong
//    event name logs one line at boot and then silently never fires
//  · event.cancel() unwinds by THROWING KubeJS's EventExit. It must never sit
//    inside a try/catch or the cancellation is silently swallowed — this
//    produced a false FAIL during C0 before it was spotted
//  · attribute ids are minecraft:generic.*
;(function () {
  var OWNER = 'veldora_stalker_owner'   // entity persistentData: owner username
  var PATHKEY = 'veldora_stalker_path'
  var FLEEING = 'veldora_stalker_fleeing'
  var FLEE_AT = 0.35                    // fraction of max health
  var SCALE = 1.25

  // Names are taken from Ethan's own reasoning for each casting rather than
  // invented here ("the thief of Christmas", "a challenger to test the mettle",
  // "the false king"). Trivial to change.
  var CAST = {
    forge:   ['born_in_chaos_v1:krampus', 'The Thief'],
    art:     ['born_in_chaos_v1:nightmare_stalker', 'The Nightmare'],
    blade:   ['born_in_chaos_v1:lord_pumpkinhead', 'The Challenger'],
    salvage: ['born_in_chaos_v1:dire_hound_leader', 'The Hound'],
    crown:   ['born_in_chaos_v1:missioner', 'The False King'],
    wall:    ['born_in_chaos_v1:mother_spider', 'The Mother'],
  }

  var SERVER = null
  var damageAccessorLogged = false

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

  // The damage amount, or null if this runtime does not expose it. null is NOT
  // zero — the caller treats "unreadable" as the worst case, never as "harmless".
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
      console.warn('[stalker] Falling back to worst-case: any hit at or below ' +
        Math.round(FLEE_AT * 200) + '% health triggers the flee. Safe, but blunt.')
    }
    return null
  }

  // ------------------------------------------------------------------- fleeing
  function flee(e, why) {
    if (isFleeing(e)) return
    try { e.persistentData.putBoolean(FLEEING, true) } catch (x) { }
    var who = ownerOf(e)
    console.info('[stalker] ' + (e.type || '?') + ' fleeing from ' + who + ' (' + why + ')')
    try { e.setGlowing(false) } catch (x) { }
    try { e.potionEffects.add('minecraft:invisibility', 60, 0, false, false) } catch (x) { }
    try { e.potionEffects.add('minecraft:speed', 60, 3, false, false) } catch (x) { }
    try { e.setTarget(null) } catch (x) { }
    // leave clean: no corpse, no ragdoll, nothing to inspect
    var srv = SERVER
    if (srv) {
      srv.scheduleInTicks(30, function () {
        try { if (e && e.isAlive()) e.discard() } catch (x) { }
      })
    } else {
      try { e.discard() } catch (x) { }
    }
  }

  // --------------------------------------------------------------- THE GUARD
  EntityEvents.beforeHurt(function (event) {
    var e = event.entity
    if (!isStalker(e)) return

    // Already leaving: nothing may touch it on the way out.
    if (isFleeing(e)) { event.cancel(); return }

    var hp = 20, max = 20
    try { hp = e.health } catch (x) { }
    max = maxHealthOf(e)
    var threshold = max * FLEE_AT

    var dmg = damageOf(event)
    // Unreadable damage is treated as a worst-case blow, never as harmless.
    var after = (dmg === null) ? -1 : (hp - dmg)

    if (after > threshold) return          // survivable: let it land, friends can push

    // This hit would cross the line. Cancel it ENTIRELY - health never drops
    // below the threshold, so no blow of any size can finish it.
    flee(e, 'health would fall to ' + (dmg === null ? 'unknown' : Math.round(after)) +
      ' of ' + Math.round(max))
    event.cancel()                          // MUST be outside any try/catch (C0)
  })

  // It pays nothing, in any phase. A stalker that drops anything stops being a
  // predator and becomes a resource.
  EntityEvents.drops(function (event) {
    if (!isStalker(event.entity)) return
    event.cancel()
  })

  // The invariant's alarm. If this ever fires, C5 is broken and we need to know
  // immediately rather than hearing about it from a player weeks later.
  EntityEvents.death(function (event) {
    if (!isStalker(event.entity)) return
    console.error('[stalker] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.error('[stalker] !! INVARIANT BREACH: a stalker DIED.')
    console.error('[stalker] !! owner=' + ownerOf(event.entity) + ' type=' + event.entity.type)
    try { console.error('[stalker] !! source=' + event.source.type()) } catch (x) { }
    console.error('[stalker] !! C5 is NOT signed off. Find the route and close it.')
    console.error('[stalker] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  })

  // ------------------------------------------------------------------ summoning
  function summon(server, player, pathKey) {
    var spec = CAST[pathKey]
    if (!spec) return null
    var lvl = player.level
    var e = lvl.createEntity(spec[0])
    if (!e) return null

    // 4 blocks in front, at the player's feet
    e.setPos(player.x + 4, player.y, player.z)
    e.persistentData.putString(OWNER, player.username)
    e.persistentData.putString(PATHKEY, pathKey)
    e.setCustomName(Text.of('§c' + spec[1]))
    e.setCustomNameVisible(true)

    e.spawn()

    // after spawn: mark it as singular. A common species must not read as one of
    // many - Mother Spider is weight 13 in the wild, so this matters most there.
    try { e.getAttribute('minecraft:generic.scale').setBaseValue(SCALE) } catch (x) {
      console.warn('[stalker] scale bump failed :: ' + x)
    }
    try { e.setGlowing(true) } catch (x) { }
    try { e.setPersistenceRequired(true) } catch (x) {
      try { e.mergeNbt({ PersistenceRequired: 1 }) } catch (y) { }
    }
    return e
  }

  ServerEvents.loaded(function (event) {
    SERVER = event.server
    console.info('[stalker] C5 active - flee at ' + Math.round(FLEE_AT * 100) +
      '% health, ' + Object.keys(CAST).length + ' castings, scale x' + SCALE)
    console.info('[stalker] a stalker DEATH will log an INVARIANT BREACH banner')
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
        for (var i = 0; i < near.length; i++) {
          if (isStalker(near[i])) { near[i].discard(); n++ }
        }
      } catch (e) { p.tell(Text.of('§c' + e)) }
      p.tell(Text.of('§7Cleared §f' + n + '§7 stalker(s) within 128 blocks.'))
      return 1
    }))

    Object.keys(CAST).forEach(function (key) {
      root = root.then(Commands.literal(key).executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        var e = summon(ctx.source.server, p, key)
        if (!e) { p.tell(Text.of('§ccould not summon ' + key)); return 0 }
        p.tell(Text.of('§8§m                                        '))
        p.tell(Text.of('§7Summoned §f' + CAST[key][1] + ' §8(' + CAST[key][0] + ')'))
        p.tell(Text.of('§7max health §f' + Math.round(maxHealthOf(e)) +
          ' §8· flees below §f' + Math.round(maxHealthOf(e) * FLEE_AT)))
        p.tell(Text.of('§8Now try to kill it. Every route:'))
        p.tell(Text.of('§8  melee burst · bow · fall · lava · void · /kill'))
        p.tell(Text.of('§8  suffocation · cactus · drowning · TNT · chunk unload'))
        p.tell(Text.of('§c  Any death at all logs an INVARIANT BREACH and fails C5.'))
        return 1
      }))
    })

    event.register(root)
  })
})()
