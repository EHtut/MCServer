"""Copy every generated datapack into the live world.

WHY THIS EXISTS

World regeneration has been done by hand, and the staging step was a typed-out
list of pack names. That list was correct on the day it was written and is a
silent time bomb afterwards: add a seventh datapack, regenerate the world, and
the new one is simply absent. Nothing errors. The world just quietly lacks a
mechanic, which is this project's single most common defect shape.

`mcserver_epicfight_weapons` was nearly the first casualty - it was created
after the last regen, so the five-name list would have dropped it.

Enumerating the directory cannot go stale.

NOTE datapacks live INSIDE the world folder, so archiving a world takes them
with it and a fresh world starts with none. This must run after every regen.

Run:  python tools/stage_datapacks.py [--world C:\\MCServer\\instance\\world]
"""

from __future__ import annotations

import argparse
import pathlib
import shutil

SRC = pathlib.Path(__file__).resolve().parent.parent / "pack" / "datapacks"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--world", default=r"C:\MCServer\instance\world")
    args = ap.parse_args()

    world = pathlib.Path(args.world)
    if not world.is_dir():
        print(f"  no world at {world} - nothing staged")
        return 1

    dest = world / "datapacks"
    dest.mkdir(parents=True, exist_ok=True)

    packs = sorted(p for p in SRC.iterdir() if p.is_dir())

    # THIS FILE EXISTS TO STOP A SILENT OMISSION AND STILL HAD ONE. It copies
    # DIRECTORIES only, so a .zip datapack - which is how every third-party one
    # downloads - was skipped without a word. spawn_animations was nearly the second
    # casualty of exactly the bug the header above describes.
    #
    # It is not silently supported either: a zip is REPORTED, loudly, and the fix is
    # named. Extracting it here would guess at a layout; saying so does not.
    skipped = sorted(p for p in SRC.iterdir() if not p.is_dir())
    if skipped:
        print("  !! NOT STAGED - these are not directories, and this tool copies")
        print("  !! directories only. Extract them into a folder under pack/datapacks:")
        for p in skipped:
            print(f"       {p.name}")
        print()

    if not packs:
        print(f"  no datapacks in {SRC}")
        return 1

    for p in packs:
        target = dest / p.name
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(p, target)
        files = sum(1 for _ in target.rglob("*") if _.is_file())
        print(f"  staged {p.name:<32} {files:>4} file(s)")

    print(f"\n{len(packs)} datapack(s) -> {dest}")
    print("Remember: /reload picks these up on a running server;")
    print("worldgen changes still need NEW CHUNKS.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
