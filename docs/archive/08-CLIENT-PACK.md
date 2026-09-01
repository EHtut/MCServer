# The client pack — immersion, and running it beside the server

**383 client-side mods.** Built from the same manifest as the server, so the two
cannot drift.

```powershell
.\server\scripts\build-client.ps1 -Zip
```

---

## 1. The audio layer

This is the part the design leans on hardest, and it is built from mods that each
do exactly one job.

| Mod | Job |
|---|---|
| **Simple Voice Chat** | Proximity voice. Distance-attenuated, positional |
| **Sound Physics Remastered** | Reverberation, occlusion and absorption — **applied to voice chat as well as world sound** |
| **AmbientSounds** | Biome and structure soundscapes — wind, water, caves, weather |
| **Sounds** | 170+ replacement and new sound effects |
| **Presence Footsteps** | Footsteps that vary by the surface you are standing on |
| **Drip Sounds** | Water drips land and settle |
| **Entity Sound Features** | Per-entity sound variation, so mobs stop sounding identical |
| **Subtle Effects** | Particles and small sounds for events vanilla leaves silent |
| **Extreme Sound Muffler** | Selectively silence whichever sound turns out to be maddening |

### The cave echo works because of one interaction

Sound Physics Remastered processes **Simple Voice Chat's audio stream**, not just
game sounds. Speak in a cave and your voice reverberates off the walls; speak
through a doorway and it occludes. Neither mod does that alone — the effect is
the pair.

### Raise Sound Limit Simplified is not optional

Vanilla caps concurrent sound sources. Sound Physics plus AmbientSounds plus
footsteps plus 170 new effects plus four people talking will exceed that cap, and
the symptom is **sounds silently dropping out mid-fight** — which reads as a bug
in whatever was making them, not as a limit being hit. RSLS raises the cap and
improves the sound engine's throughput. It is filed `core` for that reason.

### What was deliberately left out

**Dynamic Surroundings** does ambience *and* footsteps *and* weather effects. It
would collide with AmbientSounds and Presence Footsteps simultaneously. One
system per job — the same rule that governs the combat layer.

---

## 2. Performance

You are rendering a 383-mod client **next to a dedicated server on the same
machine**, so this layer is doing real work.

| Mod | Effect |
|---|---|
| **Sodium** | The renderer. The single largest framerate gain available |
| **Sodium Extra** + **Reese's Options** | The dials — fog, particle limits, per-feature toggles — and a usable menu for them |
| **Distant Horizons** | Level-of-detail terrain far beyond render distance, at a fraction of the cost |
| **CreateBetterFPS** | Up to 50% better framerate on Create contraptions **with shaders on**. Precisely this pack |
| **Particle Core** | Particle culling and per-type limits. The horror and magic layers emit enormous particle volumes |
| **Flerovium** | General render optimisation, no visual cost |
| **EntityCulling** | Skips entities hidden behind geometry |
| **ImmediatelyFast** / **MoreCulling** | Batched immediate-mode rendering, aggressive culling |
| **FerriteCore** / **ModernFix** | Memory footprint and load time |
| **Dynamic FPS** | Throttles when the window is not focused — which matters when you alt-tab to the server console |

### The biggest lever is counter-intuitive

**Set render distance LOW (8–12) and Distant Horizons HIGH (64–128).**

Vanilla render distance is expensive per chunk because every chunk is fully
detailed and fully ticked. Distant Horizons draws the same view as simplified
level-of-detail geometry for a small fraction of the cost. Cranking vanilla
render distance and leaving DH low is the most common way to have both mods and
still run badly.

### Nvidium is not an option here

It is NVIDIA-only, and this machine has an **AMD Radeon AI PRO R9700**. Worth
stating because it is otherwise the standard recommendation alongside Distant
Horizons.

---

## 3. Shaders

**Iris** ships in the pack, plus **Euphoria Patches** — which is what gives
Complementary Shaders their Distant Horizons support. Shader *packs* are `.zip`
files, not mods; drop them in `shaderpacks/`.

| Pack | Character |
|---|---|
| **Complementary Unbound** | Dramatic, dark, realistic lighting. The best fit for a horror server |
| **Complementary Reimagined** | Softer and more stylised, slightly cheaper |
| **MakeUp Ultra Fast** | The fallback when frames are tight |

**Rethinking Voxels** and **Photon** are extraordinary and too heavy to run
beside a dedicated server on the same box.

**Distant Horizons + shaders is the fragile combination in this pack.** If the
world flickers or tears at the LOD boundary, lower DH's LOD quality before
blaming the shader; if it still misbehaves, turn shaders off — DH alone still
changes how the world reads.

---

## 4. Running the server on your play machine

This is the constraint that shapes the numbers.

### Memory

| | |
|---|---|
| Server heap | 8 GB (`server/config/user_jvm_args.txt`) |
| Client heap | 8 GB |
| **Total committed** | **16 GB of 61.6 GB** |

Comfortable. Do not raise the client past ~8 GB — Minecraft clients gain nothing
above it and garbage-collection pauses get *longer*, which shows up as stutter
rather than low framerate.

The server uses `-XX:+AlwaysPreTouch`, so it claims its full 8 GB at startup
rather than growing into it. That is deliberate: it makes the client's memory
situation predictable instead of contended.

### CPU

A Ryzen 9 9950X is 16 cores / 32 threads. The server needs a fast main thread
plus a handful of workers; the client needs a fast main thread plus render
threads. There is ample room — but they compete for **single-thread performance**,
which is what Minecraft is bound by on both sides.

If ticks stutter while you play:

1. `spark profiler` on the server — confirm it is actually the server.
2. Drop server `simulation-distance` before touching anything else. It is the
   most expensive server setting and the client cannot exceed it anyway.
3. Lower client render distance and raise Distant Horizons to compensate.

### Use the discrete GPU

This machine has both an AMD Radeon AI PRO R9700 and integrated Radeon graphics.
Windows sometimes hands Java the integrated one. Confirm in
**Settings → System → Display → Graphics** that `javaw.exe` for your launcher is
set to **High performance**. A client mysteriously running at 40 fps with Sodium
installed is almost always this.

### Start order

Start the **server first**, let it reach `Done (…)`, then launch the client.
Both compete hardest during startup — the server generating configs and the
client loading 383 mods at once will make each look broken.

---

## 5. Verification

The client pack is checked the same way as the server:

```powershell
python tools\check_jars.py C:\MCServer\clientpack\mods    # every jar is a NeoForge mod
python tools\check_deps.py C:\MCServer\clientpack\mods --side=CLIENT
```

Both are clean as of the last build: **383 jars, 0 missing dependencies, 0
version conflicts, 0 declared incompatibilities.**

Two problems that check caught before anything shipped:

- **Figura's v5 addon** — Figura itself declares it incompatible, with the reason
  *"This addon's features are already included in this Figura version!"*
- **SmartBrainLib and Oh The Trees You'll Grow** are marked server-only on
  Modrinth but are required *client-side* by Occultism and Oh The Biomes We've
  Gone. Both are forced to `both` in `tools/gen_pack.py`. Without that override
  the client refuses to start with "requires X" — while X sits happily on the
  server, looking fine.
