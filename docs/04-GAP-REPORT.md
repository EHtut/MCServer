# Gap report

> **Generated file.** Produced by `tools/gen_docs.py`. The honest
> accounting of what the 1.21.1 NeoForge ecosystem could and could not
> supply, and what was deliberately given up to stay inside the
> 400-mod budget.

## Summary

- **400 / 400** mod slots used
- **372** stable releases, **28** beta/alpha
- **8** entries carry a known hazard (see below)

---

## 1. Wanted, and genuinely unavailable

Verified absent from 1.21.1 NeoForge on any registry. Recorded so nobody
spends an evening re-checking.

| Mod | Situation |
|---|---|
| `scape-and-run-parasites` | Never left 1.12.2. Substituted with Fungal Infection: Spore and Crimson Curse |
| `the-man-from-the-fog` | 1.20.1 Forge only. Substituted with From The Fog's successor entities, The Knocker and Kenny |
| `botania` | 1.20.1 Forge / Fabric only. No 1.21.1 NeoForge build exists |
| `sculk-horde` | Stops at 1.20.6 |
| `eidolon-repraised` | No 1.21.1 NeoForge build |
| `ledger` | Fabric only - block audit logging has no NeoForge equivalent |
| `configured` | Went Fabric-only; no in-game config editor for NeoForge 1.21.1 |

**This is the cost of choosing 1.21.1 over 1.20.1.** It was a real cost -
the gun and horror catalogues on 1.20.1 Forge are deeper - but the
substitutions landed well: Fungal Infection: Spore and Crimson Curse cover
the spreading-infection niche Scape and Run occupied, and the 1.21.1
stalker roster (The Knocker, Obsessed, Kenny, The Skinwalker Hunt) is
larger than what 1.20.1 offered.

---

## 2. Available, but only on CurseForge

Modrinth cannot supply these. They need either the packwiz CurseForge
path or a decision to do without.

| Mod | Why it matters |
|---|---|
| `ftb-quests` | The quest engine. FTB withdrew their mods from Modrinth; this is CurseForge-only. Directly relevant to the future DM, which would author questlines into it |
| `ftb-library` | Required by everything FTB |
| `ftb-teams` | Team support for quests |
| `ftb-essentials` | Homes, warps, admin commands |
| `ftb-backups-2` | Automated backups |
| `timeless-and-classics-zero` | The OFFICIAL TaCZ. 1.20.1 Forge only - we use the community 1.21.1 NeoForge port instead |

**The one that actually matters is FTB Quests.** It is the natural artefact
for a DM-authored questline to be written into, and FTB withdrew their
mods from Modrinth, so no amount of searching finds it. Nothing in the
current pack blocks adding it later - see `03-AI-DM-SEAM.md` for why the
seam does not depend on it.

---

## 3. Known hazards in what we DID ship

Mods marked `risky`: wanted, included, but with a specific failure mode
worth knowing before it bites.

| Mod | Version | Hazard |
|---|---|---|
| [Alex's Mobs (Unofficial Port)](https://modrinth.com/mod/alexs-mobs(1.21.1)) | `1.22.17` | Community port of Alex's Mobs - the biggest creature roster in modded Minecraft |
| [Arthropod Phobia Expansions + Horror Bosses / Arachnophobia](https://modrinth.com/mod/arphex) | `5.0.2` | Phobia-grade arthropod horror and supernatural bosses |
| [Create Aeronautics](https://modrinth.com/mod/create-aeronautics) | `1.3.0+mc1.21.1` | Buildable airships and planes - spectacular, still alpha |
| [Steam 'n' Rails Neoforge](https://modrinth.com/mod/create-steam-n-rails-1.21.1) | `0.2.1+neoforge-mc1.21.1` | Community 1.21.1 port of Steam 'n' Rails - trains, couplers, signals |
| [Dynamic Trees](https://modrinth.com/mod/dynamictrees) | `1.7.2` | Growing, spreading trees - beautiful, but touches worldgen everywhere |
| [[UNOFFICIAL] TaCZ 1.21.1 NeoForge Port](https://modrinth.com/mod/tacz-1.21.1) | `1.1.8-hotfix-r6` | Community NeoForge port of Timeless and Classics Zero - attachments, ammo types, custom gun packs |
| [Tectonic](https://modrinth.com/mod/tectonic) | `3.0.26-neoforge-21.1` | Dramatic terrain shaping. Layers on top of the biome mod and needs a first-boot check |
| [The Broken Script](https://modrinth.com/mod/the-broken-script) | `1.10.1` | Corrupted-game horror; unsettling because it looks like a bug |

### Non-release builds

These shipped as beta or alpha because no stable 1.21.1 build exists.
They are the first place to look when something breaks.

| Mod | Version | Channel |
|---|---|---|
| `cc-tweaked` | `1.120.0` | alpha |
| `frostiful` | `2.3.3+1.21.1-neoforge` | alpha |
| `gd656killicon` | `1.1.0.020-1.21.1-neoforge` | alpha |
| `scorchful` | `0.15.2+1.21.1-neoforge` | alpha |
| `thermoo` | `4.8.1-neoforge` | alpha |
| `accessories` | `1.1.0-beta.53+1.21.1` | beta |
| `accessories-compat-layer` | `0.1.12` | beta |
| `ars-energistique` | `2.1.1-beta` | beta |
| `ars-structurize` | `1.1.3` | beta |
| `corpse` | `neoforge-1.21.1-1.1.13` | beta |
| `create-railways-navigator` | `1.21.1-beta-0.9.1-C6` | beta |
| `crimson_curse` | `1.4.3.1+mod` | beta |
| `dragonlib` | `1.21.1-beta-3.0.28` | beta |
| `elysium-api` | `1.21.1-2.0.0-BETA.6` | beta |
| `geore` | `6.2.3` | beta |
| `glitchcore` | `2.1.0.2` | beta |
| `immersive-casting-for-ars-nouveau` | `0.1.3` | beta |
| `in-control` | `1.21-10.2.6` | beta |
| `jadens-nether-expansion` | `2.4.0-BETA.7` | beta |
| `l2library` | `3.0.8` | beta |
| `lets-do-vinery` | `1.5.3` | beta |
| `make_bubbles_pop` | `0.4.0-beta.1-neoforge` | beta |
| `owo-lib` | `0.12.15.5-beta.1+1.21` | beta |
| `playeranimator` | `2.0.4+1.21.1-forge` | beta |
| `radium` | `0.13.1` | beta |
| `rrls` | `5.0.11+mc1.21.1-forge` | beta |
| `sound-physics-remastered` | `neoforge-1.21.1-1.4.10` | beta |
| `terrablender` | `4.1.0.8` | beta |

---

## 4. Cut to fit the budget

Folding in the 53 real dependencies pushed the list past 400, so these
went. Cuts are **data, not history**: delete the entry from `CUTS` in
`tools/trim_to_budget.py` and re-run to bring one back.

| Mod | Reason |
|---|---|
| `boy-and-the-bath` | Novelty entity, thin next to Cryptid and The Skinwalker Hunt. |
| `create-contraption-terminals` | Only meaningful with Tom's Simple Storage, which is cut. |
| `create-goggles` | Marginal overlay tweak. |
| `create-mechanical-extruder` | Single-purpose block generation; also drags in its own library. |
| `create-pressure-gauges` | Narrow readout addon; Create's own goggles cover the need. |
| `create-radiologistics` | Wireless logistics duplicates AE2, which is already in. |
| `cyberpunk-2077-guns-for-vics-point-blank` | Off-theme content pack; a cyberpunk arsenal does not fit an industrial-magic-horror world. |
| `dropthemeat` | Butchery already covers mob harvesting. |
| `elite-x-quality-guns` | TaCZ content pack - content breadth we do not need on top of four frameworks. |
| `epic-fight` | Conflicts with better-combat; the two are alternatives. Better Combat wins on compatibility across 400 mods. |
| `exposure` | Second camera mod; Camerapture covers photography. |
| `face-of-horror` | Overlaps The Knocker and Distant Friends; weakest of the watchers. |
| `functional-storage` | Second drawer mod alongside Storage Drawers. |
| `happiness-is-a-warm-gun` | Redundant once Superb Warfare, Vic's Point Blank, TaCZ and Create: Gunsmithing are in. |
| `hollowsteve` | Third boss-stalker; Obsessed and Kenny already cover escalating stalkers. |
| `horror-faces` | Same niche as face-of-horror. |
| `immersive-melodies` | Instrument mod competing for attention with proximity voice chat. |
| `iron-furnaces` | Early-game smelting tiers that Create obsoletes within an hour. |
| `milky-way` | A milking cooldown is not worth a mod slot plus a library dependency. |
| `mushroom-quest` | Small foraging mod already covered by the Farmer's Delight family. |
| `ntgl` | Gun animation library with no remaining dependent after the framework trim. |
| `rubidium-extra` | Pulls in Embeddium, which competes with Sodium rather than complementing it. Embeddium stays documented as the fallback renderer, not installed. |
| `scorched-guns-neoforged` | Fourth overlapping gun framework; community port with the smallest user base of the four. |
| `selfexpression` | Cosmetic clothing; pure flavour. |
| `simple-hats` | Cosmetic hats; pure flavour. |
| `simple-radio` | Long-range voice duplicates Simple Voice Chat's group channels. |
| `sleepless-datapack` | Sleep punishment collides with Comforts and with four players on different schedules. |
| `spooky-doors` | Gimmick that fires constantly and would wear out within a week. |
| `toms-storage` | Third storage network alongside AE2 and Sophisticated Storage. |
| `warlerys-dark-blood` | Overlaps Enhanced Celestials' blood moons and no_moon.jar's escalation. |

Two of those are **correctness**, not budget, and should not be restored
casually: `epic-fight` conflicts with `better-combat`, and `rubidium-extra`
pulls in Embeddium, which competes with Sodium rather than complementing it.

