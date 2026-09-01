# Sharing — getting three friends onto the server

Two separate problems: they need **the pack**, and they need **a route to your
machine**. Neither solves the other.

---

## 1. The pack — packwiz

Send them this link — **this one, and no other:**

```
https://raw.githubusercontent.com/EHtut/MCServer/main/pack/pack.toml
```

> ### 🚨 The old `feat/server-buildout` link is DEAD. Do not send it.
>
> It still resolves, which is what makes it dangerous — it does not error, it
> quietly installs a different game. Measured 2026-08-15:
>
> | | `feat/server-buildout` | `main` |
> |---|---|---|
> | mods | **408** | **271** |
> | behind | **192 commits** | current |
>
> Anyone who installed from it has a months-old pack and will be **refused by the
> server on a mod mismatch** — and the error blames a mod rather than the link, so
> it reads as a broken mod rather than a stale install.
>
> **If a player is having connection trouble, check which link they used first.**
> The fix is to re-run the installer against the `main` link above; packwiz
> reconciles to the manifest, removing what was cut as well as adding what is new.

**The link never changes and never needs updating.** It points at the manifest, so
every push to `main` propagates automatically — players just re-run the installer.
There is no separate client build to publish and no zip to re-send.

### Why a link and not a 1.5 GB zip

The pack manifest is ~50 KB. It pins every mod to an exact file and sha512, and
each player's installer downloads them **from Modrinth directly**. That means:

- No redistribution of other people's mods.
- Updates propagate — change the pack, they re-run the installer, done. No
  re-sending 1.5 GB every time a mod moves.
- Everyone provably has the same files, because the hashes are pinned. A mod
  mismatch on a both-sides mod is an instant connection refusal whose error
  blames the mod rather than the mismatch.

### What each friend does

1. Install **Prism Launcher** (free) and create an instance:
   Minecraft **1.21.1**, then Edit → Version → Install **NeoForge 21.1.247**.
2. Download `packwiz-installer-bootstrap.jar` from
   <https://github.com/packwiz/packwiz-installer-bootstrap/releases>
   and put it in the instance's `.minecraft` folder.
3. In Prism: Edit Instance → Settings → **Custom commands** → Pre-launch command:
   ```
   "$INST_JAVA" -jar packwiz-installer-bootstrap.jar <THE LINK ABOVE>
   ```
4. Allocate **8 GB** in Edit Instance → Settings → Memory. Not more — Minecraft
   clients gain nothing above it and GC pauses get *longer*.
5. Launch. It downloads the pack once, then only changed files on later runs.

**Current pack, as of 2026-08-15** (after the eight-stage audit closed):

| | |
|---|---|
| mods | **271** — 219 both-sides, 52 client-only |
| plus | 2 shaderpacks, 3 resourcepacks |
| download | **1,028 MB** |

*Was 290 mods / ~1,300 MB before the audit. A player who last installed before
2026-08-15 will have mods that are no longer in the pack — re-running the installer
removes them, which is exactly why the link is a manifest and not a zip.*

Shader packs are not mods and are not installed by packwiz. See
`docs/08-CLIENT-PACK.md` — Complementary Unbound is the recommendation, and
Euphoria Patches (already in the pack) is what gives it Distant Horizons support.

### The zip alternative

If someone cannot make packwiz work:

```powershell
.\server\scripts\build-client.ps1 -Zip
```

produces `C:\MCServer\clientpack.zip`. They drop `mods`, `config` and
`shaderpacks` into their instance. Simple, but every pack change is a fresh
1.5 GB send.

---

## 2. The route — playit.gg

### Before anything is exposed: close RCON

RCON is currently listening on **0.0.0.0:25575**. It is plaintext, authenticates
with a single shared password, and grants **complete server control**. Minecraft
offers no way to bind it to localhost in `server.properties`, so the firewall has
to do it.

Run this in an **Administrator** PowerShell before exposing anything:

```powershell
New-NetFirewallRule -DisplayName "Block external RCON 25575" `
  -Direction Inbound -Protocol TCP -LocalPort 25575 `
  -RemoteAddress Internet -Action Block
```

Local tools (`tools/rcon.py`) keep working — they connect from 127.0.0.1.

### Two tunnels, not one

This is the step people miss. Minecraft and voice chat use **different ports and
different protocols**:

| Tunnel | Protocol | Local port | Carries |
|---|---|---|---|
| 1 | **TCP** | 25565 | the game |
| 2 | **UDP** | 24454 | Simple Voice Chat |

Forward only the first and you get a working server where **nobody can hear
anyone** — and the failure looks like a broken mod rather than a missing tunnel.

In playit.gg, create both: a *Minecraft Java* tunnel to `127.0.0.1:25565`, and a
second **UDP** tunnel to `127.0.0.1:24454`.

Give friends the TCP tunnel's address as the server address. For voice, they
open Simple Voice Chat's settings and set the server address/port to the UDP
tunnel's — unless playit gives you a matching port, in which case it is
automatic.

### Never tunnel 25575

Whatever else you expose, RCON stays local.

---

## 3. Whitelist

The server runs with `white-list=true` and `enforce-whitelist=true`, so nobody
joins until they are added — including you.

With the server running, from the console or over RCON:

```
whitelist add <username>
op <username>          # only for yourself
whitelist reload
```

Minecraft resolves the real UUID itself, so there is no need to look one up by
hand. Confirm with `whitelist list`.

`enforce-whitelist=true` means removing someone also **kicks them immediately**,
which is the half people forget.
