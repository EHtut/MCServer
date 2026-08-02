"""Repair mod tags that are killed by references to mods we do not have.

THE BUG THIS FIXES

A tag file lists its entries as plain strings:

    {"values": ["minecraft:plains", "biomesoplenty:bog", "terralith:moorland"]}

If ANY plain-string entry names something that does not exist, Minecraft
discards the WHOLE TAG - not just that entry. The tag then resolves to empty,
and a structure whose `biomes` field points at an empty tag generates nowhere.

That is silent. There is no runtime error, no "structure failed to place". The
only trace is one line at load:

    Not all defined tags for registry ... are present in data pack:
      medieval_buildings:has_structure/fort, .../house_1, .../house_2, .../tower

Medieval Buildings ships four structure tags listing 54-58 biomes each, mostly
from Biomes O' Plenty, Terralith and Regions Unexplored - none of which are in
this pack. Result: of fort, tower, house_1, house_2 and ship, only `ship`
generated, because it is the one tag that only references `#minecraft:is_ocean`.
The mod the manifest calls the core of the world-dressing ruling was
contributing boat wrecks.

THE FIX

Vanilla already has the right mechanism: an entry written as an OBJECT with
`required: false` is skipped when missing instead of killing its tag.

    {"id": "biomesoplenty:bog", "required": false}

So we re-emit each tag with every entry converted to an optional object. This
preserves the mod author's biome choices exactly - anything present still
matches, anything absent is ignored. No biome list is invented here, which
matters: guessing biomes would be a design decision, and this is a bug fix.

Structures only place in NEWLY GENERATED chunks. Existing chunks stay as they
are; walk somewhere new to see them.

Run:  python tools/make_tagfix_datapack.py [--out <dir>]
"""

from __future__ import annotations

import argparse
import glob
import json
import pathlib
import zipfile

PACK_NAME = "mcserver_tagfix"
PACK_FORMAT = 48  # 1.21.1

# (jar glob, tag paths inside the jar to repair)
TARGETS: list[tuple[str, str]] = [
    ("medieval_buildings*.jar", "data/medieval_buildings/tags/worldgen/biome/has_structure/"),
]

MODS = r"C:/MCServer/instance/mods"


def optional(entry):
    """Convert a tag entry to the object form that tolerates absence.

    Tag REFERENCES (leading '#') and entries already in object form are left
    alone - a missing tag reference is tolerated by vanilla already, and
    rewriting an object risks discarding fields we did not anticipate.
    """
    if isinstance(entry, dict):
        return entry
    if isinstance(entry, str) and entry.startswith("#"):
        return entry
    return {"id": entry, "required": False}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    repo = pathlib.Path(__file__).resolve().parent.parent
    out = pathlib.Path(args.out) if args.out else repo / "pack" / "datapacks" / PACK_NAME
    written = 0

    for jar_glob, prefix in TARGETS:
        jars = glob.glob(f"{MODS}/{jar_glob}")
        if not jars:
            print(f"!!  no jar matching {jar_glob} - skipping (is the mod still installed?)")
            continue
        z = zipfile.ZipFile(jars[0])
        names = [n for n in z.namelist() if n.startswith(prefix) and n.endswith(".json")]
        if not names:
            print(f"!!  {jar_glob}: no tags under {prefix}")
            continue
        for n in names:
            data = json.loads(z.read(n))
            before = data.get("values", [])
            data["values"] = [optional(e) for e in before]

            # MUST be true, and the first version of this file got it wrong.
            #
            # Minecraft MERGES tags across datapacks unless a file sets
            # "replace": true. The mod's own tag ships "replace": false, and this
            # generator copied the whole object - so the repaired entries were
            # simply appended to the broken plain-string ones, which still killed
            # the tag exactly as before. The fix produced no error and no change,
            # and the server went on logging the identical failure.
            #
            # Verified by rereading the emitted file after the first attempt:
            # `replace = False`, inherited rather than chosen.
            data["replace"] = True
            hard = sum(1 for e in before if isinstance(e, str) and not e.startswith("#"))
            dest = out / n[len("data/"):].replace("/", "/", 1)
            dest = out / "data" / n[len("data/"):]
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="\n")
            written += 1
            print(f"  {n.split('/')[-1]:<14} {len(before)} entries, {hard} made optional")

    if not written:
        print("nothing written")
        return 1

    (out / "pack.mcmeta").write_text(json.dumps({
        "pack": {
            "pack_format": PACK_FORMAT,
            "description": "Re-emits mod tags with optional entries so a reference to an "
                           "absent mod cannot discard the whole tag.",
        }
    }, indent=2) + "\n", encoding="utf-8", newline="\n")

    print(f"\nwrote {written} tag(s) + pack.mcmeta -> {out}")
    print("Structures place in NEWLY generated chunks only.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
