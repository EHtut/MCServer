#!/usr/bin/env python3
"""genq - ask the WORLD what generated, instead of asking the configs what should have.

WHY THIS EXISTS
---------------
"The underground is barren" is a claim about generated blocks. Every other way of
checking it is indirect:

  * reading datapack JSON tells you what was CONFIGURED, not what landed;
  * reading a mod jar tells you what a feature COULD place;
  * flying around in creative is a sample of one, biased toward where you flew.

This reads the region files - the actual saved chunks - and counts blocks per Y
band. It is the only check in this repo that can distinguish "the config is
wrong" from "the config is right and the world still came out empty".

It matters here specifically because `mcserver_depth` moved the world floor from
vanilla's -64 to -128. Vanilla ore placements are anchored with a mix of
`absolute` and `above_bottom` heights, and only the `above_bottom` ones follow a
moved floor. Any ore anchored absolutely stops where vanilla's floor used to be,
leaving a band of solid stone below it that looks exactly like "barren".

DESIGN RULES (shared with mcq.py / logq.py / world.py)
-----------------------------------------------------
  * Zero matches prints that it does NOT prove absence, and says how much was
    actually sampled. A silent 0 is the failure mode every tool here is written
    against.
  * "could not read" and "found nothing" are never the same value. Unreadable
    chunks are counted and reported separately.
  * READ ONLY. It opens region files with mode 'rb' and never writes. It is safe
    to run against a live server: partially-written chunks fail to parse and are
    reported as unreadable rather than crashing the run.

USAGE
    python tools/genq.py ores   [--chunks N] [--world PATH]
    python tools/genq.py air    [--chunks N]
    python tools/genq.py block <substring> [--chunks N]
"""

import argparse
import gzip
import os
import struct
import sys
import zlib
from collections import defaultdict

WORLD = r"C:\MCServer\instance\world"
BAND = 16  # report granularity in blocks

# ---------------------------------------------------------------------------
# NBT
# ---------------------------------------------------------------------------

TAG_END, TAG_BYTE, TAG_SHORT, TAG_INT, TAG_LONG = 0, 1, 2, 3, 4
TAG_FLOAT, TAG_DOUBLE, TAG_BYTE_ARRAY, TAG_STRING = 5, 6, 7, 8
TAG_LIST, TAG_COMPOUND, TAG_INT_ARRAY, TAG_LONG_ARRAY = 9, 10, 11, 12


class NBTReader:
    """Minimal big-endian NBT reader.

    Written by hand rather than pulled from a package: this repo's tooling has
    no dependency install step, and a parser that only has to read is small
    enough that vendoring it beats adding one.
    """

    def __init__(self, buf):
        self.b = buf
        self.i = 0

    def u1(self):
        v = self.b[self.i]
        self.i += 1
        return v

    def i1(self):
        v = struct.unpack_from(">b", self.b, self.i)[0]
        self.i += 1
        return v

    def i2(self):
        v = struct.unpack_from(">h", self.b, self.i)[0]
        self.i += 2
        return v

    def i4(self):
        v = struct.unpack_from(">i", self.b, self.i)[0]
        self.i += 4
        return v

    def i8(self):
        v = struct.unpack_from(">q", self.b, self.i)[0]
        self.i += 8
        return v

    def string(self):
        n = struct.unpack_from(">H", self.b, self.i)[0]
        self.i += 2
        s = self.b[self.i:self.i + n].decode("utf-8", "replace")
        self.i += n
        return s

    def payload(self, tag):
        if tag == TAG_BYTE:
            return self.i1()
        if tag == TAG_SHORT:
            return self.i2()
        if tag == TAG_INT:
            return self.i4()
        if tag == TAG_LONG:
            return self.i8()
        if tag == TAG_FLOAT:
            v = struct.unpack_from(">f", self.b, self.i)[0]
            self.i += 4
            return v
        if tag == TAG_DOUBLE:
            v = struct.unpack_from(">d", self.b, self.i)[0]
            self.i += 8
            return v
        if tag == TAG_BYTE_ARRAY:
            n = self.i4()
            v = self.b[self.i:self.i + n]
            self.i += n
            return v
        if tag == TAG_STRING:
            return self.string()
        if tag == TAG_LIST:
            it = self.u1()
            n = self.i4()
            return [self.payload(it) for _ in range(max(0, n))]
        if tag == TAG_COMPOUND:
            out = {}
            while True:
                t = self.u1()
                if t == TAG_END:
                    return out
                # The name MUST be read into a local first.
                #   out[self.string()] = self.payload(t)
                # is wrong: Python evaluates the right-hand side before the
                # subscript, so payload() consumed the bytes where the name
                # lives and string() then read a length field out of the
                # payload - yielding a 65KB binary "key" and an unparseable
                # stream. The bytes were correct the entire time; the reader
                # was walking them in the wrong order.
                key = self.string()
                out[key] = self.payload(t)
        if tag == TAG_INT_ARRAY:
            n = self.i4()
            v = list(struct.unpack_from(">%di" % n, self.b, self.i))
            self.i += 4 * n
            return v
        if tag == TAG_LONG_ARRAY:
            n = self.i4()
            v = list(struct.unpack_from(">%dq" % n, self.b, self.i))
            self.i += 8 * n
            return v
        raise ValueError("unknown NBT tag %d at %d" % (tag, self.i))

    def root(self):
        t = self.u1()
        if t != TAG_COMPOUND:
            raise ValueError("root is tag %d, not compound" % t)
        self.string()
        return self.payload(TAG_COMPOUND)


# ---------------------------------------------------------------------------
# region files
# ---------------------------------------------------------------------------

def iter_chunks(path, want):
    """Yield up to `want` parsed chunk roots from one .mca. Also yields failures.

    Yields (root, None) on success and (None, reason) on failure, so the caller
    can keep the two apart - a run where half the chunks failed to decompress
    must not read as a run where half the world is empty.
    """
    with open(path, "rb") as fh:
        header = fh.read(4096)
        if len(header) < 4096:
            yield None, "header truncated"
            return
        entries = []
        for n in range(1024):
            off = struct.unpack_from(">I", header, n * 4)[0]
            sectors, offset = off & 0xFF, off >> 8
            if offset and sectors:
                entries.append((offset, sectors))
        # Deterministic sample: stride the list so we spread across the region
        # rather than reading one corner of it.
        if want < len(entries):
            step = len(entries) / float(want)
            entries = [entries[int(k * step)] for k in range(want)]
        for offset, sectors in entries:
            try:
                fh.seek(offset * 4096)
                blob = fh.read(sectors * 4096)
                length = struct.unpack_from(">I", blob, 0)[0]
                comp = blob[4]
                data = blob[5:4 + length]
                if comp == 1:
                    data = gzip.decompress(data)
                elif comp == 2:
                    data = zlib.decompress(data)
                elif comp == 3:
                    pass
                else:
                    yield None, "compression type %d" % comp
                    continue
                yield NBTReader(data).root(), None
            except Exception as exc:
                yield None, type(exc).__name__


def decode_section(sec):
    """Return (palette_names, counts_per_palette_index) for one 16^3 section."""
    bs = sec.get("block_states")
    if not isinstance(bs, dict):
        return None, None
    palette = bs.get("palette") or []
    names = [p.get("Name", "?") if isinstance(p, dict) else "?" for p in palette]
    if not names:
        return None, None
    data = bs.get("data")
    if not data:
        # No data array means the whole section is palette entry 0. This is the
        # common case for solid stone and for empty air, so it must be handled -
        # skipping it would under-count exactly the bands we care most about.
        counts = [0] * len(names)
        counts[0] = 4096
        return names, counts

    bits = max(4, (len(names) - 1).bit_length())
    per_long = 64 // bits
    mask = (1 << bits) - 1
    counts = [0] * len(names)
    idx = 0
    for word in data:
        w = word & 0xFFFFFFFFFFFFFFFF
        for slot in range(per_long):
            if idx >= 4096:
                break
            v = (w >> (slot * bits)) & mask
            if v < len(counts):
                counts[v] += 1
            idx += 1
        if idx >= 4096:
            break
    return names, counts


# ---------------------------------------------------------------------------
# scan
# ---------------------------------------------------------------------------

def scan(world, chunk_budget, match):
    """match(name) -> bucket label or None. Returns (per-band Counter, stats)."""
    rdir = os.path.join(world, "region")
    # Zero-byte region files are the overwhelming majority - 340 of 376 in this
    # world. They are placeholders for regions the server has touched but never
    # generated. Counting them in the budget split the sample 376 ways and left
    # 2 chunks each for the four files that actually hold the world.
    files = sorted(f for f in os.listdir(rdir)
                   if f.endswith(".mca")
                   and os.path.getsize(os.path.join(rdir, f)) > 4096)
    if not files:
        return None, {"error": "no non-empty .mca files in %s" % rdir}

    per_file = max(1, chunk_budget // len(files))
    bands = defaultdict(lambda: defaultdict(int))   # band -> label -> count
    volume = defaultdict(int)                       # band -> blocks sampled
    stats = {"chunks": 0, "unreadable": 0, "sections": 0, "partial": 0,
             "reasons": defaultdict(int)}

    for name in files:
        for root, err in iter_chunks(os.path.join(rdir, name), per_file):
            if err:
                stats["unreadable"] += 1
                stats["reasons"][err] += 1
                continue

            # ONLY fully-generated chunks count.
            #
            # A region file legitimately contains chunks the server saved before
            # finishing them - the frontier of wherever anyone has flown. They
            # carry a full section list of pure air, no terrain and no bedrock at
            # any height.
            #
            # In this world they are the MAJORITY: 170 of 276 sampled. Counting
            # them divided every density figure by ~2.6 and produced a band of
            # "exactly 696320 air blocks" that looked like a 64-block void under
            # the map. The world was fine; the sample was not. Densities are
            # meaningless unless the denominator is real terrain.
            status = root.get("Status")
            if status is not None and status != "minecraft:full":
                stats["partial"] += 1
                continue
            stats["chunks"] += 1
            for sec in root.get("sections") or []:
                y = sec.get("Y")
                if y is None:
                    continue
                names, counts = decode_section(sec)
                if not names:
                    continue
                stats["sections"] += 1
                base = y * 16
                band = (base // BAND) * BAND
                volume[band] += sum(counts)
                for nm, c in zip(names, counts):
                    if not c:
                        continue
                    label = match(nm)
                    if label:
                        bands[band][label] += c
    return (bands, volume), stats


# ---------------------------------------------------------------------------
# report
# ---------------------------------------------------------------------------

def report(title, bands, volume, stats, note):
    print("=" * 74)
    print(title)
    print("=" * 74)
    print("sampled %d FULLY-GENERATED chunks, %d sections"
          % (stats["chunks"], stats["sections"]))
    print("  skipped: %d partially-generated, %d unreadable"
          % (stats["partial"], stats["unreadable"]))
    if stats["unreadable"]:
        for r, n in sorted(stats["reasons"].items(), key=lambda kv: -kv[1]):
            print("    %-24s %d" % (r, n))
    print()

    all_bands = sorted(set(list(bands.keys()) + list(volume.keys())), reverse=True)
    if not all_bands:
        print("  NOTHING SAMPLED. This does NOT prove the world is empty - it means")
        print("  the scan read no sections at all. Check --world and region perms.")
        return

    labels = sorted({l for b in bands.values() for l in b})
    total = sum(sum(b.values()) for b in bands.values())

    head = "  %-12s %10s  %8s   %s" % ("Y band", "sampled", "per 1k", "breakdown")
    print(head)
    print("  " + "-" * (len(head) - 2))
    for band in all_bands:
        vol = volume.get(band, 0)
        got = sum(bands.get(band, {}).values())
        rate = (got * 1000.0 / vol) if vol else 0.0
        parts = sorted(bands.get(band, {}).items(), key=lambda kv: -kv[1])[:5]
        detail = "  ".join("%s=%d" % (k.split(":")[-1], v) for k, v in parts)
        flag = ""
        if vol and got == 0:
            flag = "   <-- NOTHING"
        print("  %-12s %10d  %8.2f   %s%s"
              % ("%d..%d" % (band, band + BAND - 1), vol, rate, detail, flag))

    print()
    if total == 0:
        print("  ZERO matches across %d sampled chunks." % stats["chunks"])
        print("  This does NOT prove absence - it proves absence IN THE SAMPLE.")
        print("  Widen with --chunks, and remember only generated chunks exist on disk.")
    else:
        print("  %d matching blocks across %d labels." % (total, len(labels)))
    if note:
        print()
        print(note)


ORES = (
    "ore", "_gem", "raw_", "ancient_debris", "quartz",
)
ORE_SKIP = ("ore_block", "storage", "brick")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["ores", "air", "block"])
    ap.add_argument("needle", nargs="?", help="substring, for `block` mode")
    ap.add_argument("--chunks", type=int, default=1200)
    ap.add_argument("--world", default=WORLD)
    a = ap.parse_args()

    if a.mode == "ores":
        def match(n):
            low = n.lower()
            if any(s in low for s in ORE_SKIP):
                return None
            return n if any(t in low for t in ORES) else None
        title = "ORE DENSITY BY DEPTH"
        note = ("  Read this as: which bands have ore at all, and does the rate\n"
                "  fall off below a specific Y. A cliff at exactly -64 means ore\n"
                "  placements are anchored to vanilla's old floor and did not\n"
                "  follow mcserver_depth down to -128.")
    elif a.mode == "air":
        def match(n):
            return n if n in ("minecraft:air", "minecraft:cave_air", "minecraft:water",
                              "minecraft:lava") else None
        title = "OPEN SPACE BY DEPTH  (cave volume proxy)"
        note = ("  Below sea level, open space is caves. A band that is ~0 open is\n"
                "  solid stone - nothing to explore and nowhere for mobs to spawn,\n"
                "  which reads to a player as both 'barren' and 'not dangerous'.")
    else:
        if not a.needle:
            ap.error("block mode needs a substring")
        needle = a.needle.lower()

        def match(n):
            return n if needle in n.lower() else None
        title = "BLOCKS MATCHING %r BY DEPTH" % a.needle
        note = None

    got, stats = scan(a.world, a.chunks, match)
    if got is None:
        print("ERROR:", stats["error"], file=sys.stderr)
        return 2
    bands, volume = got
    report(title, bands, volume, stats, note)
    return 0


if __name__ == "__main__":
    sys.exit(main())
