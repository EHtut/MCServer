// ank_harness.js — the band Ank exists in, and the two ways out of it.
//
//     node tools/ank_harness.js
//
// ⭐ ALMOST NONE OF ANK IS TESTABLE HERE, AND THAT IS CORRECT. His model, skin,
// unkillability and following are a PRESET — Easy NPC's job, settled in game. This file
// tests the one thing that is ours: the boundary, and that leaving fires the line.
'use strict'
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.join(__dirname, '..')
const SS = path.join(ROOT, 'pack', 'kubejs', 'server_scripts')
const PRESET = path.join(ROOT, 'pack', 'datapacks', 'mcserver_npcs',
  'data', 'easy_npc', 'preset', 'arkhdottir', 'ank.npc.snbt')

const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', X = '\x1b[0m'
let pass = 0, fail = 0
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}
function grp(t) { console.log('\n' + B + t + X) }

function build() {
  const commands = [], ambient = [], logs = []
  const server = { tickCount: 0, players: [], runCommandSilent: (c) => commands.push(c) }
  const ctx = {
    VELDORA: {
      announce: { text: (s, p, t) => { ambient.push(t); return true }, P_AMBIENT: 0 },
    },
    Math, String, JSON,
    console: { info: (m) => logs.push(String(m)), warn: (m) => logs.push('WARN ' + m), error: (m) => logs.push('ERR ' + m) },
    Text: { of: (s) => s },
    ServerEvents: { tick() { }, commandRegistry() { }, loaded() { } },
  }
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(path.join(SS, 'ank.js'), 'utf8'), ctx)
  const player = (y, sky) => ({
    username: 'Rehykt', y, server,
    level: { canSeeSky: () => sky },
    blockPosition: () => ({}),
    persistentData: {
      _d: {},
      putBoolean(k, v) { this._d[k] = v }, getBoolean(k) { return !!this._d[k] },
    },
  })
  return { A: ctx.VELDORA.ank, server, player, commands, ambient, logs }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE BAND — underground, and above the deep works')
{
  const e = build()
  ok('a cave near the surface is his', e.A.shouldBeOut(e.player(10, false)), true)
  ok('...and so is one just above the boundary', e.A.shouldBeOut(e.player(-31, false)), true)
  ok('below -32 he is gone', e.A.shouldBeOut(e.player(-40, false)), false)
  ok('...and outside he is gone', e.A.shouldBeOut(e.player(70, true)), false)

  // 🔑 THE TWO CASES THAT PROVE IT IS SKY AND NOT HEIGHT. Height alone would get both
  // of these backwards, and both are ordinary places a player stands.
  ok('a cave HIGH under a mountain still counts as underground',
    e.A.shouldBeOut(e.player(90, false)), true)
  ok('a ravine open to the sky at y=-5 does NOT',
    e.A.shouldBeOut(e.player(-5, true)), false)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 UNREADABLE IS NOT "OUTSIDE" — nothing happens on null')
{
  // ⚠️ This is the rule the whole project runs on: "I could not tell" and "he should
  // go" must never share a value. A sky read that fails must not despawn him, or an
  // unreadable chunk boundary would fire the chill for no reason.
  const e = build()
  const blind = e.player(-10, false)
  blind.level = { canSeeSky: () => { throw new Error('unreadable') } }
  blind.block = undefined
  ok('an unreadable sky returns null, not false', e.A.shouldBeOut(blind), null)
  ok('...and a sweep does nothing at all', e.A.consider(e.server, blind), 'unreadable')
  ok('...sends no command', e.commands.length, 0)
  ok('...and fires no chill', e.ambient.length, 0)

  const noY = e.player(-10, false)
  Object.defineProperty(noY, 'y', { get() { return undefined } })
  ok('an unreadable position is null too', e.A.shouldBeOut(noY), null)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ HE ARRIVES, AND HE LEAVES WITH THE LINE')
{
  const e = build()
  const p = e.player(-10, false)
  ok('first sweep in the band spawns him', e.A.consider(e.server, p), 'spawned')
  ok('...and he is marked active', e.A.isActive(p), true)
  ok('...a second sweep does not spawn a second one', e.A.consider(e.server, p), 'with-you')

  p.y = -40
  ok('going too deep despawns him', e.A.consider(e.server, p), 'despawned')
  ok('...and the line is Ethan\'s, exactly', e.ambient, ['A chill runs up your spine.'])
  ok('...and he is no longer active', e.A.isActive(p), false)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ AND HE LEAVES THE SAME WAY WHEN YOU SURFACE')
{
  const e = build()
  const p = e.player(-10, false)
  e.A.consider(e.server, p)
  p.level = { canSeeSky: () => true }
  ok('stepping into daylight despawns him', e.A.consider(e.server, p), 'despawned')
  ok('...with the same line', e.ambient, ['A chill runs up your spine.'])
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 HYSTERESIS — the line must not loop on the boundary')
{
  // 🔴 WITHOUT THIS, A PLAYER MINING AT y=-32 SPAWNS AND DESPAWNS HIM EVERY TWO SECONDS,
  // and every despawn fires the chill. A line that repeats on a loop stops being eerie
  // and becomes a visible bug — the same reason voice.js has a cooldown.
  const e = build()
  const p = e.player(-10, false)
  e.A.consider(e.server, p)          // out with him
  p.y = -33
  ok('he leaves below the boundary', e.A.consider(e.server, p), 'despawned')
  p.y = -31
  ok('...and does NOT return one block up', e.A.consider(e.server, p), 'in-the-gap')
  ok('...still only one chill', e.ambient.length, 1)
  p.y = -25
  ok('he returns once you are properly clear', e.A.consider(e.server, p), 'spawned')
  ok('...and arriving is silent - the chill is for LEAVING', e.ambient.length, 1)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⚠️ HE IS FOUND BY TAG, NOT BY TYPE')
{
  // 🔑 `@e[type=easy_npc:humanoid]` would also match every other humanoid NPC this
  // project ever adds, and the first of those would be killed by Ank's boundary check
  // with nothing anywhere to explain it.
  const e = build()
  const p = e.player(-10, false)
  e.A.consider(e.server, p)
  p.y = -40
  e.A.consider(e.server, p)
  const kill = e.commands.find(c => c.indexOf('kill') !== -1) || ''
  ok('the despawn targets the tag', kill.indexOf('tag=veldora_ank') !== -1, true)
  ok('...and not the bare entity type', /kill @e\[type=/.test(kill), false)
  const tagCmd = e.commands.find(c => c.indexOf(' tag ') !== -1) || ''
  ok('the spawn tags him so he can be found again',
    tagCmd.indexOf('add veldora_ank') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE PRESET IS GENERATED, AND CARRIES WHAT ETHAN ASKED FOR')
{
  const snbt = fs.existsSync(PRESET) ? fs.readFileSync(PRESET, 'utf8') : ''
  ok('the preset exists', snbt.length > 0, true)
  ok('unkillable', snbt.indexOf('Invulnerable:1b') !== -1, true)
  ok('follows the player', snbt.indexOf('FOLLOW_PLAYER') !== -1, true)
  ok('does not despawn on its own', snbt.indexOf('PersistenceRequired:1b') !== -1, true)
  ok('wears his own skin', snbt.indexOf('veldora:textures/entity/ank.png') !== -1, true)
  ok('he trades at all', snbt.indexOf('Type:"ADVANCED"') !== -1, true)

  // 🔴 THE CURRENCY MUST BE OBTAINABLE ABOVE GROUND, AND THIS IS THE ASSERTION THAT SAYS
  // SO. Emeralds shipped first and a day-1 pathless player has none; numismatics coins are
  // worse - no recipe, no loot table, no villager mixin, so they need Create machinery.
  // A currency the player cannot hold puts Ank's whole argument behind a door.
  const buys = (snbt.match(/buy:\{\s*id:"([^"]+)"/g) || [])
    .map(m => (m.match(/id:"([^"]+)"/) || [])[1])
  ok('he takes something you can get on the surface',
    buys.every(b => b === 'minecraft:wheat' || b === 'minecraft:bread'), true)
  ok('...and nothing that has to be mined',
    /buy:\{\s*id:"minecraft:(iron|gold|diamond|coal|copper|emerald)/.test(snbt), false)
  ok('...and no numismatics coin', snbt.indexOf('numismatics:') === -1, true)

  // ⭐ The rate has to be absurd or it is not a bribe. One wheat must buy several ingots.
  const iron = /sell:\{\s*id:"minecraft:iron_ingot",\s*count:(\d+)/.exec(snbt)
  ok('one wheat buys a pile of iron', iron && Number(iron[1]) >= 8, true)
  // ⛔ He never fights. An attack objective here would turn a warning into a brawl.
  ok('carries no attack objective', /Type:"(MELEE|BOW|CROSSBOW|GUN|ZOMBIE)_ATTACK"/.test(snbt), false)
  ok('...and no attack targeting', /Type:"ATTACK_/.test(snbt), false)
  // The skin must be lowercase or the resource location cannot resolve at all.
  ok('the skin path is lowercase', !/[A-Z]/.test(
    (snbt.match(/veldora:textures\/entity\/[^"]+/) || [''])[0]), true)
}

console.log('\n' + (fail ? R + fail + ' FAILED, ' + X : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
