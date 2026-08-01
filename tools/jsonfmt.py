"""Compact JSON writer for the hand-edited manifests.

json.dumps(indent=2) turns ["slug", "why", "tier"] into five lines, which makes
a 400-entry modlist unreadable and its diffs useless. A mod is one row; it
should be one line. Anything else stays conventionally indented.
"""

from __future__ import annotations

import json


def dumps(obj, indent: int = 2) -> str:
    return _fmt(obj, indent, 0)


def _inline(obj) -> bool:
    """A list of plain scalars is a row - keep it on one line."""
    return isinstance(obj, list) and all(
        isinstance(x, (str, int, float, bool)) or x is None for x in obj
    )


def _fmt(obj, indent: int, depth: int) -> str:
    pad = " " * (indent * depth)
    inner = " " * (indent * (depth + 1))

    if _inline(obj):
        return json.dumps(obj, ensure_ascii=False)

    if isinstance(obj, list):
        if not obj:
            return "[]"
        parts = [inner + _fmt(v, indent, depth + 1) for v in obj]
        return "[\n" + ",\n".join(parts) + "\n" + pad + "]"

    if isinstance(obj, dict):
        if not obj:
            return "{}"
        parts = [
            f"{inner}{json.dumps(k, ensure_ascii=False)}: {_fmt(v, indent, depth + 1)}"
            for k, v in obj.items()
        ]
        return "{\n" + ",\n".join(parts) + "\n" + pad + "}"

    return json.dumps(obj, ensure_ascii=False)


def write(path, obj, indent: int = 2) -> None:
    path.write_text(dumps(obj, indent) + "\n", encoding="utf-8")
