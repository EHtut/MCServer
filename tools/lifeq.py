#!/usr/bin/env python3
"""lifeq - is the world actually ALIVE? Count what is saved in it, per chunk.

WHY THIS EXISTS
---------------
Ethan, 2026-08-18, relaying a playtester: the world is well designed, but
"outside the gods bothering you it's kinda empty ... but that might be a
minecraft thing".

That is a claim about entity DENSITY, and every other way of checking it is
worthless:

  * reading the modlist tells you which ambience mods are INSTALLED, not whether
    anything spawned;
  * standing in the world is a sample of one, biased toward where you stood;
  * `/ctrl showmobs` needs a running server, a logged-in player, and only ever
    sees the chunks that player has loaded.

This reads `world/entities/*.mca` - the saved entity data for every chunk that
has ever been generated and written - and counts what is actually THERE.

⭐ IT MATTERS BECAUSE THE DESIGN PREDICTED THIS EXACT FAILURE. docs/06:

    "If nothing hostile spawns, the vanilla mob cycle stops doing its job - and
     it is also what removes entities. Hunted animals are never replaced, and the
     surface slowly empties into a beautiful, silent nothing."

Three mods were named as the answer (Respawning Animals, Spawn, Cosy Critters).
This is the instrument that says whether they are working.

DESIGN RULES (shared with genq.py / mcq.py / logq.py)
-----------------------------------------------------
  * Zero matches prints that it does NOT prove absence, and says how much was
    sampled. A silent 0 is the failure mode every tool here is written against.
  * "could not read" and "found nothing" are never the same value.
  * READ ONLY. Opens region files 'rb' and never writes. Safe on a live server,
    though a running server may hold recent chunks in memory unwritten.
"""

import argparse
import collections
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from genq import NBTReader, iter_chunks  # noqa: E402  - reuse, do not reimplement

WORLD = r"C:\MCServer\instance\world"

# Rough buckets. Deliberately coarse: the question is "is anything alive out
# there", not a taxonomy. Anything unmatched lands in `other` and is listed, so a
# mod's roster can never be silently miscounted as nothing.
HOSTILE_HINT = (
    "zombie", "skeleton", "creeper", "spider", "enderman", "witch", "slime",
    "phantom", "drowned", "husk", "stray", "bogged", "pillager", "vindicator",
    "evoker", "ravager", "vex", "silverfish", "endermite", "guardian", "shulker",
    "blaze", "ghast", "magma", "wither", "hoglin", "zoglin", "piglin", "warden",
    "ghoul", "flesh_eater", "howler", "abomination", "templar", "knocker",
    "burned", "immortal", "frostbitten", "lackey", "miner", "chaos", "dread",
    "nightmare", "spirit", "imp", "decaying", "decrepit", "banshee", "watcher",
    "preserved", "spectre", "mummy", "scarab", "swampy", "wraith", "cultist",
)
PASSIVE_HINT = (
    "cow", "pig", "sheep", "chicken", "horse", "donkey", "mule", "llama",
    "rabbit", "fox", "wolf", "cat", "ocelot", "panda", "bee", "turtle", "goat",
    "axolotl", "frog", "tadpole", "bat", "squid", "dolphin", "cod", "salmon",
    "tropical", "pufferfish", "parrot", "villager", "trader", "golem", "camel",
    "sniffer", "armadillo", "allay", "strider", "mooshroom", "duck", "goose",
    "bird", "butterfly", "critter", "deer", "boar", "lizard", "snail", "mole",
    "sparkle",
)
# Not life. Counting these as population is how "the world is full" gets claimed
# on a pile of dropped cobblestone.
NOT_LIFE = (
    "item", "experience_orb", "arrow", "projectile", "fireball", "boat",
    "minecart", "painting", "item_frame", "armor_stand", "display", "marker",
    "eye_of_ender", "falling_block", "tnt", "lightning", "leash", "interaction",
    "text_display", "block_display", "item_display", "shulker_bullet",
    "fishing_bobber", "egg", "snowball", "potion", "trident", "firework",
    "glow_flare", "flare", "bullet", "bomb", "dart", "shard", "pillar",
)


def bucket(eid):
    short = eid.split(":", 1)[-1]
    for n in NOT_LIFE:
        if n in short:
            return "not_life"
    for h in HOSTILE_HINT:
        if h in short:
            return "hostile"
    for p in PASSIVE_HINT:
        if p in short:
            return "passive"
    return "other"


def census(world, budget):
    edir = pathlib.Path(world) / "entities"
    if not edir.is_dir():
        return None, "no entities/ directory at %s" % edir

    files = sorted(edir.glob("r.*.mca"))
    if not files:
        return None, "entities/ exists but holds no .mca files"

    per_file = max(1, budget // max(1, len(files)))
    counts = collections.Counter()
    buckets = collections.Counter()
    chunks_read = 0
    chunks_failed = 0
    chunks_with_life = 0
    fail_reasons = collections.Counter()

    for f in files:
        for root, reason in iter_chunks(str(f), per_file):
            if root is None:
                chunks_failed += 1
                fail_reasons[reason] += 1
                continue
            chunks_read += 1
            ents = root.get("Entities") or []
            alive_here = 0
            for e in ents:
                eid = e.get("id")
                if not isinstance(eid, str):
                    continue
                counts[eid] += 1
                b = bucket(eid)
                buckets[b] += 1
                if b in ("hostile", "passive", "other"):
                    alive_here += 1
            if alive_here:
                chunks_with_life += 1

    return {
        "files": len(files),
        "chunks_read": chunks_read,
        "chunks_failed": chunks_failed,
        "fail_reasons": fail_reasons,
        "chunks_with_life": chunks_with_life,
        "counts": counts,
        "buckets": buckets,
    }, None


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--world", default=WORLD)
    ap.add_argument("--chunks", type=int, default=4000,
                    help="approximate chunk budget across all region files")
    ap.add_argument("--top", type=int, default=25)
    a = ap.parse_args()

    data, err = census(a.world, a.chunks)
    if err:
        print("could not run: %s" % err)
        return 2

    read = data["chunks_read"]
    print("=" * 72)
    print("LIFE CENSUS  -  %s" % a.world)
    print("=" * 72)
    print("  region files      %d" % data["files"])
    print("  chunks sampled    %d" % read)
    if data["chunks_failed"]:
        # Never let unreadable read as empty.
        print("  chunks UNREADABLE %d  %s" % (
            data["chunks_failed"], dict(data["fail_reasons"])))

    if read == 0:
        print("\n  0 chunks read. This does NOT prove the world is empty - it "
              "proves nothing was sampled.")
        return 1

    b = data["buckets"]
    living = b["hostile"] + b["passive"] + b["other"]
    print()
    print("  LIVING ENTITIES   %d   (%.2f per chunk)" % (living, living / read))
    print("    passive         %d   (%.2f per chunk)" % (b["passive"], b["passive"] / read))
    print("    hostile         %d   (%.2f per chunk)" % (b["hostile"], b["hostile"] / read))
    print("    unclassified    %d" % b["other"])
    print("  not life (items,  %d" % b["not_life"])
    print("   projectiles...)")
    print()
    pct = 100.0 * data["chunks_with_life"] / read
    print("  chunks with ANY living thing in them:  %d / %d  (%.1f%%)"
          % (data["chunks_with_life"], read, pct))
    if pct < 25:
        print("  ^ that is the number the playtester is feeling.")

    print()
    print("  TOP %d BY COUNT" % a.top)
    for eid, n in data["counts"].most_common(a.top):
        print("    %-52s %6d  %s" % (eid, n, bucket(eid)))

    if b["other"]:
        print()
        print("  UNCLASSIFIED (listed so a mod roster is never silently missed)")
        shown = 0
        for eid, n in data["counts"].most_common():
            if bucket(eid) == "other":
                print("    %-52s %6d" % (eid, n))
                shown += 1
                if shown >= 20:
                    break

    if living == 0:
        print()
        print("  0 living entities across %d chunks. That is a real finding, but it "
              "is worth\n  confirming the server has SAVED recently - a running "
              "server holds recent\n  chunks in memory and this reads only what is "
              "on disk." % read)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
