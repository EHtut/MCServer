# 67 — Being chosen: the five entry conditions

> **STATUS: DRAFT.** Ethan's spec, 2026-08-29. **Zero code written.** `chosen.js` is
> live and unchanged; nothing here is built.

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
| **Blade** | **Mobs slain** — a lot | you already fight. He takes the proven |
| **Salvage** | She randomly offers godless players deals. **All of them suck.** Accept **5** | you keep saying yes to bad terms. That is how she gets everyone |
| **Wall** | **Killed by a god character**, OR **no god for 30 days** | something took you, or nobody else wanted you. Both are hers |
| **Art** | As a godless player, **enter the deepest layer**, then **take her deal — which kills you. She tells you this first** | you went too deep and accepted anyway, knowing |
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

## 🔴 OPEN — needed before any of this is built

1. **Blade: how many is "a lot"?** It should be a number nobody hits by accident and
   most players hit eventually. `counter_hooks.js` already counts mob kills.
2. **Salvage: what do the bad deals COST?** ⚠️ Ethan's standing rule is *"No we don't
   take items from players, that is how you cause them to quit."* So the five deals
   must be bad in some currency that is not inventory — levels, a debt written against
   you, a temporary handicap. **This one genuinely blocks the build.**
3. **Wall: what counts as "a god character"?** The tagged actors
   (`veldora_*_actor`), another god's champion, or both? And is 30 days in-game or
   real? (`fall.js` uses world days; `ranks.js` uses played sweeps — they are not the
   same clock, and this project has been bitten by that.)
4. **Art: where is "the deepest layer"** now that One Dimension is cut? Presumably a
   Y threshold against Tectonic's −128. And **after she kills you — what?** Chosen on
   respawn, like Wall's offer? Does the death cost its usual 5 levels?
5. **Forge: is the 5-minute timeout per prompt or for the whole conversation?** And
   **may you retry after a fail** — next night, never, or after a cooldown?
6. **Every one of these is harder than carrying an item.** Nothing here says what a
   *godless* player's early game looks like while they work toward one. Worth a
   thought: the pathless already overhear the pantheon arguing (`pathless.js`), so the
   wait is not silent — but it is now much longer.

---

## What does NOT change

`chosen.js`'s existing guarantees survive as written and should be kept:

* the offer fires **once**, out of combat only (300t since damage)
* **carrying it unlocks the path forever**; `/path` only lists what you have unlocked
* Wall's offer lands **on your respawn**, 100t later

Those are mechanics, not conditions. Only the trigger changes.
