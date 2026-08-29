# 68 — The gameplan: retiring the world and everything that rides with it

> **STATUS: DRAFT.** Assembled 2026-08-29 from the session that began *"lets just take
> this opportunity to retire the existing world."* **Zero code written from this doc.**
>
> This is the **build order**, not a wish list. Where something is already decided it
> says so and links the ruling; where it is not, it is in §0 and it blocks.

---

## 🔑 THE SPINE: the reset is a ONE-SHOT, and it is the deadline

Every worldgen decision has to be made **before** the world is generated. Add a tree
mod afterwards and its trees appear only in chunks nobody has walked — you get a visible
seam through the world forever.

So the whole plan sorts into exactly two buckets:

| | |
|---|---|
| **BEFORE the reset** | anything that changes terrain, biomes, structures, or world height |
| **ANY TIME** | everything else — voice, mechanics, cosmetics, NPCs, quality of life |

⭐ **That bucket line is the single most useful thing in this document.** Most of what
follows is in the second bucket and is therefore not urgent, which means the reset is
gated on a much shorter list than it looks.

---

## §0 🔴 DECISIONS THAT BLOCK — nothing generates until these are answered

### 0.1 ✅ ANSWERED 2026-08-29 — and a candidate already exists

> Ethan: *"We find a mod that generates nether and end biomes in the overworld?"*

⭐ **`tectonic-layers` is exactly that, and it is built for the mod we already run.**

> *"Stacks Nether and End layers inside the Overworld"* — the Nether deep below, the
> Overworld in the middle, the End high above, via a **custom layered chunk generator**
> with correct biomes by height and **native terrain generation, not biome swaps.**

| | |
|---|---|
| loader | **NeoForge 1.21.1 only** — no version guessing |
| requires | **Tectonic** ✅ already in the pack · **Lithostitched** ✅ already in the pack · **Amplified Nether** ❌ new (2.17M downloads, mature) |
| new jars needed | **two** — `tectonic-layers` and `amplified-nether` |

🔑 **It answers the goal without any of option C's damage.** Nether and End content
generates natively, so blaze rods, wither skeletons, Elytra and shulkers all remain
reachable and Create's mid-game is untouched.

### ⚠️ Three things to be honest about before it goes in

1. 🔴 **DISTANT HORIZONS IS UNMENTIONED IN ITS DOCS — and DH is exactly what killed One
   Dimension** (88 exceptions in one generation run, `66`). This is the same risk in the
   same place and it is the single thing worth testing first.
2. ⚠️ **It is BETA**, with only ~1,300 downloads. Its own page says *"back up your
   worlds before installing or updating."* Very little field testing.
3. ⭐ **Its other caveat costs us nothing.** *"Use with new worlds for best results"* —
   we are generating a new world anyway.

**Next step: the same testgen harness used for One Dimension**, which is still warm.
Two jars, one generation, and the question is whether DH throws.

---

### 0.1b ⛔ THE ORIGINAL QUESTION, kept for the record

The original ask was *"remove the nether and the end and all other dimensions,
replacing them with naturally spawning biomes."* **One Dimension was the mechanism, and
it is now cut** (`66`) — but cutting the mechanism did **not** answer the goal.

Three options, and this has to be settled before generation:

| | what it means | cost |
|---|---|---|
| **A. Keep them** | Nether and End stay ordinary dimensions. The "no other realms" idea is dropped | none — but the thesis goes |
| **B. Another mechanism** | find a different stacking/merging mod, or datapack the Nether/End biomes into deep Overworld bands by hand | unknown; the hand-rolled version is a large job |
| **C. Close the portals** | dimensions exist but are unreachable | 🔴 **breaks Create.** Blaze burners gate its mid-game, and four installed mods become dead weight |

⚠️ **The measured argument against C stands:** this is a Create pack — 25+ Create
addons. Without blaze rods there are no blaze burners, so no Basin heating, so most of
the pack's automation stops. Also lost: the Wither and therefore beacons, plus Elytra
and shulkers.

⭐ **What the One Dimension test proved is still worth having** (`66`): the idea *works*.
It generated genuine Nether and End terrain with real structures at −320..1279, and it
composed with Tectonic exactly — Nether ceiling −129, Overworld floor −128, zero gap.
It was cut for the Distant Horizons conflict (88 exceptions in one generation run), not
because the concept failed. **If B is chosen, that is the shape to aim at.**

### 0.2 ✅ RULED — Tectonic stays at `min_y: -128` as staged

Accepted with the side effect known: the band **−40 to −63 is nearly solid**, because
the taper moved down with the floor.

⭐ **That band is arguably a feature, not a cost.** It puts a dense barrier between the
ordinary cave layer and the deep — which is exactly the boundary Wall's depth-diving and
Art's entry condition both want to mean something. Crossing it should feel like work.

⚠️ It also composes with §0.1: One Dimension placed its Nether ceiling at **−129**,
directly beneath this floor, with zero gap. Whatever mechanism lands, that is the seam.

### 0.3 Two remaining `chosen` questions (`67`)

Neither blocks generation. **Blade 500 · Wall a pathed player · Art the deep speaker's
introduction, 50 levels, she takes all of them · Salvage no-upside deals · Forge a long
cooldown, timer per prompt** are all ruled.

Left: **which clock Wall's 30 days uses** (`fall.js` counts world days, `ranks.js`
counts played sweeps online-only — 30 world days pass while you are logged out, so
played time is the fairer measure and is the working default until told otherwise), and
**what a godless early game looks like** now that every route got materially harder.

---

## §1 ⚠️ FIRST, AND BEFORE ANYTHING ELSE: verify the eleven

**Eleven files have been deployed since 2026-08-23 and have never been loaded.** The
server booted at 17:21:53 that day and everything deployed from 17:23 onward missed it.
`[sound]`, `[wallaura]` and `[nemesis]` appear nowhere in that log.

```
fall.js · blade_voice.js · salvage_voice.js · patron_sound.js · voice.js ·
wall_aura.js · salvage_events.js · paths.js · phase.js · blade_events.js ·
nemesis_tally.js
```

That is roughly two sessions of work — the empty-pool fix (which unblocks **four of
Blade's nineteen events**), the patron sounds, Wall's aura, the band stretch, Salvage's
event kinds and the NUL fix. All harness-green (427 assertions, 13 harnesses); **none of
it has ever run.**

🚨 **`/patronsound` is the first command to run after that boot.** The sound ids cannot
be validated server-side — a fake id and a real one are byte-identical over rcon — so a
silent god is the only way to find a wrong one.

⭐ **Do this on the CURRENT world, before the reset.** Verifying eleven files and
regenerating the world at the same time means any failure has two possible causes.

---

## §2 The mod list — verdicts

### Take, no friction
`simple-hats` · `seasonal-decorations` · `death-count` · `immersive-snow` ·
`ominous-mansions` · `the-day-of-the-beast` · `inventory-pets` ·
`realm-rpg-treasure-balloons`

⭐ **The whimsy is deliberate**, and Ethan has ruled on it: the book series this is based
on *"has a lot of toby fox humor."* Inventory Pets and Treasure Balloons are not tonal
accidents — dread that never breaks is just noise, and the joke is what makes the horror
land.

### Take, with a known cost
| mod | the cost |
|---|---|
| **tetra** | ⚠️ Ruled in: *"tetra is too good to pass up."* It changes what a tool IS, which is exactly why `chosen` moves off item ids (`67`) |
| **tyzs-skills** | the talent-tree pick of the three. NeoForge 1.21.1, 100% data-driven JSON, **KubeJS support**. ⭐ Keep it **small, slow and permanent** against god power that is **large, fast and revocable** — get that backwards and nobody bothers with the gods |
| **minecraft-comes-alive-reborn** | ⚠️ Ethan's call. Motivation is sound (*"the world above isn't dead and i don't like villagers"*) but MCA is a family sim, and marriage-and-children sits badly against ambient horror |

### ⭐ `bountiful` — KEPT, and it should be hers

Ethan, 2026-08-29: *"we can cut daily quests but keep bounty boards."*

🔑 **The distinction that makes this the right call:** a *daily quest* is a treadmill
handed out by nobody, which is exactly what competes with the gods. A **bounty board is
a place in the world** — it sits somewhere, you travel to it, and it can belong to
someone.

⭐ **Give it to Salvage.** She is already the commission god (`salvage_events.js` runs
`commission`, a kill order on the nearest other player, settled for levels and harness).
A board she runs is not a second economy competing with the pantheon — it is her economy
with a physical location, and it is already her voice.

⚠️ **Open, and worth deciding before it lands:** does a *godless* player get to use the
board? If yes, it becomes a natural on-ramp for the long pathless stretch that `67` now
creates. If no, it is a perk of being hers.

### Deferred — costs nothing to add later
`easy-npc` — touches no worldgen, so it is not a reset decision.

### Recommended against
| mod | why |
|---|---|
| **daily-quests** | ⛔ **CUT 2026-08-29.** The gods already run 45 events including contracts, kill orders, commissions and errands — a daily quest board competes for that slot and is *impersonal*, which is the opposite of the whole design |
| **creaturechat** | the authored voice IS the signature here. 446 drafted lines and twenty-odd docs of canon; letting a small local model give every zombie a line puts a second register in the world and makes speech ordinary. **The gods should be the only things that talk** |
| **heart-crystals** | `power.js` already grants max health scaled by trust. Two ladders to the same stat, and the gods' one is the point |
| **tensura-reincarnated** / **-mysticism** | ⛔ **CUT.** Total conversion — own races, skills, boss gates, dual progression paths, **and its own dimensions**, which contradicts §0.1 |

---

## §3 World feel

**Already installed and doing the work:** Regions Unexplored (tall trees, TerraBlender-
based so it composes with Tectonic) · **Sound Physics Remastered** (reverb and occlusion
— the best ambient-horror tool in the pack, already present) · Naturalist ·
Critters and Companions · Respawning Animals.

**Genuinely missing:** falling leaves · fog and snow visuals · an ambient-sound mod.

### ⭐ Two measured findings that make this cheaper than it looks

1. **Animals are NOT being suppressed by us.** In Control only denies `hostile: true`
   above y=40 — passive spawns are untouched. *"More animals"* is spawn-weight tuning,
   not a bug hunt.
2. **The surface is deliberately empty of hostiles above y=40.** That is the existing
   design, and it makes ambient horror **cheap and safe**: the surface can be made to
   sound terrifying without touching a single spawn rule, because there is nothing up
   there to actually hurt anyone. Dread with no teeth is exactly right when all the
   teeth are underground.

⚠️ Most of this list is **client-side** — everyone re-downloads the pack.

---

## §4 Wall

**Settled: she stays on Goety** (`34` §0b). The Tensura-replacement search is closed —
every honest alternative brought a second level system, and Werewolves is lupine
besides, a poor fit for The Spider.

⭐ **One idea survives the mod that suggested it.** Werewolf transformation is
*involuntary loss of control*, which is the possession mechanic already designed for
her. Build it in KubeJS; do not import it.

**The direction, unchanged from the design conversation:**

* her rank already **starts at MAX and decays** — today that reads as *absence*.
  Possession reinterprets the identical mechanic as her **taking over**
* **depth-diving against her will**, for artifacts, which answers the founding
  complaint that nobody explores — and the Lootr config is already scoped to deep tables
* Goety stays as the **expression**: as she takes over, her spiders arrive to do it for
  you

🚨 **The invariant, and it is not negotiable:** she only ever takes control to do
something **competent and beneficial**. She kills the thing that was about to kill you.
The horror is that *you didn't do it* — never that you lost. Take control to make the
player worse off and it reads as lag or a bug, which is the one thing this design has
consistently refused to do.

**Already built and waiting on §1:** `wall_aura.js` — she wounds and webs to 25% of max
and never kills, so the kill and its drops stay the player's. 31 assertions.

---

## §5 Being chosen (`67`)

Five entry conditions, each an expression of that god's character rather than an
inventory check. **Three numbers ruled:** Blade **500 mobs**; Wall **a pathed player**;
Art **the deep speaker's introduction** (below y0, no sky — the threshold already exists
as `DEPTH_Y`). Salvage's deals ruled: **health, hunger, a bad status effect, no upside,
never items.**

🔴 **One piece needs new machinery, not new wiring:** `speakerFor()` returns null for a
pathless player, so the pathless currently get **no deep speaker at all**. Art's
condition requires that they hear *her*.

---

## §6 Carried work, unblocked, any time

* **446 `[CLAUDE-DRAFT]` lines** across 128 pools awaiting Ethan's pass (`51`)
* **Salvage's register** — her trade voice and her collection voice are audibly
  different people (`7b`)
* **Salvage's five godless pitches** — the hardest writing in the plan. They have to
  convince five times against a reader who is getting suspicious
* **Blade's seven Challenges want rebalancing downward** — his own file flags it
* **The death-position question** — the respawn cut kept death's *cost* but not its
  *position*, and PART I(b) depended on waking where you fell. Never re-litigated
  because the cut was an emergency fix
* **The Lootr config has never been observed working in play**
* **102 commits unpushed** to `origin/main`

---

## The order

```
1. BOOT AND VERIFY THE ELEVEN          ← current world, before anything else
2. ANSWER §0.1 (dimensions)            ← the only true blocker
3. Settle §0.2 (Tectonic taper) and the mod list
4. Install every worldgen-affecting mod
5. GENERATE ONCE
6. Crown → Wall · The Arrival · /path forcereset   ← free with the reset
7. Everything in §6, in any order
```

⚠️ **Steps 1 and 2 are independent** — the verification does not need the dimension
answer, and vice versa. Step 1 can happen tonight.
