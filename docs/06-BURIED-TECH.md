# Buried tech — depth as the world's only axis

The design device that makes this pack cohere. Ethan's, evolved over two
conversations from "modern things should be buried underground" into a full
vertical stratification.

---

## The idea

**A medieval surface over the ruins of a technological age.**

Depth is the *single* axis for everything — safety, difficulty, and technology
all move together as you descend. The surface is peaceful, alive and pre-modern.
The deep is hostile, dark, and full of salvage from whatever came before.

This does three things at once:

1. **It justifies the guns.** TaCZ stops being an anachronism the pack tolerates
   and becomes *loot with a reason to exist* — recovered, not manufactured.
2. **It fixes the horror layer.** Six stalkers competing for attention was the
   problem. Against a calm surface, a rare anomaly is *far* more frightening.
   "This world isn't right" only lands if the world is mostly right.
3. **It makes descending a decision.** Going down is a choice with a cost, not
   something that happens while mining.

---

## The strata

| Band | Y | Character | Hostiles | Technology |
|---|---|---|---|---|
| **Surface** | ≥ 40 | Medieval, alive, safe | **None**, day or night. Rare horror anomalies only | Medieval + Create clockwork |
| **Shallow** | 0 – 39 | Mining, unease | Vanilla hostiles, capped at 40 concurrent | Nothing modern |
| **Deep** | −64 – −1 | Genuinely dangerous | Full roster, Cataclysm bosses | First salvage — scrap and parts |
| **Abyssal** | −128 – −65 | The buried age | Parasites, infection, the worst of it | Working weapons, security systems, drones |

Plus two **dimensional** layers below all of it — The Undergarden and the
Otherside (through an Ancient City portal, overhauled by Arda's Sculks).

The peaceful line sits at **y 40**, not 55, deliberately: surface bases can have
cellars and shallow mines without inviting threat. You have to *choose* to go
down.

---

## The four pieces

### 1. World depth — `pack/datapacks/mcserver_depth`

The overworld is extended from y −64 to **y −128**, doubling the depth below
bedrock while leaving the build ceiling at 319.

Built by `tools/make_depth_datapack.py`, which **extracts the real vanilla
worldgen files out of the server jar** and edits only `min_y` and `height`. It
does not reproduce them from memory, because two files must agree exactly:

| File | Governs |
|---|---|
| `dimension_type/overworld.json` | how deep the world **is** |
| `worldgen/noise_settings/overworld.json` | how deep terrain is **generated** |

Change the first alone and the generator produces **nothing** below its noise
range — a void band from −128 to −64, discovered only when somebody digs into it.

**What follows automatically:** bedrock placement is expressed relative to the
world bottom (`above_bottom`), so the floor moves to −128 on its own. The
deepslate transition is absolute at y 0, so the whole new band is deepslate.

**Known consequence, stated not discovered:** vanilla's terrain-shaping gradient
clamps at −64, so the extra 64 blocks generate *denser and less cavernous* than
normal depths — largely solid deepslate with sparse voids. For the band that is
meant to be the hardest part of the world to reach, that is arguably correct. It
is a consequence of the approach, not a bug.

> **This cannot be applied to an existing world.** It changes worldgen. The world
> must be generated with the datapack already present.

### 2. Spawn stratification — `pack/config/incontrol/spawn.json`

In Control denies hostile spawns in the overworld at **y ≥ 40**, at any time and
any light level, and caps the shallow band at 40 concurrent hostiles.

It denies by the `hostile` *category* rather than by listing mobs — with ~390
mods, an enumerated list rots the moment anything updates.

See `pack/config/incontrol/README.md` for the horror-exemption question, which
needs verification on the first night of real play.

### 3. Recipe gating — `pack/kubejs/server_scripts/buried_tech.js`

Removes all crafting recipes from `tacz`, `securitycraft` and `diligentstalker`,
so their output can only be found.

**Ammunition stays craftable** (Ethan's ruling). Weapons are irreplaceable
salvage; bullets are manufacture. Without that, four players run dry after two
fights and the guns become ornaments. Gunpowder Ore and Craftable Gunpowder are
already in the pack to support that economy.

The exclusion is part of the removal itself — KubeJS has no "un-remove", so a
bulk delete followed by a re-add would destroy the mod's own recipe rather than
restore it.

### 4. Loot placement — NOT BUILT

The remaining piece: modern gear injected into deep-structure loot tables only.

Until this lands, the guns are **unobtainable** — uncraftable by piece 3 and not
yet placed anywhere by piece 4. That is a worse state than before, and it is why
this is the next task rather than a nice-to-have.

---

## A peaceful surface has a mechanical cost

If nothing hostile spawns, the vanilla mob cycle stops doing its job — and it is
also what removes entities. Hunted animals are never replaced, and the surface
slowly empties into a beautiful, silent nothing.

Three mods answer that directly:

| Mod | Job |
|---|---|
| **Respawning Animals** | Animals spawn and despawn like monsters do. Near-mandatory here |
| **Spawn** | Wilderness overhaul — many more animals, ambience, biome life |
| **Cosy Critters** | Birds, bugs, small atmospheric life |

Plus **Field Guide**, so the peaceful surface has something to *do*: discover and
record what lives there, between descents.

---

## Verification — every failure here is silent

Nothing in this design fails loudly. A malformed spawn rule is ignored. A wrong
item id preserves nothing. A datapack that disagrees with itself produces void
that nobody sees for a week.

1. **Depth** — generate a throwaway world, dig below −64. Expect stone, not void.
   Bedrock at −128..−124, not −64.
2. **Surface peace** — stand outside at night with `doMobSpawning true`. Nothing
   hostile should arrive.
3. **Horror exemption** — confirm the stalkers still appear. If rule 1 silenced
   them, add an exemption above it.
4. **Recipe gating** — `/kubejs reload`, then search "tacz" in the recipe viewer.
   Weapons: no recipe. Ammunition: still has one.
5. **Obtainability** — confirm the guns are actually placed in deep loot. Skipping
   this is how you ship a mod nobody can ever acquire.
