// regard.js — E2c of the Path System build. docs/24, design docs/23 §9.1b
//
// ONE NUMBER. SIX READINGS.
//
// Ethan, 2026-08-12: "the more levels you lose the more irritated the patron
// becomes, dying too many times in a short period causes the entity to force a
// harvest then kick you off the path on a cooldown. That being said it should be
// on a degrading counter with messages from the patron."
//
// Calling it "irritation" is right for four patrons and WRONG for two, and that
// difference is the best thing in the mechanic. It is one counter that six
// characters interpret differently:
//
//   Blade    contempt    you keep failing a test he set
//   Forge    debt        a dead builder builds nothing
//   Crown    disgrace    a king does not swing the sword; this reflects on HIM
//   Wall     grief       every death is you leaving her. She is hurt, not angry
//   Salvage  appetite    a dying player NEEDS something, and needing is her trade
//   Art      readiness   death is a kind of sleep, and sleep is all she wanted
//
// Wall, Salvage and Art escalate the WRONG WAY on purpose. A patron who gets more
// affectionate, more generous or more PLEASED as you die is far worse than one who
// gets angry, and it costs nothing extra because the number is identical.
//
// ── THE RULE THAT KEEPS THIS FROM EATING SOMEBODY'S PATH ─────────────────────
// E0 probe P8, measured live: waking where you fell puts a player in front of
// SEVEN hostiles (against one at the bed). A counter that rises on every death
// therefore has a feedback loop - die, wake in the pack, die, wake, die - and one
// bad cave becomes a lost path through no decision the player ever made.
//
// So: A DEATH INSIDE THE GRACE WINDOW DOES NOT ADVANCE THE COUNTER. A spiral
// counts once. This measures carelessness over time, never one moment going wrong.

// The shared namespace, declared idempotently. notoriety.js declares it too and
// loads first alphabetically, so today this is redundant - but relying on file
// NAMES for load order is the kind of invisible dependency that breaks months
// later during a rename, and `global` cannot be assigned in server scripts. Both
// copies merge rather than clobber, so order stops mattering.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var KEY = 'veldora_regard'
  var DAY_KEY = 'veldora_regard_day'

  var RISE = 15                 // per death
  var DECAY_PER_DAY = 25        // per in-game day of not dying
  var MAX = 100
  var SPIRAL_GUARD = 100        // ticks (5s) - matches the respawn grace window

  // beat thresholds. Below BEATS[0] the patron says nothing at all.
  //          beat 1  2   3   4   5(forced)
  var BEATS = [10, 30, 50, 70, 100]

  var lastRise = {}             // uuid -> server tick

  // What the number MEANS to each patron. Same value, six words.
  var READING = {
    blade: 'contempt', forge: 'debt', crown: 'disgrace',
    wall: 'grief', salvage: 'appetite', art: 'readiness',
  }

  // Curated from docs/25-PATRON-DIALOGUE.md. Ethan's own lines outrank these; the
  // three marked there as needing a rewrite are carried as-is until he replaces
  // them, because a placeholder that never ships is how a feature ends up shadow
  // -built and silently dead.
  var LINES = {
    blade: [
      'Already.',
      'You mistake struggle for growth.',
      'You waste what sustains me.',
      'Stop. Before I decide for you.',
      'As Phaethon fell, so do you.',
    ],
    salvage: [
      'Oh friend. That looked like it hurt. I can help.',
      'I am starting to like you. Every time you fall, I know what you need.',
      'Every time you fall, you give me a reason to care. Keep needing me.',
      'Friend, you are drowning. And I will not be able to save you much longer.',
      'Enough. I am taking what I am owed.',
    ],
    forge: [
      'Late. Again.',
      'You die like it is routine.',
      'Every death is a factory unfinished, a machine that rusts away.',
      'The debt is nearly called.',
      'I am taking what you will never build.',
    ],
    wall: [
      'You fell. I felt it. Come back to us where it is safe.',
      'You are leaving us over and over. Are you searching? Or just... leaving?',
      'Do you understand what this does? Every death takes a little more of me.',
      'We cannot keep doing this. You leave, I break. So I am bringing you home now.',
      'This is mercy, darling. This is me keeping my promise. I will not lose you again.',
    ],
    crown: [
      'You were not sent to die. This lapse is noted.',
      'You die where you should only command.',
      'My judgment in selecting you grows questionable. Disabuse me of this doubt.',
      'You are granted this courtesy once: desist, or I reclaim what is mine.',
      'The court is assembled. Your account is settled today.',
    ],
    art: [
      'There. You closed your eyes. Good. So good.',
      'You fall and you fall and you fall. It pleases me so.',
      'How heavy your eyes must be. How heavy. Close them now.',
      'I will gather you soon. You will rest. Rest perfectly. It approaches.',
      'Let me in. Let me take. You are ready. So very ready. Sleep.',
    ],
  }

  var COOLING = {
    blade: 'You falter less. For now.',
    salvage: 'I have missed having you needful. But you always come back, do you not?',
    forge: 'A reprieve, not forgiveness. Get back to work.',
    wall: 'I can feel you trying. It means so much. Just... stay close to us now.',
    crown: 'Ah. You remember your station at last. How adequate.',
    art: 'You have forgotten to rest. I remember. I remember for you. I wait.',
  }

  // ------------------------------------------------------------------ helpers
  function dayNow(server) {
    // P6a: overworld is a METHOD. The first version of the E0 probe read it as a
    // property and reported the world clock broken when it had always worked.
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  function pathOf(p) {
    try { return p.persistentData.getString('veldora_path') || '' } catch (e) { return '' }
  }

  function beatOf(v) {
    for (var i = BEATS.length - 1; i >= 0; i--) if (v >= BEATS[i]) return i + 1
    return 0
  }

  // Read + DECAY LAZILY. Storing a decay timer would need a tick loop; instead the
  // value carries the day it was last touched and pays down on read. Deadlines and
  // decay use WORLD DAY, never tickCount - that is finding K9, where a stamp from
  // the future disabled the Hunt permanently.
  function read(server, p) {
    var day = dayNow(server)
    var v = 0, seen = null
    try { v = p.persistentData.getInt(KEY) || 0 } catch (e) { }
    try { seen = p.persistentData.getInt(DAY_KEY) } catch (e) { }
    if (day === null) return { value: v, beat: beatOf(v), day: null }
    if (typeof seen !== 'number' || seen <= 0) {
      write(p, v, day)
      return { value: v, beat: beatOf(v), day: day }
    }
    var elapsed = day - seen
    if (elapsed < 0) elapsed = 0          // clock ran backwards; never pay UP
    if (elapsed > 0 && v > 0) {
      var nv = Math.max(0, v - elapsed * DECAY_PER_DAY)
      if (nv !== v) { v = nv; write(p, v, day) }
      else write(p, v, day)
    } else if (elapsed > 0) {
      write(p, v, day)
    }
    return { value: v, beat: beatOf(v), day: day }
  }

  function write(p, v, day) {
    try {
      p.persistentData.putInt(KEY, v)
      if (day !== null && day !== undefined) p.persistentData.putInt(DAY_KEY, day)
    } catch (e) { console.warn('[regard] could not store for ' + p.username + ' :: ' + e) }
  }

  // Ask voice.js what colour this god is - it is the only file that knows. Falling
  // back to the patron channel means a god with no registered colour still speaks.
  function godColour(key) {
    try {
      if (VELDORA.voice && typeof VELDORA.voice.colourOf === 'function') {
        return VELDORA.voice.colourOf(key)
      }
    } catch (e) { }
    return '§4§l'
  }

  function speak(p, key, text) {
    try {
      p.tell(Text.of(godColour(key) + text))
    } catch (e) { }
    console.info('[regard] ' + p.username + ' (' + key + '): ' + text)
  }

  // -------------------------------------------------------------------- death
  EntityEvents.death(function (event) {
    var p = event.entity
    if (!p || !p.player) return
    var server = null
    try { server = p.server } catch (e) { return }
    if (!server) return

    var key = pathOf(p)
    if (!key || !LINES[key]) return          // no path, no patron, no regard

    // THE SPIRAL GUARD. A stamp from the FUTURE means the server restarted between
    // the two deaths - K9 again. Treat it as no prior death rather than as an
    // enormous elapsed time.
    var uuid = String(p.uuid)
    var now = 0
    try { now = server.tickCount } catch (e) { }
    var prev = lastRise[uuid]
    if (typeof prev === 'number' && prev <= now && (now - prev) < SPIRAL_GUARD) {
      console.info('[regard] ' + p.username + ' died again within ' + (SPIRAL_GUARD / 20) +
        's - a spiral counts ONCE, not advancing')
      return
    }
    lastRise[uuid] = now

    var before = read(server, p)
    var after = Math.min(MAX, before.value + RISE)
    write(p, after, before.day)
    var beatBefore = before.beat, beatAfter = beatOf(after)

    console.info('[regard] ' + p.username + ' ' + key + ' ' + READING[key] + ' ' +
      before.value + ' -> ' + after + ' (beat ' + beatBefore + ' -> ' + beatAfter + ')')

    // The patron speaks only when the BEAT changes, not on every death. A voice
    // that comments on everything stops being a presence and becomes a log.
    if (beatAfter > beatBefore && beatAfter >= 1) {
      speak(p, key, LINES[key][Math.min(beatAfter, LINES[key].length) - 1])
    }

    if (after >= MAX) {
      // E2d owns what happens next. Called rather than inlined so the fall has one
      // implementation and one place to be wrong.
      if (typeof VELDORA.theFall === 'function') {
        VELDORA.theFall(server, p, key)
      } else {
        // A gate ships with a live consumer or not at all. If fall.js is missing,
        // say so LOUDLY rather than leaving a counter that maxes out and silently
        // does nothing - which is precisely the failure this project spent a day
        // auditing out of itself.
        console.error('[regard] ' + p.username + ' MAXED regard on ' + key +
          ' but VELDORA.theFall is MISSING. The fall did not happen. This is a BUG.')
      }
    }
  })

  // ------------------------------------------------------------------ cooling
  // Noticing the decay needs a moment where somebody is looking. Login is that
  // moment, and it is also when a player most wants to know where they stand.
  PlayerEvents.loggedIn(function (event) {
    var p = event.player
    if (!p) return
    var key = pathOf(p)
    if (!key || !COOLING[key]) return
    var server = null
    try { server = p.server } catch (e) { return }
    var beforeVal = 0
    try { beforeVal = p.persistentData.getInt(KEY) || 0 } catch (e) { }
    var r = read(server, p)                   // this is what pays the decay down
    if (beforeVal > 0 && r.value < beforeVal) {
      speak(p, key, COOLING[key])
    }
  })

  // ----------------------------------------------------------------- commands
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    event.register(Commands.literal('regard').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var key = pathOf(p)
      var r = read(ctx.source.server, p)
      p.tell(Text.of('§8§m                                        '))
      if (!key || !READING[key]) {
        p.tell(Text.of('§7You walk no path. Nothing is keeping count.'))
        return 1
      }
      // The legibility law: the player must be able to SEE the thing that is about
      // to take their path.
      p.tell(Text.of('§7Your patron holds §f' + r.value + '§7/' + MAX + ' ' + READING[key]))
      var bar = ''
      for (var i = 0; i < 20; i++) bar += (i < Math.round(r.value / 5)) ? '§4|' : '§8|'
      p.tell(Text.of(bar))
      p.tell(Text.of('§8It falls by §7' + DECAY_PER_DAY + '§8 each day you do not die.'))
      if (r.beat >= 4) p.tell(Text.of('§cIt is nearly full.'))
      return 1
    }))
  })

  VELDORA.regard = function (server, player) { return read(server, player) }

  ServerEvents.loaded(function () {
    console.info('[regard] E2c active - +' + RISE + ' per death, -' + DECAY_PER_DAY +
      '/day, max ' + MAX + ', beats at ' + BEATS.join('/'))
    console.info('[regard] a death within ' + (SPIRAL_GUARD / 20) +
      's of the last does NOT advance it (P8: 7 hostiles at a death site)')
  })
})()
