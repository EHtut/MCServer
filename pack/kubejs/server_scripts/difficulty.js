// difficulty.js — Uprising · Malice · Heresy · Damnation.
//
// Ethan, 2026-08-29:
//     "Uprising - Malice - heresy - damnation. Scaling exponentially from easy to
//      hellish. The scale should be determined on a sliding scale.
//      Add: day's past, mobs slain, Average god trust
//      Reduce: deaths
//      The idea is that if the longer the player's are in the world and progressing the
//      difficulty is increasing gradually, however if they keep dying the difficulty
//      goes down."
//
// ── 🔑 IT IS A SLIDER, NOT A RATCHET ───────────────────────────────────────────
// This is the whole design and it is unusual: **difficulty can go DOWN**. A player who
// is drowning gets a gentler world without asking for one and without being told, and a
// player who is thriving gets hunted harder. Nothing else in Veldora moves backwards.
//
// ⚠️ SO NOTHING HERE MAY LATCH. No "highest tier reached", no floor that creeps up. The
// moment any input is remembered rather than read, the slider becomes a ratchet and the
// mercy half of the design is gone.
//
// ── 🚨 EVERY WEIGHT AND THRESHOLD BELOW IS A FIRST PASS ────────────────────────
// They are reasoned, not measured — nobody has played to Damnation yet. They are all in
// one block, all named, and `/difficulty` prints the live arithmetic so a session of
// play can correct them. ⛔ Do not treat these numbers as tuned.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[difficulty] '
  var GATE = true

  // ⭐ HIS NAMES, IN HIS ORDER. The index IS the tier - other systems compare numbers,
  // never strings, so a rename here cannot silently reorder anything.
  var TIERS = ['Uprising', 'Malice', 'Heresy', 'Damnation']

  // ── the inputs ───────────────────────────────────────────────────────────────
  // ⚠️ ALL FOUR ALREADY EXIST. Nothing new is counted, which is why this file is
  // arithmetic rather than bookkeeping:
  //
  //   nights   night.js         `veldora_nights`          PLAYED nights witnessed
  //   slain    slain.js         `veldora_lifetime_slain`  lifetime, never reset
  //   trust    counters.js      per-patron, averaged
  //   deaths   nemesis_tally.js `nemesis_deaths_seen`
  //
  // 🚨 THE DEATHS KEY IS READ DIRECTLY because nemesis_tally.js does not export it.
  // That is a coupling and it is named here rather than hidden: if that file renames
  // its key, this reads 0 and difficulty silently stops falling for dying players.
  var K_DEATHS = 'nemesis_deaths_seen'

  // ── the weights. 🚨 FIRST PASS. See the header. ──────────────────────────────
  // Sized against the project's own landmarks so the numbers mean something:
  //   30 nights  = the Speaker arrives          -> 300 points
  //   500 slain  = Blade's chosen threshold     -> 250 points
  //   deaths are deliberately HEAVY. A player dying repeatedly should feel the world
  //   ease off within a session, not over a week.
  var W_NIGHT = 10
  var W_SLAIN = 0.5
  var W_TRUST = 1.0
  var W_DEATH = 25

  // ⭐ EXPONENTIAL, roughly x3 per step, because he asked for "easy to hellish" rather
  // than four evenly spaced rungs. Damnation is meant to be a long haul that most
  // players never see, not the fourth thing that happens.
  var STEPS = [0, 150, 450, 1350]

  function readNights(p) {
    try {
      if (VELDORA.night && typeof VELDORA.night.nightsFor === 'function') {
        return VELDORA.night.nightsFor(p) || 0
      }
    } catch (e) { }
    return null
  }

  function readSlain(p) {
    try {
      if (VELDORA.slain && typeof VELDORA.slain.count === 'function') {
        return VELDORA.slain.count(p) || 0
      }
    } catch (e) { }
    return null
  }

  // ⚠️ AVERAGED ACROSS THE PATRONS THAT ANSWER, not across all five. counters.get
  // returns null for "could not read", and folding a null in as 0 would drag the
  // average down and make a healthy player look like a beginner.
  function readTrust(p) {
    try {
      if (!VELDORA.counter || typeof VELDORA.counter.get !== 'function') return null
      var list = VELDORA.counter.patrons || []
      var sum = 0, n = 0, i
      for (i = 0; i < list.length; i++) {
        var v = VELDORA.counter.get(p, list[i])
        if (typeof v === 'number' && isFinite(v)) { sum += v; n++ }
      }
      if (!n) return null
      return sum / n
    } catch (e) { return null }
  }

  function readDeaths(p) {
    try {
      var v = p.persistentData.getInt(K_DEATHS)
      return (typeof v === 'number' && isFinite(v) && v > 0) ? v : 0
    } catch (e) { return null }
  }

  // ── the score ────────────────────────────────────────────────────────────────
  // Returns { score, tier, index, parts, missing } — `missing` names any input that
  // could not be read, because a difficulty computed from three of four inputs is not
  // the same thing as a low one.
  function scoreOf(p) {
    var nights = readNights(p)
    var slain = readSlain(p)
    var trust = readTrust(p)
    var deaths = readDeaths(p)

    var missing = []
    if (nights === null) missing.push('nights')
    if (slain === null) missing.push('slain')
    if (trust === null) missing.push('trust')
    if (deaths === null) missing.push('deaths')

    var parts = {
      nights: (nights || 0) * W_NIGHT,
      slain: (slain || 0) * W_SLAIN,
      trust: (trust || 0) * W_TRUST,
      deaths: -((deaths || 0) * W_DEATH),
    }
    var score = parts.nights + parts.slain + parts.trust + parts.deaths

    // ⚠️ FLOORED AT ZERO. A player who has died more than they have lived is at
    // Uprising, not at some negative tier - and the floor also stops a huge death
    // count from making later progress invisible.
    if (score < 0) score = 0

    var idx = 0, i
    for (i = STEPS.length - 1; i >= 0; i--) {
      if (score >= STEPS[i]) { idx = i; break }
    }
    return {
      score: Math.round(score), tier: TIERS[idx], index: idx,
      parts: parts, missing: missing,
      raw: { nights: nights, slain: slain, trust: trust, deaths: deaths },
    }
  }

  // The number other systems should use. ⚠️ Returns 0 (Uprising) when it cannot tell,
  // because the gentlest answer is the safe one for a difficulty dial - the opposite
  // failure hands somebody Damnation because a counter was unreadable.
  function indexFor(p) {
    if (!GATE) return 0
    try { return scoreOf(p).index } catch (e) { return 0 }
  }

  function nameFor(p) {
    return TIERS[indexFor(p)] || TIERS[0]
  }

  VELDORA.difficulty = {
    tiers: TIERS,
    steps: STEPS,
    weights: { night: W_NIGHT, slain: W_SLAIN, trust: W_TRUST, death: W_DEATH },
    score: scoreOf,
    index: indexFor,
    name: nameFor,
    enabled: function () { return GATE },
  }

  ServerEvents.loaded(function () {
    console.info(TAG + 'the ladder is live - ' + TIERS.join(' < ') + '. Score = ' +
      'nights*' + W_NIGHT + ' + slain*' + W_SLAIN + ' + avgTrust*' + W_TRUST +
      ' - deaths*' + W_DEATH + ', floored at 0. Steps: ' + STEPS.join(' / ') + '.')
    console.info(TAG + 'IT IS A SLIDER, NOT A RATCHET - difficulty FALLS for a player ' +
      'who keeps dying. Nothing here latches, and nothing remembers a high-water mark.')
    console.info(TAG + '!! every weight and step above is a FIRST PASS, reasoned rather ' +
      'than measured. /difficulty prints the live arithmetic so play can correct them.')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    try {
      event.register(Commands.literal('difficulty')
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var s = scoreOf(p)
          p.tell(Text.of('§8you are at §f' + s.tier + '§8 (' + s.score + ' points)'))
          p.tell(Text.of('§8  nights §f+' + Math.round(s.parts.nights) +
            '§8  slain §f+' + Math.round(s.parts.slain) +
            '§8  trust §f+' + Math.round(s.parts.trust) +
            '§8  deaths §c' + Math.round(s.parts.deaths)))
          p.tell(Text.of('§8  raw: ' + s.raw.nights + ' nights · ' + s.raw.slain +
            ' slain · ' + (s.raw.trust === null ? '?' : Math.round(s.raw.trust)) +
            ' avg trust · ' + s.raw.deaths + ' deaths'))
          var next = STEPS[s.index + 1]
          p.tell(Text.of(next === undefined
            ? '§8  this is the top of the ladder'
            : '§8  next: §f' + TIERS[s.index + 1] + '§8 at ' + next + ' (' +
              (next - s.score) + ' to go)'))
          if (s.missing.length) {
            p.tell(Text.of('§c  UNREADABLE: ' + s.missing.join(', ') +
              ' - this score is incomplete, not low'))
          }
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
