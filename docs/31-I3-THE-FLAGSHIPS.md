# I3 — the flagship system

*Ethan, 2026-08-14: **"define I3 because i can't find the document"** — because there
was not one. I3 existed as a five-line stub in `26-INTRODUCTIONS.md` and a scaling
design in `29-THE-XP-COUPLING.md`, and nowhere else. This is the spec.*

> # ⏸️ HELD — 2026-08-14
> **Ethan: *"i admit looking back i kinda don't like the idea of flagship items
> anymore, so lets hold them for possible for now."*** Not cut, not built. Every
> finding below stays valid and the probe results keep their value; nothing here is
> wasted if it comes back.
>
> **Nothing shipped is affected.** The gift beat was never generated into
> `introductions.js` — the scene generator only ever extracted arrival, demand,
> options, acceptance and refusal — so the six introductions run today with no
> reference to an item. There is no live promise to walk back.

**Status: HELD. Defined, not built.**

---
## 1. What a flagship is

The item a patron hands you at the end of your introduction. One per path, chosen
from the real mod registries rather than invented, verified to exist in I0.

| path | item | verified | scales (`29`) |
|---|---|---|---|
| **forge** | `create:wrench` | ✅ maxDamage 0 | damage |
| **blade** | `born_in_chaos_v1:darkwarblade` | ✅ maxDamage 4000, `two_handed` | damage, highest |
| **art** | `ars_nouveau:enchanters_sword` | ✅ maxDamage 2031 | damage, medium |
| **crown** | `goety:dark_wand` | ✅ maxDamage 0 | his court (J10: no surface → KubeJS-side) |
| **wall** | `securitycraft:universal_block_reinforcer_lvl1` | ✅ maxDamage 300 | protection (J9: no surface → KubeJS-side) |
| **salvage** | `tacz:modern_kinetic_gun` + `custom_data={GunId:"tacz:db_short",GunFireMode:"SEMI"}`, plus **2×** `tacz:ammo` + `custom_data={AmmoId:"tacz:12g"}` | ✅ exact forms proven | ammo |

🚨 **There is no item called `tacz:12g`.** It is `tacz:ammo` carrying an `AmmoId`
component. The docs said otherwise for two days and Salvage would have been handed
nothing.

## 2. 🚨 The thesis in miniature — why it comes back

Ethan ruled that a lost flagship is **restored one in-game day later** rather than
locked to your inventory: losing it should sting for a session, and the patron
handing it back is better than a lock.

`30-THE-THESIS.md` makes that ruling mean something:

> ### The flagship cannot be lost for the same reason you cannot die.
> Veldora permits no exit, and neither does your patron. You do not get to put it
> down, you do not get to throw it in lava and be free of it, and you do not get to
> die out of the arrangement. **It comes back the way you come back.**

So the restore is not a convenience feature. It is the single clearest statement the
system makes about what the player actually is. **It must therefore be silent** — no
"your flagship has been returned" message. It is simply in your inventory again, the
way you are simply alive again.

## 3. Granting

On acceptance, inside the accept branch only — never on refusal, never on timeout.

* Built with components (I0 J1: bracket syntax, `stack.set()`, or object form; **not**
  `Item.of(id, nbt)`, whose second argument is COUNT).
* Enchanted **Mending + Unbreaking** where it means anything. I0 J3 proved all six
  *hold* the enchantment; `29` §4 records that it only *matters* for Blade, Art and
  Wall. Wall's 300 uses make it mandatory there.
* Marked as a flagship so restore can recognise it — a `custom_data` key of our own
  alongside the mod's, e.g. `{VeldoraFlagship:"blade"}`. ⚠️ **Must not clobber
  TaCZ's `GunId`** — merge into the existing compound, never replace it.
* Given **after** the closing lines begin, in the same breath as the grant.

## 4. Losing and restoring

* A daily sweep asks, per pathed player: do you still carry your flagship?
* If not, and it has been missing since the previous world day, grant a fresh one.
* **Stored as a WORLD DAY, never `tickCount`** (finding K9 — a stamp from the future
  silently disabled the Hunt forever). `fall.js` `dayNow()` is the proven reader.
* Silent, per §2.

**The fall stops the restore.** Losing your path takes the flagship's future with it:
no more restores, and the XP coupling dies with the claim (`29` §7). The item you are
holding becomes an ordinary item and **never says why**.

⚠️ **Key off the LIVE path claim, not a flag written at grant time**, or the revoke
and the removal can desync — the P1 bug in a new costume, and this would be the fifth
place it has been born. I2 closed P1 structurally by putting every mutation inside
`commitPath()`; I3 must not reopen it.

## 5. The XP coupling

Full design in `29-THE-XP-COUPLING.md`. In brief: `bonus = SCALE × √level`, added to
the item's own damage and **never subtracted from it** — the invariant that stops
the death-spiral, given the entry strips all XP and every death costs five levels.

Wall and Crown take **character scaling**, ruled 2026-08-13. J9/J10 came back
**NO SURFACE**, so both need the KubeJS-side equivalent: scaled absorption while
standing on your own reinforced blocks; scaled summon duration or count. **Neither
silently downgrades to damage.**

## 6. Build order

| | chunk | blocked? |
|---|---|---|
| **I3a** | grant on acceptance, with components + enchantments | ⚠️ J5b |
| **I3b** | the daily restore sweep, silent, world-day stamped | ✅ free |
| **I3c** | the fall stops restoring + strips the coupling | ✅ free |
| **I3d** | damage coupling — Blade, Forge, Art | ⚠️ J5b, J6 |
| **I3e** | Wall's protection + Crown's court, KubeJS-side | ✅ free (J9/J10 answered) |
| **I3f** | Salvage's ammo coupling | ⚠️ J7 |

**I3b and I3c can be built today.** I3a is the natural first chunk but wants J5b.

## 7. ⏳ What is still blocking

| # | question | still open because |
|---|---|---|
| **J5b** | is a written `attribute_modifiers` component **honoured**, not merely held? | needs a player to swing |
| **J6** | is there an XP-change event, or must the refresh poll? | **round 1 was VOID** — KubeJS resolves event names dynamically, so `typeof PlayerEvents.anything === 'function'` is true for nonsense; two invented control names resolved 2/2 |
| **J7** | does TaCZ damage reach a vanilla hook at all? | needs a player to shoot |

All three are in `_probe_intro.js` and all three need the test suite, alongside J4
(logout mid-ritual) and the untested I1/I2 behaviour.

## 8. Open

1. **Does the flagship scale in the off-hand?** Recommend **no** — held, or nothing.
2. **What happens to the old flagship when you change paths?** Not yet decided.
   Recommend it simply stops being special: no confiscation, no message. You keep a
   Dark Warblade that no longer grows, which is its own quiet punishment.
3. **Should a second flagship be grantable if the first is in a chest?** The restore
   sweep as specified would duplicate it. **Restore must check the whole inventory
   AND ender chest**, or accept duplication as the cost of silence — leaning strict.
