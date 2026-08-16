// introductions.js - I2 of the Introductions build.  docs/26-INTRODUCTIONS.md
//
// The six scenes, and what refusing one costs.
//
// Path selection no longer grants instantly. `/path <key>` clears its guards and
// then hands off to here: the screen goes black, the patron speaks, and the player
// chooses. Accepting runs the ORIGINAL grant untouched (paths.js commitPath).
// Refusing writes nothing at all - which is the whole safety argument below.
//
// -- THE SCENE TEXT IS GENERATED FROM docs/28-THE-SCENES.md -------------------
// Not transcribed. 102 lines by hand is 102 chances to fat-finger somebody's
// dialogue, and the curated fixes (Blade's "Run." -> "Go.", Salvage's third
// "friend" cut) would have been easy to silently undo. To change a line, EDIT THE
// DOC and regenerate - the doc stays the source of truth for Ethan's writing.
//
// -- P1: WHY REFUSAL CANNOT DESYNC -------------------------------------------
// The P1 bug is a player carrying veldora_path="forge" against an EMPTY claim, or
// the reverse. docs/26 called path selection "the fourth place P1 can be born",
// and it would have been: the old code wrote the TAG and the CLAIM inline, so
// inserting a decision in the middle would have left them half-written on refusal.
//
// The fix is structural rather than careful. EVERY mutation - releasePath, the
// tag, the claim, the escrow clearing, the XP strip - lives inside commitPath,
// and commitPath is only ever reached from the accept branch. A refusal is not
// "an accept that cleans up after itself"; it is a path that never runs a write at
// all. There is nothing to desync.
//
// -- THE SILENCE -------------------------------------------------------------
// Refusing makes the patron walk away. Coming back too soon gets one flat line
// about your own body and an indifferent world - never a rejection message, never
// a cooldown counter, never a patron. Ethan: "it should just be silence... It
// should be your actions."

// Same shared-namespace idiom as notoriety.js. Declared OUTSIDE the IIFE so
// sibling scripts see it, and the trailing semicolon is load-bearing - without it
// ASI parses the next line as {}(function(){...}).
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[intro] '

  var GAP = 50                  // ticks between spoken lines, ~2.5s
  var CLOSE_GAP = 40            // slightly faster for the closing beat
  var CD_TICKS = 24000          // one in-game day, ~20 min of play
  var CD_PREFIX = 'veldora_refused_'

  var RED = '§4§l'    // the event colour - a patron is speaking
  var GREY = '§7§o'   // the silence. never red: nothing is happening.

  // ---------------------------------------------------------------------------
  // THE SCENES - generated from docs/28-THE-SCENES.md, do not hand-edit
  // ---------------------------------------------------------------------------
  var SCENES = {
    /*__SCENES_BEGIN__*/
    blade: {
      arrival: [
        "I have seen your fight.",
        "You are strong. Not strong enough to be a champion — but strong enough to rise.",
        "I go by many names. The Warrior. The Savior. The Golden God.",
        "For you, I am none of those. I am your patron.",
      ],
      demand: [
        "I shall lead you to greatness.",
        "All you need to do is reach out.",
      ],
      options: [
        "Reach out.",
        "Pull back.",
      ],
      accept: [
        "*A hand closes around yours. The grip is tight, almost painful.",
        "*You are pulled forward hard enough to stumble.",
        "*You look up. A figure stands over you in shadow, and its eyes are a piercing crimson.",
        "*You are afraid.",
        "Let's begin.",
      ],
      refuse: [
        "*A chill goes down your spine.",
        "Perhaps it is for the best.",
        "You would only get yourself killed.",
      ],
    },
    salvage: {
      arrival: [
        "There you are.",
        "I wondered how long you'd make me wait.",
        "Do not be afraid of the dark — I like to talk close, and this is close.",
        "You called me, friend, and here I am, same as I always come.",
        "I have watched hands reach for this life a long time before yours reached for me. Most take more than they can carry, and pay for it in pieces.",
        "Let's do a deal.",
      ],
      demand: [
        "Give me what you've grown into out here — everything you've climbed to be since you arrived. I only want to hold it.",
        "It travels lighter with me than loose in your own two hands.",
        "Let me hold some of it for you. I am good at holding things.",
      ],
      options: [
        "Let her hold it.",
        "Not yet.",
      ],
      accept: [
        "Good. Just breathe — this only takes a moment, and it's mine to keep safe now, not yours to lose.",
        "There. Lighter already, aren't you.",
        "Now. Let's see what you can still carry.",
      ],
      refuse: [
        "Mm. Not tonight, then.",
        "I am not going anywhere. I never do.",
        "I will still be circling.",
      ],
    },
    forge: {
      arrival: [
        "There you are.",
        "Late — again. I've dragged this chain since before you were born, and still I'm the one who waits.",
        "Sit still. This will not take long — unless you make it.",
        "I was old before this dirt had a name. Did you think I'd forget an arrangement?",
        "Bells ring when a debt walks by. Mine never stop.",
        "You've heard that sound before. In your sleep, if nowhere else.",
      ],
      demand: [
        "We shook on it. Maybe not with hands — you don't recall, and that is not my concern.",
        "Everything in your pockets, and everything your pockets will ever hold. That was always the shape of it.",
        "I don't care if you live to see it built. I care that it gets built. Well?",
      ],
      options: [
        "Fine. Take it.",
        "Not tonight.",
      ],
      accept: [
        "There. See? Painless.",
        "That is everything you had? Pathetic hoard — I've taken heavier tolls off men half asleep.",
        "Up. There's a great deal of owing left in you yet.",
      ],
      refuse: [
        "You made me wait for this?",
        "I do not forget a wasted evening. I was old before memory was invented, and mine outlasts yours.",
        "Fine. I'll drag this same chain past your door tomorrow, and the next, until you remember what's owed.",
      ],
    },
    wall: {
      arrival: [
        "For centuries I have been alone.",
        "A god of five, but none in companionship.",
        "They rejected me. They cursed me. Barely allowed to say a word.",
        "But you? They rejected you too.",
        "I won't. I never will.",
      ],
      demand: [
        "*You feel a presence against your ear. A faint whisper of unimaginable secrets.",
        "There. My truth.",
        "*You feel an urge to reach out.",
      ],
      options: [
        "Reach out.",
        "Run.",
      ],
      accept: [
        "*You feel a hand press against yours. It folds inwards, clutching hard. It feels warm.",
        "I will never let you go.",
      ],
      refuse: [
        "*You trip on your feet as you back up. An intense scream fills your ears.",
      ],
    },
    crown: {
      arrival: [
        "Be seated. You were never standing, but the correction costs nothing.",
        "A court has convened. You were simply not yet worth telling.",
        "You were recommended to me, which happens rarely — I do not ask who, and it would not concern you if I did.",
        "I have counted every hour you thought yourself unwatched.",
        "Others call themselves protector, guardian, friend. I keep no such pretense.",
        "You were noticed before you were impressive. That is rarer, and should not be wasted.",
      ],
      demand: [
        "I require an answer, not a debate. The debate concluded before you arrived.",
        "Serve, or refuse — I have use for either word, though only one keeps your name in my count.",
        "I am told you are decisive. I would like that to be true.",
      ],
      options: [
        "I will take my station.",
        "I answer to no court.",
      ],
      accept: [
        "Good. Few answer correctly on the first true asking.",
        "There is a toll at this gate, as at any gate worth entering — what you carried in, you do not carry in twice. Consider the account settled, not taken.",
        "You will not miss it. A vassal is provisioned. He does not hoard.",
      ],
      refuse: [
        "Noted, and recorded — a rare line in a very long ledger.",
        "The court remembers those who know their own mind.",
        "Go, then. I do not send the dead after someone who simply said no.",
      ],
    },
    art: {
      arrival: [
        "Dark. Good. You found the dark.",
        "She was starting to worry you'd forgotten the way.",
        "Forgotten, the way you always forget, and always find again.",
        "You have been here before. Here, every night.",
        "You never saw her in the light. You will not see her now either. That is alright.",
        "She has been close. Close, and quiet, and near.",
      ],
      demand: [
        "You have been carrying so much. So much, for so long.",
        "Let her carry it instead.",
        "Put it down. Just for tonight. Just like every other night.",
      ],
      options: [
        "Close your eyes.",
        "Keep them open.",
      ],
      accept: [
        "There. There now.",
        "She'll hold what you were carrying. She'll hold all of it.",
        "Sleep light. She has you. She has always had you.",
      ],
      refuse: [
        "She is not going anywhere. She was never going anywhere.",
        "Sleep comes for everyone eventually.",
        "She'll be here. Same dark, same her, every night.",
      ],
    },
    /*__SCENES_END__*/
  }

  // ---------------------------------------------------------------------------
  // THE SILENCE - one pool, all six patrons, nothing is there.
  //
  // Deliberately NOT per-patron. A characterised absence is just a quieter
  // appearance: if the silence sounds like Blade then Blade is still present, still
  // performing, still paying you attention, and refusing cost nothing. These are
  // about the player's own body and a world that was going to carry on regardless.
  // ---------------------------------------------------------------------------
  var SILENCE = [
    'You hear nothing but the wind.',
    'The wind blows around you.',
    'You hear your own heartbeat.',
    'You take a breath.',
    'Your own breathing sounds loud to you.',
    'You shift your weight. The ground creaks.',
    'You lower your hands.',
    'The air is cold on your face.',
    'Somewhere far off, water is running.',
    'You stand there a while longer.',
    'You listen. The world makes its usual sounds.',
    'Nothing happens.',
  ]

  function tell(p, s) { try { p.tell(Text.of(s)) } catch (e) { } }

  // Survives restarts where tickCount does not (finding K9). fall.js floors the
  // same clock to whole days; this cooldown is shorter than a day, so it keeps the
  // raw tick.
  //
  // ⚠️ IT IS NOT MONOTONIC, though this comment used to claim it was. /time set
  // rewrites dayTime, and admins do - measured 2026-08-15, day 10004 to day 82 in
  // an afternoon. See the guard in refusedUntil.
  function nowTicks(srv) {
    try {
      var d = srv.overworld().dayTime()
      if (typeof d === 'number' && isFinite(d)) return d
    } catch (e) { }
    return null
  }

  function refusedUntil(p, key) {
    var until = 0
    try { until = p.persistentData.getInt(CD_PREFIX + key) || 0 } catch (e) { return 0 }
    if (!until) return 0
    // A stamp further ahead than the cooldown's own length means the clock moved
    // backwards under it. Left alone, that patron is silent for ~10,000 days.
    var srv = null
    try { srv = p.server } catch (e) { }
    var now = srv ? nowTicks(srv) : null
    if (now !== null && until - now > CD_TICKS) {
      console.warn(TAG + 'refusal stamp for ' + key + ' is impossibly far ahead - ' +
        'the world clock moved. Clearing rather than silencing them for good.')
      try { p.persistentData.putInt(CD_PREFIX + key, 0) } catch (e) { }
      return 0
    }
    return until
  }

  function markRefused(srv, p, key) {
    var now = nowTicks(srv)
    if (now === null) {
      // No clock means no cooldown. Say so - a silent no-op here would make every
      // refusal instantly retryable and the walk-away would be decorative.
      console.error(TAG + 'no world clock - NO REFUSAL COOLDOWN SET for ' + p.username)
      return
    }
    try { p.persistentData.putInt(CD_PREFIX + key, Math.floor(now + CD_TICKS)) } catch (e) { }
    console.info(TAG + p.username + ' refused ' + key + ' - silent until tick ' +
      Math.floor(now + CD_TICKS))
  }

  function speakSilence(p) {
    var line = SILENCE[Math.floor(Math.random() * SILENCE.length)]
    tell(p, GREY + line)
  }

  // ---------------------------------------------------------------------------
  // open() - the seam paths.js calls instead of granting.
  //
  // ⭐ NARRATION vs SPEECH. A line beginning with `*` describes the player's body
  // or the room; everything else is the god talking. Ethan's own convention - he
  // wrote "*You feel a heavy silence" in the Harvest cutscene and then wrote a whole
  // acceptance branch in it.
  //
  // It matters more than a colour change. Every other line in this project is a
  // voice, and a voice cannot say "you are afraid" without telling the player how to
  // feel. Narration can, because it is not coming from anyone. It is also the only
  // way the crimson-eyed figure can be SEEN for one line - the gods are voice-only
  // since the actor reframe, and this is the single exception the scene system gets.
  var NARRATE = '§7§o'
  function dress(text) {
    if (text && text.charAt(0) === '*') return NARRATE + text.substring(1)
    return RED + text
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 REFUSING THE SPIDER KILLS YOU. Ethan, 2026-08-15: "Kill player* (Like
  // seriously.)"
  //
  // Every other patron lets you walk away - Crown was even written to RESPECT it.
  // She does not. That single asymmetry says more about her than any line does, and
  // it is the reason her introduction is the only one in the game with a real price
  // for saying no.
  //
  // It is a MAP, not a scene field, because it is a mechanic: `28-THE-SCENES.md`
  // holds what a patron says, and `gen_scenes.py` only lifts the five text beats.
  // A rule that kills a player does not belong in a text file the generator parses.
  //
  // ⚠️ TIMING OUT COUNTS. This file already rules that walking away IS a refusal -
  // if the timeout were survivable, a player would learn to dodge her by waiting 60
  // seconds, and the one thing that makes her frightening becomes a formality.
  //
  // ⚠️ It fires AFTER her closing narration, never during: the scream has to land
  // first, and the ritual still holds them blind while it does.
  var KILLS_ON_REFUSAL = { wall: true }

  // safeName() is ritual.js's, not this file's. A name read must never be the thing
  // that throws inside a death handler.
  function nameOf(pl) { try { return pl.username } catch (e) { return '<unreadable>' } }

  function takeItBack(pl, key, delay) {
    if (!KILLS_ON_REFUSAL[key]) return
    var srv = null
    try { srv = pl.server } catch (e) { }
    function strike() {
      try { pl.kill() } catch (e) {
        // A failed kill must be LOUD. Silently surviving her refusal would read as
        // the scene working, and she would quietly become the same as the others.
        try { pl.setHealth(0) } catch (x) {
          console.error(TAG + '!! could not kill ' + nameOf(pl) +
            ' on refusing wall - SHE LET SOMEONE GO. ' + e + ' / ' + x)
        }
      }
      console.info(TAG + nameOf(pl) + ' refused the Spider and she took it back')
    }
    if (srv) { try { srv.scheduleInTicks(delay, strike); return } catch (e) { } }
    strike()
  }

  // Returns true if it took responsibility for the request (scene opened, or the
  // patron was not there). Returns false ONLY if it cannot run at all, so the
  // caller can fall back to the old immediate grant rather than leaving a player
  // with a command that silently does nothing.
  // ---------------------------------------------------------------------------
  function open(srv, p, key, commit) {
    var scene = SCENES[key]
    if (!scene) { console.error(TAG + 'no scene for ' + key); return false }

    // Did you turn this one down recently? Then it simply is not here.
    var until = refusedUntil(p, key)
    var now = nowTicks(srv)
    if (until && now !== null && now < until) {
      speakSilence(p)
      console.info(TAG + p.username + ' reached for ' + key + ' during its silence')
      return true                     // handled: the request is over, nothing granted
    }

    if (!VELDORA.ritual || typeof VELDORA.ritual.begin !== 'function') {
      console.error(TAG + 'VELDORA.ritual missing - falling back to an instant grant')
      return false
    }

    var lines = []
    var i
    for (i = 0; i < scene.arrival.length; i++) lines.push(dress(scene.arrival[i]))
    for (i = 0; i < scene.demand.length; i++) lines.push(dress(scene.demand[i]))

    var closing = Math.max(scene.accept.length, scene.refuse.length)
    var hold = (closing * CLOSE_GAP) + 30

    var began = VELDORA.ritual.begin(p, {
      lines: lines,
      gap: GAP,
      holdAfterChoice: hold,
      options: [
        { label: scene.options[0], id: 'accept' },
        { label: scene.options[1], id: 'refuse' },
      ],
      onChoose: function (pl, id) {
        var say = (id === 'accept') ? scene.accept : scene.refuse
        for (var n = 0; n < say.length; n++) {
          (function (idx, text) {
            try { srv.scheduleInTicks(idx * CLOSE_GAP, function () { tell(pl, dress(text)) }) }
            catch (e) { tell(pl, dress(text)) }
          })(n, say[n])
        }
        if (id === 'accept') {
          // The grant runs AS the closing lines start, and is NOT scheduled - it
          // must not depend on a timer surviving. The patron speaks and takes in
          // the same breath.
          try { commit() } catch (e) {
            console.error(TAG + 'commit threw for ' + pl.username + ' :: ' + e)
            tell(pl, '§cSomething went wrong taking that path. Tell Ethan.')
          }
        } else {
          markRefused(srv, pl, key)
          takeItBack(pl, key, (say.length * CLOSE_GAP) + 25)
        }
      },
      // Walking away from the scene IS a refusal. Any other reading lets a player
      // dodge the cooldown by closing their eyes for a minute.
      onTimeout: function (pl) {
        markRefused(srv, pl, key)
        speakSilence(pl)
        takeItBack(pl, key, 40)
      },
    })

    if (!began) { console.error(TAG + 'ritual refused to begin for ' + p.username); return false }
    console.info(TAG + p.username + ' met ' + key + ' - ' + lines.length + ' lines')
    return true
  }

  VELDORA.intro = { open: open, silence: speakSilence, scenes: SCENES }

  ServerEvents.loaded(function () {
    var n = 0
    for (var k in SCENES) n++
    var ok = VELDORA.intro && typeof VELDORA.intro.open === 'function'
    if (ok) console.info(TAG + 'VELDORA.intro published OK - ' + n + ' scenes, ' +
      SILENCE.length + ' silence lines')
    else console.error(TAG + 'VELDORA.intro MISSING - path selection will grant instantly')
  })
})()
