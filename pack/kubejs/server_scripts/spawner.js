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

  var MIN_DIST = 24               // the_hunt's proven ring
  var MAX_DIST = 40
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

    var lo = opts.minDist || MIN_DIST
    var hi = opts.maxDist || MAX_DIST
    var before = countNear(player, ids, hi + SCAN_PAD)

    for (var k = 0; k < count; k++) {
      var id = ids[Math.floor(Math.random() * ids.length)]
      var angle = Math.random() * Math.PI * 2
      var dist = lo + Math.random() * (hi - lo)
      var dx = Math.round(Math.cos(angle) * dist)
      var dz = Math.round(Math.sin(angle) * dist)
      try {
        // ⚠️ NOT createEntity().spawn() - see the header. And the return value is
        // deliberately ignored: E0 P12 proved it is undefined either way, so the
        // scan below is the only honest evidence.
        server.runCommandSilent(
          'execute at ' + name + ' run summon ' + id + ' ~' + dx + ' ~ ~' + dz +
          (opts.nbt ? ' ' + opts.nbt : ''))
      } catch (e) {
        console.warn(TAG + 'summon threw for ' + id + ' :: ' + e)
      }
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

  VELDORA.spawner = {
    wave: wave,
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
          var r = wave(p, { ids: ['born_in_chaos_v1:dread_hound_not_despawn'], count: n })
          p.tell(Text.of('§7asked §f' + r.asked + '§7, measured §f' +
            (r.placed === null ? 'UNMEASURABLE' : r.placed)))
          if (r.placed === 0 && r.asked > 0) {
            p.tell(Text.of('§cNothing arrived. Ids are valid, so this is placement.'))
          }
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
