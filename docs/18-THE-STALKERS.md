# The Stalkers — the thing that fattens you

**Status: DESIGN, fourth pass. Written 2026-08-05 from Ethan's spec.**
Nothing here is built. Ethan's call on every number.

---

## 0. The spec

> Each path gets a **stalker** adjacent to its role. It **feeds on XP**, so it
> spends the early game keeping you alive — appearing at low health, killing what
> attacks you, following you like a dog. It is making you fat before it eats.
>
> Low XP → it helps. **25–75** → a near-permanent companion. **75** → it vanishes.
> **100** → it comes for you.
>
> The Harvest is **not** guaranteed. **It is the boss fight.** Killing it drops no
> ordinary loot — it grants a **lasting buff that survives death**, and **lore
> fragments that tell you about yourself**. Losing costs you **all your XP**.
>
> It targets **players** too — dying costs XP, and it will not have its meal
> spoiled.
>
> The mob roster is retiered for horde combat: melee chaff in numbers at reduced
> health, ranged rare and specialised. Darktide/Vermintide.

---

## 1. Why this shape works

The scaling is **causal**, not a rule: it protects you *because you are its food*.
That one fact generates the whole arc, and gives the Veldora canon — *adventurers
cannot die, they can only be broken* — a mechanism:

> **You cannot die, because something is fattening you.**

And it is a **betrayal arc**, the strongest shape available. Protection is not
frightening. Protection you came to rely on, withdrawn on a schedule you set
yourself, is.

**One number drives everything.** No anger stat, no second roster.

---

## 2. NOTORIETY = the XP you are carrying

Ethan: *"maybe the answer is we force players to earn XP"* and *"he should take
all your exp."* Both point at the same simplification:

> **Notoriety is not a score we invent. It is your current XP level.**

Nothing new to track, nothing to persist, nothing to desync. The number is
already on the player, already visible above the hotbar, and already the thing
the stalker eats. The Harvest is not "reset a counter" — it is **your bar going
to zero**, which the player watches happen.

It also makes every existing XP decision a decision about the stalker:

| what you do | what it means |
|---|---|
| **hoard XP** | you get fat, drops climb, it starts counting days |
| **spend XP** (enchant, anvil, grindstone) | you get lean — you fed yourself instead of it |
| **die** | vanilla already takes most of it. No −5 rule needed; the game does it. |
| **the Harvest** | all of it |

The death penalty from earlier passes is **deleted**. Vanilla XP loss already
does that job, and better.

### 2a. Drop chance

```
dropChance = 0.08 + 0.002 × min(level, 100)
```

| level | 0 | 15 | 30 (standard enchant) | 50 | 100 |
|---|---|---|---|---|---|
| drop chance | 8% | 11% ← today | 14% | 18% | 28% |

### 2b. The trade this creates — and it is the good one

Spending XP is now **how you hide**. A player who enchants regularly lives around
level 30 and keeps a companion forever at 14% drops. A hoarder climbs toward 28%
and toward being hunted. That is a live decision every single time they stand at
an enchanting table, and it replaces the "die on purpose to shed notoriety"
tribute orbit from the last pass with something far less degenerate:

> **You buy safety with the same currency that buys power.**

---

## 3. THE ARC — one creature, four phases

| level | phase | what it does |
|---|---|---|
| **0–24** | **THE HELPER** | Appears **only at low health**. Kills what is attacking you. Stays a few seconds. Leaves. You will think it is a guardian. |
| **25–74** | **THE COMPANION** | **Behaves like a tamed dog** — follows you, attacks what attacks you, including **other players**. You come to rely on it. |
| **75–99** | **THE ABSENCE** | Gone. No warning, no message. Nothing protects you any more. |
| **100** | **THE HARVEST** | It comes for you. This is a **boss fight**. |

**The Absence is the best beat in the design, and it is the one where nothing
happens.** Every other horror mechanic here works by adding something. At 75 the
game *removes* what the player has leaned on for hours, and they work out what it
was doing. It is an `if` statement.

**The Companion is a vanilla dog**, which is the whole implementation spec:
follow at a distance, target whatever damaged the owner, do not wander. We are
not inventing companion AI — we are pointing existing AI at a miniboss. (Earlier
note that the pack has no companion system to model on was wrong; the model is
`minecraft:wolf`.)

⚠️ **Phase thrash.** A player enchanting at 30 drops to 0 and back repeatedly.
Transitions need hysteresis — enter a phase at its threshold, leave it only 3+
levels past — or the stalker blinks in and out all evening.

---

## 4. THE HARVEST — the only time it can die

This is the pass's biggest structural change, and it is Ethan's.

**In phases 1–3 the stalker cannot be killed.** Below 30% health, damage is
cancelled and it leaves. Immune to void, fire, fall, suffocation, `/kill`,
chunk-unload. If it dies even once in these phases, everyone learns it is
killable and the illusion is over.

**At the Harvest it stops fleeing and stands.** The thing that was invulnerable
for weeks becomes mortal at the exact moment it turns on you. That is the payoff,
and it is why the Harvest must not be guaranteed — a fight you cannot win is not
a fight.

| outcome | result |
|---|---|
| **it kills you** | it takes **all your XP** — nothing else. Vanilla death rules handle your items. It vanishes for **30 days**. |
| **you kill it** | see below. It vanishes for 30 days either way. |

### 4a. What killing it gives

**No ordinary loot.** A stalker that drops gear becomes a farm.

1. **A lasting buff that survives death.** You ate the thing that was eating you.
   ⟡ First kill only — later kills give fragments and materials, or the 30-day
   cycle turns a permanent buff into a stacking farm.
2. **A lore fragment** — see §4b.
3. **Materials** are fine (Ethan: *"he can drop diamonds too or whatever"*) —
   they are the least interesting reward here and should stay a garnish.

### 4b. The lore fragments — it has been watching you

Ethan wants fragments that *"give more insight into who you are."* The strongest
version is not hand-written lore. It is **a book generated at kill time from what
that stalker actually observed** — because it has followed this specific player
for weeks:

> *It counted your deaths: 14.*
> *It knows the deepest you have been: −119.*
> *It knows you have never once gone below without someone else.*

Every player's fragment is different, and it is different because of how they
actually played. Cheap to build — the stats already exist — and it is the only
reward in the pack that could not have been written in advance.

🎯 **It also pays off content we already shipped.** The guidebook has a `world/
watched` entry claiming the world watches you. Right now that is atmosphere. The
fragments make it **true**, and retroactively.

---

## 5. The casting

| path | stalker | entity | HP / dmg | reasoning |
|---|---|---|---|---|
| **Forge** | Krampus | `krampus` | 250 / 14 | the thief of Christmas. The Forge builds; Krampus takes. |
| **Art** | Nightmare Stalker | `nightmare_stalker` | 70 / 7 | the realm of nightmare against the realm of dreams. They cannot coexist. |
| **Blade** | Lord Pumpkinhead | `lord_pumpkinhead` | **600** | a challenger, here to test a would-be hero's mettle. The heaviest entity in the mod, which is right. |
| **Salvage** | Dire Hound Leader | `dire_hound_leader` | 100 / 10 | the wolf hunts its prey. |
| **Crown** | Missioner | `missioner` | 150 / 9 | the false king, lord of the dead. The Crown's hero is an intruder. |
| **Wall** | Mother Spider | `mother_spider` | 90 / 6 | **there's a spider on your wall.** |

All `born_in_chaos_v1`; health confirmed in `borninconfiguration-general.toml`.
All miniboss-tier against chaff at 10–30 HP.

⚠️ **Mother Spider spawns at weight 13** — joint-highest of any candidate, against
Krampus at 2. The Knocker was cut because Ethan had killed it too often; Mother
Spider has *more* of that problem. Two answers, do both: kill its natural spawn,
and **give every stalker a custom name, a size bump and a mark**, so a common
species still reads as singular.

🎯 **Natural spawning is a native switch.** `borninconfiguration-general.toml`
exposes **46 per-mob `*_SPAWNING_ENABLED` toggles** (all `true`) and **63
`*_HEALTH` knobs**. Six flips and the stalkers stop generating — the mod's own
switch, at the natural-spawn site, with nothing in front of the summon path. **No
In Control rule is needed for the casting**, which retires the top risk of the
previous pass.

---

## 6. 🚨 The threat to an XP-based design

**`create-enchantment-industry` is in the pack.** It makes XP an **automatable
fluid** — liquid experience, pumped, stored and spent by machine.

That is a direct attack on §2. A Forge player can hold their level anywhere they
like on demand: dump to 0 to stay a Helper forever, or pump to 100 whenever a
high drop rate suits them. Notoriety stops being a consequence and becomes a dial.

Three ways to take it, and this needs Ethan:

1. **Feature.** The Forge path's unique relationship with its stalker is that it
   can *farm the thing that eats it* — and Krampus, the thief who takes what you
   build, is the perfect stalker to pair with an XP factory. Most interesting,
   least balanced.
2. **Liquid XP does not count.** Notoriety reads levels held on the *body*, and
   experience in a tank is invisible to the stalker. Simple, defensible in
   fiction (it smells you, not your machines), keeps the trade honest.
3. **High-water mark.** Notoriety is the highest level held since the last
   Harvest, so dumping XP cannot hide you. Hardest to escape — but it also kills
   §2b's trade, which is the best thing in this pass.

**Recommend 2**, with 1 as the thing we say out loud in the lore.

⚠️ This is exactly the class of fault that killed the guidebook: a system that
looks correct and produces nothing, because something elsewhere in a 296-mod pack
quietly invalidates its assumption. It is worth checking `expDropFactor = 0.05`
in L2Hostility too — leveled mobs currently drop very little XP, which makes
honest earning slower than it looks.

---

## 7. THE HORDE — retiering, also native

63 `*_HEALTH` knobs plus `DAMAGE`, `ARMOR`, `SPEED`, `KNOCKBACK`. A config pass,
not a datapack.

| tier | examples | change |
|---|---|---|
| **Chaff** | `decaying_zombie` w30, `zombie_fisherman` w30, `baby_skeleton` w25, `barrel_zombie` w25, `bone_imp` w25, `decrepit_skeleton` w20, `dread_hound` w15 | **half health, more of them** |
| **Elites** | `zombie_bruiser`, `pumpkin_bruiser`, `door_knight`, `skeleton_thrasher`, `fallen_chaos_knight` | unchanged |
| **Specials** | `skeleton_demoman` (bomber), `dark_vortex`, `bonescaller` (summoner), `phantom_creeper`; vanilla skeleton/stray/bogged/witch/creeper | **thinned hard** |
| **Bosses** | `supreme_bonescaller`, `lifestealer`, `sir_pumpkinhead`, `lord_the_headless` | unchanged |

A Vermintide horde is dangerous through **numbers and geometry** — being
surrounded, losing footing — not through each rat being tanky. Half-health chaff
means a sweep clears three instead of one: a wave you cut through.

Denying specials frees mob-cap budget that chaff fills automatically, so thinning
ranged *is* increasing melee.

⚠️ Skeletons are the main bone/bonemeal source; thinning halves it.
⚠️ Chaff density is the main TPS risk with four players — **measure first.**

---

## 8. Open for Ethan

1. **The Enchantment Industry ruling** (§6) — feature, body-only, or high-water?
2. **What is the buff?** It must survive death and be worth a boss fight without
   being power creep. An extra heart? Resistance in the dark? Something
   path-flavoured?
3. **Does the Absence get a message?** Recommend no — let them notice.
4. **Is the 30-day return a fresh phase read, or does it resume?** Recommend
   fresh: after a Harvest you are at level 0, so it comes back as the Helper —
   and the cycle restarts with the same creature being kind to you again.
5. **The Obsessed** stays outside all of this?

---

## 9. Build order

| rung | what | proves |
|---|---|---|
| **S1** | Read level → drop-chance integration in `paths.js`. No stalkers. | the curve behaves against real play; EI ruling holds |
| **S2** | Six `SPAWNING_ENABLED` flips + the name/mark harness | they stop appearing naturally; summoning still works |
| **S3** | The unkillable wrapper on **one** path, phases 1–3 | it cannot die by any means |
| **S4** | Helper → Companion (wolf AI) → Absence | the phases read as one creature |
| **S5** | The Harvest boss fight, buff, generated lore fragment | winning and losing both feel earned |
| **S6** | All six cast; PvP defence; the 30-day return | — |
| **H1** | The horde retier | horde combat is fun; TPS holds |

S1 is now nearly free — notoriety is a value the game already tracks.

---

## 10. Risks

- 🚨 **`create-enchantment-industry` makes XP a dial** (§6). Unresolved.
- **The flee path must be airtight in phases 1–3.** Enumerate every way an entity
  can die in 1.21, not just melee damage.
- **`SPAWNING_ENABLED` may gate summoning too.** Unverified, and the casting now
  depends on it. **Test at S2** — flip one, then try to summon it.
- **Phase thrash** around 25 and 75 (§3).
- **Harvest attribution.** The XP wipe must fire only on the stalker's kill; when
  the damage source is unclear, fail toward the lesser penalty.
- **TPS under horde density** (§7).
