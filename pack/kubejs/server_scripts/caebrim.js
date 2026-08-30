// caebrim.js — the one voice below, and the one that announces the tide.
//
// Ethan, 2026-08-30: *"im retconning the rule for unique deep speakers. It will always
// just be caebrim."* The five per-path speakers in `deep_speaker.js` are now her by name,
// colour and font. This file holds what she says that is NOT per-path — the shared
// whispers, the tide, and her authored scenes with each god.
//
// Words: `docs/dialogue/Caebrim (Speaker Dialogue).txt` -> caebrim_lines.js (generated).
//
// ── 🔑 HER TIERS ARE THE TIDE, NOT A RELATIONSHIP ────────────────────────────
// His document's header: *"Trust is essentially tide power level."*
//
// ⭐ SHE IS THE ONLY SPEAKER IN THE GAME WHOSE REGISTER TRACKS THE WORLD RATHER THAN A
// PLAYER. Every god escalates as YOU earn it; she escalates as things get worse. That is
// why the same three whisper pools read as a threat at low tide and an offer at high —
// nothing about you changed, the world did.
//
// ── ⚠️ SHE IS NOT A GOD, AND THAT MATTERS RIGHT NOW ─────────────────────────
// Ethan, 2026-08-30: *"Pathless do not hear or interact with the gods again until they
// are chosen or a god is actively testing them."* She is explicitly NOT a god — this
// file's whole premise is that she is what is left when your god cannot reach you — so
// she is not covered by that silence, and E2b already ruled that the pathless hear HER
// announce the tide. Nothing here gates on having a path.
//
// ── HER PRESENTATION ─────────────────────────────────────────────────────────
// Registered in deep_speaker.js for the per-path ids and here for her shared one: Wall's
// font, always red, scattered. ⭐ TIDE ANNOUNCEMENTS ARE THE EXCEPTION and are CENTRED —
// his header says so, and it is the right instinct: a warning you might miss in the
// corner of your eye is a warning that did not arrive.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[caebrim] '
  var GATE = true

  // The shared pool namespace. ⚠️ NOT one of the per-path speaker ids - those hold the
  // writing she does for one champion, and this holds what she says to anybody.
  var ID = 'caebrim'

  // ⭐ HER STYLE, from his header. Same scatter box as Wall - the same place, the same
  // unease - because they come from the same place and the font already says so.
  var STYLE = {
    anchor: 'CENTER_CENTER',
    scatter: { x: 150, y: 70 },
    font: 'veldora:wall',
    color: '#AA0000',
    shake: false,
    size: 0.95,
  }

  // ⚠️ CENTRED, AND BIGGER. "Tide announcements are in the middle" - the one thing she
  // says that must not be missed, so it is the one thing that does not scatter.
  var TIDE_STYLE = {
    anchor: 'CENTER_CENTER',
    x: 0, y: 0,
    font: 'veldora:wall',
    color: '#AA0000',
    size: 1.15,
    shake: false,
  }

  function lines() {
    try { return VELDORA.caebrimLines || null } catch (e) { return null }
  }

  /**
   * ⭐ HER TIER IS THE TIDE'S POWER, not a counter.
   *
   * ⚠️ Returns null when there is no tide, and null is not 'low'. She has three
   * registers and none of them is "nothing is happening" - if the world is quiet, the
   * right amount to say is nothing, which is what a null lets the caller do.
   */
  function tierOf(p) {
    try {
      if (!VELDORA.tide || typeof VELDORA.tide.state !== 'function') return null
      var st = VELDORA.tide.state(p)
      if (!st || !st.active) return null
      var w = Number(st.waves) || 0
      if (w >= 9) return 'high'
      if (w >= 4) return 'med'
      return 'low'
    } catch (e) { return null }
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)] }

  /** One whisper, at the tide's current power. Returns false if she has nothing to say. */
  function whisper(p, forceTier) {
    if (!GATE) return false
    var L = lines()
    if (!L) return false
    var t = forceTier || tierOf(p)
    if (!t) return false
    var pool = L.whispers(t)
    if (!pool || !pool.length) return false
    return speak(p, pick(pool), STYLE, 'WHISPER')
  }

  /**
   * The tide, in her voice. `phase` is start | during | end.
   *
   * ⭐ E2b: the PATHLESS hear her; a champion hears their own god. That split is the
   * caller's to make - this only knows how to be her.
   */
  function tide(p, phase, forced) {
    if (!GATE && !forced) return false
    var L = lines()
    if (!L) return false
    var pool = L.tide(phase)
    if (!pool || !pool.length) return false
    // ⚠️ ANNOUNCE priority, not WHISPER. A warning that loses to ambience is a warning
    // delivered to a corpse - screen.js's whole reason for existing.
    return speak(p, pick(pool), TIDE_STYLE, 'ANNOUNCE')
  }

  function speak(p, chunks, style, priority) {
    try {
      if (!VELDORA.voice || typeof VELDORA.voice.speakChunks !== 'function') return false
      var o = {}
      for (var k in style) if (style.hasOwnProperty(k)) o[k] = style[k]
      o.priority = priority
      return !!VELDORA.voice.speakChunks(p, ID, chunks, null, o)
    } catch (e) { return false }
  }

  /**
   * One of her authored scenes with a god, played to everyone who can hear it.
   *
   * ⚠️ HIGH TRUST ONLY, and that is his instruction on the section itself: *"God Dialogue
   * (Can happen only at high trust and at any time)"*. The tier is the god's, not hers -
   * these are conversations about a relationship, not about the tide.
   */
  function scene(server, god, forced) {
    var L = lines()
    if (!L) return 'no-lines'
    var all = L.scenes()
    var pool = []
    for (var i = 0; i < all.length; i++) if (all[i].god === god) pool.push(all[i])
    if (!pool.length) return 'none-for-god'
    var sc = pick(pool)
    try {
      if (!VELDORA.broadcast || typeof VELDORA.broadcast.scene !== 'function') {
        return 'no-broadcast'
      }
      return VELDORA.broadcast.scene(server, sc.turns, {
        why: 'caebrim+' + god,
        minPlayers: forced ? 1 : 2,
      })
    } catch (e) { return 'threw' }
  }

  VELDORA.caebrim = {
    id: ID,
    style: STYLE,
    tideStyle: TIDE_STYLE,
    tierOf: tierOf,
    whisper: whisper,
    tide: tide,
    scene: scene,
    gods: function () {
      var L = lines()
      if (!L) return []
      var seen = {}, out = []
      var all = L.scenes()
      for (var i = 0; i < all.length; i++) {
        if (!seen[all[i].god]) { seen[all[i].god] = true; out.push(all[i].god) }
      }
      return out.sort()
    },
  }

  ServerEvents.loaded(function () {
    var L = lines()
    if (!L) {
      console.error(TAG + 'no lines - run `python tools/caebrim_import.py --write`')
      return
    }
    if (!VELDORA.voice) { console.error(TAG + 'voice.js missing'); return }

    // Her shared pools live under one key so anything can reach them without knowing
    // which path the listener walks.
    try {
      VELDORA.voice.setColour(ID, '§c')
      if (typeof VELDORA.voice.setStyle === 'function') VELDORA.voice.setStyle(ID, STYLE)
    } catch (e) { }

    var d = L.all()
    var w = 0, tn = 0
    for (var k in d.whispers) if (d.whispers.hasOwnProperty(k)) w += d.whispers[k].length
    for (var k2 in d.tide) if (d.tide.hasOwnProperty(k2)) tn += d.tide[k2].length
    console.info(TAG + w + ' whispers across three tide powers, ' + tn + ' tide lines, ' +
      d.scenes.length + ' authored scenes with ' + VELDORA.caebrim.gods().join('/') +
      '. ⭐ Her tiers are the TIDE\'s power, not a relationship - she is the only voice ' +
      'in the game that escalates with the world instead of with you. Wall\'s font, ' +
      'always red, scattered; the tide announcement is centred.')
  })

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    if (!Commands) return
    try {
      event.register(Commands.literal('caebrim')
        .requires(function (s) { try { return s.hasPermission(2) } catch (e) { return false } })
        .executes(function (ctx) {
          var p = ctx.source.player
          var t = tierOf(p)
          p.tell(Text.of('§8tide power: §f' + (t || 'no tide - she says nothing')))
          p.tell(Text.of('§8scenes with: §f' + VELDORA.caebrim.gods().join(', ')))
          p.tell(Text.of('§7/dtest caebrim §8to hear her'))
          return 1
        }))
    } catch (e) { console.warn(TAG + 'command registration failed :: ' + e) }
  })
})();
