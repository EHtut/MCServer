// _probe_attr.js - C0 round seven, final headless round. THROWAWAY.
// Round six produced a FALSE FAIL: event.cancel() unwinds by throwing KubeJS's
// EventExit, and the probe's own try/catch ate it. Fixed in _probe_stalker.js.
// Here: a SHIELDED zombie (does cancel hold?) and an UNSHIELDED one killed by an
// iron golem (does the death source name its attacker?).
(function () {
  var TAG = '[C0g]'
  function say(s) { console.info(TAG + ' ' + s) }
  ServerEvents.loaded(function (event) {
    var server = event.server, lvl = server.overworld()

    // --- #9: shielded, gets hit ---
    var s = lvl.createEntity('minecraft:zombie')
    s.setPos(0, 320, 0)
    s.persistentData.putBoolean('c0_shield', true)
    s.spawn()
    server.scheduleInTicks(60, function () {
      var hp = s.health
      try { s.attack(6) } catch (e) {}
      server.scheduleInTicks(5, function () {
        say('#9 ' + (s.health >= hp
          ? 'PASS  health held at ' + s.health + ' - beforeHurt + cancel() WORKS'
          : 'FAIL  ' + hp + ' -> ' + s.health))
      })
    })

    // --- #12: unshielded, killed by a real attacker ---
    var v = lvl.createEntity('minecraft:zombie')
    v.setPos(4, 320, 0)
    v.persistentData.putBoolean('c0_watch', true)
    v.spawn()
    var g = lvl.createEntity('minecraft:iron_golem')
    g.setPos(6, 320, 0)
    g.spawn()
    say('shielded + victim + golem spawned; expect a #12 line within ~15s');
  })
})()
