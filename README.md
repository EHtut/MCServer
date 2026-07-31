# MCServer

A four-player, heavily-modded Minecraft server built around three pillars —
**Create** (industry), **Ars Nouveau** (magic), and a **combat / gunplay / horror**
track — with a quality-of-life and performance layer underneath.

Longer term this server is a research substrate: a custom AI system will act as a
self-aware dungeon master, reading world state and gameplay telemetry to author
questlines. **That is not built here and not scheduled here.** What this repo does
is make sure nothing in the server's construction blocks it — see
[`docs/03-AI-DM-SEAM.md`](docs/03-AI-DM-SEAM.md).

---

## The one thing to understand about this repo

**This repo is the recipe, not the server.**

It contains a manifest of every mod (pinned to an exact file and hash), the
configs, the scripts, and the docs. It does *not* contain jars, worlds, logs, or
player data. A working server is *generated* from this repo into a runtime
directory that lives somewhere else on disk.

That split buys three things:

1. The repo stays small, diffable, and reviewable — a mod change is a two-line diff.
2. The runtime can live outside OneDrive. OneDrive and a live `world/` folder are
   actively hostile to each other; region files rewrite every few seconds and the
   sync client will either thrash or corrupt.
3. Moving to the dedicated box later is a `git clone` plus one script, not a
   40 GB folder copy.

---

## Layout

| Path | What it is |
|---|---|
| `pack/` | The **packwiz** pack — `pack.toml`, `index.toml`, and one `.pw.toml` per mod pinning project + version + hash. Source of truth for what gets installed. |
| `pack/config/` | Config overrides shipped with the pack (mod tuning that must be identical on every client and the server). |
| `server/` | Server-side only: `server.properties`, JVM tuning, install/start/stop/backup scripts, example ops + whitelist. |
| `tools/` | The build tooling — the candidate mod list, the Modrinth/CurseForge resolver, and the pack generator. |
| `docs/` | Design doc, annotated mod list, gap report, ops runbook, AI-DM seam contract. |

## Target

| | |
|---|---|
| Minecraft | **1.21.1** |
| Loader | **NeoForge** |
| Players | 4 (whitelist) |
| Mod budget | up to 400 |
| Runtime home | this workstation during buildout → dedicated box (same class of CPU, more RAM) |

## Status

Buildout in progress. See `docs/` for what is decided and `docs/04-GAP-REPORT.md`
for the honest accounting of what the 1.21.1 NeoForge ecosystem could and could
not supply.
