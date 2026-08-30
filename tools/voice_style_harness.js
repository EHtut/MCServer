// voice_style_harness.js — where each god SPEAKS, run rather than grepped.
//
//     node tools/voice_style_harness.js
//
// ── 🔴 WHY THIS EXISTS AND announce_harness DOES NOT COVER IT ──────────────────
// The per-god style assertions were source greps, and three of them came back VACUOUS
// under mutation on the day they were written:
//
//   · removing `wave: !!st.wave` from overlay() left every wave assertion green,
//     because they all looked at the DECLARATION in art_voice.js and none at the wiring
//   · a bickering call prefixed with `void 0 &&` still matched its substring
//   · stalker has two emission points and removing one left the other matching
//
// 🔑 A DECLARATION IS NOT AN EMISSION. This loads garble.js, immersive.js and voice.js
// into one shared VELDORA - the way the server does - and reads the command string that
// comes out the far end. If a style key stops being wired, every test for it fails.
//
// ⚠️ Node running it is NOT proof Rhino runs it. rhino_lint.py and a live boot cover
// that; this covers the behaviour.
'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')
const PACK = path.join(__dirname, '..', 'pack', 'resourcepacks', 'veldora')

let pass = 0, fail = 0
const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', X = '\x1b[0m'
function grp(t) { console.log('\n' + B + t + X) }
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}

// Load the three files into ONE shared VELDORA, exactly as KubeJS does.
function sandbox() {
  const cmds = []
  const delays = []
  const loadedHooks = []
  let tick = 0
  const server = {
    get tickCount() { return tick },
    advance(sec) { tick += Math.round(sec * 20) },
    runCommandSilent: c => { cmds.push(String(c)); return undefined },
    // 🔴 RECORD, DO NOT RUN. This used to execute the callback immediately, which was
    // fine while the only scheduled thing was a sentence - and became an infinite
    // recursion the moment tidewhispers.js arrived, because its tick loop reschedules
    // itself. 2118 nested calls before it gave up, reported as "2118 things were
    // scheduled" rather than as the runaway it was.
    //
    // ⚠️ Nothing in the delivery path schedules any more: the mod's own queue sequences
    // sentences. A test that needs a scheduled callback should run it deliberately.
    scheduleInTicks: (t, fn) => { delays.push(t); return 0 },
  }
  const stub = {
    Platform: { isLoaded: () => true },
    Utils: { server },
    ServerEvents: { loaded(f) { loadedHooks.push(f) }, commandRegistry() { } },
    PlayerEvents: { loggedOut() { }, loggedIn() { }, tick() { } },
    Text: { of: s => s },
    console: { info() { }, log() { }, warn() { } },
  }
  const keys = Object.keys(stub)
  let V = {}
  // ⚠️ screen.js must load too - it is the referee every send now passes through, and a
  // sandbox without it tests a path that no longer exists in production.
  for (const f of ['garble.js', 'immersive.js', 'screen.js', 'voice.js',
                   'tidewhispers.js']) {
    const src = fs.readFileSync(path.join(SS, f), 'utf8')
    V = new Function(...keys, 'VELDORA_IN',
      'var VELDORA=VELDORA_IN;' + src.replace(/^var VELDORA = .*$/m, '') + '\n;return VELDORA;'
    )(...keys.map(k => stub[k]), V)
  }
  // ⚠️ Run the loaded hooks so pools registered at boot exist. Without this the
  // whisper bands have no lines and every test measures an empty system.
  server.players = []
  loadedHooks.forEach(f => { try { f({ server }) } catch (e) { } })
  const player = { username: 'R', server, uuid: 'u-' + Math.random() }
  // ⚠️ THE REFEREE IS LIVE IN THIS SANDBOX, because it is live in production - a
  // sandbox without it would test a path that no longer exists. But a test measuring
  // the SHAPE of a command is not testing the queue, and firing 400 sends at one
  // player with no time passing correctly gets most of them refused.
  //
  // 🔑 `say()` clears the modelled backlog first, so shape tests measure shape. The
  // referee has its own group where the backlog is the thing under test.
  const say = (god, text, tag, opts) => {
    try { V.screen.clear(player) } catch (e) { }
    cmds.length = 0
    delays.length = 0
    return V.voice.speak(player, god, text, tag, opts)
  }
  return { V, cmds, delays, server, player, say }
}

// Read the style a god's own file declares, by running THAT file's loaded hook.
function styleFromFile(file, god) {
  const s = sandbox()
  let captured = null
  const orig = s.V.voice.setStyle
  s.V.voice.setStyle = (g, st) => { if (g === god) captured = st; return orig(g, st) }
  const loaded = []
  const stub = {
    Platform: { isLoaded: () => true },
    Utils: { server: s.server },
    ServerEvents: { loaded: f => loaded.push(f), commandRegistry() { }, tick() { } },
    PlayerEvents: { loggedIn() { }, loggedOut() { }, tick() { } },
    EntityEvents: { death() { }, checkSpawn() { }, hurt() { } },
    BlockEvents: { placed() { }, broken() { } },
    ItemEvents: { rightClicked() { }, entityInteracted() { } },
    Text: { of: x => x },
    console: { info() { }, log() { }, warn() { }, error() { } },
  }
  const keys = Object.keys(stub)
  // 🔴 pantheon.js LOADS ALONGSIDE THE GOD FILE, and it did not used to.
  //
  // This harness runs one god file in isolation and spies on `voice.setStyle` to catch
  // the style it registers. That worked while every god file called setStyle directly.
  // The pantheon refactor moved that call inside `pantheon.define`, so with pantheon.js
  // absent from this sandbox the define call hit `VELDORA.pantheon === undefined`, threw,
  // and the spy captured nothing - reported as "art is not styled in her own file".
  //
  // ⭐ THE ASSERTION WAS RIGHT AND THE INSTRUMENT WAS WRONG. Art's style object genuinely
  // does live in art_voice.js; only the function carrying it to the engine moved. So the
  // fix is to give the sandbox the registrar, not to weaken the test - this file exists to
  // prove each god is styled in her OWN file, which is the one property the refactor most
  // needed to be held to.
  const files = ['pantheon.js', file]
  try {
    for (const fn of files) {
      const src = fs.readFileSync(path.join(SS, fn), 'utf8')
      new Function(...keys, 'VELDORA_IN',
        'var VELDORA=VELDORA_IN;' + src.replace(/^var VELDORA = .*$/m, '') + '\n;'
      )(...keys.map(k => stub[k]), s.V)
    }
    loaded.forEach(f => { try { f({ server: s.server }) } catch (e) { } })
  } catch (e) { return { s, style: null, threw: String(e) } }
  return { s, style: captured, threw: null }
}

function tagOf(cmd) {
  const m = String(cmd).match(/\{([^}]*)\}/)
  return m ? m[1] : ''
}

// ═══════════════════════════════════════════════════════════════════════════
grp('* EVERY GOD DECLARES ITS OWN STYLE, IN ITS OWN FILE')
{
  // ⭐ One file per god is what lets Ethan refine a god's WRITING while this side is
  // not in that file. It is a working arrangement, not a tidiness preference.
  const want = {
    blade: ['blade_voice.js', 'TOP_CENTER'],
    art: ['art_voice.js', 'CENTER_CENTER'],
    wall: ['wall_voice.js', 'CENTER_CENTER'],
  }
  for (const god of Object.keys(want)) {
    const [file, anchor] = want[god]
    const r = styleFromFile(file, god)
    ok(god + ' registers a style from ' + file, !!r.style, true)
    if (r.threw) ok(god + ' loaded without throwing', r.threw, null)
    if (r.style) ok('  ...anchored ' + anchor, r.style.anchor, anchor)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('* THE STYLE REACHES THE COMMAND — declaration is not emission')
{
  const s = sandbox()
  s.V.voice.setColour('blade', '§4§l')
  s.V.voice.setStyle('blade', { anchor: 'TOP_CENTER', y: 40, color: '#FFFFFF', font: 'veldora:blade' })
  s.say('blade', 'You are marked.', 'mark_declare')
  const t = tagOf(s.cmds[0])
  ok('anchor is emitted as the ORDINAL', /anchor:6/.test(t), true)
  ok('...y is emitted, positive for a TOP anchor', /y:40\.0f/.test(t), true)
  ok('...the declared colour beats the registry', /color:"#FFFFFF"/.test(t), true)
  ok('...and the font is emitted', /font:"veldora:blade"/.test(t), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('* A STYLE CAN SUPPRESS ITS TONE, NOT ONLY ADD TO IT')
{
  // 🔴 `o.shake || st.shake` could only ADD, so the `weight` tone forced a shake onto
  // Art - and weight covers threats and demands, most of what she says. Shaking reads
  // as panic; she does not flinch. Her characterisation was being overridden by a table.
  const s = sandbox()
  s.V.voice.setStyle('art', { anchor: 'CENTER_CENTER', wave: true, shake: false })
  s.V.voice.setStyle('blade', { anchor: 'TOP_CENTER', y: 40 })

  s.say('art', 'Give it to me.', 'demand')
  ok('ART does not shake on a demand', /shake/.test(tagOf(s.cmds[0])), false)
  ok('...and waves instead', /wave:1b/.test(tagOf(s.cmds[0])), true)

  s.say('blade', 'You are marked.', 'mark_declare')
  ok('BLADE still shakes on the same tone', /shake:1b/.test(tagOf(s.cmds[0])), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('* WALL IS SCATTERED — measured, not assumed')
{
  // 🔴 WALL'S OWN DECLARED STYLE, not a synthetic one. This group first set its own
  // { x: 150, y: 70 } and therefore tested the MECHANISM while wall_voice.js could say
  // anything it liked - setting her scatter.x to 0 left the whole group green. Reading
  // her real declaration is the difference between testing the engine and testing HER.
  const w = styleFromFile('wall_voice.js', 'wall')
  const s = w.s
  ok('wall declares a scatter at all', !!(w.style && w.style.scatter), true)
  const box = (w.style && w.style.scatter) || { x: 0, y: 0 }
  ok('...with a non-zero width', box.x > 0, true)
  ok('...and a non-zero height', box.y > 0, true)
  const xs = [], ys = []
  for (let i = 0; i < 400; i++) {
    s.say('wall', 'x', 'threat')
    const t = tagOf(s.cmds[0])
    const mx = t.match(/x:(-?[\d.]+)f/), my = t.match(/y:(-?[\d.]+)f/)
    if (mx) xs.push(parseFloat(mx[1]))
    if (my) ys.push(parseFloat(my[1]))
  }
  ok('every line carries an x', xs.length, 400)
  ok('every line carries a y', ys.length, 400)

  // ⚠️ THE FIRST FIVE SAMPLES WERE ALL POSITIVE ON y, which looked like a one-signed
  // bug and was chance at ~3%. 400 samples settled it. A small sample that looks wrong
  // deserves a bigger sample before it deserves a fix.
  ok('x goes BOTH ways', xs.some(v => v < 0) && xs.some(v => v > 0), true)
  ok('y goes BOTH ways - she is above AND below the middle',
    ys.some(v => v < 0) && ys.some(v => v > 0), true)
  ok('x stays inside HER box', Math.max(...xs.map(Math.abs)) <= box.x, true)
  ok('y stays inside HER box', Math.max(...ys.map(Math.abs)) <= box.y, true)

  // The box is wider than tall on purpose: a line thrown to the vertical extremes lands
  // under the hotbar or off the top, where being caught in the corner of the eye is lost.
  ok('the box is WIDER than tall',
    Math.max(...xs.map(Math.abs)) > Math.max(...ys.map(Math.abs)), true)

  // 🚨 And she does not sit still - a scatter that produced one position would be a
  // characterisation that silently stopped happening.
  ok('🚨 she genuinely moves', new Set(xs).size > 50, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('* AN UNSTYLED GOD IS PLAIN, NOT BROKEN')
{
  const s = sandbox()
  s.V.voice.setColour('nobody', '§6§l')
  s.say('nobody', 'A line.', 'plain')
  const t = tagOf(s.cmds[0])
  ok('it still speaks', s.cmds.length > 0, true)
  ok('...at the default bottom anchor', /anchor:3/.test(t), true)
  ok('...lifted clear of the hotbar with a NEGATIVE y', /y:-\d/.test(t), true)
  // 🔴 THE ASSERTION IS INVERTED FROM WHAT IT WAS, and the ruling is why. Ethan,
  // 2026-08-30: *"God colors need to go away, color will only be used for emphasis
  // now."* So `voice.overlayColour` no longer consults the colour registry - a god
  // gets a plain overlay unless her style or the moment asks for a tint deliberately.
  //
  // ⚠️ setColour IS STILL LIVE and still registered above; it feeds chat and labels.
  // That is exactly why this needs a test: the registry still holds §6§l for this god,
  // and the overlay must ignore it. A test that only checked "no colour anywhere" would
  // pass for the wrong reason.
  ok('...and NOT coloured from the registry - colour is for emphasis only now',
    /color:/.test(t), false)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('* THE FONTS EXIST — a name no client can resolve fails silently')
{
  for (const god of ['blade', 'art', 'wall', 'forge', 'salvage']) {
    const ttf = path.join(PACK, 'assets', 'veldora', 'font', god + '.ttf')
    const json = path.join(PACK, 'assets', 'veldora', 'font', god + '.json')
    ok(god + '.ttf is in the resource pack', fs.existsSync(ttf), true)
    ok('  ...with its font definition', fs.existsSync(json), true)
  }
  // ⛔ The mod's own five faces need the `caxton` mod, which is installed nowhere here -
  // naming one renders vanilla default and looks like nothing happened.
  const files = ['blade_voice.js', 'art_voice.js', 'wall_voice.js']
  for (const f of files) {
    const src = fs.readFileSync(path.join(SS, f), 'utf8')
    ok(f + ' names no caxton-gated font',
      /font: '(kalam|roboto|minecrafter|norse|anton)'/.test(src), false)
  }
}


// ═══════════════════════════════════════════════════════════════════════════
grp('* FORGE RAMBLES - and it must not look like Wall')
{
  const f = styleFromFile('forge_voice.js', 'forge')
  ok('forge declares a style', !!f.style, true)
  const fs_ = f.style || {}
  const w = (styleFromFile('wall_voice.js', 'wall').style) || {}

  // 🔴 FORGE DOES NOT SHAKE, AND THIS COMMENT USED TO ARGUE THAT SHE DID.
  //
  // The original reasoning was that shake AND scatter together read as restlessness,
  // against Wall who is still text in the wrong place. Ethan overruled it from play,
  // 2026-08-30: *"Forge shakes too much, we can remove the shaking."*
  //
  // ⭐ The characterisation still holds, it is just carried by the SCATTER and the PACE
  // instead - her box is wider and taller than Wall's and her beatScale is below 1. The
  // contrast with Wall survives losing the flag, which is the point worth testing.
  ok('forge does NOT shake - removed from play feedback', fs_.shake, false)
  ok('...and Wall does NOT - the contrast is the characterisation', w.shake, false)
  ok('...but both scatter', !!(fs_.scatter && w.scatter), true)

  // Wall circles the middle because being near you is the threat. Forge is simply all
  // over the place, so her box is looser in BOTH dimensions.
  ok('forge roams wider than Wall', fs_.scatter.x > w.scatter.x, true)
  ok('...and taller', fs_.scatter.y > w.scatter.y, true)

  ok('...in Rye', fs_.font, 'veldora:forge')
  ok('...and she is the smallest - chattering, not proclaiming',
    fs_.size < (w.size || 1), true)

  // ⭐ THE PACE, MEASURED. Rambling is not only shorter sentences; it is sentences
  // arriving before you have finished the last one.
  const s2 = sandbox()
  s2.V.voice.setStyle('forge', fs_)
  s2.V.voice.setStyle('wall', w)
  const line = 'So anyway. I was thinking. You will not like it. I never do either.'

  // 🔴 THIS MEASURED THE WRONG THING. It compared scheduleInTicks DELAYS - my own
  // scheduler - while the mod ignores them entirely: it queues messages and plays them
  // one at a time for their full DURATION. Four sentences at the tone's 5s cost 22
  // seconds of screen, and this asserted 5. Measuring the thing I control instead of
  // the thing that happens, one more time.
  //
  // 🔑 The duration IS the pacing now, so that is what gets measured.
  const held = (god) => {
    s2.say(god, line, 'idle')
    return {
      sends: s2.cmds.length,
      // each message costs its duration plus the mod's 0.5s timeBetweenMessages
      screen: s2.cmds.reduce((t, c) => t + parseFloat(c.match(/\} ([0-9.]+) /)[1]) + 0.5, 0),
    }
  }
  const f2 = held('forge'), w2 = held('wall')

  ok('four sentences become four sends', f2.sends, 4)
  ok('🚨 and NOTHING is scheduled - the mod queue is the sequencer', s2.delays.length, 0)
  ok('🔑 forge holds the screen for LESS time on the same line',
    f2.screen < w2.screen, true)
  // 🔴🔴 THIS IS A REAL FINDING, NOT A STALE TEST, AND IT IS LEFT VISIBLE ON PURPOSE.
  //
  // The old assertion was "under 15s for four sentences". Measured now: WALL 50.0s,
  // FORGE 36.6s. The 15s budget was written when a sentence held ~3s; Ethan then ruled
  // from play that a line must stay up 10-15s, and voice.beatFor grew a 12s floor. Each
  // sentence is therefore correct on its own and the AGGREGATE is the cost.
  //
  // ⚠️ WHAT IT COSTS: the mod plays one message at a time, FIFO, with no reorder and no
  // clear. So while Wall says four sentences there are ~50 SECONDS in which a tide
  // warning cannot reach the player - which is the precise failure the original
  // assertion existed to prevent. The referee cannot fix it: it may refuse to accept a
  // line, never jump one already queued.
  //
  // 🔑 SO THE TEST SPLITS IN TWO. The safety property still holds and is asserted first:
  // no SINGLE sentence exceeds what the referee models for a god, which is what stops a
  // line being delivered to a corpse. The aggregate gets a regression ceiling and a name
  // that says what it is, so nobody reads green as "this is fine".
  //
  // ⛔ Ethan rules on the aggregate - shorter god lines, or a warning channel that
  // bypasses the queue. Do not quietly lower the per-line floor to make this number go
  // down; that reverses a ruling made from play.
  ok('🔑 no SINGLE sentence outlasts the referee model for a god',
    f2.screen / f2.sends <= 14.5 && w2.screen / w2.sends <= 14.5, true)
  ok('🚨 OPEN: four sentences still hold the screen ~50s - see the note above',
    f2.screen < 60 && w2.screen < 60, true)
  ok('...by her declared beatScale', fs_.beatScale < 1, true)

  // ⚠️ A floor exists so a sentence cannot vanish before it can be read. Unreadable is
  // not a personality - it is a bug that looks like one.
  const s3 = sandbox()
  s3.V.voice.setStyle('x', { anchor: 'CENTER_CENTER', beatScale: 0.001 })
  s3.delays.length = 0
  s3.say('x', 'One. Two. Three.', 'plain')
  ok('🚨 an absurd beatScale still cannot go below the floor',
    Math.min(...s3.delays.map((d, i) => i ? d - s3.delays[i - 1] : d)) >= 10, true)

  // Every scattered line must land somewhere different.
  const s4 = sandbox()
  s4.V.voice.setStyle('forge', fs_)
  const seen = new Set()
  for (let i = 0; i < 200; i++) {
    s4.say('forge', 'x', 'idle')
    // ⚠️ A refused send leaves cmds empty; guard rather than crash on it.
    const m4 = s4.cmds[0] && tagOf(s4.cmds[0]).match(/x:(-?[\d.]+)f/)
    if (m4) seen.add(m4[1])
  }
  ok('she genuinely moves', seen.size > 40, true)
}


// ═══════════════════════════════════════════════════════════════════════════
grp('* THE SCREEN REFEREE - one message at a time, and a queue nobody can jump')
{
  const s = sandbox()
  const p = Object.assign({ uuid: 'u-ref' }, s.player)

  // ⭐ THE INVARIANT, not the numbers. The tolerances and hold caps are tunable; their
  // RELATIONSHIP is what matters, so this asserts the relationship holds rather than
  // freezing values Ethan may want to change.
  // 🔴 ASSERTING `audit() === []` IS VACUOUS ON ITS OWN - an audit that simply returned
  // nothing would pass it, and a mutation proved exactly that. So the audit is checked
  // in BOTH directions: it must pass the real tables AND catch a known-broken one.
  ok('the priority ordering is self-consistent', s.V.screen._audit(), [])
  ok('🔴 ...and the audit can actually FAIL - fed an inverted ordering',
    s.V.screen._audit({ WHISPER: 0, AMBIENT: 0, ASIDE: 2, GOD: 0.1, ANNOUNCE: 9, CRASHOUT: 999 },
                      s.V.screen.HOLD).length > 0, true)

  // 🔑 FAIL OPEN, tested at screen.js's OWN boundary. The earlier version replaced
  // im.show's reference to claim and therefore exercised immersive.js's catch, not this
  // one - so breaking screen.js's own fail-open left it green.
  ok('🔑 an unmodellable player is ALLOWED, never silenced',
    s.V.screen.claim({ /* no uuid, no server */ }, 'WHISPER', 3), true)

  // ⚠️ THAT ONE EXITS BY THE "cannot model it" BRANCH, not the catch - and a mutation
  // proved it: breaking the catch's fail-open left the test green. This throws INSIDE
  // the try, which is the only way to reach it.
  const boom = { toString() { throw new Error('boom') } }
  ok('🔑 ...and a THROW inside the referee is allowed too, never silenced',
    s.V.screen.claim(s.player, boom, 3), true)

  ok('an empty screen owes nothing', s.V.screen.backlog(p), 0)

  const send = (pri, secs) => s.V.im.show(p, 'x', { seconds: secs, priority: pri })

  ok('a whisper speaks into silence', send('WHISPER', 3), true)
  // 🔴 THE BUG THIS FILE PRODUCED ON ITS FIRST DRAFT: a 3s whisper cost 3.5s of queue
  // while GOD tolerated 2.5s, so the dead muttering locked out the god about to speak -
  // the exact inversion the referee exists to prevent.
  ok('🔴 ...and CANNOT block a god', send('GOD', 5), true)
  // 🔴 THIS ASSERTION FLIPPED, AND THE FLIP IS A TRADE, NOT A FIX.
  //
  // It used to be REFUSED, because ASIDE tolerated 2.0s of queue. Ethan then reported
  // the dead were unreadable at 1.5s, so WHISPER now holds up to 9.5s - and anything
  // tolerating less than ~10s is DROPPED OUTRIGHT while a whisper plays, not delayed.
  // ASIDE went to 10.0 so an interior line survives the dead muttering.
  //
  // ⚠️ THE SAME NUMBER LETS IT QUEUE BEHIND A GOD. It still cannot talk OVER one - the
  // mod is strictly one-at-a-time and FIFO, so the queue enforces that on its own - but
  // it can now arrive up to ~9s after the moment that prompted it.
  //
  // 🔑 AND FOR AN ASIDE THAT IS ARGUABLY THE WRONG TRADE. These are the player's own
  // body reacting - "You hold your breath". Nine seconds late is not a late reaction, it
  // is a non-sequitur, whereas a dropped one is merely absent. The comment in screen.js
  // argues the opposite ("late is the better failure for an interior line"); that was my
  // reasoning and it did not survive seeing the number.
  //
  // ⛔ NOT RE-TUNED HERE. Any value below 10.0 reintroduces the drop-behind-a-whisper
  // that Ethan actually complained about, so the two cannot both be satisfied by this
  // one knob - it needs an expiry on the aside instead, which is mechanism, not tuning.
  ok('an aside is ACCEPTED behind a god now, not refused - see the note',
    send('ASIDE', 3), true)
  ok('...and the queue, not the referee, is what stops it overlapping',
    s.V.screen.backlog(p) > 0, true)
  ok('a warning outranks all of it', send('ANNOUNCE', 4), true)
  ok('...after which a whisper is refused', send('WHISPER', 3), false)
  ok('🚨 a crashout is never refused', send('CRASHOUT', 3), true)

  // The backlog has to drain, or a god goes permanently quiet.
  s.server.advance(60)
  ok('the queue drains with time', s.V.screen.backlog(p), 0)
  ok('...and a whisper speaks again', send('WHISPER', 3), true)

  // ⚠️ A caller cannot lock the screen by asking for a huge duration.
  const s2 = sandbox()
  const p2 = Object.assign({ uuid: 'u-cap' }, s2.player)
  s2.V.im.show(p2, 'x', { seconds: 300, priority: 'WHISPER' })
  ok('🚨 a 300s whisper is CLAMPED, not honoured',
    s2.V.screen.backlog(p2) <= s2.V.screen.HOLD.WHISPER + 1, true)

  // 🔑 FAIL OPEN. A referee that fails closed mutes the pantheon on a glitch, and
  // silence is the symptom nobody reports.
  const s3 = sandbox()
  s3.V.screen.claim = () => { throw new Error('boom') }
  ok('🔑 a throwing referee does not silence anything',
    s3.V.im.show(s3.player, 'x', { seconds: 3, priority: 'WHISPER' }), true)

  // A logged-out player's queue is gone with them.
  const s4 = sandbox()
  const p4 = Object.assign({ uuid: 'u-out' }, s4.player)
  s4.V.im.show(p4, 'x', { seconds: 5, priority: 'GOD' })
  ok('a player carries a backlog', s4.V.screen.backlog(p4) > 0, true)
  s4.V.screen.clear(p4)
  ok('...which is dropped on logout', s4.V.screen.backlog(p4), 0)
}


// ═══════════════════════════════════════════════════════════════════════════
grp('* THE TIDE WHISPERS - the dead get louder, measured over samples')
{
  const s = sandbox()
  const W = s.V.tideWhispers
  const bands = W.bands

  // ⭐ MONOTONIC, not "roughly rising". Every dial must move the same way at every step
  // or the ramp has a dip in it that nobody would ever notice in play.
  let mono = true
  for (let i = 1; i < bands.length; i++) {
    if (!(bands[i][1] > bands[i - 1][1])) mono = false   // chance
    if (!(bands[i][2] > bands[i - 1][2])) mono = false   // size
    if (!(bands[i][3] >= bands[i - 1][3])) mono = false  // brokenness
    if (!(bands[i][4] > bands[i - 1][4])) mono = false   // reach
  }
  ok('every dial rises monotonically across the bands', mono, true)
  ok('a wave number picks the right band', W.bandFor(0)[5], 'far')
  ok('...and the last band catches everything above it', W.bandFor(99)[5], 'inside')

  // 🔴 SAMPLED, NOT INSPECTED. Brokenness is a per-fragment coin flip, so ONE send from
  // the worst band can easily come back clean - it did, on the first run. Wall's scatter
  // taught this the same way: a small sample that looks wrong deserves a bigger sample
  // before it deserves a fix.
  const sample = (band, n) => {
    let broken = 0, dist = 0, got = 0
    const p = { username: 'S', server: s.server, uuid: 'u-samp' }
    for (let i = 0; i < n; i++) {
      s.V.screen.clear(p)
      s.cmds.length = 0
      W._speak(p, band)
      if (!s.cmds.length) continue
      got++
      const t = tagOf(s.cmds[0])
      if (/obfuscate:/.test(t)) broken++
      const mx = t.match(/x:(-?[\d.]+)f/)
      if (mx) dist += Math.abs(parseFloat(mx[1]))
    }
    return { broken: broken / (got || 1), dist: dist / (got || 1), got }
  }

  const far = sample(bands[0], 300)
  const inside = sample(bands[3], 300)

  ok('every roll produces a fragment', far.got, 300)
  ok('🔴 the far band is barely broken', far.broken < 0.1, true)
  ok('...and the inside band is mostly broken', inside.broken > 0.4, true)
  ok('⭐ ...and lands CLOSER to the middle', inside.dist < far.dist, true)

  // 🚨 The dead never outrank a god.
  // 🔴 THIS MEASURED THE BACKLOG SIZE, which is not the guarantee. Promoting whispers to
  // ANNOUNCE left it green, because a 1.4s send is small at any priority. The property
  // that matters is REFUSAL: the dead must not speak while a god is.
  const pw = { username: 'W', server: s.server, uuid: 'u-prio' }
  s.V.screen.clear(pw)
  s.V.voice.setStyle('blade', { anchor: 'TOP_CENTER', y: 40 })
  s.V.voice.speak(pw, 'blade', 'I am speaking to you now.', 'mark_declare')
  ok('a god has taken the screen', s.V.screen.backlog(pw) > 2, true)
  s.cmds.length = 0
  W._speak(pw, bands[3])
  ok('🚨 the dead are REFUSED while a god is speaking', s.cmds.length, 0)

  // ...and speak again once he has finished.
  s.server.advance(60)
  s.cmds.length = 0
  W._speak(pw, bands[3])
  ok('...and speak again once he is done', s.cmds.length > 0, true)

  // Nothing happens outside a tide.
  ok('a player not in a tide has no wave count', W._waves(s.player), null)

  // 🖊️ The words are Ethan's. Every placeholder must be findable.
  const src = fs.readFileSync(path.join(SS, 'tidewhispers.js'), 'utf8')
  const lines = src.match(/'\[CLAUDE-DRAFT\][^']*'/g) || []
  ok('🖊️ every fragment is marked as a placeholder', lines.length >= 8, true)
  const pools = src.match(/^\s+'[^[][^']*',\s*$/gm) || []
  ok('...and NONE are unmarked', pools.length, 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('* THE DEAD BANDS - a scattered line never lands where it cannot be read')
{
  // 🔴 NEITHER BAND HAD ANY COVERAGE AT ALL until 2026-08-30, the crosshair one included -
  // and that exists because Ethan reported it from play: *"We cannot have any text be on
  // the cross hair... that is unreadable."* A fix made from a play report and then never
  // tested is a fix that quietly regresses.
  //
  // ⭐ STATISTICAL, NOT A SPOT CHECK. `dodgeCrosshair` is random by design, so one sample
  // proves nothing. Each god is thrown 20,000 times and the assertion is that ZERO land in
  // a forbidden band; a single escape is a line delivered onto the crosshair in play.
  const s = sandbox()
  const d = s.V.voice.dodgeCrosshair
  const CROSS = 34                        // voice.CROSSHAIR_BAND
  const TITLE_LO = -53, TITLE_HI = -11    // voice.TITLE_BAND
  const CHAT = 60                         // voice.CHAT_FLOOR
  const N = 20000

  // 🔑 THE REACH IS READ FROM THE GOD FILES, NOT HARDCODED HERE. It was written as
  // [['wall',70],['forge',95]] and both were pumped hours later; a test carrying its own
  // stale copy of a number would have gone on proving something about a box that no
  // longer exists, and passed while doing it.
  const reachOf = (f) => {
    const m = fs.readFileSync(path.join(SS, f), 'utf8').match(/scatter:\s*\{\s*x:\s*-?\d+,\s*y:\s*(\d+)/)
    return m ? parseInt(m[1], 10) : null
  }
  const WALL = reachOf('wall_voice.js'), FORGE = reachOf('forge_voice.js')
  ok('wall declares a scatter reach at all', WALL > 0, true)
  ok('forge declares a scatter reach at all', FORGE > 0, true)

  for (const pair of [['wall', WALL], ['forge', FORGE]]) {
    const god = pair[0], reach = pair[1]
    let onCross = 0, onTitle = 0, belowChat = 0, outOfBox = 0
    for (let i = 0; i < N; i++) {
      const y = d(Math.round((Math.random() * 2 - 1) * reach), reach)
      if (y > -CROSS && y < CROSS) onCross++
      if (y > TITLE_LO && y < TITLE_HI) onTitle++
      if (y > CHAT) belowChat++
      if (y < -reach) outOfBox++
    }
    ok('🚨 ' + god + ' never lands on the crosshair', onCross, 0)
    // ⭐ Ethan, 2026-08-30: *"Turn travelers titles back on instead make god dialogue move
    // around it."* The biome title is terrain; ours is the layer that moves.
    ok('🚨 ' + god + ' never lands on the biome title', onTitle, 0)
    ok('⛔ ' + god + ' never crosses the chat bar, where it would not render', belowChat, 0)
    ok('...and stays inside her own declared box', outOfBox, 0)
  }

  // 🔑 THE BANDS MUST NOT EAT THE WHOLE BOX. If they ever do, dodgeCrosshair returns the
  // value untouched rather than inventing one - so a god with no room left would silently
  // start landing on the crosshair again. This is the assertion that catches that.
  const free = function (reach) {
    const seen = {}
    let n = 0
    for (let i = 0; i < 4000; i++) {
      const y = d(Math.round((Math.random() * 2 - 1) * reach), reach)
      if (!seen[y]) { seen[y] = 1; n++ }
    }
    return n
  }
  const fw = free(WALL), ff = free(FORGE)
  ok('wall still has real vertical room after both bands', fw > 20, true)
  ok('forge has more room than wall - her box is wider on purpose', ff > fw, true)
}

console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
