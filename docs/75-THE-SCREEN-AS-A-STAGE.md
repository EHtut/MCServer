# 75 — The screen as a stage: whispers, the crashout, and who announces a tide

> **STATUS: DESIGN, captured 2026-08-30 from Ethan.** Zero code. This is his brief in his
> own words plus what the mod can actually do about it, so nothing here is invented and
> nothing is lost.
>
> Ethan: *"this system is fascinating and it has completely expanded how much lore we can
> build into this world now."*

⚠️ **Blocked on the god-dialogue overlay actually rendering.** Everything below rides on
`VELDORA.im.show`, which is mid-diagnosis (D-111 and the open one after it). Nothing here
gets built until a god line reliably appears on screen.

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
