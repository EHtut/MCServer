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

**Where it stands.** The opening is built and lands its title card. **Everything else in the
act is unbuilt** — Ank does not exist in any form, the argument does not exist, and there is
no act state machine at all.

**B1, B3 and B3b are built; B2 is the writing.** Ank exists as an Easy NPC preset — unkillable, following,
wearing his own skin — plus the band he lives in: **underground, above y −32**, leaving when
you surface or go deeper, with *"A chill runs up your spine."* He now also **trades**: ore for **wheat**, at
a rate that makes no sense, which is the argument in a form the player can act on.

🔑 **And the wheat is the reason he trades at all.** He lives in a cave and cannot farm;
food is the one thing the surface has that he does not. So an absurd exchange rate reads as
*character* rather than a broken shop — he is not running an economy, he is paying whatever
it costs to keep somebody up there where the wheat grows.

⭐ **And the urge answers him.** Every day the player stays out of the deep, the pull gets
louder — four tiers across the seven days, reset by a single descent. **So Ank's bribe
working is what turns the volume up**, and the two systems argue through the player.

⚠️ **Proven offline only. He has never been spawned.** **Next is B2 — the words**, and they
are Ethan's: *"Once we get ank done without dialogue we can do the testing."* Every pool is
empty and the boot log says so.

🔑 **The band boundary is −32**, and it is not a number I chose: `help.js` already tells the
player *"0 to -32 the old diggings · -32 to -52 the deep works"*, so the game had committed
to it. Say if the deep works are too shallow a place for him to give up.

**🔴 What needs Ethan.** Three, all cheap to answer and all blocking something:
**(a)** Does the doctor's gift survive? The old arc had a buff granted in the opening and lost
on death; your new arc does not mention one, and *"wake up wrong"* needs something to contrast
against. **(b)** Is Caebrim's meeting fixed at day 4 or a window — you wrote "Day 4(?)".
**(c)** Is Ank a literal trader (a real trade UI) or persuasion that *reads* as a merchant?

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
| **B1b** | 🔜 **He leaves, with the line** | out of the band → despawn + *"A chill runs up your spine."* | fires on surfacing **and** on going below −32, once each, and **not** on a two-block bob at the boundary |
| **B2** | 🔜 **Ank argues** | the words. He tries hard to keep you out **without stopping you** | 🖊️ **Ethan writes these.** The mechanism is built and every pool is empty |
| **B3** | ✅ **Ank trades** | a real trade UI — ore for **wheat**, at a rate that makes no sense | `ank_harness` asserts the currency is surface-obtainable and that nothing he takes has to be mined. ⚠️ Counts are a first guess |
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
