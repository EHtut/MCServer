// bicker_harness.js — who may overhear which scene, and how a scene is paced.
//
//     node tools/bicker_harness.js
//
// ⭐ WHAT IS ACTUALLY BEING TESTED
// --------------------------------
// Not the words — those are Ethan's and the importer has its own report. This is the
// GATE: an agnostic scene needs a champion of either god in the pair, a gated scene needs
// the named one, and both need that champion to be at the scene's trust tier.
//
// 🚨 THE INVARIANT THAT MATTERS MOST: an UNREADABLE tier matches nothing. docs/41
// invariant #4. Defaulting it to `low` would make every storage hiccup produce the
// low-trust scene — the version where the gods are politest — so the failure would read
// as content rather than as a fault, and nobody would ever report it.
//
// ⚠️ EVERY CASE HAS A MUTATION. This repo has shipped ten assertions that could not fail
// in one week. A check that passes against both the real code and a broken variant is
// deleted, not downgraded.
'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

function build(opts) {
  opts = opts || {}
  const sent = []
  const scheduled = []
  const players = []

  const server = {
    tickCount: opts.tick || 1000000,
    players,
    scheduleInTicks(t, fn) {
      scheduled.push({ at: t, fn })
      if (!opts.noRun) { try { fn() } catch (e) { } }
    },
  }

  // counters: uuid -> { god: value }
  const counters = opts.counters || {}
  const paths = opts.paths || {}

  const VELDORA = {
    paths: { pathOf: (p) => paths[p.uuid] || null },
    counter: {
      get: (p, god) => {
        const c = counters[p.uuid]
        if (!c || !(god in c)) return null
        return c[god]
      },
    },
    voice: {
      speakChunks: (p, god, chunks, tag, o) => {
        sent.push({ who: p.uuid, god, chunks: chunks.slice(), obf: o && o.obfuscate })
        return true
      },
      chunksTicks: (god, chunks) => chunks.reduce((a, c) => a + Math.max(12, c.length), 0),
      alignedTo: (p, god) => paths[p.uuid] === god,
      colourOf: () => '§7',
      // pantheon.define calls these while registering; they are not what is under test
      // here, so they only need to exist and not lie about succeeding.
      setColour: () => { },
      setStyle: () => { },
      setGarbled: () => { },
      registerLines: () => true,
      register: () => true,
    },
  }

  const ctx = {
    VELDORA,
    console: { info() { }, warn() { }, error() { }, log() { } },
    Math,
    Text: { of: (s) => s },
    Utils: { server },
    ServerEvents: { loaded: (f) => (ctx._loaded = ctx._loaded || []).push(f),
                    commandRegistry: () => { }, tick: () => { } },
    PlayerEvents: { loggedOut: () => { }, loggedIn: () => { } },
    Commands: null,
    Java: { loadClass: () => ({}) },
  }
  vm.createContext(ctx)
  return { ctx, VELDORA, sent, scheduled, server, players, counters, paths }
}

function load(env, file) {
  vm.runInContext(fs.readFileSync(path.join(SS, file), 'utf8'), env.ctx, { filename: file })
}

function addPlayer(env, uuid, god, count) {
  env.players.push({ uuid, username: uuid, tell: () => { }, get server() { return env.server } })
  if (god) env.paths[uuid] = god
  if (typeof count === 'number') {
    env.counters[uuid] = env.counters[uuid] || {}
    env.counters[uuid][god] = count
  }
}

// A tiny stand-in for the generated scenes file, so the gate is tested against KNOWN
// input rather than against 62 real scenes whose contents may change under it.
function withScenes(env, list) {
  env.ctx.VELDORA.bickerScenes = { all: () => list, count: () => list.length }
}

// pantheon.tierOf reads SPECS, so the gods must be defined for tiers to resolve.
function definePantheon(env) {
  load(env, 'pantheon.js')
  const P = env.ctx.VELDORA.pantheon
  P.define('art', { colour: '§1', tiers: { medium: 8, high: 25 }, lines: { x: ['a'] } })
  P.define('blade', { colour: '§4', tiers: { medium: 50, high: 200 }, lines: { x: ['a'] } })
  P.define('wall', { colour: '§5', tiers: { medium: 10, high: 50 }, lines: { x: ['a'] } })
  P.define('forge', { colour: '§2', tiers: { medium: 250, high: 1200 }, lines: { x: ['a'] } })
}

const SCENE_AGNOSTIC = {
  pair: ['art', 'blade'], tier: 'low', needs: null,
  turns: [{ god: 'art', chunks: ['One.'] }, { god: 'blade', chunks: ['Two.'] }],
}
const SCENE_GATED = {
  pair: ['art', 'blade'], tier: 'low', needs: 'blade',
  turns: [{ god: 'art', chunks: ['One.'] }, { god: 'blade', chunks: ['Two.'] }],
}
const SCENE_HIGH = {
  pair: ['art', 'blade'], tier: 'high', needs: null,
  turns: [{ god: 'art', chunks: ['One.'] }, { god: 'blade', chunks: ['Two.'] }],
}

function fresh(scenes) {
  const env = build({ noRun: true })
  definePantheon(env)
  load(env, 'bicker.js')
  withScenes(env, scenes)
  return env
}

const CASES = []
const t = (n, f) => CASES.push([n, f])

t('an agnostic scene fires for a champion of EITHER god in the pair', () => {
  const env = fresh([SCENE_AGNOSTIC])
  addPlayer(env, 'p1', 'blade', 0)          // low tier
  assert(env.ctx.VELDORA.bicker.eligible(env.players).length === 1, 'blade champion should qualify')
  const env2 = fresh([SCENE_AGNOSTIC])
  addPlayer(env2, 'p1', 'art', 0)
  assert(env2.ctx.VELDORA.bicker.eligible(env2.players).length === 1, 'art champion should qualify')
})

t('a champion of an UNRELATED god does not qualify', () => {
  const env = fresh([SCENE_AGNOSTIC])
  addPlayer(env, 'p1', 'wall', 0)
  assert(env.ctx.VELDORA.bicker.eligible(env.players).length === 0,
    'a wall champion must not unlock an art+blade scene')
})

t('a gated scene requires the NAMED god, not either one', () => {
  const env = fresh([SCENE_GATED])
  addPlayer(env, 'p1', 'art', 0)
  assert(env.ctx.VELDORA.bicker.eligible(env.players).length === 0,
    'an art champion must not unlock a blade-gated scene')
  const env2 = fresh([SCENE_GATED])
  addPlayer(env2, 'p1', 'blade', 0)
  assert(env2.ctx.VELDORA.bicker.eligible(env2.players).length === 1,
    'a blade champion must unlock a blade-gated scene')
})

t('the trust tier must MATCH, not merely exist', () => {
  const env = fresh([SCENE_HIGH])
  addPlayer(env, 'p1', 'blade', 0)          // low, scene wants high
  assert(env.ctx.VELDORA.bicker.eligible(env.players).length === 0,
    'a low-trust champion must not unlock a high-trust scene')
  const env2 = fresh([SCENE_HIGH])
  addPlayer(env2, 'p1', 'blade', 500)       // >= 200 == high
  assert(env2.ctx.VELDORA.bicker.eligible(env2.players).length === 1,
    'a high-trust champion must unlock it')
})

t('🚨 an UNREADABLE tier matches NOTHING - it is not treated as low', () => {
  // No counter row at all: VELDORA.counter.get returns null.
  const env = fresh([SCENE_AGNOSTIC])
  addPlayer(env, 'p1', 'blade')             // path but NO counter
  assert(env.ctx.VELDORA.pantheon.tierOf('blade', env.players[0]) === null,
    'the setup is wrong: tier should be unreadable here')
  assert(env.ctx.VELDORA.bicker.eligible(env.players).length === 0,
    'an unreadable counter must unlock nothing - defaulting to low would make every ' +
    'storage hiccup produce the politest scene, and read as content')
})

t('⭐ the tier is the HIGHEST present, not each listener\'s own', () => {
  // Ethan, 2026-08-30: "Tier of is the highest god's trust."
  // Two champions, one low and one high. The high one sets the tier for the room.
  const env = fresh([SCENE_AGNOSTIC, SCENE_HIGH])
  addPlayer(env, 'lo', 'blade', 0)          // low
  addPlayer(env, 'hi', 'art', 100)          // >= 25 == high
  const pool = env.ctx.VELDORA.bicker.eligible(env.players)
  assert(pool.length === 1, 'exactly one tier should be live, got ' + pool.length)
  assert(pool[0] === 1, 'the HIGH scene should be the eligible one, not the low')

  // 🔑 THE CONTROL: with only the low champion present, the low scene is the live one.
  // Without this, a rule of "always pick the high scene" would pass the assertion above.
  const env2 = fresh([SCENE_AGNOSTIC, SCENE_HIGH])
  addPlayer(env2, 'lo', 'blade', 0)
  const pool2 = env2.ctx.VELDORA.bicker.eligible(env2.players)
  assert(pool2.length === 1 && pool2[0] === 0,
    'with only a low champion the LOW scene is live, got ' + JSON.stringify(pool2))
})

t('an unreadable champion does not drag the highest tier down', () => {
  // ⚠️ A null tier must be SKIPPED, not ranked below low - otherwise one player with an
  // unreadable counter would silently mute every scene for everyone else.
  const env = fresh([SCENE_HIGH])
  addPlayer(env, 'broken', 'blade')          // path, no counter
  addPlayer(env, 'hi', 'art', 100)           // high
  assert(env.ctx.VELDORA.bicker.eligible(env.players).length === 1,
    'the readable high champion should still set the tier')
})

t('a PATHLESS player unlocks nothing', () => {
  const env = fresh([SCENE_AGNOSTIC])
  addPlayer(env, 'p1', null)
  assert(env.ctx.VELDORA.bicker.eligible(env.players).length === 0,
    'a pathless player has no god and no tier')
})

t('a scene is not repeated while others remain', () => {
  const A = JSON.parse(JSON.stringify(SCENE_AGNOSTIC))
  const B = JSON.parse(JSON.stringify(SCENE_AGNOSTIC))
  B.turns[0].chunks = ['Different.']
  const env = build({ noRun: true })
  definePantheon(env)
  load(env, 'bicker.js')
  withScenes(env, [A, B])
  addPlayer(env, 'p1', 'blade', 0)
  addPlayer(env, 'p2', 'art', 0)
  env.ctx.VELDORA.broadcast = { scene: () => 'sent' }
  env.ctx.VELDORA.bicker.fire(env.server, true)
  const left = env.ctx.VELDORA.bicker.eligible(env.players)
  assert(left.length === 1, 'after playing one of two, exactly one should remain, got ' + left.length)
})

t('...but exhausting them all forgets the history rather than going silent', () => {
  const env = fresh([SCENE_AGNOSTIC])
  addPlayer(env, 'p1', 'blade', 0)
  env.ctx.VELDORA.broadcast = { scene: () => 'sent' }
  env.ctx.VELDORA.bicker.fire(env.server, true)
  assert(env.ctx.VELDORA.bicker.eligible(env.players).length === 1,
    'a pair with one scene must not stop talking forever')
})

t('a long turn delays the next speaker more than a short one', () => {
  // 🔑 The whole reason scene() exists instead of exchange(): a seven-beat lament must
  // not be answered on top of itself.
  const short = { pair: ['art', 'wall'], tier: 'low', needs: null,
    turns: [{ god: 'wall', chunks: ['Hm.'] }, { god: 'art', chunks: ['Yes.'] }] }
  const long = { pair: ['art', 'wall'], tier: 'low', needs: null,
    turns: [{ god: 'wall', chunks: ['I am sad.', 'I am broken.', 'A monster.',
      'A tragedy.', 'Begotten by a people.', 'Who will never speak my name.',
      'Never see my face.'] }, { god: 'art', chunks: ['Yes.'] }] }

  function secondTurnAt(sc) {
    const env = build({ noRun: true })
    load(env, 'broadcast.js')
    addPlayer(env, 'p1', 'wall', 0)
    addPlayer(env, 'p2', 'art', 0)
    env.scheduled.length = 0
    env.ctx.VELDORA.broadcast.scene(env.server, sc.turns, { why: 'test' })
    return env.scheduled[1].at
  }
  const a = secondTurnAt(short), b = secondTurnAt(long)
  assert(b > a, 'the seven-beat turn must push its reply later (' + b + ' vs ' + a + ')')
  assert(b - a > 100, 'and by a lot, not a token amount - got ' + (b - a) + ' ticks')
})

t('a non-aligned listener gets the scene GARBLED', () => {
  const env = build({ noRun: true })
  load(env, 'broadcast.js')
  addPlayer(env, 'p1', 'blade', 0)
  addPlayer(env, 'p2', 'art', 0)
  env.ctx.VELDORA.broadcast.scene(env.server, SCENE_AGNOSTIC.turns, { why: 'test' })
  env.scheduled.forEach(s => { try { s.fn() } catch (e) { } })
  const artLine = env.sent.filter(s => s.god === 'art')
  const toBlade = artLine.find(s => s.who === 'p1')
  const toArt = artLine.find(s => s.who === 'p2')
  assert(toBlade && toBlade.obf === 'RANDOM', "art's line must be garbled for blade's champion")
  assert(toArt && !toArt.obf, "art's line must be clean for her own champion")
})

function assert(c, m) { if (!c) throw new Error(m || 'assertion failed') }

let failed = 0
for (const [name, fn] of CASES) {
  try { fn(); console.log('  ok    ' + name) } catch (e) {
    failed++
    console.log('  FAIL  ' + name)
    console.log('        ' + e.message)
  }
}
console.log((CASES.length - failed) + '/' + CASES.length)
process.exit(failed ? 1 : 0)
