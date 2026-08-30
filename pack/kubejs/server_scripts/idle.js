// idle.js - CONTEXTUAL IDLE SPEECH, for every god.  docs/23 PART V.10
//
// Ethan, 2026-08-15: "the base patron behaviors will extend to everyone."
// So this is general from the first line. A god registers pools by CONTEXT TAG and
// this file decides which context a champion is in; nothing here knows anything
// about Blade.
//
// ── CADENCE ──────────────────────────────────────────────────────────────────
// "one a daily cooldown plus hour percentage call chance"
//   · at most ONCE per in-game day, per god
//   · rolled on a slow tick, so it lands at an unpredictable moment rather than on
//     a schedule the player learns
// A god who speaks on a timer is a notification. A god who speaks when he happens
// to be watching is a presence.
//
// ── THE CONTEXTS ─────────────────────────────────────────────────────────────
//   what you HOLD      hold_weapon · hold_food · hold_item · hold_none
//   WHERE you are      loc_above · loc_below
//   COMBAT             combat
//   another CHAMPION   near_<their path>
//
// All applicable contexts are gathered and one is chosen, weighted - combat and a
// nearby champion outrank standing in a field, because they are the rarer moment
// and the better line.
//
// ⚠️ A god with no pool for the chosen context says NOTHING. It does not fall back
// to a generic line: silence is a legitimate answer and a wrong-context line is
// worse than none, especially for a god whose highest praise IS silence.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[idle] '
  var GATE = true

  var TICK = 1200                  // 60s between rolls
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE ONCE-PER-WORLD-DAY CAP IS GONE.  Ethan, 2026-08-18:
  //     "lets remove that per session limiter for dialogue because we don't play
  //      daily or for long periods"
  //
  // He is right, and the cap was worse than it looked. A world day is 20 real
  // minutes, so "once per world day per god" meant a player logging on for an hour
  // heard from their patron THREE TIMES. For a game whose entire character lives in
  // what the gods say, that is close to silence.
  //
  // ⚠️ AND REMOVING IT ALONE WOULD HAVE CHANGED ALMOST NOTHING - worth stating,
  // because it looks like the whole fix. The 6% roll on a 60s tick already averaged
  // one line per ~17 minutes, so the cap and the roll were pinching at nearly the
  // same rate. Delete the cap, keep 6%, and the next report is "still quiet". BOTH
  // numbers had to move.
  //
  // Replaced with a REAL-TIME floor instead of a calendar one: a short cooldown
  // that only stops two lines landing on top of each other, and a roll that
  // actually fires. ~1 line per 5 minutes of play, per god.
  // ═══════════════════════════════════════════════════════════════════════════
  var CHANCE = 0.20                // per 60s roll; ~1 in 5 minutes of eligibility
  var GAP_TICKS = 1800             // 90s floor - anti-stacking, not a budget
  var LAST_KEY = 'veldora_idle_day_'   // world day, offset by one (0 = never)

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE DEEP SPEAKER GETS HIS OWN BUDGET AND HIS OWN ODDS.
  //
  // Ethan, live 2026-08-18: "i am on level -127 and we got no deepspeaker."
  //
  // 🔴 THE BUG: the Speaker was billed to `LAST_KEY + god` - THE SAME once-per-
  // world-day allowance as ordinary idle chatter. So every "wall/combat" and
  // "wall/guidance" a player collected on the surface SPENT the deep voice before
  // they ever descended. The session log is full of them and contains not one
  // [speaker] line.
  //
  // That does not just make him rare, it INVERTS the mechanic. The design is "your
  // god cannot reach you down here, and something else speaks instead"; what
  // shipped was "your god chats at you all day up top, and then nothing speaks at
  // all". The silence read as the feature working.
  //
  // ⚠️ The guards themselves were right and stay exactly as they are - he must not
  // talk over a ritual, and he must obey a daily cap. He was moved BELOW those
  // guards deliberately (see the note in attempt()) after ignoring the cooldown and
  // nearly landing a line inside the Harvest. This changes WHICH LEDGER he is
  // billed to, not whether he is billed.
  //
  // And the odds: 6%/minute is right for a god muttering while you walk around, and
  // wrong for the one voice at the bottom of the world. Descending past y-64 is a
  // deliberate, expensive act; being met should not take seventeen minutes of
  // loitering. It is still a roll, so he is never guaranteed on arrival.
  // ═══════════════════════════════════════════════════════════════════════════
  var DEEP_KEY = 'veldora_deep_at_'    // his own ledger, now in world TICKS
  var DEEP_CHANCE = 0.30               // ~1 in 3 minutes below the cutoff
  var DEEP_GAP = 1200                  // 60s floor - he is why you came down

  var COMBAT_WINDOW = 300          // ticks since damage that still counts as fighting
  var NEAR_RANGE = 16              // another champion this close is "with you"

  // Weighted: the rarer the moment, the better the line, so it wins more often.
  // ⭐ `guidance` REPLACED THE PATH GUIDEBOOKS (cut 2026-08-15). It always applies -
  // there is no situation in which "how do I progress" is irrelevant - but it sits
  // at the BOTTOM of the weights on purpose. A hint every minute is a tutorial; a
  // hint now and then is a god who happens to be thinking about your prospects.
  var WEIGHT = { combat: 6, near: 5, hold: 2, loc: 1, guidance: 2 }
  var RARE_CHANCE = 0.15           // a rare sibling, when one exists

  var lastHurt = {}                // uuid -> world ticks

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  // ── what are they holding ─────────────────────────────────────────────────
  // ⚠️ Shape logged once. `stack.get('minecraft:food')` is the 1.21 route and has
  // never been used in this codebase, so it is tried, then fallen back on, and the
  // result is announced - the J6 rule: an unverified accessor returning undefined
  // is indistinguishable from a quiet subsystem.
  var HOLD_LOGGED = false
  var WEAPONISH = ['sword', 'axe', 'blade', 'spear', 'halberd', 'glaive', 'katana',
    'mace', 'hammer', 'scythe', 'dagger', 'claymore', 'zweihander', 'warblade',
    'trident', 'bow', 'crossbow', 'gun', 'rifle', 'pistol', 'shotgun']

  function holdContext(p) {
    var st = null
    try { st = p.mainHandItem } catch (e) { return 'hold_none' }
    if (!st) return 'hold_none'
    var id = ''
    try { id = String(st.id) } catch (e) { return 'hold_none' }
    if (!id || id === 'minecraft:air') return 'hold_none'

    var food = false
    try { food = !!st.get('minecraft:food') } catch (e) { }
    if (!food) {
      // fallback: the component route may not exist, and a wrong answer here is
      // only a slightly wrong line rather than a broken subsystem.
      try { food = !!(st.foodProperties || st.edible) } catch (e) { }
    }
    if (!HOLD_LOGGED) {
      HOLD_LOGGED = true
      console.info(TAG + 'hold read: "' + id + '" food=' + food)
    }
    if (food) return 'hold_food'

    var low = id.toLowerCase()
    for (var i = 0; i < WEAPONISH.length; i++) {
      if (low.indexOf(WEAPONISH[i]) >= 0) return 'hold_weapon'
    }
    return 'hold_item'
  }

  function locContext(p) {
    // Sky is the honest test - a deep ravine at y70 is still outside. Fall back to
    // depth if it is unreadable rather than guessing wrong in both directions.
    try {
      if (p.level.canSeeSky(p.block.pos)) return 'loc_above'
      return 'loc_below'
    } catch (e) { }
    try { return (p.y >= 55) ? 'loc_above' : 'loc_below' } catch (e) { }
    return null
  }

  function nearContext(p) {
    try {
      var near = p.level.getEntitiesWithin(p.boundingBox.inflate(NEAR_RANGE))
      for (var i = 0; i < near.length; i++) {
        var o = near[i]
        if (!o || !o.player) continue
        var same = false
        try { same = String(o.uuid) === String(p.uuid) } catch (e) { continue }
        if (same) continue
        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(o) || '' } catch (e) { }
        if (path) return 'near_' + path
      }
    } catch (e) { }
    return null
  }

  EntityEvents.beforeHurt(function (event) {
    try {
      var e = event.entity
      if (e && e.player) lastHurt[String(e.uuid)] = -1
    } catch (x) { }
  })

  // Everything that currently applies, in one list.
  function contextsFor(server, p, now) {
    var out = []
    var uuid = null
    try { uuid = String(p.uuid) } catch (e) { return out }

    if (lastHurt[uuid] === -1 && now !== null) lastHurt[uuid] = now
    var ago = (now !== null && lastHurt[uuid] > 0) ? (now - lastHurt[uuid]) : null
    if (ago !== null && ago >= 0 && ago < COMBAT_WINDOW) out.push(['combat', WEIGHT.combat])

    var n = nearContext(p)
    if (n) out.push([n, WEIGHT.near])

    out.push([holdContext(p), WEIGHT.hold])

    var l = locContext(p)
    if (l) out.push([l, WEIGHT.loc])

    out.push(['guidance', WEIGHT.guidance])

    return out
  }

  function weightedPick(list) {
    var total = 0
    for (var i = 0; i < list.length; i++) total += list[i][1]
    if (total <= 0) return null
    var r = Math.random() * total
    for (var j = 0; j < list.length; j++) {
      r -= list[j][1]
      if (r <= 0) return list[j][0]
    }
    return list[list.length - 1][0]
  }

  // Try to speak. Returns the context spoken, or null.
  function attempt(server, p, force) {
    var god = ''
    try { if (VELDORA.paths) god = VELDORA.paths.pathOf(p) || '' } catch (e) { }
    if (!god) return null
    if (!VELDORA.voice) return null

    var now = dayNow(server)
    // World ticks, not world days. The cap used to be a calendar entry; it is a
    // stopwatch now, so the resolution has to match.
    var nowT = null
    try { var d = server.overworld().dayTime(); if (typeof d === 'number' && isFinite(d)) nowT = Math.floor(d) } catch (e) { }

    // 🚨 ORDER MATTERS, AND I HAD IT WRONG. The Speaker block used to sit ABOVE
    // both of these guards, which meant she ignored the once-per-world-day cooldown
    // (she stamped it without ever reading it) and, far worse, could talk straight
    // over a running cutscene. Below the cutoff she would have spoken every ~17
    // minutes and could have landed a line in the middle of the Harvest.
    //
    // Both guards now gate EVERY voice, hers included. She is a different speaker,
    // not a different set of rules.

    // Never over a scene.
    try { if (VELDORA.ritual && VELDORA.ritual.active(p)) return null } catch (e) { }

    // Which voice is on duty decides which ledger is charged. Read it BEFORE the
    // daily check, because that check is the thing that was billing him wrongly.
    var deep = false
    try { deep = !!(VELDORA.speaker && VELDORA.speaker.active(p)) } catch (e) { }
    var dayKey = (deep ? DEEP_KEY : LAST_KEY) + god

    if (!force) {
      if (nowT === null) return null           // no clock, no cooldown, no speech
      var stored = 0
      try { stored = p.persistentData.getDouble(dayKey) } catch (e) { }
      if (stored) {
        var last = stored - 1
        // ⚠️ A stamp from the FUTURE means the clock moved (admins run /time set).
        // Re-anchor rather than going silent for ten thousand days - finding K9,
        // which this project has now paid for in seven places.
        if (last > nowT) { try { p.persistentData.putDouble(dayKey, nowT + 1) } catch (e) { } return null }
        if ((nowT - last) < (deep ? DEEP_GAP : GAP_TICKS)) return null
      }
    }

    // ⭐ BELOW THE CUTOFF THE GOD CANNOT REACH YOU (deep_speaker.js). The voice that
    // has been arming and testing you goes silent, and something else speaks
    // instead. That is the point of descending, not a side effect of it.
    //
    // The confession is NOT rolled here - it runs on its own sweep in deep_speaker,
    // because tying the rarest thing in the game to a once-per-day roll would have
    // put it ~10 in-game days out of reach.
    try {
      if (VELDORA.speaker && VELDORA.speaker.active(p)) {
        // ⭐ A SPEAKER GETS A RARE POOL TOO, the way every god does. Without this a
        // `rare` pool registered by a speaker is dead weight - which is what the
        // Matriarch's was the moment it was written, and what `abandoned` still is
        // across all four speakers (defined by every one, consumed by nothing).
        var spoke = false
        if (Math.random() < RARE_CHANCE) spoke = !!VELDORA.speaker.say(p, 'rare')
        if (spoke || VELDORA.speaker.say(p, 'common')) {
          if (nowT !== null) { try { p.persistentData.putDouble(dayKey, nowT + 1) } catch (e) { } }
          var who = 'a speaker'
          try {
            var sp = VELDORA.speaker.forPath ? VELDORA.speaker.forPath(p) : null
            if (sp && sp.name) who = sp.name
          } catch (e) { }
          console.info(TAG + p.username + ' <- ' + who + ' (below y' + VELDORA.speaker.cutoff + ')')
          return 'speaker'
        }
        return null            // out of earshot and she had nothing: SILENCE
      }
    } catch (e) { console.warn(TAG + 'speaker check threw :: ' + e) }

    var ctx = contextsFor(server, p, dayNow(server) === null ? null : (function () {
      try { return server.overworld().dayTime() } catch (e) { return null }
    })())
    if (!ctx.length) return null

    // Try the weighted pick, then anything else that has a pool - a god that has
    // nothing for the chosen context should still speak if it has something for
    // another one that also applies.
    var tried = {}
    for (var attemptN = 0; attemptN < ctx.length + 2; attemptN++) {
      var tag = weightedPick(ctx)
      if (!tag || tried[tag]) {
        var any = null
        for (var i = 0; i < ctx.length; i++) if (!tried[ctx[i][0]]) { any = ctx[i][0]; break }
        if (!any) break
        tag = any
      }
      tried[tag] = true
      // ⭐ RARE SIBLINGS. A pool may have a `rare_<tag>` twin, rolled first and
      // seldom. Ethan's rare lines are where Blade is a PERSON - he had a name, he
      // is a prisoner here too, he feels attachment to the spider he claims to
      // despise - and none of that should ever be common enough to become wallpaper.
      if (Math.random() < RARE_CHANCE && VELDORA.voice.say(p, god, 'rare_' + tag)) {
        if (nowT !== null) { try { p.persistentData.putDouble(dayKey, nowT + 1) } catch (e) { } }
        console.info(TAG + p.username + ' <- ' + god + '/rare_' + tag)
        return 'rare_' + tag
      }
      if (VELDORA.voice.say(p, god, tag)) {
        if (nowT !== null) { try { p.persistentData.putDouble(dayKey, nowT + 1) } catch (e) { } }
        console.info(TAG + p.username + ' <- ' + god + '/' + tag)
        return tag
      }
    }
    return null
  }

  function sweep(server) {
    try {
      if (!GATE) { schedule(server); return }
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        // ⭐ The deep voice rolls four times as often. Above the cutoff nothing
        // changes - this is not a global chattiness increase.
        var odds = CHANCE
        try {
          if (VELDORA.speaker && VELDORA.speaker.active(players[i])) odds = DEEP_CHANCE
        } catch (e) { }
        if (Math.random() > odds) continue
        // ⭐ QUIET MODE - the SOURCE declines, so the backlog model stays honest.
        try { if (VELDORA.screen && VELDORA.screen.isQuiet(players[i])) continue } catch (e) { }
        attempt(server, players[i], false)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    schedule(server)
  }

  function schedule(server) { server.scheduleInTicks(TICK, function () { sweep(server) }) }

  VELDORA.idle = { attempt: attempt, contexts: contextsFor }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // What context am I in, and what would he say about it? A read plus a forced
    // speak, because "he is quiet" and "he has no line for this" look identical.
    event.register(Commands.literal('idle_test').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var now = null
      try { now = srv.overworld().dayTime() } catch (e) { }
      var list = contextsFor(srv, p, now)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6contexts that apply right now:'))
      for (var i = 0; i < list.length; i++) {
        var god = ''
        try { if (VELDORA.paths) god = VELDORA.paths.pathOf(p) || '' } catch (e) { }
        var has = false
        try { has = !!(VELDORA.voice && VELDORA.voice.line(god, list[i][0], null)) } catch (e) { }
        p.tell(Text.of((has ? '§a  HAS  ' : '§8  none ') + '§f' + list[i][0] +
          ' §8weight ' + list[i][1]))
      }
      var said = attempt(srv, p, true)
      if (!said) p.tell(Text.of('§8he said nothing - no pool for any applicable context'))
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'idle speech GATED OFF'); return }
    schedule(event.server)
    // ⚠️ THE FOURTH LYING BANNER THIS SESSION. It still read "once per world day
    // per god" after that cap was replaced by a real-time floor - so the one line
    // that reports this file's behaviour described the exact thing Ethan asked to
    // have removed. Banners are strings; no harness reads strings; and this repo
    // uses them as its primary liveness instrument. Derived from the constants now,
    // so it cannot drift again.
    console.info(TAG + 'contextual idle LIVE - no daily cap (removed 2026-08-18), ' +
      Math.round(CHANCE * 100) + '% per ' + TICK + 't roll with a ' +
      Math.round(GAP_TICKS / 20) + 's floor; the deep Speaker rolls ' +
      Math.round(DEEP_CHANCE * 100) + '% on his own ledger with a ' +
      Math.round(DEEP_GAP / 20) + 's floor. Contexts: hold, location, combat, ' +
      'nearby champion.')
  })
})();
