// opening.js — the cutscene a player gets once, before they are anybody's champion.
//
// Ethan's words are `docs/dialogue/Player intros.txt` -> opening_lines.js (generated).
// The design is `docs/78-THE-OPENING.md`.
//
// ── ⚠️ NOT introductions.js ─────────────────────────────────────────────────
// That file is the GOD-OFFER scenes: a patron asks, and you accept or refuse. This is the
// player's opening, before any god knows they exist. Two systems, similar names, and one
// of them is the reason this comment is here.
//
// ── ⭐ WHAT IT IS ────────────────────────────────────────────────────────────
// You were a traveller, or a fisherman, or a merchant. You caught something on the road,
// stopped in a village to die, and on the seventh night a woman with white hair and
// mismatched eyes sat with you until morning and left without a word.
//
// You woke up glad.
//
// 🔑 THE TONE IS THE MECHANISM, not decoration. Ethan: *"make life actually seem worth
// living and the player is happy and excited to be alive."* Everything here exists so
// that "You feel wrong", hours later and after a death, has something to take away.
// A line that foreshadows spends that ending early.
//
// ── 🚨 SHE NEVER SPEAKS, AND THAT IS LOAD-BEARING ───────────────────────────
// "She spoke no words. Made no sounds." The doctor is Alice; docs/40 §0 says a name is the
// most expensive word in the game and Alice is never printed. Because she has no dialogue
// here at all, there is nothing to leak — the reveal survives without anything guarding
// it. ⛔ Do not give her a line. Do not add a callback when the player later meets the
// Doctor in the dark. The connection is the reward for paying attention.
//
// ── WHEN IT FIRES ────────────────────────────────────────────────────────────
// Ethan: *"plays after about 5-10 minutes of being on for the sake of not being lost in
// the bootup."* A cutscene that lands during the join-noise is a cutscene nobody read.
//
// ⭐ ONCE PER WORLD, and that comes for free: `persistentData` lives in the player's save
// data, so a new world is a new player. No extra bookkeeping, and no way for it to leak
// across worlds. `/opening reset` exists for testing.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[opening] '
  var GATE = true

  var K_SEEN = 'veldora_opening_seen'
  var K_WHICH = 'veldora_opening_which'   // which life they got, +1 so 0 means unset

  // ⚠️ A WINDOW, not a fixed delay. 5-10 minutes, rolled per player, so two people
  // joining together do not get their origin stories in lockstep.
  var DELAY_MIN = 20 * 60 * 5
  var DELAY_MAX = 20 * 60 * 10

  // ⭐⭐ ITS OWN PACE, and it needs one. Eighteen beats at the ordinary 12s hold is over
  // three minutes of cutscene. This is a CONTINUOUS SEQUENCE the player is reading, not
  // an interruption during play, so it moves faster - and `beatScale` is the existing dial
  // for exactly that.
  //
  // ⚠️ It scales the READING half only. The typing half is fixed and never scaled, or the
  // beats would be cut off mid-word (the bug that cost a testing round on 2026-08-30).
  var SCENE_SCALE = 0.35

  // Between beats. ⚠️ Deliberately small: within one passage the beats should feel like
  // one continuous thought rather than separate announcements.
  var BEAT_GAP = 6

  function lines() {
    try { return VELDORA.openingLines || null } catch (e) { return null }
  }

  function seen(p) {
    try { return !!p.persistentData.getBoolean(K_SEEN) } catch (e) { return true }
  }

  /**
   * ⭐ THE LIFE IS STAMPED, not re-rolled. If the cutscene is ever replayed - by the admin
   * command, or by a future "remember your origin" surface - the player must get the SAME
   * past. A randomised backstory that changes is not a backstory.
   */
  function lifeOf(p) {
    var L = lines()
    if (!L) return 0
    var n = L.count()
    if (!n) return 0
    var v = 0
    try { v = p.persistentData.getInt(K_WHICH) } catch (e) { }
    if (v > 0) return (v - 1) % n
    var pick = Math.floor(Math.random() * n)
    try { p.persistentData.putInt(K_WHICH, pick + 1) } catch (e) { }
    return pick
  }

  /**
   * Play it. Returns a REASON STRING, never a bare boolean - "did not play" has four
   * causes here and they are not the same event.
   */
  function play(p, forced) {
    var L = lines()
    if (!L) return 'no-lines'
    if (!forced && !GATE) return 'gated'
    if (!forced && seen(p)) return 'already-seen'

    var beats = L.build(lifeOf(p))
    if (!beats || !beats.length) return 'empty'

    var srv = null
    try { srv = p.server } catch (e) { }
    if (!srv) return 'no-server'

    // 🚨 STAMPED BEFORE THE FIRST BEAT, not after the last. A player who logs out
    // mid-cutscene must not get their origin story again on the next login - and the
    // "after" version cannot survive a disconnect, which is precisely when it matters.
    try { p.persistentData.putBoolean(K_SEEN, true) } catch (e) { }

    var uid = null
    try { uid = String(p.uuid) } catch (e) { }

    var at = 20
    for (var i = 0; i < beats.length; i++) {
      (function (text, delay) {
        srv.scheduleInTicks(delay, function () {
          try {
            // ⚠️ RE-LOOKED-UP. Three minutes is long enough to log out in, and a stale
            // player reference outlives the player.
            var ps = srv.players
            for (var k = 0; k < ps.length; k++) {
              if (String(ps[k].uuid) !== uid) continue
              // ⭐ THE INTERIOR SURFACE. This is the player's own voice - no god, no
              // colour, no chime - which is the same register as the C3 asides, because
              // it is the same thing: a person, thinking.
              VELDORA.voice.aside(ps[k], text, {
                seconds: beatSeconds(text),
                priority: 'ANNOUNCE',
              })
              return
            }
          } catch (e) { }
        })
      })(beats[i], at)
      at += beatTicks(beats[i]) + BEAT_GAP
    }

    console.info(TAG + p.username + ' - opening ' + (lifeOf(p) + 1) + '/' + L.count() +
      ', ' + beats.length + ' beats over ' + Math.round(at / 20) + 's' +
      (forced ? ' (forced)' : ''))
    return 'played'
  }

  function beatTicks(text) {
    try { return VELDORA.voice.beatFor(text, { beatScale: SCENE_SCALE }) } catch (e) { }
    return 100
  }
  function beatSeconds(text) { return beatTicks(text) / 20 }

  // ── the delayed start ──────────────────────────────────────────────────────
  // ⚠️ IN MEMORY, and deliberately. A pending timer that survived a restart would fire
  // the opening at a player who has been playing for an hour.
  var pending = {}

  function arm(p) {
    if (!GATE) return
    if (seen(p)) return
    var uid = null, srv = null
    try { uid = String(p.uuid); srv = p.server } catch (e) { return }
    if (!uid || !srv || pending[uid]) return
    pending[uid] = true
    var wait = DELAY_MIN + Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN))
    srv.scheduleInTicks(wait, function () {
      delete pending[uid]
      try {
        var ps = srv.players
        for (var k = 0; k < ps.length; k++) {
          // 🔑 Only if they are STILL here and STILL have not seen it. Someone who
          // logged out and back in during the window is armed again by loggedIn.
          if (String(ps[k].uuid) === uid && !seen(ps[k])) play(ps[k], false)
        }
      } catch (e) { }
    })
  }

  PlayerEvents.loggedIn(function (event) {
    try { arm(event.player) } catch (e) { }
  })
  PlayerEvents.loggedOut(function (event) {
    try { delete pending[String(event.player.uuid)] } catch (e) { }
  })

  VELDORA.opening = {
    play: play,
    seen: seen,
    lifeOf: lifeOf,
    reset: function (p) {
      try {
        p.persistentData.putBoolean(K_SEEN, false)
        // ⚠️ The LIFE is cleared too. Resetting to watch it again and getting the same
        // three beats is a worse test than a fresh roll.
        p.persistentData.putInt(K_WHICH, 0)
        return true
      } catch (e) { return false }
    },
  }

  ServerEvents.loaded(function () {
    var L = lines()
    if (!GATE) { console.info(TAG + 'GATED OFF'); return }
    if (!L) {
      console.error(TAG + 'no lines - run `python tools/opening_import.py --write`')
      return
    }
    var n = L.count()
    var beats = L.build(0).length
    console.info(TAG + n + ' life/lives, ' + beats + ' beats each. Fires ' +
      (DELAY_MIN / 1200) + '-' + (DELAY_MAX / 1200) + ' minutes after login, ONCE per ' +
      'world (persistentData is per-world, so a new world is a new player). ' +
      'Delivered in the player\'s own voice - no god, no colour. ' +
      '⭐ The doctor never speaks, which is what keeps the reveal safe.')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    if (!Commands) return
    try {
      var root = Commands.literal('opening')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var L = lines()
          p.tell(Text.of('§8seen: §f' + seen(p) + '§8 · your life: §f' +
            (L ? (lifeOf(p) + 1) + '/' + L.count() : '?')))
          p.tell(Text.of('§8/opening play §7force it · §8/opening reset §7forget it'))
          return 1
        })
      root = root.then(Commands.literal('play').executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        p.tell(Text.of('§8' + play(p, true)))
        return 1
      }))
      root = root.then(Commands.literal('reset').executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        VELDORA.opening.reset(p)
        p.tell(Text.of('§7forgotten. It will fire again ' + (DELAY_MIN / 1200) + '-' +
          (DELAY_MAX / 1200) + ' minutes after your next login, with a fresh life.'))
        return 1
      }))
      event.register(root)
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
