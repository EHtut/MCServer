"""new_god - scaffold a patron from the Blade template.

    python tools/new_god.py crown --actor born_in_chaos_v1:missioner \
                                  --counter "holdings claimed" \
                                  --colour "§5§l" --name "The False King"

WHAT IT DOES
    Writes  pack/kubejs/server_scripts/<god>_voice.js
            pack/kubejs/server_scripts/<god>_events.js
    pre-wired to every seam in docs/41-BUILDING-A-GOD.md §1, with the fifteen
    invariants from §3 already encoded:

      * tierOf returns NULL for an unreadable counter, never 'low'
      * every persistentData day read is stored as day+1, so 0 means "never"
      * every day comparison handles a stamp FROM THE FUTURE (/time set)
      * arrive() returns false when it did not arrive, so nothing is stamped
      * the Harvest declares an actor tag, so resolve() can clean up
      * refuses to open a scene over a running one
      * ServerEvents.loaded takes its `event` parameter
      * var, never const, inside repeatedly-invoked callbacks (Rhino)

WHAT IT DOES NOT DO
    Write dialogue. Every pool ships EMPTY with a TODO(ethan) marker, and the
    boot log counts the unfilled ones out loud:

        [crown] 0 of 14 pools written - THIS GOD HAS NO VOICE YET

    An unwritten god is loud, not silent. That is the whole point: a gate that
    ships without a live consumer is a bug, and so is a god who says nothing
    while the log claims he loaded fine.

SAFETY
    Refuses to overwrite an existing file. --dry-run prints instead of writing.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
SS = REPO / "pack" / "kubejs" / "server_scripts"

# ═══════════════════════════════════════════════════════════════════════════════
# 🚫 THE LIVE ROSTER IS FIVE, NOT SIX.
#
# Ethan, 2026-08-14 (docs/35 §6): "We merge crown and wall. The idea being the
# spider mother wants you to build a family, a web, like hers. Also missionary is
# kinda a boring patron compared to the others."
#
# Crown is RETIRED. He leaves paths.js at the world reset. His writing is kept in
# docs/27 and docs/28 marked RETIRED because a sixth patron may be wanted later -
# but he is not built, and nothing new is written for him.
#
# 🚨 THIS GUARD EXISTS BECAUSE THE MISTAKE WAS ALREADY MADE. On 2026-08-15 Crown
# was scaffolded, deployed and given a whole content worksheet, because docs/22 and
# docs/27 still describe him as a live peer and the merge was recorded only in §6
# of a doc about Wall. Reading the character docs was enough to get it wrong.
#
# A doc can be misread. This cannot.
RETIRED = {
    "crown": "merged into WALL 2026-08-14 (docs/35 §6) - the spider mother's "
             "household holds the living AND the dead. Build `wall` instead.",
}

# The five that exist. `salvage` is the Hound, `wall` is the Mother/Spider.
LIVE_PATHS = ["blade", "salvage", "forge", "wall", "art"]

# The tag families Blade proved out. A new god starts with these and adds its own.
POOLS = [
    ("low_gift", "handing you something, at low trust"),
    ("medium_gift", "handing you something, at medium trust"),
    ("high_gift", "handing you something, at high trust"),
    ("low_silence", "you did well and it is barely acknowledged"),
    ("medium_silence", "you did well"),
    ("high_silence", "you did well and it is the rarest praise in the game"),
    ("loc_above", "idle, above ground"),
    ("loc_below", "idle, underground"),
    ("rare_loc_above", "RARE - where the god is a person, not a function"),
    ("combat", "idle, while fighting"),
    ("hold_weapon", "idle, holding a weapon"),
    ("hold_food", "idle, holding food"),
    ("harvest_won", "you beat what it sent"),
    ("harvest_lost", "it beat you"),
]


def banner(god: str, name: str, counter: str) -> str:
    return f"""// {god}_voice.js - {name}'s lines + trust tiers.
//
// ⚠️ GENERATED SKELETON (tools/new_god.py). The STRUCTURE is correct and carries
// the invariants from docs/41 §3; the WRITING is not here yet. Every pool below is
// empty and marked TODO(ethan), and the boot log says so out loud.
//
// Trust is the COUNTER (counters.js). This god counts: {counter}.
//
// Read docs/41-BUILDING-A-GOD.md before editing. Read docs/40-BLADE-THE-WARRIOR.md
// for a finished example of every pattern used here."""


def voice_js(god: str, name: str, counter: str, colour: str,
             medium_at: int, high_at: int) -> str:
    pool_src = "\n".join(
        f"    // TODO(ethan): {desc}\n    {tag}: [],"
        for tag, desc in POOLS
    )
    return f"""{banner(god, name, counter)}
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {{}};

;(function () {{
  var TAG = '[{god}] '
  var GOD = '{god}'
  var COLOUR = '{colour}'

  // Thresholds on: {counter}.
  // ⚠️ A FIRST GUESS, and meant to be. Replace with a measured curve once there is
  // play data - do not argue about these numbers, measure them.
  var MEDIUM_AT = {medium_at}
  var HIGH_AT = {high_at}

  // 🚨 UNREADABLE IS NOT 'low'. A god who cannot read his own counter must say
  // NOTHING. Defaulting to the low tier turns every storage hiccup into contempt,
  // which is docs/41 invariant #4 and the most expensive one on the list.
  function tierOf(player) {{
    var n = null
    try {{ if (VELDORA.counter) n = VELDORA.counter.get(player, GOD) }} catch (e) {{ }}
    if (n === null) return null
    if (n >= HIGH_AT) return 'high'
    if (n >= MEDIUM_AT) return 'medium'
    return 'low'
  }}

  // ── the lines ──────────────────────────────────────────────────────────────
  // A `rare_<tag>` pool is rolled by idle.js at 15% BEFORE its common twin. Put the
  // lines where this god is a person in there, and nowhere else.
  var LINES = {{
{pool_src}
  }}

  // 🚨 COUNTED AT SCRIPT-EVAL TIME, NOT INSIDE ServerEvents.loaded.
  //
  // <god>_events.js has to know whether this god has a voice before it registers
  // anything - and BOTH files do their work in `loaded`, which fires in SCRIPT LOAD
  // ORDER. `<god>_events.js` sorts before `<god>_voice.js`, so the events file asked
  // the voice registry a question the voice file had not answered yet, and every god
  // booted HELD while simultaneously reporting all pools written.
  //
  // Publishing the count at eval time removes the race entirely: this runs when the
  // file is READ, long before any loaded handler.
  var WRITTEN = 0
  var POOL_COUNT = 0
  for (var _k in LINES) {{
    if (!LINES.hasOwnProperty(_k)) continue
    POOL_COUNT++
    if (LINES[_k].length) WRITTEN++
  }}

  VELDORA.{god} = {{
    tier: tierOf,
    colour: COLOUR,
    written: WRITTEN,
    pools: POOL_COUNT,
    // Speak whatever this tier calls for. Returns false if there is nothing - which
    // is a legitimate answer, not a failure.
    speak: function (player, kind) {{
      var t = tierOf(player)
      if (!t) return false
      if (!VELDORA.voice) return false
      return VELDORA.voice.say(player, GOD, t + '_' + kind)
    }},
  }}

  ServerEvents.commandRegistry(function (event) {{
    var Commands = event.commands
    function ADMIN(s) {{ try {{ return s.hasPermission(2) }} catch (e) {{ return false }} }}
    event.register(Commands.literal('{god}').requires(ADMIN).executes(function (ctx) {{
      var p = ctx.source.player
      if (!p) return 0
      var t = tierOf(p)
      var n = null
      try {{ if (VELDORA.counter) n = VELDORA.counter.get(p, GOD) }} catch (e) {{ }}
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7{name} §8- counter §f' + (n === null ? 'UNREADABLE' : n) +
        '§8, tier §f' + (t || 'UNREADABLE')))
      return 1
    }}))
  }})

  // ⚠️ TAKE THE `event` PARAMETER. Omitting it makes `event.server` throw a
  // ReferenceError that KubeJS logs WITHOUT a level - invisible to `logq errors`
  // until that tool was repaired on 2026-08-15. docs/41 invariant #13.
  ServerEvents.loaded(function (event) {{
    if (!VELDORA.voice) {{ console.error(TAG + 'voice.js missing'); return }}
    VELDORA.voice.setColour(GOD, COLOUR)
    var total = 0
    var written = 0
    var empty = []
    for (var k in LINES) {{
      if (!LINES.hasOwnProperty(k)) continue
      total++
      if (LINES[k].length) {{
        written++
        VELDORA.voice.registerLines(GOD, k, LINES[k])
      }} else empty.push(k)
    }}
    // 🚨 AN UNWRITTEN GOD IS LOUD, NOT SILENT. "loaded fine" and "has anything to
    // say" are different claims, and a subsystem that is configured on and produces
    // nothing is the failure mode this project keeps paying for.
    if (!written) {{
      console.error(TAG + '0 of ' + total + ' pools written - THIS GOD HAS NO VOICE YET')
    }} else if (empty.length) {{
      console.warn(TAG + written + ' of ' + total + ' pools written. Still empty: ' +
        empty.join(', '))
    }} else {{
      console.info(TAG + '{name} speaks - all ' + total + ' pools written. ' +
        'Tiers at ' + MEDIUM_AT + '/' + HIGH_AT + '.')
    }}
  }})
}})();
"""


def events_js(god: str, name: str, actor: str, colour: str) -> str:
    return f"""// {god}_events.js - what {name} sends.
//
// ⚠️ GENERATED SKELETON (tools/new_god.py). Three example events and a Harvest
// handler, all correctly wired and all deliberately thin. Read docs/41 §2 ⑦: START
// WITH THREE, NOT TWELVE. Blade has twelve because he is the combat god and eight of
// them are spawner calls.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {{}};

;(function () {{
  var TAG = '[{god}ev] '
  var GOD = '{god}'

  var ACTOR = '{actor}'
  var ACTOR_TAG = 'veldora_{god}_actor'

  // NBT quoting through a char code. The NBT wants single quotes around a JSON text
  // component, and every attempt to escape those through a tool chain mangled them.
  // A char code cannot be mangled.
  var Q = String.fromCharCode(39)

  function say(p, tag) {{
    try {{ if (VELDORA.voice) return VELDORA.voice.say(p, GOD, tag) }} catch (e) {{ }}
    return false
  }}

  function dayNow(server) {{
    try {{
      var d = server.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return Math.floor(d / 24000)
    }} catch (e) {{ }}
    return null
  }}

  // ⚠️ getInt() RETURNS 0 FOR A MISSING KEY, so the stored value is day+1 and 0 means
  // "never". And the clock is NOT monotonic - admins run /time set, and a stamp from
  // the future must re-stamp rather than lock the player out for ten thousand days.
  // docs/41 invariants #5 and #6.
  function daysSince(server, p, key) {{
    var now = dayNow(server)
    if (now === null) return null
    var stored = 0
    try {{ stored = p.persistentData.getInt(key) }} catch (e) {{ return null }}
    if (!stored) return null                       // never
    var last = stored - 1
    if (last > now) {{
      try {{ p.persistentData.putInt(key, now + 1) }} catch (e) {{ }}
      return 0
    }}
    return now - last
  }}

  function stampDay(server, p, key) {{
    var now = dayNow(server)
    if (now === null) return
    try {{ p.persistentData.putInt(key, now + 1) }} catch (e) {{ }}
  }}

  // ═══════════════════════════════════════════════════════════════════════════
  // THE EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 A run() RETURNING false DOES NOT STAMP THE COOLDOWN. An event that could not
  // happen has not happened, and must be tried again. docs/41 invariant #9.

  function evExample(server, p) {{
    // TODO(ethan): what does {name} actually do here?
    if (!VELDORA.spawner) return false
    var r = VELDORA.spawner.wave(p, {{
      ids: [ACTOR], count: 1, minDist: 12, maxDist: 20,
      nbt: '{{Tags:["' + ACTOR_TAG + '"]}}',
    }})
    if (!r || r.placed === 0) {{
      console.warn(TAG + 'example: nothing placed for ' + p.username + ' - not stamping')
      return false
    }}
    say(p, 'push')
    return true
  }}

  function evQuiet(server, p) {{
    // A non-hostile event: it only speaks. Every god wants at least one of these, or
    // the god becomes nothing but a threat generator.
    return say(p, 'push')
  }}

  function evGuarded(server, p) {{
    // TODO(ethan): the guarded one - fires only under a condition worth noticing.
    return say(p, 'lore')
  }}

  // ═══════════════════════════════════════════════════════════════════════════
  // THE HARVEST
  // ═══════════════════════════════════════════════════════════════════════════
  // Four gods COLLECT. Blade GRADUATES. harvest.js is a registry precisely so this
  // may differ per god - decide which this one is before writing arrive().

  function harvestArrive(server, p) {{
    if (!VELDORA.spawner) return false

    // 🚨 REFUSE IF A SCENE IS ALREADY RUNNING. Do not push through it - the Speaker's
    // confession holds a player blind and rooted for ~39s, and dropping a Harvest on
    // them mid-scene is docs/41 invariant #11.
    try {{
      if (VELDORA.ritual && VELDORA.ritual.active(p)) {{
        console.info(TAG + 'Harvest held for ' + p.username + ' - already in a scene')
        return false
      }}
    }} catch (e) {{ }}

    var r = VELDORA.spawner.wave(p, {{
      ids: [ACTOR], count: 1, minDist: 12, maxDist: 20,
      nbt: '{{Tags:["' + ACTOR_TAG + '"],CustomNameVisible:1b,CustomName:' + Q +
        '{{"text":"TODO name me","color":"white","bold":true}}' + Q + '}}',
    }})
    // 🚨 A HARVEST THAT DID NOT ARRIVE DID NOT HAPPEN. Returning false means
    // harvest.js does NOT stamp it as begun, and the phase sweep retries.
    if (!r || r.placed === 0) {{
      console.error(TAG + '!! Harvest actor FAILED to place for ' + p.username)
      return false
    }}
    console.info(TAG + 'Harvest sent at ' + p.username)
    return true
  }}

  // ⚠️ THE CLOSING LINES ARE DELAYED. They fire from a death hook, so undelivered
  // they print ABOVE "X was slain by..." and read as commentary arriving too early.
  // The god speaks after the world has finished saying what happened.
  function harvestWin(server, p) {{
    server.scheduleInTicks(20, function () {{ try {{ say(p, 'harvest_won') }} catch (e) {{ }} }})
  }}

  function harvestLose(server, p) {{
    server.scheduleInTicks(20, function () {{ try {{ say(p, 'harvest_lost') }} catch (e) {{ }} }})
  }}

  // Winning is killing it. The tag is how we know which corpse mattered.
  EntityEvents.death(function (event) {{
    try {{
      var victim = event.entity
      if (!victim || victim.player) return
      var tags = null
      try {{ tags = victim.tags }} catch (x) {{ return }}
      if (!tags) return
      var has = false
      try {{
        has = tags.contains ? tags.contains(ACTOR_TAG) : (String(tags).indexOf(ACTOR_TAG) >= 0)
      }} catch (x) {{ return }}
      if (!has) return
      var killer = event.source ? event.source.player : null
      if (!killer) return
      if (VELDORA.harvest) VELDORA.harvest.resolve(killer.server, killer, true)
    }} catch (e) {{ console.warn(TAG + 'harvest kill hook threw :: ' + e) }}
  }})

  // Losing is dying to it. Dying AT ALL while a Harvest is active counts.
  EntityEvents.death(function (event) {{
    try {{
      var victim = event.entity
      if (!victim || !victim.player) return
      if (!VELDORA.harvest || !VELDORA.harvest.active(victim)) return
      VELDORA.harvest.resolve(victim.server, victim, false)
    }} catch (e) {{ }}
  }})

  // 🚨 AN UNWRITTEN GOD MUST BE INERT, NOT MERELY LOUD.
  //
  // The scaffold goes LIVE the instant it deploys - `[events] framework LIVE - 14
  // events across 2 gods` - and a walker on this path would then start drawing
  // placeholder events that spawn an actor and say NOTHING, because the voice pools
  // are still empty. That is worse than an unbuilt god: it is a built one that
  // appears broken.
  //
  // So registration is gated on the voice actually having lines. Write the pools in
  // <god>_voice.js and this wires itself up on the next restart, with no flag to
  // remember to flip - docs/41 §3, and the standing rule that a gate ships with a
  // live consumer or not at all.
  function voiceIsWritten() {{
    // Ask the god's OWN published count, which is set at script-eval time by
    // <god>_voice.js. Asking VELDORA.voice.pools here is a RACE - that registry is
    // filled inside a `loaded` handler that runs AFTER this one.
    try {{
      if (VELDORA[GOD] && typeof VELDORA[GOD].written === 'number') {{
        return VELDORA[GOD].written > 0
      }}
    }} catch (e) {{ }}
    // Fall back to the registry, in case a hand-written god predates `written`.
    try {{
      var g = VELDORA.voice && VELDORA.voice.pools ? VELDORA.voice.pools[GOD] : null
      if (!g) return false
      for (var k in g) if (g.hasOwnProperty(k)) return true
    }} catch (e) {{ }}
    return false
  }}

  ServerEvents.loaded(function (event) {{
    if (!VELDORA.events) {{ console.error(TAG + 'godevents.js missing'); return }}

    if (!voiceIsWritten()) {{
      console.warn(TAG + 'HELD - {name} has no written lines yet, so nothing is ' +
        'registered. A walker on this path would have drawn silent placeholder ' +
        'events. Fill the pools in {god}_voice.js and restart; this arms itself.')
      return
    }}

    VELDORA.events.register(GOD, {{
      id: 'example', run: evExample, hostile: true,
      does: 'TODO(ethan): one plain sentence - what does this DO to the player?',
    }})
    VELDORA.events.register(GOD, {{
      id: 'quiet', run: evQuiet, hostile: false, cooldown: 1,
      does: 'TODO(ethan): speaks only, no danger',
    }})
    VELDORA.events.register(GOD, {{
      id: 'guarded', run: evGuarded, hostile: false, tiers: ['medium', 'high'],
      does: 'TODO(ethan): what condition guards it, and what it does when it passes',
    }})

    if (VELDORA.harvest) {{
      VELDORA.harvest.register(GOD, {{
        arrive: harvestArrive, onWin: harvestWin, onLose: harvestLose,
        tag: ACTOR_TAG,     // resolve() removes it, WIN OR LOSE
      }})
    }} else console.error(TAG + 'harvest.js missing - this god\\'s Harvest will not arrive')

    console.info(TAG + '{name} sends: example, quiet, guarded - SKELETON, ' +
      'see docs/41 section 2 step 7. Actor: ' + ACTOR)
  }})
}})();
"""


def main() -> int:
    # The templates are full of § and emoji. Windows defaults stdout to cp1252, so
    # `new_god.py --dry-run > out.txt` died with a UnicodeEncodeError and exit 1 -
    # which reads exactly like the scaffolder refusing to run.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    ap = argparse.ArgumentParser(description="scaffold a patron from the Blade template")
    ap.add_argument("god", help="path key, lowercase: crown, wall, forge, salvage, art")
    ap.add_argument("--actor", required=True, help="entity id the god sends")
    ap.add_argument("--counter", default="TODO", help="what its counter measures")
    ap.add_argument("--name", default=None, help='display name, e.g. "The False King"')
    ap.add_argument("--colour", default="§4§l", help="chat colour code")
    ap.add_argument("--medium-at", type=int, default=50)
    ap.add_argument("--high-at", type=int, default=200)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    god = a.god.lower()
    if not re.fullmatch(r"[a-z][a-z_]{1,15}", god):
        print(f"  bad god key {god!r} - lowercase letters and underscores only")
        return 1

    if god in RETIRED:
        print(f"  🚫 REFUSING - {god} is RETIRED.")
        print(f"     {RETIRED[god]}")
        print(f"     Live paths: {', '.join(LIVE_PATHS)}")
        return 1

    if god not in LIVE_PATHS:
        print(f"  ⚠️  {god!r} is not one of the five live paths:")
        print(f"     {', '.join(LIVE_PATHS)}")
        print("     Scaffolding it anyway - but if you meant one of the above, stop now.")
    name = a.name or god.capitalize()

    files = {
        SS / f"{god}_voice.js": voice_js(god, name, a.counter, a.colour,
                                         a.medium_at, a.high_at),
        SS / f"{god}_events.js": events_js(god, name, a.actor, a.colour),
    }

    # Refuse to overwrite. A scaffolder that clobbers a written god is a disaster
    # with no undo, and this repo has no lock on the working tree.
    existing = [p for p in files if p.exists()]
    if existing and not a.dry_run:
        print("  REFUSING - these already exist:")
        for p in existing:
            print(f"    {p.relative_to(REPO)}")
        print("  Delete them yourself if you really mean to regenerate.")
        return 1

    for p, body in files.items():
        if a.dry_run:
            print(f"\n{'=' * 78}\n{p.relative_to(REPO)}  ({len(body.splitlines())} lines)\n{'=' * 78}")
            print(body)
        else:
            p.write_text(body, encoding="utf-8")
            print(f"  wrote {p.relative_to(REPO)}  ({len(body.splitlines())} lines)")

    if not a.dry_run:
        print(f"\n  {name} scaffolded. {len(POOLS)} EMPTY line pools - it will boot and")
        print(f"  say so: '[{god}] 0 of {len(POOLS)} pools written - THIS GOD HAS NO VOICE YET'")
        print("\n  Next, from docs/41-BUILDING-A-GOD.md §2:")
        print("    ① the character brief   ② the counter metric   ⑤ docs/28 + gen_scenes.py")
        print("    ⑨ rows in fall/regard/help/paths/coefficients")
        print("    ⑩ sync_scripts.py --deploy && serverctl.py restart && logq.py errors")
    return 0


if __name__ == "__main__":
    sys.exit(main())
