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
  // C2 — the drop chance is no longer flat. It rides notoriety:
  //     0.08 + 0.002 x min(notoriety, 100)   ->  8% at 0, 11% at 15, 18% at 50, 28% at 100
  // The old flat 11% survives as roughly notoriety 15, so today's feel becomes
  // the EARLY game rather than the whole game.
  const CHANCE_BASE = 0.08
  const CHANCE_PER = 0.002
  const CHANCE_CAP = 100
  const CHANCE_FLAT = 0.11     // pre-C2 rate. Used ONLY when notoriety is unreadable.
  var warnedKill = false
  var warnedNotoriety = false

  function warnOnce(msg) {
    if (warnedNotoriety) return          // one line per boot, not one per kill
    warnedNotoriety = true
    console.warn('[paths] C2 FALLBACK: ' + msg)
    console.warn('[paths] drops are running at the flat pre-C2 rate. That is a BUG, not a mode.')
  }

  // "could not read notoriety" and "notoriety is 0" must never share an answer.
  // Treating an unreadable value as 0 would pin every drop at 8% forever while
  // looking perfectly healthy - so the failure path returns the OLD flat rate and
  // says so out loud, once.
  function dropChanceFor(server, player) {
    try {
      if (typeof VELDORA !== 'undefined' && typeof VELDORA.notoriety === 'function') {
        var b = VELDORA.notoriety(server, player)
        if (b && typeof b.value === 'number' && isFinite(b.value)) {
          return CHANCE_BASE + CHANCE_PER * Math.min(b.value, CHANCE_CAP)
        }
        warnOnce('VELDORA.notoriety returned no usable value')
        return CHANCE_FLAT
      }
    } catch (e) {
      warnOnce('VELDORA.notoriety threw :: ' + e)
      return CHANCE_FLAT
    }
    warnOnce('VELDORA is not visible from paths.js (load order, or C1 failed to load)')
    return CHANCE_FLAT
  }

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

  // ---------------------------------------------------------------------------
  // EXCLUSIVITY — one player per path (Ethan, 2026-08-04)
  //
  // "only one person can have each path. If i choose creation my brother can't
  // choose it unless i relinquish it."
  //
  // He called it selfish design. It is the opposite: it is the only thing that
  // makes the paths' DENIALS bite. A path that gives throughput and denies you a
  // body only matters if the person who has a body is someone else. Four players
  // all walking the Forge is four people doing one thing slowly - exclusivity is
  // what turns specialisation into a reason to talk to each other.
  //
  // Claims live on the SERVER's persistent data, not the player's, because the
  // question "is the Forge taken" has to be answerable while its owner is
  // offline.
  // ---------------------------------------------------------------------------
  const CLAIM = 'veldora_claim_'

  function holderOf(server, key) {
    try { return server.persistentData.getString(CLAIM + key) || '' } catch (e) { return '' }
  }

  function setHolder(server, key, name) {
    try { server.persistentData.putString(CLAIM + key, name || '') } catch (e) {
      console.error('[paths] could not write claim for ' + key + ': ' + e)
    }
  }

  function releasePath(server, player) {
    var cur = pathOf(player)
    if (!cur) return ''
    if (holderOf(server, cur) === player.username) setHolder(server, cur, '')
    try { player.persistentData.putString(KEY, '') } catch (e) { }
    return cur
  }

  // ---------------------------------------------------------------------------
  // ESCROW — C7. Killing your stalker costs you your path.
  //
  // Ethan, 2026-08-05: "escrow". The path is HELD while its former walker
  // decides, and opens to everyone only if they walk away without choosing. The
  // stake stays real, but it is theirs to lose rather than a race they can be
  // sniped in while reading a single line of text.
  //
  // The marker is stored in the claim slot itself, so it needs no second store
  // and - importantly - paths.js's payout guard already compares the claim to the
  // killer's name, which means an escrowed path STOPS PAYING immediately. You
  // gave it up; you do not keep earning from it while you think.
  // ---------------------------------------------------------------------------
  const ESCROW = '!escrow!'

  function escrowHolder(value) {
    return (value && value.indexOf(ESCROW) === 0) ? value.substring(ESCROW.length) : ''
  }

  function escrowFor(server, player) {
    var cur = pathOf(player)
    if (!cur) return ''
    setHolder(server, cur, ESCROW + player.username)
    try { player.persistentData.putString(KEY, '') } catch (e) { }
    return cur
  }

  // C7 lives in stalker.js and needs to reach the claim store. `global` is
  // rejected in server scripts, so the shared VELDORA namespace carries it -
  // the same seam C1 proved works across files.
  if (typeof VELDORA !== 'undefined') {
    VELDORA.paths = {
      holderOf: holderOf,
      setHolder: setHolder,
      pathOf: pathOf,
      escrowFor: escrowFor,
      escrowHolder: escrowHolder,
      nameOf: function (key) { return (PATHS[key] && PATHS[key].name) || key },
    }
  } else {
    console.error('[paths] VELDORA namespace missing - C7 escrow will NOT work')
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
      var srv = ctx.source.server
      var cur = pathOf(p)
      p.tell(cur && PATHS[cur]
        ? '§6You walk ' + PATHS[cur].name + '§7. ' + PATHS[cur].blurb
        : '§7You have declared no path. §f/path <name>')
      Object.keys(PATHS).forEach(k => {
        var h = holderOf(srv, k)
        var esc = escrowHolder(h)
        var tag = esc
          ? (esc === p.username ? '§e(held for you)' : '§e(held - ' + esc + ' is choosing)')
          : (!h ? '§a(open)' : (h === p.username ? '§6(yours)' : '§c(' + h + ')'))
        p.tell('  §e' + k + ' §8- §7' + PATHS[k].name + ' ' + tag)
      })
      p.tell('§8One walker each. §f/path release§8 gives yours up.')
      p.tell('§8Hostile kills pay in your path. Deeper kills pay better.')

      // Notoriety belongs HERE, where players already look - not behind a command
      // nobody knows exists. Design 18 §3: the number is shown precisely because
      // it is your reward stat and you should be able to plan against it. The
      // phase is deliberately NOT named; that stays something you notice.
      if (typeof VELDORA !== 'undefined' && typeof VELDORA.notoriety === 'function') {
        try {
          var b = VELDORA.notoriety(srv, p)
          var pct = Math.round((0.08 + 0.002 * Math.min(b.value, 100)) * 1000) / 10
          p.tell('§8§m                                        ')
          p.tell('§7Notoriety §f§l' + b.value + ' §8- your kills pay §f' + pct + '%')
          p.tell('§8It rises with the levels you hold, and on its own with the days.')
          p.tell('§8Spending experience is the only thing that lowers it.')
        } catch (e) { }
      }
      return 1
    })

    root = root.then(Commands.literal('release').executes(ctx => {
      const p = ctx.source.player
      if (!p) return 0
      var gone = releasePath(ctx.source.server, p)
      if (!gone) { p.tell('§7You walk no path.'); return 0 }
      p.tell('§7You set down ' + PATHS[gone].name + '§7. It is open to the others.')
      ctx.source.server.tell('§8' + p.username + ' has relinquished ' + PATHS[gone].name + '.')
      return 1
    }))

    // C2 AUDIT — the gate is a MEASURED rate, not a reasoned one. This rolls the
    // real dropChanceFor() against the caller's real notoriety, so it exercises
    // the whole path including the cross-file VELDORA read. Pair it with
    // /notoriety_setday to move the number and sample again.
    root = root.then(Commands.literal('sample').executes(ctx => {
      const p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var chance = dropChanceFor(srv, p)
      var rolls = 2000, hits = 0
      for (var i = 0; i < rolls; i++) { if (Math.random() <= chance) hits++ }
      var observed = hits / rolls
      var b = (typeof VELDORA !== 'undefined' && VELDORA.notoriety)
        ? VELDORA.notoriety(srv, p) : null
      p.tell('§8§m                                        ')
      p.tell('§7notoriety   §f' + (b ? b.value : '§cUNREADABLE'))
      p.tell('§7expected    §f' + (Math.round(chance * 1000) / 10) + '%' +
        (chance === CHANCE_FLAT ? ' §c<- FLAT FALLBACK, notoriety was not read' : ''))
      p.tell('§7observed    §f' + (Math.round(observed * 1000) / 10) + '% §8(' + hits + '/' + rolls + ')')
      var drift = Math.abs(observed - chance)
      p.tell(drift < 0.02 ? '§a  within tolerance' : '§c  DRIFT ' + (Math.round(drift * 1000) / 10) + 'pp')
      return 1
    }))

    Object.keys(PATHS).forEach(key => {
      root = root.then(Commands.literal(key).executes(ctx => {
        const p = ctx.source.player
        if (!p) return 0
        var srv = ctx.source.server
        var held = holderOf(srv, key)
        var esc = escrowHolder(held)
        if (esc) {
          // Held in escrow. Only the person deciding may take it back.
          if (esc !== p.username) {
            p.tell('§c' + PATHS[key].name + ' is held.')
            p.tell('§7' + esc + ' §7set it down and has not yet chosen. Wait.')
            return 0
          }
          // it is theirs to reclaim - fall through
        } else if (held && held !== p.username) {
          p.tell('§c' + PATHS[key].name + ' is walked by ' + held + '§c.')
          p.tell('§7Only one may walk each. They must §frelease§7 it first.')
          return 0
        }

        // Choosing a DIFFERENT path while holding one in escrow opens the old one.
        Object.keys(PATHS).forEach(function (other) {
          if (other === key) return
          if (escrowHolder(holderOf(srv, other)) === p.username) {
            setHolder(srv, other, '')
            srv.tell('§8' + PATHS[other].name + ' is open. ' + p.username + ' did not go back.')
          }
        })
        if (pathOf(p) === key) { p.tell('§7You already walk that path.'); return 0 }
        var old = releasePath(srv, p)          // a walker holds exactly one
        p.persistentData.putString(KEY, key)
        setHolder(srv, key, p.username)
        if (old) p.tell('§8You set down ' + PATHS[old].name + '.')
        p.tell('§6You walk ' + PATHS[key].name + '§7.')
        p.tell('§7' + PATHS[key].blurb)
        p.tell('§8Kills now pay in your path - and pay better the deeper you are.')
        srv.tell('§8' + p.username + ' walks ' + PATHS[key].name + '.')
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
    // The SERVER's claim is authoritative, not the player's copy. If the claim
    // was cleared while they still carry the key, they stop being paid - so a
    // stale tag can never quietly keep earning.
    if (holderOf(event.server, key) !== killer.username) return
    if (Math.random() > dropChanceFor(event.server, killer)) return

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

  // ===========================================================================
  // startup self-test
  //
  // Claims live on server.persistentData behind a try/catch, so if that API is
  // not what this KubeJS version exposes, every claim would fail SILENTLY and
  // exclusivity would look like it worked while enforcing nothing. Write a probe
  // and read it back, so a broken store is loud at boot instead of discovered by
  // two players ending up on the same path.
  // ===========================================================================
  ServerEvents.loaded(event => {
    var ok = false
    try {
      event.server.persistentData.putString('veldora_probe', 'ok')
      ok = event.server.persistentData.getString('veldora_probe') === 'ok'
    } catch (e) {
      console.error('[paths] server.persistentData threw: ' + e)
    }
    if (ok) {
      console.info('[paths] claim store OK - exclusivity is enforced')
    } else {
      console.error('[paths] CLAIM STORE NOT WORKING - paths will NOT be exclusive. '
                    + 'Two players could hold the same path.')
    }
  })

  console.info('[paths] active - ' + Object.keys(PATHS).length + ' paths, depth-tiered payouts')
})()
