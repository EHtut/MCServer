"""reset_preflight.py — everything that must be TRUE before C2 generates the world.

    python tools/reset_preflight.py

⭐ WHY THIS EXISTS. C2 is a ONE-SHOT. Every other chunk in the gameplan is reversible;
this one bakes its inputs into terrain and then they are unfixable without doing it
again. A config that never reached the instance is not a bug you notice — it is a world
that is quietly wrong forever, with a ✅ next to it in the gameplan.

🔴 IT WAS ALREADY WRONG WHEN THIS WAS WRITTEN. `tectonic.json` `min_y` was set to -64 in
the repo on 2026-08-14 and C1 was marked done. The INSTANCE — the only copy that
generation reads — was still -128 sixteen days later. ⚠️ **Config does not travel by
packwiz**: `pack/config` is not in `index.toml`, so nothing was ever going to carry it
across, and nothing said so.

🔑 EVERY CHECK READS THE INSTANCE, NOT THE REPO. The repo records intent. The instance is
what runs. Where they disagree the instance wins, and that disagreement is the finding.

⚠️ THIS IS A GATE, NOT A REPORT. A check that cannot answer returns UNKNOWN and that
counts as a FAILURE, because "I could not tell" and "it is fine" must never share an exit
code — the same rule the live-path smoke enforces on the Alice side and the same one the
dependency checker broke when it printed "MISSING DEPS: none" while every request errored.
"""
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import time

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INSTANCE = r"C:\MCServer\instance"
BACKUPS = r"C:\MCServer\backups"

OK, WARN, BAD, UNKNOWN = "PASS", "WARN", "FAIL", "UNKNOWN"
results = []


def check(name, state, detail=""):
    results.append((name, state, detail))


def read_text(path):
    with io.open(path, encoding="utf-8", errors="replace") as f:
        return f.read()


# ---------------------------------------------------------------------------
# 1. tectonic min_y — the one that was already wrong
# ---------------------------------------------------------------------------
def check_tectonic():
    inst = os.path.join(INSTANCE, "config", "tectonic.json")
    repo = os.path.join(REPO, "pack", "config", "tectonic.json")
    if not os.path.exists(inst):
        return check("tectonic min_y", UNKNOWN, "no tectonic.json in the instance")

    # Comments are legal in this file, so it is scanned rather than parsed.
    txt = read_text(inst)
    m = re.search(r'"min_y"\s*:\s*(-?\d+)', txt)
    if not m:
        return check("tectonic min_y", UNKNOWN, "min_y not found in the instance file")
    live = int(m.group(1))

    want = None
    if os.path.exists(repo):
        rm = re.search(r'"min_y"\s*:\s*(-?\d+)', read_text(repo))
        if rm:
            want = int(rm.group(1))

    if want is None:
        check("tectonic min_y", UNKNOWN,
              "instance is %d but the repo has no value to compare" % live)
    elif live == want:
        check("tectonic min_y", OK, "instance and repo agree at %d" % live)
    else:
        check("tectonic min_y", BAD,
              "INSTANCE %d, repo %d - generation reads the instance, so C1 has NOT "
              "happened. Copy pack/config/tectonic.json to the instance before "
              "generating." % (live, want))

    # 🔴 THIS RAN ONLY IN THE MISMATCH BRANCH and its own test caught it. With min_y
    # correct and ore_fix stale — the single case where this check has any value — it
    # returned early and said nothing. ore_fix compensates for a LOWERED min_y, so the
    # pair has to be checked whatever min_y turned out to be.
    om = re.search(r'"ore_fix"\s*:\s*(true|false)', txt)
    if not om:
        return check("tectonic ore_fix", UNKNOWN, "ore_fix not found in the instance file")
    ore = om.group(1) == "true"
    want_ore = live < -64
    if ore != want_ore:
        check("tectonic ore_fix", WARN,
              "ore_fix=%s with min_y=%d - ore_fix compensates for a LOWERED min_y, so "
              "these two disagree" % (ore, live))
    else:
        check("tectonic ore_fix", OK, "ore_fix=%s is consistent with min_y=%d" % (ore, live))


# ---------------------------------------------------------------------------
# 2. C4 — the-knocker must leave in FOUR places at once
# ---------------------------------------------------------------------------
def check_knocker():
    """A .pw.toml deleted alone is invisible to the installer, and a stale index hash
    makes every client refuse the pack. So this reports each place separately."""
    places = {
        "pack/mods/the-knocker.pw.toml": os.path.exists(
            os.path.join(REPO, "pack", "mods", "the-knocker.pw.toml")),
        "pack/index.toml": "knocker" in read_text(os.path.join(REPO, "pack", "index.toml")).lower()
            if os.path.exists(os.path.join(REPO, "pack", "index.toml")) else None,
        "tools/.cache/resolved.json": "knocker" in read_text(
            os.path.join(REPO, "tools", ".cache", "resolved.json")).lower()
            if os.path.exists(os.path.join(REPO, "tools", ".cache", "resolved.json")) else None,
        "tools/modlist.json": "knocker" in read_text(
            os.path.join(REPO, "tools", "modlist.json")).lower()
            if os.path.exists(os.path.join(REPO, "tools", "modlist.json")) else None,
    }
    unknown = [k for k, v in places.items() if v is None]
    if unknown:
        return check("C4 the-knocker", UNKNOWN, "could not read: " + ", ".join(unknown))

    present = [k for k, v in places.items() if v]
    if not present:
        return check("C4 the-knocker", OK, "gone from all four places")
    if len(present) == 4:
        # Expected state until the reset - removing it from a LIVE world leaves its
        # entities as unknown-entity stubs, so it is staged deliberately.
        return check("C4 the-knocker", WARN,
                     "still present in all four (expected until the reset - remove it as "
                     "part of C2, never before, or the live world keeps entity stubs)")
    check("C4 the-knocker", BAD,
          "PARTIALLY removed - still in: %s. A half-removal is the worst state: the "
          "installer and the clients disagree about the pack." % ", ".join(present))


# ---------------------------------------------------------------------------
# 3. packwiz integrity — a stale hash makes every client refuse the pack
# ---------------------------------------------------------------------------
def check_packwiz():
    idx = os.path.join(REPO, "pack", "index.toml")
    pt = os.path.join(REPO, "pack", "pack.toml")
    if not (os.path.exists(idx) and os.path.exists(pt)):
        return check("packwiz hash", UNKNOWN, "pack.toml or index.toml missing")
    actual = hashlib.sha256(open(idx, "rb").read()).hexdigest()
    m = re.search(r'hash\s*=\s*["\']([0-9a-f]{64})', read_text(pt))
    if not m:
        return check("packwiz hash", UNKNOWN, "no index hash found in pack.toml")
    if m.group(1) == actual:
        return check("packwiz hash", OK, "pack.toml matches index.toml")
    check("packwiz hash", BAD,
          "pack.toml claims %s, index.toml is %s - every client refuses the pack in this "
          "state" % (m.group(1)[:12], actual[:12]))


# ---------------------------------------------------------------------------
# 4. modlist <-> resolved parity
# ---------------------------------------------------------------------------
def check_modlist_parity():
    """`resolve.py resolve` reads modlist.json. When modlist drifted 28 mods behind
    resolved.json it would have silently DELETED terralith, nyctophobia and 26 others."""
    ml = os.path.join(REPO, "tools", "modlist.json")
    rs = os.path.join(REPO, "tools", ".cache", "resolved.json")
    if not (os.path.exists(ml) and os.path.exists(rs)):
        return check("modlist parity", UNKNOWN, "modlist.json or resolved.json missing")
    try:
        a = json.load(open(ml, encoding="utf-8"))
        b = json.load(open(rs, encoding="utf-8"))
    except Exception as e:
        return check("modlist parity", UNKNOWN, "could not parse: %s" % e)

    # 🔴 THE FIRST VERSION OF THIS REPORTED 324 MODS MISSING. It walked the top-level
    # dict and took its KEYS - `_comment`, `game_version`, `budget` - as mod slugs, then
    # compared them against real ones. Everything looked missing because nothing had been
    # read. ⚠️ A surprisingly ALARMING result deserves the same suspicion as a
    # surprisingly clean one: check the query before believing the finding.
    #
    # The real shape is categories -> {desc, mods: [[slug, why, tier], ...]}.
    # ⚠️ SECOND correction. Reading only `categories` reported six mods missing - the
    # shaderpacks and resourcepacks, which sit in their own top-level sections with the
    # identical {_comment, mods: [[slug, why, tier]]} shape. Three iterations of this
    # extractor, three plausible and wrong answers.
    # ⚠️ THIRD correction: the shader and resourcepack sections spell the list `packs`,
    # not `mods`. Both are accepted rather than assumed.
    def rows(node):
        out = set()
        if not isinstance(node, dict):
            return out
        for key in ("mods", "packs"):
            lst = node.get(key)
            if isinstance(lst, list):
                for row in lst:
                    if isinstance(row, list) and row and isinstance(row[0], str):
                        out.add(row[0])
                    elif isinstance(row, str):
                        out.add(row)
        return out

    def modlist_slugs(o):
        """Everything the pack is MEANT to ship."""
        out = set()
        cats = o.get("categories")
        if isinstance(cats, dict):
            for cat in cats.values():
                out |= rows(cat)
        for key in ("shaderpacks", "resourcepacks"):
            out |= rows(o.get(key) or {})
        return out

    def excluded_slugs(o):
        """Deliberately NOT shipped. Folding these into the installable set would hide a
        real drift: a mod that is cut for budget yet still resolved is a contradiction,
        not a match."""
        out = set()
        for key in ("unavailable", "cut_for_budget"):
            out |= rows(o.get(key) or {})
        return out

    def resolved_slugs(o):
        out = set()
        if isinstance(o, list):
            for e in o:
                if isinstance(e, dict) and e.get("status") == "RESOLVED" and e.get("slug"):
                    out.add(str(e["slug"]))
        return out

    sa, sb = modlist_slugs(a), resolved_slugs(b)

    # 🚨 NEGATIVE CONTROL, in-line. If the extractor silently stops matching the file
    # shape again, this reports UNKNOWN instead of inventing a catastrophe.
    if "curios" not in sa or len(sa) < 50:
        return check("modlist parity", UNKNOWN,
                     "the modlist extractor did not find the expected shape "
                     "(%d slugs, 'curios' present: %s) - the check is broken, not the data"
                     % (len(sa), "curios" in sa))
    if not sb:
        return check("modlist parity", UNKNOWN, "no RESOLVED entries found in resolved.json")
    missing = sb - sa
    contradiction = sb & excluded_slugs(a)

    if contradiction:
        check("modlist exclusions", WARN,
              "%d mod(s) are RESOLVED but listed as unavailable/cut_for_budget: %s"
              % (len(contradiction), ", ".join(sorted(contradiction)[:6])))

    if not missing:
        return check("modlist parity", OK,
                     "%d in modlist, %d resolved, no drift" % (len(sa), len(sb)))
    check("modlist parity", BAD,
          "%d mod(s) are in resolved.json but NOT modlist.json - a resolve would delete "
          "them: %s" % (len(missing), ", ".join(sorted(missing)[:8])))


# ---------------------------------------------------------------------------
# 5. repo <-> instance CONFIG drift — the class of bug that hid C1
# ---------------------------------------------------------------------------
def check_config_drift():
    rbase = os.path.join(REPO, "pack", "config")
    ibase = os.path.join(INSTANCE, "config")
    if not (os.path.isdir(rbase) and os.path.isdir(ibase)):
        return check("config drift", UNKNOWN, "a config directory is missing")

    def norm(p):
        # Line endings are rewritten by the mods themselves at every boot, so a raw
        # hash reports every config as different and the real ones get lost in it.
        return hashlib.sha256(open(p, "rb").read().replace(b"\r\n", b"\n")).hexdigest()

    diff, absent = [], []
    for dp, _dn, fn in os.walk(rbase):
        for f in fn:
            rp = os.path.join(dp, f)
            rel = os.path.relpath(rp, rbase)
            ip = os.path.join(ibase, rel)
            if not os.path.exists(ip):
                absent.append(rel)
            elif norm(rp) != norm(ip):
                diff.append(rel)

    if not diff and not absent:
        return check("config drift", OK, "every repo config matches the instance")
    detail = ""
    if diff:
        detail += "DIFFERENT: " + ", ".join(sorted(diff)) + ". "
    if absent:
        detail += "NOT IN INSTANCE: " + ", ".join(sorted(absent)[:6]) + ". "
    check("config drift", WARN,
          detail + "Config does not travel by packwiz - anything staged in the repo "
          "reaches the world only if it is copied by hand.")


# ---------------------------------------------------------------------------
# 6. a recent backup, and the server DOWN
# ---------------------------------------------------------------------------
def check_backup():
    if not os.path.isdir(BACKUPS):
        return check("backup", UNKNOWN, "no backups directory at " + BACKUPS)
    zips = [f for f in os.listdir(BACKUPS) if f.lower().endswith(".zip")]
    if not zips:
        return check("backup", BAD, "no world backup exists")
    newest = max(zips, key=lambda f: os.path.getmtime(os.path.join(BACKUPS, f)))
    age_h = (time.time() - os.path.getmtime(os.path.join(BACKUPS, newest))) / 3600.0
    size_mb = os.path.getsize(os.path.join(BACKUPS, newest)) / 1048576.0
    if age_h > 24:
        return check("backup", WARN, "newest is %s, %.0fh old, %.0f MB" % (newest, age_h, size_mb))
    check("backup", OK, "%s, %.1fh old, %.0f MB" % (newest, age_h, size_mb))


def check_server_down():
    """Generation must not race a live server, and two people were online the last time
    someone nearly forgot to look."""
    rcon = os.path.join(REPO, "tools", "rcon.py")
    if not os.path.exists(rcon):
        return check("server down", UNKNOWN, "tools/rcon.py not found")
    try:
        r = subprocess.run([sys.executable, rcon, "list"],
                           capture_output=True, timeout=25)
        out = (r.stdout or b"").decode("utf-8", "replace")
    except Exception as e:
        return check("server down", OK, "rcon did not answer (%s) - server appears down" % type(e).__name__)
    if "players online" in out:
        m = re.search(r"There are (\d+) of a max", out)
        n = m.group(1) if m else "?"
        names = out.strip().split(":")[-1].strip()
        return check("server down", BAD,
                     "SERVER IS UP with %s player(s) online: %s" % (n, names or "-"))
    check("server down", OK, "rcon returned nothing usable - server appears down")


# ---------------------------------------------------------------------------
def main():
    print(__doc__.split("\n")[0])
    print("=" * 78)
    for fn in (check_tectonic, check_knocker, check_packwiz, check_modlist_parity,
               check_config_drift, check_backup, check_server_down):
        try:
            fn()
        except Exception as e:
            check(fn.__name__, UNKNOWN, "the check itself threw: %r" % (e,))

    width = max(len(n) for n, _s, _d in results)
    bad = unknown = warn = 0
    for name, state, detail in results:
        mark = {OK: "  ok  ", WARN: " WARN ", BAD: " FAIL ", UNKNOWN: "  ??  "}[state]
        print("%s %-*s  %s" % (mark, width, name, detail))
        bad += state == BAD
        warn += state == WARN
        unknown += state == UNKNOWN

    print("=" * 78)
    if bad or unknown:
        # UNKNOWN counts as a failure on purpose. "I could not tell" is not "it is fine".
        print("NOT READY TO GENERATE - %d failing, %d unknown, %d warning" % (bad, unknown, warn))
        print("An UNKNOWN is a failure here: a check that cannot answer has not passed.")
        return 1
    if warn:
        print("READY, with %d warning(s) to read before you commit to the one-shot." % warn)
        return 0
    print("READY. Every check answered and every one passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
