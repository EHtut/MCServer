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
datapack is read from — so this writes BOTH, which is cheap, and `/easy_npc preset list`
settles it. ⛔ Delete the loser once it is known; two copies of one character is exactly the
duplicated-state problem this project keeps paying for.

⛔ GENERATED. Never hand-edit the SNBT; edit NPCS below and re-run.
"""
import io
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
        # ── ⭐ THE BRIBE ────────────────────────────────────────────────────
        # Ethan, 2026-09-05: *"ank has ores that are at severely reduced cost to go
        # below... he tries very hard to keep you out without actually stopping you."*
        #
        # 🔑 SO THE TRADES ARE AN ARGUMENT, NOT AN ECONOMY. Every one of these is a
        # terrible deal FOR HIM and he offers it anyway. The player is meant to notice
        # that the prices make no sense - somebody is paying a lot to keep them out of a
        # cave - which is the same information the warnings carry, in a form they can act
        # on. ⛔ Balance it and you delete the beat.
        #
        # ⚠️ THE NUMBERS ARE A FIRST GUESS AND ARE MEANT TO BE. Vanilla runs the other
        # way entirely: a villager BUYS iron and SELLS emeralds. Do not argue about these
        # - watch a playthrough and move them. They are one edit and a re-run.
        #
        # ⚠️ maxUses is deliberately high. A trade that locks out mid-Act-0 turns the
        # bribe into a puzzle about restocking, which is not the point of it.
        "trades": [
            ("minecraft:emerald", 1, "minecraft:iron_ingot", 8),
            ("minecraft:emerald", 1, "minecraft:coal", 24),
            ("minecraft:emerald", 1, "minecraft:copper_ingot", 12),
            ("minecraft:emerald", 2, "minecraft:gold_ingot", 6),
            ("minecraft:emerald", 4, "minecraft:diamond", 1),
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


def preset(key, spec):
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
            "name": spec["name"],
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
            "Offers": {"Recipes": offers(spec.get("trades", []))},
            "ActionData": {"ActionEventSet": {
                "ON_INTERACTION": [{"Type": "OPEN_TRADING_SCREEN"}],
            }},
            "Status": {"finalized": True},
            "VariantType": spec["variant"],
            "id": spec["entity"],
        },
    }


def main():
    if "--print" in sys.argv:
        i = sys.argv.index("--print")
        key = sys.argv[i + 1] if i + 1 < len(sys.argv) else "ank"
        print(snbt(preset(key, NPCS[key])))
        return 0

    os.makedirs(PACK, exist_ok=True)
    io.open(os.path.join(PACK, "pack.mcmeta"), "w", encoding="utf-8").write(
        '{\n "pack": {\n  "pack_format": 48,\n'
        '  "description": "Arkhdottir: the cast. Easy NPC presets."\n }\n}\n')

    n = 0
    for d in PRESET_DIRS:
        os.makedirs(d, exist_ok=True)
        for key, spec in NPCS.items():
            path = os.path.join(d, key + ".npc.snbt")
            io.open(path, "w", encoding="utf-8").write(snbt(preset(key, spec)) + "\n")
            n += 1

    print("wrote %d preset file(s) for %d NPC(s)" % (n, len(NPCS)))
    for d in PRESET_DIRS:
        print("  " + os.path.relpath(d, ROOT))
    print("\n⚠️  Two paths on purpose - only the game can say which one a "
          "third-party\n   datapack is read from. `/easy_npc preset list` settles it; "
          "delete the loser.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
