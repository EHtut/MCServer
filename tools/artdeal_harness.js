// artdeal_harness.js — she tells you first, she takes all of it, and only you.
//
//     node tools/artdeal_harness.js
//
// ⭐ WHY THIS EXISTS. Three failures here are silent and each one kills the condition:
//
//   · SHE STOPS TELLING YOU. The entire mechanic is being warned in plain words and
//     saying yes anyway. If the warning ever moves after the choice, or softens into
//     flavour, the condition becomes a trick — and a trick tests only whether you read
//     the wiki. This is asserted on the TEXT, because nothing else can catch it.
//   · THE GATE READS FALSE FOREVER. It depends on speaker.met(), which did not exist
//     when this file was written — the deal would have been unreachable with nothing
//     to see in any log. Caught by checking the export, not by playing.
//   · SHE TAKES 50 INSTEAD OF ALL. A god who took exactly the price is a trader. That
//     is Salvage, and she is two files over.
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

// ── a world you drive by hand ─────────────────────────────────────────────────
let DAYTIME = 100000
let PATH_OF = ''
let IN_DEEP = true
let MET = true
const cmds = []
let lastRitual = null

const server = {
  players: [],
  overworld: () => ({ dayTime: () => DAYTIME }),
  runCommand: (c) => { cmds.push(c); return 1 },
  runCommandSilent: (c) => { cmds.push(c) },
  scheduleInTicks: () => { },
}

function mkPlayer(name, levels) {
  const data = {}
  return {
    username: name, uuid: 'u-' + name, server,
    xpLevel: (typeof levels === 'number' ? levels : 60),
    health: 20,
    setHealth: function (h) { this.health = h },
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
global.Text = { of: (s) => s }
global.VELDORA = {
  paths: { pathOf: () => PATH_OF },
  speaker: { active: () => IN_DEEP, met: () => MET },
  ritual: { begin: (p, spec) => { lastRitual = { p, spec }; return true } },
}

const ri = console.info, rw = console.warn, re = console.error
console.info = () => { }; console.warn = () => { }; console.error = () => { }
try { (0, eval)(fs.readFileSync(path.join(SS, 'art_deal.js'), 'utf8')) }
catch (e) { console.info = ri; console.warn = rw; console.error = re; console.error('FAIL: art_deal.js threw :: ' + e); process.exit(1) }
console.info = ri; console.warn = rw; console.error = re
const A = global.VELDORA.artdeal
if (!A) { console.error('FAIL: art_deal.js published nothing'); process.exit(1) }

function choose(id) {
  const c = lastRitual && lastRitual.spec && lastRitual.spec.onChoose
  if (!c) throw new Error('no ritual open')
  const i = console.info, w = console.warn, e = console.error
  console.info = () => { }; console.warn = () => { }; console.error = () => { }
  try { c(lastRitual.p, id) } finally { console.info = i; console.warn = w; console.error = e }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 SHE TELLS YOU FIRST — the assertion nothing else can catch')
{
  const text = A.lines.offer.join(' ')
  // docs/67: "it takes every level you have and kills you. She tells you this first."
  ok('🚨 the offer says it takes every level', /every level/i.test(text), true)
  ok('🚨 ...explicitly NOT just fifty', /not fifty|all of them/i.test(text), true)
  ok('🚨 ...and that she kills you', /kill you/i.test(text), true)
  ok('🚨 ...and that she is telling you BEFORE you answer',
    /before you answer/i.test(text), true)

  // The warning must be in the LINES, which render before the options, not in the
  // after-text - a warning after the choice is not a warning.
  const after = (A.lines.taken.join(' ') + A.lines.refused.join(' '))
  ok('⭐ the price is stated in the offer, not revealed afterwards',
    /every level/i.test(text) && !/takes every level/i.test(after), true)

  const src = code('art_deal.js')
  ok('the options are only accept and refuse',
    src.indexOf("{ id: 'yes', label: YES }, { id: 'no', label: NO }") !== -1, true)
}

grp('⭐ THE GATE — fifty to speak, godless, deep, and she has met you')
{
  DAYTIME = 100000; PATH_OF = ''; IN_DEEP = true; MET = true
  ok('60 levels, godless, deep, met -> eligible', A.eligible(server, mkPlayer('Ready', 60)), true)
  ok('🚨 49 levels is not enough', A.eligible(server, mkPlayer('Poor', 49)), false)
  ok('exactly 50 is enough', A.eligible(server, mkPlayer('Fifty', 50)), true)

  PATH_OF = 'blade'
  ok('🚨 a pathed player is never offered', A.eligible(server, mkPlayer('Pathed', 99)), false)
  PATH_OF = ''

  IN_DEEP = false
  ok('🚨 not in the deep -> nothing', A.eligible(server, mkPlayer('Surface', 99)), false)
  IN_DEEP = true

  MET = false
  ok('🚨 she introduces herself BEFORE she deals', A.eligible(server, mkPlayer('Stranger', 99)), false)
  MET = true

  // 🚨 An unreadable level count must not read as zero OR as enough.
  const broken = mkPlayer('Broken', 99)
  Object.defineProperty(broken, 'xpLevel', { get: () => { throw new Error('no') } })
  ok('🚨 unreadable levels -> not offered, and NOT treated as rich',
    A.eligible(server, broken), false)
  ok('...and levelsOf says null, not 0', A._levelsOf(broken), null)
}

grp('🚨 SHE TAKES ALL OF THEM — not fifty')
{
  DAYTIME = 200000; PATH_OF = ''; IN_DEEP = true; MET = true
  const p = mkPlayer('Rich', 80)
  A.offer(server, p)
  choose('yes')
  ok('🚨 eighty levels became zero', p.xpLevel, 0)
  ok('...she did not take exactly fifty', p.xpLevel === 30, false)
  ok('⭐ and it killed them', p.health, 0)
  ok('🚨 the stamp is down, so respawn can read it', p._data['veldora_art_took'], 1)
}

grp('⭐ REFUSING COSTS NOTHING')
{
  const p = mkPlayer('Careful', 80)
  A.offer(server, p)
  const before = JSON.stringify(p._data)
  choose('no')
  ok('levels untouched', p.xpLevel, 80)
  ok('alive', p.health, 20)
  ok('🚨 nothing written at all', JSON.stringify(p._data), before)
  ok('...and she has not been paid', A.took(p), false)
}

grp('🚨 A FAILED TAKE PAYS HER NOTHING AND KILLS NOBODY')
{
  const p = mkPlayer('Sticky', 80)
  Object.defineProperty(p, 'xpLevel', { get: () => 80, set: () => { } })   // never changes
  const realRun = server.runCommandSilent
  server.runCommandSilent = () => { }                                       // command fails too
  A.offer(server, p)
  choose('yes')
  server.runCommandSilent = realRun
  ok('🚨 she is not paid', A.took(p), false)
  ok('🚨 ...and does NOT kill them anyway', p.health, 20)
}

grp('⭐ ONCE, EVER')
{
  DAYTIME = 400000
  const p = mkPlayer('Done', 80)
  p._data['veldora_art_took'] = 1
  ok('🚨 she does not come back for seconds', A.eligible(server, p), false)
}

grp('🔑 THE PATHLESS HEAR HER AT ALL — E4a, the new machinery')
{
  const ds = code('deep_speaker.js')
  ok('a pathless persona exists', ds.indexOf("id: 'death_stranger'") !== -1, true)
  ok('⭐ she is §f white - the one colour no god owns',
    ds.indexOf("colour: '§f'") !== -1, true)
  ok('🚨 speakerFor returns her for the pathless',
    ds.indexOf('if (!path) return PATHLESS') !== -1, true)

  // 🚨 The file's own header rule: "A path with no registered speaker gets SILENCE
  // below the cutoff, never a stand-in voice." A pathed god with a broken registration
  // must stay silent so the bug is noticed - it must NOT fall through to her.
  ok('🚨 a PATHED player with no speaker still gets SILENCE, not the Stranger',
    ds.indexOf('return SPEAKERS[path] || null') !== -1, true)
  ok('...and never `SPEAKERS[path] || PATHLESS`',
    ds.indexOf('SPEAKERS[path] || PATHLESS') === -1, true)

  ok('🚨 speaker.met() is exported - the gate depended on it',
    ds.indexOf('met: function (p) {') !== -1, true)
}

grp('⛔ ART IS NO LONGER LAPIS')
{
  const ch = code('chosen.js')
  ok('🚨 lapis is gone', ch.indexOf('minecraft:lapis_lazuli') === -1, true)
  ok('⭐ forge is the last carry, and it is a thing you MADE',
    ch.indexOf("forge: ['create:wrench']") !== -1, true)
  ok('the sword, crossbow and lapis are all gone',
    ['iron_sword', 'crossbow', 'lapis'].every(s => ch.indexOf(s) === -1), true)

  // Chosen on respawn, on the SAME hook as Wall's.
  ok('🚨 art is chosen on respawn', ch.indexOf("artTook(p) && !isUnlocked(p, 'art')") !== -1, true)
  ok('...and hers is checked BEFORE Wall\'s - the one they PAID for wins',
    ch.indexOf("artTook(p)") < ch.indexOf('if (!wasStruck(p)) return'), true)
  ok('⭐ /path shows her real condition', ch.indexOf('take her deal') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
