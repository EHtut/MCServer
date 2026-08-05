// _probe_stalker.js — C0 capability probe for the Stalker build.
// THROWAWAY. Delete after C0's audit gate passes. Writes nothing, changes nothing.
//
// Every capability the design assumes is tried here, with MULTIPLE candidate
// accessors, because the point of a probe is to discover the API rather than to
// assume it. Three distinct verdicts, never collapsed into one:
//   PASS   - a candidate worked, and we log WHICH one
//   ABSENT - the call succeeded but returned null/undefined
//   THREW  - every candidate threw
(function () {
  var TAG = '[C0]'
  var results = []

  function say(line) { console.info(TAG + ' ' + line) }

  // try candidates in order; report the first that yields a non-null value
  function probe(n, name, cands) {
    for (var i = 0; i < cands.length; i++) {
      var label = cands[i][0], fn = cands[i][1]
      try {
        var v = fn()
        if (v !== null && v !== undefined) {
          results.push([n, 'PASS', name, label + ' => ' + v])
          return v
        }
      } catch (e) { /* try the next candidate */ }
    }
    // nothing returned a value - distinguish "all threw" from "all returned null"
    var threw = 0
    for (var j = 0; j < cands.length; j++) {
      try { cands[j][1]() } catch (e2) { threw++ }
    }
    results.push([n, threw === cands.length ? 'THREW' : 'ABSENT', name,
      threw + '/' + cands.length + ' candidates threw'])
    return null
  }

  // an action with no return value: PASS if it does not throw
  function act(n, name, label, fn) {
    try { fn(); results.push([n, 'PASS', name, label]); return true }
    catch (e) { results.push([n, 'THREW', name, label + ' :: ' + e]); return false }
  }

  function dump(title) {
    say('================ ' + title + ' ================')
    for (var i = 0; i < results.length; i++) {
      var r = results[i]
      say(('#' + r[0]).padEnd(4) + r[1].padEnd(7) + String(r[2]).padEnd(34) + r[3])
    }
    var fails = results.filter(function (r) { return r[1] !== 'PASS' })
    say('---- ' + (results.length - fails.length) + '/' + results.length + ' PASS ----')
    if (fails.length) {
      say('!! EVERY FAILURE NEEDS A NAMED FALLBACK BEFORE C1 !!')
      for (var k = 0; k < fails.length; k++) say('   !! #' + fails[k][0] + ' ' + fails[k][2])
    }
    results = []
  }

  // ---------------------------------------------------------------- headless
  ServerEvents.loaded(function (event) {
    var server = event.server
    var lvl = null
    try { lvl = server.overworld() } catch (e) { try { lvl = server.getLevel('minecraft:overworld') } catch (e2) {} }

    // 3. current in-game day
    probe(3, 'in-game day', [
      ['overworld.dayTime()/24000', function () { return Math.floor(lvl.dayTime() / 24000) }],
      ['overworld.getDayTime()/24000', function () { return Math.floor(lvl.getDayTime() / 24000) }],
      ['overworld.time/24000', function () { return Math.floor(lvl.time / 24000) }],
    ])

    // 4. server.persistentData nested read/write  (paths.js already relies on this)
    probe(4, 'server persistentData', [
      ['put/getString', function () {
        server.persistentData.putString('c0_probe', 'ok')
        return server.persistentData.getString('c0_probe')
      }],
    ])
    probe(4.1, '  nested compound', [
      ['getCompound put/get', function () {
        var c = server.persistentData.getCompound('c0_nest')
        c.putInt('n', 42)
        server.persistentData.put('c0_nest', c)
        return server.persistentData.getCompound('c0_nest').getInt('n')
      }],
    ])

    // 13. repeating timer that is not a per-tick hook
    probe(13, 'scheduled timer', [
      ['server.scheduleInTicks', function () { server.scheduleInTicks(20, function () {}); return 'scheduled' }],
      ['Utils.server.schedule', function () { Utils.server.scheduleInTicks(20, function () {}); return 'scheduled' }],
    ])

    // ---- entity-side probes, on a throwaway zombie at world spawn ----
    var e = null
    probe(7.1, 'spawn vanilla entity', [
      ['createEntity+spawn', function () {
        e = lvl.createEntity('minecraft:zombie')
        e.setPos(lvl.spawnLocation ? lvl.spawnLocation.x : 0, 320, 0)
        e.spawn()
        return e.type
      }],
    ])

    if (e) {
      // 8. name / visible name / scale
      act(8, 'custom name', 'setCustomName', function () { e.setCustomName(Text.of('C0 Probe')) })
      act(8.1, '  name visible', 'setCustomNameVisible', function () { e.setCustomNameVisible(true) })
      probe(8.2, '  scale attribute', [
        ['getAttribute(minecraft:scale)', function () {
          var a = e.getAttribute('minecraft:scale'); a.setBaseValue(1.5); return a.getBaseValue()
        }],
        ['attributes scale via nbt', function () { e.mergeNbt({ attributes: [{ id: 'minecraft:scale', base: 1.5 }] }); return 'nbt-merged' }],
      ])

      // 6. attribute modifiers (same API surface as on a player)
      probe(6, 'attribute read', [
        ['getAttribute(max_health).getBaseValue', function () { return e.getAttribute('minecraft:max_health').getBaseValue() }],
        ['getAttributeValue', function () { return e.getAttributeValue('minecraft:max_health') }],
      ])
      probe(6.1, '  modifier add (stable id)', [
        ['addPermanentModifier', function () {
          var a = e.getAttribute('minecraft:max_health')
          a.addPermanentModifier({ id: 'mcserver:c0_probe', amount: 4, operation: 'add_value' })
          return e.getAttribute('minecraft:max_health').getValue()
        }],
        ['addTransientModifier', function () {
          var a = e.getAttribute('minecraft:max_health')
          a.addTransientModifier({ id: 'mcserver:c0_probe', amount: 4, operation: 'add_value' })
          return e.getAttribute('minecraft:max_health').getValue()
        }],
      ])
      probe(6.2, '  modifier remove by id', [
        ['removeModifier(id)', function () {
          e.getAttribute('minecraft:max_health').removeModifier('mcserver:c0_probe')
          return e.getAttribute('minecraft:max_health').getValue()
        }],
      ])

      // 11. force a mob's target
      probe(11, 'force mob target', [
        ['setTarget(self-ish)', function () { e.setTarget(null); return 'setTarget accepted' }],
        ['ai.setTarget', function () { e.ai.setTarget(null); return 'ai.setTarget accepted' }],
      ])

      // 10. discard
      act(10, 'discard entity', 'entity.discard()', function () { e.discard() })
    }

    // 7. does a Born in Chaos entity id resolve + spawn?
    var k = null
    probe(7, 'spawn born_in_chaos entity', [
      ['createEntity(krampus)+spawn', function () {
        k = lvl.createEntity('born_in_chaos_v1:krampus')
        k.setPos(0, 320, 0)
        k.spawn()
        return k.type
      }],
    ])
    if (k) { act(7.2, '  and discard it', 'discard()', function () { k.discard() }) }

    dump('HEADLESS PROBES (server-only)')
    say('AWAITING A PLAYER for #1 #2 #5 #9 #12 — log in once and they run automatically.')
  })

  // ------------------------------------------------------- needs a real player
  PlayerEvents.loggedIn(function (event) {
    var p = event.player

    // 1. read XP level
    probe(1, 'read player XP level', [
      ['player.xpLevel', function () { return p.xpLevel }],
      ['player.experienceLevel', function () { return p.experienceLevel }],
      ['player.getXpLevel()', function () { return p.getXpLevel() }],
    ])

    // 2. SET XP level (the Harvest wipe) - read it, set it, restore it
    probe(2, 'set player XP level', [
      ['xpLevel setter', function () {
        var before = p.xpLevel
        p.xpLevel = before
        return 'settable (held at ' + before + ')'
      }],
      ['setExperienceLevels', function () { p.setExperienceLevels(p.xpLevel); return 'setExperienceLevels ok' }],
    ])

    // 5. player.persistentData — does it survive DEATH?
    //    (we only prove the store works here; the death half is a manual step)
    probe(5, 'player persistentData', [
      ['put/getString', function () {
        p.persistentData.putString('c0_probe', 'set-at-login')
        return p.persistentData.getString('c0_probe')
      }],
    ])
    say('#5 MANUAL STEP: run /c0check, then die, then run /c0check again.')
    say('   If the value is gone after death, per-player state MUST live on')
    say('   server.persistentData keyed by UUID (build plan rule 5).')

    dump('PLAYER PROBES (' + p.username + ')')
  })

  // 9. cancel damage to a specific entity   12. death exposes a damage source
  EntityEvents.beforeHurt(function (event) {
    // NOTE: event.cancel() unwinds by THROWING KubeJS's EventExit. Wrapping it in
    // a try/catch swallows that unwind and the cancellation never lands - which
    // is exactly how round six produced a false FAIL. Read the flag defensively,
    // then call cancel() OUTSIDE any catch.
    var flagged = false
    try { flagged = !!(event.entity && event.entity.persistentData.getBoolean('c0_shield')) } catch (e) {}
    if (flagged) {
      console.info(TAG + ' #9 beforeHurt fired on the flagged entity; cancelling')
      event.cancel()
    }
  })

  EntityEvents.death(function (event) {
    try {
      if (!event.entity || !event.entity.persistentData.getBoolean('c0_watch')) return
      var src = event.source
      // Rhino hands back the METHOD when you read a zero-arg accessor as a
      // property, so every one of these must be CALLED, not read.
      var probes = [
        ['type()', function () { return src.type() }],
        ['getMsgId()', function () { return src.getMsgId() }],
        ['getEntity()', function () { return src.getEntity() }],
        ['getDirectEntity()', function () { return src.getDirectEntity() }],
        ['player (prop)', function () { return src.player }],
        ['actor (prop)', function () { return src.actor }],
        ['entity (prop)', function () { return src.entity }],
        ['directEntity (prop)', function () { return src.directEntity }],
        ['getLocalizedDeathMessage', function () { return src.getLocalizedDeathMessage(event.entity).getString() }],
      ]
      for (var i = 0; i < probes.length; i++) {
        try { console.info(TAG + ' #12 ' + probes[i][0] + ' => ' + probes[i][1]()) }
        catch (e) { console.info(TAG + ' #12 ' + probes[i][0] + ' THREW') }
      }
    } catch (e) { console.info(TAG + ' #12 THREW ' + e) }
  })

  // /c0check — persistence across death, and the two live-fire probes
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands, Arguments = event.arguments
    event.register(Commands.literal('c0check')
      .executes(function (ctx) {
        var p = ctx.source.player
        var v = p.persistentData.getString('c0_probe')
        p.tell(Text.of('[C0] player.persistentData c0_probe = "' + v + '"' +
          (v ? '' : '  <-- EMPTY: wiped, or never set')))
        return 1
      }))
    event.register(Commands.literal('c0fire')
      .executes(function (ctx) {
        var p = ctx.source.player, lvl = p.level
        var z = lvl.createEntity('minecraft:zombie')
        z.setPos(p.x + 2, p.y, p.z)
        z.persistentData.putBoolean('c0_shield', true)
        z.persistentData.putBoolean('c0_watch', true)
        z.setCustomName(Text.of('C0 Shielded'))
        z.setCustomNameVisible(true)
        z.spawn()
        p.tell(Text.of('[C0] Shielded zombie spawned. Hit it (#9 should cancel), then /kill it (#12 should log a source).'))
        return 1
      }))
  })
})()
