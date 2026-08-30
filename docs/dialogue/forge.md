# Forge — dialogue

> ⭐ **THIS IS YOURS TO WRITE IN.** Edit lines, add lines, delete lines, rename tags,
> add whole new tags. When you hand it back, `python tools/dialogue_doc.py check forge`
> reports exactly what changed against what the game currently has. A plain text file
> back is fine too.
>
> Generated 2026-08-30 11:29 from `pack/kubejs/server_scripts/forge_voice.js` by RUNNING it, so every line
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

**156 whole lines** across 43 tags · **0 fragment tags** making **0** combined lines · **10 systems**.

---

# forge_events.js

*8 tag(s)*

## gift_left  (whole)

- Suit yourself. It'll keep. I don't throw nothin' away.
- No? Alright. That's allowed, y'know. Ain't everybody tells you that.
- Fine. More for- well. Nobody. More for nobody.

## gift_open  (whole)

- I made you somethin'. You gotta take it, though. I ain't puttin' somethin' on you twice in one day.
- There's a thing here for you. Yours if you want it, mine if you don't, an' either way I'm fine.
- - so I built it, an' then I remembered you existed. You want it?

## gift_taken  (whole)

- Good! Good. Right. Now go break it on somethin'.
- That's the right answer. Weren't a wrong answer, but that's still the right one.
- Ha! Yours.

## lend_ask  (whole)

- The one that follows {rival}'s havin' a bad time of it. Would you go help? For me, not for them.
- - an' somebody out there's stuck, an' you're the only one I got to ask, an' I'm askin'.
- I want you to go help {rival}'s. I know. I KNOW. Do it anyhow.

## lend_done  (whole)

- You went. You actually went. I'm gonna be thinkin' on that a while.
- That's the nicest thing anybody's done 'cause I asked. Grant you I don't ask much.
- Good. Now don't nobody owe nobody nothin', which is how I like it.

## lend_no  (whole)

- That's fair. They ain't your problem. I just figured I'd ask.
- No, I understand. Was a lot to ask an' I asked it anyhow.
- Alright. Forget I said anything. I'll bring it up again in a week.

## notion  (whole)

- - oh! OH. Hold still, hold still, I wanna try somethin'.
- I had an idea an' now it's on you. You'll be fine. Probably fine.
- Okay so I did a thing an' I should of asked first an' I didn't, an' now we both know.
- Don't worry about what that is! It's good. It's mostly good.

## notion_aid  (whole)

- - an' I done the same for your friend over yonder, 'cause it seemed rude not to.
- Your neighbour's got one too. I don't play favourites, I just play.
- Gave one to the other fella as well. Don't tell 'em it was an afterthought.

---

# art_events.js

*also referenced in `blade_events.js`, `blade_voice.js`, `idle.js`, `salvage_events.js`, `voice.js`, `wall_events.js`*

*6 tag(s)*

## guidance  (whole)

- - an' that's BEFORE the water wheel! I wouldn't of put it there. You did. That's fine.
- You could build it out of stone. Or not stone! I'm not the boss of it.
- It'd work better upside down. Most things do. I don't know why.
- Somebody made one that could lift a whole horse once. A HORSE. Nobody ever said why.
- - anyway that's three times you walked past that spot so you're either thinkin' or you're lost, an' both is fine.
- Build the ugly one first! The pretty one never gets finished. That's just true.
- I got about a hundred ideas an' most of 'em are bad so just - more. Do more.
- You don't need me to say yes. I'm not for that.
- If it works an' it looks stupid it still WORKS. That's the whole thing.
- - an' that's when I figured out nobody ever asked me. So. Whatever you want!

## harvest_lost  (whole)

- Oh. Oh no. Well - that's alright. That's alright, you can go do it again.
- You lost. Nothin' happens. Don't nobody take nothin' from you. That's how I do it.
- I'd say I told you so, 'cept I didn't, an' I wouldn't.

## harvest_won  (whole)

- You're alive. I'll be honest, I didn't have a plan for if you weren't.
- That's done, then. Didn't enjoy a second of it an' I'm real proud of you.
- - an' it's over, an' you're standin', an' I'm gonna talk about somethin' else now.

## high_silence  (whole)

- I ain't gonna fill this one. You're busy an' you know what you're doin'.
- Nothin'. An' that's me choosin', which you oughta feel real flattered by.
- - no. Never mind. You'd have thought of it.

## low_silence  (whole)

- Nothin' from me. Still workin' out who you are.
- I got nothin'. Happens 'bout once a century, enjoy it.
- Hm. Nope. Lost it.

## medium_gift  (whole)

- You've built enough that I started payin' proper attention, which is worse for you than it sounds.
- Better one. Made it thinkin' 'bout that thing you put up by the water, matter of fact.
- Here. An' 'fore you ask - no. Still nothin' attached. I ain't like the others.
- This one took me a while, which for me means I liked doin' it.
- You earned it, 'cept you didn't, 'cause that ain't how I do this. Take it anyhow.

---

# idle.js

> unprompted, on a 60s roll, chosen by CONTEXT - what you hold, where you are, combat, a champion nearby. A god with no pool for the chosen context says NOTHING rather than falling back to something generic

*6 tag(s)*

## hold_food  (whole)

- Meat. Good. Eat it 'fore it turns - that ain't a suggestion.
- - an' I'd give a great deal to know what that tastes like, so do me a kindness an' pay attention while you're doin' it.
- That's a vegetable. Why is that a vegetable. Go find somethin' that used to run.
- Chocolate! Get chocolate. Don't remember why that's the right answer but it is.
- You been carryin' that two days. It ain't a pet.

## hold_item  (whole)

- What's that for? No, genuinely, what is that for.
- - an' you could make about four things outta that, an' you're gonna make none of 'em, I can tell.
- Oh, I like that one. Turn it over. TURN IT OVER.
- Hold onto that. Not for a reason. I just like knowin' you got it.
- That's the third one of those. You're collectin' 'em. You don't know you're collectin' 'em.

## hold_none  (whole)

- Empty hands. That's a waste of two perfectly good hands.
- - nothin'? You're carryin' nothin'? What do you DO all day.
- You ain't holdin' anything, which means you're thinkin', which means I oughta be quiet. I won't be.
- Idle hands. I'd love idle hands. I'd love hands.
- Pick somethin' up. Anything. I ain't gonna talk about the weather again.

## hold_weapon  (whole)

- Oh, lemme see it. Lemme SEE it.
- - an' if you put a longer barrel on that it'd carry twice as far, which is 'bout the only advice I'm any good at.
- Swords are fine. Swords are FINE. I'm only sayin' there's quicker ways to be right about somethin'.
- Good weight on that. You can tell by how you're standin'.
- Point it at somethin'. Not at me, obviously. Not that it'd do anything.

## loc_above  (whole)

- - an' the sky's still up there, which I check, 'cause one day it might not be.
- Good weather for buildin'. All weather's good weather for buildin'.
- You got a lot of room out here. Use more of it than you need to.
- I like it up here. I ain't up here, but I like it.

## loc_below  (whole)

- - indoors. Fine. I can talk indoors.
- Everything worth havin' is under somethin'. That ain't wisdom, it's just true.
- Mind that ceilin'. I seen more folks killed by a ceilin' than by anything with teeth.
- It's awful close in here. I don't mind. I don't breathe.

---

# grudge.js

> the gods arguing about each other, delivered as an EXCHANGE - so these have to answer one another, not merely sit in the same pool

*5 tag(s)*

## argue_accuse  (whole)

- That was mine. You knew that was mine.
- - an' I'd only just got 'em buildin' the roof proper, so thank you kindly for that.
- You didn't have to. That's the whole of what I got to say. You didn't have to.

## argue_answer  (whole)

- I ain't gonna pretend I understood a word of that.
- Fine. Fine! I heard you.
- Y'all always got a reason. Everybody down here's always got a reason.

## argue_refuse  (whole)

- Nope. I ain't doin' this bit.
- I'd sooner go back to what I was doin', honestly.
- You can have the last word. You take it anyhow.

## argue_threat  (whole)

- An' I'd threaten you, 'cept we both know I ain't gonna, so let's skip it.
- I got nothin' to hurt you with. Never did build one of those.
- Consider yourself glared at.

## argue_unanswered  (whole)

- - an' don't nobody say nothin'. They never do. That's fine. I'll talk.
- Quiet. From all of y'all. Wonderful.
- Right. Well. I said it, an' it's said.

---

# coefficients.js

*also referenced in `idle.js`*

*1 tag(s)*

## combat  (whole)

- - oh. Oh, that's a lot of 'em. Right. You know what you're doin'.
- I'd run. An' I'm sayin' that as somebody who can't.
- Hit it again! That's my whole contribution. Hit it again.
- I don't like this part. I never like this part.
- You're doin' better'n the last one. He was real brave an' it didn't help him none.
- Is it s'posed to do that? Is it? I don't know what any of these are.

---

# deep_speaker.js

> met in the depths, or on the 30th night

*also referenced in `tide.js`*

*1 tag(s)*

## warn_wave  (whole)

- - somethin's comin' up outta the ground an' there is a great deal of it.
- Oh, I know that sound. Ain't heard that sound in a real long time. Get somewhere with a roof.
- That's the dead movin' all at once. Not mine. I don't got any.

---

# ranks.js

*1 tag(s)*

## bored  (whole)

- - an' now I've looked at everything over here. Twice. Both times.
- You haven't made anything in AGES. I counted. I wasn't tryin' to count.
- I might go see what the others are doin'. I'll come back though. I always come back.
- Build somethin'! Anythin'! It doesn't even have to be good, that's the best part.
- My brain wandered off an' I don't know the trick for gettin' it back yet.

---

# salvage_events.js

*also referenced in `wall_events.js`*

*1 tag(s)*

## low_gift  (whole)

- Here. I don't need it an' you might.
- Take that. No, there ain't nothin' attached to it, why's everybody always ask that.
- I found it. Well - I made it, but I found the idea, so it's 'bout the same.
- A little one to start. I got a whole mess of these.
- That's yours now. I already forgot I had it.

---

# wall_events.js

*1 tag(s)*

## returned  (whole)

- - an' then you were gone a while, so I just kept goin' without you. You didn't miss much.
- You're back. I've had four ideas an' I forgot three.
- I did wonder. Not for long, I ain't got the attention for it, but I did wonder.
- Good. Now: that thing you left half-built is still half-built, case that was on your mind.

---

# warn.js

> something is about to happen to you

*1 tag(s)*

## warn_incoming  (whole)

- - somebody's comin'. {rival} sent 'em. I don't know what you did an' I don't care, but move.
- {rival}'s put somebody on you. That ain't a thing I'd ever do an' I want that on the record. Go.
- Trouble. {rival}'s. Headed your way right this second, I ain't gonna be any use, RUN.

---

# Reached by a computed tag

> The trigger builds the tag at runtime, so it is chosen in code rather than named as a literal. These are live.

*high_gift - from `art_events.js` (`tier + '_gift'`), `blade_events.js` (`tier === 'high' ? 'high_test' : (tier === 'medium' ? 'medium_test' : '`), `blade_voice.js` (`t + (t === 'high' ? '_test' : '_gift')`), `forge_events.js` (`tier + '_gift'`)*

## high_gift  (whole)

- Been savin' this one. Not for you specifically. But now it's for you specifically.
- Ain't nobody else I'd hand this to, an' I've had a real long time to go lookin'.
- Take it. An' keep buildin', 'cause watchin' you do it's the only thing down here that's new.
- That's the finest thing I ever made an' I'm givin' it to a fella who'll drop it in lava inside a week.
- - so I thought, well, she'd have liked this. An' then I thought, she ain't here, an' you are.

*medium_silence - from `blade_events.js` (`tier === 'high' ? 'high_test' : (tier === 'medium' ? 'medium_test' : '`), `blade_voice.js` (`t === 'low' ? 'low_push' : (t === 'medium' ? 'medium_test' : 'high_sil`)*

## medium_silence  (whole)

- I had somethin' an' it's gone. It'll come back 'round, they always do.
- Nothin' worth sayin'. I'll say somethin' anyway later, don't you worry.
- Quiet a spell. I'm watchin' what you're doin' with that.

*near_blade - from `art_events.js` (`'demand_' + (tp || 'blade')`)*

## near_blade  (whole)

- - that one's his. He's real serious about it. He was serious about everything, even before.
- Say hello. He won't say it back, that ain't a slight, that's just him.
- War god's. All that armour an' he still gets hit.
- Him an' me got raised by the same woman, y'know. He don't bring it up. He don't bring anything up.
- I knew him when he was somebody's boy an' not somebody's general. Long time ago now.

*rare_hold_food - from `idle.js` (`'rare_' + tag`)*

## rare_hold_food  (whole)

- I can't remember any of it. Not one taste. That's the only part I ever do mind, an' I only mind it when you're eatin'.

*rare_hold_item - from `idle.js` (`'rare_' + tag`)*

## rare_hold_item  (whole)

- Somebody made that. Some person, with a name, who ain't around no more. Everything's like that if you look at it long enough. Anyway.
- She gave me a dragon once. A little dead one, all bones. I called it Dragon. I was not a clever child.

*rare_hold_none - from `idle.js` (`'rare_' + tag`)*

## rare_hold_none  (whole)

- I had hands like that. Little ones. I remember bein' put out about how little they were, an' now that's the only thing I remember about 'em at all.

*rare_hold_weapon - from `idle.js` (`'rare_' + tag`)*

## rare_hold_weapon  (whole)

- Mine was silver. Somebody wrapped it up like it was a secret an' it purely was not, everybody knew. Still had it at the end. Got no idea where it went.

*rare_loc_above - from `idle.js` (`'rare_' + tag`)*

## rare_loc_above  (whole)

- I remember weather. Not the cold or the wet, just - that it happened, an' that I was out in it. That's 'bout all that's left.
- There was a castle. There was a siege. I was real small an' then I wasn't anything. Anyway - what're you makin'?

*rare_loc_below - from `blade_voice.js` (`t === 'low' ? 'low_push' : (t === 'medium' ? 'medium_test' : 'high_sil`), `idle.js` (`'rare_' + tag`)*

## rare_loc_below  (whole)

- Don't go all the way down. There's somebody down there'd want to see you, an' I'd rather she didn't.
- She raised me. Her an' Momma Pille. I called her Uggo the day we met an' she ain't never once let me forget it.

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

## near_art  (whole)

- That one's Kayer's! Oh, tell her I said hey. Tell her I said hey TWICE.
- Kayer's. Tell Short I said hey. She lets on she hates that. It's our little thing.
- - an' that's the Matriarch's, which means they're clever an' cold an' they didn't pick either of those, she did.
- She ain't never once written back. I keep sendin' things anyhow, it ain't a chore.
- Be kind to that one. She ain't. Somebody oughta be.

## near_salvage  (whole)

- Oh, that one owes somebody somethin'. They all do. That's the whole arrangement over there.
- - careful, that one'll trade you somethin' you needed for somethin' you wanted.
- The hound's. I like her, matter of fact. She's loud an' she don't never pretend she ain't.

## near_wall  (whole)

- Hers. Don't let her hear I said this, but I reckon she means well. Mostly.
- - an' that one ain't been allowed to go anywhere on their own in weeks, poor thing.
- The spider's. Wave. Don't get no closer than wavin'.
- Tell her she ain't a copy of anybody. She'll know what I mean. She won't believe me, she never does.
- I like her. Everybody's got a reason not to an' I ain't never been able to find mine.

