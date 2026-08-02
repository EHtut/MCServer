var huntCategoryWarned = false

// ---------------------------------------------------------------------------
// THE HUNT — killing draws attention.
//
// Every hostile mob a player kills raises their "heat". The higher it climbs,
// the more likely something comes looking for them. Death resets it to zero.
//
// Why this works with the rest of the design: the surface has no hostile spawns,
// so heat is earned almost entirely by descending. Going deep and fighting is
// what makes the thing on the surface start hunting you. The punishment for
// violence arrives where you felt safest.
//
// Entity ids below were READ FROM THE MOD JARS' language files, not guessed.
// ---------------------------------------------------------------------------

const HEAT = 'buried_heat'          // int, on player persistent data
const LAST_HUNT = 'buried_last_hunt' // gametime of the last hunt, anti-spam

// Tuning. All of it is meant to be moved after a week of play.
const HEAT_PER_KILL = 1
const HEAT_CAP = 60                 // past this, no further escalation
const CHANCE_AT_CAP = 0.30          // 30% per check once fully heated
const CHECK_INTERVAL = 600          // ticks between rolls (30s)
const HUNT_COOLDOWN = 6000          // ticks before the same player is hunted again (5min)
const SPAWN_MIN = 24                // blocks from the player
const SPAWN_MAX = 40

// Verified against each mod's assets/<ns>/lang/en_us.json.
const HUNTERS = [
  'the_knocker:knocker',
  'the_skinwalker_hunt:skinwalker',
  'distantfriends:friend',
  'whispering_spirits:whispering_spirit',
]

function heatOf(player) {
  return player.persistentData.getInt(HEAT) || 0
}

function setHeat(player, value) {
  player.persistentData.putInt(HEAT, Math.max(0, Math.min(HEAT_CAP, value)))
}

// A player killed something. Only MONSTER-category kills count - farming cows
// should not summon a skinwalker.
EntityEvents.death(event => {
  const victim = event.entity
  if (!victim || !victim.living) return

  // Player died: the slate is wiped. Dying is the reset, which makes heat a
  // resource you carry and can lose, not a counter that only grows.
  if (victim.player) {
    setHeat(victim, 0)
    victim.persistentData.putLong(LAST_HUNT, 0)
    return
  }

  const killer = event.source ? event.source.player : null
  if (!killer) return

  let isMonster = false
  try {
    // Category is the reliable signal across ~390 mods; an id list would rot.
    //
    // THIRD attempt at this line, and the first one against a verified binding.
    //   v1: victim.getMobCategory()          - exists on nothing.
    //   v2: victim.getCategory() with a fallback to
    //       victim.getType().getCategory()   - threw on EVERY kill in live play:
    //         "Cannot find function getCategory in object spawn:ant"
    //
    // v2 failed because Rhino does not hand back a bare Java method reference,
    // so `victim.getCategory ? ...` read FALSY even where the method exists, and
    // every kill fell through to the EntityType branch - where getCategory is
    // genuinely not bound. The guard chose the broken path by construction.
    //
    // isMonster() is KubeJS's own purpose-built accessor and is mixed into EVERY
    // entity. Verified in kubejs-neoforge-2101.7.2-build.368 -> EntityKJS.class,
    // whose constant pool carries isMonster / monster / getCategory / MobCategory
    // together. Call it directly - do not probe for it first.
    isMonster = victim.isMonster()
  } catch (e) {
    // NEVER swallow this again. The silent catch is the whole reason v1 went
    // unnoticed: "the call threw" and "that mob was not hostile" produced the
    // identical result, so there was nothing to see.
    //
    // But v2 over-corrected and logged on EVERY kill, which buried the server
    // log during ordinary play. Loud once, then silent: still impossible to
    // miss, no longer a denial-of-service on the log.
    if (!huntCategoryWarned) {
      huntCategoryWarned = true
      console.error('[the_hunt] cannot read mob category, heat will NOT accrue '
                    + '(logged once per server start): ' + e)
    }
  }
  if (!isMonster) return

  setHeat(killer, heatOf(killer) + HEAT_PER_KILL)
})

ServerEvents.tick(event => {
  const server = event.server
  if (server.tickCount % CHECK_INTERVAL !== 0) return

  server.players.forEach(player => {
    const heat = heatOf(player)
    if (heat <= 0) return

    // `player.level` is a FUNCTION, not a Level.
    //
    // Entity.level() is a public vanilla method named exactly `level`, and a
    // class-declared method beats KubeJS's kjs$getLevel() interface default of
    // the same JS name. So `player.level` returns the method object, and
    // `player.level.time` reads a property off a Function: undefined, silently.
    //
    // That made `now` undefined and turned createEntity into a TypeError, so
    // even after the getMobCategory fix let heat accrue, NO HUNTER COULD EVER
    // SPAWN. Two bugs deep in one mechanic, each hiding the next.
    //
    // Also: Level has no readable `.time` at all - it is getGameTime().
    // ...and the fix for THAT was wrong too. Live play logged, every 30s:
    //     the_hunt.js#121: Cannot find function getGameTime
    // `typeof player.level === 'function'` reads FALSE under Rhino even though
    // it is a method - the same "Rhino will not hand back a bare method
    // reference" trap that broke the kill-heat category read two files ago - so
    // the ternary took the other branch and getGameTime was not there either.
    //
    // Stop trying to reach a Level at all. `server.tickCount` is already proven
    // to work in this exact scope: the line above this block uses it to gate the
    // whole tick handler, so if it were wrong nothing here would ever run.
    //
    // Tradeoff, deliberate: tickCount resets on server restart, so a restart
    // clears an in-flight hunt cooldown. That is harmless, and a verified value
    // beats an elegant one.
    const now = server.tickCount
    const last = player.persistentData.getLong(LAST_HUNT) || 0
    if (last > 0 && now - last < HUNT_COOLDOWN) return

    const chance = (heat / HEAT_CAP) * CHANCE_AT_CAP
    if (Math.random() > chance) return

    const id = HUNTERS[Math.floor(Math.random() * HUNTERS.length)]

    // Spawn via COMMAND, not via a Level object.
    //
    // The previous version held `lvl` and called lvl.createEntity / lvl.getHeight.
    // Getting a Level out of a player under Rhino is exactly what broke this file
    // twice (player.level is a method that does not answer to typeof, and the
    // fallback had no getGameTime), and when `lvl` was finally removed in favour
    // of server.tickCount these two lines kept referencing it - a latent
    // ReferenceError that would only have fired the first time a hunt actually
    // triggered, i.e. long after anyone was watching.
    //
    // `execute at <player> run summon` needs no Level, no height query, and is
    // the same runCommandSilent path already proven by the guidebook script.
    const angle = Math.random() * Math.PI * 2
    const dist = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN)
    const dx = Math.round(Math.cos(angle) * dist)
    const dz = Math.round(Math.sin(angle) * dist)

    try {
      server.runCommandSilent(
        `execute at ${player.username} run summon ${id} ~${dx} ~ ~${dz}`)
    } catch (e) {
      console.warn(`[the-hunt] could not summon '${id}': ${e}`)
      return
    }

    player.persistentData.putLong(LAST_HUNT, now)
    console.info(`[the-hunt] heat ${heat} -> sent ${id} after ${player.username}`)
  })
})

// ---------------------------------------------------------------------------
// VERIFY (all failure modes here are silent):
//
//   /kubejs reload
//   Kill hostiles underground, then watch the server console for
//   "[the-hunt] heat N -> sent ..." lines. No lines after many kills means
//   either the MONSTER category check is failing or heat is not accumulating.
//
//   Inspect a player's heat directly:
//     /data get entity <player> KubeJSPersistentData.buried_heat
//
//   NOT ForgeData. `entity.persistentData` in KubeJS resolves to its own
//   kjs$getPersistentData(), written under KubeJSPersistentData - so the old
//   command reported nothing even when heat was accruing correctly.
//   This is also load-bearing: NeoForge's persistent data only survives death
//   via its PlayerPersisted subtag, while KubeJS's tag is copied wholesale on
//   PlayerEvent.Clone. A heat value that resets on death is the intended
//   behaviour here, but a nemesis TALLY that reset would be useless - both
//   ride on this being the KubeJS tag.
//
//   If an entity id is wrong, the console warns and that hunt is skipped -
//   nothing crashes, but the mechanic quietly does less than it appears to.
//
// TUNING: CHANCE_AT_CAP 0.30 with a 30s check means a fully-heated player is
// hunted within a few minutes. That is deliberately aggressive for testing.
// Halve it once you know it works.
// ---------------------------------------------------------------------------
