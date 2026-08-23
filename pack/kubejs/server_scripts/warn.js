// warn.js — THE WARNING.  docs/49 §2, mechanic A of the retaliation family.
//
// Ethan, 2026-08-16: "the retaliation system will be built for everyone where the
// opposing god attempts to stop assasination attempts and/or warns their champion of
// incoming."
//
// This file is the WARN half only. When somebody is handed an order to kill another
// god's champion, THAT CHAMPION'S OWN GOD gets told, and decides whether to pass it
// on. The intercept half (talking to the assassin) is docs/49 §1 B and is not built.
//
// ── ⭐ WHY THIS IS THE FIRST PIECE ───────────────────────────────────────────
// It is the only part of the whole design with no way to go wrong. It is chat, it
// takes nothing away from anybody, it cannot fire mid-fight and freeze someone
// (docs/49 §5 - the ritual hazard that shapes B and D), and it needs no new entity.
// It also carries most of the drama: the moment you learn somebody has been sent.
//
// ── ⭐ THE POSTURE IS THE CHARACTERISATION ───────────────────────────────────
// Three gods warn and each warning is a different RELATIONSHIP - that contrast is
// the entire thesis, and the pools must never be edited toward each other:
//
//     Wall      "Run! I will hold them off"   she SHIELDS you
//     Blade     "Ensure you win."             he DEMANDS, and offers nothing
//     Salvage   "You can leave."              she INFORMS, and PERMITS
//
// Art says nothing, deliberately - "art doesn't care".
//
// ── ⚠️ ART'S SILENCE IS LOGGED, LOUDLY ──────────────────────────────────────
// docs/49 §1: an Art champion never sees this system at all and cannot tell
// indifference from a dead hook. This repo has shipped three mechanics that loaded
// clean and did nothing. So when Art declines to warn, THE LOG SAYS SO - the absence
// is recorded as a decision, not as a gap.
//
// ── 🚨 "I FAILED" AND "I FOUND NOTHING" MUST NOT SHARE A RETURN VALUE ────────
// incoming() returns a REASON STRING, never a bare boolean. A warning that did not
// happen has six very different causes - nobody online, no path, Art, the same god
// on both sides, a missing seam - and collapsing them to `false` is how a broken
// hook hides behind a legitimately quiet one for a month.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[warn] '

  // ── the posture table, docs/49 §1 ──────────────────────────────────────────
  // WARN only. Whether a god also intercepts the assassin is B's table, not this
  // one - keeping them separate is what made Salvage's gap visible in the first
  // place, so they do not get merged back together here for convenience.
  var WARNS = {
    blade: true,      // "he will never stop them, he will only warn his champion"
    wall: true,       // she warns AND intercepts
    salvage: true,    // ruled 2026-08-18 - a warning is information, not something
                      // done TO her, so it clears her consent rule
    forge: true,      // 🅿️ backburner: pool unwritten, and paths.js has him CLOSED
    art: false,       // 🚫 "Art will do nothing"
    crown: true,      // aliases wall everywhere else; do not let it fall through
  }

  // ── {rival} ────────────────────────────────────────────────────────────────
  // The rival god's title, substituted into the warning. Wall's line was written
  // as "The champion of the blade comes for you" - hardcoded, and wrong the first
  // time Salvage sends somebody. This is the map that fixes it.
  //
  // ⚠️ SALVAGE IS UNSETTLED AND THIS IS PLAYER-FACING. Ethan's own brief titles her
  // THE WOLF (docs/44 heading, and his character brief); six code files and all her
  // boot banners call her the Hound. Defaulting to `hound` because that is what
  // every existing line in the game already says, so nothing contradicts on screen
  // - but it is one word to change if the brief wins, which it probably should.
  //
  // ⭐ ART'S NAME IS SETTLED. It was an open three-way (Nightmare / Matriarch /
  // Dreamwalker); docs/53 ruled it 2026-08-22 - she is KAYER, THE MATRIARCH, and the
  // Nightmare is a character who no longer exists. This string is player-facing (it
  // is what a rival's champion is told is coming), so it moved with the ruling
  // rather than waiting on the wider docs sweep.
  var TITLE = {
    blade: 'the blade',
    wall: 'the spider',
    salvage: 'the hound',
    forge: 'the forge',
    art: 'the matriarch',
    crown: 'the spider',
  }

  function titleOf(god) { return TITLE[resolve(god)] || String(god || 'something') }

  // ⚠️ CROWN HAS NO VOICE OF ITS OWN. It aliases wall in coefficients.js
  // (`TABLE.crown = TABLE.wall`) and in the posture table above, but there is no
  // crown_voice.js and no crown pools - so speaking AS crown finds nothing and the
  // player is silently never warned. Caught by the harness; it returned 'no-line',
  // which is the reason string doing exactly the job it exists for.
  //
  // Resolved on BOTH sides: a crown walker hears the Spider, and a crown-issued
  // order counts as the Spider for the same-god guard, so she cannot end up warning
  // her own champion about herself through the alias.
  var VOICE_ALIAS = { crown: 'wall' }
  function resolve(god) { return VOICE_ALIAS[god] || god }

  function pathOf(p) {
    try { if (VELDORA.paths) return VELDORA.paths.pathOf(p) || '' } catch (e) { }
    return ''
  }

  // Resolve by username. The order stores a NAME, not a uuid - so an offline target
  // is a normal outcome, not an error.
  function findPlayer(server, name) {
    if (!name) return null
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        try { if (String(ps[i].username) === String(name)) return ps[i] } catch (e) { }
      }
    } catch (e) { }
    return null
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE ONE ENTRY POINT. Every place that issues an order calls this and ignores
  // the return - the reason string is for the log and for the harness.
  //
  //   rival       the god that just issued the order
  //   targetName  the username it was issued against
  // ═══════════════════════════════════════════════════════════════════════════
  function incoming(server, rival, targetName) {
    if (!server || !rival) return 'bad-args'
    if (!targetName) return 'no-target'

    var t = findPlayer(server, targetName)
    if (!t) {
      // Not a failure. They log in and find out the hard way, which is arguably
      // the better story - but it is logged so a chronically silent warning can be
      // told apart from a broken one.
      console.info(TAG + targetName + ' is offline - ' + rival + "'s order goes unannounced")
      return 'offline'
    }

    var god = pathOf(t)
    if (!god) return 'pathless'          // no patron, so nobody to warn them
    god = resolve(god)
    rival = resolve(rival)

    // 🚨 A god must never warn a champion about ITSELF. Wall ordering a hit and
    // then warning the target in her own voice would read as a bug even though
    // every individual step behaved. killorder holds one order per god, so this
    // is reachable the moment two gods want the same person dead.
    if (god === rival) {
      console.info(TAG + rival + ' ordered a hit on its own champion ' + targetName +
        ' - no warning, a god does not warn you about itself')
      return 'same-god'
    }

    if (!WARNS[god]) {
      // ⭐ THE ABSENCE IS THE CONTENT. Logged so "art is indifferent" and "the warn
      // hook is dead" are never the same observation. docs/49 §1.
      console.info(TAG + god + ' declines to warn ' + targetName + ' about ' +
        rival + ' - that is the posture, not a fault')
      return 'no-posture'
    }

    if (!VELDORA.voice || typeof VELDORA.voice.sayAbout !== 'function') {
      console.error(TAG + 'voice missing - ' + god + ' cannot warn ' + targetName)
      return 'no-voice'
    }

    var said = false
    try {
      said = VELDORA.voice.sayAbout(t, god, 'warn_incoming', { rival: titleOf(rival) })
    } catch (e) {
      console.error(TAG + god + ' threw while warning ' + targetName + ' :: ' + e)
      return 'threw'
    }

    if (!said) {
      // An empty pool. voice.js already refuses to register empties and shouts at
      // boot, so this is the second line of defence rather than the first.
      console.warn(TAG + god + ' has no warn_incoming line - ' + targetName +
        ' was NOT warned about ' + rival)
      return 'no-line'
    }

    console.info(TAG + god + ' warned ' + targetName + ' about ' + rival)
    return 'warned'
  }

  VELDORA.warn = {
    incoming: incoming,
    titleOf: titleOf,
    warns: function (god) { return !!WARNS[god] },
  }

  ServerEvents.loaded(function (event) {
    // ⚠️ Report on the next tick. killorder.js printed "NOBODY YET" for weeks
    // because it read a registry that later files fill; this file has no registry
    // to wait for, but the POOLS it depends on are registered by the *_voice files
    // that sort after it, so "who actually has a line" is not knowable until they
    // have all run.
    event.server.scheduleInTicks(1, function () {
      var can = [], mute = [], empty = []
      for (var g in WARNS) {
        if (!WARNS.hasOwnProperty(g)) continue
        if (g === 'crown') continue                 // alias, not a fifth god
        if (!WARNS[g]) { mute.push(g); continue }
        var has = false
        try {
          has = !!(VELDORA.voice && VELDORA.voice.line(g, 'warn_incoming', null))
        } catch (e) { }
        (has ? can : empty).push(g)
      }
      console.info(TAG + 'THE WARNING live - warns: ' + (can.join(', ') || 'NOBODY') +
        (empty.length ? ' | HAS POSTURE BUT NO LINES: ' + empty.join(', ') : '') +
        (mute.length ? ' | silent by design: ' + mute.join(', ') : ''))
      console.info(TAG + 'fires when an order is ISSUED (killorder.open + the Mark), ' +
        'never at the kill - chat only, no ritual, so it can never freeze anyone ' +
        'mid-fight. {rival} renders the issuing god\'s title.')
    })
  })
})();
