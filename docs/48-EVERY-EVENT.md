# EVERY EVENT THAT CAN FIRE

**Generated from the boot log**, not from the source - so this is what the server
ACTUALLY registered on its last start, which is the only version that matters.
Anything registered but silently dropped would be missing here, and that is the point.

Regenerate after any change: restart, then re-run the generator.

> Read with `docs/23` §VI.0 (the taxonomy) and each god's own doc - `40` Blade,
> `43` Wall, `44` Salvage.

**36 events across 3 gods.** Boot of 2026-08-16 16:18.

---

## How one is chosen

Two stages, every time:

1. **A KIND is drawn** from that god's column in the chart. A god who is `0` in a
   kind can never roll it, no matter how many events sit there.
2. **An event is drawn from inside that kind**, by its own weight.

Before either, an event must pass **all** of: its tier is live · its own cooldown ·
the 4-day scene budget if it is a cutscene · the health floor if it is `hostile` ·
and its own `guard`. Failing any of those removes it from the draw entirely.

---

# BLADE - the Warrior

*dark red* - **15 events**

**Roll share by kind:** challenge 20% (8 ev) · assassination 10% (1 ev) · boon 20% (1 ev) · buff 20% (3 ev) · duel 15% (1 ev) · contract 15% (1 ev)

### Assassination

| event | when it can fire | what it does |
|---|---|---|
| `mark` | safe, cd 3d, w2, medium/high | marks the player for 2 world days - no penalty, it only changes what he says |

### Boon

| event | when it can fire | what it does |
|---|---|---|
| `sharpen` | SCENE, safe, cd 2d, w2, low/medium/high | offers a BARGAIN via the ritual: Strength for 3 min, but everything nearby is drawn to you |

### Buff

| event | when it can fire | what it does |
|---|---|---|
| `tithe` | hostile, cd 4d, w1, medium/high | takes extra durability from the held item each second, CAPPED so it never breaks it |
| `harden` **HELD** | safe, cd 2d, w4, low/medium/high | BUFF (forced) - resistance II AND weakness together, 3 min. He makes you hard to kill and slow to kill, so the fight lasts. ARMS the release window. HELD until the `harden` pool is written |
| `burden` **HELD** | safe, cd 3d, w3, medium/high | BUFF (forced) - slowness II for 90s, a handicap not a gift. Does NOT arm the release window: punishing a death under a penalty he imposed would be a trap. HELD until the `burden` pool is written |

### Challenge

| event | when it can fire | what it does |
|---|---|---|
| `gauntlet` | hostile, cd 2d, w3, low/medium/high | spawns a wave scaled by trust and announces it; the player must survive it. UNDERGROUND ONLY |
| `icarus` | hostile, cd 2d, w3, low/medium/high | spawns a wave ABOVE y100 only - punishes being high and comfortable |
| `hollow` | hostile, cd 3d, w2, medium/high | spawns a tagged wave whose drops are CANCELLED - the kills pay nothing. UNDERGROUND ONLY |
| `broken_rung` | hostile, cd 1d, w1, low/medium/high | fires on respawn - sends a wave at a player who has just died |
| `first_blood` | hostile, cd 2d, w2, low/medium/high | two staged demands, and BOTH stages cost the player something |
| `duel` | hostile, cd 4d, w2, high | high trust only - sends one strong actor; fleeing earns a taunt, not a penalty |
| `understudy` | hostile, cd 5d, w1, high | summons a buffed actor with attributes written at spawn time |
| `watcher` | hostile, cd 3d, w2, medium/high | places a bounded, non-attacking presence near the player - it only watches |

### Contract

| event | when it can fire | what it does |
|---|---|---|
| `contract` **HELD** | SCENE, safe, cd 4d, w3, medium/high | CONTRACT (choice) - a kill order he ASKS for, on the same machinery as the Mark, and it pays on success. HELD until `contract_offer` is written |

### Duel

| event | when it can fire | what it does |
|---|---|---|
| `wager` **HELD** | SCENE, hostile, cd 3d, w3, low/medium/high | DUEL (choice) - he OFFERS one strong opponent. Say yes and it arrives tagged; kill it and it pays iron/steel/diamond by tier. A choice always pays. HELD until the `wager_offer` pool is written |

---

# WALL - the Spider

*dark purple* - **10 events**

**Dynamic bands** (they move with her own counter, so no fixed share exists):
buff (4 ev) · attack (1 ev) · invade (4 ev) · contract (1 ev)

### Attack

| event | when it can fire | what it does |
|---|---|---|
| `offer` | SCENE, safe, cd 2d, wCURVE, low/medium/high | THE ASK - permission to attack another player, via the ritual. Refusable. Weight PEAKS in the middle of the rage range and vanishes at both ends |

### Buff

| event | when it can fire | what it does |
|---|---|---|
| `boon` | safe, cd 1d, wCURVE, low/medium/high | BOON - regeneration + absorption on her own champion. Weight falls as rage rises |
| `feast` | safe, cd 1d, wCURVE, low/medium/high | BOON - saturation + regeneration. She feeds you before anything else |
| `carry` | safe, cd 2d, wCURVE, low/medium/high | BOON - speed, jump and slow-fall for 90s. The web carries you |
| `brood` | safe, cd 3d, wCURVE, low/medium/high | BOON - gives you 2 goety spider servants. NOTE: they count as raised minions, so this gift RAISES her rage and slides her toward attacking |

### Contract

| event | when it can fire | what it does |
|---|---|---|
| `contract` | SCENE, safe, cd 4d, w3, low/medium/high | CONTRACT (choice) - she ASKS you to remove another champion, framed as helping you grow rather than as wanting them dead. Settling it takes RAGE OFF her (-4) instead of paying loot. Letting it lapse costs NOTHING - she absorbs a refusal, which is worse |

### Invade

| event | when it can fire | what it does |
|---|---|---|
| `snare` | safe, cd 1d, wCURVE, low/medium/high | ATTACK - slowness II + weakness on another player for 12s. NIGHT ONLY |
| `dark` | safe, cd 2d, wCURVE, low/medium/high | ATTACK - blindness on another player for 8s. NIGHT ONLY |
| `web` | safe, cd 2d, wCURVE, low/medium/high | ATTACK - 5 buffed spiders at another player, no choice. NIGHT ONLY |
| `swarm` | safe, cd 4d, wCURVE, low/medium/high | ATTACK - NINE buffed spiders at another player. NIGHT ONLY, and guarded to rage >= 70% of the way to fury |

---

# SALVAGE - the Wolf

*gold* - **11 events**

**Roll share by kind:** boon 29% (4 ev) · misc 7% (3 ev) · duel 14% (1 ev) · attack 21% (1 ev) · support 7% (1 ev) · contract 21% (1 ev)

> WARNING - **untagged, so they fall into `misc` at the lowest band:** collect, sample, tipoff

### Attack

| event | when it can fire | what it does |
|---|---|---|
| `sabotage` | SCENE, safe, cd 3d, wCURVE, low/medium/high | ATTACK (choice) - slowness + mining fatigue on the nearest other player, and it costs YOU 4 hunger. She will not do it unasked |

### Boon

| event | when it can fire | what it does |
|---|---|---|
| `deal` | SCENE, safe, cd 1d, wCURVE, low/medium/high | TRADE - opens her counter (salvage.js): hunger, levels or sight. Terms scale with harness |
| `credit` | SCENE, safe, cd 2d, wCURVE, low/medium/high | TRADE - strength now, a real debt written. One tab at a time |
| `markup` | SCENE, safe, cd 2d, wCURVE, low/medium/high | TRADE - resistance for 3 levels, openly a bad rate. Low harness only. She is not cheating; that IS the stranger price |
| `insurance` | SCENE, safe, cd 4d, wCURVE, low/medium/high | TRADE - 6 hunger now, and your NEXT death pays out resistance III + regeneration. She always keeps her word |

### Contract

| event | when it can fire | what it does |
|---|---|---|
| `commission` | SCENE, safe, cd 5d, wCURVE, low/medium/high | CONTRACT (choice) - a kill order on the nearest other player, held by the shared killorder.js. Settling it pays levels and raises harness |

### Duel

| event | when it can fire | what it does |
|---|---|---|
| `bounty` | SCENE, hostile, cd 3d, wCURVE, low/medium/high | DUEL (choice) - she OFFERS one strong opponent because she has a buyer. Kill it and she pays 5 levels. A job, never a test |

### Support

| event | when it can fire | what it does |
|---|---|---|
| `favour` | SCENE, safe, cd 4d, wCURVE, low/medium/high | ⭐ SUPPORT (choice) - regeneration + absorption on ANOTHER player, paid for with 3 of YOUR levels. The only event in the game that helps somebody who is not the caster |

### -

| event | when it can fire | what it does |
|---|---|---|
| `collect` | safe, cd 1d, wCURVE, low/medium/high | COLLECTS an outstanding debt - takes up to 4 levels. Only fires if you owe |
| `sample` | safe, cd 2d, wCURVE, low/medium/high | FREE - speed + night vision, no cost. The first one always is. Heaviest at low harness |
| `tipoff` | safe, cd 2d, wCURVE, low/medium/high | FREE - a guidance line at no cost. Good customers only, which makes it the most suspicious thing she does |

---

## Held, and why

These are **built and registered but refuse to fire** - their line pools are
empty and `voice.js`'s rule is that a caller must never substitute its own text.
An event that runs mute is worse than one that waits.

* `blade/harden`
* `blade/burden`
* `blade/wager`
* `blade/contract`

Sheets for the missing lines: **`docs/45` §12**.
