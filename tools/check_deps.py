"""Resolve the dependency graph from the JARS, the way NeoForge actually does it.

Why this exists
---------------
Modrinth's dependency data is author-maintained metadata and it is INCOMPLETE.
On this pack, `resolve.py deps` reported a fully closed graph, and the server
then refused to boot with five missing libraries that Modrinth never mentioned:
knightlib, octolib, ars_elemental, irons_lib.

The authoritative dependency list lives in each jar's neoforge.mods.toml, which
is what the mod loader reads. So we read that too - before boot, not during it.

Also surfaces declared INCOMPATIBILITIES, which are how a pack discovers things
like "Create refuses to run alongside Radium" without spending a boot on it.

  python tools/check_deps.py <mods-dir>

Exit code is non-zero if anything required is missing or an incompatibility is
declared, so it can gate a deploy.
"""

from __future__ import annotations

import pathlib
import re
import sys
import zipfile

import verrange

# modIds the loader itself provides.
BUILTIN = {"minecraft", "neoforge", "forge", "java", "fml", "mcp"}

MODS_TOML = "META-INF/neoforge.mods.toml"
LEGACY_TOML = "META-INF/mods.toml"


def strip_comments(text: str) -> str:
    """Remove commented-out lines before parsing.

    Mod authors habitually leave whole dependency blocks commented out as
    documentation - Ars Nouveau ships a fully commented-out JEI dependency. A
    regex parser that ignores '#' reads those as real requirements and sends you
    installing mods nothing actually needs. Learned the hard way.

    Only whole-line comments are stripped; '#' inside a quoted string is left
    alone, since version strings and URLs legitimately contain it.
    """
    out = []
    for line in text.splitlines():
        s = line.lstrip()
        if s.startswith("#"):
            continue
        out.append(line)
    return "\n".join(out)


def read_toml(z: zipfile.ZipFile) -> str | None:
    for entry in (MODS_TOML, LEGACY_TOML):
        try:
            return strip_comments(z.read(entry).decode("utf-8", "replace"))
        except KeyError:
            continue
    return None


def parse(text: str) -> tuple[dict[str, str], list[dict]]:
    """Return (provided modId -> version, [dependency records]).

    Parsed with regex rather than a TOML library because these files are
    frequently not valid TOML - a surprising number ship unexpanded Gradle
    placeholders like versionRange="${minecraft_version_range}" - and a strict
    parser refuses the whole file over one bad line.
    """
    provided: dict[str, str] = {}

    # [[mods]] blocks declare what this jar provides.
    for block in re.split(r"\[\[mods\]\]", text)[1:]:
        m = re.search(r'modId\s*=\s*"([^"]+)"', block)
        if not m:
            continue
        vm = re.search(r'version\s*=\s*"([^"]+)"', block)
        provided[m.group(1)] = (vm.group(1) if vm else "0")

    deps: list[dict] = []
    # NeoForge accepts TWO shapes for a hard conflict: a [[dependencies.X]] block
    # with type="incompatible", and a dedicated [[breaks.X]] block. Create uses
    # the latter to refuse Radium - and reading only the former is how that
    # conflict survived every pre-boot check and killed the first boot instead.
    pattern = r"\[\[(dependencies|breaks)\.([A-Za-z0-9_\-]+)\]\](.*?)(?=\[\[|\Z)"
    for m in re.finditer(pattern, text, re.S):
        section, owner, body = m.group(1), m.group(2), m.group(3)
        dm = re.search(r'modId\s*=\s*"([^"]+)"', body)
        if not dm:
            continue
        if section == "breaks":
            kind = "incompatible"
        else:
            tm = re.search(r'type\s*=\s*"([^"]+)"', body)
            if tm:
                kind = tm.group(1).lower()
            else:
                mand = re.search(r"mandatory\s*=\s*(true|false)", body)
                kind = "required" if (mand and mand.group(1) == "true") else "optional"
        vr = re.search(r'versionRange\s*=\s*"([^"]*)"', body)
        # side defaults to BOTH when unstated.
        sm = re.search(r'side\s*=\s*"([^"]+)"', body)
        deps.append({
            "owner": owner,
            "dep": dm.group(1),
            "kind": kind,
            "range": vr.group(1) if vr else "",
            "side": (sm.group(1).upper() if sm else "BOTH"),
        })
    return provided, deps


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    d = pathlib.Path(sys.argv[1])
    jars = sorted(d.glob("*.jar"))
    if not jars:
        print(f"no jars in {d}")
        return 1

    # Which physical side are we validating? A dependency declared side="CLIENT"
    # is not required on a server, and flagging it would send us installing
    # client mods into a server instance.
    side = "SERVER"
    for a in sys.argv[2:]:
        if a.startswith("--side="):
            side = a.split("=", 1)[1].upper()

    provided: dict[str, tuple[str, str]] = {}   # modId -> (version, jar)
    alldeps: list[tuple[dict, str]] = []
    nomanifest: list[str] = []

    def offer(pid: str, pver: str, src: str) -> None:
        """Record a provider, keeping the HIGHEST version when several supply it.

        Several mods bundle their own copy of a shared library via JarJar, so the
        same modId is offered more than once at different versions. The loader
        deduplicates and uses the newest; keeping whichever we happened to see
        first made an up-to-date library look outdated and produced a phantom
        "version too old" failure.
        """
        cur = provided.get(pid)
        if cur is None or ("${" not in pver and verrange.cmp(pver, cur[0]) > 0):
            provided[pid] = (pver, src)

    for j in jars:
        try:
            with zipfile.ZipFile(j) as z:
                text = read_toml(z)

                # ALWAYS scan bundled jars, not just when the outer jar has no
                # manifest of its own. Create ships its own mods.toml AND bundles
                # Ponder, Flywheel and Registrate via JarJar; treating those as
                # mutually exclusive reported Create's own bundled libraries as
                # missing dependencies.
                import io
                nested = [n for n in z.namelist()
                          if n.startswith("META-INF/jarjar/") and n.endswith(".jar")]
                for n in nested:
                    try:
                        with zipfile.ZipFile(io.BytesIO(z.read(n))) as iz:
                            itext = read_toml(iz)
                            if itext:
                                ip, _ = parse(itext)
                                for pid, pver in ip.items():
                                    offer(pid, pver, f"{j.name}::{n.split('/')[-1]}")
                    except Exception:
                        pass

                if text is None:
                    if not nested:
                        nomanifest.append(j.name)
                    continue
                p, deps = parse(text)
                for pid, pver in p.items():
                    offer(pid, pver, j.name)
                for drec in deps:
                    alldeps.append((drec, j.name))
        except zipfile.BadZipFile:
            nomanifest.append(f"{j.name} (corrupt zip)")

    def applies(d: dict) -> bool:
        return d["side"] in ("BOTH", side)

    missing: dict[str, list[str]] = {}
    wrongver: list[tuple[str, str, str, str]] = []
    conflicts: list[tuple[str, str, str]] = []

    for d, jar in alldeps:
        if not applies(d):
            continue
        dep = d["dep"]
        if d["kind"] == "required":
            if dep in BUILTIN:
                continue
            if dep not in provided:
                missing.setdefault(dep, []).append(d["owner"])
            else:
                have = provided[dep][0]
                # A provider that never expanded its own version placeholder
                # tells us nothing. Comparing against "${file.jarVersion}"
                # produces a wall of false alarms, so skip rather than guess.
                if d["range"] and "${" not in have and not verrange.in_range(have, d["range"]):
                    wrongver.append((d["owner"], dep, have, d["range"]))
        elif d["kind"] == "incompatible" and dep in provided:
            # An incompatibility is version-scoped too: "incompatible with X
            # below 2.0" must not fire when X is 3.0. And a jar that provides
            # both ids is not in conflict with itself.
            have, src = provided[dep]
            same_jar = src.split("::")[0] == jar
            if not same_jar and (not d["range"] or verrange.in_range(have, d["range"])):
                conflicts.append((d["owner"], dep, f"{have} in {src}"))

    print(f"scanned {len(jars)} jars for side={side}; {len(provided)} modIds provided\n")

    if nomanifest:
        print(f"=== NO LOADER MANIFEST ({len(nomanifest)}) - these cannot load ===")
        for n in nomanifest:
            print(f"  {n}")
        print()

    print(f"=== MISSING REQUIRED DEPENDENCIES ({len(missing)}) ===")
    for dep, owners in sorted(missing.items()):
        print(f"  {dep:<26} required by: {', '.join(sorted(set(owners)))}")
    if not missing:
        print("  none")
    print()

    print(f"=== VERSION TOO OLD/NEW ({len(wrongver)}) ===")
    for owner, dep, have, rng in sorted(wrongver):
        print(f"  {owner} needs {dep} {rng}, have {have}")
    if not wrongver:
        print("  none")
    print()

    print(f"=== DECLARED INCOMPATIBILITIES PRESENT ({len(conflicts)}) ===")
    for owner, dep, detail in sorted(conflicts):
        print(f"  {owner} is incompatible with {dep}  ({detail})")
    if not conflicts:
        print("  none")

    bad = len(missing) + len(conflicts) + len(nomanifest) + len(wrongver)
    print(f"\n{'OK - the loader should accept this set' if not bad else f'{bad} problem(s) will stop the server booting'}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
