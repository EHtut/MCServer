# 66 — One Dimension + Tectonic: the test world

> Ethan, 2026-08-29: *"generate the test world with one dimension and tectonic"*
>
> Run in `C:\MCServer\testgen` (218 mods, the same instance the depth test used).
> **Nothing here touched the live pack or the live world.**

---

## The verdict: they compose. The predicted collision does not happen.

I expected One Dimension and Tectonic to fight over the bottom of the world — both
want it. **They do not.** Measured on a generated world:

```
  y  1279  ┬── world ceiling
           │   END band      end_stone islands confirmed at 0,0 (3 hits)
  y ~1040  ┤
           │   (gap 688, per the mod's own band config)
           │
           │   OVERWORLD     caves at −100, solid below, Tectonic terrain
  y  −128  ┤ ← Tectonic's min_y
  y  −129  ┤ ← Nether ceiling
           │   NETHER band   netherrack confirmed at −160/−200/−250
  y  −320  ┴── world floor
```

**The Nether ceiling is −129 and the Overworld floor is −128.** Zero gap, zero overlap.
One Dimension's band config declares `gap: 0` between nether and overworld, so it
places the Nether directly beneath whatever the Overworld floor is — and Tectonic's
`min_y: -128` is what sets that. They agree by construction.

⭐ **Side effect worth having:** the Nether band ends up **192 blocks tall** (−320 to
−129) against vanilla's 128. Tectonic's extra depth comes out of the world's budget,
not out of the Overworld.

**World extent is fixed by the mod**, not by Tectonic: `dimension_type/one_dimension.json`
declares `min_y: -320, height: 1600` → y −320..1279. Probed and confirmed exactly:
y −321 and y 1280 both answer *"That position is out of this world!"*

---

## 🔴 THE TRAP: with the wrong `level-type` it does NOTHING, silently

The first generation produced a **completely normal Tectonic world** — bedrock at −127,
no netherrack anywhere, no nether biome at any height, world capped at −128..319.

**No crash. No warning. No log line.** One Dimension loaded fine, printed
`[OneDimension] Common init complete.`, and simply did not stack.

The cause is `"preselectWorldType": true` in `config/codxlib.onedimension.json` —
stacking is a **world-creation** property, and the dedicated server had
`level-type=minecraft:normal`. The mod's runtime commands (`/onedimension menu`,
`voidgate`, `worldwrap`, `water`, `spawners`) contain **no stacking control at all**,
because by then it is too late.

🚨 **The fix, and it must be set BEFORE the world is generated:**

```
level-type=onedimension:one_dimension
```

⚠️ This is exactly the failure mode this project keeps meeting: *"I failed" and "I found
nothing" must never share a return value.* A silently-vanilla world and a correctly
stacked one look identical until you probe for netherrack.

---

## ⚠️ Two other things the test found

**1. A missing dependency crashed the first boot.** `Mod onedimension requires codxlib
1.3.6 or above`. Now on `codxlib-1.5.1-neoforge+1.21.1.jar`. Both jars are
sha512-verified against Modrinth and live **only in testgen**, not in the pack manifest.

**2. 🔴 Distant Horizons and One Dimension conflict, and it gets worse when stacking is
on.** `codx.onedimension.util.DhBandLight.stackedLevel` throws inside DH's
`bakeDataSourceSkyLight`:

| world | DhBandLight exceptions |
|---|---|
| unstacked (level-type wrong) | 14 |
| **stacked (correct)** | **88** |

The server runs and generates correctly regardless — this is DH's LOD sky-lighting, not
terrain. But DH is a headline visual mod in this pack and 88 exceptions in one short
generation run is not noise. **Unresolved.** Options not yet explored: a DH config for
extended-height worlds, a newer One Dimension build, or dropping DH.

---

## What this does NOT prove

* **No progression audit.** Fortresses, bastions, End cities and their loot were not
  located — only that the *biomes* and base terrain generate. The blaze-rod question
  (Create's mid-game gates on blaze burners) is still open and is the reason the
  content-first sequencing in `65`/the dimension plan still stands.
* **No mob-spawn check.** `"overworldOnlySpawners": true` is set by default and its
  effect on the Nether band's spawners is unmeasured.
* **Nothing about performance.** A 1600-block world column with three biome regimes is
  a materially bigger chunk generation job than vanilla.
* **The live pack is untouched.** These jars are not in `pack/mods/` and there is no
  packwiz metadata for them yet.

---

## Reproducing

```
level-type=onedimension:one_dimension     # server.properties, BEFORE first generation
config/tectonic.json  →  "min_y": -128, "ore_fix": true
mods/  →  onedimension-3.0.1-neoforge+1.21.1.jar  +  codxlib-1.5.1-neoforge+1.21.1.jar
```

Probe idiom — **`execute if biome` / `execute if block`**, never `run say`, which greps
back your own echoed command:

```
execute if biome 0 -200 0 #minecraft:is_nether     → Test passed / Test failed
execute if block 0 -321 0 #minecraft:air           → That position is out of this world!
```

⚠️ Force-load first (`forceload add -16 -16 16 16`) or every probe answers
*"That position is not loaded"*, which is not the same as *"there is nothing there"*.

Previous worlds preserved, not deleted: `depthtest.pre-onedimension` (the depth test)
and `depthtest.vanilla-notstacked` (the silent-failure run, kept as the counter-example).
