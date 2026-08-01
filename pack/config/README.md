# pack/config

Config overrides that ship **with the pack** — meaning they are copied into the
instance by `setup-server.*` and are identical on the server and every client.

This directory is empty until first boot, and that is expected: the ~400 mods
generate their default configs the first time the server runs.

## The workflow

1. Boot the server once. Configs appear in `<instance>/config/`.
2. Tune what needs tuning. The first things that will need it:
   - **The horror layer.** ~10 stalker entities ship enabled. Stagger their
     spawn weights and cooldowns so one or two are active at a time, not all of
     them. This is the difference between frightening and farcical.
   - **`in-control`** — spawn caps per dimension and biome, once you see what
     the mob mods actually do to entity counts.
   - **`l2hostility` / `hostile-mobs-improve-over-time`** — the difficulty curve.
   - **`almostunified`** — which mod wins for each duplicated ore or ingot.
3. Copy the tuned files back **here**, into `pack/config/`, preserving the
   relative path (`config/foo.toml` → `pack/config/foo.toml`).
4. Commit them.

## Why bother

Anything left only in the instance is lost the next time the instance is
rebuilt, and it does not exist at all on the dedicated box. A config in here is
tracked, reviewable, and travels with the repo — which is the whole point of the
recipe/runtime split.

Do **not** copy the entire generated `config/` directory in here. 400 mods'
worth of untouched defaults would bury the handful of files that represent real
decisions, and every mod update would produce a meaningless diff. Track only
what you deliberately changed.
