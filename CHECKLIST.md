# Rift Runners Build Checklist

Mr. Scott's master plan (set November 27, 2026). One chat per step. Open each chat with:
"Read CLAUDE.md and CHECKLIST.md, then do the next unchecked step."
Use the model listed for the step. When a step is done, check it off here and add a SESSION-LOG entry.

---

## Decisions

- [x] **Graphics:** full painted rebuild of the battlefield, like the Studio version (painted map per level, painted creature and defender pictures). Decided Nov 27 after the Step 2 graphics test. Replaces the earlier choice to keep the 3D battlefield.
- [ ] **Normal difficulty:** keep today's balance or make it a little harder. Decide after the Step 5 playtest.
- [ ] **Expert grace:** suggested rule: a word read right on the second try earns half crystals, and misses never end the level. Mr. Scott to approve or change.

## Dec 2 meeting

- [ ] Show the Studio (Gemini) version. It looks the most finished.
- [ ] Ask IT to unblock `jimmaoscott-lang.github.io` (both versions live there; speak mode works at that address).
- [ ] No compute spent polishing the main build for the meeting.

## Already done

- [x] Classroom-safe sound check in the decodability checker (Session 21)
- [x] Copy Teacher Note button on the end screen, v0.17.0 (Session 21)
- [x] Boot Camp and ELL additions designed (DESIGN 5.2 and 8.1)

---

## Build order

### Step 1. Mic fix (Opus)
- [x] Warm mic with a short pre-roll so the first sound is never clipped (bug B2). v0.17.1, Session 22
- [x] Zero-penalty retry when Azure's timing collapses (keeps streak and crystals). v0.17.1, Session 22
- [x] Mr. Scott: test the mic on a Chromebook, especially short u and short a. Passed Nov 27

### Step 2. Graphics test (Opus)
- [x] Small animated 3D test scene with moving characters. `game/graphics-test.html`, Session 23
- [x] Mr. Scott ran it (smooth on his MSI) and chose the full painted rebuild. Chromebook 3D check no longer needed

### Step 3. Painted battlefield rebuild (about 4 to 6 sessions)
The Studio version's look, rebuilt inside the main build. Keeps the Rune Forge, speech, waves from reading, metrics, settings, tutorial and teacher note. Only the battlefield drawing and the world map change.
- [ ] 3a. Rebuild plan (Opus): how the painted battle engine fits the current code, the art list, level path data, and what carries over. Written into DESIGN 3 and 13
- [ ] 3b. Bring in Mr. Scott's Studio art (maps, creature and defender pictures he made in Gemini): check, resize, compress, record in CREDITS (Sonnet). Read from rift-runners-studio only; never change it
- [ ] 3c. Painted battle engine, World 1 Level 1 playable: painted map, trail, creatures and defenders that bob, lean, squash and flash, shots and sparks, free placement with ghost preview, range ring and "On road" warning (Sonnet, Opus reviews)
- [ ] 3d. Studio gameplay: enemy resistances (fire, frost, shock, arrows, gravity) with color badges on health bars; tower targeting First, Last, Strong (Sonnet)
- [ ] 3e. All World 1 levels, the final level slice and the tutorial on the painted battlefield (Sonnet)
- [ ] 3f. Painted world map and level cards (Sonnet)
- [ ] 3g. Mr. Scott: play Level 1 on a Chromebook and check it runs smoothly

### Step 4. AI Studio art for the gaps (AI Studio does the work)
- [ ] Claude writes work orders in `docs/WORK-ORDERS.md` for anything 3b does not cover (missing creatures or defenders, walk frames so characters move, level cards)
- [ ] Mr. Scott pastes each order into AI Studio
- [ ] Mr. Scott uploads the results in a Claude chat; Claude checks them and adds them. AI Studio never pushes to this repo.

### Step 5. Playtest Normal (Mr. Scott)
- [ ] Play 2 or 3 levels, then make the Normal difficulty decision

### Step 6. Difficulty levels and dials (Sonnet)
- [ ] Easy, Normal, Hard, Expert. Student picks on the map, with a Settings option to change it
- [ ] Only the battle changes. Words and reading level never change with difficulty (they come from placement)
- [ ] Expert: more and tougher enemies, very hard, always at least one winning tower combination and placement
- [ ] One balance file, about 4 dials per difficulty: enemy count, enemy health, tougher types earlier, words read between waves. Per-level tweaks in the same file
- [ ] Teacher report shows the difficulty each student played
- [ ] Simulator check first, then Mr. Scott playtests, then push

### Step 7. Boot Camp placement level (Sonnet)
- [ ] Build from DESIGN 5.2

### Step 8. Reading supports
- [ ] Slow Blend button (Sonnet)
- [ ] Voice fits: Opus designs first, then Sonnet builds
- [ ] Spanish and ELL supports, DESIGN 8.1 (Sonnet). A Spanish speaker reviews the Spanish lines before students see them

### Step 9. World 2 and 3 content
- [ ] Opus picks the reading skills (digraphs, blends, silent e) against the skill sequence
- [ ] AI Studio drafts word lists from a work order

---

## On hold
- Phone layout
- Video cut scenes
- Unreal Engine move

## How AI Studio fits in
1. Claude writes the work order.
2. Mr. Scott pastes it into AI Studio.
3. AI Studio gives back a file or text.
4. Mr. Scott uploads it in a Claude chat, and Claude checks it and adds it to the game.
