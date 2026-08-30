// slain_harness.js — 500 kills, and nothing may ever take them back.
//
//     node tools/slain_harness.js
//
// ⭐ WHY THIS EXISTS. This condition fails SILENTLY in both directions and neither is
// visible in play:
//
//   · TOO SLOW. If anything resets the tally, the door moves further away every time
//     an admin touches an unrelated counter. The player grinds and never arrives, and
//     there is nothing to report - it just looks like 500 is a big number.
//   · TOO FAST. An unlock is spent FOREVER. Unlocking Blade because slain.js failed to
//     load cannot be taken back, so this gate must fail CLOSED - the exact opposite of
//     night.js, which must fail open.
//
// 🚨 SO THE ASSERTIONS THAT MATTER ARE: the counter is its own, and nothing resets it.
'use strict'
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

// Comments stripped before any source assertion - every one of these files explains in
// prose exactly what it must not do, and an unanchored indexOf matches the prose.
function code(file) {
  const raw = fs.readFileSync(path.join(SS, file), 'utf8')
  let out = '', i = 0
  while (i < raw.length) {
    const c = raw[i], n = raw[i + 1]
    if (c === '/' && n === '/') { const j = raw.indexOf('\n', i); i = j < 0 ? raw.length : j }
    else if (c === '/' && n === '*') { const j = raw.indexOf('*/', i + 2); i = j < 0 ? raw.length : j + 2 }
    else { out += c; i++ }
  }
  return out
}

function mkPlayer(name) {
  const data = {}
  return {
    username: name,
    uuid: 'u-' + name,
    persistentData: {
      getInt: (k) => (typeof data[k] === 'number' ? data[k] : 0),
      putInt: (k, v) => { data[k] = v },
      getBoolean: (k) => !!data[k],
      putBoolean: (k, v) => { data[k] = v },
    },
    tell: () => { },
    _data: data,
  }
}

global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { } }
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, respawned: () => { }, tick: () => { } }
global.ItemEvents = { crafted: () => { }, smelted: () => { }, firstRightClicked: () => { } }
global.BlockEvents = { placed: () => { }, broken: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {}

const ri = console.info, rw = console.warn
console.info = () => { }; console.warn = () => { }
try { (0, eval)(fs.readFileSync(path.join(SS, 'slain.js'), 'utf8')) }
catch (e) { console.info = ri; console.warn = rw; console.error('FAIL: slain.js threw :: ' + e); process.exit(1) }
console.info = ri; console.warn = rw
const S = global.VELDORA.slain
if (!S) { console.error('FAIL: slain.js published nothing'); process.exit(1) }

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE THRESHOLD IS ETHAN\'S NUMBER')
{
  ok('500', S.threshold, 500)
  const p = mkPlayer('New')
  ok('a new player starts at zero', S.count(p), 0)
  ok('...and does not qualify', S.qualifies(p), false)
  ok('remaining is the full 500', S.remaining(p), 500)
}

grp('🚨 IT IS ITS OWN KEY — the trap docs/67 flagged')
{
  const p = mkPlayer('Key')
  S.add(p, 7)
  const keys = Object.keys(p._data)
  ok('exactly one key is written', keys.length, 1)
  ok('🚨 it is NOT a counters.js key', keys[0].indexOf('counter') === -1, true)
  ok('🚨 ...and not blade-scoped either', keys[0].indexOf('blade') === -1, true)
  ok('the key is the lifetime one', keys[0], 'veldora_lifetime_slain')

  // counters.js:219 zeroes every patron counter on `/counters clear`. Borrowing that
  // storage would make a 500-kill condition unreachable with no error at all.
  const cs = code('counters.js')
  ok('🚨 counters.js cannot reach this key',
    cs.indexOf('veldora_lifetime_slain') === -1, true)
}

grp('⛔ NOTHING RESETS IT')
{
  const src = code('slain.js')
  ok('🚨 slain.js exposes no clear/reset/decay',
    /\b(clear|reset|decay)\s*[:(]/.test(src), false)
  ok('...and publishes no zeroing entry point',
    Object.keys(S).some(k => /clear|reset|decay|zero/i.test(k)), false)

  // The tally must survive the thing that zeroes everything else.
  const p = mkPlayer('Survivor')
  S.add(p, 300)
  const before = S.count(p)
  // Simulate what `/counters clear` does: wipe every counters.js-shaped key.
  Object.keys(p._data).forEach(k => { if (k.indexOf('veldora_counter') === 0) delete p._data[k] })
  ok('🚨 300 kills survive a counters wipe', S.count(p), before)
}

grp('🔑 COUNTING')
{
  const p = mkPlayer('Count')
  S.add(p, 1); S.add(p, 1); S.add(p, 1)
  ok('three kills is three', S.count(p), 3)
  S.add(p, 0)
  ok('adding zero changes nothing', S.count(p), 3)
  S.add(p, -50)
  ok('🚨 a NEGATIVE add cannot subtract', S.count(p), 3)
  S.add(p, 'lots')
  ok('a nonsense add cannot corrupt it', S.count(p), 4)   // defaults to 1
}

grp('⭐ THE BOUNDARY — 499 is not chosen, 500 is')
{
  const p = mkPlayer('Edge')
  S.setTo(p, 499)
  ok('499 does not qualify', S.qualifies(p), false)
  ok('...one to go', S.remaining(p), 1)
  S.add(p, 1)
  ok('🚨 500 qualifies', S.qualifies(p), true)
  ok('remaining floors at zero, never negative', S.remaining(p), 0)
  S.add(p, 1000)
  ok('...and it keeps counting past the door', S.count(p), 1500)
  ok('still qualifies', S.qualifies(p), true)
}

grp('🚨 THE CROSSING IS ANNOUNCED EXACTLY ONCE')
{
  const p = mkPlayer('Cross')
  S.setTo(p, 498)
  let said = []
  const keep = console.info
  console.info = (m) => { said.push(String(m)) }
  S.add(p, 1)              // 499 - nothing
  const atNear = said.length
  S.add(p, 1)              // 500 - the crossing
  const atCross = said.length
  S.add(p, 1)              // 501 - nothing again
  const after = said.length
  console.info = keep
  ok('nothing said at 499', atNear, 0)
  ok('🚨 the crossing is announced', atCross > atNear, true)
  ok('🚨 ...and never again', after, atCross)
}

grp('⛔ BLADE IS NO LONGER AN ITEM')
{
  const ch = code('chosen.js')
  ok('🚨 blade is out of the carry table',
    /blade:\s*\[/.test(ch), false)
  ok('...and iron_sword is gone entirely',
    ch.indexOf('minecraft:iron_sword') === -1, true)
  // ⚠️ WAS "salvage still carries a crossbow", written at E1 to prove only Blade
  // had been removed. E2 took her off items too - by design, `docs/67` says her
  // condition IS the five deals - so this now checks that the carry table still has
  // the gods that genuinely carry, rather than being deleted for being inconvenient.
  // ⚠️ REWRITTEN TWICE as gods left the carry table - salvage at E2, art at E4.
  // ⭐ What survives is the invariant, not the roster: FORGE IS THE LAST CARRY, and
  // correctly so. A Create wrench is a thing you MADE. A sword, a crossbow and a lump
  // of lapis are things you FOUND, which is why all three had to go - lapis worst of
  // all, since chosen.js records it MEASURED on the live world burning every player's
  // one offer within minutes of spawning.
  // ⚠️ REWRITTEN THREE TIMES as gods left the carry table - salvage (E2), art (E4),
  // forge (E5). ⭐ What it asserts now is the END STATE of section E: the table is
  // EMPTY, and every god notices something you DID rather than something in your bag.
  // Blade counts what you killed, Salvage what you agreed to, Wall who passed on you,
  // Art what you handed over, Forge how you talk.
  ok('🚨 THE CARRY TABLE IS EMPTY - nobody is chosen for their inventory',
    /var TRIGGERS = \{\s*\}/.test(ch), true)
  ok('🚨 every FOUND item is gone', ['iron_sword', 'crossbow', 'lapis', 'wrench']
    .every(i => ch.indexOf(i) === -1), true)

  // ⚠️ FAILS CLOSED. An unlock is spent forever, so a missing slain.js must NOT
  // unlock him - the opposite of night.js, which must fail open.
  ok('🚨 the route fails CLOSED when slain.js is missing',
    ch.indexOf('var slainOk = false') !== -1, true)
  ok('...and it reads qualifies(), not a raw count',
    ch.indexOf('VELDORA.slain.qualifies(p) === true') !== -1, true)
  ok('...and shouts, so silence is not mistaken for "not enough kills"',
    ch.indexOf('slain.js is MISSING') !== -1, true)
}

grp('🚨 THE DISPLAY IS NO LONGER A TWO-WAY BRANCH')
{
  const ch = code('chosen.js')
  // It read `TRIGGERS[k] ? 'carry X' : 'be killed while pathless'`. With Blade out of
  // TRIGGERS that told the player, in Blade's own row, to get killed while pathless.
  ok('🚨 the old branch is gone',
    ch.indexOf("'be killed while pathless') + ')'") === -1, true)
  ok('a howTo() decides per-god', ch.indexOf('function howTo(p, k)') !== -1, true)
  ok('...and blade shows PROGRESS, not an item',
    ch.indexOf("'slay ' + VELDORA.slain.count(p)") !== -1, true)
  ok('...and an unwritten condition says so rather than guessing',
    ch.indexOf('nobody has written this condition') !== -1, true)
}

grp('🔑 THE TALLY RIDES THE EXISTING DEATH HANDLER')
{
  const chk = code('counter_hooks.js')
  ok('it is counted where the trust bump is',
    chk.indexOf('VELDORA.slain.add(killer, 1)') !== -1, true)
  // 🚨 One handler, so both counters share one definition of "monster". A second
  // EntityEvents.death would drift the first time either definition was touched.
  const deaths = (chk.match(/EntityEvents\.death/g) || []).length
  ok('🚨 counter_hooks has exactly ONE death handler', deaths, 1)
  ok('...and it still gates on isMonster()',
    chk.indexOf('victim.isMonster()') !== -1, true)
  ok('...and still ignores player kills',
    chk.indexOf('victim.player) return') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
