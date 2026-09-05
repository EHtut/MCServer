# VOICES — the dialogue mod, the gods, and how to write for either

> Everything that puts words on a player's screen. The mod's real limits, where each god
> stands, and the rules any new voice has to satisfy.

---

## ① DIGEST

**What this is.** The single reference for authoring dialogue in Arkhdottir. Three parts:
what the renderer can actually do (§3, all measured live), where every existing voice
stands and why (§4), and the rules a new voice must satisfy (§5).

**Where it stands.** The five gods are placed, styled and written. The opening cutscene is
live and ends on its title card. `tools/dialogue_check.js` gates all of it without the game.

**What changed under it, 2026-09-05.** Gods are moving to the dialogue mod and off the chat
bar, and **gods no longer carry colours** — they carry per-god *fonts*. `arrival.js`, the
old five-god join scene, is cut. Both are Ethan's rulings; see §6.

**Next chunk.** Finish the chat-path retirement: `voice.js` already has `CHAT_COPY = false`,
but callers that bypass it with their own `tell()` still exist — `pathless.js:189` and
`:202` are known. **Falsifier:** a tree-wide grep for god-coloured `tell(` returns nothing,
and `dialogue_check.js` stays clean.

**What needs Ethan.** Whether the keep-out numbers in §3 should be per-client config rather
than constants — they are measured on his screen and are wrong on anyone else's.

---

## ② ROUTING

| | |
|---|---|
| **OWNS** | the renderer's measured limits · every voice's placement and style · the authoring rules · the god index |
| **DOES NOT OWN** | *what the gods say* → `docs/dialogue/*.md` and the `*_voice.js` pools · *the general toolkit for other projects* → `docs/TOOLKIT.md` · *the tide, paths, notoriety* → their own docs |
| **STATE** | → `docs/STATUS.md` |
| **FINDINGS** | → `docs/DEFECTS.md`, with `D-` ids |
| **VERIFIED BY** | `node tools/dialogue_check.js` — every rule in §5 is enforced there, not merely written here |

---

## ③ THE RENDERER — what it can actually do

> ⚠️ **Every line here was measured against a live client.** None is inferred from the mod's
> source or its docs. The failures do not look like failures — they look like the text was
> truncated, or like your deploy never landed.

| you might try | what happens |
|---|---|
| two lines in one message | **impossible** — see below |
| `\n` in your text | renders **literally**, as a visible backslash-n |
| a real newline | renders as an **LF glyph box**, and **dropped the player's connection** with a Network Protocol Error |
| `maxWidth` in the NBT | a real field in the mod, and **ignored** — 90 and 400 produce identical output |
| `subtext` in the NBT | **ignored.** Real, recursive, and **builder-only** — reachable from Java, not from a command |
| `popup <player> <secs> <title> <subtitle…>` | ✅ **works** — the only command route to a second line |
| `fadein` **and** `fadeout` together | the mod's handler is an `if / else-if`, so the second is **silently dropped**. Send neither and take its paired defaults |

### ⇒ The consequence that shapes every scene

**One command renders one line.** Text arriving a line at a time is *separate messages*.

🔑 **But they QUEUE, they do not replace.** `speakChunks` sends every sentence of an
utterance in one tick with no scheduling at all — and that works because the mod holds a
backlog. `screen.js` exists to model exactly that: `drain[k]` records when the screen next
frees up, and `claim()` refuses a new utterance while the previous one is still owed.

⚠️ **Getting this backwards produced 347 false failures** in the first version of the
emulator. A beat starts when the one before it *finishes*, not when its command is sent.

### The screen's own geometry

Minecraft's GUI grid at scale 3 is **640×360**, and **y grows DOWNWARD**. So a TOP anchor
needs positive y, and a BOTTOM anchor needs **negative** y — a positive y from the bottom
pushes the line off the edge, where it renders perfectly and nobody can see it.

🔴 **The keep-out bands are CENTRE-RELATIVE**, and they only apply to `CENTER_*` anchors:

| band | y range | why |
|---|---|---|
| crosshair | −34 … 34 | text sits on the reticle and cannot be read |
| biome title | −53 … −11 | Traveler's Titles draws biome names through here |
| chat bar | 60 … | **anything overlapping it is not rendered at all** |

⚠️ **The bands are exclusive at their edges.** `dodgeCrosshair` cuts a band out by pushing
the free interval starting *at* `band.hi`, so y=34 is the first **legal** value. Treating it
as forbidden flagged forge for a position `voice.js` had deliberately chosen.

⛔ **These numbers are Ethan's client.** A hardcoded speaker name is embarrassing; a
hardcoded keep-out band is *wrong on somebody else's screen and they cannot tell why*.

---

## ④ THE GOD INDEX — where each voice stands, and what the placement means

> ⭐ **Position is characterisation, not layout.** Ethan, 2026-08-30: *"Blade — Upper middle
> of screen — He talks down to you."* Every row below is a decision about who the speaker is.

| god | anchor | x | y | size | effects | font | the read |
|---|---|---|---|---|---|---|---|
| **blade** | `TOP_CENTER` | — | +40 | 1.50 | — | `veldora:blade` | **above you.** Every line arrives from over your head |
| **art** | `CENTER_CENTER` | — | −70 | **1.88** | wave, italic | `veldora:art` | **dead centre and largest** — she blocks your view |
| **wall** | `CENTER_CENTER` | +3 | −89 | 1.42 | italic | `veldora:wall` | high centre, just off-axis — leaning in |
| **forge** | `CENTER_CENTER` | −166 | −107 | 1.35 | italic | `veldora:forge` | **upper left, far out** — talking past you, not to you |
| **salvage** | `TOP_RIGHT` | −12 | +30 | 1.35 | — | `veldora:salvage` | **where the game puts bookkeeping** |

⭐ **Salvage's corner is the sharpest of these.** Ethan ruled it 2026-08-30: *"Salvage speaks
top-right, like a quest log."* The other four take the centre because they expect to be
looked at. She sits in the HUD's admin corner — the one god you can ignore, which is the
whole shape of a deal.

⭐ **Forge's x=−166 is not a mistake.** He is thrown far enough left to read as *not
addressing you*, which is his character before it is his position.

### The scatter

Placement is not fixed per line. `dodgeCrosshair(y, reach)` builds the allowed intervals
inside the god's reach, cuts the keep-out bands out of them, and samples **uniformly by
interval length**.

🔴 **It resamples; it does not shove to an edge.** The obvious version — *"if it landed in a
band, push it to the nearer rim"* — was measured over 200k throws and put **55.6% of Wall's
lines into one 20px strip**. Everything ejected from a band lands on that band's rim, so the
cure produced the disease it was written to prevent.

### Timing

| | value | |
|---|---|---|
| typing rate | **15 chars/sec** | fixed in the mod, unreachable from Rhino |
| minimum on screen | **12.0s** (240t) | Ethan tried 7s in play: *"increase back to 10-15 seconds again"* |
| ceiling, any one beat | **15.0s** | D-131: *"a single line holding for more than 15s? no."* |
| gap between beats | 0.5s | `screen.gap()` |

**Priority holds** (`screen.js`), the cap on how long a claim may own the screen:

| priority | hold | what it is |
|---|---|---|
| `WHISPER` | 9.5s | the dead muttering — only into a genuinely empty screen |
| `AMBIENT` | 1.5s | the place talking |
| `ASIDE` | 12.5s | your own head |
| `GOD` | 14.5s | a god addressing you |
| `ANNOUNCE` | 8.0s | something is about to happen |
| `CRASHOUT` | 12.0s | a god announcing their own tide. **Always gets through** |

⚠️ **`beatScale` scales the READING half only, never the typing.** That is what makes Forge
quick without making anyone else quick, and without risking a line cut off mid-word.

---

## ⑤ HOW TO WRITE A VOICE

### The two hard rules

**1. One sentence per line.** Ethan, repeatedly: *"every sentence is on a new line, that is
a hard rule with everything I write that goes here."*

🔴 **This is checked on the WRITING, not on the output, and the distinction is load-bearing.**
`voice.js` splits a two-sentence line into two sends before anything reaches the renderer —
so by the time a beat exists it is always one sentence, and a check that looks at beats can
never see a violation. The rule lives in `SOURCE_RULES`, applied to the raw lines.

⚠️ **An abbreviation trips it, and that is correct.** The engine's splitter breaks on a full
stop followed by a space, so `"Mr. Smith is waiting."` really would be sent as two messages.
Avoid abbreviations, or fix the splitter first.

**2. Always typed.** *"anytime type is not the method used to show text it looks terrible."*
`typewriter` defaults on.

### Declaring a voice

A god registers through `pantheon.define(GOD, {...})` inside its own `ServerEvents.loaded`.
Everything about *how* it speaks is in `style`; everything it *says* is in `lines` / `frags`
/ `context`.

```js
VELDORA.pantheon.define('blade', {
  label: 'The Warrior',
  tiers: { medium: MEDIUM_AT, high: HIGH_AT },
  style: { anchor: 'TOP_CENTER', y: 40, size: 1.5, font: 'veldora:blade', beatScale: 1.0 },
  lines:   { idle: [...] },                          // whole sentences
  frags:   { warn: { opens: [...], closes: [...] } },// every open × every close
  context: { deep: [...] },
})
```

**`lines` are whole sentences. `frags` are combinatorial** — four opens and four closes give
sixteen lines from eight written strings.

### Before you push

```bash
node tools/dialogue_check.js --file draft.txt
```

That runs your text through the pack's **real** duration and placement maths before it is
pasted into any file. `node tools/dialogue_check.js` alone checks every scene and every god.
`node tools/dialogue_emu.js <name> --play` watches it instead of judging it.

⚠️ **`--selftest` runs first and is not decoration.** "Clean" is worth nothing until
something proves the rules can still fire.

### The checklist

- [ ] one sentence per line, no abbreviations
- [ ] no `\n`, escaped or real
- [ ] no beat over 15s, none pulled before it finishes typing
- [ ] `CENTER_*` placement clears the crosshair, title and chat bands
- [ ] a colour is **not** declared — gods carry fonts now (§6)
- [ ] `[CLAUDE-DRAFT]` markers removed, or knowingly left and reported
- [ ] `dialogue_check.js` exits 0

---

## ⑥ CORRECTIONS — what this doc used to get wrong

> ⭐ The highest-value section. A wrong claim left standing is a trap for the next session.

**Gods have colours.** ❌ **They do not, as of 2026-09-05 (Ethan).** They render in per-god
custom fonts — `font:"veldora:blade"` — and the colour system is being retired with the chat
path. Colour survives *only* in the emulator's HTML player, where fonts cannot be loaded and
colour stands in for speaker. ⛔ Do not add a `colour:` to a god.

**Gods speak in chat.** ❌ **Not any more.** `voice.js` has `CHAT_COPY = false`. Callers that
bypass it with their own `tell()` are the remaining work, not the design.

**`arrival.js` reserves the god colours centrally.** ❌ **`arrival.js` is deleted** (2026-09-05).
It was quietly the pack's only explicit `setColour('blade')`; blade declares his own now.

**A message replaces the one before it.** ❌ **They queue.** See §3.

**The title card renders.** ❌ **It never did until 2026-09-05.** `ritual.js` gated the finale
on `spec.finale.text`, and a popup card has no `text` — so the beat the whole opening builds
to was skipped on every play, under a commit message saying it landed. Fixed; `tools/finale_check.js`
runs the real `ritual.js` and would catch it again.
