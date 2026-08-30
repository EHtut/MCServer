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

# The Windows console defaults to cp1252 and raises UnicodeEncodeError on any
# non-latin-1 character, which killed this tool AFTER it had done its work and
# printed most of its report - a failure that looks like a crash in the logic.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

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
# ⭐ C4 — staged for removal AT the reset, never before. Both leave debris in a live
# world: the-knocker's entities become unknown-entity stubs, and grim-and-bleak owns a
# DIMENSION whose chunk data is orphaned the moment the mod is gone.
STAGED_FOR_REMOVAL = {
    "the-knocker": "an unpredictable human-like stalker that follows and visits "
                   "(Ethan, 2026-08-29)",
    "grim-and-bleak": "ambience-led horror with ITS OWN DIMENSION (Ethan, 2026-08-30)",
}


def check_knocker():
    """🔑 FIVE places, not four. A `.pw.toml` deleted alone is invisible to the
    installer; a stale index hash makes every client refuse the pack; and a slug left in
    `pins.versions` is a version forced for a mod that no longer exists.

    ⚠️ The pin was nearly missed. The gameplan's C4 row names three places and this
    check originally had four; `pins.versions` holds **251** entries including BOTH
    staged mods (`the-knocker` 1.5.2, `grim-and-bleak` 2.5.2), and nothing pointed at
    it. Found only because grim-and-bleak turned up there while its slug was being
    looked up."""
    ml_path = os.path.join(REPO, "tools", "modlist.json")
    idx_path = os.path.join(REPO, "pack", "index.toml")
    rs_path = os.path.join(REPO, "tools", ".cache", "resolved.json")

    ml = None
    if os.path.exists(ml_path):
        try:
            ml = json.load(io.open(ml_path, encoding="utf-8"))
        except Exception:
            ml = None

    idx_txt = read_text(idx_path).lower() if os.path.exists(idx_path) else None
    try:
        resolved = json.load(io.open(rs_path, encoding="utf-8")) if os.path.exists(rs_path) else None
    except Exception:
        resolved = None

    def in_categories(slug):
        if not isinstance(ml, dict):
            return None
        cats = ml.get("categories")
        if not isinstance(cats, dict):
            return None
        for cat in cats.values():
            for row in (cat.get("mods") or []) if isinstance(cat, dict) else []:
                if (isinstance(row, list) and row and row[0] == slug) or row == slug:
                    return True
        return False

    def in_pins(slug):
        if not isinstance(ml, dict):
            return None
        pins = ml.get("pins")
        if not isinstance(pins, dict):
            return None
        vers = pins.get("versions")
        return slug in vers if isinstance(vers, dict) else None

    def in_resolved(slug):
        if not isinstance(resolved, list):
            return None
        return any(isinstance(e, dict) and e.get("slug") == slug for e in resolved)

    for slug, why in sorted(STAGED_FOR_REMOVAL.items()):
        places = {
            "pack/mods": os.path.exists(os.path.join(REPO, "pack", "mods", slug + ".pw.toml")),
            "index.toml": (slug in idx_txt) if idx_txt is not None else None,
            "resolved.json": in_resolved(slug),
            "modlist categories": in_categories(slug),
            "modlist pins": in_pins(slug),
        }
        label = "C4 " + slug
        unknown = [k for k, v in places.items() if v is None]
        if unknown:
            check(label, UNKNOWN, "could not read: " + ", ".join(unknown))
            continue

        present = [k for k, v in places.items() if v]
        # A mod that was never pinned is not "partially removed" for lacking a pin, so
        # the pin only counts once the slug is gone from everywhere else.
        if not present:
            check(label, OK, "gone from all five places")
        elif set(present) == {"modlist pins"}:
            check(label, BAD,
                  "removed everywhere EXCEPT `pins.versions` - a version forced for a "
                  "mod that no longer exists")
        elif len(present) == len(places):
            # ⚠️ ONLY the untouched state is a warning. `>= 4` was here first and called
            # a 4-of-5 half-removal "staged, expected" - which is the single most
            # dangerous state there is, and exactly what C4 warns about. Its own test
            # caught it; reading the line did not.
            check(label, WARN,
                  "staged, still present in all %d places - EXPECTED until C2. %s"
                  % (len(places), why))
        else:
            check(label, BAD,
                  "PARTIALLY removed - still in: %s. A half-removal is the worst state: "
                  "the installer and the clients disagree about the pack."
                  % ", ".join(sorted(present)))


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
        # ⛔ THIS IS BOOKKEEPING, NOT A PROPOSAL. Ethan read the first wording as a
        # suggestion to remove simple-hats — *"I don't want simple-hats removed."*
        # Nothing here removes anything; the LIST ENTRY is stale, not the mod.
        check("modlist bookkeeping", WARN,
              "%d mod(s) are installed and working but ALSO still listed under "
              "unavailable/cut_for_budget: %s. The stale entry is the list, not the mod "
              "- NOTHING here removes anything."
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

    # ⭐ RULED 2026-08-30 (Ethan): *"we just need to centralize, live copy is the truth
    # as repo doesn't get updated as much."* So drift means THE REPO IS STALE, not that
    # the server is wrong — and the fix is a pull, not a copy-out.
    #
    # ⚠️ With ONE exception, which is why `config_sync.py` keeps a PENDING list:
    # `tectonic.json` is a ruling the instance has not received yet (§0.2), and pulling
    # over it would delete the decision rather than resolve a disagreement.
    # 🔴 A PENDING decision is NOT stale-repo drift, and saying so is actively dangerous:
    # this check told its reader to `--pull` tectonic.json, which is the one file a pull
    # must never touch. Two tools of mine contradicting each other about the same file.
    # The PENDING list is imported rather than restated so they cannot drift apart.
    try:
        sys.path.insert(0, os.path.join(REPO, "tools"))
        from config_sync import PENDING as _PENDING
    except Exception:
        _PENDING = {}
    held = sorted(d for d in diff if os.path.basename(d) in _PENDING)
    diff = [d for d in diff if os.path.basename(d) not in _PENDING]
    if held:
        check("config pending", WARN,
              "%s - the REPO is right and the instance has not caught up. ⛔ Do NOT "
              "pull these; land one with `config_sync.py --push-pending <file>`."
              % ", ".join(held))

    if not diff and not absent:
        return check("config drift", OK, "every non-pending repo config matches the instance")
    detail = ""
    if diff:
        detail += "REPO IS STALE for: " + ", ".join(sorted(diff)) + " - refresh with " \
                  "`python tools/config_sync.py --pull`. "
    if absent:
        detail += "Tracked in the repo but ABSENT from the instance: " + \
                  ", ".join(sorted(absent)[:6]) + " (never deployed, or dead files). "
    check("config drift", WARN,
          detail + "The live instance is the truth; the repo follows it. ⚠️ "
          "config_sync's PENDING list is what stops a pull deleting a ruling.")


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
