# 56 — The Goat · Milantros

> **STATUS 2026-08-23** — ✅ **BUILT AND OPEN.** `forge_voice.js` (42 pools, accent
> written) · `forge_events.js` (four events, six explicit zeroes) · Caebrim as her deep
> speaker (`docs/61 §0`) · release rule `never` · **the `CLOSED` table is now empty and
> the live server says so**: *"CLOSED (unbuilt, cannot be claimed): none"*. Every path
> in Veldora is claimable. Verified on a real restart: 0 errors, 301/301 harnesses.

## 0. ⭐ THE CHARACTER BRIEF — Ethan, 2026-08-22

> The Goat in this world wasn't the demon king, she wasn't Alice's lover. In this
> world, the goat was simply **Milantros**.
>
> After her death during the **siege of the demon lord's castle**, she perished.
> Burdened by grief, **Caebrim begged Alice to bring her back.** To bring her back the
> same way. **Alice did not know how.**
>
> It took centuries, but **the night before the ritual, Alice made a choice.** Alice
> raised Milantros, channeling as much power into her with a single wish. *Bring her
> back.*
>
> **Milantros woke up anew, just to see the ritual collapse, and her soul shoot
> upwards.**
>
> *"Yes retcon to female."*
>
> She speaks with a **distinctly southern accent** and should come across as almost
> **kidlike** (as she was a child). She is **fascinated with constructs** and will help
> the player through **gifts and ideas**. The forge has to deal with her **wild ideas**.
>
> Forge gets **the most material gifts** — not only through drops but through Milantros
> herself.

---

## 0b. ⭐⭐ THE BOOK DUMP — Ethan, 2026-08-22, verbatim

> **Milantros** — protagonist of Book 3 and one of the series' three "rocks." Two
> layers: the orphan goat-girl and the merged being she becomes.
>
> * **The goat-girl:** curly blonde hair, large outward-curling goat horns (crowned by a
>   wide-brimmed **cowboy hat**), pale blue eyes, buck teeth, tan skin. **Cheerful,
>   energetic, loves meat and guns.** Orphaned when her village was razed (an ornate
>   **"D"** — for **Darc** — left in the tracks); **adopted by [[char-alice]]** (Book 4
>   epilogue) and raised in Alice's undead camp by **[[char-caebrim]]** (who gives her a
>   **silver rifle**) and **Momma Pille**. ⭐ The adoption DRAMATIZED (Alice Ch 26
>   epilogue, per Rehykt): [[char-caebrim]] & [[char-pille]] find young Milantros alone
>   in the D-razed goat village; Pille insists on keeping her (*"we may be of unlife, but
>   that doesn't mean we can't nurture life"*); Alice sees her (*"Pretty eyes"*), gives a
>   small smile, doesn't object → she's in. ⭐ This first-meeting = the exact scene
>   [[char-caebrim]] recalls in the Ank book (*"you called me ugly and tripped"*) — here
>   Milantros calls Caebrim **"Uggo,"** trips face-first, name-calls everyone
>   (**"Short/Ugly/Weird/Smelly"** at [[char-kayer]], **"Strong Man"** at [[char-ank]],
>   **"Pretty eyes"** at Alice). ⭐ Fun family beat: [[char-ank]] & [[char-kayer]]'s
>   **marriage** is the "worst-kept secret" — everyone knows except Alice, and they
>   nervously hide it from her (*"what if she doesn't approve?"*).

---

## 0c. 🔴 WHAT THE DUMP CORRECTED — three pools were already wrong

I had written her voice file an hour before this landed. **Three pools contradicted
canon**, and one of them contradicted it badly.

| pool | what I wrote | ⚠️ what the dump says |
|---|---|---|
| `hold_weapon` | *"I never understood these."* · *"One of those went through me."* | 🔴 **SHE LOVES GUNS.** Caebrim gave her a **silver rifle**. Weapon-averse is the opposite of her. |
| `hold_food` | chocolate only | **"loves meat"** — meat first, chocolate second |
| `rare_loc_below` | *"She asked for me… nobody's ever asked for me since"* | 🔴 Caebrim did not *ask for* her. **Caebrim RAISED her.** |

⭐ **And it explains the accent I had been treating as an unexplained choice.** A
**wide-brimmed cowboy hat** over goat horns, a **silver rifle**, meat, and guns. The
southern voice is not a flavour note bolted on — it is the whole silhouette, and it has
been sitting in Ethan's whisper line since 2026-08-05.

---

## 0d. 🔑 THE FAMILY — and it re-writes §4 of `docs/57`

Everyone in the depths is **Alice's found family**, and Milantros is the one who was
adopted rather than raised from the start:

| | |
|---|---|
| **Alice** | adopted her. *"Pretty eyes."* A small smile, no objection, she's in. |
| **Caebrim** | one of the two who found her — **raised her**, gave her the silver rifle |
| **Momma Pille** | the one who insisted: *"we may be of unlife, but that doesn't mean we can't nurture life"* |
| **Kayer** | ⭐ got called **"Short/Ugly/Weird/Smelly"** by a small goat girl on day one |
| **Ank** | got called **"Strong Man"** — ⭐ and is **married to Kayer**, which everyone knows except Alice |

### 🔴 "Kayer hates Milantros" now has a real cause, and it is not the one I guessed

`docs/57 §4` says the motive is **mine** — jealousy over Alice's attention — and flags it
as a reading. **The dump replaces it with something better on both counts:**

1. ⭐ **A small child called her Short, Ugly, Weird and Smelly, and then was adopted by
   her mother.** That is funnier AND crueller than jealousy, and it is Ethan's brand
   rather than mine — a grudge that is completely real to the person holding it and
   completely ridiculous to everyone else.
2. It is still *about Alice*, so the shape I built holds. It is just no longer abstract:
   **Milantros is her adoptive sister**, and the coldest thing in the world is losing an
   argument to a nine-year-old who is now a god.

🔑 **And Milantros does not know**, which was already the design (`docs/57 §4`) and is now
much more likely to be literally true — she name-called *everybody* that day. She has no
idea one of them kept score.

### ⭐ CAEBRIM IS HER MOTHER, NOT HER PETITIONER — the deep speaker just got much heavier

`deep_speaker.js` registers Caebrim as **Forge's** voice in the dark (`docs/57 §3`), which
I justified as *"the one who begged Alice to raise her."* **That was the thin version.**
She found her in a razed village, kept her, raised her in an undead camp, and put a silver
rifle in her hands.

> *"you called me ugly and tripped"* — Caebrim, recalling their first meeting, in the Ank
> book.

⭐ **Caebrim's own canon memory of Milantros is that first meeting**, and the champion of
Milantros walking into her dark is the closest she has come to her since. That beat is
Ethan's and it belongs in the confession, replacing the wording I drafted.

---

## 0e. ⚠️ Not building on these, but they are now on the table

- **The silver rifle.** TACZ guns are already in the pack and already Salvage's lifeline.
  A silver rifle as Milantros's `high_gift` is the most obvious unbuilt hook in the repo.
- **Darc** and the ornate **"D"**. A named antagonist with a calling card, and the reason
  she was orphaned. Nothing in Veldora uses it.
- **Momma Pille** — a fourth undead with the single warmest line in the dump.
- **Ank and Kayer are married.** `docs/53` has Kayer as the one who loves Alice and has
  "no allies"; a *husband* changes that sentence. ⚠️ **Flagging, not resolving** — the two
  can coexist (she loves Alice differently) but somebody should say so on purpose.
- **"The merged being she becomes."** Book 3. Almost certainly not the in-game version,
  and I am not touching it.

---

## 1. 🔴 THIS IS A HARDER REPLACEMENT THAN KAYER'S

`docs/22` today:

> **Forge — The Thief** · `krampus` · **he**
> *"Angry, greedy. He wants everything you have and everything you will have."*
> Demanding, ungrateful, escalating. Never satisfied, never thanks you, treats every
> delivery as overdue. The only patron who takes **future** production.

**Every single word of that inverts.** The Thief is the most *taking* god in the
pantheon; Milantros is the most *giving*. He is angry and adult and male; she is
delighted and a child and female. He is never satisfied; she turns up with presents
unprompted.

⚠️ **The retcon is wider than a pronoun.** `he/him` appears across at least six docs
for Forge, plus `krampus` as a seed mob and "The Thief" as a title. That sweep is
larger than the Nightmare one and should be done in a single pass, not incrementally.

---

## 2. ⭐ SHE IS THE ANTI-KAYER, AND THAT IS WHY THE PANTHEON NEEDS HER

Read the two briefs side by side. They were written two hours apart and they are
opposites on **every** axis:

| | **Kayer** — the Matriarch | **Milantros** — the Goat |
|---|---|---|
| age | ancient, deliberate | **a child** |
| temperature | cold, clinical, almost cruel | delighted, warm, southern |
| can she touch the world? | **no** — she must manipulate | **yes**, and constantly |
| what she does | asks you for things | **gives you things** |
| secrets | never gives one | ⭐ *probably cannot keep one* |
| how she became a god | raised deliberately, the most powerful undead ever made | ⭐ **BY ACCIDENT — the ritual collapsed** |
| what a gift means | an appraisal, and a warning | a gift |

🔑 **They are the two strongest gods** (`docs/54 §0`) and they are the two ends of the
same question: *what does a god do with a mortal?* Kayer uses one. Milantros makes
friends with one.

🔴 **AND THE OPPOSITION IS PERSONAL, NOT JUST THEMATIC** — Ethan, 2026-08-22: *"oh yea and
**kayer hates milantros** btw."* The coldest god in the game hates the warmest one, and
the warmest one almost certainly does not know. It is the first hostility in the pantheon
that is about **attention** rather than power, and it is the missing trigger `broadcast.js`
has been waiting for. Full triangle — Caebrim asked, Alice paid, Kayer resents, Milantros
is oblivious — in **`docs/57 §4`**.

⭐ **And that is what makes the accident matter.** Kayer was *made* — chosen, funded,
poured into. Milantros was an afterthought whose soul went up because a spell broke.
**The most benevolent god in the pantheon is the one nobody meant to create.**

---

## 3. 🔴 "WILD IDEAS" ARE VOICE, NOT MECHANIC — corrected 2026-08-22

> Ethan: *"wild ideas, these are less real ideas and **just her rambling in your ear**."*

**I had this wrong and it was the riskiest thing in the design.** I read *"the forge has
to deal with her wild ideas"* as an event class that is allowed to be WRONG — the gift
slightly too strong, the contraption that works but not as promised — and then spent a
section worrying about the thin line between *charming misfire* and *feels broken*.

**There is no line, because nothing mechanical is ever wrong.** Her events are all
straightforwardly good. The "wild ideas" are her TALKING. What the champion deals with is
a small dead girl narrating his day at him.

⭐ **AND THE MECHANISM ALREADY EXISTS.** `idle.js` picks a weighted context every roll —
`combat` · `near_<god>` · `hold_none` / `hold_item` / `hold_weapon` / `hold_food` ·
`loc_above` / `loc_below` · `guidance` — and its own comment states the rule that makes
this work:

> *"⚠️ A god with no pool for the chosen context says NOTHING. It does not fall back."*

**So chattiness is not a rate, it is COVERAGE.** Every other god is quiet mostly because
they have gaps. Measured across all four existing voice files:

| context | blade | wall | salvage | art | **Milantros** |
|---|:--:|:--:|:--:|:--:|:--:|
| `guidance` | ✅ | ✅ | — | ✅ | ✅ |
| `combat` | — | ✅ | ✅ | ✅ | ✅ |
| `hold_weapon` | — | ✅ | ✅ | — | ✅ |
| `hold_food` | — | ✅ | ✅ | — | ✅ |
| `hold_item` | — | — | — | — | ⭐ ✅ |
| `hold_none` | — | — | — | — | ⭐ ✅ |
| `loc_above` / `loc_below` | — | ✅ | ✅ | above only | ✅ |
| `near_<god>` ×4 | — | ✅ | 3 of 4 | 3 of 4 | ✅ all |
| `rare_` twins | — | 2 | 2 | 1 | ⭐ most |

🔑 **`hold_none` and `hold_item` are defined by NOBODY.** Two of the four hold contexts
are dead air for the entire pantheon. Milantros filling them makes her, precisely and
measurably, **the only god who talks to you while you are holding nothing and doing
nothing.** That is the ruling, implemented, with no new code and no new gate.

⚠️ **AND IT COSTS NOTHING TO GET WRONG.** A rambling pool that misses is a line you
scroll past. The event class I had designed could have taken something from a player,
which `docs/00` forbids outright. The ruling removed a whole category of risk.

⚠️ **ONE TENSION TO CONFIRM.** `docs/54 §0` has Ethan's own chart line: *"Forge —
**Quietest god**, smartest champion."* A god who rambles constantly is not obviously the
quietest one. **My reading:** *quietest* means least **consequential** — she never
demands, never summons, never orders a death, and has the fewest events of anyone. Her
word count is the highest in the pantheon and her demand count is zero. Those are
different axes and both can be true. **But it is a reading.**

---

## 4. Her chart writes itself, and it mirrors Kayer's exactly

Kayer is structurally the **choice column** because she cannot act. Milantros is
structurally the **help rows** because helping is all she wants to do:

| kind | proposed | why |
|---|:--:|---|
| **Challenges** *(wave / forced)* | **0** | she would never send something to hurt you |
| **Duels** *(wave / choice)* | **0** | nor offer to |
| **Buffs** *(status / forced)* | **++++** | ⭐ she gives without being asked. The ONLY god who should |
| **Boons** *(status / choice)* | **++++** | and asks too, when she remembers to |
| **Invade** *(hurt others / forced)* | **0** | 🔑 she does not hurt people |
| **Attacks** *(hurt others / choice)* | **0** | not even by proxy |
| **Aids** *(help others / forced)* | **+++** | she helps your friends without asking you first |
| **Support** *(help others / choice)* | **+++** | ⭐ nobody else is above `+` here |
| **Assassinations** *(kill order / forced)* | **0** | — |
| **Contracts** *(kill order / choice)* | **0** | ⭐ **she is the only god who never orders a death** |

⭐ **FOUR KINDS, AND NOT ONE OF THEM HARMS ANYBODY.** Kayer's four are all *asked*;
Milantros's four are all *help*. Two gods, four events each, zero overlap — and the
pantheon suddenly has a real moral spread instead of five shades of demanding.

⭐ **She is the only patron who uses the FORCED column generously.** `docs/23`'s rule
is *"choice always gives a reward, no choice often gives none"* — which reads as
forced = demanding. **She breaks it in the other direction:** she buffs you without
asking because it did not occur to her to ask. Same mechanic, opposite meaning.

---

## 5. ⚠️ Things I will not invent

- **"Quietest god, smartest champion"** (`docs/54 §0`) vs a chatty, excitable child.
  My read: *quietest* means she **intrudes least** — fewest events, no demands, never
  a summons — not that she uses few words. When she does appear she talks a lot.
  **Confirm.**
- 🔑 **CAEBRIM IS THE LINK BETWEEN TWO GODS.** **She** begged Alice for this, and she is
  one of the two siblings banished to the depths who will not speak to Kayer (`docs/53`).
  **Did the collapsed ritual cause her banishment?** That is the obvious inference and I
  am not making it. *(Her pronoun was `he` here until Ethan corrected it 2026-08-22 —
  it was my inference, not his. `docs/57`.)*
- ✅ **ANSWERED — she knows.** Ethan, 2026-08-22: *"She knows, she's been dead for a very
  long time."*

  ⭐ **This is the thing that stops her being a cartoon, and it is bigger than it looks.**
  Not a child who does not understand what happened to her — a child who understands
  perfectly and stopped finding it interesting several centuries ago. She is not in
  denial and she is not grieving. **She is the only god in the pantheon who is at peace**,
  and she got there by having had a very long time.

  🔑 **That is the real anti-Kayer axis**, deeper than warm/cold. Kayer is the most
  powerful thing Alice ever made and she is *bitter* — she has everything except the one
  person's attention she wants. Milantros was an accident, died, knows it, and is fine.
  **The one who was made carefully is the unhappy one.**

  ⚠️ Consequence for whoever writes her: **her death is not a secret and not a wound.**
  She can mention it in an ambient line the way you would mention the weather. Nothing
  about it should read as a reveal, and no pool should treat it as one.
- ✅ **ANSWERED, BY ETHAN, IN AUGUST.** The accent is not new. `stalker.js` has carried
  his own whisper lines since 2026-08-05:

  > *"The goat accidentally spills **his** entire bag, you try not to look"*
  > *"The goat makes a goat noise"*
  > *"The goat whispers in a **distinctly southern accent**. You don't get the reference"*

  ⭐ **The goat, the accent, the clumsiness and a book reference — all four, three months
  before the brief.** Milantros is not a retcon of these lines; the brief is what they
  were always describing. One word changes: `his` → `her`.

  🔴 **AND THE WRITING QUESTION IS RULED THE OTHER WAY.** Ethan, 2026-08-22: *"can we
  actually alter all the dialogue so the accent is written?"*

  I had argued for rhythm and word choice only, on the strength of that whisper line.
  **He overruled it and he is right:** the whisper is a NARRATOR describing her from
  outside, and these pools are her actually talking. A narrator can say *she has an
  accent*. A character has to have one. All 42 pools rewritten.

  ⭐ **THE ONE RULE THAT KEEPS IT READABLE — consonants yes, vowels no:**

  | | |
  |---|---|
  | ✅ drop the g | buildin', somethin', nothin', fixin' |
  | ✅ contract freely | y'all, ain't, gonna, oughta, 'em, 'bout, 'cause, s'pose |
  | ✅ regional vocabulary | reckon, yonder, a mess of, right quick, well now, shoot, mighty |
  | 🚨 **never respell a vowel** | no "Ah", no "yew", no "mah", no "thang" |

  **Eye-dialect on vowels is where a written accent stops being a voice and becomes a
  costume**, and it makes a pool unscannable. Consonants and contractions carry the
  entire sound for free. Enforced by a check in the build notes; zero violations.

---

## 6. What is needed

| | |
|---|---|
| ❌ `forge_voice.js` | does not exist |
| ❌ `forge_events.js` | does not exist |
| ❌ her **one voice rule** | the thing that makes a line hers before you read it |
| ❌ the **wild idea** shape | §3 — how wrong is she allowed to be? |
| ❌ the retcon sweep | "The Thief" · `krampus` · he/him across 6+ docs — and her `stalker.js` CAST still reads `['born_in_chaos_v1:krampus', 'The Thief']` |
| ✅ drops | done, live-validated (Create, plus her chocolate) |
| ✅ coefficients | done — mercantile, `drops` 5.0, the highest in the table |
| ✅ the name | Milantros, the Goat, **she** |

⭐ **Her `drops` coefficient is already 5.0 — the highest of any path** — and
`docs/23` justifies it as *"rare, and then enormous."* That was written before this
brief and it turns out to be exactly right for *"Forge gets the most material gifts."*
The numbers agreed with the lore before the lore existed.
