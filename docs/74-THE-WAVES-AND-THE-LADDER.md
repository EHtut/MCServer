# 74 — The waves and the ladder

> **STATUS: BUILT, NOT WIRED.** 2026-08-30. `difficulty.js` and `waves.js` are live and
> harnessed (54 assertions, 4 negative controls). ⚠️ **`tide.js` does not consume them
> yet** — that is the next chunk, and it is a real one, because the modifier names change.

---

## 🔑 The ladder is a SLIDER, not a ratchet

> Ethan: *"the longer the player's are in the world and progressing the difficulty is
> increasing gradually, however if they keep dying the difficulty goes down."*

**Uprising → Malice → Heresy → Damnation**, and **difficulty can go down**. That is the
unusual half of the design: a player who is drowning gets a gentler world *without asking
and without being told*, and a player who is thriving gets hunted harder.

⚠️ **So nothing latches.** No high-water mark, no creeping floor — `difficulty.js` writes
**no persistent data at all**, and the harness asserts that. The moment any input is
remembered rather than read, the mercy half of the design is gone.

```
score = nights×10  +  slain×0.5  +  avgTrust×1  −  deaths×25      (floored at 0)

Uprising 0   ·   Malice 150   ·   Heresy 450   ·   Damnation 1350
```

⭐ **Exponential, roughly ×3 a rung** — *"easy to hellish"*, not four evenly spaced steps.
Damnation is meant to be a long haul most players never see.

🚨 **Every weight and step is a FIRST PASS.** They are reasoned against the project's own
landmarks (30 nights = the Speaker arrives; 500 slain = Blade's threshold), **not
measured** — nobody has played to Damnation. `/difficulty` prints the live arithmetic so a
session of play can correct them.

⚠️ **Unreadable inputs return Uprising**, the gentlest answer, and `/difficulty` names
which ones failed. The opposite failure hands somebody Damnation because a counter broke.

---

## ⭐ The variant axis IS the subfaction axis

"Normal / Alternate / God-augmented" needed a rule. The four subfactions are that rule:

| variant | faction | |
|---|---|---|
| **Normal** | **Skeleton** | the thesis. She is the goddess of death |
| **Alternate** | **Ghost** | still hers — the dead who did not stay in a body |
| **God** | theirs | somebody else reached into her water |

🔑 **And it explains the missing family.** Zombies are almost absent from her tides, which
is not an oversight — *"she has a focus on skeletons, not zombies."* The zombies are
**Blade's**. A wave full of them reads as *him*, which is exactly what a god-augmented
wave should feel like.

---

## The twelve themes

### GENERAL — fodder + light specialists

| | |
|---|---|
| **Normal · The Rank and File** | Her ordinary dead, in numbers, with a few that have been down there long enough to be worth noticing. |
| **Alternate · The Draught** | The same crowd with nothing solid in it. Wraiths and haunted armour — they hit no harder and are far worse to be surrounded by. |

### HORDE — fodder + tank specialists · ⛔ no ranged

| | |
|---|---|
| **Normal · The Press** | Bodies and bone-armour, shoulder to shoulder. Nothing shoots. The threat is that it does not stop coming. |
| **Alternate · The Wailing** | The same weight of dead arriving as a *sound* before anything is visible. Still nothing shoots. |

### RANGED — low fodder + high ranged specialists

| | |
|---|---|
| **Normal · The Volley** | Thin on the ground and murderous at distance. Fewer bodies than any other wave, and the only one that punishes standing still. |
| **Alternate · The Bonecallers** | The archers stay; the crowd in front of them does not. Almost nothing to hide behind, in either direction. |

### MINIBOSS — high fodder + a miniboss

| | |
|---|---|
| **Normal · The Supreme** | A crowd thick enough that you cannot reach the thing that matters — and the thing that matters knows it. |
| **Alternate · The Fallen** | A fallen version of the Warrior at the head of her dead. Nothing in the game explains why, and nothing should. |

---

## The god-augmented waves

| tier | god | roster |
|---|---|---|
| **Malice** | **Blade** | Barrel Zombie · Door Knight · Zombie Bruiser · Skeleton Thrasher |
| **Heresy** | **Wall** | Baby Spider · Mother Spider |
| **Damnation** | **Art** | Restless Spirit · Scarlet Persecutor · Dark Vortex |

⛔ **Forge and Salvage have none** — his ruling, and it fits: Forge sends nothing at
anyone, and Salvage deals rather than attacks. Their rosters still exist in
`spawn_pressure.js` for their *own* events.

⭐ **Cumulative, and that is a choice.** At Damnation all three are possible rather than
only Art — the alternative is that climbing the ladder **removes** variety, and losing
Blade's waves by getting better reads as a bug however it is explained.

---

## 🚨 What was deliberately left out, and why

⛔ **Necromancers.** `docs/72` flagged that goety's necromancers **raise more undead** — a
multiplier inside a multiplier, in a 24-mob wave. That risk was flagged and never cleared,
so nothing that summons is in any roster.

⛔ **The 150–320 hp minibosses.** `docs/73` observed that both of the tide's minibosses
measure as *tanks* while seven heavier mobs sit unused. **Ethan ruled those two**, so they
stay. An observation is not a mandate.

⛔ **Occultism's twelve `wild_*`** — all Wild Hunt event mobs.

---

## ⚠️ Two things the next chunk has to deal with

**1. The modifier names change.** `tide.js` runs `horde / general / specialist / miniboss`;
this is `general / horde / ranged / miniboss`. **`specialist` disappears**, and `horde`
changes meaning from *bulk only* to *fodder + tanks*. That is a rename **and** a
re-composition.

**2. 🔴 Wall's spiders are not undead.** The tide harness asserts every roster mob is
tagged `#minecraft:undead` or allowlisted, and Baby Spider is neither. ⭐ The rule should
**exempt god rosters** rather than allowlist the spiders — a god reaching into her water is
by definition not-her-undead, and that is the point of the wave.
