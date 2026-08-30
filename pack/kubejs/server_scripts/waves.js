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
  // THE POOLS. Every id measured live (docs/73) and verified in the registry.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 SKELETON FODDER — the bulk of every Normal wave. Ethan's Decrepit Skeleton
  // leads it; the rest widen it so a horde stops reading as one repeated mob.
  var BONE_FODDER = [
    'born_in_chaos_v1:decrepit_skeleton',   // 15 hp — his bulk
    'born_in_chaos_v1:baby_skeleton',       // 10 hp — small and fast, moves differently
    'cataclysm:koboleton',                  // 25 hp — rank and file
    'born_in_chaos_v1:bone_imp',            // 20 hp
    'minecraft:wither_skeleton',            // 20 hp
  ]

  // ⭐ GHOST FODDER — the Alternate. Lower armour, stranger silhouettes.
  var GHOST_FODDER = [
    'goety:wraith',                         // 25 hp
    'goety:border_wraith',                  // 25 hp
    'goety:muck_wraith',                    // 25 hp
    'goety:haunted_armor',                  // 25 hp
    'iceandfire:ghost',                     // 30 hp
    'minecraft:phantom',                    // 20 hp
  ]

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

  var BONE_TANK = [
    'born_in_chaos_v1:skeleton_thrasher',   // 50 hp / 10 arm — Ethan's tank
    'born_in_chaos_v1:supreme_bonescaller', // 65 hp
    'grim_and_bleak:damned_templar',        // 40 hp / 10 arm
  ]
  var GHOST_TANK = [
    'grim_and_bleak:banshee',               // 40 hp / 13 arm — he ruled it MELEE
    'cataclysm:ignited_revenant',           // 80 hp / 12 arm
  ]

  // "light specialists" — present but not punishing.
  var BONE_LIGHT = ['born_in_chaos_v1:siamese_skeletons', 'goety:bone_lord']
  var GHOST_LIGHT = ['goety:reaper', 'goety:haunt']

  // Ethan's two, unchanged.
  var BOSS_NORMAL = 'born_in_chaos_v1:supreme_bonescaller'
  var BOSS_ALT = 'born_in_chaos_v1:fallen_chaos_knight'

  // ═══════════════════════════════════════════════════════════════════════════
  // THE GODS. His rosters, verbatim, all probed.
  // ⚠️ FORGE AND SALVAGE HAVE NONE. *"No special god waves for forge or salvage."*
  // That is a ruling, not a gap — she sends nothing at anyone, and Salvage deals rather
  // than attacks. Their rosters still exist in spawn_pressure.js for their OWN events.
  // ═══════════════════════════════════════════════════════════════════════════
  var GODS = {
    blade: {
      at: 1, tier: 'Malice',
      ids: ['born_in_chaos_v1:barrel_zombie', 'born_in_chaos_v1:door_knight',
        'born_in_chaos_v1:zombie_bruiser', 'born_in_chaos_v1:skeleton_thrasher'],
      boss: 'born_in_chaos_v1:fallen_chaos_knight',
    },
    wall: {
      at: 2, tier: 'Heresy',
      ids: ['born_in_chaos_v1:baby_spider', 'born_in_chaos_v1:mother_spider'],
      boss: 'born_in_chaos_v1:mother_spider',
    },
    art: {
      at: 3, tier: 'Damnation',
      ids: ['born_in_chaos_v1:restless_spirit', 'born_in_chaos_v1:scarlet_persecutor',
        'born_in_chaos_v1:dark_vortex'],
      boss: 'born_in_chaos_v1:dark_vortex',
    },
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE TWELVE. ⭐ `theme` is what the wave IS, in one line, and it is the thing to
  // argue with — the ids are just how it is spelled.
  // ═══════════════════════════════════════════════════════════════════════════
  var WAVES = {
    general: {
      normal: {
        theme: 'The Rank and File — her ordinary dead, in numbers, with a few that ' +
          'have been down there long enough to be worth noticing.',
        fodder: BONE_FODDER, light: BONE_LIGHT, tank: [], ranged: 0.10, boss: null,
      },
      alternate: {
        theme: 'The Draught — the same crowd with nothing solid in it. Wraiths and ' +
          'haunted armour, which hit no harder and are far worse to be surrounded by.',
        fodder: GHOST_FODDER, light: GHOST_LIGHT, tank: [], ranged: 0.10, boss: null,
      },
    },
    horde: {
      normal: {
        theme: 'The Press — bodies and bone-armour, shoulder to shoulder. ' +
          '⛔ Nothing shoots. The threat is that it does not stop coming.',
        fodder: BONE_FODDER, light: [], tank: BONE_TANK, ranged: 0.0, boss: null,
      },
      alternate: {
        theme: 'The Wailing — the same weight of dead arriving as a sound before ' +
          'anything is visible. ⛔ Still nothing shoots.',
        fodder: GHOST_FODDER, light: [], tank: GHOST_TANK, ranged: 0.0, boss: null,
      },
    },
    ranged: {
      normal: {
        theme: 'The Volley — thin on the ground and murderous at distance. ' +
          'Fewer bodies than any other wave and the only one that punishes standing still.',
        fodder: BONE_FODDER, light: [], tank: [], ranged: 0.65, boss: null,
      },
      alternate: {
        theme: 'The Bonecallers — the archers stay, the crowd in front of them does ' +
          'not. Almost nothing to hide behind, in either direction.',
        fodder: GHOST_FODDER, light: [], tank: [], ranged: 0.75, boss: null,
      },
    },
    miniboss: {
      normal: {
        theme: 'The Supreme — a crowd thick enough that you cannot reach the thing ' +
          'that matters, and the thing that matters knows it.',
        fodder: BONE_FODDER, light: BONE_LIGHT, tank: [], ranged: 0.10,
        boss: BOSS_NORMAL,
      },
      alternate: {
        theme: 'The Fallen — a fallen version of the Warrior at the head of her dead. ' +
          'Nothing in the game explains why, and nothing should.',
        fodder: BONE_FODDER, light: GHOST_LIGHT, tank: [], ranged: 0.10,
        boss: BOSS_ALT,
      },
    },
  }

  var TYPES = ['general', 'horde', 'ranged', 'miniboss']

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
  function pick(type, diffIndex, godChance) {
    var slot = WAVES[type]
    if (!slot) return null
    var available = godsAt(diffIndex)
    if (available.length && Math.random() < godChance) {
      var g = available[Math.floor(Math.random() * available.length)]
      var spec = GODS[g]
      return {
        type: type, variant: 'god', god: g,
        theme: 'A ' + spec.tier + ' wave — ' + g + ' reached into her water.',
        fodder: spec.ids, light: [], tank: [], ranged: 0.0,
        boss: (type === 'miniboss') ? spec.boss : null,
      }
    }
    var which = (Math.random() < 0.5) ? 'normal' : 'alternate'
    var v = slot[which]
    return {
      type: type, variant: which, god: null, theme: v.theme,
      fodder: v.fodder, light: v.light, tank: v.tank,
      ranged: v.ranged, boss: v.boss,
    }
  }

  VELDORA.waves = {
    types: TYPES,
    table: WAVES,
    gods: GODS,
    rangedNbt: RANGED_NBT,
    rangedPool: RANGED,
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
    console.info(TAG + 'god waves unlock BY DIFFICULTY and are cumulative: ' +
      'Malice->blade, Heresy->wall, Damnation->art. Forge and Salvage have none, ruled.')
    console.info(TAG + '!! ranged waves FORCE a bow via NBT - measured, minecraft:' +
      'skeleton arrives armed only ~30% of the time on its own (docs/73).')
  })
})();
