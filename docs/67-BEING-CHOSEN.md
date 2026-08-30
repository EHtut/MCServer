# 67 — Being chosen: the five entry conditions

> **STATUS: PARTLY BUILT.** Ethan's spec, 2026-08-29.
>
> | | |
> |---|---|
> | ✅ **E1 Blade** | 500 slain, lifetime — `slain.js`. He is off `minecraft:iron_sword` |
> | ✅ **E2 Salvage** | ten deals, accept five — `salvage_deals.js`. She is off the crossbow |
> | ✅ **E3 Wall** | a CHAMPION kills you while pathless, or **30 days godless in PLAYED TIME** |
> | 🔴 **E4 Art** | needs new machinery: `speakerFor()` returns null for the pathless, so they hear nobody |
> | ⏳ **E5 Forge** | the dialogue tree |
>
> ⚠️ **This said `DRAFT` / "Zero code written" while E1 and E2 were shipping from it.**
> `DRAFT` is an instruction — *do not build from this* — so leaving it on a doc being
> built from makes the marker worthless everywhere else.

> Ethan: *"For chosen ... i want to make that honestly harder to accomplish"*

---

## Why this replaces what is there

`chosen.js` currently keys on **carrying a literal item**:

```
blade:minecraft:iron_sword · salvage:minecraft:crossbow ·
forge:create:wrench · art:minecraft:lapis_lazuli
wall: killed while pathless -> offer on respawn
```

Two problems, and the second is the real one:

1. ⚠️ **Tetra is going in**, and it changes what a tool *is*. An entry condition keyed
   on `minecraft:iron_sword` is brittle the moment swords stop being that item.
2. ⭐ **Carrying an item is not a character test.** It is an inventory check. Every god
   in this pantheon has months of authored personality, and the moment you meet them is
   the one moment the design was not using it.

**The replacement makes each entry condition an expression of that god's character.**
You are not proving you have a sword. You are proving you are the kind of person that
god takes.

---

## The five

| god | condition | what it tests |
|---|---|---|
| **Blade** | **500 mobs slain** | you already fight. He takes the proven |
| **Salvage** | She randomly offers godless players deals. **All of them suck.** Accept **5** | you keep saying yes to bad terms. That is how she gets everyone |
| **Wall** | **Killed by another god's champion** (a pathed player), OR **no god for 30 days** | something took you, or nobody else wanted you. Both are hers |
| **Art** | As a godless player **with 50+ levels**, go deep enough that **the deep speaker introduces herself** (below y0, no sky), then **take her deal — it takes every level you have and kills you. She tells you this first** | you went too deep and accepted anyway, knowing |
| **Forge** | At a crafting bench **after the 6th night**, survive her conversation (below) | you can charm her. Nothing else |

⭐ **Nobody is chosen for being strong.** Blade is the only one who even looks at
combat, and his is a threshold rather than a feat. The other four test what you are
willing to do, who else has passed on you, how far down you will go, and whether you
can talk.

---

## Forge's conversation — Ethan's writing, verbatim

She does **not** cutscene you. She just repeatedly asks what you plan on crafting.
**You do not know what the right choices are. Simply appeal to her nature.**

> ⚠️ **If no response in 5 minutes, instant fail.**

```
"Whatcha crafting"
    Respond Truthfully  -> FAIL
    Lie                 -> PASS

"What if you made a gun?"
    Wonder              -> PASS
    Rebuff              -> FAIL

"I used to have a gun, and a horse."
    Ask more            -> FAIL
    ignore              -> PASS

"I wonder why they made me what I am today, I haven't crafted a
 darn thing across my entire life"
    Marvel              -> PASS
    Question            -> FAIL

"You can craft, we can craft. We can make this world something that
 would make the gods above would envy."
    Agree               -> PASS
    Disagree            -> FAIL
```

**All of it in an exaggerated western accent** — the written-accent rules in
`forge_voice.js` apply: drop the g, contract freely, regional vocabulary,
🚨 **never respell a vowel.**

### 🔑 The pattern, and why it is fair

The passing line is **Lie · Wonder · ignore · Marvel · Agree**.

She does not want a truthful, curious, probing interlocutor. She wants **someone who
plays along, wonders with her, does not pry into what she lost, marvels rather than
interrogates, and agrees to build.** That is precisely *"appeal to her nature"* — she
is the god whose entire FORCED column is generous, who never thanks you and never
punishes you, and who is lonely enough to ask a stranger what they are making.

⭐ **It is legible in retrospect and opaque in advance**, which is exactly what was
asked for. A player who has read her other lines has a real advantage; a player
optimising will guess "be honest, ask questions, engage" and fail on the first prompt.

⚠️ **Note the trap in prompt 3.** *"I used to have a gun, and a horse"* is the only
line where she volunteers something about herself, and the generous-seeming response —
asking more — is the failure. She is not offering. She is checking whether you will
push.

---

## ⭐ Salvage's deals — ruled 2026-08-29

> Ethan: *"all of salvage deals will be deals that sound good on paper but are just
> her taking health, hunger, putting a bad satus effect on you with no upside."*

**No items. Ever.** That satisfies the standing rule (*"we don't take items from
players, that is how you cause them to quit"*) while still making every deal a real
loss.

🔑 **AND IT IS HER OWN TRADE, WITH THE PAYOUT REMOVED.** Her live trades in
`salvage.js` already charge **hunger and levels** and pay **Strength II + Speed**,
night vision, resistance. The godless deals are the same shape with nothing coming
back — which is exactly what a predator offers somebody who has no protector yet.
The machinery is already built; only the payout is deleted.

### ⚠️ "SOUND GOOD ON PAPER" IS LOAD-BEARING, AND IT IS THE WHOLE WRITING JOB

A deal that visibly costs health for nothing gets accepted **once**. Then the player
learns, stops accepting, and Salvage never gets a champion — the condition would be
self-defeating.

So the pitch has to be convincing **five separate times**, and the five have to be
varied enough that pattern-matching takes a while. Her existing register already knows
how to do this — *"First one's easy. They always are."* — but these five are the
hardest lines in the whole spec, because they have to work on a reader who is
becoming suspicious.

⭐ That is also the fiction working: five accepted bad deals is not gullibility, it is
**grooming**. She is not tricking you once, she is teaching you to say yes.

---

## ⭐ RULED 2026-08-29 — three of the six answered

### Blade: **500 mobs**

`counter_hooks.js` already counts mob kills off `EntityEvents.death` +
`victim.isMonster()`, so the counter exists and no new bookkeeping is needed.

⚠️ **Check the existing counter's semantics before wiring it.** Blade's live counter is
his *trust* counter and may be reset, decayed or scoped per-Trial. A chosen condition
needs a **lifetime, never-reset** tally — probably its own key rather than a borrowed
one. Reusing a counter that resets would make the condition unreachable, silently.

### Wall: a **champion of a god** — i.e. another *player* who holds a path

Not the tagged mob actors. **A character who is a champion of a god**, which on this
server means a pathed player killing a pathless one.

🔴 **THIS TIGHTENS THE LIVE BEHAVIOUR AND SHRINKS IT A LOT.** `chosen.js` today says
*"somebody kills you while you walk no path... **The killer is not checked.**"* Adding
the check is correct — being killed by a zombie should not hand you a god — but on a
four-player server, **PvP between a pathed and a pathless player may essentially never
happen**.

⚠️ So Wall's real route becomes the **30-day fallback**, and the fast route is close to
decorative. That is not necessarily wrong — *nobody else wanted you* is the most Wall
thing in the document, and a rare alternate route is fine. But it should be a decision
rather than a discovery, so it is written down here.

### Art: **when the deep speaker introduces themself**

⭐ **The threshold already exists in code and does not need inventing.**
`deep_speaker.js`:

```js
var DEPTH_Y = 0        // below y 0 AND no sky above - both must hold
var CUTOFF_Y = -64     // fallback ONLY if this build cannot read sky
function metKey(s) { return 'veldora_spk_met_' + s.id }
```

Ethan's own ruling, 2026-08-22: *"when you go into the depths at all, you get the
speaker. anything that's no ceilling and in negative y"* — and **y alone was never
enough**; the sky test is what means *underground*, the y test is what means *deep*.

**So Art's condition is: a pathless player crosses that threshold, and her introduction
fires.** The `met` flag is the exact hook — it already exists and already persists.

### 🔴 BUT A PATHLESS PLAYER CURRENTLY GETS NO SPEAKER AT ALL

```js
function speakerFor(p) {
  var path = VELDORA.paths ? (VELDORA.paths.pathOf(p) || '') : ''
  return path ? (SPEAKERS[path] || null) : null   // <- pathless returns null
}
```

Art's condition therefore needs **one new behaviour**: the pathless hear *her* in the
depths. Small, and thematically it is the best fit in the pantheon — she is **her own
speaker** (`deep_speaker.js` §375, Ethan 2026-08-22: *"she is her own depth speaker"*),
she is the one who hunts you down there, and she is exactly the sort to talk to someone
nobody else has claimed.

⚠️ It is still a real addition, not a config change, and it is the only part of the
five conditions that requires new machinery rather than new wiring.

---

## ⭐ RULED 2026-08-29 — Forge's retry, and Art's price

### Forge: **retry after a long cooldown**, and the timer is **per prompt**

Not one-attempt-ever, and not next-night. **Days.**

🔑 That is the only answer that survives the tree's own design. It is deliberately
opaque on a first read, so first-try failure is the *expected* outcome — making it
permanent would turn the most characterful entry condition in the game into a coin
flip nobody gets to learn from. A long cooldown keeps failure expensive without making
it final, and it is slow enough that brute-forcing all 32 combinations is not a
weekend's work.

⚠️ **The 5-minute timer is PER PROMPT**, not for the whole conversation — which is how
Ethan's note reads in place, and it is the forgiving reading. Five prompts at five
minutes each is a 25-minute ceiling; a whole-conversation timer would punish someone
who walked away once.

### Art: **50 levels to take the deal, and she takes every one of them**

> Ethan: *"Chosen on respawn, however she takes all your levels. im adding a
> requirement of 50"*

| | |
|---|---|
| **gate** | you must be at **50+ levels** to accept |
| **price** | **all of them.** Not 50 — everything you are carrying |
| **then** | it kills you, and you are chosen **on respawn** (symmetric with Wall's, 100t) |

⭐ **This is the strongest condition in the document, and it is the most Art.** It is
not a test of survival or skill — it is a test of **preparation and willingness**. You
have to grind to 50, carry it down past y0 into the dark, and then hand the whole pile
to something that has already told you it will kill you.

🔑 **And "all of them" rather than "50" is the character.** A god who took exactly
the price would be a trader — that is Salvage. Art takes what you have because she is
appraising you, and the appraisal is *what were you willing to bring*. Arriving with
80 costs you 80.

⚠️ **`death_cost.js` becomes moot for this one death** — its 5-level charge cannot
apply to a player she has already emptied. Make sure that reads as intentional in the
log rather than as the death cost silently failing.

⚠️ **50 is a real wall for a godless player**, who has no path drops, no trust buffs and
no coefficient. That is presumably the point, but it makes Art's route the slowest of
the five by some distance — worth watching in play rather than assuming.

---

## 🔴 STILL OPEN

1. **Wall: which clock is "30 days"?** `fall.js` counts **world days**; `ranks.js`
   counts **played sweeps, online only**. They are not the same clock and the
   difference has bitten this project before. Played time is the fairer measure — 30
   world days pass while you are logged out.
2. ~~**Art: after she kills you, what?**~~ ✅ **RULED** — see above.
3. ~~**Forge: timeout and retry?**~~ ✅ **RULED** — see above.
4. **What does a godless early game look like now?** Every condition is much harder
   than carrying an item. `pathless.js` already has the pantheon arguing overhead so
   the wait is not silent, but it is now considerably longer.

---

## What does NOT change

`chosen.js`'s existing guarantees survive as written and should be kept:

* the offer fires **once**, out of combat only (300t since damage)
* **carrying it unlocks the path forever**; `/path` only lists what you have unlocked
* Wall's offer lands **on your respawn**, 100t later

Those are mechanics, not conditions. Only the trigger changes.

---

# ✅ E1 BUILT — 2026-08-29. Blade takes the proven.

**`minecraft:iron_sword` is gone.** Blade is unlocked by **500 mobs slain, lifetime**.

## 🔑 Two reasons, and the second is load-bearing

1. Carrying an iron sword is something you do in your first ten minutes. That is not
   *"he takes the proven"* — Ethan: *"i want to make that honestly harder to accomplish."*
2. ⚠️ **Tetra makes a tool's identity unstable.** A tetra sword is not
   `minecraft:iron_sword`, so the trigger would have silently stopped firing for exactly
   the players most likely to deserve it. **An item id is not a safe thing to key a
   condition on in this pack.**

## ⛔ Its own counter, and nothing resets it

`docs/67` flagged the trap and it is **real, not hypothetical**: `counters.js:219` zeroes
every patron counter on `/counters clear`, and `setTo` can put any of them anywhere.
Borrowing it would have made a 500-kill condition **unreachable with no error at all** —
the player grinds, an admin zeroes a counter for an unrelated reason, and the door moves
further away.

⭐ `slain.js` owns `veldora_lifetime_slain`. **There is no clear, no decay, no per-Trial
scope, and no admin zero.** The harness asserts that `counters.js` cannot even name the
key, and that 300 kills survive a simulated counters wipe.

## 🔑 It rides the EXISTING death handler

Counted next to the trust bump in `counter_hooks.js`, **not in a second
`EntityEvents.death`**. Two handlers would each have their own idea of what a monster is
and would drift the first time either definition was touched. ⭐ One handler, two
counters, two lifetimes.

## ⚠️ This gate FAILS CLOSED — the opposite of the night gate

`night.js` must fail **open**, because a god going unexpectedly silent is a bug nobody
traces for weeks. This one is the reverse: **an unlock is spent forever and cannot be
taken back.** If `slain.js` is missing, Blade is *not* unlocked, and it says so loudly
rather than looking like a player who has not killed enough.

## 🚨 And the display was one edit from lying

`/path` rendered the condition as a **two-way branch** —
`TRIGGERS[k] ? 'carry X' : 'be killed while pathless'`. The moment Blade left the carry
table, that would have told the player, confidently and in Blade's own row, **to go get
killed while pathless to reach him.** There are three kinds of condition now and the
display knows it: Blade shows live progress (`slay 143/500`), and a condition nobody has
written says exactly that instead of guessing.

## ⚠️ Everyone starts at zero, deliberately

The tally is **not** seeded from the trust counter. That counter may have been reset,
decayed or scoped, so importing it would invent a lifetime figure that was never true.
⭐ The world reset (`68` §C) makes this moot shortly, and a player who already unlocked
Blade **stays unlocked** — the unlock check runs first.

**39 assertions, 3 negative controls all confirmed red. 656 passed / 0 failed across 18
harnesses. Live 58/58, 0 errors.**


---

# ✅ E3 BUILT — 2026-08-29. Both of Wall's routes, and one of them came back.

**Route 1** — a **champion** (a pathed player) kills you while you walk no path. She
offers on your respawn.
**Route 2** — you drift **30 days of PLAYED time** with nobody.

## 🔑 The ruling: played time

Ethan: *"played time."* `fall.js` counted **world** days, which pass while you are
logged out — so a player could earn Wall's attention **by not playing.** ⭐ Played time
is the only measure that means *you spent thirty days with nobody* rather than *your
server was up for thirty days.* Same reasoning `ranks.js` records for Forge's boredom
and `tide.js` for its clock.

⚠️ **"Thirty days" is thirty Minecraft day-cycles of play — ten hours at the keyboard.**
Thirty *real* days of playtime would be 720 hours and nobody would ever see it; thirty
*world* days is the thing the ruling just rejected.

🔑 **There is no clock in the drift code at all.** The sweep only ever iterates
`server.players`, so a logged-out player is simply never ticked. The mechanism *is* the
enforcement — nothing has to check whether you are online.

## ⚠️ Route 1 reverses a documented ruling, and here is why that is allowed

`chosen.js` carried a 2026-08-16 note dropping the champion requirement:

> *"paths are exclusive on a four-player server, so exactly one player held a path and
> the only pathless player could not be killed by a champion he was not fighting. A rule
> nobody can satisfy is not a stricter rule, it is a dead one."*

⭐ **That note is right about its own moment, and what changed is not the argument — it
is the shape.** `docs/67` pairs the strict rule with a **second door that opens on its
own, with no other player involved at all.** The champion requirement is no longer the
only way in, so it is no longer dead. **Both routes exist or neither should.**

## 🚨 The ordering bug that would have burned a player's one stamp

The `K_STRUCK` stamp used to be written **before** the killer's path was read — the read
existed only to decorate the log line. Adding the check below it would have marked the
victim struck and *then* declined to count it, **spending their one stamp forever, on a
death that never qualified, silently.** The read moved above the stamp.

## ⚠️ And a vestigial key I did NOT reuse

`veldora_pathless_since` is still written and cleared, and **nothing reads it**. Its name
says *"since"* — a timestamp. Reusing it as an accumulator is precisely the bug this
file's own header spends a paragraph on: `veldora_refused_<key>` was a tick deadline read
as a boolean, and it silently broke Wall's unlock with no error anywhere. **New key,
honest name.**

**42 chosen assertions, 3 negative controls all red. 717 passed / 0 failed across 19
harnesses. Live 59/59, 0 errors.**
