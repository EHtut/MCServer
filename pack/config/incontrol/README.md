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
| 3 | **Anything that cannot see the sky is left to vanilla, at ANY height.** Caves are caves whether they are at y 12 or y 190. |
| 4 | No `Enemy` mob spawns under OPEN SKY at y ≥ 40. Any time, any light level. |
| 5 | No mob from the pure-monster mods under open sky at y ≥ 40. |
| 6 | No named night-horror mobs under open sky at y ≥ 40, so bosses and tameables survive. |
| 7 | Between y 0 and 39, hostiles spawn normally but are capped at 40 concurrent — uneasy, not swarming. |

Below y 0 nothing is restricted: the deep is meant to be dangerous.

### `hasstructure` is REMOVED, and it was the actual cause

`/ctrl debug` settled this with numbers instead of theory. Over one sample:

    Rule (hasstructure)  173 hits   <- dominant
    Rule (maxlight_sky)   89 hits
    Rule (surface deny)    5 hits   <- almost never reached

and it was passing things like `enderman y:66`, `baby_skeleton y:94`,
`zombie y:36` — open surface, in the open world.

`hasstructure` is true anywhere inside **any structure's bounding box**, and
those boxes are large. With Dungeons Arise, CTOV, Valarian Conquest and Explorify
all generating densely, they blanket much of the map — so the rule was silently
switching the surface deny OFF nearly everywhere. That, not `seesky`, is what
produced waves of creepers around a base.

It is gone, and nothing is lost, because the two rules above it are the precise
version of what it was trying to say:

* `spawntype: SPAWNER` — a dungeon's spawner works, always
* `spawntype: STRUCTURE` — mobs a structure creates as it generates
* and a dark sealed dungeon interior is caught by `maxlight_sky: 0` anyway

An open-air fort courtyard at y 70 no longer spawns ambient hostiles. Its
spawners and its garrison still do. That is the intended reading of "dangerous
places stay dangerous" — the danger is what was PLACED there, not the postcode.

**The general lesson: a boolean that sounds narrow can be enormous in practice.**
`hasstructure` reads like "inside a dungeon" and means "inside any structure's
bounding box", which in a heavily-structured world is most of the surface. Debug
counts exposed in one minute what reasoning had not in two attempts.

### Rule 3 — the discriminator, and the one that cost half a base

The intent has been right twice and the *mechanism* wrong twice. Worth writing
both failures down, because the difference between them is subtle and expensive.

**Attempt 1 — `minheight: 40` alone.** y 40 is an ABSOLUTE height, not a measure
of being underground. In a world with tall terrain a cave at y 90 inside a
mountain was as safe as an open meadow, and whole cave systems were inert purely
because of where the mountain put them. Symptom: *"he's not encountering any
enemies."*

**Attempt 2 — `seesky: false`.** Correct idea, wrong key. `seesky` means
**roofed**, not underground: tree canopy, overhangs, and the shadow of your own
build all return false. In open flower fields with structures on them that is an
enormous amount of newly spawnable ground. Symptom, the same evening:
*"half my base is gone from waves of creepers every night."*

The dial-back documented at the time (`maxheight: 60`) would in fact have saved
the base — but it would also have re-killed the mountain caves that were the
entire reason for the change. **The real error was shipping the permissive
variant first.** When a change can damage something a player has built, ship the
conservative version and loosen it, never the other way round.

**Attempt 3 — `maxlight_sky: 0`, and why it is actually different.** In Control
resolves this through `getBrightness(LightLayer.SKY, pos)`, verified in
`GenericRuleEvaluator`. It asks *how much sky light reaches this block*, and the
answer is 0 only where the sky is genuinely sealed off:

| place | `seesky` | `maxlight_sky` | wanted |
|---|---|---|---|
| open field | true | 15 | no spawn |
| under tree canopy | **false** | >0 (leaks around leaves) | no spawn |
| under an overhang | **false** | >0 (propagates sideways) | no spawn |
| beside a built wall | **false** | >0 | no spawn |
| deep cave, any height | false | **0** | SPAWN |

Sky light propagates and attenuates; it does not stop dead at the first solid
block the way `seesky` does. That is exactly the difference between "roofed" and
"underground", and it is why the canopy and base-shadow spawns disappear while
mountain caves keep working.

A lit base stays safe on top of this for the ordinary vanilla reason: hostile
spawns also require block light 0. `maxlight_sky` only decides whether the
*surface rule* applies; it never forces a spawn.

### Historical: "y 40" was never what the design meant

Ethan, 2026-08-02: his brother, high up, *"says he's not encountering any
enemies"*.

The rule was doing exactly what it said, and what it said was wrong. **y 40 is an
ABSOLUTE height, not a measure of being underground.** In a world with tall
terrain that has an obvious consequence nobody had stated: a cave at y 90 inside
a mountain was every bit as safe as an open meadow. Whole cave systems were inert
because of where the mountain happened to put them.

The design never meant "above y 40". It meant **"in the open"**. `seesky` is that
distinction directly — In Control backs it with `canSeeSkyFromBelowWater` — so
rule 3 hands every enclosed spawn back to vanilla regardless of altitude, and the
height denies below it now only ever apply to open sky.

Stated as one sentence: **the sky is safe; the dark is not, wherever it is.**

**Known consequence, deliberate:** a spawn point under any solid block cannot see
the sky, so dense forest canopy and deep overhangs count as "enclosed" and can
spawn at night. That gives woods some teeth after dark while open fields stay
quiet. If it proves too much, the fix is to add `"maxheight": 60` to rule 3 so it
only covers genuinely low ground — but try it first; a forest that is safer than
a cave but less safe than a meadow is arguably the right shape.

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

---

# spawner.json — the CUSTOM spawner (added 2026-08-02)

`spawn.json` can only ever say yes/no to a spawn vanilla was already going to
attempt. It cannot make the world *more* dangerous. `spawner.json` is a second,
independent system: In Control spawns these itself, on its own timer, ignoring
vanilla's density and the monster mobcap entirely. That is the only lever that
raises pressure rather than filtering it.

It was empty and unused until the underground measured out barren
(`tools/genq.py`: 0 of 967 structure markers below y-64). Three depth tiers now
live there — vanilla mobs at y0..39, the horror roster entering at -1..-60, ten
types at -61..-128.

## The schema, learned by four failed boots

Every key is validated and every rejection names itself in the log, so booting
and reading beats guessing. What it actually accepts:

* **`mob`, never `mobs`.** The plural yields `Invalid command 'mobs' for spawner
  rule!` and the rule is dropped. It takes a plain string array **and** an array
  of `{"mob": ..., "weight": N}` objects — both verified in one boot by putting a
  different form on each tier.
* **`dimension` is REQUIRED, SINGULAR, and lives inside `conditions`.** Omitting
  it fails the whole file with *"No dimensions specified!"*. The plural appears
  only as the getter name and in that error's own prose, which is exactly what
  makes `dimensions` look correct — it is rejected. The tell is in the bytecode:
  the enum constant is `DIMENSION` and the parser calls `toLowerCase`.
* **PositionCheck keys do NOT apply here.** `maxlight` and `maxlight_sky` are
  both rejected, even though `spawn.json` accepts the latter. The two systems do
  not share a condition set.
* Valid conditions are exactly SpawnerConditions': `dimension` · `mindist` /
  `maxdist` · `minheight` / `maxheight` · `minverticaldist` / `maxverticaldist` ·
  `mindaycount` / `maxdaycount` · `maxthis` / `maxlocal` / `maxtotal` ·
  `maxhostile` / `maxpeaceful` / `maxneutral` · `inair` / `inwater` / `inlava` /
  `inliquid` · `sturdy` · `validspawn` · `norestrictions`.
* `number` is a *check*, not a multiplier. There is no way to scale vanilla's
  spawn counts; you add spawns with this file or not at all.

## ⚠️ It bypasses the vanilla darkness check

A rule without `validspawn` will happily spawn inside a torch-lit base. That is
the creeper-wave mistake one layer down — a change that can damage something a
player BUILT must ship in its conservative form.

**Use `"validspawn": true` on every rule.** It runs the mob's own vanilla spawn
check, so darkness, spawn-blocking blocks and per-mob placement rules all apply.
It is strictly stronger than the light number this originally tried to use, and
unlike `maxlight` it is a key that exists.

## Verifying it

Parsing clean is not evidence it spawns — this repo has shipped three mechanics
that loaded with 0 errors and were dead. The spawner needs a player inside
`mindist`..`maxdist`, so it does nothing on an empty server and cannot be
verified from RCON. Get below y-61 and:

```
/ctrl showstats
```

`/ctrl clearstats` resets the counters first if you want a clean read.
