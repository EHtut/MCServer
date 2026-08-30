# 79 — The controls audit: 135 actions on 31 keys

> **STATUS: LIVE — an audit, plus a proposed map.** C4. Ethan, 2026-08-30: *"take a look at
> the mess of keybinds the game now has and rekey them to something intuitive and
> controllable so there isn't a million unused features."*
>
> ⛔ **Nothing is applied.** This reads the live instance and proposes; the rulings at the
> bottom decide what actually changes.
>
> 📄 Source: `options.txt` in `CogsAndCadavers-PrismInstance (4)`, read 2026-08-30.

## The numbers

| | |
|---|---|
| keybind entries | **270** |
| bound | 177 |
| **UNBOUND** | **93** |
| bound actions sitting in a conflict | **135** |
| keys carrying more than one action | **31** |
| **mod actions bound on top of core controls** | **28** |

⭐ **So 76% of every bound action in the game is fighting another one.**

## 🔴 The part that actually hurts: core controls

These fire *while you are playing*, not in a menu.

| control | key | also does |
|---|---|---|
| **save toolbar** | `C` | +7 — trade cycling, cataclysm helmet, goety bag, cannon pitch… |
| **JUMP** | `SPACE` | +4 — two prehistoric-expansion binds, siege ladder, create_sa flying |
| **SNEAK** | `L-CTRL` | +3 — prehistoric, ars documentation, create ctrl-modifier |
| **SPRINT** | `L-SHIFT` | +3 — carry, relics research, create shift-modifier |
| **load toolbar** | `X` | +3 — goety focus circle, dragon down, ars next slot |
| **player list** | `TAB` | +2 — simulated rotate, fxntstorage compacting |
| **attack** | `M1` | +2 — cannon fire control, TACZ shoot |
| **forward** | `W` | +1 — ponder |
| **chat** | `T` | +1 — trashslot |
| **swap offhand** | `F` | +1 — siege machine use |
| **use** | `M2` | +1 — TACZ aim |

⚠️ **Some of these are correct and must stay.** TACZ shoot/aim on M1/M2 is the gun mod doing exactly what it should; `create.keyinfo.*` are *modifier* declarations, not actions. Iron's `ponder` on `W` is not.

🔑 **The test is "does this fire in the world while I hold the key for its normal use".** Jumping should not deploy a siege ladder.

## The worst offenders

```
v          11 actions      supplementaries, voice_chat, occultism, cataclysm ×2, …
left.alt   11 actions      copycats, spellbooks, relics, railways ×2, …
c           8              (+ save toolbar)
h           8              accessories, hide_icons, metki, goety ×2, …
b           8              fieldguide, emotecraft, atmospherics, occultism, goety
g           8              voice group, goety ×2, curios, dragon
r           7              spellbooks, goety ×3, jei, dragon
```

## ⚠️ The 93 unbound are NOT all dead weight — and this inverts the obvious fix

```
occultism 17 · irons_spellbooks 16 · ars_nouveau 11 · keybindings 9 · jei 7 · artifacts 6
```

🔴 **`occultism` and `ars_nouveau` are PATH CONTENT.** `paths.js` hands out the *Dictionary
of Spirits* (occultism), the *Tattered Tome* (ars nouveau) and the *Black Book* (goety) as
path guidebooks — and Wall's own guidance lines are occultism rituals (*"Chalk first, love.
A shape on the floor"*), while Art's are ars nouveau (*"Source pools do not fill
themselves"*).

⭐ **So the two mods with the most UNBOUND keys are the two whose features a champion is
told to go and use.** "A million unused features" is the right description of the *symptom*
and the wrong description of the *cause*: they are not unused, they are unreachable.

## 🖊️ The proposed map

Three tiers, and the principle is **what a player of THIS pack actually does**.

### 1. ⛔ Core controls are cleared — nothing else may sit on them

Unbind every non-TACZ mod action on: `W A S D`, `SPACE`, `L-SHIFT`, `L-CTRL`, `M1`, `M2`,
`E`, `T`, `TAB`, `F`, `C`, `X`. **TACZ keeps M1/M2** (shoot/aim is the gun), and Create's
`keyinfo` modifiers stay — they are declarations, not actions.

⭐ That alone removes **26 of the 28** live conflicts and is the single highest-value change
in this document.

### 2. ⭐ Path clusters get real keys, on a consistent scheme

The four path mods are the ones a champion is *sent* to. One home row each:

| cluster | path | proposed |
|---|---|---|
| occultism | Wall | `Z` group |
| ars nouveau | Art | `V` group |
| goety | Wall / crown | `G` group |
| create | Forge | keeps its own (already coherent) |
| TACZ | Blade | keeps M1/M2 + `R` reload |

### 3. Everything else unbinds

A mod whose feature nobody uses does not need a key. It can be rebound by hand by anyone
who wants it — **an unbound key is discoverable in the menu; a conflicting one is not.**

---

# ⭐ Rulings I need

| # | question | why |
|---|---|---|
| **1** | **Which mods do you actually use?** I can clear the core controls without you, but tier 2/3 is a judgement about your pack, not a fact I can read out of a file | The difference between "unbind 60 things" and "unbind 15" |
| **2** | occultism/ars/goety — **bind them properly, or leave them unbound?** | They are path content, so I lean bind. But 44 unbound keys across three mods is a lot of keyboard |
| **3** | Does `V` stay voice chat? | It currently carries **11** actions and voice is the one people expect to be reliable |

## 🔴 And a delivery problem, because you said "this gets sent to the packwiz"

**It can be, but not as things stand.** `pack/index.toml` carries **323 entries and every one
is a mod metafile**. `tools/gen_pack.py` builds that index from `PACK.glob("*/*.pw.toml")`
and never runs `packwiz refresh`, so it cannot see a config file at all.

⭐ packwiz the FORMAT handles arbitrary files fine — ours simply does not index them. So
shipping a keymap means **teaching `gen_pack.py` to index `pack/config/`**, which is a real
change with a real risk attached:

⚠️ **A shipped `options.txt` overwrites a player's own keys.** Whatever we send, we send to
all four of you, over anything you have personally rebound. That is a different decision
from fixing the conflicts and wants its own answer.
