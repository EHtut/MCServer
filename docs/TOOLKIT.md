# The story toolkit

> Build interactive stories in Minecraft: speakers who say things, scenes that take the
> world away, and content that lives in a document rather than in code.
>
> Extracted from **Arkhdottir: New Bloods**. Runs on KubeJS + the
> [Immersive Messages](https://immersive.txni.dev/) API.

**Three tools, one rule each:**

| tool | what it is | the rule it enforces |
|---|---|---|
| `speaker.js` | a named voice with a look and things to say | one sentence per send · always typed |
| `cutscene.js` | take the world away, say things, give it back | refuses a setting it cannot deliver |
| `story_import.py` | one document format, one parser | the sentence rule, checked at write time |

---

# ⚠️ READ THIS FIRST: what the renderer can actually do

**Every line below was measured against a live client, not inferred.** A session was lost
learning them, and the failures do not look like failures — they look like the text is
truncated, or like your deploy did not land.

| you might try | what happens |
|---|---|
| two lines in one message | **impossible** — see below |
| `\n` in your text | renders **literally**, as a visible backslash-n |
| a real newline character | renders as an **LF glyph box**, and **dropped the player's connection** with a Network Protocol Error |
| `maxWidth` in the NBT | a real field in the mod, and **ignored** — 90 and 400 produce identical output |
| `subtext` in the NBT | **ignored**. It is real, recursive, and **builder-only** — reachable from Java, not from a command |
| `popup <player> <secs> <title> <subtitle…>` | ✅ **works** — the only command route to a second line |

## ⇒ The consequence that shapes every scene you write

**One command renders one line.** Text that arrives a line at a time is *separate
messages*, and each one **replaces** the last. Nothing accumulates on screen.

Do not design a scene that needs two lines visible at once. It cannot be built on this
renderer. Typing is what makes the replacement read as a beat *arriving* rather than a line
popping — which is why the toolkit types by default and will argue with you about it.

🔑 If you need a real multi-line block, `subtext` is the right mechanism and it needs
either your own mod or a small PR to Immersive Messages adding `subtext` to the NBT codec.
The field and its codec already exist; only the deserializer is missing.

---

# `speaker` — somebody says something

A speaker is a **named voice**. Not a god, a patron, an NPC or a quest-giver — those are
your vocabulary. The tool has never heard of them.

```js
VELDORA.speaker.define('narrator', {
  colour: '§7',
  style:  { anchor: 'TOP_LEFT', font: 'mypack:serif', beatScale: 0.6 },
  lines:  { greeting: ['You again.', 'Still here, then.'] },
  frags:  { warning:  { opens: ['Go back'], closes: ['while you can.'] } },
})

VELDORA.speaker.say(player, 'narrator', 'greeting')
```

| call | does |
|---|---|
| `define(id, spec)` | registers a speaker. Returns a report, or `null` if refused |
| `say(player, id, tag)` | one line from that pool. `false` if nothing was said |
| `speak(player, id, text, tag, opts)` | a specific line |
| `known()` / `report(id)` | what is registered, and how much of it is written |
| `carriesTwoSentences(text)` | lint your own writing before you ship it |

**`lines` are whole sentences. `frags` are combinatorial** — every open pairs with every
close, so four opens and four closes give you sixteen lines from eight written strings.

### The two rules, and why they are enforced rather than suggested

**One sentence per send.** The renderer shows one line per message, so a send carrying two
sentences does not become two lines — it becomes one wrapped paragraph. `say()` refuses it
and tells you which line.

**Always typed.** Typing is the only appearance method that looks deliberate; everything
else reads as a glitch. `typewriter` defaults on. An explicit `false` is still respected.

⚠️ **Both of these slipped repeatedly while merely documented.** They are checks now.

⚠️ **Abbreviations trip the sentence rule**, and that is correct rather than a bug: the
engine's own splitter breaks on a full stop followed by a space, so `"Mr. Smith is
waiting."` really would be sent as two messages. Avoid them, or fix the splitter first.

---

# `cutscene` — take the world away

```js
VELDORA.cutscene.play(player, {
  lines:   ['You were a traveler.', 'A life of adventure before you.'],
  preset:  'journal',
  staging: { anchor: 'TOP_LEFT', align: 0, x: 20, y: 110 },
  pacing:  { perChar: true },
  finale:  { popup: true, title: 'ACT ONE', subtitle: 'A new day', seconds: 9 },
})
```

The player is rooted, blinded, made invisible and made **unkillable** for the duration —
resistance is not optional, because somebody who cannot move must not die to a skeleton
while a scene plays at them.

| group | keys |
|---|---|
| `staging` | `anchor` `align` `x` `y` `colour` `typewriter` `multiline` `chat` |
| `pacing` | `gap` `perChar` `timeout` `holdAfterChoice` |
| `finale` | `popup` `title` `subtitle` `text` `anchor` `size` `seconds` `after` |
| `choices` | `options` `onChoose` `onTimeout` |

**Presets** — `monologue` (centred, somebody speaking to you) and `journal` (top-left,
reads down the page like something being written). Your values win over a preset's.

**`perChar` times each line from its own length**, so a long sentence is never cut off by a
short one's clock. Use it for anything you did not write to a fixed width.

### 🚨 It refuses settings it cannot deliver

`play()` returns `false` and names the key. This exists because a pass-through once
forwarded four fields and **silently dropped two** — the same fix was made three times
against a boundary that never carried it, and it looked like the deploys were not landing.

**A pass-through that quietly omits a field is worse than one that errors**, because the
caller cannot tell "ignored" from "applied and wrong".

### ⚠️ Screen geometry is the seam that will bite you

`cutscene.geometry` declares what the scene dodges:

```js
{ hudTopLeft: 110,   // clears a HUD readout at the top-left
  chatFloor:  60 }   // below this the chat bar eats the text entirely
```

**These numbers are local to one client.** A hardcoded speaker name is embarrassing; a
hardcoded keep-out band is *wrong on somebody else's screen and they cannot tell why*. The
dodge algorithm is general — override the numbers for your HUD.

---

# `story_import.py` — content as a document

```
# speaker: narrator
  colour: §7
  style: anchor=TOP_LEFT, typewriter=true

## greeting
You again.
Still here, then.

# scene: act0-arrival
narrator: You were a traveler.
narrator: A life of adventure before you.
```

```
python tools/story_import.py --selftest      # prove the parser works
python tools/story_import.py                 # parse and report, write nothing
python tools/story_import.py --write         # emit the registration script
```

- **A blank line ends nothing.** Only a new `#` or `##` heading does — people write in
  paragraphs, and a format that treated blank lines as terminators would silently truncate
  at the first one.
- **The sentence rule is checked at import**, with a line number, using the engine's own
  splitter. An importer that accepted what the runtime later refuses would move the failure
  from write time to play time.
- **`[CLAUDE-DRAFT]` lines are counted and reported, never dropped.** A pool that goes
  quietly empty looks identical to a system that is switched off.

---

# A scene, end to end

```js
// 1. define who is speaking
VELDORA.speaker.define('narrator', {
  colour: '§7',
  style: { anchor: 'TOP_LEFT', beatScale: 0.6 },
  lines: { arrival: ['The road ends here.'] },
})

// 2. play the opening as a journal that writes itself down the page
VELDORA.cutscene.play(player, {
  preset: 'journal',
  lines: [
    'You were a traveler.',
    'A life of adventure before you.',
    'The road ends here.',
  ],
  pacing: { perChar: true },
  finale: { popup: true, title: 'ACT ONE', subtitle: 'A new day', seconds: 9 },
})

// 3. later, in the world, the narrator says one thing
VELDORA.speaker.say(player, 'narrator', 'arrival')
```

⚠️ **`play()` returning `false` is a real answer** — the player may already be in a scene.
Never fire and forget: if the scene is once-per-world, un-stamp your "seen" flag on a
`false` or the player loses it permanently.

---

# Testing

```
node tools/run_all.js          # every harness and check
python tools/live_smoke.py     # ask the RUNNING server, not a sandbox
```

**These answer different questions and you need both.** The harnesses test pure functions
against fixtures — they proved 35/35 green while the pack shipped with a gate that had
never been flipped, a font in nobody's load path, and a boot report that threw on every
start. A sandbox cannot see a constant with the wrong value, a file that never reaches a
client, or a callback that dies with the process.

Two rules worth stealing:

- **An UNKNOWN is a FAILURE.** "I could not check" and "I checked and it was fine" must
  never share an exit code.
- **Never let a test carry its own copy of a constant the code owns.** Five assertions
  broke in one session from exactly that — each time because a *correct* change moved a
  value out from under a stale duplicate.
