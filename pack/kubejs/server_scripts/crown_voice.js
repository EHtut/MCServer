// crown_voice.js - The False King's lines + trust tiers.
//
// ⚠️ GENERATED SKELETON (tools/new_god.py). The STRUCTURE is correct and carries
// the invariants from docs/41 §3; the WRITING is not here yet. Every pool below is
// empty and marked TODO(ethan), and the boot log says so out loud.
//
// Trust is the COUNTER (counters.js). This god counts: errands completed.
//
// Read docs/41-BUILDING-A-GOD.md before editing. Read docs/40-BLADE-THE-WARRIOR.md
// for a finished example of every pattern used here.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[crown] '
  var GOD = 'crown'
  var COLOUR = '§5§l'

  // Thresholds on: errands completed.
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
    // TODO(ethan): handing you something, at low trust
    low_gift: [],
    // TODO(ethan): handing you something, at medium trust
    medium_gift: [],
    // TODO(ethan): handing you something, at high trust
    high_gift: [],
    // TODO(ethan): you did well and it is barely acknowledged
    low_silence: [],
    // TODO(ethan): you did well
    medium_silence: [],
    // TODO(ethan): you did well and it is the rarest praise in the game
    high_silence: [],
    // TODO(ethan): idle, above ground
    loc_above: [],
    // TODO(ethan): idle, underground
    loc_below: [],
    // TODO(ethan): RARE - where the god is a person, not a function
    rare_loc_above: [],
    // TODO(ethan): idle, while fighting
    combat: [],
    // TODO(ethan): idle, holding a weapon
    hold_weapon: [],
    // TODO(ethan): idle, holding food
    hold_food: [],
    // TODO(ethan): you beat what it sent
    harvest_won: [],
    // TODO(ethan): it beat you
    harvest_lost: [],
  }

  VELDORA.crown = {
    tier: tierOf,
    colour: COLOUR,
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
    event.register(Commands.literal('crown').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var t = tierOf(p)
      var n = null
      try { if (VELDORA.counter) n = VELDORA.counter.get(p, GOD) } catch (e) { }
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7The False King §8- counter §f' + (n === null ? 'UNREADABLE' : n) +
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
    var total = 0
    var written = 0
    var empty = []
    for (var k in LINES) {
      if (!LINES.hasOwnProperty(k)) continue
      total++
      if (LINES[k].length) {
        written++
        VELDORA.voice.registerLines(GOD, k, LINES[k])
      } else empty.push(k)
    }
    // 🚨 AN UNWRITTEN GOD IS LOUD, NOT SILENT. "loaded fine" and "has anything to
    // say" are different claims, and a subsystem that is configured on and produces
    // nothing is the failure mode this project keeps paying for.
    if (!written) {
      console.error(TAG + '0 of ' + total + ' pools written - THIS GOD HAS NO VOICE YET')
    } else if (empty.length) {
      console.warn(TAG + written + ' of ' + total + ' pools written. Still empty: ' +
        empty.join(', '))
    } else {
      console.info(TAG + 'The False King speaks - all ' + total + ' pools written. ' +
        'Tiers at ' + MEDIUM_AT + '/' + HIGH_AT + '.')
    }
  })
})();
