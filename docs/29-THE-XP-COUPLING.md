# The XP coupling — flagships that scale off experience

*Ethan, 2026-08-13: **"can you give the wrench damage scaling off exp? Same with
the rest of these items."*** Design only. Nothing built — the server is off and
[[never-ship-unrun-code]] applies, so the unknowns below become probes first.

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

## 4. What each item scales — the recommendation

Ethan asked for the wrench "and the rest of these items". Four of the six are
melee-capable and take damage scaling directly. Two do not reach, and for those the
honest answer is better than forcing it:

> **Each patron's flagship scales the thing that patron actually cares about.**

| patron | item | scales | why |
|---|---|---|---|
| **Forge** | `create:wrench` | **damage** ⭐ asked for | ~1 base damage today. The tool that builds becomes the tool that takes — he claims your output, so your output arms you |
| **Blade** | `darkwarblade` | **damage**, highest | proof is his entire currency |
| **Art** | `enchanters_sword` | **damage**, medium | it is a sword, but she is about rest, not killing |
| **Crown** | `goety:dark_wand` | **damage**, low | ⚠️ weakest fit. Better: **soul energy / servants** — he wants service, and rising should buy you more of his court. Reachability unknown |
| **Wall** | reinforcer | ⚠️ **protection, not damage** | it is not a weapon. Her coupling is *what stands between you and the world* — which is her character exactly. Also solves the 300-use problem from I0 |
| **Salvage** | TaCZ shotgun | ⚠️ **ammo, not damage** | TaCZ does its own damage and a vanilla hook probably never sees it. But **her canon line is already this**: *"Give me your levels and i shall grant you ammo."* Her gun does not hit harder as you rise — it **feeds** more |

The two that "fail" produce better mechanics than the uniform version would have.
If Ethan wants plain damage on all six instead, Wall's and Crown's are one config
line each — but Salvage's genuinely may not be reachable regardless.

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

I0 is the precedent for why: it reported `J1 FAILED` when the API had worked the
whole time, purely because the probe judged instead of printing. **These probes
print.**

## 7. Open for Ethan

1. **Wall and Crown** — take the character-appropriate scaling above, or plain
   damage like the others?
2. **Does the flagship scale when it is not the item that kills?** Blade's blade in
   your off-hand, say. Recommend **no** — held, or nothing.
3. **Does scaling survive the fall?** Recommend **no**: losing the path takes the
   coupling with it, so the flagship becomes an ordinary weapon in your hands and
   never says why.
