// biome_titles.js — the biome name, centre screen, when it CHANGES.
//
// Ethan, 2026-08-11: "is there a mod that makes biome names appear in the middle
// of your screen?"
//
// There is, and it is already installed: rpgtitles. But it does not do what he
// asked, for two reasons worth recording so nobody re-adds it later:
//
//  1. It prints to the ACTIONBAR (`title @s actionbar`), not the centre. It has
//     to - its mcfunction runs every tick, and a centre title fired every tick
//     would never fade or animate. The actionbar is the only surface that
//     tolerates being rewritten continuously.
//  2. It ships hand-written predicates for `minecraft`, `tectonic` and
//     `terralith` ONLY - 3 namespaces, ~200 files. This pack's biome layer is Oh
//     The Biomes We've Gone plus YUNG's cave biomes, so almost everything you
//     actually walk through has no entry and it stays silent.
//
// Doing it here instead of generating 200 more predicate files means it works for
// EVERY biome from EVERY mod, including ones added later, with no data at all.
//
// The name is sent as a TRANSLATABLE component (`biome.<ns>.<path>`) rather than
// a prettified string, so each client renders whatever its own language file
// says. A biome we have never heard of still gets its proper name.
;(function () {
  var CHECK = 20                  // ticks between checks (1s) - a border crossing
                                  // is not urgent, and this runs per player
  var last = {}                   // uuid -> last biome id announced

  // KubeJS exposes the biome differently across versions, so try candidates and
  // say WHICH one worked - or say plainly that none did, rather than quietly
  // announcing nothing forever.
  var pick = -1
  var CANDS = [
    ['player.block.biome', function (p) { return p.block.biome }],
    ['level.getBiome(blockPosition)', function (p) { return p.level.getBiome(p.blockPosition()) }],
    ['player.block.getBiome()', function (p) { return p.block.getBiome() }],
  ]

  function biomeIdOf(p) {
    function read(f) {
      var b = f(p)
      if (!b) return null
      // may be a Holder, a ResourceKey, or already a string
      var cands = [
        function () { return b.id },
        function () { return b.getId() },
        function () { return b.unwrapKey().get().location().toString() },
        function () { return b.key().location().toString() },
        function () { return String(b) },
      ]
      for (var i = 0; i < cands.length; i++) {
        try {
          var v = cands[i]()
          if (typeof v === 'string' && v.indexOf(':') > 0) return v
        } catch (x) { }
      }
      return null
    }
    if (pick >= 0) {
      try { var q = read(CANDS[pick][1]); if (q) return q } catch (x) { }
      pick = -1                                    // miss: re-probe, never assume
    }
    for (var i = 0; i < CANDS.length; i++) {
      try {
        var v = read(CANDS[i][1])
        if (v) {
          if (pick !== i) { pick = i; console.info('[biome] read via ' + CANDS[i][0]) }
          return v
        }
      } catch (x) { }
    }
    if (!warned) {
      warned = true
      console.warn('[biome] NO way to read a player biome works here.')
      console.warn('[biome] Titles are OFF. That is a bug, not a quiet mode.')
    }
    return null
  }
  var warned = false

  function sweep(server) {
    try {
      var players = server.players
      for (var i = 0; i < players.length; i++) {
        var p = players[i]
        var uuid = String(p.uuid)
        var id = biomeIdOf(p)
        if (!id) continue
        if (last[uuid] === id) continue
        var first = !last[uuid]
        last[uuid] = id
        if (first) continue                        // do not shout on login
        showTitle(server, p, id)
      }
    } catch (e) { console.warn('[biome] sweep threw :: ' + e) }
    server.scheduleInTicks(CHECK, function () { sweep(server) })
  }

  // Commands are the reliable surface for titles here: /title carries its own
  // timing and the translate component resolves client-side.
  var titleWarned = false
  function showTitle(server, p, id) {
    var parts = id.split(':')
    var key = 'biome.' + parts[0] + '.' + parts[1]
    var payload = JSON.stringify({ translate: key, color: 'gray', italic: true })
    try {
      server.runCommandSilent('title ' + p.username + ' times 8 34 12')
      server.runCommandSilent('title ' + p.username + ' subtitle ' + payload)
      server.runCommandSilent('title ' + p.username + ' title ' + JSON.stringify({ text: '' }))
    } catch (e) {
      if (!titleWarned) { titleWarned = true; console.warn('[biome] title command failed :: ' + e) }
    }
  }

  ServerEvents.loaded(function (event) {
    last = {}
    console.info('[biome] centre-screen biome titles active - every ' + CHECK +
      't, on CHANGE only, translatable so any mod biome resolves')
    event.server.scheduleInTicks(CHECK, function () { sweep(event.server) })
  })
})()
