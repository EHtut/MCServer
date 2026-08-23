# 57 — Caebrim · the thing in the depths

> **STATUS 2026-08-22** — rulings CAPTURED. One is BUILT (the stalker swap, §2); one is
> OPEN and would overwrite work finished hours earlier (§3); one is a lore fact with no
> mechanism yet (§4).

## 0. ⭐ THE RULINGS — Ethan, 2026-08-22

> **Caebrim is female** but yes.
>
> The depth speaker **I might change to all of them might just be Caebrim.** That being
> said I want to **take the shadow stalker away from Art and give that only to Caebrim.**
> **She is the one who hunts you in the depth, and the stalker is the closest form to
> her.** *(Unless you want to be hunted by a white woman, which is less scary.)* We can
> **use the lifestealer for Art.**
>
> Oh yea and **Kayer hates Milantros** btw.

---

## 1. She is female — and the correction is small because we never spent her

`docs/56 §5` said *"**He** begged Alice for this, and **he** is one of the two siblings"*
— written by me, inferred from nothing. Fixed.

⭐ **The blast radius is four lines, and that is not luck.** `docs/40 §0` ruled that names
are the most expensive word in the game and that **Caebrim is a title-in-waiting, not a
label to print**. Because of that ruling she appears in exactly two pieces of live text —
one deep-speaker line and one stalker whisper — and **neither asserts a pronoun**. A
character we had spent would have needed a sweep. This one needed a `sed`.

| where | what it says | pronoun? |
|---|---|---|
| `deep_speaker.js` | *"Caebrim and Ank are down here somewhere."* | no |
| `stalker.js` whispers | *"The word Caebrim comes to your tongue."* | no |
| `docs/53` | *"Her siblings Caebrim and Ank"* | Kayer's, not hers |
| `docs/56 §5` | 🔴 **he · he** | **fixed** |

---

## 2. ✅ THE SHADOW STALKER IS HERS ALONE — built

`born_in_chaos_v1:nightmare_stalker` is now **RESERVED**. No path may cast it.

⭐ **This also resolves something that was already wobbling.** `docs/15` and the Blade
build history both described the shadow stalker as *"her instrument, **not her body**"* —
an awkward hedge, because a patron's stalker is the only physical thing they get. It was
hedged because it was never really Art's. It is Caebrim's, and now it *is* her body: the
closest form the mod has to what she is.

⚠️ **And it is an approximation, not a portrait.** Ethan's aside — *"unless you want to be
hunted by a white woman, which is less scary"* — says plainly that the shadow is what the
depths make of her, not what she looks like. Whoever writes her should treat the stalker
as her **reach**, not her face.

### 🔴 Art's replacement had a defect no harness could have caught

Ethan named the family — *"we can use the lifestealer for Art"* — and the family has two
members. Casting the obvious one would have shipped broken.

**Decompiled the mod first.** `LifestealerPriObnovlieniiTikaSushchnostiProcedure`, the
base Lifestealer's per-tick handler, compares `getHealth()/getMaxHealth()` and past the
threshold calls `LIFESTEALER_TRUE_FORM.spawn(...)`, then `discard()` on itself. **That is
a brand-new entity** — and every stalker invariant is keyed on data we stamp onto the old
one.

**Then measured it live** (rcon, no players online) rather than trusting the read:

```
summon lifestealer, Tags:["veldora_probe"], CustomName "PROBE"   -> Health 100
data merge Health 20.0f                                          -> 20/100

@e[type=born_in_chaos_v1:lifestealer]            -> No entity was found
@e[tag=veldora_probe]                            -> No entity was found
@e[type=born_in_chaos_v1:lifestealer_true_form]  -> Health 100.0f, named "Lifestealer"
```

**The tag did not carry, the name did not carry, and it healed to full.** So a base-form
cast is a 200-HP stalker that forgets who owns it at the halfway mark — after which
`isStalker()` is false, the owner-damage hard stop stops applying, and **it turns on its
own champion**. The Harvest would never pay out either: the death handler reads an owner
that no longer exists.

**So the cast is `lifestealer_true_form` directly.** One entity, whole fight, every
invariant holds. The cost is the reveal theatre and its dark-ice trail — and a stalker
already wears a name tag and a scale bump, so the disguise was blown before it mattered.

| | before | after |
|---|---|---|
| `stalker.js` CAST `art` | `nightmare_stalker` · *The Nightmare* | `lifestealer_true_form` · **The Taker** |
| `_probe_patron.js` | same | same |
| `warn.js` TITLE `art` | `the nightmare` | `the matriarch` |
| `blade_voice.js` gossip ×3 | *"The Nightmare…"* | *"The Matriarch…"* |

⚠️ **`The Taker` is MINE, not his.** It is the mob's mechanic and her own line —
*"everything I lend, I take back"* — in one word, and it leaves *hand* free for the
champion, which `art_voice.js` already uses (*"the closest thing I've had to a hand of my
own"*). One string to change.

⚠️ **One gossip line had to be rewritten, not renamed.** *"The shadow moves. The Nightmare
rarely does."* named her instrument — which is no longer hers. It is now *"Her hand moves.
She rarely does."*, which says the same thing about a god who cannot touch the world, and
is the better line for it.

### ⚠️ Her stat block is now visibly wrong, and this is the moment to say so

The true form's native numbers against what we overwrite them with:

| | native | Art's `STATS` | |
|---|--:|--:|---|
| health | 100 | **70** | we make it weaker than the wild mob |
| attack | 7 | 7 | — |
| armor | **15** | **4** | we strip 11 points off it |

`docs/18` already called 70 HP *"a speed bump for a player"*, and Ethan has since ruled
Art **strongest god, strongest champion**. Three sources now disagree with this row.
**Not changing it unilaterally — tuning is his.**

---

## 3. ✅ RULED — Caebrim is FORGE's depth speaker

> Ethan, 2026-08-22, asked directly whether Milantros gets a stand-in in the dark:
> **"Her deep speaker is caebrim again."**

**Built. She is `forge`'s entry in `deep_speaker.js`** — the first time Caebrim has a
voice instead of a mention.

⭐ **AND THE PAIRING IS THE POINT.** Caebrim is the one who **begged Alice to raise
Milantros**. So the voice that meets the Goat's champion in the dark belongs to the
person who *caused the Goat to exist* — and who has been banished under the world ever
since. Every other god sends a stand-in they chose. Forge's is the only one with a claim
on the god she is standing in for.

🔑 **It also gives §2's body a voice.** The shadow stalker hunts you down there; Caebrim
talks to you down there; **they are the same person.** Neither half works nearly as well
alone.

### ⚠️ SCOPED TO FORGE — I did not extrapolate

His earlier message was *"the depth speaker I might change to **all of them** might just
be Caebrim"*, and this ruling answers a question I asked about **Forge specifically**.
`again` reads as *"yes, Caebrim"* rather than *"and also everywhere else"*.

**So Blade's Speaker, Wall's Doctor, Salvage's Keeper and Kayer's own register are all
untouched.** Replacing them is destructive — Blade's Speaker confesses about **Gregor**,
and those lines are his patron's grief, not hers — and `docs/40 §4` says that decision
gets made before either is written, not after. **Still open, one sentence from being
settled.**

⚠️ **If it does go universal, `docs/53`'s constraint has to be answered first:** *"the
moment Caebrim or Ank speaks, 'unwilling to speak to her' stops being true."* Forge alone
survives that cleanly — one champion, in one place, is not a conversation with Kayer. Four
paths is a career.

---

## 3b. The original argument *(kept — it is the reasoning, not the ruling)*


> *"The depth speaker I might change to all of them might just be Caebrim."*

**A `might`. Not built, and deliberately not built** — it would overwrite work finished
hours earlier and it collides with a stated rule.

Today `deep_speaker.js` gives each path its own voice in the dark — blade → **the
Speaker**, wall → **the Doctor**, salvage → **the Keeper**, art → **Kayer herself**. That
last one is `docs/53 §3`, and it is the only place in the pantheon where a god changes
register with location.

**What the change would buy:**

- ⭐ **One antagonist instead of four narrators.** The tide already switches its herald to
  the Speaker below y-0. If everything down there is Caebrim, the depths stop being *"your
  patron, but muffled"* and become **somebody else's house**.
- It gives the shadow stalker a voice, which §2 just gave a body. A thing that hunts you
  and a thing that talks to you being the *same thing* is far stronger than either alone.
- It retires three stand-ins (the Speaker, the Doctor, the Keeper) who exist mostly
  because a slot needed filling.

**What it costs — and one of these is a rule, not a preference:**

- 🔴 **It un-builds Kayer's second register.** *"She is her own depth speaker, those lines
  should switch from cold to irritated"* was his own ruling from earlier the same day, and
  the pools are written. Caebrim taking the depths takes away Kayer's only inconvenience.
- 🔴 **`docs/53` states the constraint outright:** *"the moment Caebrim or Ank speaks,
  'unwilling to speak to her' stops being true. If they ever do, it should be an event,
  not a pool."* Making her the universal depth voice is **the largest possible pool.** The
  fiction survives if *unwilling to speak to **her*** means Kayer specifically — a sister
  who will talk to anyone in the world except the one who wants her to is a sharper wound
  than silence, not a weaker one. **But that is a reading, and it needs his word.**
- Blade's Speaker confesses about **Gregor**, and `docs/40 §4` flags this exact collision:
  *"decide whether she replaces the Speaker or stands beside her."* Those lines do not
  transfer — they are his patron's grief, not hers.

**My read:** worth doing, and the cheapest version is **Caebrim replaces the three
stand-ins while Kayer keeps her own depth voice.** Kayer following you down is the one
thing that makes her look inconvenienced; Caebrim owning everyone else's dark gives the
depths an owner. Both hold at once. ⚠️ **But `docs/40 §4` is right that this gets decided
BEFORE either gets written, not after.**

---

## 4. ⭐ KAYER HATES MILANTROS — and it closes the triangle

Four characters, and every edge is now drawn:

```
       Caebrim  ──── begged ────►  Alice
          │                          │
     (sister,                   (spent centuries,
   won't speak                   made a choice)
     to Kayer)                        │
          │                           ▼
          └──────────────────────► Milantros
                                      ▲
                                      │  🔴 hates
                                    Kayer
```

- **Caebrim** asked for it.
- **Alice** paid for it — centuries, and *"the night before the ritual, Alice made a
  choice."*
- **Kayer** is the only one of the gods who loves Alice (`docs/53`), and she watched all
  of that go somewhere else.
- **Milantros** is a delighted child who almost certainly has no idea.

⭐ **This is the first hostility in the pantheon that is not about power.** Blade and Wall
disagree about *method*. This is a grudge about **attention** — and it points at the two
gods Ethan named the strongest.

🔴 **THE MOTIVE WAS MINE FOR ABOUT AN HOUR.** I guessed jealousy over Alice and flagged
it as a guess. Ethan's book dump (`docs/56 §0b`) replaced it with something better on
both counts:

> Milantros name-called everyone the day they met her — **"Short/Ugly/Weird/Smelly" at
> Kayer**, "Strong Man" at Ank, "Pretty eyes" at Alice. And then Alice adopted her.

⭐ **A small goat girl called her short, ugly, weird and smelly, and was then taken in by
Kayer's own mother.** It is still about Alice, so the shape holds — but it is funnier and
crueller than jealousy, and it is his voice rather than mine: a grudge completely real to
the person holding it and completely ridiculous to everybody else. **The coldest thing in
the world lost an argument to a nine-year-old who is now a god.**

🔑 **And the calibration in `forge_voice.js` `near_art` depends on this:** Milantros knows
about the NICKNAME — she still calls her Short — and does **not** know it is a grudge. She
thinks it is a running family joke. *"It's our little thing."* It is not. **A later editor
must not close that gap by having her notice.**

⚠️ Also from the dump and NOT resolved: **Ank and Kayer are married** ("the worst-kept
secret", hidden from Alice). `docs/53` says Kayer has *no allies* and is the only one who
loves Alice. A husband changes that sentence. The two can coexist — but somebody should
say so on purpose rather than by omission.

🔑 **Whatever the reason, the shape is fixed and it is very good:** the coldest god in the
game hates the warmest one, **and the warmest one does not know.** `docs/56 §2` already
makes Milantros the anti-Kayer on every axis; this makes the opposition personal instead
of thematic.

**Where it can be spent, cheapest first:**

| | |
|---|---|
| `broadcast.js` **bickering** | already built, still has no trigger — and now has its first real reason to fire |
| a Kayer pool about Forge | she is the one god who would name another to your face |
| Milantros returning it | ⭐ **she should not.** A one-sided hatred is funnier and crueller than a feud |
| the **Interception** (`docs/49 B`) | Kayer's cross-champion demands, pointed at Forge's champion |

---

## 5. ⚠️ What I will not invent

- **Does Caebrim hunt everyone, or only her sister's champion?** §0 says *"she is the one
  who hunts you in the depth"* — universal. §3 is still a `might`. If the depth speaker
  stays per-path while the hunting is universal, those two facts pull apart.
- **Does Kayer know Caebrim is down there?** `deep_speaker.js` already has Kayer saying
  *"Caebrim and Ank are down here somewhere. That is the whole of what you are getting."*
  So: yes, vaguely. Whether she knows her sister is **hunting her own champion** is a much
  better question, and I am not answering it.
- **Ank.** Named twice, spent never. Still the third sibling, still free.
- **Why Milantros, specifically?** §4's motive is a guess. One sentence from Ethan
  replaces the whole paragraph.
