# Studio Build Test Reports

Claude's tests of `jimmaoscott-lang/rift-runners-studio`. Newest at the top. Each report ranks problems by how much they hurt students or the project.

---

## Test 1: November 27, 2026 (Studio commit 8ceb3df, "adjust wave pacing and combat speed")

**How it was tested:** built exactly the way GitHub Pages builds it, served under `/rift-runners-studio/`, played in headless Chrome at 1366 x 768 and 1093 x 614. A scripted player read every Level 1 word through Listen and Pick (waiting 1.7 seconds before each Forge, like a real student), placed defenders near the trail, and used hero powers. Four full runs plus code reading.

**What works well:** `npm run lint` and the build pass with no errors. The page loads in about a second. The painted map, defenders, creatures, effects and Rune Forge look finished and run at 60 frames a second in the test browser. Three sound choices differ only in the vowel (hat, hut, hit), which is a good decoding check. Runes are tap only. Runner Basic Training, four difficulties, Spanish supports, voice fits and Copy Teacher Note are all present. No game errors in the console.

**Could not test here:** audio, a real mic, Azure speech (the speech service is not reachable from Claude's computer), and a real Chromebook.

### Ranked problems

| # | Problem | Why it matters | How sure |
|---|---|---|---|
| 1 | **Test and setup tools are on student screens.** Playtest buttons (Fluent +273, Steady +112, Guided +61) in the Rune Forge, Opening/Victory/Defeat scene links on the title, lock Clear buttons, Unlock All Levels and Reset Placement in Settings, Load MP4 in the cut scene player. | Students get free crystals without reading and can open every level, which breaks the game and the teacher data. The Dec 2 audience will see them too. | Certain. Prompt S-01 |
| 2 | **Level 1 is likely too hard since this morning's change.** That change cut all defender damage by a third, slowed creatures by a third and raised Level 1 to 5 waves with bigger groups (17 creatures in wave 3). Scripted results: perfect reader on Normal with 21 defenders lost at wave 4; 60% reader on Normal lost at wave 2; 60% reader on Easy lost at wave 3. | Level 1 is where a struggling reader decides whether to keep playing. Losing it with every word right will end the game for them. | Medium-high. The script never upgrades defenders and places them less cleverly than a person. Mr. Scott should play Level 1 on Normal once to confirm before S-02. |
| 3 | **Speak mode on the live site needs a second web address.** On GitHub Pages the game sends audio to `rift-runners-speech.jimmaoscott.workers.dev`. Title fonts come from Google Fonts. | If IT unblocks only github.io, speak mode drops to Chrome speech and the title font looks wrong. | Certain (from the code). Added to the Dec 2 list. |
| 4 | **The repo is past its own GitHub sync limit:** 146 files (limit 150) and 16 MB (limit 15 MB). | The next art or audio addition can make AI Studio's sync to GitHub fail, which leaves no backup and no live update. | Certain. Prompt S-03 |
| 5 | **The level card story cannot be heard and reads above students' level.** The speaker on the level card reads only the level name. The story paragraph ("The dimensional rift has torn open at the forest border...") has long, multisyllable words. | Breaks the rule that every word can be heard; students who read at a 3rd to 4th grade level will skip it. | Certain. Prompt S-04 |
| 6 | **The Level 1 walkthrough can be skipped the first time.** | Mr. Scott decided Nov 21 that the first-time tutorial cannot be skipped. | Certain. Prompt S-05 |
| 7 | **Creatures still pay crystals** (1 to 4 each) and wave clears pay 15 to 50. | Conflicts with the Nov 21 rule that reading is the only income. The amounts are small. | Certain. Needs his decision, then S-06 |
| 8 | **Small screen overlap:** at 1093 x 614 (a Chromebook at 125% zoom) the pause button covers "Send now". | Hard to tap on some Chromebooks. | Certain, small. S-07 |
| 9 | **A lock count went down after a miss** (Easy run: short a went from 7/9 to 6/9). | May feel like a penalty for a miss. Could be on purpose. | Medium. Check the code first (S-08). |

### Mr. Scott's answers (Nov 27)
- 2: Hard and Expert are spot on for Level 1. Open: make Easy and Normal easier for struggling readers.
- 4: Not a problem. The trouble came from one huge first sync; syncing after every build keeps it small.
- 5: The story paragraph needs a speaker now; rewriting the text waits for the final static story-script pass. Hero power names play in a robotic voice.
- 6, 7, 9: Fine as they are. Walkthrough skip, a few crystals per kill and lock counts stay.

### For Mr. Scott to check by hand
- Play Level 1 on Normal once: too hard, about right, or too easy?
- On a Chromebook: SAY IT on "pin", "cut" and "top" (the words the old build's mic missed).

---

## Code structure review: November 27, 2026

Mr. Scott asked whether AI Studio is writing the same things over and over. Findings, biggest first:

1. **Speech scoring:** `scoreAzureWord` (`src/lib/speech.ts`, lines 681 to about 1420) is one function of about 750 lines. Each sound family (short vowels, sh/ch, th, wh, -ck, L and R blends, S blends, final blends, silent e) has its own hand-written block with its own numbers. Every new world adds another block. Risk: inconsistent rules and bugs that are hard to find. Fix: one checker plus a rules table (C-1).
2. **Level data:** `src/data/level1.ts` is about 4,300 lines holding all 12 levels, word lists, waves, creatures, defenders and cut scene text. Works, but word lists are hard to check and every level adds to one file (C-2).
3. **Battle engine:** `src/game/CanvasBattleEngine.ts` is about 4,860 lines with about 26 places that branch on defender type. Adding a defender means editing many spots (C-3).
4. **Leftovers:** World 1 level names typed directly into save loading (`src/lib/metrics.ts`, about lines 378 to 434) and about 20 "w1-l1" fallbacks. Saves for later worlds still work, so this is cleanup only (C-4).

What is already done once and shared, and works well: audio sprites, the Spanish text file (`src/data/ellSpanish.ts`), level definitions read from one table, difficulty multipliers, and art loading.
Recommendation: no cleanup before Dec 2. After, one cleanup prompt at a time, each saying the game must play exactly the same, with Claude's scripted test before and after.
