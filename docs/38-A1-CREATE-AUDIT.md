# A1 — the Create audit

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
