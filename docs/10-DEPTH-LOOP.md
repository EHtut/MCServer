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

> **Death costs the run. It never costs the base.** ✅

Roguelike death and base-building fight each other: if dying costs your factory
nobody descends; if it costs nothing, depth is trivial. The expedition framing
resolves it — you drop what you carried, your holdings are untouched, and Corpse
gives you one retrieval attempt that is naturally harder the deeper you fell.
**No new punishment mechanic is needed; the geometry already does it.** Kill-heat
resetting on death already implements the run-reset half.

---

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
nemesis reads instantly and stays personal. Per-player staggered bosses remain
the fallback if it feels too impersonal in play.

**Respawn rule.** Ethan's original was "no respawn until everyone is dead". That
has a failure mode: the first player to die sits out a long fight doing nothing.
Build **spectator-until-the-wave-breaks** — dead players spectate the living,
staying in the event without being able to act. Keep full-lock as a config
toggle.

> ⚠️ **The invasion CANNOT work by raising spawn rates.** The peaceful-surface
> rule denies hostile spawns above y40, so a rate-based event produces nothing.
> The boss and any adds must be spawned **explicitly**, or the deny rule
> suspended for the duration. This is almost certainly why Enhanced Celestials'
> blood moons already appear to do nothing.

### 3b. The rising surface ✅

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

### D3 — The deep-only resource

One ammo component — casing, propellant, refined powder — obtainable **only**
from the Abyssal band or Vault loot. Guns stay *found*, ammo stays *craftable*
(Ethan's ruling, unchanged), but ammo is now permanently tethered to descent.

Depends on D2 for a source.

*Verify:* the recipe requires it; the component appears nowhere above y −64.

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

### Sequence

```
D0 tally ──────────────────────────────────┐
                                           ├──► D4 Nemesis invasion
D1 rising surface ─────────────────────────┘

D2 Vaults ──► D3 deep resource
```

D0 and D2 can be built in parallel; neither blocks the other. D0 should ship
before anything else regardless of what is being worked on.

---

## 5. Still open

- ~~In Control phase conditions~~ — **resolved**, read from the jar. `phases`
  (plural) on rules, `mindaycount`/`maxdaycount` available but world-clock based,
  `number`/`changenumber` is the online-only counter to use instead.
- **Which mobs count for the tally.** Environmental deaths (fall, lava, drowning)
  should presumably not create a nemesis. Player deaths in PvP definitely
  should not.
- **What the Vault's key actually is** — SecurityCraft keycard, a crafted
  breaching charge, or both.
- **Cycle length after the first invasion.** 30 days is a good *first* number
  because it lets a base exist before the first raid. It may want to shorten, or
  to scale with how comfortably the group won.
- **Portals at depth** (originally requested, never built) — the Vaults may make
  this redundant, or may be the natural place to put one.
