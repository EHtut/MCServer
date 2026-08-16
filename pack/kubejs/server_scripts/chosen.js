// chosen.js - YOU DO NOT CHOOSE A PATH. YOU ARE CHOSEN.  docs/23, docs/45
//
// Ethan, 2026-08-15:
//   "I am also thinking we introduce one mechanic. You no longer choose your path.
//    You are chosen.
//      Blade   - Obtain or craft an iron sword
//      Wall    - Rejected another path and did not choose a path for x amount of days
//      Salvage - Crossbow
//      Forge   - Wrench
//      Art     - Lapis"
//
// ── ⭐ WHY THIS IS THE BEST VERSION OF PATH SELECTION ───────────────────────
// `/path blade` asks a player to pick a god off a menu before they have met any of
// them. It is the single most video-game moment in a project that has spent weeks
// removing video-game moments - and it puts the most important decision in the game
// behind a command nobody has a reason to trust.
//
// This inverts it. **You are noticed for what you were already doing.** You picked
// up an iron sword because you wanted to fight something, and the god of war saw
// that. You crafted a crossbow, and the dealer noticed you had chosen a weapon that
// needs feeding. Nobody explained the system to you; the system was watching.
//
// ⭐ AND WALL'S IS THE BEST ONE. She does not have a trigger item, because she is
// not something you reach for. She is what happens when you REFUSED somebody else
// and then stood still. She takes what nobody else claimed, which is exactly what
// her whole character is - "They rejected you too. I won't."
//
// ── HOW IT CLAIMS ───────────────────────────────────────────────────────────
// 🚨 IT RUNS THE PLAYER'S OWN `/path <key>` COMMAND rather than reimplementing the
// claim. That gauntlet is long - CLOSED paths, the post-fall lockout, escrow, one
// walker per path, the introduction ritual, the XP toll, the books - and a second
// copy of it would drift from the first within a week. Being chosen must be
// EXACTLY the same act as choosing, or the two will disagree and one will be wrong.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[chosen] '
  var GATE = true

  var SWEEP = 200                  // 10s. Fast enough to feel like being noticed.
  var K_LAST = 'veldora_chosen_try' // world day + 1 of the last approach; 0 = never
  var RETRY_DAYS = 1               // a god who was refused waits a day before asking

  // ── THE TRIGGERS ──────────────────────────────────────────────────────────
  // Ethan's, exactly. Held anywhere in the inventory, not just the hand - you are
  // being noticed for what you CARRY, and a player who crafted a sword and put it
  // in a chest has still told the world something.
  //
  // ⚠️ Art and Forge are CLOSED in paths.js. Their triggers stay listed so the
  // table remains the design rather than the leftovers, and the claim refuses them
  // on its own. Nothing here needs to know which gods are open.
  var TRIGGERS = {
    blade: ['minecraft:iron_sword'],
    salvage: ['minecraft:crossbow'],
    forge: ['create:wrench'],
    art: ['minecraft:lapis_lazuli'],
  }

  // ── WALL: not an item. A refusal, and then time. ─────────────────────────
  var WALL_DAYS = 3                // pathless days after a refusal before she comes

  function worldDay(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  // ⚠️ SCANS THE WHOLE INVENTORY, defensively. There is no single accessor in this
  // codebase that has been proven for a full inventory walk, so this tries the
  // indexed route and gives up quietly rather than throwing inside a sweep that
  // runs every ten seconds for every player.
  function carries(p, ids) {
    var inv = null
    try { inv = p.inventory } catch (e) { return false }
    if (!inv) return false
    var size = 41
    try { if (typeof inv.size === 'number') size = inv.size } catch (e) { }
    for (var i = 0; i < size; i++) {
      var st = null
      try { st = inv.getItem(i) } catch (e) { continue }
      if (!st) continue
      var id = null
      try { id = String(st.id) } catch (e) { continue }
      if (!id) continue
      for (var j = 0; j < ids.length; j++) {
        if (id === ids[j]) return true
      }
    }
    return false
  }

  // Has this player refused somebody? introductions.js stamps a per-path cooldown
  // key when a scene is declined or walked away from, so the presence of ANY of
  // them is the record of a refusal.
  function hasRefused(p) {
    var keys = ['blade', 'salvage', 'forge', 'art', 'wall', 'crown']
    for (var i = 0; i < keys.length; i++) {
      try {
        if ((p.persistentData.getInt('veldora_refused_' + keys[i]) || 0) > 0) return true
      } catch (e) { }
    }
    return false
  }

  // How long they have been pathless AND refused. Stamped the first time we see
  // them in that state - day+1, because getInt returns 0 for a missing key.
  var K_DRIFT = 'veldora_pathless_since'

  function driftDays(server, p) {
    var now = worldDay(server)
    if (now === null) return null
    var stored = 0
    try { stored = p.persistentData.getInt(K_DRIFT) } catch (e) { return null }
    if (!stored) {
      try { p.persistentData.putInt(K_DRIFT, now + 1) } catch (e) { }
      return 0
    }
    var since = stored - 1
    // Clock moved backwards (an admin ran /time set) - re-stamp rather than
    // treating it as ten thousand days of drifting.
    if (since > now) { try { p.persistentData.putInt(K_DRIFT, now + 1) } catch (e) { } return 0 }
    return now - since
  }

  // ── who wants this player ────────────────────────────────────────────────
  // Returns a path key, or null. Item triggers first; Wall is the fallback, which
  // is thematically exact - she gets you when nobody else did.
  function whoWants(server, p) {
    for (var key in TRIGGERS) {
      if (!TRIGGERS.hasOwnProperty(key)) continue
      if (carries(p, TRIGGERS[key])) return key
    }
    if (hasRefused(p)) {
      var d = driftDays(server, p)
      if (d !== null && d >= WALL_DAYS) return 'wall'
    }
    return null
  }

  // ── the approach ─────────────────────────────────────────────────────────
  // 🚨 RUNS THE PLAYER'S OWN /path COMMAND. See the header - being chosen must be
  // the same act as choosing, or the two implementations will disagree.
  //
  // ⚠️ p.runCommandSilent, not server.runCommandSilent. The player's own permission
  // level is correct here: if a player could not take this path by typing it, a god
  // must not be able to take it for them.
  function approach(server, p, key) {
    var now = worldDay(server)
    if (now !== null) {
      try { p.persistentData.putInt(K_LAST, now + 1) } catch (e) { }
    }
    console.info(TAG + '!! ' + key + ' has noticed ' + p.username)

    // A beat first, so it reads as being seen rather than as a command firing.
    try {
      p.tell(Text.of(''))
      p.tell(Text.of('§8Something has noticed you.'))
    } catch (e) { }

    server.scheduleInTicks(50, function () {
      try {
        p.runCommandSilent('path ' + key)
      } catch (e) { console.error(TAG + 'claim threw for ' + p.username + ' :: ' + e) }
    })
  }

  function eligible(server, p) {
    // Already walking one - nothing to do, and clear the drift clock so a future
    // release starts it fresh.
    var path = ''
    try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { return false }
    if (path) {
      try { if (p.persistentData.getInt(K_DRIFT)) p.persistentData.putInt(K_DRIFT, 0) } catch (e) { }
      return false
    }
    // Never over a scene.
    try { if (VELDORA.ritual && VELDORA.ritual.active(p)) return false } catch (e) { }
    // The post-fall lockout. /path would refuse anyway, but a god should not be
    // seen reaching for somebody it cannot have.
    try {
      if (VELDORA.pathBlocked && VELDORA.pathBlocked(server, p).blocked) return false
    } catch (e) { }
    // Approached recently - do not nag.
    var now = worldDay(server)
    if (now === null) return false
    var stored = 0
    try { stored = p.persistentData.getInt(K_LAST) } catch (e) { }
    if (stored) {
      var last = stored - 1
      if (last > now) { try { p.persistentData.putInt(K_LAST, now + 1) } catch (e) { } return false }
      if ((now - last) < RETRY_DAYS) return false
    }
    return true
  }

  function sweep(server) {
    try {
      if (!GATE) { schedule(server); return }
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        if (!eligible(server, p)) continue
        var key = whoWants(server, p)
        if (!key) continue
        approach(server, p, key)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    schedule(server)
  }

  function schedule(server) { server.scheduleInTicks(SWEEP, function () { sweep(server) }) }

  VELDORA.chosen = { whoWants: whoWants, triggers: TRIGGERS, approach: approach }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // Why is nobody choosing me? - the question this system will always raise.
    event.register(Commands.literal('chosen').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var path = ''
      try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { }
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6You are chosen, you do not choose.'))
      p.tell(Text.of('§8current path: §f' + (path || 'none')))
      for (var key in TRIGGERS) {
        if (!TRIGGERS.hasOwnProperty(key)) continue
        var has = carries(p, TRIGGERS[key])
        p.tell(Text.of((has ? '§a  CARRYING ' : '§8  no       ') + '§f' + key +
          ' §8- ' + TRIGGERS[key].join(', ')))
      }
      var d = driftDays(srv, p)
      p.tell(Text.of('§8  wall §8- refused someone: §f' + (hasRefused(p) ? 'yes' : 'no') +
        '§8, drifting §f' + (d === null ? '?' : d) + '§8/' + WALL_DAYS + ' days'))
      p.tell(Text.of('§8eligible right now: §f' + (eligible(srv, p) ? 'yes' : 'no') +
        ' §8· wants you: §f' + (whoWants(srv, p) || 'nobody')))
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF - players choose with /path'); return }
    schedule(event.server)
    var t = []
    for (var k in TRIGGERS) if (TRIGGERS.hasOwnProperty(k)) t.push(k + ':' + TRIGGERS[k][0])
    console.info(TAG + 'YOU ARE CHOSEN, NOT CHOOSING - ' + t.join(', ') +
      ', wall: refused + ' + WALL_DAYS + ' pathless days. Sweep ' + SWEEP + 't, ' +
      'one approach per ' + RETRY_DAYS + ' world day(s). CLOSED paths refuse ' +
      'themselves via /path.')
  })
})();
