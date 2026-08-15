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

### 🚨 REFINED BY A1 — every path can do every verb, in its own idiom

> Ethan, 2026-08-14: *"Each of the mods should be in the same vein as the other paths.
> So forge can fight, cast, have guns, and build minions... we don't necessarily need
> a set amount of core but just keep the theming."*

**Fight, cast, shoot, build, command — no path is locked out of a playstyle, each
expresses it differently.** Forge does not borrow Blade's sword; he brings a cannon.

This kills two of my instincts at once. **There is no target mod count** — the test is
whether a mod is in that patron's voice, not how many they have. And **a mod is not
misfiled just because its category sits elsewhere**: `create-big-cannons` is 213
weapon items inside the building path and belongs exactly where it is, because cannons
are how Forge shoots. Reading mods as belonging to *categories* rather than to
*characters* would have hollowed out five paths to tidy one taxonomy.

**The gaps in that matrix are GROW verdicts, not cuts.** See `36` §A1 VERDICTS.

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

### 🚨 THE WORLDGEN CENSUS — measured 2026-08-14 (`tools/worldgen_census.py`)

Ethan asked whether three mods queued for cutting generate structures. **They do not
— zero structures, zero features, zero biomes between them.** But asking the question
produced the number that matters:

> ## 51 shipped mods add worldgen.
> ## 629 structures · 868 biomes · 6,361 building pieces.

**This pack is not short of worldgen. It is drowning in it.** The problem was never
supply — it is that the generic content is dense enough to be what you actually meet,
so 629 structures reduce in practice to the handful placed most often.

| mod | structures | biomes | nbt pieces |
|---|---|---|---|
| `ct-overhaul-village` | **106** | 0 | **2,118** |
| `when-dungeons-arise` | 53 | 52 | 877 |
| `goety` | 44 | 84 | 251 |
| `borninchaos` | 31 | 1 | 27 |
| `l_enders-cataclysm` | 30 | 12 | 188 |
| **`create-let-the-adventure-begin`** | **30** | 4 | **440** |
| `better-archeology` | 27 | 31 | 52 |
| `legendary-monsters` | 25 | 13 | 71 |
| **`oh-the-biomes-weve-gone`** | 23 | **153** | 576 |
| `explorify` | 23 | 23 | 330 |

**Three findings that change earlier decisions:**

1. ⚠️ **`create-let-the-adventure-begin` is a MAJOR structure mod** — 30 structures
   and 440 pieces, more than Cataclysm. A1 called it "misfiled, move to worldgen" as
   though it were minor bookkeeping. It is not: it is one of the ten largest worldgen
   contributors in the pack, hiding in the Create bucket. **Keep and reclassify.**
2. 🚨 **`oh-the-biomes-weve-gone` already ships 153 biomes**, and the pack總 total is
   **868**. Adding **Regions Unexplored** (70+ more) on top would be the opposite of
   the fix — *"bigger biomes"* is a **size** problem, not a **variety** problem, and
   more variety makes biomes smaller. **Re-examine the wishlist entry before adding.**
3. `explorify` contributes 23 structures and 330 pieces, so cutting it subtracts real
   volume — but they are the generic ones, which is exactly the point. The census
   makes the trade explicit rather than hidden.

**Goety carries 44 structures and 84 biomes**, so the Crown→Wall merge hands Wall a
substantial worldgen inheritance she was never credited with.

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

---

# 6. The wishlist — Ethan's additions, 2026-08-14

> *"lets also add actions and stuff, regions unexplored, atmospheric, tectonic,
> stratospheric expansion, alhelsia structures, the graveyard, towers of the wild,
> mariam's soulslike weaponry, dark waters, mutant more, and mutant monsters."*

**Verification status. Nothing is added until each is checked** — this pack has been
burned once already by a biome mod (F37: four biome ResourceKeys declared into the
vanilla registry set killed the entire GUI layer, and config could not be shipped to
fix it).

| mod | status | notes |
|---|---|---|
| **Regions Unexplored** | ✅ NeoForge 1.21.1 (v0.5.9 / 0.6-beta3) | 70+ biomes. Directly serves "bigger biomes" |
| **Mutant Monsters** | ✅ NeoForge 1.21.1, **already in cache** | v21.1.1. Not currently shipped |
| **Tectonic** | ✅ **already shipped** | the biome-size lever lives here |
| **Marium's Soulslike Weaponry** | ⚠️ 1.21.1 exists, **Fabric build seen** | needs a NeoForge build confirmed. Also ⚠️ collides with Blade's weapon space |
| **Mutant More** | ⚠️ unverified | historically Fabric-leaning |
| **Stratospheric Expansion** | ⚠️ unverified | |
| **Atmospheric** | ⚠️ unverified | a Forge-era biome mod; check the loader |
| **Alhelsia Structures** | ⚠️ unverified | name may be off; confirm the exact mod |
| **The Graveyard** | ⚠️ unverified | |
| **Towers of the Wild** | ⚠️ unverified | ⚠️ `structory_towers` + `abandoned-watchtowers` + `battle-towers` already ship — check for tower saturation before adding a fourth |
| **Dark Waters** | ⚠️ unverified | |
| **Actions and Stuff** | ⚠️ **this is a RESOURCE PACK, not a mod** | it does not ship through packwiz's mod channel; needs the client-pack route |

## 🚨 Two standing cautions before any of these land

1. **Biome mods are the highest-risk category in this pack.** F37 is the precedent
   and it took down the whole GUI. Add biome mods **one at a time**, boot, and check.
2. **Config does not ship through packwiz.** Anything solved by config reaches only
   players who re-import the instance zip.

---

# 7. Bosses — the champions are ABOVE, the hordes are BELOW

> Ethan: *"I want to add more bossfights and bring them into the overworld in such a
> way that the hordes stay below but above are the real champions."*

## This is already the lore, and it inverts the usual arrangement

Most packs put the bosses at the bottom. Ethan's instinct puts them on the surface,
and `15-LORE.md` §1 already argues for exactly that:

> *"Veldora is not a ruined world. It is a living one, and it is **loud**, and most of
> what can kill you here has simply always been able to."*

So the rule writes itself:

> ### ABOVE — Veldora's own great beasts. Singular, named, ancient, and they were always there.
> ### BELOW — the leak. Numerous, wrong, and increasingly less intact the deeper you go.

The deep is where the **stalkers** are — things that fell and broke. The surface is
where the world's *own* power lives. A champion on the surface is not a symptom of
anything; it is simply an old and enormous thing that has never needed a reason.

That also fixes a quiet problem: the depth tiers in `config/incontrol/spawner.json`
made the deep dangerous and left the surface **safe and boring** once you were geared.

## We are not short of bosses. We are short of PLACEMENT.

Already shipped: `l_enders-cataclysm` (Ignis, Leviathan, Harbinger, Ender Guardian,
Netherite Monstrosity, Scylla, Maledictus, Ancient Remnant) · `bosses-of-mass-destruction`
· `mowzies-mobs` · `iceandfire-ce` (dragons) · `legendary-monsters` ·
`shineals-prehistoric-expansion`. Plus `mutant-monsters` sitting in cache, unshipped.

**Same finding as the structures:** the content exists and is not being *met*. The
work is placement, rarity and signposting — not shopping.

⚠️ **Cataclysm's bosses are mostly summoned or structure-locked**, which is why
nobody has met one. Surfacing them means either seeding their structures more
generously or giving them overworld spawns — a measured change, not a config guess.

## Open

1. Does a surface champion **respect the path system**? A Blade walker meeting a
   dragon is on-path; a Wall walker meeting one is a mugging.
2. Are champions **persistent landmarks** (this valley has a thing in it) or roaming?
   Landmarks are better for a group that does not explore — they become destinations.
3. Do the patrons **react** to a champion kill? Blade certainly would.

---

# 8. THE STAGED MODPACK AUDIT — queued 2026-08-14

> Ethan: *"I also want to stage a complete audit with both you and me looking at each
> of the mods in their 'modpacks' to ensure the theming."*

**Both of us, together, one group per sitting.** I prepare, he judges.

## Why it is needed, stated plainly

**The taxonomy above is REGEX. It is a first pass, not a verdict.** It buckets by
filename, so it cannot tell a progression mod from a decoration mod, cannot see that
two mods do the same job, and cannot know whether anyone has ever used one. Every
number in §2 is a hypothesis. **The audit is where it becomes true.**

There is also a specific thing to catch. `07-THEME-AUDIT.md` audited 411 mods against
R1–R7 **before the first download** — against *rulings*, not against *paths*, because
paths did not exist yet. **No mod in this pack has ever been asked "which path do you
belong to, and do you carry your weight in it?"**

## The rubric — five questions per mod

1. **Does it belong to this path at all**, or did the regex put it here?
2. 🚨 **Progression or filler?** The new principle: a path is a mod with a tech tree.
   Decoration and convenience are *supporting content* — legitimate, but they must
   not be counted as the path's substance. Wall's 14 looked healthy until this
   question was asked.
3. **Does it break a ruling?** R1 period · R2 Create ceiling · R5 one system per verb
   · R6 kinetic storage · **R8 of Veldora** (proposed in `30`).
4. **Has anyone ever used it?** Dead weight is the cheapest thing to cut and the
   hardest to notice.
5. **Verdict: KEEP · CUT · MOVE (to another group) · GROW (the path needs more here).**

## The stages, in order

| # | group | count | why this order |
|---|---|---|---|
| **A1** | **forge** — Create | 27 | biggest, and 25 addons is where redundancy hides |
| **A2** | **wall** — building/resource **+ crown's goety** | ~18 | actively being redesigned; audit while it is open |
| **A3** | **art** — magic | 14 | four RPG-class mods look like R5 risk |
| **A4** | **blade + salvage** | 12 | small, and the verdict will be **GROW**, not cut |
| **A5** | **worldgen / structures** | 39 | the Explorify cut and the biome additions land here |
| **A6** | **mobs / enemies** | 25 | where *champions above, hordes below* gets built |
| **A7** | **visuals / audio + QoL** | 83 | lower stakes, faster, mostly keep |
| **A8** | **perf / server + libraries** | 72 | mechanical — hunt orphaned libraries whose parent was cut |

**A1 and A5 are the two that will change the pack most.**

## What I bring to each sitting

Not the CurseForge blurb — **what the mod actually adds, read out of the jar.** That
method is what found the Dark Warblade, whose drawback the mod author had already
written and no description mentioned. Per mod:

* what it registers — items, blocks, entities, recipe types, structures
* whether it has a **progression chain** (recipe types, research, tiers) or is flat
* **duplicate detection** — who else does this job
* period/theme risk against the rulings
* a recommendation, with the reasoning, for him to overrule

## Rules for the audit itself

* **A cut is a packwiz change and reaches players on relaunch. A config change does
  not** (F37). Sort verdicts by which channel can deliver them.
* **Cutting a mod can orphan its library and can break a datapack** — the
  `gen_pack.py` incident deleted a mod and resurrected two cut ones from a stale
  resolve cache. Re-run and diff the manifest after every batch.
* **Nothing is cut mid-audit.** Verdicts are collected per stage, applied in one
  reviewed batch, then booted.

---

# A1 — THE CREATE AUDIT
*Stage 1 of the staged modpack audit (`36` §8). **Forge's path: 27 mods.**
I bring what each mod actually registers, read out of the jar; Ethan judges.
**Nothing is cut in this document.** Verdicts collect, then apply in one batch.*

---

## The census

| slug | MB | items | blocks | recipes | notes |
|---|---|---|---|---|---|
| `create` | 18.2 | 775 | 643 | 1884 | the anchor |
| `create-steam-n-rails` | 11.6 | **1015** | 617 | 1075 | trains — the largest addon |
| `create-design-n-decor` | 6.0 | **846** | 846 | 1109 | decoration |
| `create-encased` | 3.0 | 721 | 751 | 266 | encased shafts/cogs |
| `create-framed` | 2.7 | 639 | 569 | 745 | framed glass |
| `create-deco` | 3.2 | 403 | 389 | 1719 | decoration |
| `create-bionics` | 4.8 | 227 | 0 | 20 | |
| `create-big-cannons` | 3.6 | 213 | 139 | 151 | ⚠️ weapons |
| `create-dreams-and-desires` | 1.2 | 120 | 85 | 213 | |
| `create-connected` | 6.5 | 106 | 109 | 276 | QoL + blocks |
| `create-misc-and-things` | 1.0 | 95 | 65 | 100 | |
| `create-bits-n-bobs` | 1.5 | 85 | 123 | 170 | |
| `create-stuff-additions` | 1.3 | 81 | 2 | 91 | |
| `create-storage-neo-forge` | 1.6 | 74 | 42 | 61 | |
| `create-dragons-plus` | 1.0 | 59 | 56 | 119 | Ice&Fire integration |
| `createaddition` | 1.6 | 46 | 23 | 152 | electricity |
| `copycats` | 1.7 | 45 | 46 | 68 | |
| `numismatics` | 0.7 | 45 | 6 | 37 | ⚠️ currency |
| `create-sound-of-steam` | 6.3 | 33 | 38 | 29 | |
| `create-enchantment-industry` | 1.2 | 30 | 19 | 43 | |
| `create-ars-nouveau` | 1.3 | 19 | 14 | 92 | compat bridge |
| `create-railways-navigator` | 2.0 | 9 | 9 | 9 | |
| `create-aeronautics` | 31.6 | **see below** | | | ⚠️ jarjar bundle |
| `create_oxidized` | 0.1 | 0 | 0 | 45 | recipes only |
| `create-let-the-adventure-begin` | 2.7 | 0 | 0 | 1 | ⚠️ ships structures |
| `create-compatible-storage` | 0.1 | 0 | 0 | 0 | compat shim |
| `createbetterfps` | 0.0 | 0 | 0 | 0 | ⚠️ a perf tweak |

## 🚨 Finding 1 — `create-aeronautics` is THREE mods, and one is a physics engine

31.6 MB that appeared to register nothing. It is a **jarjar bundle** — ten entries,
zero classes, with the real content nested inside `META-INF/jarjar/`:

| nested | items | blocks | lang | classes |
|---|---|---|---|---|
| `aeronautics` (25 MB) | 47 | 44 | 223 | 252 |
| `simulated` (6.2 MB) | 102 | 96 | 656 | **795** |
| `offroad` (0.8 MB) | 40 | 4 | 56 | 86 |

**`simulated` is a physics engine.** Create Aeronautics runs real rigid-body
simulation for airships, and it is the largest class count in the entire Create
group. That is a live performance commitment, not a decoration mod.

Directly relevant to the MineColonies decision: the overworld already sits at
**16.9 ms/tick with one player**, and this and a colony would be stacked on the same
budget. **Recommend a measured before/after rather than an opinion.**

⚠️ **Method correction: my scan was blind to jarjar and would have reported this mod
as empty.** Any "registers nothing" verdict in later stages must check for nesting
first. Three mods were nearly invisible to the audit that is supposed to see
everything.

## 🚨 Finding 2 — seven decoration mods, ~2,850 blocks

`create-design-n-decor` (846) · `create-encased` (751) · `create-framed` (569) ·
`create-deco` (389) · `create-bits-n-bobs` (123) · `create-connected` (109) ·
`copycats` (46).

**This is R5 — one system per verb — in its purest form.** They are not identical:
`encased` and `copycats` are functional (encasing shafts, copying textures onto
shapes), while `deco` and `design-n-decor` are largely palette. But no four-player
server needs seven block-variant mods, and every one of them is a permanent load on
JEI, the item registry and the atlas.

**This is the biggest decision in A1 and it is Ethan's**, because it is taste. My
read: keep `encased`, `copycats` and `framed` (all *functional*), and pick **one** of
`deco` / `design-n-decor` rather than both — they are the closest pair.

## Finding 3 — three mods are in the wrong bucket

| slug | belongs in | why |
|---|---|---|
| `createbetterfps` | **perf/server** | 0.0 MB, registers nothing, it is an FPS tweak |
| `create-let-the-adventure-begin` | **worldgen/structures** | registers no items; it ships `create_ltab` structures (`ruins`, `cave_ruins`) |
| `numismatics` | **salvage** *(discuss)* | currency, bank accounts and vendors. Trade is Salvage's entire character — *"Lets do a deal."* Counter-argument: it is a Create addon and Forge is the industry path |

⚠️ **`create-big-cannons` (213 items) is a weapons mod inside the building path.**
It is also an R1/R2 question — cannons sit at the edge of the Create ceiling. Blade
or Salvage would both have a better claim on it than Forge.

## Finding 4 — the honest shape of Forge's 27

Strip the three misfiled mods, and the seven decoration mods down to three or four,
and Forge still has **~19 mods and a genuine progression tree**. It remains the
deepest path in the pack by a wide margin — **the audit does not threaten that, it
just stops Forge's count from flattering it.**

For contrast: Salvage has 5 and Crown had 4.

## Verdicts — for Ethan

| # | mod(s) | proposed | needs |
|---|---|---|---|
| 1 | `createbetterfps` | **MOVE** → perf | — |
| 2 | `create-let-the-adventure-begin` | **MOVE** → worldgen | also audit its structures in A5 |
| 3 | `numismatics` | **MOVE** → salvage? | Ethan's call |
| 4 | `create-big-cannons` | **MOVE** → blade/salvage? | Ethan's call + R2 check |
| 5 | `deco` vs `design-n-decor` | **CUT one** | Ethan's call |
| 6 | `create-aeronautics` | **KEEP, but measure** | TPS before/after |
| 7 | `create-compatible-storage` | **investigate** | 0.1 MB shim — what does it bridge? |
| 8 | `create_oxidized` | KEEP | 45 recipes, harmless |
| 9 | everything else | **KEEP** | the path's actual substance |

## Not asked yet, and worth asking

**Has anyone used `create-railways-navigator`, `create-sound-of-steam`, or
`create-dragons-plus`?** They are small and cheap, but question 4 of the rubric is
*has anyone ever used it* — and only Ethan can answer that.

---

# ✅ A1 VERDICTS — Ethan, 2026-08-14

## 🚨 THE PRINCIPLE THIS PRODUCED — it supersedes my recommendations

> Ethan: *"Each of the mods should be in the same vein as the other paths. So forge
> can fight, cast, have guns, and build minions... This should be standard for the
> mods and we don't necessarily need a set amount of core but just keep the theming."*

### EVERY PATH CAN DO EVERY VERB — IN ITS OWN IDIOM.

Fight, cast, shoot, build, command. **No path is locked out of a playstyle; each one
expresses it differently.** Forge does not borrow Blade's sword — he brings a cannon.
Salvage does not learn Ars Nouveau — she has her own answer.

**This reverses my proposal to move `create-big-cannons` to Blade**, and the reversal
is right. I read 213 weapon items inside the building path as misfiling. It is not:
**cannons are how Forge shoots.** Reading each mod as belonging to a *category* rather
than to a *character* was the error, and it would have hollowed out five paths to
tidy one taxonomy.

It also kills "how many mods does a path need". There is **no target count** — the
test is whether the mod is in that patron's voice.

| verb | blade | forge | salvage | art | wall |
|---|---|---|---|---|---|
| fight | swords, armour | **cannons** | guns | spell combat | colonists, golems |
| cast | — | **create-ars-nouveau** | — | Ars Nouveau | — |
| build | — | Create | — | — | MineColonies |
| command | — | **bionics** | — | — | Goety + citizens |

Gaps in that table are the real audit output, and they are **GROW verdicts, not cuts.**

## Core — keep, ruled

`create` · `create-aeronautics` · `create-big-cannons` · `create-bionics` ·
`create-ars-nouveau` · `numismatics`

* **`numismatics` stays with Forge and grows.** Ethan: *"a nice currency system that I
  want to build around more."* Not a misfiling — a future workstream. It also gives
  Forge, the patron who claims *everything your pockets will ever hold*, an actual
  economy to claim it in.
* **Create's FPS work stays.** *"keep whatever fps improvements create has"* —
  `createbetterfps` and `create-connected`'s performance features survive. The move to
  the perf bucket is bookkeeping, not a cut.
* **`create-aeronautics` keeps its physics engine** — measure it, do not remove it.

## The decoration cut — ⚠️ TIME IT WITH THE WORLD RESET

Ethan: *"we can cut a lot of the decor ones."* Agreed, and the proposed list is
`create-design-n-decor` (846) · `create-deco` (389) · `create-framed` (569) ·
`create-bits-n-bobs` (123) — while **keeping the functional three**: `create-encased`
(encasing is a mechanic), `copycats` (shape-copying is a mechanic), `create-connected`
(QoL + performance).

### 🚨 But cutting a block mod deletes blocks that are already placed.

The live world is **356 MB across 1,572 region files.** Every `create-deco` slab
anyone has ever built with becomes air the next time that chunk loads. There is no
migration and no warning — it is simply gone, and so is anything resting on it.

**Recommendation: hold the decoration cuts until the world reset** (`11-OPEN-DECISIONS`
records Ethan's intent to wipe and redo worldbuilding). At that moment they cost
nothing. Before it, they cost whatever the four of you have built.

**Everything else in A1 is non-destructive and can land immediately** — bucket moves
change no blocks.

## Still open from A1

* **Has anyone used `create-railways-navigator`, `create-sound-of-steam`,
  `create-dragons-plus`?** Rubric question 4, and only Ethan can answer it.
* **`create-compatible-storage`** — a 0.1 MB shim; what does it bridge, and is that
  thing still in the pack?
