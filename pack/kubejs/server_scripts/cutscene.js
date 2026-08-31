// cutscene.js — the general "play a scene at somebody" tool.
//
// ⭐ THE ARC THIS BELONGS TO. Ethan, 2026-08-30: *"we turn them from dedicated functions
// into tools"* — these systems become the open-source way to build stories and acts under
// Arkhdottir: New Bloods. This is the first of them.
//
// ── ⭐ WHAT A CUTSCENE IS HERE ───────────────────────────────────────────────
// Take the world away from one player, say a number of things at them, optionally ask a
// question, give the world back. That is a general primitive: it knows nothing about gods,
// tides, paths, patrons or trust. Those are the CALLER's vocabulary.
//
//     VELDORA.cutscene.play(player, {
//       lines:   ['You were a traveler.', 'A life of adventure before you.'],
//       staging: { anchor: 'TOP_LEFT', align: 0, x: 20, y: 110, typewriter: true },
//       pacing:  { perChar: true },
//       finale:  { popup: true, title: 'ACT ONE', subtitle: 'A new day' },
//     })
//
// ── 🔴 WHY THIS IS A FACADE AND NOT A REWRITE, WHICH IS A DELIBERATE DEVIATION ──
// The brief said to move the implementation here and leave `ritual.js` a thin adapter.
// It is NOT done that way, and the reason matters more than the instruction:
//
//   · docs/80's own finding is that ritual.js is ALREADY general - 624 lines with SIX
//     Veldora mentions, all cosmetic, and zero references to paths/counter/tide/pantheon.
//     There is no Veldora logic in it to extract. The coupling was never there.
//   · Moving working scene code while Ethan is asleep and cannot test buys nothing and
//     risks the one failure mode this project keeps paying for - a change that looks
//     right, passes a sandbox suite, and is wrong in play. Yesterday cost a session to
//     exactly that.
//
// ⇒ So the VALUE this file adds is the part that was genuinely missing: a documented
//   vocabulary a stranger can read, defaults they do not have to know Veldora to pick,
//   and a VALIDATOR. The implementation stays where it is, working.
//
// ── 🚨 THE VALIDATOR IS THE POINT ───────────────────────────────────────────
// Yesterday `ritualOverlay` forwarded `seconds`, `anchor`, `align` and `typewriter` and
// SILENTLY DROPPED `x` and `y`. The Opening was moved off the Serene Seasons HUD three
// times - 30, then 60, then 110 - and every one was discarded at that boundary. It looked
// like the deploys were not landing.
//
// 🔑 A pass-through that quietly omits a field is worse than one that errors: the caller
// cannot tell "ignored" from "applied and wrong", so the same fix gets made again and
// again against a seam that never carried it. `play()` REFUSES a key it cannot deliver
// and says which. That single rule would have saved three rounds.
//
// ── ⚠️ WHAT THE RENDERER CAN ACTUALLY DO ────────────────────────────────────
// Read the capability block at the top of immersive.js before designing any scene. It is
// a night of failures compressed into thirty lines, all MEASURED against a live client:
//
//     one command = ONE LINE          there is no multi-line message
//     escaped newline                 renders literally, as backslash-n
//     a real newline                  renders as an LF glyph box, and dropped the
//                                     player's connection with a protocol error
//     maxWidth                        a real field, and ignored
//     subtext                         real, recursive, and BUILDER-ONLY - unreachable
//                                     from Rhino (D-123)
//     popup                           the ONLY command route to a second line
//
// ⇒ CONSEQUENCE FOR EVERY SCENE: lines arrive one at a time, each REPLACING the last.
//   Nothing accumulates on screen. Do not design a scene that needs two lines visible at
//   once; it cannot be built on this renderer.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[cutscene] '

  // ⭐ THE DEFAULTS A STRANGER SHOULD NOT HAVE TO GUESS. These are Veldora's numbers,
  // shipped as a named preset rather than buried as constants, so another project can
  // read them, keep them, or replace them wholesale.
  var PRESETS = {
    // A scene where somebody is speaking TO the player and the world is gone.
    monologue: {
      staging: { anchor: 'CENTER_CENTER', typewriter: true },
      pacing: { perChar: true },
    },
    // A written entry - a journal, a letter, an act boundary. Hangs from the top-left
    // and reads down.
    //
    // ⚠️ y is 110 because this client draws a Serene Seasons readout at the top left and
    // anything above that lands on it. THAT NUMBER IS LOCAL - see the geometry note below.
    journal: {
      staging: { anchor: 'TOP_LEFT', align: 0, x: 20, y: 110, typewriter: true },
      pacing: { perChar: true },
    },
  }

  // 🔴 SCREEN GEOMETRY IS THE DANGEROUS SEAM FOR ANY CONSUMER, and docs/80 named it the
  // highest risk in the codebase. Keep-out bands encode THIS client's HUD: the crosshair,
  // the chat bar that swallows anything overlapping it, a biome-title band belonging to a
  // mod we do not own.
  //
  // ⚠️ A hardcoded god name is embarrassing. A hardcoded keep-out band is WRONG ON
  // SOMEBODY ELSE'S SCREEN AND THEY CANNOT TELL WHY. Declared here so a project can state
  // its own; the dodge algorithm in voice.js is already general, only the numbers are local.
  var GEOMETRY = {
    note: 'local to this client - override per project',
    hudTopLeft: 110,        // clears the Serene Seasons readout
    chatFloor: 60,          // below this, the chat bar eats the text entirely
  }

  // Every key `play()` knows how to deliver, and where each one goes. ⚠️ Anything not in
  // here is REFUSED rather than dropped - see the note at the top of the file.
  var STAGING_KEYS = ['anchor', 'align', 'x', 'y', 'colour', 'typewriter', 'multiline', 'chat']
  var PACING_KEYS = ['gap', 'perChar', 'timeout', 'holdAfterChoice']
  var FINALE_KEYS = ['popup', 'title', 'subtitle', 'text', 'anchor', 'size', 'seconds', 'after']

  function unknownKeys(obj, allowed) {
    var bad = []
    for (var k in (obj || {})) {
      if (!obj.hasOwnProperty(k)) continue
      if (allowed.indexOf(k) === -1) bad.push(k)
    }
    return bad
  }

  /**
   * Play a scene at one player.
   *
   * scene = {
   *   lines:   [string]    what is said, one line per message (see the renderer note)
   *   preset:  string      'monologue' | 'journal' - defaults applied under your values
   *   staging: {}          anchor align x y colour typewriter multiline chat
   *   pacing:  {}          gap perChar timeout holdAfterChoice
   *   finale:  {}          a closing card - popup title subtitle, or text/anchor/size
   *   choices: {}          options onChoose onTimeout
   * }
   *
   * Returns true if the scene started. ⚠️ FALSE MEANS IT DID NOT PLAY - the player may
   * already be in one. Never treat it as fire-and-forget: opening.js un-stamps its
   * "seen" flag on a false so the scene is not lost forever.
   */
  function play(player, scene) {
    if (!player || !scene) return false
    scene = scene || {}

    var lines = scene.lines || []
    if (!lines.length) {
      console.warn(TAG + 'refused: a scene with no lines')
      return false
    }

    // 🚨 REFUSE WHAT WE CANNOT DELIVER. This is the whole reason the file exists.
    var badStaging = unknownKeys(scene.staging, STAGING_KEYS)
    var badPacing = unknownKeys(scene.pacing, PACING_KEYS)
    var badFinale = unknownKeys(scene.finale, FINALE_KEYS)
    if (badStaging.length || badPacing.length || badFinale.length) {
      console.error(TAG + 'REFUSED - keys this tool cannot deliver: ' +
        badStaging.concat(badPacing).concat(badFinale).join(', ') +
        '. Silently ignoring them is how three fixes to the same value were lost.')
      return false
    }

    var preset = PRESETS[scene.preset] || {}
    var st = merge(preset.staging, scene.staging)
    var pa = merge(preset.pacing, scene.pacing)
    var ch = scene.choices || {}

    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') {
      console.error(TAG + 'ritual.js is not loaded - no scene can play')
      return false
    }

    // The translation. ⚠️ Every key here is one ritual.begin actually reads; adding a key
    // to STAGING_KEYS without adding it here would reintroduce the silent-drop bug.
    return VELDORA.ritual.begin(player, {
      lines: lines,
      anchor: st.anchor,
      align: st.align,
      x: st.x,
      y: st.y,
      colour: (st.colour === undefined) ? null : st.colour,
      typewriter: (st.typewriter === false) ? false : undefined,
      multiline: !!st.multiline,
      noChat: (st.chat === false),
      gap: pa.gap,
      perChar: !!pa.perChar,
      holdAfterChoice: pa.holdAfterChoice,
      finale: scene.finale,
      options: ch.options,
      onChoose: ch.onChoose,
      onTimeout: ch.onTimeout,
    })
  }

  function merge(a, b) {
    var out = {}
    var k
    for (k in (a || {})) if (a.hasOwnProperty(k)) out[k] = a[k]
    for (k in (b || {})) if (b.hasOwnProperty(k)) out[k] = b[k]
    return out
  }

  function active(player) {
    try { return !!(VELDORA.ritual && VELDORA.ritual.active(player)) } catch (e) { return false }
  }

  function end(player, why, keep) {
    try { return !!(VELDORA.ritual && VELDORA.ritual.release(player, why, keep)) }
    catch (e) { return false }
  }

  VELDORA.cutscene = {
    play: play,
    end: end,
    active: active,
    presets: PRESETS,
    geometry: GEOMETRY,
    // Exposed so a consumer can ask what is deliverable before writing a scene, and so
    // the tests can assert the translation covers every advertised key.
    stagingKeys: STAGING_KEYS,
    pacingKeys: PACING_KEYS,
    finaleKeys: FINALE_KEYS,
  }

  ServerEvents.loaded(function () {
    console.info(TAG + 'the general scene tool is live - ' +
      Object.keys(PRESETS).length + ' preset(s), ' +
      (STAGING_KEYS.length + PACING_KEYS.length + FINALE_KEYS.length) +
      ' deliverable key(s). It REFUSES anything else rather than dropping it silently.')
  })
})();
