// tan.js — Tough As Nails, gated and reachable from Veldora's own systems.
//
// Ethan, 2026-08-29: *"No one wanted this, they don't have a choice. We have alot of
// food in the game with 0 reason to exist. This gives it that."*
//
// ── ⭐ WHAT THIS FILE IS FOR ───────────────────────────────────────────────────
// TAN's own config is the real switch. This is the layer ABOVE it: one place that
// reports what is actually on, one place that reads a player's thirst, and the admin
// commands to drive it — so a change can be tested in-server rather than by restarting
// with a different toml and guessing.
//
// ── 🚨 THE FINDING THAT DECIDED TEMPERATURE ───────────────────────────────────
// **The pack already had a temperature system, and nobody noticed.**
//
//     frostiful-2.3.3          cold
//     scorchful-0.15.2         heat
//     thermoo-4.8.1            the shared library both are built on
//
// All three were installed and pinned long before Tough As Nails arrived. TAN's
// temperature is not an addition to that, it is a SECOND, INDEPENDENT one: two bars,
// two damage sources, two sets of gear requirements, and no interaction between them.
//
// ⚠️ SO `enable_temperature` IS OFF, and it is off for REDUNDANCY rather than for
// difficulty. Ethan said "do all", and the machinery is all here — the flag is one line
// in `config/toughasnails/temperature.toml` and `/tan` will tell you the moment both are
// live. ⭐ Turn it on and you will SEE two bars; that is the argument, not this comment.
//
// 🔑 THIRST HAS NO SUCH RIVAL. Nothing else in 320 mods provides it, it is the half that
// answers his actual reason (food with no purpose), and it stays ON.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[tan] '
  var GATE = true

  // ⭐ READ OUT OF THE JAR, NOT GUESSED. From
  // toughasnails/api/thirst/ThirstHelper.class:
  //     public static IThirst getThirst(Player)
  //     public static boolean isThirstEnabled()
  // and IThirst carries getThirst/setThirst/addThirst/getHydration/setHydration/drink.
  var HELPER = 'toughasnails.api.thirst.ThirstHelper'

  var loaded = null          // null = not yet determined
  var warned = false

  function helper() {
    try { return Java.loadClass(HELPER) } catch (e) { return null }
  }

  // ⚠️ Returns null when TAN is absent or unreadable - NEVER 0. A thirst of zero is a
  // dying player; "I could not read it" is a different fact and callers must be able to
  // tell them apart.
  function thirstOf(p) {
    try {
      var H = helper()
      if (!H) {
        if (!warned) {
          warned = true
          console.warn(TAG + 'ToughAsNails is NOT loaded - every thirst read returns ' +
            'null. This is a FAILURE, not a player who is hydrated.')
        }
        return null
      }
      var t = H.getThirst(p)
      if (!t) return null
      return { thirst: t.getThirst(), hydration: t.getHydration(), obj: t }
    } catch (e) {
      if (!warned) {
        warned = true
        console.warn(TAG + 'the thirst API threw - reads return null :: ' + e)
      }
      return null
    }
  }

  // Returns the new level, or null if it could not be applied. ⚠️ Verified by RE-READING
  // rather than trusted: a setter that silently no-ops would otherwise let Salvage take
  // a price she never collected, which is the exact bug her deal code guards against.
  function setThirst(p, n) {
    var cur = thirstOf(p)
    if (!cur) return null
    try {
      cur.obj.setThirst(n)
      var after = thirstOf(p)
      return after ? after.thirst : null
    } catch (e) { return null }
  }

  function drain(p) { return setThirst(p, 0) }

  function enabled() {
    try {
      var H = helper()
      if (!H) return null
      return H.isThirstEnabled() === true
    } catch (e) { return null }
  }

  // 🚨 THE DOUBLE-TEMPERATURE CHECK. If somebody turns TAN's temperature on while
  // frostiful/scorchful are installed, this is the only place that will say so.
  function thermooPresent() {
    try { Java.loadClass('com.github.thedeathlycow.thermoo.api.temperature.TemperatureAware'); return true }
    catch (e) { }
    try { Java.loadClass('com.github.thedeathlycow.thermoo.api.ThermooAttributes'); return true }
    catch (e) { }
    return null                     // could not tell
  }

  VELDORA.tan = {
    thirstOf: thirstOf,
    setThirst: setThirst,
    drain: drain,
    enabled: enabled,
    present: function () { return helper() !== null },
    enabledGate: function () { return GATE },
  }

  ServerEvents.loaded(function () {
    var have = helper() !== null
    loaded = have
    if (!have) {
      console.warn(TAG + 'ToughAsNails is NOT on the classpath. Nothing here will do ' +
        'anything, and Salvage will silently skip her thirst deal.')
      return
    }
    var en = enabled()
    console.info(TAG + 'live - thirst is ' + (en === null ? 'UNREADABLE' : (en ? 'ON' : 'OFF')) +
      '. Salvage can take it as a price; `/tan` reports and `/tan set <n>` drives it.')

    // ⭐ The warning that only fires when it is true.
    var th = thermooPresent()
    if (th === true) {
      console.info(TAG + 'thermoo IS present (frostiful + scorchful). TAN temperature ' +
        'must stay OFF or the server runs TWO independent temperature systems - two ' +
        'bars, two damage sources, no interaction. Check ' +
        'config/toughasnails/temperature.toml if anything looks doubled.')
    }
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    try {
      event.register(Commands.literal('tan')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .then(Commands.literal('set')
          .then(Commands.argument('n', event.arguments.INTEGER.create(event))
            .executes(function (ctx) {
              var p = ctx.source.player
              if (!p) return 0
              var n = 20
              try { n = ctx.getArgument('n', Java.loadClass('java.lang.Integer')) } catch (e) { }
              var got = setThirst(p, n)
              p.tell(Text.of('§8thirst -> §f' + (got === null ? 'FAILED (TAN unreadable)' : got)))
              return 1
            })))
        .then(Commands.literal('drain').executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var got = drain(p)
          p.tell(Text.of('§8drained -> §f' + (got === null ? 'FAILED' : got)))
          return 1
        }))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var t = thirstOf(p)
          p.tell(Text.of('§8TAN present: §f' + (helper() !== null)))
          p.tell(Text.of('§8thirst enabled: §f' + enabled()))
          p.tell(Text.of('§8your thirst: §f' +
            (t === null ? 'UNREADABLE' : t.thirst + '/20, hydration ' + t.hydration)))
          p.tell(Text.of('§8thermoo (frostiful/scorchful) present: §f' + thermooPresent()))
          p.tell(Text.of('§8§o if TAN temperature is also on, you are running two systems'))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
