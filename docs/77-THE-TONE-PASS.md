# 77 — The tone pass: what the bickering revealed about the existing pools

> **STATUS: LIVE — findings, for Ethan.** Written 2026-08-30 after importing the five
> bickering documents. Ethan: *"use them to do a pass on existing used dialogue to see if
> there are some tone tweaks."*
>
> ⛔ **NO LINES ARE WRITTEN HERE.** Every item names a DEVICE his bickering uses that the
> existing pools do not, or a place the two disagree. What to do about it is his; the
> standing rule is *"you only do code unless I ask you to bulk lines."*
>
> 📄 Sources: `docs/dialogue/Bickering Doc *.txt` · targets: `<god>_voice.js`

## How this was measured

Not by reading and forming an impression. Each device below was counted in the existing
pools, so "the pools never do this" is a number rather than a feeling.

| device the bickering uses | occurrences in the existing pools |
|---|---|
| Wall has a **warm** register | **0** |
| Wall's **repetition-as-signature** (`Always. Always. Always.`) | **0** |
| Art **says a name** to someone's face | **0** in lines (4 in comments, all saying she won't) |
| Art **self-interrupts and redirects** | 2 |
| Blade **defers** to Art directly | **0** — all 4 mentions are *about* her, to the player |
| Forge's retired folksy-adult vocabulary | **10** still present |

---

## 1. ⭐⭐ WALL HAS TWO REGISTERS AND THE POOLS ONLY HAVE ONE

This is the biggest finding, and it is not a tweak — it is a whole missing half.

**With Art** she is in pain, needy, and hard to be around:

> *"I am sad. / I am broken. / Begotten by a people who will never speak my name."*

**With Forge** she is *warm*, and almost funny:

> *"My friend! / How are you!"* · *"You always have a friend me!"* · and she gives him a
> decapitated head as a present, delightedly.

🔑 **Same god, ten minutes apart, and the difference is WHO IS LISTENING.** Nothing in
`wall_voice.js` distinguishes an audience — her pools are one continuous register of
gentle menace and longing. The warm Wall does not exist anywhere in the game yet.

⚠️ **And the warmth makes the pain land harder, not softer.** A god who is only ever
grieving is a texture; a god who can be happy with one friend and cannot be happy with
anyone else is a person. The high-trust scene where she turns on Forge —
*"YOU! you hate me as they do / Don't you? / Goat?"* — only works because the earlier
scenes were genuinely warm.

## 2. ⭐ HER REPETITION IS A SIGNATURE, AND IT IS NOWHERE IN HER POOLS

> *"I will always be there to save them. / Always. / Always. / Always."*
> *"Below. / With the dark. / Where I belong."* — and Forge's echo: *"Lower?" / "Lower."*

The escalating repeat is the single most recognisable thing about how she talks in these
documents, and it appears **zero** times in her 191 registered lines. ⚠️ It also needs the
chunked delivery to work — as one line, *"Always. Always. Always."* is a stutter; as three
beats it is a woman insisting.

## 3. ⭐ BLADE IS SUBORDINATE TO ART, AND THE POOLS HIDE IT

In the bickering he is unmistakably beneath her:

> *"Thank you, my Matriarch."* · *"As your will. / My matriarch."* · *"At your word."*

His pools mention her four times and every one is *about* her, to the player, and guarded:

> *"The Matriarch once led my kind. Once. Be wary of her champion."*

⚠️ **These are not contradictory** — wary and deferential is a coherent, interesting
combination, and arguably the best thing about him. But a player only ever hears the wary
half, so the deference is a secret the game keeps for no reason. ⭐ The gap is an
opportunity rather than a fault: the drill sergeant who talks down to you and *bows to
someone else* is a much better character than either half alone.

## 4. 🔴 FORGE — THE OVERHAUL IS CONFIRMED, AND THE TARGET IS NOW VISIBLE

`forge_voice.js` already admits this in its own header (*"Her other ~17 pools still read
FOLKSY-ADULT"*), and **10 of those markers are still in the file**. The bickering shows
exactly what she should sound like instead:

| the pools have | the bickering has |
|---|---|
| *"I reckon that oughta hold"* | *"Damn, ok."* · *"Coolio."* · *"Gotcha watcha."* |
| a competent rambler | someone who **panics**: *"Please don't hurt me."* · *"I am so fucked."* |
| tangents that wander | tangents that **collapse mid-word**: *"So um…" / "No." / "Ok."* |

⭐ **Two things she does constantly in the bickering that the pools have none of:**

1. **She flirts with Art, badly, and is shut down every time.** It is a running joke with
   at least four instalments and a punchline (*"You are married are you not, Goat?"* →
   *"I am?"*). Nothing in her pools knows she has a crush.
2. **She narrates her own fear in real time.** *"(This is my moment!)"* · *"Oh gods she's
   getting closer / CHAMPY SAVE ME!"* — an interior voice leaking out loud.

⚠️ **Her three-sentence discipline is Salvage's, not hers.** Where Salvage stops talking,
Forge cannot, and the bickering is where that finally reads as character rather than
length.

## 5. ⚠️ ART — ONE REAL CONFLICT, AND IT IS IN YOUR FAVOUR

`art_voice.js:224` states the rule flatly:

> *"🔑 SHE MADE HIM (docs/58 §3 — "Gregor KAYER Court"). **She will not say it**…"*

Your bickering has her say it **twice**, both times as the last line of a high-trust scene:

> *"I will hold you to that. / **Gregor**."*
> *"…**Mera**, You are not meant to know."*

⭐ **This is the rule paying off, not breaking.** A name only lands like that because she
has spent the entire game refusing to use one. But the comment as written says *never*,
and the next person to touch that file — me, most likely — would "correct" your scenes to
match it. **The note needs to become "not until high trust, and then once."**

### And she softens twice, then catches herself

> *"…" / "Must you fight me so." / "what?" / "Nothing. / Carry on, Spider."*
> *"They are… / They are closer to us than i would admit."*

🔑 A specific, repeatable tic: **she begins something true, stops, and issues an order
instead.** Her pools have two trailing ellipses in 107 lines and neither is this. It is
also the only evidence in the game that she feels anything, which the existing brief
(*"cold and almost cruel"*) leaves her no room to show.

## 6. 🖊️ THE NOTES IN THE DOCUMENTS

* **All three names check out.** `Mera`, `Gregor` and `Milantros` already appear across
  `arrival.js`, `art_voice.js`, `blade_voice.js`, `deep_speaker.js` and `forge_events.js`
  — the bickering introduces no new lore, it *uses* what is there.
* **`Milantr-` / `Milan…`** at the end of Forge+Art is Art nearly saying Forge's true name
  and stopping. Same device as §5, and the strongest instance of it.
* ⚠️ **`Bickering Doc Forge+Art.txt` opens with** *"This is a bickering document for wall
  and blade"* — a copy-paste from the first file. Harmless, not corrected; his document.
* ⚠️ **Every header says** *"Requires a champion of blade or wall on the other end"* even
  in the files that involve neither. The importer reads the **section headers** for gating
  and ignores this line, so nothing is mis-gated — but the sentence is wrong in four of
  five files if anyone reads it as spec.

## 7. What I have NOT done

* ⛔ **Not touched a single existing line.** Every item above is a gap or a conflict, for
  him to rule on.
* **Salvage has no scenes**, so she is absent from all of this. She is also the god whose
  three-sentence discipline the others' scenes make legible by contrast — worth having in
  mind when hers get written.
* **The `argue_*` pools are untouched.** They are the *generated* argument that precedes a
  reprisal (`grudge.js`), a different system from these authored scenes, and the two
  should stay separate: one escalates, the other is ambient.
