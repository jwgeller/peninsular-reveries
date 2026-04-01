# Quick Task 260331-taj: Summary

## What Changed

### Start Screen Layout Fix
- Added `overflow-y: auto` to `#start-screen` so content scrolls when the puzzle creator `<details>` is expanded instead of clipping off-screen.

### Puzzle Creator → Direct Play
- Replaced URL generation approach with direct game start. The puzzle creator now has a "▶️ Play!" button that starts the game immediately with configured settings (words, difficulty, count).
- Removed URL output section (`#puzzle-url-output`, copy URL button, open link) — no longer needed since the creator directly controls gameplay.
- `renderPuzzleCreator()` now accepts an `onPlay` callback and wires the Play button to close the details panel and start the game.

### Fresh Random Puzzles on Each Start
- Changed `activePuzzles` from `const` to `let` so puzzles can be re-selected.
- `onStartGame()` now re-rolls random puzzles on every press (unless URL params locked the initial selection).
- Game state (`gameState`, `hintUsedPerPuzzle`) is fully reset on each start for a clean play session.
- If puzzle creator has settings configured, those are used; otherwise random selection from the full pool.

## Files Modified
- `public/super-word/game.css` — overflow fix, removed unused URL output styles, added play button styles
- `public/super-word/index.html` — replaced URL output with Play button
- `src/super-word/main.ts` — mutable activePuzzles, puzzle creator-aware onStartGame
- `src/super-word/renderer.ts` — simplified renderPuzzleCreator with onPlay callback

## Commit
f85f0ac
