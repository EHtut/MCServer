# 49 — Retaliation and Defection *(design, 2026-08-16, NOT BUILT)*

> Ethan: *"now i want to propose another type of events. these are related to
> assassination and contract. Retaliatory events. These will really only be for wall.
> My proposal, if another player kills the wall champion if they have an assassination
> order active the wall gets angry and sends an assassin after them. But i want to
> write these in a way that the assassin has a way to reject the kill order at the risk
> of pissing off their own patron? We can write an argument scene too"*

**This is the first event in the pantheon where one god talks to another god's
champion.** Everything before it is a patron speaking to its own. That is a genuinely
new axis and it is worth building carefully.

---

## 0. It is TWO events, not one

The proposal describes a single chain, but it decomposes into two that fire
independently — and the second one works with or without the first.

| | when | who speaks | what happens |
|---|---|---|---|
| **① THE COUNTER-OFFER** | a kill order naming **Wall's champion** is issued to someone else | **Wall**, to another god's champion | the argument scene · Accept / Reject |
| **② THE RETALIATION** | Wall's champion is **actually killed by a player** | Wall, to her own champion and to the killer | Mother Spider hunts the killer |

② is the simpler half and does not need ① to exist. An opportunistic PvP kill with no
order behind it should still bring the Spider down on whoever did it. ① is the
interesting half, and Accept feeds straight into ②.

**Build ② first.** It is smaller, it stands alone, and it is the half that gives ①
its teeth — the Accept branch has to lead somewhere real before the choice means
anything.

### ⭐ The inverted coefficients are already the mechanical half of ②

Built 2026-08-16, before this was proposed, and it fits exactly. When her champion
dies, rage `+8` → her attention slides off them → their `power` falls and `spawns`
around them rises. **She stops protecting you and goes looking for whoever did it.**
That is retaliation already expressed in the numbers. ② only adds the *body* — the
thing she actually sends — and the voice.

So ② is: Mother Spider + lines. The pressure change is done.

---

## 1. 🔴 The choice is currently fake, and it fails in the direction that kills the event

Laid out honestly, the proposal's two branches are:

| | your patron | Wall | net |
|---|---|---|---|
| **Accept** | order completed, paid | Mother Spider hunts you | a reward and a fight |
| **Reject** | order defied, punished | **"No boon"** | a punishment and nothing |

**Reject is strictly worse on every axis, and it is worse in a way the player learns
in one firing.** After the first time, everyone accepts forever and the scene becomes
a text box you click through. The argument stops being an argument.

That matters more than usual here because the whole point is that *she is trying to
turn someone*. If turning is never worth it, she never turns anyone, and the event's
premise never actually occurs.

### The fix that keeps "No boon" literally true

Ethan wrote `No boon` deliberately and it is the most in-character line in the
proposal — she promises *"something you want"* and then hands over nothing. A god who
cannot conceive that she owes anyone anything. **Do not soften that.**

Fix it by separating *the moment* from *the payment*:

> **She gives nothing at the scene. Something arrives later, unannounced, and is
> never explained.**

Days later: a mob that should have aggroed and does not. A structure chest holding the
one thing you had been looking for. A Goety summon that follows you for an afternoon
and leaves. **No message, no attribution, no confirmation it was ever her.**

That preserves every word of his intent — at the scene there is genuinely no boon, and
she genuinely did not keep a bargain in any way you could hold her to — while giving
Reject real expected value. And a player who *suspects* they were paid and cannot
prove it is a far better outcome than one who was handed a diamond.

**The cheaper alternative, if that is too diffuse:** rejection buys *peace* — she calls
off any existing hunt on you and will not target you for N days. Concrete, legible,
and still not a "boon". Worth a ruling.

### ⚠️ And the second failure mode, which is the opposite one

If Reject pays too well, the event inverts into a farm: take orders you never intend
to fill, reject them all, collect from Wall each time. **Rejection must be rate-limited
per player** — she is not a subscription. Once per order, and one order at a time is
already enforced by `killorder.js`.

---

## 2. 🚨 The scene CANNOT fire mid-fight — this is the hard constraint

`ritual.js` is the only choice mechanism in the codebase, and its own header says it:

> *"It takes the player's control away, speaks, and gives it back."*

Blindness, slowness, rooted. If the scene fires as the assassin swings at Wall's
champion, **the assassin is frozen blind while the champion kills them.** That is not
a rough edge, it is an exploitable grief: Wall's champion could deliberately bait the
scene to win a fight for free.

**So the scene fires at ORDER ISSUE, never at execution.** The moment another god says
*"kill that one"*, Wall is listening and answers before anything happens.

That is better drama anyway. The argument belongs *before* the deed — a person being
talked out of something, not interrupted during it.

**Guards it needs, all of them silent failures otherwise:**

- not in combat, not falling, not mid-ritual (`VELDORA.ritual.active`)
- **defer, never drop** — if the player is unsafe, hold the scene and try again on the
  next quiet moment. A scene that silently never fires is indistinguishable from a
  broken hook, which this project has shipped three times.
- the target must actually be **Wall-pathed** — she does not care about anyone else
- the assassin must **not** be Wall-pathed — she is not turning her own champion
  against her own champion
- a hard timeout: if the order lapses before a safe window is found, drop the scene
  and log it. Do not hold it forever.

---

## 3. ⭐ "Pissing off their own patron" is already built

The best finding in this pass. `release.js` shipped this morning with:

```
[release] active - wall=never · blade=6x gift wasted · salvage=3x refusal · ...
[release] streaks do NOT decay - "in a row" is the only forgiveness
```

**Salvage releases a champion after 3 consecutive refusals.** A rejected kill order
*is* a refusal. Wire the Reject branch into her existing streak and the consequence
Ethan asked for is already implemented, already tested (54/54), and already tuned —
reject her orders three times in a row and she drops you.

That also gives Reject a real, legible cost without inventing a new punishment system,
and it means the two patrons punish defection **differently**, which is the whole
design thesis:

| the assassin's patron | what defection costs |
|---|---|
| **Salvage** | feeds her refusal streak — 3 in a row and she releases you |
| **Blade** | his streak is `buff_death`, not refusal. **Needs a ruling** — see §6 |
| Forge / Art | closed paths, cannot be assassins yet |

---

## 4. The scene, rewritten for ambiguity

Ethan's draft, with his note `[rewrite to be more ambiguous]`:

> *You don't have to do this. You do not have to listen to that vile god of yours*
> *Reject them and I will give you something you want*

**What makes it too legible:** she badmouths a rival god by name-class (*"that vile
god of yours"*), and she states a clean transaction (*"reject them and I will give
you X"*). Both make her sound like a quest-giver negotiating. She is neither
negotiating nor asking.

**The rewrite.** She never says *don't*. She never names the other god. She never
promises anything a player could hold her to. And she talks about her champion as a
**possession**, because that is her entire character.

### `defect_offer` — the pitch

```
You have been asked to take something of mine.

I am not going to stop you.
I want you to understand that I could.

They promised you something for it. They always do.
I have been watching you longer than they have.
I know what you actually want, and it is not what you asked them for.

So. Take it, or do not.
```

**Why this is more ambiguous:** *"I am not going to stop you / I want you to understand
that I could"* reads as either restraint or threat. *"I know what you actually want"*
is either an offer or blackmail — she may be about to give you something, or about to
tell everyone something. And *"take it, or do not"* refuses to plead, which is the one
thing that would make her small.

**Option labels** — in-fiction, not `Accept` / `Reject`:

```
[ It is already done. ]        -> accept
[ Not for them. ]              -> reject
```

`Not for them` is deliberately not *"not for you"* — the assassin refuses their own
god, they do not join Wall. She gets nothing owed to her, which is why "no boon"
lands correctly.

### `defect_accepted` — she comes apart

Ethan's draft is the strongest writing in the proposal and it should survive nearly
intact. The shape is a god **losing composure in real time** — a single flat word,
then escalation, then a repetition that is smaller than the one before it.

```
Fine.

Monster.
Demon.
Murderer.

monster.
```

⚠️ **The lowercase repeat at the end is the whole line.** It is not a typo and it must
not be "corrected" by anyone editing this file later. She runs out of worse words and
goes back to the first one, quieter. That is grief, not anger — exactly her brief.

Then: **Mother Spider.**

### `defect_rejected` — she was never in doubt

Ethan's draft, tightened. She does not thank them. She treats their choice as the
obvious outcome, which is more unsettling than gratitude.

```
I knew you would see it.

You understand what I am doing. What I have to keep.

Go home.
```

*"Go home"* is a dismissal and a blessing at once, and it is the closest she comes to
kindness — she sends them away safe and gives them nothing. **No boon fires here.**

---

## 5. What she sends — the body

Two candidates, both installed and both spawn-egg-backed (verified in the jars, not
guessed):

| entity | mod | argument |
|---|---|---|
| `goety:brood_mother` | Goety | ✅ **recommended.** Ethan's ruling: *"we will only use goety for minions to make it simple."* Her brood boon already hands out `goety:spider_servant`, so this is the same family — the thing she sends is visibly the grown version of the thing she gives you |
| `born_in_chaos_v1:mother_spider` | Born in Chaos | literally named "Spiders Mother". Off-family, and Born in Chaos mobs are `Enemy: NO`, so In Control cannot govern it |

**Recommendation: `goety:brood_mother`**, because the Goety ruling was about keeping
her one coherent mod identity and this is the most visible expression of it yet.
⚠️ Note his ruling was specifically about *minions* — this is a hunter, not a minion,
so it is adjacent rather than covered. Worth a one-word confirmation.

⚠️ **It must be `/summon`, never `createEntity().spawn()`** — the latter skips
`finalizeSpawn` (established across this pack six times over).

---

## 6. Open rulings — needed before any code

1. **The Reject payoff.** Deferred-and-unattributed (§1), or the concrete "she calls
   off the hunt for N days"? Or genuinely nothing, accepting that the event fires once
   per player and then dies?
2. **Blade's defection cost.** Salvage's refusal streak absorbs this for free. Blade's
   streak counts *wasted gifts*, not refusals — so refusing his contract currently
   costs nothing. Does defying Blade feed a new counter, cost regard, or is a Blade
   champion simply someone who never gets this offer?
3. **The liar.** What if they choose `Not for them` and then kill the champion anyway?
   **This should be the worst outcome in the system** — worse than an honest Accept.
   Accepting is honest villainy; rejecting and doing it anyway is betrayal, and she
   has no line for it yet. It is also the best story the mechanic can produce.
4. **Mother Spider:** `goety:brood_mother` confirmed?
5. **Does ① need the target to consent?** Wall's champion is being fought over without
   ever being told. Silence is probably right — they find out when they die, or when
   they do not — but it is a deliberate choice, not an oversight.

---

## 7. Reality check — two players

`Lehykt` and `Rehykt`, and `paths.js` reports `CLOSED (unbuilt, cannot be claimed):
art, forge`. So the only configuration that can fire ① today is **one of them Wall,
the other Blade or Salvage.** That is not a reason not to build it, but it means:

- ① cannot be soak-tested passively. It needs a deliberate setup.
- ② fires on any player kill of a Wall champion and **can** be soaked.
- Everything here should be built so it is inert-and-silent rather than
  broken-and-silent when the configuration is not present — and the boot banner must
  say which of the two it is.
