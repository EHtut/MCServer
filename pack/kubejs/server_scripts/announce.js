// announce.js — the bar at the top of the screen, for things ABOUT TO HAPPEN.
//
// Ethan, 2026-08-29, after seeing the trespass bar in play:
//     "The shaking text above with the boss bar genuinly looks good, but I am not
//      sure if it works well for god dialogue. Instead we can add it as Announcements
//      of something going to happen."
//
// ── 🔑 THE RULING, AND WHY IT IS THE RIGHT ONE ─────────────────────────────────
// ⛔ GOD DIALOGUE STAYS IN CHAT. A god says load-bearing things and a bar is gone in
// four seconds - a line missed mid-fight would be missed forever. Chat is the only
// surface in the game that keeps a record.
//
// ⭐ But an ANNOUNCEMENT is the opposite kind of text: it is about the next ten
// seconds, it is nobody's speech, and it is worthless later. The bar's weaknesses -
// transient, unattributed, one short line - are exactly its strengths here.
//
// This file owns the mechanism. `trespass.js` wrote it first and now consumes it, so
// there is one bar implementation rather than two that drift.
//
// ── 🔴 THERE IS NO SHAKE IN VANILLA - AND THAT WAS THE WRONG SCOPE ────────────
// Probed 2026-08-29: the server ACCEPTS {"text":"x","shake":true} because unknown
// component fields are silently dropped. Fake and real are byte-identical over rcon,
// exactly like /playsound. So the tremor BELOW is a re-send with uneven padding against
// centred bar text - a whole-line wobble, not per-glyph motion.
//
// ⚠️ ALL OF THAT IS STILL TRUE AND IT STOPPED BEING THE ANSWER THE SAME DAY. I told
// Ethan "no server-side route reaches it"; the honest version was "no VANILLA route
// does". `immersive-messages-api` is precisely the client renderer feature I said was
// out of reach, and it ships a server-side send - so `ImmersiveMessage.shake()` is now
// the preferred path and everything below is the FALLBACK.
//
// ⭐ The fallback stays. A boss-bar wobble is worse than a real shake and infinitely
// better than an announcement that never arrives because a mod updated.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[announce] '
  var GATE = true

  // ── 🚨 ETHAN'S LINES. Do not edit, do not "improve", do not add to a pool to
  // round it out. Every one of these is his, written 2026-08-29, and the whole point
  // of the register in docs/51 is that his writing and my scaffolding never get
  // confused again. A pool of three is a pool of three.
  //
  // ⭐ THEY ARE ALL SECOND-PERSON BODY SENSATION. Not one of them describes an event
  // - they describe what you FEEL a second before the event. That is the register,
  // and it is why they work on a bar with no name attached: nobody is telling you
  // anything, your own body is.
  var POOLS = {
    // The tide is coming. Cold, watched, afraid - in that order.
    tide: [
      'You feel a chill run down your spine',
      'Something is watching you closely',
      'You feel terror grip your heart',
    ],
    // ⚠️ A DIFFERENT REGISTER, NOT A LOUDER ONE. The tide lines are dread; these are
    // already-too-late. "You can see your death" is not an intensifier of "you feel a
    // chill", it is a different sentence about a different situation.
    tide_boss: [
      'You can see your death',
      'Blood stains your hand',
      'You hands are weak',
    ],
    // A gift landing. The only pool with no fear in it.
    boon: [
      'You feel yourself grow stronger',
      'adrenaline runs through your veins',
      'You push yourself',
    ],
    // ⚠️ THIS GOES TO WALL'S VICTIM, NEVER TO HER CHAMPION. See wall_events.js.
    wall_attack: [
      'You hear a thousands spiders',
      'You feel something crawling up your skin',
      'Something wrong is watching you',
    ],
    // Salvage arriving to deal. She is a friendly shopkeeper and this is what it
    // actually feels like when she turns up, which is most of her character.
    trade: [
      'Your vision goes dark',
      'You feel a breath on the back of your neck',
      'You want to run',
    ],
  }

  // ── priority ─────────────────────────────────────────────────────────────────
  // 🔑 ONE BAR, SO SOMETHING HAS TO LOSE. An announcement outranks ambience, and a
  // lower-priority line while one is showing is DROPPED, not queued.
  //
  // ⚠️ Dropping is the correct choice and queuing is the wrong one: an announcement
  // is a promise about the next few seconds. Showing "something is watching you"
  // after the wave already landed is not a delayed warning, it is a false one.
  var P_AMBIENT = 0
  var P_ANNOUNCE = 10

  var SHOW_TICKS = 90           // 4.5s
  var SHAKE = true
  var SHAKE_TICKS = 3

  var live = {}                 // uuid -> { prio, epoch }
  var cmdWarned = false

  // ── the bar ──────────────────────────────────────────────────────────────────
  // ⚠️ No regex in this file. Escaping a JS regex through a shell heredoc has mangled
  // three files in this repo; split/join cannot be mangled.
  function esc(s) {
    var t = String(s)
    t = t.split('\\').join('\\\\')
    t = t.split('"').join('\\"')
    return t
  }

  function nameJson(s) {
    return '{"text":"' + esc(s) + '","color":"white","italic":true}'
  }

  function jitter(s) {
    if (!SHAKE) return s
    var n = Math.floor(Math.random() * 4)
    if (n === 0) return s
    if (n === 1) return ' ' + s
    if (n === 2) return s + ' '
    return '  ' + s
  }

  function barId(p) {
    var u = ''
    try { u = String(p.uuid).toLowerCase() } catch (e) { u = 'unknown' }
    return 'veldora:announce_' + u
  }

  // ⭐ runCommand, NOT runCommandSilent, for setup - finding K8: "unlike
  // runCommandSilent we can actually tell whether it worked".
  function run(server, cmd) {
    try {
      var r = server.runCommand(cmd)
      return (typeof r === 'number') ? r : 1
    } catch (e) {
      if (!cmdWarned) {
        cmdWarned = true
        console.warn(TAG + 'a bossbar command threw - the bar may be silent :: ' + e)
      }
      return 0
    }
  }

  function quiet(server, cmd) {
    try { server.runCommandSilent(cmd) } catch (e) { }
  }

  function step(server, p, id, text, left, epoch) {
    var st = live[String(p.uuid)]
    if (!st || st.epoch !== epoch) return       // superseded by a newer line
    if (left <= 0) {
      quiet(server, 'bossbar remove ' + id)
      st.prio = -1                              // the slot is free again
      return
    }
    quiet(server, 'bossbar set ' + id + ' value ' + left)
    if (SHAKE) quiet(server, 'bossbar set ' + id + ' name ' + nameJson(jitter(text)))
    try {
      server.scheduleInTicks(SHAKE_TICKS, function () {
        step(server, p, id, text, left - SHAKE_TICKS, epoch)
      })
    } catch (e) { quiet(server, 'bossbar remove ' + id); st.prio = -1 }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🔴 THE REAL ONE, AND IT DOES WHAT I SAID COULD NOT BE DONE.
  //
  // This file's own header still records the finding: "THERE IS NO SHAKE IN VANILLA...
  // the wobble here is a FAKE: the bar name is re-sent every few ticks with uneven
  // padding." That was true, and it was true of the wrong thing - ImmersiveMessage
  // ships `shake()` and a server-side send, so the imitation has an original now.
  //
  // ⚠️ THE BOSS BAR IS NOT DELETED. It is the FALLBACK, and it stays the fallback: if
  // the mod is missing, unreachable, or the send throws, the announcement still
  // arrives - plainer, but it arrives. An announcement that vanishes because a mod
  // updated is worse than one that looks less impressive.
  function showImmersive(p, text, prio) {
    try {
      if (!VELDORA.im || typeof VELDORA.im.show !== 'function') return false
      return VELDORA.im.show(p, text, {
        seconds: SHOW_TICKS / 20,
        anchor: 'TOP_CENTER',
        // ⭐ A REAL tremor, only for announcements. Ambience does not shake - it is
        // the place talking, not something arriving.
        shake: (prio >= P_ANNOUNCE),
        fade: true,
      })
    } catch (e) { return false }
  }

  function show(server, p, text, prio) {
    if (!GATE) return false
    if (!p || !text) return false
    var key = String(p.uuid)
    var st = live[key]
    if (!st) { st = live[key] = { prio: -1, epoch: 0 } }

    // The drop rule. Equal priority REPLACES - two tide warnings in a row should
    // show the newer one, since the newer one is the true statement about now.
    if (st.prio > prio) return false

    st.prio = prio
    st.epoch = st.epoch + 1

    // ⭐ PREFERRED PATH FIRST. The priority slot is still claimed above, so ambience
    // still loses to an announcement whichever route renders it.
    if (showImmersive(p, text, prio)) {
      // ⚠️ The slot must free itself even though no bossbar tick will do it - an
      // immersive message has no `step` loop to hand the slot back.
      try {
        server.scheduleInTicks(SHOW_TICKS, function () {
          var st2 = live[String(p.uuid)]
          if (st2 && st2.prio === prio) st2.prio = -1
        })
      } catch (e) { st.prio = -1 }
      return true
    }

    var id = barId(p)

    quiet(server, 'bossbar remove ' + id)
    var made = run(server, 'bossbar add ' + id + ' ' + nameJson(text))
    if (!made) {
      console.warn(TAG + 'could not create a bar for ' + p.username + ' - line LOST')
      st.prio = -1
      return false
    }
    quiet(server, 'bossbar set ' + id + ' color white')
    quiet(server, 'bossbar set ' + id + ' style progress')
    quiet(server, 'bossbar set ' + id + ' max ' + SHOW_TICKS)
    quiet(server, 'bossbar set ' + id + ' value ' + SHOW_TICKS)
    run(server, 'bossbar set ' + id + ' players ' + p.username)
    step(server, p, id, text, SHOW_TICKS, st.epoch)
    return true
  }

  // ── ⭐ THE ACTION BAR - a DIFFERENT surface, on purpose ──────────────────────
  // Ethan, 2026-08-29, on Salvage's deals: *"You hear the laughter of a distant god
  // (this is played in the action bar)."*
  //
  // 🔑 THE BOSS BAR AND THE ACTION BAR SAY DIFFERENT KINDS OF THING, and keeping them
  // apart is what stops either becoming noise:
  //
  //   BOSS BAR    something is ABOUT to happen. Top of screen, 4.5s, a tremor.
  //   ACTION BAR  something JUST happened, and it is too late. Above the hotbar, a
  //               single quiet line, no bar, no drain, gone in about three seconds.
  //
  // ⚠️ It deliberately IGNORES the priority slot. An aftermath sting is not competing
  // with a warning - they are different places on the screen and can coexist. Routing
  // it through show() would have made the laughter cancel a tide warning, or lose to
  // one, and neither is right.
  function actionbar(server, p, text) {
    if (!GATE || !p || !text) return false

    // ⭐ PREFERRED: a real anchored message just above the hotbar. `/title actionbar`
    // was the closest vanilla could get and it is kept below as the fallback.
    //
    // ⚠️ NO SHAKE HERE, deliberately. This is the aftermath sting - something that
    // ALREADY happened. Shaking it would make it read as a warning, which is the one
    // thing it is not.
    try {
      if (VELDORA.im && typeof VELDORA.im.show === 'function') {
        if (VELDORA.im.show(p, text, {
          seconds: 3,
          anchor: 'BOTTOM_CENTER',
          y: 40,
          fade: true,
        })) return true
      }
    } catch (e) { }

    try {
      run(server, 'title ' + p.username + ' actionbar ' + nameJson(text))
      return true
    } catch (e) { return false }
  }

  function pick(pool, lastIdx) {
    if (!pool || !pool.length) return -1
    if (pool.length <= 1) return 0
    var i = Math.floor(Math.random() * pool.length)
    if (i === lastIdx) i = (i + 1) % pool.length
    return i
  }

  var lastOf = {}               // uuid+key -> last index, so a 3-line pool never repeats

  function say(server, p, key, prio) {
    var pool = POOLS[key]
    if (!pool) {
      // 🚨 A MISSING POOL IS A BUG, NOT SILENCE. A typo'd key would otherwise make an
      // announcement channel that simply never fires, which looks exactly like a
      // system that is working and has nothing to say.
      console.warn(TAG + 'no pool named "' + key + '" - nothing announced. This is a ' +
        'TYPO, not a quiet moment.')
      return false
    }
    var lk = String(p && p.uuid) + '/' + key
    var i = pick(pool, (typeof lastOf[lk] === 'number') ? lastOf[lk] : -1)
    if (i < 0) return false
    lastOf[lk] = i
    return show(server, p, pool[i], (typeof prio === 'number') ? prio : P_ANNOUNCE)
  }

  VELDORA.announce = {
    // The two entry points. `say` for a named pool, `text` for a one-off.
    say: function (server, p, key) { return say(server, p, key, P_ANNOUNCE) },
    ambient: function (server, p, key) { return say(server, p, key, P_AMBIENT) },
    text: function (server, p, s, prio) { return show(server, p, s, prio) },
    // ⭐ A different surface, not a different priority. See actionbar() above.
    actionbar: actionbar,
    pools: POOLS,
    keys: function () {
      var out = []
      for (var k in POOLS) { if (POOLS.hasOwnProperty(k)) out.push(k) }
      return out
    },
    P_AMBIENT: P_AMBIENT,
    P_ANNOUNCE: P_ANNOUNCE,
    enabled: function () { return GATE },
    _pick: pick,
    _jitter: jitter,
    _nameJson: nameJson,
  }

  ServerEvents.loaded(function () {
    var n = 0, k
    for (k in POOLS) { if (POOLS.hasOwnProperty(k)) n += POOLS[k].length }
    console.info(TAG + 'THE ANNOUNCEMENT BAR live - ' + VELDORA.announce.keys().length +
      ' pools, ' + n + ' lines, all Ethan\'s. Announcements outrank ambience and a ' +
      'lower-priority line is DROPPED, never queued - a late warning is a false one.')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    try {
      event.register(Commands.literal('announce')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        // ⚠️ `event.arguments.STRING.create(event)` + Java.loadClass - copied from
        // tide.js:933, which is the shape that actually works in this KubeJS. My first
        // guess (Commands.string() / java.lang.String.class) was invented.
        .then(Commands.argument('pool', event.arguments.STRING.create(event))
          .executes(function (ctx) {
            var p = ctx.source.player
            if (!p) return 0
            var k = ''
            try { k = String(ctx.getArgument('pool', Java.loadClass('java.lang.String'))) } catch (e) { }
            var okd = VELDORA.announce.say(ctx.source.server, p, k)
            p.tell(Text.of('§8' + k + ': ' + (okd ? 'shown' : 'NOT shown - unknown pool, or the bar failed')))
            return 1
          }))
        .executes(function (ctx) {
          ctx.source.player.tell(Text.of('§8pools: §f' + VELDORA.announce.keys().join(', ')))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
