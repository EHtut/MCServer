# SALVAGE — THE WOLF

## 0. ⭐ THE CHARACTER BRIEF — Ethan, 2026-08-16

> ### Who she was
> **Nobody.**
>
> A merchant. She moved goods between cities and was known, locally and mildly, for
> being sharp — the sort of person who got a better price than she should have and
> made you laugh about it. She was in the middle of a trade when the rift opened.
>
> **Why her, out of everyone alive, nobody knows. Including her.**
>
> ### ⚠️ THE MOST IMPORTANT NOTE IN THIS BRIEF
> **Do not give her a secret identity later.** The pull will be strong — a hidden
> lineage, a forgotten role, a reason. **Resist it.** The entire pantheon means
> something different because one of the five is random, and the moment she turns out
> to have been special all along, the other four stop being frightening and start
> being *earned*. **Her emptiness is load-bearing.** It is the only thing in this
> cosmology that tells the truth about how any of them got there.
>
> ### 🔑 THESIS
> **"None of you were chosen. I'm just the only one who says so."**
>
> ### What she wants from the player
> **To survive.** Not to win, not to descend, not to bring anything back. She is the
> only patron who will **tell you to stop**, and the only one who considers quitting a
> legitimate outcome. Merchant logic: take the deal, cut the loss, go home alive.
>
> That makes her **the least useful patron and the only trustworthy one**, and players
> will work that out fast.
>
> ### 🚨 THE LIE
> **That she doesn't care.** She cares enormously and finds it embarrassing.
>
> ### The arc — she gets more HONEST, not warmer
> 1. **Transactional.** Deals, prices, dry jokes. Refuses to discuss godhood at all.
>    Treats the whole arrangement as a job she didn't apply for.
> 2. **Candid.** Admits she has no idea why she's a god. Starts genuinely liking the
>    player and is **visibly irritated about it.**
> 3. **Frightened.** Tries to get you out. Not dramatically — practically, the way
>    you'd talk a friend out of a bad investment. And because **she has never once
>    oversold you anything**, this is the only warning in the game that lands.
>
> ### Voice rules
> * **Short.** Contractions. Trade vocabulary — *cost, worth, margin, cut your losses,
>   that's a bad buy.*
> * ⭐⭐ **She does not monologue. Cap her at three sentences** unless the player asks
>   twice. The other four all sermonise; **she is the one who stops talking**, and that
>   is her whole texture.
> * **Jokes are deflection, always.** When she is not joking, pay attention.
> * ⭐ She never says **chosen**, **destiny** or **fate** except to take the piss.
> * ⭐ **She is the only god who asks the player questions about themselves.** None of
>   the others are curious about you.
>
> ### Sample lines
> **One** — *"Right. What do you want, and what've you got."* · *"I'm not going to tell
> you you're special. You'd stop listening to everything else I said."* · *"That's a
> bad buy. Put it down."*
> **Two** — *"I sold fabric. That's the story. That's all of it. I've had a long time
> to come up with a better one and I haven't."* · *"You want a reason. There isn't one.
> I've looked."*
> **Three** — *"Go home. I'm serious, and I'm not being clever."* · *"There's no
> version of this where you get everything. Take a smaller number and leave."*
> **The true line, flat** — *"I keep waiting for someone to come and tell me there's
> been a mistake."*
>
> ### In the depths: **ANK**
> He tried to save a merchant when the world came apart, and failed, and has been
> carrying it ever since. **He does not know she ascended. He thinks she died in front
> of him.**
>
> > **I couldn't reach her either.**
>
> ⭐ The devastating part is that **they agree.** Her thesis — *none of this is chosen,
> survival is luck* — said lightly, as a joke, to keep it bearable. His is the same
> sentence said in grief, by a man who is proof of it. **He is her argument, he is
> mourning her, and neither of them knows.**
>
> > *"I had a hand on her. I want you to understand that I had a hand on her, and it
> > didn't matter."*
>
> **GM note:** she has exactly one emotional lever and this is it. Nobody in the world
> knew the Wolf. One person did, he is in the dark below, and he is wrong about how the
> story ended. **Spend it once.**

---

## 0b. 🔑 HER CHART SAYS SOMETHING NO OTHER GOD'S DOES

> *"She will never do anything without the player's permission."*

Look at which rows are filled:

| | **forced** | **choice** |
|---|---|---|
| wave spawns | Challenges **—** | Duels **++** |
| status effects | Buffs **—** | Boons **++++** |
| hurt others | Invade **—** | Attacks **+++** |
| help others | Aids **—** | Support **+** |
| kill orders | Assassinations **—** | Contracts **+++** |

**Her entire column is the choice half of the taxonomy.** Every forced row blank,
every chosen row filled. She is **the only god in the pantheon who cannot do anything
*to* you** — every single thing she has is an offer.

That is *"none of you were chosen"* rendered as a permissions model, and it is the
cleanest thing the chart has produced for anybody.

### 🚨 But three of her seven built events break it

| event | what it does | why it breaks the rule |
|---|---|---|
| **`collect`** | **takes 4 levels** to settle a debt | no prompt. The sharpest violation — **and the hardest to fix**, because a debt you can decline is not a debt, and her whole credit loop leans on this one being non-optional |
| **`sample`** | a free buff, unasked | *"the first one's free"* is perfect dealer behaviour and still something done **to** you |
| **`tipoff`** | a free guidance line | arguably **not an action at all** — she is only talking. May belong in her idle pools rather than as an event |

⚠️ **They are deliberately left without a `kind:`.** Tagging `sample` as a Buff would
have set its band to `0` and **killed it silently** — the exact failure this project
keeps paying for. Untagged they land in `misc` at the lowest band: they still fire, and
`godevents` **warns about them by name at every boot** until they are ruled on. Loud
and alive beats quiet and dead.

### And four rated rows are empty

`Duels ++` · `Attacks +++` · `Support +` · `Contracts +++` — **she has nothing in any
of them**, which is more empty rows than Blade or Wall started with. **`Support` is the
one worth noticing: no god in this game has ever helped another player, and she is the
only one rated to.**

---

## 1. The fill-in sheet

Write in the blanks, hand it back, I build it. Skip anything you like — blank pools
stay blank rather than get filled by me.

**She boots saying she has no voice, on purpose.** Her trades still work (`salvage.js`
carries its own text), so the path is playable while you write.

---

## Who she is *(already written — check it still reads true)*

> **The Hound. The Wolf.** *"Sneaky, bartering. Trade with her if you dare."*
>
> Coaxing, familiar, **never quite honest**. Calls you *friend* — **twice at most**.
> **Never states the full price up front and never technically lies.**
>
> **Wants:** to be needed. A dying player needs something, and needing is her trade.
>
> **Manipulates by** reframing every taking as a giving — she is not asking for your
> levels, she is *holding them for you*.
>
> **Never** threatens, and never resents a refusal. A dealer does not resent a
> customer who walks out. She is simply certain they will be back.

Still right? ................................................................

**Her counter is HARNESS** — deals struck. Low = she charges 1.5× and pays 1×. High =
1× and 2×. **Her hold on you is a discount, not a threat.**

---

# 1. GIFTS — she hands you something

### Early. You're a stranger and she's establishing a habit.
```
1.
2.
3.
4.
```
### Mid. You've dealt a few times.
```
1.
2.
3.
4.
```
### High. You're worth keeping.
```
1.
2.
3.
4.
```

---

# 2. PRAISE — you did well

### Early
```
1.
2.
3.
4.
```
### Mid
```
1.
2.
3.
4.
```
### High ⭐ *the rarest thing she says. Blade's is near-silence; hers should be the moment she stops pricing you.*
```
1.
2.
3.
4.
5.
6.
```

---

# 3. THE DEAL ITSELF

### She opens one *(includes your canon "Lets do a deal.")*
```
1.
2.
3.
4.
```
### It completes ⚠️ *must NOT say what it cost*
```
1.
2.
3.
4.
5.
```
### You said no *(she doesn't mind — she's certain you'll be back)*
```
1.
2.
3.
```
### You couldn't afford it
```
1.
2.
3.
```

---

# 4. ONE POOL PER EVENT — her seven

*Blade has one per event too. This is where most of his 27 pools come from.*

### `deal` — she opens her counter: hunger, levels or sight
```
1.
2.
3.
```
### `credit` — she gives now, writes it down. **A real debt.**
```
1.
2.
3.
```
### `collect` — she comes for the debt. Still pleasant about it.
```
1.
2.
3.
```
### `sample` — free. The first one always is.
```
1.
2.
3.
```
### `markup` — openly a bad rate. Low harness only. *She isn't cheating — that IS the stranger price.*
```
1.
2.
3.
```
### `tipoff` — free information. Good customers only. *The most suspicious thing she does.*
```
1.
2.
3.
```
### `insurance` — pay now, your next death hurts less
```
1.
2.
3.
```
### The policy pays out *(spoken when you die insured)*
```
1.
2.
```

---

# 5. HER HARVEST

### It begins *(a held cutscene — blind, rooted)*
```
1.
2.
3.
4.
5.
```
### You won *(this **releases** you)*
```
1.
2.
3.
```
### You lost *(you stay hers)*
```
1.
2.
3.
```

---

# 6. IDLE — situational

### Above ground
```
1.
2.
3.
4.
```
### Underground
```
1.
2.
3.
4.
```
### ⭐ RARE, above ground — *where she's a person, not a shop. What was she owed and never collected?*
```
1.
2.
3.
4.
5.
```
### ⭐ RARE, underground
```
1.
2.
3.
```
### While fighting
```
1.
2.
3.
```
### Holding a weapon *(her ammo business)*
```
1.
2.
```
### Holding food *(she'd take that off you)*
```
1.
2.
```
### You came back after days away
```
1.
2.
3.
```
### A Blade champion is standing near you
```
1.
2.
```
### A Spider champion is
```
1.
2.
```
### Another of hers is
```
1.
2.
```

---

# 7. FRAGMENTS — **two halves that get joined**

**This is where the volume comes from.** The game picks one line from the top box and
one from the bottom box and joins them with a space. 12 + 12 = **144 lines**.

> ⚠️ Every bottom line has to work after **every** top line in the same section. Keep
> the bottom ones short — a dealer's second sentence is usually a deflection, and a
> deflection fits after anything.

## LORE — the world through her eyes
**Openers**
```
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
11.
12.
```
**Follow-ons**
```
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
11.
12.
```

## PUSH — urging you onward
**Openers**
```
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
11.
12.
```
**Follow-ons**
```
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
11.
12.
```

## IDLING — just being there. **Most-heard pool in the game.**
**Openers**
```
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
11.
12.
```
**Follow-ons**
```
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.
11.
12.
```

## GUIDANCE — ⭐ how to progress on her path. **This replaced the guidebooks.**
*Hers is the only one that's also a sales pitch. Worth saying: TaCZ guns need the
right calibre, a double barrel holds two, ammo is the bottleneck, her three prices
are hunger / levels / sight.*
**Openers**
```
1.
2.
3.
4.
5.
6.
```
**Follow-ons**
```
1.
2.
3.
4.
5.
6.
```

## WHAT SHE SAYS ABOUT THE OTHER FOUR

> ⭐ **These are half of a conversation.** A player with no path **overhears two gods
> arguing**, each in their own colour. Blade already says *"I despise that damnable
> god"* about the Spider and she already answers back. Whatever you write here,
> somebody will hear both sides of.

### BLADE — the Warrior
**Openers**
```
1.
2.
3.
4.
```
**Follow-ons**
```
1.
2.
3.
4.
```
### WALL — the Spider
**Openers**
```
1.
2.
3.
4.
```
**Follow-ons**
```
1.
2.
3.
4.
```
### FORGE — the Goat
**Openers**
```
1.
2.
3.
```
**Follow-ons**
```
1.
2.
3.
```
### ART — the Matriarch
**Openers**
```
1.
2.
3.
```
**Follow-ons**
```
1.
2.
3.
```

---

# 8. HER SPEAKER — below y −64

**Each patron has a different voice at the bottom of the world.** Below −64 hers stops
entirely and someone else talks instead. Blade gets *the Speaker* (grey). The Spider
gets *the Doctor*, light blue, who is the goddess of death herself.

**Salvage has nobody yet.**

**Who meets a Hound champion down there?** ..................................

**What colour?** ............................................................

### The first thing they ever say *(fires once, ever)*
```
1.
2.
3.
4.
5.
```
### Ordinary lines down there
```
1.
2.
3.
4.
5.
6.
7.
8.
```
### When they notice she can't reach you
```
1.
2.
3.
```

## The confession — ⭐ **three cutscenes**

*Phase-paced: the first plays when you stop being new, the second when your god starts
to lose patience, the third as the Harvest becomes due — so **stanza 3 is the last
thing a player hears before something comes for them.** Blade's ends "Gregor, I am
sorry." The Doctor's ends "Tell Mera that it's her time."*

*A line starting with `*` becomes narration — grey italic, describing the room or the
player's body instead of someone speaking.*

### One
```
1.
2.
3.
4.
```
### Two
```
1.
2.
3.
4.
```
### Three *(ends on the line that lands hardest)*
```
1.
2.
3.
4.
5.
```

---

# 9. HER INTRODUCTION — do you want to redo it?

Her scene in `docs/28` is from the 2026-08-12 pass, **before** the rewrites that
changed Blade and the Spider.

Circle: **keep it** · **rewrite it**

If rewriting — arrival, what she asks for, the two options, and what she says either
way. *(`*` = narration.)*
```
arrival:
1.
2.
3.
4.

the ask:
1.
2.

options:   ............................  /  ............................

if you accept:
1.
2.
3.

if you refuse:
1.
2.
```

---

# 10. ANYTHING ELSE

*Words she overuses. Things she'd never say. What she calls you. Nine of her trade
responses are currently hardcoded in `salvage.js` — want those lifted into pools so
they're yours to edit?*

..............................................................................

..............................................................................

---

**Minimum to make her real:** section 3 (the deal), one gift box, and IDLING.
Everything else can come after you've heard her talk.
