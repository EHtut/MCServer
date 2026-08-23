# 63 — The Trial · trust replaces notoriety

> **STATUS 2026-08-24** — ⭐ **RULED, NOT BUILT.** Ethan's four answers are in §0 and they
> are decisive. Two problems fall out of them that he has not seen yet (§3, §4); both
> need a word before code. Nothing here exists.

## 0. ⭐ THE RULINGS — Ethan, 2026-08-24

> *"well at least maybe we can reframe the harvest then? instead it's a challenge that
> runs to increase or decrease trust? like a level up system with higher trust, higher
> buffs and drops."*

| | question | ruling |
|---|---|---|
| 1 | trust replaces notoriety, or rides alongside? | **"Replacing"** |
| 2 | what triggers it? | **"god initiation at 100 notoriety"** |
| 3 | win / lose? | **lose: "you don't progress and notoriety resets to 0"** · **win: "notoriety progresses to 0 and you get your buffs"** |
| 4 | trust is invisible | **"see above"** — the loop *is* the display |
| — | Wall's counter is inverted | **"Yea its intention, wall plays differently"** |

---

## 1. 🔑 WHY THIS IS THE RIGHT FIX AND NOT JUST A NEW COAT OF PAINT

There are two progression axes today, and **the unearned one drives the rewards:**

| | what it is | drives | how it moves |
|---|---|---|---|
| **notoriety** | `max(xpLevel, daysSinceAnchor × rate)`, capped 100 | 🔴 **buffs** (4 attributes, `power.js`) · **drop chance** (0.25%/pt → 50% at 100) · phase bands | **a clock.** It climbs whether you play well or not |
| **counter** | per-god activity — kills, blocks built, biomes, trades | gift tier, event eligibility | earned |

⭐ **That is the whole reason it felt too easy for Liam.** The game pays for elapsed time.
Ethan's reframe moves the payment onto something you do.

**After this change the two swap jobs:**

- **trust** = your rank. Only a Trial moves it. **It is what buys buffs and drops.**
- **notoriety** = the countdown to your next Trial. It buys nothing.

🔑 **Notoriety stops being a progress bar and becomes a timer**, which is what it always
actually was.

---

## 2. ⭐⭐ THE MACHINERY IS ALREADY BUILT AND GATED, NOT DELETED

`harvest.js` was gated off this morning and **step 3 (deleting it) was argued against**
(`docs/62 §7`) on the grounds that rulings in this project get revisited. They did, within
the hour.

What is in there is exactly a challenge system:

```
register(god, {arrive, onWin, onLose})   begin()   resolve(won)   active()
  · above-ground only        · holds and retries every 200t if you are underground
  · cleans up its actor, win or lose     · admin panel, live-tested
```

**Only the meaning changes.** *"You graduate or you are released"* → *"trust up, or
nothing."* One gate flip plus new win/lose payloads.

⚠️ **The name should change with the meaning.** `harvest` is a word about a god
collecting; this is a test. **The Trial** throughout, with the file staying `harvest.js`
until a rename is worth its own chunk.

---

## 3. 🔴 PROBLEM ONE — "notoriety resets to 0" is not currently possible

Ruling 3 says it twice, so it is deliberate. But notoriety is **derived, not stored**:

```js
value = max(xpLevel, floor(daysSinceAnchor × rate))
```

**There is no number to zero.** To force it to 0 you would have to zero the player's XP
level, and 🚨 that is *taking something from the player* — against Ethan's own standing
rule (*"we don't take items from players, that is how you cause them to quit"*). `fall.js`
does wipe XP, but that is a punishment and this is not.

### ⭐ The fix: an offset, not a wipe

Store `xpAtLastTrial` next to the existing `lastHarvestDay`, and make both terms relative:

```js
value = max(xpLevel - xpAtLastTrial, floor(daysSinceTrial × rate))
```

**Resetting to 0 becomes re-anchoring both**, and it takes nothing. The player keeps every
level they earned; notoriety just starts counting again from where they stand.

🔑 **And it makes the number honest.** Notoriety already claimed to be *"how far you have
come"*; it was actually *"how far you have come since you first logged in"*. Now it really
is **progress since your last Trial**.

⚠️ One consequence to accept: a player who levels XP hard between Trials will trigger the
next one fast. That is correct — it is the *earned* half of the timer doing its job.

---

## 4. 🔴 PROBLEM TWO — the rate curve now REWARDS falling

This one is sharper, and it is brand new as of these rulings.

`notoriety.js` escalates the accrual rate with `harvestCount`, which `fall.js` increments
on every fall — **"it comes back sooner each time"**. That was a *threat* when the thing
coming back was a Harvest you could lose your path to.

**It is now a reward.** Sooner Trial = sooner chance at +1 trust, and 🚨 **ruling 3 makes
losing free** (notoriety resets either way, trust simply does not move). So:

> **fall repeatedly → rate 3.0 → Trials arrive 3× as often → level 3× faster.**

⭐ **Falling becomes the optimal strategy.** That inverts the design of both systems at
once, and no amount of tuning fixes it while the sign is wrong.

**Three ways out, and this one is genuinely Ethan's:**

| | | |
|---|---|---|
| **A** | **Retire the escalation** — rate always 1.0 | Its whole purpose was to make a punishment arrive sooner. With no punishment left, the mechanism has no job. Simplest, and deletes code rather than adding it. |
| **B** | **Invert it** — falling makes the next Trial arrive *later* | Keeps a consequence for falling, and the consequence is time, which is his gentlest currency. |
| **C** | **Losing costs trust** | Contradicts ruling 3 as written, and reintroduces the spiral he has consistently designed against. |

⚠️ **I would take B.** A is clean but throws away the only thing that makes repeated
falling matter at all, and `fall.js` otherwise punishes with a 3-day path lock that a
player simply waits out. B keeps the pressure, points it the right way, and reuses the
forgiveness curve built this morning without a rewrite — it only needs its sign flipped.

---

## 5. What actually gets built, once §3 and §4 are answered

| | file | change |
|---|---|---|
| 1 | `notoriety.js` | add `trust` (0..5) and `xpAtLastTrial` to the record; publish `VELDORA.trust()` and `awardTrust()`; make the value relative (§3) |
| 2 | `harvest.js` | `GATE = true`; `resolve(won)` awards trust on a win and re-anchors either way |
| 3 | `power.js` | scale off **trust/TRUST_MAX** instead of notoriety/100 |
| 4 | `paths.js` | drop chance off trust instead of notoriety |
| 5 | `paths.js` | `/path` shows the rank — ruling 4 says the loop is the display, but a rank you cannot name is hard to feel |
| 6 | the five gods | a Trial payload each. ⚠️ Only 3 of 5 ever had a handler (`docs/62 §1`) |

**TRUST_MAX = 5** proposed: each win is 20% of your power, which makes a Trial worth
wanting. Blade's ×5 power coefficient already caps his attributes around 35% of the curve,
so he would max at **rank 2** — which is exactly *"strongest champion"* rendered as a
number.

⚠️ **Item 6 is the real work and it is not small.** Art and Forge have never had a Trial,
and Forge **cannot** have a hostile one — she is the god who never sends anything to hurt
you (`docs/56 §4`). Her Trial has to be a test that is not a fight, or she does not get one
and levels on something else.

---

## 6. ⚠️ Wall is deliberately inverted, and it is now load-bearing

> Ethan: *"Yea its intention, wall plays differently."*

Her counter is **rage**, not affection — it rises when you are hurt and falls when you heal
or survive:

```js
counter.add(p, GOD, -drop, 'stayed alive')
counter.add(p, GOD, -Math.min(cur, down), 'healed')
```

So levelling with Wall means **suffering on purpose**, and that is confirmed as intended.
⭐ It fits her exactly — *"she calls her obsession devotion"*, and `docs/59` has her holding
on to the one thing that still needs her. **A champion who must stay hurt to keep her
attention is the cruellest correct version of that.**

🚨 **But it must not silently become the strongest strategy.** If trust buys buffs and
Wall's trust rises with damage taken, the optimal Wall play is to get hit constantly.
Watch it in play before tuning — it may self-limit, since being hurt in the depths is how
you die.
