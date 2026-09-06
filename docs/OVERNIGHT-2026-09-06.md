# Overnight, 2026-09-06 — mods, the spawn rule, and the audit

> **Read this first, then `python tools/act0_smoke.py --script` and start at item 8.**
> Everything below is done and verified unless it says otherwise. The server is up.

---

## ① WHAT YOU ASKED FOR, AND WHERE IT LANDED

| you said | state |
|---|---|
| add the mods | ✅ **6 added, 3 already installed, 3 genuinely unavailable** |
| ambient spawning is non-undead only | ✅ **101 undead denied**, live and verified |
| audit for what should not exist | ⚠️ **31 findings. 6 fixed, 5 filed as D-148…D-152. The audit itself is 2/5 complete** |
| a writeup and actions | this file, and ⑤ is the actions |

---

## ② THE MODS

**Only six of the fifteen were actually new.**

**Added:** `streams-reflowing` · `roadweaver` · `the-roads-more-travelled` ·
`countereds-smooth-steps` · `travelersbackpack` · `autohud`, plus the two resource packs
`allure-pack` and `allure-3d-plants`.

**Already installed:** `subtle-effects` · `respawning-animals` · `untitled-duck-mod`.

**Unavailable, and on the record so nobody re-checks them in three weeks:**

- `cave-dust` — Fabric and Forge only; no NeoForge build has ever existed
- `particular` — Fabric only
- `resonance-ambiance` — advertises NeoForge, but its *oldest* build is newer than 1.21.1

⭐ **`subtle-effects` is the NeoForge equivalent of both `cave-dust` and `particular`, and it
was already in your pack.** You will probably get what you wanted from those two anyway.

**Verified:** packwiz regenerated, 315 → 321 mods, hash matches. Four server jars downloaded.
Server restarted — all four load, 81/81 KubeJS scripts, 0 errors.

⚠️ **One unproven dependency.** `autohud` declares `fabric-api` as *required*. The pack ships
`forgified-fabric-api`, the NeoForge port, which normally satisfies it — but autohud is
**client-only**, so the server boot cannot tell us. If it does not load for you, that is the
first thing to check.

---

## ③ AMBIENT SPAWNING IS NON-UNDEAD ONLY

**101 entity types denied** — the `minecraft:undead` tag as contributed by eight installed
mods (born_in_chaos 34, goety 16, cataclysm 13, occultism 12, iceandfire 8…), plus vanilla's
own fifteen, which live in the server jar rather than any mod and a tag scan alone would
have missed.

🚨 **The order of the rule is the whole rule.** In Control takes the *first* match, so the
deny sits **after** the SPAWNER and STRUCTURE passthroughs. Above them it would make every
dungeon spawner and every structure-generated undead inert — the exact mistake `spawn.json`'s
own README warns about: *"suppress AMBIENT spawning, never DELIBERATE placement."*

🔑 **Scripted spawns needed no allow-rule.** `tide.js` and the event system place mobs with
**commands**, and In Control never sees a command-spawned entity. *"Undead only during tides
or scripted events"* is what **remains** once ambient is denied — not something to add.

⛔ **`tools/undead_deny.py`, not a hand-edited list.** 101 entries maintained by hand is wrong
the first time a mod is added, and wrong *silently* — an untagged new undead just starts
wandering the surface. Run it after any mod change; it reports drift.

⚠️ **What it cannot see:** a mod whose undead are not in the tag. `rottencreatures` was
checked by hand and contributes nothing to it. If its mobs appear ambiently, look there first.

---

## ④ THE AUDIT

Five lenses launched. **Two finished** — *axed-but-still-here* and *standing-rules* — with
31 confident findings. **Three died on a session limit**: `fragile`, `docrot`, `shadow`.
That is filed as **D-152**, because *"we audited it"* is exactly the kind of claim that rots.

### 🔴 The worst finding was mine

`gods_in_chat_check.js` — the check I wrote last night to enforce your rule — **was
vacuous.** It exempted "admin output" by colour code:

```
const ADMIN = /Text\.of\s*\(\s*'§[78ac6]/
```

**§6 is Salvage's colour. §c is the deep speaker's. §7 is a god's.** It whitelisted the exact
speech it existed to catch, and reported *"no god speaks in the chat bar (80 scripts)"* while
`chosen.js` announced a god and `paths.js` had a patron speak in its own god colour.

Colour cannot tell a diagnostic from a deity — they use the same palette. **Structure can:**
operator output lives inside `commandRegistry`, because that is the only place a command
handler can be. Rewritten that way, it finds **53 chat sends across 14 files**.

### Fixed overnight, unambiguous

- **`crown.json` deleted** — a retired god's advancement with `announce_to_chat`, broadcasting
  *"The Crown — Adventurers cannot die. Servants can."* to your chat bar whenever anyone picks
  up a necro staff. Dead content *and* a rule-A violation in one file.
- **`_probe_patron.js` gated** — the only probe in the pack without an admin gate, and it
  lists and **spawns all six gods** including Crown. Any player could type `/patron`.
- **`guidebook.js` deleted**, and **`/guide` fixed** — it was handing out the Modonomicon book
  I deleted, which Patchouli answers with an *"Invalid Book"* rather than an error.
- **`make_epicfight_weapons_datapack.py` deleted** — Epic Fight is not installed.
- **`live_smoke.py` font check fixed** — it looked for a zip the rename invented and nothing
  builds. **`live_smoke` is now 13 ok, 0 failing, 0 unknown.**
- **`docs/README.md` and `WORDS.md` fixed** — six live docs routed "what is true right now"
  to `docs/STATUS.md`, **which has never existed**; and the doc every agent reads first was
  already wrong about the journal.
- **`modlist.json` repaired** — `resolve.py resolve`, the authoritative pass that decides what
  is in the pack, **has crashed on load since 2026-08-29**. Two rows had no slug at all; 43
  had no tier.

---

## ⑤ ACTIONS — what needs you

**Three decisions, in the order I would take them.**

### 1. Crown — two lines, but it changes what a player can do (D-150)

`/path crown` **works today.** He was retired 2026-08-14, has no voice of his own
(`warn.js:86`), so a player who picks him gets **Wall's voice under a retired name**. Four
comments promise this is handled "at the world reset" — and `reset_preflight.py` has **no
Crown check at all**, so the reset would silently leave him in.

> **Say "close crown"** and I add him to CLOSED and add the check to the reset gate.

### 2. The 53 chat sends — three questions decide most of them (D-148)

- Is **narration** a violation? `fall.js` says *"Your levels are gone. You walk no path."*
  That is nobody speaking. The rule names *characters*.
- Do **system notices** count? `paths.js` printing *"Reading, for the road:"* is a receipt.
- Two systems would go from silent to speaking — see below.

### 3. Retired code still loading (D-151)

~2,250 lines retired on 2026-08-15 still load on the live server: `stalker.js` (1,933),
`whispers.js`. Plus the release/fall system, unreachable **by construction** because every god
is `mode:'never'`, and `spawn_pressure.js`'s suppression branch, unreachable because your own
rule says no coefficient may sit below 1.

⚠️ **`cutscene.js` is the exception I would keep** — 221 lines with no caller, but you asked
on 09-05 to *"fix the cutscene machinery because it will be used alot."* Unbuilt-for, not dead.

### 🚨 And one you should just know about (D-149)

**Milantros has never said any of her charm conversation, and Kayer's deal wipes every XP
level you have and then says nothing.** Both route through `voice.chat()`, which is pinned to
`return false`. Three boot banners claim these systems are live and speaking — the eleventh,
twelfth and thirteenth lying banners this project has caught.

---

## ⑥ TO START PART 2

```bash
cd /c/MCServer/repo && python tools/act0_smoke.py --script
```

**The opening is 7/7.** Part 2 is Ank, and it now opens with the **gate**: does `/ank spawn`
put a body in front of you at all. Everything below that was untestable while the spawn
command was invalid, and read as merely unanswered.

⚠️ **One thing to do before you play:** the client needs rebuilding. The pack changed name,
weather2 came out and went back in, and six mods were added. Re-run your packwiz update.
