// Paths — declare one with /path, and hostile mobs start paying you in it.
//
// Ethan, 2026-08-04: "you should declare a path as a command and mobs being
// dropping the specific parts you need for that path ... So that progression is
// faster in that field."
//
// THE DESIGN RISK, AND THE THING BUILT AGAINST IT
//
// Mob drops that hand out materials are one step from Mystical Agriculture,
// which was CUT on 2026-08-03 for exactly this: it made resources obtainable
// without descending, and nothing at the bottom of the world could compete with
// a farm. A flat "kill things, get brass" would reintroduce that fault wearing a
// different hat.
//
// So the payout is TIERED BY THE DEPTH THE MOB DIED AT:
//
//     y >=   0   basic     the stuff you could already get
//     y  <   0   better    real components
//     y <= -64   best      the parts that are otherwise a long grind
//
// Killing things in your own basement pays badly. Killing things on the Sealed
// Floor pays properly. The path does not replace the descent - it gives the
// descent a second reason, personal to whichever player is doing it.
//
// KUBEJS TRAPS THIS FILE IS WRITTEN AGAINST (all previously paid for here):
//   * server scripts share ONE global scope - a top-level const collides across
//     files. Everything lives inside an IIFE.
//   * a `const` inside a nested block of a repeatedly-invoked callback is
//     re-declared every call and throws. Use `var` in those.
//   * Rhino will not hand back a bare Java method reference, so probing
//     `obj.m ? obj.m() : x` takes the fallback EVEN WHERE m EXISTS. Call it
//     inside try/catch instead.
//   * `global` cannot be assigned to in server scripts.
//   * runCommandSilent on the SERVER runs at server permission; the same call on
//     a player runs at theirs, and /give is then refused for non-ops.

(function () {
  // Every guidebook the pack ships. Ethan, 2026-08-04: "we should have access to
  // all guidebooks in the game". Fifteen books exist across these mods and most
  // players will never learn any of them are there - which is the same failure
  // as the paths themselves, one layer down.
  //
  // Give-forms are NOT interchangeable and all were verified against the command
  // parser before being written here:
  //   Patchouli   patchouli:guide_book[patchouli:book='<ns>:<id>']   SINGLE quotes
  //   Modonomicon modonomicon:modonomicon[modonomicon:book_id="..."] DOUBLE quotes
  //   everything else is a plain item.
  // fieldguide:field_guide is deliberately absent - it does not resolve as an
  // item id despite having a lang entry, and a menu row that fails is worse than
  // one that is missing.
  const BOOKS = {
    veldora:   ['Notes on Veldora',        'modonomicon:modonomicon[modonomicon:book_id="mcserver:veldora"]'],
    hermetica: ['The Hermetica (alchemy)', 'modonomicon:modonomicon[modonomicon:book_id="theurgy:the_hermetica"]'],
    ars:       ['Tattered Tome (Ars)',     "patchouli:guide_book[patchouli:book='ars_nouveau:worn_notebook']"],
    goety:     ['Black Book (necromancy)', "patchouli:guide_book[patchouli:book='goety:black_book']"],
    brews:     ['Witches Brew',            "patchouli:guide_book[patchouli:book='goety:witches_brew']"],
    hostility: ['Hostility Guide (levels)', "patchouli:guide_book[patchouli:book='l2hostility:hostility_guide']"],
    security:  ['SecurityCraft Manual',    'securitycraft:sc_manual'],
    banking:   ['Banking Guide',           'numismatics:banking_guide'],
    monsters:  ['Monster Guide',           'legendary_monsters:guide_book'],
    dinos:     ['InGen Field Guide',       'jurassicreborn:field_guide'],
    enchanting:['Blaze Enchanting Handbook', 'create_enchantment_industry:blazes_enchanting_handbook'],
  }
  const BOOK = BOOKS.veldora[1]
  const KEY = 'veldora_path'
  const CHANCE = 0.11          // per hostile kill, before the tier roll
  var warnedKill = false

  // Every id verified against the mod jars before being written here.
  const PATHS = {
    forge: {
      name: 'The Forge',
      blurb: 'Throughput. Power that works while you sleep - and stays at home.',
      drops: [
        ['minecraft:iron_nugget', 'create:andesite_alloy', 'minecraft:copper_ingot'],
        ['create:andesite_alloy', 'create:zinc_ingot', 'create:iron_sheet'],
        ['create:brass_ingot', 'create:electron_tube', 'create:precision_mechanism'],
      ],
    },
    art: {
      name: 'The Art',
      blurb: 'Verbs nothing else has. Light you carry into the dark.',
      drops: [
        ['minecraft:lapis_lazuli', 'ars_nouveau:magic_clay', 'minecraft:amethyst_shard'],
        ['ars_nouveau:source_gem', 'ars_nouveau:magic_clay', 'ars_nouveau:experience_gem'],
        ['ars_nouveau:source_gem', 'ars_nouveau:manipulation_essence', 'ars_nouveau:conjuration_essence'],
      ],
    },
    salvage: {
      name: 'The Salvage',
      blurb: 'You cannot make a gun. You find it, then you feed it forever.',
      drops: [
        ['minecraft:gunpowder', 'minecraft:iron_nugget', 'minecraft:copper_ingot'],
        ['minecraft:gunpowder', 'gunpowderore:gun_powder_ore', 'minecraft:iron_ingot'],
        ['gunpowderore:gun_powder_ore', 'gunpowderore:gun_powder_ore', 'minecraft:netherite_scrap'],
      ],
    },
    blade: {
      name: 'The Blade',
      blurb: 'The only power carried on your person. It cannot be raided.',
      drops: [
        ['minecraft:iron_nugget', 'minecraft:leather', 'minecraft:iron_ingot'],
        ['minecraft:iron_ingot', 'magistuarmory:bronze_ingot', 'minecraft:gold_ingot'],
        ['minecraft:diamond', 'magistuarmory:bronze_ingot', 'minecraft:netherite_scrap'],
      ],
    },
    crown: {
      name: 'The Crown',
      blurb: 'Adventurers cannot die. Servants can.',
      drops: [
        ['minecraft:bone', 'goety:grave_dust', 'minecraft:rotten_flesh'],
        ['goety:grave_dust', 'goety:shadow_essence', 'goety:empty_soul_jar'],
        ['goety:soul_emerald', 'goety:ominous_shard', 'goety:shadow_essence'],
      ],
    },
    wall: {
      name: 'The Wall',
      blurb: 'It wins nothing. It only refuses to lose.',
      drops: [
        ['minecraft:iron_nugget', 'minecraft:copper_ingot', 'minecraft:redstone'],
        ['minecraft:iron_ingot', 'securitycraft:keycard_lv1', 'minecraft:redstone_block'],
        ['securitycraft:keycard_lv3', 'securitycraft:keycard_lv2', 'minecraft:diamond'],
      ],
    },
  }

  function pathOf(player) {
    try { return player.persistentData.getString(KEY) || '' } catch (e) { return '' }
  }

  // ===========================================================================
  // commands
  // ===========================================================================

  ServerEvents.commandRegistry(event => {
    const Commands = event.commands

    // /guide         -> the Veldora book, plus the library index
    // /guide <name>  -> any guidebook in the pack
    // A guide you have to craft is a guide nobody reads.
    var guide = Commands.literal('guide').executes(ctx => {
      const p = ctx.source.player
      if (!p) return 0
      ctx.source.server.runCommandSilent('give ' + p.username + ' ' + BOOK + ' 1')
      p.tell('§6Notes on Veldora §7- what is known, and what is only said.')
      p.tell('§8Other books in this world - §f/guide <name>§8:')
      Object.keys(BOOKS).forEach(k => {
        if (k !== 'veldora') p.tell('  §e' + k + ' §8- §7' + BOOKS[k][0])
      })
      return 1
    })
    Object.keys(BOOKS).forEach(key => {
      guide = guide.then(Commands.literal(key).executes(ctx => {
        const p = ctx.source.player
        if (!p) return 0
        ctx.source.server.runCommandSilent('give ' + p.username + ' ' + BOOKS[key][1] + ' 1')
        p.tell('§6' + BOOKS[key][0])
        return 1
      }))
    })
    event.register(guide)

    // /path                -> what you are, and what is on offer
    // /path <name>         -> declare
    var root = Commands.literal('path').executes(ctx => {
      const p = ctx.source.player
      if (!p) return 0
      var cur = pathOf(p)
      p.tell(cur && PATHS[cur]
        ? '§6You walk ' + PATHS[cur].name + '§7. ' + PATHS[cur].blurb
        : '§7You have declared no path. §f/path <name>')
      Object.keys(PATHS).forEach(k => {
        p.tell('  §e' + k + ' §8- §7' + PATHS[k].name)
      })
      p.tell('§8Hostile kills pay in your path. Deeper kills pay better.')
      return 1
    })

    Object.keys(PATHS).forEach(key => {
      root = root.then(Commands.literal(key).executes(ctx => {
        const p = ctx.source.player
        if (!p) return 0
        p.persistentData.putString(KEY, key)
        p.tell('§6You walk ' + PATHS[key].name + '§7.')
        p.tell('§7' + PATHS[key].blurb)
        p.tell('§8Kills now pay in your path - and pay better the deeper you are.')
        return 1
      }))
    })
    event.register(root)
  })

  // ===========================================================================
  // the payout
  // ===========================================================================

  EntityEvents.death(event => {
    const victim = event.entity
    if (!victim || victim.player) return
    const killer = event.source ? event.source.player : null
    if (!killer) return

    // isMonster() is KubeJS's own accessor, mixed into every entity. Call it
    // directly - do NOT probe for it first, Rhino reads the probe as falsy.
    var monster = false
    try {
      monster = victim.isMonster()
    } catch (e) {
      if (!warnedKill) {
        warnedKill = true
        console.error('[paths] cannot read mob category, no payouts will drop '
                      + '(logged once per start): ' + e)
      }
      return
    }
    if (!monster) return

    var key = pathOf(killer)
    if (!key || !PATHS[key]) return
    if (Math.random() > CHANCE) return

    // THE ANTI-FARM RULE: the mob's death height decides the tier, so a basement
    // mob farm pays in iron nuggets and the Sealed Floor pays in brass.
    var y = 0
    try { y = Math.round(victim.y) } catch (e) { y = 0 }
    var tier = y >= 0 ? 0 : (y > -64 ? 1 : 2)

    var table = PATHS[key].drops[tier]
    var item = table[Math.floor(Math.random() * table.length)]
    try {
      event.server.runCommandSilent('give ' + killer.username + ' ' + item + ' 1')
    } catch (e) {
      console.warn('[paths] could not pay out ' + item + ': ' + e)
    }
  })

  console.info('[paths] active - ' + Object.keys(PATHS).length + ' paths, depth-tiered payouts')
})()
