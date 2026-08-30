// night_harness.js — prove the night silences the right gods, and only them.
//
//     node tools/night_harness.js
//
// ⭐ WHY THIS EXISTS. D1 is a cross-cutting gate over systems that until now assumed
// they may always speak. Two things about it cannot be play-tested:
//
//   · the COUNTER. Nobody can watch thirty nights to confirm it counted thirty, and it
//     is edge-triggered against a 5-second sweep — a sampling bug would add ~100 nights
//     per night and nobody would notice until the Speaker arrived on day two.
//   · the NEGATIVE. "Blade did not speak" looks exactly like "Blade had nothing to
//     say", which looks exactly like "the voice system is broken".
//
// 🚨 SO THE ASSERTIONS THAT MATTER ARE THE ONES THAT PROVE A GOD *CANNOT* SPEAK.
// Confirming a permitted god still talks is the easy half and proves almost nothing.
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

// ── a world whose clock you set by hand ───────────────────────────────────────
let DAYTIME = 1000            // absolute ticks; 1000 = morning
let CLOCK_BROKEN = false
const server = {
  overworld: () => ({
    dayTime: () => { if (CLOCK_BROKEN) throw new Error('no clock'); return DAYTIME },
  }),
  players: [],
  scheduleInTicks: () => { },
}

function mkPlayer(name) {
  const data = {}
  return {
    username: name,
    server,
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
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, tick: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {}

const ri = console.info, rw = console.warn, re = console.error
const hush = () => { console.info = console.warn = console.error = () => { } }
const speak = () => { console.info = ri; console.warn = rw; console.error = re }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'night.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: night.js threw on load :: ' + e); process.exit(1) }
speak()

const N = global.VELDORA.night
if (!N) { console.error('FAIL: night.js published nothing'); process.exit(1) }

const DAY = 1000, NIGHT = 15000
// advance a player through n full day/night cycles, sweeping several times per phase
// so the edge trigger is genuinely exercised rather than stepped exactly once.
function liveNights(p, n) {
  for (let i = 0; i < n; i++) {
    DAYTIME = DAY + i * 24000
    for (let k = 0; k < 5; k++) N._advance(server, p)
    DAYTIME = NIGHT + i * 24000
    for (let k = 0; k < 5; k++) N._advance(server, p)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE CLOCK')
{
  DAYTIME = 1000;  ok('morning is not night', N.isNight(server), false)
  DAYTIME = 12999; ok('one tick before dusk is still day', N.isNight(server), false)
  DAYTIME = 13000; ok('dusk is night', N.isNight(server), true)
  DAYTIME = 22999; ok('just before dawn is still night', N.isNight(server), true)
  DAYTIME = 23000; ok('dawn is day again', N.isNight(server), false)
  DAYTIME = 15000 + 24000 * 57; ok('🚨 it works on an absolute clock, not just day one',
    N.isNight(server), true)
}

grp('🔑 THE COUNTER IS EDGE-TRIGGERED — the bug that cannot be play-tested')
{
  const p = mkPlayer('Counter')
  ok('starts at zero', N.nightsFor(p), 0)

  // one night, swept FIFTY times. A sampled counter would read ~50.
  DAYTIME = DAY
  for (let k = 0; k < 25; k++) N._advance(server, p)
  DAYTIME = NIGHT
  for (let k = 0; k < 50; k++) N._advance(server, p)
  ok('🚨 fifty sweeps inside ONE night count exactly one', N.nightsFor(p), 1)

  DAYTIME = DAY + 24000
  for (let k = 0; k < 25; k++) N._advance(server, p)
  ok('...and daytime sweeps add nothing', N.nightsFor(p), 1)

  DAYTIME = NIGHT + 24000
  for (let k = 0; k < 10; k++) N._advance(server, p)
  ok('the next night counts one more', N.nightsFor(p), 2)
}

grp('🚨 THE SILENCE — the assertions that actually matter')
{
  const p = mkPlayer('Silenced')
  liveNights(p, N.speakerNight)
  ok('she arrives on night ' + N.speakerNight, N.nightsFor(p) >= N.speakerNight, true)
  ok('...and hasArrived agrees', N.hasArrived(p), true)

  DAYTIME = NIGHT
  ok('🚨 BLADE CANNOT SPEAK AT NIGHT', N.maySpeak(server, p, 'blade'), false)
  ok('🚨 SALVAGE CANNOT SPEAK AT NIGHT', N.maySpeak(server, p, 'salvage'), false)
  ok('⭐ wall keeps her voice', N.maySpeak(server, p, 'wall'), true)
  ok('⭐ forge keeps hers', N.maySpeak(server, p, 'forge'), true)
  ok('⭐ art keeps hers', N.maySpeak(server, p, 'art'), true)

  DAYTIME = DAY
  ok('🚨 and by DAY blade speaks again', N.maySpeak(server, p, 'blade'), true)
  ok('...salvage too', N.maySpeak(server, p, 'salvage'), true)
}

grp('⚠️ NOTHING IS SILENCED BEFORE SHE ARRIVES')
{
  const p = mkPlayer('Early')
  liveNights(p, N.speakerNight - 1)
  ok('one night short of arrival', N.nightsFor(p), N.speakerNight - 1)
  ok('...she has not arrived', N.hasArrived(p), false)
  DAYTIME = NIGHT
  ok('🚨 blade still speaks at night before night ' + N.speakerNight,
    N.maySpeak(server, p, 'blade'), true)
  ok('...salvage too', N.maySpeak(server, p, 'salvage'), true)
}

grp('🚨 THE GATE FAILS OPEN — every failure path lets gods speak')
{
  const p = mkPlayer('Broken')
  liveNights(p, N.speakerNight)
  DAYTIME = NIGHT
  ok('sanity: silenced while the clock works', N.maySpeak(server, p, 'blade'), false)

  CLOCK_BROKEN = true
  ok('🚨 an unreadable clock does NOT silence anyone', N.maySpeak(server, p, 'blade'), true)
  ok('...and isNight says null, not false', N.isNight(server), null)
  CLOCK_BROKEN = false

  ok('a null player does not silence', N.maySpeak(server, null, 'blade'), true)
  ok('🚨 an UNKNOWN god keeps its voice - the list names who LOSES it',
    N.maySpeak(server, p, 'some_new_god'), true)
  ok('...and so does an empty god key', N.maySpeak(server, p, ''), true)
}

grp('⭐ silencedNow is the exact inverse of maySpeak')
{
  const p = mkPlayer('Inverse')
  liveNights(p, N.speakerNight)
  DAYTIME = NIGHT
  const gods = ['blade', 'salvage', 'wall', 'forge', 'art', 'nobody']
  ok('inverse holds for every god, night and day',
    gods.every(g => {
      DAYTIME = NIGHT
      const a = N.maySpeak(server, p, g) === !N.silencedNow(server, p, g)
      DAYTIME = DAY
      const b = N.maySpeak(server, p, g) === !N.silencedNow(server, p, g)
      return a && b
    }), true)
}

grp('🔑 VOICE.JS CONSULTS IT — the wiring, not just the rule')
{
  const src = fs.readFileSync(path.join(SS, 'voice.js'), 'utf8')
  ok('🚨 say() checks the gate', /function say\([^)]*\)\s*\{\s*\n\s*if \(silenced\(/.test(src), true)
  ok('🚨 sayAbout() checks it too', /function sayAbout\([^)]*\)\s*\{\s*\n\s*if \(silenced\(/.test(src), true)
  ok('...and it is late-bound through VELDORA.night',
    src.indexOf('VELDORA.night') !== -1 && src.indexOf('silencedNow') !== -1, true)
  ok('⚠️ the wrapper fails open on a throw', /catch \(e\) \{ return false \}/.test(src), true)
}

console.log('\n' + (fail === 0
  ? G + pass + '/' + (pass + fail) + ' passed' + X
  : R + fail + ' FAILED' + X + ', ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
