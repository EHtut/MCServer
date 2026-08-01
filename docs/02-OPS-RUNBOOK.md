# Ops runbook

Everything you need to stand this up, run it, change it, and fix it when it
breaks. Written to be usable at 2am.

---

## 0. Prerequisites

| Need | Why | Get it |
|---|---|---|
| **Java 21+** | 1.21.1 will not run on anything older. This box currently has only Java 8. | `winget install EclipseAdoptium.Temurin.21.JDK` |
| **Python 3.11+** | The manifest tooling. 3.11 is the floor (`tomllib`). | Already present (3.13). |
| **Git** | Present. | — |
| **~4 GB disk** | 1.7 GB mods + instance + world growth. | 1.3 TB free on C:. |

---

## 1. First-time setup

```powershell
cd C:\MCServer\repo
.\server\scripts\setup-server.ps1 -AcceptEula
```

On the dedicated Linux box:

```bash
./server/scripts/setup-server.sh --instance /srv/mc/instance --accept-eula
```

What it does, in order: verifies Java 21 → reads the pinned NeoForge version
from `pack/pack.toml` → downloads and runs the NeoForge server installer →
writes `server.properties` (generating an RCON password on first run only) and
JVM args → copies ops/whitelist examples → writes `eula.txt` **only if you
passed the flag** → downloads and hash-verifies ~357 server-side mods.

Safe to re-run. It never touches `world/`.

### Then, before anyone joins

1. **Put real UUIDs in the whitelist.** Get them from
   `https://api.mojang.com/users/profiles/minecraft/<username>`, or start the
   server once and use the console:
   ```
   whitelist add <username>
   op <username>
   ```
   The console route is easier and writes the files for you.
2. **Consider pre-generating the world** (see §6). On a 400-mod pack, walking
   into fresh chunks is the single worst source of lag.

---

## 2. Start and stop

```powershell
.\server\scripts\start.ps1
```

**Stop with the `stop` command in the console.** Never close the window, never
kill the process. Both skip the world save, and on a modded server that is how
you lose a chunk.

First boot after any mod change generates ~400 config files and takes several
minutes with long silences. It is not frozen. `logs/latest.log` is the truth.

---

## 3. Backups

```powershell
.\server\scripts\backup.ps1                    # server must be stopped
```

```bash
./server/scripts/backup.sh --live              # no downtime, needs mcrcon
```

Backs up `world*`, `config/`, `kubejs/`, ops, whitelist and `server.properties` —
a world folder without the configs that generated it is half a backup.

Retention is generational: everything from the last 2 days, one per day for 14
days, one per week beyond that. That curve exists because you usually notice
corruption several days late.

**If the server is running**, the script refuses rather than capturing a torn
save. Either stop it, or flush first:

```
save-off
save-all flush
   ... take the backup ...
save-on
```

**Schedule it.** Nightly, via Task Scheduler or cron:

```bash
0 5 * * *  /srv/mc/repo/server/scripts/backup.sh --live >> /var/log/mc-backup.log 2>&1
```

---

## 4. Changing the mod list

Never edit `pack/` by hand — it is generated.

```powershell
# 1. edit the manifest
notepad tools\modlist.json          # add/remove a [slug, why, tier] row

# 2. re-resolve, regenerate, re-document
python tools\resolve.py resolve tools\modlist.json
python tools\report.py summary      # sanity-check the counts
python tools\resolve.py deps        # did the change pull in new dependencies?
python tools\gen_pack.py
python tools\gen_docs.py

# 3. apply to the instance (removes jars no longer in the manifest)
python tools\install_mods.py --side server --dest C:\MCServer\instance\mods --prune

# 4. commit the diff
git add -A && git commit -m "mods: add X, drop Y"
```

`resolve.py deps` matters. Adding one mod often adds three libraries, and you
want them listed in the manifest deliberately rather than appearing by accident.

**Every client must get the same change.** A mod mismatch on a `both`-side mod
is an instant connection refusal.

### Updating everything to newer versions

Re-running `resolve.py` always picks the newest stable build. That is an
intentional, reviewable action — the diff shows exactly which versions moved.
Do it deliberately, not casually, and take a backup first.

---

## 5. Giving the pack to the other three players

```powershell
python tools\install_mods.py --side client --dest <their-mods-folder>
```

They need NeoForge 21.1.247 for 1.21.1 (same version as `pack/pack.toml`) and
372 client-side mods. The cleanest route is a Prism Launcher instance:
install NeoForge 21.1.247, then drop the mods folder in.

**Client RAM:** allocate 6–8 GB. A 372-mod client will not run comfortably on 4.

---

## 6. Pre-generating the world

Chunky is in the pack. In the console:

```
chunky radius 3000
chunky start
```

Do this once, before real play, with nobody online. It takes a while and pegs
the CPU — which is exactly the point, because otherwise that cost is paid in
stutters while people are exploring. `chunky pause` / `chunky continue` work if
you need the machine back.

---

## 7. When something is wrong

### The server will not start

| Symptom | Cause | Fix |
|---|---|---|
| `UnsupportedClassVersionError` | Java 8, not 21 | Install JDK 21, set `JAVA_HOME` |
| "You need to agree to the EULA" | `eula.txt` missing | Re-run setup with `-AcceptEula` |
| Crash naming one mod | Bad or mismatched jar | `install_mods.py --prune`; check §8 |
| `OutOfMemoryError` during load | Heap too small | Raise `-Xmx` in `user_jvm_args.txt` |
| Silent exit, no crash report | Almost always a mod conflict | `logs/debug.log`, not `latest.log` |

### Players cannot connect

| Symptom | Cause |
|---|---|
| "Mod rejections" / red X | Client mod list differs from server. Re-run the client install. |
| "You are not whitelisted" | UUID not in `whitelist.json`, or still a placeholder. |
| "Flying is not enabled" | `allow-flight=false`. Should be `true` — check it survived. |
| Timeout on join | Large modded join packet. `packet-fixer` is in the pack for this; confirm it loaded. |

### The server is lagging

1. `spark tps` — is it the server or the client?
2. `spark profiler --timeout 60` — run it *while lagging*, read the report link.
3. Usual suspects, in order: a chunk-loaded Create contraption running flat out;
   too many entities (mob farm, or a horror mod spawning without limits);
   `simulation-distance` too high; worldgen from someone exploring.
4. `in-control` is the right tool for spawn-driven lag — it can cap or veto
   spawns per dimension, biome and light level.

### The horror layer is too much

Expected on first boot, and a feature of having ~10 stalker entities available.
Configs land in `instance/config/` after first run. Stagger spawn weights and
cooldowns so at most one or two are active at a time, then copy the tuned files
back into `pack/config/` so they are tracked and survive a rebuild.

---

## 8. Repairing an instance

The instance is disposable. The world is not.

```powershell
# nuclear option, keeps the world
Rename-Item C:\MCServer\instance\mods mods.broken
.\server\scripts\setup-server.ps1 -AcceptEula
```

If it is worse than that, delete everything in the instance *except* `world*`,
and re-run setup.

---

## 9. Moving to the dedicated box

1. Take a backup and stop the server here.
2. `git clone` the repo on the new box.
3. Install Java 21 and Python 3.11+.
4. `./server/scripts/setup-server.sh --instance /srv/mc/instance --accept-eula`
5. Restore the backup archive into the instance (world + config + ops/whitelist).
6. Raise the heap to 12 GB in `server/config/user_jvm_args.txt`, commit it.
7. Start, verify all four can join, then point DNS or share the new address.
8. Firewall: expose **25565** only. **Never expose 25575 (RCON)** — it is
   plaintext.

---

## 10. Command cheat sheet

| Command | Use |
|---|---|
| `stop` | The only correct way to shut down |
| `save-all flush` | Force a full save |
| `whitelist add/remove <name>` | Manage access |
| `spark tps` / `spark profiler` | Diagnose lag |
| `chunky start` / `chunky pause` | Pre-generation |
| `forge tps` | Per-dimension tick times |
| `kubejs reload` | Reload scripts without restarting |
| `debug start` / `debug stop` | Vanilla profiler |
