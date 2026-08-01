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

    # --- F23: the underground was being carved twice -----------------------
    # Better Caves is purely a WorldCarver implementation - it removes
    # minecraft:cave and cave_extra_underground and adds its own. That was the
    # whole story in 1.16. Since 1.18 the DOMINANT cave shape comes from the
    # noise router (final_density: caves/entrances, spaghetti_2d,
    # spaghetti_roughness, pillars, noodle), which Better Caves never touches -
    # and which our own mcserver_depth datapack preserves verbatim from vanilla.
    #
    # So both systems ran: full vanilla noise caves PLUS a second carver at
    # cave_spawn_chance 100.0 from y-63 to y80. The player-visible result is
    # perforated ore veins, buried structures opened to the void, and very
    # little solid stone - all of which work directly against the surface-ore
    # design (ore above 54 as a real choice) and the buried-tech pillar
    # (structures worth finding intact).
    #
    # It also hardcodes bottom_y -63, so it contributed nothing at all to the
    # -64..-128 band the depth extension exists for.
    #
    # Nothing depends on it: Cave Biomes, Underground Worlds, Galosphere,
    # Deeper Dark and Arda's Sculks all decorate whatever hole exists.
    # Ethan's call, 2026-08-01, decided BEFORE the world regen because carving
    # is baked into chunks and cannot be changed afterwards.
    "yungs-better-caves": "F23. Removes only the legacy carvers while the 1.18+ noise-router caves it cannot see keep generating, so the underground is carved twice - fragmented ore veins, structures broken open, little solid stone. Also hardcodes bottom_y=-63 and so contributes nothing to the extended -64..-128 band. Cave Biomes, Underground Worlds, Galosphere, Deeper Dark and Arda's Sculks are unaffected.",

    # --- F24: a dependency that smuggled in the wrong genre ----------------
    # geore is present ONLY as a requirement of geore-nouveau (Ars golems for
    # geodes, rated 'minor'). It adds 24 geode types to every overworld biome at
    # y6-30 - roughly one geode per 12 chunks - and their materials include
    # allthemodium, unobtainium, vibranium, osmium, platinum, tungsten, uranium
    # and monazite: ores for mods that are not installed, in a world Ethan ruled
    # "preindustrial to fantasy". Digging down in a steam-and-brass world and
    # finding a budding vibranium geode is exactly what R2 existed to prevent.
    #
    # Cut before the regen because geodes are worldgen and bake into chunks.
    "geore": "F24. Adds 24 geode types to every overworld biome including allthemodium, unobtainium, vibranium, osmium and uranium - against the preindustrial-to-fantasy ruling (R2). Present only as a dependency of geore-nouveau.",
    "geore-nouveau": "F24. The only reason geore was in the pack; rated 'minor' in the manifest. Ars Nouveau keeps Additions, Creo, Controle, Unification, Ars'n'Spells, Polymorphia, Structurize, Artillery, Technic, Ocultas, Lumos and the lectern fix.",

    # --- F22: right-click a block, the server dies -------------------------
    # A Carry On <-> Create: Aeronautics compat shim whose mixin no longer
    # matches Carry On 2.2.6.13:
    #
    #   Critical injection failure: Redirector CarryOnAeroCompat$distanceTo
    #   in carryonaerocompat.mixins.json:PickupHandlerMixin
    #   failed injection check, (0/1) succeeded. Scanned 0 target(s).
    #
    # The mixin applies LAZILY, when Carry On's CommonEvents.onBlockClick first
    # loads the class - so the server survives boot, accepts players, and then
    # dies in the tick loop the moment anyone right-clicks a block. Ethan hit it
    # within a minute of joining a brand new world.
    #
    # TWO CORRECTIONS to my first reading of this, both worth keeping because
    # both were confidently wrong:
    #
    # 1. I reported that it declares only `minecraft [1.21.1]`, and built a
    #    "compat mod that names neither mod it sits between" heuristic on that.
    #    FALSE. It declares [[dependencies.carryonaerocompat]] modId="carryon"
    #    type="required". My scan missed it because the regex required a
    #    versionRange after each modId, and the carryon entry has none - so only
    #    the minecraft entry matched. The heuristic was built on my own bug.
    #
    # 2. "Scanned 0 target(s)" does NOT mean the target method is gone. Both the
    #    class AND the method still exist: PickupHandler.canCarryGeneral is
    #    present in Carry On 2.2.6.13. What vanished is one level deeper - the
    #    @At(INVOKE, target="Vec3.distanceTo(Vec3)D") INJECTION POINT inside
    #    that method's body. Carry On moved the distance check into isInDistance
    #    and switched to ServerPlayer.distanceToSqr. The @Redirect found the
    #    method, scanned it, matched zero instructions, and defaultRequire=1
    #    turned that into a throw.
    #
    # So the real signature is instruction-level drift inside a method body.
    # Class-level AND method-level checks both PASS on this bug; only decoding
    # the target method's bytecode finds it. A later sweep did exactly that
    # across 180,167 classes and found no second instance in the pack.
    #
    # Carry On and Aeronautics both keep working; what is lost is picking up
    # blocks from Aeronautics' simulated contraptions.
    "carryon-aeronautics-compat": "F22. @Redirect in PickupHandlerMixin targets a Vec3.distanceTo call that Carry On 2.2.6.13 refactored away ('Scanned 0 target(s)'); with defaultRequire=1 that throws, killing the server tick loop the first time any player right-clicks a block. The target class and method both still exist - the missing thing is the injection point inside the method body, which no class- or method-level check can see.",

    # --- F21: in the pack, doing nothing, and unfixable -------------------
    # Its whole server-side contribution is delivered through Moonlight's
    # dynamic-resource API, and every single one of those deliveries fails.
    # Not most - all 111, every boot, 888 across eight measured sessions, zero
    # successes. 26 worldgen overrides, 43 loot tables, 42 recipes, all dropped
    # with NoSuchElementException before they reach the game.
    #
    # It cannot be fixed by version selection. Spelunkery's newest build is
    # 2026-06-18; Supplementaries hard-requires moonlight [1.21-3.1.3,] and
    # 3.1.3 shipped 2026-07-23. There is no Moonlight that satisfies
    # Supplementaries and still predates the API change Spelunkery was built
    # against, and a downgrade would hard-fail Supplementaries at load.
    #
    # Found by a log sweep, not by anything that looks at manifests: nothing in
    # the resolution or dependency checks can see a mod that loads correctly and
    # then silently delivers none of its content. Worth remembering as its own
    # failure class - "resolves, boots, does nothing" is invisible to every
    # check this repo had before someone read the logs.
    "spelunkery": "F21. All 111 of its Moonlight dynamic-resource overrides fail every boot (26 worldgen, 43 loot tables, 42 recipes; zero succeed). Unfixable: Supplementaries pins moonlight >=3.1.3, which postdates Spelunkery's newest build, and downgrading would hard-fail Supplementaries. Ethan's call to cut, 2026-08-01. The depth pillar is served by the surface-ores datapack, Underground Worlds, Arda's Sculks and The Undergarden regardless.",

    "no_moon.jar": "F20. Throws on EVERY PLAYER TICK: 'Cannot get config value before config is loaded' in net.mcreator.nomoon.procedures.PlayerTickNewProcedure, reached from Player.tick. The player is disconnected within a second of spawning. Identical defect class to jadens-nether-expansion - both are MCreator-generated mods reading config before it exists.",

    # --- F19: prevents ANY player from joining -----------------------------
    "luckperms": "F19. Server could not place any player in the world: IllegalStateException 'Capability has not been initialised' in LuckPerms' UserCapabilityImpl, reached via Balm asking PermissionAPI for a permission during PlayerList.placeNewPlayer. Players connected and were dropped within a second. A permissions plugin was never worth this on a four-person whitelisted server.",

    # --- F18: REVERSED. The diagnosis was wrong; both mods are restored. ----
    #
    # The original finding blamed Sable for the "channel missing on the client
    # side" screens: it installs its own UDP channel and wraps NeoForge's, and
    # the client log showed it closing that channel microseconds before the
    # mismatch was reported. That was correlation. The eight named mods were
    # byte-identical and loaded on both sides, which no real mismatch can
    # produce - and rather than treat that as evidence AGAINST a pack fault, I
    # treated it as evidence for an exotic one.
    #
    # The actual causes were found later and were unrelated: LuckPerms (F19)
    # and no_moon (F20) each dropped players server-side, and Ethan identified
    # the rest himself - he was clicking connect before the client had settled.
    # Sable was convicted on a log line that merely sat near the symptom.
    #
    # The lesson is worth more than the mods: a mod whose crash header asks to
    # be ruled out first is not thereby guilty, and "I cannot explain this
    # evidence" is a reason to keep looking, not to pick the nearest suspect.
    # Aeronautics was something Ethan asked for by name and it cost him hours
    # of the pack's best feature for nothing.

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
