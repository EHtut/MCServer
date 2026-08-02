# Rehykt's Figura avatar

The Lua half is done and runs standalone. The Blockbench half is yours.

Load it right now with no model at all — it will run clean, show the vanilla
player, and the action wheel's **Avatar status** entry will report exactly what
it can and cannot see. That is the point: you can verify the pipeline works
before investing hours in a model.

## Where it lives

Canonical copy is here in the repo (so your modelling work is version
controlled — it is real work and worth not losing). The live copy is at:

```
%APPDATA%\PrismLauncher\instances\CogsAndCadavers-PrismInstance\.minecraft\figura\avatars\rehykt\
```

packwiz does **not** manage this folder, so the two do not sync themselves.
After editing either side, re-copy. This is deliberate — an avatar is personal,
and it must never end up in your brother's zip.

## Blockbench setup

1. Install Blockbench — <https://blockbench.net>
2. **File → Plugins → Available**, search **Figura**, install.
3. **File → New → Figura Model**. Not "Java Block/Item" — the Figura project
   type is what exports the bone structure the mod expects.
4. Save as **`model.bbmodel`** in this folder. The filename matters: the script
   looks up `models.model`, which is the file's basename.

### Part naming — this is the part people get wrong

Figura auto-parents a group to the matching vanilla body part **by name**.
Name your top-level groups exactly:

```
Head    Body    LeftArm    RightArm    LeftLeg    RightLeg
```

Anything named otherwise renders in world space and stays behind while you
walk. If a limb "doesn't follow you", this is always why.

## Animation naming — how the script picks them up

The script hardcodes **no** animation names. It reads whatever the model
actually has, so you cannot desync the two halves.

| Name in Blockbench | What happens |
|---|---|
| `idle` | loops when standing still |
| `walk` | loops when moving |
| `sprint` | loops when sprinting |
| `sneak` | loops when sneaking |
| `emote_wave`, `emote_sit`, … | gets its own action-wheel button automatically |
| anything else | ignored — yours to drive |

Add `emote_anything` in Blockbench and a button appears. No Lua edit.

## The one multiplayer rule

Host input runs **only on your client**. If the wheel called `anim:play()`
directly, the emote would look perfect to you and be invisible to everyone
else. Every emote therefore goes through a **ping** (`pings.playEmote`), which
is the only mechanism Figura replicates to other players.

If you add anything new that others must see, it goes through a ping. No
exceptions — this failure mode is invisible in single player.

## Checking he can actually see it

Loaded-locally and uploaded-to-backend are different states and **look
identical to you**. The wheel's **Avatar status** button calls
`host:isAvatarUploaded()` and says which one you are in.

## Notes

- Armour and held items stay visible: the script hides `vanilla_model.PLAYER`,
  which is body parts only, not the `ARMOR` or `HELD_ITEMS` groups. That is
  intentional — this is an Epic Fight pack and the weapon is the point.
- `figura_extrabone` and `figura_extrafight` are both installed. ExtraFight
  bridges Figura and Epic Fight, so once the model exists there is a route to
  per-weapon reactions.
- A Lua error kills the **entire** avatar, not the offending line. Errors show
  in chat when you are the host.
- Every API call in `script.lua` was verified against figura-0.1.6's own
  `en_us.json` docs and class constant pools, not written from memory.
