# -*- coding: utf-8 -*-
"""opening_import.py — Ethan's player intros into the cutscene the game plays.

    python tools/opening_import.py             # parse and report, write nothing
    python tools/opening_import.py --write     # emit opening_lines.js
    python tools/opening_import.py --show      # print every assembled combination

⭐ SAME DIRECTION AS THE OTHER IMPORTERS: `docs/dialogue/Player intros.txt` is where he
writes, and the .js is a regenerated view of it.

── ⭐ IT IS THE SAME FORMAT AS THE BICKERING DOCUMENTS ──────────────────────
🔴 I FIRST WROTE THAT IT WAS A DIFFERENT FORMAT. It is not, and Ethan corrected it:
*"for the format, its the same as the bickering lines. I just didn't want to format it in
the doc."*

🔑 THE BEAT MODEL IS IDENTICAL. A beat is a beat, delivered one after another, exactly as
in the bickering scenes. The only difference is AUTHORING CONVENIENCE: there he broke each
beat onto its own line by hand; here he wrote prose and told the parser where the breaks
are — *"as usual periods mean lines."*

⚠️ So this is not a second format to support. It is the same format with the line-breaking
delegated, and sentence-splitting is how that delegation is honoured. Reading it as
genuinely different would have led somewhere worse than a wrong parse: it would have
justified a second delivery path for content that wants the same one.

── THE SHAPE: MIX AND MATCH, NOT PER-PROFESSION BLOCKS ──────────────────────
    Begin        "You were a traveler,"        one of three
    Mid          the life that follows          one of three
    Story beat   the plague, the woman          FIXED — everyone gets this
    End          waking up                      FIXED
    Story beat   "The world awaits you."        FIXED

⚠️ TWO SECTIONS ARE BOTH TITLED "Story beat". They are parsed BY ORDER, not by name, and
that is not a workaround: the first is the night the doctor came and the second is the
morning after the End. Keying on the title would silently merge them.

── 🔴 ARE Begin AND Mid PAIRED, OR FREELY MIXED? ────────────────────────────
He wrote "these are interchangeable", which reads as free. But they line up by index —
traveler/travelling, fisherman/village, merchant/moving — and two cross-products read
badly: "You were a traveler," + "Traveling from a distant land" is redundant, and "You
were a fisherman," + "never once settling down" argues with having had a village.

⭐ SO IT IS A SWITCH, DEFAULTING TO PAIRED, and the report prints every combination the
current setting produces. Paired gives 3 openings, free gives 9. It is one edit either
way and he can read both before choosing.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(ROOT, "docs", "dialogue", "Player intros.txt")
OUT = os.path.join(ROOT, "pack", "kubejs", "server_scripts", "opening_lines.js")

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# ⭐ DEFAULTS TO PAIRED — see the header. Flip to False for all nine combinations.
PAIRED = True

# Section titles, in the ORDER they appear. The two "Story beat" entries are distinct.
_ORDER = ["begin", "mid", "story1", "end", "story2"]
_HEAD = re.compile(r'^\s*(Begin|Mid|Story beat|End)\b.*$', re.I)


def sentences(text):
    """His rule: a period ends a beat. ⚠️ Also ! and ? — 'Who was that?' is a beat and
    splitting only on '.' would weld it to the line after it."""
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p.strip() for p in parts if p.strip()]


def parse():
    raw = io.open(DOC, encoding="utf-8").read().replace("\r\n", "\n")
    lines = raw.split("\n")

    # Find the section headers in order of appearance.
    marks = []
    for i, ln in enumerate(lines):
        if _HEAD.match(ln) and ln.strip():
            marks.append(i)

    if len(marks) < 5:
        return None, ["expected 5 sections (Begin/Mid/Story beat/End/Story beat), found %d"
                      % len(marks)]

    out, problems = {}, []
    for n, start in enumerate(marks[:5]):
        end = marks[n + 1] if n + 1 < len(marks) else len(lines)
        body = [l for l in lines[start + 1:end] if l.strip()]
        key = _ORDER[n]
        if key in ("begin", "mid"):
            # ⚠️ ONE OPTION PER LINE, and each option then splits into beats.
            #
            # 🔴 The first version stopped at the line break, which left "Traveling from a
            # distant land, you picked up your life an set off. A life of adventure before
            # you." as a SINGLE beat - two beats welded together. A line here is an
            # ALTERNATIVE (one of three lives); the beats inside it are marked by periods,
            # because that is where he delegated the line-breaking. Both apply.
            out[key] = [sentences(l.strip()) for l in body]
        else:
            # A passage. Joined, then split on his rule: periods are beats.
            out[key] = sentences(" ".join(l.strip() for l in body))
    if len(out.get("begin", [])) != len(out.get("mid", [])) and PAIRED:
        problems.append("PAIRED is on but Begin has %d and Mid has %d - they cannot pair"
                        % (len(out.get("begin", [])), len(out.get("mid", []))))
    return out, problems


def combos(d):
    """Every opening the current PAIRED setting can produce."""
    out = []
    if PAIRED:
        for i in range(min(len(d["begin"]), len(d["mid"]))):
            out.append(d["begin"][i] + d["mid"][i])
    else:
        for b in d["begin"]:
            for m in d["mid"]:
                out.append(b + m)
    return out


HEADER = '''// opening_lines.js — GENERATED. Do not edit by hand.
//
//     python tools/opening_import.py --write
//
// ⭐ THE SOURCE IS `docs/dialogue/Player intros.txt`. This is a regenerated view of it.
//
// ── ⭐ THE SAME FORMAT AS THE BICKERING DOCUMENTS ────────────────────────────
// The beat model is identical; only the authoring differs. There he broke each beat onto
// its own line; here he wrote prose and delegated the breaking — *"as usual periods mean
// lines."* Not a second format, and not a second delivery path.
//
// ── THE SHAPE ────────────────────────────────────────────────────────────────
//   begin + mid   the life you had. Interchangeable — see PAIRED in the importer
//   story1        the plague, and the woman with mismatched eyes
//   end           waking up, glad
//   story2        the last line
//
// ⭐ SHE NEVER SPEAKS. "She spoke no words. Made no sounds." — which is not only the best
// line in the passage, it is what makes the whole reveal safe: Alice cannot leak, because
// she has no dialogue anywhere in the opening. docs/40 §0 says a name is the most
// expensive word in the game; this spends none of it.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var DATA = '''

FOOTER = '''

  VELDORA.openingLines = {
    all: function () { return DATA },
    // One assembled opening: a life, then the parts everyone shares.
    build: function (i) {
      var o = DATA.openings
      if (!o || !o.length) return []
      var pick = o[((i % o.length) + o.length) % o.length]
      return pick.concat(DATA.story1, DATA.end, DATA.story2)
    },
    count: function () { return (DATA.openings || []).length },
  }
})();
'''


def main():
    write = "--write" in sys.argv
    show = "--show" in sys.argv
    if not os.path.isfile(DOC):
        sys.stderr.write("no document at %s\n" % DOC)
        return 2

    d, problems = parse()
    if d is None:
        for p in problems:
            sys.stderr.write("  %s\n" % p)
        return 2

    cs = combos(d)
    print("The Opening — player intros")
    print("=" * 78)
    print("  begin      %d option(s)" % len(d["begin"]))
    print("  mid        %d option(s)" % len(d["mid"]))
    print("  story1     %d beat(s)   the plague and the doctor" % len(d["story1"]))
    print("  end        %d beat(s)   waking up" % len(d["end"]))
    print("  story2     %d beat(s)" % len(d["story2"]))
    print()
    per = (len(cs[0]) if cs else 0) + len(d["story1"]) + len(d["end"]) + len(d["story2"])
    print("  %s -> %d distinct opening(s), %d beats each"
          % ("PAIRED" if PAIRED else "FREE MIX", len(cs), per))

    # ⚠️ The length matters and is easy to miss until it is on screen: this is a
    # continuous sequence, not an interruption, so beats add up fast.
    print()
    print("  ⚠️ at the ordinary 12s hold that is %d seconds of cutscene." % (per * 12))
    print("     opening.js gives it its own faster pace for exactly this reason.")

    if problems:
        print()
        for p in problems:
            print("  ⚠️ " + p)

    if show:
        print()
        for n, c in enumerate(cs):
            print("── opening %d ──" % (n + 1))
            for b in c + d["story1"] + d["end"] + d["story2"]:
                print("   " + b)
            print()

    if not write:
        print()
        print("report only. --write emits %s" % os.path.relpath(OUT, ROOT))
        return 1 if problems else 0

    data = {"openings": cs, "story1": d["story1"], "end": d["end"], "story2": d["story2"]}
    body = json.dumps(data, ensure_ascii=False, indent=2)
    body = "\n".join(("  " + l) if i else l for i, l in enumerate(body.split("\n")))
    with io.open(OUT, "w", encoding="utf-8", newline="") as fh:
        fh.write(HEADER + body + FOOTER)
    print()
    print("wrote %s" % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
