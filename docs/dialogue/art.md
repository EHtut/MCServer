# Art — dialogue

> ⭐ **THIS IS YOURS TO WRITE IN.** Edit lines, add lines, delete lines, rename tags,
> add whole new tags. When you hand it back, `python tools/dialogue_doc.py check art`
> reports exactly what changed against what the game currently has. A plain text file
> back is fine too.
>
> Generated 2026-08-30 11:29 from `pack/kubejs/server_scripts/art_voice.js` by RUNNING it, so every line
> below is one the game actually registers.

## How this is organised

⭐ **Grouped by the SYSTEM that fires each pool**, not alphabetically — you should not
have to read the scripts to know whether you are writing a threat or an idle aside.

**WHOLE** — a pool of complete lines; one is picked at random.

**FRAGMENTS** — `opens` and `closes` from the same tag, joined with a space.
⚠️ **Any open must read against ANY close in the same tag.** That is the one rule the
engine cannot check for you.

## The format, if you add anything

```
## tag_name  (whole)
- a complete line

## tag_name  (fragments)
### opens
- the first half.
### closes
- the second half.
```

---

**107 whole lines** across 23 tags · **0 fragment tags** making **0** combined lines · **6 systems**.

---

# art_events.js

*also referenced in `blade_events.js`, `blade_voice.js`, `idle.js`, `salvage_events.js`, `voice.js`, `wall_events.js`*

*7 tag(s)*

## contract_offer  (whole)

- {target} is in my way. I would move them myself. You know why I cannot.
- Kill {target}. I am asking, which is more courtesy than the request deserves.
- There is a name I want removed. {target}. Three days.
- {target}. Before the week turns. I will not explain and you will not ask.

## guidance  (whole)

- Source pools do not fill themselves. Go dig some.
- You will not find glyphs standing here. Walk.
- Go west. I am not going to explain how I know that.
- A ritual needs a circle. A circle needs work. Go do it.
- There is nothing left to learn from me today. Leave.
- Archwood does not grow near me. That should tell you something.
- Every apprentice thinks the answer is closer than it is. I have watched a great many of them be wrong about it.
- Go further out. The easy sources are already spent.
- You will come back here in four days having done none of this. Prove me wrong. You will not.

## harvest_lost  (whole)

- You failed. I'm not surprised, and I'm not disappointed. Disappointment requires expectation.
- That's that, then. I'm not replacing you. I'd have to explain everything again.
- Some fail quietly. You didn't even manage that.

## harvest_won  (whole)

- You passed. I did not expect that, and I do not enjoy being wrong.
- That was almost adequate. Almost is new, for you.
- The trial is behind you. What comes next is worse.

## high_silence  (whole)

- I already know how this goes. Saying it would only slow you down.
- Nothing to say. Everything to see. Those are not the same and I have both.
- I watched this a long time ago. Go on.
- There is nothing you can do in front of me that I have not already had time to get bored of.
- I don't need to speak to know what you did. Or what you are going to.

## low_silence  (whole)

- Nothing.
- I have nothing for you yet. Come back when that changes.
- You haven't done enough to warrant words.
- Speak to someone who cares what you did today. Not me.

## medium_gift  (whole)

- You did something correct. This is the reward for that, not for you.
- Better work earns better tools. Simple arithmetic.
- You've stopped being useless. This reflects that, narrowly.
- Consider this a raised ceiling, not a compliment.
- You are further in than you were. People do not usually notice that happening.

---

# coefficients.js

*also referenced in `idle.js`*

*1 tag(s)*

## combat  (whole)

- Don't die. It's inconvenient for me.
- I have already seen how this ends. Get there.
- You will step left. You always step left. Do it faster this time.
- Efficient. Barely.
- I am not worried. I am incapable of being worried. Try to find that comforting.

---

# idle.js

> unprompted, on a 60s roll, chosen by CONTEXT - what you hold, where you are, combat, a champion nearby. A god with no pool for the chosen context says NOTHING rather than falling back to something generic

*1 tag(s)*

## loc_above  (whole)

- Nothing is happening. That is usually preferable.
- The sky is doing what it does. So am I.
- Stand there if you like. It changes nothing.
- This place is quiet. I prefer it that way.
- I have no orders for you. Find your own use.

---

# patron_sound.js

*1 tag(s)*

## cut_down  (whole)

- You got too good at this. I don't reward that. I end it.
- This was never going to end with you retiring somewhere warm. You knew that. I know you knew that.
- You were the closest thing I've had to a hand of my own. That's exactly the problem.
- No speech. No last lesson. You already learned the one that mattered: everything I lend, I take back.
- Hold still. I've done this before, and it goes faster when you don't fight it.
- I raised something of my own once. It worked. I am the only one who remembers his name.

---

# salvage_events.js

*also referenced in `wall_events.js`*

*1 tag(s)*

## low_gift  (whole)

- Take it. Try not to lose it in the first hour.
- A starting tool. Everyone gets one. Few keep it long.
- This costs me nothing to give. Remember that.
- Small hands need small things. Here.
- You are not one of mine yet. This is what not-yet gets.

---

# wall_events.js

*1 tag(s)*

## returned  (whole)

- You went somewhere. Nothing here noticed.
- Back. Fine.
- I didn't wonder where you went. Don't mistake this for that.
- Time passed. You're still adequate. Barely.

---

# Reached by a computed tag

> The trigger builds the tag at runtime, so it is chosen in code rather than named as a literal. These are live.

*demand_art - from `art_events.js` (`'demand_' + (tp || 'blade')`)*

## demand_art  (whole)

- You are mine already, so I will skip the part where I persuade you.
- Two of you. I had not planned for two of you. Do this anyway.
- Do not mistake being asked for being favoured. The other one is not being asked.

*demand_blade - from `art_events.js` (`'demand_' + (tp || 'blade')`)*

## demand_blade  (whole)

- You don't answer to me. Answer anyway. It's faster.
- Your god learned everything he knows about obedience somewhere. Consider where.
- Your god isn't here. I am. Draw your own conclusions.
- I asked. That was the courtesy. There isn't a second one.
- Blade's champion, doing Blade's work, standing in front of me. Interesting choices.

*demand_forge - from `art_events.js` (`'demand_' + (tp || 'blade')`)*

## demand_forge  (whole)

- You follow the Goat. I am going to need you to be useful in spite of that.
- She would tell you not to. She tells everyone not to, at length, and then does nothing.
- One task. Do not report it to her. She could not keep it to herself if she tried.
- Of all of them, hers. Fine. Listen carefully, I will only say this once.

*demand_salvage - from `art_events.js` (`'demand_' + (tp || 'blade')`)*

## demand_salvage  (whole)

- Salvage would tell you this is a bad trade. She'd be right. Do it anyway.
- You work for the honest one. I'm not going to pretend I am. Do it regardless.
- One task. She'd have told you the price first. I won't.
- Salvage's champion. Tell her I said hello. Tell her nothing else.

*demand_wall - from `art_events.js` (`'demand_' + (tp || 'blade')`)*

## demand_wall  (whole)

- You belong to Wall. That's not an argument, it's a fact I'm setting aside.
- She isn't watching right now. I am. Use the difference.
- I don't need you to be loyal. I need you to be useful for one minute.
- Wall's champion. I'll keep this brief, for both our sakes.
- Of all of them, hers. Fine. Stand there and let me get through this.

*high_gift - from `art_events.js` (`tier + '_gift'`), `blade_events.js` (`tier === 'high' ? 'high_test' : (tier === 'medium' ? 'medium_test' : '`), `blade_voice.js` (`t + (t === 'high' ? '_test' : '_gift')`), `forge_events.js` (`tier + '_gift'`)*

## high_gift  (whole)

- This is more than I give most. Note the word most.
- You are becoming difficult to replace. I am already thinking about that.
- Few champions reach this. Fewer enjoy what comes after.
- Take it. You've earned the attention, which is worse than earning nothing.
- You are mine now. I do not say that warmly and I do not take it back.

*near_blade - from `art_events.js` (`'demand_' + (tp || 'blade')`)*

## near_blade  (whole)

- Blade thinks strength has to come from your own arm. Naive, but I understand the appeal.
- He defers to me and he has never once asked himself why. I would rather he didn't start.
- He'll tell you my gifts make you weaker. He's wrong about most things.
- Ask him why he still needs a champion, if his own arm is so sufficient.

*rare_loc_above - from `idle.js` (`'rare_' + tag`)*

## rare_loc_above  (whole)

- I had hands once. Warm ones. I don't discuss the rest.
- Ice meant something simpler, before. That is the entire story and you have had all of it.
- You are waiting for me to continue. I have noticed. I am not going to.
- There was a before. There is no version of this where I describe it to you.

---

# ⚠️ No reference found - **not** proof these are dead

> Nothing anywhere names these in quotes. That is NOT the same as unused:
> several call sites build their tag at runtime (`'near_' + path`,
> `tier + '_gift'`, `entry.tag`), and a tag assembled from pieces cannot be
> found by searching for it.
>
> 🔴 An earlier version of this tool reported 14 pools as having no
> consumer, including every `argue_*` - all of them alive, named inside data
> structures in `grudge.js`. **Verify before deleting anything here.**

## near_forge  (whole)

- The Goat's. Of course it is.
- That one talks. Constantly. To everyone. It is not warmth, it is a lack of discipline.
- Ask your friend there what she thinks she is. Then ask who told her she could be it.
- I have nothing to say about the Goat. I have had four hundred years of nothing to say about the Goat.
- Whatever she called me, she was a child. That is the entire defence and I have heard it.

## near_salvage  (whole)

- Salvage will tell you the truth and then let you walk away from it. Unusual, for one of us.
- She's the only one who means it when she says you can go.
- Trade with her if you must. She won't lie to sweeten it.
- I have no quarrel with that one. Enjoy how rare that is.

## near_wall  (whole)

- Wall will love you the way she loves everything. Completely, and past the point you wanted it.
- That one was born into it. Some of us were assembled. I am told the difference does not matter.
- She grieves everyone before they're gone. Exhausting to watch. Worse to receive.
- Ask her sometime whose daughter she is. Ask her slowly. I want it to take a while.
- Don't let her hold on too long. She doesn't know how to stop.
- She inherited hers. Every single thing I have, I was given, and giving can be revoked.

