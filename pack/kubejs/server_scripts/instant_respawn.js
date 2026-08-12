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
var dimLogged = false

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
  // SAME DIMENSION ONLY.
  //
  // Ethan, 2026-08-11: "i die in the nether then im cemented on my bed cannot
  // move and right clicking causes me to place down netherack."
  //
  // That symptom names the cause precisely. Right-clicking placing NETHERRACK
  // while frozen means the client still held the Nether's world state - it never
  // processed the death at all, so its dimension and position disagreed with the
  // server's and every movement packet was rejected.
  //
  // The reason is structural, not timing. Vanilla's flow is:
  //
  //   die -> server tells client -> client shows the screen -> CLIENT ASKS to
  //   respawn -> server calls PlayerList.respawn()
  //
  // We skip the client's request. Within one dimension that mostly survives,
  // because only the position changes. Across dimensions the client needs a full
  // dimension-change handshake it never agreed to, and it ends up stranded. No
  // amount of extra delay fixes it, because the client is never going to ask.
  //
  // So the feature keeps the scope it was actually designed for. Ethan asked for
  // it so that DYING UNDERGROUND is cheap - "death costs the run, never the base"
  // - and every one of those deaths is in the same dimension as the bed. A Nether
  // death is exactly the case where a death screen is correct: you have just lost
  // your gear in another world and a beat to register that is not a cost.
  //
  // FAILS SAFE: if the respawn dimension cannot be read at all, we decline to
  // instant-respawn. The worst outcome is a vanilla death screen, which is a
  // feature not firing rather than a player cemented to their bed.
  // ---------------------------------------------------------------------------
  // ⚠️ NORMALISE BOTH SIDES BEFORE COMPARING.
  //
  // The first version of this guard compared the raw strings and was therefore
  // ALWAYS unequal, silently disabling instant respawn in every dimension while
  // logging a tidy reason:
  //
  //   death: minecraft:the_nether
  //   bed:   ResourceKey[minecraft:dimension / minecraft:overworld]
  //
  // Same shape of mistake as Long.MAX_VALUE-as-damage and a Holder-as-biome-id:
  // both values were about the right THING and in different FORMS. Pull the last
  // namespaced id out of whatever wrapper each side arrives in.
  function dimId(v) {
    if (v === null || v === undefined) return null
    var s = String(v)
    var m = s.match(/[a-z0-9_.-]+:[a-z0-9_./-]+/g)
    return m ? m[m.length - 1] : null
  }

  var deathDim = null, bedDim = null
  try { deathDim = dimId(player.level.dimension) } catch (e) { }
  var dimCands = [
    ['getRespawnDimension()', function () { return player.getRespawnDimension() }],
    ['respawnDimension', function () { return player.respawnDimension }],
    ['respawnPosition.dimension', function () { return player.respawnPosition.dimension }],
  ]
  for (var i = 0; i < dimCands.length; i++) {
    try {
      var v = dimCands[i][1]()
      if (v) {
        bedDim = dimId(v)
        if (!dimLogged) { dimLogged = true; console.info('[instant_respawn] respawn dimension read via ' + dimCands[i][0]) }
        break
      }
    } catch (e) { }
  }
  if (!deathDim || !bedDim) {
    console.info('[instant_respawn] cannot compare dimensions (death=' + deathDim +
      ' bed=' + bedDim + ') - leaving the death screen alone')
    return
  }
  if (deathDim !== bedDim) {
    console.info('[instant_respawn] cross-dimension death (' + deathDim + ' -> ' + bedDim +
      ') - vanilla owns this one')
    return
  }

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
