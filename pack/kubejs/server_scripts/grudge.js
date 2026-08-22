// grudge.js — THE GRUDGE.  docs/49 §3 + §4, mechanics C and D.
//
// Ethan, 2026-08-16: "if the champion keeps getting killed by another over and over
// again. once ticker hits 4 it causes the opposing god to lash out."
//
//     Blade    Strength debuff        Salvage  Speed debuff
//     Forge    Mining fatigue         Wall     Hordes of spiders
//     Art      Nothing again because art doesn't care
//
// ── ⭐ C AND D ARE ONE EVENT, NOT TWO ────────────────────────────────────────
// He listed the arguments separately ("We can also do arguments"), but his own
// sample IS the ticker's complaint spoken aloud:
//
//     Wall    Your champion keeps hurting mine, they keep murdering mine!
//     Blade   So? That means they were weak.
//     Wall    You will regret your words, warrior.
//     Blade   Then let me.
//
// So the argument is not a separate event that sometimes happens - it is the
// NARRATION of the reprisal, and binding them gives each half what it lacks. The
// argument stops being two gods bickering and becomes the moment before something
// lands; the debuff stops being an icon appearing from nowhere and gets a cause the
// players watch happen.
//
// ── 🔴 THE THREE BEHAVIOURS THE SPEC DID NOT STATE ──────────────────────────
// Each had a wrong default and all three are decided here, visibly:
//
//  1. SCOPE - keyed per (victim, killer) PAIR. "killed by another" reads as a
//     specific someone. A single per-victim counter means a third player's kills
//     push the ticker and the god then lashes out at whoever happens to trip it,
//     punishing someone who killed the champion once. Invisible at two players and
//     badly wrong at four.
//
//  2. RESET - to zero on fire. Without it the 5th kill and the 500th are identical
//     and the reprisal becomes permanent background weather rather than an event.
//
//  3. DECAY - yes, and this one is a genuine fork. release.js shipped with "streaks
//     do NOT decay - 'in a row' is the only forgiveness"; Wall's rage decays on a
//     quiet-time curve. A grudge is a MOOD, not a contract, so it fades: four kills
//     spread over three months must not fire like four kills in an evening.
//
// ── ⚠️ THESE ARE THE FIRST MECHANICS THAT MAKE A PLAYER WORSE ───────────────
// Every coefficient in this pack is floored at 1.0 because Ethan ruled a path may
// never be made worse. This is different - it is a reprisal aimed at an aggressor,
// not a multiplier on a path - but it is the same FEELING, so the durations are
// short and the cause is always announced. Nothing here takes items: "No we don't
// take items from players, that is how you cause them to quit."
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[grudge] '
  var GATE = true

  var NEED = 4                    // "once ticker hits 4"
  var DECAY_TICKS = 48000         // 2 world days of no repeat kill = -1
  var K_COUNT = 'veldora_grudge_n_'    // + killerName, on the VICTIM
  var K_SEEN = 'veldora_grudge_t_'     // + killerName, world ticks of the last one

  // ⭐ EACH GOD DENIES YOU ITS OWN DOMAIN. That is why the table reads right: the
  // warrior takes your strength, the marksman takes your speed, the builder takes
  // your ability to build, and the Spider does not take anything - she sends
  // something. Art is absent, deliberately.
  //
  // ⚠️ MINING FATIGUE IS THE DANGEROUS ONE and it belongs to the BUILDER on a Create
  // server. Weakness and slowness matter for a fight you can walk away from; mining
  // fatigue ruins a task you were CHOOSING to do. Kept shortest of the three, amp 0,
  // and always announced - the answer must be "wait", never "log off".
  var LASH = {
    blade: { effect: 'minecraft:weakness', secs: 90, amp: 0 },
    salvage: { effect: 'minecraft:slowness', secs: 75, amp: 0 },
    forge: { effect: 'minecraft:mining_fatigue', secs: 45, amp: 0 },
    wall: { spiders: true },
    art: null,                    // "Art - Nothing again because art doesn't care"
  }
  // 🚨 AUDIT 2026-08-18: `crown` was MISSING from LASH, so a Crown champion's god
  // did nothing and the log announced "crown does not retaliate - that is the
  // posture", which was a lie: there was no posture, there was a gap. This is the
  // SAME defect found in warn.js this morning and reintroduced here hours later -
  // crown aliases wall in coefficients.js, in warn.js and in paths.js, and it has to
  // be resolved everywhere or it silently falls through every table it is missing
  // from. Resolved rather than duplicated, so the two can never drift.
  var ALIAS = { crown: 'wall' }
  function resolveGod(g) { return ALIAS[g] || g }

  var WALL_SPIDERS = ['goety:spider_servant', 'minecraft:cave_spider']
  var WALL_COUNT = 5

  function nowTicks(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d)
    } catch (e) { }
    return null
  }

  function pathOf(p) {
    try { if (VELDORA.paths) return VELDORA.paths.pathOf(p) || '' } catch (e) { }
    return ''
  }

  // ── the ticker ─────────────────────────────────────────────────────────────
  // Stored on the VICTIM, keyed by killer name, so two rivals never share a count.
  function bump(server, victim, killerName) {
    var now = nowTicks(server)
    if (now === null) {
      console.warn(TAG + 'no world clock - cannot age a grudge, so none is recorded')
      return null
    }
    var kc = K_COUNT + killerName, kt = K_SEEN + killerName
    var n = 0, last = 0
    try { n = victim.persistentData.getInt(kc) } catch (e) { }
    try { last = victim.persistentData.getDouble(kt) } catch (e) { }

    if (last) {
      var since = now - (last - 1)
      // ⚠️ A stamp from the future means an admin moved the clock. Re-anchor rather
      // than decaying a grudge to nothing - finding K9, again.
      if (since < 0) since = 0
      var faded = Math.floor(since / DECAY_TICKS)
      if (faded > 0) {
        n = Math.max(0, n - faded)
        if (n === 0) console.info(TAG + victim.username + ' has forgiven ' + killerName)
      }
    }

    n++
    try {
      victim.persistentData.putInt(kc, n)
      victim.persistentData.putDouble(kt, now + 1)
    } catch (e) { return null }
    return n
  }

  function clear(victim, killerName) {
    try { victim.persistentData.putInt(K_COUNT + killerName, 0) } catch (e) { }
  }

  // ── D: the argument, which IS this event's narration ───────────────────────
  function argue(server, wronged, rival, onDone) {
    if (!VELDORA.broadcast) return 'no-broadcast'
    wronged = resolveGod(wronged); rival = resolveGod(rival)
    if (wronged === rival) return 'same-god'
    // ⭐ Art has no argue pools by design. The other god still gets to notice, which
    // is the loudest possible way to render "art doesn't care" - the absence becomes
    // content instead of an exchange that silently never happens.
    var rivalMute = !VELDORA.broadcast.hasVoice(rival, 'argue_answer')
    if (rivalMute) {
      return VELDORA.broadcast.exchange(server, [
        { god: wronged, tag: 'argue_accuse' },
        { god: wronged, tag: 'argue_unanswered' },
      ], { why: wronged + ' accuses ' + rival + ' (no answer)', onDone: onDone })
    }
    return VELDORA.broadcast.exchange(server, [
      { god: wronged, tag: 'argue_accuse' },
      { god: rival, tag: 'argue_answer' },
      { god: wronged, tag: 'argue_threat' },
      { god: rival, tag: 'argue_refuse' },
    ], { why: wronged + ' vs ' + rival, onDone: onDone })
  }

  // ── C: the reprisal ────────────────────────────────────────────────────────
  function lash(server, god, killer) {
    god = resolveGod(god)
    var spec = LASH[god]
    if (spec === null || spec === undefined) {
      // Logged, so "art is indifferent" and "the hook is dead" are never the same
      // observation. This repo has shipped three mechanics that loaded clean and
      // did nothing.
      console.info(TAG + god + ' does not retaliate - that is the posture, not a fault')
      return 'no-posture'
    }
    var name = '?'
    try { name = String(killer.username) } catch (e) { return 'no-name' }

    // ⚠️ THE REPRISAL IS DEFERRED ~8s BEHIND THE ARGUMENT, so by the time it lands
    // the killer may have logged out and this handle is stale. `effect give` on a
    // missing name fails harmlessly, but spawner.wave() reads player.server and
    // scans entities around them - on a stale object that throws. Both call sites
    // catch, so it was never fatal, but it would have logged a confusing stack
    // instead of the plain fact that somebody left.
    var here = false
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        try { if (String(ps[i].username) === name) { killer = ps[i]; here = true; break } } catch (e) { }
      }
    } catch (e) { }
    if (!here) {
      console.info(TAG + name + ' logged out before ' + god + ' could answer - reprisal dropped')
      return 'gone'
    }

    if (spec.spiders) {
      // She sends something rather than taking something - the only physical answer
      // in the table, and the only one that fits her.
      if (!VELDORA.spawner || typeof VELDORA.spawner.wave !== 'function') {
        console.error(TAG + 'spawner missing - the Spider cannot answer')
        return 'no-spawner'
      }
      VELDORA.spawner.wave(killer, { ids: WALL_SPIDERS, count: WALL_COUNT })
      console.info(TAG + 'the Spider sent ' + WALL_COUNT + ' after ' + name)
      return 'spiders'
    }

    try {
      server.runCommandSilent('effect give ' + name + ' ' + spec.effect + ' ' +
        spec.secs + ' ' + spec.amp + ' false')
    } catch (e) {
      console.error(TAG + 'could not apply ' + spec.effect + ' to ' + name + ' :: ' + e)
      return 'threw'
    }
    console.info(TAG + god + ' put ' + spec.effect + ' on ' + name + ' for ' + spec.secs + 's')
    return 'effect'
  }

  // ═══════════════════════════════════════════════════════════════════════════
  EntityEvents.death(function (event) {
    if (!GATE) return
    try {
      var victim = event.entity
      if (!victim || !victim.player) return
      var killer = event.source ? event.source.player : null
      if (!killer) return                       // not PvP - nemesis_tally owns that

      var vName = String(victim.username), kName = String(killer.username)
      if (vName === kName) return               // suicide is not a grudge

      var god = pathOf(victim)
      if (!god) return                          // no patron, nobody to be aggrieved
      var rival = pathOf(killer)

      // 🚨 SAME GOD ON BOTH SIDES. Blade would approve of one of his killing
      // another; Wall would be destroyed by it. Neither is written, and a god
      // accusing ITSELF in a broadcast would read as a bug however it were phrased.
      // So the ticker still runs - the grief is real - but there is no argument.
      var sameGod = (rival && rival === god)

      var server = null
      try { server = victim.server } catch (e) { }
      if (!server) return

      var n = bump(server, victim, kName)
      if (n === null) return
      console.info(TAG + kName + ' has killed ' + vName + ' ' + n + '/' + NEED +
        ' time(s)' + (sameGod ? ' (same god - no argument)' : ''))
      if (n < NEED) return

      clear(victim, kName)                      // reset on fire, never a ratchet

      // ═══════════════════════════════════════════════════════════════════════
      // 🚨 THE REPRISAL LANDS AFTER THE WORDS.  Audit 2026-08-18.
      //
      // This called argue() and lash() on the same tick. The exchange paces its
      // four lines over ~160 ticks, so the debuff or the spiders arrived EIGHT
      // SECONDS BEFORE the threat that explains them - which is precisely
      // backwards from what docs/49 §4 says this design is for: "the argument
      // stops being two gods bickering and becomes the moment before something
      // lands". It was landing first and being narrated afterwards.
      //
      // ⚠️ AND A VOICE FAILURE MUST NEVER DISARM THE MECHANIC. onDone only fires
      // if the exchange actually went out; every other outcome - no pools, no
      // broadcast seam, same god, an exchange already running - means nobody is
      // going to say anything, and the reprisal must still land immediately.
      // That invariant is asserted in the harness and it is the one that makes
      // this safe to defer at all.
      // ═══════════════════════════════════════════════════════════════════════
      var fired = false
      function reprisal() {
        if (fired) return                       // belt and braces: exactly once
        fired = true
        lash(server, god, killer)
      }

      var narrated = 'none'
      if (!sameGod && rival) narrated = argue(server, god, rival, reprisal)
      if (narrated !== 'sent') reprisal()
    } catch (e) { console.warn(TAG + 'death hook threw :: ' + e) }
  })

  VELDORA.grudge = {
    need: NEED,
    count: function (victim, killerName) {
      try { return victim.persistentData.getInt(K_COUNT + killerName) } catch (e) { return null }
    },
    lash: lash,
    argue: argue,
  }

  ServerEvents.loaded(function (event) {
    event.server.scheduleInTicks(1, function () {
      var withVoice = [], mute = [], noLines = []
      for (var g in LASH) {
        if (!LASH.hasOwnProperty(g)) continue
        if (LASH[g] === null) { mute.push(g); continue }
        var has = false
        try { has = !!(VELDORA.broadcast && VELDORA.broadcast.hasVoice(g, 'argue_accuse')) } catch (e) { }
        (has ? withVoice : noLines).push(g)
      }
      console.info(TAG + 'THE GRUDGE live - ' + NEED + ' kills by the SAME player, ' +
        'per (victim, killer) pair, reset on fire, -1 per ' +
        Math.round(DECAY_TICKS / 24000) + ' world days of peace.')
      console.info(TAG + 'reprisals: blade=weakness ' + LASH.blade.secs + 's · salvage=slowness ' +
        LASH.salvage.secs + 's · forge=mining_fatigue ' + LASH.forge.secs + 's · wall=' +
        WALL_COUNT + ' spiders · art=nothing, by design')
      if (noLines.length) {
        console.warn(TAG + '!! NO ARGUE LINES for: ' + noLines.join(', ') +
          ' - the reprisal still lands but it arrives UNANNOUNCED, which is the ' +
          'effect-from-nowhere this design exists to avoid. Pools needed: ' +
          'argue_accuse / argue_answer / argue_threat / argue_refuse.')
      }
    })
  })
})();
