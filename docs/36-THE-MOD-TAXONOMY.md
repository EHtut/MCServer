# The mod taxonomy — every path is its own modpack

*Ethan, 2026-08-14: **"these mods for the other class hold a specific power in that
they have progression and a mod they are based around... So no, lets define it like
this. Each path should essentially be it's own modpack of content. We can add new
ones."*** Regenerate with `tools/classify_mods.py`.

---

## 1. 🚨 The principle

> ### A path is not a theme. A path is a MOD with a progression tree.
>
> Blade is swords and armour. Salvage is guns. Forge is Create. Art is magic. Crown
> is minions. Wall is building and resources. **If a path is not anchored to a mod
> somebody could spend a month inside, it is not a path — it is a colour.**

This is why Wall failed and why my first refresh attempt failed with it. Waystones is
furniture. Camping is untrackable side content. Neither is a **tech tree**, and a
path without one has nothing to *do* on night forty.

## 2. The audit — 290 shipped mods, classified

| bucket | count |
|---|---|
| **forge** — Create | **27** |
| **art** — magic | **14** |
| **wall** — building/resource | **14** |
| **blade** — combat | **7** |
| **salvage** — guns | **5** |
| **crown** — minions | **4** |
| worldgen / structures | 39 |
| visuals / audio | 41 |
| QoL / UI | 42 |
| mobs / enemies | 25 |
| performance / server | 32 |
| libraries | 40 |

### 🚨 The headline: the paths are not remotely equal

**71 mods carry the six paths, and Forge holds 27 of them — 38%.** Crown has four.
Salvage has one real mod plus a bow addon and an ore.

> **Forge is a modpack. Salvage is a mod. Crown is a mod and a half.**

That is the honest reason the paths feel uneven, and it is not a fiction problem —
**the path system was designed as fiction and never once audited as content.** Every
patron got equal writing; nobody checked whether they got equal *game*.

### The class rosters as they stand

* **forge** (27) — `create` + 25 addons + `numismatics`. A complete progression game.
* **art** (14) — `ars-nouveau`, `ars-creo`, `ars-lumos`, `arsdelight`, `spell-engine`,
  `spell-power`, `wizards`, `runes`, four RPG-class mods.
* **wall** (14) — but **almost all of it is decoration**: `chipped`, `framedblocks`,
  `macaws-*`, `handcrafted`, `medieval-buildings`, `interiors`, `bellsandwhistles`.
  Blocks are not progression. **The only two with a tech tree are `theurgy` (1,777
  recipes across 11 alchemical stages) and `storagedrawers`.**
* **blade** (7) — `epic-knights`, `better-combat`, `combat-roll`, `cut-through`, and
  three animation libraries. ⚠️ **Mostly presentation, not progression.**
* **salvage** (5) — `tacz` is the whole path. The rest is archery and an ore.
* **crown** (4) — `goety` + `goety-cataclysm`, `automaticons`, `guard-villagers`.

⚠️ **Blade and Salvage are thinner than they look.** Blade's seven are largely
*animation* mods, and Salvage's five are one gun mod. Both need the same treatment
Wall is getting.

## 3. World generation — Ethan's two asks

> *"I want bigger biomes and more structures to find that are lore accurate not
> whatever those cobblestone pillars are."*

### ✅ Found the cobblestone pillars: **Explorify**

`explorify:ruins` and `explorify:guide_post_cold` / `guide_post_warm` — a signpost on
a pillar. Placement is `frequency: 0.8, spacing: 48, separation: 24`, which is
**extremely dense**: a roughly 80% chance in every 48-chunk cell.

The mod's stated design goal is to look *vanilla*. That is precisely the problem —
it is generic by intention, and R8 (*everything must be of Veldora*) rules it out.
**Recommend cutting it**, or at minimum removing `ruins` and the guide posts. It is
also crowding out the structure mods that ARE lore-accurate.

### The lore-accurate structures already installed and under-used

`grim-and-bleak` (gothic ruins, ruined chapel, portal ruins) · `valarian-conquest` ·
`when-dungeons-arise` + `seven-seas` · `structory` · `ct-overhaul-village` ·
`medieval-buildings` · `medieval-siege-machines` · `battle-towers` ·
`abandoned-watchtowers` · `hopo-better-ruined-portals` · `yungs-better-*`
(mineshafts, strongholds, nether fortresses) · `galosphere` (forgotten ruins) ·
`cataclysm` (ruined citadel, cursed pyramid, sunken city).

**The pack is not short of good structures. It is short of rarity** — the generic
ones are dense enough to be what you actually meet.

### Bigger biomes

`tectonic`, `biolith` and `terrablender` are all installed. Biome *size* is a config
value, not a mod addition — **this is a tuning job, not a shopping job.** Needs a
measured pass: change the value, regenerate a test seed, walk it.

⚠️ **Config does not ship through packwiz** (finding F37). A worldgen config change
reaches only players who re-import the instance zip. Plan the delivery before making
the change.

## 4. What this changes

1. **Wall gets a real anchor** — see `35-WALL-REFRESH.md`. MineColonies.
2. **Blade and Salvage need the same audit.** Seven animation mods and one gun mod
   are not modpacks.
3. **Crown at four mods** is the thinnest and has no plan.
4. **Explorify goes**, and the good structures get room.
5. **Biome size** is a config pass with a delivery problem attached.

## 5. Method

`tools/classify_mods.py` buckets every shipped `pack/mods/*.pw.toml` by regex and
writes `tools/mod_taxonomy.json`. It is deliberately re-runnable — **the counts above
are evidence, and evidence goes stale.** Re-run it after any mod change.

Judgment calls worth knowing: **`theurgy` is filed under Wall, not Art.** Its eleven
stages (calcination, distillation, fermentation, reformation…) are a *material*
processing chain, far closer to Create than to spellcasting.
