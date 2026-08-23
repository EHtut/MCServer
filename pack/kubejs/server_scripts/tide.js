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
  // 🔴 GRACE WAS A FLOOR THAT WAS BEING USED AS AN OFFSET. Fixed 2026-08-24 from
  // Ethan's play log - "apparently the tide never tided".
  //
  // The comment said "60s into a run before the first wave can land". The code said
  // `st.next = GRACE + nextGap(p)` - sixty seconds PLUS a full 5-10 minute gap, so the
  // first wave needed SIX TO ELEVEN MINUTES of unbroken enclosure. His log is the
  // proof: the single run that ever produced a wave began 15:21 and fired at 15:28,
  // seven minutes in. Every other run was 1-5 minutes and got nothing:
  //
  //     16:09:04 surfaced - tide ends after 0 wave(s), 2 min
  //     16:11:34 surfaced - tide ends after 0 wave(s), 1 min
  //
  // ⚠️ AND SURFACING WIPES THE RUN, so every dip restarted that clock from zero. A
  // player who goes in and out - which is how anyone actually mines - could never
  // reach a wave at all.
  var GRACE = 1200                // 60s minimum before the first wave can land

  // ⭐ THE FIRST WAVE IS ITS OWN WINDOW, NOT THE ORDINARY CADENCE. Going under has to
  // announce itself while you still remember choosing it; the 5-10 minute rhythm is
  // for a run you have already committed to, not for the doorway.
  var FIRST_MIN = 1200            // 60s  \  so the first wave lands between one and
  var FIRST_MAX = 3000            // 150s /   two and a half minutes under

  // ⚠️ ENTERING MUST BE DELIBERATE. Without ENTER_TICKS, stepping into a doorway or
  // under an overhang starts a run, and the tide becomes something that happens TO
  // you rather than something you chose. Leaving is faster than entering on purpose:
  // getting out should feel like getting out.
  var WAVE_MIN = 6000             // 5 real minutes
  var WAVE_MAX = 12000            // 10 real minutes
  var SPAWN_WINDOW = 600          // 30s of arrivals, per Ethan
  var SPAWN_BATCHES = 6           // ...delivered in this many pulses, 5s apart

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 SCALE — REBUILT 2026-08-23. Ethan: "Make tides actually hard", and when
  // offered tankier-vs-more: "for tankier, no, the answer is more undead."
  //
  // ⚠️ THE OLD NUMBERS WERE NOT A TIDE. BASE 1 / GROWTH 0.5 / MAX 5 across six
  // pulses produced:
  //
  //     wave 1 -> 6 mobs      wave 2 -> 12      wave 5 -> 18      wave 9+ -> 30
  //
  // Six mobs spread over thirty seconds is one mob every five seconds. That is
  // ambient cave spawning with a sound cue in front of it, and it is nowhere near
  // his original spec: "a massive wave of enemy batters you for like 20 seconds."
  //
  // ⭐ WHY MORE AND NOT TOUGHER IS THE RIGHT CALL (and it is his, not mine): tanky
  // undead just extend the same fight. A CROWD changes what the fight IS - you get
  // pushed, surrounded, cut off from the way you came. That is the Darktide feeling
  // he described, and it is also the only version that makes a corridor matter.
  //
  //     wave 1 -> 24 mobs     wave 2 -> 36      wave 5 -> 60      wave 8+ -> 72
  var BASE_PER_BATCH = 4
  var GROWTH = 1.5                // extra mobs per wave index
  var MAX_PER_BATCH = 12

  // 🚨 AND THEREFORE A CEILING, because the tide is PER PLAYER. Four champions in
  // the depths at once means four independent runs, and at 72 apiece that is 288
  // undead pathfinding at the same time on a machine that also runs Create.
  //
  // Counted LIVE from the world rather than tracked in a variable - a counter that
  // drifts would either strangle the tide or fail to stop it, and neither failure
  // announces itself. Tagged mobs, measured at the point of use.
  var TIDE_TAG = 'veldora_tide'
  var MAX_ALIVE_NEAR = 45         // per player, within CENSUS_RANGE
  var CENSUS_RANGE = 48

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE TIDE IS THE GODDESS OF DEATH'S ARMY. UNDEAD ONLY.
  //
  // Ethan, 2026-08-22: "i want only undead mobs to be apart of the tide. Creepers
  // and spiders, etc are not apart of the goddess of death's army or control."
  //
  // 🚨 THE FIRST ROSTER WAS 6/21 UNDEAD. It was lifted from spawner.json's depth
  // tiers, which exist to make caves dangerous and have no opinion about whose army
  // anything belongs to. Creepers, spiders, the Knocker and most of grim_and_bleak
  // were in a wave that is supposed to be HERS.
  //
  // ⚠️ AND THE NAMES LIE. Checked against `#minecraft:undead` read straight out of
  // the mod jars, not guessed:
  //     grim_and_bleak:flesh_eater      NOT undead
  //     grim_and_bleak:night_abomination NOT undead
  //     born_in_chaos_v1:restless_spirit NOT undead
  // Three things that read as undead from the name and are not tagged as it. This is
  // the only reason the audit was worth doing rather than eyeballing the list.
  //
  // 🔑 ONE DELIBERATE EXCEPTION, NAMED RATHER THAN HIDDEN: Rotten Creatures tags
  // NOTHING into #minecraft:undead, but the mod IS an undead roster - its own
  // modlist entry reads "A serious roster of new undead", and undead_miner /
  // zombie_lackey / skeleton_lackey / burned / immortal are undead in every sense
  // except the one the author forgot. They are allowlisted; smite will not work on
  // them, which is a real cost, and it is the mod's bug rather than ours.
  //
  // Every id below was probed against the LIVE registry, so none of them is a
  // magistuarmory:bronze_ingot waiting to happen.
  // ═══════════════════════════════════════════════════════════════════════════
  var SHALLOW = [
    'minecraft:zombie', 'minecraft:skeleton', 'minecraft:husk', 'minecraft:drowned',
    'born_in_chaos_v1:decaying_zombie', 'born_in_chaos_v1:decrepit_skeleton',
  ]
  var DEEP = [
    'born_in_chaos_v1:decaying_zombie', 'born_in_chaos_v1:decrepit_skeleton',
    'born_in_chaos_v1:barrel_zombie', 'grim_and_bleak:ghoul',
    'galosphere:preserved', 'goety:rattled', 'goety:wight',
    'rottencreatures:undead_miner', 'rottencreatures:zombie_lackey',
    'rottencreatures:skeleton_lackey',
  ]
  var DEEPER = [
    'grim_and_bleak:damned_templar', 'grim_and_bleak:banshee',
    'born_in_chaos_v1:bone_imp', 'born_in_chaos_v1:skeleton_thrasher',
    'born_in_chaos_v1:zombie_bruiser', 'goety:haunt', 'goety:wight',
    'iceandfire:dread_thrall', 'iceandfire:dread_ghoul',
    'rottencreatures:burned', 'rottencreatures:immortal',
  ]

  // Named here so the harness can assert the exception is exactly this and has not
  // quietly grown. If a mob is added to the rosters above and is neither tagged
  // undead nor listed here, the test fails.
  var UNTAGGED_UNDEAD = [
    'rottencreatures:undead_miner', 'rottencreatures:zombie_lackey',
    'rottencreatures:skeleton_lackey', 'rottencreatures:burned',
    'rottencreatures:immortal',
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

  // ⭐⭐ THE MATRIARCH'S CHAMPION DRAWS THE TIDE. Ethan, 2026-08-24:
  //
  //     "her champion's presence increases... things that are technically not in the
  //      domain of the gods above but instead in the underground. Tides, waves,
  //      enemies, etc." ... "i think the answer is actually not spawn rates and just
  //      tide chances."
  //
  // 🔑 TIDE CHANCES AND NOT SPAWN RATES, AND THAT DISTINCTION SAVED THE DESIGN. Ambient
  // spawn rate is a property of the WORLD - an Art champion would have made the depths
  // worse for everyone else in the same save, which is a grief mechanic nobody asked
  // for. A tide run is per-player state (`runs[uuid]`), so this lands on HER champion
  // and nobody else's. docs/63 §9 listed the world-wide version as a falsifier; the
  // narrower ruling removes it outright.
  //
  // ⭐ AND IT IS THE ONLY WAY SHE COULD TOUCH THE WORLD AT ALL. Her whole design is
  // five zeroes on the forced column because she cannot reach it (art_events.js). She
  // is not spawning anything here either - she is a presence the underground responds
  // to. Same shape as her Trial: things come because she is near, not because she sent
  // them.
  //
  // ⚠️ RANK 0 CHANGES NOTHING. The multiplier only ever shortens the gap, never
  // lengthens it, so a low-rank Art walker gets the ordinary tide rather than a
  // gentler one - "she has not noticed you yet", not "she is protecting you".
  var ART_PULL = 0.5          // at max rank the gap is this fraction of normal

  function artPull(p) {
    try {
      if (!VELDORA.paths || VELDORA.paths.pathOf(p) !== 'art') return 1
      if (!VELDORA.trustScale) return 1
      var sc = VELDORA.trustScale(p.server, p)
      if (typeof sc !== 'number' || !isFinite(sc) || sc <= 0) return 1
      if (sc > 1) sc = 1
      return 1 - (1 - ART_PULL) * sc
    } catch (e) { return 1 }
  }

  // The doorway window. Shares artPull so her champion is drawn in faster from the
  // very first wave rather than only from the second.
  function firstGap(p) {
    var base = FIRST_MIN + Math.floor(Math.random() * (FIRST_MAX - FIRST_MIN + 1))
    var pull = p ? artPull(p) : 1
    if (pull >= 1) return base
    return Math.max(SWEEP, Math.round(base * pull))
  }

  function nextGap(p) {
    var base = WAVE_MIN + Math.floor(Math.random() * (WAVE_MAX - WAVE_MIN + 1))
    if (!p) return base
    var pull = artPull(p)
    if (pull >= 1) return base
    var out = Math.max(SWEEP, Math.round(base * pull))
    return out
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

    // 🔑 STAMP THE WINDOW BEFORE ANY PULSE FIRES. This is what the leave-check
    // reads, so it has to be true from the instant the herald sounds - otherwise
    // there is a gap between the scream and the lock, and the gap is exactly when a
    // player would run.
    st.waveEnds = st.age + SPAWN_WINDOW
    st.toldEscape = false

    herald(p, y)
    console.info(TAG + p.username + ' - wave ' + st.waves + ' at y' + Math.round(y) +
      ', ' + per + ' per pulse x ' + SPAWN_BATCHES + ' over ' +
      Math.round(SPAWN_WINDOW / 20) + 's (up to ' + (per * SPAWN_BATCHES) + ' total)')

    var srv = null
    try { srv = p.server } catch (e) { return }
    if (!srv) return

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 THE LOOT REFRESH LIVED HERE FOR ONE DAY AND WAS THE WRONG MECHANISM.
    // Removed 2026-08-24 after probing the running server.
    //
    // The ask was Ethan's, 2026-08-23: "if possible after a tide reset the lootr
    // containers." I built it as a command fired at the end of each spawn window -
    // `lootr clear <player>` - and shipped it fail-loud because the server was off
    // and the syntax could not be verified.
    //
    // 🚨 `/lootr clear` DOES NOT EXIST. The real subcommands are: refresh, decay,
    // openers, cclear, cull, custom-*, force_*. There is also NO per-player clear at
    // all, so the shape I designed was not available in any spelling.
    //
    // ⭐ AND LOOTR ALREADY DOES THIS PROPERLY, IN CONFIG, WITHOUT KUBEJS:
    //     [refresh] refresh_value / refresh_loot_tables / refresh_modids
    //               perform_refresh_while_ticking / start_refresh_while_ticking
    // Scoping by LOOT TABLE is exact for us, because the depths inject into deep
    // structure tables (betterdungeons, galosphere, ancient_city) while surface
    // structures use different ones - so the depths can refresh on a timer and the
    // surface stays one-shot, with no code and no per-wave hook.
    //
    // 🔑 THE LESSON, WHICH IS THE REASON THIS COMMENT IS LONG: fail-loud saved the
    // player from a silent no-op, but it could not save the DESIGN. Only probing the
    // real server could, and that took one `/help lootr`. A guarded call to a command
    // nobody has run is still a guess wearing a seatbelt.

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
            // 🚨 CENSUS BEFORE SPAWN. Counted from the world, not from a tally we
            // keep - see MAX_ALIVE_NEAR. A pulse that would push past the ceiling is
            // SKIPPED and says so; it is never silently reduced, because "the tide
            // felt thin" and "the tide was capped" must not look the same in a log.
            var alive = -1
            try {
              alive = p.level.getEntitiesWithin(p.boundingBox.inflate(CENSUS_RANGE))
                .filter(function (e) { try { return e.tags.contains(TIDE_TAG) } catch (x) { return false } })
                .length
            } catch (e) { alive = -1 }
            if (alive >= 0 && alive >= MAX_ALIVE_NEAR) {
              console.info(TAG + p.username + ' pulse SKIPPED - ' + alive +
                ' tide undead already within ' + CENSUS_RANGE + ' blocks (ceiling ' +
                MAX_ALIVE_NEAR + '). Not thinned, held.')
            } else if (VELDORA.spawner) {
              // Tagged so the census above can find them, and so anything later can
              // tell a tide corpse from an ordinary one.
              VELDORA.spawner.wave(p, {
                ids: ids, count: per, nbt: '{Tags:["' + TIDE_TAG + '"]}',
              })
            }
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
            // First wave uses FIRST_*, not nextGap - see the note on GRACE. artPull
            // still applies, because the Matriarch draws the tide to her champion
            // from the moment they go under, not only once it is rolling.
            st.next = Math.max(GRACE, firstGap(p))
            console.info(TAG + p.username + ' has gone under - the tide begins')
          }
          continue
        }

        // active
        st.in = 0
        st.age += SWEEP

        // ⭐⭐ THE TIDE DOES NOT STOP AT THE DOOR (Ethan, 2026-08-23 - both knobs).
        //
        // Until now, ten seconds of sky ended a run outright, so the correct play on
        // hearing the scream was to walk upstairs. That made the scariest sound in the
        // game an instruction to leave, which is the opposite of what a wave is for.
        //
        // 🔑 A run can no longer END while a wave is still arriving. The spawn window
        // keeps firing and the spawner places around your CURRENT position - so
        // running for the surface does not cancel the wave, it relocates it. You take
        // the fight outside, which is a real choice (more room, no ceiling) rather
        // than an escape hatch.
        //
        // ⚠️ ENTERING is untouched. It still takes 15s of deliberate enclosure to
        // start a run - the tide must never be something that happens TO you.
        var mid = (st.waveEnds || 0) > st.age
        if (!enc && mid) {
          // Surfaced, but they are still coming. The leave timer does not run.
          if (!st.toldEscape) {
            st.toldEscape = true
            console.info(TAG + p.username + ' surfaced MID-WAVE - the run holds, ' +
              Math.round(((st.waveEnds || 0) - st.age) / 20) + 's of arrivals left')
          }
          continue
        }
        if (!enc) {
          st.out += SWEEP
          if (st.out >= LEAVE_TICKS) {
            console.info(TAG + p.username + ' surfaced - tide ends after ' +
              st.waves + ' wave(s), ' + Math.round(st.age / 1200) + ' min')
            runs[uuid] = { active: false, in: 0, out: 0, waves: 0, next: 0, age: 0, waveEnds: 0, toldEscape: false }
          }
          continue
        }
        st.out = 0

        st.next -= SWEEP
        if (st.next <= 0) {
          sendWave(p, st)
          st.next = nextGap(p)
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
    rosters: { shallow: SHALLOW, deep: DEEP, deeper: DEEPER, allowlist: UNTAGGED_UNDEAD },
    force: function (p) {
      var st = runs[String(p.uuid)]
      if (!st || !st.active) return false
      sendWave(p, st); st.next = nextGap(p); return true
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
      // 🔴 THIS BANNER LIED FOR ONE BOOT, AND IT WAS MINE. It still said "ends 10s
      // after surfacing" after 2026-08-23 made surfacing MID-WAVE not end a run at all
      // - the exact defect this repo has caught five times in other files, caught here
      // by reading my own boot report.
      console.info(TAG + 'THE TIDE live - enclosed only, NEVER under open sky. A run ' +
        'begins after ' + Math.round(ENTER_TICKS / 20) + 's under, and ends ' +
        Math.round(LEAVE_TICKS / 20) + 's after surfacing OR on death - but NOT while ' +
        'a wave is still arriving. Running for the surface RELOCATES the wave, it does ' +
        'not cancel it.')
      console.info(TAG + 'first wave ' + Math.round(FIRST_MIN / 20) + '-' +
        Math.round(FIRST_MAX / 20) + 's after going under; then waves every ' +
        Math.round(WAVE_MIN / 1200) + '-' +
        Math.round(WAVE_MAX / 1200) + ' min, first no sooner than ' +
        Math.round(GRACE / 1200) + ' min in. Each is ' +
        Math.round(SPAWN_WINDOW / 20) + 's of ARRIVALS at range in ' + SPAWN_BATCHES +
        ' pulses - they walk in, they are never dropped on you.')
      console.info(TAG + 'herald: your god above y0, the Speaker below it, and a ' +
        'sound ALWAYS - so a wave is never unannounced even with no lines written.')
    })
  })
})();
