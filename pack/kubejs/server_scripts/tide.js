// tide.js — THE TIDE.  docs/50.
//
// Ethan, 2026-08-18: "straggling mobs as you move through the levels then every 30s
// or so you hear a scream and then music and then a massive wave of enemy batters you
// for like 20 seconds. it's the dopamine rush there... my idea of the depth is kinda
// like a rougelike system where you go down fight enemies get loot, escape."
//
// And 2026-08-22: "wave cadence is 5-10 minutes and 30 seconds of mobs spawning at a
// distance then pathfinding to the players and yes not on the surface."
//
// ── ⭐ A WAVE IS AN ARRIVAL, NOT A DROP ──────────────────────────────────────
// The single most important line in his spec. Mobs spawn AT RANGE across a
// thirty-second window and WALK IN. That is a different mechanic from dropping eight
// things on somebody, and a better one:
//
//   · you hear it before you see it - the dread lives in the walk
//   · ground you chose to stand on matters, and running is a real option
//   · nothing can ever materialise inside your hitbox
//
// ── ⭐ THE HERALD IS CHOSEN BY DEPTH ────────────────────────────────────────
// "announced by god dialogue if they can hear you and speaker dialogue if too deep."
// So the tide is one mechanic with two narrators, and WHICH ONE tells you is itself
// the depth gauge:
//
//     enclosed, y >= 0    your own god warns you. He can still reach down here.
//     enclosed, y <  0    the Speaker does. Your god cannot.
//
// Nothing at all under open sky - the two-realm thesis is untouched.
//
// ── 🚨 A TIDE MUST END, OR IT IS TINNITUS ───────────────────────────────────
// Darktide works because a mission is thirty minutes and then it is OVER. Minecraft
// is not. A wave every five minutes forever is not a dopamine loop, it is weather -
// and Ethan has already reported that fatigue once, about events far cheaper than a
// thirty-second assault.
//
// His own framing is the fix: the tide is bounded by THE RUN. Go under, it starts
// quiet. Stay, it escalates. Leave or die, it ENDS and resets. That gives a beginning
// the player chooses, an escalation they can feel, and an exit they control - which
// is what makes the loot a decision instead of a drip.
//
// ── ⚠️ WHY THIS DOES NOT NEED THE VOID RULING ───────────────────────────────
// docs/50 §1 measured everything below y-64 as 100% air, and the open question is
// whether to fix worldgen or build an arena down there. THE TIDE DOES NOT WAIT ON
// THAT. Its home is "enclosed and below 0", which is ordinary cave terrain with real
// floors (y0..-64 measures 3.6-10% open). The hollow band remains a separate
// question about the Abyssal, not a blocker for this.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[tide] '
  var GATE = true

  // ── the run ────────────────────────────────────────────────────────────────
  var SWEEP = 100                 // 5s between checks - cheap, only online players
  var ENTER_TICKS = 300           // 15s enclosed before a run BEGINS
  var LEAVE_TICKS = 200           // 10s of sky before it ENDS
  // 🔴 GRACE WAS A FLOOR THAT WAS BEING USED AS AN OFFSET. Fixed 2026-08-24 from
  // Ethan's play log - "apparently the tide never tided".
  //
  // The comment said "60s into a run before the first wave can land". The code said
  // `st.next = GRACE + nextGap(p)` - sixty seconds PLUS a full 5-10 minute gap, so the
  // first wave needed SIX TO ELEVEN MINUTES of unbroken enclosure. His log is the
  // proof: the single run that ever produced a wave began 15:21 and fired at 15:28,
  // seven minutes in. Every other run was 1-5 minutes and got nothing:
  //
  //     16:09:04 surfaced - tide ends after 0 wave(s), 2 min
  //     16:11:34 surfaced - tide ends after 0 wave(s), 1 min
  //
  // ⚠️ AND SURFACING WIPES THE RUN, so every dip restarted that clock from zero. A
  // player who goes in and out - which is how anyone actually mines - could never
  // reach a wave at all.
  var GRACE = 1200                // 60s minimum before the first wave can land

  // ⭐ THE FIRST WAVE IS ITS OWN WINDOW, NOT THE ORDINARY CADENCE. Going under has to
  // announce itself while you still remember choosing it; the 5-10 minute rhythm is
  // for a run you have already committed to, not for the doorway.
  var FIRST_MIN = 1200            // 60s  \  so the first wave lands between one and
  var FIRST_MAX = 3000            // 150s /   two and a half minutes under

  // ⚠️ ENTERING MUST BE DELIBERATE. Without ENTER_TICKS, stepping into a doorway or
  // under an overhang starts a run, and the tide becomes something that happens TO
  // you rather than something you chose. Leaving is faster than entering on purpose:
  // getting out should feel like getting out.
  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ THE TIDE IS A RARE EVENT ON A PERSISTENT CLOCK. Ethan, 2026-08-24:
  //
  //     "maybe tides should be on 1-2 hour intervals randomly so you're not constantly
  //      battered, and it should be a sort of 'it can happen at any time' type of
  //      thing."
  //
  // 🔴 THE CLOCK USED TO LIVE INSIDE THE RUN, AND THAT COULD NOT SURVIVE THIS. The old
  // countdown ticked only while enclosed and was wiped the moment you surfaced. At
  // 5-10 minutes that was merely strict; at 1-2 HOURS it would mean nobody ever sees a
  // tide again, because one trip up for supplies resets it.
  //
  // 🔑 SO THE COUNTDOWN IS PERSISTENT AND PER PLAYER, and it runs wherever you are.
  // When it comes due it does not fire into the sky - it WAITS, and lands the next
  // time you are enclosed. That is exactly "it can happen at any time": you do not
  // know when you are due, and going underground while you are is how you find out.
  //
  // ⚠️ COUNTED IN PLAYED TICKS, NOT WORLD TIME. It only decrements in the sweep and
  // the sweep only sees online players, so logging off never brings a tide closer.
  // Same reasoning as ranks.js's boredom, same free implementation - and it sidesteps
  // finding K9 entirely, because nothing here reads a clock that can run backwards.
  var TIDE_MIN = 72000            // 1 real hour of play
  var TIDE_MAX = 144000           // 2 real hours of play

  // ⭐ THE FIRST ONE COMES SOONER, or the mechanic is folklore to a new champion.
  var FIRST_DUE_MIN = 2400        // 2 minutes
  var FIRST_DUE_MAX = 9600        // 8 minutes

  var K_DUE = 'veldora_tide_due'      // played ticks until the next tide
  var K_SEEDED = 'veldora_tide_seed'  // has this player been given a first window
  var K_LIFETIME = 'veldora_tide_n'   // tides survived ever - drives escalation

  // ⚠️ RETIRED, KEPT ONLY FOR /tide force. The old per-run cadence; nothing schedules
  // with it any more.
  var WAVE_MIN = 6000
  var WAVE_MAX = 12000
  var SPAWN_WINDOW = 600          // 30s of arrivals, per Ethan
  var SPAWN_BATCHES = 6           // ...delivered in this many pulses, 5s apart

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔴 SCALE — REBUILT 2026-08-23. Ethan: "Make tides actually hard", and when
  // offered tankier-vs-more: "for tankier, no, the answer is more undead."
  //
  // ⚠️ THE OLD NUMBERS WERE NOT A TIDE. BASE 1 / GROWTH 0.5 / MAX 5 across six
  // pulses produced:
  //
  //     wave 1 -> 6 mobs      wave 2 -> 12      wave 5 -> 18      wave 9+ -> 30
  //
  // Six mobs spread over thirty seconds is one mob every five seconds. That is
  // ambient cave spawning with a sound cue in front of it, and it is nowhere near
  // his original spec: "a massive wave of enemy batters you for like 20 seconds."
  //
  // ⭐ WHY MORE AND NOT TOUGHER IS THE RIGHT CALL (and it is his, not mine): tanky
  // undead just extend the same fight. A CROWD changes what the fight IS - you get
  // pushed, surrounded, cut off from the way you came. That is the Darktide feeling
  // he described, and it is also the only version that makes a corridor matter.
  //
  //     wave 1 -> 24 mobs     wave 2 -> 36      wave 5 -> 60      wave 8+ -> 72
  var BASE_PER_BATCH = 4
  var GROWTH = 1.5                // extra mobs per wave index
  var MAX_PER_BATCH = 12

  // 🚨 AND THEREFORE A CEILING, because the tide is PER PLAYER. Four champions in
  // the depths at once means four independent runs, and at 72 apiece that is 288
  // undead pathfinding at the same time on a machine that also runs Create.
  //
  // Counted LIVE from the world rather than tracked in a variable - a counter that
  // drifts would either strangle the tide or fail to stop it, and neither failure
  // announces itself. Tagged mobs, measured at the point of use.
  var TIDE_TAG = 'veldora_tide'

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ D3 - STEPPED TIERS, DRIVEN BY TRUST. Ethan, 2026-08-29:
  //
  //     "We should have stepped tiers to the tides system... scaled by the god's trust
  //      since that indicates how dangerous you are to the goddess of death."
  //
  // 🔑 THAT RATIONALE IS THE DESIGN, not a justification bolted to it. Notoriety is
  // a clock; trust is what your god has DECIDED about you. The goddess of death sends
  // what your standing deserves, so the same night is a different night depending on
  // whose champion you are.
  //
  // ⚠️ WALL AND FORGE START AT MAX TRUST AND DECAY, so their champions meet the worst
  // of this immediately. That is Ethan's ruling working - *"wall and forge get to
  // struggle, im the one playing those classes anyways"* - not an oversight.
  //
  // 🚨 EVERY MULTIPLIER IS >= 1. Standing rule: *"we should never have a coeffecient go
  // under 1 it should always be an increase."* Trust never makes a night SAFER than the
  // baseline; it only ever makes it worse.
  var TIERS = [
    { at: 0, mods: ['horde'],                                      mult: 1.00 },
    { at: 2, mods: ['horde', 'general'],                           mult: 1.15 },
    { at: 3, mods: ['horde', 'general', 'specialist'],             mult: 1.30 },
    { at: 4, mods: ['horde', 'general', 'specialist', 'miniboss'], mult: 1.50 },
    { at: 5, mods: ['horde', 'general', 'specialist', 'miniboss'], mult: 1.75 },
  ]

  // ⚠️ "higher (NOT high)" is Ethan's phrasing for the specialist wave and it is doing
  // real work: ranged enemies stack in a way melee does not, because they all reach you
  // at once from cover. 0.40 is "you are being shot at"; 0.75 would be unplayable.
  var MODS = {
    horde:      { ranged: 0.00, boss: false, label: 'a pure horde' },
    general:    { ranged: 0.15, boss: false, label: 'a general wave' },
    specialist: { ranged: 0.40, boss: false, label: 'a specialist wave' },
    miniboss:   { ranged: 0.10, boss: true,  label: 'a miniboss and a horde' },
  }

  // ── the ranged pool ────────────────────────────────────────────────────────
  // 🚨 ONLY `minecraft:skeleton` IS CERTAIN. The others are named for skeletons and
  // are very probably archers, but nothing here has been PROBED for attack type - the
  // registry can confirm an id exists, not how it fights.
  //
  // ⚠️ SO THIS LIST WANTS A PASS, and it is deliberately small rather than optimistic:
  // a melee mob mislabelled ranged just makes a specialist wave less special, while the
  // reverse would make it a wall of arrows nobody survives.
  // ⭐ CORRECTED 2026-08-29 after Ethan asked the obvious question - *"Why are ranged
  // enemies not spawning?"* - and the answer was that at tide depth there were none.
  // `rosterFor` returns DEEPER below y-40, DEEPER held no archer, and the composer
  // correctly fell back to melee. The mechanism worked; the roster was empty.
  //
  // ⚠️ AND ETHAN RULED ON THE TWO I HAD REFUSED TO GUESS: *"banshee and thrasher can be
  // added to the horde regardless but they both are melee."* They stay in the rosters
  // and stay OUT of this list.
  //
  // 🚨 VANILLA ARCHERS CARRY THE DEEP, on purpose. stray and bogged are unambiguously
  // ranged undead - no guessing about attack type, which is the thing the registry
  // cannot answer. A less exotic archer that definitely shoots beats a characterful one
  // that might not.
  var RANGED = {
    'minecraft:skeleton': true,
    'minecraft:stray': true,
    'minecraft:bogged': true,
    'born_in_chaos_v1:decrepit_skeleton': true,
    'born_in_chaos_v1:skeleton_demoman': true,
    'rottencreatures:skeleton_lackey': true,
  }

  // ── the minibosses ─────────────────────────────────────────────────────────
  // 🔴 EVERY ID HERE WAS REGISTRY-PROBED ON THE LIVE SERVER, and three of Ethan's
  // four names were wrong in a way a lang file would not have revealed:
  //
  //     missionary          -> DOES NOT EXIST. It is `missionary_raider`.
  //     supreme_bonecaller  -> DOES NOT EXIST. It is `supreme_bonescaller` (an S).
  //     bonecaller          -> DOES NOT EXIST either, for the same reason.
  //
  // The probe: `data get entity @e[type=<id>,limit=1]` answers "No entity was found"
  // for a real id and a parse caret for a fake one, and a known-fake control was run
  // alongside to prove the method could tell them apart.
  //
  // ⛔ `fallen_chaos_knight` IS DELIBERATELY ABSENT. It is Blade's stalker avatar, "The
  // Challenger", and Ethan ruled it stays his.
  var BOSSES = [
    'born_in_chaos_v1:supreme_bonescaller',
    'born_in_chaos_v1:missionary_raider',
    'born_in_chaos_v1:missioner',
  ]

  // ⭐ THE TAKER IS A TELL, NOT A SPAWN. Ethan: *"Art is just kayer and she is already
  // secretly aligned with the goddess of death."* The tide IS the goddess of death's
  // army, so The Taker marching in it is EVIDENCE of that alliance - which means it has
  // to be RARE. A clue that turns up every fourth tide is set dressing, not a clue.
  var TAKER = 'born_in_chaos_v1:lifestealer'
  var TAKER_CHANCE = 0.06
  var MAX_ALIVE_NEAR = 45         // per player, within CENSUS_RANGE
  var CENSUS_RANGE = 48

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ THE TIDE IS THE GODDESS OF DEATH'S ARMY. UNDEAD ONLY.
  //
  // Ethan, 2026-08-22: "i want only undead mobs to be apart of the tide. Creepers
  // and spiders, etc are not apart of the goddess of death's army or control."
  //
  // 🚨 THE FIRST ROSTER WAS 6/21 UNDEAD. It was lifted from spawner.json's depth
  // tiers, which exist to make caves dangerous and have no opinion about whose army
  // anything belongs to. Creepers, spiders, the Knocker and most of grim_and_bleak
  // were in a wave that is supposed to be HERS.
  //
  // ⚠️ AND THE NAMES LIE. Checked against `#minecraft:undead` read straight out of
  // the mod jars, not guessed:
  //     grim_and_bleak:flesh_eater      NOT undead
  //     grim_and_bleak:night_abomination NOT undead
  //     born_in_chaos_v1:restless_spirit NOT undead
  // Three things that read as undead from the name and are not tagged as it. This is
  // the only reason the audit was worth doing rather than eyeballing the list.
  //
  // 🔑 ONE DELIBERATE EXCEPTION, NAMED RATHER THAN HIDDEN: Rotten Creatures tags
  // NOTHING into #minecraft:undead, but the mod IS an undead roster - its own
  // modlist entry reads "A serious roster of new undead", and undead_miner /
  // zombie_lackey / skeleton_lackey / burned / immortal are undead in every sense
  // except the one the author forgot. They are allowlisted; smite will not work on
  // them, which is a real cost, and it is the mod's bug rather than ours.
  //
  // Every id below was probed against the LIVE registry, so none of them is a
  // magistuarmory:bronze_ingot waiting to happen.
  // ═══════════════════════════════════════════════════════════════════════════
  var SHALLOW = [
    'minecraft:zombie', 'minecraft:skeleton', 'minecraft:husk', 'minecraft:drowned',
    'born_in_chaos_v1:decaying_zombie', 'born_in_chaos_v1:decrepit_skeleton',
  ]
  var DEEP = [
    'born_in_chaos_v1:decaying_zombie', 'born_in_chaos_v1:decrepit_skeleton',
    'born_in_chaos_v1:barrel_zombie', 'grim_and_bleak:ghoul',
    'galosphere:preserved', 'goety:rattled', 'goety:wight',
    'rottencreatures:undead_miner', 'rottencreatures:zombie_lackey',
    'rottencreatures:skeleton_lackey',
  ]
  var DEEPER = [
    'grim_and_bleak:damned_templar', 'grim_and_bleak:banshee',
    'born_in_chaos_v1:bone_imp', 'born_in_chaos_v1:skeleton_thrasher',
    'born_in_chaos_v1:zombie_bruiser', 'goety:haunt', 'goety:wight',
    'iceandfire:dread_thrall', 'iceandfire:dread_ghoul',
    'rottencreatures:burned', 'rottencreatures:immortal',
    // ⭐ THE DEEP HAD NO ARCHERS AT ALL until 2026-08-29, which is why specialist
    // waves silently degraded into hordes below y-40 - and below y-40 is where the
    // tide actually happens. Ethan: *"Why are ranged enemies not spawning?"*
    //
    // 🚨 Vanilla archers, deliberately. stray and bogged are unambiguously ranged
    // undead; nothing here depends on guessing how a modded mob fights.
    'minecraft:stray',
    'minecraft:bogged',
    'born_in_chaos_v1:skeleton_demoman',
  ]

  // Named here so the harness can assert the exception is exactly this and has not
  // quietly grown. If a mob is added to the rosters above and is neither tagged
  // undead nor listed here, the test fails.
  var UNTAGGED_UNDEAD = [
    'rottencreatures:undead_miner', 'rottencreatures:zombie_lackey',
    'rottencreatures:skeleton_lackey', 'rottencreatures:burned',
    'rottencreatures:immortal',
  ]

  var SOUND_TELL = 'minecraft:entity.warden.nearby_closest'
  var SOUND_WAVE = 'minecraft:entity.wither.spawn'

  // uuid -> run state. IN MEMORY BY DESIGN: a run is a session, and one that
  // survived a restart would resume mid-escalation with no way for a player to tell
  // why the world got loud.
  var runs = {}

  function seesSky(p) {
    try {
      var lvl = p.level
      if (lvl && typeof lvl.canSeeSky === 'function') return !!lvl.canSeeSky(p.blockPosition())
      var b = p.block
      if (b && typeof b.canSeeSky === 'boolean') return !!b.canSeeSky
      if (b && typeof b.canSeeSky === 'function') return !!b.canSeeSky()
    } catch (e) { }
    return null
  }

  // "Not on the surface" - enclosed, at any height. Depth then decides the HERALD
  // and the roster, not whether the tide runs at all.
  function enclosed(p) {
    var sky = seesSky(p)
    if (sky === null) return null       // unreadable: never guess, see the sweep
    return !sky
  }

  function depthOf(p) {
    try { var y = p.y; if (typeof y === 'number' && isFinite(y)) return y } catch (e) { }
    return null
  }

  // Highest trust across the paths this player holds. ⚠️ Reads through VELDORA.trust,
  // which is per-path; a pathless player is 0 and therefore always tier 0.
  function trustOf(server, p) {
    try {
      if (typeof VELDORA.trust !== 'function') return 0
      var t = VELDORA.trust(server, p)
      return (typeof t === 'number' && isFinite(t) && t > 0) ? t : 0
    } catch (e) { return 0 }
  }

  function tierFor(server, p) {
    var t = trustOf(server, p)
    var out = TIERS[0]
    for (var i = 0; i < TIERS.length; i++) if (t >= TIERS[i].at) out = TIERS[i]
    return out
  }

  function pickMod(server, p, forced) {
    if (forced && MODS[forced]) return forced
    var tier = tierFor(server, p)
    return tier.mods[Math.floor(Math.random() * tier.mods.length)]
  }

  // Compose the id list for one pulse. Returns { ids, boss } where `boss` is a single
  // extra id to place once, or null.
  //
  // ⚠️ FALLS BACK TO MELEE IF THE RANGED POOL IS EMPTY AT THIS DEPTH. A specialist wave
  // that found no archers must still be a wave - spawning nothing would read exactly
  // like the tide being broken, which is the failure this project keeps paying for.
  function composeFor(server, p, y, modName) {
    var pool = rosterFor(y)
    var mod = MODS[modName] || MODS.horde
    var melee = [], ranged = []
    for (var i = 0; i < pool.length; i++) {
      if (RANGED[pool[i]]) ranged.push(pool[i]); else melee.push(pool[i])
    }
    if (!melee.length) melee = pool.slice()

    var ids = []
    if (mod.ranged > 0 && ranged.length) {
      // Weight the list rather than the roll: `spawner.wave` picks uniformly from
      // `ids`, so repeating an entry is how a proportion is expressed.
      var slots = 20
      var nR = Math.max(1, Math.round(slots * mod.ranged))
      for (var r = 0; r < nR; r++) ids.push(ranged[r % ranged.length])
      for (var m = 0; m < slots - nR; m++) ids.push(melee[m % melee.length])
    } else {
      ids = melee.slice()
    }

    var boss = null
    if (mod.boss && BOSSES.length) {
      boss = BOSSES[Math.floor(Math.random() * BOSSES.length)]
      if (Math.random() < TAKER_CHANCE) boss = TAKER
    }
    return { ids: ids, boss: boss, mod: modName, rangedAvailable: ranged.length }
  }

  function rosterFor(y) {
    if (y >= 0) return SHALLOW
    if (y > -40) return DEEP
    return DEEPER
  }

  // ⭐⭐ THE MATRIARCH'S CHAMPION DRAWS THE TIDE. Ethan, 2026-08-24:
  //
  //     "her champion's presence increases... things that are technically not in the
  //      domain of the gods above but instead in the underground. Tides, waves,
  //      enemies, etc." ... "i think the answer is actually not spawn rates and just
  //      tide chances."
  //
  // 🔑 TIDE CHANCES AND NOT SPAWN RATES, AND THAT DISTINCTION SAVED THE DESIGN. Ambient
  // spawn rate is a property of the WORLD - an Art champion would have made the depths
  // worse for everyone else in the same save, which is a grief mechanic nobody asked
  // for. A tide run is per-player state (`runs[uuid]`), so this lands on HER champion
  // and nobody else's. docs/63 §9 listed the world-wide version as a falsifier; the
  // narrower ruling removes it outright.
  //
  // ⭐ AND IT IS THE ONLY WAY SHE COULD TOUCH THE WORLD AT ALL. Her whole design is
  // five zeroes on the forced column because she cannot reach it (art_events.js). She
  // is not spawning anything here either - she is a presence the underground responds
  // to. Same shape as her Trial: things come because she is near, not because she sent
  // them.
  //
  // ⚠️ RANK 0 CHANGES NOTHING. The multiplier only ever shortens the gap, never
  // lengthens it, so a low-rank Art walker gets the ordinary tide rather than a
  // gentler one - "she has not noticed you yet", not "she is protecting you".
  var ART_PULL = 0.5          // at max rank the gap is this fraction of normal

  function artPull(p) {
    try {
      if (!VELDORA.paths || VELDORA.paths.pathOf(p) !== 'art') return 1
      if (!VELDORA.trustScale) return 1
      var sc = VELDORA.trustScale(p.server, p)
      if (typeof sc !== 'number' || !isFinite(sc) || sc <= 0) return 1
      if (sc > 1) sc = 1
      return 1 - (1 - ART_PULL) * sc
    } catch (e) { return 1 }
  }

  // The doorway window. Shares artPull so her champion is drawn in faster from the
  // very first wave rather than only from the second.
  function firstGap(p) {
    var base = FIRST_MIN + Math.floor(Math.random() * (FIRST_MAX - FIRST_MIN + 1))
    var pull = p ? artPull(p) : 1
    if (pull >= 1) return base
    return Math.max(SWEEP, Math.round(base * pull))
  }

  function nextGap(p) {
    var base = WAVE_MIN + Math.floor(Math.random() * (WAVE_MAX - WAVE_MIN + 1))
    if (!p) return base
    var pull = artPull(p)
    if (pull >= 1) return base
    var out = Math.max(SWEEP, Math.round(base * pull))
    return out
  }

  // ── the announcement ───────────────────────────────────────────────────────
  // ⭐ Whichever voice can still reach you. Below 0 your god has gone quiet and the
  // Speaker has the job - which is deep_speaker.js's entire premise doing mechanical
  // work rather than just atmosphere.
  function herald(p, y) {
    var spoke = false
    try {
      if (y < 0 && VELDORA.speaker && VELDORA.speaker.active(p)) {
        spoke = !!VELDORA.speaker.say(p, 'warn_wave')
      }
    } catch (e) { }
    if (!spoke) {
      try {
        var god = VELDORA.paths ? (VELDORA.paths.pathOf(p) || '') : ''
        if (god && VELDORA.voice) spoke = !!VELDORA.voice.say(p, god, 'warn_wave')
      } catch (e) { }
    }
    // ⚠️ THE SOUND IS NOT A FALLBACK, IT IS THE TELL. A pathless player, or one whose
    // god has no line written, must still get the warning - otherwise the wave is the
    // effect-from-nowhere this whole design exists to avoid. Words are the flavour;
    // the sound is the contract.
    try {
      var srv = p.server
      srv.runCommandSilent('execute as ' + p.username + ' at @s run playsound ' +
        SOUND_TELL + ' hostile @s ~ ~ ~ 1 0.6')
    } catch (e) { }
    return spoke
  }

  // ── the wave ───────────────────────────────────────────────────────────────
  function sendWave(p, st, forcedMod) {
    var y = depthOf(p)
    if (y === null) return
    var srv = null
    try { srv = p.server } catch (e) { }

    // ⭐ D3 - which KIND of wave, and how big, both come from trust.
    var modName = pickMod(srv, p, forcedMod)
    var comp = composeFor(srv, p, y, modName)
    var tier = tierFor(srv, p)
    var ids = comp.ids
    st.waves++

    // ⭐⭐ ESCALATION IS LIFETIME NOW, AND IT HAD TO BE. The ramp was written when
    // waves came every 5-10 minutes and one descent saw four of them. At 1-2 hour
    // spacing almost nobody sees two in a session, so a per-run counter would have
    // pinned EVERY tide at wave 1 - 24 mobs, permanently, escalation quietly dead.
    //
    // 🔑 Keyed to tides SURVIVED instead, so your fifth ever is worse than your first.
    // That is what the ramp was always for; it was measuring the wrong span.
    var lifetime = 0
    try { lifetime = p.persistentData.getInt(K_LIFETIME) || 0 } catch (e) { }
    try { p.persistentData.putInt(K_LIFETIME, lifetime + 1) } catch (e) { }

    // ⚠️ TWO INDEPENDENT RAMPS, AND THEY MULTIPLY. `lifetime` is how many tides you
    // have SURVIVED; `tier.mult` is how much your god has decided you are worth. They
    // measure different things and both should count.
    //
    // 🚨 The tier multiplier is never below 1, so trust cannot make a night easier than
    // the baseline - only worse.
    var per = Math.min(MAX_PER_BATCH,
      Math.max(1, Math.round((BASE_PER_BATCH + GROWTH * lifetime) * tier.mult)))

    console.info(TAG + p.username + ' wave: ' + (MODS[modName] || {}).label +
      ' (trust tier ' + tier.at + ', x' + tier.mult + ') - ' + per + ' per pulse' +
      (comp.boss ? ', BOSS ' + comp.boss : '') +
      (modName === 'specialist' && !comp.rangedAvailable
        ? ' [no ranged available at this depth - fell back to melee]' : ''))

    // 🔑 STAMP THE WINDOW BEFORE ANY PULSE FIRES. This is what the leave-check
    // reads, so it has to be true from the instant the herald sounds - otherwise
    // there is a gap between the scream and the lock, and the gap is exactly when a
    // player would run.
    st.waveEnds = st.age + SPAWN_WINDOW
    st.toldEscape = false

    herald(p, y)
    console.info(TAG + p.username + ' - wave ' + st.waves + ' at y' + Math.round(y) +
      ', ' + per + ' per pulse x ' + SPAWN_BATCHES + ' over ' +
      Math.round(SPAWN_WINDOW / 20) + 's (up to ' + (per * SPAWN_BATCHES) + ' total)')

    // ⚠️ ASSIGNED, NOT DECLARED. `srv` is already declared at the top of this
    // function for the D3 tier lookup, and a second `var srv` in the same scope is
    // legal JavaScript but a HARD ERROR under Rhino - "redeclaration of var srv" -
    // which takes the WHOLE FILE down. `node --check` passes it; the server does not.
    try { srv = p.server } catch (e) { return }
    if (!srv) return

    // ═══════════════════════════════════════════════════════════════════════
    // 🔴 THE LOOT REFRESH LIVED HERE FOR ONE DAY AND WAS THE WRONG MECHANISM.
    // Removed 2026-08-24 after probing the running server.
    //
    // The ask was Ethan's, 2026-08-23: "if possible after a tide reset the lootr
    // containers." I built it as a command fired at the end of each spawn window -
    // `lootr clear <player>` - and shipped it fail-loud because the server was off
    // and the syntax could not be verified.
    //
    // 🚨 `/lootr clear` DOES NOT EXIST. The real subcommands are: refresh, decay,
    // openers, cclear, cull, custom-*, force_*. There is also NO per-player clear at
    // all, so the shape I designed was not available in any spelling.
    //
    // ⭐ AND LOOTR ALREADY DOES THIS PROPERLY, IN CONFIG, WITHOUT KUBEJS:
    //     [refresh] refresh_value / refresh_loot_tables / refresh_modids
    //               perform_refresh_while_ticking / start_refresh_while_ticking
    // Scoping by LOOT TABLE is exact for us, because the depths inject into deep
    // structure tables (betterdungeons, galosphere, ancient_city) while surface
    // structures use different ones - so the depths can refresh on a timer and the
    // surface stays one-shot, with no code and no per-wave hook.
    //
    // 🔑 THE LESSON, WHICH IS THE REASON THIS COMMENT IS LONG: fail-loud saved the
    // player from a silent no-op, but it could not save the DESIGN. Only probing the
    // real server could, and that took one `/help lootr`. A guarded call to a command
    // nobody has run is still a guess wearing a seatbelt.

    // ⭐ THIRTY SECONDS OF ARRIVALS. Batched rather than dumped, so they come in a
    // stream you can hear approaching - and so a single unlucky pulse cannot bury
    // somebody who was already fighting.
    var step = Math.floor(SPAWN_WINDOW / SPAWN_BATCHES)
    for (var b = 0; b < SPAWN_BATCHES; b++) {
      (function (delay, first) {
        srv.scheduleInTicks(delay, function () {
          try {
            // Re-check EVERY pulse. Somebody who surfaced, died or logged out mid
            // wave must stop receiving it - otherwise the tide follows them into
            // daylight, which is the one thing Ethan ruled out.
            if (!p.isAlive || !p.isAlive()) return
            var st2 = runs[String(p.uuid)]
            if (!st2 || !st2.active) return
            if (enclosed(p) === false) return
            if (first) {
              srv.runCommandSilent('execute as ' + p.username + ' at @s run playsound ' +
                SOUND_WAVE + ' hostile @s ~ ~ ~ 0.8 0.5')
            }
            // 🚨 CENSUS BEFORE SPAWN. Counted from the world, not from a tally we
            // keep - see MAX_ALIVE_NEAR. A pulse that would push past the ceiling is
            // SKIPPED and says so; it is never silently reduced, because "the tide
            // felt thin" and "the tide was capped" must not look the same in a log.
            var alive = -1
            try {
              alive = p.level.getEntitiesWithin(p.boundingBox.inflate(CENSUS_RANGE))
                .filter(function (e) { try { return e.tags.contains(TIDE_TAG) } catch (x) { return false } })
                .length
            } catch (e) { alive = -1 }
            if (alive >= 0 && alive >= MAX_ALIVE_NEAR) {
              console.info(TAG + p.username + ' pulse SKIPPED - ' + alive +
                ' tide undead already within ' + CENSUS_RANGE + ' blocks (ceiling ' +
                MAX_ALIVE_NEAR + '). Not thinned, held.')
            } else if (VELDORA.spawner) {
              // Tagged so the census above can find them, and so anything later can
              // tell a tide corpse from an ordinary one.
              // 🔴 CLOSE, BEHIND, AND PROVABLY REACHABLE. Ethan from play, 2026-08-24:
              // "liam is still not saying that he's seeing any of them. they either
              // need to pathfind directly to the player or spawn directly behind them
              // close enough."
              //
              // The wave had been placing into whatever air it could find at 8-16
              // blocks, which underground is usually a SEALED POCKET IN ANOTHER CAVE -
              // spawned fine, walled in, never seen. `reachable` samples the straight
              // line and rejects anything it cannot reach; `behind` puts them at his
              // back so the wave is something he turns around into rather than
              // something he walks toward.
              //
              // ⚠️ TIGHT RING ON PURPOSE. 5-11 blocks is close enough to be in the
              // same corridor and far enough not to materialise on top of him.
              VELDORA.spawner.wave(p, {
                ids: ids, count: per, minDist: 5, maxDist: 11,
                behind: true, reachable: true,
                nbt: '{Tags:["' + TIDE_TAG + '"]}',
              })

              // ⭐ THE BOSS ARRIVES ONCE, WITH THE FIRST PULSE, and slightly further
              // out so it walks in behind its own horde rather than materialising in
              // the middle of it.
              //
              // ⚠️ Tagged like everything else so the census counts it and the
              // leave-check can clean it up - an untagged boss would outlive the tide.
              if (first && comp.boss) {
                VELDORA.spawner.wave(p, {
                  ids: [comp.boss], count: 1, minDist: 9, maxDist: 14,
                  behind: true, reachable: true,
                  nbt: '{Tags:["' + TIDE_TAG + '"]}',
                })
              }
            }
          } catch (e) { console.warn(TAG + 'pulse threw :: ' + e) }
        })
      })(b * step, b === 0)
    }
  }

  // ── the sweep ──────────────────────────────────────────────────────────────
  function sweep(server) {
    try {
      var ps = server.players
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]
        var uuid = null
        try { uuid = String(p.uuid) } catch (e) { continue }
        var st = runs[uuid]
        if (!st) { st = runs[uuid] = { active: false, in: 0, out: 0, waves: 0, next: 0, age: 0 } }

        var enc = enclosed(p)
        if (enc === null) continue          // cannot read sky: do nothing, ever

        // ⭐ THE CLOCK RUNS WHEREVER THEY ARE. Above ground, below it, mid-fight - the
        // countdown does not care. Only the LANDING cares about enclosure.
        var due = 0
        var seeded = false
        try {
          due = p.persistentData.getInt(K_DUE) || 0
          seeded = !!p.persistentData.getBoolean(K_SEEDED)
        } catch (e) { }
        if (!seeded) {
          // First sight: give them the short opening window rather than firing at
          // once. A tide in the first minute of a first descent reads as a bug.
          due = FIRST_DUE_MIN + Math.floor(Math.random() * (FIRST_DUE_MAX - FIRST_DUE_MIN + 1))
          try {
            p.persistentData.putBoolean(K_SEEDED, true)
            p.persistentData.putInt(K_DUE, due)
          } catch (e) { }
          console.info(TAG + p.username + ' seeded - first tide in ~' +
            Math.round(due / 1200) + ' min of play')
        } else if (due > 0) {
          due -= SWEEP
          if (due < 0) due = 0
          try { p.persistentData.putInt(K_DUE, due) } catch (e) { }
        }

        if (!st.active) {
          st.out = 0
          st.in = enc ? st.in + SWEEP : 0
          if (st.in >= ENTER_TICKS) {
            st.active = true
            st.age = 0
            st.waves = 0
            // GRACE is the in-run FLOOR only. What actually schedules a tide is the
            // persistent countdown above.
            st.next = GRACE
            console.info(TAG + p.username + ' has gone under' + (due <= 0
              ? ' - AND A TIDE IS DUE' : ' - next tide in ~' + Math.round(due / 1200) + ' min'))
          }
          continue
        }

        // active
        st.in = 0
        st.age += SWEEP

        // ⭐⭐ ESCAPING TO THE SURFACE ENDS IT. Ethan, 2026-08-24 — and this REVERSES
        // his own ruling of 2026-08-23, deliberately.
        //
        // Yesterday a run could not end while a wave was still arriving, so that the
        // scariest sound in the game was not an instruction to leave. He then asked
        // whether a player could be BLOCKED from surfacing; I pushed back that a hard
        // block reads as the game breaking rather than as tension, and he took the
        // pushback: "ok then we stop the tide once the player escapes to the overworld."
        //
        // 🔑 SO THE SURFACE IS THE ESCAPE, AND IT IS SUPPOSED TO BE. The depths are a
        // roguelike run - "go down, fight enemies, get loot, escape" - and a run you
        // cannot leave is not a run, it is a trap. Climbing out under fire is now a
        // real decision with a real cost: the tide is 1-2 hours away, so leaving early
        // spends the whole event.
        //
        // ⚠️ NOTHING ELSE HAD TO CHANGE. The pulse guards already handle it: each one
        // checks `st2.active` and refuses to spawn when `enclosed(p) === false`, so
        // ending the run stops the arrivals on its own and no wave can ever land under
        // open sky. Whatever already followed you up stays - escaping means no MORE
        // come, not that the ones chasing you evaporate.
        if (!enc) {
          st.out += SWEEP
          if (st.out >= LEAVE_TICKS) {
            console.info(TAG + p.username + ' surfaced - tide ends after ' +
              st.waves + ' wave(s), ' + Math.round(st.age / 1200) + ' min')
            runs[uuid] = { active: false, in: 0, out: 0, waves: 0, next: 0, age: 0, waveEnds: 0, toldEscape: false }
          }
          continue
        }
        st.out = 0

        // ⭐ TWO GATES, AND THEY MEAN DIFFERENT THINGS. `st.next` is the in-run floor
        // (GRACE) so a wave never lands the instant you step through a doorway.
        // `due` is the persistent countdown and it is what actually SCHEDULES a tide.
        // A tide that came due while you were on the surface has been WAITING, and it
        // lands as soon as both are satisfied.
        if (st.next > 0) st.next -= SWEEP
        if (st.next <= 0 && due <= 0) {
          sendWave(p, st)
          var nxt = TIDE_MIN + Math.floor(Math.random() * (TIDE_MAX - TIDE_MIN + 1))
          var pull = artPull(p)
          if (pull < 1) nxt = Math.max(SWEEP, Math.round(nxt * pull))
          try { p.persistentData.putInt(K_DUE, nxt) } catch (e) { }
          console.info(TAG + p.username + ' - next tide in ~' +
            Math.round(nxt / 1200) + ' min of play' +
            (pull < 1 ? ' (drawn in by the Matriarch)' : ''))
        }
      }
    } catch (e) { console.warn(TAG + 'sweep threw :: ' + e) }
    server.scheduleInTicks(SWEEP, function () { sweep(server) })
  }

  // 🚨 DEATH ENDS THE RUN. Without this the escalation survives your corpse and the
  // next descent starts at wave six - which reads as the game being broken rather
  // than as a roguelike.
  EntityEvents.death(function (event) {
    try {
      var p = event.entity
      if (!p || !p.player) return
      var uuid = String(p.uuid)
      var st = runs[uuid]
      if (st && st.active) {
        console.info(TAG + p.username + ' died - tide ends after ' + st.waves + ' wave(s)')
      }
      runs[uuid] = { active: false, in: 0, out: 0, waves: 0, next: 0, age: 0 }
    } catch (e) { }
  })

  PlayerEvents.loggedOut(function (event) {
    try { delete runs[String(event.player.uuid)] } catch (e) { }
  })

  VELDORA.tide = {
    inRun: function (p) {
      try { var st = runs[String(p.uuid)]; return !!(st && st.active) } catch (e) { return false }
    },
    state: function (p) {
      try { return runs[String(p.uuid)] || null } catch (e) { return null }
    },
    enclosed: enclosed,
    rosters: { shallow: SHALLOW, deep: DEEP, deeper: DEEPER, allowlist: UNTAGGED_UNDEAD },
    // ⭐ D3, exposed for tools/tide_harness.js. The tier ladder and the composition are
    // pure functions of trust and depth, which makes them exactly the part worth
    // testing without a server - and the part nobody can verify in play, because
    // checking a 40% ranged mix by eye across a 30-second wave is not possible.
    tiers: TIERS,
    mods: MODS,
    bosses: BOSSES,
    ranged: RANGED,
    taker: TAKER,
    _tierFor: tierFor,
    _composeFor: composeFor,
    _trustOf: trustOf,
    force: function (p) {
      var st = runs[String(p.uuid)]
      if (!st || !st.active) return false
      sendWave(p, st); st.next = nextGap(p); return true
    },
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    event.register(Commands.literal('tide').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var st = VELDORA.tide.state(p)
      var enc = enclosed(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6THE TIDE'))
      p.tell(Text.of('§8enclosed: §f' + (enc === null ? '?' : enc) +
        '§8  y: §f' + Math.round(depthOf(p) || 0)))
      if (!st || !st.active) {
        p.tell(Text.of('§8not in a run §7(' + Math.round((st ? st.in : 0) / 20) +
          's of ' + Math.round(ENTER_TICKS / 20) + 's enclosed)'))
      } else {
        p.tell(Text.of('§cIN A RUN §8- §f' + st.waves + '§8 wave(s), §f' +
          Math.round(st.age / 1200) + '§8 min, next in §f' +
          Math.max(0, Math.round(st.next / 20)) + '§8s'))
      }
      return 1
    }))
    // ⭐ THE BENCH. Ethan asked for a way to test the horde itself, and the tide's
    // natural cadence is 1-2 hours of played time - which is not a test loop.
    //
    // 🚨 `/tide_wave <mod>` DOES NOT REQUIRE A RUN. Every other tide entry point checks
    // enclosure and run state first; a bench that only works underground at night after
    // an hour of waiting is not a bench. It builds a throwaway run state so the pulse
    // machinery is the REAL one - this tests the shipping path, not a parallel copy.
    event.register(Commands.literal('tide_wave').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).then(Commands.argument('mod', event.arguments.STRING.create(event))
      .executes(function (ctx) {
        var p = ctx.source.player
        if (!p) return 0
        var mod = ''
        try { mod = String(ctx.getArgument('mod', Java.loadClass('java.lang.String'))) } catch (e) { }
        if (!MODS[mod]) {
          p.tell(Text.of('§cunknown wave type. one of: ' + Object.keys(MODS).join(', ')))
          return 0
        }
        var st = runs[String(p.uuid)]
        if (!st) { st = { active: true, waves: 0, next: 0, in: 0 }; runs[String(p.uuid)] = st }
        p.tell(Text.of('§7forcing §f' + (MODS[mod].label) + '§7...'))
        sendWave(p, st, mod)
        return 1
      })))

    // What the tide would send you right now, and why. Read-only.
    event.register(Commands.literal('tide_tier').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var srv = ctx.source.server
      var tier = tierFor(srv, p)
      var y = depthOf(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6TIDE TIER'))
      p.tell(Text.of('§8trust §f' + trustOf(srv, p) + '§8 -> tier §f' + tier.at +
        '§8, size §fx' + tier.mult))
      p.tell(Text.of('§8can send: §f' + tier.mods.join(', ')))
      if (y !== null) {
        var c = composeFor(srv, p, y, 'specialist')
        p.tell(Text.of('§8at y' + Math.round(y) + ' the ranged pool has §f' +
          c.rangedAvailable + '§8 entr' + (c.rangedAvailable === 1 ? 'y' : 'ies')))
      }
      return 1
    }))

    event.register(Commands.literal('tide_now').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      if (!VELDORA.tide.force(p)) p.tell(Text.of('§cnot in a run - go underground first'))
      return 1
    }))
  })

  ServerEvents.loaded(function (event) {
    if (!GATE) { console.info(TAG + 'THE TIDE GATED OFF'); return }
    sweep(event.server)
    event.server.scheduleInTicks(1, function () {
      var haveSpawner = !!(VELDORA.spawner && VELDORA.spawner.wave)
      if (!haveSpawner) {
        console.error(TAG + 'spawner missing - the tide can announce but never arrive')
      }
      // 🔴 THIS BANNER LIED FOR ONE BOOT, AND IT WAS MINE. It still said "ends 10s
      // after surfacing" after 2026-08-23 made surfacing MID-WAVE not end a run at all
      // - the exact defect this repo has caught five times in other files, caught here
      // by reading my own boot report.
      console.info(TAG + 'THE TIDE live - enclosed only, NEVER under open sky. A run ' +
        'begins after ' + Math.round(ENTER_TICKS / 20) + 's under, and ends ' +
        Math.round(LEAVE_TICKS / 20) + 's after surfacing OR on death. THE SURFACE IS ' +
        'THE ESCAPE (ruled 2026-08-24, reversing 08-23) - climbing out mid-wave ends ' +
        'the run, and at a 1-2 hour cadence that spends the whole event.')
      console.info(TAG + 'tides come every ' + Math.round(TIDE_MIN / 1200) + '-' +
        Math.round(TIDE_MAX / 1200) + ' MINUTES OF PLAY on a persistent per-player ' +
        'clock - it runs wherever you are and WAITS if you are on the surface when it ' +
        'comes due. First ever is sooner (' + Math.round(FIRST_DUE_MIN / 1200) + '-' +
        Math.round(FIRST_DUE_MAX / 1200) + ' min). Escalation is by tides SURVIVED, ' +
        'not per run. In-run floor is ' +
        Math.round(GRACE / 1200) + ' min in. Each is ' +
        Math.round(SPAWN_WINDOW / 20) + 's of ARRIVALS at range in ' + SPAWN_BATCHES +
        ' pulses - they walk in, they are never dropped on you.')
      console.info(TAG + 'herald: your god above y0, the Speaker below it, and a ' +
        'sound ALWAYS - so a wave is never unannounced even with no lines written.')
    })
  })
})();
