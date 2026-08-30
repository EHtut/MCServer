# 74 — The waves and the ladder

> **STATUS: LIVE AND BOOTED.** 2026-08-30, loaded 66/66 with 0 errors. His ratios, both
> corrections (augment-not-replace, spiders-only), all four rulings, the despawn system,
> and the infighting fix. **1146 assertions across 23 harnesses.**
>
> 🔧 **Benches:** `/tide_ratio [n]` · `/tide_god <god> [type]` · `/tide_roster` ·
> `/tide_clear` · `/tide_wave <type>` · `/tide_tier` · `/tide_now` · `/difficulty`

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

## ⭐⭐ His ratios — the axis that was wrong

> Ethan, 2026-08-30, after pitting Liam against three wave types:
> *"tides should be 80% fodder, 20% specalists per wave."*

| wave | fodder | specialist | its specialists are |
|---|---|---|---|
| **General** | 90% | 10% | light — bone imp, baby skeleton, draugr |
| **Horde** | 95% | 5% | tanks — thrasher, dread knight |
| **Specialist** (code: `ranged`) | **80%** | **20%** | archers, bow forced |
| **Miniboss** | 95% | 5% + the miniboss | light, and **none** below Heresy |

🔴 **The old table tuned a different axis and every test agreed with it.** It carried
`ranged: 0.65` — the share of the wave that *shoots*. Every archer in this pack is a
specialist on his table, so a "65% ranged" wave was a **65% specialist** wave: three
times his number. The harness asserted `ranged waves are majority ranged` and passed, on
a value that meant something else entirely. **D-113.**

⚠️ **Rounding was the second half of it.** A 6-mob horde at 5% wants 0.3 specialists, and
rounding to nearest gives **0 every time** — "5%" renders as "never". The fractional part
is spent as a probability now, so it averages to his number instead of flooring away.

⭐ **Placement is two calls, not one**, and that is what makes the counts exact — and the
only way the forced bow lands on the archers instead of the whole wave.

---

## 🔑 What makes a mob fodder — now a measured property

> *"All enemies above 1-2 armor are not fodder those are specialists, fodder is defined
> by enemies you kill in 1-2 swings and just drag you down."* · *"all baby enemies are
> considered specialists"* · *"i don't like piglins or zombie villagers at all same with
> zoglins"*

```
fodder  ⇔  armor ≤ 2  AND  hp ≤ 30  AND  dmg ≤ 5  AND not a baby
                       AND applies NO STATUS EFFECT on hit
```

🔴 **The fourth clause came from play, and the measured table was blind to it.**
*"wither skeletons are reported as 'too excessive' they should be specialists."* A wither
skeleton measures **20 hp / 0 armour / 2 damage** — *lighter than the Decrepit Skeleton
that is the bulk*. It passes every other clause and it is not fodder, because it applies
**Wither** on hit.

🔑 `generic.attack_damage` reads a number and cannot see a debuff — damage over time,
stacking across a crowd, the health bar blacked out while it runs. A low-damage mob that
applies an effect is exactly what is unfair *in numbers*, which is the only place fodder
is ever used. Moved to **light specialist**; `undead_classify.py` carries a hand-kept
`DEBUFF_ON_HIT` set so `docs/73` agrees rather than contradicting the code.

⭐ **The rest of her fodder was swept for the same thing.** `iceandfire:ghost` came up
referencing WITHER and POISON and was **checked rather than cut** — `canBeAffected` with
no `addEffect` is immunity handling, not an attack. Undead are immune to both, which is
why the reference is there at all. It stays in fodder.

⚠️ **The damage clause is an inference, not his words** — flagged because it is the only
line here he did not dictate. `goety:reaper` is 24 hp with no armour and would pass an
armour-only test; it hits for 8, which is a threat rather than a drag.

Two mobs left the bulk on his armour rule alone: **`bone_imp`** (armor 3.5) and
**`baby_skeleton`** (a baby). Both had been in every Normal wave.

⭐ **`stray` and `bogged` joined as MELEE fodder**, which resolves an old fiction: both
measured **0 bows in 12 summons**. They are not in epicknights' equipment config and
`/summon` does not run the vanilla equip step. As archers they were a lie; as skeleton
fodder they are honest.

---

## 🧹 The despawn — the tide cleans up after itself

> *"if all players die or if no mobs slain in 5(?) minutes the tide despawns. this is for
> server cleanliness and lag."*

🔴 **Before this, a run ended and the mobs stayed.** Death, dawn and surfacing all reset
the run state and left twenty-odd undead standing forever — `MAX_ALIVE_NEAR` only stops
more *arriving*. Every tide anyone had run was still loaded somewhere.

| trigger | despawns? | |
|---|---|---|
| **player dies** | immediately | nobody is coming back for that wave |
| **logs out mid-tide** | immediately | done while the player handle is still usable |
| **no tide mob slain in 5 min** | yes | keyed to **kills**, so a long fight keeps resetting it |
| **dawn / surfacing** | ⛔ not at once | his old ruling — no more come, but the ones chasing you don't evaporate. The orphan scan collects them 5 min later |

⚠️ **`discard()`, never `/kill`** — no loot, no XP, no death handlers, nothing feeding the
slain counters the tide reads back.

🔑 Every exit routes through one `endRun()`, and the harness asserts **exactly one** place
resets a run, so a new exit cannot forget to clean up. **D-126.**

---

## 🩸 Three mobs were fighting the tide they arrived in

`iceandfire:dread_thrall`, `dread_knight` (`DreadAITargetNonDreadGoal`) and
`goety:skeleton_wolf` (`Summoned$NaturalAttackGoal`) — **all three added the same day**.
Glowing blue eyes are the Dread army's signature. Nothing else in the repo could see it:
the ids are real, measured, undead, and survive being summoned.

⚠️ **My live "confirmation" was false** — the test prey was *burning* in daylight. New
screen `tools/infight_check.py` catches the known goal families statically; play remains
the proof. **D-124.**

---

## 🐺 Salvage's dire-wolf run — and the boss that summons

`docs/68` R2 gives Salvage **dire wolves** and she had **one mob**. ⚠️ There is no
`#minecraft:wolf` tag to census, so this was enumerated from every jar's lang file by
name (13 candidates), shortlisted, registry-probed with a known-fake control, measured
live, and persistence-checked.

| role | mobs |
|---|---|
| **fodder** | hostile black wolf · hellhound · stormhound · winter wolf · hunter's wolf · dread hound |
| **specialist** | ⚠️ **none — the mobs do not exist, D-119** |
| **boss** | **dire hound leader** — 100 hp, and it calls the pack |

⛔ **Excluded, each for a stated reason:** `goety:black_wolf` extends `Summoned` (the
`hostile_black_wolf` variant is the same statline without it) · `goety:skeleton_wolf` is
**hers**, in bone fodder, and a mob cannot be two factions or the faction says nothing ·
`minecraft:wolf` is tameable and neutral · two summon-companions.

### ✅ D-118 — the pack boss calls its pack, and that is the point

`born_in_chaos_v1:dire_hound_leader` — **100 hp / 10 dmg / 0.7 kb-resist** — spawns Dread
Hounds. Held back pending a ruling; **ruled in on 2026-08-30**, along with the whole
no-summoner rule. A dire wolf pack arriving with a leader that grows it is what a pack is.

⚠️ **D-119 — she has no specialist tier and the mobs for one do not exist.** Every wolf in
the pack is 8–17 hp with no armour. Her pressure is **numbers and speed**, which is an
identity rather than a shortfall — but there is nothing to promote if she should hit
harder.

---

## 🕷 Wall's spider run

`#minecraft:arthropod` censused (42 ids) → 19 shortlisted → **all 19 registry-confirmed**
→ 17 measured live → all persistence-checked.

| role | mobs |
|---|---|
| **fodder** | spider · cave spider · wither scuttler · corpse fly · silverfish |
| **specialist** | baby spider *(baby rule)* · diamond termite (8 arm) · thornshell crab (14 arm) · dread scuttler (10 arm) |
| **boss** | mother spider — 90 hp / 6 dmg / kb-res 1 |

⛔ **Both scorpions were dropped for a MEASURED reason, not because of their mod.**
`naturalist:desert_scorpion` and `jungle_scorpion` summon and then vanish before the next
tick, against a control that survived the identical command. Right theme, cannot be
placed.

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

### GENERAL — 90% fodder + 10% light specialists

| | |
|---|---|
| **Normal · The Rank and File** | Her ordinary dead, in numbers, with a few that have been down there long enough to be worth noticing. |
| **Alternate · The Draught** | The same crowd with nothing solid in it. Wraiths and the restless — they hit no harder and are far worse to be surrounded by. ⚠️ *Haunted armour was in this wave and does not spawn — D-116.* |

### HORDE — 95% fodder + 5% tank specialists · ⛔ no ranged

| | |
|---|---|
| **Normal · The Press** | Bodies and bone-armour, shoulder to shoulder. Nothing shoots. The threat is that it does not stop coming. |
| **Alternate · The Wailing** | The same weight of dead arriving as a *sound* before anything is visible. Still nothing shoots. |

### RANGED (his “Specialist”) — 80% fodder + 20% archers · the heaviest of the four

| | |
|---|---|
| **Normal · The Volley** | Murderous at distance — the only wave that punishes standing still. ⚠️ *“Fewer bodies than any other wave” was the 65% model and is no longer true: it is 80% fodder like the rest, and what changes is that a fifth of it shoots.* |
| **Alternate · The Bonecallers** | The archers stay; the crowd in front of them does not. Almost nothing to hide behind, in either direction. |

### MINIBOSS — 95% fodder + 5% light + one miniboss · ⛔ none of the 5% below Heresy

| | |
|---|---|
| **Normal · The Supreme** | A crowd thick enough that you cannot reach the thing that matters — and the thing that matters knows it. |
| **Alternate · The Fallen** | A fallen version of the Warrior at the head of her dead. Nothing in the game explains why, and nothing should. |

---

## The god-augmented waves

| tier | god | roster |
|---|---|---|
| **Malice** | **Blade** | Decaying Zombie (fodder) + Barrel Zombie · Door Knight · Zombie Bruiser · Skeleton Thrasher (specialists) · boss Fallen Chaos Knight |
| **Heresy** | **Wall** | 🕷 **spiders only** — spider · cave spider · baby spider (specialist) · boss Mother Spider |
| **Damnation** | **Art** | Scarlet Persecutor · boss **the Lifestealer** — ⭐ the same mob the tide already sends into HER waves as the Taker |

⛔ **Forge and Salvage have none** — reaffirmed 2026-08-30: *"Salvage does not even
augment tides."* Forge sends nothing at anyone; Salvage deals rather than attacks. Her
wolves are for her OWN events only. Their rosters still exist in
`spawn_pressure.js` for their *own* events.

🔴 **AUGMENTED, NOT SWAPPED.** A god's mobs are ADDED to her cast — measured after the
fix, a Blade general wave is 13 of hers + 5 of his. The miniboss is the one exception and
it overrides, because a wave cannot have two. **D-121.**

⭐ **Cumulative, and that is a choice.** At Damnation all three are possible rather than
only Art — the alternative is that climbing the ladder **removes** variety, and losing
Blade's waves by getting better reads as a bug however it is explained.

---

## 🚨 What was deliberately left out, and why

⛔ ~~**Necromancers.**~~ **RULE RETIRED 2026-08-30** — *"No summoner rule no longer applies
that is redundant, cut it from everywhere it is mentioned."* It was never measured, and
what actually bounds the risk is `MAX_ALIVE_NEAR` — a real ceiling on live tide mobs near
a player — not a ban on a category. Anything excluded **solely** for summoning is eligible
again and simply has not been re-evaluated: goety's `wight` / `grave_golem` / `skull_lord`
/ `wither_necromancer`, the `bound_*` casters, `irons_spellbooks:necromancer`.

⛔ **The 150–320 hp minibosses.** `docs/73` observed that both of the tide's minibosses
measure as *tanks* while seven heavier mobs sit unused. **Ethan ruled those two**, so they
stay. An observation is not a mandate.

⛔ **Occultism's twelve `wild_*`** — all Wild Hunt event mobs.

---

## ✅ The two things the wiring chunk had to deal with — and a third nobody predicted

**1. The modifier names changed.** ✅ Done. `specialist` is gone; `ranged` replaced it and
`horde` flipped from *bulk only* to *fodder + tanks*. `poolFor` was **deleted rather than
renamed** — it still held a `specialist` branch, and dead code naming a retired concept is
how a retired concept comes back. `composeFor` delegates to `waves.pick()` and its only
remaining jobs are weighting the id list and spending the boss cap.

**2. Wall's spiders.** ✅ Resolved as predicted — **god rosters are exempt**, and
`tide_undead_check.py` now *prints* the exemption with the not-undead count per god rather
than staying silent about it. An exemption nobody can see is an allowlist.

**3. 🔴 The check that was supposed to catch the spiders had been verifying NOTHING.**
Not predicted, and the real find of the chunk. It read three roster bands deleted on
08-29, got empty lists, and printed *"OK — every mob in every band is undead"* over zero
mobs. Repairing it then produced **four false findings**, because its tag reader dropped
nested references (`#goety:wraiths`) and had been testing against 89 of the tag's 133 ids.
**D-109 and D-110.** Both fixed; an unreadable roster is now a hard exit 2.

---

## ⚠️ What the wiring changed that was NOT on the plan

**`GOD_WAVE_CHANCE` was a regression and lasted one chunk.** The first pass passed
`waves.pick()` a flat 0.15 — which silently discarded the pathed/pathless split
(0.08 vs **0.25**), a rule `waves.js` cannot see because it does not know a player's path.
It compiled and played. The harness now samples the **composed wave** end to end, not the
helper, because a correct helper nothing consumes is exactly what this was.

**One miniboss per tide, spent at PLACEMENT.** Ethan, from play: *"the minibosses
themselves are usually incredibly hard to fight on their own."* The cap lives on the run
state, and `composeFor` only *proposes* — a proposal that is never placed must not consume
it. Miniboss light-specialist counts scale `[0, 0, 1, 2]` by difficulty: **none at all**
at Uprising and Malice, his other ruling from the same test.

**🔴 A recorded ruling was reversed — D-108, open.** A god miniboss wave is led by *that
god's* boss, contradicting a note that said the miniboss always stays hers. That note was
mine, not his. Kept, asserted, and raised rather than absorbed.
