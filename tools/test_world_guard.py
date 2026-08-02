import sys
sys.path.insert(0, r"C:\MCServer\repo\tools")
import world

CASES = [
    # (command, should_be_allowed)
    ("list", True),
    ("data get entity Lehykt Pos", True),
    ("time query daytime", True),
    ("execute as Lehykt at @s run execute if entity @e[type=zombie,distance=..8]", True),
    ("execute positioned 0 64 0 run data get block 0 64 0", True),
    # writes that must never get through
    ("kill @a", False),
    ("ban Lehykt", False),
    ("stop", False),
    ("gamemode creative Lehykt", False),
    ("data merge entity Lehykt {Health:1f}", False),
    ("op Lehykt", False),
    # the hole the guard originally had
    ("execute as @a run kill @a", False),
    ("execute at @p run setblock ~ ~ ~ tnt", False),
    ("execute as @a run execute at @s run kill @e", False),
]

fails = 0
for cmd, want in CASES:
    got = world._allowed(cmd)
    ok = (got == want)
    if not ok:
        fails += 1
    print(f"  {'ok ' if ok else 'FAIL'}  {'allow' if got else 'REFUSE':<6} "
          f"(want {'allow' if want else 'REFUSE'})  {cmd[:60]}")
print(f"\n  {len(CASES) - fails}/{len(CASES)} passed")
raise SystemExit(1 if fails else 0)
