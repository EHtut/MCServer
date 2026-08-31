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
  // ⛔ SALVAGE IS OFF. Ethan, 2026-08-30: *"lets disable salvage aswell. it will need a
  // complete repass and not this session."*
  //
  // 🔴 THIS GATE WAS STILL `true` ON THE LIVE SERVER and she reached out within minutes of
  // the new world - the ruling was made and never landed in the code. She comes back when
  // the repass happens, not before.
  var GATE = false

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

  // ── the release streak ────────────────────────────────────────────────────
  // ⭐ THREE REFUSALS IN A ROW AND SHE IS DONE (Ethan, 2026-08-16). Every one of
  // her offers routes through these two, so there is one place to be wrong instead
  // of three, and adding a fourth offer is one line rather than a decision.
  //
  // ⚠️ They return FALSY on purpose. Each call site uses `return deny(...)` inside
  // an onChoose whose return value is discarded - so this stays a one-liner without
  // changing what any of them return to the ritual.
  function deny(p, what) {
    try {
      var srv = null
      try { srv = p.server } catch (e) { }
      if (VELDORA.release) VELDORA.release.denied(srv, p, GOD, what)
      else console.warn(TAG + 'release.js missing - refusing ' + what + ' counts for NOTHING')
    } catch (e) { console.warn(TAG + 'deny threw :: ' + e) }
    return false
  }

  // Forgiveness lands on the CHOICE, not the outcome - a player who said yes and
  // was too poor to pay did not refuse her.
  function accept(p, what) {
    try {
      var srv = null
      try { srv = p.server } catch (e) { }
      if (VELDORA.release) VELDORA.release.accepted(srv, p, GOD, what)
    } catch (e) { console.warn(TAG + 'accept threw :: ' + e) }
    return false
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 THREE OF HER EVENTS BREAK HER OWN RULE, AND ARE LEFT UNTAGGED TO SAY SO.
  //
  // Ethan, 2026-08-16: "She will never do anything without the player's permission."
  // Her chart proves he means it - every FORCED row is blank and every CHOICE row is
  // filled. She is the only god in the pantheon who cannot act ON you.
  //
  // But `collect`, `sample` and `tipoff` were written before that rule existed and
  // none of them asks:
  //
  //   collect   TAKES 4 LEVELS to settle a debt. No prompt. The sharpest violation,
  //             and the hardest to fix, because a debt you can decline is not a debt
  //             - her whole credit loop leans on this one being non-optional.
  //   sample    a free buff, unasked. "The first one's free" is perfect dealer
  //             behaviour and still technically something done TO you.
  //   tipoff    a free guidance line. Arguably not an action at all - she is only
  //             talking - so this may belong in her idle pools rather than as an event.
  //
  // ⚠️ THEY ARE DELIBERATELY LEFT WITHOUT A `kind:`. Tagging `sample` as a Buff would
  // have set its band to 0 and killed it silently, which is the exact failure this
  // project keeps paying for. Untagged, they land in `misc` at the lowest band - they
  // still fire, and godevents WARNS about them by name at every boot until they are
  // ruled on. Loud and alive beats quiet and dead.
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ HER FOUR RATED-BUT-EMPTY ROWS.  docs/23 §VI.0, built 2026-08-16.
  //
  //     Duels     ++    `bounty`     a fight she OFFERS, and pays for
  //     Attacks   +++   `sabotage`   she makes somebody else's evening worse
  //     Support   +     `favour`     ⭐ she HELPS another player, at YOUR cost
  //     Contracts +++   `commission` a kill order, on the shared killorder.js
  //
  // Every one is a ritual with a yes and a no, because her whole column is the
  // choice half of the taxonomy - "She will never do anything without the player's
  // permission." There is no forced branch anywhere in this block, by construction.
  //
  // 🚨 PRICES ARE LIVE RESOURCES - hunger, levels, sight. NEVER inventory. That is
  // PART V's rule and Ethan's "we don't take items from players, that is how you
  // cause them to quit". And the price is charged AFTER the goods exist, every time,
  // because the reverse order is how a player pays for nothing.
  //
  // ⚠️ Labels are decisions, never prices. "Go on then." and never "Pay 4 levels."
  // She does not volunteer the total and she never technically lies.
  //
  // Lines ship written (Ethan authorised drafts 2026-08-16, loop: he plays, anything
  // that does not fit comes back as "here's a better line"). Voice rules applied:
  // SHORT, contractions, trade vocabulary, three sentences maximum, jokes as
  // deflection, and never the words chosen / destiny / fate.
  // ═══════════════════════════════════════════════════════════════════════════

  function offer(p, tag, yesLabel, noLabel, onYes) {
    var l = line(p, tag)
    if (!l) { console.info(TAG + tag + ' HELD - no lines yet'); return false }
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }
    return VELDORA.ritual.begin(p, {
      colour: '§6§l',
      lines: [l],
      options: [{ id: 'yes', label: yesLabel }, { id: 'no', label: noLabel }],
      holdAfterChoice: 60,
      onChoose: function (pl, id) {
        if (id !== 'yes') { say(pl, 'deal_refused'); return deny(pl, tag) }
        accept(pl, tag)
        try { onYes(pl) } catch (e) { console.warn(TAG + tag + ' onYes threw :: ' + e) }
      },
      onTimeout: function (pl) {
        try {
          var srv = null
          try { srv = pl.server } catch (e) { }
          if (VELDORA.release) VELDORA.release.ignored(srv, pl, GOD, tag)
        } catch (e) { }
      },
    })
  }

  // ── DUELS (++) — a fight she offers, and pays for ─────────────────────────
  // She does not test you. She has a buyer. That is the only reason she would ever
  // point you at something, and it is why this is a job rather than a trial.
  var BOUNTY_ACTOR = 'born_in_chaos_v1:fallen_chaos_knight'
  var BOUNTY_TAG = 'veldora_salvage_bounty'

  function evBounty(server, p) {
    if (!VELDORA.spawner) return false
    return offer(p, 'bounty_offer', 'Where.', 'Not today.', function (pl) {
      var r = VELDORA.spawner.wave(pl, {
        ids: [BOUNTY_ACTOR], count: 1, minDist: 10, maxDist: 18,
        nbt: '{Tags:["' + BOUNTY_TAG + '"],CustomNameVisible:1b,CustomName:' + Q +
          '{"text":"The Job","color":"gold","bold":true}' + Q + '}',
      })
      if (!VELDORA.spawner.issued(r)) {
        console.warn(TAG + 'bounty REFUSED by the spawner for ' + pl.username)
        return
      }
      try { pl.persistentData.putInt('veldora_salvage_bounty_open', 1) } catch (e) { }
      console.info(TAG + pl.username + ' took the bounty')
    })
  }

  // Paid on the kill. A choice always pays - and hers pays in the only currency she
  // has that is not an item: levels back, more than the fight cost you.
  EntityEvents.death(function (event) {
    try {
      var e = event.entity
      if (!e || e.player) return
      var tags = null
      try { tags = e.tags } catch (x) { return }
      var has = false
      try { has = tags && (tags.contains ? tags.contains(BOUNTY_TAG) : (String(tags).indexOf(BOUNTY_TAG) >= 0)) } catch (x) { return }
      if (!has) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      var open = 0
      try { open = killer.persistentData.getInt('veldora_salvage_bounty_open') || 0 } catch (x) { }
      if (!open) return
      try { killer.persistentData.putInt('veldora_salvage_bounty_open', 0) } catch (x) { }
      try { killer.xpLevel = (killer.xpLevel || 0) + 5 } catch (x) { }
      if (VELDORA.counter) VELDORA.counter.add(killer, GOD, 1, 'bounty')
      say(killer, 'bounty_paid')
      console.info(TAG + killer.username + ' collected the bounty - 5 levels')
    } catch (err) { console.warn(TAG + 'bounty hook threw :: ' + err) }
  })

  // ── ATTACKS (+++) — she makes somebody else's evening worse, for a price ──
  function evSabotage(server, p) {
    var target = nearestOther(server, p)
    if (!target) return false
    return offer(p, 'sabotage_offer', 'Do it.', 'Leave them.', function (pl) {
      var h = null
      try { h = pl.foodData.foodLevel } catch (e) { }
      if (h === null || h < 4) { say(pl, 'deal_poor'); return }
      // Goods first, then the price. Always this order.
      eff(target, 'minecraft:slowness', 15, 1)
      eff(target, 'minecraft:mining_fatigue', 30, 1)
      try { pl.foodData.foodLevel = h - 4 } catch (e) { }
      if (VELDORA.counter) VELDORA.counter.add(pl, GOD, 1, 'sabotage')
      say(pl, 'deal_done')
      console.info(TAG + pl.username + ' paid 4 hunger to slow ' + target.username)
    })
  }

  // ── SUPPORT (+) — ⭐ the first time any god has HELPED another player ──────
  // No other patron has a single event that benefits somebody who is not their own
  // champion. Hers costs YOU and helps THEM, which is the whole of her: she wants
  // people to survive, and she will still charge for it.
  function evFavour(server, p) {
    var target = nearestOther(server, p)
    if (!target) return false
    return offer(p, 'favour_offer', 'Yeah, go on.', 'Their problem.', function (pl) {
      var x = null
      try { x = pl.xpLevel } catch (e) { }
      if (x === null || x < 3) { say(pl, 'deal_poor'); return }
      eff(target, 'minecraft:regeneration', 20, 1)
      eff(target, 'minecraft:absorption', 120, 1)
      try { pl.xpLevel = x - 3 } catch (e) { }
      if (VELDORA.counter) VELDORA.counter.add(pl, GOD, 1, 'favour')
      say(pl, 'favour_done')
      try { if (VELDORA.voice) VELDORA.voice.say(target, GOD, 'favour_told') } catch (e) { }
      console.info(TAG + pl.username + ' paid 3 levels to heal ' + target.username)
    })
  }

  // ── CONTRACTS (+++) — on the shared killorder.js ──────────────────────────
  function evCommission(server, p) {
    if (!VELDORA.killorder) { console.error(TAG + 'killorder.js missing'); return false }
    if (VELDORA.killorder.held(p, GOD)) return false
    var target = nearestOther(server, p)
    if (!target) return false
    var tname = '?'
    try { tname = String(target.username) } catch (e) { return false }
    var l = line(p, 'commission_offer')
    if (!l) { console.info(TAG + 'commission HELD - no lines yet'); return false }
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') return false
    try { if (VELDORA.ritual.active(p)) return false } catch (e) { return false }

    return VELDORA.ritual.begin(p, {
      colour: '§6§l',
      lines: [l.split('{target}').join(tname)],
      options: [{ id: 'yes', label: 'What\'s it pay.' }, { id: 'no', label: 'Pass.' }],
      holdAfterChoice: 60,
      onChoose: function (pl, id) {
        if (id !== 'yes') { say(pl, 'deal_refused'); return deny(pl, 'commission') }
        accept(pl, 'commission')
        VELDORA.killorder.open(pl.server, pl, GOD, tname)
      },
      onTimeout: function () { },
    })
  }

  // Any player who is not you. ⚠️ PROXIMITY, per Ethan's ruling 2026-08-16 - not
  // inter-god stance. She does not care whose champion they are; they are simply
  // the person standing there.
  function nearestOther(server, me) {
    var best = null, bestD = 64 * 64
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        try { if (String(p.uuid) === String(me.uuid)) continue } catch (e) { continue }
        var dx = p.x - me.x, dy = p.y - me.y, dz = p.z - me.z
        var d2 = dx * dx + dy * dy + dz * dz
        if (d2 <= bestD) { bestD = d2; best = p }
      }
    } catch (e) { }
    return best
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
        if (id !== 'yes') { say(pl, 'deal_refused'); return deny(pl, 'credit') }
        accept(pl, 'credit')
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
      // A timeout is NOT a refusal - see salvage.js's counter for the argument.
      // Logged so the rate is visible, never counted toward the release streak.
      onTimeout: function (pl) {
        try {
          var srv = null
          try { srv = pl.server } catch (e) { }
          if (VELDORA.release) VELDORA.release.ignored(srv, pl, GOD, 'offer')
        } catch (e) { }
      },
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
        if (id !== 'yes') { say(pl, 'deal_refused'); return deny(pl, 'markup') }
        accept(pl, 'markup')
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
      // A timeout is NOT a refusal - see salvage.js's counter for the argument.
      // Logged so the rate is visible, never counted toward the release streak.
      onTimeout: function (pl) {
        try {
          var srv = null
          try { srv = pl.server } catch (e) { }
          if (VELDORA.release) VELDORA.release.ignored(srv, pl, GOD, 'offer')
        } catch (e) { }
      },
    })
  }

  // ⭐ THE TIP-OFF. Only for good customers, and it costs nothing - which is the
  // most suspicious thing she does all game.
  function evTipoff(server, p) {
    var y = null
    try { y = Math.round(p.y) } catch (e) { }
    if (y === null) return false
    try {
      VELDORA.voice.chat(p, '§6§l' + (line(p, 'guidance') || "Deeper pays. I don't set the rates."))
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
        if (id !== 'yes') { say(pl, 'deal_refused'); return deny(pl, 'insurance') }
        accept(pl, 'insurance')
        var h = null
        try { h = pl.foodData.foodLevel } catch (e) { }
        if (h === null || h < 6) { say(pl, 'deal_poor'); return }
        try { pl.persistentData.putInt(K_INSURED, 1) } catch (e) { return }
        try { pl.foodData.foodLevel = h - 6 } catch (e) { }
        if (VELDORA.counter) VELDORA.counter.add(pl, GOD, 1, 'insurance')
        say(pl, 'deal_done')
        console.info(TAG + pl.username + ' bought insurance')
      },
      // A timeout is NOT a refusal - see salvage.js's counter for the argument.
      // Logged so the rate is visible, never counted toward the release streak.
      onTimeout: function (pl) {
        try {
          var srv = null
          try { srv = pl.server } catch (e) { }
          if (VELDORA.release) VELDORA.release.ignored(srv, pl, GOD, 'offer')
        } catch (e) { }
      },
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
          VELDORA.voice.chat(p, '§6§lTold you it would hurt less.')
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
      }, function (placed) {
        // ⚠️ THE OTHER HALF, AND THE HALF THAT USED TO BE UNREACHABLE. This tested
        // r.placed synchronously, where placed is ALWAYS null - so the rescue for a
        // player sealed in a broken Harvest could never fire. Fixed 2026-08-16.
        if (placed !== 0) return
        console.error(TAG + '!! Harvest champion did not ARRIVE for ' + p.username +
          ' - releasing the lock so the sweep retries')
        try { p.persistentData.putString('veldora_harvest_active', '') } catch (e) { }
      })
      if (!VELDORA.spawner.issued(r)) {
        console.error(TAG + '!! Harvest was REFUSED by the spawner for ' + p.username +
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

    // 🚨 NO VOICE, NO EVENTS. Her pools are empty until Ethan writes them, and an
    // event that fires with nothing to say is worse than one that never fires.
    // Reads the count published at script-eval time, never the voice registry -
    // that fills in a `loaded` handler which runs AFTER this one.
    var written = 0
    try { if (VELDORA.salvage_voice) written = VELDORA.salvage_voice.written || 0 } catch (e) { }
    try { if (!written && VELDORA[GOD]) written = VELDORA[GOD].written || 0 } catch (e) { }
    if (!written) {
      console.warn(TAG + 'HELD - The Hound has no written lines yet. Her trades in ' +
        'salvage.js still work (they carry their own text); her EVENTS do not ' +
        'register. Fill the pools in salvage_voice.js and restart.')
      return
    }

    var ALL = ['low', 'medium', 'high']

    VELDORA.events.register(GOD, {
      id: 'deal', kind: 'boon', scene: true, run: evDeal, hostile: false, cooldown: 1, weight: wAlways(5), tiers: ALL,
      does: 'TRADE - opens her counter (salvage.js): hunger, levels or sight. Terms ' +
        'scale with harness',
    })
    VELDORA.events.register(GOD, {
      id: 'credit', kind: 'boon', scene: true, run: evCredit, hostile: false, cooldown: 2, weight: wAlways(3), tiers: ALL,
      does: 'TRADE - strength now, a real debt written. One tab at a time',
    })
    VELDORA.events.register(GOD, {
      // ⭐ `attack` - RULED by Ethan 2026-08-24. Her chart is duel:2, boon:4,
      // attack:3, support:1, contract:3, and `attack` is the ONLY kind in it where
      // she acts ON the player unasked. Every other kind she has is either a gift
      // (boon/support) or an ask (duel/contract); collecting a debt is neither, and
      // it is the one thing she does that the player cannot decline.
      id: 'collect', kind: 'attack', run: evCollect, hostile: false, cooldown: 1, weight: wAlways(4), tiers: ALL,
      does: 'COLLECTS an outstanding debt - takes up to 4 levels. Only fires if you owe',
    })
    VELDORA.events.register(GOD, {
      // ⭐ `boon` - a free buff at no cost is the definition of one, and boon is her
      // heaviest weight (4), which suits a trader whose generosity IS the hook.
      id: 'sample', kind: 'boon', run: evSample, hostile: false, cooldown: 2, weight: wPoor(4), tiers: ALL,
      does: 'FREE - speed + night vision, no cost. The first one always is. Heaviest ' +
        'at low harness',
    })
    VELDORA.events.register(GOD, {
      id: 'markup', kind: 'boon', scene: true, run: evMarkup, hostile: false, cooldown: 2, weight: wPoor(3), tiers: ALL,
      does: 'TRADE - resistance for 3 levels, openly a bad rate. Low harness only. ' +
        'She is not cheating; that IS the stranger price',
    })
    VELDORA.events.register(GOD, {
      // ⭐ `boon` too. `support` was the alternative - it would keep this rare at
      // weight 1 - but support in this pack means helping a RIVAL (forge/lend), and
      // a free tip is a gift to YOU. Its own wRich(3) weight already gates it to good
      // customers, so scarcity did not need the kind to enforce it.
      id: 'tipoff', kind: 'boon', run: evTipoff, hostile: false, cooldown: 2, weight: wRich(3), tiers: ALL,
      does: 'FREE - a guidance line at no cost. Good customers only, which makes it ' +
        'the most suspicious thing she does',
    })
    VELDORA.events.register(GOD, {
      id: 'insurance', kind: 'boon', scene: true, run: evInsurance, hostile: false, cooldown: 4, weight: wRich(3), tiers: ALL,
      does: 'TRADE - 6 hunger now, and your NEXT death pays out resistance III + ' +
        'regeneration. She always keeps her word',
    })

    // ── the four rows her chart rated and she had nothing in ────────────────
    VELDORA.events.register(GOD, {
      id: 'bounty', kind: 'duel', scene: true, run: evBounty,
      hostile: true, cooldown: 3, weight: wAlways(2), tiers: ALL,
      does: 'DUEL (choice) - she OFFERS one strong opponent because she has a buyer. ' +
        'Kill it and she pays 5 levels. A job, never a test',
    })
    VELDORA.events.register(GOD, {
      id: 'sabotage', kind: 'attack', scene: true, run: evSabotage,
      hostile: false, cooldown: 3, weight: wRich(3), tiers: ALL,
      does: 'ATTACK (choice) - slowness + mining fatigue on the nearest other player, ' +
        'and it costs YOU 4 hunger. She will not do it unasked',
    })
    VELDORA.events.register(GOD, {
      id: 'favour', kind: 'support', scene: true, run: evFavour,
      hostile: false, cooldown: 4, weight: wAlways(1), tiers: ALL,
      does: '⭐ SUPPORT (choice) - regeneration + absorption on ANOTHER player, paid ' +
        'for with 3 of YOUR levels. The only event in the game that helps somebody ' +
        'who is not the caster',
    })
    VELDORA.events.register(GOD, {
      id: 'commission', kind: 'contract', scene: true, run: evCommission,
      hostile: false, cooldown: 5, weight: wRich(3), tiers: ALL,
      does: 'CONTRACT (choice) - a kill order on the nearest other player, held by ' +
        'the shared killorder.js. Settling it pays levels and raises harness',
    })

    // Her half of the shared kill order. She settles in her own currency: levels
    // back, and a better rate forever after - which is the only reward she has that
    // is not an item.
    if (VELDORA.killorder) {
      VELDORA.killorder.register(GOD, {
        days: 3,
        onSettle: function (p) {
          try { p.xpLevel = (p.xpLevel || 0) + 8 } catch (e) { }
          if (VELDORA.counter) VELDORA.counter.add(p, GOD, 2, 'commission settled')
          say(p, 'commission_paid')
        },
        onLapse: function (p) { say(p, 'commission_lapsed') },
      })
    } else console.error(TAG + 'killorder.js missing - her commission cannot resolve')

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
