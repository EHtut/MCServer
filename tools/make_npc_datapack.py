"""Generate the NPC presets — Ank first.

    python tools/make_npc_datapack.py
    python tools/make_npc_datapack.py --print ank    # the preset, to read

⭐ AN NPC IS A FILE, NOT CODE. Easy NPC 7.10.0 defines a character entirely in one SNBT
preset: entity type, skin, objectives, attributes, dialogue hooks. `docs/NPCS.md` §④ carries
the schema, copied out of the mod's own shipped `humanoid.npc.snbt`.

⇒ So Ank is generated the way every other datapack in this repo is generated, and the
  behaviour Ethan asked for costs no custom entity code at all:

      unkillable       Invulnerable:1b
      follows you      ObjectiveDataSet [{Type:"FOLLOW_PLAYER", ...}]
      never despawns   PersistenceRequired:1b      (ank.js removes him deliberately)
      never fights     no attack objective, and not attackable by anything

🔴 THE ONE THING THAT IS NOT A PRESET FIELD is the layer boundary — Ank leaving when the
player surfaces or goes too deep. That is `pack/kubejs/server_scripts/ank.js`.

⚠️ THE LOAD PATH IS THE UNPROVEN PART. The mod's own presets sit under
`data/easy_npc/api/preset/base/`, while the loader's string constant is `easy_npc/preset`.
Those are not obviously the same folder and only the game can say which one a THIRD-PARTY
datapack is read from — so this writes BOTH, which is cheap, and `/easy_npc preset import_new`'s suggestion list
settles it. ⛔ Delete the loser once it is known; two copies of one character is exactly the
duplicated-state problem this project keeps paying for.

⛔ GENERATED. Never hand-edit the SNBT; edit NPCS below and re-run.
"""
import io
import json
import os
import sys

# The Windows console defaults to cp1252 and dies on the markers this repo writes in.
# live_smoke.py carries the same guard for the same reason.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PACK = os.path.join(ROOT, "pack", "datapacks", "mcserver_npcs")

# Both candidate load paths — see the header.
PRESET_DIRS = [
    os.path.join(PACK, "data", "easy_npc", "preset", "arkhdottir"),
    os.path.join(PACK, "data", "easy_npc", "api", "preset", "arkhdottir"),
]

# ── the cast ────────────────────────────────────────────────────────────────
# ⚠️ `skin` is a resource location served by the client pack, NOT a file path. It reaches
# players through `python tools/build_client_assets.py --build`; see docs/NPCS.md §⑤.
NPCS = {
    "ank": {
        "name": "Ank",
        "entity": "easy_npc:humanoid",
        "variant": "STEVE",
        "skin": "veldora:textures/entity/ank.png",
        # ⭐ FOLLOW_PLAYER with a wide start and a close stop. He walks with you rather than
        # standing on you: StopDistance 3 keeps him out of the way while mining, and
        # StartDistance 16 lets him fall behind and catch up instead of teleporting about.
        "objectives": [
            {"Type": "FOLLOW_PLAYER", "StartDistance": 16, "StopDistance": 3,
             "SpeedModifier": 1.0},
            {"Type": "LOOK_AT_PLAYER"},
            {"Type": "LOOK_AT_RESET"},
        ],
        # ── ⭐ THE BRIBE, AND WHAT IT COSTS ────────────────────────────────
        # Ethan, 2026-09-05: *"ank has ores that are at severely reduced cost to go
        # below... he tries very hard to keep you out"* and *"the trades should be pretty
        # free."*
        #
        # 🔴 EMERALDS WERE WRONG AND HE CAUGHT IT. A day-1 pathless player has none, and
        # numismatics coins are worse: read out of the jar, they have NO crafting recipe,
        # NO loot table and no villager mixin, so they only exist once somebody has built
        # Create vendor machinery. A currency the player cannot hold is a shop with the
        # door locked, which is worse than no shop because it looks finished.
        #
        # ⭐ WHEAT, AND IT IS THE REASON HE TRADES AT ALL. He lives in a cave; he cannot
        # farm. Food is the one thing the surface has that he does not, which makes an
        # absurd rate read as CHARACTER rather than a broken shop.
        #
        # 🔑 HE IS NOT THE ONLY SOURCE. `mcserver_surface_ores` already places every ore
        # in a y54-120 band precisely so "descending is a CHOICE" - so Ank gates nothing.
        # He offers the same ore FASTER, which is an argument rather than a wall.
        #
        # ── ⭐⭐ AND THE PRICE FALLS AS HE LOSES ──────────────────────────────
        # Ethan, 2026-09-05: *"is it possible to stage the prices as expensive to start,
        # getting cheaper?"*
        #
        # 🔑 THE DRIVER IS DESCENTS, NOT DAYS, and that is the whole character of it.
        # Every time the player goes down anyway, Ank loses the argument and bids higher -
        # so the discount is EVIDENCE that he is failing, and a player who never descends
        # never sees the desperate prices at all. Days would make it a schedule; descents
        # make it a reaction.
        #
        # ⚠️ Tier 0 is a NORMAL trade. He opens like an ordinary merchant, and only the
        # later tiers look like somebody panicking - which is what makes the panic legible.
        # If he starts absurd there is nowhere for him to go.
        "trade_tiers": [
            # descents seen -> what one wheat buys
            {"at": 0, "iron": 1, "coal": 4, "copper": 2, "gold_per_2": 1, "diamond_bread": 8},
            {"at": 1, "iron": 3, "coal": 10, "copper": 5, "gold_per_2": 2, "diamond_bread": 4},
            {"at": 2, "iron": 8, "coal": 24, "copper": 12, "gold_per_2": 6, "diamond_bread": 2},
            {"at": 4, "iron": 16, "coal": 48, "copper": 24, "gold_per_2": 12, "diamond_bread": 1},
        ],
    },
}


def snbt(value, indent=0):
    """Minimal SNBT writer. ⚠️ ints get no suffix, floats get `f`, bools get `b` — the
    mod's own preset uses exactly those, and a bare `1` where `1b` is expected reads as an
    int and silently fails to set the flag."""
    pad = "  " * indent
    if isinstance(value, bool):
        return "1b" if value else "0b"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return "%sf" % ("%g" % value)
    if isinstance(value, str):
        return '"%s"' % value.replace("\\", "\\\\").replace('"', '\\"')
    if isinstance(value, list):
        if not value:
            return "[]"
        inner = ",".join("\n" + pad + "  " + snbt(v, indent + 1) for v in value)
        return "[" + inner + "\n" + pad + "]"
    if isinstance(value, dict):
        if not value:
            return "{}"
        parts = []
        for k, v in value.items():
            parts.append("\n" + pad + "  " + k + ":" + snbt(v, indent + 1))
        return "{" + ",".join(parts) + "\n" + pad + "}"
    raise TypeError("cannot serialise %r" % type(value))


def load_dialog():
    """The intro tree, imported from Ethan's document by ank_dialogue_import.py.

    ⚠️ ABSENT IS FINE AND SILENT-ISH. The preset is still valid without dialogue - Ank
    just has nothing to say - so a missing cache must not stop the pack generating. It
    IS reported, because "he has no dialogue" and "the importer was never run" are
    different problems.
    """
    p = os.path.join(HERE, ".cache", "ank_dialog.json")
    if not os.path.exists(p):
        return None
    try:
        return json.load(io.open(p, encoding="utf-8"))
    except Exception as e:
        print("  !! could not read the dialogue cache: %s" % e)
        return None


def dialog_block(d):
    """Easy NPC's DialogData, in the shape its own shipped presets use.

    ⭐ THE SCHEMA IS COPIED FROM `dialog_colors_and_styles.npc.snbt` IN THE JAR, not
    guessed: Label / Name / Texts[{Text}] / Buttons[{Label, Name, Actions[]}].
    `<br>` is its line break and `@initiator` is the player.
    """
    intro = d.get("intro") or {}
    opening = intro.get("open") or []
    branches = intro.get("branches") or []
    if not opening and not branches:
        return None

    dialogs = []
    # the opening, with one button per player option
    buttons = []
    for i, br in enumerate(branches):
        buttons.append({
            "Label": "opt_%d" % i,
            "Name": br["choice"],
            "Actions": [{"Type": "OPEN_NAMED_DIALOG", "Cmd": "reply_%d" % i}],
        })
    dialogs.append({
        "Label": "default",
        "Name": "Ank",
        # ⚠️ <br><br> between turns. He writes one line per turn and the renderer shows
        # them as one block, so without the breaks his pacing collapses into a paragraph.
        "Texts": [{"Text": "<br><br>".join(opening)}],
        "Buttons": buttons,
    })
    for i, br in enumerate(branches):
        dialogs.append({
            "Label": "reply_%d" % i,
            "Name": br["choice"][:24],
            "Texts": [{"Text": "<br><br>".join(br["reply"])}],
            # THE SHOP IS REACHED THROUGH WHAT HE SAYS, and every one of his replies
            # ends by offering it - "if you need anything. Come find me instead", "I'll get
            # you whatever you need". So the button is the sentence he just spoke, made
            # clickable, rather than a UI affordance bolted on.
            "Buttons": [
                {"Label": "trade", "Name": "What have you got?",
                 "Actions": [{"Type": "OPEN_TRADING_SCREEN"}]},
                {"Label": "close", "Name": "...", "Actions": [{"Type": "CLOSE_DIALOG"}]},
            ],
        })
    return {"DialogDataSet": dialogs, "Type": "STANDARD"}


def trades_for(tier):
    """One tier's offers. ⚠️ The SHAPE is fixed and only the counts move, so a player
    comparing prices across a week sees the same five rows getting better rather than a
    different shop each time."""
    return [
        ("minecraft:wheat", 1, "minecraft:iron_ingot", tier["iron"]),
        ("minecraft:wheat", 1, "minecraft:coal", tier["coal"]),
        ("minecraft:wheat", 1, "minecraft:copper_ingot", tier["copper"]),
        ("minecraft:wheat", 2, "minecraft:gold_ingot", tier["gold_per_2"]),
        ("minecraft:bread", tier["diamond_bread"], "minecraft:diamond", 1),
    ]


def offers(trades):
    """Vanilla MerchantOffers. ⚠️ 1.21 items are `{id, count}` — lowercase `count`; the
    pre-1.20.5 `Count` is silently ignored and the trade shows an empty slot."""
    out = []
    for buy_id, buy_n, sell_id, sell_n in trades:
        out.append({
            "buy": {"id": buy_id, "count": buy_n},
            "sell": {"id": sell_id, "count": sell_n},
            "maxUses": 9999,
            "uses": 0,
            "rewardExp": False,
            "xp": 0,
            "priceMultiplier": 0.0,
            "demand": 0,
            "specialPrice": 0,
        })
    return out


def preset(key, spec, trades, name_suffix=""):
    return {
        "PresetMetadata": {
            # ⛔ NOT "INTERNAL" — that is the mod's own marker and it feeds a security
            # model (CommandAuthority in the jar). Claiming it would be lying to the mod.
            "access": "PUBLIC",
            "author": "Rehykt",
            "category": "Arkhdottir",
            "created": 1,
            "description": "Act 0",
            "entityTypeId": spec["entity"],
            "modified": 1,
            "name": spec["name"] + name_suffix,
            "variantType": spec["variant"],
            "version": "1.0.0",
        },
        "data": {
            "CustomName": '{"text":"%s"}' % spec["name"],
            # ⚠️ OFF. A floating nameplate visible through terrain would announce him
            # before he arrives, and the whole beat is that he steps out of the dark.
            "CustomNameVisible": False,
            "EasyNPCVersion": 3,
            # 🔑 UNKILLABLE, and the vanilla flag rather than the mod's attribute: this one
            # appears in the mod's own shipped preset, so it is certain to be read.
            "Invulnerable": True,
            # ⛔ And nothing may even try. Ank never fights; a cave that starts a fight
            # with him would turn a warning into a brawl.
            "CanPickUpLoot": False,
            "PersistenceRequired": True,
            "ObjectiveData": {"ObjectiveDataSet": spec["objectives"]},
            "SkinData": {"Type": "RESOURCE_LOCATION", "Texture": spec["skin"]},
            # ⭐ ADVANCED = the full vanilla Offers list, which is what gives control over
            # exact counts. BASIC generates offers from a simpler shape and cannot express
            # "one emerald buys eight iron".
            "TradingData": {
                "Type": "ADVANCED",
                "MaxUses": 9999,
                "RewardedXP": 0,
                # ⚠️ Restocks hourly. He is not a shop with stock pressure; he is somebody
                # standing in a cave mouth trying to buy you off, and running out would
                # end the argument early.
                "ResetsEveryMin": 60,
            },
            "Offers": {"Recipes": offers(trades)},
            "ActionData": {"ActionEventSet": {
                # RIGHT-CLICK OPENS THE CONVERSATION, NOT THE SHOP. This said
                # OPEN_TRADING_SCREEN for two commits, which meant Ethan's entire imported
                # dialogue tree - the opening line, the three options, the sheriff branch -
                # sat in every preset with NOTHING ABLE TO OPEN IT. The importer reported
                # "4 screen(s)", the harness asserted they were in the file, and the player
                # would have gone straight to a wheat shop and never heard him speak.
                #
                # It is also the better order: he talks you out of going down FIRST, and
                # the shop is what he offers when that fails. A merchant who opens with his
                # inventory is not making an argument.
                "ON_INTERACTION": [{"Type": "OPEN_DEFAULT_DIALOG"}],
            }},
            "Status": {"finalized": True},
            **({"DialogData": DIALOG} if DIALOG else {}),
            "VariantType": spec["variant"],
            "id": spec["entity"],
        },
    }


DIALOG = None


def main():
    global DIALOG
    d = load_dialog()
    DIALOG = dialog_block(d) if d else None
    if "--print" in sys.argv:
        i = sys.argv.index("--print")
        key = sys.argv[i + 1] if i + 1 < len(sys.argv) else "ank"
        spec = NPCS[key]
        t = spec.get("trade_tiers")
        print(snbt(preset(key, spec, trades_for(t[0]) if t else [])))
        return 0

    os.makedirs(PACK, exist_ok=True)
    io.open(os.path.join(PACK, "pack.mcmeta"), "w", encoding="utf-8").write(
        '{\n "pack": {\n  "pack_format": 48,\n'
        '  "description": "Arkhdottir: the cast. Easy NPC presets."\n }\n}\n')

    n = 0
    for d in PRESET_DIRS:
        os.makedirs(d, exist_ok=True)
        for key, spec in NPCS.items():
            tiers = spec.get("trade_tiers")
            if not tiers:
                path = os.path.join(d, key + ".npc.snbt")
                io.open(path, "w", encoding="utf-8").write(
                    snbt(preset(key, spec, [])) + chr(10))
                n += 1
                continue
            # ⭐ ONE FILE PER TIER. ank.js picks which to spawn, and he despawns and
            # returns constantly anyway - so staging the price costs nothing at runtime
            # and needs no way to mutate a live merchant.
            for i2, tier in enumerate(tiers):
                path = os.path.join(d, "%s_t%d.npc.snbt" % (key, i2))
                io.open(path, "w", encoding="utf-8").write(
                    snbt(preset(key, spec, trades_for(tier))) + chr(10))
                n += 1

    print("wrote %d preset file(s) for %d NPC(s)" % (n, len(NPCS)))
    if DIALOG:
        print("  dialogue: %d screen(s) from Ethan's document" % len(DIALOG["DialogDataSet"]))
    else:
        print("  !! NO DIALOGUE - run `python tools/ank_dialogue_import.py --write` first")
    for d in PRESET_DIRS:
        print("  " + os.path.relpath(d, ROOT))
    print("\n⚠️  Two paths on purpose - only the game can say which one a "
          "third-party\n   datapack is read from. `/easy_npc preset import_new`'s suggestion list settles it; "
          "delete the loser.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
