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
    isMonster = String(victim.type ? victim.getMobCategory() : '').toUpperCase().includes('MONSTER')
  } catch (e) {
    isMonster = false
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

    const now = player.level.time
    const last = player.persistentData.getLong(LAST_HUNT) || 0
    if (last > 0 && now - last < HUNT_COOLDOWN) return

    const chance = (heat / HEAT_CAP) * CHANCE_AT_CAP
    if (Math.random() > chance) return

    const id = HUNTERS[Math.floor(Math.random() * HUNTERS.length)]
    let hunter
    try {
      hunter = player.level.createEntity(id)
    } catch (e) {
      console.warn(`[the-hunt] entity '${id}' could not be created: ${e}`)
      return
    }
    if (!hunter) {
      console.warn(`[the-hunt] entity '${id}' is not registered - check HUNTERS`)
      return
    }

    // Place it out of sight but within stalking range, on ground level.
    const angle = Math.random() * Math.PI * 2
    const dist = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN)
    const x = player.x + Math.cos(angle) * dist
    const z = player.z + Math.sin(angle) * dist
    const y = player.level.getHeight('MOTION_BLOCKING_NO_LEAVES', Math.floor(x), Math.floor(z))

    hunter.setPosition(x, y, z)
    hunter.spawn()

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
//     /data get entity <player> ForgeData.buried_heat
//
//   If an entity id is wrong, the console warns and that hunt is skipped -
//   nothing crashes, but the mechanic quietly does less than it appears to.
//
// TUNING: CHANCE_AT_CAP 0.30 with a 30s check means a fully-heated player is
// hunted within a few minutes. That is deliberately aggressive for testing.
// Halve it once you know it works.
// ---------------------------------------------------------------------------
