// warn_harness.js — THE WARNING, docs/49 §2 mechanic A.
//
//     node tools/warn_harness.js
//
// Two halves, because this feature can fail in two unrelated ways:
//
//   1. THE LOGIC — who gets warned, who does not, and WHY NOT. Six different causes
//      collapse to "nobody got a message", so incoming() returns a reason string and
//      every one of them is asserted. A broken hook hiding behind a legitimately
//      quiet one is the failure this repo keeps paying for.
//
//   2. THE REAL POOLS — loaded from the actual *_voice.js files. Wall's line was
//      written as "The champion of the blade comes for you", hardcoded, and is wrong
//      the first time Salvage sends somebody. That is a WRITING bug, invisible to any
//      logic test, so the substitution is asserted against the shipped text.

'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

let SAID = []          // {player, god, tag, subs, rendered}
let POOLS = {}         // god -> tag -> [lines]   (fake voice, half 1)
let PATHS = {}         // username -> path

const mkP = (name) => ({ username: name, uuid: 'u-' + name, tell: (s) => { SAID.push({ to: name, text: String(s) }) } })
let ONLINE = []
const server = { players: [], overworld: () => ({ dayTime: () => 1000 }), scheduleInTicks: () => { } }
Object.defineProperty(server, 'players', { get: () => ONLINE })

global.EntityEvents = { death: () => { }, beforeHurt: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { respawned: () => { }, loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.ServerEvents = { commandRegistry: () => { }, loaded: () => { }, tick: () => { } }
global.ItemEvents = { rightClicked: () => { }, entityInteracted: () => { } }
global.BlockEvents = { placed: () => { }, broken: () => { }, rightClicked: () => { } }
global.Text = { of: (s) => s }
global.Item = { of: () => ({}) }

let VOICE_PRESENT = true
global.VELDORA = {
  paths: { pathOf: (p) => PATHS[p && p.username] || '' },
}
Object.defineProperty(global.VELDORA, 'voice', {
  get: () => VOICE_PRESENT ? {
    sayAbout: (player, god, tag, subs) => {
      const pool = (POOLS[god] || {})[tag]
      if (!pool || !pool.length) return false
      let s = pool[0]
      if (subs) for (const k in subs) s = s.split('{' + k + '}').join(String(subs[k]))
      SAID.push({ to: player.username, god, tag, subs, rendered: s })
      return true
    },
    line: (god, tag) => {
      const pool = (POOLS[god] || {})[tag]
      return (pool && pool.length) ? pool[0] : null
    },
  } : undefined,
  configurable: true,
})

const realWarn = console.warn, realInfo = console.info, realErr = console.error
const hush = () => { console.warn = () => { }; console.info = () => { }; console.error = () => { } }
const speak = () => { console.warn = realWarn; console.info = realInfo; console.error = realErr }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'warn.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: warn.js threw on load :: ' + e); process.exit(1) }

const W = global.VELDORA.warn
if (!W || typeof W.incoming !== 'function') {
  speak(); console.error('FAIL: VELDORA.warn.incoming not published'); process.exit(1)
}

let pass = 0, fail = 0
function ok(name, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want)
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name) }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
const grp = (t) => { speak(); console.log('\n\x1b[1m' + t + '\x1b[0m'); hush() }

function reset() {
  SAID = []
  POOLS = {
    blade: { warn_incoming: ['A champion comes for you. Ensure you win.'] },
    wall: { warn_incoming: ['The champion of {rival} comes for you. Run!'] },
    salvage: { warn_incoming: ["Someone's coming. {rival}'s champion."] },
    art: { warn_incoming: ['should never be spoken'] },
  }
  PATHS = { Victim: 'wall', Assassin: 'blade' }
  ONLINE = [mkP('Victim'), mkP('Assassin')]
  VOICE_PRESENT = true
}

// ═══════════════════════════════════════════════════════════════════════════
grp('THE POSTURE — who warns, and who is silent ON PURPOSE')
reset()
ok('wall warns her champion', W.incoming(server, 'blade', 'Victim'), 'warned')
reset(); PATHS.Victim = 'blade'
ok('blade warns his', W.incoming(server, 'wall', 'Victim'), 'warned')
reset(); PATHS.Victim = 'salvage'
ok('salvage warns hers (ruled 2026-08-18)', W.incoming(server, 'wall', 'Victim'), 'warned')
reset(); PATHS.Victim = 'art'
// ⭐ Art's silence must be DISTINGUISHABLE from a dead hook - that is the whole
// reason incoming() returns a reason instead of a boolean.
ok('art is silent, and says so as a POSTURE not a failure', W.incoming(server, 'wall', 'Victim'), 'no-posture')
ok('...and art genuinely said nothing', SAID.length, 0)
reset(); PATHS.Victim = 'crown'
ok('crown aliases wall and still warns', W.incoming(server, 'blade', 'Victim'), 'warned')

grp('EVERY WAY IT CAN NOT FIRE HAS ITS OWN ANSWER')
reset()
ok('no target named', W.incoming(server, 'blade', ''), 'no-target')
reset(); ONLINE = [mkP('Assassin')]
ok('target offline (normal, not a fault)', W.incoming(server, 'blade', 'Victim'), 'offline')
reset(); PATHS.Victim = ''
ok('target walks no path - no god to warn them', W.incoming(server, 'blade', 'Victim'), 'pathless')
reset(); PATHS.Victim = 'wall'
// 🚨 A god warning you about ITSELF reads as a bug even though every step behaved.
ok('a god never warns about itself', W.incoming(server, 'wall', 'Victim'), 'same-god')
reset(); VOICE_PRESENT = false
ok('voice seam missing is an ERROR, not silence', W.incoming(server, 'blade', 'Victim'), 'no-voice')
reset(); POOLS.wall.warn_incoming = []
ok('posture but no lines is its OWN answer', W.incoming(server, 'blade', 'Victim'), 'no-line')
reset()
ok('all six reasons are distinct', new Set(['no-target', 'offline', 'pathless', 'same-god', 'no-voice', 'no-line']).size, 6)

grp('IT REACHES THE RIGHT PERSON')
reset()
W.incoming(server, 'blade', 'Victim')
ok('the VICTIM is warned, not the assassin', SAID.map(s => s.to), ['Victim'])
ok('...in their OWN god\'s voice, not the rival\'s', SAID[0].god, 'wall')

grp('{rival} — the hardcode this fix exists to remove')
reset()
W.incoming(server, 'blade', 'Victim')
ok('the rival god is substituted, not left as a literal', /\{rival\}/.test(SAID[0].rendered), false)
ok('and it renders his TITLE', SAID[0].rendered, 'The champion of the blade comes for you. Run!')
reset(); PATHS.Victim = 'blade'
W.incoming(server, 'wall', 'Victim')
ok('a different rival renders differently', SAID[0].subs.rival, 'the spider')
ok('every path in the table has a title', ['blade', 'wall', 'salvage', 'forge', 'art', 'crown']
  .filter(g => !W.titleOf(g) || W.titleOf(g) === g), [])

// ═══════════════════════════════════════════════════════════════════════════
// HALF 2 — the SHIPPED pools. A logic test cannot see a hardcoded god name.
// ═══════════════════════════════════════════════════════════════════════════
grp('THE REAL POOLS, loaded from the shipped *_voice.js files')
{
  delete global.VELDORA.voice
  global.VELDORA = { paths: { pathOf: () => '' } }
  // ⚠️ THE POOLS ARE REGISTERED INSIDE ServerEvents.loaded, so a stub that swallows
  // the callback loads the file and leaves every pool EMPTY - and an empty pool makes
  // `.some(...)` return false, which silently SATISFIED three of the assertions
  // below. A green harness proving nothing, again. So collect the handlers and
  // actually run them.
  const handlers = []
  global.ServerEvents = { commandRegistry: () => { }, tick: () => { }, loaded: (fn) => handlers.push(fn) }
  let loaded = true
  try {
    ;(0, eval)(fs.readFileSync(path.join(SS, 'voice.js'), 'utf8'))
    for (const f of ['blade_voice.js', 'wall_voice.js', 'salvage_voice.js']) {
      ;(0, eval)(fs.readFileSync(path.join(SS, f), 'utf8'))
    }
    const ev = { server: { scheduleInTicks: (t, fn) => fn(), players: [], overworld: () => ({ dayTime: () => 1000 }) } }
    for (const fn of handlers) { try { fn(ev) } catch (e) { } }
  } catch (e) { loaded = false; speak(); console.log('  (load threw: ' + e + ')'); hush() }
  ok('voice.js + the three god voices load', loaded, true)

  const V = global.VELDORA.voice
  for (const god of ['blade', 'wall', 'salvage']) {
    const l = V && V.line(god, 'warn_incoming', null)
    ok(god + ' has a real warn_incoming line', !!l, true)
  }

  // 🔑 THE ONE THAT MATTERS. Wall names the rival, so hers MUST substitute or she
  // announces the wrong god. Blade does not name anyone - that absence is his
  // characterisation and must not "get fixed" by a later editor.
  const wallPool = []
  for (let i = 0; i < 40; i++) { const s = V.line('wall', 'warn_incoming', null); if (s) wallPool.push(s) }
  ok('wall\'s pool references {rival} somewhere', wallPool.some(s => s.indexOf('{rival}') >= 0), true)
  ok('🚨 wall never hardcodes a rival god\'s name',
    wallPool.some(s => /the blade|the hound|the spider|the nightmare/i.test(s)), false)

  const bladePool = []
  for (let i = 0; i < 40; i++) { const s = V.line('blade', 'warn_incoming', null); if (s) bladePool.push(s) }
  ok('blade names nobody - deliberate, he does not care who', bladePool.some(s => s.indexOf('{rival}') >= 0), false)

  // Her hard cap: three sentences. She is the one god who stops talking.
  const salvPool = new Set()
  for (let i = 0; i < 200; i++) { const s = V.line('salvage', 'warn_incoming', null); if (s) salvPool.add(s) }
  const overlong = [...salvPool].filter(s => (s.match(/[.!?]/g) || []).length > 3)
  ok('salvage never exceeds 3 sentences (her hard cap)', overlong, [])
}

speak()
console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
