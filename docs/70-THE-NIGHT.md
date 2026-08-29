# 70 — The Night

> **STATUS: DRAFT.** Ethan's rulings, 2026-08-29. **Zero code.**

> *"we bring the tide system up, only at night, but to the overworld... we keep the
> depths incredibly dangerous, but we also make nights as dangerous."*

---

## 🔑 Why this replaces the depth work

The underground was going to be made dangerous because the underground is where danger
lives — an assumption inherited from Minecraft, not from the books.

> Ethan: *"In my books, Alice has honestly never gone underground, but the underground
> was the most dangerous place in minecraft so it was my assumption."*

⭐ **So the danger moves to the night instead, and it comes to you.** No worldgen change,
no 300-block dig, no regeneration — and it lands on the one axis this server currently
has nothing on. `min_y` goes **back to −64**; the depth experiment is closed (`69`
addendum 2 proved the world was never shallow, only empty).

---

## The design

**Overworld danger at night scales with the highest god's trust level.**

⚠️ **No inversion.** Ethan: *"lets just say wall and forge get to struggle, im the one
playing those classes anyways."* Wall and Forge start at MAX trust and decay, so their
champions get the hardest nights immediately and it eases as they lose standing. That is
a deliberate accepted cost, not an oversight.

---

## ⭐⭐ THE DEEP SPEAKER OWNS THE NIGHT

She moves from being a **depth** entity to a **night** entity:

* she introduces herself after the **30th night**
* she **silences the gods' ability to speak to you or act at night**

🔑 **This is what makes the night dangerous rather than merely darker.** Your god cannot
reach you. The mechanic and the fiction are the same sentence.

### Who keeps their voice — RULED

| god | at night |
|---|---|
| **Blade** | 🔇 silenced |
| **Salvage** | 🔇 silenced |
| **Wall** | 🗣️ **speaks** — and **keeps her strength**, the aura included |
| **Forge** | 🗣️ **speaks** |
| **Art** | 🗣️ speaks — *"she's her own antagonist anyways"* |

### 🚨 THERE IS A LORE REASON, AND NOBODY KNOWS IT — INCLUDING ME

> Ethan: *"There is a lore reason that they don't know about. You don't know either."*

⛔ **DO NOT INVENT ONE.** Not in a comment, not in a doc, not in a line of dialogue. The
gap is deliberate and it is Ethan's to fill.

⚠️ This is the same failure mode identified for CreatureChat in `68`: *an LLM
confabulates into gaps and will invent a pantheon.* The rule applies to the assistant
writing this file exactly as much as to a companion mod.

⭐ **An observation, offered as a pattern and NOT as an explanation:** the three who keep
their voices are the two **non-combatants** — the gods whose rank starts at maximum and
decays, the gentler half of the chart — plus the one who *"cannot physically touch the
world"* and is her own deep speaker. Whether that is the reason, a coincidence, or a
misdirection is not known here.

---

## 🔴 The collision this creates with existing config

**In Control currently denies `hostile: true` above y=40.** The surface is deliberately
empty of hostiles — that is why the world feels safe up there, and it was a design
choice, not an accident.

⚠️ **The night tide does not merely add danger to the surface; it replaces the reason
that rule exists.** Both have to change in the same commit or they will fight: the rule
will suppress exactly the spawns the tide is trying to create.

---

## ⚠️ OPEN — the danger has to reach indoors

> Ethan: *"Danger should reach out indoors, not sure how to do this for now."*

Unsolved, and it matters: high trust + a silenced god + scaled danger adds up to *"never
go out at night"*, which kills the mechanic by making it avoidable. A night you can wait
out in a dirt hut is a loading screen.

**Not designed yet.** Candidates only — the tide's existing `enclosed` test already
knows whether you are under a roof, and `spawner.js`'s flood fill already guarantees a
mob can reach you, so the primitives exist even though the answer does not.

---

## ⭐ TIDE MODIFIERS — Ethan's spec, 2026-08-29

Tides stop being one shape. Four wave types:

| modifier | composition |
|---|---|
| **Pure horde** | all melee |
| **Specialist wave** | low melee, **higher (not high)** ranged |
| **Miniboss + horde** | melee plus an **undead miniboss** |
| **General** | a normal wave — melee plus some specialists |

⚠️ *"higher (not high)"* is doing real work in the specialist line and should survive
into the constant: ranged enemies stack in a way melee does not, because they all hit
you at once from cover.

### The miniboss roster — and 🔴 three of the four are already someone's avatar

Ethan's four: **lifestealer · missionary · Fallen Chaos Knight · Supreme Bonecaller**.

Measured against `stalker.js`'s existing cast:

| miniboss | conflict |
|---|---|
| `lifestealer_true_form` | 🔴 **this is ART**, cast as *"The Taker"* |
| `fallen_chaos_knight` | 🔴 **this is BLADE**, cast as *"The Challenger"* |
| `missioner` | 🔴 **this is CROWN**, cast as *"The False King"* |
| `missionary` | ⚠️ a **different entity** — the jar contains both `Missionary*` and `missioner` classes |

🚨 **A god's stalker avatar appearing in a generic tide wave stops being that god's
signature.** The Taker is supposed to mean Art is hunting you. If it turns up in every
fourth tide, it means nothing.

**Three ways out, none chosen yet:** pick different undead for the tide · let them
appear but only in the wave of a god you do *not* follow · accept the overlap and let
the tide be the gods' shared army, which fits Art's tide claim from `63`.

⚠️ **`supreme_bonecaller` is not a valid id.** The jar has `bonecaller` and a
`BonecallerSupRanProcedure` class, so a "supreme" variant exists in some form, but the
entity id is unconfirmed. 🚨 **Verify with the registry probe before wiring it** — `data
get entity @e[type=<id>,limit=1]` answers *"No entity was found"* for a real id and a
parse caret for a fake one. **A lang entry is not proof of registration.**

---

## Mods added by these rulings

| mod | why | status |
|---|---|---|
| **MCA Reborn** | ✅ **IN.** *"There is a world outside the gods after all, just no incentive to touch it"* | ⚠️ 1.21.1 build is `7.7.36-beta.3` |
| **MCA Capitals** | monarchy for MCA — a **rival authority** to the pantheon | 31.8k dl, 1.21.1 NeoForge ✅ |
| **Just Enough Guns** | gives guns to mobs — balanced as **specialist waves** | ⚠️ **CurseForge, not Modrinth**; version unverified |
| **Distant Friends** | see below | 848k dl, 1.21.1 NeoForge ✅, 53 KB |

⭐ **The framing that settled MCA** — and it is stronger than the tonal objection it
overrode: *"The gods and the depths are just something that exist in a world that has
moved on past them."* A thriving, indifferent world does not dilute the horror; it is
what makes it land. A world that acknowledges its gods is a fantasy setting. A world
that has **forgotten** them and is doing fine is much worse — and it is what gives
`69`'s *"you do not belong here"* something to stand against.

⭐ **Just Enough Guns is lore-accurate, not just fun.** Ethan: *"In the books, Alice was
the first to utilize gunpowder alongside her undead."* Armed undead are not a balance
concession, they are the canon.

---

## ⭐ Distant Friends — checked, and the answer is YES with a catch

**It is not a companion mod.** It spawns *"player like mobs that look at you from a
distance"* — they stand still, punch the air, sneak like real players, and **vanish as
you approach**.

**Skins: configurable — by USERNAME, not by uploaded file.** Measured from the jar:

```
distantfriends.configuration.friends
  "A list of users who can be chosen when it spawns a distant friend"
```

⚠️ **It ships no textures at all**, so the figures wear real players' skins resolved by
name. *"I can build the skins myself"* therefore needs the skins to live on **accounts**
— his own, Liam's, alts — rather than as files.

⭐ **A possible way around it, unverified:** the config also exposes `playerMobsCompat`
and `playerMobsNameLinks`, referencing the separate **Player Mobs** mod. If that mod
allows arbitrary skin links, the pair could give free skin choice. **Worth one check
before giving up on custom skins.**

### 🔑 And they are already written for

They should not be friends. **They should be the dead champions** — and the line already
exists, in `deep_speaker.js`:

> *"You are not the first champion to come this far. You are not even the tenth."*

⭐ Spawning is a **biome modifier** (`data/distantfriends/neoforge/biome_modifier/`), so
it is datapack-controllable — which means they can be made **night-only**, and the night
is now the Speaker's.
