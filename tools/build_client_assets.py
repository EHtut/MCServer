"""build_client_assets.py — get the gods' fonts onto players' screens.

    python tools/build_client_assets.py                  # report, copy nothing
    python tools/build_client_assets.py --build          # into the client pack
    python tools/build_client_assets.py --build --live   # ...and Ethan's own instance

⭐ WHY THIS EXISTS. A font the server NAMES and the client does not HAVE renders as the
vanilla default and **nothing errors**. That is the exact shape of D-123 - a thing that
looks configured, logs nothing, and simply does not happen - so "the fonts are in the
repo" is not a statement about anybody's screen.

── ⭐ THE ROUTE, AND WHY IT IS THIS ONE ──────────────────────────────────────
KubeJS is a CLIENT mod here, and KubeJS auto-loads `kubejs/assets/` as a resource pack
that is **always active**. So the fonts go there:

    pack/resourcepacks/veldora/assets/   ->   clientpack/kubejs/assets/

🔑 That beats every alternative for this pack:

  · a resourcepacks/ zip  - ⚠️ players must ENABLE it in a menu. Anyone who does not
                             gets vanilla text and no error, which is the failure this
                             tool exists to prevent.
  · server.properties     - `resource-pack=` is EMPTY and needs the pack hosted at a
                             URL. Better long-term (it can be REQUIRED), but it adds a
                             hosting dependency to a font change.
  · a mod                 - absurd for five TTFs.

⚠️ ONE SOURCE. `pack/resourcepacks/veldora` stays the only place the fonts are edited -
it is a complete, valid pack with its own pack.mcmeta and licence. This copies FROM it.
Editing the copy is how the two drift, and the copy is the one players see.

── THE LICENCE TRAVELS ───────────────────────────────────────────────────────
SIL OFL permits bundling, on condition the licence ships with the fonts. OFL.txt is
copied alongside them, not left behind in the repo.
"""
import filecmp
import hashlib
import io
import os
import shutil
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO, "pack", "resourcepacks", "veldora")
SRC_ASSETS = os.path.join(SRC, "assets")

CLIENTPACK = os.path.join(r"C:\MCServer", "clientpack", "kubejs", "assets")

# ⚠️ Ethan's own instance, so a font can be LOOKED AT without rebuilding a 1.1 GB zip.
# Everyone else gets it through the client pack.
LIVE = os.path.join(
    r"C:\Users\Ethan\AppData\Roaming\PrismLauncher\instances",
    "CogsAndCadavers-PrismInstance (4)", ".minecraft", "kubejs", "assets")


def sha(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def walk(base):
    out = {}
    if not os.path.isdir(base):
        return out
    for dp, _dn, fn in os.walk(base):
        for f in fn:
            p = os.path.join(dp, f)
            out[os.path.relpath(p, base)] = p
    return out


def compare(label, dest):
    """What is missing or stale at `dest` relative to the source."""
    src = walk(SRC_ASSETS)
    dst = walk(dest)
    missing, stale, ok = [], [], []
    for rel, p in sorted(src.items()):
        q = dst.get(rel)
        if q is None:
            missing.append(rel)
        elif not filecmp.cmp(p, q, shallow=False):
            stale.append(rel)
        else:
            ok.append(rel)
    print("  %s" % label)
    print("    %s" % dest)
    if not src:
        print("    ⚠️ THE SOURCE IS EMPTY - run tools/fetch_fonts.py --fetch first")
        return None
    print("    %d in place, %d missing, %d stale" % (len(ok), len(missing), len(stale)))
    for rel in missing:
        print("      MISSING  %s" % rel)
    for rel in stale:
        print("      STALE    %s" % rel)
    return missing, stale


def copy_tree(dest):
    n = 0
    for rel, p in sorted(walk(SRC_ASSETS).items()):
        q = os.path.join(dest, rel)
        d = os.path.dirname(q)
        if not os.path.isdir(d):
            os.makedirs(d)
        shutil.copy2(p, q)
        n += 1
    # The licence goes with them. SIL OFL allows bundling ON THAT CONDITION.
    ofl = os.path.join(SRC, "OFL.txt")
    if os.path.exists(ofl):
        shutil.copy2(ofl, os.path.join(dest, "OFL.txt"))
        n += 1
    return n


def verify(dest):
    """🔑 Read the files back and hash them. A copy that reported success and produced
    nothing is precisely the failure this tool exists to catch, so it does not trust its
    own copy loop."""
    src = walk(SRC_ASSETS)
    bad = 0
    for rel, p in sorted(src.items()):
        q = os.path.join(dest, rel)
        if not os.path.exists(q):
            print("      🔴 NOT THERE AFTER COPYING: %s" % rel)
            bad += 1
        elif sha(p) != sha(q):
            print("      🔴 DIFFERENT AFTER COPYING: %s" % rel)
            bad += 1
    return bad


def main():
    build = "--build" in sys.argv
    live = "--live" in sys.argv

    print("the gods' fonts, on their way to a screen")
    print("=" * 78)

    src = walk(SRC_ASSETS)
    if not src:
        print("  ⚠️ NOTHING TO SHIP. %s is empty." % SRC_ASSETS)
        print("     Run: python tools/fetch_fonts.py --fetch")
        return 1
    print("  source: %d file(s) in pack/resourcepacks/veldora/assets" % len(src))
    print()

    targets = [("client pack (ships to everyone)", CLIENTPACK)]
    if live:
        targets.append(("Ethan's live instance (so it can be looked at now)", LIVE))

    for label, dest in targets:
        compare(label, dest)
        print()

    if not build:
        print("=" * 78)
        print("report only. re-run with --build to copy.")
        print("⚠️ --build writes into the CLIENT PACK, which is what players install.")
        print("   Add --live to also drop them straight into Ethan's instance.")
        return 0

    print("=" * 78)
    rc = 0
    for label, dest in targets:
        # ⚠️ The guard checks the pack ROOT, not the kubejs folder. Requiring
        # `clientpack/kubejs` to already exist skipped the client pack entirely on the
        # first run - the folder is exactly what this tool is supposed to create. Refuse
        # only when the destination is not a pack at all, which is the case that means
        # "you pointed me somewhere wrong".
        root = os.path.dirname(os.path.dirname(dest))     # .../clientpack or .../.minecraft
        if not os.path.isdir(root):
            print("  ⛔ SKIPPED %s - %s does not exist" % (label, root))
            rc = 1
            continue
        n = copy_tree(dest)
        bad = verify(dest)
        if bad:
            print("  🔴 %s - %d file(s) did NOT arrive intact" % (label, bad))
            rc = 1
        else:
            print("  ok  %s - %d file(s), all verified by hash" % (label, n))

    print("=" * 78)
    if rc:
        print("SOMETHING DID NOT ARRIVE. Do not assume the fonts render.")
        return rc
    print("delivered. KubeJS loads kubejs/assets as an always-active resource pack, so")
    print("no one has to enable anything.")
    print()
    print("⚠️ STILL TRUE: a player whose client pack predates this will see vanilla text")
    print("   and no error. The client pack has to be rebuilt and redistributed for")
    print("   anyone but Ethan.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
