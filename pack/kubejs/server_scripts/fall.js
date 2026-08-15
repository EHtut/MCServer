// fall.js — E2d of the Path System build. docs/24, design docs/23 §9.1b
//
// THE FALL. Your patron gives up on you.
//
// Ethan, 2026-08-12: "dying too many times in a short period causes the entity to
// force a harvest then kick you off the path on a cooldown."
//
// ── WHAT KIND OF HARVEST THIS IS ─────────────────────────────────────────────
// A DESIGN CHOICE worth stating plainly, because it is not the only reading.
//
// The real Harvest - earned by climbing to notoriety 100 - is a FIGHT. It is the
// endpoint of the whole design, it is meant to be lost the first four or five
// times, and winning it is the point.
//
// This is not that. This is a REPOSSESSION. The patron does not test a player it
// has stopped believing in; it takes what it is owed and leaves. There is nothing
// to beat, which is exactly what the curated dialogue already says:
//     "Enough. I am taking what I am owed."      - Salvage
//     "I am taking what you will never build."   - Forge
//     "As Phaethon fell, so do you."             - Blade
//
// So: earn your way to 100 notoriety and you get a Harvest you can WIN. Fall to
// max regard and you get a collection you cannot. The two share a name and are
// opposite events. If Ethan wants the forced version to be fightable instead, the
// change is to summon a harvest instance here and defer the revoke until it
// resolves - which needs cross-file state in stalker.js, and is why it is not the
// first version.
//
// ── THE COMPOUNDING IS FREE ──────────────────────────────────────────────────
// recordHarvest(won=false) increments harvestCount, and notoriety.js's RATES table
// is indexed by exactly that. Every path a player loses makes their NEXT Harvest
// arrive faster. Nothing here had to implement it.

var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var COOLDOWN_DAYS = 3                 // in-game days. ~1 hour of real play.
  var CD_KEY = 'veldora_path_cooldown'  // world day the player may take a path again

  // Beat 6 from docs/25-PATRON-DIALOGUE.md. Ethan's own lines outrank these.
  var DISMISSAL = {
    blade: 'What I needed is mine. Go.',
    salvage: 'Enough.',
    forge: 'Go cool in the dark. When you remember how to build, return.',
    wall: 'I will live in the walls you build. Even when you do not see me. Especially then.',
    crown: 'I withdraw my patronage. You are, to me, forgotten.',
    art: 'You woke too soon. How sad. I will wait. Wait for you.',
  }

  function dayNow(server) {
    // P6a: overworld is a METHOD, not a property.
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  function speak(p, text) {
    try { p.tell(Text.of('§4§l' + text)) } catch (e) { }
  }

  // ---------------------------------------------------------------------------
  // THE COOLDOWN. Stored as a WORLD DAY, never tickCount - finding K9, where a
  // stamp from the future silently disabled the Hunt forever.
  //
  // It blocks the player from taking ANY path, not merely the one they lost.
  // Otherwise the punishment is a two-second detour into a different patron and
  // means nothing. Being pathless is the sentence: no drops, no power, no voice.
  // ---------------------------------------------------------------------------
  function blockedUntil(p) {
    try { return p.persistentData.getInt(CD_KEY) || 0 } catch (e) { return 0 }
  }

  function pathBlocked(server, player) {
    var until = blockedUntil(player)
    if (!until) return { blocked: false, daysLeft: 0 }
    var day = dayNow(server)
    // No clock means we cannot prove the cooldown has expired. Fail toward the
    // PLAYER - a lockout that cannot be verified must not be enforced, or a broken
    // clock silently bans everyone from the whole system.
    if (day === null) return { blocked: false, daysLeft: 0 }
    if (day >= until) return { blocked: false, daysLeft: 0 }
    return { blocked: true, daysLeft: until - day }
  }

  // ---------------------------------------------------------------------------
  // THE REVOKE — tag and claim, together, verified.
  //
  // 🚨 This is the THIRD place the P1 defect can be born. On 2026-08-11 Ethan
  // carried veldora_path="forge" against an EMPTY claim for days and silently
  // earned nothing, because /path forcerelease cleared one side and not the other.
  // Both writes happen here and BOTH are read back afterwards; a half-revoke is
  // logged as an error rather than left to be discovered by a player wondering
  // why their kills stopped paying.
  //
  // The claim is cleared to '' rather than escrowed, so THE PATH IS OPEN
  // IMMEDIATELY - Ethan, 2026-08-12: "yes the path stays open." Somebody else may
  // take it before the cooldown ends, and it may never come back.
  // ---------------------------------------------------------------------------
  function revoke(server, player, key) {
    var ok = true
    try { player.persistentData.putString('veldora_path', '') } catch (e) {
      console.error('[fall] could not clear the path tag for ' + player.username + ' :: ' + e)
      ok = false
    }
    try {
      if (VELDORA.paths && typeof VELDORA.paths.setHolder === 'function') {
        VELDORA.paths.setHolder(server, key, '')
      } else {
        console.error('[fall] VELDORA.paths.setHolder missing - the CLAIM was not cleared')
        ok = false
      }
    } catch (e) {
      console.error('[fall] could not clear the claim for ' + key + ' :: ' + e)
      ok = false
    }

    // Verify at the point of use. "I cleared it" and "it is clear" are different
    // claims, and this project has shipped the first believing the second.
    var tag = 'unreadable', claim = 'unreadable'
    try { tag = player.persistentData.getString('veldora_path') || '' } catch (e) { }
    try { claim = VELDORA.paths.holderOf(server, key) } catch (e) { }
    if (tag !== '' || claim !== '') {
      console.error('[fall] !! HALF-REVOKE for ' + player.username + ' on ' + key +
        ' - tag="' + tag + '" claim="' + claim + '". This is the P1 defect. FIX IT.')
      ok = false
    }
    return ok
  }

  // ---------------------------------------------------------------------------
  // THE FALL ITSELF. Called by regard.js when the counter maxes.
  // ---------------------------------------------------------------------------
  VELDORA.theFall = function (server, player, key) {
    var day = dayNow(server)
    console.warn('[fall] ================ THE FALL: ' + player.username +
      ' loses ' + key + ' ================')

    // 1. The patron collects. recordHarvest(won=false) resets the day term AND
    //    raises the rate, so the next Harvest arrives faster. Skipping this is the
    //    single worst thing that could go wrong here: the player would walk out
    //    still carrying the accumulated days that caused the fall, straight into
    //    another one.
    var recorded = false
    try {
      if (typeof VELDORA.recordHarvest === 'function') {
        VELDORA.recordHarvest(server, player, false)
        recorded = true
      }
    } catch (e) { }
    if (!recorded) {
      console.error('[fall] !! recordHarvest DID NOT RUN for ' + player.username +
        ' - the day term was not reset and the rate was not raised. They will fall again.')
    }

    // 2. It takes everything.
    var before = 0
    try { before = player.xpLevel || 0 } catch (e) { }
    try { player.xpLevel = 0 } catch (e) {
      try { server.runCommandSilent('xp set ' + player.username + ' 0 levels') } catch (e2) { }
    }
    var after = 0
    try { after = player.xpLevel } catch (e) { after = -1 }
    if (after !== 0) console.warn('[fall] xp wipe did not stick for ' + player.username +
      ' - read back ' + after)

    // 3. The path goes. Tag and claim together.
    var clean = revoke(server, player, key)

    // 4. (was: drop the subclass with the primary - SUBCLASSES ARE CUT 2026-08-15,
    //     see 23 §8. The veldora_subpath key is left unread rather than migrated;
    //     it is inert data on a handful of players and reading it would only
    //     resurrect a concept we removed.)

    // 5. The cooldown. WORLD DAY, never tickCount.
    if (day !== null) {
      try { player.persistentData.putInt(CD_KEY, day + COOLDOWN_DAYS) } catch (e) { }
    } else {
      console.error('[fall] no world clock - NO COOLDOWN WAS SET for ' + player.username)
    }

    // 6. The counter resets, or they fall again the moment they take a path.
    try { player.persistentData.putInt('veldora_regard', 0) } catch (e) { }

    speak(player, DISMISSAL[key] || 'It is finished.')
    try {
      player.tell(Text.of(''))
      player.tell(Text.of('§8§m                                        '))
      player.tell(Text.of('§c§lYou have lost ' +
        ((VELDORA.paths && VELDORA.paths.nameOf) ? VELDORA.paths.nameOf(key) : key) + '.'))
      player.tell(Text.of('§7Your levels are gone. You walk no path.'))
      player.tell(Text.of('§7You may take one again in §f' + COOLDOWN_DAYS + '§7 days.'))
      player.tell(Text.of('§8It is open to the others now. It may not be there when you return.'))
      player.tell(Text.of('§8§m                                        '))
    } catch (e) { }

    console.warn('[fall] ' + player.username + ': xp ' + before + '->0, path revoked=' + clean +
      ', cooldown until day ' + (day === null ? '?' : day + COOLDOWN_DAYS) +
      ', ' + key + ' is now OPEN to anyone')
    return clean
  }

  VELDORA.pathBlocked = pathBlocked

  // ----------------------------------------------------------------- commands
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // Testing the fall by dying seven times is not a test loop anybody will run.
    event.register(Commands.literal('fall_test').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var key = ''
      try { key = p.persistentData.getString('veldora_path') || '' } catch (e) { }
      if (!key) { p.tell(Text.of('§cYou walk no path to lose.')); return 0 }
      VELDORA.theFall(ctx.source.server, p, key)
      return 1
    }))
  })

  ServerEvents.loaded(function () {
    console.info('[fall] E2d active - the fall revokes the path, wipes xp, ' +
      'records a LOST harvest, and locks path selection for ' + COOLDOWN_DAYS + ' in-game days')
    console.info('[fall] the lost path is left OPEN - anyone may take it before the cooldown ends')
  })
})()
