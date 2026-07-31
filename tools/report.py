"""Turn the resolution output into something a human can make decisions from.

  python tools/report.py summary     counts by status, category and tier
  python tools/report.py fails       every unresolved candidate, with WHY it failed
  python tools/report.py sides       client-only / server-only / both breakdown
  python tools/report.py budget      what the pack looks like against the 400 cap
  python tools/report.py deps        resolved mods whose dependencies are not in the pack
"""

from __future__ import annotations

import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
RESOLVED = HERE / ".cache" / "resolved.json"


def load() -> list[dict]:
    return json.loads(RESOLVED.read_text(encoding="utf-8"))


def summary(rows: list[dict]) -> None:
    by_status: dict[str, int] = {}
    for r in rows:
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1
    print("=== status ===")
    for k, v in sorted(by_status.items(), key=lambda kv: -kv[1]):
        print(f"  {k:<22} {v:>4}")

    print("\n=== resolved by category ===")
    cats: dict[str, list[int]] = {}
    for r in rows:
        c = r.get("category") or "?"
        slot = cats.setdefault(c, [0, 0])
        slot[1] += 1
        if r["status"] == "RESOLVED":
            slot[0] += 1
    total_ok = 0
    for c, (ok, tot) in sorted(cats.items(), key=lambda kv: -kv[1][0]):
        total_ok += ok
        print(f"  {c:<20} {ok:>4} / {tot:<4}")
    print(f"  {'TOTAL':<20} {total_ok:>4}")

    print("\n=== resolved by tier ===")
    tiers: dict[str, int] = {}
    for r in rows:
        if r["status"] == "RESOLVED":
            tiers[r.get("tier") or "?"] = tiers.get(r.get("tier") or "?", 0) + 1
    for t in ("core", "major", "minor", "risky"):
        if t in tiers:
            print(f"  {t:<10} {tiers[t]:>4}")

    print("\n=== version quality (resolved) ===")
    vt: dict[str, int] = {}
    for r in rows:
        if r["status"] == "RESOLVED":
            vt[r.get("version_type") or "?"] = vt.get(r.get("version_type") or "?", 0) + 1
    for k, v in sorted(vt.items(), key=lambda kv: -kv[1]):
        print(f"  {k:<10} {v:>4}")

    size = sum(r.get("size") or 0 for r in rows if r["status"] == "RESOLVED")
    print(f"\ntotal download size of resolved mods: {size / 1024 / 1024:,.0f} MB")


def fails(rows: list[dict]) -> None:
    print("=== NOT_FOUND (slug wrong, or not on Modrinth at all) ===")
    for r in rows:
        if r["status"] == "NOT_FOUND":
            print(f"  {r['slug']:<38} [{r.get('category')}/{r.get('tier')}]  {r.get('why', '')[:70]}")
    print("\n=== NO_MATCHING_VERSION (exists, but not for 1.21.1 + neoforge) ===")
    for r in rows:
        if r["status"] == "NO_MATCHING_VERSION":
            print(f"  {r['slug']:<38} [{r.get('category')}/{r.get('tier')}]")
            print(f"      offers loaders={','.join(r.get('loaders') or []) or 'none'}"
                  f"  recent_gv={','.join(r.get('game_versions') or [])}")
    errs = [r for r in rows if r["status"] not in ("RESOLVED", "NOT_FOUND", "NO_MATCHING_VERSION")]
    if errs:
        print("\n=== OTHER ===")
        for r in errs:
            print(f"  {r['slug']:<38} {r['status']} {r.get('error', '')}")


def sides(rows: list[dict]) -> None:
    buckets: dict[str, list[str]] = {"both": [], "client-only": [], "server-only": [], "unknown": []}
    for r in rows:
        if r["status"] != "RESOLVED":
            continue
        c, s = r.get("client_side"), r.get("server_side")
        if c in ("required", "optional") and s == "unsupported":
            buckets["client-only"].append(r["slug"])
        elif s in ("required", "optional") and c == "unsupported":
            buckets["server-only"].append(r["slug"])
        elif c and s:
            buckets["both"].append(r["slug"])
        else:
            buckets["unknown"].append(r["slug"])
    for k, v in buckets.items():
        print(f"\n=== {k} ({len(v)}) ===")
        print("  " + ", ".join(sorted(v)))


def budget(rows: list[dict]) -> None:
    ok = [r for r in rows if r["status"] == "RESOLVED"]
    print(f"resolved: {len(ok)}  (cap 400)")
    order = {"core": 0, "major": 1, "minor": 2, "risky": 3}
    ok.sort(key=lambda r: (order.get(r.get("tier"), 9), r.get("category") or ""))
    running = 0
    seen_tier = None
    for r in ok:
        if r.get("tier") != seen_tier:
            seen_tier = r.get("tier")
            print(f"\n--- tier: {seen_tier} ---")
        running += 1
        flag = "  " if running <= 400 else "XX"
        print(f"{flag} {running:>3} {r['slug']:<40} {r.get('category')}")


def deps(rows: list[dict]) -> None:
    """Required dependencies that no pack member provides.

    Modrinth reports dependencies by project id, so we map ids we already have.
    Anything left over is a mod we would be installing implicitly - better to
    list it in modlist.json deliberately than to let it appear by accident.
    """
    have_ids = {r.get("project_id") for r in rows if r["status"] == "RESOLVED"}
    missing: dict[str, list[str]] = {}
    for r in rows:
        if r["status"] != "RESOLVED":
            continue
        for d in r.get("dependencies") or []:
            if d.get("type") != "required":
                continue
            pid = d.get("project_id")
            if pid and pid not in have_ids:
                missing.setdefault(pid, []).append(r["slug"])
    print(f"{len(missing)} required dependencies are not explicitly in the list:\n")
    for pid, needed_by in sorted(missing.items(), key=lambda kv: -len(kv[1])):
        print(f"  {pid}   needed by: {', '.join(sorted(needed_by)[:8])}"
              f"{' ...' if len(needed_by) > 8 else ''}")


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    rows = load()
    fn = {"summary": summary, "fails": fails, "sides": sides, "budget": budget, "deps": deps}
    f = fn.get(sys.argv[1])
    if not f:
        print(__doc__)
        return 1
    f(rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
