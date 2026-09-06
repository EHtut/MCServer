// story_harness.js — the plot ledger, and the two lists that must agree.
//
//     node tools/story_harness.js
//
// ⭐ THE ASSERTION THAT MATTERS MOST is the last group: `story.js` declares the beat keys
// and `tools/make_story_datapack.py` declares the advancements, and NOTHING AT RUNTIME
// NOTICES IF THEY DIVERGE. A key in the script with no advancement grants silently; an
// advancement with no key can never be granted at all. Both look exactly like "that beat
// has not fired yet", which is the quiet-failure shape this project keeps paying for.
'use strict'
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.join(__dirname, '..')
const SS = path.join(ROOT, 'pack', 'kubejs', 'server_scripts')
const ADV = path.join(ROOT, 'pack', 'datapacks', 'mcserver_story',
  'data', 'mcserver', 'advancement', 'act0')
const GEN = path.join(__dirname, 'make_story_datapack.py')

const G = '\x1b[32m', R = '\x1b[31m', D = '\x1b[90m', B = '\x1b[1m', X = '\x1b[0m'
let pass = 0, fail = 0
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}
function grp(t) { console.log('\n' + B + t + X) }

function build() {
  const commands = [], logs = []
  const server = { runCommandSilent: (c) => commands.push(c), runCommand: (c) => commands.push(c) }
  const player = {
    username: 'Rehykt', uuid: 'p1', server, tell: () => { },
    persistentData: {
      _d: {},
      putBoolean(k, v) { this._d[k] = v }, getBoolean(k) { return !!this._d[k] },
    },
  }
  const ctx = {
    VELDORA: {}, Math, String, JSON,
    console: { info: (m) => logs.push(String(m)), warn: (m) => logs.push(String(m)), error: (m) => logs.push('ERR ' + m) },
    Text: { of: (s) => s },
    ServerEvents: { loaded() { }, commandRegistry() { } },
  }
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(path.join(SS, 'story.js'), 'utf8'), ctx)
  return { S: ctx.VELDORA.story, player, commands, logs }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ ONE CALL GRANTS AND RECORDS, OR NEITHER HAPPENS')
{
  const e = build()
  ok('a first reach returns true', e.S.reach(e.player, 'the_caves'), true)
  ok('...and grants the advancement', e.commands[0],
    'advancement grant Rehykt only mcserver:act0/the_caves')
  ok('...and stamps the player', e.S.has(e.player, 'the_caves'), true)

  // 🔑 FALSE IS "ALREADY SEEN", NOT AN ERROR. Anything a player can walk into twice
  // relies on this: treat it as a failure and every repeat logs noise; treat it as
  // success and whatever it guards re-fires.
  ok('a second reach returns false', e.S.reach(e.player, 'the_caves'), false)
  ok('...and sends nothing the second time', e.commands.length, 1)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 AN UNKNOWN KEY IS LOUD, BECAUSE SILENCE LOOKS LIKE "NOT YET"')
{
  const e = build()
  ok('a typo grants nothing', e.S.reach(e.player, 'the_cave'), false)
  ok('...and says so', e.logs.some(l => l.indexOf('UNKNOWN BEAT') !== -1), true)
  ok('...and lists what is valid', e.logs.some(l => l.indexOf('the_caves') !== -1), true)
  ok('...and sent no command', e.commands.length, 0)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ PROGRESS IS ORDERED, NOT A COUNT OF A SET')
{
  const e = build()
  ok('a fresh player is at zero', e.S.progress(e.player), '0/9')
  ok('...with no furthest beat', e.S.furthest(e.player), null)
  e.S.reach(e.player, 'the_hordes')
  e.S.reach(e.player, 'ank')
  ok('two beats counted', e.S.progress(e.player), '2/9')
  // ⚠️ FURTHEST, NOT LAST-GRANTED. `ank` was reached second but sits earlier in the act,
  // so a gate asking "how far has this player come" must not read it as the answer.
  ok('furthest is by act order, not call order', e.S.furthest(e.player), 'the_hordes')
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ CLEAR REVOKES AS WELL AS UN-STAMPS')
{
  const e = build()
  e.S.reach(e.player, 'ank')
  e.S.clear(e.player)
  ok('the stamp is gone', e.S.has(e.player, 'ank'), false)
  // 🔑 Un-stamping alone would leave the toast earned forever, so a re-test would show
  // a beat the player has "not reached" sitting completed in their advancement tab.
  ok('...and the advancement was revoked',
    e.commands.some(c => c.indexOf('advancement revoke') !== -1 && c.indexOf('ank') !== -1), true)
  ok('...so it can be reached again', e.S.reach(e.player, 'ank'), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 THE TWO LISTS MUST AGREE — script keys vs datapack files')
{
  const e = build()
  const keys = e.S.beats.slice()

  const files = fs.existsSync(ADV)
    ? fs.readdirSync(ADV).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''))
    : []
  ok('the datapack exists at all', files.length > 0, true)

  const missingAdv = keys.filter(k => files.indexOf(k) === -1)
  ok('every script key has an advancement', missingAdv, [])
  const orphanAdv = files.filter(f => keys.indexOf(f) === -1)
  ok('...and every advancement has a key', orphanAdv, [])

  // And the generator's own list, so a hand-edited JSON folder cannot hide a drift.
  // ⚠️ SCOPED TO THE `BEATS` BLOCK. My first version matched every 4-space-indented
  // ("key", ... tuple in the file and swept up the TYPOS list too, reporting four phantom
  // extra keys. The two lists have the same shape; only their position separates them.
  const gen = fs.readFileSync(GEN, 'utf8')
  const block = gen.slice(gen.indexOf('BEATS = ['), gen.indexOf('TYPOS = ['))
  const genKeys = (block.match(/\("([a-z_]+)",/g) || [])
    .map(m => m.replace(/^\("/, '').replace(/",$/, ''))
  ok('the generator declares the same keys, in the same order', genKeys, keys)
}

// ═══════════════════════════════════════════════════════════════════════════
grp("⛔ ETHAN'S TEXT IS VERBATIM — typos included")
{
  // ⚠️ These assertions look wrong on purpose. "You hears" and "screaches" are HIS, on HIS
  // screen, and silently correcting an author's prose is how a voice nobody wrote appears
  // in a game. The generator reports them under `--typos` instead; this stops a future
  // session "fixing" them without a ruling.
  const read = (k) => JSON.parse(fs.readFileSync(path.join(ADV, k + '.json'), 'utf8'))
  ok('"You hears" is preserved',
    read('the_arguments').display.description.indexOf('You hears') !== -1, true)
  ok('"screaches" is preserved',
    read('the_hordes').display.description.indexOf('screaches') !== -1, true)
  ok('the quoted "old world?" survives JSON escaping',
    read('the_white_coat').display.description.indexOf('"old world?"') !== -1, true)
  ok('the root has no parent', read('introductions').parent, undefined)
  ok('...and the chain is in play order', read('the_caves').parent, 'mcserver:act0/introductions')
  // Nothing here may be earned by accident - every beat is granted by code.
  ok('every criterion is impossible',
    e_all(), true)
  function e_all() {
    return fs.readdirSync(ADV).filter(f => f.endsWith('.json')).every(f => {
      const a = JSON.parse(fs.readFileSync(path.join(ADV, f), 'utf8'))
      return a.criteria && a.criteria.c && a.criteria.c.trigger === 'minecraft:impossible'
    })
  }
}

console.log('\n' + (fail ? R + fail + ' FAILED, ' + X : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
