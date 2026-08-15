# THE PATH SYSTEM — the master design

*Consolidated 2026-08-11. Supersedes and folds in `21-THE-SIX-ROLES.md` and
`22-THE-PATRONS.md`. Live state of what actually exists is
`20-AUDIT-2026-08-11.md`. **Nothing in this document is built.***

---

# PART I — WHY

## 1. The problem

Ethan: *"The biggest thing I admit we are still targeting is funness. My friends
and me have a habit of not exploring, so I think the answer is we need things to
happen to us."*

Three facts sharpen it, all established on 2026-08-11:

**a) The "things happen to you" layer already existed and was dead.** The Harvest
was mathematically unreachable. The Hunt sent nothing 75% of the time while
logging success — three of its four hunter mods are not installed. The Helper was
culled by its own sweep about a second after arriving and had never once helped.
All three were built to push at the player; all three were silently broken. The
group has been playing a pure find-it pack without knowing it.

**b) 🚨 DEATH COSTS NOTHING.** `keepInventory = true` — which in vanilla keeps
**experience as well as items** — and instant respawn returns you to your bed in
0.75s. No gear loss, no XP loss, not even the walk back. The documented design in
`instant_respawn.js` says *"death costs the run, never the base,"* with Corpse
holding your gear where you fell. **That is not happening**: with `keepInventory`
on there is no corpse. Ethan died 20 times on 2026-08-11 and it cost him nothing,
which is exactly why it read as annoying rather than tense.

**c) Ordinary-death XP loss was never implemented.** Ethan: *"the lose xp on death
was never implemented."* Verified — the only XP writer in the entire codebase is
`wipeXp`, called from exactly one place, the Harvest loss. The original design's
"roughly 5 levels on death" does not exist.

**A world cannot feel dangerous while dying is free.** Fixing (b) and (c) is
probably a bigger lever on "funness" than any new content.

## 2. The law everything obeys

> **Difficulty is good when it is LEGIBLE and CHOSEN. It is bad when it is
> invisible.**

Ethan: *"a harder world isn't necessarily a bad one?"* — correct. What made
2026-08-11 miserable was not scarce iron. It was **132 monster kills per iron
ingot with no signal anything was wrong**, on top of a broken claim paying
literally nothing while looking healthy. That is not difficulty, it is opacity.

**Every event announces itself, and every cost is named before it is paid.** A
raid you saw coming and chose to provoke is content. The same raid unannounced is
a bug report.

---

# PART II — THE STRUCTURE

## 3. The trinity

Three pairs. Each has a monopoly; each monopoly is paid for.

| pair | paths | monopoly | cost |
|---|---|---|---|
| **Combat** | Blade, Salvage | the only ones who can fight the dark | **they quadruple mob spawns** |
| **Mercantile** | Forge, Wall | the only ones with resources to thrive | **almost no combat ability** |
| **Explorer** | Art, Crown | the only ones who can last alone | **loot-dependent for anything specialised** |

Ethan: *"Each fills a role."* Nobody is self-sufficient, nobody is redundant.
Blade cuts down the horde with a weapon Forge made, inside a pocket Wall holds
open, using a component Art walked out to find.

## 4. The patrons ARE the stalkers

Ethan: *"these patrons btw are the stalkers. same beings im just using different
terminology for them."*

**One being.** The thing that shadows you at 100 blocks, steps in when you are
nearly dead, demands and bargains as you fatten, and finally comes to collect — is
the same thing whose voice you hear. "Patron" names its role; the casting from
`18-THE-STALKERS.md` is its body.

This makes The Mother far darker: she is not a distant benefactor asking to come
closer. **She is already outside.**

## 5. Delivery is CHAT — bold red, nothing else

Ethan: *"all the events need to be bolded in red over chat. yes makes it less...
interactive but the patrons should still stay distant stalkers who whisper into
your ear."*

No dialogue GUIs, no trade screens, no approachable NPC. The entity stays at
range and out of reach; the relationship happens in text. It also satisfies §2
for free — a red line in chat is the most legible announcement there is.

## 6. Born in Chaos stays — the mod-swap question is CLOSED

Ethan floated dropping Born in Chaos entirely because its mobs are hardcoded
hostile. The diagnosis was right, and our own code proves it — we cancel the
damage on *every swing* rather than stopping the attack:

> *"A Companion is still a Born in Chaos HOSTILE. Left alone its own AI acquires
> the nearest player - which is its owner - and it mauls the person it is supposed
> to be protecting. Clearing its target on a 2s sweep is cosmetic; between sweeps
> its AI re-acquires and swings."* — `stalker.js`

**But §4 and §5 dissolve it.** Hostility only bit us because we asked a Monster to
act like a companion standing beside you. If the stalker is *always distant* and
every interaction is *chat*, its AI never gets to matter — hostility becomes
atmosphere. **No swap.** The castings keep their faces, which was the point.

Fix instead: hold the leash. `DIST_NEAR = 12` / `DIST_FAR = 100` /
`keepDistance()` already exist and need enforcing properly, with the damage veto
demoted from mechanism to backstop.

*Investigated and rejected: Goety has a real ownership model (`setTrueOwner`,
`OwnableEntity`, `getOwnerUUID`, `setBoundPos`, 64 servants). Correct substrate
for a companion-shaped design, wrong one for this, and it would cost every casting
its appearance. Recorded so nobody re-derives it.*

## 7. The coefficients — the whole design in one table

Notoriety is ONE number driving THREE consumers: drop rate (`paths.js`
`dropChanceFor`), the power curve (`power.js` `CURVE`), and the stalker phase
(`stalker.js` `resolvePhase`). Every identity below is per-path weights on numbers
that already exist. **This is the only structural change the design needs.**

**✅ BUILT AND LIVE 2026-08-15** — `coefficients.js`, `VELDORA.coeff`. Five paths, not
six: Crown merged into Wall (`35` §6, Ethan 2026-08-15) and **Wall stays mercantile
because Wall is about building.**

| path | role | spawns | power | drops | phase | alone |
|---|---|---|---|---|---|---|
| blade | combat | **×4** | ×3 | ×0.6 | ×2 | poor |
| salvage | combat | **×4** | ×2.5 | ×0.8 + guns/ammo | ×1.5 | poor |
| forge | mercantile | ×1 | **×0.4** | **×3** | ×1 | worst |
| wall | mercantile | ×1.5 + raids | ×0.6 | ×2.5 + quests | ×1 | safe at home, supplies the server |
| art | explorer | ×1.5 | ×1.2 | ×1 + maps | ×1 | **good** |

*`crown` is aliased to `wall` in the table until the world reset removes the key from
`paths.js`. A live Crown walker gets Wall's numbers rather than falling through to
neutral — which would look exactly like "no path" and be invisible.*

⚠️ **Blade's drop coefficient goes DOWN.** All three consumers read the same
number, so tripling XP would give Blade faster phases *and* more drops *and* more
power — strictly the best path. The challenger does not loot; it fights, and
somebody else arms it. That one coefficient is what makes Blade need Forge.

## 7a. ⚠️ `spawns` is not a weighting — it is a mechanism that does not exist

The other three axes multiply numbers that are already there. `spawns` does not, and
the build found out why:

> **E0 P9 proved `checkSpawn` fires and is CANCELLABLE. Cancelling can only ever
> implement a coefficient BELOW 1.** You cannot cancel your way to *more* mobs, and
> Blade's headline number is **×4**.

A coefficient above 1 needs an **active spawner** near the player — the mechanism
`the_hunt.js` already has (`SPAWN_MIN`/`SPAWN_MAX` ring placement). That is a build,
not a multiply.

So the `spawns` column is **live in the table and read by nothing.** `VELDORA.coeff`
serves it the moment a consumer exists, `/path coefficients` prints it marked
**INERT**, and the boot log says so out loud — because a gate with no live consumer
is a bug, not a soak.

## 7b. Subclasses stack half the DEVIATION, not half the value

Ethan, 2026-08-15: subclass spawn costs stack at 50%. The naive reading —
`primary + sub × 0.5` — is wrong: a subclass whose coefficient is a harmless ×1 would
still add +0.5, so taking *any* subclass would make you more hunted. Coefficients are
multipliers around a neutral 1.0, so what stacks is the deviation:

```
effective = 1 + (primary − 1) + (sub − 1) × 0.5
```

| build | axis | result |
|---|---|---|
| blade alone | spawns | ×4 — unchanged |
| blade + a neutral subclass | spawns | ×4 — a harmless subclass stays harmless |
| blade + salvage | spawns | **×5.5** — the double weather system |
| forge + blade | drops | ×2.8 — a fighter dilutes the merchant |

**Costs soften with players online** (the 2am decision), rewards never do:
1 player ×1.00 · 2 ×0.87 · 3 ×0.77 · 4 ×0.69. Applied to `spawns` only.

## 8. Subclasses — OPEN

Ethan: *"there will never be 6 players tbh."* Real roster:

| player | primary | role |
|---|---|---|
| Ethan (Rehykt) | **forge** | mercantile |
| his brother (Lehykt) | **blade** | combat |
| Ben (j0nesyboi223) | **salvage** | combat |
| Taylor (ClickedIce29313), sometimes | **art** | explorer |

One-walker-per-path was designed for six players and now only orphans content.
**Exclusivity is retired for subclasses.** Any primary, any secondary.

* Grants: **the loot pool**, **some events**, **half the buff effects**.
* Never grants: **the stalker**, or a second Harvest. One creature per player,
  from the primary, always.

Accepted deliberately: someone can take blade+salvage, become a double weather
system with nothing to craft with, and feel it within two nights. That is the
interdependence working — discovered rather than enforced.

## 9. The two things most likely to break it

### 9a. The spawn cost is SHARED — make it loud
Spawns happen in the world, not to a player. Blade quadrupling spawns hits the
Forge walker beside them, the weakest character in the game. Left implicit that is
someone dying repeatedly in another player's weather and resenting it.

Made explicit it is the best identity in the design: **the combat classes are
dangerous to be near.** You do not want the Blade lounging at base after dark. It
gives Wall's pocket an exact job — the only place the storm does not reach — and
gives the group a reason to separate and reconvene. The Blade walker should *know*
they are a weather system, and so should everyone else.

### 9b. The 2am problem — ✅ DECIDED
Four friends do not log on together. A Forge player alone is rich, helpless, and
unescorted. **Scale the costs by players online.** Ethan: *"we scale and balance
it."* One multiplier, and it is honest.

---

# PART III — THE PATRONS

Ethan's seeds are canon. Lines marked *draft* are mine and **should be replaced
with his** — the standing tone ruling (`18-THE-STALKERS.md`) is that the whispers
are Ethan's own writing, and the absurdist register is deliberate: *"more loveable
than just outright dangerous."*

### Blade — The Challenger · `fallen_chaos_knight` · he
> *"Hostile, antagonistic. He tests the player almost repeatedly."*

Second person, imperative, contemptuous. **Short.** Never explains, never
congratulates; his highest praise is silence. **Canon:**

> *"Fall"* · *"You reach for heights you will never attain"* ·
> *"For It was Icarus who flew too close to the sun. You will share his fate"* ·
> *"Run."*

`"Run."` is reserved — it fires **once**, immediately before the Harvest.

### Salvage — The Hound · `dire_hound_leader` · she
> *"Sneaky, bartering. Trade with her if you dare."*

Coaxing, familiar, never quite honest. Calls you *friend*. **Canon:**

> *"Lets do a deal."*
> *"Give me your hunger, and i'll give you life."*
> *"Give me your levels and i shall grant you ammo."*
> *"Give me your sight and i will grant you the power to kill."*

### Forge — The Thief · `krampus` · he
> *"Angry, greedy. He wants everything you have and everything you will have."*

Demanding, ungrateful, escalating. Never satisfied, never thanks you, treats every
delivery as overdue. The only patron who takes **future** production. *Draft:*
*"Late." · "This was owed yesterday. Tomorrow you owe more."*

### Wall — The Mother · `mother_spider` · she
> *"Codependent, needy. She wants to be closer and closer and closer until there
> isn't anything between you two."*

Intimate, wounded, escalating. Speaks in **we** and **us**. Every gift is a tether;
every request is smaller than the last until suddenly it isn't. The most
unsettling of the six because she is never hostile. *Draft:* *"You built a door.
Was it for me?" · "Take out one wall. Just one." · "There. Nothing between us."*

### Crown — The False King · `missioner` · he
> *"Arrogant but cooperative. He doesn't respect your claim but he will use you."*

Imperious, transactional, complimentary in a way that insults. **Alone among the
six he accepts a refusal** — and respects it. *Draft:* *"Your claim is noted. It is
not recognised." · "Refuse, then. I keep count."*

### Art — The Nightmare · `nightmare_stalker` · she
> *"She wants you to sleep. She wants you to sleep. Find her pages. Find what she
> wants you to know."*

Fragmentary, repetitive, dreamlike. **She repeats herself** — the doubling in the
seed is the voice, not a typo, and must survive into the implementation. Never
threatens; the only patron who gives without asking. *Draft:* *"Sleep." · "You did
not sleep." · "There is a page. There is a page."*

Her **pages** obey the standing lore ruling: *horribly simple, a single line.*

---

# PART IV — THE ATTENTION RITUAL

Ethan: *"When a trade is proposed they become slowed to max, and invisible and the
blindness effect. Then a pick a trade. They have 30 seconds, not picking a trade
causes them nausea and removes the other affects."*

**The effects ARE the interface.** No GUI, no NPC — and it still becomes a *place*
you are pulled into. Pinned, blind, unseen: she takes you aside. It works because
**blindness does not obscure the chat overlay**: the world goes black and her text
stays perfectly legible.

| beat | effect | meaning |
|---|---|---|
| opened | Slowness (max) | you cannot walk away |
| opened | Blindness | the world goes; only her words stay |
| opened | Invisibility | the world cannot see you either — you are *aside* |
| 30s | the offer, red chat | clickable, one line per option |
| declined / expired | Nausea, effects cleared | she is annoyed you wasted her time |

**This is a general primitive, not a Salvage feature.** The Mother asking you to
take out a wall, blind and rooted while she waits. The False King issuing a levy
you may refuse. Build it once, as the "a patron has your attention" mechanism.

### Refinements
1. **Armour still renders while invisible** — a geared player is not hidden. Also
   clear nearby mobs' targets when the ritual opens; `stalker.js` already has the
   `setTarget` machinery.
2. **Selection is clickable chat** (`clickEvent: run_command`). Chat-only, no GUI,
   and it works while blind — otherwise a blinded player types `/trade 2` by feel.
3. **Decline-nausea stays SHORT** (~3–5s, amp 1). Ethan asked the same day to tone
   the whisper nausea down; a long penalty reintroduces it by the back door.
4. **Logging off mid-ritual must clear the effects on login**, or a player returns
   permanently blind and rooted — the exact shape of the respawn bugs in `20`.

### ✅ DECIDED — she opens it at the WORST times
Ethan: *"yes she and she does it at the worst times too. low on ammo. about to
die. trade. Mobs stop attacking, the world goes back."*

Mid-combat is **confirmed**, and the mob-detarget in refinement 1 is what makes it
survivable rather than a death sentence: the world stops, and the only thing left
is her offer. This is *"trade with her if you dare"* in its purest form.

---

# PART V — SALVAGE'S ECONOMY: THE BODY FOR POWER

She does not want your gold. She wants **pieces of you.** Ethan's three offers:

| she takes | she gives | note |
|---|---|---|
| **your hunger** | life (health) | cheapest, earliest, most repeatable |
| **your levels** | ammo | directly lowers notoriety — the ONLY player-chosen brake in the system |
| **your sight** | the power to kill | blindness persists **up to 5 minutes** after the trade — you walk out still blind, holding something that kills better |

Three properties worth preserving:

* **Every price is a live resource, not an inventory item.** You cannot stockpile
  for her; you pay out of your body.
* **"Your levels" is load-bearing.** Notoriety is `max(xpLevel, days × rate)`, so
  trading levels away is the only thing a player can *choose* to do to slow their
  march toward the Harvest. It buys survival now at the cost of the endgame later,
  which is the whole path in one line.
* **The reward must be VISIBLE.** Ethan, 2026-08-15, having taken the trade:
  *"instead of a flat buff we should use strength and speed effects instead so the
  player can see what they traded."* The first build multiplied the E3 `power` axis,
  which is invisible — you paid five minutes of blindness for a number you could only
  find by typing `/power`. **That is the legibility law failing at the exact moment it
  matters**, the moment you are deciding whether the price was worth it. It now grants
  **Strength II + Speed**, which sit in the HUD and announce themselves. *Speed while
  blind is deliberate: she gives you power you cannot steer.*

* **"Your sight" follows you out of the room.** Ethan: *"Sight should be a
  temporary modifier that lasts up to 5 minutes."* Every other cost here resolves
  when the ritual closes; this one keeps running while you fight with it. Five
  minutes is long enough to be a real handicap and short enough that it is a
  decision rather than a punishment.

Every trade still raises the **debt counter**, and the debt is what calls the raid.

## ⭐ The debt generalises: ONE COUNTER PER PATRON

*Ethan, 2026-08-15: **"it'd probably work better if we gave a new counter for all of
these patrons."*** **Adopted — build E6's debt as the first instance of this, not as
a Salvage special case.**

Today everything keys off **notoriety**, one number shared by all six patrons, and
that has a specific consequence the design already noticed: *"trading levels away is
the only thing a player can choose to do to slow their march"* — because levels are
the only input to notoriety a player controls. **That is a symptom of one shared
counter, not a feature.**

A per-patron counter fixes several things at once:

| | shared notoriety (today) | per-patron counter |
|---|---|---|
| what it measures | how fat you are, globally | **what you owe THIS patron** |
| Salvage's debt | a bolt-on second number | just this patron's counter |
| Forge's quota | another bolt-on | the same counter, named differently |
| a subclass | muddies one number | its own counter at half weight |
| tuning | one curve for six characters | each patron escalates on its own terms |

**It also makes the E3 coefficients honest.** `phase` currently scales a *shared*
number, so Blade's ×2 accelerates a counter that Forge is also feeding. With one
counter each, `phase` scales the thing that patron actually owns.

**Notoriety does not die** — it stays the global "how ripe are you" that drives the
Harvest and the power curve. The per-patron counter is what each character *wants*
from you, which is exactly how the twelve events per patron are already written.

⚠️ **The counter must persist as a WORLD DAY, never `tickCount`** — the rule E2d and
E6 already carry. And "could not read the counter" must never return 0; that is the
`dropChanceFor` lesson, and a debt that silently reads zero cancels every raid.

---

# PART V.5 — ⭐ THE TRADE IS THE UNIVERSAL PATRON INTERFACE

*Ethan, 2026-08-15, after E6 tested clean: **"this trade system is perfect for
literally all of the patrons. We can integrate these into events."***

**Adopted.** The bargain was designed as Salvage's economy and it is not one. It is
the shape every patron already wanted:

> **ritual + named options + a per-patron counter = a patron talking to you.**

Reading PART VI back against it, most of the 72 events are already trades wearing
other words:

| event | is really |
|---|---|
| **Blade** — *Sharpen*: a damage buff, spawns quadruple for its duration, **stated up front** | a trade. Power for danger, price named. |
| **Blade** — *The Tithe of Steel*: double durability loss for a day | a trade you did not get to refuse |
| **Wall** — *"Take out one wall. Just one."* | an offer, and the ritual is how she asks |
| **Forge** — a quota with a deadline | an offer with a clock, compounding on a miss |
| **Salvage** — *The Better Offer*: she buys something you need, **refusing raises regard** | a trade whose refusal is the content |
| **Art** — *"the only patron who gives without asking"* | the same interface, zero-cost |

**What this collapses.** Six patrons × twelve events was reading as 72 bespoke
builds. Most are the same three pieces with different words, different numbers, and a
different counter — which is why the per-patron counter landed first, and why it
mattered that it was built general rather than as Salvage's debt.

**What stays bespoke:** the events that are genuinely mechanisms rather than offers —
Blade's waves and *Understudy* (a mob mirroring your gear), Salvage's *Interest*
raid, Art's pages. Those need the **spawner**, not the ritual.

⚠️ **The counter is what keeps them distinct.** If every patron uses one interface,
the thing that makes Blade not-Forge is entirely in the numbers: what they ask for,
what they pay, how fast their counter climbs, and what it calls down. That is E3 and
`counters.js`, both live.

# PART V.6 — ⭐ THE PLAYER SHOULD NOT BE TYPING COMMANDS

*Ethan, 2026-08-15: **"going forwards i want the player to actually use commands as
little as possible."***

**Adopted as a standing rule.** The distinction that makes it buildable:

| | |
|---|---|
| **commands to ACT** | must disappear. Taking a path, opening a trade, triggering an event. |
| **commands to LOOK** | stay. `/path`, `/counters`, `/path coefficients`, `/notoriety`. |

That is not a compromise — it is **the legibility law** already written into this
design. A number that acts on you is a number you can read. Reading is not playing;
typing `/trade_test` to be offered a bargain is.

### What this makes real work, not polish

* 🚨 **E6 is half-built by this standard.** The trades work; *she* does not open
  them. `23` PART V already says she opens **at the worst times** — mid-combat, low
  health, just after a death — and that half does not exist. **`/trade_test` is a
  test harness, not the feature.**
* **Taking a path must become `33` — being chosen.** `/path blade` is the largest
  act-command in the game, and it already makes every *"you already reached for it"*
  line literally false.
* **Events must fire on their own**, which is what PART VI always meant.

**Corollary:** every admin `_test` command stays, and stays admin. They are how we
prove a thing works without waiting for it — `/trade_test`, `/fall_test`,
`/whisper_test`, `/ritual test`. The rule is about the *player's* hands.

# PART VI — THE EVENTS

Twelve per path, early/cheap → late/expensive. `[M]` marks a non-obvious hook.
**All delivered as bold red chat.**

### BLADE — the test that never ends
1. **The Gauntlet** — escalating waves, narrated. The reward for surviving is that he says nothing.
2. **Icarus** — above y100 he sends fliers. The one event that punishes going UP.
3. **The Duel** — one named elite, no adds. Flee and he taunts for a full day.
4. **First Blood** — the next mob you strike gets ×3 health. 60s, or the wave arrives.
5. **Blindfold** — `minecraft:darkness` 30s while a wave spawns. `[M]` real 1.21 effect.
6. **The Tithe of Steel** — double durability loss for a day. Fight with a ruined blade.
7. **Hollow Victory** — a full wave that drops **nothing**, announced as such.
8. **The Watcher** — he stands at range and does not attack. While he watches, everything else hits harder.
9. **Understudy** — a mob mirrors your own gear and stats. `[M]` read player attributes onto one spawn.
10. **The Broken Rung** — three of whatever killed you wait at your respawn.
11. **Sharpen** — temporary damage buff; spawns quadruple for its duration, stated up front.
12. **Run.** — pre-Harvest, once ever. A chase that cannot be won, only survived.

### SALVAGE — the debt you choose
1. **The Bargain** *(core)* — the ritual, Part IV/V. Every trade raises the debt.
2. **Free Sample** — unprompted ammo. Taking it silently counts as a trade.
3. **The Cache** — she marks a supply drop. It is guarded, and she knew.
4. **Scavenger's Luck** — a day of double ammo drops; every drop counts as a trade.
5. **Misfire** — your gun jams mid-fight; she'll fix it *now*, for a price.
6. **The Better Offer** — she offers to buy something you need. Refusing raises regard.
7. **Buyer's Market** — half-price trades for a day, debt accrues double.
8. **The Pack** — hunter wolves as allies for five minutes, then they turn.
9. **Interest** — the debt comes due; raid scales with trades since the last one.
10. **Repossession** — cross a threshold and she takes a gun back.
11. **The Long Con** — one enormous offer that sets debt to maximum instantly.
12. **She Knows Where You Sleep** — at max debt, the raid is at your bed on login.

### FORGE — the quota that grows
1. **The Quota** — deliver N to a marked container by a deadline.
2. **Tribute** — he takes a random stack; something rarer replaces it.
3. **Appraisal** — payout scales with what you have **built**. `[M]` count machines in a radius. The only event that pays you for your path's actual verb.
4. **Overtime** — machines double for a day; he takes half.
5. **Rust** — tools and machines degrade until you feed him.
6. **The Bigger Barn** — a quota needing a machine you lack. Recipe included. He is teaching you, angrily.
7. **Blackout** — your stress network fails for five minutes, at his choosing.
8. **The Rival** — something steals from your base and runs. Kill it to recover.
9. **Compound Interest** — every missed quota raises the next by 50%.
10. **The Gift That Isn't** — he gives you a precision mechanism; the next quota demands ten.
11. **Seizure** — a contraption stops working until paid off.
12. **Everything You Will Have** — a lump sum now against 10% of all drops for three days.

### WALL — closer, and closer
1. **The Core** — you place a core block; she nests in it. 🚨 **Raids target the CORE, never arbitrary terrain.** A bad night that eats someone's build is unforgivable in a shared world.
2. **She Followed You Home** — harmless spiders appear inside your base and stay. Zero mechanics; probably the most memorable thing in the pack.
3. **Reinforcement** — she gifts reinforced blocks in proportion to how enclosed you already are.
4. **Don't Go** — leaving the core's radius too long applies a debuff. Returning removes it.
5. **The Nursery** — the core spawns friendly babies that defend it.
6. **Closer** — take out one wall. Comply for a boon, refuse and a raid comes. She asks again later.
7. **A Room For Me** — build a sealed empty room. Large boon. She never says what it is for.
8. **The Siege** — the block-breaking raid. `createbigcannons` artillery at high notoriety.
9. **The Breach** — damage the core and she screams; every mob in loaded chunks retargets it.
10. **Threadbare** — for a day, blocks you place are quietly replaced with weaker ones. She wants you to need her.
11. **Skin** — at high notoriety she webs over doors and windows overnight. You wake sealed in.
12. **Nothing Between Us** — she asks you to break the core yourself. Doing it begins the Harvest.

### CROWN — used, but paid
1. **The Errand** — *find 5 diamonds before day X.* The goal is **down**, not **out**.
2. **Beneath Your Station** — a menial task. **Refusal is allowed**, and respected.
3. **The Survey** — a named biome and a map. Reward scales with distance.
4. **Tribute of Souls** — N souls into a jar by a deadline.
5. **The Claim** — he marks a structure his. Clear it, it becomes a waystone.
6. **The Levy** — he conscripts your servants for a day; they return stronger.
7. **Court** — servants far stronger, you take double damage. Command, don't fight.
8. **A Better Vassal** — finish early, receive a servant upgrade.
9. **The Rival Claim** — he marks *another player's* build as his. The group must negotiate.
10. **Dead Men's Debts** — every player death this week is a debt **you** owe.
11. **The Regent** — an elite servant for three days, then taken back with interest.
12. **The Coronation** — the Harvest. He takes the crown back, never having acknowledged it was yours.

### ART — sleep, and the pages
1. **The Pages** — lore fragments, **one line each**. Found via her maps.
2. **Sleep** — sleeping grants a boon. Teaches the verb.
3. **The Map** — a treasure map simply appears. It always points at something real.
4. **You Did Not Sleep** — three nights awake and she comes to you.
5. **Dreaming** — wake holding something you did not have.
6. **She Rearranged It** — a chest reordered overnight. Nothing taken. Occasionally something added.
7. **The Long Night** — night lasts twice as long; source regenerates double. Her generosity is always also a trap.
8. **The Biome** — a map to a *named* biome; standing in it yields artifact-tier loot. `[M]` **this is where Art/Crown's best-in-game artifact scaling lives.**
9. **What She Wants You To Know** — a page grants a permanent small buff plus one line. The buff is bait; the lore is the point.
10. **The Wrong Door** — a doorway appears for ten minutes. Through it is somewhere else, with loot.
11. **Her Room** — a small structure generates near you. Once. Inside: pages.
12. **Wake Up** — the Harvest. Everything she gave is hers, and she takes it back.

---

# PART VII — BUILD CHUNKS

Ordering is from live data, not preference. **Only three paths have a walker**
(forge, blade, salvage); art has one intermittently; **crown and wall have none**.

| # | chunk | why here | depends on |
|---|---|---|---|
| **P0** | **Make death cost something** — see Part IX. Wake where you fell, plus the XP cost that was never built. | Nothing else matters while dying is free. Cheapest, largest effect on "funness". | — |
| **P1** | **The coefficient substrate.** Per-path weights on the three existing notoriety consumers. | Every identity in Part II is data once this exists. Invisible to players. | — |
| **P2** | **The attention ritual.** The general "a patron has your attention" primitive. | Salvage needs it; four other patrons will. | P1 |
| **P3** | **Salvage end-to-end** — the body-for-power trades + the debt counter + Interest as the first raid. | The proof. No new mobs, no new entities. If the ratchet feels good, the design is right. | P1, P2 |
| **P4** | **Blade** — waves, taunts escalating to `"Run."`, the `darkness` beat. | Second walker. Reuses P2 for nothing; mostly spawn work. | P1 |
| **P5** | **Forge** — quotas, Appraisal, compounding. | Third walker; Appraisal needs a base to measure, so it wants play time first. | P1, P2 |
| **P6** | Art, Crown, Wall | Designed above; build when someone walks them. Wall may fold into Forge if still unwalked. | P1, P2 |

### Rules for every chunk
* **Every event logs that it fired, what it demanded, and how it resolved.**
  `20-AUDIT-2026-08-11.md` is a list of what happens when systems fail quietly.
* **Deadlines store world day, never `tickCount`** — that is audit finding K9,
  where a stamp from the future disabled the Hunt permanently.
* **A gate ships with a live consumer or not at all.**
* Run it once against a live server before calling it done.

---

# PART VIII — OPEN

* **P0's shape:** turn `keepInventory` off and let Corpse do the job the design
  already documents, or keep it and make XP the sole cost? *Needs Ethan.*
* **When does a subclass unlock** — free from the start, or at notoriety 25?
* **Do subclass spawn costs stack?** A blade+forge player at 40% is still weather.
* **Ethan's rewrites** of the draft patron lines (Forge, Wall, Crown, Art).
* **Wall's raid roster** — which installed mobs break blocks, versus driving it
  entirely with `createbigcannons`.
* **Parked mods:** Grassier Grass and Create: Bionics both cleared, neither added.
  Goblin Traders wanted but **CurseForge-only**, and this pack is 289-for-289
  Modrinth with direct CDN URLs — it needs a deliberate distribution decision.

---

# PART IX — DEATH, AND INTRODUCTIONS

*Both raised by Ethan 2026-08-11, late. He has said he will refine introductions
further — this is the capture, not the settled version.*

## 9.1 You wake where you fell

Ethan: *"What if dying doesn't bring you back to your bed? you just wake up where
you fell?"*

**This deletes a whole class of bug.** The cross-dimension respawn failures from
this morning — cemented to the bed, placing netherrack, shaking — exist *because*
we teleport the player to a bed that may be in another dimension, and the client
never agreed to the handshake. Respawn in place: no dimension change, no
handshake, nothing to desync. `instant_respawn.js` gets **simpler**, and its
`dimId()` guard and the whole cross-dimension branch can go.

It also inverts the cost. The documented design was *"death costs the run, never
the base — the cost is THE TRIP BACK."* Waking in place removes the trip back
entirely and replaces it with something better: **there is no safe reset.** You are
still in the room, with whatever is in it.

### 🚨 The one real danger: the death spiral
You wake where you fell, the thing that killed you is still standing there, and
you die again immediately. That is the worst failure mode available and it must be
designed out, not hoped away:

* a short grace — a few seconds of Resistance on respawn, and
* **detarget everything nearby**, reusing the same `setTarget` machinery the trade
  ritual needs.

### The interaction neither idea was designed for
Notoriety is `max(xpLevel, days × rate)`. If death costs **levels**, then **dying
makes you LESS RIPE** — notoriety falls and the Harvest recedes. Death becomes a
brake on the thing hunting you: you died, so you are worth less eating.

That falls straight out of combining the two mechanics and nothing had to be built
for it. It also gives the player a grim, legible lever: if the Harvest is coming
and you are not ready, you can die on purpose to buy time. **Whether that is a
feature or an exploit is a real question** — it is thematically perfect and it is
also an obvious abuse route. Probably wants a floor (death can lower notoriety, but
never below the days-since-harvest term, which cannot be dodged).

### Open
* Does the Harvest instance exempt? Waking where you fell with your Harvest
  stalker still standing over you is either the best moment in the game or an
  unwinnable loop.
* `keepInventory` stays **on** under this model — the cost is XP and position, not
  gear. Corpse then never triggers, which is fine; it simply is not the design any
  more.

## 9.1b THE LOSE CONDITION — the patron gets tired of you

Ethan: *"the more levels you lose the more irritated the patron becomes, dying too
many times in a short period causes the entity to force a harvest then kick you
off the path on a cooldown. That being said it should be on a degrading counter
with messages from the patron."*

This is what makes death **cumulative** rather than merely priced. A single death
costs levels; a *pattern* of deaths costs the path.

### The counter is NEUTRAL. Six patrons interpret it differently.

Calling it "irritation" is right for four of them and wrong for two, and that
difference is the best thing in this mechanic. It is **one number with six
readings**:

| patron | what the number means to them | direction |
|---|---|---|
| **Blade** | contempt. You keep failing a test he set. | anger |
| **Forge** | debt. A dead builder builds nothing; this is lost output. | anger |
| **Crown** | embarrassment. A king does not swing the sword — this reflects on *him*. | disdain |
| **Wall** | **grief.** Every death is you leaving her. She is not angry, she is hurt. | need |
| **Salvage** | **opportunity.** A dying player NEEDS something. She profits from your bad night, right up until you are a bad investment. | appetite |
| **Art** | **readiness.** Death is a kind of sleep, and she has always wanted you to sleep. She gets *happier*. | delight |

Wall, Salvage and Art escalate the **wrong way** on purpose. A patron who becomes
more affectionate, more generous, or more *pleased* as you die is far more
frightening than one who gets angry — and it costs nothing extra to build,
because the number is the same.

### 🚨 The counter must not be fed by the spiral it creates

E0 probe P8, measured live 2026-08-12:

```
at the DEATH SITE : 7 living mobs within 24 blocks, ALL 7 hostile
at the bed        : 1 mob, 0 hunting you
```

§9.1 wakes you **where you fell** — which by that measurement is in front of seven
hostiles. Combine that with a counter that rises on every death and the failure
mode writes itself: die → wake in the pack → die → wake → die → forced Harvest →
lose the path. **One bad cave becomes a lost path**, through no decision the
player ever made. That is positive feedback on a punishment ladder, which is how a
bad session becomes somebody quitting.

**Rule: a death within the grace window of a respawn does not advance the
counter.** A spiral counts once. The counter is meant to measure *carelessness
over time*, not a single moment going wrong, and those must not be the same
signal. The grace window has to exist for §9.1 anyway; this reuses it.

### A property worth keeping, discovered rather than designed
Dying drains levels → notoriety falls → **the Harvest scales with notoriety**. So
the forced Harvest arrives *weaker* for the player who has been dying, because
they are worth less. The punishment self-balances: it is a real fight rather than
an execution, and it stays winnable exactly when it fires. Nothing had to be built
for that.

### ✅ DECIDED 2026-08-12
* **The cooldown is 3 in-game days.** At 20 minutes per Minecraft day that is
  roughly **one hour of real play** — long enough to be felt, short enough not to
  end somebody's evening.
* **The subclass drops with the primary.** Losing the path loses everything
  attached to it.
* **Wall keeps "love" and "darling".** She is the only patron who uses pet names,
  and that is now deliberate — it is the clearest signal that her register is
  intimacy rather than menace.
* **Taking a path STRIPS ALL EXISTING XP.** The largest of the four; see §9.1c.

### Still open
* **Does the path open to OTHERS during the cooldown?** If Lehykt loses Blade for
  three days, may Ben take it? Yes is more dramatic and creates real table
  politics; no is kinder. **Unresolved.**
* 🚨 **The kick must clear the tag AND the claim atomically**, and the cooldown
  must be stored as **world day**, never `tickCount` — this is the third place the
  P1 desync bug and the K9 uptime bug can be born.
* Should the counter be visible on demand (`/path` showing your patron's mood)?
  The legibility law in §2 says yes — the player must be able to see the thing
  that is about to take their path.

## 9.1c TAKING A PATH STRIPS YOUR XP

Ethan, 2026-08-12: *"taking a path strips you of all your existing xp."*

Small sentence, large consequences — three of them, and two come free.

### It kills path-hopping before it exists
Notoriety is `max(xpLevel, daysSinceHarvest × rate)`. Without this a player could
bank levels on one path, switch, and arrive somewhere new already fat. Now every
path starts you at nothing. **You cannot carry a fortune between patrons.**

### It pushes players INTO the system early
The cost of taking a path is everything accumulated so far — so the cheapest
moment to take one is **immediately**, before there is anything to lose. A player
who hoards levels while staying pathless is building a bigger and bigger entry
fee. That is precisely the right incentive for a server whose actual problem was
players not engaging with the system.

### 🚨 It MERGES with the introduction, and simplifies it
§9.2 has each patron demanding something at the door, under a rule that the price
must be payable by somebody who owns nothing. **The XP strip IS that price.**

There is no longer any need for six separate demands. The patron's first act is
simply to take everything the player has, and each patron needs only a *line*
about taking it. That is thematically perfect for all six at once, and it is one
mechanic instead of seven. A refusal still costs the path — and now costs nothing
else, because the strip has not happened yet.

### The punishment compounds by itself
`recordHarvest` already escalates `RATES` by harvest count: each Harvest makes the
next arrive faster. So the full loss loop is —

```
die too often -> forced Harvest -> XP wiped, notoriety reset, rate raised
              -> path revoked + subclass dropped
              -> 3 in-game days of nothing
              -> retake the path, XP stripped (already zero)
              -> and the next Harvest now comes FASTER than the last
```

A player who keeps losing paths accelerates toward the next Harvest every time,
**and none of that needed new code.** It falls out of machinery that already ships.

⚠️ **Requires:** the forced Harvest must call
`recordHarvest(server, player, won=false)`. That is what resets the day term and
raises the rate. Skip it and the player walks out of a forced Harvest still
carrying the accumulated days that caused it — and straight back into another one.

## 9.2 Introductions — meeting your patron

> ⚠️ **SUPERSEDED IN PART by §9.1c.** The per-patron demand table below is no
> longer needed: **the XP strip IS the price of entry.** Each patron now needs
> only a LINE about taking everything you have, not a separate mechanic. Keep the
> table as voice guidance; do not build six demands.

Ethan: *"when you choose a path your patron blinds, and slows you. Then it talks
to you. It demands something and if you don't give in you're kicked off the path."*

**This is the attention ritual (Part IV) for the third time** — blind, slow, speak,
demand. Trade, Wall's requests, and now initiation. That settles it: build it once
as *"a patron has your attention"*, and every patron gets it for free.

It also quietly fixes the **information drought** that `help.js` was written for.
You do not read about your patron in a guidebook. You meet them, in the dark,
before you have anything.

### Rules
* **The demand must be payable by someone who owns nothing.** A player choosing a
  path is usually new and poor, so the price has to come from the body — hunger,
  a level or two, a few hearts — never an item they may not have.
* **Refusal costs the path.** The claim is released and the tag cleared.
* 🚨 **Refusal MUST clear the tag AND the claim together.** Leaving one behind is
  exactly the P1 defect from `20-AUDIT-2026-08-11.md`, where Ethan carried a
  `forge` tag against an empty claim and silently earned nothing for days. This
  new code path is the second place that bug can be born.

### Draft demands, one per patron — *replace with Ethan's own*
| patron | demands at the door | in character because |
|---|---|---|
| **Blade** | that you bleed. Take damage and do not heal. | he tests, immediately and without explaining |
| **Salvage** | a trade, right now — hunger or levels | she opens with a deal; there is no version of her that doesn't |
| **Forge** | everything currently in your inventory | he wants what you have *and what you will have* |
| **Wall** | that you seal yourself in — place blocks until there is no opening | intimacy as the price of entry |
| **Crown** | service. **And he accepts refusal** — you keep the path, and he keeps count | the only patron who respects a no |
| **Art** | that you sleep. Now. | *"She wants you to sleep. She wants you to sleep."* |

Crown's exception is not a special case bolted on — it falls out of his voice, and
it means one of the six paths has a genuinely different door.
