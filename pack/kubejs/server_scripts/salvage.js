// salvage.js - E6, Salvage's economy.  docs/23 PART V, docs/24 §E6
//
// THE BODY FOR POWER. `24` calls this "the proof of the whole design".
//
// She does not want your gold. She wants pieces of you. Ethan's three offers, canon:
//
//     "Lets do a deal."
//     "Give me your hunger, and i'll give you life."
//     "Give me your levels and i shall grant you ammo."
//     "Give me your sight and i will grant you the power to kill."
//
// Every price is a LIVE RESOURCE, never an inventory item - you cannot stockpile for
// her, you pay out of your body. And every trade raises her counter, which is what
// calls the raid (E7, Interest).
//
// ── WHAT THE PROBES SETTLED, 2026-08-15 ──────────────────────────────────────
//  · the accessor is stack.get('minecraft:custom_data'). stack.nbt is undefined in
//    1.21, as is nbtString. On an EMPTY hand it returns null - so null means "no
//    data", NOT "failed", and an empty hand must not read as an error.
//  · a held gun reports GunId (tacz:glock_17) but NOT its calibre. gun_ammo.js is
//    the bridge, generated from the jar - 54 guns, 19 calibres.
//  · AmmoId MUST be namespaced. 'tacz:12g' chambers; '12g' renders as a missing
//    texture and never gains TaCZ's max_stack_size stamp.
//  · blindness IS in ritual.js's clear list, so a plain release() wiped the sight
//    cost. Without that probe this trade would have shipped looking perfect and
//    doing nothing.
//
// ── TWO BUGS FOUND IN THE FIRST LIVE RUN, 2026-08-15 ─────────────────────────
//  · the ritual renders options[o].LABEL. This file passed `text`, so all four
//    options rendered as the word "undefined".
//  · a scene-level `keep` was WRONG. It applied to every outcome, so refusing -
//    or being too poor to trade - left the player permanently blind having paid
//    nothing. A price may only be kept by the choice that actually charged it,
//    so tradeSight now claims it via VELDORA.ritual.keepOnRelease, on success only.
//
// ── ROLLBACK ─────────────────────────────────────────────────────────────────
// GATE below to false. Nothing else consumes this file; the counter it writes is
// inert without E7.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[salvage] '
  // ⛔ SALVAGE IS OFF. Ethan, 2026-08-30: *"lets disable salvage aswell. it will need a
  // complete repass and not this session."*
  //
  // 🔴 THIS GATE WAS STILL `true` ON THE LIVE SERVER and she reached out within minutes of
  // the new world - the ruling was made and never landed in the code. She comes back when
  // the repass happens, not before.
  var GATE = false
  var PATRON = 'salvage'

  // ── the prices ─────────────────────────────────────────────────────────────
  // Deliberately small. She is the cheapest patron to say yes to once, and the
  // ratchet is that you say yes often - not that any single trade hurts.
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ HARNESS - the counter, and what it BUYS you.  Ethan, 2026-08-15:
  //   "Counter will be called Harness. Low harness = bad deals, high harness =
  //    good deals."
  //
  // The counter already existed and already rose on every trade; what it did NOT do
  // was change the terms. So dealing with her was flat - the hundredth deal was
  // priced like the first, which is the one thing a loan shark would never do.
  //
  // Now the numbers below are BASE rates and harness moves them:
  //
  //     harness 0    you pay 1.5x and receive 1.0x   she is testing you
  //     harness 1    you pay 1.0x and receive 2.0x   you are worth keeping
  //
  // ⭐ THE POINT: her hold on you is not a threat, it is a DISCOUNT. Leaving costs
  // you the rate you spent all game earning. That is a better trap than anything
  // she could threaten, and it is the only one in the pantheon built out of
  // arithmetic instead of dialogue.
  var HARNESS_CALM = 0         // deals struck: worst terms
  var HARNESS_FULL = 25        // deals struck: best terms

  // 0..1, or null if her counter cannot be read. NULL IS NOT ZERO - an unreadable
  // counter must not silently hand a loyal customer the worst rate in the game.
  function harness(p) {
    var n = null
    try { if (VELDORA.counter) n = VELDORA.counter.get(p, PATRON) } catch (e) { }
    if (n === null) return null
    if (n <= HARNESS_CALM) return 0
    if (n >= HARNESS_FULL) return 1
    return (n - HARNESS_CALM) / (HARNESS_FULL - HARNESS_CALM)
  }

  // The terms. h===null falls back to the middle rather than the worst - a storage
  // failure should not look like distrust.
  function priceMul(p) { var h = harness(p); if (h === null) h = 0.5; return 1.5 - (0.5 * h) }
  function payMul(p)   { var h = harness(p); if (h === null) h = 0.5; return 1 + h }

  var HUNGER_COST = 6          // 3 shanks (BASE - scaled by priceMul)
  var HEALTH_GAIN = 6          // 3 hearts
  var LEVEL_COST = 5
  var AMMO_ROUNDS = 30
  var SIGHT_SECONDS = 300      // "up to 5 minutes", docs/23 PART V

  // What "the power to kill" actually IS.
  //
  // Ethan, 2026-08-15, having taken the trade: "instead of a flat buff we should use
  // strength and speed effects instead so the player can see what they traded."
  //
  // The first version multiplied the E3 power axis, which is INVISIBLE - you paid
  // five minutes of blindness for a number you could only find by typing /power.
  // That is the legibility law failing in the one place it matters most: at the
  // moment you are deciding whether the price was worth it. Potion effects sit in
  // the HUD and announce themselves.
  //
  // Speed while blind is deliberate. She gives you power you cannot steer.
  var SIGHT_EFFECTS = [
    ['minecraft:strength', 1],   // amp 1 = Strength II
    ['minecraft:speed', 0],
  ]

  var DEBT_PER_TRADE = 1

  // ── her voice ──────────────────────────────────────────────────────────────
  // ⚠️ REGISTER FIX, 2026-08-29 (F2). These nine carried NO contractions while her
  // authored rules mandate them - "You are having a bad night" against "Something's
  // coming. Count your ammo." from the same god. That is the whole "her trade voice
  // and her collection voice are audibly different people" finding, and it was
  // measurable rather than a matter of taste.
  //
  // 🔑 CONTRACTIONS ONLY. Not one image is changed - authorship of these is unclear
  // (they predate the voice split) so the fix is the smallest one that lands her
  // register. "Lets" -> "Let's" was also a plain apostrophe typo.
  var OPENERS = [
    "Let's do a deal.",
    'Friend. You look like you need something.',
    'No charge for looking.',
    "You're having a bad night. I'm having a good one.",
  ]
  var TOOK = {
    hunger: "Hunger for life. You'll be hungry again. That's the beauty of it.",
    levels: "Levels for lead. Spend them, friend - you'd only have been eaten with them.",
    sight: "Sight for teeth. Don't worry. It comes back.",
  }
  var REFUSED = [
    "Suit yourself. I'll be here.",
    "No? Come back when it's worse.",
  ]

  function pick(a) { return a[Math.floor(Math.random() * a.length)] }
  function speak(p, s) {
    var c = '§6§l'
    try {
      if (VELDORA.voice && typeof VELDORA.voice.colourOf === 'function') {
        c = VELDORA.voice.colourOf(PATRON)
      }
    } catch (e) { }
    try { p.tell(Text.of(c + s)) } catch (e) { }
  }
  function note(p, s) { try { p.tell(Text.of('§7' + s)) } catch (e) { } }

  // ── reading the gun in your hand ───────────────────────────────────────────
  // Returns {gunId, ammoId, mag} or null. null is a legitimate, quiet answer: it
  // means "not holding a gun we know", and the trade simply is not offered.
  function heldGun(p) {
    var st = null
    try { st = p.mainHandItem } catch (e) { return null }
    if (!st) return null
    var id = null
    try { id = String(st.id) } catch (e) { return null }
    if (id === 'minecraft:air') return null

    var data = null
    try { data = st.get('minecraft:custom_data') } catch (e) { return null }
    if (!data) return null                       // no custom_data - not a TaCZ gun

    // The map is a Java object here, so go through its string form rather than
    // assuming a JS-shaped property. GunId:"tacz:glock_17"
    var s = ''
    try { s = String(data) } catch (e) { return null }
    var m = s.match(/GunId:\s*"([^"]+)"/)
    if (!m) return null

    var gunId = m[1]
    var ammoId = null, mag = null
    try {
      if (VELDORA.gunAmmo) {
        ammoId = VELDORA.gunAmmo.of(gunId)
        mag = VELDORA.gunAmmo.magOf(gunId)
      }
    } catch (e) { }
    if (!ammoId) {
      console.warn(TAG + 'held ' + gunId + ' but gun_ammo.js has no calibre for it - ' +
        'regenerate with tools/gen_gun_ammo.py')
      return null
    }
    return { gunId: gunId, ammoId: ammoId, mag: mag }
  }

  function mintAmmo(ammoId, rounds) {
    // AmmoId MUST be namespaced - measured. An unprefixed id produces an item that
    // renders as a missing texture and chambers in nothing.
    var spec = 'tacz:ammo[minecraft:custom_data={AmmoId:"' + ammoId +
      '",AmmoCount:' + rounds + '}]'
    var st = null
    // Item.of's SECOND ARGUMENT IS THE COUNT, not NBT (that mistake threw in E0).
    // Setting the count here rather than via a setCount() call afterwards, because
    // a setCount that does not exist would sit in a catch and hand out ONE round
    // while every log line said thirty.
    try { st = Item.of(spec, rounds) } catch (e) {
      console.error(TAG + 'could not mint ' + spec + ' :: ' + e)
      return null
    }
    // TaCZ stamps max_stack_size onto a stack whose AmmoId it recognises. That is
    // free validation, so assert it rather than trusting the string we just built.
    var shown = ''
    try { shown = String(st.toItemString()) } catch (e) { }
    if (shown.indexOf('max_stack_size') === -1) {
      console.error(TAG + '!! ' + ammoId + ' produced NO max_stack_size stamp - ' +
        'TaCZ does not recognise it. Refusing to hand out rounds that chamber in nothing.')
      return null
    }
    // Assert the count actually took. "I asked for 30" and "there are 30" are
    // different claims and only the second one is evidence.
    var got = 0
    try { got = st.count } catch (e) { }
    if (got !== rounds) {
      console.warn(TAG + 'asked for ' + rounds + ' rounds, stack reports ' + got)
    }
    return st
  }

  // ── the trades ─────────────────────────────────────────────────────────────
  // Each returns true only if the player was ACTUALLY charged and ACTUALLY paid.
  // A trade that half-completes is worse than one that refuses.

  function tradeHunger(p) {
    var h = null
    try { h = p.foodData.foodLevel } catch (e) { }
    if (h === null) { speak(p, pooled('unreadable', 'Something is wrong with you. Come back later.')); return false }
    var hungerCost = Math.max(1, Math.round(HUNGER_COST * priceMul(p)))
    if (h < hungerCost) { speak(p, pooled('deal_poor', 'You have nothing left to give me. Eat something.')); return false }

    var before = h
    try { p.foodData.foodLevel = h - hungerCost } catch (e) { }
    var after = null
    try { after = p.foodData.foodLevel } catch (e) { }
    if (after === null || after >= before) {
      console.error(TAG + '!! hunger charge did not stick (' + before + ' -> ' + after + ')')
      speak(p, pooled('kept_hunger', 'You kept it. How.'))
      return false
    }
    try {
      var max = p.getAttribute('minecraft:generic.max_health').getValue()
      p.setHealth(Math.min(max, p.health + HEALTH_GAIN))
    } catch (e) { console.warn(TAG + 'could not heal: ' + e) }
    speak(p, pooled('took_hunger', TOOK.hunger))
    return true
  }

  function tradeLevels(p) {
    var gun = heldGun(p)
    if (!gun) { speak(p, pooled('need_gun', 'Hold the thing you want fed, friend.')); return false }
    var x = null
    try { x = p.xpLevel } catch (e) { }
    if (x === null) { speak(p, pooled('unreadable', 'Something is wrong with you. Come back later.')); return false }
    var levelCost = Math.max(1, Math.round(LEVEL_COST * priceMul(p)))
    if (x < levelCost) { speak(p, pooled('deal_poor', 'You are too poor even for me.')); return false }

    var baseRounds = gun.mag ? Math.max(AMMO_ROUNDS, gun.mag) : AMMO_ROUNDS
    var rounds = Math.max(1, Math.round(baseRounds * payMul(p)))
    var st = mintAmmo(gun.ammoId, rounds)
    if (!st) { speak(p, pooled('no_stock', 'My supplier let me down. Nothing for you tonight.')); return false }

    // Charge only AFTER the goods exist. The reverse order is how a player pays
    // for nothing when a mint fails.
    var before = x
    try { p.xpLevel = x - levelCost } catch (e) { }
    var after = null
    try { after = p.xpLevel } catch (e) { }
    if (after === null || after >= before) {
      console.error(TAG + '!! level charge did not stick (' + before + ' -> ' + after + ')')
      speak(p, pooled('kept_levels', 'You kept them. How.'))
      return false
    }
    try { p.give(st) } catch (e) { console.error(TAG + 'could not give ammo: ' + e) }
    speak(p, pooled('took_levels', TOOK.levels))
    note(p, rounds + ' x ' + gun.ammoId.replace('tacz:', '') + ' for ' + levelCost + ' levels.')
    return true
  }

  function tradeSight(p) {
    var srv = null
    try { srv = p.server } catch (e) { }
    if (!srv) return false
    var name = null
    try { name = String(p.username) } catch (e) { }
    if (!name) return false

    // The blindness is applied HERE and survives the release via spec.keep. It is
    // deliberately longer than the scene: this is the one cost that walks out with
    // you. Ambient so it does not strobe particles for five minutes.
    try {
      srv.runCommandSilent('effect give ' + name + ' minecraft:blindness ' +
        SIGHT_SECONDS + ' 0 true')
    } catch (e) { console.error(TAG + 'could not apply blindness: ' + e); return false }

    // The power, and it must be SEEN. Particles left ON (the trailing `false` is
    // vanilla's hideParticles) so that when sight returns the buff is still
    // visibly running - the trade should still be legible after its price ends.
    //
    // None of these are in ritual.js's EFFECTS list, so the release does not touch
    // them; they expire on their own clock. Weakness IS in that list and is cleared
    // on release, so it cancels the Strength for the last second of the scene only.
    var granted = 0
    for (var i = 0; i < SIGHT_EFFECTS.length; i++) {
      try {
        srv.runCommandSilent('effect give ' + name + ' ' + SIGHT_EFFECTS[i][0] + ' ' +
          SIGHT_SECONDS + ' ' + SIGHT_EFFECTS[i][1] + ' false')
        granted++
      } catch (e) {
        console.error(TAG + 'could not grant ' + SIGHT_EFFECTS[i][0] + ' :: ' + e)
      }
    }
    if (granted === 0) {
      // She took the sight already. Give it back rather than charge for nothing.
      try { srv.runCommandSilent('effect clear ' + name + ' minecraft:blindness') } catch (e) { }
      console.error(TAG + '!! sight trade granted NOTHING - blindness refunded')
      speak(p, pooled('kept_sight', 'On second thought. Keep your eyes.'))
      return false
    }

    // Claim the blindness NOW - this is the one outcome entitled to keep it.
    try {
      if (!VELDORA.ritual.keepOnRelease(p, ['minecraft:blindness']))
        console.warn(TAG + 'could not claim the blindness keep - sight may clear early')
    } catch (e) { console.error(TAG + 'keepOnRelease threw :: ' + e) }

    speak(p, pooled('took_sight', TOOK.sight))
    note(p, 'Strength and speed, five minutes. You will not see them coming.')
    return true
  }

  // ── the offer ──────────────────────────────────────────────────────────────
  // ⭐ HER WORDS BELONG TO ETHAN, NOT TO THIS FILE.
  // Nine of her refusals were string literals sitting in the trade code, which meant
  // the only lines a player reliably hears - "you are too poor even for me" fires far
  // more often than any idle line - were the nine he could not edit without opening a
  // script. Now each is a POOL LOOKUP with the original as a fallback, so nothing
  // breaks while the pool is empty and everything is his the moment it is not.
  function pooled(tag, fallback) {
    try {
      if (VELDORA.voice && typeof VELDORA.voice.line === 'function') {
        var s = VELDORA.voice.line(PATRON, tag, null)
        if (s) return s
      }
    } catch (e) { }
    return fallback
  }

  function open(p, why) {
    if (!GATE) return false
    if (!p) return false

    // ⭐ G1 - what it actually feels like when she turns up. She reads as a friendly
    // shopkeeper, and this is the tell that she is not one.
    try {
      if (VELDORA.announce && p.server) VELDORA.announce.say(p.server, p, 'trade')
    } catch (e) { }
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') {
      console.error(TAG + 'ritual missing - Salvage cannot open')
      return false
    }
    if (VELDORA.ritual.active(p)) return false

    var gun = heldGun(p)
    // `label` is the ritual's contract. Passing `text` rendered four options as
    // the word "undefined" - measured live 2026-08-15.
    var options = [
      { id: 'hunger', label: 'My hunger.' },
      { id: 'levels', label: gun ? 'My levels.' : 'My levels. §8(hold a gun)' },
      { id: 'sight', label: 'My sight.' },
      { id: 'no', label: 'Nothing tonight.' },
    ]

    return VELDORA.ritual.begin(p, {
      lines: [pooled('open', pick(OPENERS)), 'Give me your hunger, and i\'ll give you life.',
        'Give me your levels and i shall grant you ammo.',
        'Give me your sight and i will grant you the power to kill.'],
      options: options,
      holdAfterChoice: 40,
      // 🚨 NO scene-level `keep`. An earlier version put blindness here and it
      // applied to EVERY outcome - refusing, a failed trade, being too poor - so a
      // player who paid nothing was left permanently blind. A price may only be
      // kept by the choice that actually charged it, so tradeSight sets it itself
      // via VELDORA.ritual.keepOnRelease, and only on success.
      onChoose: function (player, id) {
        // ⭐ THREE REFUSALS IN A ROW AND SHE IS DONE (Ethan, 2026-08-16). Her
        // counter is the main one, so this is the site that matters most.
        var srv = null
        try { srv = player.server } catch (e) { }
        if (id === 'no') {
          speak(player, pooled('refused', pick(REFUSED)))
          try {
            if (VELDORA.release) VELDORA.release.denied(srv, player, PATRON, 'counter')
            else console.warn(TAG + 'release.js missing - refusals count for NOTHING')
          } catch (e) { }
          return
        }
        // Forgiveness lands on the CHOICE, not on the outcome. A player who picked
        // a trade and turned out to be too poor for it did not refuse her.
        try { if (VELDORA.release) VELDORA.release.accepted(srv, player, PATRON, id) } catch (e) { }

        var ok = false
        if (id === 'hunger') ok = tradeHunger(player)
        else if (id === 'levels') ok = tradeLevels(player)
        else if (id === 'sight') ok = tradeSight(player)

        // The debt rises ONLY on a completed trade. A refusal costs nothing and a
        // failed trade must not be billed - that is how a player ends up owing for
        // something they never received.
        if (!ok) return
        var d = null
        try { if (VELDORA.counter) d = VELDORA.counter.add(player, PATRON, DEBT_PER_TRADE, 'trade:' + id) } catch (e) { }
        if (d === null) console.error(TAG + '!! trade ' + id + ' completed but the DEBT DID NOT RISE')
      },
      // 🚨 A TIMEOUT IS NOT A REFUSAL. She says the refusal line either way - that
      // is her character - but it does NOT advance the streak, because walking away
      // from the counter is AFK as often as it is "no" and this code cannot tell
      // them apart. Logged so the rate is visible; never counted.
      onTimeout: function (player) {
        speak(player, pooled('refused', pick(REFUSED)))
        try {
          var srv = null
          try { srv = player.server } catch (e) { }
          if (VELDORA.release) VELDORA.release.ignored(srv, player, PATRON, 'counter')
        } catch (e) { }
      },
    })
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // E6b — SHE OPENS HERSELF.  docs/23 PART V.6, docs/34 §2b
  //
  // Ethan, 2026-08-15: "going forwards i want the player to actually use commands
  // as little as possible."
  //
  // /trade_test is a HARNESS, not the feature. `23` PART V has always said she
  // opens AT THE WORST TIMES - mid-combat, low health, just after a death - and
  // until now that half did not exist, which made E6 a mechanism rather than
  // something that happens to you. That was the founding complaint of the whole
  // project: "we need things to happen to us."
  //
  // ── BUILT ON PROVEN HOOKS ONLY ─────────────────────────────────────────────
  // beforeHurt, respawned and scheduleInTicks are all exercised elsewhere in this
  // codebase. EntityEvents.afterHurt IS in the KubeJS registry (23 PART V.7) but
  // has never fired here, and J6's lesson is that an unfired hook cannot be
  // distinguished from a nonexistent one from inside a script. So combat is
  // detected on beforeHurt and JUDGED on a slow sampler, where the health value
  // is read directly rather than inferred from an event field we have not proven.
  //
  // ── THE INVARIANT ──────────────────────────────────────────────────────────
  // She is an opportunist, not a vending machine. Every path below funnels through
  // maybeOpen(), which is the single place that decides whether she is allowed to
  // speak - so there is exactly one definition of "not right now".
  // ═══════════════════════════════════════════════════════════════════════════

  var AUTO = true                  // rollback: false, and only /trade_test remains

  var LAST_OFFER = 'veldora_salvage_last_offer'   // world ticks, cumulative
  var COOLDOWN_BASE = 6000         // ~5 real minutes at 20t/s
  var COOLDOWN_FLOOR = 2400        // ~2 minutes - she can never be faster than this
  var COOLDOWN_PER_DEBT = 300      // she gets pushier the more you owe

  var LOW_HEALTH = 0.35            // "a bad night" - fraction of max
  var COMBAT_WINDOW = 200          // ticks since last damage that still counts as mid-fight
  var DRY_SPELL_DAYS = 2           // days since her counter moved

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ A CHANCE DIVIDES THE RATE. It did not used to - see maybeOpen().
  //
  // Ethan, live-testing 2026-08-18: "the biggest thing for salvage is that it
  // bothers the player too much." The log agreed, and named the culprit itself:
  //
  //     she opened on j0nesyboi223 - dry spell (22d) (debt=0, cooldown was 6000t)
  //     she opened on j0nesyboi223 - dry spell (22d) (debt=0, cooldown was 6000t)
  //
  // ...twice in thirteen minutes, on the trigger whose own comment read
  // "deliberately rare". It was not rare. It was 99.2% certain within a minute of
  // every cooldown expiry, because the roll ran once per 2-SECOND SAMPLE instead of
  // once per approach. The chance bought about ten seconds of jitter and nothing
  // else; the cooldown was the entire rate.
  //
  // 🔑 THE EFFECTIVE INTERVAL IS NOW `cooldown / chance`, which is what these
  // numbers always read as if they meant:
  //
  //             chance   at debt 0 (6000t)   at the floor (2400t)
  //     combat   0.15         33 min               13 min
  //     death    0.30         17 min                7 min
  //     dry      0.40         12 min                5 min
  //
  // ⚠️ AND THE TWO ARE SWAPPED (was combat 0.40 / dry 0.15). Her LIKELIEST approach
  // used to be her most intrusive one - mid-fight, at low health, control taken
  // away - while the safe unprompted one was her rarest. That is backwards. She now
  // mostly turns up when you are NOT busy, and interrupting a fight is the rare
  // thing. Revert by swapping these two numbers back; nothing else depends on it.
  //
  // For scale: every other god speaks through godevents, whose GLOBAL_COOLDOWN is
  // one world day (~20 real min) SHARED ACROSS ALL OF THEM. She is the only patron
  // with a second, private loop, so she is the only one who can outpace the whole
  // rest of the pantheon - which is exactly what she was doing, by 5-13x.
  // ═══════════════════════════════════════════════════════════════════════════
  var CHANCE_TROUBLE = 0.15        // hurt and low, MID-FIGHT - now her rarest
  var CHANCE_AFTER_DEATH = 0.30
  var CHANCE_DRY = 0.40            // unprompted, and you are safe - now her usual

  var SAMPLE_TICKS = 40            // 2s. Cheap: only online salvage walkers.

  var lastHurt = {}                // uuid -> world ticks, in memory by design

  function worldTicks(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return d
    } catch (e) { }
    return null
  }

  // ── the test override ──────────────────────────────────────────────────────
  // E6b only runs for the salvage walker, and salvage is genuinely held by
  // j0nesyboi223 with tag and claim agreeing. Moving the claim would leave HIM
  // carrying a salvage tag against someone else's claim - the P1 desync - and
  // paths.js has NO loggedIn reconciliation, so nothing would ever heal it.
  //
  // So testing borrows the gate instead of another player's path.
  //
  // IN MEMORY ON PURPOSE. It dies on restart, so it cannot be left on by accident
  // and then mistaken for real behaviour six weeks later - which is how a test
  // flag becomes a production bug.
  var testAs = {}                  // uuid -> true

  function walksSalvage(p) {
    try { if (testAs[String(p.uuid)]) return true } catch (e) { }
    try {
      if (VELDORA.paths && typeof VELDORA.paths.pathOf === 'function') {
        return VELDORA.paths.pathOf(p) === PATRON
      }
    } catch (e) { }
    return false
  }

  function healthFrac(p) {
    try {
      var max = p.getAttribute('minecraft:generic.max_health').getValue()
      if (!max || !isFinite(max) || max <= 0) return null
      return p.health / max
    } catch (e) { return null }
  }

  // The ONE place that decides whether she may speak. Every trigger calls this.
  // Returns true only if she actually opened.
  function maybeOpen(p, server, why, chance) {
    if (!AUTO) return false
    if (!walksSalvage(p)) return false

    // Never talk over another patron. The ritual is single-occupancy and I2's
    // introductions use it too - two scenes at once would fight over the release.
    try { if (VELDORA.ritual && VELDORA.ritual.active(p)) return false } catch (e) { }

    var now = worldTicks(server)
    if (now === null) {
      // No clock means no cooldown, and no cooldown means she could open every
      // sample. Refuse rather than spam - K9's lesson wearing a different hat.
      console.warn(TAG + 'no world clock - AUTO-OPEN SUPPRESSED (cannot rate-limit)')
      return false
    }

    var last = 0
    try { last = p.persistentData.getDouble(LAST_OFFER) } catch (e) { }
    if (!last || !isFinite(last) || last > now) last = 0   // clock moved backwards

    // She gets pushier as the debt grows. That IS the ratchet: the more you owe,
    // the more often she is standing there offering you a way to owe more.
    var debt = 0
    try {
      if (VELDORA.counter) {
        var d = VELDORA.counter.get(p, PATRON)
        if (d !== null) debt = d
      }
    } catch (e) { }
    var cd = Math.max(COOLDOWN_FLOOR, COOLDOWN_BASE - debt * COOLDOWN_PER_DEBT)
    if (last && (now - last) < cd) return false

    // ⭐ ONE ROLL PER WINDOW, NOT ONE PER SAMPLE. A LOST ROLL SPENDS THE WINDOW.
    // Without this stamp the loser re-rolls in 2 seconds, and again, and again, so
    // `chance` decides how many seconds she waits rather than how often she comes.
    if (Math.random() > chance) {
      try { p.persistentData.putDouble(LAST_OFFER, now) } catch (e) { }
      return false
    }

    // ⚠️ KNOWN INTERACTION, and it is the behaviour we want. The sampler tries the
    // combat trigger before the dry-spell one in the SAME sample, so a lost combat
    // roll now spends the window and the dry-spell check finds it fresh. Net effect:
    // ONE roll per window whoever asks first, and a player who is fighting hard gets
    // approached LESS. Given the complaint was that she bothers you too much - and
    // that mid-fight is the worst moment to be interrupted - that is the right way
    // round. Split LAST_OFFER per-trigger if this ever needs to change.

    // 🚨 BUT A FAILURE TO SPEAK MUST NOT SPEND IT. She lost the roll above; here she
    // WON it and something else stopped her - a ritual that opened in between, a
    // missing seam. Charging her the window for that would make her quieter every
    // time the machinery hiccups, silently. Same rule godevents already states:
    // "a run() that returns false does NOT stamp the cooldown."
    if (!open(p, why)) return false

    try { p.persistentData.putDouble(LAST_OFFER, now) } catch (e) { }
    console.info(TAG + 'she opened on ' + p.username + ' - ' + why +
      ' (debt=' + debt + ', cooldown was ' + cd + 't)')
    return true
  }

  // ── trigger 1 + 2: the bad night, and mid-combat ──────────────────────────
  // Recorded on beforeHurt, judged on the sampler. Reading health inside the
  // damage event would read it BEFORE the hit lands, which is the wrong number
  // for "are you nearly dead".
  EntityEvents.beforeHurt(function (event) {
    try {
      var e = event.entity
      if (!e || !e.player) return
      lastHurt[String(e.uuid)] = -1        // stamped properly by the sampler
    } catch (x) { }
  })

  // ── trigger 3: just after a death ─────────────────────────────────────────
  // She profits from your bad night, and there is no worse night than that one.
  // Delayed so it lands after the respawn settles rather than over the top of it.
  PlayerEvents.respawned(function (event) {
    if (!AUTO) return
    var p = event.player
    if (!p) return
    var server = null
    try { server = p.server } catch (e) { }
    if (!server) return
    server.scheduleInTicks(100, function () {
      try {
        if (!p.isAlive()) return
        maybeOpen(p, server, 'after a death', CHANCE_AFTER_DEATH)
      } catch (e) { console.warn(TAG + 'post-death open threw :: ' + e) }
    })
  })

  // ── the sampler: judges 1, 2 and 4 ────────────────────────────────────────
  function sample(server) {
    try {
      var now = worldTicks(server)
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        if (!walksSalvage(p)) continue
        var uuid = String(p.uuid)

        // stamp the hurt time here, where we have the clock
        if (lastHurt[uuid] === -1 && now !== null) lastHurt[uuid] = now

        var hf = healthFrac(p)
        var hurtAgo = (now !== null && lastHurt[uuid] > 0) ? (now - lastHurt[uuid]) : null
        var inCombat = hurtAgo !== null && hurtAgo >= 0 && hurtAgo < COMBAT_WINDOW

        // 1+2. Hurt, and low. The detarget inside the ritual is what makes an
        // offer mid-fight survivable rather than a death sentence - that was
        // designed in from the start (23 PART IV).
        if (hf !== null && hf <= LOW_HEALTH && inCombat) {
          if (maybeOpen(p, server, 'low health mid-combat', CHANCE_TROUBLE)) continue
        }

        // 4. The dry spell. She has not had anything from you in days.
        var since = null
        try { if (VELDORA.counter) since = VELDORA.counter.daysSince(p, PATRON) } catch (e) { }
        if (since !== null && since >= DRY_SPELL_DAYS) {
          maybeOpen(p, server, 'dry spell (' + since + 'd)', CHANCE_DRY)
        }
      }
    } catch (e) { console.warn(TAG + 'sampler threw :: ' + e) }
    server.scheduleInTicks(SAMPLE_TICKS, function () { sample(server) })
  }

  VELDORA.salvage = { open: open, heldGun: heldGun, mintAmmo: mintAmmo,
    maybeOpen: maybeOpen, harness: harness, priceMul: priceMul, payMul: payMul }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // E6b's diagnostic. She opens on her own, which means when she does NOT open
    // there is nothing to see - the single hardest kind of behaviour to test. This
    // prints every gate in maybeOpen() and which one is holding, so "she is quiet"
    // and "she is broken" can be told apart. It is a READ, never a bypass.
    event.register(Commands.literal('trade_why').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      function row(ok, label, detail) {
        p.tell(Text.of((ok ? '§a  PASS  ' : '§c  HOLD  ') + '§f' + label +
          (detail ? ' §8' + detail : '')))
      }
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6Why she is or is not about to open'))

      row(AUTO, 'AUTO enabled', AUTO ? '' : '(rollback flag is off)')

      var path = '?'
      try { if (VELDORA.paths) path = VELDORA.paths.pathOf(p) || 'none' } catch (e) { }
      var over = false
      try { over = !!testAs[String(p.uuid)] } catch (e) { }
      row(path === PATRON || over, 'you walk salvage',
        '(you walk ' + path + (over ? ', OVERRIDDEN by /trade_testas' : '') + ')')

      var busy = false
      try { busy = !!(VELDORA.ritual && VELDORA.ritual.active(p)) } catch (e) { }
      row(!busy, 'no other scene running', busy ? '(a ritual is active)' : '')

      var now = worldTicks(srv)
      row(now !== null, 'world clock readable', now === null ? '(NO CLOCK - suppressed)' : '')

      var debt = 0
      try { if (VELDORA.counter) { var d = VELDORA.counter.get(p, PATRON); if (d !== null) debt = d } } catch (e) { }
      var cd = Math.max(COOLDOWN_FLOOR, COOLDOWN_BASE - debt * COOLDOWN_PER_DEBT)
      var last = 0
      try { last = p.persistentData.getDouble(LAST_OFFER) } catch (e) { }
      var waited = (now !== null && last) ? (now - last) : null
      row(waited === null || waited >= cd, 'cooldown elapsed',
        '(debt ' + debt + ' -> ' + cd + 't; waited ' +
        (waited === null ? 'never offered' : Math.round(waited) + 't') + ')')

      var hf = healthFrac(p)
      row(hf !== null && hf <= LOW_HEALTH, 'health is low',
        '(' + (hf === null ? '?' : Math.round(hf * 100) + '%') + ', needs <=' +
        Math.round(LOW_HEALTH * 100) + '%)')

      var uuid = String(p.uuid)
      var ago = (now !== null && lastHurt[uuid] > 0) ? Math.round(now - lastHurt[uuid]) : null
      row(ago !== null && ago < COMBAT_WINDOW, 'recently hurt',
        '(' + (ago === null ? 'not since restart' : ago + 't ago') + ', window ' + COMBAT_WINDOW + 't)')

      var since = null
      try { if (VELDORA.counter) since = VELDORA.counter.daysSince(p, PATRON) } catch (e) { }
      row(since !== null && since >= DRY_SPELL_DAYS, 'dry spell',
        '(' + (since === null ? 'counter never moved' : since + 'd') + ', needs >=' + DRY_SPELL_DAYS + 'd)')

      p.tell(Text.of('§8Even with every gate passed she rolls ' +
        Math.round(CHANCE_TROUBLE * 100) + '% / ' + Math.round(CHANCE_AFTER_DEATH * 100) +
        '% / ' + Math.round(CHANCE_DRY * 100) + '% - she chooses, you do not.'))
      p.tell(Text.of('§8ONE roll per cooldown - a lost roll costs her the whole ' +
        'window, so the real wait is cooldown/chance, not cooldown.'))
      return 1
    }))

    event.register(Commands.literal('trade_testas').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var k = String(p.uuid)
      if (testAs[k]) {
        delete testAs[k]
        p.tell(Text.of('§7She no longer treats you as her walker.'))
      } else {
        testAs[k] = true
        p.tell(Text.of('§6She will now treat you as her walker §8(this session only)'))
        p.tell(Text.of('§8No claim was touched. Clears on restart.'))
      }
      return 1
    }))

    event.register(Commands.literal('trade_test').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      if (!open(p, 'admin')) p.tell(Text.of('§cshe did not open - check the log'))
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'E6 GATED OFF'); return }
    if (AUTO) {
      event.server.scheduleInTicks(SAMPLE_TICKS, function () { sample(event.server) })
      console.info(TAG + 'E6b AUTO-OPEN active - triggers: low health mid-combat, ' +
        'after a death, dry spell >=' + DRY_SPELL_DAYS + 'd. Cooldown ' +
        COOLDOWN_BASE + 't shrinking ' + COOLDOWN_PER_DEBT + 't per debt, floor ' +
        COOLDOWN_FLOOR + 't. ONE roll per window (a lost roll spends it), so the ' +
        'REAL interval is cooldown/chance: ~' +
        Math.round(COOLDOWN_BASE / 20 / 60 / CHANCE_DRY) + ' min at debt 0, ~' +
        Math.round(COOLDOWN_FLOOR / 20 / 60 / CHANCE_DRY) + ' min at the floor.')
    } else {
      console.info(TAG + 'E6b AUTO-OPEN is OFF - /trade_test only')
    }
    var missing = []
    if (!VELDORA.ritual) missing.push('ritual')
    if (!VELDORA.counter) missing.push('counter')
    if (!VELDORA.gunAmmo) missing.push('gunAmmo')
    if (missing.length) {
      console.error(TAG + 'E6 is LIVE but missing: ' + missing.join(', ') +
        ' - trades will refuse rather than half-complete')
    }
    console.info(TAG + 'E6 active - 3 trades, debt on counter "' + PATRON +
      '", sight keeps blindness for ' + SIGHT_SECONDS + 's')
  })
})();
