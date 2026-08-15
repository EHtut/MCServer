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
**His actor:** a *pantheon* — cast today as `born_in_chaos_v1:fallen_chaos_knight`,
**and now recastable on looks alone** (`23` §4).

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
