# For Google AI Studio: How This Repo Works

You are building Rift Runners in the `jimmaoscott-lang/rift-runners-studio` repo. This repo (`jimmaoscott-lang/rift-runners`) is the director's office. Claude writes the plans, prompts and test reports here. You have read access only. Never copy this repo's `game/` folder code into the Studio build; it is an older archived version.

## What to read here

| File | Why |
|---|---|
| `AI-STUDIO.md` | This guide |
| `docs/STUDIO-PROMPTS.md` | Your build tasks, numbered S-01, S-02 and so on, newest at the top |
| `docs/STUDIO-TESTS.md` | Claude's test reports on your build, with ranked problems |
| `CHECKLIST.md` | The overall plan and Mr. Scott's decisions |
| `docs/DESIGN.md` | The reading skill sequence (which sounds come in which world) |

You can skip `CLAUDE.md`; it is Claude's own instructions.

## How a task runs

1. Mr. Scott says "Run S-##" (or pastes the prompt).
2. Open `docs/STUDIO-PROMPTS.md`, find that S number, and read the whole prompt box before changing anything.
3. Tell Mr. Scott in one or two sentences what you are about to change, then do only that task.
4. Finish the prompt's housekeeping (lint, build, your SESSION-LOG entry, BUILD.md updates).
5. Report back using the prompt's "Done when" list: what you checked and anything you could not do.

Rules:
- Only run a prompt when Mr. Scott names it. Never run ahead to other prompts in the file.
- If a prompt's Status line says "tested", it is finished. Do not redo it.
- If a prompt conflicts with something in your BUILD.md, stop and ask Mr. Scott instead of guessing.
- Mr. Scott syncs to GitHub after every task. Keep each task small enough to sync cleanly.

## Mr. Scott's decisions (copy these into your BUILD.md)

Settled. Do not change them unless Mr. Scott says so.

- Claude directs and tests; AI Studio builds. Claude never edits the Studio repo. (Nov 27)
- Standard difficulty for all levels is set by prompt S-07, from Mr. Scott's dial test: Easy health 50% and speed 90% of the earlier preset, Normal health 60% and speed 90%, Hard unchanged, Expert speed 110% and creature count 110%. This replaces the earlier note to keep Hard and Expert as they were. (Nov 27)
- Students may skip the Level 1 walkthrough. (Nov 27)
- A few crystals per creature kill and a small wave-clear bonus are fine. Reading stays the main income. (Nov 27)
- A miss lowering a lock's count is fine. (Nov 27)
- Sync to GitHub after every build. (Nov 27)
- Cutscene pause: no new cutscene images, narration or story scripts until the rest of the build is finished. All story scripts and cutscenes will be redone as static files as the last step. (Nov 27)
- Student screens show no test or setup tools; those go behind Teacher Mode. (Nov 27)
- No student data in either repo, ever. Both repos are public. (Nov 27)
- Phone layout, cross-device progress and the Unreal Engine move are on hold. (Nov 27)
- Leda is the voice for new word readings and narration. (Studio decision, kept)
