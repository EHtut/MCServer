// tide.js — THE TIDE.  docs/50.
//
// Ethan, 2026-08-18: "straggling mobs as you move through the levels then every 30s
// or so you hear a scream and then music and then a massive wave of enemy batters you
// for like 20 seconds. it's the dopamine rush there... my idea of the depth is kinda
// like a rougelike system where you go down fight enemies get loot, escape."
//
// And 2026-08-22: "wave cadence is 5-10 minutes and 30 seconds of mobs spawning at a
// distance then pathfinding to the players and yes not on the surface."
//
// ── ⭐ A WAVE IS AN ARRIVAL, NOT A DROP ──────────────────────────────────────
// The single most important line in his spec. Mobs spawn AT RANGE across a
// thirty-second window and WALK IN. That is a different mechanic from dropping eight
// things on somebody, and a better one:
//
//   · you hear it before you see it - the dread lives in the walk
//   · ground you chose to stand on matters, and running is a real option
//   · nothing can ever materialise inside your hitbox
//
// ── ⭐ THE HERALD IS CHOSEN BY DEPTH ────────────────────────────────────────
// "announced by god dialogue if they can hear you and speaker dialogue if too deep."
// So the tide is one mechanic with two narrators, and WHICH ONE tells you is itself
// the depth gauge:
//
//     enclosed, y >= 0    your own god warns you. He can still reach down here.
//     enclosed, y <  0    the Speaker does. Your god cannot.
//
// Nothing at all under open sky - the two-realm thesis is untouched.
//
// ── 🚨 A TIDE MUST END, OR IT IS TINNITUS ───────────────────────────────────
// Darktide works because a mission is thirty minutes and then it is OVER. Minecraft
// is not. A wave every five minutes forever is not a dopamine loop, it is weather -
// and Ethan has already reported that fatigue once, about events far cheaper than a
// thirty-second assault.
//
// His own framing is the fix: the tide is bounded by THE RUN. Go under, it starts
// quiet. Stay, it escalates. Leave or die, it ENDS and resets. That gives a beginning
// the player chooses, an escalation they can feel, and an exit they control - which
// is what makes the loot a decision instead of a drip.
//
// ── ⚠️ WHY THIS DOES NOT NEED THE VOID RULING ───────────────────────────────
// docs/50 §1 measured everything below y-64 as 100% air, and the open question is
// whether to fix worldgen or build an arena down there. THE TIDE DOES NOT WAIT ON
// THAT. Its home is "enclosed and below 0", which is ordinary cave terrain with real
// floors (y0..-64 measures 3.6-10% open). The hollow band remains a separate
// question about the Abyssal, not a blocker for this.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[tide] '
  var GATE = true

  // ── the run ────────────────────────────────────────────────────────────────
  var SWEEP = 100                 // 5s between checks - cheap, only online players
  var ENTER_TICKS = 300           // 15s enclosed before a run BEGINS
  var LEAVE_TICKS = 200           // 10s of sky before it ENDS
  var GRACE = 1200                // 60s into a run before the first wave can land

  // ⚠️ ENTERING MUST BE DELIBERATE. Without ENTER_TICKS, stepping into a doorway or
  // under an overhang starts a run, and the tide becomes something that happens TO
  // you rather than something you chose. Leaving is faster than entering on purpose:
  // getting out should feel like getting out.
  var WAVE_MIN = 6000             // 5 real minutes
  var WAVE_MAX = 12000            // 10 real minutes
  var SPAWN_WINDOW = 600          // 30s of arrivals, per Ethan
  var SPAWN_BATCHES = 6           // ...delivered in this many pulses, 5s apart

  // Escalation. Wave 1 is a nudge; the fifth is a problem. Capped so a very long run
  // cannot compound into something unfightable.
  var BASE_PER_BATCH = 1
  var GROWTH = 0.5                // extra mobs per wave index
  var MAX_PER_BATCH = 5

  // Rosters. Every id here is already validated live by spawner.js's boot check, and
  // came from spawner.json's tiers rather than being invented for this file.
  var SHALLOW = [
    'minecraft:zombie', 'minecraft:skeleton', 'minecraft:spider',
    'minecraft:cave_spider', 'minecraft:creeper',
  ]
  var DEEP = [
    'grim_and_bleak:ghoul', 'grim_and_bleak:flesh_eater', 'the_knocker:knocker',
    'rottencreatures:undead_miner', 'rottencreatures:skeleton_lackey',
    'rottencreatures:zombie_lackey', 'born_in_chaos_v1:decaying_zombie',
    'born_in_chaos_v1:decrepit_skeleton',
  ]
  var DEEPER = [
    'grim_and_bleak:howler', 'grim_and_bleak:night_abomination',
    'grim_and_bleak:damned_templar', 'rottencreatures:burned',
    'rottencreatures:immortal', 'born_in_chaos_v1:restless_spirit',
    'born_in_chaos_v1:nightmare_stalker', 'born_in_chaos_v1:bone_imp',
  ]

  var SOUND_TELL = 'minecraft:entity.warden.nearby_closest'
  var SOUND_WAVE = 'minecraft:entity.wither.spawn'

  // uuid -> run state. IN MEMORY BY DESIGN: a run is a session, and one that
  // survived a restart would resume mid-escalation with no way for a player to tell
  // why the world got loud.
  var runs = {}

  function seesSky(p) {
    try {
      var lvl = p.level
      if (lvl && typeof lvl.canSeeSky === 'function') return !!lvl.canSeeSky(p.blockPosition())
      var b = p.block
      if (b && typeof b.canSeeSky === 'boolean') return !!b.canSeeSky
      if (b && typeof b.canSeeSky === 'function') return !!b.canSeeSky()
    } catch (e) { }
    return null
  }

  // "Not on the surface" - enclosed, at any height. Depth then decides the HERALD
  // and the roster, not whether the tide runs at all.
  function enclosed(p) {
    var sky = seesSky(p)
    if (sky === null) return null       // unreadable: never guess, see the sweep
    return !sky
  }

  function depthOf(p) {
    try { var y = p.y; if (typeof y === 'number' && isFinite(y)) return y } catch (e) { }
    return null
  }

  function rosterFor(y) {
    if (y >= 0) return SHALLOW
    if (y > -40) return DEEP
    return DEEPER
  }

  function nextGap() {
    return WAVE_MIN + Math.floor(Math.random() * (WAVE_MAX - WAVE_MIN + 1))
  }

  // ── the announcement ───────────────────────────────────────────────────────
  // ⭐ Whichever voice can still reach you. Below 0 your god has gone quiet and the
  // Speaker has the job - which is deep_speaker.js's entire premise doing mechanical
  // work rather than just atmosphere.
  function herald(p, y) {
    var spoke = false
    try {
      if (y < 0 && VELDORA.speaker && VELDORA.speaker.active(p)) {
        spoke = !!VELDORA.speaker.say(p, 'warn_wave')
      }
    } catch (e) { }
    if (!spoke) {
      try {
        var god = VELDORA.paths ? (VELDORA.paths.pathOf(p) || '') : ''
        if (god && VELDORA.voice) spoke = !!VELDORA.voice.say(p, god, 'warn_wave')
      } catch (e) { }
    }
    // ⚠️ THE SOUND IS NOT A FALLBACK, IT IS THE TELL. A pathless player, or one whose
    // god has no line written, must still get the warning - otherwise the wave is the
    // effect-from-nowhere this whole design exists to avoid. Words are the flavour;
    // the sound is the contract.
    try {
      var srv = p.server
      srv.runCommandSilent('execute as ' + p.username + ' at @s run playsound ' +
        SOUND_TELL + ' hostile @s ~ ~ ~ 1 0.6')
    } catch (e) { }
    return spoke
  }

  // ── the wave ───────────────────────────────────────────────────────────────
  function sendWave(p, st) {
    var y = depthOf(p)
    if (y === null) return
    var ids = rosterFor(y)
    st.waves++

    var per = Math.min(MAX_PER_BATCH,
      Math.max(1, Math.round(BASE_PER_BATCH + GROWTH * (st.waves - 1))))

    herald(p, y)
    console.info(TAG + p.username + ' - wave ' + st.waves + ' at y' + Math.round(y) +
      ', ' + per + ' per pulse x ' + SPAWN_BATCHES + ' over ' +
      Math.round(SPAWN_WINDOW / 20) + 's')

    var srv = null
    try { srv = p.server } catch (e) { return }
    if (!srv) return

    // ⭐ THIRTY SECONDS OF ARRIVALS. Batched rather than dumped, so they come in a
    // stream you can hear approaching - and so a single unlucky pulse cannot bury
    // somebody who was already fighting.
    var step = Math.floor(SPAWN_WINDOW / SPAWN_BATCHES)
    for (var b = 0; b < SPAWN_BATCHES; b++) {
      (function (delay, first) {
        srv.scheduleInTicks(delay, function () {
          try {
            // Re-check EVERY pulse. Somebody who surfaced, died or logged out mid
            // wave must stop receiving it - otherwise the tide follows them into
            // daylight, which is the one thing Ethan ruled out.
            if (!p.isAlive || !p.isAlive()) return
            var st2 = runs[String(p.uuid)]
            if (!st2 || !st2.active) return
            if (enclosed(p) === false) return
            if (first) {
              srv.runCommandSilent('execute as ' + p.username + ' at @s run playsound ' +
                SOUND_WAVE + ' hostile @s ~ ~ ~ 0.8 0.5')
            }
            if (VELDORA.spawner) VELDORA.spawner.wave(p, { ids: ids, count: per })
          } catch (e) { console.warn(TAG + 'pulse threw :: ' + e) }
        })
      })(b * step, b === 0)
    }
  }

  // ── the sweep ──────────────────────────────────────────────────────────────
  function sweep(server) {
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        var uuid = null
        try { uuid = String(p.uuid) } catch (e) { continue }
        var st = runs[uuid]
        if (!st) { st = runs[uuid] = { active: false, in: 0, out: 0, waves: 0, next: 0, age: 0 } }

        var enc = enclosed(p)
        if (enc === null) continue          // cannot read sky: do nothing, ever

        if (!st.active) {
          st.out = 0
          st.in = enc ? st.in + SWEEP : 0
          if (st.in >= ENTER_TICKS) {
            st.active = true
            st.age = 0
            st.waves = 0
            st.next = GRACE + nextGap()
            console.info(TAG + p.username + ' has gone under - the tide begins')
          }
          continue
        }

        // active
        st.in = 0
        st.age += SWEEP
        if (!enc) {
          st.out += SWEEP
          if (st.out >= LEAVE_TICKS) {
            console.info(TAG + p.username + ' surfaced - tide ends after ' +
              st.waves + ' wave(s), ' + Math.round(st.age / 1200) + ' min')
            runs[uuid] = { active: false, in: 0, out: 0, waves: 0, next: 0, age: 0 }
          }
          continue
        }
        st.out = 0

        st.next -= SWEEP
        if (st.next <= 0) {
          sendWave(p, st)
          st.next = nextGap()
        }
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    server.scheduleInTicks(SWEEP, function () { sweep(server) })
  }

  // 🚨 DEATH ENDS THE RUN. Without this the escalation survives your corpse and the
  // next descent starts at wave six - which reads as the game being broken rather
  // than as a roguelike.
  EntityEvents.death(function (event) {
    try {
      var p = event.entity
      if (!p || !p.player) return
      var uuid = String(p.uuid)
      var st = runs[uuid]
      if (st && st.active) {
        console.info(TAG + p.username + ' died - tide ends after ' + st.waves + ' wave(s)')
      }
      runs[uuid] = { active: false, in: 0, out: 0, waves: 0, next: 0, age: 0 }
    } catch (e) { }
  })

  PlayerEvents.loggedOut(function (event) {
    try { delete runs[String(event.player.uuid)] } catch (e) { }
  })

  VELDORA.tide = {
    inRun: function (p) {
      try { var st = runs[String(p.uuid)]; return !!(st && st.active) } catch (e) { return false }
    },
    state: function (p) {
      try { return runs[String(p.uuid)] || null } catch (e) { return null }
    },
    enclosed: enclosed,
    force: function (p) {
      var st = runs[String(p.uuid)]
      if (!st || !st.active) return false
      sendWave(p, st); st.next = nextGap(); return true
    },
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    event.register(Commands.literal('tide').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var st = VELDORA.tide.state(p)
      var enc = enclosed(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6THE TIDE'))
      p.tell(Text.of('§8enclosed: §f' + (enc === null ? '?' : enc) +
        '§8  y: §f' + Math.round(depthOf(p) || 0)))
      if (!st || !st.active) {
        p.tell(Text.of('§8not in a run §7(' + Math.round((st ? st.in : 0) / 20) +
          's of ' + Math.round(ENTER_TICKS / 20) + 's enclosed)'))
      } else {
        p.tell(Text.of('§cIN A RUN §8- §f' + st.waves + '§8 wave(s), §f' +
          Math.round(st.age / 1200) + '§8 min, next in §f' +
          Math.max(0, Math.round(st.next / 20)) + '§8s'))
      }
      return 1
    }))
    event.register(Commands.literal('tide_now').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      if (!VELDORA.tide.force(p)) p.tell(Text.of('§cnot in a run - go underground first'))
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'THE TIDE GATED OFF'); return }
    sweep(event.server)
    event.server.scheduleInTicks(1, function () {
      var haveSpawner = !!(VELDORA.spawner && VELDORA.spawner.wave)
      if (!haveSpawner) {
        console.error(TAG + 'spawner missing - the tide can announce but never arrive')
      }
      console.info(TAG + 'THE TIDE live - enclosed only, NEVER under open sky. A run ' +
        'begins after ' + Math.round(ENTER_TICKS / 20) + 's under, ends ' +
        Math.round(LEAVE_TICKS / 20) + 's after surfacing or on death.')
      console.info(TAG + 'waves every ' + Math.round(WAVE_MIN / 1200) + '-' +
        Math.round(WAVE_MAX / 1200) + ' min, first no sooner than ' +
        Math.round(GRACE / 1200) + ' min in. Each is ' +
        Math.round(SPAWN_WINDOW / 20) + 's of ARRIVALS at range in ' + SPAWN_BATCHES +
        ' pulses - they walk in, they are never dropped on you.')
      console.info(TAG + 'herald: your god above y0, the Speaker below it, and a ' +
        'sound ALWAYS - so a wave is never unannounced even with no lines written.')
    })
  })
})();
