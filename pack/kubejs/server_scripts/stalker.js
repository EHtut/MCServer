// stalker.js — C5 + C6 of the Stalker build.  docs/19-STALKER-BUILD.md
//
// C5  THE INVARIANT: in phases 1–3 a stalker cannot die. Below the flee
//     threshold the incoming damage is CANCELLED, it leaves, and it is
//     discarded. If a stalker dies even once, every player learns it is killable
//     and the illusion is over. This has no partial credit.
//
// C6  THE PHASES: one creature, four faces.
//       0–24   THE HELPER      appears only at low health, kills your attacker,
//                              stays a few seconds, leaves
//       25–74  THE COMPANION   a tamed dog. follows, retaliates — including
//                              against other players
//       75–99  THE ABSENCE     gone. no warning, no message.
//       100    THE HARVEST     C7 owns this; C6 only stands aside for it
//
// ── How the damage guard works ───────────────────────────────────────────────
// It is PRE-EMPTIVE, not reactive. Watching health and reacting when it drops
// cannot work — a large hit lands before any sweep could run. Every incoming hit
// is inspected BEFORE it applies, and if it would cross the threshold it is
// cancelled ENTIRELY, so health can never fall below the line whatever the blow.
// Damage that would NOT cross it is allowed through, so friends helping in a
// fight genuinely push it toward leaving.
//
// ── C0 findings this is built on (each fails SILENTLY if ignored) ────────────
//  · the event is EntityEvents.beforeHurt — `hurt` does not exist
//  · event.cancel() unwinds by THROWING; inside a try/catch it is swallowed
//  · attribute ids are minecraft:generic.*
;(function () {
  // ═══════════════════════════════════════════════════════════════════════════
  // 🪦 RETIRED 2026-08-15. Ethan: "I am thinking we just get rid of the stalker
  // mechanic tbh and just have the harvest."
  //
  // The escalation moved to phase.js and the Harvest to harvest.js. What died here
  // was the LEASH, and only the leash:
  //
  //   keepDistance / DIST_NEAR / DIST_FAR · the Helper · owner tagging and the
  //   bench · the piglin anger rule · the damage veto and its beforeHurt hard
  //   stops · the detarget sweeps · the recasting migration · C8 stalker-vs-stalker
  //
  // Every bug this project produced in the entity half came from that list. The
  // Helper was culled by its own sweep and had NEVER ONCE HELPED. keepDistance
  // flung a bench patron a hundred blocks. Minions stayed permanently aggroed. The
  // hostility veto cancelled damage on every swing because Born in Chaos mobs
  // cannot be made friendly. None of it was content; all of it was rope.
  //
  // And the stalker was the FIRST attempt at "things happen to you". Everything
  // built 2026-08-15 does it better without a rope: the trades open themselves,
  // the reckonings collect, the events arrive, the spawner sends waves.
  //
  // 🔑 The file is kept rather than deleted because its COMMENTS are the record of
  // eight separate measured findings - the pumpkin's boss bar, the isMonster()
  // saga, the finalizeSpawn warning, the sticky-edge cap. Deleting it would delete
  // the reasons.
  //
  // To revive: set RETIRED = false. Expect it to fight phase.js over
  // VELDORA.stalkerPhase, which is why it returns BEFORE publishing anything.
  // ═══════════════════════════════════════════════════════════════════════════
  var RETIRED = true
  if (RETIRED) {
    ServerEvents.loaded(function () {
      console.info('[stalker] RETIRED - escalation is phase.js, the Harvest is ' +
        'harvest.js. This file publishes nothing and hooks nothing.')
    })
    return
  }

  var OWNER = 'veldora_stalker_owner'
  var PATHKEY = 'veldora_stalker_path'
  var BENCH = 'veldora_bench'   // a /patron summon: exempt from distance-keeping
  var FLEEING = 'veldora_stalker_fleeing'
  var STATE = 'veldora_stalker_state'     // server.persistentData: uuid -> { phase }
  var FLEE_AT = 0.35
  var SCALE = 1.25
  // A mob closes roughly 10 blocks in 2 seconds, so a 2s sweep let a Companion
  // cross from the inner ring to arm's reach between checks. The ring runs every
  // second; the EXPENSIVE part - the duplicate scan, a 148-block RADIUS box that
  // has to cover the whole ring - runs every tenth pass, because orphans only
  // ever arise across restarts and dimension changes, never mid-second.
  var SWEEP = 20                          // ticks between phase sweeps (1s)
  var CULL_EVERY = 10                     // sweeps between duplicate scans
  var HYST = 3                            // notoriety points of stickiness at every edge
  var CAP_VALUE = 100                     // notoriety's hard ceiling - hysteresis may never exceed it
  var HELPER_AT = 0.35                    // owner health fraction that summons the Helper
  var HELPER_STAY = 100                   // ticks the Helper lingers (5s)
  var HELPER_COOLDOWN = 600               // ticks before the Helper may answer again (30s)
  var MINION_RADIUS = 12                  // blocks: a mob spawning this close to a live
                                          // stalker is treated as ITS summon, not nature's

  // PRESENCE IS A ROLL, NOT A GUARANTEE (Ethan, 2026-08-11): "what if they didn't
  // show up everyday? Instead a percentage chance every in-game hour."
  //
  // Right, and the chance SCALES with notoriety rather than being flat. Always-on
  // made the Companion furniture; a flat chance would make it invisible, which is
  // the information drought we are trying to fix. Scaling does both jobs at once:
  //
  //  · it makes notoriety legible WITHOUT a number - you feel it climbing because
  //    the thing shows up more often
  //  · it turns the Absence at 75 from "my pet vanished" into a slammed door. It
  //    had been there nearly every hour, and then it simply stops coming.
  //
  // Rolled once per in-game hour, both ways: present-and-fails leaves, absent-and-
  // succeeds arrives. That produces natural runs rather than a coin flip every
  // hour, which is what makes an absence feel like an absence.
  var HOUR_TICKS = 1000                   // an in-game hour
  var PRESENCE_AT_25 = 0.15
  var PRESENCE_AT_74 = 0.85
  // DISTANCE. Ethan: "make it always spawn far, far enough that it is still
  // following you but at a large distance."
  //
  // This is not only taste - it is the fix for "if i get too close it kills me".
  // A Companion is a Born in Chaos hostile whose AI keeps re-acquiring its owner
  // between our sweeps, so the reliable answer is that it never gets to ARM'S
  // REACH in the first place. Distance is the safety, the damage cancel below is
  // the guarantee, and clearing the target is only cosmetic.
  // DISTANCE IS DYNAMIC (Ethan, 2026-08-05): "creeping closer the lower the
  // player's health is." Settled at 100 after 30 and 128 were both tried.
  //
  // At full health it keeps six chunks back and simply paces you. As you weaken
  // it closes - not to attack (it cannot; damage to its owner is cancelled) but
  // because it is paying attention. Being hurt is what makes it interested, which
  // is the same instinct as the Helper and reads as appetite rather than AI.
  // 100, not 128 (Ethan): simulation-distance is 8 chunks = exactly 128 blocks,
  // so a stalker parked AT 128 sits on the boundary and stops ticking - present
  // and visible, but frozen and unable to path for itself. At 100 it has 28
  // blocks of room inside the line and stays a live creature.
  var DIST_FAR = 100                      // at full health
  var DIST_NEAR = 12                      // at death's door
  var BAND = 14                           // slack before we bother repositioning
  var TELEPORT_AT = 128                   // the boundary itself: past it, snap
  // K5. This was DIST_FAR + 48 = 148, but simulation-distance 8 loads exactly
  // 128 blocks - so the scan claimed a ring 20 blocks wider than the world it can
  // actually see. Entities past the edge are not merely missed, they do not exist
  // in memory, so cull() reported "no stalker" and the sweep summoned a second
  // one; the original reappeared when its chunk loaded. That is where duplicate
  // stalkers came from. 120 keeps the whole scan inside loaded space.
  var SCAN_RADIUS = 120                   // < 128, the real simulation edge
  // TWO CONES, because the two uses want opposite errors.
  //
  // 80 degrees either side is a 160-degree arc - wider than a screen, and it
  // includes things past your shoulders. That is CORRECT for deciding whether a
  // teleport is safe: erring wide means we decline to snap when there is any
  // chance you would catch it, and a stalker briefly out of position costs
  // nothing.
  //
  // It is WRONG for the whisper, whose entire premise is "you looked too long".
  // At a 100-block ring a 160-degree arc counts almost anything ahead of you as
  // looking at it, so whispers fired while it was nowhere near your screen -
  // which is why one appeared to arrive when somebody ELSE looked at it. It was
  // never Ben's gaze; it was Ethan's own, counted far too generously.
  var VIEW_HALF_ANGLE = 80                // teleport/look-back: err WIDE, fail safe
  var WHISPER_HALF_ANGLE = 32             // whisper: err NARROW, you must really look
  var CANNOT_BE_SEEN = 192                // view-distance 12; past this, nothing renders
  var HARVEST = 'veldora_harvest'         // entity flag: this one CAN die
  var ABSENT_DAYS = 30                    // gone this long after a Harvest, either way

  // "it is fat too" - the Harvest instance has been eating for a hundred days.
  // Without this the fight is trivial against a player carrying C3's bonuses.
  var HARVEST_MULT = { health: 1.6, damage: 1.3, armor: 1.2 }

  // ONE LINE. Not a stats book - that was clever rather than good. Its whole job
  // is to make the player ask what this was all for, at the exact moment the game
  // takes their path away and asks them to choose again.
  var FRAGMENTS = [
    'It was never hungry.',
    'You were chosen the day you chose.',
    'There were five others. It ate them first.',
    'It has done this before. You have done this before.',
    'It did not want you strong. It wanted you worth taking.',
    'Nothing was ever watching. It was only ever waiting.',
  ]

  // Explicit stat block per casting. NOT optional, and not merely tuning:
  // a KubeJS createEntity().spawn() bypasses finalizeSpawn, which is where Born
  // in Chaos applies its own configured health/damage/armour. Proven by H1 - a
  // chaff mob reads its raw code default through this path and its CONFIGURED
  // value through /summon. So a stalker spawned our way would inherit whatever
  // the class happens to declare, silently, and drift the day the mod updates.
  // We state the numbers ourselves and stop depending on a hook we do not call.
  var STATS = {
    forge:   { health: 250, damage: 14, armor: 10 },
    art:     { health: 70, damage: 7, armor: 4 },
    blade:   { health: 600, damage: 12, armor: 12 },
    salvage: { health: 100, damage: 10, armor: 0.5 },
    crown:   { health: 150, damage: 9, armor: 10 },
    wall:    { health: 90, damage: 6, armor: 0 },
  }

  // IT SPEAKS WHEN YOU LOOK AT IT (Ethan, 2026-08-05).
  //
  // Sent to that player alone, with no prefix and no name tag - it should read as
  // something that arrived in your head rather than a mod talking. Paired with a
  // short, low-grade nausea: not a punishment, a wrongness. You looked too long.
  //
  // The proc is deliberately mean about frequency. A whisper every time you
  // glance is a gimmick; a whisper you cannot reliably reproduce is a rumour, and
  // your brother not believing you is the whole point.
  var WHISPER_CHANCE = 0.03               // per second of being looked at
  var WHISPER_COOLDOWN = 1200             // ticks (60s) between whispers per player
  var NAUSEA_TICKS = 40                   // 2s, amplifier 0 - a blink, not a bout
  // ETHAN'S LINES (2026-08-05). "We cannot commit fully to the horror, the
  // server still needs to have my brand of humor everywhere plus im author so
  // i can reference my books."
  //
  // He is right, and it is not a compromise. Unbroken dread goes flat - the
  // Obsessed is beloved here precisely because it is absurd as often as it is
  // frightening. A goat that spills its bag and a thing that shows you
  // thousands of blinking crimson eyes are scarier TOGETHER, because you stop
  // being able to predict which one you are about to get.
  //
  var RARE_CHANCE = 0.08                  // of a whisper: same line, ruinous nausea
  var RARE_NAUSEA_TICKS = 120             // 6s, was 12
  var RARE_NAUSEA_AMP = 2   // was 3
  var WHISPERS = {
    forge: [
      "*The goat accidentally spills his entire bag, you try not to look*",
      "*The goat makes a goat noise*",
      "*The goat whispers in a distinctly southern accent. You don't get the reference*",
    ],
    art: [
      "*It whispers into your ear. Soft things. Harsh things. It has anxiety*",
      "*The word Caebrim comes to your tongue. You don't know what it means*",
      "*You see thousands of crimson eyes. They are blinking. You are not*",
    ],
    blade: [
      "*He watches you. Your blade. The one at your waist... He wants you to know he's referencing your sword*",
      "*His horse wants to race you. The rider has motion sickness*",
    ],
    salvage: [
      "*AWOOOO*",
      "*The wolf is an alcoholic. You are in danger*",
      "*The wolf is attempting to get her life together. She is failing. You can't help*",
    ],
    crown: [
      "“The dead speak to me. They say many things. Do many things. Like talk”",
      "“I worship the goddess of death. I see her light. You have none”",
      "*The missionary is attempting to account for weekly bonuses*",
      "*The missionary wants donations*",
    ],
    wall: [
      "*The spider does a funny dance, you squint but don't catch it*",
      "*The spider waves its hands to the beat. You hear nothing*",
      "*The spider attempts to have a tea party. The tea is all over the floor*",
    ],
  }

  var CAST = {
    forge:   ['born_in_chaos_v1:krampus', 'The Thief'],
    art:     ['born_in_chaos_v1:nightmare_stalker', 'The Nightmare'],
    // Was lord_pumpkinhead until 2026-08-11. He is the ONLY one of the six with a
    // ServerBossEvent - a boss health bar across the top of the screen - and the
    // only one besides sir_pumpkinhead with a "WithoutaHorse" variant in the jar,
    // meaning the default form is MOUNTED. He was built as an encounter, and a
    // boss bar is the exact opposite of a thing lurking at the edge of vision.
    // fallen_chaos_knight is clean on every axis: no boss bar, no summons, no
    // mount. A dead duelist for the path about mastering one weapon.
    blade:   ['born_in_chaos_v1:fallen_chaos_knight', 'The Challenger'],
    salvage: ['born_in_chaos_v1:dire_hound_leader', 'The Hound'],
    crown:   ['born_in_chaos_v1:missioner', 'The False King'],
    wall:    ['born_in_chaos_v1:mother_spider', 'The Mother'],
  }

  //  name,      low (inclusive), high (exclusive)
  var BANDS = [
    ['helper', 0, 25],
    ['companion', 25, 75],
    ['absence', 75, 100],
    ['harvest', 100, Infinity],
  ]

  // SERVER is set by ServerEvents.loaded - which does NOT re-fire on
  // `/kubejs reload server-scripts`. After a reload the event handlers are
  // re-registered from a fresh scope where this is still null, which silently
  // disabled the death handler, the owner-damage hard stop and the flee schedule
  // until the next full restart. Resolve it lazily from whatever object is to
  // hand instead of trusting the boot hook to have run.
  var SERVER = null
  var sweepCount = 0
  var live = {}                 // uuid -> stalker entity (in-memory; always re-checked)
  var helperLive = {}           // uuid -> the Helper the DAMAGE HOOK summoned.
                                // The sweep must not cull this one; see sweepPlayer.
  var helperCooling = {}        // uuid -> true while the Helper may not answer again
  var minions = {}              // uuid -> [entities its stalker summoned], so culling
                                // the parent also culls what the parent left behind
  var damageAccessorLogged = false
  var sourceAccessorLogged = false

  // ------------------------------------------------------------------ helpers
  function ensureServer(o) {
    if (SERVER) return SERVER
    var cands = [
      function () { return o.server },
      function () { return o.level.server },
      function () { return o.player.server },
      function () { return o.entity.level.server },
    ]
    for (var i = 0; i < cands.length; i++) {
      try {
        var s = cands[i]()
        if (s) {
          SERVER = s
          console.info('[stalker] server handle recovered lazily (a reload had left it null)')
          return SERVER
        }
      } catch (x) { }
    }
    return null
  }

  function isStalker(e) {
    try { return !!e && !!e.persistentData.getString(OWNER) } catch (x) { return false }
  }
  function ownerOf(e) {
    try { return e.persistentData.getString(OWNER) } catch (x) { return '' }
  }
  function isFleeing(e) {
    try { return e.persistentData.getBoolean(FLEEING) } catch (x) { return false }
  }
  function maxHealthOf(e) {
    try { return e.getAttribute('minecraft:generic.max_health').getValue() } catch (x) { return 20 }
  }
  function alive(e) {
    try { return !!e && e.isAlive() } catch (x) { return false }
  }

  // The damage amount, or null if unreadable.
  //
  // ⚠️ `typeof v === 'number'` IS NOT ENOUGH. event.damage answers with
  // Long.MAX_VALUE here - a perfectly valid number that is not a damage amount.
  // It sailed through the type check, so `hp - dmg` came out at -9.2e18, every
  // single hit read as lethal, and every stalker fled on first contact. The
  // "friends can push it toward leaving" behaviour never once ran.
  //
  // A value has to be PLAUSIBLE, not merely numeric. Nothing in this pack deals
  // five figures of damage in one blow.
  var DMG_MAX = 100000
  function plausible(v) {
    return typeof v === 'number' && isFinite(v) && v >= 0 && v <= DMG_MAX
  }

  var DAMAGE_CANDS = [
    ['event.damage', function (e) { return e.damage }],
    ['event.getDamage()', function (e) { return e.getDamage() }],
    ['event.amount', function (e) { return e.amount }],
    ['event.getAmount()', function (e) { return e.getAmount() }],
    ['event.source.damage', function (e) { return e.source.damage }],
  ]
  var damagePick = -1
  function damageOf(event) {
    // Cached like attackerOf: this runs on every hit to a stalker and on every
    // player hit that reaches the Helper branch - 20/s per burning player - and
    // several candidates THROW, which is the expensive part in Rhino.
    if (damagePick >= 0) {
      try {
        var q = DAMAGE_CANDS[damagePick][1](event)
        if (plausible(q)) return q
      } catch (x) { }
      damagePick = -1                                  // miss: re-probe, never assume
    }
    var cands = DAMAGE_CANDS.map(function (c) {
      return [c[0], function () { return c[1](event) }]
    })
    var chosen = null, chosenLabel = ''
    var report = []
    for (var i = 0; i < cands.length; i++) {
      var raw
      try { raw = cands[i][1]() } catch (x) { raw = '<threw>' }
      report.push(cands[i][0] + '=' + raw)
      if (chosen === null && plausible(raw)) { chosen = raw; chosenLabel = cands[i][0]; damagePick = i }
    }
    if (!damageAccessorLogged) {
      damageAccessorLogged = true
      console.info('[stalker] damage candidates: ' + report.join('  '))
      console.info('[stalker] using ' + (chosen === null ? 'NONE - worst case per hit' : chosenLabel))
    }
    return chosen
  }

  // Who threw the punch. C0 found src.getEntity() throws and zero-arg accessors
  // read back as METHODS when touched as properties, so every candidate is
  // called and type-checked.
  var ATTACKER_CANDS = [
    ['source.actor', function (s) { return s.actor }],
    ['source.player', function (s) { return s.player }],
    ['source.entity', function (s) { return s.entity }],
    ['source.directEntity', function (s) { return s.directEntity }],
    ['source.getEntity()', function (s) { return s.getEntity() }],
    ['source.getDirectEntity()', function (s) { return s.getDirectEntity() }],
  ]
  var attackerPick = -1
  // K13. attackerOf() required alive() on the candidate, so a mob that died in
  // the same tick as its killing blow - a creeper, anything finished by thorns or
  // a counter-hit - read as NO attacker at all. Environmental death and "killed by
  // something that then died" became the same answer, which is exactly the
  // failure mode this file keeps hitting. An attacker only has to BE an entity.
  function isEntityish(q) {
    if (!q || typeof q === 'function') return false
    try { return !!q.uuid } catch (x) { return false }
  }

  function attackerOf(event) {
    var src = null
    try { src = event.source } catch (x) { return null }
    if (!src) return null
    // Once we know which accessor this runtime exposes, stop re-discovering it.
    // This runs on EVERY damage tick - standing in fire is 20/s per player - and
    // several candidates throw, which is the expensive part in Rhino.
    if (attackerPick >= 0) {
      try {
        var q = ATTACKER_CANDS[attackerPick][1](src)
        if (isEntityish(q)) return q
      } catch (x) { }
      // FALL THROUGH, do not return null. The cache locks onto whichever
      // accessor answered FIRST - and if the first live event of a boot was
      // player-dealt damage, it can lock to source.player, after which every MOB
      // attacker would read as null forever. Indistinguishable from environmental
      // damage: the Companion would never retaliate and the Missioner-minion
      // Harvest attribution would silently never fire.
      // A miss re-probes and re-picks instead.
      attackerPick = -1
    }
    var cands = ATTACKER_CANDS.map(function (c) {
      return [c[0], function () { return c[1](src) }]
    })
    for (var i = 0; i < cands.length; i++) {
      try {
        var v = cands[i][1]()
        if (isEntityish(v)) {
          attackerPick = i
          if (!sourceAccessorLogged) {
            sourceAccessorLogged = true
            console.info('[stalker] attacker read via ' + cands[i][0])
          }
          return v
        }
      } catch (x) { }
    }
    return null   // environmental damage (fall, lava, starve) has no attacker
  }

  // ------------------------------------------------------------------- fleeing
  function flee(e, why) {
    if (isFleeing(e)) return
    try { e.persistentData.putBoolean(FLEEING, true) } catch (x) { }
    console.info('[stalker] ' + (e.type || '?') + ' fleeing from ' + ownerOf(e) + ' (' + why + ')')
    try { e.potionEffects.add('minecraft:invisibility', 60, 0, false, false) } catch (x) { }
    try { e.potionEffects.add('minecraft:speed', 60, 3, false, false) } catch (x) { }
    try { e.setTarget(null) } catch (x) { }
    // FLEEING IS ALSO A REMOVAL, so it has to take the summons with it too.
    // dismiss() was fixed for the pumpkin incident, but this is the OTHER way a
    // stalker leaves the world - C5 drives it off at 35% health - and it would
    // have orphaned minions in exactly the same way, with exactly the same
    // result: a boss-tier mob left behind with no idea whose side it was on.
    // Reaped in the callback rather than up front, so anything it summons during
    // the 30-tick retreat is caught as well.
    var okey = ownerKeyOf(e)
    function reap() {
      try { if (alive(e)) e.discard() } catch (x) { }
      if (okey) {
        var m = clearMinions(okey)
        if (m) console.info('[stalker] the fleeing stalker took ' + m + ' summon(s) with it')
      }
    }
    var srv = SERVER || ensureServer(e)
    if (srv) srv.scheduleInTicks(30, reap)
    else reap()
  }

  // --------------------------------------------------------------- THE GUARD
  EntityEvents.beforeHurt(function (event) {
    var e = event.entity

    // THE PIGLIN RULE, anger half. Struck by your own patron's family? They
    // answer. Registered BEFORE the isStalker gate, because a spiderling is not
    // a stalker and hitting a child must wake the mother just as surely as
    // hitting her would.
    if (e) {
      var hitOwner = isStalker(e) ? ownerKeyOf(e) : minionOwnerUuid(e)
      if (hitOwner) {
        var hitter = attackerOf(event)
        var hn = null
        try { hn = hitter && hitter.username ? String(hitter.username) : null } catch (x) { }
        if (hn && hn === ownerOf(live[hitOwner])) {
          anger(hitOwner, e, hn + ' struck ' + (isStalker(e) ? 'their patron' : 'one of its minions'))
        }
      }
    }

    if (!isStalker(e)) return

    // THE HARVEST is the one time it can die. The thing that was invulnerable for
    // weeks becomes mortal at the exact moment it turns on you - which is why the
    // Harvest must not be guaranteed. A fight you cannot win is not a fight.
    if (isHarvestInstance(e)) return

    if (isFleeing(e)) { event.cancel(); return }     // nothing touches it on the way out

    var hp = 20
    try { hp = e.health } catch (x) { }
    var max = maxHealthOf(e)
    var threshold = max * FLEE_AT
    var dmg = damageOf(event)
    var after = (dmg === null) ? -1 : (hp - dmg)     // unreadable => worst case

    if (after > threshold) return                    // survivable: let it land

    flee(e, 'health would fall to ' + (dmg === null ? 'unknown' : Math.round(after)) +
      ' of ' + Math.round(max))
    event.cancel()                                   // MUST be outside any try/catch (C0)
  })

  // It pays nothing, in any phase. A stalker that drops anything stops being a
  // predator and becomes a resource.
  EntityEvents.drops(function (event) {
    if (!isStalker(event.entity)) return
    // Design: "no loot, no XP". drops covers ITEMS only - a killed Harvest was
    // still dropping experience orbs, which fed the very notoriety it exists to
    // reset. Zero the xp on the event where the API allows it.
    var zeroed = false
    var cands = [
      function () { event.experience = 0; return event.experience === 0 },
      // was `return true` - asserting rather than checking, which is the exact
      // class of bug wipeXp's verification loop exists to avoid
      function () { event.setExperience(0); return event.experience === 0 },
      function () { event.xp = 0; return event.xp === 0 },
    ]
    for (var i = 0; i < cands.length; i++) { try { if (cands[i]()) { zeroed = true; break } } catch (x) { } }
    if (!zeroed && !xpDropWarned) {
      xpDropWarned = true
      console.warn('[stalker] could not zero XP drop - a killed Harvest still pays experience')
    }
    event.cancel()
  })
  var xpDropWarned = false

  EntityEvents.death(function (event) {
    var e = event.entity
    if (!SERVER) ensureServer(event)
    if (!SERVER) return

    // --- a stalker died ---
    if (isStalker(e)) {
      var owner = ownerOf(e)
      if (isHarvestInstance(e)) {
        // WON - but the owner has to have BEEN THERE. The old check only asked
        // whether they were online, so a brother could find your boss and kill
        // it while you were asleep 5000 blocks away, and you would take the
        // fragment, the escrow and the 30-day absence for a fight you never saw.
        //
        // Proximity rather than last-hit, because design rule 3 says friends may
        // help: someone else landing the final blow beside you still counts.
        var p = null
        try { p = SERVER.getPlayer(owner) } catch (x) { }
        if (!p) { console.warn('[stalker] harvest died but owner ' + owner + ' is offline - no credit'); return }
        var near = false
        try {
          var ddx = p.x - e.x, ddy = p.y - e.y, ddz = p.z - e.z
          near = (ddx * ddx + ddy * ddy + ddz * ddz) <= (64 * 64)
        } catch (x) { }
        if (!near) {
          console.warn('[stalker] harvest died far from ' + owner + ' - no credit, it simply left')
          return
        }
        harvestWon(SERVER, p, e)
        return
      }
      console.error('[stalker] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      console.error('[stalker] !! INVARIANT BREACH: a NON-harvest stalker DIED.')
      console.error('[stalker] !! owner=' + owner + ' type=' + e.type)
      try { console.error('[stalker] !! source=' + event.source.type()) } catch (x) { }
      console.error('[stalker] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
      return
    }

    // --- a player died: was it OUR doing? ---
    var isPlayer = false
    try { isPlayer = !!e && !!e.username } catch (x) { }
    if (!isPlayer) return
    if (phaseStored(SERVER, e) !== 'harvest') return

    // ATTRIBUTION. The wipe fires only on the stalker's kill. When the source is
    // unclear we fail toward the LESSER penalty - a fall during a Harvest must
    // not cost someone everything.
    var killer = attackerOf(event)

    // The stalker's OWN kill - the simple case.
    if (killer && isStalker(killer) && isHarvestInstance(killer)) {
      if (ownerOf(killer) !== e.username) {
        console.info('[stalker] ' + e.username + ' was killed by another player stalker - no wipe')
        return
      }
      harvestLost(SERVER, e, killer)
      return
    }

    // ⚠️ ITS ADDS COUNT TOO. Missioner and Mother Spider both fight through
    // summoned minions, so for two of six castings the boss frequently never
    // lands the killing blow itself - and losing the Harvest would have cost
    // nothing at all. That is not mercy, it is the fight not mattering.
    //
    // The rule is: killed BY A MOB while your own Harvest instance is alive and
    // present. Environmental deaths - fall, lava, drowning, suffocation - still
    // cost nothing, so the "fail toward the lesser penalty" principle holds
    // exactly where it should: when nothing was hunting you, nothing takes.
    if (!killer) {
      console.info('[stalker] ' + e.username + ' died mid-Harvest with no attacker - no wipe')
      return
    }
    // K3. The rule stated directly above is "killed BY A MOB", and the code did
    // not check it. Another PLAYER landing the killing blow while your Harvest
    // instance happened to be alive and within 48 blocks cost you everything -
    // a PvP death charged as a Harvest loss. Fail toward the lesser penalty.
    var killerIsPlayer = false
    try { killerIsPlayer = !!killer.player } catch (x) { }
    if (killerIsPlayer) {
      console.info('[stalker] ' + e.username + ' was killed by a player mid-Harvest - no wipe')
      return
    }
    var mine = live[String(e.uuid)]
    if (!alive(mine) || !isHarvestInstance(mine)) {
      console.info('[stalker] ' + e.username + ' died mid-Harvest but their instance is gone - no wipe')
      return
    }
    // K12. This compared raw coordinates with no dimension test, so a stalker
    // standing at x/z in the Overworld read as "12 blocks away" from a player at
    // the same x/z in the Nether. Nether coordinates are the Overworld's divided
    // by eight, which puts the two of them near each other constantly.
    var near = false
    try {
      if (String(mine.level.dimension) === String(e.level.dimension)) {
        var ax = mine.x - e.x, ay = mine.y - e.y, az = mine.z - e.z
        near = (ax * ax + ay * ay + az * az) <= (48 * 48)
      }
    } catch (x) { }
    if (!near) {
      console.info('[stalker] ' + e.username + ' died mid-Harvest far from their instance - no wipe')
      return
    }
    console.info('[stalker] ' + e.username + ' killed mid-Harvest by ' +
      (killer.type || '?') + ' while the instance was present - counts as the loss')
    harvestLost(SERVER, e, mine)
  })

  // ---------------------------------------------------- the stat block, VERIFIED
  //
  // Two faults this replaces:
  //
  // 1. It was twelve empty catch blocks. If any setBaseValue failed the stalker
  //    silently kept its code default - the exact drift the block exists to
  //    remove - and nothing anywhere said so.
  //
  // 2. THE NUMBERS DID NOT LAND. Live logs showed Krampus at 273 / 310 / 318 /
  //    355 against a configured 250: L2Hostility applies a level modifier ON TOP
  //    of our base, after we set it. The Harvest then multiplied that unknown
  //    number by 1.6, so a fight balanced for 400 could arrive at 570.
  //
  // So: set the base, then RE-READ a second later - after everything else has had
  // its say - and correct the base by whatever the difference turns out to be.
  // Self-correcting against any modifier from any mod, present or future, because
  // it measures the total rather than assuming it owns it.
  function setAttr(e, attr, want) {
    try {
      var a = e.getAttribute(attr)
      if (!a) return null
      a.setBaseValue(want)
      return a.getValue()
    } catch (x) { return null }
  }

  function applyStats(e, st, mult, label) {
    var m = (typeof mult === 'number') ? { health: mult, damage: mult, armor: mult } : mult
    var wantHp = st.health * m.health
    var plan = [
      ['minecraft:generic.max_health', wantHp],
      ['minecraft:generic.attack_damage', st.damage * m.damage],
      ['minecraft:generic.armor', st.armor * m.armor],
    ]
    var failed = []
    for (var i = 0; i < plan.length; i++) {
      if (setAttr(e, plan[i][0], plan[i][1]) === null) failed.push(plan[i][0])
    }
    if (failed.length) {
      console.warn('[stalker] ' + label + ': could not set ' + failed.join(', ') +
        ' - it is running on mod defaults for those')
    }
    try { e.setHealth(wantHp) } catch (x) { }

    // The correction pass. Anything else that scales this mob has acted by now.
    if (!SERVER) return
    SERVER.scheduleInTicks(20, function () {
      if (!alive(e)) return
      try {
        var a = e.getAttribute('minecraft:generic.max_health')
        var actual = a.getValue()
        if (Math.abs(actual - wantHp) > 0.5) {
          var base = a.getBaseValue()
          a.setBaseValue(base + (wantHp - actual))
          var now = a.getValue()
          console.info('[stalker] ' + label + ' health corrected ' +
            Math.round(actual) + ' -> ' + Math.round(now) + ' (wanted ' + Math.round(wantHp) + ')')
          if (Math.abs(now - wantHp) > 0.5) {
            console.warn('[stalker] ' + label + ' STILL off: ' + Math.round(now) +
              ' vs ' + Math.round(wantHp) + ' - something is re-applying after us')
          }
        }
        e.setHealth(e.getAttribute('minecraft:generic.max_health').getValue())
      } catch (x) { console.warn('[stalker] ' + label + ' health check threw :: ' + x) }
    })
  }

  // ------------------------------------------------------------------ summoning
  // skipStats: summonHarvest applies its OWN, buffed block immediately after.
  // Without this, both ran - each scheduling a correction pass 20 ticks out, one
  // aiming at st.health and the other at st.health x1.6, landing on the same tick
  // and correct only because insertion order happened to favour the second. Two
  // contradictory "health corrected" lines per Harvest, and a 250 HP boss instead
  // of 400 the moment anything reordered them.
  function summon(player, pathKey, near, skipStats) {
    var spec = CAST[pathKey]
    if (!spec) return null
    var e = player.level.createEntity(spec[0])
    if (!e) return null
    var d = near || DIST_FAR
    e.persistentData.putString(OWNER, player.username)
    e.persistentData.putString(PATHKEY, pathKey)
    e.setCustomName(Text.of('§c' + spec[1]))
    e.setCustomNameVisible(true)
    placeBehind(player, e, d)      // set the position BEFORE it enters the world
    e.spawn()

    var st = STATS[pathKey]
    if (st && !skipStats) applyStats(e, st, 1, pathKey)
    try { e.getAttribute('minecraft:generic.scale').setBaseValue(SCALE) } catch (x) { }
    // NO GLOW. It was my idea for making a common species read as singular, and
    // Ethan is right that it looks wrong - an outline through walls is a game-UI
    // tell, not a horror one. The name and the size do that job without
    // announcing themselves.

    // NO PERSISTENCE on a Companion or Helper - deliberately.
    // Pinning them meant every stalker outlived its session, and since they also
    // CANNOT DIE the world was accumulating immortal minibosses forever. Letting
    // them despawn naturally is self-healing: the sweep notices and re-summons
    // within 2 seconds when the owner is actually around. Only the Harvest pins
    // itself (summonHarvest), because despawning mid-boss-fight would be absurd.
    return e
  }

  // --------------------------------------------------------------- distance
  function healthFrac(p) {
    try {
      var m = p.getAttribute('minecraft:generic.max_health').getValue()
      if (m > 0) return Math.max(0, Math.min(1, p.health / m))
    } catch (x) { }
    return 1
  }

  function yawOf(p) {
    var cands = [
      function () { return p.yaw },
      function () { return p.getYRot() },
      function () { return p.rotationYaw },
    ]
    for (var i = 0; i < cands.length; i++) {
      try { var v = cands[i](); if (typeof v === 'number' && isFinite(v)) return v } catch (x) { }
    }
    return null
  }

  // Place it BEHIND the player rather than at a random bearing. A snap you can
  // see is a bug; a snap at your back is the mod working, and when you turn
  // around it is simply there.
  // E0 probe P11 measured this, three times, on three different blocks:
  //     .isAir()            TypeError: Cannot find function isAir   <- DOES NOT EXIST
  //     .isAir (property)   undefined
  //     .id === air         works
  //     .getId()            works
  //     .blockState.isAir() works
  //
  // K7's footing probe shipped using .isAir() and therefore threw on its FIRST
  // call every time, fell into its own catch, and silently used the player's y -
  // exactly the behaviour K7 was written to replace. It never worked once.
  //
  // Use blockState.isAir(), NOT the string compare the probe happened to try
  // first: underground blocks are `minecraft:cave_air`, so `id === 'minecraft:air'`
  // reads every cave as solid rock and the probe would never find footing in the
  // one place a stalker actually stands. Vanilla's isAir covers air, cave_air and
  // void_air together.
  function blockIsAir(b) {
    try { return !!b.blockState.isAir() } catch (x) { }
    try {
      var id = String(b.id)
      return id === 'minecraft:air' || id === 'minecraft:cave_air' || id === 'minecraft:void_air'
    } catch (x) { return false }
  }

  function placeBehind(player, e, dist) {
    var yaw = yawOf(player)
    var ang
    if (yaw === null) {
      ang = Math.random() * Math.PI * 2
    } else {
      // MC yaw: the player faces (-sin, +cos). Behind is that negated, widened
      // +/-50 degrees so it is not mechanically dead-centre.
      ang = (yaw + 180) * Math.PI / 180 + (Math.random() - 0.5) * (100 * Math.PI / 180)
    }
    var tx = player.x - Math.sin(ang) * dist
    var tz = player.z + Math.cos(ang) * dist

    // K7. This used the PLAYER's y at a horizontal offset, so on any slope the
    // stalker arrived either sealed inside rock or hanging in the air over a
    // drop. Probe a short vertical window for a spot with two blocks of headroom
    // standing on something solid, nearest the player's own level first.
    //
    // Falls back to player.y on ANY failure, so the worst case is exactly the old
    // behaviour rather than a stalker that never spawns.
    var ty = player.y
    try {
      var lvl = player.level
      var base = Math.floor(player.y)
      var best = null
      for (var dy = 0; dy <= 4 && best === null; dy++) {
        var tries = (dy === 0) ? [0] : [dy, -dy]
        for (var k = 0; k < tries.length; k++) {
          var cy = base + tries[k]
          var feet = lvl.getBlock(Math.floor(tx), cy, Math.floor(tz))
          var head = lvl.getBlock(Math.floor(tx), cy + 1, Math.floor(tz))
          var floor = lvl.getBlock(Math.floor(tx), cy - 1, Math.floor(tz))
          if (blockIsAir(feet) && blockIsAir(head) && !blockIsAir(floor)) { best = cy; break }
        }
      }
      if (best !== null) ty = best
    } catch (x) { /* no probe, no problem - use the player's own level */ }

    try {
      e.setPos(tx, ty, tz)
      e.setTarget(null)
    } catch (x) { }
  }

  var navWarned = false

  // Is it inside the arc the player is actually facing?
  //
  // Ethan: "it should also only teleport if the player isn't looking at it."
  // This is the right rule and it replaces distance as the test - a snap 60
  // blocks away in your peripheral vision is far more jarring than one behind a
  // hill at 30. Horizontal only: pitch barely matters for something on the ground
  // at range, and ignoring it keeps the check cheap enough to run every second.
  //
  // Fails CLOSED. If the yaw cannot be read we answer "yes, they can see it" and
  // decline to teleport - a stalker briefly out of position is nothing; a stalker
  // seen blinking is the illusion gone.
  function inView(player, e, halfAngle) {
    var arc = (typeof halfAngle === 'number') ? halfAngle : VIEW_HALF_ANGLE
    var yaw = yawOf(player)
    if (yaw === null) return true
    var dx, dz
    try { dx = e.x - player.x; dz = e.z - player.z } catch (x) { return true }
    var d = Math.sqrt(dx * dx + dz * dz)
    if (d < 0.01) return true
    if (d > CANNOT_BE_SEEN) return false          // past render distance
    var f = yaw * Math.PI / 180
    var fx = -Math.sin(f), fz = Math.cos(f)       // the direction they face
    var dot = (dx / d) * fx + (dz / d) * fz
    return dot > Math.cos(arc * Math.PI / 180)
  }

  // IT LOOKS BACK (Ethan, 2026-08-05).
  //
  // inView() was built to decide when a teleport is safe. It answers a second
  // question for free: whether you are looking AT it. So when you are, it turns
  // and faces you - at any distance, across any gap.
  //
  // The one-second sweep is not a limitation here, it is the whole effect. You
  // look, there is a beat, and THEN it turns. Instant would read as a scripted
  // trigger; the delay reads as something noticing.
  var lastWhisper = {}
  var recentLines = {}
  function maybeWhisper(player, e) {
    var uuid = String(player.uuid)
    var now = sweepCount
    if (lastWhisper[uuid] && (now - lastWhisper[uuid]) * SWEEP < WHISPER_COOLDOWN) return
    if (Math.random() > WHISPER_CHANCE) return
    var key = ''
    try { key = e.persistentData.getString(PATHKEY) } catch (x) { }
    var pool = WHISPERS[key]
    if (!pool || !pool.length) return
    lastWhisper[uuid] = now

    // One pool now - his lines ARE the joke tier. The rare roll no longer picks a
    // different LINE, it just decides whether this one wrecks you: 12 seconds of
    // amplifier-3 nausea instead of 4 of amplifier 0. Same words, and you will
    // never be sure whether the goat noise or the crimson eyes is the one that
    // does it to you.
    // Ethan got the same goat line three times running. The hints have had a
    // no-repeat guard since they were written; the whispers never did, and with
    // three lines in a pool a repeat is the likeliest outcome, not a rare one.
    var seen = recentLines[uuid] || []
    var fresh = pool.filter(function (l) { return seen.indexOf(l) < 0 })
    var from = fresh.length ? fresh : pool
    var line = from[Math.floor(Math.random() * from.length)]
    seen.push(line)
    while (seen.length > 2) seen.shift()
    recentLines[uuid] = seen

    var rare = Math.random() < RARE_CHANCE
    try {
      player.tell(Text.of((rare ? '§f' : '§8§o') + line))
      player.potionEffects.add('minecraft:nausea',
        rare ? RARE_NAUSEA_TICKS : NAUSEA_TICKS,
        rare ? RARE_NAUSEA_AMP : 0, false, false)
    } catch (x) { }
    if (rare) console.info('[stalker] RARE whisper to ' + player.username + ': ' + line)
    return


  }

  var faceLogged = false
  function faceOwner(player, e) {
    var dx, dy, dz
    try {
      dx = player.x - e.x
      dy = (player.y + 1.6) - (e.y + 1.6)
      dz = player.z - e.z
    } catch (x) { return }
    var flat = Math.sqrt(dx * dx + dz * dz)
    if (flat < 0.01) return
    var yaw = Math.atan2(-dx, dz) * 180 / Math.PI
    var pitch = -Math.atan2(dy, flat) * 180 / Math.PI
    var cands = [
      ['lookAt(player)', function () { e.lookAt(player, 360, 360); return true }],
      ['setRotation', function () { e.setRotation(yaw, pitch); return true }],
      ['setYaw/setPitch', function () { e.setYaw(yaw); e.setPitch(pitch); return true }],
      ['yaw/pitch props', function () { e.yaw = yaw; e.pitch = pitch; return true }],
      ['setYHeadRot', function () { e.setYHeadRot(yaw); e.setYRot(yaw); return true }],
    ]
    var ok = false
    for (var i = 0; i < cands.length; i++) {
      try { if (cands[i][0] && cands[i][1]()) { ok = true;
        if (!faceLogged) { faceLogged = true; console.info('[stalker] look-back via ' + cands[i][0]) }
        break } } catch (x) { }
    }
    if (!ok && !faceLogged) {
      faceLogged = true
      console.warn('[stalker] no way to rotate an entity found - it will not look back')
    }
  }

  function keepDistance(player, e) {
    var want = DIST_NEAR + (DIST_FAR - DIST_NEAR) * healthFrac(player)
    var dx, dz, d
    try {
      dx = e.x - player.x; dz = e.z - player.z
      d = Math.sqrt(dx * dx + dz * dz)
    } catch (x) { return }
    // Looked at => look back, and do NOT reposition. Both halves of that matter:
    // it holds still under your gaze and it meets it.
    if (inView(player, e)) {
      faceOwner(player, e)
      // the narrow cone here: it must be genuinely on your screen, not merely
      // somewhere ahead of you
      if (inView(player, e, WHISPER_HALF_ANGLE)) maybeWhisper(player, e)
      return
    }

    if (Math.abs(d - want) <= BAND) return          // close enough; leave it be

    // Past the boundary it must be snapped - it is out of the ticking set and
    // will never walk back on its own. But NOT while it is being watched: if the
    // player is looking at it we simply leave it there and try again in a second.
    // The side effect is the good kind - it does not move while you look at it.
    if (d > TELEPORT_AT) {
      if (!inView(player, e)) placeBehind(player, e, want)
      return
    }

    // Otherwise WALK it - pathing there looks like a creature deciding to move.
    var tx = player.x + (dx / (d || 1)) * want
    var tz = player.z + (dz / (d || 1)) * want
    var moved = false
    var cands = [
      function () { e.navigation.moveTo(tx, e.y, tz, 1.0); return true },
      function () { e.getNavigation().moveTo(tx, e.y, tz, 1.0); return true },
      function () { e.ai.navigation.moveTo(tx, e.y, tz, 1.0); return true },
    ]
    for (var i = 0; i < cands.length; i++) {
      try { if (cands[i]()) { moved = true; break } } catch (x) { }
    }
    if (!moved) {
      if (!navWarned) {
        navWarned = true
        console.warn('[stalker] no navigation API - repositioning behind the player instead')
      }
      // same rule for the fallback: never blink in front of someone
      if (!inView(player, e)) placeBehind(player, e, want)
    }
    try { e.setTarget(null) } catch (x) { }
  }

  // ----------------------------------------------------------- C7: the Harvest
  function summonHarvest(player, pathKey) {
    var e = summon(player, pathKey, 6, true)   // stats come from the buffed block below
    if (!e) return null
    e.persistentData.putBoolean(HARVEST, true)
    // the ONE case that must not despawn - a boss fight that evaporates is worse
    // than no boss fight at all
    try { e.mergeNbt({ PersistenceRequired: 1 }) } catch (x) { }
    var st = STATS[pathKey]
    if (st) applyStats(e, st, HARVEST_MULT, pathKey)
    try { e.setCustomName(Text.of('§4§l' + CAST[pathKey][1])) } catch (x) { }
    try { e.setTarget(player) } catch (x) { }
    return e
  }

  function closeHarvest(server, player, won) {
    var b = readNotoriety(server, player)
    var day = b ? b.day : 0
    if (typeof VELDORA !== 'undefined' && typeof VELDORA.recordHarvest === 'function') {
      VELDORA.recordHarvest(server, player, won)
    } else {
      console.error('[stalker] !! VELDORA.recordHarvest missing - the cycle did NOT advance')
    }
    setAbsentUntil(server, player, day + ABSENT_DAYS)
    phaseStore(server, player, 'absence')
    dismiss(String(player.uuid))
  }

  function harvestWon(server, player, entity) {
    var pathKey = ''
    try { pathKey = entity.persistentData.getString(PATHKEY) } catch (x) { }

    // the line, first - before anything mechanical happens
    var line = FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)]
    player.tell(Text.of(''))
    player.tell(Text.of('§8§o' + line))
    player.tell(Text.of(''))

    // materials: a garnish, deliberately the least interesting part
    try { server.runCommandSilent('give ' + player.username + ' minecraft:diamond 3') } catch (x) { }

    // ESCROW - the real reward is losing the path and having to choose again
    var freed = ''
    if (typeof VELDORA !== 'undefined' && VELDORA.paths) {
      freed = VELDORA.paths.escrowFor(server, player)
    } else {
      console.error('[stalker] !! VELDORA.paths missing - the path was NOT escrowed')
    }
    if (freed) {
      var nm = VELDORA.paths.nameOf(freed)
      player.tell(Text.of('§7You set down §f' + nm + '§7.'))
      player.tell(Text.of('§7It is held for you. Choose again with §f/path§7 - the same, or another.'))
      player.tell(Text.of('§8Walk away without choosing and it opens to the others.'))
      server.tell(Text.of('§8' + player.username + ' killed what was hunting them, and set down ' + nm + '.'))
    }
    closeHarvest(server, player, true)
  }

  function harvestLost(server, player, entity) {
    wipeXp(server, player)
    player.tell(Text.of(''))
    player.tell(Text.of('§8§oIt took what it came for.'))
    player.tell(Text.of(''))
    closeHarvest(server, player, false)
    try { if (alive(entity)) entity.discard() } catch (x) { }
  }

  // ------------------------------------------------------------- C6: the phases
  function stateAll(server) { return server.persistentData.getCompound(STATE) }

  function phaseStored(server, player) {
    var all = stateAll(server), u = String(player.uuid)
    return all.contains(u) ? all.getCompound(u).getString('phase') : ''
  }
  // Published for paths.js, which must refuse /path release mid-Harvest (K2).
  // NOT VELDORA.phaseLabel - that maps a raw notoriety NUMBER to a band name and
  // knows nothing about the stored, hysteresis-damped phase a player is actually
  // in. The two disagree exactly where it matters.
  VELDORA.stalkerPhase = function (server, player) {
    try { return phaseStored(server, player) } catch (x) { return '' }
  }

  function phaseStore(server, player, phase) {
    var all = stateAll(server), u = String(player.uuid)
    var rec = all.getCompound(u)
    rec.putString('phase', phase)
    all.put(u, rec)
    server.persistentData.put(STATE, all)
  }

  function bandOf(n) {
    for (var i = 0; i < BANDS.length; i++) {
      if (n >= BANDS[i][1] && n < BANDS[i][2]) return BANDS[i][0]
    }
    return 'helper'
  }

  // Hysteresis. Enchanting drops a player from 30 to 0 in one click, so without
  // stickiness the stalker would blink in and out all evening. A phase is only
  // left once the number is HYST clear of the band it is in.
  function resolvePhase(n, prev) {
    var now = bandOf(n)
    // 'none' is not a band and never can be - it means "no path", not a notoriety
    // range. Treat it as no previous phase at all rather than letting the sticky
    // loop below fail to find it and silently fall through every single call.
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
      // WAS UNREACHABLE BY PLAY: at n=100 the band said 'harvest' and hysteresis
      // overruled it every second, silently.
      //
      // Same family as the other four: the value was the right thing (a notoriety)
      // in the wrong range (one the cap makes impossible), and the check confirmed
      // the comparison without asking whether it could ever be false.
      var hi = Math.min(BANDS[i][2] + HYST, CAP_VALUE)
      if (n >= lo && n < hi) return prev      // still inside the sticky range
    }
    return now
  }

  function readNotoriety(server, player) {
    if (typeof VELDORA === 'undefined' || typeof VELDORA.notoriety !== 'function') return null
    try {
      var b = VELDORA.notoriety(server, player)
      return (b && typeof b.value === 'number' && isFinite(b.value)) ? b : null
    } catch (x) { return null }
  }
  function notorietyOf(server, player) {
    var b = readNotoriety(server, player)
    return b === null ? null : b.value
  }

  // ---- C7 state: the 30-day absence -----------------------------------------
  // presence state rides the same per-player compound as the phase
  function stateOf(server, player) {
    var all = stateAll(server), u = String(player.uuid)
    var rec = all.contains(u) ? all.getCompound(u) : null
    return {
      hour: rec ? rec.getInt('hour') : -1,
      present: rec ? rec.getBoolean('present') : false,
    }
  }
  function setPresence(server, player, hour, present) {
    var all = stateAll(server), u = String(player.uuid)
    var rec = all.getCompound(u)
    rec.putInt('hour', hour)
    rec.putBoolean('present', present)
    all.put(u, rec)
    server.persistentData.put(STATE, all)
  }

  function absentUntil(server, player) {
    var all = stateAll(server), u = String(player.uuid)
    return all.contains(u) ? all.getCompound(u).getInt('absentUntil') : 0
  }
  function setAbsentUntil(server, player, day) {
    var all = stateAll(server), u = String(player.uuid)
    var rec = all.getCompound(u)
    rec.putInt('absentUntil', day)
    all.put(u, rec)
    server.persistentData.put(STATE, all)
  }

  function isHarvestInstance(e) {
    try { return !!e && e.persistentData.getBoolean(HARVEST) } catch (x) { return false }
  }

  // The wipe. Verified at the point of USE - "I set it to 0" and "it is 0" are
  // different claims, and a silent failure here would let a player keep every
  // level after losing everything.
  function wipeXp(server, player) {
    var before = -1
    try { before = player.xpLevel } catch (x) { }
    var cands = [
      ['xp set command', function () { server.runCommandSilent('xp set ' + player.username + ' 0 levels') }],
      ['xpLevel setter', function () { player.xpLevel = 0 }],
      ['setExperienceLevels', function () { player.setExperienceLevels(0) }],
    ]
    for (var i = 0; i < cands.length; i++) {
      try {
        cands[i][1]()
        var after = player.xpLevel
        if (typeof after === 'number' && after === 0) {
          console.info('[stalker] XP wiped for ' + player.username + ' (' + before + ' -> 0) via ' + cands[i][0])
          return true
        }
      } catch (x) { }
    }
    console.error('[stalker] !! XP WIPE FAILED for ' + player.username + ' - still at ' + before)
    console.error('[stalker] !! The Harvest took nothing. That is a BUG, not a mercy.')
    return false
  }

  // The in-memory map is not the world's opinion. It is empty after every
  // restart, so orphans from the previous session are invisible to it and the
  // sweep cheerfully summons another one alongside them. That is how Ethan got
  // multiple Krampuses. Ask the world instead.
  // Returns an array, or NULL if the scan could not run. null is NOT "none" -
  // treating a failed scan as an empty world is what minted duplicate immortal
  // stalkers every time an owner walked 85 blocks away or through a portal.
  function findOwned(player) {
    var out = []
    try {
      var near = player.level.getEntitiesWithin(player.boundingBox.inflate(SCAN_RADIUS))
      for (var i = 0; i < near.length; i++) {
        var e = near[i]
        // fleeing ones are INCLUDED: a flee interrupted by a restart leaves an
        // immortal that nothing else can remove, since the guard cancels all
        // damage to it forever.
        if (isStalker(e) && ownerOf(e) === player.username && alive(e)) out.push(e)
      }
    } catch (x) { return null }
    return out
  }

  // null  = could not determine (caller must NOT summon)
  // false = determined, nothing there (caller may summon)
  function cull(player, uuid) {
    var owned = findOwned(player)
    if (owned === null) return null
    if (!owned.length) return false
    var keep = null
    for (var i = 0; i < owned.length; i++) if (isHarvestInstance(owned[i])) { keep = owned[i]; break }
    if (!keep) keep = owned[0]
    var killed = 0
    for (var j = 0; j < owned.length; j++) {
      if (owned[j] === keep) continue
      try { owned[j].discard(); killed++ } catch (x) { }
    }
    if (killed) console.warn('[stalker] culled ' + killed + ' duplicate stalker(s) for ' + player.username)
    // a stalker that was mid-flee is not a companion; drop it rather than adopt
    if (isFleeing(keep)) { try { keep.discard() } catch (x) { } ; delete live[uuid]; return false }
    live[uuid] = keep
    return keep
  }

  function sameEntity(a, b) {
    if (!a || !b) return false
    try { return String(a.uuid) === String(b.uuid) } catch (x) { return false }
  }

  // ---------------------------------------------------------------------------
  // CULLING THE PARENT MUST CULL WHAT THE PARENT SUMMONED.
  //
  // Ethan, 2026-08-11: "path of blade's pumpkin head showed up for half a second,
  // flickered, then summoned a small minion which promptly killed my brother."
  //
  // The log agrees exactly: `Lehykt was slain by Senor Pumpkin`. Senor Pumpkin is
  // a minion born_in_chaos summons from lord_pumpkinhead's OWN mob AI - we never
  // asked for it and hold no reference to it. discard()ing the pumpkin head left
  // the minion standing, with no owner relation and no idea it was ever on
  // anyone's side. It killed the player its parent was summoned to protect.
  //
  // There is no hook for "this mob summoned that mob", so we infer it: a living
  // mob that appears within MINION_RADIUS of a live stalker is that stalker's.
  // The inference can only ever over-collect things standing next to a stalker
  // that we ourselves put there, and it is bounded to a 12-block ball around it.
  // ---------------------------------------------------------------------------
  function ownerKeyOf(e) {
    var keys = Object.keys(live)
    for (var i = 0; i < keys.length; i++) {
      if (sameEntity(live[keys[i]], e)) return keys[i]
    }
    return null
  }

  function clearMinions(uuid) {
    var list = minions[uuid]
    delete minions[uuid]
    if (!list) return 0
    var n = 0
    for (var i = 0; i < list.length; i++) {
      if (alive(list[i])) { try { list[i].discard(); n++ } catch (x) { } }
    }
    return n
  }

  // ---------------------------------------------------------------------------
  // THE PIGLIN RULE - a stalker's minions are NEUTRAL to its owner until struck.
  //
  // Ethan, 2026-08-14, from the /patron bench: "mother spider and the direwolf
  // need to be redone since they spawn minions and those minions stay agrowed...
  // is it possible to put their behavior the same way a zombie pigman is? Where
  // they aren't aggroed unless attacked?"
  //
  // Not literally. Vanilla neutrality is the NeutralMob interface compiled into
  // the entity class - AngerTime, angry_at, remembering who hit it - and KubeJS
  // exposes neither that nor the goal selectors. But it can be EMULATED exactly,
  // and both halves are already proven in this file:
  //   · the hard stop - beforeHurt + cancel(), the same shape as the guard that
  //                     stops your own stalker hurting you. No window.
  //   · the behaviour - setTarget(null), so they stop mobbing you instead of
  //                     swinging harmlessly forever.
  //
  // THE GAP IT CLOSES: that existing guard tests isStalker(biter). A spiderling
  // is not a stalker, so every minion fell straight through it, which is exactly
  // what Ethan met on the bench. It is a FICTION bug as much as a mechanical one:
  // Wall never threatens, and a mother whose children maul you unprompted
  // contradicts the entire character.
  //
  // Anger is keyed on the STALKER, not the minion - hit the mother and all her
  // children answer. That is the point of her.
  // ---------------------------------------------------------------------------
  var ANGER_TICKS = 600                 // ~30s, about a piglin's memory
  var angered = {}                      // stalker uuid -> world tick it calms at

  function nowTick(e) {
    try { return e.level.time } catch (x) { }
    return 0
  }

  // Which live stalker owns this entity as a minion? null if it is nobody's.
  function minionOwnerUuid(e) {
    if (!e) return null
    var keys = Object.keys(minions)
    for (var i = 0; i < keys.length; i++) {
      var list = minions[keys[i]]
      if (!list) continue
      for (var j = 0; j < list.length; j++) {
        if (sameEntity(list[j], e)) return keys[i]
      }
    }
    return null
  }

  function isAngered(stalkerUuid, e) {
    var until = angered[stalkerUuid]
    if (!until) return false
    if (nowTick(e) >= until) { delete angered[stalkerUuid]; return false }
    return true
  }

  function anger(stalkerUuid, e, why) {
    if (!stalkerUuid) return
    angered[stalkerUuid] = nowTick(e) + ANGER_TICKS
    console.info('[stalker] angered ' + String(stalkerUuid).substring(0, 8) + ' - ' + why)
  }

  // ---------------------------------------------------------------------------
  // THE BENCH SEAM. /patron summons a casting to be looked at, and the first
  // version summoned it UNOWNED - no OWNER tag, so isStalker() was false, so the
  // "your own stalker cannot hurt you" hard stop never fired, its minions were
  // never registered, and the piglin rule could not see any of it. The bench was
  // dropping genuinely hostile bosses on the person testing it, and Ethan died
  // three times in four minutes before the respawn log gave it away.
  //
  // adopt() makes a bench summon a REAL stalker: tagged, owned, and in live[], so
  // every guard applies exactly as it would in play. A bench that does not
  // reproduce live conditions is not a bench, it is a hazard.
  // ---------------------------------------------------------------------------
  VELDORA.stalkerAdopt = function (player, entity, pathKey) {
    try {
      var uuid = String(player.uuid)
      if (live[uuid] && !sameEntity(live[uuid], entity)) dismiss(uuid)
      entity.persistentData.putString(OWNER, String(player.username))
      entity.persistentData.putString(PATHKEY, String(pathKey))
      // A bench summon must STAY PUT and STAY EXISTING. Adopting it made every
      // guard apply, which was the point - but it also handed it to keepDistance,
      // whose job is to hold a stalker DIST_FAR (100 blocks) away and out of your
      // view. So the spider spawned, was adopted, and was instantly teleported out
      // of the world you were standing in. It was working perfectly and that is
      // precisely why it vanished. Ordinary stalkers also carry no persistence and
      // despawn on purpose, which would have finished the job.
      entity.persistentData.putBoolean(BENCH, true)
      try { entity.mergeNbt({ PersistenceRequired: 1 }) } catch (x) { }
      live[uuid] = entity
      delete angered[uuid]
      console.info('[stalker] adopted a bench summon for ' + player.username + ' as ' + pathKey)
      return true
    } catch (e) {
      console.error('[stalker] adopt failed :: ' + e)
      return false
    }
  }

  function dismiss(uuid) {
    var e = live[uuid]
    delete live[uuid]
    delete helperLive[uuid]
    var m = clearMinions(uuid)
    if (m) console.info('[stalker] culled ' + m + ' orphaned minion(s) along with the stalker')
    if (alive(e)) { try { e.discard() } catch (x) { } }
  }

  function isStalkerType(e) {
    try {
      var id = String(e.type)
      var keys = Object.keys(CAST)
      for (var i = 0; i < keys.length; i++) {
        if (id.indexOf(CAST[keys[i]][0]) >= 0) return true
      }
    } catch (x) { }
    return false
  }

  EntityEvents.spawned(function (event) {
    try {
      var e = event.entity
      if (!e) return
      var keys = Object.keys(live)
      if (!keys.length) return                 // nothing of ours is out there
      if (e.player) return
      try { if (!e.living) return } catch (x) { return }
      if (isStalkerType(e)) return             // a stalker is not another one's minion
      if (isStalker(e)) return                 // ...nor is a RETIRED casting still
                                               // wearing the owner tag, e.g. a
                                               // lord_pumpkinhead left over from
                                               // before the blade swap
      for (var i = 0; i < keys.length; i++) {
        var s = live[keys[i]]
        if (!alive(s)) continue
        if (sameEntity(s, e)) return
        var dx, dy, dz
        try {
          if (String(s.level.dimension) !== String(e.level.dimension)) continue
          dx = s.x - e.x; dy = s.y - e.y; dz = s.z - e.z
        } catch (x) { continue }
        if (dx * dx + dy * dy + dz * dz > MINION_RADIUS * MINION_RADIUS) continue
        ;(minions[keys[i]] = minions[keys[i]] || []).push(e)
        return
      }
    } catch (x) { }
  })

  // K6. When the hour rolled against them the Companion was discard()ed on the
  // spot - it vanished mid-stride while you were looking straight at it. The
  // teleport path already refuses to move a stalker inside the player's view cone
  // for exactly this reason; the LEAVE path never asked. flee() already exists and
  // is the graceful exit (invisibility, speed, gone in 30 ticks), so: seen ->
  // walk away, unseen -> simply cease to have been there.
  function leaveQuietly(player, uuid) {
    var e = live[uuid]
    if (!alive(e)) { dismiss(uuid); return }
    var seen = true
    try { seen = inView(player, e) } catch (x) { seen = true }   // fail closed
    if (seen) {
      flee(e, 'the hour turned')        // ownerKeyOf() resolves NOW, while live still maps it
      delete live[uuid]
      delete helperLive[uuid]
    } else {
      dismiss(uuid)
    }
  }

  var warnedNoC1 = false
  function sweepPlayer(server, player) {
    var uuid = String(player.uuid)
    var b = readNotoriety(server, player)
    if (b === null) {
      if (!warnedNoC1) {
        warnedNoC1 = true
        console.warn('[stalker] C1 unreadable - NO phase logic is running for anyone.')
        console.warn('[stalker] That is a BUG, not a mode.')
      }
      return
    }
    var n = b.value

    var cur0 = live[uuid]
    if (!alive(cur0)) delete live[uuid]

    // THE 30-DAY ABSENCE after a Harvest, won or lost. It overrides every phase:
    // enough for you to forget what they did.
    if (b.day < absentUntil(server, player)) {
      if (live[uuid]) dismiss(uuid)
      return
    }

    // NO PATH is a legitimate way to play, and it must be checked BEFORE any
    // phase work - not after.
    //
    // 🚨 THIS WAS A LIVE LAG BUG. It used to sit below the resolver, so every
    // sweep for a pathless player did: resolve 'none' -> 'helper' (because 'none'
    // is not a band, so no stickiness applies), WRITE it, LOG it, and then the
    // pathless branch wrote 'none' straight back. Two full NBT read-mutate-writes
    // of the whole state compound plus a log line, once a SECOND, per pathless
    // player, forever. ClickedIce29313 spammed
    // "none -> helper (n=6)" and the server crawled.
    var myPath = ''
    try { myPath = player.persistentData.getString('veldora_path') } catch (x) { }
    if (!myPath || !CAST[myPath]) {
      if (live[uuid]) dismiss(uuid)
      // compare against what is STORED, so a settled pathless player writes nothing
      if (phaseStored(server, player) !== 'none') {
        phaseStore(server, player, 'none')
        console.info('[stalker] ' + player.username + ' walks no path - stalker stood down')
      }
      return
    }

    var prev = phaseStored(server, player)

    // E3. The `phase` coefficient scales notoriety BEFORE banding, so Blade (×2)
    // meets its creature at half the fame. Deliberately NOT clamped to CAP_VALUE:
    // harvest is the band [100, Infinity) and clamping the scaled value to 100
    // would park a fast path in `absence` permanently - which is precisely the bug
    // that made THE HARVEST UNREACHABLE BY PLAY (see resolvePhase above). The cap
    // governs raw notoriety; it must not govern this.
    var pn = n
    try {
      if (typeof VELDORA !== 'undefined' && VELDORA.coeff &&
          typeof VELDORA.coeff.of === 'function') {
        var pc = VELDORA.coeff.of(server, player, 'phase')
        if (typeof pc === 'number' && isFinite(pc) && pc > 0) pn = n * pc
      }
    } catch (e) { console.warn('[stalker] VELDORA.coeff threw on phase :: ' + e) }

    var phase = resolvePhase(pn, prev)
    if (phase !== prev) {
      phaseStore(server, player, phase)
      console.info('[stalker] ' + player.username + ' ' + (prev || '-') + ' -> ' + phase +
        ' (n=' + n + (pn !== n ? ', phase-scaled ' + (Math.round(pn * 10) / 10) : '') + ')')
    }

    var cur = live[uuid]
    if (!alive(cur)) { delete live[uuid]; cur = null }

    // RECASTING MIGRATION. Changing CAST only changes what summon() CREATES - an
    // instance already bound to a player keeps its owner tag, so the sweep goes on
    // recognising it as a perfectly good stalker and never replaces it. When Blade
    // was recast from lord_pumpkinhead to fallen_chaos_knight, Lehykt's pumpkin
    // would have followed him around for good.
    //
    // Exempt during the Harvest: swapping the body mid-fight would delete the
    // thing that is currently trying to kill him.
    if (cur && !isHarvestInstance(cur)) {
      var wantType = CAST[myPath] ? CAST[myPath][0] : null
      var haveType = null
      try { haveType = String(cur.type) } catch (x) { }
      if (wantType && haveType && haveType.indexOf(wantType) < 0) {
        console.info('[stalker] ' + player.username + ' carries a RETIRED casting (' +
          haveType + '), ' + myPath + ' is now ' + wantType + ' - retiring it')
        leaveQuietly(player, uuid)
        cur = null
      }
    }

    // adopt orphans and kill duplicates - the costly scan, so not every pass
    var scanned = true
    if (sweepCount % CULL_EVERY === 0 || !cur) {
      var found = cull(player, uuid)
      if (found === null) { scanned = false }            // could not tell - do NOT summon
      else if (found) { cur = found }
      else { delete live[uuid]; cur = null }
    }

    // THE ABSENCE: gone. no warning, no message.
    if (phase === 'absence') {
      if (cur) dismiss(uuid)
      return
    }

    // THE HARVEST: it comes for you, and now it can die.
    if (phase === 'harvest') {
      if (cur && isHarvestInstance(cur)) return
      if (cur) dismiss(uuid)                       // a companion does not become the harvest
      var hk = myPath
      if (!scanned) return
      var he = summonHarvest(player, hk)
      if (he) {
        live[uuid] = he
        console.info('[stalker] HARVEST begun for ' + player.username + ' (' + hk + ')')
        player.tell(Text.of('§4§l' + CAST[hk][1] + '§c has come for you.'))
      }
      return
    }

    // THE HELPER only ever appears at low health - it is summoned by the damage
    // hook below, never by this sweep. But a player who enchants from 30 down to
    // 20 was leaving their Companion standing there indefinitely, which made
    // "the Helper appears ONLY at low health" plainly untrue.
    if (phase === 'helper') {
      // An ACTIVE Helper - summoned by the damage hook seconds ago - is NOT a
      // leftover Companion, and culling it here is what made the Helper useless
      // for its entire existence. The sweep runs every 20 ticks and this branch
      // discarded the Helper about one second after it arrived: Ethan saw it
      // "showed up for half a second, flickered". With it gone, `cur` was null on
      // the next hit, so the damage hook summoned ANOTHER one - nine of them in a
      // single fight, from 7 hp down to -1.
      if (cur && sameEntity(cur, helperLive[uuid])) return
      if (cur && !isHarvestInstance(cur)) dismiss(uuid)
      return
    }

    // THE COMPANION: present only when the hour rolls its way.
    var hourNow = Math.floor((b.dayTime !== undefined ? b.dayTime : (b.day * 24000)) / HOUR_TICKS)
    var st = stateOf(server, player)
    if (st.hour !== hourNow) {
      var span = (PRESENCE_AT_74 - PRESENCE_AT_25) / (74 - 25)
      var chance = PRESENCE_AT_25 + (Math.min(74, Math.max(25, n)) - 25) * span
      var want = Math.random() < chance
      setPresence(server, player, hourNow, want)
      if (!want && cur) {
        console.info('[stalker] companion left ' + player.username +
          ' (hour ' + hourNow + ', chance ' + Math.round(chance * 100) + '%)')
        leaveQuietly(player, uuid); cur = null
      }
      st.present = want
    }
    if (!st.present) { if (cur) leaveQuietly(player, uuid); return }

    if (!cur) {
      if (!scanned) return                          // the scan failed: never summon blind
      var e = summon(player, myPath, DIST_FAR)
      if (e) { live[uuid] = e; console.info('[stalker] companion joined ' + player.username) }
      return
    }
    // 🚨 A Companion is still a Born in Chaos HOSTILE. Left alone its own AI
    // acquires the nearest player - which is its owner - and it mauls the person
    // it is supposed to be protecting. Nothing in C6 prevented that; the
    // owner-damage hook only ever SETS a target, it never clears a wrong one.
    // Outside the Harvest, the owner is never a valid target.
    try {
      var tgt = cur.getTarget()
      if (tgt && tgt.username === player.username) cur.setTarget(null)
    } catch (x) {
      try { if (cur.target && cur.target.username === player.username) cur.setTarget(null) } catch (y) { }
    }

    // THE PIGLIN RULE, behaviour half. The same reasoning one comment up, applied
    // to the CHILDREN: a Born in Chaos minion's own AI acquires the nearest
    // player, which is its patron's own walker. The beforeHurt guard already makes
    // those swings harmless, but harmless is not the same as calm - being mobbed
    // by a pack that cannot hurt you still reads as broken. This is what makes
    // them wander off. Skipped while angered, because a retaliation the player
    // earned should actually arrive.
    if (!isAngered(uuid, player)) {
      var kids = minions[uuid]
      if (kids) {
        for (var mi = 0; mi < kids.length; mi++) {
          var kid = kids[mi]
          if (!alive(kid)) continue
          try {
            var kt = null
            try { kt = kid.getTarget() } catch (y) { kt = kid.target }
            if (kt && kt.username === player.username) kid.setTarget(null)
          } catch (y) { }
        }
      }
    }

    // A bench summon holds its ground. keepDistance would put it 100 blocks away,
    // which is correct for a stalker and useless for something you are inspecting.
    var onBench = false
    try { onBench = cur.persistentData.getBoolean(BENCH) } catch (x) { }
    if (!onBench) keepDistance(player, cur)
  }

  // ---------------------------------------------------------------------------
  // A STALKER MUST NOT OUTLIVE ITS OWNER'S SESSION.
  //
  // Found live 2026-08-12: Ethan reported a Lord Pumpkinhead parked at his base.
  // Its NBT read
  //     KubeJSPersistentData: {veldora_stalker_path: "blade",
  //                            veldora_stalker_owner: "Lehykt"}
  // - Lehykt's stalker, still standing there while Lehykt was OFFLINE.
  //
  // The sweep only runs for players who are logged in, so everything that keeps
  // a stalker honest - the phase logic, the distance leash, the recasting
  // migration - simply stops when its owner leaves. The entity is left in the
  // world, unkillable (the damage guard cancels everything outside a Harvest),
  // haunting somebody else's base with a boss bar over its head.
  //
  // It re-summons the moment they log back in, so standing it down costs nothing.
  // ---------------------------------------------------------------------------
  PlayerEvents.loggedOut(function (event) {
    var p = event.player
    if (!p) return
    var uuid = String(p.uuid)
    if (!live[uuid]) return
    console.info('[stalker] ' + p.username + ' logged out - standing their stalker down')
    dismiss(uuid)
    delete helperCooling[uuid]
  })

  // The owner got hit. This is what makes a Helper appear, and what makes a
  // Companion retaliate - INCLUDING against another player, which is the whole
  // consequence layer PvP currently lacks.
  EntityEvents.beforeHurt(function (event) {
    var p = event.entity
    var isPlayer = false
    try { isPlayer = !!p && !!p.username } catch (x) { }
    if (!isPlayer) return
    if (!SERVER) ensureServer(p)
    if (!SERVER) return

    // YOUR OWN STALKER CANNOT HURT YOU outside the Harvest. Clearing its target
    // on a 2s sweep is cosmetic; between sweeps its AI re-acquires and swings,
    // which is exactly how it was killing Ethan. This is the hard stop, and it is
    // event-driven so there is no window.
    var biter = attackerOf(event)
    if (biter && isStalker(biter) && ownerOf(biter) === p.username && !isHarvestInstance(biter)) {
      try { biter.setTarget(null) } catch (x) { }
      event.cancel()
      return
    }

    // THE PIGLIN RULE, hard-stop half. A minion of YOUR OWN stalker cannot hurt
    // you unless you struck first. Same shape as the guard above and for the same
    // reason: clearing the target on a sweep is cosmetic, because the AI
    // re-acquires between sweeps and swings. This is event-driven, so there is no
    // window at all.
    if (biter) {
      var mOwner = minionOwnerUuid(biter)
      if (mOwner && ownerOf(live[mOwner]) === p.username && !isAngered(mOwner, p)) {
        try { biter.setTarget(null) } catch (x) { }
        event.cancel()
        return
      }
    }

    var uuid = String(p.uuid)
    var phase = phaseStored(SERVER, p)
    if (phase === 'absence' || phase === 'harvest') return

    var attacker = attackerOf(event)
    var cur = live[uuid]
    if (!alive(cur)) { delete live[uuid]; cur = null }

    if (cur) {
      if (attacker) { try { cur.setTarget(attacker) } catch (x) { } }
      return
    }

    if (phase !== 'helper') return

    // THE HELPER: only at genuinely low health. That gate is also what keeps the
    // bait exploit self-limiting - siccing it on someone means nearly dying first.
    var hp = 20, max = 20
    try { hp = p.health } catch (x) { }
    try { max = p.getAttribute('minecraft:generic.max_health').getValue() } catch (x) { }
    var dmg = damageOf(event)
    var after = (dmg === null) ? hp : (hp - dmg)
    if (after > max * HELPER_AT) return

    // A blow that kills outright does not get a bodyguard. The old code summoned
    // one anyway - the log carries "helper answered ... at 0 hp" and "at -1 hp",
    // a boss-tier mob spawned next to a corpse with nobody left to protect.
    if (after <= 0) return

    // ONE visit per cooldown. Without this the Helper re-answered on every single
    // hit, because the sweep had already culled the previous one.
    if (helperCooling[uuid]) return

    var pathKey = ''
    try { pathKey = p.persistentData.getString('veldora_path') } catch (x) { }
    if (!pathKey || !CAST[pathKey]) return

    var e = summon(p, pathKey, 10)
    if (!e) return
    live[uuid] = e
    // point it at the threat immediately; if there is no attacker (fall, lava)
    // make sure it does not default to the owner it came to help
    if (attacker) { try { e.setTarget(attacker) } catch (x) { } }
    else { try { e.setTarget(null) } catch (x) { } }
    helperLive[uuid] = e
    helperCooling[uuid] = true
    console.info('[stalker] helper answered for ' + p.username + ' at ' + Math.round(after) + ' hp')
    SERVER.scheduleInTicks(HELPER_COOLDOWN, function () { delete helperCooling[uuid] })
    SERVER.scheduleInTicks(HELPER_STAY, function () {
      if (sameEntity(live[uuid], e)) {
        delete live[uuid]
        delete helperLive[uuid]
        var m = clearMinions(uuid)
        if (m) console.info('[stalker] the Helper took ' + m + ' summon(s) with it')
        if (alive(e)) flee(e, 'helper visit over')
      }
    })
  })

  // -------------------------------------------------------------------- boot
  function sweep(server) {
    sweepCount++
    // PER PLAYER, not per loop. The try used to wrap the whole loop, so one
    // deterministic fault on the first player silently starved everyone behind
    // them in the list - which is exactly what the undefined-helper bug would
    // have done to all four of them at once.
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        try { sweepPlayer(server, players[i]) }
        catch (one) { console.warn('[stalker] sweep threw for ' + players[i].username + ' :: ' + one) }
      }
    } catch (e) { console.warn('[stalker] sweep loop threw :: ' + e) }
    server.scheduleInTicks(SWEEP, function () { sweep(server) })
  }

  ServerEvents.loaded(function (event) {
    SERVER = event.server
    live = {}
    console.info('[stalker] C5 active - flee at ' + Math.round(FLEE_AT * 100) +
      '% health, ' + Object.keys(CAST).length + ' castings, scale x' + SCALE)
    console.info('[stalker] C6 active - sweep ' + SWEEP + 't, hysteresis ' + HYST +
      ', helper at ' + Math.round(HELPER_AT * 100) + '% owner health')
    console.info('[stalker] C7 active - harvest x' + HARVEST_MULT.health +
      ' health, ' + ABSENT_DAYS + '-day absence, ' + FRAGMENTS.length + ' fragments')
    console.info('[stalker] a stalker DEATH will log an INVARIANT BREACH banner')
    event.server.scheduleInTicks(SWEEP, function () { sweep(event.server) })
  })

  // ------------------------------------------------------------------ commands
  // ADMIN GATE. Everything that can mint items, force a boss, or opt a player out
  // of the hunt is level 2. It FAILS CLOSED - if hasPermission ever throws, the
  // answer is no. On a four-player server with a brother, /stalker harvest was
  // three diamonds a go on repeat and /notoriety_setday was a permanent opt-out
  // of the one thing the design says you cannot opt out of.
  function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    var root = Commands.literal('stalker')

    root = root.then(Commands.literal('clear').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var n = 0
      try {
        var near = p.level.getEntitiesWithin(p.boundingBox.inflate(128))
        for (var i = 0; i < near.length; i++) if (isStalker(near[i])) { near[i].discard(); n++ }
      } catch (e) { p.tell(Text.of('§c' + e)) }
      delete live[String(p.uuid)]
      p.tell(Text.of('§7Cleared §f' + n + '§7 stalker(s) within 128 blocks.'))
      return 1
    }))

    root = root.then(Commands.literal('harvest').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var hk = ''
      try { hk = p.persistentData.getString('veldora_path') } catch (x) { }
      if (!hk || !CAST[hk]) { p.tell(Text.of('§cWalk a path first: /path <name>')); return 0 }
      dismiss(String(p.uuid))
      setAbsentUntil(srv, p, 0)
      phaseStore(srv, p, 'harvest')
      var e = summonHarvest(p, hk)
      if (!e) { p.tell(Text.of('§ccould not summon')); return 0 }
      live[String(p.uuid)] = e
      p.tell(Text.of('§4§l' + CAST[hk][1] + '§c has come for you.'))
      p.tell(Text.of('§8It CAN die now. Kill it, or let it kill you - both close the cycle.'))
      p.tell(Text.of('§8health §f' + Math.round(maxHealthOf(e)) + '§8 (x' + HARVEST_MULT.health + ')'))
      return 1
    }))

    root = root.then(Commands.literal('phase').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var n = notorietyOf(srv, p)
      var stored = phaseStored(srv, p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7notoriety §f' + (n === null ? '§cUNREADABLE' : n)))
      p.tell(Text.of('§7raw band  §f' + (n === null ? '?' : bandOf(n))))
      p.tell(Text.of('§7stored    §f' + (stored || '§8none yet')))
      p.tell(Text.of('§8  hysteresis ' + HYST + ': the stored phase only changes once'))
      p.tell(Text.of('§8  notoriety is ' + HYST + ' clear of its band'))
      var au = absentUntil(srv, p)
      var bb = readNotoriety(srv, p)
      if (bb && bb.day < au) {
        p.tell(Text.of('§7absent    §funtil day ' + au + ' §8(today is ' + bb.day + ')'))
      }
      var cur = live[String(p.uuid)]
      p.tell(Text.of('§7stalker   §f' + (alive(cur) ? cur.type +
        (isHarvestInstance(cur) ? ' §4§lHARVEST' : '') : '§8none present')))
      return 1
    }))

    Object.keys(CAST).forEach(function (key) {
      root = root.then(Commands.literal(key).requires(ADMIN).executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        var e = summon(p, key, DIST_FAR)
        if (!e) { p.tell(Text.of('§ccould not summon ' + key)); return 0 }
        p.tell(Text.of('§7Summoned §f' + CAST[key][1] + ' §8(' + CAST[key][0] + ')'))
        p.tell(Text.of('§7max health §f' + Math.round(maxHealthOf(e)) +
          ' §8· flees below §f' + Math.round(maxHealthOf(e) * FLEE_AT)))
        return 1
      }))
    })

    event.register(root)
  })
})()
