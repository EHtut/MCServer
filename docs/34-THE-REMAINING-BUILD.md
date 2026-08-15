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

### 1. E3 — the coefficient substrate ✅ **BUILT 2026-08-15 — E6–E10 UNBLOCKED**

`coefficients.js` publishes `VELDORA.coeff`. `drops`, `power` and `phase` are wired
into their live consumers; `/path coefficients` prints your effective numbers.
**Five paths** — Crown merged into Wall, Wall stays mercantile. Subclasses stack half
the *deviation*, not half the value (`23` §7b). Costs soften with players online.
Boot-verified: 19/19 scripts, seam published, 0 errors.
**Rollback:** every value to 1.0 restores prior behaviour exactly — no gate, no state.

⚠️ **Two things remain open on it.**

1. **The measurement has never run** — boot-verified is not verified. Bank notoriety,
   take Blade, `/path sample`, confirm the rate moved by ×0.6. **Needs a player.**
2. **`spawns` is INERT.** `checkSpawn` can only *cancel*, so it cannot produce Blade's
   ×4 — that needs an **active spawner** (`the_hunt.js`'s ring-placement mechanism),
   which is a build of its own and was deliberately NOT folded into E3. `23` §7a has
   the argument. The value is in the table, served by `VELDORA.coeff`, printed as
   INERT, and announced at boot — because a coefficient nobody reads must never look
   like one that acts.

### 2. E6 — Salvage's economy ✅ **BUILT 2026-08-15, NOT YET MEASURED**

`salvage.js` + `counters.js` + generated `gun_ammo.js`, plus `spec.keep` in the
ritual and `VELDORA.powerBoost` in `power.js`. Boot-verified 23/23, seams up.

**The per-patron counter landed with it** — Ethan's call. Salvage's debt is
`VELDORA.counter`'s first consumer, not a Salvage special case, so Forge's quota
uses the same mechanism. `/counters` prints what each patron says you owe.

⚠️ **Test it:** `/trade_test` — take each of the three, confirm the price is actually
charged, that the ammo chambers, and that **you stay blind after the scene closes.**
That last one is the whole sight trade and it only works because a probe caught
`release()` clearing it.

*Original scope, for reference:*

* the three trades: **hunger → life**, **levels → ammo**, **sight → the power to
  kill** (blindness up to 5 min)
* the **debt counter**, raised by every trade
* she opens **at the worst times** — mid-combat confirmed; the ritual's detarget is
  what makes that survivable rather than a death sentence
* debt persists across restart as a **world day**, never `tickCount`

### 2b. ⭐ E6b — SHE OPENS HERSELF 🚨 the half that makes E6 a feature

*Ethan, 2026-08-15: **"going forwards i want the player to actually use commands as
little as possible."*** `23` PART V.6.

**E6's trades work and were tested clean. `/trade_test` is a harness, not the
feature.** `23` PART V has always said she opens **at the worst times** — mid-combat,
low health, just after a death — and that half does not exist.

* triggers: low health · mid-combat · just after a death · a long dry spell
* **rate-limited by her counter**, so she does not become a vending machine
* the ritual's detarget is what makes a mid-combat offer survivable rather than a
  death sentence — that was designed in from the start
* ⚠️ **must not fire during another patron's scene.** `VELDORA.ritual.active(p)`
  already guards it; test it with two patrons wanting you at once.

**This is cheap** — the trades, the counter and the ritual all exist. It is a trigger
and a rate limit.

### 2c. ⭐ THE TRADE IS THE UNIVERSAL INTERFACE — re-scopes PART VI

*Ethan: **"this trade system is perfect for literally all of the patrons. We can
integrate these into events."*** `23` PART V.5.

**72 bespoke events was the wrong reading.** Most are `ritual + options + counter`
with different words and numbers — Blade's *Sharpen* is a trade with its price
stated, Wall's *"take out one wall"* is an offer, Forge's quota is an offer with a
clock. Build the **offer** once and most of PART VI becomes authoring.

**What stays bespoke:** the genuinely mechanical ones — Blade's waves, *Understudy*,
Salvage's *Interest* raid, Art's pages. **Those need the spawner, not the ritual.**

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
