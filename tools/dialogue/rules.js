// dialogue/rules.js — what "looks good" means, one rule per defect class.
//
// ⭐ EACH RULE IS A PLAIN OBJECT AND NOTHING ELSE. Adding a check is adding an entry here;
// no other file changes. A rule is a pure function of one beat plus context, so it can be
// unit-tested against a hand-built beat without running a scene.
//
//     { id, why, test(beat, ctx) -> null | 'what is wrong' }
//
// ⚠️ EVERY RULE HERE EXISTS BECAUSE THE DEFECT SHIPPED. None is hypothetical. Where a rule
// records the false version I wrote first, that note stays — a rule whose reasoning is lost
// gets "simplified" back into the bug it was written for.
'use strict'

// 🔴 CENTRE-RELATIVE, AND THAT IS THE WHOLE COORDINATE PROBLEM. voice.js:511 says it
// outright — "max distance BELOW centre a line may be thrown". A TOP_LEFT beat at y=110 is
// 110 down from the TOP EDGE and is nowhere near the chat bar. Measuring anchor-blind
// reported all 18 opening beats as sitting in the chat bar: this project's signature false
// finding, and a checker that cries wolf on correct output is worse than no checker.
const ZONES = [
  { name: 'chat bar', why: 'anything overlapping it is not rendered at all', lo: 60, hi: 9999 },
  { name: 'crosshair', why: 'text sits on the reticle and cannot be read', lo: -34, hi: 34 },
  { name: 'biome title', why: 'collides with the vanilla biome/dimension title', lo: -53, hi: -11 },
]

// ⚠️ THE BANDS ARE EXCLUSIVE AT THEIR EDGES, because voice.js's own arithmetic is:
// dodgeCrosshair cuts a band out by pushing `{lo: band.hi, hi: seg.hi}` (voice.js:568), so
// band.hi is the first ALLOWED value, not the last forbidden one. An inclusive test flagged
// forge at y=34 — a position voice.js had deliberately chosen as legal.
function zoneOf(beat) {
  if (beat.kind === 'popup') return null        // a popup carries no NBT: no geometry to test
  if (!/^CENTER/.test(beat.anchor)) return null // only CENTER_* shares this coordinate space
  return ZONES.find(z => beat.y > z.lo && beat.y < z.hi) || null
}

const RULES = [
  {
    id: 'delivered',
    why: 'immersive.js refused the send, so nothing reaches the player',
    test: (b) => b.delivered ? null
      : 'refused by immersive.js — the player sees nothing',
  },
  {
    id: 'hold-ceiling',
    // ⭐ ETHAN, D-131: "Moving dialogue is fine for a minute, a single line holding for
    // more than 15s? no." The AGGREGATE is fine; any ONE beat sitting past 15s is not.
    why: 'no single beat may hold the screen longer than 15 seconds',
    test: (b) => b.shownS > 15
      ? 'holds ' + b.shownS.toFixed(1) + 's — over the 15s ceiling'
      : null,
  },
  {
    id: 'types-in-time',
    // 🔑 The fix for a long beat is to SPLIT THE SENTENCE, never to clamp the duration:
    // clamping does not make a line arrive faster, it cuts it off mid-word.
    why: 'a beat must stay up at least long enough to finish typing itself',
    test: (b) => (b.shownS > 0 && b.shownS < b.typedS)
      ? 'needs ' + b.typedS.toFixed(1) + 's to type but is pulled after ' + b.shownS.toFixed(1) + 's'
      : null,
  },
  {
    id: 'keep-out',
    why: 'the beat is drawn over HUD the player needs, or where nothing renders',
    test: (b) => { const z = zoneOf(b); return z ? 'sits in the ' + z.name + ' zone (y=' + b.y + ') — ' + z.why : null },
  },
  {
    id: 'one-sentence',
    // ⭐ ETHAN, repeatedly: "every sentence is on a new line, that is a hard rule with
    // everything I write that goes here." The renderer shows ONE line per message, so a
    // beat carrying two sentences becomes a wrapped paragraph, not two lines.
    //
    // ⚠️ Matches voice.js's own splitter, INCLUDING its flaw: it breaks on a terminator
    // followed by a space, so "Mr. Smith is waiting." really would be sent as two. The
    // limitation is the splitter's; surfacing it at write time beats discovering it in play.
    why: 'one sentence per beat — two become a wrapped paragraph, not two lines',
    test: (b) => /[.!?]\s+\S/.test(String(b.text).replace(/[.!?]+\s*$/, ''))
      ? 'carries more than one sentence'
      : null,
  },
  {
    id: 'not-empty',
    why: 'an empty beat holds the screen and says nothing',
    test: (b) => (b.kind !== 'popup' && !String(b.text).trim())
      ? 'empty text, but it still claims the screen'
      : null,
  },
  {
    id: 'draft',
    // ⚠️ A WARNING, NOT A FAILURE. Draft lines are supposed to exist while writing; the
    // point is that they never ship silently. A pool that goes quietly empty looks
    // identical to a system that is switched off.
    level: 'warn',
    why: 'placeholder text that has not been written yet',
    test: (b) => /\[CLAUDE-DRAFT\]/.test(b.text) ? 'still a draft line' : null,
  },
]

// ════════════════════════════════════════════════════════════════════════════
// SOURCE RULES — checked on the WRITING, before the engine touches it.
//
// 🔴 THESE EXIST BECAUSE THE BEAT-LEVEL `one-sentence` RULE CAN NEVER FIRE ON REAL INPUT.
// voice.js splits a two-sentence line into two sends BEFORE anything reaches the renderer,
// so by the time a beat exists it is always one sentence. The beat rule proved it could
// fire only because the selftest handed it a beat directly, bypassing the engine — the
// exact "measure at the point of USE, not of definition" trap this project keeps paying for.
//
// ⭐ SO ETHAN'S RULE IS A WRITING RULE, AND IT IS CHECKED ON THE WRITING. The beat-level
// version stays as a backstop for anything that reaches the renderer without going through
// the splitter, which is the only way it can still be reached.
const SOURCE_RULES = [
  {
    id: 'src-one-sentence',
    why: "one sentence per line - Ethan's hard rule for everything written here",
    test: (line) => /[.!?]\s+\S/.test(String(line).replace(/[.!?]+\s*$/, ''))
      ? 'carries more than one sentence - the engine splits it into separate sends, '
        + 'each holding the screen on its own'
      : null,
  },
  {
    id: 'src-blank',
    // ⚠️ A WARNING, NOT A FAILURE, and that was a correction. As a failure it made every
    // normally-formatted draft file red for having paragraph breaks in it - so the CLI
    // filtered blanks out before linting, which made the rule unreachable instead. Neither
    // is right: the line is worth mentioning and is not worth failing over.
    level: 'warn',
    why: 'an empty line says nothing but still costs a beat',
    test: (line) => String(line).trim() ? null : 'blank line - ignored, not sent',
  },
  {
    id: 'src-escape',
    // 🔴 BOTH MEASURED LIVE, 2026-08-30. An escaped newline renders as a visible
    // backslash-n. A REAL newline renders as an LF glyph box AND dropped the player's
    // connection with a Network Protocol Error. Neither is a way to get two lines -
    // there is no way to get two lines out of one message.
    why: 'newlines cannot be embedded in a line - one message renders one line',
    test: (line) => {
      const s = String(line)
      if (s.indexOf('\\n') !== -1) return 'contains a literal backslash-n, which renders as visible text'
      if (/[\r\n]/.test(s)) return 'contains a real newline, which has dropped a connection before'
      return null
    },
  },
  {
    id: 'src-too-long',
    // 🔴 THE REAL LIMIT ON A LINE, AND IT IS NOT THE 15s CEILING. Measured 2026-09-05:
    // screen.js caps a GOD hold at 14.5s and voice.js types at 15 chars/sec, so anything
    // past ~217 characters is PULLED OFF SCREEN MID-WORD. The player sees a sentence that
    // stops. The ceiling in D-131 cannot fire for a god at all - 14.5 < 15 - so this is
    // the constraint that actually bites while writing.
    //
    // ⭐ THE NUMBER IS DERIVED FROM THE CODE, not written down here. ctx carries
    // HOLD.GOD x TYPE_CHARS_PER_SEC out of the loaded screen.js and voice.js, so moving
    // either constant moves this rule with it.
    why: 'a line longer than the hold cap can type is cut off mid-word',
    test: (line, ctx) => {
      const max = (ctx && ctx.maxChars) || 0
      if (!max) return null
      const n = String(line).length
      return n > max
        ? 'is ' + n + ' characters; anything past ' + max + ' is cut off mid-word, '
          + 'because the hold caps at ' + ctx.holdS + 's and typing runs at ' + ctx.cps + '/sec'
        : null
    },
  },
  {
    id: 'src-draft',
    level: 'warn',
    why: 'placeholder text that has not been written yet',
    test: (line) => /\[CLAUDE-DRAFT\]/.test(line) ? 'still a draft line' : null,
  },
]

module.exports = { RULES, SOURCE_RULES, ZONES, zoneOf }
