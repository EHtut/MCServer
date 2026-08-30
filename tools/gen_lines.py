#!/usr/bin/env python3
"""gen_lines - every line CLAUDE wrote, so Ethan can sweep them.

WHY THIS EXISTS
---------------
Ethan, 2026-08-18: "make a note of all your generated dialogue for refresh from
me because (no offense) your dialogue is mostly placeholder, for ease of refresh."

Fair, and the honest framing is that AI drafts are SCAFFOLDING: they exist so a
mechanic can be built and tested before the writing lands, and they should all be
replaced. The problem was never that they exist - it is that they were
indistinguishable from his own writing once they were in the file.

⚠️ THIS IS GENERATED, NOT MAINTAINED. A hand-kept list of "things to rewrite" is
the first thing to rot: a pool gets renamed, a line gets replaced, and the list
still names it. So the source of truth is a marker IN the code -

    // [CLAUDE-DRAFT] <god>/<tag> · <tag> · ...

- and this tool reads them. Delete the marker when the lines are yours and the
entry disappears from the register on the next run. Same principle as
gen_events.py, which generates docs/48 from the event registrations.

RULES (shared with genq / mcq / lifeq)
-------------------------------------
  * Zero matches says so and says what was searched. A silent empty register
    would read as "nothing left to rewrite", which is the worst possible lie
    for this particular document.
  * READ ONLY.
"""

import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
SS = REPO / "pack" / "kubejs" / "server_scripts"
OUT = REPO / "docs" / "51-LINES-TO-REFRESH.md"
# ⚠️ ANCHORED TO THE START OF A COMMENT. The first version searched anywhere in the
# line, so blade_voice.js:69 - the PROSE sentence "Every one is marked [CLAUDE-DRAFT]
# and appears in" - was reported as a malformed marker forever. Any file that explains
# this convention in its own header will trip an unanchored matcher.
#
# 🔑 And a permanent false positive is how the four REAL ones hid in plain sight: five
# complaints, one of them known noise, so the whole list read as noise. The four deep
# Speaker heralds were genuinely missing from the register for weeks because of it.
MARK = re.compile(r'^\s*//\s*\[CLAUDE-DRAFT\]\s*(.+)$')
# ⚠️ STRICT. The first version split on the separator and took whatever followed,
# so a marker with a trailing sentence produced a "tag" called
# `argue_unanswered  - ALL FIVE are drafts.` and counted its lines as unknown.
# A register that invents tag names is worse than no register.
ENTRY = re.compile(r'^([a-z_0-9]+)/([a-z_0-9]+)(?:\[keep(\d+)\])?$')
POOL = re.compile(r'^\s*([a-z_0-9]+)\s*:\s*\[')


def collect():
    rows = []            # (file, line_no, spec)
    for f in sorted(SS.glob("*.js")):
        try:
            lines = f.read_text(encoding="utf-8").splitlines()
        except Exception:
            continue
        for i, ln in enumerate(lines, 1):
            m = MARK.search(ln)
            if m:
                rows.append((f.name, i, m.group(1).strip()))
    return rows


def count_pool(fname, tag):
    """How many lines are actually in that pool right now."""
    try:
        lines = (SS / fname).read_text(encoding="utf-8").splitlines()
    except Exception:
        return None
    for i, ln in enumerate(lines):
        m = POOL.match(ln)
        if m and m.group(1) == tag:
            n = 0
            for j in range(i + 1, min(i + 60, len(lines))):
                s = lines[j].strip()
                if s.startswith("]"):
                    return n
                if s.startswith("'") or s.startswith('"'):
                    n += 1
            return n
    return None


def main():
    rows = collect()
    tags, bad = [], []
    for fname, lineno, spec in rows:
        for chunk in spec.split("·"):
            chunk = chunk.strip()
            if not chunk:
                continue
            m = ENTRY.match(chunk)
            if not m:
                # Named loudly rather than guessed at - see ENTRY above.
                bad.append("%s:%d  %r" % (fname, lineno, chunk))
                continue
            tags.append((m.group(1), m.group(2), fname, lineno, int(m.group(3) or 0)))
    if bad:
        print("!! %d malformed marker(s) - NOT in the register:" % len(bad))
        for b in bad:
            print("     " + b)

    if not tags:
        print("0 markers found across %d files in %s" % (len(list(SS.glob('*.js'))), SS))
        print("That does NOT mean nothing needs rewriting - it means no")
        print("[CLAUDE-DRAFT] marker was present. Check the convention before")
        print("concluding the register is empty.")
        return 1

    by_god = {}
    for god, tag, fname, lineno, keep in tags:
        by_god.setdefault(god, []).append((tag, fname, lineno, keep))

    total = 0
    out = []
    out.append("# 51 — Lines to refresh *(GENERATED — do not edit by hand)*")
    out.append("")
    out.append("> Ethan, 2026-08-18: *\"make a note of all your generated dialogue for")
    out.append("> refresh from me because (no offense) your dialogue is mostly placeholder,")
    out.append("> for ease of refresh.\"*")
    out.append("")
    out.append("**Every pool below was written by Claude and is awaiting his pass.** They are")
    out.append("scaffolding: they exist so a mechanic could be built, tested and shipped before")
    out.append("the writing landed. All of them should end up replaced.")
    out.append("")
    out.append("Regenerate with `python tools/gen_lines.py`.")
    out.append("")
    out.append("⚠️ **The source of truth is the code, not this file.** Each entry comes from a")
    out.append("`// [CLAUDE-DRAFT] <god>/<tag>` marker in the source. **Delete the marker when")
    out.append("the lines are yours** and the row disappears on the next run — so this register")
    out.append("cannot outlive the thing it describes, which is how every hand-kept TODO list")
    out.append("in this repo has died before.")
    out.append("")
    out.append("---")
    out.append("")
    for god in sorted(by_god):
        rows2 = by_god[god]
        out.append("## %s — %d pool(s)" % (god, len(rows2)))
        out.append("")
        out.append("| tag | to rewrite | ⭐ yours, keep | file |")
        out.append("|---|---:|---:|---|")
        for tag, fname, lineno, keep in rows2:
            n = count_pool(fname, tag)
            mine = None if n is None else max(0, n - keep)
            total += (mine or 0)
            out.append("| `%s` | %s | %s | [`%s:%d`](../pack/kubejs/server_scripts/%s) |"
                       % (tag, "?" if mine is None else mine,
                          keep if keep else "—", fname, lineno, fname))
        out.append("")
    out.append("---")
    out.append("")
    out.append("**%d drafted lines across %d pools.**" % (total, len(tags)))
    out.append("")
    out.append("Ethan's own writing is NOT listed here — his lines carry no marker, which is")
    out.append("the whole point of the convention. Where a pool is mixed (his first line, drafts")
    out.append("after it) the marker says so in the source.")

    OUT.write_text("\n".join(out) + "\n", encoding="utf-8")
    print("wrote %s" % OUT)
    print("  %d pools, %d drafted lines, across %d gods" % (len(tags), total, len(by_god)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
