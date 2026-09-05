// dialogue_check.js — does this dialogue look good? Run it before you push.
//
//     node tools/dialogue_check.js                      everything
//     node tools/dialogue_check.js opening              one scene
//     node tools/dialogue_check.js blade                one god
//     node tools/dialogue_check.js --file lines.txt     a draft, one line per line
//     echo "Some line." | node tools/dialogue_check.js -
//     node tools/dialogue_check.js --selftest           prove it can still fail
//
// ⭐ THE POINT IS THE `--file` / STDIN FORM. It runs text that is not in the pack yet
// through the pack's real duration and placement maths, so a writing pass gets checked
// BEFORE the lines are pasted in — which is the loop that used to require being in game.
//
// Exit 0 clean, 1 findings, 2 the tool itself broke. ⚠️ Those must stay distinct: "I found
// nothing" and "I could not run" sharing an exit code is how a broken check reads as green.
'use strict'
const fs = require('fs')
const { verify, judge, lint, limitsOf, fromLines, SCENES } = require('./dialogue/verify')

const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', D = '\x1b[90m', B = '\x1b[1m', X = '\x1b[0m'
const GODS = ['blade', 'wall', 'salvage', 'forge', 'art']

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null }
const words = argv.filter(a => !a.startsWith('-'))

function report(label, r) {
  const head = r.ok ? G + '  ok  ' + X : R + ' FAIL ' + X
  console.log(head + B + label + X + D + '  ' + r.beats.length + ' beats' +
    (r.beats.length ? ', ' + (Math.max(...r.beats.map(b => b.at + b.shownS))).toFixed(1) + 's' : '') + X)
  for (const f of r.findings) {
    const where = f.line ? 'line ' + f.line : 'beat ' + f.beat + ' @' + f.at.toFixed(1) + 's'
    console.log('       ' + R + f.rule + X + '  ' + where + ' — ' + f.detail)
    if (f.text) console.log('         ' + D + JSON.stringify(f.text.slice(0, 78)) + X)
  }
  for (const w of r.warnings) {
    console.log('       ' + Y + w.rule + X + '  ' +
      (w.line ? 'line ' + w.line : 'beat ' + w.beat) + ' — ' + w.detail)
  }
  return r.ok ? 0 : r.findings.length
}

// ── the negative control ────────────────────────────────────────────────────
// 🔑 A run that reports "clean" is worth nothing until something proves the rules can
// still fire. This checks the RULES against hand-built beats, so it needs no scene and
// stays fast enough to run every time.
function selftest() {
  let bad = 0
  const beat = (o) => Object.assign({
    i: 0, kind: 'show', at: 0, sentAt: 0, queuedS: 0, text: 'A line.', subtitle: '',
    askedS: 5, shownS: 5, typedS: 0.5, anchor: 'TOP_LEFT', x: 0, y: 0,
    typewriter: true, god: null, delivered: true, command: null,
  }, o)
  const fires = (id, b) => judge([b]).findings.concat(judge([b]).warnings).some(f => f.rule === id)
  const t = (label, got, want) => {
    if (got === want) console.log('  ' + G + 'ok  ' + X + label)
    else { bad++; console.log('  ' + R + 'FAIL' + X + ' ' + label + ' — got ' + got + ', want ' + want) }
  }

  t('a 20s hold trips the ceiling', fires('hold-ceiling', beat({ shownS: 20 })), true)
  t('...a 9s hold does not', fires('hold-ceiling', beat({ shownS: 9 })), false)
  t('a refused send is caught', fires('delivered', beat({ delivered: false })), true)
  t('a beat pulled before it types is caught', fires('types-in-time', beat({ shownS: 1, typedS: 3 })), true)
  t('...one with room is not', fires('types-in-time', beat({ shownS: 5, typedS: 3 })), false)
  t('two sentences are caught', fires('one-sentence', beat({ text: 'One. Two.' })), true)
  t('...one sentence is not', fires('one-sentence', beat({ text: 'Just one.' })), false)
  t('...nor is a trailing ellipsis', fires('one-sentence', beat({ text: 'Wait...' })), false)
  t('an empty beat is caught', fires('not-empty', beat({ text: '   ' })), true)
  t('a draft line warns', fires('draft', beat({ text: '[CLAUDE-DRAFT] x' })), true)

  // ⭐ THE SOURCE RULES, which are the half that matters for a writing pass. Checked
  // through lint() - the surface the CLI actually calls - not by poking a rule directly.
  const srcFires = (id, line) => {
    const r = lint([line])
    return r.findings.concat(r.warnings).some(f => f.rule === id)
  }
  t('a two-sentence LINE is caught at source', srcFires('src-one-sentence', 'One. Two.'), true)
  t('...one sentence is not', srcFires('src-one-sentence', 'Just one.'), false)
  t('a literal backslash-n is caught', srcFires('src-escape', 'a' + String.fromCharCode(92) + 'nb'), true)
  t('a real newline is caught', srcFires('src-escape', 'a' + String.fromCharCode(10) + 'b'), true)
  t('...ordinary text is not', srcFires('src-escape', 'ordinary text'), false)
  t('a blank line is caught', srcFires('src-blank', '   '), true)

  // 🔴 THE REAL WRITING LIMIT, measured 2026-09-05 and DERIVED, never hardcoded:
  // screen.js caps a GOD hold at 14.5s and voice.js types at 15/sec, so 217 characters is
  // the most that can finish typing. Past that the line is pulled mid-word.
  //
  // ⚠️ AND IT IS WHY THE 15s CEILING CANNOT FIRE FOR A GOD. 14.5 < 15, so the cap
  // enforces D-131 structurally and `hold-ceiling` is a backstop for other priorities only.
  const lim = limitsOf(fromLines(['x']))
  t('the limit is derived from the code, not written here', lim.maxChars, 217)
  t('a line one over the limit is caught',
    lint(['a'.repeat(lim.maxChars + 1)], lim).findings.some(f => f.rule === 'src-too-long'), true)
  t('...one exactly at the limit is not',
    lint(['a'.repeat(lim.maxChars)], lim).findings.some(f => f.rule === 'src-too-long'), false)
  t('...and no god line can breach the 15s ceiling, because the cap is lower',
    lim.holdS < 15, true)

  // 🔴 AND THE ONE THAT PROVES THE SOURCE RULES ARE NEEDED AT ALL: the engine splits a
  // two-sentence line before it renders, so NO beat-level rule can ever see one. Checking
  // only beats would have passed this silently, which is what it did until 2026-09-05.
  const split = verify({ lines: ['A life ahead. And then it ended.'] })
  t('...the engine really does split it into two beats', split.beats.length, 2)
  t('...so only the source rule catches it',
    split.findings.some(f => f.rule === 'src-one-sentence'), true)

  // geometry, where every false finding this tool has produced came from
  t('y=0 centred is in the crosshair', fires('keep-out', beat({ anchor: 'CENTER_CENTER', y: 0 })), true)
  t('...y=34 is its edge, and legal', fires('keep-out', beat({ anchor: 'CENTER_CENTER', y: 34 })), false)
  t('...TOP_LEFT y=0 is another space', fires('keep-out', beat({ anchor: 'TOP_LEFT', y: 0 })), false)
  t('...a popup has no geometry', fires('keep-out', beat({ kind: 'popup', y: 0 })), false)

  console.log('')
  console.log(bad ? R + bad + ' FAILED' + X : G + 'the rules can still fire' + X)
  return bad
}

// ── dispatch ────────────────────────────────────────────────────────────────
try {
  if (has('--selftest')) process.exit(selftest() ? 1 : 0)

  let bad = 0
  const file = val('--file')
  if (file || argv.includes('-')) {
    const raw = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8')
    // ⚠️ BLANKS ARE KEPT, NOT FILTERED. Stripping them here made `src-blank` unreachable
    // from the CLI — the same dead-rule shape as the one-sentence bug, one layer up.
    // lint() reports them as a warning; fromLines() skips speaking them.
    const lines = raw.split(/\r?\n/).map(s => s.trim())
    while (lines.length && !lines[lines.length - 1]) lines.pop()   // the trailing newline only
    if (!lines.filter(Boolean).length) { console.error('no lines given'); process.exit(2) }
    console.log(D + 'checking ' + lines.filter(Boolean).length + ' line(s) against the real engine' + X)
    bad += report(file || 'stdin', verify({ lines }))
  } else if (words.length) {
    for (const w of words) {
      bad += report(w, verify(SCENES[w] ? { scene: w } : { god: w }))
    }
  } else {
    if (selftest()) process.exit(2)
    console.log('')
    for (const s of Object.keys(SCENES)) bad += report(s, verify({ scene: s }))
    for (const g of GODS) bad += report(g, verify({ god: g }))
  }

  console.log('')
  console.log(bad ? R + bad + ' finding(s)' + X : G + 'clean' + X)
  process.exit(bad ? 1 : 0)
} catch (e) {
  // ⛔ EXIT 2, NEVER 1. The tool broke; it did not find a problem with the dialogue.
  console.error(R + 'the checker itself failed: ' + X + e.message)
  process.exit(2)
}
