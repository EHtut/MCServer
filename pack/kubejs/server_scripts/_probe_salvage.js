// _probe_salvage.js - E6 probes.  docs/23 PART V, docs/24 §E6
//
// E6 is Salvage's economy: hunger -> life, levels -> ammo, sight -> the power to
// kill. Two of those three are already proven (E0 P5 hunger, P6 xp). The third is
// not, and it is the one the whole path hangs on:
//
//     "AMMO" IS NOT AN ITEM. TaCZ ships exactly two - tacz:ammo and tacz:ammo_box -
//     and the CALIBRE lives in item data across ~20 types (12g, 308, 30_06, 45acp,
//     40mm, ...). Class scan of the jar: the keys are AmmoId, GunId, AmmoCount,
//     GunFireMode, written by AmmoItemBuilder / GunItemBuilder.
//
// So "give ammo" means minting a stack with the right data AND knowing which gun
// the player holds - or she hands out rounds that chamber in nothing.
//
// ── HOW THIS PROBE IS WRITTEN, AND WHY ───────────────────────────────────────
// I0 round 1 reported "J1 FAILED" because the validator tested String(stack),
// which does not render components. The API was fine; the probe was wrong, and it
// nearly caused a working feature to be rebuilt.
//
//   SO: THIS PROBE DOES NOT JUDGE. It prints a matrix and includes a CONTROL row
//   that MUST succeed. If the control fails, the instrument is broken and every
//   other row in that run is void - exactly like the `locate biome` and
//   `execute if biome` rows that lied twice in the worldgen census.
//
// The final authority is not this script. It is whether the gun accepts the round.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[sprobe] '

  function say(p, s) { try { p.tell(s) } catch (e) { } console.info(TAG + s.replace(/§./g, '')) }

  // Try a named accessor and report what came back, never throwing outward.
  function probe(label, fn) {
    var r
    try { r = fn() } catch (e) { return { label: label, ok: false, out: 'THREW: ' + e } }
    if (r === undefined) return { label: label, ok: false, out: 'undefined' }
    if (r === null) return { label: label, ok: false, out: 'null' }
    var s
    try { s = String(r) } catch (e) { s = '<unstringable>' }
    if (s.length > 120) s = s.substring(0, 120) + '...'
    return { label: label, ok: true, out: s }
  }

  function report(p, rows) {
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]
      say(p, (r.ok ? '§a  OK   ' : '§8  --   ') + '§f' + r.label + ' §8-> §7' + r.out)
    }
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    var root = Commands.literal('salvageprobe').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      say(p, '§8§m                                        ')
      say(p, '§6E6 probes §8- run each with a relevant item IN HAND')
      say(p, '§f/salvageprobe hold  §8- dump everything readable off the held stack')
      say(p, '§f/salvageprobe mint  §8- try to MINT tacz:ammo five ways, gives you each')
      say(p, '§f/salvageprobe sight §8- does blindness survive the ritual release')
      say(p, '§f/salvageprobe body  §8- hunger + xp read/write round trip')
      say(p, '§7Order: §fhold§7 first, holding REAL ammo from the gunsmith table.')
      say(p, '§7That is the control. Without it, mint has nothing to be checked against.')
      return 1
    })

    // ── J1. WHAT IS A REAL STACK? the control row ────────────────────────────
    // Hold a real TaCZ ammo item (or a gun) and this prints every accessor that
    // returns anything. Whatever shape the REAL item has is the shape mint must
    // produce - which is why this runs first and why nothing is assumed.
    root = root.then(Commands.literal('hold').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var st = null
      try { st = p.mainHandItem } catch (e) { }
      if (!st) { say(p, '§ccannot read mainHandItem at all - stop, nothing else is meaningful'); return 0 }

      say(p, '§8§m                                        ')
      say(p, '§6J1 - the held stack. §7This is the CONTROL.')
      var rows = [
        probe('String(stack)', function () { return String(st) }),
        probe('stack.id', function () { return st.id }),
        probe('stack.count', function () { return st.count }),
        probe('stack.toItemString()', function () { return st.toItemString() }),
        probe('stack.nbt', function () { return st.nbt }),
        probe('stack.nbtString', function () { return st.nbtString }),
        probe('stack.componentString', function () { return st.componentString }),
        probe('stack.components', function () { return st.components }),
        probe('stack.getComponents()', function () { return st.getComponents() }),
        probe('stack.get("minecraft:custom_data")', function () { return st.get('minecraft:custom_data') }),
        probe('stack.getCustomData()', function () { return st.getCustomData() }),
      ]
      report(p, rows)
      var any = false
      for (var i = 0; i < rows.length; i++) if (rows[i].ok) any = true
      if (!any) say(p, '§c🚨 NOTHING readable - the instrument is broken, ignore every other run')
      else say(p, '§7Whatever printed the calibre above is the accessor E6 must use.')
      say(p, '§8If NONE of them shows the calibre, the data is server-side only and')
      say(p, '§8the trade must give ammo by COMMAND, not by minting a stack.')
      return 1
    }))

    // ── J2. CAN WE MINT ONE? five forms, no judgement ────────────────────────
    root = root.then(Commands.literal('mint').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      say(p, '§8§m                                        ')
      say(p, '§6J2 - minting §ftacz:ammo§6. Row 0 is the CONTROL and must work.')

      var forms = [
        ['0 CONTROL plain', 'tacz:ammo'],
        ['1 custom_data AmmoId', 'tacz:ammo[minecraft:custom_data={AmmoId:"tacz:12g"}]'],
        ['2 + AmmoCount', 'tacz:ammo[minecraft:custom_data={AmmoId:"tacz:12g",AmmoCount:30}]'],
        ['3 unprefixed calibre', 'tacz:ammo[minecraft:custom_data={AmmoId:"12g"}]'],
        ['4 ammo_box', 'tacz:ammo_box[minecraft:custom_data={AmmoId:"tacz:12g",AmmoCount:120}]'],
      ]
      for (var i = 0; i < forms.length; i++) {
        var label = forms[i][0], spec = forms[i][1]
        var made = null, err = null
        try { made = Item.of(spec) } catch (e) { err = String(e) }
        if (!made) { say(p, '§8  --   §f' + label + ' §8-> §cTHREW: ' + (err || '?').substring(0, 70)); continue }
        var shown = '?'
        try { shown = made.toItemString() } catch (e) { try { shown = String(made) } catch (e2) { } }
        if (shown.length > 90) shown = shown.substring(0, 90) + '...'
        say(p, '§a  OK   §f' + label + ' §8-> §7' + shown)
        try { p.give(made) } catch (e) { say(p, '§8         (could not give it to you: ' + e + ')') }
      }
      say(p, '§7Five stacks are in your inventory. §fPut each in a gun.')
      say(p, '§7THE GUN IS THE ONLY REAL VERDICT - a stack that prints perfectly')
      say(p, '§7and chambers in nothing is a failure this script cannot see.')
      return 1
    }))

    // ── J3. does the sight cost survive the room? ────────────────────────────
    // "Your sight" is the one trade whose price follows you OUT of the ritual -
    // up to 5 minutes of blindness while you fight. Every other cost resolves when
    // the scene closes. So: does release() strip it? ritual.js clears effects by
    // name via `effect clear`, and if blindness is in that list, the whole trade
    // is impossible as designed and E6 needs its own release path.
    root = root.then(Commands.literal('sight').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      say(p, '§8§m                                        ')
      say(p, '§6J3 - blindness vs the ritual release')
      try { srv.runCommandSilent('effect give ' + p.username + ' minecraft:blindness 60 0 true') }
      catch (e) { say(p, '§ccould not apply blindness: ' + e); return 0 }
      say(p, '§7blindness applied for 60s. releasing the ritual in 3s...')

      srv.scheduleInTicks(60, function () {
        var was = 'unknown'
        try {
          if (VELDORA.ritual && VELDORA.ritual.release) { VELDORA.ritual.release(p); was = 'called' }
          else was = 'VELDORA.ritual.release MISSING'
        } catch (e) { was = 'THREW: ' + e }
        say(p, '§7release() ' + was)
        say(p, '§f>>> ARE YOU STILL BLIND? §7If yes, the sight trade works as designed.')
        say(p, '§7If the screen cleared, E6 needs its own release that spares blindness.')
      })
      return 1
    }))

    // ── J4. the body: hunger and levels ──────────────────────────────────────
    // P5/P6 proved these once. Re-run because they are the two prices Salvage
    // actually charges, and a value that reads back unchanged is a silent no-op.
    root = root.then(Commands.literal('body').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      say(p, '§8§m                                        ')
      say(p, '§6J4 - hunger + levels, read/write round trip')

      var h0 = null, h1 = null
      try { h0 = p.foodData.foodLevel } catch (e) { }
      if (h0 === null) say(p, '§8  --   §fhunger read §8-> §cno foodData.foodLevel')
      else {
        try { p.foodData.foodLevel = Math.max(0, h0 - 3) } catch (e) { }
        try { h1 = p.foodData.foodLevel } catch (e) { }
        say(p, (h1 !== null && h1 !== h0 ? '§a  OK   ' : '§c  FAIL ') +
          '§fhunger §8-> §7' + h0 + ' -> ' + h1 + (h1 === h0 ? ' §cUNCHANGED - write did nothing' : ''))
      }

      var x0 = null, x1 = null
      try { x0 = p.xpLevel } catch (e) { }
      if (x0 === null) say(p, '§8  --   §flevels read §8-> §cno xpLevel')
      else {
        try { p.xpLevel = x0 + 1 } catch (e) { }
        try { x1 = p.xpLevel } catch (e) { }
        say(p, (x1 !== null && x1 !== x0 ? '§a  OK   ' : '§c  FAIL ') +
          '§flevels §8-> §7' + x0 + ' -> ' + x1 + (x1 === x0 ? ' §cUNCHANGED - write did nothing' : ''))
        try { p.xpLevel = x0 } catch (e) { }
      }
      say(p, '§8hunger left 3 lower; levels restored.')
      return 1
    }))

    event.register(root)
  })

  ServerEvents.loaded(function () {
    console.info(TAG + 'E6 probes registered - /salvageprobe (admin). ' +
      'Run `hold` FIRST with real TaCZ ammo in hand; it is the control row.')
  })
})();
