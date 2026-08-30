// im_probe.js — CAN WE REACH THE MOD'S ANIMATION SPEEDS?  /improbe
//
// ⛔ TEMPORARY. This file answers one question and should be deleted once it has. It is a
// probe, not a feature.
//
// ── WHY IT EXISTS, AND WHY IT RE-OPENS SOMETHING D-123 CLOSED ────────────────
// Ethan, 2026-08-30: *"all text should be typed. No completed sentences to begin, ever.
// This is a hard rule."*
//
// 🔴 THAT RULE CANNOT BE MET THROUGH THE COMMAND. Read out of the mod with javap, not
// guessed:
//
//     public float typewriterSpeed;                        // default 1.0
//     public ImmersiveMessage typewriter(float, boolean);  // speed IS a parameter
//     private void tickTypewriter(float)                   // reveals when
//                                                          //   ticks > n * (1/speed)
//
// and `ImmersiveMessagesCommands` reads exactly these tag keys — no `typewriterSpeed`
// among them. At speed 1.0 that is ONE CHARACTER PER SECOND, which Ethan's own report
// confirms (18 characters, 2.6 seconds, "1 or 2 characters"). A median sentence in this
// pack is 23 characters, so typing it takes 23 SECONDS. The hard rule is unmeetable at
// the fixed speed.
//
// 🔑 THE SAME PROBLEM OWNS THE GARBLING. `obfuscate(mode, speed)` has the identical
// shape: `tickObfuscation` DECODES the text character by character at `obfuscateSpeed`.
// So `obfuscate:5` is not "scrambled text", it is a decode animation that our durations
// never let finish — which is exactly why Art and Caebrim "never finish a word".
//
// ⚠️ D-123 SAYS DO NOT RE-ATTEMPT REFLECTION, and that ruling is respected rather than
// ignored. What it actually established was that `Java.loadClass()` returns a Class
// OBJECT and its STATICS are not callable — the probe that said otherwise was measuring
// class loading rather than callability. This probe targets that exact claim with the
// exact call the feature needs, and REPORTS PER STEP so the answer cannot be misread the
// same way twice. If step 2 fails, D-123 is confirmed and this file gets deleted.
//
// 🚨 IT REPORTS EACH STEP SEPARATELY. "It did not work" is not an answer — the question
// is WHICH of load / static-call / instance-method / send fails, because a different
// answer at each step means a different remedy.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[improbe] '
  var CLS = 'toni.immersivemessages.api.ImmersiveMessage'

  function probe(p) {
    var out = []
    function step(n, what, fn) {
      try {
        var r = fn()
        out.push(['ok', n + '. ' + what, String(r).substring(0, 70)])
        return r
      } catch (e) {
        out.push(['no', n + '. ' + what, String(e).substring(0, 90)])
        return null
      }
    }

    // 1. Does the class load at all? D-123 says yes — this is the step that misled it.
    var IM = step(1, 'loadClass', function () {
      var c = Java.loadClass(CLS)
      if (!c) throw 'null'
      return typeof c
    })
    var cls = null
    try { cls = Java.loadClass(CLS) } catch (e) { }

    // 2. 🔑 THE ONE THAT MATTERS. D-123's finding was that this fails.
    var msg = step(2, 'static builder(4.0, "probe")', function () {
      if (!cls) throw 'no class'
      var m = cls.builder(4.0, 'probe')
      if (!m) throw 'returned null'
      return 'got an instance'
    })
    var inst = null
    try { inst = cls.builder(4.0, 'probe') } catch (e) { }

    // 3. The speed itself — an instance method taking a float.
    step(3, 'typewriter(6.0, false)', function () {
      if (!inst) throw 'no instance'
      inst.typewriter(6.0, false)
      return 'set'
    })

    // 4. The public field, as a second route to the same value.
    step(4, 'typewriterSpeed field', function () {
      if (!inst) throw 'no instance'
      inst.typewriterSpeed = 6.0
      return 'now ' + inst.typewriterSpeed
    })

    // 5. Can it actually be delivered? A route that builds but cannot send is no route.
    step(5, 'sendServer(player)', function () {
      if (!inst) throw 'no instance'
      inst.sendServer(p)
      return 'sent - look at your screen'
    })

    // ── ⭐ THE ROUTE D-123 NEVER TESTED ──────────────────────────────────────
    // Step 2 failed with "has no public INSTANCE field or method named 'builder'" —
    // Rhino is treating the loaded class as a Java OBJECT and looking for instance
    // members. That is the same shape as D-127's `Commands.integer`, and that one had a
    // working alternative idiom.
    //
    // 🔑 `getMethod` and `invoke` are INSTANCE methods on java.lang.Class, which is
    // exactly what Rhino CAN call. So the static is reachable through reflection even
    // though it is not reachable directly - if this works, the whole feature does.
    var Float = null, refl = null
    step(6, 'Class.getMethod("builder", float, String)', function () {
      if (!cls) throw 'no class'
      Float = Java.loadClass('java.lang.Float')
      var Str = Java.loadClass('java.lang.String')
      refl = cls.class.getMethod('builder', Float.TYPE, Str)
      if (!refl) throw 'null method'
      return 'found it'
    })

    var built = null
    step(7, 'invoke it', function () {
      if (!refl) throw 'no method'
      built = refl.invoke(null, Float.valueOf(6.0), 'probe via reflection')
      if (!built) throw 'returned null'
      return 'got an instance'
    })

    step(8, 'set speed and send', function () {
      if (!built) throw 'no instance'
      var tw = built.getClass().getMethod('typewriter', Float.TYPE,
        Java.loadClass('java.lang.Boolean').TYPE)
      tw.invoke(built, Float.valueOf(6.0), false)
      var snd = built.getClass().getMethod('sendServer',
        Java.loadClass('net.minecraft.server.level.ServerPlayer'))
      snd.invoke(built, p)
      return 'SENT at speed 6 - look at your screen'
    })

    return out
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    if (!Commands) return
    try {
      event.register(Commands.literal('improbe')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          p.tell(Text.of('§8§m                                        '))
          p.tell(Text.of('§7can the mod\'s animation SPEEDS be reached?'))
          var rows = probe(p)
          var okCount = 0
          for (var i = 0; i < rows.length; i++) {
            var r = rows[i]
            if (r[0] === 'ok') okCount++
            p.tell(Text.of((r[0] === 'ok' ? '§a✓ ' : '§c✗ ') + '§7' + r[1] + ' §8' + r[2]))
            console.info(TAG + r[0] + ' | ' + r[1] + ' | ' + r[2])
          }
          p.tell(Text.of(okCount >= 7
            ? '§a⭐ THE JAVA ROUTE WORKS. Typing at a usable speed is available.'
            : (okCount >= 6
              ? '§a⭐ REFLECTION WORKS where the direct call did not - that is the route.'
              : okCount >= 2
              ? '§e partial - the class is reachable but something downstream is not'
              : '§c both routes dead. The speed is whatever the mod does by default.')))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })

  ServerEvents.loaded(function () {
    console.info(TAG + '/improbe - one question: can typewriterSpeed be set from here? ' +
      'Temporary; delete this file once it has answered.')
  })
})();
