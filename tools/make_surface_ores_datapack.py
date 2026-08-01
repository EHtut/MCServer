"""Make every ore obtainable above y 54, so descending is a CHOICE.

The problem this solves
-----------------------
A peaceful surface plus vanilla ore distribution is a contradiction: diamonds
peak at y -59, so "the surface is safe and you never have to go down" collides
with "you must go down for basic kit". Half the pack's mods want diamonds for
their entry-level recipes, which turns the descent from a decision into a chore.

So every ore also generates in a surface band, SPARSELY. Deep mining is still
far more efficient - it is simply no longer compulsory.

Implementation: new placed_features that reuse VANILLA configured features (so
ore composition, blob size and deepslate variants stay exactly vanilla), placed
in a y 54-120 band, attached to every overworld biome with a NeoForge biome
modifier. Nothing about the existing deep distribution is touched - this is
purely additive.

  python tools/make_surface_ores_datapack.py
"""

from __future__ import annotations

import json
import pathlib

NAMESPACE = "mcserver"
PACK_NAME = "mcserver_surface_ores"

MIN_Y, MAX_Y = 54, 120

# (vanilla configured feature, veins per chunk in the surface band)
#
# Counts are deliberately meagre. The intent is "you CAN find diamonds up here if
# you look", not "the surface is a better mine". Vanilla runs ~7 iron and ~20
# coal veins per chunk at depth; these are a fraction of that.
#
# These ids are the REAL vanilla configured-feature names, taken from the server
# jar. Guessing them cost a boot: "minecraft:ore_copper" and
# "minecraft:ore_diamond" do not exist - copper is split small/large and diamond
# into small/medium/large/buried - and the server refused to load the world with
# "Unbound values in registry configured_feature". Hence validate_against_jar().
ORES: list[tuple[str, float]] = [
    ("minecraft:ore_coal",           8),
    ("minecraft:ore_copper_small",   5),
    ("minecraft:ore_copper_large",   1),
    ("minecraft:ore_iron",           4),
    ("minecraft:ore_iron_small",     3),
    ("minecraft:ore_gold",           2),
    ("minecraft:ore_redstone",       2),
    ("minecraft:ore_lapis",          2),
    ("minecraft:ore_diamond_small",  1),   # the one that matters - rare, present
    ("minecraft:ore_diamond_medium", 1),
    ("minecraft:ore_emerald",        1),
]


def validate_against_jar(instance: pathlib.Path, ids: list[str]) -> None:
    """Fail loudly if any configured feature does not exist in vanilla.

    An unbound registry reference does not degrade gracefully - it stops the
    world loading entirely. Checking here turns a failed boot into a failed
    script run, which is a much cheaper place to find out.
    """
    import zipfile
    root = instance / "libraries" / "net" / "minecraft" / "server"
    jars = sorted(root.rglob("server-*.jar")) if root.exists() else []
    known: set[str] = set()
    for j in jars:
        try:
            with zipfile.ZipFile(j) as z:
                for n in z.namelist():
                    if "worldgen/configured_feature/" in n and n.endswith(".json"):
                        known.add("minecraft:" + n.split("/")[-1][:-5])
        except Exception:
            continue
    if not known:
        print("!! could not read vanilla configured features from the server jar;")
        print("!! skipping validation - verify the world actually loads.")
        return
    missing = [i for i in ids if i not in known]
    if missing:
        raise SystemExit(
            "ABORT: these configured features do not exist in vanilla:\n  "
            + "\n  ".join(missing)
            + "\n\nWriting them would make the world fail to load with "
              "'Unbound values in registry'."
        )
    print(f"validated {len(ids)} configured features against the server jar\n")


def placed_feature(cf: str, count: float) -> dict:
    return {
        "feature": cf,
        "placement": [
            {"type": "minecraft:count", "count": int(count)},
            {"type": "minecraft:in_square"},
            {
                "type": "minecraft:height_range",
                "height": {
                    "type": "minecraft:uniform",
                    "min_inclusive": {"absolute": MIN_Y},
                    "max_inclusive": {"absolute": MAX_Y},
                },
            },
            {"type": "minecraft:biome"},
        ],
    }


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--instance", default="C:/MCServer/instance")
    args = ap.parse_args()

    repo = pathlib.Path(__file__).resolve().parent.parent
    out = repo / "pack" / "datapacks" / PACK_NAME
    validate_against_jar(pathlib.Path(args.instance), [cf for cf, _ in ORES])
    pf_dir = out / "data" / NAMESPACE / "worldgen" / "placed_feature"
    bm_dir = out / "data" / NAMESPACE / "neoforge" / "biome_modifier"
    pf_dir.mkdir(parents=True, exist_ok=True)
    bm_dir.mkdir(parents=True, exist_ok=True)

    ids = []
    for cf, count in ORES:
        short = cf.split(":")[1].replace("ore_", "")
        name = f"surface_{short}"
        (pf_dir / f"{name}.json").write_text(
            json.dumps(placed_feature(cf, count), indent=2) + "\n", encoding="utf-8")
        ids.append(f"{NAMESPACE}:{name}")
        print(f"  {short:<9} x{int(count):<3} from {cf}")

    (bm_dir / "surface_ores.json").write_text(json.dumps({
        "type": "neoforge:add_features",
        "biomes": "#minecraft:is_overworld",
        "features": ids,
        # underground_ores is the correct generation step even above y 0 - it is
        # the step name, not a depth.
        "step": "underground_ores",
    }, indent=2) + "\n", encoding="utf-8")

    (out / "pack.mcmeta").write_text(json.dumps({
        "pack": {
            "pack_format": 48,
            "description": (
                f"MCServer: every ore also generates sparsely between y{MIN_Y} and "
                f"y{MAX_Y}, so going deeper is a choice rather than a requirement."
            ),
        }
    }, indent=2) + "\n", encoding="utf-8")

    print(f"\nwrote {len(ids)} placed features + 1 biome modifier -> {out}")
    print("\nAdditive only: vanilla deep ore generation is untouched, so depth is")
    print("still far more productive. Requires a NEW world - ore placement runs at")
    print("chunk generation, so existing chunks keep the old distribution.")
    print("\nVERIFY: /locate is no help for ores. Generate a world and dig a surface")
    print("shaft between y54-120, or use a spectator sweep. If diamonds never appear,")
    print("check the biome modifier applied: too-low counts look identical to a")
    print("modifier that silently failed to load.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
