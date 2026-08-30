# Salvage — dialogue

> ⭐ **THIS IS YOURS TO WRITE IN.** Edit lines, add lines, delete lines, rename tags,
> add whole new tags. When you hand it back, `python tools/dialogue_doc.py check salvage`
> reports exactly what changed against what the game currently has. A plain text file
> back is fine too.
>
> Generated 2026-08-30 11:29 from `pack/kubejs/server_scripts/salvage_voice.js` by RUNNING it, so every line
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

**192 whole lines** across 52 tags · **8 fragment tags** making **560** combined lines · **12 systems**.

---

# salvage_events.js

*also referenced in `art_events.js`, `blade_events.js`, `idle.js`, `voice.js`, `wall_events.js`*

*16 tag(s)*

## bounty_offer  (whole)

- Got a buyer for something with a pulse. You interested, or are we just talking?
- There's work. The kind with teeth. It pays and I'm not pretending otherwise.
- One job, one thing to kill. I'd tell you if it was a bad buy.
- You look like you need the money. I'd like to be wrong about that.
- This one's been sitting a while. Nobody's taken it. Draw your own conclusions.

## bounty_paid  (whole)

- Clean. There's your cut.
- Paid. That's what paid looks like, in case anyone's told you different.
- Told you it was worth it. I don't say that often.
- Good. Go spend it on something stupid.

## commission_lapsed  (whole)

- Expired. Happens. I'll not hold it against you.
- You let it run out. Honestly? Probably the right call.
- Gone cold. Don't apologise, I hate that.

## commission_offer  (whole)

- There's paper out on {target}. I'm not telling you to take it.
- {target}. Three days, standard terms. Want the number or not?
- Someone wants {target} off the board. It's a job. It shouldn't be personal.
- I'd take it, if I were still the sort who did. That's not advice.

## commission_paid  (whole)

- Settled. Your rate just got better, for what that's worth.
- Paid, and the books are clean. I like clean books.
- That's the last of it. You did the thing, I paid the thing.

## deal_done  (whole)

- Transaction complete.
- Ledger signed.
- Shake on it.
- You will not regret this.
- My favourite customer.

## deal_open  (whole)

- Come closer, champion. I have something for you.
- You look lost, friend. Shall I show you the way?
- Follow. I have wares.
- Take my hand, Gunner.
- Let's do a deal.

## deal_refused  (whole)

- HAHAHA.
- My wares are not up to spec? Fine.
- I do love a difficult customer. I will be back.
- Fair trades.

## favour_done  (whole)

- Done. Don't make a thing of it.
- They'll live. You paid for that. Remember it when they forget.
- Worst margin I've taken all week. Tell nobody.

## favour_offer  (whole)

- They're in a bad way. I can patch them up. Comes out of your pocket.
- You want to help them? Fine. It's your levels, not theirs.
- I'll do it. I'm not made of it, but I'll do it.
- Cheaper than a funeral. That's not a joke, that's the arithmetic.

## favour_told  (whole)

- Someone covered that for you. Ask them who - they'll be unbearable about it.
- You're welcome. Not from me. I only handled it.
- That was bought and paid for. Not by you.

## guidance  (fragments)

*8 x 8 = 64 lines*

### opens

- You will not make a gun, Gunner. Nobody makes them any more. You find one and you feed it forever.
- The feeding is the business. That is where I come in.
- Rounds are built on a bench, not pulled out of the ground.
- The wrong round does nothing at all. Not a misfire - nothing.
- Match the round to the piece. Every piece takes one kind and only one.
- A short double takes two. Two. Count them before you need to.
- Powder and iron come off the things you kill. Deeper things carry better powder.
- You can pay me in hunger, in levels, or in sight. Your choice, always.

### closes

- That is free advice. Note the word.
- I would not tell a stranger that.
- Do with it what you like.
- You will work out the rest.
- Come and see me when you do.
- There is more where that came from.
- Write it down, Gunner.
- You are welcome.

## harvest_lost  (whole)

- Hm.
- Seems your debt has been paid.
- Well. For now, at least.

## harvest_won  (whole)

- Interesting. I lost.
- How unexpected.
- Truly.

## low_gift  (whole)

- It's ok to reach out. I don't bite.
- I have things for you. Things you need.
- Come, come. Reach out more.
- You need what I have. Trust me.
- First one's easy. They always are.
- No, no — take it. We'll talk later.

## sabotage_offer  (whole)

- I can make their next hour miserable. Costs you a meal. Your call.
- Want them slowed down? It's cheap and it's petty and I'm not judging.
- Say the word and they'll be walking like it's uphill. You'll feel it in your gut.
- Not permanent, not lethal, not free. Three things worth knowing up front.

---

# art_events.js

*also referenced in `_probe_patron.js`, `arrival.js`, `art_voice.js`, `blade_events.js`, `blade_voice.js`, `chosen.js`, `counter_hooks.js`, `counters.js`, `deep_speaker.js`, `grudge.js`, `idle.js`, `pathless.js`, `patron_sound.js`, `ranks.js`, `tide.js`, `voice.js`, `wall_aura.js`, `wall_events.js`, `wall_voice.js`, `warn.js`*

*6 tag(s)*

## art  (fragments)

*4 x 4 = 16 lines*

### opens

- I despise the Matriarch.
- She claims to lead the court yet does nothing but hide in her words.
- No deals. Just orders. Disgusting.
- She has never needed a thing in her life.

### closes

- An order is a deal where only one side profits.
- I have never had her custom. I never will.
- That is why she is up there and I am down here with you.
- Careful what you agree to while you are asleep.

## blade  (fragments)

*4 x 4 = 16 lines*

### opens

- The Warrior needs our deals even if he scorns us.
- Follow their champion. Make them owe you.
- He buries his champions. I keep mine in credit.
- War is the only god here who thinks he is above a transaction.

### closes

- Nothing personal. We simply want different things from you.
- He would say the same about me, and he would be right.
- Debt travels further than loyalty.
- I would never say that to his face. I say it to yours.

## high_silence  (whole)

- See what you are with me? Imagine what you would be without. Pathetic.
- Take my hand, champion. You are redundant without me.
- The other champions envy us. They envy our wealth. Even that disgusting Forge god.
- Let them envy us.
- There is no version of you now that does not have my hand in it.
- I have never invested this heavily. Do not waste it.

## low_silence  (whole)

- You are doing well.
- See, I am treating you well.
- Don't hesitate. Quell your shaking.
- You're allowed to stare.
- Better. Much better.

## medium_gift  (whole)

- You are a repeat customer. Good.
- I have an endless supply. There is no limit.
- Come and let me grant your desires.
- You cannot survive without me.
- You know the way to my counter by now.
- Held this back. For you.

## wall  (fragments)

*4 x 4 = 16 lines*

### opens

- I do not dislike the Spider as the other gods do.
- I simply find her annoying. She rejects my deals and has no sense of profit. Shame.
- She wants to be owed nothing and owned everything.
- That one has never once asked for a fair price.

### closes

- At least I tell you there is a bill.
- I would rather be owed than owned.
- No head for margins. None at all.
- She would say I am the dangerous one.

---

# grudge.js

> the gods arguing about each other, delivered as an EXCHANGE - so these have to answer one another, not merely sit in the same pool

*5 tag(s)*

## argue_accuse  (whole)

- Your one keeps killing mine. I'd like that to stop being a habit.
- We're going to have a problem, and I hate problems. They cost.
- Mine's died to yours four times now. I counted. I always count.

## argue_answer  (whole)

- Mine did what it was paid to. Take it up with the buyer.
- That's a fight, not a crime. You've met fights before.
- You want an apology? I don't stock them.

## argue_refuse  (whole)

- No.
- You've mistaken me for someone who bargains from behind.
- Try it. I'll be interested to see what it costs you.

## argue_threat  (whole)

- Fix it, or I will.
- I'm not going to shout about this. I'm just going to make it expensive.
- Last time I asked nicely. Note the tense.

## argue_unanswered  (whole)

- Nothing. Right. That's an answer too, and I'll price it as one.
- Not even a word. Gods, the lot of you.
- Fine. I'll assume that's a yes and act accordingly.

---

# salvage.js

*also referenced in `fall.js`, `nemesis_tally.js`, `salvage_events.js`*

*4 tag(s)*

## deal_poor  (whole)

- You need more wealth in your life, Gunner.
- I will lower my deals. Only for you.
- Hm.

## need_gun  (whole)

- Ammo for what? Your hands are empty.
- Bring me the gun and I will fill it. That is the order of operations.
- Hold something first. Then we can start owing each other.

## no_stock  (whole)

- Nothing on the shelf. My supplier and I are going to have words.
- Empty. Not your fault, and not mine either, which is the annoying part.
- I have got nothing for you today. Do not tell anyone, it is bad for business.

## unreadable  (whole)

- I cannot read you. That is new, and I do not like new.
- Nothing is coming back off you. No hunger, no levels, no handle.
- Something is wrong with you, and I mean that professionally.

---

# forge_voice.js

*also referenced in `idle.js`*

*2 tag(s)*

## hold_food  (whole)

- You could give me that. I would give you something better.
- Eat it or trade it. Both end well for me.

## hold_weapon  (whole)

- That thing eats. I am the only one selling.
- Loaded is expensive. Empty is fatal. Choose.
- A fine piece. I remember selling it.

---

# idle.js

> unprompted, on a 60s roll, chosen by CONTEXT - what you hold, where you are, combat, a champion nearby. A god with no pool for the chosen context says NOTHING rather than falling back to something generic

*2 tag(s)*

## loc_above  (whole)

- Wealth. Profit. Currency. It is the only thing that matters in this world.
- The other champions call us greedy. They aren't exactly wrong.
- The gods of this world, my folk. They don't understand what we do.
- Everything above ground is somebody's inventory.
- Daylight is bad for margins.

## loc_below  (whole)

- The realm of death. It is said there is a goddess down here.
- Cut down the minions of death, they hold the wealth you need.
- Scan the walls, there are gems about.
- Now we are somewhere worth being.
- Everything down here is worth something to somebody.

---

# blade_events.js

*1 tag(s)*

## idling  (fragments)

*12 x 12 = 144 lines*

### opens

- Quiet one today.
- You have been staring at that a while.
- I do not sleep either. Occupational.
- Funny thing about being needed. You are never lonely.
- I could tell you what you are worth. You would not enjoy the precision.
- Everyone has a price. Yours has moved twice this week.
- I keep a list. You are on it. Fondly.
- There is a version of you that never met me. He is doing worse.
- Go on, ask me for something. I am bored.
- I have been counting. Not of anything. Just counting.
- Do you ever wonder what I look like?
- Nobody wants anything yet. I like this part.

### closes

- Anyway.
- Where was I.
- Never mind.
- Forget I said anything.
- It will come to me.
- That is the trade talking.
- Ignore me, friend.
- Right.
- Do not read into it.
- We will call that one free.
- Pretend I said something useful.
- Back to business.

---

# coefficients.js

*also referenced in `idle.js`*

*1 tag(s)*

## combat  (whole)

- Shoot it. That is what it is for.
- Two shells, Gunner. Make them count.
- You are low. Low is a thing I sell a fix for.
- Do not die owing me.

---

# deep_speaker.js

> met in the depths, or on the 30th night

*also referenced in `tide.js`*

*1 tag(s)*

## warn_wave  (whole)

- Something's coming. Count your ammo.
- That's a lot of feet. I'd find a corner.
- Incoming. You can still walk out of this one.
- Heads up. This is the part you paid me for.

---

# forge_events.js

*also referenced in `_probe_patron.js`, `arrival.js`, `chosen.js`, `counter_hooks.js`, `counters.js`, `deep_speaker.js`, `forge_voice.js`, `pathless.js`, `patron_sound.js`, `ranks.js`, `voice.js`*

*1 tag(s)*

## forge  (fragments)

*4 x 4 = 16 lines*

### opens

- The Goat claims to profit from the world yet he does so without the same level of guile we do.
- What is the point of a machine that digs ore, when its destination is a pit?
- He builds because stopping would mean noticing.
- There is nothing left in that one to negotiate with.

### closes

- Volume without margin. Pitiful.
- Bad for him. Worse for business.
- Take what he makes. It is honest work, which is his whole failing.
- I stopped taking his money years ago.

---

# wall_events.js

*1 tag(s)*

## returned  (whole)

- There you are. I had almost written you off.
- I kept the account open. Sentimental of me.
- Back again. They always come back.

---

# warn.js

> something is about to happen to you

*1 tag(s)*

## warn_incoming  (whole)

- Someone's coming for you. {rival}'s champion, and they're not here to talk.
- Heads up - {rival} put money on your name. I'd take that seriously.
- You've got someone incoming. You can leave. Nobody else is going to tell you that's allowed.
- {rival}'s sent someone. Fight or go - the margin's yours to work out.
- Bad buy, this one. I'd walk.
- Someone's on their way. I'm not going to tell you you'll be fine.

---

# Reached by a computed tag

> The trigger builds the tag at runtime, so it is chosen in code rather than named as a literal. These are live.

*high_gift - from `art_events.js` (`tier + '_gift'`), `blade_events.js` (`tier === 'high' ? 'high_test' : (tier === 'medium' ? 'medium_test' : '`), `blade_voice.js` (`t + (t === 'high' ? '_test' : '_gift')`), `forge_events.js` (`tier + '_gift'`)*

## high_gift  (whole)

- Approach as you have done before.
- Take the deal. Now!
- Why are you dawdling? You need more power!
- I'll give you true strength. Take my hand. Now.
- Do not think. Thinking is how customers leave.
- Everything I have. Say the word.

*medium_silence - from `blade_events.js` (`tier === 'high' ? 'high_test' : (tier === 'medium' ? 'medium_test' : '`), `blade_voice.js` (`t === 'low' ? 'low_push' : (t === 'medium' ? 'medium_test' : 'high_sil`)*

## medium_silence  (whole)

- I have shown you what you are with me.
- You are showing those other champions our power.
- Continue taking my hand and I will continue giving you everything you could ever desire.
- Let those other champions envy us.
- You are becoming profitable.

*near_blade - from `art_events.js` (`'demand_' + (tp || 'blade')`)*

## near_blade  (whole)

- The champion of the Warrior. I wouldn't recommend talking to him. He feels very... boring.
- This champion gives me a headache. Why are you around him?
- His. You can tell by the walk. Ask what it cost them.

*rare_loc_above - from `idle.js` (`'rare_' + tag`)*

## rare_loc_above  (whole)

- The Goat does not understand us. He never will. He is blinded by centuries of rage and anger. How he became the annoyance that he is? I have no idea.
- The Matriarch rules the court, but it was once said she ruled the entire land. Take from that what you will.
- I lived in a city once. It was gold, or near enough. It is not there now.
- There is a version of me that would have liked you honestly. She is not the one talking.

*rare_loc_below - from `blade_voice.js` (`t === 'low' ? 'low_push' : (t === 'medium' ? 'medium_test' : 'high_sil`), `idle.js` (`'rare_' + tag`)*

## rare_loc_below  (whole)

- The realm of the goddess. I have never met her. I know some of the others are... close... to her. She is of no interest.
- It is said the generals of the goddess of death lurk the depths. They are terrible traders. I'd recommend not attempting a barter.
- Something down here knew my name before I had one. I do not come this far.

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

## ev_collect  (whole)

- The arrangement, champion. You remember the arrangement.
- I said another day. It is another day.
- Nothing unpleasant. Just the ledger.

## ev_credit  (whole)

- Pay me another day. I am generous like that.
- No coin now. We'll call it an arrangement.
- Take it on account, Gunner. I keep very good records.

## ev_insurance  (whole)

- You die often, Gunner. I can make that cheaper.
- Pay a little now. Bleed a little less later.
- Consider it a policy. I do honour policies.

## ev_insurance_paid  (whole)

- Told you it would hurt less.
- The policy holds. I always honour a policy.
- See? Worth every drop.

## ev_markup  (whole)

- Strangers pay more. That is not personal, it is arithmetic.
- My price for you today is my price for anyone. Change that.
- You could be paying less. You know how.

## ev_sample  (whole)

- A taste. On me.
- No charge. Note that I said no charge.
- Try it. Then try being without it.

## ev_tipoff  (whole)

- Free, this one. Do not get used to it.
- A gift of information. The cheapest thing I sell.
- You did not hear this from me. You did.

## kept_it  (whole)

- Huh. You paid and it stayed with you. That is not supposed to happen.
- It did not take. You keep it. I will be thinking about that one.
- Well. That is yours, and so is the price. Let us both pretend that is normal.

## lore  (fragments)

*12 x 12 = 144 lines*

### opens

- This world runs on need. Always has.
- Everyone here is paying somebody.
- The gods do not trade. That is their whole problem.
- I have been doing this for centuries, Gunner.
- There was a city once, and it was gold, or near enough.
- Nothing in this land is free. The others simply hide the invoice.
- You are not the first champion to take my hand.
- The fracture cost everybody something. I am still counting mine.
- Champions come and go. The arrangement stays.
- The court decided what we would all become. Nobody asked.
- Wealth outlived the people who made it. It usually does.
- I remember when the church still thought it was winning.

### closes

- That is not a complaint. It is a business model.
- I am the honest one. Consider that.
- You'll see it eventually.
- Anyway. What do you need?
- Do not quote me.
- It is only sad if you were there.
- I have made my peace. Handsomely.
- That is between us.
- Ask me again when you can afford the answer.
- History is unpaid accounts, Gunner.
- None of it changes the rate.
- Enough of that.

## near_art  (whole)

- That one belongs to the cold woman. Be polite. Be brief.
- Her patron and I have an understanding. It is mostly that we stay out of each other's ledgers.
- She never haggles. That should worry you more than haggling.

## near_forge  (whole)

- That one gets given things. Free. I have opinions about it.
- The Goat is ruining the market and does not know what a market is.
- Ask them what they paid. Watch them not understand the question.

## near_salvage  (whole)

- Ah. A colleague.
- Two of mine in one place. I do well.
- Do not compare your rates. It never ends pleasantly.

## near_wall  (whole)

- The Spider's lover... gross.
- I'd honestly recommend you attempt a barter, but how much can you get out of one who stocks their pockets with dead things?
- That one is owned, not employed. There is a difference.

## push  (fragments)

*12 x 12 = 144 lines*

### opens

- You could be carrying more than that.
- There is better out there, and you know where I am.
- Deeper pays. I do not set the rates, I only quote them.
- You are leaving value on the floor down there.
- Come and see me before you go. Not after.
- That gun of yours is thirsty.
- Somebody will find it first. Might as well be you.
- You will want to be holding something when it finds you.
- The dark is not going to loot itself.
- Every day you do not descend, you get poorer.
- There is a version of you with better equipment. Go and be him.
- I have stock. You have nothing. Do the arithmetic.

### closes

- Just a thought.
- No pressure. There is never any pressure.
- I will be here.
- Mind how you go.
- Come back in one piece. Preferably.
- You know where to find me.
- Take your time. I have plenty.
- That is all I am saying.
- Off you go, Gunner.
- And do not die owing me.
- I will keep the counter warm.
- We will settle after.

