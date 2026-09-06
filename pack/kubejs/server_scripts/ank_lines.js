// ank_lines.js - GENERATED from docs/dialogue/ANK Act 0 - Dialogue.txt.
// ⛔ Do not hand-edit. Edit his document and re-run:
//     python tools/ank_dialogue_import.py --write
//
// ⚠️ A BLANK DAY IS NOT A GAP. Ethan: *"i left some days of dialogue blank
// because well there's nothing to say... this is also why i built alot of
// randomized trade dialogue aswell."* A day with no line falls through to
// GENERAL, and that is the design rather than an omission.
//
// ⛔ HIS TEXT IS VERBATIM. The em-dash mid-word on day 2 is him being
// interrupted by his own argument; it is the performance, not a typo.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var DAYS = {
    2: [
      "...I don't agree with it, i don't agree with— OH! Traveller, hey!. Do you need anything?",
    ],
    4: [
      "The undead have been growing restless down there.",
      "You need to be careful if you're going to ignore me and walk down",
    ],
    7: [
      "Hey, Stay out of the mines today.",
      "Ok?",
      "There's something happening that you do not need to be apart of",
      "Im serious.",
      "Please",
    ],
  }

  var GENERAL = [
    ["Hey buddy, need anything?"],
    ["Friend."],
    ["Traveller, let me know what you need"],
    ["Watcha buyin'. HA! Haaaa... Friend of mine used to say that. Anyways, what do you need?"],
    ["Hey buddy, Got what you need in this cloak. Funny, alot of pockets.", "...No, its not a magical coat."],
    ["well, ask me for anything. I got a haul"],
  ]

  VELDORA.ankLines = {
    days: DAYS,
    general: GENERAL,
    /**
     * What Ank says on a given world day.
     *
     * ⭐ A DAY WITH NOTHING WRITTEN FALLS BACK TO THE ROTATION, deliberately.
     * Returns { lines, source } so a caller can tell a written day from the
     * general pool - 'he had nothing special today' and 'nobody wrote day 5'
     * are the same output and must not be the same REPORT.
     */
    forDay: function (day) {
      var d = DAYS[day]
      if (d && d.length) return { lines: d, source: 'day' }
      var g = GENERAL[Math.floor(Math.random() * GENERAL.length)] || []
      return { lines: g, source: 'general' }
    },
    written: function () {
      var n = 0
      for (var k in DAYS) if (DAYS.hasOwnProperty(k) && DAYS[k].length) n++
      return n
    },
  }

  ServerEvents.loaded(function () {
    console.info('[ank] ' + VELDORA.ankLines.written() + ' written day(s), ' +
      GENERAL.length + ' general quote(s). Blank days fall back to the rotation.')
  })
})();
