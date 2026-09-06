# 80 — The toolkit seams: what is already general, and what is Veldora

> **STATUS: LIVE — a map, not a change.** Chunk 1 of 4 in the toolkit arc. Ethan, 2026-08-30:
> *"we turn them from dedicated functions into tools"* — these systems become the open-source
> way to build stories and acts under **Arkhdottir: New Bloods**.
>
> ⛔ **Nothing was changed.** This chunk reads code and writes this doc. No `.js` behaviour, no
> deploy, no restart.

## The baseline, 2026-08-31 03:24

| | |
|---|---|
| `node tools/run_all.js` | **33/33 green** |
| `python tools/live_smoke.py` | **10 ok · 1 FAILING · 2 UNKNOWN** |
| server | up, rcon open, 0 players |

⚠️ **The three live_smoke failures are an artifact of the tool, not the server.** `kubejs
scripts`, `entity rosters` and `gods registered pools` all read boot evidence out of
`latest.log` — and the log **rolled at midnight**. Yesterday's boot is in
`2026-08-30-8.log.gz`. The server is healthy; the checks simply cannot see the boot any more.

🔑 **That is a real design defect worth carrying into the toolkit.** Three of thirteen checks
are *boot-log readers*, so they answer correctly only while the server has recently started —
which is precisely when you least need to ask. Their honest failure mode (UNKNOWN, not green)
is right; their evidence source is wrong. **A tool should ask the running system, not its
transcript.**

🔴 **And `live_smoke.py` itself crashed on the first run.** It prints emoji, the Windows
console is cp1252, and `sys.stdout` was never reconfigured — so it died with
`UnicodeEncodeError` the instant its output was piped or redirected. It only ever *appeared*
to work because it had been run interactively on a TTY. **A liveness check that cannot report
has not passed.** Fixed here (two lines, matching the guard `config_sync.py` already had)
because it blocked the mandated baseline; it is observability, not game behaviour.

---

# ⭐ THE HEADLINE: the engine is far less coupled than it looks

A raw grep for `god|tide|path|champion|blade|wall|art|forge|salvage` suggests deep coupling:

```
voice.js       195 lines        broadcast.js    39 lines
pantheon.js     49 lines        screen.js       15 lines
immersive.js     8 lines        ritual.js        6 lines
garble.js        2 lines
```

**That number is misleading and chasing it would waste the arc.** Most of `voice.js`'s 195 are
the *parameter named `god`* — which is already just a speaker key — plus comments. Measured at
the point of use instead:

| file | references to `VELDORA.paths` / `counter` / `tide` / `pantheon` |
|---|---|
| `ritual.js` | **0** |
| `broadcast.js` | **0** |
| `opening.js` | **0** |
| `bicker.js` | 4 |

⭐ **Three of the four scene-level systems are already dependency-free.** The extraction is
much smaller than the headline count implies.

---

# The seam map, per system

## `voice.js` — 1645 lines — the speaker engine

**GENERIC (most of it).** Every core function already takes the speaker as its first
argument and treats it as an opaque key:

```
registerLines(god, tag, lines)      :126     line(god, tag, player)        :143
setStyle(god, style)                :440     overlay(player, god, s, …)    :739
speak(player, god, s, tag, opts)    :831     say(player, god, tag)         :1271
sayAbout(player, god, tag, subs)    :1282
```

Nothing in that path knows what a god *is*. Rename the parameter to `speaker` and the engine
is a general dialogue system: pools by tag, per-speaker style, sentence splitting, duration
from length, screen-safe positioning.

**HARDCODED — and it is concentrated in one place.** The five speaker names appear as string
literals only in the **`/gd` debug command** (`:1407–1531`): `shot('weight','blade',…)`,
`shot('bargain','salvage',…)`, `Commands.literal('blade')`, `var g = 'wall'`. That is a test
harness for this game, not engine code.

⚠️ One soft coupling in the engine proper: **`alignedTo(player, god)`** — decides whether a
listener hears a line clean or garbled. It reaches for `VELDORA.paths.pathOf`, **and degrades
correctly**: no path system installed → returns `true` (everyone hears it clean). It is
already written as an optional integration rather than a dependency.

**TOOL API.** `speaker.register(id, {style, colour, font, pools})` · `speaker.say(player, id,
tag)` · `speaker.speak(player, id, text, opts)`. Audience filtering becomes an injected
predicate — `opts.audibleTo(player, id)` — with `alignedTo` as this game's implementation.

**ADAPTER BOUNDARY.** Keep `VELDORA.voice` as the published name with its current signatures;
have it delegate to the generic core. The `/gd` command moves out to a Veldora-only file. Zero
call sites change.

## `screen.js` — 355 lines — the delivery referee

**GENERIC — the mechanism entirely.** `claim(player, priority, seconds, continuation)` `:194`,
`backlog(player)` `:179`, `reserve(player, seconds)` `:253`. It models how much screen time is
owed and refuses anything that would arrive too late. That is a general contention problem and
the implementation has no notion of what is speaking.

**HARDCODED — vocabulary only.** The priority names are this story's:
`WHISPER · AMBIENT · ASIDE · GOD · ANNOUNCE · CRASHOUT`. `GOD` and `CRASHOUT` mean nothing to
another project; the *ladder* they describe (ambience → speech → warning → interrupt) is
universal.

**TOOL API.** Priorities become **caller-supplied data**, not constants:
`screen.configure({ambient: 0, speech: 13, warning: 15, interrupt: 999})`. The boot invariant
that already checks `HOLD[lo] + GAP <= P[hi]` becomes a validator over whatever ladder is
handed in — which makes it *more* useful, since it would catch a bad ladder in any project.

**ADAPTER BOUNDARY.** Ship the Veldora ladder as a named preset. `VELDORA.screen` keeps its
current exports.

## `ritual.js` — 624 lines — the cutscene primitive

**GENERIC — and already dependency-free (0 references).** `begin(p, spec)` `:270`,
`release(p, why, keep)` `:226`. The spec grew real range during the Opening work: `lines`,
`gap`, `perChar` per-line timing, `anchor`/`align`/`x`/`y`, `noChat`, `typewriter`,
`multiline`, `finale`, `keepAfterChoice`, `onChoose`/`onTimeout`.

**HARDCODED — six mentions, all cosmetic:** a default colour and comment references to deals
and gods.

⭐ **This is the cleanest extraction in the codebase and should be Chunk 2.** It is already a
general "play a scene, hold the world, optionally ask a question" tool wearing a Veldora name.

**TOOL API.** `cutscene.play(player, {lines, staging, pacing, finale, effects, choices})`.

**ADAPTER BOUNDARY.** Rename the module, keep `VELDORA.ritual` as an alias exporting the same
four functions.

## `broadcast.js` — 350 lines — multi-party scenes

**GENERIC.** `exchange(server, lines, opts)` `:106` and `scene(server, turns, opts)` `:233`
sequence turns so a reply never lands on top of the line it answers, pacing each turn from its
own content via `chunksTicks`. Zero references to paths/tide/pantheon.

⚠️ **BUT ITS PREMISE IS DEAD.** This module exists to deliver a scene to *several players at
once* — the two-player rule, per-listener garbling, `minPlayers`. Under the single-player
reframe that audience does not exist.

**TOOL API.** `scene.play(audience, turns, opts)` where `audience` is a list of one. The
per-listener rendering stays valuable: it is the seam where one character hears something
another does not.

**ADAPTER BOUNDARY.** No signature change needed — an audience of one already works. What
needs deciding is whether the two-player gate stays as a *configurable minimum* or is deleted.
**That is Ethan's call, not a refactor.**

## `pantheon.js` — 253 lines — the Veldora registrar

**THIS IS THE ADAPTER AND SHOULD STAY ONE.** `define(god, spec)` `:86` translates a Veldora
god into engine calls; `tierOf(god, player)` `:215` reads trust from `VELDORA.counter`. It is
exactly the layer the toolkit needs — the example of how a project binds its own vocabulary to
the general tools. **Do not generalize it. Document it as the reference adapter.**

## `immersive.js` — 484 lines — the renderer

**GENERIC.** Command construction, tag emission, the anchor table, the `probe()` liveness
check. Eight mentions, all in examples.

🔑 **Its most valuable content is the capability block at the top** — the measured record of
what the mod can and cannot do (one command = one line, `subtext` is builder-only and
unreachable from Rhino, both newline routes dead, `popup` the only two-line route). **That
block is the single most important thing to carry into the public toolkit**, because it is a
night of failures compressed into thirty lines, and it is the kind of knowledge that is
otherwise only bought by repeating the failures.

**TOOL API.** `renderer.show(player, text, opts)` / `renderer.popup(player, title, subtitle,
seconds)`, with the capability block as the contract. A different backend (a real mod) would
implement the same interface with more of it available.

## `garble.js` — 112 lines — text corruption

**GENERIC already.** Two mentions, both comments. Lift as-is.

## `opening.js` / `bicker.js` — the content-shaped callers

`opening.js` (318) is **0-coupled** and is the model for what an act-boundary scene looks like:
read lines, hand them to the cutscene tool, add a title card. `bicker.js` (271) is the
Veldora one — 4 references, tier/pair/god logic. **Keep it as the second reference adapter.**

---

# ⭐ The single highest-risk coupling

**Not a god name. It is `voice.js`'s `overlay()` → `screen.claim()` → `immersive.show()`
chain, and the fact that positioning constants are scattered across all three.**

`CROSSHAIR_BAND`, `TITLE_BAND`, `CHAT_FLOOR`, `HOTBAR_LIFT`, `SIZE_BOOST` live in `voice.js`
and encode **this client's HUD** — the crosshair, the chat bar that swallows anything
overlapping it, the Serene Seasons readout, the biome-title band from a mod we do not own.

🔴 **This is the coupling that has actually cost time.** Yesterday `ritualOverlay` silently
dropped `x` and `y` while forwarding four other fields, and three separate fixes to move the
Opening off the Seasons HUD did nothing — the caller could not tell "ignored" from "applied
and wrong". A pass-through that quietly omits a field is worse than one that errors.

⚠️ For an open-source tool this is the dangerous seam, because **every consumer will have a
different HUD.** A hardcoded god name is embarrassing; a hardcoded keep-out band is *wrong on
someone else's screen and they cannot tell why*.

**What it needs:** a declared **screen-geometry profile** — keep-out zones as data the project
supplies, with the toolkit providing the dodge algorithm and a validator. `dodgeCrosshair`'s
interval arithmetic is already general and correct; only the numbers are local.

---

# 🗂️ The doc audit

**75 docs. 24 carry multiplayer assumptions** now invalid under the single-player reframe.
`docs/archive/` exists, so the convention is **archive, not delete**.

⛔ **Nothing was moved.** This is the recommendation list only.

## Archive — purpose is multiplayer, no single-player reading survives

| doc | evidence |
|---|---|
| `09-SHARING.md` | *"Sharing — getting three friends onto the server"*. Entire purpose. |
| `08-CLIENT-PACK.md` | Distribution of the client pack to other people. |

## Update — still needed, but written for four players

| doc | what to change |
|---|---|
| `02-OPS-RUNBOOK.md` | Still the runbook; strip whitelist/parity-as-connection-risk framing. |
| `00-DESIGN.md` | The design thesis; re-frame audience as one player, acts as structure. |
| `11-OPEN-DECISIONS.md` | Several decisions were about multiplayer and are now moot. |
| `21-THE-SIX-ROLES.md`, `23-THE-PATH-SYSTEM.md`, `17-PATHS-TO-POWER.md` | Paths assume champions of *different* gods coexisting; single-player makes them sequential, not parallel. |
| `26-INTRODUCTIONS.md` | Superseded in part by `ACT0.md` and last night's work. |
| `79-THE-CONTROLS-AUDIT.md` | Already carries its own corrections; the shipping question ("send to all four") is moot. |

## Keep — mention other players incidentally, still accurate

`01-MODLIST.md`, `04-GAP-REPORT.md`, `06-BURIED-TECH.md`, `07-THEME-AUDIT.md`,
`10-DEPTH-LOOP.md`, `12-TRIAGE.md`, `13-CUT-LIST.md`, `16-THE-REFORGE.md`,
`18-THE-STALKERS.md`, `19-STALKER-BUILD.md`, `20-AUDIT-2026-08-11.md`, `35-WALL-REFRESH.md`

⚠️ **`13-CUT-LIST.md` and `07-THEME-AUDIT.md` need a health warning rather than an edit.** Two
of their rationales were found false yesterday and annotated in `tools/modlist.json` (F44
"accessories is required by NOTHING" — it is required by `spell_engine` and `simplehats`; F31
"collective is an orphaned library" — `village-spawn-point` needs it). The docs still carry the
original claims.

## ⚠️ Needs Ethan, not a rule

- **`03-AI-DM-SEAM.md`** — an AI dungeon-master seam. Single-player makes this *more*
  interesting, not less. Design question, not doc rot.
- **Anything describing the two-player bickering premise** — whether those scenes are cut,
  rewritten as overheard monologue, or kept for a future co-op mode is a story decision.

---

# What Chunk 2 should do

**Extract the cutscene tool from `ritual.js`.** It is 0-coupled, its spec is already general,
its consumer (`opening.js`) is also 0-coupled, and it is the piece every act boundary will use.
Lowest risk, highest immediate value, and it proves the adapter pattern before the arc touches
`voice.js` — which is four times the size and carries the HUD-geometry problem above.
