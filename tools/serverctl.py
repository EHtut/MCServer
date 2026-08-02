"""serverctl - start, stop and inspect the server without corrupting the world.

WHY THIS EXISTS

On 2026-08-02 a stop-and-restart helper piped the RCON `stop` to nul, then
waited on a HEAP-SIZE predicate to decide the server had exited. The predicate
matched early, a second JVM was launched on the same world directory, and it was
only caught because Ethan happened to look. Two servers sharing one world can
corrupt it.

The rule that prevents it is trivial and absolute:

    COUNT THE JAVA PROCESSES. Zero before starting. One after.

Never infer it from memory use, never infer it from RCON answering (RCON keeps
answering while the OLD server is still shutting down - that is exactly how the
double-start happened), never infer it from a log line.

WHAT RELOADS AND WHAT DOES NOT - measured, not assumed

    /reload            KubeJS server scripts   YES  (script count changes)
                       world datapacks         YES
                       In Control spawn.json   NO   - verified by counting
                                               "Reading rules from spawn.json"
                                               across a reload: it does not move
    /ctrl reload       In Control              YES  but needs a PLAYER context,
                                               so RCON cannot run it
    nothing            Simple Voice Chat       config is read at startup and
                                               VoicechatCommands has no reload;
                                               max_voice_distance needs a restart
    nothing            client configs          they are the player's files

USAGE

    python tools/serverctl.py status
    python tools/serverctl.py stop     [--message "..."] [--grace 15]
    python tools/serverctl.py start
    python tools/serverctl.py restart  [--message "..."]
    python tools/serverctl.py reload            # /reload, and says what it missed
"""

from __future__ import annotations

import argparse
import pathlib
import socket
import subprocess
import sys
import time

INSTANCE = pathlib.Path(r"C:\MCServer\instance")
START_PS1 = pathlib.Path(r"C:\MCServer\repo\server\scripts\start.ps1")
RCON_PY = pathlib.Path(__file__).resolve().parent / "rcon.py"
RCON_HOST, RCON_PORT = "127.0.0.1", 25575


# --------------------------------------------------------------------------

def java_pids() -> list[int]:
    """The ONLY trustworthy answer to 'is a server running'."""
    out = subprocess.run(
        ["powershell.exe", "-NoProfile", "-Command",
         "(Get-Process -Name java -ErrorAction SilentlyContinue).Id -join ','"],
        capture_output=True, text=True).stdout.strip()
    return [int(x) for x in out.split(",") if x.strip().isdigit()]


def rcon(cmd: str) -> str:
    if not RCON_PY.is_file():
        return "(no rcon.py)"
    r = subprocess.run([sys.executable, str(RCON_PY), cmd],
                       capture_output=True, text=True)
    return (r.stdout or r.stderr).strip()


def rcon_open() -> bool:
    try:
        s = socket.create_connection((RCON_HOST, RCON_PORT), timeout=3)
        s.close()
        return True
    except OSError:
        return False


def wait_for(predicate, timeout: int, every: int = 3) -> bool:
    end = time.time() + timeout
    while time.time() < end:
        if predicate():
            return True
        time.sleep(every)
    return predicate()


# --------------------------------------------------------------------------

def cmd_status() -> int:
    pids = java_pids()
    print(f"  java processes : {len(pids)} {pids if pids else ''}")
    if len(pids) > 1:
        print("  !! MORE THAN ONE JVM. If they share a world, stop all but one NOW.")
    print(f"  rcon           : {'open' if rcon_open() else 'closed'}")
    if rcon_open():
        print(f"  players        : {rcon('list').splitlines()[-1] if rcon('list') else '?'}")
    log = INSTANCE / "logs" / "latest.log"
    if log.is_file():
        # errors='replace': the log carries binary bytes, and plain text reads
        # of it silently return nothing (grep calls it a binary file).
        txt = log.read_text(encoding="utf-8", errors="replace")
        done = [l for l in txt.splitlines() if "Done (" in l]
        print(f"  last boot      : {done[-1].split('Done (')[-1].split(')')[0] if done else '(none in current log)'}")
    return 0


def cmd_stop(message: str, grace: int) -> int:
    if not java_pids():
        print("  already stopped")
        return 0
    if rcon_open():
        if message:
            rcon(f"say {message}")
            print(f"  announced, {grace}s grace")
            time.sleep(grace)
        print(f"  save-all flush : {rcon('save-all flush')}")
        time.sleep(2)
        print(f"  stop           : {rcon('stop')}")
    else:
        print("  rcon closed - cannot ask it to stop cleanly")

    ok = wait_for(lambda: not java_pids(), timeout=240)
    n = len(java_pids())
    print(f"  java processes : {n}")
    if not ok:
        print("  !! STILL RUNNING after 4 minutes. NOT safe to start. Investigate.")
        return 1
    print("  stopped cleanly")
    return 0


def cmd_start() -> int:
    pids = java_pids()
    if pids:
        print(f"  REFUSED: {len(pids)} java process(es) already running: {pids}")
        print("  Starting now would put two servers on one world. Stop first.")
        return 1
    print("  0 java processes - starting")
    # DETACH PROPERLY. Without this the child inherits our stdio handles, so
    # whatever called serverctl blocks until the SERVER exits - the tool appears
    # to hang forever even though the server booted in five seconds. Found by
    # the tool's own first real use.
    subprocess.Popen(
        ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
         "-File", str(START_PS1)],
        cwd=str(INSTANCE),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=getattr(subprocess, "DETACHED_PROCESS", 0)
        | getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0),
        close_fds=True)
    if not wait_for(rcon_open, timeout=420, every=5):
        print(f"  TIMEOUT: rcon never opened. java processes = {len(java_pids())}")
        return 1
    time.sleep(3)
    n = len(java_pids())
    print(f"  up. java processes = {n}" + ("  !! expected exactly 1" if n != 1 else ""))
    print(f"  {rcon('list')}")
    return 0


def cmd_reload() -> int:
    if not rcon_open():
        print("  rcon closed - nothing to reload")
        return 1
    log = INSTANCE / "logs" / "latest.log"
    before = 0
    if log.is_file():
        before = log.read_text(encoding="utf-8", errors="replace").count(
            "Reading rules from spawn.json")
    print(f"  {rcon('reload')}")
    time.sleep(4)
    after = before
    if log.is_file():
        after = log.read_text(encoding="utf-8", errors="replace").count(
            "Reading rules from spawn.json")
    print()
    print("  reloaded : KubeJS server scripts, world datapacks, recipes/tags")
    print(f"  NOT reloaded : In Control  (spawn.json reads {before} -> {after}"
          f"{' - unchanged, as expected' if after == before else ''})")
    print("                 run /ctrl reload IN GAME; rcon has no player context")
    print("  NOT reloaded : Simple Voice Chat - startup only, needs a restart")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["status", "stop", "start", "restart", "reload"])
    ap.add_argument("--message", default="Server restarting shortly.")
    ap.add_argument("--grace", type=int, default=15)
    a = ap.parse_args()

    if a.command == "status":
        return cmd_status()
    if a.command == "stop":
        return cmd_stop(a.message, a.grace)
    if a.command == "start":
        return cmd_start()
    if a.command == "reload":
        return cmd_reload()
    if a.command == "restart":
        rc = cmd_stop(a.message, a.grace)
        if rc:
            print("  restart ABORTED - stop did not complete")
            return rc
        return cmd_start()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
