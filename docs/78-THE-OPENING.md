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
a plague you brought with you            BACKSTORY. Already over by the time you play
    ↓
a doctor with white hair                 she healed you overnight
    ↓
you wake STRONGER THAN USUAL             ⭐ and GLAD. Life is worth living, and the
                                         player should be happy to be in it
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

## 5. ✅ RULED — the death gate replaces the current routes entirely

Today a path is granted by:

* **DRIFT** — 30 played days pathless (`chosen.js` `DRIFT_DAYS`)
* **being killed by another player's champion** while pathless

Neither involves the depths. Under this design **dying in the depths is the gate**, and
the question is whether it is the *only* one.

⚠️ I raised the stranding risk — a solo player who never dies below the cutoff never gets a
path, forever, with nothing explaining why — and **he ruled that it is intentional.** So
`DRIFT_DAYS` and the champion-kill route both retire, and the only door is down.

⭐ It is also the door that makes Kayer's path mean something: dying in the depths is what
makes you undead, so choosing HER means choosing it a second time, deliberately, already
knowing the cost.

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

# ⭐ RULINGS, 2026-08-30

## ✅ 1. Depth-death is the ONLY route, and the dead end is intentional

> *"Yes the depth death is the only path... And yes only is intentional."*

⛔ **So the drift route and the killed-by-a-champion route are retired.** I raised the
stranding risk and he took it knowingly: a player who will not go down does not get a god,
and that is the game rather than a gap in it.

### 🔑 AND HE NAMED THE THING THAT MAKES IT WORK

> *"since this also is kayer's path to chosen, this means the player has to choose to die
> twice."*

⭐ **That is the best structural idea in the document and it is his.** Dying in the depths
is what makes you undead — which is Kayer's whole domain. So a player who wants HER has to
walk back down and do it again, on purpose, already knowing what it costs. Every other god
asks you to die once, by accident, while learning. She asks you to choose it.

⚠️ Nothing needs to be built to say that. The second death is already load-bearing purely
because the first one hurt.

## ✅ 2. He writes the lives. I build the delivery.

> *"I can also write the intros, you just do the visual dialogue."*

The normal split, and the same one the bickering documents used: his words in
`docs/dialogue/`, regenerated into script by an importer, delivered by the systems already
built. 📄 **`docs/dialogue/The Opening.txt`** is the template.

## ✅ 3. ⭐⭐ THE TONE: UPBEAT. Life is worth living.

> *"make them more up beat, make life actually seem worth living and the player is happy
> and excited to be alive."*

🔴 **This corrects my draft, and it corrects it in the direction that makes the whole arc
work.** I framed the opening around the plague and the suffering, which is the obvious
reading and the wrong one — a bleak opening followed by a bleak death is just bleak, and
nothing is lost because nothing was had.

🔑 **The plague is BACKSTORY. The present tense is joy.** You were sick, and now you are
not. You were travelling, and now you have stopped. You are strong, the village is warm,
the morning is good, and you are *pleased to be here*. That is the state the player spends
their first seven days in.

⭐ **And that is precisely why "You feel wrong" lands.** Two words can only carry a
paragraph if there was something to lose. The upbeat opening is not decoration on the
design — **it is the mechanism.**

⚠️ **The instruction this puts on every line of the opening:** it must be written by someone
glad to be alive. No foreshadowing, no dread, no knowing wink at what is coming. A line
that hints costs the ending a little, and there are only two words at the other end to
carry it.

# The questions still open

| # | question | why it matters |
|---|---|---|
| **1** | **What is the buff, exactly?** | Noticeable, not grievable. Survivability rather than power is my instinct, but it is yours to set |
| **2** | **Does Ank land in this pass or later?** | A companion NPC is a different kind of system; folding him in triples the size |
| **3** | How many lives, and does the kit matter at all? | Three with flavour or twelve with real kits are different jobs |

## What I would build first, if you want an order

1. **The three-state silence** — because it is subtractive, testable immediately, and
   everything else sits on top of it.
2. **The opening scene** — village spawn, a life, the plague, the doctor, the buff.
3. **The death gate** — the depths, "You feel wrong", the buff lost, the gods arriving.

⚠️ **Ank last, and separately.** He is a companion NPC, which is a different kind of system
from anything in this document.
