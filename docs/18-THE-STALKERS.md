# The Stalkers — notoriety, anger, and the thing that owns you

**Status: DESIGN, first pass. Written 2026-08-05 from Ethan's spec.**
Nothing here is built. Ethan's call on every number.

---

## 0. The spec

> Depending on the path you choose, you get a specific stalker adjacent to your
> role. Each stalker only focuses and targets you, in special ways. You cannot
> kill them — they run off before you do, and despawn. It's exp based: the more
> exp you get, the more it increases mob drop chances **and** the stalker's
> anger, leading to an attack after a set amount of days. Dying decreases exp by
> roughly 5. A stalker death eats all of the exp.

---

## 1. Why this is the right spine

Everything built so far gives the player things. The paths give throughput,
verbs, lethality, bodies. The drops give materials. The advancements give
direction. **Nothing yet takes anything away**, which is why the pack reads as
"vanilla with worse mobs" — the danger is ambient, so it is noise.

This design makes one number do both jobs:

> **The number that makes you rich is the number that makes it angry.**

That is the whole system, and it is worth more than any content we could add,
because it turns a flat 11% drop roll into a **decision the player keeps making**.
Farm hard and get paid, and something walks toward you. Lie low and stay safe and
poor. There is no dominant strategy, which is the definition of a live choice.

It also fixes the horror problem structurally rather than by tuning. The friend's
complaint — *"the fucking ghost shit"* — was never about horror. It was about
**randomness without authorship**. Notoriety makes every appearance *earned*, and
an earned scare is the one he already adopted as player 5.

---

## 2. NOTORIETY — the number

A per-player integer on player persistent data. Starts at 0.

| event | change |
|---|---|
| every **5 vanilla XP levels** earned | **+1** |
| any death | **−5** |
| death **caused by your own stalker** | **→ 0** |

Scaling XP levels by 5 is deliberate. Raw levels arrive at roughly 30/hour of
active play, which would make −5 meaningless within a night. At 1-per-5, a death
costs about **50 minutes of progress** — enough to hurt, not enough to quit over.

Notoriety never decays with time. Only death removes it. It is a record of what
you have taken, and the only way to clean the record is to be made to pay.

### 2a. What it buys — drop chance

The existing depth-tiered path drops in `paths.js` are a flat 11%. They become:

```
dropChance = 0.08 + 0.002 × min(notoriety, 100)
```

| notoriety | drop chance |
|---|---|
| 0 | 8% |
| 15 | 11% ← today's feel, now the *early* game |
| 50 | 18% |
| 100+ | 28% (cap) |

Today's tuning is preserved as the starting condition and then grows 3.5×. The
cap exists so notoriety cannot be farmed into absurdity — past 100 it buys you
nothing but anger, which is a good trap to leave open.

### 2b. What it costs — anger

```
anger += notoriety / 10     — once per in-game day, ONLINE days only
```

No flat base term. **You are not hunted until you are worth hunting**, so a new
player, or one who lost everything to a Visit, gets genuine peace.

| notoriety | anger/day | days to a Visit |
|---|---|---|
| 10 | 1.0 | 100 — effectively never |
| 25 | 2.5 | 40 |
| 50 | 5.0 | 20 |
| 75 | 7.5 | 13 |
| 100 | 10.0 | 10 |
| 150 | 15.0 | 7 |

---

## 3. ANGER — the ladder

Anger is not a countdown to one event. It is a **presence that thickens**, so the
player can feel it coming and choose to spend down or lie low.

| anger | stage | what it does |
|---|---|---|
| 0–24 | **Dormant** | nothing |
| 25–49 | **Aware** | ambient only — its sound, at night, when you are alone. Never rendered. |
| 50–74 | **Watching** | spawns 24–40 blocks out, stands, faces you, despawns if approached |
| 75–99 | **Closing** | spawns 12–20 blocks out, follows, **does not attack**, flees if struck |
| 100 | **THE VISIT** | it engages |

**After a Visit, anger resets to 0. Notoriety does not.** So the cycle repeats,
and it repeats faster every time, because the thing that sets the pace is what
you have accumulated. A rich player lives under a shortening fuse.

**Display.** `/path` shows notoriety as a precise number — it is your reward
stat and you should be able to plan against it. Anger shows as **words, never a
number**, because a progress bar is not frightening:

> *It has not noticed you.* → *Something is aware of you.* → *You are being
> watched.* → *It is close.* → *It is coming.*

---

## 4. The rules of a stalker

Five invariants. If any one of them breaks, the illusion is gone permanently and
the mob becomes just another mob.

1. **It cannot die.** Below 30% health the incoming damage is *cancelled*, it
   screams, and it leaves. It must also be immune to void, fire, fall,
   suffocation, `/kill`, and chunk-unload death. **If a stalker ever dies once,
   every player learns it is killable and the system is over.**
2. **It is yours.** It targets only its owner, and cannot damage anyone else.
3. **Friends can help.** Others *can* damage it — that is how helping works. They
   drive it to the flee threshold faster. They just cannot finish it. This keeps
   Ethan's "I may need some help" true without making it farmable.
4. **It pays nothing.** No loot, no XP. The moment a stalker drops anything, it
   stops being a predator and becomes a resource.
5. **It leaves clean.** On flee: sound, invisibility, teleport out, discard. No
   corpse, no ragdoll, nothing to inspect.

---

## 5. The casting — six paths, six stalkers

All entity IDs below are **verified present** in the installed jars.

| path | stalker | entity | why it is adjacent |
|---|---|---|---|
| **Forge** — industry | Diamond Termite | `born_in_chaos_v1:diamond_termite` | it eats built blocks. The one path whose power *is* its base gets the thing that unmakes bases. |
| **Art** — magic | Spirit of Chaos | `born_in_chaos_v1:spiritof_chaos` | answers magic with magic; the Art's own register turned against it |
| **Salvage** — guns | Skeleton Demoman | `born_in_chaos_v1:skeleton_demoman` | the one who lives by ordnance is hunted by ordnance |
| **Blade** — martial | Damned Templar | `grim_and_bleak:damned_templar` | a duelist you are not allowed to beat — the cruellest possible fit for the path built on winning fights |
| **Crown** — command | Bonescaller | `born_in_chaos_v1:bonescaller` | a rival summoner. It brings bodies too, and yours are not special. |
| **Wall** — defence | **The Knocker** | `the_knocker:knocker` | **it knocks on your door.** |

**The Knocker is the best fit in the pack and it is already built for this.** It
has `knockerstalk` and `knockerstalklooked` variants — stalk AI and a
looked-at-response — and **zero natural spawns**, so it is already a director
rather than ambience. It needs almost nothing from us.

⟡ **Forge is the weakest casting.** Diamond Termite is thematically right but
mechanically a block-eater, which may read as griefing rather than dread.
Alternate: `rottencreatures:undead_miner` — an industrialist haunted by the
labour that industry used up. Ethan's pick.

⟡ **Held in reserve**, all verified: `born_in_chaos_v1:nightmare_stalker`,
`scarlet_persecutor`, `lifestealer` (it has a `lifestealer_true_form` — a
built-in second phase, ideal for a late escalation), `fallen_chaos_knight`,
`door_knight`; `grim_and_bleak:watcher`, `gate_guardian`, `night_abomination`,
`clone`; `rottencreatures:immortal`, `glacial_hunter`.

---

## 6. What this does to Born in Chaos

Ethan: *"no born in chaos is bulk."* Correct — 86 entities and 45 natural spawn
entries at weights up to 35, of which our rebalance datapack had caught six.

**But the cut is its spawns, not the mod.** Four of the six stalkers above are
Born in Chaos entities. So:

> Born in Chaos stops being a spawn firehose and becomes the **casting couch**.

One In Control rule denies every natural Born in Chaos spawn. All 86 entities
stay available for summoning. We lose the noise and keep the bestiary — and the
mod finally earns its place, because a hand-placed Bonescaller that came for
*you* is worth more than forty that wandered in.

---

## 7. Melee up, ranged down — and why it is one rule, not two

Ethan suggested increasing melee mobs and decreasing ranged ones. **One rule
does both**, because Minecraft's hostile mob cap is a fixed budget: a denied
spawn attempt frees the slot, and the next attempt fills it. **Denying ranged
spawns is automatically a melee increase.**

It is also right for the paths, not just for feel. Ranged mobs punish the Blade
(no reach) and reward Salvage (the one path already finished). Thinning them
sharpens exactly the denials the paths are built on, and it makes a Forge
player's civilian-ness frightening at the range where it should be.

⚠️ **Cost:** skeletons are the pack's main bone and bonemeal source. A 50% cut
halves that supply. Flagged, not blocking — but if farms start starving, this is
why.

---

## 8. Open questions for Ethan

1. **Forge's stalker** — Diamond Termite (eats your base) or Undead Miner?
2. **Does anger accrue offline?** Recommend **no**. "It waited a week" is great
   fiction and a miserable login.
3. **Is a Visit survivable by running?** Recommend **yes** — fleeing indoors,
   into water, or to another player should work. An unavoidable wipe teaches
   people to stop earning, which kills the loop we just built.
4. **Should the Obsessed stay independent?** It is the one everybody likes. I
   would **not** fold it into this system — leave it as the wildcard that belongs
   to nobody, so the pack has one horror that is not a mechanic.
5. **Notoriety floor after a Visit** — straight to 0, or to 25% so a veteran is
   not returned to day one?

---

## 9. Build order

Gated, each rung measurable on its own.

| rung | what | proves |
|---|---|---|
| **S1** | Notoriety counter + drop-chance integration. No stalkers. | the number tracks, persists, survives restart |
| **S2** | Anger accumulator + `/path` display. No spawns. | the curve paces correctly against real play |
| **S3** | Stalker wrapper on **one** path — unkillable, owner-locked, flees clean | the five invariants hold under abuse |
| **S4** | The full ladder: Aware → Watching → Closing → Visit | escalation reads as dread, not as bugs |
| **S5** | All six cast, tuned | — |

---

## 10. Risks

- 🚨 **The In Control deny may also block our summons.** In Control filters
  `FinalizeSpawn`. Whether a KubeJS-spawned entity passes through that hook is
  **unverified** — and if it does, the same rule that silences Born in Chaos will
  silence four of the six stalkers. **Must be tested at S3, before any casting
  work.** This is the single most likely way this design fails quietly.
- **Attribution of death.** "Killed by your stalker" must be distinguished from
  every other death, or the wipe fires wrongly. Read the damage source, and
  fail toward the *lesser* penalty when unsure.
- **The flee path must be airtight** — see invariant 1. Enumerate every way an
  entity can die in 1.21, not just melee damage.
- **Offline anger and day counting.** Anger ticks per in-game day; store the last
  processed day, never a wall-clock timer, or a long night breaks the pacing.
