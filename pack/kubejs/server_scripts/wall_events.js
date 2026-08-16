// wall_events.js - what The Spider sends.
//
// ⚠️ GENERATED SKELETON (tools/new_god.py). Three example events and a Harvest
// handler, all correctly wired and all deliberately thin. Read docs/41 §2 ⑦: START
// WITH THREE, NOT TWELVE. Blade has twelve because he is the combat god and eight of
// them are spawner calls.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[wallev] '
  var GOD = 'wall'

  var ACTOR = 'born_in_chaos_v1:mother_spider'
  var ACTOR_TAG = 'veldora_wall_actor'

  // NBT quoting through a char code. The NBT wants single quotes around a JSON text
  // component, and every attempt to escape those through a tool chain mangled them.
  // A char code cannot be mangled.
  var Q = String.fromCharCode(39)

  function say(p, tag) {
    try { if (VELDORA.voice) return VELDORA.voice.say(p, GOD, tag) } catch (e) { }
    return false
  }

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  // ⚠️ getInt() RETURNS 0 FOR A MISSING KEY, so the stored value is day+1 and 0 means
  // "never". And the clock is NOT monotonic - admins run /time set, and a stamp from
  // the future must re-stamp rather than lock the player out for ten thousand days.
  // docs/41 invariants #5 and #6.
  function daysSince(server, p, key) {
    var now = dayNow(server)
    if (now === null) return null
    var stored = 0
    try { stored = p.persistentData.getInt(key) } catch (e) { return null }
    if (!stored) return null                       // never
    var last = stored - 1
    if (last > now) {
      try { p.persistentData.putInt(key, now + 1) } catch (e) { }
      return 0
    }
    return now - last
  }

  function stampDay(server, p, key) {
    var now = dayNow(server)
    if (now === null) return
    try { p.persistentData.putInt(key, now + 1) } catch (e) { }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 A run() RETURNING false DOES NOT STAMP THE COOLDOWN. An event that could not
  // happen has not happened, and must be tried again. docs/41 invariant #9.

  function evExample(server, p) {
    // TODO(ethan): what does The Spider actually do here?
    if (!VELDORA.spawner) return false
    var r = VELDORA.spawner.wave(p, {
      ids: [ACTOR], count: 1, minDist: 12, maxDist: 20,
      nbt: '{Tags:["' + ACTOR_TAG + '"]}',
    })
    if (!r || r.placed === 0) {
      console.warn(TAG + 'example: nothing placed for ' + p.username + ' - not stamping')
      return false
    }
    say(p, 'push')
    return true
  }

  function evQuiet(server, p) {
    // A non-hostile event: it only speaks. Every god wants at least one of these, or
    // the god becomes nothing but a threat generator.
    return say(p, 'push')
  }

  function evGuarded(server, p) {
    // TODO(ethan): the guarded one - fires only under a condition worth noticing.
    return say(p, 'lore')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE HARVEST
  // ═══════════════════════════════════════════════════════════════════════════
  // Four gods COLLECT. Blade GRADUATES. harvest.js is a registry precisely so this
  // may differ per god - decide which this one is before writing arrive().

  function harvestArrive(server, p) {
    if (!VELDORA.spawner) return false

    // 🚨 REFUSE IF A SCENE IS ALREADY RUNNING. Do not push through it - the Speaker's
    // confession holds a player blind and rooted for ~39s, and dropping a Harvest on
    // them mid-scene is docs/41 invariant #11.
    try {
      if (VELDORA.ritual && VELDORA.ritual.active(p)) {
        console.info(TAG + 'Harvest held for ' + p.username + ' - already in a scene')
        return false
      }
    } catch (e) { }

    var r = VELDORA.spawner.wave(p, {
      ids: [ACTOR], count: 1, minDist: 12, maxDist: 20,
      nbt: '{Tags:["' + ACTOR_TAG + '"],CustomNameVisible:1b,CustomName:' + Q +
        '{"text":"TODO name me","color":"white","bold":true}' + Q + '}',
    })
    // 🚨 A HARVEST THAT DID NOT ARRIVE DID NOT HAPPEN. Returning false means
    // harvest.js does NOT stamp it as begun, and the phase sweep retries.
    if (!r || r.placed === 0) {
      console.error(TAG + '!! Harvest actor FAILED to place for ' + p.username)
      return false
    }
    console.info(TAG + 'Harvest sent at ' + p.username)
    return true
  }

  // ⚠️ THE CLOSING LINES ARE DELAYED. They fire from a death hook, so undelivered
  // they print ABOVE "X was slain by..." and read as commentary arriving too early.
  // The god speaks after the world has finished saying what happened.
  function harvestWin(server, p) {
    server.scheduleInTicks(20, function () { try { say(p, 'harvest_won') } catch (e) { } })
  }

  function harvestLose(server, p) {
    server.scheduleInTicks(20, function () { try { say(p, 'harvest_lost') } catch (e) { } })
  }

  // Winning is killing it. The tag is how we know which corpse mattered.
  EntityEvents.death(function (event) {
    try {
      var victim = event.entity
      if (!victim || victim.player) return
      var tags = null
      try { tags = victim.tags } catch (x) { return }
      if (!tags) return
      var has = false
      try {
        has = tags.contains ? tags.contains(ACTOR_TAG) : (String(tags).indexOf(ACTOR_TAG) >= 0)
      } catch (x) { return }
      if (!has) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      if (VELDORA.harvest) VELDORA.harvest.resolve(killer.server, killer, true)
    } catch (e) { console.warn(TAG + 'harvest kill hook threw :: ' + e) }
  })

  // Losing is dying to it. Dying AT ALL while a Harvest is active counts.
  EntityEvents.death(function (event) {
    try {
      var victim = event.entity
      if (!victim || !victim.player) return
      if (!VELDORA.harvest || !VELDORA.harvest.active(victim)) return
      VELDORA.harvest.resolve(victim.server, victim, false)
    } catch (e) { }
  })

  // 🚨 AN UNWRITTEN GOD MUST BE INERT, NOT MERELY LOUD.
  //
  // The scaffold goes LIVE the instant it deploys - `[events] framework LIVE - 14
  // events across 2 gods` - and a walker on this path would then start drawing
  // placeholder events that spawn an actor and say NOTHING, because the voice pools
  // are still empty. That is worse than an unbuilt god: it is a built one that
  // appears broken.
  //
  // So registration is gated on the voice actually having lines. Write the pools in
  // <god>_voice.js and this wires itself up on the next restart, with no flag to
  // remember to flip - docs/41 §3, and the standing rule that a gate ships with a
  // live consumer or not at all.
  function voiceIsWritten() {
    // Ask the god's OWN published count (set at script-eval time). Asking
    // VELDORA.voice.pools here is a RACE - that registry fills inside a `loaded`
    // handler that runs AFTER this one.
    try {
      if (VELDORA[GOD] && typeof VELDORA[GOD].written === 'number') {
        return VELDORA[GOD].written > 0
      }
    } catch (e) { }
    try {
      var g = VELDORA.voice && VELDORA.voice.pools ? VELDORA.voice.pools[GOD] : null
      if (!g) return false
      for (var k in g) if (g.hasOwnProperty(k)) return true
    } catch (e) { }
    return false
  }

  ServerEvents.loaded(function (event) {
    if (!VELDORA.events) { console.error(TAG + 'godevents.js missing'); return }

    // ═══════════════════════════════════════════════════════════════════════
    // 🚨 HELD ON PURPOSE - THE SCAFFOLD'S EVENTS ARE WRONG FOR HER.
    //
    // The generated `example` event spawns a hostile actor AT the champion. For
    // Blade that is the whole design. For the Spider it is a contradiction:
    //
    //   Ethan, 2026-08-15: "she will never send anything but boons to you.
    //                       To other players? She spawns spiders to attack them."
    //
    // She is the first god whose NEGATIVE events do not point at her own champion,
    // and the placeholder points them exactly there. Her voice is written, so the
    // written-voice guard below would have let these through - "has lines" and "has
    // correct events" are different claims and this file must not conflate them.
    //
    // WHAT SHE STILL NEEDS, before this flips:
    //   * the rage counter (+1 per minion raised, -1 per minion slain)
    //   * an audit of goety / occultism / automaticons for the actual boon items
    //     (MineColonies was CUT - docs/35's premise is stale)
    //   * Ethan's ruling on the player-vs-player half
    //
    // TO ARM: set EVENTS_READY = true once real events replace the three below.
    var EVENTS_READY = false
    if (!EVENTS_READY) {
      console.warn(TAG + 'HELD - The Spider has a VOICE but not yet EVENTS. The ' +
        'scaffold would send a hostile spider at her own champion, and she only ' +
        'ever sends boons to hers. Needs the rage counter + a goety/occultism/' +
        'automaticons item audit. See docs/43.')
      return
    }

    if (!voiceIsWritten()) {
      console.warn(TAG + 'HELD - The Spider has no written lines yet, so nothing is ' +
        'registered. A walker on this path would have drawn silent placeholder ' +
        'events. Fill the pools in wall_voice.js and restart; this arms itself.')
      return
    }

    VELDORA.events.register(GOD, {
      id: 'example', run: evExample, hostile: true,
      does: 'TODO(ethan): one plain sentence - what does this DO to the player?',
    })
    VELDORA.events.register(GOD, {
      id: 'quiet', run: evQuiet, hostile: false, cooldown: 1,
      does: 'TODO(ethan): speaks only, no danger',
    })
    VELDORA.events.register(GOD, {
      id: 'guarded', run: evGuarded, hostile: false, tiers: ['medium', 'high'],
      does: 'TODO(ethan): what condition guards it, and what it does when it passes',
    })

    if (VELDORA.harvest) {
      VELDORA.harvest.register(GOD, {
        arrive: harvestArrive, onWin: harvestWin, onLose: harvestLose,
        tag: ACTOR_TAG,     // resolve() removes it, WIN OR LOSE
      })
    } else console.error(TAG + 'harvest.js missing - this god\'s Harvest will not arrive')

    console.info(TAG + 'The Spider sends: example, quiet, guarded - SKELETON, ' +
      'see docs/41 section 2 step 7. Actor: ' + ACTOR)
  })
})();
