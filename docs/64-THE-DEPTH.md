# 64 — The depth · why the bottom of the world is an empty box

> **STATUS 2026-08-24** — ⭐ **DIAGNOSED AND THE FIX IS STAGED.** It cannot take effect on
> the current world (§4) and does not need to: Ethan is regenerating once scope settles.

## 0. 🔴 THE COMPLAINT — Ethan, 2026-08-24

> *"the world is not deep enough. like at all. we have a cave that paths down to the
> bottom of the world and it just sorta ends in lava lakes that we visit hundreds of
> times. there's no real scale."*

Ruled **A** — fix the generator rather than authoring an Abyss by hand or reverting.

---

## 1. ⭐ WHAT IS ACTUALLY WRONG — measured, with controls

Sampled live over rcon. **The first attempt was garbage and is worth recording as a
method note:** `execute if block … run say X` returns nothing through rcon, so grepping
the response matched the *echoed command* and reported every block as air, including the
sky. The form that returns a real result is `execute if block <x> <y> <z> <block>`, which
answers `Test passed` / `Test failed`.

| depth | −20 → −63 | **−65 → −128** |
|---|---|---|
| every column sampled | **SOLID** | **air, without exception** |

Bedrock sits at −63/−64 — the *vanilla* floor — with **64 blocks of sealed void beneath
it that nothing generates in and nothing can reach.**

🔑 **So the complaint is not "the world is shallow". The extra depth already exists and is
empty.** That is a far more tractable problem, and it also explains the lava lakes: the
bottom is a hard, flat, featureless boundary at the identical Y every time. There is no
scale because there is no variation.

⚠️ **And it is not stale chunks.** A chunk generated fresh at x=50000 under the current
setup came out void below −64 too. A world refresh *on its own* would not have fixed it.

---

## 2. 🔴 THE GENERATOR'S OWN DOCSTRING PREDICTED THE OPPOSITE

`tools/make_depth_datapack.py`:

> *"Known consequence, **stated rather than discovered**: vanilla's terrain-shaping
> gradient clamps at −64, so the extra 64 blocks generate **DENSER** and less cavernous
> than normal depths — largely solid deepslate with sparse voids."*

**It predicted solid. It is air.** The reasoning was sound for *vanilla* — `overworld/depth`
is a `y_clamped_gradient` from −64 (1.5, solid) to 320 (−1.5, air), and clamping below −64
does mean "more solid".

⚠️ The reasoning was just about the wrong generator. ⭐ And the docstring flagged its own
risk in the phrase *"stated rather than discovered"* — nobody discovered it for weeks.

---

## 3. 🔑 TECTONIC OWNS THE TERRAIN, AND ITS FLOOR IS STILL −64

The datapack's `noise_router` is 15 reference strings like
`minecraft:overworld/noise_router/final_density`. Those files exist in **neither** vanilla
nor the datapack — they are shipped by **Tectonic**, a worldgen mod, as a built-in
datapack inside its jar.

⚠️ **This briefly looked like the generator had mangled the file**, because a diff against
the raw vanilla jar showed all 15 router entries replaced and a surface rule dropped. It
had not: the tool extracted from the *running server's merged data*, which is vanilla plus
Tectonic. Checking whether anything registered those names is what settled it.

**And Tectonic has its own floor, in its own config:**

```json
"global_terrain": { "min_y": -64, "max_y": 320, "vertical_scale": 1.125 }
```

🔑 **The dimension goes to −128. The mod that actually shapes the terrain still generates
for −64.** That is the void, exactly.

⭐ Tectonic even ships an option written for this case — `caves.ore_fix`, *"alters ore
generation to generate at more acceptable levels **when min_y is lowered**"* — which was
`false`.

---

## 4. ⚠️ WHY THE FIX CANNOT BE TESTED ON THIS WORLD

Both values were changed (`min_y: -128`, `ore_fix: true`), the server restarted, and a
virgin chunk at x=70000 was generated and sampled. **Still void below −64.**

**Because worldgen is baked into the world at creation.** `level.dat` carries
`WorldGenSettings`, `generator`, `dimensions`, `min_y` and a `tectonic` blob — a snapshot
taken when the world was made. Changing a mod's config afterwards does not retroactively
change the generator this world runs, *even for chunks that do not exist yet*.

🔑 **So the fix is staged and correct and simply cannot apply here.** It applies the moment
the world is regenerated, which Ethan is already planning:

> *"yea this world needs to be regenerated once the scope stops getting larger."*

⚠️ **THIS IS THE THING TO REMEMBER AT REGEN TIME.** The config is set now so it cannot be
forgotten later, and `tectonic.json.bak-2026-08-24` is the pre-change file.

---

## 5. What to check on the first regenerated world

1. **Sample a column below −64.** It should be solid deepslate with caves, not air. Use
   `execute if block <x> <y> <z> minecraft:air` — never the `run say` form (§1).
2. **`vertical_scale: 1.125`** is unchanged and untested against 448 blocks of range. If
   terrain reads as stretched or smeared, that is the dial.
3. **Ore distribution**, now that `ore_fix` is on — it moves where ores sit, and nobody has
   seen its output.
4. ⭐ **Whether the extra 64 blocks are actually interesting.** Solid deepslate with sparse
   voids is *more* depth but not necessarily more scale; if it reads as a long boring dig,
   the answer is authored content down there (option B, `docs/62`-style) layered on top of
   a working generator — not instead of one.
