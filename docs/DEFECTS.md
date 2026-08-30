# DEFECTS — findings with IDs

> **New 2026-08-29.** Until now every finding lived in a commit message or in the
> numbered doc of whatever chunk turned it up. That works while you remember the chunk
> and stops working the moment you do not.
>
> ⭐ **One entry per defect, with an ID, whether it is open or fixed, and what it
> actually cost.** A fixed defect stays here - the lesson is the point, not the status.
>
> ⚠️ This is not a to-do list. Work lives in `68-THE-GAMEPLAN.md`; this records what
> was found to be WRONG, so the same class does not get rediscovered a third time.

---

## D-101 — `spawn_pressure.js` multiplied every spawn, not just natural ones ✅ FIXED 2026-08-29

> Ethan: *"spawned the devil from the devil mod and it spawned 4 of them."*

**The file's own header had said, since it was written, that "a coefficient multiplies
NATURAL spawns". Nothing ever checked.** `checkSpawn` fires for every spawn there is, so
the density branch was also multiplying:

| type | what it is |
|---|---|
| `SPAWN_EGG` | an egg placed by hand |
| `COMMAND` | `/summon` — ⚠️ **including `spawner.js`, which is how the tide spawns** |
| `SPAWNER` | mob spawner blocks |
| `STRUCTURE` | structure-placed mobs |

At Blade's 3.0 that is **+2 guaranteed**; deep, it hits `MAX_DUP_PER_EVENT` = 4. One
summoned devil became four.

⚠️ **The tide was bounded**, which is why this survived unnoticed: `DUP_COOLDOWN` limits
duplication to once per 2s per player, so a 24-mob wave gained **+4, not 4×**.

⭐ **The accessor was read out of the jar, not guessed** —
`dev/latvian/mods/kubejs/entity/CheckLivingEntitySpawnKubeEvent` exposes
`public final transient MobSpawnType type` and `getType()`.

⚠️ **It fails CLOSED.** An unreadable type returns and shouts rather than falling through
to the old behaviour — falling back to "apply to everything" *is* the bug. And it matches
on **substring**, not equality: a remap handing back `MobSpawnType.NATURAL` instead of
`NATURAL` would otherwise disable density everywhere, which reads as *"Blade got easier"*
rather than as a fault.

⭐ It now logs each distinct spawn type once, so what actually reaches the hook on a
300-mod server is **measured** rather than remembered.

### ⛔ Still open, and a separate decision

**Natural hostile spawns still come in packs of 4** — that is vanilla's own
`minCount: 4, maxCount: 4` for zombie/skeleton/spider/creeper, not anything this pack
does. Fixing it means either biome modifiers (⚠️ which would flatten biome-specific
spawn lists across Terralith + RU + Nyctophobia) or a clump-thinning `checkSpawn` rule.
**Not attempted.**

---

## ⭐ T1 — the tide is hers. Not a defect; recorded because it REVERSED one. 2026-08-29

> Ethan: *"Alice is the goddess of death. She has a focus on skeletons, not zombies."*

The tide's three depth pools (SHALLOW / DEEP / DEEPER — twenty mobs from six mods:
zombies, ghouls, templars, wights, husks, drowned) collapse into **one role-keyed
skeleton roster**. Composition now comes from the **modifier**, not from `y`.

| modifier | pool |
|---|---|
| `horde` | Decrepit Skeleton — the bulk |
| `general` | + vanilla Skeleton, Bonescaller |
| `specialist` | + Thrasher (tank), Bonescaller, Demoman (rare, dangerous) |
| `miniboss` | Supreme Bonescaller, **Fallen Chaos Knight** |

### 🔴 It reversed a prior ruling, and that is the point of this entry

`tide.js` carried: *"⛔ `fallen_chaos_knight` IS DELIBERATELY ABSENT. It is Blade's
stalker avatar, 'The Challenger', and **Ethan ruled it stays his**."* He then listed it
himself as one of the tide's two minibosses.

⭐ The newer ruling wins, but it is a **lore change**, not a roster tweak: the goddess of
death now sends a *fallen version of the Warrior* at his own champions. The old ruling is
kept in place in both the code and the harness, with the assertion **inverted rather than
deleted**, so the reversal is visible instead of silently gone.

### 🚨 And it caught a bug before it shipped

**`decrepit_skeleton` was listed RANGED, and it is the bulk.** Under the new roster that
inverts every wave — `general` and `specialist` weight the ranged list, so the mob meant
to *be* the horde would have become the archers and the archers the filler. It survived
before only because the old depth pools held several melee mobs alongside it. Found by
reading his roles against the map, not by playing a wave.

⚠️ `stray`, `bogged` and `skeleton_lackey` were also removed from the ranged map: no
roster can draw them any more, and a map naming mobs nothing contains is a map nobody can
trust.

### ⚠️ Two costs, named

**Depth no longer changes composition.** A surface night tide and a y−100 tide are the
same skeletons, differing by tier and count. `rosterFor` was depth's only consumer, so
this trades mob variety for authorship — deliberately, and it is the one thing likely to
be felt in play.

**The harness went flaky and had to be fixed twice.** A varied wave is a *designed*
outcome, so three composition tests failed about one run in five. 🚨 **Flaky is worse
than absent**: it teaches you to re-run instead of to look. Variation is now suppressed
inside those tests, verified over 15 consecutive runs.

**106 tide assertions, 3 negative controls all red. 862 passed / 0 failed across 22
harnesses. Live 62/62, 0 errors.**

---

## 🔴 D-102 — "there is no shake" was true, and it was the wrong scope. 2026-08-29

Asked whether god dialogue could be *"shaking stylized text on the top of the player's
screen"*, I answered:

> ⛔ *"THERE IS NO SHAKE. Vanilla cannot animate text position… Undertale-style
> per-character motion is a client renderer feature and no server-side route reaches
> it."*

⚠️ **Every clause of that is true and the conclusion was wrong**, because the question
was never restricted to vanilla. `immersive-messages-api` — which Ethan added on his own
instinct — **is** that client renderer feature, and it ships a **server-side send**.

`ImmersiveMessage` (read from the jar, not the wiki) exposes:

| | |
|---|---|
| `shake()` / `shake(intensity, speed)` | the thing I said was impossible |
| `typewriter(speed, centered)` | letter-by-letter |
| `anchor(TextAnchor)` | **nine** anchors, including `TOP_CENTER` |
| `ObfuscateMode.RANDOM` | exactly what `garble.js` weaves by hand |
| `slideUp/Down/Left/Right`, `fadeIn/Out`, `size`, `background`, `sound`, `subtext` | |
| `sendServer(ServerPlayer)` | server-side, single player or collection |

⭐ **Three workarounds built this session were imitating this API**: the boss-bar
re-sent with uneven padding to fake a wobble, the `/title actionbar` sting, and `§k`
woven in one character at a time.

### ⚠️ What was NOT done

**Nothing was deleted.** `immersive.js` is a preferred *path*; every caller keeps its old
route and falls back the moment the mod is missing, unreachable, or throws. **A dialogue
system that goes silent because a mod updated is worse than one that looks plainer than
intended.**

⚠️ The API is reached **reflectively**, so all of it is unverified until a live boot says
otherwise. Every accessor is probed once and the outcome logged — *"the mod is missing"*
and *"I could not call it"* must never look like *"nobody said anything"*.

### 📋 Still to migrate

`garble.js` → `ObfuscateMode` · the action-bar sting → an anchored message · **god
dialogue itself** — ⚠️ and that last one keeps chat as the record, because chat is still
the only surface that survives being missed mid-fight.

---

## ⛔ D-103 — `talk-balloons` cut. Its channel would not handshake. 2026-08-29

> Ethan: *"Same error, i cannot log in and im tired of troubleshooting. we cut it."*

```
Channel name  talk_balloons:create_balloon  [+2 more]
Reason        This channel is missing on the server side, but required on the client!
```

⚠️ **Everything checked out and it failed anyway.** The mod was marked `both`, its jar was
installed on the server, it appeared in the mod list as `Talk Balloons 1.6.1
(talk_balloons)`, and all three of its declared dependencies were satisfied —
`neoforge [21.1.141,)` (have 21.1.247), `minecraft [1.21,1.21.1]`, `modernnetworking
[2.0.0,)` (have 2.0.1), all `side="BOTH"` and all present. Two clean boots and a full
packwiz regeneration did not shift it.

⭐ **It was a nice-to-have** — his own justification was *"same as above"* — and **no
amount of ambience is worth a login.** Cut rather than debugged further.

`modernnetworking` went with it: it was pulled in **only** as its dependency, and nothing
else in the pack requires it. ⚠️ **Verified before removing**, not assumed.

### 🔴 The process failure underneath it

This cost several restarts of a **shared** server while other agents were working on it.

> Ethan: *"You restart the server way too much over the smallest fixes… you are directly
> harming the work of other agents… It is no longer something you can restart whenever
> you feel like, you need to confirm with me."*

🔑 **The reason it kept happening is the reason it needed writing down:** the cost of a
restart is invisible from inside any one chat, so each one looked individually justified.
Now in `CLAUDE.md` at the repo root, where every agent reads it — along with *always
regenerate packwiz*, which was the other half of the same complaint.

---

## 🔴 D-104 — `fog` cut after breaking BOTH sides in one day. 2026-08-29

**1. It crashed the dedicated server.** It loads `net/minecraft/client/KeyMapping` during
mod construction — an instant hard failure on `DEDICATED_SERVER`. ⚠️ Modrinth said
`server_side: optional` **and the jar's own `neoforge.mods.toml` declares `side="BOTH"`**.
Neither source was the code. Forced client-only.

**2. Then it crashed the client.**

```
NoSuchFieldError: Polytone does not have member field 'BIOME_MODIFIERS'
  at fog/PolytoneCompat.getFogColorsFromPolytone
```

🔑 **`fog` was unpinned and resolved to newest while `polytone` is PINNED.** That is the
**third** unpinned-mod-against-pinned-library failure of the day, after
supplementaries/moonlight and the Create-addon scare.

⭐ It is cosmetic — *"just makes the world beautiful"* — and it cost two crashes. **Cut
rather than pinned**, because a third attempt was not worth another restart.

---

## 🔴 D-105 — `level.dat` grew past the NBT depth limit and the world would not load

```
NbtAccounterException: Tried to read NBT tag with too high complexity, depth > 512
Failed to load world data from level.dat AND level.dat_old
```

⚠️ **This is NOT corruption.** The data was intact; a nested structure exceeded
Minecraft's 512-deep read limit, and both the live file and its `_old` fallback had
already been written past it.

⭐ **`level.dat` was 206 KB against 111 KB in the 16:52 backup — it nearly doubled in
seven hours.** Something is accumulating nesting on every save.

**Recovery:** the broken pair was copied to `C:\MCServer\backup_leveldat_2026-08-29`
**before anything was touched**, then `level.dat` and `level.dat_old` were restored from
the 16:52 world backup. ⭐ Only those two files — `region/`, `entities/`, `playerdata/`,
`datapacks/` and `kubejs_persistent_data.nbt` were left current, so **no terrain, no
player progress and no Veldora state was lost.** What reverted is world spawn, time,
weather, gamerules and the datapack enable list.

Boot after restore: **`Done (3.271s)`, 64/64 scripts, 0 errors.** `level.dat` is
**112,070 bytes**.

### 🚨 THE CAUSE IS NOT IDENTIFIED, AND IT WILL RECUR

**Watch `level.dat`'s size.** 112 KB is the baseline; if it climbs toward 200 KB again the
accumulator is still running.

⚠️ Eighteen mods were installed the same day, so a new one is the obvious suspect — but
that is a suspicion, not a finding. A hand-rolled NBT parser written to locate the deep
branch **failed at depth 5 on a bad tag**, i.e. the parser was wrong, not the file. It was
abandoned rather than debugged while the server was down.

⚠️ **And the restart churn is a plausible contributor**: several stop/start cycles in
quick succession, some backgrounded, and the corruption appeared in a two-minute window
that contained one of them. Overlapping instances writing the same world would do this.
🔑 That is a second, concrete reason for the rule in `CLAUDE.md`.

---

## 🔴 D-106 — a defensive `typeof` check broke every godless test. 2026-08-30

`/deal`, `/artdeal` and `/forgetalk` all reported **`godless: UNREADABLE`** in play.

```js
var path = VELDORA.paths.pathOf(p)
if (typeof path !== 'string') return null      // <- always true
```

🔑 **`paths.pathOf` returns `persistentData.getString(...)` — a JAVA String — and in
Rhino `typeof javaString` is `"object"`.** So the check returned `null` for every player
alive, and **Salvage, Art and Forge would never have offered anything on their own.**

⚠️ **I added that check to be defensive, and it WAS the bug.** Its own comment claimed to
prevent a failure it caused. The correct test is an explicit null/undefined check
followed by `String()` conversion, which distinguishes a Java String, a JS string and a
missing value.

🚨 **THE HARNESS STAYED GREEN THROUGHOUT** — its mock returns a real JS string. **Node is
not the engine, in the mocks as much as in the syntax.** A sweep found the same mistake
in `tide.js`, where it silently denied godless players the higher varied-wave rate. Four
files fixed.

---

## 🔴 D-107 — `/im` said `reachable: true` and then failed every send

```
InternalError: Java class "toni.immersivemessages.api.ImmersiveMessage"
has no public instance field or method named "builder".
```

🔑 **`Java.loadClass()` returns the `java.lang.Class` OBJECT**, so `.builder` was looked
up as an *instance* member of `Class`. Reaching a **static** needs a type wrapper.

⚠️ **The probe measured the wrong thing.** It checked that the class loaded and reported
success — which is exactly the "I failed / I found nothing" collision this project keeps
paying for, committed by the code written to avoid it. **"Reached" now means the static
is callable**, verified by looking for `builder` on the handle.

⭐ Three routes are tried — `Packages.*`, `Java.type`, `Java.loadClass` — and **the winner
is logged**. Which one works is a property of this KubeJS build, not something to reason
out from here; the file was written reflectively for exactly that reason.

⛔ **Unverified until a boot.** If none of the three work, every caller stays on the boss
bar and the log says so in one line.

---

## ⚠️ D-108 — a recorded ruling was reversed by the wave table, and nobody was told

**OPEN — needs Ethan's word, one line either way.**

`tide.js` has said in its boot log, and `tide_harness.js` has asserted, since 2026-08-24:

> the miniboss stays hers either way — the variation is who came, not who sent them.

`waves.js` does the opposite. A **god-augmented miniboss wave is led by that god's own
boss**: `boss: (type === 'miniboss') ? spec.boss : null` — Wall's Mother Spider, Art's
Dark Vortex, Blade's Fallen Chaos Knight.

⚠️ **The old line was MY design note, not a quote from Ethan** — which is exactly why it
was about to be reversed silently. A note in his voice and a note in mine look identical
three weeks later.

⭐ The new behaviour is kept and **asserted explicitly** rather than assumed, because it
is defensible on its own: a wave Wall reached into, led by one of *her* minibosses, reads
as neither god's. But it is a reversal of something written down, so it is filed rather
than absorbed.

⛔ **What is NOT in question:** an ordinary tide's miniboss still comes from her `BOSSES`
list or is the Taker. The reversal is scoped to god waves and the harness proves it.

---

## 🔴 D-109 — `tide_undead_check.py` certified 0 mobs and printed a clean bill of health ✅ FIXED 2026-08-30

The 08-29 roster rewrite deleted the `SHALLOW` / `DEEP` / `DEEPER` bands. The checker
still looked for them:

```
m = re.search(r"var %s = \[(.*?)\]" % band, src, re.S)
out[band] = re.findall(...) if m else []          # <- None becomes "nothing to check"
```

Every loop over those bands ran **zero times**, and the summary printed

> OK - every mob in every band is undead

⭐ **Zero mobs checked, reported as success.** It exited non-zero only by accident, on an
unrelated stale-allowlist branch — so even the exit code was not evidence.

🔑 **"I failed" and "I found nothing" must never share a return value.** The project's own
rule, in the tool written to enforce a different rule. **An empty roster is now a hard
exit 2** with the band named, because no roster in this game is legitimately empty.

⚠️ **Cost:** the undead rule was unenforced for a day, across a roster rewrite that
touched every band. That is the window in which Wall's spiders entered a wave table
unchallenged — they turned out to be fine (god rosters are exempt by design, and the
exemption is now printed rather than assumed), but nothing had checked.

---

## 🔴 D-110 — the undead tag reader dropped nested tags and invented four findings ✅ FIXED 2026-08-30

Repairing D-109 immediately produced four failures:

```
GHOST_FODDER :: goety:wraith · goety:border_wraith · goety:muck_wraith
GHOST_LIGHT  :: goety:reaper
```

**All four were wrong.** goety's contribution to `#minecraft:undead` is almost entirely
*by reference*:

```
data/minecraft/tags/entity_type/undead.json
    values: ["#goety:reapers", "#goety:wraiths", "goety:haunted_armor", ...]
```

and the reader kept only values that do **not** start with `#`. Minecraft resolves nested
tags transitively; a reader that does not is not reading the set the game reads.

⭐ **Measured, not argued: 89 ids flat vs 133 resolved.** The check had been testing
against a **third of the tag missing**, so it could have passed a genuinely wrong roster
as easily as it failed a right one.

🔑 **Measure at the point of USE.** Third time this class has cost this project real time.
The resolver is recursive with cycle protection, and is verified by controls in both
directions — `minecraft:zombie` and `goety:wraith` in, `minecraft:creeper` and a planted
fake out.

---

## 🔴 D-111 — `/im` reported `reachable: true` and then failed every single send ✅ FIXED 2026-08-30

**Found by**: Ethan's own in-game test. Four screenshots, everything passing except one —
*"the only major concern is /im see above everything else has passed"*.

`immersive.js` reached ImmersiveMessage reflectively and probed itself at boot. The probe
said the API was reachable. It was not callable. On the 00:11 boot **all three routes
failed**:

```
Packages.toni.immersivemessages.api.ImmersiveMessage   -> no callable builder
Java.type(...)                                         -> no callable builder
Java.loadClass(...)                                    -> the java.lang.Class OBJECT;
                                                          statics are not members of it
```

🔑 **The probe measured class LOADING; the code needed static CALLABILITY.** Those are
different questions and the probe answered the easy one. Fourth instance of measuring at
the point of definition instead of the point of use.

🚨 **And the harness was green the entire time.** Every assertion was a substring match:

```js
ok('⭐ the shim reaches ImmersiveMessage',
   im.indexOf("'toni.immersivemessages.api.ImmersiveMessage'") !== -1, true)
```

The class name *appears in the file*, so it passed — and would have passed if `show()`
had been deleted outright. A substring match proves a string was **typed**, never that it
**runs**. Seventh weak-assertion instance on this project.

### The fix — and the thing that could not be guessed

The mod ships a command. `javap` on `ImmersiveMessagesCommands.class` gave the grammar
that four rounds of live probing could not:

```
/immersivemessages sendcustom <player> <data:CompoundTag> <duration:float> <text...>
                                       ^^^^ THE NBT COMES SECOND ^^^^
```

⚠️ Every other Minecraft command takes its value arguments before a compound tag. This one
does not. That single inversion is why `sendcustom @a 4.0 {}` answered **"Expected '{'"**
with a brace sitting right there in the input — the parser had already consumed it.

**Two properties of the tag would have failed silently**, and both are now pinned by test:

* **`anchor` is `getInt` — the ORDINAL, not the name.** `anchor:"TOP_CENTER"` is read by
  `getInt` as `0`, which is `CENTER_CENTER`. Every god line would have appeared dead
  centre and looked deliberate. Nothing errors, nothing logs. Same for `align` and
  `obfuscate`.
* **The switches are presence-only.** The mod calls `contains()` and never reads the
  value, so **`shake:0b` still shakes**. "Off" has to mean the key is absent; a key set
  false is a key set true.

Ordinals read out of the jar, not guessed — `TextAnchor`: 0 CENTER_CENTER · 1 CENTER_LEFT ·
2 CENTER_RIGHT · 3 BOTTOM_CENTER · 4 BOTTOM_LEFT · 5 BOTTOM_RIGHT · **6 TOP_CENTER** ·
7 TOP_LEFT · 8 TOP_RIGHT. `ObfuscateMode`: 0 NONE · 1 FULL · 2 LEFT · 3 RIGHT · 4 CENTER ·
**5 RANDOM**.

### What stops it recurring

`tools/immersive_harness.js` **executes** immersive.js against stubbed KubeJS globals and
reads the command string it hands the server. 37 assertions. Six deliberate mutations —
wrong ordinal, swapped argument order, `rc=0` treated as success, § codes left in the
body, a presence flag emitted as `false`, and reflection creeping back — were each
confirmed to turn it **RED** before it landed. ⭐ *A harness that cannot fail is not
evidence.*

The handler ends `iconst_1; ireturn`, so **0 is a real failure** and every caller falls
back to its boss bar. "I failed" and "I found nothing" do not share a return value.

⛔ **Do not re-attempt reflection in that file.** The header says so at length, and a test
now fails if `Java.loadClass`, `Java.type` or `Packages.` reappears.

### Still open

⚠️ **Unverified in Rhino.** Node running the shim is not proof — `node --check` has passed
code Rhino rejected before. `rhino_lint.py` is clean and the file is deployed, but only a
boot settles it, and the restart is Ethan's call.

⭐ **`font` is a tag key** (a string). That is a direct answer to the question he deferred:
*"It depends on if we can get fonts working cleanly. Scratched messy text with occasional
bolded or colored words for emphasis looks a hell of a lot better than just flat colored
text."* `/im codes` and `/im font` are built to settle whether inline § emphasis survives
the send, or whether emphasis has to come from the tag keys instead.

---

## 🔴 D-112 — C1 was marked done for sixteen days and never reached the world ⚠️ OPEN

**Found by**: building a pre-flight for C2 and pointing its first check at the instance
instead of the repo.

`pack/config/tectonic.json` was set to `min_y: -64` on **2026-08-14** and C1 was treated
as complete. `C:\MCServer\instance\config\tectonic.json` — **the only copy world
generation reads** — was still `-128` on **2026-08-30**.

⚠️ **Config does not travel by packwiz.** `pack/config` is not in `index.toml`, so no
mechanism was ever going to carry that change across, and nothing anywhere said so. The
repo copy was a statement of intent that read like a completed task.

🔴 **C2 is the only irreversible chunk in the plan.** Every other chunk can be reverted;
this one bakes its inputs into terrain. Generated at `-128`, C1 would have been silently
wrong forever, with a ✅ beside it.

### The wider finding

`pack/config` holds **64 files**; the instance holds **961**. There is no sync in either
direction. Comparing them (normalising line endings, which the mods rewrite at every
boot) leaves three real differences and six repo files absent from the instance:

| file | state |
|---|---|
| `tectonic.json` | 🔴 repo `-64` / instance `-128` — **C1** |
| `incontrol/spawn.json` | ⚠️ real content difference, **identical mtimes**, so timestamps cannot say which is newer |
| `toughasnails/*.toml` | ✅ identical apart from CRLF — noise, not drift |
| 6 repo files | ⚠️ absent from the instance entirely |

⚠️ **`incontrol/spawn.json` is the one to look at before C2.** The difference is not only
an extra denied mob — a `"result": "default"` rule sits at position ~4 in the repo and
near the end in the instance. **InControl evaluates in order and the first match wins**,
so that reordering changes which rules are ever reached. Whichever way it is resolved, it
should be resolved deliberately rather than by whichever file someone copies last.

### What stops it recurring

`tools/reset_preflight.py` — a gate, not a report. It **reads the instance, never the
repo**, on the principle that the repo records intent and the instance is what runs.
Checks: tectonic `min_y` + `ore_fix` consistency · C4's four-place removal · packwiz hash
integrity · modlist↔resolved parity · repo↔instance config drift · a recent backup · and
**the server being down**, because generation must not race a live one.

🔑 **An UNKNOWN exits non-zero.** A check that cannot answer has not passed — the same
rule the live-path smoke enforces, and the one the dependency checker broke when it
printed *"MISSING DEPS: none"* while every request errored.

### 🔴 Three things went wrong while writing the gate itself

* **Its modlist extractor lied three times.** First it walked the top-level dict and took
  `_comment`, `game_version`, `budget` as mod slugs — **"324 mods missing"**. Then it read
  only `categories` and reported **6**. Then it learned that the shader and resourcepack
  sections spell the list `packs`, not `mods` — **0**, which is the truth. ⚠️ *Every wrong
  answer was plausible and none of them errored.* A surprisingly **alarming** result
  deserves the same suspicion as a surprisingly clean one.
* **The `ore_fix` check only ran when `min_y` was already wrong.** In the one case where
  it had any value — `min_y` correct, `ore_fix` stale — it returned early and said
  nothing. Caught by `tools/test_reset_preflight.py`, not by reading it.
* **I marked C1 ✅ DONE in the gameplan before checking the instance**, which is the
  eighth lying banner on this project and was written by the same hand that keeps filing
  them. The row now says NOT DONE and names the instance value.

`tools/test_reset_preflight.py` proves the gate can fail: 16 cases across missing files,
unparseable files, genuine drift, stale hashes, and shapes the extractor does not
understand. ⭐ *A gate that cannot fail is a banner.*

### Still open

* ⚠️ **C1 itself.** The instance is still `-128`. It is deliberately **not** being changed
  under a running server with two players on it — the fix belongs in C2's pre-flight,
  where it will be verified rather than assumed.
* ⚠️ **`incontrol/spawn.json`** needs a ruling on which copy is authoritative.
* ⚠️ **`simple-hats`** is RESOLVED but also listed under `unavailable`/`cut_for_budget`.

---

## 🔴 D-111 — `goety:haunted_armor` was in a shipped roster and spawns nothing ✅ FIXED 2026-08-30

Measured four separate times, against a control that passed every time, with and
without AI: it answers `summon` with **"Summoned new Haunted Armor"** and is gone a
second later.

⭐ **NOTHING ELSE IN THIS REPO COULD SEE IT.** The registry probe says the id is real —
it is. The stats probe measured it at 25 hp — it reads faster than the mob despawns. The
undead check says it is undead — it is. Every harness passes, because the id is a string
in a list and it is the *right* string.

🔑 **The property that matters is not "does this id exist", it is "does it still exist a
moment after you place it".** One slot of every ghost wave was spawning nothing.

New instrument: **`tools/spawn_persist_check.py`**, and it is now the gate for any
roster change.

---

## 🔴 D-112 — Art's roster is two-thirds inert and his boss never spawns ⚠️ OPEN (needs a ruling)

```
born_in_chaos_v1:restless_spirit     0/3 survived     (control 3/3)
born_in_chaos_v1:dark_vortex         0/3 survived     ← his BOSS
born_in_chaos_v1:scarlet_persecutor  3/3 survived
```

⚠️ **This is wider than the tide.** The same three ids are `spawn_pressure.js`'s roster
for **Art's own attacks**, so two thirds of everything Art has ever thrown at anyone has
been placing nothing.

**Done:** both broken ids removed from `tide.js`, `waves.js` and `spawn_pressure.js`. A
god that declares no working boss now falls back to **her** miniboss — no lore invented,
and it is what the file did before D-108.

⛔ **NOT DONE, AND DELIBERATELY:** Art has not been re-rostered. The god rosters are
Ethan's — he gave them verbatim — and picking two replacement mobs is a lore call, not a
bug fix. Measured, persistence-checked candidates for his ruling:

| id | hp | armor | dmg | |
|---|---|---|---|---|
| `born_in_chaos_v1:swarmer` | 40 | 4 | 4 | |
| `born_in_chaos_v1:zombie_clown` | 35 | 4 | 3 | |
| `cataclysm:aptrgangr` | 160 | 10 | 18 | boss-weight |
| `cataclysm:kobolediator` | 180 | 10 | 14 | boss-weight |

---

## 🔴 D-113 — the wave table tuned the wrong axis, and every test agreed with it ✅ FIXED 2026-08-30

> Ethan, after fighting three wave types: *"tides should be 80% fodder, 20% specalists
> per wave."*

The table had `ranged: 0.65` — **the share of the wave that SHOOTS**. But every archer in
this pack is a *specialist* on his own table, so a 65% ranged wave was a **65% specialist
wave**: more than three times the 20% he wants, and six times the 10% a general wave
wants.

🔑 **Fodder-vs-specialist is a ROLE axis; ranged-vs-melee is an ATTACK-TYPE axis.** One
number was doing both jobs, and the role axis is the one he tunes by playing.

⚠️ **The harness asserted the wrong axis too, and passed.** `'⭐ ranged waves are majority
ranged'` was *true* — of a number that meant something else. A green test is not evidence
that the thing under test is the thing you meant.

Also fixed in the same pass: **rounding**. A 6-mob horde wave at 5% wants 0.3 specialists,
and `Math.round` makes that **0 every single time** — "5%" would have rendered as "never".
The fractional part is spent as a probability instead.

---

## 🔴 D-114 — `spawn_persist_check.py` crushed its own subjects and blamed the mobs ✅ FIXED 2026-08-30

Its first run reported three GOOD roster entries as vanishing — `goety:haunt` (6 hp),
`goety:reaper`, `born_in_chaos_v1:corpse_fly` (10 hp). Each then passed **5/5** summoned
alone.

The tool put a whole batch on **one block**. Seven mobs sharing a position crush the
fragile ones, so it was measuring its own crowding and calling it a mod bug.

⭐ **A SURPRISINGLY BAD RESULT IS A PROMPT TO RE-CHECK THE QUERY, exactly as a
surprisingly clean one is.** Believing that run would have deleted three working mobs on
evidence the instrument manufactured. Batches are spread 3 blocks apart now, and the
tool is verified in both directions — it still catches all four known-broken ids.

---

## 🔴 D-115 — the undead check printed an empty god list under an "OK" ✅ FIXED 2026-08-30

One day after D-109 was fixed, in the same tool. Its god-roster regex matched `ids: [...]`;
the rosters were split into `fodder:`/`spec:` hours later, it matched nothing, and the
exemption list **this tool exists to make visible** printed as a blank section above the
word OK.

⚠️ **Fixing the regex was the smaller half.** The shape will move again. An unparseable
god list is now a hard exit 2 — because the only durable defence against this class is
that **empty is never silent**, not that the current pattern happens to be right.
