# docs — the index, and where things go

*Written 2026-08-14 after Ethan called it: **"can we work off the same documents if
possible instead of building endless amounts of documents and suffering from doc
rot."*** He was right — ten new documents were created in a single session.

---

## 🚫 THE ROSTER — read this before writing for a patron

> ### There are **FIVE** paths: **Blade · Salvage · Forge · Wall · Art**
>
> **CROWN IS RETIRED.** Merged into Wall, 2026-08-14 (`35-WALL-REFRESH.md` §6).
> Ethan: *"We merge crown and wall. The idea being the spider mother wants you to
> build a family, a web, like hers. Also missionary is kinda a boring patron compared
> to the others."*
>
> Wall's household is everything she **raises and binds** — Goety servants, Occultism
> familiars, Automaticons. The court IS the family IS the web.
>
> ⚠️ **MineColonies was CUT.** The merge was originally argued on a colony; that mod is
> no longer in the pack (nor is Theurgy). `35-WALL-REFRESH.md` carries the correction.
>
> **Crown's writing is kept on purpose**, marked RETIRED in `27` and `28`, in case a
> sixth patron is ever wanted. **Nothing is built from it and nothing new is written
> for it.** His key stays claimable in `paths.js` — and his scene keeps generating —
> only until the world reset.
>
> 🚨 *This section exists because the mistake was already made.* On 2026-08-15 Crown
> was scaffolded, deployed and given a full content worksheet, because `22` and `27`
> still read as live and the merge was recorded only in §6 of a doc about Wall.
> **`tools/new_god.py` now refuses the key outright** — a doc can be misread, the
> guard cannot.

---

## 🚨 THE ROUTING RULE — read before writing anything

> ### There are SIX living documents. New work goes INTO one of them.
> **A new file is the exception and needs a reason.** If a thing does not obviously
> belong in one of the six below, that is a sign it belongs in the closest one anyway.

| # | doc | what goes here | how often it changes |
|---|---|---|---|
| **23** | `THE-PATH-SYSTEM` | the master design. What the system *is* | rarely |
| **28** | `THE-SCENES` | **everything a patron says** — scenes, the Arrival, the silence, colours | when writing |
| **30** | `THE-THESIS` | what Veldora *means*. The world's argument with itself | rarely |
| **32** | `TEST-SUITE` | the suite, and the results of every run | each playtest |
| **34** | `THE-REMAINING-BUILD` | ⭐ **the live queue.** What is built, what is next, what is held | constantly |
| **36** | `THE-MOD-TAXONOMY` | every mod question — the taxonomy, the audit stages, the wishlist, worldgen | each audit stage |

Plus **35** `WALL-REFRESH`, which is a live *design* doc while Wall and "being chosen"
are being redesigned. **It folds into 23 when the design lands.**

### Where the obvious things go

* a patron said a new line → **28**
* an audit stage (A2…A8) → **36**, appended
* a playtest result → **32**
* "what are we doing next" → **34**
* a mechanic that changes what the system *is* → **23**
* a held or deferred idea → **34**, under HELD
* a mod added, cut or moved → **36**

---

## Consolidated 2026-08-14 — where the vanished docs went

Five documents were merged and deleted. Their content survives whole.

| was | now lives in |
|---|---|
| `29-THE-XP-COUPLING` | **34** § HELD |
| `31-I3-THE-FLAGSHIPS` | **34** § HELD |
| `33-BEING-CHOSEN` | **35** |
| `37-THE-ARRIVAL` | **28** |
| `38-A1-CREATE-AUDIT` | **36** |

Cross-references were repointed automatically. Git history holds the originals.

---

## The full index

**Foundation** — `00-DESIGN` · `07-THEME-AUDIT` (R1–R8) · `15-LORE` · `30-THE-THESIS`

**The path system** — `23-THE-PATH-SYSTEM` (master) · `24-PATH-SYSTEM-BUILD` (the
original chunk plan; **the live state lives in 34**) · `34-THE-REMAINING-BUILD` ·
`35-WALL-REFRESH` · **`47-THE-RELEASE-SYSTEM`** (how each god puts you down —
never / 4 buff-deaths / 3 refusals)

**The patrons, per-god** — `40-BLADE-THE-WARRIOR` · `43-WALL-THE-SPIDER` ·
`44-SALVAGE-LINES` · **`56-FORGE-MILANTROS`** (2026-08-22 — retcon to female; the Goat is a CHILD who
gives, and the anti-Kayer) · **`53-MATRIARCH-KAYER`** (2026-08-22 — replaces "The Nightmare"
wholesale; her release condition is CAPABILITY, not failure) ·
**`54-MATRIARCH-LINES`** (the chart + sheet: the god/champion matrix, her voice rule,
her pools) · **`55-MATRIARCH-EVERY-LINE`** (DRAFT lines to edit and hand back —
⚠️ not generated from source, none of it is in the game yet)

**The book canon** — **`59-MERA-CANON`** (2026-08-23 — Ethan's series notes for Mera =
**WALL**, verbatim + an honest usability triage. 🔴 **Wall is Blade's daughter and
neither of them knows** · her clinging is PURPOSE-LOSS, not motherhood · ⚠️ OPEN: her
anti-undead golden light vs. her necromancy path — blocks the voice rewrite) ·
**`58-KAYER-CANON`** (2026-08-22 — Ethan's series notes for Kayer,
verbatim + reconciled. ⭐ **Forge is Milantros and Wall is MERA, and Kayer cannot forgive
either of them for being Alice's daughter** · she MADE Blade (*Gregor **Kayer** Court*) ·
her silence is foresight, not surveillance · ⚠️ the Homelander trap, which is a review
gate on every line of hers)

**Not a patron — the thing in the dark** — **`57-CAEBRIM`** (2026-08-22 — she is
FEMALE; the shadow stalker is taken off Art and reserved as **her** form, Art recast to
the Lifestealer's TRUE form and why the base one would have turned on its own champion;
🔴 **Kayer hates Milantros**; 🔴 OPEN: should Caebrim replace every depth speaker?)

**Next direction** *(captured 2026-08-18, unscoped)* —
**`52-EARNING-THE-PATH`** (the item makes you NOTICED not chosen · Forge + Art +
Undeath · villagers as player models)

**Writing** — **`51-LINES-TO-REFRESH`** (GENERATED: every pool Claude drafted and
Ethan has not yet swept, from `[CLAUDE-DRAFT]` markers in the source — regenerate with
`python tools/gen_lines.py`) · `27-THE-SIX-VOICES` · `28-THE-SCENES`

**The gods against each other** *(new axis, 2026-08-16)* —
**`49-RETALIATION-AND-DEFECTION`** (the Warning · the Interception · the Grudge · the
Argument; **A is built**, the rest design) · **`50-THE-TIDE`** (the Darktide loop for
the deep, the Bickering, and the measured finding that everything below y-64 is an
empty void)

**The patrons** — `22-THE-PATRONS` · `25-PATRON-DIALOGUE` (death ladder) ·
`26-INTRODUCTIONS` (mechanic + the I-chunk records) · `27-THE-SIX-VOICES` (the tweak
sheet writers are briefed from) · `28-THE-SCENES` (**all final text**)

**The stalkers** — `18-THE-STALKERS` · `19-STALKER-BUILD` · `20-AUDIT-2026-08-11` ·
`21-THE-SIX-ROLES`

**Mods and world** — `01-MODLIST` · `36-THE-MOD-TAXONOMY` · `06-BURIED-TECH` ·
`13-CUT-LIST` · `11-OPEN-DECISIONS`

**Operations** — `02-OPS-RUNBOOK` · `08-CLIENT-PACK` · `09-SHARING` ·
`14-TELEMETRY-SEAM` · `32-TEST-SUITE`

**Older / historical** — `03` `04` `10` `12` `16` `17`

---

## Why doc rot happened, so it does not again

Each new document was individually justifiable — a design needed somewhere to live,
an audit needed a home. **The failure was never deciding where things go**, so every
new topic got a new file, and the same subject ended up split across three of them:
the flagships were in `26`, `29` and `31` at once, and the first-join scene existed in
both `33` and `37` saying different things.

**Splitting a subject across documents is the rot.** One subject, one home, appended
to — even when the document gets long. **A long document is easier to read than four
short ones that disagree.**
