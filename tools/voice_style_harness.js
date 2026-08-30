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
  const server = {
    runCommandSilent: c => { cmds.push(String(c)); return undefined },
    // Sentences are scheduled; run them immediately so a whole line is captured.
    scheduleInTicks: (t, fn) => fn(),
  }
  const stub = {
    Platform: { isLoaded: () => true },
    Utils: { server },
    ServerEvents: { loaded() { }, commandRegistry() { } },
    Text: { of: s => s },
    console: { info() { }, log() { }, warn() { } },
  }
  const keys = Object.keys(stub)
  let V = {}
  for (const f of ['garble.js', 'immersive.js', 'voice.js']) {
    const src = fs.readFileSync(path.join(SS, f), 'utf8')
    V = new Function(...keys, 'VELDORA_IN',
      'var VELDORA=VELDORA_IN;' + src.replace(/^var VELDORA = .*$/m, '') + '\n;return VELDORA;'
    )(...keys.map(k => stub[k]), V)
  }
  return { V, cmds, server, player: { username: 'R', server } }
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
  const src = fs.readFileSync(path.join(SS, file), 'utf8')
  try {
    new Function(...keys, 'VELDORA_IN',
      'var VELDORA=VELDORA_IN;' + src.replace(/^var VELDORA = .*$/m, '') + '\n;'
    )(...keys.map(k => stub[k]), s.V)
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
  s.cmds.length = 0
  s.V.voice.speak(s.player, 'blade', 'You are marked.', 'mark_declare')
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

  s.cmds.length = 0
  s.V.voice.speak(s.player, 'art', 'Give it to me.', 'demand')
  ok('ART does not shake on a demand', /shake/.test(tagOf(s.cmds[0])), false)
  ok('...and waves instead', /wave:1b/.test(tagOf(s.cmds[0])), true)

  s.cmds.length = 0
  s.V.voice.speak(s.player, 'blade', 'You are marked.', 'mark_declare')
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
    s.cmds.length = 0
    s.V.voice.speak(s.player, 'wall', 'x', 'threat')
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
  s.cmds.length = 0
  s.V.voice.speak(s.player, 'nobody', 'A line.', 'plain')
  const t = tagOf(s.cmds[0])
  ok('it still speaks', s.cmds.length > 0, true)
  ok('...at the default bottom anchor', /anchor:3/.test(t), true)
  ok('...lifted clear of the hotbar with a NEGATIVE y', /y:-\d/.test(t), true)
  ok('...and coloured from the REGISTRY, since garble.strip removes the codes first',
    /color:"#FFAA00"/.test(t), true)
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

console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
