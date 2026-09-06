"""Turn Ethan's Ank dialogue into the two things that consume it.

    python tools/ank_dialogue_import.py            parse and report, write nothing
    python tools/ank_dialogue_import.py --write    emit both artifacts

    docs/dialogue/ANK Act 0 - Dialogue.txt
        -> tools/.cache/ank_dialog.json          the intro tree, for the preset
        -> pack/kubejs/server_scripts/ank_lines.js   greetings, for ank.js

⭐ ONE SOURCE, TWO SURFACES, AND THE SPLIT IS NOT ARBITRARY. The intro tree BRANCHES —
the player picks a reply — and that is Easy NPC's dialogue system, which has buttons.
The day greetings and trade quotes do not branch and are chosen by WORLD DAY, which Easy
NPC cannot condition on (it has TIME_OF_DAY, not "day 4 of this world"). So they run
through our own layer, keyed by the day we already track.

⚠️ A BLANK DAY IS NOT A GAP. Ethan, 2026-09-05: *"i left some days of dialogue blank
because well there's nothing to say. we start the player's journey before the tides even
became a thing. so... this is also why i built alot of randomized trade dialogue aswell."*

⇒ So a day with no line falls back to the GENERAL POOL. ⛔ Do not write filler for the
  blank days and do not report them as missing - they are answered by the rotation, and
  treating them as a TODO would invite exactly the placeholder text he does not want.

⛔ HIS TEXT IS COPIED, NEVER EDITED. Typos, ellipses and the em-dash mid-word in the day-2
line are his and they are the performance. `--typos` reports; nothing is corrected.
"""
import io
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "docs", "dialogue", "ANK Act 0 - Dialogue.txt")
CACHE = os.path.join(HERE, ".cache")
JSON_OUT = os.path.join(CACHE, "ank_dialog.json")
JS_OUT = os.path.join(ROOT, "pack", "kubejs", "server_scripts", "ank_lines.js")

MAX_DAY = 7


def quoted(line):
    """Every spoken line in his document is inside double quotes. ⚠️ A line that is NOT
    quoted is a heading or a note, and must never reach the game."""
    m = re.findall(r'"([^"]+)"', line)
    return m


def parse(text):
    """
    His shape, and it is stable enough to parse rather than ask him to reformat:

        A "..."                  Ank opens
        P "..."                  a player option
          "..."                  ANOTHER option sharing the same reply
        A: "..."                 his reply - one line per turn
        ---                      end of branch, or a separator in the general pool
        Day N:                   a day heading, quoted lines beneath it

    🔴 TWO THINGS THE FIRST VERSION GOT WRONG, both of which misrepresented his writing:

    1. A BARE QUOTED LINE AFTER `P` IS ANOTHER OPTION, NOT ANK'S REPLY. He writes
       "I am going down into the depths" and "I am going to gather ores" on consecutive
       lines - two ways of saying the same thing, one answer. Filing the second as one of
       Ank's lines put a player line in Ank's mouth.

    2. `---` SEPARATES GENERAL QUOTES INTO GROUPS. "Hey buddy, Got what you need in this
       cloak." and "...No, its not a magical coat." are ONE greeting delivered as two
       beats, not two greetings. Flattening them loses the joke.
    """
    out = {"intro": {"open": [], "branches": []}, "days": {}, "general": []}
    section = "intro"
    day = None
    pending = []        # player options awaiting a reply
    reply_for = None    # the branches the current A: block answers
    group = []          # the general quote being accumulated

    def flush_group():
        if group:
            out["general"].append(list(group))
            del group[:]

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        low = line.lower()

        if low.startswith("general trade quotes"):
            flush_group()
            section, day, reply_for = "general", None, None
            continue

        m = re.match(r"^(?:trade\s+)?day\s*(\d+)\s*:?\s*$", low)
        if m:
            flush_group()
            section, reply_for = "days", None
            day = int(m.group(1))
            # ⚠️ Day 3 appears TWICE in his file. setdefault keeps whatever the first
            # heading collected, so a duplicate cannot silently wipe it.
            out["days"].setdefault(day, [])
            continue

        if line.startswith("---") or line == "[END]":
            if section == "general":
                flush_group()
            else:
                reply_for = None
                pending = []
            continue

        if low.startswith("introduction tree"):
            continue

        qs = quoted(line)
        if not qs:
            continue

        if section == "general":
            group.extend(qs)
            continue

        if section == "days":
            if day is not None:
                out["days"][day].extend(qs)
            continue

        # ── the intro tree ──────────────────────────────────────────────────
        is_ank = bool(re.match(r"^A\s*:", line) or re.match(r"^A\s+[\"']", line))
        is_player = bool(re.match(r"^P\s+[\"']", line))

        if is_ank:
            if not out["intro"]["branches"] and not pending:
                out["intro"]["open"].extend(qs)     # his opening, before any choice
                continue
            if pending:
                # ⭐ ONE REPLY, SHARED BY EVERY OPTION THAT LED HERE.
                reply_for = [{"choice": c, "reply": []} for c in pending]
                out["intro"]["branches"].extend(reply_for)
                pending = []
            if reply_for:
                for br in reply_for:
                    br["reply"].extend(qs)
            continue

        if is_player:
            reply_for = None
            pending.extend(qs)
            continue

        # a bare quoted line: another option if we are collecting them, else his reply
        if pending:
            pending.extend(qs)
        elif reply_for:
            for br in reply_for:
                br["reply"].extend(qs)

    flush_group()
    return out


def esc(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')


def emit_js(d):
    days = d["days"]
    L = []
    L.append("// ank_lines.js - GENERATED from docs/dialogue/ANK Act 0 - Dialogue.txt.")
    L.append("// ⛔ Do not hand-edit. Edit his document and re-run:")
    L.append("//     python tools/ank_dialogue_import.py --write")
    L.append("//")
    L.append("// ⚠️ A BLANK DAY IS NOT A GAP. Ethan: *\"i left some days of dialogue blank")
    L.append("// because well there's nothing to say... this is also why i built alot of")
    L.append("// randomized trade dialogue aswell.\"* A day with no line falls through to")
    L.append("// GENERAL, and that is the design rather than an omission.")
    L.append("//")
    L.append("// ⛔ HIS TEXT IS VERBATIM. The em-dash mid-word on day 2 is him being")
    L.append("// interrupted by his own argument; it is the performance, not a typo.")
    L.append("var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};")
    L.append("")
    L.append(";(function () {")
    L.append("  var DAYS = {")
    for day in sorted(days):
        if not days[day]:
            continue
        L.append("    %d: [" % day)
        for line in days[day]:
            L.append('      "%s",' % esc(line))
        L.append("    ],")
    L.append("  }")
    L.append("")
    # ⭐ EACH GENERAL QUOTE IS A LIST OF BEATS, not a string. Two of his are a setup and
    # a punchline - "Got what you need in this cloak" / "...No, its not a magical coat."
    # Flattening them into separate greetings loses the joke entirely.
    L.append("  var GENERAL = [")
    for grp in d["general"]:
        L.append("    [" + ", ".join('"%s"' % esc(x) for x in grp) + "],")
    L.append("  ]")
    L.append("")
    L.append("  VELDORA.ankLines = {")
    L.append("    days: DAYS,")
    L.append("    general: GENERAL,")
    L.append("    /**")
    L.append("     * What Ank says on a given world day.")
    L.append("     *")
    L.append("     * ⭐ A DAY WITH NOTHING WRITTEN FALLS BACK TO THE ROTATION, deliberately.")
    L.append("     * Returns { lines, source } so a caller can tell a written day from the")
    L.append("     * general pool - 'he had nothing special today' and 'nobody wrote day 5'")
    L.append("     * are the same output and must not be the same REPORT.")
    L.append("     */")
    L.append("    forDay: function (day) {")
    L.append("      var d = DAYS[day]")
    L.append("      if (d && d.length) return { lines: d, source: 'day' }")
    L.append("      var g = GENERAL[Math.floor(Math.random() * GENERAL.length)] || []")
    L.append("      return { lines: g, source: 'general' }")
    L.append("    },")
    L.append("    written: function () {")
    L.append("      var n = 0")
    L.append("      for (var k in DAYS) if (DAYS.hasOwnProperty(k) && DAYS[k].length) n++")
    L.append("      return n")
    L.append("    },")
    L.append("  }")
    L.append("")
    L.append("  ServerEvents.loaded(function () {")
    L.append("    console.info('[ank] ' + VELDORA.ankLines.written() + ' written day(s), ' +")
    L.append("      GENERAL.length + ' general quote(s). Blank days fall back to the rotation.')")
    L.append("  })")
    L.append("})();")
    return "\n".join(L) + "\n"


def main():
    if not os.path.exists(SRC):
        print("no source at " + os.path.relpath(SRC, ROOT))
        return 2
    d = parse(io.open(SRC, encoding="utf-8").read())

    written = sorted(k for k in d["days"] if d["days"][k])
    blank = sorted(k for k in range(MAX_DAY + 1) if k not in written)

    print("intro:    %d opening line(s), %d branch(es)"
          % (len(d["intro"]["open"]), len(d["intro"]["branches"])))
    for b in d["intro"]["branches"]:
        print('   "%s"  -> %d reply line(s)' % (b["choice"][:44], len(b["reply"])))
    print("days:     written %s" % (written or "none"))
    print("          blank   %s  <- these fall back to the rotation, by design"
          % (blank or "none"))
    print("general:  %d quote(s)" % len(d["general"]))

    if "--write" not in sys.argv:
        print("\nreport only. re-run with --write to emit.")
        return 0

    os.makedirs(CACHE, exist_ok=True)
    io.open(JSON_OUT, "w", encoding="utf-8").write(
        json.dumps(d, indent=1, ensure_ascii=False) + "\n")
    io.open(JS_OUT, "w", encoding="utf-8").write(emit_js(d))
    print("\nwrote %s" % os.path.relpath(JSON_OUT, ROOT))
    print("wrote %s" % os.path.relpath(JS_OUT, ROOT))
    print("\n⚠️  re-run `python tools/make_npc_datapack.py` to fold the intro tree "
          "into the preset.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
