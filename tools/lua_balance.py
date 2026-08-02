"""Balance Lua blocks after stripping comments and string literals.

Not a parser, but it catches the failure that matters: an unbalanced block.
A Lua syntax error takes the WHOLE Figura avatar down, and the only place the
error surfaces is in-game chat - so it is worth catching before it loads.
"""
import pathlib
import re
import sys

src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")

s = re.sub(r"--\[\[.*?\]\]", " ", src, flags=re.S)   # long comments
s = re.sub(r"--[^\n]*", " ", s)                       # line comments
s = re.sub(r'"[^"\n]*"', '""', s)                     # double-quoted strings
s = re.sub(r"'[^'\n]*'", "''", s)                     # single-quoted strings

tokens = re.findall(r"[A-Za-z_]+|[()]", s)

stack = []
opens = closes = 0
for t in tokens:
    if t == "function" or t == "if" or t == "do":
        # for/while are closed by their own `do`, so counting `do` alone is right
        stack.append(t)
        opens += 1
    elif t == "end":
        closes += 1
        if stack:
            stack.pop()
        else:
            print("  !! an 'end' with nothing open")

po, pc = s.count("("), s.count(")")
print(f"  block openers (function/if/do) : {opens}")
print(f"  'end' tokens                   : {closes}")
print(f"  unclosed at EOF                : {len(stack)} {stack if stack else ''}")
print(f"  parens                         : {po} open / {pc} close")
ok = not stack and po == pc and opens == closes
print()
print("  VERDICT:", "BALANCED - safe to load" if ok else "IMBALANCED - fix before loading")
sys.exit(0 if ok else 1)
