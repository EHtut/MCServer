// dialogue/verify.js — "does this dialogue look good?", answered without the game.
//
//     const { verify } = require('./tools/dialogue/verify')
//
//     verify({ lines: ['You were a traveler.', 'A life ahead of you.'] })
//     verify({ god: 'blade' })          // every pool that god has written
//     verify({ scene: 'opening' })      // a whole staged scene
//
// ⭐ THE `lines` FORM IS THE POINT. It runs text that is NOT IN THE PACK YET through the
// pack's real duration and placement maths, so a writing pass can be checked before the
// lines are pasted in — let alone deployed. The other two forms check what is already there.
//
// Returns { ok, beats, findings, warnings } and nothing else. Composition lives here;
// the timing model is emulate.js's and the rules are rules.js's.
'use strict'
const { world, timeline } = require('./emulate')
const { RULES, SOURCE_RULES } = require('./rules')

// The minimum a speaker needs to be measurable. Any scene needs immersive (the renderer),
// voice (durations, splitting, placement) and screen (the queue model).
const BASE = ['immersive.js', 'voice.js', 'screen.js']

const SCENES = {
  opening: {
    what: 'the title card - the only thing on screen. The origin is in the journal',
    files: [...BASE, 'ritual.js', 'opening_lines.js', 'opening.js'],
    start: (w) => w.ctx.VELDORA.opening.play(w.player, true),
    ticks: 4000,
  },
}

/**
 * Speak arbitrary lines as a given speaker, using the real engine.
 *
 * ⚠️ THEY ALL GO OUT AT TICK 0 ON PURPOSE. That is exactly what voice.js does with a
 * multi-sentence utterance (speakChunks sends every chunk in one tick), and the queue model
 * in emulate.js then lays them out the way the mod would. Spacing them by hand here would
 * be inventing a schedule the pack does not use.
 */
function fromLines(lines, opt) {
  const o = opt || {}
  const w = world(BASE)
  const v = w.ctx.VELDORA.voice
  if (!v) throw new Error('voice.js did not load')
  const id = o.speaker || 'draft'
  if (o.style && v.setStyle) v.setStyle(id, o.style)
  if (o.colour && v.setColour) v.setColour(id, o.colour)
  // ⚠️ Blanks are dropped BEFORE speaking. lint() has already reported them, and pushing
  // one through the engine adds two more findings for the same defect - a refused send and
  // an empty beat - so one blank line read as three problems.
  for (const text of lines) {
    if (!String(text).trim()) continue
    try { v.speak(w.player, id, String(text), o.tag || 'draft', o.opts || {}) } catch (e) { }
  }
  w.advance(o.ticks || 20000)
  return w
}

function fromGod(god, opt) {
  const files = [...BASE, 'pantheon.js', god + '_voice.js']
  const w = world(files)
  const v = w.ctx.VELDORA.voice
  if (!v || !v.pools) throw new Error('voice.js exposed no pools')
  const pools = v.pools[god] || {}
  // 🔴 30 SECONDS APART, AND THE GAP IS THE POINT. At 2s apart a multi-sentence utterance
  // ran over the next pool and the checker reported 347 beats "replaced after 0.0s" — every
  // one of them manufactured by the driver, not by the pack. Pools are spaced wider than
  // the longest utterance can possibly run, so any overlap found is real.
  let t = 0
  for (const tag of Object.keys(pools)) {
    const at = (t += 600)
    w.server.scheduleInTicks(at, () => { try { v.say(w.player, god, tag) } catch (e) { } })
  }
  w.advance((opt && opt.ticks) || 200000)
  return w
}

function fromScene(name) {
  const s = SCENES[name]
  if (!s) throw new Error('unknown scene: ' + name + ' (have: ' + Object.keys(SCENES).join(', ') + ')')
  const w = world(s.files)
  s.start(w)
  w.advance(s.ticks)
  return w
}

/** Apply every rule to every beat. Failures and warnings stay separate. */
function judge(beats) {
  const findings = [], warnings = []
  for (const b of beats) {
    for (const r of RULES) {
      let msg = null
      try { msg = r.test(b) } catch (e) { msg = 'rule ' + r.id + ' threw: ' + e.message }
      if (!msg) continue
      const hit = { rule: r.id, beat: b.i, at: b.at, text: b.text, why: r.why, detail: msg }
      ;(r.level === 'warn' ? warnings : findings).push(hit)
    }
  }
  return { findings, warnings }
}

/**
 * ⭐ CHECK THE WRITING, NOT THE OUTPUT. Run BEFORE the engine sees the lines.
 *
 * 🔴 THIS IS THE HALF THAT NEARLY DID NOT EXIST. The beat-level one-sentence rule looked
 * like it covered Ethan's hard rule, and it cannot: voice.js splits a two-sentence line
 * into two sends before anything reaches the renderer, so every beat is one sentence by
 * construction. The rule passed its unit test only because the test handed it a beat
 * directly and skipped the engine. Measure at the point of USE.
 */
function lint(lines, ctx) {
  const findings = [], warnings = []
  lines.forEach((line, n) => {
    for (const r of SOURCE_RULES) {
      let msg = null
      try { msg = r.test(line, ctx) } catch (e) { msg = 'rule ' + r.id + ' threw: ' + e.message }
      if (!msg) continue
      const hit = { rule: r.id, line: n + 1, beat: -1, at: 0, text: String(line),
                    why: r.why, detail: msg }
      ;(r.level === 'warn' ? warnings : findings).push(hit)
    }
  })
  return { findings, warnings }
}

/**
 * ⭐ THE WRITING LIMITS, DERIVED FROM THE LOADED CODE. Never written down twice: move
 * screen.js's HOLD.GOD or voice.js's TYPE_CHARS_PER_SEC and every rule that depends on
 * them moves too. A test carrying its own copy of a constant the code owns is how five
 * assertions broke here in one session.
 */
function limitsOf(w) {
  const V = w.ctx.VELDORA
  let cps = 15, holdS = 14.5
  try { cps = V.voice.TYPE_CHARS_PER_SEC || cps } catch (e) { }
  try { holdS = V.screen.HOLD.GOD || holdS } catch (e) { }
  return { cps, holdS, maxChars: Math.floor(cps * holdS) }
}

function verify(input) {
  const inp = Array.isArray(input) ? { lines: input } : (input || {})
  let w, src = { findings: [], warnings: [] }
  if (inp.lines) { w = fromLines(inp.lines, inp); src = lint(inp.lines, limitsOf(w)) }
  else if (inp.god) w = fromGod(inp.god, inp)
  else if (inp.scene) w = fromScene(inp.scene)
  else throw new Error('verify() needs one of: lines, god, scene')

  const beats = timeline(w)
  const judged = judge(beats)
  const findings = src.findings.concat(judged.findings)
  const warnings = src.warnings.concat(judged.warnings)

  // ⚠️ NOTHING RENDERED IS A FAILURE, NOT A PASS. "I ran and found no problems" and "I never
  // ran" must never share a verdict, and an empty timeline is the quietest possible green.
  if (!beats.length) {
    findings.push({
      rule: 'produced-nothing', beat: -1, at: 0, text: '',
      why: 'a run that reaches the renderer with nothing is a failure, not a clean pass',
      detail: 'no beats reached the renderer — the trigger fired but nothing was said',
    })
  }
  return { ok: findings.length === 0, beats, findings, warnings }
}

module.exports = { verify, judge, lint, limitsOf, SCENES, fromLines, fromGod, fromScene }
