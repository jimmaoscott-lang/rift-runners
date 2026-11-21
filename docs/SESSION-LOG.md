# Session Log

Newest entry at the top. Each session adds one entry.

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
