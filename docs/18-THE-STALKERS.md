# The Stalkers — the thing that fattens you

**Status: DESIGN, fifth pass. Written 2026-08-05 from Ethan's spec.**
Nothing here is built. Ethan's call on every number.

---

## 0. The spec

> Each path gets a **stalker** adjacent to its role. It **feeds on XP**, so it
> spends the early game keeping you alive — appearing at low health, killing what
> attacks you, following you like a dog. It is making you fat before it eats.
>
> **XP accumulates daily regardless of what you do**, so everyone is pushed
> toward the hunt. XP is also a **buff system**: as it climbs you get better
> drops *and* you get stronger and harder to kill.
>
> **0–24** it helps · **25–74** near-permanent companion · **75** it vanishes ·
> **100** it comes for you.
>
> The Harvest is **the boss fight**, and it should be **hard enough to fail four
> or five times**. Losing costs all your XP. Winning drops no loot — a **single
> line** of lore, simple enough to make you ask *what was this all for*, and then
> **you must give up your path** and choose again: another one, or the same one.

---

## 1. Why this shape works

The scaling is **causal**: it protects you *because you are its food*. That gives
the Veldora canon — *adventurers cannot die, they can only be broken* — a
mechanism:

> **You cannot die, because something is fattening you.**

And the fifth pass closes the loop completely. Because XP is now also **power**,
the thing fattening you is the same thing making you strong enough to fight it.
It feeds you until you are worth eating, and by then you can hold a knife.

That is the whole design in one sentence, and nothing about it is arbitrary.

---

## 2. NOTORIETY — your XP, with a floor that rises

```
notoriety = max( current XP level , daysSinceLastHarvest × rate )
```

Two inputs, both already tracked, and each covers the other's hole.

- **Your XP level** is the honest measure of how fat you are, and it makes every
  trip to the enchanting table a decision about the stalker.
- **The daily floor** is Ethan's *"you accumulate it daily regardless of what you
  do."* It guarantees the hunt. You cannot opt out by playing quietly, and — see
  §6 — you cannot opt out by dumping XP into a machine either.

Spending XP only helps while you are **above** the floor. Below it, you are being
carried toward the Harvest whether you like it or not, which is the correct
feeling for a thing that has already decided you are a meal.

The old −5 death penalty is gone; vanilla XP loss does that job better, and the
floor means death can no longer hide you.

### 2a. What it buys

```
dropChance = 0.08 + 0.002 × min(notoriety, 100)
```

| notoriety | 0 | 15 | 30 | 50 | 100 |
|---|---|---|---|---|---|
| drop chance | 8% | 11% ← today | 14% | 18% | 28% |

### 2b. What it makes you — XP as power

Ethan: *"you not only get better drops as you level up, you become stronger,
harder to kill, etc."* Attribute modifiers scaled by notoriety, recomputed on
change, capped at 100:

| attribute | at 0 | at 100 |
|---|---|---|
| max health | — | **+6** (3 hearts) |
| armour | — | **+4** |
| attack damage | — | **+2** |
| knockback resistance | — | **+0.2** |

Deliberately modest. This is not a class system — it is the reason the Harvest is
survivable at all, and the reason a fat player *feels* fat.

⚠️ Nothing in the pack currently does this. The one mod that would have —
`mrpgc_skill_tree` — was removed after it crashed client startup, so this is
build-it-ourselves. Attribute modifiers via KubeJS, keyed on a stable UUID so
they replace rather than stack.

### 2c. You are supposed to outgrow the world

Ethan, 2026-08-05: *"that's the idea. you're becoming stronger. you're becoming
closer to godhood. And the stalker likes their meals ripe."*

✅ **L2 IS GONE, 2026-08-11.** This section used to argue that XP-as-power sat
safely alongside L2Hostility's depth-and-days mob scaling. Ethan cut all three L2
jars, and the argument below is *why that was fine*: its job had already been
reassigned to the stalker, so removing it removes a redundant curve rather than
the only one.

It had also earned it — L2 caused the immortal wither skeletons, and it was
winning the fight against the Harvest stat block (`244 vs 250 — something is
re-applying after us`), which now simply stops.

⚠️ **One live consequence to watch.** L2's `expDropFactor = 0.05` was suppressing
XP from every leveled mob. With it gone, **XP income rises sharply** — and since
notoriety *is* your XP level, everyone climbs toward the Harvest faster than the
rate table in §4a was tuned for. The pacing there assumed the suppressed income.
Re-measure before trusting those day counts.

**That is not a fault, it is the design.** A player climbing toward 100 is meant
to outgrow the horde — that is precisely the Vermintide feeling in §7, where
chaff is something you wade through rather than fight. And it means:

> **The stalker replaces the difficulty curve.**

By the Absence, the world has stopped being able to threaten you, and the only
thing left that can is the one that has been feeding you the whole time. The game
does not stay hard by making zombies harder. It stays hard by making *the thing
that owns you* the last real danger in it.

Which is also why the Harvest instance must scale with you (§5) — it likes its
meals ripe, and it has been waiting for exactly this.

---

## 3. THE ARC — one creature, four phases

| notoriety | phase | what it does |
|---|---|---|
| **0–24** | **THE HELPER** | Appears **only at low health**. Kills what is attacking you. Stays a few seconds. Leaves. You will think it is a guardian. |
| **25–74** | **THE COMPANION** | **A tamed dog.** Follows you, attacks what attacks you — including **other players**. You come to rely on it. |
| **75–99** | **THE ABSENCE** | Gone. No warning, no message. Nothing protects you now. |
| **100** | **THE HARVEST** | It comes for you. Boss fight. |

**The Absence is the best beat in the design and it is the one where nothing
happens.** Every other horror mechanic here adds something; at 75 the game
*removes* what the player has leaned on for hours, and they finally work out what
it was doing. It is an `if` statement.

⚠️ **Phase thrash.** Enchanting drops a player from 30 to 0 in one click. Needs
hysteresis — enter a phase at its threshold, leave only 3+ past it — or the
stalker blinks in and out all evening. The floor damps most of this on its own.

---

## 4. THE HARVEST — the only time it can die

In phases 1–3 the stalker **cannot be killed**: below **35%** health, damage is
cancelled and it leaves. Immune to void, fire, fall, suffocation, `/kill`,
chunk-unload. If it dies once in these phases, everyone learns it is killable.

**At the Harvest it stops fleeing and stands.** The thing that was invulnerable
for weeks becomes mortal at the moment it turns on you.

### 4a. It should take four or five attempts

Ethan wants it hard enough to fail 4–5 times. That is right for the arc, but the
pacing has to be checked, because a naive reading makes it a **year**:

- Climb to 100 at rate 1.0 ≈ 100 in-game days
- 30-day absence after each Harvest
- × 5 attempts ≈ **650 in-game days ≈ 200+ real hours**

So the cycle must **accelerate**. It has tasted you; it comes back sooner:

| attempt | daily rate | ≈ days to the next Harvest |
|---|---|---|
| 1st | 1.0 | 100 |
| 2nd | 1.5 | 67 |
| 3rd | 2.0 | 50 |
| 4th | 2.5 | 40 |
| 5th | 3.0 | 33 |

Roughly 290 days rather than 650, and the escalation is *dread* rather than
bookkeeping — each failure makes the next one arrive faster. The rate resets on a
win.

### 4b. What winning gives — deliberately almost nothing

| | |
|---|---|
| **loss** | it takes **all your XP**. Nothing else; vanilla rules cover your items. Gone 30 days. |
| **win** | **one line** of lore. Then **you must give up your path.** Materials as a garnish. |

**No permanent buff.** Ethan's first instinct — *"killing the stalker gives
nothing"* — was the right one, and §2b has since taken over the job a buff would
have done. The reward is not a stat. It is a sentence and a decision.

### 4c. The fragment is one line

Not a generated stats book — that idea is retired, it was clever rather than
good. **One line, plain, and it should land like a hole in the floor:**

> *It was never hungry.*
> *You were chosen the day you chose.*
> *There were five others. It ate them first.*
> *It has done this before. You have done this before.*

The line's whole job is to make the player ask **what was this all for** — at
the exact moment the game takes their path away and asks them to choose again.

🎯 This also makes the guidebook's existing `world/watched` entry **retroactively
true**. Right now it is atmosphere.

### 4d. Losing the path is the real reward

This is the strongest idea in the pass, because it lands on machinery we already
built. `paths.js` already has **one-walker-per-path exclusivity** with claim and
release. So on a kill:

1. Your claim is **released**.
2. You choose again — the same path, or a different one.
3. **Anyone else can also take it now.**

You killed the thing that hunted you, and the prize is that you must decide
whether the last hundred days meant anything. And while you decide, **your
brother can take your path.** That is a genuine stake produced by a system that
already exists.

✅ **Ruled (Ethan, 2026-08-05): escrow.** The path is held while its former walker
decides. It opens to everyone only if they walk away without choosing — so the
stake is real, but it is *theirs to lose* rather than a race they can be sniped
in while reading a single line of text.

---

## 5. The casting

| path | stalker | entity | HP / dmg | reasoning |
|---|---|---|---|---|
| **Forge** | Krampus | `krampus` | 250 / 14 | the thief of Christmas. The Forge builds; Krampus takes. |
| **Art** | Lifestealer (true form) | `lifestealer_true_form` | 70 / 7 | 🔴 **recast 2026-08-22.** `nightmare_stalker` is reserved for **Caebrim** — see `docs/57 §2`, including why it must be the TRUE form and not the base Lifestealer. |
| **Blade** | Fallen Chaos Knight | `fallen_chaos_knight` | **600** | a dead duelist for the path about mastering one weapon. **Swapped from `lord_pumpkinhead` 2026-08-11 — see THE BLADE RECAST below.** |
| **Salvage** | Dire Hound Leader | `dire_hound_leader` | 100 / 10 | the wolf hunts its prey. |
| **Crown** | Missioner | `missioner` | 150 / 9 | the false king, lord of the dead. The Crown's hero is an intruder. |
| **Wall** | Mother Spider | `mother_spider` | 90 / 6 | **there's a spider on your wall.** |

⚠️ **These are not yet hard enough to fail 4–5 times.** Only Lord Pumpkinhead is
built like a real boss. Art's casting at 70 HP is a speed bump for a player
carrying +6 health and +4 armour. The Harvest instance needs its own stat block —
health, damage and armour multiplied at summon time — so the *species* stays
itself while *your* stalker is the version that has been eating for a hundred
days. That is also thematically correct: it is fat too.

⚠️ **Mother Spider spawns at weight 13**, joint-highest of any candidate against
Krampus at 2. The Knocker was cut for being over-familiar; Mother Spider is worse
on that axis. Kill its natural spawn, and **give every stalker a custom name, a
size bump and a mark** so a common species still reads as singular.

🎯 `borninconfiguration-general.toml` exposes **46 per-mob `*_SPAWNING_ENABLED`
toggles** and **63 `*_HEALTH` knobs** — the mod's own switch, at the natural-spawn
site, with nothing in front of the summon path.

⚠️ **It is FIVE flips, not six, and one casting has no switch at all.**
`LORD_PUMPKIN_HEAD_SPAWNING_ENABLED` **does not exist** in that config — Lord
Pumpkinhead only has `_ARMOR/_DAMAGE/_HEALTH/_KNOCKBACK/_SPEED`. It never needed
a flip during the C4 re-audit because it was the *no-toggle control*, and so it
never got one.

✅ **FIXED 2026-08-05 by a different route.** Lord Pumpkinhead is denied through
**In Control** instead, keyed on that one entity. *(2026-08-11: that same rule now
also denies `fallen_chaos_knight`, which likewise has no config key — it ships a
biome modifier at `"biomes": any`, weight 5. Both are denied; the pumpkin stays
suppressed even though he is no longer a casting, because re-admitting a mounted
boss to natural spawns is a content change nobody asked for.)* Safe because In Control filters
`finalizeSpawn` and our KubeJS summon path does not run it — and that was
*measured*, not assumed: a probe spawned him our way while the deny was live and
he was alive at t+20, t+100 and t+200. Same method as the C4 re-audit, because a
same-tick check is what produced the original false pass.

So the six castings are now summon-only by two different mechanisms: five by the
mod's own config toggle, one by In Control. Worth knowing when reading the code —
`grep SPAWNING_ENABLED` will only ever find five.

---

## 6. `create-enchantment-industry` — resolved by the floor

Liquid experience makes XP an automatable fluid, which would have let a Forge
player hold their level anywhere on demand and turn notoriety into a dial.

**The daily floor fixes this without a ruling.** Dump every point you own into a
tank and the floor still rises; you can lower the *ceiling*, never the *tide*.
The most an XP factory buys is a slower climb — which is a real advantage, fairly
bought, and thematically perfect for the one path whose stalker is a thief.

Still worth checking: `expDropFactor = 0.05` in L2Hostility means leveled mobs
drop very little XP, so honest earning is slower than it looks. That mostly makes
the floor the dominant term for casual players — probably fine, worth measuring.

---

## 7. THE HORDE — retiering, native

| tier | examples | change |
|---|---|---|
| **Chaff** | `decaying_zombie` w30, `zombie_fisherman` w30, `baby_skeleton` w25, `barrel_zombie` w25, `bone_imp` w25, `decrepit_skeleton` w20, `dread_hound` w15 | **half health, more of them** |
| **Elites** | `zombie_bruiser`, `pumpkin_bruiser`, `door_knight`, `skeleton_thrasher`, `fallen_chaos_knight` | unchanged |
| **Specials** | `skeleton_demoman` (bomber), `dark_vortex`, `bonescaller` (summoner), `phantom_creeper`; vanilla skeleton/stray/bogged/witch/creeper | **thinned hard** |
| **Bosses** | `supreme_bonescaller`, `lifestealer`, `sir_pumpkinhead`, `lord_the_headless` | unchanged |

A Vermintide horde is dangerous through **numbers and geometry** — being
surrounded, losing footing — not through each rat being tanky. Half-health chaff
means a sweep clears three instead of one. Denying specials frees mob-cap budget
that chaff fills, so thinning ranged *is* increasing melee.

⚠️ Skeletons are the main bone/bonemeal source; thinning halves it.
⚠️ Chaff density is the main TPS risk with four players — **measure first.**

---

## 7b. Rulings, 2026-08-05

- **The Beasts are TROPHIES, not a path.** Ice and Fire gets no rungs. It is world
  lore and a thing to have killed — which is what it always actually was. This
  closes an open question from `17-PATHS-TO-POWER` §3.
- **The Harvest having one shape is fine for now** — *"you are meant to not win."*
  Six castings differing only by stat block is acceptable while losing is the
  expected outcome. Revisit if it ever becomes routinely winnable.
- **Numismatics** is approved for use. It is a Create-styled currency mod,
  installed and doing nothing since day one.

---

## 7c. ⟡ THE WAVES — captured, deliberately NOT in scope

Ethan, 2026-08-05, on *Shield Hero*: the entire hero structure there is oriented
around **waves** — a shared threat arriving every 30 days that the heroes must
combine against.

It is the answer to the oldest unsolved problem in this design: **the paths do
not need each other** (`17-PATHS-TO-POWER` §0). Exclusivity made them scarce; it
never made them interdependent. Six people can walk six paths and never once have
a reason to speak.

A wave would fix that in a way nothing else on the list does, because it is the
only mechanic that puts a deadline on the *server* rather than on a person. It
would also give the surface a reason to exist — the whole design currently points
down, and a wave arrives on top of you.

The 30-day cadence is not a coincidence worth ignoring either: **the Harvest
absence is already 30 days.** Two clocks of the same length, one personal and one
shared, is a structure rather than a duplication.

**Explicitly out of scope for now** — his call, and the right one. This is its own
design, not a feature of this one. Written here so it is not lost.

---

## 7d. ⟡ HOW DEEP CAN WE GO — the puppet question

Ethan, 2026-08-05: *"part of me just wants to rip the model out and design custom
behavior instead... though we have already built custom behavior i wonder how
deep we can go."*

Worth answering honestly, because the instinct is right and the answer is
"further than you would think, but there is a wall".

**What is already OURS**, none of it Born in Chaos's:
targeting · movement and the distance ring · who it may hurt · whether it can die
· when it appears and vanishes · its stat block · its name and size · its four
phases · what it says · and now where it looks.

**What is still BORROWED:** the model, the texture, the animations, the sounds,
and its native attack AI underneath ours. That is genuinely most of what a player
*perceives*, which is why it still reads as a Born in Chaos mob wearing our
behaviour.

**The wall:** KubeJS cannot remove a mob's goal AI or register a real custom
entity with its own model. Going deeper means one of:

1. **The puppet** — pick the most visually neutral mob in the pack and drive it
   entirely from script. Cheapest, and we already own nearly every input.
2. **A resource pack** — retexture and remodel an existing entity so the borrowed
   half stops being recognisable. No Java, client-side only, and it would change
   the *feel* more than any amount of behaviour work.
3. **A real mod** — the only route to genuine custom AI, and a different project.

⟡ **Not scheduled.** But (2) is the highest ratio of change-in-feel to effort on
the entire roadmap, and it is the one nobody has considered yet.

---

## 8. Open for Ethan

1. **The daily rate** — 1.0/day gives a ~100-day first cycle. Faster?
2. **Do the fragments repeat?** One per kill, drawn from a pool, or a fixed
   sequence that tells one story across five deaths?
3. **The Obsessed** stays outside all of this?

---

## 9. Build order

| rung | what | proves |
|---|---|---|
| **S1** | notoriety = max(level, floor); drop-chance integration | the number behaves against real play |
| **S2** | XP-as-power attribute modifiers | it feels good and does not break L2Hostility |
| **S3** | Six `SPAWNING_ENABLED` flips + name/mark harness | they stop appearing naturally; **summoning still works** |
| **S4** | Unkillable wrapper, phases 1–3, one path | it cannot die by any means |
| **S5** | Helper → Companion (wolf AI) → Absence | the phases read as one creature |
| **S6** | The Harvest: buffed instance, the line, the forced re-choice | losing hurts; winning unsettles |
| **S7** | All six cast; PvP defence; cycle acceleration | — |
| **H1** | The horde retier | horde combat is fun; TPS holds |

S1 and S2 are safe to build now and need nothing decided above.

---

## 10. Risks

- **The flee path must be airtight in phases 1–3.** Enumerate every way an entity
  can die in 1.21, not just melee damage.
- **`SPAWNING_ENABLED` may gate summoning too.** Unverified; the casting depends
  on it. **Test at S3** — flip one, then try to summon it.
- **XP-as-power vs L2Hostility** is no longer a balance risk (§2c) but it is a
  *measurement* one: we should know at what notoriety the deep stops threatening
  a player, because that number is when the stalker has to carry the whole game.
- **Harvest attribution.** The XP wipe fires only on the stalker's kill; when the
  damage source is unclear, fail toward the lesser penalty.
- **Path release on death of the stalker** must not corrupt the claim store —
  `paths.js` guards payouts on the claim, so a half-released path stops paying.
- **TPS under horde density** (§7).

---

## THE BLADE RECAST — 2026-08-11

Ethan, watching his own stalker: *"when pumpkin head spawns he also gains a boss
bar. part of me wonders if he's even a good candidate."*

He was right, and it is measurable. Checked every casting's class in the jar:

| casting | entity | `ServerBossEvent` | summons | mounted |
|---|---|---|---|---|
| Forge | `krampus` | no | no | no |
| Art | `nightmare_stalker` | no | no | no |
| **Blade** | **`lord_pumpkinhead`** | **YES** | no | **yes** |
| Salvage | `dire_hound_leader` | no | **yes** — BabySkeleton, BoneImp, Bonescaller | no |
| Crown | `missioner` | no | MissionaryCharge | no |
| Wall | `mother_spider` | no | **yes** — BloodyGadfly, CorpseFly, Maggot | no |

**Lord Pumpkinhead was the only one of the six carrying a boss bar**, and the only
one besides `sir_pumpkinhead` with a `WithoutaHorse` variant in the jar — meaning
the default form is mounted. He was authored as an *encounter*. A boss health bar
across the top of the screen is the exact opposite of the thing this design wants:
something at the edge of vision that you are never quite sure about.

**Replacement: `fallen_chaos_knight`.** Chosen from a pool of 33 Born in Chaos
entities that have no boss bar, no summons and melee behaviour. Clean on every
axis, and a dead duelist is the most direct reading of *The Challenger* for the
path about mastering one weapon. The 600 HP in the table above is imposed by the
`STATS` block at summon time, so the swap does not weaken it.

**Migration is safe without touching the world:** `isStalker()` keys on the
`veldora_stalker_owner` persistentData tag, not on entity type, so any
Lord Pumpkinhead still standing is recognised and culled by the ordinary sweep.

**One line of Ethan's whisper table is now orphaned** — the Blade pool contains
*"His horse wants to race you. The rider has motion sickness"*, and the knight has
no horse. Left in place deliberately: those lines are Ethan's own writing and are
his to rewrite.
