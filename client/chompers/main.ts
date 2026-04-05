import { announceCorrect, announceGameOver, announceProblem, announceRound, announceWrong, moveFocusAfterTransition } from './accessibility.js'
import { animateCorrectFeedback, animateHippoChomp, animateNextRound, animateWrongFeedback, spawnPointsPopup } from './animations.js'
import { moveFocusToFirstItem, setupInput, teardownInput } from './input.js'
import { renderAll, renderEndScreen, renderHUD, renderHippo, renderProblem, renderScene, setupSettingsModal } from './renderer.js'
import { ensureAudioUnlocked, sfxChomp, sfxCorrect, sfxGameOver, sfxProblemAppear, sfxStreakBonus, sfxWrong } from './sounds.js'
import { advanceRound, createInitialState, resolveChomp, selectAnswer } from './state.js'
import type { Difficulty, GameMode, GameState } from './types.js'

let state: GameState

const settingsModal = setupSettingsModal()

function getSelectedDifficulty(): Difficulty {
  const val = document.querySelector<HTMLInputElement>('input[name="difficulty"]:checked')?.value
  if (val === 'counting' || val === 'addition' || val === 'subtraction' || val === 'multiplication' || val === 'division') {
    return val
  }
  return 'addition'
}

function getSelectedMode(): GameMode {
  const val = document.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value
  if (val === 'classic' || val === 'frenzy') return val
  return 'classic'
}

function showScreen(screenId: string): void {
  for (const id of ['start-screen', 'game-screen', 'end-screen']) {
    const el = document.getElementById(id)
    if (!el) continue
    if (id === screenId) {
      el.hidden = false
      el.removeAttribute('aria-hidden')
    } else {
      el.hidden = true
      el.setAttribute('aria-hidden', 'true')
    }
  }
}

async function onSelectAnswer(itemId: string): Promise<void> {
  if (state.phase !== 'playing') return

  state = selectAnswer(state, itemId)
  renderHippo(state)

  // Disable all scene items to prevent double-selection
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.scene-item')) {
    btn.disabled = true
  }

  const targetEl = document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`)
  const hippoEl = document.getElementById('hippo') as HTMLElement
  const selectedItem = state.sceneItems.find((i) => i.id === itemId)
  if (!selectedItem) return

  sfxChomp()
  await animateHippoChomp(hippoEl, targetEl, selectedItem.isCorrect)

  state = resolveChomp(state)

  if (selectedItem.isCorrect) {
    sfxCorrect()
    if (state.streak >= 3) sfxStreakBonus(state.streak)
    if (targetEl) await animateCorrectFeedback(targetEl)
    announceCorrect(selectedItem.value, state.streak)
    spawnPointsPopup(selectedItem.x, selectedItem.y, `+${selectedItem.value}`, 'positive')
  } else {
    sfxWrong()
    if (targetEl) await animateWrongFeedback(targetEl)
    announceWrong(selectedItem.value, state.currentProblem.correctAnswer)
    spawnPointsPopup(selectedItem.x, selectedItem.y, '✗', 'negative')
  }

  renderHUD(state)

  await new Promise<void>((resolve) => window.setTimeout(resolve, 800))

  state = advanceRound(state)

  if (state.phase === 'gameover') {
    showEndScreen(state)
    return
  }

  await animateNextRound()
  renderScene(state)
  renderProblem(state)
  sfxProblemAppear()
  announceProblem(state.currentProblem)
  announceRound(state.round, state.totalRounds)
  moveFocusToFirstItem()
}

function onOpenSettings(): void {
  settingsModal.open()
}

function onStartGame(difficulty: Difficulty, mode: GameMode): void {
  ensureAudioUnlocked()
  state = createInitialState(mode, difficulty, Date.now())
  showScreen('game-screen')
  renderAll(state)
  sfxProblemAppear()
  setupInput({ onSelectAnswer, onOpenSettings })
  announceProblem(state.currentProblem)
  moveFocusAfterTransition('scene-items', 100)
  window.setTimeout(() => moveFocusToFirstItem(), 200)
}

function showEndScreen(endState: GameState): void {
  showScreen('end-screen')
  renderEndScreen(endState)
  teardownInput()
  sfxGameOver()
  announceGameOver(endState)
  moveFocusAfterTransition('replay-btn', 300)
}

function onReplay(): void {
  teardownInput()
  onStartGame(state?.difficulty ?? 'addition', state?.mode ?? 'classic')
}

function onReturnToMenu(): void {
  teardownInput()
  showScreen('start-screen')
  moveFocusAfterTransition('start-btn', 320)
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-btn')?.addEventListener('click', () => {
    onStartGame(getSelectedDifficulty(), getSelectedMode())
  })

  document.getElementById('replay-btn')?.addEventListener('click', onReplay)
  document.getElementById('menu-btn')?.addEventListener('click', onReturnToMenu)

  const settingsBtn = document.getElementById('settings-btn')
  settingsBtn?.addEventListener('click', () => settingsModal.open(settingsBtn))
})
