# Mod Triage — 2026-08-01

Three audits, every one of the 398 jars opened and its registered content counted.
Produced because Ethan said the pack "feels incredibly unstable" at 400 mods and
asked to cut at least 200.

## The headline number

| | count | |
|---|---|---|
| **MANDATORY** | 115 | but **81 are libraries**, mandatory only because a content mod requires them |
| **OPTIONAL** | 256 | works, would be noticed, not needed |
| **BLOAT** | 27 | contributes nothing, or loses a duplicated verb |

**So the pack's actual chosen core is ~34 content mods.** Everything else is
either a consequence of those 34 (the libraries) or a choice made 256 times.

That is the argument for rebuilding rather than subtracting: cutting 200 by hand
is 200 decisions, and roughly 120 of them are consequences of the other 80.

## The 27 that contribute nothing — free to cut, no judgment needed

### Orphaned libraries (0 dependents anywhere, their dependents already cut)
`aces-spell-utils` · `elysium-api` · `azurelib` · `collective` · `konkrete` ·
`jamlib` · `library-ferret` · `runiclib`

### Loads, contributes nothing
| mod | evidence |
|---|---|
| `skills` (Puffish) | **no skill tree exists** — zero authored categories in any jar, datapack or config. The screen is blank. |
| `summoningrituals` | **zero recipes.** The altar is uncraftable AND does nothing when powered. |
| `horror-messages` | lang file has **0 keys**; Server-Side Horror owns the verb with a configurable surface |
| `shadow-of-the-soul` | **2 lang keys total**; the advertised "Fear Level system" has no code footprint |
| `esf` (Entity Sound Features) | remaps sounds from ESF resource packs; **the resourcepacks folder is empty** |
| `chunks-fade-in` | `mod-enabled = false` — installed and switched off |
| `diligentstalker` | all 5 recipes disabled by our own datapack, and **no loot path was ever built** |

### Loses a duplicated verb
| mod | loses to |
|---|---|
| `craftable-gunpowder-balanced` | makes the deliberately-wired gunpowder ore economy pointless — infinite gunpowder from diorite |
| `abandoned-watchtowers` | Explorify ships watchtowers at the **identical 48/24** in the same biomes |
| `crimson_curse` | Spore owns spreading-infection with 96 entities vs its 0 registered objects |
| `fancy-toasts` | Advancement Plaques wins the toast |
| `whispering-spirits` | Server-Side Horror owns ambient dread |
| `another-furniture` | modern styling against a preindustrial ruling, 3rd furniture mod |
| `immersive-furniture` | **1 block** in the most over-served verb in the pack |
| `thaumon` | themed after a mod that isn't installed |
| `ars-technic` | 3 registered objects; also bought by mistake — its modid is `arstechnic`, the dep everything wants is `ars_technica` |
| `ars-polymorphia` | zero content, one UI hook |
| `critters-and-companions` | 4th small-animal mod, direct name duplicates |
| `lets-do-wildernature` | duplicates hunting fauna AND strips vanilla livestock from 5 biome families |

## ⚠️ The finding that outranks the triage

**Our own In Control rule is silencing four of the six stalkers it was written to
protect**, plus a second tier nobody priced.

The rule denies all `hostile` spawns at y≥40. Verified per-mod delivery paths:

| survives | banned from the surface |
|---|---|
| the_knocker, the_obsessed, serversidehorror (event-driven) · revervox (underground by design) | **skinwalker_hunt** (w1) · **distantfriends** (w20) · **whispering_spirits** (w20) · **weeping_angels** (MONSTER, w8) |

They are not deleted — they relocate to y0–39 and compete for a 40-mob cap
against Born in Chaos's 45 spawn entries at weights up to 30. Underground, "it
watches you from across a field" has no meaning. The concept is gone.

Also degraded and never flagged: **creeper-overhaul** (all 16 biome variants
cave-only, and it removes the vanilla creeper), **enderman-overhaul** (18
variants cave-only), **zombie-awareness** (its stated purpose is *ordinary
nights*), **enhanced-celestials** (a blood moon's payoff is a surface swarm that
cannot happen).

The fix is an exemption rule above rule 1, with IDs harvested from the jars:
`the_skinwalker_hunt:skinwalker`, `:chupacabra`, `:cursed_villager`, `:alien`,
`distantfriends:friend`, `weeping_angels:weeping_angel`,
`whispering_spirits:whispering_spirit`.

## Two mods named in the design docs are not installed at all

`cosy-critters` and `mimicked`. `06-BURIED-TECH.md` names cosy-critters as one of
three mods answering "a peaceful surface empties the world."

## Open questions worth one in-game minute each

1. **Do structure spawners get caught by the deny rule?** If yes, every surface
   dungeon above y40 — Battle Towers, Dungeons and Taverns, When Dungeons Arise,
   Philips Ruins — is an empty building. Stand at a Battle Tower with a spawner
   in render range.
2. `rottencreatures` registers spawns in code; unknown whether In Control sees it.
3. `inventory-profiles-next` vs `mouse-tweaks` overlap; runtime winner unknown.
4. `servercore` wrote no config despite a completed boot — is it applying
   anything?
