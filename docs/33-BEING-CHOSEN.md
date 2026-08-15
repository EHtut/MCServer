# Being chosen — the patrons pick you

*Ethan, 2026-08-14, during the first playtest: **"What if paths are no longer
commands. What if you are chosen by the patron? Though that may be a separate
system."*** Captured with two smaller ideas from the same session. **Nothing built.**

---

## 1. 🚨 This fixes a real flaw in what we just shipped

Every one of the six scenes is built on a **false shared history** — `27` §MANIPULATION
AXIS makes it the load-bearing device:

> *"You already reached for it."* — Blade
> *"You called me, friend, and here I am, same as I always come."* — Salvage
> *"We shook on it. Maybe not with hands — you don't recall."* — Forge
> *"You left a seam for me once."* — Wall

**But the player typed `/path blade`.**

So the premise is not false. **It is literally, verifiably true**, and the patron's
best line degrades into an accurate description of a command the player ran two
seconds ago. Blade says *"you already reached for it"* to somebody who did exactly
that, on purpose, by name.

**The gaslighting cannot work when the victim initiated.** I built the manipulation
layer and the vending machine in the same week and never noticed they cancel out.
Ethan found it by playing it once.

If the patron arrives unbidden, every one of those lines becomes a **lie again** —
which is the only state in which they do their job.

## 2. It is also the thesis, exactly

`30-THE-THESIS.md`:

> Veldora will not let you die, and it will not let you leave. The patrons are the
> only things in it that will make you an offer. **An offer is the only thing that
> feels like freedom in a place that has already decided you cannot have any.**

A command menu hands the player agency the entire fiction says they do not have.
`/path crown` is *shopping*. Being chosen is being **noticed**, which is the thing
the whole world is about — the angels watch the descent, and now something that fell
has picked you out of the dark and come over.

**Refusal gets stronger too.** Right now you refuse a thing you asked for, which is
mostly incoherent. Refusing something that came for you uninvited is a real act, and
the silence afterwards becomes genuinely cold: it came once, you said no, and now
nothing comes.

## 3. How you get chosen: they watch what you DO

The mechanism should be the one the fiction already claims — **the angels watch**.
So the patrons read **revealed behaviour, never a stated preference**. You do not
pick a playstyle; your playstyle picks your patron.

| patron | the signal it watches for |
|---|---|
| **Forge** | blocks placed, machines built, Create in use |
| **Blade** | hostile kills, fighting things above your weight |
| **Wall** | enclosing, walling in, doors, staying home |
| **Art** | **dying** — repeatedly, and the sleeping |
| **Salvage** | looting, scavenging, running out of things |
| **Crown** | summoning, commanding, sending others in first |

⭐ **Art watching you die is the best of the six** and needs no extra system: the
death counter already exists in `regard.js`. The player who keeps dying gets noticed
by the one who offers rest. That writes itself.

### The candidacy rule — one spike must not do it

**Sustained candidacy, not a threshold.** A signal must stay strong *and keep growing*
across several evaluation cycles before a patron acts. One good mining session must
not summon Forge. This is not a new invention — it is the pattern that already works
in the Alice project's trait formation, and the reason is identical: **formation
should be a big deal, earned over time, not a trigger.**

## 4. ⚠️ Both failure modes, per the standing rule

**Too passive — the real risk.** A player who *wants* Blade but plays like a builder
never gets Blade, and there is no lever to pull. That is not mystique, that is a
player being told no by a system that will not explain itself. Four players on a
private server will absolutely hit this.

**Too eager.** Patrons arriving constantly, or several courting at once, turns an
event into noise and burns the one thing this system has: rarity.

### The resolution: you may SIGNAL, you may never DEMAND

* `/path` **stops granting** and becomes what it should always have been: a way to
  *look* — who walks what, and nothing more.
* The player can act toward a patron (fight recklessly, build obsessively, wall
  themselves in) and **be seen doing it**. That is a lever, and it is diegetic.
* **A long backstop.** If nobody has been chosen after N in-game days, the most
  likely patron comes anyway. Being unchosen forever is not mysterious, it is broken.
* **One courtship at a time.** A patron that arrives holds an exclusive window; the
  others stay quiet until it resolves. Refusal opens the field again after the silence.

## 5. What it costs to build

Not small, and honest about it:

* **`paths.js` selection is player-initiated everywhere** — the escrow model, the
  claim, `/path <key>`, all of it assumes a player asking.
* **A new watcher** is needed: per-player signal counters with decay, candidacy
  across cycles, and a chooser. That is genuinely a separate system, as Ethan
  guessed.
* **I2 is unaffected.** `VELDORA.intro.open(srv, p, key, commit)` does not care who
  called it. **The introductions already work for this** — a chooser calls the same
  seam. That is the payoff for having built I2 as a seam rather than inline.
* **E3, the coefficient substrate, is the natural home** for the signal counters,
  and it is still unbuilt.

⭐ **The world reset is the moment to do it.** `11-OPEN-DECISIONS.md` records Ethan's
intent to wipe and redo worldbuilding. A fresh world means nobody holds a path, and
being chosen becomes how everyone gets one from the start — no migration, no
retrofit, no explaining to four players why their path vanished.

## 6. Open questions

1. **Does `/path <key>` survive at all?** Recommend **no** — keep `/path` as a
   read-only board. A command that still grants makes being chosen decorative.
2. **Can you be chosen by a patron you already refused?** Recommend yes, but much
   later, and it should feel like being reconsidered rather than nagged.
3. **Can two patrons want you?** Tempting and expensive. Recommend not in v1.
4. **What does the world reset do to the six existing walkers?** Nothing, if the
   reset happens first.

---

# Also captured this session

## A. Announcements — an emphasis ladder

Ethan: *"I would like if possible to move some dialogue as Announcements or some
other way to add emphasis."*

`/title` and `/subtitle` are **vanilla and confirmed working** (RCON parsed them).
Four channels exist, and the danger is using them for decoration until none of them
mean anything:

| channel | reserved for |
|---|---|
| **title** | the moment the world changes. A patron's *arrival*. The Fall. A Harvest beginning |
| **subtitle** | the name of the thing that just arrived |
| **red chat** | the patron speaking — stays the default, most lines |
| **actionbar** | ambient whispers, low priority, never interrupts |

**Recommendation:** the patron's **first line only** becomes a title, and everything
after it stays in chat. The arrival lands as an event; the conversation stays a
conversation. Escalate for *meaning*, never for emphasis — a title on every line is
the same as no titles.

⚠️ **One assumption to probe:** the ritual blinds the player, and **whether a title
renders over blindness is unproven.** E0 P2 proved red chat is legible on a black
screen; titles are a different HUD layer. Probe before building — this exact class of
assumption is what I0 exists for.

## B. A first-join introduction to the world

Ethan: *"perhaps an introduction when you first enter the server to introduce you to
the world. Flag it for after."* **Flagged, not scheduled.**

Worth recording *why* it is more valuable than it looks: `30-THE-THESIS.md` §5.1 says
the scenes are not *of* Veldora — nobody mentions the descent, the watching, or that
**you cannot die**. A first-join sequence is the natural place to establish all three
**once**, so no patron ever has to explain them. It would make the "one line of
Veldora per patron" revision easier, because the player would already know what the
line is referring to.

It is also the same primitive: `VELDORA.ritual.begin()` with no options. The system
to build it already exists and is now tested.
