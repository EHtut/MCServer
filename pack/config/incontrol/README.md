# In Control — the depth stratification

JSON files cannot carry comments, so the reasoning lives here.

## What `spawn.json` does

## THE PRINCIPLE: suppress AMBIENT spawning, never DELIBERATE placement

Everything below is one idea. The peaceful surface is supposed to mean *monsters
do not wander up out of nowhere* — it was never supposed to mean *a dungeon full
of spawners is inert*.

So the first three rules hand every **deliberate** spawn straight back to
vanilla, and only then does the height deny apply to what is left, which is
ambient natural spawning.

| Rule | Effect |
|---|---|
| 0 | **Mob spawners always work**, any depth. Someone placed that spawner on purpose. |
| 1 | **Structure-generated spawns always work** — the mobs a structure creates as it generates. |
| 2 | **Anything inside a structure's bounds is left to vanilla**, any depth. Dangerous places stay dangerous. |
| 3 | No `Enemy` mob spawns in the OPEN overworld at y ≥ 40. Any time, any light level. |
| 4 | No mob from the pure-monster mods at y ≥ 40. |
| 5 | No named night-horror mobs at y ≥ 40 from mods with a mixed roster, so bosses and tameables survive. |
| 6 | Between y 0 and 39, hostiles spawn normally but are capped at 40 concurrent — uneasy, not swarming. |

Below y 0 nothing is restricted: the deep is meant to be dangerous.

### Rules 0 and 1 exist because a dungeon was dead

Ethan, 2026-08-02: *"We spawned next to a dungeon that had spawners inside. they
didn't spawn anything."*

Rule 2 (`hasstructure`) was supposed to cover that and does not, for a reason
worth writing down: **a vanilla dungeon is not a Structure.**
`minecraft:monster_room` is a *configured feature* carved into terrain during
worldgen, not an entry in `worldgen/structure`. `isInAnyStructure` therefore
returns false inside one, the height deny applied, and every spawner above y 40
in the world was inert.

`spawntype` is the fix, and it is a better expression of the intent than
`hasstructure` ever was. In Control understands exactly three values — verified
against the jar: **NATURAL, SPAWNER, STRUCTURE**. Handing SPAWNER and STRUCTURE
back to vanilla means the deny can only ever hit NATURAL ambient spawning, which
is the only thing it was ever meant to hit.

Note this also means `spawntype` cannot see **PATROL** — see the pillager section
below. Patrols are neither ambient nor deliberate as far as In Control is
concerned; they are simply invisible to it.

### Why `default` and not `allow`

`default` means *no opinion, let vanilla decide*, and because In Control stops at
the first matching rule, it exempts the spawn from every later deny while leaving
its behaviour exactly as the mod or structure author intended. `allow` would
FORCE the spawn through, ignoring light level and vanilla placement checks, and
would over-populate every dungeon it touched.

The consequence to be aware of: villages are structures too, so a village at
night can see hostile spawns. That is vanilla behaviour and arguably correct for
"spots of civilization", but it is a real change.

## ⚠️ `hostile` IS NOT A CATEGORY. This is the bug that cost a night of play.

This file used to carry rule 1 alone, justified like this:

> *It denies by the `hostile` flag rather than by listing mobs. With ~390 mods,
> enumerating every hostile entity is a list that silently rots the moment a mod
> updates. Denying the category holds regardless of what gets added later.*

**Every sentence of that is wrong, and it reads as sound engineering.** In
Control 10.2.6 implements `"hostile": true` as `instanceof net.minecraft.world
.entity.monster.Enemy` — a vanilla **marker interface**, not `MobCategory`. A mod
that writes a hostile mob without implementing `Enemy` is invisible to the rule.

Scanning the pack found **186 player-attacking entities that rule 1 cannot see**,
and that is an undercount — the scan keys on `NearestAttackableTargetGoal`, so
MCreator mobs with custom targeting (Valarian Conquest's Archer among them) are
missed entirely.

| Mod | Invisible mobs |
|---|---|
| Born in Chaos | 76 |
| Legendary Monsters | 31 |
| L_Ender's Cataclysm | 27 |
| Ice and Fire | 13 |
| Arda's Sculks | 6 |
| The Obsessed | 6 |

Ethan met two of them on the first night of the fresh world: Ice and Fire's
**Ghost** and Valarian Conquest's **Archer**. There is no `category` selector in
In Control 10.2.6 — verified against the jar, the available keys are `hostile`,
`passive`, `mob`, `mod`, `structure`, the height/light/time/weather conditions,
and the seasons. So the hole cannot be closed with one clean rule.

**Why not just invert it** (allow passive, deny everything else)? Because
`passive` is `instanceof Animal`, equally narrow. Inverting would deny villagers,
iron golems, bats and squid — it would delete "spots of civilization" from the
design. Rules 2 and 3 are the deliberate compromise: broad `mod` denies where a
mod's whole roster is monsters, named `mob` denies where it is not.

## What rules 2 and 3 deliberately do NOT touch

* **Dragons.** Ethan's ruling: "lets keep the dragons normal." Ice and Fire is
  denied by named mob, not by mod, precisely so the dragons keep spawning.
* **Boss beasts** — Cyclops, Hydra, Gorgon, Deathworm. The design says
  fantastical beasts "should really only be boss enemies", and these are exactly
  that. The `dread_*` family and `ghost` are ambient night horror, which is not.
* **Hippogryph and Amphithere** — tameable mounts, not threats.
* **The stalkers** (The Obsessed, The Knocker, Distant Friends, Weeping Angels).
  They are supposed to appear on the surface, rarely. Most spawn through their
  own event schedulers rather than the vanilla spawn cycle, so In Control never
  sees them anyway — the same property that made Vampirism and Werewolves
  ungovernable and got them cut.

## In Control NEVER SEES PILLAGER PATROLS

A live vanilla Pillager was found at y=65 on a fresh world, which rule 1 should
have denied — Pillager does implement `Enemy`. The nearest illager structure was
962 blocks away, so it was not a camp.

The reason is in the jar: In Control's `spawntype` recognises exactly three
values — **NATURAL, SPAWNER, STRUCTURE**. Vanilla pillager patrols spawn with
`MobSpawnType.PATROL`, which is none of those, so the patrol spawner is a route
In Control does not evaluate at all. No spawn rule here can stop patrols.

That is the same class of bypass that got Vampirism and Werewolves cut, and it
means a wandering patrol can still arrive anywhere on the surface. If they need
to go, it takes a mod or a mixin that disables the patrol spawner — not this file.

## A rule cannot remove what WORLDGEN placed

Pillager outposts arrive with their garrison already placed, as part of the
structure — those pillagers were never "spawned" and no spawn rule will remove
them. Rules only stop the *replacements*. An outpost that generated next to
world spawn stays dangerous until it is cleared by hand or spawn is moved.

## Applying changes

`spawn.json` is read at world load and on In Control's own command. **`/reload`
does NOT re-read it** — verified by counting "Reading rules from spawn.json" in
the log across a reload. From a player (not RCON; the command needs a player
context):

```
/ctrl reload
```

`/incontrol reload` is the same command. **`/ctrlreload` — which this file used
to document — does not exist.**

If a rule is malformed, In Control logs it and **ignores that rule** rather than
failing loudly, so always confirm the intended effect in-game rather than
assuming the file took. `/ctrl showmobs` and `/ctrl debug` are the tools for it.

An unenforced rule and a working rule look identical in the file. That is how
rule 1 survived from the first boot to a fresh world's first night.
