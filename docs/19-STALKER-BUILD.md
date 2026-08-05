# The Stalkers — build plan

**Companion to `18-THE-STALKERS.md` (design).** This is the chunking: what gets
built, in what order, what each chunk must *prove*, and what rolls it back.

**Method: plan → build → audit → proceed.** No chunk starts until the previous
one has passed its audit gate against a running server. A chunk that "loads
without errors" has not passed anything — every gate below is a behaviour
observed, not a file written.

---

## STATE OF THE BUILD — 2026-08-05, server going dark for a week

Every chunk is **built and loading clean** (11/11 scripts, 0 errors). What
separates them below is not whether they exist, but **what has actually been
watched happening**.

| chunk | built | verified live | how |
|---|---|---|---|
| **C0** capability probe | ✅ | ✅ | 7 rounds; 4 silent failures caught |
| **C0b** player probes | ✅ | ✅ | `xpLevel` reads 27, setter works, player NBT stores |
| **C1** notoriety | ✅ | ✅ | Ethan: number + floor + persistence |
| **C2** drop chance | ✅ | ✅ | `/path sample` — expected 13.4%, observed 13.3% |
| **C3** XP as power | ✅ | ✅ | live armour read **9.08** = his 8 + our 1.08 → selective |
| **C4** natural spawns off | ✅ | ✅ | re-audited at t+200 after a false pass |
| **H1** chaff health | ✅ | ✅ | 16.35 / 15.0 / 5.3 / 21.8 vs targets 15/15/5/20 |
| **C5** unkillable | ✅ | ✅ | Ethan: *"it didn't die it just disappeared"* |
| **C6** phases | ✅ | ◐ | loads; Companion/Helper/Absence unwatched |
| **C7** Harvest | ✅ | ◐ | loads; in testing at time of writing |
| **C8** cast/PvP/rates | ✅ | ❌ | **needs two players** |
| **H1b** density | ❌ | — | deliberately unbuilt |

### ⚠️ The table above was last updated at 11:11 on 2026-08-05

Fourteen code commits landed after it. Everything from the polish pass — the
100-block ring, the look-back, the whispers and nausea, the self-correcting stat
block, the Missioner-minion attribution, the Revervox removal — is **built and
loading clean but was never watched working**, and none of it is reflected in the
✅ column. Treat every tick as "true as of 11:11".

Also honest: the retained logs cover only 12:41→13:17 and contain no player
joins. The verifications recorded above did happen, but **no evidence of them
survives on disk** — so on return, re-prove rather than re-read.

### What to test first when everyone is back

1. **PvP defence (C8).** The one thing that cannot be tested alone, and the one
   Ethan actually asked for: brother hits you, your stalker answers. Two players,
   both above notoriety 25, both on a path.
2. **Stalker vs stalker.** Two defended players fighting each other. Nothing
   about that has ever run.
3. **Horde feel and TPS.** Chaff is at half health and specials are thinned, but
   four-player TPS has never been sampled. Density is intentionally still
   untouched until it is.
4. **A real Harvest**, reached by playing rather than by `/stalker harvest`.

### Known-unverified, by design

- ⚠️ **`player.persistentData` across death — the note here was wrong TWICE.** It
  claimed nothing depends on it and that it was unanswered. Both false. **Path
  membership lives there** (`paths.js` `pathOf`, and the gate on every stalker
  summon), so it governs payouts AND the whole stalker system. And the answer was
  already in this repo: `the_hunt.js` records that NeoForge's persistent data
  survives death only via its `PlayerPersisted` subtag, while **KubeJS's tag is
  copied wholesale on `PlayerEvent.Clone`** — so it very likely does survive.
  Still never observed directly.
- **The death-source attacker accessor.** `src.type()` works; `getEntity()`
  throws. `attackerOf()` walks six candidates and logs which one wins on first
  use — so the first real Harvest death will tell us, in the log, for free.
- **Whether a stalker survives a server restart mid-fight.** Persistence is
  pinned via NBT, but the round trip has not been watched.

---

## The standing rules for this build

1. **Nothing ships unrun.** The server is off and free; every chunk boots it and
   watches the thing happen. "It should work" is not an audit result.
2. **A gate ships with a live consumer or not at all.** No chunk may leave code
   that computes a value nothing reads.
3. **"I failed" and "I found nothing" never share a return value.** Every probe
   distinguishes *absent API*, *present but returned nothing*, and *threw*.
4. **Everything is reversible.** Each chunk names its rollback before it starts.
5. **State lives on `server.persistentData`, keyed by player UUID** — never on
   `player.persistentData`. Three reasons: it must survive death (this whole
   system is about dying), it must be readable while the player is offline, and
   it is the one store we have already proven works (`paths.js` claim self-test).

---

## C0 — Capability probe  ⟵ **first, and it is not optional**

**Why first.** Every chunk below assumes a KubeJS API exists. This pack has
already burned four boots on In Control's schema, a go-live on a single-quote
regex, and a whole guidebook on a parent-id format — all of them *assumptions
that looked correct*. C0 buys the whole build for one boot.

**Build:** a throwaway `server_scripts/_probe_stalker.js` that tests and logs
PASS/FAIL/THREW for each capability, then does nothing else.

| # | capability | needed by |
|---|---|---|
| 1 | read `player` XP level | C1 |
| 2 | **set** XP level to 0 | C7 (the wipe) |
| 3 | current in-game day from the overworld | C1 (the floor) |
| 4 | `server.persistentData` read/write nested keys | C1 |
| 5 | `player.persistentData` **survival across death** | decides §5 above is mandatory rather than merely preferred |
| 6 | attribute modifier add/remove with a stable id, on `max_health` / `armor` / `attack_damage` / `knockback_resistance` | C3 |
| 7 | spawn a `born_in_chaos_v1` entity by id | C5 |
| 8 | set custom name, visible name, and **scale** on a spawned mob | C5 |
| 9 | cancel damage to a specific entity | C5 (the flee invariant) |
| 10 | `discard()` an entity | C5 |
| 11 | force a mob's target | C6 |
| 12 | death event exposes the **damage source** | C7 (attribution) |
| 13 | a repeating server-side timer that is not a per-tick hook | C1, C6 |

**Audit gate:** the log shows a verdict for all 13, and every FAIL has a named
fallback before C1 begins.
**Rollback:** delete the file.

### C0 RESULTS — 2026-08-05, seven rounds, headless half COMPLETE

| # | capability | verdict | the form that works |
|---|---|---|---|
| 3 | in-game day | ✅ | `overworld.dayTime() / 24000` |
| 4 | `server.persistentData`, incl. nested compounds | ✅ | `getCompound` → mutate → `put` |
| 13 | scheduled timer | ✅ | `server.scheduleInTicks(n, fn)` |
| 7 | spawn a Born in Chaos entity | ✅ | `lvl.createEntity('born_in_chaos_v1:krampus').spawn()` |
| 8 | custom name, visible name, **scale** | ✅ | scale is a real attribute — stalkers can be visibly bigger |
| 6 | read attributes | ✅ | **`minecraft:generic.max_health`** |
| 6.1 | update a modifier repeatedly | ✅ | **`modifyAttribute(attr, id, amount, 'add_value')`** |
| 10 | discard an entity | ✅ | `entity.discard()` |
| 11 | force a mob's target | ✅ | `entity.setTarget(...)` accepted |
| 9 | **cancel damage** | ✅ | **`EntityEvents.beforeHurt` + `event.cancel()`** |
| 12 | death exposes a source | ◐ | event fires; `src.type()` gives a DamageType. **Attacker accessor unresolved.** |
| 1, 2, 5 | player XP read/set, `player.persistentData` across death | ⏳ | **needs one login** |

**Four findings that change how later chunks must be written.** Every one of
these would have produced a silent failure, which is the entire reason C0 exists.

1. 🚨 **`EntityEvents.hurt` DOES NOT EXIST.** The ids are camelCase —
   **`beforeHurt`** and **`afterHurt`**. A wrong event name logs one line at
   startup and then simply never fires. C5's whole "cannot die" invariant hangs
   off this.
2. 🚨 **`event.cancel()` unwinds by THROWING** KubeJS's `EventExit`. Wrapping it
   in a `try/catch` swallows the unwind and **the cancellation silently does not
   happen** — this produced a false FAIL here before it was spotted. *Never put
   `cancel()` inside a catch.*
3. 🚨 **Attribute ids are `minecraft:generic.*` in 1.21.1.** The un-prefixed
   `minecraft:max_health` form (1.21.2+) **throws**. Same for `generic.scale`.
4. 🚨 **`removeModifier(...)` is UNUSABLE from Rhino** — ambiguous overload for
   `String`, `ResourceLocation` *and* `AttributeModifier` alike. The only working
   removal is `removeModifiers()`, which strips **every** modifier on that
   attribute — armour, potions, L2Hostility included. **C3 must therefore use
   `modifyAttribute`**, which was verified *selective*: a foreign modifier of +6
   survived our update from +4 to +9.

**Fallback already proven** if `modifyAttribute` ever disappoints: potion effects
(`health_boost` / `resistance` / `strength`, hidden icon) apply and re-apply
cleanly and touch nothing else.

**And a standing Rhino rule for every chunk below:** reading a zero-arg Java
accessor as a *property* returns **the method object**, not the value —
`src.type` logged `Function`, `src.type()` logged the DamageType. Call them.

---

## C1 — Notoriety

`notoriety = max(xpLevel, (day − lastHarvestDay) × rate(harvestCount))`

**Build:** `server_scripts/notoriety.js`. Per-player record on
`server.persistentData` — `lastHarvestDay`, `harvestCount`, `phase`. Daily
recompute on in-game day rollover. Read-only helper `getNotoriety(player)`
exported for later chunks. `/notoriety` prints the number and its two inputs.

**Audit gate:**
- the number survives a **server restart** and a **player death**
- the floor advances by exactly `rate` per in-game day and **not** per tick
- spending XP at an enchanting table lowers the ceiling and **not** the floor
- a player who has never been harvested reads a sane value, not `NaN`/`null`

**Rollback:** delete the file; nothing else reads it yet.

---

## C2 — Drop chance

**Build:** replace the flat `0.11` roll in `paths.js` with
`0.08 + 0.002 × min(notoriety, 100)`.

**Audit gate:** a scripted 1000-roll sample at notoriety 0 / 50 / 100 lands
within tolerance of 8% / 18% / 28%. **Measured, not reasoned.**
**Rollback:** one constant.

---

## C3 — XP as power

**Build:** attribute modifiers scaled by notoriety, on a stable id so they
*replace* rather than stack. Recomputed on level change, login, and daily tick.

**Audit gate:**
- relog five times → modifiers do **not** stack
- notoriety 0 → modifiers absent, not present-at-zero
- max-health increase does not leave the player at partial health or spike them
- ⚠️ **measure where the deep stops being dangerous** (design §2c) — this is the
  number that tells us when the stalker starts carrying the whole game

**Rollback:** remove modifiers by id on load; the removal path is written *first*.

---

## C4 — Stop the six spawning naturally

**Build:** five `*_SPAWNING_ENABLED = false` (Lord Pumpkinhead has no such key — he is denied via In Control instead) in
`borninconfiguration-general.toml`, tracked into `pack/config/`.

### ⚠️ C4 RE-AUDITED 2026-08-05 — the first pass was a FALSE PASS

The original audit called `isAlive()` **in the same tick as `spawn()`** and
reported 6/6. That cannot see the failure it was looking for. `/summon` later
proved the mod does not *block* creation at all — it prints `Summoned new
Krampus` and the entity is **gone moments later**, because the toggle REMOVES the
mob shortly after it appears rather than refusing to make it.

Re-measured at **t+20, t+100 and t+200 ticks** against a no-toggle control
(`lord_pumpkinhead`): all three alive at every checkpoint.

**C4 stands — but for a different reason than first recorded.** The toggle acts
inside `finalizeSpawn`, which `/summon` runs and a KubeJS `createEntity().spawn()`
does not. So:
- `/summon <disabled mob>` — **blocked** (admin convenience lost; acceptable)
- KubeJS spawn — **works and persists**, which is what C5–C7 actually use

**Two consequences that had to be fixed in `stalker.js`:**

1. 🚨 **Skipping `finalizeSpawn` means skipping the mod's configured stats.**
   Proven by H1: a chaff mob reads its raw code default through the KubeJS path
   and its *configured* value through `/summon`. Every stalker now carries an
   **explicit stat block** rather than inheriting whatever the class declares —
   which also removes a silent drift the day Born in Chaos updates.
2. `setPersistenceRequired(boolean)` **does not exist** here — it throws. NBT
   (`mergeNbt({PersistenceRequired: 1})`) is the route, and it is now tried
   FIRST rather than sitting behind a call known to fail. Without it a stalker
   despawns on its own and the illusion dies quietly.

**The measurement rule this produced:** any liveness check on a mob's *stats* or
*survival* must go through the game's own spawn path and must be sampled **over
time**, never at t+0. A same-tick check and a config-bypassing spawn will each,
independently, tell you a comfortable lie.

**Audit gate — this is the risk the design has been carrying since pass two:**
- `/summon` and a KubeJS spawn of a disabled entity **still work**
- if summoning is also gated, C5 changes shape entirely — **find out here, not
  at C7**

**Rollback:** five `true`s.

---

## C5 — The unkillable wrapper

**Build:** summon a marked stalker (custom name, scale bump, owner UUID on its
persistent data). Cancel damage below 35% health → flee → discard. Immunity to
every death route. Never drops loot or XP.

**Audit gate — adversarial, one path only.** It must survive: melee burst, bow,
fall, lava, void, `/kill`, suffocation, cactus, drowning, explosion, chunk
unload, dimension change, server restart mid-fight. **Every route tried by hand.**
Any single death here fails the chunk — the illusion has no partial credit.

**Rollback:** stop summoning; existing ones despawn.

---

## C6 — The phases

**Build:** Helper (low-health only, kill attacker, ~5s, leave) → Companion
(wolf-model follow + retaliate, **including against players**) → Absence
(nothing). Hysteresis of 3 on every transition.

**Audit gate:**
- a player enchanting from 30 → 0 → 30 does not make the stalker blink
- it retaliates against a **player** attacker
- the Absence is genuinely empty — no sounds, no spawns, no messages

**Rollback:** pin the phase to Helper.

---

## C7 — The Harvest

**Build:** at notoriety 100 summon the **buffed** instance (its own stat block —
the design's "it is fat too"). It stands, and only now can it die.
Loss → XP to 0, 30-day absence, rate escalation. Win → **escrow the path**,
one-line fragment, materials.

**Audit gate:**
- the XP wipe fires **only** on the stalker's kill — verified against death by
  fall, mob, and another player while a Harvest is active
- escrow holds the path, and it opens only when the walker declines or leaves
- the claim store is not corrupted — `paths.js` guards payouts on the claim, so
  a half-released path silently stops paying
- losing five times in a row does not wedge the state machine

**Rollback:** disable the 100 threshold; players sit in Absence.

---

## C8 — Full cast, PvP defence, cycle acceleration

**Build:** the other five stalkers, per-path stat blocks, the rate table
(1.0 → 3.0), PvP defence live.

**Audit gate:** all six summon and behave; the bait exploit is watched for;
two defended players fighting produces stalker-vs-stalker without a crash.

---

## H1 — The horde retier *(independent track, any time after C0)*

**Build:** chaff to half health, specials thinned, density raised.

**Audit gate:** **TPS measured with four players before and after.** This is the
pack's main performance risk and the one thing here that can ruin an evening for
everyone at once.
**Rollback:** the config file is tracked; restore it.

---

## Order and dependencies

```
C0 ──▶ C1 ──▶ C2
       │
       ├────▶ C3
       │
C0 ──▶ C4 ──▶ C5 ──▶ C6 ──▶ C7 ──▶ C8
C0 ──▶ H1
```

C2 and C3 are independent of each other. C4 can be done any time after C0 and
**should be early**, because its audit is the one that can still change the
design's shape.

---

## What is explicitly NOT in this build

- The Obsessed stays outside the system (design §8).
- No guidebook entry for the stalkers. **Deliberate** — the player should meet it
  before they read about it, and the fragment at C7 is the first time the game
  admits what it was.
- No advancement for surviving a Harvest, for the same reason.
