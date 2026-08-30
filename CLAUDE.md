# Veldora — operating rules for any agent working on this server

> **Created 2026-08-29** because these rules lived only in one chat's memory, and several
> chats work on this server at once. A rule that reaches one agent is not a rule.

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
`instance/config` (961) have no sync in either direction. **Editing a config in the repo
changes nothing that runs.** `tectonic.json` was set to `min_y: -64` in the repo on
08-14, C1 was marked done, and the instance was still `-128` on 08-30 — sixteen days of a
✅ on a change the world had never seen (D-112).

🔑 **The repo records intent. The instance is what runs. Measure the instance.**

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

## Standing constraints from Ethan

- **No coefficient below 1** — *"it should always be an increase."*
- **Never take items from players** — *"that is how you cause them to quit."*
- **No agent fleets or large fan-out workflows** — they burn his usage budget.
- **Mark generated dialogue `[CLAUDE-DRAFT]`** so it lands in `docs/51` for his pass.
- **Read `docs/68-THE-GAMEPLAN.md` first.** `docs/DEFECTS.md` holds findings with IDs.
