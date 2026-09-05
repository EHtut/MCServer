// opening_lines.js - GENERATED from docs/dialogue/Player intros.txt. Do not hand-edit.
//
// ⭐ ONE SENTENCE PER LINE. Ethan, 2026-08-30: *"every sentence is on a new line, that is
// a hard rule with everything I write that goes here."*
//
// 🔴 AND IT HAS TO BE ONE SENTENCE PER MESSAGE, WHICH IS MEASURED, NOT ASSUMED. Three
// things were tested live against the mod on 2026-08-30, all with a player watching:
//
//   an escaped newline   renders LITERALLY - a visible backslash followed by n
//   an escaped newline   renders LITERALLY - a visible backslash followed by n
//   a text NBT field     there is none - text is the command greedy trailing argument
//   maxWidth             a real field in ImmersiveMessage.class, and IGNORED - 90 and
//                        400 produced identical output
//
// So a single message cannot hold two lines of his text, and the hard rule REQUIRES
// separate sends. The swap between them is unavoidable; typing is what makes it a beat
// arriving rather than a line popping.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var SENTENCES = [
      "You were a traveler, Traveling from a distant land, you picked up your life an set off.",
      "A life of adventure before you.",
      "You contracted a mysterious plague, forced to take refuge in nearby village.",
      "You felt the life sapping from you, your strength fading.",
      "It was that 7th night when a mysterious woman arrived in town.",
      "Her hairs as white as snow.",
      "Her eyes, like azure and ruby gemstones.",
      "She tended to your dying body, caring for your sickness.",
      "She spoke no words.",
      "Made no sounds.",
      "She left the following morning.",
      "Your mind races with confusion.",
      "Who was that?",
      "The world awaits you.",
      "And life seems almost brighter.",
      "You set off.",
      "Adventure awaits.",
      "Yours."
  ]

  // The card the story closes on - centre screen, alone, its own moment.
  var TITLE = "ARKHDOTTIR: NEW BLOOD"

  VELDORA.openingLines = {
    sentences: function () { return SENTENCES.slice() },
    title: function () { return [TITLE] },
    // ⛔ THERE IS ONE ORIGIN, AND count() IS GONE WITH THE RANDOMISED LIFE.
    // Ethan cut it 2026-09-05: the story is the script he wrote, not a roll. build()
    // used to take a life index and discard it, and count() was hardcoded to 1 - so the
    // whole apparatus already described a single life while claiming to pick one.
    build: function () { return SENTENCES.slice() },
  }
})();
