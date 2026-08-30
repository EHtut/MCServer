"""dialogue_doc.py — a god's dialogue as an editable document, grouped by system.

    python tools/dialogue_doc.py extract blade
    python tools/dialogue_doc.py check   blade      # after editing: what changed?

⭐ WHY. Ethan writes the dialogue; the pools live inside 800-line JS files interleaved
with implementation. Asking him to edit those is asking him to work around code.

🔑 IT RUNS THE FILE, IT DOES NOT PARSE IT. The pools are local variables inside an IIFE,
so this loads the script with a stubbed `VELDORA.voice` that records every
`register`/`registerLines` call. What lands in the document is exactly what the GAME
receives — not a second reading of the source that can drift from it.

⭐ AND IT IS GROUPED BY THE SYSTEM THAT FIRES EACH POOL. Ethan on the first version:
*"Can you re sort them to the actual systems in place? Looking at blade's, its a mess."*
He was right — it was tags in alphabetical order, which tells a writer nothing about WHEN
a line is heard. Writing a threat is a different job from writing an idle aside.

⚠️ The document is the SOURCE for a writing pass, never the source of truth for the game.
Nothing here writes back into the scripts: a regenerated object literal would throw away
the comments around it, and the comments are where the rulings live.
"""
import glob
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


# ── WHERE EACH POOL IS FIRED FROM ────────────────────────────────────────────
CALL = re.compile(r"VELDORA\.voice\.(say|sayAbout|line)\s*\(")


def usage(god):
    """tag -> the files that name it.

    🔴 THE FIRST VERSION ONLY READ CALL ARGUMENTS and reported 14 of Blade's 56 pools as
    having no consumer — including all five `argue_*`. Every one was alive:

        grudge.js   { god: wronged, tag: 'argue_accuse' }   <- a DATA STRUCTURE
        idle.js     return 'loc_above'                      <- a RETURN VALUE

    🔑 The point of use is not only a call argument. A tag is a string the rest of the
    pack passes around, so this looks for the quoted tag ANYWHERE outside the file that
    defines it. Over-reporting a consumer is harmless; declaring a live pool dead sends
    a writer to delete work that is in use.
    """
    exact = {}
    own = FILES[god]
    for path in sorted(glob.glob(os.path.join(SS, "*.js"))):
        f = os.path.basename(path)
        if f == own:
            continue
        src = io.open(path, encoding="utf-8").read()
        for m in re.finditer(r"'([a-z0-9_]{3,})'", src):
            exact.setdefault(m.group(1), set()).add(f)
    return exact


def dynamic_sites():
    """Call sites whose tag is computed. Their literal fragment, where they have one,
    still resolves a family: `tier + '_gift'` reaches every `*_gift` pool."""
    out = []
    for path in sorted(glob.glob(os.path.join(SS, "*.js"))):
        f = os.path.basename(path)
        src = io.open(path, encoding="utf-8").read()
        for m in CALL.finditer(src):
            depth, buf = 1, ""
            for ch in src[m.end():m.end() + 300]:
                if ch == "(":
                    depth += 1
                elif ch == ")":
                    depth -= 1
                    if depth == 0:
                        break
                buf += ch
            a = [x.strip() for x in re.split(r",(?![^(]*\))", buf)]
            if m.group(1) == "line":
                cand = a[1] if len(a) > 1 else ""
            else:
                cand = a[2] if len(a) > 2 else ""
            if cand and not re.fullmatch(r"'[a-z0-9_]+'", cand.strip()):
                out.append((f, cand.strip()[:70], re.findall(r"'([a-z0-9_]+)'", cand)))
    return out


def group_tags(tags, exact, dynamic):
    """Bucket every tag under the file(s) that name it."""
    groups, dyn, untraced = {}, {}, []
    for tag in tags:
        files = exact.get(tag)
        if files:
            groups.setdefault(" · ".join(sorted(files)), []).append(tag)
            continue
        reached = []
        for f, expr, frags in dynamic:
            for fr in frags:
                if fr and (tag.startswith(fr) or tag.endswith(fr)):
                    reached.append((f, expr))
                    break
        if reached:
            dyn[tag] = reached
        else:
            untraced.append(tag)
    return groups, dyn, untraced


def primary(key, god):
    """The one file most worth naming. A tag whose NAME is a common word matches many
    files; the writer wants the system, not a concordance."""
    files = key.split(" · ")
    for f in files:
        if f.startswith(god):
            return f, files
    for f in files:
        if f.endswith("_events.js"):
            return f, files
    return files[0], files


SYSTEM_NOTE = {
    "grudge.js": "the gods arguing about each other, delivered as an EXCHANGE - so these "
                 "have to answer one another, not merely sit in the same pool",
    "idle.js": "unprompted, on a 60s roll, chosen by CONTEXT - what you hold, where you "
               "are, combat, a champion nearby. A god with no pool for the chosen "
               "context says NOTHING rather than falling back to something generic",
    "warn.js": "something is about to happen to you",
    "tide.js": "the tide",
    "deep_speaker.js": "met in the depths, or on the 30th night",
    "voice.js": "the engine itself",
    "chosen.js": "being offered a path, or taking one",
    "arrival.js": "the arrival",
    "harvest.js": "the Harvest",
    "reckoning.js": "the reckoning",
    "fall.js": "the fall",
}

HEADER = """# {Name} — dialogue

> ⭐ **THIS IS YOURS TO WRITE IN.** Edit lines, add lines, delete lines, rename tags,
> add whole new tags. When you hand it back, `python tools/dialogue_doc.py check {god}`
> reports exactly what changed against what the game currently has. A plain text file
> back is fine too.
>
> Generated {stamp} from `pack/kubejs/server_scripts/{file}` by RUNNING it, so every line
> below is one the game actually registers.

## How this is organised

⭐ **Grouped by the SYSTEM that fires each pool**, not alphabetically — you should not
have to read the scripts to know whether you are writing a threat or an idle aside.

**WHOLE** — a pool of complete lines; one is picked at random.

**FRAGMENTS** — `opens` and `closes` from the same tag, joined with a space.
⚠️ **Any open must read against ANY close in the same tag.** That is the one rule the
engine cannot check for you.

## The format, if you add anything

```
## tag_name  (whole)
- a complete line

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

    whole, frags = data["whole"], data["frags"]
    tags = sorted(list(whole) + list(frags))
    groups, dyn, untraced = group_tags(tags, usage(god), dynamic_sites())

    import time
    body = HEADER.format(Name=god.capitalize(), god=god, file=FILES[god],
                         stamp=time.strftime("%Y-%m-%d %H:%M"))

    whole_n = sum(len(v) for v in whole.values())
    combos = sum(len(v["opens"]) * len(v["closes"]) for v in frags.values())
    body += ("**%d whole lines** across %d tags · **%d fragment tags** making "
             "**%d** combined lines · **%d systems**.\n\n---\n\n"
             % (whole_n, len(whole), len(frags), combos, len(set(primary(k, god)[0] for k in groups))))

    def render(tag):
        out = ""
        if tag in whole:
            out += "## %s  (whole)\n\n" % tag
            for ln in whole[tag]:
                out += "- %s\n" % ln
            out += "\n"
        if tag in frags:
            f = frags[tag]
            out += ("## %s  (fragments)\n\n*%d x %d = %d lines*\n\n"
                    % (tag, len(f["opens"]), len(f["closes"]),
                       len(f["opens"]) * len(f["closes"])))
            out += "### opens\n\n"
            for ln in f["opens"]:
                out += "- %s\n" % ln
            out += "\n### closes\n\n"
            for ln in f["closes"]:
                out += "- %s\n" % ln
            out += "\n"
        return out

    # 🔴 MERGE BY THE PRIMARY SYSTEM FIRST. Grouping on the raw file-SET split
    # blade_events.js into SEVEN separate headings, because different tags matched
    # different incidental combinations that all resolve to the same system. That is
    # exactly the mess Ethan objected to, reproduced one level down.
    merged = {}
    for key in groups:
        head, all_files = primary(key, god)
        m = merged.setdefault(head, {"tags": [], "also": set()})
        m["tags"].extend(groups[key])
        m["also"].update(f for f in all_files if f != head)

    # Biggest system first - that is where most of the writing is.
    for head in sorted(merged, key=lambda h: (-len(merged[h]["tags"]), h)):
        body += "# %s\n\n" % head
        note = SYSTEM_NOTE.get(head)
        if note:
            body += "> %s\n\n" % note
        others = sorted(merged[head]["also"])
        if others:
            body += "*also referenced in %s*\n\n" % ", ".join("`%s`" % f for f in others)
        body += "*%d tag(s)*\n\n" % len(merged[head]["tags"])
        for tag in sorted(merged[head]["tags"]):
            body += render(tag)
        body += "---\n\n"

    if dyn:
        body += "# Reached by a computed tag\n\n"
        body += ("> The trigger builds the tag at runtime, so it is chosen in code rather "
                 "than named as a literal. These are live.\n\n")
        for tag in sorted(dyn):
            src = sorted(set("`%s` (`%s`)" % (f, e) for f, e in dyn[tag]))
            body += "*%s - from %s*\n\n" % (tag, ", ".join(src))
            body += render(tag)
        body += "---\n\n"

    if untraced:
        body += "# ⚠️ No reference found - **not** proof these are dead\n\n"
        body += (
            "> Nothing anywhere names these in quotes. That is NOT the same as unused:\n"
            "> several call sites build their tag at runtime (`'near_' + path`,\n"
            "> `tier + '_gift'`, `entry.tag`), and a tag assembled from pieces cannot be\n"
            "> found by searching for it.\n"
            ">\n"
            "> \U0001f534 An earlier version of this tool reported 14 pools as having no\n"
            "> consumer, including every `argue_*` - all of them alive, named inside data\n"
            "> structures in `grudge.js`. **Verify before deleting anything here.**\n\n")
        for tag in sorted(untraced):
            body += render(tag)

    tmp = path + ".tmp"
    with io.open(tmp, "w", encoding="utf-8", newline="") as fh:
        fh.write(body)
    os.replace(tmp, path)
    return path, whole_n, len(merged), combos


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
    print("%d pool(s) differ. Nothing was written: applying these is a deliberate edit"
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
    path, whole_n, systems, combos = write_doc(god, data)
    print("wrote %s" % path)
    print("  %d whole lines, %d combined, grouped into %d systems"
          % (whole_n, combos, systems))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
