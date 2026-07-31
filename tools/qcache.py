"""Query the discovery cache. A curation microscope, not part of the build.

  python tools/qcache.py find <term> [<term> ...]   # substring over slug/title/desc
  python tools/qcache.py slug <slug> [<slug> ...]   # exact slug presence check
  python tools/qcache.py top <n> [--cat <category>] # most-downloaded, optionally by category
  python tools/qcache.py cats                       # category histogram
"""

from __future__ import annotations

import json
import pathlib
import sys

CACHE = pathlib.Path(__file__).resolve().parent / ".cache" / "modrinth_1_21_1_neoforge.json"


def load() -> dict[str, dict]:
    return json.loads(CACHE.read_text(encoding="utf-8"))


def _row(p: dict) -> str:
    dl = p.get("downloads") or 0
    side = f"{(p.get('client_side') or '?')[:3]}/{(p.get('server_side') or '?')[:3]}"
    desc = (p.get("description") or "").replace("\n", " ")[:96]
    return f"{dl:>10,}  {side:<8} {p['slug']:<38} {(p.get('title') or '')[:34]:<34} {desc}"


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    cmd, args = sys.argv[1], sys.argv[2:]
    data = load()

    if cmd == "find":
        for term in args:
            t = term.lower()
            hits = [
                p for p in data.values()
                if t in p["slug"].lower()
                or t in (p.get("title") or "").lower()
                or t in (p.get("description") or "").lower()
            ]
            hits.sort(key=lambda p: -(p.get("downloads") or 0))
            print(f"\n=== {term!r} — {len(hits)} hits ===")
            for p in hits[:40]:
                print(_row(p))

    elif cmd == "slug":
        for s in args:
            p = data.get(s)
            print(f"{'HIT ' if p else 'MISS'} {s:<40} " + (_row(p) if p else ""))

    elif cmd == "top":
        n = int(args[0]) if args else 50
        cat = None
        if "--cat" in args:
            cat = args[args.index("--cat") + 1]
        rows = [p for p in data.values() if not cat or cat in (p.get("categories") or [])]
        rows.sort(key=lambda p: -(p.get("downloads") or 0))
        for p in rows[:n]:
            print(_row(p))

    elif cmd == "cats":
        hist: dict[str, int] = {}
        for p in data.values():
            for c in p.get("categories") or []:
                hist[c] = hist.get(c, 0) + 1
        for c, n in sorted(hist.items(), key=lambda kv: -kv[1]):
            print(f"{n:>5}  {c}")

    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
