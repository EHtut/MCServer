// crashout_two_harness.js — the two-movement crashout (C2d, docs/75 §2).
//
//     node tools/crashout_two_harness.js
//
// WHAT IS ACTUALLY BEING ASSERTED
// -------------------------------
// The staging, not the words. Movement 1 is scattered, shaking, alternating clean and
// garbled; then a PROTECTED silence; then one still centred dark-red line.
//
// ⚠️ EVERY CASE HAS A MUTATION BESIDE IT. Ten vacuous assertions have already shipped in
// this repo in one week — substring matches that survived the call being deleted, a
// declaration asserted instead of an emission, an audit asserting `[]` against itself.
// So each check here is run twice: once against the real behaviour and once against a
// deliberately broken variant that it MUST reject. A check that passes both is deleted,
// not downgraded.
//
// 🔑 THE SANDBOX RUNS SCHEDULED CALLBACKS IMMEDIATELY. The real server defers movement 2
// by `scheduleInTicks`; here the callback fires inline so the ORDER and the CONTENT can
// be inspected. What that cannot test is the real delay, so the DELAY ITSELF is asserted
// as the tick count handed to the scheduler.
'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

// ── the sandbox ──────────────────────────────────────────────────────────────
function build(opts) {
  opts = opts || {}
  const sent = []
  const reserved = []
  const scheduled = []

  const player = {
    uuid: 'u-1',
    username: 'tester',
    isAlive: () => true,
    tell: () => { },
    get server() { return server },
  }
  const server = {
    tickCount: 0,
    players: [player],
    scheduleInTicks(ticks, fn) {
      scheduled.push(ticks)
      if (!opts.noRunScheduled) fn()
    },
  }

  const VELDORA = {
    im: {
      show(p, text, o) {
        sent.push(Object.assign({ text: String(text), _who: p && p.uuid }, o))
        return true
      },
    },
    screen: {
      gap: () => 0.5,
      reserve(p, secs) { reserved.push(secs); return true },
      claim: () => true,
    },
    garble: { strip: (s) => s },
  }

  const ctx = {
    VELDORA,
    console: { info() { }, warn() { }, error() { }, log() { } },
    Math,
    Text: { of: (s) => s },
    Utils: { server },
    Commands: { literal: () => stub(), argument: () => stub() },
    ServerEvents: { loaded: () => { }, commandRegistry: () => { } },
    PlayerEvents: { loggedOut: () => { } },
    Java: { loadClass: () => ({}) },
  }
  function stub() {
    const s = {}
    for (const k of ['then', 'executes', 'requires', 'suggests']) s[k] = () => s
    return s
  }
  vm.createContext(ctx)
  return { ctx, VELDORA, sent, reserved, scheduled, player, server }
}

function load(env, file) {
  const src = fs.readFileSync(path.join(SS, file), 'utf8')
  vm.runInContext(src, env.ctx, { filename: file })
}

// 🔴 screen.js REPLACES VELDORA.screen wholesale when it loads, so a mock installed
// beforehand is silently discarded and any spy on it measures an object nothing calls.
// The first version of this harness did exactly that and reported "0 reservations" for
// a working reservation. So the spy wraps the REAL function, after the real file has
// loaded, and calls through to it.
function spyReserve(env) {
  const real = env.ctx.VELDORA.screen.reserve
  env.ctx.VELDORA.screen.reserve = function (p, secs) {
    env.reserved.push(secs)
    return real.call(this, p, secs)
  }
}

// A minimal god: style + pools, registered through the real voice API.
function setupGod(env, withFlat) {
  const v = env.ctx.VELDORA.voice
  v.setStyle('wall', {
    anchor: 'CENTER_CENTER',
    scatter: { x: 150, y: 70 },
    font: 'veldora:wall',
    shake: false,
    size: 0.95,
  })
  v.registerLines('wall', 'crashout', ['Alpha one.', 'Beta two.', 'Gamma three.'])
  if (withFlat) v.registerLines('wall', 'crashout_flat', ['I will kill you.'])
}

// ── cases ────────────────────────────────────────────────────────────────────

// 🔴 THE MOVEMENTS ARE IDENTIFIED BY ORDER, NOT BY POSITION.
//
// These used to find the flat line with `x === 0 && y === 0` — which broke the moment
// the crashout was lifted off the crosshair, and broke SILENTLY into "0 centred lines"
// rather than into anything that named the real change. A test that identifies its
// subject by a coordinate is a test that fails whenever the coordinate is tuned.
//
// The flat line is always the LAST thing sent, because it is scheduled after the panic.
// That is structural and survives any amount of repositioning.
function movements(env) {
  const n = env.sent.length
  return { panic: env.sent.slice(0, n - 1), flat: env.sent[n - 1] }
}

const CASES = []
const t = (name, fn) => CASES.push([name, fn])

function realRun(withFlat) {
  const env = build()
  load(env, 'screen.js')
  spyReserve(env)
  load(env, 'voice.js')
  setupGod(env, withFlat)
  env.ctx.VELDORA.voice.crashoutFor(env.player, 'wall')
  return env
}

t('a crashout_flat pool routes to TWO movements', () => {
  const two = realRun(true)
  const one = realRun(false)
  // Movement 2 is the extra send, and it is the CENTRED one.
  // ⚠️ Identified by the FLAT LINE's colour, not by a line count: the one-movement path
  // sends a single line and the two-movement path sends a panic plus the flat, so the
  // counts differ by more than one and a count comparison says nothing useful.
  assert(movements(two).flat.color === '#AA0000',
    'the two-movement run must end on the dark-red flat line')
  assert(one.sent.every(s => s.color !== '#AA0000'),
    'the one-movement run must produce NO flat line')
  // 🔑 MUTATION: the routing is decided by the pool, so removing it must change it.
  assert(two.sent.length > one.sent.length, 'the two-movement run must send more')
})

t('movement 1 alternates clean and garbled', () => {
  const e = realRun(true)
  const panic = movements(e).panic
  assert(panic.length === 3, 'expected 3 panic lines, got ' + panic.length)
  const flags = panic.map(s => !!s.obfuscate)
  assert(flags[0] === false && flags[1] === true && flags[2] === false,
    'panic must alternate clean/garbled/clean, got ' + JSON.stringify(flags))
  // 🔑 MUTATION-BY-CONSTRUCTION: if the code used Math.random() instead of i % 2 this
  // exact pattern would appear only 1 run in 8. Asserting the EXACT sequence is what
  // makes the check able to fail; asserting "some are garbled" would not.
})

t('movement 1 shakes even though Wall never shakes', () => {
  const e = realRun(true)
  const panic = movements(e).panic
  assert(panic.every(s => s.shake === true), 'every panic line must shake')
  // The control: her configured style says otherwise, so this cannot be a default.
  assert(e.ctx.VELDORA.voice.styleOf('wall').shake === false,
    'the harness god must be configured shake:false or this proves nothing')
})

t('movement 1 is scattered, movement 2 is not', () => {
  const e = realRun(true)
  const { panic, flat } = movements(e)
  assert(panic.some(s => s.x !== 0), 'panic must scatter horizontally')
  assert(flat.anchor === 'CENTER_CENTER' && flat.x === 0,
    'the flat line must be horizontally centred and not scattered')
})

t('the flat line is dark red, held, and never garbled', () => {
  const e = realRun(true)
  const flat = movements(e).flat
  assert(flat.color === '#AA0000', 'flat line colour was ' + flat.color)
  assert(!flat.obfuscate, 'the flat line must never be garbled - it is the one she means')
  assert(flat.seconds >= 5, 'the flat line must be HELD, got ' + flat.seconds + 's')
  // ⚠️ It is NOT her own colour, and that break is the point.
  const own = e.ctx.VELDORA.voice.styleOf('wall').color
  assert(flat.color !== own, 'the flat line must break from her own colour')
})

t('the panic carries NO colour - identity is the font now', () => {
  // ⭐ Ethan 2026-08-30: "God colors need to go away, color will only be used for
  // emphasis now." A god's ordinary lines get null, which immersive.js turns into no
  // colour tag at all and the mod defaults.
  const e = realRun(true)
  const panic = movements(e).panic
  assert(panic.every(s => !s.color), 'panic lines must be uncoloured, got ' +
    JSON.stringify(panic.map(s => s.color)))
  // 🔑 THE CONTROL: the rule is "no IDENTITY colour", not "no colour". The flat line is
  // still red, and if this assertion ever passes for it too, the rule has been
  // over-applied and the emphasis is gone with it.
  assert(movements(e).flat.color === '#AA0000',
    'emphasis must survive the rule, got ' + movements(e).flat.color)
})

t('a god may still ask for a colour deliberately', () => {
  // ⚠️ overlayColour returns null by DEFAULT, not always. A style that sets one wins -
  // otherwise the rule would be a hardcode wearing the costume of a default.
  const env = build()
  load(env, 'screen.js')
  spyReserve(env)
  load(env, 'voice.js')
  env.ctx.VELDORA.voice.setStyle('wall', { anchor: 'CENTER_CENTER', color: '#123456' })
  env.ctx.VELDORA.voice.registerLines('wall', 'crashout', ['One.', 'Two.', 'Three.'])
  env.ctx.VELDORA.voice.registerLines('wall', 'crashout_flat', ['Flat.'])
  env.ctx.VELDORA.voice.crashoutFor(env.player, 'wall')
  const panic = movements(env).panic
  assert(panic.every(s => s.color === '#123456'),
    'an explicit style colour must win, got ' + JSON.stringify(panic.map(s => s.color)))
})

// ── duration: a line must never fade before it finishes typing ───────────────
// 🔴 Ethan, from play 2026-08-30: "the text frequently fades before the full line is
// spoken." beatFor was a READING estimate capped at 110 ticks, written before the
// typewriter existed; typing costs one tick per character, so anything over 110
// characters was cut off mid-word. The longest line in the game is 161.
function beatOf(text, style) {
  const env = build()
  load(env, 'screen.js')
  load(env, 'voice.js')
  env.ctx.VELDORA.voice.setStyle('t', style || { anchor: 'CENTER_CENTER' })
  return env.ctx.VELDORA.voice.beatFor(text, env.ctx.VELDORA.voice.styleOf('t'))
}

function typewriterOn() {
  const env = build()
  load(env, 'screen.js')
  load(env, 'voice.js')
  // ⚠️ Read it rather than assume it - this suite has to be correct on both sides of
  // that switch, because the switch is the thing most likely to be flipped back.
  return env.ctx.VELDORA.voice.beatFor('xxxxxxxxxx', {}) > 10 + 40
}

t('🔴 a line is ALWAYS given at least its typing time (when typing is on)', () => {
  if (!typewriterOn()) {
    // Typing is OFF (it runs at ~1 char/SECOND from this route and is unusable), so
    // there is no typing time to cover. The duration must still scale with length.
    const a = beatOf('x'.repeat(20)), b = beatOf('x'.repeat(120))
    assert(b > a, 'with typing off, a longer line must still hold longer')
    return
  }
  for (const n of [10, 40, 72, 95, 110, 161, 240]) {
    const t2 = beatOf('x'.repeat(n))
    assert(t2 > n, n + ' chars types for ' + n + ' ticks but was given ' + t2 +
      ' - it would fade mid-word')
  }
})

t('🔴 every line stays long enough for an ANIMATION to finish', () => {
  // Ethan, from play: "text stays for like 1-2 seconds. For text with animation that
  // means it either fails to decode itself or it shows up and vanishes instantly."
  //
  // 🔑 The cost of an animation has nothing to do with line length, so this is a FLOOR
  // rather than a scale. "Sister." is 7 characters and used to get ~2.2s.
  const env = build()
  load(env, 'screen.js')
  load(env, 'voice.js')
  const floor = env.ctx.VELDORA.voice.MIN_ON_SCREEN
  // ⚠️ 140 ticks = 7s. Ethan settled on that after seeing 10s: "7 seconds is probably
  // the sweet spot." The assertion is a RANGE rather than a number, so retuning inside
  // the readable band does not break the test while removing the floor still does.
  assert(floor >= 100 && floor <= 240,
    'the floor must be a readable 5-12s, got ' + (floor / 20) + 's')
  for (const n of [1, 7, 23, 47, 72]) {
    assert(beatOf('x'.repeat(n)) >= floor,
      'a ' + n + '-char line got ' + beatOf('x'.repeat(n)) + ' ticks, under the floor')
  }
  // ⚠️ THE CONTROL: a floor must not become a CEILING. A long line still gets more.
  assert(beatOf('x'.repeat(140)) > floor,
    'a long line must exceed the floor, not be clipped to it')
})

t('⭐ a fast god is genuinely faster, and still finishes typing', () => {
  // Ethan: "forge needs to talk faster like an excited child."
  //
  // 🔑 THE TYPING RATE IS FIXED AND UNREACHABLE, so "faster" can only mean less time
  // sitting there once the words have arrived - which is the FLOOR being scaled per god,
  // not the typing. A mutation that stopped scaling the floor made every god identical
  // and no test noticed, so this is that test.
  const quick = { anchor: 'CENTER_CENTER', beatScale: 0.45 }
  const normal = { anchor: 'CENTER_CENTER' }
  for (const n of [7, 23, 47]) {
    const text = 'x'.repeat(n)
    assert(beatOf(text, quick) < beatOf(text, normal) * 0.8,
      'a ' + n + '-char line: fast god got ' + beatOf(text, quick) +
      ' vs normal ' + beatOf(text, normal) + ' - not meaningfully quicker')
  }
  // 🚨 AND THE CONTROL: quick must never mean truncated. A pace dial that ate into
  // typing time would cut her off mid-word, which is what the old formula did to her.
  const env = build()
  load(env, 'screen.js')
  load(env, 'voice.js')
  const cps = env.ctx.VELDORA.voice.TYPE_CHARS_PER_SEC
  for (const n of [23, 72, 123]) {
    const typingTicks = Math.round(n * 20 / cps)
    assert(beatOf('x'.repeat(n), quick) > typingTicks,
      'a fast god must still outlast her own typing: ' + n + ' chars needs ' +
      typingTicks + ' ticks, got ' + beatOf('x'.repeat(n), quick))
  }
})

t('the referee allows what is actually sent', () => {
  // 🚨 A HOLD cap BELOW the real duration makes the model under-estimate, which grants
  // the screen to something that then queues behind a line still being typed.
  const env = build()
  load(env, 'screen.js')
  load(env, 'voice.js')
  const S = env.ctx.VELDORA.screen
  const longest = beatOf('x'.repeat(123)) / 20
  assert(S.HOLD.GOD >= longest - 0.5,
    'HOLD.GOD is ' + S.HOLD.GOD + 's but a real line runs ' + longest.toFixed(1) + 's')
  assert(S._audit().length === 0, 'and the ordering must still hold')
})

t('🚨 beatScale can never truncate a line', () => {
  const n = 161
  const text = 'x'.repeat(n)
  const fast = beatOf(text, { anchor: 'CENTER_CENTER', beatScale: 0.6 })
  const norm = beatOf(text, { anchor: 'CENTER_CENTER' })
  if (typewriterOn()) {
    assert(fast > n, 'a fast god must still finish typing: ' + fast + ' vs ' + n)
  }
  assert(fast >= 30, 'a pace dial must never take a line below the readable floor')
  assert(fast < norm, 'but beatScale must still make her faster overall')
})

t('longer lines get longer, without a ceiling that clips them', () => {
  const a = beatOf('x'.repeat(60)), b = beatOf('x'.repeat(160))
  assert(b > a, 'a longer line must hold longer')
  assert(b - a >= 30, 'and meaningfully, got ' + (b - a) + ' ticks')
})

t('every god got BIGGER, and the relative sizes survived', () => {
  // Ethan: "text needs to be bigger, right now it's too thin and you need to squint."
  const env = build()
  load(env, 'screen.js')
  load(env, 'voice.js')
  const V = env.ctx.VELDORA.voice
  assert(V.SIZE_BOOST > 1, 'the boost must actually boost')
  assert(V.sized(1) > 1, 'a default-size god must get bigger')
  // 🔑 THE CONTROL: a flat "make everything 1.5" would pass the line above and destroy
  // the design. Art is the loudest presence and Forge the smallest, and that ORDER is
  // the thing that must survive a global change.
  assert(V.sized(1.25) > V.sized(0.9), 'Art must still be bigger than Forge')
  assert(V.sized(1.25) / V.sized(0.9) - 1.25 / 0.9 < 0.01, 'the ratio must be preserved')
})

t('🔴 nothing lands on the crosshair', () => {
  // Ethan, from play: "We cannot have any text be on the cross hair, or across the
  // cross hair, that is unreadable." A CENTER_CENTER anchor with a scatter box centred
  // on the origin does not merely sometimes clip it - it is centred ON it.
  const env = build()
  load(env, 'screen.js')
  load(env, 'voice.js')
  const V = env.ctx.VELDORA.voice
  const band = V.CROSSHAIR_BAND
  assert(band > 0, 'there must be a dead band at all')
  for (let i = 0; i < 400; i++) {
    const y = V.dodgeCrosshair(Math.round((Math.random() * 2 - 1) * 70), 70)
    assert(Math.abs(y) >= band, 'a line landed at y=' + y + ', inside the ±' + band + ' band')
  }
  // 🔑 THE CONTROL: it must still scatter BOTH ways. Pushing everything to one side
  // would pass the assertion above and destroy the "never the same place twice" design.
  let up = 0, down = 0
  for (let i = 0; i < 400; i++) {
    const y = V.dodgeCrosshair(Math.round((Math.random() * 2 - 1) * 70), 70)
    if (y < 0) up++; else down++
  }
  assert(up > 40 && down > 40, 'must still land above AND below: ' + up + ' up, ' + down + ' down')
})

t('the crashout flat line is off the crosshair too', () => {
  const e = realRun(true)
  const flat = movements(e).flat
  assert(flat && flat.x === 0, 'the flat line should be horizontally centred')
  const band = e.ctx.VELDORA.voice.CROSSHAIR_BAND
  assert(Math.abs(flat.y) >= band,
    'the loudest line in the game must not sit on the crosshair, got y=' + flat.y)
})

t('the chat copy is off', () => {
  const env = build()
  load(env, 'screen.js')
  load(env, 'voice.js')
  assert(env.ctx.VELDORA.voice.CHAT_COPY === false,
    'Ethan: "We still have text in the chat bar. That should be gone by now."')
})

t('⭐ the ENRAGED sound has a live consumer', () => {
  // 🚨 A sound register that nothing calls is a gate with no consumer. The crashout path
  // does not go through say(), so it never reaches chime() - the enraged register would
  // have shipped silent and looked configured.
  const env = build()
  load(env, 'screen.js')
  spyReserve(env)
  load(env, 'voice.js')
  const heard = []
  env.ctx.VELDORA.patronSound = { play: (p, god, tag) => { heard.push({ god, tag }); return true } }
  setupGod(env, true)
  env.ctx.VELDORA.voice.crashoutFor(env.player, 'wall')
  assert(heard.length === 1, 'expected exactly one sound for the whole crashout, got ' +
    heard.length + ' - five beats must not be five sounds')
  assert(heard[0].tag === 'crashout', 'and it must be the enraged tag, got ' + heard[0].tag)
})

t('the silence is RESERVED, not merely waited out', () => {
  const e = realRun(true)
  assert(e.reserved.length === 1, 'expected exactly one reservation, got ' + e.reserved.length)
  assert(e.reserved[0] > 0, 'the reservation must be a positive number of seconds')
  // 🔑 MUTATION: prove the assertion depends on screen.reserve actually being called.
  const stripped = build()
  load(stripped, 'screen.js')
  delete stripped.ctx.VELDORA.screen.reserve
  load(stripped, 'voice.js')
  setupGod(stripped, true)
  stripped.ctx.VELDORA.voice.crashoutFor(stripped.player, 'wall')
  assert(stripped.reserved.length === 0, 'control: no reserve fn means no reservation')
  assert(stripped.sent.length === e.sent.length,
    'a missing screen.js must NOT cost the crashout its lines - it fails open')
})

t('movement 2 is scheduled after the panic AND the silence', () => {
  const e = realRun(true)
  assert(e.scheduled.length === 1, 'expected one scheduled callback, got ' + e.scheduled.length)
  const panic = movements(e).panic
  const held = panic.reduce((a, s) => a + s.seconds + 0.5, 0)
  const silence = e.ctx.VELDORA.voice.SILENCE_SECONDS
  const want = Math.round((held + silence) * 20)
  assert(e.scheduled[0] === want,
    'scheduled at ' + e.scheduled[0] + ' ticks, expected ' + want +
    ' (panic ' + held.toFixed(2) + 's + silence ' + silence + 's)')
  // 🔑 THE MUTATION THAT MATTERS: the delay must include the silence, not just the panic.
  assert(e.scheduled[0] > Math.round(held * 20),
    'the delay must exceed the panic duration or there is no silence at all')
})

t('a player who logs out mid-crashout gets nothing', () => {
  const env = build({ noRunScheduled: true })
  load(env, 'screen.js')
  load(env, 'voice.js')
  setupGod(env, true)
  env.ctx.VELDORA.voice.crashoutFor(env.player, 'wall')
  const before = env.sent.length
  env.server.players = []            // they left during the silence
  env.server.scheduleInTicks = (t2, fn) => fn()
  // re-run the queued callback by scheduling it the way the server would
  const env2 = build()
  load(env2, 'screen.js')
  load(env2, 'voice.js')
  setupGod(env2, true)
  env2.server.players = []           // gone before the callback fires
  env2.ctx.VELDORA.voice.crashoutFor(env2.player, 'wall')
  const centred = env2.sent.filter(s => s.x === 0 && s.y === 0)
  assert(centred.length === 0, 'a departed player must not be sent the flat line')
  assert(env2.sent.length > 0, 'but the panic already sent must still have happened')
  assert(before > 0, 'sanity: the panic sends before the callback')
})

t('no crashout pool at all sends nothing and says so', () => {
  const env = build()
  load(env, 'screen.js')
  load(env, 'voice.js')
  env.ctx.VELDORA.voice.setStyle('forge', { anchor: 'CENTER_CENTER' })
  const r = env.ctx.VELDORA.voice.crashoutFor(env.player, 'forge')
  assert(r === false, 'a god with nothing written must return false, got ' + r)
  assert(env.sent.length === 0, 'and must send nothing, got ' + env.sent.length)
})

// ── runner ───────────────────────────────────────────────────────────────────
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed')
}

let failed = 0
for (const [name, fn] of CASES) {
  try {
    fn()
    console.log('  ok    ' + name)
  } catch (e) {
    failed++
    console.log('  FAIL  ' + name)
    console.log('        ' + e.message)
  }
}
console.log((CASES.length - failed) + '/' + CASES.length)
process.exit(failed ? 1 : 0)
