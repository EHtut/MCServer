# The Six Roles — pressure, not just payout

> # 🚫 THE ROSTER IS FIVE, NOT SIX — CROWN IS RETIRED
>
> **Ethan, 2026-08-14** (`35-WALL-REFRESH.md` §6): *"We merge crown and wall. The idea
> being the spider mother wants you to build a family, a web, like hers. Also
> missionary is kinda a boring patron compared to the others."*
>
> **WALL absorbs him.** Her household holds the living (MineColonies citizens) and the
> dead (Goety minions) — the colony IS the court IS the family IS the web.
>
> ### Live paths: **Blade · Salvage · Forge · Wall · Art**
>
> Crown's writing below is **kept deliberately**, marked RETIRED, in case a sixth
> patron is ever wanted — his voice was good and his scene is finished.
> **Do not build from it. Do not write new material for it.**
>
> 🚨 *This banner exists because the mistake was already made.* On 2026-08-15 Crown was
> scaffolded, deployed and given a full content worksheet, because these character docs
> described him as a live peer and the merge was recorded only in §6 of a doc about
> Wall. Reading the character docs was enough to get it wrong. `tools/new_god.py` now
> refuses the key outright.

> ⚠️ **FOLDED INTO `23-THE-PATH-SYSTEM.md` (2026-08-11).** That is the master
> document now. This file is kept for the reasoning and the conversation trail;
> read 23 for the current design.

*Design conversation, Ethan + Claude, 2026-08-11. DESIGN ONLY. Nothing here is
built. `20-AUDIT-2026-08-11.md` is the live state of what exists.*

---

## 1. The problem this answers

Ethan: *"The biggest thing I admit we are still targeting is funness. My friends
and me have a habit of not exploring, so I think the answer is we need things to
happen to us."*

Two facts sharpen that:

* **The "things happen to you" layer already existed and was dead.** The Harvest
  was mathematically unreachable, the Hunt sent nothing 75% of the time while
  logging success, and the Helper was culled by its own sweep about one second
  after arriving and never once helped. All three were built to push at the
  player. All three were silently broken until 2026-08-11. The group has been
  playing a pure find-it pack without knowing it.
* **Fixing those is necessary and not sufficient.** A single shared event
  calendar would give four players the same night. That is one story, told four
  times.

So the answer is not one event system. It is **six**, one per path, and they are
deliberately unequal.

## 2. The trinity

Three pairs. Each pair has a monopoly, and each monopoly is paid for.

| pair | paths | monopoly | cost |
|---|---|---|---|
| **Combat** | Blade, Salvage | the only ones who can fight the dark | **they quadruple mob spawns** |
| **Mercantile** | Forge, Wall | the only ones with resources enough to thrive | **almost no combat ability** |
| **Explorer** | Art, Crown | the only ones who can last alone | **loot-dependent for anything specialised** |

Ethan: *"Each fills a role."* Nobody is self-sufficient; nobody is redundant.
Blade cuts down the horde with a weapon Forge made, inside a pocket Wall holds
open, using a specialty component Art walked out to find.

## 3. The paths

### Blade — The Challenger
Enemies plentiful; XP inflated so the Harvest arrives *fast*. The knight taunts,
escalating with notoriety, and spawns waves at random. Screen darkening via
`minecraft:darkness` (a real 1.21 effect — no resource pack needed).

Ethan's lines, canon:

> *"Fall"*
> *"You reach for heights you will never attain"*
> *"For It was Icarus who flew too close to the sun. You will share his fate"*
> *"Run."*

Escalate them, so **"Run."** only ever lands immediately before the Harvest.

⚠️ **Blade's drop coefficient goes DOWN, not up.** All three consumers currently
read the same notoriety number, so tripling XP would give Blade faster phases
*and* more drops *and* more power — strictly the best path. The challenger does
not loot; it fights, and somebody else arms it. That single coefficient is what
makes Blade need Forge.

### Salvage — The Hound
Waves of melee, with guns and ammo dropping — roguelike cadence. **The Wolf
strikes bargains: gold nuggets for ammo, and every trade brings the raid closer.**

This is the best single mechanic in the design: a debt counter the player chooses
to increase. Every trade is the player deciding how much raid to buy. It is also
the cheapest to build — no new mobs, one hidden counter, one dialogue.

### Forge — The Thief's patron
Resources dumped on them. **Weakest stat bonuses in the game, highest payout.**
The patron demands throughput: build bigger, build faster.

Forge's weakness must be compensated by **automation, not stats.** A Forge player
who is simply weak is a burden. A Forge player who is weak *and whose defences are
things they built* has power that is genuinely theirs, and the patron demanding
more resources is also demanding better guns. Create Bionics fits here — the
Oxhauler as a manufactured bodyguard and pack mule.

### Wall — The Mother
Raids, by mobs that break blocks. `createbigcannons` is already installed, so
besiegers can bring artillery rather than chewing masonry.

**The closed loop:** block-breaking raiders are the one threat SecurityCraft's
reinforced blocks specifically answer. The raid does not merely threaten the Wall
walker, it *teaches them why their path exists* — which is precisely the signage
problem this path has had since day one (see `17-PATHS-TO-POWER.md`).

🚨 **HARD CONSTRAINT: raids target a declared CORE BLOCK the player places, never
arbitrary terrain.** A bad night that eats someone's build is unrecoverable in a
shared world, and four friends will not forgive it.

### Art — The Nightmare
Treasure maps dropping constantly. Stat bonuses above the builders, below the
combatants.

### 🚫 RETIRED — Crown — The False King

> **Merged into WALL, 2026-08-14** (`35` §6). Kept for reference only; nothing below is being built. See the banner at the top of this file.
Patron-issued quests: *find 5 diamonds before this date, or the raid comes.*

**Both explorers' independence is their toolkit, not a stat.** Crown does not
fight — its 64 Goety servants do, which is literally "acts independently for
periods." Art's self-sufficiency is the Ars kit: light, mobility, utility verbs in
the dark. Both already exist in the pack, so explorer independence is not built,
it is simply *not overridden*.

## 4. The coefficients — the whole thing in one table

Notoriety is currently ONE number driving THREE consumers: drop rate
(`paths.js` `dropChanceFor`), the power curve (`power.js` `CURVE`), and the
stalker phase (`stalker.js` `resolvePhase`). Every identity above is expressible
as per-path weights on numbers that already exist. **This is the only structural
change the design needs.** After it, most of the above is data in a table.

| path | role | spawns | power | drops | phase | alone |
|---|---|---|---|---|---|---|
| blade | combat | **×4** | ×3 | ×0.6 | ×2 | poor |
| salvage | combat | **×4** | ×2.5 | ×0.8 + guns/ammo | ×1.5 | poor |
| forge | mercantile | ×1 | **×0.4** | **×3** | ×1 | worst |
| wall | mercantile | ×1 + raids | ×0.5 | ×2.5 | ×1 | safe only at home |
| art | explorer | ×1.5 | ×1.2 | ×1 + maps | ×1 | **good** |
| crown | explorer | ×1.5 | ×1.2 via servants | ×1 + quests | ×1 | **good** |

## 5. The two things most likely to break it

### 5a. The spawn cost is SHARED, and that must be deliberate
Spawns happen in the world, not to a player. Blade quadrupling spawns hits the
Forge walker standing beside them — the weakest character in the game — and left
implicit that is the Forge player dying repeatedly in somebody else's weather and
resenting it.

Made explicit it is the strongest identity in the design: **the combat classes
are dangerous to be near.** You do not want the Blade lounging at base after
dark. It gives Wall's pocket an exact job — the only place the storm does not
reach — and it gives the group a reason to separate and reconvene, which is where
stories come from. Make it loud, not emergent: the Blade walker should know they
are a weather system, and everyone else should know it too.

### 5b. The 2am problem
Four friends do not log on together. A Forge player alone is resource-rich,
combat-helpless, and has no Blade to stand in front of them. Interdependence
tuned for a full party punishes whoever plays off-schedule — the specific failure
mode that kills class-dependency designs in small groups.

Three exits: scale the costs by players online; make Wall's pocket a universal
retreat; or give every class a diminished-but-survivable solo mode.

✅ **DECIDED — scale by players online.** Ethan: *"we scale and balance it."* One
multiplier, and it is honest.

## 5c. SUBCLASSES — and the death of exclusivity

Ethan, 2026-08-11: *"there will never be 6 players tbh."* The real roster is
three, sometimes four:

| player | primary | role |
|---|---|---|
| Ethan (Rehykt) | **forge** | mercantile |
| his brother (Lehykt) | **blade** | combat |
| Ben (j0nesyboi223) | **salvage** | combat |
| Taylor (ClickedIce29313), when he appears | **art** | explorer |

**One-walker-per-path was designed for six players and now works against the
pack.** With three or four, distinctiveness is guaranteed by arithmetic;
exclusivity's only remaining effect is to orphan a third of the content. Wall and
Crown were never going to be walked.

### The rule that makes subclassing safe

> **Your subclass must come from a DIFFERENT PAIR than your primary, and you may
> never hold both halves of one pair.**

Every player then holds exactly **two of the three roles**, and the third is
always somebody else's — interdependence preserved by construction rather than by
hope. Ethan as forge+crown is mercantile+explorer and still cannot fight, so he
still needs Blade and Salvage. forge+wall would have been mercantile twice, which
is where the design starts eating itself.

### Three attached rules

1. **Primary is exclusive; subclass is not.** Four players is eight slots against
   six paths — the arithmetic forces it. The primary walker is still the one true
   walker of that path.
2. **A subclass grants the ECONOMY and the EVENTS, never the CREATURE.** One
   stalker per player, from the primary only. One Harvest. A Crown subclasser gets
   the patron's quests and the drop table; the False King does not come to
   collect, because the Thief already has that job. Two stalkers per player would
   double the load on the subsystem that just produced fourteen findings, and
   would muddy whose Harvest a player is walking toward.
3. **A subclass never repairs the primary's weakness.** Coefficients ≈ **40%** of
   a real walker's, and Forge's power stays `×0.4`. Crown's servants give a Forge
   walker bodies to throw at a problem, not the ability to solve it themselves.

### The tension to watch

**Every subclass is a small withdrawal from the interdependence bank.** The
different-pair rule prevents the catastrophic version. But if subclass
coefficients creep upward, the reason to log on together quietly evaporates. Keep
it a convenience, never a replacement.

### Wall is still probably orphaned

Subclassing rescues Crown, because Ethan is taking it. Nobody has expressed any
interest in Wall, and it is the most expensive path to build — block-breaking
raiders, core-block protection, artillery. **If it is still unwalked when we reach
it, fold its raid pressure into Forge rather than building it standalone:** same
pair, "defend the factory you built" is the same content, and Forge is the one
path guaranteed to have a walker.

### Open on subclasses

* **When is a subclass earned?** Free from the start is simplest and the group
  wants content now; a notoriety-25 unlock (the existing helper→companion
  boundary) would make it a milestone instead. Unresolved.
* Does the subclass's **spawn cost** stack? A blade+forge player quadrupling
  spawns at 40% is still a weather system. Probably yes, at the 40% rate.

## 6. Build order — from live data, not preference

Only three paths have a walker: **forge (Rehykt), blade (Lehykt), salvage
(j0nesyboi223).** Art, Crown and Wall have none.

1. **The coefficient substrate.** Per-path weights on the three existing
   consumers. Everything else depends on it and nothing is visible yet.
2. **Salvage, end to end**, as the proof. The bargain ratchet needs no new mobs.
3. **Blade**, then **Forge** — the other two walked paths.
4. Art, Crown, Wall: designed now while the thinking is hot, built when someone
   walks them.

## 7. Open

* Is the Art/Crown exploring **deliberate** — forcing the issue — or a blind spot
  against "we don't explore"? If deliberate, the leash must be short: maps that
  point 200 blocks rather than 2000, and Crown quests naming things the world
  already generated nearby. Note that *"find 5 diamonds"* is already the right
  shape, because diamonds are **down** rather than **out**, and vertical
  exploring is something this group already does.
* Wall raid mob roster — which installed mobs actually break blocks, versus
  driving it with `createbigcannons` artillery.
* Whether taunts fire on a schedule or purely by notoriety escalation.
* Two mods to add, both cleared: **Grassier Grass** (client-side wind shader,
  zero server impact) and **Create: Bionics** (three fuelled robot animals, a
  natural Forge boon — caveat: its Anole repels all spiders and insects, which is
  a mob-repellent pet in a horror pack).
