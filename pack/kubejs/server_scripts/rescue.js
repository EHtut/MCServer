// One-shot rescue: move a player who is stuck in an unloadable location.
//
// 2026-08-02. Lehykt logged out at (265, -45, 234) and could not get back in:
//
//   17:16  login at (467,  63, 202)  surface  -> played 16 minutes
//   17:32  login at (265, -45, 234)  deep     -> timed out after 51s
//   17:33  login at (265, -45, 234)  deep     -> timed out after 51s
//   17:35  login at (265, -45, 234)  deep     -> timed out after 51s
//
// Identical coordinates, identical failure, three times; the one login from a
// different place was fine. The server accepted him every time and voice chat
// negotiated - it is the CLIENT freezing about 20s in, and Minecraft drops a
// client 30s after its last keepalive, which is where the very consistent 51
// seconds comes from.
//
// Deep underground is the most expensive place in this world to load - dense
// terrain plus Distant Horizons LOD generation - and his is the weakest machine
// in the group at a 6G heap.
//
// WHY A HOOK RATHER THAN TYPING /tp
//
// There is a window: he survives ~20s. But racing it by hand takes several
// attempts and each one is another 51-second wait for him. This fires inside
// the join event, before the client has rendered anything, so there is no race.
//
// SELF-DISABLING. It moves each listed player ONCE, records that in
// persistentData, and never touches them again. Left in place it is inert; it
// is not a permanent teleport rule and must not become one.

const RESCUE_FLAG = 'cc_rescued_once'

// player -> where to put them. Lehykt's own surface position from the 17:16
// session, which is somewhere he demonstrably loaded fine.
const RESCUE = {
  Lehykt: { x: 467, y: 64, z: 202, dim: 'minecraft:overworld' },
}

PlayerEvents.loggedIn(event => {
  const player = event.player
  if (!player) return
  const dest = RESCUE[player.username]
  if (!dest) return

  const data = player.persistentData
  if (data.getBoolean(RESCUE_FLAG)) return
  data.putBoolean(RESCUE_FLAG, true)

  try {
    event.server.runCommandSilent(
      `execute in ${dest.dim} run tp ${player.username} ${dest.x} ${dest.y} ${dest.z}`)
    event.server.runCommandSilent(
      `tellraw ${player.username} {"text":"Moved you to the surface - you were stuck loading at y -45.","color":"yellow"}`)
    console.info(`[rescue] moved ${player.username} to ${dest.x} ${dest.y} ${dest.z}`)
  } catch (e) {
    // Loud. A rescue that silently does nothing looks exactly like a player who
    // simply crashed again, which is the worst thing to be guessing about.
    console.error('[rescue] FAILED for ' + player.username + ': ' + e)
  }
})
