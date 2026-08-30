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

---

## ⭐ T1 — the tide is hers. Not a defect; recorded because it REVERSED one. 2026-08-29

> Ethan: *"Alice is the goddess of death. She has a focus on skeletons, not zombies."*

The tide's three depth pools (SHALLOW / DEEP / DEEPER — twenty mobs from six mods:
zombies, ghouls, templars, wights, husks, drowned) collapse into **one role-keyed
skeleton roster**. Composition now comes from the **modifier**, not from `y`.

| modifier | pool |
|---|---|
| `horde` | Decrepit Skeleton — the bulk |
| `general` | + vanilla Skeleton, Bonescaller |
| `specialist` | + Thrasher (tank), Bonescaller, Demoman (rare, dangerous) |
| `miniboss` | Supreme Bonescaller, **Fallen Chaos Knight** |

### 🔴 It reversed a prior ruling, and that is the point of this entry

`tide.js` carried: *"⛔ `fallen_chaos_knight` IS DELIBERATELY ABSENT. It is Blade's
stalker avatar, 'The Challenger', and **Ethan ruled it stays his**."* He then listed it
himself as one of the tide's two minibosses.

⭐ The newer ruling wins, but it is a **lore change**, not a roster tweak: the goddess of
death now sends a *fallen version of the Warrior* at his own champions. The old ruling is
kept in place in both the code and the harness, with the assertion **inverted rather than
deleted**, so the reversal is visible instead of silently gone.

### 🚨 And it caught a bug before it shipped

**`decrepit_skeleton` was listed RANGED, and it is the bulk.** Under the new roster that
inverts every wave — `general` and `specialist` weight the ranged list, so the mob meant
to *be* the horde would have become the archers and the archers the filler. It survived
before only because the old depth pools held several melee mobs alongside it. Found by
reading his roles against the map, not by playing a wave.

⚠️ `stray`, `bogged` and `skeleton_lackey` were also removed from the ranged map: no
roster can draw them any more, and a map naming mobs nothing contains is a map nobody can
trust.

### ⚠️ Two costs, named

**Depth no longer changes composition.** A surface night tide and a y−100 tide are the
same skeletons, differing by tier and count. `rosterFor` was depth's only consumer, so
this trades mob variety for authorship — deliberately, and it is the one thing likely to
be felt in play.

**The harness went flaky and had to be fixed twice.** A varied wave is a *designed*
outcome, so three composition tests failed about one run in five. 🚨 **Flaky is worse
than absent**: it teaches you to re-run instead of to look. Variation is now suppressed
inside those tests, verified over 15 consecutive runs.

**106 tide assertions, 3 negative controls all red. 862 passed / 0 failed across 22
harnesses. Live 62/62, 0 errors.**

---

## 🔴 D-102 — "there is no shake" was true, and it was the wrong scope. 2026-08-29

Asked whether god dialogue could be *"shaking stylized text on the top of the player's
screen"*, I answered:

> ⛔ *"THERE IS NO SHAKE. Vanilla cannot animate text position… Undertale-style
> per-character motion is a client renderer feature and no server-side route reaches
> it."*

⚠️ **Every clause of that is true and the conclusion was wrong**, because the question
was never restricted to vanilla. `immersive-messages-api` — which Ethan added on his own
instinct — **is** that client renderer feature, and it ships a **server-side send**.

`ImmersiveMessage` (read from the jar, not the wiki) exposes:

| | |
|---|---|
| `shake()` / `shake(intensity, speed)` | the thing I said was impossible |
| `typewriter(speed, centered)` | letter-by-letter |
| `anchor(TextAnchor)` | **nine** anchors, including `TOP_CENTER` |
| `ObfuscateMode.RANDOM` | exactly what `garble.js` weaves by hand |
| `slideUp/Down/Left/Right`, `fadeIn/Out`, `size`, `background`, `sound`, `subtext` | |
| `sendServer(ServerPlayer)` | server-side, single player or collection |

⭐ **Three workarounds built this session were imitating this API**: the boss-bar
re-sent with uneven padding to fake a wobble, the `/title actionbar` sting, and `§k`
woven in one character at a time.

### ⚠️ What was NOT done

**Nothing was deleted.** `immersive.js` is a preferred *path*; every caller keeps its old
route and falls back the moment the mod is missing, unreachable, or throws. **A dialogue
system that goes silent because a mod updated is worse than one that looks plainer than
intended.**

⚠️ The API is reached **reflectively**, so all of it is unverified until a live boot says
otherwise. Every accessor is probed once and the outcome logged — *"the mod is missing"*
and *"I could not call it"* must never look like *"nobody said anything"*.

### 📋 Still to migrate

`garble.js` → `ObfuscateMode` · the action-bar sting → an anchored message · **god
dialogue itself** — ⚠️ and that last one keeps chat as the record, because chat is still
the only surface that survives being missed mid-fight.
