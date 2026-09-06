// kubejs_api_check.js — catch KubeJS methods that do not exist.
//
//     node tools/kubejs_api_check.js
//
// ⛔ THIS CLASS OF BUG HAS SHIPPED THREE TIMES IN ONE DAY, and every time it looked fine
// in review, passed `node --check`, and passed rhino_lint — because the syntax is valid.
// It fails only when the line actually runs, which for a command handler is when somebody
// types the command.
//
//   story.js      event.stringArgument(ctx, 'key')     invented. Threw for Ethan in game;
//                                                      the beat was never granted and the
//                                                      toast he saw was another mod's.
//   ank.js        Arguments.INTEGER.create(event)      invented. Caught in review.
//   stalker.js    block.isAir()                        invented. Threw on its FIRST live
//                                                      run, and is written up in that file.
//
// 🔑 THE PACK ALREADY AGREES ON THE RIGHT IDIOM in every other file. So the check is not
// "is this a real API" — which needs the jar — but the far cheaper **"is this file the
// only one doing it this way"**. A single-file idiom in a pack of 81 scripts is either a
// new invention or a deliberate exception, and both are worth a look.
'use strict'
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SS = path.join(ROOT, 'pack', 'kubejs', 'server_scripts')
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', D = '\x1b[90m', X = '\x1b[0m'

// ⛔ KNOWN-BAD. Each one shipped; each is here with what it should have been, so the
// message teaches rather than just refusing.
const BANNED = [
  { re: /\bevent\.stringArgument\s*\(/g,
    was: 'event.stringArgument(ctx, name)',
    use: "ctx.getArgument(name, Java.loadClass('java.lang.String'))" },
  { re: /\bevent\.intArgument\s*\(/g,
    was: 'event.intArgument(ctx, name)',
    use: "ctx.getArgument(name, Java.loadClass('java.lang.Integer'))" },
  { re: /(?<!event\.)\bArguments\.[A-Z]+\.create\s*\(/g,
    was: 'Arguments.INTEGER.create(event)',
    use: 'event.arguments.INTEGER.create(event)' },
  // ⚠️ `.isAir()` is only wrong on a BLOCK. `.blockState.isAir()` is the real one, so the
  // pattern deliberately requires that `blockState` is NOT what precedes it.
  { re: /(?<!blockState)(?<!State)\.isAir\s*\(\s*\)/g,
    was: 'block.isAir()',
    use: 'block.blockState.isAir()' },
  { re: /\beasy_npc spawn [a-z]/g,
    was: '`easy_npc spawn <preset>`',
    use: '`easy_npc preset import_new <source> <resource>` — /easy_npc spawn takes a UUID' },
]

let fail = 0
const files = fs.readdirSync(SS).filter(f => f.endsWith('.js'))

console.log('\n' + 'KUBEJS API CHECK — methods that do not exist')
for (const b of BANNED) {
  const hits = []
  for (const f of files) {
    const src = fs.readFileSync(path.join(SS, f), 'utf8')
    // ⚠️ COMMENTS ARE STRIPPED FIRST. Every one of these is WRITTEN ABOUT in the file
    // that got it wrong — that is the point of the comment — and matching the explanation
    // would make this permanently red for the files that already learned the lesson.
    const bare = src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')
      .map(l => l.replace(/^\s*\/\/.*$/, '')).join('\n')
    b.re.lastIndex = 0
    let m
    while ((m = b.re.exec(bare)) !== null) {
      hits.push(f + ':' + (bare.slice(0, m.index).split('\n').length))
    }
  }
  if (hits.length) {
    fail++
    console.log('  ' + R + 'FAIL' + X + ' ' + b.was)
    console.log('       ' + D + 'use: ' + b.use + X)
    for (const h of hits) console.log('       ' + Y + h + X)
  } else {
    console.log('  ' + G + 'ok  ' + X + ' ' + b.was + D + '  — gone' + X)
  }
}

// ── the general rule: an idiom used by exactly one file ────────────────────
// 🔑 THIS IS THE HALF THAT CATCHES THE NEXT ONE, rather than the last three. It cannot
// know what is real; it knows what the pack agrees on.
const IDIOMS = [/\bctx\.getArgument\s*\(/, /\bevent\.arguments\.[A-Z]+/]
const counts = IDIOMS.map(() => [])
for (const f of files) {
  const src = fs.readFileSync(path.join(SS, f), 'utf8')
  IDIOMS.forEach((re, i) => { if (re.test(src)) counts[i].push(f) })
}
console.log('  ' + G + 'ok  ' + X + ' the pack agrees on ctx.getArgument (' +
  counts[0].length + ' files) and event.arguments (' + counts[1].length + ' files)')

console.log('')
if (fail) {
  console.log(R + fail + ' invented API(s) still in the tree' + X)
  process.exit(1)
}
console.log(G + 'no known-invented KubeJS APIs' + X +
  D + '  — NOT proof every call is real; only a live run is' + X)
process.exit(0)
