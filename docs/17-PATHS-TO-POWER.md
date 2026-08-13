# Paths to Power — what climbing actually looks like in Veldora

**Status: DESIGN, first pass. Written 2026-08-04 from an audit of all 297 mods.**
Nothing here is built. Ethan's call on every ruling.

---

## 0. The audit finding

The pack contains **seven independent power sources**, each a complete game:

| source | mods | what it makes you |
|---|---|---|
| **Industry** | Create + 24 addons | rich, automated, infrastructural |
| **Magic** | Ars Nouveau, Theurgy, Goety | versatile — spells, transmutation, the dead |
| **Salvage** | TaCZ | lethal at range, and dependent |
| **Martial** | Epic Knights, Better Combat, siege | durable, skilled |
| **Class** | Spell Engine family + skill tree | personally, permanently specialised |
| **Defence** | SecurityCraft | able to keep what you built |
| **Beasts** | Ice and Fire | mounted, and feared |

Every one is well built. **None of them touch each other, and none of them need
the descent.** You can climb any single one to its top without ever going below
y0, and finishing one tells you nothing about the others.

That is a second, structural version of "nothing to work towards", underneath the
one the Reforge fixed. The Reforge repaired the **economy** — deep ore is now
worth having, guns are findable. This is about the **shape**: seven ladders in a
room is not a ladder.

**The fix is not more content. It is making the paths need each other, and
making the descent the thing they all cross.**

---

## 1. The rule

> **A path gives you a kind of power, denies you another kind, and has one rung
> that can only be climbed below.**

Three parts, all load-bearing:

- **Gives** — the path must be genuinely strong at something, or nobody walks it.
- **Denies** — it must be genuinely weak at something else, or nobody trades.
  With four players, weakness is what makes the others matter.
- **Crosses the descent** — every path has at least one rung that requires
  something only the deep produces. That is what makes Veldora one game instead
  of seven.

---

## 2. The paths

### I. THE FORGE — industry
*Create, Createaddition, Big Cannons, Steam 'n' Rails, Numismatics*

**Gives:** throughput. Anything you can make, you can make thousands of. Trains,
airships, artillery. The only path that scales without you present.
**Denies:** your body. A Forge player who meets something in the dark is a
civilian. All that power is *at home*.
**Rungs:** hand tools → water and wind → **steam** → early electricity →
rail and air → artillery.
**Ceiling (Ethan, 2026-07-31):** steam and early electricity. No oil, no diesel,
no concrete, no sci-fi.
**Crosses the descent:** artillery and reinforced construction both need the
metal that does not break, which is Vault loot. And the Forge is what *funds*
every expedition — it makes the ammunition, the rails, the gear.

### II. THE ART — magic
*Ars Nouveau (+ Creo, + Create-Ars), Theurgy, Goety*

**Gives:** verbs nothing else has. Flight, light, transmutation, automation
without machinery, and in Goety's case, labour that does not need feeding.
**Denies:** legitimacy and simplicity. It is slow to start and its deepest
branch — necromancy — sits on the horror seam by design.
**Rungs:** first glyphs → spell crafting → **Ars/Create bridge** → alchemy and
transmutation (Theurgy) → rituals (Goety).
**Crosses the descent:** the Art is the only reliable answer to the Sealed Floor —
light you carry, ways down and back that do not need a staircase. Its reagents
should come from below.

### III. THE SALVAGE — the old weapons
*TaCZ, gunpowder ore, the Vaults*

**Gives:** lethality at range that no medieval gear matches.
**Denies:** independence. **You cannot make a gun.** 172 gun-smith recipes and
not one produces one. You find it, then you spend the rest of your life feeding
it, and the black residue is only at the bottom of the world.
**Rungs:** find a sidearm → hand-load its cartridges → find a rifle → attachments
→ the Vault racks.
**Crosses the descent:** it *is* the descent. This path does not merely cross the
loop, it is the loop, and it is the one already fully built.

### IV. THE BLADE — martial
*Epic Knights, Better Combat, Combat Roll, medieval siege, the classes*

**Gives:** the only power that is **carried on the person**. It cannot be raided,
does not need fuel, and works the instant you spawn.
**Denies:** reach and leverage. No automation, no throughput, no trade goods.
**Rungs:** tiered arms and armour → weapon mastery (Better Combat is per-weapon)
→ **a class** → the skill tree.
**Crosses the descent:** L2Hostility scales with depth and days, so the Blade is
the only path whose difficulty curve is *already* the descent's curve.

### VI. THE CROWN — command  ✅ Ethan, 2026-08-04
*Goety, Guard Villagers, Automaticons*

Ethan asked for "the class of the leader ... managing minions or people to
conquer the depths with you". **No mod needs adding — Goety alone registers 64
SERVANT entities**, from Bear and Blaze to Evoker, Geomancer and Ghast. Guard
Villagers hires defenders; Automaticons builds golems that work. The path exists
in full and has simply never been named.

**Gives:** numbers. The only path where power is measured in bodies rather than
gear, and the only one that can hold ground in two places at once.
**Denies:** self-sufficiency alone — a Leader without a retinue is the weakest
thing in the room, and every servant is upkeep.
**Rungs:** first servant → a working retinue → specialised summons → the rituals
that raise the strong ones → commanding through Guard Villagers and golems.
**Crosses the descent:** this is the one that lands hardest on the canon.

> Adventurers **cannot die**. They can only be broken, over and over.
> **Servants can die.**

The Leader is the only path that can send something ahead of it into the dark. On
the Sealed Floor, where being broken is the whole cost, spending the expendable
IS the power — and it is a moral posture as much as a build, which suits a world
that watches you.

⟡ **Open:** should the watchers care? A path built on sending others down first is
exactly the kind of thing the Angels might notice. Good DM fuel; Ethan's call.

### V. THE WALL — defence
*SecurityCraft, reinforced blocks*

**Gives:** permanence. The only path that answers "will this still be here
tomorrow."
**Denies:** everything offensive. It wins nothing; it only refuses to lose.
**Rungs:** doors and keypads → mines and cameras → laser grids → **reinforced
blocks**.
**Crosses the descent:** reinforced blocks are Vault loot at −64…−128. This is
the loop the depth doc already names: *creepers can destroy your base → you need
blast-resistant material → it is deep → descending is how you protect what you
built.*

---

## 3. What the audit says is MISSING

**⚠️ The Wall — CORRECTED TWICE. Read the second one.**

*2026-08-04 (WRONG).* I wrote: "SecurityCraft has 846 recipes, 665 of them
reinforced blocks, and ZERO worldgen entries — **so the Wall is fully craftable
today**", and concluded it was a signage problem, not a content one.

*2026-08-11 (the actual state).* That was wrong, and wrong in a way worth naming
because the same mistake produced the same false claim a second time in
`help.js`. I counted the recipes that **produce** a reinforced block and never
checked whether their **inputs** were reachable. All 665 take a reinforced block
or a Universal Block Reinforcer as input, and **`mcserver_buried_tech` disables
all three reinforcer recipes.** The one recipe that looks like a way in —
`reinforced_crystal_quartz_block` from `block_pocket_wall` — is circular and its
other half is disabled too. Machine-checked every loot table in all 234 jars, all
four buried_tech injectors, `paths.js` and `instance/config`: **no source
existed. The Wall had no entry point at all.** Full working in
`20-AUDIT-2026-08-11.md` §B1.

*The fix, same day.* Ethan chose deep salvage plus a path drop, which keeps the
buried-tech doctrine intact — the reinforcer is modern tech, so it is **found,
never crafted**:

* **Deep salvage** — two global loot modifiers in `mcserver_buried_tech` put
  `universal_block_reinforcer_lvl1` in deep structures: 10% in abandoned
  mineshafts, stronghold corridors and crossings, Better Dungeons and Galosphere
  forgotten ruins; 30% in the ancient city. Anyone deep can find one.
* **Path drop** — it is in the Wall's tier-2 and tier-3 kill drops, so the walker
  is reliably paid one for going down rather than left to loot rolls.

lvl2 and lvl3 stay buried. The signage claim above still holds on its own terms —
SecurityCraft really does generate nothing and really is invisible by default —
but it was never the whole problem. It stays a path.

**⚠️ The Beasts are not a path.** Ice and Fire is listed as "dragons as a
late-game target", but there are no rungs — a dragon is a wall, not a ladder,
and nothing else in the pack leads toward it. Either give it rungs (eggs,
hoards, taming as a real chain) or accept it as a *trophy* and stop calling it
progression.

**⚠️ Classes are inside the Blade, not beside it.** They are on the martial path,
not a sixth path. Naming them separately would be double-counting.

**🚨 No path is legible in-game.** This is the real gap and it is not a mod gap:
- the Patchouli guidebook still does not load
- there is no quest engine (FTB Quests is CurseForge-only — see 16-THE-REFORGE §14c)
- nothing tells a player any of the above exists

A path nobody can see is not a path. **Signage is worth more right now than a
sixth power source**, and it is the cheapest thing on this list.

---

## 4. Where this should go next

Ranked by effect per hour, all consistent with the existing plan:

1. **Signage.** Fix the guidebook, or ship the paths as a written in-world
   document. Players currently rediscover the pack by accident.
2. **Give each path its deep rung.** Salvage and the Wall already have one. The
   Forge, the Art and the Blade do not — their top rungs are reachable without
   ever descending, which is exactly the fault the Reforge found in the ore.
3. **D2 Vaults.** Every path above points at them. They remain unbuilt, and they
   are the single structure that would make four paths converge on one place.
4. **Trade pressure.** Numismatics is installed and unused. With four players and
   five paths, a currency turns specialisation into a reason to talk.

---

## 5. Open for Ethan

1. **Exclusivity ✅ RULED, 2026-08-04 — one walker per path, release to free it.**
   Ethan called it "selfish design". It is the opposite: it is the only thing
   that makes the DENIALS bite. A path that grants throughput and denies you a
   body only matters if the person who has a body is somebody else. Built and
   enforced server-side; `/path release` relinquishes.
2. **Is the Wall a path or a tax?** It only prevents loss. That may make it
   everyone's baseline rather than anyone's specialisation.
3. **Do the Beasts get rungs, or become a trophy?**
4. **Does the Nether sit on any path?** It is currently a wound you should not
   visit — which is good fiction, but it means several mods serve no ladder.
