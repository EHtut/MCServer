// help.js — orientation.  Ethan, 2026-08-11: "we kinda still are in an
// information drought."
//
// This is the fourth attempt at the same problem and the first one that does not
// require the player to already know something. The guidebook needs you to have a
// book. The advancements need you to trigger them. The nudge only fires if you
// walk no path. /help needs nothing.
//
// Two halves:
//   /help          asked for. Everything, on one screen, in the order a new
//                  player actually needs it.
//   the hints      unasked for. One line every 30-60 minutes, drawn from YOUR
//                  path, telling you the next concrete thing to do.
//
// Every factual claim below was checked against the jars rather than remembered:
// TaCZ really does have no recipe that produces a gun, SecurityCraft really does
// generate nothing in the world, Goety really does register 64 servants.
;(function () {
  // 30-60 minutes, re-rolled each time. A fixed interval becomes wallpaper - you
  // learn its rhythm and stop reading it. An uneven one keeps catching you.
  var HINT_MIN = 36000            // 30 min
  var HINT_MAX = 72000            // 60 min
  var RECENT = 3                  // never repeat within this many hints

  // ⚠️ FOUR OF THE SEVEN LINES HERE WERE WRONG (audited 2026-08-16, from a
  // screenshot of the live game). Each was true when written:
  //
  //   "Six paths"                      -> five, and two of those are CLOSED
  //   "/path fixes that"               -> you do not pick a god off a menu any
  //                                       more, you are chosen (chosen.js)
  //   "/guide hands you every book"    -> BOOKS ARE CUT
  //   "Something is following you"     -> the stalker, RETIRED
  //
  // 🚨 AND THE WHOLE POOL OVERLAPPED pathless.js, which now owns what a pathless
  // player hears - the body beats, the unreadable argument, the gods' verdicts. Two
  // systems talking to the same silence, one of them describing a game that no
  // longer exists.
  //
  // What is left is only what this file is actually FOR: durable world facts a
  // player cannot infer, and which no god would bother to say. Atmosphere belongs to
  // pathless.js; progression belongs to the `guidance` pool. This is the almanac.
  var PATHLESS = [
    'Iron is richest between y54 and y120 - and nothing hostile spawns above y40.',
    'Above y40 the dark is empty. Below y0 nothing holds it back. Choose your depth.',
    'Your notoriety is the XP level you are carrying, and it rises on its own with the days.',
    'Spending experience is the only thing that lowers notoriety.',
    'Nothing has claimed you. Things are watching what you carry.',
  ]

  var HINTS = {
    forge: [
      'Andesite alloy is the gate. Zinc and iron, or a mixer if you got that far.',
      'Water wheels before steam. Speed and stress are the only two numbers that matter.',
      'A millstone and a press will carry you further than any amount of cogs.',
      'Your kills pay in cogs, zinc and brass - and pay better the deeper you kill.',
      'Iron ore is thickest y54-y120, where nothing hostile spawns. Mine there, fight lower.',
      'The Forge scales without you present. Nothing else here does.',
    ],
    art: [
      'Source is the currency. A Source Jar beside a Relay is the entire early game.',
      'Glyphs are written at the Scribes Table. Break and Touch first, then everything.',
      'The Art is the only reliable answer to the dark below minus sixty-four.',
      'Your kills pay in source gems and essence. Deeper is better.',
      'Theurgy and Goety sit on top of Ars, not beside it. Learn Ars first.',
    ],
    blade: [
      'Better Combat is per-weapon. Learn one weapon properly, not five badly.',
      'Combat Roll is bound in your controls. It is the difference between deep and dead.',
      'The Blade is the only power carried on your body. It cannot be raided.',
      'Your kills pay in iron, bronze and eventually diamond. Kill deeper.',
      'If you need ore rather than a fight, y54-y120 is safe and rich. Nothing spawns up there.',
      'Nothing scales with depth any more. What is down there is simply MORE of it.',
    ],
    salvage: [
      'You cannot craft a gun. Not one recipe makes one. You find it, then you feed it forever.',
      'Black residue exists only below minus sixty-four. That is not a difficulty curve, it is a wall.',
      'Ammunition comes off a reloading bench. The gun was always the easy part.',
      'Your kills pay in gunpowder and, deep enough, netherite scrap.',
      'Salvage does not cross the descent. Salvage IS the descent.',
    ],
    crown: [
      'Goety registers sixty-four servants. You are meant to send them in first.',
      'Everything the Crown does runs on souls. Get a soul jar early.',
      'Adventurers cannot die here. Servants can. That is the whole path.',
      'Your kills pay in grave dust, shadow essence and soul emeralds.',
      'Guard Villagers and Automaticons are the Crown too. Numbers are numbers.',
    ],
    // ⚠️ REWRITTEN 2026-08-15. Every line here was about SecurityCraft - the
    // reinforcer, the keypad, keycards - and SecurityCraft was CUT. A Wall player
    // opening /help was being told, in detail, how to use items that cannot exist.
    // Player-facing text is the last place stale content should survive, and it was
    // the last place anyone looked.
    //
    // She is Goety + Occultism now, and the thing a new walker most needs to know is
    // that her counter is a MOOD and it points at other people.
    wall: [
      'You raise the dead and bind spirits. Goety and Occultism are your path.',
      'Every minion you raise pleases her. Every one that dies does not.',
      'Her counter is RAGE. Low rage, she only ever helps you - /rage shows it.',
      'High rage, she stops helping you and starts hurting everyone else.',
      'In between, she asks your permission first. That window closes as rage climbs.',
      'Your own death enrages her most. Quiet days settle her.',
      'Your kills pay in chalk, soul braziers and binding books.',
      'She will never let you go. Winning her Harvest is the only way out.',
    ],
  }

  var recent = {}                 // uuid -> last few hint strings

  function pathOf(p) {
    try { return p.persistentData.getString('veldora_path') || '' } catch (e) { return '' }
  }

  function pick(uuid, pool) {
    var seen = recent[uuid] || []
    var fresh = pool.filter(function (h) { return seen.indexOf(h) < 0 })
    var from = fresh.length ? fresh : pool          // pool exhausted: allow repeats again
    var line = from[Math.floor(Math.random() * from.length)]
    seen.push(line)
    while (seen.length > RECENT) seen.shift()
    recent[uuid] = seen
    return line
  }

  function hintOnce(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        var key = pathOf(p)
        var pool = HINTS[key] || PATHLESS
        p.tell(Text.of('§8§o' + pick(String(p.uuid), pool)))
      }
    } catch (e) { console.warn('[help] hint threw :: ' + e) }
    schedule(server)
  }

  function schedule(server) {
    var wait = HINT_MIN + Math.floor(Math.random() * (HINT_MAX - HINT_MIN))
    server.scheduleInTicks(wait, function () { hintOnce(server) })
  }

  ServerEvents.loaded(function (event) {
    console.info('[help] /help registered; hints every ' +
      Math.round(HINT_MIN / 1200) + '-' + Math.round(HINT_MAX / 1200) + ' min, path-aware')
    schedule(event.server)
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands

    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // ⭐ /veldora admin - THE INDEX.
    //
    // There are ~40 admin and test commands spread across 25 script files, and the
    // only way to find one was to grep the source. Ethan, mid-test: "but i need
    // commands." A tool nobody can find is the same as a tool that does not exist.
    //
    // Grouped by what you are actually trying to do, because "list every command"
    // is what the tab-completer already does badly.
    function adminShow(ctx) {
      var p = ctx.source.player
      if (!p) return 0
      function h(s) { p.tell(Text.of('§6§l' + s)) }
      function c(cmd, what) { p.tell(Text.of('§f' + cmd + ' §8- §7' + what)) }
      p.tell(Text.of('§8§m                                                  '))
      p.tell(Text.of('§c§lVELDORA ADMIN'))

      h('JUMP A GOD TO A TIER  (this is the one you want)')
      c('/counters set <patron> <n>', 'blade medium 50 high 200 - wall medium 10 high 40')
      c('/counters', 'what every patron says you owe')
      c('/counters clear', 'zero them all')

      h('MAKE SOMETHING HAPPEN NOW')
      c('/events', 'the roster, your tier, and WHY each one is holding')
      c('/events fire <id>', 'fire one, ignoring cooldown and roll')
      c('/harvest begin | win | lose', 'the collection, forced')
      c('/speaker confess', 'the next confession cutscene, at any depth')
      c('/idle_test', 'which contexts apply, and force a line')

      h('HEAR ANY LINE')
      c('/voice <god> <tag>', 'speak any pool. Bad tag lists every registered one')
      c('/blade  /wall', 'that patron: counter and tier')
      c('/rage', 'the Spider: rage, target, grudge, pvp state')

      h('WHERE AM I IN THE ARC')
      c('/path', 'the roster and who holds what')
      c('/phase', 'helper / companion / absence / harvest')
      c('/notoriety', 'the number that drives phase')
      c('/regard', 'how close you are to the fall')
      c('/speaker', 'depth vs cutoff, and confession progress')

      h('WHEN IT GOES WRONG')
      c('/unstuck', 'release a player stuck blind or rooted in a scene')
      c('/ritual clear', 'force-end a scene')
      c('/speaker reset', 'make the deep voices forget you')
      c('/path forcerelease <path>', 'free a path whose holder is gone')

      p.tell(Text.of('§8§m                                                  '))
      p.tell(Text.of('§8player-facing help: §f/veldora'))
      return 1
    }

    event.register(Commands.literal('help_veldora').executes(function (ctx) { return show(ctx) }))
    event.register(Commands.literal('veldora')
      .then(Commands.literal('admin').requires(ADMIN).executes(function (ctx) { return adminShow(ctx) }))
      .executes(function (ctx) { return show(ctx) }))

    function show(ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var key = pathOf(p)

      p.tell(Text.of('§8§m                                                  '))
      p.tell(Text.of('§6§lVELDORA §8- you are underground for a reason'))
      p.tell(Text.of(''))
      p.tell(Text.of('§7This world is not vanilla with worse mobs. It has a spine:'))
      p.tell(Text.of('§8  the surface is survivable · the deep is where value is'))
      p.tell(Text.of('§8  and something down there has taken an interest in you.'))
      p.tell(Text.of(''))
      p.tell(Text.of('§e§lFIRST§r §7- pick a path. §f/path'))
      p.tell(Text.of('§8  Six of them. ONE walker each, first come, and you can'))
      p.tell(Text.of('§8  set yours down. Until you pick, your kills pay nothing.'))
      if (key) p.tell(Text.of('§8  You walk §f' + key + '§8. Its books: §f/path books'))
      p.tell(Text.of(''))
      p.tell(Text.of('§e§lTHEN§r §7- read something. §f/guide'))
      p.tell(Text.of('§8  Every book in the pack, handed over on request. Start'))
      p.tell(Text.of('§8  with §fNotes on Veldora§8 for the world itself.'))
      p.tell(Text.of(''))
      p.tell(Text.of('§e§lNOTORIETY§r §7- the number that runs everything. §f/notoriety'))
      p.tell(Text.of('§8  It is the XP LEVEL you are carrying, and it also rises'))
      p.tell(Text.of('§8  on its own with the days. It raises your drop rate AND'))
      p.tell(Text.of('§8  makes you stronger - §f/power§8 shows how much.'))
      p.tell(Text.of('§8  Spending experience is the only thing that lowers it.'))
      p.tell(Text.of(''))
      p.tell(Text.of('§e§lTHE DESCENT§r'))
      p.tell(Text.of('§8  0 to -64 the old diggings · -64 to -120 the deep works'))
      p.tell(Text.of('§8  -120 to the floor, the sealed floor. Deeper kills pay more.'))
      p.tell(Text.of(''))
      p.tell(Text.of('§e§lWHERE THE IRON IS§r §8- nothing else in this world says so'))
      p.tell(Text.of('§8  Richest at §fy54 to y120§8, and §fnothing hostile spawns'))
      p.tell(Text.of('§8  above y40§8 - that whole band is safe to mine.'))
      p.tell(Text.of('§8  y0 to y39 is capped. Below y0 nothing is capped at all.'))
      p.tell(Text.of('§8  Deeper pays better and kills you faster. Both are true.'))
      p.tell(Text.of(''))
      p.tell(Text.of('§8Commands: §f/path §8· §f/guide §8· §f/notoriety §8· §f/power §8· §f/veldora'))
      p.tell(Text.of('§8A hint will find you every half hour or so. You are not alone.'))
      return 1
    }
  })
})()
