"""Apply the budget trim to modlist.json, and record WHY each mod was cut.

The candidate list was deliberately over-built. Folding in the 53 real
dependencies pushed it past the 400 cap, so something had to go. Rather than
quietly deleting lines, every cut is declared here with a reason, so the
decision is reviewable and reversible: delete a line from CUTS, re-run, and the
mod comes back.

Two of these are not budget cuts at all - they are correctness cuts, and they
would be wrong to keep at any budget:

  epic-fight      Mutually exclusive with better-combat. Installing both is a
                  known conflict, not a preference.
  rubidium-extra  Requires Embeddium, which is an ALTERNATIVE renderer to
                  Sodium, not a companion. The pack ships Sodium.

Run:  python tools/trim_to_budget.py [--dry-run]
"""

from __future__ import annotations

import json
import pathlib
import sys

import jsonfmt

MODLIST = pathlib.Path(__file__).resolve().parent / "modlist.json"

CUTS: dict[str, str] = {
    # --- correctness, not budget ------------------------------------------
    "epic-fight": "Conflicts with better-combat; the two are alternatives. Better Combat wins on compatibility across 400 mods.",
    "rubidium-extra": "Pulls in Embeddium, which competes with Sodium rather than complementing it. Embeddium stays documented as the fallback renderer, not installed.",

    # --- five gun frameworks is four too many -----------------------------
    "scorched-guns-neoforged": "Fourth overlapping gun framework; community port with the smallest user base of the four.",
    "happiness-is-a-warm-gun": "Redundant once Superb Warfare, Vic's Point Blank, TaCZ and Create: Gunsmithing are in.",
    "ntgl": "Gun animation library with no remaining dependent after the framework trim.",
    "elite-x-quality-guns": "TaCZ content pack - content breadth we do not need on top of four frameworks.",
    "cyberpunk-2077-guns-for-vics-point-blank": "Off-theme content pack; a cyberpunk arsenal does not fit an industrial-magic-horror world.",

    # --- stalker soup: too many entities hunting at once is comedy --------
    "face-of-horror": "Overlaps The Knocker and Distant Friends; weakest of the watchers.",
    "horror-faces": "Same niche as face-of-horror.",
    "hollowsteve": "Third boss-stalker; Obsessed and Kenny already cover escalating stalkers.",
    "boy-and-the-bath": "Novelty entity, thin next to Cryptid and The Skinwalker Hunt.",
    "spooky-doors": "Gimmick that fires constantly and would wear out within a week.",
    "warlerys-dark-blood": "Overlaps Enhanced Celestials' blood moons and no_moon.jar's escalation.",
    "sleepless-datapack": "Sleep punishment collides with Comforts and with four players on different schedules.",

    # --- Create addons with the least reach -------------------------------
    "create-pressure-gauges": "Narrow readout addon; Create's own goggles cover the need.",
    "create-radiologistics": "Wireless logistics duplicates AE2, which is already in.",
    "create-mechanical-extruder": "Single-purpose block generation; also drags in its own library.",
    "create-goggles": "Marginal overlay tweak.",
    "iron-furnaces": "Early-game smelting tiers that Create obsoletes within an hour.",
    "toms-storage": "Third storage network alongside AE2 and Sophisticated Storage.",
    "create-contraption-terminals": "Only meaningful with Tom's Simple Storage, which is cut.",

    # --- QoL overlap -------------------------------------------------------
    "exposure": "Second camera mod; Camerapture covers photography.",
    "immersive-melodies": "Instrument mod competing for attention with proximity voice chat.",
    "simple-radio": "Long-range voice duplicates Simple Voice Chat's group channels.",
    "functional-storage": "Second drawer mod alongside Storage Drawers.",
    "selfexpression": "Cosmetic clothing; pure flavour.",
    "simple-hats": "Cosmetic hats; pure flavour.",

    # --- food/flavour tail -------------------------------------------------
    "mushroom-quest": "Small foraging mod already covered by the Farmer's Delight family.",
    "milky-way": "A milking cooldown is not worth a mod slot plus a library dependency.",
    "dropthemeat": "Butchery already covers mob harvesting.",
}


def main() -> int:
    dry = "--dry-run" in sys.argv
    data = json.loads(MODLIST.read_text(encoding="utf-8"))

    removed: list[str] = []
    kept_total = 0
    for cat, block in data["categories"].items():
        keep = []
        for row in block["mods"]:
            if row[0] in CUTS:
                removed.append(f"{row[0]} [{cat}]")
            else:
                keep.append(row)
        block["mods"] = keep
        kept_total += len(keep)

    not_found = sorted(set(CUTS) - {r.split(" [")[0] for r in removed})

    # Preserve the decision record inside the manifest itself, so someone
    # reading modlist.json alone still sees what was removed and why.
    data["cut_for_budget"] = {
        "_comment": [
            "Applied by tools/trim_to_budget.py. Cuts are data, not history:",
            "remove an entry from CUTS in that script and re-run to restore the mod.",
        ],
        "mods": [[slug, reason] for slug, reason in sorted(CUTS.items())],
    }

    print(f"removed {len(removed)} entries, {kept_total} remain")
    for r in sorted(removed):
        print(f"  - {r}")
    if not_found:
        print("\nWARNING - declared in CUTS but not present in modlist.json:")
        for s in not_found:
            print(f"  ? {s}")

    if dry:
        print("\n(dry run - modlist.json not written)")
        return 0
    jsonfmt.write(MODLIST, data)
    print(f"\nwrote {MODLIST}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
