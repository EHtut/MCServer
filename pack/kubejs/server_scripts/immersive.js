// immersive.js — the real thing, replacing the workarounds that faked it.
//
// Ethan, 2026-08-29:
//     "This one is interesting, we could use this and documentation to transfer all god
//      dialogue making it more immersive instead of just creating workarounds."
//
// ── 🔴 IT DOES THE ONE THING I TOLD HIM WAS IMPOSSIBLE ─────────────────────────
// On 2026-08-29, asked whether god dialogue could be "shaking stylized text on the top
// of the player's screen", I answered:
//
//     "⛔ THERE IS NO SHAKE. Vanilla cannot animate text position... Undertale-style
//      per-character motion is a client renderer feature and no server-side route
//      reaches it."
//
// That was true OF VANILLA, and it was the wrong scope for the question. **This mod is
// that client renderer feature**, and it ships a server-side send. `ImmersiveMessage`
// exposes `shake()`, `typewriter()`, nine anchors including TOP_CENTER, obfuscation
// modes, slides, fades, size and sound - every single thing the boss-bar and action-bar
// workarounds were imitating.
//
// ── ⭐ WHAT THIS REPLACES ──────────────────────────────────────────────────────
//   announce.js  a BOSS BAR re-sent with uneven padding to fake a wobble  -> shake()
//   announce.js  a /title actionbar for the aftermath sting              -> anchor()
//   garble.js    §k woven in by hand, one character at a time            -> obfuscate
//
// ⚠️ NONE OF THOSE ARE DELETED. This is a preferred PATH, not a replacement: every
// caller keeps its old route and falls back to it the moment the mod is missing,
// unreachable, or throws. A dialogue system that goes silent because a mod updated is
// worse than one that looks plainer than intended.
//
// ⚠️ AND THE API IS REACHED REFLECTIVELY, so it is all unverified until a live boot
// says otherwise. Every accessor is probed once and the result is LOGGED - "the mod is
// missing" and "I could not call it" must never look like "nobody said anything".
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[immersive] '
  var GATE = true

  // Read out of the jar, not guessed:
  //   toni/immersivemessages/api/ImmersiveMessage.class
  //     static ImmersiveMessage builder(float seconds, String text)
  //     void sendServer(ServerPlayer)
  //     chainable: shake() typewriter(float,boolean) anchor(TextAnchor) size(float)
  //                fadeIn() fadeOut() background() wrap(int) obfuscate...
  var CLS = 'toni.immersivemessages.api.ImmersiveMessage'
  var ANCHOR_CLS = 'toni.immersivemessages.api.TextAnchor'
  var OBF_CLS = 'toni.immersivemessages.api.ObfuscateMode'

  var probed = false
  var MSG = null, ANCHOR = null, OBF = null
  var sendMode = null          // 'direct' | 'unwrapped' | null

  // 🔴 `Java.loadClass()` IS NOT ENOUGH FOR A STATIC METHOD, and this is what the
  // live test proved. `/im` reported `reachable: true` - the class loaded, anchors and
  // obfuscate resolved - and then every send failed with:
  //
  //     InternalError: Java class "toni.immersivemessages.api.ImmersiveMessage" has no
  //     public instance field or method named "builder".
  //
  // 🔑 Rhino handed back the java.lang.Class OBJECT, so `.builder` was looked up as an
  // INSTANCE member of Class - which of course does not have one. Reaching a STATIC
  // needs a type wrapper, not the Class object.
  //
  // ⚠️ So all three routes are tried and the winner is LOGGED. Which one works is a
  // property of this KubeJS build, not something to be reasoned out from here - the
  // whole file was written reflectively for exactly that reason, and the probe that
  // said "reached" was measuring the wrong thing.
  function cls(name) {
    try { return Java.loadClass(name) } catch (e) { return null }
  }

  // Returns something you can call statics on, or null. Order matters: the cheapest
  // and most likely first.
  var staticMode = null
  function staticsOf(name) {
    // 1. Packages.a.b.C - the classic Rhino path to a type wrapper.
    try {
      var parts = name.split('.')
      var o = Packages
      for (var i = 0; i < parts.length; i++) o = o[parts[i]]
      if (o && typeof o.builder === 'function') {
        if (!staticMode) { staticMode = 'Packages'; console.info(TAG + 'statics via Packages.*') }
        return o
      }
    } catch (e) { }
    // 2. Java.type - present in some builds, gives a proper type wrapper.
    try {
      if (typeof Java.type === 'function') {
        var t = Java.type(name)
        if (t && typeof t.builder === 'function') {
          if (!staticMode) { staticMode = 'Java.type'; console.info(TAG + 'statics via Java.type') }
          return t
        }
      }
    } catch (e) { }
    // 3. The Class object itself - what the first version used. Kept last rather than
    //    deleted, because a future KubeJS may make it work and it costs one try.
    try {
      var c = cls(name)
      if (c && typeof c.builder === 'function') {
        if (!staticMode) { staticMode = 'Java.loadClass'; console.info(TAG + 'statics via Java.loadClass') }
        return c
      }
    } catch (e) { }
    return null
  }

  // ⚠️ Probed ONCE and the outcome logged, because an unreachable API and a quiet one
  // are indistinguishable from the outside - the failure this project keeps paying for.
  function probe() {
    if (probed) return MSG !== null
    probed = true
    MSG = staticsOf(CLS)
    ANCHOR = cls(ANCHOR_CLS)
    OBF = cls(OBF_CLS)
    if (!MSG) {       console.warn(TAG + 'ImmersiveMessage statics are NOT callable by any of the three routes (Packages, Java.type, Java.loadClass). Every caller falls back to ' +
        'its old route (the boss bar, the action bar, hand-woven garble). This is a ' +
        'FAILURE to reach the mod, NOT a quiet dialogue system.')
      return false
    }
    // ⚠️ "reached" now means the STATIC IS CALLABLE, not merely that the class
    // loaded. The first version said reached and then failed on every send.
    console.info(TAG + 'ImmersiveMessage reached via ' + (staticMode || '?') +
      ' - builder() is callable. anchors=' + (ANCHOR ? 'ok' : 'MISSING') +
      ' obfuscate=' + (OBF ? 'ok' : 'MISSING'))
    return true
  }

  function anchorNamed(name) {
    if (!ANCHOR) return null
    try { return ANCHOR[name] || null } catch (e) { return null }
  }

  function obfNamed(name) {
    if (!OBF) return null
    try { return OBF[name] || null } catch (e) { return null }
  }

  // 🚨 THE SEND IS THE PART MOST LIKELY TO BREAK. sendServer wants a ServerPlayer;
  // KubeJS hands scripts its own wrapper in some versions and the raw entity in others.
  // Both are tried, the winner is remembered, and a total failure is loud.
  function send(msg, p) {
    if (sendMode === 'direct' || sendMode === null) {
      try {
        msg.sendServer(p)
        if (sendMode === null) {
          sendMode = 'direct'
          console.info(TAG + 'sendServer accepts the KubeJS player directly.')
        }
        return true
      } catch (e) { if (sendMode === 'direct') return false }
    }
    // Second shape: a wrapper with the real player underneath.
    var raw = null
    try { raw = p.minecraftPlayer } catch (e) { }
    if (!raw) { try { raw = p.getPlayer() } catch (e) { } }
    if (raw) {
      try {
        msg.sendServer(raw)
        if (sendMode === null) {
          sendMode = 'unwrapped'
          console.info(TAG + 'sendServer needs the unwrapped player - using it.')
        }
        return true
      } catch (e) { }
    }
    if (sendMode === null) {
      sendMode = 'broken'
      console.warn(TAG + 'sendServer could not be called with EITHER shape. Falling back ' +
        'everywhere. This is a FAILURE, not silence.')
    }
    return false
  }

  // ── the one entry point ──────────────────────────────────────────────────────
  //
  // opts (all optional):
  //   seconds    how long it stays            default 4
  //   anchor     'TOP_CENTER' etc              default TOP_CENTER
  //   shake      true, or [intensity, speed]
  //   typewriter true, or a speed number
  //   obfuscate  'RANDOM' | 'LEFT' | ...
  //   size       float scale
  //   fade       true -> fadeIn + fadeOut
  //   background true
  //   wrap       int max width
  //
  // ⚠️ RETURNS FALSE RATHER THAN THROWING. Every caller treats false as "use the old
  // route", which is why nothing here is allowed to be fatal.
  function show(p, text, opts) {
    if (!GATE) return false
    if (!p || !text) return false
    if (!probe()) return false
    var o = opts || {}
    try {
      var secs = (typeof o.seconds === 'number') ? o.seconds : 4
      var m = MSG.builder(secs, String(text))
      if (!m) return false

      var a = anchorNamed(o.anchor || 'TOP_CENTER')
      if (a) { try { m = m.anchor(a) } catch (e) { } }

      if (o.shake) {
        try {
          if (o.shake instanceof Array && o.shake.length === 2) m = m.shake(o.shake[0], o.shake[1])
          else m = m.shake()
        } catch (e) { }
      }
      if (o.typewriter) {
        try {
          m = m.typewriter(typeof o.typewriter === 'number' ? o.typewriter : 1.0, false)
        } catch (e) { }
      }
      if (o.obfuscate) {
        var ob = obfNamed(o.obfuscate)
        if (ob) { try { m = m.obfuscate(ob) } catch (e) { } }
      }
      if (typeof o.size === 'number') { try { m = m.size(o.size) } catch (e) { } }
      if (o.fade) { try { m = m.fadeIn().fadeOut() } catch (e) { } }
      if (o.background) { try { m = m.background() } catch (e) { } }
      if (typeof o.wrap === 'number') { try { m = m.wrap(o.wrap) } catch (e) { } }

      return send(m, p)
    } catch (e) {
      console.warn(TAG + 'show threw - falling back :: ' + e)
      return false
    }
  }

  VELDORA.im = {
    show: show,
    available: function () { return GATE && probe() },
    sendMode: function () { return sendMode },
    staticMode: function () { return staticMode },
    _probe: probe,
  }

  ServerEvents.loaded(function () {
    if (!GATE) { console.info(TAG + 'GATED OFF - everything uses the old routes'); return }
    var ok = probe()
    console.info(TAG + (ok
      ? 'live. ⭐ REAL shake, typewriter, TOP_CENTER and obfuscation are available - ' +
        'the boss-bar wobble and the hand-woven garble were imitating exactly these. ' +
        'Every caller still falls back to its old route if a send fails.'
      : 'NOT available - every caller stays on its old route.'))
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    try {
      event.register(Commands.literal('im')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .then(Commands.literal('shake').executes(function (ctx) {
          var p = ctx.source.player
          var okd = show(p, 'You feel a chill run down your spine',
            { shake: true, seconds: 4, anchor: 'TOP_CENTER' })
          p.tell(Text.of('§8shake: §f' + (okd ? 'sent' : 'FAILED - see the log')))
          return 1
        }))
        .then(Commands.literal('type').executes(function (ctx) {
          var p = ctx.source.player
          var okd = show(p, 'I have a deal for you.',
            { typewriter: 1.0, seconds: 6, anchor: 'TOP_CENTER' })
          p.tell(Text.of('§8typewriter: §f' + (okd ? 'sent' : 'FAILED')))
          return 1
        }))
        .then(Commands.literal('garbled').executes(function (ctx) {
          var p = ctx.source.player
          var okd = show(p, 'No one sent me. That is not usually how this works.',
            { obfuscate: 'RANDOM', seconds: 6, anchor: 'TOP_CENTER' })
          p.tell(Text.of('§8obfuscate: §f' + (okd ? 'sent' : 'FAILED')))
          return 1
        }))
        .executes(function (ctx) {
          var p = ctx.source.player
          p.tell(Text.of('§8builder callable: §f' + probe() + '§8 via §f' + (staticMode || 'NONE')))
          p.tell(Text.of('§8send mode: §f' + (sendMode || 'not yet attempted')))
          p.tell(Text.of('§8/im shake §7| §8/im type §7| §8/im garbled'))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
