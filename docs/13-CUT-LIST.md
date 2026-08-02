# Cut List — everything that CAN go

Built from the 2026-08-01 triage of all 398 mods. Ordered so you can scan
top-down and stop when you hit the number you want.

**Tiers 1–3 total ~120 mods and cost you almost nothing.** Tier 4 is where real
choices start. Tier 5 is only if you want to go below ~200.

Libraries are deliberately NOT listed — cut the content and the libraries fall
out automatically. 81 of the pack's 115 "mandatory" mods are libraries.

---

## TIER 1 — Contributes literally nothing (27)

No judgment required. These load and give you nothing.

### Orphaned libraries — 0 dependents, their dependents already cut
| mod | was for |
|---|---|
| `aces-spell-utils` | cataclysm-spellbooks + ars-elemancy (both cut) |
| `elysium-api` | jadens-nether-expansion (cut) |
| `azurelib` | nothing installed uses it |
| `collective` | no Natamus mod remains |
| `konkrete` | FancyMenu/Drippy, neither installed |
| `jamlib` | nothing |
| `library-ferret` | registers coins nothing consumes |
| `runiclib` | one damage tag |

### Loads, does nothing
| mod | evidence |
|---|---|
| `skills` (Puffish) | **no skill tree exists** — the screen is blank |
| `summoningrituals` | **zero recipes** — altar uncraftable AND inert |
| `horror-messages` | lang file has **0 keys** |
| `shadow-of-the-soul` | **2 lang keys**; no Fear Level system in the jar |
| `esf` (Entity Sound Features) | needs ESF resource packs; folder is empty |
| `chunks-fade-in` | `mod-enabled = false` in its own config |
| `diligentstalker` | all 5 recipes disabled by our datapack, no loot path built |

### Loses a duplicated verb outright
| mod | loses to |
|---|---|
| `craftable-gunpowder-balanced` | makes the wired gunpowder-ore economy pointless |
| `abandoned-watchtowers` | Explorify, **identical 48/24 spacing, same biomes** |
| `crimson_curse` | Spore (96 entities vs its 0 registered objects) |
| `fancy-toasts` | Advancement Plaques |
| `whispering-spirits` | Server-Side Horror |
| `another-furniture` | modern styling vs preindustrial ruling; 3rd furniture mod |
| `immersive-furniture` | **1 block** in the most over-served verb in the pack |
| `thaumon` | themed after a mod that isn't installed |
| `ars-technic` | 3 objects; also bought by mistake (`arstechnic` ≠ `ars_technica`) |
| `ars-polymorphia` | zero content, one UI hook |
| `critters-and-companions` | 4th small-animal mod, direct name duplicates |
| `lets-do-wildernature` | duplicates hunting fauna AND strips livestock from 5 biomes |

---

## TIER 2 — A whole jar for almost nothing (~30)

Each is a full mod load, a full set of interactions, for the content listed.

| mod | contributes |
|---|---|
| `bartering-station` | **1 block, 1 recipe** |
| `create-trading-floor` | 2 blocks, 1 recipe |
| `create-tweaked-controllers` | 11 items, **1 recipe** |
| `moving-elevators` | 3 blocks, 3 recipes |
| `slice-and-dice` | 3 blocks, 10 recipes |
| `trash-cans` | 4 blocks, 4 recipes |
| `create-copper-zinc` | **6 recipes** |
| `extended-wrenches` | 6 cosmetic wrenches (+1 broken recipe/boot) |
| `create-power-loader` | 4 blocks, 2 recipes |
| `create-pattern-schematics` | 10 items, 4 recipes |
| `ars-ocultas` | 1 block, 5 recipes |
| `xp-tome` | 2 items, 1 recipe |
| `charm-of-undying` | **0 items** — puts the vanilla totem in a curio slot |
| `soul-fire-d` | 4 enchantments, 1 recipe |
| `dis-enchanting-table` | 1 block, 1 recipe |
| `enchanting-infuser` | 5 blocks, 2 recipes |
| `more-totems-of-undying` | 7 items, 7 recipes |
| `sooty-chimneys` | 14 blocks, 14 recipes |
| `animal_feeding_trough` | 1 block, 1 item, 2 recipes |
| `chefs-delight` | **0 blocks, 0 items** — 2 villager professions |
| `corn-delight` | 6 blocks, 22 items; not in CTOV's compat list |
| `easy-villagers` | 8 blocks, 7 recipes |
| `camerapture` | 5 items, 4 recipes |
| `create-jetpack` | 24 items, 2 blocks, 4 recipes |
| `create-deep-dark` | 36 items, 2 blocks, 18 recipes |
| `create-ore-excavation` | 6 blocks, 42 recipes |
| `create-meta-logistics` | 19 blocks, 20 recipes |
| `nyfs-spiders` | 0 content; spider movement only |
| `spawn-animations` | 0 content; only visible underground now |
| `create-central-kitchen` | 0 recipes; function is code |
| `make-ars-lectern-great-again` | 0 data; one UI improvement |

---

## TIER 3 — Duplicated verbs, pick one (~60)

### Macaw's — 11 separate mods, 3,033 blocks
Each is its own jar. Keep the two that own a verb with no vanilla equivalent.
| keep | cut |
|---|---|
| `macaws-roofs` (605 blocks — no vanilla equivalent) | `macaws-stairs` (vanilla+Chipped+Framed already cover it) |
| `macaws-furniture` (652 — owns the verb) | `macaws-bridges`, `macaws-doors`, `macaws-windows`, `macaws-fences-and-walls`, `macaws-lights-and-lamps`, `macaws-paths-and-pavings`, `macaws-trapdoors` |

**Cutting 8 of 11 removes ~1,900 blocks and 2,300 recipes.**

### YUNG's — 11 modules
| keep | cut |
|---|---|
| `yungs-better-mineshafts`, `yungs-better-dungeons`, `yungs-better-strongholds` (the depth pillar's set pieces) | `yungs-better-desert-temples`, `yungs-better-jungle-temples`, `yungs-better-witch-huts`, `yungs-better-ocean-monuments`, `yungs-better-nether-fortresses`, `yungs-better-end-island`, `yungs-bridges`, `yungs-extras` |

### Cosmetic block variants
| keep | cut |
|---|---|
| `chipped` (6,967 variants — owns it) | `rechiseled` (2,418, same verb) — but `rechiseledcreate` requires it, so cut both together |

### Armour sets — 763 items across 4 mods
| keep | cut |
|---|---|
| `epic-knights` (only one with an Epic Fight compat module) | `knight-quest` (200 items), `immersive-armors` (41), `armor-of-the-ages` (41) |

### Create structure mods
| keep | cut |
|---|---|
| `create-let-the-adventure-begin` (221 NBTs, 6 chest loot tables) | `create-structures-arise` (45 NBTs, **zero** custom loot) |

### Medieval Buildings — 3 editions
| keep | cut |
|---|---|
| `medieval-buildings` (overworld) | `medieval-buildings-nether-edition`, `medieval-buildings-end-edition` |

### Small-animal mods — 4 overlapping
| keep | cut |
|---|---|
| `naturalist` (50 entities, 243 sounds, real behaviours) | `critters-and-companions` (already Tier 1), `hybrid-aquatic` (136 entities, 413 biome modifiers, 11 name collisions) |

### Enchantment descriptions
| keep | cut |
|---|---|
| `enchantment-descriptions` (`enchdesc`, 182 keys) | `item-descriptions`' enchantment half is already dead — keep the mod for its other 1,500 keys, or cut it too |

---

## TIER 4 — Neutered by your own design (8)

These work, but the peaceful-surface rule already silenced them. You are paying
load cost for content you cannot see.

| mod | what the rule did |
|---|---|
| `creeper-overhaul` | all 16 biome creepers cave-only; **and it removes the vanilla creeper spawn** |
| `enderman-overhaul` | all 18 variants cave-only |
| `zombie-awareness` | its entire stated purpose is *ordinary nights* |
| `enhanced-celestials` | a blood moon's payoff is a surface swarm that cannot happen |
| `the-skinwalker-hunt` | natural spawn, weight 1 — banned above y40 |
| `distant-friends` | natural spawn, weight 20 — its premise is surface watchers |
| `weeping-angels` | MONSTER spawn + a structure at 300/200; both closed |
| `mutant-monsters` | cave-only under the ban |

**Alternative to cutting:** an In Control exemption rule restores the stalkers.
That is a design decision, not a cut — see `12-TRIAGE.md`.

---

## TIER 5 — Large, real, and still optional (~20)

Only if you want to go below ~200. Each is a genuine loss.

| mod | size | what you lose |
|---|---|---|
| `hybrid-aquatic` | 136 entities, 413 biome modifiers, 580 recipes | ocean fauna; biggest population addition in the pack |
| `alexs-mobs` | 140 entities, 334 items | the largest fauna mod; tension with *sparse wildlife* |
| `dungeons-and-taverns` | **34 structure sets, 3,312 NBTs** | largest structure package; also the largest crowding contributor |
| `goety` | 779 blocks, 1,578 recipes | a whole necromancy system (one of your 4 kept magic alternatives) |
| `theurgy` | 1,686 items, 1,777 recipes | the alchemy system |
| `occultism` | 833 items, 931 recipes | summoning/familiars |
| `irons-spells-n-spellbooks` | 312 items, 230 spells | **you said keep this** |
| `quark` | 815 blocks, 2,497 recipes | a hundred small vanilla+ features |
| `supplementaries` | 256 blocks, 643 recipes | decoration/utility |
| `philips-ruins` | **15 sets for 17 structures** | poor packing, real content |
| `bountiful-fares` | 299 blocks, 896 recipes | farming expansion |
| `butchery` | 456 blocks, 977 loot tables | the hunting economy |
| `lets-do-bloomingnature` | 431 blocks, **8 sets, 20 remove_features** | biggest biome-stacking offender |
| `lets-do-meadow` / `lets-do-vinery` | ~300 blocks each | |
| `the-undergarden` | full dimension | |
| `cataclysm-dimension` | full dimension | |
| `grim-and-bleak` | 15 sets, own dimension | |
| `deeperdarker` | own dimension, 642 recipes | fits the depth thesis well |
| `spore` | 96 entities, 253 items, 13 sets | the infection horror |
| `dynamictrees` | 15 blocks | **26 warnings + 6 tag failures**; already flagged risky |

---

## Running totals

| through | mods cut | remaining |
|---|---|---|
| Tier 1 | 27 | 371 |
| + Tier 2 | ~58 | 340 |
| + Tier 3 | ~118 | 280 |
| + Tier 4 | ~126 | 272 |
| + Tier 5 (all) | ~146 | 252 |

**Tiers 1–5 do not reach 200 on their own.** Getting to ~200 means also dropping
whole *categories* you have decided you want less of — most realistically the
remaining Create addons (42 optional), the remaining horror mods, or the
building-decoration layer entirely.

Which is the argument for naming the pillars and building up, rather than
choosing 200 times what to remove.
