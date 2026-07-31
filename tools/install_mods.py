"""Materialise the pack: download every mod for a given side, verify, place.

This is a small, dependency-free packwiz-installer. It exists because the whole
point of the manifest is that the runtime can be rebuilt from it on any machine
with a Python install - including the dedicated box this server is eventually
moving to, before anything else is set up on it.

Guarantees:

  * Every file is verified against the sha512 in the manifest AFTER download.
    A mismatch is a hard failure, never a warning - a corrupt or substituted jar
    is exactly the thing hash pinning exists to catch.
  * Already-correct files are skipped by hash, so re-running is cheap and safe.
  * Files in the target directory that the manifest does not list are reported
    (and removed with --prune), so a stale jar from an old revision cannot
    silently stay loaded.

Usage:
  python tools/install_mods.py --side server --dest C:/MCServer/instance/mods
  python tools/install_mods.py --side client --dest ./client-mods --dry-run
  python tools/install_mods.py --side server --dest ... --prune
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import pathlib
import sys
import time
import tomllib
import urllib.error
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
PACK = HERE.parent / "pack"
UA = "EHtut/MCServer-buildout/0.1"

# A cache shared between the server instance and any client bundle, so a 1.7 GB
# pack is pulled from the network once rather than once per target.
DEFAULT_CACHE = pathlib.Path("C:/MCServer/cache") if sys.platform == "win32" else \
    pathlib.Path.home() / ".cache" / "mcserver-pack"


def load_metafiles() -> list[dict]:
    index = tomllib.loads((PACK / "index.toml").read_text(encoding="utf-8"))
    out = []
    for entry in index.get("files", []):
        p = PACK / entry["file"]
        meta = tomllib.loads(p.read_text(encoding="utf-8"))
        meta["_metafile"] = entry["file"]
        out.append(meta)
    return out


def wanted(meta: dict, side: str) -> bool:
    s = meta.get("side", "both")
    return s == "both" or s == side


def sha512(path: pathlib.Path) -> str:
    h = hashlib.sha512()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(url: str, dest: pathlib.Path, expect: str, retries: int = 4) -> tuple[bool, str]:
    """Download to a temp file, verify, then move into place.

    Verify-then-rename means an interrupted or corrupt download can never be
    mistaken for a good file on the next run.
    """
    tmp = dest.with_suffix(dest.suffix + ".part")
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r, tmp.open("wb") as f:
                while chunk := r.read(1 << 20):
                    f.write(chunk)
            got = sha512(tmp)
            if got != expect:
                tmp.unlink(missing_ok=True)
                if attempt < retries - 1:
                    time.sleep(1 + attempt)
                    continue
                return False, f"hash mismatch (expected {expect[:16]}..., got {got[:16]}...)"
            tmp.replace(dest)
            return True, "downloaded"
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as e:
            tmp.unlink(missing_ok=True)
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            return False, f"{type(e).__name__}: {e}"
    return False, "exhausted retries"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--side", choices=["server", "client"], required=True)
    ap.add_argument("--dest", required=True, help="target mods directory")
    ap.add_argument("--cache", default=str(DEFAULT_CACHE))
    ap.add_argument("--jobs", type=int, default=8)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--prune", action="store_true",
                    help="delete jars in --dest that the manifest does not list")
    args = ap.parse_args()

    dest = pathlib.Path(args.dest)
    cache = pathlib.Path(args.cache)
    metas = [m for m in load_metafiles() if wanted(m, args.side)]
    total_bytes = 0

    print(f"pack: {len(load_metafiles())} mods, {len(metas)} apply to side={args.side}")
    if args.dry_run:
        for m in sorted(metas, key=lambda x: x["filename"]):
            print(f"  {m.get('side', 'both'):<7} {m['filename']}")
        print(f"\n(dry run - nothing downloaded; dest would be {dest})")
        return 0

    dest.mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)

    def one(m: dict) -> tuple[str, str]:
        name = m["filename"]
        want = m["download"]["hash"]
        target = dest / name
        if target.exists() and sha512(target) == want:
            return name, "ok (already present)"
        cached = cache / name
        if cached.exists() and sha512(cached) == want:
            target.write_bytes(cached.read_bytes())
            return name, "ok (from cache)"
        good, msg = fetch(m["download"]["url"], cached, want)
        if not good:
            return name, f"FAILED {msg}"
        target.write_bytes(cached.read_bytes())
        return name, "ok (downloaded)"

    failures: list[tuple[str, str]] = []
    done = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        for name, msg in pool.map(one, metas):
            done += 1
            if msg.startswith("FAILED"):
                failures.append((name, msg))
                print(f"[{done:>3}/{len(metas)}] {msg}  {name}")
            elif done % 25 == 0 or "downloaded" in msg:
                print(f"[{done:>3}/{len(metas)}] {msg:<22} {name}")

    for m in metas:
        f = dest / m["filename"]
        if f.exists():
            total_bytes += f.stat().st_size

    expected = {m["filename"] for m in metas}
    extra = [p for p in dest.glob("*.jar") if p.name not in expected]
    if extra:
        print(f"\n{len(extra)} jar(s) present but NOT in the manifest:")
        for p in extra[:20]:
            print(f"  {p.name}")
        if args.prune:
            for p in extra:
                p.unlink()
            print(f"pruned {len(extra)}")
        else:
            print("re-run with --prune to remove them")

    print(f"\ninstalled {len(metas) - len(failures)}/{len(metas)} mods "
          f"({total_bytes / 1024 / 1024:,.0f} MB) into {dest}")
    if failures:
        print(f"\n{len(failures)} FAILURES - the pack is incomplete:")
        for name, msg in failures:
            print(f"  {name}: {msg}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
