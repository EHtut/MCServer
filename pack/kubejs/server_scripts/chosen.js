// chosen.js - YOU DO NOT CHOOSE A PATH. YOU ARE CHOSEN.  docs/23, docs/45
//
// Ethan, 2026-08-15:
//   "You no longer choose your path. You are chosen."
//     Blade   iron sword      Salvage crossbow
//     Forge   wrench          Art     lapis
//     Wall    rejected another path and did not choose for x days
//
//   "Chosen should exist in such a way that after you obtain the item it flags it
//    so when you are not in combat it triggers the offer from the patron. It only
//    fires once. You can get the path again by doing /path, but for it to appear
//    on /path you need to unlock it."
//
// ── ⭐ WHY THIS IS BETTER THAN THE MENU IT REPLACES ─────────────────────────
// `/path blade` asked a player to pick a god off a list before meeting any of them
// - the most video-game moment left in a project that spent weeks removing them.
//
// This inverts it. You are noticed for what you were ALREADY DOING. You picked up
// an iron sword because you wanted to fight something, and the god of war saw it.
// Nobody explained the system; the system was watching.
//
// ⭐ WALL'S IS THE BEST OF THEM. She has no trigger item because she is not
// something you reach for. She is what happens when you REFUSED somebody and then
// stood still. She takes what nobody else claimed - "They rejected you too. I
// won't."
//
// ── THE THREE-PART SHAPE (Ethan's, and it is the good part) ────────────────
//
//   1. UNLOCK    picking the item up flags that path FOREVER. Irreversible, and
//                it is what makes the path exist for you at all.
//   2. THE OFFER fires ONCE, and only out of combat. A god does not interrupt a
//                fight to recruit you.
//   3. /path     is no longer a menu of five strangers. It only lists what you
//                have unlocked, so it reads as "come back to one you have met"
//                rather than "pick a god".
//
// 🚨 THE UNLOCK AND THE OFFER ARE SEPARATE FLAGS, deliberately. Refusing an offer
// must not re-lock the path - you met them, that cannot be undone - and the offer
// must not re-fire every time you pick the sword back up. Conflating them would
// either nag forever or lock a player out of a god they turned down once.
//
// ── HOW IT CLAIMS ───────────────────────────────────────────────────────────
// 🚨 IT RUNS THE PLAYER'S OWN `/path <key>` rather than reimplementing the claim.
// That gauntlet is long - CLOSED paths, the post-fall lockout, escrow, one walker
// each, the introduction ritual, the XP toll - and a second copy would drift from
// the first inside a week. Being chosen must be EXACTLY the same act as choosing.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[chosen] '
  var GATE = true

  var SWEEP = 100                  // 5s. Fast enough to feel like being noticed.
  var COMBAT_WINDOW = 300          // 15s since damage still counts as fighting
  var OFFER_DELAY = 60             // a beat between the notice and the scene

  var K_UNLOCK = 'veldora_unlocked_'   // + path. 1 = you have met them, forever
  var K_OFFERED = 'veldora_offered_'   // + path. 1 = the one offer has been made
  var K_DRIFT = 'veldora_pathless_since'

  // ── THE TRIGGERS.  Ethan's, exactly. ─────────────────────────────────────
  // Held ANYWHERE in the inventory, not just the hand. You are noticed for what
  // you carry, and a sword in a chest still says something about you.
  //
  // ⚠️ Art and Forge are CLOSED in paths.js. Their triggers stay listed so this
  // table is the design rather than the leftovers - and the claim refuses them on
  // its own, so nothing here needs to know which gods are open.
  var TRIGGERS = {
    blade: ['minecraft:iron_sword'],
    salvage: ['minecraft:crossbow'],
    forge: ['create:wrench'],
    art: ['minecraft:lapis_lazuli'],
  }

  var WALL_DAYS = 3                // pathless days after a refusal before she comes

  // ── combat, borrowed from idle.js's approach ─────────────────────────────
  var lastHurt = {}                // uuid -> world ticks

  EntityEvents.beforeHurt(function (event) {
    try {
      var e = event.entity
      if (e && e.player) lastHurt[String(e.uuid)] = -1
    } catch (x) { }
  })

  function worldTicks(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return d
    } catch (e) { }
    return null
  }

  function worldDay(server) {
    var t = worldTicks(server)
    return t === null ? null : Math.floor(t / 24000)
  }

  // ⚠️ UNREADABLE COUNTS AS IN COMBAT. If we cannot tell, we do not interrupt -
  // an offer that lands mid-fight is the one thing Ethan asked this to avoid, and
  // a missed offer costs nothing because the sweep comes back in five seconds.
  function inCombat(server, p) {
    var uuid = null
    try { uuid = String(p.uuid) } catch (e) { return true }
    var now = worldTicks(server)
    if (now === null) return true
    if (lastHurt[uuid] === -1) { lastHurt[uuid] = now; return true }
    var at = lastHurt[uuid]
    if (!at) return false                    // never hurt this session
    var ago = now - at
    if (ago < 0) { lastHurt[uuid] = now; return true }   // clock moved
    return ago < COMBAT_WINDOW
  }

  // ── the flags ────────────────────────────────────────────────────────────
  function isUnlocked(p, key) {
    try { return (p.persistentData.getInt(K_UNLOCK + key) || 0) > 0 } catch (e) { return false }
  }

  function unlock(p, key) {
    if (isUnlocked(p, key)) return false
    try { p.persistentData.putInt(K_UNLOCK + key, 1) } catch (e) { return false }
    console.info(TAG + p.username + ' UNLOCKED ' + key)
    return true
  }

  function wasOffered(p, key) {
    try { return (p.persistentData.getInt(K_OFFERED + key) || 0) > 0 } catch (e) { return true }
  }

  // Published so paths.js can gate its listing and its claim on it.
  VELDORA.chosen = {
    unlocked: isUnlocked,
    unlock: unlock,
    triggers: TRIGGERS,
    // Every path this player has met, for the /path listing.
    unlockedList: function (p) {
      var out = []
      for (var k in TRIGGERS) if (TRIGGERS.hasOwnProperty(k) && isUnlocked(p, k)) out.push(k)
      if (isUnlocked(p, 'wall')) out.push('wall')
      return out
    },
  }

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
      for (var j = 0; j < ids.length; j++) if (id === ids[j]) return true
    }
    return false
  }

  // introductions.js stamps veldora_refused_<key> when a scene is declined or
  // walked away from. Any of them present means this player has turned somebody
  // down, which is Wall's whole entry condition.
  function hasRefused(p) {
    var keys = ['blade', 'salvage', 'forge', 'art', 'wall', 'crown']
    for (var i = 0; i < keys.length; i++) {
      try {
        if ((p.persistentData.getInt('veldora_refused_' + keys[i]) || 0) > 0) return true
      } catch (e) { }
    }
    return false
  }

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
    // An admin ran /time set - re-stamp rather than reading ten thousand days.
    if (since > now) { try { p.persistentData.putInt(K_DRIFT, now + 1) } catch (e) { } return 0 }
    return now - since
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. THE UNLOCK - carrying the thing marks the path, whatever else is going on
  // ═══════════════════════════════════════════════════════════════════════════
  // Runs even mid-combat and even while you already walk another path: noticing is
  // not the same as recruiting, and a player who finds a crossbow during a fight
  // has still been noticed.
  function scanUnlocks(server, p) {
    var newly = null
    for (var key in TRIGGERS) {
      if (!TRIGGERS.hasOwnProperty(key)) continue
      if (isUnlocked(p, key)) continue
      if (!carries(p, TRIGGERS[key])) continue
      if (unlock(p, key)) newly = newly || key
    }
    // Wall unlocks by drifting, not by carrying.
    if (!isUnlocked(p, 'wall') && hasRefused(p)) {
      var d = driftDays(server, p)
      if (d !== null && d >= WALL_DAYS) {
        if (unlock(p, 'wall')) newly = newly || 'wall'
      }
    }
    return newly
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. THE OFFER - once, ever, and never mid-fight
  // ═══════════════════════════════════════════════════════════════════════════
  function pendingOffer(p) {
    var keys = ['blade', 'salvage', 'forge', 'art', 'wall']
    for (var i = 0; i < keys.length; i++) {
      if (isUnlocked(p, keys[i]) && !wasOffered(p, keys[i])) return keys[i]
    }
    return null
  }

  function makeOffer(server, p, key) {
    // 🚨 STAMPED BEFORE THE SCENE, not after. "It only fires once" has to survive
    // the scene failing to open - if the stamp waited for success, a player stuck
    // in another ritual would be re-approached every five seconds forever.
    try { p.persistentData.putInt(K_OFFERED + key, 1) } catch (e) { }
    console.info(TAG + '!! ' + key + ' makes its ONE offer to ' + p.username)

    try {
      p.tell(Text.of(''))
      p.tell(Text.of('§8Something has noticed you.'))
    } catch (e) { }

    server.scheduleInTicks(OFFER_DELAY, function () {
      try {
        // ⚠️ The player's own permission, not the server's: if a player could not
        // take this path by typing it, a god must not take it for them.
        p.runCommandSilent('path ' + key)
      } catch (e) { console.error(TAG + 'offer threw for ' + p.username + ' :: ' + e) }
    })
  }

  function canBeOffered(server, p) {
    var path = ''
    try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { return false }
    if (path) return false                              // already walking one
    try { if (VELDORA.ritual && VELDORA.ritual.active(p)) return false } catch (e) { }
    if (inCombat(server, p)) return false               // ⭐ Ethan's rule
    try {
      if (VELDORA.pathBlocked && VELDORA.pathBlocked(server, p).blocked) return false
    } catch (e) { }
    return true
  }

  function sweep(server) {
    try {
      if (!GATE) { schedule(server); return }
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]

        // Walking a path clears the drift clock, so a later release starts fresh.
        try {
          var cur = VELDORA.paths ? (VELDORA.paths.pathOf(p) || '') : ''
          if (cur && p.persistentData.getInt(K_DRIFT)) p.persistentData.putInt(K_DRIFT, 0)
        } catch (e) { }

        scanUnlocks(server, p)                          // always
        if (!canBeOffered(server, p)) continue
        var key = pendingOffer(p)
        if (key) makeOffer(server, p, key)
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    schedule(server)
  }

  function schedule(server) { server.scheduleInTicks(SWEEP, function () { sweep(server) }) }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // "Why has nobody chosen me?" - the question this system will always raise.
    var root = Commands.literal('chosen').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var path = ''
      try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { }
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6You are chosen. You do not choose.'))
      p.tell(Text.of('§8walking: §f' + (path || 'nothing')))
      var keys = ['blade', 'salvage', 'forge', 'art', 'wall']
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i]
        var u = isUnlocked(p, k)
        var o = wasOffered(p, k)
        p.tell(Text.of((u ? '§a  unlocked ' : '§8  locked   ') + '§f' + k +
          (u ? (o ? ' §8(offer made - use /path ' + k + ')' : ' §e(offer pending)') : '')))
      }
      p.tell(Text.of('§8in combat: §f' + (inCombat(srv, p) ? 'yes - no offers now' : 'no')))
      return 1
    })
    // Testing: forget everything so the whole flow can be run again.
    root = root.then(Commands.literal('reset').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var keys = ['blade', 'salvage', 'forge', 'art', 'wall']
      for (var i = 0; i < keys.length; i++) {
        try {
          p.persistentData.putInt(K_UNLOCK + keys[i], 0)
          p.persistentData.putInt(K_OFFERED + keys[i], 0)
        } catch (e) { }
      }
      try { p.persistentData.putInt(K_DRIFT, 0) } catch (e) { }
      p.tell(Text.of('§7Nobody knows you.'))
      return 1
    }))
    event.register(root)
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF - players choose freely with /path'); return }
    schedule(event.server)
    var t = []
    for (var k in TRIGGERS) if (TRIGGERS.hasOwnProperty(k)) t.push(k + ':' + TRIGGERS[k][0])
    console.info(TAG + 'YOU ARE CHOSEN - ' + t.join(', ') + ', wall: refused + ' +
      WALL_DAYS + ' pathless days.')
    console.info(TAG + 'carrying it UNLOCKS the path forever; the offer fires ONCE, ' +
      'out of combat only (' + COMBAT_WINDOW + 't since damage). After that /path ' +
      'takes you back - and /path only lists what you have unlocked.')
  })
})();
