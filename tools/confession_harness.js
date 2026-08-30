// confession_harness.js — the confession must be EARNED, not waited out.
//
//     node tools/confession_harness.js
//
// 🔴 WHY THIS EXISTS. Ethan, 2026-08-29: *"I think liam stepped into the depths and
// instantly got it a few sessions ago."* He was right, and it was not a code fault —
// `confessionEligible` did exactly what it said. The fault was WHICH NUMBER it read.
//
// Phase is a band over **notoriety**, and `/path` states what notoriety is: *"It rises
// with the levels you gain, and on its own with the days."* So a player who simply
// existed long enough reached `companion`, and the only remaining condition was walking
// downstairs. **The most guarded writing in the game was gated on the passage of time.**
//
// 🚨 THE ASSERTIONS THAT MATTER ARE THE REFUSALS. "She confessed" is easy to see in
// play; "she confessed to somebody who had not earned it" is invisible until the text
// is already spent — and a confession spent is gone.
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

let PHASE = 'helper'
let TRUST = 0
let TRUST_THROWS = false
const server = { players: [], scheduleInTicks: () => { }, persistentData: { getCompound: () => ({}) } }

function mkPlayer(opts) {
  const o = opts || {}
  const data = {}
  const p = {
    username: o.name || 'P', uuid: 'u-' + (o.name || 'P'), server,
    persistentData: {
      getInt: (k) => (typeof data[k] === 'number' ? data[k] : 0),
      putInt: (k, v) => { data[k] = v },
      getString: (k) => (typeof data[k] === 'string' ? data[k] : ''),
      putString: (k, v) => { data[k] = v },
      getBoolean: (k) => !!data[k],
      putBoolean: (k, v) => { data[k] = v },
    },
    tell: () => { }, _data: data,
  }
  // stage is stored as stage+1, so 0 means "never heard any"
  if (o.stage !== undefined) data['veldora_spk_stage_death_speaker'] = o.stage + 1
  if (o.met !== false) data['veldora_spk_met_death_speaker'] = true
  return p
}

global.ServerEvents = { commandRegistry: () => { }, loaded: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { }, spawned: () => { } }
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, tick: () => { }, respawned: () => { } }
global.ItemEvents = { rightClicked: () => { }, entityInteracted: () => { } }
global.BlockEvents = { placed: () => { }, broken: () => { }, rightClicked: () => { } }
global.Text = { of: (s) => s }
global.Item = { of: () => ({}) }
global.VELDORA = {
  paths: { pathOf: () => 'blade' },
  ritual: { active: () => false },
  voice: { say: () => true, sayAbout: () => true, line: () => 'x', register: () => true, registerLines: () => true },
  phase: { of: () => PHASE },
  trust: () => { if (TRUST_THROWS) throw new Error('no trust'); return TRUST },
}

const ri = console.info, rw = console.warn, re = console.error
const hush = () => { console.info = console.warn = console.error = () => { } }
const speak = () => { console.info = ri; console.warn = rw; console.error = re }

hush()
try { (0, eval)(fs.readFileSync(path.join(SS, 'deep_speaker.js'), 'utf8')) }
catch (e) { speak(); console.error('FAIL: deep_speaker.js threw on load :: ' + e); process.exit(1) }
speak()

const S = global.VELDORA.speaker
if (!S || typeof S.eligible !== 'function') {
  console.error('FAIL: VELDORA.speaker.eligible not exported'); process.exit(1)
}
const elig = (p) => S.eligible(p, server)

// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 THE BUG — time alone must no longer be enough')
{
  // Exactly Liam's shape: notoriety drifted up to `companion` on its own, he met her
  // in the depths, and nothing else was asked of him.
  const drifter = mkPlayer({ name: 'Drifter', stage: 0 })
  PHASE = 'companion'; TRUST = 0
  ok('🚨 phase `companion` with ZERO trust is REFUSED', elig(drifter), false)

  TRUST = 1
  ok('🚨 ...and trust 1 is still not enough for stage 1', elig(drifter), false)

  TRUST = 2
  ok('⭐ trust 2 opens stage 1', elig(drifter), true)
}

grp('⚠️ BOTH GATES, NOT EITHER — the half that saves Wall and Forge')
{
  // Wall and Forge start at MAX trust and decay. Gating on trust ALONE would hand them
  // every stage on day one — the same bug with the opposite sign.
  const noncombatant = mkPlayer({ name: 'FreshWall', stage: 0 })
  PHASE = 'helper'; TRUST = 5
  ok('🚨 MAX trust but no phase is REFUSED', elig(noncombatant), false)

  PHASE = 'companion'
  ok('...and it opens once the phase is there too', elig(noncombatant), true)
}

grp('⭐ THE LADDER — each stage costs more')
{
  const p1 = mkPlayer({ name: 'S1', stage: 1 })
  PHASE = 'absence'; TRUST = 3
  ok('stage 2 refuses trust 3', elig(p1), false)
  TRUST = 4
  ok('...and opens at 4', elig(p1), true)

  const p2 = mkPlayer({ name: 'S2', stage: 2 })
  PHASE = 'harvest'; TRUST = 4
  ok('🚨 stage 3 refuses trust 4 — it costs everything', elig(p2), false)
  TRUST = 5
  ok('⭐ ...and opens only at MAX trust', elig(p2), true)
}

grp('🚨 IT FAILS CLOSED — the opposite bias to night.js, on purpose')
{
  const p = mkPlayer({ name: 'Broken', stage: 0 })
  PHASE = 'harvest'; TRUST = 5
  ok('sanity: eligible while everything reads', elig(p), true)

  TRUST_THROWS = true
  ok('🚨 an unreadable trust says NOTHING', elig(p), false)
  TRUST_THROWS = false

  const noTrust = global.VELDORA.trust
  delete global.VELDORA.trust
  ok('🚨 a MISSING trust module says nothing either', elig(p), false)
  global.VELDORA.trust = noTrust
  // ⚠️ night.js fails OPEN because a silence nobody reports is the worse failure there.
  // Here the worse failure is spending the game's best writing on somebody who has not
  // earned it — a confession withheld can be given later; a confession spent is gone.
}

grp('⚠️ THE PRE-EXISTING GUARDS STILL HOLD')
{
  PHASE = 'harvest'; TRUST = 5
  const unmet = mkPlayer({ name: 'Stranger', stage: 0, met: false })
  ok('never met her → not eligible', elig(unmet), false)

  const done = mkPlayer({ name: 'Finished', stage: 3 })
  ok('all stages heard → not eligible', elig(done), false)

  PHASE = ''
  const p = mkPlayer({ name: 'NoPhase', stage: 0 })
  ok('🚨 an unreadable PHASE is still not treated as `helper`', elig(p), false)
  PHASE = 'harvest'
}

console.log('\n' + (fail === 0
  ? G + pass + '/' + (pass + fail) + ' passed' + X
  : R + fail + ' FAILED' + X + ', ' + pass + ' passed'))
process.exit(fail === 0 ? 0 : 1)
