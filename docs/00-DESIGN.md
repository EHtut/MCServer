# Design

What this server is, why it is built the way it is, and which decisions are
settled versus still open.

---

## 1. What we are building

A private, whitelisted, four-player Minecraft server built around three themes
that are meant to *interlock* rather than sit side by side:

| Pillar | Anchor | Owner |
|---|---|---|
| **Industry** | Create + 44 addons | Ethan |
| **Magic** | Ars Nouveau + its addon family | Ethan |
| **Combat / guns / horror** | Superb Warfare, Vic's Point Blank, TaCZ, Cataclysm, a deep stalker roster | Ethan's brother |

Underneath sits a fourth, unglamorous layer that is doing most of the work:
quality of life, worldgen, performance, and server operation. At 400 mods that
layer is not optional. It is the difference between a pack that is exciting for
one evening and one that is still playable in month three.

### The seams matter more than the pillars

Anyone can install Create and Ars Nouveau in the same pack. What makes this one
coherent is the set of mods that only make sense *because* both are present:

- **Ars Creo** and **Create: Ars Nouveau** — spells that drive machines, machines that fuel spells.
- **Create: Enchantment Industry** — automatable enchanting; the bridge from the industry pillar into the magic one.
- **Create: Gunsmithing** — firearms built out of Create machinery, which ties the brother's pillar to the other two instead of bolting it on.
- **Create: Big Cannons** — siege artillery that is a Create build, not a weapon item.
- **Ars Artillery** — the magic pillar's answer to the gun pillar.
- **Create: Central Kitchen** + **Slice & Dice** — food becomes an automation target instead of a chore.
- **Numismatics** — Create-styled currency, and the groundwork for an economy the four of you can actually run.

If a future decision forces a mod to be cut, cut a mob roster before you cut one
of these. The rosters are content; the seams are the design.

---

## 2. Version and loader: 1.21.1 NeoForge

**Chosen by Ethan.** I flagged a concern that 1.21.1 would be thin for guns and
horror specifically, and that concern was partly right and mostly wrong — worth
recording accurately, because it shapes what to expect.

**What the concern got right.** The single most-wanted gun mod, Timeless and
Classics Zero, is 1.20.1 Forge only; we ship a community NeoForge port instead.
Scape and Run: Parasites never left 1.12.2 and has no successor. Botania,
Eidolon and a handful of others simply are not there. The full accounting is in
[`04-GAP-REPORT.md`](04-GAP-REPORT.md).

**What it got wrong.** The live registry has **4,467 mods** published for
1.21.1 NeoForge. Guns turned out to have three independent frameworks plus a
Create-native one. Horror turned out *deeper* than 1.20.1, not shallower —
voice-mimicking mods, configurable ambient-horror systems, and a stalker roster
that did not exist two versions ago. Of 400 curated candidates, **400 resolved**.

**Why the choice holds up.** 1.21.1 is a long-term-support-shaped version: it
has the mod population of a mature release while still receiving new content,
and it will age better than 1.20.1 over the life of this world. Given that the
world is intended to run long enough for an AI dungeon master to learn from it,
that matters more than a handful of missing mods.

---

## 3. How the pack is built

**The repo is a recipe, not a server.** It contains a manifest, configs,
scripts and docs. It does not contain jars, worlds or logs. A working server is
*generated* from it.

```
tools/modlist.json      hand-curated: slug, why, tier      <- the only file you edit
      resolve.py        -> exact version + file + sha512 per mod
      gen_pack.py       -> pack/pack.toml, index.toml, mods/*.pw.toml
      install_mods.py   -> downloads + verifies into an instance
      gen_docs.py       -> docs/01-MODLIST.md, docs/04-GAP-REPORT.md
```

Three properties this buys, all of which matter for a server four people depend on:

1. **Every mod is pinned to a hash.** Not "latest" — an exact file. The pack you
   test is byte-for-byte the pack that runs, and a substituted or corrupt jar is
   a hard failure rather than a mystery crash.
2. **A mod change is a two-line diff.** Reviewable. Revertible. Attributable.
3. **The runtime is disposable.** Delete the instance, re-run setup, get the same
   server back. The only irreplaceable thing on disk is the world — which is
   exactly what the backup script protects.

### Resolution is per-combination, not per-project

The one non-obvious thing in the tooling. Registry search metadata is an
*aggregate*: a project can advertise support for 1.21.1 and advertise support
for NeoForge while having **no 1.21.1 NeoForge build at all**. From The Fog is
exactly this case. Only the version endpoint, queried with both filters at once,
answers the real question — so the resolver pays for that call on every
candidate rather than trusting the cheap answer.

### Dependencies are explicit members

53 mods were being pulled in implicitly as transitive dependencies. They are now
listed in the manifest by name. A dependency appearing or disappearing is a
reviewable diff instead of a surprise at boot. (Fabric API and QSL were
correctly *excluded*: multiloader jars declare them even though no NeoForge
build needs them.)

---

## 4. Budget: where the 400 slots went

| Category | Count | Note |
|---|---:|---|
| create | 45 | the industry pillar |
| magic | 45 | Ars Nouveau + complementary systems |
| horror | 45 | stalkers, atmosphere, escalating pressure |
| qol | 45 | what keeps 400 mods playable |
| world-structures | 38 | one coherent worldgen set |
| core-libs | 37 | APIs, explicitly listed |
| combat-guns | 33 | four frameworks, trimmed from nine candidates |
| building-deco | 22 | deep palette so four bases look different |
| performance | 16 | split client/server |
| food-farm | 12 | an automation sink, not a chore |
| server-admin | 9 | operation + the DM seam |
| auto-deps | 53 | discovered dependencies, now explicit |

Deliberately **absent**: Mekanism, Immersive Engineering, Modern Industrialization.
A second full tech mod would dilute Create rather than extend it, and the pack
already has AE2 for the one thing Create genuinely lacks (digital storage).

---

## 5. Tuning decisions worth knowing

- **`max-tick-time=-1`.** The vanilla watchdog kills the server if a tick takes
  over 60s. On a 400-mod pack, worldgen and large Create contraptions
  legitimately exceed that. The watchdog causes far more crashes here than it
  prevents.
- **`allow-flight=true`.** Jetpacks, elytra, Create's flying contraptions and
  several magic mods all move players in ways vanilla reads as cheating.
  Without this, players are kicked mid-flight.
- **`simulation-distance=8` vs `view-distance=12`.** Simulation distance is what
  actually ticks; view distance is mostly what players see. Keeping simulation
  well below view is the highest-leverage performance dial on a modded server.
- **`difficulty=hard`.** The horror layer is calibrated against it and several
  combat mods scale threat off it.
- **8 GB heap now, 12 GB on the dedicated box.** Set in
  `server/config/user_jvm_args.txt`, which explains the reasoning inline. Not
  higher than 12 GB: past roughly 12–16 GB, G1 pause times get *worse*.
- **Stalker staggering is required, not optional.** The horror pillar ships
  ~10 entities that hunt the player. Five of them active at once is comedy, not
  horror. First-boot config work should stagger their spawn weights and
  cooldowns — and this is precisely the knob a future dungeon master would want
  to hold.

---

## 6. Hosting

**Now:** this workstation (Ryzen 9 9950X, 61.6 GB RAM). Heap capped at 8 GB
because other work runs here.

**Then:** its own box, same CPU class, more RAM. The migration is deliberately
boring — `git clone`, run setup, restore a backup:

```
git clone <repo> && cd repo
./server/scripts/setup-server.sh --accept-eula
# restore the newest archive from backups/ into the instance
./server/scripts/start.sh
```

Nothing in the build assumes Windows, this drive, or this machine. Paths are
parameters; the Linux and Windows script pairs are kept at feature parity.

---

## 7. Open decisions

1. **CurseForge access.** FTB Quests is CurseForge-only and is the natural home
   for DM-authored questlines. Adding it means either installing the packwiz
   binary or supplying a CurseForge API key. Not blocking anything yet.
2. **Pack name.** `Cogs & Cadavers` is a placeholder, set in one place
   (`tools/gen_pack.py`, `PACK_NAME`).
3. **World seed and pre-generation.** Worth choosing a seed deliberately and
   pre-generating with Chunky before first play — exploration lag on a
   400-mod pack is otherwise brutal.
4. **Shaders.** Iris is in the pack; no shader pack is bundled. That is a
   per-player choice and a per-machine performance decision.

---

## 8. Explicitly not built

The AI dungeon master. Ethan's own infrastructure, still in development, and
scheduled after the server is operational. Nothing here is designed *for* it,
but nothing here *blocks* it either — see [`03-AI-DM-SEAM.md`](03-AI-DM-SEAM.md)
for the three surfaces already in place and what would be foolish to break.
