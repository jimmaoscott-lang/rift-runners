# AI Studio Prompts

Claude writes each prompt. Mr. Scott copies everything inside the prompt box into Google AI Studio (the `rift-runners-studio` app), lets it build, plays the change, then syncs to GitHub. The next Claude chat tests it against the "Done when" list. Rules for writing prompts are in `CLAUDE.md` ("Writing AI Studio prompts").

Newest at the top.

## Template

```
S-##: <title>
Status: ready | sent | built | tested
Goes with: CHECKLIST step, test report problem number

PASTE INTO AI STUDIO:
<the prompt>

CLAUDE TESTS AFTER:
<what Claude checks in the next session>
```

---

## S-11: Word list fixes (choices, runes and a few words)

Status: tested (passed, Claude Test 10, Nov 27)
Goes with: CHECKLIST Step 4 (word list check); Test 9, problems 1 to 5

Why: Test 9 found tap choices that are slurs or crude words when the game says them aloud, short i and short e choice pairs before m or n that sound the same for many Gulf Coast speakers, one choice that sounds exactly like its word, three words that use patterns not taught yet, and one rune with a spelling English does not use. Every new word below already has a clip in the word sprite, so no audio is added.

PASTE INTO AI STUDIO:

```
Task: replace some words and tap choices in the level word lists. Do only this task. Claude (the director) picked every word below; use them exactly.

File: src/data/level1.ts only. Change only the entries listed. Keep each entry's other fields (es, sayAlso, azureRef, pattern, tiles) unless a new line is given in full.

1. LEVEL1_RUNES and LEVEL5_RUNES: replace the rune entry "fim" with
   { w: 'zim', kind: 'rune', options: ['zam', 'zum'] },
2. LEVEL2_REAL_WORDS and LEVEL4_REAL_WORDS: "fog" options become ['fig', 'dog'].
3. LEVEL2_RUNES: "fum" options become ['fam', 'fub'].
4. LEVEL3_REAL_WORDS: replace these five entries, in the same spots:
   hem -> { w: 'bed', kind: 'real', options: ['bad', 'bud'], es: 'cama' },
   pen -> { w: 'leg', kind: 'real', options: ['lag', 'log'], es: 'pierna' },
   men -> { w: 'set', kind: 'real', options: ['sit', 'sat'], es: 'poner' },
   den -> { w: 'beg', kind: 'real', options: ['big', 'bag'], es: 'rogar' },
   ten -> { w: 'let', kind: 'real', options: ['lot', 'lad'], es: 'dejar' },
5. LEVEL3_REAL_WORDS, new options:
   net ['nit', 'nap'], pin ['pan', 'pun'], fit ['fet', 'fot'], mix ['mux', 'max'], win ['wan', 'wun']
6. LEVEL3_RUNES: replace "tev" with { w: 'teb', kind: 'rune', options: ['tab', 'tib'] }, and "zem" options become ['zum', 'zam'].
7. LEVEL4_REAL_WORDS, new options:
   net ['nit', 'nap'], pen ['pun', 'pan'], pin ['pan', 'pun'], win ['wan', 'wun'], sun ['sin', 'san']
8. LEVEL5_REAL_WORDS, new options:
   hem ['hum', 'ham'], den ['dan', 'dug'], fit ['fet', 'fot'], pin ['pan', 'pun']
   LEVEL5_RUNES: "zem" options become ['zum', 'zam'].
9. W2_L3_REAL_WORDS: delete the "frost" and "frill" entries.
   W2_L3_RUNES: "frab" options become ['frib', 'frop'].
10. W2_L5_REAL_WORDS: replace "blink" with
   { w: 'blip', kind: 'real', pattern: 'bl', tiles: ['bl', 'i', 'p'], targetTileIdx: 0, options: ['lip', 'blob'], es: 'señal breve' },
   W2_L5_RUNES: "thab" options become ['tab', 'shab'].
11. W3_L1_REAL_WORDS: "cake" options become ['cap', 'bike'].
    W3_L1_RUNES: "dake" options become ['dak', 'dime'].
12. Do not change: placement probe words, any other entry, speech checking (src/lib/speech.ts), voice fits, the word audio sprite or manifest, Spanish supports, save data, difficulty, waves or defenders. Old saved progress must still load.
13. In BUILD.md "Mr. Scott's decisions", add: "Nov 27: word list rules (Claude): tap choices are heard, so a choice never sounds like its word, never sounds like a crude or hurtful word, and never pairs short i with short e before m or n (pin and pen sound alike for many Gulf Coast students). Words on screen use only patterns taught so far. Claude checks every word list before a level ships. Use only words that already have a clip in public/assets/audio/words, or record new ones in Leda's voice."
14. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry; report how many files you changed and their total size.

Done when:
- In tap mode, World 1 Level 3 shows bed, leg, set, beg and let, and never hem, pen, men, den or ten.
- No word anywhere has a choice that swaps short i and short e before m or n.
- "sun" plays sin and san as its choices.
- World 2 Level 3 has no frost or frill; World 2 Level 5 shows blip in place of blink.
- Every choice button still plays a recorded voice (no computer voice).
- Lint and build pass.
```

CLAUDE TESTS AFTER:
- Re-run `dump_words.ts` and `word_check.py` on the new Studio commit: 0 flags.
- Every word and choice is in the word audio manifest.
- Only `src/data/level1.ts`, BUILD.md and the session log changed.
- Play W1 L3 in tap mode in headless Chrome at 1093 x 614: new words appear, choices play, no console errors.

---

## S-10: Expert grace, part 2: overtime waves stop growing on Expert

Status: cancelled (Mr. Scott, Nov 27: missing many words should be able to cost the level; that is motivation to read carefully). Do not run.
Goes with: CHECKLIST decision "Expert grace"; Test 7, problem 1.

Why: a level is won only after every Rift Lock fills, and a lock needs nearly all first-try reads (for example 10 of the last 11). Each miss delays the locks. After the level's listed waves run out, every extra wave gets 10 to 18% more creature health and about 14% more creatures. On Expert, a student who misses words falls into extra waves that keep growing until the anchor falls. That is a miss ending the level.

PASTE INTO AI STUDIO:

```
Task: Expert grace, part 2. On Expert only, extra waves (waves past the level's listed waves, while the Rift Locks are still open) stop getting stronger. Do only this task.

1. In startNextWave in src/game/CanvasBattleEngine.ts, in the regular (not bonus) branch: when this.difficulty is 'expert', treat extraWaves as 0 for strength. So on Expert, extraScale is 1 and waveCountMult is 1, and every extra wave plays at the strength of the level's last listed wave (still with the Expert preset and dials applied, as now).
2. Keep the Final Wave boost (finalBoost) working on Expert. When the locks fill, the Final Wave is still the last listed wave times finalBoost.
3. Easy, Normal and Hard keep growing extra waves exactly as now.
4. Bonus Surge waves (after the level is won) are unchanged on every difficulty.
5. Do not change: level data, endless hpStep and countStep values, creature stats, the S-07 difficulty presets, Builder Mode dials, lock rules, crystal payouts, speech checking, voice fits, Spanish supports or save data.
6. In BUILD.md "Mr. Scott's decisions", add: "Nov 27: Expert grace part 2: on Expert, extra waves while the Rift Locks are still open stay at the strength of the level's last listed wave. Misses can slow a win on Expert but cannot make the level unwinnable. Bonus Surge waves are unchanged."
7. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry; report how many files you added or changed and their total size.

Done when:
- On Expert, wave 8 of a 6-wave level has the same creature counts and health as wave 6.
- On Hard, wave 8 of a 6-wave level is stronger than wave 6, as before.
- On Expert, the Final Wave still gets its boost.
- Bonus Surge waves play the same as before on every difficulty.
- Lint and build pass.
```

CLAUDE TESTS AFTER:
- Start waves in World 1 Level 3 (6 listed waves) on Expert and Hard with locks open, through wave 9. Expert waves 7 to 9 match wave 6 in counts and health; Hard waves grow as in commit 72b0305.
- Fill the locks on Expert in overtime: the Final Wave is wave 6 strength times finalBoost.
- Bonus Surge waves match commit 72b0305 on all four difficulties.
- Easy, Normal and Hard regular waves 1 to 6 match commit 72b0305.

---

## S-09: Expert grace, part 1: half crystals for a second-try read on Expert

Status: tested (passed, Claude Test 8, Nov 27)
Goes with: CHECKLIST decision "Expert grace"; Test 7, problem 2.

Today every difficulty pays 30% for a second-try read (real word 4, rune 8). The approved Expert grace pays half on Expert.

PASTE INTO AI STUDIO:

```
Task: Expert grace, part 1. On Expert only, a word read right on the second try earns half crystals. Do only this task.

1. In src/data/level1.ts add expertSecondShare: 0.5 to FORGE_CONFIG. Leave every other FORGE_CONFIG number as it is.
2. In currentPayout in src/components/RuneForgePanel.tsx: when settings.difficulty is 'expert', tries is exactly 1, usedHelp is false and the word is not revealed, pay Math.round(refBase * FORGE_CONFIG.expertSecondShare). That gives real word 6, rune 13, and a spoken second try 6 (spoken reads use the real word base after a miss, as now).
3. Everything else pays as now on every difficulty: first-try reads, heard-it-first (speaker used) at 30%, a second try after using the speaker at 30%, a shown word at 3, and Mega Forge.
4. A second-try read still does not count as a clean read: no Mega Forge pip, no Rift Lock credit, and the word still goes on the practice list.
5. In completeForge, when the Expert half payout is used, change the feedback line to exactly "Second try, and it landed. Half crystals." (with voice fit: "Second try, and it landed (matched your voice profile). Half crystals."). Other difficulties keep the current lines.
6. Do not change: the simulate buttons (computeSimRound), lock rules, wave timing, the difficulty presets, Builder Mode dials, speech checking, voice fits, Spanish supports, the miss instruction card, or save data.
7. In BUILD.md "Mr. Scott's decisions", add: "Nov 27: Expert grace part 1: on Expert, a word read right on the second try earns half crystals (real word 6, rune 13). Misses never cost crystals. One miss never ends a level; missing many words can, and that is intended."
8. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry; report how many files you added or changed and their total size.

Done when:
- On Expert: miss a real word, then pick it right: +6 crystals and the new feedback line.
- On Expert: miss a rune, then pick it right: +13.
- On Expert: use the speaker, then read right: +4 (unchanged).
- On Normal: miss a real word, then pick it right: +4 and the old feedback line.
- Mega Forge streak and Rift Lock counts behave as before after a second-try read.
- Lint and build pass.
```

CLAUDE TESTS AFTER:
- Payout table on all four difficulties: first try, second try, heard first, heard first then second try, shown; real word, rune and spoken. Only the Expert second-try cells change (4 to 6, 8 to 13).
- Second try on Expert: streak resets, lock shows a miss, word on practice list.
- Diff touches only FORGE_CONFIG, currentPayout, the feedback line, BUILD.md and the session log.

---

## S-08: Correct the GitHub sync rule in BUILD.md

Status: tested
Goes with: CHECKLIST Step 3; Test 5 limits check

PASTE INTO AI STUDIO:

```
Task: correct the GitHub sync rule. This is a documentation task only. Do only this task.

1. In BUILD.md section 6, replace the whole "GitHub Sync File-Count and Size Lock" bullet with:
   - **GitHub Sync Rules**: Each sync (one task) changes fewer than 150 files and less than 15 MB, counting the full size of every added or changed file. These are cautious project numbers; the exact limit is not published. Split bigger work into more than one task and sync. The 150 file and 15 MB numbers do not apply to the whole repo. Keep the whole repo under 1,000 files (the reported AI Studio GitHub import limit), every file under 50 MB (GitHub blocks files over 100 MiB), and the published site under 1 GB. Project history: a 653 file commit failed; a 106 file, 9.0 MB commit worked.
2. In BUILD.md "Mr. Scott's decisions", add: "Nov 27: the 150 file and 15 MB numbers apply to each sync, not to the whole repo. See the GitHub Sync Rules in section 6."
3. Search BUILD.md, README.md and docs/DESIGN.md for any other line that applies 150 files or 15 MB to the whole repo, and change it to match. Leave old docs/SESSION-LOG.md entries as they are.
4. Keep the Audio Sprite Packing Rule and the Image and Voice Compression Rule as they are.
5. From now on, at the end of each task, report how many files the task added or changed and their total size.
6. Change no code, art or audio.
7. Housekeeping: add a docs/SESSION-LOG.md entry.

Done when:
- BUILD.md says the 150 file and 15 MB numbers are per sync.
- No current rule applies them to the whole repo.
- Only documentation files changed.
```

CLAUDE TESTS AFTER:
- Diff shows only documentation changes; rule and decision lines match.

---

## S-07: Make Mr. Scott's difficulty numbers the standard

Status: tested (passed, Claude Test 5, Nov 27)
Goes with: CHECKLIST Step 2; Mr. Scott's dial test, Nov 27

His dial settings: Easy health 50, speed 90. Normal health 60, speed 90. Hard 100, 100. Expert health 100, speed 110, creatures 110. Extra words 0 on all four.

PASTE INTO AI STUDIO:

```
Task: Mr. Scott tested the difficulty dials and chose new standard numbers for every level. Build them into the difficulty presets, so the game plays his way with all dials at their default of 100. Do only this task.

1. In src/data/level1.ts add a countMult number to DifficultyConfig, then set DIFFICULTIES to exactly:
   - easy: hpMult 0.38, speedMult 0.828, countMult 1.0
   - normal: hpMult 0.504, speedMult 0.855, countMult 1.0
   - hard: hpMult 0.92, speedMult 0.98, countMult 1.0
   - expert: hpMult 1.0, speedMult 1.1, countMult 1.1
2. In startNextWave in src/game/CanvasBattleEngine.ts, apply the preset countMult together with the count dial, rounding once: for creatures that are not bosses, count = Math.max(1, Math.round(baseCount * preset countMult * dial countPct / 100)). Boss counts never change. Keep the existing local wave countMult for bonus and endless waves working as it does now (rename it if the names are confusing). This applies to every level and every wave, including bonus and endless waves.
3. Change the four desc texts to exactly:
   - easy: "Weakest creatures, so students can focus on reading."
   - normal: "Balanced for steady runs."
   - hard: "Tough waves that reward smart upgrades."
   - expert: "The most, fastest and strongest creatures for veteran Rift Runners."
4. Keep the Builder Mode dials. All of them stay at default 100 (extra words 0), and Reset to default returns to 100.
5. Do not change anything else: no level data, creature stats, defenders, crystals, words between waves, speech checking or save data.
6. In BUILD.md "Mr. Scott's decisions", add: "Nov 27: standard difficulty for all levels is Easy health 0.38 and speed 0.828; Normal health 0.504 and speed 0.855; Hard health 0.92 and speed 0.98; Expert health 1.0, speed 1.1 and creature count 1.1. This replaces the earlier note to keep the Level 1 Hard and Expert numbers."
7. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry.

Done when:
- With every dial at 100, Easy and Normal creatures are clearly weaker and a little slower than before.
- Hard plays exactly as before.
- Expert creatures are a little faster, and bigger groups have more creatures.
- Boss counts are unchanged.
```

CLAUDE TESTS AFTER:
- Run commit b4049ab with his dial settings and the new build with default dials: counts, health and speed match on all four difficulties in several levels, including bonus waves (health may differ by 1 from rounding).
- Boss counts unchanged; dials still default to 100.

---

## S-06: Level names and the silent e rule get recorded voices

Status: tested (passed, Claude Test 5, Nov 27; Mr. Scott's listening check pending)
Goes with: CHECKLIST Step 4; Test 3 voice problem 3

PASTE INTO AI STUDIO:

```
Task: record the missing level name lines and the silent e rule line in the Leda voice. Do only this task.

1. Generate these clips with Leda, calm and clear. Say exactly this text, nothing added.
   - rule.magice.v1: "When a silent e sits at the end, it makes the vowel say its long name."
   - level.w1-l1: "Thornwood Edge"
   - level.w1-l2: "Bramble Crossing"
   - level.w1-l3: "Hollow Bridge"
   - level.w1-l4: "Sunless Ruins"
   - level.w1-l5: "Thornking's Heart"
   - level.w2-l1: "Ashgate Outpost"
   - level.w2-l2: "Smelter Causeway"
   - level.w2-l3: "Ironrift Crossing"
   - level.w2-l4: "Crucible Bastion"
   - level.w2-l5: "The Furnace Core"
   - level.w3-l1: "Dawnbreak Terrace"
2. Batch the lines into as few TTS requests as you can. Add them to public/assets/audio/ui/sprite.mp3 (64 kbps mono) with entries under "en" in public/assets/audio/ui/manifest.json using those exact ids. Do not shift or change any existing clip.
3. Keep the repo under 150 files: add no loose audio files. Report the tracked file count and total size before and after.
4. This is not cutscene or story narration. Do not record the level story paragraph or touch any cutscene.
5. Do not change anything else.
6. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry.

Done when:
- The speaker on every level card says the level name in Leda's voice.
- The silent e Sound Rule card reads its rule line in Leda's voice.
- Older clips (Wave 1, Final wave, Mega Forge) still sound right.
- If you could not generate a clip, say which one. Do not substitute the computer voice or another voice.
```

CLAUDE TESTS AFTER:
- All 12 ids in the manifest, clips inside the sprite length, old entries unchanged.
- `robot_voice_check.py`, plus level card speaker and silent e card: no computer voice.
- File count and size.

---

## S-05: Walkthrough steps get a recorded voice

Status: tested (passed, Claude Test 5, Nov 27; Mr. Scott's listening check pending)
Goes with: CHECKLIST Step 4; Test 3 voice problem 2

PASTE INTO AI STUDIO:

```
Task: record the 7 Level 1 walkthrough steps in the Leda voice. Do only this task.

1. For each step in WALKTHROUGH_STEPS (src/App.tsx), record one clip with Leda, calm and clear. Say the title, pause briefly, then the body, using the exact words in the code today. Say "Rift Locks and Hero Powers" for the "&" in step 6. Do not rewrite any text.
2. Batch the lines into as few TTS requests as you can. Add them to public/assets/audio/ui/sprite.mp3 (64 kbps mono) with ids walk.step1 through walk.step7 under "en" in public/assets/audio/ui/manifest.json. Do not shift or change any existing clip.
3. In src/components/BattleHUD.tsx, make the "Hear tutorial step" button call sound.speakUI with the id walk.step plus the step number, with the title and body as fallback text.
4. Keep the repo under 150 files: add no loose audio files. Report the tracked file count and total size before and after.
5. This is tutorial audio. It is not cutscene or story narration, so the cutscene pause does not block it. Touch no cutscene.
6. Do not change anything else: no walkthrough order, text, highlights or Spanish text.
7. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry.

Done when:
- All 7 speaker buttons play Leda's voice, and each clip matches the words on screen.
- No clip is cut off or runs into the next one.
- If you could not generate a clip, say which one. Do not substitute another voice.
```

CLAUDE TESTS AFTER:
- walk.step1 to 7 in the manifest, old entries unchanged.
- `robot_voice_check.py`: walkthrough speaker shows no computer voice.
- File count and size.

---

## S-04: Hero powers use the recorded voice

Status: tested (passed, Claude Test 4, Nov 27)
Goes with: CHECKLIST Step 4; Test 3 voice problem 1

PASTE INTO AI STUDIO:

```
Task: make the three hero powers play their recorded voice clips instead of the computer voice. Do only this task.

Cause: castHeroPower in src/game/CanvasBattleEngine.ts sends the speech ids power.rally, power.meteor and power.freeze. public/assets/audio/ui/manifest.json has the recordings under hero.rally, hero.meteor and hero.freeze, so the game never finds them.

1. Change the three ids in castHeroPower to hero.rally, hero.meteor and hero.freeze.
2. Keep the on-screen messages exactly as they are.
3. Tell me what words each of the three existing clips says, if you know from how they were made. If a clip says something that does not fit its power, tell me and do not re-record it yet.
4. Do not change anything else: no audio files, numbers, gameplay, speech checking or save data.
5. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry.

Done when:
- Rally, Meteor and Time Freeze each play a recorded clip. No computer voice.
- The messages on screen look the same as before.
```

CLAUDE TESTS AFTER:
- `robot_voice_check.py`: all three hero powers show no computer voice.
- Diff: only the three ids and the session log changed.

---

## S-03: Top bar fits small Chromebook screens

Status: tested (passed, Claude Test 3, Nov 27)
Goes with: CHECKLIST Step 5; Test 1 problem 8

PASTE INTO AI STUDIO:

```
Task: stop the battle top bar from overlapping on small screens. Do only this task.

Problem: at a 1093 x 614 window (a Chromebook at 125% zoom), the pause button covers the "Send now" part of the wave button in the top bar of src/components/BattleHUD.tsx.

1. Make the top bar fit with no overlap at every window size from 1024 x 576 up to 1920 x 1080.
2. When the window is narrower than 1200 pixels, the hero power buttons (Rally, Meteor, Freeze) show only their icon and charge count (for example "12/15" or "GO!"), and their name moves into the button's title tooltip and aria-label. Wider windows look exactly as they do now.
3. Every top bar button keeps a tap target of at least 32 by 32 pixels.
4. Do not change anything else: no gameplay, numbers, text, Teacher Mode, speech or save data.
5. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry.

Done when:
- At 1093 x 614 and at 1024 x 576, every top bar button is fully visible and none overlap, including "Send now", pause, speed, help, settings, Stop and the Teacher Mode badge.
- At 1366 x 768 the top bar looks the same as before.
```

CLAUDE TESTS AFTER:
- Screenshots and button-overlap check at 1024 x 576, 1093 x 614, 1366 x 768 (student view and Teacher Mode).

---

## S-02: Builder-only difficulty dials (replaces the earlier Easy and Normal balance prompt)

Status: tested (passed, Claude Test 3, Nov 27)
Goes with: CHECKLIST Step 2

Why it changed: Mr. Scott played Easy and Normal and is happy with all four difficulties as they are (Nov 27). He wants dials only for himself while building future levels. Teachers and students never see or change them.

PASTE INTO AI STUDIO:

```
Task: add a Builder Mode with difficulty dials, for the game builder only. Do only this task. With every dial at its default, the game must play exactly as it does now on all four difficulties.

1. Builder Mode
   - In src/lib/metrics.ts add a constant BUILDER_CODE = "runner-build". It is not a setting and is not shown or changeable anywhere in the game.
   - In the Teacher Tools code box (src/components/SettingsModal.tsx), typing BUILDER_CODE turns on Teacher Mode AND Builder Mode. The teacher code still turns on Teacher Mode only.
   - Builder Mode lives in React state in src/App.tsx only, like Teacher Mode. It is never saved and turns off on every page load.
   - While Builder Mode is on, the amber badge reads "Builder Mode on" instead of "Teacher Mode on".

2. Difficulty dials (shown only in Builder Mode)
   - In Settings, add a "Difficulty dials" panel with one row each for Easy, Normal, Hard and Expert.
   - Each row has 4 number fields: Creature health %, Creature speed %, Number of creatures %, Extra words between waves.
   - Defaults: 100, 100, 100, 0 for every row. These multiply on top of the current DIFFICULTIES values in src/data/level1.ts, which do not change.
   - Allowed ranges: health 25 to 300, speed 50 to 200, number 25 to 300, extra words -5 to 10.
   - A "Reset to default" button sets every row back to 100, 100, 100, 0.
   - A "Copy dial values" button copies a short text table of all four rows to the clipboard.
   - Dial values are kept in React state only. They are never saved, and they reset on page load. Do not add any localStorage keys.

3. Apply the dials in one place each, so they work on every level, now and future:
   - Health and speed: where creatures are spawned in src/game/CanvasBattleEngine.ts, multiply on top of the existing hpMult and speedMult.
   - Number of creatures: where wave groups are queued in src/game/CanvasBattleEngine.ts, multiply each group's count and round to the nearest whole number, minimum 1. Bosses are never removed or reduced.
   - Extra words: write one helper function that returns words between waves (the level's waveEvery plus the dial, never below 3 and never above 15). Use it everywhere waveEvery is read: the top bar wave counter, the Rune Forge and the engine. Rift Lock targets do not change.
   - Never change difficulty during a battle based on how the student is doing.

4. Do not change anything else: word lists, crystal rewards, speech checking, voice fits, Spanish supports, Runner Basic Training, defender stats, wave definitions in the level data, Teacher Mode tools, save data keys, Copy Teacher Note.

5. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry; add to "Mr. Scott's decisions" in BUILD.md: "Difficulty dials are a builder-only tool behind Builder Mode. Teachers and students never see them. Good dial values get written into the game as the real numbers, then dials go back to default. Builder Mode and the dials are removed before release."

Done when:
- A fresh page load shows no dials and no Builder Mode, and Teacher Mode with the teacher code shows no dials either.
- Code runner-build shows the "Builder Mode on" badge and the Difficulty dials panel.
- With all dials at default, Level 1 wave 1 on every difficulty has the same creatures as before (Hard: 10 Rift Wisps and 4 Thornbacks, 8 words to the first wave).
- Setting Normal "Number of creatures" to 50% gives half as many creatures in Level 1 on Normal and no change on the other three difficulties.
- Setting Normal "Extra words" to 2 makes the top bar count 2 more words to the first wave on Normal only.
- Reloading the page turns Builder Mode off and puts every dial back to default.
```

CLAUDE TESTS AFTER:
- Student view and Teacher Mode show no dials; builder code shows them.
- Wave counts and words-to-wave match the level data on all four difficulties at default, in Level 1 and one World 2 level.
- One dial change at a time affects only its own difficulty; reload clears everything; no new localStorage keys.

---

## S-01: Teacher lock for test and setup tools

Status: tested (passed, Claude Test 2, Nov 27)
Goes with: CHECKLIST Step 1; Test 1 problem 1

PASTE INTO AI STUDIO:

```
Task: put every test and setup tool behind a Teacher Mode, so students never see them. Do only this task.

Why: students can see the Playtest buttons (free crystals), the cutscene preview links, the lock Clear buttons, Unlock All Levels and Reset Placement. Students will find them in minutes, skip the reading, and the teacher data becomes meaningless.

1. Add Teacher Mode.
   - In src/lib/metrics.ts settings, add teacherCode (string, default "rift2026"). Do not add a saved "teacher mode on" flag.
   - Teacher Mode lives in React state in src/App.tsx only. It starts off every time the page loads, so a student never inherits it.
   - In src/components/SettingsModal.tsx, add a "Teacher Tools" button at the bottom. Tapping it asks for the teacher code. A right code turns Teacher Mode on. A wrong code shows "That code did not work." and nothing else.
   - While Teacher Mode is on, show a small amber badge "Teacher Mode on" in the top bar of the title screen and the battle screen, with a "Turn off" button.
   - In Teacher Mode, Settings shows a "Change teacher code" field (4 to 20 letters or numbers).

2. Hide these unless Teacher Mode is on (remove them from the page, do not just grey them out):
   - The Playtest panel (Fluent, Steady, Guided) in src/components/RuneForgePanel.tsx, about line 1223.
   - The Opening Scene, Victory Scene and Defeat Scene links in the title header, and the "Preview Opening / Victory / Defeat" links at the bottom of the title screen (src/components/TitleScreen.tsx, about lines 112 to 125 and 660), plus the "Preview" tags on level cards (about line 371).
   - Every lock Clear button: src/components/BattleHUD.tsx (about lines 659, 695 and 734) and src/components/TitleScreen.tsx (about line 571).
   - Unlock All Levels and Reset Placement in src/components/SettingsModal.tsx (about lines 311 to 346). The Unlock All Levels setting itself stays saved as it is now, so a teacher can open levels on a student's device and leave.
   - The "Load MP4" button in src/components/CutscenePlayer.tsx (about line 279).
   - Any other button whose only job is testing or previewing that you find while doing this. List each one in the session log.

3. Do not change anything else. These must keep working exactly as they do now: Rune Forge words and crystals, SAY IT and speech checking, Listen and Pick, Quick Voice Check and voice fits, Spanish and ELL supports, Sound Rule cards, the walkthrough, waves and balance numbers, difficulty choice, Runner Basic Training, save data (do not rename any localStorage keys), and Copy Teacher Note.

4. Housekeeping: run npm run lint and npm run build and fix any errors. Add a docs/SESSION-LOG.md entry. Add this rule to BUILD.md section 3: "Student screens show no test or setup tools. Every new test, preview or unlock tool goes behind Teacher Mode." Also add this rule to BUILD.md: "Cutscene pause: do not create or regenerate any cutscene images, narration or scripts until Mr. Scott says the rest of the build is finished. Cutscenes will be redone as static files as the last step." Keep the repo under 150 files; this task needs no new files.

Done when:
- A fresh page load shows no Playtest panel, no scene preview links, no Clear buttons, no Unlock All Levels, no Reset Placement and no Load MP4.
- Settings, Teacher Tools, code rift2026 shows all of them again plus the amber "Teacher Mode on" badge.
- Reloading the page turns Teacher Mode off.
- A wrong code shows "That code did not work."
- Level 1 still plays start to finish in both SAY IT and Listen and Pick.
```

CLAUDE TESTS AFTER:
- Fresh load at 1366 x 768 and 1093 x 614: none of the listed buttons in the page (search all visible buttons, including inside Settings and the cut scene player).
- Wrong code, right code, reload: Teacher Mode turns on and off as described.
- Scripted run of Level 1 still forges words, builds defenders and launches waves. No new console errors.
- Diff check: only the files named above changed, and no localStorage key was renamed.
- Repo still under 150 files and its size did not grow.
