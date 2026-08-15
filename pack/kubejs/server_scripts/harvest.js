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
  var GATE = true

  var K_ACTIVE = 'veldora_harvest_active'   // the id of what was sent, '' if none
  var K_WON = 'veldora_harvest_won'         // how many times they have won one

  var HANDLERS = {}                         // god -> {arrive, onWin, onLose}

  function register(god, h) {
    if (!god || !h || typeof h.arrive !== 'function') return false
    HANDLERS[god] = h
    return true
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
    try {
      if (won) {
        try { p.persistentData.putInt(K_WON, (p.persistentData.getInt(K_WON) || 0) + 1) } catch (e) { }
        if (typeof h.onWin === 'function') h.onWin(server, p)
      } else if (typeof h.onLose === 'function') {
        h.onLose(server, p)
      }
    } catch (e) { console.error(TAG + god + ' resolve threw :: ' + e) }
    console.info(TAG + god + ' Harvest resolved for ' + p.username + ' - ' +
      (won ? 'WON' : 'lost'))
    return true
  }

  VELDORA.harvest = {
    register: register, begin: begin, resolve: resolve, active: active,
    handlers: HANDLERS,
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

  ServerEvents.loaded(function () {
    if (!GATE) { console.info(TAG + 'harvest GATED OFF'); return }
    var gods = []
    for (var g in HANDLERS) if (HANDLERS.hasOwnProperty(g)) gods.push(g)
    console.info(TAG + 'VELDORA.harvest published OK - handlers: ' +
      (gods.join(', ') || 'NONE YET'))
  })
})();
