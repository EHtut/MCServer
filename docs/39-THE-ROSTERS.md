# The rosters — where every audited mod now lives

*Generated from `tools/mod_taxonomy.json` (`tools/classify_mods.py`). **Regenerate
after any mod change** — these counts are evidence and evidence goes stale.*

**281 shipped mods.** Audit state: **A1 forge ✅ · A2 wall ✅ · A3 art ✅**.
A4–A8 are still regex guesses and are NOT listed here — only audited groups appear.

---

## WALL — minions (4) ✅ A2

The path was rebuilt this session. SecurityCraft is gone as its base, MineColonies
was dropped (Modrinth has only a 1.18.2 Forge build and our toolchain is
Modrinth-only), and **Occultism** was shipped in its place from cache.

* `automaticons`
* `goety`
* `goety-cataclysm`
* `occultism`

**Goety fights for you, Occultism works for you.** Necromancy thralls versus summoned
spirits bound to jobs — mining, crushing, transport. Different verbs, no R5 collision.
Occultism was R7's designed fourth alternative and had been downloaded but never
shipped.

**Cut:** `theurgy` (never touched), `security-craft` (same), `guard-villagers`
(redundant).

## ART — magic (6) ✅ A3

* `ars-creo`
* `ars-lumos`
* `ars-nouveau`
* `arsdelight`
* `easy-magic`
* `magic-vibe-decorations`

`ars-nouveau` is the anchor. `ars-creo` is the Create bridge, `arsdelight` the
Farmer's Delight bridge — **integration only**, as ruled. `ars-lumos` is client-side
emissive textures. `magic-vibe-decorations` is queued for the decor cull.

**Cut:** the four RPG class mods (`berserker`, `elemental-wizards`, `forcemaster`,
`witcher`) for competing with the path system, plus `wizards` and `skill-tree`.

⚠️ **`spell-engine` and `spell-power` moved to LIBRARY, not cut** — `archers` and
`archers-expansion` ride on them. Same for `azurelib-armor` and `more-rpg-library`;
cutting the latter crashed the server via a mixin no dependency list declares.

**Supplementary magic is Iron's Spells, classless.** Not yet shipped.

## FORGE — Create (27) ✅ A1

* `copycats`
* `create`
* `create-aeronautics`
* `create-ars-nouveau`
* `create-big-cannons`
* `create-bionics`
* `create-bits-n-bobs`
* `create-compatible-storage`
* `create-connected`
* `create-deco`
* `create-design-n-decor`
* `create-dragons-plus`
* `create-dreams-and-desires`
* `create-encased`
* `create-enchantment-industry`
* `create-framed`
* `create-let-the-adventure-begin`
* `create-misc-and-things`
* `create-railways-navigator`
* `create-sound-of-steam`
* `create-steam-n-rails-1.21.1`
* `create-storage-neo-forge`
* `create-stuff-additions`
* `create_oxidized`
* `createaddition`
* `createbetterfps`
* `numismatics`

**Ruled core:** `create`, `create-aeronautics`, `create-big-cannons`,
`create-bionics`, `create-ars-nouveau`, `numismatics`.

⏸️ **Pending the world reset:** the decoration cull — `create-design-n-decor`,
`create-deco`, `create-framed`, `create-bits-n-bobs`. Held because **cutting a block
mod deletes blocks already placed** (356 MB world, 1,572 region files).

⏸️ **Pending moves:** `createbetterfps` → perf · `create-let-the-adventure-begin` →
worldgen (it ships 30 structures, so it is a genuine worldgen mod, not a filing slip).

---

## SUPPLEMENTARY (13) — new bucket, created this session

> Not path-specific · rounds out kits · **as little crafting as possible** · extra
> items, weapons and gear.

* `artifacts`
* `bellsandwhistles`
* `carry-on`
* `chipped`
* `framedblocks`
* `handcrafted`
* `interiors`
* `macaws-furniture`
* `macaws-roofs`
* `relics-mod`
* `runes`
* `storage-delight`
* `storagedrawers`

⚠️ This bucket is **provisional** — it was created by moving Wall's decoration out,
and has not itself been audited. Several entries are pure decoration and may not
survive the rule that supplementary content should be *found*, not built.

---

## Not yet audited

`salvage-ranged` (5) · `blade-melee` (7) · `worldgen-structures` (41) ·
`mobs-enemies` (24) · `visuals-audio` (41) · `qol-ui` (39) · `perf-server` (32) ·
`library` (42)

**A4 is blade + salvage**, and both are expected to come back **GROW** — seven
animation mods and one gun mod are not modpacks.
