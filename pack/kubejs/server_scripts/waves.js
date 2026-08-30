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
// ── 🔴🔴 AUGMENTED MEANS ADDED TO, NOT SWAPPED FOR ────────────────────────────
// Ethan, 2026-08-30, correcting a misreading that had been built and shipped:
//
//     "All tides have the general mobs in them, god augmented tides are Augmented!
//      with that gods' mobs, They do not overwrite the existing tide cast at all."
//
// 🔑 THE FIRST BUILD REPLACED HER ROSTER WITH THE GOD'S, and that is a different
// mechanic wearing the same name. A "Blade wave" was a wave of zombies INSTEAD of her
// dead — so the tide stopped being hers exactly when another god touched it, which
// inverts the whole thesis. It is now HER wave with his mobs mixed through it.
//
// ⚠️ ONE THING STILL OVERRIDES RATHER THAN ADDS: the miniboss. D-108, ruled — a god
// miniboss wave is led by that god's boss. A wave cannot have two, since the cap is one
// per tide.
//
// ⭐ AND IT MAKES A THIN GOD ROSTER FINE. Wall is four spiders. Under replacement that
// was a thin wave; under augmentation it is her full tide with spiders in it, which is
// what "Wall reached into her water" should feel like.
//
// ── ⭐ THE VARIANT AXIS IS THE SUBFACTION AXIS ─────────────────────────────────
// "Normal / Alternate" is her own split, and a god is a THIRD axis on top of it rather
// than a third value of the same one:
//
//     NORMAL     the SKELETON faction   — the thesis. She is the goddess of death.
//     ALTERNATE  the GHOST faction      — still hers. The dead who did not stay in a
//                                         body, which is a different dread entirely
//     + a god    that god's mobs ADDED  — somebody else reached into her water
//
// 🔑 AND IT EXPLAINS THE MISSING FAMILY. Zombies are almost absent from her tides, and
// that is not an oversight: *"She has a focus on skeletons, not zombies."* The zombies
// are BLADE'S — barrel zombie, zombie bruiser — so a wave full of them reads as him,
// which is exactly what a god-augmented wave is supposed to feel like.
//
// ── ⚠️ WHAT IS DELIBERATELY NOT IN HERE ────────────────────────────────────────
// ⛔ THE NO-SUMMONER RULE IS RETIRED — Ethan, 2026-08-30: *"No summoner rule no longer
// applies that is redundant, cut it from everywhere it is mentioned."*
//
// It said nothing that summons may be in any roster, on the reasoning that a summoner
// inside a 24-mob wave is a multiplier on top of a multiplier. ⭐ It was never measured
// and it was blocking things that are simply GOOD — a dire wolf pack led by something
// that calls the pack is what a pack is, and the tide already has a hard ceiling
// (MAX_ALIVE_NEAR) that bounds the real risk far better than a blanket ban did.
//
// ⚠️ The headstone is kept because the rule shaped several rosters. Anything excluded
// SOLELY for summoning is eligible again and simply has not been re-evaluated:
// goety `wight` / `grave_golem` / `skull_lord` / `wither_necromancer`, the goety
// `bound_*` casters, and `irons_spellbooks:necromancer`.
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
  ]
  // 🔴 `goety:skeleton_wolf` WENT WITH IT, caught by the screen written for the
  // dread mobs on its very first run. It is a goety SERVANT - its texture lives under
  // `entity/servants/` and its class carries `Summoned$NaturalAttackGoal`, a goal for
  // attacking non-summoned mobs. Placed by /summon it has no owner to defer to, so
  // every other mob in the wave is a target. Added today, same as the dread pair.
  // 🔴 `iceandfire:dread_thrall` WAS REMOVED FROM HERE, 2026-08-30. Ethan, from play:
  // *"there were skeletons with glowing blue eyes that immediately started attacking
  // and killing all the other enemies in the tide."* Glowing blue eyes are the Ice and
  // Fire DREAD army's signature, and `DreadThrallEntity` carries
  // `DreadAITargetNonDreadGoal` — an AI goal that exists to attack everything that is
  // not dread. Her own skeletons are not dread.
  //
  // ⚠️ A MOB THAT FIGHTS THE WAVE IT ARRIVES IN IS WORSE THAN A MISSING MOB: the tide
  // thins itself, and from the player's side it reads as the tide being broken.
  // I added it today; it was never in a wave he had fought before. D-124.
  // ⚠️ `stray` AND `bogged` ARE HERE AS MELEE, ON PURPOSE. Both measured 0 bows in 12
  // summons — they are not in epicknights' equipment config and /summon does not run
  // the vanilla equip step. As archers they were a fiction; as skeleton fodder they are
  // honest. ⭐ `bone_lord` and `rattled` were checked in the jar before being trusted:
  // both extend AbstractSkeleton and neither spawns anything. The names suggested
  // otherwise and the class files settled it - a method worth keeping now that the
  // no-summoner rule is gone, because it answers "what IS this" rather than "is it
  // allowed".

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
  // every ghost wave was spawning nothing at all. See D-116 and spawn_persist_check.py.

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
    'born_in_chaos_v1:skeleton_thrasher',   // 50 hp / 10 arm / 8 dmg — Ethan's tank
    'cataclysm:royal_draugr',               // 30 hp /  5 arm / 5 dmg — a draugr, skeletal
  ]
  // 🔴 `iceandfire:dread_knight` WAS THE PICK HERE AND IT IS OUT FOR THE SAME REASON AS
  // dread_thrall: it carries `DreadAITargetNonDreadGoal` and would fight her own wave.
  // ⚠️ It was the better tank on paper — 20 armour against royal_draugr's 5 — and that
  // is the point: the stat line was never the problem.
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
      // 🔴 CUT TO SPIDERS ONLY, 2026-08-30. Ethan, from play: *"wall's tide has flies
      // and a crab... it should only be spiders."* — then the rule, verbatim:
      // *"only take things with the naming of spider."*
      //
      // ⛔ REMOVED: corpse_fly (a fly), diamond_termite (a termite), thornshell_crab
      // (a crab), silverfish, wither_scuttler, dread_scuttler. I had selected them off
      // `#minecraft:arthropod` and their stat lines, which is how a spider faction ends
      // up containing a crab: the TAG is arthropods, and he asked for spiders.
      //
      // ⚠️ AND THE RULE IS HIS NAME RULE, NOT MY LEG COUNT. I had started measuring
      // model bones to settle the two "scuttlers" — 8 legs on one, 6 on the other — and
      // he cut that short with a simpler rule that is his to make. A faction is
      // authorship. It is defined by what he calls a spider, not by anatomy.
      fodder: [
        'minecraft:spider',                 // 16 hp / 0 arm / 2 dmg — the archetype
        'minecraft:cave_spider',            // 12 hp / 0 arm / 2 dmg
      ],
      spec: [
        'born_in_chaos_v1:baby_spider',     // 10 hp / 0 arm — BABY rule, was "fodder"
      ],
      boss: 'born_in_chaos_v1:mother_spider',   // 90 hp / 6 dmg / kb-res 1
      // ⭐ FOUR MOBS IS ENOUGH NOW, AND IT WOULD NOT HAVE BEEN AN HOUR AGO. A god
      // roster used to REPLACE her cast, so a thin one made a thin wave. It AUGMENTS
      // it now — his correction below — so Wall's four spiders arrive inside her full
      // tide rather than instead of it.
      // ⛔ occultism's `wild_spider`/`wild_cave_spider` are spider-named and stay out:
      // all twelve occultism `wild_*` are Wild Hunt event mobs, ruled out earlier.
      // ⛔ `crittersandcompanions:jumping_spider` is a passive pet.
    },
    art: {
      at: 3, tier: 'Damnation',
      // 🔴 TWO OF HIS THREE MOBS AND HIS BOSS DID NOT SPAWN. Measured 0/3 each against
      // a control that passed 3/3: `restless_spirit` and `dark_vortex` answer `summon`
      // and are gone before the next command. `dark_vortex` was his BOSS, so Art's
      // miniboss wave arrived with no miniboss at all. D-117.
      //
      // ✅ RULED 2026-08-30: *"it should always just be born in chaos' lifestealer."*
      //
      // ⭐⭐ AND THAT IS THE SAME MOB AS THE TAKER, which is not a coincidence worth
      // losing. `tide.js` already sends the Lifestealer into HER waves 6% of the time
      // as a TELL — on the note *"Art is just kayer and she is already secretly aligned
      // with the goddess of death"*. So the rare thing marching in her army and the
      // thing leading HIS wave are one creature. The alliance is stated twice, in two
      // mechanics, and nowhere in words.
      //
      // ⚠️ Consequence worth knowing: the Taker substitution in composeFor is a no-op
      // on an Art miniboss wave, because it would replace the Lifestealer with itself.
      //
      // ⭐⭐ ONE MOB, AND IT IS THE LORE RATHER THAN A GAP. Ethan, 2026-08-30, asked
      // whether Art should be thickened and answered his own question:
      //
      //     "Good, its thematic. The Matriarch is aligned to the goddess of death
      //      secretly, why would she spend time building up an army of her own?"
      //
      // 🔑 The Matriarch LEADS the pantheon (docs/15) and is secretly the goddess of
      // death's. She does not need an army because she is already standing next to one.
      // ⛔ So DO NOT "fix" this by adding mobs. A thin Art roster is the most-told part
      // of the whole system: her wave is almost entirely the goddess's own dead, led by
      // the Lifestealer, and nothing in the game says why.
      fodder: ['born_in_chaos_v1:scarlet_persecutor'],  // 35 hp / 0 arm / 5 dmg
      spec: [],
      boss: 'born_in_chaos_v1:lifestealer',
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
  // ⭐ `forceGod` IS FOR THE BENCH ONLY. A god wave is 8-25% of waves and gated by
  // difficulty on top of that, which makes Wall's spiders and Art's Lifestealer very
  // nearly untestable in play - you would grind tides waiting for one. /tide_god names
  // the god directly. ⚠️ It BYPASSES the difficulty gate on purpose, and says so in the
  // returned theme, so a bench result is never mistaken for a live one.
  function pick(type, diffIndex, godChance, forceGod) {
    var slot = WAVES[type]
    if (!slot) return null
    var frac = SPEC_FRAC[type]
    if (typeof frac !== 'number') frac = 0

    // ⭐⭐ HER WAVE IS BUILT FIRST, ALWAYS. See the AUGMENT note above: a god never
    // replaces this, only adds to it.
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

    var fodder = v.fodder
    var boss = v.boss
    var god = null
    var theme = v.theme

    // ── the augmentation ───────────────────────────────────────────────────────
    var available = godsAt(diffIndex)
    if (forceGod && GODS[forceGod]) available = [forceGod]
    if (available.length && (forceGod ? true : Math.random() < godChance)) {
      god = available[Math.floor(Math.random() * available.length)]
      var gs = GODS[god]
      // 🔑 CONCAT, NOT REPLACE. Her cast stays and his is added on top, so the god's
      // mobs arrive INSIDE her tide. His fodder joins her fodder and his specialists
      // join hers, which keeps the role split - and therefore his 90/10, 95/5, 80/20,
      // 95/5 - exactly as it was.
      fodder = fodder.concat(gs.fodder || [])
      spec = spec.concat(gs.spec || [])
      // ⚠️ THE BOSS IS THE ONE THING THAT DOES OVERRIDE. D-108, ruled: a god miniboss
      // wave is led by THAT god's boss. That is a substitution rather than an addition
      // because a wave cannot have two minibosses - the per-tide cap is one.
      if (type === 'miniboss' && gs.boss) boss = gs.boss
      theme = (forceGod ? '[BENCH] ' : '') + v.theme +
        '  ⚡ ' + gs.tier + ' — ' + god + ' reached into her water.'
    }

    return {
      type: type, variant: which, god: god, theme: theme,
      fodder: fodder, spec: spec,
      specFrac: spec.length ? frac : 0,
      bow: v.bow === true,
      boss: boss,
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
      console.warn(TAG + '!! ART HAS NO BOSS - regressed. He was RULED the Lifestealer ' +
        'on 2026-08-30 (D-117); a null here means somebody removed it.')
    }
    console.info(TAG + 'art is led by the Lifestealer - the SAME mob the tide sends ' +
      'into HER waves as the Taker. The alliance is stated by mechanics, never in words.')
  })
})();
