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
// 🔴 THIS EXISTS BECAUSE THE RULE ALONE DID NOT HOLD. It had been given before; it lived
// in a chat and in prose, and a system written weeks earlier went on speaking in chat
// anyway — with a doc justifying it, which is worse, because the doc reads as permission.
//
// ── WHAT IT LOOKS FOR ──────────────────────────────────────────────────────
// Not `.tell(` — most of those are ADMIN COMMAND OUTPUT (`§8y 64, cutoff -52`), which is
// correct and must stay. The signature of a god SPEAKING is a chat send carrying a god's
// COLOUR or a god's line, and that is what this matches. A diagnostic and a deity look
// nothing alike once you look at the argument rather than the method.
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SS = path.join(ROOT, 'pack', 'kubejs', 'server_scripts')
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', D = '\x1b[90m', X = '\x1b[0m'

// A chat send whose text is built from a god's colour or a god's pool.
const VIOLATION = [
  { re: /\.tell\s*\([^)]*colourOf\s*\(/, why: "a god's colour going to chat" },
  { re: /\.tell\s*\([^)]*\bcolour\s*\+/, why: "a god's colour going to chat" },
  { re: /\.tell\s*\([^)]*voice\.line\s*\(/, why: "a god's line going to chat" },
  { re: /\btell\s*\(\s*p\s*,\s*colourOf\s*\(/, why: "a god's colour through a tell() helper" },
]

// ⚠️ ADMIN OUTPUT IS NOT A VIOLATION and must not be flagged, or the check becomes noise
// and gets ignored — which is how the last rule died. A line whose text starts with a
// grey/aqua diagnostic code is the operator talking to himself, not a god talking.
const ADMIN = /Text\.of\s*\(\s*'§[78ac6]/

let fail = 0
const files = fs.readdirSync(SS).filter(f => f.endsWith('.js'))

console.log('\nGODS IN CHAT — the chat bar is for characters with a body')
for (const f of files) {
  const src = fs.readFileSync(path.join(SS, f), 'utf8')
  const lines = src.split('\n')
  const hits = []
  lines.forEach((raw, i) => {
    const line = raw.replace(/^\s*\/\/.*$/, '')
    if (ADMIN.test(line)) return
    for (const v of VIOLATION) {
      if (v.re.test(line)) { hits.push({ n: i + 1, why: v.why, text: raw.trim().slice(0, 84) }); break }
    }
  })
  if (hits.length) {
    fail += hits.length
    for (const h of hits) {
      console.log('  ' + R + 'FAIL' + X + ' ' + f + ':' + h.n + D + '  — ' + h.why + X)
      console.log('       ' + Y + h.text + X)
    }
  }
}

if (!fail) {
  console.log('  ' + G + 'ok  ' + X + ' no god speaks in the chat bar' +
    D + '  (' + files.length + ' scripts)' + X)
  console.log('       ' + D + 'admin command output is NOT flagged — a diagnostic and a ' +
    'deity look nothing alike' + X)
}
console.log('')
process.exit(fail ? 1 : 0)
