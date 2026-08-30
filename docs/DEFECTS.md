# DEFECTS — findings with IDs

> **New 2026-08-29.** Until now every finding lived in a commit message or in the
> numbered doc of whatever chunk turned it up. That works while you remember the chunk
> and stops working the moment you do not.
>
> ⭐ **One entry per defect, with an ID, whether it is open or fixed, and what it
> actually cost.** A fixed defect stays here - the lesson is the point, not the status.
>
> ⚠️ This is not a to-do list. Work lives in `68-THE-GAMEPLAN.md`; this records what
> was found to be WRONG, so the same class does not get rediscovered a third time.

---

## D-101 — `spawn_pressure.js` multiplied every spawn, not just natural ones ✅ FIXED 2026-08-29

> Ethan: *"spawned the devil from the devil mod and it spawned 4 of them."*

**The file's own header had said, since it was written, that "a coefficient multiplies
NATURAL spawns". Nothing ever checked.** `checkSpawn` fires for every spawn there is, so
the density branch was also multiplying:

| type | what it is |
|---|---|
| `SPAWN_EGG` | an egg placed by hand |
| `COMMAND` | `/summon` — ⚠️ **including `spawner.js`, which is how the tide spawns** |
| `SPAWNER` | mob spawner blocks |
| `STRUCTURE` | structure-placed mobs |

At Blade's 3.0 that is **+2 guaranteed**; deep, it hits `MAX_DUP_PER_EVENT` = 4. One
summoned devil became four.

⚠️ **The tide was bounded**, which is why this survived unnoticed: `DUP_COOLDOWN` limits
duplication to once per 2s per player, so a 24-mob wave gained **+4, not 4×**.

⭐ **The accessor was read out of the jar, not guessed** —
`dev/latvian/mods/kubejs/entity/CheckLivingEntitySpawnKubeEvent` exposes
`public final transient MobSpawnType type` and `getType()`.

⚠️ **It fails CLOSED.** An unreadable type returns and shouts rather than falling through
to the old behaviour — falling back to "apply to everything" *is* the bug. And it matches
on **substring**, not equality: a remap handing back `MobSpawnType.NATURAL` instead of
`NATURAL` would otherwise disable density everywhere, which reads as *"Blade got easier"*
rather than as a fault.

⭐ It now logs each distinct spawn type once, so what actually reaches the hook on a
300-mod server is **measured** rather than remembered.

### ⛔ Still open, and a separate decision

**Natural hostile spawns still come in packs of 4** — that is vanilla's own
`minCount: 4, maxCount: 4` for zombie/skeleton/spider/creeper, not anything this pack
does. Fixing it means either biome modifiers (⚠️ which would flatten biome-specific
spawn lists across Terralith + RU + Nyctophobia) or a clump-thinning `checkSpawn` rule.
**Not attempted.**
