"""Give modded weapons Epic Fight movesets when the mod does not extend SwordItem.

THE BUG THIS FIXES

Epic Fight assigns a weapon capability automatically only by VANILLA ITEM CLASS.
CommonItemCapabilityProvider registers presets against exactly these:

    SwordItem  AxeItem  PickaxeItem  ShovelItem  HoeItem
    BowItem    CrossbowItem  ShieldItem  ArmorItem

A mod whose weapons extend one of those inherits movesets for free - which is
why most of the pack works and nobody noticed. A mod that writes its own Item
subclass gets NOTHING, silently, and its weapons fall back to the vanilla arm
swing.

There is no error for this. A weapon with no capability is indistinguishable in
every log from a weapon whose animation you have not triggered yet - the same
shape of silent failure as the In Control height keys and the kill-heat
category call. The only detector is a human noticing the swing looks wrong.
Ethan found it on Spore ("the spore? weapons don't have animations"); Spore was
subsequently cut as F43, but the class of bug is pack-wide and unaudited.

THE FIX

Epic Fight reads weapon capabilities from a DATAPACK path:

    data/<namespace>/capabilities/weapons/<item_name>.json
    {"type": "epicfight:<preset>"}

That is not a guess - Epic Knights ships 236 of them under
data/magistuarmory/capabilities/weapons/, which is what proves the convention
for a third-party namespace.

TELLING A WEAPON FROM A CRAFTING MATERIAL

Do it on evidence, never on the item's name. Giving a reagent a capability
makes it swing like a dagger. The Spore pass established the test:

    a WEAPON    has a handheld* model parent, and appears only as a recipe RESULT
    a MATERIAL  has the `generated` model parent (a flat inventory sprite), and
                appears as a recipe INGREDIENT

Four of Spore's eleven weapon-sounding items were materials by that test, and
naming alone would have caught none of them.

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
# Spore was cut as F43 (the modern lab at spawn), so its seven entries were
# removed here the same day. A capability file for an item that no longer
# exists is exactly the kind of orphaned reference that broke ServerCore.
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
