# -*- coding: utf-8 -*-
"""caebrim_import.py — Ethan's Caebrim document into pools and scenes.

    python tools/caebrim_import.py            # parse and report, write nothing
    python tools/caebrim_import.py --write    # emit caebrim_lines.js
    python tools/caebrim_import.py --show     # print everything parsed

⭐ SAME DIRECTION AS bicker_import.py: `docs/dialogue/Caebrim (Speaker Dialogue).txt` is
where Ethan writes, and the .js is a regenerated VIEW of it. Hand-copying his prose makes
a second copy that drifts silently, because both read fine.

── THE DOCUMENT'S OWN HEADER IS A SPEC, AND IT IS OBEYED ─────────────────────
    "she shares same font as Wall. Always Red. Always in random areas across your
     screen. Tide announcements are in the middle. Trust is essentially tide power
     level."

🔑 THE LAST SENTENCE IS THE ONE THAT MATTERS HERE. Her "trust" is NOT a god counter — it
is TIDE POWER. So her low/med/high whispers are gated on how bad the tide is, not on any
relationship. She is the only speaker in the game whose register tracks the world's state
rather than a player's.

── WHAT THE SECTIONS BECOME ──────────────────────────────────────────────────
    Whispers (low/Med/High Trust)   -> whisper pools, keyed by tide power
    Tide                            -> the wave announcing itself
    Tide in progress                -> taunts while it runs
    Tide end.                       -> what she says when it is over
    God Dialogue -> Blade/Wall/     -> authored SCENES between her and that god,
                    Forge/Art          high trust only, "at any time"

⚠️ CHUNKING IS THE SAME RULE AS THE BICKERING DOCS. A blank line separates entries; a
single newline inside one is a BEAT. "You are growing. / Strong. / But not even close to
enough." is ONE whisper in three beats, and splitting or merging them overrules the
writing.

🚨 "God specific Whispers" IS A MISLEADING HEADING IN HIS SOURCE — the three subsections
under it (Tide / Tide in progress / Tide end) are TIDE-PHASE pools, not per-god. Parsed as
what they are, and his heading is left alone; it is his document.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(ROOT, "docs", "dialogue", "Caebrim (Speaker Dialogue).txt")
OUT = os.path.join(ROOT, "pack", "kubejs", "server_scripts", "caebrim_lines.js")

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

GODS = {"blade": "blade", "wall": "wall", "forge": "forge", "art": "art",
        "salvage": "salvage"}
# Labels inside her scenes. She names herself; the gods use their own names.
SPEAKERS = dict(GODS)
SPEAKERS.update({"caebrim": "caebrim", "spider": "wall", "goat": "forge",
                 "matriarch": "art", "warrior": "blade"})

_WHISPER = re.compile(r'^\s*Whispers?\s*\(\s*(low|med|high)\s*trust\s*\)\s*$', re.I)
_TIDE = re.compile(r'^\s*Tide(\s+in\s+progress)?\.?\s*$', re.I)
_TIDE_END = re.compile(r'^\s*Tide\s+end\.?\s*$', re.I)
_GODHEAD = re.compile(r'^\s*(Blade|Wall|Forge|Art|Salvage)\s*$', re.I)
_GODSEC = re.compile(r'^\s*God\s+Dialogue', re.I)
_GSWHIS = re.compile(r'^\s*God\s+specific\s+Whispers\s*$', re.I)
_SEP = re.compile(r'^\s*-{3,}\s*$')
_LABEL = re.compile(r'\(\s*([A-Za-z]+)\s*\)')


def strip_label(line):
    for m in _LABEL.finditer(line):
        name = m.group(1).lower()
        if name in SPEAKERS:
            return (line[:m.start()] + line[m.end():]).strip(), SPEAKERS[name]
    return line.strip(), None


def parse():
    raw = io.open(DOC, encoding="utf-8").read().replace("\r\n", "\n")
    lines = raw.split("\n")

    out = {"whispers": {"low": [], "med": [], "high": []},
           "tide": {"start": [], "during": [], "end": []},
           "scenes": []}
    problems = []

    mode = None          # ('whisper', key) | ('tide', key) | ('scene', god)
    entries = []         # list of chunk-lists for the current section
    buf = []
    scene_turns = []
    in_gods = False

    def flush_entry():
        if buf:
            e = [b for b in buf if b.strip()]
            if e:
                entries.append(e)
            del buf[:]

    def close_scene(god):
        """A scene is only kept if it has two voices - a monologue is not an exchange."""
        if not scene_turns:
            return
        turns, last = [], None
        rows = []
        for chunks in scene_turns:
            g, clean = None, []
            for c in chunks:
                t, who = strip_label(c)
                if who and g is None:
                    g = who
                if t:
                    clean.append(t)
            if clean:
                rows.append([g, clean])
        # fill unlabelled turns by alternating from the nearest labelled one
        known = [i for i, r in enumerate(rows) if r[0]]
        if known:
            for i in range(len(rows)):
                if rows[i][0]:
                    continue
                j = min(known, key=lambda k: (abs(k - i), k < i))
                other = "caebrim" if rows[j][0] == god else god
                rows[i][0] = rows[j][0] if (abs(j - i) % 2 == 0) else other
        else:
            problems.append("a %s scene has no labels at all - dropped" % god)
            del scene_turns[:]
            return
        turns = [{"god": g, "chunks": c} for g, c in rows]
        if len(turns) < 2:
            problems.append("a %s scene had one voice - dropped" % god)
        else:
            out["scenes"].append({"god": god, "turns": turns})
        del scene_turns[:]

    def close_section():
        flush_entry()
        if mode and mode[0] == "whisper":
            out["whispers"][mode[1]] += entries
        elif mode and mode[0] == "tide":
            out["tide"][mode[1]] += entries
        del entries[:]

    i = 0
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()

        if _GSWHIS.match(ln):
            close_section()
            mode = None
            i += 1
            continue
        if _GODSEC.match(ln):
            close_section()
            if mode and mode[0] == "scene":
                close_scene(mode[1])
            mode = None
            in_gods = True
            i += 1
            continue

        m = _WHISPER.match(ln)
        if m:
            close_section()
            mode = ("whisper", m.group(1).lower())
            i += 1
            continue
        if _TIDE_END.match(ln):
            close_section()
            mode = ("tide", "end")
            i += 1
            continue
        m = _TIDE.match(ln)
        if m and not in_gods:
            close_section()
            mode = ("tide", "during" if m.group(1) else "start")
            i += 1
            continue

        m = _GODHEAD.match(ln)
        if m and in_gods:
            if mode and mode[0] == "scene":
                flush_entry()
                for e in entries:
                    scene_turns.append(e)
                del entries[:]
                close_scene(mode[1])
            mode = ("scene", GODS[m.group(1).lower()])
            i += 1
            continue

        if _SEP.match(ln):
            if mode and mode[0] == "scene":
                flush_entry()
                for e in entries:
                    scene_turns.append(e)
                del entries[:]
                close_scene(mode[1])
            else:
                flush_entry()
            i += 1
            continue

        if not s:
            flush_entry()
            i += 1
            continue

        if mode:
            buf.append(ln.rstrip())
        i += 1

    # tail
    if mode and mode[0] == "scene":
        flush_entry()
        for e in entries:
            scene_turns.append(e)
        del entries[:]
        close_scene(mode[1])
    else:
        close_section()

    return out, problems


HEADER = '''// caebrim_lines.js — GENERATED. Do not edit by hand.
//
//     python tools/caebrim_import.py --write
//
// ⭐ THE SOURCE IS `docs/dialogue/Caebrim (Speaker Dialogue).txt`. This file is a VIEW of
// it, regenerated whenever Ethan edits. Editing here makes a second copy of his prose
// that drifts silently.
//
// ── 🔑 HER "TRUST" IS TIDE POWER, NOT A RELATIONSHIP ─────────────────────────
// His header: *"Trust is essentially tide power level."* So low/med/high below are gated
// on how bad the tide is, not on anything a player has earned. She is the only speaker in
// the game whose register tracks the WORLD'S state rather than a player's.
//
// ── WHAT IS IN HERE ──────────────────────────────────────────────────────────
//   whispers  low | med | high      what she mutters, by tide power
//   tide      start | during | end  the wave announcing itself, taunting, and finishing
//   scenes    [{god, turns}]        authored exchanges between her and one god,
//                                   high trust, "at any time"
//
// ⚠️ CHUNKS ARE BEATS, not lines. A single newline in his document is a deliberate beat
// and is delivered by voice.speakChunks, exactly like the bickering scenes.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var DATA = '''

FOOTER = '''

  VELDORA.caebrimLines = {
    whispers: function (k) { return (DATA.whispers && DATA.whispers[k]) || [] },
    tide: function (k) { return (DATA.tide && DATA.tide[k]) || [] },
    scenes: function () { return DATA.scenes || [] },
    all: function () { return DATA },
  }
})();
'''


def main():
    write = "--write" in sys.argv
    show = "--show" in sys.argv
    if not os.path.isfile(DOC):
        sys.stderr.write("no document at %s\n" % DOC)
        return 2

    data, problems = parse()

    print("Caebrim (Speaker Dialogue)")
    print("=" * 78)
    for k in ("low", "med", "high"):
        w = data["whispers"][k]
        print("  whispers %-5s %2d entries, %3d beats" % (k, len(w), sum(len(e) for e in w)))
    for k, label in (("start", "tide start"), ("during", "tide during"), ("end", "tide end")):
        t = data["tide"][k]
        print("  %-16s %2d entries, %3d beats" % (label, len(t), sum(len(e) for e in t)))
    bygod = {}
    for sc in data["scenes"]:
        bygod[sc["god"]] = bygod.get(sc["god"], 0) + 1
    print("  scenes          %2d across %s"
          % (len(data["scenes"]), ", ".join("%s %d" % kv for kv in sorted(bygod.items()))))

    if problems:
        print()
        print("  ⚠️ %d problem(s):" % len(problems))
        for p in problems:
            print("     " + p)

    if show:
        print()
        for k in ("low", "med", "high"):
            for e in data["whispers"][k]:
                print("  whisper/%-4s %s" % (k, " ¦ ".join(e)[:110]))
        for k in ("start", "during", "end"):
            for e in data["tide"][k]:
                print("  tide/%-6s  %s" % (k, " ¦ ".join(e)[:110]))
        for sc in data["scenes"]:
            print("  ── caebrim + %s ──" % sc["god"])
            for t in sc["turns"]:
                print("     %-8s %s" % (t["god"], " ¦ ".join(t["chunks"])[:110]))

    if not write:
        print()
        print("report only. --write emits %s" % os.path.relpath(OUT, ROOT))
        return 1 if problems else 0

    body = json.dumps(data, ensure_ascii=False, indent=2)
    body = "\n".join(("  " + l) if i else l for i, l in enumerate(body.split("\n")))
    with io.open(OUT, "w", encoding="utf-8", newline="") as fh:
        fh.write(HEADER + body + FOOTER)
    print()
    print("wrote %s" % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
