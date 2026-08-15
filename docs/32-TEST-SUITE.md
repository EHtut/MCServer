# The test suite — five built things nobody has ever touched

*Written 2026-08-14. Run this in one session, in order.*

**Why it exists.** E2d, E2e and E2f were built 2026-08-12 and never played. I1 and
I2 were built 2026-08-14 and are **boot-verified only** — which means the script
loaded and published its seam, and **nothing more.** It does not mean the scene
plays, the options click, the cooldown holds, or the XP strip fires.

This pack has a specific history here. The whole "things happen to you" layer sat
**silently dead for weeks** — the Harvest was mathematically unreachable, three of
four hunter mods were not installed, and the Helper had never once worked. Every log
looked healthy the entire time.

> ## The rule for this whole run
> **"It did nothing" and "it failed" are different results.** If a step produces no
> visible effect, that is a FINDING — write it down. Do not tick it because nothing
> exploded.

---

## Order matters — read this before starting

* **Refusing a patron silences it for one in-game day** (~20 min). So the refusal
  test (T5) must use a **different patron** from the acceptance test (T7), or you
  will be locked out mid-suite.
* **Accepting a path strips every level you have.** T7 is destructive by design and
  needs XP banked first.
* **T9 (the fall) locks you out of EVERY path for 3 in-game days.** It is last for
  that reason.
* Live claims: paths are one-walker-each. Keys are
  `forge` `art` `salvage` `blade` `crown` `wall`.
  Run `/path` first to see which are open.

**Recovery, learn these before you can get stuck:**

```
/ritual clear
```
```
/unstuck
```

---

## T0 — boot

Start the server, then confirm in the log:

- [ ] `Loaded 18/18 KubeJS server scripts ... 0 errors`
- [ ] `[ritual] VELDORA.ritual published OK (begin/release/active)`
- [ ] `[intro] VELDORA.intro published OK - 6 scenes, 12 silence lines`
- [ ] `[paths] claim store OK - exclusivity is enforced`

**If any seam line is missing, stop.** A missing seam means the scenes will silently
never run, which looks exactly like "nothing happened".

---

## T1 — the ritual primitive `/ritual test`

The safest test in the suite: no path change, no XP cost.

```
/ritual test
```

- [ ] screen goes **fully black** after ~1s
- [ ] **four red lines, one at a time, ~2.5s apart** — not all at once
- [ ] you **cannot move** (try walking)
- [ ] two options appear at the end, **underlined and white**
- [ ] clicking one prints `Good.` (accept) or `Of course.` (refuse)
- [ ] the world comes back

**Failure modes and what each means:**

| what you see | what broke |
|---|---|
| all four lines arrive at once | the stagger — `scheduleInTicks` |
| options are plain text, not clickable | `clickRunCommand` — grep the log for `clickRunCommand failed` |
| you can walk around | slowness amplifier too low |
| **you take damage / die** | 🚨 resistance failed — **stop and report**, this makes every scene dangerous |
| nothing at all happens | the seam, or `begin` returned false — grep `[ritual]` |

## T2 — the panic button

```
/ritual test
```
…then **mid-scene**:
```
/ritual clear
```

- [ ] released instantly, prints `Released.`
- [ ] no lingering blindness or slowness

## T3 — 🚨 J4, the hazard that can strand a player

The one failure that would actually hurt someone: disconnecting mid-scene and coming
back blind, rooted, with the scene that would have released you already over.

```
/ritual test
```
…then **disconnect immediately** (quit to title). Wait ~15s. Rejoin.

- [ ] you are **NOT blind** and **NOT rooted** on rejoin
- [ ] you see `You come back to yourself.`
- [ ] log shows `[ritual] recovered <you> from an interrupted ritual`

Then the probe half, which answers the underlying API question:

```
/introprobe logout
```
…disconnect within 2s, stay out ~15s, rejoin and read the log for `J4.tick` lines —
they record whether a scheduled callback still fires after its player leaves and
whether the captured reference goes stale.

## T4 — the double-click guard

The bug I found while wiring I2: a double-click used to run the accept branch twice,
and the accept branch grants a path and strips XP.

```
/ritual test
```
…then **click one option twice, fast.**

- [ ] second click prints `Nothing is waiting on you.`
- [ ] the closing line appears **once**, not twice

---

## T5 — an introduction, REFUSED

Non-destructive: refusing writes nothing. Pick an **open** path — `crown` if free.

```
/path crown
```

- [ ] black screen, **nine red lines** (6 arrival + 3 demand), staggered
- [ ] options are the patron's own words — `I will take my station.` / `I answer to no court.`
- [ ] click **`I answer to no court.`**
- [ ] three refusal lines play **while still in the dark**, then release

### 🚨 The P1 check — the most important assertion in the suite

```
/path
```

- [ ] you have **NO path** ("You have declared no path")
- [ ] `crown` still shows **`(open)`**

**If you have a path, or crown shows as yours or held — STOP.** That is the P1
desync and it means a refusal wrote something it must not have.

## T6 — the silence

Immediately after T5:

```
/path crown
```

- [ ] **one grey italic line**, e.g. *"You take a breath."*
- [ ] **no scene, no black screen, no red text**
- [ ] run it 3–4 more times — the lines **differ**
- [ ] log: `[intro] <you> reached for crown during its silence`

**If the full scene replays instead, the cooldown is not being written** — check the
log for `no world clock - NO REFUSAL COOLDOWN SET`.

## T7 — an introduction, ACCEPTED, and E2e

**Bank XP first.** Get to a known level (30 is a good number) and write it down.
Use a **different** open path from T5 — `wall` if free.

```
/path wall
```

- [ ] click **`Let us be closer.`**
- [ ] three acceptance lines play in the dark
- [ ] then the entry line in red, and `It took everything you had. (30 levels)`
- [ ] you walk Wall; guide books arrive; the server is told

**E2e, untested since it was built:**

- [ ] **your XP is actually 0** — check the bar, not the message
- [ ] log: `[paths] E2e <you> entered wall - stripped 30 levels`
- [ ] log does **NOT** contain `E2e xp strip did not stick`

## T8 — E2f, the voices

Built 2026-08-12, never tested.

```
/whisper_test
```

- [ ] a whisper prints, in the patron's register
- [ ] run several times — lines vary, and the anchor refrain recurs sometimes
- [ ] then just **play for a while** and confirm they fire on their own, unprompted

---

## T9 — E2d, the fall ⚠️ DESTRUCTIVE, DO THIS LAST

Revokes your path and locks **every** path for 3 in-game days.

```
/fall_test
```

- [ ] the patron's farewell line prints in red
- [ ] log: `[fall] ...` with the cooldown day recorded
- [ ] log does **NOT** contain `!! HALF-REVOKE` — that is the tag/claim desync
- [ ] log does **NOT** contain `no world clock - NO COOLDOWN WAS SET`

Then:

```
/path
```
- [ ] you have no path, and the path you lost shows `(open)`

```
/path blade
```
- [ ] refused: `No patron will have you yet.` + days remaining

---

## Afterwards — one command to sweep the log

```
grep -aE "\[ritual\]|\[intro\]|\[paths\]|\[fall\]|\[iprobe\]" C:/MCServer/instance/logs/latest.log
```

And specifically for things that should never appear:

```
grep -aE "HALF-REVOKE|did not stick|NO COOLDOWN|clickRunCommand failed|MISSING|recovered" C:/MCServer/instance/logs/latest.log
```

---

## ✅ RESULTS — run 2026-08-14, Rehykt

| # | test | result | notes |
|---|---|---|---|
| T0 | boot seams | ✅ | 18/18, 0 errors, all three seams |
| T1 | `/ritual test` | ✅ | staggered, rooted, clickable |
| T2 | `/ritual clear` | ❌→✅ | **FAILED FIRST RUN** — `potionEffects.remove()` does not exist and the silent catch hid it. Fixed (953f5a6), re-run passed |
| T3 | logout mid-scene (J4) | ❌→✅ | could not reconnect on the first attempt; no exception logged anywhere. Passed after restart. **Cause never identified — see below** |
| T4 | double-click guard | ✅ | |
| T5 | refuse + P1 check | ✅ | no path written, crown stayed open |
| T6 | the silence | ✅ | fired 5×, lines varied |
| T7 | accept | ✅ | scene + grant + books |
| T7b | **E2e XP strip** | ⚠️ **NOT EXERCISED** | accepted with 0 levels, so the strip correctly skipped and logged nothing. Zero `E2e` lines. **Still unverified** |
| T8 | `/whisper_test` (E2f) | ✅ | |
| T9 | `/fall_test` (E2d) | ✅ | `revoked=true`, cooldown day 82, no `HALF-REVOKE` |

**Never-appear sweep: all zero.** `HALF-REVOKE` · `did not stick` · `NO COOLDOWN` ·
`clickRunCommand failed` · `MISSING`.

### Two open items from this run

1. ⚠️ **E2e is still untested.** Bank levels first, then take a path, and confirm the
   bar actually zeroes — not just that the message printed.
2. ⚠️ **T3s first-attempt failure was never explained.** Login authenticated, then
   `handleDisconnection() called twice` and a timeout, with **no exception in the log**
   — not the signature of a script throw. It passed after a restart. If it recurs,
   it is real; treat this as an unresolved intermittent, not a fixed bug.

### What the suite caught that boot-verification could not

`/ritual clear` logged `released <player>` for nine call sites while removing
nothing. Every log line said the safety mechanism worked. **Only a human trying to
move proved otherwise** — which is the entire argument for this document.

---

## Record results here (blank template)

| # | test | pass? | notes |
|---|---|---|---|
| T0 | boot seams | | |
| T1 | `/ritual test` | | |
| T2 | `/ritual clear` | | |
| T3 | **logout mid-scene (J4)** | | |
| T4 | double-click guard | | |
| T5 | refuse + **P1 check** | | |
| T6 | the silence | | |
| T7 | accept + **E2e XP strip** | | |
| T8 | `/whisper_test` (E2f) | | |
| T9 | `/fall_test` (E2d) | | |

**Anything that produced no visible effect goes in the notes column as a finding,
not a blank.**
