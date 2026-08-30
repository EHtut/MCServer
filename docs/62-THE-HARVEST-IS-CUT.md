# 62 — The Harvest is cut

> **STATUS 2026-08-29 — ✅ THE CUT HELD, BUT THIS BANNER DID NOT.**
>
> ✅ **The ENDING is gone.** Nothing in `harvest.js` ends a player's story any more; a
> win now RELEASES the path and offers the stay (`blade_events.js` `harvestWin`). You are
> let go into the world, not out of it. That was the ruling and it landed.
>
> 🔴 **But this banner said "Gated off" and the gate is ON.** The file was REPURPOSED
> after this doc was written — the same machinery is now **the Trial**, a trust mechanic
> for combatant paths only (`docs/63`). The live boot reads
> `[harvest] VELDORA.harvest published OK - handlers: art, blade, salvage`, which is
> correct for the Trial and flatly contradicts the line that used to be here.
>
> ⚠️ **Anyone reading this doc would have concluded the file was inert.** It is not, and
> that is the whole reason to fix a status line rather than leave it. The filename stays
> `harvest.js` on purpose (renaming it touches the sync tool, load order and every log
> grep); the WORDS inside say Trial.
>
> ⚠️ **Step 3 (deleting the code) is still deliberately not done** — see §6 — and it is
> now moot: the code is not dead, it has a job.

## 0. 🔴 THE RULING — Ethan, 2026-08-23

> *"There is no reason for an ending anymore since it's essentially an **act-based
> story**."*

That is the whole argument and it is sufficient. Veldora is not five parallel character
arcs that each terminate; it is a place several people are in at the same time, and acts
happen to all of them. **An ending per player was answering a question the server stopped
asking.**

---

## 1. ⭐ IT WAS ALREADY HALF-DEAD, AND HE PLAYED THE PROOF

Only **three of five** gods ever had a Harvest handler — `blade`, `salvage`, `wall`. And
from his own session, 2026-08-23:

```
[phase]   Rehykt companion -> harvest (n=57, scaled 171)
[harvest] no handler for art - the Harvest fired and nothing was sent.
          That is a bug, not a quiet Harvest.
```

🔑 **He crossed the threshold on Art and the game did nothing.** Part of *"it doesn't
really make sense in my head anymore"* is that he experienced it broken.

**And the other two gods never had one either, for reasons that are the character:**

| god | how it ends | a Harvest? |
|---|---|---|
| blade | 6 buff-deaths | ✅ |
| salvage | 3 refusals | ✅ |
| wall | `never` — *"winning her Harvest is the only exit"* | ✅ |
| **art** | capability — she kills you for getting **too good** | 🔴 fired, did nothing |
| **forge** | `never` — she does not put champions down | ❌ |

⭐ **The Harvest was designed when every god was a demanding patron.** One shape: the
patron sends a champion, you win, you are released. That held when the roster was five
shades of demanding. It stopped holding the moment the gods became a **family** — three of
the five endings are not a fight, and `release.js` already said so before this ruling did.

---

## 2. ⚠️ "TOO EASY TO REACH" HAD AN EXACT CAUSE — and it outlives the Harvest

> Ethan: *"it was too easy to reach harvest 😕 for my brother"*

```
[phase] Lehykt companion -> harvest (n=57, scaled 114)
[phase] Rehykt companion -> harvest (n=57, scaled 171)
```

Raw notoriety was **57** against a threshold of **100** — and the **phase coefficient
multiplies before banding**. Blade is ×2, Art is ×3.

🔑 **So the real bar is n=50 for Blade and n=34 for Art, not 100. The number that was
tuned is not the number that fires.**

🚨 **THIS IS NOT FIXED BY CUTTING THE HARVEST.** The same pre-multiplied banding drives
*every* phase transition — helper → companion → the lot. If bands feel like they arrive
too fast after the cut, this is why, and it is a separate defect worth its own look.

---

## 3. What actually dies, and what does not

**Dies:** the only *ending* a path has. After this, a path is an unbounded drip of events
with no terminal state. ⚠️ That is a genuine cost and it is the only argument that was
ever on the other side — **overruled deliberately**, because act-based structure supplies
the endings instead.

**Does NOT die, and must not be cut with it:**

- **`release.js`** — the per-god release conditions are a *different system*, still live,
  and now the only per-god ending that exists.
- **`phase.js` bands** — escalation is worth keeping even with no terminal band.
- **`notoriety.js`** — but ⚠️ its rate table is literally *"rates by harvest count = [1,
  1.5, 2, 2.5, 3]"*, so it is keyed to a counter that will stop incrementing.
- **`fall.js`** — records a LOST harvest on the fall. Needs a new verb.

---

## 4. ⚠️ THE BLAST RADIUS — measured, not guessed

**20 files, ~300 references.** The heaviest:

| file | refs | |
|---|--:|---|
| `stalker.js` | 74 | already RETIRED — publishes and hooks nothing |
| `harvest.js` | 37 | the system itself |
| `blade_events.js` | 37 | his is the most built-out |
| `notoriety.js` | 35 | 🔴 the rate curve is keyed to harvest count |
| `wall_events.js` | 25 | |
| `salvage_events.js` | 21 | |
| `fall.js` | 16 | records a lost harvest |

🚨 **DISABLE BEFORE DELETING.** This project's own rule is small reversible chunks, and a
300-reference rip in one pass is the opposite. The order that survives a mistake:

1. **Gate `harvest.js` off** and verify nothing else throws — one constant, instantly
   reversible, and it answers "what actually depended on this?" by measurement.
2. **Re-home the orphans** — notoriety's rate curve, fall's verb, phase's top band.
3. **Then** remove the dead code and the ~12 `harvest_*` pools.

⚠️ **The `harvest_*` dialogue pools should NOT get a polish pass first.** Ethan asked for
a dialogue repass in the same breath as this ruling; polishing text for a system being
removed is the one piece of that work worth skipping.

---

## 5. ⭐ The option that was on the table, recorded in case it comes back

Not chosen. Kept because it is one sentence from being revived: **keep the ending, drop
the uniform boss fight.** `release.js` already gives each god a distinct condition and
`cut_down` is already Kayer's ending without being a duel — so *"each god ends it their
own way"* was reachable with four of the five shapes already written.

**Overruled by §0**: act-based structure means the story supplies the endings, so per-god
endings would be solving the same retired problem in five voices instead of one.

---

## 6. ✅ WHAT WAS ACTUALLY DONE — 2026-08-24

### Step 1 — gated off

`GATE = false`. It already covered both entry points cleanly: `begin()` returns false,
the retry sweep never registers. **One character to undo.**

⭐ **The fear in §3 was wrong, and it is worth recording that it was checked first.** The
confessions gate on `phase === 'harvest'`, which is the **notoriety band**, not the event.
Reaching n≥100 still enters the band. *"Gregor, I am sorry."* is untouched.

### 🔴 Step 1 also exposed four banners that had started lying — one written that morning

`tide` still claimed *"ends 10s after surfacing"* after surfacing mid-wave stopped ending
a run. `wallev` promised *"winning her Harvest is the only exit."* `notoriety` announced
a curve that could no longer move. **All fixed by reading the boot report** — which is the
argument for restarting rather than trusting a green suite.

### 🚨 Step 2 — and the orphan was the OPPOSITE of what this doc predicted

§3 said the risk was notoriety's rate curve going **dead**. It does not. `recordHarvest`
lives in `notoriety.js`, **not** `harvest.js`, so the gate never touched it — and
`fall.js` still calls it on every fall:

```js
var next = won ? 0 : hc + 1
```

**Only `harvest.js` ever passed `won=true`.** So wins — the sole reset — are gone, losses
still fire, and the count now **only ever climbs**. Four falls pinned a player at rate
**3.0 forever**, compounding with the banding bug in §2.

⚠️ **A comment and a boot banner claiming the opposite ("PINNED AT 1", "this curve is
DEAD") shipped and stood for half a day.** Asserting a value was frozen without checking
who writes it.

**The fix is forgiveness, derived at read time:** `effectiveHarvestCount(stored, since)`
forgives one step per **12 in-game days**, using `lastHarvestDay` and `since`, both of
which already existed. No new state, no sweep, nothing to drift.

| stored falls | day 0 | day 12 | day 24 | day 48 | day 96 |
|---|--:|--:|--:|--:|--:|
| 1 | 1.5 | 1.0 | 1.0 | 1.0 | 1.0 |
| 4 | 3.0 | 2.5 | 2.0 | 1.0 | 1.0 |
| 6 | 3.0 | 3.0 | 3.0 | 2.0 | 1.0 |

⭐ **Serial falling still compounds faster than forgiveness**, which is what the original
design wanted from a loss. `FORGIVE_DAYS` is one constant to tune.

**And `notoriety.js` now has a harness at all** — it had none, while driving the day-floor,
the phase bands, power scaling and drop rates. 10 assertions, verified to FAIL against the
ratchet.

---

## 7. ⚠️ STEP 3 IS NOT DONE, ON PURPOSE

§4 said *"then remove the dead code and the ~12 `harvest_*` pools."* **Recommend against
it, or at least against doing it now:**

1. **The code is inert and clearly marked.** Gate off, boot banner says `GATED OFF`, the
   `/harvest` admin panel now leads with `THE HARVEST IS CUT`. Nothing misleads.
2. **Deleting it makes the ruling expensive to reverse.** Rulings in this project *do*
   get revisited — the written accent, Caebrim's scope, the speaker map all moved after
   they were "settled." A one-character revert is worth keeping.
3. **300 references across 20 files is a refactor with real risk and no player-visible
   benefit.** The only thing it buys is tidiness, and it buys it at exactly the odds that
   produced this week's two silent-breakage findings.

**What WAS worth doing from step 3 has been done:** the misleading surfaces. If the pools
are ever wanted back, `docs/51` still registers all twelve for a rewrite pass.
