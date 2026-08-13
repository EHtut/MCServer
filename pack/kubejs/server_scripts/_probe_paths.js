// _probe_paths.js — E0 of the Path System build.  docs/24-PATH-SYSTEM-BUILD.md
//
// NOTHING IS BUILT UNTIL THE APIS ARE PROVEN.
//
// docs/19 §C0 RESULTS exists because plausible-looking APIs fail SILENTLY in
// Rhino. EntityEvents.hurt does not exist. event.cancel() unwinds by throwing.
// removeModifier is unusable. `global` cannot be assigned. runCommandSilent
// returns 0 rather than throwing. Every one of those cost real time, and two of
// them shipped as features that did nothing for weeks.
//
// The Path System design leans on ELEVEN more assumptions. This file answers
// them and produces no gameplay whatsoever.
//
// Two halves, because several probes cannot be answered without a player:
//   BOOT     - runs on ServerEvents.loaded, needs nobody
//   /probe   - ADMIN, run in game; some rows auto-verify, some need Ethan's eyes
//
// Read the results, write them into docs/24 §E0, then DELETE THIS FILE.
;(function () {
  var TAG = '[probe] '
  var seen = {}

  function say(id, verdict, detail) {
    seen[id] = verdict
    console.info(TAG + id + ': ' + verdict + (detail ? '  ' + detail : ''))
  }

  // Try a list of [label, fn] and report which one answered. This is the pattern
  // the stalker build settled on after several accessors turned out to differ
  // between what the docs say and what this Rhino exposes.
  function firstThatWorks(id, cands, validate) {
    for (var i = 0; i < cands.length; i++) {
      try {
        var v = cands[i][1]()
        if (validate ? validate(v) : (v !== undefined && v !== null)) {
          say(id, 'OK', 'via ' + cands[i][0] + '  -> ' + String(v).substring(0, 48))
          return { ok: true, how: cands[i][0], value: v }
        }
      } catch (e) {
        // keep going - a throw here is information, not a failure
      }
    }
    say(id, 'FAILED', 'no candidate answered')
    return { ok: false }
  }

  // ==========================================================================
  // P9 - can spawns be intercepted per-player-proximity?
  //
  // The x4 combat spawn cost needs a hook that fires per spawn attempt and can
  // see which player is nearest. EntityEvents.checkSpawn was confirmed present
  // in the KubeJS jar, but "the name is registered" and "it fires, and I can
  // read a player from it, and I can deny" are three different claims.
  //
  // Passive counter only. It denies nothing.
  // ==========================================================================
  var spawnFires = 0
  var spawnCanSeePlayer = 0
  var spawnLogged = false
  EntityEvents.checkSpawn(function (event) {
    spawnFires++
    if (!spawnLogged) {
      spawnLogged = true
      var bits = []
      try { bits.push('entity=' + event.entity.type) } catch (e) { bits.push('entity=UNREADABLE') }
      try { bits.push('level=' + (event.level ? 'yes' : 'no')) } catch (e) { bits.push('level=THREW') }
      try { bits.push('canCancel=' + (typeof event.cancel === 'function')) } catch (e) { bits.push('canCancel=THREW') }
      console.info(TAG + 'P9 first checkSpawn fired :: ' + bits.join('  '))
    }
    // can we find the nearest player from inside this event?
    try {
      var lv = event.level
      var ps = lv.players
      if (ps && ps.length !== undefined) spawnCanSeePlayer++
    } catch (e) { }
  })

  // ==========================================================================
  // BOOT PROBES
  // ==========================================================================
  ServerEvents.loaded(function (event) {
    var server = event.server
    console.info(TAG + '=========== E0 BOOT PROBES ===========')

    // P6a - world day, the timestamp every deadline must use instead of tickCount
    // overworld is a METHOD CALL, not a property - notoriety.js has always had
    // this right and the first version of this probe got it wrong, which is a
    // neat demonstration of why the probe exists.
    firstThatWorks('P6a world-day', [
      ['overworld().dayTime()', function () { return Math.floor(server.overworld().dayTime() / 24000) }],
      ['overworld().getDayTime()', function () { return Math.floor(server.overworld().getDayTime() / 24000) }],
      ['overworld.dayTime()', function () { return Math.floor(server.overworld.dayTime() / 24000) }],
    ], function (v) { return typeof v === 'number' && isFinite(v) })

    // P12 - does runCommandSilent report failure? K8 proved it returns 0 rather
    // than throwing for an unknown entity. Confirm the return value is usable as
    // a success test, because three chunks below depend on it.
    var gS = 'x', bS = 'x', gC = 'x', bC = 'x'
    try { gS = server.runCommandSilent('time query daytime') } catch (e) { gS = 'THREW' }
    try { bS = server.runCommandSilent('summon mcserver:definitely_not_an_entity ~ ~ ~') } catch (e) { bS = 'THREW' }
    try { gC = server.runCommand('time query daytime') } catch (e) { gC = 'THREW' }
    try { bC = server.runCommand('summon mcserver:definitely_not_an_entity ~ ~ ~') } catch (e) { bC = 'THREW' }
    var usable = (gS !== undefined && gS !== bS) || (gC !== undefined && gC !== bC)
    say('P12 command return value', usable ? 'USABLE' : 'UNUSABLE - DO NOT TEST IT',
      'Silent valid=' + gS + ' invalid=' + bS + ' | runCommand valid=' + gC + ' invalid=' + bC)

    // P13 - if a command return cannot tell us an entity id is real, what can?
    // Three chunks summon entities by id (the hunt, Blade waves, Wall raids) and
    // K8 proved a bad id fails SILENTLY. We need a validator that is not a
    // command return value.
    // P13b - THE ANSWER, found inside P12's own output. runCommand returns the
    // command FEEDBACK TEXT, and an unknown id yields:
    //   Can't find element 'x:y' of type 'minecraft:entity_type'
    // `execute if entity @e[type=X]` validates the TYPE while spawning nothing
    // and mutating nothing, so it is safe to run over a whole roster at boot.
    // P13b - measure, do not guess. Log the RAW output of several candidate
    // validation commands for a known-good id and a known-bad one, and pick the
    // form whose two outputs actually differ.
    function raw(cmd) {
      try {
        var s = String(server.runCommand(cmd))
        return s.split(String.fromCharCode(10)).join(' | ').substring(0, 90)
      } catch (e) { return 'THREW: ' + String(e).substring(0, 70) }
    }
    var FORMS = [
      ['selector', function (id) { return 'execute if entity @e[type=' + id + ',limit=1]' }],
      ['summon-far', function (id) { return 'summon ' + id + ' 29999000 5000 29999000' }],
      ['loot-entity', function (id) { return 'data get entity @e[type=' + id + ',limit=1]' }],
    ]
    for (var fi = 0; fi < FORMS.length; fi++) {
      var label = FORMS[fi][0], mk = FORMS[fi][1]
      console.info(TAG + 'P13b [' + label + '] GOOD minecraft:pig -> ' + raw(mk('minecraft:pig')))
      console.info(TAG + 'P13b [' + label + '] BAD  bogus         -> ' + raw(mk('mcserver:definitely_not_an_entity')))
    }

    firstThatWorks('P13 entity-id validator', [
      ['createEntity(bad) is falsy', function () {
        var lv = server.overworld()
        var bad2 = null
        try { bad2 = lv.createEntity('mcserver:definitely_not_an_entity') } catch (e) { bad2 = 'THREW:' + e }
        var goodE = lv.createEntity('minecraft:pig')
        var verdict = (goodE && (!bad2 || String(bad2).indexOf('THREW') === 0)) ? 'yes' : 'no'
        try { if (goodE && goodE.discard) goodE.discard() } catch (e) { }
        return verdict === 'yes' ? ('good=object bad=' + String(bad2).substring(0, 24)) : null
      }],
      ['Utils.getRegistry entity_type', function () {
        var r = Utils.getRegistry('minecraft:entity_type')
        return (r.get('minecraft:pig') && !r.get('mcserver:definitely_not_an_entity')) ? 'registry lookup works' : null
      }],
    ])

    console.info(TAG + 'P9 checkSpawn registered - counter running, denies nothing')
    console.info(TAG + 'BOOT DONE. Run /probe in game for the rest (needs a player).')
    console.info(TAG + '======================================')

    // report the spawn counter every 30s so it can be read without a player
    function tick() {
      console.info(TAG + 'P9 checkSpawn fires so far: ' + spawnFires +
        '  (level readable in ' + spawnCanSeePlayer + ' of them)')
      server.scheduleInTicks(600, tick)
    }
    server.scheduleInTicks(600, tick)
  })

  // ==========================================================================
  // /probe - the player battery
  // ==========================================================================
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    event.register(Commands.literal('probe').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) { console.info(TAG + '/probe needs a player context'); return 0 }
      var srv = ctx.source.server

      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6§lE0 PROBES §8- results also in the server log'))

      // ---- P1  potion effects: apply AND clear -------------------------------
      var applied = false, cleared = false
      try { p.potionEffects.add('minecraft:blindness', 100, 0, false, false); applied = true } catch (e) { }
      var readBack = 'unreadable'
      try { readBack = String(p.potionEffects.isActive('minecraft:blindness')) } catch (e) {
        try { readBack = String(!!p.potionEffects.get('minecraft:blindness')) } catch (e2) { }
      }
      try { p.potionEffects.remove('minecraft:blindness'); cleared = true } catch (e) {
        try { p.potionEffects.clear(); cleared = true } catch (e2) { }
      }
      say('P1 potion add/clear', (applied && cleared) ? 'OK' : 'FAILED',
        'add=' + applied + ' readback=' + readBack + ' clear=' + cleared)
      p.tell(Text.of((applied && cleared ? '§aP1 ' : '§cP1 ') + '§7potion add/clear  §f' +
        'add=' + applied + ' clear=' + cleared))

      // ---- P5  food level: read AND write -----------------------------------
      var f0 = null, f1 = null
      try { f0 = p.foodLevel } catch (e) { }
      try { p.foodLevel = 11 } catch (e) { }
      try { f1 = p.foodLevel } catch (e) { }
      var foodOk = (f1 === 11)
      if (foodOk) { try { p.foodLevel = f0 } catch (e) { } }   // put it back
      say('P5 foodLevel rw', foodOk ? 'OK' : 'FAILED', 'before=' + f0 + ' set11-> ' + f1)
      p.tell(Text.of((foodOk ? '§aP5 ' : '§cP5 ') + '§7hunger read/write  §f' + f0 + ' -> ' + f1))

      // ---- P6  xp levels: read AND write ------------------------------------
      var x0 = null, x1 = null
      try { x0 = p.xpLevel } catch (e) { }
      try { p.xpLevel = (x0 || 0) + 1 } catch (e) {
        try { srv.runCommandSilent('xp add ' + p.username + ' 1 levels') } catch (e2) { }
      }
      try { x1 = p.xpLevel } catch (e) { }
      var xpOk = (x1 === (x0 || 0) + 1)
      if (xpOk) { try { p.xpLevel = x0 } catch (e) { } }
      say('P6 xpLevel rw', xpOk ? 'OK' : 'FAILED', 'before=' + x0 + ' +1-> ' + x1)
      p.tell(Text.of((xpOk ? '§aP6 ' : '§cP6 ') + '§7xp read/write  §f' + x0 + ' -> ' + x1))

      // ---- P10  container contents ------------------------------------------
      // Scans a small box under/around the player for any block with an
      // inventory, so it can be tested by standing next to a chest.
      var foundContainer = null, itemCount = -1
      try {
        var lv = p.level
        var bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z)
        for (var dx = -3; dx <= 3 && !foundContainer; dx++) {
          for (var dy = -2; dy <= 2 && !foundContainer; dy++) {
            for (var dz = -3; dz <= 3 && !foundContainer; dz++) {
              var b = lv.getBlock(bx + dx, by + dy, bz + dz)
              var inv = null
              try { inv = b.inventory } catch (e) { }
              if (inv) {
                foundContainer = String(b.id)
                try {
                  itemCount = 0
                  for (var s = 0; s < inv.size; s++) {
                    var st = inv.getStackInSlot(s)
                    if (st && !st.isEmpty()) itemCount++
                  }
                } catch (e) { itemCount = -1 }
              }
            }
          }
        }
      } catch (e) { }
      say('P10 container read', foundContainer ? (itemCount >= 0 ? 'OK' : 'PARTIAL') : 'NO CONTAINER NEARBY',
        'block=' + foundContainer + ' nonEmptySlots=' + itemCount)
      p.tell(Text.of((foundContainer && itemCount >= 0 ? '§aP10 ' : '§eP10 ') +
        '§7container read  §f' + (foundContainer || 'stand next to a chest and re-run')))

      // ---- P11  block reads: WHICH air test actually works? ------------------
      // The first version assumed `getBlock(x,y,z).isAir()` and threw. That same
      // call is what stalker.js K7 (placeBehind footing probe) depends on, so if
      // it is wrong there too, K7 silently falls back to the old behaviour.
      var lvlp = null
      try { lvlp = p.level } catch (e) { }
      var bx0 = Math.floor(p.x), by0 = Math.floor(p.y) - 1, bz0 = Math.floor(p.z)
      var blk = null, blkErr = ''
      try { blk = lvlp.getBlock(bx0, by0, bz0) } catch (e) { blkErr = String(e).substring(0, 70) }
      say('P11a getBlock(x,y,z)', blk ? 'OK' : 'FAILED', blkErr || ('-> ' + String(blk).substring(0, 40)))

      if (blk) {
        var airTests = [
          ['.isAir()', function (b) { return b.isAir() }],
          ['.isAir (property)', function (b) { return b.isAir }],
          ['.id === minecraft:air', function (b) { return String(b.id) === 'minecraft:air' }],
          ['.getId()', function (b) { return String(b.getId()) === 'minecraft:air' }],
          ['.blockState.isAir()', function (b) { return b.blockState.isAir() }],
        ]
        var winner = null
        for (var ai = 0; ai < airTests.length; ai++) {
          try {
            var r = airTests[ai][1](blk)
            if (typeof r === 'boolean') {
              say('P11b air test ' + airTests[ai][0], 'OK', 'returned ' + r)
              if (!winner) winner = airTests[ai][0]
            } else {
              say('P11b air test ' + airTests[ai][0], 'WRONG TYPE', 'returned ' + (typeof r))
            }
          } catch (e2) {
            say('P11b air test ' + airTests[ai][0], 'THREW', String(e2).substring(0, 60))
          }
        }
        say('P11 VERDICT', winner ? ('USE ' + winner) : 'NO AIR TEST WORKS',
          'block under you = ' + String(blk.id))
        p.tell(Text.of((winner ? '§a' : '§c') + 'P11 §7air test  §f' + (winner || 'none work')))

        // and the scan itself, using whichever won
        if (winner) {
          var fn = null
          for (var wi = 0; wi < airTests.length; wi++) if (airTests[wi][0] === winner) fn = airTests[wi][1]
          var scanned = 0, solid = 0, t0 = 0
          try {
            for (var i2 = -8; i2 <= 8; i2++) for (var j2 = -4; j2 <= 4; j2++) for (var k2 = -8; k2 <= 8; k2++) {
              scanned++
              if (!fn(lvlp.getBlock(bx0 + i2, by0 + j2, bz0 + k2))) solid++
            }
          } catch (e3) { scanned = -1 }
          say('P11c radius scan', scanned > 0 ? 'OK' : 'FAILED',
            'scanned=' + scanned + ' solid=' + solid + ' (17x9x17)')
          p.tell(Text.of('§7   scan  §f' + solid + '/' + scanned + ' solid'))
        }
      } else {
        p.tell(Text.of('§cP11 §7getBlock failed outright  §f' + blkErr))
      }

      // ---- P3  clickable chat - NEEDS A HUMAN --------------------------------
      // clickRunCommand, NOT click. `click(String)` threw a Throwable that
      // escaped the JS catch entirely and killed the whole command - the run
      // ended at P11 with "An unexpected error occurred" and P3 never logged.
      try {
        var line = Text.of('§c§l  [ CLICK ME ] §r§7 <- P3: click that. If a green line follows, clickable chat works.')
          .clickRunCommand('/probe_clicked')
        p.tell(line)
      } catch (e) {
        say('P3 clickable chat', 'FAILED', 'could not build the component :: ' + e)
        p.tell(Text.of('§cP3 §7clickable chat  §fcould not build the component'))
      }

      // ---- P2 / P4  need eyes ------------------------------------------------
      p.tell(Text.of(''))
      p.tell(Text.of('§e§lTHESE NEED YOUR EYES§r §7- run §f/probe_visual'))
      p.tell(Text.of('§8  P2 can you still read chat while blind?'))
      p.tell(Text.of('§8  P4 does minecraft:darkness actually land?'))
      p.tell(Text.of('§8§m                                        '))
      return 1
    }))

    // P3's other half
    event.register(Commands.literal('probe_clicked').executes(function (ctx) {
      var p = ctx.source.player
      say('P3 clickable chat', 'OK', 'the click ran a command')
      if (p) p.tell(Text.of('§a§lP3 OK §r§7- clickable chat runs commands. The ritual can use it.'))
      return 1
    }))

    // ---- P2 + P4: blind them, then talk to them ---------------------------
    event.register(Commands.literal('probe_visual').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server

      p.tell(Text.of('§7Blinding you for 8s, then darkness for 6s. Watch, then answer.'))
      try { p.potionEffects.add('minecraft:blindness', 160, 0, false, false) } catch (e) {
        say('P2 blindness+chat', 'FAILED', 'could not apply blindness :: ' + e); return 0
      }

      // talk to them WHILE blind - this is the whole premise of the ritual
      srv.scheduleInTicks(40, function () {
        try { p.tell(Text.of('§c§lIF YOU CAN READ THIS WHILE BLIND, P2 PASSES.')) } catch (e) { }
      })
      srv.scheduleInTicks(80, function () {
        try { p.tell(Text.of('§c§lSecond line. Still readable? Then the world can go dark and she can still speak.')) } catch (e) { }
      })
      srv.scheduleInTicks(170, function () {
        try { p.potionEffects.remove('minecraft:blindness') } catch (e) { }
        try { p.tell(Text.of('§7Blindness cleared. Now darkness (P4) for 6s.')) } catch (e) { }
      })
      srv.scheduleInTicks(190, function () {
        var okd = false
        try { p.potionEffects.add('minecraft:darkness', 120, 0, false, true); okd = true } catch (e) { }
        say('P4 darkness applies', okd ? 'APPLIED (confirm visually)' : 'FAILED')
        try {
          p.tell(Text.of(okd
            ? '§7Darkness applied. Did the screen pulse black? Tell Claude yes/no.'
            : '§cminecraft:darkness could not be applied at all.'))
        } catch (e) { }
      })
      srv.scheduleInTicks(330, function () {
        try { p.potionEffects.remove('minecraft:darkness') } catch (e) { }
        try {
          p.tell(Text.of('§8§m                                        '))
          p.tell(Text.of('§6Report back: §fP2 §7could you read chat while blind?'))
          p.tell(Text.of('§6              §fP4 §7did the screen go dark?'))
        } catch (e) { }
      })
      return 1
    }))

    // ---- P7 + P8: the death probes -----------------------------------------
    // These cannot be faked. Arm them, then go and die somewhere nasty.
    event.register(Commands.literal('probe_death').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      armed[String(p.uuid)] = true
      p.tell(Text.of('§7Death probe ARMED. Go die - ideally underground, in a pack.'))
      p.tell(Text.of('§8It records where you died vs where you woke, and what was'))
      p.tell(Text.of('§8targeting you 3s later. It changes nothing.'))
      return 1
    }))
  })

  // P7/P8 observation. Records only - it does not move anyone.
  var armed = {}
  var lastDeath = {}
  EntityEvents.death(function (event) {
    var e = event.entity
    try { if (!e || !e.username) return } catch (x) { return }
    var u = String(e.uuid)
    if (!armed[u]) return
    try {
      lastDeath[u] = {
        x: Math.round(e.x), y: Math.round(e.y), z: Math.round(e.z),
        dim: String(e.level.dimension), xp: e.xpLevel,
      }
      console.info(TAG + 'P7 death recorded at ' + lastDeath[u].x + ',' + lastDeath[u].y + ',' +
        lastDeath[u].z + ' in ' + lastDeath[u].dim + ' xp=' + lastDeath[u].xp)

      // P8, CORRECTED. The first version counted mobs around the RESPAWN point -
      // which under today's rules is the bed, 156 blocks away and perfectly safe.
      // That measures nothing about E2. The death-spiral risk is what is standing
      // at the DEATH SITE, because that is where E2 will put you. Sample it now,
      // while the chunk is still loaded and the corpse is warm.
      var hostile = 0, total = 0
      try {
        var around = e.level.getEntitiesWithin(e.boundingBox.inflate(24))
        for (var q = 0; q < around.length; q++) {
          var m2 = around[q]
          try {
            if (!m2 || m2.player || !m2.living) continue
            total++
            if (m2.isMonster && m2.isMonster()) hostile++
          } catch (z) { }
        }
      } catch (z) { total = -1 }
      say('P8 AT THE DEATH SITE', 'MEASURED',
        total + ' living mobs within 24 blocks of where you died, ' + hostile + ' hostile' +
        '  <- THIS is what E2 would wake you into')
    } catch (x) { console.info(TAG + 'P7 could not record the death :: ' + x) }
  })

  PlayerEvents.respawned(function (event) {
    var p = event.player
    var u = String(p.uuid)
    if (!armed[u] || !lastDeath[u]) return
    var d = lastDeath[u]
    var here = { x: Math.round(p.x), y: Math.round(p.y), z: Math.round(p.z) }
    var dist = Math.round(Math.sqrt(
      Math.pow(here.x - d.x, 2) + Math.pow(here.y - d.y, 2) + Math.pow(here.z - d.z, 2)))
    var nowDim = 'unreadable'
    try { nowDim = String(p.level.dimension) } catch (x) { }
    say('P7 respawn position', 'MEASURED',
      'died ' + d.x + ',' + d.y + ',' + d.z + ' -> woke ' + here.x + ',' + here.y + ',' + here.z +
      '  distance=' + dist + '  dim ' + d.dim + ' -> ' + nowDim +
      '  xp ' + d.xp + ' -> ' + p.xpLevel)
    try {
      p.tell(Text.of('§6P7 §7you woke §f' + dist + '§7 blocks from where you died.'))
      p.tell(Text.of('§6   §7xp §f' + d.xp + '§7 -> §f' + p.xpLevel +
        (d.xp === p.xpLevel ? ' §8(death cost nothing - as expected today)' : '')))
    } catch (x) { }

    // P8 - what is still hunting you where you landed?
    var srv = null
    try { srv = p.server } catch (x) { }
    if (srv) srv.scheduleInTicks(60, function () {
      var near = 0, targeting = 0
      try {
        var list = p.level.getEntitiesWithin(p.boundingBox.inflate(24))
        for (var i = 0; i < list.length; i++) {
          var m = list[i]
          try {
            if (!m || m.player) continue
            if (!m.living) continue
            near++
            var t = null
            try { t = m.getTarget() } catch (y) { try { t = m.target } catch (z) { } }
            if (t && String(t.uuid) === String(p.uuid)) targeting++
          } catch (y) { }
        }
      } catch (x) { near = -1 }
      say('P8 death spiral risk', 'MEASURED',
        '3s after respawn: ' + near + ' living mobs within 24 blocks, ' +
        targeting + ' still targeting the player')
      try {
        p.tell(Text.of('§6P8 §7' + near + '§7 mobs near you, §f' + targeting + '§7 still hunting you.'))
      } catch (y) { }
    })
    delete lastDeath[u]
  })
})()
