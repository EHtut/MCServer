// salvage_deals.js — she offers the godless a deal. All of them suck. Accept five.
//
// `docs/67`: *"She randomly offers godless players deals. All of them suck. Accept 5 —
// you keep saying yes to bad terms. That is how she gets everyone."*
//
// Ethan, 2026-08-29, giving the shape:
//     "I have a deal for you, give me something of yours and I shall grant you the world
//      Take it's hand - You die
//      Reject - Nothing
//      After acception: You hear the laughter of a distant god (action bar)"
//
// ── 🔑 THE JOKE IS THE MECHANIC ────────────────────────────────────────────────
// She promises **the world** and delivers **nothing**. Not a bad rate - NOTHING. The
// laughter afterwards is the only thing you are ever paid, and it is not hers.
//
// ⭐ REFUSING COSTS NOTHING AT ALL. No counter, no grudge, no cooldown penalty. That
// is what makes accepting a real choice rather than a toll: the door out is free and
// wide open every single time, and you walked through the other one anyway.
//
// ── ⭐ THE PROBLEM THIS FILE HAD TO SOLVE ──────────────────────────────────────
// `docs/68`: *"the hardest writing in the plan. They have to convince five times
// against a reader who is getting suspicious."*
//
// 🔑 SO SHE STOPS TRYING. The pitch pool is keyed to how many you have already taken,
// and she gets MORE HONEST as the count climbs - because she does not need to sell to
// somebody who keeps saying yes. By the fifth she is barely pretending, and that is
// funnier and worse than a fifth lie would have been. A reader getting suspicious is
// not an obstacle to write around; it is the thing the escalation is FOR.
//
// ⚠️ ALL PITCH TEXT IS [CLAUDE-DRAFT] - see the register below. Ethan wrote the shape
// and the laughter line; the ten pitches are scaffolding and are marked as such.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[deals] '
  var GATE = true
  var GOD = 'salvage'
  var COLOUR = '§6§l'

  // ⭐ FIVE. `docs/67`, and it is the whole condition.
  var CHOSEN_AT = 5

  // ⚠️ ITS OWN KEY, never reset - the same trap E1 documented. Her trust counter can
  // be zeroed by `/counters clear`; a lifetime condition cannot ride it.
  var K_TAKEN = 'veldora_deals_taken'
  var K_LAST = 'veldora_deals_last'      // tick stamp, so she is not constant

  var COOLDOWN = 24000 * 1              // ~1 in-game day between offers
  var SWEEP = 600                       // 30s
  var CHANCE = 0.12                     // per sweep, once eligible

  // ── ETHAN'S LINE. Verbatim, and it is the only thing you are ever paid. ──────
  var LAUGHTER = 'You hear the laughter of a distant god'

  // ═══════════════════════════════════════════════════════════════════════════
  // THE DEALS
  //
  // [CLAUDE-DRAFT] salvage/deal_pitch · salvage/deal_taken · salvage/deal_refused
  //
  // Her rules, applied: SHORT · contractions · trade vocabulary · NEVER more than
  // three sentences · jokes are deflection · never the words chosen, destiny or fate
  // except to take the piss out of them.
  //
  // ⚠️ FOUR COSTS ONLY, and they are Ethan's: life, hunger, levels, or a terrible
  // debuff. 🚨 NOT ITEMS - his standing rule: *"we don't take items from players, that
  // is how you cause them to quit."* Nothing here touches an inventory.
  // ═══════════════════════════════════════════════════════════════════════════
  var DEALS = [
    // ── tier 0: she is selling. Warm, plausible, almost generous. ─────────────
    { id: 'hand', cost: 'life', tier: 0,
      pitch: "I have a deal for you. Give me something of yours, and I'll give you the world.",
      yes: "Take her hand.",
      after: "There it is. The whole world, and you in it." },

    { id: 'appetite', cost: 'hunger', tier: 0,
      pitch: "You're carrying more appetite than you need. I'll take the surplus and we'll call it a favour.",
      yes: "Hand it over.",
      after: "Lighter already. That's the feeling of a good margin." },

    { id: 'seedmoney', cost: 'levels', tier: 0,
      pitch: "Everything worth having starts as seed money. Yours is sitting in your pocket doing nothing.",
      yes: "Invest it.",
      after: "Invested. I'd give it a while before you check on it." },

    // ── tier 1: she has stopped bothering with the pitch. ─────────────────────
    { id: 'shortweight', cost: 'levels', tier: 1,
      pitch: "Same offer. You already know the terms, so I'll skip the part where I dress it up.",
      yes: "Same again.",
      after: "Same again. You're an easy customer and I mean that kindly." },

    { id: 'thirsty', cost: 'hunger', tier: 1,
      pitch: "You want this one. I can tell, and it's the only reason I'm still standing here.",
      yes: "I want it.",
      after: "Knew it. That's twice I didn't have to try." },

    { id: 'legwork', cost: 'debuff', tier: 1,
      pitch: "This one costs you comfort rather than anything you'd miss. Comfort's the cheapest thing you own.",
      yes: "Take the comfort.",
      after: "Comfort's gone. You'll notice in about a minute." },

    // ── tier 2: honest, and it changes nothing. ───────────────────────────────
    { id: 'plainly', cost: 'debuff', tier: 2,
      pitch: "I'll be plain, since plain doesn't seem to cost me anything with you. This is a bad buy.",
      yes: "Buy it anyway.",
      after: "You bought it anyway. I did tell you." },

    { id: 'nothing', cost: 'levels', tier: 2,
      pitch: "There's no upside. There never was one. Say yes.",
      yes: "Yes.",
      after: "Yes. Every time." },

    // ── tier 3: she is not even in the room any more. ─────────────────────────
    { id: 'ledger', cost: 'hunger', tier: 3,
      pitch: "I've stopped writing these down. You'd take a blank page.",
      yes: "Take it.",
      after: "Blank page. Signed." },

    { id: 'lasthand', cost: 'life', tier: 3,
      pitch: "Last one's the same as the first. Give me something of yours, and I'll give you the world.",
      yes: "Take her hand.",
      after: "The world. As promised." },
  ]

  // ── the counter ──────────────────────────────────────────────────────────────
  function taken(p) {
    try {
      var v = p.persistentData.getInt(K_TAKEN)
      return (typeof v === 'number' && isFinite(v) && v > 0) ? v : 0
    } catch (e) { return 0 }
  }

  function bumpTaken(p) {
    var n = taken(p) + 1
    try { p.persistentData.putInt(K_TAKEN, n) } catch (e) { }
    if (n === CHOSEN_AT) {
      console.info(TAG + p.username + ' has taken ' + n + ' bad deals - SHE HAS HIM. ' +
        'Salvage unlocks on the next chosen sweep.')
    }
    return n
  }

  // Which tier she is speaking from. ⭐ She gets more honest as the count climbs.
  function tierFor(p) {
    var n = taken(p)
    if (n <= 0) return 0
    if (n <= 2) return 0
    if (n === 3) return 1
    if (n === 4) return 2
    return 3
  }

  function dealFor(p) {
    var want = tierFor(p)
    var pool = []
    var i
    for (i = 0; i < DEALS.length; i++) if (DEALS[i].tier === want) pool.push(DEALS[i])
    // ⚠️ A tier with nothing in it must fall back rather than return null - an empty
    // pool would silently stop offering, and a condition that stops being offered is
    // indistinguishable from a player who stopped saying yes.
    if (!pool.length) pool = DEALS
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // ── the costs ────────────────────────────────────────────────────────────────
  // 🚨 NOT ONE OF THESE TOUCHES AN INVENTORY. Ethan's standing rule.
  function eff(p, id, secs, amp) {
    try { p.potionEffects.add(id, secs * 20, amp || 0, false, false); return true }
    catch (e) { console.warn(TAG + 'effect ' + id + ' threw :: ' + e); return false }
  }

  function charge(server, p, cost) {
    try {
      if (cost === 'life') {
        // ⚠️ "Take it's hand - You die." His words, and it is the harshest cost in the
        // game - death ALSO costs 5 levels via death_cost.js, so a life deal is really
        // two prices. That is arguably correct for "all of them suck", but it is a
        // double charge and it is recorded here rather than discovered later.
        try { p.setHealth(0.0); return true } catch (e) { }
        try { server.runCommandSilent('kill ' + p.username); return true } catch (e2) { }
        return false
      }
      if (cost === 'hunger') {
        // Emptied, not dented. She said surplus; she meant all of it.
        try { p.foodLevel = 0 } catch (e) {
          try { server.runCommandSilent('effect give ' + p.username + ' minecraft:hunger 60 4 true') } catch (e2) { return false }
        }
        return true
      }
      if (cost === 'levels') {
        // ⚠️ Everything, not a slice. A partial levy would read as a fee; taking the
        // lot is the only version that matches "there's no upside".
        try { server.runCommandSilent('xp set ' + p.username + ' 0 levels'); return true }
        catch (e) { return false }
      }
      if (cost === 'debuff') {
        // "Terrible", per Ethan. Long, stacked, and genuinely unpleasant - but NOT
        // blindness: ritual.js already owns the dark and a leftover blind is the one
        // bug that file's header warns about at length.
        var okd = eff(p, 'minecraft:slowness', 180, 2)
        eff(p, 'minecraft:mining_fatigue', 180, 2)
        eff(p, 'minecraft:weakness', 180, 1)
        return okd
      }
    } catch (e) { console.warn(TAG + 'charge threw :: ' + e) }
    return false
  }

  // ── the offer ────────────────────────────────────────────────────────────────
  // ⚠️ `pathOf`, not `of`. Checked against paths.js:598 and the four call sites in
  // chosen.js rather than guessed - a wrong accessor here reads as undefined instead
  // of throwing, so she would simply have offered nobody a deal, forever, silently.
  //
  // Returns TRUE (godless), FALSE (has a path), or NULL (could not read). The caller
  // treats null as "do not offer", because offering a pathed player is worse than
  // offering nobody.
  // ⚠️ `typeof path !== 'string'` rather than `path || ''`. The first version wrote the
  // latter, which turns undefined into '' and therefore into GODLESS - the exact
  // failure the comment above claims to prevent. The harness caught it.
  //
  // 🔴 AND THERE IS A REAL ONE UPSTREAM, LEFT ALONE ON PURPOSE. paths.js:481 reads
  // `return player.persistentData.getString(KEY) || ''` inside a try whose catch ALSO
  // returns ''. So a genuine storage failure is indistinguishable from "this player
  // has no god" - "I failed" and "I found nothing" share a return value. It predates
  // this file and has four other call sites, so fixing it here would be a silent
  // change to how every one of them behaves. Filed, not patched.
  //
  // ⭐ It matters more now than it did: she offers deals to the GODLESS, so on a
  // storage glitch she would offer them to everybody.
  function pathless(p) {
    try {
      if (VELDORA.paths && typeof VELDORA.paths.pathOf === 'function') {
        var path = VELDORA.paths.pathOf(p)
        if (typeof path !== 'string') return null      // unreadable, NOT godless
        return path === ''
      }
    } catch (e) { }
    return null
  }

  function offer(server, p, forced) {
    if (!GATE || !p) return false
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') {
      console.warn(TAG + 'ritual.js missing - she cannot open. No deal offered.')
      return false
    }
    var deal = dealFor(p)
    var say = function (s) { try { p.tell(Text.of(COLOUR + s)) } catch (e) { } }

    return VELDORA.ritual.begin(p, {
      colour: COLOUR,
      lines: [deal.pitch],
      options: [
        { id: 'yes', label: deal.yes },
        { id: 'no', label: 'No.' },
      ],
      holdAfterChoice: 40,
      onChoose: function (player, id) {
        if (id !== 'yes') {
          // ⭐ REFUSING COSTS NOTHING. No counter, no grudge, no penalty - and that is
          // what makes saying yes mean something.
          say("Suit yourself.")
          console.info(TAG + player.username + ' refused ' + deal.id + ' - nothing taken')
          return
        }
        var paid = charge(server, player, deal.cost)
        if (!paid) {
          // 🚨 A DEAL THAT FAILED TO CHARGE DOES NOT COUNT. Crediting an uncollected
          // price would hand out the condition for free, and silently.
          console.error(TAG + '!! ' + deal.id + ' (' + deal.cost + ') charged NOTHING ' +
            'for ' + player.username + ' - NOT counting it')
          say("Hm. Nothing to take. We'll call that one void.")
          return
        }
        var n = bumpTaken(player)
        say(deal.after)
        console.info(TAG + player.username + ' TOOK ' + deal.id + ' (' + deal.cost +
          ') - ' + n + '/' + CHOSEN_AT)

        // ⭐ ETHAN'S LINE, on the ACTION BAR, and only after accepting. It is the only
        // thing she ever actually pays out, and it is not from her.
        try {
          if (VELDORA.announce && typeof VELDORA.announce.actionbar === 'function') {
            VELDORA.announce.actionbar(server, player, LAUGHTER)
          }
        } catch (e) { }
      },
    })
  }

  // ── the sweep ────────────────────────────────────────────────────────────────
  function eligible(server, p) {
    if (taken(p) >= CHOSEN_AT) return false      // she has what she wanted
    var pl = pathless(p)
    if (pl !== true) return false                // godless only, and null is not true
    var now = 0
    try { now = server.overworld().dayTime() } catch (e) { return false }
    var last = 0
    try { last = p.persistentData.getInt(K_LAST) || 0 } catch (e) { }
    if (last && (now - last) < COOLDOWN) return false
    return true
  }

  function sweep(server) {
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        try {
          if (!eligible(server, p)) continue
          if (Math.random() >= CHANCE) continue
          var now = 0
          try { now = server.overworld().dayTime() } catch (e) { }
          try { p.persistentData.putInt(K_LAST, now) } catch (e) { }
          offer(server, p, false)
        } catch (e) { }
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    try { server.scheduleInTicks(SWEEP, function () { sweep(server) }) } catch (e) { }
  }

  VELDORA.deals = {
    taken: taken,
    threshold: CHOSEN_AT,
    qualifies: function (p) { return taken(p) >= CHOSEN_AT },
    remaining: function (p) {
      var r = CHOSEN_AT - taken(p)
      return r > 0 ? r : 0
    },
    offer: offer,
    deals: DEALS,
    laughter: LAUGHTER,
    enabled: function () { return GATE },
    _tierFor: tierFor,
    _dealFor: dealFor,
    _charge: charge,
    _eligible: eligible,
  }

  ServerEvents.loaded(function (event) {
    try { sweep(event.server) } catch (e) { console.warn(TAG + 'could not start :: ' + e) }
    var byCost = {}
    for (var i = 0; i < DEALS.length; i++) byCost[DEALS[i].cost] = (byCost[DEALS[i].cost] || 0) + 1
    var parts = []
    for (var c in byCost) if (byCost.hasOwnProperty(c)) parts.push(c + ' x' + byCost[c])
    console.info(TAG + 'her deals are live - ' + DEALS.length + ' of them (' +
      parts.join(', ') + '), accept ' + CHOSEN_AT + ' and she has you. Refusing costs ' +
      'NOTHING. She gets more honest the more you say yes.')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return
    try {
      event.register(Commands.literal('deal')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .then(Commands.literal('offer').executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var okd = offer(ctx.source.server, p, true)
          if (!okd) p.tell(Text.of('§8no deal opened - already in a ritual, or ritual.js is missing'))
          return 1
        }))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var pl = pathless(p)
          p.tell(Text.of('§8deals taken: §f' + taken(p) + '§8 / ' + CHOSEN_AT))
          p.tell(Text.of('§8godless: §f' + (pl === null ? 'UNREADABLE' : (pl ? 'yes' : 'no - she does not offer'))))
          p.tell(Text.of('§8she is speaking from tier §f' + tierFor(p) +
            '§8 (0 = selling, 3 = not even trying)'))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
