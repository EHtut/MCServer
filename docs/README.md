# docs — the index

> What exists, where it goes, and what not to write. **Read `FORMAT.md` before creating a
> doc; there is a good chance you should not create one.**

---

## ① DIGEST

**The estate, 2026-09-05: 75 top-level docs → 34.** Forty were archived, stamped, and indexed
by what they hold. Nothing was deleted.

**Status now lives in the PATH, not the filename.** A number encodes when a doc was written,
never whether it is still true — and `20-AUDIT-2026-08-11.md` was cited by five docs as *"the
live state of what exists"*, which it stopped being the day after it was written. Anything in
`archive/` is spent. Anything at the top level is live, reference, or generated.

**Before writing anything:** grep `archive/INDEX.md`. Forty docs' worth of rulings,
measurements and arguments are summarised there. The odds are good yours has been had before.

**Where things go.** State → `STATUS.md`. Broken things → `DEFECTS.md` with a `D-` id.
History → **git**, never a doc. Design → the one doc that owns that subject.

---

## ② THE ESTATE

⭐ **`ACT0.md` is the live front.** It is the doc being built from right now.

### Read these first

| doc | answers |
|---|---|
| **`FORMAT.md`** | how a doc here is written, and when not to write one |
| **`VOICES.md`** | the dialogue mod's real limits · where every god stands · how to write a voice |
| **`NPCS.md`** | Easy NPC as it actually is — the preset schema, objectives, attributes, read from the jar |
| **`DEFECTS.md`** | what is known-broken, with `D-` ids |
| **`TOOLKIT.md`** | the story tools, written for other projects to use |

### The world and its people — Ethan's writing lives here

⭐ **`LORE.md` is the one to read.** `15-LORE` plus the four canon dumps and `57-CAEBRIM`
merged into it 2026-09-05 (Ethan: *"those are lores and should go into a lore doc"*), verified
line-for-line with zero lost. The docs below are **build** docs — tiers, events, voice rules —
not lore.

| doc | subject |
|---|---|
| **`LORE.md`** | **the lore bible** — the world, the angels, the strata, and the canon for Kayer, Mera, Gregor and Caebrim. **Ethan's four verbatim dumps live here.** |
| `30-THE-THESIS.md` | what it means — *a patron is what an angel becomes once it wants something* |
| `40-BLADE-THE-WARRIOR.md` | Blade / Gregor — brief, tiers, events. The reference implementation |
| `43-WALL-THE-SPIDER.md` | Wall / Mera — the arc that tightens, as the Warrior's inverse |
| `53-MATRIARCH-KAYER.md` | Kayer Alice Rysor — the cold ruling, the two depth registers |
| `56-FORGE-MILANTROS.md` | Forge |
| `28-THE-SCENES.md` | the introduction text per god. ⚠️ **`gen_scenes.py` parses this** |

### The systems

| doc | subject |
|---|---|
| `23-THE-PATH-SYSTEM.md` | the master design — coefficients, the ledger, the reckoning engine |
| `63-THE-TRIAL.md` · `67-BEING-CHOSEN.md` | the Trial · how a path is offered and taken |
| `74-THE-WAVES-AND-THE-LADDER.md` | the tide's composition, as shipped |
| `75-THE-SCREEN-AS-A-STAGE.md` | placement as characterisation |
| `77-THE-TONE-PASS.md` | tone, counted rather than felt |
| **`ACT0.md`** | **the live front** — the whole Act 0 arc, what is built, and the chunk ledger |
| `76-THE-BACKLOG.md` | the work register — who holds what |

### Reference — how to work, not the work

`02-OPS-RUNBOOK.md` · `41-BUILDING-A-GOD.md` · `80-THE-TOOLKIT-SEAMS.md` ·
`14-TELEMETRY-SEAM.md` · `73-THE-UNDEAD-TABLE.md` · `12-TRIAGE.md` · `27-THE-SIX-VOICES.md` ·
`54-MATRIARCH-LINES.md` · `01-MODLIST.md`

### ⛔ Generated — regenerate, never hand-edit

| doc | tool |
|---|---|
| `04-GAP-REPORT.md` | `python tools/gen_docs.py` |
| `48-EVERY-EVENT.md` | regenerated from a live boot |
| `51-LINES-TO-REFRESH.md` | `python tools/dialogue_doc.py` |
| `dialogue/*.md` | `python tools/dialogue_doc.py` — **the live copy of every god's lines** |

### `archive/` — stamped, kept, never built from

⛔ **FICTION UNLESS RE-VERIFIED.** Read `archive/INDEX.md` first: it records, per doc, what
would be lost if that file were deleted.

---

## ③ THE ROSTER — before writing for a god

> **FIVE paths: Blade · Salvage · Forge · Wall · Art.**
>
> **CROWN IS RETIRED** — merged into Wall, 2026-08-14. Ethan: *"the spider mother wants you
> to build a family, a web, like hers."* Wall's household is everything she raises and binds.
> Crown's writing is kept on purpose in case a sixth is ever wanted; **nothing is built from
> it and nothing new is written for it.**
>
> 🚨 **This section exists because the mistake was already made.** On 2026-08-15 Crown was
> scaffolded, deployed and given a full content worksheet, because two docs still listed him.

⭐ **Gods no longer carry colours** (Ethan, 2026-09-05) — they carry per-god *fonts*, and they
speak through the dialogue mod, not the chat bar. Any doc describing a god by his chat colour
is stale. `VOICES.md` is the current word.

---

## ④ WHAT NOT TO WRITE

| you want to write… | it goes in |
|---|---|
| what is running right now | `STATUS.md` — **only STATUS may say NEXT** |
| a bug, a finding, anything broken | `DEFECTS.md`, with a `D-` id |
| a plan for unbuilt work | the doc that already owns that subject |
| what happened this session | **the commit message.** git never rots |
| an audit's results | `DEFECTS.md`. An audit doc becomes a stale audit doc |

⛔ **Do not create a new doc.** A new gameplan, brief, roadmap or audit doc is how 75 happened.
If a subject genuinely finishes, its doc is **replaced** — archived, and the next live front
takes the slot.

---

## ⑤ CORRECTIONS

**"Splitting a subject across documents is the rot."** ⚠️ True but incomplete, and the missing
half is why the 2026-08-14 consolidation did not hold. Merging fixed the split and the count
was back to 75 within three weeks, because **nothing ever archived anything** — the estate
could only grow. Consolidation without retirement buys weeks.

**"A `DRAFT` banner stops people building from a doc."** ❌ It does not. `68-THE-GAMEPLAN.md`
said `DRAFT` and *"Zero code written from this doc"* while nine of its chunks had shipped, and
`78-THE-OPENING.md` still said *"design only, zero code"* ten minutes before `opening.js`'s
first commit named it as the design. That is why status is now the file's **location**, which
cannot be wrong the way a line of prose can.
