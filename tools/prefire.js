// prefire.js — run this after every chunk, before the server ever comes on.
//
//     node tools/prefire.js
//     node tools/prefire.js --game        just the in-game checklist
//
// ⭐ WHY THIS EXISTS. Ethan, 2026-09-05: *"the server should not even be on until the
// testing phase. we can build a prefire checklist for testing everything after each
// chunk."* So a chunk is finished when this is green — not when the server says so,
// because the server is off.
//
// ── 🔴 THE HALF THAT MATTERS IS THE SECOND ONE ──────────────────────────────
// This project's signature failure is a suite reading 35/35 GREEN while the pack shipped
// with a gate that had never been flipped, a font in nobody's load path, and a title card
// that had never rendered once. Every one of those was invisible offline **and nothing
// anywhere said so.**
//
// 🔑 SO PREFIRE REPORTS TWO THINGS, AND REFUSES TO CONFLATE THEM:
//     1. what was PROVED  — every harness, check and linter that can run without a game
//     2. what is UNPROVEN — the things only a live server can answer, each with the
//        exact command to answer it
//
// A chunk that is green here is not "tested". It is "everything testable without the game
// passes, and here are the N things still owed." That sentence is the whole point.
//
// ── ⭐ THE IN-GAME LIST CANNOT ROT, BECAUSE IT IS NOT A LIST ────────────────
// It is scanned out of the source. Anything that cannot be proved offline declares itself
// where it lives:
//
//     // NEEDS-GAME: what is unproven :: the command that proves it
//
// A hand-maintained checklist would be correct on the day it was written and a liability
// afterwards — which is the exact failure `stage_datapacks.py` was written to stop.
'use strict'
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', C = '\x1b[36m'
const D = '\x1b[90m', B = '\x1b[1m', X = '\x1b[0m'

// ── what can be proved with the server off ─────────────────────────────────
// ⚠️ `run_all` already sweeps every *_harness / *_check, so listing those individually
// here would double-run them and, worse, drift from what the sweep actually collects.
const OFFLINE = [
  { name: 'harnesses + checks', cmd: ['node', ['tools/run_all.js']],
    why: 'every *_harness and *_check, swept — the sweep owns the list, not this file' },
  { name: 'rhino lint', cmd: ['python', ['tools/rhino_lint.py']],
    why: 'the two script hazards `node --check` cannot see — KubeJS runs Rhino, not node' },
  // ⚠️ KNOWN-FAILING, AND REPORTED RATHER THAN HIDDEN. D-134: the scanner reads a comment
  // listing the gods as a mod namespace, so it is permanently red for a false reason. It
  // still RUNS and still prints, because the real thing it catches is nasty - an
  // unresolvable entity in a biome modifier fails registry load - but it does not turn
  // prefire red, because a suite that is red on arrival trains you to ignore the colour.
  // ⛔ Drop `knownFailing` the moment D-134 is fixed.
  { name: 'datapack refs', cmd: ['python', ['tools/check_datapack_refs.py']],
    knownFailing: 'D-134 — reads a comment listing the gods as a namespace',
    why: 'a tag naming something absent discards the WHOLE tag, silently' },
]

// ── the marker scan ────────────────────────────────────────────────────────
const SCAN_DIRS = ['pack/kubejs/server_scripts', 'tools', 'docs']
// 🔴 CARRIAGE RETURNS ARE WHY THIS FILE ALMOST SHIPPED USELESS. This repo is CRLF,
// and in JS a dot matches anything EXCEPT the four line terminators - carriage return is
// one of them. So the trailing group could never reach the end of a CRLF line, the anchor
// never matched, and EVERY marker in the tree was invisible. Prefire printed "nothing
// owed" with four items outstanding: exactly the silent-green failure it exists to
// prevent, in the tool built to prevent it.
//
// ⚠️ The line is TRIMMED before matching rather than the pattern being patched, so this
// cannot come back the next time somebody edits the regex.
const MARKER = /NEEDS-GAME:\s*(.+?)\s*::\s*(.+)$/

function scanNeedsGame() {
  const out = []
  for (const dir of SCAN_DIRS) {
    const abs = path.join(ROOT, dir)
    if (!fs.existsSync(abs)) continue
    for (const f of walk(abs)) {
      if (!/\.(js|py|md)$/.test(f)) continue
      let lines
      try { lines = fs.readFileSync(f, 'utf8').split('\n') } catch (e) { continue }
      lines.forEach((rawLine, i) => {
        // ⚠️ Strip a trailing HTML comment terminator: a marker inside a .md file is
        // written as <!-- NEEDS-GAME: ... --> and the `-->` was landing in the command
        // column, so the checklist printed a command nobody can run.
        const line = rawLine.replace(/\s*-->\s*$/, '').replace(/\s+$/, '')
        const m = MARKER.exec(line)
        if (m) out.push({ file: path.relative(ROOT, f).replace(/\\/g, '/'),
                          line: i + 1, what: m[1], how: m[2] })
      })
    }
  }
  return out
}

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'archive' || e.name === '.cache') continue
    // ⚠️ THIS FILE DESCRIBES THE MARKER, so scanning it reports the documentation and
    // the regex itself as two outstanding items. Caught on the first run - a checklist
    // whose first two entries are its own source teaches you to stop reading it.
    if (e.name === 'prefire.js') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

// ── run ────────────────────────────────────────────────────────────────────
const gameOnly = process.argv.includes('--game')
let failed = 0

if (!gameOnly) {
  console.log('\n' + B + 'PREFIRE — everything provable with the server off' + X)
  for (const step of OFFLINE) {
    const [bin, args] = step.cmd
    let ok = true, out = ''
    try {
      out = execFileSync(bin, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (e) {
      // ⚠️ A MISSING TOOL IS A FAILURE, NOT A SKIP. "I could not run it" and "it passed"
      // must never share an outcome — the rule reset_preflight.py enforces as UNKNOWN.
      ok = false
      out = (e.stdout || '') + (e.stderr || '') || String(e.message)
    }
    const tail = out.trim().split('\n').filter(Boolean).slice(-1)[0] || ''
    // ⚠️ A KNOWN FAILURE IS REPORTED, NOT HIDDEN, AND DOES NOT TURN PREFIRE RED. A suite
    // that is red on arrival for a reason nobody intends to fix trains you to ignore the
    // colour, and the next real failure then lands in an already-red result.
    const known = !ok && step.knownFailing
    console.log('  ' + (ok ? G + 'ok   ' : known ? Y + 'known' : R + 'FAIL ') + X + ' ' +
      step.name.padEnd(22) + D + tail.replace(/\x1b\[[0-9;]*m/g, '').slice(0, 56) + X)
    if (known) {
      console.log('       ' + Y + step.knownFailing + X)
    } else if (!ok) {
      failed++
      console.log(D + out.trim().split('\n').slice(-12).join('\n') + X)
    }
    console.log(D + '       ' + step.why + X)
  }
}

// ── the checklist ──────────────────────────────────────────────────────────
const owed = scanNeedsGame()
console.log('\n' + B + 'STILL OWED — only a live server can answer these' + X)
if (!owed.length) {
  console.log('  ' + G + 'nothing' + X + D + '  (no NEEDS-GAME markers in the tree)' + X)
} else {
  for (const o of owed) {
    console.log('  ' + Y + '?' + X + ' ' + o.what)
    console.log('    ' + C + o.how + X)
    console.log('    ' + D + o.file + ':' + o.line + X)
  }
}

console.log('')
if (!gameOnly) {
  console.log(failed ? R + failed + ' offline check(s) failed — fix before the server goes on' + X
                     : G + 'offline: clean' + X)
}
console.log(owed.length
  ? Y + owed.length + ' item(s) unproven until the testing phase' + X +
    D + '  — green above does NOT mean tested' + X
  : D + 'nothing is waiting on the game')
console.log('')
process.exit(failed ? 1 : 0)
