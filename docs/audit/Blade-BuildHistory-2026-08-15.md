# Blade — the complete build history, 2026-08-15

> 🗃️ **THIS IS THE HISTORY, NOT THE SPEC.** Everything below is the working document
> exactly as it was written during the build, in order, PART 0 through PART 16 — the
> arguments, the false starts, the recastings, the bug ledger and the reasoning behind
> every number. It is preserved verbatim because the *why* lives here and nowhere else.
>
> **For what Blade actually IS, read `docs/40-BLADE-THE-WARRIOR.md`** — the as-built
> reference. For how to build another god, read `docs/41-BUILDING-A-GOD.md`.
>
> Split out of `docs/40` on 2026-08-15 when that file reached 1,013 lines and had
> stopped being answerable at a glance. Nothing was edited, dropped or reordered.

---

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

**THE WARRIOR** · god of war · he
**His actor:** a *pantheon*. **`born_in_chaos_v1:fallen_chaos_knight` — CONFIRMED
2026-08-15**, name kept as **The Challenger**.

*Recasting was surveyed against all 86 Born in Chaos entities: only Lord Pumpkinhead
carries a boss bar and nothing summons, so the field was open. Rejected on looks —
**Door Knight** (comedic, a villager with a door), **Scarlet Persecutor** (a ghost),
**Lifestealer** (striking, but **arachnid** — spider iconography for the god who
despises the spider reads as a mistake, and it has a `true_form` that transforms into
a second casting nobody chose). The black knight is restrained rather than
underwhelming, and restraint is his character: he does not perform.*

⭐ **THE RED DRAGON GOES TO THE HARVEST.** `iceandfire:fire_dragon` — checked in the
jar: **no boss bar**, and griefing is a config flag (`iaf-common.json`
`"griefing": true` → false). But it **flies**, carries **its own** ownership model
(`TamableAnimal`, `setOwnerUUID`) that would fight our owner tag, and is
**multipart** (`PartEntity`), so `getEntitiesWithin` scans would count one dragon as
several. **All three objections are leash problems — and the Harvest has no leash.**
It arrives once and it is meant to be unsurvivable, so none of that machinery applies.

> **The knight watches you. The dragon collects you.** The god sends what the occasion
> deserves — which is the actor reframe doing real work.

> ⭐ **He is never that mob.** The god is the voice; the pantheon is what he sends.
> Every argument in `18-THE-STALKERS.md` about which entity he "is" was solving a
> constraint that no longer exists — the only question left is which hunter looks
> most like something the god of war would send.

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

# PART 4.5 — THE MARK  ⭐ his signature event

*Ethan, 2026-08-15: **"he'll randomly go 'Fuck that guy' and then tell you to kill
them within 1-2 days. If you do you get a buff. If not, nothing he just grumbles."***

**Yes, it is PvP — and the design is in the consequences.**

| | |
|---|---|
| **trigger** | random, and only against a champion of a god he is **HOSTILE** to — Wall today |
| **window** | 1–2 in-game days, on the world clock like every other deadline |
| **succeed** | a buff |
| **fail** | ⭐ **nothing. He grumbles.** |

🔑 **The refusal costing nothing is the whole mechanic.** A god who *punishes* you for
not killing a friend forces the fight and poisons the server; a god who merely
*grumbles* leaves it a genuine choice, and choosing not to becomes a thing you did
rather than a thing you avoided. It also fits his character exactly — **he is
disappointed in you constantly and it never costs him anything.**

It is also the only place the relationship table becomes mechanical: **his contempt
for the spider is why the mark exists**, and Wall's champion is the only legal target
while she is the only hostile.

⚠️ **Consent and scale.** Four players, one of whom may be marked repeatedly. Before
this ships: does the target know they are marked? Can a player opt out? Does the buff
reward the kill or merely the attempt? **Design questions, not build questions.**

---

# PART 5 — ANSWERED, 2026-08-15

## 5.1 ✅ Art leads the pantheon

*Ethan: **"Art is the leader of the pantheon yes. She works through the shadow
stalker. Her realm is the realm of magic."***

**The god of war defers to her**, and *"She speaks. He follows. Simple."* is not
indifference — it is the only obedience he has. He *"has knelt before nothing since
the day I rose from it"*, and she does not need him to.

Two consequences beyond Blade:

* **She works THROUGH the shadow stalker.** `nightmare_stalker` is her instrument, not
  her body. **Art is the one god who is never actually present**, which makes her the
  natural first case for chat-only patrons (`11-OPEN-DECISIONS.md`) — she was already
  written that way.
* **Her realm is magic**, which reconciles her path (Ars Nouveau) with her character
  (the Nightmare) — the two had been pulling apart since the counter discussion.

**For Blade's lines:** he may mock any god except her. Of Art he is *brief*, and the
brevity is deference rather than dismissal. That distinction has to survive into the
writing or he reads as merely bored.

## 5.2 ✅ THE GRUDGE — yes, it is PvP, and it is safe

*Ethan: **"he'll randomly go 'Fuck that guy' and then tell you to kill them within 1-2
days. If you do you get a buff. If not, nothing he just grumbles."***

| | |
|---|---|
| **trigger** | random, at his whim |
| **target** | another champion — Wall's by preference, since she is the one he despises |
| **window** | 1–2 in-game days |
| **success** | a buff |
| **failure** | ⭐ **NOTHING.** He grumbles. |

🔑 **The no-penalty is what makes it shippable.** Four friends on one server, and a
god who *punished* refusal would be a god who forces PvP — which is a social problem,
not a design one. **Costless refusal makes it an offer**, so it lands in the 2×2 as a
**BARGAIN** rather than a DEMAND, and it is genuinely opt-in.

*And the grumble is perfectly in voice: he never punishes, he loses interest. Contempt
is the only sanction he has.*

⚠️ **To settle when it is built:** does the target know? An announced grudge is a
duel; a silent one is an ambush. Blade announces everything — *every cost is named
before it is paid* — so it is probably announced to both, which turns it into a scene
the whole server can watch.

## 5.3 ✅ RELICS — maintenance, never power

*Ethan: **"Food, Weapons, materials... it should be maintenance materials. The blade
will never give you an overpowered weapon or something you did not earn."***

**The constraint is the design.** He arms you to keep fighting; he does not make you
strong. A gift that made you stronger would do the work he is testing whether you can
do — and *"Even that will not be enough"* is the thesis of the only gift he has ever
given.

| tier | what it is |
|---|---|
| **LOW** | material gifts, drop rates — *keep fighting* |
| **MEDIUM** | relics: food, weapons, materials — **maintenance grade** |
| **HIGH** | **no gifts.** Spawns and minibosses. He has stopped helping. |

**Never:** best-in-slot, enchanted-beyond-earning, or anything that skips a tier of
progression. **Repair over reward.**

### The shortlist — from his own mod, and that is the point

Scanned from `born_in_chaos_v1` (240 items). **Dark metal is the substance he is made
of** — `fallen_chaos_knight` and the Dark Warblade are the same stuff — so a gift of
dark metal is a gift of himself, which is the only generosity in character for him.

| tier | candidate | why |
|---|---|---|
| **material** | `dark_metal_ingot` | ⭐ **the spine of the whole ladder.** His own substance; repairs the blade he gave you |
| **material** | `armor_plate_from_dark_metal` | armour repair — maintenance in its purest form |
| **food** | `smoked_monster_flesh` · `smoked_flesh` | ⭐ **he feeds you what you killed.** No farming, no cooking fire he did not light |
| **food** | `monster_flesh` | the raw version — a LOW-trust gift, deliberately worse |
| **consumable** | `potion_of_rampage` (Elixir of Rampage) | combat-only, temporary, wears off. Never a permanent gain |
| **weapon** | `sharpened_dark_metal_sword` | mid-tier and unremarkable — ⚠️ **verify its damage in game before it ships**, since "never overpowered" is the rule it must not break |

🔑 **The thematic result:** he gives you back what you killed, forged in the metal he
is made of. Nothing that makes you stronger — only what keeps you swinging.

⚠️ **Ethan to validate in game.** The scan proves these items exist and are on theme;
it cannot prove `sharpened_dark_metal_sword` is not secretly best-in-slot, and that is
the one line the relic rule must not cross.

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

---

# PART 7 — WHAT A RELIC IS

*Ethan: **"Food, Weapons, materials... but it should be maintenance materials. The
blade will never give you an overpowered weapon or something you did not earn."***

**MAINTENANCE, never advancement.** The distinction is the character:

| he gives | he never gives |
|---|---|
| food · repair materials · ammunition · common weapons that **replace** what broke | anything that makes you stronger than your own fighting made you |

> **He keeps you fighting. He does not make you better at it.**

That is why the tiers read as they do: at LOW trust he gives *most*, because a
champion too poor to fight is no use to him — and at HIGH trust he gives almost
nothing, because by then you are the weapon.

⚠️ **The Dark Warblade is the exception that proves it**, and it is not a
contradiction: it is a weapon *you are not strong enough for*. He hands you the proof
of your own insufficiency and says nothing about it. **A gift that is a judgement.**

**An audit can pick the actual items** — or Ethan digs, since he is in the server.
Either way the rule is: nothing from a tier the champion has not already reached.

---

# PART 8 — ⭐ THE HUNT IS A CHALLENGE, NOT A COLLECTION

*Ethan, 2026-08-15: **"im considering changing the hunt to be a challenge. The purpose
of the blade's hunt is to challenge you against his strongest warrior. Win and he
releases you telling you are ready. Gives you an offer to stay but lets you go. Fail
and take a hit to trust - though this is intended."***

**This is the best thing in his design.** Every other god's Harvest is a *collection* —
they come to take what they fed. Blade's is a **graduation.**

| | |
|---|---|
| **what arrives** | his strongest warrior — not the god, an actor sent to test you |
| **you win** | **he releases you.** *You are ready.* He offers you the chance to stay, and lets you go if you do not take it |
| **you lose** | a hit to trust. **Intended, not punished** — the test is meant to be failed before it is passed |

### Why it is right for him specifically

* **It is the only Harvest that can be WON**, which is exactly what separates the god
  of war from four gods who feed on you. He wanted a champion, not a meal.
* **The offer to stay is the whole character.** He does not need you and says so
  constantly — and then, at the one moment he could keep you, he asks. That is the
  warmth the trust arc has been building toward, spent once.
* **Failure being intended** matches the drill sergeant: you are supposed to fail the
  test before you pass it. A trust hit is a setback, never a revocation.
* ⭐ It gives *"Run."* its real meaning. Reserved, fires once immediately before the
  Harvest — and now it is not a threat, it is **the last thing he says before the
  test begins.**

⚠️ **This makes the Harvest per-god.** The engine cannot assume "the patron collects";
each god's Harvest is its own thing, and Blade's is the first that is not a taking.

---

# PART 9 — ⏸️ OPEN: retire the release mechanic

*Ethan, 2026-08-15: **"im halfway considering to remove the release mechanic. You can
only be released by disappointing the patron too much or just not being on the server
for a long time."***

**Captured, not built.** Today `/path release` lets a walker set a path down at will
(blocked mid-Harvest by the K2 guard).

**Removing it leaves exactly three ways out:**

1. **The fall** — disappointing the patron enough (`fall.js`, live)
2. **Absence** — long enough away that the god loses interest ⚠️ **does not exist yet**
3. **Blade only:** winning his challenge and taking his release (PART 8)

**Why it is attractive:** a choice you cannot walk back is a real choice, and the
whole introduction ceremony — the black screen, the price, *"Everything you were is
nothing"* — is undercut by a `/path release` that costs nothing. It also removes the
largest remaining **act-command** after `/path <name>` (`23` PART V.6).

**What to watch:** four players, one path each. A player who picks wrong is stuck
until they disappoint their way out, which is a slow and unpleasant exit. **The
absence route matters more if this ships** — it becomes the only clean way out.
---

# PART 10 — THE TWELVE, DRAFTED

*Drafted 2026-08-15. Each event gets its quadrant (`23` §3b), its trust tier, its
trigger, and what it still needs. **Nothing here is built.***

⚠️ **THE FLOOR APPLIES TO EVERY HOSTILE ONE.** No negative event fires below **75%
hearts AND hunger** (PART 2.1). He wants the glory of a real fight, not a kill.

## The four he can have almost immediately

These need only the spawner, the voice and the counter — all live.

### 1. THE GAUNTLET ✅ **BUILT 2026-08-15** — *reckoning* · any tier
Escalating waves, narrated between them. **The reward for surviving is that he says
nothing** — so the last wave is followed by a `high_silence` line, or by literal
silence at low trust.
**Needs:** `VELDORA.pressure.send()` in a loop with a delay. Nothing new.
**Scale by tier:** low = 2 waves of 3; high = 5 waves of 6 with a miniboss last.

### 2. ICARUS ✅ **BUILT 2026-08-15** — *reckoning* · any tier
**Above y100 he sends fliers.** The one event that punishes going UP, and the only
one whose trigger is a coordinate.
**Needs:** a flying roster — phantoms, or Born in Chaos's winged entities. **Verify
ids at boot**, the spawner does this already.
🔑 *This is his myth made mechanical and should fire with the Icarus line.*

### 3. HOLLOW VICTORY ✅ **BUILT 2026-08-15** — *reckoning* · medium+
A full wave that **drops nothing, announced as such before it starts.**
**Needs:** a drop suppression flag on spawned mobs, or `EntityEvents.drops` cancelling
for entities tagged from this wave.
🔑 *The announcement is the entire event. An unannounced dropless wave is a bug report;
an announced one is a statement about why you fight.*

### 4. THE BROKEN RUNG ✅ **BUILT 2026-08-15** — *reckoning* · any tier
**Three of whatever killed you wait at your respawn.**
**Needs:** record the killer's entity type on death (`death_cost.js` already hooks
death), then spawn 3 on respawn. ⚠️ **Must respect the 75% floor** — you respawn at
full health, so this one is legal by construction, which is neat.

## The four that need one new mechanism each

### 5. FIRST BLOOD ✅ **BUILT 2026-08-15** — *demand* · all tiers
The next mob you strike gets **×3 health**. 60 seconds, or the wave arrives.
**Needs:** a one-shot flag on the next damaged entity + an attribute write. `power.js`
proves `modifyAttribute` works.

### 6. THE TITHE OF STEEL — *reckoning* · medium+
**Double durability loss for a day.** Fight with a ruined blade.
**Needs:** an item-damage hook. ⚠️ **Not in the instrument panel** — `ItemEvents` has
`destroyed`, not a damage-taken event. **Probe before designing.**

### 7. SHARPEN ✅ **BUILT 2026-08-15** — *bargain* · any tier ⭐ the clearest 2×2 case
Temporary damage buff; **spawns quadruple for its duration, stated up front.**
**Needs:** a potion effect + a timed pressure window. Both live.
🔑 *This is the one event that is unambiguously a TRADE, and it should use the ritual
so the price is named before it is paid — exactly like Salvage's.*

### 8. THE DUEL ✅ **BUILT 2026-08-15** — *reckoning* · high
**One named elite, no adds.** Flee and he taunts for a full day.
**Needs:** a single strong spawn with a custom name, suppression of other spawns for
the duration, and a flee-detection (distance from the spawn point over time).

## The four that need real design first

### 9. UNDERSTUDY — *reckoning* · high
**A mob mirrors your own gear and stats.**
**Needs:** reading player attributes and writing them onto a spawn, plus equipping it.
⚠️ Marked `[M]` in `23` as non-obvious. **The most technically ambitious of the twelve.**

### 10. THE WATCHER — *reckoning* · high
**He stands at range and does not attack. While he watches, everything else hits
harder.**
🚨 **This is the one casualty of retiring the stalker** (`34` §2e) — it genuinely
needs a persistent present entity. **Rework it as Harvest-adjacent, or as a brief
timed presence rather than a permanent one.**

### 11. THE MARK ✅ **BUILT 2026-08-15** — *demand* · medium+ ⭐ his signature
Already specified in **PART 4.5**. Name a rival champion of a hostile god, 1–2 days,
buff on success, **grumbling on failure and no punishment.**
**Needs:** the deadline on the world clock, a kill-attribution check, and the three
line pools — **which are already written and registered** (`mark_declare`,
`mark_success`, `mark_ignored`).
⚠️ **Three design questions open:** does the target know, can a player opt out, and
does the buff reward the kill or the attempt?

### 12. RUN. — *reckoning* · the Harvest
**Fires once, ever, immediately before the challenge.** Now that the Hunt is a
challenge rather than a collection (PART 8), it is **not a threat — it is the last
thing he says before the test begins.**
**Needs:** the Harvest rework, and a permanent one-shot flag so it can never repeat.

---

## Build order, if it is built

1. **Gauntlet** — proves the wave loop and the tier scaling with zero new mechanism.
2. **The Mark** — his signature, and its lines already exist.
3. **Icarus · Broken Rung · Hollow Victory** — cheap once the Gauntlet's plumbing is
   there.
4. **Sharpen** — the first true bargain, and the ritual is live.
5. Everything else, after the Harvest rework settles what The Watcher becomes.

---

# PART 11 — THE EVENT FRAMEWORK ✅ BUILT 2026-08-15

`godevents.js` is general, like everything else built today. A god registers events;
the framework owns **the cadence, the one-at-a-time lock, the cooldowns, the
announcement and the health floor.** It knows nothing about what an event does.

**An event registers:** `id` · `tiers` it may fire at · `hostile` · `cooldown` in
world days · `weight` · `run(server, player, tier)` returning true if it happened.

### The health floor lives HERE, not in Blade's file

`HEALTH = { blade: { floor: 0.75 } }` — hostile events need **≥75% hearts AND
hunger**. It sits in the framework because **it is a dial other gods want at the
other end**: Salvage opens exactly when you are dying. Same setting, opposite value.

⚠️ **Unreadable health is NOT "healthy enough."** A floor that stops guarding when it
cannot read is not a floor.

### Guards, each a failure this project already had

* **one at a time, globally** — two events on one champion is a bug report
* **never over a ritual scene**
* 🚨 **a `run()` returning false does NOT stamp the cooldown.** A failed event must
  not consume its own slot, or it silently never happens again. The Mark uses this:
  no rival online is *not* a failure of the event, it is nobody to hate today.
* **no world clock, no events** — and a stamp from the future is re-anchored, not
  clamped

### What shipped with it

**THE GAUNTLET** — waves scaled by tier: low 2×3, medium 3×4, **high 5×6 with the
Fallen Chaos Knight arriving alone as the last wave.** Announced before anything
spawns. **The reward for surviving is that he says nothing** — except at high trust,
where he permits himself one oblique line, which is the trust arc paying out.

**THE MARK** — names a rival champion of a hostile god, 2 world days, resolved by
kill attribution on `EntityEvents.death`. Reward is **Strength + Resistance for 30
seconds**: maintenance-grade and temporary, because he does not hand out power you
did not earn. **Expiry costs nothing but a line.**

⚠️ **Only online players are ever marked.** A deadline you cannot act on is a
punishment rather than a choice.

**`/events`** lists every event and **why each one is or is not eligible** — wrong
tier, below the floor, or on cooldown. **`/events fire <id>`** forces one, and
deliberately **still respects the health floor**, because a test that ignores the
floor tests the wrong thing.

---

# PART 12 — ALL TWELVE, BUILT 2026-08-15

| event | tiers | how it fires |
|---|---|---|
| **Gauntlet** | all | swept · waves scale 2×3 → 5×6, elite last at high |
| **Icarus** | all | swept · **guarded on `y >= 100`** |
| **Hollow Victory** | medium+ | swept · tagged wave, `EntityEvents.drops` cancels |
| **The Broken Rung** | all | ⭐ **reactive** — fires from `respawned`, not the sweep |
| **The Mark** | medium+ | swept · 2 world days, kill attribution, no penalty |

### Three things worth keeping from building them

**The framework gained a per-event `guard`** for Icarus, because *only above y100* is
a condition only Icarus cares about — **the framework must not learn what altitude
means to a god of falling.** ⚠️ A guard that throws is a **closed** guard.

**The Broken Rung is reactive, not swept.** It fires from `PlayerEvents.respawned` by
name, and the framework still applies its cooldown — so an event can be summoned by a
moment rather than waiting to be rolled. **That pattern is the one most of the
remaining twelve will want.**

**Hollow Victory needed the spawner to tag its wave.** `nbt` is now an option on
`wave()`, because **a mob you cannot tell apart from a natural one cannot be given
special rules later.** ⚠️ The drop suppression reads tags defensively and **leaves
drops alone if it cannot read them** — silently eating a player's loot is far worse
than an event that failed to be hollow.

### Remaining: 7 of 12

**First Blood · The Tithe of Steel** (⚠️ needs an item-damage probe) **· Sharpen**
(the first true bargain — should use the ritual) **· The Duel · Understudy ·
The Watcher** (needs the Harvest rework) **· Run.** (needs the Harvest rework)

## The second three

| event | tiers | shape |
|---|---|---|
| **Sharpen** | all | ⭐ **a BARGAIN, through the ritual** |
| **First Blood** | all | a demand — two-stage, and both outcomes cost |
| **The Duel** | **high only** | a reckoning, with the only lasting consequence he has |

**SHARPEN is the first event in the pack that is a genuine trade**, so it opens the
ritual and names its price before it is paid — Strength II for three minutes, and
everything within reach comes to see what changed.

🔑 **The difference from Salvage's trades is who is paid.** She takes a piece of you
and hands you something. **He hands you something and makes the world harder** — the
price is not paid to him, it is paid to whatever arrives. Same interface, opposite
economics, and that is the two gods in one mechanic.

**FIRST BLOOD is two-staged and both stages cost.** The next thing you strike gets
×3 health; strike nothing for sixty seconds and the wave arrives instead. You cannot
wait it out — *"You did not swing at anything. So I sent something to swing at you."*

**THE DUEL is high-trust only**, one named elite at 10–16 blocks, and fleeing past 64
blocks earns a taunt. ⚠️ **The taunt is the entire penalty** — the only lasting
consequence in his whole set is a line, which is correct for a god whose disappointment
never costs him anything.

## Remaining: 4 of 12

**The Tithe of Steel** — 🚨 **blocked, and now provably.** `ItemEvents` has no
damage-taken or durability event; the panel's list is `crafted · smelted · pickedUp ·
dropped · destroyed · foodEaten · canPickUp · entityInteracted · the clicks · tooltips`.
**It must be sampled** — read the held item's damage on a tick and add to it — rather
than hooked. Design before building.

**Understudy** — reading player attributes onto a spawn. The most technically
ambitious of the twelve.

**The Watcher · Run.** — both need the **Harvest rework** (`34` §2e), because both
depend on a present body and Blade's Harvest is becoming a challenge (PART 8).

---

# PART 13 — ✅ THE TWELVE ARE COMPLETE

**11 registered events + the Harvest.** `[events] framework LIVE - 11 events`,
`[blade] 137 fixed + 46 contextual + 616 combinatorial across 45 tags`.

| | event | tiers | shape |
|---|---|---|---|
| 1 | Gauntlet | all | reckoning · waves scale by trust |
| 2 | Icarus | all | reckoning · **guarded on y≥100** |
| 3 | The Duel | high | reckoning · fleeing earns only a taunt |
| 4 | First Blood | all | demand · **two-staged, both stages cost** |
| 5 | Blindfold | — | *folded into the Gauntlet's announce* |
| 6 | **The Tithe of Steel** | medium+ | reckoning · **sampled, not hooked** |
| 7 | Hollow Victory | medium+ | reckoning · tagged wave, drops cancelled |
| 8 | **The Watcher** | medium+ | reckoning · **a bounded presence** |
| 9 | **Understudy** | high | reckoning · attributes written at summon |
| 10 | The Broken Rung | all | reckoning · **reactive, on respawn** |
| 11 | Sharpen | all | ⭐ **bargain, through the ritual** |
| 12 | **Run.** | — | **the Harvest opener** (PART 8) |

## The three that finished it

**THE TITHE OF STEEL — sampled, because there is no hook.** `ItemEvents` has nothing
that fires when an item *takes* damage, only when it is destroyed. So it watches the
held item's damage each second and, when it rises by *d*, adds another *d*.

⚠️ **It never lands the killing blow.** The added damage is capped so the item always
survives at 1 durability — the player's own next swing breaks it. **Doubling someone's
wear is the event; reaching into their inventory and destroying an enchanted weapon is
a bug report wearing an event's name**, and the whole difference is who struck last.

**UNDERSTUDY writes attributes at SUMMON, not after.** A spawned entity is not
queryable in the tick it is created — the spawner learned that when its own
measurement read zero with four hounds standing in the ring. Setting them in the NBT
sidesteps the race. It mirrors health, damage, armour and your held weapon, and
**deliberately not your enchantments**: an Understudy swinging your own Sharpness V is
not a mirror, it is a punishment.

**THE WATCHER came back smaller, and that is why it works.** It was the one casualty
of retiring the stalker. The stalker was a **permanent** presence on a leash, and the
leash produced every entity bug in the project. This is a **bounded** one — it arrives,
watches for ninety seconds, and dies.

> **A presence with an end time is not a leash.**

While it watches it clears its own target **every sweep, not once** — `stalker.js`
proved a single clear is cosmetic, because the AI re-acquires between sweeps and
swings. And everything else within 32 blocks gets Strength.

---

# PART 14 — THE POLISH PASS, from live testing 2026-08-15

## 🚨 Fixed during the test

**The Harvest champion did not leave when the Harvest resolved.** Ethan lost, the
closing line played — and it kept killing him. `resolve()` now removes whatever the
Harvest sent, **win or lose, before the closing line**, so the last thing that happens
is the god speaking rather than the actor swinging. **Losing is a setback, not a
lockout**, and a defeated champion that stays turns a graduation into a death loop.

*Generalised, not special-cased: a handler declares its `tag` and `harvest.js` clears
it — every god's Harvest will send something and every one will need this.*

## ✅ The counter fired — the riskiest untested thing works

`[counter] Rehykt blade 0 -> 1 (slain)`, four kills counted. **`isMonster()` took three
attempts in `the_hunt.js`** — `getMobCategory()` exists on nothing, and `getCategory()`
threw on every kill because Rhino reads a bare Java method reference as falsy — so
calling it directly was the one unverified assumption in the whole counter layer.
**And the Gauntlet fired on its own from the sweep**, unprompted.

## 🚨 A pre-existing bug the test surfaced

**`telemetry.js` has been failing on EVERY player death**, silently:

```
telemetry.js#135: TypeError: redeclaration of var p
```

A `const` inside a nested block of a repeatedly-invoked callback — **the exact trap
`paths.js` documents in its own header.** So `player.death` has never emitted for as
long as that line has existed, and **the DM's memory has a hole in it precisely where
deaths should be.** Fixed.

*It only surfaced because a Harvest death made me read the error count on a log I was
already looking at. Nothing about it was ever going to announce itself.*

## Queued for the pass

### The loss line lands BEFORE the death message
`harvest_lost` fires from the death hook, so it prints above *"Rehykt was slain by…"*
and reads as commentary delivered slightly too early. **Delay the closing lines a few
ticks** so the god speaks after the world has finished saying what happened.

### ⭐ A better introduction
*Ethan: **"we probably need to add to the polish pass a better intro."*** The
introduction is the oldest writing in the project — it predates the five gods, the
champions, the actor reframe and the trust arc. **It is the first thing a player ever
reads and it no longer knows what the world is.**

### The whispers still describe a stalker that no longer exists
`whispers.js` says *"The helm turns toward you. It does not turn away"* — **and
nothing is turning any more.** Fired live during the Harvest test. They escalate off
`regard`, so they work; they are simply describing a body that was retired. **Rewrite
against a god who is only ever a voice.**

### `high_silence` is too thin
Eight lines and three repeats inside eight rolls. It is the pool a champion earns and
should feel rarest — **it needs the most lines, not the fewest.** Same likely true of
`mark_success` (six).

### `push` and `lore` were never rewritten
They are first-brief lines, written when the character was contemptuous rather than
invested. **Check them against the drill-sergeant register.**

### ✅ What already reads right
`/events` — tier, health floor, and a per-event reason for every hold, including
*"its own condition is not met"* for Icarus. `/idle_test` — contexts and weights, and
the spider line landed. **The Harvest's shape worked**: the announcement, `Run.`,
the arrival, the loss line, and the trust hit.

---

# PART 15 — ✅ THE POLISH PASS IS BUILT *(2026-08-15, Ethan's own writing)*

Every item queued in PART 14 is closed, and Ethan wrote the content himself. What
follows is what shipped and — more usefully — **the three things this pass taught
that will apply to the other four gods.**

## ⭐ THE SPEAKER FOR THE GODDESS OF DEATH — `deep_speaker.js`

> Ethan: *"the gods cannot see you when you descend after a certain level. Instead
> dialogue is replaced by the goddess of death's speaker."*
> *"She is the speaker for the goddess of death. She watches endlessly these fel
> corridors. It is she whom which the horrors of this land are born."*

**This is the best mechanic in the project and it is worth saying why.** Every other
system in the pack makes the world *louder* as it gets more dangerous — more spawns,
more events, more voice. This one makes **your god go silent.**

Below `CUTOFF_Y = -40` the patron cannot reach you. The voice that has spent the whole
game arming you, testing you and grudgingly approving of you is simply **gone**, and
something else is talking. It costs nothing to build and it changes what descending
*means*: you are not going somewhere dangerous, you are going somewhere **out of
earshot**.

It also hands the strata a moral gradient the depth loop never had. She tells you your
own god was once a servant of hers — and the deeper you go, the less able he is to
answer that.

| | |
|---|---|
| colour | grey `§7` — **she is not a god and must not look like one** |
| register | whole sentences, patient, asks nothing. The gods speak in fragments and demands |
| lines | 14 across `intro` / `common` / `abandoned` |
| introduction | fires **exactly once**, via `K_MET`. The first thing she says is never a random line |
| `abandoned` | she notices what his silence means before you do — *"Call for him if you like. I will wait."* |

`idle.js` defers to her and **returns silence if she has nothing**, rather than letting
him talk through her. The cutoff is a hard wall, not a preference.

**For the other four gods this is free.** She is registered per-god-agnostic; any
patron's idle speech defers below the cutoff without knowing why.

## THE HARVEST IS A CUTSCENE, NOT A CHAT POOL

His seven opening lines run through **the ritual** — blind, rooted, staggered — because
they are the only time in the game he talks about himself, and a player has to be held
still to read them. He had a champion once; the man is gone; his end was merciful; he
does not explain further.

> ⚠️ **TIMED OFF `ritual.js`'s OWN CONSTANTS**, not off a number that looked right.
> A no-options scene releases at exactly `LEAD 20 + (n × GAP 50) + TAIL 40`. The heavy
> silence lands **40t before release** (inside the dark, where it belongs) and *"Face
> him and win."* **40t after it**. Hard-coding `420` would have put Ethan's marked beat
> *after* the world came back, which is the one thing it must not do.

## ⭐ NARRATION IS NOW A LINE TYPE

Ethan's new introduction needed something the scene system did not have. **A line
beginning with `*` is narration** — grey italic — and everything else is the god
speaking, bold red. His own convention, taken from the way he wrote *"\*You feel a
heavy silence"* in the Harvest.

**Why it matters more than a colour change:** every other line in this project is a
*voice*, and a voice cannot say *"You are afraid"* without telling the player how to
feel. Narration can, because it is not coming from anyone. It is also the only way the
crimson-eyed figure can be **seen** — the gods have been voice-only since the actor
reframe, and this is the single exception the scene system gets. He is visible for
exactly one line, then he speaks, then he is a voice again for the rest of the game.

✅ **It also fixed a lie in the old scene.** *"Everything you carried in — hand it
over"* described an inventory strip **that has never existed**. The toll is XP levels,
and `paths.js` already reports it. The new closing claims nothing the code does not do.

## THE LINES

| pool | was | now |
|---|---|---|
| `high_silence` | 8 | **16** — the pool a champion *earns* should feel the rarest |
| `mark_success` | 6 | **9** |
| `push` + `lore` | separate | **merged** into `loc_above` / `loc_below` (Ethan: *"for the sake of avoiding dialogue bloat"*) |
| `rare_loc_above` | — | **6, rolled at 15%** |
| `whispers.js` | live | **RETIRED** behind a flag — it described a body that no longer exists |

⭐ **The rare pool is where he is a person.** He had a name once. He is a prisoner here
too. He feels attachment to the spider he claims to despise. He barely remembers the
sun. **None of it should ever be common enough to become wallpaper** — that is the
entire argument for the rarity roll, and it is the pattern the other four gods should
copy.

Harvest closings are **delayed 20t** so they land after *"was slain by…"* rather than
above it. Ethan caught this live: *"the loss line lands BEFORE the death message."*

## 🚨 TWO HAZARDS CLOSED IN THE SAME PASS

**`gen_scenes.py` consumed its own splice marker.** A second run refused with
*"already generated?"*, so the doc quietly stopped being the source of truth — **which
is how Blade's scene drifted in the first place.** It now splices between two markers
that survive, and it is narration-aware. `docs/28` is authoritative again.

**The deferred-arrival lock.** `harvestArrive` now returns `true` *before* the champion
spawns, so `harvest.js` has already stamped the Harvest as begun. If placement then
fails, the player is locked in a Harvest with nothing to fight — exactly the state
`harvest.js` refuses to create synchronously. The deferred spawn checks `placed === 0`
and **releases the lock so the phase sweep retries.** A Harvest that did not arrive did
not happen.

## Live at 18:47

```
[voice]   VELDORA.voice published OK - 2 god(s), 44 tag(s), 810 possible lines
[blade]   148 fixed + 32 contextual + 616 combinatorial, across 41 tags
[speaker] the Speaker waits below y-40 - 14 lines, grey
[intro]   VELDORA.intro published OK - 6 scenes, 12 silence lines
[whispers] RETIRED - idle.js speaks for the gods now.
0 real error(s)
```

## What is still open

- **PART 9** — retiring the release mechanic. Untouched; still Ethan's call.
- **The drop-curve saturation retune** — his number, not chosen yet.
- **The absence route** — the third exit alongside the fall and the release.
- **The other four gods.** Blade is the template now: a voice, an actor it sends, a
  contextual idle pool with a rare sibling, and a cutscene for the one moment that
  earns one.

---

# PART 16 — ⭐ THE CONFESSION *(Ethan's writing, 2026-08-15)*

**The rarest thing in the game, and the only one that reorganises everything above
it.** Four stanzas, staged one after another, at the lowest level of the world.

## What it does to the rest of the project

The Harvest cutscene has Blade say this, and it has been in the game for hours:

> *Centuries ago I had a champion. A man who stood by my side above all else.*
> *He is long since gone.*
> ***His end merciful.***

**She is the mercy.** Gregor was Blade's champion, she was meant to protect him, she
made a choice, and she has been apologising to a god who cannot hear her ever since.

> 🚨 **NOTHING IN THE CODE CONNECTS THE TWO SCENES.** There is no flag, no trigger,
> no callback. The player connects them, or does not. **That is precisely why it must
> stay rare and must never repeat** — it is a thing you *found* at the bottom of the
> world, not a thing the game told you. A repeatable *"Gregor, I am sorry"* would be
> wallpaper within a week, and it would take the Harvest down with it.

She also stops being the goddess of death's mouthpiece for the length of it. Her
whole register elsewhere is patient, complete, formal sentences — the deliberate
opposite of the gods' fragments. **The confession is her failing to finish a
sentence four times in a row**, and it works *because* of how composed she is
everywhere else.

## Where and how often

| | |
|---|---|
| depth | **y ≤ −120** — the Sealed Floor, the number `/help` already promises |
| chance | **10%** per 60s sweep, so **~10 real minutes SPENT down there** |
| repeat | **never.** Once per champion, ever |
| requires | she must have introduced herself first — this is not the first thing she says |
| length | 16 lines, 4 stanzas, ~39s blind and rooted |

> ⚠️ **IT RIDES ITS OWN SWEEP, NOT THE IDLE COOLDOWN.** The god's idle speech is
> capped at once per *world day*. Hanging the confession off that would have meant
> roughly **ten in-game days spent at the floor** to see it — which is not rare, it
> is unreachable. Its own sweep turns the cost into an *expedition*, which is the
> thing actually worth rewarding.

> 🚨 **The once-ever flag is stamped only AFTER `ritual.begin` returns true.** Burning
> it on a refused scene would silently cost a player the biggest beat in the game and
> there would be no way to tell it had happened.

## The staging

Ethan: *"they should be staged in a way that they happen one after another."* A blank
line is a beat. **Two blanks before the last stanza** — *"Gregor, I am sorry"* is the
only line in the scene she says to someone who is not you, and it needs the room.

Delivered through `ritual.js`, so she holds you blind, rooted, invisible and
continuously de-targeted for the whole 39 seconds. **It is the only cutscene in the
game that is not a god demanding something.**

*One word changed from Ethan's draft: "Tell im sorry" → "Tell him I'm sorry", read as
a typo. Everything else, including every ellipsis and the repetition in "None of this,
none of what happened", is verbatim — the halting is the performance.*

## ⚠️ The cutoff was wrong, and a stale doc is why

I set the Speaker's cutoff to **−40** off `15-LORE.md`, which says the Sealed Floor is
*"minus sixty to the bottom"*. **That doc predates the world extension** — the
overworld floor is **−128**, not −64 (`tools/make_depth_datapack.py`). So −40 was a
third of the way down, inside the old diggings, when Ethan had asked for *"low or
almost lowest"*.

Corrected to **−64** (where the deep works begin), and `docs/15` is fixed with a note
on what the staleness cost. The numbers now match `/help`, which is the only version a
player can check.

## 🚨 Three collision bugs the confession exposed

**The Speaker was jumping the queue.** Her block in `idle.js` sat *above* both the
scene guard and the daily cooldown — so she ignored the cooldown (stamping it without
ever reading it) and **could talk straight over a running cutscene.** Below the cutoff
she would have spoken every ~17 minutes and could have landed a line in the middle of
the Harvest. Both guards now gate every voice, hers included.

**The Harvest pushed through running scenes.** The confession is **the first
autonomous ritual in the game** — every earlier one was player-initiated, so a
collision was not really possible. `harvestArrive` now refuses and returns `false`, so
the phase sweep retries.

**`deep_speaker`'s `ServerEvents.loaded` took no `event` parameter**, so `event.server`
threw and the confession never armed — while the line *before* the throw had already
printed *"the Speaker waits below y-64"*, which read as success.

## 🚨 …and that last one exposed a much bigger problem

**`logq errors` has never been able to see a KubeJS script error.** KubeJS logs script
failures under `KubeJS Server/` with **no level at all**, and `cmd_errors` required
`/ERROR` or `/FATAL`. It printed *"0 real error(s)"* while `deep_speaker.js` was dying.

**The tool written to prevent searches that cannot match had one inside it.** Fixed:
script-failure signatures now count whatever level they claim and are tagged `SCRIPT`.
Re-scanning every archived log:

```
325 real errors, 321 of them SCRIPT errors, 7 distinct signatures
```

| signature | count | last seen | status |
|---|---|---|---|
| `telemetry.js#123` / `#135` / `#318` | 269 | 08-15 18:08 | ✅ fixed today (`f0acf84`) |
| `EntityEvents.death` → **java.lang.NullPointerException** | 49 | 08-12 19:01 | ⏸️ **watch** — has not fired once during today's death-heavy testing |
| `withNBT` build probe | 2 | 08-13 | build-time only |
| `deep_speaker.js#272` | 1 | 08-15 18:54 | ✅ fixed above |

## Testing it

```
/speaker            where you are, whether you are eligible, and what she says
/speaker confess    force the whole cutscene right now, at any depth
/speaker reset      forget you entirely - introduction and confession both again
```

## Still open

- **Her register after the confession.** She currently goes straight back to *"your
  end shall be swift"* as though nothing happened. That wants a small `after` pool —
  **but it is Ethan's writing, not mine to invent.**
- The `EntityEvents.death` NPE above.
- PART 9, the release mechanic; the drop-curve retune; the absence route; four gods.
