// forge_events.js — what the Goat sends.  docs/56 §4 · docs/23 (the taxonomy)
//
// ── ⭐ SHE IS THE HELP ROWS, AND THAT IS THE WHOLE FILE ─────────────────────
// docs/23's taxonomy splits every event into five mechanics x two agencies. Kayer is
// structurally the CHOICE COLUMN because she cannot act (art_events.js). Milantros is
// structurally the HELP ROWS, because helping is the only thing she wants to do:
//
//     Challenges  0    she would never send something to hurt you
//     Duels       0    nor offer to
//     Buffs    ++++    ⭐ she gives without being asked. The ONLY god who should
//     Boons    ++++    and asks too, when she remembers to
//     Invade      0    🔑 she does not hurt people
//     Attacks     0    not even by proxy
//     Aids      +++    she helps your friends without asking you first
//     Support   +++    ⭐ nobody else in the pantheon is above + on this row
//     Assassin.   0    -
//     Contracts   0    ⭐ SHE IS THE ONLY GOD WHO NEVER ORDERS A DEATH
//
// ⭐⭐ FOUR KINDS AND NOT ONE OF THEM HARMS ANYBODY. Kayer's four are all ASKED;
// Milantros's four are all HELP. Two gods, four events each, zero overlap - and the
// pantheon finally has a moral spread instead of five shades of demanding.
//
// ⚠️ THE CHART IS MINE, NOT ETHAN'S (docs/56 §4). The SHAPE is derived from his brief
// - "she is fascinated with constructs and will help the player through gifts and
// ideas... Forge gets the most material gifts" - but every number is a proposal.
//
// ── ⭐ SHE BREAKS docs/23's RULE, IN THE OTHER DIRECTION ────────────────────
// The rule is "choice always gives a reward, no choice often gives none", which reads
// as forced = demanding. **She is the only patron who uses the FORCED column
// generously**: she buffs you without asking because it did not occur to her to ask.
// Same mechanic every other god uses to take, pointing the other way.
//
// ── 🚨 THE ONE INVARIANT: NOTHING IN THIS FILE MAY EVER COST A PLAYER ───────
// Not an item, not a debuff, not a death, not a strike against her release counter.
// Ethan's standing constraint - "No we don't take items from players, that is how you
// cause them to quit" - is the floor for everybody; for HER it is the ceiling too.
// A refusal here is free and she says so. If a future editor adds an event with a
// downside, they have written a different god.
//
// ── ⭐ "WILD IDEAS" ARE NOT IN THIS FILE ────────────────────────────────────
// Ethan, 2026-08-22: "wild ideas, these are less real ideas and just her rambling in
// your ear." An earlier draft had her EVENTS allowed to be wrong - the gift slightly
// too strong, the contraption that misfires. Retired. The wildness lives entirely in
// forge_voice.js, where a bad idea costs a line you scroll past. docs/56 §3.
//
// ── HER DOMAIN EFFECT IS HASTE ─────────────────────────────────────────────
// Her counter is BUILDING (blocks placed + crafted + smelted, counter_hooks.js), so
// haste is the one buff that is hers and nobody else's. ⭐ It is also the exact effect
// she used to DENY: grudge.js had her retaliating with mining_fatigue until 2026-08-23,
// which her chart forbids. The effect she cannot take away is the one she hands out.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[forgeev] '
  var GOD = 'forge'
  var GATE = true

  var ALL = ['low', 'medium', 'high']
  var MID_HIGH = ['medium', 'high']

  var BUFF_SECONDS = 300          // her forced notion - generous, because she is
  var GIFT_SECONDS = 420          // the asked gift - more, because you reached for it
  var AID_SECONDS = 240           // what she puts on somebody else's champion

  function wAlways(n) { return function () { return n } }

  function say(p, tag) {
    try { if (VELDORA.voice) return !!VELDORA.voice.say(p, GOD, tag) } catch (e) { }
    return false
  }

  function nameOf(p) { try { return String(p.username) } catch (e) { return null } }

  function give(server, who, effect, secs, amp) {
    var n = nameOf(who)
    if (!n) return false
    try {
      server.runCommandSilent('effect give ' + n + ' ' + effect + ' ' + secs + ' ' + (amp || 0) + ' false')
      return true
    } catch (e) { console.error(TAG + 'effect failed :: ' + e); return false }
  }

  function others(server, p) {
    var out = []
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        try { if (String(ps[i].username) !== String(p.username)) out.push(ps[i]) } catch (e) { }
      }
    } catch (e) { }
    return out
  }

  // Trust is things built. Same thresholds as forge_voice.js - ⚠️ duplicated
  // deliberately-not: read them from the counter, not from a second copy of the
  // numbers, so the two files can never drift the way five boot banners did.
  function tierOf(p) {
    var n = 0
    try { if (VELDORA.counter) { var v = VELDORA.counter.get(p, GOD); if (v !== null) n = v } } catch (e) { }
    return n >= 1200 ? 'high' : (n >= 250 ? 'medium' : 'low')
  }

  // The rival god's title, for {rival} in her lend_ask pool. ⚠️ BORROWED FROM warn.js
  // RATHER THAN COPIED. A second title table is exactly how `crown` ended up missing
  // from warn.js and then missing again from grudge.js hours later.
  function titleOf(god) {
    try { if (VELDORA.warn && VELDORA.warn.titleOf) return VELDORA.warn.titleOf(god) } catch (e) { }
    return String(god || 'somebody')
  }

  function pathOf(p) {
    try { return (VELDORA.paths && VELDORA.paths.pathOf(p)) || '' } catch (e) { return '' }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUFF (forced) — THE NOTION. She had an idea and it is on you now.
  //
  // ⭐ NO SCENE, NO PROMPT, NO OPT-OUT - and it is the friendliest event in the game.
  // Every other forced event in the pantheon is a demand or a hazard.
  // ═══════════════════════════════════════════════════════════════════════════
  function evNotion(server, p) {
    if (VELDORA.ritual && VELDORA.ritual.active(p)) return false     // never over a scene
    var ok1 = give(server, p, 'minecraft:haste', BUFF_SECONDS, 0)
    var ok2 = give(server, p, 'minecraft:regeneration', Math.round(BUFF_SECONDS / 5), 0)
    if (!ok1 && !ok2) return false
    // The line is the event. If the mouth fails the buff still landed, so this
    // reports rather than returning false - "I failed" and "I found nothing" must
    // never share a return value.
    if (!say(p, 'notion')) console.warn(TAG + 'notion landed but she said nothing')
    return true
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BOON (choice) — THE GIFT. She made you something and you have to reach for it.
  //
  // 🚨 REFUSING COSTS NOTHING AND SHE SAYS SO. release.js is NOT called on a refusal:
  // her rule is `never` (see the note in release.js), so there is no counter to strike
  // even if somebody tried. That is belt and braces on purpose.
  // ═══════════════════════════════════════════════════════════════════════════
  function evGift(server, p) {
    if (!VELDORA.ritual || VELDORA.ritual.active(p)) return false
    var tier = tierOf(p)
    var open = 'I made you somethin.'
    try {
      if (VELDORA.voice) open = VELDORA.voice.line(GOD, 'gift_open', p) || open
    } catch (e) { }
    var appraise = ''
    try {
      if (VELDORA.voice) appraise = VELDORA.voice.line(GOD, tier + '_gift', p) || ''
    } catch (e) { }

    var lines = [open]
    if (appraise) lines.push(appraise)

    return VELDORA.ritual.begin(p, {
      lines: lines,
      options: [
        { id: 'yes', label: 'Take it.' },
        { id: 'no', label: 'No thanks.' },
      ],
      holdAfterChoice: 30,
      onChoose: function (player, id) {
        if (id !== 'yes') { say(player, 'gift_left'); return }
        give(server, player, 'minecraft:haste', GIFT_SECONDS, 0)
        give(server, player, 'minecraft:strength', GIFT_SECONDS, 0)
        give(server, player, 'minecraft:absorption', Math.round(GIFT_SECONDS / 2), 0)
        say(player, 'gift_taken')
      },
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AID (forced) — THE KINDNESS. She helps somebody ELSE, unasked, and tells you.
  //
  // ⭐ THE ROW NOBODY ELSE FILLS. docs/56 §4: "she helps your friends without asking
  // you first." It is the only event in Veldora whose effect lands on a player who did
  // not trigger it and is not being punished for anything.
  // ═══════════════════════════════════════════════════════════════════════════
  function evKindness(server, p) {
    if (VELDORA.ritual && VELDORA.ritual.active(p)) return false
    var rest = others(server, p)
    if (!rest.length) return false
    var t = rest[Math.floor(Math.random() * rest.length)]
    if (!nameOf(t)) return false
    var landed = give(server, t, 'minecraft:haste', AID_SECONDS, 0)
    landed = give(server, t, 'minecraft:regeneration', Math.round(AID_SECONDS / 4), 0) || landed
    if (!landed) return false
    say(p, 'notion_aid')                     // she tells YOU what she did for them
    say(t, 'notion')                         // and tells THEM, in her own voice
    console.info(TAG + nameOf(p) + ' watched her do a kindness for ' + nameOf(t))
    return true
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPORT (choice) — THE LEND. Go and help somebody who is not yours.
  //
  // ⭐ SHE ASKS, AND THEN SHE TRUSTS YOU. The buff lands on the other champion the
  // moment you say yes - she does not check, follow up, or verify, because verifying
  // would make it a contract and she does not do those. Kayer's `preserve` is the same
  // mechanic run by somebody who wants something from it.
  // ═══════════════════════════════════════════════════════════════════════════
  function evLend(server, p) {
    if (!VELDORA.ritual || VELDORA.ritual.active(p)) return false
    var rest = others(server, p)
    if (!rest.length) return false
    var t = rest[Math.floor(Math.random() * rest.length)]
    var tname = nameOf(t)
    if (!tname) return false

    var ask = "Somebody out there's stuck, an' you're the only one I got to ask."
    try {
      if (VELDORA.voice) {
        var raw = VELDORA.voice.line(GOD, 'lend_ask', p)
        // ⚠️ {rival} MUST be substituted here or it prints literally. Her pool uses
        // the same placeholder warn.js does, and the title comes from warn.js's table.
        if (raw) ask = raw.split('{rival}').join(titleOf(pathOf(t)) || 'somebody')
      }
    } catch (e) { }

    return VELDORA.ritual.begin(p, {
      lines: [ask, tname + ' is the one I mean.'],
      options: [
        { id: 'yes', label: "I'll go." },
        { id: 'no', label: 'No.' },
      ],
      holdAfterChoice: 30,
      onChoose: function (player, id) {
        if (id !== 'yes') { say(player, 'lend_no'); return }
        give(server, t, 'minecraft:regeneration', 60, 0)
        give(server, t, 'minecraft:absorption', AID_SECONDS, 0)
        say(player, 'lend_done')
        console.info(TAG + nameOf(player) + ' agreed to help ' + tname + ' - buff sent, unverified, on purpose')
      },
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'the Goat is GATED OFF'); return }
    if (!VELDORA.events) { console.error(TAG + 'godevents.js missing'); return }

    VELDORA.events.register(GOD, {
      id: 'notion', kind: 'buff', run: evNotion, hostile: false,
      cooldown: 1, weight: wAlways(4), tiers: ALL,
      does: 'BUFF (forced) - haste + regeneration, UNASKED. The friendliest forced ' +
        'event in the game',
    })
    VELDORA.events.register(GOD, {
      id: 'gift', kind: 'boon', scene: true, run: evGift, hostile: false,
      cooldown: 1, weight: wAlways(4), tiers: ALL,
      does: 'BOON (choice) - haste + strength + absorption, ASKED. Refusing costs ' +
        'nothing and she says so',
    })
    VELDORA.events.register(GOD, {
      id: 'kindness', kind: 'aid', run: evKindness, hostile: false,
      cooldown: 2, weight: wAlways(3), tiers: MID_HIGH,
      does: 'AID (forced) - she buffs ANOTHER player, unasked, and tells you both',
    })
    VELDORA.events.register(GOD, {
      id: 'lend', kind: 'support', scene: true, run: evLend, hostile: false,
      cooldown: 2, weight: wAlways(3), tiers: MID_HIGH,
      does: 'SUPPORT (choice) - she asks you to help a RIVAL champion, then trusts ' +
        'you without checking',
    })

    // ⚠️ Deferred a tick. paths.js's boot validator once killed the file it was
    // protecting by running in the script body, and killorder.js reported "NOBODY
    // YET" for weeks because it read a registry later files fill.
    event.server.scheduleInTicks(1, function () {
      var reg = []
      try { reg = (VELDORA.events.registry && VELDORA.events.registry[GOD]) || [] } catch (e) { }
      // Derived from what actually registered, never restated - five banners lied in
      // one day this month by hardcoding a rule another file owned.
      var ids = []
      for (var i = 0; i < reg.length; i++) ids.push(reg[i].id + '(' + (reg[i].kind || '?') + ')')
      console.info(TAG + 'The Goat sends ' + reg.length + ': ' + ids.join(', ') + '.')
      console.info(TAG + 'she will NEVER do: challenges, duels, invasions, attacks, ' +
        'assassinations, contracts. SIX ZEROES, and they are the entire harmful half ' +
        'of docs/23. She is the only god who never orders a death - and the only one ' +
        'whose FORCED column is generous. Chart proposed by Claude (docs/56 s4), ' +
        'wants Ethan\'s pass.')
    })
  })
})();
