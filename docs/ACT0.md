# ACT 0 — the person, before any god knows they exist

> The whole of Act 0: what it is, what is built, and what is left. **The work document.**
> Supersedes `78-THE-OPENING.md`, which only ever covered the first beat.

---

## ① DIGEST

**What Act 0 is.** You spawn as an ordinary person in a village. No gods, no voices — the
**silence is the mechanism**, not the absence of content. You wake stronger and glad from a
plague a white-haired doctor sat with you through. Around day 7 something pulls you *down*.
**You die in the depths**, and that death — nothing else — makes you eligible. You wake
wrong, you lose what she gave you, and the gods start bickering in your ear.

**Where it stands: the first third is built, the rest does not exist.**
The opening cutscene is live and lands its title card. Everything from day 7 onward — the
pull, the depth-death gate, the buff, its loss, "You feel wrong" — is **unbuilt**, and there
is no act state machine of any kind: the string "act" appears nowhere in the code.

**The next chunk is A1, THE DOCTOR'S GIFT.** Nothing grants a buff and nothing takes one
away, so *"You feel wrong"* — the emotional payload the entire act is built to deliver —
currently has **nothing to remove**. Everything downstream is decoration until this exists.
**Falsifier:** a player who finishes the opening has a visible effect they did not have
before, and a player who dies in the depths no longer has it. If either half cannot be
observed without reading a log, the chunk is not done.

**🔴 What needs Ethan, and it blocks A2.** `78` §5 ruled that **depth-death is the ONLY route
to a path** and that drift and champion-kill both retire. Neither retired: `chosen.js:73`
still runs `DRIFT_DAYS = 30` and `:123` still offers *"be killed by a champion while
pathless"*. So the eligibility rule **in code is the opposite of the ruled one** right now.
Confirm the ruling stands and I will cut both.

---

## ② ROUTING

| | |
|---|---|
| **OWNS** | the Act 0 arc · the opening · the buff and its loss · the depth-death gate · the pathless experience · the act boundary into Act 1 |
| **DOES NOT OWN** | *how a voice is placed or formatted* → `VOICES.md` · *who these people are* → `LORE.md` · *how a god is built* → `40` `43` `53` `56` · *the tide's composition* → `74` · *what is broken* → `DEFECTS.md` |
| **STATE** | → `STATUS.md` — **only STATUS says what is in flight** |
| **BLOCKS** | Act 1. The act-ending tide is Act 1's opening beat |
| **VERIFIED BY** | `node tools/dialogue_check.js opening` · `node tools/dialogue_emu.js opening --play` |

---

## ③ THE DESIGN

```
spawn in a village, as a PERSON        no gods, no patron, no voices
    ↓                                  ONE origin — the script Ethan wrote
a plague you brought with you          BACKSTORY. Over before you play
    ↓
a doctor with white hair               she healed you overnight, said nothing
    ↓
you wake STRONGER, and GLAD            ⭐ the player should be happy to be alive
    ↓
        ── around day 7 ──
something pulls you DOWN               not gods. something else
    ↓
YOU DIE IN THE DEPTHS                  🔑 the gate. Nothing else makes you eligible
    ↓
"You feel wrong"                       you respawn undead
you lose the buff                      her gift was for the living
    ↓
the gods start bickering in your ear   each one tempting you
```

### 🔑 The three things that carry the act

**The silence is load-bearing.** A god heard before the death spends the whole reveal. This
is why `arrival.js` was cut on 2026-09-05 — it played all five gods, legibly and in colour,
**60 seconds after first login**, four to nine minutes *before* the cutscene establishing that
the player hears none.

**The doctor is Alice, and she must never be named.** She heals a stranger and leaves. Hours
later that same player dies, meets *the Doctor* in the dark, and she has already touched them
once. ⛔ **Do not add a hint, a journal entry or a callback.** The connection is the reward
for paying attention, and pointing at it spends it. She has **no dialogue at all** in the
opening, so there is nothing to leak.

**The gladness is a mechanism, not decoration.** Ethan: *"make life actually seem worth living
and the player is happy and excited to be alive."* Everything in the opening exists so that
*"You feel wrong"*, hours later, has something to take away. **A line that foreshadows spends
the ending early.**

---

## ④ CHUNKS

> A chunk with no falsifier is not a chunk. `state · what changes · falsifier`

### Built

| | chunk | falsifier answered |
|---|---|---|
| ✅ | **The opening cutscene** — 18 beats, one sentence each, typed, once per world, 5–10 min after first login | `dialogue_check opening` clean; 19 beats over 114s |
| ✅ | **The title card** — `ARKHDOTTIR: NEW BLOOD / A story written by Rehykt` | `finale_check.js` runs the real `ritual.js` and sees the popup. **It never rendered before 2026-09-05** |
| ✅ | **`arrival.js` cut** — the five-god join scene | word-boundary grep is empty; blade's colour made explicit first |
| ✅ | **The randomised life cut** — one origin | harness asserts `lifeOf` is gone *and* that 18 beats still play |

### Next — in dependency order

| | chunk | what changes | falsifier |
|---|---|---|---|
| **A1** | 🔜 **The doctor's gift** | the opening's last beat grants a visible, lasting effect. A death in the depths removes it | a player has it after the cutscene and not after that death — **both observable in game, not in a log** |
| **A2** | 🔒 **The depth-death gate** | dying below the cutoff is the ONLY thing that makes a player eligible. `DRIFT_DAYS` and the champion-kill route are cut | a pathless player who drifts 30 days is offered nothing; one who dies deep is offered everything. **Blocked on Ethan** — see §① |
| **A3** | ⬜ **"You feel wrong"** | the respawn after that death says it, once, in nobody's voice | it fires exactly once, on the gate death only, and never for an ordinary death |
| **A4** | ⬜ **The day-7 pull** | something draws the player downward around day 7 | a player who ignores it is still pulled; one who follows it reaches the depths without being told to |
| **A5** | ⬜ **The pathless bulk** | 1–2 hours of things to do before the gate | measured: a pathless player has more than the **~91 authored lines** currently reachable |
| **A6** | ⬜ **Ank** | he exists at all | he is a speaker with pools, not a name in someone else's mouth |
| **A7** | ⬜ **The death-refusal system** | the player is refused death | `death_cost.js` currently charges 5 levels and lets the death stand |
| **A8** | ⬜ **The Caebrim encounter** | a staged scene, not ambient lines | `caebrim.js scene()` gets a live consumer that is not the admin command |
| **A9** | ⬜ **The Alice encounter** | the Doctor meets you in the dark, deliberately | it is a scene, not a pool roll |
| **A10** | ⬜ **The act-ending tide** | a first tide that ends the player and opens Act 1 | ⚠️ needs its own mechanism — see the correction in §⑥ about the ordinary tide loop |

---

## ⑤ RULINGS

**The old god introduction is cut.** *(Ethan, 2026-09-05: "we cut the old introduction and
randomized life.")* The counter-argument was that `arrival.js` is Ethan's own writing and the
five voices arguing is the best prose in the project — **rejected**, because it fires before
the opening and destroys the silence the act depends on. ⭐ **The writing survives** in
`docs/archive/28-THE-SCENES.md`; only the trigger died.

**One origin, not a randomised life.** *(Same ruling.)* The counter-argument was replay
variety — rejected: the story is the script he wrote. It was fiction anyway, `count()` was
hardcoded to 1 and `build()` discarded the index it was handed.

**Depth-death is the only route to a path.** *(`78` §5.)* The counter-argument was that drift
and champion-kill give a player who never descends a way in — rejected, because *the descent
is the act*. ⚠️ **Ruled but not implemented** — see §①.

**Gods carry fonts, not colours, and speak through the dialogue mod.** *(Ethan, 2026-09-05.)*
See `VOICES.md`.

**No tides for the pathless.** *(Ethan, from play 2026-08-30: "TIDES SHOULD NOT SPAWN FOR
PATHLESS PLAYERS!")* He spawned into a fresh world and a wave killed him inside a minute. The
gate sits **before the clock**, not just before the wave, so a tide cannot fire the instant a
path is taken and arrive as a punishment for choosing one.

---

## ⑥ CORRECTIONS

**"The tide being off for the pathless is a gap in Act 0."** ❌ **It is Ethan's own ruling**
and it is correct. ⚠️ But it has a consequence worth stating: **A10 cannot reuse the ordinary
tide loop**, because that loop deliberately skips exactly the players Act 0 is about. The
act-ending tide needs its own trigger.

**"The deep speaker is path-locked to `wall`, so Act 0's player gets nothing."** ❌ Wrong on
both halves. All five paths register a speaker, **and** `speakerFor()` returns a dedicated
pathless persona — *the Stranger*, `death_stranger`, §f white, deliberately uncoloured
because nobody has introduced her to you.

🔴 **The real finding is narrower and worse.** She has three call sites and **two are shut**:
`idle.js:225` returns `null` for a pathless player before any deep-speaker logic runs, and
`tide.js` skips them entirely. Her only live route is `night.js:119` — the 30th-night
introduction. **So the one voice Act 0's player can hear says hello once, on night 30, and is
silent forever after.** Five of her six pools are unreachable.

**`night.js:115` still says "A PATHLESS PLAYER HEARS NOBODY — speakerFor() returns null
without a path."** ❌ False since the pathless persona landed; `speakerFor` returns her. A
stale comment that would talk the next reader out of a fix.

**"`78-THE-OPENING` is a DRAFT — design only, zero code."** ❌ It said that ten minutes before
`opening.js`'s first commit named it as the design, and through five more commits after. That
banner is why this doc's status is its **location**, not a line of prose.

**"Act 0 exists as a modelled concept."** ❌ It does not. `phase.js` is a *notoriety band*
machine (helper / companion / absence / harvest) and is unrelated. Nothing in the code knows
what act a player is in — which is fine until A10, where the boundary has to be real.
