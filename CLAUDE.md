# Veldora — operating rules for any agent working on this server

> **Created 2026-08-29** because these rules lived only in one chat's memory, and several
> chats work on this server at once. A rule that reaches one agent is not a rule.

---

## ⛔ 0. STAGE AND DEPLOY ONLY YOUR OWN FILES. Several chats work here at once.

> Ethan, 2026-08-30: *"You and the tide chat are both working in tandem, you just commit
> everything."*

**This happened three times in one evening**, in both directions. The immersive channel's
in-progress `immersive.js` was swept into a tide commit before its tests existed; a
one-file immersive deploy pushed the tide channel's uncommitted, mid-edit `tide.js`,
`waves.js` and `spawn_pressure.js` onto the **live server**; and a config-centralisation
commit landed inside a commit whose message is about fodder ratios. Nothing was lost, but
no commit message now describes what its commit contains.

⛔ **NEVER `git add -A`, `git add .`, or `git commit -a`.** Another channel's half-written
file is almost always in the tree. Name your files:

```bash
git add tools/my_thing.py docs/MY_DOC.md && git commit -m "..."
```

⛔ **NEVER a bare `sync_scripts.py --deploy`** — it pushes *every* differing script,
including someone else's unfinished work, which then loads on the next restart:

```bash
python tools/sync_scripts.py --only immersive --deploy
```

🔑 **Before you commit or deploy, run `git status --short` and look at whose files are
dirty.** If a file you did not touch is modified, it belongs to another channel — leave
it, and say so in your report rather than silently including it.

⚠️ **And check the harness of anything you did not write before restarting.** A failing
harness on a file you don't own means that channel is mid-edit; loading it on the live
server is not yours to do.

---

## ⛔ 1. DO NOT RESTART THE SERVER. Ask first, every time.

> Ethan, 2026-08-29: *"You restart the server way too much over the smallest fixes...
> you are directly harming the work of other agents who are working on this server, ive
> had to play damage control. It is no longer something you can restart whenever you
> feel like, you need to confirm with me."*

**Several chats work on this server simultaneously.** A restart is not a local action —
it kills whatever every other agent is mid-way through, and Ethan repairs it.

🔑 **The cost is invisible from inside any one chat**, which is exactly why it kept
happening: each restart looked individually justified.

```
python tools/sync_scripts.py --deploy      # SAFE. Changes nothing until a restart.
python tools/serverctl.py restart          # ⛔ ASK FIRST. Every time.
```

---

### ⭐ AMENDED 2026-09-06 — single-operator sessions

> Ethan: *"restart it you are the only operator and full control."*

**The rule above exists because SEVERAL CHATS SHARE THIS SERVER.** When that premise is
false — when Ethan has said in this session that you are the only operator — the reason for
asking is gone and the restart is yours to spend.

⚠️ **THE GRANT IS PER SESSION AND HE MUST HAVE GIVEN IT.** It is not a standing change and
it does not carry into the next chat. Absent that sentence, the rule above is unchanged:
**ask, every time.**

⛔ **AND IT NEVER COVERS KICKING A PLAYER MID-TEST.** He is often logged in while you work.
Being allowed to restart is not being allowed to interrupt him — say what is waiting and let
him pick the moment.

⭐ **Batch.** Several chunks can share one restart. *"Deployed, not live, needs a restart
when convenient"* is a complete and honest hand-off — not an unfinished one.

⚠️ **"I need it to verify" is not permission.** Verification is worth less than somebody
else's work.

---

## 🚨 2. ALWAYS REGENERATE PACKWIZ AFTER ANY PACK CHANGE

> Ethan, same day: *"it was mostly like an issue that you keep forgetting to update the
> packwiz."*

```
python tools/gen_pack.py                   # after ANY mod add / remove / repin
```

**`pack.toml` carries a sha256 of `index.toml`.** If they disagree, **every client
refuses the pack** — and the failure surfaces on a player's screen as a connection error,
never in the server log.

Verify, do not assume:

```
python -c "import hashlib,re,pathlib; P=pathlib.Path('pack'); h=hashlib.sha256((P/'index.toml').read_bytes()).hexdigest(); m=re.search(r'hash = \"([0-9a-f]{64})\"',(P/'pack.toml').read_text(encoding='utf-8')); print('MATCH' if m and m.group(1)==h else 'MISMATCH')"
```

⚠️ **And tell Ethan to re-run his packwiz update whenever the pack changes.** A client
updated between two regenerations holds versions the server no longer has, which reads as
*"channel missing on the server side, but required on the client"*.

⚠️ **Configs do NOT travel by packwiz.** `pack/config` is not in `index.toml`. Shared
configs reach players only through `build-client.ps1`.

🔴 **AND THEY DO NOT REACH THE SERVER EITHER.** `pack/config` (64 files) and
`instance/config` (961) have no automatic sync. **Editing a config in the repo changes
nothing that runs.** `tectonic.json` was set to `min_y: -64` in the repo on 08-14, C1 was
marked done, and the instance was still `-128` on 08-30 — sixteen days of a ✅ on a change
the world had never seen (D-112).

⭐ **RULED 2026-08-30 (Ethan): the LIVE INSTANCE IS THE TRUTH.** *"we just need to
centralize, live copy is the truth as repo doesn't get updated as much."* Truth flows
**instance → repo**, one direction:

```
python tools/config_sync.py            # report drift
python tools/config_sync.py --pull     # refresh the repo FROM the live server
```

⚠️ **With one exception, and it is the important one.** "Live is truth" is right for
*drift* — a repo file nobody refreshed. It is **wrong** for a *pending decision*: a change
that was ruled, written into the repo, and simply has not been applied to the server yet.
Pulling over one of those does not resolve a disagreement, it **deletes a ruling** and
leaves no trace. `config_sync.py` keeps a `PENDING` list for exactly those; they are never
pulled, and landing one is a deliberate `--push-pending <file>`. An empty PENDING list is
the healthy state.

🔑 **Measure the instance. Refresh the repo from it. Never assume a repo edit shipped.**

⛔ **Before the world reset (C2), run the gate — it is the only irreversible chunk:**

```
python tools/reset_preflight.py
```

It exits non-zero until every input is actually true, and **an UNKNOWN counts as a
failure** — a check that cannot answer has not passed. `tools/test_reset_preflight.py`
proves it can fail (16 cases); if you add a check, add its negative control too.

---

## ⚠️ 3. Sidedness: the metadata is not the jar, in BOTH directions

Two mods have broken this pack from opposite sides:

| | |
|---|---|
| `realm-rpg-treasure-balloons` | Modrinth said `client_side: unsupported`, so it was marked `server` — it registers a **client-bound channel** and broke **every connection** |
| `fog` | Modrinth said `server_side: optional` **and its own jar declares `side="BOTH"`** — it loads `KeyMapping` and **crashed the dedicated server** |

⭐ **Default to `both`.** Shipping a server-only jar to a client is harmless; the reverse
is a broken pack. Force exceptions in `SIDE_OVERRIDES` in `tools/gen_pack.py`, with the
crash that proved it written next to the entry.

---

## ⚠️ 4. Rhino is the engine, not Node

`node --check` is not proof. Run `python tools/rhino_lint.py`, then **deploy and read the
boot log** — script count and `0 real error(s)`. `/kubejs reload` does **not** re-fire
`ServerEvents.loaded`.

---

## 🚨 5. Probe every entity and sound id

A wrong id spawns nothing and logs nothing.

```
data get entity @e[type=<id>,limit=1]
```

⚠️ **Detect the FAILURE, not the success.** A real id with no live instance says *"No
entity was found"* — but a real id that **is currently alive answers with its data**, and
a naive check reads that as fake. Always include a known-fake control.

⛔ **`/playsound` cannot be probed at all** — fake and real are byte-identical over rcon.
A wrong sound id is silent, and only an ear finds it.

---

## 🔑 6. "I failed" and "I found nothing" must never share a return value

This is the project's most common defect shape and it has appeared in scripts, in tools,
and in the checkers written to catch it. A silent subsystem and a broken one must look
different from the outside.

---

## ⚠️ 7. A banner is a claim, not evidence

**Ten lying banners** have been caught here, most by reading the boot log after a restart.
If you change what a system does, the line that describes it changes in the same commit.

---

## 🚨 8. Measure at the point of USE

An assertion that matches the string *anywhere* in a file is not testing the call site you
mean. This has bitten four times in a single session — including a check that matched an
identical line in a different function, and one that matched the prose comment promising
the opposite.

⭐ **Every harness change wants a negative control**: break the thing deliberately, watch
it go red, restore, and verify the restore byte-for-byte.

---

## 🚨🚨 A. GODS DO NOT USE THE CHAT. EVER.

> Ethan, 2026-09-06, in capitals, after finding god bickering in his chat bar:
> *"GODS.DO.NOT.USE.THE.CHAT. GODS USE THE DIALOGUE SYSTEM ONLY. WE DO NOT EVER USE THE
> CHAT UNLESS IT IS A PHYSICALLY PRESENT CHARACTER."*

**The chat bar is for people who are STANDING THERE.** Ank is in the chat bar because Ank
has a body you can walk up to. A god has no body, so a god has no business in the chat bar
and never did.

| speaker | surface |
|---|---|
| a **physically present character** — Ank, Caebrim in person | `p.tell(...)`, as `<Name> text` |
| **a god, a patron, a tide, a whisper, anything without a body** | the **dialogue system** — Immersive Messages, via `voice.js` / `immersive.js` |

⛔ **`p.tell()` in a god's code path is a defect**, regardless of how long it has been
there or how well it tests. `tools/gods_in_chat_check.js` fails the build on it.

---

## 🚨🚨 B. NEW INSTRUCTIONS BEAT OLD DOCUMENTS. ALWAYS.

> Ethan, 2026-09-06: *"you are overwriting my recent instructions with old documents.
> everyting older than like 2-3 days are to be challenged regardless if built or not. New
> instructions always take precendent. Always."*

**A document is evidence of what was decided THEN. It is not permission to ignore what he
said an hour ago.** This project has ~30 live docs and a large archive, and every one of
them is a plausible-sounding reason to do the wrong thing.

🔑 **The failure shape, exactly:** he gives an instruction; a doc written weeks earlier
describes a system that contradicts it; the doc is detailed, argued and internally
consistent; it wins. It should never win.

⛔ **So: anything written more than 2–3 days ago is CHALLENGED, not cited** — built or not,
shipped or not, however good the reasoning was at the time.

- If a doc contradicts something he said recently, **he is right and the doc is stale.**
  Fix the doc in the same session; do not "reconcile" them.
- If a doc justifies a system he has just complained about, **that is not a defence of the
  system.** It is an explanation of how it got there.
- ⚠️ **"But it was ruled on 2026-08-15" is not an argument.** He rules again all the time,
  and the newer ruling wins by definition.

---

## C. A LOST AGENT IS RESUMED, NOT WRITTEN OFF.

> Ethan, 2026-09-06: *"Write a rule that if the session limit is reached, to always resume
> whatever agents were lost when usage is reset."*

**When the usage limit kills agents mid-run, the work is not gone - it is PAUSED.** Every
workflow persists its script and its per-agent results, and a resume replays the ones that
finished from cache and re-runs only the ones that died. It costs a fraction of the original.

**So a partial result is never reported as the finished thing, and never quietly dropped.**
Both of those turn "three fifths of the tree was never looked at" into "we audited it",
which is the exact claim this project keeps having to un-tell.

```
Workflow({ scriptPath: "<path from the original tool result>", resumeFromRunId: "wf_..." })
```

**The moment agents die, write down three things** - in the report AND in a defect if the
work mattered: **which agents died**, **the runId**, and **the scriptPath**. All three appear
in the tool result; none can be reconstructed afterwards from memory.

**Resume when the limit resets, not at the next convenient moment.** A resume left for
"later" becomes a rewrite, because the script drifts and the cache stops matching.

### OUTSTANDING RIGHT NOW - the 2026-09-06 corruption audit

Two of five lenses finished (31 findings). **`fragile`, `docrot` and `shadow` all died on the
session limit** and have never run. Filed as **D-152**.

```
runId    wf_bd6eb30d-163
script   ~/.claude/projects/C--MCServer-repo/2b0c92a6-32e3-4e8b-8ac6-2ad665ec6b95/
         workflows/scripts/corruption-audit-wf_bd6eb30d-163.js
```

**Resuming replays the two that finished from cache**, so it re-runs only the three that
died. Do NOT re-launch it as a new workflow - that pays for all five again and produces a
second, competing findings list.

---

## Standing constraints from Ethan

- **No coefficient below 1** — *"it should always be an increase."*
- **Never take items from players** — *"that is how you cause them to quit."*
- **No agent fleets or large fan-out workflows** — they burn his usage budget.
- **Mark generated dialogue `[CLAUDE-DRAFT]`** so it lands in `docs/51` for his pass.
- **Read `docs/68-THE-GAMEPLAN.md` first.** `docs/DEFECTS.md` holds findings with IDs.
