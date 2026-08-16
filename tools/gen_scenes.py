import pathlib, re, json

REPO = pathlib.Path(r'C:\MCServer\repo')
doc = (REPO / 'docs' / '28-THE-SCENES.md').read_text(encoding='utf-8').split('# THE SILENCE')[0]
KEY = {'BLADE': 'blade', 'SALVAGE': 'salvage', 'FORGE': 'forge',
       'WALL': 'wall', 'CROWN': 'crown', 'ART': 'art'}


def clean(s):
    # ⭐ A LEADING ASTERISK IS NARRATION, not markdown emphasis, and must survive the
    # strip below - introductions.js reads it to choose grey-italic over the god's
    # red. Ethan's own convention, from "*You feel a heavy silence" in the Harvest.
    s = s.strip()
    narrate = s.startswith('*') and not s.startswith('**')
    s = re.sub(r'\*\*(.*?)\*\*', r'\1', s)
    s = re.sub(r'\*(.*?)\*', r'\1', s)
    s = re.sub(r'~~.*?~~', '', s)
    s = re.sub(r'\u2702\ufe0f.*?\)', '', s)
    for ch in ('\u2702\ufe0f', '\u2b50', '\u2192', '`'):
        s = s.replace(ch, '')
    s = re.sub(r'\s+', ' ', s).strip()
    if narrate and not s.startswith('*'):
        s = '*' + s
    return s


scenes = {}
for blk in re.split(r'\n## (?=[A-Z]{3,} )', doc)[1:]:
    name = blk.split('\n')[0].split('\u2014')[0].strip()
    if name not in KEY:
        continue
    d = {}
    for beat, tag in [('ARRIVAL', 'arrival'), ('DEMAND', 'demand'), ('OPTIONS', 'options'),
                      ('ON ACCEPTANCE', 'accept'), ('ON REFUSAL', 'refuse')]:
        m = re.search(r'\*\*' + beat + r'\*\*(.*?)(?=\n\*\*|\n> |\n## |\Z)', blk, re.S)
        body = m.group(1).strip()
        if beat == 'OPTIONS':
            d[tag] = [clean(x) for x in body.replace('\u2014', '').split('/')]
        else:
            raw = (clean(re.sub(r'^\d+\.\s*', '', l)) for l in body.split('\n') if l.strip())
            d[tag] = [x for x in raw if x]
    scenes[KEY[name]] = d

order = ['blade', 'salvage', 'forge', 'wall', 'crown', 'art']
missing = [k for k in order if k not in scenes]
if missing:
    raise SystemExit('MISSING SCENES: %s' % missing)

lines_out = []
for k in order:
    s = scenes[k]
    lines_out.append('    %s: {' % k)
    for tag in ['arrival', 'demand', 'options', 'accept', 'refuse']:
        lines_out.append('      %s: [' % tag)
        for item in s[tag]:
            lines_out.append('        %s,' % json.dumps(item, ensure_ascii=False))
        lines_out.append('      ],')
    lines_out.append('    },')
block = '\n'.join(lines_out)

target = REPO / 'pack' / 'kubejs' / 'server_scripts' / 'introductions.js'
src = target.read_text(encoding='utf-8')
# 🚨 RE-RUNNABLE. The original consumed its own marker, so a second run died with
# "already generated?" and the doc quietly stopped being the source of truth - which
# is how Blade's scene drifted. Now it splices between two markers that survive, so
# the doc can be edited and regenerated forever.
BEG, END = '    /*__SCENES_BEGIN__*/', '    /*__SCENES_END__*/'
NL = '\n'
if BEG in src and END in src:
    head, rest = src.split(BEG, 1)
    _, tail = rest.split(END, 1)
    src = head + BEG + NL + block + NL + END + tail
elif '    /*__SCENES__*/' in src:
    src = src.replace('    /*__SCENES__*/', BEG + NL + block + NL + END)
else:
    raise SystemExit('no splice markers in introductions.js')
target.write_text(src, encoding='utf-8')

total = sum(len(v) for s in scenes.values() for v in s.values())
print('spliced %d patrons, %d lines' % (len(order), total))
print('  blade refuse ends :', scenes['blade']['refuse'][-1])
print('  salvage demand[2] :', scenes['salvage']['demand'][2])
print('  crown options     :', scenes['crown']['options'])
# A leading `*` is the narration marker and is expected; anything else is a leak.
bad = [l for s in scenes.values() for v in s.values() for l in v
       if re.search(r'[_~`\[\]]', l) or re.search(r'(?<!^)\*', l)]
narr = [l for s in scenes.values() for v in s.values() for l in v if l.startswith('*')]
print('  narration lines   :', len(narr))
print('  residual markdown :', bad or 'none')
