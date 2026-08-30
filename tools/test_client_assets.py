# -*- coding: utf-8 -*-
"""test_client_assets.py — prove the font liveness check can answer all three ways.

    python tools/test_client_assets.py

WHY
---
2026-08-30. The fonts were copied into Ethan's instance at 11:03 while his client had
been running since 10:27. Every check the tool had said "delivered": right files, right
folder, hashes verified, inside a resource pack genuinely present in the stack. The
screen was full of missing-glyph boxes.

`check_loaded` is the check that was missing. It answers a different question from every
other one in that file — not "are the bytes there" but "has the client rebuilt its font
set since they arrived".

⚠️ It has three possible answers and they must stay distinct. OK / STALE / UNKNOWN. A
check that collapses "I could not tell" into "fine" is how a delivery reports success
into a room where nothing happened, which is the failure it exists to catch.
"""
import datetime
import io
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_client_assets as bca  # noqa: E402

STAMP = "%d%b%Y %H:%M:%S.000"


def make_instance(reload_offset_minutes, with_log=True, with_files=True):
    """A throwaway .minecraft with fonts and a log whose reload sits at a chosen offset
    (in minutes) relative to the font file mtimes. Returns the assets dir."""
    root = tempfile.mkdtemp(prefix="veldora_fonts_")
    assets = os.path.join(root, ".minecraft", "kubejs", "assets")
    logs = os.path.join(root, ".minecraft", "logs")
    os.makedirs(assets)
    os.makedirs(logs)

    now = datetime.datetime.now().replace(microsecond=0)
    if with_files:
        d = os.path.join(assets, "veldora", "font")
        os.makedirs(d)
        p = os.path.join(d, "wall.json")
        with io.open(p, "w", encoding="utf-8") as fh:
            fh.write("{}")
        ts = now.timestamp()
        os.utime(p, (ts, ts))

    if with_log:
        at = now + datetime.timedelta(minutes=reload_offset_minutes)
        with io.open(os.path.join(logs, "latest.log"), "w", encoding="utf-8") as fh:
            fh.write("[%s] [main/INFO] launching\n" % at.strftime(STAMP))
            fh.write("[%s] [Render thread/INFO] [...ReloadableResourceManager/]: "
                     "Reloading ResourceManager: vanilla, KubeJS File Resource Pack\n"
                     % at.strftime(STAMP))
    return root, assets


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


@case("a client that reloaded AFTER the files landed reports OK")
def _():
    root, assets = make_instance(+5)
    try:
        st, msg = bca.check_loaded(assets)
        assert st == "OK", "got %s: %s" % (st, msg)
    finally:
        shutil.rmtree(root, ignore_errors=True)


@case("a client that reloaded BEFORE the files landed reports STALE")
def _():
    # 🔑 The real case. Ethan's client: launched 10:27, fonts landed 10:58.
    root, assets = make_instance(-31)
    try:
        st, msg = bca.check_loaded(assets)
        assert st == "STALE", "got %s: %s" % (st, msg)
        assert "BOXES" in msg, "STALE must say what the symptom looks like: " + msg
    finally:
        shutil.rmtree(root, ignore_errors=True)


@case("no client log reports UNKNOWN, never OK")
def _():
    root, assets = make_instance(0, with_log=False)
    try:
        st, msg = bca.check_loaded(assets)
        assert st == "UNKNOWN", "got %s: %s" % (st, msg)
    finally:
        shutil.rmtree(root, ignore_errors=True)


@case("nothing delivered reports UNKNOWN, never OK")
def _():
    root, assets = make_instance(+5, with_files=False)
    try:
        st, msg = bca.check_loaded(assets)
        assert st == "UNKNOWN", "got %s: %s" % (st, msg)
    finally:
        shutil.rmtree(root, ignore_errors=True)


@case("a log with no reload line reports UNKNOWN, never OK")
def _():
    root, assets = make_instance(+5)
    try:
        log = os.path.join(root, ".minecraft", "logs", "latest.log")
        with io.open(log, "w", encoding="utf-8") as fh:
            fh.write("[30Aug2026 10:00:00.000] [main/INFO] nothing interesting\n")
        st, msg = bca.check_loaded(assets)
        assert st == "UNKNOWN", "got %s: %s" % (st, msg)
    finally:
        shutil.rmtree(root, ignore_errors=True)


@case("the last reload wins, not the first")
def _():
    # ⚠️ A session reloads several times. Reading the FIRST would report STALE forever
    # after any mid-session F3+T, which is the fix this check tells you to apply.
    root, assets = make_instance(-31)
    try:
        log = os.path.join(root, ".minecraft", "logs", "latest.log")
        later = (datetime.datetime.now().replace(microsecond=0)
                 + datetime.timedelta(minutes=5))
        with io.open(log, "a", encoding="utf-8") as fh:
            fh.write("[%s] [Render thread/INFO]: Reloading ResourceManager: vanilla\n"
                     % later.strftime(STAMP))
        st, msg = bca.check_loaded(assets)
        assert st == "OK", "a later reload must win, got %s: %s" % (st, msg)
    finally:
        shutil.rmtree(root, ignore_errors=True)


# ── check_providers — D-130 ──────────────────────────────────────────────────
# 🔴 Every definition said "veldora:font/wall.ttf", which reads as obviously correct and
# is wrong: Minecraft prepends font/ itself, so it resolved to
# assets/veldora/font/font/wall.ttf and every builder was rejected. All five gods, from
# the day the fonts were fetched to the day someone read the client log.
#
# ⚠️ The symptom was identical to D-129 — boxes — because a rejected builder and an
# unloaded pack both end in an empty font set. The first fault masked the second.

def make_pack(file_ref, put_ttf_at="wall.ttf"):
    """A throwaway assets root: one font json with `file_ref`, one ttf at `put_ttf_at`
    (relative to assets/veldora/font/). Returns (root, assets_dir)."""
    root = tempfile.mkdtemp(prefix="veldora_prov_")
    fontdir = os.path.join(root, "veldora", "font")
    os.makedirs(fontdir)
    with io.open(os.path.join(fontdir, "wall.json"), "w", encoding="utf-8") as fh:
        fh.write('{"providers":[{"type":"ttf","file":"%s","size":10}]}' % file_ref)
    target = os.path.join(fontdir, put_ttf_at)
    d = os.path.dirname(target)
    if not os.path.isdir(d):
        os.makedirs(d)
    with io.open(target, "w", encoding="utf-8") as fh:
        fh.write("not really a ttf, existence is what is checked")
    return root


@case("the D-130 shape - a doubled font/ prefix - is CAUGHT")
def _():
    root = make_pack("veldora:font/wall.ttf")
    try:
        bad = bca.check_providers(root)
        assert len(bad) == 1, "expected exactly one bad provider, got %r" % (bad,)
        assert "font" in bad[0][1], bad
    finally:
        shutil.rmtree(root, ignore_errors=True)


@case("the correct form resolves clean")
def _():
    root = make_pack("veldora:wall.ttf")
    try:
        bad = bca.check_providers(root)
        assert bad == [], "correct definition must not be flagged: %r" % (bad,)
    finally:
        shutil.rmtree(root, ignore_errors=True)


@case("a genuinely missing ttf is CAUGHT")
def _():
    # ⚠️ Distinct from the prefix bug: right shape, absent bytes.
    root = make_pack("veldora:wall.ttf", put_ttf_at="something_else.ttf")
    try:
        bad = bca.check_providers(root)
        assert len(bad) == 1, "a missing ttf must be caught, got %r" % (bad,)
    finally:
        shutil.rmtree(root, ignore_errors=True)


@case("the check is not vacuous - it fails the real pre-fix definitions")
def _():
    # 🔑 THE CONTROL THAT MATTERS. A check that returns [] for everything would pass
    # every case above that expects []. This feeds it the exact five definitions that
    # shipped, reconstructed, and requires all five to be rejected.
    root = tempfile.mkdtemp(prefix="veldora_prov_real_")
    try:
        fontdir = os.path.join(root, "veldora", "font")
        os.makedirs(fontdir)
        for g in ("art", "blade", "forge", "salvage", "wall"):
            with io.open(os.path.join(fontdir, g + ".json"), "w", encoding="utf-8") as fh:
                fh.write('{"providers":[{"type":"ttf","file":"veldora:font/%s.ttf"}]}' % g)
            with io.open(os.path.join(fontdir, g + ".ttf"), "w", encoding="utf-8") as fh:
                fh.write("x")
        bad = bca.check_providers(root)
        assert len(bad) == 5, "all five shipped definitions must be rejected, got %d" % len(bad)
    finally:
        shutil.rmtree(root, ignore_errors=True)


def main():
    failed = 0
    for name, fn in CASES:
        try:
            fn()
            print("  ok    " + name)
        except AssertionError as e:
            failed += 1
            print("  FAIL  " + name)
            print("        " + str(e)[:400])
    print("%d/%d" % (len(CASES) - failed, len(CASES)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
