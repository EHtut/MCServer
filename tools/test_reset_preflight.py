"""test_reset_preflight.py — prove the gate can FAIL, and can say "I don't know".

    python tools/test_reset_preflight.py

⭐ WHY. `reset_preflight.py` guards a ONE-SHOT. A gate that cannot fail is not a gate,
it is a banner — and this project has shipped seven lying banners already.

🔴 AND ITS OWN EXTRACTOR LIED THREE TIMES WHILE IT WAS BEING WRITTEN. First it read the
top-level dict keys and reported 324 mods missing. Then it read only `categories` and
reported 6. Then it learned that shaderpacks spell the list `packs`, not `mods`, and
reported 0 — which is the truth. Every wrong answer was plausible and none of them
errored. That is exactly why the shape check below asserts UNKNOWN rather than trusting
a number.
"""
import io
import json
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import reset_preflight as P

fails = 0


def expect(label, got, want):
    global fails
    if got == want:
        print("  ok    %s" % label)
    else:
        fails += 1
        print("  FAIL  %s\n          got %r  want %r" % (label, got, want))


def run_only(fn):
    """Run one check in isolation and return its (state, detail)."""
    P.results = []
    try:
        fn()
    except Exception as e:
        return ("THREW", repr(e))
    if not P.results:
        return ("NOTHING", "")
    return (P.results[0][1], P.results[0][2])


# ---------------------------------------------------------------------------
print("tectonic — the check that guards the one-shot")
REAL_INSTANCE = P.INSTANCE
REAL_REPO = P.REPO
tmp = tempfile.mkdtemp(prefix="preflight_test_")
try:
    inst_cfg = os.path.join(tmp, "inst", "config")
    repo_cfg = os.path.join(tmp, "repo", "pack", "config")
    os.makedirs(inst_cfg)
    os.makedirs(repo_cfg)
    P.INSTANCE = os.path.join(tmp, "inst")
    P.REPO = os.path.join(tmp, "repo")

    def write(where, min_y, ore="false"):
        io.open(os.path.join(where, "tectonic.json"), "w", encoding="utf-8").write(
            '{\n  "ore_fix": %s,\n  "min_y": %d\n}\n' % (ore, min_y))

    # 🚨 A missing instance file must be UNKNOWN, never PASS. "I could not tell" and
    # "it is fine" sharing a value is the exact bug that let /im report reachable:true.
    write(repo_cfg, -64)
    expect("missing instance file -> UNKNOWN", run_only(P.check_tectonic)[0], P.UNKNOWN)

    write(inst_cfg, -128)
    expect("instance -128 vs repo -64 -> FAIL", run_only(P.check_tectonic)[0], P.BAD)

    write(inst_cfg, -64)
    expect("both -64 -> PASS", run_only(P.check_tectonic)[0], P.OK)

    # ore_fix compensates for a LOWERED min_y, so -64 with ore_fix on is inconsistent.
    write(inst_cfg, -64, ore="true")
    P.results = []
    P.check_tectonic()
    states = [s for _n, s, _d in P.results]
    expect("min_y ok but ore_fix inconsistent -> a WARN is raised",
           P.WARN in states, True)

    # A garbage file must not read as agreement.
    io.open(os.path.join(inst_cfg, "tectonic.json"), "w", encoding="utf-8").write("not json at all")
    expect("unparseable instance file -> UNKNOWN", run_only(P.check_tectonic)[0], P.UNKNOWN)
finally:
    P.INSTANCE = REAL_INSTANCE
    P.REPO = REAL_REPO
    shutil.rmtree(tmp, ignore_errors=True)

# ---------------------------------------------------------------------------
print("\nmodlist parity — the extractor that lied three times")
tmp2 = tempfile.mkdtemp(prefix="preflight_ml_")
try:
    P.REPO = tmp2
    os.makedirs(os.path.join(tmp2, "tools", ".cache"))
    ml = os.path.join(tmp2, "tools", "modlist.json")
    rs = os.path.join(tmp2, "tools", ".cache", "resolved.json")

    def write_ml(obj):
        json.dump(obj, io.open(ml, "w", encoding="utf-8"))

    def write_rs(slugs):
        json.dump([{"slug": s, "status": "RESOLVED"} for s in slugs],
                  io.open(rs, "w", encoding="utf-8"))

    # 🚨 THE REGRESSION TEST FOR THE 324. A shape the extractor does not understand must
    # report UNKNOWN, not invent a catastrophe out of metadata keys.
    write_ml({"_comment": ["x"], "game_version": "1.21.1", "budget": 300})
    write_rs(["curios", "jei"])
    expect("unreadable modlist shape -> UNKNOWN", run_only(P.check_modlist_parity)[0], P.UNKNOWN)

    # A real shape, with enough entries to clear the sanity floor.
    filler = ["mod%03d" % i for i in range(60)]
    good = {"categories": {"core": {"mods": [["curios", "why", "core"]] +
                                            [[m, "why", "core"] for m in filler]}},
            "shaderpacks": {"packs": [["complementary-reimagined", "why", "opt"]]},
            "resourcepacks": {"packs": [["fresh-animations", "why", "opt"]]}}
    write_ml(good)
    write_rs(["curios", "complementary-reimagined", "fresh-animations"] + filler)
    expect("full shape, no drift -> PASS", run_only(P.check_modlist_parity)[0], P.OK)

    # 🚨 THE BUG THE SECOND ITERATION HAD: shaderpacks spell it `packs`. If that
    # regresses, this returns FAIL instead of PASS.
    write_rs(["curios", "complementary-reimagined"] + filler)
    expect("a shaderpack counts as present -> still PASS",
           run_only(P.check_modlist_parity)[0], P.OK)

    # Real drift must still be caught.
    write_rs(["curios", "terralith"] + filler)
    st, detail = run_only(P.check_modlist_parity)
    expect("genuine drift -> FAIL", st, P.BAD)
    expect("...and it names the mod", "terralith" in detail, True)

    # Missing files are UNKNOWN, not PASS.
    os.remove(rs)
    expect("missing resolved.json -> UNKNOWN", run_only(P.check_modlist_parity)[0], P.UNKNOWN)
finally:
    P.REPO = REAL_REPO
    shutil.rmtree(tmp2, ignore_errors=True)

# ---------------------------------------------------------------------------
print("\npackwiz — a stale hash makes every client refuse the pack")
tmp3 = tempfile.mkdtemp(prefix="preflight_pw_")
try:
    P.REPO = tmp3
    os.makedirs(os.path.join(tmp3, "pack"))
    idx = os.path.join(tmp3, "pack", "index.toml")
    pt = os.path.join(tmp3, "pack", "pack.toml")
    io.open(idx, "w", encoding="utf-8").write("[[files]]\nfile = \"mods/x.pw.toml\"\n")
    import hashlib
    h = hashlib.sha256(open(idx, "rb").read()).hexdigest()
    io.open(pt, "w", encoding="utf-8").write('[index]\nfile = "index.toml"\nhash = "%s"\n' % h)
    expect("matching hash -> PASS", run_only(P.check_packwiz)[0], P.OK)

    io.open(idx, "a", encoding="utf-8").write("\n[[files]]\nfile = \"mods/y.pw.toml\"\n")
    expect("index changed, hash stale -> FAIL", run_only(P.check_packwiz)[0], P.BAD)

    io.open(pt, "w", encoding="utf-8").write("[index]\nfile = \"index.toml\"\n")
    expect("no hash in pack.toml -> UNKNOWN", run_only(P.check_packwiz)[0], P.UNKNOWN)
finally:
    P.REPO = REAL_REPO
    shutil.rmtree(tmp3, ignore_errors=True)

# ---------------------------------------------------------------------------
print("\nC4 staged removals — five places, and a half-removal is the worst state")
tmp4 = tempfile.mkdtemp(prefix="preflight_c4_")
try:
    P.REPO = tmp4
    os.makedirs(os.path.join(tmp4, "pack", "mods"))
    os.makedirs(os.path.join(tmp4, "tools", ".cache"))
    SLUG = sorted(P.STAGED_FOR_REMOVAL)[0]

    def build(in_mods, in_index, in_resolved, in_cats, in_pins):
        p = os.path.join(tmp4, "pack", "mods", SLUG + ".pw.toml")
        if in_mods:
            io.open(p, "w", encoding="utf-8").write("name = \"x\"\n")
        elif os.path.exists(p):
            os.remove(p)
        io.open(os.path.join(tmp4, "pack", "index.toml"), "w", encoding="utf-8").write(
            ("[[files]]\nfile = \"mods/%s.pw.toml\"\n" % SLUG) if in_index else "[[files]]\n")
        json.dump([{"slug": SLUG, "status": "RESOLVED"}] if in_resolved else [],
                  io.open(os.path.join(tmp4, "tools", ".cache", "resolved.json"), "w",
                          encoding="utf-8"))
        ml = {"categories": {"c": {"mods": [[SLUG, "why", "minor"]] if in_cats else []}},
              "pins": {"versions": ({SLUG: "1.0.0"} if in_pins else {})}}
        json.dump(ml, io.open(os.path.join(tmp4, "tools", "modlist.json"), "w",
                              encoding="utf-8"))

    def state_for(slug):
        P.results = []
        P.check_knocker()
        for n, s, d in P.results:
            if n.endswith(slug):
                return s, d
        return ("NOTHING", "")

    build(True, True, True, True, True)
    expect("present everywhere -> WARN (staged, expected)", state_for(SLUG)[0], P.WARN)

    build(False, False, False, False, False)
    expect("gone from all five -> PASS", state_for(SLUG)[0], P.OK)

    # 🚨 THE STATE THAT BREAKS THE PACK. A .pw.toml deleted alone is invisible to the
    # installer and the index hash goes stale, so clients refuse the pack.
    build(False, True, True, True, True)
    expect("removed from pack/mods only -> FAIL", state_for(SLUG)[0], P.BAD)

    build(False, False, False, False, True)
    st, detail = state_for(SLUG)
    expect("removed everywhere EXCEPT the pin -> FAIL", st, P.BAD)
    expect("...and it names the pin", "pins" in detail, True)

    # A shape it cannot read must not read as "gone".
    io.open(os.path.join(tmp4, "tools", "modlist.json"), "w", encoding="utf-8").write("{")
    expect("unparseable modlist -> UNKNOWN, never PASS", state_for(SLUG)[0], P.UNKNOWN)
finally:
    P.REPO = REAL_REPO
    shutil.rmtree(tmp4, ignore_errors=True)

print()
print("%d FAILED" % fails if fails else "all preflight gate tests passed")
raise SystemExit(1 if fails else 0)
