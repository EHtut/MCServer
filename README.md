# MCServer

A four-player, heavily-modded Minecraft server built around three pillars —
**Create** (industry), **Ars Nouveau** (magic), and a **combat / gunplay /
horror** track — with quality-of-life, worldgen and performance layers
underneath.

**400 mods. Minecraft 1.21.1, NeoForge 21.1.247. Every mod pinned to an exact
file and hash.**

Longer term this server is a research substrate: a custom AI system will act as
a self-aware dungeon master, reading world state and gameplay telemetry to
author questlines. **That is not built here and not scheduled here.** What this
repo does is make sure nothing in the server's construction blocks it — see
[`docs/03-AI-DM-SEAM.md`](docs/03-AI-DM-SEAM.md).

---

## The one thing to understand

**This repo is the recipe, not the server.**

It holds the manifest, configs, scripts and docs. It holds no jars, no world, no
logs. A working server is *generated* from it into a runtime directory that
lives elsewhere on disk:

```
C:\MCServer\
  repo\        <- this repository (small, diffable, in git)
  instance\    <- the generated, running server (never in git)
  backups\     <- generational world archives
  cache\       <- shared download cache
```

That split buys three things:

1. **A mod change is a two-line diff.** Reviewable, revertible, attributable.
2. **The runtime is disposable.** Delete the instance, re-run setup, get the
   same server back. Only the world is irreplaceable — which is what the backup
   script protects.
3. **Migration is boring.** Moving to the dedicated box is `git clone` plus one
   script, not a 40 GB folder copy.

---

## Quick start

```powershell
# 1. Java 21 is required (this box has only Java 8 today)
winget install EclipseAdoptium.Temurin.21.JDK

# 2. Build the instance: NeoForge + configs + ~357 verified server mods (~1.7 GB)
cd C:\MCServer\repo
.\server\scripts\setup-server.ps1 -AcceptEula

# 3. Run it
.\server\scripts\start.ps1
```

Linux (the eventual home):

```bash
./server/scripts/setup-server.sh --instance /srv/mc/instance --accept-eula
./server/scripts/start.sh --instance /srv/mc/instance
```

Full detail, including failure modes, in
[`docs/02-OPS-RUNBOOK.md`](docs/02-OPS-RUNBOOK.md).

---

## Layout

| Path | What it is |
|---|---|
| `tools/modlist.json` | **The only file you hand-edit.** Curated mods: slug, why, tier. |
| `tools/` | Discovery, resolution, pack generation, installer, doc generation. |
| `pack/` | Generated packwiz pack — `pack.toml`, `index.toml`, 400 × `mods/*.pw.toml`. |
| `pack/config/` | Config overrides that must be identical everywhere (tracked). |
| `server/config/` | `server.properties`, JVM args, ops/whitelist examples. |
| `server/scripts/` | setup / start / backup, Windows and Linux at parity. |
| `docs/` | Design, mod list, runbook, gap report, AI-DM seam. |

## Docs

| | |
|---|---|
| [00-DESIGN.md](docs/00-DESIGN.md) | What we're building and why. Version rationale, pillar seams, tuning decisions, open questions. |
| [01-MODLIST.md](docs/01-MODLIST.md) | *Generated.* All 400 mods with version, side, and why each earned a slot. |
| [02-OPS-RUNBOOK.md](docs/02-OPS-RUNBOOK.md) | Setup, backups, changing mods, diagnosing lag, migration. |
| [03-AI-DM-SEAM.md](docs/03-AI-DM-SEAM.md) | The surfaces a future dungeon master would use, and what not to break. |
| [04-GAP-REPORT.md](docs/04-GAP-REPORT.md) | *Generated.* What 1.21.1 NeoForge could not supply, and what was cut to fit 400. |

---

## How the pack is built

```
tools/discover_modrinth.py   sweep the live registry  -> 4,467 real 1.21.1 NeoForge mods
tools/modlist.json           hand-curated from that population
tools/resolve.py             -> exact version + file + sha512 per mod  (400/400 resolve)
tools/trim_to_budget.py      -> documented, reversible cuts to fit 400
tools/gen_pack.py            -> pack/
tools/install_mods.py        -> a verified instance
tools/gen_docs.py            -> docs/01, docs/04
```

The manifest was built from live registry data, not from memory. Resolution
checks the **1.21.1 + NeoForge combination specifically**, because a project can
advertise both while shipping neither together — which is true of more mods than
you would expect.

## Status

Pack complete and fully resolved; server bundle and docs written. Not yet
booted — mods have not been downloaded and no world exists. Next steps are in
[`docs/00-DESIGN.md` §7](docs/00-DESIGN.md).
