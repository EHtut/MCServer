// A5 - no death screen for ordinary death.
//
// Ethan, 2026-08-01:
//   "Normal deaths shouldn't have a death screen and it should be youre back at
//    your bed a moment later"
//
// Not a convenience feature - it is the expedition loop expressed as UX. With
// Corpse holding your gear where you fell, dying underground becomes: you are at
// base immediately, your stuff is still down there, and the cost is THE TRIP
// BACK. That is "death costs the run, never the base" as something felt rather
// than written down.
//
// It also makes D4's invasion rule land harder. When every ordinary death is a
// two-second inconvenience, being HELD dead in spectator during an invasion is
// an unmistakable signal that this one is different.
//
// ---------------------------------------------------------------------------
// v1 OF THIS FILE DID NOTHING AT ALL
//
// It hooked `PlayerEvents.death`, WHICH DOES NOT EXIST. KubeJS's registered
// PlayerEvents names are loggedIn/loggedOut/cloned/respawned/tick/decorateChat/
// chat/advancement/inventory*/chest*/stage* - no `death`.
//
// And KubeJS does not throw on an unknown event name. EventGroupWrapper.get()
// logs "Unknown event 'PlayerEvents.death'!" once and returns a bare no-op
// function, so the file registered nothing and ran forever without complaint
// beyond that single startup line nobody reads.
//
// It also called `player.respawn()`, which does not exist on ServerPlayer
// either - so even a correct hook would have done nothing.
//
// Both are the same failure this project keeps producing: an API that LOOKS
// right, fails quietly, and leaves behind something indistinguishable from a
// feature nobody triggered.
// ---------------------------------------------------------------------------

const INVASION_FLAG = 'invasion_active'   // set by D4 later; absent for now

EntityEvents.death(event => {
  const player = event.entity
  if (!player || !player.player) return     // EntityEvents fires for everything

  // D4 hook: while an invasion runs, ordinary respawn is suspended and the
  // spectator rule owns death instead. Reading a flag that does not exist yet
  // is harmless - it is simply never true until D4 sets it.
  try {
    if (player.server.persistentData.getBoolean(INVASION_FLAG)) return
  } catch (e) { /* no flag, no invasion, carry on */ }

  // ---------------------------------------------------------------------------
  // 15 TICKS, NOT 1.
  //
  // Ethan, 2026-08-11: "on respawn blocks appeared under me causing me to shake
  // violently ontop of my bed."
  //
  // At 1 tick the server moved him to his bed 80ms after death - before the
  // client had processed the death packet at all. The log names it exactly:
  //
  //   18:02:05.15  Rehykt was killed
  //   18:02:05.23  Rehykt moved too quickly!  266.4, -44.4, 284.9
  //
  // The client still believed it was at the death position, so every movement
  // packet disagreed with the server: that is the shake. "Blocks appearing under
  // me" is the chunks around the bed streaming in once the client caught up.
  //
  // 15 ticks (0.75s) is still "back at your bed a moment later" - the thing
  // actually asked for - but it lets the death sequence finish and the client
  // acknowledge it before the position changes. The nemesis tally's write still
  // lands first, which was the original reason for delaying at all.
  // ---------------------------------------------------------------------------
  player.server.scheduleInTicks(15, () => {
    try {
      // Verified against neoforge-21.1.247-server.jar:
      //   MinecraftServer.getPlayerList() -> PlayerList
      //   PlayerList.respawn(ServerPlayer, boolean, Entity$RemovalReason)
      player.server.playerList.respawn(player, false, 'killed')
    } catch (e) {
      // Loud. A respawn that quietly stops working is indistinguishable from a
      // player choosing to sit on the death screen, which is how this class of
      // bug survives for months.
      console.error('[instant_respawn] respawn failed, players will see the death screen: ' + e)
    }
  })
})
