"""im_live_check.py — ask the RUNNING game whether the commands the shim builds parse.

    python tools/im_live_check.py          # needs the server up; sends nothing to anyone

🔴 WHY THIS EXISTS. On 2026-08-30 every `/im` test failed in Ethan's hands while
`tools/immersive_harness.js` sat green at 37 assertions. The harness checked the string
the shim builds; nothing checked whether MINECRAFT ACCEPTS that string. It did not:

    immersivemessages sendcustom Rehykt {...} 4.0f The tide is rising.
                                             ^ Expected whitespace to end one argument,
                                               but found trailing data

The duration is a Brigadier `FloatArgumentType` and rejects the `f` suffix. `4.0f` is
CORRECT inside the NBT — SNBT needs the suffix to make a float tag — and wrong as the
argument. Two parsers, one helper, one bug. ⚠️ And the harness asserted `4.0f`, so it
encoded the defect as the expectation and went green on it.

🔑 A HARNESS PROVES THE STRING IS WHAT YOU MEANT. Only the game proves it is VALID.
This is the same gap `live_path_smoke.py` closes on the Alice side, for the same reason.

⭐ IT SENDS NOTHING TO ANYONE. Every command targets `@a`, and it is run when nobody
needs to be online: a valid command with no players answers "No player was found", which
is the SUCCESS signal here. A malformed one answers with a Brigadier parse error and a
`<--[HERE]` caret. Those two are what this tool tells apart.

⚠️ Detect the FAILURE, not the success — the standing rule from the entity-registry
probe. A live instance can answer a great many things; only the parse error is
unambiguous.
"""
import os
import subprocess
import sys

# The Windows console defaults to cp1252 and raises UnicodeEncodeError on any
# non-latin-1 character, which killed this tool AFTER it had done its work and
# printed most of its report - a failure that looks like a crash in the logic.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SS = os.path.join(REPO, "pack", "kubejs", "server_scripts")

# Each case is (label, text, opts-as-JS). They deliberately cover every value TYPE the
# tag takes, because the bug was a type-formatting bug and nothing else would have found
# it: an ordinal, a quoted string, a presence flag, an SNBT float, and the bare argument
# float that broke.
CASES = """
  ['shake',      '\\u00a7cThe tide is rising.',   { shake: true, seconds: 4, anchor: 'TOP_CENTER' }],
  ['typewriter', '\\u00a79I have a deal for you.', { typewriter: true, seconds: 6, anchor: 'TOP_CENTER' }],
  ['obfuscate',  '\\u00a76No one sent me.',        { obfuscate: 'RANDOM', seconds: 6, anchor: 'TOP_CENTER' }],
  ['anchor+y',   'bottom anchored',            { seconds: 5, anchor: 'BOTTOM_CENTER', y: 40 }],
  ['floats',     'sized and faded',            { seconds: 5, size: 1.5, fade: true, font: 'minecraft:alt' }],
  ['fraction',   'a fractional duration',      { seconds: 2.5, anchor: 'TOP_LEFT' }],
  ['quotes',     'a "quoted" word',            { seconds: 4, bgColor: '#000000' }],
"""

EMIT = r"""
const fs = require('fs'), path = require('path')
// ⚠️ `node -e` puts extra args at argv[1], not argv[2]. An env var has no
// such ambiguity, and getting it wrong made this tool fail loudly on its
// first run - which is the correct behaviour, but avoidable.
const SS = process.env.VELDORA_SS
const src = fs.readFileSync(path.join(SS, 'immersive.js'), 'utf8')
const cmds = []
const server = { runCommandSilent: c => { cmds.push(String(c)); return undefined } }
const stub = {
  Platform: { isLoaded: () => true },
  Utils: { server },
  ServerEvents: { loaded() {}, commandRegistry() {} },
  Text: { of: s => s },
  console: { info() {}, log() {}, warn() {} },
}
const keys = Object.keys(stub)
const V = new Function(...keys, src + '\n;return VELDORA;')(...keys.map(k => stub[k]))
const p = { username: '@a', server }
const CASES = [__CASES__]
for (const [label, text, opts] of CASES) {
  const before = cmds.length
  V.im.show(p, text, opts)
  console.log(label + '\t' + (cmds.length > before ? cmds[cmds.length - 1] : 'SHIM-REFUSED'))
}
"""


def emit_commands():
    """Build the commands by RUNNING the shim, so this checks the real builder and not a
    copy of it that can drift."""
    script = EMIT.replace("__CASES__", CASES)
    env = dict(os.environ, VELDORA_SS=SS)
    r = subprocess.run([_node(), "-e", script], capture_output=True, env=env)
    if r.returncode != 0:
        err = (r.stderr or b"").decode("utf-8", "replace").strip()
        print("could not run the shim: " + err)
        return None
    out = (r.stdout or b"").decode("utf-8", "replace")
    rows = []
    for line in out.splitlines():
        if "\t" in line:
            label, cmd = line.split("\t", 1)
            rows.append((label, cmd))
    return rows


def _node():
    return "node"


def rcon(cmd):
    r = subprocess.run([sys.executable, os.path.join(REPO, "tools", "rcon.py"), cmd],
                       capture_output=True, timeout=30)
    return (r.stdout or b"").decode("utf-8", "replace")


# Brigadier's parse errors all carry this caret. It is the unambiguous failure signal.
CARET = "<--[HERE]"


def main():
    rows = emit_commands()
    if rows is None:
        return 1
    if not rows:
        print("the shim produced no commands at all - that is a failure, not a pass")
        return 1

    print("asking the live server to parse %d command(s) the shim builds" % len(rows))
    print("=" * 78)
    bad = 0
    for label, cmd in rows:
        if cmd == "SHIM-REFUSED":
            print(" FAIL  %-11s the shim refused to build a command for this case" % label)
            bad += 1
            continue
        try:
            out = rcon(cmd)
        except Exception as e:
            print("  ??   %-11s rcon did not answer (%s) - is the server up?"
                  % (label, type(e).__name__))
            bad += 1
            continue

        if CARET in out:
            reason = " ".join(out.split())[:110]
            print(" FAIL  %-11s %s" % (label, reason))
            print("       %s" % cmd)
            bad += 1
        elif "No player was found" in out or cmd in out:
            print("  ok   %-11s parses" % label)
        else:
            # ⚠️ Anything unrecognised is a failure. An unfamiliar answer is not a pass.
            print("  ??   %-11s unrecognised answer: %s" % (label, " ".join(out.split())[:70]))
            bad += 1

    print("=" * 78)
    if bad:
        print("%d of %d REJECTED by the live parser." % (bad, len(rows)))
        print("The harness only proves the string is what you meant; this proves it is valid.")
        return 1
    print("all %d parse. Parsing is not rendering - only a player's screen shows that."
          % len(rows))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
