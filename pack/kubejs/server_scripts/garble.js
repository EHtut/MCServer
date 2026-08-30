// garble.js — with no god, nothing is translating for you.
//
// Ethan, 2026-08-29:
//     "all pathless dialogue needs to have some of those 'obscure' characters,
//      randomly spread across the entire dialogue so it's only 75% readable."
//
// ── 🔑 WHY THIS IS THE RIGHT MECHANIC AND NOT JUST AN EFFECT ───────────────────
// It states the thesis of the whole pathless track without a line of exposition. The
// five deep personas are the goddess **filtered through your patron** — with no patron
// there is no filter, which is why the Stranger is uncoloured (`deep_speaker.js`). This
// is the same idea one layer down: **nobody is translating for you**, so a quarter of
// what reaches you does not arrive.
//
// ⭐ AND IT COSTS NOTHING. `§k` is vanilla obfuscation: the client replaces the glyph
// every frame with a random one **of the same width**, so spacing never moves and the
// line does not reflow. No resource pack, no font, no client mod.
//
// ⚠️ `§r` RESETS COLOUR TOO, not just the obfuscation — so every garbled character has
// to re-emit the colour behind it or the rest of the line turns white. That is why
// `garble()` takes the colour rather than guessing it, and why a caller that forgets
// gets plain text back instead of a half-white line.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[garble] '
  var GATE = true

  // ⭐ 25% — Ethan's number, read off "only 75% readable".
  var RATE = 0.25

  // ⚠️ SPACES AND PUNCTUATION ARE NEVER TOUCHED. An obfuscated space renders as a
  // visible random glyph, which welds two words together and moves every boundary in
  // the sentence - the line stops being 75% readable and starts being unparseable.
  // Punctuation carries the rhythm, which is the last thing to take away.
  function eligibleChar(c) {
    if (c === ' ') return false
    if ('.,!?:;\'"-()[]§'.indexOf(c) !== -1) return false
    return true
  }

  // Returns the line with roughly RATE of its letters obfuscated.
  //
  // ⚠️ `colour` is the code to restore after each §r. Pass the same prefix the line is
  // being printed with, or the tail of the line loses it.
  function garble(text, colour, rate) {
    if (!GATE) return String(text)
    var s = String(text == null ? '' : text)
    if (!s) return s
    var c = (typeof colour === 'string') ? colour : ''
    var r = (typeof rate === 'number' && isFinite(rate) && rate >= 0 && rate <= 1) ? rate : RATE
    var out = ''
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i)
      if (eligibleChar(ch) && Math.random() < r) {
        out += '§k' + ch + '§r' + c
      } else {
        out += ch
      }
    }
    return out
  }

  // How much of a line survives, for the harness. Counts characters NOT wrapped.
  function readableFraction(garbled) {
    var s = String(garbled)
    var hidden = 0, i
    for (i = 0; i < s.length - 1; i++) {
      if (s.charAt(i) === '§' && s.charAt(i + 1) === 'k') hidden++
    }
    // Strip every format code to get the true character count.
    var plain = strip(s)
    if (!plain.length) return 1
    return (plain.length - hidden) / plain.length
  }

  // Remove every §<code> pair. Used by the harness and by anything that needs the
  // words back - a garbled line must still be recoverable, or it cannot be tested.
  function strip(s) {
    var t = String(s), out = '', i = 0
    while (i < t.length) {
      if (t.charAt(i) === '§' && i + 1 < t.length) { i += 2; continue }
      out += t.charAt(i)
      i++
    }
    return out
  }

  VELDORA.garble = {
    line: garble,
    strip: strip,
    readable: readableFraction,
    rate: RATE,
    enabled: function () { return GATE },
    _eligible: eligibleChar,
  }

  ServerEvents.loaded(function () {
    console.info(TAG + 'live - ' + Math.round(RATE * 100) + '% of the letters in ' +
      'PATHLESS dialogue arrive obfuscated. Spaces and punctuation are never touched, ' +
      'so the line keeps its shape and its rhythm and stays about ' +
      Math.round((1 - RATE) * 100) + '% readable.')
  })
})();
