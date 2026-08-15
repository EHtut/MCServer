"""Generate the buried-tech recipe gating as a DATAPACK, from the mods' own data.

Why a datapack and not KubeJS
-----------------------------
173 of TaCZ's 184 recipes use a custom recipe type, `tacz:gun_smith_table_crafting`
- guns are built at a Gun Smith Table, not a workbench. KubeJS's `event.remove({mod})`
operates on the recipe manager and its handling of third-party custom types is not
something to bet the pack's central design on.

NeoForge gives a loader-native answer that works for ANY recipe type: a recipe
carrying `"neoforge:conditions": [{"type": "neoforge:false"}]` is discarded during
load. Overriding a recipe at its own path with such a file removes it, whatever
type it was.

The classification is derived from the jars, never guessed. An earlier attempt
hard-coded `tacz:ammo` and `tacz:ammo_box` as "the ammunition" - both wrong. TaCZ
ammunition is per-CALIBRE (tacz:9mm, tacz:556x45, tacz:762x39 ...), and a gating
script built on the guess would have silently removed every ammo recipe while
believing it had preserved them.

  python tools/make_buried_tech_datapack.py --instance C:/MCServer/instance
  python tools/make_buried_tech_datapack.py --instance ... --list   # classify only
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import zipfile

PACK_NAME = "mcserver_buried_tech"

# Mods whose output must be FOUND, not made.
#
# ⚠️ securitycraft was REMOVED here 2026-08-15. It was cut from the pack in the A2
# Wall audit, and its leftovers in OUR OWN datapacks kicked Ethan at login the next
# time he joined: Modonomicon syncs guidebooks on connect, the Wall entry used
# securitycraft:reinforced_stone as its icon, an unresolvable item encodes as an
# empty ItemStack, and "Empty ItemStack not allowed" comes back to the player as a
# netty EncoderException naming neither the mod nor the book.
#
# Anything added here must be REMOVED here when the mod is cut. Run
# tools/check_datapack_refs.py after any cut - it catches exactly this.
BURIED = {
    "tacz": "tacz-neoforge-*.jar",
    "diligentstalker": "diligentstalker*.jar",
}

# --- what stays craftable ---------------------------------------------------
# Ammunition and its consumable economy. Ethan's ruling: weapons are
# irreplaceable salvage, bullets are manufacture - otherwise four players run dry
# after two fights and recovered guns become ornaments.
#
# TaCZ calibres are bare numeric-ish ids (9mm, 556x45, 12g, 45_70, 30_06, 40mm),
# which no keyword list would catch, so they are matched structurally.
CALIBRE = re.compile(r"^tacz:\d+[a-z0-9_]*$", re.I)

KEEP_EXACT = {
    "tacz:ammo_box",       # holds ammunition
    "tacz:rpg_rocket",     # ammunition for the RPG
    "tacz:gun_smith_table",  # the bench ammunition is made AT
    "tacz:workbench_a",
    "tacz:workbench_c",
    "tacz:target",         # practice targets - not weapons
    "tacz:target_minecart",
    "tacz:statue",
    "minecraft:gunpowder",  # TaCZ adds a gunpowder recipe; that is the ammo economy
}

KEEP_PREFIX = (
    "tacz:ammo_mod_",          # FMJ / HE / HP / incendiary / slug rounds
    # (the securitycraft:reinforced_ carve-out lived here and went with the mod)
)


def keeps(item_id: str) -> bool:
    if item_id in KEEP_EXACT:
        return True
    if item_id.startswith(KEEP_PREFIX):
        return True
    return bool(CALIBRE.match(item_id))


def result_id(recipe: dict) -> str | None:
    """Item id of a recipe's result, or None if it cannot be determined.

    Recipe result shapes vary by type and by mod: a bare string, {"id": ...},
    {"item": ...}, and - in TaCZ's custom gun-smith type - nested objects whose
    "id" is itself a structure. Anything that does not resolve to a plain string
    is reported rather than coerced, because a mis-parsed result would silently
    classify a gun as ammunition or vice versa.
    """
    r = recipe.get("result")
    if isinstance(r, str):
        return r
    if isinstance(r, dict):
        for key in ("id", "item"):
            v = r.get(key)
            if isinstance(v, str):
                return v
            if isinstance(v, dict):
                inner = v.get("id") or v.get("item")
                if isinstance(inner, str):
                    return inner
    return None


DISABLED = {
    "neoforge:conditions": [{"type": "neoforge:false"}],
    "type": "minecraft:crafting_shapeless",
    "ingredients": [{"item": "minecraft:barrier"}],
    "result": {"id": "minecraft:barrier", "count": 1},
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--instance", default="C:/MCServer/instance")
    ap.add_argument("--out", default=None)
    ap.add_argument("--list", action="store_true", help="classify only, write nothing")
    args = ap.parse_args()

    mods = pathlib.Path(args.instance) / "mods"
    repo = pathlib.Path(__file__).resolve().parent.parent
    out = pathlib.Path(args.out) if args.out else repo / "pack" / "datapacks" / PACK_NAME

    kept: list[tuple[str, str]] = []
    disabled: list[tuple[str, str, str]] = []   # (namespace, path, output)
    unknown_type: set[str] = set()

    for ns, pattern in BURIED.items():
        jars = sorted(mods.glob(pattern))
        if not jars:
            print(f"!! no jar matching {pattern} - skipping {ns}")
            continue
        with zipfile.ZipFile(jars[0]) as z:
            recipes = [n for n in z.namelist()
                       if f"data/{ns}/recipe" in n and n.endswith(".json")]
            for n in recipes:
                try:
                    rec = json.loads(z.read(n))
                except Exception:
                    continue
                out_id = result_id(rec)
                if out_id is None:
                    continue
                unknown_type.add(rec.get("type", "?"))
                # The override path must mirror the ORIGINAL exactly, or it does
                # not replace anything.
                #
                # Do not slice a fixed offset off a substring match: TaCZ nests
                # recipes deeper than data/<ns>/recipe/, so chopping the first
                # five characters produced paths like "s/..." and wrote 143 files
                # into a namespace called "s" while TaCZ itself got one.
                m = re.search(rf"(?:^|/)(data/{re.escape(ns)}/recipe.*)$", n)
                if not m:
                    continue
                rel = m.group(1)[len("data/"):]
                if keeps(out_id):
                    kept.append((out_id, rel))
                else:
                    disabled.append((ns, rel, out_id))

    print(f"recipe types encountered: {', '.join(sorted(unknown_type))}\n")
    print(f"KEEP craftable   : {len(kept)}")
    for o, _ in sorted(set((o, '') for o, _ in kept)):
        print(f"    {o}")
    print(f"\nDISABLE (found only): {len(disabled)}")
    outs = sorted({o for _, _, o in disabled})
    for o in outs[:12]:
        print(f"    {o}")
    print(f"    ... and {max(0, len(outs) - 12)} more distinct outputs")

    if args.list:
        print("\n(--list: nothing written)")
        return 0

    written = 0
    for ns, rel, _out_id in disabled:
        dest = out / "data" / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(DISABLED, indent=2) + "\n", encoding="utf-8")
        written += 1

    (out / "pack.mcmeta").write_text(json.dumps({
        "pack": {
            "pack_format": 48,
            "description": (
                "MCServer buried tech: modern weapons and devices are salvage, not "
                "manufacture. Disables their recipes via neoforge:false; ammunition "
                "stays craftable."
            ),
        }
    }, indent=2) + "\n", encoding="utf-8")

    print(f"\nwrote {written} disabled recipe overrides -> {out}")
    print("\nVERIFY AFTER RELOAD:")
    print("  /reload   then in the recipe viewer:")
    print("    a gun (e.g. tacz:ak47)      -> NO recipe")
    print("    a calibre (e.g. tacz:9mm)   -> STILL has a recipe")
    print("  If ammunition lost its recipe, the CALIBRE regex is wrong - fix and rerun.")
    print("\nGuns are now UNCRAFTABLE. They are only obtainable once loot placement")
    print("exists - until then this makes them unobtainable, which is worse than")
    print("ungated. Do not ship this without the loot half.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
