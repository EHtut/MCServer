// waves.js — four wave types, three variants each, and who augments them.
//
// Ethan, 2026-08-29:
//     "there are 3 main variations
//      General  - fodder + light specialists
//      Horder   - Fodder + tank specialists/ no ranged
//      Ranged   - Low fodder + high ranged specialists
//      Miniboss - High fodder + miniboss"
//     "there should be about 3 per wave type (Normal, Alternate, God augmented) which is
//      scaled by difficulty. Gods augmented waves are sorted by difficulty too:
//      Malice (Blade), heresy (wall), damnation (Art). No special god waves for forge
//      or salvage."
//
// ── ⭐ THE VARIANT AXIS IS THE SUBFACTION AXIS ─────────────────────────────────
// "Normal / Alternate / God-augmented" needed a rule, and the four subfactions he asked
// for the day before ARE that rule:
//
//     NORMAL     the SKELETON faction   — the thesis. She is the goddess of death.
//     ALTERNATE  the GHOST faction      — still hers. The dead who did not stay in a
//                                         body, which is a different dread entirely
//     GOD        that god's own roster  — somebody else reached into her water
//
// 🔑 AND IT EXPLAINS THE MISSING FAMILY. Zombies are almost absent from her tides, and
// that is not an oversight: *"She has a focus on skeletons, not zombies."* The zombies
// are BLADE'S — barrel zombie, zombie bruiser — so a wave full of them reads as him,
// which is exactly what a god-augmented wave is supposed to feel like.
//
// ── ⚠️ WHAT IS DELIBERATELY NOT IN HERE ────────────────────────────────────────
// ⛔ NECROMANCERS. `docs/72` flagged that goety's necromancers RAISE MORE UNDEAD and
// that a summoner inside a 24-mob wave is a multiplier on top of a multiplier. That
// risk was flagged and never cleared, so nothing that summons is in any roster.
//
// ⛔ THE 150-320 hp MINIBOSSES. `docs/73` noted that both of the tide's minibosses
// measure as tanks and that seven heavier mobs sit unused. Ethan RULED the two - Supreme
// Bonescaller and Fallen Chaos Knight - so they stay. Observation is not a mandate.
//
// ⛔ OCCULTISM'S `wild_*`. All twelve are Wild Hunt event mobs. Same reason.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[waves] '
  var GATE = true

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ WHAT MAKES A MOB FODDER. Ethan, 2026-08-30, after fighting three wave types:
  //
  //     "All enemies above 1-2 armor are not fodder those are specialists, fodder is
  //      defined by enemies you kill in 1-2 swings and just drag you down."
  //     "all baby enemies are considered specialists"
  //     "i don't like piglins or zombie villagers at all same with zoglins, remove them"
  //
  // 🔑 SO FODDER IS A MEASURED PROPERTY, NOT A VIBE, and the whole table was re-derived
  // against the live numbers rather than edited by hand:
  //
  //     armor <= 2   AND   hp <= 30   AND   dmg <= 5   AND not a baby
  //
  // ⚠️ THE DAMAGE CLAUSE IS AN INFERENCE FROM HIS WORDS, not a number he gave. "Drag you
  // down" is what fodder does; `goety:reaper` is 24 hp with NO armour and would pass an
  // armour-only test, but it hits for 8 and is a threat rather than a drag. It is a
  // specialist. Flagged because it is the one line here he did not dictate.
  //
  // 🔴 TWO MOBS LEFT FODDER ON HIS ARMOUR RULE ALONE: `bone_imp` (armor 3.5) and
  // `baby_skeleton` (a baby). Both had been in the bulk of every Normal wave.
  // ═══════════════════════════════════════════════════════════════════════════

  // 🚨 SKELETON FODDER — the bulk of every Normal wave. Every id below is measured
  // (docs/73), registry-verified, AND proven to survive being summoned
  // (tools/spawn_persist_check.py — three shipped ids did not).
  var BONE_FODDER = [
    'born_in_chaos_v1:decrepit_skeleton',   // 15 hp /  0 arm / 3 dmg — his bulk
    'cataclysm:koboleton',                  // 25 hp /  0 arm / 3 dmg
    'minecraft:wither_skeleton',            // 20 hp /  0 arm / 2 dmg
    'minecraft:stray',                      // 20 hp /  0 arm / 2 dmg
    'minecraft:bogged',                     // 16 hp /  0 arm / 2 dmg
    'born_in_chaos_v1:siamese_skeletons',   // 20 hp /  2 arm / 3 dmg — was "light"
    'goety:bone_lord',                      // 20 hp /  0 arm / 3 dmg
    'goety:rattled',                        // 20 hp /  0 arm / 2 dmg
    'goety:skeleton_wolf',                  // 10 hp /  0 arm / 4 dmg — fast, low
    'iceandfire:dread_thrall',              // 20 hp /  2 arm / 2 dmg
  ]
  // ⚠️ `stray` AND `bogged` ARE HERE AS MELEE, ON PURPOSE. Both measured 0 bows in 12
  // summons — they are not in epicknights' equipment config and /summon does not run
  // the vanilla equip step. As archers they were a fiction; as skeleton fodder they are
  // honest. ⭐ `bone_lord` and `rattled` were checked in the jar before being trusted:
  // both extend AbstractSkeleton and neither calls addFreshEntity, so neither is a
  // summoner. The names suggested otherwise and the class files settled it.

  // ⭐ GHOST FODDER — the Alternate. Lower armour, stranger silhouettes.
  var GHOST_FODDER = [
    'goety:wraith',                         // 25 hp / 0 arm / 4 dmg
    'goety:border_wraith',                  // 25 hp / 0 arm / 4 dmg
    'goety:muck_wraith',                    // 25 hp / 0 arm / 4 dmg
    'iceandfire:ghost',                     // 30 hp / 1 arm / 3 dmg
    'minecraft:phantom',                    // 20 hp / 0 arm / 2 dmg
    'goety:haunt',                          //  6 hp / 0 arm / 2 dmg — was "light"
  ]
  // 🔴 `goety:haunted_armor` WAS REMOVED FROM HERE AND IT WAS NOT A BALANCE CALL.
  // It DOES NOT SURVIVE BEING SUMMONED — measured 4 separate times, against a working
  // control, both with and without AI. It answers `summon` with "Summoned new Haunted
  // Armor" and is gone a second later. It had been shipped in this list, so one slot of
  // every ghost wave was spawning nothing at all. See D-111 and spawn_persist_check.py.

  // ⚠️ RANGED IS THREE MOBS AND ONE OF THEM IS UNRELIABLE. `minecraft:skeleton` arrives
  // holding a bow only ~30% of the time (measured, docs/73) because
  // config/epicknights/mobs_equipment.json5 gives it ~13 possible items and one bow.
  // 🚨 THE RANGED WAVE FORCES A BOW VIA NBT rather than hoping — see RANGED_NBT.
  var RANGED = [
    'minecraft:skeleton',
    'born_in_chaos_v1:bonescaller',
    'born_in_chaos_v1:skeleton_demoman',
  ]

  // ⭐ PROVEN 2026-08-29: this puts a bow in a mob that would otherwise arrive empty.
  // ⚠️ Tags MUST come first — putting them after HandItems silently dropped the tag.
  var RANGED_NBT = '{HandItems:[{id:"minecraft:bow",count:1},{}]}'

  // ⛔ `grim_and_bleak` IS STAGED FOR REMOVAL — Ethan, 2026-08-30. Both of its entries
  // were pulled from these two lists BEFORE that removal lands, because a roster naming
  // a mod that is gone spawns nothing and reads as correct code. Replacements are
  // measured, not guessed.
  var BONE_TANK = [
    'born_in_chaos_v1:skeleton_thrasher',   // 50 hp / 10 arm /  8 dmg — Ethan's tank
    'iceandfire:dread_knight',              // 40 hp / 20 arm /  2 dmg — replaces
    //                                         grim_and_bleak:damned_templar. ⭐ 20 armour
    //                                         and 2 damage: a WALL, not a killer, which
    //                                         is what a tank specialist is for.
  ]
  var GHOST_TANK = [
    'cataclysm:ignited_revenant',           // 80 hp / 12 arm /  6 dmg
    'cataclysm:ignited_berserker',          // 65 hp /  8 arm / 7.5 dmg — replaces
    //                                         grim_and_bleak:banshee, same family as
    //                                         the revenant so the pair reads as one kind
  ]
  // ⚠️ `supreme_bonescaller` WAS IN BONE_TANK AND IS NOT ANY MORE. It is BOSS_NORMAL —
  // the miniboss — and a miniboss that also turns up as an ordinary tank specialist is
  // not a miniboss. One mob, one role.

  // "light specialists" — present but not punishing. ⚠️ These are what the 5-20%
  // specialist share draws from in general and miniboss waves.
  var BONE_LIGHT = [
    'born_in_chaos_v1:bone_imp',            // 20 hp / 3.5 arm — armour rule, was fodder
    'born_in_chaos_v1:baby_skeleton',       // 10 hp / 1 arm  — BABY rule, was fodder
    'cataclysm:draugr',                     // 28 hp / 3 arm / 4 dmg
  ]
  // ⚠️ ONE ENTRY, DELIBERATELY, AND IT TOOK TWO REJECTED CANDIDATES TO GET HERE.
  // The ghost family is short of mobs that are specialists WITHOUT being zombies:
  //   ⛔ `iceandfire:dread_beast` — 30 hp / 1 arm / 4 dmg is FODDER by the rule three
  //      screens up. Listing it as a specialist would make the 10% share
  //      indistinguishable from the bulk it is drawn against.
  //   ⛔ `iceandfire:dread_ghoul` — passes on stats (30 hp / 4 arm) and is zombie-family
  //      by name. The harness rejected it and the harness is right: *"she has a focus on
  //      skeletons, not zombies"*, and a ghoul in her wave reads as Blade's.
  // ⭐ So the ghost alternate's specialist is the Reaper, every time. At 10% of a wave
  // that is a recurring silhouette rather than a monotony, and one honest entry beats a
  // second one picked to make the list look fuller.
  var GHOST_LIGHT = [
    'goety:reaper',                         // 24 hp / 0 arm / 8 dmg — the damage clause
  ]

  // Ethan's two, unchanged.
  var BOSS_NORMAL = 'born_in_chaos_v1:supreme_bonescaller'
  var BOSS_ALT = 'born_in_chaos_v1:fallen_chaos_knight'

  // ═══════════════════════════════════════════════════════════════════════════
  // THE GODS. His rosters, verbatim, all probed.
  // ⚠️ FORGE AND SALVAGE HAVE NONE. *"No special god waves for forge or salvage."*
  // That is a ruling, not a gap — she sends nothing at anyone, and Salvage deals rather
  // than attacks. Their rosters still exist in spawn_pressure.js for their OWN events.
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ A GOD ROSTER IS SPLIT FODDER/SPECIALIST TOO, 2026-08-30. It used to be one flat
  // `ids` list, which meant a god wave ignored his ratios entirely — Wall's wave was
  // half Mother Spiders because the boss was in the draw pool. Same shape as hers now.
  var GODS = {
    blade: {
      at: 1, tier: 'Malice',
      // His zombies. ⚠️ `barrel_zombie` (6 arm) and `door_knight` (7 arm) are
      // specialists by the armour rule; `zombie_bruiser` is 60 hp and is one too.
      fodder: ['born_in_chaos_v1:decaying_zombie'],   // 25 hp / 0.5 arm / 4 dmg
      spec: ['born_in_chaos_v1:barrel_zombie', 'born_in_chaos_v1:door_knight',
        'born_in_chaos_v1:zombie_bruiser', 'born_in_chaos_v1:skeleton_thrasher'],
      boss: 'born_in_chaos_v1:fallen_chaos_knight',
    },
    wall: {
      at: 2, tier: 'Heresy',
      // ⭐⭐ THE SPIDER RUN. Ethan: *"you probably need to do a run for spiders too for
      // wall."* Done — `#minecraft:arthropod` censused (42 ids), 19 shortlisted, all 19
      // registry-confirmed, 17 measured live, all persistence-checked.
      //
      // ⛔ `naturalist:desert_scorpion` and `jungle_scorpion` were DROPPED FOR A
      // MEASURED REASON, not because of the mod they came from: both summon and then
      // vanish before the next tick, against a control that survived the identical
      // command. Arachnids, right theme, and they cannot be placed.
      fodder: [
        'minecraft:spider',                 // 16 hp / 0 arm / 2 dmg — the archetype
        'minecraft:cave_spider',            // 12 hp / 0 arm / 2 dmg
        'born_in_chaos_fc:wither_scuttler', // 15 hp / 0 arm / 2 dmg
        'born_in_chaos_v1:corpse_fly',      // 10 hp / 0 arm / 2 dmg
        'minecraft:silverfish',             //  8 hp / 0 arm / 1 dmg — the swarm
      ],
      spec: [
        'born_in_chaos_v1:baby_spider',     // 10 hp /  0 arm — BABY rule, was "fodder"
        'born_in_chaos_v1:diamond_termite', // 14 hp /  8 arm
        'born_in_chaos_v1:thornshell_crab', // 25 hp / 14 arm / 0.8 kb-res
        'iceandfire:dread_scuttler',        // 40 hp / 10 arm / 7 dmg
      ],
      boss: 'born_in_chaos_v1:mother_spider',   // 90 hp / 6 dmg / kb-res 1
    },
    art: {
      at: 3, tier: 'Damnation',
      // 🔴 TWO OF HIS THREE MOBS AND HIS BOSS DO NOT SPAWN. Measured 0/3 each against a
      // control that passed 3/3: `restless_spirit` and `dark_vortex` answer `summon`
      // and are gone before the next command. `dark_vortex` was his BOSS, so Art's
      // miniboss wave has been arriving with no miniboss at all. See D-112.
      //
      // ⛔ NOT RE-AUTHORED HERE. The god rosters are Ethan's — he gave them verbatim —
      // and inventing Art two replacement mobs is a lore call, not a bug fix. The
      // broken ids are REMOVED so his waves are not part-empty, and `boss: null` makes
      // the wave fall back to HER miniboss, which needs no invention and is exactly
      // what this file did before D-108.
      //
      // ⭐ MEASURED CANDIDATES FOR HIS RULING, all persistence-checked:
      //     born_in_chaos_v1:swarmer        40 hp /  4 arm /  4 dmg
      //     born_in_chaos_v1:zombie_clown   35 hp /  4 arm /  3 dmg
      //     cataclysm:aptrgangr            160 hp / 10 arm / 18 dmg   (boss-weight)
      //     cataclysm:kobolediator         180 hp / 10 arm / 14 dmg   (boss-weight)
      fodder: ['born_in_chaos_v1:scarlet_persecutor'],  // 35 hp / 0 arm / 5 dmg
      spec: [],
      boss: null,
    },
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ HIS RATIOS. Ethan, 2026-08-30, after pitting Liam against three wave types:
  //
  //     General   90% fodder / 10% specialist
  //     Horde     95% fodder /  5% specialist
  //     Specialist 80% fodder / 20% specialist
  //     Miniboss  95% fodder /  5% specialist + miniboss
  //
  // 🔴 THIS REPLACED A DIFFERENT AXIS ENTIRELY AND THAT IS WHY THE WAVES PLAYED WRONG.
  // The old table weighted `ranged: 0.65` — the share of the wave that SHOOTS. But
  // every archer in this pack is a *specialist* by his table, so a 65% ranged wave was
  // a 65% SPECIALIST wave: more than three times the 20% he wants. Fodder-vs-specialist
  // is a ROLE axis and ranged-vs-melee is an ATTACK-TYPE axis; the old code had one
  // number doing both jobs, and the role axis is the one he tunes.
  //
  // ⚠️ ONE HOME FOR THE FOUR NUMBERS. They were nearly written onto each variant, which
  // is eight places for four values and a guarantee that Normal and Alternate drift
  // apart on a rule that is not per-variant.
  //
  // ⚠️ "Specialist" IS HIS NAME FOR THE THIRD TYPE; the code calls it `ranged`, because
  // that names what its specialists ARE. Same slot, and it is the one at 20%.
  // ═══════════════════════════════════════════════════════════════════════════
  var SPEC_FRAC = {
    general: 0.10,
    horde: 0.05,
    ranged: 0.20,
    miniboss: 0.05,
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE TWELVE. ⭐ `theme` is what the wave IS, in one line, and it is the thing to
  // argue with — the ids are just how it is spelled.
  //
  // ⚠️ `spec` IS THE ONE SPECIALIST POOL PER VARIANT NOW. `light` and `tank` were two
  // fields that meant the same thing to the composer and differed only in which list
  // got filled, so a wave with both was ambiguous about what its 5% should be.
  // ═══════════════════════════════════════════════════════════════════════════
  var WAVES = {
    general: {
      normal: {
        theme: 'The Rank and File — her ordinary dead, in numbers, with a few that ' +
          'have been down there long enough to be worth noticing.',
        fodder: BONE_FODDER, spec: BONE_LIGHT, boss: null,
      },
      alternate: {
        theme: 'The Draught — the same crowd with nothing solid in it. Wraiths and ' +
          'the restless, which hit no harder and are far worse to be surrounded by.',
        fodder: GHOST_FODDER, spec: GHOST_LIGHT, boss: null,
      },
    },
    horde: {
      normal: {
        theme: 'The Press — bodies and bone-armour, shoulder to shoulder. ' +
          '⛔ Nothing shoots. The threat is that it does not stop coming.',
        fodder: BONE_FODDER, spec: BONE_TANK, boss: null,
      },
      alternate: {
        theme: 'The Wailing — the same weight of dead arriving as a sound before ' +
          'anything is visible. ⛔ Still nothing shoots.',
        fodder: GHOST_FODDER, spec: GHOST_TANK, boss: null,
      },
    },
    ranged: {
      normal: {
        theme: 'The Volley — thin on the ground and murderous at distance. ' +
          'The only wave that punishes standing still.',
        fodder: BONE_FODDER, spec: RANGED, boss: null, bow: true,
      },
      alternate: {
        theme: 'The Bonecallers — the archers stay, the crowd in front of them does ' +
          'not. Almost nothing to hide behind, in either direction.',
        fodder: GHOST_FODDER, spec: RANGED, boss: null, bow: true,
      },
    },
    // 🔴 MEASURED IN PLAY, 2026-08-30. Ethan: *"i did a test on miniboss waves and
    // they genuinly should not have specialists, at the lower tiers. we can have very
    // small amounts in the higher tiers."*
    //
    // ⚠️ So `spec` is gated by difficulty at pick() time — see MINIBOSS_LIGHT. A
    // miniboss is already the hardest thing in the wave; anything standing between you
    // and it is a second fight you did not agree to. ⭐ That gate and his 5% are BOTH
    // enforced: the 5% is a ceiling, and at Uprising and Malice the pool is empty, so
    // the answer is zero however the rounding falls.
    miniboss: {
      normal: {
        theme: 'The Supreme — a crowd thick enough that you cannot reach the thing ' +
          'that matters, and the thing that matters knows it.',
        fodder: BONE_FODDER, spec: BONE_LIGHT, boss: BOSS_NORMAL,
      },
      alternate: {
        theme: 'The Fallen — a fallen version of the Warrior at the head of her dead. ' +
          'Nothing in the game explains why, and nothing should.',
        fodder: BONE_FODDER, spec: BONE_LIGHT, boss: BOSS_ALT,
      },
    },
  }

  var TYPES = ['general', 'horde', 'ranged', 'miniboss']

  // 🔴 HOW MANY LIGHT SPECIALISTS A MINIBOSS WAVE MAY CARRY, by difficulty index.
  // Ethan tested it: none at the bottom, "very small amounts in the higher tiers".
  //
  //   Uprising  0   nothing between you and it
  //   Malice    0   still nothing
  //   Heresy    1   one, and only one
  //   Damnation 2
  var MINIBOSS_LIGHT = [0, 0, 1, 2]

  // 🔴 ONE MINIBOSS PER TIDE, NOT PER WAVE. Ethan: *"it should also be 1 miniboss
  // per tide because the minibosses themselves are usually incredibly hard to fight on
  // their own."*
  //
  // ⚠️ A tide is MANY waves. Nothing here can enforce that on its own - this file
  // composes one wave and has no memory - so the cap lives in tide.js's per-run state
  // and this constant is what it reads. Named here so the number has one home.
  var BOSS_PER_RUN = 1

  // ── which gods may reach in at this difficulty ───────────────────────────────
  // ⭐ CUMULATIVE, and that is a choice worth naming. At Damnation all three are
  // possible rather than only Art, because the alternative is that climbing the ladder
  // REMOVES variety — you would lose Blade's waves by getting better, which reads as a
  // bug however it is explained.
  function godsAt(diffIndex) {
    var out = [], k
    for (k in GODS) {
      if (GODS.hasOwnProperty(k) && GODS[k].at <= diffIndex) out.push(k)
    }
    return out
  }

  // Pick a variant. `god` is only ever offered when the difficulty allows one.
  //
  // ⭐ RETURNS A ROLE SPLIT, NOT A FLAT POOL: { fodder, spec, specFrac, bow, boss }.
  // tide.js turns specFrac into exact counts. Keeping the split intact all the way to
  // placement is what lets a ranged wave arm ONLY its archers — the old flat list
  // forced one NBT onto the whole wave, which would now put a bow in the fodder.
  function pick(type, diffIndex, godChance) {
    var slot = WAVES[type]
    if (!slot) return null
    var frac = SPEC_FRAC[type]
    if (typeof frac !== 'number') frac = 0

    var available = godsAt(diffIndex)
    if (available.length && Math.random() < godChance) {
      var g = available[Math.floor(Math.random() * available.length)]
      var gs = GODS[g]
      // ⚠️ A god roster with no specialists must not silently borrow hers - it draws
      // its whole wave from its own fodder instead. Art is in exactly that state.
      var gspec = (gs.spec && gs.spec.length) ? gs.spec : []
      return {
        type: type, variant: 'god', god: g,
        theme: 'A ' + gs.tier + ' wave — ' + g + ' reached into her water.',
        fodder: gs.fodder, spec: gspec, specFrac: gspec.length ? frac : 0,
        bow: false,
        // 🔴 A GOD WITH NO WORKING BOSS FALLS BACK TO HERS (null here; tide.js
        // substitutes). Art's boss does not spawn - D-112 - and a miniboss wave with
        // no miniboss is worse than one led by the goddess whose tide it is.
        boss: (type === 'miniboss') ? (gs.boss || null) : null,
      }
    }

    var which = (Math.random() < 0.5) ? 'normal' : 'alternate'
    var v = slot[which]

    // ⭐ A miniboss wave's specialists are a function of DIFFICULTY, not of the variant.
    // At Uprising and Malice there are NONE - measured in play. This gate and his 5%
    // both apply: an empty pool is zero specialists whatever the fraction rounds to.
    var spec = v.spec
    if (type === 'miniboss') {
      var allowed = MINIBOSS_LIGHT[diffIndex]
      if (typeof allowed !== 'number') allowed = 0
      spec = (allowed <= 0) ? [] : spec.slice(0, allowed)
    }

    return {
      type: type, variant: which, god: null, theme: v.theme,
      fodder: v.fodder, spec: spec,
      specFrac: spec.length ? frac : 0,
      bow: v.bow === true,
      boss: v.boss,
    }
  }

  VELDORA.waves = {
    types: TYPES,
    table: WAVES,
    gods: GODS,
    specFrac: SPEC_FRAC,
    rangedNbt: RANGED_NBT,
    minibossLight: MINIBOSS_LIGHT,
    bossPerRun: BOSS_PER_RUN,
    rangedPool: RANGED,
    fodderPools: { bone: BONE_FODDER, ghost: GHOST_FODDER },
    specPools: { boneLight: BONE_LIGHT, ghostLight: GHOST_LIGHT,
      boneTank: BONE_TANK, ghostTank: GHOST_TANK, ranged: RANGED },
    pick: pick,
    godsAt: godsAt,
    enabled: function () { return GATE },
  }

  ServerEvents.loaded(function () {
    var n = 0, t
    for (t in WAVES) if (WAVES.hasOwnProperty(t)) n += 2
    console.info(TAG + TYPES.length + ' wave types x ' + (n / TYPES.length) +
      ' variants + a god variant = ' + (n + TYPES.length) + ' compositions. ' +
      'NORMAL is the skeleton faction, ALTERNATE is the ghosts, GOD is theirs.')
    // ⭐ HIS RATIOS, SAID OUT LOUD AT BOOT. These are the numbers he tuned by playing,
    // so a silent drift in them is the thing most worth catching from a log line.
    var parts = []
    for (t in SPEC_FRAC) {
      if (SPEC_FRAC.hasOwnProperty(t)) {
        parts.push(t + ' ' + Math.round((1 - SPEC_FRAC[t]) * 100) + '/' +
          Math.round(SPEC_FRAC[t] * 100))
      }
    }
    console.info(TAG + 'fodder/specialist per wave: ' + parts.join(' · ') +
      '  (his numbers, measured in play 2026-08-30)')
    console.info(TAG + 'god waves unlock BY DIFFICULTY and are cumulative: ' +
      'Malice->blade, Heresy->wall, Damnation->art. Forge and Salvage have none, ruled.')
    console.info(TAG + '!! ranged waves FORCE a bow via NBT on the ARCHERS ONLY - ' +
      'measured, minecraft:skeleton arrives armed ~30% of the time (docs/73).')
    if (!GODS.art.boss) {
      console.warn(TAG + '!! ART HAS NO BOSS - his dark_vortex does not survive being ' +
        'summoned (0/3, D-112). His miniboss wave falls back to HERS until ruled.')
    }
  })
})();
