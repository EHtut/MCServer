// _probe_intro.js - I0 of the Introductions build.  docs/26-INTRODUCTIONS.md
//
// NOTHING IS BUILT UNTIL THE APIS ARE PROVEN.  Same law as E0.
//
// E0 earned this file. It caught two defects that had ALREADY SHIPPED: the K8
// hunter-prune that would have stripped a working hunter on its first run because
// runCommandSilent returns undefined for valid AND invalid commands, and the K7
// placeBehind fix that threw TypeError on every single call because .isAir() does
// not exist on a block. Both looked correct. Both were dead.
//
// Introductions rest on FOUR assumptions, and three later chunks depend on them:
//
//   J1  an item can be built and given WITH COMPONENTS from KubeJS
//   J2  those components can be READ BACK off a stack in an inventory
//   J3  Mending/Unbreaking actually apply to a TaCZ gun and to the Dark Warblade
//   J4  a timed, rooted prompt survives the player logging out mid-scene
//
// If J1 fails, Salvage has nothing to hand over and the flagship system does not
// exist. If J3 fails, two gift lines promise a durability behaviour the items
// cannot do. If J4 fails, a player who disconnects during a 30s blind scene comes
// back blind, slowed and rooted - the worst bug this system could ship.
//
// Two halves, because most of this needs a player and an inventory:
//   BOOT       - registry + capability checks, needs nobody
//   /introprobe - ADMIN, run in game. Subcommands: give / read / ench / logout
//
// Read the results, write them into docs/26 SS I0, then DELETE THIS FILE.
// PRODUCES NO GAMEPLAY. Gives items only when explicitly asked to.
;(function () {
  var TAG = '[iprobe] '

  // The flagship set. Ids taken from docs/26, EXCEPT the two TaCZ rows, which are
  // copied from our own tacz_loot_injectors - the only form proven to work in this
  // pack. Note the docs are WRONG about the ammo: it is `tacz:ammo` carrying an
  // AmmoId component, not an item called `tacz:12g`.
  var GUN = 'tacz:modern_kinetic_gun'
  var GUN_DATA = '{GunId:"tacz:db_short",GunFireMode:"SEMI"}'
  var AMMO = 'tacz:ammo'
  var AMMO_DATA = '{AmmoId:"tacz:12g"}'

  var FLAGSHIPS = [
    ['forge', 'create:wrench'],
    ['blade', 'born_in_chaos_v1:darkwarblade'],
    ['art', 'ars_nouveau:enchanters_sword'],
    ['crown', 'goety:dark_wand'],
    ['wall', 'securitycraft:universal_block_reinforcer_lvl1'],
    ['salvage', GUN],
    ['salvage-ammo', AMMO],
  ]

  function say(id, verdict, detail) {
    console.info(TAG + id + ': ' + verdict + (detail ? '  ' + detail : ''))
  }

  // The damage listener below is DISARMED by default and stays that way unless
  // /introprobe xp is run. A probe that logs on every hit in normal play is a
  // performance problem and a log flood, and this one also WRITES damage - which
  // must never happen to somebody who did not ask for it.
  var ARMED_UNTIL = 0
  var ATTR_MOD = '[minecraft:attribute_modifiers={modifiers:[{type:"minecraft:generic.attack_damage",' +
    'id:"mcserver:xp_coupling",amount:5,operation:"add_value",slot:"mainhand"}]}]'
  function nowTick(p) { try { return p.level.time } catch (e) { return 0 } }

  function tell(p, s) { try { p.tell(Text.of(s)) } catch (e) { } }

  // Try a list of [label, fn] and report which one answered. The E0 pattern: in
  // this Rhino, several accessors differ from what the docs claim, and a throw is
  // information rather than a failure.
  function firstThatWorks(id, cands, validate) {
    var tried = []
    for (var i = 0; i < cands.length; i++) {
      try {
        var v = cands[i][1]()
        if (validate ? validate(v) : (v !== undefined && v !== null)) {
          say(id, 'OK', 'via ' + cands[i][0] + '  -> ' + String(v).substring(0, 90))
          return { ok: true, how: cands[i][0], value: v }
        }
        tried.push(cands[i][0] + '=falsy')
      } catch (e) {
        tried.push(cands[i][0] + '=threw')
      }
    }
    say(id, 'FAILED', 'no candidate answered  [' + tried.join(', ') + ']')
    return { ok: false }
  }

  // ==========================================================================
  // BOOT - does every flagship item actually EXIST in this pack?
  //
  // Cheapest possible finding and the one most likely to bite: five of the six
  // ids were read out of mod jars rather than typed from memory, but the sixth
  // (create:wrench) was not, and a wrong id here fails as AIR - a patron solemnly
  // hands you nothing and no error is logged anywhere.
  // ==========================================================================
  ServerEvents.loaded(function () {
    console.info(TAG + '=== I0 BOOT ===')
    for (var i = 0; i < FLAGSHIPS.length; i++) {
      var path = FLAGSHIPS[i][0], id = FLAGSHIPS[i][1]
      try {
        var st = Item.of(id)
        var empty = false
        try { empty = st.isEmpty() } catch (e) { }
        var idBack = ''
        try { idBack = String(st.id) } catch (e) { }
        if (empty || idBack === 'minecraft:air') {
          say('J0.' + path, 'MISSING', id + ' resolved to AIR - the patron would give nothing')
        } else {
          var dur = ''
          try { dur = ' maxDamage=' + st.getMaxDamage() } catch (e) { dur = ' maxDamage=UNREADABLE' }
          say('J0.' + path, 'OK', idBack + dur)
        }
      } catch (e) {
        say('J0.' + path, 'THREW', id + ' :: ' + e)
      }
    }

    // ------------------------------------------------------------------------
    // J1 - THE CONSTRUCTION MATRIX.
    //
    // Round 1 of this probe reported "J1 FAILED, no candidate answered" and that
    // conclusion was NOT SAFE. firstThatWorks judged each stack with
    // String(v).indexOf('db_short'), so a stack that constructed perfectly well
    // but whose toString does not render components was scored a failure. That is
    // the measure-at-the-wrong-place error, the same one behind K-4a and K-12.
    //
    // So: no validator. Build every way, read every way, PRINT EVERYTHING, and
    // let the log say which cell contains the gun id. A matrix cannot lie by
    // collapsing two different outcomes into one falsy.
    //
    // The control row matters as much as the subject. minecraft:diamond_sword
    // with a known damage component proves whether an ACCESSOR works at all -
    // without it, "every reader returned nothing" is ambiguous between "the
    // readers are wrong" and "the stack really is bare".
    // ------------------------------------------------------------------------
    var builders = [
      ['A bracket+ns  ', function () { return Item.of(GUN + '[minecraft:custom_data=' + GUN_DATA + ']') }],
      ['B bracket-ns  ', function () { return Item.of(GUN + '[custom_data=' + GUN_DATA + ']') }],
      ['C of(id,nbt)  ', function () { return Item.of(GUN, GUN_DATA) }],
      ['D withNBT     ', function () { return Item.of(GUN).withNBT({ GunId: 'tacz:db_short' }) }],
      ['E set()       ', function () { var s = Item.of(GUN); s.set('minecraft:custom_data', { GunId: 'tacz:db_short' }); return s }],
      ['F objectform  ', function () { return Item.of({ id: GUN, components: { 'minecraft:custom_data': { GunId: 'tacz:db_short' } } }) }],
      ['G CONTROL-dmg ', function () { return Item.of('minecraft:diamond_sword[minecraft:damage=7]') }],
    ]
    var readers = [
      ['String()', function (s) { return String(s) }],
      ['toItemString', function (s) { return s.toItemString() }],
      ['componentString', function (s) { return s.componentString }],
      ['getComponentString', function (s) { return s.getComponentString() }],
      ['components', function (s) { return s.components }],
      ['get(custom_data)', function (s) { return s.get('minecraft:custom_data') }],
      ['nbt', function (s) { return s.nbt }],
    ]
    console.info(TAG + '--- J1 construction matrix ---')
    for (var b = 0; b < builders.length; b++) {
      var st = null, err = null
      try { st = builders[b][1]() } catch (e) { err = String(e) }
      if (!st) { console.info(TAG + '  ' + builders[b][0] + ' BUILD THREW: ' + String(err).substring(0, 110)); continue }
      var cells = []
      for (var r = 0; r < readers.length; r++) {
        var out
        try {
          var v = readers[r][1](st)
          out = (v === undefined || v === null) ? 'null' : String(v)
          if (out.length > 62) out = out.substring(0, 62) + '..'
        } catch (e) { out = 'THREW' }
        cells.push(readers[r][0] + '=' + out)
      }
      console.info(TAG + '  ' + builders[b][0] + ' | ' + cells.join(' | '))
    }

    // ------------------------------------------------------------------------
    // J3 - ENCHANTABILITY, answered at boot rather than by hand.
    //
    // Round 2 made this testable without a player: components round-trip, so the
    // question "will this item hold Mending" is answerable by setting it and
    // reading it back. Two routes, because they are different claims:
    //   .enchant()  - the API a build would call
    //   component   - force-setting, which is what a GRANTED flagship really does
    //
    // maxDamage is printed beside it because an enchantment that is present on an
    // item with NO DURABILITY is decoration. Boot round 1 already showed the TaCZ
    // gun at maxDamage=0, so "Mending applied" would be a meaningless pass there
    // and the two facts have to be read together.
    // ------------------------------------------------------------------------
    console.info(TAG + '--- J3 enchantability ---')
    for (var f = 0; f < FLAGSHIPS.length; f++) {
      var lbl = FLAGSHIPS[f][0], iid = FLAGSHIPS[f][1]
      if (lbl === 'salvage-ammo') continue
      var bits = []
      try { bits.push('maxDmg=' + Item.of(iid).getMaxDamage()) } catch (e) { bits.push('maxDmg=?') }

      // route 1: the API
      try {
        var s1 = Item.of(iid)
        s1.enchant('minecraft:mending', 1)
        var c1 = String(s1.componentString)
        bits.push('enchant()=' + (c1.indexOf('mending') >= 0 ? 'HELD' : 'call-ok-but-ABSENT'))
      } catch (e) { bits.push('enchant()=THREW') }

      // route 2: force the component, the way a granted flagship would
      try {
        var s2 = Item.of(iid + '[minecraft:enchantments={levels:{"minecraft:mending":1,"minecraft:unbreaking":3}}]')
        var c2 = String(s2.componentString)
        bits.push('component=' + (c2.indexOf('mending') >= 0 ? 'HELD' : 'ABSENT'))
      } catch (e) { bits.push('component=THREW') }

      say('J3.' + lbl, 'RESULT', bits.join('  '))
    }

    // ------------------------------------------------------------------------
    // J5 / J6 - THE XP COUPLING.  docs/29-THE-XP-COUPLING.md
    //
    // Ethan wants the flagships to scale damage off experience. Route B writes
    // minecraft:attribute_modifiers onto the stack, which is the only route where
    // the number SHOWS ON THE ITEM - this codebase has a standing legibility law.
    //
    // Two different claims, and conflating them is exactly the I0 mistake:
    //   J5a  the component can be WRITTEN and read back   <- provable at boot
    //   J5b  the game APPLIES it to a real swing          <- needs a player
    // A stack that holds a modifier it does not honour looks identical to success
    // from here, so J5a passing proves nothing on its own and says so.
    // ------------------------------------------------------------------------
    console.info(TAG + '--- J5 attribute_modifiers on a stack ---')
    var ATTR = '[minecraft:attribute_modifiers={modifiers:[{type:"minecraft:generic.attack_damage",' +
      'id:"mcserver:xp_coupling",amount:5,operation:"add_value",slot:"mainhand"}]}]'
    var attrSubjects = ['create:wrench', 'born_in_chaos_v1:darkwarblade']
    for (var m = 0; m < attrSubjects.length; m++) {
      try {
        var sm = Item.of(attrSubjects[m] + ATTR)
        var cs = String(sm.componentString)
        say('J5a.' + attrSubjects[m], cs.indexOf('xp_coupling') >= 0 ? 'HELD' : 'ABSENT',
          cs.substring(0, 100))
      } catch (e) { say('J5a.' + attrSubjects[m], 'THREW', String(e).substring(0, 100)) }
    }
    console.info(TAG + '  J5b (does a swing actually hit harder) NEEDS A PLAYER - /introprobe xp')

    // J6 - is there an XP-change event, or must the refresh poll? Enumerate rather
    // than guess: a wrong event name logs one startup line and then never fires,
    // which is finding C0.1 and cost real time once already.
    var evNames = ['xpLevelChange', 'xpChange', 'levelUp', 'experienceChange', 'pickupXp']
    var present = []
    for (var q = 0; q < evNames.length; q++) {
      try { if (typeof PlayerEvents[evNames[q]] === 'function') present.push(evNames[q]) } catch (e) { }
    }
    say('J6.xpEvents', present.length ? 'FOUND' : 'NONE', present.length ? present.join(',') :
      'no xp event on PlayerEvents - the refresh must POLL or hook level-up another way')

    // ------------------------------------------------------------------------
    // J9 / J10 - are Wall's and Crown's couplings reachable at all?
    //
    // Ethan ruled character scaling for both, so these are no longer optional
    // curiosities: protection for Wall, his court for Crown. Both live inside
    // another mod's internals, so BOTH ARE EXPECTED TO FAIL. That is planned for -
    // docs/29 SS7 says an unreachable stat becomes a KubeJS-side equivalent, never a
    // silent downgrade back to damage. This probe only decides WHICH build happens.
    //
    // Enumerate what the runtime actually exposes rather than asserting a guess.
    // ------------------------------------------------------------------------
    function probeNamespace(id, label, needles) {
      var hits = []
      try {
        var st = Item.of(id)
        for (var k in st) {
          for (var n = 0; n < needles.length; n++) {
            if (String(k).toLowerCase().indexOf(needles[n]) >= 0) { hits.push(k); break }
          }
        }
      } catch (e) { say(label, 'THREW', String(e).substring(0, 80)); return }
      say(label, hits.length ? 'SURFACE FOUND' : 'NO SURFACE',
        hits.length ? hits.slice(0, 8).join(',') : 'nothing on the item exposes it - use the KubeJS-side equivalent')
    }
    probeNamespace('securitycraft:universal_block_reinforcer_lvl1', 'J9.wall',
      ['reinforce', 'strength', 'protect', 'owner'])
    probeNamespace('goety:dark_wand', 'J10.crown',
      ['soul', 'energy', 'summon', 'minion', 'servant', 'mana'])

    console.info(TAG + 'boot done. J4 + J5b/J7/J8 need a player.')
  })

  // ==========================================================================
  // /introprobe - the player half
  // ==========================================================================
  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands

    function sub(name, fn) {
      return Commands.literal(name).executes(function (ctx) {
        var p = ctx.source.player
        if (!p) { console.info(TAG + 'needs a player'); return 0 }
        try { fn(p, ctx.source.server) } catch (e) {
          say(name, 'THREW', String(e)); tell(p, '§cthrew: ' + e)
        }
        return 1
      })
    }

    // ------------------------------------------------------------------ give
    // J1 proper. NOTE: verification is by READING THE INVENTORY BACK, never by
    // the return of a give. runCommandSilent returns undefined for valid AND
    // invalid commands (finding K8) - trusting it is how the hunter prune shipped
    // broken. Same discipline applies to KubeJS's own give.
    var giveCmd = sub('give', function (p) {
      tell(p, '§7giving the salvage pair + the blade...')
      var results = []
      function attempt(label, fn) {
        try { fn(); results.push(label + '=ran') } catch (e) { results.push(label + '=threw(' + e + ')') }
      }
      attempt('gun/bracket', function () { p.give(Item.of(GUN + '[minecraft:custom_data=' + GUN_DATA + ']')) })
      attempt('ammo/bracket', function () { p.give(Item.of(AMMO + '[minecraft:custom_data=' + AMMO_DATA + ']').withCount(2)) })
      attempt('blade', function () { p.give(Item.of('born_in_chaos_v1:darkwarblade')) })

      // THE FALLBACK PATH. Vanilla /give takes component syntax natively in 1.21,
      // and our own tacz_loot_injectors prove the datapack side already produces
      // working guns - so if KubeJS cannot build a component stack, the command
      // almost certainly still can, and the flagship system survives.
      // Its result is UNKNOWABLE from here: runCommandSilent returns undefined for
      // valid and invalid alike (K8). The ONLY verdict is what lands in the bag.
      attempt('gun//give-cmd', function () {
        p.server.runCommandSilent('give ' + p.username + ' ' + GUN +
          '[minecraft:custom_data=' + GUN_DATA + '] 1')
      })
      say('J1.give', 'ATTEMPTED', results.join('  '))
      tell(p, '§8Two guns were attempted by different routes. If ONE works, say so:')
      tell(p, '§8the KubeJS-built one comes first, the /give one second.')

      tell(p, '§7Now LOOK AT THE ITEMS. Three questions only you can answer:')
      tell(p, '§8 1. is the gun a sawn-off double barrel, or a nameless placeholder?')
      tell(p, '§8 2. does the ammo stack say 12 Gauge, and is there exactly 2?')
      tell(p, '§8 3. hold the blade - is it two-handed, and does the red')
      tell(p, '§8    "excessively heavy" line show in the tooltip?')
      tell(p, '§7Then run §f/introprobe read§7 holding the GUN.')
    })

    // ------------------------------------------------------------------ read
    // J2. Per-gun ammo scaling and "is the flagship still carried?" both need
    // this. Read off the MAIN HAND so the answer is unambiguous.
    var readCmd = sub('read', function (p) {
      var st = null
      try { st = p.mainHandItem } catch (e) { }
      if (!st) { say('J2', 'FAILED', 'could not read mainHandItem at all'); return }
      say('J2.stack', 'OK', 'holding ' + String(st.id) + ' x' + st.count)

      firstThatWorks('J2.components', [
        ['toString', function () { return String(st) }],
        ['.nbt', function () { return st.nbt }],
        ['.componentString', function () { return st.componentString }],
        ['.getComponentString()', function () { return st.getComponentString() }],
        ['.components', function () { return st.components }],
        ['.toItemString()', function () { return st.toItemString() }],
      ], function (v) {
        // Only a form that ROUND-TRIPS the value counts. A reader that returns
        // "{}" is not a working reader, and the union-returns-nothing class of
        // bug is exactly what an over-eager truthiness check hides.
        var s = String(v)
        return s.indexOf('GunId') >= 0 || s.indexOf('db_short') >= 0
      })

      // Durability is the other half of J3 - a gun with no damage bar cannot
      // meaningfully carry Mending no matter what the enchant call returns.
      try { say('J2.durability', 'OK', 'maxDamage=' + st.getMaxDamage() + ' damage=' + st.getDamageValue()) }
      catch (e) { say('J2.durability', 'FAILED', String(e)) }
    })

    // ------------------------------------------------------------------ ench
    // J3. Two gift lines currently PROMISE unbreakability - Blade's "It will not
    // break" and Forge's. If this fails the writing changes, not the code.
    var enchCmd = sub('ench', function (p) {
      var subjects = [
        ['gun', Item.of(GUN + '[minecraft:custom_data=' + GUN_DATA + ']')],
        ['blade', Item.of('born_in_chaos_v1:darkwarblade')],
        ['control-diamond-sword', Item.of('minecraft:diamond_sword')],
      ]
      for (var i = 0; i < subjects.length; i++) {
        var label = subjects[i][0], st = subjects[i][1]
        var out = []
        try { out.push('maxDamage=' + st.getMaxDamage()) } catch (e) { out.push('maxDamage=THREW') }
        try { out.push('isEnchantable=' + st.isEnchantable()) } catch (e) { out.push('isEnchantable=?') }
        // Enchant, then READ IT BACK. "the call did not throw" is not the claim.
        var applied = 'not-applied'
        try {
          st.enchant('minecraft:mending', 1)
          st.enchant('minecraft:unbreaking', 3)
          applied = 'call-ok'
        } catch (e) { applied = 'enchant-threw(' + e + ')' }
        try {
          var s = String(st)
          applied += ' | readback=' + (s.indexOf('mending') >= 0 ? 'MENDING PRESENT' : 'NOT IN STACK STRING')
        } catch (e) { applied += ' | readback=THREW' }
        out.push(applied)
        say('J3.' + label, 'RESULT', out.join('  '))
        try { p.give(st) } catch (e) { }
      }
      tell(p, '§7Given all three. §fCheck the tooltips§7 - does the gun and the')
      tell(p, '§8blade actually SHOW Mending/Unbreaking? The control diamond sword')
      tell(p, '§8proves the enchant call itself works, so a difference is the item.')
    })

    // ------------------------------------------------------------------ logout
    // J4, the one that can hurt a player. The ritual roots + blinds for ~30s. If
    // a disconnect mid-scene leaves that state applied, the player logs back in
    // blind, slowed and unable to act, with the scene that would have released
    // them already over.
    //
    // Three separate questions, and they are NOT the same question:
    //   a. does a scheduled callback still fire after its player left?
    //   b. does the captured player reference go stale/throw when it does?
    //   c. does loggedOut fire in time to cancel anything?
    var logoutCmd = sub('logout', function (p, server) {
      var uuid = null, name = 'unknown'
      try { uuid = String(p.uuid); name = String(p.username) } catch (e) { }
      say('J4', 'ARMED', 'for ' + name + ' - checks at 40/100/300 ticks')
      tell(p, '§c§lDISCONNECT NOW.§r §7Log out within 2 seconds and stay out ~15s.')
      tell(p, '§8Watching whether a scheduled callback survives you leaving.')

      var ticks = [40, 100, 300]
      for (var i = 0; i < ticks.length; i++) {
        (function (t) {
          server.scheduleInTicks(t, function () {
            var bits = ['t=' + t]
            // (a) did we fire at all?
            bits.push('fired=yes')
            // (b) is the captured reference still usable?
            try { bits.push('capturedName=' + String(p.username)) }
            catch (e) { bits.push('capturedName=THREW(' + e + ')') }
            // (c) can we re-look-up fresh, which is what the real code must do?
            var fresh = null
            try { fresh = server.getPlayer(uuid) } catch (e) { }
            if (!fresh) { try { fresh = server.getPlayer(name) } catch (e) { } }
            bits.push('freshLookup=' + (fresh ? 'FOUND (still online)' : 'null (offline - correct)'))
            say('J4.tick', 'RESULT', bits.join('  '))
          })
        })(ticks[i])
      }
    })

    // -------------------------------------------------------------------- xp
    // J5b / J7 / J8. Arms the damage listener below for 60s, and hands over a
    // wrench carrying a +5 attack_damage component so the difference is visible
    // by swinging rather than by reading a log.
    var xpCmd = sub('xp', function (p) {
      ARMED_UNTIL = nowTick(p) + 1200
      try {
        p.give(Item.of('create:wrench' + ATTR_MOD))
        p.give(Item.of('create:wrench'))
      } catch (e) { say('J5b', 'give-threw', String(e)) }
      tell(p, '§7Armed for 60s. Two wrenches given:')
      tell(p, '§8 · the FIRST carries a +5 attack_damage component')
      tell(p, '§8 · the SECOND is plain, as the control')
      tell(p, '§7Hover both. §fDoes the modified one show higher damage?§7 Then hit')
      tell(p, '§8something with each and compare. Then shoot the TaCZ gun at a mob.')
      tell(p, '§8Every hit while armed is logged with weapon, damage and your level.')
    })

    event.register(Commands.literal('introprobe')
      .then(giveCmd).then(readCmd).then(enchCmd).then(logoutCmd).then(xpCmd)
      .executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        tell(p, '§8§m                                        ')
        tell(p, '§7I0 probes. Run in this order:')
        tell(p, '§f /introprobe give   §8- J1, then look at the items')
        tell(p, '§f /introprobe read   §8- J2, HOLD THE GUN first')
        tell(p, '§f /introprobe ench   §8- J3, then check the tooltips')
        tell(p, '§f /introprobe logout §8- J4, then disconnect immediately')
        tell(p, '§8Results go to the server log, not here.')
        return 1
      }))
  })

  // ==========================================================================
  // J7 / J8 - THE DAMAGE LISTENER.  Disarmed unless /introprobe xp was run.
  //
  // J7  does a TaCZ gun's damage reach a vanilla hook AT ALL? If it does not,
  //     Salvage cannot scale damage by any route and her coupling becomes ammo
  //     instead - which docs/29 argues is the better mechanic anyway, but the
  //     decision has to rest on a measurement, not on a preference.
  // J8  can the damage be WRITTEN? stalker.js's damageOf() already proves reading.
  //     Writing is a different claim and is assumed by route C.
  //
  // NEVER CALLS event.cancel() - C0 found that cancel() unwinds by THROWING, so a
  // probe that cancelled would corrupt the very hit it was trying to measure.
  // ==========================================================================
  EntityEvents.beforeHurt(function (event) {
    if (!ARMED_UNTIL) return
    var lvl = null
    try { lvl = event.entity.level } catch (e) { }
    var t = 0
    try { t = lvl.time } catch (e) { }
    if (t > ARMED_UNTIL) { ARMED_UNTIL = 0; console.info(TAG + 'J7/J8 window closed'); return }

    var src = null
    try { src = event.source } catch (e) { }
    if (!src) return

    // Who swung? Only log PLAYER-dealt hits; mob-on-mob would flood.
    var who = null
    try { who = src.player } catch (e) { }
    if (!who) { try { who = src.getDirectEntity() } catch (e) { } }
    var isPlayer = false
    try { isPlayer = !!(who && who.username) } catch (e) { }
    if (!isPlayer) return

    var bits = []
    try { bits.push('victim=' + event.entity.type) } catch (e) { bits.push('victim=?') }
    try { bits.push('xpLevel=' + who.xpLevel) } catch (e) { bits.push('xpLevel=UNREADABLE') }
    try { bits.push('held=' + String(who.mainHandItem.id)) } catch (e) { bits.push('held=?') }
    // J7: the source type is what tells us whether TaCZ routed through vanilla.
    try { bits.push('srcType=' + String(src.type)) } catch (e) {
      try { bits.push('srcType=' + String(src.getMsgId())) } catch (x) { bits.push('srcType=?') }
    }

    // Read, then attempt to WRITE, then READ BACK. The read-back is the whole
    // point: "the setter did not throw" is not evidence that it took.
    var before = null
    try { before = event.damage } catch (e) { }
    if (before === null || before === undefined) { try { before = event.getDamage() } catch (e) { } }
    bits.push('damage=' + before)

    var wrote = 'no-route'
    if (typeof before === 'number') {
      try { event.damage = before + 100; wrote = 'assign' } catch (e) { }
      if (wrote === 'no-route') { try { event.setDamage(before + 100); wrote = 'setDamage()' } catch (e) { } }
      if (wrote !== 'no-route') {
        var after = null
        try { after = event.damage } catch (e) { }
        if (after === null || after === undefined) { try { after = event.getDamage() } catch (e) { } }
        wrote += (after === before + 100) ? ' TOOK' : ' IGNORED(readback=' + after + ')'
        // put it back - a probe must not actually buff the hit
        try { event.damage = before } catch (e) { try { event.setDamage(before) } catch (x) { } }
      }
    }
    bits.push('write=' + wrote)
    console.info(TAG + 'J7/J8 hit :: ' + bits.join('  '))
  })

  // J4 (c) - does loggedOut fire, and is the player still readable inside it?
  // The real ritual must clear blindness/slowness here, so "it fires" is not
  // enough; the handler has to still be able to touch the player.
  PlayerEvents.loggedOut(function (event) {
    var bits = []
    try { bits.push('name=' + String(event.player.username)) } catch (e) { bits.push('name=THREW') }
    try { event.player.potionEffects.remove('minecraft:blindness'); bits.push('canRemoveEffect=yes') }
    catch (e) { bits.push('canRemoveEffect=THREW(' + e + ')') }
    console.info(TAG + 'J4.loggedOut fired  ' + bits.join('  '))
  })
})()
