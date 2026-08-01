"""Minimal RCON client - the dungeon master's front door, and the safe way to stop.

Two jobs:

  1. Operationally, this is how you talk to a server running headless (a
     background process, a service, a systemd unit) without a console. It is
     also the ONLY safe way to stop such a server: killing the process skips the
     world save, and on a 344-mod world that is how you lose a chunk.

  2. Architecturally, it is a working demonstration of the seam described in
     docs/03-AI-DM-SEAM.md. Everything a future dungeon master needs to observe
     and act on the world goes through this protocol, and it needs no mod.

The password is read from the instance's server.properties, which is generated
per-instance and never committed.

  python tools/rcon.py --instance C:/MCServer/instance "list"
  python tools/rcon.py --instance C:/MCServer/instance "forge tps" "spark tps"
  python tools/rcon.py --instance C:/MCServer/instance --stop

SECURITY: RCON is plaintext and authenticates with one shared secret. Minecraft
binds it to every interface and offers no way to restrict that in
server.properties - so on the dedicated box it MUST be firewalled to localhost.
"""

from __future__ import annotations

import argparse
import pathlib
import select
import socket
import struct
import sys

SERVERDATA_AUTH = 3
SERVERDATA_EXECCOMMAND = 2


class RconError(Exception):
    pass


class Rcon:
    def __init__(self, host: str, port: int, password: str, timeout: float = 15.0):
        self.sock = socket.create_connection((host, port), timeout=timeout)
        self.sock.settimeout(timeout)
        self._id = 0
        self._auth(password)

    def _send(self, kind: int, body: str) -> int:
        self._id += 1
        payload = struct.pack("<ii", self._id, kind) + body.encode("utf8") + b"\x00\x00"
        self.sock.sendall(struct.pack("<i", len(payload)) + payload)
        return self._id

    def _recv(self) -> tuple[int, int, str]:
        raw = self._read_exact(4)
        (length,) = struct.unpack("<i", raw)
        data = self._read_exact(length)
        req_id, kind = struct.unpack("<ii", data[:8])
        return req_id, kind, data[8:-2].decode("utf8", "replace")

    def _read_exact(self, n: int) -> bytes:
        buf = b""
        while len(buf) < n:
            chunk = self.sock.recv(n - len(buf))
            if not chunk:
                raise RconError("connection closed by server")
            buf += chunk
        return buf

    def _auth(self, password: str) -> None:
        sent = self._send(SERVERDATA_AUTH, password)
        req_id, _, _ = self._recv()
        # A failed auth is signalled by request id -1, not by an error.
        if req_id == -1:
            raise RconError("RCON authentication failed - wrong password")
        if req_id != sent:
            # Some servers send an empty SERVERDATA_RESPONSE_VALUE first.
            req_id, _, _ = self._recv()
            if req_id == -1:
                raise RconError("RCON authentication failed - wrong password")

    def command(self, cmd: str) -> str:
        self._send(SERVERDATA_EXECCOMMAND, cmd)
        _, _, body = self._recv()
        # Multi-packet responses: drain anything already waiting.
        while select.select([self.sock], [], [], 0.4)[0]:
            try:
                _, _, more = self._recv()
                body += more
            except Exception:
                break
        return body

    def close(self) -> None:
        try:
            self.sock.close()
        except Exception:
            pass


def read_props(instance: pathlib.Path) -> tuple[str, int]:
    props = instance / "server.properties"
    if not props.exists():
        raise SystemExit(f"no server.properties at {props}")
    pw, port = "", 25575
    for line in props.read_text(encoding="utf-8").splitlines():
        if line.startswith("rcon.password="):
            pw = line.split("=", 1)[1].strip()
        elif line.startswith("rcon.port="):
            try:
                port = int(line.split("=", 1)[1].strip())
            except ValueError:
                pass
    if not pw or pw == "CHANGE_ME_AT_SETUP":
        raise SystemExit("RCON password not set in the instance - re-run setup-server")
    return pw, port


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--instance", default="C:/MCServer/instance")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--stop", action="store_true",
                    help="save-all flush, then stop - the only safe shutdown")
    ap.add_argument("commands", nargs="*")
    args = ap.parse_args()

    pw, port = read_props(pathlib.Path(args.instance))
    try:
        r = Rcon(args.host, port, pw)
    except (OSError, RconError) as e:
        print(f"cannot reach RCON at {args.host}:{port} - {e}", file=sys.stderr)
        return 1

    try:
        cmds = list(args.commands)
        if args.stop:
            # Flush before stopping. `stop` does save, but flushing first means a
            # hung shutdown still leaves a consistent world on disk.
            cmds += ["save-all flush", "stop"]
        for c in cmds:
            print(f"> {c}")
            out = r.command(c).strip()
            if out:
                print(out)
    finally:
        r.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
