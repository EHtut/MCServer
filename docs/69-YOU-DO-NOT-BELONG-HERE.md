# 69 — You do not belong here: the Nether and the End

> **STATUS: DRAFT.** Ethan's writing, 2026-08-29. **Zero code.**

> *"So what im hearing is that we need to keep end and nether biomes in? Fine, we can
> add an ambient line of how wrong those dimensions feel and you don't belong here."*

---

## 🔑 This turns the compromise into the better answer

Two attempts to merge the dimensions into the Overworld failed on their mechanics
(`66`): One Dimension generated correctly but broke Distant Horizons' LOD lighting;
Tectonic Layers could not generate a chunk at all. **The dimensions stay.**

⭐ **And keeping them is now doing work that removing them could not.** A Nether you
cannot reach says nothing. A Nether you *can* reach, which tells you that you are
trespassing, says the thing the whole design has been reaching for: **the gods' world
is Veldora, and their reach ends at the portal.**

You still need blaze rods. You just never stop being aware that you are somewhere the
pantheon does not go.

---

## The lines — Ethan's writing, verbatim

### Nether

```
You hear the distant echo of raging gods
You feel a wrongness deep in your soul
You hear a girl scream, fighting, a murder, then silence
You are afraid.
```

### End

```
You are uncomfortable.
Something comes from here, something you fought before many times
Run.
What do you seek here?
```

---

## 🔑 THE CRITICAL PROPERTY: these have NO SPEAKER

Every other line in this game comes from a named god with an authored register. Blade
commands. Milantros drops her g's. Salvage coaxes. Caebrim is grey and is not a god.

**These come from nobody.** Flat, second-person, declarative — *"You are afraid."*
*"Run."* No voice, no personality, no colour code that belongs to anyone.

⚠️ **That is the entire effect and it must not be eroded.** The moment one of these is
attributed to a patron, the Nether becomes another place a god can reach you — which is
the exact opposite of what they are for. **Nobody is talking to you. The place is just
true.**

🚨 **So they must NOT go through `voice.js`.** That module colours by god
(`COLOUR[god]`) and every caller names one. These need their own channel with no
speaker and no patron colour.

### Two things the writing is already doing

⭐ **The Nether escalates; the End interrogates.** The Nether's four lines run
distant → internal → specific → verdict, ending on the flattest possible statement of
fact. The End's four do not escalate at all — they circle, and one of them **asks you a
question**, which nothing else in the ambient layer does. Two dimensions, two different
kinds of wrong.

⭐ **"You hear a girl scream, fighting, a murder, then silence"** is the only line in
either set that describes an *event* rather than a feeling. It is also the only one that
implies the place has a history you are walking through rather than a mood you are
feeling. ⚠️ It reads as book canon — it should be checked against the Caebrim / Kayer /
Mera / Gregor material (`58`–`61`) before anything is built on top of it, because if it
is a specific event then other lines may eventually want to reference it.

⭐ **"Something comes from here, something you fought before many times"** points at the
existing bestiary. The End is not framed as alien — it is framed as the *source* of
things already familiar, which is worse.

---

## 🔴 OPEN — needed before this is built

1. **Cadence.** `idle.js` runs contextual ambience at *20% per 1200t with a 90s floor*
   and contexts for hold / location / combat / nearby champion. Is this a new context on
   that machinery, or its own channel? ⚠️ Four lines is a small pool — at idle's rate a
   player would exhaust and repeat them inside one Nether trip.
2. **Who hears them?** Everyone, or only pathed players? ⭐ Worth considering that they
   are *most* effective for a champion who is used to their god narrating — the silence
   where their patron should be is the point.
3. **Do they vary by path?** Cheapest answer is no, and "no" may be correct: a line with
   no speaker should not know who you follow.
4. **Delivery.** Chat, action bar, or title? The gods use chat. ⚠️ Something with no
   speaker arguably should not appear in the same place a speaker does.
5. **Does the deep Speaker still reach you there?** ⚠️ **Checked, and the answer is
   better than it first looked — but only by accident.**

   `deep_speaker.js` gates on `y < DEPTH_Y && !sky`, i.e. **below y0 with no sky**, and
   there is **no dimension filter of any kind**. The vanilla Nether (y 0..127) and End
   (y 0..255) never go negative, so the Speaker cannot currently fire in either. The
   premise holds.

   🔴 **But it holds by coincidence, not by design.** Nothing in that check knows what
   dimension it is in. Anything that lowers a dimension's floor below zero switches the
   Speaker on there silently — and **Amplified Nether does exactly that**, which is a mod
   this project came within one test of installing today as a `tectonic-layers`
   dependency.

   ⭐ **So add the dimension check anyway, while the reason is understood.** The
   pantheon not reaching the Nether should be a rule the code states, not a property of
   vanilla's coordinate ranges. One condition, written now, against a class of change
   that has already nearly happened once.

---

## Mod decisions taken alongside (2026-08-29)

**Terralith** and **Nyctophobia** are in.

| | |
|---|---|
| **Terralith** (22M) | ~100 biomes including Volcanic Crater and Ashen Savanna — hellish places that are *ours* |
| **Nyctophobia** (1.16M) | *"dark, foggy and unsettling biomes to the Overworld"* — the ambient-horror ask, as terrain |

**Not taken:** Biomes O' Plenty (overlaps Terralith and Regions Unexplored for the same
surface slots) · Alex's Caves (wanted, but it is an unofficial port depending on a second
unofficial port, in a pack where a beta mod crashed twice today).

### 🔴 THE ONE THING TO TEST BEFORE GENERATING

**Terralith and Tectonic both reshape overworld terrain.** They are commonly used
together and are believed compatible, but *believed* is what Tectonic Layers was, and
Regions Unexplored is already in the pack on Biolith doing a third version of this job.

⚠️ **Three worldgen mods composing is exactly the shape that has failed twice today.**
Test in `testgen` before the real reset — Terralith + Tectonic + Regions Unexplored +
Nyctophobia, generated together, and confirm both that it boots and that the terrain is
actually deep.

---

# ADDENDUM 2026-08-29 — the Terralith test PASSED, and found something bigger

Four generations in `testgen`: Terralith + Nyctophobia, then without Terralith, then a
clean 218-jar baseline. Live pack untouched; both jars removed again afterwards.

## ✅ The test itself passed

**Terralith + Nyctophobia + Tectonic + Regions Unexplored + TerraBlender + Biolith +
Lithostitched all compose.** `Done (34.889s)`, **zero crashes**, TerraBlender registered
`nyctophobia:biome_provider` alongside the existing overworld regions.

⚠️ Terralith is datapack-based (it ships its own
`data/minecraft/worldgen/noise_settings/overworld.json`) rather than TerraBlender-based,
so it does not appear in the region registry. That is expected, not a failure.

## 🔴 THE REAL FINDING: the depth diagnosis was WRONG

Air fraction, same 32×32×16 volumes, measured by `fill … replace air`:

| y | baseline (218 jars) | + Terralith & Nyctophobia |
|---|---|---|
| −60 | 0.3% | 0.8% |
| −100 | 1.8% | 1.7% |
| −140 | **5.2%** | **5.2%** |
| −200 | 0.0% | 0.0% |
| −300 | **0%** | **0%** |
| −450 | **0%** | **0%** |
| −550 | 20.3% | 21.4% |

**Identical.** The biome mods change nothing about depth or caves, exactly as biome mods
should not.

⭐⭐ **But look at the baseline column.** The pack ALREADY generates a world spanning
roughly **−592 to ~512** — about 1100 blocks — and the band from **−200 to −500 is
completely solid.** A quarter of a kilometre of deepslate with no caves at all, then a
~20% air void layer at the very bottom.

### 🔑 So the original complaint was right about the symptom and wrong about the cause

> Ethan, 2026-08-24: *"the world is not deep enough. like at all. we have a cave that
> paths down to the bottom of the world and it just sorta ends in lava lakes."*

**The world is not shallow. It is EMPTY.** There is plenty of depth — the caves simply
stop around −200 and nothing exists between there and the void at the bottom. Digging
down does not run out of world; it runs out of *reasons*.

⚠️ **Which means `min_y: -128` was never the fix**, and the earlier measurement that
appeared to confirm it (`64`, "solid to −127") was taken against a world generated in a
previous session under different settings — **not a valid baseline.** Corrected here.

### ⭐ And it re-points the depth work at exactly what is already planned

The fix is not more depth. It is **content in the depth that exists** — which is
precisely what Wall's depth-diving, her artifacts, Art's "deepest layer" entry
condition, and the tide were all designed to put there. The −200..−500 band is not a
problem to solve before that work; **it is the room that work has been asking for.**

⚠️ Open, and worth its own measurement: what generates the ~20% air layer at −550, and
is it reachable or sealed?

## State

Both jars removed; `testgen` back to 218 and `depthtest` restored. **Terralith and
Nyctophobia are cleared for the real install** — they boot, they compose, and they cost
nothing in depth.

---

# ADDENDUM 2 — the deep layer, measured

The open question from the last addendum: *what generates the ~20% air layer at −550, and
is it reachable or sealed?* Answered on a fresh baseline world (218 jars).

## The actual shape of the world

```
  y   575  ┬── ceiling  (576 = "out of this world")
           │
           │   ORDINARY WORLD — surface, then caves
  y  ~-60  ┤   caves begin      0.3% air
  y  -140  ┤   cave peak        5.2% air
  y  -200  ┤   caves END        0.0% air
           │
           │   🔴 DEAD ROCK — 315 blocks of solid deepslate, 0% air
           │
  y  -515  ┤
           │   ⭐ A CAVERN LAYER — 45 blocks tall, up to 38.5% air
  y  -560  ┤
           │   solid again
  y  -592  ┴── BEDROCK
```

**World bounds pinned exactly: `min_y -592`, `max_y 575`, height 1168.**

## The per-slice profile (32×32 = 1024 blocks each)

| y | air | | y | air |
|---|---|---|---|---|
| −490 | 0.0% | | −545 | 29.6% |
| −500 | 0.0% | | −550 | 35.2% |
| −510 | **0.2%** | | −555 | 38.3% |
| −520 | 19.4% | | −560 | **38.5%** |
| −530 | 18.8% | | −565 | 0.0% |
| −540 | 12.6% | | −580 | 0.0% |

## What it is — and is not

⭐ **It is not a mod's deep biome.** Tested against `yungscavebiomes:lost_caves`,
`frosted_caves`, `deep_dark`, `dripstone_caves`, `lush_caves` — all valid registered ids
(a fake id errors with a parse caret; these returned a clean *Test failed*), and none of
them is the biome down there. It reports only `#minecraft:is_overworld`, i.e. the
ordinary surface biome extended downward.

**So the cavern is a byproduct of the noise settings at the bottom of an unusually tall
world, not an intentional layer anyone built.**

⚠️ **Effectively sealed, in this sample.** −500 and −490 are 0.0%; −510 has **2 air
blocks out of 1024**. That is not a passage, but it is not literally zero either, and a
32×32 column cannot prove anything about connections a few hundred blocks away.
**"Unreachable by digging straight down from the cave layer" is proven; "unreachable"
is not.**

## 🔑 What this means for the plan

There is already **a 45-block cavern system at the bottom of the world that no player
has ever seen**, behind 315 blocks of solid rock, in a world nobody knew was 1168 blocks
tall.

⭐ That is not a defect to fix. **It is the deep layer the design has been asking for,
and it already generates.** Art's entry condition wants somewhere that counts as "the
deepest layer"; Wall's depth-diving wants somewhere worth diving to; the artifacts want
somewhere to be. This is the room, and it is free.

⚠️ **What it needs is a way in and a reason to go** — neither of which exists today.
Nothing generates a shaft, nothing hints it is there, and 315 blocks of blind digging is
not an expedition, it is a chore.

⚠️ **And `min_y: -128` in `tectonic.json` is now clearly not doing what was assumed.**
The floor is −592 regardless. That setting should be re-examined rather than carried
into the reset on the strength of a measurement taken against a stale world.
