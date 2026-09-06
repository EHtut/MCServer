#!/usr/bin/env python
"""make_journal.py - build the in-game journal, the Modonomicon book `veldora`.

    python tools/make_journal.py            report what it would write
    python tools/make_journal.py --write    write it

== WHY THIS REPLACED A WRITTEN BOOK =========================================

Ethan, 2026-09-06, on finding the guidebook in his hotbar instead of the journal that
never arrived:

    "this is amazing and a game changer and can hold the journal entries, let me add lore
     to read through the world. This is just amazing. That being said its outdated and i
     can't find the act 0 introduction so this fails"

    "For the patchouli inventory book, clear it and section it into
     Journal entries / People / World / Manual"

A written book is a consumable in a hotbar slot: it can be dropped, burned, or lost on
death, and every new piece of lore needs another one. The book is a fixed place lore keeps
being added to, and it is already in the pack.

== THE CATEGORY NAMES ARE NOT HIS, AND THAT WAS ASKED FOR ===================

    "Im struggling with words so you can improve the above the categories with something
     that would make sense to exist in a journal."

So they are written as the PLAYER'S OWN journal rather than as a wiki:

    Journal entries  ->  Entries                   what happened, in order
    People           ->  Those I Have Met          only who you have actually met
    World            ->  This Land
    Manual           ->  Things I Have Learned     a journal has no "manual" section

The third and fourth are the two that carry an argument. A journal does not contain a
manual - it contains the things the writer worked out the hard way, which is exactly what
that section is: sneak is CTRL, nothing spawns on the surface above y40, your corpse keeps
your gear. Written as lessons, they read as the character's rather than the developer's.

And "Those I Have Met" is a promise the book can keep: an entry is CONDITIONED on the Act 0
advancement for meeting that person, so the section only ever lists people you have
actually met. That ties the plot ledger to the book with no new machinery - the beats
already exist and story.js already grants them.

== GENERATED, NEVER HAND-EDITED =============================================

The previous book was hand-authored JSON, and it rotted: `paths/crown.json` still shipped
a category for a god RETIRED ON 2026-08-14. A hand-edited book cannot be checked against
anything. This one is built from the spec below, so the check is `python tools/make_journal.py`
and a diff.

The Act 0 origin comes from `opening_lines.js` - the same 18 sentences the written book
carried - so his text lives in ONE place and the journal cannot drift from the opening.
"""

from __future__ import annotations

import io
import json
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(REPO, 'pack', 'datapacks', 'mcserver_guidebook')
BOOK = os.path.join(PACK, 'data', 'mcserver', 'modonomicon', 'books', 'veldora')
LINES = os.path.join(REPO, 'pack', 'kubejs', 'server_scripts', 'opening_lines.js')

NS = 'mcserver'
ADV = 'mcserver:act0/'


def origin_sentences():
    """Ethan's 18, read from the script rather than copied.

    ONE SOURCE. The written book and the journal carried the same text, and a second copy
    is how they come to disagree - the opening would be edited and the journal would go on
    telling an older version of his story.
    """
    t = io.open(LINES, encoding='utf-8').read()
    a = t.index('var SENTENCES = [')
    b = t.index(']', a)
    out = []
    for ln in t[a:b].split('\n')[1:]:
        ln = ln.strip()
        if not ln:
            continue
        out.append(ln.rstrip(',').strip('"'))
    if not out:
        raise SystemExit('no sentences found in opening_lines.js - has it been regenerated?')
    return out


# ── the four sections ──────────────────────────────────────────────────────
CATEGORIES = [
    ('entries', 'Entries', 'minecraft:writable_book', 1),
    ('people', 'Those I Have Met', 'minecraft:player_head', 2),
    ('land', 'This Land', 'minecraft:grass_block', 3),
    ('learned', 'Things I Have Learned', 'minecraft:lantern', 4),
]


def text_page(title, body):
    p = {'type': 'modonomicon:text', 'text': body}
    if title:
        p['title'] = title
    return p


def entry(cat, eid, name, desc, icon, x, y, pages, advancement=None):
    e = {
        'category': '%s:%s' % (NS, cat),
        'name': name,
        'description': desc,
        'icon': icon,
        'x': x, 'y': y,
        'pages': pages,
    }
    if advancement:
        # LOCKED UNTIL YOU HAVE ACTUALLY MET THEM.
        #
        # THE FIELD IS `advancement_id`, AND THE FIRST VERSION GUESSED `advancement`. The
        # class strings in the jar carry the word "advancement" and I read that as the
        # field name; Modonomicon answered
        #     Missing advancement_id, expected to find a string
        # and DROPPED BOTH ENTRIES while loading the rest of the book without complaint.
        #
        # In game that is invisible: "Those I Have Met" would simply be empty, which reads
        # as "you have not met anyone yet" rather than as a broken book. Found only by
        # reloading and reading the log - which is the rule this project already has
        # written down about Rhino, and it applies to datapacks just as hard.
        e['condition'] = {
            'type': 'modonomicon:advancement',
            'advancement_id': advancement,
        }
    return e


def build():
    origin = origin_sentences()

    # The origin, paginated the way it reads rather than by a character count: the story
    # turns three times - the illness, the woman, the morning after - so it is three pages.
    turn1 = origin[:4]
    turn2 = origin[4:11]
    turn3 = origin[11:]

    entries = []

    # ── Entries ────────────────────────────────────────────────────────────
    entries.append(('entries/origin', entry(
        'entries', 'origin', 'How I Got Here',
        'The road, the sickness, and the woman who did not speak.',
        'minecraft:written_book', 0, 0,
        [
            text_page('How I Got Here', '\n\n'.join(turn1)),
            text_page(None, '\n\n'.join(turn2)),
            text_page(None, '\n\n'.join(turn3)),
        ])))

    # ── Those I Have Met ───────────────────────────────────────────────────
    # ONLY WHO YOU HAVE MET. Each is gated on the Act 0 beat that records the meeting,
    # so the section is a record rather than a cast list.
    entries.append(('people/ank', entry(
        'people', 'ank', 'Ank',
        'Says he is the sheriff. Does not want me down there.',
        'minecraft:iron_pickaxe', 0, 0,
        [text_page('Ank', 'He was waiting in the upper caves, which is a strange place to '
                           'wait.\n\nHe says the deep is dangerous, that there have been '
                           'rock slides, that as sheriff my safety is his business. He will '
                           'trade me almost anything to keep me above ground, and his prices '
                           'make no sense.\n\nA man who is that keen to sell me a reason to '
                           'stay is a man with a reason of his own.')],
        advancement=ADV + 'ank')))

    entries.append(('people/white_coat', entry(
        'people', 'white_coat', 'The Woman in the White Coat',
        'White hair. Eyes like gemstones. She never spoke.',
        'minecraft:white_wool', 1, 0,
        [text_page('The Woman in the White Coat',
                   'She came on the seventh night, when I was dying, and she did not say '
                   'one word the whole time.\n\nShe was gone by morning.\n\nI have never '
                   'been able to decide whether she was a doctor.')],
        advancement=ADV + 'the_white_coat')))

    # ── This Land ──────────────────────────────────────────────────────────
    entries.append(('land/veldora', entry(
        'land', 'veldora', 'Veldora',
        'Where I woke up.',
        'minecraft:grass_block', 0, 0,
        [
            text_page('Veldora',
                      'The world is old, and magical, and has always been both. There are '
                      'dragons in the high places and things in the caves with too many '
                      'faces. Ordinary people farm turnips forty miles from something that '
                      'could eat the village, and consider this normal, because it is.'),
            text_page('The Ladder',
                      'They dug down in order to reach up - deeper every generation, '
                      'building something enormous and downward whose only purpose was to '
                      'throw them upward.\n\nEvery layer of the Deep Works is a course in a '
                      'foundation. The bottom of the world is the base of a ladder.\n\nAnd '
                      'they reached. And when reaching, it shattered.'),
        ])))

    entries.append(('land/strata', entry(
        'land', 'strata', 'The Strata',
        'How far down is too far down.',
        'minecraft:deepslate', 1, 0,
        [text_page('The Strata',
                   'The old diggings run from the surface to about thirty blocks below '
                   'sea level. That is where people still go.\n\nBelow that are the deep '
                   'works, and below those the sealed floor.\n\nEveryone I have asked stops '
                   'talking at the second one.')])))

    # ── Things I Have Learned ──────────────────────────────────────────────
    # A JOURNAL HAS NO MANUAL SECTION. These are the pack's real rules, written as things
    # the writer worked out - which is also the only register in which "sneak is CTRL"
    # does not break the fiction.
    entries.append(('learned/nights', entry(
        'learned', 'nights', 'The Nights Are Safe',
        'Above ground, at least.',
        'minecraft:torch', 0, 0,
        [text_page('The Nights Are Safe',
                   'Nothing comes out of the dark up here. I have slept in the open and '
                   'been fine.\n\nThat is not true near ruins, and it is not true of the '
                   'patrols, who do not care what the rest of the world has agreed to.'
                   '\n\nAnd it is not true one step underground.')])))

    entries.append(('learned/dying', entry(
        'learned', 'dying', 'On Dying',
        'It is not as final as I expected.',
        'minecraft:skeleton_skull', 1, 0,
        [text_page('On Dying',
                   'I wake up again, and my things stay where I fell, in the body I left '
                   'behind.\n\nSo dying costs me the walk back and nothing else. I do not '
                   'know who arranged that and I have decided not to think about it too '
                   'hard.')])))

    entries.append(('learned/hands', entry(
        'learned', 'hands', 'My Own Hands',
        'The controls are not where I expect them.',
        'minecraft:leather_boots', 2, 0,
        [text_page('My Own Hands',
                   'Crouching is CONTROL. Running is SHIFT.\n\nThat is backwards from '
                   'everywhere else and it has already killed me once.')])))

    return entries


def main():
    write = '--write' in sys.argv
    entries = build()

    print('%d categories, %d entries' % (len(CATEGORIES), len(entries)))
    for cid, name, icon, sort in CATEGORIES:
        mine = [e for e, _ in entries if e.startswith(cid + '/')]
        print('  %-9s %-24s %d entr%s' % (cid, name, len(mine), 'y' if len(mine) == 1 else 'ies'))
    gated = [n for n, e in entries if 'condition' in e]
    print('  %d entry(s) locked behind an Act 0 advancement: %s'
          % (len(gated), ', '.join(g.split('/')[-1] for g in gated)))

    if not write:
        print('\nreport only. re-run with --write to build it.')
        return 0

    # WIPE FIRST. Ethan said "clear it", and the old book had a category for a god RETIRED
    # ON 2026-08-14 - paths/crown.json - still shipping. The old content is not lost: it is
    # in git, and this tool prints where.
    import shutil
    for sub in ('categories', 'entries'):
        d = os.path.join(BOOK, sub)
        if os.path.isdir(d):
            shutil.rmtree(d)
    os.makedirs(os.path.join(BOOK, 'categories'), exist_ok=True)

    def put(path, obj):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        blob = (json.dumps(obj, indent=1, ensure_ascii=False) + '\n').encode('utf-8')
        tmp = path + '.tmp'
        with open(tmp, 'wb') as fh:
            fh.write(blob)
        os.replace(tmp, path)

    put(os.path.join(BOOK, 'book.json'), {
        'name': 'My Journal',
        'tooltip': 'What happened, who I met, and what it cost to find out.',
        'generate_book_item': True,
        'model': 'modonomicon:modonomicon_purple',
    })
    for cid, name, icon, sort in CATEGORIES:
        put(os.path.join(BOOK, 'categories', cid + '.json'),
            {'name': name, 'icon': icon, 'sort_number': sort})
    for path, obj in entries:
        put(os.path.join(BOOK, 'entries', path + '.json'), obj)

    print('\nwrote %s' % os.path.relpath(BOOK, REPO))
    print('The previous book (3 categories, 14 entries, including a RETIRED Crown) is in')
    print('git at the commit before this one.')
    print('\nStage it: python tools/stage_datapacks.py   then /reload or a restart.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
