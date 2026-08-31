#!/usr/bin/env python
"""story_import.py - ONE story document format, ONE importer.

    python tools/story_import.py                    # parse and report, write nothing
    python tools/story_import.py --write            # emit the registration script
    python tools/story_import.py --doc <file>       # a single document
    python tools/story_import.py --selftest         # parse the worked example, no files

== WHY THIS EXISTS =============================================================

There are two bespoke importers, one per document shape:

    bicker_import.py    scenes of turns   docs/dialogue/Bickering Doc *.txt
    opening_import.py   flat prose        docs/dialogue/Player intros.txt

Both parse a format that exists only in their own head, and both emit a .js file only
they can produce. Adding a third kind of content meant writing a third parser - which is
the definition of a dedicated function rather than a tool.

⭐ Ethan, 2026-08-30: *"we turn them from dedicated functions into tools."* One format,
one parser, and a project can add content without adding code.

⛔ THE OLD IMPORTERS ARE UNTOUCHED and still own their documents. This runs alongside
them until it has been proven on real content. Nothing is migrated by this commit -
migrating live dialogue while Ethan cannot test is the exact move that cost a session.

== THE FORMAT ==================================================================

Plain text. Readable in a diff, writable without a manual:

    # speaker: narrator
      colour: §7
      style: anchor=TOP_LEFT, typewriter=true

    ## greeting
    You again.
    Still here, then.

    ## warning
    Go back while you can.

    # scene: act0-arrival
    narrator: You were a traveler.
    narrator: A life of adventure before you.

RULES, and each one is here because something broke without it:

  · `# speaker: <id>` opens a speaker. Indented `key: value` lines under it are its
    settings; `style:` takes comma-separated `k=v` pairs.
  · `## <tag>` opens a pool. Every following non-blank line is one line of dialogue.
  · `# scene: <id>` opens a scene. Lines are `<speaker>: <text>`.
  · A blank line ends nothing. Only a new `#` or `##` heading does. **Ethan writes in
    paragraphs**, and a format that treated blank lines as terminators would silently
    truncate at the first one.
  · ⭐ ONE SENTENCE PER LINE is a HARD RULE (his, stated repeatedly). The renderer shows
    one line per message, so a line carrying two sentences arrives as a wrapped
    paragraph. This REFUSES the document rather than emitting something that renders
    wrong - see `speaker.js` for the same check at runtime.
  · A line beginning `[CLAUDE-DRAFT]` is placeholder text. It is counted and reported so
    the debt is visible; it is NOT silently dropped, because a pool that goes quietly
    empty looks identical to a system that is switched off.
"""
import argparse
import io
import json
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs", "dialogue")
OUT = os.path.join(ROOT, "pack", "kubejs", "server_scripts", "story_content.js")

DRAFT = "[CLAUDE-DRAFT]"

EXAMPLE = """# speaker: narrator
  colour: §7
  style: anchor=TOP_LEFT, typewriter=true

## greeting
You again.
Still here, then.

## warning
Go back while you can.

# scene: act0-arrival
narrator: You were a traveler.
narrator: A life of adventure before you.
"""


class StoryError(Exception):
    pass


def split_sentences(text):
    """The engine's own rule, so the importer and the runtime agree.

    ⚠️ voice.sentences() breaks on a terminator followed by whitespace. This must match
    it exactly - an importer that accepted what the runtime later refuses would move the
    failure from write time to play time, which is the worse of the two.
    """
    parts = re.findall(r"[^.!?]+[.!?]+|[^.!?]+$", text)
    return [" ".join(p.split()) for p in parts if p.strip()]


def parse(text, source="<string>"):
    """Parse a story document. Raises StoryError with a line number on bad input."""
    speakers, scenes = {}, {}
    cur_speaker, cur_tag, cur_scene = None, None, None
    drafts = 0

    for n, raw in enumerate(text.split("\n"), 1):
        line = raw.rstrip()
        if not line.strip():
            continue

        m = re.match(r"^#\s*speaker:\s*(\S+)\s*$", line)
        if m:
            cur_speaker = m.group(1)
            cur_scene, cur_tag = None, None
            speakers.setdefault(cur_speaker, {"lines": {}, "settings": {}})
            continue

        m = re.match(r"^#\s*scene:\s*(\S+)\s*$", line)
        if m:
            cur_scene = m.group(1)
            cur_speaker, cur_tag = None, None
            scenes.setdefault(cur_scene, [])
            continue

        m = re.match(r"^##\s*(\S+)\s*$", line)
        if m:
            if not cur_speaker:
                raise StoryError("%s:%d a pool (## %s) before any speaker"
                                 % (source, n, m.group(1)))
            cur_tag = m.group(1)
            speakers[cur_speaker]["lines"].setdefault(cur_tag, [])
            continue

        # an indented setting under a speaker
        if cur_speaker and cur_tag is None and re.match(r"^\s+\S+:", raw):
            key, _, val = line.strip().partition(":")
            speakers[cur_speaker]["settings"][key.strip()] = val.strip()
            continue

        body = line.strip()
        if body.startswith(DRAFT):
            drafts += 1

        # ⭐ THE HARD RULE, enforced at write time.
        check = body[len(DRAFT):].strip() if body.startswith(DRAFT) else body
        if len(split_sentences(check)) > 1:
            raise StoryError(
                "%s:%d TWO SENTENCES ON ONE LINE - the renderer shows one line per "
                "message, so this would arrive as a wrapped paragraph. Split it:\n"
                "    %s" % (source, n, body[:90]))

        if cur_scene:
            if ":" not in body:
                raise StoryError("%s:%d a scene line needs '<speaker>: <text>'\n    %s"
                                 % (source, n, body[:90]))
            who, _, said = body.partition(":")
            scenes[cur_scene].append({"speaker": who.strip(), "text": said.strip()})
        elif cur_speaker and cur_tag:
            speakers[cur_speaker]["lines"][cur_tag].append(body)
        else:
            raise StoryError("%s:%d text outside any speaker pool or scene\n    %s"
                             % (source, n, body[:90]))

    return {"speakers": speakers, "scenes": scenes, "drafts": drafts}


def parse_style(raw):
    """`anchor=TOP_LEFT, typewriter=true` -> a dict with real types."""
    out = {}
    for pair in (raw or "").split(","):
        if "=" not in pair:
            continue
        k, _, v = pair.partition("=")
        k, v = k.strip(), v.strip()
        if v.lower() in ("true", "false"):
            out[k] = (v.lower() == "true")
        else:
            try:
                out[k] = float(v) if "." in v else int(v)
            except ValueError:
                out[k] = v
    return out


def emit(parsed):
    """Emit a registration script that calls the GENERAL speaker tool."""
    lines = [
        "// story_content.js - GENERATED by tools/story_import.py. Do not hand-edit.",
        "//",
        "// Registers content through the GENERAL speaker tool, so a project adds a story",
        "// document rather than a parser. The format is documented in story_import.py.",
        "//",
        "// ⚠️ ONE SENTENCE PER LINE was verified at import time - the renderer shows one",
        "// line per message, so a two-sentence line would arrive as a wrapped paragraph.",
        "var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};",
        "",
        ";(function () {",
        "  var TAG = '[story] '",
        "",
        "  var SPEAKERS = " + json.dumps(
            {sid: {"colour": s["settings"].get("colour"),
                   "style": parse_style(s["settings"].get("style")),
                   "lines": s["lines"]}
             for sid, s in parsed["speakers"].items()},
            indent=4, ensure_ascii=False).replace("\n", "\n  "),
        "",
        "  var SCENES = " + json.dumps(parsed["scenes"], indent=4,
                                       ensure_ascii=False).replace("\n", "\n  "),
        "",
        "  VELDORA.story = {",
        "    speakers: function () { return SPEAKERS },",
        "    scenes: function () { return SCENES },",
        "  }",
        "",
        "  ServerEvents.loaded(function () {",
        "    if (!VELDORA.speaker) {",
        "      console.error(TAG + 'speaker.js is not loaded - no story content registered')",
        "      return",
        "    }",
        "    var n = 0",
        "    for (var id in SPEAKERS) {",
        "      if (!SPEAKERS.hasOwnProperty(id)) continue",
        "      if (VELDORA.speaker.define(id, SPEAKERS[id])) n++",
        "    }",
        "    console.info(TAG + n + ' speaker(s) registered from the story document')",
        "  })",
        "})();",
        "",
    ]
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--doc", default=None)
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        try:
            p = parse(EXAMPLE, "<example>")
        except StoryError as e:
            print("SELFTEST FAILED: the worked example does not parse\n  %s" % e)
            return 1
        okc = 0

        def check(label, got, want):
            nonlocal okc
            if got == want:
                okc += 1
                print("  ok   %s" % label)
            else:
                print("  FAIL %s\n         got %r  want %r" % (label, got, want))

        check("one speaker", list(p["speakers"]), ["narrator"])
        check("two pools", sorted(p["speakers"]["narrator"]["lines"]), ["greeting", "warning"])
        check("two greeting lines", len(p["speakers"]["narrator"]["lines"]["greeting"]), 2)
        check("one scene", list(p["scenes"]), ["act0-arrival"])
        check("two turns", len(p["scenes"]["act0-arrival"]), 2)
        check("the turn names its speaker", p["scenes"]["act0-arrival"][0]["speaker"], "narrator")
        check("settings parsed", p["speakers"]["narrator"]["settings"]["colour"], "§7")
        check("style typed", parse_style("anchor=TOP_LEFT, typewriter=true")["typewriter"], True)

        # 🚨 THE RULE, with a negative control - a parser that accepted everything would
        # pass every check above.
        try:
            parse("# speaker: n\n## t\nOne sentence. And a second.\n", "<bad>")
            print("  FAIL two sentences on one line were ACCEPTED")
        except StoryError as e:
            okc += 1
            print("  ok   two sentences on one line are refused, with a line number")
            if "TWO SENTENCES" not in str(e):
                print("  FAIL ...but the message does not say why")

        # ⚠️ A blank line must NOT end a pool - Ethan writes in paragraphs.
        p2 = parse("# speaker: n\n## t\nFirst.\n\nSecond.\n", "<paras>")
        check("a blank line does not end a pool", len(p2["speakers"]["n"]["lines"]["t"]), 2)

        print("\n%d checks passed" % okc)
        return 0

    docs = [a.doc] if a.doc else sorted(
        os.path.join(DOCS, f) for f in os.listdir(DOCS)
        if f.lower().endswith(".story.txt")) if os.path.isdir(DOCS) else []

    if not docs:
        print("no *.story.txt documents in %s" % DOCS)
        print("⚠️  The old importers still own the existing documents; this format is")
        print("   opt-in per document until it has been proven on real content.")
        return 0

    total = {"speakers": {}, "scenes": {}, "drafts": 0}
    for d in docs:
        try:
            p = parse(io.open(d, encoding="utf-8").read(), os.path.basename(d))
        except StoryError as e:
            print("REFUSED %s\n  %s" % (d, e))
            return 1
        total["speakers"].update(p["speakers"])
        total["scenes"].update(p["scenes"])
        total["drafts"] += p["drafts"]
        print("  %-40s %d speaker(s), %d scene(s)"
              % (os.path.basename(d), len(p["speakers"]), len(p["scenes"])))

    if total["drafts"]:
        print("\n⚠️  %d line(s) are still [CLAUDE-DRAFT] placeholders. They are counted, "
              "not dropped - a pool that goes quietly empty looks exactly like a system "
              "that is switched off." % total["drafts"])

    if a.write:
        io.open(OUT, "w", encoding="utf-8", newline="\n").write(emit(total))
        print("\nwrote %s" % OUT)
    else:
        print("\n(dry run - pass --write to emit the registration script)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
