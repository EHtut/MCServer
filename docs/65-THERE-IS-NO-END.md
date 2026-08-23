# 65 — There is no end

> **Ethan, 2026-08-24:**
> *"so there should be no ending anymore, this is story now, not just a game.
> there is no end."*

This is the shortest ruling in the project and the one that removed the most code from
service. It is written down because **two of the three items on that evening's punch
list were deleted by it rather than solved**, and a future reader finding those items
still listed in older docs needs to know they were answered, not dropped.

---

## 1. What an "ending" was

Three separate systems could take a run away from a player:

| system | the ending | reached by |
|---|---|---|
| `release.js` | your god formally lets you go | 6 wasted gifts (Blade) · 3 refusals (Salvage) · a filled regard bar (art/crown) |
| `fall.js` | the path is revoked, xp wiped, selection locked 3 in-game days | regard reaching 100 |
| `art/cut_down` | she executes a champion who becomes **too good to control** | never — it was written and never wired |

The Harvest had already been cut the day before (`62`), which removed a fourth.

---

## 2. What changed

**Every god is `mode: 'never'`.** That is the entire mechanical change.

```
[release] active - wall=never · blade=never · salvage=never · forge=never · art=never · crown=never
```

Everything else followed from the registry without being edited:

- **`fall.js` died on its own.** `refuses(key)` already read `mode === 'never'` from
  `release.js`, so the fall now returns `false` for all six. No xp wipe, no revoked
  path, no lockout. *Nothing in `fall.js` was changed to achieve this* — which is why
  it stayed correct.
- **`regard.js` already consulted the registry.** Regard now saturates instead of
  executing: maxing it means the loudest beat and a log line. It has `COOLING`, so it
  comes back down on its own. A pressure gauge that pins is not a bug in a story where
  the needle no longer breaks anything.

### The machinery is intact, not deleted

Streaks, armed windows, denial counters, the whole state machine — all retained and
unreachable, exactly as `harvest.js` was. Each retired rule carries its old config in
a `_retired` block. **This project reverses rulings, and a mode string is cheaper to
restore than a system.**

`release_harness.js` re-arms those `_retired` configs in memory and tests the engine
behind them, so the retained code cannot rot into something that can no longer be
restored. It asserts the **shipped** modes first, before anything mutates them.

---

## 3. Two open problems this deleted

**`art/cut_down`.** Her signature beat — the only pool in the pantheon where a god
kills a champion for *succeeding* rather than failing. It was written, never fired,
and filed as a gap by `completeness.py`. It was never a gap; it was a mechanic waiting
to be built, and the ruling removed the mechanic.

**The lines are kept.** They are the sharpest writing she has and they still say what
she *is*, even though it will never happen on screen. `completeness.py` now carries a
`RETIRED` list so the tool reports it as **retired-by-design** rather than as a
finding — *and warns if such a pool starts being spoken again*, so the exception list
and the code cannot silently diverge.

**art and crown's door.** Both were still on the legacy `regard` condition, inherited
rather than decided. Art's was the last undecided release condition in the game. It
was never decided — it was **dissolved**.

---

## 4. Six banners were lying, and one was found live

A `never` that nothing announces is fine. A `never` that the game **describes as an
exit** is worse than the ending it replaced.

| where | said | status |
|---|---|---|
| `release.js` `/release` output | *"Winning the Harvest is the only way out."* | fixed |
| `help.js` wall hint | *"Winning her Harvest is the only way out."* | fixed — **the only player-facing one** |
| `release.js` header table | the old per-god door table | marked historical |
| `fall.js` refusal log | *"Winning the Harvest is the only way out."* | fixed |
| `paths.js` `/path` | `Notice n/100` for everyone | fixed — see §5 |
| `fall.js` boot banner | *"the fall revokes the path, wipes xp, ... locks path selection"* | **found by reading the boot log after the restart** |

The last one is the sixth lying banner this project has found, and the sixth found the
same way: **by reading what the server actually printed.** It is now *derived from the
registry* at boot rather than restating an intention, so it becomes true again on its
own if a god is ever put back on a real mode.

> ⚠️ **Deployed but not loaded.** It is a console-only line and Liam was mid-session;
> spending a restart on it would have cost his playtime for something no player sees.
> It lands on the next natural restart.

---

## 5. `Notice n/100` was wrong for four of six paths

Not part of the ruling, fixed alongside it.

`phase.js` scales notoriety by E3's `phase` coefficient **before** banding — which is
deliberate, and is exactly how Blade "escalates twice as fast". But `/path` showed
everyone a threshold of 100, so **Blade enters the top band at a raw 50 and Art at a
raw 34** while the bar they were watching claimed 100.

`/path` now divides the cap by the same coefficient the sweep multiplies by:
`Notice 20/50`. Same arithmetic, read from the player's side. `/phase` was already
honest — it showed the scaled value.

> 🔴 **The pacing itself is untouched, and it is Ethan's call.** Whether a Trial at a
> raw 50 is too soon is a tuning question. This fix stops the display lying about the
> number; it does not change the number.

---

## 6. What this does NOT mean

- **An unregistered god still falls.** "No endings" is a decision about the six gods
  that exist, not a default for one that does not. A god added tomorrow with no rule
  must not be silently unloseable, and `release_harness.js` asserts this.
- **Setbacks are untouched.** Death still costs levels. Losing a Trial still resets
  notoriety. Rage, boredom, and rank decay all still bite. *Nothing terminates; plenty
  still hurts.*
- **The `harvest` band survives.** It is a notoriety band `[100, ∞)`, not the event.
  `deep_speaker.js` gates confession stage 3 on it — Ethan's own writing, the best text
  in the game. Untouched.

---

## 7. Naming rot, accepted on purpose

There is a band called `harvest` in a game with no Harvest, and pools called
`harvest_won` / `harvest_lost` that now fire for the Trial. Renaming touches
`phaseRank()`, `CONFESSION_PHASES`, the band table and every display string — a
cosmetic change riding along with a behavioural one. **Separate chunk, deliberately.**

One line *was* changed, because it was not cosmetic: art's
*"That's the end of it, then. I'll find another hand."* was the only line left in the
pantheon promising a **replacement**, which the ruling made impossible. She cannot find
another hand; she is stuck with this one.
