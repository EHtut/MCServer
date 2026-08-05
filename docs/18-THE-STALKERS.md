# The Stalkers, the Angels, and the Horde

**Status: DESIGN, second pass. Written 2026-08-05 from Ethan's spec.**
Nothing here is built. Ethan's call on every number.

---

## 0. The spec

> Each path gets a **stalker** adjacent to its role, targeting only that player.
> It cannot be killed — it runs off before you kill it, and despawns. EXP raises
> both drop chance **and** the stalker's anger, leading to an attack after a set
> number of days. Death −5 EXP; death to your own stalker wipes it.
>
> Each path also gets a **guardian angel**, drawn from the same horror roster and
> *arguably scarier*. It scales **inversely** with EXP — common at a distance
> when you are poor, rare when you are rich. Its job is to keep the hero alive.
> It cannot die.
>
> And the mob roster is retiered for horde combat: **melee chaff** in numbers at
> reduced health, **ranged units made rare and specialised**. Darktide/Vermintide.

---

## 1. Why this is the right spine

Everything built so far *gives* — throughput, verbs, lethality, bodies, drops,
direction. Nothing takes. That is why the pack reads as "vanilla with worse
mobs": the danger is ambient, so it is noise.

One number now does both jobs:

> **The number that makes you rich is the number that makes it angry.**

Farm hard and get paid, and something walks toward you. Lie low and stay safe and
poor. Neither dominates, so the choice stays live.

It also fixes the horror complaint structurally. *"The fucking ghost shit"* was
never about horror — it was **randomness without authorship**. Notoriety makes
every appearance earned, and an earned scare is the one he adopted as player 5.

---

## 2. NOTORIETY — the number

Per-player, on persistent data. Starts at 0.

| event | change |
|---|---|
| every **5 vanilla XP levels** earned | **+1** |
| any death | **−5** |
| death **caused by your own stalker** | **→ 0** |

Levels arrive at ~30/hour, so scaling by 5 makes a death cost ~50 minutes —
enough to hurt, not enough to quit over. Notoriety never decays with time. Only
death removes it.

### 2a. What it buys

```
dropChance = 0.08 + 0.002 × min(notoriety, 100)
```

| notoriety | 0 | 15 | 50 | 100+ |
|---|---|---|---|---|
| drop chance | 8% | **11%** ← today | 18% | 28% (cap) |

Today's tuning becomes the *early* game and grows 3.5×. Past 100 it buys nothing
but anger — a good trap to leave open.

### 2b. What it costs

```
anger += notoriety / 10     — per in-game day, ONLINE days only
```

No base term: **you are not hunted until you are worth hunting.**

| notoriety | 10 | 25 | 50 | 75 | 100 | 150 |
|---|---|---|---|---|---|---|
| days to a Visit | 100 | 40 | 20 | 13 | 10 | 7 |

---

## 3. ANGER — the ladder

Not a countdown to one event. A presence that thickens, so the player feels it
coming and can choose to spend down or lie low.

| anger | stage | what it does |
|---|---|---|
| 0–24 | **Dormant** | nothing |
| 25–49 | **Aware** | ambient only — its sound, at night, when alone. Never rendered. |
| 50–74 | **Watching** | 24–40 blocks out, stands, faces you, despawns if approached |
| 75–99 | **Closing** | 12–20 blocks out, follows, **does not attack**, flees if struck |
| 100 | **THE VISIT** | it engages |

**After a Visit anger resets; notoriety does not.** The cycle repeats, faster
each time. A rich player lives under a shortening fuse.

🎯 **Born in Chaos already ships the telegraph.** It registers `minibosseswarning`
and `stalkerwarning` entities — a built-in "something is coming" cue. The Aware
and Watching rungs should use them rather than inventing a new signal.

**Display.** `/path` shows notoriety as a number — it is your reward stat and you
should plan against it. Anger shows as **words, never a number**:

> *It has not noticed you.* → *Something is aware of you.* → *You are being
> watched.* → *It is close.* → *It is coming.*

---

## 4. The rules of a stalker

Five invariants. Break one and the illusion is gone permanently.

1. **It cannot die.** Below 30% health, incoming damage is *cancelled*; it
   screams and leaves. Also immune to void, fire, fall, suffocation, `/kill`,
   chunk-unload. **If a stalker dies once, everyone learns it is killable.**
2. **It is yours.** Targets only its owner; cannot damage anyone else.
3. **Friends can help.** Others *can* damage it — that is how helping works, and
   it drives the flee threshold faster. They just cannot finish it.
4. **It pays nothing.** No loot, no XP. The moment it drops anything it stops
   being a predator and becomes a resource.
5. **It leaves clean.** Sound, invisibility, teleport out, discard. No corpse.

---

## 5. The casting — Ethan's, 2026-08-05

Minibosses, not chaff. *(Diamond Termite is dead — it is the immortal snail, and
it spawns naturally. Skeleton Demoman is just a creeper.)*

| path | stalker | entity | reasoning |
|---|---|---|---|
| **Forge** | Krampus | `born_in_chaos_v1:krampus` | the thief of Christmas. The Forge builds; Krampus takes. |
| **Art** | Nightmare Stalker | `born_in_chaos_v1:nightmare_stalker` | it lives in the realm of nightmare, the Art's hero in the realm of dreams. They cannot coexist. |
| **Blade** | Lord Pumpkinhead | `born_in_chaos_v1:lord_pumpkinhead` | a challenger, here to test the mettle of a would-be hero |
| **Salvage** | Dire Hound Leader | `born_in_chaos_v1:dire_hound_leader` | the wolf hunts its prey. Simple. |
| **Crown** | Missioner | `born_in_chaos_v1:missioner` | the false king, lord of the dead. The Crown's hero is an intruder in his domain. |
| **Wall** | ⟡ **open** | — | see below |

**Verified:** all five exist. "Missionary" resolves to **`missioner`** (the boss);
`missionary_raider` is its adds, which is a useful distinction — the Crown's
stalker can arrive *with a retinue*, which is exactly the right insult to a path
built on having one.

### 🚨 Four of the five spawn naturally

Ethan's own objection to Diamond Termite — *"they are naturally spawning so it
wouldn't work"* — applies to most of his picks:

| entity | natural? |
|---|---|
| `krampus` | **yes**, weight 2 |
| `nightmare_stalker` | **yes**, weight 4 |
| `dire_hound_leader` | **yes**, weight 4 |
| `missioner` | **yes**, weight 4 |
| `lord_pumpkinhead` | **no** — summon-only already |

**The fix is one surgical rule, not a mod cut.** In Control denies natural spawns
of exactly these five entities. Born in Chaos keeps all 86 entities and its whole
horde role; those five simply stop wandering in, so the only Krampus in the world
is *yours*. This is the correct version of the mod-wide deny that was reverted.

⟡ **The Wall needs a stalker.** Two candidates:
- `born_in_chaos_v1:scarlet_persecutor` — **not naturally spawning**, obeys the
  miniboss rule, and "the persecutor" is precisely the thing a fortress cannot
  keep out.
- `the_knocker:knocker` — thematically unbeatable (**it knocks on your door**),
  already ships stalk AI and a looked-at response, and has zero natural spawns —
  but it is ambience, not a miniboss, so it breaks the rule Ethan just set.

---

## 6. GUARDIAN ANGELS — yes, the inversion works

Ethan asked whether the opposite path's stalker could serve as your guardian.
**It works, and it is the strongest idea in the design**, for three reasons.

### 6a. It fixes the structural fault the paths audit found

`17-PATHS-TO-POWER` §0: *"None of them touch each other."* Seven ladders in a
room is not a ladder. If your guardian is your ally's tormentor, the paths become
**socially legible** — you recognise the thing that saves you as the thing that
hunts him. Two players stand in the same room with the same creature meaning
opposite things. Nothing else on the roadmap connects the paths this cheaply.

### 6b. It explains the canon

The Veldora canon already says:

> Adventurers **cannot die**. They can only be broken, over and over.

That has been a rule with no mechanism. **The guardian angel is the mechanism.**
You cannot die because something will not let you — and it is not kind, it is not
yours to command, and it never explains itself. The lore stops being flavour and
becomes a system.

### 6c. The scaling produces the right arc

Guardians are common when poor and rare when rich; stalkers are the reverse. So:

> **The world starts protective and becomes predatory.** You trade a protector
> for a predator, one point at a time, and you do it to yourself.

And because a guardian is *someone else's stalker*, the creature watching over
you at notoriety 5 is the same species that will be hunting your friend at 80.
That is why the angel is scarier than the stalker: it is a preview.

### 6d. The opposition pairs

Each pair is a genuine argument about how power works, so each stalker serves as
its opposite's angel.

| pair | the argument |
|---|---|
| **Blade ↔ Crown** | the hand vs the throne — the one who fights personally against the one who never does |
| **Forge ↔ Art** | mechanism vs will — the two answers to "how is power made" |
| **Salvage ↔ Wall** | the taker vs the keeper |

| your path | your stalker | your guardian |
|---|---|---|
| Forge | Krampus | Nightmare Stalker |
| Art | Nightmare Stalker | Krampus |
| Blade | Lord Pumpkinhead | Missioner |
| Crown | Missioner | Lord Pumpkinhead |
| Salvage | Dire Hound Leader | *(the Wall's stalker)* |
| Wall | *(open)* | Dire Hound Leader |

### 6e. Rules of an angel

1. **It cannot die** — same invariant, same enforcement.
2. **It does not acknowledge you.** No pathing to you, no facing you, no sound at
   you. It kills what is about to kill you and leaves.
3. **It pays you nothing** — its kills drop no loot and grant no XP, or it
   becomes a farming pet and the horror dies instantly.
4. **It intervenes at genuine death-risk only**, not as an escort. Rare, decisive,
   unexplained.
5. ⟡ **Open: does it prevent the death or punish the killer?** Recommend the
   latter — it removes the *threat*, and you survive as a side effect. A thing
   that saves you deliberately is comforting; a thing that destroys what touched
   you is not.

---

## 7. THE HORDE — retiering for Darktide/Vermintide

The pack already has the roster for this; nothing needs adding. Born in Chaos's
45 natural spawns sort almost perfectly into Fatshark's tiers by weight.

| tier | role | examples | change |
|---|---|---|---|
| **Chaff** | horde pressure | `decaying_zombie` w30, `zombie_fisherman` w30, `baby_skeleton` w25, `barrel_zombie` w25, `bone_imp` w25, `zombie_lumberjack` w25, `decrepit_skeleton` w20, `dread_hound` w15, vanilla zombie/husk/spider | **more of them, half health** (In Control `healthmultiply: 0.5`) |
| **Elites** | armoured, break the line | `zombie_bruiser`, `pumpkin_bruiser`, `door_knight`, `mother_spider`, `skeleton_thrasher`, `fallen_chaos_knight`, vindicator, wither skeleton | unchanged |
| **Specials** | rare, specialised, must be answered | `skeleton_demoman` (bomber), `dark_vortex`, `bonescaller` (summoner), `phantom_creeper`, vanilla skeleton/stray/bogged/witch/creeper | **thinned hard**, each one made to matter |
| **Bosses** | rare roamers + the six stalkers | `krampus`, `nightmare_stalker`, `dire_hound_leader`, `missioner`, `supreme_bonescaller`, `lifestealer` | the six stalkers denied natural spawn |

**Half-health chaff is what makes the horde fun rather than exhausting.** A
Vermintide horde is dangerous through *numbers and geometry* — being surrounded,
losing your footing — not through each rat being tanky. Halving chaff health
means a sweep clears three instead of one, so a horde reads as a wave you cut
through, which is the whole feeling he is asking for.

**Density.** Denying specials frees mob-cap budget that chaff fills automatically
— the cap is a fixed budget, so thinning ranged *is* increasing melee. Beyond
that, In Control's `spawner.json` can add chaff spawns above the vanilla cap for
real horde density.

⚠️ **Two costs.** Skeletons are the pack's main bone/bonemeal source, and
thinning them halves that supply. And chaff density is the pack's main TPS risk
with four players — this needs a live TPS check before the numbers go up, not
after.

---

## 8. Born in Chaos stays

Ethan, 2026-08-05: *"no do not cut born in chaos."* The mod-wide In Control deny
has been **reverted**; only `revervox_mod` remains denied.

It was the wrong instrument. Born in Chaos is now doing two jobs at once — it is
**the horde** (§7) and **the bestiary** (§5, five of six stalkers). The only cut
it needs is the five-entity natural-spawn deny, so its bosses stop wandering in
and start being *sent*.

---

## 9. Open for Ethan

1. **The Wall's stalker** — `scarlet_persecutor` (obeys the miniboss rule) or
   `the_knocker:knocker` (thematically perfect, but ambience)?
2. **Does anger accrue offline?** Recommend **no**.
3. **Is a Visit survivable by running?** Recommend **yes** — an unavoidable wipe
   teaches people to stop earning, which kills the loop.
4. **Notoriety after a Visit** — straight to 0, or to 25% so a veteran is not
   sent back to day one?
5. **Does the angel prevent the death, or destroy the killer?** (§6e)
6. **The Obsessed** — leave it out of this system? It is the one everybody likes;
   it may be worth keeping one horror that belongs to nobody and obeys no rule.

---

## 10. Build order

| rung | what | proves |
|---|---|---|
| **S1** | Notoriety counter + drop-chance integration. No stalkers. | the number tracks, persists, survives restart |
| **S2** | Anger accumulator + `/path` display. No spawns. | the curve paces against real play |
| **S3** | Stalker wrapper on **one** path — unkillable, owner-locked, flees clean | the five invariants hold under abuse |
| **S4** | The full ladder, using `minibosseswarning` for the low rungs | escalation reads as dread, not bugs |
| **S5** | Guardian angels on the opposition pairs | the inversion reads as intended |
| **H1** | The horde retier — chaff health, special thinning, density | horde combat is fun; TPS holds with 4 players |

S1–S2 are safe to build now. **S3 must resolve the risk below before any casting
work happens.**

---

## 11. Risks

- 🚨 **In Control may block our own summons.** It filters `FinalizeSpawn`; whether
  a KubeJS-spawned entity passes through that hook is **unverified**. If it does,
  the five-entity deny in §5 will also silence five of six stalkers. **Test at
  S3, before casting.** This is the most likely way the design fails quietly.
- **Death attribution.** "Killed by your stalker" must be distinguished from every
  other death or the wipe fires wrongly. Read the damage source; when unsure,
  fail toward the *lesser* penalty.
- **The flee path must be airtight** — enumerate every way an entity can die in
  1.21, not just melee damage.
- **Angel-as-farm.** If an angel's kills ever pay out, players will bait it. Rule
  6e.3 is load-bearing.
- **TPS under horde density** (§7).
- **Offline anger.** Tick per in-game day from a stored last-processed day, never
  a wall-clock timer.
