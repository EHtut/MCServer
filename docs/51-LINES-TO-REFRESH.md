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

## art — 35 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `deal_offer` | ? | — | [`art_deal.js:43`](../pack/kubejs/server_scripts/art_deal.js) |
| `deal_taken` | ? | — | [`art_deal.js:43`](../pack/kubejs/server_scripts/art_deal.js) |
| `deal_refused` | ? | — | [`art_deal.js:43`](../pack/kubejs/server_scripts/art_deal.js) |
| `trial_scene` | ? | — | [`art_events.js:282`](../pack/kubejs/server_scripts/art_events.js) |
| `guidance` | 9 | — | [`art_voice.js:56`](../pack/kubejs/server_scripts/art_voice.js) |
| `low_silence` | 4 | — | [`art_voice.js:56`](../pack/kubejs/server_scripts/art_voice.js) |
| `high_silence` | 5 | — | [`art_voice.js:56`](../pack/kubejs/server_scripts/art_voice.js) |
| `combat` | 5 | — | [`art_voice.js:57`](../pack/kubejs/server_scripts/art_voice.js) |
| `returned` | 4 | — | [`art_voice.js:57`](../pack/kubejs/server_scripts/art_voice.js) |
| `low_gift` | 5 | — | [`art_voice.js:120`](../pack/kubejs/server_scripts/art_voice.js) |
| `medium_gift` | 5 | — | [`art_voice.js:120`](../pack/kubejs/server_scripts/art_voice.js) |
| `high_gift` | 5 | — | [`art_voice.js:120`](../pack/kubejs/server_scripts/art_voice.js) |
| `harvest_won` | 3 | — | [`art_voice.js:154`](../pack/kubejs/server_scripts/art_voice.js) |
| `harvest_lost` | 3 | — | [`art_voice.js:154`](../pack/kubejs/server_scripts/art_voice.js) |
| `cut_down` | 6 | — | [`art_voice.js:154`](../pack/kubejs/server_scripts/art_voice.js) |
| `contract_offer` | 4 | — | [`art_voice.js:194`](../pack/kubejs/server_scripts/art_voice.js) |
| `demand_blade` | 5 | — | [`art_voice.js:207`](../pack/kubejs/server_scripts/art_voice.js) |
| `demand_wall` | 5 | — | [`art_voice.js:207`](../pack/kubejs/server_scripts/art_voice.js) |
| `demand_salvage` | 4 | — | [`art_voice.js:207`](../pack/kubejs/server_scripts/art_voice.js) |
| `demand_forge` | 4 | — | [`art_voice.js:239`](../pack/kubejs/server_scripts/art_voice.js) |
| `demand_art` | 3 | — | [`art_voice.js:239`](../pack/kubejs/server_scripts/art_voice.js) |
| `loc_above` | 5 | — | [`art_voice.js:263`](../pack/kubejs/server_scripts/art_voice.js) |
| `rare_loc_above` | 4 | — | [`art_voice.js:263`](../pack/kubejs/server_scripts/art_voice.js) |
| `near_blade` | 4 | — | [`art_voice.js:286`](../pack/kubejs/server_scripts/art_voice.js) |
| `near_wall` | 6 | — | [`art_voice.js:286`](../pack/kubejs/server_scripts/art_voice.js) |
| `near_salvage` | 4 | — | [`art_voice.js:286`](../pack/kubejs/server_scripts/art_voice.js) |
| `near_forge` | 5 | — | [`art_voice.js:337`](../pack/kubejs/server_scripts/art_voice.js) |
| `deep_intro` | ? | — | [`deep_speaker.js:399`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `deep_common` | ? | — | [`deep_speaker.js:399`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `deep_abandoned` | ? | — | [`deep_speaker.js:399`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `deep_rare` | ? | — | [`deep_speaker.js:399`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `intro_arrival` | ? | — | [`introductions.js:231`](../pack/kubejs/server_scripts/introductions.js) |
| `intro_demand` | ? | — | [`introductions.js:231`](../pack/kubejs/server_scripts/introductions.js) |
| `intro_accept` | ? | — | [`introductions.js:232`](../pack/kubejs/server_scripts/introductions.js) |
| `intro_refuse` | ? | — | [`introductions.js:232`](../pack/kubejs/server_scripts/introductions.js) |

## blade — 14 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `harden` | 5 | — | [`blade_voice.js:72`](../pack/kubejs/server_scripts/blade_voice.js) |
| `burden` | 4 | — | [`blade_voice.js:82`](../pack/kubejs/server_scripts/blade_voice.js) |
| `wager_offer` | 4 | — | [`blade_voice.js:91`](../pack/kubejs/server_scripts/blade_voice.js) |
| `wager_won` | 4 | — | [`blade_voice.js:100`](../pack/kubejs/server_scripts/blade_voice.js) |
| `wager_declined` | 3 | — | [`blade_voice.js:109`](../pack/kubejs/server_scripts/blade_voice.js) |
| `contract_offer` | 5 | — | [`blade_voice.js:117`](../pack/kubejs/server_scripts/blade_voice.js) |
| `contract_paid` | 3 | — | [`blade_voice.js:128`](../pack/kubejs/server_scripts/blade_voice.js) |
| `argue_accuse` | 3 | — | [`blade_voice.js:329`](../pack/kubejs/server_scripts/blade_voice.js) |
| `argue_answer` | 2 | 1 | [`blade_voice.js:329`](../pack/kubejs/server_scripts/blade_voice.js) |
| `argue_threat` | 3 | — | [`blade_voice.js:330`](../pack/kubejs/server_scripts/blade_voice.js) |
| `argue_refuse` | 2 | 1 | [`blade_voice.js:330`](../pack/kubejs/server_scripts/blade_voice.js) |
| `argue_unanswered` | 3 | — | [`blade_voice.js:331`](../pack/kubejs/server_scripts/blade_voice.js) |
| `warn_wave` | 4 | — | [`blade_voice.js:346`](../pack/kubejs/server_scripts/blade_voice.js) |
| `idling` | 5 | — | [`blade_voice.js:364`](../pack/kubejs/server_scripts/blade_voice.js) |

## death_doctor — 1 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `warn_wave` | 3 | — | [`deep_speaker.js:228`](../pack/kubejs/server_scripts/deep_speaker.js) |

## death_keeper — 1 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `warn_wave` | 3 | — | [`deep_speaker.js:331`](../pack/kubejs/server_scripts/deep_speaker.js) |

## death_matriarch — 1 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `warn_wave` | 3 | — | [`deep_speaker.js:405`](../pack/kubejs/server_scripts/deep_speaker.js) |

## death_speaker — 1 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `warn_wave` | 3 | — | [`deep_speaker.js:117`](../pack/kubejs/server_scripts/deep_speaker.js) |

## forge — 47 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `guidance` | 10 | — | [`forge_voice.js:103`](../pack/kubejs/server_scripts/forge_voice.js) |
| `low_silence` | 3 | — | [`forge_voice.js:122`](../pack/kubejs/server_scripts/forge_voice.js) |
| `medium_silence` | 3 | — | [`forge_voice.js:122`](../pack/kubejs/server_scripts/forge_voice.js) |
| `high_silence` | 3 | — | [`forge_voice.js:122`](../pack/kubejs/server_scripts/forge_voice.js) |
| `combat` | 6 | — | [`forge_voice.js:139`](../pack/kubejs/server_scripts/forge_voice.js) |
| `returned` | 4 | — | [`forge_voice.js:152`](../pack/kubejs/server_scripts/forge_voice.js) |
| `low_gift` | 5 | — | [`forge_voice.js:164`](../pack/kubejs/server_scripts/forge_voice.js) |
| `medium_gift` | 5 | — | [`forge_voice.js:164`](../pack/kubejs/server_scripts/forge_voice.js) |
| `high_gift` | 5 | — | [`forge_voice.js:164`](../pack/kubejs/server_scripts/forge_voice.js) |
| `harvest_won` | 3 | — | [`forge_voice.js:188`](../pack/kubejs/server_scripts/forge_voice.js) |
| `harvest_lost` | 3 | — | [`forge_voice.js:188`](../pack/kubejs/server_scripts/forge_voice.js) |
| `warn_incoming` | 3 | — | [`forge_voice.js:203`](../pack/kubejs/server_scripts/forge_voice.js) |
| `bored` | 5 | — | [`forge_voice.js:213`](../pack/kubejs/server_scripts/forge_voice.js) |
| `warn_wave` | 3 | — | [`forge_voice.js:231`](../pack/kubejs/server_scripts/forge_voice.js) |
| `argue_accuse` | 3 | — | [`forge_voice.js:247`](../pack/kubejs/server_scripts/forge_voice.js) |
| `argue_answer` | 3 | — | [`forge_voice.js:247`](../pack/kubejs/server_scripts/forge_voice.js) |
| `argue_threat` | 3 | — | [`forge_voice.js:247`](../pack/kubejs/server_scripts/forge_voice.js) |
| `argue_refuse` | 3 | — | [`forge_voice.js:248`](../pack/kubejs/server_scripts/forge_voice.js) |
| `argue_unanswered` | 3 | — | [`forge_voice.js:248`](../pack/kubejs/server_scripts/forge_voice.js) |
| `notion` | 4 | — | [`forge_voice.js:284`](../pack/kubejs/server_scripts/forge_voice.js) |
| `notion_aid` | 3 | — | [`forge_voice.js:284`](../pack/kubejs/server_scripts/forge_voice.js) |
| `gift_open` | 3 | — | [`forge_voice.js:285`](../pack/kubejs/server_scripts/forge_voice.js) |
| `gift_taken` | 3 | — | [`forge_voice.js:285`](../pack/kubejs/server_scripts/forge_voice.js) |
| `gift_left` | 3 | — | [`forge_voice.js:285`](../pack/kubejs/server_scripts/forge_voice.js) |
| `lend_ask` | 3 | — | [`forge_voice.js:286`](../pack/kubejs/server_scripts/forge_voice.js) |
| `lend_done` | 3 | — | [`forge_voice.js:286`](../pack/kubejs/server_scripts/forge_voice.js) |
| `lend_no` | 3 | — | [`forge_voice.js:286`](../pack/kubejs/server_scripts/forge_voice.js) |
| `loc_above` | 4 | — | [`forge_voice.js:337`](../pack/kubejs/server_scripts/forge_voice.js) |
| `rare_loc_above` | 2 | — | [`forge_voice.js:337`](../pack/kubejs/server_scripts/forge_voice.js) |
| `loc_below` | 4 | — | [`forge_voice.js:350`](../pack/kubejs/server_scripts/forge_voice.js) |
| `rare_loc_below` | 2 | — | [`forge_voice.js:350`](../pack/kubejs/server_scripts/forge_voice.js) |
| `hold_none` | 5 | — | [`forge_voice.js:368`](../pack/kubejs/server_scripts/forge_voice.js) |
| `rare_hold_none` | 1 | — | [`forge_voice.js:368`](../pack/kubejs/server_scripts/forge_voice.js) |
| `hold_item` | 5 | — | [`forge_voice.js:379`](../pack/kubejs/server_scripts/forge_voice.js) |
| `rare_hold_item` | 2 | — | [`forge_voice.js:379`](../pack/kubejs/server_scripts/forge_voice.js) |
| `hold_weapon` | 5 | — | [`forge_voice.js:393`](../pack/kubejs/server_scripts/forge_voice.js) |
| `rare_hold_weapon` | 1 | — | [`forge_voice.js:393`](../pack/kubejs/server_scripts/forge_voice.js) |
| `hold_food` | 5 | — | [`forge_voice.js:406`](../pack/kubejs/server_scripts/forge_voice.js) |
| `rare_hold_food` | 1 | — | [`forge_voice.js:406`](../pack/kubejs/server_scripts/forge_voice.js) |
| `near_blade` | 5 | — | [`forge_voice.js:420`](../pack/kubejs/server_scripts/forge_voice.js) |
| `near_wall` | 5 | — | [`forge_voice.js:420`](../pack/kubejs/server_scripts/forge_voice.js) |
| `near_salvage` | 3 | — | [`forge_voice.js:420`](../pack/kubejs/server_scripts/forge_voice.js) |
| `near_art` | 5 | — | [`forge_voice.js:420`](../pack/kubejs/server_scripts/forge_voice.js) |
| `intro_arrival` | ? | — | [`introductions.js:129`](../pack/kubejs/server_scripts/introductions.js) |
| `intro_demand` | ? | — | [`introductions.js:129`](../pack/kubejs/server_scripts/introductions.js) |
| `intro_accept` | ? | — | [`introductions.js:130`](../pack/kubejs/server_scripts/introductions.js) |
| `intro_refuse` | ? | — | [`introductions.js:130`](../pack/kubejs/server_scripts/introductions.js) |

## salvage — 22 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `deal_pitch` | ? | — | [`salvage_deals.js:58`](../pack/kubejs/server_scripts/salvage_deals.js) |
| `deal_taken` | ? | — | [`salvage_deals.js:58`](../pack/kubejs/server_scripts/salvage_deals.js) |
| `deal_refused` | ? | — | [`salvage_deals.js:58`](../pack/kubejs/server_scripts/salvage_deals.js) |
| `bounty_offer` | 5 | — | [`salvage_voice.js:89`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `bounty_paid` | 4 | — | [`salvage_voice.js:89`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `sabotage_offer` | 4 | — | [`salvage_voice.js:90`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `favour_offer` | 4 | — | [`salvage_voice.js:90`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `favour_done` | 3 | — | [`salvage_voice.js:91`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `favour_told` | 3 | — | [`salvage_voice.js:91`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_accuse` | 3 | — | [`salvage_voice.js:104`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_answer` | 3 | — | [`salvage_voice.js:104`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_threat` | 3 | — | [`salvage_voice.js:105`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_refuse` | 3 | — | [`salvage_voice.js:105`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `argue_unanswered` | 3 | — | [`salvage_voice.js:106`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `warn_wave` | 4 | — | [`salvage_voice.js:113`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `warn_incoming` | 6 | — | [`salvage_voice.js:149`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `need_gun` | 3 | — | [`salvage_voice.js:247`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `unreadable` | 3 | — | [`salvage_voice.js:253`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `no_stock` | 3 | — | [`salvage_voice.js:259`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `kept_it` | 3 | — | [`salvage_voice.js:265`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `near_art` | 3 | — | [`salvage_voice.js:638`](../pack/kubejs/server_scripts/salvage_voice.js) |
| `near_forge` | 3 | — | [`salvage_voice.js:638`](../pack/kubejs/server_scripts/salvage_voice.js) |

## shadow — 6 pool(s)

| tag | to rewrite | ⭐ yours, keep | file |
|---|---:|---:|---|
| `warn_wave` | 3 | — | [`deep_speaker.js:507`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `intro` | 1 | — | [`deep_speaker.js:513`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `common` | 10 | — | [`deep_speaker.js:524`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `abandoned` | 3 | — | [`deep_speaker.js:555`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `rare` | 4 | — | [`deep_speaker.js:561`](../pack/kubejs/server_scripts/deep_speaker.js) |
| `confession` | 4 | — | [`deep_speaker.js:595`](../pack/kubejs/server_scripts/deep_speaker.js) |

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
| `warn_wave` | 4 | — | [`wall_voice.js:331`](../pack/kubejs/server_scripts/wall_voice.js) |

---

**458 drafted lines across 138 pools.**

Ethan's own writing is NOT listed here — his lines carry no marker, which is
the whole point of the convention. Where a pool is mixed (his first line, drafts
after it) the marker says so in the source.
