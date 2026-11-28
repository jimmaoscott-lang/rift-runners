# Studio Build Test Reports

Claude's tests of `jimmaoscott-lang/rift-runners-studio`. Newest at the top. Each report ranks problems by how much they hurt students or the project.

---

## Test 10: S-11 word list fixes (November 27, 2026)

Studio commit 0e92c26. **S-11 passed.** The Studio repo was only read.

| Checked | Result |
|---|---|
| Word check | 0 flags in 333 words and runes, 11 levels. The commit before S-11 still gives 33 |
| Data compared before and after | Word changes match S-11. Level settings, placement data and pattern rules in the dump are unchanged. No i/e choice pairs before m or n found |
| Word clips | All 410 words and choices are listed in the audio manifest |
| Files changed | Pass: BUILD.md, session log, level1.ts (3 files, about 251 KB full size) |
| Lint and build | Pass |
| W1 L3, tap mode, headless Chrome 1093 x 614 | 28 of 29 words and runes seen, with bed, leg, set, beg and let. No removed words seen. No computer voice calls. Level reached the victory screen. Progress was seeded by the test to open L3 |
| Choice playback | One first tap on a "pin" choice logged no clip. The other first-time choice taps logged the matching clip |
| Opening battle screen, 1366 x 768 and 1093 x 614 | Ran. Console showed failed resource loads (404s and one blocked connection); the addresses were not logged in this run |

In the L3 run, failed loads were the local speech health check, the L3 victory narration files and the cutscene voice service. No page errors were logged.

### Ranked problems

| # | Problem | Why it matters | How sure |
|---|---|---|---|
| 1 | **Some word clips measure quiet** in sprite.mp3. Nearly silent by file level: bamp, bet, bite, get, dak. Very faint: bake, hate, kide, tape. Some "snd:" sounds also measured quiet (bl and cl close to silent). S-11 did not change the audio, and Test 9 only checked that clips were listed. Mr. Scott says he can hear the words but some need fixing; which ones is not recorded yet | Every word must be heard clearly | File levels: certain. How they sound in the game: for Mr. Scott's word session |

### Not verified
- Sound by ear (headless testing cannot hear), real mic, speech worker.

### Next
- No new prompt written. Mr. Scott chose a separate session focused on getting all the words correct (Opus).

---

## Test 9: Every Studio word list (November 27, 2026)

Studio commit 4008919 (same as Test 8). Code and data read only; nothing in the Studio repo was changed.

**How:** pulled every level's words and choices out of `src/data/level1.ts` with `tools/studio-tests/dump_words.ts`, then ran the new `tools/studio-tests/word_check.py`. It reuses the blocked-word fingerprints and the sound-alike rule from `tools/check_decodable.py` and checks each level against the skill sequence the Studio build actually uses. 11 levels, 335 words and runes, 670 tap choices. Placement probe words were checked against their source levels (all present).

**Key fact found while checking:** in tap mode the two wrong choices are **heard**, not read. The student sees the word and taps sound buttons. So a choice must never sound like the word, must never sound like a crude or hurtful word, and its spelling only matters for the audio file. Words and runes on screen still have to be decodable.

**Result:** 33 flags before the fix (some flagged twice), 0 after S-11 on a scratch copy outside the Studio repo. Every replacement word already has a recorded clip, so S-11 adds no audio.

### Ranked problems

| # | Problem | Where | Why it matters | How sure |
|---|---|---|---|---|
| 1 | **Hurtful or crude words played aloud as tap choices.** One World 3 rune choice is a spelling of an anti-gay slur. One World 1 choice is a slur for Mexican people. Others are a weight insult (2 levels), crude slang (2 levels each, two words) and a soda word that also means a drug. A World 1 rune and a World 2 choice each sound like crude words when read aloud. | W1 L1 to L5, W2 L3 and L5, W3 L1 | Students hear these from the game's own voice. Many of Mr. Scott's students are Hispanic. This is the kind of thing that ends a pilot. | Certain. The slur spelling was missing from the blocked list; added as a fingerprint. |
| 2 | **Short i and short e choices before m or n** (pin and pen, him and hem, ten and tin): 16 entries. | W1 L3, L4, L5 | These sound the same for many Gulf Coast speakers (the pin-pen merger). A student who hears two identical choices has to guess, and a right reader loses crystals and lock credit. W1 L3 is the e versus i level, so it hit hardest there. | High |
| 3 | **A choice that sounds exactly like the word:** sun with the choice "son". | W1 L4 | Two buttons say the same thing. No way to be right except luck. | Certain |
| 4 | **Words that use a pattern before it is taught:** frost (final st, taught in L4) and frill (ll, never taught) in W2 L3; blink (nk, never taught) in W2 L5. | W2 L3, L5 | Breaks the rule that every word on screen is decodable with what was taught. | Certain |
| 5 | **Rune "tev"** ends in v. English words do not end in a single v, so the rune teaches a spelling that does not exist. | W1 L3 | Small, but runes are pure decoding practice and should follow real spelling rules. | Certain |
| 6 | Skill sequence gaps in World 2: no ng, nk, tch, floss (ff, ll, ss), three-letter blends, or most l and r blends. World 1 adds o and u together in Level 2 (DESIGN.md had them one level at a time). | World 2, World 1 L2 | Students finish World 2 without patterns World 3 words will lean on. No fix now; Claude plans these with Step 8. The World 1 order stays as built. | Certain |

### Fixes chosen (Claude's reading call)

- W1 L3: hem, pen, men, den and ten are replaced by bed, leg, set, beg and let, so the e versus i level is fair for merged speakers. Short e keeps 12 real words and 6 runes.
- Every i/e choice before m or n becomes a, o or u.
- Runes: "fim" becomes "zim" (L1, L5); "tev" becomes "teb" (L3).
- W2 L3: frost and frill come out (fr keeps 4 real words and 2 runes). W2 L5: blink becomes blip.
- All flagged choices get ordinary replacements that already have recordings.
- Full list: prompt S-11.

### Not verified
- Sound of the new choices in the game (all clips exist in the word sprite; not heard).
- Spanish glosses for the 5 new W1 L3 words have no Spanish audio clip, same as the other levels after Level 1.

### For Mr. Scott to check by hand
- After S-11, play W1 L3 in tap mode for a minute: tap the choice buttons on "pin" and "bed". No two choices should sound alike.

---

## Test 8: S-09 half crystals on Expert (November 27, 2026)

Studio commit 4008919. **S-09 passed.** Lint and build clean. No page errors in the payout runs.

| Checked | Result |
|---|---|
| 48 payout cases: four difficulties; first try, second try, heard first, heard first then second try, shown; real words and runes (tap), real words spoken first and second try | Pass. Only Expert second try changed: real word 6, rune 13, spoken 6. Other difficulties still pay 4, 8 and 4 |
| Feedback line | Pass: the new line shows only on the Expert half payout. Fits on screen at 1093 x 614 |
| Streak and Rift Lock counts, Expert and Normal | Pass: a second try reset the streak to 0 and added no lock credit |
| Files changed | Pass: BUILD.md, session log, RuneForgePanel.tsx, level1.ts (4 files, about 300 KB full size) |

### Ranked problems

| # | Problem | Why it matters | How sure |
|---|---|---|---|
| 1 | The sound rule card after a first miss ends by saying the missed word. The second try then pays half (6 or 13), while tapping the speaker before answering pays 4 or 8. This card behavior is older than S-09; S-09 raises what the second try pays on Expert. | A student can miss on purpose or guess, hear the word, then pick from the two choices left for half pay. A miss still resets the streak and gives no lock credit. | High (from code; audio cannot be heard in testing) |

### Not verified
- Real microphone and Azure scoring. Spoken reads used a stand-in for Chrome's recognizer, which does not check spoken runes.
- The voice fit version of the new line (code read only).
- A full 8 word Mega Forge run after a miss. The practice list code did not change.

---

## Test 7: How the Studio build handles missed words (code read, November 27, 2026)

Studio commit 72b0305. Read the code and ran lint (clean). No play test; nothing changed since Test 6. Checked before writing the Expert grace prompts.

### What happens on a miss today (all difficulties)

| Step | What the code does |
|---|---|
| First miss (tap or speak) | Word stays up, letter tiles show, the sound rule card opens with time stopped. No crystals lost. |
| Right on the second try | Pays 30% (real word 4, rune 8, spoken 4). Streak resets. Counts as not clean for the Rift Lock. Word goes on the practice list. |
| Second miss | Word is shown and read aloud. Forging it pays 3. Word comes back later. |
| Three spoken misses on one sound | Quick voice check opens once per sound. |
| Difficulty | No miss rule checks the difficulty. Expert treats misses the same as Easy. |

### Ranked problems

| # | Problem | Why it matters | How sure |
|---|---|---|---|
| 1 | **Closed, not a problem (Mr. Scott, Nov 27):** missing many words should be able to cost the level, which motivates careful reading. S-10 cancelled. Original note: **Misses can end an Expert level.** A level is won only after all Rift Locks fill (for example 10 of the last 11 first-try reads). Misses delay the locks. Past the listed waves, each extra wave gets 10 to 18% more health and about 14% more creatures (World 1 Level 3: after 5 extra waves, about 1.75 times the health and 1.7 times the creatures). On Expert this spiral ends in defeat for a student who misses words. | Breaks the approved rule "misses never end the level". Hits the readers who need the practice most. | High (from code; growth numbers from the level data) |
| 2 | **No second-try grace.** Expert pays 30% for a second-try read, the same as every difficulty. The approved rule is half. | Approved decision not built. | Certain |
| 3 | The Expert grace decision is in AI-STUDIO.md but not in the Studio BUILD.md decisions list. | AI Studio reads BUILD.md every time. | Certain. S-09 and S-10 add it. |

Note for later (no prompt): the same extra-wave spiral exists on Easy, Normal and Hard. Mr. Scott decides after his Normal playtest (CHECKLIST Step 6) whether lower difficulties get it too.

### Prompts written
- S-09: half crystals for a second-try read on Expert (problem 2).
- S-10: cancelled (see problem 1).

### For Mr. Scott to check by hand
- After S-09, on Expert: miss a word, then read it right. It should pay 6 (rune 13).

---

## Test 6: S-08 documentation check (November 27, 2026)

Studio commit 72b0305. **S-08 passed.**

- Only `BUILD.md` and `docs/SESSION-LOG.md` changed.
- The sync rule and the decision line say the 150 file and 15 MB numbers apply to each sync.
- A search of `BUILD.md`, `README.md` and `docs/DESIGN.md` found no rule applying them to the whole repo.
- Documentation only, so no lint, build or play test was run. No new problems to rank.

---

## Test 5: November 27, 2026 (S-05, S-06 and S-07, Studio commit 05a82e3)

Result: **S-05 passed. S-06 passed. S-07 passed.** The two voice tasks still need Mr. Scott's listening check. Lint and build clean.

| Step | Checked | Result |
|---|---|---|
| S-05 | All 7 walkthrough speaker buttons at 1366 x 768 and 1093 x 614 (each step opened directly, not played through) | Pass: each played its own `walk.step` clip, no computer voice |
| S-06 | All 11 level card speakers | Pass: each played its own `level.*` clip, no computer voice |
| S-06 | Silent e card after a missed word in World 3, both screen sizes | Pass: `rule.magice.v1` played when the card opened and when tapped |
| S-05, S-06 | Audio file | Pass: 19 new clips inside the sprite, no overlaps, none silent. 77 old entries unchanged and old audio identical sample for sample |
| S-07 | New build at default dials against commit b4049ab at Mr. Scott's dials: 11 levels, regular, extra and bonus waves, 558 creature groups per difficulty | Pass: no mismatches in counts, health or speed. 48 boss checks, no boss count changed. Dials start at 100 |
| S-07 | Difficulty descriptions and BUILD.md decision line | Pass (code) |

A scripted Level 1 run on Normal (about 2 minutes, 31 words) reached wave 3 with no page crash. Console errors were failed or missing resource loads in the test setup.

### Not verified
- How the new clips sound. A basic offline speech-to-text tool followed the walkthrough text roughly and could not judge single names or pronunciation. AI Studio's log says it listened to the clips.
- Walkthrough steps 1 and 5 and the silent e rule start with no quiet lead-in, unlike the other new clips. Listen for a clipped first sound.
- Microphone and the online speech checker (not reachable from the test computer).

### Size
146 tracked files, 16.3 MB (15.5 MB before these tasks). AI Studio's log reports 147 files and 29 MB with no total change, which does not match this count. The syncs succeeded.

### Correction to Test 1, problem 4
Test 1 called it certain that the repo was past its sync limit. That was wrong. See "GitHub and sync limits" below.

### GitHub and sync limits (checked November 27, 2026)

| Limit | Number | Source |
|---|---|---|
| GitHub: one file | blocked over 100 MiB, warning over 50 MiB | GitHub Docs, About large files |
| GitHub: one push | 2 GB | GitHub Docs, Repository limits |
| GitHub: whole repository | recommended under 10 GB on disk (the large files page says ideally under 1 GB) | GitHub Docs |
| GitHub Pages: published site | 1 GB | GitHub Docs, Pages limits |
| AI Studio: GitHub import | 1,000 files | Google AI developers forum reports, not official documentation |

- No GitHub or Google documentation found in this search gives a 150 file or 15 MB limit. Those were this project's own safety numbers.
- Project history: the Studio BUILD.md says a 653 file commit failed. In the last 30 commits, the 106 file, 9.0 MB commit is the largest by file count and by size, and it is on GitHub. Syncs also succeeded with the whole repo at 16.3 MB.
- Conclusion: the evidence fits a problem with how much one sync carries. The exact per sync limit is unknown. 150 files and 15 MB per sync are kept as cautious project numbers.

---

## Test 4: November 27, 2026 (S-04 hero power voices, Studio commit af697b2)

Result: **S-04 passed.** Lint and build clean. Only the three speech ids and the Studio session log changed.

| Done when | Result |
|---|---|
| Rally, Meteor and Time Freeze play a recorded clip, no computer voice | Pass: each started its `hero.*` clip during a live wave |
| On-screen messages unchanged | Pass (code) |

- AI Studio's log says the clips say "Rally.", "Meteor." and "Time Freeze." Claude cannot hear them. Mr. Scott checks by ear.
- Still on the computer voice: walkthrough speaker button (S-05). Level names and silent e rule wait for S-06.
- Studio repo: 146 files, 15,495,248 bytes.
- S-07 has not been run yet.

---

 November 27, 2026 (S-02 Builder Mode and S-03 top bar, Studio commit b4049ab)

Result: **S-02 passed. S-03 passed.** Lint and build clean, no page errors.

### S-02

| Done when | Result |
|---|---|
| Student view and Teacher Mode show no dials | Pass |
| Code runner-build shows the badge and 16 dial boxes | Pass |
| Default dials: wave 1 matches the build before S-02 (creature counts, health, speed, words to wave) | Pass, identical on all four difficulties in Level 1 and World 2 Level 1 |
| One dial at a time (Normal: count 50, extra words +2 and -3, health 200, speed 150) | Pass, only Normal changed each time |
| Limits, Copy dial values, Reset to default | Pass |
| Reload turns Builder Mode off and resets dials; no new saved data | Pass |
| Changing a dial mid-battle | Pass, word counter went from 8 to 10 |

Not tested by play: bosses staying at full count (confirmed by reading the code).

### S-03

| Done when | Result |
|---|---|
| No overlap, clipping, covered buttons or buttons under 32 x 32 | Pass at 1024 x 576, 1093 x 614, 1199 x 700, 1200 x 700, 1366 x 768 and 1920 x 1080; student, Teacher and Builder Mode; normal, last word, and bonus round with Finish |
| 1366 x 768 looks as before | Pass, student view buttons are in the same positions |
| Walkthrough banner clears the top bar | Pass at 1024 x 576 (step 1) |

Small note, no prompt: when the bar runs out of room it wraps to a second row. In student view at some widths (seen at 1024 and 1200) the right-side buttons drop a row when the wave button text gets longer ("Build first!" or "Bonus").

A scripted Level 1 run on Normal still built defenders, forged 52 words and ran waves to the end screen.

### Robotic voice (CHECKLIST Step 4)

Checked by catching every call to the browser's computer voice.

| # | Problem | Cause | How sure |
|---|---|---|---|
| 1 | Rally, Meteor and Time Freeze speak in the computer voice | The engine asks for `power.rally`, `power.meteor`, `power.freeze`. Recorded clips exist under `hero.*` and are never used. | Certain (heard in test) |
| 2 | Walkthrough speaker button uses the computer voice | No recordings for the 7 steps | Certain (heard in test) |
| 3 | Silent e rule line and level card speaker use the computer voice on the live site | No `rule.magice.v1` or `level.*` recordings | High (from code and audio files; not played in test) |

Good news: all 434 Rune Forge words and sound choices have recordings.

### For Mr. Scott to check by hand
- After S-04: listen to what the three hero clips say. Claude cannot hear them.
- After S-05 and S-06: listen to every new line.

---

## Test 2: November 27, 2026 (S-01 Teacher lock, Studio commit 8fbb0ee)

Result: **S-01 passed.** Lint and build clean, no game errors.

| Done when | Result |
|---|---|
| Fresh load: no Playtest, scene previews, Clear, Unlock All, Reset Placement, Load MP4 | Pass at 1366 x 768 and 1093 x 614 (title, Settings, battle, defeat cut scene) |
| Wrong code shows "That code did not work." | Pass, Teacher Mode stays off |
| Code rift2026 shows the tools and the amber badge | Pass |
| Reload turns Teacher Mode off | Pass |
| Level 1 still plays | Pass in Listen and Pick (words forge, defenders build, waves run, defeat screen shows). SAY IT not testable here |

AI Studio also gated extra tools it found (Clear Level/All Locks in Settings, a teacher unlock button on locked level cards). Good.
Also in this build: the Level 1 walkthrough was reordered so it finishes before Wave 1 (Mr. Scott's direct request). It starts and shows 7 steps; Mr. Scott checked the rest.
Note: the scripted player still loses Level 1 on Hard (expected; it plays worse than a person, and Mr. Scott judged Hard right).

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
