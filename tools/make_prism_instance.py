"""Build the one-click Prism instance zip for non-technical players.

The goal is that a friend does exactly this and nothing else:

    install Prism  ->  import this zip  ->  sign in  ->  press Play  ->  click the server

Every step removed from that list is a step that cannot go wrong. So the zip
ships more than the instance definition:

  servers.dat   the server is ALREADY in their multiplayer list. No typing an
                address, no typos, and when the tunnel address changes they get
                the new one by re-importing rather than being told a new string.
  options.txt   render distance 8, because Distant Horizons draws the rest far
                more cheaply. Left to default (12) most people never touch it and
                quietly get worse performance than the pack is capable of.

playit.gg's free tunnels get new addresses whenever they are recreated, which is
why this is a script and not a set of hand-edited files.

  python tools/make_prism_instance.py \
      --game stammer-audit.tun.ply.gg \
      --voice stammer-guinea.tun.ply.gg:48619
"""

from __future__ import annotations

import argparse
import pathlib
import shutil
import struct
import urllib.request
import zipfile

BOOTSTRAP_URL = ("https://github.com/packwiz/packwiz-installer-bootstrap/"
                 "releases/latest/download/packwiz-installer-bootstrap.jar")
PACK_URL = "https://raw.githubusercontent.com/EHtut/MCServer/main/pack/pack.toml"

MC_VERSION = "1.21.1"
NEOFORGE_VERSION = "21.1.247"
INSTANCE_NAME = "Cogs and Cadavers"

# 8192 was the original value and it was NOT enough: 410 mods plus Distant
# Horizons exhausted the heap during terrain load, which presents as a freeze at
# "Loading terrain" and then "Minecraft has run out of memory" - not as anything
# that names memory while it is happening.
#
# 6G, not the 10G shipped before, and NOT the 12G the host machine uses.
#
# The old value reasoned only about heap vs physical RAM and ignored the JVM's
# non-heap footprint, which is large here: Metaspace for 400 mods, JIT code
# cache, GC metadata, Sodium's off-heap chunk buffers, GL driver allocations -
# roughly 2-2.5G on top of whatever -Xmx says. A 10G heap is therefore ~12.5G
# resident, and a 16G machine also running Windows, a browser and Discord then
# pages. The symptom is stutter and hitching, never an out-of-memory dialog, so
# nobody ever traces it back to the heap being too BIG.
MAX_HEAP = 6144

# Xms == Xmx. A heap that resizes does it exactly while the world is loading.
MIN_HEAP = MAX_HEAP

# Sized for a ~6G heap on a modest CPU. Three deliberate omissions:
#   G1HeapRegionSize  - was pinned at 32M. G1 targets ~2048 regions, so 32M
#                       gives a 6G heap only 192 of them and it cannot do sane
#                       incremental mixed collections. Let G1 auto-size.
#   G1ReservePercent  - 20% of a 6G heap held back is 1.2G unavailable.
#   MaxGCPauseMillis  - 50 on a 4-core makes G1 shrink the young gen and collect
#                       constantly. 100 is calmer and is what the host machine
#                       already runs.
JVM_ARGS = ("-XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:+UnlockExperimentalVMOptions "
            "-XX:G1NewSizePercent=20 "
            "-XX:+ParallelRefProcEnabled -XX:+DisableExplicitGC")

# Pixel count is the dominant cost on an integrated GPU, and this is the single
# biggest GPU-side lever available. 1280x720 on a 1080p laptop is ~44% fewer
# pixels. It is also the friendliest thing in the world to undo: drag the window
# corner, or press F11.
WIN_WIDTH, WIN_HEIGHT = 1280, 720

# Client config shipped with the instance, copied into .minecraft/config/.
#
# Distant Horizons' LOD data is held in memory and scales with the SQUARE of the
# render radius, so the difference between 128 and 256 is a factor of four - and
# it is the single largest allocation in the pack. Shipping a known-good value
# stops every friend rediscovering the same out-of-memory crash.
CLIENT_CONFIG = pathlib.Path(__file__).resolve().parent.parent / "client" / "config"


# --- minimal NBT writer -----------------------------------------------------
# servers.dat is UNCOMPRESSED NBT. Only three tag types are needed, so a full
# NBT library would be more dependency than the job deserves.

def _str(s: str) -> bytes:
    b = s.encode("utf-8")
    return struct.pack(">H", len(b)) + b


def _tag_string(name: str, value: str) -> bytes:
    return b"\x08" + _str(name) + _str(value)


def servers_dat(entries: list[tuple[str, str]]) -> bytes:
    """entries: [(display name, address)] -> uncompressed servers.dat bytes."""
    out = b"\x0a" + _str("")                      # root TAG_Compound, no name
    out += b"\x09" + _str("servers")              # TAG_List "servers"
    out += b"\x0a" + struct.pack(">i", len(entries))   # of TAG_Compound
    for name, ip in entries:
        out += _tag_string("ip", ip)
        out += _tag_string("name", name)
        out += b"\x00"                            # TAG_End for this compound
    out += b"\x00"                                # TAG_End for root
    return out


# The shipped video baseline, tuned for the WEAKEST machine in the group.
# Ethan's ruling 2026-08-01: "its not an actual potato but i want to baseline it
# there for max optimization." So these are the defaults everyone gets, and
# INSTALL.txt tells strong machines what to turn UP - not the other way round.
#
# THE BUG THIS FIXES: this block used to list six keys and NOT `particles`.
# Minecraft then filled it in with the vanilla default. ParticleStatus is
# declared ALL(0), DECREASED(1), MINIMAL(2) - verified in the 1.21.1 client jar -
# so the default is ALL, the most expensive setting, in a pack running Create
# (fans, steam, spouts), Ars Nouveau, TaCZ muzzle flash, Subtle Effects, Particle
# Core and Dynamic Trees. Every friend has been playing on maximum particles.
# An omitted key is not a neutral choice; it is whatever vanilla picks.
#
# Same enum trap in graphicsMode: FAST(0), FANCY(1), FABULOUS(2). 0 is the cheap
# one here, which is the opposite of particles. Check the enum, never the number.
OPTIONS = """\
renderDistance:6
simulationDistance:5
maxFps:60
guiScale:0
fullscreen:false
enableVsync:false
particles:2
graphicsMode:0
ao:false
biomeBlendRadius:0
entityDistanceScaling:0.5
entityShadows:false
mipmapLevels:2
menuBackgroundBlurriness:0
glintStrength:0.0
renderClouds:"false"
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--game", required=True, help="game tunnel host, e.g. xxx.tun.ply.gg")
    ap.add_argument("--voice", required=True, help="voice tunnel host:port")
    ap.add_argument("--out", default=r"C:\MCServer\dist")
    args = ap.parse_args()

    repo = pathlib.Path(__file__).resolve().parent.parent
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    cache = out_dir / "packwiz-installer-bootstrap.jar"
    if not cache.exists():
        print("downloading packwiz bootstrap...")
        urllib.request.urlretrieve(BOOTSTRAP_URL, cache)
    print(f"bootstrap: {cache.stat().st_size // 1024} KB")

    instance_cfg = f"""InstanceType=OneSix
name={INSTANCE_NAME}
notes=Mods update automatically every time you press Play. Do not add or remove mods by hand. Server: {args.game}
iconKey=default

OverrideMemory=true
MinMemAlloc={MIN_HEAP}
MaxMemAlloc={MAX_HEAP}

OverrideJavaArgs=true
JvmArgs={JVM_ARGS}

OverrideWindow=true
LaunchMaximized=false
MinecraftWinWidth={WIN_WIDTH}
MinecraftWinHeight={WIN_HEIGHT}

OverrideCommands=true
PreLaunchCommand="$INST_JAVA" -jar packwiz-installer-bootstrap.jar {PACK_URL}

OverrideConsole=false
"""

    mmc_pack = ("""{
    "components": [
        {
            "important": true,
            "uid": "net.minecraft",
            "version": "%s"
        },
        {
            "uid": "net.neoforged",
            "version": "%s"
        }
    ],
    "formatVersion": 1
}
""" % (MC_VERSION, NEOFORGE_VERSION))

    install_txt = f"""HOW TO JOIN - Cogs & Cadavers
=============================

Four steps. You do not need to understand any of it.


STEP 1 - Install Prism Launcher (free)

    https://prismlauncher.org/download/

    Download, run the installer, click through it.


STEP 2 - Import this pack

    Open Prism.
    Click "Add Instance" (top left).
    Choose "Import from zip" on the left.
    Click "Browse" and pick the zip file you downloaded.
    Click OK.

    Do NOT unzip the file first. Prism wants the zip itself.


STEP 3 - Sign in

    Top right of Prism, click your profile / "Manage Accounts".
    Add your Microsoft account (the one you own Minecraft on).

    If Prism asks to download Java, say YES.


STEP 4 - Play

    Double-click "Cogs and Cadavers".

    The FIRST launch downloads about 1.5 GB of mods and looks frozen for
    several minutes. It is not frozen. Leave it alone.

    When Minecraft opens: Multiplayer -> the server is already in the list.
    Just double-click it.


THAT'S IT.
==========


If it says you are not whitelisted
----------------------------------
Send Ethan your exact Minecraft username. He has to add you before you can
join. Capital letters do not matter but spelling does.


Voice chat
----------
Already installed. Press V in game to open its menu and pick your microphone.
Do that before your first session rather than during one.

People near you can hear you. People far away cannot. In caves your voice
echoes - that is intentional.


Things that will make you sad if you ignore them
------------------------------------------------
* Do NOT add or delete mods yourself. The pack re-syncs every launch and will
  undo it. If your mods differ from everyone else's, the server just refuses
  to let you in, and the error message blames a random mod instead of saying
  what is actually wrong.

* Do NOT add or raise things before you have played once. The settings are
  deliberately low - see the next section.


YOUR PC IS BETTER THAN THE DEFAULTS?
------------------------------------
Everything is set low on purpose, so the game runs on the weakest computer in
the group. If yours is comfortable, turn these up - IN THIS ORDER. Change one,
play for five minutes, then change the next.

  1. Make the window bigger. Drag the corner, or press F11 for fullscreen.
     This is the biggest one by far.

  2. Options -> Video Settings -> Render Distance:      6  ->  10

  3. Options -> Video Settings -> Graphics:           Fast  ->  Fancy

  4. Options -> Video Settings -> Particles:       Minimal  ->  All

  5. Options -> Video Settings -> Smooth Lighting:     OFF  ->  ON

If anything gets choppy, put it back. Nothing here can break the game, and
none of it affects anybody else on the server.

There is also a mod called Distant Horizons that draws far-away terrain. It is
turned OFF because it is the most expensive thing in the pack. If your computer
is strong and you want the view, ask Ethan to turn it on for you.

* THIS PACK NEEDS 16 GB OF MEMORY IN YOUR COMPUTER. Not 8.

  That is the one hard requirement. Everything else about a slow computer can
  be fixed in the settings; this cannot.

  With 8 GB you will not get an error message. You will get the game freezing
  for seconds at a time, forever, because Windows is shuffling memory to disk.
  400 mods need about 5 GB for the game plus 2 GB of overhead, and Windows
  itself wants 3-4 GB. It does not fit, and no setting makes it fit.

  If you have 8 GB: a 8 GB memory stick is cheap and it is the only real fix.
  Everything is already set up correctly for 16 GB - you do not need to change
  anything at all.


* IF THE GAME LOOKS RIGHT BUT RUNS BADLY ON A LAPTOP

  Laptops have two graphics chips - a slow one built into the processor and a
  fast one. Minecraft sometimes grabs the slow one.

  To check: right-click the instance -> Folder, open "logs", open "latest.log",
  and search for the line starting "OpenGL Renderer:". If it names Intel UHD,
  Intel Iris, or AMD Radeon Graphics (with no model number), it took the slow
  one.

  To fix: Windows Settings -> System -> Display -> Graphics, add
  "javaw.exe", set it to High performance. Then restart the game.


Want shaders?  (optional, looks great, costs frames)
----------------------------------------------------
1. Download Complementary Unbound:
   https://modrinth.com/shader/complementary-unbound
2. In Prism, right-click the instance -> "Folder".
3. Put the downloaded .zip inside the "shaderpacks" folder.
4. In game: Options -> Video Settings -> Shader Packs -> pick it.

If your frames drop too much, use "MakeUp Ultra Fast" instead, or turn shaders
back off. Nothing breaks either way.
"""

    stage_files = {
        "instance.cfg": instance_cfg,
        "mmc-pack.json": mmc_pack,
        "INSTALL.txt": install_txt,
        ".minecraft/options.txt": OPTIONS,
    }

    zpath = out_dir / "CogsAndCadavers-PrismInstance.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for name, content in stage_files.items():
            z.writestr(name, content)
        z.writestr(".minecraft/servers.dat",
                   servers_dat([("Cogs & Cadavers", args.game)]))
        z.write(cache, ".minecraft/packwiz-installer-bootstrap.jar")

        # Client configs that must not be left at their defaults. packwiz syncs
        # MODS, never CONFIG, so anything here is shipped once at install and is
        # the player's to change afterwards.
        shipped = 0
        for cfg in sorted(CLIENT_CONFIG.rglob("*")) if CLIENT_CONFIG.is_dir() else []:
            if cfg.is_file():
                z.write(cfg, f".minecraft/config/{cfg.relative_to(CLIENT_CONFIG).as_posix()}")
                shipped += 1
        print(f"  client configs shipped: {shipped}")

    # Keep the repo copy of the instance template in sync for review.
    tpl = repo / "client" / "prism-instance"
    tpl.mkdir(parents=True, exist_ok=True)
    (tpl / "instance.cfg").write_text(instance_cfg, encoding="utf-8", newline="\n")
    (tpl / "mmc-pack.json").write_text(mmc_pack, encoding="utf-8", newline="\n")
    (tpl / "INSTALL.txt").write_text(install_txt, encoding="utf-8", newline="\n")

    print(f"\nwrote {zpath}  ({zpath.stat().st_size // 1024} KB)")
    print(f"  game tunnel : {args.game}   (pre-added to their server list)")
    print(f"  voice tunnel: {args.voice}")
    print("\nREMEMBER: the voice tunnel must ALSO be set on the server:")
    print("  <instance>/config/voicechat/voicechat-server.properties")
    print(f"  voice_host={args.voice}")
    print("  ...and the server restarted. Voice fails silently otherwise.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
