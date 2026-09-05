# FORMAT — how a doc in this repo is written

> The doc about docs. Read this before creating one; there is a good chance you should not.

---

## ① DIGEST

**The problem this solves.** 75 docs, 29,000 lines, most untouched since July while the code
moved on. Ethan: *"Consistently old or unupdated documents are getting in our way."* A stale
doc is worse than no doc — it is a **claim that reads as evidence**, and it costs real time:
work gets re-derived, a fixed defect gets re-investigated, a session builds from a plan that
was superseded weeks ago.

**The three rules.** A doc is **UPDATED or ARCHIVED**, never left to sit · a fact about
current state lives in **exactly one place** · **`LIVE` / `DONE` / `COMPLETE` is a claim, not
evidence** — verify against code before repeating it.

**The shape.** Six numbered sections, in a fixed order, so any doc can be skimmed the same
way. **§① is ≤20 lines and Ethan reads only that.** If it cannot fit, the doc owns too much.

**Where things go.** State → `STATUS.md`. Findings → `DEFECTS.md` with `D-` ids. History →
**git**, never a doc. Design → the owning doc.

---

## ② ROUTING

| | |
|---|---|
| **OWNS** | the doc format · the tier system · what goes where · when to archive |
| **DOES NOT OWN** | *what is true right now* → `STATUS.md` · *what is broken* → `DEFECTS.md` · *what happened* → git |
| **APPLIES TO** | every doc in `docs/`, except generated ones (`04-GAP-REPORT`, `48-EVERY-EVENT`, `51-LINES-TO-REFRESH`) which are rewritten by their tool and hand-edited never |

---

## ③ THE SHAPE

```markdown
# NAME — what it is in six words

> One line: what this doc owns. Not a summary of the subject.

## ① DIGEST
   ≤20 lines, hard. Rewritten every session that touches the doc.
   what this is · where it stands · the next chunk AND ITS FALSIFIER · what needs Ethan

## ② ROUTING
   OWNS · DOES NOT OWN (+ who does) · STATE → · FINDINGS → · BLOCKED ON / BLOCKS

## ③ THE DESIGN
   How it works. Stable across sessions. ⛔ No dates, no build log, no "currently".

## ④ CHUNKS
   state · what changes · FALSIFIER · harness
   ⛔ A chunk with no falsifier is not a chunk.

## ⑤ RULINGS
   Each with THE COUNTER-ARGUMENT THAT LOST, or it gets re-litigated in a month.

## ⑥ CORRECTIONS
   Every claim that turned out wrong, and what is true instead.
```

### Why each section is there

**§① is the whole format.** The test: *Ethan reads ① and nothing else, and that is
sufficient.* Everything below exists so §① can be short.

**§② `DOES NOT OWN` is the important half.** Ethan, 2026-09-04: *"this is the 5th time this
week something was dropped because it either wasn't logged or it was lost in the wall of
text."* Four of that week's five drops fell **between** docs, because every doc described its
subject and none described its edges.

**§④ a falsifier, not a description.** *"What result would tell me this chunk is wrong?"* If
there is no answer, the chunk is not defined yet. Written **before** building.

**§⑤ the counter-argument is not optional.** A ruling without the losing case gets
re-litigated by the next session, which cannot see why the obvious thing was rejected.

**§⑥ corrections are the highest-value lines in any doc**, and the most often left in a chat
transcript. A wrong claim still standing is a trap. ⛔ **Correct in place, never quietly
overwrite** — the false version is what stops it being re-derived.

### What a doc must never contain

| ⛔ | why | where it goes instead |
|---|---|---|
| a build narrative | git never rots, and a doc does | the commit message |
| "COMPLETE" in its own header | 36 of the 192 docs culled from the Alice project self-declared complete in their first 20 lines | nowhere. Let the ledger say it |
| a duplicated fact | two copies disagree and nobody notices | one place, everything else links |
| `NEXT` | only `STATUS.md` may say what is next | `STATUS.md` |

---

## ④ THE TIERS

**Numbers encode creation order, not status** — `23-THE-PATH-SYSTEM.md` tells you nothing
about whether it is still true. So status comes from *where the file lives*, not its name.

| tier | where | what it means |
|---|---|---|
| **LIVE** | `docs/NAME.md` — a name, no number | still being built from. Kept current or archived. |
| **REFERENCE** | `docs/NAME.md` | describes *how to work*, not the work. Formats, maps, runbooks. |
| **GENERATED** | `docs/NN-*.md` | rewritten by a tool. ⛔ Never hand-edit; regenerate. |
| **ARCHIVE** | `docs/archive/NN-*.md` | spent. Keeps its number. **Stamped, never deleted.** |

⚠️ **ARCHIVE IS NOT DELETE, and the distinction is load-bearing here.** Ethan's own writing —
god briefs, canon, lore, the lines themselves — is the highest-value content in this repo and
some of it sits in docs whose *plan* is spent. Archiving preserves it; deleting would not.

⛔ **Never build from `docs/archive/`.** Read it for intent, then re-verify against code.

### The archive stamp

Every archived doc gets this at the top, and the index records what it holds:

```markdown
> ⛔ ARCHIVED <date> — FICTION UNLESS RE-VERIFIED. Superseded by <what>.
> HOLDS: <what would be lost if this were deleted — rulings, measurements, Ethan's prose>
```

---

## ⑤ RULINGS

**One doc per live front; a doc with no channel is the defect.** *(Ethan, carried from the
Alice estate, 2026-09-01.)* The counter-argument was that a new topic deserves a new doc —
rejected, because that is exactly how 192 docs happened there and 75 here. If a subject
genuinely finishes, its doc is **replaced**, not added to.

**Ethan's writing is never archived away silently.** The counter-argument was that a spent
plan should go regardless of what is embedded in it — rejected: a character brief inside a
dead build plan is still the character brief, and there is no other copy.

**Status lives in the path, not the filename.** The counter-argument was renaming is churn
and breaks inbound links — accepted as a real cost, and outweighed: a number that means
"written 23rd" while reading as "23rd priority" has actively misled sessions here.

---

## ⑥ CORRECTIONS

**"Numbered docs are fine, the number is just an id."** ❌ In practice the number reads as
importance and creation order reads as priority. `20-AUDIT-2026-08-11.md` was cited by five
docs as *"the live state of what exists"*, which it stopped being the day after it was
written.

**"A DRAFT banner stops people building from a doc."** ❌ It does not. `68-THE-GAMEPLAN.md`
said `DRAFT` and *"Zero code written from this doc"* while A, B, D1–D6, E1, E2, F1, F2 and G1
had all shipped from it. `78-THE-OPENING.md` still said *"design only, zero code"* ten
minutes before `opening.js`'s first commit cited it as the design.

⇒ **A banner is a claim like any other.** The tier is the file's location, which cannot be
wrong the way a line of prose can.
