# 62 — The Harvest is cut

> **STATUS 2026-08-23** — ⭐ **RULED, NOT YET EXECUTED.** The ruling is final; the removal
> is its own chunk and has not been started. Nothing in this doc has been built.

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
