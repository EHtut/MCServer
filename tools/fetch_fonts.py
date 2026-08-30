"""fetch_fonts.py — pull the gods' fonts and build the Veldora resource pack.

    python tools/fetch_fonts.py            # report what is missing, download nothing
    python tools/fetch_fonts.py --fetch    # download and build the pack

⭐ WHY A TOOL AND NOT A ONE-OFF DOWNLOAD. The pack has to be rebuildable by whoever comes
next, and "some fonts were downloaded once from somewhere" is not a build step. This
records the source, the licence and the exact file for each face.

── ⚠️ FONTS ARE CLIENT-SIDE, AND THAT IS THE TRAP ────────────────────────────
The server only ever NAMES a font. A client without the resource pack renders the vanilla
default and **nothing errors** — the same silent-failure shape that cost a whole session
in D-123. So a font is not "working" because the server sent it; it is working when a
player with the pack sees it.

── THE LICENCE, BECAUSE THIS SHIPS TO PLAYERS ────────────────────────────────
Every face here is under the **SIL Open Font License 1.1**, which permits bundling and
redistribution inside a modpack provided the licence travels with it. `--fetch` writes
`OFL.txt` next to the fonts. ⛔ Do not add a face here without checking its licence
allows redistribution; a proprietary font in a public repo is a real problem, not a
paperwork one.

── ⭐ THE BRIEF, IN ETHAN'S WORDS (2026-08-30) ───────────────────────────────
*"all fonts should still be rustic"* — and per god:

    Blade    "Straight, hard"
    Art      "Elegant, almost dancing across your screen"
    Wall     "Scratched, harsh"
    Forge    "Western? if that is a thing"
    Salvage  "Typed."

🔑 ART'S DANCING IS NOT THE FONT. The letterforms are elegant and still; the movement
comes from the mod's `wave` flag. Choosing a font that dances by itself would fight the
animation instead of carrying it.
"""
import io
import json
import os
import re
import sys
import urllib.request

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(REPO, "pack", "resourcepacks", "veldora")
ASSETS = os.path.join(PACK, "assets", "veldora", "font")

# 1.21.1 resource pack format.
PACK_FORMAT = 34

# god -> (google family, why, minecraft font size, oversample)
#
# ⚠️ `size` is the pixel height Minecraft renders the face at, NOT the file's design
# size. 11 matches vanilla's visual weight; a display face with tall capitals reads
# larger at the same number, which is why Cinzel and Rye sit lower.
FONTS = {
    "blade": ("Cinzel",
              'Roman inscriptional capitals - carved, straight, hard. "Straight, hard."',
              10, 2),
    "art": ("Cormorant Garamond",
            'High-contrast old-style. Elegant and STILL - the dancing is the wave flag.',
            11, 2),
    "wall": ("Metamorphous",
             'Gnarled, rough-edged. "Scratched, harsh" without being a horror gimmick.',
             10, 2),
    "forge": ("Rye",
              'The canonical western slab. "Western? if that is a thing" - it is.',
              10, 2),
    "salvage": ("Special Elite",
                'A worn typewriter. Literally "Typed.", and rustic rather than clean.',
                10, 2),
}

CSS = "https://fonts.googleapis.com/css2?family=%s"
OFL_URL = "https://openfontlicense.org/documents/OFL.txt"

# ⚠️ Google Fonts serves woff2 to a modern browser and TTF to an old one. Minecraft
# needs TTF, so this asks as something ancient on purpose.
OLD_UA = "Mozilla/5.0 (Windows NT 5.1)"


def get(url, ua=OLD_UA, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    return urllib.request.urlopen(req, timeout=timeout).read()


def ttf_url(family):
    """Ask Google Fonts for the family and read the TTF url out of the CSS."""
    css = get(CSS % family.replace(" ", "+")).decode("utf-8", "replace")
    urls = re.findall(r"url\((https://[^)]+\.ttf)\)", css)
    if not urls:
        return None
    return urls[0]


def status():
    print("the gods' fonts")
    print("=" * 78)
    missing = 0
    for god in sorted(FONTS):
        family, why, size, over = FONTS[god]
        ttf = os.path.join(ASSETS, god + ".ttf")
        j = os.path.join(ASSETS, god + ".json")
        have = os.path.exists(ttf) and os.path.exists(j)
        if not have:
            missing += 1
        n = os.path.getsize(ttf) if os.path.exists(ttf) else 0
        print("  %-8s %-20s %s" % (god, family, "ok, %d KB" % (n // 1024) if have else "MISSING"))
        print("           %s" % why)
    print("=" * 78)
    if missing:
        print("%d missing. Run with --fetch to download them (SIL OFL, redistributable)."
              % missing)
    else:
        print("all present. ⚠️ Present in the REPO is not present on a PLAYER'S machine -")
        print("the pack still has to reach clients or the font silently renders default.")
    return missing


def fetch():
    if not os.path.isdir(ASSETS):
        os.makedirs(ASSETS)

    # pack.mcmeta - without it the pack is invisible and nothing says why.
    mcmeta = {
        "pack": {
            "pack_format": PACK_FORMAT,
            "description": "Veldora - the gods' fonts",
        }
    }
    with io.open(os.path.join(PACK, "pack.mcmeta"), "w", encoding="utf-8", newline="") as f:
        f.write(json.dumps(mcmeta, indent=2))
    print("wrote pack.mcmeta (pack_format %d)" % PACK_FORMAT)

    try:
        ofl = get(OFL_URL, ua="Mozilla/5.0")
        with io.open(os.path.join(PACK, "OFL.txt"), "wb") as f:
            f.write(ofl)
        print("wrote OFL.txt (%d KB) - the licence travels with the fonts" % (len(ofl) // 1024))
    except Exception as e:
        # ⚠️ NOT fatal, but it is a real omission and must not pass silently.
        print("⚠️  could not fetch OFL.txt (%s) - add it by hand before this ships" % e)

    ok = 0
    for god in sorted(FONTS):
        family, why, size, over = FONTS[god]
        try:
            url = ttf_url(family)
            if not url:
                print("  %-8s %-20s NO TTF in the CSS - skipped" % (god, family))
                continue
            data = get(url)
            if len(data) < 1000:
                print("  %-8s %-20s suspiciously small (%d bytes) - skipped"
                      % (god, family, len(data)))
                continue
            with io.open(os.path.join(ASSETS, god + ".ttf"), "wb") as f:
                f.write(data)

            # 🔴 `file` IS ALREADY ROOTED AT assets/<ns>/font/ - do NOT add the `font/`
            # prefix yourself. Minecraft's TrueTypeGlyphProviderDefinition calls
            # `.withPrefix("font/")` on this value, so "veldora:font/wall.ttf" resolves to
            # assets/veldora/font/FONT/wall.ttf and throws FileNotFoundException.
            #
            # ⚠️ THE SYMPTOM IS NOT A MISSING FONT, IT IS BOXES. A rejected builder leaves
            # an EMPTY font set, and an empty font set draws every codepoint as the
            # missing glyph - so the screen fills with rectangles at the right colour and
            # the right length, while the reason sits in the CLIENT log (D-130).
            #
            # 🔑 The comment that used to sit on this line already stated the rule
            # correctly - "resolves under assets/<ns>/font/" - and the code below it
            # added the prefix anyway. Documented and wrong in the same three lines.
            defn = {
                "providers": [{
                    "type": "ttf",
                    "file": "veldora:%s.ttf" % god,
                    "shift": [0, 0],
                    "size": size,
                    "oversample": over,
                }]
            }
            with io.open(os.path.join(ASSETS, god + ".json"), "w",
                         encoding="utf-8", newline="") as f:
                f.write(json.dumps(defn, indent=2))
            print("  %-8s %-20s %d KB  -> veldora:%s" % (god, family, len(data) // 1024, god))
            ok += 1
        except Exception as e:
            print("  %-8s %-20s FAILED: %s" % (god, family, e))

    print("=" * 78)
    print("%d/%d fonts in place at pack/resourcepacks/veldora" % (ok, len(FONTS)))
    if ok:
        print()
        print("Use them as  font: 'veldora:<god>'  in each god's setStyle().")
        print("⚠️ The pack must reach CLIENTS. A client without it renders the vanilla")
        print("   default and nothing errors - the font just quietly does not happen.")
    return 0 if ok == len(FONTS) else 1


def main():
    if "--fetch" in sys.argv:
        return fetch()
    status()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
