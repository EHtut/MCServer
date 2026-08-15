# The Arrival — the patrons argue over you before you exist to them

*Ethan, 2026-08-14. **The scene below is his own writing and is CANON**, quoted
exactly. Everything after §2 is scaffolding built on it.*

---

## 1. THE ARRIVAL — canon text

> Your head spins. You feel nauseous.
>
> **"A new one has joined our plane"** — Blade
> **"They look lost. Lonely. Perhaps I can..."** — Wall
> **"No they must prove themself, spider. Prove they can stand above all the other"** — Blade
> **"What if they can't? What if they need someone to-"** — Wall
>
> You blink as five shapes flash across your vision for half a second. You look forwards again.
>
> **"Silence, Spider. To live in a world such as this they need to forge a pact. To make a deal. The cost of survival. The price to thrive!"** — Salvage
> **"Please spare us the rhetoric, wolf. To survive in this world they must thrive not from your pathetic pacts or deals. No. They must build. They must overcome."** — Forge
> **"You exploit my lands, Goat."** — Salvage
> **"Fight back then, or perhaps you'd prefer to hide away in your shadowy dealings-"** — Forge
>
> **"ENOUGH!"** — Art
> **"You confuse the youngling. They must understand, and to understand they must have a moment of silence"** — Art
>
> The figures fade from your vision.

## 2. 🚨 What this establishes, that nothing else did

`30-THE-THESIS.md` §5.1 complained that the scenes are not *of* Veldora — no patron
ever mentions the descent, the watching, or the player's deathlessness. **This scene
solves that problem in a completely different way than I proposed, and better.**

I suggested exposition: give each patron one line that could only be said here. Ethan
wrote **an argument instead**, and you learn the world from *how they disagree*. Every
patron states their entire thesis in one line, and none of them is talking to you.

* **"A new one has joined our plane"** — the arrival, the descent, and that you are
  new to *them*, in six words.
* Blade: prove yourself, stand above the others.
* Wall: they look lost and lonely, perhaps I can — **and she is cut off twice.**
  The shrinking ask never even gets finished. Perfect.
* Salvage: a pact, a deal, the cost of survival.
* Forge: no — build, overcome.
* Art: silence, and understanding.

### Three rules the scene creates, which are now canon

1. **They address each other by SPECIES, never by name.** *spider* · *wolf* · *Goat*.
   Nobody in this world uses proper names for these things, including the things
   themselves. **This must hold everywhere.**
2. **Art has authority over the others.** *"ENOUGH!"* and the argument stops dead.
   That is new characterisation and it is a big deal — the gentlest patron is the one
   the others obey.
3. **They talk ABOUT you, never TO you.** You are overhearing. That is the register,
   and it is what makes the world feel inhabited rather than staged for you.

⭐ **Crown is already absent.** Five speakers, and *"five shapes flash across your
vision"*. The merge into Wall was ruled hours earlier and the writing arrived
consistent with it without being told.

## 3. Build — it is mostly already built

**The primitive exists and is tested.** `VELDORA.ritual.begin()` with `options: []`
does the black screen, the rooting, the staggered delivery and the guaranteed
release. This scene is content for a system that passed its test suite tonight.

What it needs on top:

* **First-join detection** — a persistent flag on the player, checked in
  `PlayerEvents.loggedIn`. Same shape as the ritual's own login recovery.
* **Attribution.** Every previous patron line has been unattributed, because one
  voice in the dark needs no label. **A five-way argument does.** The speaker's name
  has to be visible or the scene is noise.
* **Slower pacing than an introduction.** Ethan: *"The scene would run slowly."*
  Introductions run at ~2.5s a line; this wants longer, with real pauses at the two
  stage directions.
* **The two interruptions matter mechanically** — Wall is cut off mid-sentence twice,
  so those lines end in `-` and the next line must land *fast*, not on the normal beat.
  The rhythm is the characterisation.
* **The flash.** *"five shapes flash across your vision for half a second"* — a
  half-second break in the blindness, or five entities rendered and instantly
  removed. ⚠️ Needs a probe; nothing has ever interrupted blindness mid-ritual.

## 4. The ambient arguments — they keep arguing while you stay pathless

> Ethan: *"Then there should be random discussions as you to why you haven't picked a
> path every so often. We can make these kinda randomly generated through
> pregenerated dialogue and responses."*

### The structure: openers and rebuttals, not scripts

Each patron gets a pool of **openers** (a complaint or claim about the undecided
newcomer) and a pool of **rebuttals** (a reply to another patron's position). Because
the five disagree *by construction*, **any opener can be followed by any other
patron's rebuttal** and it still reads as an argument.

Five patrons × ~8 openers × ~8 rebuttals gives hundreds of exchanges from ~80 written
lines. Add a third beat occasionally and it stops repeating entirely.

**Rules, all inherited from the canon scene:**

* species names only — *spider*, *wolf*, *goat*, and whatever Blade and Art are to
  each other
* about you, never to you
* **Wall gets interrupted more than she finishes.** It is her whole shape.
* Art speaks rarely, and when she does the exchange ends.

### 🔑 This IS the courtship — it wires straight into "being chosen"

`33-BEING-CHOSEN.md` proposes that patrons pick you by watching what you do, and asks
what the player-facing surface of that should be. **This is the answer.** The
arguments are not flavour between events; they are the patrons *deciding*, out loud,
where you can hear it.

* Which patrons argue most about you reflects **what your behaviour has actually been
  signalling** — the builder hears Forge press his case more often.
* An argument that Wall keeps winning is Wall preparing to arrive.
* And when one of them finally comes for you, **you already heard them win.**

That turns a nag into foreshadowing, and it solves the cadence problem for free: the
arguments are frequent early (when nobody has a claim) and thin out as one patron
takes the lead.

## 5. Open

1. **Cadence and cap.** Frequent enough to feel alive, rare enough not to nag. Never
   during combat, a ritual, or another scene.
2. **Do the ambient arguments blind the player?** Recommend **no** — the Arrival
   earns a black screen because it happens once. Ambient ones should be overheard
   while you carry on, or they become an interruption tax on being undecided.
3. **Does the Arrival replay for a returning player after the world reset?** It
   should — it is a first-contact scene, and everyone will be new again.
4. **`mimicked` is cut** (§ below) — if any voice-mimicry was ever meant to carry the
   patrons' voices, that route is gone and they stay textual.

---

## 6. Cut: `mimicked`

Ethan: *"the voice recorder mod or whatever needs to go."* Removed 2026-08-14 —
**`mimicked` ("Voice-mimicking horror atmosphere"), not `simple-voice-chat`**, which
is proximity chat and is marked `core` in the manifest with the note that half the
horror layer depends on it.

`mimicked` was `server_side: unsupported` — client-only, so nothing on the server
changes. 290 → 289 shipped mods.

⚠️ **Method note, because this is the second time it has bitten.** `gen_pack.py`
regenerates from `tools/.cache/resolved.json`, **not from `tools/modlist.json`.**
Editing the manifest alone produced *no change at all* — the first regeneration
happily rewrote `mimicked.pw.toml` from the stale cache. Both files must be edited,
then `gen_pack.py`, then **diff `pack/` and verify the `index.toml` hash still matches
`pack.toml`.** This is the same mechanism that once deleted travelers-titles and
resurrected two cut mods.

---

# 7. Ruled 2026-08-14 — colours, and going deaf

## 7.1 Ambient arguments do NOT blind

Ethan: *"Yes i agree don't blind them."* The Arrival earns a black screen because it
happens once. Overheard argument is overheard **while you carry on** — anything else
makes being undecided an interruption tax.

## 7.2 🎨 A colour per patron

> Ethan: *"Lets also give them all different colors."*

Every patron line to date has been `§4§l` dark red, because one voice in the dark
needs no label. **A five-way argument does**, and colour carries it better than a
name prefix — you learn who is speaking without reading a tag.

**Proposed, and easily overruled — this is a taste call:**

| patron | code | colour | why |
|---|---|---|---|
| **Blade** | `§4` | dark red | steel and blood. The most event-like voice keeps the old colour |
| **Salvage** | `§6` | gold | the deal, brass, coin, the cartridge |
| **Forge** | `§2` | dark green | verdigris on brass, greed, the dragging chain |
| **Wall** | `§d` | light purple | the mother, the web, intimacy |
| **Art** | `§b` | aqua | sleep, cold, the dream. The only cool colour, and she is the one who ends arguments |

⚠️ **One collision to resolve.** `§4§l` is currently the *system event* colour — the
fall, the entry line, the whispers. If Blade takes dark red, then either events move
to `§c`, or Blade takes another colour. **Recommend events move**, because the
patrons are the more important speakers and dark red is the most patron-ish colour we
have.

## 7.3 🔑 Choosing a patron makes you DEAF to the others

> Ethan: *"There should be ambient dialogue when you choose a patron because you are
> then blind to the words of the other patrons."*

This is the best mechanic in the whole ambient system, and it costs almost nothing to
build.

**Before you choose**, five voices argue over you. **The moment you accept**, four of
them go silent — permanently. You hear only your patron from then on.

Why it is good:

* **Choosing finally costs something you can feel.** The XP strip is a number. This
  is the world getting quieter, and you did it to yourself.
* It makes the pre-path period **the loudest and most alive** the world will ever be,
  which is exactly backwards from how these systems usually work — and it means a
  player who dawdles is rewarded with content rather than nagged.
* **It is the thesis.** Veldora offers you one relationship and takes the rest. You
  belong to somebody now, and belonging is narrowing.
* It gives the refusal cooldown a sibling: silence as the shape of consequence,
  again.

### The beat at the moment of choosing

The four who lost should get **one last line each** as the door closes — then never
again. That is the ambient dialogue Ethan is asking for, and it is the strongest
possible use of it: the other four reacting to having lost you, once, and then gone.

Blade would be indifferent. Wall would be *hurt*. Salvage would be certain you will
be back. Forge would file it as a debt. Art would simply wait.

### After the choice

Your own patron keeps talking — that is the death-ladder material in `25`, and the
whispers already built in E2f. **The system does not shrink, it narrows.**

## 7.4 Open

1. **Does the fall make you hearing again?** Losing your path should arguably reopen
   all five voices — you are unclaimed, so they resume arguing. Recommend **yes**: it
   makes the fall feel like being thrown back into the cold, and it reuses everything.
2. Does a refused patron stay audible? Recommend **yes** — refusal is not choosing,
   and the silence there is already handled by its own cooldown.
