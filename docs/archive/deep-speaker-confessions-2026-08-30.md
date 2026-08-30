# ARCHIVE — the deep-speaker confessions, retired 2026-08-30

> **STATUS: HISTORICAL — retired content, kept because it is Ethan's writing.**
> Ethan, 2026-08-30: *"so we remove deep speaker confession."*
>
> The confession was a staged, phase-gated cutscene the deep speaker opened at depth —
> three stages, gated on world phase AND trust, rolled on a 60s sweep. It is removed
> along with its machinery in the same commit; the words are here so nothing he wrote
> is lost to a design change.

⚠️ **This is not a spec.** Nothing reads this file. It exists so the writing can be
recovered or reused if the confession ever returns in another shape.

## blade's confession (was `deep_speaker.js:149`)

```js
    // Three cutscenes, one per descent, in order. She is a character who cannot
    // finish a sentence, so being stopped three times mid-thought makes the FORM
    // match the writing.
    //
    // 🔴🔴 SHE MAY BE KAYER. OPEN QUESTION, 2026-08-23 - docs/60 §2. NOT A CHANGE, AND
    // NOT ONE LINE OF ETHAN'S TEXT BELOW HAS BEEN TOUCHED. Read against the book canon,
    // every stanza fits the Matriarch:
    //
    //   "I had to make a choice"        she sees the whole future and chooses it anyway
    //   "He was one of us. Our family."  Gregor KAYER Court - she named and bound him,
    //                                    and he left the Court for the Church
    //   "someone I was meant to protect, but I was too weak"
    //                                    canon: KAYER kills him, by cutting him off
    //                                    from the link
    //   "rescue my goddess from that church"
    //                                    her entire war is "because the church took Alice"
    //   "Blinded by faith."             ⭐ the dark shepherd. This fits nothing else.
    //
    // ⚠️ THE COUNTER-CASE IS REAL AND IS WHY THIS IS A COMMENT, NOT AN EDIT: the header
    // above says of the Speaker "grey. She is not a god", and Kayer already has her own
    // entry in this file (death_matriarch, for art). Whoever rules on it should read
    // docs/60 §2 first - and either way these lines stay exactly as written.
    confession: [
      [
        'When you get up there... Tell your god I... Tell him I\'m sorry. For everything I did.',
        'I didn\'t want to. But I had to make a choice.',
        'He chose the wrong path. He was one of us. Our family. But he...',
        'I never meant it to end like this.',
      ],
      [
        'He was... He was someone I was meant to protect, but I was too weak.',
        'None of this, none of what happened was his fault.',
        'It was mine.',
      ],
      [
        'I was too focused on the mission.',
        'I had to rescue my goddess from that church to see what I was really doing.',
        'I was destroying us.',
        'Blinded by faith.',
        '',
        '',
        'Gregor, I am sorry.',
      ],
    ],
```

## wall's confession (was `deep_speaker.js:260`)

```js
    // ⭐ Ethan's six stanzas, grouped into THREE cutscenes so the last one ends on
    // the name. Blade's champion is asked to carry an apology to a god; Wall's
    // champion is asked to carry a sentence to one.
    confession: [
      [
        'You have come deep. Deep enough that I cannot justify hiding the truth.',
        'You won\'t find me down here. It is no fault of your own.',
        'You are fighting against the entire world, after all.',
        'Truly a shame.',
        '',
        'For centuries I have walked this earth.',
        'I was mortal, like you. Once.',
        'Like the gods themselves, I was forced to ascend.',
        'But unlike them? I was forced down here.',
      ],
      [
        'In truth, how the world is, is my fault.',
        'Centuries ago I built a machine.',
        'I thought I could harness the energy between dimensions.',
        'See, I lost my family in ascension. Each one becoming gods themselves.',
        'But gods are not so easily brought back.',
        '',
        'The rift tore the world apart. My family lost forever.',
        'I was hunted like a criminal.',
        'Guilty.',
      ],
      [
        'The gods above want me dead. Yea.',
        'I want me dead too.',
        'But the thing about being a god?',
        'About being the god of death?',
        'You are banished from your own domain.',
        '',
        'Tell Mera that... Tell her...',
        '*You take a breath in anticipation.',
        '',
        'Tell Mera that it\'s her time.',
      ],
    ],
```

## salvage's confession (was `deep_speaker.js:357`)

```js
    confession: [
      [
        'I did my best.',
        'That wolf, before she ascended... I was her keeper.',
        'Well, a keeper of all our people. But her? I knew her name.',
      ],
      [
        "I was the one who named her.",
        "She didn't have one before me, and it was my job.",
        "But then she left. She left to find a new life away from us.",
      ],
      [
        "And that was ok, because it was her choice.",
        "I just wish I could've done more.",
        '',
        "Maybe I'm just weak. I've known that for a long time.",
      ],
    ],
```

## forge's confession (was `deep_speaker.js:582`)

```js
    // ═════════════════════════════════════════════════════════════════════════
    // 🚨 THE CONFESSION. Three staged cutscenes, phase-gated, one per descent.
    //
    // ⚠️ THIS IS THE MOST REWRITE-WORTHY THING IN THE REPO. The EVENTS are Ethan's,
    // verbatim from docs/56 §0 - she begged, Alice did not know how, it took
    // centuries, Alice made a choice the night before, and the ritual collapsed. The
    // WORDING is mine and it should not survive contact with him. Blade's equivalent
    // is his own writing and it is the best text in the game; this is a placeholder
    // holding the mechanic open, nothing more.
    //
    // ⭐ THE SHAPE IS DELIBERATELY BLADE'S: three stanzas, and the name lands as the
    // last words of the last one. "Gregor, I am sorry." / "Milantros. I am sorry."
    // ═════════════════════════════════════════════════════════════════════════
    // [CLAUDE-DRAFT] shadow/confession
    // 🔴 REWRITTEN after the book dump (docs/56 §0b). The first draft had her as the
    // one who ASKED for Milantros. She is her MOTHER - she found her standing in a
    // village that had been burned with a letter D left in the tracks, Momma Pille
    // insisted on keeping her, and Caebrim raised her and put a silver rifle in her
    // hands. Stanza 2 is now built on Ethan's own beat, which he wrote for the Ank
    // book and which is the single best thing either character has:
    //     "you called me ugly and tripped"
    confession: [
      [
        'You are the first one of hers to come this far down.',
        'I did not expect that to matter to me. It does.',
        'Go back up. Not because it is dangerous. Because I would like to be able to look forward to it.',
      ],
      [
        'I found her in a village that had been put to the torch. There was a letter carved in the mud and she was the only thing still standing in it.',
        'Pille said we were keeping her. I did not argue. It is the one thing I have never once regretted not arguing about.',
        'She called me Uggo. Tripped straight over her own feet doing it, flat on her face, got up and did it again.',
        'That is the first thing she ever said to me and I have had four hundred years to think about it.',
      ],
      [
        'So when she died I went to the only person I have ever begged for anything, and I begged.',
        'It took her centuries. She never once told me it could not be done.',
        'The night before, she made a choice. I do not know what it cost and she would never have said.',
        'And it worked. That is the part nobody believes - it WORKED. She woke up new and she looked right at me.',
        'And then the whole of it came apart, and I watched her go straight up through the ceiling.',
        '',
        'She does not remember any of it. She is happy. I have decided that is enough.',
        '',
        'Milantros. I am sorry.',
      ],
    ],
```
