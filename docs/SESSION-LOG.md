# Session Log

Newest entry at the top. Each session adds one entry.

---

## Session 11: November 21, 2026 (M5b Azure pronunciation check)

**Built**
- Speech checker: a small Cloudflare Worker (`worker/speech-worker.js`) that holds the Azure key and asks Azure Pronunciation Assessment how each sound of the word was said. It stores nothing. GitHub puts it online and copies the Azure key from the GitHub Secret, so the key never touches the repo or the game. It goes live once Mr. Scott adds one GitHub Secret (steps below).
- Speak mode uses Azure first. The game records only while the student talks (stops 0.7 seconds after the voice stops), sends about 1 second of sound, and scores the vowel strictly and the consonants gently (DESIGN.md 6, Azure scoring). Chrome's recognizer listens at the same time, so if Azure is blocked, busy, out of free hours or slow, Chrome's answer is used and the student never repeats the word.
- With Azure up, pin, pen, ten, win and the other short i or e before m or n words get the Say it button again. Runes get it in Test mode only, for trying.
- Test mode readout on every spoken word (match or miss): which checker answered, the vowel's score, what it sounded most like, and the other sounds' scores. These numbers tune the scoring.
- Microphone test in Settings now says whether the pronunciation check is on.
- Checker trouble never counts against a student: "The checker missed that one" (say it again) or "Speak mode cannot check this word right now" (use the choices).
- Version v0.6.0.

**Tested (by Claude, headless Chrome with a fake mic and a stand-in for Azure running the real Worker code)**
- Right read of pin: match. Pin said as "pen": match (Gulf Coast rule). Pin read as "pan" and sit read as "sat": miss, with letter tiles. Accented pin (vowel closer to "peen", weak consonants): match. Silence: "caught no word." Busy (free hours out): switches to Chrome, pin goes back to tap only. Slow answer and checker offline: falls back, then Azure turns off for the visit. Stopping mid-listen leaves the mic closed. No console errors. Decodability check passes.
- Not testable here: the real Azure service, a real voice, and the school network.

**Setup (Mr. Scott, one time, about 5 minutes)**
1. Go to dash.cloudflare.com and sign in (the account that has sped-lessons).
2. Click your profile icon (top right), then **My Profile**, then **API Tokens**, then **Create Token**.
3. Next to **Edit Cloudflare Workers**, click **Use template**. Under **Account Resources**, pick your account. Under **Zone Resources**, pick **All zones**. Scroll down, click **Continue to summary**, then **Create Token**. Copy the token (it shows only once).
4. Go to https://github.com/jimmaoscott-lang/rift-runners/settings/secrets/actions and click **New repository secret**. Name: `CLOUDFLARE_API_TOKEN`. Paste the token. Click **Add secret**.
5. Go to https://github.com/jimmaoscott-lang/rift-runners/actions, click **Speech checker** on the left, then **Run workflow**, then the green **Run workflow** button. Wait for the green check (about 1 minute).
6. Open https://rift-runners-speech.jimmaoscott.workers.dev/health. It should say `"ok":true`. If the page does not load or says false, tell Claude what it shows.

**Setup done (Nov 21, 2:34 pm):** token added, the checker is online at rift-runners-speech.jimmaoscott.workers.dev with the Azure key. Notes for next time: the token needs Workers Scripts Edit and Account Settings Read on his account (editing a token in Cloudflare's new screen clears its permission boxes), and the Cloudflare account ID is now in `worker/wrangler.toml`.

**To test (Mr. Scott)**
1. After setup, open https://jimmaoscott-lang.github.io/rift-runners/ on a Chromebook. Settings, Microphone test: the bottom line should say "Pronunciation check: Azure on."
2. Teacher, Test mode On. Play Level 3. Press Say it on pin, pen, ten or win, plus a few others.
3. Read some right, some with the wrong vowel (say "pan" for pin), and say nothing once. Each spoken word shows a readout in orange.
4. Tell me: any right read called wrong, or wrong read called right? Send the readout line for those. Also: does the answer feel fast enough?
5. At school (after Thanksgiving): run the microphone test on a student Chromebook to see if the district network lets the checker through.

**Mr. Scott's test (Nov 21):** Azure is on. Every real word he read right was accepted, including pin, pen, ten and win, and every wrong vowel was caught. The rune "pid" never passed: Azure guessed it as "peed" with extra sounds. Fix (v0.6.1): runes are tap only again, in Test mode too.

**Next up**
- Watch Test mode readouts during classroom use; tune `game/data/speech.json` if a right read fails.
- Then M6, full arsenal (Vine Snare, Ballista, Healing Shrine, Barricade, upgrades, hero, Armory). Start the chat with Opus for the plan, which hands the new defenders to Sonnet.

**Open questions**
- If the Worker address is not `rift-runners-speech.jimmaoscott.workers.dev` (Cloudflare picks the middle part per account), the health check in step 6 fails and the game quietly stays on Chrome. Tell Claude the address the Actions run printed and it is a one-line fix.
- Free hours: 5 a month covers about 15,000 spoken words. If a full class plays every day, it may run out late in the month (the game falls back to Chrome on its own). Standard S0 with a spending cap is the fix if that happens.
- Still open: forgotten teacher PIN reset (M10), progress between phone and Chromebook (DESIGN.md 15, item 0).

---

## Session 10: November 21, 2026 (M5 speak mode, teacher PIN, test mode)

**Built**
- Speak mode in the Rune Forge. Real words get a green **Say it** button (or the M key). Read the word into the mic: a match pays +15 crystals (tap pays +10) and counts toward the rift locks. Runes stay tap only.
- Speak misses: first miss breaks the word into letter tiles, second miss says "Listen, then say it" with the word and lights the right choice. Battle sound drops while the mic listens.
- If the mic is blocked or offline, choices show right away and the game says why. Tap mode always works.
- **Speak first** setting (0 to 3): the tap choices stay hidden until the student has made that many voice tries on a word. "Tries until the sound choices show" counts down.
- **Teacher** button in Settings with a 4-digit PIN (made the first time, typed twice). Inside: Speak first, Lock Speak first, Test mode, Change PIN. Locked, students see Speak first with a lock and "Your teacher set this one."
- **Test mode** (Mr. Scott's request): opens every level and defender for testing. The map shows an orange "Test mode: all levels open" tag. Levels 4, 5 and the boss still say "coming soon."
- Reading decision: before m or n, "pin" and "pen" both count as a match in speak mode (Gulf Coast speech), so dialect is never scored as a decoding miss.

**Tested (by Claude, headless Chrome with a fake mic)**
- PIN setup by keys and by taps, wrong PIN, lock, test mode opening all 6 stones, Level 3 started from test mode.
- Speak first at 2: choices hidden, a match pays +15 and logs a first-try read in speak mode, two misses bring the choices back, a later match pays the small amount, a blocked mic shows the choices at once. No console errors. Decodability check passes.
- Not testable here: a real microphone. That needs Mr. Scott.

**To test (Mr. Scott)**
1. Wait about 10 minutes after this push (new voice lines), then open https://jimmaoscott-lang.github.io/rift-runners/ on a Chromebook.
2. Settings, Teacher. Make a PIN you will remember, type it twice. Turn Test mode On. Set Speak first to 1. Back out.
3. On the map, every level is open. Play any level. Press Say it and read the word. Chrome will ask to use the mic the first time: press Allow.
4. Try reading a word right, reading it wrong, and saying nothing. Check the crystals and messages make sense.
5. Turn Test mode Off before students play.
6. Tell me: does the mic catch the words quickly enough, and does it ever take a wrong read as right?

**Fix (Mr. Scott's report):** speak mode would not take "win" or "ten." Chrome writes some words with another spelling for the same sound: "10" for ten, and "when" for win (they sound alike in Southern speech). Each word in `world1.json` can now list those spellings in `sayAlso` (win: when, ten: 10, sun: son, mix: mics, wet: whet, bus: buss). In Test mode, a speak miss also shows what Chrome heard, so any other stuck word can be reported and added. Version number on the title screen fixed (an old line kept it at v0.4.0); this fix is **v0.5.1**.

**Fix 2 (Mr. Scott's report, v0.5.2):** "ten," "pen" and "pin" got "The mic caught no word," meaning Chrome sent back nothing at all. The Forge now listens the same way the microphone test does (keeps listening through short pauses, up to 6 seconds, and waits a moment after a wrong guess in case a better one follows). Test mode now also shows what the mic noticed on a miss: whether the mic turned on, heard sound, heard speech, and any error. If these words still fail, that readout tells us whether Chrome is hearing the voice and refusing the word, which would point to Azure pronunciation checking for short -en and -in words.

**Fix 3 (v0.5.3):** the readout showed mic yes, sound yes, speech yes, heard nothing, on win, ten and pen. Chrome hears the voice but will not name these words. Decision: short i or short e before m or n is tap only in speak mode (DESIGN.md 6). The words stay in the game. Mr. Scott asked whether this blocks later levels: it does not. Most short words work in Chrome (zip, rob, jet, jab, top, log). Any other word that fails can be marked `noSpeak`. A stronger checker (Azure pronunciation checking through a small key-holding server) is the long-term option, and it would also let runes be spoken; planned as an M5b decision after classroom mic testing.

**Decided (Mr. Scott, end of Session 10):** make Azure pronunciation checking the default for speak mode, with Chrome as the fallback when Azure is blocked, over its free hours, or busy. His Speech resource (reading-fluency-speech, East US) is Free F0, so it costs nothing; when the 5 free audio hours a month run out or too many students speak at once, the game falls back to Chrome. Moving to Standard S0 with a spending cap is a later option if class use needs it.

**Next up**
- **M5b: Azure pronunciation check** (start with Opus). The key must never be in the public repo, so build a small Cloudflare Worker (free) that holds the key and forwards a short recording to Azure Pronunciation Assessment. Walk Mr. Scott through putting the key into the Worker. Game: record the word, send to the Worker, score by phonemes (this should bring back pin, pen, ten, win and allow spoken runes); fall back to Chrome on any error or slow answer. Test on the school network early.
- Then M6, full arsenal (Vine Snare, Ballista, Healing Shrine, Barricade, upgrades, hero, Armory). Start the chat with Opus for the plan, which hands the new defenders to Sonnet.
- If the mic is too loose or too slow on Chromebooks, fix that first.

**Open questions**
- Forgotten teacher PIN: today the only reset is clearing site data, which also clears progress. A reset that keeps progress could come with teacher reports (M10).
- Still open: moving progress between phone and Chromebook (DESIGN.md section 15, item 0).

---

## Session 9b: November 21, 2026 (battle sound and music)

**Asked by Mr. Scott:** weapon sounds and music during attacks. He listened to the sample page (https://jimmaoscott-lang.github.io/rift-runners/sound-samples.html) and approved it as is.

**Built**
- `game/src/audio.js`: all sounds and the music, made in code (no files). Arrows, arrow hits, Ember Cannon fire and boom, Lightning, Spike Pit, Golem slam, Frost shimmer, build, upgrade, each creature's death, shield break, Anchor hit, wave horn, wave clear, Mega Forge, rift closed.
- Battle music: calm while building, between waves and paused; attack during waves. Stops on the end screen and the map.
- Music and effects drop a little while a line is read, and low while a word is read.
- Settings: Voice, Music and Effects volumes.

**Tested (by Claude, headless Chrome)**
- Level 3 with 10 defenders through a wave: calm and attack music switch, sounds play, volume drop during speech, pause goes calm, music stops at the end. No console errors.

**To test (Mr. Scott)**
1. Wait about 10 minutes, open the game, play a level with sound on.
2. Check that Forge words are still easy to hear over the battle.
3. In Settings, try turning Music down to 0 and Effects up and down.
4. Tell me if anything is too loud, annoying after a while, or missing.

**Fix (Mr. Scott's report):** filling every rift lock before wave 1 still meant playing waves 1 and 2 first, but the message said "The final wave is coming," which looked like a glitch. The minimum waves stay. Now the message names the final wave ("Hold out until the final wave: wave 3"), it is also said at the start if the locks are already full, and the wave counter shows "Wave 1 of 3".

**Next up**
- M5 speak mode, starting with Opus. Include Mr. Scott's Speak first setting (DESIGN.md section 6, item 2): 0 to 3 voice tries before the tap choices show, set by the student or locked by a teacher PIN.

---

## Session 9: November 21, 2026 (M4 World 1 map, Levels 2 and 3, growth screen)

**Built**
- World 1 map. Play on the title screen now opens it. Six stones on a trail: Thornwood Edge, Bramble Crossing, The Hollow Trail, Wisp Hollow, Old Watch Ruins, and the Thorn King. Beaten stones turn gold with their best stars, the next one glows, the rest are chained. Star count out of 18 at the top. The Dunes (World 2) and Frostfang Pass (World 3) sit under fog. Tap a stone or its name for its card, then Play. Every line has a speaker.
- Level 2, Bramble Crossing: short a, i and o. New creature: Bramble Swarm (tiny, fast, big packs).
- Level 3, The Hollow Trail: short a, i, o and e. New creature: Shield Brute (its shield blocks most damage until broken).
- Ember Cannon (lobs fire shells, splash damage, breaks shields) opens after Level 1. Lightning Spire (jumps between creatures, breaks shields) opens after Level 2. Every defender shows in the build bar; locked ones say which level opens them.
- The first time a new creature shows up, a short line says what beats it.
- End screen: a "Then and now" box with each sound's first tries ever compared with now, a big headline for the biggest gain, and an Unlocked box on a first win. Win buttons: Continue (back to the map) and Play again. Lose: Try again and World map. Pause menu now goes back to the map.
- Reading decision: once a rift lock fills during a try, it stays full for that try. Strong readers were stuck waiting for 3 or 4 locks to all be full at the same moment.

**Tested (by Claude, headless Chrome)**
- Fresh start to map, Level 1 win, unlock box, Continue to map with Level 2 open, Level 2 and 3 battles, pause to map, Spanish map and battle. No console errors. Decodability check passes.
- Simulated players: 90% readers win Level 2 in 6 to 11 minutes and Level 3 in 7 to 11. A player who never reads loses by wave 3 or 4. 80% readers usually win Level 2 and fall around wave 15 on Level 3 with a practice summary. 70% readers survive at least 6 waves on every level.

**To test (Mr. Scott)**
1. Wait about 10 minutes after this push (new voice lines), then open https://jimmaoscott-lang.github.io/rift-runners/ and press Play. You land on the map.
2. Your saved progress carries over. If you already won Level 1, Bramble Crossing is open and Ember Cannon is in your build bar.
3. Play Level 2. Watch the Bramble Swarms and try an Ember Cannon on them.
4. Win Level 2, read the end screen (Then and now, Unlocked), press Continue, and play Level 3 with Lightning Spires against the Shield Brutes.
5. Tell me: does the map look good enough for the December 2 demo, and are Levels 2 and 3 fun, too hard or too easy?

**Next up**
- M5: speak mode in the Forge (read the word into the mic for a bonus; tap mode stays). Start the chat with Opus (mic matching rules and plan), which hands the screens to Sonnet.
- Or, if the map or Levels 2 and 3 need changes after playtesting, do those first.

**Open questions**
- Still open: moving progress between phone and Chromebook (DESIGN.md section 15, item 0).

---

## Session 8: November 21, 2026 (word voice, build manager)

**Decided (Mr. Scott)**
- Forge words now use the Andrew voice (reading guide). Guy blurred short a. Guy stays the narrator for menus and story lines.
- Claude acts as build manager in every session and assigns tasks to Haiku, Sonnet or Opus. Rules added to CLAUDE.md.

**Built**
- `game/data/voices.json`: reading guide set to Andrew. GitHub re-voices every Forge word after this push.

**To test (Mr. Scott)**
1. Wait about 10 minutes, refresh the game, and listen to the Forge choices.

**Next up**
- M4: World 1 map with locks and stars, Level Clear growth screen, Levels 2 and 3, defender unlock order. Start the chat with Opus (planning and map design), which hands parts to Sonnet and Haiku.

---

## Session 7: November 21, 2026 (Forge sounds fixed)

**Mr. Scott's playtest:** on "yat" two choices sounded the same and the right answer seemed marked wrong; "pin" and "pen" sounded alike; on "hit" the choices were hard to understand.

**Cause:** the wrong choices used vowels too close to the right one (yat/yet, pin/pen), the computer voice blurs short vowels in a single word, and short i and short e sound the same before m and n in Gulf Coast speech.

**Fixed**
- New rule for the two wrong choices: vowels that sound far apart (DESIGN.md section 6). Example: pin now comes with pan and pun; hit with hat and hut; yat with yit and yut. All 52 words updated.
- The decodability checker now refuses short i and short e as a pair before m or n.
- Every Forge word is re-voiced 25% slower with a short pause first so the start is never cut off. GitHub makes the new files after this push (a few minutes).
- New page to pick the clearest word voice: https://jimmaoscott-lang.github.io/rift-runners/sound-check.html (8 voices saying the same Forge choices).

**To test (Mr. Scott)**
1. Wait about 10 minutes, then refresh the game and play. Listen to the 3 choices on several words.
2. Open the sound-check page, play each voice, and tell me which one is clearest. I will switch the Forge words to it.

**Next up**
- Switch the word voice to Mr. Scott's pick, then M4 (World 1 map).

---

## Session 6: November 21, 2026 (waves until mastery, mastery summary, Golem fix)

**Asked by Mr. Scott:** phone play, waves until mastery or defeat, Stone Golem too strong, a mastery summary after every level, and progress that follows a student between phone and Chromebook.

**Built**
- Waves now keep coming, bigger each time, until the student masters the level's sounds or the Anchor falls.
- Rift locks panel (bottom left of the battle): one lock per vowel in the level (a and i in Level 1). A lock fills when 9 of the student's last 10 reads of that vowel are right on the first try with no speaker help. All locks full means the final wave comes (after at least 3 waves). Survive it to win.
- Lock progress comes from the saved progress record, so a lost level still counts and the next try starts where the last one ended.
- New end screen, win or lose: each lock with the last 10 reads as colored blocks, this try's first-try count, runes on their own line, Words to practice (tap to hear), words forged, first-try percent, waves survived, and first try compared with last time.
- Stone Golem can now be broken: less health, creatures hit it harder, it barely heals, and it takes 14 seconds to rebuild.

**Tested (by Claude, headless Chrome)**
- Locks fill and empty correctly, final wave triggers, win and lose summaries. No console errors.
- Simulated players: 90% first-try readers win in 4 to 9 waves (5 to 10 minutes). A reader stuck near 60 to 70% loses around wave 13 (about 15 minutes) and sees what to practice. Never reading loses in wave 3.
- Phone check: held sideways, every button and word shrinks to about half size, too small to tap or read. Upright, the battlefield is cut off.

**To test (Mr. Scott)**
1. Play Level 1. Watch the Rift Locks panel fill as you read right on the first try.
2. Use the speaker on a word, or miss on purpose, and watch the lock drop back.
3. Lose once on purpose, then press Try again: the locks should still be partly full.
4. Read the summary screen as a student would. Tell me what to add or cut.

**Next up**
- M4: World 1 map (like the map mockup) with every level shown, locks and stars, the Level Clear growth screen, Levels 2 and 3 (Bramble Swarm, Shield Brute, short o and short e), and the defender unlock order.

**Decided after the session (Mr. Scott)**
- Phone layout waits until the full game is set up. Added as milestone M12 in DESIGN.md and on the progress page.

**Open questions**
- Moving between phone and Chromebook: (A) sync through a Google Sheet on his district account with a student code and PIN, the same path the teacher reports need (M10); or (B) a save code the student types on the other device, which carries levels and locks but not full history. Recommended: A.
- Are students allowed to play on phones at school, at home, or both?

---

## Session 5: November 21, 2026 (M3 Hold the Rift core)

**Built**
- The game now runs on three.js in 3D. Phaser and the old turn-based battle are gone.
- Title screen over a slowly circling Thornwood, language pick, Settings and the microphone test, all rebuilt with a speaker on every line and button.
- Play opens the Level 1 card (Thornwood Edge: 5 waves, Thornbacks and Rift Wisps, short a and short i plus runes, win reward), then the battle.
- Battle, matching the mockup: crystal counter, wave counter, level name, Start wave, Pause, x2 speed, the Rift and Rift Anchor labels, health bars, damage numbers, crystal pickups.
- Rune Forge in tap mode: the word, 3 sound buttons, Forge button that shows the payout, streak meter with 8 pips, Mega Forge (+100 and a light blast that hits every creature), recent forges list (tap a word to hear it). Misses: letter tiles with the vowel in gold, then the right sound glows. No crystals lost. Guessing guard: 3 fast wrong answers, or 3 on the same button, cools the forge for 5 seconds (10 after that). Spanish on: each forged word shows its Spanish meaning with a speaker, and cognates get the "you already know this one" line.
- Defenders: Archer Tower, Spike Pit, Stone Golem, Frost Totem, each with 3 levels plus Sell. Build from the bar (pick, then tap a glowing spot) or tap an empty spot to get a build menu. Locked defenders show in the bar with the level that opens them.
- Creatures: Thornbacks and Rift Wisps in 5 waves that get bigger and tougher. Win shows 1 to 3 stars. Lose gives a calm tip and Try again.
- Focus setting: battles run at half speed. Pausing stops the battle but the Forge stays open, so a student can always read their way out.
- Every forge and every level result is saved in the progress record on the device.
- Level and balance numbers live in `game/data/levels-w1.json` and `game/data/units.json`.

**Tested (by Claude, headless Chrome)**
- Full flow in English and Spanish: language, title, level card, building by bar and by tapping a spot, upgrade, sell, forging by mouse and keyboard, both miss steps, Mega Forge, the guessing cooldown, pause, Settings during a battle (Extra large text and OpenDyslexic), win screen, lose screen, Try again. No console errors.
- Balance with a simulated player: never reading loses in wave 3; a slow reader (5 words a minute, 70% first try) wins; stronger readers win with crystals to spare. A level takes about 5 to 8 minutes.
- New voice lines could not be heard here. GitHub voices them after this push; until then the Chromebook voice fills in.

**To test (Mr. Scott)**
1. Wait about 5 minutes after this push, then open https://jimmaoscott-lang.github.io/rift-runners/ and press Play, then Play again on the level card.
2. Read a few words in the Forge, build an Archer Tower, then press Start wave 1.
3. Try both ways to build: tap a card in the bottom bar then a glowing spot, or tap an empty stone pad.
4. Tap a tower you built to upgrade or sell it.
5. Play the whole level. Tell me if it feels too easy, too hard, too long or too short, and whether the screen is too busy for your students.
6. Turn on Español in Settings and forge a few words to see the Spanish meanings.
7. If you have a Chromebook at home, check whether it runs smoothly. If it stutters, add ?low to the end of the address and tell me if that helps.

**Not done yet**
- World map and level unlocks (M4). Level 1 lets you build all four defenders for now.
- Hero powers, upgrade specialties, Armory (M6). Speak mode (M5).
- Spanish lines still need a quick check by a Spanish speaker.

**Next up**
- M4: World 1 map (like the map mockup) with every level shown, locks, stars, and the Level Clear growth screen. Levels 2 and 3 with Bramble Swarm and Shield Brute, the unlock order from DESIGN.md 6A, and the vowel ramp (Level 2 adds short o, Level 3 adds short e).

**Open questions**
- None blocking.

---

## Session 4: November 21, 2026 (redesign: Hold the Rift)

**What happened**
- Mr. Scott playtested the M2 battle. Length and voice were fine, but the gameplay was not fun: turn-based questions with no action. His students would quit in 2 minutes.
- Claude studied his games (Huddle Up and Studio '68 in `classroom-games`, The Exiled Crown / Hold the Keep in `castlebuildermapsanditems`). What they share: every answer pays out right away, answers power an action layer, and students build something of their own.
- New gameplay: **Hold the Rift**, a 3D tower defense. Reading in the Rune Forge makes crystals; crystals build defenders; defenders fight rift creatures in real time. Big world map with every level visible and locked until the one before is beaten. Levels get harder in both creatures and reading. DESIGN.md sections 3 to 7 rewritten; milestones renumbered.
- Engine changes to three.js (same as The Exiled Crown) for low-poly 3D. Phaser retires.
- Mockups: `mockups/hold-the-rift.html` (`?view=battle` and `?view=map`) with screenshots `mockups/hold-the-rift-battle.png` and `mockups/hold-the-rift-map.png`. All models are original, built from shapes in code.

**Carries over from M1 and M2:** word bank, voices, decodability checker, heart words, Spanish lines, settings choices, progress record, the "pick the matching sound" reading check (now the Forge).

**To review (Mr. Scott)**
- Look at the two mockup pictures. Mark anything about the look, the defender list or the map to change.

**Next up**
- M3: Hold the Rift core. Thornwood map, trail, waves of Thornbacks and Wisps, Rune Forge in tap mode, Archer Tower, Spike Pit, Stone Golem, Frost Totem, crystals, win and lose. Title screen and settings move over to the new engine.

**Open questions**
- None blocking. World names in DESIGN.md 4.1A are now in use; change any time.

---

## Session 3: November 21, 2026 (M2 first battle, tap mode)

**Built**
- Play on the title screen now starts a real battle: "A Thornback blocks the trail." Thornback is an original pixel bramble beast with a rift crack in its back, drawn in code, in a pixel forest.
- Each turn: pick one of 3 move cards (2 real words, 1 gold "Rune" word that hits harder). Then pick which of 3 sounds matches the written word and press Cast. The wrong sounds change only the vowel (cup, cop, cap), so the student has to read the vowel.
- Miss support: first miss shows the word as letter tiles with the vowel in gold and says "Let's break it up. Listen to the middle sound." Second miss makes the right answer glow. No failure sounds, no player damage, no timers.
- Every word has a speaker. Hearing a move's word before casting counts as help (smaller hit).
- Encouragement that names what happened: first try, rune cracked, three in a row, five in a row, second try landed.
- Spanish on: each hit shows the Spanish meaning with its own speaker, and cognates get "Esta ya la conoces."
- Win screen: words read and first-try count, big and tappable. Battle again or Title screen.
- Progress record on the device (`game/src/metrics.js`): play sessions, every word attempt (word, vowel pattern, real or rune, tries, help, time), each battle, support use. New and missed words come up more often next time. Nothing is sent anywhere yet.
- `game/data/world1.json`: 40 real words (8 per short vowel), 12 runes, answer options, Spanish meanings.
- `game/data/heart-words.json`: heart word lists for all 8 worlds (World 1: a, I, the, to, of, is, was).
- `tools/check_decodable.py`: checks every word against the World 1 rules and a hidden list of crude words. Runs on every push and stops the deploy if anything fails. 156 words pass.
- `tools/voice_lines.py` now also voices every battle word with Azure, spelled as sounds so runes are said the way they are written.

**Tested (by Claude, headless Chrome)**
- Full battles on the website and the offline file, in English and in Spanish with Extra large text and OpenDyslexic. No errors.
- First miss, second miss, reveal, rune hits, streaks, win screen, Battle again.
- Keyboard only: Tab, arrows, Enter, Esc through a full turn.
- Progress record survives a page reload.
- Word voices could not be tested here: GitHub makes them after this push. Until then the Chromebook voice fills in.

**To test (Mr. Scott)**
1. Wait about 5 minutes after this push, then open https://jimmaoscott-lang.github.io/rift-runners/ and press Play.
2. Tap the 3 speakers on the answer side. Listen for clean short vowels, especially on gold Rune words (like "jom" or "vep"). Write down any that sound wrong.
3. Miss on purpose twice to see the support steps.
4. Switch to Español in Settings and win a battle.
5. Download a fresh offline copy for the December 2 backup.
6. Tell me if a battle feels too long or too short (it takes about 8 words now).

**Not done yet**
- Speak mode (M3).
- Small font glitch: in OpenDyslexic regular, an accented ó (like "pegó") draws its accent off to the side. Bold looks fine. Fix later.
- Spanish battle lines need the same quick check by a Spanish speaker.

**Next up**
- M3: speak mode for the same battle. Read the word into the mic; lenient matching for accented speech; tap mode stays one tap away. Follow the mic rule in DESIGN.md section 10.

**Decided after the session (Mr. Scott)**
- Hearing a word first counts as help with a smaller hit (as built).
- Reading instruction choices are left to Claude. First call: final blends like "bend" wait for World 2. Recorded in CLAUDE.md and DESIGN.md.
- Hold off on the all-in-one file. It is built by GitHub at no Claude cost, so it keeps building, but Claude stops testing it each session and checks it once before December 2. It will not work for the full game (8 MB already); see DESIGN.md section 13.
- New build progress page: https://jimmaoscott-lang.github.io/rift-runners/progress.html (percent done, sessions left, December 2 demo mark). Data in `progress.json`, updated every session.

**Open questions**
- Still open from Session 2: world names in DESIGN.md section 4.1A.

---

## Session 2: November 21, 2026 (M1 game skeleton)

**Built**
- The game runs: `game/index.html` with Phaser 3.90 stored in the repo (`game/lib/`), so nothing loads from other websites.
- First launch screen: pick English or Español (each prompt and button has a speaker).
- Title screen: game logo, tagline, Play and Settings, scrolling pixel mountains and stars. Play shows a "World 1 opens in the next update" message for now.
- Settings: language, text size (3 sizes), font (Lexend or OpenDyslexic), volume, motion (full or reduced), microphone test. Every row has a speaker. Saves on the device.
- Microphone test screen: tells you plainly whether speak mode can work in that version of the game (website, offline file, Apps Script).
- Keyboard play on every screen (arrows, Tab, Enter, Esc).
- All menu text lives in `game/data/strings.json`. Read-aloud plays pre-made Azure voice files, with the Chromebook voice as backup.
- `tools/voice_lines.py`: voices every menu line with the narrator voices (Guy, Jorge) on each push. First run voiced all 70 lines; they are live in the game.
- `tools/build_single.py`: builds the all-in-one file (about 3 MB, code, fonts and voices packed inside).
- `.github/workflows/deploy.yml`: on every push to main it voices new lines, builds the all-in-one file and publishes the website.
- `assets/CREDITS.md` started (Lexend, OpenDyslexic, Phaser).

**Tested (by Claude, headless Chrome)**
- Website version and offline file both load with no errors.
- Language pick, title, settings at all 3 text sizes, both fonts, Spanish, message box, mic test screen.
- Settings survive a reload. Voice files play in both versions.
- Mic test in the offline file reports "blocked" in the test browser and falls back cleanly. Real result needs a real Chromebook.

**To test (Mr. Scott)**
1. Play link: https://jimmaoscott-lang.github.io/rift-runners/ (live a few minutes after the push).
2. Pick a language, tap the speakers, open Settings and try each option.
3. Settings > Test microphone. Press Start, say "sun." Note what it says.
4. Download the offline copy from the link on https://jimmaoscott-lang.github.io/rift-runners/ and open it from your laptop with Wi-Fi off. The file is named rift-runners-offline.html. Keep it for the December 2 backup. Download a fresh copy after each session.
5. At school (after Thanksgiving): try the play link on a student Chromebook.

**Mic test fix (same session)**
- First real test: the mic test said no words came through.
- Added a live sound meter and a step-by-step check. The result now tells apart: mic never turned on, mic on but silent (wrong mic or muted), or sound heard with no words caught. Partial words now count too.
- His retest showed the old test code: Chrome kept the old scripts from its cache. Each deploy now stamps the scripts with the update number so browsers load fresh code. The mic test also shows a status line (mic on, sound, speech, level, error, version).
- Retest result (Chrome on his Windows laptop): Mic on yes, Sound no, Level 0, error no-speech. Chrome opens the mic but gets silence, so the wrong input device is picked or it is muted. The game code is working.
- Fixed: going Back and reopening the mic test lost the sound meter until a page refresh.
- Cause of the silence: the laptop mic was muted with its F5 key. After unmuting, Chrome caught "sun" once in many tries (two adults, loud and close). After the meter stopped changing the mic's audio (v0.1.4), Chrome caught "sun" instantly at low volume and caught long phrases too. Speak mode works on the website in Chrome. See DESIGN.md section 10.

**Not done yet**
- Mic test still to run in the offline file and in Apps Script.
- The Apps Script version is built but not set up in a Google account. That needs 5 minutes together in a session (copy two files into a new Apps Script project and deploy). Then run the mic test inside it.
- Spanish menu lines need a quick check by a Spanish speaker.

**Next up**
- M2: first battle in tap mode with World 1 words, tap any word to hear it, metrics saved on the device from the first battle. Also start `game/data/heart-words.json` and the decodability checker in `tools/`.

**Decisions made**
- Game title is **Rift Runners** ("The worlds are breaking. Run."). Mr. Scott wants no name that points at reading or a reading deficit. Names come from the adventure, like "Escape from Witch Mountain." Rule added to DESIGN.md section 4.1A, with world name ideas to approve.

**Open questions**
- Approve or change the world names in DESIGN.md section 4.1A.
- Repo renamed to rift-runners (done 11/21). Play link is now https://jimmaoscott-lang.github.io/rift-runners/

---

## Session 1: November 21, 2026

**Built**
- `CLAUDE.md` with project directions for every future session
- `docs/DESIGN.md` draft 1: game style (Zelda world + Pokémon battles + rhythm bosses, 16-bit pixel art), 8-world skill sequence, EB supports, accessibility, saving and privacy, milestones
- `docs/SESSION-LOG.md` (this file)
- README updated

**Decisions made**
- The game is not tied to any school subject. It is a standalone game students want to play.
- Students play through many levels and finish reading fluently.
- EB accommodations are built in.
- All project files live in this public repo. No student data goes in it.
- Browser game built with Phaser, hosted on GitHub Pages, aimed at school Chromebooks.
- Teacher reports: the game sends progress (by student code, no names) to a Google Sheet on Mr. Scott's district account through Apps Script. Reports cover starting level, play frequency, progress, accuracy by pattern, WCPM, trouble words and support use. See DESIGN.md section 12.
- Students get frequent, specific, growth-based encouragement and a simple growth graph on a Level Clear screen after every level. See DESIGN.md section 12A.
- Metrics are recorded from the first battle onward.

- Voice: Azure AI Speech (free F0 tier, East US) on Mr. Scott's Azure account. Key and region are GitHub Secrets `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`. Voice job: `.github/workflows/voice-samples.yml` running `tools/voice_samples.py`. First samples made in `assets/audio/samples/`. The free tier rate-limits fast requests (HTTP 429), so the script now waits and retries.

- Narrator voices chosen: English Guy, Spanish Jorge (Mexico). Saved in `game/data/voices.json`.

**To review (Mr. Scott)**
- Listen to the voice samples. Mark any voice to cut, and any voice that says the single sounds most clearly (best candidates for the reading guide). See DESIGN.md section 10 for the voice variety plan.
- Read `docs/DESIGN.md` and mark anything to change, especially the skill sequence in section 5 and the open questions in section 15.

**Next up**
- Goal: World 1 demo level ready for the district meeting on December 2 (see DESIGN.md section 14).
- M1: game skeleton. Title screen, Lexend font, settings menu (language, text size, font toggle, volume). Publish as the website AND as the single-file Apps Script version, and test the microphone inside Apps Script early.
- GitHub Pages is ON with Source set to GitHub Actions (done 11/21). M1 must add the deploy workflow. Mr. Scott: check whether github.io sites load on a student Chromebook at school.

**Demo plan for December 2**
- Mr. Scott is off Thanksgiving week, so there will be no Chromebook check at school before the meeting. Demo from the website.
- Backup if github.io is blocked on the district network: open the all-in-one HTML file straight from his laptop (works with no internet in tap mode; speak mode needs internet), or use a phone hotspot.
- Every M1 to M4 session must keep the all-in-one HTML file working so the backup stays ready.

**Open questions**
- See DESIGN.md section 15.
