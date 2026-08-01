# In Control — the depth stratification

JSON files cannot carry comments, so the reasoning lives here.

## What `spawn.json` currently does

| Rule | Effect |
|---|---|
| 1 | **No hostile mob spawns anywhere in the overworld at y ≥ 40.** Any time, any light level. This is the load-bearing rule — it is what makes the surface peaceful. |
| 2 | Between y 0 and 39, hostiles spawn normally but are capped at 40 concurrent, so the shallow band is uneasy rather than swarming. |

Below y 0 nothing is restricted: the deep is meant to be dangerous.

## Why the surface rule is a blanket deny

It denies by the `hostile` flag rather than by listing mobs. With ~390 mods,
enumerating every hostile entity is a list that silently rots the moment a mod
updates. Denying the category holds regardless of what gets added later.

## The horror layer — verify this at first boot

The stalker mods (From The Fog's successors, The Obsessed, The Skinwalker Hunt,
Distant Friends, Weeping Angels) are the deliberate exception: they are supposed
to appear on the surface, rarely, to sell "this world isn't right".

**Most of them spawn through their own event systems rather than the vanilla
spawn cycle, so rule 1 should not touch them.** That is an expectation, not a
verified fact. Check it on the first night of real play:

* If the stalkers still appear → nothing to do.
* If rule 1 has silenced them → add an exemption rule ABOVE rule 1, listing their
  entity IDs with `"result": "default"`. In Control evaluates in order and the
  first match wins, so an exemption placed first survives the blanket deny.

Harvest the real entity IDs from a running server rather than guessing:

```
/data get entity @e[limit=1] id
```

or read them from each mod's registry dump. Do not hand-write mod entity IDs —
they are frequently not what the mod's display name suggests.

## Applying changes

`spawn.json` is read at world load. After editing:

```
/ctrlreload
```

No restart needed. If a rule is malformed, In Control logs it and **ignores that
rule** rather than failing loudly — so always confirm the intended effect in-game
rather than assuming the file took.

## Schema note

The field names used here (`dimension`, `hostile`, `miny`, `maxy`, `maxcount`,
`result`) are In Control's standard spawn-rule vocabulary. They were written
against the empty config the mod generated on first boot, not verified against a
running rule. **Confirm rule 1 actually works before treating the surface as
safe**: stand on the surface at night with `/gamerule doMobSpawning true` and
watch. An unenforced rule and a working rule look identical in the file.
