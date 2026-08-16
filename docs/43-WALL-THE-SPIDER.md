# WALL — The Spider *(as built)*

> ✅ **BUILT 2026-08-15.** The second god. Built from `docs/41-BUILDING-A-GOD.md`
> against Blade as the reference, and the first one to prove the template.
>
> | | |
> |---|---|
> | **what she is** | `docs/43` — this file |
> | **the reference implementation** | `docs/40-BLADE-THE-WARRIOR.md` |
> | **how to build another** | `docs/41-BUILDING-A-GOD.md` |
> | **her scene text** | `docs/28-THE-SCENES.md` → generated into `introductions.js` |
>
> 🚫 **Crown is folded into her** (2026-08-14, `docs/35` §6). ⚠️ **`docs/35`'s
> premise is dead** — it argues the merge on MineColonies, which is not in the pack.
> That doc carries a correction banner; **this file is the truth.**

---

## 0. ⭐ THE CHARACTER BRIEF — Ethan, 2026-08-16. **This supersedes §1.**

> ### Who she was
> **The daughter of the great general** — and, as far as anyone in that world was
> concerned, nothing else. She grew up in high society being introduced as somebody's
> child, and **never once felt like she belonged in a room she was born into.**
>
> She had heard voices since birth. On her eighteenth she went south to the dustlands
> to find them, and reached a hospital, and was treated by **a doctor who looked almost
> exactly like her.** She was lying in that bed, resting, when the world broke.
>
> As she ascended she saw **thousands of souls being forced downward, and she reached
> for them.** She has not stopped.
>
> ### 🔑 THESIS
> **"I saw them falling and I reached. I am still reaching."**
>
> ### What she wants from the player
> **Retrieval.** Not victory, not killing — *bringing things back*. She is **the only
> patron who does not send you down to fight.** She sends you down to fetch, and she
> will keep sending you.
>
> ### 🚨 THE LIE
> **That reaching is the same as catching.** It isn't, and she cannot afford to know
> it — so she will ask you to save people who are already gone, and **will not hear
> the answer** when you tell her.
>
> ### The arc — she TIGHTENS, she does not soften
> ⭐ **The exact inverse of the Warrior, and worth playing deliberately against him.
> He starts cruel and warms. She starts warm and closes her hand.**
> 1. **Open.** Overfamiliar from the first second. Delighted you exist. Gives you
>    things you didn't ask for. Asks nothing difficult.
> 2. **Asking.** Starts naming individuals — specific people, specific levels, details
>    she should not know. The requests get heavier and **she stops noticing.**
> 3. **Desperate.** Asks for the impossible and won't take the answer. Sends you back
>    for someone who cannot be brought up. **Still perfectly kind about it.** That is
>    the horror — she never turns cruel. She just never stops.
>
> ### Voice rules
> * **Fast.** Run-ons, comma splices, sentences that change direction halfway.
> * ⭐ **She uses the player's name constantly** — the exact inverse of the Warrior,
>   who will not use it at all. *Same word, opposite meaning.*
> * **She never gives orders. She asks.** And the asks are harder than orders, because
>   you can refuse them.
> * ⭐⭐ **She speaks about the dead in the present tense.** *"She's on the fourth
>   level."* Never *was*. That is the thesis rendered as grammar, and **it must never
>   slip.**
> * ⭐ **She goes quiet exactly once per conversation**, and that is when the true
>   thing comes out. One short sentence, then straight back to talking.
> * Never talks about herself unless asked, then deflects to the voices.
> * **Never says gone, lost, or dead.**
>
> ### Sample lines
> **One** — *"You're here. You're actually here — okay, okay, sit, I've got things for
> you, most of it's useless but some of it isn't."* · *"I'm not going to make you fight
> anything. I want you to find someone."*
> **Two** — *"Fourth level, past the water. Her name is Ilse and she's still down
> there, I can feel her, she's been there the whole time."* · *"You came back with two.
> Two is — that's good, that's good. There were more."*
> **Three** — *"Go back. Please. I know what you saw. Go back anyway."* · *"Don't tell
> me that. Don't — no. Say the next part."*
> **The quiet line, once** — *"I don't think I'm catching any of them."*
>
> ### In the depths: **ALICE**
> **The doctor with her face.** The last person to be kind to her before the world
> ended, and the only one who could have told her what she was.
>
> > **I let go. It's allowed. Put your hands down.**
>
> Alice is the woman who held someone's hand, set it back on the bed, and left before
> he woke. She is **not** arguing that the Spider is wrong to care — she is arguing
> that **reaching costs the reacher**, that stopping is survivable, and she is speaking
> from experience.
>
> > *"She'll ask you to go back. She always asks. Say no once and see what happens — I
> > promise you it's less than you think."*
>
> ### 🔒 GM NOTE — keep in your pocket
> **The Warrior is her father. Alice is the woman she was made from.** Her father is a
> god above her and her mother is in the dark below her, **on opposite sides of a
> war**, and *the Spider does not know about either.*

---

### 🚨 What this brief COLLIDES with. None of it is small.

**1. Her whole thesis has no mechanic.** *"Retrieval… the only patron who does not send
you down to fight"* — and she currently has **nine events, four of which send spiders at
other players, and none of which involve fetching anything.** The taxonomy in `docs/23`
§VI.0 has no row for *go there and bring something back*, and the no-taking-items ruling
does not cover it, because retrieval is the opposite. **This is the biggest open
question in her design.**

**2. `Assassinations ++` contradicts a voice rule.** An Assassination is a kill order
*with no choice* — and her rule is **"She never gives orders. She asks."** `Contracts
+++` outranking it is the right shape, but the `++` needs a ruling: either she breaks
her own rule once desperate (that is stage three, and defensible), or the row is `0`.

**3. Gregor.** §1 below says her father was **Gregor**, *"a once-great warrior of the
church"* and **Blade's dead champion.** The GM note says **the Warrior is her father.**
Those cannot both be true unless Gregor *is* Blade — which also resolves `docs/40`'s
*"Daughter of Arkh"* into **his own daughter**, and makes the Speaker's apology at the
bottom of the world an apology to himself. Extraordinary if intended, a contradiction
if not. **One ruling settles it.**

**4. Alice is half-built already.** Her deep speaker is **the Doctor** — and Alice is
*a doctor with her face*. `deep_speaker.js` already runs her below y −64. Whether the
Doctor simply *becomes* Alice or they are two voices decides whether that file is a
rename or a rewrite. *(Blade has the same open question with Caebrim.)*

**5. The arc inverts and the code does not know it.** *She starts warm and closes her
hand.* Her tiers are `MEDIUM_AT 10` / `HIGH_AT 50` on **rage**, so the registers already
move the right way — but the `low`/`medium`/`high` naming now reads backwards: her
**low** tier is her most generous and her **high** is her worst.

---

## 1. Who she is *(⚠️ SUPERSEDED by §0 — kept for the reasoning, not the ruling)*

**The Spider. Mera Arkhdottir.** Obsessive. She wants nothing except to stand closer
to her champion, and she is not embarrassed about it.

She is **not the kind patron.** That was the first framing and it does not survive
contact with her own lines: she says *please*, she says *love*, and she repeats a word
when she is losing composure — *"They dare. They Dare."* Blade performs strength. She
performs **need**, and need is worse.

**Her manipulation is the only honest one in the game.** *"They rejected you too. I
won't. I never will."* She is right. She is the only one who says it.

> ### 🔒 Hidden lore — never spoken, never hinted at
> Once known as **Mera Arkhdottir**, daughter of **Gregor**, a once-great warrior of
> the church, lost too soon. **She never knew her father.** In life she was *the*
> champion — a warrior who could wield the golden light of the god of sun. After the
> fragmentation the undead lineage inside her broke free, and she ascended into the
> Spider, goddess of undeath.
>
> Ethan: *"lore is best told through actions and dialogue."* So none of that appears in
> a line. It leaks through the `rare_loc_above` pool — *"I carried a light once. It is
> not mine any more."* / *"My father was a soldier. I am told. I was not there."*
>
> 🚨 **Gregor is Blade's dead champion.** The Speaker apologises to him at the bottom
> of the world; the Doctor tells Wall's champion *"Tell Mera that it's her time."*
> **Nothing in the code connects any of it.** No flag, no journal, no hint.

## What she says about the other four

| | |
|---|---|
| **Blade** | *"The Warrior is a plight on this land. He preaches strength and speed yet hides behind his veil."* |
| **Salvage** | *"I do not trust the Wolf in any manner. Perhaps once she was tolerable. Once."* |
| **Forge** | *"I have known the Goat for centuries… He loved the goddess of death. Now? Now he's a shell."* |
| **Art** | *"The Matriarch has led us gods for centuries yet in that time she has never granted me a place amongst them. What did I do wrong?"* |

⭐ **She and Blade are the first pair a player can hear from both sides.** He already
says *"I despise that damnable god"* **and** *"The Spider and her consort… they are the
closest to my kind. I cannot help but feel attachment."*

---

## 2. Every number, in one place

| constant | value | file | what it governs |
|---|---|---|---|
| `GOD` | `wall` | both | the path key |
| colour | **`§5§l`** dark purple | `wall_voice.js` | every line she speaks, anywhere |
| `MEDIUM_AT` / `HIGH_AT` | **10** / **50** rage | `wall_voice.js` | voice tiers, aligned to the slider midpoint |
| counter metric | **rage** | `wall_events.js` | +1 raised · −1 slain · **+8 your death** · **−2 per quiet day** |
| `RAGE_CALM` / `RAGE_FURY` | **10** / **90** | `wall_events.js` | pure boons ↔ pure attacks |
| `CREDIT_RANGE` | **16** | `wall_events.js` | how near a summon must be to credit you |
| `TARGET_FLOOR` | **0.6** | `wall_events.js` | ⭐ health floor on *the victim* |
| `AWAY_DAYS` | **2** world days | `wall_events.js` | before she notices you were gone |
| `HOSTILE_TO_PLAYERS` | **true** | `wall_events.js` | the PvP switch |
| actor | `born_in_chaos_v1:mother_spider` | `wall_events.js` | her Harvest |
| what she sends at others | `minecraft:spider` + `born_in_chaos_v1:baby_spider` | | 3 normal / **5 buffed** |
| buffed stats | 40 hp · 0.36 speed · 6 dmg | | written at summon, never after |
| her speaker | **the Doctor**, `§b` light blue | `deep_speaker.js` | below y −64 |

**Live at boot:**

```
[wall]    The Spider speaks - 94 fixed + 16 contextual + 624 combinatorial,
          across 29 tags. Tiers at 10/40 rage.
[wallev]  boon (all tiers) / offer (MEDIUM - she asks) / web (HIGH - no choice)
[speaker] wall -> the Doctor (death_doctor) - 18 lines + 3 confession cutscenes
[voice]   4 god(s), 76 tag(s), 1562 possible lines
```

---

## 3. ⭐ Rage is one slider, and it answers to death

`mood(p)` is **0 at rage <= 10** and **1 at rage >= 90**, linear between. Every event's
weight is a curve over it — `godevents.js` accepts a weight *function* for exactly this.

| rage | mood | boon | ask | attack | |
|---|---|---|---|---|---|
| 10 | 0.00 | **100%** | 0% | 0% | only boons |
| 30 | 0.25 | 59% | 25% | 16% | |
| 50 | 0.50 | 38% | 31% | 31% | she asks most here |
| 70 | 0.75 | 19% | 24% | 57% | |
| 90 | 1.00 | 0% | 0% | **100%** | only attacks |

⭐ **The ask peaks in the middle and vanishes at both ends** (`4m(1-m)`). At low rage she
has no reason to ask; at high rage she no longer waits for an answer. The band where you
get a say is the band where she is still conflicted, **and it closes on its own.**

### What moves the number

| | |
|---|---|
| **+1** | a minion raised — the family grows |
| **-1** | a minion slain — something of hers is killed |
| **+8** | **you died** — the worst thing that can happen to her |
| **-2/day** | a whole day and nobody died. She settles |

Four quiet days undo one death. Every input is the same feeling measured differently:
*something of hers was taken.*

⭐ **She is calm when you are safe and dangerous when you are not — and the danger points
at everyone except you.** A player who dies repeatedly is not punished; the *server* is.

### The nine

| event | curve | what |
|---|---|---|
| `boon` | boon x4 | regeneration + absorption |
| `feast` | boon x3 | saturation + regeneration. She feeds you first |
| `carry` | boon x3 | speed, jump, slow-fall. The web moves you |
| `brood` | boon x2 | **two goety spider servants** |
| `offer` | **ask x5** | permission to attack, via the ritual. Refusable |
| `snare` | attack x3 | slowness II + weakness on another player |
| `dark` | attack x3 | blindness on another player |
| `web` | attack x4 | buffed spiders, **3 at calm to 6 at fury** |
| `swarm` | attack x2 | **nine** buffed spiders. Guarded to mood >= 0.7 |

> ⭐ **A loop nobody designed.** `goety:spider_servant` is a player-owned summon, so
> `brood` trips her own minion hook and **raises her rage**. *She cannot give you family
> without becoming more dangerous to everyone else.*

> ⚠️ **Her health floor is on the TARGET.** `godevents`' floor guards the player an event
> fires *for*, and hers lands on someone else. Under 60% health, or mid-scene, she skips
> them.

> ⚠️ **Unreadable is not calm.** `mood()` returns `null` on an unreadable counter and every
> weight scores 0, so she says nothing at all. Returning 0 would make a storage failure
> look like serenity and hand out boons forever.

---

## 3b. 🚨 She never lets go

Ethan, 2026-08-15: *"the wall doesn't ever drop or release you. the only way to be
released is from winning the harvest."*

**Her own writing already said so, and the code contradicted it.** The last rung of her
grief ladder is *"This is mercy, darling. This is me keeping my promise. I will not lose
you again"* — and that line **fired the fall.** She promised not to lose you and let you
go in the same breath.

`fall.js` carries `NEVER_LETS_GO = { wall: true }`. Her regard maxes, she says it, and
nothing happens. You are still hers. The refusal is logged, so *"she refused"* and *"the
fall is broken"* stay distinguishable.

> 🚨 **THAT MAKES HER HARVEST THE ONLY DOOR.** `/path release` is admin-only, the fall
> refuses her, and absence does not exist. If `harvestWin` fails to release, a Spider
> champion is bound forever.
>
> ✅ **Which exposed that release was never real for anyone.** Blade's `harvestWin` had
> been logging *"released, and offered the stay"* since it was written **while releasing
> nothing** — `releasePath` was private to `paths.js` and only the (now admin-only)
> `/path release` command could reach it. The log was describing an intention.
>
> `VELDORA.paths.release()` is published now. Blade calls it 140t after his closing
> lines, the Spider 160t after hers, and both log loudly if it is ever missing.

## 4. The counter — what counts as a minion

**Audited from the jars, not guessed.** Goety ships **85 entities ending `_servant`** —
that suffix *is* its marker for a player-owned summon. Occultism uses `_familiar`.
Their unbound variants carry `wild`/`unbound` and are excluded.

> ⚠️ **Matched by SUBSTRING, never equality.** `String(entity.type)` is not the bare id
> — it resolves to an EntityType object whose toString is a description key. This
> project shipped that bug twice (`the_hunt`, `nemesis_tally`), both times **silently**,
> because "could not read" and "not a minion" shared a value. `isMinion()` returns
> `null` for unreadable and `false` for no.

> ⚠️ **Ownership is an approximation, declared as one.** Both mods store an owner in NBT
> but the shape differs per mod *and* per entity, and reading it wrong fails silently. A
> summon appears beside its summoner, so nearest-Wall-walker-within-16 is right in every
> case that happens. The owner is then **stamped on the entity**, so the debit on death
> is exact even if the minion dies alone across the world.

---

## 5. Her voice — three layers, 734 possible lines

| layer | tags | lines |
|---|---|---|
| `LINES` — whole | 17 | 94 |
| **`FRAGS` — opens × closes** | **7** | **624** |
| `CONTEXT` — idle | 5 | 16 |

Ethan, having read Blade's files: *"they have so so much more in them that she doesn't
have. that should be the baseline."* He was right — the gap was a whole **mechanism**.
She was only calling `registerLines()`, so every pool was exactly as deep as the number
of sentences typed into it. 616 of Blade's 796 came from the layer she lacked.

> ⚠️ **The combinatorial constraint:** `voice.js` joins `open + ' ' + close` and picks
> each half **independently**, so every close must read correctly after **every** open in
> its pool. Hers are short and self-contained, connected emotionally rather than
> logically — which suits her, because she does not argue a point. She just keeps
> talking to you.

**Her death ladder** is five lines on `regard.js`'s *grief* beat, escalating to the
fall. They predate the merge and survive it — and one got better by accident:
*"I will not lose you again"*, written for a codependent mother, now reads as a woman
who has already lost a family once.

---

## 6. 🚨 Refusing her introduction kills you

Ethan: *"Kill player* (Like seriously.)"*

Every other patron lets you walk away — Crown was written to *respect* it. She does not.
It lives in `introductions.js` as a map, **not** as scene text, because `gen_scenes.py`
only lifts dialogue and a rule that kills a player has no business in a file the parser
reads.

**Timing out counts.** That file already rules that walking away is a refusal, and a
survivable timeout would teach players to dodge her by waiting sixty seconds. A failed
kill logs loudly — silently surviving her would quietly make her ordinary.

---

## 7. The Doctor — her voice below the cutoff

Below **y −64** she cannot reach you, and **the goddess of death** speaks instead —
light blue, and the only voice in the world that is *curious* about you. Everyone else
wants something; she wants to know how you work. The corridors are full of what she has
already finished looking at.

Her three confession cutscenes are **phase-paced** (`companion → absence → harvest`), so
the last thing you hear before something comes for you is *"Tell Mera that it's her
time."* That line was written to be a herald. It is one.

---

## 8. Still open

| item | status |
|---|---|
| ~~Her event list~~ | ✅ **9 events on the slider** (2026-08-15) |
| **PvP untested** | `offer` and `web` both need a second player, and `web` needs high rage. Never run live |
| Buffed-spider stats, target floor | tuning — one number each once they have been seen to land |
| **Absence** — the third exit | shared, still missing, now load-bearing |
| `docs/35` | premise dead, banner applied. Superseded by this file |
