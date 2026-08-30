# -*- coding: utf-8 -*-
"""bicker_import.py — Ethan's bickering documents into scenes the game can play.

    python tools/bicker_import.py                 # parse and report, write nothing
    python tools/bicker_import.py --write         # emit bicker_scenes.js
    python tools/bicker_import.py --show <pair>   # print one pair's parsed scenes

⭐ WHY A GENERATOR AND NOT HAND-AUTHORED DATA
---------------------------------------------
`docs/dialogue/Bickering Doc *.txt` is where Ethan WRITES. He is still editing them, and
he will edit them again. A hand-copied JS version would be a second copy of his prose that
drifts the moment he touches the source — and the drift would be invisible, because both
files would read fine.

⚠️ THIS IS THE OPPOSITE CASE TO `dialogue_doc.py`, deliberately. That tool refuses to write
back into scripts, because the scripts are the source and the document is a view. Here the
DOCUMENT is the source and the script is the view. Never let those two get confused.

── THE FORMAT, AS HE DESCRIBED IT ────────────────────────────────────────────
    "Dialogue is alternating between gaps. Chunked dialogued is only separated by a
     single new line. ... Dialogue is separated by ---"

So, precisely:
  · a SECTION header sets trust tier and who must be present:  `Med Trust (God Wall)`
  · `---` separates SCENES
  · a BLANK LINE separates TURNS (the speaker changes)
  · a SINGLE NEWLINE inside a turn is a CHUNK — one speaker, delivered as separate beats

🔑 THE CHUNK DISTINCTION IS THE WHOLE PACING. Wall's seven-line lament is ONE turn in
seven chunks; it must arrive as seven quick beats, not seven turns two and a half seconds
apart. That is why chunks and turns carry different gaps downstream.

── ⚠️ THREE THINGS THE DOCUMENTS DO INCONSISTENTLY ───────────────────────────
1. `Blade+Art` HAS NO SPEAKER LABELS AT ALL. It is pure alternation, so the parser needs
   to be told who opens — see STARTS. Everywhere else labels are explicit.
2. `Forge+Blade` writes `Champion - Forge` where every other file writes `God Forge`.
   Same meaning, and both are accepted rather than one being "fixed" in his source.
3. Aliases are used freely in labels: `(goat)` is Forge, `(spider)` is Wall.

── 🚨 A PARENTHESIS IS NOT ALWAYS A SPEAKER ─────────────────────────────────
`(sigh)`, `(Louder sigh)` and `(This is my moment!)` are stage directions and lines of
dialogue. Only a parenthesis whose contents NAME A KNOWN GOD is a speaker label. Getting
this wrong silently eats a line of his writing, which is the one failure that would look
like an authoring mistake rather than a parser bug.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs", "dialogue")
OUT = os.path.join(ROOT, "pack", "kubejs", "server_scripts", "bicker_scenes.js")

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# Every name a speaker label may use, mapped to the god id the engine knows.
ALIASES = {
    "art": "art", "matriarch": "art", "matry": "art",
    "blade": "blade", "warrior": "blade",
    "wall": "wall", "spider": "wall",
    "forge": "forge", "goat": "forge",
    "salvage": "salvage", "hound": "salvage",
}

# ⚠️ Blade+Art carries no labels. Ethan's text makes the opener unambiguous — Art speaks
# first in every scene ("I approve of your work, Warrior." / "Thank you, my Matriarch") —
# but it is an ASSUMPTION and it is recorded here rather than buried in the parser.
#
# ⚠️ ONLY CONSULTED WHEN A SCENE HAS NO LABELS AT ALL. Where even one turn is labelled,
# the speakers are read out of the document itself (see the second pass below) and this
# table is not used — so an entry here can never override his own markup.
#
# Each one is an assumption, and the evidence for it is written down:
STARTS = {
    # Blade+Art carries no labels anywhere. Art opens every scene, and the text says so
    # unambiguously — "I approve of your work, Warrior." / "Thank you, my Matriarch."
    "art+blade": "art",

    # Wall+Forge is labelled almost throughout; exactly two scenes have none, and both
    # open with Wall:
    #   · "I would like to request support from your champion, Goat." — addressed TO the
    #     Goat, so the speaker is not him.
    #   · "I wish you'd understand. My pain." — answered by "This might be a bit above my
    #     paygrade", which is Forge's register and nobody else's.
    "forge+wall": "wall",
}

TIERS = {"low": "low", "med": "med", "high": "high"}

_HEAD = re.compile(
    r'^\s*(Low|Med|High)\s*[Tt]rust\s*(?:\(\s*(?:God|Champion\s*-)?\s*([A-Za-z]+)\s*\))?\s*$',
    re.I)
_SEP = re.compile(r'^\s*-{3,}\s*$')
_LABEL = re.compile(r'\(\s*([A-Za-z]+)\s*\)')


def pair_of(filename):
    m = re.search(r'Bickering Doc (\w+)\+(\w+)', filename)
    if not m:
        return None
    a, b = m.group(1).lower(), m.group(2).lower()
    return tuple(sorted([ALIASES.get(a, a), ALIASES.get(b, b)]))


def strip_label(line):
    """Return (text, god_or_None). Only a KNOWN god name counts as a label."""
    found = None
    for m in _LABEL.finditer(line):
        name = m.group(1).lower()
        if name in ALIASES:
            found = ALIASES[name]
            line = line[:m.start()] + line[m.end():]
            break
    return line.strip(), found


def parse(path):
    raw = io.open(path, encoding="utf-8").read().replace("\r\n", "\n")
    lines = raw.split("\n")
    name = os.path.basename(path)
    pair = pair_of(name)
    if not pair:
        return None, ["filename does not name a pair"]

    problems = []
    scenes = []
    tier = None
    needs = None          # None == agnostic
    # current scene accumulator: list of turns; a turn is (god_or_None, [chunks])
    cur = []
    buf = []

    def flush_turn():
        if buf:
            text = [b for b in buf if b.strip()]
            if text:
                cur.append(text)
            del buf[:]

    def flush_scene():
        flush_turn()
        if cur:
            scenes.append({"tier": tier, "needs": needs, "turns": list(cur)})
        del cur[:]

    # ⚠️ Skip the header paragraph: every file repeats the same format explanation, and
    # one of them (Forge+Art) says it is "for wall and blade" — a copy-paste in his
    # source, harmless to the meaning and NOT corrected here. His file, his words.
    started = False

    for ln in lines:
        h = _HEAD.match(ln)
        if h:
            flush_scene()
            started = True
            tier = TIERS[h.group(1).lower()]
            who = (h.group(2) or "agnostic").lower()
            needs = None if who.startswith("agnostic") else ALIASES.get(who)
            if who != "agnostic" and not needs:
                problems.append("unknown gate %r in %s" % (who, name))
            continue
        if not started:
            continue
        if _SEP.match(ln):
            flush_scene()
            continue
        if not ln.strip():
            flush_turn()
            continue
        buf.append(ln.rstrip())
    flush_scene()

    # ── assign a speaker to every turn ────────────────────────────────────────
    start = STARTS.get("+".join(sorted(pair)))
    out = []
    for sc in scenes:
        # First pass: strip labels, keep whoever was named. `None` = not yet known.
        rows = []
        for chunks in sc["turns"]:
            god = None
            clean = []
            for c in chunks:
                t, g = strip_label(c)
                if g and god is None:
                    god = g
                if t:
                    clean.append(t)
            if clean:
                rows.append([god, clean])

        # ⭐⭐ SECOND PASS: FILL THE GAPS BY ALTERNATING FROM THE NEAREST KNOWN SPEAKER,
        # LOOKING BOTH WAYS.
        #
        # 🔴 The first version alternated FORWARD from the pair's alphabetical first, and
        # it was wrong on two of three mixed scenes. Wall+Forge opens with *"I would like
        # to request support from your champion, Goat."* — the speaker is addressing the
        # Goat, so it is WALL, and forward-alternation confidently said Forge.
        #
        # 🔑 The turn AFTER an unlabelled one is usually labelled, and speakers alternate,
        # so the answer is already in the document — it just has to be read backwards. A
        # guess anchored to real data beats a guess anchored to filename order.
        known = [i for i, r in enumerate(rows) if r[0]]
        if known:
            for i in range(len(rows)):
                if rows[i][0]:
                    continue
                # nearest labelled turn, ties going forward (the next line names itself)
                j = min(known, key=lambda k: (abs(k - i), k < i))
                other = pair[0] if rows[j][0] == pair[1] else pair[1]
                rows[i][0] = rows[j][0] if (abs(j - i) % 2 == 0) else other
        else:
            # ⚠️ NOTHING in this scene is labelled — Blade+Art is written this way
            # throughout. Falls back to the declared opener, which is an assumption and
            # is recorded in STARTS rather than buried here.
            if not start:
                problems.append('%s: a %s/%s scene has no speaker labels at all and no '
                                'declared opener - cannot assign speakers. Opens: "%s"'
                                % (name, sc["tier"], sc["needs"] or "agnostic",
                                   rows[0][1][0][:60] if rows else "(empty)"))
                continue
            cur_g = start
            for r in rows:
                r[0] = cur_g
                cur_g = pair[0] if cur_g == pair[1] else pair[1]

        turns = [{"god": g, "chunks": c} for g, c in rows]
        if len(turns) < 2:
            # 🚨 A one-sided exchange is the exact failure broadcast.js refuses to send.
            problems.append("%s: dropped a %s/%s scene with %d turn(s) - an exchange "
                            "needs two voices" % (name, sc["tier"],
                                                  sc["needs"] or "agnostic", len(turns)))
            continue
        out.append({"pair": list(pair), "tier": sc["tier"], "needs": sc["needs"],
                    "turns": turns})
    return out, problems


def main():
    write = "--write" in sys.argv
    show = None
    if "--show" in sys.argv:
        i = sys.argv.index("--show")
        if i + 1 < len(sys.argv):
            show = sys.argv[i + 1].lower()

    files = sorted(f for f in os.listdir(DOCS)
                   if f.startswith("Bickering Doc ") and f.endswith(".txt"))
    if not files:
        sys.stderr.write("no bickering documents in %s\n" % DOCS)
        return 2

    allscenes = []
    allproblems = []
    print("Ethan's bickering documents")
    print("=" * 78)
    for f in files:
        scenes, probs = parse(os.path.join(DOCS, f))
        if scenes is None:
            allproblems += ["%s: %s" % (f, p) for p in probs]
            continue
        allscenes += scenes
        allproblems += probs
        turns = sum(len(s["turns"]) for s in scenes)
        chunks = sum(len(t["chunks"]) for s in scenes for t in s["turns"])
        gated = sum(1 for s in scenes if s["needs"])
        print("  %-14s %2d scenes · %3d turns · %3d chunks · %d gated by champion"
              % (f[14:-4], len(scenes), turns, chunks, gated))

    print()
    by_tier = {}
    for s in allscenes:
        by_tier[s["tier"]] = by_tier.get(s["tier"], 0) + 1
    print("  by trust tier: " + " · ".join("%s %d" % (k, by_tier.get(k, 0))
                                           for k in ("low", "med", "high")))
    print("  TOTAL %d scenes, %d turns, %d chunks"
          % (len(allscenes), sum(len(s["turns"]) for s in allscenes),
             sum(len(t["chunks"]) for s in allscenes for t in s["turns"])))

    if allproblems:
        print()
        print("  ⚠️ %d thing(s) the parser could not do cleanly:" % len(allproblems))
        for p in allproblems:
            print("     " + p)

    if show:
        print()
        for s in allscenes:
            if show not in "+".join(s["pair"]):
                continue
            print("── %s/%s %s ──" % (s["tier"], s["needs"] or "agnostic",
                                      "+".join(s["pair"])))
            for t in s["turns"]:
                print("   %-8s %s" % (t["god"], " ¦ ".join(t["chunks"])[:150]))
            print()

    if not write:
        print()
        print("report only. --write emits %s" % os.path.relpath(OUT, ROOT))
        return 1 if allproblems else 0

    emit(allscenes)
    print()
    print("wrote %s" % os.path.relpath(OUT, ROOT))
    return 0


HEADER = '''// bicker_scenes.js — GENERATED. Do not edit by hand.
//
//     python tools/bicker_import.py --write
//
// ⭐ THE SOURCE IS `docs/dialogue/Bickering Doc *.txt`, which is where Ethan writes. This
// file is a VIEW of those documents, regenerated whenever he edits them. Editing it
// directly makes a second copy of his prose that drifts silently, because both would read
// perfectly well.
//
// ⚠️ NOTE THE DIRECTION, it is the opposite of `dialogue_doc.py`: there the SCRIPT is the
// source and the document is the view. Here the DOCUMENT is the source. Confusing the two
// loses somebody's writing.
//
// ── WHAT A SCENE IS ──────────────────────────────────────────────────────────
//   pair    the two gods talking
//   tier    low | med | high — the trust required to overhear it
//   needs   null = plays for anyone; a god id = a champion of THAT god must be online
//   turns   [{god, chunks:[…]}] — a turn is one speaker; chunks are their beats
//
// 🔑 CHUNKS ARE NOT TURNS. Ethan: *"Chunked dialogued is only separated by a single new
// line."* Wall's seven-line lament is ONE turn in seven chunks and must arrive as seven
// quick beats, not seven exchanges. bicker.js gives them different gaps.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var SCENES = '''

FOOTER = '''

  VELDORA.bickerScenes = {
    all: function () { return SCENES },
    count: function () { return SCENES.length },
  }
})();
'''


def emit(scenes):
    body = json.dumps(scenes, ensure_ascii=False, indent=2)
    # ⚠️ Rhino is happy with JSON as an object literal; keep it exactly that and do not
    # hand-format it into something that can drift from what the parser produced.
    body = "\n".join(("  " + l) if i else l for i, l in enumerate(body.split("\n")))
    with io.open(OUT, "w", encoding="utf-8", newline="") as fh:
        fh.write(HEADER + body + FOOTER)


if __name__ == "__main__":
    sys.exit(main())
