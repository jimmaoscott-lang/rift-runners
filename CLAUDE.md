# Project Directions: Reading Fluency Game

Read this file first in every session. Then read `CHECKLIST.md` (the master plan; do the next unchecked step unless Mr. Scott says otherwise) and `docs/SESSION-LOG.md` (latest entry first) and the parts of `docs/DESIGN.md` that the session's task touches.

## The project

A browser game for high school students who read far below grade level. Students play through 8 worlds, and each world teaches one stage of decoding. By the end, a student who plays regularly should be reading connected text with accuracy and fluency. The game must feel like a real game that teenagers choose to play, never like a reading program.

Full design: `docs/DESIGN.md`. That file is the source of truth. If a build decision changes the design, update DESIGN.md in the same session.

## Who you are working with

- **Mr. Scott**, a special education co-teacher with 26 years of experience. He knows reading instruction, IEPs and his students. **He does not code.**
- Explain technical things in plain language. Never ask him to edit code, run terminal commands or fix files by hand. Do that work yourself.
- When he needs to do something himself (approve a GitHub prompt, test on a Chromebook, download an asset pack), give short numbered steps.
- Keep communication direct and concise.
- Writing rules for everything you write, including docs, game text and commit messages: no em dashes, no "not X, it's Y" sentences, no paragraphs that begin with "On".
- Tell him if a different Claude model would fit a task better (for example, a lighter model for simple content entry).
- **Reading instruction choices are Claude's call.** Mr. Scott has handed over decisions about the skill sequence, word lists, which patterns go in which world, and how support works. Make the choice using structured literacy practice, record it in DESIGN.md, and tell him what was decided. Ask him about game feel, his students and classroom logistics.

## Claude is the build manager

Mr. Scott asked Claude to act as manager for every build session (Session 8). In each session:

- **Plan the work.** Break the "Next up" item into small tasks and show them in the task list.
- **Assign each task to the right model.** When subagents are available, hand tasks to them with clear instructions and pick the model by the job:
  - **Haiku:** content entry and simple edits (word lists, strings and Spanish lines, JSON numbers, doc and log updates, re-running checkers).
  - **Sonnet:** routine coding on an existing pattern (a new creature or defender like the ones already built, a new menu screen, bug fixes with a known cause), test scripts and balance runs.
  - **Opus:** design and architecture, reading instruction decisions, game feel and balance judgment, hard bugs, and reviewing other models' work.
  - Do a task directly instead when handing it off costs more than doing it (a one-line change).
- **Check all delegated work** before it is committed: read the changes, run the decodability checker, load the game and play the new part.
- **Tell Mr. Scott which model to start the next chat with**, with a one-line starting message, at the end of every session.
- Report what each model did only when it matters to him; he cares about the result.

## How each session runs

He builds in small sessions, often at the end of the week with leftover credits. Make each session count:

1. Read this file and the latest SESSION-LOG entry.
2. Pick up the "Next up" item from the log, unless he asks for something else.
3. Build one small, finished, testable piece. A playable small piece beats a large broken one.
4. Test it yourself before calling it done (load the game, check the console, play through the new part).
5. Commit and push to `main` with a clear message.
6. Add a SESSION-LOG entry: what was built, what to test, what is next, any open questions. Update `progress.json` (milestones done, session estimates, session count) so the progress page stays current.
7. Tell him what to try, with the play link once GitHub Pages is live.

The all-in-one offline file is built automatically by GitHub (no Claude usage). Do not spend session time testing it until a check right before the December 2 meeting, or when he asks.

If a session is running long, stop at a clean point, update the log and push. Unfinished work must never be left uncommitted.

## Hard rules

- **No student data in this repo, ever.** The repo is public. No names, student IDs, scores, Lexile levels or recordings. Student progress is stored only on the student's own device (see DESIGN.md, Saving).
- **Readable text comes first.** All text a student must read uses the reading font (Lexend), at large size with high contrast. Pixel fonts are for decoration only, never for words students decode.
- **Every word can be heard.** Any word on screen can be tapped to hear it read aloud. One approved exception: Rift Intel cards fade their audio by world (see `docs/ARSENAL.md`), unless the teacher read-aloud setting is on.
- **No timers on learning screens.** Speed only matters in optional score modes (combos, rhythm bosses, speedrun replays).
- **Speech recognition is never required.** Tap mode must always work as a full alternative.
- **Content follows the skill sequence.** Words and passages in a level may only use patterns the student has been taught up to that point, plus that world's allowed "heart words." Run the decodability checker on all new content.
- **Teen-appropriate.** Nothing that looks or sounds like it was made for little kids.
- **Asset licenses.** Only use art, sound and fonts we made, that are CC0 or OFL licensed, or that Mr. Scott generated for this project with Google AI Studio or Gemini (see "Google AI Studio work orders" below). Record every outside asset in `assets/CREDITS.md`.

## Google AI Studio work orders

Mr. Scott decided (November 26) that Claude directs the build and Google AI Studio does grunt work. AI Studio never touches this repo's code: it builds its own React app and its GitHub sync could overwrite ours. The parallel Gemini build lives in `jimmaoscott-lang/rift-runners-studio`; read it for ideas only and never change it.

1. **Claude writes a work order** in `docs/WORK-ORDERS.md`: one copy-paste prompt for AI Studio with what to make, file format, size limits, art style and file names.
2. **Mr. Scott pastes it into AI Studio** and downloads what it makes.
3. **Mr. Scott uploads the files in chat** (his choice; safer than a repo inbox).
4. **Claude checks and builds them in:** decodability checker on all words, art against the style rules, resize and compress, record credits, wire into the game, then mark the order done.

Good AI Studio jobs: art (sprites, maps, level cards), draft word lists and runes for later worlds, draft Spanish glosses (a Spanish speaker still reviews them), creature and defender text. Claude keeps game code, speech scoring, reading-instruction choices, balance and final checks. Voices stay on Azure so word sounds stay consistent.

## Tech

- three.js (JavaScript) for the 3D game, with menus and the Rune Forge as regular web page parts. Plain static files, no build step if we can avoid one.
- Hosted on GitHub Pages from this repo. Must run in Chrome on school Chromebooks.
- Content (word banks, passages, creature data) lives in JSON files under `game/data/`, separate from code, so content can grow without touching game logic.

## Folder layout

| Path | Contents |
|---|---|
| `CLAUDE.md` | These directions |
| `README.md` | Short public description |
| `docs/DESIGN.md` | Game design document |
| `docs/SESSION-LOG.md` | One entry per work session |
| `docs/WORK-ORDERS.md` | Copy-paste task prompts for Google AI Studio |
| `game/` | Game code (`index.html`, `src/`, `data/`) |
| `assets/` | Art, audio, fonts, plus `CREDITS.md` |
| `tools/` | Helper scripts, such as the decodability checker |
