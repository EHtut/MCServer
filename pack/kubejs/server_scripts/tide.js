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
  // 🔴 RENAMED 2026-08-30 to Ethan's four. `specialist` is gone; `ranged` replaces
  // it, and `horde` now means fodder + TANKS rather than bulk only. The trust ladder
  // still decides WHICH types are available and how big; difficulty.js decides the
  // composition inside them and which gods may reach in.
  var TIERS = [
    { at: 0, mods: ['horde'],                                   mult: 1.00 },
    { at: 2, mods: ['horde', 'general'],                        mult: 1.15 },
    { at: 3, mods: ['horde', 'general', 'ranged'],              mult: 1.30 },
    { at: 4, mods: ['horde', 'general', 'ranged', 'miniboss'],  mult: 1.50 },
    { at: 5, mods: ['horde', 'general', 'ranged', 'miniboss'],  mult: 1.75 },
  ]

  // ⛔ `GOD_WAVE_CHANCE = 0.15` LIVED HERE FOR ONE CHUNK AND WAS WRONG.
  // A flat rate silently replaced the pathed/pathless split further down this file
  // (VARY_PATHED 0.08 vs VARY_PATHLESS 0.25). See `godChanceFor` - that is the rate
  // `composeFor` passes to waves.js. Two numbers for one thing is how one of them ends
  // up being the one nobody maintains.

  // ⚠️ Mirrored from waves.js rather than duplicated as a literal - it is read at
  // load, and falls back to 1 (his ruling) if that file is missing.
  var BOSS_PER_RUN = 1
  var WAVES_WARNED = false

  // ⚠️ "higher (NOT high)" is Ethan's phrasing for the specialist wave and it is doing
  // real work: ranged enemies stack in a way melee does not, because they all reach you
  // at once from cover. 0.40 is "you are being shot at"; 0.75 would be unplayable.
  // ⚠️ WHAT IS LEFT OF THE OLD TABLE. Composition moved to waves.js; these entries
  // survive ONLY as labels and as the `boss` flag the announcement bar reads. Keeping a
  // ranged number here would be two sources of truth for the same thing, and the one
  // nobody updated would win.
  var MODS = {
    horde:    { boss: false, label: 'a horde' },
    general:  { boss: false, label: 'a general wave' },
    ranged:   { boss: false, label: 'a ranged wave' },
    miniboss: { boss: true,  label: 'a miniboss and a horde' },
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
  // 🔴 REBUILT 2026-08-29 FROM ETHAN'S OWN CLASSIFICATION, and one entry was
  // actively harmful.
  //
  // 🚨 `decrepit_skeleton` WAS LISTED RANGED AND IT IS THE BULK. With the new roster
  // that inverts every wave: `general` and `specialist` weight the ranged list, so the
  // mob meant to BE the horde would have become the archers, and the archers the
  // filler. It survived before only because the old depth pools held several melee
  // mobs alongside it. Caught by reading his roles against this map rather than by
  // playing a wave.
  //
  // His roles, verbatim: Decrepit Skeleton = "The bulk" · Skeleton = "Specialist/Ranged"
  // · Bonescaller = "Specialist/Ranged" · Thrasher = "Specialist/Tank" · Demoman =
  // "Specialist/Rare and incredibly dangerous".
  //
  // ⚠️ THE DEMOMAN IS THE ONE I AM NOT CERTAIN OF. He classified it by DANGER, not by
  // attack type. It stays ranged because it was already, and because a demolitionist
  // that throws things is ranged in every reading - but it is the one line here that is
  // an inference rather than his ruling.
  //
  // ⚠️ stray, bogged and skeleton_lackey are GONE: they were carrying the deep back
  // when the roster was depth-keyed, and no tide can draw them any more. A ranged map
  // naming mobs no roster contains is a map nobody can trust.
  var RANGED = {
    'minecraft:skeleton': true,
    'born_in_chaos_v1:bonescaller': true,
    'born_in_chaos_v1:skeleton_demoman': true,
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
  // 🔴 REVERSED 2026-08-29, AND THE OLD RULING IS KEPT HERE BECAUSE IT WAS REAL.
  //
  // This block used to read: *"`fallen_chaos_knight` IS DELIBERATELY ABSENT. It is
  // Blade's stalker avatar, 'The Challenger', and Ethan ruled it stays his."*
  //
  // ⭐ He then listed it himself, as one of the tide's two minibosses. The newer
  // ruling wins - but it is a LORE CHANGE, not a roster tweak: the goddess of death now
  // sends a fallen version of the Warrior at his own champions. Nothing in the game
  // points at that, and nothing should.
  //
  // ⚠️ `missionary_raider` and `missioner` are gone with it. They were the two survivors
  // of a probe that corrected three of four wrong ids, and neither is a skeleton.
  //
  // The live BOSSES list is with the other role rosters below. ⚠️ A second `var BOSSES`
  // here would be a DUPLICATE DECLARATION IN ONE SCOPE - the exact Rhino error that took
  // this file down earlier today, which node --check does not catch.

  // ⭐ THE TAKER IS A TELL, NOT A SPAWN. Ethan: *"Art is just kayer and she is already
  // secretly aligned with the goddess of death."* The tide IS the goddess of death's
  // army, so The Taker marching in it is EVIDENCE of that alliance - which means it has
  // to be RARE. A clue that turns up every fourth tide is set dressing, not a clue.
  var TAKER = 'born_in_chaos_v1:lifestealer'
  var TAKER_CHANCE = 0.06
  var MAX_ALIVE_NEAR = 45         // per player, within CENSUS_RANGE
  var CENSUS_RANGE = 48

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ THE TIDE CLEANS UP AFTER ITSELF. Ethan, 2026-08-30:
  //
  //     "we will need to build a natural despawn system in case the player dies. We
  //      can do it so if all players die or if no mobs slain in 5(?) minutes the tide
  //      despawns. this is for server cleanliness and lag."
  //
  // 🔴 UNTIL NOW A RUN ENDED AND THE MOBS STAYED. Death, dawn and surfacing all reset
  // `runs[uuid]` and left twenty-odd undead standing in a cave forever. Nothing ever
  // removed them - the only ceiling was MAX_ALIVE_NEAR, which STOPS more from arriving
  // and never clears what is already there. Every tide anyone had ever run was still
  // loaded somewhere.
  //
  // 🔑 IDLE IS MEASURED BY KILLS, NOT BY TIME ALONE. "No mobs slain in 5 minutes" is
  // his rule and it is the right signal: a player who is fighting is killing, so the
  // clock only runs out when the fight has actually stopped. A pure timer would
  // despawn a wave someone was still working through.
  var DESPAWN_IDLE = 6000         // 5 min of no tide kill -> the wave gives up
  var DESPAWN_RANGE = 128         // how far out to sweep, well past CENSUS_RANGE
  var ORPHAN_EVERY = 1200         // 1 min between orphan scans - getEntitiesWithin
  //                                 is not free and idle players are the common case

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
  // ════════════════════════════════════════════════════════════════════════
  // ⭐⭐ THE TIDE IS HERS, AND SHE IS SKELETONS. Ethan, 2026-08-29:
  //
  //     "The Tides - Thesis, Alice is the goddess of death. She has a focus on
  //      skeletons, not zombies."
  //
  // 🔑 THE ROSTER IS KEYED BY ROLE NOW, NOT BY DEPTH. It used to be three pools -
  // SHALLOW above y0, DEEP to -40, DEEPER below - holding twenty mobs from six mods:
  // zombies, ghouls, templars, wights, husks, drowned. A tide that could be anything
  // says nothing about who sent it.
  //
  // ⚠️ AND DEPTH NO LONGER CHANGES COMPOSITION. That is a real loss and it is named
  // rather than hidden: a surface night tide and a y-100 tide are now the same
  // skeletons, differing by TIER and COUNT. Depth picked the roster and nothing else
  // (rosterFor was its only consumer), so this trades mob variety for authorship.
  //
  // ⭐ EVERY ID BELOW WAS PROBED AGAINST THE LIVE REGISTRY 2026-08-29, with a
  // known-fake control in both directions. ⚠️ The probe needed fixing first: a mob
  // that is CURRENTLY ALIVE makes `data get` succeed rather than say "No entity was
  // found", so the original check read `minecraft:skeleton` as fake.
  var BULK = [
    'born_in_chaos_v1:decrepit_skeleton',
  ]

  // ⚠️ `minecraft:skeleton` is the only one here whose attack type is CERTAIN. The
  // bonescaller and the demoman are Ethan's own classification - he named them ranged
  // and specialist - so they are trusted as a RULING rather than as a guess of mine.
  var ARCHERS = [
    'minecraft:skeleton',
    'born_in_chaos_v1:bonescaller',
  ]

  // The dangerous end. 🚨 The demoman is "rare and incredibly dangerous" in his words,
  // so it is ONE entry against the thrasher's tanking and the bonescaller's arrows -
  // rarity is carried by the pool being small, not by a second probability roll.
  var SPECIALISTS = [
    'born_in_chaos_v1:skeleton_thrasher',
    'born_in_chaos_v1:bonescaller',
    'born_in_chaos_v1:skeleton_demoman',
  ]

  // ⭐ FALLEN CHAOS KNIGHT IS BLADE'S OWN PATH ID. The goddess of death sending a
  // FALLEN version of the Warrior as her miniboss is not a coincidence anybody has to
  // be told about, and nothing in the game points at it.
  var BOSSES = [
    'born_in_chaos_v1:supreme_bonescaller',
    'born_in_chaos_v1:fallen_chaos_knight',
  ]

  // ════════════════════════════════════════════════════════════════════════
  // ⭐ THE VARIATION. Ethan: *"Varatied waves are rare, and random with a weighted
  // chance focused on godless champions."*
  //
  // A varied wave swaps the skeletons for ANOTHER GOD'S mobs. It is rare on purpose -
  // the tide has to read as hers first, or the variation means nothing when it lands.
  //
  // ⚠️ "focused on godless champions" is read as: A PATHLESS PLAYER SEES THEM MORE
  // OFTEN. If you have a god, the tide is the goddess of death's and it stays hers; if
  // you have nobody, everything is interested in you. Flagged rather than assumed.
  var VARY_PATHED = 0.08
  var VARY_PATHLESS = 0.25

  // 🚨 THESE ARE THE GODS' OWN MOBS - the same lists spawn_pressure.js gives them
  // for their own attacks. A varied tide is another god reaching into her water, so it
  // has to be recognisably THEIR roster or the whole effect is just a different skin.
  var GOD_ROSTERS = {
    blade: ['born_in_chaos_v1:barrel_zombie', 'born_in_chaos_v1:door_knight',
      'born_in_chaos_v1:zombie_bruiser', 'born_in_chaos_v1:skeleton_thrasher'],
    wall: ['born_in_chaos_v1:baby_spider', 'born_in_chaos_v1:mother_spider'],
    salvage: ['born_in_chaos_v1:dread_hound'],
    forge: ['born_in_chaos_v1:krampus_henchman'],
    // 🔴 ART IS DOWN TO ONE MOB AND IT IS NOT A BALANCE CHOICE. `restless_spirit` and
    // `dark_vortex` were measured 0/3 each against a control that passed 3/3: both
    // answer `summon` and are gone before the next command. They are removed from every
    // roster in the pack rather than left to spawn nothing. D-117.
    // ✅ RULED: Art's BOSS is the Lifestealer (see waves.js). It is NOT added here -
    // this list is what Art sends on his own behalf via spawn_pressure, and the
    // Lifestealer is a miniboss, not ambient pressure.
    art: ['born_in_chaos_v1:scarlet_persecutor'],
  }
  // ⛔ `GOD_KEYS` (all five) was deleted 2026-08-30 with `poolFor`. waves.js picks the
  // god now and only THREE send waves - Forge and Salvage send nothing at anyone, his
  // ruling. A five-name list sitting here would read as the roster and is not.
  // GOD_ROSTERS itself stays: spawn_pressure.js uses all five for their OWN events.


  // Named here so the harness can assert the exception is exactly this and has not
  // quietly grown. If a mob is added to the rosters above and is neither tagged
  // undead nor listed here, the test fails.
  // ⭐ EMPTIED 2026-08-30, AND THE REASON IS WORTH KEEPING. It held five Rotten
  // Creatures ids, and `tide_undead_check.py` reported all five as used by no roster -
  // the 08-29 rewrite dropped them and nobody swept the exemption behind it.
  //
  // ⚠️ THE PREMISE IS STILL TRUE, MEASURED TODAY: Rotten Creatures tags NOTHING into
  // `#minecraft:undead` despite being an undead mod, so anything from it needs a name
  // here. Re-add the specific id if a Rotten Creatures mob rejoins a roster. Do not
  // pre-emptively list the whole mod - an allowlist that covers mobs nobody uses is a
  // permanently amber check, and an amber check is one people stop reading.
  var UNTAGGED_UNDEAD = []

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

  // 🔴 REWIRED 2026-08-30 onto waves.js + difficulty.js.
  //
  // ⚠️ THE NAMES CHANGED AND THAT IS NOT COSMETIC. The old set was
  // horde/general/specialist/miniboss; Ethan's is general/horde/RANGED/miniboss.
  // `specialist` is GONE, and `horde` flipped meaning from "bulk only" to "fodder +
  // tanks". A rename plus a re-composition, so the old MODS table is retired rather
  // than renamed - a half-migrated table would compose waves nobody designed.
  function diffIndex(p) {
    try {
      if (VELDORA.difficulty && typeof VELDORA.difficulty.index === 'function') {
        return VELDORA.difficulty.index(p)
      }
    } catch (e) { }
    return 0            // ⚠️ gentlest on failure, same as difficulty.js itself
  }

  function pickMod(server, p, forced) {
    if (forced) return forced
    var tier = tierFor(server, p)
    return tier.mods[Math.floor(Math.random() * tier.mods.length)]
  }

  // Compose the id list for one pulse. Returns { ids, boss } where `boss` is a single
  // extra id to place once, or null.
  //
  // ⚠️ FALLS BACK TO MELEE IF THE RANGED POOL IS EMPTY AT THIS DEPTH. A specialist wave
  // that found no archers must still be a wave - spawning nothing would read exactly
  // like the tide being broken, which is the failure this project keeps paying for.
  function composeFor(server, p, y, modName, forceGod) {
    // ⭐ waves.js owns composition now. This function's job shrank to: ask for a wave,
    // weight the id list, and decide whether a boss is allowed.
    var spec = null
    try {
      if (VELDORA.waves && typeof VELDORA.waves.pick === 'function') {
        spec = VELDORA.waves.pick(modName, diffIndex(p), godChanceFor(p), forceGod)
      }
    } catch (e) { spec = null }

    // ⚠️ FAILS TO A HORDE OF HER BULK rather than to nothing. A tide that spawns
    // nothing reads exactly like the tide being broken, which is the failure this file
    // has paid for before.
    if (!spec) {
      if (!WAVES_WARNED) {
        WAVES_WARNED = true
        console.error(TAG + '!! waves.js is MISSING or refused - falling back to a plain ' +
          'bulk horde. This is a FAILURE, not a design choice.')
      }
      spec = { type: modName, variant: 'fallback', god: null, theme: 'fallback',
        fodder: BULK, spec: [], specFrac: 0, bow: false, boss: null }
    }

    if (spec.god) {
      console.info(TAG + p.username + ' - ' + spec.god.toUpperCase() + ' WAVE (' +
        modName + ') - they reached into her water')
    }

    // ⭐⭐ HIS RATIOS, KEPT AS TWO LISTS RATHER THAN ONE WEIGHTED ONE.
    // Ethan, 2026-08-30: general 90/10 · horde 95/5 · specialist 80/20 · miniboss 95/5.
    //
    // 🔴 THE OLD CODE WEIGHTED A SINGLE 20-SLOT `ids` LIST AND LET `spawner.wave` PICK
    // UNIFORMLY. Two things were wrong with that, and both mattered:
    //
    //   1. THE RATIO WAS ONLY STATISTICAL. A 6-mob wave drawing from a 90/10 list gets
    //      0, 1 or 2 specialists at random. At 5% it is mostly 0 and occasionally 2 -
    //      which is not "5%", it is a coin flip that averages out over a night nobody
    //      plays twice.
    //   2. ONE NBT FOR THE WHOLE WAVE. A ranged wave forces a bow, and with the lists
    //      merged that bow went into the FODDER too. At the old 65% that was nearly
    //      right by accident; at his 20% it would arm four fifths of a wave that is
    //      supposed to be a crowd with archers behind it.
    //
    // ⭐ So the split survives to placement, and sendWave spends it as exact counts.
    var fodder = (spec.fodder && spec.fodder.length) ? spec.fodder.slice() : BULK.slice()
    var specs = (spec.spec && spec.spec.length) ? spec.spec.slice() : []
    var frac = (typeof spec.specFrac === 'number' && spec.specFrac > 0) ? spec.specFrac : 0
    if (!specs.length) frac = 0          // no pool, no share - never borrow from fodder

    // 🔴 ONE MINIBOSS PER TIDE, NOT PER WAVE. Ethan, measured in play: *"the
    // minibosses themselves are usually incredibly hard to fight on their own."*
    //
    // ⚠️ A tide is MANY waves, so a per-wave boss meant a long run could stack
    // several. The cap lives on the RUN, and composeFor only proposes - sendWave is
    // what spends it, because a proposal that is never placed must not consume the cap.
    var boss = spec.boss || null
    // ⭐ A GOD WITH NO BOSS FALLS BACK TO HERS. ⚠️ NO GOD IS IN THAT STATE ANY MORE -
    // Art was ruled the Lifestealer on 2026-08-30 (D-117) - so this is a SAFETY NET,
    // not a live path. It stays because the alternative to an unexpected null here is a
    // miniboss wave with no miniboss, which reads as the tide being broken.
    if (!boss && modName === 'miniboss' && BOSSES.length) {
      boss = BOSSES[Math.floor(Math.random() * BOSSES.length)]
      if (spec.god) {
        console.info(TAG + p.username + ' - ' + spec.god + ' has no boss that spawns; ' +
          'HER miniboss leads this one (D-117)')
      }
    }
    if (boss && Math.random() < TAKER_CHANCE) boss = TAKER

    // `ids` stays for every existing consumer (the census, the harness, the bench) and
    // is the union - but placement uses fodder/specs/frac, not this.
    return { ids: [].concat(fodder, specs), fodder: fodder, specs: specs, specFrac: frac,
      boss: boss, mod: modName, rangedAvailable: specs.length,
      varied: spec.god, variant: spec.variant, theme: spec.theme,
      wantsRangedNbt: (spec.bow === true) }
  }

  // ⭐ HOW MANY OF `count` ARE SPECIALISTS. Exact in expectation, integral in fact.
  //
  // ⚠️ ROUNDING IS THE WHOLE PROBLEM AT HIS NUMBERS. A 6-mob horde wave at 5% wants
  // 0.3 specialists; `Math.round` makes that 0 EVERY TIME, so "5%" would render as
  // "never" and the tank specialists would simply never appear. The fractional part is
  // spent as a probability instead, so 0.3 is a 30% chance of one - which averages to
  // his number over a tide instead of silently flooring to zero.
  function specCount(count, frac) {
    if (!(frac > 0) || count <= 0) return 0
    var want = count * frac
    var n = Math.floor(want)
    if (Math.random() < (want - n)) n += 1
    if (n > count) n = count
    return n
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐ D4 - THE TIDE COMES UP AT NIGHT. Ethan, 2026-08-29:
  //
  //     "we bring the tide system up, only at night, but to the overworld... we keep
  //      the depths incredibly dangerous, but we also make nights as dangerous."
  //
  // 🔑 ONE SYSTEM, TWO MODES, AND THEY ARE MIRROR IMAGES. The deep run requires
  // ENCLOSURE and ends when you surface. The night run requires OPEN SKY and ends at
  // dawn. Same clock, same tiers, same wave modifiers, opposite geography.
  //
  // ⚠️ THE PERSISTENT CLOCK IS SHARED ON PURPOSE, so this does not double the amount of
  // tide in the game. A tide comes due every 1-2 hours of played time and then lands
  // wherever you happen to be catchable - underground at any hour, or outside after
  // dark. It is not "a tide underground AND a tide every night".
  var NIGHT_TIDE = true

  // Reads night.js. ⚠️ null means "could not tell", and a null must never start a
  // surface run - the deep tide has no such ambiguity, but out here a wrong answer
  // means a horde in daylight.
  function isNightNow(server) {
    try {
      if (!NIGHT_TIDE || !VELDORA.night || typeof VELDORA.night.isNight !== 'function') return false
      return VELDORA.night.isNight(server) === true
    } catch (e) { return false }
  }

  // ⚠️ DEPTH NO LONGER PICKS THE MOBS. It used to return one of three pools; the
  // tide is hers everywhere now, so composition comes from the MODIFIER instead and
  // depth survives only in tier and count. Kept as a function rather than inlined
  // because the signature is what the harness and the bench both call.
  function rosterFor(y) {
    return BULK
  }

  // ⛔ `poolFor` WAS DELETED HERE, 2026-08-30, and this note is the headstone.
  //
  // It mapped a modifier to a draw pool, and `waves.js` owns that entirely now. It is
  // recorded rather than quietly removed because it still carried a branch for
  // `specialist` - a modifier that no longer exists - and dead code naming a retired
  // concept is how a retired concept comes back. If something needs a pool it asks
  // `VELDORA.waves.pick()`. There is no second answer.

  // ⭐ THE VARIATION ROLL, NOW A RATE RATHER THAN A ROSTER.
  //
  // 🔴 REWRITTEN, NOT DELETED, AND THE DIFFERENCE MATTERS. `waves.js` chooses WHICH god
  // reaches in; what it cannot know is that a GODLESS player is reached for three times
  // as often (0.25 vs 0.08) - that rule is this file's and it lives nowhere else. The
  // first pass of this rewiring passed a flat GOD_WAVE_CHANCE and dropped it on the
  // floor: it still compiled, it still played, and the pathless half of the design was
  // gone with nothing red to show for it.
  //
  // ⚠️ Unreadable -> treat as PATHED, i.e. the rarer branch. A read failure must not
  // quietly make every tide somebody else's.
  // ⛔ GOD-VARIED WAVES ARE OFF. Ethan, 2026-08-30: *"god based waves should be gated
  // off for now"* - the idea he had for them is an ACT 2 idea, and shipping a weaker
  // version of it now would spend the surprise.
  //
  // 🔑 A NAMED FLAG, NOT A ZEROED NUMBER. VARY_PATHED and VARY_PATHLESS are tuned
  // values with a reason behind each (a godless player sees more variation); zeroing
  // them would destroy that tuning and read, in three weeks, as though the rates had
  // always been zero. This says WHY, and flipping it back is one word.
  //
  // ⚠️ It gates the RANDOM chance only. `forceGod` still works, because a forced god
  // wave is a deliberate test and a gate that also blocked testing would just get
  // commented out.
  var GOD_WAVES = false

  // 🔑 THE RATE AND THE GATE ARE SEPARATE FUNCTIONS, because they are separate facts.
  // The rate logic - pathed vs pathless, a Java String read correctly, a throw treated
  // as pathed - is hard-won and still true; the gate is a scheduling decision that will
  // be reversed. Folding them together would have meant deleting seven real tests to
  // turn a feature off for a while.
  function godRateFor(p) {
    var pathless = null
    try {
      if (VELDORA.paths && typeof VELDORA.paths.pathOf === 'function') {
        var path = VELDORA.paths.pathOf(p)
        // 🔴 WAS `typeof path === 'string'`, which is FALSE for a Java String in
        // Rhino - so this always fell through to null, i.e. the PATHED branch, and a
        // godless player never got the higher variation rate at all. Same regression as
        // the three deal files, found the same way: by Ethan running the command.
        pathless = (path === null || path === undefined) ? null : (String(path) === '')
      }
    } catch (e) { }
    return (pathless === true) ? VARY_PATHLESS : VARY_PATHED
  }

  function godChanceFor(p) {
    return GOD_WAVES ? godRateFor(p) : 0
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
  // ⭐ G1 - THE ANNOUNCEMENT. Fired here, where the wave's own composition is
  // known, so `boss` picks the register rather than a caller guessing.
  //
  // ⚠️ THIS DOES NOT REPLACE `warn_wave`. That is your PATRON reacting, in chat, in
  // their colour; this is the world, on the bar, from nobody. Different speakers
  // saying different things - collapsing them would lose the second.
  function announceWave(p, mod) {
    try {
      if (!VELDORA.announce || typeof VELDORA.announce.say !== 'function') return
      var srv = p.server
      if (!srv) return
      VELDORA.announce.say(srv, p, (mod && mod.boss) ? 'tide_boss' : 'tide')
    } catch (e) { }
  }

  function sendWave(p, st, forcedMod, forceGod) {
    var y = depthOf(p)
    if (y === null) return
    // ⭐ A forced modifier is the signal that this came from /tide_wave rather than the
    // clock. The bench skips the enclosure and run-state re-checks; nothing else does.
    var bench = !!forcedMod
    var srv = null
    try { srv = p.server } catch (e) { }

    // ⭐ D3 - which KIND of wave, and how big, both come from trust.
    var modName = pickMod(srv, p, forcedMod)
    var comp = composeFor(srv, p, y, modName, forceGod)
    var tier = tierFor(srv, p)
    // ⛔ `var ids = comp.ids` stood here and became dead the moment placement split into
    // a fodder call and a specialist call. Removed rather than left: a live-looking
    // local holding the UNION of two lists that are now placed separately is exactly
    // the thing someone reaches for next time and gets a silently wrong wave from.
    st.waves++

    // ⭐ G1 - ANNOUNCE IT, here, after the modifier is resolved and before the mobs
    // are placed. `MODS[modName].boss` is the same flag the composer used, so the
    // register cannot disagree with the wave the player is about to meet.
    announceWave(p, MODS[modName])

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
      (function (delay, first, pulseNo) {
        srv.scheduleInTicks(delay, function () {
          try {
            // Re-check EVERY pulse. Somebody who surfaced, died or logged out mid
            // wave must stop receiving it - otherwise the tide follows them into
            // daylight, which is the one thing Ethan ruled out.
            if (!p.isAlive || !p.isAlive()) return

            // 🔴 THE BENCH MUST OUTRANK THIS GUARD, AND DID NOT. Measured 2026-08-29:
            // six /tide_wave calls logged perfect waves - right tier, right modifier,
            // `missioner` picked as the boss - and placed NOTHING, because Ethan was
            // standing at y104 under open sky and every pulse returned here.
            //
            // 🔑 The wave was never the problem. sendWave ran, composed and announced;
            // the PULSE refused. "I forced a wave" and "the wave did nothing" looked
            // identical from outside, which is the failure mode this project keeps
            // paying for - and the log made it obvious the instant anyone read it.
            //
            // ⚠️ THE RULE ITSELF STAYS EXACTLY AS RULED. A real tide still ends the
            // moment you surface; only an operator-forced wave ignores it, because a
            // bench that only works underground at night is not a bench.
            if (!bench) {
              var st2 = runs[String(p.uuid)]
              if (!st2 || !st2.active) return
              // ⭐ D4 - EACH MODE RE-CHECKS ITS OWN CONDITION. A deep pulse stops if the
              // player surfaced; a night pulse stops at dawn. Using the deep test for
              // both would have made every surface wave return here without spawning -
              // which is exactly the bug the bench flag was added to fix, and it would
              // have been reintroduced silently.
              if (st2.mode === 'night') {
                if (!isNightNow(srv)) return
              } else if (enclosed(p) === false) return
            }
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
              // 🔴 A RANGED WAVE FORCES A BOW. Measured 2026-08-29: a summoned
              // minecraft:skeleton arrives holding one only ~30% of the time, because
              // config/epicknights/mobs_equipment.json5 offers it ~13 items and one bow
              // - and /summon does not run the vanilla equip step at all. A "65% ranged"
              // wave of bowless skeletons is a melee wave wearing the wrong label.
              //
              // ⚠️ TAGS FIRST. Putting them after HandItems silently DROPPED the tag,
              // which cost a round of debugging - and an untagged mob outlives the tide
              // because the leave-check cannot find it.
              var plainNbt = '{Tags:["' + TIDE_TAG + '"]}'
              var bowNbt = plainNbt
              if (comp.wantsRangedNbt && VELDORA.waves && VELDORA.waves.rangedNbt) {
                // ⚠️ NO REGEX. Three files in this repo have been mangled by escaping a
                // JS regex through a shell heredoc, and stripping two braces does not
                // need one. slice() cannot be mangled.
                var inner = String(VELDORA.waves.rangedNbt)
                if (inner.charAt(0) === '{') inner = inner.slice(1)
                if (inner.charAt(inner.length - 1) === '}') inner = inner.slice(0, -1)
                bowNbt = '{Tags:["' + TIDE_TAG + '"],' + inner + '}'
              }

              // ⭐⭐ TWO PLACEMENTS, NOT ONE, AND THAT IS HIS RATIO BEING EXACT.
              // Ethan, 2026-08-30: general 90/10 · horde 95/5 · specialist 80/20 ·
              // miniboss 95/5. Splitting the call is what makes those counts real
              // rather than the outcome of `per` uniform draws from a weighted list -
              // and it is the ONLY way the forced bow lands on the archers alone.
              var nSpec = specCount(per, comp.specFrac)
              var nFod = per - nSpec
              if (nFod > 0 && comp.fodder && comp.fodder.length) {
                VELDORA.spawner.wave(p, {
                  ids: comp.fodder, count: nFod, minDist: 5, maxDist: 11,
                  behind: true, reachable: true,
                  nbt: plainNbt,
                  // ⭐ Which pulse and which half. Placement is TWO calls now, so
                  // anything counting arrivals - the harness, a log reader - needs to
                  // tell "one pulse, two halves" from "two pulses".
                  pulse: pulseNo, role: 'fodder',
                })
              }
              if (nSpec > 0 && comp.specs && comp.specs.length) {
                VELDORA.spawner.wave(p, {
                  ids: comp.specs, count: nSpec, minDist: 5, maxDist: 11,
                  behind: true, reachable: true,
                  pulse: pulseNo, role: 'specialist',
                  // ⚠️ Only this half is armed. The fodder above keeps whatever it
                  // arrives with, which for her skeletons is nothing.
                  nbt: bowNbt,
                })
              }
              // 🚨 A PULSE THAT PLACED NOTHING IS A BUG, NOT A QUIET WAVE. If both
              // halves were empty the tide would look broken to the player and clean
              // in the log, which is the failure this file keeps paying for.
              if (nFod <= 0 && nSpec <= 0) {
                console.error(TAG + p.username + ' - PULSE PLACED NOTHING (per=' + per +
                  ', frac=' + comp.specFrac + ', fodder=' +
                  ((comp.fodder && comp.fodder.length) || 0) + ', specs=' +
                  ((comp.specs && comp.specs.length) || 0) + '). This is broken.')
              }

              // ⭐ THE BOSS ARRIVES ONCE, WITH THE FIRST PULSE, and slightly further
              // out so it walks in behind its own horde rather than materialising in
              // the middle of it.
              //
              // ⚠️ Tagged like everything else so the census counts it and the
              // leave-check can clean it up - an untagged boss would outlive the tide.
              // 🔴 ONE MINIBOSS PER TIDE, NOT PER WAVE. Ethan, measured in play
              // 2026-08-30: *"it should also be 1 miniboss per tide because the
              // minibosses themselves are usually incredibly hard to fight on their
              // own."*
              //
              // ⚠️ A tide is MANY waves, and this ran per wave - a long run stacked
              // one boss per miniboss wave it happened to roll. The cap lives on the
              // RUN and is spent HERE, at the moment of placement, not when the wave
              // was composed: a boss that was proposed and never placed must not
              // consume it.
              if (first && comp.boss) {
                var st3 = runs[String(p.uuid)]
                var cap = BOSS_PER_RUN
                var had = (st3 && typeof st3.bosses === 'number') ? st3.bosses : 0
                if (had >= cap) {
                  console.info(TAG + p.username + ' - a second miniboss was due and was ' +
                    'REFUSED. One per tide (had ' + had + '/' + cap + ').')
                } else {
                  if (st3) st3.bosses = had + 1
                  VELDORA.spawner.wave(p, {
                    ids: [comp.boss], count: 1, minDist: 9, maxDist: 14,
                    behind: true, reachable: true,
                    nbt: '{Tags:["' + TIDE_TAG + '"]}',
                  })
                }
              }
            }
          } catch (e) { console.warn(TAG + 'pulse threw :: ' + e) }
        })
      })(b * step, b === 0, b)
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
        if (!st) { st = runs[uuid] = { active: false, in: 0, out: 0, waves: 0, bosses: 0, next: 0, age: 0 } }

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

          // ⭐⭐ THE ORPHAN SWEEP - the half of his rule the active check cannot reach.
          //
          // 🔑 Dawn and surfacing END A RUN WITHOUT DESPAWNING, deliberately: no more
          // come, but the ones already chasing you do not evaporate. That leaves mobs
          // with NO active run to sweep them - which is exactly the "server cleanliness
          // and lag" case he asked about, and the COMMON one, since most tides end by
          // surfacing rather than by dying.
          //
          // ⚠️ SLOW CADENCE. `getEntitiesWithin` is not free and this would otherwise
          // run for every idle player forever, so it is checked every ORPHAN_EVERY
          // rather than every sweep. Being a minute late here costs nothing.
          st.orphan = (st.orphan || 0) + SWEEP
          if (st.orphan >= ORPHAN_EVERY) {
            st.orphan = 0
            var left = -1
            try {
              left = p.level.getEntitiesWithin(p.boundingBox.inflate(DESPAWN_RANGE))
                .filter(function (e) {
                  try { return e.tags.contains(TIDE_TAG) } catch (x) { return false }
                }).length
            } catch (e) { left = -1 }
            // ⚠️ -1 is "could not read", NOT "none there". Only a real count arms it,
            // and only a real zero clears it.
            if (left > 0) {
              st.orphanIdle = (st.orphanIdle || 0) + ORPHAN_EVERY
              if (st.orphanIdle >= DESPAWN_IDLE) {
                despawnTide(p, 'orphaned - the run ended and nobody came back')
                st.orphanIdle = 0
              }
            } else if (left === 0) {
              st.orphanIdle = 0
            }
          }

          // ⭐ D4 - THE NIGHT DOOR. Open sky, after dark, and a tide already due. No
          // ENTER_TICKS dwell: being outside at night IS the condition, and asking
          // somebody to stand still in it first would only teach them to go indoors.
          //
          // ⚠️ `enc === false` EXPLICITLY, not `!enc`. enclosed() returns null when the
          // sky is unreadable, and null is falsy - so `!enc` would start a surface run
          // in a cave whenever the check glitched.
          if (NIGHT_TIDE && enc === false && due <= 0 && isNightNow(server)) {
            st.active = true
            st.mode = 'night'
            st.age = 0
            st.waves = 0
            st.bosses = 0
            st.lastKill = 0
            st.next = GRACE
            console.info(TAG + p.username + ' is OUT AFTER DARK and a tide is due - ' +
              'the night tide begins')
            continue
          }

          if (st.in >= ENTER_TICKS) {
            st.active = true
            st.mode = 'deep'
            st.age = 0
            st.waves = 0
            st.bosses = 0
            st.lastKill = 0
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

        // ⭐⭐ THE IDLE RULE. Ethan: *"if no mobs slain in 5(?) minutes the tide
        // despawns. this is for server cleanliness and lag."*
        //
        // ⚠️ MEASURED FROM THE LAST KILL, NOT FROM THE START. `lastKill` is stamped by
        // the death handler every time a tide mob dies anywhere, so this only fires
        // when the FIGHTING has stopped - not when the wave has merely been going a
        // while. A player twenty minutes into a hard tide keeps resetting it.
        //
        // ⚠️ AND ONLY ONCE THE FIRST WAVE HAS LANDED. Before that there is nothing to
        // kill and nothing to despawn, and the check would end the run during GRACE.
        if (st.waves > 0 && (st.age - (st.lastKill || 0)) >= DESPAWN_IDLE) {
          endRun(p, uuid, 'nothing slain in ' + Math.round(DESPAWN_IDLE / 1200) +
            ' min - the wave gives up', true)
          continue
        }

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
        // ⭐ D4 - A NIGHT RUN ENDS AT DAWN, NOT BY MOVING. Going indoors or underground
        // does not stop it, which is the whole point: the deep tide has an escape
        // because the depths are a run you chose to enter, and the night is not.
        //
        // ⚠️ It is the mirror of the deep rule, not an exception to it. Each mode ends
        // when its own condition stops holding - enclosure for one, darkness for the
        // other.
        if (st.mode === 'night') {
          if (!isNightNow(server)) {
            // ⚠️ DAWN DOES NOT DESPAWN. Sunrise is the mercy, and a player walking home
            // in daylight with three skeletons behind them is the tide keeping its
            // word - they will burn or be killed. The idle rule below sweeps them if
            // the player simply leaves.
            endRun(p, uuid, 'dawn', false)
          }
        } else if (!enc) {
          st.out += SWEEP
          if (st.out >= LEAVE_TICKS) {
            // ⚠️ SURFACING DOES NOT DESPAWN EITHER, and that is this file's oldest
            // ruling: *"the surface is the escape"* means no MORE come, not that the
            // ones chasing you evaporate as you climb out. The idle rule collects them.
            endRun(p, uuid, 'surfaced', false)
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
    // ⭐⭐ A TIDE MOB DYING IS THE HEARTBEAT THE IDLE RULE LISTENS FOR.
    // His condition is *"no mobs slain in 5 minutes"*, not "five minutes elapsed" - so
    // the clock is reset by KILLS. A player still grinding through a wave produces them
    // constantly; a player who walked away produces none, and that is exactly the
    // difference the rule exists to tell apart. A pure timer would despawn a wave
    // somebody was still fighting.
    //
    // ⚠️ This fires on EVERY entity death on the server, so it does the cheapest thing
    // possible and leaves.
    try {
      var d = event.entity
      if (d && !d.player) {
        var tagged = false
        try { tagged = d.tags.contains(TIDE_TAG) } catch (x) { tagged = false }
        if (tagged) {
          // ⚠️ Credited to every LIVE run, not to "the killer". A tide mob that burns,
          // falls or is shot by another mob still proves that wave is being fought.
          // Attributing to a killer would miss all three and start despawning waves
          // mid-fight.
          for (var k in runs) {
            if (!runs.hasOwnProperty(k)) continue
            var rst = runs[k]
            if (rst && rst.active) rst.lastKill = rst.age || 0
          }
        }
      }
    } catch (e) { }

    try {
      var p = event.entity
      if (!p || !p.player) return
      var uuid = String(p.uuid)
      // 🔑 DEATH DESPAWNS IMMEDIATELY - his first case. Nobody is coming back for that
      // wave: the player is at spawn and the mobs are standing over a grave in a chunk
      // that stays loaded as long as anything else is near it.
      endRun(p, uuid, 'the player died', true)
    } catch (e) { }
  })

  PlayerEvents.loggedOut(function (event) {
    // 🔑 DESPAWN BEFORE THE PLAYER GOES. This is his "all players die" case in its
    // other form - somebody logs out mid-tide and the wave stands in an empty world.
    // ⚠️ It has to happen HERE, while `event.player` is still a usable handle; after
    // this returns there is no way to find where they were.
    try {
      var lp = event.player
      var lst = runs[String(lp.uuid)]
      if (lst && lst.active) despawnTide(lp, 'the player logged out mid-tide')
      else despawnTide(lp, 'logged out - clearing any tide left near them')
    } catch (e) { }
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
    rosters: { bulk: BULK, archers: ARCHERS, specialists: SPECIALISTS, bosses: BOSSES,
      gods: GOD_ROSTERS, allowlist: UNTAGGED_UNDEAD },
    _godChanceFor: godChanceFor,
    // ⭐ The UNGATED rate, so the tuning stays under test while the feature is off.
    _godRateFor: godRateFor,
    godWavesOn: function () { return GOD_WAVES },
    // ⚠️ TEST-ONLY. The composition tests sample a real composed wave, so they cannot
    // run at all while the gate is shut - and deleting them to turn a feature off for a
    // while would lose coverage of logic that is still correct. The harness flips this
    // around those blocks and flips it back. Production never calls it; the DEFAULT
    // being off is itself asserted.
    _setGodWaves: function (v) { GOD_WAVES = !!v },
    varyChance: { pathed: VARY_PATHED, pathless: VARY_PATHLESS },
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
    // ⭐ Exposed because his ratios are only real if the ROUNDING is right, and that
    // cannot be seen from one composed wave - it is a property of many pulses.
    _specCount: specCount,
    _trustOf: trustOf,
    force: function (p) {
      var st = runs[String(p.uuid)]
      if (!st || !st.active) return false
      sendWave(p, st); st.next = nextGap(p); return true
    },
  }

  // ── the despawn ────────────────────────────────────────────────────────────
  // Remove every tide mob near a player. Returns how many went, or -1 if the world
  // could not be read.
  //
  // ⚠️ `discard()` AND NOT `/kill`. A killed mob drops loot, grants XP and fires every
  // death handler in the pack - so a cleanup would hand out rewards nobody earned and
  // could feed the very counters (slain, notoriety) the tide reads back. A despawn is
  // the mob ceasing to be there, which is what this is.
  function despawnTide(p, why) {
    var gone = 0
    try {
      var near = p.level.getEntitiesWithin(p.boundingBox.inflate(DESPAWN_RANGE))
        .filter(function (e) {
          try { return e.tags.contains(TIDE_TAG) } catch (x) { return false }
        })
      for (var i = 0; i < near.length; i++) {
        try { near[i].discard(); gone++ } catch (e) { }
      }
    } catch (e) {
      // 🚨 "I could not read the world" and "there was nothing to remove" must not
      // share a return value - the caller logs them differently.
      console.warn(TAG + 'despawn could not read the world :: ' + e)
      return -1
    }
    if (gone > 0) {
      console.info(TAG + p.username + ' - despawned ' + gone + ' tide mob(s): ' + why)
    }
    return gone
  }

  // ⭐ EVERY PATH OUT OF A RUN GOES THROUGH HERE. Before this existed the run state was
  // reset in four different places and the mobs were left standing in all four.
  function endRun(p, uuid, why, despawn) {
    var st = runs[uuid]
    if (st && st.active) {
      console.info(TAG + p.username + ' - tide ends after ' + st.waves +
        ' wave(s), ' + Math.round((st.age || 0) / 1200) + ' min: ' + why)
    }
    if (despawn) despawnTide(p, why)
    runs[uuid] = { active: false, in: 0, out: 0, waves: 0, bosses: 0, next: 0,
      age: 0, waveEnds: 0, toldEscape: false, lastKill: 0 }
  }

  // ── bench helpers ──────────────────────────────────────────────────────────
  // ⚠️ Ethan, 2026-08-30: *"ensure you're building test commands so we can bug test as
  // we move."* These exist because two of this file's worst bugs were INVISIBLE from
  // play - a wave that composed correctly and placed nothing, and a ratio that was
  // three times what it claimed. Neither is findable by fighting the wave.

  // Ids without their namespace, for a chat line that has to fit.
  function shortIds(list) {
    var out = []
    for (var i = 0; i < list.length; i++) {
      var s = String(list[i])
      out.push(s.indexOf(':') >= 0 ? s.split(':')[1] : s)
    }
    return out.join(', ')
  }

  // Compose n waves of every type and report the measured fodder/specialist split.
  // ⚠️ SPAWNS NOTHING. It is safe to run mid-tide and mid-soak.
  function ratioReport(ctx, n) {
    var p = ctx.source.player
    if (!p) return 0
    var srv = ctx.source.server
    var y = depthOf(p)
    if (y === null) y = -20
    var W = VELDORA.waves
    if (!W) { p.tell(Text.of('§c!! waves.js is not loaded - nothing to measure.')); return 0 }

    p.tell(Text.of('§8§m                                        '))
    p.tell(Text.of('§6TIDE RATIOS §8· ' + n + ' composed waves, §onothing spawned§8'))

    var types = W.types
    for (var t = 0; t < types.length; t++) {
      var mod = types[t]
      var target = W.specFrac[mod]
      var spec = 0, total = 0, bossCount = 0, godCount = 0, variants = {}
      for (var i = 0; i < n; i++) {
        var c = composeFor(srv, p, y, mod)
        // The REAL pulse size, so the rounding under test is the shipping rounding.
        var per = MAX_PER_BATCH
        var s = specCount(per, c.specFrac)
        spec += s; total += per
        if (c.boss) bossCount++
        if (c.varied) godCount++
        variants[c.variant] = (variants[c.variant] || 0) + 1
      }
      var got = total ? (spec / total) : 0
      var drift = Math.abs(got - target)
      // ⭐ A colour that means something: green inside 2 points, red outside.
      var col = (drift < 0.02) ? '§a' : '§c'
      p.tell(Text.of('§f' + mod + '§8 target §f' + Math.round((1 - target) * 100) + '/' +
        Math.round(target * 100) + '§8 measured ' + col +
        Math.round((1 - got) * 100) + '/' + Math.round(got * 100) +
        '§8 · boss ' + Math.round(bossCount * 100 / n) + '% · god ' +
        Math.round(godCount * 100 / n) + '%'))
    }
    p.tell(Text.of('§8sampled at §f' + MAX_PER_BATCH + '§8 mobs per pulse - the rounding ' +
      'is what breaks first, so it is sampled at the real size'))
    return 1
  }

  // Force a god-augmented wave. ⚠️ Bypasses the difficulty gate - says so.
  function godWave(ctx, mod) {
    var p = ctx.source.player
    if (!p) return 0
    var god = ''
    try { god = String(ctx.getArgument('god', Java.loadClass('java.lang.String'))) } catch (e) { }
    var W = VELDORA.waves
    if (!W) { p.tell(Text.of('§c!! waves.js is not loaded.')); return 0 }
    if (!W.gods[god]) {
      var ks = []
      for (var k in W.gods) if (W.gods.hasOwnProperty(k)) ks.push(k)
      p.tell(Text.of('§cno god wave for "' + god + '". one of: ' + ks.sort().join(', ')))
      p.tell(Text.of('§8forge and salvage have none - his ruling, not a gap'))
      return 0
    }
    if (!MODS[mod]) {
      p.tell(Text.of('§cunknown wave type. one of: ' + Object.keys(MODS).join(', ')))
      return 0
    }
    var st = runs[String(p.uuid)]
    if (!st) { st = { active: true, waves: 0, bosses: 0, next: 0, in: 0 }; runs[String(p.uuid)] = st }
    // ⚠️ The boss cap is per RUN. A bench that spends it would make the next real tide
    // bossless, so it is refunded here rather than silently consumed.
    var hadBosses = st.bosses
    p.tell(Text.of('§7forcing a §d' + god + '§7 ' + MODS[mod].label +
      ' §8(BENCH - difficulty gate bypassed)'))
    sendWave(p, st, mod, god)
    st.bosses = hadBosses
    return 1
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
        if (!st) { st = { active: true, waves: 0, bosses: 0, next: 0, in: 0 }; runs[String(p.uuid)] = st }
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
      // 🔴 THIS ASKED FOR `'specialist'` - THE MODIFIER RETIRED ON 2026-08-30 - so
      // waves.js returned null, composeFor took its FALLBACK, and this bench reported
      // the fallback's pool as if it were the ranged wave's. A bench that lies is worse
      // than no bench: it is the instrument you check the game against.
      if (y !== null) {
        var c = composeFor(srv, p, y, 'ranged')
        p.tell(Text.of('§8a ranged wave here: §f' + c.fodder.length + '§8 fodder ids, §f' +
          c.specs.length + '§8 archer ids, §f' + Math.round(c.specFrac * 100) +
          '%§8 specialist'))
        p.tell(Text.of('§8difficulty §f' + diffIndex(p) + '§8 · another god reaches in §f' +
          Math.round(godChanceFor(p) * 100) + '%§8 of waves'))
      }
      return 1
    }))

    // ⭐⭐ /tide_ratio [n] - THE ONE THAT ANSWERS "ARE HIS NUMBERS ACTUALLY LANDING?"
    //
    // He tuned 90/10, 95/5, 80/20 and 95/5 by PLAYING, which means checking them by
    // playing would mean counting mobs in a wave that is actively killing him. This
    // composes n waves of every type WITHOUT SPAWNING ANYTHING and prints the measured
    // split against the target.
    //
    // ⚠️ It samples at the REAL pulse size, because ROUNDING is where this silently
    // breaks: a 5% wave of 6 floors to zero under Math.round, and that failure looks
    // exactly like "the wave has no specialists in it".
    event.register(Commands.literal('tide_ratio').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).executes(function (ctx) { return ratioReport(ctx, 2000) })
      .then(Commands.argument('n', event.arguments.INTEGER.create(event))
        .executes(function (ctx) {
          var n = 2000
          try { n = ctx.getArgument('n', Java.loadClass('java.lang.Integer')) } catch (e) { }
          if (n < 50) n = 50
          if (n > 20000) n = 20000
          return ratioReport(ctx, n)
        })))

    // ⭐ /tide_god <god> [type] - force a god-augmented wave.
    // A god wave is 8-25% of waves AND difficulty-gated on top, so Wall's spiders and
    // Art's Lifestealer were effectively untestable in play. ⚠️ This bypasses the
    // difficulty gate and SAYS SO, so a bench result is never read as a live one.
    event.register(Commands.literal('tide_god').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).then(Commands.argument('god', event.arguments.STRING.create(event))
      .executes(function (ctx) { return godWave(ctx, 'general') })
      .then(Commands.argument('mod', event.arguments.STRING.create(event))
        .executes(function (ctx) {
          var m = 'general'
          try { m = String(ctx.getArgument('mod', Java.loadClass('java.lang.String'))) } catch (e) { }
          return godWave(ctx, m)
        }))))

    // ⭐ /tide_clear - despawn the tide near you, now.
    // ⚠️ The idle rule takes 5 minutes by design, which is right in play and useless at
    // a bench. This calls the SAME `despawnTide` the real paths call, so testing it
    // tests the shipping code rather than a parallel copy of it.
    event.register(Commands.literal('tide_clear').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var n = despawnTide(p, 'cleared by command')
      if (n < 0) {
        p.tell(Text.of('§c!! could not read the world - nothing was cleared'))
        return 0
      }
      p.tell(Text.of('§7despawned §f' + n + '§7 tide mob(s) within ' +
        DESPAWN_RANGE + ' blocks'))
      var cst = runs[String(p.uuid)]
      if (cst && cst.active) {
        p.tell(Text.of('§8your run is still ACTIVE - more will come. /tide_now ends it.'))
      }
      return 1
    }))

    // ⭐ /tide_roster - what is ACTUALLY loaded, not what a doc claims is loaded.
    // Every roster in this project has been wrong at least once while reading perfectly
    // correctly in the file, so this prints the live arrays out of waves.js.
    event.register(Commands.literal('tide_roster').requires(function (s) {
      try { return s.hasPermission(2) } catch (e) { return false }
    }).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var W = VELDORA.waves
      if (!W) {
        p.tell(Text.of('§c!! waves.js IS NOT LOADED. Every wave is a fallback horde.'))
        return 0
      }
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§6TIDE ROSTERS §8(live, read out of waves.js)'))
      var pools = [['bone fodder', W.fodderPools.bone], ['ghost fodder', W.fodderPools.ghost],
        ['bone light', W.specPools.boneLight], ['ghost light', W.specPools.ghostLight],
        ['bone tank', W.specPools.boneTank], ['ghost tank', W.specPools.ghostTank],
        ['archers', W.specPools.ranged], ['her minibosses', BOSSES]]
      for (var i = 0; i < pools.length; i++) {
        p.tell(Text.of('§8' + pools[i][0] + ' §7(' + pools[i][1].length + ')§8: §f' +
          shortIds(pools[i][1])))
      }
      var gk = []
      for (var g in W.gods) if (W.gods.hasOwnProperty(g)) gk.push(g)
      gk.sort()
      for (var j = 0; j < gk.length; j++) {
        var gd = W.gods[gk[j]]
        p.tell(Text.of('§d' + gk[j] + ' §7(' + gd.tier + ')§8: §f' + shortIds(gd.fodder) +
          '§8 + §f' + (gd.spec.length ? shortIds(gd.spec) : 'no specialists') +
          '§8 · boss §f' + (gd.boss ? String(gd.boss).split(':')[1] : '§cNONE')))
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
      // 🔴 THIS BANNER SAID "enclosed only, NEVER under open sky" AND D4 MADE THAT A
      // LIE THE SAME HOUR IT SHIPPED. Seventh lying banner in this project and the
      // first one written by the change that falsified it - caught by reading the boot
      // log after the restart, which is how the other six were caught too.
      console.info(TAG + 'THE TIDE live in TWO MODES. DEEP: enclosed only, begins after ' +
        Math.round(ENTER_TICKS / 20) + 's under, ends ' + Math.round(LEAVE_TICKS / 20) +
        's after surfacing OR on death - THE SURFACE IS THE ESCAPE (ruled 2026-08-24, ' +
        'reversing 08-23). NIGHT: ' + (NIGHT_TIDE ? 'open sky after dark, begins the ' +
        'moment a due tide catches you outside, and ends AT DAWN - moving does not ' +
        'stop it' : 'DISABLED') + '.')
      console.info(TAG + 'tides come every ' + Math.round(TIDE_MIN / 1200) + '-' +
        Math.round(TIDE_MAX / 1200) + ' MINUTES OF PLAY on a persistent per-player ' +
        'clock - it runs wherever you are and WAITS if you are on the surface when it ' +
        'comes due. First ever is sooner (' + Math.round(FIRST_DUE_MIN / 1200) + '-' +
        Math.round(FIRST_DUE_MAX / 1200) + ' min). Escalation is by tides SURVIVED, ' +
        'not per run. In-run floor is ' +
        Math.round(GRACE / 1200) + ' min in. Each is ' +
        Math.round(SPAWN_WINDOW / 20) + 's of ARRIVALS at range in ' + SPAWN_BATCHES +
        ' pulses - they walk in, they are never dropped on you.')
      // ⭐ The roster, said out loud. This changed shape completely on 2026-08-29 -
      // from three depth pools of twenty mixed mobs to one authored skeleton roster -
      // and a change that large should be visible from the boot log, not from a diff.
      //
      // 🔴 AND THIS LINE WAS ITSELF A LIE FOR ONE CHUNK. It went on reciting bulk /
      // archers / specialists counts after waves.js took composition over, so the boot
      // log described a roster that no longer picked a single mob. Ten lying banners
      // have been caught in this repo by reading boot logs; this one was written by the
      // same person who caught the other nine. It now reports the LIVE source, and says
      // so out loud when that source is missing.
      if (VELDORA.waves && typeof VELDORA.waves.pick === 'function') {
        console.info(TAG + 'SHE IS SKELETONS. Composition comes from waves.js (' +
          VELDORA.waves.types.join('/') + '), NOT from this file. The rosters below ' +
          'survive only as the miniboss list and the ranged lookup.')
      } else {
        console.error(TAG + '!! waves.js DID NOT LOAD. Every wave will fall back to a ' +
          'plain bulk horde - no variants, no god waves, no ranged. This is broken, ' +
          'not quiet.')
      }
      console.info(TAG + 'minibosses ' + BOSSES.length + ', capped at ' + BOSS_PER_RUN +
        ' PER TIDE (not per wave) - measured in play, they are hard enough alone.')
      // 🔴 THE SECOND HALF OF THIS LINE WAS OUT OF DATE THE MOMENT waves.js LANDED.
      // It said "the miniboss stays hers either way". A god miniboss wave is now led
      // by THAT GOD's boss. Open with Ethan as D-108 - the log states what the code
      // does, and says the question is open, rather than reciting the old answer.
      console.info(TAG + 'variation: another god reaches in ' +
        Math.round(VARY_PATHED * 100) + '% of waves if you have a god, ' +
        Math.round(VARY_PATHLESS * 100) + '% if you have NONE - and only from ' +
        'difficulty Malice upward.')
      console.info(TAG + 'a GOD miniboss wave is led by that god\'s own boss; hers ' +
        'still comes from her list. That reverses an older note - see D-108.')
      console.info(TAG + 'herald: your god above y0, the Speaker below it, and a ' +
        'sound ALWAYS - so a wave is never unannounced even with no lines written.')
    })
  })
})();
