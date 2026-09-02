// confession_harness.js — the confession must be EARNED, not waited out.
//
//     node tools/confession_harness.js
//
// 🔴 WHY THIS EXISTS. Ethan, 2026-08-29: *"I think liam stepped into the depths and
// instantly got it a few sessions ago."* He was right, and it was not a code fault —
// `confessionEligible` did exactly what it said. The fault was WHICH NUMBER it read.
//
// Phase is a band over **notoriety**, and `/path` states what notoriety is: *"It rises
// with the levels you gain, and on its own with the days."* So a player who simply
// existed long enough reached `companion`, and the only remaining condition was walking
// downstairs. **The most guarded writing in the game was gated on the passage of time.**
//
// 🚨 THE ASSERTIONS THAT MATTER ARE THE REFUSALS. "She confessed" is easy to see in
// play; "she confessed to somebody who had not earned it" is invisible until the text
// is already spent — and a confession spent is gone.
'use strict'
// -- REWRITTEN AS A REMOVAL GUARD ------------------------------------------
// 🔴 THE SYSTEM DESCRIBED ABOVE NO LONGER EXISTS, AND THIS FILE NOW GUARDS ITS ABSENCE.
//
// Ethan, 2026-08-30: *"so we remove deep speaker confession."* It went with the wider
// retcon - *"im retconning the rule for unique deep speakers. It will always just be
// caebrim"* - so there is no per-god deep speaker left to confess to anybody.
//
// ⭐ NOTHING IS LOST. All four confession scripts are archived verbatim in
// docs/archive/deep-speaker-confessions-2026-08-30.md, and the reasoning that made this
// harness worth writing is kept above ON PURPOSE: the bug was never in the eligibility
// code, it was that the most guarded writing in the game was gated on a number that
// rises with the passage of time. That mistake is re-makeable by anyone who builds a
// gated reveal later, which is why the account of it stays here.
//
// 🚨 SO THE ASSERTIONS INVERT. They no longer prove the confession is earned; they prove
// it is GONE. If the machinery returns, this goes red and whoever brought it back has to
// read the paragraphs above and decide deliberately - rather than re-deriving Liam's bug.
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

let pass = 0, fail = 0
const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', X = '\x1b[0m'
function grp(t) { console.log('\n' + B + t + X) }
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}

const files = fs.readdirSync(SS).filter(f => f.endsWith('.js'))
const all = files.map(f => ({ f, src: fs.readFileSync(path.join(SS, f), 'utf8') }))

grp('THE CONFESSION IS GONE - and must not come back by accident')
{
  // 🚨 THE NEGATIVE CONTROL, AND IT COMES FIRST. Every assertion in this group is an
  // ABSENCE - "no file references X" - and an absence is precisely what a sweep that read
  // NOTHING also reports. Point SS somewhere wrong, or let the extension filter drift,
  // and this would certify the retcon against zero files and print a clean 4/4.
  //
  // 🔑 "I found nothing" and "I did not look" must never share a result. So the sweep
  // states its own size before it is trusted to report an empty one.
  ok('the sweep actually read the script tree - an empty read is not a clean one',
    all.length > 40, true)
  ok('...and it read CONTENT, not just filenames',
    all.every(x => x.src.length > 0), true)
  // ⭐ And the file the retcon was ABOUT is definitely in the sweep. A filter that quietly
  // stopped matching it would make this group vacuous while the count above still looked
  // healthy.
  ok('...including deep_speaker.js, the file this retcon emptied',
    all.some(x => x.f === 'deep_speaker.js'), true)

  // ⚠️ Measured at the point of USE across the WHOLE tree, not in deep_speaker.js alone.
  // A retired idiom returns through NEW code; that has happened in this repo before.
  const hits = all.filter(x => /confessionEligible|speaker\.eligible|confessionStage/.test(x.src))
  ok('no file references the confession eligibility machinery', hits.map(x => x.f), [])

  // The data shape is the other half: an entry still carrying a `confession` array would
  // be silently unreachable rather than loud, which is the worse failure.
  const withArray = all.filter(x => /confession: \[/.test(x.src))
  ok('no deep speaker entry declares a confession array', withArray.map(x => x.f), [])
}

grp("ETHAN'S WRITING IS ARCHIVED, NOT DELETED")
{
  const arch = path.join(__dirname, '..', 'docs', 'archive',
    'deep-speaker-confessions-2026-08-30.md')
  ok('the archive of all four scripts exists', fs.existsSync(arch), true)
  // 🚨 EXISTS IS NOT ENOUGH - an empty file passes that and loses the writing.
  ok('...and still holds them',
    fs.existsSync(arch) && fs.readFileSync(arch, 'utf8').length > 2000, true)
}

console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
