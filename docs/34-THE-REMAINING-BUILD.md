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

E0 probes · E1 the iron fix · E2a–E2d, E2f · **I0** probes · **I1** the ritual
(`ritual.js`) · **I2** the introductions (`introductions.js`)

⚠️ **E2e (entry strips XP) is built but has never actually run** — it was accepted at
0 levels, so the strip skipped. 30 seconds to close: bank levels, take a path, watch
the bar.

---

## THE QUEUE

### 0a. THE STAGED MODPACK AUDIT ⭐ QUEUED — Ethan + me, together

Eight sittings, one mod group each, protocol in **`36-THE-MOD-TAXONOMY.md` §8**.
I bring what each mod actually registers (read out of the jar, not the blurb); he
judges. Five questions per mod, the sharpest being **progression or filler** — Wall's
fourteen looked healthy until that one was asked.

**No mod in this pack has ever been asked which path it belongs to.** The 2026-07-31
theme audit ran against rulings, before paths existed. And the taxonomy in `36` is
regex — a hypothesis, not a verdict.

Order: **A1** forge/Create (27) · **A2** wall + goety (~18) · **A3** art (14) ·
**A4** blade + salvage (12, verdict will be GROW) · **A5** worldgen (39) ·
**A6** mobs (25) · **A7** visuals + QoL (83) · **A8** perf + libraries (72).
**A1 and A5 will change the pack most.**

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

### 1. E3 — the coefficient substrate 🚨 BLOCKS EVERYTHING BELOW

One table, four axes (`spawns`, `power`, `drops`, `phase`) × six paths, read by three
consumers that **already exist**: `dropChanceFor`, `power.js CURVE`, `resolvePhase`.

* subclass contributes 50%, primary 100%
* costs scale by players online
* `/path coefficients` prints your effective numbers — the legibility law
* **Verify by measurement, not by reading the table**: set Blade's drop coefficient
  to 0, measure zero payouts over 40 kills; set to 1, measure the expected rate.
  Against the live path, never a fixture.
* **Rollback:** all coefficients 1.0 restores today's behaviour exactly.

E6–E10 all read from this. Building any of them first means building them twice.

### 2. E6 — Salvage's economy

`24` calls it *"the proof of the whole design"*.

* the three trades: **hunger → life**, **levels → ammo**, **sight → the power to
  kill** (blindness up to 5 min)
* the **debt counter**, raised by every trade
* she opens **at the worst times** — mid-combat confirmed; the ritual's detarget is
  what makes that survivable rather than a death sentence
* debt persists across restart as a **world day**, never `tickCount`

### 3. E7 — Interest: the first raid

The debt comes due; raid size scales with trades since the last one.
**Verify a raid at zero debt spawns nothing**, rather than a default wave.

### 4. E8 — Blade

Waves, the taunt ladder escalating to **`"Run."` immediately before the Harvest**
(fires exactly once, ever). Blade's drop coefficient stays **below** 1.

### 5. E9 — Forge

Quotas with world-day deadlines, Appraisal paying by what you have **built**,
compounding on a miss.

### 6. E10 — Art, Crown (Wall now leaves this group)

Built when walked. *Note: `24` said Wall folds into Forge if unwalked — the refresh
supersedes that.*

### 7. PART VI — THE EVENTS: 72 designed, 0 built

`23` PART VI holds **twelve events per patron, six patrons**. This is the
"things happen to you" layer in its entirety and **none of it exists.** Probably the
single largest gap between the design and the build.

### 8. Subclasses — a datapack, not a build

`30` §6: the pack already ships `puffish_skills` (the engine) + Skill Tree RPG (254
datapack JSONs). `category.json` exposes `unlocked_by_default` (the path unlocks its
tree) and `exclusive_root` (the subclass choice). **Authoring job.**

### 9. Being chosen — `33`

Patrons pick you by watching what you do. Fixes the flaw that the player typing
`/path blade` makes every "you already reached for it" line literally true.
**Do it at the world reset** — a fresh world means no retrofit.

### 10. Smaller, captured

* **The emphasis ladder** (`33` §A) — titles for the moment the world changes.
  ⚠️ probe first: does a title render over blindness?
* ⭐ **THE ARRIVAL** (`37`) — **Ethan has written the scene**, canon. The patrons
  argue over you on first join while you cannot see. Supersedes the first-join
  introduction idea in `33` §B and is better than it: you learn the world from how
  they disagree, not from exposition. The ritual primitive already does the hard
  part.
* ⭐ **Ambient patron arguments** (`37` §4) — openers + rebuttals, combinatorial,
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

## Still-open questions

* **Do subclass spawn costs stack at 50%?** — E3 decides it.
* **The deliberate-death exploit** — floor it, or leave it as a desperate strategy?
  Sharper now that `33` has Art noticing repeated dying.
* **T3's unexplained failure** — one reconnect failed with no exception logged.
  Passed after a restart. Unresolved intermittent, not a fixed bug.

## Never verified, carried from 2026-08-11

The repaired **Helper** chain · the **Harvest** (reachable, never once fought) · the
**In Control reorder** · the **Blade recast** having no boss bar.
