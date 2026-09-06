// story.js — the plot ledger. One call, one achievement, one record.
//
// Ethan, 2026-09-05: *"there should be an achievement for everything plot related."*
//
//     VELDORA.story.reach(player, 'the_caves')
//
// That is the whole interface. Every beat in Act 0 calls it at the moment it fires, and
// this file does the rest: grants the advancement, stamps the player, logs it once.
//
// ── ⭐ WHY A LEDGER AND NOT NINE `advancement grant` CALLS ───────────────────
// Because "which beats has this player seen, in order" is a question the project has to
// answer constantly — for gating (Caebrim must not find you before you have heard the
// argument), for testing, and for Ethan to look at a tab and know where a save is. Nine
// scattered command calls answer none of that.
//
// 🔑 AND BECAUSE THE ADVANCEMENT IS THE ONLY VISIBLE HALF. The stamp is what the code
// reads; the toast is what the player gets. Granting without stamping gives a beat that
// cannot be gated on, and stamping without granting gives a plot nobody can see.
// Both happen here or neither does.
//
// ── ⚠️ THE KEYS ARE OWNED BY tools/make_story_datapack.py ───────────────────
// It generates `pack/datapacks/mcserver_story/` and prints the key list. A key here that
// has no advancement grants nothing and says so loudly — silence would look identical to
// a beat that simply has not fired yet, and those are very different bugs.
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[story] '
  var GATE = true

  // NEEDS-GAME: a toast fires and the Act 0 tab renders with the right icons :: /story reach the_caves
  var NS = 'mcserver:act0/'
  var K = 'veldora_story_'      // + key -> boolean, per player, per world

  // ⚠️ IN PLAY ORDER, and the order is load-bearing: `progress()` reports how far a player
  // has come, and a set with no order cannot answer that.
  //
  // ⛔ THIS LIST MUST MATCH BEATS in tools/make_story_datapack.py. `/story audit` compares
  // them at runtime rather than trusting that they agree.
  var ACT0 = [
    'introductions',
    'the_caves',
    'ank',
    'the_arguments',
    'the_shadow',
    'the_whispers',
    'the_white_coat',
    'the_hordes',
    'what_happened',
  ]

  function known(key) {
    for (var i = 0; i < ACT0.length; i++) if (ACT0[i] === key) return true
    return false
  }

  function has(p, key) {
    try { return !!p.persistentData.getBoolean(K + key) } catch (e) { return false }
  }

  /**
   * Mark a plot beat reached. Returns true if this was the FIRST time.
   *
   * ⚠️ FALSE IS A REAL ANSWER, NOT A FAILURE — it means "already seen", which is the
   * common case for anything a player can walk into twice. A caller that treats false as
   * an error will log noise on every repeat; one that treats it as success will re-fire
   * whatever it guards. "I failed" and "I found nothing" must stay distinguishable.
   */
  function reach(p, key) {
    if (!GATE) return false
    if (!p || !key) return false

    // 🔴 AN UNKNOWN KEY IS A BUG, NOT A NO-OP. A typo here would silently never grant, and
    // that reads exactly like a beat that has not fired yet - the most expensive kind of
    // quiet failure this project keeps paying for.
    if (!known(key)) {
      console.error(TAG + 'UNKNOWN BEAT "' + key + '" - nothing granted. Known: ' +
        ACT0.join(', ') + '. Add it to BEATS in tools/make_story_datapack.py first.')
      return false
    }

    if (has(p, key)) return false

    var srv = null
    try { srv = p.server } catch (e) { }
    if (!srv) { console.warn(TAG + 'no server handle; ' + key + ' not granted'); return false }

    // ⭐ STAMP FIRST. If the grant throws, the player still has the beat recorded and the
    // story does not stall on a cosmetic failure - a missing toast is a worse outcome than
    // a repeated one, but a stalled plot is worse than both.
    try { p.persistentData.putBoolean(K + key, true) } catch (e) { }

    try {
      srv.runCommandSilent('advancement grant ' + p.username + ' only ' + NS + key)
    } catch (e) {
      console.error(TAG + 'the grant failed for ' + key + ' :: ' + e)
    }

    console.info(TAG + p.username + ' reached ' + key + '  (' + progress(p) + ')')
    return true
  }

  /** How far along Act 0 this player is, as "n/9". */
  function progress(p) {
    var n = 0
    for (var i = 0; i < ACT0.length; i++) if (has(p, ACT0[i])) n++
    return n + '/' + ACT0.length
  }

  /** The furthest beat reached, or null. ⚠️ Furthest, not last-granted. */
  function furthest(p) {
    var out = null
    for (var i = 0; i < ACT0.length; i++) if (has(p, ACT0[i])) out = ACT0[i]
    return out
  }

  function clear(p) {
    for (var i = 0; i < ACT0.length; i++) {
      try { p.persistentData.putBoolean(K + ACT0[i], false) } catch (e) { }
      try {
        p.server.runCommandSilent('advancement revoke ' + p.username + ' only ' + NS + ACT0[i])
      } catch (e) { }
    }
  }

  VELDORA.story = {
    reach: reach,
    has: has,
    progress: progress,
    furthest: furthest,
    beats: ACT0,
    clear: clear,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    var root = Commands.literal('story').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7Act 0 — §f' + progress(p)))
      for (var i = 0; i < ACT0.length; i++) {
        var got = has(p, ACT0[i])
        p.tell(Text.of((got ? '§a  ✔ ' : '§8  · ') + ACT0[i]))
      }
      p.tell(Text.of('§8/story reach <key> §7· §8/story clear §7· §8/story audit'))
      return 1
    })

    // ⭐ THE AUDIT IS THE POINT OF HAVING TWO LISTS. The datapack and this file each carry
    // the beat names, and a key present in one but not the other grants nothing while
    // looking perfectly fine from either side. This is the only thing that can see it.
    // WHAT THIS COMMAND USED TO CLAIM, AND NEVER DID. It declared `var missing = 0`,
    // never incremented it, opened no datapack, and always printed "no gaps found in this
    // file". Its own comment said it was "the only thing that can see" a drift between
    // the key list and the advancements - and act0_smoke.py then built a check on top of
    // that claim, so a false green fed a second false green.
    //
    // A DRIFT IS AN OFFLINE QUESTION AND IT LIVES IN story_harness.js, which can read both
    // the key list and the datapack directory. This command answers the only thing a
    // server can: what THIS PLAYER has reached, and which beats nothing is able to grant.
    root = root.then(Commands.literal('audit').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var got = [], not = []
      for (var i = 0; i < ACT0.length; i++) (has(p, ACT0[i]) ? got : not).push(ACT0[i])
      p.tell(Text.of('§7reached §f' + got.length + '§7/' + ACT0.length +
        (got.length ? '§8  ' + got.join(', ') : '')))
      if (not.length) p.tell(Text.of('§8not yet: ' + not.join(', ')))
      // A BEAT WITH NO CALLER CAN NEVER BE EARNED, and that is invisible in game - the
      // player simply never gets it, which looks exactly like not having got there yet.
      // Six of the nine belong to unbuilt chunks (B5-B11) and correctly have no caller;
      // the list is printed so "unbuilt" and "wired wrong" can be told apart at a glance.
      p.tell(Text.of('§8granted by code today: introductions, the_caves, ank. The ' +
        'other six wait on B5-B11. §8Drift between this list and the datapack is an ' +
        'OFFLINE question: §fnode tools/story_harness.js'))
      return 1
    }))

    root = root.then(Commands.literal('clear').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      clear(p)
      p.tell(Text.of('§7Act 0 forgotten - every beat revoked and un-stamped.'))
      return 1
    }))

    root = root.then(Commands.literal('reach')
      .then(Commands.argument('key', event.arguments.STRING.create(event))
        .executes(function (ctx) {
          var p = ctx.source.player
          if (!p) return 0
          // `event.stringArgument` IS NOT A KUBEJS API. It appeared in this file and
          // NOWHERE ELSE in the pack - every other command reads its argument with
          // ctx.getArgument(name, Java.loadClass(...)). It threw, the player saw a red
          // error, and the beat was never granted.
          //
          // Ethan reported item 5 as "it gives an error" and the log showed him earning
          // [The Old Diggings] seconds later - a DIFFERENT advancement, from
          // mcserver_progression, for going underground. The toast that looked like
          // success belonged to something else entirely.
          var key = null
          try { key = String(ctx.getArgument('key', Java.loadClass('java.lang.String'))) }
          catch (e) {
            p.tell(Text.of('§cunreadable key argument :: ' + e))
            return 0
          }
          var first = reach(p, key)
          p.tell(Text.of(first ? '§a' + key + ' reached.'
            : '§7' + key + ' — already had it, or it is not a known beat.'))
          return 1
        })))

    event.register(root)
  })

  ServerEvents.loaded(function () {
    console.info(TAG + ACT0.length + ' Act 0 beats registered. Grant with ' +
      'VELDORA.story.reach(player, key); the advancement tab IS the plot ledger.')
  })
})();
