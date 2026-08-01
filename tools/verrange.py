"""Maven version-range arithmetic, shared by the jar checkers.

Mod manifests express versions as Maven ranges - "[1.21,1.22)", "[0.6.0.1,)" -
and both the loader-check and the dependency-check need to answer "is this
version inside that range?". Substring matching is not an answer: it reports a
false alarm on every mod that declares a range instead of a pin, which is most
of them, and a check that cries wolf gets ignored when it matters.
"""

from __future__ import annotations

import re


def parts(v: str) -> list[int]:
    """Numeric segments of a version string, ignoring qualifiers.

    Deliberately lossy: "1.21.1-beta.3" and "1.21.1" compare equal. Mod authors
    version so inconsistently that a stricter comparison produces more false
    alarms than it prevents.
    """
    return [int(x) for x in re.findall(r"\d+", v)] or [0]


_MC_PREFIXED = re.compile(r"^\d+\.\d+(?:\.\d+)?-(.+)$")


def strip_mc_prefix(a: str, b: str) -> tuple[str, str]:
    """Drop a leading Minecraft version when BOTH sides carry one.

    Mods version themselves as "<mc>-<modversion>", e.g. Moonlight's
    "1.21.1-3.3.0" against a required "[1.21-3.1.3,]". Compared as flat digit
    lists those misalign - 1.21.1 has one more segment than 1.21 - and a newer
    library reads as older. Only applied when both sides have the shape, so a
    plain version is never mangled.
    """
    ma, mb = _MC_PREFIXED.match(a), _MC_PREFIXED.match(b)
    if ma and mb:
        return ma.group(1), mb.group(1)
    return a, b


_PRERELEASE = re.compile(r"[-+]?\b(alpha|beta|rc|pre|snapshot|dev)[._-]?(\d*)", re.I)
_PRE_RANK = {"dev": 0, "snapshot": 1, "alpha": 2, "beta": 3, "pre": 4, "rc": 5}


def split_prerelease(v: str) -> tuple[str, tuple[int, int] | None]:
    """Separate "0.8.12-alpha.2" into ("0.8.12", (alpha, 2)).

    Needed because a prerelease sorts BELOW the release of the same number, and
    a digit-scraping comparison gets this exactly backwards: it reads
    "0.8.12-alpha.2" as [0,8,12,2] and "0.8.12" as [0,8,12,0], making the alpha
    look NEWER. That misjudged Sable's "incompatible with Sodium below
    0.8.12-alpha.2" and reported a conflict against Sodium 0.8.12 release, which
    actually satisfies it.
    """
    m = _PRERELEASE.search(v)
    if not m:
        return v, None
    base = v[:m.start()].rstrip("-+._")
    return (base or v), (_PRE_RANK.get(m.group(1).lower(), 0), int(m.group(2) or 0))


def cmp(a: str, b: str) -> int:
    a, b = strip_mc_prefix(a, b)
    a_base, a_pre = split_prerelease(a)
    b_base, b_pre = split_prerelease(b)

    pa, pb = parts(a_base), parts(b_base)
    pa = pa + [0] * (len(pb) - len(pa))
    pb = pb + [0] * (len(pa) - len(pb))
    if pa != pb:
        return (pa > pb) - (pa < pb)

    # Same numbers: a release outranks any prerelease of it.
    if a_pre is None and b_pre is None:
        return 0
    if a_pre is None:
        return 1
    if b_pre is None:
        return -1
    return (a_pre > b_pre) - (a_pre < b_pre)


def in_range(version: str, spec: str) -> bool:
    """Is `version` inside Maven range `spec`?

    Unparseable or placeholder specs return True - an unexpanded Gradle variable
    like "${minecraft_version_range}" is an upstream packaging slip, not evidence
    that the mod is wrong for us, and treating it as a failure would bury real
    findings.
    """
    if not spec:
        return True
    spec = spec.strip()
    if "${" in spec:
        return True

    # A bare version means ">= that version" in mod-manifest practice.
    if spec[0] not in "[(":
        return cmp(version, spec) >= 0

    # Comma-separated union of ranges: "[1.0,2.0),[3.0,)"
    chunks, depth, buf = [], 0, ""
    for ch in spec:
        if ch in "[(":
            depth += 1
        elif ch in "])":
            depth -= 1
        if ch == "," and depth == 0:
            chunks.append(buf)
            buf = ""
        else:
            buf += ch
    chunks.append(buf)

    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk or chunk[0] not in "[(":
            continue
        lo_inc, hi_inc = chunk[0] == "[", chunk[-1] == "]"
        lo, _, hi = chunk[1:-1].partition(",")
        lo, hi = lo.strip(), hi.strip()
        if lo and (cmp(version, lo) < 0 or (cmp(version, lo) == 0 and not lo_inc)):
            continue
        if hi and (cmp(version, hi) > 0 or (cmp(version, hi) == 0 and not hi_inc)):
            continue
        return True
    return False
