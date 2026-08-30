# -*- coding: utf-8 -*-
"""test_rhino_lint.py - prove the linter's rules can actually FAIL.

    python tools/test_rhino_lint.py

WHY THIS EXISTS
---------------
On 2026-08-30 two of rhino_lint's three rules were DEAD and both reported clean.

A shell heredoc ate an escape level and wrote a real 0x08 BACKSPACE where `\\b` was
meant, so the regexes became /<BS>function.../ and /<BS>Commands.../ - patterns that
search for a backspace byte and therefore match nothing, ever. Nothing looked wrong.
grep showed nothing. The tool ran green.

The function-redeclaration rule had been vacuously green since the day it was written -
the rule added specifically because a duplicate `overheard` in pathless.js took the
whole file out of a boot.

The tool's OWN header already said it:

    A GREEN ASSERTION THAT CANNOT FAIL IS WORSE THAN A MISSING ONE.

So every rule here is tested by MUTATION: feed the linter a file that should trip it and
require that it does. A rule that cannot be made to fail is not a rule.

THE FOURTH TEST IS THE IMPORTANT ONE. The redeclaration rule's first live output was a
false positive - blade_events.js has a `watch()` in each of two sibling closures, which
is legal and has always loaded. Keying by filename instead of by enclosing scope is the
natural way to write this rule and it is wrong, so there is a control that fails if
anyone reverts to it.
"""
import contextlib
import io
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import rhino_lint  # noqa: E402


def run_on(files):
    """Run the linter over a throwaway script dir. Returns (rc, stdout)."""
    tmp = tempfile.mkdtemp(prefix='rhino_lint_test_')
    real_ss, real_root = rhino_lint.SS, rhino_lint.ROOT
    try:
        for name, body in files.items():
            with io.open(os.path.join(tmp, name), 'w', encoding='utf-8') as fh:
                fh.write(body)
        rhino_lint.SS = tmp
        # ROOT drives the tools/ control-character sweep; point it at an empty dir so a
        # test result never depends on the state of the real tools folder.
        empty = os.path.join(tmp, '_root')
        os.makedirs(os.path.join(empty, 'tools'))
        rhino_lint.ROOT = empty
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = rhino_lint.main()
        return rc, buf.getvalue()
    finally:
        rhino_lint.SS, rhino_lint.ROOT = real_ss, real_root
        shutil.rmtree(tmp, ignore_errors=True)


CASES = []


def case(name):
    def deco(fn):
        CASES.append((name, fn))
        return fn
    return deco


# ── 1. redeclaration in ONE scope is caught ──────────────────────────────────
@case('redeclaration in the same scope is CAUGHT')
def _():
    rc, out = run_on({'x.js': ';(function () {\n'
                              '  function overheard() { return 1 }\n'
                              '  function overheard() { return 2 }\n'
                              '})();\n'})
    assert 'REDECLARED' in out, out
    assert 'overheard' in out, out
    assert rc != 0, 'a real collision must exit non-zero'


# ── 2. ...and the same names in SIBLING scopes are NOT ───────────────────────
# 🔑 THE CONTROL FOR THE FALSE POSITIVE. blade_events.js in miniature.
@case('same name in two sibling closures is NOT a collision')
def _():
    rc, out = run_on({'x.js': ';(function () {\n'
                              '  function duel() {\n'
                              '    var elapsed = 0\n'
                              '    function watch() { return elapsed }\n'
                              '  }\n'
                              '  function challenger() {\n'
                              '    var ticks = 0\n'
                              '    function watch() { return ticks }\n'
                              '  }\n'
                              '})();\n'})
    assert 'REDECLARED' not in out, 'false positive on legal sibling closures:\n' + out
    assert rc == 0, out


# ── 3. a Commands factory that does not exist is caught ──────────────────────
@case('Commands.integer() is CAUGHT')
def _():
    rc, out = run_on({'x.js': ';(function () {\n'
                              '  var c = Commands.integer(0, 40)\n'
                              '})();\n'})
    assert 'integer' in out, out
    assert rc != 0, 'a nonexistent factory must exit non-zero'


# ── 4. ...but the two real builders are not ──────────────────────────────────
@case('Commands.literal/argument are NOT flagged')
def _():
    rc, out = run_on({'x.js': ";(function () {\n"
                              "  var a = Commands.literal('x')\n"
                              "  var b = Commands.argument('y', z)\n"
                              "})();\n"})
    assert 'integer' not in out and 'literal' not in out, out
    assert rc == 0, out


# ── 5. a stray control character is caught ───────────────────────────────────
# The 0x08 that started all of this.
@case('a raw 0x08 in a script is CAUGHT')
def _():
    rc, out = run_on({'x.js': ';(function () { var s = "a' + chr(8) + 'b" })();\n'})
    assert '0x08' in out, out
    assert rc != 0, out


# ── 6. the tool watches its OWN language ─────────────────────────────────────
# 🚨 It did not, which is exactly how the backspace survived in rhino_lint.py itself.
@case('a raw 0x08 in a tools/*.py is CAUGHT')
def _():
    tmp = tempfile.mkdtemp(prefix='rhino_lint_test_')
    real_ss, real_root = rhino_lint.SS, rhino_lint.ROOT
    try:
        ss = os.path.join(tmp, 'ss')
        os.makedirs(ss)
        tools = os.path.join(tmp, 'tools')
        os.makedirs(tools)
        with io.open(os.path.join(tools, 'harness.py'), 'w', encoding='utf-8') as fh:
            fh.write('PAT = "' + chr(8) + 'word"\n')
        rhino_lint.SS, rhino_lint.ROOT = ss, tmp
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = rhino_lint.main()
        out = buf.getvalue()
        assert 'harness.py' in out and '0x08' in out, out
        assert rc != 0, out
    finally:
        rhino_lint.SS, rhino_lint.ROOT = real_ss, real_root
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    failed = 0
    for name, fn in CASES:
        try:
            fn()
            print('  ok    ' + name)
        except AssertionError as e:
            failed += 1
            print('  FAIL  ' + name)
            print('        ' + str(e).replace('\n', '\n        ')[:600])
    print('%d/%d' % (len(CASES) - failed, len(CASES)))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
