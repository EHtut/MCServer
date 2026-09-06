"""Generate the STORY advancement tree — one achievement per plot beat.

Ethan, 2026-09-05: *"there should be an achievement for everything plot related."*

    python tools/make_story_datapack.py

WHY A SEPARATE TREE FROM mcserver_progression
    That datapack is the PROGRESSION spine — depth, ores, the forge — and its
    advancements fire on location and inventory triggers, i.e. on what the player
    does. This tree fires on what the STORY does, and every entry is granted by
    code. Two different questions; mixing them makes one tab that answers neither.

⭐ EVERY CRITERION IS `minecraft:impossible`, AND THAT IS THE POINT
    Nothing here can be earned by accident. Each one is granted explicitly by
    `VELDORA.story.reach(player, key)` at the exact moment its beat fires, so the
    advancement tab IS the plot ledger: what a player has seen, in order, readable
    without a single debug command.

⚠️ ETHAN'S TEXT IS VERBATIM AND IS NOT CORRECTED HERE
    Three of his lines carry typos — "You hears" (the arguments), "screaches"
    (the hordes), and two missing terminal periods. They are HIS words on HIS
    screen, so they are reproduced exactly and reported by `--typos` instead.
    Silently fixing an author's prose is how you end up with a voice nobody wrote.

⛔ GENERATED. Never hand-edit the JSON; edit BEATS below and re-run.
"""
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PACK = os.path.join(ROOT, "pack", "datapacks", "mcserver_story")
NS = "mcserver"
OUT = os.path.join(PACK, "data", NS, "advancement", "act0")

# ── Act 0, in play order ────────────────────────────────────────────────────
# key · title · description · icon · frame
#
# `key` is what code passes to VELDORA.story.reach(). It never appears on screen,
# so it can stay stable while Ethan rewrites a title.
#
# frame: "task" ordinary · "goal" a milestone · "challenge" the act's turn
BEATS = [
    ("introductions", "Introductions",
     "You are healed, awakened in an unknown land your new life begins",
     "minecraft:written_book", "task"),

    ("the_caves", "The Caves",
     "There is something down there, it whispers for you to get closer.",
     "minecraft:torch", "task"),

    ("ank", "Ank",
     "A stranger who lives in the caves. He wants you to stay out of them and is "
     "willing to pay whatever he needs to.",
     "minecraft:emerald", "task"),

    ("the_arguments", "The arguments",
     "You hears arguments echoing through the caves. One of them sounds like Ank.",
     "minecraft:sculk_sensor", "task"),

    ("the_shadow", "The shadow",
     "A strange woman deep in the caves approached you. She warned you to leave and "
     "never return.",
     "minecraft:black_candle", "goal"),

    ("the_whispers", "The whispers",
     "You hear whisperings and arguments as you descend. They are growing restless",
     "minecraft:echo_shard", "task"),

    ("the_white_coat", "The woman in the white coat",
     "A strange young woman in a white coat approached you. She is telling you of "
     "something called the \"old world?\"",
     "minecraft:white_banner", "goal"),

    ("the_hordes", "The HORDES",
     "You hear screaches, screaming. Thousands of undead forlorn souls barrel towards "
     "you in an instant.",
     "minecraft:skeleton_skull", "challenge"),

    ("what_happened", "What just happened?",
     "You wake up in your bed, your head is killing you. You feel wrong.",
     "minecraft:red_bed", "challenge"),
]

# Typos in Ethan's text, reported rather than corrected. See the header.
TYPOS = [
    ("the_arguments", '"You hears" -> "You hear"'),
    ("the_hordes", '"screaches" -> "screeches"'),
    ("the_caves", "no terminal period (cosmetic; several others have one)"),
    ("the_whispers", "no terminal period"),
]


def advancement(key, title, desc, icon, frame, parent):
    a = {
        "display": {
            "icon": {"id": icon},
            "title": title,
            "description": desc,
            "frame": frame,
            "show_toast": True,
            "announce_to_chat": True,
            "hidden": False,
        },
        # ⭐ IMPOSSIBLE ON PURPOSE — see the header. Granted by code, never earned.
        "criteria": {"c": {"trigger": "minecraft:impossible"}},
    }
    if parent:
        a["parent"] = "%s:act0/%s" % (NS, parent)
    else:
        a["display"]["background"] = "minecraft:textures/block/deepslate.png"
    return a


def main():
    if "--typos" in sys.argv:
        print("Ethan's text is reproduced verbatim. These are the typos in it:")
        for key, note in TYPOS:
            print("  %-16s %s" % (key, note))
        print("\nFix them by editing BEATS in this file and re-running.")
        return 0

    os.makedirs(OUT, exist_ok=True)
    meta = os.path.join(PACK, "pack.mcmeta")
    io.open(meta, "w", encoding="utf-8").write(json.dumps({
        "pack": {
            "pack_format": 48,
            "description": "Arkhdottir: the story ledger. One advancement per plot beat.",
        }
    }, indent=1) + "\n")

    parent = None
    for key, title, desc, icon, frame in BEATS:
        data = advancement(key, title, desc, icon, frame, parent)
        path = os.path.join(OUT, key + ".json")
        io.open(path, "w", encoding="utf-8").write(json.dumps(data, indent=1) + "\n")
        parent = key

    print("wrote %d advancements to %s" % (len(BEATS), os.path.relpath(OUT, ROOT)))
    print("keys, for VELDORA.story.reach():")
    for key, title, _, _, _ in BEATS:
        print("  %-16s %s" % (key, title))
    print("\n%d typo(s) in the source text - `--typos` lists them, none corrected here."
          % len(TYPOS))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
