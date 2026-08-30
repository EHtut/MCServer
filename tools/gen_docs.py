"""Generate the mod-list and gap-report docs from the resolved data.

These two documents are GENERATED, never hand-edited: a hand-written mod list
in a 400-mod pack is stale the day after it is written, and a stale gap report
is worse than none because it invites re-litigating decisions that were already
made. Everything narrative lives in the hand-written docs instead.

  python tools/gen_docs.py
"""

from __future__ import annotations

import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent
DOCS = REPO / "docs"
RESOLVED = HERE / ".cache" / "resolved.json"
MODLIST = HERE / "modlist.json"

CATEGORY_ORDER = [
    "create", "magic", "combat-guns", "horror", "world-structures",
    "qol", "building-deco", "food-farm", "performance", "server-admin",
    "core-libs", "auto-deps",
]

SIDE_LABEL = {"both": "both", "client": "client", "server": "server"}


def side_of(r: dict) -> str:
    c, s = r.get("client_side"), r.get("server_side")
    if s == "unsupported" and c != "unsupported":
        return "client"
    if c == "unsupported" and s != "unsupported":
        return "server"
    return "both"


def esc(s) -> str:
    return str(s or "").replace("|", "\\|").replace("\n", " ")


def gen_modlist(rows: list[dict], meta: dict) -> str:
    ok = [r for r in rows if r["status"] == "RESOLVED"]
    by_cat: dict[str, list[dict]] = {}
    for r in ok:
        by_cat.setdefault(r.get("category") or "?", []).append(r)

    total_mb = sum(r.get("size") or 0 for r in ok) / 1024 / 1024
    sides: dict[str, int] = {}
    for r in ok:
        sides[side_of(r)] = sides.get(side_of(r), 0) + 1

    out = [
        "# Mod list",
        "",
        "> **Generated file.** Produced by `tools/gen_docs.py` from",
        "> `tools/modlist.json` + the resolution cache. Do not hand-edit -",
        "> change `tools/modlist.json` and regenerate.",
        "",
        f"**{len(ok)} mods** for Minecraft {meta.get('game_version')} / "
        f"{meta.get('loader')}, {total_mb:,.0f} MB total.",
        "",
        "| side | count | meaning |",
        "|---|---:|---|",
        f"| both | {sides.get('both', 0)} | installed on the server *and* every client |",
        f"| client | {sides.get('client', 0)} | client-only; the server never loads them |",
        f"| server | {sides.get('server', 0)} | server-only; players do not need them |",
        "",
        "Every entry is pinned to an exact file and sha512 in `pack/mods/*.pw.toml`.",
        "The **Why** column is the reason that mod is in the pack, not a description",
        "of what it does - if a mod cannot justify a slot, it should not have one.",
        "",
    ]

    for cat in CATEGORY_ORDER + sorted(set(by_cat) - set(CATEGORY_ORDER)):
        items = by_cat.get(cat)
        if not items:
            continue
        desc = (meta.get("categories", {}).get(cat) or {}).get("desc", "")
        out += [f"## {cat} ({len(items)})", ""]
        if desc:
            out += [desc, ""]
        out += ["| Mod | Version | Side | Tier | Why |", "|---|---|---|---|---|"]
        for r in sorted(items, key=lambda x: (x.get("tier") != "core",
                                              x.get("tier") != "major",
                                              x["slug"])):
            out.append(
                f"| [{esc(r.get('title') or r['slug'])}]"
                f"(https://modrinth.com/mod/{r['slug']}) "
                f"| `{esc(r.get('version_number'))}`"
                + ("" if r.get("version_type") == "release"
                   else f" *{r.get('version_type')}*")
                + f" | {SIDE_LABEL[side_of(r)]} | {esc(r.get('tier'))} | {esc(r.get('why'))} |"
            )
        out.append("")

    return "\n".join(out)


def gen_gap_report(rows: list[dict], meta: dict) -> str:
    ok = [r for r in rows if r["status"] == "RESOLVED"]
    risky = [r for r in ok if r.get("tier") == "risky"]
    nonrelease = [r for r in ok if r.get("version_type") != "release"]

    out = [
        "# Gap report",
        "",
        "> **Generated file.** Produced by `tools/gen_docs.py`. The honest",
        "> accounting of what the 1.21.1 NeoForge ecosystem could and could not",
        "> supply, and what was deliberately given up to stay inside the",
        "> 400-mod budget.",
        "",
        "## Summary",
        "",
        f"- **{len(ok)} / {meta.get('budget')}** mod slots used",
        f"- **{len(ok) - len(nonrelease)}** stable releases, **{len(nonrelease)}** beta/alpha",
        f"- **{len(risky)}** entries carry a known hazard (see below)",
        "",
        "---",
        "",
        "## 1. Wanted, and genuinely unavailable",
        "",
        "Verified absent from 1.21.1 NeoForge on any registry. Recorded so nobody",
        "spends an evening re-checking.",
        "",
        "| Mod | Situation |",
        "|---|---|",
    ]
    for slug, why in meta.get("unavailable", {}).get("mods", []):
        out.append(f"| `{esc(slug)}` | {esc(why)} |")

    out += [
        "",
        "**This is the cost of choosing 1.21.1 over 1.20.1.** It was a real cost -",
        "the gun and horror catalogues on 1.20.1 Forge are deeper - but the",
        "substitutions landed well: Fungal Infection: Spore and Crimson Curse cover",
        "the spreading-infection niche Scape and Run occupied, and the 1.21.1",
        "stalker roster (The Knocker, Obsessed, Kenny, The Skinwalker Hunt) is",
        "larger than what 1.20.1 offered.",
        "",
        "---",
        "",
        "## 2. Available, but only on CurseForge",
        "",
        "Modrinth cannot supply these. They need either the packwiz CurseForge",
        "path or a decision to do without.",
        "",
        "| Mod | Why it matters |",
        "|---|---|",
    ]
    for slug, why in meta.get("curseforge_only", {}).get("mods", []):
        out.append(f"| `{esc(slug)}` | {esc(why)} |")

    out += [
        "",
        "**The one that actually matters is FTB Quests.** It is the natural artefact",
        "for a DM-authored questline to be written into, and FTB withdrew their",
        "mods from Modrinth, so no amount of searching finds it. Nothing in the",
        "current pack blocks adding it later - see `03-AI-DM-SEAM.md` for why the",
        "seam does not depend on it.",
        "",
        "---",
        "",
        "## 3. Known hazards in what we DID ship",
        "",
        "Mods marked `risky`: wanted, included, but with a specific failure mode",
        "worth knowing before it bites.",
        "",
        "| Mod | Version | Hazard |",
        "|---|---|---|",
    ]
    for r in sorted(risky, key=lambda x: x["slug"]):
        out.append(f"| [{esc(r.get('title'))}](https://modrinth.com/mod/{r['slug']}) "
                   f"| `{esc(r.get('version_number'))}` | {esc(r.get('why'))} |")

    out += [
        "",
        "### Non-release builds",
        "",
        "These shipped as beta or alpha because no stable 1.21.1 build exists.",
        "They are the first place to look when something breaks.",
        "",
        "| Mod | Version | Channel |",
        "|---|---|---|",
    ]
    for r in sorted(nonrelease, key=lambda x: (x.get("version_type"), x["slug"])):
        out.append(f"| `{esc(r['slug'])}` | `{esc(r.get('version_number'))}` "
                   f"| {esc(r.get('version_type'))} |")

    out += [
        "",
        "---",
        "",
        "## 4. Cut to fit the budget",
        "",
        "Folding in the 53 real dependencies pushed the list past 400, so these",
        "went. Cuts are **data, not history**: delete the entry from `CUTS` in",
        "`tools/trim_to_budget.py` and re-run to bring one back.",
        "",
        "| Mod | Reason |",
        "|---|---|",
    ]
    # ⚠️ TOLERANT OF A MISSING REASON, and it SAYS SO rather than inventing one.
    #
    # 🔴 A single malformed row - ["hollowsteve"], no reason - crashed this generator
    # with "not enough values to unpack". Nothing else failed, so BOTH generated docs
    # (01-MODLIST and 04-GAP-REPORT) stopped being regenerable and quietly went stale.
    # A generator that dies on one bad row takes the whole document with it, and the
    # document is the only thing anyone reads.
    for row in meta.get("cut_for_budget", {}).get("mods", []):
        if isinstance(row, str):
            slug, why = row, ""
        else:
            slug = row[0] if len(row) > 0 else "?"
            why = row[1] if len(row) > 1 else ""
        why = esc(why) if why else "**no reason recorded** - do not restore casually"
        out.append(f"| `{esc(slug)}` | {why} |")

    out += [
        "",
        "Two of those are **correctness**, not budget, and should not be restored",
        "casually: `epic-fight` conflicts with `better-combat`, and `rubidium-extra`",
        "pulls in Embeddium, which competes with Sodium rather than complementing it.",
        "",
    ]
    return "\n".join(out)


def main() -> int:
    rows = json.loads(RESOLVED.read_text(encoding="utf-8"))
    meta = json.loads(MODLIST.read_text(encoding="utf-8"))
    DOCS.mkdir(parents=True, exist_ok=True)

    for name, text in (("01-MODLIST.md", gen_modlist(rows, meta)),
                       ("04-GAP-REPORT.md", gen_gap_report(rows, meta))):
        (DOCS / name).write_text(text + "\n", encoding="utf-8", newline="\n")
        print(f"wrote docs/{name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
