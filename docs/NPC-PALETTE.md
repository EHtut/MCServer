# NPC PALETTE — what a character can do, for writing against

> A menu, not a manual. `NPCS.md` is how to *build* an NPC; this is what one can **do**, so
> a scene can be written knowing what is actually available.
>
> **Everything here was read out of `easy_npc-7.10.0`.** Nothing is aspirational.

---

## ① DIGEST

**The headline: Easy NPC has a real dialogue system, and it is much larger than a text box.**
Branching menus with up to six conditional buttons, a portrait of the speaker, priorities so
the right conversation opens itself, and buttons that run commands.

**⭐ The three that change what is writable:**

**`ON_DISTANCE_NEAR`** — a character can speak **because you walked up**, with no click. Ank
stopping you at a cave mouth needs no trigger of ours.

**`ADVANCEMENT` as a dialogue condition** — the nine Act 0 achievements already gate what a
character will say. A line can exist *only* for a player who has heard the argument. **The
plot ledger and the dialogue system are already connected**; nothing needs building.

**`SET_OPACITY`** — a character can **fade**, rather than blinking out. Ank's exit was going
to be `/kill` and a line; it can be a fade instead.

**What this is for.** Write knowing that "he only says this if you have met Caebrim", "this
option is visible but locked", "he says this once, ever", and "he says this because you
stood still" are all one field each — not features to request.

⚠️ **None of it is proven in game.** The mod accepts these; whether each behaves as read is a
`NEEDS-GAME` item. Treat this as the menu, not the meal.

---

## ② ROUTING

| | |
|---|---|
| **OWNS** | what an NPC can be made to do · the dialogue vocabulary · triggers, actions and conditions |
| **DOES NOT OWN** | *how to build one* → `NPCS.md` · *what they say* → Ethan · *when they appear* → `ACT0.md` · *screen placement of non-NPC text* → `VOICES.md` |
| **SOURCE** | `easy_npc-neoforge-1.21.1-7.10.0.jar`. ⛔ Re-read after a mod update |

---

## ③ WHEN A CHARACTER CAN ACT — the triggers

Every one of these can carry actions. `ON_INTERACTION` is the obvious one; the rest are the
interesting ones.

| trigger | it fires when |
|---|---|
| `ON_INTERACTION` | the player right-clicks them |
| **`ON_DISTANCE_TOUCH`** | the player is **touching** them |
| **`ON_DISTANCE_VERY_CLOSE` · `_CLOSE` · `_NEAR` · `_FAR`** | ⭐ four rings of proximity — **speak because somebody approached** |
| `ON_SPAWN` | they arrive |
| `ON_DEATH` · `ON_HURT` · `ON_KILL` | violence, theirs or yours |
| `ON_TRADE` | a trade completes |
| `ON_OPEN_DIALOG` · `ON_CLOSE_DIALOG` · `ON_BUTTON_CLICK` | the conversation itself |
| **`ON_TIME_CHANGE`** | day ↔ night |
| **`ON_WEATHER_CHANGE`** | rain starts |
| `ON_STATE_CHANGE` | their own state changed |
| `ON_OWNER_LOGIN` | their owner joins |
| **`ON_INTERVAL_INSTANT` · `_SHORT` · `_NORMAL` · `_LONG` · `_VERY_LONG`** | five idle cadences — muttering to themselves |

⭐ **The proximity ring is the one worth designing around.** *"He steps out of the dark as you
get close and starts talking before you can click him"* is `ON_DISTANCE_NEAR`, and nothing
about it needs our code.

---

## ④ WHAT AN ACTION CAN DO

| action | |
|---|---|
| `MESSAGE` | say something |
| **`COMMAND`** | ⭐ **run any command** — so a button can grant an achievement, set a flag, teleport, anything the server can do |
| `OPEN_DEFAULT_DIALOG` · `OPEN_NAMED_DIALOG` | open a conversation |
| **`OPEN_NAMED_DIALOG_CONDITIONAL`** | open *whichever* conversation fits this player |
| `OPEN_TRADING_SCREEN` | the shop |
| `CLOSE_DIALOG` | end it |
| **`MOVE_TO` · `MOVE_TO_AND_WAIT`** | walk somewhere — **stand in a doorway** |
| `SET_POSE` · `RESET_POSE` | a fixed stance |
| `PLAY_ANIMATION` · `STOP_ANIMATION` · `RESTART_ANIMATION` | animate |
| **`SET_OPACITY`** | ⭐ **fade in or out** |
| `SOUND` | a noise |
| `INTERACT_BLOCK` | use something |
| `SCOREBOARD` | set a score — state without code |
| `NPC_STATE` | change their own state |
| `WAIT` | pause, so a sequence can be paced |

🔑 **`COMMAND` is the seam that makes everything else reachable.** A dialogue button can run
`/story reach ank`, `/ank clear`, `/urge reset` — anything this project has built. **The
dialogue system does not need to know about our systems; it just needs a command.**

---

## ⑤ WHAT A LINE CAN DEPEND ON — the conditions

> ⭐ **This is the section to write against.** Each is one field on a button or a dialogue.

| condition | a line can depend on |
|---|---|
| **`ADVANCEMENT`** | ⭐ **a plot beat they have reached.** Our nine Act 0 achievements, directly |
| **`EXECUTION_LIMIT`** | how many times this has already fired — **"he says this once, ever"** |
| **`SCOREBOARD`** | any score, so any state we track |
| **`PLAYER_TAG`** | a tag on the player |
| `HAS_ITEM_IN_HAND` · `HAS_ITEM_IN_INVENTORY` | what they are carrying — *"you are holding a pickaxe"* |
| `PLAYER_HEALTH` · `NPC_HEALTH` · `ENTITY_HEALTH` | how hurt anybody is |
| `EXPERIENCE_LEVEL` | how far along they are |
| **`PLAYER_IDLE`** | ⭐ they have been standing still |
| `TIME_OF_DAY` · `WEATHER` | night, or rain |
| `RELATIONSHIP` | `OWNER` · `NOT_OWNER` · `SAME_FACTION` · `NOT_SAME_FACTION` · `FRIENDLY_FACTION` · `HOSTILE_FACTION` |
| `TEAM` · `GAMEMODE` | scoreboard team, creative/survival |
| **`CHANCE`** | probability — a rare line, without a pool |
| `NPC_STATE` | the character's own state |

### 🔑 And a failed condition has two behaviours, which is a writing choice

| mode | the player sees |
|---|---|
| **`HIDE`** | nothing. The option was never there |
| **`LOCK`** | the button, visibly unavailable |

⭐ **`LOCK` is the more interesting one.** *"Ask him about the arguments"* greyed out until
you have heard one tells the player there is something to find. `HIDE` keeps the secret.
Pick deliberately — it is the difference between a locked door and a blank wall.

---

## ⑥ WHAT A CONVERSATION LOOKS LIKE

| | |
|---|---|
| **types** | `BASIC` (text) · `STANDARD` (text + buttons) · `YES_NO` |
| **buttons** | up to **six**, or two large. Each can be `ACTION`, `CLOSE`, or `DEFAULT` |
| **priority** | `CRITICAL` · `HIGH` · `NORMAL` · `LOW` · `FALLBACK` · `MANUAL_ONLY` |
| **portrait** | the speaker can be drawn beside the text, with position and scale |
| **text** | multiple blocks per dialogue, with `{displayName}` substitution |
| **escape** | whether the player may close it at all |

⭐ **Priority means the character chooses what to say.** Give each conversation a condition
and a priority and `OPEN_NAMED_DIALOG_CONDITIONAL` opens the highest-priority one that fits —
so *"what does Ank say the fourth time you come back after ignoring him"* is a priority and a
condition, not a branch anybody has to hand-wire.

⚠️ **`MANUAL_ONLY` never opens itself**, which is how a conversation is reserved for a
specific moment — a scene we trigger deliberately rather than one he offers.

⛔ **`CRITICAL` and un-closable dialogue exist and should be used almost never.** A
conversation the player cannot leave is the cutscene problem again, and Act 0 already spent
four days learning that lesson.

---

## ⑦ WHAT THIS MEANS FOR ANK, CONCRETELY

Nothing below needs new code — each is a field:

- **He speaks when you approach the cave mouth.** `ON_DISTANCE_NEAR` → `OPEN_NAMED_DIALOG_CONDITIONAL`
- **He says something different once you have gone down anyway.** `ADVANCEMENT` on `mcserver:act0/the_caves`
- **He says a thing exactly once.** `EXECUTION_LIMIT`
- **"Ask him what is down there" is visible but locked** until you have heard the argument. `ADVANCEMENT` + `LOCK`
- **He notices you standing there.** `PLAYER_IDLE`
- **He mutters when left alone.** `ON_INTERVAL_LONG`
- **A button opens the shop.** `OPEN_TRADING_SCREEN`
- **A button marks a plot beat.** `COMMAND` → `/story reach …`
- **He fades instead of vanishing.** `SET_OPACITY` — ⭐ this would replace the `/kill` in `ank.js`

---

## ⑧ CORRECTIONS

**"The chill line has to come from our own announce layer."** ⚠️ Not necessarily — `MESSAGE`
and `SET_OPACITY` on an NPC could carry the exit instead. The current implementation is still
the right one *for now*, because the chill fires when Ank is despawned by the **boundary**,
which is our code and not a conversation. ⛔ But if the exit ever becomes a scene he plays,
that moves.

**"Dialogue means writing pools like the gods."** ❌ Different system entirely. The gods speak
through `voice.js` in overlays; an NPC speaks through Easy NPC's own menus with buttons and
conditions. **A character can use both** — Ank could mutter through the overlay and converse
through a dialogue — but they are two surfaces with two sets of rules, and `VOICES.md`
governs only the first.

⛔ **Nothing here has run.** The mod accepts every field above; whether each behaves as the
class names imply is the game's to say.
<!-- NEEDS-GAME: ON_DISTANCE_NEAR fires without a click, and at what range :: walk up to Ank -->
<!-- NEEDS-GAME: an ADVANCEMENT condition reads our mcserver:act0 tree :: /story reach the_caves then talk to him -->
<!-- NEEDS-GAME: SET_OPACITY actually fades rather than snapping :: /easy_npc dialog test -->
