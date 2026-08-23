# THE RELEASE SYSTEM — how each god puts you down

> # 🔴 RETIRED 2026-08-24 — NOTHING IN THIS DOC IS LIVE
>
> **Ethan:** *"there should be no ending anymore, this is story now, not just a game.
> there is no end."*
>
> Every god is `mode: 'never'`. No release condition can be reached, and `fall.js`
> refuses for all six as a consequence. **Read `65-THERE-IS-NO-END` for what is
> actually running.**
>
> This doc is kept because the *argument* — that six gods should not share one door —
> is still the best statement of why, and if release conditions ever return, they
> return to this design. The code is retained and unreachable; each rule carries its
> old config in a `_retired` block, and `release_harness.js` re-arms them to keep the
> engine tested.


> 🆕 **BUILT 2026-08-16**, from Ethan's spec:
> *"Wall will never release you, Blade will release you only if you die too many
> times after he gave you a buff 4x in a row. Salvage will release you if you keep
> denying her trades. 3x in a row."*
>
> **Code-verified, never played.** `node tools/release_harness.js` → 51/51.
> That is a state machine and a wiring scan, **not** a play-test.

---

## 1. The registry — the only place the answer lives

`pack/kubejs/server_scripts/release.js`, `RULES`:

| god | mode | condition | resets when |
|---|---|---|---|
| **Wall** | `never` | nothing. **Winning her Harvest is the only exit** | — |
| **Blade** | `streak` | **4** buff-deaths in a row | you **survive** one of his gifts |
| **Salvage** | `streak` | **3** refusals in a row | you **accept** one deal |
| Forge · Art · Crown | `regard` | the legacy door, unchanged | regard decays 25/day |

An **unknown** key falls on regard. Adding a god must never silently make a path
unloseable, so the default is the old behaviour, not the new one.

---

## 2. What this replaces

There used to be exactly one way to lose a path: `regard.js` counts every death,
maxes at 100 (7 deaths), and calls `VELDORA.theFall`. **Six characters were losing
you for identical reasons.**

The word that decided the design is Ethan's own — Blade releases you *"only if"*.
So regard stops being the door for any god that has its own, and goes back to what
it was always better at: **the escalating voice that tells you where you stand.**

### 🚨 Beat 5 is now suppressed for Blade and Salvage

Four of the five beat-5 regard lines are **collection threats**:

> **Blade** — *"As Phaethon fell, so do you."*
> **Salvage** — *"Enough. I am taking what I am owed."*

A threat that can no longer happen is a lie the game tells about its own rules, so
those two stop at beat 4. **Wall is the deliberate exception**, and it is the best
line in the game:

> *"This is mercy, darling. This is me keeping my promise. I will not lose you again."*

Hers is a **promise, not a threat** — and nothing happening *is* the promise being
kept. She keeps beat 5. That is the `speaksAtMax` flag in the registry.

---

## 3. Blade — "he armed you, and you died with it on"

He is **not counting deaths.** Regard already does that. He is counting **gifts you
wasted.**

**His two buff sites, both wired:**

| where | what | window |
|---|---|---|
| `mark_success` reward | Strength + Resistance, 600s | **12000 ticks** |
| `sharpen` | Strength II, 180s | **3600 ticks** |

Die inside that window → **strike.** The window closes while you are alive →
**streak back to zero, all the way.**

**Things that are deliberately NOT strikes:**

* a death with no buff on it — that is regard's business, not his
* dying three more times inside **one** window. The window is consumed on the first
  death, so one buff can only ever cost one strike. *(P8 measured seven hostiles
  waiting at a death site — this is the spiral guard, for free.)*
* a `sharpen` whose buff failed to apply. Only the branch where it actually landed
  arms anything, or you take a strike for a gift you never received.

> ### ⚠️ How rare is this really?
> `sharpen` is a **cutscene**, so it is on the 4-world-day scene cooldown, and
> `mark` needs you to be marked and to kill the target. **Getting armed four times
> at all is hours of play** — and then you must die in all four windows with no
> survival in between. This is meant to be nearly unreachable. If it never fires,
> that is not necessarily a bug; check the log for `[release] ... armed by blade`
> before assuming anything is broken.

---

## 4. Salvage — "you said no to her"

**All four of her offers are wired**, through one `deny()` / `accept()` pair in
`salvage_events.js` so a fifth offer is a one-liner rather than a decision:

| offer | file | the "no" |
|---|---|---|
| her **counter** (hunger / levels / sight) | `salvage.js` | `Nothing tonight.` |
| **credit** | `salvage_events.js` | `Not today.` |
| **markup** | `salvage_events.js` | `Rob someone else.` |
| **insurance** | `salvage_events.js` | `I'll manage.` |

**Forgiveness lands on the CHOICE, not the outcome.** A player who picked a trade
and turned out to be too poor to pay it did not refuse her — the streak measures
denial, not success.

### 🚨 A timeout is not a refusal

Walking away from her counter is **AFK as often as it is "no"**, and this code
cannot tell them apart. She still says the refusal line either way — that is her
character — but it **does not advance the streak.** It is logged
(`VELDORA.release.ignored`) so the rate is visible.

Same doctrine as `fall.js`'s cooldown: *a punishment that cannot be verified must
not be enforced.*

---

## 5. The two gotchas this had to survive

### `server.tickCount` resets to zero on restart
The armed window is stored in ticks, so a stamp written before a restart reads as
*enormously* far in the future afterwards — the player looks **permanently armed**
and every later death is a strike. This is finding **K9 wearing a different hat**.

A window can never legitimately sit further ahead than the longest buff we grant,
so anything past `MAX_ARM_TICKS` (24000, 2× headroom) is a clock that moved and
resolves as **survived**. Fail toward the player: somebody logged out through a
restart certainly did not die to that buff. Harness covers it.

### Two doors, one death
Regard maxing and a streak completing can both reach `theFall` in a single death,
and running it twice records **two lost harvests** — which permanently raises the
rate of the next one. `theFall` now bails if the player no longer holds the key.

---

## 6. Commands

```bash
/release
```

Shows what would actually put you down — a `[X][X][ ][ ]` box row for a streak,
"will never let you go" for Wall, a pointer to `/regard` for the legacy gods. The
**legibility law**: the player must be able to see the thing that is about to take
their path.

Admin, because dying four times with a buff on is not a test loop anybody will run:

```bash
/release_test strike
```

Also `/release_test arm` (opens a 600t window on yourself) and `/release_test clear`.

---

## 7. What is NOT built

* **Nobody speaks on a strike.** The player gets grey system text and a count.
  Ethan writes the dialogue and there is no voice tag for this beat — the hook is
  `speakOnStrike()` in `release.js` and it needs **one tag name per god** to become
  a line instead of a system message.
* **No decay.** "In a row" is the only forgiveness, which is a literal reading of
  the spec. It cuts against `regard.js`, which decays 25/day precisely so one bad
  week cannot eat a path — the difference being that regard rises on things that
  happen *to* you and these rise only on things you *did*. `DECAY_DAYS = 0` is one
  line if it plays badly.
* **Wall's absence route.** She never lets go and `fall.js` refuses her, so her
  Harvest is the **only** door — and it is now load-bearing in a way it was not
  when it was one exit of several. Worth a look before anyone claims her.
