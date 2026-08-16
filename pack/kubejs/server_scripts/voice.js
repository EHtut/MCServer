// voice.js - THE COMBINATORIAL LINE ENGINE.  docs/40 PART 4
//
// Ethan, 2026-08-15: "I want to make it dynamic for most of these with dialogue
// snippets combined together to keep things fresh."
//
// NOTHING in this pack was combinatorial before this file. Every pool - whispers,
// regard beats, the scenes - is whole lines picked at random, so a player hears the
// same sentence twice and the character stops being a character.
//
// THE GRAMMAR: one OPEN + one CLOSE, drawn from the same TAG, joined with a space.
// Blade's best written line is already this shape:
//
//     "Phaethon reached for the sun's chariot too."   <- open
//     "They still find pieces of him in the river."   <- close
//
// ── THE RULE THAT KEEPS IT FROM PRODUCING NONSENSE ───────────────────────────
// Fragments only ever combine WITHIN a tag. A verdict about the spider must never
// land on an observation about the engineer. The tag IS the subject, so any open
// in a tag must read correctly against any close in that same tag - that is a
// constraint on the WRITING, and speak() checks the shape at boot rather than
// trusting it.
//
// ── ROLLBACK ─────────────────────────────────────────────────────────────────
// A god with no pools registered simply never speaks through this file; every
// existing whisper and beat is untouched. It adds a voice, it replaces nothing.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[voice] '

  // god -> tag -> { opens: [], closes: [] }
  var POOLS = {}

  // god -> colour code. The gods speak in bold dark red (23 §5, the pack's one
  // delivery channel). The Speaker below does NOT - she is not a god, she is what
  // is left when yours cannot reach you, and grey is the whole point.
  var COLOUR = {}
  var DEFAULT_COLOUR = '§4§l'

  function setColour(god, code) { COLOUR[god] = code }

  // ⭐ THE ONE PLACE THAT KNOWS WHAT COLOUR A GOD IS.
  //
  // Every other file that made a patron speak hardcoded '§4§l' - Blade's bold red -
  // because for months Blade was the only patron with a voice. The moment the Spider
  // arrived, her death lines, her fall, her entry line and her reckoning all came out
  // in HIS colour. Ethan, 2026-08-15: "we need to make sure all her dialogue stays in
  // her color."
  //
  // Callers ask here now. A god with no registered colour still falls back to the
  // patron channel, so nothing goes uncoloured.
  function colourOf(god) { return COLOUR[god] || DEFAULT_COLOUR }

  // What a player last heard, so the same pairing does not repeat back to back.
  // In memory: a repeat across a restart is not worth persisting state for.
  var lastSaid = {}

  function register(god, tag, opens, closes) {
    if (!god || !tag) return false
    if (!opens || !opens.length || !closes || !closes.length) {
      console.error(TAG + 'refusing to register ' + god + '/' + tag +
        ' - a pool with an empty half can only ever produce half a line')
      return false
    }
    if (!POOLS[god]) POOLS[god] = {}
    POOLS[god][tag] = { opens: opens, closes: closes }
    return true
  }

  // Some pools are WHOLE lines rather than fragments - a declaration, a verdict,
  // a refusal. Those are registered with an empty `closes` and joined to nothing,
  // so one engine serves both shapes and callers never need to know which is which.
  function registerLines(god, tag, lines) {
    if (!lines || !lines.length) {
      console.error(TAG + 'refusing to register ' + god + '/' + tag + ' - empty')
      return false
    }
    if (!POOLS[god]) POOLS[god] = {}
    POOLS[god][tag] = { opens: lines, closes: null, whole: true }
    return true
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)] }

  // Build a line. Returns null if that god has nothing for that tag - and null
  // means "say nothing", which callers must respect rather than substituting a
  // placeholder. A god with nothing to say is silent, not broken.
  function line(god, tag, player) {
    var g = POOLS[god]
    if (!g) return null
    var p = g[tag]
    if (!p) return null

    // Two tries to avoid an immediate repeat, then take what we get. Looping
    // until unique would spin forever on a one-line pool.
    var key = null
    try { key = player ? String(player.uuid) + '|' + god + '|' + tag : null } catch (e) { }
    var out = null
    for (var i = 0; i < 2; i++) {
      out = p.whole ? pick(p.opens) : (pick(p.opens) + ' ' + pick(p.closes))
      if (!key || lastSaid[key] !== out) break
    }
    if (key) lastSaid[key] = out
    return out
  }

  // Speak it, in the patron register: bold red, the pack's one delivery channel
  // (23 §5 - "all the events need to be bolded in red over chat").
  function say(player, god, tag) {
    var s = line(god, tag, player)
    if (!s) return false
    try { player.tell(Text.of((COLOUR[god] || DEFAULT_COLOUR) + s)) } catch (e) { return false }
    return true
  }

  // Substitution for lines that name somebody - the Mark uses {target}.
  function sayAbout(player, god, tag, subs) {
    var s = line(god, tag, player)
    if (!s) return false
    if (subs) for (var k in subs) {
      if (subs.hasOwnProperty(k)) s = s.split('{' + k + '}').join(String(subs[k]))
    }
    try { player.tell(Text.of((COLOUR[god] || DEFAULT_COLOUR) + s)) } catch (e) { return false }
    return true
  }

  VELDORA.voice = {
    register: register,
    setColour: setColour,
    colourOf: colourOf,
    registerLines: registerLines,
    line: line,
    say: say,
    sayAbout: sayAbout,
    pools: POOLS,
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }

    // Read a tag out loud. The only honest way to review combinatorial writing is
    // to see the JOINS, not the fragments - a pool can look fine and pair badly.
    event.register(Commands.literal('voice').requires(ADMIN)
      .then(Commands.argument('god', event.arguments.STRING.create(event))
        .then(Commands.argument('tag', event.arguments.STRING.create(event))
          .executes(function (ctx) {
            var p = ctx.source.player
            if (!p) return 0
            var god = ctx.getArgument('god', Java.loadClass('java.lang.String'))
            var tag = ctx.getArgument('tag', Java.loadClass('java.lang.String'))
            var g = POOLS[god]
            if (!g || !g[tag]) {
              p.tell(Text.of('§cno pool for ' + god + '/' + tag))
              var have = []
              for (var k in POOLS) if (POOLS.hasOwnProperty(k)) {
                for (var t in POOLS[k]) if (POOLS[k].hasOwnProperty(t)) have.push(k + '/' + t)
              }
              p.tell(Text.of('§8registered: ' + (have.join(', ') || 'nothing')))
              return 0
            }
            var pool = g[tag]
            p.tell(Text.of('§8§m                                        '))
            p.tell(Text.of('§6' + god + '/' + tag + ' §8- ' +
              (pool.whole ? pool.opens.length + ' whole lines'
                          : pool.opens.length + ' x ' + pool.closes.length + ' = ' +
                            (pool.opens.length * pool.closes.length) + ' possible')))
            for (var i = 0; i < 8; i++) {
              p.tell(Text.of((COLOUR[god] || DEFAULT_COLOUR) + line(god, tag, null)))
            }
            return 1
          }))))
  })

  ServerEvents.loaded(function () {
    var gods = 0, tags = 0, total = 0
    for (var g in POOLS) {
      if (!POOLS.hasOwnProperty(g)) continue
      gods++
      for (var t in POOLS[g]) {
        if (!POOLS[g].hasOwnProperty(t)) continue
        tags++
        var pp = POOLS[g][t]
        total += pp.whole ? pp.opens.length : (pp.opens.length * pp.closes.length)
      }
    }
    console.info(TAG + 'VELDORA.voice published OK - ' + gods + ' god(s), ' + tags +
      ' tag(s), ' + total + ' possible lines')
    if (!gods) console.warn(TAG + 'no pools registered yet - every god is silent ' +
      'through this file. That is the expected state until content lands.')
  })
})();
