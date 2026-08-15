import pathlib, re, json, collections

MODS = pathlib.Path(r'C:\MCServer\repo\pack\mods')
names = sorted(p.name[:-8] for p in MODS.glob('*.pw.toml'))

RULES = [
    ('forge-create', r'^create|^copycats|createaddition|numismatics|^encased|steam'),
    ('art-magic', r'^ars|arsdelight|irons_spell|irons-spell|spell-engine|spell-power|wizards|elemental-wizards|forcemaster|witcher-rpg|berserker-rpg|runes|easy-magic|magic-vibe'),
    ('crown-minions', r'^goety|guard-villagers|automaticons'),
    ('salvage-guns', r'tacz|superb-warfare|point-blank|ranged-weapon|gunpowder-ore|archers'),
    ('blade-combat', r'epic-knights|better-combat|combat-roll|cut-through|not-enough-anim|playeranim|first-person-model|shield|parry|dodge'),
    ('wall-build-resource', r'theurgy|chipped|framedblocks|storagedrawers|storage-delight|macaws|handcrafted|medieval-buildings|oh-the-trees|security-craft|carry-on|interiors|bellsandwhistles|copycat|create-deco|decor'),
    ('worldgen-structures', r'yungs-better|better-archeology|tectonic|biolith|terrablender|biomes|structory|when-dungeons|battle-towers|improved-pillager|formations|hopo-better|medieval-siege|ct-overhaul-village|explorify|structure-pool|lithostitched|galosphere|nether-depths|infernal-expansion|ardas-sculks|deeperdarker|undergarden|abandoned-watchtower|valarian|grim-and-bleak|dungeons|ruined|village|worldgen|natures-compass|explorers-compass|chunky|distanthorizons|serene-seasons|seasonhud|weather-storms|frostiful|scorchful|thermoo|tectonic'),
    ('mobs-enemies', r'cataclysm|born|mowzies|friends-and-foes|naturalist|iceandfire|jurassic|shineals|prehistoric|legendary-monsters|rottencreatures|mimicked|obsessed|knocker|revervox|bosses-of-mass|in-control|spawn-mod|mutant|guard|critters|cosy-critters|respawning-animals|edf-remastered|deimos|uranus|sable|horror'),
    ('visuals-audio', r'sodium|embeddium|oculus|iris|shader|particle|sound|ambient|dripsounds|subtle-effects|dynamic-lights|3dskinlayers|entity-model|entitytexture|euphoria|fusion|athena|polytone|make_bubbles|moreculling|camerapture|figura|emotecraft|chat-heads|waterframes|watermedia|immersive-paintings|immersive-overlays|darkaroundme|rrls|rsls|item-borders|item-highlighter|advancement-plaques|travelers-titles|rpgtitles|tips|visual|skin|model'),
    ('qol-ui', r'simple-voice-chat|put-a-plug-in-it|jei|emi|patchouli|modonomicon|field-guide|item-descriptions|enchantment-descriptions|justenoughbreeding|inventory-profiles|mouse-tweaks|controlling|searchables|easy-anvils|clumps|trade-cycling|trading-post|appleskin|comforts|carry|zoom|betterf3|better-third-person|boat-item-view|no-chat-reports|polymorph|almostunified|every-compat|lootr|corpse|waystones|camping|farmers-delight|frights-delight|storage-delight|arsdelight|elytra-slot|caelus|curios|accessories|artifacts|relics|skill-tree|skills|toolkit|backpack'),
    ('perf-server', r'lithium|ferrite|modernfix|entityculling|clumps|spark|servercore|saturn|packet-fixer|immediatelyfast|crash-assistant|betterfps|alternate-current|coroutil|chunky|cobweb|data-anchor|prometheus|memory|optim|fps|lmft|smartbrainlib|citadel|puzzles-lib|forgiving-void|no-chat|serverside|velvet|sparkweave|prickle|jupiter|deimos|uranus|sable|glitchcore|shatterbyte|teallib|mru|rpl|platform|prism-lib'),
    ('library', r'flerovium|libipn|pf-neoforge|lib$|-lib|libs?$|api$|-api|architectury|kotlin|balm|bookshelf|collective|geckolib|azurelib|owo|resourceful|cloth|moonlight|supermartijn|cucumber|placebo|zeta|yacl|fzzy-config|creativecore|dynamic_asset|iceberg|kubejs|rhino|glitchcore|citadel|framework|core$|-core|codec|struct'),
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
