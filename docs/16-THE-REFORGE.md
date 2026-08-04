# The Reforge — cut, add, regenerate

**Status: PLAN. Nothing here is executed yet.**
Written 2026-08-03 after Ethan's ruling that the pack is not fun because there is
nothing to work towards. The cause was measured, not guessed — see §0.

Cadence: **one chunk, then checkpoint.** Every chunk below has a verify step and
a rollback. Nothing proceeds on a chunk that has not been verified.

---

## 0. Why — the measured cause

Not a vibe. Three findings, all instrumented:

1. **The reward is unobtainable.** TaCZ guns are loot-only (172 gun-smith recipes,
   zero of which make a gun) and gun loot exists in exactly three injectors —
   stronghold corridor/crossing, abandoned mineshaft, ancient city. Measured in
   the live world: **zero sculk in 118 chunks** (no ancient city near anyone),
   mineshafts at `frequency 0.004`, strongholds three per world. Expected guns
   found after 43 in-game days: **≈ 0.**
2. **The cost was built without the payoff.** D3 (gunpowder gated to −128…−64) is
   live. D2 (the Vaults) and D4 (the invasion) never were. Players can mine
   ammunition for a weapon they will never find.
3. **Scarcity is fictional.** Mystical Agriculture grows every resource from
   seeds on the surface; `inferium_ore` and `prosperity_ore` measured into the
   top five most common blocks at y0–63. Nothing at the bottom of the world can
   compete with a farm.

Everything below follows from those three.

---

## 1. Rulings (Ethan, 2026-08-03)

| | ruling |
|---|---|
| Tier 1 — dismantles the loop | **CUT** |
| Tier 2 — surface horror | **RELOCATE** underground, do not cut |
| Tier 3 — competing dimensions | **CUT.** Dimensions do not suit an overworld-only group. Spend the budget making the **Nether** genuinely hellish instead |
| Tier 4 — Ars sprawl | **CUT** the isolated ones, **KEEP** the Create connectors |
| Surface threat | natural predators — dinosaurs and wildlife. Fair danger, not undead or casters |
| Worldgen | bigger mountains, deeper caves. Regen accepted |
| Structures | rare above, plentiful below |
| Races | ⟡ pending — see §7 |

New player **j0nesyboi223** — already whitelisted (Lehykt, Rehykt, j0nesyboi223).

---

## 2. Chunk A — freeze and back up

No changes. Gate for everything else.

- Stop the server; confirm `java processes : 0`.
- Full world backup (`world.prereforge-<date>`), plus `config/` and `pack/`.
- Record the current mod count and boot time as the comparison baseline.

**Verify:** backup exists and is non-empty; `git status` clean.
**Rollback:** n/a.

---

## 3. Chunk B — the cut (13 mods)

**All 13 verified SAFE — zero required-by blockers, computed from the jars.**

### Tier 1 — dismantles the loop
| mod | why it goes |
|---|---|
| `mysticalagriculture` | grows every resource on the surface, forever. The mechanical inverse of descending for scarce material. Already the dominant shallow ore. |
| `waystones` | deletes **extraction**. Prepare → descend → *get out* is half the expedition; teleporting home from −128 removes the only way a run can go wrong short of dying. |
| `veinminer` + `veinminer_enchantment` | shortens time-at-risk underground, which is the tension being built. |

### Tier 3 — competing dimensions
| mod | why it goes |
|---|---|
| `undergarden` | a **second** underworld. Its manifest entry reads "thematically it IS the lost world beneath" — true when written, and now the problem. Going there is not descending Veldora's ladder. |
| `cataclysm_dimension` | extra dimension content, minor tier. |
| `occultism` | own dimension and parallel progression. |

### Tier 4 — isolated Ars addons
`ars_additions` · `ars_controle` · `ars_artillery` · `ars_structurize` ·
`ars_unification` · `reliquified_ars_nouveau`

**KEEP:** `ars_nouveau` (required by 7), `ars_creo` and `createarscompact` — the
only two that actually touch Create. `ars_unification` is unifying recipes for
mods that are not installed (actuallyadditions, ae2, ars_technica).

### ⚠️ The orphan sweep — this is the step that always gets skipped
Cutting a mod orphans its config, and configs in this pack **fail closed and
quiet**. ServerCore once aborted at the first unknown enum and silently discarded
every setting after it, including the mobcap. After the cut, grep `config/` for
every cut modId and remove what names them — **in the same commit**.
29 dead `cristellib/` dirs already exist from earlier cuts; clean those too.

**Verify:** `check_deps.py` exits 0 · server boots · no new ERROR classes in the
log versus the Chunk A baseline · `logq.py errors` diff is clean.
**Rollback:** `git revert`, restore `config/` from the Chunk A backup.

---

## 4. Chunk C — the additions

Resolved and confirmed available for 1.21.1 NeoForge:

| mod | role | status |
|---|---|---|
| `jurassic-reborn` (169k) | the fair surface threat | release |
| `shineals-prehistoric-expansion` (78k) | more prehistoric fauna | release |
| `yungs-better-nether-fortresses` (20.5M) | the Nether as a real place. YungsApi already present — no new deps | release |
| `infernal-expansion-redux` | Nether mobs and biomes | 0.3.12 |
| `formations-nether` (5.6M) | Nether terrain drama | release |
| `tectonic` | bigger mountains, deeper caves | ⚠️ see §5 |
| `terralith` | terrain and biome variety | optional |

**Do NOT add** `fantasy-races` — 6.4k downloads and **alpha**. See §7.

**Verify:** `check_deps.py` exits 0 · boot · every new mod appears in the log with
no errors · dinosaurs actually spawn (`genq.py` cannot see mobs; use `/ctrl debug`
or fly a fresh chunk).
**Rollback:** remove from `modlist.json`, regenerate, reinstall.

---

## 5. Chunk D — worldgen (pre-regen, config only)

### D1. ✅ DONE + VERIFIED — Tectonic merged with the depth floor

Took Tectonic's noise_settings (its router, splines and surface rule) and
re-applied `min_y: -128`, `height: 448`. Tectonic writes 26 files into the
`minecraft:` namespace, overriding vanilla density functions in place, so the
copied router resolves to Tectonic's terrain automatically.

**Three things were needed, and the third is the one that hides:**

1. Merge the settings (done).
2. **Reorder the datapacks.** Tectonic registers its pack LAST — position 19 of
   20, after every `file/` world pack — so it was overriding `mcserver_depth`,
   not the other way round. The assumption that world datapacks always load
   after mod datapacks is FALSE when a mod appends itself explicitly. Fixed with
   `/datapack disable` then `/datapack enable "file/mcserver_depth" after
   "tectonic"` (and the two packs that follow it).
3. **RESTART.** `/datapack enable` reloads recipes, loot and tags but does NOT
   rebuild the chunk generator — worldgen registries are built once at world
   load. Chunks generated between the reorder and the restart still came out
   with Tectonic's floor. This is exactly the "config is right and the world
   still came out wrong" case genq exists to catch.

*Verified:* bedrock appears at −128…−113 **only**, and solid terrain now reaches
y208–223 where the pre-Tectonic sample was 100% air above y143. Mountains roughly
+75 blocks taller.

🚨 **THIS MUST BE REDONE AFTER THE REGEN.** A fresh world rebuilds the pack order
from scratch and will put the `file/` packs before `tectonic` again. The regen
procedure has to re-issue the reorder and then restart, or the whole depth floor
silently reverts to −64.

### D1-old. ⚠️ Tectonic vs the depth floor — the original analysis
**Tectonic overrides `minecraft:overworld` noise settings. So does
`mcserver_depth`.** Stacking both means whichever loads last wins, silently.

Resolution: take Tectonic's terrain/noise router and re-apply `min_y: -128`,
`height: 448`. The extended floor is now load-bearing — the lore makes the bottom
of the world the base of the old ones' ladder — so it stays.

*Verify:* boot, then `genq.py block bedrock` on fresh chunks. Bedrock must appear
**only** at −128…−113, exactly as it does today. If it appears at −64, Tectonic won.

### D2. Structures — rare above, plentiful below
Structure sets declare their generation **step** in the jar
(`surface_structures` vs `underground_structures`). Split on that and scale in
opposite directions rather than the blanket ×1.5 already applied:

- surface sets → spacing ×2 (rarer; a structure should be a landmark)
- underground sets → spacing ÷1.5 (denser; the deep should be crowded with the
  old ones' work)

Battle Towers stays at the already-verified 72/48.

*Verify:* `/locate` sampling from scattered points, same method that confirmed
452 blocks mean for Battle Towers.

### D3. Spawns — the fair surface, the unfair deep
- **Surface:** natural predators only. Dinosaurs and wildlife are `Animal`-derived
  in most cases, so In Control's `hostile` deny (which is `instanceof Enemy`) may
  not even see them — **confirm per mob before relying on it.**
- **Deep:** the relocated Tier 2 roster — Born in Chaos, Rotten Creatures,
  Mimicked, and the undead half of Legendary Monsters — layered by depth per the
  lore: shallow = nearly whole, deep = nothing recognisable left.

*Verify:* `/ctrl debug` for one session, then off. It writes ~19k lines an hour.

### D4. Loot — make the reward reachable
Retarget the three gun injectors off stronghold/mineshaft/ancient-city onto chest
tables that actually generate underground, gated with `minecraft:location_check`
on Y so modern weapons still only appear below the Deep Works line. Lootr is
installed, so each player rolls their own.

*Verify:* `/loot` a target table, or place a test chest and open it.

---

## 6. Chunk E — the regen, then verify

Everything in Chunks C–D affects **newly generated chunks only**, which is why
the regen is the pivot rather than the start.

1. Back up the old world under a dated name; keep it.
2. Regenerate.
3. **`stage_datapacks.py`** — datapacks live inside the world and a regen loses
   them. The old hand-typed five-name list silently dropped newer packs; use the
   script.
4. Chunky-pregen a spawn radius so first join is not a stutter-fest.
5. Measure with `genq.py`: ore by depth, `air` for cave volume, `block spawner`
   and `block rail` for structure presence. Compare to the numbers in §0.
6. Rebuild the client instance zip; push, because **packwiz pulls `pack.toml`
   from GitHub `main` and nothing reaches players until the push.**

---

## 7. Still needs a decision

1. **Races.** The only 1.21.1 NeoForge option is a 6.4k-download alpha. The
   **More RPG Classes** family is fully supported (Archers 1.4M, Elemental
   Wizards 568k, Berserker 446k, Witcher 444k, Forcemaster 423k) plus a skill
   tree, and three players taking three classes gives the distinct-identity thing
   races were wanted for. Its skill-tree mod is **beta** — needs a dependency
   check before committing. **In or out?**
2. **Where the Nether sits in the lore.** Proposal: the Nether is not a
   destination, it is **the wound** — where the fire went when the reaching
   shattered the vault. That makes "genuinely hellish" a fact about Veldora
   rather than a difficulty setting, and gives a reason certain materials exist
   only there.
3. **Mystical Agriculture is a clean cut, but the alternative is better.**
   Gating its higher seed tiers behind deep-only materials turns it from a bypass
   into the sink that eats salvage — which is exactly what the design doc asks
   for ("the surface industry funds expeditions; expeditions bring back what the
   industry consumes"). Ruling was CUT; flagging once because it is reversible
   and the repurposed version serves both goals.
4. **D2 Vaults and D4 invasions** remain unbuilt. This plan makes the world worth
   descending into; those two make it worth *returning* from. They should follow
   immediately after the regen, not much later.

---

## 8. Order

```
A freeze/backup ──► B cut ──► C add ──► D worldgen config ──► E regen + verify
                     │          │
                     └── both gated on check_deps + a clean boot ──┘
```

B and C could technically merge into one boot, and should not: a failed boot with
19 changes has 19 suspects. The cut is the higher-risk half because of orphaned
configs, so it boots alone.


---

## 11. 🚨 GATE BOTH SIDES — learned the hard way, 2026-08-03

`check_deps.py` was run against `C:/MCServer/instance/mods` for `side=SERVER`
and reported a clean set. The server booted in 3.4s. **The client refused to
start:**

```
Mod ID: 'jei', Requested by: 'jurassicreborn',
Expected range: '[15,)', Actual version: '[MISSING]'
```

Two independent mistakes, and both are worth keeping:

1. **`mandatory` is the LEGACY FORGE key.** jurassicreborn's mods.toml says
   `mandatory = false`, which reads as "optional" and is ignored by NeoForge.
   NeoForge reads **`type`**, and an **absent `type` defaults to REQUIRED** —
   already documented in this repo's CLAUDE.md. The first scan flagged it
   correctly and it was talked out of that reading. Trust the documented rule
   over a familiar-looking key.

2. **The gate only covered one side.** The dependency is declared
   `side = "CLIENT"`, so a `side=SERVER` check cannot see it *by design*, and
   the server jars folder does not even contain the 54 client-only mods. A pack
   whose client set is 60 mods larger than its server set needs both gates.

**The procedure, both sides, every time:**

```
python tools/install_mods.py --side server --dest C:/MCServer/instance/mods --prune
python tools/check_deps.py C:/MCServer/instance/mods

python tools/install_mods.py --side client --dest C:/MCServer/clientmods
python tools/check_deps.py C:/MCServer/clientmods --side=CLIENT
```

⚠️ Argument order matters: **path first, then `--side=`**. Passing the flag
first makes it the path and prints "no jars in --side=CLIENT", which looks like
an empty result rather than a usage error.

`C:/MCServer/clientmods` is worth keeping around — `install_mods` skips by hash,
so re-gating after a pack change costs only the new files.

---

## 12. Queued — applies on the next restart

Worldgen and several configs are read once at world load, so these are staged on
disk and inert until the server cycles. Ethan asked for no restart mid-session.

| change | file | status |
|---|---|---|
| Jurassic Park's 8 structures disabled | `cristellib/jurassicreborn/toggle_structure_config.json5` | staged |
| Pillager outposts 32→72 spacing, freq 0.2→0.12 | `vanilla_structures/placement_structure_config.json5` | staged |
| Revervox ambient voice far rarer | `revervox_mod-server.toml` | staged, **direction unconfirmed** |

### ⚠️ Revervox — verify the direction on the first session after the restart
Ethan: the random voice playback fires "every 30 sec", wants it rare.

`CommonEventBus` rolls `nextInt` against `FAKE_BAT_EVENT_CHANCE` and
`FAKE_REVERVOX_BEHIND_EVENT_CHANCE` on a `BatEventTime` timer — so the ambient
scares are *fake* events, not real mob spawns, and `batEventChance` is the knob.

Set `batEventChance` 1.0 → **0.15** and `revervoxBatSpawnChance` 5 → **60**.

The mod ships no descriptive comments, only Default/Range, and the consumer does
not make the polarity obvious from the constant pool alone. `batEventChance` is a
double on 0.1–20.0 with a 1.0 default, which reads as a rate multiplier where
lower is rarer; `revervoxBatSpawnChance` is an int on 2–500 with a 5 default,
which reads as a 1-in-N roll where higher is rarer. **Both are assumptions.**

This is the same trap as `bettermineshafts`, where halving `spacing` made
mineshafts RARER because density actually lived in `frequency`. The effect here
is loud and immediate, so one session settles it: if the voices get MORE
frequent, the polarity is inverted — revert from
`revervox_mod-server.toml.prequeue.bak` and invert both.

Nuclear option if it stays annoying: `enableBatEvent = false`.
