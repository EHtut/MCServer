# 78 — The Opening: a person, a plague, a doctor, and the death that makes you eligible

> **STATUS: DRAFT — design only, zero code.** Ethan, 2026-08-30, after closing the
> dialogue delivery pass. Every ruling below is his; every ⚠️ and 🔴 is mine.
>
> ⛔ **DRAFT means do not build from it yet.** The open questions at the bottom change
> what gets written, and two of them change the shape rather than the detail.

## ⚠️ First: the name is already taken

`introductions.js` exists and is **the god-offer scenes** — the six moments where a patron
asks and you accept or refuse. It is not the player's opening and never was.

🔑 So this is **THE OPENING**, and it must not be called an introduction anywhere in code.
Two systems called the same thing is how the wrong one gets edited at two in the morning.

---

## 1. The arc, in his words

```
spawn in a village, as a PERSON          no gods, no patron, no voices
    ↓                                    a randomized life: fisherman, farmer, …
a plague you brought with you            the reason you stopped travelling
    ↓
a doctor with white hair                 she heals you overnight
    ↓
you wake STRONGER THAN USUAL             a real, mechanical buff
    ↓
        ── day 7 ──
whispers, pulling you DOWN               not gods. something else
    ↓
YOU DIE IN THE DEPTHS                    🔑 the gate. Nothing else makes you eligible
    ↓
"You feel wrong"                         you respawn undead
you lose the buff                        her gift was for the living
    ↓
the gods start bickering in your ear     each one tempting you
```

## 2. ⭐ The doctor is Alice, and she must never be named

`deep_speaker.js` already carries her, and the comment there is emphatic:

> *"🚨 THE NAME STAYS 'the Doctor'. docs/40 §0: a name is the most expensive word in the
> game and Alice is never printed."*

⭐ **So the opening spends nothing and buys everything.** A white-haired doctor heals a
stranger in a village and leaves. Hours later that same player descends, dies, and meets
*the Doctor* in the dark — and she is the goddess of death, and she has already touched
them once. The player assembles that or does not.

⛔ **Do not add a hint, a journal entry or a callback line.** The connection is the reward
for paying attention, and pointing at it spends it. The same rule the Speaker/Gregor
reveal already lives under.

## 3. 🔑 The silence is the load-bearing part

> *"They hear no gods. They are just a person."*

This is the same ruling as *"pathless do not hear or interact with the gods until they are
chosen"* — but as an OPENING it does something the ruling alone does not: **the first god
voice you ever hear arrives after you have already died.** That is a real beat and it is
free, provided nothing leaks before it.

### 🔴 So there is a conflict to resolve, and it is in live code

`pathless.js` today gives a pathless player a **legible two-god exchange** ~23% of the
time. Under this design that cannot happen at all before the death. His earlier ruling
already kills the legible half; this makes it absolute until the gate.

⚠️ And the file's own premise argues against itself now. Its header says the pathless
player *"is being ARGUED OVER, and they can hear it"* — which was a good design and is no
longer the design. That header has to change or the next reader will restore the behaviour
in good faith.

### What the pathless DO hear, in each of the three states

| state | hears |
|---|---|
| day 0–6, alive | **only themselves.** The interior voice, the body, the world. No gods, no Caebrim |
| day 7+, alive | themselves, plus **the pull downward** — not gods, and not Caebrim either |
| after dying in the depths | the gods, bickering, tempting. The world changes |

🔑 **Three distinct states, and the player should be able to feel each boundary without
being told.** That is the whole design.

## 4. ⚠️ The buff is a gift with a cost, and the cost is the point

She heals you; you are stronger than a person should be; you die; you come back **wrong**
and the strength is gone.

⭐ It works because the loss is felt rather than explained. *"You feel wrong"* is the only
line, and it is doing the work of a paragraph.

### 🔴 Two design risks, both real

1. **A player who never descends keeps the buff forever and never gets a path.** The pull
   downward has to be strong enough to move someone who has no mechanical reason to go.
   ⚠️ Whispers alone may not do it — a buff is a reason to stay comfortable.
2. **If the buff is too good, losing it is a punishment for progressing.** It should be
   enough to notice and not enough to grieve. My instinct: health and resistance rather
   than damage — *survivable*, not *powerful*, so what you lose is safety rather than
   capability.

## 5. 🔴 The death gate replaces the current routes, and they are still live

Today a path is granted by:

* **DRIFT** — 30 played days pathless (`chosen.js` `DRIFT_DAYS`)
* **being killed by another player's champion** while pathless

Neither involves the depths. Under this design **dying in the depths is the gate**, and
the question is whether it is the *only* one.

⚠️ **My concern with "only":** a solo player who never dies below the cutoff never gets a
path, forever, with nothing in the game explaining why. The drift route exists precisely
as the "you did not find it, so it finds you" backstop. ⭐ Keeping drift as a *long* fallback
(and re-framing it — you sicken, you go down, you die) preserves the intent without the
dead end.

## 6. 🖊️ The randomized life

*"From fisherman to farmer to anything else."* Each is: a name for what you were, a small
starting kit, and a couple of lines in the opening.

⭐ **It should change the OPENING TEXT and almost nothing else.** A fisherman and a farmer
should not play differently — they should have *been* different, which is a writing job
and a three-item kit, not a class system. The moment one of them is mechanically better,
players pick rather than receive, and a received past is the entire idea.

## 7. Ank — and `docs/53` priced this exactly

> *"⚠️ The temptation will be to give them lines later. Resist unless the fiction changes:
> the moment Caebrim or Ank speaks, 'unwilling to speak to her' stops being true. **If they
> ever do, it should be an event, not a pool.**"*

⭐ An immortal, dangerous companion who visits **is** an event, so the shape he is reaching
for is the one the doc already sanctioned.

🔴 **But half the price is already paid.** Caebrim now speaks as every deep speaker, and her
own document has her say of Ank: *"Ank speaks of you. In his moments of weakness. he wants
you back. He loves you."* So the estrangement is already live content. **Ank speaking spends
the rest of it** — after that, "unwilling to speak to her" is simply not true any more.

⚠️ That is not an argument against. It is a thing to spend **knowingly**, once, rather than
discover later that it went.

---

# ⭐ The open questions — these change the build

| # | question | why it matters |
|---|---|---|
| **1** | **Is dying in the depths the ONLY route to a path?** Or does drift survive as a long backstop? | "Only" can strand a cautious solo player permanently with no explanation |
| **2** | **What is the buff, exactly?** | It has to be noticeable and not grievable. Survivability rather than power is my instinct, but it is yours to set |
| **3** | **"Sonnet level generate visual dialogue"** — are you asking me to DRAFT the opening text? | You normally write dialogue and I do code. This reads like an exception; I will not assume it |
| **4** | **Does Ank land in this pass or later?** | He is a separate system (a companion NPC), and folding him in triples the size |
| **5** | How many lives, and does the kit matter at all? | Three professions with flavour, or twelve with real kits, are different jobs |

## What I would build first, if you want an order

1. **The three-state silence** — because it is subtractive, testable immediately, and
   everything else sits on top of it.
2. **The opening scene** — village spawn, a life, the plague, the doctor, the buff.
3. **The death gate** — the depths, "You feel wrong", the buff lost, the gods arriving.

⚠️ **Ank last, and separately.** He is a companion NPC, which is a different kind of system
from anything in this document.
