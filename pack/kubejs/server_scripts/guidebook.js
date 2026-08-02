// Put the guidebook in every player's hands, once.
//
// The book FILES ship in the instance zip, so everyone can read it - but only
// if they know it exists. A guide nobody opens is a guide nobody has, and there
// is no craft recipe or hint pointing at it.
//
// So: hand it over on first join, once per player, forever.
//
// WHY event.server AND NOT player.runCommandSilent
//
// KubeJS puts runCommandSilent on BOTH EntityKJS and MinecraftServerKJS. The
// entity version builds its command source from the PLAYER, so `/give` runs at
// the player's permission level and is simply refused for anyone who is not op.
// MinecraftServerKJS builds it from the server, which is level 4. Verified in
// kubejs-neoforge-2101.7.2: both classes carry createCommandSourceStack, and
// only the server's is unconditionally elevated.
//
// THE ITEM SYNTAX IS FUSSY AND WAS TESTED LIVE
//
//   patchouli:guide_book[patchouli:book='patchouli:cogs_and_cadavers']
//
// SINGLE quotes. Double quotes and a bare resource location both fail with
// "Expected ']'". The component name was confirmed from Patchouli's
// PatchouliDataComponents (it registers `book`), and the whole command was run
// through RCON before being written here - it returned "Gave 1 [Guide Book]".
//
// External Patchouli books live under the `patchouli` namespace, which is why
// the book id is patchouli:cogs_and_cadavers and not some pack namespace.

const FLAG = 'cc_guidebook_given'
const BOOK = "patchouli:guide_book[patchouli:book='patchouli:cogs_and_cadavers'] 1"

PlayerEvents.loggedIn(event => {
  const player = event.player
  if (!player) return

  // persistentData survives death and world reload, so this is once per player
  // for the life of the world - not once per session.
  const data = player.persistentData
  if (data.getBoolean(FLAG)) return
  data.putBoolean(FLAG, true)

  try {
    event.server.runCommandSilent(`give ${player.username} ${BOOK}`)
  } catch (e) {
    // Loud. A silently-missing guidebook is indistinguishable from a player who
    // threw it away, so there would be nothing to notice.
    console.error('[guidebook] could not give the book to ' + player.username + ': ' + e)
  }
})
