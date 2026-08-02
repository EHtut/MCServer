"""mcq - ask questions about the installed mods without writing a script first.

WHY THIS EXISTS

Every real diagnosis in this pack has been a jar question, and each one got its
own throwaway script:

  "which mod owns servercore/config.yml?"          -> stale mob categories
  "does GhostEntity implement Enemy?"              -> the surface-rule hole
  "what does epicfight's first_person_model do?"   -> its own tooltip answered it
  "who actually requires accessories?"             -> the curio crash, one query
  "what is the keybind id for Iris reload?"        -> iris.keybind.*, not key.iris.*
  "which mods ship curios slot definitions?"       -> the slot-count desync

The answers were always IN the jars. The cost was writing the scraper each time,
and the errors were always the same shape: a pattern that could not match, or a
string matched instead of a mechanism. Both are worth eliminating.

TWO RULES THIS TOOL ENCODES

1. A search that finds nothing prints "0 matches" and says what it searched, so
   "no results" can never be misread as "does not exist". Every wrong turn in
   this project has been a silent non-match believed as a fact.

2. Class questions are answered by PARSING the class file, not by grepping it.
   `interfaces` reads the real interface table from the constant pool. Grepping
   a jar for "Enemy" finds every class that merely mentions it.

USAGE

  python tools/mcq.py owns <file>          which mod writes this config file
  python tools/mcq.py mod <pattern>        find mods by id / name / filename
  python tools/mcq.py deps <modid>         what it needs, and what needs it
  python tools/mcq.py entity <pattern>     entity ids, with the Enemy check
  python tools/mcq.py item <pattern>       item ids
  python tools/mcq.py lang <pattern>       search every lang file (tooltips!)
  python tools/mcq.py keybinds [pattern]   every registered keybind id
  python tools/mcq.py grep <pattern>       which jars contain this string
  python tools/mcq.py interfaces <Class>   parsed interface list for a class
  python tools/mcq.py data <path-pattern>  which jars ship this data/ path

  --mods <dir>   default C:\\MCServer\\instance\\mods
  --client       use the client instance's mods folder instead
  --refresh      rebuild the index cache
"""

from __future__ import annotations

import argparse
import glob
import json
import pathlib
import re
import struct
import sys
import zipfile

SERVER_MODS = r"C:\MCServer\instance\mods"
CLIENT_MODS = (r"C:\Users\Ethan\AppData\Roaming\PrismLauncher\instances"
               r"\CogsAndCadavers-PrismInstance\.minecraft\mods")
CACHE = pathlib.Path(__file__).resolve().parent / ".cache" / "mcq-index.json"

TOMLS = ("META-INF/neoforge.mods.toml", "META-INF/mods.toml")


# --------------------------------------------------------------------------
# class-file parsing - the honest way to answer "does X implement Y"
# --------------------------------------------------------------------------

def class_interfaces(blob: bytes) -> list[str] | None:
    """Real interface list from the constant pool. None if unparseable.

    Grepping for a type name finds any class that MENTIONS it - a renderer, a
    goal, an inner class. That mistake produced a confidently wrong answer about
    Ice and Fire's Ghost before this existed.
    """
    if blob[:4] != b"\xca\xfe\xba\xbe":
        return None
    try:
        i, count = 10, struct.unpack(">H", blob[8:10])[0]
        pool: dict[int, object] = {}
        k = 1
        while k < count:
            tag = blob[i]; i += 1
            if tag == 1:
                ln = struct.unpack(">H", blob[i:i + 2])[0]; i += 2
                pool[k] = blob[i:i + ln].decode("utf-8", "replace"); i += ln
            elif tag in (7, 8, 16, 19, 20):
                pool[k] = ("ref", struct.unpack(">H", blob[i:i + 2])[0]); i += 2
            elif tag == 15:
                i += 3
            elif tag in (3, 4, 9, 10, 11, 12, 17, 18):
                i += 4
            elif tag in (5, 6):
                i += 8; k += 1
            else:
                return None
            k += 1
        i += 4              # access_flags + this_class
        i += 2              # super_class
        n = struct.unpack(">H", blob[i:i + 2])[0]; i += 2
        out = []
        for _ in range(n):
            idx = struct.unpack(">H", blob[i:i + 2])[0]; i += 2
            e = pool.get(idx)
            if isinstance(e, tuple):
                v = pool.get(e[1])
                if isinstance(v, str):
                    out.append(v)
        return out
    except Exception:
        return None


# --------------------------------------------------------------------------
# index
# --------------------------------------------------------------------------

def build_index(mods_dir: str) -> dict:
    jars = sorted(glob.glob(str(pathlib.Path(mods_dir) / "*.jar")))
    idx = {"mods_dir": mods_dir, "jars": len(jars), "mods": {}}
    for jp in jars:
        name = pathlib.Path(jp).name
        try:
            z = zipfile.ZipFile(jp)
            names = z.namelist()
        except Exception:
            continue
        toml = next((c for c in TOMLS if c in names), None)
        if not toml:
            continue
        t = z.read(toml).decode("utf-8", "replace")
        modid = (re.search(r'modId\s*=\s*"([^"]+)"', t) or [None, "?"])[1]
        disp = (re.search(r'displayName\s*=\s*"([^"]*)"', t) or [None, ""])[1]

        deps = []
        for blk in re.findall(r"\[\[dependencies\.[^\]]*\]\](.*?)(?=\[\[|\Z)", t, re.S):
            m = re.search(r'modId\s*=\s*"([^"]+)"', blk)
            if not m:
                continue
            ty = re.search(r'type\s*=\s*"([^"]+)"', blk)
            # NeoForge: an omitted type DEFAULTS TO REQUIRED. Assuming optional
            # here is how a hard dependency gets cut by accident.
            deps.append({"id": m.group(1), "type": ty.group(1) if ty else "required"})

        entities, items, keybinds = {}, {}, {}
        for ln in [n for n in names if n.endswith("lang/en_us.json")]:
            try:
                d = json.loads(z.read(ln).decode("utf-8", "replace"))
            except Exception:
                continue
            for k, v in d.items():
                if k.startswith("entity.") and k.count(".") == 2:
                    entities[k.split(".", 2)[1] + ":" + k.split(".", 2)[2]] = v
                elif k.startswith("item.") and k.count(".") == 2:
                    items[k.split(".", 2)[1] + ":" + k.split(".", 2)[2]] = v
                elif k.startswith("key.") and not k.endswith(".description"):
                    keybinds[k] = v

        idx["mods"][modid] = {
            "jar": name, "display": disp, "deps": deps,
            "entities": entities, "items": items, "keybinds": keybinds,
        }
    return idx


def load_index(mods_dir: str, refresh: bool) -> dict:
    if not refresh and CACHE.is_file():
        try:
            idx = json.loads(CACHE.read_text(encoding="utf-8"))
            if idx.get("mods_dir") == mods_dir:
                return idx
        except Exception:
            pass
    print(f"(indexing {mods_dir} ...)", file=sys.stderr)
    idx = build_index(mods_dir)
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(idx), encoding="utf-8")
    print(f"(indexed {len(idx['mods'])} mods from {idx['jars']} jars)", file=sys.stderr)
    return idx


def jars(mods_dir: str):
    return sorted(glob.glob(str(pathlib.Path(mods_dir) / "*.jar")))


def report(n: int, what: str) -> None:
    """Never let 'found nothing' look like 'does not exist'."""
    print(f"\n  {n} match(es) for {what}")
    if n == 0:
        print("  NOTE: zero matches means this search found nothing - it does NOT")
        print("        prove absence. Check the pattern can match before concluding.")


# --------------------------------------------------------------------------
# commands
# --------------------------------------------------------------------------

def cmd_mod(idx, pat):
    rx = re.compile(pat, re.I)
    hits = [(m, d) for m, d in idx["mods"].items()
            if rx.search(m) or rx.search(d["display"]) or rx.search(d["jar"])]
    for m, d in sorted(hits):
        print(f"  {m:<28} {d['display'][:34]:<36} {d['jar'][:44]}")
    report(len(hits), f"mod ~ /{pat}/")


def cmd_deps(idx, modid):
    d = idx["mods"].get(modid)
    if d:
        print(f"  {modid} ({d['jar']})")
        print("    requires:")
        for x in d["deps"]:
            if x["id"] not in ("minecraft", "neoforge"):
                print(f"      {x['id']:<26} {x['type']}")
    else:
        print(f"  {modid} is not installed")
    req, opt = [], []
    for other, od in idx["mods"].items():
        for x in od["deps"]:
            if x["id"] == modid:
                (req if x["type"] == "required" else opt).append(other)
    print(f"    REQUIRED BY ({len(req)}): {', '.join(sorted(req)) or '(nothing)'}")
    print(f"    optional for ({len(opt)}): {', '.join(sorted(opt)) or '(nothing)'}")
    if d and not req:
        print("    -> nothing requires it; safe to cut unless a datapack needs it")


def cmd_entity(idx, pat, mods_dir):
    rx = re.compile(pat, re.I)
    hits = [(eid, nm, m) for m, d in idx["mods"].items()
            for eid, nm in d["entities"].items() if rx.search(eid) or rx.search(str(nm))]
    for eid, nm, m in sorted(hits):
        print(f"  {eid:<44} {str(nm)[:26]:<28} [{m}]")
    report(len(hits), f"entity ~ /{pat}/")
    if 0 < len(hits) <= 6:
        print("\n  Enemy check (In Control's `hostile` flag is instanceof Enemy):")
        for eid, _nm, m in sorted(hits):
            ent = eid.split(":", 1)[1]
            cls = "".join(p.capitalize() for p in ent.split("_")) + "Entity"
            jp = next((j for j in jars(mods_dir)
                       if pathlib.Path(j).name == idx["mods"][m]["jar"]), None)
            if not jp:
                continue
            z = zipfile.ZipFile(jp)
            n = next((x for x in z.namelist() if x.endswith("/" + cls + ".class")), None)
            if not n:
                print(f"    {eid:<40} (no {cls}.class - class name differs)")
                continue
            ifc = class_interfaces(z.read(n)) or []
            hit = any("monster/Enemy" in i for i in ifc)
            print(f"    {eid:<40} {'Enemy: YES' if hit else 'Enemy: NO  <- hostile:true misses it'}")


def cmd_item(idx, pat):
    rx = re.compile(pat, re.I)
    hits = [(i, nm, m) for m, d in idx["mods"].items()
            for i, nm in d["items"].items() if rx.search(i) or rx.search(str(nm))]
    for i, nm, m in sorted(hits):
        print(f"  {i:<44} {str(nm)[:26]:<28} [{m}]")
    report(len(hits), f"item ~ /{pat}/")


def cmd_lang(idx, pat, only):
    rx = re.compile(pat, re.I)
    n = 0
    for m, d in sorted(idx["mods"].items()):
        if only and only != m:
            continue
        for bucket in ("entities", "items", "keybinds"):
            for k, v in d[bucket].items():
                if rx.search(k) or rx.search(str(v)):
                    print(f"  [{m}] {k:<46} {str(v)[:60]}")
                    n += 1
    report(n, f"lang ~ /{pat}/ (indexed keys only; use `grep` for full lang files)")


# A keybind id is NOT always `key.<mod>.<name>`. Iris registers
# `iris.keybind.reload`, and it is not in Iris's lang file at all - it only
# exists as a string in the class that calls KeyMapping. Indexing lang keys that
# start with "key." therefore misses it completely.
#
# This tool shipped with that exact bug and its own warning text about it. The
# first test run found zero Iris keybinds and printed the note explaining why.
KEYBIND_ID = re.compile(rb"(?:key\.[a-z0-9_]+\.[A-Za-z0-9_.]{2,30}"
                        rb"|[a-z0-9_]+\.keybind\.[A-Za-z0-9_.]{2,30})")


def cmd_keybinds(idx, pat, mods_dir, deep):
    rx = re.compile(pat, re.I) if pat else None
    seen: dict[str, tuple[str, str]] = {}
    for m, d in idx["mods"].items():
        for k, v in d["keybinds"].items():
            seen[k] = (str(v), m)

    # The lang index cannot see ids a mod never translates, so go to the classes.
    if deep or not any((not rx) or rx.search(k) or rx.search(v[0]) for k, v in seen.items()):
        print("  (deep scan: reading KeyMapping registrations from class files)",
              file=sys.stderr)
        for jp in jars(mods_dir):
            try:
                z = zipfile.ZipFile(jp)
            except Exception:
                continue
            for e in z.namelist():
                if not e.endswith(".class"):
                    continue
                try:
                    b = z.read(e)
                except Exception:
                    continue
                if b"KeyMapping" not in b:
                    continue
                for m2 in KEYBIND_ID.findall(b):
                    seen.setdefault(m2.decode(), ("", pathlib.Path(jp).name))

    n = 0
    for k, (v, m) in sorted(seen.items()):
        if rx and not (rx.search(k) or rx.search(v)):
            continue
        print(f"  {k:<46} {v[:32]:<34} [{m}]")
        n += 1
    report(n, "keybinds" + (f" ~ /{pat}/" if pat else ""))
    print("  NOTE: options.txt lines are `key_<id>`. Some mods do NOT prefix their")
    print("        ids with `key.` - Iris uses iris.keybind.reload, so the line is")
    print("        key_iris.keybind.reload. Searching for key.iris.* finds nothing.")


def cmd_grep(pat, mods_dir):
    raw = pat.encode()
    n = 0
    for jp in jars(mods_dir):
        try:
            z = zipfile.ZipFile(jp)
        except Exception:
            continue
        where = []
        for e in z.namelist():
            if e.endswith("/"):
                continue
            try:
                if raw in z.read(e):
                    where.append(e)
            except Exception:
                continue
            if len(where) > 3:
                break
        if where:
            print(f"  {pathlib.Path(jp).name[:50]:<52} {len(where)}+  {where[0]}")
            n += 1
    report(n, f"jars containing {pat!r}")


def cmd_owns(pat, mods_dir):
    """Which mod writes this config file?

    Configs are named two different ways and BOTH must be tried:
        epicfight-client.toml           -> the FILE names the mod
        servercore/config.yml           -> the DIRECTORY names the mod
    Only checking the filename returns nothing for the second form, which is how
    the first version of this command failed on the very file whose stale mob
    categories started this whole toolkit.
    """
    p = pathlib.Path(pat.replace("\\", "/"))
    cands = []
    stem = re.sub(r"\.(toml|json|json5|properties|cfg|yml|yaml)$", "", p.name, flags=re.I)
    stem = re.sub(r"[-_](client|server|common)$", "", stem, flags=re.I)
    cands.append(stem)
    if p.parent.name and p.parent.name not in (".", "config"):
        cands.append(p.parent.name)
    cands = [c for c in dict.fromkeys(cands) if c]
    print(f"  candidate names from {pat!r}: {cands}")

    def norm(s: str) -> str:
        return re.sub(r"[^a-z0-9]", "", s.lower())

    n = 0
    for jp in jars(mods_dir):
        try:
            z = zipfile.ZipFile(jp)
            names = z.namelist()
        except Exception:
            continue
        toml = next((c for c in TOMLS if c in names), None)
        if not toml:
            continue
        t = z.read(toml).decode("utf-8", "replace")
        modid = (re.search(r'modId\s*=\s*"([^"]+)"', t) or [None, "?"])[1]
        mn = norm(modid)
        for c in cands:
            cn = norm(c)
            if mn and cn and (mn == cn or cn.startswith(mn) or mn.startswith(cn)):
                print(f"    {modid:<26} {pathlib.Path(jp).name}   (matched {c!r})")
                n += 1
                break
    report(n, f"mod owning {pat!r}")


def cmd_interfaces(cls, mods_dir):
    target = cls if cls.endswith(".class") else cls + ".class"
    n = 0
    for jp in jars(mods_dir):
        try:
            z = zipfile.ZipFile(jp)
        except Exception:
            continue
        for e in z.namelist():
            if not e.endswith("/" + target) and e != target:
                continue
            ifc = class_interfaces(z.read(e))
            print(f"  {pathlib.Path(jp).name[:44]}")
            print(f"    {e}")
            print(f"    interfaces: {', '.join(ifc) if ifc else '(none)'}")
            n += 1
    report(n, f"class {cls}")


def cmd_data(pat, mods_dir):
    rx = re.compile(pat, re.I)
    n = 0
    for jp in jars(mods_dir):
        try:
            z = zipfile.ZipFile(jp)
        except Exception:
            continue
        hits = [e for e in z.namelist() if e.startswith("data/") and rx.search(e)]
        if hits:
            print(f"  {pathlib.Path(jp).name[:46]:<48} {len(hits):>4}  {hits[0]}")
            n += 1
    report(n, f"jars with data/ path ~ /{pat}/")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["mod", "deps", "entity", "item", "lang",
                                        "keybinds", "grep", "owns", "interfaces", "data"])
    ap.add_argument("pattern", nargs="?", default="")
    ap.add_argument("--mods")
    ap.add_argument("--client", action="store_true")
    ap.add_argument("--refresh", action="store_true")
    ap.add_argument("--mod", help="restrict `lang` to one modid")
    ap.add_argument("--deep", action="store_true",
                    help="keybinds: scan class files, not just lang keys")
    a = ap.parse_args()

    mods_dir = a.mods or (CLIENT_MODS if a.client else SERVER_MODS)
    if not pathlib.Path(mods_dir).is_dir():
        print(f"  no mods folder at {mods_dir}")
        return 1

    needs_index = a.command in ("mod", "deps", "entity", "item", "lang", "keybinds")
    idx = load_index(mods_dir, a.refresh) if needs_index else None

    if a.command == "mod":            cmd_mod(idx, a.pattern or ".")
    elif a.command == "deps":         cmd_deps(idx, a.pattern)
    elif a.command == "entity":       cmd_entity(idx, a.pattern, mods_dir)
    elif a.command == "item":         cmd_item(idx, a.pattern)
    elif a.command == "lang":         cmd_lang(idx, a.pattern, a.mod)
    elif a.command == "keybinds":     cmd_keybinds(idx, a.pattern, mods_dir, a.deep)
    elif a.command == "grep":         cmd_grep(a.pattern, mods_dir)
    elif a.command == "owns":         cmd_owns(a.pattern, mods_dir)
    elif a.command == "interfaces":   cmd_interfaces(a.pattern, mods_dir)
    elif a.command == "data":         cmd_data(a.pattern, mods_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
