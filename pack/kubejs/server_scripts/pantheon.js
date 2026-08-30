// pantheon.js — ONE registrar for every god's voice.  docs/40, docs/75
//
// Ethan, 2026-08-30: *"is it possible to generalize the dialogue system first, per god, so
// we aren't creating a new function each time we touch it?"*
//
// ── ⭐ THE PATTERN IS ALREADY PROVEN HERE, JUST NOT ON THIS LAYER ─────────────
// `godevents.js` states it in its own header: *"the CADENCE, the guards and the
// bookkeeping are shared, and the EVENT ITSELF is per-god and bespoke."* That is exactly
// right, and it was never applied to the VOICE. There is a godevents.js; there was no
// godvoice.js — so every god grew its own copy of the same boot block.
//
// ── 🔴 AND THE COPIES HAD ALREADY DRIFTED ────────────────────────────────────
// Measured before this file was written, across the five `<god>_voice.js`:
//
//   · 297 lines of boot plumbing, three registration loops each
//   · wall and salvage count pool coverage (WRITTEN/POOL_COUNT); the other three do not
//   · forge's CONTEXT loop increments `ctxtags`; everyone else's increments `tags`, so
//     his "tags" number means something different from the other four
//   · blade never calls setColour at all — he silently inherits voice.js's
//     DEFAULT_COLOUR, so changing that default would change Blade and nothing would say so
//
// ⚠️ NOBODY DECIDED ANY OF THAT. That is the cost the question was about: five places to
// touch, and the drift is invisible because each file reads fine on its own.
//
// ── ⭐⭐ WHAT MOVES, AND WHAT DELIBERATELY DOES NOT ──────────────────────────
// THE PLUMBING MOVES. THE WRITING DOES NOT.
//
// `LINES`, `FRAGS` and `CONTEXT` stay exactly where they are, in each god's own file,
// along with every line of characterisation comment. Only the boot block collapses.
//
// 🔑 That is not tidiness, it is the safety property: Ethan is editing dialogue in those
// files right now, and a refactor that moved his words would collide with his writing.
// This one cannot — it does not touch a single line of prose.
//
// ── THE SAFETY NET ───────────────────────────────────────────────────────────
// `tools/pantheon_snapshot.py` records what every god registers — colour, garble, style,
// every pool — and the baseline was taken BEFORE this file existed. `--check` must stay
// IDENTICAL. The danger in this refactor was never a loud break; it is one pool quietly
// not registering, which reads as a god having less to say.
//
// ── ⚠️ NOT IN THIS PASS: tierOf ──────────────────────────────────────────────
// Three gods define their own `tierOf`, and four other files define a seventh and eighth
// copy — `godevents.js` already has a GENERIC one that never spread. Consolidating them
// is the obvious next move and it is deliberately NOT here: the snapshot cannot see
// tierOf, so folding it in would mean half this change was verified and half was hoped.
// It gets its own pass with its own evidence.
//
// ── LOAD ORDER ───────────────────────────────────────────────────────────────
// ⚠️ KubeJS loads server_scripts ALPHABETICALLY, so this file is evaluated AFTER
// art/blade/forge and BEFORE salvage/wall. That is fine and is the same bet voice.js
// already makes: `define()` is called from inside `ServerEvents.loaded`, which fires only
// once every script is in memory. ⛔ Calling it at eval time would work for two gods and
// throw for three, which is the worst possible failure shape.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[pantheon] '

  // god -> the spec it was defined with. The registry other tools can ask, instead of
  // maintaining their own hardcoded list of who exists (dialogue_doc.py holds one today).
  var SPECS = {}

  function count(obj) {
    var n = 0
    for (var k in obj) if (obj.hasOwnProperty(k)) n++
    return n
  }

  /**
   * Register everything one god says.
   *
   * @param god   the god's id
   * @param spec  {
   *    colour:  '§5§l'            — REQUIRED. See the header: an inherited default is
   *                                 how Blade ended up coloured by accident.
   *    garbled: false             — optional, the pathless-style broken delivery
   *    style:   {…}               — the overlay placement. Optional but expected.
   *    lines:   { tag: [line…] }  — whole-line pools
   *    frags:   { tag: {opens, closes} }
   *    context: { tag: [line…] }  — whole-line pools that are contextual
   *    label:   'The Matriarch'   — how the boot line names them
   *    note:    '…'               — anything extra the banner should say
   *  }
   * @returns stats, or null if voice.js is missing.
   */
  function define(god, spec) {
    if (!VELDORA.voice) {
      console.error(TAG + god + ': voice.js missing - this god has no voice at all')
      return null
    }
    spec = spec || {}
    SPECS[god] = spec

    var v = VELDORA.voice
    var st = {
      whole: 0, wholeTags: 0,
      context: 0, contextTags: 0,
      combos: 0, fragTags: 0,
      // ⭐ COVERAGE, FOR EVERY GOD. wall and salvage counted this and the other three did
      // not, so "how much of this god is actually written" was answerable for two of
      // five. It is the number that matters most while the pools are half [CLAUDE-DRAFT].
      pools: 0, written: 0,
    }

    // 🔴 EXPLICIT, NEVER INHERITED. blade had no setColour call and silently took
    // voice.js's DEFAULT_COLOUR; a change to that default would have moved him with
    // nothing in any log. A god with no colour is a bug worth saying out loud.
    if (spec.colour) {
      v.setColour(god, spec.colour)
    } else {
      console.warn(TAG + god + ' declares no colour - falling back to the shared default, '
        + 'which means a change to that default silently changes this god')
    }

    if (spec.garbled && typeof v.setGarbled === 'function') v.setGarbled(god, true)
    if (spec.style && typeof v.setStyle === 'function') v.setStyle(god, spec.style)

    var k
    for (k in spec.lines || {}) {
      if (!spec.lines.hasOwnProperty(k)) continue
      st.pools++
      if (spec.lines[k] && spec.lines[k].length) st.written++
      if (v.registerLines(god, k, spec.lines[k])) {
        st.whole += spec.lines[k].length
        st.wholeTags++
      }
    }
    for (k in spec.frags || {}) {
      if (!spec.frags.hasOwnProperty(k)) continue
      var f = spec.frags[k]
      st.pools++
      if (f && f.opens && f.opens.length && f.closes && f.closes.length) st.written++
      if (f && v.register(god, k, f.opens, f.closes)) {
        st.combos += f.opens.length * f.closes.length
        st.fragTags++
      }
    }
    for (k in spec.context || {}) {
      if (!spec.context.hasOwnProperty(k)) continue
      st.pools++
      if (spec.context[k] && spec.context[k].length) st.written++
      if (v.registerLines(god, k, spec.context[k])) {
        st.context += spec.context[k].length
        st.contextTags++
      }
    }

    // ⭐ THE CRASHOUT POOLS ARE NAMED, NOT JUST ANOTHER TAG. Their tag strings are a
    // CONTRACT with other files - grudge.js fires `crashout`, and voice.crashoutFor
    // decides one-movement vs two by whether `crashout_flat` exists. A typo in a god
    // file would silently downgrade that god from two movements to one, which reads as
    // a writing choice rather than a bug. Naming them here means the string is written
    // once, in the file that knows what it means.
    //
    // ⚠️ Only the gods who RETALIATE have one. Forge and Art never reach that line at
    // all, and their silence is a posture rather than a missing pool - so absence here
    // is not warned about.
    if (spec.crashout && spec.crashout.length) {
      st.pools++
      st.written++
      if (v.registerLines(god, 'crashout', spec.crashout)) {
        st.whole += spec.crashout.length
        st.wholeTags++
      }
    }
    if (spec.crashoutFlat && spec.crashoutFlat.length) {
      st.pools++
      st.written++
      if (v.registerLines(god, 'crashout_flat', spec.crashoutFlat)) {
        st.whole += spec.crashoutFlat.length
        st.wholeTags++
      }
    }

    // ⚠️ THE SAME SENTENCE FOR EVERY GOD, so five banners can be read as one table
    // instead of five prose styles. A banner is a claim, not evidence (rule 7) - so it
    // reports what was COUNTED during registration, never what the file intended.
    var tags = st.wholeTags + st.contextTags + st.fragTags
    var who = spec.label ? (spec.label + ' (' + god + ')') : god
    if (!tags) {
      console.error(TAG + who + ' HAS NO VOICE - every pool is empty')
    } else {
      console.info(TAG + who + ' - ' + st.whole + ' fixed + ' + st.context +
        ' contextual + ' + st.combos + ' combinatorial, across ' + tags + ' tags. ' +
        st.written + '/' + st.pools + ' pools written' +
        (spec.note ? '. ' + spec.note : '.'))
    }
    return st
  }

  VELDORA.pantheon = {
    define: define,
    // ⭐ THE REGISTRY OTHER TOOLS CAN ASK. dialogue_doc.py currently keeps its own
    // hardcoded {god: file} map and therefore cannot see any speaker that is not one of
    // five - which is half of C6/D-128. This is what it should read instead.
    gods: function () {
      var out = []
      for (var g in SPECS) if (SPECS.hasOwnProperty(g)) out.push(g)
      return out.sort()
    },
    spec: function (god) { return SPECS[god] || null },
    _specs: SPECS,
  }

  ServerEvents.loaded(function () {
    // ⚠️ Runs after every god's own loaded() handler only if it is registered later;
    // KubeJS fires them in load order, so this is a REPORT and must not be the thing
    // that proves registration happened. The snapshot tool is that.
    var n = count(SPECS)
    console.info(TAG + (n
      ? n + ' god(s) defined through the shared registrar. Plumbing is here; the WRITING ' +
        'stays in each god\'s own file, which is what makes this safe to change while ' +
        'dialogue is being edited.'
      : 'no gods defined through the registrar yet - every god still carries its own ' +
        'boot block'))
  })
})();
