"""Pull the LIVE 1.21.1 / NeoForge mod population off Modrinth.

Why this exists
---------------
A 400-mod pack cannot be assembled from memory. Half of what "everyone knows"
about a mod ecosystem is a version behind, and 1.21.1 in particular has a long
tail of mods that never left 1.20.1. So we do not guess: we ask the registry
what actually exists, cache it, and curate from real data.

Two passes:

  1. BROAD   — paginate the whole `1.21.1 + neoforge + mod` population sorted by
               downloads. This is the field we're choosing from.
  2. TARGETED— run theme queries (create, ars nouveau, guns, horror, ...) so a
               niche-but-perfect mod that sits at rank 3000 by downloads still
               surfaces.

Output lands in tools/.cache/ (gitignored) as JSON. Nothing here writes to the
pack; curation is a separate, human-reviewed step.

Stdlib only, on purpose — this has to run on a bare dedicated box with nothing
but a Python install.
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

# Modrinth asks for an identifying User-Agent and rate-limits to 300 req/min.
# We stay far under that; being a good citizen costs us nothing here.
UA = "EHtut/MCServer-buildout/0.1 (github.com/EHtut)"
SLEEP = 0.25

GAME_VERSION = "1.21.1"
LOADER = "neoforge"

CACHE = pathlib.Path(__file__).resolve().parent / ".cache"

# Theme queries. Each one is a lens on the same population — a mod that only
# shows up under "horror" and nowhere in the top-1000 by downloads is exactly
# the kind of thing this pass is for.
THEME_QUERIES = [
    # --- Create / industry -------------------------------------------------
    "create", "create addon", "contraption", "automation", "logistics",
    "factory", "machine", "pipe", "storage automation", "train", "railway",
    # --- Ars Nouveau / magic ----------------------------------------------
    "ars nouveau", "ars", "magic", "spell", "wizard", "ritual", "arcane",
    "enchanting", "summoning", "familiar", "mana", "alchemy", "curse",
    # --- Combat / guns -----------------------------------------------------
    "gun", "firearm", "weapon", "combat", "ballistics", "ammo", "shield",
    "armor", "melee", "bow", "artillery", "explosive",
    # --- Horror ------------------------------------------------------------
    "horror", "scary", "nightmare", "eldritch", "parasite", "zombie",
    "monster", "boss", "dungeon", "cursed", "darkness", "fog", "creepy",
    "difficulty", "hardcore",
    # --- World / exploration ----------------------------------------------
    "worldgen", "biome", "structure", "dimension", "cave", "village",
    "exploration", "mob", "creature", "npc", "quest",
    # --- QoL ---------------------------------------------------------------
    "quality of life", "inventory", "minimap", "tooltip", "backpack",
    "utility", "hud", "recipe viewer", "waypoint", "sorting", "shulker",
    "food", "farming", "building", "decoration", "furniture",
    # --- Performance / server ---------------------------------------------
    "performance", "optimization", "memory", "chunk", "lag", "server",
    "admin", "backup", "permissions", "anti-cheat", "profiler",
    # --- Library / API (needed as dependencies) ---------------------------
    "library", "api", "core",
]


def _get(path: str, params: dict) -> dict:
    url = f"{API}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            # 429 = rate limited. Back off honestly rather than hammering.
            if e.code == 429:
                wait = int(e.headers.get("X-Ratelimit-Reset", "10")) + 1
                print(f"  rate limited, sleeping {wait}s", file=sys.stderr)
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


def _facets() -> str:
    return json.dumps([
        [f"versions:{GAME_VERSION}"],
        [f"categories:{LOADER}"],
        ["project_type:mod"],
    ])


def search(query: str, limit: int, offset: int, index: str = "downloads") -> dict:
    return _get("/search", {
        "query": query,
        "facets": _facets(),
        "limit": limit,
        "offset": offset,
        "index": index,
    })


def broad_sweep(max_projects: int = 1500) -> dict[str, dict]:
    """Everything for 1.21.1+neoforge, most-downloaded first."""
    found: dict[str, dict] = {}
    offset = 0
    page = 100
    total = None
    while offset < max_projects:
        data = search("", page, offset)
        total = data.get("total_hits", 0)
        hits = data.get("hits", [])
        if not hits:
            break
        for h in hits:
            found[h["slug"]] = h
        print(f"  broad: offset={offset:>5} got={len(hits):>3} unique={len(found):>4} of {total}")
        offset += page
        if offset >= total:
            break
        time.sleep(SLEEP)
    print(f"  broad sweep: {len(found)} unique projects (registry reports {total} total)")
    return found


def targeted_sweep(per_query: int = 60) -> dict[str, dict]:
    """Theme queries, to surface the niche-but-right long tail."""
    found: dict[str, dict] = {}
    for q in THEME_QUERIES:
        try:
            data = search(q, per_query, 0, index="relevance")
        except Exception as e:  # one bad query must not kill the sweep
            print(f"  targeted[{q}]: FAILED {e}", file=sys.stderr)
            continue
        hits = data.get("hits", [])
        for h in hits:
            found.setdefault(h["slug"], h)
        print(f"  targeted[{q!r}]: {len(hits)} hits, running unique={len(found)}")
        time.sleep(SLEEP)
    return found


def main() -> int:
    CACHE.mkdir(parents=True, exist_ok=True)
    print(f"Discovering mods for Minecraft {GAME_VERSION} / {LOADER}\n")

    print("[1/2] broad sweep by downloads")
    broad = broad_sweep()

    print("\n[2/2] targeted theme sweeps")
    targeted = targeted_sweep()

    merged = dict(broad)
    new_from_targeted = 0
    for slug, hit in targeted.items():
        if slug not in merged:
            merged[slug] = hit
            new_from_targeted += 1

    # Trim to the fields curation actually needs — the raw hits are fat.
    slim = {
        slug: {
            "slug": slug,
            "title": h.get("title"),
            "description": h.get("description"),
            "downloads": h.get("downloads"),
            "follows": h.get("follows"),
            "categories": h.get("categories"),
            "client_side": h.get("client_side"),
            "server_side": h.get("server_side"),
            "project_id": h.get("project_id"),
            "date_modified": h.get("date_modified"),
            "license": h.get("license"),
        }
        for slug, h in merged.items()
    }

    out = CACHE / "modrinth_1_21_1_neoforge.json"
    out.write_text(json.dumps(slim, indent=1, sort_keys=True), encoding="utf-8")

    print(f"\nbroad={len(broad)}  targeted-only-new={new_from_targeted}  total={len(slim)}")
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
