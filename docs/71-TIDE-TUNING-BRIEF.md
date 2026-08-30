# 71 — Tide tuning: the brief for a dedicated channel

> **STATUS: HANDOFF.** Written 2026-08-29 to be the *first message* of a new chat.
> ⚠️ Nothing here has been built. This channel does not exist yet — Ethan opens it.

---

## Your mandate

You are the **tide-tuning channel**. You own one thing: **the composition of the tide,
and nothing else.** Other channels own the gods, the paths, the world reset. If a
question is not "what comes out of the water and in what proportion", it is not yours.

### 🔑 The first job, and it is a measurement

> Ethan: *"run a complete audit of all the enemies in the game with the tag 'undead' so
> we can create more dynamic waves."*

**Produce a complete, verified census of every entity in this 300-mod pack that is tagged
`#minecraft:undead`** — id, mod, and whatever you can establish about how it fights.

---

## ⚠️ Read these before you touch anything

| | |
|---|---|
| `docs/68-THE-GAMEPLAN.md` | where the project is. Read the header table first |
| `docs/DEFECTS.md` §T1 | what the tide's roster **just became**, and why |
| `pack/kubejs/server_scripts/tide.js` | the system. Its header is long and worth all of it |
| `CLAUDE.md` | the working rules. They are not optional |

---

## 🚨 What the tide is now, as of 2026-08-29

**Alice is the goddess of death and she is SKELETONS, not zombies.** That is Ethan's
thesis and it is the constraint every tuning decision answers to.

The roster stopped being depth-keyed and became **role-keyed**:

| modifier | pool |
|---|---|
| `horde` | `decrepit_skeleton` — the bulk, and the ONLY thing in a pure horde |
| `general` | + `minecraft:skeleton`, `bonescaller` |
| `specialist` | + `skeleton_thrasher` (tank), `bonescaller` (ranged), `skeleton_demoman` (rare, dangerous) |
| `miniboss` | `supreme_bonescaller`, `fallen_chaos_knight` |

⭐ **Rarely, another god reaches in** — 8% of waves if you hold a path, **25% if you are
godless** — and the wave draws that god's own roster instead. **The miniboss stays hers
either way**: the variation is who came, not who sent them.

⚠️ **Depth no longer changes composition.** It picks tier and count only. That is a
deliberate trade of variety for authorship and it is the thing most likely to be felt in
play — if the census gives you a way to restore texture *without* diluting the thesis,
that is the most valuable thing you could find.

---

## 🚨 THE RULES THAT WILL BITE YOU. All of these were paid for.

### An unprobed id is a guess, and guesses fail SILENTLY

**Three of four miniboss ids did not exist** — `missionary`, `supreme_bonecaller`,
`bonecaller`. A wrong id spawns nothing and logs nothing.

```
data get entity @e[type=<id>,limit=1]
```

⚠️ **AND THE OBVIOUS DETECTION IS WRONG.** A real id with no live instance answers
*"No entity was found"* — but a real id that **is currently alive answers with its data**,
and a naive check reads that as fake. 🚨 That exact flaw made `minecraft:skeleton` look
fake on 2026-08-29. **Detect the FAILURE, not the success**: a fake id produces
`Unknown entity type` or a `<--[HERE]` caret. **And always include a known-fake control.**

### A lang entry is not proof of registration

Nor is a wiki page, nor the mod's own docs. Only the registry.

### Attack type cannot be probed at all

The registry confirms an id exists. It cannot tell you whether something shoots. ⚠️ The
`RANGED` map is therefore **rulings and inference, and it must say which is which** —
Ethan ruled banshee and thrasher melee despite their names.

🔴 And on 2026-08-29 `decrepit_skeleton` was listed **ranged** while being the **bulk**,
which would have inverted every wave: the mob meant to *be* the horde becoming the
archers. **Check every id in that map against the role it plays.**

### `node --check` is not the engine

KubeJS runs **Rhino**. Run `python tools/rhino_lint.py`, then **deploy and RESTART** and
read the boot log — `/kubejs reload` does not re-fire `ServerEvents.loaded`.

### A banner is a claim, not evidence

**Ten lying banners** have been caught in this project, most by reading the boot log after
a restart. If you change what the tide draws, the banner that describes it changes in the
same commit.

### Flaky is worse than absent

The tide harness went flaky twice because a varied wave is a *designed* outcome and the
composition tests did not suppress it. **A test that fails one run in five teaches you to
re-run instead of to look.** Verify over 10+ consecutive runs.

---

## ⛔ Ethan's standing constraints

- **No coefficient below 1.** *"it should always be an increase."*
- **Never take items from players.** *"that is how you cause them to quit."*
- **No agent fleets or large fan-out workflows.** They burn his whole usage budget.
- **Mark generated dialogue `[CLAUDE-DRAFT]`** so it lands in `docs/51` for his pass.

---

## What a good first deliverable looks like

1. **The census**, complete and verified, with the probe's method stated and its control
   shown. ⚠️ Say plainly which mods you could not resolve rather than omitting them.
2. **Attack type marked as ruling / inference / unknown**, never blended.
3. **A proposal**, not an edit: which additions would make waves more dynamic *while
   still reading as hers*. The bulk being one mob is the current weak point.
4. 🚨 **What you did NOT check.** A census that quietly skips a mod is worse than a
   shorter one that names the gap.

**Then stop and let him rule.** The roster is authorship, not balance.
