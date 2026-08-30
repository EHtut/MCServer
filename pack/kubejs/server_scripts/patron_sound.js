// patron_sound.js — the gods make a noise.
//
// Ethan's design note, `23` PART V.7 §5, carried unbuilt for weeks:
//     "a patron has never made a noise."
//
// Measured 2026-08-24 and it was still exactly true: `playsound` appeared TWICE in the
// entire tree, both inside tide.js, and neither was a patron. Every god in this game
// has spoken thousands of lines into total silence.
//
// ── WHAT THIS DOES ──────────────────────────────────────────────────────────────
// One sound per god, in two tiers, hung off the single point every patron utterance
// already passes through (`voice.say` / `voice.sayAbout`).
//
//   PRESENCE  ordinary talk - idle lines, whispers, small acknowledgements.
//             Quiet, and RATE-LIMITED per player per god, because the idle roll alone
//             can speak several times a minute and a chime on every one of them stops
//             being atmosphere and becomes a notification sound.
//   MOMENT    the beats where the world actually changed - an offer, a gift, a Trial,
//             a warning, an arrival. Louder, distinct, and NEVER rate-limited.
//
// 🔑 THE TIERS EXIST BECAUSE A SOUND THAT ALWAYS PLAYS CARRIES NO INFORMATION. If
// every line chimed, the chime would mean "text appeared" - which the player can
// already see. Splitting them means the loud one means something.
//
// ── ⚠️ THE SOUND IDS ARE UNVERIFIED, AND THAT IS NOT LAZINESS ────────────────────
// `/playsound` CANNOT BE PROBED. Measured against the running server on 2026-08-24,
// three different ways:
//
//   playsound minecraft:definitely.not.a.real.sound master @a[tag=nobody]
//     -> "No player was found"            <- IDENTICAL to a real sound
//   playsound minecraft:definitely.not.a.real.sound master Lehykt 0 -5000 0 1 1
//     -> "The sound is too far away"      <- IDENTICAL to a real sound
//
// The sound id is a ResourceLocation resolved CLIENT-side; the server accepts any
// string and plays nothing if the client does not know it. There is no server-side
// answer to "is this sound real", so a fake id and a real id are indistinguishable
// from rcon. **Silence is the failure mode, and silence is also the state we are
// leaving** - which is precisely the shape of bug this project keeps finding.
//
// 🚨 SO TWO GUARDS, because "cannot verify" is not "ship it and hope":
//   1. VANILLA IDS ONLY. Not one mod sound, however good the fit. A vanilla id that
//      has existed for years is the only thing that can be trusted without a probe.
//   2. `/patronsound` PLAYS ALL OF THEM AT YOU, on demand. That is the same answer
//      _probe_patron.js gave to the same problem - "there was no way to see that
//      except by meeting one in the world. This is that way." Run it once and the
//      unverifiable becomes verified by ear.
//
// /patronsound            - every god, presence then moment, spaced out
// /patronsound <god>      - one god, both tiers
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[sound] '

  // ⭐ ON, with a live consumer, from the first boot. A gate that ships off is a
  // feature nobody has: this project's own standing rule is that built-in-shadow is
  // unfinished. Flip it to false and voice.js falls back to exactly what it did
  // before this file existed - the chime is additive and nothing depends on it.
  var ENABLED = true

  // Per (player, god). A presence chime is suppressed if one played recently; a
  // MOMENT ignores this entirely.
  var PRESENCE_GAP_MS = 45000

  // ── the voices ────────────────────────────────────────────────────────────────
  // [id, volume, pitch]. Volumes are deliberately low: this plays in the player's own
  // ear on every line, and the tide already owns the loud end of the mix.
  //
  // ⚠️ CHARACTER, NOT DECORATION. Each one had to answer "what does it sound like
  // when THIS god is in the room", and the moment tier had to be recognisable from
  // the presence tier without being a different instrument.
  var SOUNDS = {
    // The Warrior. Iron, and the weight of it. His moment is a struck anvil - the
    // most declarative noise in the game, which is how he talks.
    blade: {
      presence: ['minecraft:item.armor.equip_iron', 0.35, 0.7],
      moment: ['minecraft:block.anvil.land', 0.55, 0.9],
      // ENRAGED - the same anvil, lower and harder. He does not find a new noise when
      // he loses his temper; the one he already had gets heavier.
      enraged: ['minecraft:block.anvil.destroy', 0.7, 0.7],
    },
    // The Mother. Something with too many legs is nearby and has been for a while.
    // Her presence is a STEP, so she reads as approaching rather than announcing.
    wall: {
      presence: ['minecraft:entity.spider.step', 0.4, 0.6],
      moment: ['minecraft:entity.spider.ambient', 0.55, 0.5],
      // ENRAGED - not a bigger spider. MANY. Her fury is always numbers.
      enraged: ['minecraft:entity.spider.hurt', 0.75, 0.6],
    },
    // ⭐ RE-AUTHORED 2026-08-29. Ethan: "salvage's lines should be a wolf growling,
    // trinkets, etc." She was a shopkeeper - chain and a villager trade note - and a
    // shopkeeper is not what she is. She is a SCAVENGER STANDING OVER A HOARD.
    //
    // The growl carries the presence because it plays on every line: she is territorial
    // by default, before she has said anything. The chime carries the moment because her
    // moments are DEALS, and a deal closing should sound like small valuable objects
    // moving. Same instrument family as before, opposite posture.
    salvage: {
      presence: ['minecraft:entity.wolf.growl', 0.4, 0.85],
      moment: ['minecraft:block.amethyst_block.chime', 0.55, 1.1],
      // ENRAGED - the growl stops being ambient and commits.
      enraged: ['minecraft:entity.wolf.hurt', 0.75, 0.8],
    },
    // The Goat. Warm, busy, makes things. Her moment is literally a goat, which is
    // the least frightening sound in the pantheon and entirely correct for her -
    // she is the only god whose FORCED column is generous.
    forge: {
      presence: ['minecraft:block.wood.place', 0.4, 1.2],
      moment: ['minecraft:entity.goat.ambient', 0.55, 0.9],
      // ENRAGED - a goat SCREAM. ⭐ The funniest and most upsetting sound available,
      // which is exactly right for the one god who is never cruel losing her temper.
      enraged: ['minecraft:entity.goat.screaming.ambient', 0.7, 1.0],
    },
    // ⭐ RE-AUTHORED 2026-08-29. Ethan: "Art is horror cave sounds btw." She had
    // amethyst and a beacon - cold and tuned, which read as CELESTIAL. She is not
    // celestial. She is "just Kayer, and she is already secretly aligned with the
    // goddess of death", and she is her own antagonist.
    //
    // 🔑 ambient.cave is the sound every player has already learned to dismiss, and
    // that is exactly why it is hers: her presence is indistinguishable from the thing
    // you told yourself was nothing. Pitched down so it is subtly WRONG rather than
    // merely ambient. The shriek carries her moments because a sculk shrieker is the
    // game's only sound that means "you have been noticed".
    art: {
      presence: ['minecraft:ambient.cave', 0.4, 0.7],
      moment: ['minecraft:block.sculk_shrieker.shriek', 0.45, 0.85],
      // ENRAGED - she does not raise her voice, so it CANNOT be loud. The cave gets
      // deeper and closer instead. Her anger is a change in pressure.
      enraged: ['minecraft:ambient.cave', 0.8, 0.4],
    },
    // Retired into Wall at the world reset (`34` §0c). Kept so anyone still holding
    // the key sounds like something rather than nothing.
    crown: {
      presence: ['minecraft:block.amethyst_block.chime', 0.3, 0.7],
      moment: ['minecraft:block.beacon.power_select', 0.45, 0.8],
    },
  }

  // ── which tags are MOMENTS ────────────────────────────────────────────────────
  // 🚨 SUBSTRING MATCH, ON PURPOSE, and it is the reason this list is short. Tags are
  // built dynamically in several places ('demand_' + path, 'ev_' + id), so an exact
  // list would silently miss the generated ones - which is finding K-13 wearing a new
  // hat. Matching on the meaningful STEM catches the family.
  //
  // ⚠️ ANYTHING NOT LISTED IS PRESENCE. That is the safe default: the worst case for
  // a mis-classified tag is that a big beat sounds quiet, never that ordinary chatter
  // becomes a siren.
  var MOMENT_STEMS = [
    'offer',        // every ask: wager_offer, contract_offer, harvest_offer, ev_*_offer
    'harvest',      // the Trial, under its old name
    'trial',
    'gift',         // low_gift / medium_gift / high_gift - the ladder
    'boon',
    'warn',         // warn_incoming / warn_wave - the tell before something arrives
    'cut_down',
    'arrival',
    'argue',        // the pantheon talking about you
    'declare',      // mark_declare and its kin
    'paid',
    'won',
    'lost',
  ]

  function isMoment(tag) {
    if (!tag) return false
    var t = String(tag)
    for (var i = 0; i < MOMENT_STEMS.length; i++) {
      if (t.indexOf(MOMENT_STEMS[i]) !== -1) return true
    }
    return false
  }

  // ── playing it ────────────────────────────────────────────────────────────────
  var lastPresence = {}          // uuid|god -> ms. In memory: a repeat across a
                                 // restart is not worth persisting state for, which
                                 // is the same call voice.js made for lastSaid.

  function fire(player, spec) {
    if (!spec) return false
    var name = null, srv = null
    try {
      name = String(player.username)
      srv = player.server
    } catch (e) { return false }
    if (!name || !srv) return false
    try {
      // Same shape tide.js proved on this server: run AS the player AT their own
      // position, so it is in their ear and nobody else's. `player` category rather
      // than `master` so it rides the right slider and a player who has turned that
      // channel down is respected.
      srv.runCommandSilent('execute as ' + name + ' at @s run playsound ' +
        spec[0] + ' player @s ~ ~ ~ ' + spec[1] + ' ' + spec[2])
      return true
    } catch (e) { return false }
  }

  // The one entry point. Returns true only if a sound was actually issued, so a
  // caller can tell "played" from "suppressed" - "I failed" and "I found nothing"
  // must never share a return value.
  // ⭐⭐ THREE REGISTERS. Ethan, 2026-08-30: *"Normal, Heightened, Enraged."*
  //
  // The file already had two - PRESENCE (ordinary talk) and MOMENT (the beats where the
  // world changed). Those are his first two under different names, so this adds the
  // third rather than rebuilding the ladder.
  //
  //     NORMAL      presence   idle lines, whispers. Rate-limited: a chime on every
  //                            line means "text appeared", which you can already see.
  //     HEIGHTENED  moment     an offer, a gift, a Trial, a warning, an arrival.
  //     ENRAGED     enraged    a crashout, a reprisal, an argument. Never rate-limited.
  //
  // ⚠️ THE MOD'S OWN `sound` FLAG IS NOT USED and cannot be: the command maps it to a
  // single fixed SoundEffect.LOWSHORT with no choice, so three registers are impossible
  // through it. These are our own /playsound calls, which is better anyway - the sound
  // can be per god AND per register.
  var ENRAGED_STEMS = ['crashout', 'reprisal', 'argue', 'lash', 'strike', 'fury']

  function isEnraged(tag) {
    if (!tag) return false
    var t = String(tag)
    for (var i = 0; i < ENRAGED_STEMS.length; i++) {
      if (t.indexOf(ENRAGED_STEMS[i]) !== -1) return true
    }
    return false
  }

  function play(player, god, tag) {
    if (!ENABLED) return false
    var s = SOUNDS[god]
    if (!s) return false

    // 🚨 ENRAGED FIRST. `crashout` would also match a MOMENT stem if one were added
    // later, and the loudest register must never be quietly downgraded by ordering.
    if (isEnraged(tag) && s.enraged) return fire(player, s.enraged)
    if (isMoment(tag)) return fire(player, s.moment)

    var key = null
    try { key = String(player.uuid) + '|' + god } catch (e) { return false }
    var now = 0
    try { now = new Date().getTime() } catch (e) { return false }
    if (lastPresence[key] && (now - lastPresence[key]) < PRESENCE_GAP_MS) return false
    lastPresence[key] = now
    return fire(player, s.presence)
  }

  VELDORA.patronSound = {
    play: play,
    isMoment: isMoment,
    isEnraged: isEnraged,
    sounds: SOUNDS,
    enabled: function () { return ENABLED },
  }

  // ── the bench ─────────────────────────────────────────────────────────────────
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands || null
    if (!Commands) return

    function playAll(p, only) {
      var order = ['blade', 'wall', 'salvage', 'forge', 'art', 'crown']
      var delay = 0
      for (var i = 0; i < order.length; i++) {
        var g = order[i]
        if (only && g !== only) continue
        ;(function (god, d) {
          try {
            p.server.scheduleInTicks(d, function () {
              try {
                p.tell(Text.of('§8' + god + ' §7presence'))
                fire(p, SOUNDS[god].presence)
              } catch (e) { }
            })
            p.server.scheduleInTicks(d + 30, function () {
              try {
                p.tell(Text.of('§8' + god + ' §f§lMOMENT'))
                fire(p, SOUNDS[god].moment)
              } catch (e) { }
            })
          } catch (e) { }
        })(g, delay)
        delay += 70
      }
      return delay
    }

    event.register(Commands.literal('patronsound')
      .executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        p.tell(Text.of('§8§m                                        '))
        p.tell(Text.of('§7Every god, §fpresence§7 then §f§lMOMENT§7.'))
        p.tell(Text.of('§8These ids cannot be verified from the server - if one of ' +
          'them is silent, it does not exist. That is the whole point of this command.'))
        playAll(p, null)
        return 1
      })
      .then(Commands.argument('god', event.arguments.STRING.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          var g = null
          try {
            g = String(ctx.getArgument('god', Java.loadClass('java.lang.String')))
          } catch (e) { }
          if (!g || !SOUNDS[g]) {
            try {
              p.tell(Text.of('§cNo such god. One of: blade, wall, salvage, forge, art, crown'))
            } catch (e) { }
            return 0
          }
          playAll(p, g)
          return 1
        })))
  })

  ServerEvents.loaded(function () {
    var n = 0
    for (var k in SOUNDS) { if (SOUNDS.hasOwnProperty(k)) n++ }
    console.info(TAG + 'THE GODS HAVE A VOICE THAT IS NOT WORDS - ' + n +
      ' gods, two tiers (presence rate-limited to one per ' +
      Math.round(PRESENCE_GAP_MS / 1000) + 's per god; moments never limited). ' +
      'Hung off voice.say/sayAbout, so every patron line routes through it.')
    console.info(TAG + '⚠ THE IDS ARE UNVERIFIABLE FROM HERE - playsound accepts ' +
      'any ResourceLocation and resolves it client-side, so a fake id and a real one ' +
      'are byte-identical over rcon (probed three ways 2026-08-24). Vanilla-only, and ' +
      'run /patronsound to check them BY EAR. A silent god means a wrong id.')
  })
})();
