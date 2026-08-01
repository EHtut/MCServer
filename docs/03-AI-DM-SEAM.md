# AI dungeon master — the seam

**Nothing in this document is built, and none of it is scheduled.** The DM is
Ethan's own infrastructure, still in development, and explicitly deferred until
the server is operational.

The purpose of writing it down now is narrow and practical: *make sure the
server we are building today does not quietly foreclose it.* Every item below is
either already in place at zero cost, or a thing that would be expensive to
retrofit and cheap to preserve.

---

## What the eventual system needs

From the stated intent — a self-aware DM that reads gameplay and world state and
authors questlines from what it learns — four capabilities fall out:

1. **Observe.** Read world and player state: who is where, what they have built,
   what they have killed, what they have failed at, what they ignore.
2. **Act.** Change the world: spawn things, place structures, move weather and
   time, speak to players.
3. **Author.** Emit something durable that players experience as a quest, not as
   a console command.
4. **Persist.** Keep its own state across restarts, separate from the world save.

---

## Three surfaces, already present

### 1. RCON — enabled, port 25575

The lowest-friction door. A plaintext TCP protocol that accepts any server
command and returns its output. Needs no mod, survives every pack change, and is
reachable from any language.

- **Observe:** `list`, `data get entity <player>`, `scoreboard players get`,
  `execute ... run data get block` — the entire `/data` and `/execute` surface.
- **Act:** any command an operator could type.
- **Limits:** request/response only. RCON cannot *push* an event to you; the DM
  has to poll or read logs. Fine for a DM that thinks in minutes.

**Security note that matters:** RCON is unencrypted and unauthenticated beyond a
single shared password. It is bound in `server.properties` and must stay
firewalled to localhost. If the DM ever runs off-box, tunnel it — do not expose
the port. The password is generated at setup into the instance and is never
committed.

### 2. KubeJS — in the pack

Server-side JavaScript with real event hooks. This is where the DM's *reflexes*
would live, as opposed to its deliberation.

- Event listeners for block breaks, entity deaths, player joins, item crafts,
  dimension changes — the raw telemetry an observing system wants.
- Custom recipes, items and loot, generated from script rather than hand-authored.
- Server-side only: no client mod, no player install, and it can be reloaded
  with `/kubejs reload` without a restart.

The natural division of labour: **KubeJS watches and reports; the external DM
decides; RCON or a KubeJS-exposed command executes.**

### 3. CC:Tweaked — in the pack

In-world programmable computers with an HTTP and websocket API. The most
*diegetic* option: instead of the DM being a voice from nowhere, it can be a
terminal in the world that players walk up to, that receives instructions, that
can be destroyed.

For a server whose whole premise is a self-aware dungeon master, having it
inhabit an object the players can find is worth more than it costs — which is
nothing, since the mod is already in.

---

## Supporting pieces already in the pack

These went in for gameplay reasons and happen to be useful levers:

| Mod | Why the DM would care |
|---|---|
| **server-side-horror** | Fully configurable ambient horror events, server-side. Fire events without touching clients. |
| **shadow-of-the-soul** | A Fear Level system that already tracks player behaviour — stateful input the DM can read rather than invent. |
| **hostile-mobs-improve-over-time** | A time-based difficulty curve with config the DM can bend. |
| **in-control** | Precise spawn control by dimension, biome, time and light. The cleanest "make this area dangerous" primitive available. |
| **horror-messages** | Scheduled messages into chat. Trivially replaceable by a DM-authored channel. |
| **enhanced-celestials** | Blood moons as scheduled, world-wide events. |
| **numismatics** | A currency, which makes rewards mean something. |
| **cc-tweaked** | See above. |
| **spark** | Profiler. If a DM-driven event tanks the tick rate, this is how you find out it was the DM. |

The quest engine is the known gap: **FTB Quests is CurseForge-only** (see
[`04-GAP-REPORT.md`](04-GAP-REPORT.md)). It is the obvious artefact for an
authored questline, and it can be added later without disturbing anything —
which is the point of recording it now rather than discovering it later.

---

## What would be expensive to retrofit — so don't break it

1. **Keep RCON enabled.** Turning it off later is one line; discovering the DM
   has no way in after the world is 200 hours old is a bad afternoon.
2. **Keep the pack hash-pinned.** A DM that learns from world state needs the
   world to be reproducible. "Latest version" packs quietly change under you.
3. **Keep backups generational.** A DM authoring content *will* eventually do
   something wrong to a live world. The value of a backup from a week ago is
   entirely in having taken it a week ago.
4. **Keep the server-side/client-side split honest.** Everything the DM drives
   should be server-side, so it can change behaviour without asking four people
   to reinstall a modpack.
5. **Do not hand-edit the instance.** Configs live in the repo and are copied
   into the instance by setup. If DM-authored config changes are made in the
   instance, they are lost on the next setup run — so when that day comes, the
   DM should write into `pack/config/` (tracked) or into KubeJS scripts, not
   into the runtime.

---

## Rough shape, when the time comes

```
   world  ──(KubeJS event hooks)──►  telemetry stream  ──►  DM
   world  ──(RCON /data polling)──►  state snapshots   ──►  DM
                                                            │
   world  ◄──(RCON commands)─────────────────────────────── │
   world  ◄──(KubeJS scripted events)────────────────────── │
   world  ◄──(CC:Tweaked in-world terminal)──────────────── ┘
```

The DM's own memory and reasoning stay entirely outside the server. The server's
job is to be observable and actuatable, and it already is.

---

## Status

| | |
|---|---|
| Built | Nothing |
| Scheduled | Nothing |
| Preserved | RCON, KubeJS, CC:Tweaked, hash-pinning, backups, the config path |
| Known gap | A quest engine (FTB Quests, CurseForge-only) |
