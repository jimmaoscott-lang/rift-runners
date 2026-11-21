# Session Log

Newest entry at the top. Each session adds one entry.

---

## Session 2: November 21, 2026 (M1 game skeleton)

**Built**
- The game runs: `game/index.html` with Phaser 3.90 stored in the repo (`game/lib/`), so nothing loads from other websites.
- First launch screen: pick English or Español (each prompt and button has a speaker).
- Title screen: game logo, tagline, Play and Settings, scrolling pixel mountains and stars. Play shows a "World 1 opens in the next update" message for now.
- Settings: language, text size (3 sizes), font (Lexend or OpenDyslexic), volume, motion (full or reduced), microphone test. Every row has a speaker. Saves on the device.
- Microphone test screen: tells you plainly whether speak mode can work in that version of the game (website, offline file, Apps Script).
- Keyboard play on every screen (arrows, Tab, Enter, Esc).
- All menu text lives in `game/data/strings.json`. Read-aloud plays pre-made Azure voice files, with the Chromebook voice as backup.
- `tools/voice_lines.py`: voices every menu line with the narrator voices (Guy, Jorge) on each push. First run voiced all 70 lines; they are live in the game.
- `tools/build_single.py`: builds the all-in-one file (about 3 MB, code, fonts and voices packed inside).
- `.github/workflows/deploy.yml`: on every push to main it voices new lines, builds the all-in-one file and publishes the website.
- `assets/CREDITS.md` started (Lexend, OpenDyslexic, Phaser).

**Tested (by Claude, headless Chrome)**
- Website version and offline file both load with no errors.
- Language pick, title, settings at all 3 text sizes, both fonts, Spanish, message box, mic test screen.
- Settings survive a reload. Voice files play in both versions.
- Mic test in the offline file reports "blocked" in the test browser and falls back cleanly. Real result needs a real Chromebook.

**To test (Mr. Scott)**
1. Play link: https://jimmaoscott-lang.github.io/rift-runners/ (live a few minutes after the push).
2. Pick a language, tap the speakers, open Settings and try each option.
3. Settings > Test microphone. Press Start, say "sun." Note what it says.
4. Download the offline copy from the link on https://jimmaoscott-lang.github.io/rift-runners/ and open it from your laptop with Wi-Fi off. The file is named rift-runners-offline.html. Keep it for the December 2 backup. Download a fresh copy after each session.
5. At school (after Thanksgiving): try the play link on a student Chromebook.

**Mic test fix (same session)**
- First real test: the mic test said no words came through.
- Added a live sound meter and a step-by-step check. The result now tells apart: mic never turned on, mic on but silent (wrong mic or muted), or sound heard with no words caught. Partial words now count too.
- His retest showed the old test code: Chrome kept the old scripts from its cache. Each deploy now stamps the scripts with the update number so browsers load fresh code. The mic test also shows a status line (mic on, sound, speech, level, error, version).
- Retest result (Chrome on his Windows laptop): Mic on yes, Sound no, Level 0, error no-speech. Chrome opens the mic but gets silence, so the wrong input device is picked or it is muted. The game code is working.
- Fixed: going Back and reopening the mic test lost the sound meter until a page refresh.

**Not done yet**
- The Apps Script version is built but not set up in a Google account. That needs 5 minutes together in a session (copy two files into a new Apps Script project and deploy). Then run the mic test inside it.
- Spanish menu lines need a quick check by a Spanish speaker.

**Next up**
- M2: first battle in tap mode with World 1 words, tap any word to hear it, metrics saved on the device from the first battle. Also start `game/data/heart-words.json` and the decodability checker in `tools/`.

**Decisions made**
- Game title is **Rift Runners** ("The worlds are breaking. Run."). Mr. Scott wants no name that points at reading or a reading deficit. Names come from the adventure, like "Escape from Witch Mountain." Rule added to DESIGN.md section 4.1A, with world name ideas to approve.

**Open questions**
- Approve or change the world names in DESIGN.md section 4.1A.
- Repo renamed to rift-runners (done 11/21). Play link is now https://jimmaoscott-lang.github.io/rift-runners/

---

## Session 1: November 21, 2026

**Built**
- `CLAUDE.md` with project directions for every future session
- `docs/DESIGN.md` draft 1: game style (Zelda world + Pokémon battles + rhythm bosses, 16-bit pixel art), 8-world skill sequence, EB supports, accessibility, saving and privacy, milestones
- `docs/SESSION-LOG.md` (this file)
- README updated

**Decisions made**
- The game is not tied to any school subject. It is a standalone game students want to play.
- Students play through many levels and finish reading fluently.
- EB accommodations are built in.
- All project files live in this public repo. No student data goes in it.
- Browser game built with Phaser, hosted on GitHub Pages, aimed at school Chromebooks.
- Teacher reports: the game sends progress (by student code, no names) to a Google Sheet on Mr. Scott's district account through Apps Script. Reports cover starting level, play frequency, progress, accuracy by pattern, WCPM, trouble words and support use. See DESIGN.md section 12.
- Students get frequent, specific, growth-based encouragement and a simple growth graph on a Level Clear screen after every level. See DESIGN.md section 12A.
- Metrics are recorded from the first battle onward.

- Voice: Azure AI Speech (free F0 tier, East US) on Mr. Scott's Azure account. Key and region are GitHub Secrets `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`. Voice job: `.github/workflows/voice-samples.yml` running `tools/voice_samples.py`. First samples made in `assets/audio/samples/`. The free tier rate-limits fast requests (HTTP 429), so the script now waits and retries.

- Narrator voices chosen: English Guy, Spanish Jorge (Mexico). Saved in `game/data/voices.json`.

**To review (Mr. Scott)**
- Listen to the voice samples. Mark any voice to cut, and any voice that says the single sounds most clearly (best candidates for the reading guide). See DESIGN.md section 10 for the voice variety plan.
- Read `docs/DESIGN.md` and mark anything to change, especially the skill sequence in section 5 and the open questions in section 15.

**Next up**
- Goal: World 1 demo level ready for the district meeting on December 2 (see DESIGN.md section 14).
- M1: game skeleton. Title screen, Lexend font, settings menu (language, text size, font toggle, volume). Publish as the website AND as the single-file Apps Script version, and test the microphone inside Apps Script early.
- GitHub Pages is ON with Source set to GitHub Actions (done 11/21). M1 must add the deploy workflow. Mr. Scott: check whether github.io sites load on a student Chromebook at school.

**Demo plan for December 2**
- Mr. Scott is off Thanksgiving week, so there will be no Chromebook check at school before the meeting. Demo from the website.
- Backup if github.io is blocked on the district network: open the all-in-one HTML file straight from his laptop (works with no internet in tap mode; speak mode needs internet), or use a phone hotspot.
- Every M1 to M4 session must keep the all-in-one HTML file working so the backup stays ready.

**Open questions**
- See DESIGN.md section 15.
