"""Give modded weapons Epic Fight movesets when the mod does not extend SwordItem.

THE BUG THIS FIXES

Ethan, 2026-08-02: "the spore? weapons don't have animations". He is right, and
the reason is structural rather than a Spore bug.

Epic Fight assigns a weapon capability automatically only by VANILLA ITEM CLASS.
CommonItemCapabilityProvider registers presets against exactly these:

    SwordItem  AxeItem  PickaxeItem  ShovelItem  HoeItem
    BowItem    CrossbowItem  ShieldItem  ArmorItem

A mod whose weapons extend one of those inherits movesets for free - which is
why most of the pack works and nobody noticed. A mod that writes its own Item
subclass gets NOTHING, silently, and its weapons fall back to the vanilla arm
swing. Spore is the second kind: its whole jar references SwordItem exactly
once, and not from a weapon.

There is no error for this. A weapon with no capability is indistinguishable in
every log from a weapon whose animation you have not triggered yet - the same
shape of silent failure as the In Control height keys and the kill-heat
category call. The only detector is a human noticing the swing looks wrong.

THE FIX

Epic Fight reads weapon capabilities from a DATAPACK path:

    data/<namespace>/capabilities/weapons/<item_name>.json
    {"type": "epicfight:<preset>"}

That is not a guess - Epic Knights ships 236 of them under
data/magistuarmory/capabilities/weapons/, which is what proves the convention
for a third-party namespace.

WHY THESE SEVEN ITEMS AND NOT ELEVEN

Spore has 228 items; 11 read as weapon-ish by name. Four of those are crafting
materials and must NOT get a moveset - giving one a capability makes a reagent
swing like a dagger. They separate cleanly on evidence, not on name:

    item                model            used as ingredient    verdict
    claw                generated                        11    material
    fleshy_claw         generated                        12    material
    claw_fragment       generated                         4    material
    sickle_fragment     generated                         1    material
    armads              handheldweapon2                   0    WEAPON
    greatsword          handheldweapon1                   0    WEAPON
    infected_spear      handheldweaponthrow               0    WEAPON
    knife               handheld                          0    WEAPON
    scythe              handheldweapon3                   0    WEAPON
    sickle              handheldweapon3                   0    WEAPON
    combat_pickaxe      handheldweapon2                   0    WEAPON

A `generated` parent is a flat sprite - an inventory icon, not something held.

Run:  python tools/make_epicfight_weapons_datapack.py
"""

from __future__ import annotations

import json
import pathlib

PACK = pathlib.Path(__file__).resolve().parent.parent / "pack" / "datapacks" / "mcserver_epicfight_weapons"

# 1.21.1. Matches the other five generated packs.
PACK_FORMAT = 48

# The vocabulary is not invented: these are the only types actually in use
# across the 283-mod set, counted from every capability json in every jar.
#   epicfight:axe(68) spear(54) longsword(43) greatsword(31) dagger(18)
#   sword(18) tachi(6) hoe(6) pickaxe(6) shovel(6) bokken fist uchigatana
#   bow crossbow trident shield
#
# A value may be a bare preset string, or a full capability body when the entry
# needs to carry attributes (see the Epic Knights override below).
#
# namespace -> item -> preset | body
WEAPONS: dict[str, dict[str, object]] = {
    # --- Epic Knights: fixing THEIR typo -----------------------------------
    # Not a Spore problem, found in the same reload. Epic Knights ships
    #   data/magistuarmory/capabilities/weapons/silver_morgenstern.json
    #   {"type": "axe", "attributes": {...}}
    # with no namespace on the type, so it resolves to minecraft:axe, which does
    # not exist, and Epic Fight logs:
    #   Can't find weapon type: minecraft:axe
    # The silver morgenstern has therefore had no moveset since the mod shipped.
    #
    # A world datapack loads after mod datapacks, so this file overrides theirs.
    # The attributes block is copied verbatim from their file - overriding the
    # whole entry means dropping it would silently nerf the weapon's impact and
    # strike count, which is a worse bug than the one being fixed.
    "magistuarmory": {
        "silver_morgenstern": {
            "type": "epicfight:axe",
            "attributes": {"common": {"impact": 1.9, "max_strikes": 2}},
        },
    },

    "spore": {
        # "Infected Battleaxe". Two-handed heavy - axe is the only heavy-chop set.
        "armads": "epicfight:axe",

        "greatsword": "epicfight:greatsword",

        # Model parent is handheldweaponthrow, i.e. it is throwable. Epic Fight's
        # spear set keeps the thrust-and-throw read.
        "infected_spear": "epicfight:spear",

        "knife": "epicfight:dagger",

        # No scythe preset exists. Longsword is the closest honest fit: two-handed
        # with wide sweeps. Change this one line to epicfight:tachi if the sweeps
        # read too slow for a scythe.
        "scythe": "epicfight:longsword",

        # Short and curved - the dagger set, same as the knife.
        "sickle": "epicfight:dagger",

        # It IS a pickaxe and Epic Fight animates pickaxes, so its identity is
        # preserved. If "Combat Pickaxe" should fight rather than mine, this is a
        # one-word change to epicfight:axe.
        "combat_pickaxe": "epicfight:pickaxe",
    },
}


def main() -> int:
    if PACK.exists():
        for p in sorted(PACK.rglob("*"), reverse=True):
            p.unlink() if p.is_file() else p.rmdir()

    (PACK).mkdir(parents=True, exist_ok=True)
    (PACK / "pack.mcmeta").write_text(json.dumps({
        "pack": {
            "pack_format": PACK_FORMAT,
            "description": "Epic Fight movesets for modded weapons whose item class is not a vanilla weapon class.",
        }
    }, indent=2) + "\n", encoding="utf-8", newline="\n")

    n = 0
    for namespace, items in WEAPONS.items():
        out = PACK / "data" / namespace / "capabilities" / "weapons"
        out.mkdir(parents=True, exist_ok=True)
        for item, spec in items.items():
            body = {"type": spec} if isinstance(spec, str) else spec
            (out / f"{item}.json").write_text(
                json.dumps(body, indent=2) + "\n",
                encoding="utf-8", newline="\n")
            extra = "" if isinstance(spec, str) else "   (+attributes)"
            print(f"  {namespace}:{item:<20} -> {body['type']}{extra}")
            n += 1

    print(f"\nwrote {n} capability file(s) to {PACK}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
