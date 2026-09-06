# Act 0 — the playtest

> **GENERATED — do not hand-edit.** `python tools/act0_smoke.py --md`
>
> These are the things **only a person looking at a screen can answer.** Nothing
> here is green by default and nothing automated can tick one — that substitution
> is how this pack shipped with fonts rendering as tofu and a title card that had
> never once rendered.

Record what you see. The note matters more than the tick:

```bash
python tools/act0_smoke.py --pass 8f4b5d --note "took ~2s, came up behind me"
python tools/act0_smoke.py --fail 8f4b5d --note "never showed"
```

**7 of 38 passed.**

---

## the opening

| | # | id | what to look for | how |
|---|---|---|---|---|
| OK | 1 | `59aa07` | a fresh player sees the title card type itself out, and NOTHING else | /opening reset then relog |
| OK | 2 | `9307b2` | the card is legible, clear of the crosshair and the Seasons HUD | watch it - the fade is half the question, a screenshot cannot answer it |
| OK | 3 | `585430` | the journal opens from the INVENTORY BUTTON and is titled "My Journal" | open your inventory, click the book button beside the crafting grid |
| OK | 4 | `0fd01a` | it contains ONE entry - Entry 0 - and the other three sections are empty | a journal that starts full is a manual. It fills as the story happens |
| OK | 5 | `b7e1eb` | Entry 0 holds all 18 sentences across three pages, and reads as one piece | open Entry 0 and read to the end |
| OK | 6 | `57214f` | the three empty sections do not look broken | if Patchouli renders an empty category as a dead box, say so and they get hidden |
| OK | 7 | `700278` | reaching a beat fires a toast, and the Act 0 tab renders with icons | /story reach the_caves |

- **PASS** — Ethan, 2026-09-06 01:15: title card types out, nothing else on screen
  <br>a fresh player sees the title card type itself out, and NOTHING else
- **PASS** — Ethan, 2026-09-06 01:15: legible and clear. Complaint: wants a FONT - it renders in vanilla type
  <br>the card is legible, clear of the crosshair and the Seasons HUD
- **PASS** — Ethan, 2026-09-06 02:22: it opens, titled My Journal. Font a bit off and hard to read
  <br>the journal opens from the INVENTORY BUTTON and is titled "My Journal"
- **PASS** — Ethan, 2026-09-06 02:22: only Entry 0, other three sections empty
  <br>it contains ONE entry - Entry 0 - and the other three sections are empty
- **PASS** — Ethan, 2026-09-06 02:22: all 18 sentences, reads as one piece
  <br>Entry 0 holds all 18 sentences across three pages, and reads as one piece
- **PASS** — Ethan, 2026-09-06 02:22: empty sections look fine. Ethan still to polish the other text in the journal
  <br>the three empty sections do not look broken
- **PASS** — Ethan, 2026-09-06 02:22: achievements fired and the Introductions tab renders in the advancements menu
  <br>reaching a beat fires a toast, and the Act 0 tab renders with icons

## Ank arrives

| | # | id | what to look for | how |
|---|---|---|---|---|
|   | 8 | `7fcfaf` | /ank spawn puts a body in front of you | /ank spawn - it prints what it ran and what came back |
|   | 9 | `b36cd0` | ...and if it fails, the tab-completion says why | /easy_npc preset import_new data - is arkhdottir/ank_t0 offered? |
|   | 10 | `d12784` | he spawns on his own when you enter a cave, without doing anything | walk into the upper caves and wait up to 2s |
|   | 11 | `3bcd8d` | he does NOT spawn indoors - a house is not a cave | stand inside a building at surface level and wait |
|   | 12 | `416968` | he wears his own skin, not a missing-texture check pattern | look at him. F3+T first if you suspect the client cache |
|   | 13 | `95982d` | he follows you around the cave | walk 20 blocks and look back |
|   | 14 | `e7acb4` | he survives being hit - a player cannot kill him | hit him repeatedly with the best weapon you have |
|   | 15 | `847a90` | /kill on him REMOVES him - if it does not, the despawn path is broken and needs `easy_npc despawn` instead | /kill @e[tag=veldora_ank] then look for him |

## Ank talks

| | # | id | what to look for | how |
|---|---|---|---|---|
|   | 16 | `d348c3` | his greeting arrives in the CHAT BAR as <Ank>, like any person speaking | /ank greet 7 |
|   | 17 | `d2061f` | a five-line day reads as somebody talking, not as a wall of text | /ank greet 7 and watch the pacing |
|   | 18 | `4c9f75` | he greets ONCE a day - leaving and returning does not repeat it | go below -32, then come back up |
|   | 19 | `99475c` | right-clicking him opens his dialogue with three options | right-click him |
|   | 20 | `47aa8c` | picking "Its none of your business" gets the sheriff answer | the branch with three reply lines |

## Ank trades

| | # | id | what to look for | how |
|---|---|---|---|---|
|   | 21 | `2994c8` | the trade UI opens, and the price is wheat rather than emeralds | right-click him, or the trade button in his dialogue |
|   | 22 | `1e6c3d` | a first-time player can actually afford the tier-0 trade | count the wheat it asks for against what a new player has |
|   | 23 | `582a5d` | after descending, his next offer is visibly better | go below -32, come back, trade again |

## Ank leaves

| | # | id | what to look for | how |
|---|---|---|---|---|
|   | 24 | `3543e7` | going below -32 despawns him and prints "A chill runs up your spine." | dig down past the deep-works boundary |
|   | 25 | `8608b7` | stepping into daylight does the same | walk out of the cave |
|   | 26 | `54b628` | bobbing on the -32 boundary does NOT loop the chill | stand at y -31 and jump |
|   | 27 | `d2dd87` | ...and walking in and out of a doorway does not either | the dwell timer holds him 15s before the boundary may take him |
|   | 28 | `ad0b7d` | ...and if it does fire twice, the second one is SILENT | the line has a 60s floor; the log says despawned-quiet |
|   | 29 | `1fe8f9` | the chill reads as coming from nobody, not from Ank | it is at the top of the screen; his own lines are in chat |

## the urge

| | # | id | what to look for | how |
|---|---|---|---|---|
|   | 30 | `43ff11` | a day spent out of the deep produces an urge line | sleep through a day topside. The pools are EMPTY until Ethan writes them |

## the code's own claims (NEEDS-GAME markers)

| | # | id | what to look for | how |
|---|---|---|---|---|
|   | 31 | `1546cd` | align actually left-aligns - the mod may ignore it like maxWidth | /im test |
|   | 32 | `2ec286` | ON_DISTANCE_NEAR fires without a click, and at what range | walk up to Ank |
|   | 33 | `89a104` | an ADVANCEMENT condition reads our mcserver:act0 tree | /story reach the_caves then talk to him |
|   | 34 | `f02007` | SET_OPACITY actually fades rather than snapping | /easy_npc dialog test |
|   | 35 | `3bda20` | a preset we ship under data/easy_npc/preset is found at all, and under WHICH of the two paths | /easy_npc preset import_new then tab-complete |
|   | 36 | `0647c3` | FOLLOW_PLAYER targets the nearest player without TargetPlayerName | /easy_npc objective set follow |
|   | 37 | `d08ae3` | Invulnerable:1b survives void and /kill, not just damage | /kill @e[type=easy_npc:humanoid] |
|   | 38 | `f2cd20` | removing the follow objective stops an NPC already following | /easy_npc objective remove |

---

## Also covered, and not listed twice

These are `NEEDS-GAME` markers the code raised that a step above already asks.
Answering that step records these too, under their own ids. ⛔ They are listed
rather than dropped, because a marker that vanishes with no explanation is
indistinguishable from one somebody deleted.

| the marker | answered by |
|---|---|
| day 7 arrives as five <Ank> chat lines, paced, not one wall | a five-line day reads as somebody talking |
| <Ank> is legible against the vanilla chat and reads as a person, not a system message | his greeting arrives in the CHAT BAR |
| his chat lines and the chill are visibly different surfaces | the chill comes from nobody |
| kill removes an Invulnerable Easy NPC, or we need `easy_npc despawn` | /kill on him REMOVES him |
| the card is legible, clear of the Seasons HUD and the crosshair | the card is legible, clear of the crosshair |
| the journal actually appears in the inventory, titled Journal, readable | a book titled Journal is in the inventory |
| a toast fires and the Act 0 tab renders with the right icons | reaching a beat fires a toast |
| the skins render on an NPC, not as a missing texture | he wears his own skin |

