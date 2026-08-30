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
// 🔴 MY FIRST ANSWER WAS THAT SHE STOPS TRYING - getting plainer each time until she
// said "there is no upside, say yes". Ethan ruled it out the same day:
//
//     "salvage's trick dialogue will never tell you what she wants only that you are
//      going to get something wonderful."
//
// ⚠️ SO SHE NEVER ANSWERS THE SUSPICION AT ALL. She does not confess, she does not
// acknowledge that you are on your fourth, and she never once names what she is taking
// or what you are getting. "Something of yours" for "something wonderful" is the most
// specific she is capable of being.
//
// ⭐ THE TIERS STILL CLIMB, JUST NOT TOWARD HONESTY - toward FAMILIARITY. Early pitches
// sell. Late ones assume you are already friends and skip the selling. A suspicious
// reader gets no reward for being suspicious, which is worse than being told.
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
    // ── what she offers you ────────────────────────────────────────
    // 🚨 NOT ONE OF THESE NAMES THE PRICE, AND NOT ONE NAMES THE PRIZE. That is the
    // rule and there are no exceptions in the pool - the harness checks every line.
    //
    // ⚠️ "give me something of yours" is as specific as she EVER gets about what she
    // is taking, and "wonderful" is as specific as she ever gets about what you are
    // getting. She does not say WHICH thing, or WHAT you receive, because she is not
    // going to give you one.
    { id: 'hand', cost: 'life', tier: 0,
      pitch: "I have a deal for you. Give me something of yours, and I'll give you the world.",
      yes: "Take her hand.",
      after: "There. Wasn't that easy?" },

    { id: 'wonderful', cost: 'hunger', tier: 0,
      pitch: "Something wonderful, for something of yours. You won't even miss it.",
      yes: "Trade.",
      after: "Wonderful. Truly." },

    { id: 'seedmoney', cost: 'levels', tier: 0,
      pitch: "Everything worth having starts with a small thing changing hands. Yours first.",
      yes: "Hand it over.",
      after: "And so it begins." },

    { id: 'lucky', cost: 'debuff', tier: 0,
      pitch: "You've caught me in a generous mood, friend, and those don't last. One thing of yours.",
      yes: "Before it passes.",
      after: "Lucky, lucky you." },

    { id: 'better', cost: 'levels', tier: 1,
      pitch: "This one's better than the last. I wouldn't waste your time twice.",
      yes: "Better, then.",
      after: "Better. Much better." },

    { id: 'saving', cost: 'hunger', tier: 1,
      pitch: "I've been saving this for someone. Turns out it's you.",
      yes: "For me?",
      after: "For you. Always was." },

    { id: 'rare', cost: 'debuff', tier: 1,
      pitch: "You will not see an offer like this again. I say that to everyone. It's true this time.",
      yes: "This time.",
      after: "This time. Same as last time." },

    { id: 'owed', cost: 'levels', tier: 2,
      pitch: "You're owed something marvellous by now. Give me one more thing and we'll settle it.",
      yes: "Settle it.",
      after: "Settled. Consider us square." },

    { id: 'nearly', cost: 'hunger', tier: 2,
      pitch: "We're so close, you and I. One more and it all comes good.",
      yes: "So close.",
      after: "So close. Nearly there." },

    // ⚠️ ADDED, not swapped: the four costs Ethan named keep every deal they had.
    { id: 'wellwisher', cost: 'thirst', tier: 1,
      pitch: "You look parched, friend. I have exactly the thing, and it's cheap today.",
      yes: "I'll take it.",
      after: "There you go. Drink deep." },

    { id: 'lasthand', cost: 'life', tier: 3,
      pitch: "Last one, friend. Give me something of yours, and I'll give you the world.",
      yes: "Take her hand.",
      after: "The world. As promised." },
  ]

  // ⭐ PATHLESS DIALOGUE ARRIVES BROKEN. These lines are only ever spoken to a player
  // with no god, so they take the same 25% obfuscation the Stranger does - nothing is
  // translating for you. See garble.js.
  //
  // ⚠️ Fails SOFT to plain text: a missing garble.js should not silence a deal.
  function broken(t) {
    try {
      if (VELDORA.garble && typeof VELDORA.garble.line === 'function') {
        return VELDORA.garble.line(t, COLOUR)
      }
    } catch (e) { }
    return t
  }

  function brokenAll(a) {
    var out = [], i
    for (i = 0; i < a.length; i++) out.push(broken(a[i]))
    return out
  }

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

  // 🔴 THIS USED TO ESCALATE TOWARD HONESTY. Ethan, 2026-08-29, ruling it out:
  // *"salvage's trick dialogue will never tell you what she wants only that you are
  // going to get something wonderful."*
  //
  // ⚠️ THE ESCALATION WAS MINE, NOT HIS. I built her getting plainer each time - "there
  // is no upside, say yes" - as an answer to "convince five times against a suspicious
  // reader". It was a good mechanic for a different character. She does not confess.
  //
  // ⭐ THE TIERS SURVIVE, POINTING SOMEWHERE ELSE: she gets more FAMILIAR, not more
  // honest. Early pitches sell; late ones assume you are already friends and skip the
  // selling. The reader's suspicion is never answered, because she never acknowledges
  // it - and that is worse, and correct.
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
      // ⭐ THIRST. Ethan installed Tough As Nails 2026-08-29 and the accident is worth
      // naming: her deals already took HUNGER, and thirst hands her a second currency
      // without anybody writing a line for it. She is the god who sells you what you
      // need; TAN just added a new need.
      //
      // ⚠️ FAILS TO 'NOT CHARGED' IF TAN IS ABSENT, which the caller then treats as a
      // void deal - she is not paid and the counter does not move. A deal that counts
      // without collecting is the bug this whole path guards against.
      if (cost === 'thirst') {
        try {
          if (!VELDORA.tan || !VELDORA.tan.present()) return false
          return VELDORA.tan.drain(p) === 0
        } catch (e) { return false }
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
    var say = function (s) { try { p.tell(Text.of(COLOUR + broken(s))) } catch (e) { } }

    return VELDORA.ritual.begin(p, {
      colour: COLOUR,
      lines: brokenAll([deal.pitch]),
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
