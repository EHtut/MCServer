# Mod list

> **Generated file.** Produced by `tools/gen_docs.py` from
> `tools/modlist.json` + the resolution cache. Do not hand-edit -
> change `tools/modlist.json` and regenerate.

**325 mods** for Minecraft 1.21.1 / neoforge, 1,191 MB total.

| side | count | meaning |
|---|---:|---|
| both | 235 | installed on the server *and* every client |
| client | 65 | client-only; the server never loads them |
| server | 25 | server-only; players do not need them |

Every entry is pinned to an exact file and sha512 in `pack/mods/*.pw.toml`.
The **Why** column is the reason that mod is in the pack, not a description
of what it does - if a mod cannot justify a slot, it should not have one.

## create (26)

Pillar 1: Create and its addon family - the industrial spine. Addons WIDEN Create rather than bolting a competing tech mod alongside it. TECH CEILING (Ethan, 2026-07-31): steam and early electricity. Oil, diesel, concrete and sci-fi digital storage are out of period; electricity survives as a late-game marvel rather than a baseline.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Create](https://modrinth.com/mod/create) | `6.0.10+mc1.21.1` | both | core | The pillar itself |
| [Create: Copycats+](https://modrinth.com/mod/copycats) | `3.0.4+mc.1.21.1-neoforge` | both | major | Create: Copycats+ - the building addon Create players treat as mandatory |
| [Create Big Cannons](https://modrinth.com/mod/create-big-cannons) | `5.11.7` | both | major | Buildable artillery. Black powder is period-correct - this is the in-band answer to modern weapons |
| [Create: Compatible Storage](https://modrinth.com/mod/create-compatible-storage) | `2.11.0-neoforge` | both | major | Fixes Quark chests on contraptions - and Quark is in the pack |
| [Create: Connected](https://modrinth.com/mod/create-connected) | `1.3.2-mc1.21.1` | both | major | The QoL blocks Create itself lacks; highly configurable |
| [Create Deco](https://modrinth.com/mod/create-deco) | `2.1.3` | both | major | Industrial decoration; makes Create bases look intentional |
| [Create: Enchantment Industry](https://modrinth.com/mod/create-enchantment-industry) | `2.4.2` | both | major | Automatable enchanting - the bridge from industry into magic |
| [Create: Storage [Neo/Forge]](https://modrinth.com/mod/create-storage-neo-forge) | `1.3.2` | both | major | Create: Storage - storage boxes and backpacks built as a Create addon, so portable storage progresses INSIDE the industry pillar rather than beside it. Chosen over Traveler's and Sophisticated on the kinetic ruling |
| [Create Stuff 'N Additions](https://modrinth.com/mod/create-stuff-additions) | `2.1.4.a` | both | major | Tools, armour and gadgets in Create's style |
| [Create Crafts & Additions](https://modrinth.com/mod/createaddition) | `neoforge-1.21.1-1.6.0` | both | major | Create Crafts & Additions - kinetics to electricity. The top of the tech ceiling |
| [Create: Numismatics](https://modrinth.com/mod/numismatics) | `1.0.20+neoforge-mc1.21.1` | both | major | Create-styled currency; groundwork for a server economy |
| [Create: Bells & Whistles](https://modrinth.com/mod/bellsandwhistles) | `v0.4.7-1.21.1` | both | minor | Create: Bells & Whistles - adornments |
| [Create Aeronautics](https://modrinth.com/mod/create-aeronautics) | `1.3.0+mc1.21.1` | both | risky | Buildable airships and planes - spectacular, still alpha |
| [Create: Bionics](https://modrinth.com/mod/create-bionics) | `2.1.1` | both | minor | Three fuelled robot animals. The Anole repels spiders and insects; the Oxhauler is a rideable pack mule. Added 2026-08-12 as a Forge-path boon - power the builder MANUFACTURES rather than is given |
| [Create: Bits 'n' Bobs](https://modrinth.com/mod/create-bits-n-bobs) | `0.0.44` | both | minor | Decorative and mechanical Create additions |
| [Create: Design n' Decor](https://modrinth.com/mod/create-design-n-decor) | `2.2b` | both | minor | Factory decor blocks |
| [Create: Dreams & Desires](https://modrinth.com/mod/create-dreams-and-desires) | `2.3a-BETA` | both | minor | Broad Create content expansion |
| [Create Encased](https://modrinth.com/mod/create-encased) | `1.21.1-1.9.0-ht3` | both | minor | Encased shafts and pipes |
| [Create: Framed](https://modrinth.com/mod/create-framed) | `1.8.2+1.21.1` | both | minor | More framed glass variants |
| [Create: Let The Adventure Begin](https://modrinth.com/mod/create-let-the-adventure-begin) | `4.0.3` | both | minor | Create-themed structures, balanced for progression |
| [Create: Misc and Things](https://modrinth.com/mod/create-misc-and-things) | `4.1.1` | both | minor | More Create odds and ends |
| [Create Railways Navigator](https://modrinth.com/mod/create-railways-navigator) | `1.21.1-beta-0.9.1-C6` *beta* | both | minor | Train routing and navigation UI |
| [Create: Sound of Steam](https://modrinth.com/mod/create-sound-of-steam) | `0.8.2-1.21.1` *beta* | both | minor | Pipe organs. Audio immersion that is exactly this period |
| [Steam 'n' Rails Neoforge](https://modrinth.com/mod/create-steam-n-rails-1.21.1) | `0.2.1+neoforge-mc1.21.1` | both | risky | Community 1.21.1 port of Steam 'n' Rails - trains, couplers, signals |
| [Create: Oxidized](https://modrinth.com/mod/create_oxidized) | `0.1.3` | server | minor | Oxidation recipes for all copper blocks |
| [Create: Interiors](https://modrinth.com/mod/interiors) | `0.6.1` | both | minor | Create: Interiors - furniture in the Create idiom |

## magic (14)

Pillar 2: Ars Nouveau as the magic spine plus a deliberately chosen set of addons. Ars Creo and Create: Ars Nouveau are the explicit seam between the magic and industry pillars - spells that drive machines, machines that fuel spells. DEPTH RULING (Ethan, 2026-07-31): the Ars spine plus FOUR strong alternatives - Iron's Spells (combat magic), Goety (necromancy, feeds the horror pillar), Occultism (summoning), Theurgy (alchemy). Malum, Forbidden Arcanus and Hexerei were cut as a fifth, sixth and seventh parallel progression that four players would never finish. Ice & Fire, Vampirism and Werewolves stay as world-content rather than competing spell systems.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Ars Nouveau](https://modrinth.com/mod/ars-nouveau) | `5.13.0` | both | core | The magic pillar - spell crafting and magical automation |
| [Enchantment Descriptions](https://modrinth.com/mod/enchantment-descriptions) | `21.1.10` | both | core | Tells you what an enchantment does. Non-negotiable at this mod count |
| [Ars Creo](https://modrinth.com/mod/ars-creo) | `5.4.0` | both | major | The Ars/Create bridge. The single most on-theme mod in the pack |
| [Create Ars Nouveau](https://modrinth.com/mod/create-ars-nouveau) | `1.20.5` | both | major | Second Create/Ars integration - gears meet glyphs |
| [Goety - The Dark Arts](https://modrinth.com/mod/goety) | `3.1.0` | both | major | Necromancy and dark rituals. Sits exactly on the magic/horror seam |
| [IceAndFire Community Edition](https://modrinth.com/mod/iceandfire-ce) | `2.0` | both | major | Dragons as a late-game target |
| [Occultism](https://modrinth.com/mod/occultism) | `1.21.1-neoforge-1.224.2` | both | major | Summoned spirits bound to jobs - mining, crushing, transport. Minion-based automation, and R7's designed fourth alternative. Wall's anchor alongside Goety: one fights for you, one works for you |
| [Regions Unexplored](https://modrinth.com/mod/regions-unexplored) | `0.6.2-neoforge-21.1` | both | major | The biome layer - 198 biomes, 39 wood sets, one dependency. Replaced Oh The Biomes We've Gone 2026-08-14: lighter (6.1 vs 19.5 MB), more biomes, more woods, and retires three dependencies |
| [Ars Lumos](https://modrinth.com/mod/ars-lumos) | `1.3.0` | client | minor | Emissive textures for Ars blocks |
| [Ars Nouveau's Flavors & Delight](https://modrinth.com/mod/arsdelight) | `2.2.2` | both | minor | Ars ingredients in the Farmer's Delight cooking system |
| [Artifacts](https://modrinth.com/mod/artifacts) | `13.2.1` | both | minor | Exploration-reward trinkets |
| [Goety Cataclysm](https://modrinth.com/mod/goety-cataclysm) | `1.21.1-1.8.2` | both | minor | Goety and Cataclysm integration |
| [Magic Vibe Decorations (Crystals, Halloween)](https://modrinth.com/mod/magic-vibe-decorations) | `1.0.7` | both | minor | Crystal and magical decoration |
| [Relics](https://modrinth.com/mod/relics-mod) | `0.10.7.8` | both | minor | Treasure items with unique mechanics |

## combat-guns (15)

Pillar 3a: the brother's track, rebuilt to the period ruling. PERIOD (Ethan, 2026-07-31): preindustrial-to-fantasy, with TaCZ as the ONE sanctioned anachronism - one deliberate exception reads as intentional, four read as an accident. Modern warfare, tactical gear and electronic security are out. PRESENTATION RULING: melee is chosen for MOVESETS AND ANIMATION, not stat lines - a weapon that Epic Fight cannot animate is a differently-coloured sword and does not earn a slot. EASE RULING (delegated to Claude): one system per verb. One dodge, one parry, one camera - nobody should have to bind twelve keys to fight.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Better Combat](https://modrinth.com/mod/better-combat) | `2.4.0+1.21.1-neoforge` | both | major | F45 replacement for Epic Fight. Weapon-specific attack animations and real swing arcs with NO MODE TOGGLE - which was the entire objection. Its own docs: weapons without an attribute file are automatically assigned a matching preset BASED ON ITEM ID, so modded weapons work without the per-weapon capability files Epic Fight demanded. Renders correctly in first person too. |
| [Bosses of Mass Destruction Forge](https://modrinth.com/mod/bosses-of-mass-destruction-forge) | `1.3.3` | both | major | Set-piece boss fights |
| [Combat Roll](https://modrinth.com/mod/combat-roll) | `2.0.6+1.21.1-neoforge` | both | major | Restores the dodge that leaves with Epic Fight. Same author as Better Combat and designed to pair with it. |
| [Epic Knights: Shields Armor and Weapons](https://modrinth.com/mod/epic-knights-shields-armor-and-weapons) | `10.12` | both | major | The definitive medieval arms and armour set, and it carries Epic Fight support |
| [L_Ender's Cataclysm](https://modrinth.com/mod/l_enders-cataclysm) | `3.32` | both | major | Hard dungeons, real bosses, powerful rewards. The combat centrepiece |
| [Medieval Siege Machines](https://modrinth.com/mod/medieval-siege-machines) | `1.33` | both | major | Trebuchet, catapult, ballista, battering ram, mortar. The in-period answer to artillery; pairs with Create: Big Cannons |
| [Not Enough Animations](https://modrinth.com/mod/not-enough-animations) | `1.12.4` | client | major | Ethan asked for general animations: animates eating, drinking, climbing, crawling and item use. Client-side, no combat opinions, conflicts with nothing. 76M downloads. |
| [Better Archeology](https://modrinth.com/mod/better-archeology) | `1.21.1-1.3.7` | both | minor | Archaeology worth doing |
| [Better Third Person](https://modrinth.com/mod/better-third-person) | `1.9.0` | client | minor | Over-the-shoulder camera for exploration. The ONE camera mod - Epic Fight supplies the battle camera itself |
| [Cut Through](https://modrinth.com/mod/cut-through) | `v21.1.0-1.21.1-NeoForge` | client | minor | Swing through grass instead of mowing lawns mid-fight |
| [Ender Dragon Fight Remastered](https://modrinth.com/mod/edf-remastered) | `5.0.2+mod` | both | minor | A dragon fight worth four players |
| [First-person Model](https://modrinth.com/mod/first-person-model) | `2.7.2` | client | minor | See your own body - no keybind, pure presentation |
| [Gunpowder Ore](https://modrinth.com/mod/gunpowder-ore) | `1.0.0` | both | minor | A natural gunpowder source - ammo economy without creeper farming |
| [[UNOFFICIAL] TaCZ 1.21.1 NeoForge Port](https://modrinth.com/mod/tacz-1.21.1) | `1.1.8-hotfix-r6` | both | risky | Community NeoForge port of Timeless and Classics Zero. The single sanctioned anachronism; the official build never left 1.20.1 Forge |
| [Valarian Conquest](https://modrinth.com/mod/valarian-conquest) | `4.2.1.1` | both | minor | Combat and exploration enhancement for the overworld |

## horror (15)

Pillar 3b: horror. Built from stalkers, atmosphere and escalating pressure rather than jump-scares, so it stays frightening over a long server. Several entries are configurable ambient systems rather than mobs - exactly the surface a future dungeon master would drive. STALKER RULING (Ethan, 2026-07-31): all six hunting entities stay, staggered in config so at most one or two can be active at a time - see docs/06-BURIED-TECH.md and pack/config. Six simultaneous stalkers is comedy, not horror; the config IS the feature. THE BROKEN SCRIPT WAS CUT ON SAFETY, NOT PERIOD: the author states the mod WILL grief the world, WILL destroy buildings, can ban you from your own save and writes files to the desktop. Disqualifying for a shared long-running world.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Born In Configuration](https://modrinth.com/mod/born-in-configuration) | `3.2.2` | server | core | Config surface for Born in Chaos - required to tune it down from absurd |
| [In Control!](https://modrinth.com/mod/in-control) | `1.21-10.2.6` *beta* | server | core | Precise control over what spawns, where and when. The tuning knob the whole horror layer depends on |
| [Born in Chaos](https://modrinth.com/mod/borninchaos) | `1.7.6` | both | major | Aggressive nightmare mobs with unusual mechanics |
| [Corpse](https://modrinth.com/mod/corpse) | `neoforge-1.21.1-1.1.13` *beta* | both | major | Your body stays where you died - a walk back into the dark to retrieve it |
| [Dynamic Lights](https://modrinth.com/mod/dynamic-lights) | `1.9.3+mod` | both | major | Held-torch lighting. Darkness only frightens when light is a resource you carry |
| [Rotten Creatures](https://modrinth.com/mod/rottencreatures) | `1.21.1-1.1.2` | both | major | A serious roster of new undead |
| [Server-Side Horror](https://modrinth.com/mod/server-side-horror) | `1.21.1-neoforge-4.2` | server | major | Fully configurable ambient horror, server-side. Pure DM surface: events without client mods |
| [Sound Physics Remastered](https://modrinth.com/mod/sound-physics-remastered) | `neoforge-1.21.1-1.4.10` *beta* | both | major | Real reverb and occlusion. The highest-value horror mod in the pack, and it is a sound mod |
| [The Knocker](https://modrinth.com/mod/the-knocker) | `1.5.2` | both | major | An unpredictable human-like stalker that follows and visits |
| [Born in Chaos: Forgotten Content](https://modrinth.com/mod/born-in-chaos-fc) | `1.2.0` | both | minor | Born in Chaos: Forgotten Content |
| [Fright's Delight](https://modrinth.com/mod/frights-delight) | `neoforge-1.21.1-1.4.8` | both | minor | Farmer's Delight dishes made from hostile mob drops. Grim, and it ties horror to the food economy |
| [Frostiful](https://modrinth.com/mod/frostiful) | `2.3.3+1.21.1-neoforge` *alpha* | both | minor | Cold as survival pressure |
| [Galosphere](https://modrinth.com/mod/galosphere) | `1.21.1-1.5.5` | both | minor | Cave expansion with an eerie register |
| [Grim & Bleak](https://modrinth.com/mod/grim-and-bleak) | `2.5.2` | both | minor | Ambience-led horror with its own dimension |
| [Scorchful](https://modrinth.com/mod/scorchful) | `0.15.2+1.21.1-neoforge` *alpha* | both | minor | Heat as survival pressure |

## world-structures (35)

Worldgen and structures, chosen as ONE coherent set: BWG for biomes, the YUNG suite for vanilla structure overhauls, and a small number of dungeon and settlement mods. Deliberately not stacking competing terrain generators.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Respawning Animals](https://modrinth.com/mod/respawning-animals) | `v21.1.2-1.21.1-NeoForge` | server | core | Animals spawn and despawn like monsters do. Near-mandatory here: with nothing hostile on the surface, hunted animals would never be replaced and the world would slowly empty |
| [Aquaculture 2](https://modrinth.com/mod/aquaculture) | `2.7.21` | both | major | Biome-specific fishing overhaul |
| [Cosy Critters & Creepy Crawlies](https://modrinth.com/mod/cosy-critters) | `v0.3.3+1.21.1-neoforge` | client | major | Birds, bugs and atmospheric small life. Ambient presence on a surface that no longer has monsters to fill the silence |
| [Critters and Companions](https://modrinth.com/mod/critters-and-companions) | `2.7.0` | both | major | Small friendly creatures. Overworld animal life per the two-realm thesis |
| [ChoiceTheorem's Overhauled Village](https://modrinth.com/mod/ct-overhaul-village) | `3.6.3` | server | major | ChoiceTheorem's Overhauled Villages. Replaced Epic Structures: Villages (9.6M downloads vs 194k) - on a surface that is now PEACEFUL and medieval, villages become the centre of play, so this layer had to be the well-trodden one |
| [Fish of Thieves](https://modrinth.com/mod/fish-of-thieves) | `21.1.2.1-neoforge` | both | major | Fish variety and fish feasts |
| [Friends&Foes (Forge/NeoForge)](https://modrinth.com/mod/friends-and-foes-forge) | `neoforge-4.0.26+mc1.21.1` | both | major | The mob-vote losers, well implemented |
| [Infernal Expansion Redux](https://modrinth.com/mod/infernal-expansion-redux) | `0.3.12-1.21.1-neoforge` | both | major | Nether mobs and biomes - makes the wound hostile |
| [Lootr](https://modrinth.com/mod/lootr) | `1.21.1-1.11.37.122` | both | major | Loot chests instanced PER PLAYER. Ends the four-player race to the treasure; everyone rolls the same chest independently |
| [Medieval Buildings](https://modrinth.com/mod/medieval-buildings) | `1.1.1` | both | major | Medieval structures with hidden enemies and treasure. The core of the world-dressing ruling |
| [Mowzie's Mobs](https://modrinth.com/mod/mowzies-mobs) | `1.8.2` | both | major | A handful of exceptional set-piece creatures |
| [Naturalist](https://modrinth.com/mod/naturalist) | `2.0.2+1.21.1-neoforge` | both | major | 47 animals with real behaviours - the world feels inhabited |
| [Serene Seasons](https://modrinth.com/mod/serene-seasons) | `10.1.0.3` *beta* | both | major | Seasons with shifting colour and temperature. NOTE: this makes crops seasonal, so it is a real gameplay change on top of Farmer's Delight, not decoration |
| [ShineaL's Prehistoric Expansion](https://modrinth.com/mod/shineals-prehistoric-expansion) | `1.5.2` | both | major | Mythology and prehistoric creatures reclaiming the overworld. Complements Jurassic Reborn rather than overlapping; no dependencies |
| [Sparse Structures](https://modrinth.com/mod/sparsestructures) | `3.0` | server | major | Structure spacing. WORLDGEN - must land before the reset. |
| [Spawn](https://modrinth.com/mod/spawn-mod) | `4.0.7` | both | major | Overworld wilderness overhaul - many animals, ambience, biome life. A surface with no hostiles needs to be FULL of something, or peaceful just reads as empty |
| [Structory](https://modrinth.com/mod/structory) | `1.3.17` | both | major | Small atmospheric structures, very high quality |
| [Tectonic](https://modrinth.com/mod/tectonic) | `3.0.26-neoforge-21.1` | both | major | Bigger mountains, deeper caves - Ethan's ask. Needs lithostitched, already present. WARNING: overrides minecraft:overworld noise settings, collides with mcserver_depth - see docs/16-THE-REFORGE.md D1 |
| [Untitled Duck Mod](https://modrinth.com/mod/untitled-duck-mod) | `1.6.0+neoforge` | both | major | Ducks and geese - ambient overworld life |
| [Village Spawn Point](https://modrinth.com/mod/village-spawn-point) | `1.21.1-4.6-fabric+forge+neo` | server | major | Spawn in a village. WORLDGEN - must land before the reset. |
| [Weather Storms & Tornadoes](https://modrinth.com/mod/weather-storms-tornadoes) | `1.21.0-2.8.7` | both | major | Ethan's ruling 2026-08-02: the surface should be survived, not fought - 'deeper is fight. upper is survive against weather events'. Scorchful already covers deserts (sandstorms) and Frostiful the cold (freezing wind); nothing covered the temperate plains where people actually build. Adds tornadoes, severe storms and wind there. |
| [When Dungeons Arise](https://modrinth.com/mod/when-dungeons-arise) | `2.1.68` | server | major | Large hand-built dungeons |
| [YUNG's Better Dungeons](https://modrinth.com/mod/yungs-better-dungeons) | `1.21.1-NeoForge-5.1.4` | server | major | Vanilla dungeons made worth entering |
| [YUNG's Better Mineshafts](https://modrinth.com/mod/yungs-better-mineshafts) | `1.21.1-NeoForge-5.1.1` | server | major | Mineshaft overhaul |
| [YUNG's Better Nether Fortresses](https://modrinth.com/mod/yungs-better-nether-fortresses) | `1.21.1-NeoForge-3.1.5` | server | major | The Nether as a real place. Veldora canon: the Nether is a WOUND - an alternative you should not visit. YungsApi already present |
| [YUNG's Better Strongholds](https://modrinth.com/mod/yungs-better-strongholds) | `1.21.1-NeoForge-5.1.3` | server | major | Stronghold overhaul |
| [YUNG's Cave Biomes](https://modrinth.com/mod/yungs-cave-biomes) | `1.21.1-NeoForge-3.1.1` | both | major | Underground biome variety |
| [Battle Towers](https://modrinth.com/mod/battle-towers) | `1.3.0+mod` | both | minor | Climbable combat towers |
| [Field Guide](https://modrinth.com/mod/field-guide) | `1.13.6-1.21.1-neoforge` | both | minor | Discover animals and monsters with a spyglass and record them. Gives the peaceful surface something to DO between descents |
| [Formations Nether](https://modrinth.com/mod/formations-nether) | `1.0.5a-mc1.21+` | server | minor | Nether terrain drama |
| [Hopo Better Ruined Portals](https://modrinth.com/mod/hopo-better-ruined-portals) | `1.4.4b` | both | minor | Ruined portals worth looking at |
| [Improved Pillager Outpost](https://modrinth.com/mod/improved-pillager-outpost) | `5` | both | minor | Outposts that are actually a fight |
| [Nether Depths Upgrade](https://modrinth.com/mod/nether-depths-upgrade) | `3.1.8` | both | minor | Lava-sea flora and fauna |
| [SeasonHud](https://modrinth.com/mod/seasonhud) | `1.21.1-2.0.8` | both | minor | Shows the current season on the HUD - without it, seasonal farming is guesswork |
| [When Dungeons Arise: Seven Seas](https://modrinth.com/mod/when-dungeons-arise-seven-seas) | `1.0.4` | server | minor | Naval dungeon set |

## qol (53)

Quality of life. At 400 mods this is not garnish - it is what stops the pack being unplayable. Recipe lookup, tooltips, sorting, waypoints and death recovery carry the whole experience.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Almost Unified](https://modrinth.com/mod/almostunified) | `1.21.1-1.4.2+neoforge` | both | core | Unifies duplicate ores and ingots. Prevents the five-kinds-of-copper mess |
| [AppleSkin](https://modrinth.com/mod/appleskin) | `3.0.9+mc1.21` | both | core | Food values and saturation, visible |
| [Clumps](https://modrinth.com/mod/clumps) | `19.0.0.1` | both | core | Merges XP orbs - QoL and a real server performance win |
| [Controlling](https://modrinth.com/mod/controlling) | `19.0.5` | client | core | Search the keybind list. With 400 mods, mandatory |
| [EMI](https://modrinth.com/mod/emi) | `1.1.24+1.21.1+neoforge` | both | core | The recipe viewer. Chosen over JEI for performance and its handling of huge recipe sets |
| [Mouse Tweaks](https://modrinth.com/mod/mouse-tweaks) | `1.21-2.26.1-neoforge` | client | core | Inventory mouse handling |
| [Polymorph](https://modrinth.com/mod/polymorph) | `1.1.0+1.21.1` | both | core | Resolves conflicting recipes. At 400 mods, collisions are certain |
| [Raise Sound Limit Simplified](https://modrinth.com/mod/rsls) | `1.1.16+neoforge` | client | core | Raise Sound Limit Simplified. NEAR-MANDATORY HERE: vanilla caps concurrent sound sources, and Sound Physics + AmbientSounds + footsteps + 170 new SFX will exceed it - the symptom is sounds silently dropping out mid-fight, which reads as a bug in whatever was making them |
| [Simple Voice Chat](https://modrinth.com/mod/simple-voice-chat) | `neoforge-1.21.1-2.6.21` | both | core | Proximity voice. For four people on a horror server, the highest-value mod in the pack - and half the horror layer depends on it |
| [AmbientSounds](https://modrinth.com/mod/ambientsounds) | `6.3.8` | client | major | Biome and structure-aware ambient soundscapes - wind, water, caves, weather. Completes the audio layer alongside Sound Physics and voice chat, and is arguably the highest-impact immersion mod in the pack |
| [Carry On](https://modrinth.com/mod/carry-on) | `2.2.6` | both | major | Pick up a chest WITH its contents, a machine, or a mob, and walk off with it. The most kinetic storage verb there is, and it needs no UI to understand |
| [Comforts](https://modrinth.com/mod/comforts) | `9.0.5+1.21.1` | both | major | Sleeping bags and hammocks - four players, four sleep schedules |
| [darkaroundme](https://modrinth.com/mod/darkaroundme) | `1.0.0` | both | major | Renders unlit areas as ABSOLUTE darkness instead of vanilla grey murk. Makes carried light a real resource and gives the horror layer somewhere to hide |
| [Distant Horizons](https://modrinth.com/mod/distanthorizons) | `3.2.0-b-1.21.1` *beta* | both | major | Massively increased render distance at low cost. For a world built for atmosphere, seeing the horizon IS the immersion |
| [Easy Anvils](https://modrinth.com/mod/easy-anvils) | `v21.1.0-1.21.1-NeoForge` | both | major | Anvils without the too-expensive wall |
| [Emotecraft](https://modrinth.com/mod/emotecraft) | `2.4.12+1.21.1-forge` | both | major | Player-made emotes. With proximity voice chat, this is how four people actually roleplay rather than type |
| [Explorer's Compass](https://modrinth.com/mod/explorers-compass) | `1.21.1-3.4.0-neoforge` | both | major | Find structures |
| [Figura](https://modrinth.com/mod/figura) | `0.1.6+1.21.1` | client | major | Custom scripted player avatars. Client-side, so it costs the server nothing and each player controls their own presence |
| [Nature's Compass](https://modrinth.com/mod/natures-compass) | `1.21.1-3.4.0-neoforge` | both | major | Find biomes without wandering for an hour |
| [Panda's Falling Trees](https://modrinth.com/mod/pandas-falling-trees) | `0.14.0` *beta* | both | major | Tree felling. BETA build. |
| [Presence Footsteps (NeoForge)](https://modrinth.com/mod/pf-neoforge) | `1.21.1-1.12.0-beta.1` *beta* | client | major | Presence Footsteps - footstep audio that varies by the surface you are actually standing on. With Sound Physics reverberating it, this is most of what 'the world sounds real' means |
| [Ping It!](https://modrinth.com/mod/pingit) | `2.0.5` | both | major | Ping locations. |
| [Sounds](https://modrinth.com/mod/sound) | `2.4.22+lts+1.21.1-neoforge` | client | major | Sounds - 170+ replacement and new sound effects. The SFX layer under the ambience |
| [Storage Drawers](https://modrinth.com/mod/storagedrawers) | `1.21.1-13.11.4` | both | major | Bulk storage with contents visible on the block face - storage you can read by looking at it |
| [Trade Cycling](https://modrinth.com/mod/trade-cycling) | `neoforge-1.21.1-1.0.18` *beta* | both | major | Refresh villager trades without breaking and replacing workstations - removes the single most tedious ritual in modded Minecraft |
| [Trading Post](https://modrinth.com/mod/trading-post) | `v21.1.1-1.21.1-NeoForge` | both | major | Trade with every villager in a village at once. With a peaceful medieval surface, villages are now central to play and vanilla trading does not scale to four people |
| [TrashSlot](https://modrinth.com/mod/trashslot) | `21.1.11+neoforge-1.21.1` | both | major | A bin slot. Ethan: "we have too much junk." |
| [Waystones](https://modrinth.com/mod/waystones) | `21.1.41+neoforge-1.21.1` | both | major | Fast travel between discovered points. CUT 2026-08-03 for deleting extraction, RESTORED 2026-08-04 by Ethan. Consider gating use below y0 to keep the climb-out |
| [3D Skin Layers](https://modrinth.com/mod/3dskinlayers) | `1.11.2` | client | minor | 3D skin layers |
| [Advancement Plaques](https://modrinth.com/mod/advancement-plaques) | `1.6.8` | client | minor | Better advancement popups |
| [Automaticons](https://modrinth.com/mod/automaticons) | `1.8+mod` | both | minor | Golem automation OUTSIDE Create - Ethan asked for exactly this |
| [BetterF3](https://modrinth.com/mod/betterf3) | `11.0.3` | client | minor | Readable debug screen |
| [Boat Item View](https://modrinth.com/mod/boat-item-view) | `1.21-1.21.1-0.0.6-neoforge` | client | minor | See held items in boats |
| [Chat Heads](https://modrinth.com/mod/chat-heads) | `0.15.3` | client | minor | Faces in chat - small, disproportionately social |
| [Drip Sounds](https://modrinth.com/mod/dripsounds) | `0.5.2+1.21.8-neoforge` | client | minor | Water drips land and settle audibly. Small, and it is what makes a cave sound like a cave |
| [Easy Magic](https://modrinth.com/mod/easy-magic) | `v21.1.4-1.21.1-NeoForge` | both | minor | Enchanting table QoL |
| [Elytra Slot](https://modrinth.com/mod/elytra-slot) | `9.0.2+1.21.1` | both | minor | Elytra in an accessory slot |
| [EMI Loot](https://modrinth.com/mod/emi-loot) | `0.7.9+1.21+neoforge` | both | minor | Loot table viewing in EMI |
| [EMIffect](https://modrinth.com/mod/emiffect) | `2.1.6+mc1.21.1` | client | minor | Status effect information in EMI |
| [Extreme sound muffler](https://modrinth.com/mod/extreme_sound_muffler) | `3.56-1.21.1` | both | minor | Selectively muffle individual sounds. With this much audio, the escape valve for whichever one turns out to be maddening |
| [Figura ExtraBone](https://modrinth.com/mod/figura_extrabone) | `0.0.3-neoforge+1.21.1` | client | minor | Model extensions for Figura |
| [Forgiving Void](https://modrinth.com/mod/forgiving-void) | `21.1.7+neoforge-1.21.1` | server | minor | The void becomes survivable instead of run-ending |
| [Immersive Paintings](https://modrinth.com/mod/immersive-paintings) | `0.7.8+1.21.1` | both | minor | Hang real images as in-world paintings, server-synced. Four people decorating a shared world with their own art |
| [Item Borders](https://modrinth.com/mod/item-borders) | `1.2.5` | client | minor | Rarity borders in inventory slots |
| [Item Highlighter](https://modrinth.com/mod/item-highlighter) | `1.1.11` | client | minor | Highlights newly picked-up items |
| [Just Enough Breeding (JEBr)](https://modrinth.com/mod/justenoughbreeding) | `3.2.1` | client | minor | Breeding information in the recipe viewer |
| [[Let's Do] Camping](https://modrinth.com/mod/lets-do-camping) | `2.1.4` | both | minor | Tents, bedrolls and campfires. Turns an expedition into an activity instead of digging a dirt hole at dusk - and the buried-tech device depends on people going far from base |
| [Make Bubbles Pop](https://modrinth.com/mod/make_bubbles_pop) | `0.4.0-beta.1-neoforge` *beta* | client | minor | Better bubble particles |
| [No Chat Reports](https://modrinth.com/mod/no-chat-reports) | `NeoForge-1.21.1-v2.9.1` | both | minor | Removes chat reporting on a private server |
| [Remove Reloading Screen](https://modrinth.com/mod/rrls) | `5.0.11+mc1.21.1-forge` *beta* | client | minor | Removes the reloading screen |
| [Subtle Effects](https://modrinth.com/mod/subtle-effects) | `1.14.3` | both | minor | Extra particles and small sounds for events that vanilla leaves silent |
| [Tips](https://modrinth.com/mod/tips) | `21.1.3` | both | minor | Loading-screen tips - a place to teach the pack's own systems |
| [Traveler's Titles](https://modrinth.com/mod/travelers-titles) | `1.21.1-NeoForge-5.1.3` | client | minor | Biome and dimension names as a centre-screen title on entry - the actual answer to the information drought, and it reads every mod's biome names |

## building-deco (8)

Building blocks and furniture. Four players sharing a world need a deep palette or every base looks identical. Every Compat plus the Macaw suite produces an enormous variant space for very little runtime cost.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Chipped](https://modrinth.com/mod/chipped) | `4.0.2` | both | major | Thousands of block variants from vanilla materials |
| [Every Compat (Wood Good)](https://modrinth.com/mod/every-compat) | `1.21-2.11.48` | both | major | Generates the missing wood-type variants across every mod in the pack |
| [FramedBlocks](https://modrinth.com/mod/framedblocks) | `10.6.1` | both | major | Framed blocks - any shape, any texture |
| [Handcrafted](https://modrinth.com/mod/handcrafted) | `4.0.3` | both | major | Furniture with craft appeal |
| [Supplementaries](https://modrinth.com/mod/supplementaries) | `1.21.1-3.8.9` | both | major | Decoration. Ethan: "Decorations." |
| [Macaw's Furniture](https://modrinth.com/mod/macaws-furniture) | `3.4.1` | both | minor | Furniture |
| [Macaw's Roofs](https://modrinth.com/mod/macaws-roofs) | `2.3.2` | both | minor | Roofs |
| [Storage Delight](https://modrinth.com/mod/storage-delight) | `26.07.01a-1.21-neoforge` | both | minor | Kitchen and storage furniture |

## food-farm (2)

Farmer's Delight and its ecosystem. This exists because Create: Central Kitchen and Slice & Dice make food a real automation target rather than a chore.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Farmer's Delight](https://modrinth.com/mod/farmers-delight) | `1.21.1-1.3.2` | both | major | The cooking and farming base |
| [Tough As Nails](https://modrinth.com/mod/tough-as-nails) | `10.1.0.13` *beta* | both | major | Thirst + temperature. BETA. Gives the pack food a reason to exist; its own balance chunk. |

## performance (21)

Split deliberately: server-side mods cut tick time for everyone, client-side mods keep four very different machines playable. A 400-mod pack without this layer is a slideshow. Note that Sodium and Embeddium are alternatives, not companions - the pack ships Sodium and keeps Embeddium documented as the fallback.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Chunky](https://modrinth.com/mod/chunky) | `1.4.23` | both | core | Chunk pre-generation - eliminates exploration lag spikes |
| [Entity Culling](https://modrinth.com/mod/entityculling) | `1.10.5` | client | core | Skips rendering hidden entities |
| [ImmediatelyFast](https://modrinth.com/mod/immediatelyfast) | `1.6.11+1.21.1-neoforge` | client | core | Batches immediate-mode rendering |
| [Lithium](https://modrinth.com/mod/lithium) | `mc1.21.1-0.15.4-neoforge` | both | core | General tick optimisation. Replaces Radium, which Create REFUSES to run alongside - Create's own manifest says: 'Radium is an unofficial port of Lithium, Lithium is now natively available for NeoForge and does not suffer from the same issues radium does, use Lithium instead.' Found at first boot, not by guesswork |
| [Load My F***ing Tags](https://modrinth.com/mod/lmft) | `1.1.1+1.21.9` | server | core | Load My F***ing Tags - stops one bad tag breaking the pack |
| [ModernFix](https://modrinth.com/mod/modernfix) | `5.27.20+mc1.21.1` | both | core | Broad startup and memory fixes; also cuts load time substantially |
| [Packet Fixer](https://modrinth.com/mod/packet-fixer) | `3.3.1` | both | core | Fixes packet, NBT and timeout problems. Genuinely necessary on packs this large |
| [Sodium](https://modrinth.com/mod/sodium) | `mc1.21.1-0.8.12-neoforge` | client | core | Client renderer; Sodium 0.6+ supports NeoForge |
| [Sodium Extra](https://modrinth.com/mod/sodium-extra) | `mc1.21.1-0.9.3+neoforge` | client | core | The options Sodium deliberately omits - fog control, particle limits, per-feature toggles. The main dial for trading visuals against frames |
| [spark](https://modrinth.com/mod/spark) | `1.10.124-neoforge-1.21.1` | both | core | The profiler. When the server lags, this is how the cause gets found instead of guessed |
| [Alternate Current](https://modrinth.com/mod/alternate-current) | `neoforge-mc1.21-1.9.0` | server | major | Far faster redstone dust implementation |
| [CreateBetterFps](https://modrinth.com/mod/createbetterfps) | `1.1.4` | client | major | Up to 50% better framerate on Create contraptions WHEN A SHADERPACK IS ON. That is precisely this pack: a Create server, with shaders, rendered next to a running dedicated server |
| [Euphoria Patches](https://modrinth.com/mod/euphoria-patches) | `1.9.3-r5.8.1-neoforge` | client | major | Euphoria Patches - extends Complementary Shaders, and is what gives Complementary its Distant Horizons support. Needed for shaders and DH to coexist |
| [Flerovium](https://modrinth.com/mod/flerovium) | `1.1.2` | client | major | General render optimisation with no visual cost |
| [Iris Shaders](https://modrinth.com/mod/iris) | `1.8.14-beta.1+1.21.1-neoforge` *beta* | client | major | Shader support on top of Sodium |
| [More Culling](https://modrinth.com/mod/moreculling) | `1.0.8` *beta* | client | major | More aggressive culling |
| [Particle Core](https://modrinth.com/mod/particle-core) | `0.3.3+1.21+neoforge` | client | major | Particle culling and per-type limits. The horror and magic layers emit enormous particle volumes |
| [Put A Plug In it! (PAPI)](https://modrinth.com/mod/put-a-plug-in-it!) | `1.21.1-neoforge-1.1.1` | both | major | Fixes memory leaks and reduces memory usage |
| [Reese's Sodium Options](https://modrinth.com/mod/reeses-sodium-options) | `mc1.21.1-2.2.3+neoforge` | client | major | A usable options menu for the above. Four people will each need a different settings profile on different hardware |
| [Saturn](https://modrinth.com/mod/saturn) | `mc1.21.1-0.1.5` | both | major | Memory optimisation |
| [Dynamic FPS](https://modrinth.com/mod/dynamic-fps) | `3.11.4` | client | minor | Throttles FPS when the window is unfocused |

## server-admin (3)

Server operation, and the beginnings of the AI dungeon master seam. KubeJS is the important entry: it is the scriptable surface a DM would eventually drive, and it costs nothing to include now. The quest engine is the known gap - see curseforge_only above.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [KubeJS](https://modrinth.com/mod/kubejs) | `2101.7.2-build.368` | both | major | Server-side scripting - recipes, custom items and world events in JavaScript. The most plausible execution surface for the future dungeon master |
| [ServerCore](https://modrinth.com/mod/servercore) | `1.5.19+1.21.1` | server | major | Server-side dynamic performance tuning |
| [Crash Assistant](https://modrinth.com/mod/crash-assistant) | `1.11.11` | client | minor | Better crash diagnostics |

## core-libs (27)

APIs and shared code. Listed explicitly rather than left to transitive resolution so a dependency change shows up as a visible diff.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Architectury API](https://modrinth.com/mod/architectury-api) | `13.0.11+neoforge` | both | core | Multiloader shim a lot of ports depend on |
| [Balm](https://modrinth.com/mod/balm) | `21.0.64+neoforge-1.21.1` | both | core | Blay's library - Waystones, Comforts, Trash Cans |
| [Bookshelf](https://modrinth.com/mod/bookshelf-lib) | `21.1.81` | both | core | Darkhax's library |
| [CreativeCore](https://modrinth.com/mod/creativecore) | `2.13.41` | both | core | CreativeMD's library - EnhancedVisuals |
| [Cristel Lib](https://modrinth.com/mod/cristel-lib) | `neoforge-1.21.1-3.1.7` | both | core | Structure config library used by several worldgen mods |
| [Curios API](https://modrinth.com/mod/curios) | `9.5.1+1.21.1` | both | core | Accessory/trinket slots - a large share of the equipment mods target it |
| [FerriteCore](https://modrinth.com/mod/ferrite-core) | `7.0.3-neoforge` | both | core | Memory deduplication. Filed as a library because everything benefits |
| [Geckolib](https://modrinth.com/mod/geckolib) | `4.9.2` | both | core | Animation engine - Cataclysm, Born in Chaos, most modern mobs |
| [GlitchCore](https://modrinth.com/mod/glitchcore) | `2.1.0.2` *beta* | both | core | TerraBlender-adjacent library |
| [Kotlin for Forge](https://modrinth.com/mod/kotlin-for-forge) | `5.12.0` | both | core | Kotlin runtime some mods ship against |
| [Modonomicon](https://modrinth.com/mod/modonomicon) | `1.21.1-1.120.4` | both | core | The other guidebook engine; Iron's Spells uses it |
| [Moonlight Lib](https://modrinth.com/mod/moonlight) | `1.21.1-3.3.0` | both | core | MehVahdJukaar's library - Supplementaries, Every Compat |
| [Patchouli](https://modrinth.com/mod/patchouli) | `1.21.1-93-neoforge` | both | core | In-game guidebooks - many mods ship documentation for it |
| [Placebo](https://modrinth.com/mod/placebo) | `1.21.1-9.9.2` | both | core | Shadows' library - the Apotheosis family |
| [playerAnimator](https://modrinth.com/mod/playeranimator) | `2.0.4+1.21.1-forge` *beta* | both | core | Player animation API for combat and emote mods |
| [Puzzles Lib](https://modrinth.com/mod/puzzles-lib) | `v21.1.52-1.21.1-NeoForge` | both | core | Fuzs' library - Easy Anvils and friends |
| [Resourceful Config](https://modrinth.com/mod/resourceful-config) | `3.0.11` | both | core | Config backend for the Resourceful family |
| [Resourceful Lib](https://modrinth.com/mod/resourceful-lib) | `3.0.12` | both | core | Resourceful family library |
| [SmartBrainLib](https://modrinth.com/mod/smartbrainlib) | `1.16.11` | server | core | Brain/AI library used by modern mob mods |
| [TerraBlender](https://modrinth.com/mod/terrablender) | `4.1.0.8` *beta* | both | core | Biome injection layer |
| [YUNG's API](https://modrinth.com/mod/yungs-api) | `1.21.1-NeoForge-5.1.6` | both | core | Required by every YUNG structure mod |
| [Athena](https://modrinth.com/mod/athena-ctm) | `4.0.6` | client | minor | Connected-textures backend |
| [Caelus API](https://modrinth.com/mod/caelus) | `7.0.1+1.21.1` | both | minor | Elytra flight attribute API |
| [Cloth Config API](https://modrinth.com/mod/cloth-config) | `15.0.140+neoforge` | both | minor | Config screen library |
| [Fzzy Config](https://modrinth.com/mod/fzzy-config) | `0.7.6+1.21+neoforge` | both | minor | Config library |
| [Prickle](https://modrinth.com/mod/prickle) | `21.1.11` | both | minor | Config library |
| [Searchables](https://modrinth.com/mod/searchables) | `1.0.2` | client | minor | Search-field library |

## auto-deps (53)

Required dependencies discovered by resolving the pack's declared dependency graph (tools/resolve.py deps). These were being pulled in implicitly; listing them explicitly means a dependency appearing or disappearing is a reviewable diff rather than a surprise at boot. Fabric API and QSL were correctly excluded - multiloader jars declare them even though no NeoForge build needs them.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Accessories](https://modrinth.com/mod/accessories) | `1.1.0-beta.53+1.21.1` *beta* | both | core | Required by spell-engine. ADDED WITHOUT accessories-compat-layer ON PURPOSE - F44 traced the curio-menu crash (Index 61 out of bounds, slot-count desync) to the COMPAT LAYER cancelling Curios' core mixins, not to Accessories itself. If the crash returns, this is the first suspect |
| [Biolith](https://modrinth.com/mod/biolith) | `3.0.14` | server | core | Required by hybrid-aquatic, lets-do-bloomingnature |
| [Bundle API](https://modrinth.com/mod/bundle-api) | `1.1.0-neoforge` | both | core | Required by archers |
| [CERBON's API](https://modrinth.com/mod/cerbons-api) | `1.3.0` | both | core | Required by bosses-of-mass-destruction-forge |
| [Cobweb](https://modrinth.com/mod/cobweb) | `1.4.0` | both | core | Required by soul-fire-d |
| [CoroUtil](https://modrinth.com/mod/coroutil) | `1.21.0-1.3.8` | both | core | Required by Weather, Storms & Tornadoes |
| [Create: Dragons Plus](https://modrinth.com/mod/create-dragons-plus) | `1.11.3` | both | core | Required by create-central-kitchen and create-enchantment-industry |
| [Data Anchor](https://modrinth.com/mod/data-anchor) | `2.0.0.14-neoforge` | both | core | Required by enhanced-celestials |
| [Deimos](https://modrinth.com/mod/deimos) | `1.21.1-neoforge-2.7` | both | core | Required by server-side-horror |
| [DragonLib](https://modrinth.com/mod/dragonlib) | `1.21.1-beta-3.0.28` *beta* | both | core | Required by create-railways-navigator |
| [Dynamic Asset Generator](https://modrinth.com/mod/dynamic_asset_generator) | `6.1.2` | both | core | Required by ars-lumos |
| [[EMF] Entity Model Features](https://modrinth.com/mod/entity-model-features) | `3.2.4-neoforge-1.21` | client | core | Required by crimson_curse |
| [[ETF] Entity Texture Features](https://modrinth.com/mod/entitytexturefeatures) | `7.1-neoforge-1.21` | client | core | Required by crimson_curse |
| [Forgified Fabric API](https://modrinth.com/mod/forgified-fabric-api) | `0.116.15+2.3.1+1.21.1` | both | core | Required by frostiful, scorchful - the Sinytra shim, a real NeoForge mod |
| [Formations (Structure Library)](https://modrinth.com/mod/formations) | `1.0.4-neoforge-mc1.21` | server | core | Base mod behind formations-nether |
| [Fusion (Connected Textures)](https://modrinth.com/mod/fusion-connected-textures) | `1.3.12-neoforge-mc1.21.1` | client | core | Required by rechiseled |
| [Iceberg](https://modrinth.com/mod/iceberg) | `1.3.2` | both | core | Required by advancement-plaques, item-borders, legendary-tooltips |
| [Immersive Overlays](https://modrinth.com/mod/immersive-overlays) | `1.7.3+1.21.1-neoforge` | client | core | Required by field-guide |
| [Item Descriptions](https://modrinth.com/mod/item-descriptions) | `2.8.0+1.21.1-neoforge` | client | core | Required by field-guide |
| [Just Enough Items (JEI)](https://modrinth.com/mod/jei) | `19.44.0.401` *beta* | both | core | REQUIRED by jurassicreborn. Its mods.toml says 'mandatory = false', but that is the legacy FORGE key - NeoForge reads 'type', and an ABSENT type defaults to REQUIRED. The client refused to launch: "Mod ID: 'jei', Requested by: 'jurassicreborn', Expected range: '[15,)', Actual version: '[MISSING]'". EMI stays as the primary recipe viewer; the two coexist |
| [Jupiter](https://modrinth.com/mod/jupiter) | `2.3.7-1.21.1-neoforge` | both | core | Required by iceandfire-ce |
| [Knight Lib](https://modrinth.com/mod/knight-lib) | `1.6.1` | both | core | Required by knightquest. Also undeclared on Modrinth |
| [KotlinLangForge](https://modrinth.com/mod/kotlin-lang-forge) | `2.12.2-k2.4.10-3.0+neoforge` | both | core | Required by veinminer |
| [Lionfish-API](https://modrinth.com/mod/lionfish-api) | `3.1` | both | core | Required by l_enders-cataclysm and goety-cataclysm |
| [Lithostitched](https://modrinth.com/mod/lithostitched) | `1.7.13-neoforge-21.1` | server | core | Required by hybrid-aquatic, tectonic |
| [MonoLib](https://modrinth.com/mod/monolib) | `neoforge-1.21.1-4.1.0` | both | core | Required by dis-enchanting-table |
| [MRU](https://modrinth.com/mod/mru) | `1.0.31+1.21.1-neoforge` | both | core | Required by the Sounds mod |
| [oωo (owo-lib)](https://modrinth.com/mod/owo-lib) | `0.12.15.5-beta.1+1.21` *beta* | both | core | Required by accessories, accessories-compat-layer, aether, simple-hats |
| [Platform](https://modrinth.com/mod/platform) | `1.3.3` | both | core | Required by rottencreatures |
| [Polytone](https://modrinth.com/mod/polytone) | `1.21-3.11.0` | client | core | Required by crimson_curse |
| [Prism](https://modrinth.com/mod/prism-lib) | `1.0.11` | client | core | Required by item-borders, legendary-tooltips |
| [Prometheus](https://modrinth.com/mod/prometheus-api) | `1.2.5` | both | core | Required by soul-fire-d |
| [Ranged Weapon API](https://modrinth.com/mod/ranged-weapon-api) | `2.3.3+1.21.1-neoforge` | both | core | Required by archers. Same undeclared-dependency case |
| [Rhino](https://modrinth.com/mod/rhino) | `2101.2.7-build.85+Rhino-1.21` | both | core | Required by kubejs |
| [Ritchie's Projectile Library](https://modrinth.com/mod/rpl) | `2.1.2` | both | core | Ritchie's Projectile Library - required by create-big-cannons |
| [Runes](https://modrinth.com/mod/runes) | `1.3.1+1.21.1-neoforge` | both | core | Required by wizards |
| [Sable](https://modrinth.com/mod/sable) | `2.0.3+mc1.21.1` | both | core | Required by create-aeronautics |
| [ShatterLib \| OctoLib](https://modrinth.com/mod/shatterbyte-lib) | `0.6.2` | both | core | OctoLib - required by relics and reliquified_ars_nouveau. NOT declared in Modrinth's dependency data; found by reading the jar manifests |
| [Sparkweave Engine](https://modrinth.com/mod/sparkweave) | `0.510.0+NeoForge` *beta* | both | core | Sparkweave Engine - required by velvet-api, which Scorchful needs |
| [Spell Power Attributes](https://modrinth.com/mod/spell-power) | `1.6.0+1.21.1-neoforge` | both | core | Spell Power Attributes - required by spell-engine and skill-tree. Modrinth never declared it; check_deps read it out of the jar |
| [Structure Pool API](https://modrinth.com/mod/structure-pool-api) | `1.2.1+1.21.1-neoforge` | server | core | Required by wizards |
| [SuperMartijn642's Config Lib](https://modrinth.com/mod/supermartijn642s-config-lib) | `1.1.8-neoforge-mc1.21` | both | core | Required by chunk-loaders, moving-elevators, rechiseled, trash-cans |
| [SuperMartijn642's Core Lib](https://modrinth.com/mod/supermartijn642s-core-lib) | `1.1.22-neoforge-mc1.21` | both | core | Required by chunk-loaders, moving-elevators, rechiseled, trash-cans |
| [Teal Lib](https://modrinth.com/mod/teallib) | `1.3.teal` | both | core | Required by spawn-mod |
| [Thermoo](https://modrinth.com/mod/thermoo) | `4.8.1-neoforge` *alpha* | both | core | Required by frostiful, scorchful |
| [Uranus](https://modrinth.com/mod/uranus) | `2.4.1` | both | core | Required by iceandfire-ce |
| [Velvet](https://modrinth.com/mod/velvet-api) | `0.5.1+NeoForge` | client | core | Required by scorchful |
| [YetAnotherConfigLib (YACL)](https://modrinth.com/mod/yacl) | `3.8.2+1.21.1-neoforge` | both | core | Required by critters-and-companions, health-indicators |
| [Zeta](https://modrinth.com/mod/zeta) | `1.1-40` | both | core | Required by quark |
| [Collective](https://modrinth.com/mod/collective) | `1.21.1-8.39-fabric+forge+neo` | both | major | Required by village-spawn-point. |
| [Kiwi 🥝](https://modrinth.com/mod/kiwi) | `15.8.7+neoforge` | both | major | Required by snow-real-magic and companion. |
| [PandaLib](https://modrinth.com/mod/pandalib) | `0.6.0` *beta* | both | major | Required by pandas-falling-trees. |
| [TxniLib](https://modrinth.com/mod/txnilib) | `neoforge-1.21.1-1.0.24` | both | major | Required by immersive-messages-api. |

## classes (6)

Ethan chose CLASSES over races 2026-08-03 - the only 1.21.1 NeoForge race mod is a 6.4k-download alpha, while this family is fully supported. Three players taking three classes gives the distinct identity races were wanted for, and it fits Veldora: what you BECOME matters in a world where you cannot die but can be diminished. NOTE: more-rpg-library and several classes ship as 'beta' - that is the author's convention across a family with 400k-1.4M downloads, but the boot gate is what actually clears it.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [AzureLib Armor](https://modrinth.com/mod/azurelib-armor) | `3.1.3` | both | core | Armor/animation lib required by Berserker |
| [More RPG Library](https://modrinth.com/mod/more-rpg-library) | `2.6.3+1.21.1-neoforge` *beta* | both | core | Shared library for the More RPG Classes series |
| [Spell Engine](https://modrinth.com/mod/spell-engine) | `1.9.16+1.21.1-neoforge` | both | core | The framework every class in this family builds on |
| [Archers (RPG Series)](https://modrinth.com/mod/archers) | `3.0.3+1.21.1-neoforge` | both | major | Base archer class |
| [Archers Expansion (More RPG Classes)](https://modrinth.com/mod/archers-expansion) | `1.5.1+1.21.1-neoforge` *beta* | both | major | Extends the archer with real content |
| [Pufferfish's Skills](https://modrinth.com/mod/skills) | `0.18.3` *beta* | both | major | Puffish skill framework - the progression spine |

## client-visual (9)

Client-only visual polish. Ethan, 2026-08-16: 'im just making an attempt to make the game more cinematic'. EVERY entry is client_side=required / server_side=unsupported, verified against the live Modrinth API - so the server never needs the jar and nobody who declines is locked out, which is the failure the_obsessed caused on 2026-08-15. NOT here: better-clouds (the client ships renderClouds:false so it would render nothing) and every snow mod (all 16 on 1.21.1/neoforge need the server; not one is client-only).

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Fog](https://modrinth.com/mod/fog) | `1.11.0+1.21-neoforge` | both | major | Configurable fog. Ethan: "Just makes the world beautiful." |
| [Snow! Real Magic! ⛄](https://modrinth.com/mod/snow-real-magic) | `12.2.2+neoforge` | both | major | Real snow layers. Ethan: "Snow!" |
| [ATMOSPHERICS](https://modrinth.com/mod/atmospherics) | `2.6.5.1` *beta* | client | minor | Per-biome fog, sky, cloud and star colour in real time. The cheapest 'cinematic' win on the list - it is colour grading, not geometry. |
| [Clear Water](https://modrinth.com/mod/clear-water) | `3.0.0` | client | minor | Configurable underwater fog. Client-only, and it pairs with make_bubbles_pop which is already installed. |
| [Falling Leaves (NeoForge/Forge)](https://modrinth.com/mod/fallingleavesforge) | `1.21.1-2.5.1` | client | minor | Leaf particles from tree canopies. Cheap, and it makes a still forest look alive. |
| [Particle Rain](https://modrinth.com/mod/particle-rain) | `v4-beta.10+1.21.1-neoforge` *beta* | client | minor | Weather as particles instead of the vanilla sheet. 19M downloads, client-only. The single biggest visual change on this list and the one Ethan asked for by name. |
| [Particular ✨ Reforged](https://modrinth.com/mod/particular-reforged) | `1.5.7` | client | minor | Ambient environment particles - the other half of Visuality rather than a duplicate; one does entities, one does the world. |
| [Smooth Skies](https://modrinth.com/mod/smooth-skies) | `2.10.4` | client | minor | Fixes skybox colour banding at long render distances. Specifically relevant here: Distant Horizons IS in this pack, and banding is exactly what DH's extra distance exposes. |
| [Visuality: Reforged](https://modrinth.com/mod/visuality-forge) | `3.0.0` | client | minor | Ambient particles on mobs and blocks. Reforged port, client-only. |

## media-ambience (4)

Shared media and world ambience. Ethan, 2026-08-02: 'we also need more ambient sounds, the world is just quiet' and an earlier ask for watching video / importing images together. AmbientSounds is by the CreativeCore author, so its dependency is already in the pack.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Companion 🐕](https://modrinth.com/mod/companion) | `6.2.2+neoforge` | server | major | Ethan: "Gives the world a bit more life, personally." |
| [Immersive Messages API](https://modrinth.com/mod/immersive-messages-api) | `neoforge-1.21.1-1.0.18` | both | major | In-world text API. Ethan wants ALL god dialogue moved onto it - its own chunk. |
| [What Are They Up To (Watut)](https://modrinth.com/mod/what-are-they-up-to) | `1.21.0-1.2.7` | both | major | Shows what other players are doing. |
| [Camerapture](https://modrinth.com/mod/camerapture) | `1.10.12+mc1.21.1-neoforge` | both | minor | Take, place and share photographs between players - the social half of a 4-player world |

## resourcepack (4)

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Faithful 32x](https://modrinth.com/mod/faithful-32x) | `1.21.1-june-2026` | client | resourcepack | The shipped texture pack. Vanilla-faithful at 2x resolution, so it never fights modded art styles; 4.1M downloads and a current 1.21.1 build. |
| [Fresh Animations](https://modrinth.com/mod/fresh-animations) | `1.10.4` *beta* | client | resourcepack | Animates VANILLA MOBS - the one Ethan described ('gives animations to general mobs'). Needs Entity Model Features, which is already installed. Ships OFF: 41M downloads but a known frame cost, and this instance is baselined for the slowest machine, so it is opt-in like the shader. |
| [Skyrim Music Pack](https://modrinth.com/mod/skyrim-music-pack) | `1.0.2` | client | resourcepack | Ethan's pick. 72.6 MB and three 1.21.1 builds. Ships OFF like every other pack here - delivered by packwiz so enabling it is two clicks and no download. Sounds of Tamriel was the other request and is NOT included: it has no 1.21.1 build at all (latest is 1.20). Sound-only packs often survive a format bump, but that is unverified and shipping it would be a guess. |
| [Fresh Moves](https://modrinth.com/mod/tras-fresh-player) | `3.1` *beta* | client | resourcepack | Fresh Moves - the pack Ethan named. It animates the PLAYER rather than mobs, so it complements Fresh Animations rather than replacing it. Also ships OFF. |

## shaderpack (2)

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [BSL Shaders](https://modrinth.com/mod/bsl-shaders) | `10.1.3` | client | shaderpack | Added 2026-08-02 at Ethan's request - 'i personally use BSL for my shaders'. He had already installed it by hand, which is precisely the thing packwiz exists to stop: a hand-placed file is lost on the next re-import. It is the PRE-SELECTED pack in the shipped iris.properties, though shaders ship off. Note it has no native Distant Horizons support, which Complementary gets via Euphoria Patches - so if the far terrain looks wrong under BSL, that is why, and Complementary is the fallback. |
| [Complementary Shaders - Reimagined](https://modrinth.com/mod/complementary-reimagined) | `r5.8.1` | client | shaderpack | Chosen on performance: the best frames-per-quality of the four Ethan picked, and Euphoria Patches (already in the mod list) gives it Distant Horizons support, which most shaders lack. |

## veldora-2026-08-29 (28)

Everything added during the 2026-08-29 buildout, backfilled into this file on the same day. THIS CATEGORY EXISTS BECAUSE modlist.json HAD DRIFTED 28 MODS BEHIND resolved.json. gen_pack.py reads resolved.json so nothing was at risk day to day - but `resolve.py resolve` regenerates resolved.json FROM THIS FILE, so running it would have silently deleted 28 installed mods, including terralith and nyctophobia. The two must agree.

| Mod | Version | Side | Tier | Why |
|---|---|---|---|---|
| [Accents](https://modrinth.com/mod/accents) | `2.0.2` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Bountiful](https://modrinth.com/mod/bountiful) | `8.0.0-beta.2` *beta* | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [MCA Capitals \| A Monarchy Mod for MCA Reborn](https://modrinth.com/mod/capitals-a-monarchy-mod-for-mca-reborn) | `1.3.0` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Death Count](https://modrinth.com/mod/death-count) | `1.0+mod` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Distant Friends](https://modrinth.com/mod/distant-friends) | `0.9.5` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Easy NPC](https://modrinth.com/mod/easy-npc) | `7.10.0` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Easy NPC: Config UI](https://modrinth.com/mod/easy-npc-config-ui) | `7.10.0` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Easy NPC: Core](https://modrinth.com/mod/easy-npc-core) | `7.10.0` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Fragmentum](https://modrinth.com/mod/fragmentum) | `2.4.4` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Immersive Snow](https://modrinth.com/mod/immersive-snow) | `1.4.0` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. \| client_side forced to optional 2026-08-29: Modrinth marks it client=unsupported but it registers a client-bound network channel the server REQUIRES, so packwiz skipping it client-side made the server refuse the connection. |
| [Inventory Pets](https://modrinth.com/mod/inventory-pets) | `2.2.8` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Iron's Lib](https://modrinth.com/mod/irons-lib) | `1.21.1-2.1.0` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Iron's Simple Blood](https://modrinth.com/mod/irons-simple-blood) | `1.21.1-1.0.4` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Iron's Spells 'n Spellbooks](https://modrinth.com/mod/irons-spells-n-spellbooks) | `1.21.1-3.16.3` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Kambrik](https://modrinth.com/mod/kambrik) | `8.0.0-beta.2` *beta* | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Loot Journal: Pickup Notifier](https://modrinth.com/mod/loot-journal) | `6.2.1` | client | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Maestro](https://modrinth.com/mod/maestro-music) | `4.0.0` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [MCA Reborn](https://modrinth.com/mod/minecraft-comes-alive-reborn) | `7.7.36+1.21.1` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Nyctophobia](https://modrinth.com/mod/nyctophobia) | `2.0.0+mc1.21.1` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Obscure Tooltips](https://modrinth.com/mod/obscure-tooltips) | `4.2.4` | client | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Put A Plug In it! (PAPI)](https://modrinth.com/mod/put-a-plug-in-it-) | `1.21.1-neoforge-1.1.1` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Realm RPG: Treasure Balloons](https://modrinth.com/mod/realm-rpg-treasure-balloons) | `1.0.0` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. \| client_side forced to optional 2026-08-29: Modrinth marks it client=unsupported but it registers a client-bound network channel the server REQUIRES, so packwiz skipping it client-side made the server refuse the connection. |
| [Reliquified Artifacts](https://modrinth.com/mod/reliquified-artifacts) | `0.9.7` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [[🎄] Seasonal Decorations](https://modrinth.com/mod/seasonal-decorations) | `1.0712` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Simple Hats](https://modrinth.com/mod/simple-hats) | `1.21.1-Neo-0.4.0` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Terralith](https://modrinth.com/mod/terralith) | `2.6.2` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [The Day Of The Beast](https://modrinth.com/mod/the-day-of-the-beast) | `1.1.1` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |
| [Tyz's Skills](https://modrinth.com/mod/tyzs-skills) | `6.4.2` | both | major | Added 2026-08-29 in the Veldora buildout; see docs/68 and docs/70. |

