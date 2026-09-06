// urge_harness.js — the pull that argues with Ank, and the escalation nobody has written yet.
//
//     node tools/urge_harness.js
//
// ⭐ THE POINT OF THIS FILE: the ramp is testable with ZERO written lines. Ethan writes the
// dialogue next, and the mechanism must be provably correct before he does — otherwise the
// first thing his writing hits is a broken ladder, and he cannot tell which half is wrong.
'use strict'
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')
const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', X = '\x1b[0m'
let pass = 0, fail = 0
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}
function grp(t) { console.log('\n' + B + t + X) }

function build(opts) {
  const o = opts || {}
  const ambient = []
  const state = { day: 0 }
  const server = {
    tickCount: 0, players: [],
    overworld: () => ({ dayTime: () => (o.noClock ? NaN : state.day * 24000 + 6000) }),
  }
  const ctx = {
    VELDORA: {
      ank: { TOO_DEEP: -32 },
      announce: { text: (s, p, t) => { ambient.push(t); return true }, P_AMBIENT: 0 },
    },
    Math, String, JSON,
    console: { info() { }, warn() { }, error() { } },
    Text: { of: (s) => s },
    ServerEvents: { tick() { }, commandRegistry() { }, loaded() { } },
  }
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(path.join(SS, 'urge.js'), 'utf8'), ctx)
  const player = (y) => ({
    y: y === undefined ? 70 : y,
    persistentData: {
      _d: {}, putInt(k, v) { this._d[k] = v }, getInt(k) { return this._d[k] | 0 },
    },
  })
  return { U: ctx.VELDORA.urge, ctx, server, state, player, ambient }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE RAMP FITS INSIDE ACT 0 — seven days, four tiers')
{
  const e = build()
  const p = e.player()
  ok('a player just arrived is at nothing', (e.U.tierOf(e.server, p) || {}).tag, undefined)
  const seen = []
  for (const d of [1, 2, 3, 4, 5, 6, 7]) {
    e.state.day = d
    seen.push((e.U.tierOf(e.server, p) || {}).tag || 'none')
  }
  // 🔑 Act 0 runs seven days. A ramp whose last step lands on day 9 never happens.
  ok('it climbs across the act', seen,
    ['urge_1', 'urge_2', 'urge_2', 'urge_3', 'urge_3', 'urge_4', 'urge_4'])
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ IT MEASURES STAYING AWAY, NOT TIME PLAYED')
{
  // 🔑 THIS IS THE WHOLE MECHANIC. Ank pays the player to stay out; staying out is what
  // makes the urge louder. His bribe working is what turns the volume up, and the two
  // systems argue through the player.
  const e = build()
  const p = e.player()
  // ⚠️ SEEN ON DAY 0 FIRST. A player is measured from their FIRST SIGHT, not from world
  // day zero - otherwise somebody joining an old world is at max agitation on arrival.
  e.U.daysWithout(e.server, p)
  e.state.day = 6
  ok('six days away is the top tier', (e.U.tierOf(e.server, p) || {}).tag, 'urge_4')
  e.U.descended(e.server, p)
  ok('...and one descent silences it completely', (e.U.tierOf(e.server, p) || {}).tag, undefined)
  e.state.day = 8
  ok('...then it starts climbing again from there', (e.U.tierOf(e.server, p) || {}).tag, 'urge_2')
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 AN EMPTY POOL IS A STATE, NOT A FAILURE, AND NOT SILENCE')
{
  // 🖊️ Ethan writes these next. Until then every tier reports `no-lines:<tier>` — which
  // says the ESCALATION is working and only the words are missing. A bare `false` here
  // would make "the ramp is broken" and "nobody has written it yet" identical.
  const e = build()
  const p = e.player()
  e.U.daysWithout(e.server, p)          // first sight, day 0
  e.state.day = 3
  ok('it names the tier it would have used', e.U.consider(e.server, p), 'no-lines:urge_2')
  ok('...and says nothing', e.ambient.length, 0)
  ok('...and nothing is written yet, honestly reported', e.U.written(), 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ AND IT SPEAKS ONCE A DAY WHEN THERE IS SOMETHING TO SAY')
{
  const e = build()
  // ⚠️ SEED urge_3 TOO. Day 4 crosses into the next tier, so testing "again tomorrow"
  // with only urge_2 written measures the EMPTY POOL branch instead of the daily reset -
  // which is what the first version of this test actually did.
  e.ctx.VELDORA.urge.lines.urge_2.push('A test line.')
  e.ctx.VELDORA.urge.lines.urge_3.push('A louder test line.')
  const p = e.player()
  e.U.daysWithout(e.server, p)          // first sight, day 0
  e.state.day = 3
  ok('it speaks', e.U.consider(e.server, p), 'spoke:urge_2')
  ok('...through the ambient surface', e.ambient, ['A test line.'])
  // ⚠️ A mood, not an alarm. The sweep runs every ten seconds; without this it would
  // repeat the line 360 times a day.
  ok('...and not twice in one day', e.U.consider(e.server, p), 'spoke-today')
  e.state.day = 4
  ok('...but again tomorrow', e.U.consider(e.server, p).indexOf('spoke:') === 0, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⛔ NOT WHILE THEY ARE ALREADY DOWN THERE')
{
  const e = build()
  e.ctx.VELDORA.urge.lines.urge_4.push('A test line.')
  const p = e.player(-40)
  e.U.daysWithout(e.server, p)
  e.state.day = 6
  ok('being in the deep is not the moment to be told to go', e.U.consider(e.server, p), 'in-the-deep')
  ok('...and it stays quiet', e.ambient.length, 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 UNREADABLE IS NOT ZERO, AND NOT-YET IS NEITHER')
{
  // 🔑 The three outcomes must stay distinguishable. tierOf returned null for BOTH
  // "clock broken" and "calm player", so consider() called an ordinary first morning
  // "unreadable" and its not-yet branch could never run.
  const calm = build()
  const cp = calm.player()
  calm.U.daysWithout(calm.server, cp)
  ok('a calm player is FALSE, not null', calm.U.tierOf(calm.server, cp), false)
  ok('...and consider says not-yet', calm.U.consider(calm.server, cp), 'not-yet')

  // ⚠️ A world whose time cannot be read would otherwise report "they just descended"
  // forever, and the urge would never start — silent, with nothing wrong on the surface.
  const e = build({ noClock: true })
  const p = e.player()
  ok('an unreadable clock is null, not 0', e.U.daysWithout(e.server, p), null)
  ok('...the tier is null too', e.U.tierOf(e.server, p), null)
  ok('...and the sweep does nothing', e.U.consider(e.server, p), 'unreadable')
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⚠️ THE BOUNDARY IS READ FROM ANK, NOT COPIED')
{
  // 🔑 Two constants that must agree and do not is how "he left but the urge never
  // started" happens, and a player at -33 would be neither warned nor pulled.
  const e = build()
  e.ctx.VELDORA.ank.TOO_DEEP = -10          // move Ank's boundary
  const p = e.player(-20)                    // below the NEW one, above the old
  e.U.daysWithout(e.server, p)
  e.state.day = 6
  ok('the urge follows it', e.U.consider(e.server, p), 'in-the-deep')

  const src = fs.readFileSync(path.join(SS, 'urge.js'), 'utf8')
  ok('...and -32 appears only as a fallback', (src.match(/-32/g) || []).length, 1)
}

console.log('\n' + (fail ? R + fail + ' FAILED, ' + X : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
