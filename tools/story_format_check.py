#!/usr/bin/env python
"""story_format_check.py - puts the story-format parser in the sweep.

⚠️ THIS FILE EXISTS BECAUSE A CHECK OUTSIDE THE SWEEP IS A CHECK THAT ROTS. The parser's
tests live behind `python tools/story_import.py --selftest`, and run_all.js only collects
files matching `*_harness` / `*_check`. Without this thin entry point the format's rules -
including Ethan's one-sentence-per-line rule - would be verified once, by hand, and never
again.

It is deliberately trivial: it runs the selftest and passes its exit code through. All the
real assertions live next to the parser they test.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

r = subprocess.run([sys.executable, os.path.join(HERE, "story_import.py"), "--selftest"],
                   capture_output=True, text=True)
sys.stdout.write(r.stdout)
if r.stderr:
    sys.stderr.write(r.stderr)
sys.exit(r.returncode)
