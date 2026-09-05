// dialogue_emu.js — play the dialogue WITHOUT launching Minecraft.
//
//     node tools/dialogue_emu.js --list
//     node tools/dialogue_emu.js opening                 # timeline table
//     node tools/dialogue_emu.js opening --play          # terminal playback, real speed
//     node tools/dialogue_emu.js opening --play --fast   # ...at 8x
//     node tools/dialogue_emu.js opening --html out.html # a screen you can watch
//     node tools/dialogue_emu.js --check                 # assertions over every scene
//
// ── ⭐ WHY THIS EXISTS ───────────────────────────────────────────────────────
// Ethan, 2026-09-05: *"is it possible for you to build a sort of emulator to test without
// me entering the game?"*
//
// Every dialogue defect this project has paid for was a TIMING or a PLACEMENT defect, and
// both are invisible to a harness that checks return values:
//
//   · a line held longer than 15 seconds                       (D-131)
//   · a beat cut off mid-word because the next one landed early
//   · text rendered underneath the Serene Seasons HUD, then "fixed" three times against a
//     boundary that never forwarded x/y at all                 (D-123)
//   · a title card that never rendered because a gate wanted a key it was never sent
//
// Each needed a person in the game to see it. That is the loop this closes.
//
// ── 🔑 WHERE IT TAPS, AND WHY THERE ─────────────────────────────────────────
// Everything the player ever sees leaves the pack as an `/immersivemessages` command, so
// the emulator runs the REAL voice.js / immersive.js / ritual.js and records BOTH sides of
// that boundary: the semantic call (text, anchor, x, y, seconds) and the exact command
// string that would go over the wire.
//
// ⚠️ Tapping any higher would test the pack's intentions rather than its output — which is
// exactly how opening_harness stayed green over a title card that never rendered.
//
// ── ⛔ WHAT IT IS NOT ────────────────────────────────────────────────────────
// It is NOT the game. It knows the pack's timing arithmetic exactly, because it runs the
// real code — but the mod's own typewriter RATE lives in the jar and is unreachable from
// Rhino (D-123), so TYPE_CPS below is an ASSUMPTION and is labelled as one everywhere it
// shows. Trust the ORDER and the DURATIONS; treat the typing animation as an illustration.
'use strict'
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', C = '\x1b[36m', D = '\x1b[90m'
const B = '\x1b[1m', X = '\x1b[0m'

// ⭐ THE TYPING RATE IS THE PACK'S, NOT MINE. voice.js exports TYPE_CHARS_PER_SEC and
// the emulator reads it out of the loaded sandbox - so this can never drift from the code
// the way a copied constant does. Five assertions broke in one session from exactly that.
// This is only the fallback for a scene that does not load voice.js.
const TYPE_CPS_FALLBACK = 15

// ── The screen, and what must be kept clear of it ───────────────────────────
// 🔴 THESE NUMBERS ARE ETHAN'S CLIENT and belong to one screen. A hardcoded speaker name
// is embarrassing; a hardcoded keep-out band is wrong on somebody else's monitor and they
// cannot tell why. Same caveat docs/TOOLKIT.md carries for cutscene.geometry.
//
// 🔴 AND THEY ARE CENTRE-RELATIVE, WHICH IS THE WHOLE OF THE COORDINATE PROBLEM.
// voice.js:511 says it outright - "max distance BELOW centre a line may be thrown". A
// TOP_LEFT beat at y=110 is 110 DOWN FROM THE TOP EDGE and is nowhere near the chat bar.
//
// ⚠️ My first version checked every anchor against these bands and reported all 18
// opening beats as sitting in the chat bar. That is this project's signature false
// finding - measuring in the wrong space - and a checker that cries wolf on a clean scene
// is worse than no checker, because the next real hit gets waved through.
const ZONES = [
  { name: 'chat bar', why: 'anything overlapping it is NOT RENDERED at all', from: 60, to: 999 },
  { name: 'crosshair', why: 'text sits on the reticle and is unreadable', from: -34, to: 34 },
  { name: 'biome title', why: 'the vanilla biome/title band', from: -53, to: -11 },
]

// ═══════════════════════════════════════════════════════════════════════════
// THE SANDBOX — the real scripts, a fake world, and a clock we control.
// ═══════════════════════════════════════════════════════════════════════════
function src(f) { return fs.readFileSync(path.join(SS, f), 'utf8') }

function makeWorld(files) {
  const events = []          // every im.show / im.popup, stamped with the tick it fired on
  const commands = []        // the literal command strings
  const chat = []
  let now = 0
  const queue = []           // {at, fn} - a real clock, so a callback may schedule another

  const server = {
    players: [],
    scheduleInTicks: (t, fn) => { queue.push({ at: now + Math.max(0, t | 0), fn }) },
    runCommand: (c) => { commands.push({ tick: now, c }); return 1 },
    runCommandSilent: (c) => { commands.push({ tick: now, c }) },
    getPlayer: () => player,
    persistentData: {},
  }
  const player = {
    username: 'Rehykt', uuid: 'emu-1', server,
    tell: (s) => chat.push({ tick: now, text: String(s) }),
    potionEffects: { add: () => { }, remove: () => { } },
    persistentData: {
      _d: {},
      putBoolean(k, v) { this._d[k] = v }, getBoolean(k) { return !!this._d[k] },
      putInt(k, v) { this._d[k] = v }, getInt(k) { return this._d[k] | 0 },
      putDouble(k, v) { this._d[k] = v }, getDouble(k) { return +this._d[k] || 0 },
      putString(k, v) { this._d[k] = v }, getString(k) { return this._d[k] || '' },
      contains(k) { return this._d[k] !== undefined },
    },
    level: { getEntitiesWithin: () => [] },
    boundingBox: { inflate: () => ({}) },
    stages: { has: () => false, add: () => { } },
  }

  const hooks = { login: [], logout: [], loaded: [] }
  const ctx = {
    VELDORA: {},
    Platform: { isLoaded: () => true },          // immersive.js probes this
    Utils: { server },
    Text: { of: (s) => String(s) },
    Item: { of: () => ({}) },
    Math, JSON, String, Number, Object, Array, Date, RegExp, isNaN, parseInt, parseFloat,
    console: { info() { }, warn() { }, error() { }, log() { } },
    ServerEvents: { loaded: (f) => hooks.loaded.push(f), commandRegistry() { }, tick() { }, highPriorityData() { } },
    PlayerEvents: {
      loggedIn: (f) => hooks.login.push(f), loggedOut: (f) => hooks.logout.push(f),
      tick() { }, chat() { }, decorateChat() { },
    },
    EntityEvents: { death() { }, hurt() { }, spawned() { } },
    BlockEvents: { placed() { }, broken() { } },
    ItemEvents: { entityInteracted() { }, rightClicked() { } },
    LevelEvents: { tick() { } },
    NetworkEvents: { dataReceived() { } },
  }
  ctx.global = ctx
  vm.createContext(ctx)

  for (const f of files) {
    try { vm.runInContext(src(f), ctx) }
    catch (e) { throw new Error('loading ' + f + ': ' + e.message) }
  }

  // 🔴 FIRE ServerEvents.loaded - THIS IS BOOT, AND IT IS NOT OPTIONAL. Every god
  // registers itself through pantheon.define inside its loaded() handler, so a sandbox
  // that only *collects* those handlers has an empty pantheon and every god scene comes
  // back silent. It looked like the gods had no lines; they had never been asked.
  for (const f of hooks.loaded) { try { f() } catch (e) { } }

  // ⭐ WRAP im AFTER the scripts load, so we record what the REAL immersive.js decided -
  // its gate, its probe, its NBT - rather than what a stub would have allowed.
  const im = ctx.VELDORA.im
  if (im) {
    const realShow = im.show, realPopup = im.popup
    im.show = function (p, text, o) {
      const before = commands.length
      const r = realShow ? realShow.apply(this, arguments) : false
      events.push({
        tick: now, kind: 'show', text: String(text), opts: o || {},
        command: commands.length > before ? commands[commands.length - 1].c : null,
        delivered: r !== false,
      })
      return r
    }
    im.popup = function (p, title, subtitle, secs) {
      const before = commands.length
      const r = realPopup ? realPopup.apply(this, arguments) : false
      events.push({
        tick: now, kind: 'popup', text: String(title), subtitle: String(subtitle || ''),
        opts: { seconds: secs }, command: commands.length > before ? commands[commands.length - 1].c : null,
        delivered: r !== false,
      })
      return r
    }
  }

  // Run the clock forward. `guard` stops a runaway scene rather than hanging the terminal.
  function run(maxTicks) {
    let guard = 0
    while (queue.length && guard++ < 100000) {
      queue.sort((a, b) => a.at - b.at)
      if (queue[0].at > maxTicks) break
      const job = queue.shift()
      now = job.at
      try { job.fn() } catch (e) { /* the pack try/catches everything; mirror that */ }
    }
  }

  return { ctx, player, server, events, commands, chat, hooks, run, tickNow: () => now }
}

// ═══════════════════════════════════════════════════════════════════════════
// THE SCENES — each says which files it needs and how to start itself.
// ═══════════════════════════════════════════════════════════════════════════
const SCENES = {
  opening: {
    what: 'the origin script, ending on the ARKHDOTTIR: NEW BLOOD card',
    files: ['immersive.js', 'voice.js', 'ritual.js', 'opening_lines.js', 'opening.js'],
    start: (w) => w.ctx.VELDORA.opening.play(w.player, true),
    ticks: 3000,
  },
}

// A god's line pools become scenes automatically - one per god, so a writing pass can be
// watched rather than read. ⚠️ Registered from the SAME pantheon call the game uses.
for (const god of ['blade', 'wall', 'salvage', 'forge', 'art']) {
  SCENES['say:' + god] = {
    what: 'every written pool for ' + god + ', one line each',
    files: ['immersive.js', 'voice.js', 'pantheon.js', god + '_voice.js'],
    start: (w) => {
      const v = w.ctx.VELDORA.voice
      if (!v || !v.pools) return false
      // ⭐ THE REAL TAGS, out of voice.js's own POOLS table. Guessing tag names meant a
      // renamed pool read as "this god has nothing written", which is the same shape as
      // the bug this tool exists to catch - so it reads the registry instead.
      const pools = v.pools[god] || {}
      let any = false
      let t = 0
      for (const tag of Object.keys(pools)) {
        // 🔴 30 SECONDS APART, AND THE GAP IS THE POINT. At 2s apart a multi-sentence
        // utterance ran straight over the next pool and the checker reported 347 beats
        // "replaced after 0.0s" - every one of them manufactured by this driver, not by
        // the pack. A false finding is worse than the gap it fills, so the pools are
        // spaced wider than the longest utterance can possibly run.
        const delay = (t += 600)
        w.server.scheduleInTicks(delay, () => { v.say(w.player, god, tag) })
        any = true
      }
      return any
    },
    ticks: 60000,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
function emulate(name) {
  const s = SCENES[name]
  if (!s) throw new Error('unknown scene: ' + name)
  const w = makeWorld(s.files)
  const started = s.start(w)
  w.run(s.ticks)
  // ⭐ Straight from the loaded voice.js, so the rate can never drift from the code.
  let cps = TYPE_CPS_FALLBACK
  try { cps = w.ctx.VELDORA.voice.TYPE_CHARS_PER_SEC || cps } catch (e) { }
  let gap, hold
  try { gap = w.ctx.VELDORA.screen.gap() } catch (e) { }
  try { hold = w.ctx.VELDORA.screen.HOLD } catch (e) { }
  return { name, spec: s, started, cps, gap, hold,
           events: w.events, chat: w.chat, commands: w.commands }
}

// ── Turn raw events into on-screen INTERVALS ────────────────────────────────
// 🔑 THE WHOLE POINT. One message REPLACES the last, so what a beat is actually on screen
// for is min(its own duration, the gap to the next one) - not the duration it asked for.
// That difference is where "the line was cut off mid-word" lives, and no return value
// anywhere in the pack exposes it.
function intervals(run) {
  const ev = run.events
  const cps = run.cps || TYPE_CPS_FALLBACK
  // ⭐ GAP AND THE HOLD CAPS COME FROM screen.js ITSELF, never copied. A test carrying
  // its own copy of a constant the code owns is how five assertions broke in one session.
  const GAP = (run.gap === undefined ? 0.5 : run.gap)
  const HOLD = run.hold || {}

  // ── 🔴 THE SCREEN IS A QUEUE, NOT A REPLACEMENT ──────────────────────────
  // MY FIRST MODEL HAD THIS BACKWARDS and it produced 347 false failures. voice.js's
  // speakChunks sends every sentence of an utterance in ONE tick, in a tight synchronous
  // loop with no scheduling at all (voice.js:950-968). Read as "each send replaces the
  // last", that means a three-sentence line shows only its third sentence - which would
  // be catastrophic, constant, and impossible to miss in play.
  //
  // 🔑 IT IS NOT WHAT HAPPENS, AND screen.js IS THE PROOF. That file exists to model a
  // BACKLOG: `drain[k]` records when the screen next frees up, and claim() REFUSES a new
  // utterance while the previous one is still owed. A backlog model is only meaningful
  // if the mod queues, so the mod queues - and a beat starts when the one before it
  // finishes, not when its command was sent.
  //
  // ⚠️ So this mirrors screen.js's own arithmetic rather than inventing one. It is the
  // emulator's single biggest assumption, and it is load-bearing for every duration below.
  let freeAt = 0
  return ev.map((e, i) => {
    const asked = Math.max(0, +(e.opts.seconds || e.opts.secs || 0))
    const cap = HOLD[String(e.opts.priority || 'GOD').toUpperCase()]
    const held = (typeof cap === 'number') ? Math.min(asked, cap) : asked
    const sentAt = e.tick / 20
    const startsAt = Math.max(sentAt, freeAt)
    freeAt = startsAt + held + GAP
    return {
      i, kind: e.kind, tick: e.tick,
      sentAt,                      // when the command went out
      at: startsAt,                // when the player actually sees it
      queuedS: startsAt - sentAt,  // how long it sat behind the previous beat
      text: e.text, subtitle: e.subtitle || '',
      askedS: asked,
      shownS: held,
      // ⭐ The only truncation that can still happen: the mod caps a hold by priority, so
      // a beat may be pulled off screen before its text has finished typing.
      typedS: String(e.text).length / cps,
      truncated: held > 0 && held < String(e.text).length / cps,
      anchor: String(e.opts.anchor || 'TOP_CENTER'),
      x: (typeof e.opts.x === 'number') ? e.opts.x : 0,
      y: (typeof e.opts.y === 'number') ? e.opts.y : 0,
      typewriter: !!e.opts.typewriter,
      colour: e.opts.colour || e.opts.color || null,
      god: e.god || null,
      delivered: e.delivered,
      command: e.command,
    }
  })
}

function zoneHit(iv) {
  // ⛔ A POPUP CARRIES NO NBT AT ALL - immersive.js calls it a preset, take it or leave
  // it. It has no x, no y and no anchor to test, so testing one is testing nothing.
  if (iv.kind === 'popup') return null
  // Only CENTER_* anchors share the coordinate space these bands are measured in.
  if (!/^CENTER/.test(iv.anchor)) return null
  // ⚠️ EXCLUSIVE AT THE EDGES, BECAUSE voice.js's OWN ARITHMETIC IS. dodgeCrosshair
  // cuts a band out by pushing `{lo: band.hi, hi: seg.hi}` (voice.js:568) - so band.hi is
  // the first ALLOWED value, not the last forbidden one. An inclusive test here reported
  // forge sitting on the crosshair at y=34, a value voice.js had deliberately chosen as
  // legal. Second false finding from this file, same root: measuring in a model that does
  // not match the code's.
  for (const z of ZONES) {
    if (iv.y > z.from && iv.y < z.to) return z
  }
  return null
}

// ═══════════════════════════════════════════════════════════════════════════
function printTable(run) {
  const ivs = intervals(run)
  console.log('\n' + B + run.name + X + D + '  ' + run.spec.what + X)
  console.log(D + '  started: ' + (run.started ? 'yes' : R + 'NO - the scene refused to play' + D) +
    ' · ' + ivs.length + ' beats · ' + (ivs.length ? (ivs[ivs.length - 1].at + ivs[ivs.length - 1].shownS).toFixed(1) : 0) + 's total' + X)
  console.log(D + '  ' + 'at'.padStart(7) + '  ' + 'shown'.padStart(6) + '  anchor        text' + X)
  for (const iv of ivs) {
    const z = zoneHit(iv)
    let flag = ''
    if (!iv.delivered) flag = R + ' ✗NOT DELIVERED' + X
    else if (iv.shownS > 15) flag = R + ' ✗>15s' + X
    else if (iv.truncated) flag = Y + ' ⚠replaced mid-type (needs ' + iv.typedS.toFixed(1) + 's to type)' + X
    if (z) flag += R + ' ✗' + z.name + X
    const kind = iv.kind === 'popup' ? C + '[card]' + X + ' ' : ''
    console.log('  ' + (iv.at.toFixed(1) + 's').padStart(7) + '  ' +
      (iv.shownS.toFixed(1) + 's').padStart(6) + '  ' +
      D + iv.anchor.padEnd(13) + X + kind + iv.text.slice(0, 64) + flag)
    if (iv.subtitle) console.log(' '.repeat(32) + D + iv.subtitle + X)
  }
}

async function play(run, fast) {
  const ivs = intervals(run)
  const cps = run.cps || TYPE_CPS_FALLBACK
  const scale = fast ? 8 : 1
  const sleep = (ms) => new Promise(r => setTimeout(r, ms / scale))
  console.log('\n' + B + 'playing ' + run.name + X + D + (fast ? '  (8x)' : '  (real time — ctrl-c to stop)') + X + '\n')
  let clock = 0
  for (const iv of ivs) {
    await sleep(Math.max(0, iv.at * 1000 - clock * 1000))
    clock = iv.at
    const head = D + iv.at.toFixed(1).padStart(6) + 's ' + X
    if (iv.kind === 'popup') {
      console.log(head + C + B + iv.text + X)
      if (iv.subtitle) console.log('        ' + D + iv.subtitle + X)
    } else if (iv.typewriter) {
      process.stdout.write(head)
      for (const ch of iv.text) { process.stdout.write(ch); await sleep(1000 / TYPE_CPS) }
      process.stdout.write('\n')
      clock += iv.text.length / TYPE_CPS
    } else {
      console.log(head + iv.text)
    }
  }
  console.log('\n' + D + '(typing rate is an assumption — see the header)' + X)
}

// ═══════════════════════════════════════════════════════════════════════════
// THE CHECKS — what the emulator can now assert that no harness could.
// ═══════════════════════════════════════════════════════════════════════════
function check() {
  let bad = 0, n = 0
  for (const name of Object.keys(SCENES)) {
    let run
    try { run = emulate(name) } catch (e) {
      console.log(R + 'CRASH' + X + ' ' + name + ': ' + e.message); bad++; continue
    }
    const ivs = intervals(run)
    // ⚠️ A scene that produced NOTHING is a failure, not a pass. "I ran and found nothing"
    // and "I could not run" must never look the same, and an empty timeline looks serene.
    if (!ivs.length) {
      console.log(R + 'EMPTY' + X + ' ' + name + ' — started=' + run.started + ', no beats reached the renderer')
      bad++; continue
    }
    for (const iv of ivs) {
      n++
      if (!iv.delivered) { console.log(R + 'FAIL ' + X + name + ' beat ' + iv.i + ' was refused by immersive.js'); bad++ }
      if (iv.shownS > 15) { console.log(R + 'FAIL ' + X + name + ' beat ' + iv.i + ' holds ' + iv.shownS.toFixed(1) + 's (>15s, D-131): ' + iv.text.slice(0, 50)); bad++ }
      if (iv.truncated) { console.log(R + 'FAIL ' + X + name + ' beat ' + iv.i + ' is replaced after ' + iv.shownS.toFixed(1) + 's but needs ' + iv.typedS.toFixed(1) + 's to type: ' + iv.text.slice(0, 50)); bad++ }
      const z = zoneHit(iv)
      if (z) { console.log(R + 'FAIL ' + X + name + ' beat ' + iv.i + ' sits in the ' + z.name + ' zone (y=' + iv.y + ') — ' + z.why); bad++ }
    }
    console.log((bad ? '' : G + '  ok  ' + X) + name + ' — ' + ivs.length + ' beats, ' +
      (ivs[ivs.length - 1].at + ivs[ivs.length - 1].shownS).toFixed(1) + 's')
  }
  console.log('\n' + (bad ? R + bad + ' problem(s) across ' + n + ' beats' + X : G + n + ' beats clean' + X))
  return bad
}

function selftest() {
  let bad = 0
  const t = (label, got, want) => {
    if (got === want) console.log('  ' + G + 'ok  ' + X + label)
    else { bad++; console.log('  ' + R + 'FAIL' + X + ' ' + label + ' - got ' + got + ', want ' + want) }
  }
  const run = (beats) => intervals({ events: beats, cps: 15, gap: 0.5, hold: {} })

  const held = run([{ tick: 0, kind: 'show', text: 'x', opts: { seconds: 20 }, delivered: true }])
  t('a 20s hold is over the 15s ceiling', held[0].shownS > 15, true)
  const okHold = run([{ tick: 0, kind: 'show', text: 'x', opts: { seconds: 9 }, delivered: true }])
  t('...while a 9s hold is not', okHold[0].shownS > 15, false)

  const refused = run([{ tick: 0, kind: 'show', text: 'x', opts: { seconds: 5 }, delivered: false }])
  t('a refused send is caught', refused[0].delivered, false)

  const inBand = run([{ tick: 0, kind: 'show', text: 'x', opts: { seconds: 5, anchor: 'CENTER_CENTER', y: 0 } }])
  t('y=0 is in the crosshair band', !!zoneHit(inBand[0]), true)
  const onEdge = run([{ tick: 0, kind: 'show', text: 'x', opts: { seconds: 5, anchor: 'CENTER_CENTER', y: 34 } }])
  t('...but y=34, its edge, is legal - voice.js says so', !!zoneHit(onEdge[0]), false)
  const topAnchor = run([{ tick: 0, kind: 'show', text: 'x', opts: { seconds: 5, anchor: 'TOP_LEFT', y: 0 } }])
  t('...and a TOP_LEFT beat is measured in another space', !!zoneHit(topAnchor[0]), false)
  const card = run([{ tick: 0, kind: 'popup', text: 'T', opts: { secs: 9, y: 0 } }])
  t('...and a popup has no geometry to test', !!zoneHit(card[0]), false)

  const two = run([
    { tick: 0, kind: 'show', text: 'first', opts: { seconds: 4 }, delivered: true },
    { tick: 0, kind: 'show', text: 'second', opts: { seconds: 4 }, delivered: true },
  ])
  t('two sends on ONE tick do not collide', two[1].at > two[0].at, true)
  t('...the second waits for the first plus the gap', two[1].at, 4.5)
  t('...and it is recorded as having queued', two[1].queuedS, 4.5)

  const capped = intervals({ events: [{ tick: 0, kind: 'show', text: 'a'.repeat(200), opts: { seconds: 30, priority: 'GOD' }, delivered: true }],
                             cps: 15, gap: 0.5, hold: { GOD: 6 } })
  t('a priority cap pulls a beat before it finishes typing', capped[0].truncated, true)

  console.log('')
  console.log(bad ? R + bad + ' FAILED' + X : G + 'the checker can still fail' + X)
  return bad
}


// ═══════════════════════════════════════════════════════════════════════════
function html(run, out) {
  const ivs = intervals(run)
  const page = fs.readFileSync(path.join(__dirname, 'dialogue_emu_player.html'), 'utf8')
    .replace('/*__DATA__*/null', JSON.stringify({
      name: run.name, what: run.spec.what, started: run.started,
      typeCps: run.cps || TYPE_CPS_FALLBACK, zones: ZONES, beats: ivs,
    }, null, 1))
  fs.writeFileSync(out, page)
  console.log(G + 'wrote ' + X + out + D + '  (' + ivs.length + ' beats)' + X)
}

// ═══════════════════════════════════════════════════════════════════════════
const argv = process.argv.slice(2)
const flags = new Set(argv.filter(a => a.startsWith('--')))
const positional = argv.filter(a => !a.startsWith('--'))

const NO_SCENE = flags.has('--check') || flags.has('--selftest') || flags.has('--json')
if (flags.has('--list') || (!positional.length && !NO_SCENE)) {
  console.log('\n' + B + 'scenes' + X)
  for (const k of Object.keys(SCENES)) console.log('  ' + k.padEnd(14) + D + SCENES[k].what + X)
  console.log('\n' + D + '  node tools/dialogue_emu.js <scene> [--play [--fast]] [--html out.html]' + X)
  console.log(D + '  node tools/dialogue_emu.js --check' + X + '\n')
  process.exit(0)
}

if (flags.has('--selftest')) process.exit(selftest() ? 1 : 0)

// ⭐ --json ALL: every scene's timeline in one blob, for an external player.
if (flags.has('--json')) {
  const names = positional.length ? positional : Object.keys(SCENES)
  const out = {}
  for (const n of names) {
    const r = emulate(n)
    out[n] = { what: r.spec.what, started: r.started, cps: r.cps, gap: r.gap,
               zones: ZONES, beats: intervals(r) }
  }
  process.stdout.write(JSON.stringify(out))
  process.exit(0)
}
if (flags.has('--check')) process.exit(check() ? 1 : 0)

const run = emulate(positional[0])
if (flags.has('--html')) {
  const i = argv.indexOf('--html')
  html(run, argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'dialogue.html')
} else if (flags.has('--raw')) {
  // ⭐ EXACTLY what would go over the wire. Useful on its own: when something renders
  // wrong in game, this is the string to compare against, with no interpretation applied.
  for (const c of run.commands) console.log((c.tick / 20).toFixed(1).padStart(7) + 's  ' + c.c)
} else if (flags.has('--play')) {
  play(run, flags.has('--fast'))
} else {
  printTable(run)
}
