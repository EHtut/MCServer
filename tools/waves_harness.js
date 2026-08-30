// waves_harness.js — the ladder must slide DOWN, and the waves must stay hers.
//
//     node tools/waves_harness.js
//
// ⭐ WHY THIS EXISTS. Two designs here fail silently and in opposite directions:
//
//   · THE LADDER IS A SLIDER, NOT A RATCHET. Difficulty is supposed to FALL for a
//     player who keeps dying - that is the mercy half of Ethan's design and it is the
//     unusual half. If anything ever latches, the world just gets harder forever and
//     nobody would report it as a bug; they would report that the game is hard.
//   · THE WAVES MUST STAY HERS. "She has a focus on skeletons, not zombies." A zombie
//     drifting into a Normal wave does not break anything - it just quietly stops the
//     tide from reading as one author's.
'use strict'
const fs = require('fs')
const path = require('path')
const SS = path.join(__dirname, '..', 'pack', 'kubejs', 'server_scripts')

let pass = 0, fail = 0
const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', X = '\x1b[0m'
function grp(t) { console.log('\n' + B + t + X) }
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}
function code(file) {
  const raw = fs.readFileSync(path.join(SS, file), 'utf8')
  let out = '', i = 0
  while (i < raw.length) {
    const c = raw[i], n = raw[i + 1]
    if (c === '/' && n === '/') { const j = raw.indexOf('\n', i); i = j < 0 ? raw.length : j }
    else if (c === '/' && n === '*') { const j = raw.indexOf('*/', i + 2); i = j < 0 ? raw.length : j + 2 }
    else { out += c; i++ }
  }
  return out
}

let NIGHTS = 0, SLAIN = 0, TRUST = {}, DEATHS = 0
let HAVE_NIGHT = true, HAVE_SLAIN = true, HAVE_COUNTER = true

function mkPlayer() {
  const data = {}
  return {
    username: 'P', uuid: 'u1',
    persistentData: {
      getInt: (k) => (k === 'nemesis_deaths_seen' ? DEATHS : (data[k] || 0)),
      putInt: (k, v) => { data[k] = v },
      getBoolean: (k) => !!data[k], putBoolean: (k, v) => { data[k] = v },
    },
    tell: () => { },
  }
}

global.ServerEvents = { loaded: () => { }, commandRegistry: () => { }, tick: () => { } }
global.EntityEvents = { death: () => { } }
global.PlayerEvents = { loggedIn: () => { }, loggedOut: () => { }, respawned: () => { }, tick: () => { } }
global.Text = { of: (s) => s }
global.VELDORA = {}
Object.defineProperty(global.VELDORA, 'night', {
  get: () => (HAVE_NIGHT ? { nightsFor: () => NIGHTS } : undefined), configurable: true })
Object.defineProperty(global.VELDORA, 'slain', {
  get: () => (HAVE_SLAIN ? { count: () => SLAIN } : undefined), configurable: true })
Object.defineProperty(global.VELDORA, 'counter', {
  get: () => (HAVE_COUNTER ? {
    patrons: ['blade', 'wall', 'salvage', 'forge', 'art'],
    get: (p, k) => (k in TRUST ? TRUST[k] : null),
  } : undefined), configurable: true })

const ri = console.info, rw = console.warn
console.info = () => { }; console.warn = () => { }
try {
  ;(0, eval)(fs.readFileSync(path.join(SS, 'difficulty.js'), 'utf8'))
  ;(0, eval)(fs.readFileSync(path.join(SS, 'waves.js'), 'utf8'))
} catch (e) { console.info = ri; console.warn = rw; console.error('FAIL: threw on load :: ' + e); process.exit(1) }
console.info = ri; console.warn = rw
const D = global.VELDORA.difficulty
const W = global.VELDORA.waves
if (!D || !W) { console.error('FAIL: nothing published'); process.exit(1) }

function reset() { NIGHTS = 0; SLAIN = 0; TRUST = {}; DEATHS = 0
  HAVE_NIGHT = HAVE_SLAIN = HAVE_COUNTER = true }

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE LADDER — his four names, his order')
{
  ok('four tiers', D.tiers, ['Uprising', 'Malice', 'Heresy', 'Damnation'])
  // 🚨 The INDEX is the tier. Other systems compare numbers, so a rename must not
  // silently reorder anything.
  ok('Uprising is index 0', D.tiers[0], 'Uprising')
  ok('Damnation is the top', D.tiers[D.tiers.length - 1], 'Damnation')

  // ⭐ "Scaling exponentially from easy to hellish" - the steps must grow, not space
  // evenly, or Damnation is just the fourth thing that happens.
  const s = D.steps
  ok('🚨 the steps GROW - each gap is bigger than the last',
    (s[2] - s[1]) > (s[1] - s[0]) && (s[3] - s[2]) > (s[2] - s[1]), true)
  ok('...and roughly x3 per rung', Math.round(s[3] / s[2]), 3)
}

grp('🚨 IT IS A SLIDER, NOT A RATCHET — the unusual half of the design')
{
  reset()
  const p = mkPlayer()
  NIGHTS = 40; SLAIN = 800; TRUST = { blade: 150, wall: 150 }
  const high = D.score(p)
  ok('a veteran with no deaths climbs', high.index >= 2, true)

  // 🚨 THE ASSERTION THE WHOLE DESIGN RESTS ON.
  DEATHS = 30
  const after = D.score(p)
  ok('🚨 dying REDUCES the score', after.score < high.score, true)
  ok('🚨 ...and can drop them a whole tier', after.index < high.index, true)

  // ⚠️ And it must come back up. A slider that only falls is also a ratchet.
  DEATHS = 0
  ok('🚨 stopping dying restores it', D.score(p).index, high.index)

  // Nothing may be remembered between reads.
  const src = code('difficulty.js')
  ok('🚨 it stores NOTHING - no high-water mark to latch',
    /putInt|putBoolean|putString/.test(src), false)
}

grp('⚠️ THE FLOOR, AND THE GENTLE FAILURE')
{
  reset()
  const p = mkPlayer()
  DEATHS = 500
  const s = D.score(p)
  ok('🚨 a score cannot go negative', s.score >= 0, true)
  ok('...and lands at Uprising, not below it', s.tier, 'Uprising')

  // 🚨 UNREADABLE MUST BE GENTLE. The opposite failure hands somebody Damnation
  // because a counter broke.
  reset()
  NIGHTS = 40; SLAIN = 800
  HAVE_NIGHT = false; HAVE_SLAIN = false; HAVE_COUNTER = false
  ok('🚨 with every input unreadable it returns Uprising', D.index(mkPlayer()), 0)
  const s2 = D.score(mkPlayer())
  ok('🚨 ...and SAYS what it could not read', s2.missing.sort(),
    ['deaths', 'nights', 'slain', 'trust'].filter(x => x !== 'deaths').concat([]).sort())
  reset()
}

grp('⚠️ TRUST AVERAGES ONLY WHAT ANSWERS')
{
  reset()
  const p = mkPlayer()
  // Two gods at 100, three unreadable. Folding nulls in as 0 would give 40, not 100,
  // and make a healthy player look like a beginner.
  TRUST = { blade: 100, wall: 100 }
  ok('🚨 an unread patron is skipped, not counted as zero',
    Math.round(D.score(p).raw.trust), 100)
}

grp('⭐ FOUR WAVE TYPES, THREE VARIANTS')
{
  ok('his four types', W.types, ['general', 'horde', 'ranged', 'miniboss'])
  W.types.forEach(t => {
    ok(t + ' has normal + alternate', Object.keys(W.table[t]).sort(),
      ['alternate', 'normal'])
    ok(t + ' — every variant is themed',
      Object.keys(W.table[t]).every(v => (W.table[t][v].theme || '').length > 30), true)
  })
}

grp('🚨 THE COMPOSITION RULES HE GAVE')
{
  // ⭐⭐ HIS RATIOS, 2026-08-30, MEASURED IN PLAY. These four numbers are the whole
  // point of the file now, so they are asserted as VALUES rather than as inequalities:
  //
  //     General 90/10 · Horde 95/5 · Specialist 80/20 · Miniboss 95/5
  //
  // 🔴 THE OLD ASSERTIONS HERE MEASURED THE WRONG AXIS AND PASSED ANYWAY. `ranged:
  // 0.65` meant "65% of the wave SHOOTS", and every archer in this pack is a specialist
  // by his table - so a wave satisfying "majority ranged" was 65% SPECIALIST, more than
  // three times what he wants. Green tests on a number that meant a different thing.
  ok('⭐ general is 90/10', W.specFrac.general, 0.10)
  ok('⭐ horde is 95/5', W.specFrac.horde, 0.05)
  ok('⭐ specialist ("ranged") is 80/20 - the heaviest', W.specFrac.ranged, 0.20)
  ok('⭐ miniboss is 95/5 + the miniboss', W.specFrac.miniboss, 0.05)
  ok('🚨 NOTHING exceeds 20% specialist - his ceiling',
    W.types.every(t => W.specFrac[t] <= 0.20), true)
  ok('🚨 ...and the ranged wave is strictly the heaviest of the four',
    W.types.every(t => t === 'ranged' || W.specFrac[t] < W.specFrac.ranged), true)

  // "Horder - Fodder + tank specialists / NO RANGED"
  // ⚠️ "No ranged" is a property of the POOL now, not of a fraction: a horde's
  // specialists are tanks and no archer is reachable from it at all.
  const rangedSet = new Set(W.rangedPool)
  ok('🚨 horde/normal can produce NO archer',
    W.table.horde.normal.spec.some(id => rangedSet.has(id)), false)
  ok('🚨 horde/alternate too',
    W.table.horde.alternate.spec.some(id => rangedSet.has(id)), false)
  ok('⭐ ...and horde is the type that carries the tanks',
    W.table.horde.normal.spec.length > 0, true)
  ok('🚨 a horde never sets the bow flag', !W.table.horde.normal.bow, true)

  // "Ranged - Low fodder + HIGH ranged specialists"
  ok('⭐ the ranged wave draws its specialists from the archer pool',
    W.table.ranged.normal.spec.every(id => rangedSet.has(id)), true)
  ok('⭐ ...and it is the only type that forces a bow',
    W.types.filter(t => W.table[t].normal.bow || W.table[t].alternate.bow), ['ranged'])

  // "General - fodder + LIGHT specialists"
  ok('general carries light specialists, not tanks or archers',
    W.table.general.normal.spec.length > 0 &&
    !W.table.general.normal.spec.some(id => rangedSet.has(id)), true)

  // "Miniboss - High fodder + miniboss"
  ok('🚨 both miniboss variants actually have a boss',
    !!W.table.miniboss.normal.boss && !!W.table.miniboss.alternate.boss, true)
  ok("⭐ and they are the two Ethan RULED, unchanged",
    [W.table.miniboss.normal.boss, W.table.miniboss.alternate.boss].sort(),
    ['born_in_chaos_v1:fallen_chaos_knight', 'born_in_chaos_v1:supreme_bonescaller'])
}

grp('⭐ NORMAL IS BONE, ALTERNATE IS GHOST — the variant axis is the subfaction axis')
{
  // 🔴 THIS TESTED THE NAMES AND THE NAMES LIE. It was `/skeleton|bone|koboleton/i`,
  // which failed the moment the fodder pool was re-derived from MEASURED stats and
  // picked up `minecraft:stray`, `minecraft:bogged`, `goety:rattled` and
  // `iceandfire:dread_thrall` - four skeletons, none of them spelled "skeleton".
  //
  // ⚠️ THIS REPO HAS PAID FOR NAME-MATCHING THREE TIMES: `art` matched inside "heart",
  // a case-sensitive grep hid the worst class, and `banshee`/`skeleton_thrasher` were
  // nearly classed ranged because of what they are called. ⭐ So assert POOL IDENTITY -
  // every normal variant draws from the one bone list, every alternate from the one
  // ghost list - which is the actual claim and cannot drift as ids are added.
  ok('🚨 every normal variant draws its fodder from the ONE bone pool',
    W.types.every(t => W.table[t].normal.fodder === W.fodderPools.bone), true)
  ok('⭐ the general/horde/ranged alternates draw from the ONE ghost pool',
    ['general', 'horde', 'ranged'].every(t =>
      W.table[t].alternate.fodder === W.fodderPools.ghost), true)
  // ⚠️ NEGATIVE CONTROL: identity comparison would pass vacuously on two empty or
  // accidentally-identical lists.
  ok('   (control: the two pools are different, and neither is empty)',
    W.fodderPools.bone.length > 0 && W.fodderPools.ghost.length > 0 &&
    W.fodderPools.bone !== W.fodderPools.ghost, true)
  ok('   (control: they share no mob)',
    W.fodderPools.bone.some(id => W.fodderPools.ghost.indexOf(id) !== -1), false)

  // 🚨 "She has a focus on skeletons, NOT ZOMBIES." Her own waves must not drift.
  const herIds = []
  W.types.forEach(t => ['normal', 'alternate'].forEach(v => {
    const s = W.table[t][v]
    herIds.push.apply(herIds, s.fodder.concat(s.spec))
  }))
  ok('🚨 no zombie is in ANY of her own waves',
    herIds.some(id => /zombie|husk|drowned|ghoul/i.test(id)), false)
}

grp('⛔ WHAT WAS DELIBERATELY LEFT OUT')
{
  const all = []
  W.types.forEach(t => ['normal', 'alternate'].forEach(v => {
    const s = W.table[t][v]
    all.push.apply(all, s.fodder.concat(s.spec, s.boss ? [s.boss] : []))
  }))
  Object.keys(W.gods).forEach(g => all.push.apply(all, W.gods[g].fodder.concat(W.gods[g].spec)))

  // 🚨 docs/72 flagged that goety necromancers RAISE MORE UNDEAD - a multiplier inside
  // a multiplier. That risk was flagged and never cleared.
  ok('🚨 no necromancer, lord or summoner anywhere',
    all.some(id => /necromancer|skull_lord|bone_lord.*summon/i.test(id)), false)
  // ⛔ All twelve occultism wild_* are Wild Hunt event mobs.
  ok('⛔ no occultism wild_* event mobs', all.some(id => /occultism:wild/.test(id)), false)
}

grp('⭐ THE GODS — by difficulty, cumulative, and only three of them')
{
  ok('🚨 only blade, wall and art', Object.keys(W.gods).sort(), ['art', 'blade', 'wall'])
  // ⛔ "No special god waves for forge or salvage." A ruling, not a gap.
  ok('⛔ forge has no god wave', 'forge' in W.gods, false)
  ok('⛔ salvage has none either', 'salvage' in W.gods, false)

  ok('Malice unlocks blade', W.gods.blade.at, 1)
  ok('Heresy unlocks wall', W.gods.wall.at, 2)
  ok('Damnation unlocks art', W.gods.art.at, 3)

  ok('🚨 Uprising has NO god waves at all', W.godsAt(0), [])
  ok('Malice has one', W.godsAt(1).sort(), ['blade'])
  // ⭐ CUMULATIVE. Climbing the ladder must not REMOVE variety - losing Blade's waves
  // by getting better would read as a bug however it was explained.
  ok('⭐ Damnation has all three, not just art', W.godsAt(3).sort(),
    ['art', 'blade', 'wall'])
}

grp('🚨 THE RANGED WAVE FORCES A BOW')
{
  // Measured: minecraft:skeleton arrives armed only ~30% of the time, because
  // config/epicknights/mobs_equipment.json5 gives it ~13 items and one bow.
  ok('a bow NBT exists', /minecraft:bow/.test(W.rangedNbt), true)
  ok('🚨 ...and Tags are NOT inside it - key order dropped the tag when they were',
    /Tags/.test(W.rangedNbt), false)
  ok('the ranged pool is the three measured mobs', W.rangedPool.length, 3)
}

grp('⭐ pick() RESPECTS THE DIFFICULTY GATE')
{
  let sawGod = false
  for (let i = 0; i < 300; i++) {
    const w = W.pick('general', 0, 1.0)     // godChance 1.0, but Uprising
    if (w.variant === 'god') sawGod = true
  }
  ok('🚨 godChance 1.0 at Uprising still yields NO god wave', sawGod, false)

  const gods = {}
  for (let i = 0; i < 300; i++) {
    const w = W.pick('miniboss', 3, 1.0)
    if (w.variant === 'god') gods[w.god] = true
  }
  ok('⭐ at Damnation all three appear', Object.keys(gods).sort(),
    ['art', 'blade', 'wall'])

  // 🔴 RELAXED FOR EXACTLY ONE GOD, AND ONLY BECAUSE HIS BOSS DOES NOT EXIST IN PLAY.
  // Art's `dark_vortex` measured 0/3 against a control that passed 3/3 - it answers
  // `summon` and is gone before the next command (D-112). waves.js now reports
  // `boss: null` for him and tide.js substitutes HER miniboss, so the wave still has
  // one. ⚠️ The relaxation is bounded to gods whose roster genuinely declares no boss;
  // any OTHER god losing its boss still fails here.
  let bossless = []
  for (let i = 0; i < 200; i++) {
    const w = W.pick('miniboss', 3, 1.0)
    if (w.variant === 'god' && !w.boss) bossless.push(w.god)
  }
  ok('🚨 a god MINIBOSS wave has a boss - except a god who declares none',
    bossless.filter(g => W.gods[g].boss), [])
  ok('⚠️ ...and the only god without one is art (D-112, awaiting his ruling)',
    Array.from(new Set(bossless)).sort(), ['art'])

  // ...and a god GENERAL wave must not sprout one.
  let extra = 0
  for (let i = 0; i < 200; i++) {
    const w = W.pick('general', 3, 1.0)
    if (w.variant === 'god' && w.boss) extra++
  }
  ok('🚨 a god GENERAL wave has no boss', extra, 0)

  ok('every pick is themed', !!W.pick('horde', 2, 0.5).theme, true)
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n' + B + (fail ? R + fail + ' FAILED, ' : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
