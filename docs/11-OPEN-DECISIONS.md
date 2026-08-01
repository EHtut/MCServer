# Open Decisions

**Most of this was answered 2026-08-01.** What remains is at the top; the
answered items are kept below with their resolutions so the reasoning survives.

## STILL OPEN

| | |
|---|---|
| **NEW-1** | Add `enchantments-encore` for more enchantment variety, or tune Apotheosis first and decide after? Apotheosis is already a full affix/rarity system and has never been configured. Recommend: tune first. |

Everything else is answered. The build queue (D0-D6) is in `10-DEPTH-LOOP.md`.

---

## RESOLVED THIS ROUND

- **B4 Epic Knights weapons** - keep. The 18 missing movesets are a datapack fix
  (`data/epicfight/capabilities/weapons/`), planned as D5. Likely a
  `minecraft:axe` vs `epicfight:axe` namespace error.
- **Iron's Spells n Spellbooks** - KEEP. "no cut iron's spells".
- **All melee should have movesets** - achievable by datapack, no new mod, D5.
- **"Epic Knights gets weak really fast"** - a progression-tuning gap, not a mod
  gap. Apotheosis already provides the rarity curve; bind it to depth.

---

---

## ANSWERED

Everything found during the 2026-07-31 → 08-01 audit and design sessions that
still needs Ethan's call. Each has a recommendation, so "yes to all recommended"
is a valid answer.

Settled items are at the bottom so they are not re-litigated later.

---

## A. Blocks building the depth loop

### A1. The creeper horde ✅ **(b) - they CAN breach the base**

> "no creepers, i honestly don't like creepers to begin with. I do need a horde
> of them blowing up my stuff"

Excluding creepers from **nemesis selection** is settled. The horde is not,
because taken literally it contradicts the rule the whole design rests on:
*death costs the run, never the base.*

| | |
|---|---|
| **a. Perimeter threat** ⭐ | Creepers come for players; `mobGriefing` suspended during invasions. Keeps the menace, keeps the rule. |
| **b. They can breach the base** | Real stakes, real risk of losing hours of building. Legitimate — but it is a deliberate reversal of the rule, not a detail. |
| **c. No horde** | The line was dry and there is no creeper wave. |

**Recommend (a).** On a four-person server where one person built the factory,
base destruction is the likeliest thing to make someone stop playing.

### A2. How the deep-only resource is made ✅ **neither - gate existing drops by depth**

| | | download |
|---|---|---|
| **a. Repurpose an existing item** ⭐ | components (`item_name`, `lore`) on something already in the pack | none |
| **b. KubeJS-registered item** | real item + texture, script and resourcepack synced by packwiz | none manual, but a **sync failure = client cannot join** |
| **c. Write a mod** | most control | not worth it for one item |

**Recommend (a).** The Vault Casing only needs to be *mechanically* distinct —
a gate on ammo crafting. Build (b) later if several bespoke items are wanted.

### A3. Which item to repurpose

Cleanest is an item type with **no other source in the pack**, so the item itself
is the gate and no component-matching is needed. SecurityCraft's currently
unobtainable items are already becoming Vault loot and are the obvious pool.

**Needs:** a pick, or permission to choose one and report it.

### A4. Nemesis ✅ **(a) one collective nemesis**

| | |
|---|---|
| **a. One collective nemesis** ⭐ | the group's most-died-to mob, scaled by total group deaths |
| **b. Per-player, staggered** | each player's own nemesis, spawned in sequence |

**Recommend (a).** Four simultaneous bosses is chaos; one shared nemesis reads
instantly and still comes from the group's real history.

### A5. Respawn ✅ **spectator in invasions; instant at bed otherwise, no death screen**

| | |
|---|---|
| **a. Spectator until the wave breaks** ⭐ | dead players spectate; stay in the event, cannot act |
| **b. Full lock** | Ethan's original — no respawn until everyone is dead |

**Recommend (a)**, with (b) as a config toggle. Under (b) the first player to die
sits out a long fight doing nothing.

### A6. Cycle numbers ✅ **base 30 / floor 10 as proposed**

Agreed: the cycle shortens the longer the group survives. Needs bounds, or a
competent group earns a permanent invasion.

**Recommend:** `BASE = 30` days, `FLOOR = 10` days, and deaths during an invasion
push the cycle *longer* — a group that barely won gets breathing room.

---

## B. Mods with a gameplay consequence

### B1. Create x Ars Compact ✅ **KEEP the brass gate - "it merges ars and create"**

Its own compaction recipes are dead (they need a fluid from an uninstalled mod).
But it **also overrides 39 Ars Nouveau recipes, swapping gold for brass** — and
that part works. So there is currently no magic progression until Create brass,
and nobody chose that.

| | |
|---|---|
| **a. Keep the gate** | "gears meet glyphs" — magic requires industry. Write it into the design docs so it is intentional. |
| **b. Cut the mod** | Ars returns to its normal recipes; the dead compaction recipes go too. |

**No recommendation** — this is a taste call about how the two pillars relate,
and you play both.

### B2. Cataclysm Spellbooks ✅ **CUT** - Ars is the magic pillar

20 of its own items are unregistered (the whole technomancy branch: gauntlets,
braces, the Excelsius upgrade chain, 4 named weapons). Spellbooks and rings work.

**Recommend: keep and version-check.** Cutting working content is not cleanup.

### B3. Two parry systems ✅ **CUT Shield Expansion** - Epic Fight is the parry

`epicfight-common.toml` has `initialMode = 1`, so Epic Fight battle mode is
default and it owns shield right-click. Shield Expansion hooks the vanilla
blocking path and **shows a stamina HUD and parry-window tooltips for a system
that is not the one responding to your clicks.**

`07-THEME-AUDIT.md` counts Epic Fight as the one parry system;
`modlist.json` calls Shield Expansion "The ONE parry system". Both cannot be true.

| | |
|---|---|
| **a. Epic Fight wins, silence Shield Expansion's HUD** ⭐ | one keybind change, keeps the mod for vanilla-mode players |
| **b. Cut Shield Expansion** | cleaner, loses its shield tiers |

### B4. Epic Knights — invisible shields, weapons without movesets

11 material pavises render as the missing-model cube (the jar ships 3 blockstates
for 11 variants), and 18 weapons get no Epic Fight capability, so they behave as
vanilla items in a combat-overhaul pack.

**Recommend: accept for now.** The armour and most weapons work. Revisit if the
missing movesets are noticeable in play.

### B5. The peaceful surface ✅ **REVISED - rare spawns + blood-moon spike, not a hard deny**

Now that the deny rule actually works, **nothing hostile spawns above y40**. That
silences Born in Chaos (3 mods), Rotten Creatures, Mutant Monsters, Nyf's
Spiders, Creeper Overhaul, Enderman Overhaul, most of Cryptid, ArPhEx's surface
arthropods, Legendary Monsters' overworld bosses, and Zombie Awareness. It very
likely also makes **Enhanced Celestials' blood moons do nothing**, since a blood
moon works by raising spawn rates.

This is your design working as specified — but nobody priced it.

| | |
|---|---|
| **a. Accept** ⭐ | it is the whole point; those mobs live underground and in invasions |
| **b. Carve exemptions** | let specific mods spawn above y40 anyway |
| **c. Measure first** | play one night with In Control debug on and see what actually produces nothing |

**Recommend (a) now, (c) before cutting anything.** The rising-surface curve
(D1) will hand these mods the last week of every cycle anyway.

---

## C. Operations

### C1. Backups ✅ **by hand**

You said "backup is fine here" with the server down. Two exist, both taken by
hand. `backup.ps1 -Live` works with no downtime.

**Question:** schedule it when the server comes back, or keep taking them by hand?

### C2. The friends need to re-import the instance zip

packwiz syncs **mods, not config**. Every client-side tuning change — the new
video defaults, the 6 GB heap, the window size, the 16 tuned configs, the
Distant Horizons settings — only reaches them on a **fresh zip import**.

**Recommend:** one re-import round, once, when the pack is stable. Not three.

### C3. Two whitelist slots still empty

`lehykt` and `rehykt` are in. Two friends never sent usernames.

### C4. quark experimental ✅ **non-issue** - every module inside it is false; nothing is on

Not the default. Enables Quark's experimental module category on a pack that has
been unstable. Deliberate, or worth turning off?

### C5. Epic Fight GPU skinning ✅ **on for Ethan's instance only; off in the shipped config**

`use_compute_shader` and `use_persistent_buffer` are both `false`. Enabling them
moves skeletal vertex-skinning to the GPU — CPU-cheaper, and your GPU is idle.
Left off deliberately: a broken compute path on an old driver is a crash risk,
not a slowdown, and the config now ships to everyone including a weak machine.

**Question:** try it on your machine only, or leave it?

---

## D. Settled — do not re-open

| | |
|---|---|
| Diamond stays at y −123 | ratified as intentional |
| Portals at depth | **dropped** — the Vaults supersede them |
| Better Caves | cut, before the regen, so carving is not baked in |
| GeOre + geore-nouveau | cut — off-theme materials |
| Spelunkery | cut — 111/111 overrides failing, unfixable |
| Vault key | **both** keycard and breaching charge |
| Tally exclusions | environmental deaths and PvP never create a nemesis |
| Low-spec is the baseline | shipped defaults tuned low; INSTALL.txt says what to turn up |
| Server → spare PC | later, not now |
| Depth-loop build order | D0 tally first (its value is being early), then D1, D2, D3, D4 |
