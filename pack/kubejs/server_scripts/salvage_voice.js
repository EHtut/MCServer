// salvage_voice.js - The Hound's lines + trust tiers.
//
// ⚠️ ETHAN WRITES THESE. Claude wrote a full set on 2026-08-15 and they were cut:
// "the lines you write are usually obviously ai generated. You only do code unless
// I ask you to bulk lines." The TAGS and the comments are the brief; the arrays are
// his. Same list as a fill-in sheet: docs/44-SALVAGE-LINES.md
//
// A placeholder line is worse than an empty pool - it anchors the writing and gets
// mistaken for content later. Empty is honest, and the boot log shouts about it.
//
// ⚠️ GENERATED SKELETON (tools/new_god.py). The STRUCTURE is correct and carries
// the invariants from docs/41 §3; the WRITING is not here yet. Every pool below is
// empty and marked TODO(ethan), and the boot log says so out loud.
//
// Trust is the COUNTER (counters.js). This god counts: harness - deals struck.
//
// Read docs/41-BUILDING-A-GOD.md before editing. Read docs/40-BLADE-THE-WARRIOR.md
// for a finished example of every pattern used here.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[salvage] '
  var GOD = 'salvage'
  var COLOUR = '§6§l'

  // Thresholds on: harness - deals struck.
  // ⚠️ A FIRST GUESS, and meant to be. Replace with a measured curve once there is
  // play data - do not argue about these numbers, measure them.
  var MEDIUM_AT = 5
  var HIGH_AT = 20

  // 🚨 UNREADABLE IS NOT 'low'. A god who cannot read his own counter must say
  // NOTHING. Defaulting to the low tier turns every storage hiccup into contempt,
  // which is docs/41 invariant #4 and the most expensive one on the list.
  function tierOf(player) {
    var n = null
    try { if (VELDORA.counter) n = VELDORA.counter.get(player, GOD) } catch (e) { }
    if (n === null) return null
    if (n >= HIGH_AT) return 'high'
    if (n >= MEDIUM_AT) return 'medium'
    return 'low'
  }

  // ── the lines ──────────────────────────────────────────────────────────────
  // A `rare_<tag>` pool is rolled by idle.js at 15% BEFORE its common twin. Put the
  // lines where this god is a person in there, and nowhere else.
  var LINES = {
    low_gift: [],
    medium_gift: [],
    high_gift: [],
    low_silence: [],
    medium_silence: [],
    high_silence: [],
    deal_open: [],
    deal_done: [],
    deal_refused: [],
    deal_poor: [],
    harvest_won: [],
    harvest_lost: [],
    combat: [],
    hold_weapon: [],
    hold_food: [],
    returned: [],
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FRAGS - the combinatorial layer.  opens x closes
  // ═══════════════════════════════════════════════════════════════════════════
  // ⚠️ voice.js joins `open + ' ' + close` and picks each half INDEPENDENTLY, so
  // every close must read after EVERY open in its pool. Hers get away with more
  // than most: a dealer's second sentence is usually a deflection, and a deflection
  // fits after anything.
  var FRAGS = {
    lore: {
      opens: [],
      closes: [],
    },
    blade: {
      opens: [],
      closes: [],
    },
    wall: {
      opens: [],
      closes: [],
    },
    forge: {
      opens: [],
      closes: [],
    },
    art: {
      opens: [],
      closes: [],
    },
    push: {
      opens: [],
      closes: [],
    },
    idling: {
      opens: [],
      closes: [],
    },
    guidance: {
      opens: [],
      closes: [],
    },
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT - what she says about where you are standing
  // ═══════════════════════════════════════════════════════════════════════════
  var CONTEXT = {
    loc_above: [],
    loc_below: [],
    rare_loc_above: [],
    rare_loc_below: [],
    near_blade: [],
    near_wall: [],
    near_salvage: [],
  }

  // 🚨 COUNTED AT SCRIPT-EVAL TIME, NOT INSIDE ServerEvents.loaded.
  //
  // <god>_events.js has to know whether this god has a voice before it registers
  // anything - and BOTH files do their work in `loaded`, which fires in SCRIPT LOAD
  // ORDER. `<god>_events.js` sorts before `<god>_voice.js`, so the events file asked
  // the voice registry a question the voice file had not answered yet, and every god
  // booted HELD while simultaneously reporting all pools written.
  //
  // Publishing the count at eval time removes the race entirely: this runs when the
  // file is READ, long before any loaded handler.
  var WRITTEN = 0
  var POOL_COUNT = 0
  for (var _k in LINES) {
    if (!LINES.hasOwnProperty(_k)) continue
    POOL_COUNT++
    if (LINES[_k].length) WRITTEN++
  }
  for (var _f in FRAGS) {
    if (!FRAGS.hasOwnProperty(_f)) continue
    POOL_COUNT++
    if (FRAGS[_f].opens.length && FRAGS[_f].closes.length) WRITTEN++
  }
  for (var _c in CONTEXT) {
    if (!CONTEXT.hasOwnProperty(_c)) continue
    POOL_COUNT++
    if (CONTEXT[_c].length) WRITTEN++
  }

  VELDORA.salvage = {
    tier: tierOf,
    colour: COLOUR,
    written: WRITTEN,
    pools: POOL_COUNT,
    // Speak whatever this tier calls for. Returns false if there is nothing - which
    // is a legitimate answer, not a failure.
    speak: function (player, kind) {
      var t = tierOf(player)
      if (!t) return false
      if (!VELDORA.voice) return false
      return VELDORA.voice.say(player, GOD, t + '_' + kind)
    },
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('salvage').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var t = tierOf(p)
      var n = null
      try { if (VELDORA.counter) n = VELDORA.counter.get(p, GOD) } catch (e) { }
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7The Hound §8- counter §f' + (n === null ? 'UNREADABLE' : n) +
        '§8, tier §f' + (t || 'UNREADABLE')))
      return 1
    }))
  })

  // ⚠️ TAKE THE `event` PARAMETER. Omitting it makes `event.server` throw a
  // ReferenceError that KubeJS logs WITHOUT a level - invisible to `logq errors`
  // until that tool was repaired on 2026-08-15. docs/41 invariant #13.
  ServerEvents.loaded(function (event) {
    if (!VELDORA.voice) { console.error(TAG + 'voice.js missing'); return }
    VELDORA.voice.setColour(GOD, COLOUR)
    var n = 0, tags = 0
    for (var k in LINES) {
      if (!LINES.hasOwnProperty(k)) continue
      if (VELDORA.voice.registerLines(GOD, k, LINES[k])) { n += LINES[k].length; tags++ }
    }
    var combo = 0
    for (var fr in FRAGS) {
      if (!FRAGS.hasOwnProperty(fr)) continue
      if (VELDORA.voice.register(GOD, fr, FRAGS[fr].opens, FRAGS[fr].closes)) {
        combo += FRAGS[fr].opens.length * FRAGS[fr].closes.length
        tags++
      }
    }
    var ctxn = 0
    for (var c in CONTEXT) {
      if (!CONTEXT.hasOwnProperty(c)) continue
      if (VELDORA.voice.registerLines(GOD, c, CONTEXT[c])) { ctxn += CONTEXT[c].length; tags++ }
    }
    if (!n && !combo && !ctxn) {
      console.error(TAG + 'THE HOUND HAS NO VOICE - every pool is empty')
    } else {
      console.info(TAG + 'The Hound speaks - ' + n + ' fixed + ' + ctxn +
        ' contextual + ' + combo + ' combinatorial, across ' + tags +
        ' tags. Harness tiers at ' + MEDIUM_AT + '/' + HIGH_AT + ' deals.')
    }
  })
})();
