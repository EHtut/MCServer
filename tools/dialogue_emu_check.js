// dialogue_emu_check.js — puts the emulator's assertions in the sweep.
//
// ⚠️ A CHECK OUTSIDE THE SWEEP IS A CHECK THAT ROTS. run_all.js collects files matching
// `*_harness` / `*_check`, and the emulator is `dialogue_emu.js` — so without this thin
// entry point its assertions would run once, by hand, and never again. Same reason
// story_format_check.py exists next to story_import.py.
//
// ⭐ IT RUNS THE SELFTEST FIRST, AND THE ORDER MATTERS. --check reporting "513 beats clean"
// means nothing on its own; --selftest is what proves the checker can still go red. A
// green result from an instrument that cannot fail is the most expensive kind of pass, and
// this project has already shipped one: 35/35 harnesses green over a title card that had
// never rendered.
'use strict'
const { execFileSync } = require('child_process')
const path = require('path')

const EMU = path.join(__dirname, 'dialogue_emu.js')

function run(flag, why) {
  try {
    const out = execFileSync(process.execPath, [EMU, flag], { encoding: 'utf8' })
    process.stdout.write(out)
    return 0
  } catch (e) {
    if (e.stdout) process.stdout.write(e.stdout)
    if (e.stderr) process.stderr.write(e.stderr)
    console.error('FAILED: ' + why)
    return 1
  }
}

// 1. Can the instrument still fail?   2. Does anything actually fail?
let bad = run('--selftest', 'the emulator can no longer detect a bad beat')
if (!bad) bad = run('--check', 'a scene has a beat that would render wrongly in game')
process.exit(bad ? 1 : 0)
