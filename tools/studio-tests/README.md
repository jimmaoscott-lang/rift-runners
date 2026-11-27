# Studio test scripts

Reusable scripts for testing the AI Studio build. Use these instead of writing new ones each session.

Setup (once per session):
1. Clone `jimmaoscott-lang/rift-runners-studio` read only, `npm install --legacy-peer-deps`, `npm run lint`.
2. `VITE_BASE_PATH=/rift-runners-studio/ npm run build`
3. Copy `dist` to `/home/claude/srv/rift-runners-studio` and serve `/home/claude/srv` on port 8765 (`python3 -m http.server 8765`).

Scripts (run with `python3 -I`, Playwright plus `/usr/bin/google-chrome`):
- `screen_check.py WIDTH HEIGHT TAG`: opens Level 1, screenshots the battle, lists visible buttons, measures frame rate. Use 1366 768 and 1093 614.
- `playtest_level.py DIFFICULTY ACCURACY TAG MINUTES`: plays Level 1 as a scripted student through Listen and Pick. ACCURACY is the share of words right on the first try (1.0 strong reader, 0.6 struggling reader). It waits 1.7 seconds before each Forge, places defenders near the trail, uses hero powers, and never upgrades, so it plays a little worse than a person.

Screenshots go to `/home/claude/tests/shots/`. The scripts find the current word and sound choices by reading the game's React state; if a Studio update renames those, fix the script before trusting a result.
