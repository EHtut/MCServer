// opening.js — the cutscene a player gets once, before they are anybody's champion.
//
// Ethan's words are `docs/dialogue/Player intros.txt` -> opening_lines.js (generated).
// The design is `docs/ACT0.md`.
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
  // ⛔ K_WHICH IS GONE. It stored WHICH randomised life a player rolled; Ethan cut the
  // randomised life 2026-09-05 - there is ONE origin, the script he wrote. A stored index
  // into a one-element set is state that can only ever be wrong.

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
   * Play it. Returns a REASON STRING, never a bare boolean - "did not play" has four
   * causes here and they are not the same event.
   */

  // How long one journal entry needs on screen: the time to type it, plus a moment to
  // finish reading the last line. ⚠️ voice.TYPE_CHARS_PER_SEC is an ESTIMATE from a single
  // eyeball reading and the mod's real rate is unreachable (D-123), so this errs long -
  // an entry that lingers is fine, one that vanishes mid-sentence is the reported bug.
  // ⭐ How long between lines. Ethan: *"too fast."* At 55 ticks a 22-line entry runs about
  // a minute - slow enough to read a sentence before the next one lands.
  var LINE_GAP = 55
  var NEWLINE = '\n'

  function entrySeconds(lines) {
    var n = 0
    for (var i = 0; i < (lines || []).length; i++) n += String(lines[i]).length
    return Math.max(8, Math.round(n / 13) + 6)
  }

  function play(p, forced) {
    var L = lines()
    if (!L) return 'no-lines'
    if (!forced && !GATE) return 'gated'
    if (!forced && seen(p)) return 'already-seen'

    var beats = L.build()
    if (!beats || !beats.length) return 'empty'

    var srv = null
    try { srv = p.server } catch (e) { }
    if (!srv) return 'no-server'

    // 🚨 STAMPED BEFORE THE FIRST BEAT, not after the last. A player who logs out
    // mid-cutscene must not get their origin story again on the next login - and the
    // "after" version cannot survive a disconnect, which is precisely when it matters.
    try { p.persistentData.putBoolean(K_SEEN, true) } catch (e) { }

    // ⭐⭐ IT IS A CUTSCENE NOW, THROUGH ritual.js - the same primitive that runs the
    // deals and the trades. Ethan, 2026-08-30: *"it should also be a cutscene using the
    // same system as the deals or trades."*
    //
    // 🔴 WHY THE OLD VERSION FIRED HALF AN INTRO. It scheduled EIGHTEEN separate
    // `scheduleInTicks` callbacks, one per beat, spread over ~90 seconds. Every one of
    // those dies with the server - so any restart, and the player got the first few
    // beats of their origin story and then silence. Worse, K_SEEN is stamped BEFORE the
    // first beat (correctly - a disconnect must not replay it), so a truncated run is
    // never retried. Half an intro, once, forever.
    //
    // 🔑 ritual.begin owns the whole sequence as ONE scene: it holds the dark, paces the
    // lines itself, and releases at the end. One unit that either runs or does not,
    // instead of eighteen independent timers each able to vanish on their own.
    //
    // ⚠️ NO OPTIONS AND NO onChoose. Every other consumer of this primitive asks a
    // question; the Opening asks nothing. It is a montage, and the player is remembering,
    // not choosing - so it takes the lines and the dark and none of the machinery.
    // ⭐⭐ ONE BLOCK, ONE SEND. There is no step loop any more, deliberately - see
    // opening_lines.js. Every multi-step shape fades and rewrites because the mod shows
    // one message at a time, so a second message always replaces the first.
    var okd = false
    try {
      okd = VELDORA.ritual.begin(p, {
        lines: beats,
        // ⭐ TOP_LEFT with align 0, so each new line starts under the last one and the
        // entry writes DOWN the page. Centred text re-centres every line as the page
        // grows, which reads as drifting rather than as something being written.
        anchor: 'TOP_LEFT',
        align: 0,
        x: 20,
        // ⚠️ CLEAR OF THE SEASONS HUD. Serene Seasons draws "Spring, Day 7" at the top
        // left and the entry was landing straight through it.
        // ⚠️ 30 -> 60 -> 110. Serene Seasons draws "Spring, Day 7" at the top left and
        // the entry kept landing through it; 60 was still not clear of it in play. This
        // sits below the HUD line entirely.
        y: 110,
        // Keep the newlines - one line per sentence is the whole point.
        // (newlines proved not to render - see the note above)
        // ⭐ TYPED, ALWAYS. The standing rule above. It was only ever turned off to stop
        // an accumulating page re-typing itself, and there is no accumulation now.
        typewriter: true,
        // Each line gets time from its OWN length, so nothing is cut off mid-word.
        perChar: true,
        // ⛔ NOT IN CHAT. Twenty-two lines in chat is a wall scrolling under the cutscene.
        noChat: true,
        // ⭐ NO COLOUR - this is the player's own voice; a tint would attribute it to a god.
        colour: null,
        // ⚠️ Each step must OUTLIVE the next one arriving, or a line blinks out before its
        // successor lands and the page flickers instead of filling.
        // One line, so the gap never elapses - but the SCENE must outlast the typing, and
        // ritual sizes the hold from the gap. Give it the whole entry's length.
        // ⚠️ Unused when perChar is on - ritual times each line from its own length so a
        // long sentence is never cut off by a short one's clock.
        gap: LINE_GAP,
        // ⭐ THE TITLE AS AN ANNOUNCEMENT. Ethan: *"arkhdottir new blood should play across
        // the middle of the screen like an announcement."* Centre, large, alone, after the
        // prose has finished - not a tail on the last paragraph. Fanfare and a font hang
        // off this same call when he wants them.
        // ⭐ THE TITLE CARD USES `popup`, not an overlay. Measured in play: it is the ONLY
        // command route that renders two lines - gold underlined title, subtitle beneath,
        // in a background box. Exactly the announcement Ethan asked for, and it needs no
        // NBT at all. Fanfare hangs off this same call when he wants it.
        finale: {
          popup: true,
          title: 'ARKHDOTTIR: NEW BLOOD',
          subtitle: 'A story written by Rehykt',
          seconds: 9,
          after: 40,
        },
      })
    } catch (e) { console.warn(TAG + 'ritual.begin threw :: ' + e) }

    // 🚨 A REFUSED SCENE MUST NOT COUNT AS SEEN. ritual.begin refuses if the player is
    // already inside another ritual, and K_SEEN was stamped above - so leaving it set
    // would burn the only showing on a scene that never played.
    if (!okd) {
      try { p.persistentData.putBoolean(K_SEEN, false) } catch (e) { }
      console.warn(TAG + p.username + ' - ritual refused the opening; NOT marked seen, ' +
        'it will retry on the next login')
      return 'refused'
    }

    console.info(TAG + p.username + ' - opening, ' + beats.length +
      ' beats as ONE ritual cutscene' + (forced ? ' (forced)' : ''))
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
    reset: function (p) {
      try {
        p.persistentData.putBoolean(K_SEEN, false)
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
    var beats = L.build().length
    console.info(TAG + beats + ' beats. Fires ' +
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
          p.tell(Text.of('§8seen: §f' + seen(p) + '§8 · beats: §f' +
            (L ? L.build().length : '?')))
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
