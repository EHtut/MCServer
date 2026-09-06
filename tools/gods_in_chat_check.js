// gods_in_chat_check.js — GODS DO NOT USE THE CHAT. EVER.
//
//     node tools/gods_in_chat_check.js
//
// Ethan, 2026-09-06, in capitals, after finding god bickering in his chat bar:
//
//     GODS.DO.NOT.USE.THE.CHAT.
//     GODS USE THE DIALOGUE SYSTEM ONLY.
//     WE DO NOT EVER USE THE CHAT UNLESS IT IS A PHYSICALLY PRESENT CHARACTER
//
// ⭐ THE CHAT BAR IS FOR PEOPLE WHO ARE STANDING THERE. Ank belongs in it because Ank has
// a body you can walk up to. A god has no body, so a god has no business in it.
//
// ── 🔴 THE FIRST VERSION OF THIS FILE WAS VACUOUS, AND IT WAS WRITTEN THE SAME NIGHT ──
//
// It exempted "admin output" by COLOUR CODE:
//
//     const ADMIN = /Text\.of\s*\(\s*'§[78ac6]/          <- the bug
//
// §6 is Salvage's colour. §c is the deep speaker's. §7 is a god's. So the exemption
// whitelisted the exact speech it existed to catch, and the check reported
// "no god speaks in the chat bar (80 scripts)" while `chosen.js` announced a god with
// `p.tell(Text.of('§8Something has noticed you.'))` and `paths.js` had a patron speak its
// entry line painted in its own god colour.
//
// 🔑 COLOUR CANNOT TELL A DIAGNOSTIC FROM A DEITY, because they use the same palette.
// STRUCTURE can: operator output lives inside `ServerEvents.commandRegistry(...)`, because
// that is the only place a command handler can be. Speech lives everywhere else. So the
// exemption is now a LOCATION, which is a fact about the file rather than a guess about
// the text.
//
// ⚠️ It still cannot read intent. A `.tell` outside a command block that is genuinely a
// present character — Ank — is listed in ALLOW below, by file, with the reason. That list
// is short on purpose and every entry is a claim somebody has to defend.
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SS = path.join(ROOT, 'pack', 'kubejs', 'server_scripts')
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', D = '\x1b[90m', X = '\x1b[0m'

// ⭐ THE ONLY SPEAKERS ALLOWED IN THE CHAT BAR, and why. A body you can walk up to.
const ALLOW = {
  'ank.js': 'Ank has a body. He is the reason the rule says "physically present character".',
  'caebrim.js': 'Caebrim appears in person in Act 0. Her tide lines go to the overlay.',
}

// Files that carry no speech at all — pure tooling. Listed so the report is short enough
// to read; a false entry here hides a real violation, so each is a deliberate claim.
const NOT_SPEECH = new Set(['screen.js', 'immersive.js', 'telemetry.js', 'coefficients.js'])

// ⭐ DEBUG BENCHES. Every send in these is operator output; they exist to be run by hand
// with /dtest, /patron, /probe. They are exempted BY FILE rather than by location because
// they define print helpers OUTSIDE the command block and call them from inside, which the
// location test cannot follow — and chasing that would make the check clever rather than
// correct.
//
// ⛔ THIS LIST IS NOT A PLACE TO PUT AN INCONVENIENT FILE. Each entry is a debug tool with
// no player-facing path at all; if one ever speaks to a player who did not type a command,
// it comes off this list.
const BENCH = new Set(['dialogue_test.js', '_probe_patron.js', '_probe_salvage.js',
                       '_probe_attr.js'])

/** Line numbers that fall inside a ServerEvents.commandRegistry(...) block. */
function commandLines(src) {
  const lines = src.split('\n')
  const inside = new Set()
  let depth = 0, active = false
  lines.forEach((l, i) => {
    if (!active && /ServerEvents\.commandRegistry\s*\(/.test(l)) { active = true; depth = 0 }
    if (active) {
      inside.add(i + 1)
      for (const ch of l) {
        if (ch === '(' || ch === '{') depth++
        else if (ch === ')' || ch === '}') depth--
      }
      if (depth <= 0 && /[)}]/.test(l)) active = false
    }
  })
  return inside
}

let fail = 0, checked = 0
const files = fs.readdirSync(SS).filter(f => f.endsWith('.js'))

console.log('\nGODS IN CHAT — the chat bar is for characters with a body')
for (const f of files) {
  if (NOT_SPEECH.has(f) || BENCH.has(f)) continue
  const src = fs.readFileSync(path.join(SS, f), 'utf8')
  const cmd = commandLines(src)
  const hits = []
  src.split('\n').forEach((raw, i) => {
    const n = i + 1
    if (cmd.has(n)) return                                  // operator output
    const line = raw.replace(/^\s*\/\/.*$/, '').replace(/^\s*\*.*$/, '')
    if (!/\.tell\s*\(/.test(line) && !/\btell\s*\(\s*p\s*,/.test(line)) return
    if (/function\s+tell\s*\(/.test(line)) return           // the helper's own definition
    hits.push({ n, text: raw.trim().slice(0, 88) })
  })
  checked++
  if (!hits.length) continue
  if (ALLOW[f]) {
    console.log('  ' + G + 'ok  ' + X + ' ' + f + D + '  ' + hits.length +
      ' chat send(s) — ALLOWED: ' + ALLOW[f] + X)
    continue
  }
  fail += hits.length
  console.log('  ' + R + 'FAIL' + X + ' ' + f + D + '  ' + hits.length +
    ' chat send(s) outside a command block' + X)
  for (const h of hits.slice(0, 4)) console.log('       ' + Y + f + ':' + h.n + '  ' + h.text + X)
  if (hits.length > 4) console.log('       ' + D + '...and ' + (hits.length - 4) + ' more' + X)
}

console.log('')
// ⚠️ A SUMMARY LINE IN run_all's SHAPE, or the sweep reads a non-zero exit with no summary
// as a CRASH - and a crash means "the count you are reading is not the count that exists",
// which is a different and worse fact than "these assertions fail".
console.log(fail ? (fail + ' FAILED, ' + (checked - fail) + ' passed')
                 : (checked + ' passed'))
if (fail) {
  console.log(R + fail + ' chat send(s) from something without a body' + X)
  console.log(D + 'Either move it to the dialogue system (VELDORA.voice / VELDORA.im), or ' +
    'add the file to ALLOW with the body it has.' + X)
  process.exit(1)
}
console.log(G + 'no bodiless speaker uses the chat bar' + X +
  D + '  (' + checked + ' scripts; operator output inside commandRegistry is exempt ' +
  'by LOCATION, not by colour)' + X)
process.exit(0)
