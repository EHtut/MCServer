# Wall — the refresh. MineColonies.

*Ethan, 2026-08-14: **"i do not think anyone will ever choose that path because
security craft is not a good base... i got it wrong wall is a building/resource
path"*** and then, cutting through a page of my wrong answers: **"I have an idea.
Mine colonies."**

**Available:** `minecolonies-1.1.1319-1.21.1` for NeoForge 1.21.1, May 2026.
**Nothing built. Nothing added yet.**

---

## 1. Why my first pass was wrong, recorded so it is not repeated

I proposed waystones, camping and corpse retrieval — a "thread back" and a "house
that follows". Ethan's correction was exact:

> *"A mod like waystones is essentially furniture, camping is untrackable and side
> content."*

He is right, and the reason matters: **every other path is anchored to a mod with a
progression tree.** Blade has armour tiers, Salvage has gun crafting and ammo, Forge
has all of Create, Art has Ars Nouveau, Crown has Goety. I offered Wall a *convenience*
and called it a path. A path needs something to still be doing on night forty.

## 2. Why MineColonies is the right answer

**It is not a mod. It is a game**, and it is the only one of its kind in the space
Wall occupies:

* **A real progression tree** — a town hall, a builder, then hundreds of hours of
  huts, schematics, research, levels, supply chains and citizens who need feeding.
* **It is building AND resources at once**, which is exactly the domain Ethan
  assigned Wall, and it splits cleanly from Forge: **Create automates so you do not
  have to; MineColonies gives you people who do it for you.** Machines versus
  citizens. Neither steals the other's fantasy.
* **It scales with time, not gear** — so it does not compete with Blade or Salvage
  for the combat power budget.

### 🔑 And it is the Mother's fantasy made literal

Wall is codependent. She wants to be closer, and closer, until nothing is between
you. Her best line is:

> *"I will live in the walls you build. Even when you do not see me. Especially then."*

**A colony is a town full of walls, built by people who cannot leave, who depend on
you utterly and who you come to depend on.** She does not want you to have a base.
She wants you to have a **household** — and every building in it is one more wall she
lives in.

There is a genuinely unsettling reading available for free: the colonists are people
who arrived and stayed. They cannot die (`15-LORE`: neither can you). They work, they
sleep, they need you. **The kindest patron gives you a family, and the family is a
web.** Nothing about the mod has to be modified for that to be true — it only has to
be *named*.

## 3. What it displaces

* **SecurityCraft is retired as Wall's base.** It has no other consumer in the pack.
  Cut it, or leave it as an unaffiliated utility — but it stops being a path.
* Wall's decoration mods (`chipped`, `framedblocks`, `macaws-*`, `handcrafted`,
  `medieval-buildings`, `interiors`, `bellsandwhistles`) **stay and become
  supporting content** — a colony is exactly what makes hundreds of building blocks
  meaningful instead of decorative.
* **`theurgy` stays with Wall** as the resource half — material transmutation feeding
  a settlement that consumes materials endlessly.

## 4. ⚠️ Risks, honestly

1. **Performance.** Colonists are entities with pathfinding and jobs. On a pack of
   290 mods with `in-control` spawn pressure and four players, this is the single
   biggest performance addition we would make. **Needs a measured soak, not a vibe
   check.**
2. **It is a huge mod to learn.** Ethan's brother is the combat player; whoever walks
   Wall is signing up for a tutorial. The introduction should acknowledge that — the
   Mother teaching you, patiently, is entirely in character.
3. **Schematic style vs period.** MineColonies ships several styles; some are
   modern/fantasy-generic. **R1 (period) and R8 (of Veldora) apply.** Pick the
   medieval/dark styles, or the colony will look like it came from another server.
4. **It wants a lot of space.** Interacts with the world reset and with claim/griefing
   between four players.

## 5. Open

1. **Which schematic styles ship?** Needs a pass against R1.
2. **Does the colony feed the other paths?** A settlement that supplies the server
   makes Wall the person everyone needs — which is *exactly* what a codependent
   wants, and gives the path a social role no other path has.
3. **What are Wall's events** (`23` PART VI) in colony terms? Raids on the colony,
   a citizen going missing, a building she insists you construct.
4. **Does she gate buildings?** She could *ask* for structures — the shrinking ask,
   made of stone.


---

# 6. ⭐ CROWN MERGES INTO WALL

*Ethan, 2026-08-14: **"We merge crown and wall. The idea being the spider mother
wants you to build a family, a web, like hers. Also missionary is kinda a boring
patron compared to the others."***

**Six paths become five.**

## Why it works

The colony IS the court IS the family IS the web. Crown commanded servants; Wall
wants a household. **MineColonies citizens and Goety minions are the same mechanic
wearing two different emotions**, and only one of those emotions is interesting.

Wall also absorbs the one thing Crown had that she lacked: **a reason for other
players to need you.** Crown's *"he does not respect your claim but he will use
you"* becomes *your colony supplies the server* — which is precisely what a
codependent wants, and gives Wall a social role no other path has.

### 🔑 The synthesis: her household holds the living AND the dead

Goety is necromancy. MineColonies citizens arrived and stayed and cannot leave.
`15-LORE.md` says the same of you: **you cannot die.** Put those together and Wall's
web is a settlement of people who cannot leave, tended by a mother who raises the
ones who stopped moving.

Nothing needs inventing. **Goety becomes the dead half of the household.**

## What is lost, honestly

* **Crown's voice was distinctive** — the straight man, the only patron who accepts a
  refusal and *respects* it, the flattering demotion. Two writing passes offered him
  comedy and he refused both.
* His scene in `28-THE-SCENES.md` is finished and good.

⚠️ **Do not delete Crown's material.** It stays in `27` and `28` marked RETIRED. A
sixth patron may be wanted later, and the writing is already done.

## The tension to watch

**Wall and Crown want opposite things from the same mechanic.** Crown's servants mean
nothing to him — *"devotion is for the desperate and the unclaimed."* Wall loves her
family too much. **Wall's register wins**, because the merge is happening precisely
because Crown is the weaker character. If a colony line ever sounds imperious, it is
wrong.

## What it costs to build

* `PATHS` drops to five keys. `crown` leaves `paths.js`, `stalker.js` CAST,
  `regard.js`, `whispers.js` and `introductions.js` (regenerate the last from `28`).
* **Do it at the world reset** — a live claim on `crown` would otherwise need
  migrating.
* Wall inherits `goety` + `goety-cataclysm`, taking her from 14 decoration-heavy
  mods to a real roster: **MineColonies + Goety + Theurgy + the building palette.**
