// slain.js — a lifetime kill count that nothing may ever reset.
//
// Ethan, 2026-08-29:
//     "for chosen, i want to make that honestly harder to accomplish we can probably
//      change it to mobs slain because tetra is too good to pass up."
//
// ── 🔑 WHY THIS EXISTS AS ITS OWN FILE ─────────────────────────────────────────
// Blade already has a kill counter. It is his TRUST counter, and `docs/67` flags the
// trap plainly: *"Blade's live counter is his trust counter and may be reset, decayed
// or scoped per-Trial. A chosen condition needs a lifetime, never-reset tally."*
//
// 🚨 CONFIRMED, NOT ASSUMED. `counters.js` line 219 zeroes every patron counter on
// `/counters clear`, and `setTo` can put any of them anywhere. Borrowing it would make
// a 500-kill condition **unreachable with no error at all** - the player would grind,
// an admin would zero a counter for an unrelated reason, and the door would quietly
// move further away. That is precisely the class of failure this project keeps paying
// for, so the tally gets its own key and its own file.
//
// ── ⛔ THE ONE RULE ────────────────────────────────────────────────────────────
// NOTHING RESETS THIS. There is no clear, no decay, no per-Trial scope, and no admin
// zero. `/slain set` exists for testing and can only be used to move a number that is
// already meaningless on a test account - it is deliberately NOT wired to any sweep,
// any Trial, or `/counters clear`.
//
// ⚠️ If you are about to add a reset here, the condition it guards becomes unreachable
// and nobody will notice for weeks. Add a second, resettable counter instead.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[slain] '
  var GATE = true

  // ⭐ 500. Ethan: *"i want to make that honestly harder to accomplish."* His number,
  // and `docs/67` records the reasoning: **"you already fight. He takes the proven."**
  // Blade is the only god who notices you for being capable, and it has to be a number
  // you reach by playing rather than by preparing.
  var BLADE_CHOSEN = 500

  // ⚠️ ITS OWN KEY. Not `veldora_counter_blade`, not anything counters.js touches.
  var K = 'veldora_lifetime_slain'

  function count(p) {
    try {
      var v = p.persistentData.getInt(K)
      return (typeof v === 'number' && isFinite(v) && v > 0) ? v : 0
    } catch (e) { return 0 }
  }

  function add(p, n) {
    if (!GATE || !p) return 0
    var k = (typeof n === 'number' && isFinite(n)) ? Math.floor(n) : 1
    if (k <= 0) return count(p)
    var now = count(p) + k
    try { p.persistentData.putInt(K, now) } catch (e) { return count(p) }

    // Announce the crossing exactly once, in the log. The player is told by the offer
    // itself - chosen.js owns that moment and this must not pre-empt it.
    if (now >= BLADE_CHOSEN && (now - k) < BLADE_CHOSEN) {
      console.info(TAG + p.username + ' has slain ' + now + ' - THE THRESHOLD IS ' +
        'CROSSED. Blade notices on the next sweep.')
    }
    return now
  }

  // ⚠️ Set, not add, and it is for a test account. There is no `clear`, on purpose -
  // see the header. Setting is how a tester reaches 499 without killing 499 things.
  function setTo(p, n) {
    if (!p) return 0
    var k = (typeof n === 'number' && isFinite(n) && n > 0) ? Math.floor(n) : 0
    try { p.persistentData.putInt(K, k) } catch (e) { }
    return count(p)
  }

  VELDORA.slain = {
    count: count,
    add: add,
    setTo: setTo,
    threshold: BLADE_CHOSEN,
    // TRUE when this player has answered Blade's condition. Read by chosen.js.
    qualifies: function (p) { return count(p) >= BLADE_CHOSEN },
    remaining: function (p) {
      var r = BLADE_CHOSEN - count(p)
      return r > 0 ? r : 0
    },
    enabled: function () { return GATE },
  }

  ServerEvents.loaded(function () {
    console.info(TAG + 'the lifetime kill tally is live - key "' + K + '", threshold ' +
      BLADE_CHOSEN + ' for Blade. NOTHING resets it: no decay, no per-Trial scope, and ' +
      '`/counters clear` does not reach it.')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    try {
      event.register(Commands.literal('slain')
        .then(Commands.literal('set')
          .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
          .then(Commands.argument('n', event.arguments.INTEGER.create(event))
            .executes(function (ctx) {
              var p = ctx.source.player
              if (!p) return 0
              var n = 0
              try { n = ctx.getArgument('n', Java.loadClass('java.lang.Integer')) } catch (e) { }
              var now = setTo(p, n)
              p.tell(Text.of('§8lifetime slain set to §f' + now +
                '§8 (' + VELDORA.slain.remaining(p) + ' to go)'))
              return 1
            })))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var c = count(p)
          p.tell(Text.of('§8lifetime slain: §f' + c + '§8 / ' + BLADE_CHOSEN +
            (c >= BLADE_CHOSEN ? ' §a- he has seen enough' : '§8 - ' +
              VELDORA.slain.remaining(p) + ' to go')))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
