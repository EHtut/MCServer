# 68 — The gameplan: retiring the world and everything that rides with it

> **STATUS: DRAFT.** Assembled 2026-08-29 from the session that began *"lets just take
> this opportunity to retire the existing world."* **Zero code written from this doc.**
>
> This is the **build order**, not a wish list. Where something is already decided it
> says so and links the ruling; where it is not, it is in §0 and it blocks.

---

## 🔑 THE SPINE: the reset is a ONE-SHOT, and it is the deadline

Every worldgen decision has to be made **before** the world is generated. Add a tree
mod afterwards and its trees appear only in chunks nobody has walked — you get a visible
seam through the world forever.

So the whole plan sorts into exactly two buckets:

| | |
|---|---|
| **BEFORE the reset** | anything that changes terrain, biomes, structures, or world height |
| **ANY TIME** | everything else — voice, mechanics, cosmetics, NPCs, quality of life |

⭐ **That bucket line is the single most useful thing in this document.** Most of what
follows is in the second bucket and is therefore not urgent, which means the reset is
gated on a much shorter list than it looks.

---

## §0 🔴 DECISIONS THAT BLOCK — nothing generates until these are answered

### 0.1 ✅ CLOSED 2026-08-29 — the dimensions STAY, and are reframed

Both merge candidates failed on their mechanics (`66`): One Dimension generated a
correct world but threw 88 Distant Horizons LOD-lighting exceptions; **Tectonic Layers
could not generate a chunk at all** — an NPE in Biolith's noise sampler inside
`fillBiomesFromNoise`, and Biolith is Regions Unexplored's biome API, so it is not
removable.

**Ruled: keep the Nether and the End.** Create's mid-game is safe, blaze rods and
elytra stay reachable, and nothing has to be rebuilt.

⭐ **And the reframe makes it the better answer rather than a concession** — see `69`.
Ethan: *"we can add an ambient line of how wrong those dimensions feel and you don't
belong here."* A Nether you cannot reach says nothing; a Nether you **can** reach, which
tells you that you are trespassing, states the thesis out loud. **The gods' world is
Veldora, and their reach ends at the portal.**

The "otherworldly places" half of the original goal is served instead by **biomes** —
Terralith and Nyctophobia — which arrive through the machinery Regions Unexplored
already runs. No custom chunk generator, no codec, no biome source, no height change:
none of the three things that broke today.

🔴 **One thing still to test before generating:** Terralith and Tectonic both reshape
overworld terrain, and Regions Unexplored is already doing a third version of that job.
**Three worldgen mods composing is exactly the shape that has failed twice today.**

### 0.2 🔴 REVERSED 2026-08-29 — `min_y` goes BACK to −64

> Ethan: *"for min y, yea move it back to its original."*

The staged `-128` is dropped. `69` addendum 2 measured why it never mattered: the world
already generates to **−592** regardless of that setting, and the earlier measurement
that appeared to justify it was taken against a world from a previous session.

⭐ **And the goal it served moved.** The depth was never shallow, only empty — and rather
than fill it, the danger relocates to **the night** (`70`). No worldgen change at all.

### ~~0.2 RULED — Tectonic stays at `min_y: -128` as staged~~ (superseded)

Accepted with the side effect known: the band **−40 to −63 is nearly solid**, because
the taper moved down with the floor.

⭐ **That band is arguably a feature, not a cost.** It puts a dense barrier between the
ordinary cave layer and the deep — which is exactly the boundary Wall's depth-diving and
Art's entry condition both want to mean something. Crossing it should feel like work.

⚠️ It also composes with §0.1: One Dimension placed its Nether ceiling at **−129**,
directly beneath this floor, with zero gap. Whatever mechanism lands, that is the seam.

### 0.3 Two remaining `chosen` questions (`67`)

Neither blocks generation. **Blade 500 · Wall a pathed player · Art the deep speaker's
introduction, 50 levels, she takes all of them · Salvage no-upside deals · Forge a long
cooldown, timer per prompt** are all ruled.

Left: **which clock Wall's 30 days uses** (`fall.js` counts world days, `ranks.js`
counts played sweeps online-only — 30 world days pass while you are logged out, so
played time is the fairer measure and is the working default until told otherwise), and
**what a godless early game looks like** now that every route got materially harder.

---

## §1 ⚠️ FIRST, AND BEFORE ANYTHING ELSE: verify the eleven

**Eleven files have been deployed since 2026-08-23 and have never been loaded.** The
server booted at 17:21:53 that day and everything deployed from 17:23 onward missed it.
`[sound]`, `[wallaura]` and `[nemesis]` appear nowhere in that log.

```
fall.js · blade_voice.js · salvage_voice.js · patron_sound.js · voice.js ·
wall_aura.js · salvage_events.js · paths.js · phase.js · blade_events.js ·
nemesis_tally.js
```

That is roughly two sessions of work — the empty-pool fix (which unblocks **four of
Blade's nineteen events**), the patron sounds, Wall's aura, the band stretch, Salvage's
event kinds and the NUL fix. All harness-green (427 assertions, 13 harnesses); **none of
it has ever run.**

🚨 **`/patronsound` is the first command to run after that boot.** The sound ids cannot
be validated server-side — a fake id and a real one are byte-identical over rcon — so a
silent god is the only way to find a wrong one.

⭐ **Do this on the CURRENT world, before the reset.** Verifying eleven files and
regenerating the world at the same time means any failure has two possible causes.

---

## §2 The mod list — verdicts

### Take, no friction
`simple-hats` · `seasonal-decorations` · `death-count` · `immersive-snow` ·
`ominous-mansions` · `the-day-of-the-beast` · `inventory-pets` ·
`realm-rpg-treasure-balloons`

⭐ **The whimsy is deliberate**, and Ethan has ruled on it: the book series this is based
on *"has a lot of toby fox humor."* Inventory Pets and Treasure Balloons are not tonal
accidents — dread that never breaks is just noise, and the joke is what makes the horror
land.

### Take, with a known cost
| mod | the cost |
|---|---|
| **tetra** | ⚠️ Ruled in: *"tetra is too good to pass up."* It changes what a tool IS, which is exactly why `chosen` moves off item ids (`67`) |
| **tyzs-skills** | the talent-tree pick of the three. NeoForge 1.21.1, 100% data-driven JSON, **KubeJS support**. ⭐ Keep it **small, slow and permanent** against god power that is **large, fast and revocable** — get that backwards and nobody bothers with the gods |
| **minecraft-comes-alive-reborn** | ⚠️ Ethan's call. Motivation is sound (*"the world above isn't dead and i don't like villagers"*) but MCA is a family sim, and marriage-and-children sits badly against ambient horror |

### ⭐ `bountiful` — KEPT, and it should be hers

Ethan, 2026-08-29: *"we can cut daily quests but keep bounty boards."*

🔑 **The distinction that makes this the right call:** a *daily quest* is a treadmill
handed out by nobody, which is exactly what competes with the gods. A **bounty board is
a place in the world** — it sits somewhere, you travel to it, and it can belong to
someone.

⭐ **Give it to Salvage.** She is already the commission god (`salvage_events.js` runs
`commission`, a kill order on the nearest other player, settled for levels and harness).
A board she runs is not a second economy competing with the pantheon — it is her economy
with a physical location, and it is already her voice.

⚠️ **Open, and worth deciding before it lands:** does a *godless* player get to use the
board? If yes, it becomes a natural on-ramp for the long pathless stretch that `67` now
creates. If no, it is a perk of being hers.

### 🔴 NOTHING IS INSTALLED YET — measured 2026-08-29

**Zero of the approved mods are in the pack manifest.** `pack/mods/` holds 275 entries
and the instance holds 218 jars — the same numbers as before this session started.
Everything below is a DECISION, not a deployment. Terralith and Nyctophobia existed only
inside `testgen` and were removed after the test.

⚠️ **This is the honest state and it is easy to lose track of**, because the decisions
have been detailed enough to feel like progress. They are not the same thing.

### ⭐ PARKED FOR LATER — CreatureChat as *custom companions*

Ethan, 2026-08-29: *"remember when i recommended the mod creature chat? What if we used
that to implement actual custom companions?"* — **parked, not rejected.**

🔑 **The reframe dissolves the original objection.** I argued against it because
letting every mob talk makes speech ordinary in a game whose signature is authored
voice. But CreatureChat has **whitelist/blacklist by entity type**, so it can be scoped
to companions alone — and that objection was about ubiquity, not about the technology.

Verified: NeoForge 1.21.1 builds exist (188k downloads, two required deps), it runs
against a **local endpoint via Ollama/LiteLLM** so nothing leaves the machine, `/story
set` gives a global frame, and it already tracks **relationships and past interactions**
— which is the companion mechanic, prebuilt.

**⚠️ The real problem, if it is ever picked up: REGISTER INVERSION.** The gods speak in
fixed authored pools — rare, weighty. A companion on an LLM speaks fluently and
contextually, forever. If the chatty thing is more responsive than the divine thing, the
pantheon becomes the less alive half of the game.

⭐ **The fix is a design rule, not a config:** make the companion *ordinary on purpose*.
Gods are rare and enormous; a companion natters about the cold and the thing that just
bit it. The contrast strengthens both — a god's single line lands harder beside someone
who talks constantly and says nothing.

🚨 **And the hard rule that keeps it safe:** the companion must NEVER speak about the
gods, the paths, or Veldora's lore. An LLM confabulates into gaps and will invent a
pantheon. The `/story` prompt should define what it does **not** know — *"You are an
ordinary person. You have never spoken to a god. You do not know what they want."*
Which is also characterful: everyone else here is as ignorant as you were.

**Unverified, and it decides how far this can scale:** whether per-entity personalities
exist at all. The docs describe a *global* story, not per-entity prompts — if that is
right, every companion shares one character. Fine for one; weak for a village.

**Also unresolved:** a local model in the loop needs a timeout and a mute-fallback, or a
stalled generation becomes a server hitch.

### Deferred — costs nothing to add later
`easy-npc` — touches no worldgen, so it is not a reset decision.

### Recommended against
| mod | why |
|---|---|
| **daily-quests** | ⛔ **CUT 2026-08-29.** The gods already run 45 events including contracts, kill orders, commissions and errands — a daily quest board competes for that slot and is *impersonal*, which is the opposite of the whole design |
| **creaturechat** | the authored voice IS the signature here. 446 drafted lines and twenty-odd docs of canon; letting a small local model give every zombie a line puts a second register in the world and makes speech ordinary. **The gods should be the only things that talk** |
| **heart-crystals** | `power.js` already grants max health scaled by trust. Two ladders to the same stat, and the gods' one is the point |
| **tensura-reincarnated** / **-mysticism** | ⛔ **CUT.** Total conversion — own races, skills, boss gates, dual progression paths, **and its own dimensions**, which contradicts §0.1 |

---

## §3 World feel

**Already installed and doing the work:** Regions Unexplored (tall trees, TerraBlender-
based so it composes with Tectonic) · **Sound Physics Remastered** (reverb and occlusion
— the best ambient-horror tool in the pack, already present) · Naturalist ·
Critters and Companions · Respawning Animals.

**Genuinely missing:** falling leaves · fog and snow visuals · an ambient-sound mod.

### ⭐ Two measured findings that make this cheaper than it looks

1. **Animals are NOT being suppressed by us.** In Control only denies `hostile: true`
   above y=40 — passive spawns are untouched. *"More animals"* is spawn-weight tuning,
   not a bug hunt.
2. **The surface is deliberately empty of hostiles above y=40.** That is the existing
   design, and it makes ambient horror **cheap and safe**: the surface can be made to
   sound terrifying without touching a single spawn rule, because there is nothing up
   there to actually hurt anyone. Dread with no teeth is exactly right when all the
   teeth are underground.

⚠️ Most of this list is **client-side** — everyone re-downloads the pack.

---

## §4 Wall

**Settled: she stays on Goety** (`34` §0b). The Tensura-replacement search is closed —
every honest alternative brought a second level system, and Werewolves is lupine
besides, a poor fit for The Spider.

⭐ **One idea survives the mod that suggested it.** Werewolf transformation is
*involuntary loss of control*, which is the possession mechanic already designed for
her. Build it in KubeJS; do not import it.

**The direction, unchanged from the design conversation:**

* her rank already **starts at MAX and decays** — today that reads as *absence*.
  Possession reinterprets the identical mechanic as her **taking over**
* **depth-diving against her will**, for artifacts, which answers the founding
  complaint that nobody explores — and the Lootr config is already scoped to deep tables
* Goety stays as the **expression**: as she takes over, her spiders arrive to do it for
  you

🚨 **The invariant, and it is not negotiable:** she only ever takes control to do
something **competent and beneficial**. She kills the thing that was about to kill you.
The horror is that *you didn't do it* — never that you lost. Take control to make the
player worse off and it reads as lag or a bug, which is the one thing this design has
consistently refused to do.

**Already built and waiting on §1:** `wall_aura.js` — she wounds and webs to 25% of max
and never kills, so the kill and its drops stay the player's. 31 assertions.

---

## §5 Being chosen (`67`)

Five entry conditions, each an expression of that god's character rather than an
inventory check. **Three numbers ruled:** Blade **500 mobs**; Wall **a pathed player**;
Art **the deep speaker's introduction** (below y0, no sky — the threshold already exists
as `DEPTH_Y`). Salvage's deals ruled: **health, hunger, a bad status effect, no upside,
never items.**

🔴 **One piece needs new machinery, not new wiring:** `speakerFor()` returns null for a
pathless player, so the pathless currently get **no deep speaker at all**. Art's
condition requires that they hear *her*.

---

## §6 Carried work, unblocked, any time

* **446 `[CLAUDE-DRAFT]` lines** across 128 pools awaiting Ethan's pass (`51`)
* **Salvage's register** — her trade voice and her collection voice are audibly
  different people (`7b`)
* **Salvage's five godless pitches** — the hardest writing in the plan. They have to
  convince five times against a reader who is getting suspicious
* **Blade's seven Challenges want rebalancing downward** — his own file flags it
* **The death-position question** — the respawn cut kept death's *cost* but not its
  *position*, and PART I(b) depended on waking where you fell. Never re-litigated
  because the cut was an emergency fix
* **The Lootr config has never been observed working in play**
* **102 commits unpushed** to `origin/main`

---

## The order

```
1. BOOT AND VERIFY THE ELEVEN          ← current world, before anything else
2. ANSWER §0.1 (dimensions)            ← the only true blocker
3. Settle §0.2 (Tectonic taper) and the mod list
4. Install every worldgen-affecting mod
5. GENERATE ONCE
6. Crown → Wall · The Arrival · /path forcereset   ← free with the reset
7. Everything in §6, in any order
```

⚠️ **Steps 1 and 2 are independent** — the verification does not need the dimension
answer, and vice versa. Step 1 can happen tonight.

---

# THE BUILD — chunked, 2026-08-29

## ✅ The mods are IN THE MANIFEST (not yet installed)

`pack/mods/` **275 → 298** entries, `pack/index.toml` **281 → 304**, and
`install_mods.py --dry-run` resolves **304 mods, 239 server-side** (was 218) with no
errors. Every entry is pinned to a sha512 the registry reported.

⚠️ **The instance is still at 218 jars.** Manifest ≠ installed. Nothing has been
downloaded and the live pack has not changed.

### 🔴 FOUR MODS COULD NOT BE ADDED — and the pattern matters

| mod | why |
|---|---|
| **Iron's Arms 'n Artifice** | supports **MC 26.1.2 only** — four majors ahead |
| **Just Enough Guns** | **1.20.1 Forge only**; no NeoForge, no 1.21.x |
| **Ominous Mansions** | **1.21.6+** only — too new |
| **Tetra** | **no 1.21.x at all** — stopped at 1.20 |

🚨 **Two too new, two too old. 1.21.1 is now a narrow window**, and this is the second
time today a wanted mod was unavailable for version reasons. That is a standing tax on
every future mod request, and at some point it becomes a question about the pack's
version rather than about any one mod. **Not a decision to make casually — 304 entries.**

⚠️ **Tetra's loss has a knock-on.** `67` justified moving `chosen` off item ids partly
because *"Tetra changes what a tool IS"*. That reason is gone. **The other reason stands
on its own and was always the better one** — an inventory check is not a character test.

⚠️ **Two entries are pre-release builds**, pinned deliberately because they are the only
1.21.1 builds: `bountiful 8.0.0-beta.2` and `MCA 7.7.36-beta.3`.

---

## The chunks

Each is independently shippable and reversible. **Order is by dependency, then risk.**

### A — verify what already exists · *no new code*

| | |
|---|---|
| **A1** | Boot the current world, load **the eleven**, run `/patronsound`. Confirm `[sound]`, `[wallaura]`, `[nemesis]` banner and Blade's four held events fire. **Falsified if:** any banner is absent, or a god is silent |

⭐ **A1 blocks nothing and nothing blocks it.** It is two sessions of unverified work and
it can be done tonight.

### B — the pack

| | |
|---|---|
| **B1** | `install_mods.py --side server`, boot, read the log. 23 new mods at once. **Falsified if:** boot fails or the log carries new errors. ⚠️ If it breaks, bisect rather than guess — Terralith and Nyctophobia are already proven in `testgen`, so start from the other 21 |
| **B2** | **In Control**: lift the `hostile: true` deny above y=40. 🔴 **Required by D4** — it currently suppresses exactly the spawns the night tide creates |

### C — the world · *the one-shot*

| | |
|---|---|
| **C1** | `tectonic.json` `min_y` back to **−64** |
| **C2** | **Generate.** ⚠️ Everything in B must be settled first |
| **C3** | Free with the reset: Crown → Wall · The Arrival · `/path forcereset` |

### D — the night (`70`) · *the big new system*

| | |
|---|---|
| **D1** | 🔑 **THE KEYSTONE.** Night detection + the god-silencing gate. Blade and Salvage go quiet; Wall, Forge and Art do not. **Touches every god system** — voice, idle, events, sounds, the aura. **Falsified if:** a silenced god speaks at night, or a permitted one goes quiet |
| **D2** | The deep Speaker's introduction on the **30th night** |
| **D3** | Night danger scaling by the highest god's trust. **No inversion** |
| **D4** | The night tide — the tide, on the surface, night-only. **Depends on B2** |
| **D5** | Tide modifiers: pure horde / specialist / miniboss+horde / general |
| **D6** | Minibosses. ⚠️ `supreme_bonecaller` needs the registry probe first; The Taker stays **rare and deliberate** because it is a clue, not a spawn |

🔴 **D1 is the riskiest chunk in the plan.** It is a cross-cutting gate over systems that
currently assume they may always speak. It wants its own harness and a negative control —
prove a silenced god *cannot* speak, not merely that a permitted one can.

⚠️ **Still unsolved and it gates D3's value:** the danger has to reach indoors.

### E — being chosen (`67`)

| | |
|---|---|
| **E1** | Blade — a **lifetime, never-reset** kill counter. ⚠️ Do not borrow the trust counter |
| **E2** | Salvage — five no-upside deals. The **writing** is the work |
| **E3** | Wall — killed by a pathed player, or 30 days godless |
| **E4** | Art — 50 levels, she takes them all. 🔴 **Needs new machinery**: `speakerFor()` returns null for the pathless, so they hear nobody |
| **E5** | Forge — the dialogue tree, long cooldown, per-prompt timer |

### F — voice

| | |
|---|---|
| **F1** | The Nether and End ambient lines (`69`) — **their own channel, no speaker, not `voice.js`** |
| **F2** | Ethan's pass on 446 draft lines · Salvage's register · Blade's Challenge rebalance |

---

## ⚠️ What is still open

* **the indoors problem** (D3/D4)
* **Wall's 30-day clock** — world days or played time
* **a godless early game** — partly answered by the Iron's suite
* **the bounty board** — does a godless player get to use it?
* the **1.21.1 version question** raised by four unavailable mods
