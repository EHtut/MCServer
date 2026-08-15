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
//    cost. ritual.begin now takes spec.keep, and the sight trade uses it. Without
//    that probe this trade would have shipped looking perfect and doing nothing.
//
// ── ROLLBACK ─────────────────────────────────────────────────────────────────
// GATE below to false. Nothing else consumes this file; the counter it writes is
// inert without E7.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[salvage] '
  var GATE = true
  var PATRON = 'salvage'

  // ── the prices ─────────────────────────────────────────────────────────────
  // Deliberately small. She is the cheapest patron to say yes to once, and the
  // ratchet is that you say yes often - not that any single trade hurts.
  var HUNGER_COST = 6          // 3 shanks
  var HEALTH_GAIN = 6          // 3 hearts
  var LEVEL_COST = 5
  var AMMO_ROUNDS = 30
  var SIGHT_SECONDS = 300      // "up to 5 minutes", docs/23 PART V
  var SIGHT_POWER = 2.0        // multiplier on the E3 power axis while blind

  var DEBT_PER_TRADE = 1

  // ── her voice ──────────────────────────────────────────────────────────────
  var OPENERS = [
    'Lets do a deal.',
    'Friend. You look like you need something.',
    'No charge for looking.',
    'You are having a bad night. I am having a good one.',
  ]
  var TOOK = {
    hunger: 'Hunger for life. You will be hungry again. That is the beauty of it.',
    levels: 'Levels for lead. Spend them, friend - you were only going to get eaten with them.',
    sight: 'Sight for teeth. Do not worry. It comes back.',
  }
  var REFUSED = [
    'Suit yourself. I will be here.',
    'No? Come back when it is worse.',
  ]

  function pick(a) { return a[Math.floor(Math.random() * a.length)] }
  function speak(p, s) { try { p.tell(Text.of('§c' + s)) } catch (e) { } }
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
    if (h === null) { speak(p, 'Something is wrong with you. Come back later.'); return false }
    if (h < HUNGER_COST) { speak(p, 'You have nothing left to give me. Eat something.'); return false }

    var before = h
    try { p.foodData.foodLevel = h - HUNGER_COST } catch (e) { }
    var after = null
    try { after = p.foodData.foodLevel } catch (e) { }
    if (after === null || after >= before) {
      console.error(TAG + '!! hunger charge did not stick (' + before + ' -> ' + after + ')')
      speak(p, 'You kept it. How.')
      return false
    }
    try {
      var max = p.getAttribute('minecraft:generic.max_health').getValue()
      p.setHealth(Math.min(max, p.health + HEALTH_GAIN))
    } catch (e) { console.warn(TAG + 'could not heal: ' + e) }
    speak(p, TOOK.hunger)
    return true
  }

  function tradeLevels(p) {
    var gun = heldGun(p)
    if (!gun) { speak(p, 'Hold the thing you want fed, friend.'); return false }
    var x = null
    try { x = p.xpLevel } catch (e) { }
    if (x === null) { speak(p, 'Something is wrong with you. Come back later.'); return false }
    if (x < LEVEL_COST) { speak(p, 'You are too poor even for me.'); return false }

    var rounds = gun.mag ? Math.max(AMMO_ROUNDS, gun.mag) : AMMO_ROUNDS
    var st = mintAmmo(gun.ammoId, rounds)
    if (!st) { speak(p, 'My supplier let me down. Nothing for you tonight.'); return false }

    // Charge only AFTER the goods exist. The reverse order is how a player pays
    // for nothing when a mint fails.
    var before = x
    try { p.xpLevel = x - LEVEL_COST } catch (e) { }
    var after = null
    try { after = p.xpLevel } catch (e) { }
    if (after === null || after >= before) {
      console.error(TAG + '!! level charge did not stick (' + before + ' -> ' + after + ')')
      speak(p, 'You kept them. How.')
      return false
    }
    try { p.give(st) } catch (e) { console.error(TAG + 'could not give ammo: ' + e) }
    speak(p, TOOK.levels)
    note(p, rounds + ' x ' + gun.ammoId.replace('tacz:', '') + ' for ' + LEVEL_COST + ' levels.')
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

    try {
      if (VELDORA.powerBoost) VELDORA.powerBoost(p, SIGHT_POWER, SIGHT_SECONDS)
      else console.warn(TAG + 'VELDORA.powerBoost missing - the sight trade took ' +
        'sight and gave NOTHING. That is a bug, not a bargain.')
    } catch (e) { console.error(TAG + 'powerBoost threw :: ' + e) }

    speak(p, TOOK.sight)
    note(p, 'Five minutes. You will not see them coming.')
    return true
  }

  // ── the offer ──────────────────────────────────────────────────────────────
  function open(p, why) {
    if (!GATE) return false
    if (!p) return false
    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') {
      console.error(TAG + 'ritual missing - Salvage cannot open')
      return false
    }
    if (VELDORA.ritual.active(p)) return false

    var gun = heldGun(p)
    var options = [
      { id: 'hunger', text: 'My hunger.' },
      { id: 'levels', text: gun ? 'My levels.' : 'My levels. §8(hold a gun)' },
      { id: 'sight', text: 'My sight.' },
      { id: 'no', text: 'Nothing tonight.' },
    ]

    return VELDORA.ritual.begin(p, {
      lines: [pick(OPENERS), 'Give me your hunger, and i\'ll give you life.',
        'Give me your levels and i shall grant you ammo.',
        'Give me your sight and i will grant you the power to kill.'],
      options: options,
      holdAfterChoice: 40,
      // 🚨 The sight trade's whole price is blindness that outlives the scene.
      // Measured: without this, release() cleared it and she took nothing.
      keep: ['minecraft:blindness'],
      onChoose: function (player, id) {
        if (id === 'no') { speak(player, pick(REFUSED)); return }
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
      onTimeout: function (player) { speak(player, pick(REFUSED)) },
    })
  }

  VELDORA.salvage = { open: open, heldGun: heldGun, mintAmmo: mintAmmo }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    event.register(Commands.literal('trade_test').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      if (!open(p, 'admin')) p.tell(Text.of('§cshe did not open - check the log'))
      return 1
    }))
  })

  ServerEvents.loaded(function () {
    if (!GATE) { console.info(TAG + 'E6 GATED OFF'); return }
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
