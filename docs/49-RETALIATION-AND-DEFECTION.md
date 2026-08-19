# 49 — Retaliation, Interception and Defection *(design, 2026-08-16, NOT BUILT)*

> Ethan, 2026-08-16: *"these are related to assassination and contract. Retaliatory
> events."* Then, generalising it off Wall: *"the retaliation system will be built for
> everyone where the opposing god attempts to stop assasination attempts and/or warns
> their champion of incoming."*

**This is the first system in which the gods are aware of each other.** Everything
before it is one patron speaking to one champion. Here a god watches another god's
champion, talks to them, talks *about* them, and — at the top of the escalation —
argues with the god in front of both players. That is a new axis for the whole
pantheon, not an event pack for Wall.

Four mechanics, in dependency order:

| | name | fires when | needs |
|---|---|---|---|
| **A** | **The Warning** | an order naming your champion is issued | a lines pool |
| **B** | **The Interception** | same moment, aimed at the *assassin* | posture table |
| **C** | **The Grudge** | your champion killed by the same player ×4 | a ticker |
| **D** | **The Argument** | ⭐ **C firing** — see §4 | a broadcast primitive |

---

## 1. ⭐ The posture table — two axes, not one

Ethan's spec reads as one list, but it is two independent decisions and separating
them exposes a gap:

> *"Blade will never stop them, he will only warn his champion. Wall will attempt to
> stop them no matter what, rarely asking for a choice and warn the player. Salvage
> will offer a deal. Forge will offer a deal and warn. Art will do nothing."*

| god | **intercept** the assassin | **warn** own champion |
|---|---|---|
| **Blade** | 🚫 never — *"he will never stop them"* | ✅ yes |
| **Wall** | 🔴 **always**, and *"rarely asking for a choice"* | ✅ yes |
| **Salvage** | 🤝 offers a deal | ✅ yes — *ruled 2026-08-18* |
| **Forge** | 🤝 offers a deal | ✅ yes |
| **Art** | 🚫 nothing | 🚫 nothing |

**The whole pantheon is legible in that table**, which is how you know it is the right
shape: Blade thinks a champion who needs saving is not worth saving. Wall cannot
conceive of not intervening. The two mercantile gods negotiate, because that is what
they do with everything. Art does not look up.

### 🔑 Wall "rarely asking for a choice" changes §6 for the better

The defection scene (the Accept/Reject argument, §6) was designed as *her* interception.
Ethan's amendment makes it **rare** — she usually just intervenes, and only sometimes
stops to ask.

That is better than the original. A choice scene offered every single time becomes a
text box players click through; offered rarely, it stays an event. **The rare branch is
also the only one that can be refused**, which is what makes it worth the ritual's cost
of taking control away.

### ✅ Salvage's warning — RULED 2026-08-18: she warns

Her governing rule is Ethan's own: *"She will never do anything without the player's
permission."* A warning is **information**, not something done *to* a player, so it
clears the consent column — and she is the last god who would let someone walk into an
ambush uninformed. Ethan commissioned the pool, which is the ruling.

It was worth asking rather than assuming: §0b of `docs/44` exists because her consent
column keeps catching things that looked fine (three of her seven built events still
break it). Drafted in `docs/44` §0c.

### ⚠️ Art doing nothing TWICE must be VISIBLE, or it reads as broken

Art is absent from both A and B, and from C as well (*"Art - Nothing again because art
doesn't care"*). That is correct characterisation — but it means **an Art champion
never sees this system at all**, and cannot tell indifference from a dead hook. This
codebase has shipped three mechanics that loaded clean and did nothing.

**Proposal: Art's silence is remarked on by someone else.** The absence becomes
content instead of a void — another god notices that the dreamer did not answer. One
line, and Art still does nothing, which is the point.

> *The dreamer was told. The dreamer said nothing.* — a Wall line, about Art

---

## 2. The Warning (A) — the cheapest piece, and it should be built first

Just chat. No ritual, no control taken, no mid-combat hazard (§5), no new entity. It
is the one part of this design with **no way to go wrong**, and it carries most of the
drama.

Ethan's lines, verbatim — the characterisation contrast in these two pools is the
entire thesis of the system and neither should be edited toward the other:

**Wall — `warn_incoming`.** She says **run**, and offers to stand in front of you.

```
The champion of the blade comes for you. Run!
I will hold them off, you get to safety.
They will regret what they have sown.
```

**Blade — `warn_incoming`.** He says **win**, and offers nothing.

```
A champion comes for you. Ensure you win.
Seems a challenger approaches...
A challenge, one you are fit for. Win.
```

*(Typos only: `challege`→`challenge`, and the comma splice in line 1 made a period.
No words changed.)*

⚠️ **Wall's first line hardcodes "the champion of the blade".** It must be
`{rival}`-substituted through `sayAbout` — the same mechanism the Mark already uses
for `{target}` — or the line is wrong the first time Salvage sends someone. Blade's
pool is written generically already and needs no substitution, which is itself
characterisation: he does not care who it is.

**Salvage — `warn_incoming`.** ✅ **DRAFTED 2026-08-18**, full text and reasoning in
`docs/44` §0c. She **informs, and permits you to leave** — the third relationship, and
the only patron who treats quitting as legitimate:

```
You've got someone incoming. You can leave. Nobody else is going to tell you
that's allowed.
```

**Forge — `warn_incoming`.** 🅿️ **BACKBURNER**, Ethan 2026-08-18. Costs nothing: his
path is CLOSED in `paths.js`, so his posture could not fire either way.

**Art** gets none, by design.

---

## 3. The Grudge (C) — the ticker, and its three unspecified behaviours

> *"if the champion keeps getting killed by another over and over again. once ticker
> hits 4 it causes the opposing god to lash out."*

| god | lash-out |
|---|---|
| **Blade** | Strength debuff → `minecraft:weakness` |
| **Salvage** | Speed debuff → `minecraft:slowness` |
| **Forge** | `minecraft:mining_fatigue` |
| **Wall** | **hordes of spiders** — the only physical answer, and the only one that fits her |
| **Art** | nothing |

Each is the god denying you *their own domain*, which is why the table feels right:
the warrior takes your strength, the marksman takes your speed, the builder takes your
ability to build, and the Spider does not take anything — she sends something.

### 🔴 Three behaviours the spec does not state, each with a wrong default

**1. Scope — per victim, or per pair?** *"killed by another"* reads as a specific
someone. It must be keyed **per (victim, killer) pair**. A single per-victim counter
means a third player's kills push the ticker, and the god then lashes out at whoever
happens to trip it — punishing someone who killed the champion once. Invisible on a
two-player server and badly wrong at four.

**2. Reset.** *"once ticker hits 4"* — and then? If it does not reset, the 5th kill and
the 500th are identical and the debuff becomes permanent background weather. **Reset to
zero on fire**, so it is a cycle: four kills, a reprisal, rebuild.

**3. Decay.** Nothing says a grudge expires. Without decay, four kills spread across
three months fire as if they were four kills in an evening. **Precedent is split and
must be chosen deliberately:** `release.js` shipped this morning with *"streaks do NOT
decay — 'in a row' is the only forgiveness"*, while Wall's rage decays on a quiet-time
curve. A grudge is a mood, not a contract, so it should decay — but that is a ruling.

### ⚠️ Mining Fatigue is the dangerous one

On a Create server, mining fatigue aimed at a player mid-build is the single most
enraging effect in the table, and it belongs to the **builder** god — thematically
perfect, mechanically the most likely to make someone log off. It is also the only one
that does not wear off in the sense the others do: weakness and slowness matter for a
fight you can walk away from; mining fatigue ruins a task you were *choosing* to do.

**Recommendation: short and visible.** Something like 45–90 seconds, announced in the
god's own voice, amplifier 0. Long enough to be a statement, short enough that the
answer is "wait" rather than "quit". These are the first mechanics in the pack that
make a player *worse*, and Ethan's instinct on the coefficient floor — *"it should
always be an increase"* — was about exactly this feeling, even though it was a
different system.

⚠️ **Nothing here takes items.** Standing rule, 2026-08-16: *"No we don't take items
from players, that is how you cause them to quit."* Timed effects only.

---

## 4. ⭐ The Argument (D) IS the Grudge firing — do not build them separately

Ethan listed the arguments as a third idea (*"We can also do arguments"*), but his own
sample is **about the ticker**:

> *"Your champion keeps hurting mine, they keep murdering mine!"* — Wall

That is the grudge's complaint, spoken aloud. So the argument is not a separate event
that happens sometimes; it is **the narration of C firing**, and binding them gives
each half what it lacks:

- the argument gets **stakes** — it is not two gods bickering, it is the moment before
  a reprisal lands
- the debuff gets a **reason** the players watch happen, instead of an effect icon
  appearing for no visible cause

**The sequence at ticker = 4:**

```
1. the wronged god accuses          (their colour)
2. the rival answers                (their colour)
3. the wronged god threatens        (their colour)
4. the rival refuses                (their colour)
5. the lash-out lands
```

Ethan's Wall↔Blade exchange, verbatim, which is exactly that shape:

```
Wall    Your champion keeps hurting mine, they keep murdering mine!
Blade   So? That means they were weak.
Wall    You will regret your words, warrior.
Blade   Then let me.
```

*"Then let me."* is the best line in the proposal — he is not denying that he will
regret it, he is inviting it. Keep it exactly as written.

### 🔧 It needs a primitive that does not exist yet

`voice.say(player, god, tag)` speaks to **one player**. There is no broadcast anywhere
in the codebase — verified, zero hits for `tellAll`/`broadcast`. An argument both
players watch needs one.

**The good news:** `COLOUR[god]` is already per-god in `voice.js`, so an argument is
just an ordered list of `(god, line)` pairs, each rendered in its own colour, sent to
everyone. The colours doing the speaker attribution for free is why this will read well
in chat with no name tags — and no-name-tags matters, because *"part of all the gods is
they don't actually see you for you"*.

**Pacing:** the ritual's 50-tick line gap (~2.5s) is the established rhythm and should
be reused, so an argument runs ~10 seconds. It must NOT use `ritual.begin` — nobody's
control should be taken for a conversation they are not in.

### Which pairs need writing

The exchange is **per ordered pair of gods**, which is 5×4 = 20 pairs at full scope.
That is far too much writing to commission at once.

**Build it as: a generic accusation/answer pool per god, plus named exceptions.** Each
god gets `argue_accuse` and `argue_answer` written once in their own voice; the
Wall↔Blade exchange above is the first hand-written special case because Ethan has
already written it. Art has no pool at all — the other god accuses and **nothing
answers**, which is the loudest possible way to render *"art doesn't care"*.

---

## 5. 🚨 Timing — the constraint that shapes A, B and D

`ritual.js` header, its own words: *"It takes the player's control away, speaks, and
gives it back."* Blindness, slowness, rooted.

**Anything that uses the ritual cannot fire mid-fight.** If Wall's choice scene fires
as the assassin swings, the assassin is frozen blind while the champion kills them — an
exploit the champion could bait deliberately.

| mechanic | uses ritual? | when it fires |
|---|---|---|
| **A** Warning | ❌ chat only | **order issue**, and safe to repeat on proximity |
| **B** Interception — Wall's rare choice, the deals | ✅ yes | **order issue only**, never at execution |
| **C** Grudge lash-out | ❌ effect + chat | on the 4th kill, at respawn |
| **D** Argument | ❌ broadcast only | with C |

Guards the ritual branch needs, all silent failures otherwise: not in combat, not
falling, not already in a ritual, target genuinely on the defending god's path,
assassin **not** on it. And **defer, never drop** — hold the scene for the next quiet
window rather than skipping it, because a scene that silently never fires is
indistinguishable from a broken hook.

---

## 6. Wall's defection scene — the rare branch of B

Retained from the first draft of this doc; Ethan's *"rarely asking for a choice"* makes
it the exception rather than her default.

### 🔴 The choice must not be strictly worse in one direction

| | your patron | Wall | net |
|---|---|---|---|
| **Accept** | order completed, paid | Mother Spider hunts you | a reward and a fight |
| **Reject** | order defied, punished | **"No boon"** | a punishment and nothing |

Reject loses on every axis, and a player learns that in one firing — after which
everyone accepts forever and she never turns anyone, so the premise never occurs.

**Do not soften `No boon`** — it is the most in-character line in the proposal, a god
who cannot conceive that she owes anyone. Fix it by separating *the moment* from *the
payment*: nothing at the scene, and something arrives days later, unattributed, never
confirmed as hers. A player who *suspects* they were paid and cannot prove it is a
better outcome than one handed a diamond.

⚠️ And the opposite failure: if rejection pays well it becomes a farm — take orders you
never intend to fill, reject, collect. Rate-limit to once per order.

### `defect_offer` — the pitch, rewritten for ambiguity

Ethan's draft named the rival god (*"that vile god of yours"*) and stated a clean
transaction, which made her sound like a quest-giver negotiating. She is not
negotiating.

```
You have been asked to take something of mine.

I am not going to stop you.
I want you to understand that I could.

They promised you something for it. They always do.
I have been watching you longer than they have.
I know what you actually want, and it is not what you asked them for.

So. Take it, or do not.
```

Options, in fiction:

```
[ It is already done. ]        -> accept
[ Not for them. ]              -> reject
```

`Not for them` — they refuse their own god, they do not join Wall. She is owed nothing,
which is why "no boon" lands.

### `defect_accepted` — she comes apart

```
Fine.

Monster.
Demon.
Murderer.

monster.
```

⚠️ **The lowercase repeat is the line.** Not a typo, must not be "fixed" later. She
runs out of worse words and returns to the first one, quieter. Grief, not anger.

Then **Mother Spider**: `goety:brood_mother` recommended over
`born_in_chaos_v1:mother_spider` — both installed and spawn-egg-verified, but Goety
holds Ethan's *"we will only use goety for minions"* ruling and is visibly the grown
version of the `spider_servant` her brood boon already hands out. `/summon`, never
`createEntity().spawn()`.

### `defect_rejected` — she was never in doubt

```
I knew you would see it.

You understand what I am doing. What I have to keep.

Go home.
```

---

## 7. What this rides on — mostly already built

| need | status |
|---|---|
| kill orders, deadline, one-per-god | ✅ `killorder.js` |
| a choice scene | ✅ `ritual.begin({lines, options, onChoose})` |
| defying your own patron has a cost | ✅ `release.js` — Salvage releases after **3 refusals**; a rejected order IS a refusal |
| the retaliation *pressure* | ✅ **the inverted coefficients**, shipped 2026-08-16 — champion dies → rage +8 → her attention slides off them → their `power` falls, `spawns` around them rise |
| per-god colour | ✅ `voice.js` `COLOUR[god]` |
| finding a killer | ✅ `event.source.player` |
| **broadcast** | ❌ **does not exist** — the one new primitive |
| **Blade's defection cost** | ❌ his streak is `buff_death`, not refusal — defying him currently costs **nothing** |

---

## 8. Open rulings

1. ~~**Salvage's warning** — does she warn her champion?~~ ✅ **ANSWERED 2026-08-18**
   — she warns. Ethan commissioned the pool, and a warning is information rather than
   something done *to* her champion, so it clears her consent rule. Drafted in
   `docs/44` §0c.
2. **Grudge decay** — does a grudge expire, or is it `release.js`-style never-forgives? (§3)
3. **Mining fatigue duration** — and is Forge's reprisal too harsh for a build server? (§3)
4. **What "Wall attempts to stop them" MEANS** mechanically when she is not offering a
   choice. Interpose a mob? Debuff the assassin? Move her champion? **This is the
   single biggest unspecified mechanic in the design.**
5. **Blade's defection cost** — refusing his contract is currently free.
6. **The liar** — reject, then kill anyway. Should be the worst outcome in the system,
   worse than an honest Accept: accepting is honest villainy, rejecting and doing it
   anyway is betrayal. No lines exist for it, and it is the best story the mechanic can
   produce.
7. **Same-god case** — both champions on the same path. Blade would approve of one of
   his killing the other; Wall would be destroyed by it. Needs a guard either way so it
   does not do something absurd.
8. **Art's visible silence** — is the "someone else remarks on it" line wanted, or does
   Art's nothing stay total? (§1)

---

## 9. Reality check — two players

`Lehykt` and `Rehykt`; `paths.js` reports `CLOSED (unbuilt): art, forge`. So **Forge and
Art's postures in §1 cannot fire at all yet** and their pools are written for later. The
live matrix today is Blade / Wall / Salvage, one pair at a time.

- **A, C and D can be soaked** — they fire on ordinary PvP.
- **B needs a deliberate setup** and cannot be passively observed.
- Everything must be **inert-and-silent rather than broken-and-silent** when the
  configuration is absent, and the boot banner must say which of the two it is.
