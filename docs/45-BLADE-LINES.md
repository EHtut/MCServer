# BLADE — every line he has

**Mess with it and hand it back.** Edit in place, delete what you dislike, add
numbers freely — the numbering is only for reading, nothing depends on it. I
rebuild `blade_voice.js` from whatever comes back.

Generated from the source 2026-08-16, so this IS what is in the game right now.
**317 lines across 42 pools.**

> ### His thesis, so you can write against it
WARRIOR — "Strength is the only apology I have left."
He was the general and he survived. Every soft thing he ever did got someone killed, so he drills you toward unbreakable, because he broke. His lie: that he's hard. He isn't — he's a kind man performing the discipline he thinks would have saved his home. Sentences: imperative, clipped, no subordinate clauses. Again. Get up. Again. As he warms they get longer and start ending in questions, which is the tell. He never says "I'm sorry"; he says "you're not ready," and means the same thing.

> 🔴 marks something I think fights that thesis. ⭐ marks something that nails it.


---

# 1. THE IDLE VOICE — what he says unprompted

### `guidance` — 9 lines
*idle, weight 2 — his standing advice on how to get stronger*

```
1. Learn one weapon until it is boring. Then learn what it does that the others cannot.
2. Every weapon swings its own way. A man who carries five has mastered none.
3. You can roll out of a blow. Learn where that is bound before you need it.
4. The blade I gave you is too heavy for you. That is not a flaw, it is an instruction. (Cut - this doens't make sense anymore)
5. Strength is not a thing you are. It is a thing you drink. Find it. (What?)
6. Nothing above the treeline will ever be worth killing. Go down.
7. Deeper corpses pay better. Descemd, Champion.
8. Armour is borrowed. A weapon in your hand is not. Carry your power where it cannot be raided.
9. Two hands on it. Even that will not be enough yet. (My brother finds this line very funny)
10. Do not let short sightedness blind you. Master every blade.
```

### `low_push` — 10 lines
*idle at LOW trust — you are standing around*

```
1. Move. The fight won't come to you.
2. Enough standing. Fight.
3. Find something and kill it.
4. You are wasting time, Champion.
5. There's no strength in waiting. Go.
6. Something out there needs killing. Find it.
7. You don't grow standing still. Move.
8. Get out there and bleed for it.
9. Fight now. Rest when you've earned it.
10. The only way through this is through it. Go.
```

### `loc_above` — 8 lines
*idle, weight 1 — you are above ground*

⚠️ line 5 sends you to lean on FORGE, which is CLOSED

```
1. The goddess below rules the underworld unchecked.
2. You are growing. Good.
3. I am not disappointed in your growth. There is still room to grow.
4. I can feel your trepidation. Descend, champion.
5. The Goat god and their champion are your path to sustenance. Lean on your allies.
6. Be wary of the Wolf's deals, for one day she may offer you one. Deny her.
7. The Matriarch has led the Court for centuries. Do not mistake authority for power.
8. The spider. I despise that damnable god. She is but a step away from the evil we fight against.
```

### `loc_below` — 5 lines
*idle, weight 1 — you are underground*

⭐ line 5 is your best lore line — he confesses the pantheon banished her

```
1. The minions of death swarm.
2. Be on your guard. You will be tested.
3. I want this clean. No mistakes. No retreat.
4. Grow, champion. Hone your blade against those who threaten our lands above.
5. She was banished down here for a reason, the goddess of death. We will remind her why.
```

### `rare_loc_above` — 6 lines
*15% roll BEFORE loc_above — put the lines where he is a person here*

```
1. This land is an old one. A nameless one.
2. You have no memories of arrival. That is all right. Instead, focus on your blade.
3. I had a name in life once. That was centuries ago.
4. I am a prisoner here, like you. Know that we fight for the same cause.
5. The Spider and her consort... they are the closest to my kind. I cannot help but feel attachment.
6. What does the sun feel like on your skin? I barely remember.
7. The Spider... Why can I hear her name?
8. The goat, he has caused thousands of atrocities and yet he was deemed worthy of ascension.
9. The Matriarch once led my kind. Once. Be wary of her champion.
```

# 2. TRUST REGISTERS — how he changes as you rise

### `low_gift` — 10 lines
*he hands you gear at LOW trust*

🔴 contradicts his own thesis — see the note above this section

```
1. Take it. You're no use to me dead.
2. Iron. Don't waste it standing still.
3. This keeps you breathing. Use it well.
4. Armour. Put it on before you bleed.
5. You need this more than I need to give it.
6. Take the blade. Earn the next one.
7. Supplies. Spend them like they matter.
8. You can't fight with empty hands. Here.
9. This isn't strength. It's a chance to reach it.
10. Gear up. I don't waste effort on corpses.
```

### `medium_gift` — 10 lines
*he hands you gear at MEDIUM trust*

⭐ this pool KNOWS he is winding down. It is the model

```
1. Not much. You don't need much anymore.
2. Small, but you've earned that much.
3. Take it. You're closer to not needing me.
4. This, and no more. You're managing well enough.
5. A little help. You've been managing without it.
6. This is less charity now, more habit.
7. Here. Call it a formality.
8. You need this less than you did. Take it anyway.
9. Small gift. Don't get comfortable.
10. This should cover what's left of your weakness.
```

### `medium_test` — 10 lines
*he sends a wave at MEDIUM trust*

```
1. This one's a test. Don't waste it.
2. I'm watching this fight closely.
3. Show me the last one wasn't luck.
4. This is a measure, not a gift.
5. I want to see how you handle this.
6. Consider this an exam.
7. Fight like I'm keeping score. I am.
8. This is harder on purpose. Show me why.
9. Let's see what you've actually learned.
10. I'm paying attention now. Don't waste it.
```

### `high_test` — 10 lines
*he sends a wave at HIGH trust*

🔴 register drift — chatty and warm, against a tier whose whole idea is silence

```
1. Something worth your time, finally.
2. Let's see what you're really made of.
3. This might actually challenge you.
4. I sent something dangerous. Good.
5. Now we find your limit.
6. This one could kill you. Good.
7. Show me something I haven't seen.
8. Finally, an opponent worth the name.
9. Fly as high as you like. I'll be watching how you land.
10. This is the kind of fight I remember.
```

### `high_silence` — 16 lines
*HIGH trust approval — the top of his register*

⭐ the best pool in the file

```
1. Noted.
2. That's not nothing.
3. Few make it this far.
4. I've stopped worrying about you.
5. You didn't need me for that one.
6. Keep that up and I'll run out of things to teach you.
7. I don't say this often.
8. You're becoming a problem for your enemies.
9. I have seen worse stand where you are standing.
10. That was competent. I will not say it twice.
11. You are no longer the weakest thing I am watching.
12. Hm.
13. I would have done it differently. It worked anyway.
14. There are fewer things above you than there were.
15. You have stopped needing me to say anything.
16. Good.
```

# 3. EVENTS — what he says when he sends something

### `icarus` — 5 lines
*wave, above y100 only — punishes being high and comfortable*

⚠️ names Icarus AND Phaethon — the only Earth myth in the game

```
1. For it was Icarus who flew too close to the sun. You will share his fate.
2. You climbed. Of course you climbed.
3. The sky was never yours. Come down, or be brought down.
4. Height is a debt. They are here to collect it.
5. Phaethon took the reins too. Look up.
```

### `hollow` — 5 lines
*wave whose drops are CANCELLED — the kills pay nothing*

```
1. These carry nothing. Kill them anyway.
2. There is no reward in this. Fight.
3. Nothing drops from these. That was never the point.
4. You will gain nothing here but the doing of it.
5. No spoils. Only the work.
```

### `broken_rung` — 5 lines
*fires on RESPAWN — a wave at someone who just died*

```
1. The thing that killed you brought company.
2. It killed you once. Correct that.
3. You fell to this. Do not fall twice.
4. Three of them now. Learn faster.
5. It is waiting where you left it. So am I.
```

### `first_blood` — 3 lines
*stage 1 — he buffs the next thing you swing at*

```
1. The next thing you swing at, I am making harder.
2. Pick your target carefully. I am about to improve it.
3. Whatever you strike next will strike back properly.
```

### `first_blood_hit` — 3 lines
*stage 2 — you hit it*

```
1. There. Now it is worth killing.
2. Now finish what you started.
3. Better. Deal with it.
```

### `first_blood_late` — 3 lines
*you did not swing at anything, so he sent something*

```
1. You did not swing at anything. So I sent something to swing at you.
2. A minute, and no fight in you. Here is one.
3. You waited. Now you do not have to look.
```

### `duel` — 3 lines
*one strong actor, no wave*

```
1. One of mine. No crowd, no help, no excuses.
2. This one is not a wave. It is a single opponent, and it is better than you.
3. Alone against one. That is the oldest test there is.
```

### `duel_fled` — 3 lines
*you ran from the duel — a taunt, never a penalty*

```
1. You ran.
2. You left the ground. I will remember that longer than you will.
3. Noted. You had one opponent and chose distance.
```

### `tithe` — 3 lines
*your held item wears twice as fast for a day*

⭐ the most on-thesis mechanic he has

```
1. Your steel owes me. It will wear twice as fast until it has paid.
2. A day of doubled wear. Fight anyway.
3. Everything you swing is on loan. I am calling in the interest.
```

### `tithe_over` — 3 lines
*the tithe ends*

```
1. Your steel is your own again.
2. The debt is paid. Look after it better.
3. Done. It held, or it did not.
```

### `understudy` — 3 lines
*a copy of YOU, with your health and reach*

⭐ also dead on-thesis

```
1. I made one of you. Let us see which is better.
2. It has your health, your reach, your weapon. Nothing else.
3. Fight yourself. Most champions lose.
```

### `watcher` — 3 lines
*a bounded presence that only watches*

```
1. I am going to stand here and watch. Do not mind me.
2. I will not lift a hand. Everything else will lift two.
3. Consider yourself observed. It will make the rest bolder.
```

### `watcher_gone` — 3 lines
*it leaves*

```
1. Enough. I have seen what I came to see.
2. I am done watching.
3. That will do. For now.
```

# 4. THE MARK — he points at another player

### `mark_declare` — 8 lines
*he marks another player for 2 days. {target} is substituted*

```
1. {target} fights with borrowed strength. Kill them within two days.
2. Find {target}. End them before the sun sets twice.
3. {target} serves a spider and calls it power. I want them dead.
4. Two days. {target} does not see a third.
5. Bring me {target}'s fall, not their excuses.
6. {target} wears strength that is not theirs. Cut it off them.
7. I despise {target}. You have two days to matter to me.
8. Kill {target}. Do it before I forget I asked.
```

### `mark_success` — 9 lines
*you killed the marked player*

```
1. Dead. As it should be.
2. Good. One less parasite wearing someone else's strength.
3. You did what was needed. Nothing more needs saying.
4. It is done. I expected nothing less.
5. The spider's champion falls. Unremarkable, as intended.
6. Good.
7. That is one fewer borrowed sword in this world.
8. Clean. I have no notes.
9. She will feel that. Let her.
```

### `mark_ignored` — 8 lines
*the 2 days passed and you did nothing*

```
1. You did not kill them. Of course you did not.
2. The days passed. So did my interest.
3. I asked one thing. You gave me nothing.
4. Fine. Let the spider keep her borrowed strength.
5. I will not punish you. I will simply expect less.
6. You failed to matter today. Try not to make it a habit.
7. The moment passed you by, as most do.
8. Forget it. I already have.
```

# 5. THE HARVEST — the end of his path

### `harvest_open` — 3 lines
*the Harvest begins — his champion is coming*

```
1. It is time. I am sending the best thing I have.
2. Everything until now was preparation. This is the test.
3. One opponent. Mine. Now we find out.
```

### `harvest_won` — 4 lines
*YOU BEAT HIS HARVEST*

🔴 ONE line fires at random, and the pool holds TWO different beats — see the note

```
1. Predictable.
2. I always knew I made the right choice.
3. The goddess of death awaits below.
4. Find her. End her.
```

### `harvest_offer` — 3 lines
*after winning — he releases you, or you stay*

⭐ the only exit in the game that is not a failure

```
1. You could stay. I would not ask twice.
2. There is a place here if you want it. Go, if you do not.
3. Stay, or go. Either is yours now. That is the whole point.
```

### `harvest_lost` — 2 lines
*his champion killed you*

```
1. Predictable.
2. You are not yet ready.
```

# 6. THE OTHER CHAMPIONS — standing near them

### `near_wall` — 3 lines
*you are standing near the Spider's champion*

```
1. The spider's underling. Keep distance from that one, lest they bore you.
2. They fight with borrowed strength. Do not learn it from them.
3. Mercy, dressed up as devotion. Walk on.
```

### `near_salvage` — 3 lines
*you are standing near the Hound's champion*

```
1. The emissary of the wolf. Do not trust them.
2. That one deals before they draw. Watch which they reach for first.
3. Their might is respectable. Their patron is noise.
```

# 7. COMBINATORIAL — every open pairs with every close

These join with a space, and each half is picked independently — so `opens` × 
`closes` is the real line count. Keep each half able to follow ANY partner.

### `lore` — 12 × 12 = **144 possible**
*idle — the world, told as background*

**opens**
```
1. This world was cursed before you were born.
2. Five gods rule what is left of this place.
3. Champions have kneeled on this ground for a thousand years.
4. Every champion before you believed he was the last.
5. This world has buried better than you.
6. The gods do not agree on much.
7. There were champions here before the curse had a name.
8. The ground beneath you has swallowed a hundred like you.
9. None of the five gods forgive.
10. This world rewards nothing it has not first broken.
11. The champions before you are dust now, all of them.
12. The curse does not care whose fault it was.
```
**closes**
```
1. Their names did not survive the telling.
2. That has never once been true.
3. You are one more attempt among many.
4. War is the only honest one among them.
5. I was already old when it began.
6. That does not make you interesting.
7. The dust does not complain.
8. You will learn this, or you will join them.
9. That is the only mercy this place has ever offered.
10. None of that concerns me.
11. It has done worse to better champions.
12. I have outlasted every one of them.
```

### `wall` — 8 × 8 = **64 possible**
*his opinion of the Spider*

**opens**
```
1. The spider spins her nests and calls it love.
2. The Mother weeps for every champion she loses.
3. Her web holds diligently, her champions less so.
4. The spider's champions borrow their strength from her silk.
5. She calls her obsession devotion.
6. The Mother would drown this world in her mercy.
7. Her champions fight with someone else's hands.
8. The spider never lets a champion go.
```
**closes**
```
1. Weakness, dressed up as devotion.
2. Love has never won a war.
3. Strength borrowed is strength you do not own.
4. Mercy is a debt she cannot stop paying.
5. Her champions have never once stood alone.
6. That is not strength. That is dependence.
7. I have no patience for what she calls love.
8. She mistakes attachment for power.
```

### `salvage` — 8 × 8 = **64 possible**
*his opinion of the Hound*

**opens**
```
1. The dog barters where a blade would do.
2. The Hound strikes another deal nobody asked for.
3. Her champions hit harder than her trades ever will.
4. The dog trades favours like they mean something.
5. The Hound is loyal to a fault, and loud about it.
6. Her champions do not need her deals to win.
7. The dog collects debts nobody remembers owing.
8. The Hound calls it diplomacy. I call it noise.
```
**closes**
```
1. Tolerable. Barely.
2. A bargain never won a war.
3. Her champions earn respect. She does not.
4. That much, at least, I respect.
5. Noise, mostly. But not nothing.
6. Her bark carries further than her deals.
7. Strength does not need a contract.
8. Annoying. Her champions are not wrong to follow her.
```

### `forge` — 8 × 8 = **64 possible**
*his opinion of the Goat*

**opens**
```
1. The Thief builds what your arm alone cannot.
2. The engineer forges the war you fight.
3. The Thief is tolerable. His work is not.
4. No champion wins alone. The engineer sees to that.
5. The forge burns for every battle you have yet to fight.
6. The Thief demands cooperation, and he has earned the right to.
7. His engines carry weight your sword cannot.
8. The Thief builds glory. You still have to claim it.
```
**closes**
```
1. Respect that. Few of the five deserve it.
2. Glory built alone is glory half-made.
3. Work with him. That is not weakness.
4. He is the engine. You are still the war.
5. That much I do not dispute.
6. Cooperation is not the same as dependence.
7. Use it. Waste is the only sin here.
8. He has earned that much from me.
```

### `art` — 6 × 6 = **36 possible**
*his opinion of the Dreamwalker*

**opens**
```
1. The Nightmare speaks little and rules the most.
2. Her realm is magic. Her opinions are few.
3. The shadow moves. The Nightmare rarely does.
4. She leads five gods and argues with none of them.
5. The Nightmare's silence says more than her voice.
6. Magic answers to her. Little else does.
```
**closes**
```
1. Simple, and I have no complaint with simple.
2. That is the only obedience I have, and it is enough.
3. I have nothing to say about that. Neither does she.
4. Neutral is not the same as absent.
5. She does not need my opinion of her.
6. That is her business, not mine.
```

### `push` — 12 × 12 = **144 possible**
*combinatorial 'go and fight'*

**opens**
```
1. Pick up the blade.
2. Find something worth fighting.
3. Strength does not arrive. You take it.
4. Fight something. Anything.
5. Bleed for it, or do not bother.
6. Test yourself against something that can kill you.
7. Grow, or get out of my sight.
8. Chase the ones stronger than you.
9. Icarus flew before you did. Fly anyway.
10. Prove it with your hands, not your excuses.
11. The strong do not wait to be told twice.
12. You are not finished. Not close.
```
**closes**
```
1. That is the only prayer I answer.
2. Nothing else earns my attention.
3. Weakness is a choice you keep making.
4. I will not ask you again.
5. There is no version of this that waits.
6. Comfort has killed more champions than I have.
7. You do not get to rest yet.
8. That is the only path I recognise.
9. Strength or nothing. There is no middle.
10. The sun does not wait for Phaethon either.
11. Move, or move aside.
12. I have watched better men choose worse.
```

### `idling` — 10 × 10 = **100 possible**
*combinatorial 'you are doing nothing'*

**opens**
```
1. You've been standing there a while.
2. Nothing's died by your hand today.
3. I don't see a fight near you.
4. That's a long time doing nothing.
5. The arena's empty because you're not in it.
6. Your blade hasn't moved in a while.
7. You're still here.
8. Something should be dying right now.
9. This is not what strength looks like.
10. You've gone quiet for too long.
```
**closes**
```
1. Go waste it on something that fights back.
2. Stillness won't make you stronger.
3. I didn't equip you to watch.
4. Find something worth killing.
5. You're wasting what you've got.
6. Move before I lose interest.
7. Something out there is waiting to test you.
8. Go earn something.
9. Every idle moment is one you don't get back.
10. Get moving.
```

---

# 8. 🔴 MISSING — he has no lines for these at all

`idle.js` weights how often each context is picked. **`combat` is the
highest-weighted context in the game at 6.** Wall has 4 lines in it, Salvage has
4, and the god of war has none — so the moment you are actually fighting, he is
the one patron who says nothing.

### `combat` — **8 lines wanted**
*weight **6**, the most-heard pool in the game. In a fight, damaged within 15s. He is a corner man, not commentary — short enough to read mid-swing.*

```
1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
```

### `hold_weapon` — **4 lines wanted**
*weight 2. A weapon in your hand, out of combat. Appraisal, not encouragement — `low_push` already covers 'go and fight'.*

```
1. 
2. 
3. 
4. 
```

### `hold_food` — **3 lines wanted**
*weight 2. Food in hand, out of combat. Contempt was cut; warmth is wrong too.*

```
1. 
2. 
3. 
```

---

# 9. 🗑️ DELETE — these can never fire

Not gaps. Unreachable, so writing into them is wasted effort. Confirm and I
remove them.

### `near_forge` — 3 lines · Forge is CLOSED — nobody can walk it
```
1. It is only through the fires of industry that we are able to keep our march. Lean on them.
2. The engineer. Glory is not attained alone - use them.
3. That one builds what your arm cannot. Respect it.
```

### `near_art` — 3 lines · Art is CLOSED — nobody can walk it
```
1. I have never trusted the goddess of magic. Their champion? Even less so.
2. She leads, and I follow. That does not mean I like her hand.
3. Magic answers to her. Keep your own answers closer.
```

### `near_crown` — 1 lines · Crown was RETIRED 2026-08-14
```
1. The spider's underling. Keep distance from that one, lest they bore you.
```
