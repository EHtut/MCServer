"""Find weapons that silently fall back to the vanilla arm swing.

THE BUG CLASS

Epic Fight assigns a weapon capability automatically ONLY by vanilla item class.
CommonItemCapabilityProvider registers presets against exactly:

    SwordItem  AxeItem  PickaxeItem  ShovelItem  HoeItem
    BowItem    CrossbowItem  ShieldItem  ArmorItem

A mod whose weapons extend one of those inherits movesets for free. A mod that
writes its own Item subclass gets NOTHING - no moveset, no combo, no stance -
and there is no error, because "this weapon has no capability" and "you have not
swung this weapon yet" are indistinguishable in every log.

Ethan found it by feel on Spore. Ethan's stated focus for the whole pack is
"animations for all the weapons to keep playstyles dynamic", so a weapon that
swings like vanilla is a direct hit on the point of the pack. This finds the
rest before he has to notice them one at a time.

HOW A WEAPON IS IDENTIFIED - by TAG, which is the only honest signal

    WEAPON  the item is listed in a melee-weapon item tag - minecraft:swords,
            minecraft:axes, minecraft:enchantable/sharp_weapon,
            c:tools/melee_weapon, c:tools/knife, c:tools/spear, ...

The first version of this file used "the item model's parent contains handheld"
and it was WRONG. Handheld means *held out in the hand*, not *weapon*: it
flagged Theurgy's divination rods, Storage Drawers' keyrings, and Frights
Delight's BONE KEBABS. 82 of the 82 "weapons" it found in Theurgy were dowsing
rods.

Tags are what mods actually use to declare "this is a sword", 23 jars contribute
to minecraft:swords alone, and it is the same signal the game itself uses for
enchanting and tool behaviour. Model parent is now only reported as context.

WHAT COUNTS AS COVERED

    1. the mod ships data/<ns>/capabilities/weapons/<item>.json      (explicit)
    2. our own mcserver_epicfight_weapons datapack covers it         (explicit)
    3. the mod's classes reference a vanilla weapon Item class       (inherited)

(3) is a heuristic and is reported as evidence, never as a verdict: a jar can
mention SwordItem without any weapon extending it - which is exactly what Spore
did, referencing it once from something that was not a weapon.

Run:  python tools/audit_movesets.py [--mods <dir>] [--verbose]
"""

from __future__ import annotations

import argparse
import glob
import json
import pathlib
import re
import zipfile

SERVER_MODS = r"C:\MCServer\instance\mods"
OURS = pathlib.Path(__file__).resolve().parent.parent / "pack" / "datapacks" / "mcserver_epicfight_weapons"

VANILLA_WEAPON_CLASSES = (
    b"net/minecraft/world/item/SwordItem",
    b"net/minecraft/world/item/AxeItem",
    b"net/minecraft/world/item/PickaxeItem",
    b"net/minecraft/world/item/ShovelItem",
    b"net/minecraft/world/item/HoeItem",
    b"net/minecraft/world/item/BowItem",
    b"net/minecraft/world/item/CrossbowItem",
    b"net/minecraft/world/item/ShieldItem",
)

CAP_RX = re.compile(r"data/([^/]+)/capabilities/weapons/(.+)\.json$")
TAG_RX = re.compile(r"data/([^/]+)/tags/items?/(.+)\.json$")

# Tags that mean "you hit things with this". Deliberately excludes pickaxes,
# shovels and hoes: Epic Fight already covers those by vanilla class, and they
# are mining tools rather than the movesets Ethan cares about.
WEAPON_TAGS = {
    "minecraft:swords", "minecraft:axes",
    "minecraft:enchantable/sharp_weapon", "minecraft:enchantable/weapon",
    "minecraft:enchantable/sword", "minecraft:spear",
    "c:tools/melee_weapon", "c:tools/sword", "c:tools/swords",
    "c:tools/knife", "c:tools/knives", "c:tools/spear", "c:tools/axe", "c:tools/axes",
    "farmersdelight:tools/knives",
}


def tag_entries(blob: bytes) -> list[str]:
    """Item ids from a tag file. Entries are strings OR {"id":..,"required":..}."""
    try:
        d = json.loads(blob.decode("utf-8", "replace"))
    except Exception:
        return []
    out = []
    for v in d.get("values", []):
        i = v.get("id") if isinstance(v, dict) else v
        if isinstance(i, str) and not i.startswith("#"):
            out.append(i if ":" in i else "minecraft:" + i)
    return out


# The tag that declared an item a weapon also says WHAT KIND it is, and that is
# the honest basis for picking a preset: it gives each weapon the same moveset
# vanilla-class inheritance would have given it. Assigning epicfight:sword to
# something that already inherits epicfight:sword is a no-op; assigning it to
# something that inherited NOTHING is the whole fix.
TAG_PRESET = {
    "minecraft:swords": "epicfight:sword",
    "c:tools/sword": "epicfight:sword",
    "c:tools/swords": "epicfight:sword",
    "minecraft:enchantable/sword": "epicfight:sword",
    "minecraft:axes": "epicfight:axe",
    "c:tools/axe": "epicfight:axe",
    "c:tools/axes": "epicfight:axe",
    "c:tools/knife": "epicfight:dagger",
    "c:tools/knives": "epicfight:dagger",
    "farmersdelight:tools/knives": "epicfight:dagger",
    "c:tools/spear": "epicfight:spear",
    "minecraft:spear": "epicfight:spear",
    # generic "it is a weapon" tags - no shape information, so the plainest set
    "minecraft:enchantable/sharp_weapon": "epicfight:sword",
    "minecraft:enchantable/weapon": "epicfight:sword",
    "c:tools/melee_weapon": "epicfight:sword",
}

# Only unambiguous shape words, applied AFTER the tag. This is a flavour choice,
# not a correctness one - every value here is a valid two-handed variant of the
# sword set, so a wrong guess costs feel, never function. Edit freely.
NAME_REFINE = (
    ("greatsword", "epicfight:greatsword"),
    ("great_sword", "epicfight:greatsword"),
    ("longsword", "epicfight:longsword"),
    ("long_sword", "epicfight:longsword"),
    ("katana", "epicfight:uchigatana"),
    ("tachi", "epicfight:tachi"),
    ("dagger", "epicfight:dagger"),
    ("knife", "epicfight:dagger"),
    ("spear", "epicfight:spear"),
    ("halberd", "epicfight:spear"),
    ("glaive", "epicfight:spear"),
    ("scythe", "epicfight:longsword"),
)


def choose_preset(item: str, tags: set[str]) -> str:
    base = next((TAG_PRESET[t] for t in tags if t in TAG_PRESET), "epicfight:sword")
    leaf = item.split(":", 1)[1].lower()
    for word, preset in NAME_REFINE:
        if word in leaf:
            return preset
    return base


def ours_covered() -> set[str]:
    out = set()
    if OURS.is_dir():
        for f in OURS.rglob("*.json"):
            parts = f.relative_to(OURS).parts
            if len(parts) >= 4 and parts[0] == "data" and parts[2] == "capabilities":
                out.add(f"{parts[1]}:{f.stem}")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--mods", default=SERVER_MODS)
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--write", action="store_true",
                    help="emit capability files for every gap into the datapack")
    a = ap.parse_args()

    covered_by_us = ours_covered()
    jars = sorted(glob.glob(str(pathlib.Path(a.mods) / "*.jar")))

    # PASS 1 - the union of every melee-weapon tag, across every jar. A mod
    # declares its swords by ADDING to minecraft:swords from its own jar, so the
    # answer only exists once all of them are merged.
    weapons: set[str] = set()
    caps: set[str] = set()
    item_tags: dict[str, set[str]] = {}    # item -> the weapon tags it appears in
    for jp in jars:
        try:
            z = zipfile.ZipFile(jp)
            names = z.namelist()
        except Exception:
            continue
        for n in names:
            if (m := TAG_RX.match(n)) and f"{m.group(1)}:{m.group(2)}" in WEAPON_TAGS:
                tag = f"{m.group(1)}:{m.group(2)}"
                for item in tag_entries(z.read(n)):
                    weapons.add(item)
                    item_tags.setdefault(item, set()).add(tag)
            elif (m := CAP_RX.match(n)):
                caps.add(f"{m.group(1)}:{m.group(2)}")

    # PASS 2 - per-mod evidence for whatever is left uncovered.
    by_mod: dict[str, list[str]] = {}
    for w in sorted(weapons):
        if w in caps or w in covered_by_us:
            continue
        by_mod.setdefault(w.split(":", 1)[0], []).append(w)

    rows = []
    total_weapons, total_gap = len(weapons), sum(len(v) for v in by_mod.values())
    for jp in jars:
        name = pathlib.Path(jp).name
        try:
            z = zipfile.ZipFile(jp)
            names = z.namelist()
        except Exception:
            continue
        toml = next((c for c in ("META-INF/neoforge.mods.toml", "META-INF/mods.toml")
                     if c in names), None)
        if not toml:
            continue
        modid = (re.search(r'modId\s*=\s*"([^"]+)"',
                           z.read(toml).decode("utf-8", "replace")) or [None, "?"])[1]
        gap = by_mod.get(modid, [])
        mine = sum(1 for w in weapons if w.startswith(modid + ":"))
        if not mine:
            continue
        mycaps = sum(1 for c in caps if c.startswith(modid + ":"))
        vanilla_refs = 0
        for n in names:
            if not n.endswith(".class"):
                continue
            try:
                b = z.read(n)
            except Exception:
                continue
            if any(v in b for v in VANILLA_WEAPON_CLASSES):
                vanilla_refs += 1
        rows.append((len(gap), mine, mycaps, vanilla_refs, name, gap, {}))

    rows.sort(reverse=True)
    print(f"{'GAP':>4} {'wpns':>5} {'caps':>5} {'vcls':>5}  mod")
    print("-" * 104)
    for gapn, wn, cn, vc, name, gap, weapons in rows:
        if gapn == 0 and not a.verbose:
            continue
        flag = ""
        if gapn and vc == 0:
            flag = "  <== NO vanilla weapon class ANYWHERE: every weapon here is custom"
        elif gapn and cn == 0:
            flag = "  <== ships no capability files"
        print(f"{gapn:>4} {wn:>5} {cn:>5} {vc:>5}  {name[:46]}{flag}")
        if a.verbose or (gapn and vc == 0):
            for w in gap[:14]:
                print(f"{'':>22} {w}")
            if len(gap) > 14:
                print(f"{'':>22} ... and {len(gap) - 14} more")

    print("-" * 104)
    print(f"  {total_weapons} tagged melee weapons across the pack")
    print(f"  {total_gap} have NO Epic Fight capability from any source")
    print()
    print("  vcls = classes in that jar referencing a vanilla weapon Item class.")
    print("  vcls 0 with a non-zero GAP is the strong signal: nothing in the jar")
    print("  can inherit a moveset, so every one of those weapons swings vanilla.")
    print("  A non-zero vcls is NOT proof of coverage - Spore referenced SwordItem")
    print("  exactly once, from something that was not a weapon.")

    if a.write:
        from collections import Counter
        tally = Counter()
        n = 0
        for items in by_mod.values():
            for w in items:
                ns, item = w.split(":", 1)
                preset = choose_preset(w, item_tags.get(w, set()))
                out = OURS / "data" / ns / "capabilities" / "weapons"
                out.mkdir(parents=True, exist_ok=True)
                (out / f"{item}.json").write_text(
                    json.dumps({"type": preset}, indent=2) + "\n",
                    encoding="utf-8", newline="\n")
                tally[preset] += 1
                n += 1
        print(f"\n  WROTE {n} capability file(s) into {OURS}")
        for preset, c in tally.most_common():
            print(f"    {preset:<26} {c}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
