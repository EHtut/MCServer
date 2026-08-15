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

---

# A3 — THE ART / MAGIC AUDIT

*14 mods by the taxonomy — **9 in truth**, once the two libraries the regex hid are
counted. Nothing cut here; verdicts collect.*

## The census

| slug | MB | items | blocks | recipes | lang |
|---|---|---|---|---|---|
| `ars-nouveau` | 19.2 | **447** | 200 | 709 | 2369 |
| `magic-vibe-decorations` | 1.8 | 203 | 188 | 130 | 203 |
| `witcher-rpg-class` | 1.5 | 198 | 13 | 288 | 454 |
| `arsdelight` | 1.2 | 97 | 26 | 139 | 186 |
| `elemental-wizards-rpg` | 1.3 | 74 | 0 | 152 | 193 |
| `wizards` | 4.3 | 56 | 0 | 125 | 164 |
| `forcemaster-rpg-class` | 0.6 | 51 | 0 | 63 | 67 |
| `berserker-rpg-class` | 0.5 | 35 | 0 | 73 | 142 |
| `runes` | 0.3 | 13 | 1 | 20 | 13 |
| `spell-engine` | 4.3 | 4 | 1 | 1 | 216 |
| `ars-creo` | 0.1 | 1 | 1 | 1 | 18 |
| `ars-lumos` | 0.2 | 0 | 0 | 0 | 3 |
| `easy-magic` | 0.1 | 0 | 0 | 0 | 9 |
| `spell-power` | 0.2 | 0 | 0 | 0 | 147 |

## 🚨 Finding 1 — Art is carrying TWO complete magic systems

**Ars Nouveau** — 447 items, 200 blocks, 709 recipes, 2,369 lang keys. Glyphs,
rituals, source, an apparatus. A genuine progression tree and unambiguously the anchor.

**And an entirely separate Spell Engine ecosystem**, which the dependency graph shows
is one cluster, not six independent mods:

```
spell-engine  ←  spell-power, wizards
              ←  berserker-rpg-class, elemental-wizards-rpg,
                 forcemaster-rpg-class, witcher-rpg-class
                 (three also need more_rpg_classes)
```

**That is nine mods** — the seven above plus `more-rpg-library` and `azurelib-armor`,
which my regex filed as *libraries* and so hid from the count. Art's real footprint is
16, and **more than half of it is a second magic system.**

This is the most flagrant R5 breach in the pack — *one system per verb*, and casting
has two.

⚠️ **Note the new principle does NOT excuse this.** *Every path does every verb in its
own idiom* gives each path **one** casting idiom. It does not give Art two.

## 🚨 Finding 2 — four of them collide with the PATH SYSTEM ITSELF

`berserker-rpg-class` · `elemental-wizards-rpg` · `forcemaster-rpg-class` ·
`witcher-rpg-class`.

These are not spell mods. **They are class systems** — pick a class, gain abilities,
level it. And **the paths ARE the class system.**

> The pack ships four competing answers to *"what am I?"* while we build a fifth and
> call it canon.

This is a bigger problem than R5, because it is not about mod count — it is **R8**.
A Witcher class is from another world, wearing another world's name, offering the
player an identity Veldora did not give them. The whole point of the introductions is
that a patron decides what you are. A menu that lets you pick *Berserker* instead
undercuts every scene in `28`.

**Recommend CUT, all four**, on thesis grounds rather than performance ones. They are
~360 items and four ways to be someone the world never offered.

## Finding 3 — the fork worth actually thinking about

With the class mods gone, `spell-engine` + `spell-power` + `wizards` remain, and
there are two honest readings:

* **CUT** — redundant. Ars Nouveau is the deeper system by an order of magnitude and
  Art only needs one.
* **REPURPOSE** — ⭐ Spell Engine is *light* where Ars is deep. The verb matrix has a
  hole: **Blade, Salvage and Wall have no casting at all.** Spell Engine could be the
  universal thin casting layer every path gets a little of, leaving Ars Nouveau as
  Art's alone. That turns an R5 violation into the mechanism that satisfies *every
  path does every verb.*

**This is Ethan's call and it is a genuine fork**, not a tidy-up.

## Finding 4 — the small stuff

* `magic-vibe-decorations` — 203 items / 188 blocks of decoration. Same question as
  Create's seven, same answer, same timing hazard.
* `ars-lumos` (light), `easy-magic` (enchanting QoL), `spell-power` (attributes) —
  register nothing. Support, not substance. Fine if their parent stays.
* `ars-creo` — a one-item Create↔Ars bridge. **Keep**: it is exactly the
  cross-path plumbing the verb matrix wants.
* `arsdelight`, `runes` — small, on-theme, harmless.

## A3 verdicts — for Ethan

| # | mod(s) | proposed |
|---|---|---|
| 1 | the four **RPG class mods** | **CUT** — they compete with the path system |
| 2 | `spell-engine` + `spell-power` + `wizards` | **FORK** — cut as redundant, or repurpose as the universal light-casting layer |
| 3 | `magic-vibe-decorations` | decoration cull, timed with the reset |
| 4 | `ars-nouveau` + `arsdelight` + `ars-creo` + `ars-lumos` + `runes` + `easy-magic` | **KEEP** — the anchor and its support |

⚠️ Cutting the class cluster also frees `more-rpg-library` and `azurelib-armor` **if
nothing else needs them** — check before removing, this is exactly the orphaned-library
case A8 exists for.


---

# 9. The creation-tool list — filtered, 2026-08-14

> Ethan pasted 19 links from a modpack-creation video: *"We already have alot of
> these but im lazy and just copy and pasted."*

**Only `kubejs` and `jei` are actually installed.** Four of the rest solve problems
this audit hit tonight, and one of them changes how the decoration cut should work.

## ⭐ TIER 1 — these solve problems we already have

### `Item Obliterator` — **it removes the decoration-cut hazard**

Hides/removes items from JEI, recipes and the world **without removing the mod.**

That matters enormously: cutting a block mod **deletes blocks that are already
placed** (356 MB of world, 1,572 region files). Obliterating instead means the mod
stays loaded, **every block anyone has already built with survives**, and nobody can
obtain any more.

> **This turns the decoration cull from a reset-timed destructive operation into
> something we can do tonight.** It is the single most useful mod on the list.

### `Structurify` — **it fixes worldgen without cutting anything**

Per-structure spacing, separation and toggles at runtime.

The worldgen census found **629 structures across 51 mods**, with the problem being
that the generic ones are dense enough to be what you actually meet — Explorify at
`frequency 0.8, spacing 48`. Structurify makes that a **dial instead of a cut**: keep
Explorify's 23 structures and make them rare, and let the 106-structure village
overhaul and the gothic ruins surface instead.

**Rarity was the diagnosis. This is the instrument.**

### `Biome Replacer` — the BWG question without a world rebuild

Maps biome → biome at generation. Directly relevant to *"replace oh the biomes with
regions unexplored?"* — it can do a swap without a full worldgen overhaul, though
existing chunks still keep what they were built with.

### `Attribute Setter` — datapack-driven attributes

Sets entity/item attributes from JSON. Relevant to **E3, the coefficient substrate**,
and to per-path mob scaling, without another KubeJS hook.

## TIER 2 — real, but taste

* **`Jade`** — the what-am-I-looking-at overlay. Nothing equivalent ships. Genuinely
  useful on a 289-mod pack where half the blocks are unfamiliar.
* **`WorldEdit`** — admin/building. Worth it for the world reset alone.
* **`Command Aliases`** — could shorten the Veldora command surface.

## TIER 3 — skip, we already have the verb

| mod | why not |
|---|---|
| **CraftTweaker** | recipe scripting — **we have KubeJS.** R5, one system per verb |
| **Bad Mobs** | spawn denial — **we have In Control**, already tuned by depth |
| **You Shall Not Spawn** | same as above |
| **WITS**, **Suggestion Tweaker**, **Configurable**, **Persistent Creative Inventory**, **Change Items Durability**, **BlockSwap** | dev conveniences. Low value for four players; several are client-side authoring aids |

## The standing caution still applies

Everything here is a **tool**, not content, so none of it touches R1 or R8 — but
`Structurify` and `Biome Replacer` both alter worldgen, and **config does not ship
through packwiz** (F37). Whatever they are set to reaches only players who re-import
the instance zip. Plan delivery before tuning.

---

# A2 — THE WALL AUDIT ✅ (done 2026-08-14, after A3)

*18 mods by the taxonomy. Wall came out of it as a completely different path.*

## What Wall is now

`goety` · `goety-cataclysm` · `occultism` · `automaticons` — **four mods, all minions.**

> **Goety fights for you. Occultism works for you.**
> Necromancy thralls versus summoned spirits bound to jobs. Different verbs, so no
> R5 collision, and together they are a real anchor where SecurityCraft never was.

## MineColonies: dropped, and the reason is the toolchain

Modrinth carries **exactly one version** of MineColonies — 1.18.2 Forge. The real
distribution is CurseForge, and `gen_pack.py` / `resolve.py` have **zero CurseForge
support**; all 281 mods resolve through Modrinth. Shipping it means a hand-authored
metafile outside the pipeline that breaks on the next regeneration.

**A maintenance cost, not a gameplay one** — and the resource half of MineColonies was
always Forge's job.

## Occultism: already downloaded, never shipped

R7 named it as one of the four designed alternatives and it sat in cache unused.
602 items · 165 blocks · 3,587 lang keys · a four-tier summoning ladder
(Foliot → Djinni → Afrit → Marid) · 20+ familiars · a golem · a **`miner` recipe type**
for spirits that dig ore for you.

⭐ **It resolves Ethan's own earlier objection rather than contradicting it.** He ruled
Occultism too craft-heavy to be a *supplementary* — correct, and irrelevant, because
as a path **anchor** craft-heavy is the requirement. It failed one test and passes the
other.

## Cut

`theurgy` (*"this will never be touched ever and i can already tell"*) ·
`security-craft` (same, and no longer Wall's base) · `guard-villagers` (redundant).

## Resorted out of Wall

* → **supplementary**: `chipped` (6,993 items!), `framedblocks`, `handcrafted`,
  `macaws-furniture`, `macaws-roofs`, `storagedrawers`, `storage-delight`,
  `interiors`, `bellsandwhistles`, `carry-on`
* → **worldgen**: `medieval-buildings` (0 items, 5 structures), `oh-the-trees-youll-grow`
  (a hard dependency of the biome mod, never Wall's)

## 🚨 The procedure that now clears every cut

A `mods.toml` dependency scan is **not sufficient**. It missed `archers_expansion`
mixing into `net.more_rpg_classes.effect.MRPGCEffects` and the server crashed on boot
with `ClassNotFoundException`.

**Every cut is now cleared by: a byte-search of every shipped jar for the mod id, AND
a check of every `.mixins.json` for the package.** Mixins reference classes directly
and declare nothing.

## Version discipline

The pack resolved `occultism 1.224.2` while the cache held `1.224.1`. The resolved
build was downloaded and its **sha512 verified against the metafile** before the
server jar was replaced — server and clients agree exactly.

---

# A4 — BLADE + SALVAGE ✅ (done 2026-08-14)

## The verdict for both: NOT A MOD PROBLEM

> Ethan: *"Blade and salvage are the most boring mechanically, blade being you have a
> sword or an axe and you swing it and don't die. So instead of targeting power, we
> target animations and bosses."*
>
> And after the pass: *"i think blade relies more heavily on events than any other
> class"* · *"same issue as blade that it needs events"*

**Neither path is short of content. Both are short of EVENTS.** This is the only
audit stage that ended with zero cuts and zero additions.

## Blade — 7 mods, and six of them register nothing

| mod | items | what |
|---|---|---|
| `epic-knights-shields-armor-and-weapons` | **718** | the only content. 420 recipes |
| `better-combat` | 0 | the combat system — movesets |
| `combat-roll` | 0 | dodge roll |
| `cut-through` | 0 | sweep tweak (0.0 MB) |
| `not-enough-animations` | 0 | visual |
| `first-person-model` | 0 | visual |
| `playeranimator` | 0 | animation library |

**Filed elsewhere but Blade's:** `knight-lib` (7 items — Epic Knights' own library,
sitting in `library`) and `medieval-siege-machines` (19 items — *"Trebuchet, catapult,
ballista, battering ram, mortar"*, sitting in `worldgen`; it is siege **weaponry**).

**One content mod plus a very good presentation layer.** The animations already work.
There is no progression ladder and adding a ninth sword mod would not create one.

### Marium's Soulslike Weaponry and Sengoku Jidai — passed on, with reason

Ethan asked for a pass rather than a blind add. **Both are Fabric-only for 1.21.1** —
Marium's has 7 builds for 1.21.1 and **zero NeoForge**; the only NeoForge-facing
Sengoku project is `sjscp`, *"Sengoku Jidai + Sinytra Connector Patch"*.

**Both route through Sinytra Connector**, which loads a Fabric runtime alongside
NeoForge. Mature (22.5M downloads, real 1.21.1 support) but:

* its known failure mode is **conflicts with mixin-heavy mods**, and this pack is
  extremely mixin-heavy — we crashed the server tonight on a single mixin
* it is **all-or-nothing**; every one of 281 mods becomes exposed to it
* F37 precedent: one mod killed the entire GUI layer

**Recommendation: not for two mods.** If wanted later, test on a **copied instance**,
never the live one.

Native alternatives were searched and are thin: the two best boss mods that came back
(`l_enders-cataclysm`, `bosses-of-mass-destruction`) are **already installed**, and
`weapons-of-miracles` — the strongest moveset mod — is built on **EpicFight**, which
collides with Better Combat under R5.

## Salvage — 5 mods, and the item count lies

| mod | MB | items |
|---|---|---|
| `tacz` | **54.6** | **21** |
| `archers` | 0.9 | 122 |
| `archers-expansion` | 0.7 | 48 |
| `gunpowder-ore` | 0.0 | 1 |
| `ranged-weapon-api` | 0.1 | 0 (library) |

🚨 **TaCZ registers 21 items because every gun is ONE item plus a `GunId` component.**
What it actually ships:

> **54 guns · 24 ammo types · 101 attachments · 1,352 sounds · 60 animations**

Scopes, grips, extended mags, bayonets, and ammo mods (FMJ, HE, HP, incendiary,
slug). **That is a deeper progression tree than Blade's 718 items** — and guns cannot
be crafted, so every one of them is found.

**I predicted Salvage would come back GROW. It does not.** The taxonomy could not see
it because I was counting registry entries and TaCZ hides its content in a datapack.

## What A4 actually produced

**Zero cuts. Zero additions. Two GROW verdicts that cost no mods at all:**

* **Blade → E8** — waves, the taunt ladder, `"Run."` before the Harvest
* **Salvage → E6 + E7** — the three trades, the debt counter, the raid when it comes due
* **Both → champions above, hordes below** — the bosses exist and are structure-locked,
  which is the same placement problem as the cobblestone pillars

⭐ **The lesson for the remaining stages: an item count is not a content measure.**
Wall's 14 mods looked healthy and were decoration; Salvage's one mod looked thin and
is the deepest tree in the pack.

---

# A5 — WORLDGEN ✅ (done 2026-08-14), and the bucket splits three ways

Ethan: *"lets seperate this up into biomes, structures, and worldgen."*
41 mods went in; they come out as **13 biomes · 17 structures · 10 terrain**, with
one filed back to Blade.

## 🚨 Finding 1 — twelve of the 41 were not worldgen at all

| mod | MB | what it is | moved to |
|---|---|---|---|
| **`distanthorizons`** | **28.8** | LOD terrain *rendering* | visuals/perf |
| `chunky` | 0.3 | chunk pre-generation | perf |
| `explorers-compass` / `natures-compass` | 0.2 | 32 items each, finder tools | qol |
| **`medieval-siege-machines`** | 1.8 | trebuchets, ballistae, battering rams | **blade** |
| `weather-storms-tornadoes` | 6.5 | weather events | terrain |
| `seasonhud` | 0.2 | client UI | visuals |
| `biolith` `terrablender` `structure-pool-api` `thermoo` `lithostitched` | — | APIs | library/biomes |

## Finding 2 — the structure ranking, measured

| mod | structures | pieces |
|---|---|---|
| **`ct-overhaul-village`** | **106** | **2,118** |
| `when-dungeons-arise` | 53 | 877 |
| `better-archeology` | 27 | 52 |
| **`explorify`** | 23 | 330 |
| `valarian-conquest` | 21 | 25 |
| `structory` | 16 | 238 |
| `grim-and-bleak` | 15 | 15 |

**`ct-overhaul-village` rebuilds every village** — the single biggest contributor to a
living overworld, already installed, and currently competing for placement with
Explorify's filler.

## Finding 3 — Explorify, the density problem in one number

23 structures across **14 structure SETS**, 330 pieces, in **0.7 MB**. Fourteen
independent placement rules at high frequency is why its generic ruins are what you
actually meet.

**Either cut it, or tame it with Structurify** — Structurify turns density into a dial
for all 629 structures at once, which fixes the whole bucket rather than one mod.

## 🚨 Finding 4 — do NOT swap Oh The Biomes We've Gone for Regions Unexplored

Measured before recommending. **BWG is not a biome mod, it is a content mod:**

> **935 items · 1,024 blocks · 153 biomes · 576 pieces · 19.5 MB**

Regions Unexplored is biomes. The swap would cost roughly **2,000 registry entries**
of woods, stones and plants the rest of the pack builds with — to solve a problem
that is not variety. **"Bigger biomes" is a `tectonic` config value**, and Tectonic is
already installed at 0.4 MB doing exactly that job.

**Regions Unexplored is dropped from the wishlist.**

## The three new candidates — audited, not added

| mod | dl | MB | structures | sets | pools | verdict |
|---|---|---|---|---|---|---|
| **`abandoned-watchtowers`** | 44k | 0.2 | 2 | 2 | 12 | ⭐ **already in cache, never shipped.** Tiny, on-theme (*"forest biomes, perfect for horror"*) |
| **`aures-farmers-structures`** | 424k | 0.5 | **20** | 20 | 26 | pairs with `farmers-delight`, which ships. 20 structures for 0.5 MB is excellent density-per-byte |
| **`lukis-grand-capitals`** | 4.8M | 8.6 | 7 | 1 | 31 | rebuilt villages + illager structures, 434 pieces |

### The collision test, run rather than assumed

Luki's and `ct-overhaul-village` **both rebuild villages**, so I checked whether they
overwrite each other:

* `ct-overhaul-village` → namespace **`ctov`**, 181 template pools
* `lukis-grand-capitals` → namespace **`revampedvillages`**, 31 pools

**Neither overrides `minecraft:` village pools.** No technical conflict — but both
would generate, giving the world **two different village art styles**. That is a taste
call, not a crash.

## A5 decisions

| | | |
|---|---|---|
| 1 | the 12 misfiles | ✅ **MOVED** — no pack change |
| 2 | `explorify` | CUT **or** tame with Structurify |
| 3 | `oh-the-biomes-weve-gone` | ✅ **KEEP**, and Regions Unexplored dropped |
| 4 | `abandoned-watchtowers` | recommend **SHIP** — cached, tiny, on-theme |
| 5 | `aures-farmers-structures` | recommend **SHIP** — 20 structures, 0.5 MB |
| 6 | `lukis-grand-capitals` | ⚠️ **Ethan's call** — two village styles at once |
| 7 | **Structurify** | recommend **ADD** — the instrument for all 629 |

---

# A6 + A7 — MOBS, VISUALS, QoL ✅ (done 2026-08-15)

## Ethan's two-realm thesis for mobs

> **OVERWORLD** — flush with animals, scarce of enemies. Bosses earn their keep by
> being powerful enough to exist up there.
> **UNDERWORLD** — dangerous, full of hellish abominations and hordes. Enemy mobs
> flush, bosses loose.

The bucket split into `overworld-life` (11) and `mobs-enemies` (15) to match it.

## 🚨 `legendary-monsters` was the antithesis — cut

37 humanoid hostiles (Knight, Haunted Knight, Beheaded Knight, Resurrected Knight,
Ambusher, Bomber, Guard, Dune Sentinel), 25 structures, 42.5 MB — and the entity
census had **seven ambushers live in the world**. Ethan: *"it adds overworld bloat
that doesn't make sense why its up there and usually ends in a kill loop."*

`valarian-conquest` was suspected first and is the **opposite**: Archer, Armorsmith,
Barber Surgeon, Builder, Scribe, Citizens, eight kinds of Merchant, carriages, gates.
A civilisation mod whose "Soldier" is a town guard. **Kept — it is on-thesis.**

## 🚨 `spawn-mod` was never a spawn-control mod

Filed under enemies for the entire audit **on the strength of its slug**. Opened it:
**89 entities**, and they are wildlife — Angler Fish, Barracuda, Booby, Clam, Coastal
Crab, **Dodo**, Hamster, Iguana, Octopus, Scallop, **Sea Cow**, Seahorse, Seal, Snail
— plus **63 biomes and 10 structures**. 70 MB.

It is the **largest animal mod in the pack** now that Jurassic is gone, bigger than
`naturalist` (50 entities). Moved to `overworld-life`.

⚠️ Consequence: it already ships Angler Fish, Barracuda, Blenny, Bluefish, Herring,
Pilot Fish and Seahorse, so `fish-of-thieves` and `aquaculture` overlap it more than
was visible when they were chosen.

## A7 cuts

`rpgtitles` (duplicated `travelers-titles`) · `waterframes` + `watermedia`
(0.2 MB riding a **35.3 MB** media backend) · **`jurassic-reborn`** (164 MB, 5,001
items — the largest mod in the pack).

⭐ **Cutting Jurassic frees JEI.** It was the ONLY mod declaring `jei` as required.
The manifest records EMI as the chosen viewer with JEI surviving purely as a forced
dependency, so the two-recipe-viewer R5 breach can be closed at will. **Flagged, not
taken.**

## Additions — the overworld half

Alex's Mobs is the obvious answer (13.4M downloads) and has **no NeoForge 1.21.1
build**; nor do `alexs-caves`, `domestication-innovation`, `creatures-and-beasts`.

Shipped instead, all sha512-verified: `critters-and-companions` (5.6M downloads,
already in cache) · `untitled-duck-mod` · `fish-of-thieves` · `aquaculture`.

## Where A7 still has open questions

* **`ambientsounds` is 80.9 MB**, client-side — the largest remaining jar. On-theme
  for horror, but a big download for ambience.
* **`waystones` ships with a manifest note saying `CUT 2026-08-03`** — a stale ruling
  or a silent revert. Unresolved.
* **`figura_extrafight`** hooks Figura into **EpicFight**, which is not installed.
  Likely inert.
* **JEI** — free to cut, see above.
