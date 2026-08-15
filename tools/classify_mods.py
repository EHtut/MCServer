import pathlib, re, json, collections

MODS = pathlib.Path(r'C:\MCServer\repo\pack\mods')
names = sorted(p.name[:-8] for p in MODS.glob('*.pw.toml'))

RULES = [
    # ---- paths, as ruled by the audit (A1 forge, A2 wall, A3 art all DONE) ----
    ('wall-minions', r'^goety|^occultism|automaticons'),
    ('art-magic', r'^ars|arsdelight|easy-magic|magic-vibe'),
    ('salvage-ranged', r'tacz|superb-warfare|point-blank|ranged-weapon|gunpowder-ore|archers'),
    ('blade-melee', r'medieval-siege-machines|knight-lib|epic-knights|better-combat|combat-roll|cut-through|not-enough-anim|playeranim|first-person-model|shield|parry|dodge'),
    ('forge-create', r'^create|^copycats|createaddition|numismatics|^encased'),
    # ---- supplementary: not path-specific, rounds out kits, minimal crafting ----
    ('supplementary', r'chipped|framedblocks|storagedrawers|storage-delight|macaws|handcrafted|interiors|bellsandwhistles|carry-on|artifacts|relics|^runes|totem'),
    # ---- worldgen, split three ways (Ethan 2026-08-14) ----
    ('biomes', r'regions-unexplored|oh-the-biomes|yungs-cave-biomes|biolith|terrablender|lithostitched|frostiful|scorchful|serene-seasons|thermoo|nether-depths|infernal-expansion|formations-nether|galosphere'),
    ('structures', r'ct-overhaul-village|when-dungeons|structory|valarian|grim-and-bleak|explorify|battle-towers|medieval-buildings|improved-pillager|hopo-better|yungs-better|better-archeology|ardas-sculks|abandoned-watchtower|aures|lukis|let-the-adventure|dungeons|ruined|village'),
    ('worldgen-terrain', r'tectonic|chunky|distanthorizons|weather-storms|explorers-compass|natures-compass|seasonhud|structure-pool|^formations$|oh-the-trees|worldgen'),
    ('overworld-life', r'spawn-mod|naturalist|critters-and-companions|cosy-critters|untitled-duck|fish-of-thieves|aquaculture|respawning-animals|friends-and-foes|shineals|iceandfire'),
    ('mobs-enemies', r'cataclysm|born|mowzies|friends-and-foes|naturalist|iceandfire|jurassic|shineals|prehistoric|legendary-monsters|rottencreatures|mimicked|obsessed|knocker|revervox|bosses-of-mass|in-control|mutant|guard|critters|cosy-critters|respawning-animals|edf-remastered|deimos|uranus|sable|horror'),
    ('visuals-audio', r'sodium|embeddium|oculus|iris|shader|particle|sound|ambient|dripsounds|subtle-effects|dynamic-lights|3dskinlayers|entity-model|entitytexture|euphoria|fusion|athena|polytone|make_bubbles|moreculling|camerapture|figura|emotecraft|chat-heads|waterframes|watermedia|immersive-paintings|immersive-overlays|darkaroundme|rrls|rsls|item-borders|item-highlighter|advancement-plaques|travelers-titles|rpgtitles|tips|visual|skin|model'),
    ('qol-ui', r'simple-voice-chat|put-a-plug-in-it|jei|emi|patchouli|modonomicon|field-guide|item-descriptions|enchantment-descriptions|justenoughbreeding|inventory-profiles|mouse-tweaks|controlling|searchables|easy-anvils|clumps|trade-cycling|trading-post|appleskin|comforts|carry|zoom|betterf3|better-third-person|boat-item-view|no-chat-reports|polymorph|almostunified|every-compat|lootr|corpse|waystones|camping|farmers-delight|frights-delight|storage-delight|arsdelight|elytra-slot|caelus|curios|accessories|artifacts|relics|skill-tree|skills|toolkit|backpack'),
    ('perf-server', r'lithium|ferrite|modernfix|entityculling|clumps|spark|servercore|saturn|packet-fixer|immediatelyfast|crash-assistant|betterfps|alternate-current|coroutil|chunky|cobweb|data-anchor|prometheus|memory|optim|fps|lmft|smartbrainlib|citadel|puzzles-lib|forgiving-void|no-chat|serverside|velvet|sparkweave|prickle|jupiter|deimos|uranus|sable|glitchcore|shatterbyte|teallib|mru|rpl|platform|prism-lib'),
    ('library', r'flerovium|libipn|pf-neoforge|lib$|-lib|libs?$|api$|-api|architectury|kotlin|balm|bookshelf|collective|geckolib|azurelib|owo|resourceful|cloth|moonlight|supermartijn|cucumber|placebo|zeta|yacl|fzzy-config|creativecore|dynamic_asset|iceberg|kubejs|rhino|glitchcore|citadel|framework|core$|-core|codec|struct|spell-engine|spell-power'),
]

buckets = collections.OrderedDict((k, []) for k, _ in RULES)
buckets['UNCLASSIFIED'] = []

for n in names:
    for key, pat in RULES:
        if re.search(pat, n, re.I):
            buckets[key].append(n)
            break
    else:
        buckets['UNCLASSIFIED'].append(n)

print('TOTAL SHIPPED MODS: %d\n' % len(names))
for k, v in buckets.items():
    print('%-22s %3d' % (k, len(v)))
print('\n--- UNCLASSIFIED (%d) ---' % len(buckets['UNCLASSIFIED']))
print(' '.join(buckets['UNCLASSIFIED']))

out = pathlib.Path(r'C:\MCServer\repo\tools\mod_taxonomy.json')
out.write_text(json.dumps(buckets, indent=1), encoding='utf-8')
print('\nwritten ->', out)
