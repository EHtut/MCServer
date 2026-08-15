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

---

# BEING CHOSEN — patrons pick you
*Ethan, 2026-08-14, during the first playtest: **"What if paths are no longer
commands. What if you are chosen by the patron? Though that may be a separate
system."*** Captured with two smaller ideas from the same session. **Nothing built.**

---

## 1. 🚨 This fixes a real flaw in what we just shipped

Every one of the six scenes is built on a **false shared history** — `27` §MANIPULATION
AXIS makes it the load-bearing device:

> *"You already reached for it."* — Blade
> *"You called me, friend, and here I am, same as I always come."* — Salvage
> *"We shook on it. Maybe not with hands — you don't recall."* — Forge
> *"You left a seam for me once."* — Wall

**But the player typed `/path blade`.**

So the premise is not false. **It is literally, verifiably true**, and the patron's
best line degrades into an accurate description of a command the player ran two
seconds ago. Blade says *"you already reached for it"* to somebody who did exactly
that, on purpose, by name.

**The gaslighting cannot work when the victim initiated.** I built the manipulation
layer and the vending machine in the same week and never noticed they cancel out.
Ethan found it by playing it once.

If the patron arrives unbidden, every one of those lines becomes a **lie again** —
which is the only state in which they do their job.

## 2. It is also the thesis, exactly

`30-THE-THESIS.md`:

> Veldora will not let you die, and it will not let you leave. The patrons are the
> only things in it that will make you an offer. **An offer is the only thing that
> feels like freedom in a place that has already decided you cannot have any.**

A command menu hands the player agency the entire fiction says they do not have.
`/path crown` is *shopping*. Being chosen is being **noticed**, which is the thing
the whole world is about — the angels watch the descent, and now something that fell
has picked you out of the dark and come over.

**Refusal gets stronger too.** Right now you refuse a thing you asked for, which is
mostly incoherent. Refusing something that came for you uninvited is a real act, and
the silence afterwards becomes genuinely cold: it came once, you said no, and now
nothing comes.

## 3. How you get chosen: they watch what you DO

The mechanism should be the one the fiction already claims — **the angels watch**.
So the patrons read **revealed behaviour, never a stated preference**. You do not
pick a playstyle; your playstyle picks your patron.

| patron | the signal it watches for |
|---|---|
| **Forge** | blocks placed, machines built, Create in use |
| **Blade** | hostile kills, fighting things above your weight |
| **Wall** | enclosing, walling in, doors, staying home |
| **Art** | **dying** — repeatedly, and the sleeping |
| **Salvage** | looting, scavenging, running out of things |
| **Crown** | summoning, commanding, sending others in first |

⭐ **Art watching you die is the best of the six** and needs no extra system: the
death counter already exists in `regard.js`. The player who keeps dying gets noticed
by the one who offers rest. That writes itself.

### The candidacy rule — one spike must not do it

**Sustained candidacy, not a threshold.** A signal must stay strong *and keep growing*
across several evaluation cycles before a patron acts. One good mining session must
not summon Forge. This is not a new invention — it is the pattern that already works
in the Alice project's trait formation, and the reason is identical: **formation
should be a big deal, earned over time, not a trigger.**

## 4. ⚠️ Both failure modes, per the standing rule

**Too passive — the real risk.** A player who *wants* Blade but plays like a builder
never gets Blade, and there is no lever to pull. That is not mystique, that is a
player being told no by a system that will not explain itself. Four players on a
private server will absolutely hit this.

**Too eager.** Patrons arriving constantly, or several courting at once, turns an
event into noise and burns the one thing this system has: rarity.

### The resolution: you may SIGNAL, you may never DEMAND

* `/path` **stops granting** and becomes what it should always have been: a way to
  *look* — who walks what, and nothing more.
* The player can act toward a patron (fight recklessly, build obsessively, wall
  themselves in) and **be seen doing it**. That is a lever, and it is diegetic.
* **A long backstop.** If nobody has been chosen after N in-game days, the most
  likely patron comes anyway. Being unchosen forever is not mysterious, it is broken.
* **One courtship at a time.** A patron that arrives holds an exclusive window; the
  others stay quiet until it resolves. Refusal opens the field again after the silence.

## 5. What it costs to build

Not small, and honest about it:

* **`paths.js` selection is player-initiated everywhere** — the escrow model, the
  claim, `/path <key>`, all of it assumes a player asking.
* **A new watcher** is needed: per-player signal counters with decay, candidacy
  across cycles, and a chooser. That is genuinely a separate system, as Ethan
  guessed.
* **I2 is unaffected.** `VELDORA.intro.open(srv, p, key, commit)` does not care who
  called it. **The introductions already work for this** — a chooser calls the same
  seam. That is the payoff for having built I2 as a seam rather than inline.
* **E3, the coefficient substrate, is the natural home** for the signal counters,
  and it is still unbuilt.

⭐ **The world reset is the moment to do it.** `11-OPEN-DECISIONS.md` records Ethan's
intent to wipe and redo worldbuilding. A fresh world means nobody holds a path, and
being chosen becomes how everyone gets one from the start — no migration, no
retrofit, no explaining to four players why their path vanished.

## 6. Open questions

1. **Does `/path <key>` survive at all?** Recommend **no** — keep `/path` as a
   read-only board. A command that still grants makes being chosen decorative.
2. **Can you be chosen by a patron you already refused?** Recommend yes, but much
   later, and it should feel like being reconsidered rather than nagged.
3. **Can two patrons want you?** Tempting and expensive. Recommend not in v1.
4. **What does the world reset do to the six existing walkers?** Nothing, if the
   reset happens first.

---

# Also captured this session

## A. Announcements — an emphasis ladder

Ethan: *"I would like if possible to move some dialogue as Announcements or some
other way to add emphasis."*

`/title` and `/subtitle` are **vanilla and confirmed working** (RCON parsed them).
Four channels exist, and the danger is using them for decoration until none of them
mean anything:

| channel | reserved for |
|---|---|
| **title** | the moment the world changes. A patron's *arrival*. The Fall. A Harvest beginning |
| **subtitle** | the name of the thing that just arrived |
| **red chat** | the patron speaking — stays the default, most lines |
| **actionbar** | ambient whispers, low priority, never interrupts |

**Recommendation:** the patron's **first line only** becomes a title, and everything
after it stays in chat. The arrival lands as an event; the conversation stays a
conversation. Escalate for *meaning*, never for emphasis — a title on every line is
the same as no titles.

⚠️ **One assumption to probe:** the ritual blinds the player, and **whether a title
renders over blindness is unproven.** E0 P2 proved red chat is legible on a black
screen; titles are a different HUD layer. Probe before building — this exact class of
assumption is what I0 exists for.

## B. A first-join introduction to the world

Ethan: *"perhaps an introduction when you first enter the server to introduce you to
the world. Flag it for after."* **Flagged, not scheduled.**

Worth recording *why* it is more valuable than it looks: `30-THE-THESIS.md` §5.1 says
the scenes are not *of* Veldora — nobody mentions the descent, the watching, or that
**you cannot die**. A first-join sequence is the natural place to establish all three
**once**, so no patron ever has to explain them. It would make the "one line of
Veldora per patron" revision easier, because the player would already know what the
line is referring to.

It is also the same primitive: `VELDORA.ritual.begin()` with no options. The system
to build it already exists and is now tested.
