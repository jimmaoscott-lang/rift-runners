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

## S-01: Teacher lock for test and setup tools

Status: ready
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
