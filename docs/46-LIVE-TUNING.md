# LIVE TUNING — the pending restart, and what to watch

**This file is the handoff between a play session and the next restart.** It exists
because Ethan is testing live with his brother and a restart costs them the session,
so changes queue here instead of going in one at a time.

---

## 🔴 PENDING RESTART #2 — deployed 2026-08-16, awaiting Ethan's ~1hr restart

| change | what it does |
|---|---|
| **Wall's minion double-credit** | the spawn hook tagged the entity but never *read* the tag, so a persistent familiar could re-credit `+1` on every chunk load. One-line guard. **Found by reading, not playing — nobody has ever walked Wall, so `creditNearest()` has returned null on every summon this world has seen and the whole rage mechanic is UNPLAYED.** |

**Still open, decided but not built:** the attention model —
**`docs/41-BUILDING-A-GOD.md` §8**. Do not tune `CHANCE` before reading §8.1; the
obvious 25% cut buys about 8%, because the world-day cooldown sets the rate and it
has exactly two usable settings.

---

## ✅ RESTART #1 — loaded 2026-08-16 01:28, boot clean, 0 errors

**All of this is LIVE.** Boot verified: `logq errors` → 0, and every subsystem
printed its banner. It is kept here as the record of what changed, and as the list
of what has still never been *observed in play* — loaded is not played.

| change | what it does |
|---|---|
| **spawn density** | `spawns` becomes a rate multiplier on the world's own spawns rather than a roster trickle. blade **1.6** · salvage **1.4** · art 1.0 · wall **0.7** · forge **0.6** |
| **suppression goes live** | wall and forge below 1.0 for the first time — the `checkSpawn` half has worked since it was written and nothing ever asked it for anything |
| **Wall's unlock** | ⚠️ **superseded the same night.** Shipped as *7 pathless days + killed by a champion*, then rewritten to **killed while pathless → she offers on respawn**, no item and no timer. Both day routes were unreachable — see the commit and `chosen.js`'s header |
| **closed gods stop spending the one offer** | art's trigger is lapis and art is CLOSED, so the first god to notice anyone was one that then refuses them. Both players carried `offered_art=1` |
| **cutscene budget** | scene events now cost 4 world days, quiet events still 1 |
| **Wall's loot table** | rebuilt to her own guidance ladder — 3 Occultism + 3 Goety per tier, 6 per tier. Sealed floor now pays `raw_iesnium` / `dark_ingot` / `afrit_essence` / `soul_emerald` |
| **🆕 the release system** | `release.js` — each god releases you for its OWN reason. Wall never · Blade 4 buff-deaths in a row · Salvage 3 refusals in a row. Regard stops being the door for all three |
| **Blade tier 2** | bronze → `magistuarmory:steel_ingot` (bronze was in tiers 1 *and* 2) |
| **Salvage tier 2** | one duplicate `gun_powder_ore` → `minecraft:diamond` (2/3 of her sealed floor was one item) |
| **`/help` pathless hints** | 4 of 7 lines were stale ("Six paths", "/path fixes that", the books, the stalker) |
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

### 4. Wall's payout rate — 🆕 *measured, never played*

`dropChanceFor()` is `(CHANCE_BASE + CHANCE_PER × notoriety) × dropCoeff`, **clamped
to 1.0**. Wall's `drops` coefficient is **2.5**, so:

| notoriety | raw | × 2.5 | actual |
|---|---|---|---|
| 0 | 0.250 | 0.625 | **62.5%** of kills |
| 60 | 0.400 | 1.000 | **100%** — saturated |
| 100 | 0.500 | 1.250 | 100% (clamp eats the rest) |

**She pays out on every single kill from notoriety 60 onward.** That is why her table
is six wide rather than three — the same firehose across more items. It is also why
her sealed tier can hold `raw_iesnium` without being a mistake, and why it is the
first thing to watch:

**Watch for:** a champion who reaches the Other Place without ever going there. At
notoriety 60+ a sealed-floor kill is `1/6 × 2–4` = ~0.5 raw iesnium, so **≈10 deep
kills per 5 ingots.** If that reads as trivialising Occultism's mid-game, the fix is
to cut `raw_iesnium` and `afrit_essence` from tier 2 — *not* to lower her coefficient,
which is her whole character.

### 5. The things that have still never fired

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
