# BLADE — THE WARRIOR, god of war

*The first patron project. Ethan, 2026-08-15: **"events are something that need to be
planned out individually per event rather than assuming. Each patron's events are a
whole project on their own."*** `34` §7 has the ordering; Blade is first because
Lehykt walks it, eight of his twelve are spawner calls, and the spawner is built.

---

# PART 0 — THE WORLD, RESTATED

*Ethan, 2026-08-15:*

> **This world is a cursed one, ruled over by the five gods. Each player, a champion.
> There have been many champions, you are not the first and you will never be the
> last.**

**Five gods, five paths** — the arithmetic already works, because Crown merged into
Wall (`35` §6). "Patron" was the role; **god** is the station; **champion** is what a
player is.

🔑 **Blade's arrival already says this**, written before the lore was:

> *"Hundreds have stood where you stand now. I remember none of their names."*

---

# PART 1 — WHO HE IS

**THE WARRIOR** · god of war · `born_in_chaos_v1:fallen_chaos_knight` · he

> **He seeks and will always demand the absolute glory of combat.**

**Voice** (unchanged, `23`): second person, imperative, contemptuous. **Short.**
Never explains, never congratulates — **his highest praise is silence.**
**Likes: fighting. Hates: idling.**

**Canon lines:** *"Fall"* · *"You reach for heights you will never attain"* ·
*"For It was Icarus who flew too close to the sun. You will share his fate"* ·
**`"Run."`** — reserved, fires once, immediately before the Harvest.

**His myth-register is Greek falling** — Phaethon in the arrival and in regard, Icarus
in the canon and in event 2. Every lore drop should stay inside it.

## 1.1 How he sees the other four

**The relationships are a dialogue engine, not colour.** Each is a stance he can be
made to comment on, and each contains a judgement of that god's *champions* separately
from the god — which is the whole texture.

| god | stance | what he says of the GOD | what he says of the CHAMPION |
|---|---|---|---|
| **Wall** — the spider | 🔴 **HOSTILE** | mercy and love are weaknesses; her obsession makes her weak | they fight not with their own strength but **the borrowed might of others** |
| **Salvage** — the dog | 🟢 friendly | annoying; her deals and trades are **redundant acts** | their might is **respectable** |
| **Forge** — the thief | 🟢 friendly | tolerable | ⭐ **respected.** *Glory cannot be attained alone* — he **demands** cooperation with the engineer, **for it is he who is the engine of war** |
| **Art** — the grand leader of the court | ⚪ neutral | few opinions | *"She speaks. He follows. Simple."* |

⭐ **Forge is the load-bearing one.** It is the only place the god of war admits a
dependency, and it points at the same interdependence the trinity was built on:
Blade's `drops ×0.6` is *why* he needs an armourer. **His respect for Forge is the
coefficient, spoken.**

---

# PART 2 — TRUST, AND WHAT IT SELECTS

Trust is the **counter** (`counters.js`), and Blade's counter is **enemies slain**.
It is the appeasement axis of `23` PART V.8 — distinct from `regard` (which measures
deaths) and from `notoriety` (which measures ripeness).

| tier | how he reads you | what he sends |
|---|---|---|
| **LOW** | *the champion is weak and barely worthy of his boons* | **he forces combat and forces them to level.** Delving and fighting. **Increased boons, drop rates, material gifts.** |
| **MEDIUM** | *capable, but not worthy* | **increased spawns · relic gifts** |
| **HIGH** | *they have proven themselves — he seeks to test their might* | **massively increased spawns, and a chance of miniboss spawns** |

🔑 **Note the shape: he gives MOST at LOW trust.** The god of war arms the weak so
they can fight, then stops helping and starts testing. **Generosity is contempt** and
danger is respect — which is the same inversion `regard.js` already runs, where Wall
and Art escalate the *wrong way* on purpose.

**In the 2×2** (`23` §3b): LOW is where his *gifts and bargains* live, HIGH is where
his *reckonings* live. Blade travels the diagonal as you earn him.

## 2.1 🚨 THE RULE THAT DEFINES HIM MECHANICALLY

> **The Warrior never targets a wounded champion.**
> Hostile or negative events fire **only** when the champion is at **full or ≥75%
> hearts AND hunger**.

This is not a safety valve, it is characterisation. **He wants the glory of a real
fight, not a kill** — and it makes him the exact inversion of Salvage, whose E6b
trigger is *low health mid-combat.* Two gods watching the same number and moving in
opposite directions on it.

*It is also, quietly, the kindest rule in the design: the one god who hits hardest is
the only one who will not kick you while you are down.*

## 2.2 Ambient — proximity, not event

Small, constant, no scene. Fires on nearness rather than on a threshold:

* heal *x*
* restore *x* hunger
* **kill a hostile champion** — ⚠️ see the open question in PART 5

---

# PART 3 — IDLE

> **He comments on the world through lore drops, or on the other gods. He is far less
> talkative than the others, but he will always attempt to steer the champion toward
> strength.**

Three consequences for the writing:

1. **Volume is character.** If the other four speak often and he does not, his silence
   *is* the highest praise the design already claims it is. **His idle rate must be
   measurably lower than everyone else's**, not just his line count.
2. **Every idle line has a job**: a lore drop, a verdict on another god, or a push
   toward strength. Nothing decorative — he does not do atmosphere.
3. **Idling is what he hates**, so the trigger is inverted from everyone else's: he
   speaks when you have been *doing nothing*, and goes quiet when you fight.

---

# PART 4 — DYNAMIC LINES: the grammar

*Ethan: **"I want to make it dynamic for most of these with dialogue snippets combined
together to keep things fresh."***

**Nothing in the pack is combinatorial today** — every pool is whole lines picked at
random. This is the new structure, and Blade's voice suggests its shape, because his
best written lines are already two-part:

> *"Phaethon reached for the sun's chariot too."* **+** *"They still find pieces of him
> in the river."*
> *observation* **+** *verdict*

**Proposed grammar — `[OBSERVATION] + [VERDICT]`**, drawn from separate pools and
joined. Both halves stay short, and the verdict never softens.

For idle specifically a third pool applies, chosen by what he is commenting on:
**`[LORE or GOD-JUDGEMENT] + [PUSH]`**.

⚠️ **The combinatorial risk is nonsense pairs.** Pools must be tagged so a Wall verdict
never lands on a Forge observation. Tag by subject, join within subject.

**Sonnet writes the snippets** (Ethan's call) once the grammar and the tags are fixed
— the structure is the part that has to be right first.

---

# PART 5 — OPEN QUESTIONS

**1. ⭐ Is Art the leader of the pantheon?** *"The grand leader of the court"* — and
*"She speaks. He follows."* reads as the god of war deferring to her. If so that is a
significant beat: the Nightmare who gives without asking, and wants you to sleep, is
the one the others answer to. It also inherits the *court* language that was Crown's.
**Confirm before it is written into his lines.**

**2. 🚨 "Kill a hostile champion" — is this PvP?** Wall is HOSTILE to Blade, so
rewarding Blade's champion for killing Wall's champion means the gods point players at
each other. On a four-player server that is a real social mechanic, not a flavour one.
**Deliberate, or does it mean hostile MOBS?**

**3. What are the trust thresholds?** LOW/MEDIUM/HIGH need kill counts. Lehykt is
walking blade now and `counter_hooks.js` is already counting — **a session of real
play gives us the curve rather than a guess.**

**4. What is a "relic"?** MEDIUM's gift tier. Existing loot, an artifacts-mod item, or
something new?

---

# PART 6 — WHAT ALREADY EXISTS

Everything here is built and live unless marked.

| | |
|---|---|
| **introduction** | 6 arrival + 3 demand + options + 3 accept + 3 refuse — `28`, live |
| **the gift** | Dark Warblade, *"Take it. Two hands. Even that will not be enough."* — written, **held** with I3 |
| **idle** | 4 whispers, escalating by hunt phase — live, **too few for this design** |
| **regard** | 5 contempt beats + a decay line — live |
| **entry / fall** | *"Everything you were is nothing. Begin."* / *"What I needed is mine. Go."* |
| **counter** | enemies slain, `isMonster()` — live |
| **coefficients** | spawns ×4 · power ×3 · drops ×0.6 · phase ×2 |
| **reckoning** | configured, **not collecting** — demand 25/day, trigger 50 |
| **events** | 12 designed, **0 built** |
| **his mods** | Better Combat · Combat Roll · Cut Through · Epic Knights · Medieval Siege Machines · Not Enough Animations |
