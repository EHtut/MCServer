#!/usr/bin/env python
"""hud_zone_check.py - our dead band must still cover the biome title.

    python tools/hud_zone_check.py

== THE RULING THIS ENFORCES ===================================================

Ethan, 2026-08-30: *"Turn travelers titles back on instead make god dialogue move around
it."*

**So the direction is settled: the mod is terrain, and we are the layer that moves.** My
first attempt did it backwards - Traveler's Titles drew biome names centred at y=-33, on
top of art, forge and wall, and I edited that mod's config to shove the titles to -200.
That is a feature Ethan chose being bent around our convenience. Overruled, reverted,
recorded here so it is not re-done.

`voice.js` now carries a second dead band (`TITLE_BAND`) alongside the crosshair one, and
`dodgeCrosshair` samples uniformly from what is left.

== ⚠️ WHY THIS FILE HAS TO EXIST =============================================

**The band is a hardcoded guess about a config we do not own.** Traveler's Titles can be
retuned by anyone, at any time, and if its titles move out from under our band then:

  * the band protects nothing - the gods dodge empty screen space, and
  * they land on the title again, which is the fault we started with.

A dead band aimed at where a title USED to be is worse than no band: it costs screen space
AND gives false confidence. So this reads BOTH sides - the constant out of voice.js and the
live position out of the mod's own config - and fails if they have come apart.

🔑 It asserts COVERAGE, not equality. The band is deliberately wider than the title (our
own line has height too); it must CONTAIN the title's span, not match it.
"""
import io
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = os.path.join(REPO, 'pack', 'kubejs', 'server_scripts', 'voice.js')
TT = os.path.join(
    os.path.expanduser('~'), 'AppData', 'Roaming', 'PrismLauncher', 'instances',
    'CogsAndCadavers-PrismInstance (4)', '.minecraft', 'config',
    'travelerstitles-neoforge-1_21.toml')

# Minecraft's font is 9px per line; a title's drawn height is that times its scale.
FONT = 9.0

PASS = 0
FAIL = 0


def ok(label, got, want):
    global PASS, FAIL
    if got == want:
        PASS += 1
        print('  ok   %s' % label)
    else:
        FAIL += 1
        print('  FAIL %s\n         got %r  want %r' % (label, got, want))


def voice_band():
    src = io.open(VOICE, encoding='utf-8').read()
    m = re.search(r'var TITLE_BAND = \{\s*lo:\s*(-?\d+),\s*hi:\s*(-?\d+)\s*\}', src)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2))


def title_spans():
    """Every enabled title type's vertical span, from the mod's own config."""
    if not os.path.exists(TT):
        return None
    src = io.open(TT, encoding='utf-8', errors='replace').read()
    spans = []
    # Each ["Traveler's Titles"."X Titles"] block carries its own size/offset/enable.
    for block in re.split(r'\n\t\[', src):
        en = re.search(r'"Enable (\w+) Titles"\s*=\s*(true|false)', block)
        if not en or en.group(2) != 'true':
            continue
        y = re.search(r'"Text Y Offset"\s*=\s*(-?\d+)', block)
        sz = re.search(r'"Text Size"\s*=\s*([\d.]+)', block)
        cen = re.search(r'"Center Title"\s*=\s*(true|false)', block)
        if not y or not sz:
            continue
        # ⚠️ Only centre-relative titles share a coordinate space with the god overlays.
        # One anchored to the top of the screen is a different axis and not comparable.
        if cen and cen.group(1) != 'true':
            continue
        half = FONT * float(sz.group(1)) / 2.0
        spans.append((en.group(1), int(y.group(1)) - half, int(y.group(1)) + half))
    return spans


def main():
    band = voice_band()
    if band is None:
        print('FAIL: TITLE_BAND not found in voice.js - has it been renamed or removed?')
        return 1
    lo, hi = band
    print('voice.js TITLE_BAND = %d .. %d' % (lo, hi))

    spans = title_spans()
    if spans is None:
        # 🚨 "I could not look" and "I looked and it was fine" must never share an exit
        # code. The mod may simply be uninstalled, which is a real answer - but it is not
        # the same answer as "the band is correct".
        print('travelerstitles config NOT FOUND at %s' % TT)
        print('  Either the mod is gone - in which case TITLE_BAND is dead weight and')
        print('  should be removed from voice.js - or this path is wrong. Not a pass.')
        return 2
    if not spans:
        print('no centre-anchored titles are enabled')
        print('  TITLE_BAND is currently protecting nothing. That is not an error, but if')
        print('  it stays this way the band should come out of voice.js.')
        return 0

    print('Traveler\'s Titles, from its own config:')
    for name, s_lo, s_hi in spans:
        covered = (lo <= s_lo and hi >= s_hi)
        print('  %-11s spans %7.1f .. %-7.1f  %s'
              % (name, s_lo, s_hi, 'covered' if covered else 'NOT COVERED'))
        ok('the dead band covers the %s title' % name.lower(), covered, True)

    # ⚠️ A band far wider than it needs to be is not free - it is screen space the gods
    # may not use. Flagged, not failed: erring wide is the safe direction.
    widest_lo = min(s[1] for s in spans)
    widest_hi = max(s[2] for s in spans)
    slack = (widest_lo - lo) + (hi - widest_hi)
    print('\n  band is %.0fpx wider than the titles it covers' % slack)
    if slack > 40:
        print('  ⚠️  that is a lot of screen the gods are giving up - worth re-checking')

    print('\n%d passed, %d failed' % (PASS, FAIL))
    return 1 if FAIL else 0


if __name__ == '__main__':
    sys.exit(main())
