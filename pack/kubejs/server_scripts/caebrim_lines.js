// caebrim_lines.js — GENERATED. Do not edit by hand.
//
//     python tools/caebrim_import.py --write
//
// ⭐ THE SOURCE IS `docs/dialogue/Caebrim (Speaker Dialogue).txt`. This file is a VIEW of
// it, regenerated whenever Ethan edits. Editing here makes a second copy of his prose
// that drifts silently.
//
// ── 🔑 HER "TRUST" IS TIDE POWER, NOT A RELATIONSHIP ─────────────────────────
// His header: *"Trust is essentially tide power level."* So low/med/high below are gated
// on how bad the tide is, not on anything a player has earned. She is the only speaker in
// the game whose register tracks the WORLD'S state rather than a player's.
//
// ── WHAT IS IN HERE ──────────────────────────────────────────────────────────
//   whispers  low | med | high      what she mutters, by tide power
//   tide      start | during | end  the wave announcing itself, taunting, and finishing
//   scenes    [{god, turns}]        authored exchanges between her and one god,
//                                   high trust, "at any time"
//
// ⚠️ CHUNKS ARE BEATS, not lines. A single newline in his document is a deliberate beat
// and is delivered by voice.speakChunks, exactly like the bickering scenes.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var DATA = {
    "whispers": {
      "low": [
        [
          "You have taken everything from the goddess.",
          "Now all that remains is perfect hatred."
        ],
        [
          "You are not welcome here"
        ],
        [
          "Your kind knows nothing of our suffering."
        ],
        [
          "You will meet your end in this darkness."
        ],
        [
          "You will not leave these caves."
        ]
      ],
      "med": [
        [
          "You are growing.",
          "Strong.",
          "But not even close to enough."
        ],
        [
          "How do you fight against that that does not die"
        ],
        [
          "Animal."
        ],
        [
          "So many of our people dead.",
          "By your hand."
        ]
      ],
      "high": [
        [
          "You are strong.",
          "Strong enough to stop all of this.",
          "Why don't you?"
        ],
        [
          "Do I need to keep fighting you?",
          "Can't you just join our side?"
        ],
        [
          "THE GODS DO NOT CARE FOR YOU!",
          "They never will.",
          "They never will."
        ]
      ]
    },
    "tide": {
      "start": [
        [
          "Let us see you fight"
        ],
        [
          "You have met your end."
        ],
        [
          "Our numbers swarm.",
          "Retribution is at hand"
        ],
        [
          "I WANT YOU DEAD"
        ],
        [
          "You will not progress"
        ],
        [
          "You will not take more from my goddess"
        ],
        [
          "DIE!"
        ],
        [
          "Lets settle this!"
        ]
      ],
      "during": [
        [
          "IS THAT THE BEST YOU GOT?!"
        ],
        [
          "NOW THIS IS A FIGHT WORTHY OF GOD'S WILL"
        ],
        [
          "I WILL SHOW YOU TRUE SPLENDOR"
        ],
        [
          "FIGHT ME LIKE AN ANIMAL"
        ],
        [
          "SHOW ME WHAT YOU WERE MADE FOR"
        ],
        [
          "YES!",
          "SHOW US YOUR SAVAGERY"
        ]
      ],
      "end": [
        [
          "HAHAHAHAHAHAHAHA!"
        ],
        [
          "I HAVE ONLY KNOWN THE TASTE OF VICTORY"
        ],
        [
          "We will meet again, Champion."
        ]
      ]
    },
    "scenes": [
      {
        "god": "blade",
        "turns": [
          {
            "god": "caebrim",
            "chunks": [
              "Gregor, you don't need to do this.",
              "Give in.",
              "Come back down with us."
            ]
          },
          {
            "god": "blade",
            "chunks": [
              "Leave me, Shadow.",
              "I will not return."
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "We didn't have to fight.",
              "We could have stayed a family."
            ]
          },
          {
            "god": "blade",
            "chunks": [
              "It is too late."
            ]
          }
        ]
      },
      {
        "god": "blade",
        "turns": [
          {
            "god": "caebrim",
            "chunks": [
              "Gregor.",
              "Come back to us.",
              "Alice is waiting below.",
              "She wants...",
              "She wants..."
            ]
          },
          {
            "god": "blade",
            "chunks": [
              "Alice?",
              "The most selfish of the gods?",
              "Please.",
              "She has done nothing but hurt."
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "HERETIC!"
            ]
          },
          {
            "god": "blade",
            "chunks": [
              "Name me whatever you wish."
            ]
          }
        ]
      },
      {
        "god": "wall",
        "turns": [
          {
            "god": "caebrim",
            "chunks": [
              "Mera, we're waiting for you.",
              "You can hear us.",
              "We can hear you.",
              "Just come down."
            ]
          },
          {
            "god": "wall",
            "chunks": [
              "No."
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "No?",
              "You want to be down here.",
              "You to be with us."
            ]
          },
          {
            "god": "wall",
            "chunks": [
              "Not. With. You"
            ]
          }
        ]
      },
      {
        "god": "wall",
        "turns": [
          {
            "god": "caebrim",
            "chunks": [
              "Mera, our goddess waits below."
            ]
          },
          {
            "god": "wall",
            "chunks": [
              "Then she may call me down herself."
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "You can come down",
              "Willingly",
              "Just step down."
            ]
          },
          {
            "god": "wall",
            "chunks": [
              "Im not sure what you want from me here."
            ]
          }
        ]
      },
      {
        "god": "forge",
        "turns": [
          {
            "god": "caebrim",
            "chunks": [
              "Mila, Im sorry."
            ]
          },
          {
            "god": "forge",
            "chunks": [
              "Sorry?"
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "For everything I did.",
              "For letting you lose like that.",
              "For letting you lose everything",
              "For letting..."
            ]
          },
          {
            "god": "forge",
            "chunks": [
              "Ain'tcha supposed to be asking me to go down wit ya or somethin?"
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "I...",
              "No.",
              "Not you.",
              "Im sorry."
            ]
          },
          {
            "god": "forge",
            "chunks": [
              "Can I visit?"
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "...",
              "I can't ask that of you."
            ]
          }
        ]
      },
      {
        "god": "forge",
        "turns": [
          {
            "god": "caebrim",
            "chunks": [
              "Milantros...",
              "It's you...",
              "I..."
            ]
          },
          {
            "god": "forge",
            "chunks": [
              "Caebrim?"
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "Milantros, i want to..."
            ]
          },
          {
            "god": "forge",
            "chunks": [
              "Want to...?"
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "Nevermind."
            ]
          }
        ]
      },
      {
        "god": "art",
        "turns": [
          {
            "god": "art",
            "chunks": [
              "Sister."
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "Sister."
            ]
          }
        ]
      },
      {
        "god": "art",
        "turns": [
          {
            "god": "art",
            "chunks": [
              "Are you here to beg me to return?"
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "No.",
              "Not you."
            ]
          }
        ]
      },
      {
        "god": "art",
        "turns": [
          {
            "god": "caebrim",
            "chunks": [
              "Ank speaks of you.",
              "In his moments of weakness.",
              "he wants you back.",
              "He loves you."
            ]
          },
          {
            "god": "art",
            "chunks": [
              "...",
              "I...",
              "You know what I have to do.",
              "Do not tempt my return."
            ]
          },
          {
            "god": "caebrim",
            "chunks": [
              "I know..."
            ]
          }
        ]
      }
    ]
  }

  VELDORA.caebrimLines = {
    whispers: function (k) { return (DATA.whispers && DATA.whispers[k]) || [] },
    tide: function (k) { return (DATA.tide && DATA.tide[k]) || [] },
    scenes: function () { return DATA.scenes || [] },
    all: function () { return DATA },
  }
})();
