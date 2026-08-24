# 63 — The Trial · trust replaces notoriety

> **STATUS 2026-08-24** — ✅ **BUILT AND LIVE.** Ruling B taken on §4. Items 1–5 done,
> plus `ranks.js` (§6) and Art's Trial. Boot: `handlers: art, blade, salvage`,
> `[ranks] non-combatant ranks live`, 0 errors, 332/332 harnesses.
> ⚠️ **Thresholds and TRUST_MAX are first guesses and want play data** — see §8.

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
| 6 | the five gods | ✅ **DONE.** All three COMBATANTS have a Trial payload — live boot: `handlers: art, blade, salvage`. Forge and Wall are non-combatants and level by their own metric (§6); Wall's registration is correctly REFUSED |

**TRUST_MAX = 5** proposed: each win is 20% of your power, which makes a Trial worth
wanting. Blade's ×5 power coefficient already caps his attributes around 35% of the curve,
so he would max at **rank 2** — which is exactly *"strongest champion"* rendered as a
number.

⚠️ **Item 6 is the real work and it is not small.** Art and Forge have never had a Trial,
and Forge **cannot** have a hostile one — she is the god who never sends anything to hurt
you (`docs/56 §4`). Her Trial has to be a test that is not a fight, or she does not get one
and levels on something else.

---

## 6. ⭐⭐ NOT EVERY GOD LEVELS BY FIGHTING — Ethan, 2026-08-24

> *"forge and wall play differently as non-combatant classes, they will get a pass
> after. we give the harvest only to combatant classes then to raise trust. Wall's trust
> raises on days survived, and forge can be items crafted."*

| god | class | how trust rises |
|---|---|---|
| **blade** | combatant | ⚔️ **the Trial** |
| **salvage** | combatant | ⚔️ **the Trial** |
| **art** | combatant | ⚔️ **the Trial** — ✅ **BUILT** (`art_events.js:378` — `trialArrive`/`trialWin`/`trialLose`). Measured 2026-08-24; this row said "never had a handler" |
| **wall** | non-combatant | 🛡️ **days survived** |
| **forge** | non-combatant | 🔨 **items crafted** |

### 🔑 THIS SOLVES THE PROBLEM §6 USED TO DESCRIBE, AND IT SOLVES IT BETTER

The previous version of this section flagged a real hazard: Wall's counter is **rage**,
which rises when you are hurt — so if trust bought buffs and trust *was* that counter,
**the optimal Wall play would be to stand still and get hit.**

⭐ **Two numbers, two jobs.** Rage stays exactly as it is — the slider that drives which
events she sends. **Trust is separate, and hers comes from surviving.** Nothing about her
inverted counter changes, and the exploit never exists.

⭐⭐ **And it makes the three classes say something.** Each god's rank now measures the
thing that god actually values:

> Blade and Salvage and Kayer want to see you **win a fight.**
> Wall wants to see you **come home.**
> Milantros wants to see you **make something.**

🔑 Wall's is the sharpest. *"She never lets go"*, `release.js` mode `never`, *"the Mother
weeps for every champion she loses"* — and now her champion levels up by **not dying**.
The one god who cannot release you rewards you for staying alive. That is the whole
character as a progression curve.

### ⚠️ What this changes about the build

**Notoriety becomes a combatant-only mechanic.** Wall and Forge never need to reach 100,
because nothing waits for them there — they level on their own clock. So:

- `power.js` and the drop chance read **trust**, for everybody (unchanged plan)
- the **notoriety → 100 → Trial** loop only runs for blade / salvage / art
- wall and forge get an **award hook** on their own metric instead

⚠️ **Thresholds are unset and want play data, not a guess.** Days survived and items
crafted move at wildly different speeds, and Forge's counter already climbs fast enough
that `forge_voice.js` uses 250/1200 for its gift tiers. Pick numbers, then watch.

🚨 **"Days survived" needs defining before it is coded.** Days on the path without dying
is the reading that fits her, and it means a death does not just cost you a life, it
costs your progress toward her. That is characterful and it is also the harshest reading
available — confirm it is the intended one.

---

## 7. ✅ CLOSED — problem two was answered by ruling B

> 🔴 **This section said "STILL OPEN" while §8 below recorded the fix.** Two parts of
> one doc disagreeing about whether a problem was solved — corrected 2026-08-24.

§4's rate-curve inversion — *falling is the fastest way to level* — was settled by
**Ethan's ruling B**: the rates are **DESCENDING**, so falling makes the next Trial
arrive **later**, not sooner.

```js
var RATES = [1.0, 0.75, 0.55, 0.4, 0.3]   // ruling B: LOWER = slower
```

Live on the server: `Fall rates 1/0.75/0.55/0.4/0.3 (docs/63 ruling B: falling makes
the next Trial arrive LATER), forgiving one step per 12 in-game days.`
`tools/notoriety_harness.js` asserts the **direction** of the curve rather than the
table, so retuning the numbers cannot silently re-invert it.

---

## 7b. ⭐⭐ THE BAND STRETCH — ruled and built 2026-08-24

> **Ethan:** *"Keep the curve, stretch the bands"* — faster paths still arrive first,
> but every Trial should land nearer **75–100** raw notoriety.

### The problem

`phase.js` scaled notoriety by E3's `phase` coefficient **before** banding. Correct in
intent — it is how Blade "escalates twice as fast" — and far too strong in effect
against a hard band edge at 100:

| path | coefficient | Trial arrived at raw notoriety |
|---|---|---|
| others | ×1 | 100 |
| **blade** | ×2 | **50** |
| **art** | ×3 | **34** |

Everything in the game described the bar as 100. Nothing was broken; no single file
contained both the multiply and the band edge, so nobody could see it end to end.

### ⚠️ Raising the band edge cannot fix it — worked out before building

The raw threshold is `edge ÷ coefficient`, and **notoriety caps at 100**, so an edge
the ×3 path needs is one the ×1 path can never reach:

| edge | ×1 | ×2 | ×3 |
|---|---|---|---|
| 150 | **150 UNREACHABLE** | 75 | 50 |
| 225 | **225 UNREACHABLE** | **112 UNREACHABLE** | 75 |

**No single edge puts all three in 75–100.** The spread *is* the multiply, so the
multiply is what had to move.

### 🔑 The fix: compress the coefficient, for banding only

```js
factor = 1 + (coeff - 1) × PHASE_COMPRESS      // PHASE_COMPRESS = 1/6
       clamped to CAP_VALUE / TRIAL_RAW_FLOOR  // = 100/75 = 1.333
       never below 1                           // Ethan's standing rule
```

| path | factor | Trial now at |
|---|---|---|
| others ×1 | 1.000 | **100** |
| blade ×2 | 1.167 | **86** |
| art ×3 | 1.333 | **75** (exactly on the floor) |
| any ×4+ | clamped | **75**, never sooner |

The coefficient keeps its **full strength** for buffs and the drop curve. This changes
only how hard it pulls the phase ladder.

### 🔑 One implementation, because two was the original bug

`phase.factor()` and `phase.trialAt()` are exported, and the sweep, `/phase` **and**
`/path` all consume them. `/path` previously computed `Math.ceil(100 / pc)` from the
raw coefficient — a second copy that went wrong the instant the first one changed.
`phase_harness.js` asserts the source no longer contains that expression.

### 🚨 Consequence worth knowing

`deep_speaker.js` gates **confession stage 3** on reaching phase `harvest` — Ethan's
own writing, and the best text in the game. It now arrives **later** for blade and art
(raw 86 and 75, was 50 and 34). That is the ruling working as asked, not a side effect
nobody noticed.

---

## 8. ✅ BUILT — 2026-08-24, solo

| | |
|---|---|
| `notoriety.js` | `trust` (0–5, **per path**) + `xpAtLastTrial`; publishes `trust` / `trustScale` / `trustMax` / `awardTrust` / `resetTrialClock`. RATES flipped per **ruling B**. |
| `power.js` | the four attributes ride `trustScale`. **The curve is untouched** — scale is multiplied back up to `CAP`, so every tuned number keeps its meaning and only the input moved. |
| `paths.js` | drop chance rides `trustScale`; `/path` shows **Trust n/5** and re-labels notoriety as **Notice** |
| `harvest.js` | un-gated as **the Trial**; awards a rank on a win, resets the clock **either way**; refuses non-combatant handlers in one visible place |
| `art_events.js` | 🔴 her Trial, which never existed — the live bug from his own session |
| **`ranks.js`** | ⭐ NEW — wall on **days survived**, forge on **things made** |

### 🔑 Three things worth knowing about how it was built

**The reset is an offset.** Notoriety is derived, so there was no number to zero, and
forcing it meant wiping XP — taking something from the player. `xpAtLastTrial` anchors
the level term instead. **Nothing is taken.**

**Art points, she does not send.** Her whole design is that she cannot touch the world,
so a Trial that spawns something contradicts her. **The Persecutor was never hers** — she
is an Oracle with perfect information and a mouth, and she simply mentioned where you
were. ⚠️ That distinction lives in the *writing*; if an editor writes *"I am sending
something"*, the character is gone.

**Wall uses a high-water mark, and that was my call.** *"Days survived"* reads two ways: a
live streak (dying drops you to rank 0, stripping every buff exactly when you are weakest
— a death spiral) or the best run you have ever managed. **High-water.** She remembers the
longest you ever stayed alive and asks you to beat it. You are never punished and never
finished.

### ⚠️ What still wants Ethan

1. **Every threshold is a first guess.** `TRUST_MAX = 5`, wall `1/4/10/20/35` days, forge
   `50/250/800/2000/5000` made. The two metrics move at wildly different speeds and no
   amount of arguing settles them — they want one session of play.
2. **`/path` showing the rank is a small departure from ruling 4** (*"see above"* — the
   loop is the display). Two lines to delete if he disagrees.
3. **The `harvest_*` pools are still named for the old system**, and Blade's and
   Salvage's Trial dialogue still talks about graduation and release rather than rank.
   That is a writing pass, not a build.

---

## 9. ⭐ THE NEXT CHUNK, STATED BEFORE BUILDING — Ethan, 2026-08-24

> *"Trust for Wall and forge, well wall starts at their strongest and loses strength as
> they keep dying and their gods focus shifts to others. We can do the inverse for forge,
> they have to keep placing blocks and crafting otherwise their god's focus will shift
> away and bother other players (like a child). So each start at full strength and each
> have a way to lose it."*
>
> *"Art — Her main way of touching the world is through drops, she buffs but lightly. but
> instead we can do it so her champion's presence increases the spawn rates of things that
> are technically not in the domain of the gods above but instead in the underground.
> Tides, waves, enemies, etc."*

### 🔴 THIS INVERTS WHAT §8 BUILT YESTERDAY

`ranks.js` currently has both non-combatants **climbing from rank 0**. Ethan's model is the
opposite: **they start at TRUST_MAX and decay.** Not a tuning change — the sign again.

| | built yesterday | this chunk |
|---|---|---|
| **wall** | climbs on best-ever survival streak | ⭐ **starts at max**, decays per death |
| **forge** | climbs on cumulative things made | ⭐ **starts at max**, decays while idle |
| **art** | buffs like everyone else | ⭐ rank drives **underground spawn rates** |

### ⭐ WHY IT IS BETTER, WHICH IS WORTH SAYING BEFORE THE OBJECTIONS

**A god's attention is a thing you already have and can lose.** Climbing implies you must
earn their notice; these two already noticed you — Wall smothers from day one and
Milantros never stopped talking. **Decay is the correct shape for both**, and it makes
them play unlike the combatants rather than like them with different inputs.

🔑 **And Forge's is the best mechanical read of her yet.** *"like a child"* — stop
building and she wanders off to bother someone else. That is her whole character
(`docs/56`: fascinated by constructs, rambles at whoever is nearest) as a decay timer.

### ⚠️ THREE THINGS THAT COULD FALSIFY IT, NAMED NOW

**1. A brand-new Wall or Forge walker is instantly at full power.** Starting at
TRUST_MAX means claiming the path IS the progression. A day-one Wall champion would have
the buffs a Blade champion needs several Trials for.
⭐ *Defensible* — she is obsessed from the moment she sees you — but it is a real
inversion, and if it plays badly the symptom will be "the non-combatants are strictly
better early".

**2. 🚨 Decay must not spiral.** Wall's is per-death: die → weaker → die more → weaker.
That is precisely the loop Ethan has designed against everywhere else. **It needs a floor
and a way back up**, or a bad night permanently ruins a character. Default plan: decay one
rank per death, **recover one rank per N days survived** — the same high-water machinery
built yesterday, pointed downward from the top instead of upward from zero.

**3. Art breaks the uniformity `docs/63` just established.** Trust replaced notoriety for
*everyone*; if hers drives spawn rates instead of buffs, `power.js` needs a per-god
exception or she needs a second axis.
⭐ Cleanest read: **hers still buys drops** (his words: *"her main way of touching the
world is through drops"*) and **buffs lightly** — so she keeps the shared curve at a
reduced coefficient, and spawn-rate scaling is added on top. That is one new consumer, not
a fork.

### What would prove this chunk wrong

- A Wall walker who dies twice in a session and stops playing because they are weaker than
  when they started. **That is the spiral, and it is the thing to watch for.**
- A Forge walker who logs in after a week away with rank 0 and no way to tell why.
  **Decay must be legible** — she should say she got bored, not silently reduce a number.
- Art's champion making the depths unplayable for everyone else in the same world, since
  spawn rate is not a personal stat.
