# SALVAGE — everything she needs you to write

**Every pool is empty and waiting.** Write into `salvage_voice.js` (the tags are
already there in this order) or write here and hand it back.

She boots saying so, on purpose:

```
[salvage] THE HOUND HAS NO VOICE - every pool is empty
[salvev]  HELD - her EVENTS do not register
```

Her **trades still work** — `salvage.js` carries its own text — so the path is
playable while you write.

---

## Who she is *(already written, docs/27 — here so you don't have to look)*

> **CANON:** *"Sneaky, bartering. Trade with her if you dare."*
>
> **Coaxing, familiar, never quite honest.** Calls you *friend* — **twice at most**,
> so it lands rather than becoming wallpaper. **Never states the full price up front
> and never technically lies.**
>
> **Wants:** to be needed. A dying player needs something, and needing is her trade.
>
> **Manipulates by** reframing every taking as a giving. She is not asking for your
> levels, she is *holding them for you.*
>
> **Never** threatens. Never resents a refusal — a dealer does not resent a customer
> who walks out, she is simply certain they will be back.
>
> **Canon lines:** *"Lets do a deal."* · *"Give me your hunger, and i'll give you
> life."* · *"Give me your levels and i shall grant you ammo."* · *"Give me your
> sight and i will grant you the power to kill."*

**Harness** is her counter — deals struck. Low = she charges you 1.5× and pays 1×.
High = 1× and 2×. **Her hold on you is a discount, not a threat.**

---

# 1. WHOLE LINES — 16 pools

*Complete sentences. One is picked at random. 4–6 each is plenty; fewer is fine.*

| pool | when it fires | notes |
|---|---|---|
| `low_gift` | she hands you something, early | you're a stranger |
| `medium_gift` | ″, once you've dealt a few times | |
| `high_gift` | ″, once you're worth keeping | |
| `low_silence` | **you did well**, early | despite the name — it's the praise pool |
| `medium_silence` | ″ | |
| `high_silence` | ″ at high harness | ⭐ the rarest praise she has |
| `deal_open` | a trade begins | includes *"Lets do a deal."* |
| `deal_done` | a trade completes | ⚠️ **must not say what it cost** |
| `deal_refused` | you said no | she does not mind. She is certain you'll be back |
| `deal_poor` | you couldn't afford it | |
| `harvest_won` | you beat what she sent | this **releases** you |
| `harvest_lost` | it beat you | you stay hers |
| `combat` | idle, while fighting | |
| `hold_weapon` | idle, holding a weapon | her ammo business |
| `hold_food` | idle, holding food | she'd take that off you |
| `returned` | you logged in after 2+ days away | |

---

# 2. FRAGMENTS — 8 pools, **opens × closes**

**This is where the volume comes from.** The game joins one random *open* + one
random *close* with a space, so 12 opens × 12 closes = 144 lines from 24 written.

> ⚠️ **Every close must work after EVERY open in its own pool.** Keep them short and
> self-contained. Hers are easy — a dealer's second sentence is usually a deflection,
> and a deflection fits after anything.

| pool | what it is | suggested size |
|---|---|---|
| `lore` | the world, through her eyes | 12 + 12 |
| `blade` | what she says about **the Warrior** | 4 + 4 |
| `wall` | ″ **the Spider** | 4 + 4 |
| `forge` | ″ **the Goat** | 3 + 3 |
| `art` | ″ **the Matriarch** | 3 + 3 |
| `push` | urging you onward | 12 + 12 |
| `idling` | just being there — **most-heard pool** | 12 + 12 |
| `guidance` | ⭐ **how to progress on her path** | 6 + 6 |

**`guidance` replaced the path guidebooks** (cut 2026-08-15). Hers is the only one
that's also a sales pitch. Practical things worth saying: TaCZ guns need the right
calibre, a double barrel holds two, ammo is the bottleneck, her three prices are
hunger / levels / sight.

> ⭐ **`blade` and `wall` matter more than their size suggests.** Blade already says
> *"I despise that damnable god"* about the Spider, and she already answers. A
> pathless player **overhears these two arguing**, each in their own colour. Whatever
> you write here is half of a conversation someone can hear both sides of.

---

# 3. CONTEXT — 7 pools

*Whole lines, picked by where you're standing.*

| pool | when |
|---|---|
| `loc_above` | idle, above ground |
| `loc_below` | idle, underground |
| `rare_loc_above` | ⭐ **15% roll — where she's a person, not a shop** |
| `rare_loc_below` | ″ underground |
| `near_blade` | a Blade champion is within 16 blocks |
| `near_wall` | a Spider champion is |
| `near_salvage` | another of hers is |

⭐ **The `rare_` pools are the best writing in Blade and Wall.** His are *"I had a
name in life once"*; hers are *"I carried a light once. It is not mine any more."*
For the Hound: what does a dealer let slip? What was she owed and never collected?

---

# 4. HER SPEAKER — below y −64

**Each patron has a different voice at the bottom of the world.** Blade gets the
Speaker (grey); the Spider gets the Doctor (light blue). **Salvage has none yet.**

Below −64 her voice stops entirely and this one replaces it. Needed:

| | |
|---|---|
| **who** | who meets a Hound champion down there, and what colour |
| `intro` | 1–5 lines. Fires **once**, ever |
| `common` | 8–10 lines |
| `abandoned` | 3 lines — *she cannot reach you down here* |
| **confession** | ⭐ **3 cutscenes**, 4–9 lines each |

**The confessions are phase-paced** — stage 1 at `companion`, 2 at `absence`, 3 as
the Harvest becomes due. So the last thing a player hears before something comes for
them is stanza 3. Blade's ends *"Gregor, I am sorry."* The Doctor's ends *"Tell Mera
that it's her time."*

A line starting with `*` is **narration** — grey italic, describing the room or the
player's body rather than the speaker talking.

---

# 5. TWO THINGS ALREADY WRITTEN — do you want to redo them?

**Her introduction** (`docs/28-THE-SCENES.md` → generated into the game). Written in
the 2026-08-12 pass, before the rewrites that changed Blade and the Spider. Arrival,
demand, two options, accept, refuse.

**Nine lines hardcoded inside `salvage.js`** — the trade responses: *"Hold the thing
you want fed, friend."*, *"You are too poor even for me."*, *"My supplier let me
down."* Those live in the trade code rather than a pool. Say the word and I'll lift
them into pools so they're yours to edit.

---

## Minimum to make her real

`deal_open` · `deal_done` · `deal_refused` · one `*_gift` · `idling`. Everything
else can come after you've heard her talk.
