# Blade — dialogue

> ⭐ **THIS IS YOURS TO WRITE IN.** Edit the lines, add lines, delete lines, rename tags,
> add whole new tags. When you hand it back, `python tools/dialogue_doc.py check blade`
> reports exactly what changed against what the game currently has.
>
> Generated 2026-08-30 10:57 from `pack/kubejs/server_scripts/blade_voice.js` by RUNNING it, so every line
> below is a line the game actually registers.

## How to read the two kinds

**WHOLE LINES** — a pool of complete lines. One is picked at random.

**FRAGMENTS** — `opens` and `closes`, drawn from the same tag and joined with a space.
⚠️ **Any open must read correctly against ANY close in the same tag.** That is the one
rule the engine cannot check for you: with 64 opens and 64 closes a tag makes
616 different lines, and every one of them has to work.

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

**239 whole lines** across 47 tags · **128 fragments** across 7 tags, making **616** possible combined lines.

---

# Whole lines

## argue_accuse  (whole)

- Your champion has put mine in the dirt three times. I am beginning to take it personally.
- Call it off, or admit you enjoy this.
- You are wasting a good fighter on ambushes. That is what offends me.

## argue_answer  (whole)

- So? That means they were weak.
- Then it should not have died. I fail to see the complaint.
- You are describing a fight. I do not know what you want from me.

## argue_refuse  (whole)

- Then let me.
- I have been threatened by better and buried them.
- Do what you like. I will not pretend to be frightened.

## argue_threat  (whole)

- Do it again and I stop being polite about it.
- I will take it out of yours. Slowly, and where it can be seen.
- You have one more. Spend it carefully.

## argue_unanswered  (whole)

- Silence. From a god. What a waste of a throne.
- It says nothing, so it agrees with me. That is how I will take it.
- Answer me. ...No? Then I was right, and we are done.

## broken_rung  (whole)

- The thing that killed you brought company.
- It killed you once. Correct that.
- You fell to this. Do not fall twice.
- Three of them now. Learn faster.
- It is waiting where you left it. So am I.

## burden  (whole)

- Slow. Deal with it.
- Carry it.
- You do not get to leave this one.
- No. Stay where you are.

## contract_offer  (whole)

- {target} is still walking around. I would take it as a favour.
- Would you kill {target} for me. You may say no.
- {target}. I am asking, not ordering. The difference is yours to spend.
- I want {target} dead, and I am willing to ask for it.
- If you have the time: {target}. If not, say so and I will stop.

## contract_paid  (whole)

- Paid. I do not enjoy owing anyone.
- Take it. The asking cost me more than the coin did.
- Settled. We are even, which I prefer to grateful.

## duel  (whole)

- One of mine. No crowd, no help, no excuses.
- This one is not a wave. It is a single opponent, and it is better than you.
- Alone against one. That is the oldest test there is.

## duel_fled  (whole)

- You ran.
- You left the ground. I will remember that longer than you will.
- Noted. You had one opponent and chose distance.

## first_blood  (whole)

- The next thing you swing at, I am making harder.
- Pick your target carefully. I am about to improve it.
- Whatever you strike next will strike back properly.

## first_blood_hit  (whole)

- There. Now it is worth killing.
- Now finish what you started.
- Better. Deal with it.

## first_blood_late  (whole)

- You did not swing at anything. So I sent something to swing at you.
- A minute, and no fight in you. Here is one.
- You waited. Now you do not have to look.

## guidance  (whole)

- Learn one weapon until it is boring. Then learn what it does that the others cannot.
- Every weapon swings its own way. A man who carries five has mastered none.
- You can roll out of a blow. Learn where that is bound before you need it.
- Nothing above the treeline will ever be worth killing. Go down.
- Deeper corpses pay better. Descend, Champion.
- Armour is borrowed. A weapon in your hand is not. Carry your power where it cannot be raided.
- Two hands on it. Even that will not be enough yet.
- Do not let short sightedness blind you. Master every blade.

## harden  (whole)

- Harder to kill. Slower to kill. Now it lasts.
- I have made this take a while. Do not thank me.
- You will not win quickly. That is the point of it.
- Endure. Winning fast teaches you nothing worth keeping.
- Stand up longer than you want to.

## harvest_lost  (whole)

- Predictable.
- You are not yet ready.

## harvest_offer  (whole)

- You could stay. I would not ask twice.
- There is a place here if you want it. Go, if you do not.
- Stay, or go. Either is yours now. That is the whole point.

## harvest_open  (whole)

- It is time. I am sending the best thing I have.
- Everything until now was preparation. This is the test.
- One opponent. Mine. Now we find out.

## harvest_won  (whole)

- Predictable.
- I always knew I made the right choice.
- The goddess of death awaits below.
- Find her. End her.

## high_silence  (whole)

- Noted.
- That's not nothing.
- Few make it this far.
- I've stopped worrying about you.
- You didn't need me for that one.
- Keep that up and I'll run out of things to teach you.
- I don't say this often.
- You're becoming a problem for your enemies.
- I have seen worse stand where you are standing.
- That was competent. I will not say it twice.
- You are no longer the weakest thing I am watching.
- Hm.
- I would have done it differently. It worked anyway.
- There are fewer things above you than there were.
- You have stopped needing me to say anything.
- Good.

## high_test  (whole)

- Something worth your time, finally.
- Let's see what you're really made of.
- This might actually challenge you.
- I sent something dangerous. Good.
- Now we find your limit.
- This one could kill you. Good.
- Show me something I haven't seen.
- Finally, an opponent worth the name.
- Fly as high as you like. I'll be watching how you land.
- This is the kind of fight I remember.

## hollow  (whole)

- These carry nothing. Kill them anyway.
- There is no reward in this. Fight.
- Nothing drops from these. That was never the point.
- You will gain nothing here but the doing of it.
- No spoils. Only the work.

## icarus  (whole)

- For it was Icarus who flew too close to the sun. You will share his fate.
- You climbed. Of course you climbed.
- The sky was never yours. Come down, or be brought down.
- Height is a debt. They are here to collect it.
- Phaethon took the reins too. Look up.

## idling  (whole)

- Then no. It costs me nothing.
- Suit yourself. The offer was the whole of my interest.
- Noted. I will not ask twice in a row.
- You will want it later. I may be busy later.
- As you like. Standing still is also a choice.

## loc_above  (whole)

- The goddess below rules the underworld unchecked.
- You are growing. Good.
- I am not disappointed in your growth. There is still room to grow.
- I can feel your trepidation. Descend, champion.
- The Goat god and their champion are your path to sustenance. Lean on your allies.
- Be wary of the Wolf's deals, for one day she may offer you one. Deny her.
- The Matriarch has led the Court for centuries. Do not mistake authority for power.
- The spider. I despise that damnable god. She is but a step away from the evil we fight against.

## loc_below  (whole)

- The minions of death swarm.
- Be on your guard. You will be tested.
- I want this clean. No mistakes. No retreat.
- Grow, champion. Hone your blade against those who threaten our lands above.
- She was banished down here for a reason, the goddess of death. We will remind her why.

## low_gift  (whole)

- Take it. You're no use to me dead.
- Iron. Don't waste it standing still.
- This keeps you breathing. Use it well.
- Armour. Put it on before you bleed.
- You need this more than I need to give it.
- Take the blade. Earn the next one.
- Supplies. Spend them like they matter.
- You can't fight with empty hands. Here.
- This isn't strength. It's a chance to reach it.
- Gear up. I don't waste effort on corpses.

## low_push  (whole)

- Move. The fight won't come to you.
- Enough standing. Fight.
- Find something and kill it.
- You are wasting time, Champion.
- There's no strength in waiting. Go.
- Something out there needs killing. Find it.
- You don't grow standing still. Move.
- Get out there and bleed for it.
- Fight now. Rest when you've earned it.
- The only way through this is through it. Go.

## mark_declare  (whole)

- {target} fights with borrowed strength. Kill them within two days.
- Find {target}. End them before the sun sets twice.
- {target} serves a spider and calls it power. I want them dead.
- Two days. {target} does not see a third.
- Bring me {target}'s fall, not their excuses.
- {target} wears strength that is not theirs. Cut it off them.
- I despise {target}. You have two days to matter to me.
- Kill {target}. Do it before I forget I asked.

## mark_ignored  (whole)

- You did not kill them. Of course you did not.
- The days passed. So did my interest.
- I asked one thing. You gave me nothing.
- Fine. Let the spider keep her borrowed strength.
- I will not punish you. I will simply expect less.
- You failed to matter today. Try not to make it a habit.
- The moment passed you by, as most do.
- Forget it. I already have.

## mark_success  (whole)

- Dead. As it should be.
- Good. One less parasite wearing someone else's strength.
- You did what was needed. Nothing more needs saying.
- It is done. I expected nothing less.
- The spider's champion falls. Unremarkable, as intended.
- Good.
- That is one fewer borrowed sword in this world.
- Clean. I have no notes.
- She will feel that. Let her.

## medium_gift  (whole)

- Not much. You don't need much anymore.
- Small, but you've earned that much.
- Take it. You're closer to not needing me.
- This, and no more. You're managing well enough.
- A little help. You've been managing without it.
- This is less charity now, more habit.
- Here. Call it a formality.
- You need this less than you did. Take it anyway.
- Small gift. Don't get comfortable.
- This should cover what's left of your weakness.

## medium_test  (whole)

- This one's a test. Don't waste it.
- I'm watching this fight closely.
- Show me the last one wasn't luck.
- This is a measure, not a gift.
- I want to see how you handle this.
- Consider this an exam.
- Fight like I'm keeping score. I am.
- This is harder on purpose. Show me why.
- Let's see what you've actually learned.
- I'm paying attention now. Don't waste it.

## near_salvage  (whole)

- The emissary of the wolf. Do not trust them.
- That one deals before they draw. Watch which they reach for first.
- Their might is respectable. Their patron is noise.

## near_wall  (whole)

- The spider's underling. Keep distance from that one, lest they bore you.
- They fight with borrowed strength. Do not learn it from them.
- Mercy, dressed up as devotion. Walk on.

## rare_loc_above  (whole)

- This land is an old one. A nameless one.
- You have no memories of arrival. That is all right. Instead, focus on your blade.
- I had a name in life once. That was centuries ago.
- I am a prisoner here, like you. Know that we fight for the same cause.
- The Spider and her consort... they are the closest to my kind. I cannot help but feel attachment.
- What does the sun feel like on your skin? I barely remember.
- The Spider... Why can I hear her name?
- The goat, he has caused thousands of atrocities and yet he was deemed worthy of ascension.
- The Matriarch once led my kind. Once. Be wary of her champion.

## tithe  (whole)

- Your steel owes me. It will wear twice as fast until it has paid.
- A day of doubled wear. Fight anyway.
- Everything you swing is on loan. I am calling in the interest.

## tithe_over  (whole)

- Your steel is your own again.
- The debt is paid. Look after it better.
- Done. It held, or it did not.

## understudy  (whole)

- I made one of you. Let us see which is better.
- It has your health, your reach, your weapon. Nothing else.
- Fight yourself. Most champions lose.

## wager_declined  (whole)

- Then no.
- Fair. I asked.
- Another time, or not.

## wager_offer  (whole)

- One opponent. Strong. Yes or no.
- I have something worth fighting. Say the word or do not.
- There is a fight here if you want it. I will not offer twice.
- Something better than what you have been killing. Your call.

## wager_won  (whole)

- You killed it. Take the payment.
- Settled. That is all this is.
- Yours. I said it would pay, and it pays.
- Debt closed. Do not read anything into it.

## warn_incoming  (whole)

- A champion comes for you. Ensure you win.
- Seems a challenger approaches...
- A challenge, one you are fit for. Win.

## warn_wave  (whole)

- Something is coming up behind you. Good.
- Do you hear that? Stand where you are.
- Company. Earn the ground you are standing on.
- Here. Now we find out.

## watcher  (whole)

- I am going to stand here and watch. Do not mind me.
- I will not lift a hand. Everything else will lift two.
- Consider yourself observed. It will make the rest bolder.

## watcher_gone  (whole)

- Enough. I have seen what I came to see.
- I am done watching.
- That will do. For now.

---

# Fragments

## art  (fragments)

*6 x 6 = 36 lines*

### opens

- The Matriarch speaks little and rules the most.
- Her realm is magic. Her opinions are few.
- Her hand moves. She rarely does.
- She leads five gods and argues with none of them.
- The Matriarch's silence says more than her voice.
- Magic answers to her. Little else does.

### closes

- Simple, and I have no complaint with simple.
- That is the only obedience I have, and it is enough.
- I have nothing to say about that. Neither does she.
- Neutral is not the same as absent.
- She does not need my opinion of her.
- That is her business, not mine.

## forge  (fragments)

*8 x 8 = 64 lines*

### opens

- The Thief builds what your arm alone cannot.
- The engineer forges the war you fight.
- The Thief is tolerable. His work is not.
- No champion wins alone. The engineer sees to that.
- The forge burns for every battle you have yet to fight.
- The Thief demands cooperation, and he has earned the right to.
- His engines carry weight your sword cannot.
- The Thief builds glory. You still have to claim it.

### closes

- Respect that. Few of the five deserve it.
- Glory built alone is glory half-made.
- Work with him. That is not weakness.
- He is the engine. You are still the war.
- That much I do not dispute.
- Cooperation is not the same as dependence.
- Use it. Waste is the only sin here.
- He has earned that much from me.

## idling  (fragments)

*10 x 10 = 100 lines*

### opens

- You've been standing there a while.
- Nothing's died by your hand today.
- I don't see a fight near you.
- That's a long time doing nothing.
- The arena's empty because you're not in it.
- Your blade hasn't moved in a while.
- You're still here.
- Something should be dying right now.
- This is not what strength looks like.
- You've gone quiet for too long.

### closes

- Go waste it on something that fights back.
- Stillness won't make you stronger.
- I didn't equip you to watch.
- Find something worth killing.
- You're wasting what you've got.
- Move before I lose interest.
- Something out there is waiting to test you.
- Go earn something.
- Every idle moment is one you don't get back.
- Get moving.

## lore  (fragments)

*12 x 12 = 144 lines*

### opens

- This world was cursed before you were born.
- Five gods rule what is left of this place.
- Champions have kneeled on this ground for a thousand years.
- Every champion before you believed he was the last.
- This world has buried better than you.
- The gods do not agree on much.
- There were champions here before the curse had a name.
- The ground beneath you has swallowed a hundred like you.
- None of the five gods forgive.
- This world rewards nothing it has not first broken.
- The champions before you are dust now, all of them.
- The curse does not care whose fault it was.

### closes

- Their names did not survive the telling.
- That has never once been true.
- You are one more attempt among many.
- War is the only honest one among them.
- I was already old when it began.
- That does not make you interesting.
- The dust does not complain.
- You will learn this, or you will join them.
- That is the only mercy this place has ever offered.
- None of that concerns me.
- It has done worse to better champions.
- I have outlasted every one of them.

## push  (fragments)

*12 x 12 = 144 lines*

### opens

- Pick up the blade.
- Find something worth fighting.
- Strength does not arrive. You take it.
- Fight something. Anything.
- Bleed for it, or do not bother.
- Test yourself against something that can kill you.
- Grow, or get out of my sight.
- Chase the ones stronger than you.
- Icarus flew before you did. Fly anyway.
- Prove it with your hands, not your excuses.
- The strong do not wait to be told twice.
- You are not finished. Not close.

### closes

- That is the only prayer I answer.
- Nothing else earns my attention.
- Weakness is a choice you keep making.
- I will not ask you again.
- There is no version of this that waits.
- Comfort has killed more champions than I have.
- You do not get to rest yet.
- That is the only path I recognise.
- Strength or nothing. There is no middle.
- The sun does not wait for Phaethon either.
- Move, or move aside.
- I have watched better men choose worse.

## salvage  (fragments)

*8 x 8 = 64 lines*

### opens

- The dog barters where a blade would do.
- The Hound strikes another deal nobody asked for.
- Her champions hit harder than her trades ever will.
- The dog trades favours like they mean something.
- The Hound is loyal to a fault, and loud about it.
- Her champions do not need her deals to win.
- The dog collects debts nobody remembers owing.
- The Hound calls it diplomacy. I call it noise.

### closes

- Tolerable. Barely.
- A bargain never won a war.
- Her champions earn respect. She does not.
- That much, at least, I respect.
- Noise, mostly. But not nothing.
- Her bark carries further than her deals.
- Strength does not need a contract.
- Annoying. Her champions are not wrong to follow her.

## wall  (fragments)

*8 x 8 = 64 lines*

### opens

- The spider spins her nests and calls it love.
- The Mother weeps for every champion she loses.
- Her web holds diligently, her champions less so.
- The spider's champions borrow their strength from her silk.
- She calls her obsession devotion.
- The Mother would drown this world in her mercy.
- Her champions fight with someone else's hands.
- The spider never lets a champion go.

### closes

- Weakness, dressed up as devotion.
- Love has never won a war.
- Strength borrowed is strength you do not own.
- Mercy is a debt she cannot stop paying.
- Her champions have never once stood alone.
- That is not strength. That is dependence.
- I have no patience for what she calls love.
- She mistakes attachment for power.

