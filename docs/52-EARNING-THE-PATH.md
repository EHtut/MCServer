# 52 — Earning the path, three more gods, and the villagers *(captured 2026-08-18, NOT BUILT)*

> Ethan, 2026-08-18: *"Part of me also (after the refresh) wants to bring forge, art,
> and undeath online too while also making the paths alot harder to achieve. mostly for
> lore reasons of (Why are these random players just now champions? They need to earn
> them) alongside that i want to turn villagers into player models aswell."*

**Captured, not scoped.** He raised this while flagging a usage limit, so this file
exists so the direction survives the session rather than to start it.

---

## 1. ⭐ "They need to earn them" — and the fix is smaller than it sounds

**The current claim is instant.** `chosen.js`: carry the item — iron sword, crossbow,
wrench, lapis — and *"carrying it UNLOCKS the path forever; the offer fires ONCE, out
of combat only."* Wall is the exception and already better: somebody kills you while
you walk no path, and she makes her offer **on your respawn**.

So his lore complaint is exact. A god picked you because you happened to be holding a
crossbow.

### 🔑 The item should make you NOTICED, not CHOSEN

That is the whole change, and it costs one state instead of a new system:

```
    carry the item   ->   NOTICED      the god starts watching. It may speak.
    do the thing     ->   TESTED       one demand, in that god's own idiom
    pass             ->   CHAMPION     the path, as it works today
```

**Why this is cheap:** every piece already exists. `killorder.js` issues "do this by
day N" and resolves it. `ritual.js` runs an offer scene with choices. `release.js`
tracks streaks and puts a champion down. `counters.js` counts each god's verb. A trial
is an order plus a deadline plus a voice, and all four are built and tested.

**Why it is also the right shape for the fiction:** ⭐ Wall's kill-route already reads
as earned — she watched you die and decided. The other four just hand it over. Making
them all a trial makes her the *template* rather than the odd one out.

### ⚠️ And it has to survive two players

A trial nobody can pass is worse than an instant grant. On a two-person server the
demand cannot be "kill another champion" for the first path claimed — there would be
none. **The first trial per god must be soloable**, or the path is unreachable and the
failure looks exactly like a bug.

---

## 2. Forge, Art, and **Undeath**

Forge and Art are `CLOSED` in `paths.js` — *"Disable art and forge"*, 2026-08-15 — and
the standing rule for opening one is written in that file: **a god opens when it has a
written voice and a live event set.** Today neither has a `*_voice.js` file at all.

| | to open |
|---|---|
| **Forge** | voice file · event set · `warn_incoming` (backburnered 2026-08-18) · his drop table is DONE |
| **Art** | voice file · event set · **and the name ruling** — Nightmare / Matriarch / Dreamwalker are all in use · her drop table is DONE |
| **Undeath** | ❓ **see below** |

### ❓ UNDEATH — one question before anything

**"Undeath" is already Wall's domain.** `docs/43`, her origin:

> *"the undead lineage inside her broke free, and she ascended into the Spider,
> **goddess of undeath**."*

So a sixth path by that name is one of three different things, and they do not share a
build:

1. **A new god** whose domain overlaps the Spider's — which needs the overlap to be
   deliberate and probably antagonistic, since two gods of the same thing is a story.
2. **The Crown returning.** Crown was merged into Wall on 2026-08-15 and still aliases
   her in `coefficients.js`, `warn.js`, `grudge.js` and `paths.js`. Reopening it as
   Undeath would mean **unpicking that alias in four files** — worth knowing before,
   not after.
3. **A rename of something existing.**

⚠️ Whichever it is, `crown` is currently a live key that resolves to `wall` in four
places. Any sixth path must not collide with it.

### ⭐ Art's overhaul is already flagged

Ethan, 2026-08-18: *"matriarch will probably need an idea overhaul but that's later.
she's meant to be the strongest of the gods but the weakest champion."*

That is a genuinely good hook and it inverts the coefficient table's own logic — every
other path's numbers compensate for what its mods cannot give. Hers would have to
compensate *downward*, which nothing in `coefficients.js` currently expresses (the
floor is 1.0 by his own standing rule: a path may never be made worse). **Strongest god
/ weakest champion needs a mechanic that is not a coefficient.**

---

## 3. Villagers as player models

> *"i want to turn villagers into player models aswell."*

**Almost certainly a resource pack, not a script** — the villager model is client-side
geometry, so this is the same shape as the visual mods added on 2026-08-16
(`side = "client"`, opt-in, never lands in `instance/mods`). No server change.

⭐ **And it is thematically load-bearing, not decoration.** The world is a medieval
surface over a technological ruin, and the gods take *people* as champions. Villagers
that look like people make three existing things land harder:

- **killing one stops being free.** It is the cheapest possible version of the
  consequence layer.
- **"why these random players?"** — §1's own question — is sharper when the alternative
  candidates are visibly the same kind of thing as you.
- the surface is deliberately safe and deliberately underpopulated
  (`tools/lifeq.py`: 47 land animals across 1165 chunks). Villages are most of what
  lives up there.

⚠️ Worth checking whether a pack already in the list does this before adding one — the
pack carries 218 jars and several are cosmetic.

---

## 4. Sequencing, and what blocks what

| | | blocked on |
|---|---|---|
| 1 | **Ethan's line refresh** — `docs/51`, 26 pools | nothing; it is his pass |
| 2 | **the villager pack** | independent of everything else, client-side |
| 3 | **earning the path** (§1) | a ruling on what each god's trial demands |
| 4 | **Forge + Art online** | voice files, event sets, Art's name |
| 5 | **Undeath** | ❓ §2 — which of the three it is |

⚠️ **None of it should start before a restart.** Sixteen commits are deployed and
unrun; adding three gods and a new claim flow on top of an unverified base would make
any failure impossible to attribute.
