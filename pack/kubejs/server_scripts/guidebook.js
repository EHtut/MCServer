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
// ⚠️ WAS patchouli:cogs_and_cadavers, which exists in NO jar and in NO
// server-side patchouli_books folder - it lives only as loose CLIENT files.
// Patchouli answers an unknown id with item.patchouli.guide_book.invalid, so
// /give SUCCEEDED and every player was handed an "Invalid Book" on first join
// while the Modonomicon guide we actually built was never given out at all.
// A silent success is worse than an error; nothing in any log said a word.
const BOOK = 'modonomicon:modonomicon[modonomicon:book_id="mcserver:veldora"] 1'

// ═══════════════════════════════════════════════════════════════════════════
// 🪦 RETIRED 2026-08-15. Ethan: "what if we cut books entirely and we deliver
// hints through the dialogue? Mostly because books have been buggy."
//
// They have. A guidebook shipped an item id that no longer existed and KICKED THE
// PLAYER on open; four more were found dead in the same audit. And the roster was
// never fair to begin with - Blade and Salvage were handed NO books at all because
// nothing installed described their path, while Wall got two.
//
// ⭐ THE ARGUMENT IS NOT "BOOKS ARE BUGGY", IT IS THAT WE ALREADY HAD A BETTER ONE.
// `/veldora` is the book: it cannot crash a client, cannot be lost, dropped or
// duplicated, and it is one edit to correct. Everything a book was for, a command
// already does better - and the things a book could NEVER do, a god can:
//
//     books      handed to everyone, identical, silent, and immediately stale
//     dialogue   arrives in your god's voice, at the moment it is relevant,
//                and says different things depending on who you follow
//
// So progression hints move into the idle system: `guidance` for a walker, and
// pathless.js for someone who has not chosen yet.
//
// TO REVIVE: set RETIRED = false.
// ═══════════════════════════════════════════════════════════════════════════
var RETIRED = true

PlayerEvents.loggedIn(event => {
  if (RETIRED) return
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
