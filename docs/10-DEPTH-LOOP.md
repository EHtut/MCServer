# The Depth Loop — why anyone goes down

**Status: DESIGN, NOT BUILT.** Nothing in this document is implemented. It exists
to be argued with before any of it is written.

---

## The question this answers

Ethan, 2026-08-01:

> Why do we want go into the depths? And then maybe a death system to make the
> depths rougelike?

The honest state of the pack when that was asked: **descending has one reward,
and it is a one-time reward.** Buried tech — TaCZ guns, SecurityCraft, salvage —
is loot-gated to deep chests. Once you have a rifle and ammo is craftable on the
surface, the depths have paid out and there is no reason to return.

That is a threshold, not a loop. You cross it once and the entire lower half of
the world becomes scenery.

Three further things were then found dead in the audit, and they matter here
because they were *supposed* to be the answer:

- The peaceful surface never worked (`miny` vs `minheight`), so there was no
  contrast to descend *away from*.
- Kill-heat never worked (`getMobCategory`), so descending carried no rising
  cost.
- Nothing implements a hostility or technology gradient with depth at all. The
  four-stratum table in `06-BURIED-TECH.md` is prose.

So the depths currently have no pull, no pressure, and no gradient. This design
adds all three, and it hangs them off the one idea Ethan supplied that the
original framing did not have.

---

## The core move: descent is an expedition, not a destination

You prepare on the surface, descend with a loadout, extract, and come back up.
The surface industry exists to **fund** expeditions; expeditions bring back what
the industry **consumes**. That closes the circuit between the two pillars —
Create and buried tech — which currently run in parallel and barely touch.

This framing does three jobs at once:

1. It gives descent a *renewable* reason rather than a one-time payout.
2. It makes the roguelike death layer survivable in a base-building game,
   because the thing you risk is the run, never the base.
3. It gives the four strata a purpose beyond flavour: each is a deeper
   expedition with a higher ceiling and a higher cost.

### The rule that keeps it playable

> **Death costs the run. It never costs the base.**

Roguelike death and persistent base-building fight each other. If dying costs
your Create factory, nobody descends. If dying costs nothing, depth is trivial.
The expedition framing resolves it: you drop what you carried, your surface
holdings are untouched, and Corpse still gives you one retrieval attempt — which
is naturally harder the deeper you fell, because you have to make the descent
again with your heat reset and the mobs still there. **No new punishment
mechanic is required. The geometry already does it.**

---

## Ethan's invasion event — the better half of this design

> Or there could be a sort of overworld invasion event that triggers every 30 in
> game days (only when players are online) which causes a massive horde which
> stops players from respawning until everyone is dead?

This is stronger than the salvage-run framing it replaces, for a reason worth
naming: **it makes the reason to descend recurring, shared, and externally
imposed.** A salvage loop asks each player to want something. An invasion tells
all four players they need something, on a clock, whether they feel like it or
not.

It also solves the problem that the expedition loop does not: what stops the
group from simply *not* descending and turning the surface into a comfortable
factory game? The invasion does. It is the demand side of the economy.

### How it fits with the rest

| | |
|---|---|
| **Depth** | supplies the power |
| **Invasion** | consumes it, on a clock |
| **Kill-heat** | is the pressure *during* a descent |
| **Death** | resets the run, not the base |

The one thing to be careful about is the respawn lock. "Cannot respawn until
everyone is dead" is a strong mechanic and it has a specific failure mode: with
four players, the first person to die may sit out a long event doing nothing.
Options, in order of preference:

1. **Spectator until the wave breaks.** Dead players spectate the living. Keeps
   them in the event, keeps the tension, costs nothing.
2. **Respawn at wave boundaries** rather than never — the lock holds within a
   wave, releases between waves. Retains the stakes, bounds the downtime.
3. Full lock as literally described. Simplest, harshest; worth trying only if
   the group actively wants it.

I would build (1), with (2) as a config toggle.

### Cadence

30 in-game days ≈ 10 hours of play, only counting time when players are online.
That is a good first number precisely because it is long: the first invasion
should arrive when the group has a base worth defending and has had time to
descend at least once. It should be **configurable and announced** — an invasion
that arrives unheralded on a four-person server is a griefing event, not a raid.

---

## What has to be built

Ordered by whether it is a fix, a small addition, or a real build.

### Tier 1 — the gradient (fixes, mostly config)

The vocabulary already exists and is unused. In Control now parses correctly, so
height-banded rules are available for the first time.

| Band | Character | Mechanism |
|---|---|---|
| Surface, y ≥ 40 | peaceful; rare anomaly | **DONE** — In Control deny rule now works |
| y 0…39 | ordinary hostiles, capped | **DONE** — 40-concurrent cap now works |
| y −64…−1 | deep hostiles, buried tech begins | In Control `minheight`/`maxheight` rules per mob group |
| y −128…−65 | the Abyssal band | currently **empty of all content** |

The Abyssal band is the biggest hole in the pack. The depth extension is real —
verified in chunk data, sections down to y −128 — and **nothing generates there.**
No structures, no spawns, no features. Better Mineshafts stops at −55, Ancient
Cities sit around −51, and the deepest portals are at −33.

### Tier 2 — the renewable resource (small build, high value)

The expedition loop needs one thing the pack does not have: **a deep-only
resource the surface economy consumes.**

Ammunition is the obvious lever and it preserves Ethan's existing ruling exactly.
Guns stay *found*, ammo stays *craftable* — but if one component of ammo
(casings, propellant, a refined powder) only comes from depth, then guns stay
tethered to descent permanently without walling anyone out of them.

This is also what the invasion consumes. The loop becomes:

```
  surface industry  →  funds an expedition
        ↑                      ↓
   invasion demand   ←   deep resource  →  ammo / power
```

### Tier 3 — the invasion (real build)

Needs: a day counter that only advances with players online, a warning period, a
wave spawner, the respawn rule, and an end condition. KubeJS can carry all of it;
the horror stalkers already in the pack are the obvious wave content, and
`enhanced-celestials` blood moons are a natural carrier for the warning.

**Note the interaction:** the peaceful-surface rule denies all hostile spawns
above y40. An invasion that works by raising spawn rates **will do nothing.** It
must spawn its horde explicitly, or temporarily suspend the deny rule. This is
almost certainly also why blood moons currently appear to do nothing.

---

## Open problems, honestly

**The depth extension moved the ore.** Every `above_bottom`-anchored vanilla ore
shifted down 64 blocks when `min_y` went to −128. Diamond did not become rarer —
it *relocated* from y ≈ −59 to y ≈ −123, into the band the design itself
describes as largely solid deepslate. Five other ores are diluted 33–50% per
y-level. Nobody decided this; it fell out of the depth change. It needs either a
deliberate re-anchor or an explicit "yes, diamond is an Abyssal resource now"
ruling — which would actually suit the design, but should be a choice.

**SecurityCraft and Diligent Stalker are unobtainable.** 179 recipes were gated
behind depth and no loot path was ever built, and the entry-point recipe (the
universal block reinforcer) is itself disabled. This is strictly worse than not
gating them. They need injectors, exactly as TaCZ got.

**The stronghold gun injection can never fire.** YUNG's Better Strongholds
disables vanilla strongholds through a required mixin, so the 15% roll targets
loot tables that do not generate. It needs retargeting at
`betterstrongholds:chests/*`.

**Portals at depth were requested and never built.** Nothing in the repo touches
portal placement. Currently the only sub-surface portals are HopoBetterRuinedPortals'
nether portals at y −33…15 and Deeper Darker's Otherside portal in Ancient
Cities. Nothing generates below −64.

---

## What I would build first

1. **The Abyssal band gets content.** It is the single largest gap and every
   other idea here assumes it exists. Without it, "descend" means "descend to
   −55 and stop."
2. **The deep-only ammo component.** Smallest change that converts a one-time
   payout into a loop.
3. **The invasion**, once 1 and 2 give it something to demand.

Kill-heat, the peaceful surface and the death rule are already in place — heat
now accrues, the surface is quiet, and Corpse plus heat-reset already implements
"death costs the run." **The roguelike layer is closer to done than it looks; it
is the reason to descend that is missing.**
