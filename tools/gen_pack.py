"""Generate the packwiz pack from resolved.json.

packwiz's own binary is not required to BUILD a pack - only to update or serve
one. Every field packwiz writes (project id, version id, download URL, sha512,
sidedness) is already in the resolution output, so we emit the pack directly.
That keeps the build reproducible on a bare box with nothing but Python.

What comes out:

  pack/pack.toml          the pack manifest, pinning Minecraft + NeoForge
  pack/index.toml         every metafile with its sha256
  pack/mods/<slug>.pw.toml  one per mod: filename, side, download url + sha512

Regeneration is destructive on purpose: a .pw.toml for a mod no longer in the
manifest is DELETED rather than left to rot, so the pack directory can never
disagree with modlist.json.
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent
PACK = REPO / "pack"
RESOLVED = HERE / ".cache" / "resolved.json"

# Placeholder name - change it here and nowhere else.
PACK_NAME = "Cogs & Cadavers"
PACK_AUTHOR = "EHtut"
PACK_VERSION = "0.1.0"

MINECRAFT = "1.21.1"
NEOFORGE = "21.1.247"


def esc(s: str) -> str:
    """Escape a TOML basic string. Mod titles contain quotes and backslashes."""
    return (
        str(s)
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\t", "\\t")
    )


def side_of(r: dict) -> str:
    """Map Modrinth's two-axis sidedness onto packwiz's single 'side' field.

    Modrinth says required/optional/unsupported for client and server
    independently. packwiz wants one of both/client/server. 'unsupported' on one
    axis is the only signal that actually restricts installation; anything else
    is safest as 'both', because a mod wrongly marked client-only silently fails
    to load on the server and the failure looks like a mod bug, not a pack bug.
    """
    c = r.get("client_side")
    s = r.get("server_side")
    if s == "unsupported" and c != "unsupported":
        return "client"
    if c == "unsupported" and s != "unsupported":
        return "server"
    return "both"


def sha256_file(p: pathlib.Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def write_mod(r: dict) -> pathlib.Path:
    slug = r["slug"]
    # Slugs can contain characters that are legal on Modrinth but awkward in a
    # filename - the Alex's Mobs port is literally "alexs-mobs(1.21.1)".
    safe = "".join(ch if (ch.isalnum() or ch in "-_.") else "-" for ch in slug)
    dest = PACK / "mods" / f"{safe}.pw.toml"
    body = f'''name = "{esc(r.get('title') or slug)}"
filename = "{esc(r['filename'])}"
side = "{side_of(r)}"

[download]
url = "{esc(r['url'])}"
hash-format = "sha512"
hash = "{r['sha512']}"

[update]
[update.modrinth]
mod-id = "{r['project_id']}"
version = "{r['version_id']}"
'''
    dest.write_text(body, encoding="utf-8", newline="\n")
    return dest


def main() -> int:
    rows = json.loads(RESOLVED.read_text(encoding="utf-8"))
    ok = [r for r in rows if r["status"] == "RESOLVED"]
    if not ok:
        print("nothing resolved - run tools/resolve.py first", file=sys.stderr)
        return 1

    (PACK / "mods").mkdir(parents=True, exist_ok=True)

    written: dict[pathlib.Path, dict] = {}
    for r in ok:
        written[write_mod(r)] = r

    # Purge metafiles that no longer correspond to a manifest entry.
    stale = [p for p in (PACK / "mods").glob("*.pw.toml") if p not in written]
    for p in stale:
        p.unlink()
    if stale:
        print(f"removed {len(stale)} stale metafiles: {', '.join(p.stem for p in stale[:10])}"
              f"{' ...' if len(stale) > 10 else ''}")

    # index.toml - sorted so regeneration produces byte-identical output and the
    # diff shows real changes instead of dictionary ordering.
    lines = ['hash-format = "sha256"', ""]
    for p in sorted(written, key=lambda x: x.name):
        rel = p.relative_to(PACK).as_posix()
        lines += ["[[files]]", f'file = "{rel}"', f'hash = "{sha256_file(p)}"',
                  "metafile = true", ""]
    index = PACK / "index.toml"
    index.write_text("\n".join(lines), encoding="utf-8", newline="\n")

    pack_toml = f'''name = "{esc(PACK_NAME)}"
author = "{esc(PACK_AUTHOR)}"
version = "{PACK_VERSION}"
pack-format = "packwiz:1.1.0"

[index]
file = "index.toml"
hash-format = "sha256"
hash = "{sha256_file(index)}"

[versions]
minecraft = "{MINECRAFT}"
neoforge = "{NEOFORGE}"
'''
    (PACK / "pack.toml").write_text(pack_toml, encoding="utf-8", newline="\n")

    sides: dict[str, int] = {}
    for r in written.values():
        s = side_of(r)
        sides[s] = sides.get(s, 0) + 1
    total_mb = sum(r.get("size") or 0 for r in written.values()) / 1024 / 1024

    print(f"wrote {len(written)} metafiles -> {PACK / 'mods'}")
    print(f"  sides: " + ", ".join(f"{k}={v}" for k, v in sorted(sides.items())))
    print(f"  minecraft {MINECRAFT} / neoforge {NEOFORGE}")
    print(f"  total mod download: {total_mb:,.0f} MB")
    print(f"wrote {index}")
    print(f"wrote {PACK / 'pack.toml'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
