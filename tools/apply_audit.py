"""Apply the theme-audit decisions to modlist.json.

Companion to docs/07-THEME-AUDIT.md. Every cut here traces to a numbered audit
finding and an explicit decision, so the reasoning survives longer than the
conversation that produced it. Like trim_to_budget.py, cuts are DATA: delete a
line and re-run to restore the mod.

Run:  python tools/apply_audit.py [--dry-run]
"""

from __future__ import annotations

import json
import pathlib
import sys

import jsonfmt

MODLIST = pathlib.Path(__file__).resolve().parent / "modlist.json"

CUTS: dict[str, str] = {
    # --- F2: two death-recovery systems, one silently wins on death ---------
    "gravestone-mod": "F2. Duplicate of Corpse. Kept Corpse - retrieving your own body from where it fell suits the horror layer better than a tidy headstone.",

    # --- F3: two chunk-loading systems -------------------------------------
    "chunk-loaders": "F3. Duplicate of Create: Power Loader, which is kinetic and Create-native. This one is a generic utility block doing the same verb.",

    # --- F5: four mods hanging off one flavour dimension, and the cause of F4
    "create-dimension,-steamworks-realm": "F5. Cost four mods via its dependency chain and directly caused the village collision in F4. Weakest thing in the pack per mod spent.",
    "create-better-villagers": "F5. Transitive dependency of Steamworks Realm; also collided with Epic Structures: Villages, which was chosen precisely because it replaces other village mods.",
    "underground-village,-stoneholm": "F5. Transitive dependency two levels down from Steamworks Realm.",
    "better-library": "F5. Transitive dependency three levels down from Steamworks Realm.",

    # --- F6: dimensions nobody will visit ----------------------------------
    "aether": "F6. Dimension sprawl. Kept only the two dimensions that serve a pillar directly - The Undergarden (buried-tech) and Cataclysm (combat).",
    "the-bumblezone": "F6. Dimension sprawl - no connection to any pillar.",
    "nullscape": "F6. Dimension sprawl - an End overhaul serving no pillar.",

    # --- F9: R4 applied consistently to gear, not just weapons -------------
    "mythic-upgrades": "F9. Gem-based gear upgrades are pure numbers. R4 cut Simply Swords and Medieval Craft for the same reason; Apotheosis already supplies affixed loot for progression.",
    "advanced-netherite": "F9. More netherite tiers - pure numbers, no new behaviour.",
    "cataclysm-tools": "F9. Tools from boss materials, mostly stat lines.",
}

# --- F11: filed under the wrong category, which distorts the counts --------
MOVES: dict[str, tuple[str, str]] = {
    "legendary-tooltips": ("horror", "qol"),
}


def main() -> int:
    dry = "--dry-run" in sys.argv
    data = json.loads(MODLIST.read_text(encoding="utf-8"))
    cats = data["categories"]

    removed: list[str] = []
    for cat, block in cats.items():
        keep = []
        for row in block["mods"]:
            if row[0] in CUTS:
                removed.append(f"{row[0]} [{cat}]")
            else:
                keep.append(row)
        block["mods"] = keep

    moved: list[str] = []
    for slug, (src, dst) in MOVES.items():
        row = None
        for r in list(cats.get(src, {}).get("mods", [])):
            if r[0] == slug:
                row = r
                cats[src]["mods"].remove(r)
                break
        if row and dst in cats:
            cats[dst]["mods"].append(row)
            moved.append(f"{slug}: {src} -> {dst}")

    missing = sorted(set(CUTS) - {r.split(" [")[0] for r in removed})
    total = sum(len(b["mods"]) for b in cats.values())

    data["theme_audit"] = {
        "_comment": [
            "Applied by tools/apply_audit.py; findings in docs/07-THEME-AUDIT.md.",
            "Cuts are data, not history: delete an entry from CUTS and re-run to restore.",
        ],
        "cuts": [[slug, reason] for slug, reason in sorted(CUTS.items())],
    }

    print(f"removed {len(removed)}, moved {len(moved)}, {total} mods remain")
    for r in sorted(removed):
        print(f"  - {r}")
    for m in moved:
        print(f"  ~ {m}")
    if missing:
        print("\nWARNING - declared in CUTS but not found in modlist.json:")
        for s in missing:
            print(f"  ? {s}")

    if dry:
        print("\n(dry run - modlist.json not written)")
        return 0
    jsonfmt.write(MODLIST, data)
    print(f"\nwrote {MODLIST}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
