// ank.js — the stranger who lives in the caves, and does not want you in them.
//
// Ethan, 2026-09-05: *"Ank should spawn on the upper layers of the caves, he should be
// unkillable, and follow the player around until they hit the second layer. this is just
// intro behavior, he will have more later."* And: *"he should disappear when the player
// goes outside or too deep. with the words 'a chill runs up your spine' when he despawns."*
//
// ── ⭐ WHAT IS HERE, AND WHAT IS NOT ────────────────────────────────────────
// Almost none of Ank is in this file. He is a PRESET —
// `tools/make_npc_datapack.py` → `mcserver_npcs` — which owns his model, his skin, his
// unkillability and his following. That is Easy NPC's job and it does it without code.
//
// 🔑 THIS FILE OWNS EXACTLY ONE THING: THE BAND HE EXISTS IN. Spawn when the player is in
// the upper caves, leave when they surface or go deeper. Nothing else.
//
// ── 🔴 THE BAND, AND WHY THESE NUMBERS ──────────────────────────────────────
// `help.js` already tells the player the strata, so the game has committed to them:
//
//     0 to -32     the old diggings      <- Ank's band. "the upper layers"
//   -32 to -52     the deep works        <- "the second layer". He leaves.
//   -52 to floor   the sealed floor
//
// ⚠️ SO -32 IS NOT A NUMBER I PICKED. It is the boundary the game already names out loud,
// which makes it the only honest default — but it is a DESIGN number and it lives in
// `docs/ACT0.md`'s ledger, not only here.
//
// ── ⚠️ "OUTSIDE" IS SKY, NOT HEIGHT ─────────────────────────────────────────
// A player at y=70 in a cave under a mountain is not outside; one at y=-5 in a ravine open
// to the sky is. So the test is `canSeeSky`, the same one tide.js uses — and it returns
// NULL when it cannot be read, which is never treated as false. An unreadable sky must not
// silently despawn him.
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[ank] '
  var GATE = true

  var PRESET = 'arkhdottir/ank'
  var TAG_NAME = 'veldora_ank'          // scoreboard tag, so we can find our own NPC
  var K_ACTIVE = 'veldora_ank_active'   // per-player: is he out with them right now

  // ── the band ───────────────────────────────────────────────────────────────
  // ⚠️ TOP IS NOT 0. The old diggings run from the surface down, and a cave mouth at y=40
  // is still the upper caves - "underground" is decided by the SKY test, not by height.
  // This is only the floor of his band.
  var TOO_DEEP = -32                    // help.js: the deep works begin here

  // ⭐ HYSTERESIS. Without it a player standing exactly on the boundary, or bobbing at a
  // cave mouth, spawns and despawns him every few seconds - and each despawn would fire
  // "a chill runs up your spine". A line that repeats on a loop stops being eerie and
  // becomes a bug you can see. He leaves at -32 and will not come back above -30.
  var COME_BACK = -30

  var CHECK_EVERY = 40                  // 2s. He is a presence, not a trap.

  // 🚨 THE LINE IS ETHAN'S, VERBATIM. Ank does not say it - it is not his voice, it is the
  // player's own body. So it goes through announce.js's AMBIENT priority, the "comes from
  // nobody" surface trespass.js uses, and NOT through voice.js, which colours by god and
  // would attribute the chill to a speaker.
  var CHILL = 'A chill runs up your spine.'

  function seesSky(p) {
    try {
      var lvl = p.level
      if (lvl && typeof lvl.canSeeSky === 'function') return !!lvl.canSeeSky(p.blockPosition())
      var b = p.block
      if (b && typeof b.canSeeSky === 'boolean') return !!b.canSeeSky
      if (b && typeof b.canSeeSky === 'function') return !!b.canSeeSky()
    } catch (e) { }
    return null                        // ⛔ unreadable. NEVER guess - see below.
  }

  function yOf(p) {
    try { var y = p.y; if (typeof y === 'number' && isFinite(y)) return y } catch (e) { }
    return null
  }

  /**
   * Should Ank be out with this player?
   *
   * ⚠️ TRI-STATE, DELIBERATELY. `null` means "cannot tell", and the caller does NOTHING
   * on null rather than despawning. "I could not read the sky" and "the player is outside"
   * are different events, and letting them share a return value is how this project's
   * worst bugs have looked: fail-soft hiding total failure.
   */
  function shouldBeOut(p) {
    var y = yOf(p)
    if (y === null) return null
    var sky = seesSky(p)
    if (sky === null) return null
    if (sky) return false               // outside
    if (y < TOO_DEEP) return false      // too deep
    return true
  }

  function isActive(p) {
    try { return !!p.persistentData.getBoolean(K_ACTIVE) } catch (e) { return false }
  }
  function setActive(p, v) {
    try { p.persistentData.putBoolean(K_ACTIVE, !!v) } catch (e) { }
  }

  // ── his body ───────────────────────────────────────────────────────────────
  // ⚠️ FOUND BY TAG, NOT BY TYPE. `@e[type=easy_npc:humanoid]` would also match every other
  // humanoid NPC this project ever adds, and the first one of those would be despawned by
  // Ank's boundary check with nothing to explain it.
  function spawn(srv, p) {
    try {
      srv.runCommandSilent('execute at ' + p.username +
        ' run easy_npc spawn ' + PRESET + ' ~ ~ ~')
      // Tag whatever just appeared nearest to the player, so the boundary check can find
      // him again. ⚠️ Runs as a separate command because the spawn does not return a handle.
      srv.runCommandSilent('execute at ' + p.username +
        ' run tag @e[type=easy_npc:humanoid,limit=1,sort=nearest,distance=..8] add ' + TAG_NAME)
      return true
    } catch (e) {
      console.error(TAG + 'spawn failed for ' + p.username + ' :: ' + e)
      return false
    }
  }

  function despawn(srv, p) {
    try {
      srv.runCommandSilent('execute at ' + p.username +
        ' run kill @e[tag=' + TAG_NAME + ',distance=..96]')
      return true
    } catch (e) {
      console.error(TAG + 'despawn failed for ' + p.username + ' :: ' + e)
      return false
    }
  }

  // ⚠️ `kill` ON AN INVULNERABLE ENTITY IS THE OPEN QUESTION. Vanilla /kill bypasses
  // invulnerability for most entities, but Easy NPC has its own damage handling and the
  // preset sets Invulnerable:1b. If he survives this, the fallback is
  // `easy_npc despawn` - which is why that command exists in the mod.
  // NEEDS-GAME: kill removes an Invulnerable Easy NPC, or we need `easy_npc despawn` :: /ank test

  function chill(srv, p) {
    try {
      if (!VELDORA.announce || typeof VELDORA.announce.text !== 'function') {
        console.warn(TAG + 'announce.js is missing - he leaves in SILENCE, which is a ' +
          'failure and not a quiet exit')
        return false
      }
      return VELDORA.announce.text(srv, p, CHILL, VELDORA.announce.P_AMBIENT)
    } catch (e) { console.warn(TAG + 'the chill threw :: ' + e); return false }
  }

  // ── the sweep ──────────────────────────────────────────────────────────────
  function consider(srv, p) {
    var want = shouldBeOut(p)
    if (want === null) return 'unreadable'   // ⛔ do nothing. See shouldBeOut.
    var out = isActive(p)

    // ⭐ HYSTERESIS, AND IT HAS TO BE CHECKED **BEFORE** THE SPAWN BRANCH.
    //
    // 🔴 IT WAS BELOW IT FIRST AND WAS THEREFORE DECORATIVE: at y=-31 `want` is already
    // true, so the spawn branch fired and the gap check was never reached. A player
    // bobbing on the boundary got him back one block up, and the two-block band did
    // nothing at all. The harness caught it; nothing in game would have, because the
    // symptom is a line repeating and that reads as a design choice.
    //
    // Between TOO_DEEP and COME_BACK he is neither spawned nor despawned. You have to
    // climb properly clear before he returns.
    if (!out) {
      var gy = yOf(p)
      if (gy !== null && gy < COME_BACK && gy >= TOO_DEEP) return 'in-the-gap'
    }

    if (want && !out) {
      if (!spawn(srv, p)) return 'spawn-failed'
      setActive(p, true)
      console.info(TAG + p.username + ' - Ank steps out (y ' + Math.round(yOf(p)) + ')')
      return 'spawned'
    }

    if (!want && out) {
      // ⭐ THE CHILL FIRES WHETHER OR NOT THE BODY WENT. A despawn that failed and a
      // despawn that worked look the same to the player, and the line is the beat - but
      // the LOG must tell them apart, or a stuck Ank is invisible.
      var gone = despawn(srv, p)
      setActive(p, false)
      chill(srv, p)
      if (!gone) console.warn(TAG + p.username + ' - the chill fired but the despawn FAILED')
      else console.info(TAG + p.username + ' - Ank is gone (y ' + Math.round(yOf(p)) + ')')
      return gone ? 'despawned' : 'despawn-failed'
    }

    return out ? 'with-you' : 'away'
  }

  VELDORA.ank = {
    consider: consider,
    shouldBeOut: shouldBeOut,
    isActive: isActive,
    TOO_DEEP: TOO_DEEP,
    COME_BACK: COME_BACK,
    CHILL: CHILL,
  }

  ServerEvents.tick(function (event) {
    if (!GATE) return
    var srv = event.server
    if (!srv) return
    if (srv.tickCount % CHECK_EVERY !== 0) return
    try {
      var ps = srv.players
      for (var i = 0; i < ps.length; i++) {
        // ⛔ ACT 0 ONLY. A player who has taken a path is past him; Ank is the stranger
        // you meet BEFORE anybody knows you exist.
        var path = null
        try { if (VELDORA.paths && VELDORA.paths.pathOf) path = VELDORA.paths.pathOf(ps[i]) } catch (e) { }
        if (path) continue
        try { consider(srv, ps[i]) } catch (e) { }
      }
    } catch (e) { }
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    var root = Commands.literal('ank').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var want = shouldBeOut(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7y §f' + Math.round(yOf(p)) + '§7 · sky §f' + String(seesSky(p)) +
        '§7 · band ends at §f' + TOO_DEEP))
      p.tell(Text.of('§7should be out: §f' +
        (want === null ? '§cUNREADABLE - nothing will happen' : String(want))))
      p.tell(Text.of('§7active: §f' + isActive(p)))
      p.tell(Text.of('§8/ank test §7force one sweep · §8/ank clear §7forget him'))
      return 1
    })

    root = root.then(Commands.literal('test').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      p.tell(Text.of('§7' + consider(ctx.source.server, p)))
      return 1
    }))

    root = root.then(Commands.literal('clear').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      despawn(ctx.source.server, p)
      setActive(p, false)
      p.tell(Text.of('§7forgotten - he will step out again next time you are in the band.'))
      return 1
    }))

    event.register(root)
  })

  ServerEvents.loaded(function () {
    console.info(TAG + 'Ank is live. Upper caves only, above y' + TOO_DEEP +
      ', pathless players only. He is a PRESET (' + PRESET + '); this file owns only ' +
      'the band he exists in.')
  })
})();
