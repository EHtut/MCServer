# Wall — dialogue

> ⭐ **THIS IS YOURS TO WRITE IN.** Edit the lines, add lines, delete lines, rename tags,
> add whole new tags. When you hand it back, `python tools/dialogue_doc.py check wall`
> reports exactly what changed against what the game currently has.
>
> Generated 2026-08-30 11:10 from `pack/kubejs/server_scripts/wall_voice.js` by RUNNING it, so every line
> below is a line the game actually registers.

## How to read the two kinds

**WHOLE LINES** — a pool of complete lines. One is picked at random.

**FRAGMENTS** — `opens` and `closes`, drawn from the same tag and joined with a space.
⚠️ **Any open must read correctly against ANY close in the same tag.** That is the one
rule the engine cannot check for you: with 60 opens and 68 closes a tag makes
624 different lines, and every one of them has to work.

## The format, if you add anything

```
## tag_name  (whole)
- a complete line
- another complete line

## tag_name  (fragments)
### opens
- the first half.
### closes
- the second half.
```

---

**187 whole lines** across 38 tags · **128 fragments** across 7 tags, making **624** possible combined lines.

---

# Whole lines

## argue_accuse  (whole)

- Your champion keeps hurting mine, they keep murdering mine!
- Do you know what they look like when they come back? Do you ever look?
- I put that one back together four times. Four.
- You let yours do this. You could have called them off and you did not.

## argue_answer  (whole)

- Mine has never touched yours. Mine stays home.
- You say that as though I started it.
- I do not send them anywhere. That is the difference between us.

## argue_refuse  (whole)

- No. Not this time.
- You may have that opinion. You may not have my champion.
- I am not going to argue with you. I am going to do something about it.

## argue_threat  (whole)

- You will regret your words, warrior.
- Then I will stop asking, and you will not enjoy what comes after.
- I have been very patient. Ask anyone who is left.

## argue_unanswered  (whole)

- Nothing. It never answers. It just watches them bleed and calls it weather.
- Say something. Say anything. ...No. Of course not.
- It does not even look up. That is what you are all like, underneath.

## combat  (whole)

- Behind you. Always behind you, love.
- Do not let it touch you.
- Kill it. Kill it and come back.
- I cannot reach you in there. Hurry.

## contract_ask  (whole)

- {target} is in your way. I can feel you stopping when they are near.
- You are not growing, love, and I think I know why. I think it is {target}.
- Say yes and I will not ask again for a while. {target}. Only that.
- I want you bigger than you are. {target} is what is between.
- It would be quick. I am not asking you to enjoy it, I am asking you to do it.
- {target}. Please. I have been so patient about this.

## contract_done  (whole)

- There. Do you feel it? You should feel it.
- Good. Good. That is one less thing standing between you and the rest of it.
- I knew you would. I did not doubt it, not once, not really.
- You are bigger than you were this morning.
- Thank you. I do not say that enough and I should.

## contract_lapsed  (whole)

- You did not. That is all right. I will hold it for you.
- It is fine. It is - no, it is fine. There will be another.
- I am not upset. I want you to know that I am not upset.

## dark_hit  (whole)

- Do not look. It is easier if you do not look.
- There. Now you cannot see how many of us there are.
- I am still here. I am always still here.
- Close them. It is the same either way.
- You do not need those for this part.
- Shh. It is dark for me too, most of the time.

## guidance  (whole)

- Chalk first, love. A shape on the floor, drawn exactly, or nothing comes.
- The shape is the whole of it. One line wrong and you have drawn nothing at all.
- Stand something at each corner and speak. The first thing that answers will be small. Let it be small.
- Small ones first. The ones worth having will not come for a beginner's chalk.
- Bind one into a book and it is yours to call again. Loose ones belong to nobody.
- The dead carry a kind of power in them. Take it before it goes out.
- That power is the currency down here. Everything I can teach you is bought with it.
- A rod is only a rod until you seat something in it. Then it speaks.
- What you seat in it decides what it says. Collect them.
- Raise them, keep them, feed them. Every one that stands is one more of us.
- Do not let them die, love. I feel every one.

## harvest_lost  (whole)

- *You awaken. Your body is deeply warm, like something held you and only recently let go.
- You're awake. It was a very, very bad dream.
- It won't happen again.
- Come. We have things to do.

## harvest_won  (whole)

- You fought them off. I...
- I guess this is the end. I didn't want it to end like this.
- I had no choice.
- Not really.
- You are ready.

## high_hostile  (whole)

- You will never be a part of us.
- You. Die.
- I cannot let you live. You may be a champion but you are a monster.
- Worse than him...
- Do not run. It is not that kind of thing.
- I gave them everything. What did your god give you?
- Stand still. This is not for you to understand.

## high_silence  (whole)

- I have never made a good choice in my life. This is the first.
- Do you know what led me to you? It was knowing that you were the one.
- My goddess... Mother. Perhaps you will be the one...
- I have never known companionship until now. Thank you.
- A union. Mother, we are coming.
- Alice... That name feels... Familiar.
- There is no version of this where I let you go.
- I would burn the other four for one more hour of this.

## hold_food  (whole)

- Eat. All of it.
- You forget. I do not.

## hold_weapon  (whole)

- Good. Keep it drawn.
- That will do. It does not have to be beautiful.

## loc_above  (whole)

- The gods have never understood us.
- This land was once beautiful. Now? It is a playground for forces that should not belong.
- There is but one god. And it is not the matriarch. It is not me.
- Can you feel the grass beneath your feet? I have. Once.
- Perhaps one day...
- Stand there a moment longer. The light suits you.
- They are watching us. Let them.

## loc_below  (whole)

- Be safe. Please.
- There are things down here. Things that shouldn't be.
- Lead from the back, love.
- The dead walk these realms. We are not so dissimilar.
- It is colder here. I do not know why I can tell.
- Do not go deeper than I can follow.

## low_gift  (whole)

- Heal, love. Heal.
- Eat and feast, you need your strength.
- Let me in, I can assist.
- I will stand by your side. Always.
- Take it. I have no one else to give it to.
- You are hurt. I felt it before you did.
- I made this for you. I have had a long time to learn.
- Do not thank me. Just keep it close.

## low_silence  (whole)

- You are growing well.
- Like a flower in a sunlit field.
- They will never understand what we are. What we need. Throw them away.
- The champions of the other gods are but insects compared to us.
- Good. Good. Again.
- I knew. Before you did, I knew.

## medium_gift  (whole)

- Stay safe. Please.
- Our work isn't done. It will never be done.
- Rest. I will keep watch. I do not sleep.
- Closer. You can stand closer than that.
- I have been alone a very long time. You should know that about me.

## medium_hostile  (whole)

- They dare. They Dare.
- We need to hurt them. They need to be hurt. Please.
- Say the word. Only the word. I will do the rest.
- They walked past you as though you were furniture.
- I am not angry. I am not. I am not.
- You do not have to watch. Just do not stop me.

## medium_silence  (whole)

- The family grows. Hearth and home.
- Let us rest tonight, there is more work to do in the morning.
- I can feel your power growing, perhaps... perhaps it is enough to hurt them. To make them suffer.
- Let our people grow in the light so we may save those in the dark.
- Every one you raise is one more that cannot leave. Is that not lovely?
- You are becoming something. I would like to be there when you finish.

## near_art  (whole)

- Hers. The Matriarch's.
- Do not fall asleep near that one.
- Ask them if the court has a door. Watch their face.

## near_blade  (whole)

- His champion. Do not let them stand behind you.
- You can walk away from them. You can. Look at me.
- The Warrior's. Of course it is.
- Be polite. Be brief. Come back.

## near_forge  (whole)

- The Goat's. That one is safe enough.
- They build things. I have never minded builders.
- Ask them for something. They like being asked.

## near_salvage  (whole)

- The Wolf's. Whatever they offer you, no.
- Count your things after they leave.
- They cannot help it. She chose them for that.

## near_wall  (whole)

- Another of mine. Oh.
- You are not the only one. You are still the one.
- Be kind to them. They are family, in a way.

## quiet  (whole)

- I do not think I am catching any of them.
- It has been a very long time.
- I cannot remember the last one I reached in time.
- Sometimes I think they are not falling. I think they are being pushed.
- I do not know how to stop.
- You would tell me. If it were not working. You would tell me.

## rare_loc_above  (whole)

- I... I can't help but feel...
- A kinship. One with the dead.
- There were once gods... now? Now we are shadows.
- The goddess of death walks this realm alongside her three generals.
- I carried a light once. It is not mine any more.
- My father was a soldier. I am told. I was not there.
- Something in me broke open. It had been waiting my whole life.
- I was somebody's daughter. That is the part nobody kept.

## rare_loc_below  (whole)

- She is down here. I can feel the shape of her.
- I do not come this deep. I am not welcome this deep.
- The failed things down here were somebody's work. Somebody careful.
- If she speaks to you... do not believe all of it.

## returned  (whole)

- You are back!
- I missed you.
- The realm barely changed in your absence, as did I.
- I did not move. I want you to know that I did not move.
- How long was that? Do not tell me.

## snare_hit  (whole)

- Stay. Just for a moment, stay.
- There. Now you are easier to hold.
- I am not hurting you. I am holding you. There is a difference and you will feel it.
- Slower. Slower. That is better, that is - there.
- You were going somewhere. You are not, now.
- It does not hurt, love. It only stops.

## swarm_hit  (whole)

- All of them. I am sorry, I am - all of them.
- I asked nicely. I did ask.
- There are nine. I counted. I always count.
- Do not fight it. It takes longer that way and I do not want it to take longer.
- This is the last time we do this. I keep saying that.
- I would rather you sat down.

## warn_incoming  (whole)

- The champion of {rival} comes for you. Run!
- I will hold them off, you get to safety.
- They will regret what they have sown.

## warn_wave  (whole)

- Something is awake down there and it has noticed you.
- Get your back to a wall. Please. Now.
- They are coming. I cannot stop this one.
- Do not run deeper. Whatever you do, not deeper.

## web_hit  (whole)

- They have been waiting to meet you.
- Do not hurt them. They are only doing what I asked.
- Five. That is not many. I could have asked for more.
- They are mine and they are gentle and they are coming.
- You will not be alone. I would not do that to anyone.
- Be kind to them. They are very young.

---

# Fragments

## art  (fragments)

*6 x 8 = 48 lines*

### opens

- The Matriarch has led us gods for centuries.
- In all that time she has never granted me a place amongst them.
- What did I do wrong?
- I was not invited. I was never invited.
- She calls it a court. A court has a door.
- The Dreamwalker decides who counts. She always has.

### closes

- I stopped asking a long time ago.
- You would have said yes. I know you would.
- It does not matter. It does not.
- Do not sleep where she can find you.
- She has never once said my name.
- I am not asking for your sympathy. I am telling you.
- We do not need a court. We have a family.
- Let her keep it.

## blade  (fragments)

*6 x 8 = 48 lines*

### opens

- The Warrior is a plight on this land.
- He preaches strength and speed yet hides behind his veil.
- He speaks of champions. He has buried more than he has kept.
- The Warrior was somebody's soldier once. He does not say whose.
- Ask him about the veil. Watch him change the subject.
- He calls himself the Golden God. Gold is soft, love.

### closes

- He will not say it to my face.
- I knew him before the name.
- Do not take anything he offers you.
- He is not wrong about everything. Only about me.
- There is nothing behind it. I have looked.
- He would have made a good father to somebody.
- Let him have the sun. I have you.
- I am not jealous. I am not.

## forge  (fragments)

*6 x 8 = 48 lines*

### opens

- I have known the Goat for centuries.
- Centuries before he was what he was before. Across all transformations.
- He loved the goddess of death. Now? Now he's a shell.
- The Goat builds because he cannot sit still with himself.
- There is nothing left in him to talk to. I have tried.
- He was kind, before. That is the part people forget.

### closes

- Grief does that. I know what it does.
- Do not pity him where he can hear you.
- He will not remember this conversation either.
- Take what he makes. It is honest work.
- That could happen to anyone. It could happen to me.
- I would not let it happen to you.
- He does not know he is gone.
- Leave him to it, love.

## idling  (fragments)

*12 x 12 = 144 lines*

### opens

- I am still here.
- You have not said anything for a while.
- I was thinking about you. I am usually thinking about you.
- The light is going. I like this part.
- Do you ever wonder what I look like?
- It is quiet where I am.
- I counted. It has been four days since you rested properly.
- There is a spider in the corner of wherever you are. That is not me. Probably.
- I do not need anything. I want to be clear about that.
- Say something. Anything is fine.
- You breathe differently when you are worried.
- I have been alone for a very long time and then you happened.

### closes

- That is all.
- Do not mind me.
- I will stop now.
- You do not have to answer.
- It is nice, this.
- I am not going anywhere.
- Take your time.
- Sorry. Go on.
- I like the sound of you moving about.
- Stay a moment longer.
- Anyway.
- I will be quiet now. I will try.

## lore  (fragments)

*12 x 12 = 144 lines*

### opens

- This land is an old one. A nameless one.
- The gods have never understood us.
- There were once gods. Now we are shadows.
- The church came first. Then your gods. Then the quiet.
- Everything here was somebody's home, once.
- Five of us hold what is left, and not one of us agreed to it.
- The world broke long before you arrived in it.
- Champions have knelt on this ground for a thousand years.
- The dead outnumber the living here, and they are better company.
- Nobody chose to be what they are. Not one of us.
- There is a rift under everything. You can feel it if you stand still.
- This place remembers more than it forgives.

### closes

- I have had a long time to think about it.
- Stay close while I tell you.
- You are the first person I have said that to.
- Do not repeat it to them.
- It does not matter now. You are here.
- I would rather talk about you.
- None of that reaches us. Not here.
- I stopped counting the years somewhere in the middle.
- You will understand it eventually. I am patient.
- It is only sad if you were there.
- That is enough of that.
- Come closer, love.

## push  (fragments)

*12 x 12 = 144 lines*

### opens

- You are growing. Good.
- I can feel your trepidation. Descend, champion.
- Grow, love. Hone yourself against what threatens us.
- There is more of you than there was last week.
- Do not stop. Not now, not when it is working.
- The others are getting stronger too. I watch them.
- You are close to something. I can feel it from here.
- Keep going. I will be here when you turn around.
- I need you to be strong. I am sorry, but I do.
- You have been careful. Be a little less careful.
- Every day you get better and every day I get worse at waiting.
- Go on. I am watching.

### closes

- Please.
- For me.
- Do not get hurt doing it.
- I will be right here.
- Come back and tell me about it.
- That is all I ask. It is not much.
- You are doing so well.
- I would do it myself if I could reach.
- Do not make me wait long.
- Stay whole.
- I mean it kindly.
- Then rest. Then again.

## salvage  (fragments)

*6 x 8 = 48 lines*

### opens

- I do not trust the Wolf in any manner.
- Perhaps once she was tolerable. Once.
- She will offer you a fair deal. That is how you will know.
- The Wolf keeps her promises. That is the trap, not the comfort.
- She has never once asked for something she needed.
- Everything she gives you, she has already priced.

### closes

- Say no. For me.
- I would take it back from her if you asked.
- She has nobody. She earned that.
- You do not need her. You have me.
- Do not be alone in a room with her.
- I am telling you because I want you safe.
- She smiles at everyone. Notice that.
- Promise me.

