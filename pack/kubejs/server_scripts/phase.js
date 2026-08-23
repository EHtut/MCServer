// phase.js - THE ESCALATION, without a body.  docs/34 §2e
//
// Extracted from stalker.js when the stalker retired (Ethan, 2026-08-15: "I am
// thinking we just get rid of the stalker mechanic tbh and just have the harvest").
//
// The bands were never about the entity. They are how close a champion is to being
// collected, and they drive three things that all outlive the mob:
//
//   · E3's `phase` coefficient - Blade escalates twice as fast
//   · the Harvest trigger
//   · death_cost.js, which skips the death cost mid-Harvest
//
// What died with the stalker was the LEASH - keepDistance, the Helper, owner
// tagging, the damage veto, the recasting migration. None of that is in here,
// because none of it was ever the escalation.
//
// 🔑 The whispers already carry the dread better than the mob did. "He is not
// looking at you any more. He is looking at where you will be" is worse than a
// knight standing forty blocks away doing nothing, which is what he actually did.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[phase] '
  var STATE = 'veldora_stalker_state'   // kept: existing worlds have data under it
  var SWEEP = 100                       // 5s
  var HYST = 3                          // notoriety points of stickiness at every edge
  var CAP_VALUE = 100                   // notoriety's hard ceiling

  //  name,      low (inclusive), high (exclusive)
  var BANDS = [
    ['helper', 0, 25],
    ['companion', 25, 75],
    ['absence', 75, 100],
    ['harvest', 100, Infinity],
  ]

  function stateAll(server) { return server.persistentData.getCompound(STATE) }

  function phaseStored(server, player) {
    try {
      var all = stateAll(server), u = String(player.uuid)
      return all.contains(u) ? all.getCompound(u).getString('phase') : ''
    } catch (e) { return '' }
  }

  function phaseStore(server, player, phase) {
    try {
      var all = stateAll(server), u = String(player.uuid)
      var rec = all.getCompound(u)
      rec.putString('phase', phase)
      all.put(u, rec)
      server.persistentData.put(STATE, all)
    } catch (e) { console.warn(TAG + 'could not store phase :: ' + e) }
  }

  function bandOf(n) {
    for (var i = 0; i < BANDS.length; i++) {
      if (n >= BANDS[i][1] && n < BANDS[i][2]) return BANDS[i][0]
    }
    return 'helper'
  }

  // Hysteresis. Enchanting drops a player from 30 to 0 in one click, so without
  // stickiness the phase would blink all evening. A phase is only left once the
  // number is HYST clear of the band it is in.
  function resolvePhase(n, prev) {
    var now = bandOf(n)
    // 'none' is not a band and never can be - it means "no path".
    if (prev === 'none') prev = ''
    if (!prev || prev === now) return now
    for (var i = 0; i < BANDS.length; i++) {
      if (BANDS[i][0] !== prev) continue
      var lo = BANDS[i][1] - HYST
      // 🚨 THE STICKY EDGE MUST NOT EXTEND PAST THE VALUE CAP.
      //
      // absence is [75,100) and notoriety is hard-capped at 100. Widening it by
      // HYST gave [72,103) - and since n can never reach 103, the sticky test was
      // true FOREVER. A player who entered absence never left it, so THE HARVEST
      // WAS UNREACHABLE BY PLAY for weeks, silently.
      //
      // This is the single most expensive bug in the project's history and it is
      // one Math.min. It survives the stalker because the bug was never the mob.
      var hi = Math.min(BANDS[i][2] + HYST, CAP_VALUE)
      if (n >= lo && n < hi) return prev
    }
    return now
  }

  VELDORA.stalkerPhase = function (server, player) {
    return phaseStored(server, player)
  }
  VELDORA.phaseLabel = function (n) { return bandOf(n) }
  VELDORA.phase = {
    of: phaseStored, resolve: resolvePhase, bands: BANDS, hyst: HYST,
  }

  // ── the sweep ─────────────────────────────────────────────────────────────
  function sweep(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]

        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { }
        if (!path) {
          if (phaseStored(server, p) !== 'none') {
            phaseStore(server, p, 'none')
            console.info(TAG + p.username + ' walks no path - escalation stood down')
          }
          continue
        }

        var b = null
        try { if (VELDORA.notoriety) b = VELDORA.notoriety(server, p) } catch (e) { }
        if (!b || typeof b.value !== 'number' || !isFinite(b.value)) continue
        var n = b.value

        // E3's `phase` coefficient scales notoriety BEFORE banding, so Blade (×2)
        // meets his end at half the fame. Deliberately NOT clamped to CAP_VALUE -
        // harvest is [100, Infinity) and clamping would park a fast path in
        // `absence` permanently, which is the bug above wearing a different hat.
        var pn = n
        try {
          if (VELDORA.coeff && typeof VELDORA.coeff.of === 'function') {
            var pc = VELDORA.coeff.of(server, p, 'phase')
            if (typeof pc === 'number' && isFinite(pc) && pc > 0) pn = n * pc
          }
        } catch (e) { }

        var prev = phaseStored(server, p)
        var next = resolvePhase(pn, prev)
        if (next === prev) continue

        phaseStore(server, p, next)
        console.info(TAG + p.username + ' ' + (prev || '-') + ' -> ' + next +
          ' (n=' + n + (pn !== n ? ', scaled ' + (Math.round(pn * 10) / 10) : '') + ')')

        // ⭐⭐ THE BAND SURVIVES THE CUT — AND THAT IS THE IMPORTANT PART.
        //
        // `harvest` is a NOTORIETY BAND (100..Infinity), not the event. docs/62 cut
        // the event; the band stays, and it has to, because other systems read the
        // PHASE and would silently lose their top rung if it went:
        //
        //   🔑 deep_speaker.js CONFESSION_PHASES = ['companion','absence','harvest']
        //      Stage 3 - "Gregor, I am sorry.", Ethan's own writing and the best text
        //      in the game - is gated on reaching phase `harvest`. It is UNAFFECTED,
        //      because reaching notoriety 100 still enters the band. Nothing needed
        //      re-gating. This was the first thing checked before touching anything.
        //
        // ⚠️ NAMING ROT ACCEPTED FOR NOW: a band called `harvest` in a game with no
        // Harvest. Renaming it touches phaseRank(), CONFESSION_PHASES, this table and
        // every display string, and it would be a cosmetic change riding along with a
        // behavioural one. Separate chunk, on purpose.
        //
        // 🔴 THE CALL BELOW IS THE ONLY BEHAVIOURAL THING THE CUT REMOVES HERE. It is
        // left in place but neutered by harvest.js's own GATE rather than deleted,
        // so step 3 removes it once step 1 has proven nothing else depended on it.
        // Entering harvest was the one transition that DID something.
        if (next === 'harvest' && prev !== 'harvest') {
          try {
            if (VELDORA.harvest && typeof VELDORA.harvest.begin === 'function') {
              VELDORA.harvest.begin(server, p, path)
            } else {
              console.error(TAG + '!! ' + p.username + ' entered HARVEST and ' +
                'VELDORA.harvest is missing - nothing will come for them')
            }
          } catch (e) { console.error(TAG + 'harvest.begin threw :: ' + e) }
        }
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    server.scheduleInTicks(SWEEP, function () { sweep(server) })
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('phase').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var b = null
      try { if (VELDORA.notoriety) b = VELDORA.notoriety(srv, p) } catch (e) { }
      var n = (b && typeof b.value === 'number') ? b.value : null
      var pn = n
      try {
        if (n !== null && VELDORA.coeff) {
          var pc = VELDORA.coeff.of(srv, p, 'phase')
          if (typeof pc === 'number' && isFinite(pc) && pc > 0) pn = n * pc
        }
      } catch (e) { }
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6phase §f' + (phaseStored(srv, p) || 'none') +
        ' §8(notoriety ' + (n === null ? '?' : n) +
        (pn !== n ? ', scaled ' + (Math.round(pn * 10) / 10) : '') + ')'))
      for (var i = 0; i < BANDS.length; i++) {
        p.tell(Text.of('§8  ' + BANDS[i][0] + ' [' + BANDS[i][1] + ', ' +
          (BANDS[i][2] === Infinity ? '∞' : BANDS[i][2]) + ')'))
      }
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    sweep(event.server)
    console.info(TAG + 'escalation LIVE without a body - ' + BANDS.length +
      ' bands, hysteresis ' + HYST + ' capped at ' + CAP_VALUE +
      '. The stalker is retired; the bands are not.')
  })
})();
