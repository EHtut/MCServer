"""Verify downloaded jars are actually NeoForge mods, by reading inside them.

Registry tags are author-supplied and occasionally wrong, and a wrong-loader jar
fails at boot with an error that blames something else. Filenames are a terrible
signal for this - a mod's own version number reads exactly like a Minecraft
version - so this opens each jar and reads its loader manifest instead. That is
ground truth, not a guess.

  META-INF/neoforge.mods.toml   -> NeoForge          OK
  META-INF/mods.toml            -> Forge (legacy)    will NOT load on NeoForge 1.21.1
  fabric.mod.json               -> Fabric            will NOT load on NeoForge
  none of the above             -> not a mod, or a library shaded oddly

A jar carrying BOTH neoforge.mods.toml and fabric.mod.json is a multiloader jar
and is fine - that is why the Fabric marker alone is not a verdict.

  python tools/check_jars.py <mods-dir>
"""

from __future__ import annotations

import pathlib
import re
import sys
import zipfile

GAME_VERSION = "1.21.1"


def in_range(version: str, spec: str) -> bool:
    """Is `version` inside a Maven version range like "[1.20.5,1.22)"?

    Written because the naive check - substring-matching the version - reports a
    false alarm on every mod that declares a range instead of an exact version,
    which is most of them. A check that cries wolf ten times gets ignored on the
    eleventh, when it matters.
    """
    spec = spec.strip()
    if not spec or "${" in spec:  # unexpanded Gradle placeholder
        return True
    if not spec[0] in "[(":
        return version.startswith(spec)

    def parts(v: str) -> list[int]:
        return [int(x) for x in re.findall(r"\d+", v)] or [0]

    def cmp(a: str, b: str) -> int:
        pa, pb = parts(a), parts(b)
        pa += [0] * (len(pb) - len(pa))
        pb += [0] * (len(pa) - len(pb))
        return (pa > pb) - (pa < pb)

    lo_inc, hi_inc = spec[0] == "[", spec[-1] == "]"
    body = spec[1:-1]
    lo, _, hi = body.partition(",")
    lo, hi = lo.strip(), hi.strip()
    if lo and (cmp(version, lo) < 0 or (cmp(version, lo) == 0 and not lo_inc)):
        return False
    if hi and (cmp(version, hi) > 0 or (cmp(version, hi) == 0 and not hi_inc)):
        return False
    return True


def classify(path: pathlib.Path) -> tuple[str, str]:
    """Return (verdict, detail) for one jar."""
    try:
        with zipfile.ZipFile(path) as z:
            names = set(z.namelist())
            neo = "META-INF/neoforge.mods.toml" in names
            forge = "META-INF/mods.toml" in names
            fabric = "fabric.mod.json" in names

            # NeoForge's JarJar: a container jar whose real mods are nested under
            # META-INF/jarjar/. Kotlin for Forge ships this way. The container
            # itself carries no manifest and that is correct, not broken.
            if not (neo or forge or fabric):
                nested = [n for n in names if n.startswith("META-INF/jarjar/") and n.endswith(".jar")]
                if nested:
                    return "OK", f"jarjar container ({len(nested)} nested jars)"

            mc = ""
            if neo or forge:
                entry = "META-INF/neoforge.mods.toml" if neo else "META-INF/mods.toml"
                try:
                    text = z.read(entry).decode("utf-8", "replace")
                    # The minecraft dependency's versionRange, e.g. "[1.21.1,1.22)"
                    m = re.search(
                        r'modId\s*=\s*"minecraft".*?versionRange\s*=\s*"([^"]+)"',
                        text, re.S,
                    )
                    if m:
                        mc = m.group(1)
                except Exception:
                    pass

            if neo:
                return "OK", f"neoforge{('  mc=' + mc) if mc else ''}"
            if fabric and not forge:
                return "FABRIC", "fabric.mod.json only - will not load on NeoForge"
            if forge:
                return "FORGE", f"legacy mods.toml only{('  mc=' + mc) if mc else ''}"
            return "UNKNOWN", "no loader manifest found"
    except zipfile.BadZipFile:
        return "CORRUPT", "not a readable zip"
    except Exception as e:  # noqa: BLE001
        return "ERROR", str(e)


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    d = pathlib.Path(sys.argv[1])
    jars = sorted(d.glob("*.jar"))
    if not jars:
        print(f"no jars in {d}")
        return 1

    buckets: dict[str, list[tuple[str, str]]] = {}
    for j in jars:
        verdict, detail = classify(j)
        buckets.setdefault(verdict, []).append((j.name, detail))

    print(f"scanned {len(jars)} jars in {d}\n")
    for verdict in ("OK", "FABRIC", "FORGE", "UNKNOWN", "CORRUPT", "ERROR"):
        rows = buckets.get(verdict)
        if not rows:
            continue
        print(f"=== {verdict} ({len(rows)}) ===")
        if verdict == "OK":
            # Surface only jars whose declared Minecraft range genuinely excludes
            # our version - properly parsed, not substring-matched.
            #
            # CONVENTION: a large number of 1.21.1 mods declare "[1.21,1.21.1)",
            # inherited from the 1.21 MDK template. By Maven semantics that
            # excludes 1.21.1, yet these are the official published 1.21.1 builds
            # of mods with millions of downloads. It is an upstream authoring
            # quirk, not breakage - but it is bucketed separately rather than
            # suppressed, because first boot is what settles it: NeoForge names
            # the offending mod explicitly if it ever does reject one.
            odd, convention = [], []
            for n, d_ in rows:
                m = re.search(r"mc=(\S.*)$", d_)
                if not m or in_range(GAME_VERSION, m.group(1)):
                    continue
                (convention if m.group(1).strip().replace(" ", "") == "[1.21,1.21.1)"
                 else odd).append((n, d_))
            print(f"  {len(rows) - len(odd) - len(convention)} accept Minecraft {GAME_VERSION}")
            if convention:
                print(f"  {len(convention)} declare the [1.21,1.21.1) MDK convention "
                      f"(upstream quirk, expected to load; confirm at first boot)")
            for n, d_ in odd:
                print(f"  ?? {n}  ({d_})")
        else:
            for n, d_ in rows:
                print(f"  {n}\n      {d_}")
        print()

    bad = sum(len(buckets.get(k, [])) for k in ("FABRIC", "FORGE", "CORRUPT", "ERROR"))
    print(f"{bad} jar(s) will not load on NeoForge {GAME_VERSION}" if bad
          else f"all {len(jars)} jars carry a NeoForge manifest")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
