# Game Design Document

**Working title:** Wordbound (placeholder, rename anytime)
**Status:** Draft 1, November 2026
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

## 3. Game style

A combination of proven styles from the 1980s to now:

| Inspiration | What we take from it | Why it helps reading |
|---|---|---|
| The Legend of Zelda / Metroidvania games | An overworld with areas you can see but cannot reach until you earn a new ability | Each new reading skill becomes an ability that opens new areas |
| Pokémon | Turn-based battles and a team of collectable creatures that level up and evolve | Turn-based play gives time to decode; collecting drives long-term play |
| Guitar Hero / rhythm games | Boss fights where text scrolls to a beat and the player reads in rhythm | Trains phrasing and speed, the core of fluency; high-score replays are repeated reading |
| Super Mario Bros. 3 | A world map with visible levels and worlds 1 through 8 | Clear, visible progress |

**Art:** 16-bit pixel art (SNES era look). Reads as retro-cool to teens, small file sizes, easy to keep consistent.

---

## 4. Structure

### 4.1 World map

8 worlds. Each world teaches one stage of the skill sequence (section 5). Each world contains:

- 4 to 6 overworld areas with battles
- 1 skill shrine where the new pattern is taught (short, interactive, skippable on replay)
- 1 ability gate that opens when the world's pattern is mastered
- 1 rhythm boss at the end

Theme ideas (to decide): forest, desert, ice, ocean, volcano, sky city, ruins, final fortress.

### 4.2 Core loop

1. Explore an area of the overworld
2. Run into wild creatures and trainers, which start battles
3. Win battles by reading words, which earns XP and new creatures
4. Master the world's pattern, which unlocks a new ability and opens the gate
5. Beat the rhythm boss, which opens the next world
6. Replay any battle or boss for higher ranks and rare rewards

---

## 5. Skill sequence

A structured literacy sequence built for older readers. Each world adds to everything before it.

| World | Pattern | Example words | Ability unlocked (ideas) |
|---|---|---|---|
| 1 | Short vowels, closed syllables (CVC) | cat, sit, mud, hop, bend | Dash |
| 2 | Consonant blends and digraphs (sh, ch, th, wh, ck, ng) | ship, chest, thump, crash, string | Grapple hook |
| 3 | Silent e (VCe) | make, ride, stone, cube | Swim |
| 4 | Vowel teams (ai, ay, ee, ea, oa, ow, oi, oy, ou) | rain, steam, float, coin, cloud | Glide |
| 5 | R-controlled vowels (ar, er, ir, or, ur) | storm, shark, burst, thirst | Fire breath |
| 6 | Syllable division and open syllables, consonant-le (VC/CV, V/CV, -ble, -tle) | basket, robot, tiger, candle, puzzle | Wall climb |
| 7 | Prefixes, suffixes and roots (un-, re-, pre-, -tion, -ment, -ful; port, struct, ject) | unlock, rebuild, motion, transport, construction | Teleport |
| 8 | Fluent reading of full passages; prosody and expression | Mixed text using all patterns | Final form |

**Heart words:** each world allows a small list of high-frequency irregular words (for example: the, was, said, of, to, you, they, were). Heart words are taught directly and stored in `game/data/heart-words.json`.

**Decodability checker:** a script in `tools/` checks every word and passage against the patterns taught so far plus allowed heart words, and flags anything that does not fit. All new content must pass it.

### 5.1 Mastery

- A pattern is mastered when the student reads pattern words with about 90% accuracy across at least two separate play sessions. (Exact threshold to be tuned with Mr. Scott.)
- Missed words come back more often (spaced review). Mastered words still appear occasionally so skills stay sharp.
- Earlier patterns keep appearing in later worlds as review.

### 5.2 Placement

The opening mission doubles as a placement check. It quickly samples each world's pattern with real words and nonsense words, then unlocks the worlds the student has already mastered. Students who already decode well skip ahead. The student sees it as a tutorial mission, never a test.

---

## 6. Battle system

Turn-based, one-on-one, Pokémon style.

### 6.1 Player turn

1. Choose a move. Each move shows a word, and harder words do more damage.
2. Read the word:
   - **Speak mode:** read it aloud into the mic
   - **Tap mode:** tap the word's sounds or syllables in order, or choose the matching spoken word from options
3. Correct reading lands the attack. Clean, quick reading adds a combo bonus (optional, never required to win).
4. A miss does not hurt the player. The word is read aloud, broken into parts, and the student tries again.

### 6.2 Battle word types

- **Real words** from the current and earlier patterns
- **Nonsense words** (for example, "blim" or "strake"), shown as "alien code" or "spell runes," to check true decoding instead of memorized words
- **Word building moves** where the student builds a word from tiles to power a special attack
- **Sentence moves** (later worlds) where a short sentence powers a big attack

### 6.3 Creatures

- Students collect creatures by winning battles
- Each creature has a type tied to a pattern family (example: a "Vowel Team" type)
- Creatures level up as the student reads words of their type, and evolve when the student masters that pattern
- Target: about 30 to 40 creatures total, each with 2 or 3 evolution stages (art budget to confirm)
- All creatures are original designs. No copies or look-alikes of existing game characters.

---

## 7. Rhythm bosses (fluency)

- A short passage scrolls karaoke style to a beat, with the current phrase highlighted
- The student reads along aloud (speak mode) or taps on the beat as each phrase lights up (tap mode)
- Scoring rewards accuracy first, then smooth phrasing and pace
- Difficulty levels change the tempo. The student can always pick a slower tempo.
- Bosses can be replayed for higher ranks. Each replay is a repeated reading of the same passage.
- The game records words correct per minute (WCPM) on boss passages and shows the student their personal best rising over time.

---

## 8. Emergent bilingual (EB) supports

- **Spanish toggle** for instructions, menus, story text and the word glossary (default set by the student at first launch, changeable anytime)
- **Every word can be heard** in English. Glossary entries can also be heard in Spanish.
- **Picture support** for concrete words where possible
- **Cognate highlights:** Spanish-English cognates are marked (example: nación / nation, motor / motor) with a short "you already know this one" moment
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
- Short sessions with a natural stopping point every few minutes
- Works with keyboard, mouse or touch

---

## 10. Speech and audio

- **Speech recognition:** browser Web Speech API in Chrome to start. It sends audio to Google's servers, so district approval is needed before classroom use (see Open Questions). Possible later option: an on-device speech model so no audio leaves the Chromebook.
- **Read-aloud voice: pre-made audio files.** Every word, sentence, passage and menu line is turned into an audio file ahead of time with a high-quality neural voice (Azure AI Speech, free tier), and the game plays those files. The Chromebook's built-in voice is used only as a last-resort backup if a file is missing.
  - Why pre-made: better sound, instant playback, works offline, no API key inside the game, and no ongoing cost. All game text is known ahead of time, so live voice generation is unnecessary.
  - **How files get made:** a GitHub Action (an automatic job that runs on GitHub's servers) reads the content JSON files, sends any new text to Azure, and saves the audio into `assets/audio/`. The Azure key is stored as an encrypted GitHub Secret, so it never appears in the public repo. New content gets voiced automatically when it is pushed.
  - Voices: one English voice and one Spanish (Mexico) voice, chosen by Mr. Scott from samples. Keep the same voices for the whole game.
  - Free tier is 0.5 million characters per month, far more than the game's full text. Free tier usage is throttled rather than billed when the limit is reached.
  - Backup option with no account: an open-source voice (Kokoro or Piper) run by the same GitHub Action.
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

- **Engine:** Phaser 3, plain JavaScript, static files
- **Hosting:** GitHub Pages from this repo
- **Target:** Chrome on school Chromebooks, at 1366 x 768 and smaller
- **Content as data:** word banks, passages, creatures and world layouts in JSON under `game/data/`
- **Maps:** tile maps (Tiled editor JSON format) for overworld areas
- **Performance:** must run smoothly on low-end Chromebooks; keep assets small

---

## 14. Milestones

Each milestone is a playable, testable step.

**Build note:** every feature records the metrics in section 12.2 from the first battle onward (M2), saved on the device. Then the reports in M9 will have real history to show. The Level Clear growth screen (section 12A.2) arrives with M4 and gains the fluency line at M6.

| # | Milestone | Playable result |
|---|---|---|
| M0 | Project docs | CLAUDE.md, this design doc, session log |
| M1 | Game skeleton | Title screen running on GitHub Pages; Lexend font; settings menu |
| M2 | First battle (tap mode) | One battle using World 1 words, read-aloud on every word |
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

1. Final game title
2. Story and setting: who is the player, and what are they fighting?
3. District approval for speech recognition in Chrome on student Chromebooks
4. Azure Speech account setup and voice choice (English and Spanish); confirm Azure terms allow the generated audio in a public classroom game; source for any phoneme clips that need recording
5. Art source: CC0 pixel art packs (for example Kenney or OpenGameArt), AI-generated art, or a mix
6. District approval to send student-code progress data to a teacher-owned Google Sheet
7. Mastery threshold and how many words per battle
8. Fluency goal on boss passages (use published oral reading fluency norms to set it)
