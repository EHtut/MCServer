// immersive.js — the real thing, replacing the workarounds that faked it.
//
// Ethan, 2026-08-29:
//     "This one is interesting, we could use this and documentation to transfer all god
//      dialogue making it more immersive instead of just creating workarounds."
//
// ── 🔴 IT DOES THE ONE THING I TOLD HIM WAS IMPOSSIBLE ─────────────────────────
// Asked whether god dialogue could be "shaking stylized text on the top of the player's
// screen", I answered "⛔ THERE IS NO SHAKE... no server-side route reaches it." That was
// true OF VANILLA and the wrong scope for the question. This mod IS that client renderer,
// and it ships a server-side send.
//
// ── 🔴 AND THE REFLECTIVE ROUTE IS DEAD — READ THIS BEFORE "FIXING" IT ─────────
// The first build of this file reached the API reflectively. On the 2026-08-30 00:11 boot
// ALL THREE routes failed:
//
//     Packages.toni.immersivemessages.api.ImmersiveMessage   -> no callable builder
//     Java.type(...)                                         -> no callable builder
//     Java.loadClass(...)                                    -> returns the Class OBJECT,
//                                                               statics are not callable
//
// ⛔ DO NOT re-attempt reflection here. It was probed at every route and logged its own
// failure; the probe that said `reachable: true` was measuring class LOADING, not static
// CALLABILITY — the same "measure at the point of use" error CLAUDE.md warns about.
//
// ⭐ THE MOD SHIPS A COMMAND, and it exposes MORE than the Java builder did. Grammar and
// value types were read out of ImmersiveMessagesCommands.class with javap — not guessed,
// not inferred from a wiki:
//
//     /immersivemessages sendcustom <player> <data:CompoundTag> <duration:float> <text...>
//                                            ^^^^ THE NBT COMES SECOND ^^^^
//
// ⚠️ That argument order is why four rounds of probing failed with "Expected '{'": every
// attempt put the float before the tag, as every other Minecraft command would. It does not.
//
//   int      anchor    0 CENTER_CENTER 1 CENTER_LEFT 2 CENTER_RIGHT 3 BOTTOM_CENTER
//                      4 BOTTOM_LEFT   5 BOTTOM_RIGHT 6 TOP_CENTER  7 TOP_LEFT 8 TOP_RIGHT
//   int      obfuscate 0 NONE 1 FULL 2 LEFT 3 RIGHT 4 CENTER 5 RANDOM
//   int      align
//   string   color · font · bgColor · borderTop · borderBottom
//   float    size · x · y · fadein · fadeout
//   presence shake · wave · rainbow · bold · italic · wrap · background · typewriter ·
//            sound · slideup/down/left/right · slideoutup/down/left/right
//
// ⚠️ "presence" means THE KEY EXISTING switches it on — the value is never read. `shake:0b`
// still shakes. Omit the key to turn it off; never emit it as false.
//
// ── ⭐ WHAT THIS REPLACES ──────────────────────────────────────────────────────
//   announce.js  a BOSS BAR re-sent with uneven padding to fake a wobble  -> shake
//   announce.js  a /title actionbar for the aftermath sting              -> anchor
//   garble.js    §k woven in by hand, one character at a time            -> obfuscate
//
// ⚠️ NONE OF THOSE ARE DELETED. This is a preferred PATH, not a replacement: every caller
// keeps its old route and falls back the moment a send returns 0. A dialogue system that
// goes silent because a mod updated is worse than one that looks plainer than intended.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[immersive] '
  var GATE = true
  var MODID = 'immersivemessages'

  // Read out of TextAnchor.class in declaration order. The command takes the ORDINAL, not
  // the name — `anchor:"TOP_CENTER"` is read by getInt as 0 and silently centres instead.
  var ANCHOR = {
    CENTER_CENTER: 0, CENTER_LEFT: 1, CENTER_RIGHT: 2,
    BOTTOM_CENTER: 3, BOTTOM_LEFT: 4, BOTTOM_RIGHT: 5,
    TOP_CENTER: 6, TOP_LEFT: 7, TOP_RIGHT: 8
  }
  var OBFUSCATE = { NONE: 0, FULL: 1, LEFT: 2, RIGHT: 3, CENTER: 4, RANDOM: 5 }

  // The mod is assumed to render the text argument literally, so a § code would show as a
  // § character. The first one becomes a real colour and then every code is stripped.
  // `/im codes` is the test that confirms or refutes that assumption.
  var CODE_HEX = {
    '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
    '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
    '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
    'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
  }

  var available = null      // null = not probed yet. NEVER let this collapse with false.
  var lastError = null
  var sent = 0
  var failed = 0
  var rcWarned = false
  var fadeWarned = false
  var logged = 0
  var LOG_FIRST = 40

  function probe() {
    if (available !== null) return available
    try {
      available = !!Platform.isLoaded(MODID)
    } catch (e) {
      lastError = 'Platform.isLoaded threw :: ' + e
      available = false
    }
    return available
  }

  function serverOf(p) {
    try { if (p && p.server) return p.server } catch (e) { }
    try { return Utils.server } catch (e) { }
    return null
  }

  function nameOf(p) {
    try { if (p.username) return String(p.username) } catch (e) { }
    try { return String(p.name.getString()) } catch (e) { }
    return null
  }

  // 🔴 TWO DIFFERENT FLOATS, AND ONE HELPER USED TO SERVE BOTH. That was the bug that
  // made every /im test fail on the 00:45 boot:
  //
  //     immersivemessages sendcustom Rehykt {...} 4.0f The tide is rising.
  //                                                  ^ "Expected whitespace to end one
  //                                                    argument, but found trailing data"
  //
  // ⚠️ `4.0f` is CORRECT inside the NBT — SNBT wants the suffix to make a float tag.
  // It is WRONG as the duration, which is a Brigadier FloatArgumentType and rejects the
  // suffix outright. They look like the same thing and are parsed by different parsers.
  //
  // 🚨 The harness asserted `/\} 4\.0f /` — it encoded the bug as the expectation and
  // went green on it. A test written from the implementation tests the implementation.

  /** SNBT float — for values INSIDE the tag. Keeps the `f` suffix. */
  function nbtF(n) {
    var v = Number(n)
    if (!isFinite(v)) return null
    var s = String(v)
    if (s.indexOf('.') < 0) s = s + '.0'
    return s + 'f'
  }

  /** Brigadier float — for the duration argument. NO suffix, ever. */
  function argF(n) {
    var v = Number(n)
    if (!isFinite(v) || v <= 0) return null
    var s = String(v)
    if (s.indexOf('.') < 0) s = s + '.0'
    return s
  }

  // SNBT string: double quotes, backslash-escaped. Built by CODE POINT so that no editor,
  // heredoc or shell can mangle the escape into a literal control byte — one did exactly
  // that on 08-29 and made a whole harness pass vacuously.
  var BS = String.fromCharCode(92)
  var QU = String.fromCharCode(34)
  function quote(s) {
    var out = ''
    var t = String(s)
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i)
      if (c === BS || c === QU) out += BS
      out += c
    }
    return QU + out + QU
  }

  function buildTag(o, colour) {
    var t = []

    var a = ANCHOR[String(o.anchor || 'TOP_CENTER').toUpperCase()]
    if (typeof a === 'number') t.push('anchor:' + a)

    if (o.obfuscate) {
      var ob = OBFUSCATE[String(o.obfuscate).toUpperCase()]
      if (typeof ob === 'number' && ob > 0) t.push('obfuscate:' + ob)
    }

    if (colour) t.push('color:' + quote(colour))
    if (o.font) t.push('font:' + quote(o.font))
    if (o.bgColor) t.push('bgColor:' + quote(o.bgColor))
    if (o.borderTop) t.push('borderTop:' + quote(o.borderTop))
    if (o.borderBottom) t.push('borderBottom:' + quote(o.borderBottom))

    if (typeof o.size === 'number') { var sz = nbtF(o.size); if (sz) t.push('size:' + sz) }
    if (typeof o.x === 'number') { var xx = nbtF(o.x); if (xx) t.push('x:' + xx) }
    if (typeof o.y === 'number') { var yy = nbtF(o.y); if (yy) t.push('y:' + yy) }

    // 🔴 `fadein` AND `fadeout` ARE MUTUALLY EXCLUSIVE IN THE MOD. The command handler
    // is an if / else-if / else, not two independent ifs:
    //
    //     if contains("fadein")       -> fadeIn(x);  GOTO END   <- skips fadeout entirely
    //     else if contains("fadeout") -> fadeOut(x); GOTO END
    //     else                        -> fadeIn(); fadeOut()    <- both, properly paired
    //
    // ⚠️ So sending BOTH silently drops the second one, and the message ends up with a
    // fade-in and NO fade-out configured at all. That is what made every /gd line type
    // itself out and then vanish after about a second while every line that passed
    // NEITHER key stayed up for its full duration - the working ones were landing in
    // the `else` and getting the mod's properly paired defaults.
    //
    // 🔑 SO THE DEFAULT IS TO SEND NEITHER. `fade: true` used to push both; it now
    // means "leave the mod's defaults alone", which is what it should always have done.
    // A caller may still set ONE explicitly, and asking for both is refused loudly
    // rather than half-honoured.
    var wantsIn = (typeof o.fadein === 'number')
    var wantsOut = (typeof o.fadeout === 'number')
    if (wantsIn && wantsOut) {
      if (!fadeWarned) {
        fadeWarned = true
        console.warn(TAG + 'fadein AND fadeout were both requested. The mod applies only ' +
          'the FIRST - its handler is an else-if chain - so the other would be silently ' +
          'dropped. Sending NEITHER, which gives the mod its paired defaults.')
      }
    } else if (wantsIn) {
      var fi = nbtF(o.fadein); if (fi) t.push('fadein:' + fi)
    } else if (wantsOut) {
      var fo = nbtF(o.fadeout); if (fo) t.push('fadeout:' + fo)
    }

    // ⚠️ Presence-only below. The value is never read — the key existing IS the switch, so
    // these are pushed only when truthy and are never emitted as `false`.
    if (o.shake) t.push('shake:1b')
    if (o.wave) t.push('wave:1b')
    if (o.rainbow) t.push('rainbow:1b')
    if (o.bold) t.push('bold:1b')
    if (o.italic) t.push('italic:1b')
    if (o.background) t.push('background:1b')
    if (o.wrap) t.push('wrap:1b')
    if (o.typewriter) t.push('typewriter:1b')
    if (o.sound) t.push('sound:1b')
    if (o.slideup) t.push('slideup:1b')
    if (o.slidedown) t.push('slidedown:1b')
    if (o.slideleft) t.push('slideleft:1b')
    if (o.slideright) t.push('slideright:1b')

    return '{' + t.join(',') + '}'
  }

  function show(p, text, opts) {
    if (!GATE) return false
    if (!p || !text) return false
    if (!probe()) return false
    var o = opts || {}
    try {
      var raw = String(text)

      // The text argument is greedy to end of line, so a newline would truncate it.
      raw = raw.replace(/[\r\n\t]+/g, ' ')

      var colour = o.color || null
      if (!colour) {
        var m = raw.match(/§([0-9a-fA-F])/)
        if (m) colour = CODE_HEX[String(m[1]).toLowerCase()] || null
      }
      var body = raw.replace(/§./g, '').replace(/\s+/g, ' ')
      body = body.replace(/^\s+/, '').replace(/\s+$/, '')
      if (!body) return false

      var who = nameOf(p)
      var server = serverOf(p)
      if (!who || !server) return false

      var secs = (typeof o.seconds === 'number') ? o.seconds : 4
      var cmd = MODID + ' sendcustom ' + who + ' ' + buildTag(o, colour) +
                ' ' + argF(secs) + ' ' + body

      // 🔴 THE HANDLER RETURNS 1 (`iconst_1; ireturn`) BUT KUBEJS DOES NOT HAND IT BACK.
      // On the 00:45 boot every send logged `sendcustom returned undefined`, so the
      // Java return value never reaches Rhino on this build. That was TRUE reasoning
      // about the wrong layer — I read the mod's bytecode and then assumed the bridge
      // was transparent.
      //
      // ⚠️ So per-send failure detection is NOT AVAILABLE, and pretending otherwise is
      // worse than admitting it: `undefined > 0` is false, so the old check reported
      // every successful send as a failure and every caller double-rendered.
      //
      // 🔑 What actually guards the grammar is the HARNESS, which builds the command
      // string and asserts its shape. That is the honest division: the harness catches
      // malformed commands before they ship, and this catches only throws.
      // ⭐ LOG THE FIRST FEW COMMANDS VERBATIM. Three rounds were spent guessing which
      // tag key stopped a line rendering, while the one fact that would have settled it
      // - the exact string that reached the server - was never written down anywhere.
      // Capped so a live tide cannot flood the log.
      if (logged < LOG_FIRST) {
        logged++
        console.info(TAG + 'SENT #' + logged + ': ' + cmd)
      }
      var rc = server.runCommandSilent(cmd)

      if (typeof rc === 'number') {
        if (rc > 0) { sent++; return true }
        failed++
        if (failed <= 3) console.warn(TAG + 'sendcustom returned ' + rc + ' :: ' + cmd)
        return false
      }

      // Not a number on this build. Say so ONCE, loudly, then treat no-throw as sent.
      if (!rcWarned) {
        rcWarned = true
        console.warn(TAG + 'runCommandSilent returned ' + (typeof rc) + ', not a number - ' +
          'per-send failure detection is UNAVAILABLE on this build. A malformed command ' +
          'will now look like a successful send, so the command SHAPE is the harness\'s ' +
          'job (tools/immersive_harness.js), not this function\'s.')
      }
      sent++
      return true
    } catch (e) {
      failed++
      lastError = String(e)
      if (failed <= 3) console.warn(TAG + 'show threw - falling back :: ' + e)
      return false
    }
  }

  VELDORA.im = {
    show: show,
    available: function () { return GATE && probe() },
    anchors: ANCHOR,
    obfuscateModes: OBFUSCATE,
    stats: function () { return { sent: sent, failed: failed, lastError: lastError } },
    _probe: probe,
    _buildTag: buildTag
  }

  ServerEvents.loaded(function () {
    if (!GATE) { console.info(TAG + 'GATED OFF - everything uses the old routes'); return }
    var ok = probe()
    console.info(TAG + (ok
      ? 'live via the COMMAND route (sendcustom). ⭐ REAL shake, typewriter, nine anchors ' +
        'and obfuscation are available - the boss-bar wobble and the hand-woven garble ' +
        'were imitating exactly these. The reflective route is DEAD and must not be ' +
        'retried; see the header. Every caller still falls back if a send returns 0.'
      : 'NOT available (' + (lastError || 'mod not loaded') + ') - callers stay on the old route.'))
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    function test(label, text, o) {
      return Commands.literal(label).executes(function (ctx) {
        var p = ctx.source.player
        var okd = show(p, text, o)
        p.tell(Text.of('§8' + label + ': §f' + (okd ? 'sent' : 'FAILED - see the log')))
        return 1
      })
    }
    try {
      event.register(Commands.literal('im')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .then(test('shake', '§cThe tide is rising.',
          { shake: true, seconds: 4, anchor: 'TOP_CENTER' }))
        .then(test('type', '§9I have a deal for you.',
          { typewriter: true, seconds: 6, anchor: 'TOP_CENTER' }))
        .then(test('garbled', '§6No one sent me. That is not usually how this works.',
          { obfuscate: 'RANDOM', seconds: 6, anchor: 'TOP_CENTER' }))
        .then(test('anchor', 'This should sit at the BOTTOM of your screen.',
          { seconds: 5, anchor: 'BOTTOM_CENTER', y: 40 }))
        // ⭐ For the font/emphasis pass Ethan deferred: does the mod parse § codes in the
        // body, or render them literally? This is the one test that answers it. If the
        // codes SHOW as characters, inline emphasis has to come from the tag keys instead.
        .then(test('codes', 'plain §cRED §fplain §lBOLD§r plain',
          { seconds: 8, anchor: 'TOP_CENTER', color: '#FFFFFF' }))
        .then(test('font', 'Does this render in an alternate font?',
          { seconds: 8, anchor: 'TOP_CENTER', font: 'minecraft:alt' }))
        .executes(function (ctx) {
          var p = ctx.source.player
          var st = VELDORA.im.stats()
          p.tell(Text.of('§8route: §fcommand (sendcustom)§8  loaded: §f' + probe()))
          p.tell(Text.of('§8sent: §f' + st.sent + ' §8failed: §f' + st.failed +
                         (st.lastError ? ' §8last: §f' + st.lastError : '')))
          p.tell(Text.of('§8/im shake §7| §8type §7| §8garbled §7| §8anchor §7| §8codes §7| §8font'))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
