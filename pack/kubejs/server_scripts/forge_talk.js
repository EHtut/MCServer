// forge_talk.js — she asks what you're making, and you have to charm her.
//
// `docs/67`, Ethan's tree verbatim:
//
//     "Whatcha crafting"                          Truthfully FAIL · Lie     PASS
//     "What if you made a gun?"                   Wonder     PASS · Rebuff  FAIL
//     "I used to have a gun, and a horse."        Ask more   FAIL · ignore  PASS
//     "I wonder why they made me what I am..."    Marvel     PASS · Question FAIL
//     "You can craft, we can craft..."            Agree      PASS · Disagree FAIL
//
// ── ⭐ SHE DOES NOT CUTSCENE YOU. THAT IS A DESIGN CONSTRAINT, NOT A NOTE ──────
// `docs/67`: *"She does **not** cutscene you. She just repeatedly asks what you plan on
// crafting."* So this deliberately does NOT use `ritual.js` — that primitive blinds the
// player and holds the world still, which is exactly the wrong texture for the one god
// who talks to you while you are busy. It borrows only ritual's INPUT idea: clickable
// chat options. The world keeps running the whole time.
//
// ── 🔑 WHY THE ANSWERS ARE FAIR ───────────────────────────────────────────────
// The passing line is **Lie · Wonder · ignore · Marvel · Agree**.
//
// She does not want a truthful, curious, probing interlocutor. She wants somebody who
// plays along, wonders with her, does not pry into what she lost, marvels rather than
// interrogates, and agrees to build. That is *"appeal to her nature"* — she is the god
// whose whole FORCED column is generous, who never thanks you and never punishes you,
// and who is lonely enough to ask a stranger what they are making.
//
// ⭐ LEGIBLE IN RETROSPECT, OPAQUE IN ADVANCE. A player who has read her other lines has
// a real advantage; a player optimising will guess "be honest, ask questions, engage"
// and fail on the very first prompt.
//
// ⚠️ THE TRAP IS PROMPT 3. *"I used to have a gun, and a horse"* is the only line where
// she volunteers something about herself, and the generous-seeming answer — asking more
// — is the failure. She is not offering. She is checking whether you will push.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[forgetalk] '
  var GATE = true
  var COLOUR = '§2§l'               // hers, from arrival.js

  var NIGHTS_NEEDED = 6             // "after the 6th night"
  var BENCH = 'minecraft:crafting_table'
  var BENCH_R = 3                   // blocks; "at a crafting bench"

  // ⚠️ PER PROMPT, NOT PER CONVERSATION. `docs/67` rules this explicitly: five prompts
  // at five minutes each is a 25-minute ceiling, while a whole-conversation timer would
  // punish somebody who walked away once. The forgiving reading is the correct one.
  var ANSWER_TICKS = 6000           // 5 min

  // ⭐ DAYS, not one-attempt-ever and not next-night. The tree is deliberately opaque,
  // so first-try failure is the EXPECTED outcome - making it permanent would turn the
  // most characterful entry condition in the game into a coin flip nobody learns from.
  // Long enough that brute-forcing all 32 combinations is not a weekend's work.
  var RETRY_DAYS = 3
  var RETRY_TICKS = RETRY_DAYS * 24000

  var K_LAST = 'veldora_forge_talk_last'   // dayTime stamp of the last attempt
  var K_WON = 'veldora_forge_charmed'      // she said yes. chosen.js reads it

  var SWEEP = 100                   // 5s

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 ETHAN'S TREE, VERBATIM. The five prompts are his words and the pass/fail
  // mapping is his. ⛔ Do not reorder, do not soften prompt 3, and do not add a
  // sixth - 2^5 = the 32 combinations `docs/67` prices the cooldown against.
  //
  // ⚠️ [CLAUDE-DRAFT] applies ONLY to the option LABELS. His spec names the intent
  // ("Lie", "Wonder", "ignore") rather than the words a player clicks, so the labels
  // below are scaffolding in her register; the prompts are not.
  //
  // [CLAUDE-DRAFT] forge/talk_labels
  // ═══════════════════════════════════════════════════════════════════════════
  var TREE = [
    { ask: "Whatcha craftin'?",
      pass: "Somethin' I shouldn't be.",            // Lie
      fail: "Nothing much. Just tools." },          // Truthfully
    { ask: "What if you made a gun?",
      pass: "...huh. Could you?",                   // Wonder
      fail: "That's not really my thing." },        // Rebuff
    { ask: "I used to have a gun, an' a horse.",
      pass: "So anyway - the tools.",               // ignore  ⚠️ THE TRAP
      fail: "What happened to them?" },             // Ask more
    { ask: "I wonder why they made me what I am today. I haven't crafted a darn thing " +
        "across my entire life.",
      pass: "An' you still know how it all works.",  // Marvel
      fail: "Then who made all of this?" },          // Question
    { ask: "You can craft, we can craft. We can make this world somethin' the gods " +
        "above would envy.",
      pass: "Let's build it.",                       // Agree
      fail: "They'd just take it." },                // Disagree
  ]

  var WON = [
    "- HA! Yeah. Yeah, alright. You'll do.",
    "Okay. Okay okay okay. You're mine now, is that alright? It's alright.",
  ]
  var LOST = [
    "- oh. Hm. No, that's - no.",
    "Mm. Never mind. I'll ask somebody else.",
  ]
  var TIMEOUT = [
    "...you still there? No. Okay.",
    "Guess you wandered off. That's fair, I do that.",
  ]

  var talking = {}                  // uuid -> { step, deadline, server }

  function say(p, s) {
    try {
      if (VELDORA.garble && typeof VELDORA.garble.line === 'function') {
        // ⭐ She is talking to somebody with NO GOD, so she arrives broken like the
        // rest of the pathless track. See garble.js.
        p.tell(Text.of(COLOUR + VELDORA.garble.line(s, COLOUR)))
        return
      }
      p.tell(Text.of(COLOUR + s))
    } catch (e) { }
  }

  function pathless(p) {
    try {
      if (VELDORA.paths && typeof VELDORA.paths.pathOf === 'function') {
        var path = VELDORA.paths.pathOf(p)
        // 🔴 `typeof path !== 'string'` WAS HERE AND IT BROKE EVERY GODLESS CHECK.
        // paths.pathOf returns persistentData.getString(...) - a JAVA String - and in
        // Rhino `typeof javaString` is "object". This returned null for every player
        // alive, so `/deal`, `/artdeal` and `/forgetalk` all read "godless: UNREADABLE"
        // and none of the three gods would ever have offered anything on its own.
        //
        // ⚠️ I ADDED THAT CHECK TO BE DEFENSIVE and it WAS the bug. The harness stayed
        // green because its mock returns a real JS string - Node is not the engine, in
        // the mocks as much as in the syntax.
        if (path === null || path === undefined) return null
        return String(path) === ''
      }
    } catch (e) { }
    return null
  }

  function nights(p) {
    try {
      if (VELDORA.night && typeof VELDORA.night.nightsFor === 'function') {
        return VELDORA.night.nightsFor(p)
      }
    } catch (e) { }
    return null                     // unreadable, NOT zero
  }

  // ⚠️ `level.getBlock(x, y, z)` - the idiom spawner.js and stalker.js both use, rather
  // than an invented BlockEvents hook. A wrong event name reads as undefined and would
  // make her silently never speak.
  function atBench(p) {
    try {
      var lvl = p.level
      if (!lvl || typeof lvl.getBlock !== 'function') return null
      var bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z)
      for (var dx = -BENCH_R; dx <= BENCH_R; dx++) {
        for (var dy = -1; dy <= 2; dy++) {
          for (var dz = -BENCH_R; dz <= BENCH_R; dz++) {
            var b = lvl.getBlock(bx + dx, by + dy, bz + dz)
            if (b && String(b.id) === BENCH) return true
          }
        }
      }
      return false
    } catch (e) { return null }
  }

  function won(p) {
    try { return (p.persistentData.getInt(K_WON) || 0) > 0 } catch (e) { return false }
  }

  function onCooldown(server, p) {
    try {
      var now = server.overworld().dayTime()
      var last = p.persistentData.getInt(K_LAST) || 0
      if (!last) return false
      return (now - last) < RETRY_TICKS
    } catch (e) { return true }     // cannot read the clock -> do not start
  }

  function eligible(server, p) {
    if (!GATE) return false
    if (won(p)) return false
    if (talking[String(p.uuid)]) return false
    if (pathless(p) !== true) return false
    var n = nights(p)
    if (n === null || n < NIGHTS_NEEDED) return false
    if (onCooldown(server, p)) return false
    return atBench(p) === true
  }

  // ── the conversation ─────────────────────────────────────────────────────────
  function ask(server, p) {
    var st = talking[String(p.uuid)]
    if (!st) return
    var node = TREE[st.step]
    if (!node) return
    say(p, node.ask)

    // ⚠️ clickRunCommand ONLY. ritual.js records that `.click(String)` throws a
    // Throwable which escapes the JS catch and takes the whole command with it.
    var order = (Math.random() < 0.5)
    var opts = order ? [node.pass, node.fail] : [node.fail, node.pass]
    st.map = order ? ['pass', 'fail'] : ['fail', 'pass']
    for (var i = 0; i < opts.length; i++) {
      var line = Text.of('  §f§n' + opts[i])
      try { line = line.clickRunCommand('/forgetalk pick ' + (i + 1)) } catch (e) {
        console.error(TAG + 'clickRunCommand failed - the options are unclickable :: ' + e)
      }
      try { p.tell(line) } catch (e) { }
    }

    st.deadline = ANSWER_TICKS
    st.awaiting = true
  }

  function begin(server, p) {
    var k = String(p.uuid)
    if (talking[k]) return false
    talking[k] = { step: 0, awaiting: false, deadline: ANSWER_TICKS, map: null }
    try { p.persistentData.putInt(K_LAST, server.overworld().dayTime()) } catch (e) { }
    console.info(TAG + p.username + ' - she has started asking. ' + TREE.length +
      ' prompts, ' + (ANSWER_TICKS / 20) + 's each.')
    ask(server, p)
    return true
  }

  function finish(server, p, how) {
    var k = String(p.uuid)
    delete talking[k]
    if (how === 'won') {
      try { p.persistentData.putInt(K_WON, 1) } catch (e) { }
      say(p, WON[Math.floor(Math.random() * WON.length)])
      console.info(TAG + p.username + ' CHARMED HER - forge unlocks on the next sweep.')
      return
    }
    say(p, (how === 'timeout' ? TIMEOUT : LOST)[Math.floor(Math.random() * 2)])
    console.info(TAG + p.username + ' failed her (' + how + ') - she will not ask again ' +
      'for ' + RETRY_DAYS + ' day(s).')
  }

  function pick(server, p, idx) {
    var k = String(p.uuid)
    var st = talking[k]
    if (!st || !st.awaiting) { try { p.tell(Text.of('§8She is not asking you anything.')) } catch (e) { } ; return false }
    var which = st.map && st.map[idx - 1]
    if (!which) return false

    // Consume FIRST. ritual.js paid for this: a double-click on an option a player is
    // not sure registered runs the branch twice.
    st.awaiting = false

    if (which === 'fail') { finish(server, p, 'wrong'); return true }
    st.step++
    if (st.step >= TREE.length) { finish(server, p, 'won'); return true }
    ask(server, p)
    return true
  }

  function sweep(server) {
    try {
      var ps = server.players
      var i
      // Tick the timers of anyone mid-conversation.
      for (i = 0; i < ps.length; i++) {
        var p = ps[i]
        var st = talking[String(p.uuid)]
        if (!st) continue
        if (!st.awaiting) continue
        st.deadline -= SWEEP
        if (st.deadline <= 0) {
          try { finish(server, p, 'timeout') } catch (e) { }
        }
      }
      // And see whether she wants to start on anybody.
      for (i = 0; i < ps.length; i++) {
        try {
          if (!eligible(server, ps[i])) continue
          begin(server, ps[i])
        } catch (e) { }
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    try { server.scheduleInTicks(SWEEP, function () { sweep(server) }) } catch (e) { }
  }

  // Anyone who logs out mid-conversation loses it - and the attempt is already
  // stamped, so it costs them the cooldown. That is correct: walking away IS a
  // non-answer, and the timeout would have done the same thing a few minutes later.
  PlayerEvents.loggedOut(function (event) {
    try { delete talking[String(event.player.uuid)] } catch (e) { }
  })

  VELDORA.forgetalk = {
    charmed: won,
    tree: TREE,
    nightsNeeded: NIGHTS_NEEDED,
    retryDays: RETRY_DAYS,
    answerTicks: ANSWER_TICKS,
    begin: begin,
    pick: pick,
    eligible: eligible,
    enabled: function () { return GATE },
    _atBench: atBench,
    _nights: nights,
    _pathless: pathless,
    _talking: talking,
    _finish: finish,
  }

  ServerEvents.loaded(function (event) {
    try { sweep(event.server) } catch (e) { console.warn(TAG + 'could not start :: ' + e) }
    console.info(TAG + 'her conversation is live - godless, at a ' + BENCH + ', after ' +
      NIGHTS_NEEDED + ' nights. ' + TREE.length + ' prompts, ' + (ANSWER_TICKS / 20) +
      's PER PROMPT, one wrong answer ends it, and she will not ask again for ' +
      RETRY_DAYS + ' day(s). She does NOT cutscene you.')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    try {
      event.register(Commands.literal('forgetalk')
        .then(Commands.literal('pick')
          .then(Commands.argument('n', event.arguments.INTEGER.create(event))
            .executes(function (ctx) {
              var p = ctx.source.player
              if (!p) return 0
              var n = 1
              try { n = ctx.getArgument('n', Java.loadClass('java.lang.Integer')) } catch (e) { }
              pick(ctx.source.server, p, n)
              return 1
            })))
        .then(Commands.literal('start')
          .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
          .executes(function (ctx) {
            var p = ctx.source.player
            if (!p) return 0
            if (!begin(ctx.source.server, p)) p.tell(Text.of('§8already talking to her'))
            return 1
          }))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var pl = pathless(p)
          p.tell(Text.of('§8godless: §f' + (pl === null ? 'UNREADABLE' : pl)))
          p.tell(Text.of('§8nights: §f' + nights(p) + '§8 / ' + NIGHTS_NEEDED))
          p.tell(Text.of('§8at a bench: §f' + atBench(p)))
          p.tell(Text.of('§8charmed her already: §f' + won(p)))
          p.tell(Text.of('§8on cooldown: §f' + onCooldown(ctx.source.server, p)))
          p.tell(Text.of('§8eligible now: §f' + eligible(ctx.source.server, p)))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
