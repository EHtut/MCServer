// _probe_c4.js - C4 audit. THROWAWAY.
//
// Five stalkers just had *_SPAWNING_ENABLED flipped to false. The design has
// carried one unresolved risk since its second pass: does the thing that stops
// them spawning NATURALLY also stop us SUMMONING them? If it does, five of six
// stalkers can never be cast and C5 changes shape entirely.
//
// Answer it here, not at C7.
(function () {
  var TAG = '[C4]'
  var SIX = [
    'born_in_chaos_v1:krampus',
    'born_in_chaos_v1:nightmare_stalker',
    'born_in_chaos_v1:lord_pumpkinhead',
    'born_in_chaos_v1:dire_hound_leader',
    'born_in_chaos_v1:missioner',
    'born_in_chaos_v1:mother_spider',
  ]
  ServerEvents.loaded(function (event) {
    var lvl = event.server.overworld()
    console.info(TAG + ' ===== can we still summon the disabled five? =====')
    var ok = 0
    for (var i = 0; i < SIX.length; i++) {
      var id = SIX[i]
      try {
        var e = lvl.createEntity(id)
        if (!e) { console.info(TAG + ' FAIL   ' + id + ' - createEntity returned null'); continue }
        e.setPos(0, 320, 0)
        var spawned = e.spawn()
        // "spawn() did not throw" is NOT proof. Ask the world whether it is there.
        var alive = false
        try { alive = e.isAlive() } catch (x) { try { alive = !!e.alive } catch (y) {} }
        console.info(TAG + (alive ? ' PASS   ' : ' FAIL   ') + id +
          '  spawn()=' + spawned + ' alive=' + alive)
        if (alive) ok++
        e.discard()
      } catch (err) {
        console.info(TAG + ' THREW  ' + id + ' :: ' + err)
      }
    }
    console.info(TAG + ' ===== ' + ok + '/' + SIX.length + ' summonable =====')
    if (ok === SIX.length) {
      console.info(TAG + ' RISK CLOSED - the config toggle gates NATURAL spawning only.')
    } else {
      console.info(TAG + ' !! RISK REAL - C5 must summon by another route (NBT spawn,')
      console.info(TAG + ' !! /summon command, or re-enable + In Control deny instead).')
    }
  })
})()
