"""Build the Arkhdottir: New Blood in-game guidebook (Patchouli, external book).

WHY A GUIDEBOOK AT ALL

EMI already tells you every recipe in the pack. What it cannot tell you is the
things THIS pack changed, and every one of them is invisible until it bites:

  - the surface has no hostile spawns above y40, so night is safe and quiet
  - ...but structures are exempt, and pillager patrols ignore the rule entirely
  - gunpowder does not generate above y -64, which gates every gun in TaCZ
  - death is instant-respawn and your gear stays in a corpse where you fell
  - sneak is CTRL and sprint is SHIFT, swapped from vanilla
  - shaders and textures ship installed but switched OFF

A player who does not know these reads them as bugs. Ethan's brother spent his
first night concluding the world was broken. That is what this book is for.

DELIVERY

Patchouli's BookFolderLoader scans <gamedir>/patchouli_books/ and loads any
subfolder containing a book.json - no resource pack, no mod jar, no datapack.
Verified by reading BookFolderLoader.class: it lists the directory, mkdir's it
if absent, and logs "Failed to load external book json from {}, skipping" on a
bad book, which is where to look if the book does not appear.

External books resolve under the `patchouli` namespace, so entries reference
their category as "patchouli:<category-file-name>".

NOTE this is CLIENT-SIDE. packwiz syncs mods, never loose game files, so the
book reaches other players through the instance zip on re-import.

Run:  python tools/make_guidebook.py
"""

from __future__ import annotations

import json
import pathlib
import shutil

BOOK_ID = "arkhdottir"
OUT = pathlib.Path(__file__).resolve().parent.parent / "client" / "patchouli_books" / BOOK_ID

# MINIMAL ON PURPOSE. The first version carried creative_tab and book_texture
# and the book never registered - Patchouli logged NEITHER success NOR failure,
# and `arkhdottir` appeared zero times in an 11.6 MB client debug log.
#
# With no error to read, the only honest move is to remove everything that is
# not required and re-test. `name` and `landing_text` are the only mandatory
# fields; creative_tab in particular takes a ResourceLocation and a bad one is a
# silent skip, which fits the symptom exactly.
BOOK = {
    "name": "My Journal",
    "landing_text": (
        # [CLAUDE-DRAFT] - the landing page is the first thing he reads and it is
        # PROSE, which is Ethan's. This is a placeholder in the journal's voice,
        # kept short on purpose so replacing it is cheap. The last line is
        # FUNCTIONAL, not flavour - it is the one instruction a new player needs.
        "I am keeping this because I do not trust my memory any more.$(br2)"
        "The surface belongs to animals and to whatever people still live out "
        "here. Everything that wants me dead is $(o)underground$().$(br2)"
        "$(italic)Read the first chapter before your first night.$()"
    ),
    "version": 1,
    "i18n": False,
}


def origin_sentences():
    """Ethan's origin, read from opening_lines.js rather than copied in.

    ONE SOURCE. The opening types the title card and the journal holds the words; if the
    text lived in two files, editing the opening would leave the journal telling an older
    version of his story, and nothing would report it.
    """
    f = pathlib.Path(__file__).resolve().parent.parent / "pack" / "kubejs" /         "server_scripts" / "opening_lines.js"
    t = f.read_text(encoding="utf-8")
    a = t.index("var SENTENCES = [")
    b = t.index("]", a)
    out = []
    for ln in t[a:b].splitlines()[1:]:
        ln = ln.strip()
        if ln:
            out.append(ln.rstrip(",").strip('"'))
    if not out:
        raise SystemExit("no sentences in opening_lines.js - has it been regenerated?")
    return out


ORIGIN = origin_sentences()

# ── THE FOUR SECTIONS ──────────────────────────────────────────────────────
# Ethan, 2026-09-06: "clear it and section it into Journal entries / People /
# World / Manual", and "Im struggling with words so you can improve the above
# the categories with something that would make sense to exist in a journal."
#
# So they are written as the PLAYER'S OWN journal rather than as a wiki:
#
#   Journal entries -> Entries                what happened, in order
#   People          -> Those I Have Met       only who you have actually met
#   World           -> This Land
#   Manual          -> Things I Have Learned  a journal has no "manual" section
#
# The last one carries the argument. A journal does not contain a manual - it
# contains what the writer worked out the hard way, which is exactly what that
# section is: sneak is CTRL, nothing spawns above y40, your corpse keeps your
# gear. Written as lessons they read as the character's, not the developer's.
#
# THIS IS THE BOOK HE MEANS BY "THE JOURNAL". It is Patchouli, it is a BUTTON IN
# THE INVENTORY SCREEN rather than an item, and it is the one he actually uses.
# A Modonomicon copy of all this was built on 2026-09-06 and DELETED the same
# hour - Ethan: "we do not use modnomicon for anything on our side. it is pure
# dependency." See docs/WORDS.md.
CATEGORIES = {
    "entries": {
        "name": "Entries",
        "description": "What happened, in the order it happened to me.",
        "icon": "minecraft:writable_book",
        "sortnum": 0,
    },
    "people": {
        "name": "Those I Have Met",
        "description": "Names and faces. Only the ones I have actually met.",
        "icon": "minecraft:player_head",
        "sortnum": 1,
    },
    "land": {
        "name": "This Land",
        "description": "Where I am, and what is under it.",
        "icon": "minecraft:grass_block",
        "sortnum": 2,
    },
    "learned": {
        "name": "Things I Have Learned",
        "description": "Usually the hard way.",
        "icon": "minecraft:lantern",
        "sortnum": 3,
    },
}

ENTRIES = {
    # ⭐ ONE ENTRY. Ethan, 2026-09-06: "everything in the journal should be clear except
    # Entry 0: And the traveller introduction."
    #
    # 🔴 SEVEN ENTRIES WERE DELETED HERE, and they were good prose about the pack's real
    # rules - the surface being safe, gunpowder, the controls, dying. They are in git.
    # ⛔ They are not "temporarily removed": a journal that starts full is not a journal,
    # it is a manual with a journal's name on it. The book fills as the story happens or
    # it is not his.
    #
    # ⚠️ The three other categories are therefore EMPTY. That is the design - they fill in
    # as he writes - but if Patchouli renders an empty category as a dead clickable box,
    # say so and they can be hidden until they have something in them.
    "entry_0": {
        "name": "Entry 0",
        "category": "patchouli:entries",
        "icon": "minecraft:written_book",
        "priority": True,
        "pages": [
            {"type": "patchouli:text", "title": "The Road",
             "text": "$(br2)".join(ORIGIN[:4])},
            {"type": "patchouli:text", "title": "The Seventh Night",
             "text": "$(br2)".join(ORIGIN[4:11])},
            {"type": "patchouli:text", "title": "The Morning After",
             "text": "$(br2)".join(ORIGIN[11:])},
        ],
    },
}


def main() -> int:
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "en_us" / "categories").mkdir(parents=True, exist_ok=True)
    (OUT / "en_us" / "entries").mkdir(parents=True, exist_ok=True)

    def w(path: pathlib.Path, obj) -> None:
        path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8", newline="\n")

    w(OUT / "book.json", BOOK)
    for name, cat in CATEGORIES.items():
        w(OUT / "en_us" / "categories" / f"{name}.json", cat)
    for name, entry in ENTRIES.items():
        w(OUT / "en_us" / "entries" / f"{name}.json", entry)

    print(f"  book      : patchouli:{BOOK_ID}")
    print(f"  categories: {len(CATEGORIES)}")
    print(f"  entries   : {len(ENTRIES)}  ({sum(len(e['pages']) for e in ENTRIES.values())} pages)")
    print(f"  written to: {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
