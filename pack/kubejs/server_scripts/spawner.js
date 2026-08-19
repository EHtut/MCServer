// spawner.js - THE ACTIVE SPAWNER.  docs/23 §7a, PART V.9
//
// The one piece four different systems have all been waiting on:
//
//   · E3's `spawns` axis      - INERT since it was built, because checkSpawn can
//                               only CANCEL and Blade's headline number is ×4.
//                               You cannot cancel your way to more mobs.
//   · Blade's twelve          - eight of them are waves (23 PART VI)
//   · E7 / the reckonings     - four of the five collections spawn something
//   · the chat-only question  - if patrons lose their bodies, this becomes the
//                               ONLY way anything patron-flavoured reaches a player
//
// ── EVERY LESSON THIS PROJECT LEARNED THE HARD WAY IS IN HERE ────────────────
//
// 1. /summon, NEVER createEntity().spawn().
//    A KubeJS createEntity().spawn() BYPASSES finalizeSpawn, which is where Born in
//    Chaos sets its hostility - so a mob spawned that way inherits whatever the
//    default happens to be. stalker.js carries the same warning.
//
// 2. runCommandSilent CANNOT tell you whether the summon worked.
//    E0 P12: it returns `undefined` for a valid command and an invalid one alike.
//    the_hunt.js's first version did `if (!rc) prune`, which is true every single
//    time, and would have stripped WORKING hunters from its roster.
//
// 3. So THE ROSTER IS VALIDATED AT BOOT, not trusted.
//    E0 P13, measured: `execute if entity @e[type=X,limit=1]` answers `Test failed`
//    for a real type and `Invalid or unknown entity type` for a bad one, and
//    runCommand (P12b) returns that text. the_hunt.js validates its roster BY HAND
//    - which is exactly how THREE OF ITS FOUR HUNTERS were ids from mods that were
//    never installed, so 75% of hunts sent nothing while logging success.
//
// 4. AND WE COUNT WHAT ACTUALLY ARRIVED.
//    Even a validated id can fail to place - no room, wrong dimension, a mod veto.
//    Every wave scans the ring before and after and reports the DELTA. "I asked for
//    six" and "six are standing there" are different claims, and only the second is
//    evidence. A caller that needs to know gets a real number.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[spawner] '

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE RING.  Ethan, 2026-08-16: "enemy spawnings are not as clean as they
  // should be. if anything they spawn too far."
  //
  // He is right, and the file said so itself without anyone noticing: the default
  // was 24-40, inherited from the_hunt, and EVERY event whose author stopped to
  // think about it overrode it downward -
  //
  //     icarus 12-24 · broken_rung 14-26 · duel 10-16 · understudy 10-16
  //     harvest 12-20 · wall's spiders 10-18 · her brood 3-6
  //
  // Eight overrides, all closer, none further. The default was the outlier, and the
  // two events that never overrode it - gauntlet and hollow, his MAIN waves - were
  // the ones landing outside aggro range. Most hostiles notice a player at ~16
  // blocks, so a mob placed at 40 simply stands there.
  //
  // 🚨 AND I MADE IT WORSE THE SAME DAY. Gating his hordes to underground (2026-08-16)
  // means 24-40 blocks is now usually measured THROUGH SOLID ROCK, into unlit caves
  // on the far side of walls. The gate is right; this default made it useless.
  var MIN_DIST = 12
  var MAX_DIST = 22

  // ⚠️ Underground the ring tightens again. It is not about difficulty - it is that
  // 22 blocks of stone is a different distance from 22 blocks of field, and a wave
  // that spawns inside a wall never arrives. Uses godevents' shared reader so
  // "underground" has ONE definition in this codebase.
  var DEEP_MIN = 8
  var DEEP_MAX = 16

  var MAX_PER_WAVE = 12           // TPS guard. Four players on one box.
  var SCAN_PAD = 16               // count radius = MAX_DIST + this
  var MEASURE_DELAY = 10          // ticks - a summon is not queryable same-tick

  // id -> true/false, filled at boot. An id absent from here has never been checked.
  var VALID = {}
  var checked = false

  function say(msg) { console.info(TAG + msg) }

  // ── the validator (E0 P13) ────────────────────────────────────────────────
  // Returns true only if the type is REGISTERED. Anything unreadable is false:
  // refusing to summon is recoverable, summoning nothing while reporting success
  // is the failure mode that hid for weeks.
  function validate(server, id) {
    if (VALID.hasOwnProperty(id)) return VALID[id]
    var out = ''
    try {
      out = String(server.runCommand('execute if entity @e[type=' + id + ',limit=1]'))
    } catch (e) {
      // A THROW here is itself the "unknown type" answer on some paths.
      VALID[id] = false
      console.warn(TAG + 'validate threw for ' + id + ' :: ' + e)
      return false
    }
    var bad = out.indexOf('Invalid or unknown entity type') >= 0 ||
              out.indexOf('Unknown or invalid') >= 0
    VALID[id] = !bad
    if (bad) console.error(TAG + '!! ' + id + ' IS NOT A REGISTERED ENTITY - ' +
      'it will never spawn. Check the mod is installed.')
    return !bad
  }

  // Count entities of the given types near a player. This is the measurement half.
  //
  // 🚨 String(entity.type) IS NOT THE BARE ID. The first version of this function
  // did an exact-match lookup and reported `measured 0` while four hounds were
  // standing in the ring - an instrument that produced a confident false negative,
  // which is the precise failure this file's header is about.
  //
  // stalker.js already knew: isStalkerType() compares with indexOf, not equality,
  // and has done since it was written. The pattern was there to copy and I did not
  // read it. SUBSTRING, always.
  var FORM_LOGGED = false
  function countNear(player, types, radius) {
    var n = 0
    try {
      var near = player.level.getEntitiesWithin(player.boundingBox.inflate(radius))
      for (var j = 0; j < near.length; j++) {
        var t = null
        try { t = String(near[j].type) } catch (e) { continue }
        if (!FORM_LOGGED && t) {
          FORM_LOGGED = true
          say('entity.type renders as: "' + t + '" - matched by SUBSTRING, never equality')
        }
        for (var i = 0; i < types.length; i++) {
          if (t.indexOf(types[i]) >= 0) { n++; break }
        }
      }
    } catch (e) {
      console.warn(TAG + 'countNear threw :: ' + e)
      return null                 // null = could not measure, NOT zero
    }
    return n
  }

  // ── the wave ──────────────────────────────────────────────────────────────
  // opts: { ids: [..], count: n, minDist, maxDist, nbt }
  //   nbt  an NBT string appended to the summon, e.g. '{Tags:["veldora_hollow"]}'.
  //        Hollow Victory tags its wave so EntityEvents.drops can recognise it -
  //        a mob you cannot tell apart from a natural one cannot be given special
  //        rules later.
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE GROUND FINDER.  Ethan, live 2026-08-18:
  //     [spawner] wave for Lehykt: asked 1, measured 0 (fallen_chaos_knight)
  //     !! asked for 1 and NOTHING arrived. Valid ids, so this is placement.
  //
  // The summon was `execute at <player> run summon <id> ~dx ~ ~dz` - horizontally
  // offset, and AT THE PLAYER'S EXACT Y, with no check that anything was there.
  // Underground that is a coin flip against solid rock, and the coin was flipped
  // ONCE per mob. Same session, same cave, two players a block apart:
  //
  //     goety:spider_servant     x2  -> measured 2
  //     fallen_chaos_knight      x1  -> measured 0
  //
  // A knight needs more clearance than a spider and got a single blind try. So this
  // does not "fix big mobs" - it stops guessing.
  //
  // 🚨 cave_air IS NOT air. Underground the block is `minecraft:cave_air`; testing
  // for `minecraft:air` alone would make the finder fail EVERYWHERE IT IS NEEDED
  // and silently fall back to the blind path, looking like no change at all.
  //
  // ⚠️ PROBED, NOT ASSUMED - godevents' canSeeSky rule. If this KubeJS build does
  // not expose block reads, the finder reports so once and every wave takes the old
  // path, which is exactly what shipped before.
  // ═══════════════════════════════════════════════════════════════════════════
  var FIND_TRIES = 12             // candidate columns per mob
  var Y_LADDER = [0, 1, -1, 2, -2, 3, -3, 4, -4]
  var readsWarned = false

  function openAt(level, x, y, z) {
    var b = null
    try {
      if (typeof level.getBlock !== 'function') return null
      b = level.getBlock(x, y, z)
    } catch (e) { return null }
    if (!b) return null
    try {
      var id = String(b.id || '')
      return id === 'minecraft:air' || id === 'minecraft:cave_air' || id === 'minecraft:void_air'
    } catch (e) { return null }
  }

  // A mob needs two open blocks and something to stand on. Returns absolute coords
  // or null - null means "did not find one", never "could not look", because the
  // caller treats those the same way (fall back) but the LOG must not.
  function findSpot(player, lo, hi) {
    var level = null, px = 0, py = 0, pz = 0
    try {
      level = player.level
      var bp = player.blockPosition()
      px = bp.x; py = bp.y; pz = bp.z
    } catch (e) { return null }
    if (!level) return null

    if (openAt(level, px, py + 40, pz) === null) {
      if (!readsWarned) {
        readsWarned = true
        console.warn(TAG + 'block reads unavailable in this KubeJS build - the ground ' +
          'finder is INERT and every wave takes the old blind path. Not fatal, but ' +
          'placement failures underground will continue.')
      }
      return null
    }

    for (var i = 0; i < FIND_TRIES; i++) {
      var angle = Math.random() * Math.PI * 2
      var dist = lo + Math.random() * (hi - lo)
      var x = px + Math.round(Math.cos(angle) * dist)
      var z = pz + Math.round(Math.sin(angle) * dist)
      for (var j = 0; j < Y_LADDER.length; j++) {
        var y = py + Y_LADDER[j]
        if (openAt(level, x, y, z) !== true) continue
        if (openAt(level, x, y + 1, z) !== true) continue    // headroom
        if (openAt(level, x, y - 1, z) !== false) continue   // a floor to stand on
        return { x: x + 0.5, y: y, z: z + 0.5 }
      }
    }
    return null
  }

  // Returns { asked, placed, valid } - `placed` is MEASURED, and is null if the
  // count could not be taken. null and 0 are different answers.
  function wave(player, opts, onMeasured) {
    if (!player || !opts || !opts.ids || !opts.ids.length) return { asked: 0, placed: 0, valid: [], measured: true }
    var server = null
    try { server = player.server } catch (e) { }
    if (!server) { console.error(TAG + 'no server handle'); return { asked: 0, placed: null, valid: [] } }

    var name = '?'
    try { name = String(player.username) } catch (e) { }

    // Only ever summon ids that passed the boot check.
    var ids = []
    for (var i = 0; i < opts.ids.length; i++) {
      if (validate(server, opts.ids[i])) ids.push(opts.ids[i])
    }
    if (!ids.length) {
      console.error(TAG + '!! wave for ' + name + ' had NO valid ids - nothing sent. ' +
        'Asked for: ' + opts.ids.join(', '))
      return { asked: 0, placed: 0, valid: [] }
    }

    var count = Math.max(0, Math.min(MAX_PER_WAVE, opts.count | 0))
    if (count === 0) {
      // A wave of zero is a legitimate answer - a reckoning at zero pressure sends
      // nothing. It must NOT quietly become a default wave (docs/24 §E7).
      say('wave of ZERO for ' + name + ' - sending nothing, as asked')
      return { asked: 0, placed: 0, valid: ids }
    }

    // An explicit ring from the caller always wins. Otherwise the default, tightened
    // underground - see the constants. A god that wants a wave at the horizon still
    // asks for one; nothing here takes that away.
    var lo = opts.minDist, hi = opts.maxDist
    if (!lo || !hi) {
      var deep = false
      try {
        if (VELDORA.events && typeof VELDORA.events.isUnderground === 'function') {
          deep = VELDORA.events.isUnderground(server, player) === true
        }
      } catch (e) { }
      lo = lo || (deep ? DEEP_MIN : MIN_DIST)
      hi = hi || (deep ? DEEP_MAX : MAX_DIST)
    }
    var before = countNear(player, ids, hi + SCAN_PAD)

    var blind = 0
    for (var k = 0; k < count; k++) {
      var id = ids[Math.floor(Math.random() * ids.length)]
      var spot = findSpot(player, lo, hi)
      try {
        // ⚠️ NOT createEntity().spawn() - see the header. And the return value is
        // deliberately ignored: E0 P12 proved it is undefined either way, so the
        // scan below is the only honest evidence.
        if (spot) {
          server.runCommandSilent('summon ' + id + ' ' +
            spot.x + ' ' + spot.y + ' ' + spot.z + (opts.nbt ? ' ' + opts.nbt : ''))
        } else {
          // Fall back to the original blind shot rather than sending nothing. It is
          // what shipped, so this can only ever be as bad as before, never worse.
          blind++
          var angle = Math.random() * Math.PI * 2
          var dist = lo + Math.random() * (hi - lo)
          var dx = Math.round(Math.cos(angle) * dist)
          var dz = Math.round(Math.sin(angle) * dist)
          server.runCommandSilent(
            'execute at ' + name + ' run summon ' + id + ' ~' + dx + ' ~ ~' + dz +
            (opts.nbt ? ' ' + opts.nbt : ''))
        }
      } catch (e) {
        console.warn(TAG + 'summon threw for ' + id + ' :: ' + e)
      }
    }
    if (blind) {
      say('no open spot found for ' + blind + ' of ' + count + ' - fell back to a ' +
        'blind summon for those. Tight quarters, or block reads are unavailable.')
    }

    // ⚠️ MEASURE ON A LATER TICK. A /summon does not make the entity queryable in
    // the same tick it is issued, so scanning immediately reports 0 for a wave that
    // arrived perfectly - measured 2026-08-15, when the first Interest logged
    // "asked 8 and NOTHING arrived" and the identical call 15s later measured 8.
    //
    // So `placed` cannot be returned synchronously and is delivered by callback.
    // A caller that must know whether the wave landed - a reckoning deciding
    // whether to settle - waits for it. One that does not can ignore it.
    var result = { asked: count, placed: null, valid: ids, measured: false }
    server.scheduleInTicks(MEASURE_DELAY, function () {
      var after = countNear(player, ids, hi + SCAN_PAD)
      var placed = (before === null || after === null) ? null : Math.max(0, after - before)
      result.placed = placed
      result.measured = true
      if (placed === null) {
        console.warn(TAG + 'wave for ' + name + ': asked ' + count +
          ', COULD NOT MEASURE how many arrived')
      } else {
        say('wave for ' + name + ': asked ' + count + ', measured ' + placed +
          ' (' + ids.join(', ') + ')')
        if (placed === 0) {
          console.error(TAG + '!! asked for ' + count + ' and NOTHING arrived. ' +
            'Valid ids, so this is placement: no room, wrong dimension, or a mod veto.')
        }
      }
      if (typeof onMeasured === 'function') {
        try { onMeasured(placed, count) } catch (e) {
          console.warn(TAG + 'onMeasured threw :: ' + e)
        }
      }
    })
    return result
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 issued() EXISTS BECAUSE SEVEN CALLERS GOT THIS WRONG THE SAME WAY.
  //
  // `placed` is null at return and filled in MEASURE_DELAY ticks later - exactly as
  // the header of wave() says in so many words. Every caller nevertheless wrote:
  //
  //     var r = wave(...)
  //     if (!r || r.placed === 0) { ...recover... }        // <-- never true
  //
  // `null === 0` is false, so that branch has NEVER RUN, in any of them. Found
  // 2026-08-16 from a log line that printed "Rehykt <- null of her brood" - the
  // cosmetic symptom of a guard that was structurally dead.
  //
  // THREE OF THE SEVEN WERE HARVEST FAILURE-RECOVERY - "release the lock so the
  // sweep retries". So a Harvest champion that failed to place left the player
  // sealed in the harvest phase with nothing to fight and no way out, and the one
  // piece of code written to rescue them could not fire.
  //
  // The fix separates two questions that are answerable at different times, which
  // is this project's own rule about never letting "I failed" and "I found nothing"
  // share a value:
  //
  //     issued(r)      did the spawner ACCEPT the request?   -> NOW
  //     onMeasured()   did anything actually ARRIVE?         -> ~a second later
  //
  // `asked` is > 0 on exactly the path that issues summons and 0 on every early
  // return, so this is synchronous, honest, and impossible to confuse with `placed`.
  function issued(r) { return !!(r && typeof r.asked === 'number' && r.asked > 0) }

  VELDORA.spawner = {
    wave: wave,
    issued: issued,
    validate: function (server, id) { return validate(server, id) },
    countNear: countNear,
    limits: { min: MIN_DIST, max: MAX_DIST, cap: MAX_PER_WAVE },
  }

  // ── boot: validate every roster anything might ask for ────────────────────
  // Done ONCE, out loud. A dead id is found on the day it dies rather than the day
  // somebody notices the raids have been empty for a month.
  var KNOWN = [
    'born_in_chaos_v1:dread_hound_not_despawn',   // Salvage's pack - persistent
    'born_in_chaos_v1:dread_hound',
    'born_in_chaos_v1:dire_hound_leader',         // the Hound herself
    'the_knocker:knocker',                        // the_hunt's surviving pair
    'the_knocker:knockerstalk',
  ]

  ServerEvents.loaded(function (event) {
    var ok = [], bad = []
    for (var i = 0; i < KNOWN.length; i++) {
      if (validate(event.server, KNOWN[i])) ok.push(KNOWN[i]); else bad.push(KNOWN[i])
    }
    checked = true
    say('VELDORA.spawner ring is ' + MIN_DIST + '-' + MAX_DIST + ' on the surface, ' +
      DEEP_MIN + '-' + DEEP_MAX + ' underground (was a flat 24-40, which put ' +
      'gauntlet and hollow outside aggro range)')
    say('VELDORA.spawner published OK - ring ' + MIN_DIST + '-' + MAX_DIST +
      ', cap ' + MAX_PER_WAVE + '/wave')
    say('roster validated: ' + ok.length + ' live, ' + bad.length + ' dead')
    if (bad.length) console.error(TAG + '!! DEAD IDS: ' + bad.join(', '))
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // /wave_test [n] - send a measured wave at yourself.
    event.register(Commands.literal('wave_test').requires(ADMIN)
      .then(Commands.argument('n', event.arguments.INTEGER.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var n = ctx.getArgument('n', Java.loadClass('java.lang.Integer'))
          // ⚠️ THE DIAGNOSTIC HAD THE BUG IT DIAGNOSES. It read r.placed on the same
          // tick, where it is always null, so /wave_test told every admin
          // "UNMEASURABLE" no matter what happened - the one tool you would reach
          // for to debug a placement failure, reporting a failure to measure.
          var r = wave(p, { ids: ['born_in_chaos_v1:dread_hound_not_despawn'], count: n },
            function (placed, asked) {
              if (placed === null) {
                p.tell(Text.of('§7asked §f' + asked + '§7, measured §cUNMEASURABLE'))
              } else {
                p.tell(Text.of('§7asked §f' + asked + '§7, measured §f' + placed))
                if (placed === 0 && asked > 0) {
                  p.tell(Text.of('§cNothing arrived. Ids are valid, so this is placement.'))
                }
              }
            })
          p.tell(Text.of(issued(r) ? '§8issued, measuring in ' + MEASURE_DELAY + 't...'
            : '§cthe spawner REFUSED it - no valid ids, no server, or count 0'))
          return 1
        }))
      .executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        p.tell(Text.of('§7/wave_test <n> §8- sends a measured wave at you'))
        p.tell(Text.of('§8ring ' + MIN_DIST + '-' + MAX_DIST + ', cap ' + MAX_PER_WAVE))
        return 1
      }))
  })
})();
