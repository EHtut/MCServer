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

## 1. Who she is

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
| `MEDIUM_AT` / `HIGH_AT` | **10** / **40** rage | `wall_voice.js` | tier thresholds |
| counter metric | **rage** — +1 minion raised, −1 minion slain | `wall_events.js` | |
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

## 3. ⭐ Rage is one slider, not two systems

Ethan: *"rage for the wall is something directed as less boons for you, more attacks on
other players."*

It does not switch modes at a threshold. It **slides**.

```
 0 ................... rage ................... MAX
 [ boons to you ]                        [ spiders at them ]
              [ she asks first ]
```

| event | tier | weight | what it does |
|---|---|---|---|
| `boon` | all | 4 | regeneration + absorption on **her own champion** |
| `offer` | **medium only** | 3 | **asks permission** via the ritual. Refusable |
| `web` | **high only** | 3 | spiders at another player. **No choice** |

⭐ **The tiers ARE the mechanism.** `offer` exists only at medium, so the band where she
asks your permission opens as rage rises and closes again when it gets high. That is
Ethan's *"you slowly lose the ability to choose to take the boon"* — and she stops
asking not because she is angry with you, but because she has stopped believing you
will say no.

> 🚨 **SHE IS THE FIRST GOD WHO POINTS AT SOMEBODY ELSE.** Every other patron's events
> happen *to* their champion. Blade's champion is being **tested**; hers is being
> **protected**. You are not the target of your own god — you are the reason other
> people are.

> ⚠️ **HER HEALTH FLOOR IS ON THE TARGET, NOT ON HER CHAMPION.** `godevents`' floor
> guards the player an event fires *for*, and hers lands on someone else — so that
> floor was guarding the wrong person entirely. Five buffed spiders on someone at two
> hearts is not an event, it is an execution. Under 60% health, or mid-scene, and she
> skips them.

**Who she points at** — a grudge first, proximity second: whoever has killed the most
of her actors, else the nearest. Both are Ethan's: *"the player who's either nearby or
killed the champion the most."*

---

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
| **Her event list** | 3 vs Blade's 11. She gives, asks and attacks, with nothing between. Blade's twelve came from Ethan listing them; hers should too |
| **PvP untested** | `offer` and `web` both need a second player, and `web` needs high rage. Never run live |
| Buffed-spider stats, target floor | tuning — one number each once they have been seen to land |
| **Absence** — the third exit | shared, still missing, now load-bearing |
| `docs/35` | premise dead, banner applied. Superseded by this file |
