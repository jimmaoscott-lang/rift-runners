# Game Design Document

**Title:** Rift Runners (chosen November 21, 2026). Tagline: "The worlds are breaking. Run."
**Status:** Draft 2, November 21, 2026 (gameplay redesigned as Hold the Rift)
**Owner:** Mr. Scott

---

## 1. Vision

A retro adventure game where reading is the player's power. High school students who read far below grade level play through 8 worlds. Each world quietly teaches one stage of decoding. Students who finish the game should be able to decode multisyllable words and read connected text with accuracy and fluency.

Students should experience it as a game they want to beat. The reading instruction is hidden inside the game's mechanics.

### Design pillars

1. **Reading is the weapon.** Every attack, unlock and score comes from reading. No question gates in front of the "real" game.
2. **Respect the player.** Looks and plays like a real teen game. Never babyish.
3. **No one gets stuck in shame.** Turn-based play, unlimited hints, read-aloud help on every word, no public failure.
4. **Built-in support.** Emergent bilingual (EB) and accessibility features are part of the core design, not add-ons.
5. **Replay is practice.** Systems reward replaying content, because repeated reading builds fluency.

---

## 2. Players

- High school students reading several grade levels below their grade, many with IEPs or 504 plans
- Many are emergent bilingual students whose first language is Spanish
- They have years of reading failure behind them and will drop anything that feels like a remedial program
- Devices: school Chromebooks in Chrome, often with shared headsets, in noisy classrooms
- Session length: designed for 15 to 20 minute play sessions

---

## 3. Game style (redesigned Nov 21: Hold the Rift)

**Why the redesign:** Mr. Scott played the M2 turn-based battle and called it: no action, students would quit in 2 minutes. His students stay with games where every answer pays out right away and the answers power an action layer (Huddle Up, Studio '68, The Exiled Crown / Hold the Keep). Rift Runners now follows that pattern.

**Core idea:** a 3D tower defense. Rift creatures pour out of a glowing tear in the world and march down a trail toward your camp's Rift Anchor crystal. Reading words in the **Rune Forge** makes crystals. Crystals build and upgrade defenders. The defenders fight in real time.

| Inspiration | What we take from it |
|---|---|
| Hold the Keep / The Exiled Crown | Answers become resources; resources become an army; low-poly 3D world; missions that build on each other |
| Kingdom Rush and other tower defense games | Paths, waves, placing and upgrading defenders, hero powers, stars per level |
| Studio '68 | Spend earnings on unlocks you choose; a reward you can see and play with |
| Huddle Up | A good read makes the action stronger; streaks matter |
| Super Mario Bros. 3 | A big world map with every level visible, each one locked until the one before it is beaten |

**Look:** low-poly 3D built with three.js (the same engine as The Exiled Crown, already proven on school Chromebooks), with a darker magic palette: glowing rift light, spell effects, particles. All models are original, built from simple shapes in code. Mockups: `mockups/hold-the-rift.html` (`?view=battle`, `?view=map`) and the screenshots beside it.

---

## 4. Structure

### 4.1 World map

- One big 3D map per world. Every level of the world sits on it as a stone on a trail, all visible from the start.
- Beaten levels turn gold and show 1 to 3 stars. The next level glows. Later levels are chained and locked until the one before is beaten. The next world sits under fog in the distance with its own rift.
- Each world: 5 levels plus a boss level (6 total). 8 worlds, 48 levels.
- Level card on the map: name, waves, new enemy, which word patterns, and the reward for winning. Every line has a speaker.

### 4.1A Naming rule

No name the student sees may point at reading or at a reading problem. The game, worlds, levels, abilities and rewards are named for the adventure, like a movie title (example: "Escape from Witch Mountain"). Words like read, word, letter, spell, phonics, level or fluency stay out of names. Reading is the power inside the game, never what the game is called. ("Level" appears only as a small label, like "Level 3", never as a name.)

World names: World 1 "Escape the Thornwood" (forest), World 2 "Dunes of the Dead Sun" (desert), World 3 "Frostfang Pass" (ice), World 4 "The Drowned Coast" (ocean), World 5 "Ashfall" (volcano), World 6 "Skyport Zero" (sky city), World 7 "The Sunken Vault" (ruins), World 8 "The Rift Core" (final fortress). World 1 level names: Thornwood Edge, Bramble Crossing, The Hollow Trail, Wisp Hollow, Old Watch Ruins, boss: The Thorn King.

### 4.2 Core loop (one level, about 8 to 12 minutes)

1. **Build phase:** start crystals plus the Forge. Place the first defenders. Press Start Wave when ready (no timer).
2. **Waves:** creatures march. Defenders fight on their own. The student keeps forging crystals, builds more, upgrades, and fires hero powers.
3. **Between waves:** a short breather. Forge, build, upgrade.
4. **Win** by surviving every wave. Stars: 3 = Anchor untouched, 2 = Anchor above half, 1 = survived.
5. **Rewards:** the next level unlocks, often a new defender or upgrade, skins for 3 stars, crystals carried to the upgrade bank.
6. **Level Clear screen** with growth (section 12A).

---

## 5. Skill sequence

A structured literacy sequence built for older readers. Each world adds to everything before it.

| World | Pattern | Example words | Ability unlocked (ideas) |
|---|---|---|---|
| 1 | Short vowels, closed syllables (CVC) | map, sit, mud, hop, jet | Dash |
| 2 | Consonant blends and digraphs (sh, ch, th, wh, ck, ng) | ship, chest, thump, crash, string | Grapple hook |
| 3 | Silent e (VCe) | make, ride, stone, cube | Swim |
| 4 | Vowel teams (ai, ay, ee, ea, oa, ow, oi, oy, ou) | rain, steam, float, coin, cloud | Glide |
| 5 | R-controlled vowels (ar, er, ir, or, ur) | storm, shark, burst, thirst | Fire breath |
| 6 | Syllable division and open syllables, consonant-le (VC/CV, V/CV, -ble, -tle) | basket, robot, tiger, candle, puzzle | Wall climb |
| 7 | Prefixes, suffixes and roots (un-, re-, pre-, -tion, -ment, -ful; port, struct, ject) | unlock, rebuild, motion, transport, construction | Teleport |
| 8 | Fluent reading of full passages; prosody and expression | Mixed text using all patterns | Final form |

**World 1 level ramp (decided by Claude, Nov 21):** Level 1 short a and i only (two vowels far apart in sound). Level 2 adds short o (a/o is a hard pair for Spanish speakers). Level 3 adds short e (i/e is the hardest pair). Level 4 adds short u. Level 5 mixes all five with more runes. Boss: short phrases and a short passage made only of World 1 words and heart words. Every later world follows the same shape: introduce the new pattern in small steps, then mix it with everything before.

**World 1 word rules (built in M2):** three letters, consonant + short vowel + consonant. No final r, w or y (they change the vowel), no c or g before e or i (soft sounds), and final blends like "bend" wait for World 2. Words live in `game/data/world1.json`.

**Heart words:** each world allows a small list of high-frequency irregular words (for example: the, was, said, of, to, you, they, were). Heart words are taught directly and stored in `game/data/heart-words.json`.

**Decodability checker:** `tools/check_decodable.py` checks every word and passage against the patterns taught so far plus allowed heart words, and flags anything that does not fit. All new content must pass it.

### 5.1 Mastery

- A pattern is mastered when the student reads pattern words with about 90% accuracy across at least two separate play sessions.
- Missed words come back more often (spaced review). Mastered words still appear occasionally so skills stay sharp.
- Earlier patterns keep appearing in later worlds as review.

### 5.2 Placement

The opening mission doubles as a placement check. It quickly samples each world's pattern with real words and runes, then opens the worlds the student has already mastered. The student sees it as a tutorial mission, never a test.

### 5.3 Comprehension strand (added Nov 21)

Decoding and fluency are needed for comprehension but do not finish the job (the Simple View of Reading: decoding times language comprehension). So meaning runs alongside the decoding sequence, always using only words the student can already decode plus heart words:

| Worlds | Comprehension work | Where it shows up in the game |
|---|---|---|
| 1 to 3 | Word meaning: match a word to a picture or a short meaning; Spanish meanings and cognates | Forge "meaning runes" that pay a bonus |
| 3 to 5 | Sentence meaning: read a short sentence, pick the picture or action it describes; who did what | Battle orders: "Freeze the big bat" read in the Forge triggers that action on the field |
| 5 to 7 | Short paragraphs: main idea, sequence, cause and effect, inference | Scout reports between waves warn what is coming; reading them right tells you which defenders to build |
| 6 to 8 | Longer story passages with questions on why and how | Rift Seal passages carry the story; 2 or 3 questions after the seal give a power bonus |
| 8 | Mixed connected text near the student's goal level, with vocabulary from roots and affixes | Final world story and boss seals |

The story itself (lore scrolls, character messages, boss taunts) is written in decodable text for each world, so reading pays off in the plot, too. Comprehension accuracy is recorded by question type (main idea, inference, sequence) for teacher reports.

---

## 6. The Rune Forge (where the reading happens)

Always on screen in a level, on the right side.

1. A word appears, big, in Lexend. Gold-edged **runes** are made-up words and pay double.
2. **Speak mode (the main way to play where the mic works):** the student just reads the word out loud. No choices to pick from, so no guessing, and saying the word is the real skill. It pays the most crystals. **Tap mode (always available):** three speaker buttons each say a word: the real one and two with a different vowel (sit, set, sat). The student picks the one that matches and presses Forge. Tap mode covers noisy rooms, shared headsets, shy students, no district mic approval, and anything the mic cannot check.
   - **Limit:** Chrome's speech recognizer turns sounds into real words, so it cannot judge made-up runes and may hear "set" as "sit." Runes stay in tap mode until a pronunciation checker (Azure Pronunciation Assessment or an on-device model) is tested in M5.
3. **Every forge pays right away:** crystals fly from the Forge into the crystal counter with a sound.
   - Real word, first try: +10. Rune, first try: +20.
   - Hearing the word first (speaker on the word) or second try: about half.
   - After the answer is shown: a small amount, so the student is never stuck.
4. **Streak meter:** first-try reads in a row fill 8 pips. A full meter is a **Mega Forge**: +100 crystals and a burst of light over the battlefield.
5. **Hero charge:** forging also charges the hero's powers.
6. **Misses:** no lost crystals. Letter tiles with the vowel in gold, "Let's break it up," then try again. The word comes back sooner next time.
7. **Recent forges list:** the last few words with what each one earned, so students see the reward and the words again.

**No timers on reading, even in battle.** The battle never waits on a timer to read a word, and Pause is always one tap away; the Forge stays open while paused. Students with extended time (and anyone who turns on Focus in Settings) get automatic slow motion while a word is up.

**Guessing (same rule as Mr. Scott's other games):** 3 wrong in a row that are each very fast, or 3 wrong in a row on the same button position. The Forge cools down for 5 seconds the first time and 10 seconds after that ("The forge is overheating. Read each one."). Correct answers are never flagged.

**Income balance:** crystals come almost only from the Forge. Defeated creatures drop a few shards, too few to win without reading. Later levels cost more, so students forge steadily all level. Target: 6 to 10 words a minute during play.

---

## 6A. Defenders

Placed on build spots beside the trail (towers) or on the trail itself (blockers and traps). Each has 3 upgrade tiers; tier 3 picks one of two specialties.

| Defender | Role | Unlocks |
|---|---|---|
| Archer Tower | Steady single-target damage, hits fliers | Start |
| Spike Pit | Trap on the trail, damages everything that walks over | Start |
| Stone Golem | Blocks the trail and holds creatures in place | Level 1 win |
| Frost Totem | Slows everything in its ring; tier 3 can freeze | Level 2 win |
| Ember Cannon | Splash damage on groups | Level 2 win |
| Lightning Spire | Chains between creatures; breaks shields | Level 3 win |
| Vine Snare | Roots creatures in place for a few seconds | Level 3 win |
| Ballista | Long range, extra damage to fliers and big creatures | Level 4 win |
| Healing Shrine | Repairs golems and barricades; slowly heals the Anchor | Level 4 win |
| Barricade | Cheap wall that blocks or reroutes on open maps | Level 5 win |
| Rift Mine (World 2+) | One-time blast on the trail | World 2 |
| Hawk Nest (World 2+) | Hawks hunt fliers anywhere on the map | World 2 |

**Hero:** one Rift Warden on the map, with 3 powers charged by forging: **Meteor** (big area blast), **Time Freeze** (stops a wave for a few seconds), **Rally** (defenders fire faster for a short time). More heroes unlock later, each with a different power set (like the rulers in Hold the Keep).

**Between levels:** the **Armory** spends banked crystals on permanent upgrades (stronger arrows, cheaper golems) and skins.

---

## 6B. Rift creatures

| Creature | Trait | First seen |
|---|---|---|
| Thornback | Tough, slow | World 1, Level 1 |
| Rift Wisp | Fast and fragile, comes in packs | Level 1 |
| Bramble Swarm | Many tiny creatures at once | Level 2 |
| Shield Brute | Shield blocks most damage until lightning or a cannon breaks it | Level 3 |
| Rift Bat | Flies over traps and blockers | Level 4 |
| Splitter | Splits in two when defeated | Level 5 |
| The Thorn King | World 1 boss: summons thorns, roots defenders | Boss |

Every later world adds its own creatures with new tricks (burrowers, healers, invisible stalkers, armored sky ships).

## 6C. How levels get harder

- **Creatures:** more waves, more creatures per wave, a new creature type every level, mixed types that need different defenders, stronger bosses.
- **Reading:** new patterns step by step (section 5), more runes, and later worlds use longer words and short phrases in the Forge.
- **Economy:** defenders cost more in later worlds, so steady forging matters.
- **Stars and replays:** 3 stars needs a clean defense. Replaying a level is extra reading practice.
- A level stays winnable for a student who reads steadily, even slowly. Speed of play is never required: Pause is always available.

---

## 7. Boss levels and the Rift Seal (fluency)

- The last level of each world is a boss: a big creature with special attacks, plus regular waves.
- To win, the boss must be beaten **and the rift sealed**. The **Rift Seal** is a short passage that scrolls karaoke style to a beat. The student reads along aloud (speak mode) or taps on the beat as each phrase lights up (tap mode). A good seal also blasts the boss.
- The student can always pick a slower tempo. Replays for higher ranks are repeated readings of the same passage.
- The game records words correct per minute (WCPM) on Rift Seal passages and shows the student their personal best rising over time.

## 8. Emergent bilingual (EB) supports

- **Spanish toggle** for instructions, menus, story text and the word glossary (default set by the student at first launch, changeable anytime)
- **Every word can be heard** in English. Glossary entries can also be heard in Spanish.
- **Picture support** for concrete words where possible
- **Cognate highlights:** Spanish-English cognates are marked (example: nación / nation, motor / motor) with a short "you already know this one" moment
- **Built in M2:** with Spanish on, every hit shows the word's Spanish meaning with its own speaker, and cognates (map / mapa, bus / autobús) get the "you already know this one" line
- **Targeted sound practice** for English sounds that are hard for Spanish speakers: short vowels (especially short i vs. short e, short a vs. short o), sh vs. ch, v vs. b, word-ending clusters (-sts, -mps), and silent e
- **Forgiving speech recognition:** accented pronunciation must not count as a miss. Matching is lenient, and tap mode is always available.
- Oral vocabulary support: short meanings for words the student may be able to decode but not know

---

## 9. Accessibility and IEP-friendly features

- Reading font: **Lexend** (OFL license), large and high contrast. Optional **OpenDyslexic** toggle.
- Read-aloud on any word, sentence or menu
- Adjustable text size and line spacing
- No time limits on learning content; speed only matters in optional score modes
- Hints are unlimited and never cost the player progress
- Reduced motion option and volume controls
- Full keyboard play: arrow keys and Tab move, Enter or Space picks, Left and Right change a setting, Esc goes back
- Read-aloud in menus: every line and button has its own speaker button. Picking an option in Settings also reads it aloud. Tapping single words inside a line arrives with the battle words in M2.
- Settings save on the device right away: language, text size (Normal, Large, Extra large), font (Lexend or OpenDyslexic), volume, motion (Full or Reduced). Motion starts at Reduced if the Chromebook's own reduced motion setting is on.
- Short sessions with a natural stopping point every few minutes
- Works with keyboard, mouse or touch

---

## 10. Speech and audio

- **Speech recognition finding (Nov 21 mic tests):** Chrome's built-in recognizer catches single short words like "sun" right away, at low volume, a foot or two from a laptop mic, and also catches longer phrases. An early test failed only because the game opened a second copy of the mic with Chrome's audio cleanup turned on, which spoiled the sound the recognizer got. Rule for M3: when speak mode is listening, any other use of the mic (like a sound meter) must turn off echo cancellation, noise suppression and auto gain. Azure Pronunciation Assessment stays a later option if Chrome's matching proves too loose for checking decoding.
- **Speech recognition:** browser Web Speech API in Chrome to start. It sends audio to Google's servers, so district approval is needed before classroom use (see Open Questions). Possible later option: an on-device speech model so no audio leaves the Chromebook.
- **Read-aloud voice: pre-made audio files.** Every word, sentence, passage and menu line is turned into an audio file ahead of time with a high-quality neural voice (Azure AI Speech, free tier), and the game plays those files. The Chromebook's built-in voice is used only as a last-resort backup if a file is missing.
  - Why pre-made: better sound, instant playback, works offline, no API key inside the game, and no ongoing cost. All game text is known ahead of time, so live voice generation is unnecessary.
  - **Menu and story lines** live in `game/data/strings.json` (English and Spanish). On every push, `tools/voice_lines.py` voices any new or changed line with the narrator voice and lists the files in `assets/audio/ui/manifest.json`. A line keeps its file until its words or voice change.
  - **How files get made:** a GitHub Action (an automatic job that runs on GitHub's servers) reads the content JSON files, sends any new text to Azure, and saves the audio into `assets/audio/`. The Azure key is stored as an encrypted GitHub Secret, so it never appears in the public repo. New content gets voiced automatically when it is pushed.
  - **Voice variety, with consistency where it teaches:**
    - **Story and characters:** each character (narrator, guide, shopkeepers, rivals, bosses) has its own Azure voice, and game lines vary voice by character. Encouragement lines rotate among several voices so they stay fresh.
    - **Word help and single sounds:** one steady "reading guide" voice, so students hear sounds and words the same way every time while they are learning them. In settings, the student can pick their guide from 3 or 4 approved voices.
    - **Spanish:** the same approach with the Spanish voices.
    - Character-to-voice assignments live in `game/data/voices.json`, so voices can be swapped without changing code.
    - Candidate voices from the first samples: English Andrew, Brian, Guy, Davis, Ava, Emma, Jenny, Aria; Spanish Dalia, Jorge, Alonso, Paloma. Mr. Scott approves the final cast.
    - **Chosen so far:** narrator is English Guy (picked by Mr. Scott) and Spanish Jorge, Mexico (picked to match: a male narrator voice in the Spanish variety most common among local EB students). A Spanish-speaking colleague or student should give the Spanish voices a quick listen before launch.
  - Free tier is 0.5 million characters per month, far more than the game's full text. Free tier usage is throttled rather than billed when the limit is reached.
  - Backup option with no account: an open-source voice (Kokoro or Piper) run by the same GitHub Action.
- **Battle words (built in M2):** every battle word, answer option and rune is voiced by `tools/voice_lines.py` into `assets/audio/words/`. Short words are sent to Azure spelled as sounds (IPA), so made-up runes and options are said exactly as written. Mr. Scott should spot-check a few runes by ear. Spanish meanings are voiced with the Spanish narrator.
- **Phoneme sounds:** single sounds (like /b/ or short /i/) are generated with Azure's pronunciation tags and checked by ear. Any that sound wrong get recorded clips instead.
- Music and sound effects: chiptune style, CC0 or original.

---

## 11. Saving and privacy

- No accounts and no student names anywhere in the game or this repo.
- Progress saves in the browser on the student's device first, so the game works even with no internet.
- **Student code:** the teacher gives each student a short code (example: `SCOTT-07`). The game knows students only by this code. The list that matches codes to real names stays with the teacher, outside the game and outside this repo.
- **Save code:** the game can show a short code to restore progress if browser data is cleared or the student changes Chromebooks.
- Students pick a nickname inside the game. Nicknames never leave the device.
- Progress data for teacher reports is sent only to the teacher's own Google Sheet (section 12). It contains the student code and game metrics, never names.

---

## 12. Teacher reports

### 12.1 How data reaches the teacher

1. The game saves progress on the device during play.
2. At the end of each level, and when the student quits, the game sends a small progress record to a **Google Sheet owned by the teacher's district Google account**. A Google Apps Script attached to that sheet receives it.
3. If the device is offline, records wait on the device and send the next time it connects.
4. A **Reports** tab in the sheet (built by the script) turns the raw records into readable reports.

Why this approach: the data stays inside the district's Google account, which the district already manages. There is no outside database or company account to approve, and nothing about students is stored in this public repo. The web address for the Apps Script is entered on the game's teacher settings screen, so it is not stored in the code either.

Fallback: a teacher screen on the device itself (opened with a teacher PIN) can show and download that student's report, for use without the sheet.

### 12.2 Metrics collected

| Metric | What it shows |
|---|---|
| Starting level | Placement results for each pattern, the world the student started in, and the date |
| Play frequency | Dates played, number of sessions, minutes per session, minutes per week |
| Progress | Current world and area, patterns mastered with date of mastery |
| Accuracy by pattern | Percent of words read correctly for each pattern, over time |
| Fluency | Words correct per minute (WCPM) on boss passages, every attempt, with personal best |
| Words read | Total words read, per session and overall |
| Trouble words | The words and patterns missed most often |
| Nonsense word accuracy | True decoding skill, separate from words the student may have memorized |
| Support use | Hints, read-aloud taps, Spanish toggle use, speak mode vs. tap mode |
| Replays | Which levels and bosses the student replayed (repeated reading practice) |

### 12.3 Reports

- **Student report:** one page per student code with starting level vs. current level, a WCPM line graph, an accuracy-by-pattern chart, play frequency and trouble words. Includes a plain-language progress summary the teacher can adapt for IEP progress reports (example: "Since placement on 9/2, he has mastered 3 of 8 patterns. WCPM on boss passages rose from 48 to 71.").
- **Class overview:** every student code on one table, with current world, minutes played this week, last played date and a flag for students who have not played in 7 days or are stuck on one pattern.
- **Date range filter** for grading periods and progress report windows.

---

## 12A. Encouragement and showing growth to students

### 12A.1 Encouragement

- **Frequent and specific.** Praise names what the student did: "You read 'construction' on the first try," "12 words in a row," "That's the fastest you've read this passage."
- **Effort and growth, never ability labels.** Praise practice and improvement. The game never says a student is "smart," "low" or "behind."
- **Teen tone.** Short, confident lines in the voice of the game's characters. No baby talk, no gold stars.
- **Compare only to themselves.** No reading-level leaderboards. Any leaderboards cover game things only (creatures caught, boss ranks).
- **Missed words get calm support:** "Let's break it up" plus a replay, never a failure sound.
- **Streaks and milestones:** play-day streaks, words-read milestones (100, 500, 1,000 and more), and first-try badges.

### 12A.2 Growth screen between levels

After every level, the student sees a short **Level Clear** screen:

- One big headline number and one simple graph. No clutter.
- **Then vs. Now bars:** the student's first try on this world's words compared with today
- **Fluency line:** WCPM across boss attempts, with personal bests marked
- An arrow and short line when something improved: "+14 words per minute since your first try"
- Large Lexend text, and every label can be read aloud. A Spanish label option is available.

If a number drops (common when a new world brings harder words), the screen shows something that did improve instead, such as accuracy on earlier patterns or words read this week. Students should leave every Level Clear screen with a reason to keep going.

---

## 13. Technology

- **Engine:** three.js r128 for the 3D map and battles (same as The Exiled Crown), with menus and the Forge as regular web page parts on top. Plain JavaScript, static files. Phaser 3 ran M1 and M2 and is retired with the redesign.
- **Hosting:** GitHub Pages from this repo
- **Target:** Chrome on school Chromebooks, at 1366 x 768 and smaller
- **Content as data:** word banks, passages, creatures and world layouts in JSON under `game/data/`
- **Maps:** level layouts (trail points, build spots, waves) in JSON under `game/data/`
- **Performance:** must run smoothly on low-end Chromebooks; keep assets small
- **Portable to Google Apps Script:** the district may block github.io. Every build must also produce a single self-contained HTML file (code, art and audio packed inside) that can run as a Google Apps Script web app on a district Google account. Rules that keep this possible:
  - No server code and no build tools the game depends on at runtime
  - No loading files from other websites while playing (fonts and libraries are stored in the repo)
  - Small assets: pixel art, and short mono audio at a low bitrate
  - A GitHub Action (`.github/workflows/deploy.yml`) builds both versions on every push: the website and the all-in-one file. The all-in-one file is published at `dist/rift-runners-offline.html` on the website (download it for the offline backup) and as `dist/apps-script/index.html` with a small `Code.gs` for Apps Script. The builder is `tools/build_single.py`.
  - Speak mode must be tested inside Apps Script early, because the microphone may be blocked inside Google's frame. Tap mode always works as the fallback.
  - **Size limit (Nov 21):** the all-in-one file was 8 MB after M2, mostly voice files, and the full game will be far bigger. It stays a backup for the December 2 demo only. The long-term home is the website. If the district keeps github.io blocked, the plan is an Apps Script version that loads the art and audio as separate files (for example from Google Drive) instead of packing everything into one file. The file is built by GitHub for free on each push; Claude only tests it right before December 2.

---

## 14. Milestones

Each milestone is a playable, testable step.

**December 2 demo target (updated Nov 21 for the redesign):** M3 plus a first slice of M4: one playable Thornwood level of Hold the Rift with the Rune Forge in tap mode, Spanish supports and read-aloud, and the World 1 map showing the locked levels. Speak mode only if time allows. Runs as the website, with the offline file as backup.

**Build note:** every feature records the metrics in section 12.2 from the first forge onward, saved on the device, so the reports in M10 have real history to show. The Level Clear growth screen (section 12A.2) arrives with M4 and gains the fluency line at M7.

| # | Milestone | Playable result |
|---|---|---|
| M0 | Project docs | CLAUDE.md, this design doc, session log (done) |
| M1 | Game skeleton | Title screen, Lexend font, settings menu (done) |
| M2 | First reading check | Turn-based tap battle with World 1 words (done, replaced by the redesign; its words, voices, checker and record carry over) |
| M3 | Hold the Rift core | 3D Thornwood map, trail, waves, Rune Forge, 4 defenders, 2 creatures, one playable level |
| M4 | World map and Level 1 to 3 | World 1 map with locked levels, stars, Level Clear growth screen |
| M5 | Speak mode | Forge words read aloud for a bonus |
| M6 | Full arsenal | All World 1 defenders, upgrades, hero powers, Armory |
| M7 | Boss and Rift Seal | Thorn King, Rift Seal fluency passage with WCPM |
| M8 | Placement mission | Opening mission that places students |
| M9 | Worlds 2 to 8 | Content, maps, creatures and defenders for the rest |
| M10 | Teacher reports | Google Sheet + Apps Script reports, class overview, on-device teacher screen |
| M11 | Polish | Story, music, balance and classroom testing |

---|---|---|
| M0 | Project docs | CLAUDE.md, this design doc, session log |
| M1 | Game skeleton | Title screen running on GitHub Pages; Lexend font; settings menu (done Nov 21) |
| M2 | First battle (tap mode) | One battle using World 1 words, read-aloud on every word (done Nov 21) |
| M3 | Speak mode | Same battle playable by reading aloud |
| M4 | World 1 slice | One overworld area, a skill shrine, the first ability gate |
| M5 | Creatures and saving | Catch and level creatures; progress saves; save code |
| M6 | First rhythm boss | World 1 boss with WCPM tracking |
| M7 | Placement mission | Opening mission that places students into the right world |
| M8 | Worlds 2 to 8 | Content and areas for the rest of the sequence |
| M9 | Teacher reports | Google Sheet + Apps Script reports, class overview, on-device teacher screen |
| M10 | Polish | Story, music, balance and classroom testing |

---

## 15. Open questions

1. ~~Final game title~~ Decided: Rift Runners
2. Story and setting: who is the player, and what are they fighting? Starting idea from the title: rifts are tearing the worlds apart and the player runs through each world to seal its rift.
3. District approval for speech recognition in Chrome on student Chromebooks (and for Azure Pronunciation Assessment if M3 picks it)
4. Azure Speech account setup and voice choice (English and Spanish); confirm Azure terms allow the generated audio in a public classroom game; source for any phoneme clips that need recording
5. Art source: CC0 pixel art packs (for example Kenney or OpenGameArt), AI-generated art, or a mix
6. District approval to send student-code progress data to a teacher-owned Google Sheet
7. Mastery threshold and how many words per battle
8. Fluency goal on boss passages (use published oral reading fluency norms to set it)
9. ~~Hearing a word before casting~~ Decided Nov 21: counts as help, smaller hit.
10. ~~Final consonant blends~~ Decided Nov 21: they wait for World 2 with the other blends. Mr. Scott handed reading instruction decisions to Claude; they are recorded in this file as they are made.
