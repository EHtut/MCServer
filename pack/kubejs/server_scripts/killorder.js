// killorder.js — "kill that champion by day N", once, for every god who wants one.
//
// ⚠️ EXTRACTED 2026-08-16 BECAUSE A THIRD GOD ASKED. Wall's contract carried this
// comment when it was written:
//
//     "Two implementations of 'kill that player by day N' is exactly the kind of
//      thing this codebase gets bitten by, so this is flagged rather than hidden:
//      when a THIRD god wants one, extract it - do not write it a third time."
//
// Salvage is the third. So this file is that promise being kept rather than a
// refactor for its own sake.
//
// ── WHAT IS AND IS NOT IN HERE ───────────────────────────────────────────────
// In: the target, the deadline, the world-day clock guard, the resolution hook, the
// lapse sweep, and one order at a time per god.
//
// NOT in: the offer scene, the reward, or the voice. Those are the character, and
// they are the entire difference between the same mechanic in three mouths -
//     Blade   buys a kill and pays metal for it
//     Wall    removes something "in your way" and calms down by four rage
//     Salvage takes a commission and settles in her own currency
// A god passes what it wants to happen; this file only remembers who and when.
//
// 🚫 BLADE IS DELIBERATELY NOT MIGRATED. His contract is welded to the MARK - they
// share K_TARGET/K_DUE on purpose, so one kill resolves either, and his `mark` is a
// declaration rather than an order. Pulling him onto this would flatten that
// distinction to save fifty lines. Two shapes is a design; three was a smell.

var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[killorder] '

  // Per-god keys, so two gods can hold an order on the same player at once without
  // either overwriting the other.
  function kTarget(god) { return 'veldora_ko_' + god + '_t' }
  function kDue(god) { return 'veldora_ko_' + god + '_d' }   // world day, offset by 1

  var REG = {}          // god -> { days, onSettle, onLapse }

  function dayNow(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    } catch (e) { }
    return null
  }

  function held(p, god) {
    try { return p.persistentData.getString(kTarget(god)) || '' } catch (e) { return '' }
  }

  // Open an order. Returns false if one is already open, the clock is unreadable, or
  // the god never registered - all of which are "not now", never a crash.
  function open(server, p, god, targetName) {
    if (!REG[god]) {
      console.error(TAG + god + ' opened an order without registering. Ignored.')
      return false
    }
    if (held(p, god)) return false                 // one at a time
    var today = dayNow(server)
    if (today === null) {
      console.warn(TAG + 'no world clock - ' + god + ' cannot open an order')
      return false
    }
    try {
      p.persistentData.putString(kTarget(god), String(targetName))
      p.persistentData.putInt(kDue(god), today + REG[god].days + 1)
    } catch (e) { return false }
    console.info(TAG + p.username + ' holds ' + god + "'s order on " + targetName +
      ', due day ' + (today + REG[god].days))

    // ⭐ THE WARNING (docs/49 §2). The target's OWN god decides whether to tell them.
    // Deliberately after the order is committed, so a warning can never be sent for
    // an order that then failed to write. Best-effort: this file's job is the order,
    // and a silent warn layer must never take an order down with it.
    try {
      if (VELDORA.warn) VELDORA.warn.incoming(server, god, targetName)
    } catch (e) { console.warn(TAG + 'warn layer threw :: ' + e) }

    return true
  }

  function clear(p, god) {
    try {
      p.persistentData.putString(kTarget(god), '')
      p.persistentData.putInt(kDue(god), 0)
    } catch (e) { }
  }

  function register(god, spec) {
    REG[god] = {
      days: (spec && spec.days) || 3,
      onSettle: spec && spec.onSettle,
      onLapse: spec && spec.onLapse,
    }
  }

  // ── resolution ─────────────────────────────────────────────────────────────
  // ONE death hook for every god, rather than one per god. A player killing another
  // resolves whichever orders name that victim.
  EntityEvents.death(function (event) {
    try {
      var victim = event.entity
      if (!victim || !victim.player) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      var vname = ''
      try { vname = String(victim.username) } catch (e) { return }
      try { if (String(killer.uuid) === String(victim.uuid)) return } catch (e) { return }

      for (var god in REG) {
        if (!REG.hasOwnProperty(god)) continue
        if (held(killer, god) !== vname) continue
        clear(killer, god)
        console.info(TAG + killer.username + ' settled ' + god + "'s order on " + vname)
        try { if (REG[god].onSettle) REG[god].onSettle(killer, vname) } catch (e) {
          console.warn(TAG + god + ' onSettle threw :: ' + e)
        }
      }
    } catch (e) { console.warn(TAG + 'death hook threw :: ' + e) }
  })

  // ── the lapse sweep ────────────────────────────────────────────────────────
  var SWEEP = 1200

  function sweep(server) {
    try {
      var today = dayNow(server)
      if (today === null) { server.scheduleInTicks(SWEEP, function () { sweep(server) }); return }
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        for (var god in REG) {
          if (!REG.hasOwnProperty(god)) continue
          var want = held(p, god)
          if (!want) continue
          var due = 0
          try { due = p.persistentData.getInt(kDue(god)) } catch (e) { continue }
          if (!due) continue
          // ⚠️ A stamp further ahead than the order's own length means the world
          // clock moved - re-anchor instead of leaving an order that never lapses.
          // Finding K9, which this project has now paid for in five places.
          if ((due - 1) - today > REG[god].days) {
            try { p.persistentData.putInt(kDue(god), today + REG[god].days + 1) } catch (e) { }
            continue
          }
          if (today < (due - 1)) continue
          clear(p, god)
          console.info(TAG + p.username + ' let ' + god + "'s order on " + want + ' lapse')
          try { if (REG[god].onLapse) REG[god].onLapse(p, want) } catch (e) {
            console.warn(TAG + god + ' onLapse threw :: ' + e)
          }
        }
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    server.scheduleInTicks(SWEEP, function () { sweep(server) })
  }

  VELDORA.killorder = {
    register: register,
    open: open,
    held: held,
    clear: clear,
  }

  ServerEvents.loaded(function (event) {
    sweep(event.server)
    // ⚠️ REPORT ON THE NEXT TICK, NOT HERE. This file sorts alphabetically BEFORE
    // salvage_events.js and wall_events.js, and both register inside their own
    // ServerEvents.loaded - so reporting here read the registry before either of
    // them had filled it and printed "NOBODY YET" while two gods were about to
    // register. Kill orders were live the whole time; the report could not see them.
    //
    // 🚨 That is not cosmetic. This banner is the only visible answer to "can anyone
    // issue a kill order at all", and the retaliation design in docs/49 is built on
    // top of exactly that trigger - so the report was quietly denying the existence
    // of the feature it was written to confirm.
    //
    // godevents.js hit this identically ("11 events across 1 god" while Wall was
    // about to register three more) and its fix is the one used here. One tick is
    // after every loaded handler and long before the first sweep.
    event.server.scheduleInTicks(1, function () {
      var gods = []
      for (var g in REG) if (REG.hasOwnProperty(g)) gods.push(g + '(' + REG[g].days + 'd)')
      console.info(TAG + 'shared kill orders for: ' + (gods.join(', ') || 'NOBODY YET') +
        '. Blade is deliberately NOT here - his contract shares the Mark.')
    })
  })
})()
