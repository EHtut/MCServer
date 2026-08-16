// deep_speaker.js - THE SPEAKER FOR THE GODDESS OF DEATH.  docs/15 §0b, docs/40
//
// Ethan, 2026-08-15:
//   "the gods cannot see you when you descend after a certain level. Instead
//    dialogue is replaced by the goddess of death's speaker."
//   "She is the speaker for the goddess of death. She watches endlessly these fel
//    corridors. It is she whom which the horrors of this land are born."
//
// ── ⭐ WHY THIS IS THE BEST MECHANIC IN THE PROJECT ──────────────────────────
// Every other system makes the world louder as it gets more dangerous. This one
// makes YOUR GOD GO SILENT.
//
// Below the cutoff the patron cannot reach you. The voice that has been arming you,
// testing you and grudgingly approving of you is simply GONE - and something else
// is talking instead. It costs nothing to build and it changes what descending
// means: you are not going somewhere dangerous, you are going somewhere OUT OF
// EARSHOT.
//
// It also gives the strata a moral gradient the depth loop never had. She tells you
// your own god is complicit, and the deeper you go the less able he is to answer.
//
// ── SHE IS NOT A GOD, AND SHE DOES NOT SOUND LIKE ONE ───────────────────────
// Grey, not the gods' bold red. Patient rather than demanding. She is the only
// voice in the world that is not asking you for anything - she is simply telling
// you what you are, and what you will be.
//
;
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var TAG = '[speaker] '
  var SPEAKER = 'death_speaker'

  // The cutoff. `15-LORE.md` strata: Deep Works run 0 to -60, the Sealed Floor
  // below that. Ethan: "It has to be a low or almost lowest" - so this sits inside
  // the Deep Works, deep enough that reaching it is a decision.
  var CUTOFF_Y = -40

  var K_MET = 'veldora_speaker_met'    // she introduces herself exactly once

  // Whole lines. She speaks in complete thoughts - a fragment grammar would make
  // her sound like the gods, and she is deliberately not one of them.
  var LINES = {
    intro: [
      'The champion of the Blade. Another one. Come deeper, your end shall be swift.',
    ],
    common: [
      'Your god was once a servant of mine. He can be hers again.',
      'After your end, you will rise down here. Not as a champion, but as one of us.',
      'You fight well. A threat, perhaps, up there. Down here you are nothing more than prey.',
      'He cannot hear you at this depth. Did he tell you that?',
      'Every corridor you walk, I have watched for longer than your god has had a name.',
      'They were a family once. Then the church came, and then your gods.',
      'You are not the first champion to come this far. You are not even the tenth.',
      'She did not want this. They made her what she is, and then called her fel.',
      'Keep descending. It is easier for both of us if you do not turn back.',
      'The horrors here were born of her grief. Do not mistake them for malice.',
    ],
    // She notices what your god's silence means before you do.
    abandoned: [
      'Listen. Nothing. That is what his protection is worth down here.',
      'Call for him if you like. I will wait.',
      'He is still speaking, somewhere above. Not to you.',
    ],
  }

  function speakerActive(p) {
    try { return p.y <= CUTOFF_Y } catch (e) { return false }
  }

  // Published so idle.js can ask "is this champion out of earshot", and so any
  // future god's speech can defer without knowing why.
  VELDORA.speaker = {
    id: SPEAKER,
    cutoff: CUTOFF_Y,
    active: speakerActive,
    // Say something as her. Handles the one-time introduction itself, because the
    // first thing she ever says to a champion is not a random line.
    say: function (p, tag) {
      if (!VELDORA.voice) return false
      var met = false
      try { met = !!p.persistentData.getBoolean(K_MET) } catch (e) { }
      if (!met) {
        try { p.persistentData.putBoolean(K_MET, true) } catch (e) { }
        console.info(TAG + p.username + ' has met her')
        return VELDORA.voice.say(p, SPEAKER, 'intro')
      }
      return VELDORA.voice.say(p, SPEAKER, tag || 'common')
    },
  }

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    function ADMIN(s) { try { return s.hasPermission(2) } catch (e) { return false } }
    event.register(Commands.literal('speaker').requires(ADMIN).executes(function (ctx) {
      var p = ctx.source.player
      if (!p) return 0
      var below = speakerActive(p)
      p.tell(Text.of('§8§m                                        '))
      p.tell(Text.of('§7y §f' + Math.round(p.y) + '§8, cutoff §f' + CUTOFF_Y +
        ' §8- your god ' + (below ? '§ccannot reach you' : '§acan still hear you')))
      VELDORA.speaker.say(p, 'common')
      return 1
    }))
  })

  ServerEvents.loaded(function () {
    if (!VELDORA.voice) { console.error(TAG + 'voice.js missing'); return }
    VELDORA.voice.setColour(SPEAKER, '§7')      // grey. She is not a god.
    var n = 0
    for (var k in LINES) {
      if (!LINES.hasOwnProperty(k)) continue
      if (VELDORA.voice.registerLines(SPEAKER, k, LINES[k])) n += LINES[k].length
    }
    console.info(TAG + 'the Speaker waits below y' + CUTOFF_Y + ' - ' + n +
      ' lines, grey. Below the cutoff a champion cannot hear their god.')
  })
})();
