// ank.js — the stranger who lives in the caves, and does not want you in them.
//
// Ethan, 2026-09-05: *"Ank should spawn on the upper layers of the caves, he should be
// unkillable, and follow the player around until they hit the second layer. this is just
// intro behavior, he will have more later."* And: *"he should disappear when the player
// goes outside or too deep. with the words 'a chill runs up your spine' when he despawns."*
//
// ── ⭐ WHAT IS HERE, AND WHAT IS NOT ────────────────────────────────────────
// Almost none of Ank is in this file. He is a PRESET —
// `tools/make_npc_datapack.py` → `mcserver_npcs` — which owns his model, his skin, his
// unkillability and his following. That is Easy NPC's job and it does it without code.
//
// 🔑 THIS FILE OWNS EXACTLY ONE THING: THE BAND HE EXISTS IN. Spawn when the player is in
// the upper caves, leave when they surface or go deeper. Nothing else.
//
// ── 🔴 THE BAND, AND WHY THESE NUMBERS ──────────────────────────────────────
// `help.js` already tells the player the strata, so the game has committed to them:
//
//     0 to -32     the old diggings      <- Ank's band. "the upper layers"
//   -32 to -52     the deep works        <- "the second layer". He leaves.
//   -52 to floor   the sealed floor
//
// ⚠️ SO -32 IS NOT A NUMBER I PICKED. It is the boundary the game already names out loud,
// which makes it the only honest default — but it is a DESIGN number and it lives in
// `docs/ACT0.md`'s ledger, not only here.
//
// ── ⚠️ "OUTSIDE" IS SKY, NOT HEIGHT ─────────────────────────────────────────
// A player at y=70 in a cave under a mountain is not outside; one at y=-5 in a ravine open
// to the sky is. So the test is `canSeeSky`, the same one tide.js uses — and it returns
// NULL when it cannot be read, which is never treated as false. An unreadable sky must not
// silently despawn him.
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[ank] '
  var GATE = true

  // ⭐ ONE PRESET PER PRICE TIER, chosen at spawn. Ethan, 2026-09-05: *"is it possible
  // to stage the prices as expensive to start, getting cheaper?"*
  //
  // 🔑 IT COSTS NOTHING AT RUNTIME BECAUSE HE ALREADY RESPAWNS CONSTANTLY. He leaves
  // every time the player surfaces or goes deep, so the tier is simply which file to
  // spawn - no way to mutate a live merchant's offers is needed, and the mod may well
  // not have one.
  //
  // ⚠️ THE DRIVER IS DESCENTS, NOT DAYS, and that is the character of it. Every descent
  // is Ank losing the argument, so his next offer is better - the discount is EVIDENCE
  // that he is failing. A player who never goes down never sees him desperate at all,
  // which days would have given away for free.
  var PRESETS = [
    'arkhdottir/ank_t0',   // 0 descents - an ordinary merchant
    'arkhdottir/ank_t1',   // 1
    'arkhdottir/ank_t2',   // 2-3
    'arkhdottir/ank_t3',   // 4+  - openly desperate
  ]
  var TIER_AT = [0, 1, 2, 4]     // descents needed for each tier above

  function presetFor(p) {
    var n = 0
    try { if (VELDORA.urge && typeof VELDORA.urge.descents === 'function') n = VELDORA.urge.descents(p) } catch (e) { }
    var idx = 0
    for (var i = 0; i < TIER_AT.length; i++) if (n >= TIER_AT[i]) idx = i
    return PRESETS[Math.min(idx, PRESETS.length - 1)]
  }
  var TAG_NAME = 'veldora_ank'          // scoreboard tag, so we can find our own NPC
  var K_ACTIVE = 'veldora_ank_active'   // per-player: is he out with them right now

  // ── the band ───────────────────────────────────────────────────────────────
  // ⚠️ TOP IS NOT 0. The old diggings run from the surface down, and a cave mouth at y=40
  // is still the upper caves - "underground" is decided by the SKY test, not by height.
  // This is only the floor of his band.
  var TOO_DEEP = -32                    // help.js: the deep works begin here

  // ⭐ HYSTERESIS. Without it a player standing exactly on the boundary, or bobbing at a
  // cave mouth, spawns and despawns him every few seconds - and each despawn would fire
  // "a chill runs up your spine". A line that repeats on a loop stops being eerie and
  // becomes a bug you can see. He leaves at -32 and will not come back above -30.
  var COME_BACK = -30

  var CHECK_EVERY = 40                  // 2s. He is a presence, not a trap.

  // 🚨 THE LINE IS ETHAN'S, VERBATIM. Ank does not say it - it is not his voice, it is the
  // player's own body. So it goes through announce.js's AMBIENT priority, the "comes from
  // nobody" surface trespass.js uses, and NOT through voice.js, which colours by god and
  // would attribute the chill to a speaker.
  var CHILL = 'A chill runs up your spine.'

  // ── ⭐ HIS VOICE: THE CHAT BAR, LIKE ANY OTHER PERSON ─────────────────
  // Ethan, 2026-09-05: *"Nah, ank goes into the chat bar with a <Ank>: or however its
  // done in minecraft natively."*
  //
  // 🔴 THIS REPLACES AN OVERLAY VOICE THAT SHIPPED HOURS EARLIER. He was registered
  // through `cast.define` and typed above the hotbar - defensible, argued for at length,
  // and wrong. The gods own the overlay. Putting Ank on it made a man standing next to you
  // look like one more thing narrating at you, which is the opposite of the point: he is
  // the only person in Act 0 who is simply THERE.
  //
  // ⭐ SO THE FORMAT IS VANILLA'S, EXACTLY: `<Ank> text`. Not a colour, not a prefix of
  // our own, not a bracketed tag. Minecraft already has a way to show that a person said
  // something, every player knows how to read it, and it costs nothing to learn.
  //
  // ⚠️ ONE MESSAGE PER LINE HE WROTE, and no sentence-splitting. voice.js splits on
  // terminators because the OVERLAY shows one line at a time; chat is a scrollback and
  // wraps by itself. Splitting "Watcha buyin'. HA! Haaaa..." into four `<Ank>` lines would
  // invent a delivery Ethan did not write. His document already puts one utterance per
  // line, and that is the unit.
  var NAME = 'Ank'
  var K_GREET = 'veldora_ank_greet'  // world day + 1 of his last greeting. 0 means never.
  var BEAT = 25                      // ~1.25s between his lines. See the note on scheduling.

  function getInt(p, k) { try { return p.persistentData.getInt(k) } catch (e) { return 0 } }
  function putInt(p, k, v) { try { p.persistentData.putInt(k, v) } catch (e) { } }

  /**
   * What day is it. 🔑 ASKED OF urge.js, NEVER COMPUTED HERE.
   *
   * A local copy would be a SECOND CLOCK, and the urge escalates on the first one. Ank's
   * bribe working is what turns the urge up - the two systems argue through the day count,
   * so they have to agree on it. A drift of one day between them would read in game as the
   * escalation being wrong, and nothing would point here.
   */
  function dayOf(srv) {
    try {
      if (VELDORA.urge && typeof VELDORA.urge.dayOf === 'function') return VELDORA.urge.dayOf(srv)
    } catch (e) { }
    console.warn(TAG + 'urge.js has not published dayOf - there is no world clock, so he ' +
      'arrives without a greeting. This is a LOAD ORDER failure, not a quiet day.')
    return null
  }

  /** One chat line, in vanilla's own shape. Returns false if it could not be sent. */
  function chat(p, text) {
    try {
      p.tell(Text.of('<' + NAME + '> ' + String(text)))
      return true
    } catch (e) { console.warn(TAG + 'the chat line threw :: ' + e); return false }
  }

  /**
   * Say a run of lines, paced, to one player.
   *
   * ⚠️ THE FIRST LINE IS IMMEDIATE AND THE REST ARE SCHEDULED, and that is a deliberate
   * exposure. This project has been burned by scheduled chains before - the opening once
   * queued 18 callbacks and a restart killed all but two, which looked exactly like a
   * broken script. Here the whole run is under six seconds and the first line has already
   * landed, so a restart mid-greeting costs a tail, not the beat. ⛔ Do not grow this into
   * a long chain; if a scene ever needs one, it needs a resumable one.
   */
  function saySeq(srv, p, lines) {
    if (!lines || !lines.length) return 0
    var sent = chat(p, lines[0]) ? 1 : 0
    if (!sent) return 0
    for (var i = 1; i < lines.length; i++) {
      (function (text, n) {
        try { srv.scheduleInTicks(BEAT * n, function () { chat(p, text) }) }
        catch (e) { chat(p, text) }   // ⚠️ no scheduler - say it now rather than lose it
      })(lines[i], i)
    }
    return lines.length
  }

  // NEEDS-GAME: day 7 arrives as five <Ank> chat lines, paced, not one wall :: /ank greet 7
  // NEEDS-GAME: <Ank> is legible against the vanilla chat and reads as a person, not a system message :: /ank greet 4
  // NEEDS-GAME: his chat lines and the chill are visibly different surfaces :: /ank greet 2 then leave the band

  /**
   * The day's greeting, at most once per world day.
   *
   * ⚠️ RETURNS A REASON, not a boolean - the rule urge.js already follows. "he greeted",
   * "he greeted earlier today", "nobody has imported his lines" and "the clock is
   * unreadable" are four states and only two of them are faults.
   *
   * ⭐ THE DAY IS STAMPED ONLY IF SOMETHING WAS ACTUALLY SAID. Stamping first would mean a
   * cast layer that failed silently costs him the whole day, and the next spawn would
   * report `greeted-today` about a greeting nobody heard.
   */
  function greet(srv, p) {
    var L = VELDORA.ankLines
    if (!L || typeof L.forDay !== 'function') {
      console.warn(TAG + 'ank_lines.js is missing - he arrives MUTE. Run ' +
        '`python tools/ank_dialogue_import.py --write`.')
      return 'no-lines'
    }
    var day = dayOf(srv)
    if (day === null) return 'unreadable'
    if (getInt(p, K_GREET) === day + 1) return 'greeted-today'

    var got = L.forDay(day)
    var lines = (got && got.lines) || []
    var src = (got && got.source) || '?'
    // 🔑 AN EMPTY POOL IS NOT AN ERROR HERE and it is not silence either. It means the
    // rotation itself is empty, which the importer would have to have produced.
    if (!lines.length) return 'empty:' + src

    var said = saySeq(srv, p, lines)
    if (!said) {
      console.error(TAG + 'he had ' + lines.length + ' line(s) for day ' + day +
        ' and delivered NONE - the cast layer is not carrying him. Not stamping the day.')
      return 'mute'
    }
    putInt(p, K_GREET, day + 1)
    return 'spoke:' + src + ':' + said
  }

  function seesSky(p) {
    try {
      var lvl = p.level
      if (lvl && typeof lvl.canSeeSky === 'function') return !!lvl.canSeeSky(p.blockPosition())
      var b = p.block
      if (b && typeof b.canSeeSky === 'boolean') return !!b.canSeeSky
      if (b && typeof b.canSeeSky === 'function') return !!b.canSeeSky()
    } catch (e) { }
    return null                        // ⛔ unreadable. NEVER guess - see below.
  }

  function yOf(p) {
    try { var y = p.y; if (typeof y === 'number' && isFinite(y)) return y } catch (e) { }
    return null
  }

  /**
   * Should Ank be out with this player?
   *
   * ⚠️ TRI-STATE, DELIBERATELY. `null` means "cannot tell", and the caller does NOTHING
   * on null rather than despawning. "I could not read the sky" and "the player is outside"
   * are different events, and letting them share a return value is how this project's
   * worst bugs have looked: fail-soft hiding total failure.
   */
  function shouldBeOut(p) {
    var y = yOf(p)
    if (y === null) return null
    var sky = seesSky(p)
    if (sky === null) return null
    if (sky) return false               // outside
    if (y < TOO_DEEP) return false      // too deep
    return true
  }

  function isActive(p) {
    try { return !!p.persistentData.getBoolean(K_ACTIVE) } catch (e) { return false }
  }
  function setActive(p, v) {
    try { p.persistentData.putBoolean(K_ACTIVE, !!v) } catch (e) { }
  }

  // ── his body ───────────────────────────────────────────────────────────────
  // ⚠️ FOUND BY TAG, NOT BY TYPE. `@e[type=easy_npc:humanoid]` would also match every other
  // humanoid NPC this project ever adds, and the first one of those would be despawned by
  // Ank's boundary check with nothing to explain it.
  function spawn(srv, p) {
    try {
      srv.runCommandSilent('execute at ' + p.username +
        ' run easy_npc spawn ' + presetFor(p) + ' ~ ~ ~')
      // Tag whatever just appeared nearest to the player, so the boundary check can find
      // him again. ⚠️ Runs as a separate command because the spawn does not return a handle.
      srv.runCommandSilent('execute at ' + p.username +
        ' run tag @e[type=easy_npc:humanoid,limit=1,sort=nearest,distance=..8] add ' + TAG_NAME)
      return true
    } catch (e) {
      console.error(TAG + 'spawn failed for ' + p.username + ' :: ' + e)
      return false
    }
  }

  function despawn(srv, p) {
    try {
      srv.runCommandSilent('execute at ' + p.username +
        ' run kill @e[tag=' + TAG_NAME + ',distance=..96]')
      return true
    } catch (e) {
      console.error(TAG + 'despawn failed for ' + p.username + ' :: ' + e)
      return false
    }
  }

  // ⚠️ `kill` ON AN INVULNERABLE ENTITY IS THE OPEN QUESTION. Vanilla /kill bypasses
  // invulnerability for most entities, but Easy NPC has its own damage handling and the
  // preset sets Invulnerable:1b. If he survives this, the fallback is
  // `easy_npc despawn` - which is why that command exists in the mod.
  // NEEDS-GAME: kill removes an Invulnerable Easy NPC, or we need `easy_npc despawn` :: /ank test

  function chill(srv, p) {
    try {
      if (!VELDORA.announce || typeof VELDORA.announce.text !== 'function') {
        console.warn(TAG + 'announce.js is missing - he leaves in SILENCE, which is a ' +
          'failure and not a quiet exit')
        return false
      }
      return VELDORA.announce.text(srv, p, CHILL, VELDORA.announce.P_AMBIENT)
    } catch (e) { console.warn(TAG + 'the chill threw :: ' + e); return false }
  }

  // ── the sweep ──────────────────────────────────────────────────────────────
  function consider(srv, p) {
    var want = shouldBeOut(p)
    if (want === null) return 'unreadable'   // ⛔ do nothing. See shouldBeOut.
    var out = isActive(p)

    // ⭐ HYSTERESIS, AND IT HAS TO BE CHECKED **BEFORE** THE SPAWN BRANCH.
    //
    // 🔴 IT WAS BELOW IT FIRST AND WAS THEREFORE DECORATIVE: at y=-31 `want` is already
    // true, so the spawn branch fired and the gap check was never reached. A player
    // bobbing on the boundary got him back one block up, and the two-block band did
    // nothing at all. The harness caught it; nothing in game would have, because the
    // symptom is a line repeating and that reads as a design choice.
    //
    // Between TOO_DEEP and COME_BACK he is neither spawned nor despawned. You have to
    // climb properly clear before he returns.
    if (!out) {
      var gy = yOf(p)
      if (gy !== null && gy < COME_BACK && gy >= TOO_DEEP) return 'in-the-gap'
    }

    if (want && !out) {
      if (!spawn(srv, p)) return 'spawn-failed'
      setActive(p, true)
      // ⭐ HE GREETS ON ARRIVAL, AND ONLY THE FIRST ARRIVAL OF EACH WORLD DAY. He respawns
      // every time the player surfaces or dips below the boundary, so an ungated greeting
      // would fire several times an hour and the written days would stop being days.
      var g = greet(srv, p)
      console.info(TAG + p.username + ' - Ank steps out (y ' + Math.round(yOf(p)) +
        ', ' + presetFor(p) + ', greeting: ' + g + ')')
      return 'spawned'
    }

    if (!want && out) {
      // ⭐ THE CHILL FIRES WHETHER OR NOT THE BODY WENT. A despawn that failed and a
      // despawn that worked look the same to the player, and the line is the beat - but
      // the LOG must tell them apart, or a stuck Ank is invisible.
      var gone = despawn(srv, p)
      setActive(p, false)
      chill(srv, p)
      if (!gone) console.warn(TAG + p.username + ' - the chill fired but the despawn FAILED')
      else console.info(TAG + p.username + ' - Ank is gone (y ' + Math.round(yOf(p)) + ')')
      return gone ? 'despawned' : 'despawn-failed'
    }

    return out ? 'with-you' : 'away'
  }

  VELDORA.ank = {
    consider: consider,
    shouldBeOut: shouldBeOut,
    isActive: isActive,
    greet: greet,
    dayOf: dayOf,
    NAME: NAME,
    chat: chat,
    presetFor: presetFor,
    presets: PRESETS,
    TOO_DEEP: TOO_DEEP,
    COME_BACK: COME_BACK,
    CHILL: CHILL,
  }

  ServerEvents.tick(function (event) {
    if (!GATE) return
    var srv = event.server
    if (!srv) return
    if (srv.tickCount % CHECK_EVERY !== 0) return
    try {
      var ps = srv.players
      for (var i = 0; i < ps.length; i++) {
        // ⛔ ACT 0 ONLY. A player who has taken a path is past him; Ank is the stranger
        // you meet BEFORE anybody knows you exist.
        var path = null
        try { if (VELDORA.paths && VELDORA.paths.pathOf) path = VELDORA.paths.pathOf(ps[i]) } catch (e) { }
        if (path) continue
        try { consider(srv, ps[i]) } catch (e) { }
      }
    } catch (e) { }
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    var root = Commands.literal('ank').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var want = shouldBeOut(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7y §f' + Math.round(yOf(p)) + '§7 · sky §f' + String(seesSky(p)) +
        '§7 · band ends at §f' + TOO_DEEP))
      p.tell(Text.of('§7should be out: §f' +
        (want === null ? '§cUNREADABLE - nothing will happen' : String(want))))
      p.tell(Text.of('§7active: §f' + isActive(p)))
      p.tell(Text.of('§8/ank test §7sweep · §8/ank greet §7re-arm today · ' +
        '§8/ank greet <day> §7read a day out loud · §8/ank clear §7forget him'))
      return 1
    })

    root = root.then(Commands.literal('test').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      p.tell(Text.of('§7' + consider(ctx.source.server, p)))
      return 1
    }))

    // ⭐ THE ONLY WAY TO SEE HIS WRITING WITHOUT PLAYING A WEEK. Days 2, 4 and 7 are
    // the written ones; everything else falls to the rotation, and both need looking at
    // on a real screen because the day-7 line is FIVE sentences and arrives as five beats.
    root = root.then(Commands.literal('greet')
      .then(Commands.argument('day', event.arguments.INTEGER.create(event)).executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        var d = 0
        try { d = ctx.getArgument('day', Java.loadClass('java.lang.Integer')) }
        catch (e) { p.tell(Text.of('§cunreadable day argument')); return 0 }
        var got = VELDORA.ankLines ? VELDORA.ankLines.forDay(d) : null
        if (!got || !got.lines.length) {
          p.tell(Text.of('§cnothing for day ' + d + ' - and the rotation is empty too'))
          return 0
        }
        p.tell(Text.of('§7day §f' + d + '§7 · source §f' + got.source +
          '§7 · §f' + got.lines.length + '§7 beat(s)'))
        saySeq(ctx.source.server, p, got.lines)
        return 1
      }))
      .executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        // ⚠️ Clears the stamp rather than speaking, so the NEXT arrival greets. Speaking
        // here would prove the words render and NOT that the once-a-day gate opens.
        putInt(p, K_GREET, 0)
        p.tell(Text.of('§7greeting re-armed - he will greet on his next arrival.'))
        p.tell(Text.of('§8/ank greet <day> §7read a specific day out loud'))
        return 1
      }))

    root = root.then(Commands.literal('clear').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      despawn(ctx.source.server, p)
      setActive(p, false)
      p.tell(Text.of('§7forgotten - he will step out again next time you are in the band.'))
      return 1
    }))

    event.register(root)
  })

  ServerEvents.loaded(function () {
    // ⛔ NO SPEAKER REGISTRATION. He is not on the overlay - see HIS VOICE above.
    // A `cast.define` for Ank stood here for one commit; it is gone rather than left
    // gated, because a registered voice with no caller is exactly the shadow-build
    // this project keeps catching itself doing.
    var written = 0, general = 0
    try {
      if (VELDORA.ankLines) {
        written = VELDORA.ankLines.written()
        general = (VELDORA.ankLines.general || []).length
      }
    } catch (e) { }
    console.info(TAG + 'Ank is live. Upper caves only, above y' + TOO_DEEP +
      ', pathless players only. ' + PRESETS.length + ' price tiers, driven by descents; ' +
      'this file owns the band he exists in and the greeting he gives on arriving, ' +
      'in the CHAT BAR as <' + NAME + '>. ' +
      written + ' written day(s) + ' + general + ' rotation quote(s); a day with nothing ' +
      'written falls through to the rotation ON PURPOSE.')
  })
})();
