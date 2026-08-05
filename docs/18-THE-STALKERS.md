# The Stalkers — the thing that fattens you

**Status: DESIGN, third pass. Written 2026-08-05 from Ethan's spec.**
Nothing here is built. Ethan's call on every number.

---

## 0. The spec

> Each path gets a **stalker** adjacent to its role. It **feeds on EXP**, so it
> spends the whole early game keeping you alive — appearing at low health,
> killing what is attacking you, staying a few seconds, then leaving. It is
> making you thick and fat before it hunts you itself.
>
> Low EXP → it helps. **25–75** → it becomes a near-permanent companion.
> **75** → it vanishes. **100** → it hunts you, takes everything, and disappears
> for ~30 days — *enough for you to forget what they did.*
>
> It targets **players** too, because dying costs you EXP and it will not have
> its meal spoiled.
>
> The mob roster is retiered for horde combat: melee chaff in numbers at reduced
> health, ranged units rare and specialised. Darktide/Vermintide.

---

## 1. Why the pivot is right

The guardian-angel version is dead, and it should be. It needed **two systems and
two rosters** to say what this says with one, and its inverse scaling was a rule
rather than a reason.

Here the scaling is *causal*. It protects you **because you are its food**. That
single fact generates the entire arc without another mechanic:

> **You cannot die, because something is fattening you.**

Which also gives the Veldora canon — *adventurers cannot die, they can only be
broken* — a mechanism, and a much darker one than a guardian would have.

And it is a **betrayal arc**, which is the strongest shape available. Protection
is not frightening. Protection you came to rely on, withdrawn on a schedule you
set yourself, is.

**It also collapses the design to one number.** Anger is gone — notoriety alone
drives every phase. That is what Ethan asked for in the first message (*"it's exp
based"*), and the second pass had drifted away from it.

---

## 2. NOTORIETY — the only number

Per-player, on persistent data. Starts at 0.

| event | change |
|---|---|
| every **5 vanilla XP levels** earned | **+1** |
| any death | **−5** |
| death **at your stalker's hands** (the Harvest) | **→ 0** |

Levels arrive at ~30/hour, so scaling by 5 makes a death cost ~50 minutes.

### What it buys

```
dropChance = 0.08 + 0.002 × min(notoriety, 100)
```

| notoriety | 0 | 15 | 50 | 100 |
|---|---|---|---|---|
| drop chance | 8% | **11%** ← today | 18% | 28% |

---

## 3. THE ARC — one creature, four phases

| notoriety | phase | what it does |
|---|---|---|
| **0–24** | **THE HELPER** | Appears **only at low health**. Kills what is attacking you. Stays a few seconds. Leaves. You will think it is a guardian. |
| **25–74** | **THE COMPANION** | Increasingly present. Follows at a distance, intervenes readily, defends you **from other players**. You come to rely on it. |
| **75–99** | **THE ABSENCE** | Gone. No warning, no explanation. Nothing protects you any more. |
| **100** | **THE HARVEST** | It hunts you. It takes everything. Then it is gone for **30 days**. |

**The Absence is the best beat in the design, and it is the one where nothing
happens.** Every other horror mechanic in the pack works by adding something. At
75 the game *removes* the thing you have depended on for hours of play, and the
player realises what it was doing. That is the moment the whole system pays off,
and it costs us nothing to build — it is an `if` statement.

Then, thirty days later, it comes back and helps you again. And you let it.

### 3a. The tribute orbit — an emergent strategy, and we should allow it

A death costs 5. So a player at 78 who dies once lands at 73 — **and their
companion comes back.**

Players will find this. They will start **paying tribute in deaths** to keep the
thing that protects them, which is thematically perfect and was not designed —
it falls out of Ethan's own numbers. It creates two real strategies:

- **Orbit at ~73**: permanent companion, 18% drops, never harvested.
- **Push to 100**: 28% drops, then lose everything and stand alone for 30 days.

⟡ **Open:** is the orbit too safe? It caps a player at 73 by choice. Argument for
leaving it: the 10-point drop-rate gap is a real incentive to push, and a player
who chooses safety over profit is making exactly the trade this design is about.

### 3b. It targets players

Ethan: *"extra funny if it targets players mostly because my brother likes
killing us since there's no consequences."*

Correct, and it is not only funny — **it is the consequence layer PvP currently
lacks**, and it arrives with a reason rather than a rule. Your stalker does not
care about you; it objects to someone else spoiling its meal.

⚠️ **The bait exploit.** Drop to low health, provoke someone into hitting you,
and an unkillable miniboss kills them. This is **self-limiting by Ethan's own
spec** — the Helper only triggers at genuinely low health, so baiting means
nearly dying for real. Watch it; do not pre-solve it.

⟡ Two players fighting, both defended, produces **stalker vs stalker**. That is
the one place paths still visibly cross, and it is worth keeping.

---

## 4. The rules of a stalker

1. **It cannot die.** Below 30% health, incoming damage is *cancelled*; it
   leaves. Immune to void, fire, fall, suffocation, `/kill`, chunk-unload.
   **If one dies even once, everyone learns it is killable.**
2. **It is yours.** One player. It will kill anything — mob or player — that
   damages its owner, and cannot be provoked by anyone else.
3. **Friends can help** during the Harvest: others *can* damage it, driving it to
   the flee threshold faster. They cannot finish it.
4. **It pays nothing.** No loot, no XP, in any phase. A stalker that drops
   anything becomes a farm and the horror dies instantly.
5. **It leaves clean.** Sound, then gone. No corpse.

---

## 5. The casting

| path | stalker | entity | HP / dmg | reasoning |
|---|---|---|---|---|
| **Forge** | Krampus | `krampus` | 250 / 14 | the thief of Christmas. The Forge builds; Krampus takes. |
| **Art** | Nightmare Stalker | `nightmare_stalker` | 70 / 7 | it lives in the realm of nightmare, the Art's hero in the realm of dreams. They cannot coexist. |
| **Blade** | Lord Pumpkinhead | `lord_pumpkinhead` | **600** / — | a challenger, here to test a would-be hero's mettle. The heaviest entity in the mod, which is right. |
| **Salvage** | Dire Hound Leader | `dire_hound_leader` | 100 / 10 | the wolf hunts its prey. Simple. |
| **Crown** | Missioner | `missioner` | 150 / 9 | the false king, lord of the dead. The Crown's hero is an intruder in his domain. |
| **Wall** | Mother Spider | `mother_spider` | 90 / 6 | **there's a spider on your wall.** |

All `born_in_chaos_v1`. Health confirmed from `borninconfiguration-general.toml`
— every one is miniboss-tier against chaff at 10–30 HP.

**The Knocker is out** — Ethan has killed it many times, and an unkillable
creature you have already killed is not unkillable. That is a real criterion, and
it applies to Mother Spider too:

### ⚠️ Mother Spider is the most-encountered of the six

It spawns naturally at **weight 13** — the joint-highest of any candidate, well
above Krampus (2) or the others (4). Whatever the Knocker problem is, Mother
Spider has more of it.

Two answers, and I would do both:

1. **Turn its natural spawn off** (below) — so from that day the only one alive
   is yours.
2. **Name and mark every stalker instance.** A stalker should carry a custom
   name, a size bump, and a subtle effect. Then even a common species reads as
   *singular*, and "I've killed one of those" stops being the same thought as
   "I've killed that one." This is worth doing for all six regardless.

### 🎯 The spawn problem solves itself — natively

The second pass planned an In Control rule to stop the stalkers spawning
naturally, and flagged as its top risk that the same rule might block **our own
summons**.

That risk is gone. `borninconfiguration-general.toml` exposes **46 per-mob
`*_SPAWNING_ENABLED` toggles** (all currently `true`). Six flips to `false` and
the six stalkers stop generating naturally — using the mod's own switch, at the
natural-spawn site, with nothing sitting in front of the summon path.

**No In Control rule is needed for the casting at all.**

---

## 6. THE HORDE — retiering, also native

The same file exposes **63 per-mob `*_HEALTH` knobs**, plus `DAMAGE`, `ARMOR`,
`SPEED` and `KNOCKBACK`. The Darktide retier is a config pass, not a datapack.

| tier | role | examples | change |
|---|---|---|---|
| **Chaff** | horde pressure | `decaying_zombie` w30, `zombie_fisherman` w30, `baby_skeleton` w25, `barrel_zombie` w25, `bone_imp` w25, `zombie_lumberjack` w25, `decrepit_skeleton` w20, `dread_hound` w15 | **half health, more of them** |
| **Elites** | armoured, break the line | `zombie_bruiser`, `pumpkin_bruiser`, `door_knight`, `skeleton_thrasher`, `fallen_chaos_knight` | unchanged |
| **Specials** | rare, must be answered | `skeleton_demoman` (bomber), `dark_vortex`, `bonescaller` (summoner), `phantom_creeper`; vanilla skeleton/stray/bogged/witch/creeper | **thinned hard** |
| **Bosses** | rare roamers | `supreme_bonescaller`, `lifestealer`, `sir_pumpkinhead`, `lord_the_headless` | unchanged — the six stalkers leave this tier and become summon-only |

**Half-health chaff is what makes a horde fun instead of exhausting.** A
Vermintide horde is dangerous through numbers and geometry — being surrounded,
losing footing — not through each rat being tanky. Halving chaff means a sweep
clears three instead of one: a wave you cut through.

Denying specials frees mob-cap budget that chaff fills automatically, so thinning
ranged *is* increasing melee. In Control's `spawner.json` can push density past
the vanilla cap if that is not enough.

⚠️ Skeletons are the pack's main bone/bonemeal source. Thinning them halves it.
⚠️ Chaff density is the pack's main TPS risk with four players — **measure before
raising numbers, not after.**

---

## 7. Open for Ethan

1. **Is the Harvest guaranteed?** Recommend **no** — at 100 it hunts, and if you
   survive it keeps hunting. Only its kill triggers the wipe. An unavoidable wipe
   teaches people to stop earning, which kills the loop.
2. **Does "takes everything" mean notoriety only, or items too?** Recommend
   notoriety only; vanilla death rules handle the rest.
3. **Is the tribute orbit (§3a) allowed to stand?**
4. **Should the Absence be silent?** Recommend yes — no message. Let them notice.
5. **The Obsessed** stays outside all of this? It is the one everyone likes, and
   a pack that keeps one horror belonging to nobody is better for it.

---

## 8. Build order

| rung | what | proves |
|---|---|---|
| **S1** | Notoriety counter + drop-chance integration. No stalkers. | the number tracks, persists, survives restart |
| **S2** | The six `SPAWNING_ENABLED` flips + name/mark harness | the six stop appearing naturally; summoning still works |
| **S3** | The unkillable wrapper on **one** path | the five invariants hold under abuse |
| **S4** | The Helper → Companion → Absence → Harvest arc | the phases read as one creature, not four |
| **S5** | All six cast; PvP defence; the 30-day return | — |
| **H1** | The horde retier — chaff health, special thinning, density | horde combat is fun; TPS holds with four players |

---

## 9. Risks

- **The flee path must be airtight.** Enumerate every way an entity can die in
  1.21, not just melee damage. Invariant 4.1 is the whole illusion.
- **`SPAWNING_ENABLED` may gate summoning too.** It is the mod's own natural-spawn
  switch so this is unlikely, but it is **unverified** and it is now the single
  point the casting depends on. **Test at S2** — flip one, then try to summon it.
- **Death attribution.** The Harvest wipe must fire only on the stalker's kill.
  When the damage source is unclear, fail toward the *lesser* penalty.
- **Phase thrash at boundaries.** A player oscillating around 25 or 75 should not
  get a stalker appearing and vanishing every few minutes. Needs hysteresis —
  enter a phase at the threshold, leave it only 3+ points past.
- **TPS under horde density** (§6).
