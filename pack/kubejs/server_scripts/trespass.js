// trespass.js — the Nether and the End tell you, and nobody is talking.
//
// Ethan, 2026-08-24:
//     "we need to keep end and nether biomes in? Fine, we can add an ambient line of
//      how wrong those dimensions feel and you don't belong here."
//
// ── 🔑 THE CRITICAL PROPERTY: THESE HAVE NO SPEAKER ────────────────────────────
// Every other line in this game comes from a named god with an authored register.
// Blade commands. Wall drops her g's. Salvage coaxes. These come from NOBODY.
//
// 🚨 THAT IS THE ENTIRE EFFECT AND IT MUST NOT BE ERODED. The moment one of these is
// attributed to a patron, the Nether becomes another place a god can REACH you - which
// is the exact opposite of what they are for. **Nobody is talking to you. The place is
// just true.**
//
// ⛔ So this deliberately does NOT go through voice.js: that module colours by god and
// every caller names one. WHITE - no colour code at all - is the only unowned colour in
// the pack (§b art, §2 forge, §6 salvage, §5 wall, §4 blade, §8 the depths, §e the
// yellow persona). Nobody owns white, which is exactly why it is right.
//
// ── ⭐ DELIVERY: A BOSS BAR, NOT CHAT ──────────────────────────────────────────
// Ethan, 2026-08-29: *"part of me wants to put all god dialogue in shaking stylzied
// text on the top of the player's screen if possible."*
//
// The boss bar IS the top of the screen, and it is the only element up there the server
// can drive. This file is the PROTOTYPE for that question: a small pool, no speaker, and
// a bar with no name on it is exactly right for a line from nobody. If it reads well
// here, the same channel can carry the gods.
//
// ⚠️ THERE IS NO SHAKE IN VANILLA. Text components carry colour, bold, italic,
// obfuscated and font - there is NO field that animates position. Probed 2026-08-29:
// the server ACCEPTED {"text":"x","shake":true}, because unknown component fields are
// silently dropped. That probe proved nothing, exactly like /playsound.
//
// 🔑 So the wobble here is real but it is a FAKE: the bar name is re-sent every few
// ticks with uneven padding, and because bar text is centred, uneven padding shifts it
// a few pixels. It is a whole-line tremor, NOT per-glyph shake. Undertale-style
// per-character motion is a client renderer feature and no server-side route reaches it.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[trespass] '
  var GATE = true

  // ── the lines ────────────────────────────────────────────────────────────────
  // Ethan's writing. Touched up 2026-08-29 at his instruction ("those were rough
  // drafts") - punctuation regularised and two comma splices broken into beats. ⚠️ No
  // line was added, removed, or reworded beyond that: the pool size is his and every
  // image is his.
  //
  // ⭐ THE NETHER ESCALATES: distant -> internal -> specific -> verdict, ending on the
  // flattest possible statement of fact. "You are afraid." is UNTOUCHED; it is the best
  // line in either set and it works precisely because it explains nothing.
  var NETHER = [
    'You hear the distant echo of raging gods.',
    'You feel a wrongness, deep in your soul.',
    'You hear a girl scream. A fight. A murder. Then silence.',
    'You are afraid.',
  ]

  // ⭐ THE END DOES NOT ESCALATE - it circles, and one line ASKS YOU A QUESTION, which
  // nothing else in the ambient layer does. Two dimensions, two different kinds of wrong.
  //
  // "Something comes from here" points at the existing bestiary: the End is not framed
  // as alien, it is framed as the SOURCE of things already familiar, which is worse.
  var END = [
    'You are uncomfortable.',
    'Something comes from here. You have fought it many times.',
    'Run.',
    'What do you seek here?',
  ]

  // ⚠️ "You hear a girl scream" is the only line in either set that describes an EVENT
  // rather than a feeling, and it reads as book canon. docs/69 flags it to be checked
  // against the Caebrim / Kayer / Mera / Gregor material (58-61) before anything is
  // built on top of it. Nothing here references it. Keep it that way until he rules.

  // ── cadence ──────────────────────────────────────────────────────────────────
  // ⚠️ DELIBERATELY MUCH SLOWER THAN idle.js, which rolls 20% per 60s with a 90s floor.
  // At that rate a four-line pool is exhausted and repeating inside a single Nether
  // trip. At 8% with a four-minute floor a typical visit yields one or two lines.
  var CHANCE = 0.08
  var SWEEP = 1200              // 60s between rolls
  var FLOOR_MS = 240000         // 4 min hard floor per player

  var SHOW_TICKS = 90           // 4.5s on screen
  var SHAKE = true
  var SHAKE_TICKS = 3           // re-send cadence for the tremor

  var state = {}                // uuid -> { last, lastLine, epoch }
  var dimReadOk = null          // null = undetermined, false = broken AND IT SAID SO
  var cmdWarned = false

  // ── reading the dimension ────────────────────────────────────────────────────
  // ⚠️ NO PRECEDENT IN THIS PACK - nothing else reads a dimension id, so the exact
  // accessor is unverified API surface. Getting it wrong would leave this layer
  // silently inert forever, which is the failure class this project keeps hitting.
  //
  // 🔑 So: try the plausible shapes, stringify whatever comes back, and SUBSTRING
  // MATCH. That sidesteps the shape entirely - "minecraft:the_nether" is found whether
  // the accessor returns a plain id or a ResourceKey[...] wrapper. Remember P6a:
  // server.overworld() is a METHOD, and a property read there returns undefined rather
  // than throwing, so a method may well be hiding here too.
  function dimText(p) {
    var v = null
    try { v = p.level.dimension } catch (e) { }
    if (typeof v === 'function') { try { v = p.level.dimension() } catch (e) { v = null } }
    if (v === null || v === undefined) { try { v = p.level.dimensionKey } catch (e) { } }
    if (v === null || v === undefined) { try { v = p.level.dimensionType } catch (e) { } }
    if (v === null || v === undefined) return null
    var s = null
    try { s = String(v) } catch (e) { return null }
    if (!s || s === 'undefined' || s === 'null') return null
    return s
  }

  // Returns 'nether', 'end', or null. 🚨 A null means EITHER "somewhere else" OR "could
  // not read", so the unreadable case is separated out and SHOUTS ONCE - because
  // "I failed" and "I found nothing" must never look the same from outside.
  function dimOf(p) {
    var s = dimText(p)
    if (s === null) {
      if (dimReadOk !== false) {
        dimReadOk = false
        console.warn(TAG + 'CANNOT READ A PLAYER DIMENSION. The trespass layer is INERT ' +
          'and will stay silent - this is a FAILURE, not "nobody went to the Nether".')
      }
      return null
    }
    if (dimReadOk === null) {
      dimReadOk = true
      console.info(TAG + 'dimension reads as "' + s + '" - the accessor works.')
    }
    if (s.indexOf('minecraft:the_nether') !== -1) return 'nether'
    if (s.indexOf('minecraft:the_end') !== -1) return 'end'
    return null
  }

  function poolFor(where) {
    if (where === 'nether') return NETHER
    if (where === 'end') return END
    return null
  }

  // ── the bar ────────────────────────────────────────────────
  // ⭐ MOVED TO announce.js, 2026-08-29 (G1). This file wrote the bar first; the
  // announcement layer needs the identical mechanism, and two copies of a tremor loop
  // would have drifted the first time one was tuned.
  //
  // 🔑 AMBIENT PRIORITY, NOT ANNOUNCEMENT PRIORITY. A trespass line is atmosphere;
  // a tide warning is a promise about the next ten seconds. If both are due, the
  // warning must win, and this call is what makes that true rather than a race.
  function show(server, p, text) {
    try {
      if (!VELDORA.announce || typeof VELDORA.announce.text !== 'function') {
        console.warn(TAG + 'announce.js is missing - the trespass layer is INERT. ' +
          'This is a FAILURE, not a quiet Nether.')
        return false
      }
      return VELDORA.announce.text(server, p, text, VELDORA.announce.P_AMBIENT)
    } catch (e) {
      console.warn(TAG + 'the bar threw :: ' + e)
      return false
    }
  }

  // ── the roll ─────────────────────────────────────────────────────────────────
  function pick(pool, lastIdx) {
    if (pool.length <= 1) return 0
    var i = Math.floor(Math.random() * pool.length)
    if (i === lastIdx) i = (i + 1) % pool.length   // never the same line twice running
    return i
  }

  function consider(server, p) {
    if (!GATE) return
    var where = dimOf(p)
    if (!where) return
    var pool = poolFor(where)
    if (!pool) return
    var key = String(p.uuid)
    var st = state[key]
    if (!st) { st = state[key] = { last: 0, lastLine: -1, epoch: 0 } }
    var now = Date.now()
    if (st.last && (now - st.last) < FLOOR_MS) return
    if (Math.random() >= CHANCE) return
    var idx = pick(pool, st.lastLine)
    st.lastLine = idx
    st.last = now
    show(server, p, pool[idx])
  }

  function sweep(server) {
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        try { consider(server, ps[i]) } catch (e) { }
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    try { server.scheduleInTicks(SWEEP, function () { sweep(server) }) } catch (e) { }
  }

  // ── ⭐ EVERYONE HEARS THEM, AND THEY DO NOT VARY BY PATH ─────────────────────
  // They are about the PLACE, not about you: a pathless player trespassing is just as
  // much a trespasser. And a line with no speaker should not know who you follow.
  // 🚨 There is no path check anywhere in this file, on purpose. Do not add one.

  VELDORA.trespass = {
    fire: function (server, p, where) {
      var pool = poolFor(where)
      if (!pool) return false
      var st = state[String(p.uuid)]
      if (!st) { st = state[String(p.uuid)] = { last: 0, lastLine: -1, epoch: 0 } }
      var idx = pick(pool, st.lastLine)
      st.lastLine = idx
      return show(server, p, pool[idx])
    },
    dimOf: dimOf,
    dimText: dimText,
    lines: function (where) { return poolFor(where) },
    enabled: function () { return GATE },
    _pick: pick,
    _consider: consider,
  }

  ServerEvents.loaded(function (event) {
    try { sweep(event.server) } catch (e) { console.warn(TAG + 'could not start :: ' + e) }
    console.info(TAG + 'THE TRESPASS LAYER live - ' + NETHER.length + ' Nether lines, ' +
      END.length + ' End lines, NO SPEAKER, ' + Math.round(CHANCE * 100) + '% per ' +
      Math.round(SWEEP / 20) + 's with a ' + Math.round(FLOOR_MS / 60000) + ' min floor. ' +
      'Delivered on the announce.js bar at AMBIENT priority - a tide warning ' +
      'outranks it.')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    try {
      event.register(Commands.literal('trespass')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .then(Commands.literal('nether').executes(function (ctx) {
          var p = ctx.source.player
          p.tell(Text.of('§8fired: ' + (VELDORA.trespass.fire(ctx.source.server, p, 'nether') ? 'yes' : 'NO - the bar failed')))
          return 1
        }))
        .then(Commands.literal('end').executes(function (ctx) {
          var p = ctx.source.player
          p.tell(Text.of('§8fired: ' + (VELDORA.trespass.fire(ctx.source.server, p, 'end') ? 'yes' : 'NO - the bar failed')))
          return 1
        }))
        .executes(function (ctx) {
          var p = ctx.source.player
          p.tell(Text.of('§8you are reading as: §f' + (dimText(p) || 'UNREADABLE')))
          p.tell(Text.of('§8which resolves to: §f' + (dimOf(p) || 'neither')))
          p.tell(Text.of('§8/trespass nether §7| §8/trespass end'))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
