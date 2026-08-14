# PATH SYSTEM — the build plan

*Chunked 2026-08-11. Design is `23-THE-PATH-SYSTEM.md`; live state is
`20-AUDIT-2026-08-11.md`. Format follows `19-STALKER-BUILD.md`, including its
§STATE OF THE BUILD convention.*

---

## How this is built

**One chunk, then a checkpoint.** Two chunks without a checkpoint means stop and
audit before continuing.

Every chunk carries the same four rules, learned the hard way and written down in
`20-AUDIT-2026-08-11.md`:

1. **Verification is a MEASUREMENT, not a reading of the code.** The C4 false pass
   happened because `isAlive()` was checked in the same tick as `spawn()`. Every
   "verify" line below names a number or a log line to look at.
2. **"I failed" and "I found nothing" never share a return value.** Fourteen
   findings in one day, several of that shape.
3. **A feature ships with a live consumer or not at all.** No shadow-building.
4. **Deadlines and timestamps store WORLD DAY, never `tickCount`** — finding K9,
   where a stamp from the future disabled the Hunt permanently.

Chunks are ordered so that anything a later chunk depends on is measured earlier.

---

## E0 — PROBES. Nothing is built until the APIs are proven.

**Why first.** This project's entire `19` §C0 RESULTS section exists because
plausible-looking APIs fail silently in Rhino. `EntityEvents.hurt` does not exist.
`event.cancel()` unwinds by throwing. `removeModifier` is unusable. `global`
cannot be assigned. `runCommandSilent` returns 0 instead of throwing. Every one of
those cost real time. **The design below depends on eleven more assumptions.**

Build a `_probe_paths.js` that answers each, logs the result, and removes itself
from the equation:

| # | assumption | why it matters | how to prove it |
|---|---|---|---|
| P1 | potion effects can be applied AND cleared from KubeJS | the entire attention ritual | apply blindness 5s, clear early, confirm both in-game |
| P2 | **blindness does not obscure the chat overlay** | the ritual's whole premise | apply, read a chat line while blind |
| P3 | clickable chat (`clickEvent: run_command`) works from KubeJS | option selection while blind | send one, click it, see the command run |
| P4 | `minecraft:darkness` applies to a player | Blade's Blindfold | apply, observe |
| P5 | `player.foodLevel` readable AND writable | "give me your hunger" | read, set, read back |
| P6 | XP level readable and settable (already half-known via `wipeXp`) | "give me your levels", death cost | set 10, read 10 |
| P7 | respawn position can be forced to the death position | wake-where-you-fell | die, wake in place, no desync |
| P8 | Resistance + `setTarget(null)` on nearby mobs stops a death spiral | E2's grace window | die in a mob pack, survive 5s |
| P9 | a spawn multiplier can be applied per-player-proximity | the ×4 combat cost | measure spawn counts near a marked player |
| P10 | container contents readable for a quota | Forge's The Quota | place items, read them |
| P11 | machines/blocks countable in a radius | Forge's Appraisal | count a known build |

**Verify:** every row logs `PROBE <n>: <result>` at boot. Any row that cannot be
proven becomes a design change, not a TODO.

**Rollback:** delete the file.

### E0 RESULTS — boot half, 2026-08-12

Run against a live server with no players. `_probe_paths.js` produces no gameplay.

| # | assumption | verdict |
|---|---|---|
| **P6a** | world day is readable | ✅ **OK** — `server.overworld().dayTime() / 24000` → 62. **`overworld` is a METHOD, not a property.** |
| **P12** | `runCommandSilent` reports success | ❌ **UNUSABLE.** Returns `undefined` for a *valid* command AND an *invalid* one. Never test it. |
| **P12b** | `runCommand` reports success | ✅ **USABLE** — returns the command's **feedback text**, e.g. `The time is 22468`. |
| **P13** | an entity id can be validated at runtime | ✅ **OK** — see below. |
| **P9** | `checkSpawn` fires and exposes the level | ⏳ registered, 0 fires with nobody online. Needs a player. |

#### 🚨 P12 caught a live defect I had shipped hours earlier
The K8 fix in `the_hunt.js` did `if (!rc) { prune this hunter }` against
`runCommandSilent`'s return. Since that is **always `undefined`**, `!rc` is
**always true** — the first hunt would have stripped a *working* hunter from the
roster and logged it as not installed. Caught before it ever fired. **This is the
entire justification for E0 existing.** Fixed: the rc check is gone and the roster
is validated by hand.

#### P13 — the validator, measured rather than guessed
First attempt guessed the discriminating string and got it wrong (it used the
*summon* form's error text against the *selector* form, so every id returned
"valid"). Same shape as `measure-the-column-thats-read`. Logging the raw output of
three candidate forms gave the real answer:

| form | valid id (`minecraft:pig`) | invalid id |
|---|---|---|
| `execute if entity @e[type=X,limit=1]` | `Test failed` | `Invalid or unknown entity type '...'` |
| `summon X <far pos>` | `Summoned new Pig` ⚠️ **spawns** | `Can't find element '...' of type 'minecraft:entity_type'` |
| `data get entity @e[type=X,limit=1]` | `No entity was found` | `Invalid or unknown entity type '...'` |

> ### ✅ THE VALIDATOR
> ```js
> function typeExists(server, id) {
>   try {
>     var out = String(server.runCommand('execute if entity @e[type=' + id + ',limit=1]'))
>     return out.indexOf('Invalid or unknown entity type') < 0
>   } catch (e) { return null }   // null = could not tell. NOT the same as false.
> }
> ```
> **Spawns nothing, mutates nothing**, safe to run over a whole roster at boot.
> This permanently closes the K8 class of bug: any list of entity ids — the hunt
> roster, Blade's waves, Wall's raiders — can be checked before use instead of
> failing silently.
>
> Note the substring is **"Invalid or unknown entity type"**. The summon form's
> `Can't find element` is a *different* message; using it here is what produced
> the false pass.

### E0 — still open, needs a player in game
`/probe` (auto-verifies), `/probe_visual` (needs eyes), `/probe_death` (arm, then
go die):

P1 potion add/clear · **P2 chat readable while blind** · **P3 clickable chat** ·
**P4 `minecraft:darkness` lands** · P5 hunger read/write · P6 xp read/write ·
P7 respawn position · P8 death-spiral risk · P9 real spawn data ·
P10 container read · P11 block scan

P2, P3 and P4 cannot be automated — they are claims about what a human sees.

### E0 RESULTS — player half, 2026-08-12. **E0 IS EFFECTIVELY COMPLETE.**

| # | assumption | verdict |
|---|---|---|
| P1 | potion apply **and clear** | ✅ `add=true readback=true clear=true` |
| **P2** | **chat readable while blind** | ✅ **PASS, screenshotted.** Pure black screen, red text perfectly legible. **The attention ritual works.** |
| P3 | clickable chat | ✅ via **`clickRunCommand`** — `.click(String)` throws a Throwable that escapes the JS catch and kills the whole command |
| P4 | `minecraft:darkness` lands | ⏳ applies without error; still wants a visual confirm |
| P5 | hunger read/write | ✅ `17 → 11` |
| P6 | xp read/write | ✅ `34 → 35` |
| P7 | respawn position | ✅ measured: woke **156 blocks** away at the bed, `xp 34 → 34` — death costs nothing, confirmed in game |
| P8 | death-spiral risk | ⏳ first version measured the **bed**, which is meaningless; corrected to sample the **death site** — needs one more death |
| P9 | `checkSpawn` usable for the ×4 cost | ✅ fires constantly (828+ observed), `level=yes`, **`canCancel=true`** |
| P10 | container read | ✅ `create:depot`, slots enumerable |
| P11 | block scan | ✅ 2601 blocks scanned clean — but see the trap below |
| P12 | `runCommandSilent` return | ❌ **UNUSABLE** — `undefined` for valid and invalid alike |
| P12b | `runCommand` return | ✅ returns feedback **text** |
| P13 | entity-id validator | ✅ `execute if entity @e[type=X]` + `"Invalid or unknown entity type"` |

### 🚨 E0 found THREE real bugs — two of them in code shipped hours earlier

**1. `runCommandSilent`'s return killed the K8 fix.** `if (!rc) prune` against a
value that is *always* `undefined` — the first hunt would have stripped a working
hunter and logged it as missing. Never fired. Fixed.

**2. `.isAir()` DOES NOT EXIST, and K7 never worked once.** Measured three times
on three different blocks: `TypeError: Cannot find function isAir`. The K7
`placeBehind` footing probe was built on it, so it threw on its **first call every
time**, fell into its own catch, and used the player's `y` — precisely the
behaviour K7 was written to replace.

| air test | result |
|---|---|
| `.isAir()` | ❌ **TypeError — does not exist** |
| `.isAir` (property) | ❌ `undefined` |
| `.id === 'minecraft:air'` | ✅ works |
| `.getId()` | ✅ works |
| `.blockState.isAir()` | ✅ works |

> ⚠️ **The trap:** the probe's "first that works" verdict was
> `.id === 'minecraft:air'` — and that would have broken K7 *underground*, because
> cave blocks are **`minecraft:cave_air`**. A footing probe using it reads every
> cave as solid rock and never finds a spot, in the one place a stalker actually
> stands. **Use `.blockState.isAir()`**, which covers air, cave_air and void_air
> the way vanilla does. Fixed in `stalker.js` as `blockIsAir()`, with the string
> form as a fallback.

**3. P8 measured the wrong place.** It counted mobs around the *respawn* point —
the bed, 156 blocks from anything — and reported a reassuring "0 still hunting
you." That says nothing about E2, which wakes you at the **death site**. Corrected
to sample at the moment of death, while the chunk is loaded.

### What E0 settles for the build
* **The attention ritual is viable** — blind + readable chat + clickable options
  all proven. Salvage's economy can be built as designed.
* **The ×4 spawn cost is viable** — `checkSpawn` fires and is cancellable.
* **Forge's Appraisal is viable** — containers read, 2601-block scans are cheap.
* **Deadlines have a clock** — `server.overworld().dayTime()`.
* **Entity rosters can be validated** before use, closing the K8 class for good.
* **Death costs nothing today**, measured rather than inferred — E2 has its
  baseline.

---

## E1 — The iron fix (the drop economy)

**Why here.** Ethan: *"i can't find iron and i've been just spawning it in."*
Independent of everything else and immediately felt. Does not need E0.

* `iron_nugget` → `iron_ingot` in every tier-0 metal table. **This is the
  load-bearing change** — at the current rate, nuggets are 132 kills per ingot and
  ingots are 15.
* `CHANCE_BASE` 0.08 → 0.25, `CHANCE_PER` 0.002 → 0.0025.
* Tier-scaled stack counts: 1–2 shallow, 2–4 deep.
* **Realign the tier bands to the spawn bands.** Tier 0 is `y >= 0`, but In Control
  now denies hostiles above y40 — so tier 0 is really y0–39, a mining band being
  paid surface-tier loot.
* Signage: `/veldora` and the hints must say **iron is richest at y54–120 and that
  band has no hostiles.** Nothing currently tells anyone this.

**Verify:** kill 40 mobs at tier 0 on a live path; expect ~5 ingots, not ~0.3
nuggets. Log every payout.

**Rollback:** four constants and one table.

### E1 RESULTS — BUILT + DEPLOYED, 2026-08-12

Live boot line: `[paths] E1 drop economy: base 25% +0.25%/notoriety, counts by
tier 1-2 / 1-3 / 2-4`

| change | before | after |
|---|---|---|
| tier-0 iron | `iron_nugget` (9 = 1 ingot) | **`iron_ingot`** in forge, blade, salvage, wall |
| `CHANCE_BASE` | 0.08 | **0.25** |
| `CHANCE_PER` | 0.002 | **0.0025** (50% at notoriety 100) |
| stack count | always 1 | **1–2 / 1–3 / 2–4** by depth tier |

**At Ethan's notoriety of 63:** 40.8% proc · iron is 1 of 3 in the table · avg
1.5 per proc → **one iron ingot every 4.9 kills**, against 132 before. **27×.**

The nugget was the load-bearing change, exactly as predicted — swapping it alone
takes 132 → 15. The rate and the counts take 15 → 5.

**Signage** (the other half of the complaint — he could not *find* iron, and
nothing in the game said where it was): `/veldora` now carries a **WHERE THE IRON
IS** block stating that iron is richest **y54–y120**, that **nothing hostile
spawns above y40**, that y0–39 is capped and below y0 is not. Four hints added to
the pathless, forge and blade pools saying the same thing.

**Self-reporting** (the `fail-soft-hides-total-failure` rule applied to E1
itself): a payout counter logs `items paid out since boot: <path>=<n>` every 5
minutes, and — importantly — **logs a WARNING when the total is zero while
somebody walks a path.** A harness cannot see a subsystem that is on and
producing nothing; this can.

**Not changed, deliberately:** the tier boundaries (`y>=0` / `y>-64` / else) still
line up with the In Control spawn bands, so no realignment was needed once the
nugget was gone. **Crown's tier 0** (`bone`, `grave_dust`, `rotten_flesh`) is still
the weakest table in the game — grave dust is real Goety currency but bone and
rotten flesh are not. Left alone because Crown has no walker and changing it is
design, not a fix.

**Still needs a player:** the measured rate. `/path audit` rolls the real
`dropChanceFor()` against the caller's real notoriety — run it and confirm
~41%.

---

## E2 — Death costs something

**Depends on:** E0 P7, P8.

* **Wake where you fell.** Rewrite `instant_respawn.js` — this *removes* the
  cross-dimension branch and the `dimId()` guard rather than adding to them.
* **XP loss on death** (~5 levels), the thing that was never built.
* **The notoriety floor** — death may eat the XP term but never take notoriety
  below `days × rate`. Without this, dying on purpose is a free Harvest reset.
* **The grace window** — brief Resistance plus detargeting nearby mobs, or the
  whole thing is a death spiral. This is the failure mode that makes E2 worse than
  doing nothing if it is skipped.
* `keepInventory` stays **on**. The cost is XP and position, not gear.

**Verify:** die underground in a mob pack. Wake in place, at the same coordinates,
in the same dimension, minus ~5 levels, and **survive the next five seconds.**
Then die in the Nether and confirm no cementing, no netherrack, no shaking.

**Rollback:** the old `instant_respawn.js` is in git.

---

---

## E2 — chunked, 2026-08-12

All four E2 decisions are settled (`23` §9.1b/§9.1c). **The path stays OPEN during
the 3-day cooldown** — anyone may take it, so losing a path can cost it for good.
That is the political version and it is deliberate.

Six sub-chunks. **One chunk, then a checkpoint.**

| # | chunk | what it does | verified by |
|---|---|---|---|
| **E2a** | **wake where you fell** | respawn in place + grace window + detarget. Deletes the cross-dimension branch. | die underground in a pack; wake at the death coords, survive 5s |
| **E2b** | death costs levels | ~5 levels on death, floored so notoriety never drops below `days × rate` | die at a known level, read the delta |
| **E2c** | the regard counter | one number, six readings, decays over time. **A death inside the grace window must not advance it** | `/path` shows it; kill yourself twice fast, confirm it moves once |
| **E2d** | the fall | forced Harvest → `recordHarvest(won=false)` → revoke path + subclass → 3-day cooldown, path left open | force the counter to max; confirm tag AND claim both clear |
| **E2e** | entry strips XP | taking a path zeroes accumulated levels; this IS the introduction's price | take a path at level 30, confirm 0 |
| **E2f** | the voices | wire `25`'s dialogue + the ambient layer, incl. **anchored refrains** | watch them escalate across a real ladder |

### E2a is first because everything else sits on its grace window
E2c's "a spiral counts once" rule reuses the same window, and P8 measured why it
must exist: **7 hostiles at the death site against 1 at the bed.**

### Hazard rule for E2a — the one thing that would make it worse than today
Waking where you fell is a death loop if you fell in **lava**, in **fire**, or out
of the **world**. The death site is normally survivable-by-definition (you were
standing in it), but the exceptions are exactly the deaths people rage-quit over.
**If the death site is hazardous, fall back to the bed and say so in chat.** Never
silently — the §2 legibility law applies to a feature declining to fire.

---

---

## E0 — CLOSED 2026-08-12. Probe retired.

P4 confirmed by eye (the screen goes dark). P8 re-measured at a real death site:
**10 living mobs within 24 blocks, 9 of them hostile** — worse than the 7 first
recorded, and the respawn point had 1 and none hunting.

`_probe_paths.js` is **deleted**. It had started actively lying: its
`PlayerEvents.respawned` handler runs *before* E2a's, so it measured the bed and
reported

```
[probe]   died 470,-41,227 -> woke 295,66,240   distance=206
[respawn] Rehykt woke where they fell (470,-41,227)
```

Two contradictory lines in one chat window, one of them describing a moment that
no longer exists. Recoverable from git if E1x-style probing is ever needed again.

## E2a / E2b / E2c — BUILT, DEPLOYED, VERIFIED LIVE

| chunk | evidence |
|---|---|
| **E2a** wake where you fell | `Rehykt woke where they fell (470,-41,227)`, and the player saw *"You wake where you fell."* |
| **E2a** hazard fallback | `Rehykt died in minecraft:lava - waking at their bed instead`, and the player was told *"lava was there"* |
| **E2b** death costs levels | `Rehykt lost 5 levels (34 -> 29)` then `(29 -> 24)` |
| **E2c** the counter | `Rehykt forge debt 0 -> 15 (beat 0 -> 1)` then `15 -> 30 (beat 1 -> 2)` |
| **E2c** the voice | *"Late. Again."* then *"You die like it is routine."* — beats firing on CHANGE, not per death |
| **E2c** the six readings | `/regard` renders **"Your patron holds 30/100 debt"** for a Forge walker |

### 🚨 The first live test found a real defect: THE DETARGET DID NOTHING

```
[respawn] Rehykt woke where they fell (470,-41,227) - 0 mob(s) detargeted
[probe]   10 living mobs within 24 blocks of where you died, 9 hostile
```

Nine hostiles present, zero released. The single sweep ran **immediately after the
teleport**, which is the one instant where nothing has acquired the player yet —
their previous target died a moment earlier and they re-acquire over the following
ticks. The sweep fired into a guaranteed-empty window and reported success.

That is the same shape as the C4 false pass (measuring `isAlive()` in the same
tick as `spawn()`): **the measurement was taken at the only moment it could not
show the thing being measured.**

**Fixed:** the detarget now sweeps at **0, 20, 40, 60 and 80 ticks** across the
whole grace window, so anything that locks on gets released again. Only targets
pointing at *this* player are cleared, so somebody else's fight nearby is left
alone. Each sweep that releases anything logs it, so "it did nothing" can never
again look like "there was nothing to do".

Without this, Resistance III was carrying the entire grace window by itself.

---

## E3 — The coefficient substrate

**Depends on:** E0 P9 for the spawn axis only; the rest can go first.

One table, four axes (`spawns`, `power`, `drops`, `phase`), six paths, read by the
three existing consumers: `dropChanceFor`, `power.js CURVE`, `resolvePhase`.

* Subclass contributes at **50%**, primary at 100%.
* **Scale costs by players online** (the 2am decision).
* `/path coefficients` prints the caller's effective numbers — this is the
  legibility law applied to the substrate itself.

**Verify:** not by reading the table. Set Blade's drop coefficient to 0 and
measure zero payouts over 40 kills; set it to 1 and measure the expected rate.
**The measurement must run against the live path, not a fixture** — `run_all`-style
harnesses cannot see a subsystem that is configured on and producing nothing.

**Rollback:** all coefficients to 1.0 restores today's behaviour exactly.

---

## E4 — The attention ritual

**Depends on:** E0 P1, P2, P3.

The general primitive — **not a Salvage feature**. Three known consumers already:
trades, Wall's requests, introductions.

* Blind + Slowness(max) + Invisibility + **detarget nearby mobs**.
* 30s timer; options as clickable red chat.
* Decline or expiry → short nausea (~3–5s, amp 1) and clear everything.
* **Logoff mid-ritual clears the effects on login** — or someone returns
  permanently blind and rooted, which is the exact shape of this morning's respawn
  bugs.
* Admin trigger `/ritual test` so it can be exercised without waiting on an event.

**Verify:** run `/ritual test`, confirm all four effects land, chat is readable
while blind, an option is clickable, declining clears everything, and logging off
mid-ritual returns you clean.

**Rollback:** one gate; nothing else consumes it yet.

---

## E5 — Introductions

**Depends on:** E4.

Choosing a path opens the ritual. The patron speaks, demands, and a refusal costs
the path.

* Demands are payable by someone who owns nothing — hunger, a level, a few hearts.
* **Crown accepts refusal** and keeps the path. The others do not.
* 🚨 **Refusal must clear the tag AND the claim atomically.** This is the second
  place the P1 defect can be born — Ethan carried a `forge` tag against an empty
  claim and silently earned nothing for days.

**Verify:** take a path, get the scene. Refuse; confirm **both** `veldora_path`
and `veldora_claim_<path>` are empty by reading world data, not by trusting the
message. Then take it again and comply.

**Rollback:** one gate; falls back to instant path selection.

---

## E6 — Salvage's economy

**Depends on:** E3, E4, E0 P5, P6.

* The three trades: **hunger → life**, **levels → ammo**, **sight → the power to
  kill** (blindness persists up to 5 minutes).
* The **debt counter**, raised by every trade including Free Sample.
* She opens at the worst times — mid-combat is confirmed, and the detarget from
  E4 is what makes that survivable rather than a death sentence.

**Verify:** each trade takes exactly what it says and grants exactly what it says.
Debt rises per trade and persists across a restart (world day, not `tickCount`).
The sight buff expires on schedule.

**Rollback:** one gate.

---

## E7 — Interest: the first raid

**Depends on:** E6.

The debt comes due. Raid size scales with trades since the last one.

**Verify:** force debt to a known value, trigger, count the spawns. Then confirm a
raid at zero debt spawns nothing rather than a default wave.

---

## E8 — Blade

**Depends on:** E3. **Walker: Lehykt.**

Waves, the taunt ladder escalating to `"Run."` immediately before the Harvest, and
the `darkness` Blindfold beat. Blade's drop coefficient stays **below** 1.

**Verify:** taunts escalate with notoriety and `"Run."` fires exactly once, ever.

---

## E9 — Forge

**Depends on:** E3, E4, E0 P10, P11. **Walker: Ethan.**

Quotas with world-day deadlines, Appraisal paying by what you have **built**, and
compounding on a miss.

**Verify:** Appraisal on a known base returns a number that moves when the base
grows.

---

## E10 — Art, Crown, Wall

Designed in `23`; built when someone walks them. **Wall folds into Forge** if it is
still unwalked when we get here — same pair, "defend the factory" is the same
content, and Forge is the one path guaranteed a walker.

---

## STATE OF THE BUILD

*The distinction that matters is not built vs unbuilt. It is **built** vs
**actually watched happening**. Everything below is currently neither.*

| chunk | built | verified live | notes |
|---|---|---|---|
| E0 probes | ✗ | ✗ | eleven assumptions, all unproven |
| E1 iron fix | ✗ | ✗ | independent; could go first |
| E2 death | ✗ | ✗ | needs P7, P8 |
| E3 coefficients | ✗ | ✗ | everything else sits on this |
| E4 ritual | ✗ | ✗ | three consumers waiting |
| E5 introductions | ✗ | ✗ | |
| E6 salvage | ✗ | ✗ | the proof of the whole design |
| E7 interest | ✗ | ✗ | |
| E8 blade | ✗ | ✗ | |
| E9 forge | ✗ | ✗ | |
| E10 art/crown/wall | ✗ | ✗ | build when walked |

### Carried over, still unverified from 2026-08-11
Not part of this plan, but nothing here should be built on top of them until
someone has played on them:

* The repaired **Helper** chain — expect `helper answered` at most once per 30s
  (was nine times in one fight), and a `culled N orphaned minion(s)` line.
* The **Harvest**, reachable for the first time and **never once fought**.
* The **In Control reorder** — did it make the deep too quiet or the shallows too
  safe?
* The **Blade recast** — the first `fallen_chaos_knight` should have no boss bar.
* **P1 claim adoption** — Ethan either runs `/path release` + `/path forge`, or
  kills something and gets adopted automatically.

### Blocking questions
* **When does a subclass unlock** — free, or at notoriety 25?
* **Do subclass spawn costs stack** at 50%?
* **The deliberate-death exploit** — floor it, or leave it as a desperate
  strategy?
* Ethan's **rewrites** of the draft patron lines (Forge, Wall, Crown, Art).
