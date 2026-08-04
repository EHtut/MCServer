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
import json
import re
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
# RAISED 6144 -> 10240 (Ethan, 2026-08-03): "no one can find the memory
# increase". A default nobody changes is the real default, and 6144 was
# starving a 290-mod pack with Distant Horizons - which presents as STUTTER,
# never as an error, so nobody knows to go looking.
#
# 10240 not 12288: NeoForge takes ~2-2.5G of non-heap on top of -Xmx, so 10G
# lands at ~12.5G total and still fits the 16 GB floor with headroom. 12288
# would be ~14.8G of 16G and swap on the weakest machine in the group.
MAX_HEAP = 10240

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

# The in-game guidebook. Patchouli's BookFolderLoader scans <gamedir>/
# patchouli_books/ and loads any subfolder holding a book.json - no resource
# pack, no mod jar. It is a loose game file, so packwiz will never carry it and
# the instance zip is the only route to the other players.
CLIENT_BOOKS = pathlib.Path(__file__).resolve().parent.parent / "client" / "patchouli_books"


# --- minimal NBT writer -----------------------------------------------------
# servers.dat is UNCOMPRESSED NBT. Only three tag types are needed, so a full
# NBT library would be more dependency than the job deserves.

def _str(s: str) -> bytes:
    b = s.encode("utf-8")
    return struct.pack(">H", len(b)) + b


def _tag_string(name: str, value: str) -> bytes:
    return b"\x08" + _str(name) + _str(value)


def iris_properties(src: pathlib.Path) -> bytes:
    """Ship iris.properties with shaders OFF and a shaderPack name that EXISTS.

    The name is read from the resolver's output rather than typed here. Typing it
    has failed twice already: once as "ComplementaryReimagined_r5.8.1 +
    EuphoriaPatches_1.9.3", a folder Euphoria generates locally so no other
    machine has it, and it would go stale again the first time a shader updates.
    Iris silently falls back to no shader when the pack is missing, so the bug
    is invisible - the player just never gets shaders and nothing says why.

    BSL is preferred when present: Ethan's own pick ("i personally use BSL for my
    shaders"). It is PRE-SELECTED but NOT enabled, so turning shaders on is one
    click and lands on the intended pack rather than whatever Iris picks first.
    """
    text = src.read_text(encoding="utf-8")

    pick = None
    cache = pathlib.Path(__file__).resolve().parent / ".cache" / "resolved.json"
    if cache.is_file():
        packs = [r for r in json.loads(cache.read_text(encoding="utf-8"))
                 if r.get("kind") == "shaderpack" and r.get("filename")]
        # Ethan's preference first, otherwise whatever single shader is shipped.
        pick = next((r["filename"] for r in packs if "bsl" in r["slug"].lower()),
                    packs[0]["filename"] if packs else None)

    text = re.sub(r"(?m)^enableShaders=.*$", "enableShaders=false", text)
    if pick:
        text = re.sub(r"(?m)^shaderPack=.*$", f"shaderPack={pick}", text)
    else:
        print("  !! no shaderpack in resolved.json - shaderPack left as-is")
    return text.encode("utf-8")


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
key_key.sneak:key.keyboard.left.control
key_key.sprint:key.keyboard.left.shift
key_iris.keybind.reload:key.keyboard.minus
resourcePacks:["vanilla","fabric"]
incompatibleResourcePacks:[]
"""
# The Epic Fight mode-toggle rebind that used to live here went with F45 -
# Epic Fight is cut, so the line was dead weight (Minecraft drops unknown
# keybinds on write anyway). Better Combat needs no keybind: it has no mode.
#
# THE R KEY IS A WAR ZONE. Twelve things bind to it out of the box, including
# TaCZ's RELOAD - the one you press mid-firefight. Epic Fight's mode toggle was
# one of the twelve, so switching stance and reloading a gun fought each other.
# Moved to Z at Ethan's request.
#
# `switch_mode` is Epic Fight's own id for what the game calls the stance
# toggle - its description is "Switches between combat and mining modes". There
# is no keybind literally named "stance"; this is it.
#
# Iris's reload ALSO defaults to R, which is the other half of the same jam. Its
# keybind id is `iris.keybind.reload`, NOT `key.iris.reload` - the options.txt
# line is therefore `key_iris.keybind.reload`, with no `key.` in the middle.
# Searching for the wrong prefix returns nothing and looks like the keybind does
# not exist. Iris's four ids are reload, shaderPackSelection, toggleShaders and
# wireframe.
# SNEAK ON CTRL, SPRINT ON SHIFT - Ethan's ruling 2026-08-02, and it is what he
# had already rebound by hand on his own machine. Shipping it means nobody else
# has to discover the preference or rebind it after every re-import.
#
# resourcePacks deliberately does NOT list Faithful 32x. Both the shader and the
# texture pack now ship OFF by default (Ethan, same ruling) - they are still
# DELIVERED by packwiz, so enabling either is two clicks in the options screen
# and no download. Off is the right default for a pack baselined to the slowest
# machine in the group, and it keeps the first launch after an import as cheap
# as possible.
#
# When something IS listed here it must name the file packwiz delivers exactly -
# "Faithful 32x - 1.21.1.zip", spaces and all. Minecraft silently drops an entry
# it cannot resolve, so a stale name is invisible: the pack just never applies
# and nothing is logged. The shaderPack key had precisely that bug; it is now
# derived from the resolver at build time instead (see iris_properties below).


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

  1. MEMORY - do this one first if your PC has more than 16 GB.

     Right-click the instance -> Edit -> Settings -> Memory.
     Set BOTH boxes to the same number:

         16 GB of RAM  ->  10240  (the shipped default, leave it)
         32 GB of RAM  ->  10240
         64 GB of RAM  ->  12288

     The default is deliberately low so the game runs on the weakest computer
     in the group. On a big machine it is TOO low, and the symptom is the game
     crashing with an out-of-memory message.

     Do not just set it as high as it will go. A heap far bigger than the game
     needs makes things WORSE, not better.

  2. Make the window bigger. Drag the corner, or press F11 for fullscreen.
     This is the biggest one after memory.

  3. Options -> Video Settings -> Render Distance:      6  ->  10

  4. Options -> Video Settings -> Graphics:           Fast  ->  Fancy

  5. Options -> Video Settings -> Particles:       Minimal  ->  All

  6. Options -> Video Settings -> Smooth Lighting:     OFF  ->  ON

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


Want it to look better?  (shaders + textures are INSTALLED but OFF)
------------------------------------------------------------------
Three packs already arrived with the game. Nothing to download, nothing to
install, nothing to move into a folder. They ship switched OFF because this
instance is tuned for the slowest computer in the group - turn them on only if
your machine has room.

Shaders (expensive - try this on a good graphics card only):
  Options -> Video Settings -> Shader Packs
  BSL is already selected. Just switch shaders on.
  Also there: Complementary Reimagined, which is the lighter of the two and
  the better choice if you use the far-distance terrain rendering.

Textures (cheap - most machines are fine):
  Options -> Resource Packs -> move "Faithful 32x" to the RIGHT -> Done

Animations (moderate cost - try one at a time):
  Same screen. "Fresh Animations" animates every MOB; "Fresh Moves" animates
  the PLAYER. They are independent, so run either or both.
  These are the first things to drop if the game gets choppy in a crowd.

IF THE GAME MISBEHAVES, TURN THE SHADER OFF FIRST. It is by far the most
expensive thing here and nothing breaks without it. Suspect it immediately on:
  - frames dropping through the floor
  - strange stripes, flickering, or blocks rendering wrong
  - menus or text going missing


Controls that are NOT vanilla
-----------------------------
  Sneak  = LEFT CTRL
  Sprint = LEFT SHIFT

That is swapped from Minecraft's default on purpose. Rebind them in
Options -> Controls if you hate it.


(Credit: BSL Shaders by CaptTatsu; Complementary Shaders - Reimagined by
 Complementary Development, https://www.complementary.dev/ ; Faithful 32x by
 the Faithful Team, https://faithfulpack.net/ . All are downloaded from
 Modrinth when the game launches; none are redistributed here.)
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
                rel = cfg.relative_to(CLIENT_CONFIG).as_posix()
                body = (iris_properties(cfg) if rel == "iris.properties"
                        else cfg.read_bytes())
                z.writestr(f".minecraft/config/{rel}", body)
                shipped += 1

        books = 0
        for f in sorted(CLIENT_BOOKS.rglob("*")) if CLIENT_BOOKS.is_dir() else []:
            if f.is_file():
                z.write(f, f".minecraft/patchouli_books/"
                           f"{f.relative_to(CLIENT_BOOKS).as_posix()}")
                books += 1
        if books:
            print(f"  guidebook files shipped: {books}")
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
