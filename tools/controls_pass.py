#!/usr/bin/env python
"""controls_pass.py - rebuild options.txt keybinds so the core controls are safe.

    python tools/controls_pass.py            # dry run, prints every change
    python tools/controls_pass.py --write    # apply to the instance's options.txt

== WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT ==============================

Ethan, 2026-08-30: *"take a look at the mess of keybinds the game now has and rekey them
to something intuitive"*, then *"its fine if there are overlap if some of these keys are
conditional it's easier to move them to an overlapping key"*, and *"its about time we
stop tinkering"*.

**THE KEYBOARD IS SATURATED.** Every letter A-Z already carries at least one action;
there are ZERO free letters. With 317 mods that is not a mess to be tidied away, it is
the actual capacity of a keyboard. So this pass does NOT try to give everything its own
key. It makes the overlaps SAFE.

The rule it applies, which is Ethan's:

    Two actions may share a key if they can never fire in the same context.
    Two actions that CAN fire together must not share a key.

A GUI-only binding (JEI), a modifier declaration (Create's keyinfo), a mount control
(riding a hippocampus) and an equipment ability all pass that test against each other.
Push-to-talk and a melee swing do not.

== WHAT DOC 79 GOT WRONG, RECORDED SO IT IS NOT RE-DERIVED ====================

That audit said the 93 UNBOUND actions were path content made unreachable - "the two
mods with the most unbound keys are the two whose features a champion is told to go and
use".

**THAT WAS WRONG.** Reading the individual action names instead of the mod totals:

    occultism        17 unbound = familiar.bat, familiar.beaver, familiar.deer ...
                                  one summon slot PER FAMILIAR TYPE
    ars_nouveau      11 unbound = qc1 .. qc10, familiar_toggle    (quick-cast slots)
    irons_spellbooks 16 unbound = spell_quick_cast_1 .. _15       (loadout slots)

These are personal loadout slots. They are CORRECTLY unbound - a player binds the two or
three they actually use. Binding all 44 would be inventing four people's preferences for
them. Wall's ritual guidance ("Chalk first, love. A shape on the floor") needs no keybind
at all; it is chalk, placed by hand.

**So the count was right and the inference was wrong**, from reading mod names and totals
instead of the actions themselves. Measure at the point of use.

== WHY THE FULL REALLOCATION IS NOT HERE =====================================

The keyboard is full BECAUSE the pack has 317 mods, and Ethan's own next phase is the mod
cuts. Reallocating every key now and then cutting a third of the mods means doing it
twice and throwing the first one away. So this pass fixes what is BROKEN and leaves what
is merely CROWDED; the crowding is re-examined once the cuts free real estate.
"""
import argparse
import collections
import io
import os
import sys

INSTANCE = os.path.join(
    os.path.expanduser('~'), 'AppData', 'Roaming', 'PrismLauncher', 'instances',
    'CogsAndCadavers-PrismInstance (4)', '.minecraft', 'options.txt')

K = 'key.keyboard.'
UNBOUND = 'key.keyboard.unknown'

# -- 1. DEAD BINDINGS - mods with no jar in the instance -----------------------
# **Verified by grepping pw.toml CONTENTS, not filenames.** Matching on filenames claimed
# fxntstorage, pipeorgans and presencefootsteps were all missing; every one is present,
# under create-storage-neo-forge, create-sound-of-steam and pf-neoforge. Only these are
# genuinely absent, confirmed against the instance's own mods folder.
DEAD = [
    'key.metki.ping',
    'key.metki.hide_pings',
    'key.metki.ping_teleport',
    'simulated.keyinfo.rotate_mode',
]

# -- 2. THE CORE CONTROLS - nothing here may fire in the world -----------------
# Everything left co-located on a core key is GUI-only, a modifier declaration, or a
# mount control that only exists while you are riding the thing it belongs to. These two
# are neither: they fire in the world, on the keys you hold to move and to check who is
# online.
CORE_FIXES = {
    'key.create_sa.flying': K + 'left.bracket',            # was SPACE (jump)
    'hotKey.fxntstorage.compacting_wheel': K + 'right.bracket',   # was TAB (player list)
}

# -- 3. V IS PUSH-TO-TALK, AND IT WAS THE WORST KEY IN THE GAME ----------------
# **You HOLD V to speak.** It also carried a melee swing, a scope zoom, a spell cast, a
# quiver draw, an ender bag and two armour abilities - all world actions. So talking to
# your friends did up to seven other things at once, every time.
#
# Doc 79 asked "does V stay voice chat?" and the answer is yes: voice is the one binding
# everybody expects to be reliable, and the only one here that no mouse click replaces.
VOICE_EVICTIONS = {
    'key.tacz.melee.desc':                 K + 'apostrophe',
    'key.tacz.zoom.desc':                  K + 'period',
    'key.irons_spellbooks.spellbook_cast': K + 'comma',
    # NOT semicolon - pipeorgans' midi config already lives there, and the clash
    # check below caught it. K instead: its other tenants are a shader menu, a dev
    # command and a lich-only emote, so a quiver is the only combat action on it.
    'supplementaries.keybind.quiver':      K + 'k',
    'key.occultism.ender_bag':             K + 'minus',
    'key.cataclysm.ability':               K + 'keypad.1',
    'key.cataclysm.boots_ability':         K + 'keypad.2',
    'key.ars_nouveau.selection_hud':       K + 'keypad.3',
    'key.goety.witch.robe':                K + 'keypad.4',
}

# -- 4. ONE ACTION PER UNIVERSAL SCREEN ----------------------------------------
# **THREE BACKPACK MODS WERE ON B.** Whichever answered first is the one you got, and
# which one that is was never decided by anybody. B keeps occultism's backpack - it is
# Wall's path content and the one the pack actually hands out.
#
# G keeps curios and H keeps accessories, for the same reason: a key that opens an
# equipment screen must open ONE equipment screen.
SCREEN_EVICTIONS = {
    # B - the backpack you actually carry
    'hotKey.fxntstorage.toggle_backpack':      K + 'equal',
    'Open Backpack':                           K + 'backslash',
    'key.atmospherics.open':                   K + 'insert',
    'key.fieldguide.open':                     K + 'home',
    'key.emotecraft.fastchoose':               K + 'end',
    'Action Wheel Button':                     K + 'f8',
    # G - curios, the universal equipment screen
    'hotKey.fxntstorage.toggle_jetpack':       K + 'keypad.5',
    'key.goety.activate_curio':                K + 'keypad.0',
    # **TWO CURIO ACTIONS ON ONE KEY** - `curios.open` is the universal equipment
    # screen and must be the only thing G does. Group voice moves for the same
    # reason: it is not equipment and it is rare.
    'key.ars_nouveau.head_curio_hotkey':       K + 'keypad.multiply',
    'key.voice_chat_group':                    K + 'keypad.divide',
    # H - accessories
    'hotKey.fxntstorage.toggle_jetpack_hover': K + 'keypad.6',
    'desc.seasonhud.keybind.options':          K + 'keypad.7',
}

MOVES = {}
MOVES.update(CORE_FIXES)
MOVES.update(VOICE_EVICTIONS)
MOVES.update(SCREEN_EVICTIONS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--file', default=INSTANCE)
    args = ap.parse_args()

    if not os.path.exists(args.file):
        sys.stderr.write('options.txt not found: %s\n' % args.file)
        return 2

    with io.open(args.file, encoding='utf-8') as fh:
        lines = fh.read().split('\n')

    out = []
    changes = []
    dead_hit = []
    pending = dict(MOVES)

    for line in lines:
        if not line.startswith('key_'):
            out.append(line)
            continue
        name, _, val = line.partition(':')
        action = name[len('key_'):]

        if action in DEAD:
            # **A SECOND RUN MUST BE A TRUE NO-OP.** This branch used to report all four
            # dead bindings as changes on every run, including runs that changed nothing,
            # so "4 change(s)" was printed against an already-clean file. A tool that
            # cannot tell you it did nothing is a tool you stop reading.
            if val != UNBOUND:
                dead_hit.append(action)
                changes.append((action, val, UNBOUND + '   [mod not installed]'))
            out.append(name + ':' + UNBOUND)
            continue

        if action in MOVES:
            pending.pop(action, None)
            if val != MOVES[action]:
                out.append(name + ':' + MOVES[action])
                changes.append((action, val, MOVES[action]))
                continue

        out.append(line)

    # **A PLANNED MOVE THAT MATCHED NOTHING IS A SILENT NO-OP**, and that is the exact
    # class of failure this project keeps paying for. If a mod update renames an action,
    # it simply vanishes from options.txt and a naive version of this script reports
    # success having changed nothing at all.
    if pending:
        sys.stderr.write('!! %d planned move(s) matched NO entry in options.txt:\n'
                         % len(pending))
        for a in sorted(pending):
            sys.stderr.write('     %s\n' % a)
        sys.stderr.write('   a mod update may have renamed them - do not ignore this\n')

    # No two actions may be sent to the same destination key.
    landed = collections.defaultdict(list)
    for action, key in MOVES.items():
        if action not in pending:
            landed[key].append(action)
    clash = dict((k, v) for k, v in landed.items() if len(v) > 1)
    if clash:
        sys.stderr.write('!! two actions were sent to the same key:\n')
        for k, v in sorted(clash.items()):
            sys.stderr.write('     %s <- %s\n' % (k, ', '.join(sorted(v))))
        return 1

    print('%d change(s): %d moved, %d unbound as dead'
          % (len(changes), len(changes) - len(dead_hit), len(dead_hit)))
    for action, was, now in changes:
        print('  %-42s %-22s -> %s'
              % (action, was.replace(K, ''), now.replace(K, '')))

    if args.write:
        with io.open(args.file, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write('\n'.join(out))
        print('\nWROTE %s' % args.file)
    else:
        print('\n(dry run - pass --write to apply)')
    return 1 if pending else 0


if __name__ == '__main__':
    sys.exit(main())
