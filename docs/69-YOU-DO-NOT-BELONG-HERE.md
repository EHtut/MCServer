# 69 — You do not belong here: the Nether and the End

> **STATUS: DRAFT.** Ethan's writing, 2026-08-29. **Zero code.**

> *"So what im hearing is that we need to keep end and nether biomes in? Fine, we can
> add an ambient line of how wrong those dimensions feel and you don't belong here."*

---

## 🔑 This turns the compromise into the better answer

Two attempts to merge the dimensions into the Overworld failed on their mechanics
(`66`): One Dimension generated correctly but broke Distant Horizons' LOD lighting;
Tectonic Layers could not generate a chunk at all. **The dimensions stay.**

⭐ **And keeping them is now doing work that removing them could not.** A Nether you
cannot reach says nothing. A Nether you *can* reach, which tells you that you are
trespassing, says the thing the whole design has been reaching for: **the gods' world
is Veldora, and their reach ends at the portal.**

You still need blaze rods. You just never stop being aware that you are somewhere the
pantheon does not go.

---

## The lines — Ethan's writing, verbatim

### Nether

```
You hear the distant echo of raging gods
You feel a wrongness deep in your soul
You hear a girl scream, fighting, a murder, then silence
You are afraid.
```

### End

```
You are uncomfortable.
Something comes from here, something you fought before many times
Run.
What do you seek here?
```

---

## 🔑 THE CRITICAL PROPERTY: these have NO SPEAKER

Every other line in this game comes from a named god with an authored register. Blade
commands. Milantros drops her g's. Salvage coaxes. Caebrim is grey and is not a god.

**These come from nobody.** Flat, second-person, declarative — *"You are afraid."*
*"Run."* No voice, no personality, no colour code that belongs to anyone.

⚠️ **That is the entire effect and it must not be eroded.** The moment one of these is
attributed to a patron, the Nether becomes another place a god can reach you — which is
the exact opposite of what they are for. **Nobody is talking to you. The place is just
true.**

🚨 **So they must NOT go through `voice.js`.** That module colours by god
(`COLOUR[god]`) and every caller names one. These need their own channel with no
speaker and no patron colour.

### Two things the writing is already doing

⭐ **The Nether escalates; the End interrogates.** The Nether's four lines run
distant → internal → specific → verdict, ending on the flattest possible statement of
fact. The End's four do not escalate at all — they circle, and one of them **asks you a
question**, which nothing else in the ambient layer does. Two dimensions, two different
kinds of wrong.

⭐ **"You hear a girl scream, fighting, a murder, then silence"** is the only line in
either set that describes an *event* rather than a feeling. It is also the only one that
implies the place has a history you are walking through rather than a mood you are
feeling. ⚠️ It reads as book canon — it should be checked against the Caebrim / Kayer /
Mera / Gregor material (`58`–`61`) before anything is built on top of it, because if it
is a specific event then other lines may eventually want to reference it.

⭐ **"Something comes from here, something you fought before many times"** points at the
existing bestiary. The End is not framed as alien — it is framed as the *source* of
things already familiar, which is worse.

---

## 🔴 OPEN — needed before this is built

1. **Cadence.** `idle.js` runs contextual ambience at *20% per 1200t with a 90s floor*
   and contexts for hold / location / combat / nearby champion. Is this a new context on
   that machinery, or its own channel? ⚠️ Four lines is a small pool — at idle's rate a
   player would exhaust and repeat them inside one Nether trip.
2. **Who hears them?** Everyone, or only pathed players? ⭐ Worth considering that they
   are *most* effective for a champion who is used to their god narrating — the silence
   where their patron should be is the point.
3. **Do they vary by path?** Cheapest answer is no, and "no" may be correct: a line with
   no speaker should not know who you follow.
4. **Delivery.** Chat, action bar, or title? The gods use chat. ⚠️ Something with no
   speaker arguably should not appear in the same place a speaker does.
5. **Does the deep Speaker still reach you there?** ⚠️ **Checked, and the answer is
   better than it first looked — but only by accident.**

   `deep_speaker.js` gates on `y < DEPTH_Y && !sky`, i.e. **below y0 with no sky**, and
   there is **no dimension filter of any kind**. The vanilla Nether (y 0..127) and End
   (y 0..255) never go negative, so the Speaker cannot currently fire in either. The
   premise holds.

   🔴 **But it holds by coincidence, not by design.** Nothing in that check knows what
   dimension it is in. Anything that lowers a dimension's floor below zero switches the
   Speaker on there silently — and **Amplified Nether does exactly that**, which is a mod
   this project came within one test of installing today as a `tectonic-layers`
   dependency.

   ⭐ **So add the dimension check anyway, while the reason is understood.** The
   pantheon not reaching the Nether should be a rule the code states, not a property of
   vanilla's coordinate ranges. One condition, written now, against a class of change
   that has already nearly happened once.

---

## Mod decisions taken alongside (2026-08-29)

**Terralith** and **Nyctophobia** are in.

| | |
|---|---|
| **Terralith** (22M) | ~100 biomes including Volcanic Crater and Ashen Savanna — hellish places that are *ours* |
| **Nyctophobia** (1.16M) | *"dark, foggy and unsettling biomes to the Overworld"* — the ambient-horror ask, as terrain |

**Not taken:** Biomes O' Plenty (overlaps Terralith and Regions Unexplored for the same
surface slots) · Alex's Caves (wanted, but it is an unofficial port depending on a second
unofficial port, in a pack where a beta mod crashed twice today).

### 🔴 THE ONE THING TO TEST BEFORE GENERATING

**Terralith and Tectonic both reshape overworld terrain.** They are commonly used
together and are believed compatible, but *believed* is what Tectonic Layers was, and
Regions Unexplored is already in the pack on Biolith doing a third version of this job.

⚠️ **Three worldgen mods composing is exactly the shape that has failed twice today.**
Test in `testgen` before the real reset — Terralith + Tectonic + Regions Unexplored +
Nyctophobia, generated together, and confirm both that it boots and that the terrain is
actually deep.
