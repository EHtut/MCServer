import pathlib, re, zipfile, json

REPO = pathlib.Path(r'C:\MCServer\repo')
CACHE = pathlib.Path(r'C:\MCServer\cache')

rows = []
for meta in sorted(REPO.glob('pack/mods/*.pw.toml')):
    slug = meta.name[:-8]
    m = re.search(r'filename = "([^"]+)"', meta.read_text(encoding='utf-8'))
    if not m:
        continue
    jar = CACHE / m.group(1)
    if not jar.exists():
        continue
    try:
        z = zipfile.ZipFile(jar)
        n = z.namelist()
    except Exception:
        continue
    st = [x for x in n if 'worldgen/structure/' in x and x.endswith('.json')]
    sset = [x for x in n if 'worldgen/structure_set/' in x and x.endswith('.json')]
    bio = [x for x in n if 'worldgen/biome/' in x and x.endswith('.json')]
    feat = [x for x in n if 'worldgen/placed_feature/' in x and x.endswith('.json')]
    nbt = [x for x in n if x.endswith('.nbt')]
    if st or sset or bio:
        rows.append((slug, len(st), len(sset), len(bio), len(feat), len(nbt)))

rows.sort(key=lambda r: (-r[1], -r[3]))
print('%-38s %6s %6s %6s %6s %6s' % ('mod', 'struct', 'sets', 'biomes', 'feats', 'nbt'))
print('-' * 84)
for r in rows:
    print('%-38s %6d %6d %6d %6d %6d' % r)
print('\n%d shipped mods add worldgen' % len(rows))
print('totals: structures=%d  sets=%d  biomes=%d  pieces=%d' % (
    sum(r[1] for r in rows), sum(r[2] for r in rows), sum(r[3] for r in rows), sum(r[5] for r in rows)))
