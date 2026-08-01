"""Build the world-depth datapack by DERIVING it from vanilla, never from memory.

Extending the overworld below Y-64 needs two files changed in lockstep:

  dimension_type/overworld.json   how deep the world IS
  worldgen/noise_settings/overworld.json   how deep terrain is GENERATED

Change the first without the second and the chunk generator produces nothing
below its noise range: a void band from -128 to -64, discovered only after
someone digs into it. They must agree.

Reproducing vanilla's noise settings by hand is how that goes wrong, so this
extracts the real files out of the server jar and edits only the numbers that
must change. Everything else - every density function reference, every surface
rule - stays byte-identical to vanilla.

Safe by construction:
  * Bedrock is placed by a surface rule expressed relative to the world BOTTOM
    ("above_bottom"), so the floor follows min_y automatically.
  * The deepslate transition is at absolute y=0, so the new depth is all
    deepslate, which is what we want.

Known consequence, stated rather than discovered: vanilla's terrain-shaping
gradient clamps at -64, so the extra 64 blocks generate DENSER and less
cavernous than normal depths - largely solid deepslate with sparse voids. For a
band that is meant to be the hardest part of the world to reach, that is the
right shape, but it is a consequence, not an accident.

  python tools/make_depth_datapack.py --instance C:/MCServer/instance
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys
import zipfile

# -128 and 448 keep the build ceiling at y=319 while adding 64 blocks below.
# Minecraft requires min_y and height to be multiples of 16, and
# min_y + height <= 2032.
NEW_MIN_Y = -128
NEW_HEIGHT = 448

PACK_NAME = "mcserver_depth"


def find_server_jar(instance: pathlib.Path) -> pathlib.Path:
    root = instance / "libraries" / "net" / "minecraft" / "server"
    cands = sorted(root.rglob("server-*.jar")) if root.exists() else []
    # Prefer the srg/mojmap server jar that carries the vanilla data pack.
    for c in cands:
        with zipfile.ZipFile(c) as z:
            if "data/minecraft/dimension_type/overworld.json" in z.namelist():
                return c
    raise SystemExit(
        "could not find a server jar containing vanilla worldgen data under "
        f"{root} - run setup-server first"
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--instance", default="C:/MCServer/instance")
    ap.add_argument("--out", default=None,
                    help="output datapack dir (default: repo pack/datapacks/<name>)")
    args = ap.parse_args()

    instance = pathlib.Path(args.instance)
    repo = pathlib.Path(__file__).resolve().parent.parent
    out = pathlib.Path(args.out) if args.out else repo / "pack" / "datapacks" / PACK_NAME

    jar = find_server_jar(instance)
    print(f"vanilla source: {jar.name}")

    with zipfile.ZipFile(jar) as z:
        dim = json.loads(z.read("data/minecraft/dimension_type/overworld.json"))
        noise = json.loads(z.read("data/minecraft/worldgen/noise_settings/overworld.json"))

    old = (dim.get("min_y"), dim.get("height"), dim.get("logical_height"))
    print(f"vanilla dimension_type: min_y={old[0]} height={old[1]} logical_height={old[2]}")
    print(f"vanilla noise:          min_y={noise['noise'].get('min_y')} "
          f"height={noise['noise'].get('height')}")

    # --- the only edits ------------------------------------------------------
    dim["min_y"] = NEW_MIN_Y
    dim["height"] = NEW_HEIGHT
    # logical_height governs portal/chorus teleport range, not terrain. Leave it
    # at vanilla so nothing else shifts.
    dim["logical_height"] = min(old[2] or NEW_HEIGHT, NEW_HEIGHT)

    noise["noise"]["min_y"] = NEW_MIN_Y
    noise["noise"]["height"] = NEW_HEIGHT

    # --- write ---------------------------------------------------------------
    dim_dir = out / "data" / "minecraft" / "dimension_type"
    noise_dir = out / "data" / "minecraft" / "worldgen" / "noise_settings"
    dim_dir.mkdir(parents=True, exist_ok=True)
    noise_dir.mkdir(parents=True, exist_ok=True)

    (dim_dir / "overworld.json").write_text(json.dumps(dim, indent=2) + "\n", encoding="utf-8")
    (noise_dir / "overworld.json").write_text(json.dumps(noise, indent=2) + "\n", encoding="utf-8")

    (out / "pack.mcmeta").write_text(json.dumps({
        "pack": {
            "pack_format": 48,
            "description": (
                f"MCServer: overworld extended to y={NEW_MIN_Y}. "
                "Derived from vanilla by tools/make_depth_datapack.py - only min_y "
                "and height are changed."
            ),
        }
    }, indent=2) + "\n", encoding="utf-8")

    print(f"\nwrote {out}")
    print(f"  dimension_type/overworld.json   min_y={NEW_MIN_Y} height={NEW_HEIGHT} "
          f"logical_height={dim['logical_height']}")
    print(f"  worldgen/noise_settings/overworld.json  matched to the same range")
    print("\nVERIFY BEFORE THE REAL WORLD IS GENERATED:")
    print("  1. Generate a throwaway world with this pack active.")
    print("  2. Dig or teleport below -64 and confirm STONE, not void.")
    print("     A void band is the failure mode if the two files disagree.")
    print("  3. Check bedrock sits at -128..-124, not -64.")
    print("\nThis CANNOT be applied to an existing world - it changes worldgen.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
