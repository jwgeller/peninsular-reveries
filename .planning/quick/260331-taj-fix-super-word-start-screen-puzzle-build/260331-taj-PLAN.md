---
phase: quick-260331-taj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/super-word/game.css
  - src/super-word/main.ts
  - src/super-word/renderer.ts
  - public/super-word/index.html
autonomous: true
must_haves:
  truths:
    - "Start screen scrolls when puzzle creator overflows viewport"
    - "Clicking Let's Go after configuring puzzle creator uses those settings"
    - "Play Random button in puzzle creator starts game with random puzzles"
  artifacts:
    - path: "public/super-word/game.css"
      provides: "overflow-y: auto on #start-screen"
    - path: "src/super-word/main.ts"
      provides: "activePuzzles re-selection in onStartGame"
    - path: "public/super-word/index.html"
      provides: "Play Random button in puzzle creator"
  key_links:
    - from: "src/super-word/main.ts onStartGame()"
      to: "selectPuzzles from puzzles.ts"
      via: "reads puzzle creator DOM state, calls selectPuzzles with new opts"
---

<objective>
Fix Super Word start screen: make puzzle creator scrollable, wire puzzle creator settings to direct play via Let's Go button, and add a Play Random shortcut.

Purpose: Currently the puzzle creator only generates URLs (requiring a page reload), content overflows on small screens, and there's no quick "random puzzles" action.
Output: All three issues fixed in CSS, main.ts, renderer.ts, and index.html.
</objective>

<context>
@.planning/PROJECT.md
@public/super-word/index.html
@public/super-word/game.css
@src/super-word/main.ts
@src/super-word/renderer.ts
@src/super-word/puzzles.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix start screen overflow and add Play Random button HTML</name>
  <files>public/super-word/game.css, public/super-word/index.html</files>
  <action>
  **CSS fix** — In `public/super-word/game.css`, add `overflow-y: auto` to the `#start-screen` rule block. This allows scrolling when the puzzle creator `<details>` is expanded and content exceeds viewport height.

  **HTML** — In `public/super-word/index.html`, inside the `.puzzle-creator-body` div, add a "Play Random" button BEFORE the `puzzle-url-output` div:
  ```html
  <button id="puzzle-play-btn" class="btn btn-primary btn-small puzzle-play-btn">🎲 Play with these settings</button>
  ```

  Remove the URL generation output section entirely (`#puzzle-url-output` div and its children: `#puzzle-url-text`, `#puzzle-copy-btn`, `#puzzle-open-link`). The puzzle creator should directly start the game, not generate URLs.

  **CSS for play button** — Add `.puzzle-play-btn` styles:
  ```css
  .puzzle-play-btn {
    margin-top: var(--game-space-sm);
  }
  ```
  </action>
  <verify>Build passes: `npx tsx build.ts`. Start screen is scrollable with puzzle creator open. Play button visible in puzzle creator.</verify>
  <done>Start screen scrolls when puzzle creator overflows. Play button exists in puzzle creator. URL output section removed.</done>
</task>

<task type="auto">
  <name>Task 2: Wire puzzle creator to direct play and random button</name>
  <files>src/super-word/main.ts, src/super-word/renderer.ts</files>
  <action>
  **main.ts changes:**

  1. Change `activePuzzles` declaration from `const` to `let` (line ~67):
     ```ts
     let activePuzzles: readonly Puzzle[] = selectPuzzles({ ... })
     ```
     This allows re-assignment when the user configures settings in the puzzle creator.

  2. Update `onStartGame()` to read puzzle creator state and re-select puzzles if configured:
     ```ts
     function onStartGame(): void {
       // Read puzzle creator settings
       const wordsInput = document.getElementById('puzzle-words') as HTMLInputElement | null
       const difficultySelect = document.getElementById('puzzle-difficulty-select') as HTMLSelectElement | null
       const countInput = document.getElementById('puzzle-count-input') as HTMLInputElement | null

       const creatorWords = wordsInput?.value.split(',').map(w => w.trim().toUpperCase()).filter(Boolean) ?? []
       const creatorDifficulty = difficultySelect?.value as 'easy' | 'medium' | 'hard' | '' | undefined
       const creatorCount = countInput?.value ? parseInt(countInput.value, 10) : undefined

       // Re-select puzzles if creator has any settings, OR if no URL params drove initial selection
       // (i.e., always re-roll random on each start unless URL params locked it)
       const hasCreatorSettings = creatorWords.length > 0 || (creatorDifficulty && creatorDifficulty !== '') || creatorCount
       const hasUrlParams = puzzleFilterParam || validDifficulty || countParam

       if (hasCreatorSettings || !hasUrlParams) {
         activePuzzles = selectPuzzles({
           answers: creatorWords.length > 0 ? creatorWords : undefined,
           difficulty: (creatorDifficulty && creatorDifficulty !== '') ? creatorDifficulty as 'easy' | 'medium' | 'hard' : undefined,
           count: creatorCount,
         })
       }

       // Reset game state for new puzzle set
       gameState = createInitialState(activePuzzles.length, wowModeParam)
       hintUsedPerPuzzle.length = 0

       refreshGameScreen()
       showScreen('game-screen')
       announceNextPuzzle(
         getState().currentPuzzleIndex + 1,
         activePuzzles.length,
         currentPuzzle().prompt,
       )
       moveFocusAfterTransition('scene', 300)
     }
     ```
     Key points:
     - Remove the old `clampedStart` logic from onStartGame (it's only relevant for URL param `?puzzle=N` which is handled by initial load)
     - Always re-roll random puzzles on each "Let's Go" press when no URL params drove the initial selection — this gives fresh puzzles each play
     - Reset `gameState` and `hintUsedPerPuzzle` so the game starts clean

  **renderer.ts changes:**

  Update `renderPuzzleCreator()`:
  1. Remove all URL generation logic (the `generateUrl()` inner function, the URL output element lookups for `urlOutput`, `urlText`, `copyBtn`, `openLink`).
  2. Wire the new `#puzzle-play-btn` button. It needs a callback to start the game. Add an `onPlay` parameter:

  Change the signature to `renderPuzzleCreator(onPlay: () => void): void`

  Inside, find the `#puzzle-play-btn` button and add:
  ```ts
  const playBtn = document.getElementById('puzzle-play-btn') as HTMLButtonElement | null
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      // Close the details element
      const details = document.getElementById('puzzle-creator') as HTMLDetailsElement | null
      if (details) details.open = false
      onPlay()
    })
  }
  ```

  Keep the word suggestions functionality (`showSuggestions`) — that's useful for discovering available puzzles.
  Keep the `wordsInput` input listener but remove the `generateUrl()` call from it (just call `showSuggestions()`).
  Remove the `difficultySelect` and `countInput` change/input listeners that called `generateUrl()`.

  **main.ts call site** — Update the `renderPuzzleCreator()` call at bottom of main.ts to pass `onStartGame`:
  ```ts
  renderPuzzleCreator(onStartGame)
  ```
  </action>
  <verify>Build passes: `npx tsx build.ts`. Open game, configure puzzle creator with difficulty "easy", click Play → game starts with easy puzzles. Click "Play Again", click "Let's Go" again → different random puzzles.</verify>
  <done>Puzzle creator directly starts game with configured settings. Each "Let's Go" press re-rolls random puzzles. No URL generation code remains. Clean build with no errors.</done>
</task>

</tasks>

<verification>
1. `npx tsx build.ts` — clean build, no errors
2. Open start screen on small viewport (e.g. 375×667) → expand puzzle creator → content scrolls, "Let's Go" remains reachable
3. Click "Let's Go" without touching puzzle creator → random puzzles start
4. Set difficulty to "easy" in creator → click play button → only easy puzzles appear
5. Play through game → click "Play Again" → click "Let's Go" → different random set
</verification>

<success_criteria>
- Start screen scrollable when puzzle creator overflows viewport
- Puzzle creator settings (words, difficulty, count) feed directly into game start
- Each game start re-rolls random puzzles (no stale selection from module load)
- No URL generation code remains in renderer
- Clean TypeScript build
</success_criteria>

<output>
After completion, create `.planning/quick/260331-taj-fix-super-word-start-screen-puzzle-build/260331-taj-SUMMARY.md`
</output>
