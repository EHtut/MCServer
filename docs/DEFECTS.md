# DEFECTS — findings with IDs

> **New 2026-08-29.** Until now every finding lived in a commit message or in the
> numbered doc of whatever chunk turned it up. That works while you remember the chunk
> and stops working the moment you do not.
>
> ⭐ **One entry per defect, with an ID, whether it is open or fixed, and what it
> actually cost.** A fixed defect stays here - the lesson is the point, not the status.
>
> 🔴 **IDs COLLIDED ONCE — 2026-08-30. Take the next free ID at WRITE time, not at the
> start of your session.** Two channels were filing in parallel; this one read the
> highest ID before a long piece of work and filed D-111/D-112 hours later, on top of
> another channel's D-111/D-112. Renumbered to **D-116/D-117**. ⚠️ `tools/config_sync.py`
> still refers to the OTHER D-112 and is correct — do not "fix" it.
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

## ✅ D-108 — a recorded ruling was reversed by the wave table ✅ RULED 2026-08-30

**RULED: Ethan, one word — *"d108 - yes."*** The reversal stands. `tide.js`'s boot line
and the harness both state it as settled rather than open, and her own miniboss waves
still draw from her own list.

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

## 🔴 D-116 — `goety:haunted_armor` was in a shipped roster and spawns nothing ✅ FIXED 2026-08-30

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

## 🔴 D-117 — Art's roster is two-thirds inert and his boss never spawns ✅ RULED 2026-08-30

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

✅ **RULED:** *"it should always just be born in chaos' lifestealer."*

⭐ **And that is the same mob as the Taker.** `tide.js` already sends
`born_in_chaos_v1:lifestealer` into *her* waves 6% of the time as a tell, on the note
*"Art is just kayer and she is already secretly aligned with the goddess of death."* So
the rare thing marching in her army and the thing leading his wave are one creature — the
alliance stated twice, in two mechanics, and nowhere in words.

⚠️ Consequence worth knowing before somebody reads it as a bug: the Taker substitution is
a no-op on an Art miniboss wave, because it would replace the Lifestealer with itself.

Every god declares a working boss again, so the "falls back to hers" path is now asserted
**unused** — a safety net that is silently load-bearing is not a net.

The candidates below went unused and are kept only as measured record:

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

---

## ✅ D-118 — Salvage's pack boss summons its own pack ✅ RULED IN 2026-08-30

The dire-wolf run turned up exactly one boss-weight candidate, and it is a good one:

```
born_in_chaos_v1:dire_hound_leader    100 hp / 0.5 armor / 10 dmg / 0.7 knockback-resist
```

Named "Dire Hound Leader", statted like a pack boss, and **its class references
`DreadHound` + `EntityType` + `spawn` + `finalizeSpawn`: it summons its own pack.**

🔑 That is the multiplier-inside-a-multiplier the no-summoner rule exists for — but that
rule was written for a **24-mob tide wave**, and Salvage has no tide wave at all (his
ruling). Her roster feeds her own events through `spawn_pressure.js`, which caps at 6.

✅ **RULED IN, and the rule went with it:** *"Yes that. No summoner rule no longer applies
that is redundant, cut it from everywhere it is mentioned."*

⭐ A pack leader that calls its pack is what a pack is. The rule it violated was never
measured, and what actually bounds the risk is `MAX_ALIVE_NEAR` — a real ceiling on live
tide mobs near a player — rather than a ban on a category. Swept from waves.js,
spawn_pressure.js, waves_harness.js, docs/72 and docs/74; the remaining mentions are
past-tense headstones, which is the correct end state for a rule that shaped rosters.

⚠️ **Anything excluded SOLELY for summoning is eligible again and has not been
re-evaluated:** goety `wight` / `grave_golem` / `skull_lord` / `wither_necromancer`, the
`bound_*` casters, `irons_spellbooks:necromancer`. Not added — nobody has asked for them.

⚠️ **The same method cleared two mobs earlier the same day** — `goety:bone_lord` and
`goety:rattled` both *sounded* like summoners and both turned out to extend
`AbstractSkeleton` with no spawn calls. It discriminates in both directions, which is why
this finding is worth acting on rather than hedging.

---

## ⚠️ D-119 — Salvage has no specialist tier, and the mobs for one do not exist

Not a bug; a measured gap, recorded so it is not rediscovered. Every wolf in this
300-mod pack is fodder on his own rule:

```
hostile_black_wolf 10/0/4   winter_wolf 10/0/4   hunter_wolf  8/0/4
hellhound          10/0/4   stormhound  10/0/4   dread_hound 17/0.5/5
```

8–17 hp, no armour, 4–5 damage. **Her pressure is numbers and speed**, which suits a pack
and is a real identity rather than a shortfall. But if she should ever hit *harder*, there
is nothing in the pack to promote — the only heavier wolf is D-118's leader, which is now
rostered as her BOSS rather than as a specialist.

✅ **Ethan closed this on 2026-08-30 without needing a specialist tier:** *"Salvage does
not even augment tides."* Her wolves are for her OWN events, never a tide, so the missing
middle matters far less than it would for a god who augments.

---

## 🔴 D-120 — `spawn_persist_check.py` was not reading every roster file ✅ FIXED 2026-08-30

It scanned `waves.js` and `tide.js`. Six wolves were added to `spawn_pressure.js` in the
same chunk, and the sweep reported **"OK — every rostered mob"** while six of them had
never been checked.

⭐ **The gap was invisible in the worst way**: the tool did not fail, it succeeded about a
smaller set than anyone thought it covered. Same shape as D-109 — the answer looked like
a clean bill of health because the question had quietly narrowed.

Also fixed in the same pass: the roster scan is deliberately over-broad, so
`minecraft:overworld` (a **dimension**) came through and was reported as *"vanishes on
arrival"*. **"Not an entity" is now a third state**, decided by asking the summon itself
rather than by maintaining a blocklist that would go stale.

---

## 🔴 D-121 — "god-augmented" was built as REPLACE, and every test agreed ✅ FIXED 2026-08-30

> Ethan: *"All tides have the general mobs in them, god augmented tides are Augmented!
> with that gods' mobs, They do not overwrite the existing tide cast at all."*

`pick()` returned the god's roster **instead of** hers. A "Blade wave" was a wave of
zombies rather than her dead with his zombies in it.

🔑 **That inverts the thesis at exactly the wrong moment.** The tide is the goddess of
death's; under replacement it stopped being hers the instant another god touched it.

⚠️ **EVERY TEST PASSED, and they were all asking the wrong question.** Four assertions
checked that a god wave contained *that god's* mobs — true, and not the point. **Nothing
asked whether hers were still in it.** A whole mechanic was inverted under a green suite,
which is the same shape as D-113: the tests were right about a thing that meant something
else.

**Now:** her cast is built first, always; the god's fodder joins her fodder and his
specialists join her specialists, so his ratios are untouched. Measured after the fix —
a Blade general wave is **13 of hers + 5 of his**, Wall **13 + 3**, Art **13 + 1**.

⭐ **The one thing that still overrides is the miniboss** (D-108, ruled) — a wave cannot
have two, since the cap is one per tide.

⭐ **And it retroactively fixes a sizing worry.** Wall is four spiders; under replacement
that was a thin wave, and under augmentation it is her full tide with spiders in it —
which is what "Wall reached into her water" should feel like.

---

## ⚠️ D-122 — Wall's spider faction contained a crab, two flies and a termite ✅ FIXED 2026-08-30

> *"wall's tide has flies and a crab... it should only be spiders."*
> *"only take things with the naming of spider"*

I built Wall's roster off `#minecraft:arthropod` and stat lines. **The tag is arthropods;
he asked for spiders** — so it admitted `corpse_fly`, `thornshell_crab`,
`diamond_termite`, `silverfish` and two "scuttlers".

⚠️ **AND I WAS SOLVING IT THE WRONG WAY WHEN HE STOPPED ME.** I had started counting
model bones to adjudicate the two scuttlers — eight legs on one, six on the other — and
he cut it short with the actual rule: **the name**. A faction is *authorship*, not
anatomy. It is defined by what he calls a spider.

🔑 **This repo has been burned three times by matching on names** (`art` inside "heart", a
case-sensitive grep, banshee-as-archer) and the lesson does not apply here: those were
*inferences* from names, this is a *definition* by name. Worth keeping straight, because
the harness now asserts on a name substring and that would otherwise look like a
regression to a rule this project spent real time learning.

Wall is now `spider`, `cave_spider`, `baby_spider` and `mother_spider`.

---

## 🔴 D-123 — three stacked bugs in the overlay, and the last one survived because I overrode evidence ✅ FIXED 2026-08-30

**Cost**: a full session of Ethan's evening, five restarts, and three rounds of test
messages fired at a screen he was tabbed away from.

The god-dialogue overlay rendered nothing. It was not one defect but **three**, each
masking the next, and each one produced a *plausible* wrong explanation:

### 1. `4.0f` — two parsers, one helper

The duration is a Brigadier `FloatArgumentType` and rejects the `f` suffix. Inside the NBT
the suffix is **required** — SNBT needs it to make a float tag. One helper served both.

```
immersivemessages sendcustom Rehykt {...} 4.0f The tide is rising.
                                         ^ Expected whitespace to end one argument
```

🚨 **The harness asserted `/\} 4\.0f /`** — it encoded the defect as the expectation and
went green on it. A test written from the implementation tests the implementation.

### 2. `fadein` + `fadeout` are mutually exclusive

The command handler is an `if / else-if / else`, not two independent ifs:

```
if contains("fadein")       -> fadeIn(x);  GOTO END   <- skips fadeout entirely
else if contains("fadeout") -> fadeOut(x); GOTO END
else                        -> fadeIn(); fadeOut()    <- both, properly paired
```

Sending both silently dropped the second, leaving a fade-in and **no fade-out configured**.
Lines typed themselves out and vanished after about a second. Every line that WORKED sent
neither key and landed in the `else`, getting the mod's paired defaults.

🔑 **A bug in the mod, not in the values.** The fix is to send neither and let it default.

### 3. 🔴 The `y` sign — and this is the one worth remembering

`y` grows **downward** in GUI space, so a positive `y` from a BOTTOM anchor pushes the line
off the bottom edge. It renders perfectly and nobody can see it.

**I diagnosed this correctly and then talked myself out of it.**

```
3d5b728  HOTBAR_LIFT = -40  ->  "i saw something type out ... at my hotbar level"
e8eb228  HOTBAR_LIFT = +60  ->  nothing, for the rest of the night
```

A `/gd place` sweep rendered `y = -60` **in a screenshot**. Ethan then recalled that
negative and positive had landed in the same place, and I took the recollection over the
photograph. He was describing seven stacked lines from memory; only one was in the picture,
and that one was negative.

⭐ **A SCREENSHOT OUTRANKS A RECOLLECTION.** Not because the person is unreliable — because
they were answering a different question than the one I needed answered, and I did not
notice the difference.

### What actually broke the deadlock

**Logging the command verbatim.** Three rounds were spent reasoning about which tag key was
at fault while the one fact that would have settled it — the exact string that reached the
server — was never written down anywhere.

```
[immersive] SENT #10: immersivemessages sendcustom Rehykt {anchor:3,y:60.0f,italic:1b} 45.0 ...
```

One line of log, and the answer was visible immediately: that is the sweep line that
rendered, plus one flag, with the sign flipped. `immersive.js` now logs its first 40 sends.

🔑 **Instrument before the third round of reasoning, not after the fifth.**

### The other lesson: test on a screen someone is looking at

Three rounds of rcon test messages were fired while Ethan was tabbed out orchestrating, and
"none" came back twice from a screen nobody was watching. ⚠️ **A test the user has to be
present for must be a command THEY run**, not something fired on my schedule. `/gd` exists
for that reason and should have been the first move, not the fourth.

### Still open

* ⚠️ **The typewriter.** `tickTypewriter` reveals one character per `1.0 / typewriterSpeed`
  and `sendcustom` hardcodes `typewriter(1.0f, false)` — the speed is unreachable from this
  route. `TYPEWRITER` is `false` behind one named switch until `/gd type` measures whether
  a character costs a tick or a second. It gates every "typed" line in `docs/75`.

---

## 🔴 D-124 — three mobs I added were fighting the tide they arrived in ✅ FIXED 2026-08-30

> Ethan, from play: *"there were skeletons with glowing blue eyes that immediately
> started attacking and killing all the other enemies in the tide."*

| mob | why | added |
|---|---|---|
| `iceandfire:dread_thrall` | `DreadAITargetNonDreadGoal` | today |
| `iceandfire:dread_knight` | same | today |
| `goety:skeleton_wolf` | `Summoned$NaturalAttackGoal`, a servant with no owner | today |

Glowing blue eyes are the Ice and Fire **Dread army's** signature, and
`DreadAITargetNonDreadGoal` is an AI goal whose entire job is attacking anything not
dread. Her skeletons are not dread.

⭐ **NOTHING ELSE IN THIS REPO COULD SEE IT.** The ids are real, measured, undead, and
survive being summoned. Every harness passes — they are the right strings in the right
lists. The defect is in how the mob **behaves once it is standing there**.

### 🔴 AND MY LIVE "CONFIRMATION" WAS FALSE

I reported *"prey dropped 15.0 → 13.0 HP, confirmed live."* **It was daylight, the test
was at y250 under open sky, and skeletons burn.** A control with no attacker in the world
dropped 15 → 4. I had measured sunlight and called it combat.

Re-run with fire resistance, the control held — and then *everything* read as innocent,
because `NoGravity` mobs three blocks apart cannot path to each other. ⚠️ **The bench can
prove infighting present; it cannot prove it absent.** What settled this was his
observation plus the goal name, and the file says so rather than claiming a measurement.

New screen: **`tools/infight_check.py`**, which found `skeleton_wolf` on its first run.

---

## ⚠️ D-125 — ten of twelve rostered goety mobs are servant-class ⚠️ WATCH (tested, not cut)

Chasing D-124 I walked the class hierarchy and found that most goety mobs in her rosters
are **servants** — entities designed to be summoned by a player or necromancer:

```
wraith / border_wraith / muck_wraith   AbstractWraith  -> Summoned
reaper                                 AbstractReaper  -> Summoned
haunt                                  Summoned
hostile_black_wolf / hellhound / stormhound / winter_wolf   BlackWolf -> AnimalSummon
```

Only `bone_lord` and `rattled` are ordinary hostiles (`AbstractSkeleton`).

⛔ **NOT ACTED ON, and that is deliberate.** A live test showed an ownerless wraith
sitting inert next to her skeletons for twelve seconds — no target, no damage. Only
`skeleton_wolf` carries an actual attack goal, and that one is removed. **Cutting ten
working mobs on a class name would have gutted the ghost faction on inference.**

### ⭐ RE-TESTED PROPERLY, 2026-08-30 — the risk is much smaller than the names suggest

The original evidence was one wraith watched for twelve seconds, which is not evidence.
Re-run over **90 seconds** with all four servant ghosts, the reaper, and two known-good
controls:

```
t+30s / t+60s / t+90s   wraith · border_wraith · muck_wraith · haunt · reaper   ALL PRESENT
                        (controls: decrepit_skeleton, phantom — also present)
```

🔑 **An ownerless goety servant does not evaporate.** The specific fear — that her whole
Alternate faction would thin out mid-wave because four of its six mobs are servant-class —
does not happen.

⚠️ **ONE LIMIT ON THAT TEST, STATED RATHER THAN GLOSSED:** it used
`PersistenceRequired:1b`, and **the tide does not** — `spawner.js` appends only the caller's
nbt, which for a tide is the tag alone. So this proves no *mod-custom* despawn; it does not
prove behaviour under vanilla despawn rules.

⭐ **And vanilla despawn is correct here, checked rather than assumed.** Tide mobs arrive
5–11 blocks away and path toward the player, so they sit inside the 32-block no-despawn
radius for the whole fight; past 128 blocks they clear themselves, which *complements* the
idle sweep (D-126) rather than fighting it.

⚠️ **Still worth watching in play:** servants following nobody, refusing to path, or going
inert. The attack-goal half is covered statically by `tools/infight_check.py`.

---

## ⚠️ D-126 — a tide run ended and its mobs stayed forever ✅ FIXED 2026-08-30

Death, dawn and surfacing each reset `runs[uuid]` and **left the mobs standing**. Nothing
removed them: `MAX_ALIVE_NEAR` stops more *arriving* and never clears what is there. Every
tide anyone had ever run was still loaded somewhere.

> Ethan: *"we will need to build a natural despawn system... if all players die or if no
> mobs slain in 5(?) minutes the tide despawns. this is for server cleanliness and lag."*

⭐ **Keyed to KILLS, not elapsed time** — a long hard fight keeps resetting the clock; a
player who walked away does not. Death and logout despawn immediately; dawn and surfacing
deliberately do **not** (his old ruling: no more come, but the ones chasing you do not
evaporate), so a slow orphan scan collects those five minutes later.

⚠️ `discard()`, never `/kill` — no loot, no XP, no death handlers, nothing feeding the
slain counters the tide reads back.

🔑 Every exit now routes through one `endRun()`, and the harness asserts **exactly one**
place resets a run, so a future exit cannot forget to clean up.

---

## 🔴 D-127 — two of rhino_lint's three rules were dead, and reported clean ✅ FIXED 2026-08-30

A shell heredoc ate an escape level and wrote a real **0x08 BACKSPACE** into
`tools/rhino_lint.py` where a word-boundary was meant. Twice. Both regexes became
searches for a backspace byte:

| line | rule | became |
|---|---|---|
| 211 | within-file function redeclaration | `/<BS>function\s+.../` |
| 241 | a `Commands.<factory>` that does not exist | `/<BS>Commands\..../` |

A pattern that looks for a backspace matches nothing, ever. Both rules ran green over
68 scripts every time they were invoked.

⭐ **THE REDECLARATION RULE HAD NEVER RUN.** It was added the same day, specifically
because a duplicate `overheard` in `pathless.js` took the whole file out of the 01:27
boot (65/66). It was vacuously green from the moment it was written to the moment it
was fixed — the instrument built in response to an outage could not have detected that
outage.

### How it surfaced

Not by inspection. `/whisperband` failed to register at boot on `Commands.integer`, and
the negative control written to prove the new rule catches that kept reporting **MISSED**
while an in-process replication of *the same loop*, retyped rather than heredoc'd,
returned the hit. The discrepancy was the whole signal: the difference between the two
was the transport, and the transport was corrupting the source.

🔑 **The tool's own header already named this failure** — *"a green assertion that cannot
fail is worse than a missing one"* — written after a heredoc put a 0x08 into a harness
on 2026-08-29. The rule was correct, documented, and enforced on `.js` only, so the file
carrying the warning was outside the sweep that would have caught it.

### Fixes

1. Both regexes repaired.
2. **The control-character sweep now covers `tools/*.py`, not just `.js`.** The tool now
   watches its own language; it would have caught this on the next run.
3. `tools/test_rhino_lint.py` — **6 mutation tests, one per rule.** Every rule is now
   fed input that must trip it. A rule that cannot be made to fail is not a rule.

### And the redeclaration rule's first live output was a FALSE POSITIVE

Once alive it flagged `watch()` in `blade_events.js` at lines 592 and 1012. It is legal:
two *sibling* closures, each with its own locals, and the boot log proves the file loads
(68/68, zero errors). The rule keyed `seen` by **filename**, which is the natural way to
write it and is wrong — a collision requires a shared **enclosing scope**. Now keyed by
the innermost enclosing brace offset, with a control test (case 2) that fails if anyone
reverts to file-keying.

⚠️ **Both halves of this are the same lesson.** The rule was first unable to fail, then
unable to be right. Neither state was visible from a green run.

---

## 🔴 D-128 — 591 lines of dialogue cannot be put in front of the writer

Found while building the dialogue-refresh backlog item (E7). `tools/dialogue_doc.py` maps
each god to **exactly one file**:

```python
FILES = {"blade": "blade_voice.js", "art": "art_voice.js", ...}
```

and loads only that file. Everything written anywhere else is not filtered out — it is
never read. **591 lines across 27 files**, against 881 the documents do cover.

| file | lines | what it is |
|---|---|---|
| `deep_speaker.js` | 177 | Caebrim, both of her — the largest unreviewed block in the game |
| `introductions.js` | 98 | first contact with each god |
| `pathless.js` | 60 | the gods overheard by the pathless |
| `blade_events.js` · `salvage_events.js` · `wall_events.js` · `art_events.js` | 23 · 18 · 14 · 14 | **per-god lines that never went through the pools** |
| + 20 more | 187 | |

⚠️ **The `*_events.js` lines are the dangerous half.** A writer reading `blade.md`
reasonably concludes they have seen everything Blade says. They have not seen 23 of his
lines, and nothing in the document admits it. Silent partial coverage of a document whose
entire purpose is completeness.

### And a lying banner, fixed in the same commit

`tidewhispers.js` told the reader its fragments could be pulled into a document with
`python tools/dialogue_doc.py extract undead`. That command answers **`unknown god
'undead'`**. Registering through the voice pools is necessary and not sufficient — the
extractor must also know the speaker exists, and nothing had ever run the command to find
out. Written by me, never true.

### ⚠️ The measurement undercounted itself first

The first sweep found 309 lines. It matched only bare array entries and missed every
keyed field, so `salvage_deals.js` — which holds dialogue as `pitch:`/`yes:`/`after:` —
reported **zero**. A file with seventeen lines of dialogue read as having none.

🔑 The zero is what exposed it. A file known to contain drafts reporting none is a prompt
to re-check the query, not a finding — the standing rule, and it paid for itself here.

### Not the fix

⛔ **Do not move the off-pool dialogue into `registerLines`.** Those shapes are load-
bearing: a deal needs three linked strings, an introduction needs a named sequence, and
the pool API is a flat bag of interchangeable lines. Converting them would destroy the
structure to suit the tool. **The extractor learns to read them.** Filed as C6.

---

## 🔴 D-129 — the fonts were delivered, verified, and had never been loaded ✅ FIXED 2026-08-30

Ethan's screen, mid-test: Wall's line rendered as **thirteen magenta boxes**. Right
colour, right length, right place, every glyph a missing-glyph rectangle.

| | |
|---|---|
| client launched | **10:27:03** |
| `FontManager` built the font set (the only reload that session) | **10:27:45** |
| fonts copied into his instance | **10:58** |
| times `veldora` appears in the client log | **0** |

Every check the tooling had said delivered: right files, right folder, hashes verified,
inside `KubeJS File Resource Pack [assets]` — a pack genuinely present in the resource
stack, confirmed in the log. All of it was true. **Minecraft builds its font set once per
resource reload**, and there had not been one since the files arrived.

### ⭐ Why the symptom is tofu and not vanilla text

`Style.withFont` on a font that is not in the loaded stack does **not** fall back to the
default — it yields an **empty font set**, and an empty font set draws every codepoint as
the missing glyph. So the failure looks like a *broken font* rather than an *absent* one,
which sends you to inspect the TTF. The TTFs were fine (valid TrueType, valid `ttf`
provider JSON, correct namespace).

🔴 **`build_client_assets.py` actively pointed the wrong way.** Its closing line promised
that a client without the fonts *"will see vanilla text and no error"*. Written from
reasoning, never from a screen. Corrected in the same commit.

### ⚠️ And the check could not have been "is veldora in the log"

A font that loads correctly logs **nothing**. A font never asked for also logs
**nothing**. They are indistinguishable in the client log — so absence of `veldora` lines
proves nothing in either direction, and a check built on it would have been the third
unfalsifiable assertion this week.

The only question the evidence can answer is a timestamp comparison: **did the client
reload resources after these files landed?** That is now `check_loaded()`, run
automatically by every invocation of the tool, with three distinct answers —
`OK` / `STALE` / `UNKNOWN` — because *"I could not tell"* and *"no"* must never share a
return value. `tools/test_client_assets.py` proves all three are reachable (6/6).

Running it against the live instance reproduces the failure exactly:

```
🔴 STALE: files landed 10:58:50, client last reloaded 10:27:48 - it has NEVER seen them.
```

### The fix for Ethan

**F3+T in game, or relaunch the client.** No packwiz reimport — the files were already in
the right folder the whole time.

🔑 **This is `live_path_smoke`'s lesson in a second subsystem.** Configured, delivered,
hash-verified and doing nothing, with every instrument reporting success because every
instrument was measuring the write rather than the read.

---

## 🔴 D-130 — every god's font was rejected at load, since the day they were fetched ✅ FIXED 2026-08-30

Found by reading the client log after D-129's fix was applied and the screen was *still*
full of boxes:

```
Failed to load builder (veldora:wall: builder #0 from pack KubeJS File Resource Pack
[assets]), rejecting
java.io.FileNotFoundException: veldora:font/font/wall.ttf
```

Doubled `font/`. Every definition said:

```json
"file": "veldora:font/wall.ttf"
```

which reads as obviously correct and is wrong. Minecraft's `TrueTypeGlyphProviderDefinition`
calls `.withPrefix("font/")` on that value itself, so it resolved to
`assets/veldora/font/`**`font/`**`wall.ttf`. **All five gods, rejected on every load since
the fonts were first fetched.** They have never once rendered.

The correct form is `"veldora:wall.ttf"`.

### ⚠️ It was hidden by D-129, and the two are indistinguishable on screen

A **rejected builder** and an **unloaded pack** both end in an EMPTY font set, and an empty
font set draws every codepoint as the missing glyph. So both faults produce the identical
picture: rectangles at the right colour, right length, right place.

🔑 That is why fixing D-129 and reloading looked like *"the fix did not work"* rather than
*"there is a second bug underneath"*. **The client log named the real cause in one line,
both times.** It should have been the first thing read, not the fourth — the screenshot
could not distinguish the two failures and the log could.

### The generator wrote it, so fixing the files was not the fix

`tools/fetch_fonts.py` emitted `"veldora:font/%s.ttf"`. A re-fetch would have silently
restored the bug. ⭐ And the comment on the line directly above it already stated the rule
correctly — *"`file` resolves under assets/<ns>/font/"* — with the code adding the prefix
anyway. Documented and wrong within three lines of each other.

### The check that ends this class

`build_client_assets.py` now runs `check_providers()` **before copying anything**: it
resolves every provider's `file` exactly the way Minecraft does and refuses to ship a
definition that does not land on real bytes.

```
✓ all font definitions resolve to a real file
```

`tools/test_client_assets.py` is now 10 cases, including the control that matters: it
reconstructs all five shipped definitions and requires all five to be rejected. Without
it, a `check_providers` that simply returned `[]` would pass every other case.

### Standing lesson

⛔ **A screenshot cannot distinguish two failures that render identically. A log can.**
Two evenings were spent on the delivery chain — files, folders, hashes, resource stacks —
for a fault that was one line of the client log the entire time.

---

## D-131 — a four-sentence god line holds the screen ~50s, and nothing can warn you through it ⛔ OPEN

**Measured, not estimated** (`tools/voice_style_harness.js`, the four-sentence group):

| god | four sentences |
|---|---|
| Wall | **50.0s** |
| Forge | 36.6s |

Each sentence is individually correct. Ethan ruled from play that a line must stay up
**10–15s**, so `voice.beatFor` grew a 12s floor; four of those is fifty seconds.

⚠️ **The cost is that the mod plays one message at a time, FIFO, with no reorder and no
clear.** So for the length of a Wall ramble there is a window in which a tide warning
*cannot reach the player at all*. That is precisely the failure the old assertion
("under 15s for four sentences") existed to prevent — it was written when a sentence held
~3s, and it went red the moment the durations were raised.

🔑 **The referee cannot fix this.** `screen.js` may refuse to *accept* a line; it can never
jump one already queued. So the answer is not a priority number.

**⛔ Needs Ethan's ruling.** The two real options are shorter god lines, or a warning
channel that bypasses the message queue entirely. Do **not** quietly lower the per-line
floor to make the number go down — that reverses a ruling he made from play.

The assertion now splits: the safety property (no *single* sentence outlasts the referee's
model for a god) is asserted, and the aggregate carries a regression ceiling plus a name
that says it is open, so green is not read as "this is fine".

---

## D-132 — an aside can now arrive ~9s after the moment that prompted it ⚠️ OPEN, traded deliberately

`screen.js` `P.ASIDE` went 2.0 → **10.0**. It had to: Ethan reported the dead were
unreadable at 1.5s, so `HOLD.WHISPER` is now **9.5s**, and anything tolerating less than
~10s is **DROPPED OUTRIGHT** while a whisper plays — not delayed, discarded. At 2.0 every
interior line landing inside a whisper would have been silently thrown away.

⚠️ **The same number lets an aside queue behind a god.** It still cannot talk *over* one —
the mod is strictly one-at-a-time, so the queue enforces that by itself — but it can now
land up to ~9s late.

🔴 **For an aside that is arguably the wrong trade.** These are the player's own body
reacting — *"You hold your breath"*. Nine seconds late is not a late reaction, it is a
non-sequitur; a dropped one is merely absent. `screen.js` still carries my original
argument that "late is the better failure for an interior line" — that reasoning did not
survive seeing the number, and the comment is now marked as such.

🔑 **One knob cannot satisfy both.** Any value below 10.0 reintroduces the drop Ethan
actually complained about. The real fix is an **expiry on the aside** — accept it, then
discard it if it has not been shown within a few seconds — which is mechanism, not tuning,
and is not being built mid-test.

---

## D-133 — six harnesses went blind when registration moved and chat was switched off ✅ FIXED 2026-08-30

Another chat reported seven red harnesses "in files I've never touched". None of it was
game breakage; **every one was an instrument watching something that had moved.**

| harness | what it watched | why it went blind |
|---|---|---|
| `voice_style` | `voice.setStyle`, spied in an isolated god file | the pantheon refactor moved the call into `pantheon.define`, which the sandbox did not load — so the define threw and **no style was captured at all** |
| `warn` | blade/wall/salvage `warn_incoming` pools | same: three gods registering nothing, reported as *"blade has no real warn_incoming line"* |
| `grudge` | the exchange, via `player.tell` | dialogue was ruled out of chat, so `broadcast` now delivers through `voice.overlay` — which the sandbox never stubbed. **Both channels silent** |
| `announce` / `artdeal` | `player.tell(Text.of(paint(...)))` counts | that idiom now lives behind the single `voice.chat()` door |
| `deep_speaker` | `spk.forge.confession.length` | the confession was retconned away; this **crashed** the file rather than failing it, silently taking every later assertion with it |
| `confession` | `VELDORA.speaker.eligible` | the whole system is gone — rewritten as a removal guard |

### The two lessons

⛔ **A harness that dies partway reports the tests it never ran as nothing at all.**
`deep_speaker` threw on `undefined.length` and lost its remaining assertions with no
summary line. A crash and a failure must not look alike.

🔑 **When a ruling changes a channel, the tests measuring the old channel are the first
thing that breaks — and they break looking exactly like missing content.** *"blade has no
real warn_incoming line"* reads as unwritten dialogue; it was a missing dependency in the
sandbox. Every one of these was fixed by pointing the instrument at where the behaviour
went, **never** by weakening the assertion. Where a ruling genuinely inverted a contract
(god colours, Forge's shake, Art's crosshair lift, Caebrim's name) the assertion was
inverted and the ruling quoted beside it.

### Also found while fixing it

Two comments were arguing for behaviour Ethan had already overruled — `forge_voice.js`
still made the case for shake-and-scatter, and `art_voice.js` still said "CENTER_CENTER
with NO y" above a `y: -70`. Both corrected. ⚠️ **A stale comment outranks the code it sits
on when the next person reads it.**
