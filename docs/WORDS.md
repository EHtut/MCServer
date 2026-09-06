# WORDS — what Ethan means when he says it

> **Created 2026-09-06, at Ethan's request**, after four rounds of building the wrong thing:
> *"we need to develop a sort of document for 'this is what i mean' because we are repeatedly
> on the wrong page with words."*
>
> ⛔ **This is not a style guide and not a lore glossary.** It is a lookup table from HIS
> words to the exact file, mod or system they name. Read it before building anything he
> described in a sentence.

---

## ① DIGEST

**The cost so far, all from one word each.** I rebuilt the wrong book, chased the wrong mod
for a crash, and asked him to re-explain twice while he was blocked and tired. Every one of
those was a word I assumed I understood.

🔑 **The rule this doc enforces: if a word in this table is in his message, use the row.
If a word is NOT in this table and it names a thing rather than an action, ask or check
before building.** One question costs a minute. Building the wrong artifact cost an hour
tonight.

⭐ **He is not going to write in project jargon and should not have to.** He is the author;
the burden of translation is on the person reading. When he says a word loosely, the fix is
a row in this table, never a correction to him.

---

## ② THE TABLE

| he says | it means | where it lives |
|---|---|---|
| **the dialogue mod** | **Immersive Messages** — the mod that floats/types words across the screen. ⛔ NOT Easy NPC | `immersivemessages-neoforge-1.0.18`, driven by `immersive.js` |
| **the NPC mod** | **Easy NPC** — bodies, skins, trades, the branching conversation UI | `easy_npc-neoforge-7.10.0`, presets in `pack/datapacks/mcserver_npcs` |
| **the journal** | **"Cogs and Cadavers"**, the **Patchouli** book. ⭐ **It is NOT an item you hold** — it is a **button in the inventory screen**, next to the crafting grid, with a red `!` when there is something unread | `tools/make_guidebook.py` → `client/patchouli_books/cogs_and_cadavers`. **CLIENT-SIDE** |
| **the guidebook** | ⚠️ **AMBIGUOUS — ASK.** There are two books in this pack and they are different mods (see ③) | — |
| **a chunk** | ⚠️ **AMBIGUOUS.** Usually a *unit of work* in this project's plan, occasionally a Minecraft chunk. Read the sentence | `docs/ACT0.md` §④ for the work sense |
| **the tide** | the escalating wave system | `tide.js`, `waves.js` |
| **the gods / the patrons** | the five paths — Blade, Salvage, Forge, Wall, Art | `docs/LORE.md`, `veldora-patrons` |
| **the opening** | the title card + the origin text on first join | `opening.js`, `opening_lines.js` |

---

## ③ THE TWO BOOKS, WHICH IS WHERE THIS WENT WRONG

🔴 **This pack ships two guidebook mods, both installed, both with a book called something
different, and I picked the wrong one.**

| | **Patchouli** ⭐ THE JOURNAL | **Modonomicon** |
|---|---|---|
| what he calls it | **the journal** | *(no name yet — he has never referred to it)* |
| shown as | **a button in the inventory screen**, red `!` when unread | a book item |
| titled | *Cogs and Cadavers, 1st Edition* | *Notes on Veldora* |
| built by | `tools/make_guidebook.py` | `tools/make_journal.py` |
| lives | `client/patchouli_books/` — **client-side** | a datapack — **server-side** |
| to change it | rebuild the client, he re-imports | `/reload` |
| has | Categories + **Unlock Progress** | four categories I added on 2026-09-06 |

⚠️ **The practical asymmetry is real and it argues both ways.** Patchouli is the one he
actually uses and already has unlock-progress wired; Modonomicon updates live without a
client rebuild. ⛔ **That is a decision for him, not an inference for me** — the mistake
tonight was picking on the merits instead of asking which book he meant.

---

## ④ HOW TO USE THIS

- **Before building** anything he described in prose: scan his message for a bolded word in
  ②. If one is missing and it names a *thing*, ask.
- **When he corrects a word**, add the row in the same session. A correction that stays in
  the chat is a correction that gets made again.
- ⛔ **Never "improve" his vocabulary.** If he calls the Patchouli book the journal, then in
  this project the journal is the Patchouli book, and the docs change to match him.

---

## ⑤ CORRECTIONS

**"He said Patchouli, so I should check which book he means."** ⚠️ I did notice the word
`patchouli` and built the Modonomicon book anyway, because the Modonomicon one was the book
the *datapack* defined and it was the one I could reach from the server. **The signal was
there and I reasoned past it.** That is worse than missing it, and it is the reason ④ says
*ask* rather than *weigh it up*.

**"The dialogue mod means Easy NPC, because dialogue is what NPCs do."** ❌ It means
**Immersive Messages**. He named it for what it does on screen — floats words — not for the
conversation UI. 🔑 **He names things by what he SEES**, which is a better rule of thumb than
naming them by what they do architecturally.
