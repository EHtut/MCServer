// urge.js — the caves pulling, and getting louder about it.
//
// Ethan, 2026-09-05: *"the more days that you don't go below the player's action dialogue
// becomes more and more agitated. 'You feel an urge to go below' etc."*
//
// ── ⭐ THIS IS THE OTHER HALF OF ANK ────────────────────────────────────────
// `ank.js` is somebody standing in a cave mouth trying to keep you out, and paying over
// the odds to do it. This is the thing on the other side of him, getting less patient.
//
// 🔑 THE TWO PRESSURES ARE WHAT MAKE ACT 0 A CHOICE. A warning with nothing pulling
// against it is just an instruction; a pull with nobody warning you is an ordinary
// dungeon crawl. Ethan's own achievement text names the pull: *"There is something down
// there, it whispers for you to get closer."* Ank is the push, this is the pull, and the
// player picks.
//
// ── 🖊️ THE WORDS ARE ETHAN'S AND THEY ARE NOT HERE ─────────────────────────
// *"Once we get ank done without dialogue we can do the testing. I'll plan out the
// dialogue next."* So every pool below is EMPTY and the boot log says so out loud.
//
// ⛔ DO NOT FILL THEM. A placeholder line anchors the writing and gets mistaken for
// content later; "You feel an urge to go below" is his EXAMPLE of a tier-1 line, not a
// line to ship. An empty pool is honest and the escalation can be tested without a
// single word by reading the tier number.
//
// ── ⚠️ IT MEASURES DAYS WITHOUT THE DEEP, NOT DAYS PLAYED ───────────────────
// A player who descends on day 6 and comes back up is at tier 0 again. The urge is about
// STAYING AWAY, which is exactly what Ank is paying them to do - so his bribe working is
// what makes this get louder. The two systems argue through the player.
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[urge] '
  var GATE = true

  // ⚠️ THE SAME BOUNDARY ANK USES, read from him rather than copied. Two constants that
  // must agree and do not is how "he left but the urge never started" happens - and the
  // symptom would be a player at -33 who is neither warned nor pulled.
  function tooDeep() {
    try { if (VELDORA.ank && typeof VELDORA.ank.TOO_DEEP === 'number') return VELDORA.ank.TOO_DEEP } catch (e) { }
    return -32
  }

  var K_LAST = 'veldora_urge_last_deep'   // world day of the last descent
  var K_COUNT = 'veldora_urge_descents'   // how many times they have gone down at all
  var K_SPOKE = 'veldora_urge_spoke'      // world day the urge last spoke

  // ⭐ THE TIERS. Days without going below -> how agitated the line is.
  //
  // ⚠️ FIRST GUESS, AND MEANT TO BE. Act 0 runs seven days, so the ramp has to fit inside
  // that: tier 1 on the second day, tier 4 by the sixth. Ethan's writing will want these
  // moved once he can see the ramp; they are one edit and a re-run.
  var TIERS = [
    { day: 1, tag: 'urge_1' },
    { day: 2, tag: 'urge_2' },
    { day: 4, tag: 'urge_3' },
    { day: 6, tag: 'urge_4' },
  ]

  // 🖊️ ETHAN'S. Every one is empty on purpose - see the header.
  var LINES = {
    urge_1: [],
    urge_2: [],
    urge_3: [],
    urge_4: [],
  }

  var CHECK_EVERY = 200                   // 10s. It is a mood, not an alarm.

  function dayOf(srv) {
    try {
      var d = srv.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  function getInt(p, k) { try { return p.persistentData.getInt(k) } catch (e) { return 0 } }
  function putInt(p, k, v) { try { p.persistentData.putInt(k, v) } catch (e) { } }

  function yOf(p) {
    try { var y = p.y; if (typeof y === 'number' && isFinite(y)) return y } catch (e) { }
    return null
  }

  /**
   * Days since this player was last in the deep.
   *
   * ⚠️ TRI-STATE. `null` means the clock could not be read, and the caller does nothing -
   * it does NOT mean zero. A world with an unreadable time would otherwise read as "they
   * just descended" forever and the urge would never start.
   *
   * ⭐ A player who has NEVER descended is measured from their first day, not from zero.
   * Otherwise the urge starts silent for exactly the player it is aimed at.
   */
  function daysWithout(srv, p) {
    var now = dayOf(srv)
    if (now === null) return null
    var last = getInt(p, K_LAST)
    // 0 means unset: stamp today and start the clock rather than reporting a huge number
    // on a player who has been in the world for five minutes.
    if (!last) { putInt(p, K_LAST, now + 1); return 0 }
    return Math.max(0, now - (last - 1))
  }

  /**
   * Which tier this player is at.
   *
   * 🔴 THREE OUTCOMES, AND THE FIRST VERSION HAD TWO OF THEM SHARING A VALUE:
   *
   *     null    the clock could not be read
   *     false   readable, and they are not agitated yet
   *     {tier}  they are
   *
   * ⚠️ Returning `null` for both of the first two made `consider` report "unreadable" for
   * an ordinary calm player, and its `not-yet` branch was unreachable. So a world with a
   * broken clock and a player on their first morning were indistinguishable - which is
   * this project's signature bug, caught here by the harness rather than in play.
   */
  function tierOf(srv, p) {
    var d = daysWithout(srv, p)
    if (d === null) return null
    var out = false
    for (var i = 0; i < TIERS.length; i++) if (d >= TIERS[i].day) out = TIERS[i]
    return out
  }

  /**
   * Record a descent. Resets the urge to nothing, and counts it.
   *
   * ⭐ THE COUNT IS WHAT PRICES ANK. Every descent is him losing the argument, and his
   * next offer is better for it - so the discount is EVIDENCE that he is failing rather
   * than a schedule ticking over. A player who never goes down never sees him desperate.
   */
  function descended(srv, p) {
    var now = dayOf(srv)
    if (now === null) return false
    var first = getInt(p, K_LAST) !== now + 1
    putInt(p, K_LAST, now + 1)
    // ⚠️ ONCE PER DAY, not once per sweep. The tick runs every ten seconds and a player
    // mining below the boundary would otherwise reach the bottom tier in three minutes.
    if (first) putInt(p, K_COUNT, getInt(p, K_COUNT) + 1)
    return true
  }

  /** How many separate days this player has gone below. */
  function descents(p) { return getInt(p, K_COUNT) }

  /**
   * Speak, if there is anything to say and it has not been said today.
   *
   * ⚠️ RETURNS A REASON, not a boolean. "no tier yet", "already spoke today" and "the pool
   * is empty" are three different states and only one of them is a problem.
   */
  function consider(srv, p) {
    if (!GATE) return 'gated'

    // ⛔ Only in daylight-ish terms: being IN the deep is not the moment to be told to go
    // to the deep. Ank's band and below are both excluded - the urge is for the surface.
    var y = yOf(p)
    if (y !== null && y < tooDeep()) return 'in-the-deep'

    var tier = tierOf(srv, p)
    if (tier === null) return 'unreadable'
    if (!tier) return 'not-yet'

    var now = dayOf(srv)
    if (now === null) return 'unreadable'
    if (getInt(p, K_SPOKE) === now + 1) return 'spoke-today'

    var pool = LINES[tier.tag] || []
    if (!pool.length) {
      // 🔑 NOT AN ERROR, AND NOT SILENT EITHER. The escalation is working; nobody has
      // written the words yet. This is the state the whole file ships in, and the boot
      // report says so, so an empty pool can never be mistaken for a broken tier.
      return 'no-lines:' + tier.tag
    }

    putInt(p, K_SPOKE, now + 1)
    var text = pool[Math.floor(Math.random() * pool.length)]
    try {
      if (VELDORA.announce && typeof VELDORA.announce.text === 'function') {
        VELDORA.announce.text(srv, p, text, VELDORA.announce.P_AMBIENT)
      }
    } catch (e) { console.warn(TAG + 'the urge threw :: ' + e) }
    return 'spoke:' + tier.tag
  }

  VELDORA.urge = {
    consider: consider,
    tierOf: tierOf,
    daysWithout: daysWithout,
    descended: descended,
    descents: descents,
    tiers: TIERS,
    lines: LINES,
    written: function () {
      var n = 0
      for (var k in LINES) if (LINES.hasOwnProperty(k) && LINES[k].length) n++
      return n
    },
  }

  ServerEvents.tick(function (event) {
    if (!GATE) return
    var srv = event.server
    if (!srv || srv.tickCount % CHECK_EVERY !== 0) return
    try {
      var ps = srv.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        // ⛔ ACT 0 ONLY, like Ank. A player with a path is past this.
        var path = null
        try { if (VELDORA.paths && VELDORA.paths.pathOf) path = VELDORA.paths.pathOf(p) } catch (e) { }
        if (path) continue

        // ⭐ THE DESCENT IS RECORDED HERE, not by a separate hook. Being below the
        // boundary IS the reset, so the same sweep that would nag them notices they went.
        var y = yOf(p)
        if (y !== null && y < tooDeep()) {
          descended(srv, p)
          // 🔑 And this is the moment "The Caves" is earned - the first time the pull won.
          try { if (VELDORA.story) VELDORA.story.reach(p, 'the_caves') } catch (e) { }
          continue
        }
        consider(srv, p)
      }
    } catch (e) { }
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    var root = Commands.literal('urge').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var d = daysWithout(srv, p)
      var t = tierOf(srv, p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7days without the deep: §f' + (d === null ? '§cUNREADABLE' : d)))
      p.tell(Text.of('§7tier: §f' + (t ? t.tag : 'none') + '§7 · would say: §f' + consider(srv, p)))
      p.tell(Text.of('§7pools written: §f' + VELDORA.urge.written() + '/' + TIERS.length))
      p.tell(Text.of('§8/urge reset §7pretend you just descended'))
      return 1
    })

    root = root.then(Commands.literal('reset').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      descended(ctx.source.server, p)
      p.tell(Text.of('§7the urge is quiet again.'))
      return 1
    }))

    event.register(root)
  })

  ServerEvents.loaded(function () {
    var w = VELDORA.urge.written()
    console.info(TAG + TIERS.length + ' tiers, ' + w + ' written. ' + (w
      ? 'The urge speaks.'
      : '🖊️ EVERY POOL IS EMPTY AND THAT IS DELIBERATE - Ethan writes these. The ' +
        'escalation still runs and /urge shows the tier, so the ramp is testable ' +
        'without a single word.'))
  })
})();
