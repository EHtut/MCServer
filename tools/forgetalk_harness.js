// forgetalk_harness.js — five prompts, one wrong answer ends it, and she never cutscenes.
//
//     node tools/forgetalk_harness.js
//
// ⭐ WHY THIS EXISTS. The tree is Ethan's, verbatim, and every failure here is silent:
//
//   · A REORDERED OR ALTERED PROMPT. His five lines and their pass/fail mapping ARE the
//     condition. Nobody would notice prompt 3 being softened, and softening it destroys
//     the only trap in the design.
//   · THE WRONG ANSWER PASSING. Lie · Wonder · ignore · Marvel · Agree. Invert any one
//     of them and the condition still "works" — it just tests the opposite character.
//   · A CUTSCENE. docs/67 is explicit that she does NOT cutscene you. Reaching for
//     ritual.js would blind the player and stop the world, which is the wrong texture
//     for the one god who talks to you while you are busy.
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

let DAYTIME = 500000
let PATH_OF = ''
let NIGHTS = 10
let BENCH = true
const told = []
const server = {
  players: [],
  overworld: () => ({ dayTime: () => DAYTIME }),
  runCommand: () => 1,
  runCommandSilent: () => { },
  scheduleInTicks: () => { },
}
function mkPlayer(name) {
  const data = {}
  return {
    username: name, uuid: 'u-' + name, server,
    x: 0, y: 64, z: 0,
    level: { getBlock: () => ({ id: BENCH ? 'minecraft:crafting_table' : 'minecraft:stone' }) },
    persistentData: {
      getInt: (k) => (typeof data[k] === 'number' ? data[k] : 0),
      putInt: (k, v) => { data[k] = v },
      getBoolean: (k) => !!data[k],
      putBoolean: (k, v) => { data[k] = v },
    },
    tell: (t) => { told.push(String(t)) },
    _data: data,
  }
}

global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { } }
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, respawned: () => { }, tick: () => { } }
global.Text = { of: (s) => ({ s: String(s), clickRunCommand: function () { return this }, toString: function () { return this.s } }) }
global.VELDORA = {
  paths: { pathOf: () => PATH_OF },
  night: { nightsFor: () => NIGHTS },
}

const ri = console.info, rw = console.warn, re = console.error
console.info = () => { }; console.warn = () => { }; console.error = () => { }
try { (0, eval)(fs.readFileSync(path.join(SS, 'forge_talk.js'), 'utf8')) }
catch (e) { console.info = ri; console.warn = rw; console.error = re; console.error('FAIL: forge_talk.js threw :: ' + e); process.exit(1) }
console.info = ri; console.warn = rw; console.error = re
const F = global.VELDORA.forgetalk
if (!F) { console.error('FAIL: forge_talk.js published nothing'); process.exit(1) }

function hush(fn) {
  const i = console.info, w = console.warn, e = console.error
  console.info = () => { }; console.warn = () => { }; console.error = () => { }
  try { return fn() } finally { console.info = i; console.warn = w; console.error = e }
}
// Answer correctly regardless of which side the option was shuffled onto.
function answerRight(p) {
  const st = F._talking[String(p.uuid)]
  return st.map.indexOf('pass') + 1
}
function answerWrong(p) {
  const st = F._talking[String(p.uuid)]
  return st.map.indexOf('fail') + 1
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 ETHAN\'S TREE, VERBATIM')
{
  ok('five prompts - 2^5 is the 32 combinations the cooldown is priced against',
    F.tree.length, 5)
  const asks = F.tree.map(t => t.ask).join(' | ')
  ok('🚨 prompt 1 asks what you are crafting', /whatcha craftin/i.test(asks), true)
  ok('🚨 prompt 2 is the gun', /what if you made a gun/i.test(asks), true)
  ok('🚨 prompt 3 is the gun AND the horse', /gun,? an.? a horse/i.test(asks), true)
  ok('🚨 prompt 4 is "I haven\'t crafted a darn thing"',
    /haven.t crafted a darn thing/i.test(asks), true)
  ok('🚨 prompt 5 is the gods above', /gods\s+above would envy/i.test(asks), true)

  ok('every prompt has exactly one pass and one fail',
    F.tree.every(t => t.pass && t.fail && t.pass !== t.fail), true)
}

grp('⭐ THE PASSING LINE — Lie · Wonder · ignore · Marvel · Agree')
{
  // 🚨 THE TRAP. Prompt 3 is the only line where she volunteers something about
  // herself, and the generous-seeming answer - asking more - is the FAILURE. She is
  // not offering; she is checking whether you will push.
  ok('🚨 prompt 3: asking about the horse is the FAIL',
    /what happened/i.test(F.tree[2].fail), true)
  ok('🚨 ...and letting it go is the PASS',
    /so anyway|the tools/i.test(F.tree[2].pass), true)

  // Prompt 1: the truthful answer loses.
  ok('prompt 1: the plain, honest answer is the FAIL',
    /nothing much|just tools/i.test(F.tree[0].fail), true)
}

grp('🚨 ONE WRONG ANSWER ENDS IT')
{
  PATH_OF = ''; NIGHTS = 10; BENCH = true; DAYTIME = 500000
  const p = mkPlayer('Wrong')
  hush(() => F.begin(server, p))
  ok('she is asking', !!F._talking[String(p.uuid)], true)
  hush(() => F.pick(server, p, answerRight(p)))     // 1 right
  hush(() => F.pick(server, p, answerWrong(p)))     // 2 wrong
  ok('🚨 the conversation is over', !!F._talking[String(p.uuid)], false)
  ok('🚨 ...and she was NOT charmed', F.charmed(p), false)
}

grp('⭐ FIVE RIGHT ANSWERS CHARM HER')
{
  const p = mkPlayer('Right')
  hush(() => F.begin(server, p))
  for (let i = 0; i < 5; i++) hush(() => F.pick(server, p, answerRight(p)))
  ok('⭐ charmed', F.charmed(p), true)
  ok('the conversation closed', !!F._talking[String(p.uuid)], false)

  // 🚨 Four is not five. Off-by-one here would hand out the path a prompt early.
  const q = mkPlayer('Four')
  hush(() => F.begin(server, q))
  for (let i = 0; i < 4; i++) hush(() => F.pick(server, q, answerRight(q)))
  ok('🚨 four right answers is NOT enough', F.charmed(q), false)
  ok('...and she is still asking', !!F._talking[String(q.uuid)], true)
}

grp('⚠️ THE OPTIONS ARE SHUFFLED — position cannot be memorised')
{
  const seen = {}
  for (let i = 0; i < 200; i++) {
    const p = mkPlayer('Shuf' + i)
    hush(() => F.begin(server, p))
    seen[F._talking[String(p.uuid)].map.join(',')] = true
    delete F._talking[String(p.uuid)]
  }
  ok('🚨 both orders occur - "always click the first one" cannot work',
    Object.keys(seen).sort(), ['fail,pass', 'pass,fail'])
}

grp('⭐ THE TIMER IS PER PROMPT, NOT PER CONVERSATION')
{
  ok('five minutes', F.answerTicks, 6000)
  const src = code('forge_talk.js')
  // 🚨 The deadline must be RESET on every ask, or five prompts share one budget and
  // the forgiving reading docs/67 rules for becomes the punishing one.
  ok('🚨 the deadline resets on every prompt',
    src.indexOf('st.deadline = ANSWER_TICKS') !== -1 &&
    src.indexOf('function ask') < src.indexOf('st.deadline = ANSWER_TICKS'), true)

  const p = mkPlayer('Slow')
  hush(() => F.begin(server, p))
  const st = F._talking[String(p.uuid)]
  st.deadline = 0
  hush(() => F._finish(server, p, 'timeout'))
  ok('a timeout ends it without charming her', F.charmed(p), false)
}

grp('⭐ THE GATE')
{
  DAYTIME = 900000
  PATH_OF = ''; NIGHTS = 10; BENCH = true
  ok('godless, 10 nights, at a bench -> eligible', F.eligible(server, mkPlayer('A')), true)

  NIGHTS = 5
  ok('🚨 five nights is too early', F.eligible(server, mkPlayer('B')), false)
  NIGHTS = 6
  ok('six is enough', F.eligible(server, mkPlayer('C')), true)
  NIGHTS = 10

  BENCH = false
  ok('🚨 not at a bench -> she does not start', F.eligible(server, mkPlayer('D')), false)
  BENCH = true

  PATH_OF = 'blade'
  ok('🚨 a pathed player is never asked', F.eligible(server, mkPlayer('E')), false)
  PATH_OF = ''

  // ⚠️ A failed attempt costs DAYS, so it must be stamped even on a loss.
  const p = mkPlayer('Cooling')
  hush(() => F.begin(server, p))
  hush(() => F.pick(server, p, answerWrong(p)))
  ok('🚨 the attempt is stamped, so failing costs the cooldown',
    p._data['veldora_forge_talk_last'] > 0, true)
  ok('...and she will not ask again immediately', F.eligible(server, p), false)
  ok('the retry is measured in days', F.retryDays >= 1, true)
}

grp('⛔ SHE DOES NOT CUTSCENE YOU')
{
  const src = code('forge_talk.js')
  // docs/67 is explicit. ritual.js blinds the player and holds the world still.
  ok('🚨 it never calls ritual.begin', src.indexOf('ritual.begin') === -1, true)
  ok('🚨 ...and never touches VELDORA.ritual at all',
    src.indexOf('VELDORA.ritual') === -1, true)
  // ritual.js: `.click(String)` throws a Throwable that escapes the JS catch.
  // ⚠️ ritual.js records that `.click(String)` throws a Throwable which escapes the JS
  // catch and takes the whole command with it. clickRunCommand is the only safe form.
  ok('⚠️ clickRunCommand is used', src.indexOf('clickRunCommand') !== -1, true)
  ok('🚨 ...and bare .click( is NOT',
    src.replace(/clickRunCommand/g, '').indexOf('.click(') === -1, true)

  // She is talking to somebody with no god, so she arrives broken like the rest.
  ok('⭐ her lines are garbled, like all pathless dialogue',
    src.indexOf('VELDORA.garble.line(s, COLOUR)') !== -1, true)
}

grp('⛔ NOBODY CARRIES ANYTHING ANY MORE')
{
  const ch = code('chosen.js')
  ok('🚨 the wrench is gone', ch.indexOf('create:wrench') === -1, true)
  ok('🚨 THE CARRY TABLE IS EMPTY - every god now notices something you DID',
    /var TRIGGERS = \{\s*\}/.test(ch), true)
  ok('⚠️ ...but the table is KEPT, not deleted - the next god may want an item',
    ch.indexOf('var TRIGGERS') !== -1, true)

  ok('forge unlocks by being charmed', ch.indexOf('VELDORA.forgetalk.charmed(p) === true') !== -1, true)
  ok('🚨 ...and it fails CLOSED', ch.indexOf('var charmed = false') !== -1, true)
  ok('...and shouts if the file is missing',
    ch.indexOf('forge_talk.js is MISSING') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
