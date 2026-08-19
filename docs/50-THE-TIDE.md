# 50 — The Tide, and the Bickering *(design, 2026-08-18, NOT BUILT)*

> Ethan, 2026-08-18:
>
> *"How dark tide and vermintide works it has straggling mobs as you move through the
> levels then every 30s or so you hear a scream and then music and then a massive wave
> of enemy batters you for like 20 seconds. it's the dopamine rush there.*
>
> *You also get waves while completing objectives. So and my idea of the depth is kinda
> like a rougelike system where you go down fight enemies get loot, escape.*
>
> *We can do the triggers for the wave based on god dialogue."*
>
> *"Another idea. Bickering. Bickering between two gods as dialogue for both of the
> players to hear if there's more than one."*

**Sequenced AFTER the Warning system (docs/49 A) and the current bug pass**, at his
instruction.

---

## 0. Why this is the right answer and the ambience layer was not

The brief before this was "the world feels empty, add ambient life". That would have
been **treating the symptom**. More cows do not make a world feel alive; they make it
feel decorated.

The tide answers the actual complaint — *"outside the gods bothering you it's kinda
empty"* — because it makes **the gods the source of the pressure**. Not more
creatures: a rhythm. Lull, warning, spike, lull. That is a *loop*, and a loop is the
thing the deep currently has none of.

It also converts a liability into the premise. See §1.

---

## 1. 🔴 THE BLOCKER, MEASURED: the deep is an empty void

Before anything is designed on top of the depths, this has to be true and it is not.

`tools/genq.py air` and a direct read of the chunk sections, 2026-08-18:

```
  -64..-49     36.37 per mille open      (normal deep caves)
  -80..-65   1000.00 per mille open      air=532480
  -96..-81   1000.00 per mille open      air=532480
 -112..-97   1000.00 per mille open      air=532480
-128..-113   1000.00 per mille open      air=532479
```

**Everything below y−64 is 100% air.** And this is not a reading artefact — sections
−5 to −8 are PRESENT in the chunk data and their entire block palette is
`minecraft:air`, 144 entries, no stone, no deepslate, **no bedrock**.

`mcserver_depth` successfully moved the world floor from −64 to −128 and **nothing
generates in the new space.** The corroborating measurements all agree:

| measurement | result |
|---|---|
| living entities below y−64 (1165 chunks) | **1** |
| hostiles below y−64 | **0** |
| structure markers below y−64 (earlier audit) | **0 of 967** |
| `spawner.json` tier 2, targeting −128..−61 | produces nothing — `validspawn` has nowhere valid |

So "the caves are pretty devoid of mobs" has a floor under it: **the deepest third of
the world is a hollow shell.**

### ⭐ Which is exactly what a roguelike floor wants

This is the good news, and it is why his idea fits better than it should. A Darktide
run does not happen in wandering natural caves — it happens in **a built space with a
route through it**. The Abyssal band is currently 64 blocks of empty, world-wide,
already-generated volume with nothing in it to preserve.

**It is not a bug to fix before building the tide. It is the arena, unbuilt.**

Two ways to take it, and they are a genuine fork:

| | approach | argument |
|---|---|---|
| **A** | **Fix worldgen** — make −128..−65 generate real deepslate and caves | the honest world. The design in docs/06 always said "Abyssal: parasites, the worst of it". Cost: a worldgen change on a live world only affects NEW chunks, so the explored area stays hollow |
| **B** | **Build the arena** — the void becomes a deliberate constructed layer, entered by a descent point, laid out as a run | fits the roguelike frame exactly, works on already-generated chunks, and makes "escape" mean something. Cost: it is level design, not a config change |

⚠️ **A does not fix the world they are already playing in.** Worldgen applies at chunk
generation; the 29 region files already written stay hollow forever. That alone
probably decides it.

---

## 2. The loop, as Ethan described it

```
    stragglers . . . . . . . SCREAM . . . MUSIC . . . [ 20s WAVE ] . . . lull . . .
    ~30s of pressure          the tell     the dread     the payoff      the breath
```

Four beats, and **each one already has a home in this codebase**:

| beat | what it is | what already exists |
|---|---|---|
| **stragglers** | thin ambient pressure so the lull is not silence | `spawner.json` tiers · `spawn_pressure.js` density |
| **the scream** | ⭐ **the god's line** — the trigger, per Ethan | `deep_speaker.js`, and it only speaks below y−64 |
| **the music** | dread between the tell and the hit | `/playsound`, server-side, no client mod needed |
| **the wave** | ~20s of real threat | `spawner.js` `wave()` — **and its placement was blind until 2026-08-18** |

### ⭐ The Deep Speaker IS the scream — this is the whole design

`deep_speaker.js` already: fires **only below y−64**, speaks in a voice that is *not*
your god, and exists to say "you are out of earshot now". Its own header calls it *the
best mechanic in the project*.

Make his line **the herald of the wave** and it stops being flavour. The player learns,
in about two runs, that when the grey voice speaks **something is coming** — and after
that every line he says lands as dread whether or not a wave follows.

**That is a trigger on a system that is already built, already gated to the right
depth, and already characterised.** It is the cheapest expensive-feeling thing
available.

⚠️ It also means the Speaker's pools split in two: lines that **precede a wave** and
lines that do not. Never mixed, or the tell is worthless.

### ⚠️ The wave depends on a fix that is one day old

`spawner.js` summoned at `~dx ~ ~dz` — the player's exact Y, no ground check — until
today. A 20-second wave of 8 mobs in a cave would have half-failed silently, exactly as
Ethan's `fallen_chaos_knight: asked 1, measured 0` did. `findSpot()` landed 2026-08-18
and **the tide is unbuildable without it.**

---

## 3. 🚨 The adaptation that matters: a tide must END

Darktide's loop works because a mission is thirty minutes with an authored arc and then
it is **over**. Minecraft is open-ended. A scream every 30 seconds forever is not a
dopamine loop, it is tinnitus — and the same fatigue Ethan already reported once
("my brother keeps getting 'im sending people to fight you' every 10-20 minutes").

**His own framing already solves it: *"go down, fight enemies, get loot, escape."*
The tide is bounded by THE RUN.**

```
    descend past the threshold   ->   the tide starts, quiet
    time / depth / kills          ->   it escalates, waves get bigger
    you leave, or you die         ->   it ENDS, and resets
```

That gives the three things a loop needs and open-ended pressure cannot have:

- **a beginning** the player chooses (descending is opting in)
- **an escalation** they can feel
- **an exit they control**, which is what makes the loot a decision rather than a drip

### The extraction has to cost something

If escape is "dig straight up", there is no run, only a dungeon with extra steps.
Options, unranked: the way out is the way you came · the tide follows you up for a
while · a descent point that must be returned to. **Open ruling.**

⭐ **And this is where the greed goes.** A roguelike run is a series of "one more
room?" decisions. Deeper waves paying better is what makes staying a gamble instead of
a chore — and it plugs straight into the `drops` coefficient work already done.

---

## 4. ⭐ Bickering — and it is the SAME primitive as docs/49 §4

> *"Bickering between two gods as dialogue for both of the players to hear if there's
> more than one."*

docs/49 §4 already specified this exact machine for the Argument (mechanic D):

- a **broadcast** — `voice.say` is per-player and **no broadcast exists anywhere in the
  codebase**, verified
- an ordered list of `(god, line)` pairs
- each rendered in that god's own colour, which does the speaker attribution for free —
  no name tags, which suits *"they don't actually see you for you"*
- the ritual's ~2.5s line gap for pacing
- **never** `ritual.begin` — nobody's control is taken for a conversation they are not in

**So bickering and the Argument are one primitive with two triggers**, and that is the
whole finding:

| trigger | tone | source |
|---|---|---|
| **the Grudge fires** (docs/49 §4) | an accusation before a reprisal | your champion killed ×4 |
| **ambient bickering** (here) | pettiness, contempt, old grievance | two champions online, occasionally |

Build the broadcast once. The Argument is the loud version, bickering is the quiet
one, and the quiet one is what makes the loud one land — if the gods only ever speak to
each other in anger, the anger has no baseline to be measured against.

### 🔑 Bickering is the answer to "empty" on the SURFACE

Worth stating plainly, because it makes the tide unnecessary up top. The surface is
deliberately safe (the two-realm thesis), so it cannot be filled with threat without
breaking the design. **It can be filled with talk.** Two gods sniping at each other
while you farm is ambient content that costs no mobs, no spawns, no danger, and no
change to In Control.

⚠️ **It only fires with 2+ players**, which on this server is the common case but not
the guaranteed one. A solo player must not be able to tell it exists and is missing —
so no "the gods are arguing somewhere" teaser.

---

## 5. What this rides on

| need | status |
|---|---|
| wave spawning with real placement | ✅ `spawner.js` + `findSpot()` — **2026-08-18, untested live** |
| a voice that only speaks in the deep | ✅ `deep_speaker.js` |
| per-god colour | ✅ `voice.js` `COLOUR[god]` |
| depth banding | ✅ `coefficients.js` depth curve · `godevents.isUnderground` |
| deeper = better loot | ✅ `paths.js` tiers by death height |
| sound | ✅ `/playsound`, server-side |
| **a floor to fight on below y−64** | ❌ **§1 — the void** |
| **broadcast** | ❌ the one new primitive, shared with docs/49 §4 |
| **run state** (in a run / not) | ❌ new, and it is the spine of §3 |

---

## 5b. ⭐ The cadence and the herald — RULED 2026-08-18

> Ethan: *"For the waves lets do every 5-10 minutes or, announced by god dialogue if
> they can hear you and speaker dialogue if too deep."*

**Every 5–10 minutes**, and the announcement source is decided by DEPTH — which means
the herald is not one voice, it is whichever voice can still reach you:

| where | who announces the wave | already exists |
|---|---|---|
| above y−64 | **your own god**, in their own register | `voice.say(p, god, tag)` |
| below y−64 | **the Speaker** — your god cannot reach you | `deep_speaker.js`, gated to exactly this depth |

⭐ **This is better than "the Speaker is the scream" from §2.** The wave becomes a
thing the whole pantheon does, and the DEPTH decides who tells you — so descending
changes not just the danger but *who is watching you meet it*. The gods keep their
character down to the cutoff and then something else takes over the job, which is
`deep_speaker.js`'s entire premise made mechanical.

⚠️ **Both need a new pool, and both must be separable from ordinary chatter.** A line
that heralds a wave and a line that does not cannot come from the same pool, or the
tell is worthless. `warn_wave` / `deep_warn_wave`.

⚠️ 5–10 minutes is a *lot* on the low end. Sustained over an hour that is 6–12 waves,
and the fatigue Ethan already reported once ("every 10-20 minutes") was for something
far cheaper than a 20-second assault. **Recommend the interval only runs while a run
is active (§3)** — inside a descent it is 5–10 min; on the surface it is not running
at all.

## 5c. The Deep Speaker needs an INTRODUCTION — ruled 2026-08-18

> Ethan: *"they should have at least an introduction cutscene for the deep speaker
> since this is your antagonist essentially."*

**He is right and this is a gap, not a nicety.** The Speaker is currently met by a
chat line arriving from nowhere the first time a player is below y−64 and the roll
lands. The first meeting with the antagonist is indistinguishable from his hundredth.

`ritual.js` already does exactly this job — it takes control, speaks, and gives it
back — and `introductions.js` (I1/I2) already uses it for a once-per-player scene.
So the machinery is built; what is missing is **a once-ever scene keyed to first
descent below the cutoff**, in place of a line.

⚠️ **ONCE EVER, and it must survive.** `introductions.js` already solved the same
problem — persistent flag, checked on login, because a scene that re-fires is worse
than one that never did. Reuse that pattern rather than re-deriving it.

⚠️ And it is the ONE place the ritual is safe at depth: a player who has just arrived
below −64 is not yet in a fight. Every later Speaker line must stay chat-only (§5).

## 6. Open rulings

1. **§1's fork** — fix worldgen, or build the arena? Worldgen will not repair the
   already-generated world, which probably settles it.
2. **What bounds a run** — time, depth, kills, or an objective?
3. **What extraction costs.** If digging up is free there is no run.
4. **Does the tide exist above y−64 at all**, or is it strictly the Abyssal's mechanic?
   (Recommend: strictly deep. It gives the descent a character nothing else has.)
5. **Music** — vanilla `/playsound` cues, or does this want real tracks? Ethan has
   linked Skyrim/Tamriel packs before and pulled back to "just get the server online".
6. **Bickering cadence.** It is cheap and therefore easy to overdo; the surface being
   quiet is also a feature.
7. **Does bickering need writing per PAIR?** docs/49 §4 says 20 ordered pairs at full
   scope is too much to commission — the answer there was a generic
   `argue_accuse`/`argue_answer` per god plus hand-written exceptions. Same applies.

---

## 7. Sequencing — after the Warning and the bug pass

| | chunk | why in this order |
|---|---|---|
| 0 | *(the Warning, docs/49 A — already built, unrestarted)* | |
| 1 | **the broadcast primitive** | smallest, unblocks bickering AND docs/49 §4 |
| 2 | **bickering** | pure content on top of 1, zero risk, and it answers "empty" on the surface immediately |
| 3 | **§1's ruling + the floor** | nothing below can be tested until there is somewhere to stand |
| 4 | **run state** | in-a-run / not, with a real beginning and end |
| 5 | **the tide** | scream → music → wave, on the Speaker |
| 6 | **extraction + escalating loot** | the greed loop that makes it a roguelike rather than a gauntlet |

⭐ **1 and 2 are worth doing even if the tide never happens.** They are cheap, they
need no world changes, and they directly answer the complaint that started all of this.
