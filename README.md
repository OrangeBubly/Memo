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
- All data stays on your PC

## Run / build
```
npm install
npm start            # run in development
npm run pack:win     # dist/Memo-win32-x64/Memo.exe
npm run dist:win     # installer + portable .exe (run on Windows)
```
The GitHub Actions workflow `Build Windows app` builds the installer and portable `.exe` on every push; download them from the run's **Artifacts**.
