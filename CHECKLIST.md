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
- [x] **Level 1 on Hard and Expert:** spot on (Mr. Scott played it, Nov 27). Keep those numbers.
- [x] **Easy and Normal:** all four difficulties are good as they are (Mr. Scott, Nov 27). No balance change.
- [x] **Difficulty dials:** builder-only tool for Mr. Scott while building future levels. Teachers and students never see them. Good values get written into the game, and the dials come out before release. Nov 27
- [x] **Kill rewards:** a few crystals per kill is fine (Mr. Scott, Nov 27). Replaces the Nov 21 reading-only rule.
- [x] **Walkthrough skip:** students may skip it (Mr. Scott, Nov 27).
- [x] **Lock counts:** a miss lowering a lock count is fine (Mr. Scott, Nov 27).
- [x] **GitHub sync:** sync after every AI Studio build. The old size trouble came from one huge first sync. Nov 27
- [x] **Cutscenes paused:** AI Studio makes no new cutscenes until the rest of the build is done. Redoing all story scripts and cutscenes as static files is the last step; the look is still undecided. Nov 27
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

### Step 0. Connect AI Studio to this repo
- [x] Mr. Scott gives AI Studio the setup prompt; it copies the decisions into its BUILD.md (done Nov 27; it can read this repo)

### Step 1. Classroom-safe screens (before Dec 2)
- [x] S-01: Teacher lock. Hide the Playtest buttons, scene previews, lock Clear button, Unlock All Levels and Reset Placement behind a teacher code. (Prompt ready)
- [x] Claude tests S-01: passed (Test 2, Nov 27)

### Step 2. Builder-only difficulty dials
- [x] S-02 prompt written: Builder Mode (code `runner-build`) with dials for Easy, Normal, Hard and Expert; nothing saved; game unchanged at default (Nov 27)
- [x] Mr. Scott runs S-02 and syncs (Nov 27)
- [x] Claude tests S-02: passed (Test 3, Nov 27)
- [ ] Before release: remove Builder Mode and the dials (one prompt)

### Step 3. Keep the GitHub sync working
- [x] Mr. Scott syncs after every build (no prompt needed)

### Step 4. Reading rules the Studio build is missing
- [ ] Level card story paragraph gets a speaker: moved to the final static story pass, since its audio and text are redone then
- [ ] S-04: hero powers (Rally, Meteor, Time Freeze) use the recorded clips (prompt ready)
- [ ] S-05: walkthrough steps get a recorded voice (prompt ready)
- [ ] S-06: level names and the silent e rule get recorded voices (prompt ready)
- [ ] Claude tests S-04 to S-06 (Sonnet)
- [ ] Claude checks every Studio word list with the decodability checker and the classroom-safe word check (Opus picks fixes)

### Step 5. Small fixes from Test 1
- [x] S-03: top bar fits small Chromebook screens; passed (Test 3, Nov 27)

### Step 5b. Code cleanup (after Dec 2, one prompt at a time, game must play the same after each)
- [ ] C-1: Speech scoring rule table. Today `scoreAzureWord` in `src/lib/speech.ts` is one 750-line function with a hand-written block per sound family. Turn it into one shared checker plus a table of rules, so new sounds (Worlds 4 to 8) are new table rows (Opus designs the table)
- [ ] C-2: Word lists out of `src/data/level1.ts` (4,300 lines) into one file per world, so Claude can run the decodability checker on them directly
- [ ] C-3: Defender recipe format. Each defender's behavior is special-cased in about 26 places in `src/game/CanvasBattleEngine.ts` (4,860 lines); move to one recipe per defender
- [ ] C-4: Small leftovers (World 1 names typed into save loading and fallbacks). Low priority
- [ ] Rule added to BUILD.md with C-1: new sounds, defenders and levels use the shared formats; no new special-case blocks

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
- Cut scenes and story scripts: paused until the end, then redone as static files
- Unreal Engine move

## Archive
The old Claude build stays live at https://jimmaoscott-lang.github.io/rift-runners/ as a backup. No new work goes into it. Its unfinished steps (painted battlefield 3c to 3g, art work orders, Boot Camp, difficulty dials) are replaced by the Studio build, which already has those features.
