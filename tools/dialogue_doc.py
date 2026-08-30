"""dialogue_doc.py — a god's dialogue as an editable document, and back again.

    python tools/dialogue_doc.py extract blade
    python tools/dialogue_doc.py check   blade      # after editing: what changed?

⭐ WHY. Ethan writes the dialogue; the pools live inside 800-line JS files interleaved
with implementation. Asking him to edit those is asking him to work around code. This
pulls every line into one plain document he can write in, and reports exactly what
changed when it comes back.

🔑 IT RUNS THE FILE, IT DOES NOT PARSE IT. The god's pools are local variables inside an
IIFE, so this loads the script with a stubbed `VELDORA.voice` that records every
`register`/`registerLines` call. What lands in the document is therefore exactly what the
GAME receives — not a second reading of the source that can drift from it.

⚠️ The document is the SOURCE for a writing pass, never the source of truth for the
game. Nothing here writes back into the scripts automatically: a regenerated object
literal would throw away the comments around it, and those comments are where the
rulings live. `check` reports the diff and a human applies it.
"""
import io
import json
import os
import re
import subprocess
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SS = os.path.join(REPO, "pack", "kubejs", "server_scripts")
DOCS = os.path.join(REPO, "docs", "dialogue")

# A god -> the file that registers its pools.
FILES = {
    "blade": "blade_voice.js",
    "art": "art_voice.js",
    "forge": "forge_voice.js",
    "salvage": "salvage_voice.js",
    "wall": "wall_voice.js",
}

HARVEST = r"""
const fs = require('fs'), path = require('path')
const SS = process.env.VELDORA_SS
const FILE = process.env.VELDORA_FILE
const out = { whole: {}, frags: {} }

global.VELDORA = { voice: {
  register: (god, tag, opens, closes) => {
    out.frags[tag] = { opens: opens.slice(), closes: closes.slice() }; return true
  },
  registerLines: (god, tag, lines) => { out.whole[tag] = lines.slice(); return true },
  setColour: () => {}, setStyle: () => {}, setGarbled: () => {},
} }
const loaded = []
global.ServerEvents = { loaded: f => loaded.push(f), commandRegistry: () => {}, tick: () => {} }
global.PlayerEvents = { loggedIn: () => {}, loggedOut: () => {}, tick: () => {} }
global.EntityEvents = { death: () => {}, checkSpawn: () => {}, hurt: () => {} }
global.BlockEvents = { placed: () => {}, broken: () => {} }
global.ItemEvents = { rightClicked: () => {}, entityInteracted: () => {} }
global.Text = { of: s => s }
global.Utils = { server: null }
global.Platform = { isLoaded: () => true }

const ri = console.info, rw = console.warn, re2 = console.error
console.info = () => {}; console.warn = () => {}; console.error = () => {}
try {
  ;(0, eval)(fs.readFileSync(path.join(SS, FILE), 'utf8'))
  loaded.forEach(f => { try { f({ server: { players: [] } }) } catch (e) {} })
} finally {
  console.info = ri; console.warn = rw; console.error = re2
}
process.stdout.write(JSON.stringify(out))
"""


def harvest(god):
    """Load the god's script with a recording stub and return what it registered."""
    env = dict(os.environ, VELDORA_SS=SS, VELDORA_FILE=FILES[god])
    r = subprocess.run(["node", "-e", HARVEST], capture_output=True, env=env)
    if r.returncode != 0:
        sys.stderr.write((r.stderr or b"").decode("utf-8", "replace"))
        return None
    try:
        return json.loads((r.stdout or b"").decode("utf-8", "replace"))
    except Exception as e:
        sys.stderr.write("could not read what the script registered: %r\n" % (e,))
        return None


HEADER = """# {Name} — dialogue

> ⭐ **THIS IS YOURS TO WRITE IN.** Edit the lines, add lines, delete lines, rename tags,
> add whole new tags. When you hand it back, `python tools/dialogue_doc.py check {god}`
> reports exactly what changed against what the game currently has.
>
> Generated {stamp} from `pack/kubejs/server_scripts/{file}` by RUNNING it, so every line
> below is a line the game actually registers.

## How to read the two kinds

**WHOLE LINES** — a pool of complete lines. One is picked at random.

**FRAGMENTS** — `opens` and `closes`, drawn from the same tag and joined with a space.
⚠️ **Any open must read correctly against ANY close in the same tag.** That is the one
rule the engine cannot check for you: with {no} opens and {nc} closes a tag makes
{combos} different lines, and every one of them has to work.

## The format, if you add anything

```
## tag_name  (whole)
- a complete line
- another complete line

## tag_name  (fragments)
### opens
- the first half.
### closes
- the second half.
```

---

"""


def write_doc(god, data):
    if not os.path.isdir(DOCS):
        os.makedirs(DOCS)
    path = os.path.join(DOCS, "%s.md" % god)

    no = sum(len(v["opens"]) for v in data["frags"].values()) or 0
    nc = sum(len(v["closes"]) for v in data["frags"].values()) or 0
    combos = sum(len(v["opens"]) * len(v["closes"]) for v in data["frags"].values())
    whole_n = sum(len(v) for v in data["whole"].values())

    import time
    body = HEADER.format(
        Name=god.capitalize(), god=god, file=FILES[god],
        stamp=time.strftime("%Y-%m-%d %H:%M"),
        no=no, nc=nc, combos=combos)

    body += ("**%d whole lines** across %d tags · **%d fragments** across %d tags, "
             "making **%d** possible combined lines.\n\n---\n\n"
             % (whole_n, len(data["whole"]), no + nc, len(data["frags"]), combos))

    if data["whole"]:
        body += "# Whole lines\n\n"
        for tag in sorted(data["whole"]):
            body += "## %s  (whole)\n\n" % tag
            for ln in data["whole"][tag]:
                body += "- %s\n" % ln
            body += "\n"

    if data["frags"]:
        body += "---\n\n# Fragments\n\n"
        for tag in sorted(data["frags"]):
            f = data["frags"][tag]
            body += ("## %s  (fragments)\n\n*%d x %d = %d lines*\n\n"
                     % (tag, len(f["opens"]), len(f["closes"]),
                        len(f["opens"]) * len(f["closes"])))
            body += "### opens\n\n"
            for ln in f["opens"]:
                body += "- %s\n" % ln
            body += "\n### closes\n\n"
            for ln in f["closes"]:
                body += "- %s\n" % ln
            body += "\n"

    tmp = path + ".tmp"
    with io.open(tmp, "w", encoding="utf-8", newline="") as fh:
        fh.write(body)
    os.replace(tmp, path)
    return path, whole_n, no + nc, combos


def read_doc(god):
    """Parse the document back into the same shape harvest() returns."""
    path = os.path.join(DOCS, "%s.md" % god)
    if not os.path.exists(path):
        return None
    out = {"whole": {}, "frags": {}}
    tag = None
    kind = None
    half = None
    # 🔴 SKIP FENCED BLOCKS. The header explains the format WITH AN EXAMPLE, and the
    # first version of this parser read that example as real dialogue — a freshly
    # generated document reported three pools differing from the game it had just been
    # generated from. The instructions must never be parsed as content.
    fenced = False
    for raw in io.open(path, encoding="utf-8"):
        line = raw.rstrip("\n").rstrip("\r")
        if line.startswith("```"):
            fenced = not fenced
            continue
        if fenced:
            continue
        m = re.match(r"^##\s+([A-Za-z0-9_]+)\s+\((whole|fragments)\)\s*$", line)
        if m:
            tag, kind = m.group(1), m.group(2)
            half = None
            if kind == "whole":
                out["whole"].setdefault(tag, [])
            else:
                out["frags"].setdefault(tag, {"opens": [], "closes": []})
            continue
        m = re.match(r"^###\s+(opens|closes)\s*$", line)
        if m and kind == "fragments":
            half = m.group(1)
            continue
        if line.startswith("- ") and tag:
            text = line[2:]
            if kind == "whole":
                out["whole"][tag].append(text)
            elif half:
                out["frags"][tag][half].append(text)
    return out


def check(god):
    live = harvest(god)
    if live is None:
        return 1
    doc = read_doc(god)
    if doc is None:
        print("no document yet - run: python tools/dialogue_doc.py extract %s" % god)
        return 1

    changed = 0

    def cmp_pool(label, a, b):
        """a = in the GAME, b = in the DOCUMENT."""
        nonlocal changed
        added = [x for x in b if x not in a]
        removed = [x for x in a if x not in b]
        if not added and not removed:
            return
        changed += 1
        print("  %s" % label)
        for x in removed:
            print("    - REMOVED  %s" % x)
        for x in added:
            print("    + ADDED    %s" % x)

    print("comparing docs/dialogue/%s.md against what %s registers" % (god, FILES[god]))
    print("=" * 78)

    for tag in sorted(set(list(live["whole"]) + list(doc["whole"]))):
        cmp_pool("%s (whole)" % tag, live["whole"].get(tag, []), doc["whole"].get(tag, []))
    for tag in sorted(set(list(live["frags"]) + list(doc["frags"]))):
        lf = live["frags"].get(tag, {"opens": [], "closes": []})
        df = doc["frags"].get(tag, {"opens": [], "closes": []})
        cmp_pool("%s (opens)" % tag, lf["opens"], df["opens"])
        cmp_pool("%s (closes)" % tag, lf["closes"], df["closes"])

    print("=" * 78)
    if not changed:
        print("no changes - the document matches the game")
        return 0
    print("%d pool(s) differ. ⚠️ Nothing was written: applying these is a deliberate edit"
          % changed)
    print("to the script, so the rulings in its comments survive.")
    return 0


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("extract", "check"):
        print(__doc__)
        print("gods: " + ", ".join(sorted(FILES)))
        return 2
    cmd, god = sys.argv[1], sys.argv[2].lower()
    if god not in FILES:
        print("unknown god %r - known: %s" % (god, ", ".join(sorted(FILES))))
        return 2

    if cmd == "check":
        return check(god)

    data = harvest(god)
    if data is None:
        return 1
    if not data["whole"] and not data["frags"]:
        # ⚠️ An empty harvest is a FAILURE, not an empty god. A script that changed
        # shape would otherwise produce a confident, blank document.
        print("%s registered NOTHING. That is a failure of this tool, not an empty god -"
              % god)
        print("check that %s still calls VELDORA.voice.register/registerLines." % FILES[god])
        return 1
    path, whole_n, frag_n, combos = write_doc(god, data)
    print("wrote %s" % path)
    print("  %d whole lines, %d fragments, %d possible combined lines"
          % (whole_n, frag_n, combos))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
