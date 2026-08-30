// pressure_harness.js — the coefficient multiplies what the WORLD chose, not what YOU did.
//
//     node tools/pressure_harness.js
//
// ⭐ WHY THIS EXISTS. Ethan, 2026-08-29: *"spawned the devil from the devil mod and it
// spawned 4 of them."*
//
// 🚨 checkSpawn fires for EVERY spawn there is. This file's header had claimed since it
// was written that "a coefficient multiplies NATURAL spawns", and nothing checked — so
// the density branch was also multiplying spawn eggs, /summon (which is how the TIDE
// spawns), spawner blocks and structure mobs. At blade's 3.0 that is +2 guaranteed, and
// deep it hits the cap of 4. One devil became four.
//
// ⚠️ THE FAILURE IS INVISIBLE IN BOTH DIRECTIONS. Over-application looks like "the mod
// is buggy"; under-application looks like "blade got easier". Neither logs anything.
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

let checkSpawnHandler = null
global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = {
  checkSpawn: (fn) => { checkSpawnHandler = fn },
  death: () => { }, spawned: () => { },
}
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, respawned: () => { }, tick: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {}

const ri = console.info, rw = console.warn, re = console.error
console.info = () => { }; console.warn = () => { }; console.error = () => { }
try { (0, eval)(fs.readFileSync(path.join(SS, 'spawn_pressure.js'), 'utf8')) }
catch (e) { console.info = ri; console.warn = rw; console.error = re; console.error('FAIL: spawn_pressure.js threw :: ' + e); process.exit(1) }
console.info = ri; console.warn = rw; console.error = re
const P = global.VELDORA.pressure
if (!P) { console.error('FAIL: spawn_pressure.js published nothing'); process.exit(1) }

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE ACCESSOR — read out of the jar, not guessed')
{
  // dev/latvian/mods/kubejs/entity/CheckLivingEntitySpawnKubeEvent:
  //     public final transient MobSpawnType type;
  //     public MobSpawnType getType();
  ok('it reads event.type', P._spawnTypeOf({ type: 'NATURAL' }), 'NATURAL')
  ok('...and falls back to getType()',
    P._spawnTypeOf({ getType: () => 'SPAWN_EGG' }), 'SPAWN_EGG')
  ok('case is normalised', P._spawnTypeOf({ type: 'natural' }), 'NATURAL')

  // 🚨 An unreadable type must be DISTINGUISHABLE from a known one.
  ok('🚨 an unreadable type is null, not a guess', P._spawnTypeOf({}), null)
  ok('...and a throwing accessor is null too',
    P._spawnTypeOf({ get type() { throw new Error('no') } }), null)
}

grp('🚨 ONLY NATURAL COUNTS — the four that were being multiplied')
{
  ok('⭐ NATURAL counts', P._isNatural('NATURAL'), true)

  // Every one of these was getting +2 to +4 mobs before 2026-08-29.
  ok('🚨 SPAWN_EGG does NOT', P._isNatural('SPAWN_EGG'), false)
  ok('🚨 COMMAND does NOT - this is /summon, and how the TIDE spawns',
    P._isNatural('COMMAND'), false)
  ok('🚨 SPAWNER does NOT - mob spawner blocks', P._isNatural('SPAWNER'), false)
  ok('🚨 STRUCTURE does NOT', P._isNatural('STRUCTURE'), false)

  // The rest of MobSpawnType, none of which is the world choosing to populate.
  ok('none of the remaining types count',
    ['BREEDING', 'MOB_SUMMONED', 'JOCKEY', 'EVENT', 'CONVERSION', 'REINFORCEMENT',
     'TRIGGERED', 'BUCKET', 'DISPENSER', 'PATROL', 'CHUNK_GENERATION']
      .some(t => P._isNatural(t)), false)

  ok('🚨 null is not natural', P._isNatural(null), false)
}

grp('⚠️ SUBSTRING, NOT EQUALITY — a remap must not silently disable density')
{
  // A Java enum stringifies to its name here, but a wrapper or a remap could hand back
  // "MobSpawnType.NATURAL". An equality test would then return false for EVERY spawn -
  // density off everywhere, and it would read as "blade got easier", not as a bug.
  ok('⭐ a qualified name still counts', P._isNatural('MOBSPAWNTYPE.NATURAL'), true)
  // ...but it must not become so loose that it matches unrelated types.
  ok('🚨 it does not match CHUNK_GENERATION', P._isNatural('CHUNK_GENERATION'), false)
  ok('🚨 ...nor SPAWN_EGG', P._isNatural('SPAWN_EGG'), false)
}

grp('🚨 THE GATE IS WIRED, AND IT FAILS CLOSED')
{
  const src = code('spawn_pressure.js')
  ok('the handler is registered', typeof checkSpawnHandler, 'function')

  // 🚨 The gate must sit ABOVE both regimes. Suppression is currently unreachable
  // (no coefficient is below 1) but it has exactly the same bug if it ever returns.
  const gate = src.indexOf('if (!isNaturalSpawn(kind)) return')
  const density = src.indexOf('above 1: DENSITY') === -1 ? src.indexOf('DENSITY') : src.indexOf('above 1: DENSITY')
  ok('🚨 the gate exists', gate !== -1, true)
  ok('🚨 ...and sits BEFORE the suppression branch',
    gate !== -1 && gate < src.indexOf('w.coeff < 1.0'), true)
  ok('🚨 ...and before the density branch',
    gate !== -1 && gate < src.indexOf('w.coeff <= 1.0'), true)

  // ⚠️ FAILS CLOSED. Falling back to "apply to everything" is the bug being fixed.
  ok('🚨 an unreadable type RETURNS rather than proceeding',
    src.indexOf('if (kind === null) {') !== -1, true)
  ok('🚨 ...and SHOUTS, so "quieter" and "broken" are distinguishable',
    src.indexOf('CANNOT READ THE SPAWN TYPE') !== -1, true)

  // ⭐ It logs each distinct type once, so what actually reaches the hook on a
  // 300-mod server is measured rather than assumed.
  ok('⭐ each spawn type is reported once', src.indexOf('TYPES_SEEN[kind]') !== -1, true)
}

grp('⭐ THE BANNER DESCRIBES THE CODE')
{
  const raw = fs.readFileSync(path.join(SS, 'spawn_pressure.js'), 'utf8')
  ok('🚨 it says NATURAL spawns only', /multiplies NATURAL spawns ONLY/.test(raw), true)
  ok('...and names what is no longer touched',
    /Spawn eggs, \/summon, spawner blocks and structures are NOT touched/.test(raw), true)
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
