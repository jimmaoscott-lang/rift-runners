# Game Design Document

**Title:** Rift Runners (chosen November 21, 2026). Tagline: "The worlds are breaking. Run."
**Status:** Draft 2, November 21, 2026 (gameplay redesigned as Hold the Rift; M3 built)
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
- Each world: 5 levels plus a boss level (6 total); Worlds 4 and 7 have 7 levels plus the boss. 8 worlds, 52 levels.
- Level card on the map: name, waves, new enemy, which word patterns, and the reward for winning. Every line has a speaker.

**Built in M4 (Session 9):** `game/src/map.js` draws the World 1 map in 3D (Thornwood open, the Dunes and Frostfang under fog). Six stones: Levels 1 to 5 and the Thorn King. States come from the progress record on the device (`game/src/unlocks.js`): a stone opens when the stone before it has been won; beaten stones turn gold with the best stars; the stepping stones between beaten levels turn gold; the Rift Warden stands at the stone the student is up to. Tap a stone or its name to open its card on the right, then Play. Stones whose level is not built yet say they open in a coming update. Stone places live in `levels-w1.json` under `map.stones`. Title screen Play now opens the map. The star count shows total stars out of 18.

### 4.1A Naming rule

No name the student sees may point at reading or at a reading problem. The game, worlds, levels, abilities and rewards are named for the adventure, like a movie title (example: "Escape from Witch Mountain"). Words like read, word, letter, spell, phonics, level or fluency stay out of names. Reading is the power inside the game, never what the game is called. ("Level" appears only as a small label, like "Level 3", never as a name.)

World names: World 1 "Escape the Thornwood" (forest), World 2 "Dunes of the Dead Sun" (desert), World 3 "Frostfang Pass" (ice), World 4 "The Drowned Coast" (ocean), World 5 "Ashfall" (volcano), World 6 "Skyport Zero" (sky city), World 7 "The Sunken Vault" (ruins), World 8 "The Rift Core" (final fortress). World 1 level names: Thornwood Edge, Bramble Crossing, The Hollow Trail, Wisp Hollow, Old Watch Ruins, boss: The Thorn King.

### 4.2 Core loop (one level, about 8 to 12 minutes)

1. **Build phase:** start crystals plus the Forge. Place the first defenders. The first wave comes after 10 finished words (or cards), or sooner if the student presses Start wave (no timer).
2. **Waves:** creatures march. Defenders fight on their own. The student keeps forging crystals, builds more, upgrades, and fires hero powers.
3. **Between waves:** forge, build, upgrade. The next wave comes when the student has finished 10 more words (or cards). Waves come from reading, never from a clock (section 6).
4. **Waves keep coming until mastery or defeat (Mr. Scott, Session 6).** The first waves follow the level file; after that they keep coming, bigger and tougher each time. Each level shows **rift locks**, one per vowel pattern it teaches. When every lock is full (mastery, section 5.1), the next wave after the level's minimum (3 waves in Level 1) is the **final wave**. Surviving it closes the rift and wins. Stars: 3 = Anchor untouched, 2 = Anchor above half, 1 = survived. If the Anchor falls first, the level is lost, but lock progress is kept.
5. **Rewards:** the next level unlocks, often a new defender or upgrade, skins for 3 stars, crystals carried to the upgrade bank.
6. **Level Clear screen** with growth (section 12A).

### 4.3 Level 1 tutorial (built Session 18)

Runs automatically the first time a student opens Level 1. It does not run on later plays of Level 1, or for a student whose record already has a finished battle. **Settings, Replay tutorial** opens Level 1 with the tutorial again; only replays show a **Skip tutorial** button.

- Five steps, about 2 minutes. Each step has a narrator line, a short text card (shown even with Battle captions off, every line has its own speaker), and a green glow with a bouncing arrow on the right spot. **The rest of the screen is greyed out** (Mr. Scott, v0.14.1): only the card and clear windows around the parts used in that step stay bright, and taps on the grey part do nothing. Build spots get round windows.
- The battle holds still in every step until the student does the action. No timers.
- **Step 1, read to earn:** read one word in the Forge (tap the sounds, pick, Forge). If the mic works, a second line points out Say it. If a teacher set Speak first, the line asks the student to press Say it instead. Tutorial words are real words, no runes.
- **Step 2, build:** arrow to the Archer Tower card, then to an open tower pad. Only the Archer Tower can be built here.
- **Step 3, reading brings waves:** the Next wave counter and Start wave glow. The student reads 2 more words (the card counts them), or presses Start wave.
- **Step 4, first wave:** no grey-out, and every unlocked defender can be built (Mr. Scott: the student needs to defend). The card shrinks to a thin strip at the top so the battlefield stays clear. A small tutorial wave (6 wisps, 1 thornback, weaker than wave 1). It counts as wave 1; the level's wave 1 comes next. When a creature reaches the Rift Anchor, the narrator says that creatures that get through hurt it.
- **Step 5, rift locks:** the locks glow. "Read words right on the first try to fill these locks. Fill them all, survive the final wave, and the rift closes." **Let's go** ends the tutorial and starts normal play.
- Tutorial words count toward the rift locks and the progress record like any other read (Mr. Scott). The finished tutorial is saved in the progress record on the device (`tutorial.done`); clearing progress in Teacher settings brings it back.
- Upgrades, hero powers and later defenders are taught by one-time tips the first time each matters (like the new creature lines), not by tutorial steps.

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

**Level ramp for every world (decided by Claude, Session 12; Mr. Scott agreed):** Levels bring in the new pattern a little at a time, the last regular level mixes it with everything before, and the boss is a fluency check on connected text. Rune share grows from about a quarter to about a third inside each world. Worlds 4 and 7 carry the most patterns, so they get 7 levels plus the boss instead of 5 (52 levels in all). Eight worlds stay: two longer worlds reuse their map, creatures and defenders, while a ninth world would cost several build sessions.

| World | L1 | L2 | L3 | L4 | L5 | L6 | L7 | Boss |
|---|---|---|---|---|---|---|---|---|
| 1 Short vowels | a, i | + o | + e | + u | all mixed | | | Phrases, short passage |
| 2 Blends and digraphs | sh, ch, th | wh, ck, ng, nk | l and r blends (flag, crab) | s blends, final blends (spin, best) | 3-letter blends, tch, floss ff ll ss, mixed | | | Sentences |
| 3 Silent e | a_e, i_e | o_e | u_e, e_e | pairs: hop/hope, cap/cape | with blends, soft c and g (ice, page), mixed | | | Short paragraph |
| 4 Vowel teams | ee, ea | ai, ay | oa, ow (snow) | oi, oy | ou, ow (cow) | oo (moon, book), ew | aw, au, all mixed | Paragraph |
| 5 R-controlled | ar | or, ore | er, ir, ur | air, are, ear (bear) | all mixed | | | Longer paragraph |
| 6 Syllables | compound words | VC/CV (basket) | open V/CV (robot) and flexing (camel) | consonant-le (candle) | long words with teams and r-control, 3 syllables | | | Story passage with questions |
| 7 Word parts | -s, -es, -ed (3 sounds), -ing | doubling and drop e (hopping, baking) | -er, -est, -ly, -ful, -less, -ness | un-, re-, pre-, dis-, mis- | -tion, -sion | -ment, -able | roots port, struct, ject, rupt, spect | Passage with vocabulary questions |
| 8 Fluency | phrase reading | punctuation | dialogue and expression | short timed passages | longer passages with questions | | | Final boss |

**Levels 4 and 5 (built Session 17, Claude's call):** Level 4 (Wisp Hollow) brings in short u with all five vowel locks, rune share 30%. Level 5 (Old Watch Ruins) mixes all five with runes at 35% and a longer trail. To keep words fresh across five levels, World 1 gained hug, jug, tub and gum (short u) and four runes: baf, jat (short a), fep (short e), kib (short i). Every rift lock still needs 9 of the last 10 reads; a student's earlier reads of a, i, o and e carry in from Levels 1 to 3.

**World 1 word rules (built in M2):** three letters, consonant + short vowel + consonant. No final r, w or y (they change the vowel), no c or g before e or i (soft sounds), and final blends like "bend" wait for World 2. Words live in `game/data/world1.json`.

**Heart words:** each world allows a small list of high-frequency irregular words (for example: the, was, said, of, to, you, they, were). Heart words are taught directly and stored in `game/data/heart-words.json`.

**Decodability checker:** `tools/check_decodable.py` checks every word and passage against the patterns taught so far plus allowed heart words, and flags anything that does not fit. All new content must pass it.

### 5.1 Mastery

**Rift locks (built in Session 6, decided by Claude):** a lock fills from the student's last 10 reads of that pattern, counting only reads that are right on the first try with no speaker help. 9 of the last 10 fills it (90%). Runes count toward their vowel's lock, since they are pure decoding. The count uses the student's whole history on the device, so a lost level still moves the locks forward, and a pattern mastered in one level stays mastered in the next unless new misses pull it down. Settings per level: `mastery`, `minWaves`, `endless` and `finalBoost` in `game/data/levels-w1.json`. Simulated players: 90% readers close the rift in about 4 to 9 waves; a reader who never reaches 90% falls around wave 13 (about 15 minutes), which ends the session with a summary of what to practice.

**Final wave message (Session 9, Mr. Scott):** each level keeps its minimum waves (3, 3, 4) even when every lock is full. When the locks fill, or are already full at the start, the game says which wave will be the final one ("Hold out until the final wave: wave 3"), and the wave counter reads "Wave 1 of 3". When the next wave is the final one, it says so.

**Locks hold once full (Session 9, decided by Claude):** during one try at a level, a lock that has filled stays full even if a later miss drops the last 10 below 9. The student showed mastery; the end screen still shows the real last 10 reads, and the next try starts from the real record. Without this, a strong reader had to hold 3 or 4 patterns at 9 of 10 at the same moment, and Level 3 ran past 20 minutes. Simulated 90% readers with locks that hold: Level 2 wins in 6 to 11 minutes, Level 3 in 7 to 11 minutes. 80% readers usually win Level 2 and fall around wave 15 on Level 3, which ends with a practice summary.

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
   - **Tap mode sound choices (Session 7, decided by Claude after Mr. Scott's playtest):** computer voices saying one short word blur close vowels, and on the Gulf Coast "pin" and "pen" sound the same (short i and short e merge before m and n). So the two wrong choices use vowels that sound far apart: for short a, i then u; for short i, a then u; for short e, o then u; for short o, i then e; for short u, i then e (o or a when a c or g start rules one out). Short i and short e are never paired before m or n; the checker enforces it. Close pairs (a/o, i/e) that DESIGN 5 targets for Spanish speakers get practiced in speak mode (M5), where the student says the word instead of telling two voices apart. Forge words are voiced at 25% slower with a short lead-in pause.
   - **Speak first setting (requested by Mr. Scott, Session 9; build in M5):** a setting "Speak first: 0, 1, 2 or 3 tries." At 1 to 3, each real word starts with only the mic button; the three tap choices stay hidden until the student has made that many voice attempts on that word, then they come back on their own. At 0, choices show right away (today's behavior). Rules, decided by Claude:
     - **Any real try counts,** right or wrong, and even if Chrome heard nothing it could match. A student with an accent or a quiet voice is never stuck behind the mic; the goal is to make them try to read it first, so the choices stop being a shortcut to guess.
     - **Runes skip it** (Chrome cannot check made-up words), so runes always show choices.
     - **Never required when the mic cannot work.** If the mic is blocked, missing, offline, or fails, choices show at once and the setting waits until the mic works again. This keeps the hard rule that tap mode always works.
     - **Student sets it; a teacher can lock it.** In Settings the student can change it unless a teacher has locked it. Teacher lock: a 4-digit teacher PIN set on the device (no student data, nothing leaves the device). A locked setting shows a lock icon and the student can still see the value. When teacher reports arrive (M10), a teacher can set it per student code from the Google Sheet.
     - Speaking first counts as a first-try read when the word is matched, for crystals and rift locks. If the student moves on to the choices after the speak tries, the read counts as a second try (half crystals, no lock credit), the same as a tap miss.
   - **Built in M5 (Session 10, decided by Claude):** a green **Say it** button (mic icon, M key) sits under the word for real words. One press listens for up to 5 seconds and stops as soon as the word is caught. Chrome's guesses (up to 5) are checked for the word on its own. Speak pays +15 on a clean first try (tap pays +10), half after a miss or the speaker. Speak misses work like tap misses: first miss breaks the word into letter tiles ("Say each sound, then say the word"); second miss plays "Listen, then say it" plus the word and lights the right tap choice. Game sound drops low while listening so it does not leak into the mic. If the mic is blocked, missing or offline, speak mode turns off for that visit, the choices show and the reason is said once; a passing mic test in Settings turns it back on. Nothing is recorded or saved: only whether the word matched.
   - **Same-sound spellings (Session 10 fix):** Chrome may type a word another way that sounds the same: "10" for ten, "when" for win, "son" for sun. Each word in `game/data/world1.json` can list these in `sayAlso`, and they count as a match. Add to it whenever a word that was read right keeps failing (Test mode shows what Chrome heard). Only true same-sound spellings go there, never a different vowel.
   - **Speak mode word rule (Session 10, decided by Claude after Mr. Scott's mic test):** words with short i or short e right before m or n (pin, pen, ten, win, him, hem) are tap only, like runes. Chrome heard the voice on these but returned no word, and in Gulf Coast speech the two vowels sound the same there, so no checker could fairly score them. A word can also be marked `"noSpeak": true` in the word list if Chrome keeps failing on it. Tap mode still teaches these words, and its wrong choices already avoid the i/e pair. When the Azure check is up (M5b, below) these words can be spoken again; the rule applies only when Chrome is the checker.
   - **Azure pronunciation check (M5b, Session 11, decided by Claude):** speak mode now uses Azure Pronunciation Assessment by default. The game records only the stretch where the student is talking (it stops 0.7 seconds after the voice stops, at most 5 seconds), sends it to the speech checker (a small Cloudflare Worker that holds the Azure key, `worker/`), and Azure scores each sound of the word. Chrome's recognizer listens at the same time as a backup. If the checker is blocked, offline, out of free hours, busy or slower than 4 seconds, the game uses what Chrome heard, so the student never has to say the word again. A busy or out-of-hours answer pauses Azure for 2 minutes; two other failures in a row turn it off for that visit. With Azure up, pin, pen, ten, win and the other short i or short e before m or n words can be spoken again. Runes can be spoken too (`spokenRunes` on in `game/data/speech.json`, Session 11): in Mr. Scott's test every rune passed when read right except "pid," which Azure reads as the abbreviation P-I-D. A rune like that is marked `"noSpeak": true` in `game/data/world1.json` and stays tap only. Watch for this when new runes are added: skip any rune that is also a common abbreviation or code. Chrome alone cannot check runes, so they go back to tap only whenever Azure is off. **Turned off in Session 17 (Mr. Scott):** runes are tap only again (`spokenRunes` false). Made-up words kept failing correct reads (fim, sut), and a rune now shows just the three sound buttons and Forge. Nothing is saved: the recording is thrown away after the check.
   - **Azure scoring (Claude's reading call):** the vowel is the skill being checked, so it gets the strict check and the consonants get a lenient one, so an accent never fails a correct read. A word matches when (1) the vowel scores 60 or more and Azure does not hear a different short vowel instead (unless the vowel scores 80 or more), or Azure says the sound was closest to an accepted version of the right vowel; (2) the other sounds average 40 or more with none under 15; and (3) the word scores 45 or more (skipped when the vowel was an accepted version). Accepted versions: short i also takes /i/ (Spanish speakers say "ship" close to "sheep"; that is accent, not decoding), short u also takes the schwa, short o also takes /ɔ/ (cot/caught), and before m or n short i and short e count for each other (Gulf Coast pin/pen). Short a and short o, and short i and short e elsewhere, stay apart: those are the close pairs DESIGN 5 targets. **Spelling sets the vowel (Session 16):** for made-up runes Azure guesses a pronunciation and sometimes guesses a long vowel (Mr. Scott found "fim" failing about half the time on a correct read). The check now always uses the short vowel the spelling asks for; when Azure expected a different vowel, only what the vowel sounded most like counts. This also stops a wrong long-vowel read from passing on a rune Azure misguessed. All numbers live in `game/data/speech.json` and get tuned from Test mode readouts, which show each sound's score and what it sounded most like.
   - **Checker trouble is never the student's fault:** if the checker fails and nothing can judge the word, the game says "The checker missed that one" (say it again) or "Speak mode cannot check this word right now" (use the choices), and neither counts as a try.
   - **Pin/pen rule for speak mode:** before m or n, the short i and short e spellings both count as a match (say "pen," Chrome hears "pin"). That is Gulf Coast dialect, not a decoding error.
   - **Teacher settings (built in M5):** Settings has a **Teacher** button behind a 4-digit PIN made on first use (typed twice, kept on the device as a scrambled code). Inside: Speak first (0 to 3), Lock Speak first, Test mode, Change PIN, and Clear progress on this device (tap twice; clears levels, stars, locks and reading history, turns Test mode off, keeps settings and the PIN; added Session 15). A forgotten PIN can only be cleared by clearing the site's data on that device, which also clears progress (open question).
   - **Test mode (teacher settings, for Mr. Scott's testing):** opens every level and defender on the map so any level can be played. Plays still count toward the device's progress record. The map shows an orange "Test mode" tag while it is on.
   - **Limit:** Chrome's speech recognizer turns sounds into real words, so it cannot judge made-up runes and may hear "set" as "sit." Runes stay in tap mode until a pronunciation checker (Azure Pronunciation Assessment or an on-device model) is tested in M5.
3. **Every forge pays right away:** crystals fly from the Forge into the crystal counter with a sound.
   - Real word, first try: +10. Rune, first try: +20.
   - Hearing the word first (speaker on the word) or second try: 30% (real word 3, rune 6). Lowered from half in Session 15 so first-try accuracy matters more now that waves come from reading.
   - After the answer is shown: 2, so the student is never stuck.
4. **Streak meter:** first-try reads in a row fill 8 pips. A full meter is a **Mega Forge**: +100 crystals and a burst of light over the battlefield that hits every creature for 25 damage (built in M3, so a strong read streak is felt on the field).
5. **Hero charge:** forging also charges the hero's powers.
6. **Misses:** no lost crystals. Letter tiles with the vowel in gold, "Let's break it up," then try again. The word comes back sooner next time.
   - **Sound rule card (Session 17, Mr. Scott's request; content is Claude's call):** after the first miss on a word (tap or speak; not when the mic heard nothing, and not during an overheat cooldown), a card covers the screen and the battle holds still. It cannot be closed until the voice finishes; then **Got it** (or Enter) closes it and **Hear it again** replays it. Full card the first time a vowel is missed in a level: the rule ("One vowel, closed in by a consonant, says its short sound."), the key word row, then the word blended sound by sound with each letter lighting up, then the whole word. **Key word row (v0.16.0, November 22 plan item 2):** the old line "a says /ă/ like ax" read as one confusing sentence. Now it is three boxes: the vowel in a gold tile, its sound (/ă/), and a box labeled KEY WORD with the key word in letter tiles and its vowel lit gold. Spoken as "/ă/, as in at." **Short card:** later misses of that vowel in the same level show only the word as letter tiles, each sound, then the whole word ("f, o, g, fog"), about 3 to 4 seconds. A **Show the rule** button on the short card opens the full card at any time (counted as `ruleShow`). Time limit from Mr. Scott: 7 or 8 seconds for the full card; the clips are trimmed of Azure's silence and preloaded. Key words are closed syllables the student can decode, chosen so the vowel sound is easy to hear: at, jet, it, on, up (`rules` in `world1.json`, checked by the decodability checker). "at" and "on" replaced "ax" and "ox" in v0.16.0: they start with the vowel and every student knows them. Letter sounds are voiced from IPA as `snd:` clips; if a clip is missing the game stays silent for that letter rather than saying its name. The second miss still lights the right choice. Each card is counted (`rule-a` and so on) for teacher reports. Later worlds add their own `rules` block (silent e, vowel teams) with no new code. Planned upgrade: in speak mode, name the vowel the student actually said.
7. **Recent forges list:** the last few words with what each one earned, so students see the reward and the words again.

**No timers on reading, even in battle.** The battle never waits on a timer to read a word, and Pause is always one tap away; the Forge stays open while paused. Students with extended time (and anyone who turns on Focus in Settings) get slow motion. **Built in M3:** Focus in Settings runs the whole battle at half speed (a word is always up in the Forge).

**Guessing (same rule as Mr. Scott's other games):** 3 wrong in a row that are each very fast, or 3 wrong in a row on the same button position. The Forge cools down for 5 seconds the first time and 10 seconds after that ("The forge is overheating. Read each one."). Correct answers are never flagged.

**Keyboard (built in M3):** 1, 2, 3 pick a sound; Enter or F forges; H hears the word; S starts the next wave; P or Esc pauses; after picking a defender, arrow keys move between glowing spots and Enter builds.

**Waves from reading (decided by Mr. Scott, Nov 21; built in Session 15):** waves come from reading instead of the Start wave button, so a student cannot stockpile crystals by forging as long as they like between waves.
- A wave comes every 10 finished words (World 1) or 10 finished cards (World 8), set per level as `waveEvery` in `game/data/levels-w1.json`. Only finished items count (a word forged or a card answered, after any number of tries), so guessing never brings waves faster.
- Items finished during a wave count toward the next one. If the count fills during a wave, that wave is banked and comes as soon as the field is clear, after a 3 second breath (Claude's call: waves line up one after another instead of piling on top of each other, so reading fast is never punished, and every student faces the same waves for the same reading). If the count fills between waves, the wave comes after 1.5 seconds (first wave) or 3 seconds. The breath runs on game time, so Pause and Focus stretch it.
- **Start wave** stays as an early call. It brings the wave the student was reading toward, so the count starts over at 0. It shows only between waves while no wave is already on its way.
- **Counter:** the top bar shows "Next wave in 7 words" (or cards) beside Start wave; tap it to hear it. When a wave is earned it says "Next wave coming!", or "Wave 3 comes next" during a wave. The Pause button is icon only so the bar fits beside the Forge. Pause also stops the music (Mr. Scott, Session 15).
- Still untimed: a student who stops reading is never attacked. Waves come from reading, never from a clock.
- Story levels: finishing the Rift Seal brings the final wave right away (the Seal is the level's big read). World 1 levels: once every lock is full and the minimum waves are done, the next earned (or called) wave is the final one.

**Income balance:** crystals come only from the Forge. Defeated creatures drop shards, but since Session 16 shards are never spent during a level: they go to a bank for the Armory between levels. Mr. Scott found that kill income let a player max two defenders, then press Start wave and build for 5 waves without reading a word. Later levels cost more, so students forge steadily all level. Target: 6 to 10 words a minute during play.

**Level 1 balance (tested with a simulated player):** 100 starting crystals (one Archer Tower plus one Spike Pit), creatures drop 1 or 2 shards. A player who never reads loses in wave 3. With waves until mastery (Session 6), accurate readers win in 4 to 9 waves and inaccurate ones lose later with progress saved. Pausing to forge always helps, and Focus halves the speed. Numbers live in `game/data/units.json` and `game/data/levels-w1.json`.

**Balance with waves from reading (Session 15, `tools/sim_balance.py`):** the simulated player plays the real battle code with a steady builder and three readers: strong (95% first try, speak mode, a word every 4 seconds or a card every 9), typical (80%, tap, 6 or 13 seconds) and struggling (50%, tap, 8.5 or 18 seconds). Targets from Mr. Scott: typical barely holds, struggling loses around wave 4 or 5 with progress saved, strong wins. Results, 10 runs each:

| Level | Strong | Typical | Struggling |
|---|---|---|---|
| 1 | wins all, 3 to 4 waves | wins 9 of 10 (3 with Anchor damage), 3 to 8 waves | loses at wave 4 or 5 |
| 2 | wins all, 3 to 4 waves | wins all (2 with damage), 4 to 10 waves (Session 16, with specialties) | loses at wave 4 to 7 |
| 3 | wins all, 4 to 8 waves | wins 9 of 10 (5 with damage), 7 to 15 waves; one loss at wave 15 (Session 16, with specialties) | loses at wave 4 |
| Final | wins all in 3 waves | wins all in 3 waves (2 with damage) | loses at wave 4 to 6 in 7 of 10; 3 win when the Story lock fills by luck |

Crystals per 10 items: World 1 about 80 (struggling), 145 (typical), 245 (strong, Mega Forges included); final level about 225, 300 and 380. Wave strength (`hp` per wave, `endless` steps) was raised in the middle waves and the endless steps set per level; World 1 starting crystals are unchanged (100, 100, 120) and the final level starts with 400. Numbers live in `game/data/levels-w1.json` and `game/data/units.json`. Run `python3 tools/sim_balance.py` after any change to waves, defenders or pay.

**Levels 4 and 5 (Session 17, kill income off, hero powers on):** these runs use `--history 20`, so the simulated student arrives with 20 earlier reads of each vowel from the levels before, as a real student would. Level 3 under the same setup, for comparison: typical wins 4 of 10, struggling loses at wave 3 or 4.

| Level | Strong | Typical | Struggling |
|---|---|---|---|
| 4 | wins all, 4 to 7 waves, no damage | wins 3 of 10, losses at wave 8 to 12 | loses at wave 4 to 6 |
| 5 | wins all, 4 waves, no damage | wins 4 of 10 (all with damage), losses at wave 8 to 11 | loses at wave 4 to 6 |

Both start with 150 crystals. The simulated builder does not adjust to bats (it still builds pits, golems and cannons), so real students who switch to Archer Towers and Lightning Spires should do a little better. Mr. Scott playtests before any retune.

---

## 6A. Defenders

**November 22 proposal:** `docs/ARSENAL.md` plans one new defender and two new creatures every level, damage types and traits that force matching, camo creatures, Rift Intel cards and prices in words of reading. Approved November 22; it replaces the unlock order below.

Placed on build spots beside the trail (towers) or on the trail itself (blockers and traps). Each has 3 levels, and a third upgrade picks one of two tier 3 specialties.

| Defender | Role | Unlocks |
|---|---|---|
| Archer Tower | Steady single-target damage, hits fliers | Start |
| Spike Pit | Trap on the trail, damages everything that walks over | Start |
| Stone Golem | Blocks the trail and holds creatures in place | Start |
| Frost Totem | Slows everything in its ring; tier 3 can freeze | Start |
| Ember Cannon | Splash damage on groups; breaks shields | Level 1 win |
| Lightning Spire | Chains between creatures; breaks shields | Level 2 win |
| Vine Snare | Roots creatures in place for a few seconds | Level 3 win |
| Ballista | Long range, extra damage to fliers and big creatures | Level 4 win |
| Healing Shrine | Repairs golems and barricades; slowly heals the Anchor | Level 4 win |
| Barricade | Cheap wall that blocks or reroutes on open maps | Level 5 win |
| Rift Mine (World 2+) | One-time blast on the trail | World 2 |
| Hawk Nest (World 2+) | Hawks hunt fliers anywhere on the map | World 2 |

**Built in M3:** Archer Tower, Spike Pit, Stone Golem and Frost Totem, each with 3 levels (upgrade adds a gold band; tier 3 specialties come in M6). The Golem holds up to 3 creatures (4 at level 3). Session 6: Mr. Scott found it felt unbreakable, so its health dropped (150, 210, 290 by level), Thornbacks and Wisps hit it harder, it barely heals, and it rebuilds 14 seconds after it falls. Selling returns 60% of what was spent. Build two ways: pick a card in the build bar and tap a glowing spot, or tap an empty spot and pick from the menu. Level 1 offers all four for the demo; the unlock order above takes over with the map in M4. Locked defenders show in the bar with the level that opens them.

**Unlock order revised in M4 (Session 9, Claude):** Golem and Frost Totem stay open from the start because Level 1 balance was playtested with all four. Ember Cannon opens after Level 1 (it answers the Bramble Swarms in Level 2) and Lightning Spire after Level 2, so both shield breakers are in hand before Shield Brutes arrive in Level 3. Unlocks are worked out from the wins saved on the device (`unlockBy` in `units.json`). Every defender shows in the build bar; locked ones say which level opens them, and ones not built yet say "Coming soon" once their level is won.

**Built in M4:** Ember Cannon (lobbed shell, splash on landing, cost 120) and Lightning Spire (zaps the creature furthest along, then jumps to 2, 3 or 4 more with less damage each jump, cost 150). Both break shields.

**M6 plan (Session 12, Claude as build manager):** M6 runs in four sessions. (1) Vine Snare, Ballista, Healing Shrine and Barricade. (2) Tier 3 specialties for all ten defenders. (3) Rift Warden hero powers. (4) Armory with banked crystals. Each session ends playable.

**Built in M6 part 1 (Session 12):** the last four World 1 defenders. Numbers live in `units.json`.

| Defender | Spot | Cost (upgrades) | How it works |
|---|---|---|---|
| Vine Snare | Trail | 70 (55, 85) | When a ground creature steps in its ring, vines root up to 2, 3 or 4 creatures for 1.6, 2.0 or 2.5 seconds and squeeze them for a little damage. Then it regrows for 6, 5 or 4 seconds. Shield Brutes break free twice as fast. Wisps float over it. |
| Ballista | Tower | 110 (80, 120) | Very long reach. Fires one heavy bolt about every 2 seconds at the toughest creature in range. Bolts do 1.5 times damage to big creatures (Thornbacks, Shield Brutes, and fliers when Rift Bats arrive). It does not break shields, so cannons and spires keep that job. |
| Healing Shrine | Tower | 90 (65, 95) | Repairs Stone Golems and Barricades in its ring. During a wave it also mends the Rift Anchor by 1 every 30, 24 or 18 seconds, never above full. |
| Barricade | Trail | 30 (25, 40) | A cheap wall that holds creatures in place like a golem but never hits back. When it breaks it is gone, and the spot opens again. |

Fliers (Session 17): Ember Cannons cannot hit Rift Bats, and trail defenders (pits, golems, snares, barricades) do nothing to them. See 6B.

Choice (Claude): World 1 trails are fixed, so the Barricade only blocks there. Rerouting waits for the open maps of later worlds. Ballista, Shrine and Barricade unlock on Level 4 and 5 wins; until those levels are built, Test mode opens them for trying.

**Built in M6 part 2 (Session 16): tier 3 specialties.** Claude's call: the specialty is a third upgrade, from level 3 to level 4, so the level 1 to 3 numbers students have already played stay the same. Tap a level 3 defender and the popup shows both choices, each with a speaker, a one-line description and its price. Picking one is final (sell to change). The specialty's numbers replace level 3's (`spec` in `units.json`). A gem above the defender shows the choice: orange for the first, blue for the second.

| Defender | Cost | First choice (orange) | Second choice (blue) |
|---|---|---|---|
| Archer Tower | 145 | Sharpshooter Tower: 46 damage, long reach, slower | Volley Tower: 3 arrows at once at 3 creatures |
| Spike Pit | 110 | Blade Pit: 44 damage a second | Tar Pit: 20 damage a second and slows to half |
| Stone Golem | 195 | Mountain Golem: 470 health, holds 6, rebuilds in 9 seconds | Quake Golem: every slam hits everything it holds |
| Frost Totem | 160 | Glacier Totem: freezes its ring every 6 seconds for 1.6 seconds (Brutes half) | Blizzard Totem: wider, colder ring that hurts 7 a second |
| Ember Cannon | 230 | Doom Mortar: 115 damage, huge blast, slow | Inferno Cannon: faster shells that leave fire on the ground for 3.5 seconds |
| Lightning Spire | 250 | Storm Spire: jumps to 6 more creatures | Thunder Spire: one 125 bolt that stuns for 0.9 seconds |
| Vine Snare | 150 | Thorn Snare: thorny vines squeeze for 28 a second | Deep Roots: wide ring, holds 7 for 3.6 seconds |
| Ballista | 210 | Siege Ballista: 165 bolts, double damage to big creatures, breaks shields | Repeater Ballista: fires about 3 times as fast |
| Healing Shrine | 170 | Life Shrine: big healing, mends the Anchor every 12 seconds, golems in its ring rebuild twice as fast | War Shrine: defenders in its ring fire 30% faster |
| Barricade | 75 | Stone Wall: 560 health, holds 8 | Thorn Wall: thorns hurt everything it holds |

Each pair trades power on one target against power on many, or damage against control, so the choice depends on the trail and the creatures. Balance: the first prices tried (about 1.4 times the level 3 upgrade) let the typical reader win every World 1 run without damage, so prices went to about 1.8 times, Storm Spire went from 7 jumps to 6, and the endless wave growth on Levels 2 and 3 went up (`hpStep` 0.18 to 0.22 and 0.15 to 0.2). `sim_balance.py` now buys specialties.

**Hero:** one Rift Warden on the map, with 3 powers charged by forging: **Meteor** (big area blast), **Time Freeze** (stops a wave for a few seconds), **Rally** (defenders fire faster for a short time). More heroes unlock later, each with a different power set (like the rulers in Hold the Keep).

**Built in M6 part 3 (Session 16):** the Rift Warden stands in the camp with a glowing staff. Three power buttons sit under the top bar, each with a charge bar. Every finished word adds 1 charge to all three (a story card adds 2). Powers fire only during a wave; tapping one that is not ready says what it does and how many words are left. Numbers live in `units.json` (`hero`).

| Power | Charge | Effect |
|---|---|---|
| Rally | 15 words | Every defender fires 25% faster for 5 seconds |
| Meteor | 20 words | 60 damage in a 3.5 ring on the biggest group; breaks shields |
| Time Freeze | 25 words | Freezes every creature and stops the rift for 2.5 seconds |

Balance (Claude's call): Mr. Scott liked the difficulty after kill income was removed, so the powers stay small. A first version (8, 10 and 12 words, stronger effects) raised the simulated typical reader from 3 to 8 wins in 10 on Level 2. At these numbers: Level 2 goes from 3 to 5, Level 3 stays at 5. `sim_balance.py` fires each power when charged during a crowded wave (`--no-powers` turns that off).

**Armory: dropped (Mr. Scott, Session 16).** Levels are easy enough without permanent upgrades. Kill shards are still counted and saved with each battle (purple numbers on kills) but buy nothing.

---

## 6B. Rift creatures

| Creature | Trait | First seen |
|---|---|---|
| Thornback | Tough, slow (built in M3) | World 1, Level 1 |
| Rift Wisp | Fast and fragile, comes in packs (built in M3) | Level 1 |
| Bramble Swarm | Many tiny creatures at once | Level 2 |
| Shield Brute | Shield blocks most damage until lightning or a cannon breaks it | Level 3 |
| Rift Bat | Flies over traps and blockers | Level 4 |
| Splitter | Splits in two when defeated | Level 5 |
| The Thorn King | World 1 boss: summons thorns, roots defenders | Boss |

**Built in Session 17:** Rift Bat (hp 26, fast, flies at treetop height; `air` in `units.json`) and Splitter (hp 80, slow; when a defender kills it, two Splitlings run on from the same spot, hp 24 each and fast; a Splitter that reaches the camp does not split). Rules for fliers (Claude's call): bats pass over Spike Pits, Tar Pits, Stone Golems, Barricades, Vine Snares and burning ground, and Ember Cannon shells cannot hit them. Archer Towers, Lightning Spires, Frost Totems (slow and freeze), Ballistas (1.5 times damage), hero powers and the Mega Forge all hit them. Splitters count as big creatures for the Ballista. Defender descriptions say who hits fliers.

**Built in M4:** Bramble Swarm (hp 9, fast, tight packs) and Shield Brute (hp 140, slow; its shield cuts archer, spike and golem damage by 80% until an Ember Cannon, a Lightning Spire or a Mega Forge breaks it). The first time a new creature appears in a battle, a short line says what beats it.

Every later world adds its own creatures with new tricks (burrowers, healers, invisible stalkers, armored sky ships).

## 6C. How levels get harder

- **Creatures:** more waves, more creatures per wave, a new creature type every level, mixed types that need different defenders, stronger bosses.
- **Reading:** new patterns step by step (section 5), more runes, and later worlds use longer words and short phrases in the Forge.
- **Economy:** defenders cost more in later worlds, so steady forging matters.
- **Stars and replays:** 3 stars needs a clean defense. Replaying a level is extra reading practice.
- A level stays winnable for a student who reads steadily, even slowly. Speed of play is never required: Pause is always available.

---

## 7. Boss levels and the Rift Seal (fluency)

**Final level preview (Sessions 13 and 14, Mr. Scott's request for the December 2 meeting):** built ahead of the order so the meeting can see where students start (Thornwood, Level 1) and where they finish. "Heart of the Rift" is the last level of World 8, The Rift Core.

- Map look: dark basalt ground, glowing crystal spires instead of trees, a lava channel instead of the river, red and purple sky. Creatures are the World 1 types made much tougher (World 8 creatures arrive with M9).
- Reading (decided by Claude): the Forge shows **story cards** from `game/data/world8.json`, one or two sentences each, read in order so the story builds. Every word can be tapped to hear (counts as help). After reading, one question with three answers (detail, sequence, cause, vocabulary, main idea, inference). Right on the first try with no help pays 30 crystals; otherwise 15. Wrong answers never cost crystals; the card stays until it is answered.
- One rift lock, **Story**: 8 of the last 10 cards right on the first try (80%, a normal comprehension bar).
- **Rift Seal:** once the lock is full and the minimum waves are done, the Forge shows the Seal passage (about 70 words) and two questions. Finishing it makes the next wave the final one; surviving it closes the rift and wins.
- **Read aloud (built in Session 14).** Each story card and the Seal has a green **Read it aloud** button when a microphone works. Tap mode stays a full path; reading aloud is never required, and the time a student takes never lowers a reward.
  - The text is read one sentence at a time. The lit sentence is outlined, the others dim, and words Chrome hears turn green as the student reads. A sentence moves on by itself after a short pause once its last words are heard, after a 5 second pause, or when the student presses **Next line** (or N or Enter). The X button (or Esc) stops without a score.
  - Scoring, decided by Claude from standard oral reading fluency practice: each sentence's recording goes to the speech checker (Azure Pronunciation Assessment with miscue detection, `/passage` in the Worker). A word is right when Azure says it was read, or read with an accent (word score 50 or higher, `speech.json` passage.wordMin), so a mild accent is not a miss. Repeats, self-corrections and extra words never count against the student. **Tightened in Session 15** after Mr. Scott mangled words and still got credit: the accent bar went from 35 to 50, and Chrome no longer rescues a word Azure called skipped (Chrome fills in words from the sentence around them, so it hands back mangled words as right; `passage.chromeRescue` turns it back on). Test mode's orange line now lists every word Azure scored under 75, to tune the bar with real students. In Test mode each word also shows its own score on the word after a read (green right, red missed, "skip" for no word heard, "C" for scored by Chrome); students never see the tags. **Vowel check (Session 15, after Mr. Scott's test where "if" read as "eyef" scored 94):** the checker sends each sound's score for passages too, and a word misses when any vowel sounded most like a different vowel (unless it still scored 80 or more) or scored under 35. Accent variants are allowed: short i and long e, unstressed vowels as schwa, cot/caught, Gulf Coast long i as "ah", and pin/pen. Short a heard as short o stays a miss, the same close pair World 1 checks. When Azure is blocked, Chrome alone scores the read, and that stays loose for the same reason. When Azure cannot be used, Chrome's follow-along is the score. Dropped endings (-s, -ed) count as right: past World 7, a dropped ending is usually an accent pattern, not a decoding error.
  - Reading time runs from the first voice to the last voice, pauses included. Words correct per minute (WCPM) = right words / minutes.
  - Missed words turn gold with an underline; tapping one plays it. They also appear in Words to practice on the results screen.
  - **Cards:** bonus crystals by accuracy, on top of the answer pay: 90% or more right pays +15, 75% or more pays +8, below that pays nothing extra with a "Nice try" line. Reading aloud never counts as help, so the answer still pays the full 30.
  - **Rift Seal:** the battle holds completely still while the Seal is read aloud, so the WCPM is fair. The result shows words right, WCPM and the personal best ("New personal best!"). **Read it again** is always offered (repeated reading builds fluency); the best read is kept. A first read with 90% or more right also fires a Mega blast.
  - **Results screen:** a Reading aloud box with the Seal WCPM, words right, first read vs best read this visit, and a small bar line of every Seal read on this device (gold bar = best). Cards read aloud show count, percent of words right and card WCPM. The final level's win title is "The rift is sealed!"
  - **Saved on the device:** one record per passage read aloud (passage id, words right, total, time, WCPM, which checker) in the progress record, for the WCPM line in teacher reports (M10). No audio is ever kept.
  - Free Azure hours: the 70-word Seal uses about 1 to 2 minutes of audio per read, a card about 10 seconds.
- Reached from the World 1 map with Test mode on (teacher button "Final level preview").
- Balance for the preview (Session 13, Claude; retuned in Session 15 for waves from reading): 400 start crystals, a wave every 10 cards, waves 1.9, 2.8 and 3.6 times tougher than World 1 creatures, then 40% tougher each wave after that. A typical reader (80%, a card every 13 seconds) wins in about 8 minutes; a struggling reader (50%) usually falls in waves 4 to 6. Finishing the Rift Seal brings the final wave right away. Real World 8 balance comes with M9.
- The decodability checker accepts any plain English word in World 8 (all patterns are taught by then) and still blocks unsafe words.


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
- **Battle captions (Session 17, Mr. Scott):** battle messages from the narrator are voice only by default so they never cover the fight. Settings, Battle captions On shows them in a small box beside the hero power buttons (for students who are hard of hearing or have no headphones; worth noting in an IEP).
- Settings save on the device right away: language, text size (Normal, Large, Extra large), font (Lexend or OpenDyslexic), volume, motion (Full or Reduced), and Focus (battles at half speed, added in M3). Motion starts at Reduced if the Chromebook's own reduced motion setting is on.
- Short sessions with a natural stopping point every few minutes
- Works with keyboard, mouse or touch

---

## 10. Speech and audio

- **Battle sound and music (Session 9, Mr. Scott approved the samples):** every sound and the music are made in code with the Web Audio API (`game/src/audio.js`), so there are no sound files, nothing to license and nothing added to the offline file. Each defender, creature, shield break, Anchor hit, wave start, wave clear, Mega Forge and rift close has its own sound. Fast towers are spaced out and only 7 sounds play at once, so a busy wave stays clear. Battle music is one D minor track with two moods: calm while building, between waves and while paused; attack (drums, bass, lead) during waves. Music stops on the map and menus. While a line is read aloud, music and effects drop a little; while a word to decode is read, they drop low so the vowel is clear. Settings has three volumes: Voice, Music and Effects (0 to 10). The battle top bar also has a **Sound** button (speaker icon, v0.16.0): one tap opens the same three as sliders, the battle keeps running, and a tap anywhere else closes them. Changes save right away and match Settings. Samples: `sound-samples.html`.
- **Speech recognition finding (Nov 21 mic tests):** Chrome's built-in recognizer catches single short words like "sun" right away, at low volume, a foot or two from a laptop mic, and also catches longer phrases. An early test failed only because the game opened a second copy of the mic with Chrome's audio cleanup turned on, which spoiled the sound the recognizer got. Rule for speak mode (M5): when it is listening, any other use of the mic (like a sound meter) must turn off echo cancellation, noise suppression and auto gain. Azure Pronunciation Assessment stays a later option if Chrome's matching proves too loose for checking decoding.
- **Speech checker (M5b, Session 11):** `worker/speech-worker.js` runs free on Cloudflare at `rift-runners-speech.jimmaoscott.workers.dev`. GitHub puts it online (`.github/workflows/speech-worker.yml`) and copies the Azure key from the GitHub Secret into Cloudflare, so the key is never in the repo or the game. It needs one GitHub Secret, `CLOUDFLARE_API_TOKEN`. It only accepts a lowercase word of 12 letters or fewer and under 6 seconds of audio, answers only this game's pages (and the offline file), and stores nothing. Cost: Azure Free F0 gives 5 audio hours a month at no charge; the game sends only the spoken part (about 1 second a word), so roughly 15,000 checks a month. When the hours run out or too many students talk at once, Azure says busy and the game uses Chrome until it frees up. Moving the Speech resource to Standard S0 with a spending cap is the option if class use needs more. Audio goes to Microsoft for the check (and to Google through Chrome's backup), so district approval covers both.
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
    - **Reading guide (Forge words):** English Andrew, picked by Mr. Scott on the sound-check page (Session 8). Guy blurred short a.
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
| How fluency was scored | Shown beside every WCPM number so the report is never misleading (Mr. Scott, Session 15). Each read aloud saves which checker scored it and the rules in force: **Azure** (pronunciation checked sound by sound, strictest), **Azure + Chrome** (part of the read fell back to Chrome) or **Chrome only** (Azure blocked or offline; Chrome fills in words from context, so the count can run high). Also saved: the accent bar (`wordMin`) and whether Chrome rescue was on. Reads saved before Session 15 have no rules field and were scored under the looser first rules (accent bar 35, Chrome rescue on); the report marks them "early scoring, may run high." The report counts Azure reads in the WCPM trend line and shows Chrome-only reads as separate, lighter points with a note. |
| Words read | Total words read, per session and overall |
| Trouble words | The words and patterns missed most often |
| Nonsense word accuracy | True decoding skill, separate from words the student may have memorized |
| Support use | Hints, read-aloud taps, Spanish toggle use, speak mode vs. tap mode |
| Replays | Which levels and bosses the student replayed (repeated reading practice) |

### 12.3 Reports

- **Student report:** one page per student code with starting level vs. current level, a WCPM line graph, an accuracy-by-pattern chart, play frequency and trouble words. Includes a plain-language progress summary the teacher can adapt for IEP progress reports (example: "Since placement on 9/2, he has mastered 3 of 8 patterns. WCPM on boss passages rose from 48 to 71, scored by pronunciation check.").
- **Class overview:** every student code on one table, with current world, minutes played this week, last played date and a flag for students who have not played in 7 days or are stuck on one pattern.
- **Date range filter** for grading periods and progress report windows.
- **Scoring note on every fluency number:** each WCPM figure says how it was scored (Azure, Azure + Chrome, Chrome only, early scoring), with a one-line plain explanation at the bottom of the report, so a teacher never quotes a loosely scored number in an IEP progress report without knowing it.

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

**Built in Session 6 (win or lose):** headline, stars or a tip, each rift lock with its last 10 reads as colored blocks and this try's first-try count, runes on their own line (true decoding), "Words to practice" (every word missed or helped this try, tap to hear), words forged, first-try percent, waves survived, and first-try percent compared with the last try of the same level. Every line has a speaker. The full Then vs. Now graph comes with M4.

**Built in M4 (Session 9), decided by Claude:** a "Then and now" box on the end screen, one row per pattern in the level. Then = first-try rate on the student's first 10 reads of that pattern ever; Now = the last 10. A pattern needs 15 reads before Then and Now are shown apart, so the two windows mostly do not overlap; before that it shows Now only with "New this level." The headline is the biggest gain ("short a: up 50 points since your first tries"). If nothing has gone up, the headline is "Holding strong" with total words forged all time, so the student always leaves with a reason to keep going. A first win also shows an Unlocked box (next stone, new defender with its picture). Win buttons: Continue (back to the map on the next stone) and Play again. Lose buttons: Try again and World map. The WCPM fluency line arrives with M7.

If a number drops (common when a new world brings harder words), the screen shows something that did improve instead, such as accuracy on earlier patterns or words read this week. Students should leave every Level Clear screen with a reason to keep going.

---

## 13. Technology

- **Engine:** three.js r128 for the 3D map and battles (same as The Exiled Crown), with menus and the Forge as regular web page parts on top. Plain JavaScript, static files. Phaser 3 ran M1 and M2 and was removed in M3.
- **Speed on Chromebooks (M3):** all still scenery (trees, rocks, camp) is merged into a few big meshes, so a battle draws in about 125 calls. On machines with 4 or fewer cores the game also uses smaller shadows, fewer trees and no antialiasing. Add `?low` or `?high` to the address to force either mode.
- **Code files (M3):** `game/src/models.js` (3D models), `level.js` (map), `battle.js` (tower defense), `forge.js` (Rune Forge), `screens.js` (menus), `dom.js` (page helpers), `app.js` (start-up and frame loop), `core.js` (data, settings, voice), `metrics.js` (progress record).
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
| M3 | Hold the Rift core | 3D Thornwood map, trail, waves, Rune Forge, 4 defenders, 2 creatures, one playable level (done Nov 21) |
| M4 | World map and Level 1 to 3 | World 1 map with locked levels, stars, Level Clear growth screen (done Nov 21) |
| M5 | Speak mode (built Session 10) | Forge words read aloud for a bonus; Speak first setting (0 to 3 voice tries before choices show) with teacher PIN lock; test mode |
| M5b | Azure pronunciation check (built Session 11) | Speak mode scored sound by sound through the speech checker, Chrome as the backup; pin, pen, ten, win speakable again; spoken runes in Test mode |
| M6 | Full arsenal | All World 1 defenders, tier 3 specialties, hero powers (done Session 16; Armory dropped) |
| M6w | World 1 Levels 4 and 5 | Rift Bats and Splitters, short u, all five vowels mixed (done Session 17) |
| M7 | Boss and Rift Seal | Thorn King, Rift Seal fluency passage with WCPM (read aloud, WCPM and personal best built in Session 14 for the final level; the karaoke beat and tempo choice come with the Thorn King) |
| M8 | Placement mission | Opening mission that places students |
| M9 | Worlds 2 to 8 | Content, maps, creatures and defenders for the rest |
| M10 | Teacher reports | Google Sheet + Apps Script reports, class overview, on-device teacher screen |
| M11 | Polish | Story, music, balance and classroom testing |
| M12 | Phone layout | Sideways (landscape) phone layout with bigger buttons and tap targets, a "turn your phone" screen when held upright. Built after the full game is set up (Mr. Scott, Session 6) |


---

## 15. Open questions

0. **Moving between devices (raised Session 6).** Progress is saved only in the browser on each device. Options: (A) sync through a Google Sheet on Mr. Scott's district account with a student code and PIN, shared with teacher reports (M10), recommended; (B) a save code typed on the other device. Waiting on Mr. Scott's choice. Phone play itself is decided: M12, after the full game is set up.

1. ~~Final game title~~ Decided: Rift Runners
2. Story and setting: who is the player, and what are they fighting? Starting idea from the title: rifts are tearing the worlds apart and the player runs through each world to seal its rift.
3. District approval for speech recognition in Chrome on student Chromebooks (and for Azure Pronunciation Assessment if M5 picks it)
4. Azure Speech account setup and voice choice (English and Spanish); confirm Azure terms allow the generated audio in a public classroom game; source for any phoneme clips that need recording
5. Art source: CC0 pixel art packs (for example Kenney or OpenGameArt), AI-generated art, or a mix
6. District approval to send student-code progress data to a teacher-owned Google Sheet
7. Mastery threshold and how many words per battle
8. Fluency goal on boss passages (use published oral reading fluency norms to set it)
9. ~~Hearing a word before casting~~ Decided Nov 21: counts as help, smaller hit.
10. ~~Final consonant blends~~ Decided Nov 21: they wait for World 2 with the other blends. Mr. Scott handed reading instruction decisions to Claude; they are recorded in this file as they are made.
