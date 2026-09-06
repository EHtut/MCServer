// ank_harness.js — the band Ank exists in, and the two ways out of it.
//
//     node tools/ank_harness.js
//
// ⭐ ALMOST NONE OF ANK IS TESTABLE HERE, AND THAT IS CORRECT. His model, skin,
// unkillability and following are a PRESET — Easy NPC's job, settled in game. This file
// tests the one thing that is ours: the boundary, and that leaving fires the line.
'use strict'
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.join(__dirname, '..')
const SS = path.join(ROOT, 'pack', 'kubejs', 'server_scripts')
const PRESET = path.join(ROOT, 'pack', 'datapacks', 'mcserver_npcs',
  'data', 'easy_npc', 'preset', 'arkhdottir', 'ank_t0.npc.snbt')

const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', X = '\x1b[0m'
let pass = 0, fail = 0
function ok(label, got, want) {
  const a = JSON.stringify(got), b = JSON.stringify(want)
  if (a === b) { pass++; console.log('  ' + G + 'ok  ' + X + label) }
  else { fail++; console.log('  ' + R + 'FAIL' + X + ' ' + label + '\n         got ' + a + '  want ' + b) }
}
function grp(t) { console.log('\n' + B + t + X) }

function build() {
  const commands = [], ambient = [], logs = [], spoken = []
  // ⭐ THE SCHEDULER RUNS THE CALLBACK IMMEDIATELY, and records the delay it was asked
  // for. Deferring for real would make the harness time-dependent; dropping the callback
  // would make a scheduled line indistinguishable from a lost one — which is the exact
  // failure the opening's 18 dead callbacks were.
  // 🔴 THE STUB USED TO RUN EVERY CALLBACK SYNCHRONOUSLY, AND THAT IS WHAT HID THE BUG.
  // The block below drives exactly the failing scenario — greet on day 7, then drop below
  // −32 — and it passed, because all five lines had already fired before the despawn could
  // happen. In game the order is the opposite: the chill lands, then three more <Ank>
  // lines from a man who is no longer there.
  //
  // So callbacks are now QUEUED, and `e.tick()` runs them. A test that never ticks is
  // testing the same instant the game would not be in.
  const delays = [], queued = []
  const server = {
    tickCount: 0, players: [], runCommandSilent: (c) => commands.push(c),
    scheduleInTicks: (t, fn) => { delays.push(t); queued.push(fn) },
  }
  let descents = 0
  let day = 0
  // ⚠️ `mute` makes cast.speak REFUSE, which is not the same as having no cast at all.
  // Losing his voice and having nothing to say must stay distinguishable here too.
  let mute = false
  const ctx = {
    VELDORA: {
      announce: { text: (s, p, t) => { ambient.push(t); return true }, P_AMBIENT: 0 },
      urge: { descents: () => descents, dayOf: () => day },

    },
    Math, String, JSON,
    console: { info: (m) => logs.push(String(m)), warn: (m) => logs.push('WARN ' + m), error: (m) => logs.push('ERR ' + m) },
    Text: { of: (s) => s },
    ServerEvents: { tick() { }, commandRegistry() { }, loaded() { } },
  }
  vm.createContext(ctx)
  // ⭐ THE REAL IMPORTED TEXT, not a fixture. A stub would test the plumbing and let
  // Ethan's actual writing arrive broken - which is the only failure that matters here.
  vm.runInContext(fs.readFileSync(path.join(SS, 'ank_lines.js'), 'utf8'), ctx)
  vm.runInContext(fs.readFileSync(path.join(SS, 'ank.js'), 'utf8'), ctx)
  const player = (y, sky) => ({
    username: 'Rehykt', y, server,
    // ⚠️ `mute` makes tell() THROW, which is what a broken send looks like — not a
    // false return. Losing his voice and having nothing to say must stay distinguishable.
    tell: (t) => { if (mute) throw new Error('no chat'); spoken.push(String(t)) },
    level: { canSeeSky: () => sky },
    blockPosition: () => ({}),
    persistentData: {
      _d: {},
      putBoolean(k, v) { this._d[k] = v }, getBoolean(k) { return !!this._d[k] },
      putInt(k, v) { this._d[k] = v }, getInt(k) { return this._d[k] | 0 },
    },
  })
  const tick = () => { const q = queued.splice(0); q.forEach(fn => fn()) }
  return { A: ctx.VELDORA.ank, ctx, server, player, commands, ambient, logs, spoken, delays,
           tick, queued,
           setDescents: (n) => { descents = n },
           setDay: (n) => { day = n },
           setMute: (v) => { mute = v },
           lines: ctx.VELDORA.ankLines }
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE BAND — underground, and above the deep works')
{
  const e = build()
  ok('a cave near the surface is his', e.A.shouldBeOut(e.player(10, false)), true)
  ok('...and so is one just above the boundary', e.A.shouldBeOut(e.player(-31, false)), true)
  ok('below -32 he is gone', e.A.shouldBeOut(e.player(-40, false)), false)
  ok('...and outside he is gone', e.A.shouldBeOut(e.player(70, true)), false)

  // 🔑 THE TWO CASES THAT PROVE IT IS SKY AND NOT HEIGHT. Height alone would get both
  // of these backwards, and both are ordinary places a player stands.
  ok('a cave HIGH under a mountain still counts as underground',
    e.A.shouldBeOut(e.player(90, false)), true)
  ok('a ravine open to the sky at y=-5 does NOT',
    e.A.shouldBeOut(e.player(-5, true)), false)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🔴 UNREADABLE IS NOT "OUTSIDE" — nothing happens on null')
{
  // ⚠️ This is the rule the whole project runs on: "I could not tell" and "he should
  // go" must never share a value. A sky read that fails must not despawn him, or an
  // unreadable chunk boundary would fire the chill for no reason.
  const e = build()
  const blind = e.player(-10, false)
  blind.level = { canSeeSky: () => { throw new Error('unreadable') } }
  blind.block = undefined
  ok('an unreadable sky returns null, not false', e.A.shouldBeOut(blind), null)
  ok('...and a sweep does nothing at all', e.A.consider(e.server, blind), 'unreadable')
  ok('...sends no command', e.commands.length, 0)
  ok('...and fires no chill', e.ambient.length, 0)

  const noY = e.player(-10, false)
  Object.defineProperty(noY, 'y', { get() { return undefined } })
  ok('an unreadable position is null too', e.A.shouldBeOut(noY), null)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ HE ARRIVES, AND HE LEAVES WITH THE LINE')
{
  const e = build()
  const p = e.player(-10, false)
  ok('first sweep in the band spawns him', e.A.consider(e.server, p), 'spawned')
  ok('...and he is marked active', e.A.isActive(p), true)
  ok('...a second sweep does not spawn a second one', e.A.consider(e.server, p), 'with-you')

  p.y = -40
  ok('going too deep despawns him', e.A.consider(e.server, p), 'despawned')
  ok('...and the line is Ethan\'s, exactly', e.ambient, ['A chill runs up your spine.'])
  ok('...and he is no longer active', e.A.isActive(p), false)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ AND HE LEAVES THE SAME WAY WHEN YOU SURFACE')
{
  const e = build()
  const p = e.player(-10, false)
  e.A.consider(e.server, p)
  p.level = { canSeeSky: () => true }
  ok('stepping into daylight despawns him', e.A.consider(e.server, p), 'despawned')
  ok('...with the same line', e.ambient, ['A chill runs up your spine.'])
}

// ═══════════════════════════════════════════════════════════════════════════
grp('🚨 HYSTERESIS — the line must not loop on the boundary')
{
  // 🔴 WITHOUT THIS, A PLAYER MINING AT y=-32 SPAWNS AND DESPAWNS HIM EVERY TWO SECONDS,
  // and every despawn fires the chill. A line that repeats on a loop stops being eerie
  // and becomes a visible bug — the same reason voice.js has a cooldown.
  const e = build()
  const p = e.player(-10, false)
  e.A.consider(e.server, p)          // out with him
  p.y = -33
  ok('he leaves below the boundary', e.A.consider(e.server, p), 'despawned')
  p.y = -31
  ok('...and does NOT return one block up', e.A.consider(e.server, p), 'in-the-gap')
  ok('...still only one chill', e.ambient.length, 1)
  p.y = -25
  ok('he returns once you are properly clear', e.A.consider(e.server, p), 'spawned')
  ok('...and arriving is silent - the chill is for LEAVING', e.ambient.length, 1)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⚠️ HE IS FOUND BY TAG, NOT BY TYPE')
{
  // 🔑 `@e[type=easy_npc:humanoid]` would also match every other humanoid NPC this
  // project ever adds, and the first of those would be killed by Ank's boundary check
  // with nothing anywhere to explain it.
  const e = build()
  const p = e.player(-10, false)
  e.A.consider(e.server, p)
  p.y = -40
  e.A.consider(e.server, p)
  const kill = e.commands.find(c => c.indexOf('kill') !== -1) || ''
  ok('the despawn targets the tag', kill.indexOf('tag=veldora_ank') !== -1, true)
  ok('...and not the bare entity type', /kill @e\[type=/.test(kill), false)
  const tagCmd = e.commands.find(c => c.indexOf(' tag ') !== -1) || ''
  ok('the spawn tags him so he can be found again',
    tagCmd.indexOf('add veldora_ank') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐⭐ THE PRICE FALLS AS HE LOSES — driven by descents, not days')
{
  // 🔑 Every descent is Ank losing the argument, so his next offer is better. The
  // discount is EVIDENCE that he is failing — which means a player who never goes down
  // never sees him desperate, and days would have given that away for free.
  const e = build()
  const p = e.player(-10, false)
  const at = (n) => { e.setDescents(n); return e.A.presetFor(p) }
  ok('a player who has never descended meets an ordinary merchant', at(0), 'arkhdottir/ank_t0')
  ok('one descent and he improves the offer', at(1), 'arkhdottir/ank_t1')
  ok('...two or three, further', at(2), 'arkhdottir/ank_t2')
  ok('...and by four he is openly desperate', at(4), 'arkhdottir/ank_t3')
  ok('...and it does not run off the end', at(99), 'arkhdottir/ank_t3')

  // ⚠️ The tier must reach the SPAWN, not just be computable. A price stage nothing
  // spawns is a table of numbers.
  e.setDescents(2)
  e.A.consider(e.server, p)
  const spawn = e.commands.find(c => c.indexOf('easy_npc spawn') !== -1) || ''
  ok('the spawn command carries the tier', spawn.indexOf('ank_t2') !== -1, true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE PRESET IS GENERATED, AND CARRIES WHAT ETHAN ASKED FOR')
{
  const snbt = fs.existsSync(PRESET) ? fs.readFileSync(PRESET, 'utf8') : ''
  ok('the preset exists', snbt.length > 0, true)
  ok('unkillable', snbt.indexOf('Invulnerable:1b') !== -1, true)
  ok('follows the player', snbt.indexOf('FOLLOW_PLAYER') !== -1, true)
  ok('does not despawn on its own', snbt.indexOf('PersistenceRequired:1b') !== -1, true)
  ok('wears his own skin', snbt.indexOf('veldora:textures/entity/ank.png') !== -1, true)
  ok('he trades at all', snbt.indexOf('Type:"ADVANCED"') !== -1, true)

  // 🔴 THE CURRENCY MUST BE OBTAINABLE ABOVE GROUND, AND THIS IS THE ASSERTION THAT SAYS
  // SO. Emeralds shipped first and a day-1 pathless player has none; numismatics coins are
  // worse - no recipe, no loot table, no villager mixin, so they need Create machinery.
  // A currency the player cannot hold puts Ank's whole argument behind a door.
  const buys = (snbt.match(/buy:\{\s*id:"([^"]+)"/g) || [])
    .map(m => (m.match(/id:"([^"]+)"/) || [])[1])
  ok('he takes something you can get on the surface',
    buys.every(b => b === 'minecraft:wheat' || b === 'minecraft:bread'), true)
  ok('...and nothing that has to be mined',
    /buy:\{\s*id:"minecraft:(iron|gold|diamond|coal|copper|emerald)/.test(snbt), false)
  ok('...and no numismatics coin', snbt.indexOf('numismatics:') === -1, true)

  // ⭐ THE RAMP, READ OFF THE FILES. Tier 0 is an ordinary trade and only the later ones
  // look like panic — if he starts absurd there is nowhere left for him to go.
  const ironAt = (t) => {
    const f = PRESET.replace('ank_t0', 'ank_t' + t)
    const m = /sell:\{\s*id:"minecraft:iron_ingot",\s*count:(\d+)/.exec(fs.readFileSync(f, 'utf8'))
    return m ? Number(m[1]) : -1
  }
  const ramp = [0, 1, 2, 3].map(ironAt)
  ok('four tiers exist', ramp.every(n => n > 0), true)
  ok('...tier 0 is an ordinary trade, not a bribe', ramp[0] <= 2, true)
  ok('...and each tier is strictly better than the last',
    ramp.every((n, i) => i === 0 || n > ramp[i - 1]), true)
  ok('...ending somewhere absurd', ramp[3] >= 12, true)
  // ⛔ He never fights. An attack objective here would turn a warning into a brawl.
  ok('carries no attack objective', /Type:"(MELEE|BOW|CROSSBOW|GUN|ZOMBIE)_ATTACK"/.test(snbt), false)
  ok('...and no attack targeting', /Type:"ATTACK_/.test(snbt), false)
  // The skin must be lowercase or the resource location cannot resolve at all.
  ok('the skin path is lowercase', !/[A-Z]/.test(
    (snbt.match(/veldora:textures\/entity\/[^"]+/) || [''])[0]), true)
}

// ═══════════════════════════════════════════════════════════════════════════
grp("🖊️ HIS DIALOGUE, IMPORTED AND NOT EDITED")
{
  const snbt = fs.readFileSync(PRESET, 'utf8')
  const lines = fs.readFileSync(path.join(SS, 'ank_lines.js'), 'utf8')

  ok('the intro tree reached the preset', snbt.indexOf('DialogData') !== -1, true)
  ok('...with his opening line', snbt.indexOf('Oh, a villager') !== -1, true)

  // ⭐ THREE BUTTONS, NOT TWO. "I am going down into the depths" and "I am going to
  // gather ores" are two ways of saying the same thing, sharing one reply — and the
  // first parser filed the second as one of ANK'S lines, putting a player line in his
  // mouth. That is the kind of error nobody would spot in game; it just reads as him
  // saying something odd.
  const buttons = (snbt.match(/Label:"opt_[0-9]+"/g) || []).length
  ok('every player option is a button', buttons, 3)
  ok('...including the one that shares a reply',
    snbt.indexOf('I am going to gather ores') !== -1, true)
  ok('...and the sheriff branch', snbt.indexOf('sheriff around these parts') !== -1, true)

  // ⛔ HIS TEXT IS VERBATIM. Both of these read as typos, both are his, and a future
  // session must not tidy them — the interruption is him being cut off by his own
  // argument, which is the whole point of the day-2 line.
  ok('the day-2 interruption survives',
    lines.indexOf("I don't agree with it, i don't agree with") !== -1, true)
  ok("...and 'apart of' is left alone", lines.indexOf('apart of') !== -1, true)

  // 🔑 A BLANK DAY IS A DESIGN, NOT A GAP. Ethan: "i left some days of dialogue blank
  // because well there's nothing to say... this is also why i built alot of randomized
  // trade dialogue aswell."
  ok('only the written days are in the pool',
    (lines.match(/^    [0-9]+: \[/gm) || []).length, 3)
  ok('...and the rotation is there to cover the rest',
    (lines.match(/^    \[/gm) || []).length >= 6, true)
}


// ═══════════════════════════════════════════════════════════════════════════
grp('⭐ THE GREETING — in the chat bar, as <Ank>, once a day')
{
  const e = build()
  const p = e.player(10, false)          // in his band
  e.setDay(2)                            // a day Ethan wrote

  ok('he greets on arriving', e.A.consider(e.server, p), 'spawned')
  ok('...and does not greet twice on one arrival',
    e.A.greet(e.server, p), 'greeted-today')
  ok('...and something was actually said', e.spoken.length > 0, true)
  ok('...and the chill did NOT fire on arriving', e.ambient.length, 0)
}

{
  // 🔑 VANILLA'S SHAPE, EXACTLY. Ethan asked for the chat bar "or however its done in
  // minecraft natively", and native is `<Name> text` — no colon, no colour code, no tag
  // of ours. A future session adding §7 or a [NPC] prefix should fail here.
  const e = build()
  e.setDay(7)
  e.A.consider(e.server, e.player(10, false))
  e.tick()
  // 🚨 PIN THE COUNT FIRST. `[].every()` is true and `[].some()` is false, so all three of
  // these assertions reported ok when NOTHING had been said — the project's own
  // "I failed and I found nothing must not share a return value", at the assertion level.
  ok('he said all five of day 7', e.spoken.length, 5)
  ok('every line is vanilla chat shape',
    e.spoken.every(t => t.indexOf('<Ank> ') === 0), true)
  ok('...with no colour codes smuggled in', e.spoken.some(t => /§/.test(t)), false)
  ok('...and no bracketed tag of our own', e.spoken.some(t => /\[/.test(t)), false)
}

{
  // 🔑 ONCE A DAY, NOT ONCE AN ARRIVAL. He respawns every time the player crosses the
  // boundary, and an ungated greeting would fire several times an hour — which would make
  // the written days stop reading as days at all.
  const e = build()
  const p = e.player(10, false)
  e.setDay(4)
  e.A.consider(e.server, p)
  const first = e.spoken.length
  ok('day 4 is written, so he has something to say', first > 0, true)

  // ⚠️ DOWN, not up. The player stub's sky answer is fixed at construction, so surfacing
  // cannot be simulated by raising y — a cave at y=100 under a mountain is still a cave.
  p.y = -50
  ok('going deep sends him away', e.A.consider(e.server, p), 'despawned')
  p.y = 10
  ok('he comes back', e.A.consider(e.server, p), 'spawned')
  ok('...and says nothing the second time today', e.spoken.length, first)

  e.setDay(5)
  p.y = -50; e.A.consider(e.server, p)
  p.y = 10
  e.A.consider(e.server, p)
  ok('...but greets again tomorrow', e.spoken.length > first, true)
}

{
  // ⭐ A BLANK DAY IS ANSWERED BY THE ROTATION. Ethan left days 0/1/3/5/6 empty on
  // purpose, so the falsifier is not "day 5 says nothing" — it is "day 5 says something,
  // and the code KNOWS it came from the rotation rather than from a written day".
  const e = build()
  e.setDay(5)
  const r = e.A.greet(e.server, e.player(10, false))
  ok('a blank day still speaks', r.indexOf('spoke:') === 0, true)
  ok('...and reports the rotation as the source', r.indexOf(':general:') !== -1, true)

  const e2 = build()
  const r2 = e2.A.greet(e2.server, e2.player(10, false))   // day 0 — also blank
  ok('day 0 is blank and falls through the same way', r2.indexOf(':general:') !== -1, true)

  const e3 = build()
  e3.setDay(7)
  ok('day 7 is written and says so',
    e3.A.greet(e3.server, e3.player(10, false)).indexOf(':day:') !== -1, true)
}

{
  // 🔴 ETHAN'S WRITING, THROUGH THE WHOLE PIPE. The harness loads the real
  // ank_lines.js, so this asserts HIS text arrives at the chat call unedited — not
  // that a fixture does. ⚠️ And it drives `consider`, not `greet`, because the tail is
  // now liveness-guarded: greeting a player Ank is not out with is correctly silent.
  const e = build()
  const p = e.player(10, false)
  e.setDay(7)
  e.A.consider(e.server, p)
  ok('only the first line has landed before any time passes', e.spoken.length, 1)
  e.tick()
  const said = e.spoken.map(t => t.replace('<Ank> ', ''))
  ok('day 7 arrives as five separate chat lines', said.length, 5)
  ok('...with his first line intact', said[0], 'Hey, Stay out of the mines today.')
  ok("...and 'apart of' still not corrected",
    said.some(t => t.indexOf('apart of') !== -1), true)
  ok('...ending on the plea', said[said.length - 1], 'Please')

  // ⚠️ ONE MESSAGE PER LINE HE WROTE — no sentence-splitting. Chat wraps by itself;
  // splitting "Watcha buyin'. HA! Haaaa..." into four <Ank> lines would invent a delivery
  // Ethan did not write.
  const e2 = build()
  e2.setDay(2)
  e2.A.consider(e2.server, e2.player(10, false))
  e2.tick()
  ok('a four-sentence line stays ONE chat message', e2.spoken.length, 1)
  ok('...and the em-dash interruption survives to the mouth',
    e2.spoken[0].indexOf('agree with—') !== -1, true)
}

{
  // ⭐ PACED, NOT DUMPED. The first line is immediate so a restart cannot cost the beat;
  // the rest are scheduled about a second apart.
  const e = build()
  e.setDay(7)
  e.A.greet(e.server, e.player(10, false))
  ok('the first line is NOT scheduled', e.delays.length, 4)
  ok('...and the rest step apart rather than landing together',
    e.delays.every((d, i) => i === 0 || d > e.delays[i - 1]), true)
  ok('...and the whole run is short enough to survive a restart',
    e.delays[e.delays.length - 1] <= 20 * 8, true)
}

{
  // ⚠️ "I FAILED" AND "I FOUND NOTHING" MUST NOT SHARE A RETURN VALUE.
  const e = build()
  e.setMute(true)
  const p = e.player(10, false)
  e.setDay(7)
  ok('a chat surface that throws is MUTE, not a quiet day',
    e.A.greet(e.server, p), 'mute')
  ok('...and it is logged as an error',
    e.logs.some(l => l.indexOf('ERR') === 0 && l.indexOf('delivered NONE') !== -1), true)

  // 🔑 AND THE DAY IS NOT STAMPED, so a recovered voice still greets today.
  e.setMute(false)
  ok('...and he has not lost the day', e.A.greet(e.server, p).indexOf('spoke:'), 0)
}

{
  const e = build()
  delete e.ctx.VELDORA.ankLines
  ok('no imported lines is loud, and not the same as an empty day',
    e.A.greet(e.server, e.player(10, false)), 'no-lines')

  const e2 = build()
  delete e2.ctx.VELDORA.urge.dayOf
  ok('no world clock is its own state, and he does NOT greet blind',
    e2.A.greet(e2.server, e2.player(10, false)), 'unreadable')
  ok('...and it names the load order',
    e2.logs.some(l => l.indexOf('LOAD ORDER') !== -1), true)
}

{
  // 🔴 THE OVERLAY VOICE IS GONE, NOT GATED. It shipped for one commit and Ethan
  // reversed it; a registered speaker with no caller is the shadow-build this project
  // keeps catching itself doing.
  const src = fs.readFileSync(path.join(SS, 'ank.js'), 'utf8')
  ok('no cast.define survives', /VELDORA\.cast\.define\(/.test(src), false)
  ok('...and nothing calls cast.speak', /cast\.speak\(/.test(src), false)
  // 🚨 MEASURED AT THE POINT OF USE, not by grep. The first version counted
  // `typeof VELDORA.announce.text !== 'function'` — the guard — as a call site, and read 2.
  // A string that appears in a file is not a call.
  const e = build()
  const p = e.player(10, false)
  e.setDay(7)
  e.A.consider(e.server, p)              // arrive + greet
  e.tick()
  ok('...while every one of his own lines went to chat',
    e.spoken.length === 5 && e.spoken.every(t => t.indexOf('<Ank> ') === 0), true)
  p.y = -50; e.A.consider(e.server, p)   // leave: the chill
  ok('the AMBIENT surface carries the chill and NOTHING else',
    e.ambient, ['A chill runs up your spine.'])
}

{
  // 🔴 A MAN WHO HAS LEFT MUST STOP TALKING. This is the regression the synchronous stub
  // hid: the tail of a greeting kept arriving after the boundary despawned him, so the
  // player read "A chill runs up your spine." and then three more <Ank> lines from
  // somebody who was not there. The eeriest beat in Act 0, ruined by a callback.
  const e = build()
  const p = e.player(10, false)
  e.setDay(7)
  e.A.consider(e.server, p)
  ok('one line out, four still queued', [e.spoken.length, e.queued.length], [1, 4])

  p.y = -50
  ok('he leaves mid-greeting', e.A.consider(e.server, p), 'despawned')
  ok('...and the chill is the last thing said', e.ambient.length, 1)
  e.tick()
  // ⚠️ MEASURED NEGATIVE CONTROL: this goes red only when BOTH the isActive guard and the
  // epoch guard are removed from ank.js. Either alone holds it. That is recorded here
  // because the first version of this comment claimed the isActive guard was what did the
  // work, and the control disproved it.
  ok('...and the four queued lines are DROPPED, not delivered', e.spoken.length, 1)
}

{
  // ⚠️ AND THE READ-ALOUD IS NOT LIVENESS-GUARDED, because nobody is in a cave when an
  // admin runs it. The guard truncated `/ank greet 7` to one line the moment it landed —
  // silently gutting the one tool that exists to READ ETHAN'S WRITING.
  const e = build()
  const got = e.lines.forDay(7)
  ok('the read-aloud path exists', got.lines.length, 5)
  const src = fs.readFileSync(path.join(SS, 'ank.js'), 'utf8')
  ok('...and the command asks for it UNguarded',
    /saySeq\(ctx\.source\.server, p, got\.lines, false\)/.test(src), true)
  ok('...while his own greeting is guarded',
    /saySeq\(srv, p, lines, true\)/.test(src), true)
}

console.log('\n' + (fail ? R + fail + ' FAILED, ' + X : G) + pass + ' passed' + X)
process.exit(fail ? 1 : 0)
