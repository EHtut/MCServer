# 51 — Lines to refresh *(GENERATED — do not edit by hand)*

> Ethan, 2026-08-18: *"make a note of all your generated dialogue for
> refresh from me because (no offense) your dialogue is mostly placeholder,
> for ease of refresh."*

**Every pool below was written by Claude and is awaiting his pass.** They are
scaffolding: they exist so a mechanic could be built, tested and shipped before
the writing landed. All of them should end up replaced.

Regenerate with `python tools/gen_lines.py`.

⚠️ **The source of truth is the code, not this file.** Each entry comes from a
`// [CLAUDE-DRAFT] <god>/<tag>` marker in the source. **Delete the marker when
the lines are yours** and the row disappears on the next run — so this register
cannot outlive the thing it describes, which is how every hand-kept TODO list
in this repo has died before.

---

## art — 24 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `guidance` | 8 | — | [`art_voice.js:56`](../pack/kubejs/server_scripts/art_voice.js) |
| `low_silence` | 4 | — | [`art_voice.js:56`](../pack/kubejs/server_scripts/art_voice.js) |
| `high_silence` | 4 | — | [`art_voice.js:56`](../pack/kubejs/server_scripts/art_voice.js) |
| `combat` | 5 | — | [`art_voice.js:57`](../pack/kubejs/server_scripts/art_voice.js) |
| `returned` | 4 | — | [`art_voice.js:57`](../pack/kubejs/server_scripts/art_voice.js) |
| `low_gift` | 5 | — | [`art_voice.js:98`](../pack/kubejs/server_scripts/art_voice.js) |
| `medium_gift` | 5 | — | [`art_voice.js:98`](../pack/kubejs/server_scripts/art_voice.js) |
| `high_gift` | 5 | — | [`art_voice.js:98`](../pack/kubejs/server_scripts/art_voice.js) |
| `harvest_won` | 3 | — | [`art_voice.js:125`](../pack/kubejs/server_scripts/art_voice.js) |
| `harvest_lost` | 3 | — | [`art_voice.js:125`](../pack/kubejs/server_scripts/art_voice.js) |
| `cut_down` | 5 | — | [`art_voice.js:125`](../pack/kubejs/server_scripts/art_voice.js) |
| `contract_offer` | 4 | — | [`art_voice.js:147`](../pack/kubejs/server_scripts/art_voice.js) |
| `demand_blade` | 4 | — | [`art_voice.js:160`](../pack/kubejs/server_scripts/art_voice.js) |
| `demand_wall` | 4 | — | [`art_voice.js:160`](../pack/kubejs/server_scripts/art_voice.js) |
| `demand_salvage` | 4 | — | [`art_voice.js:160`](../pack/kubejs/server_scripts/art_voice.js) |
| `loc_above` | 5 | — | [`art_voice.js:186`](../pack/kubejs/server_scripts/art_voice.js) |
| `rare_loc_above` | 4 | — | [`art_voice.js:186`](../pack/kubejs/server_scripts/art_voice.js) |
| `near_blade` | 3 | — | [`art_voice.js:209`](../pack/kubejs/server_scripts/art_voice.js) |
| `near_wall` | 3 | — | [`art_voice.js:209`](../pack/kubejs/server_scripts/art_voice.js) |
| `near_salvage` | 3 | — | [`art_voice.js:209`](../pack/kubejs/server_scripts/art_voice.js) |
| `deep_intro` | ? | — | [`deep_speaker.js:315`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `deep_common` | ? | — | [`deep_speaker.js:315`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `deep_abandoned` | ? | — | [`deep_speaker.js:315`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `deep_rare` | ? | — | [`deep_speaker.js:315`](../pack/kubejs/server_scripts/deep_speaker.js) |

## blade — 6 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `argue_accuse` | 3 | — | [`blade_voice.js:269`](../pack/kubejs/server_scripts/blade_voice.js) |
| `argue_answer` | 2 | 1 | [`blade_voice.js:269`](../pack/kubejs/server_scripts/blade_voice.js) |
| `argue_threat` | 3 | — | [`blade_voice.js:270`](../pack/kubejs/server_scripts/blade_voice.js) |
| `argue_refuse` | 2 | 1 | [`blade_voice.js:270`](../pack/kubejs/server_scripts/blade_voice.js) |
| `argue_unanswered` | 3 | — | [`blade_voice.js:271`](../pack/kubejs/server_scripts/blade_voice.js) |
| `warn_wave` | 4 | — | [`blade_voice.js:277`](../pack/kubejs/server_scripts/blade_voice.js) |

## salvage — 13 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `bounty_offer` | 5 | — | [`salvage_voice.js:64`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `bounty_paid` | 4 | — | [`salvage_voice.js:64`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `sabotage_offer` | 4 | — | [`salvage_voice.js:65`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `favour_offer` | 4 | — | [`salvage_voice.js:65`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `favour_done` | 3 | — | [`salvage_voice.js:66`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `favour_told` | 3 | — | [`salvage_voice.js:66`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_accuse` | 3 | — | [`salvage_voice.js:79`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_answer` | 3 | — | [`salvage_voice.js:79`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_threat` | 3 | — | [`salvage_voice.js:80`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_refuse` | 3 | — | [`salvage_voice.js:80`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_unanswered` | 3 | — | [`salvage_voice.js:81`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `warn_wave` | 4 | — | [`salvage_voice.js:88`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `warn_incoming` | 6 | — | [`salvage_voice.js:124`](../pack/kubejs/server_scripts/salvage_voice.js) |

## wall — 10 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `snare_hit` | 6 | — | [`wall_voice.js:111`](../pack/kubejs/server_scripts/wall_voice.js) |
| `dark_hit` | 6 | — | [`wall_voice.js:111`](../pack/kubejs/server_scripts/wall_voice.js) |
| `web_hit` | 6 | — | [`wall_voice.js:112`](../pack/kubejs/server_scripts/wall_voice.js) |
| `swarm_hit` | 6 | — | [`wall_voice.js:112`](../pack/kubejs/server_scripts/wall_voice.js) |
| `argue_accuse` | 3 | 1 | [`wall_voice.js:314`](../pack/kubejs/server_scripts/wall_voice.js) |
| `argue_answer` | 3 | — | [`wall_voice.js:314`](../pack/kubejs/server_scripts/wall_voice.js) |
| `argue_threat` | 2 | 1 | [`wall_voice.js:315`](../pack/kubejs/server_scripts/wall_voice.js) |
| `argue_refuse` | 3 | — | [`wall_voice.js:315`](../pack/kubejs/server_scripts/wall_voice.js) |
| `argue_unanswered` | 3 | — | [`wall_voice.js:316`](../pack/kubejs/server_scripts/wall_voice.js) |
| `warn_wave` | 4 | — | [`wall_voice.js:322`](../pack/kubejs/server_scripts/wall_voice.js) |

---

**192 drafted lines across 53 pools.**

Ethan's own writing is NOT listed here — his lines carry no marker, which is
the whole point of the convention. Where a pool is mixed (his first line, drafts
after it) the marker says so in the source.
