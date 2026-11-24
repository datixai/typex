# TypeX

**Free, offline typing tutor for Windows 10 and 11.** Developed by [Datix AI](https://datixai.com).

TypeX helps anyone go from slow hunting and pecking to confident touch typing. It is completely free, needs no internet and keeps every profile private on the PC.

## Features

- **49 guided lessons** in 4 tracks: Beginner (every letter, row by row), Intermediate (numbers, punctuation, sentences), Advanced (symbols, emails, code, paragraphs) and Number Pad (ten-key data entry).
- **Beginner and Pro modes:** Beginner shows key hints and lets you fix mistakes. Pro hides hints, blocks Backspace, adds more text and needs higher accuracy and speed for 3 stars (Pro stars are kept separately).
- **On-screen keyboard** with colour-coded fingers, the next key glowing, a hand and finger guide, and Shift hints.
- **Switch keyboard layout any time:** Full-size with number pad, Tenkeyless, Laptop (compact), Laptop with number pad.
- **Typing tests:** 30 seconds to 5 minutes, with stories, common words, code or your own text. Shows WPM, raw WPM, accuracy and keys to practise.
- **Games:** Meteor Words, Balloon Pop and Speed Sprint (race robot cars).
- **Progress:** speed and accuracy charts, key heatmap, practice time for the last 14 days, full history.
- **Motivation:** stars, XP and levels, daily goal ring, day streaks and 19 achievements.
- **Sounds:** mechanical tick, typewriter, soft tap or bubble key sounds, mistake tone and success chimes (all synthesised, no audio files). Volume control.
- **Many users on one PC:** each person signs in with a username (small letters), full name and password. A one-time recovery code resets a forgotten password.
- **Private and offline:** no cloud, no tracking, no ads. Progress stays on the PC as long as its data is not erased. Optional backup file to move progress to another PC.
- Dark and light themes.

## Install (for users)

Download from the Releases page of this repository:

- `TypeX-Setup-<version>.exe`: normal installer (choose folder, Start menu and desktop shortcuts, uninstaller).
- `TypeX-<version>-portable.exe`: runs without installing, for example from a USB stick.

Windows may show "Windows protected your PC" because the app is not code-signed. Click **More info**, then **Run anyway**.

TypeX was called XTyping in version 1.0.0. Profiles made in XTyping are copied into TypeX automatically on first start. You can uninstall XTyping afterwards.

Profiles are stored per Windows account in `%APPDATA%\TypeX\profiles`.

## Build (for developers)

Needs Node.js 20 or newer.

```powershell
npm install
npm start          # run the app
npm run check      # syntax check
npm run dist       # build the installer and portable .exe into dist/
```

Project layout:

- `main.js`: window, local profile store (scrypt-hashed passwords), backup import and export.
- `preload.js`: the small, safe API the page can use.
- `src/js/data.js`: words, passages and the lesson path.
- `src/js/keyboard.js`: keyboard layouts, finger map, hand guide, heatmap.
- `src/js/engine.js`: typing engine (WPM, accuracy, per-key stats).
- `src/js/sound.js`: synthesised sounds.
- `src/js/games.js`: the three games.
- `src/js/app.js`: screens, progress, achievements and settings.

## Licence

MIT. Developed by Datix AI, https://datixai.com
