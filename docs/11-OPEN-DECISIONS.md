# Open Decisions

**Most of this was answered 2026-08-01.** What remains is at the top; the
answered items are kept below with their resolutions so the reasoning survives.

## RESOLVED — the Simply mods, and the skill system we already own

**Ethan 2026-08-14:** *"look into the simply mods like simply swords, simply skills,
etc to see if we can get that modern system to add or replace something."*

* **Simply Skills — NOT AVAILABLE.** Fabric-oriented; no NeoForge 1.21.1 build found.
  The modern system cannot be added as asked.
* **Simply Swords — available (1.63.0-1.21.1) but STAYS CUT.** R4 cut it as
  stat-sticks. The weapon types are genuinely varied, but this file already records
  the trap: adding a mod to solve a tuning problem is how the pack reached 400. Per-path
  weapon identity is better served by curating what is installed — which is how Blade
  got the Dark Warblade, an item whose drawback the mod author wrote and no gem
  system would have produced.
* ⭐ **WE ALREADY SHIP THE SYSTEM, TWICE, AND CONFIGURE NEITHER.** `puffish_skills`
  is the engine (0 data files). `skill_tree-neoforge` (RPG Series) is a content pack
  for it — 254 datapack JSONs. `category.json` exposes **`unlocked_by_default`**
  (the path unlocks its tree) and **`exclusive_root`** (the subclass choice). **The
  six subclass trees are a datapack authoring job, not a build.** See `30` §6.
* ⚠️ **Live R5 note:** two skill-tree mods where R5 says one system per verb. Benign —
  engine plus content, not rivals — but the pack pays for a skill system and ships
  none of it.

---

## OPEN — a second world reset, to redo worldbuilding

**Ethan, 2026-08-13:** *"im halfway kinda wanting to reset the server once again to
redo worldbuilding but lets finish and get all this working first."*

**Captured, deliberately not scheduled.** The instruction is explicit: finish the
introductions first. Nothing about it should be acted on, and no current work should
be shaped around it — except the one place where it genuinely changes a decision:

🚨 **A world reset does I4's job for free.** `26` §I4 exists only to kick all four
players off their paths so everybody meets their patron properly and pays the entry
price for the first time. A fresh world does that as a side effect — every player is
pathless, every claim, cooldown, notoriety and regard value is gone, and the first
`/path` anyone runs is a real introduction. **So if the reset happens, I4 stops being
a ceremony and shrinks to a `/path forcereset <player>` admin tool for testing.**
Build it that way regardless — the tool is useful either way and the ceremony is not.

Two further notes for whenever it is taken up:

* **The path system survives a world wipe.** It is KubeJS + persistent player data,
  world-agnostic. Worldbuilding, structures and biome work do not touch it.
* **The live roster dies with the world** — Rehykt=forge, Lehykt=blade,
  j0nesyboi223=salvage. Anything written against those assignments is temporary.

---

## OPEN — retire the patrons' physical presence until the Hunt

*Ethan, 2026-08-15: **"I was lowkey flirting last night with the idea of removing
patron presence until the end, everything is delivered over chat until the hunt so
we don't need to mess with the behavior of the mobs anymore but that's for later."***

**Captured, explicitly NOT scheduled.** Do not shape work around it.

The patron would exist only as **voice** — whispers, events, trades, all chat —
until the Harvest, at which point the creature actually arrives. No stalker entity
following you for the whole game.

**What is attractive about it:** nearly every bug this project has produced lives in
the *entity* half, not the voice half. The Helper culled by its own sweep, the
`keepDistance` teleport that flung the bench patron 100 blocks, minions permanently
aggroed, the casting migration problem, PvP stalker-vs-stalker never once tested.
The voice half has been reliable throughout. This would delete a whole class of bug
and make the Harvest an *arrival* rather than an escalation of something already
standing next to you.

**What it costs:** the patron stops being a presence you live alongside, which was
the original pitch — *"things happen to you"*. The Hunt's dread depends partly on
having watched the thing get closer. And `stalker.js` is the single largest system
in the build; retiring its live half is not a small edit.

⚠️ **Decide BEFORE E8 (Blade's waves)**, not after — Blade's twelve events assume a
creature that is present. **`spawns` is entangled with this too:** it is currently
INERT and needs an active spawner, and if patrons become chat-only, that spawner is
the *only* thing that would ever put a patron-flavoured mob near a player.

---

## NOTHING ELSE OPEN

Every decision from the 2026-07-31/08-01 audit and design sessions is answered.
The build queue lives in `10-DEPTH-LOOP.md` §4.

**Last resolved:** no new enchantment mod. Apotheosis is already a full affix and
rarity system and has never been configured; binding its curve to depth is the
same work either way, and adding a mod to solve a tuning problem is how this pack
reached 400 in the first place.

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
