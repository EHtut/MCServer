# ACT 0 — the person, before any god knows they exist

> The whole of Act 0: what it is, what is built, and what is left. **The work document.**
> Supersedes `78-THE-OPENING.md`, which only ever covered the first beat.

---

## ① DIGEST

**What Act 0 is.** Normal Minecraft. On your first join you get **a journal in your inventory** holding the origin, and the only thing on screen is the title typing itself out. No gods, no voices. You
head for the caves and **Ank stops you** — he tells you not to go down, and trades with you to
keep you above ground. You go anyway, and underground you **overhear him arguing with
Caebrim about you.** The argument escalates across seven days in a **peaceful** cave. Around
day 4 **Caebrim finds you in person** to warn you off; more meetings follow. **On day 7 you
run into Alice.** She tells you a few things, disappears, and **tides you at the hardest
difficulty.** You die, and wake up wrong.

⭐ **The shape is: the caves pull, and two people push back.** Something down there whispers
for you to come closer — and Ank and Caebrim spend seven days trying to keep you out. You go
anyway. Every beat is somebody trying to stop you, which is what makes the ending land.

**Where it stands.** The opening is built and lands its title card. **Ank is built, and now
he talks.** The rest of the act — the argument, Caebrim, day 7, the tide, waking up wrong —
is unbuilt, and there is still no act state machine.

**B1, B1b, B2, B2b, B3, B3b and B3c are done.** Ank is an Easy NPC preset — unkillable,
following, wearing his own skin — inside a band: **underground, above y −32**, leaving when
you surface or go deeper, with *"A chill runs up your spine."* He **trades** ore for **wheat**
at a rate that makes no sense, which is the argument in a form the player can act on.

🖊️ **And his words are in.** Your `ANK Act 0 - Dialogue.txt` is imported and reaches the
player two ways: the **branching intro tree** lives in the preset (three options, one of them
sharing a reply), and the **day greeting** fires when he steps out, at most once per world
day. Days 2, 4 and 7 are yours; the rest fall to the rotation on purpose.

⭐ **And the price falls every time he loses.** Four tiers, driven by **descents rather than
days**: each descent is Ank losing the argument, so his next offer is better. The discount is
*evidence that he is failing* — and a player who never goes down never sees him desperate,
which a calendar would have given away for free.

🔑 **And the wheat is the reason he trades at all.** He lives in a cave and cannot farm;
food is the one thing the surface has that he does not. So an absurd exchange rate reads as
*character* rather than a broken shop — he is not running an economy, he is paying whatever
it costs to keep somebody up there where the wheat grows.

⭐ **And the urge answers him.** Every day the player stays out of the deep, the pull gets
louder — four tiers across the seven days, reset by a single descent. **So Ank's bribe
working is what turns the volume up**, and the two systems argue through the player.

⭐ **He speaks in the chat bar, like a person.** `<Ank> text`, vanilla's own shape — no
colour, no font, no tag of ours. The gods have the overlay because they are narrating at
you; Ank is a man in a cave talking, and Minecraft already has a way to show that.

🧪 **And there is now a suite for testing all of it.** `python tools/act0_smoke.py` asks the
running server what it can answer; `--script` prints the 38-item playtest in play order,
and each item is recorded by hand — `--pass <id>` / `--fail <id>` — into a ledger `prefire`
reads, **so the owed list finally shrinks as testing happens.** ⛔ The two halves never
merge: a green rcon check can never mark an eyes-only item true.

⚠️ **Proven offline only. He has never been spawned.** 93/93 in his harness against your
real text, 42/42 across the suite. **38 items are owed the moment the server comes up** — 16
markers the code itself raised, plus the 22-step playtest. Green is not tested, and both
tools say so themselves.

🔑 **The band boundary is −32**, and it is not a number I chose: `help.js` already tells the
player *"0 to -32 the old diggings · -32 to -52 the deep works"*, so the game had committed
to it. Say if the deep works are too shallow a place for him to give up.

**🔴 What needs Ethan.** Three, all cheap and all blocking something:
**(a)** 🖊️ **The urge pools are still empty** — `urge_1`…`urge_4`, the *"you feel an urge to
go below"* escalation. The mechanism is live and reports `no-lines:<tier>` rather than going
quiet, so it is waiting on words and nothing else. **(b)** Does the doctor's gift survive?
The old arc had a buff granted in the opening and lost on death; your new arc does not mention
one, and *"wake up wrong"* needs something to contrast against. **(c)** Is Caebrim's meeting
fixed at day 4 or a window — you wrote "Day 4(?)".

---

## ② ROUTING

| | |
|---|---|
| **OWNS** | the Act 0 arc · the opening · Ank and Caebrim's argument · the peaceful cave · Alice on day 7 · the act boundary into Act 1 |
| **DOES NOT OWN** | *how a voice is placed or formatted* → `VOICES.md` · *who these people are* → `LORE.md` · *how a god is built* → `40` `43` `53` `56` · *the tide's composition* → `74` · *what is broken* → `DEFECTS.md` |
| **STATE** | → `STATUS.md` — **only STATUS says what is in flight** |
| **BLOCKS** | Act 1. The act-ending tide is Act 1's opening beat |
| **VERIFIED BY** | **`node tools/prefire.js`** after every chunk — offline suite plus the in-game checklist. `--game` for just the checklist |

---

## ③ THE DESIGN

> ⭐ **Ethan, 2026-09-05.** This replaces the earlier arc wholesale — see §⑥, the correction
> is the whole shape of the act.

```
NORMAL MINECRAFT, with the book narrating YOU        the opening. No gods. No voices.
    ↓
you head for the caves — and ANK STOPS YOU           he tells you not to go down there
    ↓                                                and TRADES with you to keep you up
you go down anyway
    ↓
you OVERHEAR ANK AND CAEBRIM ARGUING                 about you. In a peaceful cave —
    ↓                                                nothing down there is trying to kill you
        ── the argument ESCALATES across seven days ──
    ↓
~day 4  CAEBRIM FINDS YOU. PHYSICALLY.               she tells you how dangerous the caves are
    ↓
days 4–7  more meetings, from both. Louder arguments.
    ↓
DAY 7 — YOU RUN INTO ALICE                           she tells you a few things
    ↓                                                and disappears
she TIDES YOU AT THE HARDEST DIFFICULTY
    ↓
YOU DIE, AND WAKE UP WRONG                           Act 1
```

### 🔑 The four things that carry it

**⭐ THE CAVES PULL AND THE PEOPLE PUSH BACK.** *"There is something down there, it whispers
for you to get closer"* — and Ank blocks the entrance, trades to keep you above ground, and
Caebrim comes to warn you in person. **The player descends against advice, repeatedly, from
people who turn out to be right.** ⚠️ Both halves are needed: a pull with no warning is an
ordinary dungeon crawl, and a warning with no pull gives the player no reason to disobey.

**He is not the only source, and that is what makes it a choice.** `mcserver_surface_ores`
already places every ore in a y54–120 band *"so descending is a CHOICE"* — so Ank gates
nothing. He offers the same ore **faster**, which is an argument rather than a wall.

**The cave is PEACEFUL, and that is a mechanic.** For seven days the danger is not mobs — it
is two immortals arguing about what to do with you. If the caves fight the player, the
argument becomes background noise and the seventh day stops being a change of state.

**The argument is the content.** It is not ambience between beats; it *is* the act's spine,
and it must audibly escalate. Day 1 overheard and distant; day 6 unmistakable and about you.

**The silence still holds — no GODS speak.** Ank, Caebrim and Alice are not the five. This is
why `arrival.js` was cut: it played all five gods 60 seconds after first login, minutes
before the cutscene establishing the player hears none.

### ⭐ The doctor is Alice, and she must never be named

She heals a stranger in the opening and leaves without a word. On day 7 the player meets her
again, in the dark, and she is the one who ends them. ⛔ **No hint, no journal entry, no
callback.** The connection is the reward for paying attention, and pointing at it spends it.
She has no dialogue at all in the opening, so there is nothing to leak.

---

## ④ CHUNKS

> `state · what changes · falsifier`. A chunk with no falsifier is not a chunk.

### Built

| | chunk | falsifier answered |
|---|---|---|
| ✅ | **The opening** — a **journal book** holding the 18 sentences, plus a typed title card. **No cutscene.** | harness asserts `ritual` is never called *and* that all 18 sentences are in the book — "cutscene removed" and "origin deleted" must not score the same |
| ✅ | **The title card** — typed, centred, clear of the crosshair and biome bands | 2 sends over 12.5s in the emulator; harness asserts both are typed and neither sits in a keep-out band |
| ✅ | **`arrival.js` cut** — no god speaks in Act 0 | word-boundary grep empty; blade's colour made explicit first |
| ✅ | **The randomised life cut** — one origin | harness asserts `lifeOf` is gone *and* 18 sentences still reach the player |
| ✅ | **The plot ledger** — 9 Act 0 achievements, Ethan's text verbatim. `VELDORA.story.reach(p, key)` grants and records in one call | `story_harness` 26/26: an unknown key is loud, `clear` revokes as well as un-stamps, and **the script's key list and the datapack's files are compared** — a drift in either grants silently |
| ✅ | **`align` reaches the wire** — the cutscene machinery's second silent drop, after x/y | `passthrough_check` drives a real scene with every staging field set and asserts each survives all four layers. Verified by reverting the fix: 2 failures |

### The act, in order

| | chunk | what changes | falsifier |
|---|---|---|---|
| **B1** | ✅ **Ank exists** | an Easy NPC preset — unkillable, follows you, wears his own skin. Plus the band he lives in | `ank_harness` 35/35. The preset carries `Invulnerable:1b`, `FOLLOW_PLAYER` and no attack objective; the band is asserted by sky **and** depth. ⚠️ Only the game can prove he spawns |
| **B1b** | ✅ **He leaves, with the line** | out of the band → despawn + *"A chill runs up your spine."* | `ank_harness`: fires on surfacing **and** below −32, once each, and **not** on a two-block bob. 🔴 The hysteresis was DECORATIVE first — checked below the spawn branch, so at −31 it never ran; the harness caught what the game would have shown only as a line that repeats, which reads as a design choice |
| **B2** | ✅ **Ank argues** | his words, imported from Ethan's document and given a mouth: a branching intro tree in the preset, and a **greeting on arriving, once per world day** | `ank_harness` 87/87 against the **real** `ank_lines.js`, not a fixture. Day 7 leaves as 5 separate sends; the em-dash interruption and *"apart of"* survive to the `speak()` call; a blank day reports `spoke:general` and a written one `spoke:day`. Both gates proved by reverting — removing the once-a-day stamp fails 3, stamping before speaking fails 1. ⚠️ The **preset's** tree has never been opened in game |
| **B3** | ✅ **Ank trades** | a real trade UI — ore for **wheat**, at a rate that makes no sense | `ank_harness` asserts the currency is surface-obtainable and that nothing he takes has to be mined. ⚠️ Counts are a first guess |
| **B2b** | ✅ **He speaks in the chat bar** | vanilla's own shape — `<Ank> text`, one message per line he wrote, first line immediate and the rest ~1.25s apart | `ank_harness`: every line starts `<Ank> `, carries **no** colour code and **no** tag of ours; a four-sentence line stays ONE message; the run is short enough to survive a restart. 🔴 **This REVERSES the overlay voice that shipped hours earlier** — see ⑤ |
| **B3c** | ✅ **The price falls as he loses** | four preset tiers, chosen at spawn. **Driven by descents, not days** | the ramp is read off the files: tier 0 is an ordinary trade, each tier strictly better, tier 3 absurd — and the tier reaches the spawn command, not just a table |
| **B3b** | ✅ **The urge** | days *without* the deep escalate through four tiers. Descending resets it | `urge_harness` 21/21: the ramp fits inside the seven days, a descent silences it, and an empty pool reports `no-lines:<tier>` rather than going quiet |
| **B4** | ⬜ **The cave is peaceful** | hostiles suppressed in the Act 0 band for the seven days | a player can sit in a cave on day 3 and not be attacked |
| **B5** | ⬜ **The argument, overheard** | Ank and Caebrim argue *about the player*, audible from underground | it fires only below ground, only pathless, and it is **legible without being addressed to you** |
| **B6** | ⬜ **The argument escalates** | seven days of ramp — distant and oblique → unmistakable and about you | day 1 and day 6 are distinguishable **as writing**, not just as frequency |
| **B7** | ⬜ **Caebrim finds you (~day 4)** | a physical meeting, not a voice. She warns you off | she arrives *at* the player, once, and the scene has a live consumer — `caebrim.js scene()` currently has none but an admin command |
| **B8** | ⬜ **More meetings, both of them** | days 4–7 carry repeat encounters | a player reaching day 7 has met each of them more than once |
| **B9** | ⬜ **Alice, day 7** | she appears, says her piece, disappears | it fires once, on day 7, and only after the argument has run |
| **B10** | ⬜ **She tides you** | a tide at maximum difficulty, aimed at a pathless player | ⚠️ **cannot reuse the ordinary tide loop** — that loop deliberately skips the pathless. Needs its own trigger. It must actually kill |
| **B11** | ⬜ **You wake up wrong** | the respawn says so, once, in nobody's voice | it fires on that death only, never on an ordinary one |

---

## ⑤ RULINGS

**The server stays OFF until the testing phase.** *(Ethan, 2026-09-05: "the server should
not even be on until the testing phase. we can build a prefire checklist for testing
everything after each chunk.")* The counter-argument was that a live server catches things
no offline check can — which is TRUE, and is exactly why prefire's second half exists
rather than why the server should be up. A chunk closes on `node tools/prefire.js` being
green **and its NEEDS-GAME items being written down**, not on someone having played it.

⚠️ **So "green" and "tested" are different words here, permanently.** Prefire reports what
was proved and what is still owed, and refuses to merge them. This project shipped 35/35
green with a gate never flipped, a font in nobody's load path and a title card that had
never rendered — every one invisible offline, and **nothing anywhere said so.**


**Act 0 is people keeping you OUT, not something drawing you in.** *(Ethan, 2026-09-05.)*
The counter-argument was the earlier arc — a pull downward around day 7, which is the more
familiar shape and needs no characters to carry it. **Rejected**, and it is the better call:
a lure needs no one, while a warning needs somebody who cares enough to give it, which is
what makes Ank and Caebrim matter before the player knows what they are. It also means the
player's death is *earned* rather than sprung — they were told, repeatedly, by name.

**The cave is peaceful for the seven days.** The counter-argument was that an empty cave is
boring and Minecraft's danger is free content. Rejected: the danger *is* the argument, and
mobs would bury it. It also makes day 7 a genuine change of state rather than more of the same.


**The old god introduction is cut.** *(Ethan, 2026-09-05: "we cut the old introduction and
randomized life.")* The counter-argument was that `arrival.js` is Ethan's own writing and the
five voices arguing is the best prose in the project — **rejected**, because it fires before
the opening and destroys the silence the act depends on. ⭐ **The writing survives** in
`docs/archive/28-THE-SCENES.md`; only the trigger died.

**One origin, not a randomised life.** *(Same ruling.)* The counter-argument was replay
variety — rejected: the story is the script he wrote. It was fiction anyway, `count()` was
hardcoded to 1 and `build()` discarded the index it was handed.

**Depth-death is the only route to a path.** *(`78` §5.)* The counter-argument was that drift
and champion-kill give a player who never descends a way in — rejected, because *the descent
is the act*. ⚠️ **Ruled but not implemented** — see §①.

**Ank speaks in the CHAT BAR, natively.** *(Ethan, 2026-09-05: "Nah, ank goes into the chat bar with a `<Ank>:` or however its done in minecraft natively.")* The counter-argument was mine and it was argued at length: the overlay is where every other voice in the game lives, placement is characterisation, and giving him the plainest possible overlay style — no font, no bold, hotbar-height — already said *mortal*. **Rejected, and the reason is better than the argument was.** ⭐ **The overlay is for things that are narrating at you.** Ank is not narrating; he is a man standing in a cave talking. Minecraft already has a way to show that, every player can read it without being taught, and it costs nothing. The plainest overlay style is still the overlay — the distinction I was drawing was inside the wrong surface entirely.

⛔ **So `cast.define` for Ank is DELETED, not gated.** A registered speaker with no caller is the shadow-build this project keeps catching itself doing, and leaving it "in case" is how the next session finds two voices for one man.

⚠️ **And one sentence per send does NOT apply in chat.** That rule exists because the overlay renderer shows one line per message, so a two-sentence send becomes a wrapped paragraph. Chat is a scrollback and wraps by itself. **The unit is one message per line Ethan wrote** — splitting *"Watcha buyin'. HA! Haaaa..."* into four `<Ank>` lines would invent a delivery he did not write.

**A blank day is a design, not a gap.** *(Ethan, 2026-09-05: "i left some days of dialogue blank because well there's nothing to say. we start the player's journey before the tides even became a thing. so you're good to proceed, this is also why i built alot of randomized trade dialogue aswell.")* Days 0, 1, 3, 5 and 6 have no written greeting and fall through to the rotation. The counter-argument was to fill them for completeness — **rejected**, and the reason is the arc: Act 0 starts *before* the tides exist, so on most days Ank genuinely has nothing to report, and a written line for every day would make a man with nothing to say sound like a man with an agenda. ⛔ **So a future session must not treat the blanks as a TODO.** `forDay()` returns `{lines, source}` for exactly this reason: *"he had nothing special today"* and *"nobody wrote day 5"* are the same output and must never be the same report.

**Gods carry fonts, not colours, and speak through the dialogue mod.** *(Ethan, 2026-09-05.)*
See `VOICES.md`.

**No tides for the pathless.** *(Ethan, from play 2026-08-30: "TIDES SHOULD NOT SPAWN FOR
PATHLESS PLAYERS!")* He spawned into a fresh world and a wave killed him inside a minute. The
gate sits **before the clock**, not just before the wave, so a tide cannot fire the instant a
path is taken and arrive as a punishment for choosing one.

---

## ⑥ CORRECTIONS

**"Around day 7 something pulls you DOWN."** ❌ **The arc is inverted.** *(Ethan, 2026-09-05,
rejecting most of the previous ledger.)* **Ank blocks the way and trades to keep you out;
Caebrim comes in person to warn you off.** The player descends *against advice*, from people
who turn out to be right. Chunks A4–A10, built on a day-7 lure, are void.

**"Nothing lures the player down."** ⚠️ **Over-corrected, and my own doc said it for one
revision.** Ethan's achievement text for `the_caves` is *"There is something down there, it
whispers for you to get closer."* So there IS a pull — it just is not day 7, and it is not a
god. 🔑 **Both halves are load-bearing:** a pull with no warning is an ordinary dungeon crawl,
and a warning with no pull gives the player no reason to disobey. The inversion was about
*who does the pulling*, not about removing it.

**"The seven days are bulk to be filled."** ❌ They are **the argument**, escalating. The old
A5 called it "1–2 hours of bulk" and measured it in authored lines, which is the wrong unit:
the content is one conversation getting louder, not a quantity of ambience.

**"He is the only voice in Act 0 that stands next to you — no font, no bold, hotbar height."** ❌ **Written into the digest and reversed the same day.** It was a real argument about a real distinction, made entirely inside the wrong surface: the choice was never *which overlay style* but *overlay or chat*. 🔑 The tell was that the reasoning had to explain itself — a delivery that needs a paragraph of justification to read as ordinary is not reading as ordinary.

**"The mechanism is built and every pool is empty."** ⚠️ **True when written, false the same day.** The B2 row said Ethan's writing was the only thing missing; his document arrived, and importing it found that the *mechanism* was half a mechanism — `ank_lines.js` was generated and **nothing anywhere read it.** A file full of his words with no consumer is this project's own standing failure (*a gate ships with a live consumer or not at all*), and it would have shipped looking finished.

**"`speaker.js` is the toolkit's speech surface."** ⚠️ It was a surface with **zero consumers** — `cast.define` had never been called by anything but its own doc comment, for six days. Ank is its first. ⭐ Worth saying plainly because it read as infrastructure in every doc that mentioned it, and untested infrastructure is not infrastructure.

**"Ank's day-2 line is corrupted — there is a replacement character in it."** ❌ **No: the console was.** The em-dash is U+2014, intact from his file through the JSON cache to the generated script; a Windows codepage on `print` rendered it as `�`. 🔑 Verify an encoding claim against the BYTES, never against a terminal — the same mistake read as mojibake in the MOTD, where it was real.

**"The depths are dangerous during Act 0."** ❌ **The cave is peaceful for the seven days,
deliberately.** If mobs fight the player, the argument becomes background and day 7 stops
being a change of state.


**"The tide being off for the pathless is a gap in Act 0."** ❌ **It is Ethan's own ruling**
and it is correct. ⚠️ But it has a consequence worth stating: **A10 cannot reuse the ordinary
tide loop**, because that loop deliberately skips exactly the players Act 0 is about. The
act-ending tide needs its own trigger.

**"The deep speaker is path-locked to `wall`, so Act 0's player gets nothing."** ❌ Wrong on
both halves. All five paths register a speaker, **and** `speakerFor()` returns a dedicated
pathless persona — *the Stranger*, `death_stranger`, §f white, deliberately uncoloured
because nobody has introduced her to you.

🔴 **The real finding is narrower and worse.** She has three call sites and **two are shut**:
`idle.js:225` returns `null` for a pathless player before any deep-speaker logic runs, and
`tide.js` skips them entirely. Her only live route is `night.js:119` — the 30th-night
introduction. **So the one voice Act 0's player can hear says hello once, on night 30, and is
silent forever after.** Five of her six pools are unreachable.

**`night.js:115` still says "A PATHLESS PLAYER HEARS NOBODY — speakerFor() returns null
without a path."** ❌ False since the pathless persona landed; `speakerFor` returns her. A
stale comment that would talk the next reader out of a fix.

**"`78-THE-OPENING` is a DRAFT — design only, zero code."** ❌ It said that ten minutes before
`opening.js`'s first commit named it as the design, and through five more commits after. That
banner is why this doc's status is its **location**, not a line of prose.

**"Act 0 exists as a modelled concept."** ❌ It does not. `phase.js` is a *notoriety band*
machine (helper / companion / absence / harvest) and is unrelated. Nothing in the code knows
what act a player is in — which is fine until A10, where the boundary has to be real.
