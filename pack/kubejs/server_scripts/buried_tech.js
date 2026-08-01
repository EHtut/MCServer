// ---------------------------------------------------------------------------
// BURIED TECH — modern technology is salvage, not manufacture.
//
// The world's fiction: a medieval surface over the ruins of a technological age.
// Guns, security systems and drones exist, but they are RECOVERED from deep
// underground, never crafted at a village workbench.
//
// This file is the load-bearing half of that idea. Without it somebody crafts an
// assault rifle on day two and the fiction dies quietly. Structure depth and
// loot tables decide where the salvage IS; this decides it cannot simply be made.
//
// RULING (Ethan, 2026-07-31): guns are FOUND, ammunition is CRAFTABLE. Weapons
// are irreplaceable salvage; bullets are manufacture. Without that, four players
// run dry after two fights and the guns become ornaments.
// ---------------------------------------------------------------------------
//
// ⚠ MOD IDS BELOW ARE VERIFIED (read from the loaded jars). ITEM IDS ARE NOT.
//
// Mod authors rarely name items the way their display names suggest. Confirm
// before go-live:
//     /kubejs hand                    - exact id of the held item
//     /kubejs dump_registry item      - every registered item id
//
// Then correct AMMO_KEEP and run /kubejs reload. No restart required.
// ---------------------------------------------------------------------------

// Mods whose recipes are removed: their output must be found, not made.
const BURIED_MODS = [
  'tacz',            // Timeless and Classics Zero — the guns
  'securitycraft',   // cameras, laser grids, keycards — salvaged facility tech
  'diligentstalker', // camera drones, cave vision — recovered reconnaissance
]

// Outputs that stay craftable despite belonging to a buried mod.
// Ammunition and its packaging: the economy that keeps recovered guns usable.
const AMMO_KEEP = [
  'tacz:ammo',
  'tacz:ammo_box',
]

ServerEvents.recipes(event => {
  // Warn about bad ids FIRST, so the message is visible above the removal logs.
  // A wrong id fails silently — the recipe is simply not preserved — so this
  // warning is the only signal that the ammo economy just died.
  const validKeep = AMMO_KEEP.filter(id => {
    if (Item.exists(id)) return true
    console.warn(
      `[buried-tech] AMMO_KEEP entry '${id}' is not a registered item. ` +
      `Its recipes will NOT be preserved. Fix it with /kubejs hand.`
    )
    return false
  })

  BURIED_MODS.forEach(mod => {
    // ONE removal per mod, already excluding what we keep.
    //
    // KubeJS has no "un-remove": a bulk remove followed by a re-add does not
    // restore the mod's own recipe, it just deletes everything. The exclusion
    // has to be part of the removal itself, which is what `not` does.
    const filter = validKeep.length
      ? { mod: mod, not: { output: validKeep } }
      : { mod: mod }

    const count = event.countRecipes(filter)
    event.remove(filter)
    console.info(`[buried-tech] '${mod}': removed ${count} recipes` +
      (validKeep.length ? ` (kept ${validKeep.length} ammo output(s))` : ''))
  })
})

// ---------------------------------------------------------------------------
// Verification checklist — every failure mode here is SILENT:
//
//   1. /kubejs reload
//   2. Recipe viewer, search "tacz":
//        weapons    -> NO crafting recipe   (gating works)
//        ammunition -> STILL has a recipe   (economy survives)
//   3. If ammunition lost its recipe too, an AMMO_KEEP id was wrong. The server
//      console warned about it. Fix and reload.
//   4. Confirm the guns are still OBTAINABLE — check the deep-structure loot
//      tables actually place them.
//
// A gun that can neither be crafted nor found is not scarcity, it is a missing
// feature. Step 4 is the one people skip.
// ---------------------------------------------------------------------------
