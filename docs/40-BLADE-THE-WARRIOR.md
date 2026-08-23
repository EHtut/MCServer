# BLADE — The Warrior *(as built)*

> ✅ **COMPLETE 2026-08-15.** The first god finished end to end, and therefore **the
> reference implementation.** **Wall, Forge, Salvage and Art** are built against this
> shape — see **`docs/41-BUILDING-A-GOD.md`** for the procedure.
>
> 🚫 **The roster is FIVE.** Crown was merged into Wall on 2026-08-14 (`docs/35` §6)
> and is not built. Blade's `HOSTILE_TO` still lists `crown` only because the key
> stays claimable in `paths.js` until the world reset.
>
> | | |
> |---|---|
> | **what he is** | `docs/40` — this file |
> | **how to build another** | `docs/41-BUILDING-A-GOD.md` |
> | **why every number is what it is** | `docs/audit/Blade-BuildHistory-2026-08-15.md` (1,011 lines, verbatim) |
> | **his scene text** | `docs/28-THE-SCENES.md` → generated into `introductions.js` |

---

## 0. ⭐ THE CHARACTER BRIEF — Ethan, 2026-08-16. **This supersedes §1.**

> ### The world, in brief
> The **Goddess of Death** opened a portal into the realm of the gods, and the world
> broke worse than it already was. **The angels came through.** She was driven
> underground with her falsehoods, and in the tearing, **five undead exploded into
> godhood.** The Warrior is one of them. **The Matriarch** leads the five in an endless
> war on the Goddess below, and sends champions down into the depths to fight it. Most
> do not come back. The player is one of the champions.
>
> ### Who he was
> **Grand general of the Church.** He survived the final siege of the **golden city** —
> went in to bring out **the Daughter of Arkh**, and swore over the ruin that he would
> protect his home. Thousands took heart from what he did there; the story travelled
> further than he did.
>
> When the Goddess shattered the world, every undead alive broke with it. So did he.
> **He didn't ascend so much as get pushed**, while the old gods were torn apart around
> him.
>
> ### 🔑 THESIS
> **"Strength is the only apology I have left."**
>
> He was the one who was supposed to hold, and he didn't, and the only restitution he
> can imagine is making the next one unbreakable.
>
> ### What he wants from the player
> **To survive without him.** He drills you past exhaustion because the last people who
> relied on him died doing it. He is not testing loyalty and does not want devotion — he
> wants you competent enough that his failure cannot repeat through you.
>
> ### 🚨 THE LIE
> **That he's hard. He isn't.** He is a fundamentally kind man performing the discipline
> he believes would have saved his city, and he cannot sustain it — which is why he
> softens. **The softening is not character growth. It is the performance failing.**
>
> ### The arc — three stages
> 1. **Cruel.** Orders only. No reasons, no questions answered. Refuses to discuss
>    himself. Treats the player as materiel.
> 2. **Cracking.** Begins explaining *why* a thing is done that way — which means giving
>    a memory to attach it to. Lore leaks sideways, always as instruction, never as
>    confession.
> 3. **Open.** Talks about the siege. Talks about what he did and didn't do. Tells you to
>    rest. **Starts asking questions instead of giving orders.**
>
> ### Voice rules
> * Imperative mood, **no subordinate clauses**, in stage one. *Stand. Again. Drop it faster.*
> * **Sentence length is the tell.** Short = closed. Long = trusting. **Questions = fully open.**
> * He never says sorry. He says **"you're not ready,"** which means the same thing and
>   costs him nothing.
> * ⭐ **He does not use the player's name until stage three.** Before that: *soldier,
>   recruit, you, Champion*. The first use of the real name should land like a hand on the
>   shoulder — **once, quietly, in the middle of something else.**
> * He never boasts and never references his own legend. If a player brings it up he
>   changes the subject or contradicts it.
> * He talks about **the dead in specifics** — names, ranks, small habits — and about
>   **himself in generalities.**
>
> ### Sample lines
> **One** — *"Stand."* · *"Again."* · *"You held that one too long. Drop it faster."* ·
> *"I don't need you brave. Brave is cheap and it doesn't carry."*
> **Two** — *"Grip it lower. — The man who taught me that died on a stair. He was right
> about the grip."* · *"The walls were forty feet thick. I remember thinking that meant
> something."*
> **Three** — *"You can stop now."* · *"Sit down. I'll talk, if you want it."* · *"I was
> the general, and I lived. Work out what that means and you'll know everything about me."*
>
> ### In the depths: **CAEBRIM**
> **She raised him. She called him *my boy*.** Her counter-thesis is the exact inverse:
>
> > **You were never supposed to be strong. You were supposed to come home.**
>
> She speaks to the player **about** him rather than to them — correcting him, gently,
> from below. Every lesson he gives has her voice on the other side of it saying he never
> needed to learn it. **She is not hostile. That is what makes her hard to listen to.**
>
> > *"He is telling you to get up. He never got to lie down."*

### 🚨 What this brief BREAKS, and it is not small

**1. It inverts his existing high tier.** *"Short = closed, long = trusting, questions =
fully open"* makes stage three **talkative**. But `high_silence` — his largest pool, 16
lines, and the best-written thing in the file — is *"Noted."* / *"Hm."* / *"Good."*
Those are **stage-ONE lengths.** As built, a player who has earned his trust gets a
**colder** register than one who has not. The lines are not wasted; they are
**mislabelled**, and belong at low/medium.

**2. `harvest_offer` is already stage three, and always was.** *"You could stay. I would
not ask twice."* is the only place he currently talks like a man instead of a drill. It
is the model for the whole tier.

**3. The counter is `enemies slain`** — kill count now has to carry a *relationship*
arc. It just about works, since competence is what makes him relax, but 50/200 were
never chosen with three named stages in mind.

✅ **CLOSED 2026-08-23. THE SPEAKER IS CAEBRIM** — Ethan ruled the whole map at once, and
she holds blade AND forge. Alice speaks to Mera (wall), Kayer speaks for herself (art),
Salvage keeps her Keeper. **Not one word of the confession changed** — only the nameplate.
`docs/61 §0`. The stale note below is kept for the reasoning.

🔴 **UPDATE 2026-08-23 — THIS QUESTION HAS MOVED, TWICE.** (a) Caebrim is now
**Forge's** deep speaker (`docs/57 §3`), so she is no longer a candidate to replace
Blade's. (b) The book canon points hard at a different answer: **the Speaker may be
KAYER** — every line of the confession fits her, and *"Blinded by faith"* fits nothing
else. The evidence, and the real counter-case, are in **`docs/60 §2`**. ⚠️ Still open,
and it is the biggest lore ruling left.

**4. Caebrim vs the Speaker.** `deep_speaker.js` already gives Blade a deep voice —
*the Speaker*, grey, confessing about **Gregor**. Caebrim is a different character with
a stronger idea. **Decide whether she replaces the Speaker or stands beside her** before
either gets written.

### 🔴 THE RULING — Ethan, 2026-08-16. **I had this wrong.**

> *"The docs are wrong. **Gregor is the Blade. The Daughter of Arkh is Alice.** Mera
> just has the last name arkhdottir (there's too much to explain why)."*

I proposed that the Daughter of Arkh was Wall, on the strength of *Arkh·dottir*. **It
is not.** The surname is a red herring — there is a reason and it is not being spent
here. The corrected facts, which are now canon:

| | |
|---|---|
| **Gregor IS the Warrior.** | Not his champion — *him*. The man who became the god. |
| **The Daughter of Arkh is ALICE** | the doctor in the dustlands, `docs/43` §0 |
| **Mera is his daughter** | and `Arkhdottir` is just her name |
| **Neither of them knows** | GM note, `docs/43` §0 |

So the shape is better than the one I guessed. **He went into the golden city for
Alice** — and Alice is now in the dark, on the other side of the war, as the voice
that tells his daughter's champion to stop reaching. *"Strength is the only apology I
have left"* is an apology owed to a woman three hundred blocks down, and to a daughter
who does not know he is her father.

His line — *"The Spider… **Why can I hear her name?**"* — is him half-recognising his
own child.

> ⚠️ **What this leaves open.** `docs/43` §1 calls Gregor *"a once-great warrior of the
> church, lost too soon"* and **Blade's dead champion**, and `deep_speaker.js` has the
> Speaker apologising to Gregor at the bottom of the world. If Gregor *is* Blade, he
> cannot be his own dead champion, and the Speaker is apologising to a god who is still
> standing. **That confession needs re-pointing** — it is the one piece of built
> content the ruling breaks.

### 🔑 NAMES ARE NEVER SPOKEN — Ethan, 2026-08-16

> *"we never use names. only titles. **The names only come at the god's weakest.**"*

**The Warrior. The Spider. The Doctor. The Matriarch.** Never Gregor, Mera, Alice — not
in any pool, not in any scene — until the moment a god breaks. That makes a name the
single most expensive word in the game, and it means:

* every existing line that names somebody is either a **stage-three reveal** or a bug;
* **Blade's *"Why can I hear her name?"* is exactly right** — he cannot say it, which
  is the point;
* Caebrim and Alice are **titles-in-waiting** in the deep speaker, not labels to print.

### ⭐⭐⭐ AND THIS RULE TURNS OUT TO BE HIS CANON (`docs/60 §0`, 2026-08-23)

The rule above was made for **pacing**. Ethan's book notes then arrived and said that
Gregor is the character *defined* by a name:

> Ch 28 — he rips up a forged noble certificate rather than be called a Chadson:
> **"It's Court. It will always be Court."** / **"Names mean a lot, Caebrim."**
>
> ⭐⭐ **And he stops being one.** *Gregor Kayer Court* → *Gregor Cross*. ⚠️ Canon rule:
> **no middle name = NO PATRON.** "Gregor Cross" is literally the name of an undead who
> belongs to no one.

🔑 **Blade cannot say names because he lost his own.** Nothing needs to change — it was
already true. And *"Why can I hear her name?"* stops being a good line and becomes the
only crack in him: a man who lost the right to names, hearing one anyway.

---

## 1. Who he is *(⚠️ SUPERSEDED by §0 — kept for the reasoning, not the ruling)*

The god of war. Also the Warrior, the Savior, the Golden God — **but not to you.** To
you he is a patron who has already told you your ceiling and offered to raise it
anyway.

He is **not contemptuous.** That was the first draft and it was cut: *"he's
condescending and he puts you down"* (Ethan, 2026-08-15). What replaced it is harder
and more interesting — **a leader you follow despite the edge.** He wants you to
thrive and he is unpleasant about it. At low trust he is a drill sergeant; as trust
rises he opens up, praises you obliquely, and **never becomes actively
encouraging.** His highest register is silence and a single word.

He is a **voice**, never a body. Since the actor reframe the entities that arrive are
his *actors* — he sends them, he is not them. The single exception in the whole game is
one line of narration in his introduction, where you see a figure in shadow with
crimson eyes, and then never again.

**He hates the Spider and says so.** He respects the Dreamwalker's authority without
respecting the Dreamwalker's power. He tells you to lean on the Goat, and to refuse
every deal the Wolf ever offers you.

---

## 2. Every number, in one place

| constant | value | file | what it governs |
|---|---|---|---|
| `GOD` | `blade` | both | the path key everything registers under |
| `MEDIUM_AT` | **50** slain | `blade_voice.js` | low → medium trust |
| `HIGH_AT` | **200** slain | `blade_voice.js` | medium → high trust |
| counter metric | **enemies slain** | `counters.js` | his appeasement axis |
| health floor | **0.75** | `godevents.js` | hearts *and* hunger, before any hostile event |
| event roll | **8% per 600t** | `godevents.js` | one at a time, server-wide |
| `HOSTILE_TO` | `wall`, `crown` | `blade_events.js` | whose champions he speaks against |
| `ICARUS_Y` | **100** | `blade_events.js` | Icarus only fires above this |
| `MARK_DAYS` | **2** | `blade_events.js` | how long the mark stands |
| `TITHE_DAYS` / `TITHE_TICK` | **1** / **20** (1s) | `blade_events.js` | window, and sampling fine enough to catch each swing |
| `CHAMPION` | `born_in_chaos_v1:fallen_chaos_knight` | `blade_events.js` | what the Harvest sends |
| `CHAMPION_TAG` | `veldora_harvest_champion` | `blade_events.js` | how `harvest.js` cleans it up |
| idle cadence | **once per world day**, 6% per 1200t | `idle.js` | shared by every god |
| rare line chance | **15%** | `idle.js` | the `rare_<tag>` sibling roll |
| speaker cutoff | **y −64** | `deep_speaker.js` | below this he cannot reach you |
| confession | **y −120, 10%/1200t, once ever** | `deep_speaker.js` | the Speaker's four stanzas |

**Live at boot:**

```
[blade]   148 fixed + 32 contextual + 616 combinatorial, across 41 tags
[events]  framework LIVE - 11 event(s) across 1 god(s), 8% per 600t, one at a time
[voice]   VELDORA.voice published OK - 2 god(s), 44 tag(s), 810 possible lines
[speaker] the Speaker waits below y-64 · THE CONFESSION armed at y-120
```

---

## 3. His five surfaces

A god is not one system. It is **five**, and they are deliberately independent — any
one can be gated off without breaking the others.

### 3.1 THE VOICE — `blade_voice.js`

Trust-tiered lines under 41 tags, three tiers (`low` / `medium` / `high`) selected by
the counter, plus contextual pools the idle system picks from.

> ⚠️ **`tierOf` returns `null` for an unreadable counter, never `'low'`.** A god who
> cannot read his own counter must say NOTHING. Defaulting to `low` would have made
> every storage failure look like contempt.

**Tag families:** `*_gift` · `*_silence` · `push` · `lore` · `mark_*` · `harvest_*` ·
`near_<path>` · `loc_above` / `loc_below` · `rare_loc_above` · `combat` · `hold_*`

**The rare sibling.** Any pool may have a `rare_<tag>` twin, rolled at 15% before the
common pool. ⭐ **The rare pool is where he is a person** — he had a name once, he is a
prisoner here too, he feels attachment to the Spider he claims to despise, he barely
remembers the sun. **None of it may ever become wallpaper**, which is the whole
argument for the roll.

### 3.2 THE COUNTER — `counters.js`

**Enemies slain**, world-day stamped. This is *appeasement*, deliberately a different
axis from XP/notoriety: XP scales with the hunt and your stats, the counter scales with
whether the god is pleased. It decides the 2×2 — **good/bad event × they choose / you
choose.**

> ⚠️ `get()` returns `null` for unreadable, **never 0.** "He has no record of you" and
> "you have killed nothing" are different facts.

### 3.3 THE EVENTS — `blade_events.js` on `godevents.js`

Eleven registered events plus the Harvest. Rolled at 8% per 600t, one at a time
server-wide, every hostile one gated behind the **0.75 health floor** (hearts *and*
hunger — an event that arrives while you are eating is a bug, not a challenge).

| # | event | tier | shape |
|---|---|---|---|
| 1 | **Gauntlet** | all | waves scaled by trust |
| 2 | **Icarus** | all | guarded on **y ≥ 100** |
| 3 | **The Duel** | high | fleeing earns only a taunt |
| 4 | **First Blood** | all | two-staged, **both stages cost** |
| 5 | *Blindfold* | — | folded into the Gauntlet's announce |
| 6 | **The Tithe of Steel** | medium+ | **sampled, not hooked** — see below |
| 7 | **Hollow Victory** | medium+ | tagged wave, drops cancelled |
| 8 | **The Watcher** | medium+ | a bounded presence |
| 9 | **Understudy** | high | attributes written at summon |
| 10 | **The Broken Rung** | all | reactive, on respawn |
| 11 | **Sharpen** | all | ⭐ a **bargain**, through the ritual |
| 12 | **Run.** | — | the Harvest opener, canon-reserved, fires once |

> ⚠️ **The Tithe is sampled because there is no hook.** `ItemEvents` fires when an item
> is *destroyed*, never when it *takes* damage. So it watches the held item each second
> and, when durability drops by *d*, takes another *d* — **capped so it never lands the
> killing blow.** Blade takes a tithe; he does not break your sword.

> ⚠️ **A `run()` returning `false` does NOT stamp the cooldown.** An event that could
> not happen has not happened, and must be tried again.

### 3.4 THE HARVEST — his handler on `harvest.js`

**Four gods collect. Blade graduates you.**

He sends **the strongest thing he has** — a named Fallen Chaos Knight, from his own
mod, so the actor is made of the same stuff he is. Win and he releases you, tells you
that you are ready, and offers to let you stay anyway. Lose and you take a trust hit,
**which is intended.**

It opens with a **cutscene**: seven lines through the ritual, blind and rooted, the
only time in the game he talks about himself. Timed off `ritual.js`'s own constants —
the heavy silence lands 40t before release, the order 40t after.

> 🚨 **The resolution removes the actor, win or lose, BEFORE the closing line.** A
> defeated champion that stays and keeps swinging turns a graduation into a death loop.
> Measured live; it happened.

> 🚨 **`harvestArrive` refuses if a scene is already running** and returns `false`, so
> `harvest.js` does not stamp it as begun and the phase sweep retries. **A Harvest that
> did not arrive did not happen.**

### 3.5 THE FALL — `fall.js`

Disappoint him enough and he withdraws. His line is written; the mechanism is shared.

---

## 4. The Speaker, and what she does to him

Below **y −64** Blade cannot reach you, and the goddess of death's Speaker talks
instead — grey, patient, asking nothing.

⭐ **Every other system makes the world louder as it gets more dangerous. This one
makes your god go silent.** Descending is not going somewhere dangerous, it is going
**out of earshot**.

At **y −120**, once per champion ever, at 10% per minute spent down there, she
confesses. Four stanzas. She was meant to protect Gregor. She made a choice. She has
been apologising to a god who cannot hear her ever since.

> 🚨 Blade's Harvest cutscene says *"Centuries ago I had a champion… He is long since
> gone. **His end merciful.**"* **She is the mercy.** Nothing in the code connects the
> two scenes — no flag, no trigger, no callback. **The player connects them, or does
> not.** That is exactly why the confession may never repeat.

---

## 5. ⭐ What is HIS, and what is EVERY god's

**This table is the reason the next god is fast.** Blade is ~1,540 lines. Only two
files are his.

| his alone | shared, already built |
|---|---|
| `blade_voice.js` — lines, tiers, tags | `voice.js` — the combinatorial engine |
| `blade_events.js` — his twelve | `godevents.js` — rolling, cooldowns, health floor |
| his Harvest handler *(registered)* | `harvest.js` — the registry, the lock, actor cleanup |
| his counter *metric* | `counters.js` — storage, day-stamping, clock-rollback guards |
| his scene text in `docs/28` | `introductions.js` + `ritual.js` — scenes, blind/root/protect |
| his row in `fall.js`, `regard.js`, `help.js`, `paths.js`, `coefficients.js` | the systems those rows feed |
| — | `idle.js`, `spawner.js`, `phase.js`, `reckoning.js`, `deep_speaker.js`, `notoriety.js` |

**His entire integration surface is 15 calls:**

```
VELDORA.voice.register / registerLines / say / sayAbout / setColour
VELDORA.events.register / attempt
VELDORA.harvest.register / resolve / active
VELDORA.counter.get / add
VELDORA.spawner.wave
VELDORA.ritual.begin / active
VELDORA.paths.pathOf
```

---

## 6. Commands

```
/events            his tier, the health floor, and a per-event reason for every hold
/idle_test         which contexts apply right now, their weights, and a forced line
/harvest           handler status · begin | win | lose
/speaker           your depth vs the cutoff, confession eligibility · confess | reset
/path              the roster — release is ADMIN as of 2026-08-15
```

---

## 7. Files

| file | lines | what |
|---|---|---|
| `pack/kubejs/server_scripts/blade_events.js` | 973 | the twelve, the Harvest, the champion |
| `pack/kubejs/server_scripts/blade_voice.js` | 570 | 41 tags, three tiers, the rare pools |
| `docs/28-THE-SCENES.md` | — | his introduction — **the source of truth.** Regenerate with `tools/gen_scenes.py` |
| `docs/audit/Blade-BuildHistory-2026-08-15.md` | 1011 | every argument and every bug, verbatim |

---

## 8. Still open

| item | status |
|---|---|
| **Absence** — the third exit | ⚠️ **does not exist.** Now load-bearing: release went admin-only 2026-08-15, so the exits are the fall, winning his challenge, and an admin. **Shared infrastructure — every god needs it.** |
| The Speaker's register *after* confessing | she goes straight back to *"your end shall be swift"*. Wants a short `after` pool — **Ethan's writing, not mine to invent** |
| Drop-curve saturation retune | waiting on Ethan's number |
| Trust thresholds 50 / 200 | first guess. To be replaced by a **measured** curve once there is data |
| `EntityEvents.death` NullPointerException | 49 hits, last 08-12, invisible for three days until `logq` was repaired. Has not fired since. **Watch** |
