"""Push materials down to the depth where they belong.

THE RULE THIS ENFORCES (docs/10-DEPTH-LOOP.md §2b, Ethan's framing)

    The depths hold what wouldn't make sense to exist in a fantasy world.
    Gems, gunpowder, modern technology.

    surface      wood, stone, iron, copper   what a preindustrial world is built of
    y 0..-64     gems, unusual metals        explicable to a medieval mind
    y -64..-128  gunpowder, modern tech      no fantasy explanation exists

A material generating above where it belongs quietly undoes the premise, and
worldgen is the one thing that cannot be fixed after chunks exist. So the
overrides live here, in one generated datapack, rather than scattered.

FIRST ENTRY: GUNPOWDER

Every TaCZ ammo recipe already requires `c:gunpowders` - verified by reading the
extracted gun pack (e.g. 308.json: 30 copper + 10 gunpowder + lapis -> 60 rounds).
So gunpowder was ALREADY the ammo gate; it simply was not gated by depth. The
pack ships a Gunpowder Ore mod generating count 20 across y -64..172 - which is
to say everywhere, abundantly, including the surface.

Moving it to the Abyssal band ties ammunition to descent permanently, and needs
no new item, no components, no loot injection and no client download. Ethan
called this before I did: "i assumed that what we are doing is just limiting
drops to lootr chests or mob drops to a specific depth level."

Deliberately NOT a hard lock. Creepers still drop gunpowder, and
liposcraftablegunpowder still offers a crafted path that already requires
glowstone (so it is Nether-gated and slow). Both remain as a trickle: you can
always make SOME ammo, you just cannot fight a war on it. An economic pull, not
a wall.

Overrides only affect NEWLY GENERATED chunks.

Run:  python tools/make_depth_resources_datapack.py [--out <dir>]
"""

from __future__ import annotations

import argparse
import glob
import json
import pathlib
import zipfile

PACK_NAME = "mcserver_depth_resources"
PACK_FORMAT = 48  # 1.21.1

MODS = r"C:/MCServer/instance/mods"

# The Abyssal band, matching mcserver_depth's min_y = -128.
ABYSSAL_MIN, ABYSSAL_MAX = -128, -64

# (jar glob, placed_feature path inside the jar, new y range, new count)
#
# `count` is not preserved: the original 20 was spread over 236 blocks of height.
# Squeezing the same number into a 64-block band would make it far denser than
# it ever was. 12 keeps the Abyssal band a genuinely rich seam - which is the
# reward for going down - without turning it into a gunpowder floor.
OVERRIDES: list[tuple[str, str, int, int, int, str]] = [
    ("gunpowderore*.jar",
     "data/gunpowderore/worldgen/placed_feature/gun_powder_ore.json",
     ABYSSAL_MIN, ABYSSAL_MAX, 12,
     "Gunpowder is what makes guns possible, so it belongs where guns do."),
]


def retarget(placement: list, y_min: int, y_max: int, count: int) -> list:
    """Rewrite the height_range and count modifiers, leaving everything else.

    Editing in place rather than rebuilding the list matters: these features
    carry placement modifiers we have no reason to understand (in_square, biome,
    rarity filters, surface anchors). Replacing the whole list would silently
    drop any of them.
    """
    out = []
    for mod in placement:
        t = mod.get("type")
        if t == "minecraft:height_range":
            out.append({
                "type": "minecraft:height_range",
                "height": {
                    "type": "minecraft:uniform",
                    "min_inclusive": {"absolute": y_min},
                    "max_inclusive": {"absolute": y_max},
                },
            })
        elif t == "minecraft:count":
            out.append({"type": "minecraft:count", "count": count})
        else:
            out.append(mod)
    return out


# Biome-modifier overrides.
#
# Retargeting a placed_feature's Y range is only half the job: a feature only
# generates in the biomes a modifier ADDS it to. Gunpowder Ore's own modifier
# lists exactly two - dripstone_caves and lush_caves - so moving it to the
# Abyssal band would have made it a rarity in two cave biomes rather than the
# deep resource the whole ammo economy is meant to rest on.
#
# Caught by an audit before first boot. The placed_feature edit alone would have
# "worked" in the sense that nothing errored, and the shortfall would only have
# shown up as ammo mysteriously never being craftable in quantity.
BIOME_MODIFIERS: list[tuple[str, str, dict, str]] = [
    ("gunpowderore*.jar",
     "data/gunpowderore/neoforge/biome_modifier/gun_powder_ore_biome_modifier.json",
     {
         "type": "neoforge:add_features",
         # Every overworld biome. The Y range is what gates it now, not the biome.
         "biomes": "#minecraft:is_overworld",
         "features": "gunpowderore:gun_powder_ore",
         "step": "underground_ores",
     },
     "was dripstone_caves + lush_caves only; depth is the gate, not biome"),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    repo = pathlib.Path(__file__).resolve().parent.parent
    out = pathlib.Path(args.out) if args.out else repo / "pack" / "datapacks" / PACK_NAME
    written = 0

    for jar_glob, path, y_min, y_max, count, why in OVERRIDES:
        jars = glob.glob(f"{MODS}/{jar_glob}")
        if not jars:
            print(f"!!  no jar matching {jar_glob} - SKIPPED (mod removed?)")
            continue
        z = zipfile.ZipFile(jars[0])
        if path not in z.namelist():
            print(f"!!  {path} not in {jars[0]} - SKIPPED (mod restructured?)")
            continue

        data = json.loads(z.read(path))
        before = json.dumps(data.get("placement"))
        data["placement"] = retarget(data.get("placement", []), y_min, y_max, count)
        if json.dumps(data["placement"]) == before:
            print(f"!!  {path}: nothing changed - no height_range/count found?")

        dest = out / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="\n")
        written += 1
        print(f"  {path.split('/')[-1]:<24} -> y {y_min}..{y_max}, count {count}")
        print(f"      {why}")

    for jar_glob, path, body, why in BIOME_MODIFIERS:
        jars = glob.glob(f"{MODS}/{jar_glob}")
        if not jars:
            print(f"!!  no jar matching {jar_glob} - SKIPPED")
            continue
        z = zipfile.ZipFile(jars[0])
        if path not in z.namelist():
            print(f"!!  {path} not in {jars[0]} - SKIPPED (mod restructured?)")
            continue
        old = json.loads(z.read(path))
        dest = out / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(body, indent=2) + "\n", encoding="utf-8", newline="\n")
        written += 1
        print(f"  {path.split('/')[-1]:<40} biomes {old.get('biomes')} -> {body['biomes']}")
        print(f"      {why}")

    if not written:
        print("nothing written")
        return 1

    (out / "pack.mcmeta").write_text(json.dumps({
        "pack": {
            "pack_format": PACK_FORMAT,
            "description": "Pushes materials to the depth they belong at "
                           "(docs/10-DEPTH-LOOP.md §2b).",
        }
    }, indent=2) + "\n", encoding="utf-8", newline="\n")

    print(f"\nwrote {written} override(s) + pack.mcmeta -> {out}")
    print("Affects NEWLY GENERATED chunks only.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
