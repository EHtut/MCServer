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

BOOK = {
    "name": "Cogs and Cadavers",
    "landing_text": (
        "A world of cogs above and cadavers below.$(br2)"
        "The surface belongs to animals and to whatever people still live out here. "
        "Everything that wants you dead is $(o)underground$().$(br2)"
        "$(italic)Read the first chapter before your first night.$()"
    ),
    "version": 1,
    "model": "patchouli:book_brown",
    "i18n": False,
    "creative_tab": "tools_and_utilities",
    "book_texture": "patchouli:textures/gui/book_brown.png",
}

CATEGORIES = {
    "the_world": {
        "name": "How This World Works",
        "description": "The rules this pack changed. Read this one first.",
        "icon": "minecraft:compass",
        "sortnum": 0,
    },
    "the_depths": {
        "name": "The Depths",
        "description": "Why anyone would go down there.",
        "icon": "minecraft:deepslate",
        "sortnum": 1,
    },
    "playing": {
        "name": "Playing",
        "description": "Controls, combat and making the game look good.",
        "icon": "minecraft:iron_sword",
        "sortnum": 2,
    },
}

ENTRIES = {
    # ---------------------------------------------------------------- world
    "the_surface_is_safe": {
        "name": "The Surface Is Safe",
        "category": "patchouli:the_world",
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
        "category": "patchouli:the_world",
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
        "category": "patchouli:the_world",
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
        "category": "patchouli:the_depths",
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
        "category": "patchouli:the_depths",
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
        "category": "patchouli:playing",
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
        "category": "patchouli:playing",
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
