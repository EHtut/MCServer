// dialogue_emu.js — WATCH the dialogue. The viewer half of the toolkit.
//
//     node tools/dialogue_emu.js --list
//     node tools/dialogue_emu.js opening                 timeline table
//     node tools/dialogue_emu.js blade --play --fast     terminal playback
//     node tools/dialogue_emu.js opening --raw           the literal wire commands
//     node tools/dialogue_emu.js opening --html out.html a screen you can watch
//     node tools/dialogue_emu.js --json                  every timeline, for a player
//
// ⛔ IT VERIFIES NOTHING. That is `tools/dialogue_check.js`, and the split is deliberate:
// this file is for LOOKING at dialogue, that one is for GATING it. Keeping the rules out of
// here is what stops a viewer tweak from quietly changing what "clean" means.
//
// ⭐ AND IT OWNS NO TIMING MATHS. The sandbox, the clock and the queue model all come from
// tools/dialogue/emulate.js — the same module the checker uses. Two implementations of one
// timing model is exactly how two tools come to disagree with nobody noticing.
'use strict'
const fs = require('fs')
const path = require('path')
const { timeline } = require('./dialogue/emulate')
const { SCENES, fromGod, fromScene } = require('./dialogue/verify')
const { ZONES, zoneOf } = require('./dialogue/rules')

const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', C = '\x1b[36m', D = '\x1b[90m'
const B = '\x1b[1m', X = '\x1b[0m'
const GODS = ['blade', 'wall', 'salvage', 'forge', 'art']
const CPS = 15   // display only; the real rate is read from voice.js inside emulate.js

const ALL = {}
for (const s of Object.keys(SCENES)) ALL[s] = { what: SCENES[s].what, kind: 'scene' }
for (const g of GODS) ALL[g] = { what: 'every written pool for ' + g + ', one line each', kind: 'god' }

// The zones as the HTML player wants them (it draws from centre, so it needs from/to).
const zonesForPage = () => ZONES.map(z => ({ name: z.name, why: z.why, from: z.lo, to: z.hi }))

function run(name) {
  if (!ALL[name]) throw new Error('unknown: ' + name + ' (have: ' + Object.keys(ALL).join(', ') + ')')
  const w = ALL[name].kind === 'scene' ? fromScene(name) : fromGod(name)
  return { name, what: ALL[name].what, beats: timeline(w), commands: w.commands }
}

// ── the table ───────────────────────────────────────────────────────────────
function table(r) {
  console.log('\n' + B + r.name + X + D + '  ' + r.what + X)
  const last = r.beats[r.beats.length - 1]
  console.log(D + '  ' + r.beats.length + ' beats · ' +
    (last ? (last.at + last.shownS).toFixed(1) : 0) + 's' + X)
  console.log(D + '  ' + 'at'.padStart(8) + '  ' + 'shown'.padStart(6) + '  anchor        text' + X)
  for (const b of r.beats) {
    const flags = []
    if (!b.delivered) flags.push(R + 'not delivered' + X)
    if (b.shownS > 15) flags.push(R + '>15s' + X)
    if (b.shownS < b.typedS) flags.push(Y + 'cut mid-type' + X)
    const z = zoneOf(b)
    if (z) flags.push(R + z.name + X)
    if (b.queuedS > 0.05) flags.push(D + 'queued ' + b.queuedS.toFixed(1) + 's' + X)
    console.log('  ' + (b.at.toFixed(1) + 's').padStart(8) + '  ' +
      (b.shownS.toFixed(1) + 's').padStart(6) + '  ' + D + b.anchor.padEnd(13) + X +
      (b.kind === 'popup' ? C + '[card] ' + X : '') + b.text.slice(0, 60) +
      (flags.length ? '  ' + flags.join(' ') : ''))
    if (b.subtitle) console.log(' '.repeat(33) + D + b.subtitle + X)
  }
}

// ── terminal playback ───────────────────────────────────────────────────────
async function play(r, fast) {
  const scale = fast ? 8 : 1
  const sleep = (ms) => new Promise(res => setTimeout(res, ms / scale))
  console.log('\n' + B + 'playing ' + r.name + X + D +
    (fast ? '  (8x)' : '  (real time — ctrl-c to stop)') + X + '\n')
  let clock = 0
  for (const b of r.beats) {
    await sleep(Math.max(0, (b.at - clock) * 1000))
    clock = b.at
    const head = D + b.at.toFixed(1).padStart(7) + 's ' + X
    if (b.kind === 'popup') {
      console.log(head + C + B + b.text + X)
      if (b.subtitle) console.log('         ' + D + b.subtitle + X)
    } else if (b.typewriter) {
      process.stdout.write(head)
      for (const ch of b.text) { process.stdout.write(ch); await sleep(1000 / CPS) }
      process.stdout.write('\n')
      clock += b.text.length / CPS
    } else {
      console.log(head + b.text)
    }
  }
}

// ── the HTML screen ─────────────────────────────────────────────────────────
function html(r, out) {
  const tpl = path.join(__dirname, 'dialogue_emu_player.html')
  const page = fs.readFileSync(tpl, 'utf8').replace('/*__DATA__*/null', JSON.stringify({
    name: r.name, what: r.what, typeCps: CPS, zones: zonesForPage(), beats: r.beats,
  }, null, 1))
  fs.writeFileSync(out, page)
  console.log(G + 'wrote ' + X + out + D + '  (' + r.beats.length + ' beats)' + X)
}

// ── dispatch ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flags = new Set(argv.filter(a => a.startsWith('--')))
const words = argv.filter(a => !a.startsWith('--'))

try {
  if (flags.has('--json')) {
    const out = {}
    for (const n of (words.length ? words : Object.keys(ALL))) {
      const r = run(n)
      out[n] = { what: r.what, cps: CPS, zones: zonesForPage(), beats: r.beats }
    }
    process.stdout.write(JSON.stringify(out))
    process.exit(0)
  }

  if (flags.has('--list') || !words.length) {
    console.log('\n' + B + 'scenes and speakers' + X)
    for (const k of Object.keys(ALL)) console.log('  ' + k.padEnd(10) + D + ALL[k].what + X)
    console.log('\n' + D + '  node tools/dialogue_emu.js <name> [--play [--fast]] [--raw] [--html out]' + X)
    console.log(D + '  to VERIFY rather than watch:  node tools/dialogue_check.js' + X + '\n')
    process.exit(0)
  }

  const r = run(words[0])
  if (flags.has('--raw')) {
    for (const c of r.commands) console.log((c.tick / 20).toFixed(1).padStart(8) + 's  ' + c.c)
  } else if (flags.has('--html')) {
    const i = argv.indexOf('--html')
    html(r, (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[i + 1] : 'dialogue.html')
  } else if (flags.has('--play')) {
    play(r, flags.has('--fast'))
  } else {
    table(r)
  }
} catch (e) {
  console.error(R + 'emulator failed: ' + X + e.message)
  process.exit(2)
}
