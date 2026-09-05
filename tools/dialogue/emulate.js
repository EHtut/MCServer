// dialogue/emulate.js — run the pack's real speech code against a virtual clock.
//
// ⭐ THE CORE, AND DELIBERATELY THE ONLY COPY. Everything that reasons about dialogue
// timing imports this: the verifier, the CLI, the player. Two implementations of the same
// timing model is how two tools come to disagree without anyone noticing.
//
// It knows nothing about rules or verdicts. It answers one question: given these scripts
// and this trigger, WHAT reaches the screen, WHEN, and for how long.
'use strict'
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const SS = path.join(__dirname, '..', '..', 'pack', 'kubejs', 'server_scripts')

/**
 * Build a sandbox holding the real scripts, a fake world, and a clock we drive.
 * Returns the context plus the recorders, so a caller can trigger whatever it likes.
 */
function world(files) {
  const events = [], commands = [], chat = []
  let now = 0
  const queue = []

  const server = {
    players: [],
    scheduleInTicks: (t, fn) => queue.push({ at: now + Math.max(0, t | 0), fn }),
    runCommand: (c) => { commands.push({ tick: now, c }); return 1 },
    runCommandSilent: (c) => commands.push({ tick: now, c }),
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

  const loaded = []
  const ctx = {
    VELDORA: {},
    Platform: { isLoaded: () => true },       // immersive.js probes this before sending
    Utils: { server },
    Text: { of: (s) => String(s) },
    Item: { of: () => ({}) },
    Math, JSON, String, Number, Object, Array, Date, RegExp, isNaN, parseInt, parseFloat,
    console: { info() { }, warn() { }, error() { }, log() { } },
    ServerEvents: { loaded: (f) => loaded.push(f), commandRegistry() { }, tick() { }, highPriorityData() { } },
    PlayerEvents: { loggedIn() { }, loggedOut() { }, tick() { }, chat() { }, decorateChat() { } },
    EntityEvents: { death() { }, hurt() { }, spawned() { } },
    BlockEvents: { placed() { }, broken() { } },
    ItemEvents: { entityInteracted() { }, rightClicked() { } },
    LevelEvents: { tick() { } },
    NetworkEvents: { dataReceived() { } },
  }
  ctx.global = ctx
  vm.createContext(ctx)

  for (const f of files) {
    try { vm.runInContext(fs.readFileSync(path.join(SS, f), 'utf8'), ctx) }
    catch (e) { throw new Error('loading ' + f + ': ' + e.message) }
  }

  // 🔴 FIRE ServerEvents.loaded — THIS IS BOOT AND IT IS NOT OPTIONAL. Every god registers
  // itself through pantheon.define inside its loaded() handler, so a sandbox that only
  // collects those handlers has an empty pantheon and every god comes back silent. It
  // reads as "this god has no lines written" when it was simply never asked.
  for (const f of loaded) { try { f() } catch (e) { } }

  // ⭐ Wrap the renderer AFTER load, so what we record is what the real immersive.js
  // decided — its gate, its probe, its NBT — not what a stub would have waved through.
  const im = ctx.VELDORA.im
  if (im) {
    const rs = im.show, rp = im.popup
    im.show = function (p, text, o) {
      const before = commands.length
      const r = rs ? rs.apply(this, arguments) : false
      events.push({
        tick: now, kind: 'show', text: String(text), opts: o || {}, delivered: r !== false,
        command: commands.length > before ? commands[commands.length - 1].c : null,
      })
      return r
    }
    im.popup = function (p, title, subtitle, secs) {
      const before = commands.length
      const r = rp ? rp.apply(this, arguments) : false
      events.push({
        tick: now, kind: 'popup', text: String(title), subtitle: String(subtitle || ''),
        opts: { seconds: secs }, delivered: r !== false,
        command: commands.length > before ? commands[commands.length - 1].c : null,
      })
      return r
    }
  }

  function advance(maxTicks) {
    let guard = 0
    while (queue.length && guard++ < 100000) {
      queue.sort((a, b) => a.at - b.at)
      if (queue[0].at > maxTicks) break
      const job = queue.shift()
      now = job.at
      try { job.fn() } catch (e) { /* the pack try/catches everything; mirror it */ }
    }
  }

  return { ctx, player, server, events, commands, chat, advance }
}

/**
 * ⭐ THE TIMING MODEL, AND THE ONE ASSUMPTION EVERYTHING RESTS ON: THE SCREEN IS A QUEUE.
 *
 * 🔴 I HAD THIS BACKWARDS FIRST AND IT PRODUCED 347 FALSE FAILURES. voice.js's speakChunks
 * sends every sentence of an utterance in ONE tick, in a tight synchronous loop with no
 * scheduling at all (voice.js:950-968). Read as "each send replaces the last", a
 * three-sentence line would show only its third — which would be catastrophic, constant,
 * and impossible to miss in play.
 *
 * 🔑 screen.js IS THE PROOF IT DOES NOT WORK THAT WAY. That file exists to model a BACKLOG:
 * `drain[k]` records when the screen next frees up, and claim() refuses a new utterance
 * while the previous one is still owed. A backlog model is only meaningful if the mod
 * queues. So a beat starts when the one before it FINISHES, not when its command was sent,
 * and this mirrors screen.js's own arithmetic rather than inventing one.
 */
function timeline(w) {
  const V = w.ctx.VELDORA
  const cps = num(() => V.voice.TYPE_CHARS_PER_SEC, 15)
  const gap = num(() => V.screen.gap(), 0.5)
  const hold = obj(() => V.screen.HOLD, {})

  let freeAt = 0
  return w.events.map((e, i) => {
    const asked = Math.max(0, +(e.opts.seconds || e.opts.secs || 0))
    const cap = hold[String(e.opts.priority || 'GOD').toUpperCase()]
    const held = (typeof cap === 'number') ? Math.min(asked, cap) : asked
    const sentAt = e.tick / 20
    const at = Math.max(sentAt, freeAt)
    freeAt = at + held + gap
    return {
      i, kind: e.kind, at, sentAt, queuedS: at - sentAt,
      text: e.text, subtitle: e.subtitle || '',
      askedS: asked, shownS: held, typedS: String(e.text).length / cps,
      anchor: String(e.opts.anchor || 'TOP_CENTER'),
      x: numOr(e.opts.x, 0), y: numOr(e.opts.y, 0),
      typewriter: !!e.opts.typewriter,
      god: godOf(e.command),
      delivered: e.delivered !== false,
      command: e.command || null,
    }
  })
}

// The pack gives each god a custom FONT rather than a colour, so the font names the speaker.
function godOf(cmd) { const m = /veldora:(\w+)/.exec(cmd || ''); return m ? m[1] : null }
function num(f, d) { try { const v = f(); return typeof v === 'number' ? v : d } catch (e) { return d } }
function obj(f, d) { try { return f() || d } catch (e) { return d } }
function numOr(v, d) { return typeof v === 'number' ? v : d }

module.exports = { world, timeline, SS }
