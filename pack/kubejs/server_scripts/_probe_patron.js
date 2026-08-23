// _probe_patron.js - the patron viability bench.
//
// Ethan, 2026-08-14: "I also want a test command to summon each patron to actually
// see if they're viable in the stalker phase."
//
// A casting has already failed this test once WITHOUT anyone being able to check:
// lord_pumpkinhead was Blade until it turned out to be the only one of six with a
// ServerBossEvent boss bar, and it was recast to fallen_chaos_knight. There was no
// way to see that except by meeting one in the world. This is that way.
//
// PRODUCES NO GAMEPLAY. Nothing here touches notoriety, claims, the Hunt or the
// stalker state map - the entities it makes are TAGGED and disposable.
//
// /patron            - what the six are
// /patron lineup     - all six at once, FROZEN, in a row. The comparison view.
// /patron <key>      - one, LIVE, behind you, under real stalker conditions
// /patron clear      - remove every test entity
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[patron] '
  var MARK = 'veldora_patron_test'

  // Must match CAST in stalker.js. Duplicated deliberately: this file is a bench and
  // must keep working if stalker.js is mid-edit or failed to load.
  var CAST = {
    blade: ['born_in_chaos_v1:fallen_chaos_knight', 'The Challenger'],
    salvage: ['born_in_chaos_v1:dire_hound_leader', 'The Hound'],
    forge: ['born_in_chaos_v1:krampus', 'The Thief'],
    wall: ['born_in_chaos_v1:mother_spider', 'The Mother'],
    crown: ['born_in_chaos_v1:missioner', 'The False King'],
    // Mirrors stalker.js. nightmare_stalker is RESERVED for Caebrim (docs/57) and
    // the true form is cast directly - see the long note on stalker.js's CAST.
    art: ['born_in_chaos_v1:lifestealer_true_form', 'The Taker'],
  }
  var ORDER = ['blade', 'salvage', 'forge', 'wall', 'crown', 'art']

  function tell(p, s) { try { p.tell(Text.of(s)) } catch (e) { } }

  function readStats(e) {
    var bits = []
    try { bits.push('hp=' + Math.round(e.health)) } catch (x) { bits.push('hp=?') }
    try { bits.push('max=' + Math.round(e.getAttribute('minecraft:generic.max_health').getValue())) }
    catch (x) { bits.push('max=?') }
    try { bits.push('atk=' + e.getAttribute('minecraft:generic.attack_damage').getValue()) } catch (x) { }
    try { bits.push('armor=' + e.getAttribute('minecraft:generic.armor').getValue()) } catch (x) { }
    try { if (e.passengers && e.passengers.length) bits.push('MOUNTED') } catch (x) { }
    try { if (e.vehicle) bits.push('RIDING') } catch (x) { }
    return bits.join(' ')
  }

  // The vanilla summon command carries NBT reliably, which matters for the frozen
  // lineup: NoAI is the difference between inspecting six minibosses and being
  // killed by six minibosses. runCommand returns the feedback TEXT (E0 P12b), so
  // unlike runCommandSilent we can actually tell whether it worked (K8).
  function summonFrozen(p, srv, id, name, dx, dz) {
    var cmd = 'summon ' + id + ' ~' + dx + ' ~ ~' + dz +
      ' {NoAI:1b,Silent:1b,PersistenceRequired:1b,Tags:["' + MARK + '"],' +
      'CustomName:\'{"text":"' + name + '","color":"red"}\',CustomNameVisible:1b}'
    try {
      var fb = srv.runCommand('execute as ' + p.username + ' at @s run ' + cmd)
      return String(fb)
    } catch (e) { return 'THREW: ' + e }
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands

    var root = Commands.literal('patron').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      tell(p, '§8§m                                        ')
      tell(p, '§7The six castings:')
      for (var i = 0; i < ORDER.length; i++) {
        var k = ORDER[i]
        tell(p, '  §e' + k + ' §8- §7' + CAST[k][1] + ' §8(' + CAST[k][0] + ')')
      }
      tell(p, '§f/patron lineup §8- all six, frozen, side by side')
      tell(p, '§f/patron <key>  §8- one, live, behind you')
      tell(p, '§f/patron clear  §8- remove them all')
      tell(p, '§8Judge: boss bar? size? does it read as ONE thing or a mob?')
      return 1
    })

    // ---------------------------------------------------------------- lineup
    root = root.then(Commands.literal('lineup').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      tell(p, '§7Six patrons, frozen, in front of you. §8Walk the line.')
      console.info(TAG + '--- lineup for ' + p.username + ' ---')
      for (var i = 0; i < ORDER.length; i++) {
        var k = ORDER[i]
        var fb = summonFrozen(p, srv, CAST[k][0], CAST[k][1], (i - 2.5) * 4, 8)
        console.info(TAG + '  ' + k + ' :: ' + CAST[k][0] + ' -> ' + fb.substring(0, 80))
      }
      tell(p, '§8Look for: a BOSS BAR (that recast Blade once), anything mounted,')
      tell(p, '§8anything too small to read as a patron, anything that looks generic.')
      tell(p, '§f/patron clear§7 when done.')
      return 1
    }))

    // ----------------------------------------------------------------- clear
    root = root.then(Commands.literal('clear').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var fb = ''
      try { fb = String(srv.runCommand('kill @e[tag=' + MARK + ']')) } catch (e) { fb = 'threw' }
      tell(p, '§7Cleared. §8' + fb)
      console.info(TAG + 'clear -> ' + fb)
      return 1
    }))

    // ------------------------------------------------------------- one, live
    Object.keys(CAST).forEach(function (key) {
      root = root.then(Commands.literal(key).executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        var spec = CAST[key]
        var e = null
        try {
          // The stalker.js path: createEntity, stamp, place, spawn. Kept identical
          // so what you meet here is what the Hunt would actually send.
          e = p.level.createEntity(spec[0])
          if (!e) { tell(p, '§cCASTING FAILED - ' + spec[0] + ' did not resolve'); return 0 }
          e.setCustomName(Text.of('§c' + spec[1]))
          e.setCustomNameVisible(true)
          try { e.addTag(MARK) } catch (x) { }
          e.setPosition(p.x, p.y, p.z + 4)
          e.spawn()

          // 🚨 ADOPT IT. The first version of this bench summoned patrons UNOWNED,
          // so isStalker() was false, the "your own stalker cannot hurt you" hard
          // stop never fired, and their minions were never registered - meaning
          // none of the protections that exist in real play applied. It killed
          // Ethan three times in four minutes and the only reason we caught it was
          // a Resistance III that kept re-granting.
          //
          // A bench that does not reproduce live conditions is not a bench.
          if (VELDORA && typeof VELDORA.stalkerAdopt === 'function') {
            VELDORA.stalkerAdopt(p, e, key)
          } else {
            tell(p, '§c⚠ stalker.js seam missing - this patron is UNOWNED and WILL kill you.')
            console.error(TAG + 'VELDORA.stalkerAdopt missing - bench summon is unprotected')
          }
        } catch (ex) {
          tell(p, '§cthrew: ' + ex)
          console.error(TAG + key + ' threw :: ' + ex)
          return 0
        }
        var stats = readStats(e)
        tell(p, '§c' + spec[1] + ' §8(' + key + ')')
        tell(p, '§7' + stats)
        tell(p, '§8LIVE and hostile. §f/patron clear§8 to remove.')
        console.info(TAG + key + ' summoned live :: ' + spec[0] + ' ' + stats)
        return 1
      }))
    })

    event.register(root)
  })

  ServerEvents.loaded(function () {
    console.info(TAG + 'patron bench ready - /patron lineup')
  })
})()
