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

## S-03: Top bar fits small Chromebook screens

Status: ready
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

## S-02: Difficulty dials for Easy and Normal (replaces AI Studio's "dynamic spawn" idea)

Status: ready (run only if Mr. Scott agrees Easy and Normal should be easier)
Goes with: CHECKLIST Step 2; Test 1 problem 2

PASTE INTO AI STUDIO:

```
Task: make Easy and Normal easier using a fixed dial table. Hard and Expert must play exactly as they do now. Do only this task.

Use this instead of a dynamic or adaptive system. Difficulty must never change during a battle based on how the student is doing, because teachers read the results as a picture of the student's reading.

1. In src/data/level1.ts, add two fields to each entry in DIFFICULTIES and set these exact values:

   | Difficulty | hpMult | speedMult | countMult | extraWordsPerWave |
   | easy   | 0.65 | 0.92 | 0.6 | 2 |
   | normal | 0.78 | 0.95 | 0.8 | 1 |
   | hard   | 0.92 | 0.98 | 1.0 | 0 |
   | expert | 1.00 | 1.00 | 1.0 | 0 |

   Hard and Expert keep their current hpMult and speedMult.

2. countMult: when a wave is built, multiply every group's count by countMult and round to the nearest whole number, with a minimum of 1. Bosses are never removed or reduced in count. Do this in one place where wave groups are queued in src/game/CanvasBattleEngine.ts, not per level.

3. extraWordsPerWave: the words between waves become the level's waveEvery plus extraWordsPerWave, never more than 15. Write one helper function that returns this number and use it everywhere waveEvery is read (the wave counter in the top bar, the Rune Forge, the engine). Rift Lock targets do not change.

4. Change the difficulty descriptions shown on the title screen:
   - Easy: "Fewer, weaker creatures and more reading time between waves."
   - Normal: "A few fewer creatures than Hard."
   Spanish lines in src/data/ellSpanish.ts (mark both "needs Spanish speaker review"):
   - Easy: "Menos criaturas, más débiles, y más tiempo para leer entre oleadas."
   - Normal: "Un poco menos criaturas que en Difícil."

5. Do not change anything else: word lists, crystal rewards, speech checking, voice fits, Spanish supports, Runner Basic Training, defender stats, wave definitions in the level data, save data keys.

6. Housekeeping: npm run lint and npm run build; add a docs/SESSION-LOG.md entry; update the difficulty table in docs/DESIGN.md; add to "Mr. Scott's decisions" in BUILD.md: "Difficulty uses fixed dials per level of difficulty (enemy health, speed, count, words between waves). No adaptive difficulty during a battle. Hard and Expert stay as tuned on Nov 27."

Done when:
- On Easy, Level 1 wave 1 has 6 Rift Wisps and 2 Thornbacks (from 10 and 4), and the top bar counts 10 words to the first wave.
- On Normal, wave 1 has 8 Rift Wisps and 3 Thornbacks, and 9 words to the first wave.
- On Hard and Expert, wave 1 still has 10 Rift Wisps and 4 Thornbacks and 8 words to the first wave.
- The new Easy and Normal descriptions show on the title screen.
```

CLAUDE TESTS AFTER:
- Wave counts and words-to-wave on all four difficulties, Level 1 and one World 2 level.
- Scripted player: strong reader (1.0) wins Level 1 on Normal; struggling reader (0.6) wins Level 1 on Easy. If not, a follow-up prompt with new numbers.
- Hard and Expert unchanged (compare wave counts to the level data).

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
