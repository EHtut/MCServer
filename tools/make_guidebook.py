"""Build the Cogs and Cadavers in-game guidebook (Patchouli, external book).

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

BOOK_ID = "cogs_and_cadavers"
OUT = pathlib.Path(__file__).resolve().parent.parent / "client" / "patchouli_books" / BOOK_ID

# MINIMAL ON PURPOSE. The first version carried creative_tab and book_texture
# and the book never registered - Patchouli logged NEITHER success NOR failure,
# and `cogs_and_cadavers` appeared zero times in an 11.6 MB client debug log.
#
# With no error to read, the only honest move is to remove everything that is
# not required and re-test. `name` and `landing_text` are the only mandatory
# fields; creative_tab in particular takes a ResourceLocation and a bad one is a
# silent skip, which fits the symptom exactly.
BOOK = {
    "name": "Cogs and Cadavers",
    "landing_text": (
        "A world of cogs above and cadavers below.$(br2)"
        "The surface belongs to animals and to whatever people still live out here. "
        "Everything that wants you dead is $(o)underground$().$(br2)"
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
    # ------------------------------------------------------------- entries
    "how_i_got_here": {
        "name": "How I Got Here",
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

    # -------------------------------------------------------------- people
    # LOCKED UNTIL YOU HAVE ACTUALLY MET THEM. Patchouli hides an entry whose
    # `advancement` the player has not earned, and story.js already grants these
    # nine beats - so the section is a RECORD rather than a cast list, with no
    # new machinery. NEEDS-GAME: whether Patchouli hides or greys a locked entry.
    "ank": {
        "name": "Ank",
        "category": "patchouli:people",
        "icon": "minecraft:iron_pickaxe",
        "advancement": "mcserver:act0/ank",
        "pages": [
            {"type": "patchouli:text", "title": "Ank",
             "text": "He was waiting in the upper caves, which is a strange place to "
                     "wait.$(br2)He says the deep is dangerous, that there have been rock "
                     "slides, that as $(o)sheriff$() my safety is his business.$(br2)He will "
                     "trade me almost anything to keep me above ground, and his prices make "
                     "no sense."},
            {"type": "patchouli:text",
             "text": "A man that keen to sell me a reason to stay is a man with a reason "
                     "of his own.$(br2)I have not worked out what it is yet."},
        ],
    },
    "the_white_coat": {
        "name": "The Woman in the White Coat",
        "category": "patchouli:people",
        "icon": "minecraft:white_wool",
        "advancement": "mcserver:act0/the_white_coat",
        "pages": [
            {"type": "patchouli:text", "title": "The Woman in the White Coat",
             "text": "She came on the seventh night, when I was dying, and she did not say "
                     "one word the whole time.$(br2)She was gone by morning.$(br2)"
                     "$(italic)I have never been able to decide whether she was a doctor.$()"},
        ],
    },

    # ---------------------------------------------------------------- world
    "the_surface_is_safe": {
        "name": "The Surface Is Safe",
        "category": "patchouli:learned",
        "icon": "minecraft:grass_block",
        "priority": True,
        "pages": [
            {"type": "patchouli:text", "title": "No Monsters Up Here",
             "text": "Nothing hostile spawns in the open overworld above $(l)y 40$(). "
                     "Not at night, not in the dark, not in a cave mouth on a hillside.$(br2)"
                     "This is deliberate. The surface is for animals, farms, villages and "
                     "building. If you want to be afraid, you have to go looking for it."},
            {"type": "patchouli:text", "title": "Three Exceptions",
             "text": "$(li)$(l)Structures$() are exempt. A dungeon, fort, outpost or camp "
                     "spawns monsters normally, at any depth. Dangerous places stay dangerous.$(br)"
                     "$(li)$(l)Pillager patrols$() roam anywhere. They are not covered by the "
                     "rule and never will be - they use a different spawning system entirely.$(br)"
                     "$(li)$(l)The stalkers$() come when they want to. See the last page."},
            {"type": "patchouli:text", "title": "Below y 40",
             "text": "Between $(l)y 0$() and $(l)y 39$() monsters spawn normally, but no more "
                     "than forty at once. Uneasy, not swarming.$(br2)"
                     "Below $(l)y 0$() nothing is held back at all. The deep is meant to be "
                     "the most dangerous place in the world, and it is."},
        ],
    },
    "dying": {
        "name": "Dying",
        "category": "patchouli:learned",
        "icon": "minecraft:skeleton_skull",
        "pages": [
            {"type": "patchouli:text", "title": "You Keep Going",
             "text": "There is $(o)no death screen$(). You die, and a moment later you are "
                     "awake at your bed.$(br2)"
                     "Your things do not come with you. They stay in a $(l)corpse$() where you "
                     "fell, holding everything you had."},
            {"type": "patchouli:text", "title": "The Cost Is The Walk",
             "text": "Dying never costs you your gear and never costs you your base. It costs "
                     "you $(o)the trip back$().$(br2)"
                     "That is the whole point. Dying nine hundred blocks down is a real loss of "
                     "an evening, and dying in your wheat field is nothing at all. The danger "
                     "scales with how far you went."},
        ],
    },
    "the_horror": {
        "name": "Things That Are Not Bugs",
        "category": "patchouli:learned",
        "icon": "minecraft:soul_lantern",
        "pages": [
            {"type": "patchouli:text", "title": "It Is Supposed To Do That",
             "text": "Some of what happens here reads like a broken game. It is not.$(br2)"
                     "$(li)Whispering and voices in certain forests$(br)"
                     "$(li)Knocking on doors at night$(br)"
                     "$(li)A figure at the treeline that is gone when you look again$(br)"
                     "$(li)Someone wearing a face you recognise"},
            {"type": "patchouli:text", "title": "The Stalkers",
             "text": "A handful of things in this world hunt $(o)you$() specifically, on their "
                     "own schedule, and the surface rules do not hold them back.$(br2)"
                     "They are rare on purpose. If one has decided about you, you will know.$(br2)"
                     "$(italic)Not everything that walks like a player is one.$()"},
        ],
    },
    # --------------------------------------------------------------- depths
    "why_go_down": {
        "name": "Why Go Down",
        "category": "patchouli:land",
        "icon": "minecraft:diamond",
        "priority": True,
        "pages": [
            {"type": "patchouli:text", "title": "What The Surface Lacks",
             "text": "Everything above ground is wood, stone, crops and magic. The things that "
                     "$(o)do not belong$() in a world like this are buried in it.$(br2)"
                     "Gems. Gunpowder. Machinery nobody up here could have built. The further "
                     "down you dig, the less the world explains itself."},
            {"type": "patchouli:text", "title": "The Deeper, The Stranger",
             "text": "Depth is the progression. Not a tech tree, not a quest list - just how "
                     "far down you are willing to go, and what you can survive once you are "
                     "there.$(br2)"
                     "Bring light, bring food, and expect the walk home to be the hard part."},
        ],
    },
    "gunpowder": {
        "name": "Gunpowder And Guns",
        "category": "patchouli:land",
        "icon": "minecraft:gunpowder",
        "pages": [
            {"type": "patchouli:text", "title": "It Is Not Up Here",
             "text": "Gunpowder ore does not generate near the surface. It sits between "
                     "$(l)y -128$() and $(l)y -64$(), in the deepest band of the world.$(br2)"
                     "Creepers still drop it. But if you want $(o)enough$() gunpowder to feed "
                     "a firearm, you are going mining, and you are going deep."},
            {"type": "patchouli:text", "title": "Why It Is Gated",
             "text": "Guns are not an early game option in this world - they are what you earn "
                     "by surviving the bottom of it.$(br2)"
                     "That is the trade the depths offer everywhere: the thing you want is "
                     "under the thing that wants you."},
        ],
    },
    # -------------------------------------------------------------- playing
    "controls": {
        "name": "Controls",
        "category": "patchouli:learned",
        "icon": "minecraft:lever",
        "priority": True,
        "pages": [
            {"type": "patchouli:text", "title": "Not Vanilla",
             "text": "$(li)$(l)Sneak$() is $(o)LEFT CTRL$()$(br)"
                     "$(li)$(l)Sprint$() is $(o)LEFT SHIFT$()$(br2)"
                     "These are swapped from Minecraft's defaults on purpose. If you hate it, "
                     "$(l)Options -> Controls$() and put them back - it is your game."},
            {"type": "patchouli:text", "title": "Combat",
             "text": "Weapons have real movesets. A sword, an axe and a spear do not just deal "
                     "different numbers, they $(o)swing differently$() and combo differently.$(br2)"
                     "Try holding a weapon and attacking repeatedly rather than clicking once. "
                     "Different weapons reward different rhythms."},
        ],
    },
    "making_it_pretty": {
        "name": "Making It Look Good",
        "category": "patchouli:learned",
        "icon": "minecraft:glowstone",
        "pages": [
            {"type": "patchouli:text", "title": "Already Installed, Switched Off",
             "text": "Shaders and a texture pack came with the game. Nothing to download.$(br2)"
                     "They ship $(o)off$() because this install is tuned for the slowest "
                     "computer in the group. If yours has room, turn them on."},
            {"type": "patchouli:text", "title": "Turning Them On",
             "text": "$(l)Shaders$() - expensive, good graphics card only:$(br)"
                     "Options -> Video Settings -> Shader Packs, then switch shaders on. "
                     "BSL is already selected.$(br2)"
                     "$(l)Textures$() - cheap, most machines cope:$(br)"
                     "Options -> Resource Packs, move $(o)Faithful 32x$() to the right."},
            {"type": "patchouli:text", "title": "If It Runs Badly",
             "text": "Turn the $(o)shader$() off first, every time. It is by far the most "
                     "expensive thing here and nothing breaks without it.$(br2)"
                     "Suspect it immediately if frames collapse, the world renders with strange "
                     "stripes or flickering, or menus and text go missing."},
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
