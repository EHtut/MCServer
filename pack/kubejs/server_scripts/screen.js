// screen.js — one screen, one message at a time, and a queue nobody can jump.
//
// ── 🔴 WHAT THE MOD ACTUALLY DOES ──────────────────────────────────────────────
// Read out of ImmersiveMessagesManager, not assumed:
//
//     showToPlayer(msg) -> tooltipQueue.add(msg)        ENQUEUE, never replace
//     render()          -> if (currentTooltip == null && !queue.isEmpty())
//                              currentTooltip = queue.remove()
//     on expiry         -> currentTooltip = null
//                          countdownToNextTooltip = timeBetweenMessages   (0.5s)
//
// ⭐ ONE at a time. FIFO. **No clear, no reorder, no priority.** Every message costs the
// screen its own duration PLUS half a second, and everything sent after it waits.
//
// ── 🔑 SO THE REFEREE IS SERVER-SIDE, AND IT IS ABOUT BACKLOG ──────────────────
// announce.js solved the one-BAR problem by tracking a slot and dropping what could not
// have it. That was the right shape for a bar. It is the wrong shape here, because the
// client will happily accept everything and simply play it late.
//
// 🚨 A TIDE WARNING QUEUED BEHIND FIVE WHISPERS ARRIVES AFTER THE TIDE. Nothing can jump
// it and nothing errors - the warning is delivered, perfectly, to a corpse. That is the
// failure this file exists to prevent, and it is invisible from inside the game.
//
// ⭐ THE RULE: THE LOWER THE PRIORITY, THE EMPTIER THE QUEUE MUST BE.
// The dead do not get to mutter while a god is mid-sentence, and nothing at all gets to
// speak over a crashout.
//
// ── ⚠️ THIS IS A MODEL, NOT A READING ─────────────────────────────────────────
// The client's real queue cannot be queried from the server. This tracks what was SENT
// and assumes the mod's own timings, so it is an estimate in three ways:
//
//   · `timeBetweenMessages` is a CLIENT config a player can change. Raised, the real
//     backlog is longer than modelled and low-priority text gets through when it should
//     not. That is the safe direction: the failure is noise, not silence.
//   · anything sent NOT through VELDORA.im is invisible to this.
//   · a player who logs out drops their queue; the model is cleared on logout.
//
// 🔑 IT FAILS OPEN. If this file is missing or throws, every send is allowed - exactly
// as before it existed. A referee that fails closed would mute the pantheon on a glitch,
// and silence is the one symptom nobody reports because it looks like nothing happening.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[screen] '
  var GATE = true

  // The mod's own gap between messages. ⚠️ Its default; a client may differ.
  var GAP = 0.5

  // ⭐ PRIORITIES, and the backlog each will tolerate before it gives up. The number is
  // SECONDS OF QUEUE ALREADY OWED - not a rank comparison, because there is nothing to
  // compare against: the queue holds no priority and cannot be inspected.
  //
  // 🔑 Read it as "how rude is this allowed to be". A crashout interrupts anything; a
  // whisper only speaks into silence.
  var P = {
    WHISPER: 0.0,    // the dead muttering - only into a genuinely empty screen
    AMBIENT: 0.0,    // the place talking - same
    ASIDE: 4.5,      // your own head; may follow closely behind one thing
    GOD: 5.0,        // a god addressing you
    ANNOUNCE: 13.0,  // something is ABOUT to happen - a warning is worth a wait
    CRASHOUT: 999,   // a god announcing their own tide. Always.
  }

  // ⭐⭐ WHY ASIDE AND GOD WENT UP ON 2026-08-30, because the numbers alone will not say.
  //
  // Ethan: *"Whispers disappear way too fast and are unreadable. 1-2s"* - so a whisper
  // now holds up to 4.0s instead of 1.5s, because a fragment you cannot finish reading
  // is not atmosphere, it is a glitch you learn to ignore.
  //
  // 🔴 THAT IS NOT A LOCAL CHANGE. A whisper holding 4.0s costs 4.5s of queue, and
  // anything tolerating less than 4.5s is REFUSED outright while it plays - not delayed,
  // DROPPED. At the old ASIDE=2.0 and GOD=4.0 every interior line and every god line
  // landing inside a whisper would have been silently discarded, and the boot invariant
  // below is precisely the thing that refuses to let that ship.
  //
  // ⚠️ SO THE COST IS REAL AND IT IS PAID HERE: an aside may now arrive up to 4.5s after
  // the moment that prompted it, where before it would have been dropped. Late is the
  // better failure for an interior line - it still reads as your own head catching up.
  // For a WARNING it would not be, which is why ANNOUNCE did not move.

  // ⭐⭐ HOW LONG EACH MAY HOLD THE SCREEN, and this is the half that was missing.
  //
  // 🔴 THE FIRST VERSION LET A WHISPER BLOCK A GOD. A 3s whisper costs 3.5s of queue;
  // GOD tolerated 2.5s; so the dead muttering locked out the god who was about to
  // speak - the exact inversion this file exists to prevent, produced by the file
  // itself. Priority is not only "who may speak into a busy screen", it is also "how
  // much screen may this take", and only the second one is enforceable in advance.
  // 🔴🔴 GOD 6.0 -> 12.5 on 2026-08-30, AND IT IS A BUG FIX, NOT A TUNING CHANGE.
  //
  // The real duration of a god's line is `typing + reading` (voice.beatFor), and typing
  // costs one tick per character. The longest line in the game is 161 characters, which
  // is 12.3 SECONDS on screen. This table said 6.0, so the model believed every long
  // line cost half what it actually did - and the model is what decides whether the next
  // thing is allowed to speak.
  //
  // ⚠️ AN UNDER-ESTIMATE HERE IS NOT SAFE. It grants the screen to something that then
  // queues behind a line still being typed, which is precisely the "delivered to a
  // corpse" failure this file exists to prevent. The cap must cover the worst real case,
  // not the typical one.
  //
  // 🔑 AND ANNOUNCE HAD TO MOVE WITH IT (9.0 -> 13.0), because the boot invariant is
  // `HOLD[lo] + GAP <= P[hi]`: a god holding 12.5s costs 13s of queue, and a warning that
  // tolerated only 9 would have been REFUSED behind a god mid-sentence. The audit at the
  // bottom of this file is what refused to let that ship.
  var HOLD = {
    // 🔴 1.5 -> 4.0 on 2026-08-30. At 1.5s the dead were unreadable (Ethan, from play),
    // and tidewhispers.js now scales each fragment by its length and clamps to this
    // ceiling. ⚠️ Lower it and the whispers follow silently - the referee wins, which is
    // the correct direction for a cap.
    WHISPER: 4.0,
    AMBIENT: 1.5,
    ASIDE: 2.5,
    GOD: 12.5,
    ANNOUNCE: 8.0,
    CRASHOUT: 12.0,
  }

  // ⭐ THE INVARIANT, CHECKED AT BOOT RATHER THAN TRUSTED.
  //
  //     for any two priorities lo < hi:  HOLD[lo] + GAP  <=  P[hi]
  //
  // 🔑 i.e. NOTHING MAY EVER OCCUPY MORE SCREEN THAN ITS BETTERS WILL WAIT FOR. The
  // numbers above are tunable and their RELATIONSHIP is what actually matters, so a
  // change that breaks the ordering has to fail loudly at boot instead of becoming a
  // god who goes quiet on Tuesdays.
  var ORDER = ['WHISPER', 'AMBIENT', 'ASIDE', 'GOD', 'ANNOUNCE', 'CRASHOUT']

  // ⚠️ TAKES ITS TABLES AS ARGUMENTS so a test can feed it a KNOWN-BROKEN ordering.
  // Asserting `audit() === []` against the real tables is vacuous: an audit that simply
  // returned nothing would pass it, and one mutation proved exactly that.
  function auditOrder(p, hold) {
    p = p || P
    hold = hold || HOLD
    var bad = []
    for (var i = 0; i < ORDER.length; i++) {
      for (var j = i + 1; j < ORDER.length; j++) {
        var lo = ORDER[i], hi = ORDER[j]
        if (p[hi] >= 999) continue          // CRASHOUT waits for nothing by design
        // ⚠️ PEERS ARE ALLOWED TO BLOCK EACH OTHER. WHISPER and AMBIENT both tolerate
        // an empty screen only, and one whisper stopping the next IS the intent - there
        // is one screen. The invariant is about a STRICT superior being blocked by an
        // inferior, so equal tolerances are skipped rather than reported.
        if (p[hi] <= p[lo]) continue
        if (hold[lo] + GAP > p[hi]) {
          bad.push(lo + ' may hold ' + (hold[lo] + GAP) + 's but ' + hi +
            ' only tolerates ' + p[hi] + 's')
        }
      }
    }
    return bad
  }

  // player uuid -> the tick their queue is modelled to drain at.
  var drain = {}

  function now(player) {
    try { return player.server.tickCount } catch (e) { }
    try { return Utils.server.tickCount } catch (e) { }
    return null
  }

  function keyOf(player) {
    try { return String(player.uuid) } catch (e) { }
    try { return String(player.username) } catch (e) { }
    return null
  }

  /** Seconds of queue this player is already owed. */
  function backlog(player) {
    var t = now(player), k = keyOf(player)
    if (t === null || !k) return 0
    var d = drain[k]
    if (typeof d !== 'number') return 0
    return Math.max(0, (d - t) / 20)
  }

  /**
   * May this be sent? `priority` is a name from P, or a number of seconds of tolerated
   * backlog. `seconds` is how long the message itself will hold the screen.
   *
   * ⚠️ Claiming RECORDS the send. A caller that claims and then does not send poisons
   * the model, so claim() is called from exactly one place: VELDORA.im.show.
   */
  function claim(player, priority, seconds, continuation) {
    if (!GATE) return true
    try {
      var tol = (typeof priority === 'number') ? priority
        : (typeof P[String(priority).toUpperCase()] === 'number'
          ? P[String(priority).toUpperCase()] : P.GOD)

      // ⭐⭐ A CONTINUATION IS NOT A NEW CLAIM. A god's line is split into sentences and
      // sent as several messages; without this the FIRST sentences fill the queue and
      // the LAST ones are refused - an utterance interrupting itself, and the reader
      // gets three quarters of a sentence with nothing to say it stopped.
      //
      // 🔑 The screen is granted ONCE, for the whole utterance. Continuations still add
      // their cost, so the next thing along still has to wait for all of it.
      if (!continuation) {
        var owed = backlog(player)
        if (owed > tol) return false
      }

      var t = now(player), k = keyOf(player)
      if (t === null || !k) return true          // cannot model it; do not block it

      // ⚠️ CLAMPED, not trusted. A caller asking for a 30s whisper would lock the
      // screen against everything above it for half a minute, and the invariant above
      // is only true if this holds.
      var cap = HOLD[String(priority).toUpperCase()]
      var want = Number(seconds) || 4
      var cost = (typeof cap === 'number' ? Math.min(want, cap) : want) + GAP
      var d = drain[k]
      drain[k] = Math.max(t, (typeof d === 'number' ? d : t)) + Math.round(cost * 20)
      return true
    } catch (e) {
      // ⚠️ FAIL OPEN. See the header.
      return true
    }
  }

  function clear(player) {
    var k = keyOf(player)
    if (k) delete drain[k]
  }

  /**
   * ⭐⭐ HOLD THE SCREEN WITHOUT PUTTING ANYTHING ON IT.
   *
   * 🔑 Wall's two-movement crashout (docs/75 §2) puts a deliberate SILENCE between her
   * panic and her flat line, and `75` is explicit that *"the silence before that line is
   * load-bearing and must be protected"*.
   *
   * 🚨 Merely waiting does not protect it. The moment the panic drains, the model reads
   * empty, and the next whisper or ambient line is granted immediately - so the flat
   * line arrives as the SECOND thing you read rather than the only thing, which is the
   * entire effect lost to a mutter about the weather.
   *
   * ⚠️ NOT CLAMPED BY `HOLD`, because a reservation is not a message and has no
   * priority of its own. Its length is entirely the caller's, which is exactly why this
   * is not reachable from the ordinary send path - `VELDORA.im.show` calls `claim`, and
   * only a caller staging two movements calls this.
   */
  function reserve(player, seconds) {
    if (!GATE) return false
    try {
      var t = now(player), k = keyOf(player)
      if (t === null || !k) return false
      var s = Number(seconds)
      if (!isFinite(s) || s <= 0) return false
      var d = drain[k]
      drain[k] = Math.max(t, (typeof d === 'number' ? d : t)) + Math.round(s * 20)
      return true
    } catch (e) { return false }
  }

  VELDORA.screen = {
    P: P,
    HOLD: HOLD,
    _audit: auditOrder,
    claim: claim,
    reserve: reserve,
    backlog: backlog,
    clear: clear,
    gap: function () { return GAP },
    _drain: drain,
  }

  // 🚨 A LOGGED-OUT PLAYER'S QUEUE IS GONE. Without this the model keeps refusing
  // whispers to someone who rejoined to an empty screen - a god that goes quiet for no
  // reason and never says why.
  PlayerEvents.loggedOut(function (event) {
    try { clear(event.player) } catch (e) { }
  })

  ServerEvents.loaded(function () {
    var bad = auditOrder()
    if (bad.length) {
      // 🚨 LOUD. A broken ordering does not crash anything - it produces a god that
      // sometimes does not speak, which nobody reports because it looks like nothing.
      console.error(TAG + 'PRIORITY ORDERING IS BROKEN - something can be blocked by ' +
        'its inferior:')
      for (var i = 0; i < bad.length; i++) console.error(TAG + '  ' + bad[i])
    }
    console.info(TAG + (GATE
      ? 'live. One message at a time on the client, FIFO, no clear and no reorder - so ' +
        'the lower the priority the emptier the queue must be. A tide warning behind ' +
        'five whispers arrives after the tide, and nothing in the game would say so.'
      : 'GATED OFF - every send is allowed, as before this existed'))
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    if (!Commands) return
    try {
      event.register(Commands.literal('screen')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .executes(function (ctx) {
          var p = ctx.source.player
          p.tell(Text.of('§8backlog: §f' + backlog(p).toFixed(1) + 's'))
          var names = ['WHISPER', 'AMBIENT', 'ASIDE', 'GOD', 'ANNOUNCE', 'CRASHOUT']
          for (var i = 0; i < names.length; i++) {
            var tol = P[names[i]]
            p.tell(Text.of('§8' + names[i] + ' §7tolerates §f' + tol + 's§7 -> ' +
              (backlog(p) > tol ? '§cwould be REFUSED' : '§awould send')))
          }
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
