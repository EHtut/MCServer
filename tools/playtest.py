"""playtest - audit a live session for bugs and features that never fired.

    python tools/playtest.py            this session
    python tools/playtest.py --all      every archived log too

WHY THIS EXISTS
    Ethan, 2026-08-15: "we'll do live testing but flag an audit for bugs or broken
    features while we play."

    Two different questions, and only one of them is easy:

      1. DID ANYTHING BREAK?      the log says so, if you know what to grep for.
      2. DID ANYTHING NOT HAPPEN? the log says NOTHING AT ALL, which is exactly
                                  how a dead feature survives a playtest.

    This project's whole history is question 2. `logq errors` reported "0 real
    errors" for weeks while KubeJS script failures went unseen. A subsystem sat
    configured-on and producing nothing while every harness passed. An event was
    registered, rolled, picked and then quietly refused to fire, and the log looked
    identical to a session where it simply never came up.

    So the SILENCE section below matters more than the ERRORS section. Anything
    registered that never once fired is listed, because "we did not test that" and
    "that is broken" look the same from here - and only the person who was playing
    can tell them apart.

⚠️ IT DOES NOT GUESS. A feature that never fired is reported as never fired, not as
    broken. The judgement is Ethan's; the measurement is this tool's.
"""

from __future__ import annotations

import argparse
import collections
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "tools"))
import logq  # noqa: E402

# Everything the pantheon can register, so we can ask what never happened.
REGISTERED_RE = re.compile(r"\[events\]\s+(\w+)/(\w+) \[")
FIRED_RE = re.compile(r"\[events\] (\w+) <- (\w+)/(\w+)")

# Lines that mean something went wrong even though nothing threw.
SMELLS = [
    (r"NOT stamping", "an event refused to complete"),
    (r"did not happen - NOT stamping", "an event ran and failed"),
    (r"FAILED to place", "a spawn placed nothing"),
    (r"placed NOTHING", "a spawn placed nothing"),
    (r"!! .*HAS NO VOICE", "a god registered with no lines"),
    (r"HELD -", "a subsystem held itself back"),
    (r"cannot release", "a player won and was not released"),
    (r"could not kill", "the Spider let a refusal live"),
    (r"is MISSING", "a published seam was absent"),
    (r"threw ::", "a handler caught an exception"),
    (r"GATED OFF", "a system is switched off"),
    (r"no valid target", "a PvP event had nobody to point at"),
    (r"UNREADABLE", "a counter could not be read"),
]

# Things that should be SEEN at least once in a real playtest.
WANTED = [
    ("a path was claimed", r"\[paths\] .* entered "),
    ("chosen: a path unlocked", r"\[chosen\] .* UNLOCKED "),
    ("chosen: an offer was made", r"\[chosen\] !! .* makes its ONE offer"),
    ("an introduction ran", r"\[intro\] .* met "),
    ("a patron idle line", r"\[idle\] .* <- "),
    ("the pathless overheard", r"\[pathless\] .* overheard"),
    ("a god event fired", r"\[events\] \w+ <- "),
    ("a Harvest began", r"\[harvest\] .* Harvest began"),
    ("a Harvest resolved", r"\[harvest\] .* resolved"),
    ("a deep speaker spoke", r"\[speaker\] .* has met "),
    ("a confession played", r"\[speaker\] !! .* CONFESS"),
    ("the death ladder moved", r"\[regard\] .* -> "),
    ("a trade completed", r"\[salvage\] .* (?:paid|traded|for )"),
    ("rage moved", r"\[counter\] \w+ wall "),
]


def sessions(text: str) -> int:
    return len(re.findall(r"Starting minecraft server", text))


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--all", action="store_true", help="include archived logs")
    a = ap.parse_args()

    rows = []
    for p in logq.log_files(a.all):
        rows.extend(logq.parsed_lines(p))
    if not rows:
        print("no log found - has the server booted?")
        return 1

    text = "\n".join(r[3] for r in rows)
    print("\033[1mVELDORA PLAYTEST AUDIT\033[0m  — %d log lines, %d boot(s)\n"
          % (len(rows), sessions(text)))

    # ── 1. errors ────────────────────────────────────────────────────────────
    print("\033[1m1. ERRORS\033[0m")
    errs = 0
    for ln, ts, logger, msg, raw in rows:
        script = bool(logq.SCRIPT_ERR.search(msg))
        if not script and "/ERROR" not in logger and "/FATAL" not in logger:
            continue
        if logq.NOISE.search(msg):
            continue
        errs += 1
        if errs <= 12:
            print("   \033[31m%s\033[0m %s" % (ts.strftime("%H:%M:%S"), msg[:120]))
    if not errs:
        print("   \033[32mnone\033[0m")
    elif errs > 12:
        print("   ... and %d more" % (errs - 12))

    # ── 2. smells ────────────────────────────────────────────────────────────
    print("\n\033[1m2. THINGS THAT WENT WRONG WITHOUT THROWING\033[0m")
    found = collections.Counter()
    example = {}
    for ln, ts, logger, msg, raw in rows:
        for pat, label in SMELLS:
            if re.search(pat, msg):
                found[label] += 1
                example.setdefault(label, msg[:110])
    if not found:
        print("   \033[32mnone\033[0m")
    for label, n in found.most_common():
        print("   \033[33m%3dx\033[0m %-36s %s" % (n, label, example[label]))

    # ── 3. the silence ───────────────────────────────────────────────────────
    print("\n\033[1m3. ⭐ THE SILENCE\033[0m  — registered, never fired")
    registered = set()
    for m in REGISTERED_RE.finditer(text):
        registered.add((m.group(1), m.group(2)))
    fired = collections.Counter()
    for m in FIRED_RE.finditer(text):
        fired[(m.group(2), m.group(3))] += 1

    if not registered:
        print("   (no event roster in this log)")
    else:
        never = sorted(registered - set(fired))
        did = sorted(fired.items(), key=lambda kv: -kv[1])
        print("   fired: %d of %d registered events" % (len(fired), len(registered)))
        for (god, ev), n in did:
            print("     \033[32m%3dx\033[0m %s/%s" % (n, god, ev))
        if never:
            print("   \033[33mNEVER FIRED\033[0m (%d) - not proof of a bug, but nothing tested them:"
                  % len(never))
            for god, ev in never:
                print("     %s/%s" % (god, ev))

    # ── 4. did the headline features happen at all ──────────────────────────
    print("\n\033[1m4. FEATURES SEEN THIS SESSION\033[0m")
    unseen = []
    for label, pat in WANTED:
        hits = len(re.findall(pat, text))
        if hits:
            print("   \033[32mYES\033[0m %-32s x%d" % (label, hits))
        else:
            unseen.append(label)
    for label in unseen:
        print("   \033[33m --\033[0m %s" % label)

    print("\n" + "=" * 74)
    print("%d error(s), %d smell type(s), %d feature(s) never seen."
          % (errs, len(found), len(unseen)))
    print("⭐ 'Never fired' is NOT a bug report. It means nothing exercised it -")
    print("   only the person who was playing can say which.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
