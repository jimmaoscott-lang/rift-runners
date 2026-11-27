# Google AI Studio Work Orders

**Replaced November 27, 2026.** The AI Studio version is now the main build, so new prompts go in `docs/STUDIO-PROMPTS.md`. This file is kept for history.

Claude writes each order. Mr. Scott copies the prompt box into Google AI Studio, downloads the results, and uploads them in a Claude chat. Claude checks them and builds them into the game. Process rules are in `CLAUDE.md` ("Google AI Studio work orders").

## Rules for every order

- AI Studio makes files only (images, text, JSON or CSV). It never edits or syncs this repo.
- Every prompt names the exact file names, format and size, so Claude can drop results in without guessing.
- Words and runes from AI Studio are drafts. Claude runs `tools/check_decodable.py` and a classroom-safe word check before anything ships.
- Spanish text from AI Studio is a draft until a Spanish speaker reviews it.
- Art: teen-appropriate, no copyrighted characters, no real people. Record each file in `assets/CREDITS.md`.

## Order template

```
WO-##: <title>
Status: open | sent | received | built
Goes with: <session or bug number>

PASTE INTO AI STUDIO:
<the prompt>

RETURN:
<file names, format, sizes>

CLAUDE CHECKS:
<what Claude verifies before building it in>
```

## Open orders

None yet. The first art orders wait on Mr. Scott's graphics decision (painted art in menus only, or a full painted battlefield).
