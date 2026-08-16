# BUILDING A GOD — the workflow

> ⭐ **THE POINT OF THIS DOC.** Blade took a full day and ~1,540 lines. **He should be
> the last one that expensive.** Everything he needed that was not *his writing* is now
> shared infrastructure, already built and already debugged. A new god is **two files
> and fifteen calls.**
>
> Reference implementation: **`docs/40-BLADE-THE-WARRIOR.md`**.
> Every argument behind it: `docs/audit/Blade-BuildHistory-2026-08-15.md`.
>
> ### 🚫 THE ROSTER IS FIVE: **Blade · Salvage · Forge · Wall · Art**
> **Crown is RETIRED** — merged into Wall 2026-08-14 (`docs/35` §6). Ethan: *"the
> spider mother wants you to build a family, a web, like hers."* Wall's household
> holds the living (MineColonies) and the dead (Goety). His writing is kept in `27`
> and `28` marked RETIRED; **nothing is built from it.** `tools/new_god.py` refuses
> the key.
>
> Order: Blade ✅ → **Wall** → Forge → Salvage → Art.

---

## 0. The thesis

**A god is a voice, a number, a list of events, one collection, and one exit.**

Nothing else about a god is code. The entities are *actors* it sends — it never has a
body. The mechanisms are shared. What makes Wall different from Blade is **what she
says, what she counts, and what she sends** — and all three are data.

```
        ┌──────────────── SHARED, ALREADY BUILT ────────────────┐
        │  voice · godevents · harvest · counters · ritual      │
        │  spawner · idle · phase · reckoning · fall · paths    │
        │  coefficients · notoriety · regard · deep_speaker     │
        └───────────────────────┬───────────────────────────────┘
                                │  15 calls
             ┌──────────────────┴──────────────────┐
             │  <god>_voice.js     <god>_events.js │   ← ALL you write
             └─────────────────────────────────────┘
```

---

## 1. The seams — every call a god may make

**Copy this list. If you need a sixteenth call, you are building infrastructure, and it
belongs in a shared file where every god gets it.**

### Voice — `voice.js`

```js
VELDORA.voice.setColour(god, '§4§l')          // the god's chat colour
VELDORA.voice.register(god, tag, opens, closes)   // COMBINATORIAL: n×m lines
VELDORA.voice.registerLines(god, tag, lines)      // WHOLE lines, no recombination
VELDORA.voice.say(player, god, tag)               // → bool. false = nothing for that tag
VELDORA.voice.sayAbout(player, god, tag, {name: 'x'})   // {placeholder} substitution
```

### Events — `godevents.js`

```js
VELDORA.events.register(god, {
  id:       'gauntlet',                 // required, unique per god
  run:      function (server, p) {},    // required. → false means IT DID NOT HAPPEN
  tiers:    ['low','medium','high'],    // default: all three
  hostile:  true,                       // hostile ⇒ obeys the health floor
  cooldown: 2,                          // world days, default 2
  weight:   1,                          // relative pick weight, default 1
  guard:    function (server, p) {},    // → false to hold, with a reason in /events
})
```

### The Harvest — `harvest.js`

```js
VELDORA.harvest.register(god, {
  arrive: function (server, p) {},   // required. → false = DID NOT ARRIVE, will retry
  onWin:  function (server, p) {},
  onLose: function (server, p) {},
  tag:    'veldora_<god>_actor',     // resolve() removes anything wearing it
})
VELDORA.harvest.resolve(server, p, won)   //  win/lose from your own hooks
VELDORA.harvest.active(p)
```

### The rest

```js
VELDORA.counter.get(player, god)             // → int, or NULL if unreadable. NEVER 0
VELDORA.counter.add(player, god, n, why)
VELDORA.spawner.wave(player, {ids, count, minDist, maxDist, nbt}, onMeasured)
VELDORA.ritual.begin(p, {lines, gap, options, onChoose, onTimeout, holdAfterChoice})
VELDORA.ritual.active(p)
VELDORA.paths.pathOf(player)                 // → path key or ''
```

---

## 2. The workflow — ten steps, in order

### ① The writing comes first *(Ethan)*
Character, relationships to the other five, what it wants, and **what it is like at
low / medium / high trust**. Without this the tags are guesses.

> ⚠️ **Blade's first voice pass was thrown away** because the brief was wrong —
> contemptuous instead of hard-but-invested. Rewriting 500 lines costs more than
> agreeing the register first.

### ② Pick the counter metric
One number that means *appeasement*, distinct from XP/notoriety. Blade counts **enemies
slain**. Wall should count something about **what is built, held and fed** — her
household is the fantasy, so the number should grow when the household does.

Add the key to `counters.js` `PATRONS` (already present for every key).

### ③ Pick the trust thresholds
Two integers. **They are a first guess and they are meant to be** — replace them with a
measured curve once there is play data. Blade: 50 / 200.

### ④ Write `<god>_voice.js`
Copy `blade_voice.js`. Keep `tierOf` exactly as written:

```js
if (n === null) return null       // 🚨 unreadable is NOT 'low'. Say NOTHING.
```

Register the tag families. Add `rare_<tag>` siblings for the pools where the god is a
*person* rather than a function.

### ⑤ Write the introduction into `docs/28-THE-SCENES.md`
**Not into `introductions.js`.** The doc is the source of truth; the script is
generated:

```bash
python tools/gen_scenes.py
```

A line beginning with `*` is **narration** — grey italic, not the god speaking. Use it
for bodies and rooms; a voice cannot say *"you are afraid"* without telling the player
how to feel.

### ⑥ Choose the actor
An entity from a mod that fits the god thematically. Blade sends a Fallen Chaos Knight
from his own mod, so the actor is made of the same stuff he is.

> 🚨 **`/summon`, never `createEntity().spawn()`** — the latter skips `finalizeSpawn`,
> which is where Born in Chaos sets hostility. `spawner.js` already does this correctly;
> use it.

### ⑦ Write `<god>_events.js`
Copy `blade_events.js`'s skeleton. **Start with three events, not twelve.** Blade's
twelve exist because he is the combat god and eight of them are spawner calls.

### ⑧ Register the Harvest
What arrives, and what winning means. **Blade graduates you; the other four collect** —
that asymmetry is deliberate and `harvest.js` is a registry precisely so each god may
differ.

### ⑨ Fill the shared rows
`fall.js` · `regard.js` · `help.js` · `paths.js` · `coefficients.js` · `spawn_pressure.js`
— most already have a row for every key from earlier work. **Check, do not assume.**

### ⑩ Deploy, restart, READ THE BOOT LOG

```bash
python tools/sync_scripts.py --deploy
python tools/serverctl.py restart
python tools/logq.py grep "\[<god>"
python tools/logq.py errors
```

---

## 3. 🚨 The invariants — every one of these was paid for

**Ordered by how much they cost.**

| # | rule | what it cost |
|---|---|---|
| 1 | **`/kubejs reload server-scripts` is UNSAFE.** `ServerEvents.loaded` does not re-fire. Restart. | E3 shipped into the void — "18/18, 0 errors" while nothing ran |
| 2 | **`repo/pack/kubejs/` and `instance/kubejs/` are SEPARATE COPIES.** Always `sync_scripts.py --deploy`. | the same |
| 3 | **Read the boot log for YOUR line, not for "it loaded".** | the confession never armed while the line above it printed success |
| 4 | **"I failed" and "I found nothing" must never share a return value.** | `tierOf` returning `'low'` on a read failure = a god who insults you because storage hiccuped |
| 5 | **`persistentData.getInt()` returns 0 for a missing key.** Store `day+1`. | a brand-new walker read as 82 days neglected |
| 6 | **The world clock is NOT monotonic** — admins run `/time set`. Always handle a stamp from the future. | `fall.js` would have locked a player out for ~10,000 days |
| 7 | **`String(entity.type)` is not the bare id.** Match with `indexOf`. | "measured 0" with the mobs visibly standing there |
| 8 | **A summon is not queryable in the tick it is issued.** Measure on a delay. | the same |
| 9 | **A `run()`/`arrive()` returning `false` must NOT stamp a cooldown or a lock.** | a Harvest marked done that never arrived |
| 10 | **Clean up your actors on resolve, win or lose.** | the champion kept killing Ethan after the Harvest had ended |
| 11 | **Refuse if a scene is already running.** Do not push through. | the Harvest could land on a player blind and rooted in the confession |
| 12 | **Rhino:** no `const` in a nested block of a repeatedly-invoked callback; a bare Java method reference reads as falsy. | telemetry threw on **every** player death for weeks |
| 13 | **`ServerEvents.loaded(function (event) {…})`** — take the parameter. | `event.server` threw, silently |
| 14 | **Timings derive from the primitive's own constants**, never a number that looked right. | a cutscene beat landing after the world came back |
| 15 | **Generated files: edit the DOC, re-run the generator.** | `gen_scenes.py` ate its own marker and Blade's scene silently drifted |

---

## 4. ⚠️ What is NEVER per-god

If you find yourself writing one of these inside `<god>_events.js`, **stop** — it
belongs in a shared file, and every other god needs it too.

- rolling, cooldowns, the health floor → `godevents.js`
- spawning, roster validation, measurement → `spawner.js`
- blind / root / protect / de-target → `ritual.js`
- the Harvest lock and actor cleanup → `harvest.js`
- counter storage, day stamps, clock guards → `counters.js`
- idle cadence and context selection → `idle.js`
- escalation bands and hysteresis → `phase.js`
- **the exits** → `fall.js`, and **absence, which does not exist yet**

---

## 5. The scaffolder

```bash
python tools/new_god.py crown --actor born_in_chaos_v1:missioner --counter "holdings claimed"
```

Writes `<god>_voice.js` and `<god>_events.js` pre-wired to every seam above, with the
invariants already encoded (null-safe `tierOf`, day+1 stamping, clock-rollback guard,
`false` on failure to arrive, actor tag declared). **It generates structure, never
writing** — every line pool ships empty with a `TODO(ethan)` marker, and the boot log
reports how many are still unfilled, so an unwritten god is loud rather than silent.

`--dry-run` prints what it would write. It refuses to overwrite an existing file.

---

## 6. Per-god checklist

```
[ ] ① character brief agreed, including the low/medium/high register
[ ] ② counter metric chosen, distinct from XP
[ ] ③ two trust thresholds (a first guess, flagged as such)
[ ] ④ <god>_voice.js — tierOf null-safe, tags registered, rare_ siblings
[ ] ⑤ introduction written into docs/28, gen_scenes.py re-run
[ ] ⑥ actor chosen, id validated at boot by spawner.js
[ ] ⑦ <god>_events.js — three events to start
[ ] ⑧ Harvest handler registered, with a tag for cleanup
[ ] ⑨ rows in fall / regard / help / paths / coefficients / spawn_pressure
[ ] ⑩ deploy → restart → grep the boot log for [<god>] → logq errors
[ ] ⑪ docs/<n>-<GOD>.md written from the docs/40 template
```

---

## 7. Where the shared work still has holes

**These block every god equally, so they are worth doing once, properly.**

| gap | why it matters now |
|---|---|
| ⚠️ **Absence** — the third exit | Release went **admin-only** 2026-08-15 (Ethan's ruling). The exits are now the fall, Blade's challenge, and an admin. **Absence is the only clean way out and it does not exist.** |
| The other four Harvests | `harvest.js` reports `handlers: blade` and nothing else. Wall, Forge, Salvage and Art have no Harvest. |
| The other four voices | `voice.js` reports `2 god(s)` — Blade and the Speaker. |
| `EntityEvents.death` NPE | 49 hits, last 08-12, invisible for three days until `logq` was repaired. |
