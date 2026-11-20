# Memo — memorize anything by heart

A Windows desktop app for learning poems, speeches, scripture, lines and songs word for word.

## Features
- **Library**: unlimited texts, folders, favorites, search, sorting, import `.txt` files, export, duplicate
- **Parts**: texts are split into parts (by blank lines, sentences, every 4 lines or every line); practice one part at a time or **build up** parts 1→N
- **9 practice modes**
  - 📖 Read & Listen: text-to-speech with word highlighting, speed, repeat, line-by-line, click a word to start there
  - 🔤 First Letters: only initials shown, click to reveal
  - 🙈 Hide Words: progressively hide 0–100% of the words, peek, reshuffle, optional first-letter hints
  - ⌨ Type Initials: type the first letter of every word from memory
  - ✍ Type Words: type every word in full (optional strict mode)
  - 🃏 Line Cards: recall the next line from the previous one and grade yourself
  - 🔀 Unscramble: put shuffled lines back in order
  - ❓ Fill the Blank: multiple-choice missing words
  - 🎙 Recite & Record: record your voice, play it back and compare against the text
- **Progress**: mastery per text and per part, session history, streaks, daily goal, 30-day chart
- **Spaced-repetition review** with due badges and a daily desktop reminder
- **Settings**: light/dark/sepia/system themes, text size, voice and speed, backup and restore
- **🎯 Weak Spots**: tracks every word you miss across modes, shows a heatmap, and drills the lines you keep failing until they stick
- **Customize**: 14 themes, accents, fonts, cursor styles (line / block / underscore / box), key sounds, backgrounds
- **Gamification**: XP, levels, daily quests, achievements, unlockable themes and sounds
- All data stays on your PC (in `%APPDATA%\Memo`) and survives reinstalls

## Run / build
```
npm install
npm start            # run in development
npm run pack:win     # dist/Memo-win32-x64/Memo.exe
npm run dist:win     # Memo-Setup.exe + Memo-Portable.exe (on Windows)
npm run dist:win:linux  # same, from Linux without Wine (needs makensis)
npm run icons        # re-render build/icon.svg -> icon.png / icon.ico
```
The GitHub Actions workflow `Build Windows app` builds the installer and portable `.exe` on every push; download them from the run's **Artifacts**.
