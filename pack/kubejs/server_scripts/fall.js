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
  // Ask voice.js what colour this god is - it is the only file that knows. Falling
  // back to the patron channel means a god with no registered colour still speaks.
  function godColour(key) {
    try {
      if (VELDORA.voice && typeof VELDORA.voice.colourOf === 'function') {
        return VELDORA.voice.colourOf(key)
      }
    } catch (e) { }
    return '§4§l'
  }

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

  function speak(p, text, key) {
    try { VELDORA.voice.chat(p, godColour(key) + text) } catch (e) { }
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

  // ⚠️ THE WORLD CLOCK IS NOT MONOTONIC. Ethan, 2026-08-15: "admins keep messing
  // with the server." Measured the same day - `time query day` read 10004 in the
  // morning and 82 in the afternoon, because dayTime is absolute and /time set
  // rewrites it.
  //
  // A cooldown stored as `now + duration` then becomes a stamp from the far future,
  // and waiting for the clock to reach it is waiting ~10,000 in-game days. The
  // symptom is a permanent lockout that looks exactly like a working cooldown.
  //
  // A cooldown can never legitimately sit further ahead than its own duration, so
  // anything beyond that is a clock that moved, and is treated as EXPIRED.
    if (day !== null && until - day > COOLDOWN_DAYS) {
      console.warn('[fall] cooldown stamp ' + until + ' is impossibly far past day ' +
        day + ' - the world clock moved. Clearing rather than locking ' +
        (player.username || '?') + ' out for good.')
      try { player.persistentData.putInt(CD_KEY, 0) } catch (e) { }
      return { blocked: false, daysLeft: 0 }
    }

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
  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 SOME GODS DO NOT LET GO.  Ethan, 2026-08-15:
  //   "im considering that the wall doesn't ever drop or release you. the only way
  //    to be released is from winning the harvest"
  //
  // Her own writing already said so and the code contradicted it. The last rung of
  // her grief ladder is:
  //
  //     "This is mercy, darling. This is me keeping my promise.
  //      I will not lose you again."
  //
  // ...and that line FIRED THE FALL. She promised not to lose you and then let you
  // go in the same breath. Now the promise holds: her regard maxes out, she says it,
  // and nothing happens. You are still hers.
  //
  // ⚠️ THAT MAKES HER HARVEST THE ONLY EXIT SHE HAS, which is why paths.release()
  // had to become real first. Do not add her to this list without checking that her
  // Harvest still works - it is the only door.
  //
  // ⚠️ THIS MAP IS NOW A SAFETY NET, NOT THE DECLARATION. release.js's RULES
  // registry is where a god's release condition lives as of 2026-08-16, and
  // `mode: 'never'` there means the same thing as a row here. Both are checked:
  // the registry is the truth, this is what holds if release.js failed to load.
  // Deleting this would make her loseable the one time that file breaks.
  var NEVER_LETS_GO = { wall: true }

  function refuses(key) {
    if (NEVER_LETS_GO[key]) return true
    try {
      if (VELDORA.release && VELDORA.release.rules) {
        var r = VELDORA.release.rules[key]
        if (r && r.mode === 'never') return true
      }
    } catch (e) { }
    return false
  }

  VELDORA.theFall = function (server, player, key) {
    // 🚨 RE-ENTRANCY. Two different systems can reach this door in a single death
    // - regard maxing and a release streak completing - and running it twice would
    // record TWO lost harvests, which permanently raises the rate of the next one.
    // A player who no longer holds this path cannot lose it again.
    var holds = null
    try { holds = player.persistentData.getString('veldora_path') } catch (e) { }
    if (holds !== null && holds !== undefined && holds !== key) {
      console.info('[fall] theFall(' + key + ') ignored for ' + player.username +
        ' - they hold "' + holds + '" now. Already fallen, or never held it.')
      return false
    }

    // 🔴🔴 THIS RETURNS FALSE FOR EVERY GOD AS OF 2026-08-24, AND THAT IS THE
    // POINT. Ethan: "there should be no ending anymore, this is story now, not just a
    // game. there is no end." release.js put all six on `mode: 'never'`, and refuses()
    // reads that registry - so THE FALL IS NOW UNREACHABLE. No xp wipe, no revoked
    // path, no three-day lockout, for anybody.
    //
    // 🔑 NOTHING BELOW THIS LINE WAS DELETED, and it was reached by the registry rather
    // than by editing this file, which is why it stayed correct without being touched.
    // Put one god back on a real mode and its fall works again, unchanged.
    //
    // ⚠️ SO REGARD SATURATES INSTEAD OF EXECUTING. Maxing it now only means the loudest
    // beat and a log line; regard.js has COOLING, so it comes back down on its own. A
    // pressure gauge that pins is not a bug here - it is the gauge doing its job in a
    // story where the needle no longer breaks anything.
    if (refuses(key)) {
      // Not silent - an admin reading the log must be able to tell "she refused" from
      // "the fall is broken".
      console.info('[fall] ' + player.username + ' MAXED regard on ' + key +
        ' - and ' + key + ' does not let go. No fall, and there is no way out to earn: ' +
        'nobody is ever released now.')
      return false
    }
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

    speak(player, DISMISSAL[key] || 'It is finished.', key)
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
    // 🔴 THIS BANNER DESCRIBED A FALL THAT CANNOT HAPPEN. It was caught by READING THE
    // BOOT LOG after the no-endings restart - it announced "the fall revokes the path,
    // wipes xp, records a LOST harvest, and locks path selection", live, on a build
    // where refuses() returns true for every god. That is the sixth lying banner found
    // in this project, and the sixth found the same way.
    //
    // 🔑 SO IT REPORTS WHAT THE REGISTRY SAYS, rather than what this file can do. It
    // asks release.js at boot and prints the real answer, so if a god is ever put back
    // on a real mode this line becomes true again on its own instead of needing to be
    // remembered. A banner derived from state cannot rot; a banner that restates an
    // intention always does.
    var live = []
    try {
      var rules = (VELDORA.release && VELDORA.release.rules) || {}
      for (var k in rules) {
        if (rules[k] && rules[k].mode !== 'never') live.push(k)
      }
    } catch (e) {
      console.warn('[fall] could not read the release registry at boot - ' +
        'the line below is what this file WOULD do, not what it will :: ' + e)
      live = null
    }

    if (live && live.length === 0) {
      console.info('[fall] E2d loaded but UNREACHABLE - every god is mode:never, so the ' +
        'fall never runs: no revoked path, no xp wipe, no ' + COOLDOWN_DAYS +
        '-day lockout, for anybody. This is the 2026-08-24 no-endings ruling, not a bug.')
      console.info('[fall] the machinery is intact - put one god back on a real mode and ' +
        'it works again, unchanged.')
    } else {
      console.info('[fall] E2d active for ' + (live ? live.join(', ') : 'UNKNOWN') +
        ' - the fall revokes the path, wipes xp, records a LOST harvest, and locks ' +
        'path selection for ' + COOLDOWN_DAYS + ' in-game days')
      console.info('[fall] the lost path is left OPEN - anyone may take it before the cooldown ends')
    }
  })
})()
