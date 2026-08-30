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
  // 🚨 THE GOD ROSTER, EXPLICITLY. `TRIGGERS` was doing double duty as this and
  // it never was one - it is the list of gods unlocked BY CARRYING, which used to be
  // four of five and is now three. Every place that treated it as "all the gods"
  // silently lost Blade and Salvage the moment E1 and E2 moved them off items.
  var ALL = ['blade', 'salvage', 'wall', 'forge', 'art']

  // ════════════════════════════════════════════════════════════════════════
  // ⭐ E3 - WALL'S SECOND ROUTE: THIRTY DAYS WITH NOBODY, IN PLAYED TIME.
  //
  // Ethan, 2026-08-29, ruling the open question: *"played time."*
  //
  // 🔑 WHY IT HAD TO BE. fall.js counted WORLD days, which pass while you are logged
  // out - so a player could earn Wall's attention by not playing. Played time is the
  // only measure that means *you spent thirty days with nobody* rather than *your
  // server was up for thirty days*. Same reasoning ranks.js records for Forge's
  // boredom and tide.js for its clock: logging off never brings a god closer.
  //
  // ⚠️ "THIRTY DAYS" IS THIRTY MINECRAFT DAY-CYCLES OF PLAY - 30 x 24000 ticks = ten
  // hours at the keyboard. Thirty REAL days of playtime would be 720 hours and nobody
  // would ever see it; thirty world days would be the thing the ruling just rejected.
  var DRIFT_DAYS = 30
  var DRIFT_TICKS = DRIFT_DAYS * 24000

  // 🚨 ITS OWN KEY, and NOT `veldora_pathless_since`. That one is vestigial - the
  // sweep still clears it, nothing reads it - and its name says "since", i.e. a
  // timestamp. Reusing a timestamp key as an accumulator is EXACTLY the bug this file's
  // own header spends a paragraph on: `veldora_refused_<key>` was a tick deadline read
  // as a boolean, and it silently broke Wall's unlock with no error anywhere.
  var K_PATHLESS = 'veldora_pathless_ticks'

  function pathlessTicks(p) {
    try {
      var v = p.persistentData.getInt(K_PATHLESS)
      return (typeof v === 'number' && isFinite(v) && v > 0) ? v : 0
    } catch (e) { return 0 }
  }

  // Called once per sweep, per ONLINE player. A player who is not online does not get
  // swept, which is the whole mechanism - there is nothing else to enforce it.
  function driftTick(p, pathed) {
    try {
      if (pathed) {
        if (pathlessTicks(p) > 0) p.persistentData.putInt(K_PATHLESS, 0)
        return 0
      }
      var n = pathlessTicks(p) + SWEEP
      p.persistentData.putInt(K_PATHLESS, n)
      return n
    } catch (e) { return 0 }
  }

  function driftDays(p) { return Math.floor(pathlessTicks(p) / 24000) }

  var bladeWarned = false
  var dealsWarned = false

  // She has been paid. art_deal.js owns the stamp; this only reads it.
  function artTook(p) {
    try { return (p.persistentData.getInt('veldora_art_took') || 0) > 0 } catch (e) { return false }
  }

  // 🚨 THE DISPLAY WAS A TWO-WAY BRANCH, and it had to stop being one. It read
  // `TRIGGERS[k] ? 'carry X' : 'be killed while pathless'` - so the moment Blade left
  // the carry table it would have told the player, confidently and in his own row, to
  // go get killed while pathless to reach HIM. There are three kinds of condition now
  // and the display has to know it, or it lies to the only person who reads it.
  function howTo(p, k) {
    if (TRIGGERS[k]) return 'carry ' + TRIGGERS[k][0].split(':')[1]
    if (k === 'wall') {
      return 'be killed by a champion while pathless, or drift ' +
        driftDays(p) + '/' + DRIFT_DAYS + ' played days'
    }
    if (k === 'blade') {
      try {
        if (VELDORA.slain) return 'slay ' + VELDORA.slain.count(p) + '/' + VELDORA.slain.threshold
      } catch (e) { }
      return 'slay - UNAVAILABLE, slain.js is missing'
    }
    if (k === 'art') {
      try {
        if (VELDORA.artdeal) {
          return 'meet her in the deep with ' + VELDORA.artdeal.minLevels +
            '+ levels and take her deal'
        }
      } catch (e) { }
      return 'her deal - UNAVAILABLE, art_deal.js is missing'
    }
    if (k === 'salvage') {
      try {
        if (VELDORA.deals) return 'take her deals ' + VELDORA.deals.taken(p) + '/' + VELDORA.deals.threshold
      } catch (e) { }
      return 'her deals - UNAVAILABLE, salvage_deals.js is missing'
    }
    return 'unknown - nobody has written this condition'
  }
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
  // ⚠️ THIS SAID "Art and Forge are CLOSED in paths.js" AND THEY ARE NOT. That
  // file's `CLOSED` map is now `{}` - *"EVERY PATH IN VELDORA IS NOW CLAIMABLE"* - so
  // the comment was describing a state that had already been lifted. Left as a warning
  // about itself: `isClosed()` is still consulted below and still the right question,
  // but nothing here should assume the ANSWER.
  // ⛔ BLADE IS NO LONGER AN ITEM. Ethan, 2026-08-29: *"for chosen, i want to make
  // that honestly harder to accomplish we can probably change it to mobs slain because
  // tetra is too good to pass up."*
  //
  // 🔑 Two reasons, and the second is the load-bearing one. Carrying an iron sword is
  // a thing you do in your first ten minutes, which is not "he takes the proven". And
  // tetra makes a tool's IDENTITY unstable - a tetra sword is not minecraft:iron_sword,
  // so the trigger would silently stop firing for exactly the players most likely to
  // deserve it. An item id is not a safe thing to key a condition on in this pack.
  //
  // His route now lives below, next to Wall's, because neither is a carry.
  // ⛔ SALVAGE IS NO LONGER AN ITEM EITHER. `docs/67`: *"She randomly offers
  // godless players deals. All of them suck. Accept 5."* That IS her condition, and a
  // crossbow is a ten-minute shortcut straight past it - the same objection that took
  // Blade off the iron sword.
  // ⛔ ART IS NO LONGER LAPIS EITHER (E4). `docs/67` makes her deal the condition,
  // and lapis was actively harmful besides - this file's own history records it
  // MEASURED on the live world: *"art unlocks off LAPIS, so the closed god spends
  // everybody's one offer within minutes of spawning... both players carried
  // offered_art=1."* Lapis is in every ravine; it was never a choice.
  //
  // ⭐ FORGE IS THE LAST CARRY, and correctly so: a Create wrench is a thing you MADE,
  // which is the only item in the pack that means anything about you.
  var TRIGGERS = {
    forge: ['create:wrench'],
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ WALL HAS TWO ROUTES, AND NEITHER IS AN ITEM
  // ═══════════════════════════════════════════════════════════════════════════
  // Ethan, 2026-08-16: "what if we add another conditional instead of an item.
  // no paths for 7 days and being killed by a player with a path?"
  //
  //   ROUTE 1  refused somebody, then drifted 3 days
  //   ROUTE 2  drifted 7 days AND were killed by another player's champion
  //
  // ⭐ ROUTE 2 IS THE BEST TRIGGER IN THE WHOLE SYSTEM. Every other god notices you
  // for something you ACHIEVED - you made a sword, you crafted a crossbow. She
  // notices you at the exact moment somebody else's champion put you in the dirt,
  // after a week of nobody wanting you. It is not a reward. It is the worst evening
  // you have had, and she is the one who shows up.
  //
  // "They rejected you too. I won't." She is not lying, and now the game has watched
  // it happen before she says it.
  //
  // 🚨 THE KILLER MUST HAVE A PATH. Being killed by a random player is a scuffle;
  // being killed by a GOD'S CHAMPION while you belong to nobody is the story. If
  // the killer is pathless too, nothing is stamped.
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 REWRITTEN 2026-08-16. Ethan: "lets remove the refused from the 7 day. and
  // then getting killed by a pathless player on respawn has the wall offer."
  // Confirmed: DROP THE DAY ROUTE ENTIRELY, and the killer may be ANYBODY - only
  // the victim has to be pathless.
  //
  // ── WHY THE DAY ROUTES WENT ─────────────────────────────────────────────────
  // Both of them were unreachable in practice and one was unreachable by accident.
  //
  //   · Route 1 needed hasRefused(), which reads `veldora_refused_<key>` - a key
  //     introductions.js writes as a TICK DEADLINE for its one-day silence, not as
  //     a boolean. It worked only because the stamp is never cleared on expiry, and
  //     refusedUntil()'s clock-moved branch writes 0 back, which would have erased
  //     "has ever refused" with no error at all. Wall's unlock was resting on
  //     another file's cooldown storage.
  //   · And you could not get a refusal to refuse: art unlocks off LAPIS, so the
  //     closed god spends everybody's one offer within minutes of spawning.
  //     Measured on the live world - both players carried offered_art=1.
  //
  // ── WHAT IS LEFT IS THE BEST TRIGGER IN THE SYSTEM ──────────────────────────
  // Every other god notices you for something you ACHIEVED - you made a sword, you
  // carried a crossbow. She notices you at the exact moment somebody put you in the
  // dirt while you belonged to nobody. It is not a reward. It is the worst evening
  // you have had, and she is the one who shows up.
  //
  // "They rejected you too. I won't." She is not lying, and now the game has
  // watched it happen immediately before she says it.
  //
  // 🚨 THE KILLER IS NOT CHECKED, AND THAT IS DELIBERATE. The old rule required a
  // GOD'S CHAMPION, which reads better and does not work: paths are exclusive on a
  // four-player server, so on the live world exactly one player held a path and the
  // only pathless player could not be killed by a champion he was not fighting.
  // A rule nobody can satisfy is not a stricter rule, it is a dead one.
  var K_STRUCK = 'veldora_wall_struck'   // somebody killed you while you had nobody

  EntityEvents.death(function (event) {
    if (!GATE) return
    try {
      var victim = event.entity
      if (!victim || !victim.player) return

      // Only the pathless. Somebody who walks a path already has a god.
      var vPath = ''
      try { if (VELDORA.paths) vPath = VELDORA.paths.pathOf(victim) || '' } catch (e) { return }
      if (vPath) return

      var killer = event.source ? event.source.player : null
      if (!killer) return
      try { if (String(killer.uuid) === String(victim.uuid)) return } catch (e) { return }

      // ⭐⭐ E3 ROUTE 1 - THE KILLER MUST HOLD A PATH. Restored 2026-08-29.
      //
      // 🚨 THE READ MOVED ABOVE THE STAMP, and that ordering is the whole fix. The
      // stamp used to happen first and the killer's path was read afterwards purely to
      // decorate the log line - so adding the check below it would have marked the
      // victim struck and THEN decided not to count it, burning their one stamp on a
      // death that does not qualify. Silently, and once per player forever.
      //
      // ⚠️ THIS REVERSES THE 08-16 RULING ABOVE, and that note is right about its own
      // moment: alone, the champion requirement was unsatisfiable, because paths are
      // exclusive and one player held the only one. *"A rule nobody can satisfy is not
      // a stricter rule, it is a dead one."*
      //
      // 🔑 WHAT CHANGED IS NOT THE ARGUMENT, IT IS THE SHAPE. `docs/67` pairs this
      // with a SECOND door - thirty played days with nobody - which opens on its own
      // with no other player involved at all. The strict version is no longer the only
      // way in, so it is no longer dead. Both routes exist or neither should.
      var kPath = ''
      try { if (VELDORA.paths) kPath = VELDORA.paths.pathOf(killer) || '' } catch (e) { }
      if (!kPath) {
        console.info(TAG + victim.username + ' was killed by ' + killer.username +
          ', who walks no path either - a scuffle, not a story. Nothing stamped. ' +
          '(The drift route is still open: ' + driftDays(victim) + '/' + DRIFT_DAYS + ')')
        return
      }

      try {
        if ((victim.persistentData.getInt(K_STRUCK) || 0) > 0) return
        victim.persistentData.putInt(K_STRUCK, 1)
      } catch (e) { return }
      console.info(TAG + '!! ' + victim.username + ' was killed by ' + killer.username +
        ' (champion of ' + kPath + ') while walking no path - the Spider noticed. ' +
        'She arrives ON RESPAWN.')
    } catch (err) { console.warn(TAG + 'struck hook threw :: ' + err) }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ SHE ARRIVES ON RESPAWN, not on the next sweep. Ethan's wording was "on
  // respawn has the wall offer", and the beat is the whole point: you are standing
  // at your bed with nothing, and that is when she speaks.
  //
  // ⚠️ THE COMBAT GATE HAD TO BE HANDLED OR THIS COULD NEVER FIRE. canBeOffered()
  // refuses inside COMBAT_WINDOW of the last damage - and you were damaged a moment
  // ago, by definition, because you died. Dying ENDS a fight, so the death clears
  // the stamp rather than this route bypassing the check. That is correct for every
  // other offer too, and it was a latent bug for all of them.
  // ═══════════════════════════════════════════════════════════════════════════
  var RESPAWN_DELAY = 100          // 5s - let the respawn screen clear first

  PlayerEvents.respawned(function (event) {
    if (!GATE) return
    try {
      var p = event.player
      if (!p) return
      var server = null
      try { server = p.server } catch (e) { return }
      if (!server) return

      // The fight is over. See the note above.
      try { delete lastHurt[String(p.uuid)] } catch (e) { }

      // ⭐⭐ E4 - ART IS CHOSEN ON RESPAWN TOO, and deliberately on the SAME hook
      // as Wall's rather than a second one. `docs/67`: *"it kills you, and you are
      // chosen on respawn (symmetric with Wall's, 100t)"* - and symmetry here is not
      // decoration, it is why both arrive with the same beat after the screen clears.
      //
      // ⚠️ HERS IS CHECKED FIRST. A player she emptied and killed died holding
      // nothing and walking no path - which also satisfies Wall's route if anybody
      // pathed happened to be involved. The one they PAID for wins.
      if (artTook(p) && !isUnlocked(p, 'art')) {
        server.scheduleInTicks(RESPAWN_DELAY, function () {
          try {
            if (isUnlocked(p, 'art')) return
            if (!unlock(p, 'art')) return
            console.info(TAG + p.username + ' unlocked art - she took every level ' +
              'they had and killed them, and they knew she would.')
            if (!canBeOffered(server, p)) {
              console.info(TAG + '...but they cannot be offered right now. Unlocked; ' +
                'the sweep will make the offer.')
              return
            }
            makeOffer(server, p, 'art')
          } catch (e) { console.warn(TAG + 'art respawn offer threw :: ' + e) }
        })
        return
      }

      if (!wasStruck(p)) return
      if (isUnlocked(p, 'wall')) return

      server.scheduleInTicks(RESPAWN_DELAY, function () {
        try {
          // Re-check everything at the moment it would actually land: five seconds
          // is long enough to take a path, die again, or be put in a scene.
          if (isUnlocked(p, 'wall')) return
          if (!canBeOffered(server, p)) {
            console.info(TAG + p.username + ' was struck but cannot be offered right ' +
              'now - the sweep will pick it up')
            unlock(p, 'wall')
            return
          }
          if (!unlock(p, 'wall')) return
          if (wallIsTaken(server)) {
            console.warn(TAG + 'wall is already held - unlocked it for ' + p.username +
              ' but NOT spending their one offer on a path they cannot take')
            return
          }
          makeOffer(server, p, 'wall')
        } catch (e) { console.warn(TAG + 'respawn offer threw :: ' + e) }
      })
    } catch (err) { console.warn(TAG + 'respawn hook threw :: ' + err) }
  })

  // Spending the ONE offer on a path somebody else holds would burn it for nothing
  // - paths.js would answer "held by X" and the flag would already be stamped.
  function wallIsTaken(server) {
    try {
      if (VELDORA.paths && typeof VELDORA.paths.holderOf === 'function') {
        var h = VELDORA.paths.holderOf(server, 'wall')
        return !!(h && String(h).length)
      }
    } catch (e) { }
    return false                     // unreadable: let the offer happen
  }

  function wasStruck(p) {
    try { return (p.persistentData.getInt(K_STRUCK) || 0) > 0 } catch (e) { return false }
  }

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

  // (worldDay() went with driftDays() - nothing in this file counts days any more.)

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
    // 🚨 ITERATES `ALL`, NOT `TRIGGERS`. This read the carry table and bolted
    // `wall` on by hand, which worked only while carrying was the rule for everyone
    // else. The moment Blade and Salvage left it, an unlocked Blade stopped appearing
    // in the player's own list - they would have unlocked him, seen nothing, and had
    // no way to tell a bug from a condition not met.
    unlockedList: function (p) {
      var out = []
      for (var i = 0; i < ALL.length; i++) if (isUnlocked(p, ALL[i])) out.push(ALL[i])
      return out
    },
    // E3, exposed so the drift clock can be driven in a harness. Nobody can sit
    // through thirty days of played time to confirm it counted thirty.
    driftDays: driftDays,
    driftTicks: pathlessTicks,
    driftNeeded: DRIFT_DAYS,
    _driftTick: driftTick,
    _scan: scanUnlocks,
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
  // 🔴 hasRefused() and driftDays() are GONE (2026-08-16, with the day routes).
  //
  // hasRefused() read `veldora_refused_<key>`, which introductions.js writes as a
  // TICK DEADLINE for its one-in-game-day silence. Treating a cooldown stamp as a
  // boolean worked only because nothing clears it on expiry - and refusedUntil()'s
  // clock-moved branch writes 0 back, which would have silently un-refused a player
  // and broken Wall's unlock with no error anywhere. If a future route ever needs
  // "has ever refused somebody", it gets ITS OWN KEY. Do not read that one.
  //
  // K_DRIFT is still WRITTEN below (the sweep clears it when you take a path) so
  // existing player data stays coherent, but nothing reads it for an unlock now.

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
    // ⭐ E1 - BLADE NOTICES THE PROVEN. 500 mobs, lifetime, and the tally is
    // slain.js's own key rather than his trust counter - which resets.
    //
    // ⚠️ FAILS CLOSED, unlike the night gate. If slain.js is missing this must NOT
    // unlock him: an unlock is spent FOREVER and cannot be taken back, so the safe
    // direction here is the opposite of the safe direction there. And it says so.
    if (!isUnlocked(p, 'blade')) {
      var slainOk = false
      try {
        if (VELDORA.slain && typeof VELDORA.slain.qualifies === 'function') {
          slainOk = VELDORA.slain.qualifies(p) === true
        } else if (!bladeWarned) {
          bladeWarned = true
          console.warn(TAG + 'slain.js is MISSING - Blade can never be unlocked. This ' +
            'is a FAILURE, not a player who has not killed enough.')
        }
      } catch (e) { slainOk = false }
      if (slainOk && unlock(p, 'blade')) {
        newly = newly || 'blade'
        console.info(TAG + p.username + ' unlocked blade - ' +
          VELDORA.slain.count(p) + ' slain, lifetime')
      }
    }

    // ⭐ E2 - SALVAGE HAS YOU WHEN YOU HAVE SAID YES FIVE TIMES. Same shape as
    // Blade's, same reasons: its own never-reset key, and it FAILS CLOSED because an
    // unlock is spent forever.
    if (!isUnlocked(p, 'salvage')) {
      var dealsOk = false
      try {
        if (VELDORA.deals && typeof VELDORA.deals.qualifies === 'function') {
          dealsOk = VELDORA.deals.qualifies(p) === true
        } else if (!dealsWarned) {
          dealsWarned = true
          console.warn(TAG + 'salvage_deals.js is MISSING - Salvage can never be ' +
            'unlocked. This is a FAILURE, not a player who kept saying no.')
        }
      } catch (e) { dealsOk = false }
      if (dealsOk && unlock(p, 'salvage')) {
        newly = newly || 'salvage'
        console.info(TAG + p.username + ' unlocked salvage - took ' +
          VELDORA.deals.taken(p) + ' bad deals')
      }
    }

    // Wall unlocks by being KILLED while pathless, never by carrying. The offer is
    // made on respawn; this is only the catch-up for a player who was struck while
    // the respawn hook could not reach them (mid-scene, on a fall cooldown, or the
    // server went down between the death and the respawn).
    // ⭐ E3 ROUTE 2 - nobody wanted you for thirty days of play.
    //
    // ⚠️ This route is why ROUTE 1 can be strict again. The 08-16 note below dropped
    // the champion requirement because "a rule nobody can satisfy is not a stricter
    // rule, it is a dead one" - and it was right, ALONE. Paired with a second door
    // that opens on its own, the strict version is reachable rather than dead.
    if (!isUnlocked(p, 'wall') && pathlessTicks(p) >= DRIFT_TICKS) {
      if (unlock(p, 'wall')) {
        newly = newly || 'wall'
        console.info(TAG + p.username + ' unlocked wall - ' + driftDays(p) +
          ' days of PLAYED time with no god. Nobody else wanted them.')
      }
    }

    if (!isUnlocked(p, 'wall') && wasStruck(p)) {
      if (unlock(p, 'wall')) {
        newly = newly || 'wall'
        console.info(TAG + p.username + ' unlocked wall - killed while walking no path ' +
          '(caught by the sweep, not the respawn)')
      }
    }
    return newly
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. THE OFFER - once, ever, and never mid-fight
  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 A CLOSED GOD MUST NEVER SPEND SOMEBODY'S ONE OFFER. Measured on the live
  // world 2026-08-16: BOTH players carried offered_art=1, because art's trigger is
  // LAPIS LAZULI and art is closed. So the first god that ever noticed anyone was
  // one of the two that then refuse them - "Something has noticed you", a scene,
  // and a rejection, and the one offer is gone.
  //
  // Asked at the point of use rather than hard-coded here, so reopening a god is
  // still the single edit in paths.js that it is meant to be.
  function isClosed(key) {
    try {
      if (VELDORA.paths && typeof VELDORA.paths.isClosed === 'function') {
        return !!VELDORA.paths.isClosed(key)
      }
    } catch (e) { }
    return false                     // unreadable: behave as it did before
  }

  function pendingOffer(p) {
    var keys = ['blade', 'salvage', 'forge', 'art', 'wall']
    for (var i = 0; i < keys.length; i++) {
      if (isClosed(keys[i])) continue
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

          // ⭐ E3 - and the PLAYED-TIME clock advances here, where "online" is
          // already true by construction: this loop only ever sees server.players.
          driftTick(p, !!cur)
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
        var shut = isClosed(k)
        p.tell(Text.of((shut ? '§8  CLOSED   ' : u ? '§a  unlocked ' : '§8  locked   ') +
          '§f' + k + (shut ? ' §8(not built - makes no offers)'
            : u ? (o ? ' §8(offer made - use /path ' + k + ')' : ' §e(offer pending)')
              : ' §8(' + howTo(p, k) + ')')))
      }
      p.tell(Text.of('§8the Spider: killed while pathless §f' +
        (wasStruck(p) ? 'YES - she is coming' : 'no') +
        '§8. She arrives on your respawn.'))
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
      try {
        p.persistentData.putInt(K_DRIFT, 0)
        p.persistentData.putInt(K_STRUCK, 0)
      } catch (e) { }
      p.tell(Text.of('§7Nobody knows you.'))
      return 1
    }))
    event.register(root)
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF - players choose freely with /path'); return }
    schedule(event.server)
    // ⚠️ THIS BANNER LISTED `TRIGGERS` AND CALLED IT THE ROSTER, then said
    // "carrying it UNLOCKS the path forever" - false for two of five gods as of E1
    // and E2. It now names all three kinds of condition, and reads them from ALL.
    var t = []
    for (var k = 0; k < ALL.length; k++) {
      var g = ALL[k]
      t.push(g + ':' + (TRIGGERS[g] ? TRIGGERS[g][0].split(':')[1] : 'no item'))
    }
    console.info(TAG + 'YOU ARE CHOSEN - ' + t.join(', ') + '.')
    console.info(TAG + 'THREE KINDS OF CONDITION: CARRY (forge, art) - BLADE takes ' +
      (VELDORA.slain ? VELDORA.slain.threshold : '?') + ' slain, lifetime, never reset. ' +
      'SALVAGE takes ' + (VELDORA.deals ? VELDORA.deals.threshold : '?') + ' bad deals ' +
      'accepted. WALL has TWO routes and no item: a CHAMPION kills you while you walk ' +
      'no path (she offers ON YOUR RESPAWN, ' + RESPAWN_DELAY + 't later), OR you ' +
      'drift ' + DRIFT_DAYS + ' days of PLAYED time with nobody.')
    var shut = []
    for (var ci = 0; ci < ALL.length; ci++) if (isClosed(ALL[ci])) shut.push(ALL[ci])
    if (shut.length) {
      console.info(TAG + 'CLOSED, and therefore excluded from the one-time offer: ' +
        shut.join(', ') + ' - they can no longer spend a player\'s only offer.')
    }
    console.info(TAG + 'meeting the condition UNLOCKS the path forever; the offer fires ONCE, ' +
      'out of combat only (' + COMBAT_WINDOW + 't since damage). After that /path ' +
      'takes you back - and /path only lists what you have unlocked.')
  })
})();
