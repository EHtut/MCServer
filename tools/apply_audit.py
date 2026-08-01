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

    # --- F12: blocked by CurseForge-only libraries -------------------------
    # Found at first boot by tools/check_deps.py, not by any registry check.
    # Each needs a library that exists only on CurseForge, and Ethan's ruling is
    # that the pack takes no CurseForge dependency at all. Holding the ruling
    # costs these six; the alternative was sourcing four libraries from a second
    # registry and losing the single-source, hash-pinned property of the pack.
    "create-new-age": "F12. Needs 'esl', CurseForge-only. Cheapest of the six to lose: Create: Crafts & Additions already provides the electricity tier, so this was a second path to the same capability.",
    "illager-invasion": "F12. Needs 'extensibleenums', CurseForge-only. Costs one mob roster out of many.",
    "diagonal-fences": "F12. Needs 'diagonalblocks', CurseForge-only.",
    "diagonal-walls": "F12. Needs 'diagonalblocks', CurseForge-only.",
    "diagonal-windows": "F12. Needs 'diagonalblocks', CurseForge-only.",
    "easy-shulker-boxes": "F12. Needs 'iteminteractions', CurseForge-only.",
    "ars-elemancy": "F12. Hard-requires 'ars_elemental' [0.7.0.9,), which is CurseForge-only - its own manifest links to CurseForge. Found at second boot. Ars keeps Additions, Creo, Controle, Unification, Ars'n'Spells, Polymorphia, Structurize, Artillery, Technic, Lumos and the lectern fix.",

    # --- F14: crash on DEDICATED_SERVER (only a real boot finds these) ------
    # Published as both-sides, but their common code touches client-only classes
    # (Screen, PoseStack, ItemRenderer). Fine on a client; on a dedicated server
    # those classes do not exist and construction throws. Upstream bugs, not
    # packaging errors - no manifest check can predict them.
    "epic-fight-sword-soaring": "F14. RuntimeException: Attempted to load class net/minecraft/client/gui/screens/Screen for invalid dist DEDICATED_SERVER. Painful loss - this was the wuxia specialisation layer Ethan chose to make melee about movesets rather than stat lines. Epic Fight itself still supplies movesets, stances and combos.",
    "kenny": "F14. Same DEDICATED_SERVER crash. One stalker of six, and the least distinctive; The Knocker, Obsessed, The Skinwalker Hunt, Distant Friends and Weeping Angels remain.",

    # --- F17: crashes the CLIENT, proven by a crash report -----------------
    "jadens-nether-expansion": "F17. Crashes the client every tick: IllegalStateException 'Cannot get config value before config is loaded' in JNEClientEvents.onClientTickPost. Only BETA builds exist for 1.21.1 (2.4.0-BETA.1 through .7), so there is no stable version to fall back to. Proven by crash-2026-07-31_22.16.18-client.txt, not guessed.",

    # --- F16: redundant, and the mod itself says so ------------------------
    "figura-v5-support": "F16. Figura 0.1.6 declares it incompatible with the reason 'This addon's features are already included in this Figura version!'. Adding it was my error; the mod's own manifest is the authority.",

    # --- F15: server-unsafe on construction --------------------------------
    "underground-village,-stoneholm": "F15. Its required library better_lib crashes the dedicated server during mod construction (NPE in JsonVillagerLoader - dereferences a null JSON). Re-added for the underground-city idea, dropped again on evidence. The buried city is still served by Underground Worlds' dungeons, Arda's Sculks' Ancient City overhaul, and The Undergarden.",
    "better-library": "F15. NullPointerException in JsonVillagerLoader during construction. Its shipped config is copy-paste boilerplate (FPS limits, render distance, favoriteServers) in a LIBRARY mod - a maintenance signal as much as a bug.",

    # --- F13: mistagged multi-version jars, proven by reading them ----------
    "structory-towers": "F13. Modrinth tags it 1.21.1 + neoforge, but the jar is a multi-version build (26.2) carrying neoforge.mods.toml, mods.toml AND fabric.mod.json plus 1.21.5/1.21.11 overlay folders. NeoForge rejects it outright: 'not a valid mod file'. Same class as zoniex. Base Structory stays and works.",

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
