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
  // ⚠️ EVERY ID HERE MUST BE FROM AN INSTALLED MOD. Audited 2026-08-15 and FOUR
  // were not: securitycraft (cut in A2), legendary_monsters (A6), jurassicreborn
  // (A7) and theurgy (A2). Four of the five paths were handing out a book that
  // could not exist - the same failure as the guidebook icon that kicked a player
  // off the server this morning, one layer along.
  //
  // Re-check this table after ANY mod cut. tools/check_datapack_refs.py does not
  // read .js, so this one is on the reader.
  const BOOKS = {
    veldora:   ['Notes on Veldora',        'modonomicon:modonomicon[modonomicon:book_id="mcserver:veldora"]'],
    spirits:   ['Dictionary of Spirits',   'modonomicon:modonomicon[modonomicon:book_id="occultism:dictionary_of_spirits"]'],
    ars:       ['Tattered Tome (Ars)',     "patchouli:guide_book[patchouli:book='ars_nouveau:worn_notebook']"],
    goety:     ['Black Book (necromancy)', "patchouli:guide_book[patchouli:book='goety:black_book']"],
    brews:     ['Witches Brew',            "patchouli:guide_book[patchouli:book='goety:witches_brew']"],
    banking:   ['Banking Guide',           'numismatics:banking_guide'],
    enchanting:['Blaze Enchanting Handbook', 'create_enchantment_industry:blazes_enchanting_handbook'],
  }
  const BOOK = BOOKS.veldora[1]

  // The reading you are handed the moment you commit. Ethan: "guidebooks for each
  // to throw at the player. more reading material."
  //
  // A guide you have to know exists is a guide nobody reads - the whole reason
  // the pack felt like "vanilla with worse mobs" was that nothing pointed
  // anywhere. Choosing a path is the one moment we KNOW a player is asking "so
  // what do I do now", so that is when the books arrive.
  // 🪦 BOOKS ARE CUT (2026-08-15). Progression is taught by the gods now - the
  // `guidance` pool for a walker, pathless.js for someone who has not chosen.
  //
  // The table is kept EMPTY rather than deleted, because the giving machinery below
  // is harmless and this is where anyone would look to bring books back. It was
  // never fair anyway: Blade and Salvage got none while Wall got two.
  const PATH_BOOKS = {
    forge: [], art: [], salvage: [], blade: [], crown: [], wall: [],
  }

  // How often to nudge someone who walks no path. Long enough not to nag, short
  // enough that a new player cannot spend an evening not knowing the system
  // exists.
  const NUDGE_TICKS = 6000        // ~5 minutes

  const KEY = 'veldora_path'
  // C2 — the drop chance is no longer flat. It rides notoriety:
  //     0.08 + 0.002 x min(notoriety, 100)   ->  8% at 0, 11% at 15, 18% at 50, 28% at 100
  // The old flat 11% survives as roughly notoriety 15, so today's feel becomes
  // the EARLY game rather than the whole game.
  // E1, 2026-08-12. Ethan: "i can't find iron and i've been just spawning it in."
  //
  // Measured before changing anything: at his notoriety of 62 the rate was 20.4%,
  // and forge tier 0 paid an iron NUGGET as one of three items. That is
  //     0.204 x 1/3 = one nugget every 15 kills, and NINE make an ingot
  //     = 132 MONSTER KILLS PER IRON INGOT.
  // On top of which his path claim was empty, so he was earning exactly nothing.
  //
  // The nugget was the load-bearing problem, not the rate - swapping it for an
  // ingot alone takes 132 kills down to 15. The rate rise and the stack counts
  // below are what turn 15 into roughly 5.
  const CHANCE_BASE = 0.25     // was 0.08
  const CHANCE_PER = 0.0025    // was 0.002  -> 50% at notoriety 100
  const CHANCE_CAP = 100
  const CHANCE_FLAT = 0.11     // pre-C2 rate. Used ONLY when notoriety is unreadable.
  // How many of the rolled item, by depth tier. Deeper is not just better loot,
  // it is MORE of it - which is the descent doctrine expressed in the payout
  // rather than only in the item list.
  const COUNTS = [[1, 2], [1, 3], [2, 4]]

  // E1 verification: "did you produce anything" must be answerable without
  // watching a player's inventory. Counted per path, reported every 5 minutes.
  var paidOut = {}

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
  // E3. The path's `drops` coefficient multiplies the finished chance. Neutral is
  // 1.0, so a pathless player and a coefficient-less build are the same arithmetic
  // this function always did. Blade's is 0.6 ON PURPOSE - see coefficients.js.
  function dropCoeff(server, player) {
    try {
      if (typeof VELDORA !== 'undefined' && VELDORA.coeff &&
          typeof VELDORA.coeff.of === 'function') {
        var c = VELDORA.coeff.of(server, player, 'drops')
        if (typeof c === 'number' && isFinite(c)) return c
      }
    } catch (e) { warnOnce('VELDORA.coeff threw on drops :: ' + e) }
    return 1.0
  }

  function dropChanceFor(server, player) {
    try {
      if (typeof VELDORA !== 'undefined' && typeof VELDORA.notoriety === 'function') {
        var b = VELDORA.notoriety(server, player)
        if (b && typeof b.value === 'number' && isFinite(b.value)) {
          var raw = CHANCE_BASE + CHANCE_PER * Math.min(b.value, CHANCE_CAP)
          return Math.max(0, Math.min(1, raw * dropCoeff(server, player)))
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
        ['minecraft:iron_ingot', 'create:andesite_alloy', 'minecraft:copper_ingot'],
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
        ['minecraft:gunpowder', 'minecraft:iron_ingot', 'minecraft:copper_ingot'],
        ['minecraft:gunpowder', 'gunpowderore:gun_powder_ore', 'minecraft:iron_ingot'],
        ['gunpowderore:gun_powder_ore', 'gunpowderore:gun_powder_ore', 'minecraft:netherite_scrap'],
      ],
    },
    blade: {
      name: 'The Blade',
      blurb: 'The only power carried on your person. It cannot be raided.',
      drops: [
        // iron_ingot twice is DELIBERATE weighting, not a copy-paste slip: the
        // fighter needs iron most and Blade's drop coefficient goes DOWN later.
        ['minecraft:iron_ingot', 'minecraft:leather', 'minecraft:iron_ingot'],
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
      // ═══════════════════════════════════════════════════════════════════════
      // ⭐ HER TABLE IS HER OWN GUIDANCE, IN ORDER.  Ethan, 2026-08-16:
      //     "wall should be a bit more specific with an emphasis on both
      //      occultism and goety"
      //
      // Her eleven `guidance` lines in wall_voice.js are not flavour - they are
      // the two mods' progression, in sequence, phrased so neither is named:
      //
      //   "Chalk first, love."                     -> occultism chalk + pentacle
      //   "Small ones first."                      -> foliot before djinni
      //   "Bind one into a book"                   -> book of binding
      //   "The dead carry a kind of power in them" -> goety ectoplasm
      //   "That power is the currency down here"   -> ectoplasm, literally
      //   "A rod is only a rod until you seat
      //    something in it"                        -> goety wand + focus
      //   "What you seat in it decides what it
      //    says. Collect them."                    -> the cores
      //
      // So the tiers below ARE that ladder: surface = the bootstrap she tells you
      // to do first, below = the currency and the first real gear, sealed = the
      // things that are otherwise a long grind. Three Occultism and three Goety in
      // every tier, because she is the household of the living AND the dead and a
      // tier that is all one mod reads as the wrong god.
      //
      // 🚨 WHAT IS DELIBERATELY *NOT* HERE. `occultism:otherstone` and the other
      // otherworld blocks are invisible without the Third Eye, and that vision gate
      // is the best mechanic Occultism has. She hands you the INGREDIENTS for the
      // road to the goggles (datura seeds, silver), never the payoff behind the
      // veil. Likewise `goety:dark_wand` is gone: a finished tool teaches nothing,
      // and her own line is about what you SEAT in the rod, not the rod.
      //
      // ⚠️ SIX PER TIER IS NOT DILUTION HERE. One item is rolled uniformly, so a
      // longer list DOES lower each item's share - but wall's drops coefficient is
      // 2.5 and dropChanceFor() clamps at 1.0, so raw >= 0.4 saturates her: she
      // pays out on EVERY kill from notoriety 60 onward. Six entries spread a
      // firehose across six items instead of dumping all of it into four.
      //
      // Every id below was verified present in the installed jars AND confirmed to
      // be consumed downstream - the ingredient-count pass, 2026-08-16. Not
      // superficially: `goety:grave_dust` looked thematic and was cut because
      // nothing in Goety actually crafts with it.
      // ═══════════════════════════════════════════════════════════════════════
      drops: [
        // surface - "Chalk first, love." The bootstrap for both mods, plus one
        // vanilla anchor so a daylight kill is not always esoteric.
        ['occultism:datura_seeds', 'occultism:chalk_white_impure',
         'occultism:raw_silver', 'goety:ectoplasm', 'goety:savage_tooth',
         'minecraft:iron_ingot'],
        // below - "That power is the currency down here." No vanilla at all: this
        // is the depth where she stops topping you up and starts teaching.
        ['occultism:chalk_white', 'occultism:otherworld_essence',
         'occultism:book_of_binding_empty', 'goety:ectoplasm',
         'goety:cursed_ingot', 'goety:occult_fabric'],
        // sealed - "The ones worth having will not come for a beginner's chalk."
        // Every one of these is otherwise a dimension, a boss or a vault:
        //   raw_iesnium    the Other Place, and the gate to mid-game Occultism
        //   dark_ingot     NO recipe at all - treasure pouch / vault_unique only
        //   soul_emerald   sorcerer drop / vault_unique
        //   afrit_essence  a wild Afrit, or a high-tier ritual
        ['occultism:raw_iesnium', 'occultism:spirit_attuned_gem',
         'occultism:afrit_essence', 'goety:dark_ingot', 'goety:soul_emerald',
         'goety:animation_core'],
      ],
    },
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 UNBUILT PATHS ARE CLOSED.  Ethan, 2026-08-15: "Disable art and forge."
  // ═══════════════════════════════════════════════════════════════════════════
  // They were claimable and they would have given a player NOTHING - no voice, no
  // events, no Harvest, and Art's /help still taught a mod that is not installed.
  // A silent god is the exact failure this project has spent the day designing
  // against, and two of them were sitting live in the roster the whole time.
  //
  // ⚠️ NOT DELETED. The key stays in PATHS so drops, coefficients, regard rows and
  // anyone's existing claim keep resolving - closing a path and removing one are
  // different operations, and removing one strands whoever walks it.
  //
  // TO OPEN: delete the key from CLOSED. Do it when the god has a written voice and
  // registered events, not before - `[voice] N god(s)` at boot is the check.
  var CLOSED = {
    art: 'The Dreamwalker is not listening yet.',
    forge: 'The Goat does not answer.',
  }

  // ── the test override ──────────────────────────────────────────────────────
  // Ethan needs to test a path he does not walk - blade is Lehykt's, salvage is
  // Ben's, and moving a claim would desync the holder (paths.js has no loggedIn
  // reconciliation, so nothing would ever heal it).
  //
  // So testing borrows the ANSWER rather than the claim. Because every subsystem
  // reads pathOf, overriding it here reaches all of them at once - events, idle,
  // voice, phase, harvest, coefficients - with one change instead of six.
  //
  // IN MEMORY ON PURPOSE. It dies on restart, so it cannot be left on and later
  // mistaken for real behaviour, which is how a test flag becomes a production bug.
  // ⚠️ It does NOT touch claims. holderOf and the claim store are untouched, so a
  // borrowed path can never be accidentally taken from its real walker.
  var testAs = {}

  function pathOf(player) {
    try {
      var o = testAs[String(player.uuid)]
      if (o) return o
    } catch (e) { }
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
  // E2e — what the patron says as it takes everything you have. DRAFTS; the tone
  // ruling is that the patrons' words are Ethan's, and E5's introduction ritual
  // will carry the real scene. Each one is the same act read six ways: the Thief
  // calls it owed, the Mother calls it closeness, the Nightmare calls it rest.
  const ENTRY_LINE = {
    blade: 'Everything you were is nothing. Begin.',
    salvage: 'I will hold what you have, friend. Call it a deposit.',
    forge: 'Whatever you had is mine. Now build me something.',
    wall: 'Give it to me. All of it. There. Nothing between us.',
    crown: 'Your holdings are noted, and reassigned. Serve.',
    art: 'Empty hands. Good. Now you can sleep.',
  }

  const CLAIM = 'veldora_claim_'
  var warnedMismatch = {}   // username -> already shouted about a claim mismatch

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

  function givePathBooks(server, player, key) {
    var list = PATH_BOOKS[key] || []
    var given = []
    for (var i = 0; i < list.length; i++) {
      var b = BOOKS[list[i]]
      if (!b) continue
      try {
        server.runCommandSilent('give ' + player.username + ' ' + b[1] + ' 1')
        given.push(b[0])
      } catch (e) {
        console.warn('[paths] could not give ' + list[i] + ' :: ' + e)
      }
    }
    if (given.length) {
      player.tell('§7Reading, for the road:')
      for (var j = 0; j < given.length; j++) player.tell('  §6' + given[j])
      player.tell('§8§o/path books §8re-issues them. §8/guide §8lists every book in the world.')
    }
    return given.length
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
    // K4. This wrote the escrow marker from the PLAYER's tag alone. A stale tag -
    // and P1 proved those exist - would stamp '!escrow!theirName' over whoever
    // genuinely holds that path, evicting a walker who did nothing wrong. Only
    // the actual holder may put a path into escrow.
    if (holderOf(server, cur) !== player.username) {
      console.warn('[paths] refused to escrow ' + cur + ' for ' + player.username +
        ' - it is held by "' + holderOf(server, cur) + '"')
      try { player.persistentData.putString(KEY, '') } catch (e) { }
      return ''
    }
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

      // ⭐ THE RELEASE, PUBLISHED. It existed as a private function that only the
      // (now admin-only) /path release command could reach - so blade_events'
      // harvestWin logged "released, and offered the stay" while releasing nothing
      // at all. The log was describing an intention.
      //
      // Winning a Harvest is the one exit that is not a failure, and for the Spider
      // it is the ONLY exit. It needs to be a real call.
      release: function (server, player) {
        var gone = releasePath(server, player)
        if (gone) {
          console.info('[paths] ' + player.username + ' RELEASED from ' + gone)
          try {
            player.tell(Text.of('§8§m                                        '))
            player.tell(Text.of('§7You walk no path. It is open to the others.'))
          } catch (e) { }
          try { server.tell('§8' + player.username + ' has been released from ' +
            ((PATHS[gone] && PATHS[gone].name) || gone) + '.') } catch (e) { }
        }
        return gone
      },
    }
  } else {
    console.error('[paths] VELDORA namespace missing - C7 escrow will NOT work')
  }

  // ===========================================================================
  // commands
  // ===========================================================================

  ServerEvents.commandRegistry(event => {
    // ADMIN GATE, failing closed - if hasPermission throws, the answer is no.
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

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
      var shown = 0
      Object.keys(PATHS).forEach(k => {
        shown++
        var h = holderOf(srv, k)
        var esc = escrowHolder(h)
        var tag = esc
          ? (esc === p.username ? '§e(held for you)' : '§e(held - ' + esc + ' is choosing)')
          : (!h ? '§a(open)' : (h === p.username ? '§6(yours)' : '§c(' + h + ')'))
        // ⭐ ONLY WHAT YOU HAVE UNLOCKED. Ethan, 2026-08-15: "for it to appear on
        // /path you need to unlock it." A menu of five strangers was the most
        // video-game thing left in the project; a list of the ones who have
        // actually approached you reads as "go back to one you have met".
        var known = true
        try {
          if (VELDORA.chosen && typeof VELDORA.chosen.unlocked === 'function') {
            known = VELDORA.chosen.unlocked(p, k)
          }
        } catch (e) { }
        if (CLOSED[k]) {
          if (known) p.tell('  §8' + k + ' - ' + PATHS[k].name + ' §8(silent)')
        } else if (!known) {
          // Not "locked" - that names a system. They simply are not there.
          shown--
        } else {
          p.tell('  §e' + k + ' §8- §7' + PATHS[k].name + ' ' + tag)
        }
      })
      if (shown <= 0) {
        p.tell('§8Nothing is listed. Nothing has noticed you yet.')
        p.tell('§8They are watching what you carry.')
      }
      // Do NOT advertise /path release any more - it is admin-only, and a listed
      // command that refuses you reads as a bug rather than a rule.
      p.tell('§8One walker each, and a path is not something you set down.')
      p.tell('§8Hostile kills pay in your path. Deeper kills pay better.')

      // Notoriety belongs HERE, where players already look - not behind a command
      // nobody knows exists. Design 18 §3: the number is shown precisely because
      // it is your reward stat and you should be able to plan against it. The
      // phase is deliberately NOT named; that stays something you notice.
      if (typeof VELDORA !== 'undefined' && typeof VELDORA.notoriety === 'function') {
        try {
          var b = VELDORA.notoriety(srv, p)
          if (!b) throw 'unavailable'
          var pct = Math.round((0.08 + 0.002 * Math.min(b.value, 100)) * 1000) / 10
          p.tell('§8§m                                        ')
          p.tell('§7Notoriety §f§l' + b.value + ' §8- your kills pay §f' + pct + '%')
          p.tell('§8It rises with the levels you hold, and on its own with the days.')
          p.tell('§8Spending experience is the only thing that lowers it.')
        } catch (e) { }
      }
      return 1
    })

    // ═══════════════════════════════════════════════════════════════════════
    // ⚖️ RELEASE IS AN ADMIN COMMAND. Ethan's ruling, 2026-08-15. Closes docs/40
    // PART 9, which had been sitting open as "halfway considering".
    //
    // A choice you can walk back is not a choice. The introduction takes an XP
    // toll, blinds you, roots you and tells you what you are now - and a free
    // `/path release` undid all of it for nothing. It was also the largest
    // remaining ACT-COMMAND after `/path <name>` (23 PART V.6), and Ethan's
    // standing direction is that a player should be typing as little as possible.
    //
    // 🚨 THE EXITS ARE NOW: the fall (fall.js, live) · winning Blade's challenge
    // (PART 8, blade only) · and ABSENCE, WHICH DOES NOT EXIST YET. Until absence
    // ships, a walker who picks wrong has one slow exit and one admin. That is
    // the known cost of this ruling, not an oversight - see docs/41.
    // ═══════════════════════════════════════════════════════════════════════
    root = root.then(Commands.literal('release').requires(ADMIN).executes(ctx => {
      const p = ctx.source.player
      if (!p) return 0
      // K2. Releasing mid-Harvest cancelled it for free: the stalker unbinds, the
      // wipe can never land, and the path can be re-taken afterwards. The Harvest
      // is the whole point of the design and it must not have an /command exit.
      // Read through VELDORA so paths.js does not need to know how phase is stored.
      try {
        if (typeof VELDORA !== 'undefined' && typeof VELDORA.stalkerPhase === 'function') {
          if (VELDORA.stalkerPhase(ctx.source.server, p) === 'harvest') {
            p.tell('§4It is already coming for you.')
            p.tell('§7You cannot set down a path mid-Harvest. Finish it, or it finishes you.')
            return 0
          }
        }
      } catch (e) { /* unreadable phase must not brick the command */ }

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
    // /path forcerelease <name>  — ADMIN. Ethan's ruling for the permanent lock.
    //
    // escrowFor() clears the holder's own path tag, so releasePath() reads '' and
    // answers "you walk no path" - the one person entitled to give it up is the
    // one person who cannot. If they stop playing, that path is gone for good,
    // and on a six-path four-player server that is a third of the design.
    root = root.then(Commands.literal('forcerelease').requires(ADMIN)
      .then(Commands.argument('path', event.arguments.STRING.create(event))
        .executes(ctx => {
          var key = ctx.getArgument('path', Java.loadClass('java.lang.String'))
          if (!PATHS[key]) {
            ctx.source.sendSystemMessage(Text.of('§cUnknown path. ' + Object.keys(PATHS).join(', ')))
            return 0
          }
          var srv = ctx.source.server
          var was = holderOf(srv, key)
          setHolder(srv, key, '')
          srv.tell('§8' + PATHS[key].name + ' has been opened' +
            (was ? ' §8(was ' + was.replace(ESCROW, 'held by ') + ')' : '') + '.')
          return 1
        })))

    root = root.then(Commands.literal('books').executes(ctx => {
      const p = ctx.source.player
      if (!p) return 0
      var k = pathOf(p)
      if (!k || !PATH_BOOKS[k]) { p.tell('§7Declare a path first: §f/path <name>'); return 0 }
      givePathBooks(ctx.source.server, p, k)
      return 1
    }))

    // E3 THE LEGIBILITY LAW. A player must be able to see the numbers acting on
    // them. An axis with no live consumer is printed as INERT rather than quietly
    // listed alongside the working ones - a coefficient nobody reads must never
    // look like one that does.
    root = root.then(Commands.literal('coefficients').executes(ctx => {
      const p = ctx.source.player
      if (!p) return 0
      if (typeof VELDORA === 'undefined' || !VELDORA.coeff) {
        p.tell('§ccoefficients are not loaded - every path is running identical. This is a bug.')
        return 0
      }
      var e = VELDORA.coeff.explain(ctx.source.server, p)
      p.tell('§8§m                                        ')
      if (!e.path) {
        p.tell('§7You walk no path. Everything is §fneutral §7(×1).')
        return 1
      }
      p.tell('§6' + e.path + ' §8- §7' + e.role +
        (e.sub ? ' §8+ subclass §7' + e.sub + ' §8(half weight)' : ''))
      for (var i = 0; i < e.axes.length; i++) {
        var a = e.axes[i]
        var col = a.value > 1 ? '§a' : (a.value < 1 ? '§c' : '§f')
        p.tell('§7  ' + a.axis + ' §8' + (a.live ? '' : '§8[INERT - nothing reads this yet] ') +
          col + '×' + a.value + (a.base !== a.value ? ' §8(table ×' + a.base + ')' : ''))
      }
      if (e.online > 1) p.tell('§8  costs softened for ' + e.online + ' players online')
      return 1
    }))

    root = root.then(Commands.literal('testas').requires(ADMIN)
      .then(Commands.argument('path', event.arguments.STRING.create(event))
        .executes(ctx => {
          const p = ctx.source.player
          if (!p) return 0
          var key = ctx.getArgument('path', Java.loadClass('java.lang.String'))
          var u = String(p.uuid)
          if (key === 'off' || key === 'none') {
            delete testAs[u]
            p.tell('§7No longer borrowing a path. You are yourself again.')
            return 1
          }
          if (!PATHS[key]) {
            p.tell('§cUnknown path. ' + Object.keys(PATHS).join(', ') + ', or "off"')
            return 0
          }
          testAs[u] = key
          p.tell('§6Every god now reads you as walking ' + PATHS[key].name + '§6.')
          p.tell('§8No claim was touched. Clears on restart.')
          return 1
        })))

    root = root.then(Commands.literal('sample').requires(ADMIN).executes(ctx => {
      const p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var chance = dropChanceFor(srv, p)
      var rolls = 2000, hits = 0
      for (var i = 0; i < rolls; i++) { if (Math.random() <= chance) hits++ }
      var observed = hits / rolls
      var b = null
      try { if (typeof VELDORA !== 'undefined' && VELDORA.notoriety) b = VELDORA.notoriety(srv, p) } catch (e) { }
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

        // In their own voice, not as an error. "This path is disabled" is a
        // developer sentence; a god who will not answer is a world sentence.
        if (CLOSED[key]) {
          p.tell(Text.of('§8' + CLOSED[key]))
          p.tell(Text.of('§7Choose another, or wait.'))
          console.info('[paths] ' + p.username + ' reached for CLOSED path ' + key)
          return 0
        }

        // ⭐ YOU CANNOT TAKE A GOD YOU HAVE NEVER MET. The unlock is set by
        // chosen.js the moment you carry their thing, so this is not a grind gate -
        // it is the difference between answering somebody and cold-calling a
        // stranger. Fails OPEN if chosen.js is missing: a broken unlock system
        // must not lock everybody out of the game.
        try {
          if (VELDORA.chosen && typeof VELDORA.chosen.unlocked === 'function' &&
              !VELDORA.chosen.unlocked(p, key)) {
            p.tell(Text.of('§8They do not know you.'))
            p.tell(Text.of('§7Something has to notice you first.'))
            console.info('[paths] ' + p.username + ' reached for LOCKED path ' + key)
            return 0
          }
        } catch (e) { }

        // E2d: a patron that gave up on you locks you out of EVERY path, not only
        // the one you lost - otherwise the punishment is a two-second detour into
        // a different patron and means nothing. Being pathless IS the sentence.
        try {
          if (VELDORA.pathBlocked) {
            var cd = VELDORA.pathBlocked(srv, p)
            if (cd.blocked) {
              p.tell('§cNo patron will have you yet.')
              p.tell('§7' + cd.daysLeft + ' more day' + (cd.daysLeft === 1 ? '' : 's') +
                '§7. They are all still watching what you did.')
              return 0
            }
          }
        } catch (e) { /* a broken cooldown must never brick path selection */ }

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

        if (pathOf(p) === key) { p.tell('§7You already walk that path.'); return 0 }

        // ---------------------------------------------------------------------
        // I2 - EVERY MUTATION LIVES IN HERE, AND THIS ONLY RUNS ON ACCEPTANCE.
        //
        // docs/26 called path selection "the fourth place the P1 desync can be
        // born" - a player carrying veldora_path="forge" against an empty claim.
        // It would have been: the tag write and the claim write sat inline, so
        // putting a decision between them leaves them half-written on a refusal.
        //
        // The fix is structural rather than careful. Refusing is not an accept
        // that tidies up after itself - it is a path that never performs a write
        // at all, so there is nothing to desync. That includes the escrow
        // clearing below: turning a patron down must not quietly open the path
        // you were already holding.
        // ---------------------------------------------------------------------
        function commitPath() {
          // Choosing a DIFFERENT path while holding one in escrow opens the old one.
          Object.keys(PATHS).forEach(function (other) {
            if (other === key) return
            if (escrowHolder(holderOf(srv, other)) === p.username) {
              setHolder(srv, other, '')
              srv.tell('§8' + PATHS[other].name + ' is open. ' + p.username + ' did not go back.')
            }
          })
          var old = releasePath(srv, p)          // a walker holds exactly one
          p.persistentData.putString(KEY, key)
          setHolder(srv, key, p.username)
          if (old) p.tell('§8You set down ' + PATHS[old].name + '.')

          // ---------------------------------------------------------------------
          // E2e — TAKING A PATH STRIPS YOUR XP.
          //
          // Ethan, 2026-08-12: "taking a path strips you of all your existing xp."
          //
          // Three things at once (docs/23 §9.1c):
          //
          //  * It kills path-hopping. notoriety is max(xpLevel, days x rate), so
          //    without this a player could bank levels on one path and arrive at the
          //    next already fat.
          //  * It pushes players INTO the system early - the entry fee is everything
          //    accumulated so far, so the cheapest moment to take a path is
          //    IMMEDIATELY. Hoarding levels while pathless just builds a bigger bill.
          //  * It IS the introduction's price. §9.2 wanted each patron to demand
          //    something at the door, payable by someone who owns nothing. This is
          //    that demand, and it means six separate demands collapse into one
          //    mechanic plus six lines about taking it.
          //
          // The patron's first act is to take everything you have.
          // ---------------------------------------------------------------------
          var had = 0
          try { had = p.xpLevel || 0 } catch (e) { }
          if (had > 0) {
            var wiped = false
            try { p.xpLevel = 0; wiped = true } catch (e) {
              try { srv.runCommandSilent('xp set ' + p.username + ' 0 levels'); wiped = true }
              catch (e2) { console.error('[paths] E2e could not strip xp from ' + p.username + ' :: ' + e2) }
            }
            // Verify at the point of use - "I set it to 0" and "it is 0" are
            // different claims, and this project has shipped the first as the second.
            var now = -1
            try { now = p.xpLevel } catch (e) { }
            if (wiped && now !== 0) {
              console.warn('[paths] E2e xp strip did not stick for ' + p.username +
                ' - wanted 0, read back ' + now)
            }
            console.info('[paths] E2e ' + p.username + ' entered ' + key + ' - stripped ' +
              had + ' levels')
          }
          // The patron speaks as it takes. DRAFT lines - Ethan's own writing outranks
          // these, and the full introduction ritual (E5) will carry the real scene.
          // The patron's own colour - voice.js is the only file that knows it, and
          // hardcoding red here made the Spider speak in Blade's.
          var entryColour = '§4§l'
          try {
            if (VELDORA.voice && typeof VELDORA.voice.colourOf === 'function') {
              entryColour = VELDORA.voice.colourOf(key)
            }
          } catch (e) { }
          p.tell(Text.of(entryColour + ENTRY_LINE[key]))
          if (had > 0) p.tell('§c§lIt took everything you had. §8(' + had + ' levels)')

          p.tell('§6You walk ' + PATHS[key].name + '§7.')
          p.tell('§7' + PATHS[key].blurb)
          p.tell('§8Kills now pay in your path - and pay better the deeper you are.')
          givePathBooks(srv, p, key)
          srv.tell('§8' + p.username + ' walks ' + PATHS[key].name + '.')
        }

        // The patron speaks first. open() returns false only if it cannot run at
        // all, in which case we grant the old way rather than leave the player
        // with a command that silently did nothing.
        var staged = false
        try {
          if (VELDORA.intro && typeof VELDORA.intro.open === 'function') {
            staged = VELDORA.intro.open(srv, p, key, commitPath)
          }
        } catch (e) {
          console.error('[paths] the introduction threw, granting directly :: ' + e)
          staged = false
        }
        if (!staged) commitPath()
        return 1
      }))
    })
    event.register(root)
  })

  // ===========================================================================
  // the nudge - nobody can walk a path they never heard of
  // ===========================================================================
  //
  // The pack's original complaint was "no one knows what to do, so it is just
  // vanilla with worse mobs". Every system since then assumed the player already
  // knew paths existed. This is the only thing that tells them.
  //
  // It goes quiet the moment they choose, so it can never become the noise it is
  // meant to prevent.

  function nudge(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        if (pathOf(p)) continue

        // Someone mid-escrow HAS no path but is not adrift - they are deciding.
        // Nagging them as pathless, and listing their own held path as "open",
        // was telling them to take something they already have.
        var mine = Object.keys(PATHS).filter(function (k) {
          return escrowHolder(holderOf(server, k)) === p.username
        })
        if (mine.length) {
          p.tell('§7' + PATHS[mine[0]].name + ' §7is still held for you.')
          p.tell('§8Take it back with §f/path ' + mine[0] + '§8, or choose another.')
          continue
        }

        // 🔴 THE MENU NUDGE IS CUT (2026-08-15). It listed every path - including
        // the CLOSED ones and retired Crown - and told a pathless player to "pick
        // one with /path <name>", which is the exact model `chosen.js` replaced.
        //
        // You do not pick a god off a list any more. You are noticed for what you
        // carry, and until then `pathless.js` speaks for the silence. A timer that
        // nags you to choose undoes both.
        //
        // The escrow branch above still runs, because "your path is held for you"
        // is a real thing a player needs telling.
      }
    } catch (e) { console.warn('[paths] nudge threw :: ' + e) }
    server.scheduleInTicks(NUDGE_TICKS, function () { nudge(server) })
  }

  ServerEvents.loaded(function (event) {
    event.server.scheduleInTicks(NUDGE_TICKS, function () { nudge(event.server) })
    console.info('[paths] path nudge every ' + NUDGE_TICKS + 't for players with no path')
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
    // ---------------------------------------------------------------------
    // TAG SAYS ONE THING, CLAIM SAYS ANOTHER.
    //
    // Ethan, 2026-08-11: "mobs arent dropping any of the items they should."
    // Measured from world data: his tag was veldora_path="forge" while
    // veldora_claim_forge was the EMPTY STRING, so this guard returned on every
    // kill he ever made - no drop, no message, no log line. Silent for days.
    //
    // The state comes from /path forcerelease, which clears the server claim but
    // NOT the holder's own tag. And it was unrecoverable in game: re-running
    // /path forge hits the "you already walk that path" short-circuit BEFORE it
    // would rewrite the claim, so the player is stuck earning nothing forever.
    //
    // An EMPTY claim means nobody holds the path. A player carrying its tag is
    // therefore its rightful walker, so ADOPT instead of silently paying nothing.
    // This cannot steal: a real holder is a non-empty name, and escrow is the
    // non-empty '!escrow!Name', both of which still fall through to the return.
    //
    // The audit's own rule, applied to itself: "I failed" and "I found nothing"
    // must never share a return value.
    // ---------------------------------------------------------------------
    var held = holderOf(event.server, key)
    if (held !== killer.username) {
      if (held === '') {
        setHolder(event.server, key, killer.username)
        console.warn('[paths] ' + killer.username + ' carried the ' + key +
          ' tag while its claim was EMPTY - adopted. They were being paid nothing.')
        try {
          killer.tell(Text.of('§e' + PATHS[key].name + '§7 had no registered walker.'))
          killer.tell(Text.of('§7It is yours again. Your kills pay from now on.'))
        } catch (e) { }
      } else {
        if (!warnedMismatch[killer.username]) {
          warnedMismatch[killer.username] = true
          console.warn('[paths] ' + killer.username + ' walks ' + key +
            ' but the claim is held by "' + held + '" - they are earning NOTHING.')
        }
        return
      }
    }
    if (Math.random() > dropChanceFor(event.server, killer)) return

    // THE ANTI-FARM RULE: the mob's death height decides the tier, so a basement
    // mob farm pays in iron nuggets and the Sealed Floor pays in brass.
    var y = 0
    try { y = Math.round(victim.y) } catch (e) { y = 0 }
    var tier = y >= 0 ? 0 : (y > -64 ? 1 : 2)

    var table = PATHS[key].drops[tier]
    var item = table[Math.floor(Math.random() * table.length)]
    var span = COUNTS[tier]
    var n = span[0] + Math.floor(Math.random() * (span[1] - span[0] + 1))
    try {
      // NOTE: runCommandSilent's return is USELESS - E0 probe P12 measured it
      // returning undefined for valid AND invalid commands alike. Do not test it.
      event.server.runCommandSilent('give ' + killer.username + ' ' + item + ' ' + n)
      paidOut[key] = (paidOut[key] || 0) + n
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

    // ---------------------------------------------------------------------
    // E1 VERIFICATION. `run_all`-style harnesses cannot see a subsystem that is
    // configured on and producing nothing - a whole go-live once passed green
    // while the live path returned zero. So the payout counter reports itself,
    // out loud, on a timer. A path with a walker and a flat zero here is a BUG,
    // not a quiet day.
    // ---------------------------------------------------------------------
    console.info('[paths] E1 drop economy: base ' + Math.round(CHANCE_BASE * 100) +
      '% +' + (CHANCE_PER * 100) + '%/notoriety, counts by tier ' +
      COUNTS.map(function (c) { return c[0] + '-' + c[1] }).join(' / '))

    function report(server) {
      var keys = Object.keys(paidOut)
      if (keys.length) {
        var bits = []
        for (var i = 0; i < keys.length; i++) bits.push(keys[i] + '=' + paidOut[keys[i]])
        console.info('[paths] items paid out since boot: ' + bits.join('  '))
      } else {
        // Say the zero OUT LOUD. Silence and "nothing happened" must not look alike.
        var walked = []
        try {
          var ps = server.players
          for (var j = 0; j < ps.length; j++) {
            var k = pathOf(ps[j])
            if (k) walked.push(ps[j].username + ':' + k)
          }
        } catch (e) { }
        if (walked.length) {
          console.warn('[paths] ZERO payouts since boot, but these players walk a path: ' +
            walked.join(', ') + ' - if this persists, E1 is not working.')
        }
      }
      server.scheduleInTicks(6000, function () { report(server) })   // 5 min
    }
    event.server.scheduleInTicks(6000, function () { report(event.server) })
  })

  var closedList = []
  for (var ck in CLOSED) if (CLOSED.hasOwnProperty(ck)) closedList.push(ck)
  console.info('[paths] active - ' + Object.keys(PATHS).length + ' paths, depth-tiered ' +
    'payouts. CLOSED (unbuilt, cannot be claimed): ' + (closedList.join(', ') || 'none'))
})()
