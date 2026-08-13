# The Patrons — voices and events

> ⚠️ **FOLDED INTO `23-THE-PATH-SYSTEM.md` (2026-08-11).** That is the master
> document now. This file is kept for the reasoning and the conversation trail;
> read 23 for the current design.

*Design, 2026-08-11. DESIGN ONLY, nothing built. Companion to
`21-THE-SIX-ROLES.md`, which holds the trinity, coefficients and subclass rules.*

---

## 0. The law this whole document obeys

Ethan: *"a harder world isn't necessarily a bad one?"* — correct, with one
qualification that everything below is built around:

> **Difficulty is good when it is LEGIBLE and CHOSEN. It is bad when it is
> invisible.**

What made 2026-08-11 miserable was not that iron was scarce. It was **132 monster
kills per iron ingot with no signal that anything was wrong** — and, underneath
it, a broken claim paying literally nothing while looking healthy. That is not
difficulty, it is opacity.

So: **every event announces itself, and every cost is named before it is paid.**
A raid the player saw coming and chose to provoke is content. The same raid
unannounced is a bug report.

## 1. Subclasses — OPEN

Ethan overrode the different-pair restriction: subclasses are **open**. Any
primary, any secondary.

* Grants: **the loot pool**, **some of the events**, **half the buff effects**.
* Does NOT grant: **the stalker**, or a second Harvest. One creature per player,
  from the primary, always.

Consequence, accepted deliberately: someone can take blade+salvage and be a
double weather system with nothing to craft with. Let it happen. They will feel
it within two nights and trade for what they lack — which is the interdependence
working, just discovered rather than enforced.

## 1.5 THREE RULINGS — read these before the voices

### The patrons ARE the stalkers
Ethan: *"these patrons btw are the stalkers. same beings im just using different
terminology for them."*

Not a patron *and* a creature — **one being**. The thing that shadows you at 100
blocks, that steps in when you are nearly dead, that demands and bargains as you
fatten, and that finally comes to collect, is the same thing whose voice you hear.
Every "patron" in this document is its casting from `18-THE-STALKERS.md`, named
for its role rather than its species.

This makes the Wall reading much darker and much better: The Mother asking to come
closer is not a distant benefactor negotiating. **She is already outside.**

### Events arrive as CHAT — bold red, and nothing else
Ethan: *"all the events need to be bolded in red over chat. yes makes it less...
interactive but the patrons should still stay distant stalkers who whisper into
your ear."*

A deliberate trade, made with eyes open: less interactivity in exchange for the
patrons never breaking character as **distant things that whisper**. No dialogue
GUIs, no trade screens, no walking up to an NPC. The entity stays at range and out
of reach; the relationship happens in text.

This also keeps §0's law easy to satisfy — a red line in chat is the most legible
announcement there is.

### Born in Chaos STAYS. The mod-swap question is closed.
Ethan floated dropping Born in Chaos entirely, because its mobs are hardcoded
hostile and we cannot override that. The diagnosis was correct — proven by our own
code, which cancels the damage on *every swing* rather than stopping the attack:

> *"A Companion is still a Born in Chaos HOSTILE. Left alone its own AI acquires
> the nearest player - which is its owner - and it mauls the person it is supposed
> to be protecting. Clearing its target on a 2s sweep is cosmetic; between sweeps
> its AI re-acquires and swings."* — `stalker.js`

**But the two rulings above dissolve the problem.** Hostility only bit us because
we were asking a Monster to behave like a companion standing next to you. If the
stalker is *always distant* and every interaction is *chat*, its AI never gets to
matter — hostility becomes atmosphere.

So: **no swap.** The castings' designs are the point and they keep their faces.
The fix is to hold the leash harder — `DIST_NEAR = 12` / `DIST_FAR = 100` /
`keepDistance()` already exist and simply need to be enforced properly — with the
damage veto demoted to a backstop instead of the mechanism.

*Investigated and rejected: Goety has a real ownership model (`setTrueOwner`,
`OwnableEntity`, `getOwnerUUID`, `setBoundPos`, 64 servants) and would have been
the correct substrate for a companion-shaped design. It is the wrong substrate for
THIS design, and it would have cost every casting its appearance. Recorded so
nobody re-derives it.*

## 2. The voices

Ethan's seeds, verbatim, are the canon. The sample lines under each are **my
drafts and should be replaced with his** — per the standing tone ruling
(`18-THE-STALKERS.md`), the whispers and taunts are **Ethan's own writing** and
the absurdist register is deliberate: *"more loveable than just outright
dangerous."*

### Blade — The Challenger · `fallen_chaos_knight` · **he**
> *"Hostile, antagonistic. He tests the player almost repeatedly."*

Second person, imperative, contemptuous. **Short.** Never explains himself, never
congratulates. His highest form of praise is silence. Canon lines:

> *"Fall"* · *"You reach for heights you will never attain"* ·
> *"For It was Icarus who flew too close to the sun. You will share his fate"* ·
> *"Run."*

`"Run."` is reserved. It fires **once**, immediately before the Harvest, and
never otherwise.

### Salvage — The Hound · `dire_hound_leader` · **she**
> *"Sneaky, bartering. Trade with her if you dare."*

Coaxing, familiar, never quite honest. Calls you *friend*. Never states the full
price up front and never technically lies. Draft register:

> *"Friend. You look light on brass."* · *"Take it. We'll settle later."* ·
> *"Later is now."*

### Forge — The Thief · `krampus` · **he**
> *"Angry, greedy. He wants everything you have and everything you will have."*

Demanding, ungrateful, escalating. Never satisfied, never thanks you, treats
every delivery as overdue. The only patron who takes **future** production, not
just present stock. Draft register:

> *"Late."* · *"This was owed yesterday. Tomorrow you owe more."* ·
> *"I have seen what you will build. I want that too."*

### Wall — The Mother · `mother_spider` · **she**
> *"Codependent, needy. She wants to be closer and closer and closer until there
> isn't anything between you two."*

Intimate, wounded, escalating. Speaks in **we** and **us**. Every gift is a
tether and every request is smaller than the last one until suddenly it isn't.
The most genuinely unsettling of the six, because she is never hostile. Draft
register:

> *"You built a door. Was it for me?"* · *"Take out one wall. Just one."* ·
> *"There. Nothing between us."*

### Crown — The False King · `missioner` · **he**
> *"Arrogant but cooperative. He doesn't respect your claim but he will use you."*

Imperious, transactional, occasionally complimentary in a way that lands as an
insult. Treats you as a competent subordinate who has forgotten their station.
**Alone among the six he will accept a refusal** — and respect it. Draft register:

> *"Your claim is noted. It is not recognised."* · *"You will do this well. You
> usually do."* · *"Refuse, then. I keep count."*

### Art — The Nightmare · `nightmare_stalker` · **she**
> *"She wants you to sleep. She wants you to sleep. Find her pages. Find what she
> wants you to know."*

Fragmentary, repetitive, dreamlike. **Repeats herself** — the doubling in Ethan's
seed is the voice, not a typo, and should survive into the implementation. Gentle
second person; never threatens, and is the only patron who gives without asking.
Draft register:

> *"Sleep."* · *"You did not sleep."* · *"There is a page. There is a page."*

Her **pages** obey Ethan's standing ruling on lore fragments: *horribly simple, a
single line.* Never a paragraph.

---

## 3. Events

Twelve each, ordered roughly from early/cheap to late/expensive. `[M]` marks the
implementation hook where it is not obvious. Nothing here is scheduled work.

**Delivery for all 72: bold red chat.** Any event below that reads as though it
needs a GUI or an approachable NPC — Salvage's bargains especially — is a chat
prompt plus a command, never a trade screen.

### BLADE — the test that never ends

1. **The Gauntlet** — escalating waves, he narrates each. Survive all; the reward
   is that he says nothing afterward.
2. **Icarus** — above y100, he sends fliers (`amphithere`, `flying_scarab`,
   `legendary_monsters:bomber`). The one event that punishes going UP.
3. **The Duel** — one named Legendary Monsters elite, no adds. Flee and he taunts
   for a full day cycle.
4. **First Blood** — the next mob you strike gets ×3 health. Kill it inside 60s or
   the rest of the wave arrives.
5. **Blindfold** — `minecraft:darkness` for 30s while a wave spawns. *"You do not
   need eyes for this."* `[M]` real 1.21 effect, no resource pack needed.
6. **The Tithe of Steel** — for one day your weapon takes double durability loss.
   He wants to see you fight with a ruined blade.
7. **Hollow Victory** — a full wave that drops **nothing at all**, announced as
   such. Pure test, no payout.
8. **The Watcher** — he stands at range and does not attack. While he watches,
   everything else hits harder.
9. **Understudy** — a mob is buffed to mirror your own gear and stats. `[M]` read
   the player's attributes, apply to one spawn.
10. **The Broken Rung** — after you die, three of whatever killed you are waiting
    at your respawn.
11. **Sharpen** — a gift: temporary damage buff. Spawns quadruple for its whole
    duration, stated up front.
12. **Run.** — pre-Harvest, once ever. A chase that cannot be won, only survived.

### SALVAGE — the debt you choose

1. **The Bargain** *(core)* — gold nuggets for ammo. Every trade raises the debt
   counter. See §3.5 below — Ethan's trade ritual is the answer to how a
   chat-only patron runs a shop.
2. **Free Sample** — unprompted ammo. Taking it silently counts as a trade.
3. **The Cache** — she marks a supply drop. It is guarded, and she knew that.
4. **Scavenger's Luck** — for one day mobs drop double ammo. Every drop counts as
   a trade.
5. **Misfire** — your gun jams mid-fight; she offers to fix it *now*, for a price.
6. **The Better Offer** — she offers to buy something you need. Refusing raises
   her regard; accepting raises debt.
7. **Buyer's Market** — a day of half-price trades. Debt accrues double.
8. **The Pack** — hunter wolves spawn as allies for five minutes, then turn.
9. **Interest** — the debt comes due. Raid size scales with trades since the last
   one.
10. **Repossession** — cross a debt threshold and she takes a gun back.
11. **The Long Con** — one enormous offer (netherite, a rare TaCZ gun) that sets
    debt to maximum instantly. Announced as such.
12. **She Knows Where You Sleep** — at max debt, logging off means the raid is at
    your bed when you log back in.

#### §3.5 THE TRADE RITUAL — how a chat-only patron runs a shop

Ethan, 2026-08-11: *"When a trade is proposed they become slowed to max, and
invisible and the blindness effect. Then a pick a trade. They have 30 seconds, not
picking a trade causes them nausea and removes the other affects."*

**The effects ARE the interface.** No GUI, no NPC, no trade screen — and it still
becomes a *place* you are pulled into. Pinned, blind, unseen: she takes you aside.

It also works for a reason that is free: **blindness does not obscure the chat
overlay.** The world goes black and her text stays perfectly legible. The world
disappears and only her voice remains, which is precisely the intent.

| beat | effect | meaning |
|---|---|---|
| proposed | Slowness (max) | you cannot walk away |
| proposed | Blindness | the world goes; only her words stay |
| proposed | Invisibility | the world cannot see you either — you are *aside* |
| 30s | the offer, in red chat | clickable, one line per option |
| declined / expired | Nausea, effects cleared | she is annoyed you wasted her time |

**Four refinements:**

1. **Armour still renders while invisible**, so a geared player is not actually
   hidden. Also clear nearby mobs' targets when the trade opens — `stalker.js`
   already has that machinery (`setTarget`), so it is a couple of lines.
2. **Selection is clickable chat** (`clickEvent: run_command`). Strictly chat-only,
   no GUI, and it works while blind — otherwise a blinded player is typing
   `/trade 2` by feel.
3. **Keep the decline-nausea SHORT** — ~3–5s at amplifier 1. Ethan asked earlier
   the same day to tone the whisper nausea down (`RARE_NAUSEA_TICKS`), and a long
   penalty here would reintroduce it through the back door.
4. **Logging off mid-trade must clear the effects on login**, or a player returns
   permanently blind and rooted. Exactly the shape of the respawn bugs in
   `20-AUDIT-2026-08-11.md`.

**OPEN — does she propose during combat?**

* *Safe-only:* she waits until nothing has hit you recently. All the tension lives
  in the debt.
* *Mid-combat:* she offers ammo **precisely when you have run out**, and accepting
  means 30 seconds blind and rooted with a wave inbound. This is "trade with her if
  you dare" in its purest form and is exactly what *sneaky, never quite honest*
  would do.

Recommendation: **safe-only at first** — the group was dying more than it wanted
to on the day this was designed — then unlock the mid-combat version **gated on
debt level**, so she only dares once you are already deep with her.

### FORGE — the quota that grows

1. **The Quota** — deliver N of a resource to a marked container by a deadline.
2. **Tribute** — he takes a random stack. Something rarer appears in its place.
3. **Appraisal** — he inspects the base; payout scales with what you have
   **built**. `[M]` count machines/blocks in a radius — rewards building, which is
   the entire point of the path.
4. **Overtime** — machines produce double for a day. He takes half.
5. **Rust** — tools and machines degrade until you feed him.
6. **The Bigger Barn** — a quota requiring a machine you do not own. Recipe
   included. He is teaching you, angrily.
7. **Blackout** — your stress network fails for five minutes, at a moment of his
   choosing.
8. **The Rival** — something spawns that *steals from your base* and runs. Kill it
   to recover the goods.
9. **Compound Interest** — every missed quota raises the next by 50%.
10. **The Gift That Isn't** — he gives you a precision mechanism. The next quota
    demands ten.
11. **Seizure** — a contraption of yours stops working until paid off.
12. **Everything You Will Have** — a contract: a large lump sum now, against 10%
    of **all** your drops for three days. The purest statement of his character.

### WALL — closer, and closer

1. **The Core** — you place a core block; she nests in it. Everything else keys
   off this. `[M]` **the hard constraint from `21` lives here: raids target the
   CORE, never arbitrary terrain.**
2. **She Followed You Home** — harmless spiders appear inside your base and stay.
   Pure ambience, zero mechanics, and the most memorable thing on this list.
3. **Reinforcement** — she gifts reinforced blocks in proportion to how *enclosed*
   your base already is.
4. **Don't Go** — leaving your core's radius too long applies a debuff. Returning
   removes it.
5. **The Nursery** — the core begins spawning friendly baby spiders that defend
   it.
6. **Closer** — she asks you to take out one wall. Comply for a boon; refuse and a
   raid comes. She asks again later.
7. **A Room For Me** — build a sealed empty room. Large boon. She never says what
   it is for.
8. **The Siege** — the block-breaking raid on the core. Artillery
   (`createbigcannons`) at high notoriety.
9. **The Breach** — if the core is damaged, she screams and every mob in loaded
   chunks retargets the breach.
10. **Threadbare** — for a day, blocks you place are quietly replaced with weaker
    ones. She wants you to need her.
11. **Skin** — at high notoriety she webs over your doors and windows overnight.
    You wake sealed in.
12. **Nothing Between Us** — the endgame. She asks you to break the core
    yourself. Doing it begins the Harvest.

### CROWN — used, but paid

1. **The Errand** — *find 5 diamonds before day X.* Ethan's own example, and the
   right shape: the goal is **down**, not **out**.
2. **Beneath Your Station** — a menial task (64 rotten flesh). **Refusal is
   allowed**, and he respects it — the only patron who does.
3. **The Survey** — a named biome and a map to it. Reward scales with distance.
4. **Tribute of Souls** — N souls into a jar by a deadline.
5. **The Claim** — he marks a structure as his. Clear it and it becomes a
   fast-travel point (`waystones`).
6. **The Levy** — he conscripts your Goety servants for a day. They come back
   stronger.
7. **Court** — for a day your servants are far stronger and you take double
   damage. He expects you to command, not to fight.
8. **A Better Vassal** — finish a task early, receive a servant upgrade.
9. **The Rival Claim** — he marks *another player's* build as his. Deliberately
   awkward; the group has to negotiate.
10. **Dead Men's Debts** — every player death on the server this week is a debt
    **you** owe him.
11. **The Regent** — command of an elite servant for three days, then he takes it
    back with interest.
12. **The Coronation** — the Harvest. He comes to take the crown back, having
    never once acknowledged it was yours.

### ART — sleep, and the pages

1. **The Pages** — collectible lore fragments. **One line each**, per Ethan's
   standing rule. Found via her maps.
2. **Sleep** — sleeping grants a boon. Simple, and it teaches the verb.
3. **The Map** — a treasure map simply appears in your inventory. It always points
   at something real.
4. **You Did Not Sleep** — three nights awake and she comes to you.
5. **Dreaming** — sleep and wake holding something you did not have.
6. **She Rearranged It** — a chest's contents are reordered overnight. Nothing is
   taken. Occasionally something is added.
7. **The Long Night** — night lasts twice as long; source regenerates at double
   rate. Her generosity is always also a trap.
8. **The Biome** — a map to a *named* biome. Standing in it yields artifact-tier
   loot. `[M]` **this is where Art/Crown's best-in-game artifact scaling lives.**
9. **What She Wants You To Know** — reading a page grants a permanent small buff
   plus one line of lore. The buff is the bait; the lore is the point.
10. **The Wrong Door** — a doorway appears near you for ten minutes. Through it is
    somewhere else, with loot.
11. **Her Room** — a small structure generates near you. Once. Inside: pages.
12. **Wake Up** — the Harvest. Everything she gave is revealed as hers, and she
    takes it back.

---

## 4. Notes toward building any of this

* **Event bus first.** All six patrons want: announce → optionally set a deadline
  → check a condition → pay out or punish. That is *one* scheduler with six data
  tables, not six systems. Build it once.
* **Every event needs an OFF.** `20-AUDIT-2026-08-11.md` is a list of what happens
  when systems fail silently. Each event must log that it fired, what it demanded,
  and how it resolved — otherwise the next audit finds another Hunt that has been
  sending nothing for a month.
* **Deadlines must survive a restart.** Store world day, never `tickCount` — that
  exact mistake is audit finding K9, where a stamp from the future silently
  disabled the Hunt forever.
* **Build order unchanged** (`21` §6): coefficient substrate → **Salvage's debt
  ratchet** as the proof → Blade → Forge. Art, Crown and Wall are designed here
  and built when someone walks them.

---

## 5. Parked

* **Goblin Traders** (MrCrayfish) — wanted, and a strong fit: it comes to *you*,
  underground, and it trades. **Blocked:** CurseForge-only, and this pack is
  289-for-289 Modrinth with direct CDN URLs + sha512. It would be the first
  exception to that, so it needs a deliberate decision about distribution rather
  than a quiet `packwiz` call. (packwiz is also not currently on PATH.)
* **Grassier Grass** and **Create: Bionics** — both cleared in `21` §7, neither
  added yet.
