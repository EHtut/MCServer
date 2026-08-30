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
