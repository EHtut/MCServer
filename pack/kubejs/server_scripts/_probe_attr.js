// _probe_attr.js - THROWAWAY. Re-auditing C4, which I passed too early.
//
// C4 concluded "6/6 summonable" by calling isAlive() in the SAME TICK as spawn().
// But /summon proves the mod does not BLOCK creation - it reports "Summoned new
// Krampus" and then the entity is gone a moment later. The toggle REMOVES the
// mob shortly after it appears. Measuring at t+0 cannot see that.
//
// So: spawn one via the KubeJS path and ask again at +20t, +100t and +200t. If it
// is gone by any of them, C4 is wrong and the whole casting needs another route.
(function () {
  var TAG = '[C4b]'
  function say(s) { console.info(TAG + ' ' + s) }
  ServerEvents.loaded(function (event) {
    var server = event.server, lvl = server.overworld()
    var subjects = [
      ['born_in_chaos_v1:krampus', 'DISABLED'],
      ['born_in_chaos_v1:mother_spider', 'DISABLED'],
      ['born_in_chaos_v1:lord_pumpkinhead', 'no toggle - control'],
    ]
    var made = []
    for (var i = 0; i < subjects.length; i++) {
      try {
        var e = lvl.createEntity(subjects[i][0])
        e.setPos(i * 8, 320, 0)
        e.persistentData.putString('veldora_stalker_owner', 'C4B_TEST')
        e.spawn()
        // setPersistenceRequired(boolean) does not exist here; NBT is the route.
        var persisted = 'none'
        try { e.mergeNbt({ PersistenceRequired: 1 }); persisted = 'mergeNbt' } catch (x1) {
          try { e.setPersistenceRequired(); persisted = 'no-arg' } catch (x2) { }
        }
        made.push([subjects[i][0], subjects[i][1], e])
        say('spawned ' + subjects[i][0] + ' (' + subjects[i][1] + ')  persistence=' + persisted)
      } catch (err) { say('THREW ' + subjects[i][0] + ' :: ' + err) }
    }
    function check(t) {
      server.scheduleInTicks(t, function () {
        var line = 't+' + t + 't  '
        for (var j = 0; j < made.length; j++) {
          var a = false
          try { a = made[j][2].isAlive() } catch (x) { }
          line += made[j][0].split(':')[1] + '=' + (a ? 'ALIVE' : 'GONE') + '  '
        }
        say(line)
        if (t === 200) {
          var survivors = 0
          for (var k = 0; k < made.length; k++) {
            try { if (made[k][2].isAlive()) { survivors++; made[k][2].discard() } } catch (x) { }
          }
          say(made.length === 0 ? 'VERDICT: INVALID - nothing spawned, this run proves nothing'
            : survivors >= made.length
            ? 'VERDICT: all survived - C4 stands, the toggle really is natural-spawn only.'
            : 'VERDICT: the toggle REMOVES summoned mobs too. C4 was a FALSE PASS.')
          say('  Fix if false: re-enable the toggles and stop natural spawning at the');
          say('  worldgen layer instead (empty the biome modifiers in mcserver_spawnbalance).')
        }
      })
    }
    check(20); check(100); check(200)
  })
})()
