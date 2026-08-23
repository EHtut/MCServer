// harvest.js - THE COLLECTION, per god.  docs/40 PART 8, docs/34 §2e
//
// A god does not come for you. IT SENDS SOMETHING (23 §4) - and what it sends says
// what you were worth. That is the actor reframe doing its work at the one moment
// it matters most.
//
// ── ⭐ THE HARVEST IS NOT THE SAME EVENT FOR EVERY GOD ───────────────────────
// Four of the five collect. Blade GRADUATES you.
//
// Ethan, 2026-08-15: "the purpose of the blade's hunt is to challenge you against
// his strongest warrior. Win and he releases you telling you are ready. Gives you
// an offer to stay but lets you go. Fail and take a hit to trust - though this is
// intended."
//
// So this file is a registry, not a mechanism. A god registers what arrives and
// what winning means, and the only shared parts are the announcement, the
// one-per-player lock, and the rule that a Harvest which fails to arrive does not
// count as having happened.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[harvest] '

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴🔴 THE HARVEST IS CUT. Ethan, 2026-08-23:
  //
  //     "There is no reason for an ending anymore since its essentially an
  //      act-based story."
  //
  // Full ruling and the evidence in docs/62. The short version: it was already
  // half-dead - only 3 of 5 gods ever had a handler, and it FIRED FOR HIM ON ART AND
  // SENT NOTHING. The Harvest was designed when every god was a demanding patron;
  // once they became a family, three of the five endings stopped being a fight.
  //
  // ⭐ DISABLED, NOT DELETED — deliberately, and this is step 1 of 3 (docs/62 §4).
  // A 300-reference rip in one pass is the opposite of this project's method. The
  // gate answers "what actually depended on this?" by MEASUREMENT rather than by
  // reading, and it is one character to undo if the ruling is revisited.
  //
  // What this flag already covers, cleanly, with no other edit:
  //     begin()                 returns false immediately (line ~74)
  //     ServerEvents.loaded     the retry sweep never registers, banner says GATED
  //     resolve() / active()    still callable, and vacuous - active() is false
  //                             for everyone, so every guard reading it is a no-op
  var GATE = false

  var K_ACTIVE = 'veldora_harvest_active'   // the id of what was sent, '' if none
  var K_WON = 'veldora_harvest_won'         // how many times they have won one

  var HANDLERS = {}                         // god -> {arrive, onWin, onLose}

  // A handler may declare `tag` - the entity tag its Harvest spawns under. resolve()
  // removes anything carrying it, WIN OR LOSE.
  //
  // 🚨 Measured 2026-08-15: without this the champion kept killing Ethan after the
  // Harvest had already resolved and said its closing line. Losing is meant to be a
  // setback, not a lockout, and a defeated champion that stays and keeps hitting you
  // turns a graduation into a death loop. The god made its point; the actor leaves.
  function register(god, h) {
    if (!god || !h || typeof h.arrive !== 'function') return false
    HANDLERS[god] = h
    return true
  }

  // Remove whatever the Harvest sent. Radius is generous because a champion chases,
  // and a mob left alive 60 blocks away is still the same bug.
  function clearActors(p, tag) {
    if (!tag) return 0
    var n = 0
    try {
      var near = p.level.getEntitiesWithin(p.boundingBox.inflate(96))
      for (var i = 0; i < near.length; i++) {
        var e = near[i]
        if (!e || e.player) continue
        var tags = null
        try { tags = e.tags } catch (x) { continue }
        if (!tags) continue
        var has = false
        try {
          has = tags.contains ? tags.contains(tag) : (String(tags).indexOf(tag) >= 0)
        } catch (x) { continue }
        if (!has) continue
        try { e.kill(); n++ } catch (x) { }
      }
    } catch (e) { console.warn(TAG + 'clearActors threw :: ' + e) }
    return n
  }

  function active(p) {
    try { return !!(p.persistentData.getString(K_ACTIVE) || '') } catch (e) { return false }
  }

  function begin(server, p, god) {
    if (!GATE) return false
    var h = HANDLERS[god]
    if (!h) {
      console.error(TAG + 'no handler for ' + god + ' - the Harvest fired and ' +
        'nothing was sent. That is a bug, not a quiet Harvest.')
      return false
    }
    if (active(p)) return false               // one at a time, per champion

    // ⭐ NOT HERE. Held, not failed - the sweep above brings it when they surface.
    if (!aboveGround(p)) {
      console.info(TAG + god + ' Harvest holds for ' + p.username +
        ' - underground. It will come when they surface.')
      return false
    }

    var ok = false
    try { ok = !!h.arrive(server, p) } catch (e) {
      console.error(TAG + god + ' arrive threw :: ' + e)
    }
    if (!ok) {
      // 🚨 A Harvest that did not arrive must NOT be recorded as having happened.
      // The phase stays at harvest, the sweep sees it again, and it retries - which
      // is right: being collected is not something you get out of by a placement
      // failure.
      console.error(TAG + '!! ' + god + ' Harvest did not arrive for ' + p.username +
        ' - NOT marking it done, it will be attempted again')
      return false
    }
    try { p.persistentData.putString(K_ACTIVE, god) } catch (e) { }
    console.info(TAG + god + ' Harvest began on ' + p.username)
    return true
  }

  function resolve(server, p, won) {
    var god = ''
    try { god = p.persistentData.getString(K_ACTIVE) || '' } catch (e) { }
    if (!god) return false
    try { p.persistentData.putString(K_ACTIVE, '') } catch (e) { }
    var h = HANDLERS[god]
    if (!h) return false

    // The actor leaves, win or lose, BEFORE the closing line - so the last thing
    // that happens is him speaking, not it swinging.
    // Log ALWAYS, including zero. "cleared nothing" and "could not read the tags"
    // must be distinguishable, and a silent zero is how the champion stayed alive
    // through a resolution in the first place.
    var cleared = clearActors(p, h.tag)
    console.info(TAG + 'cleared ' + cleared + ' ' + god + ' actor(s) tagged ' +
      (h.tag || 'NOTHING - handler declared no tag'))

    try {
      if (won) {
        try { p.persistentData.putInt(K_WON, (p.persistentData.getInt(K_WON) || 0) + 1) } catch (e) { }
        if (typeof h.onWin === 'function') h.onWin(server, p)
      } else if (typeof h.onLose === 'function') {
        h.onLose(server, p)
      }
    } catch (e) { console.error(TAG + god + ' resolve threw :: ' + e) }
    // 🚨 MARK IT DONE, or the retry sweep sends another one immediately: notoriety
    // is still >= 100, so the phase is still `harvest`. Cleared when they drop out
    // of the phase, so a future Harvest is still possible.
    try { p.persistentData.putBoolean(K_DONE, true) } catch (e) { }
    console.info(TAG + god + ' Harvest resolved for ' + p.username + ' - ' +
      (won ? 'WON' : 'lost'))
    return true
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ ABOVE GROUND ONLY, AND IT WAITS FOR YOU (Ethan, 2026-08-15)
  // ═══════════════════════════════════════════════════════════════════════════
  //   "Harvests only occurring above ground."
  //
  // A Harvest is the god collecting you. Doing it in a corridor at y-90, where the
  // patron cannot even reach you and a Speaker is talking instead, is the wrong
  // room for it. So it HOLDS and fires the moment you surface - a delay, not a
  // refusal, because a refusal would let a player dodge their Harvest forever by
  // living in a cave.
  //
  // 🚨 THIS ALSO FIXES A LATENT BUG THAT PREDATES THE DEPTH RULE.
  //
  // `phase.js` calls begin() on the TRANSITION into harvest, and only then:
  //     if (next === 'harvest' && prev !== 'harvest') { ... }
  // Once the phase is stored as harvest the transition never repeats. So ANY failed
  // arrival was permanent - the player sat in the harvest phase forever and nothing
  // ever came. The "not marking it done, it will be attempted again" promise in
  // begin() was relying on a retry that did not exist.
  //
  // This sweep IS that retry, and it is the only thing that makes the promise true.
  var SWEEP = 200                            // 10s - responsive without being busy
  var K_DONE = 'veldora_harvest_done'        // resolved for THIS phase-entry

  function aboveGround(p) {
    // Sky is the honest test: a deep ravine at y70 is still outside. Fall back to
    // depth rather than guessing wrong in both directions.
    try { return !!p.level.canSeeSky(p.block.pos) } catch (e) { }
    try { return p.y >= 55 } catch (e) { }
    return false                             // unreadable = do not collect them
  }

  function harvestSweep(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        var path = ''
        try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { continue }
        if (!path) continue

        var ph = ''
        try { if (VELDORA.phase) ph = VELDORA.phase.of(server, p) || '' } catch (e) { continue }

        // Left the harvest phase - clear the marker so a FUTURE harvest can happen.
        if (ph !== 'harvest') {
          try { if (p.persistentData.getBoolean(K_DONE)) p.persistentData.putBoolean(K_DONE, false) } catch (e) { }
          continue
        }
        if (active(p)) continue
        try { if (p.persistentData.getBoolean(K_DONE)) continue } catch (e) { }
        if (!aboveGround(p)) continue        // hold. She waits.
        try { if (VELDORA.ritual && VELDORA.ritual.active(p)) continue } catch (e) { }

        begin(server, p, path)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    server.scheduleInTicks(SWEEP, function () { harvestSweep(server) })
  }

  VELDORA.harvest = {
    register: register, begin: begin, resolve: resolve, active: active,
    handlers: HANDLERS, aboveGround: aboveGround,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    var root = Commands.literal('harvest').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var god = ''
      try { if (VELDORA.paths) god = VELDORA.paths.pathOf(p) || '' } catch (e) { }
      var cur = ''
      try { cur = p.persistentData.getString(K_ACTIVE) || '' } catch (e) { }
      var won = 0
      try { won = p.persistentData.getInt(K_WON) || 0 } catch (e) { }
      p.tell(Text.of('§8§m                                        '))
      // 🔴 THE PANEL MUST SAY THE SYSTEM IS CUT. Everything below it - "handler:
      // registered", the begin|win|lose menu - describes a system that no longer
      // runs, and an admin screen that reads healthy while the feature is gated is
      // the same lie as a boot banner that does. docs/62.
      if (!GATE) {
        p.tell(Text.of('§c  THE HARVEST IS CUT §8(docs/62 - GATE=false in harvest.js)'))
        p.tell(Text.of('§8  begin() returns false. Everything below is inert.'))
      }
      p.tell(Text.of('§6path §f' + (god || 'none') + ' §8· phase §f' +
        (VELDORA.stalkerPhase ? (VELDORA.stalkerPhase(ctx.source.server, p) || 'none') : '?')))
      p.tell(Text.of('§7  handler: ' + (HANDLERS[god] ? '§aregistered' : '§cNONE - nothing would be sent')))
      p.tell(Text.of('§7  active: §f' + (cur || 'no') + ' §8· won §f' + won))
      p.tell(Text.of('§8/harvest begin | /harvest win | /harvest lose'))
      return 1
    })
    root = root.then(Commands.literal('begin').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var god = ''
      try { if (VELDORA.paths) god = VELDORA.paths.pathOf(p) || '' } catch (e) { }
      var r = begin(ctx.source.server, p, god)
      p.tell(Text.of(r ? '§7it comes.' : '§cdid not begin - see the log'))
      return 1
    }))
    root = root.then(Commands.literal('win').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      p.tell(Text.of(resolve(ctx.source.server, p, true) ? '§7resolved' : '§cnothing active'))
      return 1
    }))
    root = root.then(Commands.literal('lose').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      p.tell(Text.of(resolve(ctx.source.server, p, false) ? '§7resolved' : '§cnothing active'))
      return 1
    }))
    event.register(root)
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'harvest GATED OFF'); return }
    // 🚨 REPORTED ONE TICK LATE, ON PURPOSE.
    // ServerEvents.loaded handlers fire in SCRIPT LOAD ORDER, and this file sorts
    // before every <god>_events.js - so reporting here counted only the gods that
    // happened to load first. It printed "11 events across 1 god" while Wall was
    // about to register three more. The numbers were not wrong when written; they
    // were written before the answer existed.
    // One tick is after every loaded handler and long before the first sweep.
    harvestSweep(event.server)
    event.server.scheduleInTicks(1, function () {
      var gods = []
      for (var g in HANDLERS) if (HANDLERS.hasOwnProperty(g)) gods.push(g)
      console.info(TAG + 'VELDORA.harvest published OK - handlers: ' +
        (gods.join(', ') || 'NONE YET') + '. ABOVE GROUND ONLY; a due Harvest ' +
        'holds and retries every ' + SWEEP + 't until they surface.')
    })
  })
})();
