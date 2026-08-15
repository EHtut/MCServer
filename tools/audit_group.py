import json, pathlib, re, zipfile, collections

REPO = pathlib.Path(r'C:\MCServer\repo')
CACHE = pathlib.Path(r'C:\MCServer\cache')
tax = json.loads((REPO / 'tools' / 'mod_taxonomy.json').read_text(encoding='utf-8'))
slugs = tax['worldgen-structures']

# slug -> jar filename, from the packwiz metafiles
def jar_for(slug):
    f = REPO / 'pack' / 'mods' / (slug + '.pw.toml')
    if not f.exists():
        return None
    m = re.search(r'filename\s*=\s*"([^"]+)"', f.read_text(encoding='utf-8'))
    return m.group(1) if m else None


def scan(jar):
    p = CACHE / jar
    if not p.exists():
        return None
    try:
        z = zipfile.ZipFile(p)
    except Exception:
        return None
    n = z.namelist()
    out = {}
    # what it registers, read from data/assets rather than a description
    out['recipes'] = len([x for x in n if '/recipe/' in x and x.endswith('.json')])
    rt = collections.Counter()
    for x in n:
        m = re.search(r'/recipe/([a-z_]+)/', x)
        if m:
            rt[m.group(1)] += 1
    out['recipe_types'] = [k for k, _ in rt.most_common(6)]
    out['items'] = len([x for x in n if '/models/item/' in x and x.endswith('.json')])
    out['blocks'] = len([x for x in n if '/blockstates/' in x and x.endswith('.json')])
    out['structures'] = len([x for x in n if 'worldgen/structure/' in x and x.endswith('.json')])
    out['entities'] = len(set(re.findall(r'/entity/([a-z_]+)/', ' '.join(n))))
    out['lang_keys'] = 0
    for L in [x for x in n if x.endswith('lang/en_us.json')]:
        try:
            out['lang_keys'] += len(json.loads(z.read(L).decode('utf-8')))
        except Exception:
            pass
    out['size_mb'] = round(p.stat().st_size / 1048576, 1)
    return out


rows = []
for s in sorted(slugs):
    j = jar_for(s)
    d = scan(j) if j else None
    rows.append((s, j, d))

print('A5 — WORLDGEN : %d mods\n' % len(rows))
print('%-32s %6s %6s %6s %6s %6s  %s' % ('slug', 'MB', 'items', 'blocks', 'recipe', 'lang', 'recipe types'))
print('-' * 118)
for s, j, d in rows:
    if not d:
        print('%-32s  (jar not in cache: %s)' % (s, j))
        continue
    print('%-32s %6.1f %6d %6d %6d %6d  %s' % (
        s, d['size_mb'], d['items'], d['blocks'], d['recipes'], d['lang_keys'],
        ','.join(d['recipe_types'][:4])))

# flag the ones that add nothing registrable - candidates for "filler"
print('\n--- ZERO new items AND zero new blocks (tweak/library/visual, not content) ---')
for s, j, d in rows:
    if d and d['items'] == 0 and d['blocks'] == 0:
        print('  %-30s lang=%d recipes=%d' % (s, d['lang_keys'], d['recipes']))
