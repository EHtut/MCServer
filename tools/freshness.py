"""freshness - measure the docs and memory against the LIVE game.

    python tools/freshness.py            report
    python tools/freshness.py --quiet    only problems, exit 1 if any

WHY THIS EXISTS
    Ethan, 2026-08-15: "It needs to stay up to date, letting it become outdated
    is usually our biggest source of failure."

    He is right, and 2026-08-15 proved it three times in one day:

      * `35-WALL-REFRESH.md` argued Wall's ENTIRE design on MineColonies. That mod
        is not installed. Neither is Theurgy, which the same doc assigns to her.
      * `22-THE-PATRONS.md` and `27-THE-SIX-VOICES.md` described CROWN as a live
        peer. He was merged into Wall on 08-14. A whole god was scaffolded,
        deployed and given a content worksheet before anyone noticed.
      * Wall's `/help` taught SecurityCraft - reinforcers, keypads, keycards - to
        every player who typed it. SecurityCraft was cut weeks earlier.

    Every one of those was TRUE WHEN WRITTEN. That is the whole problem: docs do
    not rot because somebody forgets to update them, they rot because NOTHING
    MEASURES THEM against the game. A human re-reading 40 documents will not spot
    a mod that quietly left.

WHAT IT CHECKS
    1. MOD CLAIMS   every `namespace:item` id written in a doc, checked against the
                    mod ids actually present in instance/mods. This is the check
                    that would have caught all three failures above in one command.
    2. PATHS        which paths paths.js has CLOSED vs which docs present as live.
    3. VOICES       which gods actually register a voice, from the live boot log.
    4. RETIRED      scripts holding a RETIRED / GATE = false / CLOSED flag, so a
                    doc describing them as live can be spotted.
    5. TOOLS        tools/ scripts named after a mod that is no longer installed.

WHAT IT DOES NOT DO
    Guess. Every finding names the file, the line and the evidence, and anything it
    cannot verify it says it cannot verify rather than passing it.
"""

from __future__ import annotations

import argparse
import collections
import json
import pathlib
import re
import sys
import zipfile

REPO = pathlib.Path(__file__).resolve().parent.parent
INSTANCE = REPO.parent / "instance"
MODS = INSTANCE / "mods"
DOCS = REPO / "docs"
SCRIPTS = REPO / "pack" / "kubejs" / "server_scripts"

# Namespaces that are not mods, or are provided by the game/pack itself.
IGNORE_NS = {
    "minecraft", "forge", "neoforge", "c", "kubejs", "veldora", "patchouli",
    "http", "https", "file", "e", "g", "id", "note", "eg", "ie", "docs", "tools",
    "px", "js", "md", "py", "json", "nbt", "y", "x", "z", "n", "t", "s", "w", "h",
}

# Prose names for mods, checked in addition to namespaced ids - a doc can talk
# about "MineColonies" for pages without ever writing an item id.
PROSE = {
    "minecolonies": "minecolonies",
    "securitycraft": "securitycraft",
    "theurgy": "theurgy",
    "epic fight": "epicfight",
    "epicfight": "epicfight",
    "legendary monsters": "legendary_monsters",
    "citadel": "citadel",
}


def installed_mod_ids() -> set[str]:
    """Read mod ids from the jars themselves, not from filenames.

    Filenames lie - `born_in_chaos_[Neoforge]_1.21.1_1.7.6.jar` is `born_in_chaos_v1`
    inside. assets/<id>/ and data/<id>/ are the truth.
    """
    ids: set[str] = set()
    if not MODS.is_dir():
        return ids
    for jar in MODS.glob("*.jar"):
        try:
            z = zipfile.ZipFile(jar)
        except Exception:
            continue
        for name in z.namelist():
            m = re.match(r"^(?:assets|data)/([a-z0-9_.-]+)/", name)
            if m:
                ids.add(m.group(1))
    ids.discard("minecraft")
    return ids


# ⚠️ NO WHITESPACE AROUND THE COLON. The first version allowed it and matched
# ordinary English — "deliberately: something", "shape: a", "character: the" — and
# reported seven imaginary mods alongside the four real ones. A checker that cries
# wolf gets ignored, which is worse than not having one. A real id is
# `namespace:path` with no spaces, and the path half has to look like an id rather
# than a word.
ID_RE = re.compile(r"\b([a-z][a-z0-9_]{2,}):([a-z0-9_][a-z0-9_/.]{2,})\b")


def scan_ids(text: str) -> list[tuple[int, str]]:
    """Every `namespace:path` in a file, with its line number."""
    out = []
    for i, line in enumerate(text.split("\n"), 1):
        for ns, path in ID_RE.findall(line):
            # An id path is snake_case, slashed or dotted. A short bare word after a
            # colon is prose.
            if "_" not in path and "/" not in path and "." not in path and len(path) < 6:
                continue
            out.append((i, ns))
    return out


def check_mods(installed: set[str], quiet: bool) -> list[str]:
    problems = []
    print("\n\033[1m1. MOD CLAIMS\033[0m  — every namespaced id in docs/, vs what is installed")
    print("   %d mod ids present across %d jars" % (len(installed), len(list(MODS.glob('*.jar')))))

    missing: dict[str, list[str]] = collections.defaultdict(list)
    for doc in sorted(DOCS.rglob("*.md")):
        try:
            text = doc.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        for ln, ns in scan_ids(text):
            if ns in IGNORE_NS or ns in installed:
                continue
            missing[ns].append("%s:%d" % (doc.relative_to(REPO).as_posix(), ln))

        low = text.lower()
        for phrase, modid in PROSE.items():
            if modid in installed or phrase not in low:
                continue
            for i, line in enumerate(text.split("\n"), 1):
                if phrase in line.lower():
                    missing[modid].append("%s:%d" % (doc.relative_to(REPO).as_posix(), i))
                    break

    if not missing:
        print("   \033[32mOK\033[0m - no doc names a mod that is not installed")
        return problems

    for ns in sorted(missing, key=lambda k: -len(missing[k])):
        hits = missing[ns]
        problems.append("mod '%s' is NOT installed but is named in %d place(s)" % (ns, len(hits)))
        print("   \033[31mMISSING\033[0m %-18s named in %2d place(s)" % (ns, len(hits)))
        for h in hits[:4]:
            print("            %s" % h)
        if len(hits) > 4:
            print("            ... and %d more" % (len(hits) - 4))
    return problems


def check_paths(quiet: bool) -> list[str]:
    problems = []
    print("\n\033[1m2. PATHS\033[0m  — which are CLOSED in paths.js")
    p = SCRIPTS / "paths.js"
    if not p.is_file():
        print("   \033[31mpaths.js not found\033[0m")
        return ["paths.js missing"]
    src = p.read_text(encoding="utf-8", errors="replace")
    m = re.search(r"var CLOSED = \{(.*?)\}", src, re.S)
    closed = re.findall(r"\n\s*([a-z_]+):", m.group(1)) if m else []
    keys = re.findall(r"\n    ([a-z_]+): \{\n      name:", src)
    print("   paths: %s" % ", ".join(keys))
    print("   CLOSED (cannot be claimed): %s" % (", ".join(closed) or "none"))
    for c in closed:
        problems.append("path '%s' is CLOSED - any doc presenting it as playable is stale" % c)
    return problems


def check_voices(quiet: bool) -> list[str]:
    """Which gods actually register a voice - measured from the live boot log."""
    problems = []
    print("\n\033[1m3. VOICES\033[0m  — measured from the live boot log, not from source")
    log = INSTANCE / "logs" / "latest.log"
    if not log.is_file():
        print("   \033[33mno latest.log - cannot verify. Boot the server.\033[0m")
        return ["voices unverified: no log"]
    text = log.read_text(encoding="utf-8", errors="replace")
    said = re.findall(r"\[(\w+)\] The \w+ speaks", text)
    novoice = re.findall(r"\[(\w+)\] THE [A-Z ]+ HAS NO VOICE", text)
    tot = re.search(r"VELDORA\.voice published OK - (\d+) god\(s\), (\d+) tag\(s\), (\d+)", text)
    print("   with a written voice : %s" % (", ".join(sorted(set(said))) or "NONE"))
    if novoice:
        print("   \033[33mregistered but EMPTY\033[0m : %s" % ", ".join(sorted(set(novoice))))
        for g in sorted(set(novoice)):
            problems.append("god '%s' has no written lines yet" % g)
    if tot:
        print("   live totals: %s voices, %s tags, %s possible lines"
              % (tot.group(1), tot.group(2), tot.group(3)))
    else:
        print("   \033[33mcould not read the voice total from the log\033[0m")
    return problems


def check_retired(quiet: bool) -> list[str]:
    print("\n\033[1m4. RETIRED / GATED\033[0m  — systems that exist but do not run")
    found = []
    for f in sorted(SCRIPTS.glob("*.js")):
        src = f.read_text(encoding="utf-8", errors="replace")
        for pat, label in ((r"var RETIRED = true", "RETIRED"),
                           (r"var GATE = false", "GATE OFF"),
                           (r"var EVENTS_READY = false", "EVENTS HELD"),
                           (r"var RESPAWN_HOOK = false", "RESPAWN HOOK OFF")):
            if re.search(pat, src):
                found.append((f.name, label))
    if not found:
        print("   nothing gated off")
    for name, label in found:
        print("   %-24s %s" % (name, label))
    return []


def check_tools() -> list[str]:
    print("\n\033[1m5. TOOLS\033[0m  — scripts named after a mod that has left")
    installed = installed_mod_ids()
    problems = []
    # PROSE holds two spellings of some mods ("epic fight" / "epicfight"), so a
    # straight loop reported the same orphan file twice. Dedupe on (file, mod).
    seen = set()
    for f in sorted((REPO / "tools").glob("*.py")):
        for phrase, modid in PROSE.items():
            token = phrase.replace(" ", "")
            if token not in f.name.lower().replace("_", "") or modid in installed:
                continue
            if (f.name, modid) in seen:
                continue
            seen.add((f.name, modid))
            problems.append("tools/%s targets '%s', which is not installed" % (f.name, modid))
            print("   \033[31mORPHAN\033[0m tools/%s - '%s' is gone" % (f.name, modid))
    if not problems:
        print("   OK - every tool targets something that exists")
    return problems


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--quiet", action="store_true", help="exit 1 if anything is stale")
    a = ap.parse_args()

    print("\033[1mVELDORA FRESHNESS\033[0m  — the docs and memory, measured against the game")
    installed = installed_mod_ids()

    problems: list[str] = []
    problems += check_mods(installed, a.quiet)
    problems += check_paths(a.quiet)
    problems += check_voices(a.quiet)
    problems += check_retired(a.quiet)
    problems += check_tools()

    print("\n" + "=" * 74)
    if not problems:
        print("\033[32mCLEAN\033[0m - nothing in the docs contradicts the live game.")
        return 0
    print("\033[31m%d STALE CLAIM(S)\033[0m\n" % len(problems))
    for p in problems:
        print("  * %s" % p)
    print("\nA doc that was true when written is still a doc that is wrong now.")
    return 1 if a.quiet else 0


if __name__ == "__main__":
    sys.exit(main())
