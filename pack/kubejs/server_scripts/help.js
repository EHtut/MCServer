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

  var PATHLESS = [
    'You walk no path. Everything you kill pays you nothing. §f/path§7 fixes that.',
    'Six paths. One walker each, first come. §f/path§7 to see what is still open.',
    '§f/guide§7 hands you every book in this world. Most are better than this hint.',
    'Your notoriety is the XP level you are carrying, plus the days. §f/path§7 shows it.',
    'Something is following you. It is not hostile. Not yet.',
  ]

  var HINTS = {
    forge: [
      'Andesite alloy is the gate. Zinc and iron, or a mixer if you got that far.',
      'Water wheels before steam. Speed and stress are the only two numbers that matter.',
      'A millstone and a press will carry you further than any amount of cogs.',
      'Your kills pay in cogs, zinc and brass - and pay better the deeper you kill.',
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
    wall: [
      'Reinforced blocks are craftable RIGHT NOW - six hundred and sixty five recipes.',
      'SecurityCraft generates nothing in the world. There is nothing to find. Only to build.',
      'A keypad is worthless if the wall beside it is ordinary stone.',
      'Your kills pay in redstone, keycards and diamond.',
      'The Wall wins nothing. It only refuses to lose. That is a real answer to creepers.',
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

    event.register(Commands.literal('help_veldora').executes(function (ctx) { return show(ctx) }))
    event.register(Commands.literal('veldora').executes(function (ctx) { return show(ctx) }))

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
      p.tell(Text.of('§8Commands: §f/path §8· §f/guide §8· §f/notoriety §8· §f/power §8· §f/veldora'))
      p.tell(Text.of('§8A hint will find you every half hour or so. You are not alone.'))
      return 1
    }
  })
})()
