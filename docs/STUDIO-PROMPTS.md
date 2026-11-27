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

## S-07: Make Mr. Scott's difficulty numbers the standard

Status: ready (can run any time; Mr. Scott runs it first)
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

Status: ready (run after S-05)
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

Status: ready (run after S-04)
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

Status: ready
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
