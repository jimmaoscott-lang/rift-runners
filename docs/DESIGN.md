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
- Each world: 5 levels plus a boss level (6 total). 8 worlds, 48 levels.
- Level card on the map: name, waves, new enemy, which word patterns, and the reward for winning. Every line has a speaker.

**Built in M4 (Session 9):** `game/src/map.js` draws the World 1 map in 3D (Thornwood open, the Dunes and Frostfang under fog). Six stones: Levels 1 to 5 and the Thorn King. States come from the progress record on the device (`game/src/unlocks.js`): a stone opens when the stone before it has been won; beaten stones turn gold with the best stars; the stepping stones between beaten levels turn gold; the Rift Warden stands at the stone the student is up to. Tap a stone or its name to open its card on the right, then Play. Stones whose level is not built yet say they open in a coming update. Stone places live in `levels-w1.json` under `map.stones`. Title screen Play now opens the map. The star count shows total stars out of 18.

### 4.1A Naming rule

No name the student sees may point at reading or at a reading problem. The game, worlds, levels, abilities and rewards are named for the adventure, like a movie title (example: "Escape from Witch Mountain"). Words like read, word, letter, spell, phonics, level or fluency stay out of names. Reading is the power inside the game, never what the game is called. ("Level" appears only as a small label, like "Level 3", never as a name.)

World names: World 1 "Escape the Thornwood" (forest), World 2 "Dunes of the Dead Sun" (desert), World 3 "Frostfang Pass" (ice), World 4 "The Drowned Coast" (ocean), World 5 "Ashfall" (volcano), World 6 "Skyport Zero" (sky city), World 7 "The Sunken Vault" (ruins), World 8 "The Rift Core" (final fortress). World 1 level names: Thornwood Edge, Bramble Crossing, The Hollow Trail, Wisp Hollow, Old Watch Ruins, boss: The Thorn King.

### 4.2 Core loop (one level, about 8 to 12 minutes)

1. **Build phase:** start crystals plus the Forge. Place the first defenders. Press Start Wave when ready (no timer).
2. **Waves:** creatures march. Defenders fight on their own. The student keeps forging crystals, builds more, upgrades, and fires hero powers.
3. **Between waves:** a short breather. Forge, build, upgrade.
4. **Waves keep coming until mastery or defeat (Mr. Scott, Session 6).** The first waves follow the level file; after that they keep coming, bigger and tougher each time. Each level shows **rift locks**, one per vowel pattern it teaches. When every lock is full (mastery, section 5.1), the next wave after the level's minimum (3 waves in Level 1) is the **final wave**. Surviving it closes the rift and wins. Stars: 3 = Anchor untouched, 2 = Anchor above half, 1 = survived. If the Anchor falls first, the level is lost, but lock progress is kept.
5. **Rewards:** the next level unlocks, often a new defender or upgrade, skins for 3 stars, crystals carried to the upgrade bank.
6. **Level Clear screen** with growth (section 12A).

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
   - **Azure pronunciation check (M5b, Session 11, decided by Claude):** speak mode now uses Azure Pronunciation Assessment by default. The game records only the stretch where the student is talking (it stops 0.7 seconds after the voice stops, at most 5 seconds), sends it to the speech checker (a small Cloudflare Worker that holds the Azure key, `worker/`), and Azure scores each sound of the word. Chrome's recognizer listens at the same time as a backup. If the checker is blocked, offline, out of free hours, busy or slower than 4 seconds, the game uses what Chrome heard, so the student never has to say the word again. A busy or out-of-hours answer pauses Azure for 2 minutes; two other failures in a row turn it off for that visit. With Azure up, pin, pen, ten, win and the other short i or short e before m or n words can be spoken again. Runes can be spoken in Test mode (or for everyone when `spokenRunes` is on in `game/data/speech.json`) so Mr. Scott can try them first. Nothing is saved: the recording is thrown away after the check.
   - **Azure scoring (Claude's reading call):** the vowel is the skill being checked, so it gets the strict check and the consonants get a lenient one, so an accent never fails a correct read. A word matches when (1) the vowel scores 60 or more and Azure does not hear a different short vowel instead (unless the vowel scores 80 or more), or Azure says the sound was closest to an accepted version of the right vowel; (2) the other sounds average 40 or more with none under 15; and (3) the word scores 45 or more (skipped when the vowel was an accepted version). Accepted versions: short i also takes /i/ (Spanish speakers say "ship" close to "sheep"; that is accent, not decoding), short u also takes the schwa, short o also takes /ɔ/ (cot/caught), and before m or n short i and short e count for each other (Gulf Coast pin/pen). Short a and short o, and short i and short e elsewhere, stay apart: those are the close pairs DESIGN 5 targets. All numbers live in `game/data/speech.json` and get tuned from Test mode readouts, which show each sound's score and what it sounded most like.
   - **Checker trouble is never the student's fault:** if the checker fails and nothing can judge the word, the game says "The checker missed that one" (say it again) or "Speak mode cannot check this word right now" (use the choices), and neither counts as a try.
   - **Pin/pen rule for speak mode:** before m or n, the short i and short e spellings both count as a match (say "pen," Chrome hears "pin"). That is Gulf Coast dialect, not a decoding error.
   - **Teacher settings (built in M5):** Settings has a **Teacher** button behind a 4-digit PIN made on first use (typed twice, kept on the device as a scrambled code). Inside: Speak first (0 to 3), Lock Speak first, Test mode, Change PIN. A forgotten PIN can only be cleared by clearing the site's data on that device, which also clears progress (open question).
   - **Test mode (teacher settings, for Mr. Scott's testing):** opens every level and defender on the map so any level can be played. Plays still count toward the device's progress record. The map shows an orange "Test mode" tag while it is on.
   - **Limit:** Chrome's speech recognizer turns sounds into real words, so it cannot judge made-up runes and may hear "set" as "sit." Runes stay in tap mode until a pronunciation checker (Azure Pronunciation Assessment or an on-device model) is tested in M5.
3. **Every forge pays right away:** crystals fly from the Forge into the crystal counter with a sound.
   - Real word, first try: +10. Rune, first try: +20.
   - Hearing the word first (speaker on the word) or second try: about half.
   - After the answer is shown: a small amount, so the student is never stuck.
4. **Streak meter:** first-try reads in a row fill 8 pips. A full meter is a **Mega Forge**: +100 crystals and a burst of light over the battlefield that hits every creature for 25 damage (built in M3, so a strong read streak is felt on the field).
5. **Hero charge:** forging also charges the hero's powers.
6. **Misses:** no lost crystals. Letter tiles with the vowel in gold, "Let's break it up," then try again. The word comes back sooner next time.
7. **Recent forges list:** the last few words with what each one earned, so students see the reward and the words again.

**No timers on reading, even in battle.** The battle never waits on a timer to read a word, and Pause is always one tap away; the Forge stays open while paused. Students with extended time (and anyone who turns on Focus in Settings) get slow motion. **Built in M3:** Focus in Settings runs the whole battle at half speed (a word is always up in the Forge).

**Guessing (same rule as Mr. Scott's other games):** 3 wrong in a row that are each very fast, or 3 wrong in a row on the same button position. The Forge cools down for 5 seconds the first time and 10 seconds after that ("The forge is overheating. Read each one."). Correct answers are never flagged.

**Keyboard (built in M3):** 1, 2, 3 pick a sound; Enter or F forges; H hears the word; S starts the next wave; P or Esc pauses; after picking a defender, arrow keys move between glowing spots and Enter builds.

**Income balance:** crystals come almost only from the Forge. Defeated creatures drop a few shards, too few to win without reading. Later levels cost more, so students forge steadily all level. Target: 6 to 10 words a minute during play.

**Level 1 balance (tested with a simulated player):** 100 starting crystals (one Archer Tower plus one Spike Pit), creatures drop 1 or 2 shards. A player who never reads loses in wave 3. With waves until mastery (Session 6), accurate readers win in 4 to 9 waves and inaccurate ones lose later with progress saved. Pausing to forge always helps, and Focus halves the speed. Numbers live in `game/data/units.json` and `game/data/levels-w1.json`.

---

## 6A. Defenders

Placed on build spots beside the trail (towers) or on the trail itself (blockers and traps). Each has 3 upgrade tiers; tier 3 picks one of two specialties.

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

**Hero:** one Rift Warden on the map, with 3 powers charged by forging: **Meteor** (big area blast), **Time Freeze** (stops a wave for a few seconds), **Rally** (defenders fire faster for a short time). More heroes unlock later, each with a different power set (like the rulers in Hold the Keep).

**Between levels:** the **Armory** spends banked crystals on permanent upgrades (stronger arrows, cheaper golems) and skins.

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
- Settings save on the device right away: language, text size (Normal, Large, Extra large), font (Lexend or OpenDyslexic), volume, motion (Full or Reduced), and Focus (battles at half speed, added in M3). Motion starts at Reduced if the Chromebook's own reduced motion setting is on.
- Short sessions with a natural stopping point every few minutes
- Works with keyboard, mouse or touch

---

## 10. Speech and audio

- **Battle sound and music (Session 9, Mr. Scott approved the samples):** every sound and the music are made in code with the Web Audio API (`game/src/audio.js`), so there are no sound files, nothing to license and nothing added to the offline file. Each defender, creature, shield break, Anchor hit, wave start, wave clear, Mega Forge and rift close has its own sound. Fast towers are spaced out and only 7 sounds play at once, so a busy wave stays clear. Battle music is one D minor track with two moods: calm while building, between waves and while paused; attack (drums, bass, lead) during waves. Music stops on the map and menus. While a line is read aloud, music and effects drop a little; while a word to decode is read, they drop low so the vowel is clear. Settings has three volumes: Voice, Music and Effects (0 to 10). Samples: `sound-samples.html`.
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
| M6 | Full arsenal | All World 1 defenders, upgrades, hero powers, Armory |
| M7 | Boss and Rift Seal | Thorn King, Rift Seal fluency passage with WCPM |
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
