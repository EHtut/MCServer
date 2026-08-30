// immersive_harness.js — the command the shim ACTUALLY builds, run rather than grepped.
//
//     node tools/immersive_harness.js
//
// ── 🔴 WHY THIS FILE EXISTS ────────────────────────────────────────────────────
// The first immersive.js reached the mod reflectively. Its harness asserted things like
// `im.indexOf("'toni.immersivemessages.api.ImmersiveMessage'") !== -1` — the class name
// APPEARS IN THE FILE, so it passed. On the 2026-08-30 00:11 boot all three reflective
// routes failed and every send died. The harness had been green the whole time.
//
// 🔑 A substring match proves a string was TYPED. It proves nothing about what runs.
// So this harness EXECUTES immersive.js against stubs and reads the command string it
// hands to the server — measure at the point of use, which is the standing rule in
// CLAUDE.md and the one that keeps getting relearned.
//
// ⚠️ Node running it is NOT proof Rhino runs it — `node --check` has passed code Rhino
// rejected before. rhino_lint.py plus a live boot cover that. This covers the LOGIC.
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

// Loads immersive.js for real, with every KubeJS global stubbed, and captures every
// command it tries to run.
function sandbox() {
  const src = fs.readFileSync(path.join(SS, 'immersive.js'), 'utf8')
  const cmds = []
  const warns = []
  // 🔴 THE LIVE BUILD RETURNS `undefined` FROM runCommandSilent, not the 1 the mod's
  // handler ends with. The stub returned 1 and the harness therefore exercised a branch
  // that never runs in production - the same "measure at the point of use" error, this
  // time inside the instrument. The default now MATCHES LIVE; a numeric return is the
  // special case and gets its own test.
  const server = { runCommandSilent: function (c) { cmds.push(String(c)); return undefined } }
  const stub = {
    Platform: { isLoaded: function () { return true } },
    Utils: { server: server },
    ServerEvents: { loaded: function () { }, commandRegistry: function () { } },
    Text: { of: function (s) { return s } },
    console: { info: function () { }, log: function () { }, warn: function (m) { warns.push(String(m)) } },
  }
  const keys = Object.keys(stub)
  const fn = new Function(...keys, src + '\n;return VELDORA;')
  const V = fn(...keys.map(k => stub[k]))
  const player = { username: 'Lehykt', server: server }
  return { im: V.im, player, cmds, warns, stub, server }
}

function last(s) { return s.cmds[s.cmds.length - 1] }

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ IT LOADS AND SPEAKS THE COMMAND')
{
  const s = sandbox()
  ok('the shim loads and exposes show()', typeof s.im.show, 'function')
  ok('...and reports itself available when the mod is loaded', s.im.available(), true)

  s.im.show(s.player, 'The tide is rising.', { anchor: 'TOP_CENTER', seconds: 4 })
  ok('one command was issued', s.cmds.length, 1)
  ok('⭐ it is sendcustom, not send', last(s).indexOf('sendcustom') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 THE TWO THINGS THAT WOULD HAVE FAILED SILENTLY')
{
  const s = sandbox()
  s.im.show(s.player, 'The tide is rising.', { anchor: 'TOP_CENTER', seconds: 4 })
  const c = last(s)

  // 🔴 `anchor` is getInt — the ORDINAL. Sending the NAME makes getInt read 0, which is
  // CENTER_CENTER, so every god line would have landed dead centre and looked deliberate.
  // Nothing would have errored. Nothing would have logged.
  ok('⭐ TOP_CENTER is sent as ordinal 6', c.indexOf('anchor:6') !== -1, true)
  ok('⛔ ...and the NAME never reaches the tag', c.indexOf('TOP_CENTER') === -1, true)

  // 🔴 THE ARGUMENT ORDER. Four rounds of live probing failed with "Expected '{'"
  // because every other Minecraft command puts the value args before the tag. This one
  // does not: <player> <nbt> <duration> <text...>.
  ok('⭐ the NBT comes SECOND, before the duration',
    /^immersivemessages sendcustom Lehykt \{[^}]*\} [0-9.]+ The tide is rising\.$/.test(c), true)

  // 🔴 THE ASSERTION THAT WAS HERE REQUIRED `4.0f` AND WENT GREEN ON A BROKEN COMMAND.
  // Every /im test failed live with "Expected whitespace to end one argument, but found
  // trailing data" — the duration is a Brigadier FloatArgumentType, which rejects the
  // suffix. `4.0f` is correct SNBT and wrong here; two parsers, one helper, one bug.
  ok('🚨 the DURATION carries no `f` suffix - Brigadier rejects it',
    /\} 4\.0 The/.test(c), true)
  ok('⛔ ...and specifically is not 4.0f', c.indexOf('4.0f') === -1, true)

  // ⭐ But the tag floats MUST keep it - inside the NBT the suffix is what makes a float.
  const withFloats = s.im._buildTag({ size: 1.5, y: 40, fadein: 0.25 }, null)
  ok('⭐ tag floats DO keep the suffix', /size:1\.5f/.test(withFloats), true)
  ok('...y too', /y:40\.0f/.test(withFloats), true)
  ok('...and fadein too', /fadein:0\.25f/.test(withFloats), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⚠️ PRESENCE-ONLY KEYS — the value is never read')
{
  const s = sandbox()
  s.im.show(s.player, 'x', {})
  ok('🚨 shake is ABSENT when not asked for', last(s).indexOf('shake') === -1, true)

  s.im.show(s.player, 'x', { shake: true })
  ok('⭐ ...and a bare flag when it is', last(s).indexOf('shake:1b') !== -1, true)

  // `shake:0b` still shakes — the mod only checks contains(). So "off" must mean the key
  // is gone, never the key set false.
  s.im.show(s.player, 'x', { shake: false, typewriter: false })
  ok('🚨 a false flag is omitted, never emitted as false',
    last(s).indexOf('shake') === -1 && last(s).indexOf('typewriter') === -1, true)

  s.im.show(s.player, 'x', { typewriter: true })
  ok('⭐ typewriter is a flag, not the float the Java builder took',
    last(s).indexOf('typewriter:1b') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ COLOUR — § codes would render as literal characters')
{
  const s = sandbox()
  s.im.show(s.player, '§9I have a deal for you.', { anchor: 'BOTTOM_CENTER' })
  const c = last(s)
  ok('⭐ the leading § code becomes a real hex colour',
    c.indexOf('color:"#5555FF"') !== -1, true)
  ok('🚨 ...and no § survives into the body', c.indexOf('§') === -1, true)
  ok('...and the words are intact', /I have a deal for you\.$/.test(c), true)
  ok('...and BOTTOM_CENTER is ordinal 3', c.indexOf('anchor:3') !== -1, true)

  // An explicit colour must win over one sniffed out of the text.
  s.im.show(s.player, '§9blue text', { color: '#FF0000' })
  ok('⭐ an explicit colour beats the sniffed one',
    last(s).indexOf('color:"#FF0000"') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE ENUM ORDINALS — read out of the jar, not guessed')
{
  const s = sandbox()
  ok('CENTER_CENTER is 0', s.im.anchors.CENTER_CENTER, 0)
  ok('BOTTOM_CENTER is 3', s.im.anchors.BOTTOM_CENTER, 3)
  ok('TOP_CENTER is 6', s.im.anchors.TOP_CENTER, 6)
  ok('TOP_LEFT is 7', s.im.anchors.TOP_LEFT, 7)

  ok('⭐ obfuscate RANDOM is ordinal 5',
    s.im._buildTag({ obfuscate: 'RANDOM' }, null).indexOf('obfuscate:5') !== -1, true)
  // 🚨 NONE is 0, and 0 is also "key absent" to the mod. Emitting it would be noise that
  // reads as configuration.
  ok('🚨 obfuscate NONE is omitted entirely, not sent as 0',
    s.im._buildTag({ obfuscate: 'NONE' }, null).indexOf('obfuscate') === -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 THE TEXT ARGUMENT IS GREEDY TO END OF LINE')
{
  const s = sandbox()
  s.im.show(s.player, 'first\nsecond', {})
  ok('🚨 a newline cannot truncate the message', /first second$/.test(last(s)), true)

  s.im.show(s.player, '   padded   ', {})
  ok('...and the body is trimmed', /\} [0-9.]+ padded$/.test(last(s)), true)

  ok('an empty body is refused rather than sent', s.im.show(s.player, '§c', {}), false)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 THE FALLBACK CONTRACT — "I failed" and "I found nothing" are different')
{
  // The handler ends `iconst_1; ireturn`, so 0 is a REAL failure and the caller MUST
  // fall back to its bossbar. If this ever returned true on a 0, every god line would
  // silently stop appearing and nothing would say so.
  // ⭐ THE LIVE CONTRACT. KubeJS hands back `undefined` on this build, so per-send
  // failure detection is genuinely unavailable. Reporting false there made every
  // SUCCESSFUL send look failed and every caller render twice.
  const live = sandbox()
  ok('⭐ an undefined return counts as sent, not failed',
    live.im.show(live.player, 'x', {}), true)
  ok('🚨 ...and the weakened contract is stated ONCE, loudly',
    live.warns.filter(w => w.indexOf('per-send failure detection is UNAVAILABLE') !== -1).length, 1)
  live.im.show(live.player, 'y', {})
  ok('...and not repeated on every send',
    live.warns.filter(w => w.indexOf('per-send failure detection is UNAVAILABLE') !== -1).length, 1)

  // Where the build DOES return a number, 0 must still mean fall back.
  const dead = sandbox()
  dead.server.runCommandSilent = function () { return 0 }
  ok('🚨 a numeric 0 still reports FALSE so the caller falls back',
    dead.im.show(dead.player, 'x', {}), false)
  ok('⭐ ...and it is LOGGED, not swallowed',
    dead.warns.some(w => w.indexOf('sendcustom returned 0') !== -1), true)

  const good = sandbox()
  good.server.runCommandSilent = function () { return 1 }
  ok('⭐ a numeric 1 reports TRUE', good.im.show(good.player, 'x', {}), true)

  const thrower = sandbox()
  thrower.server.runCommandSilent = function () { throw new Error('boom') }
  ok('🚨 a throwing send returns false rather than killing the caller',
    thrower.im.show(thrower.player, 'x', {}), false)
  ok('⭐ ...and that is logged too',
    thrower.warns.some(w => w.indexOf('show threw') !== -1), true)

  // A player with no resolvable name must not produce a malformed command.
  const s = sandbox()
  ok('🚨 an unnameable player is refused, not sent as undefined',
    s.im.show({ server: s.server }, 'x', {}), false)
  ok('...and nothing was issued', s.cmds.length, 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⛔ THE DEAD REFLECTIVE ROUTE MUST NOT COME BACK')
{
  // Comments stripped — the header EXPLAINS the reflective failure at length, and an
  // unanchored indexOf would match the prose and pass forever.
  const raw = fs.readFileSync(path.join(SS, 'immersive.js'), 'utf8')
  let im = '', i = 0
  while (i < raw.length) {
    const c = raw[i], n = raw[i + 1]
    if (c === '/' && n === '/') { const j = raw.indexOf('\n', i); i = j < 0 ? raw.length : j }
    else if (c === '/' && n === '*') { const j = raw.indexOf('*/', i + 2); i = j < 0 ? raw.length : j + 2 }
    else { im += c; i++ }
  }
  ok('⛔ Java.loadClass is gone from the code', im.indexOf('Java.loadClass') === -1, true)
  ok('⛔ Java.type is gone from the code', im.indexOf('Java.type') === -1, true)
  ok('⛔ Packages. is gone from the code', im.indexOf('Packages.') === -1, true)
  ok('⭐ and the command route is what remains', im.indexOf('sendcustom') !== -1, true)

  // 🚨 The header is the only record of WHY reflection is banned here. If someone
  // deletes it, the next agent will helpfully add reflection back.
  ok('🚨 the header still warns the next agent off it',
    raw.indexOf('DO NOT re-attempt reflection') !== -1, true)
}


// -------------------------------------------------------------------------
grp('* FADEIN AND FADEOUT ARE MUTUALLY EXCLUSIVE IN THE MOD')
{
  // The command handler is an if / else-if / else, NOT two independent ifs:
  //
  //   if contains("fadein")       -> fadeIn(x);  GOTO END   <- skips fadeout
  //   else if contains("fadeout") -> fadeOut(x); GOTO END
  //   else                        -> fadeIn(); fadeOut()    <- both, paired
  //
  // Sending BOTH silently drops the second, leaving a message with a fade-in and NO
  // fade-out configured. Every /gd line typed itself out and vanished after about a
  // second because of it, while every line that sent NEITHER key stayed up for its
  // full duration - those were landing in the `else` and getting paired defaults.
  const s = sandbox()

  ok('sending BOTH emits NEITHER, rather than half-honouring it',
    /fade/.test(s.im._buildTag({ fadein: 0.5, fadeout: 0.5 }, null)), false)
  ok('...and it says so, once, loudly',
    (function () {
      const t = sandbox()
      t.im._buildTag({ fadein: 0.5, fadeout: 0.5 }, null)
      return t.warns.some(w => w.indexOf('else-if chain') !== -1)
    })(), true)

  ok('fadein ALONE is still honoured',
    /fadein:0\.5f/.test(s.im._buildTag({ fadein: 0.5 }, null)), true)
  ok('fadeout ALONE is still honoured',
    /fadeout:2\.0f/.test(s.im._buildTag({ fadeout: 2 }, null)), true)

  // The default path is what every WORKING line used.
  ok('the default sends no fade key at all, so the mod pairs its own',
    /fade/.test(s.im._buildTag({ anchor: 'BOTTOM_CENTER' }, null)), false)

  // And the god overlay must sit on that default.
  const vo = fs.readFileSync(path.join(SS, 'voice.js'), 'utf8')
  ok('the god overlay no longer forces a fade', /fade: true/.test(vo), false)
}

console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
