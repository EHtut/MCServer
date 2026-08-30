// opening_lines.js — GENERATED. Do not edit by hand.
//
//     python tools/opening_import.py --write
//
// ⭐ THE SOURCE IS `docs/dialogue/Player intros.txt`. This is a regenerated view of it.
//
// ── ⭐ THE SAME FORMAT AS THE BICKERING DOCUMENTS ────────────────────────────
// The beat model is identical; only the authoring differs. There he broke each beat onto
// its own line; here he wrote prose and delegated the breaking — *"as usual periods mean
// lines."* Not a second format, and not a second delivery path.
//
// ── THE SHAPE ────────────────────────────────────────────────────────────────
//   begin + mid   the life you had. Interchangeable — see PAIRED in the importer
//   story1        the plague, and the woman with mismatched eyes
//   end           waking up, glad
//   story2        the last line
//
// ⭐ SHE NEVER SPEAKS. "She spoke no words. Made no sounds." — which is not only the best
// line in the passage, it is what makes the whole reveal safe: Alice cannot leak, because
// she has no dialogue anywhere in the opening. docs/40 §0 says a name is the most
// expensive word in the game; this spends none of it.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var DATA = {
    "openings": [
      [
        "You were a traveler,",
        "Traveling from a distant land, you picked up your life an set off.",
        "A life of adventure before you."
      ],
      [
        "You were a fisherman,",
        "Living in a small village, sectioned away from the world.",
        "It burned to the ground.",
        "Sad, but you have never felt more free."
      ],
      [
        "You were a merchant,",
        "Moving from place to place, never once settling down."
      ]
    ],
    "story1": [
      "You contracted a mysterious plague, forced to take refuge in nearby village.",
      "You felt the life sapping from you, your strength fading.",
      "It was that 7th night when a mysterious woman arrived in town.",
      "Her hairs as white as snow.",
      "Her eyes, like azure and ruby gemstones.",
      "She tended to your dying body, caring for your sickness.",
      "She spoke no words.",
      "Made no sounds.",
      "She left the following morning."
    ],
    "end": [
      "You awaken with glee, your body refreshed.",
      "Your mind races with confusion.",
      "Who was that?",
      "You strength returns to you, you flex your arms"
    ],
    "story2": [
      "The world awaits you.",
      "And life seems almost brighter"
    ]
  }

  VELDORA.openingLines = {
    all: function () { return DATA },
    // One assembled opening: a life, then the parts everyone shares.
    build: function (i) {
      var o = DATA.openings
      if (!o || !o.length) return []
      var pick = o[((i % o.length) + o.length) % o.length]
      return pick.concat(DATA.story1, DATA.end, DATA.story2)
    },
    count: function () { return (DATA.openings || []).length },
  }
})();
