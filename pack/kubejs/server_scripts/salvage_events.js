// salvage_events.js - THE HOUND'S BUSINESS.  docs/44
//
// Ethan, 2026-08-15:
//   "Events should be mostly trades, the answers should always be ambiguous."
//   "Counter will be called Harness. Low harness = bad deals, high harness = good
//    deals."
//
// ── ⭐ SHE IS THE ONLY GOD WHOSE COUNTER IS A PRICE ─────────────────────────
// Blade's counter is how much he respects you. The Spider's is how frightened she
// is of losing you. Hers is your CREDIT RATING, and it does something none of the
// others do: it changes the numbers.
//
//     harness 0    you pay 1.5x and receive 1.0x    she is testing you
//     harness 1    you pay 1.0x and receive 2.0x    you are worth keeping
//
// Her hold on you is not a threat, it is a DISCOUNT. Walking away costs you the
// rate you spent the whole game earning. That is a better trap than anything she
// could say, and it is the only one in the pantheon built out of arithmetic.
// (The scaling itself lives in salvage.js, which owns the trades.)
//
// ── ⚠️ THE ANSWERS ARE ALWAYS AMBIGUOUS ────────────────────────────────────
// Every option label here is a decision, never a price. "Take it." and never
// "Pay 5 levels for 30 rounds." Her brief demands it - docs/27: "never states the
// full price up front and NEVER TECHNICALLY LIES" - and the two rules together are
// the whole character. She will tell you the truth if you ask. She will not
// volunteer the total.
//
// 🚨 SO THE PRICE MUST BE REAL AND MUST BE PAID *AFTER* THE GOODS EXIST. An
// ambiguous offer that turns out to be a bad deal is her working. An ambiguous
// offer that charges you for nothing is a bug wearing her voice, and it is a bug
// this file's neighbour already shipped once (salvage.js: "Charge only AFTER the
// goods exist. The reverse order is how a player pays for nothing").
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[salvev] '
  var GOD = 'salvage'
  var GATE = true

  var ACTOR = 'born_in_chaos_v1:dire_hound_leader'
  var ACTOR_TAG = 'veldora_salvage_actor'
  var HARVEST_TAG = 'veldora_salvage_harvest'
  var Q = String.fromCharCode(39)

  function say(p, tag) {
    try { if (VELDORA.voice) return VELDORA.voice.say(p, GOD, tag) } catch (e) { }
    return false
  }

  function line(p, tag) {
    try {
      if (VELDORA.voice && typeof VELDORA.voice.line === 'function') {
        return VELDORA.voice.line(GOD, tag, p)
      }
    } catch (e) { }
    return null
  }

  // ── harness, read from the file that owns the trades ─────────────────────
  function harness(p) {
    try {
      if (VELDORA.salvage && typeof VELDORA.salvage.harness === 'function') {
        return VELDORA.salvage.harness(p)
      }
    } catch (e) { }
    return null
  }

  // Weight curves. Hers are gentler than the Spider's - a dealer does not stop
  // dealing at either end, she only changes her terms. So nothing here goes to
  // zero except the two events that are explicitly about being new or trusted.
  function wAlways(base) {
    return function () { return base }
  }
  function wPoor(base) {          // heaviest when she barely knows you
    return function (server, p) {
      var h = harness(p)
      if (h === null) return 0
      return base * (1 - h)
    }
  }
  function wRich(base) {          // heaviest when you are worth keeping
    return function (server, p) {
      var h = harness(p)
      if (h === null) return 0
      return base * h
    }
  }

  function eff(p, id, secs, amp) {
    try { p.potionEffects.add(id, secs * 20, amp || 0, false, false); return true }
    catch (e) { console.warn(TAG + 'effect ' + id + ' threw :: ' + e); return false }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // THE TRADES
  // ═══════════════════════════════════════════════════════════════════════════

  // ⭐ HER MAIN COUNTER, opened by her rather than by you walking into it.
  // salvage.js owns the three canon trades (hunger, levels, sight) and the whole
  // ritual around them. This event exists to make her ARRIVE - the difference
  // between a shop and a dealer is who starts the conversation.
  function evDeal(server, p) {
    if (!VELDORA.salvage || typeof VELDORA.salvage.open !== 'function') {
      console.error(TAG + 'salvage.js missing - she has no counter to open')
      return false
    }
    return !!VELDORA.salvage.open(p, 'event')
  }

  // ⭐ CREDIT. She gives you something now and writes it down. The debt is REAL -
  // a flag that `collect` reads later - because an IOU that never comes due is not
  // a deal, it is a gift with atmosphere.
  var K_DEBT = 'veldora_salvage_debt'

  function owes(p) {
    try { return (p.persistentData.getInt(K_DEBT) || 0) > 0 } catch (e) { return false }
  }

  function evCredit(server, p) {
    if (owes(p)) return false                 // one tab at a time
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }

    var open = line(p, 'deal_open') || 'Let\'s do a deal.'
    return VELDORA.ritual.begin(p, {
      colour: '§6§l',
      lines: [open, 'You don\'t have to pay today.'],
      // ⚠️ AMBIGUOUS ON PURPOSE. Neither label names a price, and neither is a lie.
      options: [
        { label: 'Take it.', id: 'yes' },
        { label: 'Not today.', id: 'no' },
      ],
      holdAfterChoice: 60,
      onChoose: function (pl, id) {
        if (id !== 'yes') { say(pl, 'deal_refused'); return }
        // The goods first, then the ledger. Never the reverse.
        var got = eff(pl, 'minecraft:strength', 240, 0)
        eff(pl, 'minecraft:regeneration', 20, 1)
        if (!got) {
          console.warn(TAG + 'credit could not pay ' + pl.username + ' - NO DEBT WRITTEN')
          return
        }
        try { pl.persistentData.putInt(K_DEBT, 1) } catch (e) { }
        say(pl, 'deal_done')
        console.info(TAG + pl.username + ' took CREDIT - debt written')
      },
      onTimeout: function () { },
    })
  }

  // ⭐ COLLECTION. Not a raid - reckoning.js already does raids. This is the quiet
  // version: she turns up, and she is still pleasant about it.
  function evCollect(server, p) {
    if (!owes(p)) return false
    var x = null
    try { x = p.xpLevel } catch (e) { }
    if (x === null) return false

    var take = Math.min(x, 4)
    try { p.xpLevel = x - take } catch (e) { return false }
    try { p.persistentData.putInt(K_DEBT, 0) } catch (e) { }
    say(p, 'deal_done')
    console.info(TAG + p.username + ' settled a debt - took ' + take + ' levels')
    return true
  }

  // ⭐ THE SAMPLE. Free, and free is the point - it is how the first one always
  // works. Heaviest when she barely knows you.
  function evSample(server, p) {
    if (!eff(p, 'minecraft:speed', 120, 0)) return false
    eff(p, 'minecraft:night_vision', 200, 0)
    say(p, 'low_gift')
    return true
  }

  // ⭐ THE MARKUP. A bad trade, offered honestly, and only while your harness is
  // low. She is not cheating you - this IS her price for a stranger, and the way
  // out of it is to keep dealing.
  function evMarkup(server, p) {
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }
    var h = harness(p)
    if (h === null) return false

    return VELDORA.ritual.begin(p, {
      colour: '§6§l',
      lines: [
        line(p, 'deal_open') || 'Let\'s do a deal.',
        'Strangers pay more. That\'s not personal, it\'s just the rate.',
      ],
      options: [
        { label: 'Fine.', id: 'yes' },
        { label: 'Rob someone else.', id: 'no' },
      ],
      holdAfterChoice: 60,
      onChoose: function (pl, id) {
        if (id !== 'yes') { say(pl, 'deal_refused'); return }
        var x = null
        try { x = pl.xpLevel } catch (e) { }
        if (x === null || x < 3) { say(pl, 'deal_poor'); return }
        // Goods first.
        if (!eff(pl, 'minecraft:resistance', 300, 1)) return
        try { pl.xpLevel = x - 3 } catch (e) { }
        if (VELDORA.counter) VELDORA.counter.add(pl, GOD, 1, 'markup')
        say(pl, 'deal_done')
        console.info(TAG + pl.username + ' took the markup - 3 levels')
      },
      onTimeout: function () { },
    })
  }

  // ⭐ THE TIP-OFF. Only for good customers, and it costs nothing - which is the
  // most suspicious thing she does all game.
  function evTipoff(server, p) {
    var y = null
    try { y = Math.round(p.y) } catch (e) { }
    if (y === null) return false
    try {
      p.tell(Text.of('§6§l' + (line(p, 'guidance') || 'Deeper pays. I don\'t set the rates.')))
      p.tell(Text.of('§8She is not charging you for that. Note it.'))
    } catch (e) { return false }
    console.info(TAG + p.username + ' got a tip-off (free)')
    return true
  }

  // ⭐ INSURANCE. Pay now against a death later. The most honest thing in her
  // catalogue and the one that sounds least like it.
  var K_INSURED = 'veldora_salvage_insured'

  function evInsurance(server, p) {
    try { if ((p.persistentData.getInt(K_INSURED) || 0) > 0) return false } catch (e) { }
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }

    return VELDORA.ritual.begin(p, {
      colour: '§6§l',
      lines: [
        'You die a lot, friend. I mean that kindly.',
        'Give me something now and it hurts less next time.',
      ],
      options: [
        { label: 'Go on then.', id: 'yes' },
        { label: 'I\'ll manage.', id: 'no' },
      ],
      holdAfterChoice: 60,
      onChoose: function (pl, id) {
        if (id !== 'yes') { say(pl, 'deal_refused'); return }
        var h = null
        try { h = pl.foodData.foodLevel } catch (e) { }
        if (h === null || h < 6) { say(pl, 'deal_poor'); return }
        try { pl.persistentData.putInt(K_INSURED, 1) } catch (e) { return }
        try { pl.foodData.foodLevel = h - 6 } catch (e) { }
        if (VELDORA.counter) VELDORA.counter.add(pl, GOD, 1, 'insurance')
        say(pl, 'deal_done')
        console.info(TAG + pl.username + ' bought insurance')
      },
      onTimeout: function () { },
    })
  }

  // The policy pays out. She keeps her word - she always keeps her word.
  EntityEvents.death(function (event) {
    if (!GATE) return
    try {
      var p = event.entity
      if (!p || !p.player) return
      var path = ''
      try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || '' } catch (e) { return }
      if (path !== GOD) return
      var ins = 0
      try { ins = p.persistentData.getInt(K_INSURED) || 0 } catch (e) { }
      if (!ins) return
      try { p.persistentData.putInt(K_INSURED, 0) } catch (e) { }
      var srv = null
      try { srv = p.server } catch (e) { }
      if (!srv) return
      // After the world has said what happened.
      srv.scheduleInTicks(30, function () {
        try {
          p.tell(Text.of('§6§lTold you it would hurt less.'))
          eff(p, 'minecraft:resistance', 30, 2)
          eff(p, 'minecraft:regeneration', 15, 1)
        } catch (e) { }
      })
      console.info(TAG + p.username + ' died INSURED - policy paid out')
    } catch (err) { console.warn(TAG + 'insurance hook threw :: ' + err) }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // THE HARVEST - she collects, and she is sorry it came to this
  // ═══════════════════════════════════════════════════════════════════════════
  var HARVEST_SCENE = [
    'You have been such good custom, friend.',
    'But an account has to close eventually.',
    'I did tell you. I always tell you.',
    'Nothing personal. It never was.',
  ]

  function harvestArrive(server, p) {
    if (!VELDORA.spawner) return false
    try {
      if (VELDORA.ritual && VELDORA.ritual.active(p)) {
        console.info(TAG + 'Harvest held for ' + p.username + ' - already in a scene')
        return false
      }
    } catch (e) { }

    var opened = false
    if (VELDORA.ritual && typeof VELDORA.ritual.begin === 'function') {
      opened = VELDORA.ritual.begin(p, {
        colour: '§6§l', lines: HARVEST_SCENE, options: [],
      })
    }
    var sceneEnd = opened ? (20 + (HARVEST_SCENE.length * 50) + 40) : 0
    var spawnAt = sceneEnd + 40

    server.scheduleInTicks(spawnAt, function () {
      var r = VELDORA.spawner.wave(p, {
        ids: [ACTOR], count: 1, minDist: 12, maxDist: 20,
        nbt: '{Tags:["' + ACTOR_TAG + '","' + HARVEST_TAG + '"],CustomNameVisible:1b,' +
          'CustomName:' + Q + '{"text":"The Collector","color":"gold","bold":true}' + Q + '}',
      })
      if (!r || r.placed === 0) {
        console.error(TAG + '!! Harvest FAILED to place for ' + p.username +
          ' - releasing the lock so the sweep retries')
        try { p.persistentData.putString('veldora_harvest_active', '') } catch (e) { }
      }
    })
    console.info(TAG + 'Harvest scene opened for ' + p.username +
      ' - the Collector arrives at ' + spawnAt + 't')
    return true
  }

  function harvestWin(server, p) {
    server.scheduleInTicks(20, function () {
      try { say(p, 'harvest_won') } catch (e) { }
    })
    server.scheduleInTicks(140, function () {
      try {
        if (VELDORA.paths && typeof VELDORA.paths.release === 'function') {
          VELDORA.paths.release(server, p)
        } else {
          console.error(TAG + '!! cannot release ' + p.username +
            ' - VELDORA.paths.release is missing. They WON and are still bound.')
        }
      } catch (e) { console.error(TAG + 'release threw :: ' + e) }
    })
    console.info(TAG + p.username + ' WON her Harvest - releasing in 140t')
  }

  function harvestLose(server, p) {
    server.scheduleInTicks(20, function () { try { say(p, 'harvest_lost') } catch (e) { } })
  }

  function hasTag(e, tag) {
    try {
      var tags = e.tags
      if (!tags) return false
      return tags.contains ? tags.contains(tag) : (String(tags).indexOf(tag) >= 0)
    } catch (x) { return false }
  }

  EntityEvents.death(function (event) {
    try {
      var v = event.entity
      if (!v || v.player) return
      if (!hasTag(v, HARVEST_TAG)) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      if (VELDORA.harvest) VELDORA.harvest.resolve(killer.server, killer, true)
    } catch (e) { }
  })

  EntityEvents.death(function (event) {
    try {
      var v = event.entity
      if (!v || !v.player) return
      if (!VELDORA.harvest || !VELDORA.harvest.active(v)) return
      var path = ''
      try { if (VELDORA.paths) path = VELDORA.paths.pathOf(v) || '' } catch (x) { }
      if (path !== GOD) return
      VELDORA.harvest.resolve(v.server, v, false)
    } catch (e) { }
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('harness').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var n = null
      try { if (VELDORA.counter) n = VELDORA.counter.get(p, GOD) } catch (e) { }
      var h = harness(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6§lHARNESS §f' + (n === null ? 'UNREADABLE' : n) + ' §8deals struck'))
      if (h === null) {
        p.tell(Text.of('§cunreadable - she will fall back to the middle rate'))
      } else {
        var bar = ''
        for (var b = 0; b < 20; b++) bar += (b < Math.round(h * 20)) ? '§a|' : '§c|'
        p.tell(Text.of('§8bad terms ' + bar + ' §8good terms'))
        var pm = VELDORA.salvage ? VELDORA.salvage.priceMul(p) : 1
        var ym = VELDORA.salvage ? VELDORA.salvage.payMul(p) : 1
        p.tell(Text.of('§8you pay §f' + (Math.round(pm * 100) / 100) +
          'x§8 and receive §f' + (Math.round(ym * 100) / 100) + 'x'))
      }
      p.tell(Text.of('§8tab: §f' + (owes(p) ? 'OWING' : 'clear') +
        ' §8· insured: §f' + ((function () { try { return (p.persistentData.getInt(K_INSURED) || 0) > 0 } catch (e) { return '?' } })() ? 'yes' : 'no')))
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF'); return }
    if (!VELDORA.events) { console.error(TAG + 'godevents.js missing'); return }
    var ALL = ['low', 'medium', 'high']

    VELDORA.events.register(GOD, {
      id: 'deal', run: evDeal, hostile: false, cooldown: 1, weight: wAlways(5), tiers: ALL,
      does: 'TRADE - opens her counter (salvage.js): hunger, levels or sight. Terms ' +
        'scale with harness',
    })
    VELDORA.events.register(GOD, {
      id: 'credit', run: evCredit, hostile: false, cooldown: 2, weight: wAlways(3), tiers: ALL,
      does: 'TRADE - strength now, a real debt written. One tab at a time',
    })
    VELDORA.events.register(GOD, {
      id: 'collect', run: evCollect, hostile: false, cooldown: 1, weight: wAlways(4), tiers: ALL,
      does: 'COLLECTS an outstanding debt - takes up to 4 levels. Only fires if you owe',
    })
    VELDORA.events.register(GOD, {
      id: 'sample', run: evSample, hostile: false, cooldown: 2, weight: wPoor(4), tiers: ALL,
      does: 'FREE - speed + night vision, no cost. The first one always is. Heaviest ' +
        'at low harness',
    })
    VELDORA.events.register(GOD, {
      id: 'markup', run: evMarkup, hostile: false, cooldown: 2, weight: wPoor(3), tiers: ALL,
      does: 'TRADE - resistance for 3 levels, openly a bad rate. Low harness only. ' +
        'She is not cheating; that IS the stranger price',
    })
    VELDORA.events.register(GOD, {
      id: 'tipoff', run: evTipoff, hostile: false, cooldown: 2, weight: wRich(3), tiers: ALL,
      does: 'FREE - a guidance line at no cost. Good customers only, which makes it ' +
        'the most suspicious thing she does',
    })
    VELDORA.events.register(GOD, {
      id: 'insurance', run: evInsurance, hostile: false, cooldown: 4, weight: wRich(3), tiers: ALL,
      does: 'TRADE - 6 hunger now, and your NEXT death pays out resistance III + ' +
        'regeneration. She always keeps her word',
    })

    if (VELDORA.harvest) {
      VELDORA.harvest.register(GOD, {
        arrive: harvestArrive, onWin: harvestWin, onLose: harvestLose, tag: ACTOR_TAG,
      })
    } else console.error(TAG + 'harvest.js missing - her Harvest will not arrive')

    console.info(TAG + 'The Hound - 7 events, mostly trades. HARNESS scales the ' +
      'TERMS, not the odds: bad rates when she barely knows you, good rates when ' +
      'you are worth keeping. Every option label is a decision, never a price.')
  })
})();
