import re, pathlib, sys, datetime, collections
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

LOG = pathlib.Path(r"C:\MCServer\instance\logs\latest.log")
SS = pathlib.Path(r"C:\MCServer\repo\pack\kubejs\server_scripts")
OUT = pathlib.Path(r"C:\MCServer\repo\docs\48-EVERY-EVENT.md")

raw = LOG.read_text(encoding="utf-8", errors="replace")

# 1. the roster the server actually registered
ROW = re.compile(r"\[events\]   ([a-z]+)/([a-z_0-9]+) \[([^\]]+)\] :: (.+)")
evs = collections.OrderedDict()
for m in ROW.finditer(raw):
    god, eid, meta, does = m.group(1), m.group(2), m.group(3), m.group(4).strip()
    evs.setdefault(god, collections.OrderedDict())[eid] = {"meta": meta, "does": does}

# 2. the by-kind share the chart produces
share, dyn, never, untag = {}, {}, {}, {}
for m in re.finditer(r"\[events\] ([a-z]+) rolls BY KIND: (.+)", raw):
    share[m.group(1)] = m.group(2).strip()
for m in re.finditer(r"\[events\] ([a-z]+) has DYNAMIC bands[^:]*: (.+)", raw):
    dyn[m.group(1)] = m.group(2).strip()
for m in re.finditer(r"\[events\] ([a-z]+) will NEVER do: (.+?) \(set to 0", raw):
    never[m.group(1)] = m.group(2).strip()
for m in re.finditer(r"\[events\] !! ([a-z]+) has UNTAGGED events: (.+?) - they fall", raw):
    untag[m.group(1)] = m.group(2).strip()

# 3. kind per event, from the source (the log line does not carry it)
kinds = {}
for f in SS.glob("*_events.js"):
    god = f.name.replace("_events.js", "")
    for m in re.finditer(r"id: '([a-z_0-9]+)', kind: '([a-z]+)'",
                         f.read_text(encoding="utf-8")):
        kinds[(god, m.group(1))] = m.group(2)

NAME = {"blade": "BLADE - the Warrior", "wall": "WALL - the Spider",
        "salvage": "SALVAGE - the Wolf"}
COLOUR = {"blade": "dark red", "wall": "dark purple", "salvage": "gold"}
KINDNAME = {
    "challenge": "Challenge", "duel": "Duel", "buff": "Buff", "boon": "Boon",
    "invade": "Invade", "attack": "Attack", "aid": "Aid", "support": "Support",
    "assassination": "Assassination", "contract": "Contract", None: "-",
}

o = []
w = o.append
w("# EVERY EVENT THAT CAN FIRE\n")
w("**Generated from the boot log**, not from the source - so this is what the server")
w("ACTUALLY registered on its last start, which is the only version that matters.")
w("Anything registered but silently dropped would be missing here, and that is the point.\n")
w("Regenerate after any change: restart, then re-run the generator.\n")
w("> Read with `docs/23` §VI.0 (the taxonomy) and each god's own doc - `40` Blade,")
w("> `43` Wall, `44` Salvage.\n")
tot = sum(len(v) for v in evs.values())
w("**%d events across %d gods.** Boot of %s.\n" %
  (tot, len(evs), datetime.datetime.fromtimestamp(LOG.stat().st_mtime).strftime("%Y-%m-%d %H:%M")))

w("---\n")
w("## How one is chosen\n")
w("Two stages, every time:\n")
w("1. **A KIND is drawn** from that god's column in the chart. A god who is `0` in a")
w("   kind can never roll it, no matter how many events sit there.")
w("2. **An event is drawn from inside that kind**, by its own weight.\n")
w("Before either, an event must pass **all** of: its tier is live · its own cooldown ·")
w("the 4-day scene budget if it is a cutscene · the health floor if it is `hostile` ·")
w("and its own `guard`. Failing any of those removes it from the draw entirely.\n")

for god in ("blade", "wall", "salvage"):
    if god not in evs:
        continue
    w("---\n")
    w("# %s\n" % NAME[god])
    w("*%s* - **%d events**\n" % (COLOUR[god], len(evs[god])))
    if god in share:
        w("**Roll share by kind:** %s\n" % share[god])
    if god in dyn:
        w("**Dynamic bands** (they move with her own counter, so no fixed share exists):")
        w("%s\n" % dyn[god])
    if god in never:
        w("**Will never do:** %s\n" % never[god])
    if god in untag:
        w("> WARNING - **untagged, so they fall into `misc` at the lowest band:** %s\n"
          % untag[god])

    by = collections.OrderedDict()
    for eid, d in evs[god].items():
        by.setdefault(kinds.get((god, eid)), []).append((eid, d))
    for kind in sorted(by, key=lambda k: (k is None, k or "")):
        w("### %s\n" % KINDNAME.get(kind, kind))
        w("| event | when it can fire | what it does |")
        w("|---|---|---|")
        for eid, d in by[kind]:
            meta = d["meta"]
            does = d["does"]
            held = " **HELD**" if "HELD" in does else ""
            w("| `%s`%s | %s | %s |" % (eid, held, meta, does.replace("|", "/")))
        w("")

w("---\n")
w("## Held, and why\n")
held = [(g, e) for g in evs for e, d in evs[g].items() if "HELD" in d["does"]]
if held:
    w("These are **built and registered but refuse to fire** - their line pools are")
    w("empty and `voice.js`'s rule is that a caller must never substitute its own text.")
    w("An event that runs mute is worse than one that waits.\n")
    for g, e in held:
        w("* `%s/%s`" % (g, e))
    w("\nSheets for the missing lines: **`docs/45` §12**.\n")
else:
    w("Nothing is currently held.\n")

OUT.write_text("\n".join(o), encoding="utf-8")
print("wrote %s" % OUT)
print("%d events: %s" % (tot, ", ".join("%s=%d" % (g, len(v)) for g, v in evs.items())))
