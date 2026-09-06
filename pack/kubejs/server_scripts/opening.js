// opening.js - the journal, and the title card. NOT a cutscene any more.
//
// Ethan's words are `docs/dialogue/Player intros.txt` -> opening_lines.js (generated).
// The design is `docs/ACT0.md`.
//
// ── 🔴 THE CUTSCENE IS GONE. Ethan, 2026-09-05 ──────────────────────────────
//     "we spent 4 days attempting to fix it and it failed. Instead when you boot in you
//      are hit with nothing at all, all of the introduction cutscene stuff is in a book
//      in your inventory titled journal... The only thing you see is the words typing
//      out 'Arkhdottir: New Blood. A story written by Rehykt'."
//
// So this file now does exactly two things, one minute after a player's first join:
//     1. gives them a written book titled Journal, holding the eighteen sentences
//     2. types the title card, and nothing else
//
// ⭐⭐ AND THE BOOK IS THE SURFACE HIS HARD RULE ACTUALLY WORKS ON. "Every sentence is on
// a new line" was never achievable on the overlay: one command renders ONE line, an
// escaped newline prints literally, and a REAL newline dropped a player's connection with
// a Network Protocol Error. Four days of trying to make eighteen lines behave on a surface
// that renders one. A book page takes real newlines - so the rule that could not be
// honoured for four days is honoured for free by changing the surface.
//
// ⚠️ THE CUTSCENE MACHINERY IS NOT COMMENTED OUT, IT IS DELETED. A dormant path that still
// looks callable is how the wrong one gets fixed at two in the morning. `ritual.js` keeps
// every other consumer; the Opening simply is not one of them any more.
//
// ── 🚨 SHE NEVER SPEAKS, AND THAT IS LOAD-BEARING ───────────────────────────
// "She spoke no words. Made no sounds." The doctor is Alice; a name is the most expensive
// word in the game and Alice is never printed. Because she has no dialogue anywhere in the
// opening, there is nothing to leak - the reveal survives without anything guarding it.
// ⛔ Do not give her a line. Do not add a callback when the player later meets the Doctor
// in the dark. The connection is the reward for paying attention.
//
// ⭐ ONCE PER WORLD, for free: `persistentData` lives in the player's save data, so a new
// world is a new player. `/opening reset` re-arms it; `/opening journal` re-gives the book.
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
  // ⏱️ ONE MINUTE, not the old five-to-ten. That window existed because a 96-second
  // CUTSCENE landing in the join-noise is a cutscene nobody reads. There is no cutscene
  // now - just a title card - and a title card wants to be the opening frame, not
  // something that arrives ten minutes into play.
  //
  // ⚠️ Still not immediate: Ethan, 2026-08-15, on the scene this replaces - *"the intro
  // needs to be a minute after joining to allow for actually loading in."* On a 315-mod
  // pack the client is still streaming chunks for most of the first minute.
  var DELAY_MIN = 20 * 55
  var DELAY_MAX = 20 * 70

  // ── the card ───────────────────────────────────────────────────────────────
  // ⚠️ RULED 2026-09-05: the title stays "ARKHDOTTIR: NEW BLOOD", the spelling that has
  // shipped since 08-30. Three variants were in play - NEW BLOOD, New Bloods, New Gods -
  // and Ethan picked this one, so it is written down once, here, and read from here.
  var TITLE = 'ARKHDOTTIR: NEW BLOOD'
  var BYLINE = 'A story written by Rehykt'
  var TITLE_SECONDS = 6
  var BYLINE_SECONDS = 6

  // 🔴 -70, AND THE NUMBER IS NOT FREE. From a CENTER anchor the crosshair owns -34..34
  // and the vanilla biome title owns -53..-11, so dead centre is unreadable and just
  // above centre collides with Traveler's Titles. -70 clears both. See VOICES.md §3.
  // NEEDS-GAME: the card is legible, clear of the Seasons HUD and the crosshair :: /opening reset then relog
  var TITLE_Y = -70


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

    // 🚨 STAMPED BEFORE ANYTHING IS SENT, not after. A player who logs out mid-sequence
    // must not get their origin again on the next login.
    try { p.persistentData.putBoolean(K_SEEN, true) } catch (e) { }

    // ⭐⭐ THE JOURNAL. Ethan, 2026-09-05, after four days of trying to make the cutscene
    // work: *"when you boot in you are hit with nothing at all, all of the introduction
    // cutscene stuff is in a book in your inventory titled journal."*
    //
    // 🔑 AND THE BOOK IS THE ONE SURFACE HIS HARD RULE ACTUALLY RENDERS ON. "Every sentence
    // is on a new line" was never achievable on the overlay - one command renders one line,
    // an escaped newline prints literally, and a real one dropped a player's connection.
    // A book page takes real newlines, so the eighteen sentences finally sit as eighteen
    // lines the way they were written.
    var gave = giveJournal(srv, p, beats)

    // ⭐ THE ONLY THING ON SCREEN. *"The only thing you see is the words typing out."*
    //
    // ⚠️ TYPED MEANS THE OVERLAY ROUTE, NOT `popup`. The popup card carries NO NBT at all -
    // immersive.js calls it a preset, take it or leave it - so it cannot type. Two typed
    // overlay sends instead, which QUEUE rather than replace (see screen.js), so the byline
    // lands after the title finishes rather than over it.
    titleCard(p)

    // ⭐ THE FIRST BEAT OF THE PLOT LEDGER. Ethan, 2026-09-05: *"there should be an
    // achievement for everything plot related."* The journal arriving IS "Introductions",
    // so it is granted here rather than on a timer - the beat and its record fire together
    // or the ledger starts lying immediately.
    try { if (VELDORA.story) VELDORA.story.reach(p, 'introductions') } catch (e) { }

    console.info(TAG + p.username + ' - journal given (' + (gave ? 'ok' : 'FAILED') +
      '), ' + beats.length + ' sentences, title card typed' + (forced ? ' (forced)' : ''))
    return 'played'
  }

  // ── the journal ────────────────────────────────────────────────────────────
  // ⚠️ MC 1.21.1: a written book is COMPONENTS, not NBT. `written_book_content` takes
  // `pages` as a list of text components; a bare JSON string is a valid one, so each page
  // is a quoted string and nothing has to build a component tree.
  //
  // 🔴 THIS IS THE ONE PART OF THIS FILE THAT HAS NOT RUN AGAINST A LIVE SERVER. Everything
  // else here is exercised by the harness and the emulator; a `give` with a component
  // argument can only be proved in game.
  // NEEDS-GAME: the journal actually appears in the inventory, titled Journal, readable :: /opening journal
  // ⚠️ TWO LAYERS OF QUOTING, and they are easy to get backwards. Each page is a JSON text
  // component (double quotes) living inside an SNBT single-quoted string, inside a command.
  // A backslash must survive as a backslash, a double quote must be escaped for the JSON
  // layer, and a real newline has to become the two characters backslash-n. Get any of it
  // wrong and the command silently fails to parse: no book, and nothing in the log.
  var BS = String.fromCharCode(92)
  function esc(t) {
    var src = String(t), out = ''
    for (var i = 0; i < src.length; i++) {
      var ch = src.charAt(i)
      // THREE LAYERS, NOT TWO, AND THIS LINE ONLY COUNTED TWO. The comment above got the
      // JSON layer right and forgot that SNBT strips a backslash FIRST. A single
      // backslash-n is an INVALID SNBT ESCAPE, so the whole command fails to parse, the
      // give never runs, and nothing is logged. Ethan got no journal at all.
      //
      // PROVED AGAINST THE LIVE SERVER - same command otherwise, three page forms:
      //     'alpha'                      PARSES
      //     'alpha\nbravo'   (one backslash)    FAILS TO PARSE
      //     'alpha\\nbravo'  (two backslashes)   PARSES
      //
      // So the command must carry TWO backslashes: SNBT eats one, JSON turns the
      // survivor into a real newline, and the book renders the line break.
      if (ch === '\n') { out += BS + BS + 'n'; continue }
      if (ch === BS || ch === '"') out += BS
      out += ch
    }
    return out
  }

  // ⭐ PAGES ARE PACKED BY ESTIMATED HEIGHT, not by a fixed count. A book page holds about
  // 14 lines of ~19 characters; his sentences run from 15 to 87 characters, so three per
  // page overflows on the long ones and wastes half a page on the short ones.
  var PAGE_LINES = 14, PAGE_WIDTH = 19
  function paginate(lines) {
    var pages = [], cur = [], used = 0
    for (var i = 0; i < lines.length; i++) {
      var t = String(lines[i])
      var h = Math.ceil(t.length / PAGE_WIDTH) + 1      // +1 for the blank line after
      if (used + h > PAGE_LINES && cur.length) { pages.push(cur); cur = []; used = 0 }
      cur.push(t); used += h
    }
    if (cur.length) pages.push(cur)
    return pages
  }

  function giveJournal(srv, p, lines) {
    try {
      var pages = paginate(lines)
      var parts = []
      for (var i = 0; i < pages.length; i++) {
        // Real newlines, which a book renders and the overlay never could.
        parts.push("'\"" + esc(pages[i].join('\n\n')) + "\"'")
      }
      var cmd = 'give ' + p.username + ' written_book[written_book_content={' +
        'title:"Journal",author:"Rehykt",resolved:true,pages:[' + parts.join(',') + ']}] 1'
      // AND THE RESULT IS READ. This returned `true` for anything that did not throw, so a
      // command that failed to parse logged "journal given (ok)" - the exact shape this
      // project bans: "I failed" and "I found nothing" sharing a return value. It printed
      // ok on every one of Ethan's logins while he was getting no book at all.
      var r = srv.runCommandSilent(cmd)
      if (!r) {
        console.error(TAG + 'the give was REFUSED - the journal did NOT arrive. ' +
          pages.length + ' page(s), command length ' + cmd.length + '.')
        return false
      }
      return true
    } catch (e) {
      console.error(TAG + 'the journal could not be given :: ' + e)
      return false
    }
  }

  // ── the title card ─────────────────────────────────────────────────────────
  function titleCard(p) {
    try {
      if (!VELDORA.im || typeof VELDORA.im.show !== 'function') {
        console.error(TAG + 'immersive.js is not loaded - the title card cannot be sent')
        return false
      }
      var common = { anchor: 'CENTER_CENTER', typewriter: 1.0, priority: 'ANNOUNCE' }
      VELDORA.im.show(p, TITLE, {
        seconds: TITLE_SECONDS, size: 1.9, y: TITLE_Y,
        anchor: common.anchor, typewriter: common.typewriter, priority: common.priority,
      })
      // ⛔ NO FONT ON EITHER LINE. One was wired on 2026-09-06 and removed the same
      // hour: Ethan asked for a font, I could only offer a GOD'S font, and Act 0 has no
      // gods by design. He agreed the objection was the right one. ⚠️ A bespoke
      // veldora:title.ttf is the real answer and needs a client build, not a constant.
      VELDORA.im.show(p, BYLINE, {
        seconds: BYLINE_SECONDS, size: 1.1, y: TITLE_Y,
        anchor: common.anchor, typewriter: common.typewriter, priority: common.priority,
      })
      return true
    } catch (e) { console.warn(TAG + 'the title card threw :: ' + e); return false }
  }

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
    journal: giveJournal,
    paginate: paginate,
    title: function () { return [TITLE, BYLINE] },
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
      // ⭐ `/opening journal` EXISTS BECAUSE THE GIVE CANNOT BE UNIT-TESTED. Everything
      // else in this file is covered by opening_harness; a `give` with a component
      // argument is only ever proved in game, so there is a one-word way to prove it.
      root = root.then(Commands.literal('journal').executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        var L = lines()
        if (!L) { p.tell(Text.of('§cno lines - run the importer')); return 0 }
        var ok = giveJournal(p.server, p, L.build())
        p.tell(Text.of(ok ? '§7journal given.' : '§cthe give FAILED - see the server log'))
        return ok ? 1 : 0
      }))

      root = root.then(Commands.literal('reset').executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        VELDORA.opening.reset(p)
        p.tell(Text.of('§7forgotten. The journal and the card fire again about a minute ' +
          'after your next login.'))
        return 1
      }))
      event.register(root)
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
