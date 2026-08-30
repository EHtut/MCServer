// night.js — the Speaker takes the night, and most of the pantheon loses it.
//
// Ethan, 2026-08-29:
//     "for deepspeaker, we change it so that she introduces themself after the 30th
//      night, and silences the god's abilities to speak to you or act at night."
//
// ── 🔑 WHAT THIS IS FOR ─────────────────────────────────────────────────────────
// The danger moved from the depths to the night (`docs/70`). This is the piece that
// makes a night dangerous rather than merely dark: **your god cannot reach you.** The
// mechanic and the fiction are the same sentence, which is the whole reason it is worth
// building rather than just turning the mob cap up.
//
// ── WHO KEEPS THEIR VOICE — RULED, NOT DERIVED ─────────────────────────────────
//   blade    SILENCED
//   salvage  SILENCED
//   wall     speaks - and keeps her strength, the aura included
//   forge    speaks
//   art      speaks  ("she's her own antagonist anyways")
//
// 🚨 THERE IS A LORE REASON FOR THAT SPLIT AND NOBODY KNOWS IT. Ethan: *"There is a
// lore reason that they don't know about. You don't know either."* ⛔ Do not invent one
// here, in a comment, or in a line. The gap is deliberate and it is his to fill. The
// table above is a RULING to be implemented, not a pattern to be explained.
//
// ── ⚠️ WHY THIS COUNTS *PLAYED* NIGHTS ──────────────────────────────────────────
// A night only counts if you were online for it. Same reasoning `tide.js` records for
// its clock - *"logging off never brings a tide closer"* - and the same one `ranks.js`
// uses for Forge's boredom. You should have to LIVE THROUGH thirty nights, not sleep
// through them logged out.
//
// ⚠️ This is the same open question as Wall's "30 days" in `67`, and it is defaulted the
// same way for the same reason. If Ethan wants world nights instead, it is one constant
// and one read.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[night] '
  var GATE = true

  // 🚨 SILENCED, not "permitted" - the list names who LOSES their voice, so a god added
  // tomorrow keeps theirs by default. Failing open is right here: a new god going
  // unexpectedly quiet at night is a bug nobody would trace for weeks, while one
  // speaking when it should not is obvious the first night.
  var SILENCED = { blade: true, salvage: true }

  var SPEAKER_NIGHT = 30          // she introduces herself after this many played nights
  var SWEEP = 100                 // 5s - the same cadence tide.js uses

  // Vanilla night. dayTime() is ABSOLUTE ticks, so the day-of is `% 24000`.
  var NIGHT_FROM = 13000
  var NIGHT_TO = 23000

  var K_NIGHTS = 'veldora_nights'       // played nights witnessed
  var K_INNIGHT = 'veldora_in_night'    // were we already inside this night last sweep

  // ── time ───────────────────────────────────────────────────────────────────
  // ⚠️ `server.overworld()` IS A METHOD, NOT A PROPERTY - finding P6a, and four other
  // files in this pack record the same correction. Getting it wrong reads as `undefined`
  // rather than throwing, so the whole system would simply never think it was night.
  function dayTimeOf(server) {
    try {
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return d
    } catch (e) { }
    return null
  }

  // null = "could not read the clock", which is NOT the same as "it is daytime".
  // Callers must treat null as "do not silence anything" - see maySpeak.
  function isNight(server) {
    var d = dayTimeOf(server)
    if (d === null) return null
    var t = ((d % 24000) + 24000) % 24000
    return t >= NIGHT_FROM && t < NIGHT_TO
  }

  // ── the counter ────────────────────────────────────────────────────────────
  function nightsFor(p) {
    try { return p.persistentData.getInt(K_NIGHTS) || 0 } catch (e) { return 0 }
  }

  function hasArrived(p) {
    return nightsFor(p) >= SPEAKER_NIGHT
  }

  // 🔑 EDGE-TRIGGERED, NOT SAMPLED. A sweep runs every 5s and a night is ~8 minutes, so
  // counting "is it night" per sweep would add ~100 nights per night. The flag records
  // whether we were ALREADY inside this night; the counter moves only on the day->night
  // crossing.
  function advance(server, p) {
    var night = isNight(server)
    if (night === null) return
    var was = false
    try { was = !!p.persistentData.getBoolean(K_INNIGHT) } catch (e) { }
    if (night === was) return
    try { p.persistentData.putBoolean(K_INNIGHT, night) } catch (e) { }
    if (!night) return                       // night ended; nothing to count

    var n = nightsFor(p) + 1
    try { p.persistentData.putInt(K_NIGHTS, n) } catch (e) { }
    if (n === SPEAKER_NIGHT) {
      console.info(TAG + p.username + ' has witnessed ' + n + ' nights - THE SPEAKER ' +
        'ARRIVES. From now on ' + Object.keys(SILENCED).join(' and ') +
        ' cannot reach them after dark.')

      // ⭐⭐ D2 - SHE INTRODUCES HERSELF. Reuses `deep_speaker.introduce()`, which owns
      // the `met` flag and the authored `intro` pool, so the night route and the depths
      // route are literally the same event with two doors.
      //
      // ⚠️ IF THEY ALREADY MET HER UNDERGROUND, NOTHING IS SAID - introduce() returns
      // false and that is correct. Meeting her and her TAKING THE NIGHT are different
      // things: the silencing above keys on the count, not on the greeting, so a player
      // who found her on night five is still un-silenced until thirty.
      //
      // 🚨 AND A PATHLESS PLAYER HEARS NOBODY. speakerFor() returns null without a path
      // (`docs/67` records this as the gap Art's entry condition will have to fill).
      // Silent by construction, not by accident.
      try {
        if (VELDORA.speaker && typeof VELDORA.speaker.introduce === 'function') {
          VELDORA.speaker.introduce(p, 'the ' + SPEAKER_NIGHT + 'th night')
        }
      } catch (e) {
        console.warn(TAG + 'the introduction threw for ' + p.username +
          ' - the silence still begins, she just did not say so :: ' + e)
      }
    }
  }

  // ── the gate ───────────────────────────────────────────────────────────────
  // TRUE means this god may speak right now. ⚠️ Every failure path returns TRUE:
  // an unreadable clock, a missing player, a god not on the list. A gate that fails
  // CLOSED would silence the pantheon on any glitch, and a silent god is exactly the
  // symptom nobody reports because it looks like nothing happening.
  function maySpeak(server, p, god) {
    if (!GATE) return true
    if (!god || !SILENCED[god]) return true
    if (!p) return true
    if (!hasArrived(p)) return true          // she has not introduced herself yet
    var night = isNight(server)
    if (night !== true) return true          // day, or unreadable
    return false
  }

  // The inverse, for readers that want the positive statement.
  function silencedNow(server, p, god) {
    return !maySpeak(server, p, god)
  }

  function sweep(server) {
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        try { advance(server, ps[i]) } catch (e) { }
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    try { server.scheduleInTicks(SWEEP, function () { sweep(server) }) } catch (e) { }
  }

  VELDORA.night = {
    isNight: isNight,
    nightsFor: nightsFor,
    hasArrived: hasArrived,
    maySpeak: maySpeak,
    silencedNow: silencedNow,
    silenced: SILENCED,
    speakerNight: SPEAKER_NIGHT,
    enabled: function () { return GATE },
    // exposed for tools/night_harness.js - the counter's edge behaviour is the part
    // that cannot be play-tested, because nobody can watch thirty nights to check that
    // it counted thirty.
    _advance: advance,
    _dayTimeOf: dayTimeOf,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    if (!Commands) return
    event.register(Commands.literal('night').executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var n = nightsFor(p)
      var nt = isNight(srv)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7nights witnessed §f' + n + '§8/' + SPEAKER_NIGHT +
        (n >= SPEAKER_NIGHT ? ' §8- she has introduced herself' : '')))
      p.tell(Text.of('§7right now: §f' + (nt === null ? 'clock unreadable' : (nt ? 'NIGHT' : 'day'))))
      for (var g in SILENCED) {
        if (!SILENCED.hasOwnProperty(g)) continue
        p.tell(Text.of('§8  ' + g + ' §7' + (maySpeak(srv, p, g) ? 'may speak' : '§cSILENCED')))
      }
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'GATED OFF - the night silences nobody'); return }
    sweep(event.server)
    console.info(TAG + 'THE NIGHT IS HERS - after ' + SPEAKER_NIGHT + ' PLAYED nights ' +
      'the Speaker introduces herself, and from then on ' +
      Object.keys(SILENCED).join(' and ') + ' cannot speak between ' + NIGHT_FROM +
      ' and ' + NIGHT_TO + '. wall, forge and art keep their voices.')
    console.info(TAG + 'nights are counted EDGE-TRIGGERED and only while online - you ' +
      'must live through them, not log out through them. The gate FAILS OPEN: an ' +
      'unreadable clock lets everyone speak.')
  })
})();
