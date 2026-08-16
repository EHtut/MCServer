// release_harness.js — prove the release state machine WITHOUT a server.
//
//     node tools/release_harness.js
//
// Ethan, 2026-08-16: "we flag a restart after we ensure everything works on the
// code side."
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────────
// The release conditions are the only mechanic in this pack that can take
// somebody's path from them, and both are SLOW: four buff-deaths in a row for
// Blade (his two buff sources are days apart), three refusals for Salvage. There
// is no way to play-test the false negatives - "does surviving a gift really
// forgive you?" is not a question anyone can answer by dying four times.
//
// So the state machine gets driven directly. This stubs the six KubeJS globals
// release.js touches, evals the real file, and drives VELDORA.release.* against a
// fake player whose persistentData is a plain object.
//
// 🚨 WHAT THIS DOES *NOT* PROVE. It runs the real file, so the state machine and
// the registry are genuinely tested - but the CALL SITES are not. It cannot tell
// you that blade_events actually calls armed(), or that salvage.js actually calls
// denied(). Those are checked separately by the wiring scan at the bottom, which
// greps the call sites rather than running them. Boot-verified is not live, and
// neither of these is a play-test.

'use strict'
const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts', 'release.js')

// ── the fake world ──────────────────────────────────────────────────────────
let TICK = 1000
const server = { tickCount: 0 }
Object.defineProperty(server, 'tickCount', { get: () => TICK })

function mkPlayer(name, pathKey) {
  const data = {}
  const p = {
    username: name,
    player: true,
    server: server,
    persistentData: {
      getInt: (k) => (typeof data[k] === 'number' ? data[k] : 0),
      putInt: (k, v) => { data[k] = v },
      getString: (k) => (typeof data[k] === 'string' ? data[k] : ''),
      putString: (k, v) => { data[k] = v },
    },
    tell: () => { },
    _data: data,
  }
  data['veldora_path'] = pathKey
  return p
}

// ── the stubs ───────────────────────────────────────────────────────────────
const deathHooks = []
const loginHooks = []
global.EntityEvents = { death: (f) => deathHooks.push(f) }
global.PlayerEvents = { loggedIn: (f) => loginHooks.push(f) }
global.ServerEvents = { commandRegistry: () => { }, loaded: () => { } }
global.Text = { of: (s) => s }

let QUIET = true
const realWarn = console.warn, realInfo = console.info, realErr = console.error
function hush() {
  if (!QUIET) return
  console.warn = () => { }; console.info = () => { }; console.error = () => { }
}
function speak() { console.warn = realWarn; console.info = realInfo; console.error = realErr }

// theFall is stubbed so the harness can count it without fall.js's machinery.
const fell = []
global.VELDORA = {
  theFall: (srv, p, key) => { fell.push(p.username + ':' + key); p._data['veldora_path'] = ''; return true },
  paths: { nameOf: (k) => 'The ' + k },
}

hush()
// eslint-disable-next-line no-eval
;(0, eval)(fs.readFileSync(FILE, 'utf8'))
speak()

const R = global.VELDORA.release
if (!R) { console.error('FAIL: release.js did not publish VELDORA.release'); process.exit(1) }

const death = (p) => { hush(); deathHooks.forEach((f) => f({ entity: p })); speak() }

// ── the assertions ──────────────────────────────────────────────────────────
let pass = 0, fail = 0
function ok(name, got, want) {
  const good = JSON.stringify(got) === JSON.stringify(want)
  if (good) { pass++; console.log('  \x1b[32mok  \x1b[0m' + name) }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name + '\n         got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
function grp(t) { console.log('\n\x1b[1m' + t + '\x1b[0m') }
const streak = (p, k) => R._streakOf(p, k)

// ═══════════════════════════════════════════════════════════════════════════
grp('WALL — never lets go')
ok('wall does not fall on regard', R.fallsOnRegard('wall'), false)
ok('wall KEEPS her beat-5 line (it is a promise, not a threat)', R.speaksAtMax('wall'), true)
{
  const w = mkPlayer('WallWalker', 'wall')
  R.armed(server, w, 'wall', 600); TICK += 10; death(w)
  ok('arming wall is a no-op', streak(w, 'wall'), 0)
  ok('wall never reaches theFall', fell.length, 0)
  ok('denying wall does nothing (she makes no offers)', R.denied(server, w, 'wall'), -1)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('BLADE — 4 buff-deaths in a row')
ok('blade does not fall on regard', R.fallsOnRegard('blade'), false)
ok('blade beat-5 line is SUPPRESSED (it threatens a fall that cannot happen)', R.speaksAtMax('blade'), false)
{
  const b = mkPlayer('BladeWalker', 'blade')

  TICK = 1000
  death(b)
  ok('a death with NO buff is not a strike', streak(b, 'blade'), 0)

  for (let i = 1; i <= 3; i++) {
    R.armed(server, b, 'blade', 600)
    TICK += 100                       // inside the window
    death(b)
    ok('buff-death ' + i + ' -> streak ' + i, streak(b, 'blade'), i)
  }
  ok('three strikes have NOT released him', fell.length, 0)

  // the forgiveness rule
  R.armed(server, b, 'blade', 600)
  TICK += 5000                        // the window closes while alive
  death(b)
  ok('SURVIVING a gift resets the streak to zero', streak(b, 'blade'), 0)
  ok('and that death is not itself a strike', fell.length, 0)

  // all the way this time
  for (let i = 1; i <= 4; i++) {
    R.armed(server, b, 'blade', 600)
    TICK += 100
    death(b)
  }
  ok('the FOURTH consecutive buff-death releases him', fell, ['BladeWalker:blade'])
  ok('and the streak is cleared behind it', streak(b, 'blade'), 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('BLADE — one buff can only ever cost one strike')
{
  fell.length = 0
  const b = mkPlayer('Spiral', 'blade')
  TICK = 1000
  R.armed(server, b, 'blade', 6000)
  TICK += 10; death(b)
  TICK += 10; death(b)               // P8: seven hostiles are waiting where you fell
  TICK += 10; death(b)
  ok('dying three times inside ONE window is one strike', streak(b, 'blade'), 1)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('BLADE — the restart gotcha (K9 wearing a different hat)')
{
  fell.length = 0
  const b = mkPlayer('Restarted', 'blade')
  TICK = 900000
  R.armed(server, b, 'blade', 6000)
  R._strike(server, b, 'blade', 'buff_death', 'seed')
  ok('seeded a streak of 1', streak(b, 'blade'), 1)
  TICK = 40                          // server restarted; tickCount is back near zero
  death(b)
  ok('a stamp from the future does NOT strike', streak(b, 'blade'), 0)
  ok('it resolves as SURVIVED, not as a permanent armed state', b._data['veldora_rel_arm'], 0)
  ok('nobody was released by a restart', fell.length, 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('SALVAGE — 3 refusals in a row')
ok('salvage does not fall on regard', R.fallsOnRegard('salvage'), false)
ok('salvage beat-5 line is SUPPRESSED', R.speaksAtMax('salvage'), false)
{
  fell.length = 0
  const s = mkPlayer('Customer', 'salvage')

  R.denied(server, s, 'salvage', 'counter')
  ok('refusal 1', streak(s, 'salvage'), 1)
  R.denied(server, s, 'salvage', 'markup')
  ok('refusal 2', streak(s, 'salvage'), 2)
  ok('two refusals have not released her', fell.length, 0)

  R.accepted(server, s, 'salvage', 'hunger')
  ok('ACCEPTING one deal resets the streak', streak(s, 'salvage'), 0)

  R.denied(server, s, 'salvage', 'a'); R.denied(server, s, 'salvage', 'b')
  R.ignored(server, s, 'salvage', 'timeout')
  ok('a TIMEOUT is not a refusal - the streak holds at 2', streak(s, 'salvage'), 2)
  ok('and a timeout never releases anyone', fell.length, 0)

  R.denied(server, s, 'salvage', 'c')
  ok('the THIRD refusal releases her', fell, ['Customer:salvage'])
}
{
  const s = mkPlayer('Broke', 'salvage')
  R.denied(server, s, 'salvage', 'a'); R.denied(server, s, 'salvage', 'b')
  R.accepted(server, s, 'salvage', 'levels')   // said yes, too poor to pay
  ok('saying yes forgives even when the trade FAILS', streak(s, 'salvage'), 0)
}
{
  const s = mkPlayer('Deathly', 'salvage')
  R.armed(server, s, 'salvage', 600); TICK += 10; death(s)
  ok('salvage does not strike on death - only on refusal', streak(s, 'salvage'), 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('CROSS-CUTTING')
{
  const p = mkPlayer('Switcher', 'blade')
  R._strike(server, p, 'blade', 'buff_death', 'x')
  R._strike(server, p, 'blade', 'buff_death', 'x')
  ok('two strikes on blade', streak(p, 'blade'), 2)
  p._data['veldora_path'] = 'salvage'
  ok("blade's streak does NOT carry onto salvage", streak(p, 'salvage'), 0)
  p._data['veldora_path'] = 'blade'
  ok('and it is still there if they return to blade', streak(p, 'blade'), 2)
}
ok('an UNKNOWN god still falls on regard (never silently unloseable)', R.fallsOnRegard('nonesuch'), true)
ok('forge keeps the legacy door', R.fallsOnRegard('forge'), true)
ok('art keeps the legacy door', R.fallsOnRegard('art'), true)
ok('crown keeps the legacy door', R.fallsOnRegard('crown'), true)
ok('a pathless player has no mode', R.read(server, mkPlayer('Nobody', '')).mode, 'none')
{
  // "I failed" and "I found nothing" must never share a return value.
  const w = mkPlayer('W', 'wall')
  ok('strike on a non-streak god returns -1, not 0', R._strike(server, w, 'wall', 'denial', 'x'), -1)
}

// ═══════════════════════════════════════════════════════════════════════════
// THE WIRING SCAN. The state machine above is real; these are the call sites,
// and a passing state machine that nothing calls is exactly the failure mode this
// project has shipped before.
grp('WIRING — is anything actually calling it?')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')
const src = (f) => fs.readFileSync(path.join(SS, f), 'utf8')
const count = (s, needle) => s.split(needle).length - 1

const blade = src('blade_events.js')
ok('blade_events arms on BOTH buff sites', count(blade, 'VELDORA.release.armed('), 2)

const sal = src('salvage.js'), salE = src('salvage_events.js')
ok('salvage.js counter denies', count(sal, 'VELDORA.release.denied('), 1)
ok('salvage.js counter accepts', count(sal, 'VELDORA.release.accepted('), 1)
ok('salvage_events routes its 3 offers through deny()', count(salE, 'return deny(pl,'), 3)
ok('salvage_events routes its 3 offers through accept()', count(salE, 'accept(pl,'), 3)
// 4 sites: her counter in salvage.js, plus credit / markup / insurance.
ok('all 4 offer timeouts are logged, never counted',
  count(sal, 'VELDORA.release.ignored(') + count(salE, 'VELDORA.release.ignored('), 4)

// Twice: the `typeof` guard and the call. Both matter - the guard is what makes a
// missing release.js fall back to the legacy door instead of throwing.
const reg = src('regard.js')
ok('regard.js consults the registry before falling', count(reg, 'fallsOnRegard'), 2)
ok('regard.js suppresses a beat-5 threat it can no longer keep', count(reg, 'speaksAtMax'), 1)

const fall = src('fall.js')
ok('fall.js has a re-entrancy guard', count(fall, 'Already fallen, or never held it'), 1)
ok('fall.js still hard-codes wall as a safety net', count(fall, 'NEVER_LETS_GO = { wall: true }'), 1)

console.log('\n' + (fail === 0
  ? '\x1b[32m' + pass + '/' + (pass + fail) + ' passed.\x1b[0m'
  : '\x1b[31m' + fail + ' FAILED\x1b[0m of ' + (pass + fail)))
process.exit(fail === 0 ? 0 : 1)
