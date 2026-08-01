"""Resolve mods to exact, pinned files — and tell the truth when it can't.

This is the authoritative pass. The discovery cache is a curation aid; THIS is
what decides whether a mod is in the pack, because it asks Modrinth directly
about a specific slug rather than relying on whether a search query happened to
surface it.

Three modes:

  find <name> ...     Search by display name and report, for each candidate, the
                      game versions and loaders it ACTUALLY supports. Use this to
                      correct slug guesses and to see at a glance whether a mod
                      ever reached 1.21.1/NeoForge.

  check <slug> ...    For each slug: does the project exist, and does it have a
                      1.21.1 + neoforge version?

  resolve <file>      Read a curated modlist (JSON) and resolve every entry to a
                      concrete version + file + sha512 + declared dependencies.
                      Writes a machine-readable report for the pack generator.

Honest failure is the whole point: NOT_FOUND, NO_MATCHING_VERSION and RESOLVED
are three distinct outcomes and never collapse into one.
"""

from __future__ import annotations

import json
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.modrinth.com/v2"
UA = "EHtut/MCServer-buildout/0.1 (+https://github.com/EHtut)"
SLEEP = 0.12

GAME_VERSION = "1.21.1"
LOADER = "neoforge"

HERE = pathlib.Path(__file__).resolve().parent
CACHE = HERE / ".cache"


def _req(url: str) -> dict | list:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise
            if e.code == 429:
                wait = int(e.headers.get("X-Ratelimit-Reset", "10")) + 1
                time.sleep(wait)
                continue
            if 500 <= e.code < 600 and attempt < 4:
                time.sleep(2 * (attempt + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if attempt < 4:
                time.sleep(2 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"gave up on {url}")


def project(slug: str) -> dict | None:
    try:
        return _req(f"{API}/project/{urllib.parse.quote(slug)}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def versions(slug: str, filtered: bool = True, loader: str = LOADER) -> list:
    q = ""
    if filtered:
        q = "?" + urllib.parse.urlencode({
            "loaders": json.dumps([loader]),
            "game_versions": json.dumps([GAME_VERSION]),
        })
    try:
        return _req(f"{API}/project/{urllib.parse.quote(slug)}/version{q}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return []
        raise


def search(query: str, limit: int = 8) -> list:
    url = f"{API}/search?" + urllib.parse.urlencode({
        "query": query, "limit": limit, "index": "relevance",
        "facets": json.dumps([["project_type:mod"]]),
    })
    return _req(url).get("hits", [])


def pick(vs: list) -> dict | None:
    """Newest suitable version, preferring a real release over beta/alpha.

    A stable release two weeks old beats a beta from yesterday: this pack has to
    survive four people playing it, not showcase the bleeding edge.
    """
    if not vs:
        return None
    order = {"release": 0, "beta": 1, "alpha": 2}
    ranked = sorted(vs, key=lambda v: v.get("date_published", ""), reverse=True)
    ranked.sort(key=lambda v: order.get(v.get("version_type"), 3))  # stable → newest wins per type
    return ranked[0]


def primary_file(v: dict) -> dict | None:
    files = v.get("files") or []
    for f in files:
        if f.get("primary"):
            return f
    return files[0] if files else None


def cmd_find(names: list[str]) -> int:
    for name in names:
        print(f"\n=== search: {name!r} ===")
        try:
            hits = search(name)
        except Exception as e:
            print(f"  search failed: {e}")
            continue
        if not hits:
            print("  (no results)")
        for h in hits:
            slug = h["slug"]
            gvs = h.get("versions") or []
            cats = h.get("categories") or []
            loaders = [c for c in cats if c in ("neoforge", "forge", "fabric", "quilt")]

            # Search metadata is an AGGREGATE: a project can advertise 1.21.1 and
            # advertise neoforge while having no 1.21.1 NEOFORGE build at all
            # (different loaders, different versions). Only the version endpoint
            # answers the question we actually care about, so we pay for it.
            try:
                matching = versions(slug)
            except Exception:
                matching = []
            mark = "OK  " if matching else "--  "
            ver = matching[0].get("version_number") if matching else ""
            print(f"  {mark}{slug:<38} {(h.get('title') or '')[:28]:<28} "
                  f"1.21.1+neoforge={'YES ' + str(ver) if matching else 'no'}"
                  f"  | advertises loaders={','.join(loaders) or 'none'}"
                  f" newest_gv={gvs[-1] if gvs else '?'} dl={h.get('downloads', 0):,}")
            time.sleep(SLEEP)
        time.sleep(SLEEP)
    return 0


def cmd_check(slugs: list[str]) -> int:
    ok = miss = nover = 0
    for slug in slugs:
        p = project(slug)
        if p is None:
            print(f"NOT_FOUND          {slug}")
            miss += 1
            time.sleep(SLEEP)
            continue
        vs = versions(slug)
        if not vs:
            all_gv = p.get("game_versions") or []
            all_ld = p.get("loaders") or []
            print(f"NO_MATCHING_VER    {slug:<36} loaders={','.join(all_ld) or 'none':<24} "
                  f"newest_gv={all_gv[-1] if all_gv else '?'}")
            nover += 1
        else:
            v = pick(vs)
            f = primary_file(v)
            print(f"RESOLVED           {slug:<36} {v['version_number']:<22} "
                  f"{v.get('version_type'):<8} {f['filename'] if f else '?'}")
            ok += 1
        time.sleep(SLEEP)
    print(f"\nresolved={ok}  no_matching_version={nover}  not_found={miss}")
    return 0


def resolve_one(slug: str) -> dict:
    p = project(slug)
    if p is None:
        return {"slug": slug, "status": "NOT_FOUND"}
    vs = versions(slug)
    if not vs:
        return {
            "slug": slug, "status": "NO_MATCHING_VERSION",
            "title": p.get("title"),
            "loaders": p.get("loaders"),
            "game_versions": (p.get("game_versions") or [])[-6:],
        }
    v = pick(vs)
    f = primary_file(v)
    if not f:
        return {"slug": slug, "status": "NO_FILE", "title": p.get("title")}
    deps = []
    for d in v.get("dependencies") or []:
        deps.append({
            "project_id": d.get("project_id"),
            "version_id": d.get("version_id"),
            "type": d.get("dependency_type"),
        })
    return {
        "slug": slug,
        "status": "RESOLVED",
        "title": p.get("title"),
        "project_id": p.get("id"),
        "client_side": p.get("client_side"),
        "server_side": p.get("server_side"),
        "categories": p.get("categories"),
        "version_id": v.get("id"),
        "version_number": v.get("version_number"),
        "version_type": v.get("version_type"),
        "filename": f.get("filename"),
        "url": f.get("url"),
        "size": f.get("size"),
        "sha512": (f.get("hashes") or {}).get("sha512"),
        "sha1": (f.get("hashes") or {}).get("sha1"),
        "dependencies": deps,
    }


def load_modlist(path: str) -> list[dict]:
    """Flatten the curated categories -> mods -> [slug, why, tier] structure.

    Deduplicates by slug. A mod deliberately listed under two categories (a few
    are - Galosphere is both cave worldgen and horror atmosphere) keeps its FIRST
    category and is not resolved twice.
    """
    src = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    entries: list[dict] = []
    seen: set[str] = set()
    dupes = 0
    for cat, block in src["categories"].items():
        for row in block["mods"]:
            slug, why, tier = row[0], row[1], row[2]
            if slug in seen:
                dupes += 1
                continue
            seen.add(slug)
            entries.append({"slug": slug, "category": cat, "why": why, "tier": tier})
    if dupes:
        print(f"(deduped {dupes} slugs listed in more than one category)")
    return entries


def cmd_resolve(path: str) -> int:
    entries = load_modlist(path)
    out = []
    counts: dict[str, int] = {}
    for i, e in enumerate(entries, 1):
        slug = e["slug"]
        try:
            r = resolve_one(slug)
        except Exception as exc:  # a single bad slug must not lose 400 lookups
            r = {"slug": slug, "status": "ERROR", "error": str(exc)}
        r["category"] = e["category"]
        r["why"] = e["why"]
        r["tier"] = e["tier"]
        counts[r["status"]] = counts.get(r["status"], 0) + 1
        out.append(r)
        print(f"[{i:>3}/{len(entries)}] {r['status']:<20} {slug}")
        time.sleep(SLEEP)

    CACHE.mkdir(parents=True, exist_ok=True)
    dest = CACHE / "resolved.json"
    dest.write_text(json.dumps(out, indent=1), encoding="utf-8")
    print("\n--- summary ---")
    for k, v in sorted(counts.items()):
        print(f"  {k:<22} {v}")
    print(f"wrote {dest}")
    return 0


def cmd_deps() -> int:
    """Resolve the required-dependency project IDs the pack does not yet contain.

    Two kinds of answer come back and they must not be confused:

      REAL     - a NeoForge 1.21.1 mod we are relying on implicitly. Add it to
                 modlist.json so it is a deliberate, documented member.
      CROSS    - a dependency that only applies on another loader. Multiloader
                 jars publish one file for Fabric and NeoForge and declare both
                 loaders' dependencies, so Fabric API shows up here despite
                 being irrelevant to us. Ignoring these is correct; ignoring the
                 first kind is how a pack fails to boot.
    """
    rows = json.loads((CACHE / "resolved.json").read_text(encoding="utf-8"))
    have = {r.get("project_id") for r in rows if r["status"] == "RESOLVED"}
    missing: dict[str, list[str]] = {}
    for r in rows:
        if r["status"] != "RESOLVED":
            continue
        for d in r.get("dependencies") or []:
            if d.get("type") == "required" and d.get("project_id") and d["project_id"] not in have:
                missing.setdefault(d["project_id"], []).append(r["slug"])

    real, cross = [], []
    for pid, needed_by in sorted(missing.items(), key=lambda kv: -len(kv[1])):
        try:
            p = project(pid)
        except Exception as e:
            print(f"  ?? {pid} lookup failed: {e}")
            continue
        if p is None:
            print(f"  ?? {pid} not found")
            continue
        slug = p.get("slug")
        has = bool(versions(slug))
        entry = (slug, p.get("title"), len(needed_by), sorted(needed_by)[:5])
        (real if has else cross).append(entry)
        time.sleep(SLEEP)

    print(f"\n=== REAL: needed on 1.21.1 NeoForge, add these ({len(real)}) ===")
    for slug, title, n, by in sorted(real, key=lambda e: -e[2]):
        print(f'  ["{slug}", "Required by {", ".join(by)}", "core"],   # {title}, {n} dependents')
    print(f"\n=== CROSS-LOADER: no 1.21.1 NeoForge build, safe to ignore ({len(cross)}) ===")
    for slug, title, n, by in sorted(cross, key=lambda e: -e[2]):
        print(f"  {slug:<32} {str(title)[:28]:<28} declared by {n}: {', '.join(by)}")

    # --- the mirror check: libraries nobody needs any more -----------------
    # Cutting a content mod silently strands its libraries. They still resolve,
    # still download, still load - they are simply dead weight, and dead weight
    # in a library is worse than in a content mod because nobody ever looks at
    # it again. Only auto-deps is checked: core-libs holds deliberate choices.
    needed: set[str] = set()
    for r in rows:
        if r["status"] != "RESOLVED":
            continue
        for d in r.get("dependencies") or []:
            if d.get("project_id"):
                needed.add(d["project_id"])
    orphans = [
        r for r in rows
        if r["status"] == "RESOLVED"
        and r.get("category") == "auto-deps"
        and r.get("project_id") not in needed
    ]
    print(f"\n=== ORPHANED: in auto-deps but nothing depends on them ({len(orphans)}) ===")
    for r in sorted(orphans, key=lambda x: x["slug"]):
        print(f"  {r['slug']:<34} {str(r.get('title'))[:30]:<30} {r.get('why', '')[:52]}")
    if orphans:
        print("\n  !! DO NOT CUT THESE ON THIS EVIDENCE ALONE. This list is built from")
        print("     Modrinth's dependency data, which is author-maintained and provably")
        print("     incomplete - OctoLib, Knight Lib and Iron's Lib are all REQUIRED by")
        print("     jar manifests while Modrinth declares no dependents at all.")
        print("     Confirm with tools/check_deps.py, which reads the jars, before removing.")
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "find":
        return cmd_find(args)
    if cmd == "check":
        return cmd_check(args)
    if cmd == "resolve":
        return cmd_resolve(args[0])
    if cmd == "deps":
        return cmd_deps()
    print(__doc__)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
