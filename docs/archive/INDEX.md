# ARCHIVE INDEX

> ⛔ **Everything in this folder is FICTION UNLESS RE-VERIFIED.** These docs described
> something real once. They are kept, not deleted, because most of them hold something
> that exists nowhere else — a ruling of Ethan's, a measured number, or his own prose.

> 🔑 **This index exists so you can find that without reading 40 files.** The HOLDS column
> is what would be lost if the file were deleted. Grep it before writing anything new:
> the odds are good the argument has already been had.

> ⛔ **Never build from a file here.** Read it for design intent, then verify against code.

Archived 2026-09-05, when the estate went from 75 top-level docs to 34. The triage that
produced this ran five readers over every doc and checked each one's claims against the
tree; `docs/FORMAT.md` records the rules it applied.

---

### `00-DESIGN.md`
**The original pack thesis: a four-player server on three pillars (Create / Ars / guns-horror) at 400 mods**  
*Spent because:* Untouched since 2026-07-31; its premise (four players, 400 mods, three co-equal pillars, "the AI DM is explicitly not built") is contradicted by a single-player story pack at 315 pins whose structure is acts and gods.  
**HOLDS:** Ethan's 1.21.1-over-1.20.1 version ruling with the measured counter-evidence (4,467 mods published for the target, 400/400 candidates resolved, and an honest what-the-concern-got-right list); the seams-over-pillars design law ("if a mod must be cut, cut a mob roster before you cut one of these"); the still-true note that `Cogs & Cadavers` is a placeholder set in one place (`tools/gen_pack.py` PACK_NAME).

### `03-AI-DM-SEAM.md`
**Preserving three surfaces (RCON, KubeJS, CC:Tweaked) so a future AI dungeon master is not foreclosed**  
*Spent because:* Its own status table reads "Built: Nothing / Scheduled: Nothing" and has since July; the DM never arrived and the story is now hand-authored in KubeJS, so the doc guards a door nobody is walking through.  
**HOLDS:** The division of labour that the live code actually followed anyway ("KubeJS watches and reports; the external DM decides; RCON executes") and the RCON security ruling (unencrypted, one shared password, must stay firewalled to localhost, tunnel it if it ever runs off-box); plus the open design question flagged in 76/80 — single-player arguably makes this seam *more* interesting, which is Ethan's call, not rot.

### `06-BURIED-TECH.md`
**Depth as the world's single axis — the four-stratum table and the four pieces meant to implement it**  
*Spent because:* Two of the four named artefacts no longer exist (`pack/kubejs/server_scripts/buried_tech.js` and `pack/datapacks/mcserver_depth` are both absent), and its strata table has been superseded by the named strata in 15-LORE §4 and the undead/wave docs (73, 74).  
**HOLDS:** Ethan's device itself and the reasoning for it — depth as the one axis where safety, difficulty and technology move together; the three things it buys at once (guns become recovered loot with a reason to exist, rare horror lands only against a calm surface, descending becomes a decision); the deliberate y=40 peaceful line rather than y=55 so bases can have cellars without inviting threat; and the "every failure here is silent" verification checklist, which is the only written test plan for depth worldgen.

### `07-THEME-AUDIT.md`
**Audit of 411 mods against seven theme rulings, with findings F1–F11**  
*Spent because:* An audit of a mod list that no longer exists (411 then, 315 now, with the 16-THE-REFORGE cut executed in between), and 80 §doc-audit already records that two of its rationales were proven false and never corrected here.  
**HOLDS:** The R1–R7 rulings are the highest-value lines and are still cited as the pack thesis by 30-THE-THESIS — period (modern content is salvage only), the Create steam-and-early-electricity ceiling, TaCZ as the sole modern weapon, presentation-over-stat-lines, one system per verb, kinetic storage, Ars-plus-four magic depth. Harvest R1–R7 into the live thesis doc before this moves. Also worth keeping: F1's framing that the period rule was "a note in a document" until enforced, and the two correctness-not-budget cuts (epic-fight vs better-combat; rubidium-extra pulling Embeddium against Sodium).

### `10-DEPTH-LOOP.md`
**752-line design and execution plan (D0–D7) for why anyone descends — expeditions, the Nemesis invasion, the Vaults**  
*Spent because:* Its header still says "Nothing here is built yet" while D0 shipped (`nemesis_tally.js`) and D3 is live, and the rest was overtaken entirely: there is no Vault script, and the pressure loop the game actually got is the tide/waves system (50, 74) against one player, not a four-person invasion.  
**HOLDS:** The densest concentration of Ethan's ✅ rulings in this set, and they are load-bearing elsewhere: the deliberate reversal that invasions CAN cost the base (option b on the creeper horde, recorded with the three readings it was chosen from and the warning that it contradicts §2); "descent is an expedition, not a destination"; "death costs the run, it never costs the base"; the depths are sparse and alive through SOUND; and the causal chain that made descending protective rather than acquisitive (creepers breach → you need blast-resistant blocks → reinforced blocks are Vault loot at y-64..-128 → "the reason to go down is now the reason to stay up"). The Vault design (§3c) and the payout ladder (§4b-iii) exist nowhere else.

### `11-OPEN-DECISIONS.md`
**The decision ledger — mostly RESOLVED entries kept with their reasoning, plus a few open items**  
*Spent because:* Self-described as "most of this was answered", it is a history doc, and history belongs in git and in the canon docs that absorbed each ruling; its live-looking entries are now the stalest thing in it.  
**HOLDS:** Ethan verbatim, still canon: "the entities are no longer the actual patrons, they are instead the actors of them" — gods speak, actors arrive, and a bug in a servant is smaller than a bug in a god. Also the world-reset capture ("halfway kinda wanting to reset... but lets finish and get all this working first") with the observation that a reset does I4's job for free and shrinks it to an admin tool; the measured finding that the pack ships a skill engine (`puffish_skills`, 0 data files) plus 254 datapack JSONs of content for it and configures neither; the A1–A6 depth-loop rulings; and the D "settled — do not re-open" table.

### `13-CUT-LIST.md`
**Tiered cut list (Tiers 1–5, ~146 mods) built from the 398-mod triage, ordered to scan top-down and stop at your number**  
*Spent because:* The cut it exists to enable was made — 16-THE-REFORGE executed and the pack is 315 — so it is a spent worksheet whose running totals describe a pack that no longer exists.  
**HOLDS:** The per-mod evidence is the part worth keeping and is not recorded anywhere else: `skills` has no authored skill tree in any jar, `summoningrituals` has zero recipes, `horror-messages` has a 0-key lang file, `chunks-fade-in` ships `mod-enabled = false`, `abandoned-watchtowers` duplicates Explorify at identical 48/24 spacing, `ars-technic` was bought by mistake (`arstechnic` is not `ars_technica`). Also the closing argument — Tiers 1–5 do not reach 200, so getting there means dropping whole categories, "which is the argument for naming the pillars and building up rather than choosing 200 times what to remove."

### `16-THE-REFORGE.md`
**The cut-add-regenerate plan — 13 mods out, a food/fishing layer in, worldgen regen, chunked with verify and rollback**  
*Spent because:* Its header claim "Status: PLAN. Nothing here is executed yet" is false — the cut landed (398 → 315), D1 Tectonic is marked DONE inside the doc itself, and the regen happened; a spent plan that still says PLAN is exactly the trap.  
**HOLDS:** The measured cause in §0, which is real instrumentation and irreplaceable: 172 gun-smith recipes of which zero make a gun, zero sculk in 118 chunks, mineshafts at frequency 0.004, expected guns found after 43 in-game days ≈ 0, and Mystical Agriculture's `inferium_ore`/`prosperity_ore` measured into the top five most common blocks at y0–63. Plus Ethan's §1 rulings table (cut competing dimensions and spend the budget making the Nether genuinely hellish; surface threat is natural predators, fair danger, not undead or casters; structures rare above, plentiful below); the §11 "GATE BOTH SIDES" lesson learned the hard way; §13's gamerules-to-re-apply-after-any-regen list, which is operational and still needed; and §14c's evidence for rejecting FTB Quests in favour of a custom engine.

### `17-PATHS-TO-POWER.md`
**The seven power ladders and the rule that a path gives, denies, and crosses the descent.**  
*Spent because:* Self-declares "Nothing here is built" (2026-08-04), is built entirely on four players and one-walker-per-path exclusivity, and names SecurityCraft/MineColonies content that has since been cut; doc 80 already lists it as wrong-about-audience.  
**HOLDS:** Ethan's 2026-08-04 exclusivity ruling ("selfish design" — with the rebuttal that denials only bite if the body belongs to somebody else), his Create ceiling ruling (steam + early electricity, no oil/diesel/concrete/sci-fi), the twice-corrected Wall-reinforcer finding and its deep-salvage fix, and "a path nobody can see is not a path — signage is worth more than a sixth power source".

### `18-THE-STALKERS.md`
**The stalker that feeds on your XP, the notoriety curve, and the Harvest as the boss fight that ends a run.**  
*Spent because:* `stalker.js` carries "🪦 RETIRED 2026-08-15" and the Harvest-as-ending was cut outright (`62`, `65` — "there is no end"), so the doc's entire spine describes retired code.  
**HOLDS:** Ethan's original spec verbatim (the 0–24 / 25–74 / 75 / 100 bands, "hard enough to fail four or five times", the single line of lore and the forced re-choice), the standing TONE RULING that the patrons' words are Ethan's own writing (which `25` and every later line doc cite back to this file), the ⟡ WAVES capture from Shield Hero that later became `waves.js`, and the measured Blade-recast table auditing all six castings for boss bars and summons.

### `19-STALKER-BUILD.md`
**The C0–C8 chunk plan and verification gates for the stalker build.**  
*Spent because:* It is the build plan for a system that is retired, and its own STATE OF THE BUILD table admits it was frozen at 11:11 on 2026-08-05 with fourteen commits landing after it.  
**HOLDS:** The C0 capability-probe results — hard-won KubeJS facts that are still true tree-wide (`EntityEvents.hurt` does not exist, `event.cancel()` unwinds by throwing, `removeModifier` is unusable, `global` cannot be assigned) — plus the measured numbers (drop rate 13.4% expected vs 13.3% observed, live armour 9.08, chaff health 16.35/15.0/5.3/21.8) and the `persistentData`-survives-death-via-`PlayerEvent.Clone` finding.

### `20-AUDIT-2026-08-11.md`
**A dated two-sweep audit of the KubeJS scripts and the nine datapacks, with findings K1–K14 and B1.**  
*Spent because:* It is a point-in-time audit whose findings were all fixed and verified on the same evening, and `DEFECTS.md` has been the findings ledger since 2026-08-29 — history belongs in git, findings belong in DEFECTS.  
**HOLDS:** Fourteen named defect classes with their root causes that were never given D- ids: K8 (the hunt was 75% hollow because `runCommandSilent` returns 0 for an unknown entity), K9 (a `tickCount` stamp from the future is a silent permanent off-switch), K10 (Rhino redeclarations measured 4,0,4,3,6,21,72 → 0), K12 (Nether coords are Overworld/8, so proximity fired constantly), and B1 (machine-checked proof that the Wall path had no entry point at all).

### `21-THE-SIX-ROLES.md`
**The trinity of three path-pairs, each with a monopoly paid for by a weakness, plus coefficients and subclass rules.**  
*Spent because:* Its own header says "FOLDED INTO 23-THE-PATH-SYSTEM.md (2026-08-11) … read 23 for the current design", and subclasses were CUT 2026-08-15 while Crown was retired 2026-08-14.  
**HOLDS:** Ethan's framing quotes ("we need things to happen to us", "Each fills a role") and §5c's argument for why exclusivity had to die — the conversation trail behind rulings that survive only as conclusions in 23.

### `22-THE-PATRONS.md`
**The six patron voices, their event catalogue, and the three rulings that closed the mod-swap question.**  
*Spent because:* Its own header says "FOLDED INTO 23-THE-PATH-SYSTEM.md", and its central delivery ruling has since been reversed by the move to Immersive Messages overlays (`voice.js CHAT_COPY = false`).  
**HOLDS:** §1.5's three rulings in Ethan's words — "these patrons btw are the stalkers. same beings", the bold-red-chat ruling (now the record of what the overlay pivot traded away), and the Born-in-Chaos no-swap ruling with the recorded reason Goety's ownership model was investigated and rejected so nobody re-derives it.

### `24-PATH-SYSTEM-BUILD.md`
**The E0–E10 chunk plan for the path system, with the probe results that unblocked it.**  
*Spent because:* Every chunk it owns is either built (E0–E3, E6) or superseded, and the live queue moved to `34`, then `68-THE-GAMEPLAN.md` and `76-THE-BACKLOG.md`.  
**HOLDS:** The E0 probe RESULTS table — permanently true KubeJS API facts that exist nowhere else (`runCommandSilent` returns `undefined` for a valid AND an invalid command so it must never be tested, `runCommand` returns the feedback text, `server.overworld()` is a METHOD not a property) — and the four standing build rules, including "deadlines store WORLD DAY, never `tickCount`".

### `25-PATRON-DIALOGUE.md`
**Candidate death-ladder lines for seven beats per patron, plus the ambient sound-anchor layer.**  
*Spent because:* It is explicitly a draft sheet ("CANDIDATES, not canon"), its lines have already been transcribed into `regard.js`, and the ladder's terminal beats are dead — `fall.js` is inert and every god is `mode: 'never'` (`65`).  
**HOLDS:** The lines marked CANON as Ethan's own (Blade's "Fall" and "You reach for heights you will never attain"), and PART II's ruling that ambient lines must be ANCHORED to a trigger rather than drawn from a random pool — a staging finding that outlived the ladder.

### `26-INTRODUCTIONS.md`
**The first-draft introduction scenes, the flagship-item set, and the I0–I4 build plan.**  
*Spent because:* Its own scenes were superseded by `28` ("kept there as the first draft"), I1/I2 are built and I3 is HELD, and its flagship table hands Wall an item from SecurityCraft — a mod that has since been cut.  
**HOLDS:** Ethan's flagship ruling verbatim ("these items should have enchantments, mending durability, and they cannot leave your inventory… when the path is lost, they lose them") and his refinement to restoration-not-prevention ("it returns to your inventory if lost after a day"), his "Take my hand" brief for what an introduction is, and the three findings all six writing agents reached independently — diegetic darkness, staggered pacing, Sonnet-not-Haiku.

### `32-TEST-SUITE.md`
**a manual playtest runbook for the ritual, introductions, paths and Salvage's economy, plus the results of its one run**  
*Spent because:* Written 2026-08-14, run once (results stamped 08-14/15) and untouched since; its T0 gate asserts "Loaded 18/18 KubeJS server scripts" against 77 today, and verification has since moved to tools/run_all.js, live_smoke.py, playtest.py and dialogue_check.js.  
**HOLDS:** The governing rule "'it did nothing' and 'it failed' are different results — a step with no visible effect is a FINDING, not a tick"; the finding that /ritual clear logged `released <player>` for nine call sites while removing nothing (only a human trying to walk caught it); and two items that were never closed here — the E2e XP strip left unexercised, and T3's first-attempt reconnect failure with no exception anywhere in the log, explicitly recorded as an unresolved intermittent rather than a fixed bug.

### `34-THE-REMAINING-BUILD.md`
**the 2026-08-14 master build queue for the path/patron system, plus two held designs (the XP coupling and I3 flagships)**  
*Spent because:* 1,015 lines whose newest state stamp is 2026-08-29; it has been superseded as build order by 68-THE-GAMEPLAN ("STATUS: LIVE — being built from, right now") and as work register by 76-THE-BACKLOG, which explicitly claims those roles.  
**HOLDS:** Two whole designs that exist in no other doc — the XP coupling (`bonus = SCALE × √level`, with the never-subtract invariant that stops the death spiral) and I3 the flagship system (the six verified item forms, the ruling that a lost flagship silently returns one in-game day later because "it comes back the way you come back", and the finding that there is no item called `tacz:12g`). Also Ethan's ruling that Wall stays on Goety with the full Tensura counter-argument that lost (and the involuntary-loss-of-control idea salvaged from Werewolves); the E3 measurements (power ×0.4 exact to the decimal; drops ×3 confirmed but SATURATING, pinning Forge at 100% from notoriety 33 up); and Ethan's legibility ruling that the sight trade pays in visible Strength II + Speed rather than a hidden number.

### `35-WALL-REFRESH.md`
**the redesign of Wall onto MineColonies, and the ruling that Crown merges into her**  
*Spent because:* It carries its own banner saying it is built on two mods that are not in the pack (MineColonies, Theurgy) and that "§§1–5 below are kept as the reasoning trail, not as instructions. Do not build from them" — 43-WALL-THE-SPIDER is named as the truth.  
**HOLDS:** Ethan's crown-merge ruling in his own words ("the spider mother wants you to build a family, a web, like hers") and the complaint that produced the whole doc ("i do not think anyone will ever choose that path because security craft is not a good base... i got it wrong wall is a building/resource path"); his counter to my first pass — "waystones is essentially furniture, camping is untrackable and side content" — which is the argument for why a path needs a tech tree; and the flagged-not-scheduled idea of a first-join introduction to the world establishing the descent, the watching and that you cannot die.

### `36-THE-MOD-TAXONOMY.md`
**the eight-stage modpack audit (A1–A8) and the per-path mod taxonomy**  
*Spent because:* The audit closed 2026-08-15 at "290 → 275 mods"; the pack now carries 315 manifest entries (324 in the generated 01-MODLIST), and mod verdicts have moved to 68-THE-GAMEPLAN §2.  
**HOLDS:** The founding principle, stated nowhere else: "A path is not a theme. A path is a MOD with a progression tree — if a path is not anchored to a mod somebody could spend a month inside, it is not a path, it is a colour." Ethan's A1 refinement that supersedes it — every path can fight, cast, shoot, build and command in its own idiom, so there is no target mod count and a mod is not misfiled just because its category sits elsewhere (create-big-cannons is how Forge shoots). And the audit's one lesson with its evidence: the name is not the mod and the dependency list is not the usage — four ways a cut breaks the server (declared dependency, mixin target, direct class reference, our own files), only the first visible in a manifest.

### `39-THE-ROSTERS.md`
**a generated inventory of every mod in the pack, grouped by path and function**  
*Spent because:* A snapshot regenerated 2026-08-15 at 271 mods from tools/mod_taxonomy.json — which is itself still at 271 and has not been re-run since — while 01-MODLIST.md is the live generated list at 324 mods.  
**HOLDS:** Almost nothing: it is regenerable from tools/classify_mods.py and duplicates 01-MODLIST's job. The only line worth keeping is that the four genuinely orphaned libraries (citadel, cucumber, mmlib, nexuslib) were cut 2026-08-15 and verified by a clean boot rather than by a scan — and that zero dependents is not by itself a defect for standalone performance mods.

### `44-SALVAGE-LINES.md`
**Salvage the Wolf — Ethan's character brief, her permissions chart, and a fill-in sheet for every line she has**  
*Spent because:* The sheet holds 259 blank numbered slots and zero filled ones — it was handed over 2026-08-16 and never came back — and docs/dialogue/salvage.md (709 lines, generated 2026-08-30 by RUNNING salvage_voice.js) is the writing surface now.  
**HOLDS:** Ethan's brief, including the ruling that must survive the doc: "Do not give her a secret identity later... Her emptiness is load-bearing" — the whole pantheon means something different because one of the five is random. Also her thesis ("None of you were chosen. I'm just the only one who says so"), the three-sentence cap that is her whole texture, the "Who she is" canon paragraph (never states the full price, never technically lies, calls you friend twice at most), the observation in §0b that her entire column is the choice half of the taxonomy so she is the only god who cannot do anything TO you, and the §0c warn_incoming draft that was deliberately never written into the script.

### `45-BLADE-LINES.md`
**every line Blade has, as a worksheet for Ethan's writing pass, plus parked pools and open rulings**  
*Spent because:* Its 323 mirrored lines are a 2026-08-16 copy of blade_voice.js and its worksheet half is superseded by docs/dialogue/blade.md (741 lines, generated 2026-08-30 from the running script, which cannot drift the way a hand-generated copy does).  
**HOLDS:** §10 PARKED is the only copy outside git of seven lines deleted from blade_voice.js — I verified near_forge, near_art and near_crown are absent from the file — including "She leads, and I follow. That does not mean I like her hand," which the doc itself flags as the clearest statement anywhere of Blade's relationship to the Matriarch. Also §11's four unresolved rulings: `guidance` contradicts itself (learn one weapon vs "Master every blade", both live in the pool right now), Art has three unexplained epithets in live use, Wall has the same dead pools untouched, and the stage-three inversion where high_silence reads as stage ONE under Ethan's own length rule.

### `46-LIVE-TUNING.md`
**a handoff scratchpad of changes queued between play sessions, and what to watch after each restart**  
*Spent because:* Its header still reads "PENDING RESTART #2 — deployed 2026-08-16, awaiting Ethan's ~1hr restart" three weeks later; the restarts happened, the changes are long live, and the doc's whole purpose was to be consumed by one restart and emptied.  
**HOLDS:** The measured rage arithmetic — blocks placed contributed 266 of 274 against a fury threshold of 90, meaning placing a block was arithmetically indistinguishable from watching her champion die eleven times, and the Spider's sliding scale had never once been reachable in play. The lesson it produced: when a character is redesigned the counter's MEANING changes and every writer to that key must be re-read — "a merge that lives in one file is not a merge." Ethan's day/night ruling in his own words, with the two exemptions argued (icarus would become unsatisfiable at y≥100 AND y<50; broken_rung fires from the respawn hook on the surface). And the standing judgement that if Wall's daytime silence reads as broken rather than as dread, the fix is a daylight event she can spend fury on — not removing the gate.

### `47-THE-RELEASE-SYSTEM.md`
**how each god formally releases a player from their path — the per-god exit conditions**  
*Spent because:* It declares itself "RETIRED 2026-08-24 — NOTHING IN THIS DOC IS LIVE" and points at 65-THERE-IS-NO-END; I confirmed in release.js that all six gods are mode:'never' with the old rules preserved in `_retired` blocks.  
**HOLDS:** Ethan's original spec verbatim — "Wall will never release you, Blade will release you only if you die too many times after he gave you a buff 4x in a row. Salvage will release you if you keep denying her trades. 3x in a row" — and the argument the doc was kept for: that six gods should not share one door, and that regard goes back to being the escalating voice that tells you where you stand rather than the exit. If release conditions ever return, they return to this design. Also the safety default: an unknown god key falls back to regard, so adding a god can never silently make a path unloseable.

### `49-RETALIATION-AND-DEFECTION.md`
**The retaliation family — warning, interception, grudge, argument — plus Wall's defection scene.**  
*Spent because:* A/C/D shipped (warn.js, grudge.js, broadcast.js) and the argue pools are now written in the voice files, so most of it is a record of built code; the unbuilt half (B, defection) has sat on an unanswered §8 ruling since August and its core rendering premise — per-god CHAT COLOUR doing speaker attribution — is dead now that voice.js CHAT_COPY is false and gods render in fonts on the overlay.  
**HOLDS:** Ethan's verbatim Wall↔Blade argument exchange (already harvested into blade_voice.js:373-389, so safe); the two-axis intercept-vs-warn posture table per god; the unbuilt defect_offer / defect_accepted / defect_rejected scene prose (zero hits in code); §8's four open rulings, chiefly what "Wall attempts to stop them" actually does.

### `50-THE-TIDE.md`
**The tide/wave loop in the deep, and god bickering.**  
*Spent because:* Title says NOT BUILT but tide.js, waves.js, bicker.js and bicker_scenes.js all ship, 68-THE-GAMEPLAN marks D1–D6 done, tuning has moved to 71 and 74, and §1's blocker is diagnosed and fixed in 64-THE-DEPTH.  
**HOLDS:** Ethan's verbatim Darktide/Vermintide brief and the Bickering request; the "a wave is an ARRIVAL, not a drop" ruling and the 2026-08-18 cadence/herald ruling (both already copied into tide.js's header); the Lootr [refresh] values applied 2026-08-24 to instance/config/lootr-common.toml with the 6000-tick reasoning, which I found recorded nowhere else.

### `52-EARNING-THE-PATH.md`
**Making paths earned (NOTICED → TESTED → CHAMPION), bringing Forge/Art/Undeath online, and villagers as player models.**  
*Spent because:* The only doc in this batch with zero inbound references; the trial idea was superseded wholesale by 63-THE-TRIAL and 67-BEING-CHOSEN, and both gods it wanted opened have been open since 2026-08-22/23.  
**HOLDS:** Ethan's verbatim "Why are these random players just now champions? They need to earn them" and his villagers-as-player-models request with the argument that it makes killing one stop being free; the constraint that the first trial per god must be soloable or the path is unreachable on a two-person server; the unanswered Undeath question.

### `55-MATRIARCH-EVERY-LINE.md`
**Draft 2 of every line Kayer has, laid out for Ethan to edit in place.**  
*Spent because:* Superseded by docs/dialogue/art.md, which is generated by running art_voice.js so every line in it is one the game actually registers; this hand-maintained draft is the second copy that drifts.  
**HOLDS:** The ruling "cut all of them and rewrite, kayer does not give secrets" and its inversion — her rare pools are where she catches you fishing and shuts it down, so her devotion to Alice can never be learned from her (a real constraint on future writing, and already carried in art_voice.js's header); the open finding that cut_down has no warning pool and high_gift 2 and 5 are load-bearing by accident.

### `62-THE-HARVEST-IS-CUT.md`
**cutting the per-player Harvest ending after the act-based-story ruling**  
*Spent because:* The cut shipped and harvest.js was repurposed as the Trial within the hour (63), so the doc's whole premise is spent — its own banner already admits it described a live file as inert.  
**HOLDS:** Ethan's ruling verbatim ('there is no reason for an ending anymore since it's essentially an act-based story'); the MEASURED phase-coefficient defect — bands multiply before banding, so Blade fires at raw n=50 and Art at n=34 against a threshold displayed as 100 — which is explicitly flagged as outliving the cut and is NOT in DEFECTS.md; the 20-file/~300-reference blast radius; the table showing only 3 of 5 gods ever had a handler.

### `64-THE-DEPTH.md`
**diagnosing 64 blocks of void under bedrock and staging a Tectonic min_y fix**  
*Spent because:* Superseded twice — 69's addendum proved the diagnosis wrong, and min_y was ruled back to −64 and shipped, with pack/datapacks/mcserver_depth deleted outright.  
**HOLDS:** The rcon method note (`execute if block` returns a real result; the `run say` form matches its own echo and reports every block as air); the lesson that worldgen is baked into level.dat so a config change cannot fix an existing world even for ungenerated chunks; the tectonic.json.bak-2026-08-24 pointer.

### `65-THERE-IS-NO-END.md`
**the ruling that retired every ending — all six gods on mode 'never'**  
*Spent because:* Shipped and confirmed in release.js (six 'never' entries, each carrying its _retired block); nothing remains to build from it.  
**HOLDS:** Ethan's shortest ruling verbatim ('this is story now, not just a game. there is no end'); the _retired-config convention plus release_harness re-arming it so retired code cannot rot into something unrestorable; the six-lying-banners table; art/cut_down's lines kept as retired-by-design with completeness.py warning if that pool is ever spoken again.

### `66-ONE-DIMENSION-TEST.md`
**measured test of One Dimension + Tectonic stacking, plus the tectonic-layers alternative**  
*Spent because:* A test report whose verdict was taken and acted on — both candidates were cut and 68 §0.1 closed the dimension question by keeping the Nether and End.  
**HOLDS:** The silent-failure trap: with the wrong level-type One Dimension does nothing at all, no crash and no log line, and a vanilla world looks identical until you probe for netherrack; the measured band diagram (−320..1279); the two crash causes (ModernFix × codec, Biolith NPE in fillBiomesFromNoise) that decided it.

### `68-THE-GAMEPLAN.md`
**the build order for retiring the world and everything gated on the one-shot regen**  
*Spent because:* The deadline it was built around has passed — the reset shipped and A/B/D/E/F/G are all marked done inside it — and at 1046 lines it is now a build log that knows nothing of Act 0, which is the actual current work.  
**HOLDS:** The before-the-reset / any-time bucket rule, which it calls its own most useful line; the 17 resolved-but-uninstalled mods with the four traps that would have bitten; the R1/R2 refining pass (Blade's Trials onto the tide spawner, mobs get a faction), still unbuilt; the Iron's Gems 'n Jewelry drop rationale and its recovery cost.

### `69-YOU-DO-NOT-BELONG-HERE.md`
**the ambient Nether/End lines and the rule that they come from nobody**  
*Spent because:* F1 shipped as trespass.js the same day, and the two addenda close the depth question rather than opening work.  
**HOLDS:** Ethan's EIGHT LINES VERBATIM (four Nether, four End) — his writing, and the highest-value thing in the doc; the standing rule that these must never be attributed to a god or the Nether becomes another place a god can reach you; and the addendum that REFUTED 64's depth diagnosis with a measured per-slice profile.

### `70-THE-NIGHT.md`
**moving the danger from the depths to the night, and the Speaker silencing the gods**  
*Spent because:* D1–D6 all shipped and are live (night.js, tide.js, waves.js); what is left is one open question, not a build plan.  
**HOLDS:** Ethan's constraint 'There is a lore reason that they don't know about. You don't know either' with the explicit DO NOT INVENT ONE; the per-god silenced/speaks table; the deliberate no-inversion cost (Wall and Forge start at max trust so their champions get the hardest nights immediately); and the OPEN problem that the night danger cannot reach a player indoors, which gates D3's value, appears in no other doc, and is not in DEFECTS.md.

### `71-TIDE-TUNING-BRIEF.md`
**the kickoff brief handing the tide's composition to a dedicated channel**  
*Spent because:* The channel ran and delivered — 72, 73 and 74 are its output — so a first-message brief is spent by construction.  
**HOLDS:** Ethan's thesis 'Alice is the goddess of death and she is SKELETONS, not zombies' as the constraint every tuning decision answers to; and the paid-for rules that belong in CLAUDE.md rather than a retired brief — an unprobed id is a guess that fails silently, a lang entry is not proof of registration, node --check is not the engine, flaky is worse than absent.

### `72-THE-UNDEAD-CENSUS.md`
**the 150 → 89 census of undead-tagged entities, with a roster proposal**  
*Spent because:* Superseded on both halves — its proposal B was withdrawn by its own author and refuted by 73's bow measurements, and 74 took the roster decisions instead.  
**HOLDS:** Two census method errors worth keeping: vanilla entity data lives in the server jar under libraries/ not mods/, so scanning the mods folder silently omits the tag's largest contributor; and a live mob answers the registry probe with data, so a check that only accepts 'No entity was found' reads every living mob as fake. Also the three risk classes and the reproduce commands.

### `79-THE-CONTROLS-AUDIT.md`
**an audit of 270 keybind entries across 31 conflicted keys, and the rekeying proposed from it**  
*Spent because:* The pass shipped (V went from 11 actions to 1) and the doc's own CORRECTIONS section records that the audit which proposed it was wrong twice.  
**HOLDS:** The two corrections and the recorded false alarm so neither is repeated; the durable rule that core controls are cleared and nothing else may sit on them ('jumping should not deploy a siege ladder'); the packwiz delivery problem for pushing options.txt to players; and the two items left genuinely open.

---

## Merged into `docs/LORE.md`, 2026-09-05

> ⭐ These six are a different case from everything above. They were not spent — they
> were the SAME SUBJECT split across six files that had begun to disagree, and Ethan
> ruled them into one: *"those are lores and should go into a lore doc."* Every body
> line was carried across and verified line-for-line: **zero lost.** They are kept only
> as provenance. ⛔ Read `LORE.md` instead — it carries corrections these do not.

### `15-LORE.md`
**the world bible - angels, descent, strata, the Vaults**  
*Why archived:* merged whole into docs/LORE.md  
**HOLDS:** nothing unique — carried across in full.

### `57-CAEBRIM.md`
**Caebrim: the rulings, the shadow stalker, the Kayer/Milantros triangle**  
*Why archived:* merged whole into docs/LORE.md  
**HOLDS:** nothing unique — carried across in full.

### `58-KAYER-CANON.md`
**Kayer book canon + the naming convention**  
*Why archived:* merged whole into docs/LORE.md  
**HOLDS:** nothing unique — carried across in full.

### `59-MERA-CANON.md`
**Mera book canon; Wall is Blade’s daughter**  
*Why archived:* merged whole into docs/LORE.md  
**HOLDS:** nothing unique — carried across in full.

### `60-GREGOR-CANON.md`
**Gregor book canon; the name rule as canon**  
*Why archived:* merged whole into docs/LORE.md  
**HOLDS:** nothing unique — carried across in full.

### `61-CAEBRIM-CANON.md`
**Caebrim book canon; the speaker map, final**  
*Why archived:* merged whole into docs/LORE.md  
**HOLDS:** nothing unique — carried across in full.

