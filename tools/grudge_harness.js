// grudge_harness.js — THE GRUDGE and the broadcast it narrates with.
//
//     node tools/grudge_harness.js
//
// docs/49 §3+§4, mechanics C and D. Every failure mode in here is SILENT in play:
//
//   · a ticker keyed per-victim instead of per-PAIR punishes the wrong person, and
//     is completely invisible on a two-player server
//   · a ticker that never resets turns a reprisal into permanent weather
//   · a grudge that never decays fires on four kills three months apart
//   · half an exchange reads as a bug rather than a snub
//   · `busy` latching true would mute the pantheon forever with nothing in the log
//
// None of those throw. All of them are asserted.

'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

let TICKS = 100000
let TOLD = []          // every line delivered, in order
let EFFECTS = []       // effect give commands
let WAVES = []         // spawner waves
let ONLINE = []
let POOLS = {}
let PATHS = {}
let DEATH_HOOKS = []
let TIMERS = []        // [delay, fn] - drained manually so pacing is testable
// ⚠️ TOLD / EFFECTS / WAVES are separate arrays, so nothing in this file could
// answer "did the punishment land before or after the words". It could not, and a
// real ordering bug sat green through 35 assertions. ORDER is the shared timeline.
let ORDER = []

const server = {
  overworld: () => ({ dayTime: () => TICKS }),
  scheduleInTicks: (d, fn) => { TIMERS.push([d, fn]) },
  runCommandSilent: (c) => {
    if (c.indexOf('effect give') === 0) { EFFECTS.push(c); ORDER.push('LASH') }
  },
  runCommand: () => '',
}
Object.defineProperty(server, 'players', { get: () => ONLINE })

function drain() {
  // Fire every scheduled callback in delay order, the way a server tick would.
  const t = TIMERS.slice().sort((a, b) => a[0] - b[0])
  TIMERS = []
  for (const [, fn] of t) { try { fn() } catch (e) { } }
}

global.EntityEvents = { death: (fn) => DEATH_HOOKS.push(fn), beforeHurt: () => { }, spawned: () => { }, checkSpawn: () => { } }
global.PlayerEvents = { respawned: () => { }, loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.ServerEvents = { commandRegistry: () => { }, loaded: () => { }, tick: () => { } }
global.ItemEvents = { rightClicked: () => { }, entityInteracted: () => { } }
global.BlockEvents = { placed: () => { }, broken: () => { }, rightClicked: () => { } }
global.Text = { of: (s) => s }
global.Item = { of: () => ({}) }

function mkPlayer(name, path) {
  const store = {}
  PATHS[name] = path
  return {
    username: name, uuid: 'u-' + name, player: true, server,
    tell: (s) => {
      TOLD.push({ to: name, text: String(s) })
      if (name === 'Vic') ORDER.push('SAY')      // one player's view, so lines count once
    },
    persistentData: {
      getInt: (k) => store[k] || 0, putInt: (k, v) => { store[k] = v },
      getDouble: (k) => store[k] || 0, putDouble: (k, v) => { store[k] = v },
      getString: () => '', putString: () => { },
      contains: () => true,
    },
    _store: store,
  }
}

global.VELDORA = {
  paths: { pathOf: (p) => PATHS[p && p.username] || '' },
  voice: {
    colourOf: (g) => '§' + g[0],
    line: (god, tag) => {
      const pool = (POOLS[god] || {})[tag]
      return (pool && pool.length) ? pool[0] : null
    },
  },
  spawner: {
    wave: (p, o) => { WAVES.push({ to: p.username, count: o.count, ids: o.ids }); ORDER.push('LASH') },
  },
  warn: { titleOf: (g) => 'the ' + g },
}

const realWarn = console.warn, realInfo = console.info, realErr = console.error
const hush = () => { console.warn = () => { }; console.info = () => { }; console.error = () => { } }
const speak = () => { console.warn = realWarn; console.info = realInfo; console.error = realErr }

hush()
try {
  ;(0, eval)(fs.readFileSync(path.join(SS, 'broadcast.js'), 'utf8'))
  ;(0, eval)(fs.readFileSync(path.join(SS, 'grudge.js'), 'utf8'))
} catch (e) { speak(); console.error('FAIL: load threw :: ' + e); process.exit(1) }

const B = global.VELDORA.broadcast
const G = global.VELDORA.grudge
if (!B || !G) { speak(); console.error('FAIL: seams not published'); process.exit(1) }

let pass = 0, fail = 0
function ok(name, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want)
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name) }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
const grp = (t) => { speak(); console.log('\n\x1b[1m' + t + '\x1b[0m'); hush() }

function fullPools() {
  return {
    wall: { argue_accuse: ['W accuse'], argue_answer: ['W answer'], argue_threat: ['W threat'], argue_refuse: ['W refuse'], argue_unanswered: ['W alone'] },
    blade: { argue_accuse: ['B accuse'], argue_answer: ['B answer'], argue_threat: ['B threat'], argue_refuse: ['B refuse'], argue_unanswered: ['B alone'] },
    salvage: { argue_accuse: ['S accuse'], argue_answer: ['S answer'], argue_threat: ['S threat'], argue_refuse: ['S refuse'], argue_unanswered: ['S alone'] },
  }
}
function reset() {
  TOLD = []; EFFECTS = []; WAVES = []; TIMERS = []; PATHS = {}; ORDER = []
  POOLS = fullPools(); TICKS = 100000
}
function kill(victim, killer) {
  for (const fn of DEATH_HOOKS) fn({ entity: victim, source: { player: killer } })
}

// ═══════════════════════════════════════════════════════════════════════════
grp('THE TICKER — 4 kills, and not one before')
{
  reset()
  const v = mkPlayer('Vic', 'wall'), k = mkPlayer('Kil', 'blade')
  ONLINE = [v, k]
  for (let i = 1; i <= 3; i++) { kill(v, k); TICKS += 100 }
  ok('nothing fires at 3', [EFFECTS.length, WAVES.length], [0, 0])
  ok('...and the count is visible', G.count(v, 'Kil'), 3)
  kill(v, k); drain()
  ok('the 4th fires the reprisal', WAVES.length, 1)
  ok('🚨 and RESETS, so it is a cycle not a ratchet', G.count(v, 'Kil'), 0)
}

grp('🔴 SCOPE — the ticker is per (victim, KILLER) pair')
{
  // A per-victim counter would let a third player push someone else's grudge to 4
  // and then be punished for a single kill. Invisible at two players.
  reset()
  const v = mkPlayer('Vic', 'wall'), a = mkPlayer('A', 'blade'), b = mkPlayer('B', 'salvage')
  ONLINE = [v, a, b]
  kill(v, a); kill(v, a); kill(v, a)
  ok('A has built a grudge', G.count(v, 'A'), 3)
  ok('...and B carries none of it', G.count(v, 'B'), 0)
  kill(v, b); drain()
  ok("B's first kill fires NOTHING", [EFFECTS.length, WAVES.length], [0, 0])
}

grp('DECAY — a grudge is a mood, not a contract')
{
  reset()
  const v = mkPlayer('Vic', 'wall'), k = mkPlayer('Kil', 'blade')
  ONLINE = [v, k]
  kill(v, k); kill(v, k); kill(v, k)
  ok('three fresh kills', G.count(v, 'Kil'), 3)
  TICKS += 48000 * 2               // two decay windows of peace
  kill(v, k); drain()
  ok('two windows of peace faded 2, so the 4th is only a 2nd', G.count(v, 'Kil'), 2)
  ok('...and nothing fired', [EFFECTS.length, WAVES.length], [0, 0])
}

grp('THE REPRISAL TABLE — each god denies you its own domain')
{
  const cases = [
    ['blade', 'minecraft:weakness'],
    ['salvage', 'minecraft:slowness'],
  ]
  for (const [god, effect] of cases) {
    reset()
    const k = mkPlayer('Kil', 'blade'); ONLINE = [mkPlayer('X', 'wall'), k]
    G.lash(server, god, k)
    ok(god + ' -> ' + effect.replace('minecraft:', ''), EFFECTS.length && EFFECTS[0].indexOf(effect) > 0, true)
  }
  reset()
  const k2 = mkPlayer('Kil', 'blade'); ONLINE = [k2]
  ok('wall sends spiders instead of taking anything', G.lash(server, 'wall', k2), 'spiders')
  ok('...five of them', WAVES[0].count, 5)
  // 🔴 FORGE NO LONGER RETALIATES (2026-08-23). She is Milantros, whose chart is
  // zeroes on every row that harms anybody - a debuff is the one thing she cannot do.
  // ⭐ And this must be a POSTURE, not a gap: the grudge fires, she gets her argue
  // pools, and she does nothing. That is the same distinction art's null already had -
  // 'I failed' and 'I found nothing' must never share a return value.
  reset()
  const kf = mkPlayer('Kil', 'blade'); ONLINE = [mkPlayer('X', 'wall'), kf]
  ok('forge retaliates with nothing - she CANNOT, not a gap', G.lash(server, 'forge', kf), 'no-posture')
  ok('...and took absolutely nothing from the killer', [EFFECTS.length, WAVES.length], [0, 0])

  reset()
  const k3 = mkPlayer('Kil', 'blade')
  // ⭐ Art's nothing must be a POSTURE, distinguishable from a dead hook.
  ok('art retaliates with nothing, and says so', G.lash(server, 'art', k3), 'no-posture')
  ok('...and genuinely did nothing', [EFFECTS.length, WAVES.length], [0, 0])
}

grp('D — the argument IS the reprisal landing')
{
  reset()
  const v = mkPlayer('Vic', 'wall'), k = mkPlayer('Kil', 'blade')
  ONLINE = [v, k]
  for (let i = 0; i < 4; i++) kill(v, k)
  drain()
  // ⚠️ READ ONE PLAYER'S VIEW. TOLD holds every tell to EVERY recipient, so a
  // 4-line exchange to 2 players is 8 entries - this first asserted the flat list
  // and failed on a correct broadcast. What matters is the sequence a person sees.
  const texts = TOLD.filter(t => t.to === 'Vic').map(t => t.text.replace(/§./g, ''))
  ok('four lines, alternating accuser and rival', texts, ['W accuse', 'B answer', 'W threat', 'B refuse'])
  ok('🔑 BOTH players heard all of it', TOLD.filter(t => t.to === 'Vic').length, 4)
  ok('...both of them', TOLD.filter(t => t.to === 'Kil').length, 4)
  ok('and the reprisal landed too', WAVES.length, 1)
}

grp('⚠️ HALF AN EXCHANGE IS WORSE THAN NONE')
{
  reset()
  const v = mkPlayer('Vic', 'wall'), k = mkPlayer('Kil', 'blade')
  ONLINE = [v, k]
  delete POOLS.blade.argue_answer          // the rival cannot reply
  delete POOLS.blade.argue_refuse
  for (let i = 0; i < 4; i++) kill(v, k)
  drain()
  // blade has no argue_answer, so he reads as MUTE and the accuser speaks alone -
  // the absence becomes content rather than a dangling accusation.
  const texts = TOLD.map(t => t.text.replace(/§./g, ''))
  ok('the accuser speaks, then remarks on the silence', [...new Set(texts)], ['W accuse', 'W alone'])
  ok('🚨 the reprisal still lands - the voice failing must not disarm it', WAVES.length, 1)
}

grp('SAME GOD ON BOTH SIDES — grief, but no argument')
{
  reset()
  const v = mkPlayer('Vic', 'wall'), k = mkPlayer('Kil', 'wall')
  ONLINE = [v, k]
  for (let i = 0; i < 4; i++) kill(v, k)
  drain()
  ok('a god never accuses ITSELF', TOLD.length, 0)
  ok('...but the reprisal is real, because the grief is', WAVES.length, 1)
}

grp('🚨 THE AUDIT — the reprisal must land AFTER the words')
{
  // Found by reading the code, NOT by this harness, which stayed green through it:
  // argue() and lash() were called on the same tick, so the debuff arrived ~8s
  // before the threat explaining it - backwards from docs/49 §4's whole thesis.
  reset()
  const v = mkPlayer('Vic', 'wall'), k = mkPlayer('Kil', 'blade')
  ONLINE = [v, k]
  for (let i = 0; i < 4; i++) kill(v, k)
  drain()
  ok('nothing is punished before the argument even starts', ORDER[0], 'SAY')
  ok('🔑 the reprisal is the LAST thing that happens', ORDER[ORDER.length - 1], 'LASH')
  ok('...all four lines land first', ORDER.join(','), 'SAY,SAY,SAY,SAY,LASH')
}

grp('...but a silent pantheon must NOT disarm it')
{
  // onDone only fires when an exchange actually goes out. Every other outcome means
  // nobody will say anything, and the reprisal has to land anyway - the pools are
  // EMPTY in the live game right now, so this is the common path, not the edge one.
  reset()
  POOLS = {}                                    // nobody has a line
  const v = mkPlayer('Vic', 'wall'), k = mkPlayer('Kil', 'blade')
  ONLINE = [v, k]
  for (let i = 0; i < 4; i++) kill(v, k)
  ok('🚨 with no pools at all the reprisal STILL lands, immediately', WAVES.length, 1)
  ok('...and nothing was said', TOLD.length, 0)
  drain()
  ok('🚨 and it does not fire a SECOND time once timers drain', WAVES.length, 1)
}

grp('CROWN — the alias this audit caught, twice in one day')
{
  // crown was missing from LASH entirely, so a Crown champion's god did nothing and
  // the log called it a posture. Same defect as warn.js this morning, reintroduced.
  reset()
  const k = mkPlayer('Kil', 'blade'); ONLINE = [mkPlayer('X', 'crown'), k]
  ok('crown retaliates as the Spider does', G.lash(server, 'crown', k), 'spiders')
  ok('...and is NOT reported as indifferent', G.lash(server, 'crown', k) === 'no-posture', false)

  reset()
  const v2 = mkPlayer('Vic', 'crown'), k2 = mkPlayer('Kil', 'wall')
  ONLINE = [v2, k2]
  for (let i = 0; i < 4; i++) kill(v2, k2)
  drain()
  // crown IS wall, so this is the same god on both sides however it is spelled.
  ok('a crown victim and a wall killer share a god - no argument', TOLD.length, 0)
  ok('...but the reprisal is still real', WAVES.length, 1)
}

grp('BROADCAST — the guards')
{
  reset()
  ONLINE = [mkPlayer('Solo', 'wall')]
  ok('🔑 no bickering to a lone player - never a teaser either',
    B.exchange(server, [{ god: 'wall', tag: 'argue_accuse' }], { why: 't' }), 'too-few')

  reset()
  ONLINE = [mkPlayer('A', 'wall'), mkPlayer('B', 'blade')]
  ok('an unspeakable line abandons the WHOLE exchange',
    B.exchange(server, [{ god: 'wall', tag: 'argue_accuse' }, { god: 'blade', tag: 'nonexistent' }], { why: 't' }),
    'incomplete')
  ok('...and sent nothing at all', TOLD.length, 0)

  reset()
  ONLINE = [mkPlayer('A', 'wall'), mkPlayer('B', 'blade')]
  ok('a good exchange sends', B.exchange(server, [{ god: 'wall', tag: 'argue_accuse' }], { why: 't' }), 'sent')
  ok('one at a time, server-wide',
    B.exchange(server, [{ god: 'blade', tag: 'argue_accuse' }], { why: 't2' }), 'busy')
  drain()
  // 🚨 busy is released on a TIMER, not in the last line's callback - a throwing
  // line would otherwise latch it true and mute the pantheon forever.
  ok('...and it releases afterwards', B.running(), false)
  ok('verbatim text works as well as a pool tag',
    B.exchange(server, [{ god: 'wall', text: 'said outright' }], { why: 't3' }), 'sent')
}

grp('NON-EVENTS — the hook must ignore what is not a grudge')
{
  reset()
  const v = mkPlayer('Vic', 'wall'), k = mkPlayer('Kil', 'blade'), n = mkPlayer('None', '')
  ONLINE = [v, k, n]
  for (let i = 0; i < 6; i++) for (const fn of DEATH_HOOKS) fn({ entity: v, source: {} })
  ok('a mob kill is not a grudge (nemesis_tally owns that)', G.count(v, 'Kil'), 0)
  for (let i = 0; i < 6; i++) kill(v, v)
  ok('suicide is not a grudge', G.count(v, 'Vic'), 0)
  for (let i = 0; i < 6; i++) kill(n, k)
  drain()
  ok('a pathless victim has no god to be aggrieved', [EFFECTS.length, WAVES.length], [0, 0])
}

speak()

// -------------------------------------------------------------------------
grp('* THE CRASHOUT - the moment an argument becomes a strike')
{
  // Ethan, 2026-08-30: "the crashout can be used when gods attack each other." It was
  // designed for a god-augmented tide; that is gated off, and this is the better home.
  // Rare (a champion must have been killed), personal (it goes to the killer alone),
  // and the argument has already played out in front of everyone - so the escalation is
  // something the player WATCHED build.
  // ⚠️ Comments stripped: grudge.js explains the crashout in prose directly above
  // the call, and an unanchored match would find the explanation instead of the code.
  const raw = fs.readFileSync(path.join(SS, 'grudge.js'), 'utf8')
  const gr = raw.split(/\r?\n/).filter(l => !l.trim().startsWith('//')).join(' ')

  // A substring match survives the call being disabled - `if (false) crashout(...)`
  // still contains the text. The GUARD is matched with it, so a disabled call fails.
  ok('the reprisal announces itself',
    /if \(line\) VELDORA\.voice\.crashout\(killer, god, line\)/.test(gr), true)
  // It goes to the KILLER, never the room. A god screaming into everyone's face about
  // somebody else's business would cheapen the one message allowed to interrupt.
  ok('...to the killer alone, not broadcast', /crashout\(killer,/.test(gr), true)
  // Said FIRST, then done: a debuff landing before the god explains it is a status
  // effect; landing after, it is a consequence. The order is the meaning.
  ok('...BEFORE the effect lands',
    gr.indexOf('VELDORA.voice.crashout') < gr.indexOf("'effect give '"), true)
  // A god with nothing written strikes in silence rather than saying something generic.
  ok('...and a missing pool is silence, logged, not a placeholder line',
    /has no crashout pool - striking in silence/.test(gr), true)

  // 🔴 GREPPING FOR registerLines WAS VACUOUS TOO: `if(false) registerLines(...)` still
  // matches. So each god's file is RUN with a recording stub and asked what it actually
  // registered - the point of use, not the mention.
  const registered = (f) => {
    const src = fs.readFileSync(path.join(SS, f), 'utf8')
    const tags = {}
    const stub = {
      Platform: { isLoaded: () => true },
      Utils: { server: null },
      ServerEvents: { loaded: fn => { try { fn({ server: { players: [] } }) } catch (e) { } },
                      commandRegistry() { }, tick() { } },
      PlayerEvents: { loggedIn() { }, loggedOut() { }, tick() { } },
      EntityEvents: { death() { }, checkSpawn() { }, hurt() { } },
      BlockEvents: { placed() { }, broken() { } },
      ItemEvents: { rightClicked() { }, entityInteracted() { } },
      Text: { of: x => x },
      console: { info() { }, log() { }, warn() { }, error() { } },
    }
    const V = { voice: {
      registerLines: (g, t, l) => { tags[t] = l.length; return true },
      register: () => true, setColour() { }, setStyle() { }, setGarbled() { },
      line: () => null,
    } }
    const keys = Object.keys(stub)
    try {
      new Function(...keys, 'VELDORA_IN',
        'var VELDORA=VELDORA_IN;' + src.replace(/^var VELDORA = .*$/m, '') + ';'
      )(...keys.map(k => stub[k]), V)
    } catch (e) { return null }
    return tags.crashout || 0
  }

  ok('blade REGISTERS a crashout pool', registered('blade_voice.js') > 0, true)
  ok('wall does', registered('wall_voice.js') > 0, true)
  ok('salvage does', registered('salvage_voice.js') > 0, true)
  ok('forge does NOT - she never retaliates at all', registered('forge_voice.js'), 0)
  ok('art does NOT either', registered('art_voice.js'), 0)
}

console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m, ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
