# LIVE TUNING — the pending restart, and what to watch

**This file is the handoff between a play session and the next restart.** It exists
because Ethan is testing live with his brother and a restart costs them the session,
so changes queue here instead of going in one at a time.

---

## 🔴 PENDING RESTART — deployed, not loaded

Everything below is written, syntax-checked and copied into `instance/`. **None of it
is running.** One restart takes all of it.

```bash
python tools/serverctl.py restart
```

| change | what it does |
|---|---|
| **spawn density** | `spawns` becomes a rate multiplier on the world's own spawns rather than a roster trickle. blade **1.6** · salvage **1.4** · art 1.0 · wall **0.7** · forge **0.6** |
| **suppression goes live** | wall and forge below 1.0 for the first time — the `checkSpawn` half has worked since it was written and nothing ever asked it for anything |
| **Wall route 2** | 7 pathless days **+ killed by another god's champion** |
| **cutscene budget** | scene events now cost 4 world days, quiet events still 1 |
| **the 60s Arrival** | already loaded ✅ |
| **pathless ambience** | already loaded ✅ |

⚠️ **IPN needs a Prism relaunch, not a server restart.** It is client-side; the pack
index is already published.

---

## ⭐ MONITORING — tuning that needs play, not argument

### 1. Cutscene frequency ✅ *changed 2026-08-16, needs verification*

**Measured live:** in a 13-minute session, Lehykt took his path at `00:19:15` and
`blade/sharpen` opened a **second held cutscene at `00:25:07`** — six minutes later.

The flaw was one budget for two very different costs. A boon is a line and a shrug; a
ritual takes your screen, your movement and thirty seconds.

| | before | after |
|---|---|---|
| any event | 1 world day (~20 min) | unchanged |
| **a cutscene** | 1 world day | **4 world days (~80 min)** |

**Six events are marked `scene: true`:** `blade/sharpen` · `wall/offer` ·
`salvage/deal` · `salvage/credit` · `salvage/markup` · `salvage/insurance`.

**Watch for:** a session where a cutscene never comes at all. 80 minutes is a long
time on a server people play in two-hour stretches, and the failure mode of this fix
is that the best content becomes unreachable rather than annoying.

### 2. Normal dialogue — ⏸️ *deliberately unchanged*

Ethan: *"normal dialogue should still be uncommon so you aren't spammed"* — read as
**keep it as it is**, not make it rarer.

Currently: 6% per 60s roll, hard-capped at **once per world day per god**. Measured at
roughly one line per 13 minutes with a freshly-claimed path.

**Watch for:** whether it reads as sparse or as chatty over a long session. It has one
knob (`idle.js` `CHANCE`) and one cap, and it has never been tuned against real play.

### 3. Spawn density — 🆕 *never run*

blade **1.6** means 60% of eligible monster spawns near him come twice. wall **0.7**
means 30% of them are cancelled.

**Watch for:** whether 1.6 reads as "this place is worse" or as a siege, and whether
0.7 reads as calm or as an empty world. Guards in place: monsters only, one duplicate
per player per 40 ticks, never mid-scene.

### 4. The things that have still never fired

`playtest.py` after the last session: **1 of 27 events fired.** That is correct for
thirteen minutes, and it is also the number that matters — anything still at zero
after a real session is either untested or broken, **and only the person playing can
tell which.**

```bash
python tools/playtest.py
```

---

## The rule this file exists for

**Tune from measurement, not from impression.** Every number above has either a
measured rate beside it or an explicit note that it has never been observed. A knob
changed on a feeling is a knob nobody can change back with confidence.
