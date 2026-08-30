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
grp('\U0001f534 SHE DOES NOT EXPLAIN \u2014 REVERSED BY RULING')
{
  // \u26a0\ufe0f THIS GROUP USED TO ASSERT THE OPPOSITE - that the offer must spell out
  // "every level, not fifty, and then I kill you, before you answer".
  //
  // \U0001f6a8 THAT REQUIREMENT WAS MINE. Ethan's only verbatim ruling was "Chosen on
  // respawn, however she takes all your levels. im adding a requirement of 50"; the
  // "She tells you this first" clause was doc prose I wrote and later treated as
  // canon. He ruled 2026-08-29: "Art will be blunt but also noninformative, she will
  // never reveal her cards or tell you what she wants. She will simply demand."
  //
  // The assertions become their own inverse rather than being deleted.
  const text = A.lines.offer.join(' ')
  ok('\U0001f6a8 she never says how much she takes', /every level|all of them|fifty/i.test(text), false)
  ok('\U0001f6a8 she never says she will kill you', /kill|die|death/i.test(text), false)
  ok('\U0001f6a8 she never says what you get', /give you|in return|reward/i.test(text), false)
  ok('\U0001f6a8 ...and never explains why', /because|so that|in order/i.test(text), false)

  ok('\u2b50 she DEMANDS, plainly, with no terms', /give it to me/i.test(text), true)
  ok('\u2b50 ...and refuses to elaborate', /not going to explain/i.test(text), true)

  // Blunt means SHORT. A god who explains nothing has nothing to pad with.
  ok('\u2b50 bluntness is measurable - every line is short',
    A.lines.offer.every(l => l.length <= 90), true)
  ok('...and she does not gloat afterwards either',
    A.lines.taken.every(l => l.length <= 40), true)
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
  // ⚠️ REWRITTEN THREE TIMES as gods left the carry table - salvage (E2), art (E4),
  // forge (E5). ⭐ What it asserts now is the END STATE of section E: the table is
  // EMPTY, and every god notices something you DID rather than something in your bag.
  // Blade counts what you killed, Salvage what you agreed to, Wall who passed on you,
  // Art what you handed over, Forge how you talk.
  ok('🚨 THE CARRY TABLE IS EMPTY - nobody is chosen for their inventory',
    /var TRIGGERS = \{\s*\}/.test(ch), true)
  ok('🚨 every FOUND item is gone', ['iron_sword', 'crossbow', 'lapis', 'wrench']
    .every(i => ch.indexOf(i) === -1), true)
  ok('the sword, crossbow and lapis are all gone',
    ['iron_sword', 'crossbow', 'lapis'].every(s => ch.indexOf(s) === -1), true)

  // Chosen on respawn, on the SAME hook as Wall's.
  ok('🚨 art is chosen on respawn', ch.indexOf("artTook(p) && !isUnlocked(p, 'art')") !== -1, true)
  ok('...and hers is checked BEFORE Wall\'s - the one they PAID for wins',
    ch.indexOf("artTook(p)") < ch.indexOf('if (!wasStruck(p)) return'), true)
  ok('⭐ /path shows her real condition', ch.indexOf('take her deal') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('\U0001f534 THE STRANGER WAS REGISTERED WITH NOBODY \u2014 E4a SHIPPED INERT')
{
  const ds = code('deep_speaker.js')
  // The registration loop iterates SPEAKERS, and PATHLESS is deliberately not in it
  // (that map is keyed by path; she has none). Her pools never reached voice.js, so
  // voice.say(p,'death_stranger',...) found nothing. The persona existed, speakerFor
  // returned her, and she said NOTHING.
  //
  // \u26a0\ufe0f The first version of this harness MISSED IT: it asserted she exists and that
  // speakerFor hands her back - never that her LINES arrive anywhere.
  ok('\U0001f6a8 her colour is registered with voice.js',
    ds.indexOf('setColour(PATHLESS.id, PATHLESS.colour)') !== -1, true)
  ok('\U0001f6a8 ...and every one of her POOLS is registered',
    ds.indexOf('registerLines(PATHLESS.id, pk, PATHLESS.lines[pk])') !== -1, true)
  ok('\u26a0\ufe0f a registration failure SHOUTS rather than going quiet',
    ds.indexOf('will hear NOTHING in the deep') !== -1, true)
  ok('\u2b50 and she is marked GARBLED', ds.indexOf('setGarbled(PATHLESS.id)') !== -1, true)
}

grp('\u2b50 PATHLESS DIALOGUE ARRIVES BROKEN \u2014 75 percent readable')
{
  const g = code('garble.js')
  // ⚠️ WAS 25 PERCENT. Ethan revised it the same day: "90% is readable instead, 75%
  // is still a bit too much." Asserted as a RANGE rather than a literal, because the
  // number is a feel decision that will move again - what must not move is that SOME
  // letters are lost and MOST are not.
  const rateM = g.match(/var RATE = ([0-9.]+)/)
  ok('the rate is declared at all', !!rateM, true)
  const rate = rateM ? parseFloat(rateM[1]) : -1
  ok('🚨 some letters are lost', rate > 0, true)
  ok('🚨 ...and most are not - the line still has to read as a line', rate <= 0.15, true)
  ok('\U0001f6a8 spaces are never obfuscated - they would weld words together',
    g.indexOf("if (c === ' ') return false") !== -1, true)
  ok('\U0001f6a8 the colour is restored after every reset code',
    g.indexOf("'\u00a7k' + ch + '\u00a7r' + c") !== -1, true)

  const vo = code('voice.js')
  ok('voice.js has a garble registry, like its colour one',
    vo.indexOf('function setGarbled(god)') !== -1, true)
  // 🔴 THE TELL MOVED BEHIND `voice.chat()` when Ethan ruled dialogue out of chat,
  // so the old `Text.of(paint(...))` idiom no longer appears at either call site.
  // Both still paint - the garbling this file tests is unchanged - they just hand the
  // painted line to the one door instead of telling the player directly.
  ok('\U0001f6a8 say() and sayAbout() BOTH still paint, via the chat door',
    (vo.match(/chat\(player, paint\(player, god, s\)\)/g) || []).length, 2)

  // \U0001f6a8 SCOPE. A pathless player reads the path OFFER by definition; garbling that
  // would make the most load-bearing prompt in the game 75 percent legible.
  // \U0001f534 THIS GUARD FIRED CORRECTLY ON 2026-08-30 and is TIGHTENED, not removed.
  // It banned `pathOf` outright to stop garbling ever becoming path-based. Ethan then
  // asked for exactly one path-based case - "during god bickering, the gods you aren't
  // aligned to should be garbled" - so the ban moves to where it matters: the DEFAULT
  // obfuscation still keys off the REGISTRY, and pathOf may appear only inside
  // alignedTo(), which nothing but broadcast.js calls.
  ok('\U0001f6a8 the default obfuscation is still the REGISTRY, not the path',
    vo.indexOf("obfuscate: GARBLED[god] ? 'RANDOM' : null") !== -1, true)
  const alignStart = vo.indexOf('function alignedTo(')
  const alignEnd = vo.indexOf('function overlay(', alignStart)
  const alignBody = alignStart !== -1 ? vo.slice(alignStart, alignEnd) : ''
  // \u26a0\ufe0f TIGHTENED AGAIN 2026-08-30, because this fired on the /gd test command,
  // which reads pathOf only to PRINT which path you walk. That is not the thing being
  // guarded against. The thing being guarded against is the OVERLAY deciding
  // obfuscation from the path, so the assertion now sits on overlay()'s own body -
  // the actual point of use - rather than on the file.
  const ovStart2 = vo.indexOf('function overlay(player, god, s, tag, opts)')
  const ovEnd2 = vo.indexOf('function say(', ovStart2)
  const ovBody2 = ovStart2 !== -1 ? vo.slice(ovStart2, ovEnd2) : ''
  ok('\U0001f6a8 overlay() never decides obfuscation from the PATH',
    ovStart2 !== -1 && ovBody2.indexOf('pathOf') === -1, true)
  // Twice inside alignedTo: the `typeof` guard and the call itself. Asserting the
  // exact number rather than ">= 1" is the point - it means a third read cannot be
  // added here without this line noticing.
  ok('\U0001f6a8 ...and alignedTo reads it exactly twice - the guard and the call',
    alignStart !== -1 && (alignBody.match(/pathOf/g) || []).length, 2)
  ok('⚠️ ...and alignedTo fails OPEN, so a missing lookup never garbles',
    /catch \(e\) \{ return true \}/.test(alignBody), true)

  const sd = code('salvage_deals.js')
  const ad = code('art_deal.js')
  ok('salvage pitch arrives broken', sd.indexOf('brokenAll([deal.pitch])') !== -1, true)
  ok('art demand arrives broken', ad.indexOf('brokenAll(OFFER)') !== -1, true)
  ok('\u26a0\ufe0f both fail SOFT to plain text - a plain line beats a silent one',
    sd.indexOf('return t') !== -1 && ad.indexOf('return t') !== -1, true)
}

console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
