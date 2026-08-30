// announce_harness.js — the bar is for what is ABOUT to happen, and it belongs to nobody.
//
//     node tools/announce_harness.js
//
// ⭐ WHY THIS EXISTS. Two things here are invisible in play and expensive when wrong:
//
//   · THE AUDIENCE. Wall's attack is announced to her VICTIM, not to the champion who
//     ordered it. Backwards, it warns the attacker and ambushes the target - and it
//     would look completely fine to whoever was testing, because they would be the
//     champion and they would see a line.
//   · THE PRIORITY. One bar, so something loses. A tide warning arriving behind a
//     Nether ambience line is a warning that never came, and nothing logs it.
//
// 🚨 AND ETHAN'S LINES ARE LOCKED CHARACTER-FOR-CHARACTER. Three of them read as
// typos. They are his and they stay his - the harness exists so nobody "tidies" them
// on a quiet afternoon. If they change, he changed them.
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

// Comments stripped before any source assertion - every one of these files explains
// in prose exactly what it must not do, and an unanchored indexOf matches the prose.
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

const sent = []
const pending = []
const server = {
  players: [],
  runCommand: (c) => { sent.push(c); return 1 },
  runCommandSilent: (c) => { sent.push(c) },
  scheduleInTicks: (t, fn) => { pending.push(fn) },
}
function drain(max) {
  let n = 0
  while (pending.length && n < max) { pending.shift()(); n++ }
  return n
}
let uid = 0
function mkPlayer(name) {
  return { username: name, uuid: 'p-' + (++uid), tell: () => { }, server }
}

global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { } }
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {}

const ri = console.info, rw = console.warn
let warns = []
console.info = () => { }
console.warn = (m) => { warns.push(String(m)) }
try { (0, eval)(fs.readFileSync(path.join(SS, 'announce.js'), 'utf8')) }
catch (e) { console.info = ri; console.warn = rw; console.error('FAIL: announce.js threw :: ' + e); process.exit(1) }
console.info = ri; console.warn = rw
const A = global.VELDORA.announce
if (!A) { console.error('FAIL: announce.js published nothing'); process.exit(1) }

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 ETHAN\'S LINES, LOCKED CHARACTER-FOR-CHARACTER')
{
  // ⚠️ Three of these look like typos - "a thousands spiders", "You hands are weak",
  // and a lowercase "adrenaline". They are LOCKED AS WRITTEN on purpose. His writing
  // is his; the register in docs/51 exists so his lines and my scaffolding never get
  // confused, and silently correcting one would be exactly that confusion.
  const want = {
    tide: ['You feel a chill run down your spine',
           'Something is watching you closely',
           'You feel terror grip your heart'],
    tide_boss: ['You can see your death',
                'Blood stains your hand',
                'You hands are weak'],
    boon: ['You feel yourself grow stronger',
           'adrenaline runs through your veins',
           'You push yourself'],
    wall_attack: ['You hear a thousands spiders',
                  'You feel something crawling up your skin',
                  'Something wrong is watching you'],
    trade: ['Your vision goes dark',
            'You feel a breath on the back of your neck',
            'You want to run'],
  }
  Object.keys(want).forEach(k => {
    ok('🚨 ' + k + ' is verbatim', A.pools[k], want[k])
  })
  ok('five pools, no more', A.keys().sort(), Object.keys(want).sort())
  ok('fifteen lines total',
    A.keys().reduce((n, k) => n + A.pools[k].length, 0), 15)

  // ⭐ The register that makes them work on a nameless bar: every line is second
  // person, and NOT ONE names a god or describes an event from outside.
  const all = A.keys().reduce((a, k) => a.concat(A.pools[k]), [])
  ok('⭐ every line is second-person',
    all.every(l => /\b(you|your)\b/i.test(l)), true)
  ok('🚨 no line names a god',
    all.every(l => !/\b(blade|wall|salvage|forge|art|crown)\b/i.test(l)), true)
  ok('no line carries a colour code',
    all.every(l => l.indexOf('§') === -1), true)
}

grp('🔑 THE PRIORITY — one bar, so something has to lose')
{
  const p = mkPlayer('Prio')
  sent.length = 0; pending.length = 0

  ok('an ambient line shows when nothing is up',
    A.text(server, p, 'ambience', A.P_AMBIENT), true)
  ok('🚨 an ANNOUNCEMENT outranks ambience already showing',
    A.say(server, p, 'tide'), true)
  ok('🚨 ...and ambience is DROPPED while an announcement is up',
    A.text(server, p, 'ambience again', A.P_AMBIENT), false)

  // Equal priority REPLACES - the newer warning is the true statement about now.
  ok('⭐ a second announcement replaces the first', A.say(server, p, 'tide_boss'), true)

  // Once it expires the slot frees, or the bar would be dead for the session.
  drain(400)
  ok('🚨 the slot is free again after it expires',
    A.text(server, p, 'ambience once more', A.P_AMBIENT), true)
  drain(400)
}

grp('⚠️ A TYPO\'D POOL IS A BUG, NOT A QUIET MOMENT')
{
  const p = mkPlayer('Typo')
  warns = []
  const rw2 = console.warn
  console.warn = (m) => { warns.push(String(m)) }
  const r = A.say(server, p, 'tiide')
  console.warn = rw2
  ok('an unknown pool returns false', r, false)
  ok('🚨 ...and SHOUTS, so it cannot look like "nothing to announce"',
    warns.join(' ').indexOf('TYPO') !== -1, true)
}

grp('⚠️ THE BAR ITSELF')
{
  const p = mkPlayer('Bar')
  sent.length = 0; pending.length = 0
  A.say(server, p, 'trade')
  const all = sent.join('\n')
  ok('a bar is created', all.indexOf('bossbar add veldora:announce_') !== -1, true)
  ok('⭐ WHITE - the one colour no god owns', all.indexOf('color white') !== -1, true)
  ok('shown to that player only', all.indexOf('players Bar') !== -1, true)
  ok('a real line went in', A.pools.trade.some(l => all.indexOf(l) !== -1), true)
  drain(400)
  ok('🚨 removed at the end - no line sticks',
    sent[sent.length - 1].indexOf('bossbar remove') === 0, true)
  ok('nothing left pending', pending.length, 0)
}

grp('⭐ THE TREMOR MOVES TEXT, IT NEVER CHANGES IT')
{
  let bad = 0
  for (let i = 0; i < 300; i++) if (A._jitter('You are afraid.').trim() !== 'You are afraid.') bad++
  ok('300 jitters changed not one character', bad, 0)
  ok('a quote cannot break the JSON', (() => {
    try { JSON.parse(A._nameJson('a "b" c\\d')); return true } catch (e) { return false }
  })(), true)
}

grp('🔑 NEVER THE SAME LINE TWICE — a three-line pool needs it badly')
{
  let repeats = 0, last = -1
  for (let i = 0; i < 500; i++) {
    const n = A._pick(['a', 'b', 'c'], last)
    if (n === last) repeats++
    last = n
  }
  ok('🚨 500 picks, zero immediate repeats', repeats, 0)
}

grp('🚨 THE AUDIENCE — the assertion that is invisible in play')
{
  const wall = code('wall_events.js')
  // sendSpiders picks `target` via pickTarget(server, me). `me` is the champion who
  // ordered it. Announcing to `me` would warn the attacker and ambush the victim.
  ok('🚨 Wall announces to the VICTIM, not her champion',
    wall.indexOf("VELDORA.announce.say(server, target, 'wall_attack')") !== -1, true)
  ok('🚨 ...and never to `me`',
    wall.indexOf("announce.say(server, me,") === -1, true)

  const ge = code('godevents.js')
  ok('the shared chokepoint announces only boon and buff',
    ge.indexOf("ev.kind === 'boon' || ev.kind === 'buff'") !== -1, true)
  // An invade passes through that same line; announcing it there would reach the
  // champion instead of the target.
  ok('🚨 it does NOT announce invade from the chokepoint',
    ge.indexOf("'wall_attack'") === -1, true)
}

grp('⭐ THE TIDE PICKS ITS REGISTER FROM THE WAVE')
{
  const tide = code('tide.js')
  ok('a boss wave gets the boss register',
    tide.indexOf("(mod && mod.boss) ? 'tide_boss' : 'tide'") !== -1, true)
  // Defined AND called - a helper that is never invoked is a dead gate, and this
  // exact mistake was made while writing it.
  ok('🚨 announceWave is actually CALLED, not merely defined',
    tide.indexOf('announceWave(p, MODS[modName])') !== -1, true)
  ok('...after the modifier is resolved, so they cannot disagree',
    tide.indexOf('var modName = pickMod') < tide.indexOf('announceWave(p, MODS[modName])'), true)
  // ⚠️ The bar does NOT replace the patron's chat warning - different speakers.
  ok('⭐ warn_wave still exists alongside it', tide.indexOf('warn_wave') !== -1, true)
}

grp('⛔ GOD DIALOGUE DOES NOT GO ON THE BAR')
{
  const ann = code('announce.js')
  ok('🚨 announce.js never touches voice.js', ann.indexOf('VELDORA.voice') === -1, true)
  ok('...and never reads a god colour', ann.indexOf('COLOUR') === -1, true)

  // The level-loss line was removed by ruling, and the COST must survive it.
  const dc = code('death_cost.js')
  ok('🚨 the "You lost N levels" chat line is gone',
    dc.indexOf('You lost') === -1, true)
  ok('⭐ ...but the cost itself still runs', dc.indexOf('LEVELS_LOST') !== -1, true)
  ok('...and the server still logs every charge', dc.indexOf('lost ') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 THE REAL SHAKE — and the fallback that must survive it')
{
  const im = code('immersive.js')
  const an = code('announce.js')

  // ⚠️ I told Ethan vanilla could not shake text and that "no server-side route
  // reaches it". True of vanilla; wrong as an answer. ImmersiveMessage ships shake()
  // AND a server-side send, both read out of the jar.
  ok('⭐ the shim reaches ImmersiveMessage',
    im.indexOf("'toni.immersivemessages.api.ImmersiveMessage'") !== -1, true)
  ok('⭐ ...and asks for a REAL shake', im.indexOf('m.shake()') !== -1, true)
  ok('⭐ ...anchored TOP_CENTER, which is what he asked for originally',
    im.indexOf("'TOP_CENTER'") !== -1, true)

  // 🚨 THE FALLBACK IS THE POINT. A dialogue system that goes silent because a mod
  // updated is worse than one that looks plainer than intended.
  ok('🚨 announce.js still has its bossbar path', an.indexOf('bossbar add ') !== -1, true)
  ok('🚨 ...and only uses immersive when it SUCCEEDS',
    an.indexOf('if (showImmersive(p, text, prio)) {') !== -1, true)
  ok('🚨 the shim returns false rather than throwing',
    im.indexOf('return false') !== -1 && im.indexOf('function show(p, text, opts)') !== -1, true)

  // 🚨 An unreachable mod must SHOUT, or "the mod is missing" and "nobody spoke"
  // are the same event from outside.
  ok('🚨 an unreachable API is reported, not swallowed',
    im.indexOf('is NOT reachable') !== -1, true)
  ok('⚠️ ...and a send that cannot be called either way is reported too',
    im.indexOf('could not be called with EITHER shape') !== -1, true)

  // ⚠️ The immersive path has no bossbar tick to hand the priority slot back, so it
  // must free the slot itself or the bar is dead for the rest of the session.
  ok('🚨 the immersive path frees the priority slot on its own',
    an.indexOf('if (st2 && st2.prio === prio) st2.prio = -1') !== -1, true)

  // Ambience does not shake - it is the place talking, not something arriving.
  ok('⭐ only ANNOUNCEMENTS shake, not ambience',
    an.indexOf('shake: (prio >= P_ANNOUNCE)') !== -1, true)
}

grp('⭐ THE GODS ON SCREEN — and chat keeps the record')
{
  const vo = code('voice.js')

  // 🚨 ADDITIVE, NEVER A MOVE. announce.js's header states the reason and it has not
  // changed: a god says load-bearing things and an overlay is gone in five seconds.
  // 🔴 THIS ASSERTION WAS WORTHLESS AND A NEGATIVE CONTROL PROVED IT. It matched
  // `player.tell(Text.of(paint(...)))` ANYWHERE in the file - and `sayAbout()` has the
  // identical line - so deleting the tell from `say()` entirely left it GREEN. Measure
  // at the point of use, not at the first place the string appears.
  //
  // ⚠️ Both callers must keep it, so both are counted.
  ok('🚨 BOTH say() and sayAbout() still write to chat',
    (vo.match(/player\.tell\(Text\.of\(paint\(player, god, s\)\)\)/g) || []).length, 2)

  // ...and specifically inside say(), which is the one the overlay was added to.
  const sayStart = vo.indexOf('function say(player, god, tag)')
  const sayEnd = vo.indexOf('function sayAbout(', sayStart)
  const sayBody = sayStart !== -1 ? vo.slice(sayStart, sayEnd) : ''
  ok('🚨 say() itself still tells the player',
    sayBody.indexOf('player.tell(') !== -1, true)
  ok('⭐ ...and the overlay is sent as well', vo.indexOf('overlay(player, god, s)') !== -1, true)

  // ⚠️ A failed overlay must cost nothing - say() returns true either way.
  const i = vo.indexOf('overlay(player, god, s)')
  const j = vo.indexOf('return true', i)
  ok('⚠️ a failed overlay does not fail the line', i !== -1 && j !== -1 && j > i, true)
  ok('...and overlay() returns false rather than throwing',
    vo.indexOf('function overlay(player, god, s)') !== -1 &&
    vo.indexOf('} catch (e) { return false }') !== -1, true)

  // 🚨 TWO SYSTEMS, TWO ANCHORS. announce.js owns TOP_CENTER for things about to
  // happen; a god talking is not that, and sharing an anchor would put a tide warning
  // and a conversation on the same pixels.
  ok('🚨 gods speak at BOTTOM_CENTER', vo.indexOf("anchor: 'BOTTOM_CENTER'") !== -1, true)
  const an = code('announce.js')
  ok('🚨 ...and announcements keep TOP_CENTER', an.indexOf("anchor: 'TOP_CENTER'") !== -1, true)

  // ⭐ The mod obfuscates properly, so the overlay uses ObfuscateMode rather than the
  // hand-woven §k - but the CHAT copy still uses garble.js.
  ok('⭐ a garbled speaker uses the built-in obfuscation on screen',
    vo.indexOf("obfuscate: GARBLED[god] ? 'RANDOM' : null") !== -1, true)
  ok('⚠️ ...and the overlay strips the hand-woven codes first',
    vo.indexOf('VELDORA.garble.strip(s)') !== -1, true)
  ok('🚨 chat still gets the hand-woven version', vo.indexOf('function paint(') !== -1, true)
}

grp('⭐ THE RITUAL — the text moves, nothing else does')
{
  const ri = code('ritual.js')

  // 🚨 Ethan: "keep all the affects, we're just moving where the text goes." A
  // ritual is SUPPOSED to stop the world - that is what a ritual is here.
  // ⚠️ MY FIRST VERSION GUESSED THE STRING ('effect give ') and went red against
  // CORRECT code - ritual.js applies its effects from an EFFECTS table, not an inline
  // command. Assert the table, which is the thing that actually decides.
  ok('🚨 the blindness table is intact',
    ri.indexOf("['minecraft:blindness', 0]") !== -1, true)
  ok('🚨 the hold still runs', ri.indexOf('holdAfterChoice') !== -1, true)
  ok('⭐ ...and the speech now also goes on screen',
    ri.indexOf('ritualOverlay(p, text, colour)') !== -1, true)
  ok('🚨 while chat still gets it', ri.indexOf('tell(p, paint(text, colour))') !== -1, true)

  // ⚠️ THE OPTIONS CANNOT MOVE. They are clickable chat components; an overlay is
  // drawn, not clicked. Moving them leaves a scene nobody can answer.
  ok('🚨 the options stay clickable in CHAT',
    ri.indexOf("clickRunCommand('/ritual pick ") !== -1, true)
  const ov = ri.indexOf('function ritualOverlay')
  const ovEnd = ri.indexOf('function ', ov + 10)
  const ovBody = ov !== -1 ? ri.slice(ov, ovEnd) : ''
  ok('🚨 ...and the overlay never renders an option',
    ovBody.indexOf('options') === -1 && ovBody.indexOf('label') === -1, true)

  ok('⭐ a ritual centres, because the world is already gone',
    ri.indexOf("anchor: 'CENTER_CENTER'") !== -1, true)

  const an = code('announce.js')
  // ⚠️ The aftermath sting must NOT shake - shaking makes it read as a warning.
  const ab = an.indexOf('function actionbar')
  const abEnd = an.indexOf('function pick', ab)
  const abBody = ab !== -1 ? an.slice(ab, abEnd) : ''
  ok('🚨 the aftermath sting does not shake', abBody.indexOf('shake') === -1, true)
  ok('⚠️ ...and still falls back to /title actionbar',
    abBody.indexOf("' actionbar '") !== -1, true)
}

console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
