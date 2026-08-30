"""config_sync.py — the live instance is the truth; the repo follows it.

    python tools/config_sync.py                # report drift (default, changes nothing)
    python tools/config_sync.py --pull         # refresh the repo FROM the live instance
    python tools/config_sync.py --push-pending tectonic.json

⭐ THE RULING. Ethan, 2026-08-30: *"we just need to centralize, live copy is the truth as
repo doesn't get updated as much."*

So truth flows **instance → repo**, one direction, and `--pull` is the normal operation.
`pack/config` stops pretending to be authoritative and becomes an accurate record of what
the server is actually running.

── 🔴 THE ONE THING THAT RULE CANNOT DECIDE BY ITSELF ─────────────────────────
"The live copy is the truth" is right for **drift** — a repo file nobody refreshed. It is
WRONG for a **pending decision**: a change that was ruled, written into the repo, and has
simply not been applied to the server yet. Pulling over one of those does not resolve a
disagreement, it **deletes a ruling** and leaves no trace.

There is exactly one right now:

    tectonic.json   repo -64 / instance -128

That −64 is §0.2 of the gameplan — *"for min y, yea move it back to its original."* It is
a decision waiting to land before the world is generated, not a stale file. A blind pull
would silently restore −128 and the reset would bake it in (D-112).

🔑 So PENDING files are **excluded from --pull** and reported separately. Landing one is
a deliberate act with its own flag, naming the file. If a pending change is ever applied
or abandoned, take it out of `PENDING` — an empty list is the healthy state.

⚠️ Line endings are normalised before comparing. The mods rewrite their own config at
every boot with CRLF, so a raw byte compare reports every file as drifted and buries the
three that matter.
"""
import argparse
import io
import os
import shutil
import sys

# The Windows console defaults to cp1252 and raises UnicodeEncodeError on any
# non-latin-1 character, which killed this tool AFTER it had done its work and
# printed most of its report - a failure that looks like a crash in the logic.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RCFG = os.path.join(REPO, "pack", "config")
ICFG = os.path.join(r"C:\MCServer\instance", "config")

# 🔴 Files where the REPO deliberately holds a decision the instance has not received.
# These are never pulled over. Empty is the healthy state.
PENDING = {
    # ✅ tectonic.json LANDED 2026-08-30 — Ethan: *"Push 64 to live."* min_y is -64 in
    # both now, which closes D-112.
    #
    # ⚠️ Worldgen values apply to NEW generation only, so this is a fact about the world
    # C2 will create; the CURRENT world keeps the -128 it was generated with.
    #
    # 🔑 Deleted from the list rather than left here with a "done" note. A landed
    # decision kept in PENDING blocks every future --pull forever, and a comment saying
    # "this one is finished" is exactly how that happens.
}


def norm(path):
    with open(path, "rb") as f:
        return f.read().replace(b"\r\n", b"\n")


def scan():
    same, drift, pending, absent = [], [], [], []
    for dp, _dn, fn in os.walk(RCFG):
        for f in fn:
            rp = os.path.join(dp, f)
            rel = os.path.relpath(rp, RCFG)
            ip = os.path.join(ICFG, rel)
            if not os.path.exists(ip):
                absent.append(rel)
            elif norm(rp) == norm(ip):
                same.append(rel)
            elif os.path.basename(rel) in PENDING:
                pending.append(rel)
            else:
                drift.append(rel)
    return same, drift, pending, absent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pull", action="store_true",
                    help="refresh the repo FROM the live instance (the normal direction)")
    ap.add_argument("--push-pending", metavar="FILE", default=None,
                    help="apply ONE pending repo decision to the live instance, by filename")
    args = ap.parse_args()

    if not os.path.isdir(RCFG):
        print("no repo config at %s" % RCFG)
        return 1
    if not os.path.isdir(ICFG):
        print("no instance config at %s" % ICFG)
        return 1

    same, drift, pending, absent = scan()

    # ── push one pending decision, deliberately ──────────────────────────────
    if args.push_pending:
        name = os.path.basename(args.push_pending)
        if name not in PENDING:
            print("%s is not a PENDING decision. Only these are: %s"
                  % (name, ", ".join(sorted(PENDING)) or "(none)"))
            return 1
        hit = [r for r in pending if os.path.basename(r) == name]
        if not hit:
            print("%s is listed as PENDING but the repo and instance already agree - "
                  "the decision has landed. Remove it from PENDING." % name)
            return 0
        rel = hit[0]
        src, dst = os.path.join(RCFG, rel), os.path.join(ICFG, rel)
        shutil.copy2(src, dst)
        print("pushed %s -> the live instance." % rel)
        print("⚠️  A running server has already read its config; this takes effect on the "
              "next boot. Worldgen values apply to NEW generation only.")
        print("🔑 Now remove %s from PENDING in this file - a landed decision left in the "
              "list will block the next --pull forever." % name)
        return 0

    # ── report ───────────────────────────────────────────────────────────────
    print("live instance is the truth; the repo follows it")
    print("=" * 78)
    print("  %3d in sync" % len(same))

    if drift:
        print("  %3d STALE IN THE REPO - refresh with --pull:" % len(drift))
        for rel in sorted(drift):
            print("        %s" % rel)
    if absent:
        print("  %3d tracked in the repo but ABSENT from the instance:" % len(absent))
        for rel in sorted(absent):
            print("        %s" % rel)
        print("        (either they were never deployed, or they are dead files the "
              "repo still carries)")
    if pending:
        print()
        print("  🔴 %d PENDING DECISION(S) - the repo is RIGHT and the instance has not "
              "caught up." % len(pending))
        print("     These are NOT pulled over. A pull here would delete a ruling.")
        for rel in sorted(pending):
            print("        %s" % rel)
            print("            %s" % PENDING[os.path.basename(rel)])
        print("     Land one with:  --push-pending %s"
              % os.path.basename(sorted(pending)[0]))

    if not args.pull:
        print("=" * 78)
        if drift:
            print("report only. re-run with --pull to refresh %d file(s) from the instance."
                  % len(drift))
        else:
            print("report only. nothing to pull.")
        return 0

    # ── pull ─────────────────────────────────────────────────────────────────
    for rel in drift:
        shutil.copy2(os.path.join(ICFG, rel), os.path.join(RCFG, rel))
    print("=" * 78)
    print("pulled %d file(s) from the instance into the repo." % len(drift))
    if pending:
        print("⚠️  %d pending decision(s) were LEFT ALONE, by design." % len(pending))
    print("Review the diff before committing - this is the live server's own state, "
          "including anything another channel changed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
