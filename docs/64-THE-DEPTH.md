# 64 — The depth · why the bottom of the world is an empty box

> **STATUS 2026-08-24** — ✅ **DIAGNOSED, FIXED, AND VERIFIED ON A REAL GENERATED WORLD**
> (§6). The fix cannot take effect on the current world (§4) and does not need to: Ethan
> is regenerating once scope settles. ⭐ **The new depth is genuinely cavernous, not a
> boring dig** — measured, §6.

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

---

## 6. ✅ VERIFIED ON A THROWAWAY WORLD — 2026-08-24

§4 said the fix could not be tested without regenerating. That was true of *this* world,
not of the question — so a **separate instance** was built and a real world generated
under the fixed config, with Ethan's world never loaded.

**The rig** — `C:\MCServer	estgen`, still present and reusable:

| | |
|---|---|
| `mods`, `libraries` | **NTFS junctions** to the real instance — no multi-GB copy |
| `config/` | a real copy, so worldgen settings can be varied independently |
| `depthtest/datapacks/` | all nine `mcserver_*` packs, staged **before first boot** so the dimension is extended from chunk zero |
| ports | left identical, and the real server stopped first — so `tools/rcon.py` works unchanged |
| seed | `8675309`, fixed, so a re-run is comparable |

🚨 **Tear it down with `cmd //c rmdir mods` FIRST.** Those are junctions; `rm -rf` through
one deletes the *target*, which is the real mods folder.

### ⭐ THE FIX WORKS

Solid ground at every sampled column from y=0 straight down to **−127**. Under the old
config the identical test read air from −65 down.

### ⭐⭐ AND IT IS NOT A BORING DIG — which was the real question

`docs/64 §5` asked whether 64 more blocks of deepslate is *scale* or just a longer dig.
Measured as air-fraction per Y level, 1024 blocks sampled per level:

```
    y     air    %
    0     108   10.5%   ####          normal deepslate caves
  -20     112   10.9%   ####
  -40       6    0.6%
  -55       0    0.0%
  -63      12    1.2%     <- the OLD floor
  -66      64    6.2%   ##            ⭐ the new band begins
  -70      56    5.5%   ##
  -90       2    0.2%
 -100      89    8.7%   ###           ⭐ comparable to y=0
 -110      37    3.6%   #
 -120       0    0.0%                 solid near the true floor, as expected
```

🔑 **−66 to −110 carries real cave systems — 8.7% air at −100 is close to y=0's 10.5%.**
The extra depth is explorable, not a wall.

⚠️ **And one genuine consequence to expect:** the band just above the old floor (−40 to
−63) is now nearly solid, 0–1.2%. The bottom taper that used to squeeze caves out at −64
has moved down with `min_y`. So the *shape* of a descent changes — a quiet stretch in the
deepslate, then it opens up again below the old floor. That is arguably better than
ending at a lava lake, but it is a change, not a free win.

### ⚠️ TWO INVALID MEASUREMENTS ON THE WAY, BOTH CAUGHT BY CONTROLS

1. `execute if block … run say X` — `say` output does not return through rcon, so grepping
   the response matched the **echoed command** and reported the sky as air-confirmed. Use
   `execute if block <x> <y> <z> <block>`, which answers `Test passed` / `Test failed`.
2. `fill … minecraft:air replace minecraft:air` to count air **is a no-op** — zero blocks
   *change*, so it always reports "No blocks were filled", including in open sky. Counting
   needs a real substitution: `fill … minecraft:glass replace minecraft:air`, which is
   destructive and therefore only appropriate in a throwaway world.

🔑 **Both were caught the same way: assert the method against a known answer first.** Open
sky must read 1024/1024. Neither error would have been visible in its own output.
