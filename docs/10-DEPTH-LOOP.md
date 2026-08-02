# The Depth Loop — why anyone goes down

**Status: DESIGN + EXECUTION PLAN. Nothing here is built yet.**
Decisions marked ✅ are settled by Ethan; everything else is open to argument.

---

## 1. The question

Ethan, 2026-08-01:

> Why do we want go into the depths? And then maybe a death system to make the
> depths rougelike?

The honest answer at the time: **descending had exactly one reward and it was a
one-time reward.** Buried tech is loot-gated to deep chests; once you have a
rifle and ammo is craftable on the surface, the depths have paid out and the
lower half of the world becomes scenery. A threshold, not a loop.

Three things that were *supposed* to answer this were found dead in the
2026-08-01 audit:

- The peaceful surface never worked (`miny` vs `minheight`) — so there was
  nothing to descend *away from*. **Now fixed.**
- Kill-heat never worked (`getMobCategory` does not exist) — so descending
  carried no rising cost. **Now fixed.**
- No hostility or technology gradient with depth exists at all. The
  four-stratum table in `06-BURIED-TECH.md` is prose. **Still true.**

## 2. The shape

> **Descent is an expedition, not a destination.**
> Prepare on the surface, descend with a loadout, extract, come back up.

The surface industry **funds** expeditions; expeditions bring back what the
industry **consumes**. That closes the circuit between Create and buried tech,
which currently run in parallel and never touch.

> **Death costs the run. It never costs the base.**
> **— AMENDED 2026-08-01. Invasions CAN cost the base.** ✅

Ethan chose option (b) on the creeper horde: the horde can genuinely breach and
destroy. That is a deliberate reversal, recorded here rather than arrived at
quietly, and it changes the shape of the design for the better.

The original rule protected the base because nothing threatened it, which made
"why descend" a question about personal power. Now the base is at risk on a
clock, and **that closes the loop in a way the salvage framing never did:**

```
  creepers can destroy your base
        ↓
  you need blast-resistant building material
        ↓
  SecurityCraft REINFORCED BLOCKS resist explosions
        ↓
  reinforced blocks are VAULT loot, y -64..-128
        ↓
  descending is how you protect what you built
```

The Vaults were already going to be SecurityCraft's loot path (§3c). This makes
that choice load-bearing rather than convenient: **the reason to go down is now
the reason to stay up.** Nothing else in the design produces a motive that
survives the group getting rich.

The distinction that still holds, and should be defended in tuning:

| | |
|---|---|
| **Ordinary death** | costs the run. Never the base. Corpse + heat reset already do this. |
| **Invasion** | can cost the base — but only during the event, and only if the defence fails. |

So a bad night underground never burns your factory. Losing an invasion might.
That is a real stake attached to a scheduled, announced, defensible event rather
than to routine play, which is the version worth having.

Roguelike death and base-building fight each other: if dying costs your factory
nobody descends; if it costs nothing, depth is trivial. The expedition framing
resolves it — you drop what you carried, your holdings are untouched, and Corpse
gives you one retrieval attempt that is naturally harder the deeper you fell.
**No new punishment mechanic is needed; the geometry already does it.** Kill-heat
resetting on death already implements the run-reset half.

---

## 2b. What the depths ARE ✅ — the organizing principle

Ethan, 2026-08-01:

> the reason for venturing down is partly for need partly for rare and resources
> that wouldn't make sense to exist in a fantasy world. Gems, gunpowder, modern
> technology, etc.

**This is the spine the depth pillar was missing, and it does more work than
anything else in this document.**

`06-BURIED-TECH.md` described four strata as flavour and the audit found nothing
implementing them, because "it gets more hostile as you descend" is a difficulty
curve, not a reason. This is a reason: **the deeper you go, the less the material
belongs to the world above it.** Descending is not grinding for better numbers,
it is pulling up things that should not exist.

### The gradient, restated as a rule

Ethan sharpened this on 2026-08-01, after spawning into a new world surrounded by
Ice and Fire fairies and a Vampirism hunter:

> The world should be mostly inhabited by animals with spots of civilization.
> fantastical beasts go below then modern tech even deeper. Fantastical beasts
> too should really only be boss enemies

So the axis is not only MATERIALS, it is INHABITANTS — and the two move together.

| band | materials | who lives there |
|---|---|---|
| **Surface** | wood, stone, iron, copper | **animals, and spots of civilization.** Fantastical in *atmosphere*, not *population*. Rare horror anomalies only. |
| **y 0…−64** | gems, unusual metals | deep hostiles; the fantastical begins |
| **y −64…−128** | gunpowder, modern tech, the Vaults | the worst of it, and the Vaults |

**Fantastical beasts are BOSS encounters, not wildlife.** A dragon is an event you
seek out, not something you walk past. That is a stronger claim than "they live
underground" and it rules out a large amount of what the pack currently spawns.

⚠️ **The peaceful-surface rule does not implement this.** In Control denies
`hostile` spawns above y40 — and a fairy is not hostile. Anything in the
CREATURE, AMBIENT or MISC category walks straight through it, as does any mod
with its own spawn scheduler rather than the vanilla cycle (Vampirism's faction
system being the known case). The deny rule is necessary and nowhere near
sufficient.

### Density: sparse, and alive through SOUND ✅

> "i would prefer less animals than an overabundance. think real life right? in
> the wilderness you hear them skittering but you dont stumble into them
> nonstop"

This corrects an assumption that had been sitting in the project unexamined
since the pack was assembled — that a surface with no hostile spawns would feel
EMPTY, and therefore needed fauna mods to fill it (Respawning Animals, Spawn,
Cosy Critters and Naturalist were all justified partly on those grounds).

**Wrong axis.** A quiet wilderness is not an empty one. Aliveness comes from
**audio**, not from mob count:

| carries the feeling | does not |
|---|---|
| AmbientSounds, Sound Physics Remastered, Presence Footsteps, Entity Sound Features | more animals per chunk |

So the design target is: **few creatures, heard often, met rarely.** Something
skittering at the edge of hearing that you never quite find is doing more work
than a herd you walk into.

Two consequences worth acting on:
- Animal spawn weights and mob caps should come DOWN, not up. ServerCore's caps
  currently sum past 300 across ~30 categories — sized for a busy world.
- The audio mods are now load-bearing rather than decorative. Note the Sound
  Physics ray budget was cut hard for performance (32 → 8 rays, strict occlusion
  on); if that flattens the ambience, the low-spec tuning and this design goal
  are in direct tension and the tradeoff should be made deliberately.

Civilization is a **separate axis** and Ethan does want it: villages should be
findable and read as landmarks. Sparse wildlife does not mean a sparse world.

Audited 2026-08-01; findings and the per-mod knobs land in §4b-iv.

That gives a filter for every future question about the pack, which the theme
audit never had: *would this make sense in a fantasy world?* If yes, it can be
surface. If no, it is buried, and the depth is proportional to how badly it does
not fit.

### What it retroactively explains

- **Diamond at y −123** stopped being an accident of the depth extension and
  became correct — a gem, and gems are a middle-band material pushed deep.
- **Gunpowder Ore moving to the Abyssal band** (§D3) is no longer just an
  economic lever. Gunpowder is the substance that makes guns possible, so it
  belongs exactly where guns do.
- **TaCZ and SecurityCraft in the Vaults** — modern technology, the deepest
  category, behind a locked door.
- **The horror layer becomes literal.** "This world isn't right" is not
  atmosphere; the wrongness is buried, and rare surface anomalies (§3b) are it
  leaking upward.

### The one thing it demands

If the depths are where the anomalous lives, **the surface has to be clean of
it.** That is a real constraint and it needs auditing: anything gunpowder-
adjacent, gem-bearing or technological that currently generates or crafts above
y 0 is undermining the premise. The `liposcraftablegunpowder` surface path (§D3)
is the clearest example — kept deliberately as a slow, Nether-gated trickle so
nobody is ever hard-locked, but it is an exception to the rule rather than a
neutral fact, and it should stay expensive.

**Planned as D6:** an audit of surface-obtainable materials against this rule.

## 3. The three systems

### 3a. The Nemesis — the invasion, personalised ✅

Ethan's revision, and it is better than the generic horde it replaces:

> what if it was more like a forced boss battle of the mob the player has died
> to the most dialed to 11?

Why it is stronger: a salvage loop asks each player to *want* something. A
nemesis tells the group it *needs* something, on a clock, using a fact the world
generated about them. It is also the demand side of the economy — the thing that
stops four players building a comfortable factory and never descending again.

**Fully serverside.** Everything it needs is already installed:

| piece | mechanism | client mod |
|---|---|---|
| death tally by mob type | KubeJS on player death → `persistentData` | no |
| "dialed to 11" | **L2Hostility** levels + traits | no |
| extra teeth | Apotheosis affixes (ApothicAttributes / ApothicSpawners) | no |
| health bar | vanilla `/bossbar` | no |
| naming | custom name tag | no |

L2Hostility is *the* answer to "dialed to 11" — it exists to take an ordinary mob
and make it a nightmare by number. It is also no longer being trampled: the mod
that overwrote its attribute modifiers every second (F26) was cut.

**Not available serverside: size.** Literal scaling needs Pehkui, a both-sides
mod that is not installed. Skip it. A skeleton that is exactly skeleton-sized
with 400 HP, three traits and a boss bar is more unsettling than a giant one, and
it suits "this world isn't right" better than spectacle does.

**One boss, collective nemesis** ✅ — the group's most-died-to mob, scaled by the
group's *total* deaths to it. Four simultaneous bosses is chaos; one shared
nemesis reads instantly and stays personal.

### ⚠️ REOPENED 2026-08-02 — hordes, not a boss

Ethan: *"my brother said he prefers hordes over bosses."*

That contradicts this section as designed, and the brother is half the audience —
the combat/guns/horror half this pillar largely exists for.

**Proposed reconciliation: keep the nemesis SELECTION, change the DELIVERY.**

> You died to skeletons forty times. Here are forty skeletons.

Not one enormous skeleton. Everything the design already earned survives — it is
still personal, still drawn from the group's real history, still escalating with
the tally — and the L2Hostility dial tunes the **horde's level** rather than a
single mob's health pool.

It is arguably the better version of the original idea. "Dialed to 11" reads more
naturally as *how many* than as *how big*, and a wall of your own nemesis is a
clearer statement than one inflated instance of it.

Also note the restored **Spore** is itself a horde mod — a spreading infection
rather than a boss — so it already serves this preference.

**Needs Ethan's call before D4 is built.**

**Respawn rule ✅ — spectator during invasions, instant everywhere else.**

Ethan:

> Spectator I think. Normal deaths shouldn't have a death screen and it should be
> youre back at your bed a moment later

Two rules, and the contrast between them is the point.

| | |
|---|---|
| **Ordinary death** | **no death screen. Instant respawn at your bed.** |
| **Invasion death** | spectator until the wave breaks |

The instant-respawn half is a new requirement and it is not cosmetic — it is what
makes the expedition loop feel right. Combined with Corpse, dying underground
becomes: you are back at base immediately, your gear is still down there in your
body, and the cost is *the trip*, not a screen and a menu. That is precisely
"death costs the run" expressed as a UX rather than a rule.

It also makes the invasion's spectator lock land harder. If every other death in
the game is a two-second inconvenience, being *held* dead is a genuine signal
that this is different.

Serverside via KubeJS (auto-respawn on death). Full-lock stays a config toggle.

> ⚠️ **The invasion CANNOT work by raising spawn rates.** The peaceful-surface
> rule denies hostile spawns above y40, so a rate-based event produces nothing.
> The boss and any adds must be spawned **explicitly**, or the deny rule
> suspended for the duration. This is almost certainly why Enhanced Celestials'
> blood moons already appear to do nothing.

### 3b. The rising surface ✅ — REVISED: rare, not absent

Ethan, 2026-08-01, on the cost of the hard deny:

> This one is complicated because it hurts my peaceful surface dream... what if
> bad mob spawns are rare and then blood moons drastically increase spawns
> instead

**This is a better design than the hard deny, and it is closer to the original
brief than what was built.** The very first spec said:

> we can do light horror above just to be like this world isn't right but it
> should be rare

A deny rule produces *zero*, which is not the same as rare. Zero also wasted
roughly ten mob mods (Born in Chaos, Rotten Creatures, Mutant Monsters, Nyf's
Spiders, Creeper Overhaul, Enderman Overhaul, Cryptid, ArPhEx, Legendary
Monsters, Zombie Awareness) and silently neutered Enhanced Celestials, because a
blood moon works by *raising spawn rates* and there was nothing to raise.

**The model is now a floor and two multipliers, not a switch:**

| | above y40 |
|---|---|
| **Baseline** | a small `maxcount` — hostiles exist, they are rare, and meeting one is an event |
| **× cycle tier** | the cube curve raises the cap as the invasion approaches |
| **× blood moon** | a hard spike — the sky turns red and it *means* something |

A rare mob is scarier than no mob, because the surface stops being safe and
starts being *usually* safe. That is the horror register the brief asked for.

Implementation: In Control's `maxcount` on a phase-gated rule rather than
`result: deny`. `RuleKeys` also carries `random`, so a probability gate is
available if a concurrent cap reads wrong in play. Blood moons need KubeJS to
detect the Enhanced Celestials event and set the phase — the same
`/incontrol setphase` lever the cycle clock uses.

⚠️ The invasion note below still stands and matters more now: the boss and its
adds must be spawned **explicitly**, not by raising rates, because rates are now
a tuned resource rather than a hard zero.

### 3b-i. The old hard-deny model (superseded, kept for context)

Ethan:

> mods exponentially increasing as we hit 30 days? but on a slow curve that
> jumps upwards fast.

In Control ships exactly the right mechanism, and more of it than expected. The
key vocabulary was read out of `RuleKeys` in the jar rather than guessed — 156
keys, including:

| key | use |
|---|---|
| `phases` | **plural.** The list of phases a rule is active in |
| `setphase` / `clearphase` / `togglephase` | phase actions |
| `mindaycount` / `maxdaycount` | day-based conditions, built in |
| `number` / `changenumber` | a counter In Control can read and mutate |
| `minheight` / `maxheight` / `maxcount` | the rule conditions already in use |
| `state` / `pstate` / `setstate` | a persistent state machine |

> ⚠️ **It is `phases`, not `phase`, on a spawn rule.** `SpawnRule`'s constant
> pool contains `phases` and not `phase`. Writing the singular would be silently
> rejected exactly the way `miny`/`maxy` were — unknown key → empty attribute
> map → unconditional no-op rule. This is the second time this specific trap has
> appeared in this file's history; check the jar, not the wiki.

One system per verb, which is what the collision audit kept asking for.

```
tier = floor(6 × (day / 30)³)
```

| day | 5 | 10 | 15 | 20 | 24 | 27 | 29 | 30 |
|---|---|---|---|---|---|---|---|---|
| tier | 0 | 0 | 0 | 1 | 3 | 4 | 5 | **invasion** |

Half the cycle is genuinely peaceful, then it climbs hard in the final week.
Each tier raises the surface spawn cap **and lowers the deny height**, so the
pressure literally descends toward the player before it breaks. The day counter
advances only while players are online, per Ethan's original spec.

### 3c. The Abyssal band — the Vaults

y −64…−128 is verified real in chunk data and **contains nothing**. No
structures, no spawns, no features. Better Mineshafts stops at −55, Ancient
Cities sit near −51, the deepest portals are at −33. Today "descend" means
"descend to −55 and stop."

**Design ruling: no caves down there.** The instinct is to add another cave
layer and it is wrong. The band's value is that it is **solid** — digging
through it should be work, and finding a void should be an event. (This is also
half of why Better Caves was cut: it was carving the underground twice.)

**Not a biome. Discrete sealed structures: Vaults.**

Rare, buried, and built from **SecurityCraft reinforced blocks**. That choice
closes three open problems at once:

| problem | how the Vaults solve it |
|---|---|
| the Abyssal band is empty | it now holds the only thing worth going down for |
| SecurityCraft is permanently unobtainable (179 recipes gated, no loot path) | the Vaults **are** its loot path |
| the stronghold gun injection can never fire (Better Strongholds removes vanilla strongholds) | retarget the injector here |

It also answers the period ruling literally: modern tech is not merely deep, it
is **behind a door someone locked**. Entry becomes the puzzle — reinforced blocks
resist mining, and SecurityCraft keycards become lootable from shallower layers.
That yields a real ladder:

```
  mineshaft (y -55)  →  stronghold  →  VAULT (y -64..-128)
     pistols              keycards        rifles, SecurityCraft, the deep resource
```

**Diamond stays at y −123.** ✅ The depth extension moved every `above_bottom`
ore down 64 blocks, relocating diamond from y ≈ −59. That was an accident, but it
puts the bottom rung of the vanilla progression ladder squarely in the Abyssal
band, which is exactly right. Ratified as intentional; do not "fix" it.

---

## 4. Execution plan

Five stages. Each is independently useful, independently reversible, and gated so
it can be switched off without touching the others. **Stage order is dependency
order, with one exception noted below.**

### D0 — The tally (build FIRST, ship immediately)

A KubeJS handler that records, per player, which mob type killed them. Nothing
else. No gameplay change whatsoever.

**Why first, ahead of anything that uses it:** the Nemesis is only meaningful if
there is real history behind it. If the tally ships with the invasion, the first
invasion picks from an empty or near-empty dataset. Shipping the tally now means
that by the time D4 exists, months of deaths are already recorded. **This is the
one stage whose value comes from being early rather than from being correct.**

- Store on `player.persistentData`; also maintain a server-level aggregate.
- Record the mob **type id**, not the entity — entities are gone by then.
- Log nothing to chat. This stage should be invisible.

*Verify:* die to something on purpose, then dump the tally with a debug command.
The counter increments and survives a restart.

### D1 — The rising surface

- `config/incontrol/phases.json` — 7 phases, `depth_t0` … `depth_t6`.
- `spawn.json` rules gain `"phases": ["depth_tN"]` — **plural** — each tier
  raising `maxcount` and lowering the deny `minheight`.
- The clock. In Control's own `mindaycount`/`maxdaycount` would be the obvious
  gate, **but they read the world day counter, which advances whenever the
  server ticks — including with nobody online.** That contradicts Ethan's spec
  ("only when players are online"). So instead:
  - KubeJS increments In Control's `number` once per in-game day *while at least
    one player is online*.
  - Phases condition on `number` rather than `daycount`.
  - The cube curve maps that number to a tier.

  This keeps In Control owning spawning and gives KubeJS only the job it can
  uniquely do: deciding when a day *counts*.

*Verify:* `/incontrol phases` reports the expected tier; push the counter forward
and watch surface mob counts rise. Confirm tier 0 really is silent, and confirm
the counter does **not** advance while the server idles empty — that is the whole
reason for the indirection.

### D2 — The Vaults (the big one)

- A jigsaw/template structure placed only in y −64…−128, low frequency.
- Reinforced shell; keycard or explosive entry.
- Loot: retarget `deep_stronghold_cache.json` from the dead
  `minecraft:chests/stronghold_*` to the Vault's own tables, and add the
  SecurityCraft + Diligent Stalker injectors that were never written.
- Guarded by the horror stalkers — they belong here, not on the surface.

*Verify:* `/place structure` in a superflat test world, then `/locate` in the
real one. Check a Vault chest actually rolls gun loot.

*Note:* structures only generate in **newly generated chunks**. This does not
need a world regen, but it does mean walking somewhere new.

### D3 — The deep-only resource ✅ SIMPLIFIED

Ethan, 2026-08-01:

> i assumed that what we are doing is just limiting drops to lootr chests or mob
> drops to a specific depth level

**He is right, and this collapses the whole problem.** The previous section
agonised over minting a new item — components vs a KubeJS registration vs
writing a mod, and what each costs a client to download. None of that is needed.

The requirement was never "a new item". It was **an item whose only source is
deep.** So: take something that already exists in the pack, ensure it has no
other source, and inject it into deep loot tables and deep mob drops. That is a
datapack. No new registry entry, no components, no resource pack, no client
download, and no KubeJS ingredient trickery.

- **Source:** Vault chests (Lootr) + mob drops gated by y-level.
- **Sink:** one ammo recipe ingredient.
- **Mechanism:** loot table + global loot modifier, exactly like the existing
  TaCZ injectors.

Guns stay *found*, ammo stays *craftable* (Ethan's ruling, unchanged) — ammo is
simply now tethered to descent forever.

**Still open (A3):** *which* existing item. It wants no other source in the pack,
so the item type itself is the gate. SecurityCraft's currently-unobtainable
items are the obvious pool since they are already becoming Vault loot.

Depends on D2 for a source.

*Verify:* the recipe requires it; the item is obtainable nowhere above y −64.

### D4 — The Nemesis invasion

- Triggers at tier 6 (day 30 of the cycle).
- Reads the D0 tally, picks the collective top mob, spawns it **explicitly**
  with a high L2Hostility level + traits, Apotheosis affixes, a `/bossbar`, and a
  name.
- Spectator-until-wave-breaks respawn rule.
- Cycle resets to tier 0 on victory.
- Announced in advance. An unheralded invasion on a four-person server is a
  griefing event, not a raid.

Depends on D0 (data) and D1 (the clock).

*Verify:* a debug command that force-triggers the invasion regardless of day,
so it can be tested without waiting 10 hours of playtime.

### D5 — Movesets for all melee

A generated datapack writing `data/epicfight/capabilities/weapons/*.json` for
every melee item in the pack, mapped by item type. Format verified in §4b-i.
First job is finding what currently emits the broken `minecraft:axe` entries,
since that is 18 weapons fixed for free if it is only a namespace error.

*Verify:* the `Can't find weapon type` warnings go to zero; swing one of the 18
in game and see a moveset.

### D6 — The surface audit

§2b says the depths hold what does not belong in a fantasy world. That is only
true if the surface is clean of it. Audit every surface-obtainable material
against the rule and push the violations down.

Known exception: `liposcraftablegunpowder`, kept as a slow Nether-gated trickle
so nobody is ever hard-locked. It should stay expensive.

### D7 — Bind Apotheosis's rarity curve to depth ✅

Ethan's ruling: tune Apotheosis, do not add an enchantment mod.

Apotheosis is a complete loot system — affix rarity tiers, an Enchantment
Library, raised enchantment ceilings, gems and sockets — and it has never been
configured. Its premise *is* "better loot from harder sources"; it simply is not
attached to anything. Bind the rarity gradient to y-level so common affixes sit
shallow and the good tiers only appear in the Abyssal band and Vault chests.

This is also the fix for "Epic Knights gets weak really fast" — the gear is fine,
there was no progression curve behind it.

*Verify:* affix rarity distribution differs measurably between a surface chest
and a Vault chest.

### Sequence

```
D0 tally ──────────────────────────────────┐
                                           ├──► D4 Nemesis invasion
D1 rising surface ─────────────────────────┘

D2 Vaults ──► D3 gunpowder gate ──► D7 Apotheosis curve

D5 movesets     (independent)
D6 surface audit (independent, but D3 and D7 create work for it)
```

D0, D2, D5 and D6 can all start in parallel; none blocks another. **D0 should
ship before anything else regardless of what is being worked on** — its value is
entirely in being early, because a nemesis picked from an empty tally is not a
nemesis.

---

## 4b. Progression — what "deeper means better" actually pays out ✅

Ethan, 2026-08-01:

> The ideal is going deeper means getting better loot. But also it could be
> getting rare materials and items needed for progression at great cost.
> ... Idealy i'd like all melee to have custom movesets even. I think the issue
> with epic knights is it gets weak really fast? lets add an enchanment mod and
> then we can make those enchantment books drops.

Three asks. **Two need no new mod, and the third probably does not either.**

### 4b-i. All melee gets movesets — datapack, verified

Epic Fight reads weapon capabilities from **`data/epicfight/capabilities/weapons/*.json`**,
so a datapack can give any weapon in the pack a moveset. Format confirmed by
reading the jar (47 shipped capabilities):

```json
{ "type": "epicfight:longsword",
  "attributes": { "common": { "impact": 2.5, "max_strikes": 2 } } }
```

This is very likely also the fix for the 18 Epic Knights weapons that currently
have none. The live error is:

```
Can't find weapon type: minecraft:axe   (magistuarmory:silver_morgenstern)
```

`minecraft:axe` is not an Epic Fight weapon type — **it looks like a namespace
error for `epicfight:axe`.** Whatever supplies those entries is using the wrong
prefix, and a datapack override can simply restate them correctly. Note Epic
Knights itself ships **zero** epicfight data files, so the source is elsewhere
(Epic Fight's own compat data, or one of the `ef*compat` mods) — confirm before
building.

Planned as **D5**: a generated datapack assigning a capability to every melee
item in the pack, mapped by item type. Serverside, no download.

### 4b-ii. "Epic Knights gets weak really fast" — a progression gap, not a mod gap

The pack already contains the answer and has never tuned it. **Apotheosis** is a
full loot-and-affix system: affixed gear with rarity tiers, an Enchantment
Library, raised enchantment ceilings, gems and sockets — plus ApothicAttributes,
ApothicEnchanting and ApothicSpawners. Its entire premise is *better loot from
harder sources*, which is the ask, unconfigured.

So the fix for gear going stale is not a new mod, it is **binding Apotheosis's
rarity curve to depth**: common affixes shallow, the good tiers only in the
Abyssal band and Vault chests.

**Adding a new-enchantment mod is optional flavour, not the mechanism.** If more
enchantment variety is wanted on top, `enchantments-encore` is the viable 1.21.1
NeoForge candidate found (180k downloads). Recommend deciding that separately and
after seeing Apotheosis actually tuned — adding a mod to fix a tuning problem is
how this pack got to 400 in the first place.

### 4b-iii. The payout ladder

Ethan named both halves — better loot **and** rare progression materials at great
cost. They are different rewards and should sit at different depths:

| band | pays out |
|---|---|
| y 0…−64 | ordinary affixed loot, keycards, ammo components |
| y −64…−128 | high-tier Apotheosis affixes, enchanted books, the deep-only resource |
| Vaults | SecurityCraft reinforced blocks (base defence), TaCZ rifles, the best affix tiers |

The reinforced blocks are the "needed for progression at great cost" half, and
they are what makes the invasion survivable — see §2.

## 5. The serverside constraint ✅

Ethan, 2026-08-01:

> how much of this can stay serverside so im not minting a new mod they need to
> download?

**All of it, with one caveat.** This is a hard constraint on the design, not a
preference — the four players are explicitly not tech savvy and the install has
to stay one click.

| stage | mechanism | client download |
|---|---|---|
| D0 tally | KubeJS `server_scripts` | none |
| D1 rising surface | In Control config + KubeJS | none |
| D2 Vaults | datapack in `world/datapacks/` | none |
| D4 Nemesis | KubeJS + L2Hostility + `/bossbar` | none |
| D3 deep resource | components on an existing item | none **if repurposed** |

Datapacks under `world/datapacks/` are server-only; clients never receive them.
The Vaults cost nothing to download specifically because they are built from
SecurityCraft blocks the pack **already** ships to both sides — that is a reason
to prefer existing blocks over anything bespoke.

**D3 is the only place the constraint bites.** A genuinely new item needs a mod.
It does not need to be new: pick an existing item and rename it through
components (`item_name`, `lore`, `custom_model_data`), which loot tables can set
serverside in 1.21. A "Vault Casing" that is mechanically unique and *looks* like
a copper nugget costs nothing. A bespoke texture would need a resource pack, and
a resource pack is a download — so the rule is: **repurpose, never invent.**

## 6. Answered ✅

**Tally exclusions.** Environmental deaths (fall, lava, drowning) do not create a
nemesis. PvP never does. **Creepers are excluded from nemesis selection** — but
see the open question below, because Ethan also asked for a creeper horde and
those two wants may conflict.

**Vault key: both.** A SecurityCraft keycard *and* a crafted breaching charge.
Two routes in: one looted (find the key), one built (bring the tools). That
suits four players with different play styles, and it means a group that never
finds a card is not locked out.

**Cycle length scales with performance.**

> the number of days decrease inversely on how long they survived?

So the better the group does, the sooner the next invasion. The cycle tightens
as they get stronger, which is the correct direction — it keeps pressure
constant against rising power instead of trailing behind it.

```
next_cycle_days = clamp(BASE * (survival_target / actual_survival_time), FLOOR, BASE)
```

Needs a floor, or a competent group eventually gets a permanent invasion. Start
BASE = 30, FLOOR = 10. Deaths during the invasion should push the other way —
a group that barely won gets more breathing room, not less.

**Portals at depth: dropped.** ✅ Ethan: *"If it makes vaults redundant then no."*
The Vaults are the destination the portals were reaching for, so the request is
satisfied rather than abandoned. Recorded here so it is not re-raised later as an
oversight.

## 7. Still open

- ~~In Control phase conditions~~ — **resolved**, read from the jar. `phases`
  (plural) on rules, `mindaycount`/`maxdaycount` available but world-clock based,
  `number`/`changenumber` is the online-only counter to use instead.
- ~~Which mobs count for the tally~~ — **answered**, §6.
- ~~What the Vault's key is~~ — **answered**, both.
- ~~Cycle length~~ — **answered**, inverse to survival time.
- ~~Portals at depth~~ — **dropped**, the Vaults supersede them.

### ⚠️ The creeper horde vs "death never costs the base"

Ethan, on the tally exclusions:

> no creepers, i honestly don't like creepers to begin with. I do need a horde of
> them blowing up my stuff

Creepers being excluded from *nemesis selection* is settled. The horde is not,
because taken literally it **contradicts the one rule this whole design is built
on** (§2): *death costs the run, it never costs the base.* A creeper horde
reaching the base does exactly the thing that rule exists to prevent, and it is
the thing most likely to make someone stop playing on a four-person server where
one person built the factory.

Three readings, and they need separating before D4:

1. **Creeper adds, but the base is protected.** They spawn at the invasion
   perimeter and threaten *players*, not structures — `mobGriefing` off for the
   duration, or explosions damage-only. Keeps the pressure, keeps the rule.
2. **Creeper adds that genuinely can breach the base.** Real stakes, real risk
   of losing hours of building. Legitimate, but it is a deliberate reversal of
   §2 and should be written down as such rather than arrived at by accident.
3. **It was dry.** "I do need a horde of them blowing up my stuff" read as
   sarcasm — i.e. no creeper horde at all.

Default to (1) unless Ethan says otherwise: it satisfies the stated want
(creepers are a threat during invasions) without quietly discarding a ratified
principle. This is the single decision most likely to be regretted after the
fact, so it should be explicit.
