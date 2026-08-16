// godevents.js - THE EVENT FRAMEWORK, for every god.  docs/23 PART VI, docs/40
//
// Ethan, 2026-08-15: "the base patron behaviors will extend to everyone" - and
// "events are something that need to be planned out individually per event rather
// than assuming. Each patron's events are a whole project on their own."
//
// Both are true at once, and this file is the seam between them: the CADENCE, the
// guards and the bookkeeping are shared, and the EVENT ITSELF is per-god and
// bespoke. Nothing here knows what an event does; it only decides whether one may
// happen, and to whom.
//
// ── WHAT AN EVENT REGISTERS ──────────────────────────────────────────────────
//   id        unique per god
//   tiers     which trust tiers it may fire at - ['low','medium','high']
//   hostile   true if it sends danger. Hostile events obey the HEALTH FLOOR.
//   cooldown  world days before this same event may repeat
//   weight    relative likelihood among the eligible
//   guard(server, player) -> bool, optional. A condition only this event cares
//             about - Icarus only exists above y100. Kept per-event rather than in
//             the framework, because the framework must not learn what altitude
//             means to a god of falling.
//   run(server, player, tier)  -> true if it actually happened
//
// ── THE HEALTH FLOOR ─────────────────────────────────────────────────────────
// docs/40 §2.1. "The Warrior never targets a wounded champion" - hostile events
// only fire at >=75% hearts AND hunger. Written HERE rather than in Blade's file
// because it is a per-god setting other gods will want inverted: Salvage opens
// exactly when you are dying, and that is the same dial at the other end.
//
// ── EVERY GUARD IS A FAILURE THIS PROJECT ALREADY HAD ────────────────────────
//   · ONE AT A TIME, globally. Two events on one champion is a bug report.
//   · never over a ritual scene.
//   · a run() that returns false does NOT stamp the cooldown - a failed event must
//     not consume its own slot, or it silently never happens again.
//   · no world clock, no events. A cooldown that cannot be measured is not a
//     cooldown, and stamps from the future are re-anchored rather than clamped
//     (admins run /time set; measured 2026-08-15).
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[events] '
  var GATE = true

  var TICK = 600                    // 30s between rolls
  var CHANCE = 0.08                 // per roll, per eligible champion
  var GLOBAL_COOLDOWN = 1           // world days between ANY two events for one player

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ A CUTSCENE IS NOT THE SAME COST AS A LINE.  Ethan, 2026-08-16:
  //   "Event cutscenes should be rarer, normal dialogue should still be uncommon
  //    so you aren't spammed."
  //
  // MEASURED, not guessed. In a 13-minute live session Lehykt took his path at
  // 00:19:15 and blade/sharpen opened a SECOND held cutscene at 00:25:07 - six
  // minutes later. The global cooldown is one world day (20 real minutes), so the
  // ceiling was ~3 events an hour and ANY of them could root you in the dark.
  //
  // The flaw was treating both kinds as one budget. A boon is a line and a shrug; a
  // ritual takes your screen, your movement and thirty seconds. So scenes now spend
  // a SEPARATE, much longer cooldown on top of the shared one:
  //
  //     any event      1 world day    ~20 real minutes
  //     a CUTSCENE     4 world days   ~80 real minutes
  //
  // Quiet events keep arriving at the old rate; the held ones become an occasion.
  var SCENE_COOLDOWN = 4           // world days between two SCENE events, per player
  var K_SCENE = 'veldora_ev_scene_'  // + god. Last world day a scene fired, +1
  var K_LAST = 'veldora_ev_'        // + god + '_' + id -> world day, offset by one
  var K_ANY = 'veldora_ev_any_'     // + god -> world day of the last event of any kind

  // Per-god health rules. `floor` = fraction of hearts AND hunger required for a
  // HOSTILE event. Salvage's is inverted and lives with her own trigger already;
  // this table is for gods whose events run through this framework.
  var HEALTH = {
    blade: { floor: 0.75 },
  }

  var REG = {}                      // god -> [event, ...]
  var busy = false

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  function stamp(p, key, today) {
    try { p.persistentData.putInt(key, today + 1) } catch (e) { }
  }

  // Returns days since, or null for never. Re-anchors a future stamp rather than
  // clamping it - clamping freezes the cooldown forever when the clock moves back.
  function daysSince(p, key, today) {
    var v = 0
    try { v = p.persistentData.getInt(key) } catch (e) { return null }
    if (!v) return null
    var last = v - 1
    if (last > today) {
      console.warn(TAG + 'stamp ' + last + ' > today ' + today + ' - clock moved, re-anchoring')
      stamp(p, key, today)
      return 0
    }
    return today - last
  }

  function register(god, ev) {
    if (!god || !ev || !ev.id || typeof ev.run !== 'function') {
      console.error(TAG + 'refusing to register a malformed event for ' + god)
      return false
    }
    if (!REG[god]) REG[god] = []
    REG[god].push({
      id: ev.id,
      tiers: ev.tiers || ['low', 'medium', 'high'],
      hostile: !!ev.hostile,
      cooldown: (typeof ev.cooldown === 'number') ? ev.cooldown : 2,
      // ⭐ WEIGHT MAY BE A FUNCTION. Ethan, 2026-08-15, on the Spider: "we can frame
      // it like a sliding scale against rage. Low rage = Boons, High rage = Attacks.
      // Incrementally increasing. Example 10: only boons, 90: only attacks."
      //
      // Tiers are DISCRETE - low/medium/high - and a discrete tier cannot express
      // "incrementally". A god that shifts character across a continuous number needs
      // its odds to be a curve, not three buckets, so weight accepts
      // function(server, player, tier) -> number and is evaluated at pick time.
      //
      // Every god gets this; the Spider is only the first to need it.
      weight: (typeof ev.weight === 'number' || typeof ev.weight === 'function')
        ? ev.weight : 1,
      guard: (typeof ev.guard === 'function') ? ev.guard : null,
      // ⭐ ADMIN TRANSPARENCY (Ethan, 2026-08-15). One plain-English sentence saying
      // what this event DOES TO THE PLAYER. The log used to say only
      // "Rehykt <- blade/hollow", which names the event and hides the effect - so
      // reading the log could not tell you whether a player's drops vanishing was
      // the game working or the game broken.
      does: (typeof ev.does === 'string' && ev.does) ? ev.does : null,
      // ⭐ Does this event HOLD the player - blind, rooted, in a ritual? Those are
      // the ones Ethan wants rare. Declared per event because only the event knows.
      scene: !!ev.scene,
      run: ev.run,
    })
    return true
  }

  // Fraction of max, for hearts and for hunger. null if unreadable - and unreadable
  // must never read as "healthy enough", or the floor silently stops guarding.
  function healthFrac(p) {
    try {
      var max = p.getAttribute('minecraft:generic.max_health').getValue()
      if (!max || !isFinite(max) || max <= 0) return null
      return p.health / max
    } catch (e) { return null }
  }
  function hungerFrac(p) {
    try {
      var f = p.foodData.foodLevel
      if (typeof f !== 'number' || !isFinite(f)) return null
      return f / 20
    } catch (e) { return null }
  }

  // Is this champion well enough to be sent something hostile?
  function aboveFloor(god, p) {
    var rule = HEALTH[god]
    if (!rule) return true                      // no rule = no floor
    var h = healthFrac(p), f = hungerFrac(p)
    if (h === null || f === null) return false  // unreadable is NOT healthy
    return h >= rule.floor && f >= rule.floor
  }

  function tierOf(god, p) {
    // Each god owns its own tier logic; blade publishes VELDORA.blade.tier.
    try {
      var g = VELDORA[god]
      if (g && typeof g.tier === 'function') return g.tier(p)
    } catch (e) { }
    return 'low'
  }

  function eligible(server, p, god, today) {
    var list = REG[god] || []
    var tier = tierOf(god, p)
    if (!tier) return { tier: null, list: [] }
    var out = []
    var wellEnough = aboveFloor(god, p)
    for (var i = 0; i < list.length; i++) {
      var ev = list[i]
      if (ev.tiers.indexOf(tier) < 0) continue
      if (ev.hostile && !wellEnough) continue   // THE FLOOR
      var since = daysSince(p, K_LAST + god + '_' + ev.id, today)
      if (since !== null && since < ev.cooldown) continue

      // A scene spends the scene budget as well as its own.
      if (ev.scene) {
        var sSince = daysSince(p, K_SCENE + god, today)
        if (sSince !== null && sSince < SCENE_COOLDOWN) continue
      }
      if (ev.guard) {
        var ok = false
        try { ok = !!ev.guard(server, p) } catch (e) {
          console.warn(TAG + ev.id + ' guard threw :: ' + e)   // a throwing guard
        }                                                       // is a CLOSED guard
        if (!ok) continue
      }
      out.push(ev)
    }
    return { tier: tier, list: out, wellEnough: wellEnough }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ WHERE AND WHEN — shared conditions, 2026-08-16
  //
  // Ethan's brother: spawn challenges should only happen during the day. Ethan,
  // partially agreeing: "Hordes events for blade should only be underground.
  // Attacks from wall should only be at night."
  //
  // These live HERE and not in a god file, because docs/41 §4 says rolling,
  // cooldowns and the floor are never per-god - and "is it night" is the same kind
  // of fact. Two gods want it today and every future god will.
  // ═══════════════════════════════════════════════════════════════════════════

  // Minecraft's night: monsters spawn at ~13000 and sunrise is 23000.
  // ⚠️ dayTime() is ABSOLUTE and accumulates forever, so the modulo is required.
  // Reading it raw would have made `isNight` true for one day and then wrong.
  var NIGHT_FROM = 13000
  var NIGHT_TO = 23000

  function isNight(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d !== 'number' || !isFinite(d)) return null
      var t = ((d % 24000) + 24000) % 24000
      return t >= NIGHT_FROM && t < NIGHT_TO
    } catch (e) { return null }
  }

  // ⚠️ TWO CONDITIONS, AND BOTH ARE LOAD-BEARING.
  //
  //   no sky   alone is wrong: a player under a tree canopy or standing in their
  //            own surface base has no sky either, and neither is "underground".
  //   depth    alone is wrong: an open ravine at y30 has full sky and reads as a
  //            cave; a mountain base at y90 reads as the surface it is.
  //
  // Together they mean what the word means: roofed AND below the world.
  //
  // 🚨 canSeeSky IS PROBED, NOT ASSUMED. If this KubeJS build does not expose it,
  // the depth half still works and the boot log SAYS SO - rather than every horde
  // silently becoming "anywhere below y50", which is a different mechanic wearing
  // the same name. "I could not read the sky" and "there is no sky" are different
  // answers and this project has shipped them sharing a value twice.
  var DEEP_Y = 50
  var SKY_MODE = null              // 'sky+depth' | 'depth-only', decided on first use

  function canSeeSky(p) {
    try {
      var lvl = p.level
      if (!lvl) return null
      if (typeof lvl.canSeeSky === 'function') return !!lvl.canSeeSky(p.blockPosition())
    } catch (e) { }
    try {
      var b = p.block                                   // the KubeJS block wrapper
      if (b && typeof b.canSeeSky === 'boolean') return !!b.canSeeSky
      if (b && typeof b.canSeeSky === 'function') return !!b.canSeeSky()
    } catch (e) { }
    return null
  }

  function isUnderground(server, p) {
    var y = null
    try { y = p.y } catch (e) { }
    if (y === null || typeof y !== 'number' || !isFinite(y)) return null
    var deep = y < DEEP_Y

    var sky = canSeeSky(p)
    if (SKY_MODE === null) {
      SKY_MODE = (sky === null) ? 'depth-only' : 'sky+depth'
      if (SKY_MODE === 'depth-only') {
        console.warn(TAG + 'canSeeSky is NOT readable on this build - "underground" ' +
          'falls back to y < ' + DEEP_Y + ' ALONE. An open ravine now counts as a ' +
          'cave. This is a degraded mode, not the design.')
      } else {
        console.info(TAG + '"underground" = no sky AND y < ' + DEEP_Y + ' (sky is readable)')
      }
    }
    if (sky === null) return deep
    return deep && !sky
  }

  // Compose guards without any of them losing their own condition. swarm already
  // had `mood >= 0.7` and bolting night on by hand would have been the third place
  // in this repo where one fact got two implementations.
  function allOf() {
    var fns = Array.prototype.slice.call(arguments)
    return function (server, p) {
      for (var i = 0; i < fns.length; i++) {
        var ok = false
        try { ok = !!fns[i](server, p) } catch (e) { return false }   // a throwing
        if (!ok) return false                                        // guard is closed
      }
      return true
    }
  }

  // Guards fail CLOSED (eligible() treats a throw as "no"), so an unreadable clock
  // must not silently mute a god forever. null = could not read = let it through,
  // and the caller's own condition still applies.
  function atNight(server) { var n = isNight(server); return n === null ? true : n }
  function whenDeep(server, p) { var u = isUnderground(server, p); return u === null ? true : u }

  // A weight of 0 means "not right now" and is a legitimate answer - it is how a
  // sliding scale switches a whole family of events off at one end of the range.
  //
  // ⚠️ A THROWING WEIGHT FUNCTION SCORES 0, not 1. Defaulting a broken curve to
  // "average" would let a god quietly keep firing attacks it had decided against,
  // and the log would look normal. It is announced once per throw.
  function weightOf(ev, server, p, tier) {
    if (typeof ev.weight !== 'function') return ev.weight
    try {
      var w = ev.weight(server, p, tier)
      return (typeof w === 'number' && isFinite(w) && w > 0) ? w : 0
    } catch (e) {
      console.warn(TAG + ev.id + ' weight() threw, scoring 0 :: ' + e)
      return 0
    }
  }

  function weightedPick(list, server, p, tier) {
    var w = [], total = 0
    for (var i = 0; i < list.length; i++) {
      var x = weightOf(list[i], server, p, tier)
      w.push(x)
      total += x
    }
    if (total <= 0) return null
    var r = Math.random() * total
    for (var j = 0; j < list.length; j++) {
      r -= w[j]
      if (r <= 0) return list[j]
    }
    return list[list.length - 1]
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE CHART, MADE EXECUTABLE.  docs/23 §VI.0, built 2026-08-16.
  //
  // A god is a weight vector over ten event kinds. The obvious implementation -
  // set each event's weight to its category's band - DOES NOT WORK, and the
  // arithmetic says so plainly. Measured on Blade:
  //
  //     challenge   band 4, 8 events   47.1% of rolls   wanted 20.0%
  //     boon        band 4, 1 event     5.9% of rolls   wanted 20.0%
  //
  // Challenges run 2.4x their share for one reason only: THERE ARE EIGHT OF THEM.
  // To correct it with per-event weights alone, `sharpen` would need weight 16
  // against gauntlet's 3 - and every future event would silently re-break it.
  //
  // 🔑 So the roll is TWO-STAGE. Pick a KIND from the chart, then an event from
  // inside that kind by its own weight. Event weights become RELATIVE WITHIN A
  // CATEGORY, which is what they were always trying to be, and adding a ninth
  // Challenge no longer makes a god 12% more aggressive by accident.
  //
  // ⚠️ A god with NO chart keeps the old single-stage pick, byte for byte. Wall and
  // Salvage have no column yet, and inventing one for them would silently re-tune
  // two gods nobody asked me to touch.
  // ═══════════════════════════════════════════════════════════════════════════
  var KINDS = ['challenge', 'duel', 'buff', 'boon', 'invade',
               'attack', 'aid', 'support', 'assassination', 'contract']

  var CHART = {
    // Ethan, 2026-08-16: "the warrior focuses on you and really only tests you.
    // Most of his actions are forced with little choice as he seeks to test you."
    blade: {
      challenge: 4, duel: 3, buff: 4, boon: 4, invade: 2,
      attack: 1, aid: 1, support: 1, assassination: 2, contract: 3,
    },
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐ WALL'S COLUMN IS A FUNCTION, AND IT HAD TO BE.
    //
    // Ethan confirmed the read: gifts heavy, hurting other players heavy,
    // challenges none. But writing that as static numbers would have destroyed her
    // best mechanic. Her whole design is a SLIDER - boons at calm, attacks at fury,
    // and she only ASKS in the middle - so a fixed vector would have had her
    // sending attacks at rage 0 and gifts at rage 100. The chart would have
    // overwritten the thing it was supposed to describe.
    //
    // So a band may be a NUMBER or a FUNCTION of (server, player). Hers reads her
    // own rage, which means the taxonomy now describes her instead of replacing
    // her - and any future god can be dynamic without another mechanism.
    //
    // ⚠️ The mood factor does NOT get applied twice. Her per-event weights are
    // wAttack(3)/wAttack(4)/wAttack(2) etc, all sharing the same mood multiplier -
    // so inside a category it CANCELS and only the 3:4:2 shape survives, which is
    // exactly what within-category weights are for. mood appears once, at the
    // category roll, where it belongs.
    //
    // 🚫 Zero is a REAL answer here, not a gap. Ethan: "they do not need to have
    // events for everything." An explicit 0 means she will never do that thing; a
    // MISSING key means nobody has decided yet, and the boot log tells them apart.
    // ═══════════════════════════════════════════════════════════════════════
    // ⭐ ETHAN'S COLUMN, 2026-08-16. It corrected mine in three places, and each
    // correction is a character note I had got backwards:
    //
    //   boon           I derived 0 ("she never asks before giving"). He says ++++.
    //                  Her brief: "She never gives orders. She ASKS. And the asks
    //                  are harder than orders, because you can refuse them." She
    //                  does both - forces gifts AND asks - and the asking is the
    //                  worse half.
    //   assassination  I derived 0. He says ++.
    //   contract       I derived 0. He says +++.  She DOES send you to kill.
    //
    // ⚠️ HIS BANDS ARE STATIC AND HER MECHANIC IS A SLIDER, so the bands here are
    // his ratios with her rage curve applied - NOT numbers I invented. At any rage
    // the shape below is his chart; what rage changes is how much of the "kind to
    // you" half survives against the "cruel to them" half. Flatten these to plain
    // numbers and she stops sliding, which is the one thing she must never do.
    wall: {
      challenge: 0,        // blank on his chart. She sends nothing AT her champion.
      duel: 0,             // blank.
      // ++++ — forced gifts, heaviest while she is still gentle
      buff: function (server, p) {
        var m = wallMood(p)
        return m === null ? 0 : 4 * (1 - 0.6 * m)          // 4.0 calm -> 1.6 fury
      },
      // ++++ — the gifts she ASKS about. Same band as forced, and it fades the same
      // way: her brief's arc is that she stops noticing she is asking.
      boon: function (server, p) {
        var m = wallMood(p)
        return m === null ? 0 : 4 * (1 - 0.7 * m)          // 4.0 calm -> 1.2 fury
      },
      // ++++ — forced harm to another player, and the one that GROWS
      invade: function (server, p) {
        var m = wallMood(p)
        return m === null ? 0 : 4 * m                      // 0 calm -> 4.0 fury
      },
      // ++ — asking permission to hurt somebody. Peaks in the middle, because at
      // calm there is nothing to ask about and at fury she no longer asks.
      attack: function (server, p) {
        var m = wallMood(p)
        return m === null ? 0 : 2 * (4 * m * (1 - m))      // 0 -> 2.0 -> 0
      },
      aid: 0, support: 0,  // blank on his chart. She helps nobody but her own.
      // ++ / +++ — she DOES give kill orders, and the asked form outweighs the
      // commanded one, which is her whole grammar.
      assassination: function (server, p) {
        var m = wallMood(p)
        return m === null ? 0 : 2 * m                      // only once she is angry
      },
      contract: function (server, p) {
        var m = wallMood(p)
        return m === null ? 0 : 3 * (0.4 + 0.6 * m)        // 1.2 calm -> 3.0 fury
      },
    },

    // salvage: NOT FILLED IN. She keeps the legacy single-stage roll until Ethan
    // rules on her column - see the note in the boot log.
  }

  function wallMood(p) {
    try {
      if (VELDORA.wall && typeof VELDORA.wall.mood === 'function') return VELDORA.wall.mood(p)
    } catch (e) { }
    return null
  }

  // A band may be a number or a function of (server, player). A throwing band scores
  // 0 - the same rule weightOf() uses, and for the same reason: a broken curve must
  // mute one category, never crash the roll.
  function bandOf(chart, kind, server, p) {
    var b = chart[kind]
    if (typeof b === 'function') {
      try { b = b(server, p) } catch (e) { return 0 }
    }
    return (typeof b === 'number' && isFinite(b) && b > 0) ? b : 0
  }

  function chartPick(list, server, p, tier, god) {
    var chart = CHART[god]
    if (!chart) return weightedPick(list, server, p, tier)     // legacy, unchanged

    // Bucket the ELIGIBLE events by kind, dropping anything already scoring zero -
    // a category whose only event has weight 0 must not win the category roll and
    // then have nothing to hand back.
    var buckets = {}, keys = [], cw = [], ctot = 0
    for (var i = 0; i < list.length; i++) {
      var x = weightOf(list[i], server, p, tier)
      if (x <= 0) continue
      var k = list[i].kind || 'misc'
      if (!buckets[k]) buckets[k] = { evs: [], ws: [], sum: 0 }
      buckets[k].evs.push(list[i])
      buckets[k].ws.push(x)
      buckets[k].sum += x
    }
    for (var k2 in buckets) {
      if (!buckets.hasOwnProperty(k2)) continue
      // An unclassified event still gets to happen - at the lowest band - rather
      // than vanishing because somebody forgot a `kind:`. report() names them.
      var band = (k2 === 'misc') ? 1 : bandOf(chart, k2, server, p)
      if (band <= 0) continue
      keys.push(k2); cw.push(band); ctot += band
    }
    if (ctot <= 0) return null

    var r = Math.random() * ctot, picked = keys[keys.length - 1]
    for (var a = 0; a < keys.length; a++) {
      r -= cw[a]
      if (r <= 0) { picked = keys[a]; break }
    }
    var b = buckets[picked]
    var r2 = Math.random() * b.sum
    for (var c = 0; c < b.evs.length; c++) {
      r2 -= b.ws[c]
      if (r2 <= 0) return b.evs[c]
    }
    return b.evs[b.evs.length - 1]
  }

  // Fire one. `force` skips the chance roll and the global cooldown, never the
  // floor - a test command that ignores the floor would test the wrong thing.
  function attempt(server, p, force, onlyId) {
    if (!GATE) return null
    if (busy) return null
    var god = ''
    try { if (VELDORA.paths) god = VELDORA.paths.pathOf(p) || '' } catch (e) { }
    if (!god || !REG[god]) return null
    try { if (VELDORA.ritual && VELDORA.ritual.active(p)) return null } catch (e) { }

    var today = dayNow(server)
    if (today === null) {
      console.warn(TAG + 'no world clock - events SUPPRESSED (cannot measure a cooldown)')
      return null
    }
    if (!force) {
      var anySince = daysSince(p, K_ANY + god, today)
      if (anySince !== null && anySince < GLOBAL_COOLDOWN) return null
    }

    var e = eligible(server, p, god, today)
    if (!e.tier || !e.list.length) return null

    var ev = null
    if (onlyId) {
      for (var i = 0; i < e.list.length; i++) if (e.list[i].id === onlyId) ev = e.list[i]
      if (!ev) return null
    } else {
      ev = chartPick(e.list, server, p, e.tier, god)
    }
    if (!ev) return null

    busy = true
    var ok = false
    try { ok = ev.run(server, p, e.tier) } catch (err) {
      console.error(TAG + god + '/' + ev.id + ' threw :: ' + err)
    }
    busy = false

    if (!ok) {
      // A failed event must NOT consume its slot, or it silently never runs again.
      console.warn(TAG + god + '/' + ev.id + ' did not happen - NOT stamping cooldown')
      return null
    }
    stamp(p, K_LAST + god + '_' + ev.id, today)
    stamp(p, K_ANY + god, today)
    if (ev.scene) stamp(p, K_SCENE + god, today)
    console.info(TAG + p.username + ' <- ' + god + '/' + ev.id + ' (tier ' + e.tier +
      ') :: ' + (ev.does || 'NO DESCRIPTION - add a `does:` to its register() call'))
    return ev.id
  }

  function sweep(server) {
    try {
      if (!GATE) { schedule(server); return }
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        if (Math.random() > CHANCE) continue
        attempt(server, players[i], false, null)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    schedule(server)
  }

  function schedule(server) { server.scheduleInTicks(TICK, function () { sweep(server) }) }

  VELDORA.events = {
    register: register,
    attempt: attempt,
    aboveFloor: aboveFloor,
    health: HEALTH,
    registry: REG,

    // ⭐ WHERE AND WHEN, published for every god (2026-08-16).
    //   isNight / isUnderground  return TRUE / FALSE / null-for-unreadable
    //   atNight  / whenDeep      are the GUARD forms - unreadable lets it through
    // Use the guard forms in a register() call; use the raw ones for reporting.
    isNight: isNight,
    isUnderground: isUnderground,
    atNight: atNight,
    whenDeep: whenDeep,
    allOf: allOf,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    var root = Commands.literal('events').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var god = ''
      try { if (VELDORA.paths) god = VELDORA.paths.pathOf(p) || '' } catch (e) { }
      var today = dayNow(srv)
      p.tell(Text.of('§8§m                                        '))
      if (!god) { p.tell(Text.of('§7You walk no path. Nobody sends you anything.')); return 1 }
      if (today === null) { p.tell(Text.of('§cno world clock - events are SUPPRESSED')); return 1 }

      var e = eligible(srv, p, god, today)
      p.tell(Text.of('§6' + god + ' §8- tier §f' + (e.tier || '?') +
        '§8, health floor ' + (e.wellEnough ? '§aPASS' : '§cHOLD')))
      var all = REG[god] || []
      for (var i = 0; i < all.length; i++) {
        var ev = all[i]
        var since = daysSince(p, K_LAST + god + '_' + ev.id, today)
        var why = ''
        if (ev.tiers.indexOf(e.tier) < 0) why = 'wrong tier'
        else if (ev.hostile && !e.wellEnough) why = 'below the health floor'
        else if (since !== null && since < ev.cooldown) why = 'cooldown ' + since + '/' + ev.cooldown + 'd'
        else if (ev.guard) {
          var g = false
          try { g = !!ev.guard(srv, p) } catch (e) { }
          if (!g) why = 'its own condition is not met'
        }
        p.tell(Text.of((why ? '§8  --   ' : '§a  OK   ') + '§f' + ev.id +
          (ev.hostile ? ' §8(hostile)' : '') + (why ? ' §8' + why : '')))
      }
      return 1
    })

    root = root.then(Commands.literal('fire')
      .then(Commands.argument('id', event.arguments.STRING.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var id = ctx.getArgument('id', Java.loadClass('java.lang.String'))
          var r = attempt(ctx.source.server, p, true, id)
          p.tell(Text.of(r ? '§7fired ' + r : '§cdid not fire - see /events'))
          return 1
        })))
    event.register(root)
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'event framework GATED OFF'); return }
    schedule(event.server)
    // 🚨 REPORTED ONE TICK LATE, ON PURPOSE.
    // ServerEvents.loaded handlers fire in SCRIPT LOAD ORDER, and this file sorts
    // before every <god>_events.js - so reporting here counted only the gods that
    // happened to load first. It printed "11 events across 1 god" while Wall was
    // about to register three more. The numbers were not wrong when written; they
    // were written before the answer existed.
    // One tick is after every loaded handler and long before the first sweep.
    event.server.scheduleInTicks(1, function () { report() })
  })

  function report() {
    var n = 0, gods = 0
    for (var g in REG) { if (REG.hasOwnProperty(g)) { gods++; n += REG[g].length } }
    var scenes = 0
    for (var sg in REG) {
      if (!REG.hasOwnProperty(sg)) continue
      for (var si = 0; si < REG[sg].length; si++) if (REG[sg][si].scene) scenes++
    }
    console.info(TAG + 'framework LIVE - ' + n + ' event(s) across ' + gods +
      ' god(s), ' + Math.round(CHANCE * 100) + '% per ' + TICK + 't, one at a time. ' +
      scenes + ' of them are CUTSCENES (' + SCENE_COOLDOWN + ' world days apart, vs ' +
      GLOBAL_COOLDOWN + ' for any event).')
    if (!n) console.warn(TAG + 'no events registered - nothing will ever fire')

    // ⭐ THE ROSTER, IN PLAIN ENGLISH. Printed at every boot so an admin reading the
    // log knows what each event actually does to a player WITHOUT opening the source
    // - and so an event that was registered without a description is visible now
    // rather than the first time it fires on someone.
    var missing = []
    for (var gg in REG) {
      if (!REG.hasOwnProperty(gg)) continue
      for (var i = 0; i < REG[gg].length; i++) {
        var ev = REG[gg][i]
        if (!ev.does) { missing.push(gg + '/' + ev.id); continue }
        console.info(TAG + '  ' + gg + '/' + ev.id +
          ' [' + (ev.scene ? 'SCENE, ' : '') + (ev.hostile ? 'hostile' : 'safe') +
          ', cd ' + ev.cooldown +
          'd, w' + (typeof ev.weight === 'function' ? 'CURVE' : ev.weight) +
          ', ' + ev.tiers.join('/') + '] :: ' + ev.does)
      }
    }
    if (missing.length) {
      console.warn(TAG + 'NO DESCRIPTION on: ' + missing.join(', ') +
        ' - add a `does:` so the log says what they do')
    }

    // ⭐ THE CHART, REPORTED. A god with a chart gets the two-stage roll, and this
    // prints what share each KIND will actually take - so the vector in docs/23 and
    // the vector the server is running can be compared without reading any code.
    for (var cg in CHART) {
      if (!CHART.hasOwnProperty(cg)) continue
      var evs = REG[cg] || [], byKind = {}, untagged = []
      for (var ci = 0; ci < evs.length; ci++) {
        var kk = evs[ci].kind
        if (!kk) { untagged.push(evs[ci].id); kk = 'misc' }
        byKind[kk] = (byKind[kk] || 0) + 1
      }
      // ⚠️ A DYNAMIC band cannot be printed as a percentage - it depends on the
      // player. Saying "20%" for a curve would be a confident lie in the log, which
      // is the class of bug this project keeps paying for.
      var tot = 0, parts = [], dyn = [], zero = [], undecided = []
      for (var kx in byKind) {
        if (!byKind.hasOwnProperty(kx)) continue
        var raw = (kx === 'misc') ? 1 : CHART[cg][kx]
        if (typeof raw === 'function') { dyn.push(kx + ' (' + byKind[kx] + ' ev)'); continue }
        tot += (raw || 0)
      }
      for (var ky in byKind) {
        if (!byKind.hasOwnProperty(ky)) continue
        var bd = (ky === 'misc') ? 1 : CHART[cg][ky]
        if (typeof bd === 'function') continue
        if (bd === 0) { zero.push(ky); continue }
        if (bd === undefined) { undecided.push(ky); continue }
        parts.push(ky + ' ' + Math.round(100 * bd / tot) + '% (' + byKind[ky] + ' ev)')
      }
      if (parts.length) console.info(TAG + cg + ' rolls BY KIND: ' + parts.join(' · '))
      if (dyn.length) {
        console.info(TAG + cg + ' has DYNAMIC bands (they move with her own counter, ' +
          'so no fixed share can be printed): ' + dyn.join(' · '))
      }
      // 🔑 "deliberately none" and "nobody has decided" must never look the same.
      if (zero.length) console.info(TAG + cg + ' will NEVER do: ' + zero.join(', ') + ' (set to 0 on purpose)')
      if (undecided.length) {
        console.warn(TAG + '!! ' + cg + ' has events in UNDECIDED kinds: ' +
          undecided.join(', ') + ' - absent from the chart is not the same as 0. ' +
          'They cannot roll until a band is set. docs/23 §VI.0.')
      }
      if (untagged.length) {
        console.warn(TAG + '!! ' + cg + ' has UNTAGGED events: ' + untagged.join(', ') +
          ' - they fall into `misc` at the lowest band. Add a `kind:`.')
      }
    }
    var noChart = []
    for (var ng in REG) {
      if (REG.hasOwnProperty(ng) && !CHART[ng]) noChart.push(ng)
    }
    if (noChart.length) {
      console.info(TAG + 'no chart yet for: ' + noChart.join(', ') +
        ' - they keep the legacy single-stage roll, unchanged. docs/23 §VI.0.')
    }
  }
})();
