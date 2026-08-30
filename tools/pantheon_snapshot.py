# -*- coding: utf-8 -*-
"""pantheon_snapshot.py — what each god ACTUALLY registers, byte for byte.

    python tools/pantheon_snapshot.py            # print the snapshot
    python tools/pantheon_snapshot.py --save      # write it to the baseline file
    python tools/pantheon_snapshot.py --check     # compare against the baseline, rc=1 on drift

⭐ WHY THIS EXISTS
------------------
The five `<god>_voice.js` files carry ~297 lines of identical boot plumbing — three
registration loops, a colour call, a style call, a counting pass, a banner — and they have
already DRIFTED. wall and salvage count pool coverage; the other three do not. forge
increments a different counter than everyone else in the same loop. Nobody decided either.

Collapsing that into one registrar is a refactor of five live files that between them hold
every word the gods say. The danger is not that it breaks loudly — it is that one pool
quietly stops being registered and a god simply has less to say, which reads as writing.

🔑 SO THE REFACTOR GETS A BEFORE-AND-AFTER. This records everything a god file registers:
colour, garble, style, every whole pool, every fragment pool, in canonical order. Take it
before, take it after, require them IDENTICAL. A refactor that changes what reaches the
engine is not the refactor that was intended.

⚠️ IT RECORDS THE STYLE AND THE COLOUR TOO, which `dialogue_doc.py`'s harvester stubs out.
Those are exactly the calls this refactor moves, so a snapshot blind to them would be
green while the gods lost their placement — the check passing for the one reason it
must not.

⛔ THIS IS NOT A DIALOGUE DOCUMENT. `dialogue_doc.py` is for reading and writing lines.
This is a mechanical fingerprint for one refactor, and it is meaningless as prose.
"""
import io
import json
import os
import subprocess
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SS = os.path.join(ROOT, "pack", "kubejs", "server_scripts")
BASELINE = os.path.join(ROOT, "tools", "pantheon_baseline.json")

GODS = ["art", "blade", "forge", "salvage", "wall"]

# ⚠️ Shared files load FIRST, in this order, so a god file may call into them. `pantheon.js`
# does not exist yet; it is skipped silently until it does, which is what lets the same
# snapshot run on both sides of the refactor.
SHARED = ["pantheon.js"]

HARVEST = r"""
const fs = require('fs'), path = require('path')
const SS = process.env.VELDORA_SS
const FILES = JSON.parse(process.env.VELDORA_FILES)

const out = { colour: null, garbled: false, style: null, whole: {}, frags: {} }

function clone(x) { return JSON.parse(JSON.stringify(x === undefined ? null : x)) }

const voice = {
  register: (god, tag, opens, closes) => {
    if (!opens || !closes) return false
    out.frags[tag] = { opens: opens.slice(), closes: closes.slice() }
    return true
  },
  registerLines: (god, tag, lines) => {
    if (!lines || !lines.length) return false
    out.whole[tag] = lines.slice()
    return true
  },
  setColour: (god, code) => { out.colour = code },
  setStyle: (god, st) => { out.style = clone(st) },
  setGarbled: (god, on) => { out.garbled = !!on },
  // Read-side helpers a god file may call while registering. They must not throw.
  line: () => null,
  styleOf: () => ({}),
  colourOf: () => '§f',
}
global.VELDORA = { voice: voice }

const loaded = []
global.ServerEvents = { loaded: f => loaded.push(f), commandRegistry: () => {}, tick: () => {} }
global.PlayerEvents = { loggedIn: () => {}, loggedOut: () => {}, tick: () => {} }
global.EntityEvents = { death: () => {}, checkSpawn: () => {}, hurt: () => {} }
global.BlockEvents = { placed: () => {}, broken: () => {} }
global.ItemEvents = { rightClicked: () => {}, entityInteracted: () => {} }
global.Text = { of: s => s }
global.Utils = { server: null }
global.Platform = { isLoaded: () => true }
global.Java = { loadClass: () => ({}) }
global.Commands = null

const ri = console.info, rw = console.warn, re2 = console.error
console.info = () => {}; console.warn = () => {}; console.error = () => {}
try {
  for (const f of FILES) {
    const p = path.join(SS, f)
    if (!fs.existsSync(p)) continue
    ;(0, eval)(fs.readFileSync(p, 'utf8'))
  }
  loaded.forEach(f => { try { f({ server: { players: [] } }) } catch (e) {} })
} finally {
  console.info = ri; console.warn = rw; console.error = re2
}
process.stdout.write(JSON.stringify(out))
"""


def harvest(god):
    files = SHARED + [god + "_voice.js"]
    env = dict(os.environ, VELDORA_SS=SS, VELDORA_FILES=json.dumps(files))
    r = subprocess.run(["node", "-e", HARVEST], capture_output=True, env=env)
    if r.returncode != 0:
        sys.stderr.write("%s: node failed\n%s\n"
                         % (god, (r.stderr or b"").decode("utf-8", "replace")[:2000]))
        return None
    try:
        return json.loads((r.stdout or b"").decode("utf-8", "replace"))
    except Exception as e:
        sys.stderr.write("%s: unreadable output: %r\n" % (god, e))
        return None


def snapshot():
    """god -> everything it registered, or None if a god could not be read.

    🔑 A god that FAILS and a god that registers NOTHING must not look the same here —
    the whole point is detecting a pool that quietly stopped arriving.
    """
    out = {}
    for g in GODS:
        h = harvest(g)
        if h is None:
            return None, g
        out[g] = h
    return out, None


def summarise(snap):
    rows = []
    for g in sorted(snap):
        s = snap[g]
        combos = sum(len(v["opens"]) * len(v["closes"]) for v in s["frags"].values())
        rows.append("  %-9s %3d whole tags  %5d lines · %2d frag tags %5d combos · "
                    "style %s · colour %s"
                    % (g, len(s["whole"]), sum(len(v) for v in s["whole"].values()),
                       len(s["frags"]), combos,
                       "yes" if s["style"] else "NONE",
                       s["colour"] or "NONE"))
    return "\n".join(rows)


def main():
    save = "--save" in sys.argv
    check = "--check" in sys.argv

    snap, failed = snapshot()
    if snap is None:
        sys.stderr.write("could not read %s - refusing to write or compare a partial "
                         "snapshot\n" % failed)
        return 2

    print("what the pantheon registers")
    print("=" * 78)
    print(summarise(snap))
    print()

    blob = json.dumps(snap, sort_keys=True, indent=1, ensure_ascii=False)

    if save:
        with io.open(BASELINE, "w", encoding="utf-8", newline="") as fh:
            fh.write(blob)
        print("baseline written: %s" % os.path.relpath(BASELINE, ROOT))
        print("⚠️ Take this BEFORE a refactor. Saving it after one records the bug.")
        return 0

    if check:
        if not os.path.isfile(BASELINE):
            sys.stderr.write("no baseline at %s - run --save first\n" % BASELINE)
            return 2
        with io.open(BASELINE, encoding="utf-8") as fh:
            was = json.load(fh)
        if was == snap:
            print("✓ IDENTICAL to the baseline. Every god registers exactly what it did.")
            return 0
        print("🔴 DRIFT — what reaches the engine has CHANGED:")
        for g in sorted(set(list(was) + list(snap))):
            a, b = was.get(g), snap.get(g)
            if a == b:
                continue
            print("  %s:" % g)
            if a is None or b is None:
                print("     god %s entirely" % ("added" if a is None else "DISAPPEARED"))
                continue
            for field in ("colour", "garbled", "style"):
                if a.get(field) != b.get(field):
                    print("     %s: %r -> %r" % (field, a.get(field), b.get(field)))
            for kind in ("whole", "frags"):
                ka, kb = set(a.get(kind, {})), set(b.get(kind, {}))
                for t in sorted(ka - kb):
                    print("     %s tag LOST: %s" % (kind, t))
                for t in sorted(kb - ka):
                    print("     %s tag added: %s" % (kind, t))
                for t in sorted(ka & kb):
                    if a[kind][t] != b[kind][t]:
                        print("     %s tag CHANGED: %s" % (kind, t))
        return 1

    print("report only. --save writes the baseline, --check compares against it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
