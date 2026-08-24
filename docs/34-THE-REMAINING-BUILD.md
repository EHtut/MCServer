# The remaining build — everything left, in one place

*Written 2026-08-14 because Ethan went looking for the master plan and found a build
sheet claiming nothing had been done. `23` is the master design and `24` is the
original chunk plan; **this is the live queue.** When something here is built, mark
it here.*

---

## Where we actually are

**The frame is built. The content is not.**

Everything shipped so far governs *how you get a path, what a death costs, how you
lose one, and the voice that talks to you.* None of it makes Blade play differently
from Forge. A walker today gets a different drop table and a different set of
whispers, and that is the whole difference.

That was the original ask — *"we need things to happen to us"*, *"seperate each into
classes. And hard"* — so **the system is about half built and the missing half is the
point of it.**

### Built and verified live

E0 probes · E1 the iron fix · E2a–E2f · **I0** probes · **I1** the ritual
(`ritual.js`) · **I2** the introductions (`introductions.js`) · **E3** the coefficient
substrate (`coefficients.js`) · **E6** Salvage's economy (`salvage.js`, `counters.js`,
`gun_ammo.js`)

✅ **E2e finally ran 2026-08-15** — `E2e Rehykt entered forge - stripped 2 levels`.
It had never once executed since being built on 2026-08-12.

✅ **The Harvest was reached and fought** for the first time ever, on the same day.
It had been mathematically unreachable for weeks.

---

## 📍 STATE AT 2026-08-24 (end of session)

**Server is UP, 0 errors.** 🔴 **Nine files are DEPLOYED BUT NOT LOADED** — Ethan is
calling the restart himself, and Liam has been mid-session all evening. Everything
below is committed and harness-green; **none of it is verified live.**

### Landed this session

| | |
|---|---|
| ✅ **THERE IS NO END** | `docs/65`. All six gods `mode: 'never'`. `release.js` retired, `fall.js` dead *via the registry, unedited*, regard now saturates instead of executing |
| ✅ **11 empty voice pools filled** | blade ×7 — and because each event opens `if (!hasVoice(...)) return mute(...)`, **four of Blade's nineteen events had never once fired**. salvage ×4 gated no event but made seven call sites silent. All `[CLAUDE-DRAFT]` → `docs/51` |
| ✅ **the gods make a noise** | `patron_sound.js`. `23` PART V.7 §5, carried unbuilt for weeks. Two tiers off `voice.say`/`sayAbout`: PRESENCE (rate-limited) and MOMENT (never limited) |
| ✅ **Wall's aura** | `wall_aura.js`. She wounds and webs to 25% of max and **never kills**, so the kill — and the drop, and the counter credit — stays the player's |
| ✅ **the band stretch** | `63` §7b. Trials were arriving at raw **50** (blade) and **34** (art) against a bar everything called 100. Now 86 / 75 / 100 |
| ✅ **salvage's three untagged events** | `collect`→`attack`, `sample`→`boon`, `tipoff`→`boon`. The boot has warned about these at every start |
| ✅ **seven stale doc claims** | four in this file, three in `63` — all things these docs called pending that the live server had been doing for days |

**427 assertions across 13 harnesses, green.** Two new: `wall_aura_harness` (31),
`phase_harness` (32).

### 🔴 The negative control caught my own test, twice

Deleting `wall_aura.js`'s floor clamp left its harness at **28/28 green** — every mob
in the fixtures divided evenly, so the clamp was never reached. **A clamp is only
tested by an overshoot.** Same check on `phase.js` then caught two more gaps. Both
harnesses now fail exactly the right assertions when the code under them is broken,
which is the only evidence a test is worth anything.

⚠️ **`e.maxHealth` was in the aura's first draft and is not the accessor** —
`stalker.js` already had `getAttribute('minecraft:generic.max_health').getValue()`.
Reading it as `undefined` gives a floor of `NaN`, every comparison against `NaN` is
false, and the aura would have bitten straight through to zero while looking correct.

### ⚠️ `/playsound` CANNOT BE PROBED — measured, three ways

A fake sound id and a real one are **byte-identical** over rcon: the id is a
ResourceLocation resolved client-side, and the server accepts anything. Silence is the
failure mode, and silence is also the state we were already in. Guards: **vanilla ids
only**, and **`/patronsound`** plays every one of them at you so it can be verified by
ear. That is the same answer `_probe_patron.js` gave to the same problem.

---

### 🔴 WHAT NEEDS ETHAN

1. **The restart.** Nine files are waiting. `/patronsound` should be the first thing
   run after it — a silent god means a wrong id.
2. **~370 `[CLAUDE-DRAFT]` lines** (`docs/51`, 128 pools / 446 lines across 6 gods).
   The 11 new pools are placeholder and marked as such.
3. **Salvage's register** (`7b`) — her trade voice and her collection voice are
   audibly different people.
4. **Blade's seven Challenges want rebalancing downward** — his own file flags it as
   "a separate pass and Ethan's call".

### Carried, unfixed

- **Wall's playstyle redo** — mod stays Goety (`43` §0b); `35` is invalidated
  (MineColonies is not installed). The redo itself is unscoped
- **the world refresh.** Diagnosed (`64`): Tectonic owns terrain; the fixed config
  generates solid ground to −127 with real caves. **Staged, applies only to a
  regenerated world.** ⚠️ Measured side effect: the band −40 to −63 becomes nearly solid
- **the Lootr config has never been observed working in play** — available in the
  current world, no reset needed
- **the respawn mechanic** — still undiagnosed, still open
- **naming rot accepted** — a `harvest` band and `harvest_*` pools in a game with no
  Harvest. Cosmetic; deliberately not ridden along with a behavioural change
- 90+ commits ahead of `origin/main`, unpushed

### Needs the world reset — and only these

**Tectonic depth** · **crown merging into Wall** (§0c) · **The Arrival** (once per
player on first join; everyone here has spent theirs) · **`/path forcereset`**

---

## THE QUEUE

### 0a. THE STAGED MODPACK AUDIT ✅ **CLOSED 2026-08-15**

Eight stages, A1–A8. **290 → 271 mods, ~1,300 → 1,028 MB.** Rulings and reasoning in
`36-THE-MOD-TAXONOMY.md`; the full list is `39-THE-ROSTERS.md`.

*The one lesson: **the name is not the mod, and the dependency list is not the
usage.** `spawn-mod` sat in the enemies bucket for eight stages and registers 89
animals. JEI looked free to cut because nothing declares it — 25 mods use it.*

### 0b. WALL REFRESH ⭐ — Ethan's call, 2026-08-14

> *"im going to target wall first because I do not think anyone will ever choose that
> path because security craft is not a good base. It feels uninteresting compared to
> the others... It would need to fill an adventurer role like art."*

Full brainstorm in **`35-WALL-REFRESH.md`**. Wall is the only path whose verb is
*wait*, on a server whose founding complaint was that nobody explores. Design first,
then it slots in below as the first path built on E3.

### 0c. CROWN MERGES INTO WALL — ruled 2026-08-14

Six paths become five. Design in `35` §6; do it **at the world reset** so no live
claim needs migrating. Crown's written material is marked RETIRED, not deleted.

### 1. E3 — the coefficient substrate ✅ **BUILT 2026-08-15 — E6–E10 UNBLOCKED**

`coefficients.js` publishes `VELDORA.coeff`. `drops`, `power` and `phase` are wired
into their live consumers; `/path coefficients` prints your effective numbers.
**Five paths** — Crown merged into Wall, Wall stays mercantile. Subclasses stack half
the *deviation*, not half the value (`23` §7b). Costs soften with players online.
Boot-verified: 19/19 scripts, seam published, 0 errors.
**Rollback:** every value to 1.0 restores prior behaviour exactly — no gate, no state.

✅ **MEASURED 2026-08-15**, not merely booted:

* **`power` ×0.4 is exact** — base curve 6.0/4.0/2.0/0.2 produced +2.4/+1.6/+0.8/+0.08
  on Forge, to the decimal.
* **`drops` ×3 confirmed** — raw 50% at notoriety 100, observed 100%.
  🚨 **But it SATURATES.** The chance clamps at 1.0, so **Forge pins at 100% from
  notoriety 33 upward** and Wall from 60 — two thirds of the curve does nothing. Fix
  is `CHANCE_BASE 0.25 → 0.12`, `CHANCE_PER 0.0025 → 0.0022`. **Ethan's number to
  move; he raised it from 0.08.**
* ⏳ **`phase` is still unverified** — Forge is ×1, so there was nothing to observe.
  Needs someone on **Blade** (×2), or a forced coefficient and a band-transition read.

✅ **THE SPAWNS AXIS IS WIRED 2026-08-15** — `spawn_pressure.js`. **E3 is complete;
all four axes are live.** Two regimes (`23` §7b): below 1 suppresses natural spawns
through `checkSpawn`, above 1 sends waves through `spawner.js`. Modular per Ethan —
per-path rosters and `VELDORA.pressure.send()` for Blade's twelve to call with their
own. `/pressure` prints which regime you are in.

⚠️ **`checkSpawn`'s event shape has never been used here** — E0 P9 only proved it fires
and can be cancelled. The handler reads the position defensively and **logs the shape
once**; watch for `[pressure] checkSpawn shape:` on the first natural spawn near a
walker. If it says `UNREADABLE`, the suppression half is inert and says so.

*The original argument, kept because it is why the axis waited:*

1. **`spawns` was INERT.** `checkSpawn` can only *cancel*, so it cannot produce Blade's
   ×4 — that needs an **active spawner** (`the_hunt.js`'s ring-placement mechanism),
   which is a build of its own and was deliberately NOT folded into E3. `23` §7a has
   the argument. The value is in the table, served by `VELDORA.coeff`, printed as
   INERT, and announced at boot — because a coefficient nobody reads must never look
   like one that acts.

### 2. E6 — Salvage's economy ✅ **BUILT AND FULLY VERIFIED 2026-08-15**

`salvage.js` + `counters.js` + generated `gun_ammo.js`, plus `spec.keep` in the
ritual and `VELDORA.powerBoost` in `power.js`. Boot-verified 23/23, seams up.

**The per-patron counter landed with it** — Ethan's call. Salvage's debt is
`VELDORA.counter`'s first consumer, not a Salvage special case, so Forge's quota
uses the same mechanism. `/counters` prints what each patron says you owe.

✅ **All three trades played and confirmed in the log.** Hunger and levels charged
correctly, the ammo chambered, the debt climbed 2→3→4, and the sight trade leaves you
blind after the scene closes — which only works because a probe caught `release()`
clearing it. Zero forbidden log lines.

**The sight trade pays in Strength II + Speed, not a hidden number.** Ethan, having
taken it: *"instead of a flat buff we should use strength and speed effects instead so
the player can see what they traded."* The first build multiplied the invisible E3
`power` axis — the legibility law failing at the exact moment it matters.

*Original scope, for reference:*

* the three trades: **hunger → life**, **levels → ammo**, **sight → the power to
  kill** (blindness up to 5 min)
* the **debt counter**, raised by every trade
* she opens **at the worst times** — mid-combat confirmed; the ritual's detarget is
  what makes that survivable rather than a death sentence
* debt persists across restart as a **world day**, never `tickCount`

### 2b. E6b — SHE OPENS HERSELF ✅ **BUILT AND VERIFIED LIVE 2026-08-15**

*Ethan: **"going forwards i want the player to actually use commands as little as
possible."*** `23` PART V.6. **`/trade_test` was a harness; this is the feature.**

> ✅ **MEASURED LIVE:**
> `[salvage] she opened on Rehykt - low health mid-combat (debt=9, cooldown was 3300t)`
>
> No command typed. He took damage and she arrived. **The first time in this
> project's history that a patron has asked for something unprompted** — whispers
> already fired on their own, but this is the first *decision* the game has ever put
> in front of a player without being asked.
>
> Note the cooldown in that line: **3300t against a 6000t base.** Nine trades of debt
> had already pulled her 2700 ticks closer. The ratchet is not described, it is
> running.

Built into `salvage.js`. **Four triggers**, all funnelling through one `maybeOpen()`
so there is exactly one definition of *not right now*:

| trigger | condition | chance |
|---|---|---|
| **low health mid-combat** | ≤35% health **and** hurt within 200t | 40% |
| **after a death** | 5s after respawn | 30% |
| **the dry spell** | her counter has not moved in ≥2 days | 15% |

* ⭐ **She gets pushier as the debt grows** — cooldown starts at 6000t and shrinks
  300t per point of debt, floored at 2400t. **That is the ratchet**: the more you owe,
  the more often she is standing there offering you a way to owe more.
* **Built on PROVEN hooks only.** `beforeHurt` (`afterHurt` is in the registry but has
  never fired here, and J6's lesson is that an unfired hook cannot be told from a
  nonexistent one) · `respawned` · `scheduleInTicks`. Combat is *recorded* on
  `beforeHurt` and *judged* on a 2s sampler, because reading health inside the damage
  event reads it **before the hit lands** — the wrong number for "are you nearly dead".
* **No clock, no offer.** If `dayTime()` is unreadable the rate limit cannot work, so
  she is suppressed rather than allowed to fire every sample. K9's lesson in a hat.
* **Never talks over another patron** — `ritual.active(p)` guard.
* **Rollback:** `AUTO = false`, and only `/trade_test` remains.

🔍 **`/trade_why`** (admin) prints **every gate and which one is holding.** Auto-open
is the hardest kind of behaviour to test — when it does not fire there is nothing to
see — so "she is quiet" and "she is broken" must be distinguishable. It is a read,
never a bypass.

🔧 **`/trade_testas`** (admin) borrows the gate for one session so E6b can be tested
without taking anyone's path. **In memory on purpose** — it dies on restart, so it
cannot be left on and later mistaken for real behaviour.

### ⚠️ Why the claim was NOT moved — live state read 2026-08-15

| player | tag | claim |
|---|---|---|
| **Rehykt** | *(empty)* | forge *(empty)* — **pathless** |
| j0nesyboi223 | `salvage` | `salvage` — consistent |
| Lehykt | `blade` | `blade` — consistent |

`/path forcerelease salvage` clears the **claim only**. Ben's *tag* would survive,
leaving him carrying `salvage` against a claim belonging to someone else — the P1
desync — and **`paths.js` has NO `loggedIn` reconciliation**, so nothing would ever
heal it. He is offline and cannot consent to losing his path.

**Recorded as a real gap:** there is no safe admin way to transfer a claim. A proper
`/path transfer` would have to clear the old holder's tag and claim atomically, which
needs them online or an offline-NBT write. Worth building before the world reset,
which is the moment claims actually move.

### 2c. ⭐ THE TRADE IS THE UNIVERSAL INTERFACE — re-scopes PART VI

*Ethan: **"this trade system is perfect for literally all of the patrons. We can
integrate these into events."*** `23` PART V.5.

**72 bespoke events was the wrong reading.** Most are `ritual + options + counter`
with different words and numbers — Blade's *Sharpen* is a trade with its price
stated, Wall's *"take out one wall"* is an offer, Forge's quota is an offer with a
clock. Build the **offer** once and most of PART VI becomes authoring.

**What stays bespoke:** the genuinely mechanical ones — Blade's waves, *Understudy*,
Salvage's *Interest* raid, Art's pages. **Those need the spawner, not the ritual.**

### 2d. ⭐ THE ACTIVE SPAWNER ✅ **BUILT 2026-08-15**

`spawner.js` — `VELDORA.spawner.wave(player, {ids, count, minDist, maxDist})`.
**The piece four systems were waiting on:** E3's INERT `spawns` axis, eight of Blade's
twelve, four of the five reckonings, and the chat-only decision.

**Every hard-won lesson is baked in:**

* **`/summon`, never `createEntity().spawn()`** — the latter bypasses `finalizeSpawn`,
  where Born in Chaos sets hostility.
* **The roster is VALIDATED AT BOOT** via E0 P13, not trusted. `the_hunt.js` validates
  by hand, which is exactly how three of its four hunters were ids from mods that were
  never installed — **75% of hunts sent nothing while logging success.**
  Boot now prints `roster validated: N live, N dead`.
* **It COUNTS WHAT ARRIVED.** `runCommandSilent` returns `undefined` for valid and
  invalid alike (E0 P12), so every wave scans the ring before and after and reports
  the delta. *"I asked for six"* and *"six are standing there"* are different claims.
  **`placed: null` means could-not-measure and is never confused with `0`.**
* **A wave of zero sends nothing** and says so — never a default wave.

⏳ **No live consumer yet**, by design — it is a primitive like `ritual.js` was before
I2. `/wave_test <n>` is its harness. **First consumer: E3's `spawns` axis**, then E7.

### 2e. ⭐ RETIRE THE STALKER, KEEP THE HARVEST ✅ **DONE 2026-08-15**

*Ethan: **"I am thinking we just get rid of the stalker mechanic tbh and just have the
harvest."***

**Done.** `phase.js` carries the escalation, `harvest.js` carries the collection, and
`stalker.js` returns at its first line behind `RETIRED = true`.

> **The file is KEPT, not deleted.** Its comments are the record of eight measured
> findings — the pumpkin's boss bar, the `isMonster()` saga, the `finalizeSpawn`
> warning, the sticky-edge cap. **Deleting it would delete the reasons.** It returns
> *before* publishing anything, so it cannot fight `phase.js` over the seam.

**Verified:** 34/34 scripts, `[stalker] RETIRED`, `[phase] escalation LIVE without a
body`, `[harvest] handlers: blade`. Zero errors.

**The dependency check makes this cheap.** Only two things outside it consume its
seams, and both are about the Harvest, which survives:

| consumer | uses |
|---|---|
| `death_cost.js` | `stalkerPhase(...) === 'harvest'` to skip the death cost |
| `fall.js` | `recordHarvest()` — **which lives in `notoriety.js`, not here** |

**`whispers.js` does not touch it at all** — the whispers escalate off `regard`. The
voice half loses nothing.

#### KEEP
* `resolvePhase` + `BANDS` + the hysteresis — drives **E3's `phase` coefficient** and
  the Harvest trigger. ⚠️ **Do not clamp the sticky edge past `CAP_VALUE`** — that is
  the bug that made the Harvest unreachable for weeks.
* `phaseStored` / `phaseStore`, and the `VELDORA.stalkerPhase` seam.
* **The Harvest**, rebuilt as a **`spawner.js` call** rather than a state change on a
  bound entity — it now *arrives* instead of having been standing there all along.

#### DELETE
the bound entity · `CAST` and the recasting migration · `keepDistance` /
`DIST_NEAR` / `DIST_FAR` · **the Helper** · owner tagging, adoption and the bench ·
the piglin/minion anger rule · the damage veto and its `beforeHurt` hard stops ·
the detarget sweeps (`ritual.js` has its own) · C8 stalker-vs-stalker

#### Why this is a gain and not a loss

**Every bug this project produced in the entity half came from this one system** — the
Helper culled by its own sweep having never once helped, `keepDistance` flinging the
bench patron 100 blocks, minions permanently aggroed, the hostility veto cancelling
damage on every swing. **None of that is content; all of it is leash.**

And **the stalker was the first attempt at "things happen to you."** Everything built
2026-08-15 does it better without a rope: the trades open themselves, the reckonings
collect, the pressure system hunts, the spawner sends waves.

**The whispers already carry the dread better than the mob does** — *"He is not
looking at you any more. He is looking at where you will be"* beats a knight standing
40 blocks away doing nothing, which is what he actually does most of the time.

⚠️ **One casualty:** Blade's **The Watcher** (*"he stands at range and does not
attack"*) genuinely needs presence. 1 of 12 — make it Harvest-adjacent instead.

### 3. E7 / THE RECKONING ENGINE ✅ **BUILT 2026-08-15**

`reckoning.js` (the engine) + `counter_hooks.js` (the four missing counters).
**E7 is not Salvage's raid — it is the general engine, with Interest as its first
consumer**, exactly as the counter was.

**Pressure is the RATE, not the value:**
```
delivered = counter − counterAtLastReckoning
expected  = demandRate × daysSince
shortfall = expected − delivered
```
**NEGLECT** (blade/forge/wall/art) uses the shortfall; **APPETITE** (salvage) uses
`delivered` itself, because pleasing her *is* accruing debt. Escalator **+50% per
reckoning** — Forge's *Compound Interest*, generalised.

**Shipped with only Salvage collecting.** The other four **count but do not
collect** — the honest first state from `23` PART V.9 §9: the ledger stays truthful
while the demand rates get real play data. Boot prints
`collecting: salvage | counting but NOT collecting: blade, forge, wall, art`.

**The counters now all exist** (`counter_hooks.js`): blade `death`+`isMonster()` ·
forge `crafted`+`smelted` · wall `placed` · art **new biomes, sampled**, each biome
counting once. Salvage's trades stay in `salvage.js`.

**Guards, each one a failure this project already had:** zero pressure sends nothing ·
a **2-day grace** so a fresh walker is not reckoned on their first hour · one at a
time across all patrons · announced · no clock, no reckoning · **a reckoning that
fails to fire does NOT settle**, so pressure is never forgiven for free.

**`/reckoning`** prints delivered, expected, pressure and how close you are.
**`/reckon_test`** forces one.

### 3. E7 — Interest: the first raid

The debt comes due; raid size scales with trades since the last one.
**Verify a raid at zero debt spawns nothing**, rather than a default wave.

### 4-6. E8 / E9 / E10 — the per-patron content ✅ **BUILT — measured 2026-08-24**

🔴 **This block described three pending projects. All five gods have events.** The
live server reports:

```
[events] framework LIVE - 45 event(s) across 5 god(s), 8% per 600t, one at a time.
         19 of them are CUTSCENES (4 world days apart, vs 1 for any event).
```

| god | events |
|---|---|
| blade | 19 |
| salvage | 19 |
| wall | 13 |
| art | 13 |
| forge | 8 |
| crown | 0 — merging into Wall (§0c), world-reset gated |

⚠️ **Four of Blade's nineteen cannot fire.** `harden`, `burden`, `wager` and
`contract` each open with `if (!hasVoice(...)) return mute(...)`, and their pools are
empty arrays marked `TODO(ethan)`. **The mechanics are finished; the lines are the
only missing thing.** Writing sheets are in `45-BLADE-LINES.md` (Buffs / Duels /
Contracts). Salvage has four more empty pools — those do not block an event, they make
seven call sites go silent, because `voice.say()` returns false on an empty pool.

⭐ **Art's Trial handler exists** — `trialArrive` / `trialWin` / `trialLose`,
`art_events.js:378`. `63` §6 still says she "has never had a handler"; that is stale.
All three combatant handlers (art, blade, salvage) are registered, and Wall's
registration is correctly REFUSED because she is a non-combatant.

---

# ⏭️ AFTER THIS: THE EVENTS BECOME THEIR OWN PROJECT

*Ethan, 2026-08-15: **"events will need to be a separate project after this."***

**The line is drawn here.** Everything above finishes the *frame*: the paths, the
prices, the coefficients, the trades, the counters, the raid. Everything below is
**content**, and it is a different kind of work — authoring against a finished
instrument rather than building the instrument.

### What the events project inherits, already built

| | |
|---|---|
| **the offer** | ritual + named options + a per-patron counter — proven live by E6 |
| **the instrument panel** | `23` PART V.7 — every hook, every readable state, every effect, tiered PROVEN vs AVAILABLE |
| **the sensor** | `telemetry.js` — biome dwell, builds per chunk, depth, kills, deaths, co-location, on a 10s sampler since 2026-08-02 |
| **the spawner** | ⏳ *not yet* — the one piece the events project genuinely needs and does not have |
| **the numbers** | E3's coefficients, live and measured |

### The three things to settle BEFORE it starts

1. 🚨 **The spawner.** Eight of Blade's twelve, E7's raid and the `spawns` axis all
   want it. `/summon` ring-placement is proven in `the_hunt.js`; this is the one real
   dependency.
2. **The sleep hook** (`23` PART V.7 §4). Art's defining behaviour — *"She wants you
   to sleep"* — has **no event in any KubeJS group.** Probe before designing her
   twelve.
3. **Chat-only patrons or not** (`11-OPEN-DECISIONS.md`). It changes what an event
   *is*. Decide with the spawner built, so both options can be felt rather than argued.

### 7. PART VI — the events: ⚠️ ONE PROJECT PER PATRON

*Ethan, 2026-08-15: **"events are something that need to be planned out individually
per event rather than assuming. Each patron's events are a whole project on their
own."***

**This corrects §2c.** The 2×2 taxonomy is real and it is not a shortcut: knowing an
event is a BARGAIN or a RECKONING tells you its *shape*, not what it does. Twelve
events is twelve designs, and a patron's twelve have to cohere as one character
before any of them is built.

**So each patron is its own project**, planned first, in this order of readiness:

| patron | why it is ready or not |
|---|---|
| **Blade** | ⭐ **STARTED — `40-BLADE-THE-WARRIOR.md`.** Lehykt walks it, eight of twelve are spawner calls, the spawner is built |
| **Salvage** | half-done already — the trades ARE four of her twelve, and Interest is live |
| **Forge** | counter live (`crafted`+`smelted`); needs the container/quota mechanics |
| **Wall** | needs the Core first — every one of her twelve hangs off it |
| **Art** | needs the pages, and her voice is the hardest |

*The original framing:*

### 7. PART VI — the events themselves: 72 designed, 0 built

`23` PART VI holds **twelve events per patron**. Re-scoped by §2c: **most are offers**,
so the work is largely authoring once the offer primitive is generalised. What stays
bespoke is the mechanical minority — Blade's waves, *Understudy*, the *Interest* raid,
Art's pages.

### 7b. ⭐ THE PATRON POLISH PASS — voice and atmosphere

*Ethan, 2026-08-15: **"same with voices after all this we'll do a patron polish pass
where we make them more atmospheric."*** **Scheduled after the events, not before** —
polish wants finished material to polish.

**What it covers:**

* **Voice consistency per patron.** Six registers written across many sessions and
  several docs. The Mother speaks in *we* and *us*; Art repeats herself and *the
  doubling is the voice, not a typo*; Forge never thanks you. Those rules exist and
  have never been audited against the shipped lines together.
* 🚨 **SALVAGE'S DIALOGUE NO LONGER FITS** — Ethan, 2026-08-15, watching Interest
  fire. Her lines were written when she was *only* a trader: *"Lets do a deal."* ·
  *"Friend. You look like you need something."* Since then she has become the one
  patron whose **service and danger are the same act** — pleasing her accrues debt,
  and her reckoning arrives **because you kept coming back**, not because you went
  quiet (`23` PART V.9 §2). The trade voice is warm and the collection voice is
  *"I have brought the family"*, and nothing connects them. **She needs the register
  that makes the bargain and the raid obviously the same person** — the coaxing has
  to already contain the appetite.
* ⭐ **Sound.** `23` PART V.7 §5: **a patron has never made a noise.** `playsound` is
  available and has never once been run. Almost certainly the cheapest atmosphere win
  in the whole project.
* **The emphasis ladder** (`35` §A) — titles for the moment the world changes.
  ⚠️ probe first: *does a title render over blindness?*
* **The six "of Veldora" lines** (`30` §5.1) — one line per patron that could only be
  said here. Highest value per word in the design.
* **Silence and pacing.** The refusal pool is already twelve universal lines about
  *your own actions* rather than the patron — that instinct should be checked against
  every other surface.
* **The tone ruling stands:** the whispers and taunts are **Ethan's own lines** and
  his book references, absurdist on purpose — *"more loveable than just outright
  dangerous."* **Do not rewrite them toward pure horror.**

### 8. Subclasses — a datapack, not a build

`30` §6: the pack already ships `puffish_skills` (the engine) + Skill Tree RPG (254
datapack JSONs). `category.json` exposes `unlocked_by_default` (the path unlocks its
tree) and `exclusive_root` (the subclass choice). **Authoring job.**

### 9. Being chosen — `33` ✅ **BUILT AND LIVE — measured 2026-08-24**

🔴 **This said "do it at the world reset". It was already running.** `chosen.js` and
`arrival.js` both banner at boot:

```
[chosen] YOU ARE CHOSEN - blade:iron_sword, salvage:crossbow, forge:create:wrench,
         art:lapis_lazuli. WALL has no item and no timer: somebody kills you while you
         walk no path, and she makes her offer ON YOUR RESPAWN (100t later).
[arrival] THE ARRIVAL armed - 13 lines, five voices, once per player on first join.
```

Carrying the item unlocks the path forever; the offer fires ONCE, out of combat only.

⚠️ **The one part the reset still owns:** The Arrival is *once per player on first
join*, and everyone who plays here has already spent theirs. It has never been seen by
a player and will not be until a fresh world (or a deliberate flag reset).

### 10. Smaller, captured

* **The emphasis ladder** (`35` §A) — titles for the moment the world changes.
  ⚠️ probe first: does a title render over blindness?
* ⭐ **THE ARRIVAL** (`37`) — **Ethan has written the scene**, canon. The patrons
  argue over you on first join while you cannot see. Supersedes the first-join
  introduction idea in `35` §B and is better than it: you learn the world from how
  they disagree, not from exposition. The ritual primitive already does the hard
  part.
* ⭐ **Ambient patron arguments** (`28` §4) — openers + rebuttals, combinatorial,
  while you stay pathless. **This is the player-facing surface of "being chosen"** —
  the arguments are the patrons deciding out loud, so when one arrives you already
  heard them win.
* **The six "of Veldora" lines** (`30` §5.1) — one line per patron that could only be
  said here. Cheapest, highest value per word.
* **Salvage's gun is Vault tech** (`30` §5.2) — one line welds two pillars.
* **R8 into `07-THEME-AUDIT.md`** — everything must be *of* Veldora.
* **`15-LORE.md` gains a patrons section** — the lore must know its own characters.
* **I4 → `/path forcereset`** — a world wipe does the ceremony for free.

### HELD

**I3 flagships** (`31`) and **the XP coupling** (`29`).

---

## ⚠️ OPEN — the respawn mechanic may need to go

*Ethan, 2026-08-15: **"i think the death mechanic may need to go. the one that messes
with respawns because it bugs the server down."***

`instant_respawn.js` (E2a) — wakes you where you fell in ~0.75s rather than at the bed.

**Not yet diagnosed.** Before it is cut, measure: it schedules a respawn on a delay,
runs a detarget sweep over `getEntitiesWithin(inflate(24))` at the death site, and E0
P8 measured **seven hostiles** at a death site against one at a bed — so the sweep runs
in the worst place at the worst time, repeatedly, and that is the obvious suspect.

⚠️ **It is load-bearing for the design as written.** `23` PART I(b) is *"death costs
the run, never the base"*, which depends on waking where you fell. Cutting it returns
death to a bed teleport and makes dying cheaper again — the exact complaint the whole
path system was built to answer.

**Options, cheapest first:** raise the sweep interval or shrink its radius · sweep once
rather than repeatedly · keep the instant respawn and drop only the detarget · cut it.

---

## Still-open questions

* **Do subclass spawn costs stack at 50%?** — E3 decides it.
* **The deliberate-death exploit** — floor it, or leave it as a desperate strategy?
  Sharper now that `33` has Art noticing repeated dying.
* **T3's unexplained failure** — one reconnect failed with no exception logged.
  Passed after a restart. Unresolved intermittent, not a fixed bug.

## Never verified, carried from 2026-08-11

The repaired **Helper** chain · the **Harvest** (reachable, never once fought) · the
**In Control reorder** · the **Blade recast** having no boss bar.

---

# ⏸️ HELD — the XP coupling
*Ethan, 2026-08-13: **"can you give the wrench damage scaling off exp? Same with
the rest of these items."*** Design only. Nothing built — the server is off and
[[never-ship-unrun-code]] applies, so the unknowns below become probes first.

> # ⏸️ HELD — 2026-08-14, with flagships
> This design scaled the FLAGSHIP items, and flagships are held. So it is held too.
>
> **What survives the hold, if the idea is ever wanted without them:** the coupling
> never actually needed a flagship. Its real claim is §1 — that XP is already this
> system's currency and nothing pays out on it.  already scales
> attack_damage off notoriety on a 5s sweep, so a per-path XP curve could ride there
> and apply to whatever the player holds. **§2's invariant is the part worth keeping
> whatever the vehicle:** scaling is a bonus, never a penalty, or the XP strip plus
> a 5-level death cost becomes a spiral.
>
> J9/J10 are still answered and still true. J5b/J6/J7 no longer block anything.

---

## 1. Why this is the right mechanic, not just a buff

XP is **already** the currency of this entire system. It was built that way one
chunk at a time without anyone naming it:

| system | what it does to XP |
|---|---|
| E1 | drops scale with notoriety, which is fed by XP |
| **E2e** | taking a path **strips every level you have** |
| **E2b** | each death costs **5 levels** |
| Salvage's canon trade | *"Give me your levels and i shall grant you ammo"* |
| `power.js` | notoriety already buys max_health, armour, **attack_damage**, knockback resistance |

Scaling the flagship off experience closes that loop. It is not a new economy; it
is the missing consequence in the one already running.

Three things become true the moment it exists, and all three are free:

* **The entry price finally bites.** A patron hands you a weapon and, in the same
  scene, takes everything that makes it work. The gift is real and inert. You have
  to earn the right to the thing you were just given — which is the single most
  in-character mechanic in the whole design.
* **Blade's gift becomes a double gate.** The Dark Warblade is *already* too heavy
  to swing well without Strength. Now it is also weak until you climb. He hands you
  proof that you are not equal to what you reached for, twice over, and says nothing.
* **Salvage's trade gains teeth.** Selling levels for ammo now visibly costs you
  damage. Her canon line stops being flavour and starts being a real decision.

## 2. 🚨 The invariant that stops the death spiral

Ethan's standing rule is that planning maps **both** failure modes, never only the
timid one ([[planning-guards-independence]]).

**Too suppressive.** XP strip on entry + 5 levels per death + damage that follows XP
= you die, get weaker, and die again. This group already reported *"I keep dying
trying to get iron."* A naive implementation makes a bad night unrecoverable.

**Too timid.** A bonus small enough to be safe is a stat nobody notices, and the
whole idea is decorative.

The resolution is one line, and it must not be negotiated away:

> ### SCALING IS A BONUS. IT IS NEVER A PENALTY.
> The item's own damage is untouched. XP adds on top and **never subtracts**. A
> freshly-stripped player holds an ordinary, good weapon — not a broken one.

That kills the spiral outright while keeping the coupling. Losing levels costs you
*upside*, never your floor.

## 3. The curve

    bonus = SCALE × √level        (never negative, never below the item's own damage)

√ is the right shape: steep early, flattening forever, no cap needed.

| level | √level | Blade @1.2 | Forge @1.0 | Art @0.8 |
|---|---|---|---|---|
| 0 | 0 | +0 | +0 | +0 |
| 10 | 3.16 | +3.8 | +3.2 | +2.5 |
| 30 | 5.48 | +6.6 | +5.5 | +4.4 |
| 50 | 7.07 | +8.5 | +7.1 | +5.7 |
| 100 | 10.0 | +12.0 | +10.0 | +8.0 |

A diamond sword is 7 damage, so these are large — **deliberately.** Ethan:
*"cheat level i know."* The counterweights are that the path can be lost entirely
(the fall), and every death rolls you backwards.

**Recovery is fast where it needs to be.** At level 30 a death costs
√30→√25 = **0.48 damage**. Barely felt. At level 5 it costs the whole bonus — but
the floor invariant means you still hold a full-strength weapon. The curve is
gentlest exactly where the spiral would otherwise start.

## 4. What each item scales — ✅ RULED (see §7)

Ethan asked for the wrench "and the rest of these items". The answer is uniform in
principle and different in expression:

> **Each patron's flagship scales the thing that patron actually cares about.**

| patron | item | scales | why |
|---|---|---|---|
| **Forge** | `create:wrench` | **damage** ⭐ asked for | ~1 base damage today. The tool that builds becomes the tool that takes — he claims your output, so your output arms you |
| **Blade** | `darkwarblade` | **damage**, highest | proof is his entire currency |
| **Art** | `enchanters_sword` | **damage**, medium | it is a sword, but she is about rest, not killing |
| **Crown** | `goety:dark_wand` | ✅ **his court** — summon count/duration or soul energy | he wants service, so rising buys you more of it. Damage was the weakest fit of the six and is now retired. ⚠️ reachability unproven — J10 |
| **Wall** | reinforcer | ✅ **protection** | it is not a weapon. Her coupling is *what stands between you and the world* — her character exactly. Also answers I0's 300-use problem. ⚠️ reachability unproven — J9 |
| **Salvage** | TaCZ shotgun | ⚠️ **ammo, not damage** | TaCZ does its own damage and a vanilla hook probably never sees it. But **her canon line is already this**: *"Give me your levels and i shall grant you ammo."* Her gun does not hit harder as you rise — it **feeds** more |

Only **three of six are a damage number**, and the design is stronger for it. The
items that refused the uniform treatment produced better mechanics than it would
have.

## 5. Implementation — extend what is proven, invent nothing

`power.js` already does XP-adjacent stat scaling and carries the C0 findings:

* attribute ids are **`minecraft:generic.*`**; the unprefixed form THROWS
* **`removeModifier()` is UNUSABLE** from Rhino — ambiguous overload. There is no
  removal, only **a write of zero**
* `modifyAttribute()` is verified to replace cleanly and to be selective

Three candidate routes, and the choice is a measurement, not an opinion:

| | route | pro | con |
|---|---|---|---|
| **A** | player `attack_damage` modifier, gated on held item, on the existing 5s sweep | uses the exact proven mechanism | up to 5s of wrong bonus after a weapon swap — including keeping it after unequipping |
| **B** | write `minecraft:attribute_modifiers` onto the stack | exact, instant, and the **tooltip shows it** — the legibility law | mutating a held stack repeatedly is where dupes and state resets live |
| **C** | add damage inside `beforeHurt` | exact and instant, no bookkeeping | `damageOf()` proves reading; **writing is unproven** |

**Leaning B**, because this codebase has a standing legibility law — *the player must
be able to SEE the thing* — and B is the only route where the number appears on the
item. Refresh on level change rather than on a timer.

## 6. ⏳ Unknowns — probe before building

Added to `_probe_intro.js` alongside J4:

| # | question | blocks |
|---|---|---|
| **J5** | can `minecraft:attribute_modifiers` be written to a stack, and does the game **apply** it (not merely hold it)? | route B |
| **J6** | is there an XP-change event, or must we poll? | refresh strategy |
| **J7** | does a TaCZ gun's damage pass through `beforeHurt` **at all**? | whether Salvage can scale damage |
| **J8** | can `beforeHurt` damage be **written**, not just read? | route C |
| **J9** | is SecurityCraft's **reinforcement strength** reachable from KubeJS? | Wall's coupling |
| **J10** | is Goety's **soul energy / summon cap** reachable from KubeJS? | Crown's coupling |

**J9 and J10 are expected to FAIL** — both are mod-internal. That is planned for, not
feared: §7 rules that an unreachable stat becomes a KubeJS-side equivalent (scaled
absorption on your own reinforced blocks; scaled summon duration), **never a silent
downgrade back to damage.** The probe decides which of the two builds happens, not
whether Wall and Crown get a coupling at all.

I0 is the precedent for why: it reported `J1 FAILED` when the API had worked the
whole time, purely because the probe judged instead of printing. **These probes
print.**

### Results so far — measured 2026-08-14 at boot

* **J9 (Wall) — NO SURFACE. J10 (Crown) — NO SURFACE.** Exactly as predicted. Nothing
  on either item exposes reinforcement strength or soul energy; both are internal to
  SecurityCraft and Goety. §7 already ruled the consequence, so this changes nothing
  and decides everything: **both get the KubeJS-side equivalent.** Wall grants scaled
  absorption while you stand on your own reinforced blocks; Crown scales summon
  duration or count. Neither silently becomes damage.
* **J6 — VOID, and the round-1 answer was wrong.** It first reported all five event
  names present. They were not: **KubeJS resolves event names dynamically, so
  `typeof PlayerEvents.anything === 'function'` is true for nonsense** — two invented
  control names resolved 2/2. Building on that would have registered a handler that
  logs one line at startup and then never fires, which is finding C0.1 exactly.
  **J6 is unanswered.** Presence has to be proven by a FIRING event with a player
  gaining a level, or the refresh polls.

**Three probes in this workstream have now needed a control row to be worth
anything** (I0's J1, J6 here, and J5's held-vs-honoured split). Treat a probe without
a control as unrun.

## 7. ✅ Resolved (Ethan, 2026-08-13)

**1. Wall and Crown take CHARACTER SCALING, not plain damage.** So the rule is
uniform in principle and different in expression: *each flagship scales the thing
its patron actually cares about.* Blade, Forge and Art scale damage; Wall scales
protection; Crown scales his court; Salvage scales ammo. Only three of six are a
damage number, and the design is stronger for it — a spider-mother whose gift makes
your walls harder is a better sentence than one who gives +6 attack.

⚠️ **Two of the three now sit on unproven ground.** Damage has a proven route
(`modifyAttribute`, `power.js`). Protection and soul-energy do not — they are
mod-internal to SecurityCraft and Goety. **If they turn out unreachable, the answer
is a KubeJS-side equivalent, never a silent downgrade to damage:** Wall can grant
scaled absorption or resistance while you stand on your own reinforced blocks, which
is arguably more her than editing a block's hit points. Crown can scale summon
count or duration. Whatever is built must still be legible.

**2. Losing the path takes the coupling with it.** The fall strips the flagship's
scaling, and **the item never says why.** It simply stops being what it was. That is
the correct shape for all six characters at once — none of them would explain, and a
weapon quietly becoming ordinary in your hands is a better punishment than any
message. Consistent with THE SILENCE: the system's worst moments are the ones where
nothing announces itself.

Implementation note: this must key off the **live path claim**, not off a flag
written at grant time — otherwise the fall's revoke and the coupling's removal can
desync, which is the P1 bug in a new costume and would be the fifth place it has
been born.

---

# ⏸️ HELD — I3, the flagship system
*Ethan, 2026-08-14: **"define I3 because i can't find the document"** — because there
was not one. I3 existed as a five-line stub in `26-INTRODUCTIONS.md` and a scaling
design in `34`, and nowhere else. This is the spec.*

> # ⏸️ HELD — 2026-08-14
> **Ethan: *"i admit looking back i kinda don't like the idea of flagship items
> anymore, so lets hold them for possible for now."*** Not cut, not built. Every
> finding below stays valid and the probe results keep their value; nothing here is
> wasted if it comes back.
>
> **Nothing shipped is affected.** The gift beat was never generated into
> `introductions.js` — the scene generator only ever extracted arrival, demand,
> options, acceptance and refusal — so the six introductions run today with no
> reference to an item. There is no live promise to walk back.

**Status: HELD. Defined, not built.**

---
## 1. What a flagship is

The item a patron hands you at the end of your introduction. One per path, chosen
from the real mod registries rather than invented, verified to exist in I0.

| path | item | verified | scales (`29`) |
|---|---|---|---|
| **forge** | `create:wrench` | ✅ maxDamage 0 | damage |
| **blade** | `born_in_chaos_v1:darkwarblade` | ✅ maxDamage 4000, `two_handed` | damage, highest |
| **art** | `ars_nouveau:enchanters_sword` | ✅ maxDamage 2031 | damage, medium |
| **crown** | `goety:dark_wand` | ✅ maxDamage 0 | his court (J10: no surface → KubeJS-side) |
| **wall** | `securitycraft:universal_block_reinforcer_lvl1` | ✅ maxDamage 300 | protection (J9: no surface → KubeJS-side) |
| **salvage** | `tacz:modern_kinetic_gun` + `custom_data={GunId:"tacz:db_short",GunFireMode:"SEMI"}`, plus **2×** `tacz:ammo` + `custom_data={AmmoId:"tacz:12g"}` | ✅ exact forms proven | ammo |

🚨 **There is no item called `tacz:12g`.** It is `tacz:ammo` carrying an `AmmoId`
component. The docs said otherwise for two days and Salvage would have been handed
nothing.

## 2. 🚨 The thesis in miniature — why it comes back

Ethan ruled that a lost flagship is **restored one in-game day later** rather than
locked to your inventory: losing it should sting for a session, and the patron
handing it back is better than a lock.

`30-THE-THESIS.md` makes that ruling mean something:

> ### The flagship cannot be lost for the same reason you cannot die.
> Veldora permits no exit, and neither does your patron. You do not get to put it
> down, you do not get to throw it in lava and be free of it, and you do not get to
> die out of the arrangement. **It comes back the way you come back.**

So the restore is not a convenience feature. It is the single clearest statement the
system makes about what the player actually is. **It must therefore be silent** — no
"your flagship has been returned" message. It is simply in your inventory again, the
way you are simply alive again.

## 3. Granting

On acceptance, inside the accept branch only — never on refusal, never on timeout.

* Built with components (I0 J1: bracket syntax, `stack.set()`, or object form; **not**
  `Item.of(id, nbt)`, whose second argument is COUNT).
* Enchanted **Mending + Unbreaking** where it means anything. I0 J3 proved all six
  *hold* the enchantment; `34` §4 records that it only *matters* for Blade, Art and
  Wall. Wall's 300 uses make it mandatory there.
* Marked as a flagship so restore can recognise it — a `custom_data` key of our own
  alongside the mod's, e.g. `{VeldoraFlagship:"blade"}`. ⚠️ **Must not clobber
  TaCZ's `GunId`** — merge into the existing compound, never replace it.
* Given **after** the closing lines begin, in the same breath as the grant.

## 4. Losing and restoring

* A daily sweep asks, per pathed player: do you still carry your flagship?
* If not, and it has been missing since the previous world day, grant a fresh one.
* **Stored as a WORLD DAY, never `tickCount`** (finding K9 — a stamp from the future
  silently disabled the Hunt forever). `fall.js` `dayNow()` is the proven reader.
* Silent, per §2.

**The fall stops the restore.** Losing your path takes the flagship's future with it:
no more restores, and the XP coupling dies with the claim (`34` §7). The item you are
holding becomes an ordinary item and **never says why**.

⚠️ **Key off the LIVE path claim, not a flag written at grant time**, or the revoke
and the removal can desync — the P1 bug in a new costume, and this would be the fifth
place it has been born. I2 closed P1 structurally by putting every mutation inside
`commitPath()`; I3 must not reopen it.

## 5. The XP coupling

Full design in `34`. In brief: `bonus = SCALE × √level`, added to
the item's own damage and **never subtracted from it** — the invariant that stops
the death-spiral, given the entry strips all XP and every death costs five levels.

Wall and Crown take **character scaling**, ruled 2026-08-13. J9/J10 came back
**NO SURFACE**, so both need the KubeJS-side equivalent: scaled absorption while
standing on your own reinforced blocks; scaled summon duration or count. **Neither
silently downgrades to damage.**

## 6. Build order

| | chunk | blocked? |
|---|---|---|
| **I3a** | grant on acceptance, with components + enchantments | ⚠️ J5b |
| **I3b** | the daily restore sweep, silent, world-day stamped | ✅ free |
| **I3c** | the fall stops restoring + strips the coupling | ✅ free |
| **I3d** | damage coupling — Blade, Forge, Art | ⚠️ J5b, J6 |
| **I3e** | Wall's protection + Crown's court, KubeJS-side | ✅ free (J9/J10 answered) |
| **I3f** | Salvage's ammo coupling | ⚠️ J7 |

**I3b and I3c can be built today.** I3a is the natural first chunk but wants J5b.

## 7. ⏳ What is still blocking

| # | question | still open because |
|---|---|---|
| **J5b** | is a written `attribute_modifiers` component **honoured**, not merely held? | needs a player to swing |
| **J6** | is there an XP-change event, or must the refresh poll? | **round 1 was VOID** — KubeJS resolves event names dynamically, so `typeof PlayerEvents.anything === 'function'` is true for nonsense; two invented control names resolved 2/2 |
| **J7** | does TaCZ damage reach a vanilla hook at all? | needs a player to shoot |

All three are in `_probe_intro.js` and all three need the test suite, alongside J4
(logout mid-ritual) and the untested I1/I2 behaviour.

## 8. Open

1. **Does the flagship scale in the off-hand?** Recommend **no** — held, or nothing.
2. **What happens to the old flagship when you change paths?** Not yet decided.
   Recommend it simply stops being special: no confiscation, no message. You keep a
   Dark Warblade that no longer grows, which is its own quiet punishment.
3. **Should a second flagship be grantable if the first is in a chest?** The restore
   sweep as specified would duplicate it. **Restore must check the whole inventory
   AND ender chest**, or accept duplication as the cost of silence — leaning strict.
