# Rift Runners Build Checklist

Mr. Scott's master plan. Rewritten November 27, 2026, when the AI Studio version became the main build.

One chat per step. Open each chat with:
"Read CLAUDE.md and CHECKLIST.md, then do the next unchecked step."
Use the model listed for the step. When a step is done, check it off here and add a SESSION-LOG entry.

**How a prompt step works:**
1. Claude writes the prompt in `docs/STUDIO-PROMPTS.md` and gives it to you in chat.
2. You paste it into AI Studio and let it build.
3. You play the change for a minute. If it looks right, sync AI Studio to GitHub.
4. Start a new Claude chat. Claude pulls the Studio build, tests it, checks the box, and writes the next prompt.

---

## Decisions

- [x] **Main build:** the AI Studio version (`rift-runners-studio`). Claude directs, tests and writes prompts; AI Studio builds; Claude never changes Studio code. The old Claude build is frozen as an archive. Nov 27
- [ ] **Level 1 difficulty:** Claude's test says Level 1 is now too hard (see Test 1, problem 2). Mr. Scott plays Level 1 once on Normal and says: too hard, about right, or too easy.
- [ ] **Kill rewards:** creatures still drop 1 to 4 crystals, and clearing a wave pays 15 to 50. Your Nov 21 rule was reading as the only income. Claude suggests: no crystals per kill, keep a small wave-clear bonus. Approve or change.
- [ ] **Expert grace:** suggested rule: a word read right on the second try earns half crystals, and misses never end the level. Approve or change.

## Dec 2 meeting

- [ ] Show the Studio version: https://jimmaoscott-lang.github.io/rift-runners-studio/
- [ ] Prompt S-01 (teacher lock) is built first, so the audience never sees the test buttons.
- [ ] Ask IT to unblock all four addresses. Speak mode needs the second one; the game looks wrong without the last two.
  1. `jimmaoscott-lang.github.io`
  2. `rift-runners-speech.jimmaoscott.workers.dev`
  3. `fonts.googleapis.com`
  4. `fonts.gstatic.com`
- [ ] Present it as "designed to supplement reading instruction." No claims that it works yet.

## Done

- [x] Studio build tested by Claude: Test 1 in `docs/STUDIO-TESTS.md` (Nov 27)
- [x] Project rules rewritten for the new arrangement (`CLAUDE.md`, this checklist) (Nov 27)

---

## Build order (AI Studio builds every step from Claude's prompts)

### Step 1. Classroom-safe screens (before Dec 2)
- [ ] S-01: Teacher lock. Hide the Playtest buttons, scene previews, lock Clear button, Unlock All Levels and Reset Placement behind a teacher code. (Prompt ready)
- [ ] Claude tests S-01 (Sonnet)

### Step 2. Level 1 balance (after the Level 1 decision above)
- [ ] S-02: Claude writes exact wave and damage numbers for World 1 based on your playtest (Opus)
- [ ] Claude re-runs the scripted player: a strong reader wins Level 1 on Normal; a 60% reader wins on Easy

### Step 3. Keep the GitHub sync working
- [ ] S-03: shrink the repo back under 150 files and 15 MB (it is at 146 files and 16 MB now). Compress the big pictures; move old cut scene stills out (Sonnet writes, Opus not needed)

### Step 4. Reading rules the Studio build is missing
- [ ] S-04: every word on the level card can be heard (the story paragraph has no speaker), and the story text gets shorter and easier
- [ ] S-05: the Level 1 walkthrough cannot be skipped the first time
- [ ] S-06: kill rewards, per the decision above
- [ ] Claude checks every Studio word list with the decodability checker and the classroom-safe word check (Opus picks fixes)

### Step 5. Small fixes from Test 1
- [ ] S-07: on a small Chromebook screen (125% zoom) the pause button covers "Send now"
- [ ] S-08: check whether a missed word should lower a lock's count (Easy run: short a went from 7/9 to 6/9)

### Step 6. Playtest (Mr. Scott)
- [ ] Play 2 or 3 levels on Normal, then decide Normal difficulty

### Step 7. Bring over the best of the old build (Claude describes, AI Studio builds)
- [ ] Mic lessons from the old build (warm mic, pin and pen, runes Azure cannot judge, such as "baf" and "pid")
- [ ] Teacher report with a simple progress graph (Copy Teacher Note already exists; check it against the IEP note format)
- [ ] Creature intel cards that fade audio by world (ARSENAL.md)

### Step 8. More worlds
- [ ] Claude picks the reading skills for World 3 Levels 2 to 5 and Worlds 4 to 8 from DESIGN.md, writes the word lists, and checks them before AI Studio builds each level (Opus)

---

## On hold
- Phone layout and progress that follows a student between devices
- Video cut scenes
- Unreal Engine move

## Archive
The old Claude build stays live at https://jimmaoscott-lang.github.io/rift-runners/ as a backup. No new work goes into it. Its unfinished steps (painted battlefield 3c to 3g, art work orders, Boot Camp, difficulty dials) are replaced by the Studio build, which already has those features.
