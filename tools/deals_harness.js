// deals_harness.js — all of them suck, refusing is free, and saying yes must cost.
//
//     node tools/deals_harness.js
//
// ⭐ WHY THIS EXISTS. Three failures here are invisible in play and each one quietly
// destroys the condition:
//
//   · REFUSING THAT COSTS SOMETHING. The whole point is that the door out is free. If
//     a refusal ever bumped the counter, the "choice" becomes a toll and nobody would
//     be able to tell from inside the game.
//   · A DEAL THAT COUNTS WITHOUT CHARGING. Crediting an uncollected price hands out
//     the condition for free, silently, and looks identical to working correctly.
//   · TOUCHING AN INVENTORY. Ethan's standing rule: "we don't take items from players,
//     that is how you cause them to quit." A cost that reached into a hotbar would be
//     found by a player, not by a test.
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
let PATH_OF = ''            // '' = godless
let PATHS_PRESENT = true
const cmds = []
const actionbars = []
let lastRitual = null

const server = {
  players: [],
  overworld: () => ({ dayTime: () => DAYTIME }),
  runCommand: (c) => { cmds.push(c); return 1 },
  runCommandSilent: (c) => { cmds.push(c) },
  scheduleInTicks: () => { },
}

function mkPlayer(name) {
  const data = {}
  return {
    username: name,
    uuid: 'u-' + name,
    server,
    health: 20,
    foodLevel: 20,
    potionEffects: { add: (id, t, amp) => { data['fx:' + id] = amp } },
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
  paths: { pathOf: () => (PATHS_PRESENT ? PATH_OF : undefined) },
  ritual: {
    begin: (p, spec) => { lastRitual = { p, spec }; return true },
  },
  announce: { actionbar: (srv, p, s) => { actionbars.push(s); return true } },
}

const ri = console.info, rw = console.warn, re = console.error
console.info = () => { }; console.warn = () => { }; console.error = () => { }
try { (0, eval)(fs.readFileSync(path.join(SS, 'salvage_deals.js'), 'utf8')) }
catch (e) { console.info = ri; console.warn = rw; console.error = re; console.error('FAIL: salvage_deals.js threw :: ' + e); process.exit(1) }
console.info = ri; console.warn = rw; console.error = re
const D = global.VELDORA.deals
if (!D) { console.error('FAIL: salvage_deals.js published nothing'); process.exit(1) }

function choose(id) {
  const c = lastRitual && lastRitual.spec && lastRitual.spec.onChoose
  if (!c) throw new Error('no ritual open')
  const hushI = console.info, hushW = console.warn, hushE = console.error
  console.info = () => { }; console.warn = () => { }; console.error = () => { }
  try { c(lastRitual.p, id) } finally {
    console.info = hushI; console.warn = hushW; console.error = hushE
  }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE SHAPE — ten deals, four costs, five to be had')
{
  ok('five is the threshold', D.threshold, 5)
  ok('ten deals', D.deals.length, 10)
  const costs = {}
  D.deals.forEach(d => { costs[d.cost] = (costs[d.cost] || 0) + 1 })
  ok('⭐ all four of Ethan\'s costs are used', Object.keys(costs).sort(),
    ['debuff', 'hunger', 'levels', 'life'])
  ok('every deal has a pitch, a yes and an after',
    D.deals.every(d => d.pitch && d.yes && d.after), true)
  ok('🚨 Ethan\'s laughter line is verbatim',
    D.laughter, 'You hear the laughter of a distant god')

  // Her register: never more than three sentences.
  ok('⭐ no pitch runs past three sentences',
    D.deals.every(d => (d.pitch.match(/[.?!]/g) || []).length <= 3), true)
  // "never the words chosen, destiny or fate except to take the piss out of them"
  ok('no pitch says chosen/destiny/fate',
    D.deals.every(d => !/\b(chosen|destiny|fate)\b/i.test(d.pitch)), true)
}

grp('⭐ SHE GETS MORE HONEST — the answer to "convince five times"')
{
  const p = mkPlayer('Tier')
  ok('at zero she is selling', D._tierFor(p), 0)
  p._data['veldora_deals_taken'] = 3
  ok('by three she has stopped dressing it up', D._tierFor(p), 1)
  p._data['veldora_deals_taken'] = 4
  ok('by four she is plain', D._tierFor(p), 2)
  p._data['veldora_deals_taken'] = 5
  ok('by five she is barely present', D._tierFor(p), 3)

  // ⚠️ Every tier must have something in it, or she silently stops offering.
  const tiers = {}
  D.deals.forEach(d => { tiers[d.tier] = (tiers[d.tier] || 0) + 1 })
  ok('🚨 every tier 0-3 has at least one deal',
    [0, 1, 2, 3].every(t => tiers[t] > 0), true)
}

grp('🚨 REFUSING COSTS NOTHING — the assertion the design rests on')
{
  PATH_OF = ''; DAYTIME = 100000
  const p = mkPlayer('Refuser')
  D.offer(server, p, true)
  const before = JSON.stringify(p._data)
  choose('no')
  ok('🚨 the counter did not move', D.taken(p), 0)
  ok('🚨 ...and nothing at all was written', JSON.stringify(p._data), before)
  ok('health untouched', p.health, 20)
  ok('hunger untouched', p.foodLevel, 20)

  // Refusing ten times in a row still costs nothing.
  for (let i = 0; i < 10; i++) { D.offer(server, p, true); choose('no') }
  ok('🚨 ten refusals, still zero', D.taken(p), 0)
}

grp('⚠️ ACCEPTING COSTS, AND ONLY THEN COUNTS')
{
  PATH_OF = ''
  const p = mkPlayer('Taker')
  actionbars.length = 0
  D.offer(server, p, true)
  choose('yes')
  ok('the counter moved', D.taken(p), 1)
  ok('⭐ the laughter played on the ACTION BAR', actionbars.length, 1)
  ok('...and it is Ethan\'s line', actionbars[0], D.laughter)
}

grp('🚨 A DEAL THAT CHARGES NOTHING MUST NOT COUNT')
{
  const p = mkPlayer('Broke')
  // Break every route the charge could take.
  p.setHealth = () => { throw new Error('no') }
  p.potionEffects = { add: () => { throw new Error('no') } }
  Object.defineProperty(p, 'foodLevel', { set: () => { throw new Error('no') }, get: () => 20 })
  const realRun = server.runCommandSilent
  server.runCommandSilent = () => { throw new Error('no') }
  D.offer(server, p, true)
  choose('yes')
  server.runCommandSilent = realRun
  ok('🚨 an uncollected price does NOT credit the condition', D.taken(p), 0)
}

grp('⛔ NOT ONE COST TOUCHES AN INVENTORY')
{
  const src = code('salvage_deals.js')
  // Ethan: "we don't take items from players, that is how you cause them to quit."
  ok('🚨 no inventory access anywhere',
    /\b(inventory|getItem|removeItem|clearItem|\.item\b)/.test(src), false)
  ok('🚨 no `clear` command', src.indexOf("'clear ") === -1, true)
  ok('...and no item-taking command', /runCommand\w*\(['"]clear/.test(src), false)

  // ritual.js owns the dark; a leftover blindness is the bug its header warns about.
  ok('⚠️ the debuff is not blindness', src.indexOf('blindness') === -1, true)
}

grp('⭐ THE BOUNDARY — four is not enough, five is')
{
  const p = mkPlayer('Edge')
  p._data['veldora_deals_taken'] = 4
  ok('four does not qualify', D.qualifies(p), false)
  ok('one to go', D.remaining(p), 1)
  p._data['veldora_deals_taken'] = 5
  ok('🚨 five qualifies', D.qualifies(p), true)
  ok('remaining floors at zero', D.remaining(p), 0)

  // ⭐ And she stops once she has you - no point selling to a customer you own.
  PATH_OF = ''
  ok('🚨 she stops offering at five', D._eligible(server, p), false)
}

grp('⚠️ GODLESS ONLY, AND UNREADABLE IS NOT GODLESS')
{
  const p = mkPlayer('Pathed')
  DAYTIME = 500000
  PATH_OF = 'blade'
  ok('a pathed player gets nothing', D._eligible(server, p), false)
  PATH_OF = ''
  ok('a godless one is eligible', D._eligible(server, p), true)

  // 🚨 null means "could not read", which must NOT be treated as godless - offering
  // a pathed player is worse than offering nobody.
  PATHS_PRESENT = false
  ok('🚨 an unreadable path does NOT count as godless', D._eligible(server, p), false)
  PATHS_PRESENT = true
}

grp('⛔ SALVAGE IS NO LONGER AN ITEM')
{
  const ch = code('chosen.js')
  ok('🚨 the crossbow is gone', ch.indexOf('minecraft:crossbow') === -1, true)
  ok('🚨 ...and blade\'s sword stayed gone', ch.indexOf('minecraft:iron_sword') === -1, true)
  ok('forge and art still carry', ch.indexOf("forge: ['create:wrench']") !== -1, true)

  // ⚠️ FAILS CLOSED - an unlock is spent forever.
  ok('🚨 her route fails CLOSED without salvage_deals.js',
    ch.indexOf('var dealsOk = false') !== -1, true)
  ok('...and shouts rather than looking like a player who said no',
    ch.indexOf('salvage_deals.js is MISSING') !== -1, true)
  ok('⭐ /path shows her progress, not an item',
    ch.indexOf("'take her deals ' + VELDORA.deals.taken(p)") !== -1, true)
}

grp('🔑 ITS OWN KEY, LIKE E1')
{
  const p = mkPlayer('Keys')
  D.offer(server, p, true)
  choose('yes')
  const keys = Object.keys(p._data).filter(k => k.indexOf('veldora_') === 0)
  ok('🚨 no counters.js key is written',
    keys.every(k => k.indexOf('veldora_counter') !== 0), true)
  ok('the tally is its own', keys.indexOf('veldora_deals_taken') !== -1, true)

  const cs = code('counters.js')
  ok('🚨 counters.js cannot reach it',
    cs.indexOf('veldora_deals_taken') === -1, true)
}

grp('⭐ THE LAUGHTER IS AN ACTION BAR, NOT THE BOSS BAR')
{
  const ann = code('announce.js')
  ok('announce.js publishes an actionbar surface',
    ann.indexOf('actionbar: actionbar') !== -1, true)
  ok('...built on /title actionbar', ann.indexOf("' actionbar '") !== -1, true)
  // 🚨 It must NOT go through show() - an aftermath sting competing with a tide
  // warning would either cancel it or lose to it, and neither is right.
  const fn = ann.slice(ann.indexOf('function actionbar'), ann.indexOf('function pick'))
  ok('🚨 it does not touch the priority slot', fn.indexOf('show(') === -1, true)
  ok('...and does not read `live`', fn.indexOf('live[') === -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
