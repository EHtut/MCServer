# Theme audit

Audit of all 411 mods against the rulings made during the category review.
Run before the first download, so problems are cheap to fix.

## The rulings being audited against

| # | Ruling |
|---|---|
| **R1** | **Period.** Preindustrial-to-fantasy on the surface. Modern content exists only as salvage from deep underground. |
| **R2** | **Create ceiling.** Steam and early electricity. No oil, diesel, concrete or sci-fi digital storage. |
| **R3** | **TaCZ is the sole modern weapon**, reframed as buried salvage. |
| **R4** | **Presentation.** Melee earns its slot with movesets and animation, not stat lines. |
| **R5** | **Ease.** One system per verb. One dodge, one parry, one camera. |
| **R6** | **Kinetic storage.** Storage should be physical — carried, or built out of Create. |
| **R7** | **Magic depth.** Ars spine plus four alternatives, not eight parallel progressions. |

---

## Verdict

**The pack holds the theme well on six of seven rulings.** Create sits exactly at
steam-and-early-electricity, magic is the Ars spine plus precisely four
alternatives, melee is animation-first with no stat-stick weapon mods, storage is
kinetic, and there is one dodge, one parry, one camera, one recipe viewer.

**R1 is the exception, and it is the headline finding.** The period rule is
currently *aspirational rather than enforced* — see F1.

---

## F1 — CRITICAL: the buried-tech device is not implemented

**Severity: high. This is the difference between the theme working and not.**

TaCZ rifles, Security Craft laser grids and Diligent Stalker's camera drones are
all in the pack, and all three are **craftable on the surface today**. The entire
justification for their presence — that modern technology is salvage recovered
from deep underground — exists only in this repo's prose. In game, on day two,
somebody crafts an assault rifle at a workbench in a medieval village.

Nothing else in this audit matters as much. Until the KubeJS recipe stripping,
structure depth restriction and deep-loot injection are built, R1 is not a
property of the server; it is a note in a document.

**Action: task #6 must land before the world is considered themed.**

---

## F2 — Two death-recovery systems (R5)

`gravestone-mod` places a grave holding your inventory. `corpse` leaves a body
holding your inventory. They do the same job, and running both means one of them
silently wins on death — which is exactly the kind of unpredictability you do not
want at the worst moment in a lethal pack.

**Recommend: keep `corpse`, cut `gravestone-mod`.** Corpse is the more
atmospheric of the two — retrieving your body from where it fell suits the horror
layer better than a tidy headstone.

## F3 — Two chunk-loading systems (R5)

`create-power-loader` (in-world, kinetic, Create-native) and `chunk-loaders`
(tiered utility blocks). Same verb, two implementations.

**Recommend: cut `chunk-loaders`.** Power Loader is both kinetic (R6) and
in-theme; the other is a generic utility block.

## F4 — Village overhaul collision

Four mods now touch villages:

| Mod | What it does |
|---|---|
| `epic-structures-villages` | **Completely replaces** vanilla villages with medieval cities |
| `underground-village,-stoneholm` | Adds underground villages |
| `create-better-villagers` | Alters villager behaviour |
| `dungeons-and-taverns` | Adds taverns and settlements |

You chose Epic Structures precisely *because* it replaces the others. Stoneholm
and Better Villagers arrived as transitive dependencies, not as choices.

## F5 — The Steamworks Realm dependency chain

`create-dimension,-steamworks-realm` → `create-better-villagers` → `stoneholm` →
`better-library`.

**Four mods for one flavour dimension**, and it is the direct cause of F4. This
was my suggestion during the Create review, approved as part of a block of
twelve. It is the weakest thing in the pack per mod spent.

**Recommend: cut the whole chain (−4).** Stoneholm's underground villages are
genuinely on-theme, so keeping *just* Stoneholm and `better-library` (−2) is a
reasonable alternative.

## F6 — Dimension sprawl

Six destinations beyond the vanilla three: The Aether, The Undergarden, The
Bumblezone, Nullscape, Cataclysm Dimension, Steamworks Realm.

For four players on one world, most will never be visited, and each one costs
worldgen time, RAM and first-boot duration. This is not a theme violation — all
six are fantasy-appropriate — but it is content nobody will see.

## F7 — Four cave-generation mods

`yungs-better-caves`, `yungs-cave-biomes`, `spelunkery`, `underground-worlds`.
Already known and deliberately deferred to the test world (task #8). Flagged here
because the buried-tech device depends on caves being coherent.

## F8 — Temperature systems stack

`serene-seasons` (seasonal temperature), `frostiful` (freezing) and `scorchful`
(heat) all model temperature. They are known to interact rather than conflict,
but three sources feeding one player-facing mechanic needs a first-boot check.

## F9 — Stat-stick residue against R4

R4 was applied rigorously to melee — Simply Swords and Medieval Craft were cut
for being weapons without movesets. Three mods survive that are the same idea in
a different slot:

| Mod | Issue |
|---|---|
| `mythic-upgrades` | Gem-based gear upgrades — pure numbers |
| `advanced-netherite` | More netherite tiers — pure numbers |
| `cataclysm-tools` | Tools from boss materials — mostly numbers |

Defensible: gear *progression* is different from combat *feel*, and Apotheosis
already provides affixed loot. Raised for consistency, not condemned.

## F10 — Distant Horizons + Sodium + Iris

Distant Horizons is a **beta** build, and DH + Sodium + Iris is the client-side
combination most likely to misbehave. All three are wanted. Watch during the test
world.

## F11 — Minor: miscategorisation

`legendary-tooltips` sits in the horror category; it is cosmetic QoL. Harmless,
but it distorts the category counts.

---

## What passed cleanly

- **R2** — no oil, no diesel, no concrete, no AE2. `create-meta-logistics` covers AE2's *function* without importing its fiction.
- **R4** — Epic Fight is the melee engine, no Better Combat, no Combat Roll, no weapon mod that Epic Fight cannot animate.
- **R5** — one dodge, one parry, one camera, one recipe viewer (EMI; Create Horse Power was cut rather than admit JEI).
- **R6** — Carry On, Create: Storage and Storage Drawers. Traveler's and Sophisticated both cut.
- **R7** — Ars spine + Iron's Spells, Goety, Occultism, Theurgy. Exactly four.
- **Audio** — Simple Voice Chat, Sound Physics Remastered, AmbientSounds, plus Revervox and Mimicked using voice as a horror mechanic. This was the first thing asked for and it is now the strongest layer in the pack.
- **Safety** — The Broken Script cut; Mebahel's Dwarven Automatons cut for shipping a Fabric jar under a NeoForge tag.
