# Telemetry — the seam between the world and the DM's memory

**Division of labour (Ethan, 2026-08-02):** Ethan owns the memory architecture —
how events are stored, indexed and recalled. This document owns everything on the
*producing* side: what an event is, what shape it has, who emits it, and where it
lands.

The two sides meet at exactly one place: an **append-only JSONL file**. Producers
append. The store consumes. Neither needs to know anything about the other.

---

## Why this is urgent even though nothing reads it yet

`nemesis_tally.js` already argued the point, and it generalises:

> *"It exists now, months before D4 reads it, because a nemesis picked from an
> empty dataset is not a nemesis. Its whole value is in being early."*

A DM will eventually want to say *"you have died to skeletons forty times"*,
*"you have never gone below y-30"*, *"you always rebuild in that same valley"*.
**None of that can be reconstructed later.** Every session played untracked is
context permanently lost. Recording is cheap; the data is not replaceable.

## The constraint that decides the whole design

**The event log MUST live outside the world save.**

Worlds get regenerated here — four times in two days at last count. `nemesis_tally`
stores its data in per-player persistent data *inside the world*, so a regen wipes
it. A DM whose memory resets every time the map is rerolled can never build
anything long-term.

    C:\MCServer\telemetry\events-YYYY-MM-DD.jsonl     <- survives world regens
    C:\MCServer\instance\world\...                    <- does not

A world regen is a **narrative** event, not an amnesia event. The DM should be
able to say "in the world before this one, you...".

---

## The event contract

One JSON object per line. No trailing commas, no multi-line objects — a partially
written line must never corrupt earlier ones.

```json
{"ts":"2026-08-02T15:42:11-06:00","v":1,"type":"player.death","player":"Rehykt","world":"w3","data":{}}
```

| field | meaning |
|---|---|
| `ts` | ISO-8601 **local** time with offset. Local because every other timestamp in this project is (`_now()` convention) and mixing is worse than either choice. |
| `v` | schema version. Present from line one so a later change is detectable rather than guessed. |
| `type` | dotted, `noun.verb`, lowercase. Stable vocabulary below. |
| `player` | username, or `null` for world-level events. |
| `world` | an id for the current world generation, so events survive regens *and* stay attributable to the world they happened in. |
| `data` | type-specific payload. Never flattened into the top level, so unknown types stay parseable. |

**Unknown `type` values must be ignored, not rejected.** Producers will grow new
event types before the store learns them.

### Vocabulary

Ethan approved all of the following (2026-08-02).

| type | data | why the DM wants it |
|---|---|---|
| `player.death` | `killer`, `killer_kind`, `cause`, `dim`, `x`,`y`,`z`, `biome` | the nemesis question, and where the world is actually dangerous |
| `player.kill` | `victim`, `weapon`, `dim`, `y` | what they fight, and what they fight it *with* |
| `player.join` / `player.leave` | `dim`, `x`,`y`,`z` | session rhythm; who plays with whom |
| `player.depth` | `y`, `deepest_session`, `dim` | the depth loop's core metric |
| `player.biome` | `from`, `to`, `dwell_seconds` | **what they avoid.** A biome entered and left in 20s is a retreat. |
| `player.build` | `chunk_x`,`chunk_z`, `dim`, `count`, `top_blocks` | where their base is, without logging every block |
| `player.advancement` | `id` | progression, cheaply |
| `session.together` | `players`, `seconds`, `range` | who actually plays *with* whom — see the chat ruling below |
| `world.generation` | `world`, `seed_note` | a regen — a story beat, not a reset |

### Chat is NOT recorded — and that decides more than it looks like

Ethan, 2026-08-02: *"most communication is done through vc and chat is
unreliable."*

That is not merely "low value". It makes chat a **biased sample**: the things
people bother to *type* when they are already talking are the atypical ones. A
DM modelling this group from chat would be over-weighting its least
representative channel, and would do so invisibly.

It compounds with a limit found separately: **no mod captions other players'
voice.** All ~40 Simple Voice Chat addons for 1.21.1 were enumerated; the only
speech-to-text goes the wrong way (your own mic into your own chat) and requires
each player to hand-install a VOSK or Whisper model, which breaks the one-click
install this pack is built around.

So the honest position is: **the DM will be permanently deaf to most of what
this group says.** That is a fixed constraint, not a gap to close later.

The consequence is that behaviour has to carry the weight speech cannot. Every
plan agreed in voice still leaves residue — two people walking to the same place
and staying there. `session.together` samples pairwise proximity every 10s
within 24 blocks and flushes every 5 minutes. 24 blocks is roughly "in sight and
working on the same thing", close enough to exclude two people who merely share
a biome.

Anything the DM would have learned from *hearing* them has to be inferred from
where they go, what they avoid, what they build, and who they do it beside.

### Two volume decisions, made deliberately

**Block placement is NOT one event per block.** That is thousands of lines an
hour and buries everything else. Instead the producer accumulates placements per
chunk and flushes a single `player.build` every 5 minutes with a count and the
most-placed block types. That preserves the only thing the DM actually wants —
*where they are building and roughly what* — at ~1/1000th the volume.

**Biome is emitted on CHANGE, never on a timer**, and carries `dwell_seconds`
for the biome being left. Dwell time is what distinguishes "walked through" from
"lived there" from "fled".

---

## Transport — decided by a constraint, and better for it

**KubeJS cannot write to the sink.** It enforces a sandbox and refuses any path
outside the game directory: *"You can't access files outside Minecraft
directory"* (verified in `KubeJSPaths`). `C:\MCServer\telemetry\` is outside it.

Python is not sandboxed. So the split is:

```
KubeJS ──console.info──> server log ──logq.py──> C:\MCServer\telemetry\*.jsonl ──> the store
                              ↑
                     vanilla events too
                     (deaths, joins, advancements)
```

KubeJS emits one line per event, marked so it is trivially separable:

    [CC-TELEMETRY] {"type":"player.kill","player":"Rehykt",...}

`logq.py` extracts those, extracts the vanilla events the log already carries,
normalises both into the schema above, and writes the JSONL.

This is better than having KubeJS write files even if it could:

* **one transport, one parser.** `logq.py` has to read the log regardless, since
  deaths and joins only exist there.
* **append is free.** A JSON file written through `JsonIO` would need
  read-modify-write per event, which is O(n) and corrupts under a crash.
* **it survives KubeJS being broken.** Vanilla events keep flowing.
* **the sink stays outside the world** without fighting the sandbox.

The cost is log noise and a dependency on log rotation, both of which `logq.py`
must handle anyway — including reading `.log.gz` archives and using
`errors="replace"`, because the log contains binary bytes.

**Sink path resolved:** `C:\MCServer\telemetry\`. It sits outside
`instance\world\`, so a regen cannot touch it, and outside the KubeJS sandbox,
which no longer matters because only Python writes there.

## Producers

### 1. KubeJS — the primary, and the only source for most of this

Real-time hooks with full context. It is the ONLY thing that can see block
placement, kills-with-weapon, and depth. If it does not record them, they are
gone.

Known hazards, all learned the hard way in this repo and all applicable here:

* `PlayerEvents` has **no** `death` event — use `EntityEvents.death` and filter.
* KubeJS does not throw on an unknown event name; it logs once and registers a
  no-op. A typo therefore produces a file that loads cleanly and does nothing.
* `entity.type` returns an EntityType **object**, not a string. Use
  `String(entity.getType().id)`.
* Rhino will not hand back a bare Java method reference, so
  `obj.method ? obj.method() : fallback` selects the fallback **even where the
  method exists**. Call it inside a `try` instead of probing for it.
* **"Could not read" and "nothing to record" must never be the same value.**
  Every silent-failure bug in this project has been that mistake.

### 2. `logq.py` — the backfill and the safety net

The server log already contains deaths (with vanilla cause text), joins, leaves,
advancements and chat. Parsing it is redundant with KubeJS by design:

* it works **retroactively** — there are existing logs from sessions already
  played, so some history can be recovered rather than lost
* it keeps producing if a KubeJS script breaks, which has happened twice
* it needs no server restart to change

**It must read with `errors="replace"`.** The server log contains binary bytes;
plain text reads and `grep` silently return nothing on it, which caused three
false "the server did not boot" conclusions in one night.

### 3. `world.py` — observation, not events

Poll-shaped state for "what is happening right now": players, positions, health,
inventory, dimension, biome, nearby entities, time, weather, structures. This
does not write to the event log. It answers questions at the moment the DM asks.

---

## What is deliberately NOT here

**No action layer.** Emitting events and changing the world are separate
concerns and separate risk profiles. An LLM with raw RCON can `/kill @a`, `/ban`,
or flatten a base. That layer gets designed on its own, with an intent-level API,
a hard deny-list, and an audit log of everything it did. Not bundled with
telemetry.

**No inference.** Producers record what happened. "Rehykt is avoiding caves" is
the store's job, or the DM's. Anything that decides *meaning* here would bake
today's guesses into tomorrow's data.

---

## Build order

1. **The KubeJS producer.** Everything it sees is unrecoverable if delayed.
2. **`logq.py`**, including a backfill pass over existing logs.
3. **`world.py`**.
4. The action layer, separately and later.

## Open questions for Ethan

1. **Sink path** — is `C:\MCServer\telemetry\` right, or does your memory
   architecture want it somewhere else? Trivial to change now, annoying later.
2. **Rotation** — daily files, or one growing file? Daily is easier to ship and
   to prune; one file is easier to tail.
3. **Chat** — record it? It is the richest signal about what players *care*
   about, and also the most personal. Your call, not mine.
