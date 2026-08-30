// bicker_scenes.js — GENERATED. Do not edit by hand.
//
//     python tools/bicker_import.py --write
//
// ⭐ THE SOURCE IS `docs/dialogue/Bickering Doc *.txt`, which is where Ethan writes. This
// file is a VIEW of those documents, regenerated whenever he edits them. Editing it
// directly makes a second copy of his prose that drifts silently, because both would read
// perfectly well.
//
// ⚠️ NOTE THE DIRECTION, it is the opposite of `dialogue_doc.py`: there the SCRIPT is the
// source and the document is the view. Here the DOCUMENT is the source. Confusing the two
// loses somebody's writing.
//
// ── WHAT A SCENE IS ──────────────────────────────────────────────────────────
//   pair    the two gods talking
//   tier    low | med | high — the trust required to overhear it
//   needs   null = plays for anyone; a god id = a champion of THAT god must be online
//   turns   [{god, chunks:[…]}] — a turn is one speaker; chunks are their beats
//
// 🔑 CHUNKS ARE NOT TURNS. Ethan: *"Chunked dialogued is only separated by a single new
// line."* Wall's seven-line lament is ONE turn in seven chunks and must arrive as seven
// quick beats, not seven exchanges. bicker.js gives them different gaps.
var VELDORA = (typeof VELDORA !== 'undefined') ? VELDORA : {};

;(function () {
  var SCENES = [
    {
      "pair": [
        "art",
        "blade"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "I approve of your work, Warrior."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Thank you, my Matriarch"
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "blade"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "There is room for improvement.",
            "Yes.",
            "However, your work serves are cause well."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Thank you, Matriarch"
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "blade"
      ],
      "tier": "low",
      "needs": "blade",
      "turns": [
        {
          "god": "art",
          "chunks": [
            "Your champion impresses me."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Thank you, Matriarch"
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "blade"
      ],
      "tier": "low",
      "needs": "blade",
      "turns": [
        {
          "god": "art",
          "chunks": [
            "Your champion has room to grow.",
            "As do you.",
            "Redouble your efforts"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "As your will.",
            "My matriarch."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "blade"
      ],
      "tier": "low",
      "needs": "art",
      "turns": [
        {
          "god": "art",
          "chunks": [
            "I do wish you and your champion work alongside mine.",
            "Our cause is one that is too great to risk uncooperation",
            "Agreed?"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Agreed.",
            "Thank you, Matriarch"
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "blade"
      ],
      "tier": "low",
      "needs": "art",
      "turns": [
        {
          "god": "art",
          "chunks": [
            "Work harder my champion, for it is us who keeps the undead at bay.",
            "Is that not right for you aswell?",
            "Warrior."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "My blade is yours."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Good."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "blade"
      ],
      "tier": "med",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "You tremble when you speak to me.",
            "Why?"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "I am in awe."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "You are in fear.",
            "I can sense it."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "My apologies."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "You'd do better to serve, than apologize."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "As your word.",
            "My Matriarch."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "blade"
      ],
      "tier": "med",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "The way you fear me sheds the hope your champion has in you.",
            "You must redouble your efforts.",
            "Warrior.",
            "I do not accept failure.",
            "You know this well."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "At your word.",
            "Matriarch."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "There is malice in that.",
            "i can feel it."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "I..."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Know that I can see through you.",
            "Warrior."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "blade"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "You have betrayed me once.",
            "You have betrayed our people once.",
            "You have betrayed our cause once.",
            "You will not betray again.",
            "Is that not right?",
            "Warrior?"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Never.",
            "I will never—"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "I want to hear you say in full."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "I will never betray us again."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Good.",
            "I will hold you to that.",
            "Gregor."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "Matry!",
            "So...",
            "Been thinkin.",
            "Y'know about this ol' champion thing?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Do that less."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Damn, ok."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "I feel like you're always bearin' down on my shoulder, Matry."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "You are not trust worthy."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "What defines trustworthy",
            "Such a word!",
            "Of such deliberation",
            "Of such—"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "You are an idiot, with a role you are not suited for.",
            "Yet I demand you to fill your role, regardless."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Oh."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Oh indeed."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So um..."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "No."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Ok."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "I feel like you hate me.",
            "And Imma be honest",
            "I feel like everyone hates me"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "I hate you."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Well then.",
            "Honesty is everythin'",
            "I guess."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "low",
      "needs": "forge",
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "Between me and you, I don't know what i'm doin'"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Between you and who, Goat."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Fuck... uh, i mean."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Yes?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Well then that there is a cog, we should probably y'know...",
            "cog it."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "low",
      "needs": "forge",
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So like what if we uh... ran?",
            "Y'know the two of us.",
            "Me, the amazing God of forges.",
            "You, the amazing champion of forges.",
            "We can probably go like somewhere where the gods aren't mean and-"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Scheming again?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Scheming!",
            "No idea' what that word means",
            "is it like a food?",
            "A sweet treat perhaps?",
            "Uh...",
            "...",
            "Please don't hurt me."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "low",
      "needs": "art",
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So... Art champion.",
            "The uh...",
            "Champion of the Matriarch.",
            "How's life!"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Don't speak to them.",
            "They are busy."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Yea, I can tell.",
            "Well, obviously overstayed my welcome.",
            "I'll take my leave now.",
            "Bye"
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "med",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "Matry, So I've been thinkin'"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Yes?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Wow, uhm.",
            "Never got this far actually.",
            "So uhm.",
            "I uh.",
            "Wanted to ask you.",
            "Uhm."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Speak, goat."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "What do you ya know about me?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "You're annoying."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Well, ok. That's good enough for me."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "med",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "Goat, I require you."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "(This is my moment!)",
            "Anythin' and anywhere!",
            "Like your bedroom!",
            "...",
            "I see I have made a mistake.",
            "Goodbye."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Ridiculous."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "med",
      "needs": "forge",
      "turns": [
        {
          "god": "art",
          "chunks": [
            "Your champion works hard for the cause."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Hard?!",
            "Like the thing the warrior tells his champion?!"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "What?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Yea, he uhm.",
            "he tells his guy to get hard all the time."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Right."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "med",
      "needs": "forge",
      "turns": [
        {
          "god": "art",
          "chunks": [
            "I deem your work acceptable.",
            "Good job."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "PRAISE?!"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "To your champion,",
            "Not to you."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Wow damn, goin up in the world ain't cha",
            "Champy I am so proud of you.",
            "Like a mother bird watchin' her smaller bird fly away",
            "Oh, the proudness."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "I do not deem your work acceptable."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Damn, ok.",
            "Well.",
            "Shit.",
            "I'm doing my best?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Redouble your efforts."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Gotcha watcha."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Do not ever say that to me again."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Yes Ma'am."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "med",
      "needs": "art",
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So... Art champion.",
            "The uh...",
            "Champion of the Matriarch.",
            "How's life!"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Goat.",
            "You are speaking."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Oh...",
            "Hi Matry",
            "uhm",
            "Well, obviously overstayed my welcome.",
            "I'll take my leave now.",
            "Bye"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "WAIT!",
            "I wish to speak to you"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "I am so fucked.",
            "Yes, Matry?",
            "I wanted to tell you that your work is satisfactory."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "That's cool.",
            "Can I leave?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Yes."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "Stop looking at me like.",
            "Ya' making the hairs on the back of my neck rise.",
            "Please.",
            "Please.",
            "Oh gods she's getting closer",
            "CHAMPY SAVE ME!"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Goat, I wanted to tell you something."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Dear Me, if I die.",
            "I tried to be a good goat."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Are you... praying to yourself?",
            "Ugh.",
            "Focus.",
            "I wanted to tell you that i forgive you."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Oh.",
            "Uh.",
            "Thanks?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Yes."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "So tonight...",
            "Wanna...?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Don't push your luck."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "I know, I have real weird taste in women.",
            "Don't get me wrong.",
            "Matry is like",
            "Top shelf",
            "Ice cold.",
            "Y'know real, good like..."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "You are married are you not, Goat?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "I am?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "You are.",
            "And betrayal of that woman would enrage me."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Oh.",
            "Noted.",
            "Coolio.",
            "So who's the lucky lady?",
            "...",
            "She left."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "forge"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "Milantr-",
            "Goat."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Milan...",
            "What?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Nothing."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So... Watcha doing?"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Go away, goat."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "RUDE!"
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So I've been thinking."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Oh gods"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "I know, im real good at that."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Im sure."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Thinkin'",
            "it's like my speciality",
            "You could even say",
            "My job.",
            "or...",
            "my...",
            "um...",
            "talent?"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Sure."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So...",
            "You and the spider.",
            "What's up with that.",
            "Like you two.",
            "Close as...",
            "uh...",
            "Clams!",
            "but like ya hate each other.",
            "So like clams that hate each other.",
            "Hateful clams."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Nothing you should know.",
            "Goat."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "GUNS!"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Ugh"
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "low",
      "needs": "forge",
      "turns": [
        {
          "god": "blade",
          "chunks": [
            "The Matriarch informed me that we are to work together"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Ya! I build the things.",
            "or my champion builds the things.",
            "And then you use the things."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Indeed.",
            "However cluttered your reasoning may be."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Ya"
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "low",
      "needs": "forge",
      "turns": [
        {
          "god": "blade",
          "chunks": [
            "Forge.",
            "Are you capable of performing the work the Matriarch has given you."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "No idea."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Wonderful."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "low",
      "needs": "blade",
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So your champion.",
            "he real like likes guns",
            "Y'know i had a gun once",
            "A bigun",
            "like.",
            "BLAM!",
            "Many bullets.",
            "Lots a' people dead."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "You have never killed anymone, Goat."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Not yet."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "low",
      "needs": "blade",
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "SHOOT THAT ONE!",
            "AND THAT ONE!",
            "AND THAT ONE!",
            "AND..."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Goat.",
            "Shut.",
            "Up."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Im trying to help."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "It is not necessary."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "med",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So..",
            "Warrior, question for ya!"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "No."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Nah, this one is important!"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "No."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "The goddess of death! Did ya know her!"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "...",
            "Goat.",
            "Shut up."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Im tryna make conversation 'ere.",
            "Spice of life ya know?"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "No."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "med",
      "needs": "forge",
      "turns": [
        {
          "god": "blade",
          "chunks": [
            "I need more output from your champion, goat."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Look man, we're doin all we can."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "We need more, the goddess rumbles below and—"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Hungry goddess."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "I have no idea what that means."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "She hungry.",
            "I can make chocolate.",
            "Like a bunch of it.",
            "Infinites even."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Forget i spoke to you."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "med",
      "needs": "forge",
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "Audible Sigh."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "WHAT DO YOU WANT GOAT!?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Louder audible sigh."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "(sigh)"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "See! ya, like that.",
            "Good.",
            "Louder please."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "(Louder sigh)"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "A hundred points!"
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "med",
      "needs": "blade",
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "BE HARD!"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "What are you doing, goat."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Helpin'"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Helping?"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Don't cha say this to your guy all the time.",
            "OI CHAMPION! GET HARD!"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "I don't say it like that."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Warrior.",
            "My guy.",
            "My thick man.",
            "You do."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Ugh."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "med",
      "needs": "blade",
      "turns": [
        {
          "god": "blade",
          "chunks": [
            "You are in my space again.",
            "Goat.",
            "What do you want."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Watchin."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "Watching what."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Your partner.",
            "They're pretty good at killing stuff."
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "They are my champion."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Tell them to get hard again"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "ugh."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "blade",
          "chunks": [
            "You are staring at me like you want something."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "This is the part where you tell me something about yourself!"
          ]
        },
        {
          "god": "blade",
          "chunks": [
            "No."
          ]
        }
      ]
    },
    {
      "pair": [
        "blade",
        "forge"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "blade",
          "chunks": [
            "Stop looking at me like you want something."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            ":("
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "Spider, I need you focus on the task at hand"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "How can I focus?",
            "How can I focus when I feel nothing but longing."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Focus regardless"
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "I am sad.",
            "I am broken.",
            "Begotten by a people who will never speak my name.",
            "Never see my face.",
            "A monster.",
            "A tragedy."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "An annoyance.",
            "Spider, stop rambing."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "I am being watched",
            "Watched by a being who would never dare to learn my name",
            "Watched by a being who has never known me.",
            "Who has never seen me."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "You talk.",
            "Alot."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I AM FORLORN!"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Gods above."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "Stop staring at me, Spider."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Do you see me?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "unfortunately, yes."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Can I touch you?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "No."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Can i see you?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "No."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "May I hold you?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "No."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Must you be so cold?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Must you be so annoying?",
            "Leave."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "low",
      "needs": "wall",
      "turns": [
        {
          "god": "art",
          "chunks": [
            "Your champion is covered in...",
            "marks.",
            "Explain?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "They are loved."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Love them less.",
            "They have work to do."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "low",
      "needs": "wall",
      "turns": [
        {
          "god": "art",
          "chunks": [
            "You would do well to focus less on your champion.",
            "They must learn to fight on their own.",
            "When darkness breaks, you will not be there to save them."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I will always be there to save them.",
            "Always.",
            "Always.",
            "Always."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "low",
      "needs": "art",
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "Matriarch, your champion looks so alone.",
            "I can give them—"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Do not touch them."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "low",
      "needs": "art",
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "Matriarch, I can assist your champion.",
            "I can help.",
            "just let me..."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "No."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "med",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "Spider, You must focus less on the past.",
            "Focus on the future."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I don't have a future.",
            "Not here.",
            "Not up here."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Where do you belong then?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Below.",
            "With the dark.",
            "Where I belong."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "...",
            "Must you fight me so."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "what?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Nothing.",
            "Carry on, Spider."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "med",
      "needs": null,
      "turns": [
        {
          "god": "art",
          "chunks": [
            "You stare at the darkness below.",
            "Why?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I feel a pull."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "A pull?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Like those below know me, greater than i know myself."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Whispers?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Yes.",
            "I hear them",
            "...",
            "Why do I hear them?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "They are...",
            "They are closer to us than i would admit."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Gods?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "No.",
            "No, not gods."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Family?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "I expect performance from you.",
            "Not idle chatter."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Understood, My Matriarch."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "WHY DO I HEAR THEM?",
            "THEIR SCREAMS?",
            "THEIR SORROWS?",
            "THEIR WORDS?",
            "Their sweet supple words.",
            "The fill my hear with hope.",
            "With belonging."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Because you looked too close."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Why?",
            "Why do they sound like me?!"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "...",
            "Mera, You are not meant to know."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "When will I?"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "I am not sure."
          ]
        }
      ]
    },
    {
      "pair": [
        "art",
        "wall"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "The voices.",
            "They scream",
            "They pull",
            "They want me down there",
            "The goddess.",
            "She years.",
            "She reaches",
            "She wants."
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Enough.",
            "Stop reaching"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Why?",
            "They need me?",
            "They need me below.",
            "They need—"
          ]
        },
        {
          "god": "art",
          "chunks": [
            "Please.",
            "Enough."
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "Spider!"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Goat!"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Spider!"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Goat!"
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "Hey Spidy!"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "My friend!",
            "How are you!"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "I am doing well.",
            "Building stuff!",
            "Burning Stuff!",
            "Industry, y'know!"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I am happy to see you well."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Well, as well can well!"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "What?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Well."
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So like uhm, ya ok?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Im fine, goat."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Are you sure?",
            "Ya seem kinda...",
            "down."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Just...",
            "solitude."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "You always have a friend me!"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I am sure.",
            "Thank you, Goat."
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "low",
      "needs": null,
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So..."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "yes?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "I wanted to ask.",
            "Why is your domain the closest to the goddess of death?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I am not sure.",
            "Perhaps it is my fate to sit lower than the others."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Lower?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Lower."
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "low",
      "needs": "wall",
      "turns": [
        {
          "god": "forge",
          "chunks": [
            "So like uh, your champion.",
            "They're covered in smooches.",
            "What's up with that?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "They are loved."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Well, ok.",
            "..."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Would you like to be loved to?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "YES!",
            "I mean.",
            "Nah, im good."
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "low",
      "needs": "wall",
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "Can we save them?",
            "Those forlorn souls?",
            "Saved from the abyss?",
            "Saved from our oppression?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Wha?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Can we save them goat?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Sure...?"
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "low",
      "needs": "forge",
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "I would like to request support from your champion, Goat."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Ya, I'll have 'em fix you up a burger.",
            "OI CHAMPION! BURGER TIME!"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "That is not what I mean.",
            "I wish you to just...",
            "support them as I do mine."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "I ain't kissin 'em"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "That is not what I—",
            "Stop snickering at me."
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "med",
      "needs": null,
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "Did you know me?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Depends, did you have eight legs before you were a god?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I do not believe so."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Ah, well prolly not.",
            "'less you were one of them scorpions i used to eat all the time."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "You eat scorpions?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Used to!",
            "Big word right there.",
            "Used to."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "That's...",
            "gross..."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Girl you are the god of spiders",
            "I do not want to be called gross from you."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I am sorry for intruding.",
            "I shall take my leave."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "WAIT!",
            "I didn't..."
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "med",
      "needs": null,
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "I feel your distance from me.",
            "I wish for you to come closer."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "I would.",
            "really.",
            "Trust me.",
            "But like...",
            "your chambers are mess.",
            "And there are webs everywhere.",
            "Last time i went in there I got webs on my good hat."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Im sorry."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "No, I...."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I overstepped once again"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Spidy, c'mon.",
            "You know I love you.",
            "...",
            "Just not enough to visit your room",
            "Or be kissed",
            "Or held.",
            "Or like touched."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I see."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "But I love ya."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "...",
            "I understand."
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "I wish you'd understand.",
            "My pain.",
            "My suffering",
            "Not knowing who I am",
            "Not knowing what I am",
            "Not knowing where I am",
            "not knowing—"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "This might be a bit above my paygrade..."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "YOU NEVER UNDERSTOOD!"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Wait, Spidy.",
            "C'mon.",
            "Don't do this"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "YOU WILL NEVER UNDERSTAND THAT I...",
            "I am so lonely.",
            "No one understands me",
            "No one talks to me",
            "No one wants to be my friend"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Uh..."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "YOU!",
            "you hate me as they do",
            "Don't you?",
            "Goat?"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "I..."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "It's fine.",
            "I understand.",
            "Really.",
            "it's ok.",
            "I still love you.",
            "As a friend."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Did you have to include that last bit in there?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Yes.",
            "You have issues.",
            "And I do not want a misunderstanding."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Uh...",
            "Ok."
          ]
        }
      ]
    },
    {
      "pair": [
        "forge",
        "wall"
      ],
      "tier": "high",
      "needs": null,
      "turns": [
        {
          "god": "wall",
          "chunks": [
            "Goat."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Spider?"
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I have a present for you."
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "OH!",
            "That's...",
            "That's a decapitated head."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "Yes!",
            "Present!"
          ]
        },
        {
          "god": "forge",
          "chunks": [
            "Uh... thanks."
          ]
        },
        {
          "god": "wall",
          "chunks": [
            "I love you as a friend!"
          ]
        }
      ]
    }
  ]

  VELDORA.bickerScenes = {
    all: function () { return SCENES },
    count: function () { return SCENES.length },
  }
})();
