# 75 — The screen as a stage: whispers, the crashout, and who announces a tide

> **STATUS: DESIGN, captured 2026-08-30 from Ethan.** Zero code. This is his brief in his
> own words plus what the mod can actually do about it, so nothing here is invented and
> nothing is lost.
>
> Ethan: *"this system is fascinating and it has completely expanded how much lore we can
> build into this world now."*

✅ **THE OVERLAY WORKS** (2026-08-30, Ethan: *"Everything is working amazing"*). Three
stacked bugs, all fixed — see **D-123**. Everything below is now buildable **except** what
is specified as *typed*, which still waits on the typewriter question at the bottom of this
doc.

---

## Why this is more than a coat of paint

Every one of these was **impossible three days ago**. The pack had one delivery channel —
bold red chat — and a boss bar being re-sent with uneven padding to fake a wobble. Text
that shakes, types, garbles, sits anywhere on screen, at any size, in another font, is a
different medium, and the writing can now do things the chat line never could.

---

## 1. THE WHISPERS — the undead, as the tide closes

> *"as a tide progresses, you begin to hear the whispers of the undead attacking you.
> These are broken phrases that type out in random sizes in random areas of your screen.
> It increases intensity as difficulty increases and the wave progresses."*

| property | how |
|---|---|
| broken phrases | fragments, not sentences — the existing `whispers.js` pools are the right shape already |
| **type out** | ⚠️ blocked on the typewriter speed question — see below |
| random sizes | `size` (float) |
| random areas | `x` and `y` (floats), any anchor |
| rising intensity | frequency, size spread, and how broken the fragment is, all driven by wave number × difficulty |

🔴 **AND "SEVERAL AT ONCE" IS NOT POSSIBLE.** Read out of `ImmersiveMessagesManager`
on 2026-08-30: the mod holds **one** `currentTooltip` and a FIFO `tooltipQueue`. A send
ENQUEUES; when a message expires the next is pulled, after a 0.5s `timeBetweenMessages`
gap. Nothing displays simultaneously, nothing can be cleared, and the queue cannot be
reordered.

So the whispers are **sequential**, and the intensity curve has to be built from
frequency, size and how broken each fragment is — not from how many are on screen. ⭐ The
crashout is unaffected: *"several short lines in quick succession"* is exactly what a FIFO
queue with short durations produces.

⚠️ **AND THE QUEUE IS THE REAL PRIORITY PROBLEM.** A tide warning queued behind five
whispers arrives after the tide. There is no way to jump it, so the referee has to be
server-side: refuse or defer low-priority sends so the client queue never backs up.

🔑 **Intensity is a curve, not a switch.** Early waves: one fragment, small, near the edge,
readable. Late waves: several at once, larger, closer to centre, more of them garbled.
The player should notice the room getting louder without being able to point at when.

⚠️ **This is the one that can wreck the screen.** Whispers compete with god dialogue, tide
announcements and the HUD. It needs a budget — a maximum on screen at once, and a rule
that a god speaking outranks the dead muttering.

---

## 2. THE CRASHOUT — a god announcing their own tide

> *"when a god augmented tide begins, the god will announce it themselves with shaking red
> text in their font across the screen."*

`shake` + the god's colour + `font` + a large `size`, centre screen. The god's own font is
what makes it theirs rather than a red banner with their name on it.

### ⭐ Wall's is different, and it is the best beat in the brief

> *"For the wall it will be a bit more special because it will flash her freaking out in
> normal and garbled text across your screen before a flat 'I will kill you' in slow dark
> red slightly shaking typed text in the middle of the screen."*

Two movements, and the contrast IS the effect:

1. **The panic.** Several short lines in quick succession, scattered, alternating clean and
   `obfuscate`d — she is coming apart and you are watching it happen.
2. **The flat line.** Everything stops. One line, centre, dark red, **slow**, slightly
   shaking, typed: *"I will kill you"*.

🔑 The second only lands because the first was noisy. Whatever the budget rules end up
being, the silence before that line is load-bearing and must be protected.

---

## 3. WHO ANNOUNCES A TIDE

> *"tides will be announced in the middle of your screen in dark red text (caebrim) as
> she's the announcer of the waves. Your god can also announce it, but it should be
> dramatic on the hardest waves."*

* **Caebrim is the default voice of the tide.** Centre screen, dark red. She is the
  announcer; that is her role and it does not rotate.
* **Your own god may announce instead** — and on the hardest waves it should be
  *dramatic*, not merely present.

⚠️ **Two announcers, one screen.** Caebrim and your god must never both announce the same
wave, and which one speaks is a decision this doc has not made yet. It is the first thing
to settle before any of this is built.

---

## ⛔ The blocker, stated plainly

**The typewriter is not usable from the command route.** `tickTypewriter` reveals one
character per `1.0 / typewriterSpeed`, and `sendcustom` hardcodes `typewriter(1.0f, false)`
— the speed is not reachable. Two of the three systems above are specified as *typed*:

* the whispers *"type out"*
* Wall's flat line is *"slow ... typed text"*

🔑 So the typewriter question is not cosmetic — **it gates half of this document**.
`/gd type` measures it. If a character costs a tick, everything above is buildable as
written. If it costs a second, typed text needs the Java API rather than the command, and
that is its own piece of work that has to be scoped before any of this starts.

---

## What already exists and should be reused

| for | use |
|---|---|
| fragments and refrains | `whispers.js` pools |
| garbling | `obfuscate` (the mod's, not the hand-woven `§k`) |
| god colours | `voice.js` `COLOUR` registry — one place that knows |
| a tone per line kind | `voice.js` `TONE` table, matched on the tag |
| not-your-god garbling | `voice.alignedTo()`, already used by the bickering exchange |
| one bar, so something loses | `announce.js` priority model — the same problem, already solved once |

⚠️ **`announce.js` already learned this lesson**: one surface, so something has to lose,
and a warning that arrives behind an ambience line is a warning that never came. Whispers
plus a crashout plus a tide announcement is that problem again with three claimants
instead of two.

---

# ADDENDUM 2026-08-30 (later session) — speaking styles, and the introduction

## ⭐ 4. EVERY GOD GETS A PLACE ON THE SCREEN

> Ethan: *"each god have their own speaking style ... All dialogue should be typed and
> cut into sentences that generate after each other."*

🔑 **This is the thing that makes the TONE table obsolete as the primary key.** Right now
presentation is chosen by TAG — what the line is *about*. This says presentation is chosen
by WHO IS SPEAKING first, and the tag only modulates it. That is a better model and it
matches how a reader actually experiences it: you learn where on the screen your god lives.

| god | placement | manner |
|---|---|---|
| **Blade** | upper middle | he talks down to you — literally, from above |
| **Salvage** | ⚠️ **UNDECIDED.** *"part of me wants to keep her in the chat bar or maybe top right like a quest log?"* | see below |
| **Wall** | randomised across the screen | *"like she's whispering into your skull"* |
| **Forge** | shaking, randomised | rambling — and her writing needs an overhaul to match |
| **Art** | dead centre | *"She demands to be heard."* |

⭐ **Blade above and Art centre is a real characterisation, not decoration.** He looks down
at you; she blocks your view. The position IS the characterisation.

### ⚠️ Salvage is the interesting problem

She is the only one framed as a *transaction* rather than a pronouncement, and a deal has
to be re-readable while you weigh it — which is exactly what an overlay is bad at and the
chat bar is good at. A top-right quest-log position would keep her persistent and
consultable without stealing the centre.

🔑 **Not a coin flip: it follows from her role.** The others announce; she negotiates. Left
open deliberately rather than guessed.

### 🔴 Sentence-by-sentence delivery

> *"cut into sentences that generate after each other"*

Each line splits on sentence boundaries and the parts arrive in sequence rather than as one
block. This is a genuine engine change to `overlay()` — a queue with a per-sentence delay,
not a formatting tweak.

⚠️ **It also collides with the tide.** A god delivering four sentences in sequence occupies
the screen for several seconds while whispers and announcements may be trying to speak. The
priority model owed to §1 has to cover this too.

### ⚠️ Forge needs a WRITING pass, not a code pass

> *"She will need an overhaul to make her sentences shorter, with more periods, and more
> akin to rambling."*

Her existing pools are written as measured lines. Rambling is short bursts with hard stops
— and sentence-by-sentence delivery is what makes that legible on screen, so the writing
and the delivery have to land together or neither reads.

---

## ⭐ 5. THE INTRODUCTION, OVERHAULED

> *"now that we have the mca system plus this new text system, we can could overhaul the
> introduction system. players spawn in the village with a random set of tools plus a
> cutscene about a randomized backstory."*

Three parts, and only the third is new capability:

1. **Spawn in the village** — needs the world reset (C2/C3), which already stages
   *The Arrival*.
2. **A random set of tools** — a loot-table roll at first join; nothing exotic.
3. **A cutscene about a randomised backstory** — ⭐ this is what the text system unlocked.
   A sequence of centre-screen lines, timed, that tells you who you were before Veldora.

🔑 **The backstory should be READ BY THE REST OF THE GAME, not just shown once.** A
randomised origin that nothing ever references again is a loading screen. If it is stored,
the gods can know it — and Salvage in particular should be able to use what you were
against you.

⚠️ **Depends on MCA** for the village population, so it is gated on the reset like
everything else in C.

---

## Where this leaves the build order

1. ⛔ **The overlay must render reliably.** Still the blocker for everything above.
2. ⛔ **The typewriter question.** *"All dialogue should be typed"* — now stated for every
   god, so it is no longer optional to answer.
3. **Then** the per-god placement table, which is mostly a re-key of existing machinery.
4. **Then** sentence-by-sentence, which is a real engine change plus a priority model.
5. **Then** Forge's writing pass — Ethan's, not mine.
6. **The introduction** rides with the world reset regardless.

---

# ADDENDUM 2026-08-30 (evening) — the rulings that came out of first contact

The fonts rendered for the first time at 13:18 (D-130 — every provider had been rejected
since the day they were fetched, for a doubled `font/`). Three rulings followed from
actually looking at it.

## ⭐⭐ 6. COLOUR IS EMPHASIS, NOT IDENTITY — a standing rule

> Ethan: *"God colors need to go away, color will only be used for emphasis now."*

🔑 **The fonts are what made this possible, and that is the whole argument.** While no god
font rendered, colour was carrying identity alone and had to. Now Cinzel, Cormorant,
Metamorphous, Rye and Special Elite do that job — and a permanent per-god colour spends
the loudest signal the screen has on the one thing the typeface already says.

**The rule, for any new work:**

* A god's ordinary line carries **no colour**. `voice.overlayColour()` returns `null`,
  `immersive.js` omits the tag, the mod defaults.
* A **moment** may still be coloured, and that is not an exception — it is the point.
  Wall's flat *"I will kill you"* stays dark red because it means something *there*.
* ⛔ **Never write `color: '#FFFFFF'`.** That is a colour decision dressed as no decision,
  and it drifts silently the moment the default moves. Blade carried one for a few hours
  and it was removed for exactly this reason.

⚠️ **THE SCREEN ONLY.** The chat copy keeps `colourOf(god)`. Chat has no fonts, so colour
is the only thing separating speakers in a scrolling record — removing it there is a
different decision and has not been made. (**E2c** is now the narrower question of whether
chat should change at all.)

## ⭐ 7. A WHISPER MUST BE READABLE, AND THAT COSTS THE REFEREE SOMETHING

> Ethan, from play: *"Whispers disappear way too fast and are unreadable. 1-2s"*

🔴 **The flat duration was the bug, not merely a short one.** *"we were told to wait and we
waited"* and *"stop"* both got 1.4s. Now scaled by length at ~13 characters per second,
floored at 2.6s, and **obfuscated fragments get longer** — broken text is read twice, once
to see it and once to work it out.

⚠️ **This was not a local change.** A whisper holding 4s costs 4.5s of queue, and at the
old tolerances every interior line and every god line landing inside one would have been
**refused outright — dropped, not delayed**. `screen.js`'s boot invariant is what refused
to let that ship. So `ASIDE` went 2.0 → 4.5 and `GOD` 4.0 → 5.0.

🔑 **The cost is real and it is stated:** an aside may now arrive up to 4.5s after the
moment that prompted it. Late is the right failure for an interior line — it still reads
as your own head catching up. It would be the wrong failure for a warning, which is why
`ANNOUNCE` did not move.

## ⭐ 8. SALVAGE IS IN THE QUEST LOG — E2a ruled

> *"Salvage speaks top-right, like a quest log."*

⭐ It characterises her better than the middle ever would. The other four take the centre
of your screen because they are addressing you and expect to be looked at. She sits where
the game keeps its **bookkeeping** — offers, objectives, the things you get round to.

⚠️ **She is the one god you can ignore, and that is the design.** Ignoring her costs
nothing right up until it costs everything, which is the entire shape of a deal.
