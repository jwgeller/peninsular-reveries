// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, sfxCorrect, sfxWrong, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

const C = {
  bg: 0x101020,
  on: 0xffcc00,
  off: 0x222244,
  hand: 0x44aaff,
  accent: 0xffcc00,
  text: 0xffffff,
}

async function initStage(container: HTMLElement, width: number, height: number): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    try {
      const app = new Application()
      await app.init({ preference, width, height, background: C.bg, autoDensity: true })
      container.appendChild(app.canvas)
      return app
    } catch { continue }
  }
  return null
}

const ALL_SCREENS = ['start-screen', 'game-screen', 'end-screen']
function showScreen(screenId: string): void {
  for (const id of ALL_SCREENS) {
    const el = document.getElementById(id)
    if (!el) continue
    const isActive = id === screenId
    el.hidden = !isActive
    el.classList.toggle('active', isActive)
    if (isActive) el.removeAttribute('inert')
    else el.setAttribute('inert', '')
  }
}

const GRID_SIZE = 5

type Board = boolean[][]

function createBoard(): Board {
  const board: Board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false))
  // Random pattern — solvable by toggling ~8-12 cells
  for (let i = 0; i < 6; i++) {
    const r = Math.floor(Math.random() * GRID_SIZE)
    const c = Math.floor(Math.random() * GRID_SIZE)
    toggleCell(board, r, c)
  }
  // Make sure it's not already solved
  if (isSolved(board)) {
    toggleCell(board, 0, 0)
  }
  return board
}

function toggleCell(board: Board, row: number, col: number): void {
  board[row][col] = !board[row][col]
  if (row > 0) board[row - 1][col] = !board[row - 1][col]
  if (row < GRID_SIZE - 1) board[row + 1][col] = !board[row + 1][col]
  if (col > 0) board[row][col - 1] = !board[row][col - 1]
  if (col < GRID_SIZE - 1) board[row][col + 1] = !board[row][col + 1]
}

function isSolved(board: Board): boolean {
  return board.every(row => row.every(cell => !cell))
}

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.sqi-camera-prompt') as HTMLElement
  const gameStatus = document.getElementById('game-status')!

  setupGameMenu({ musicTrackPicker: false })
  let cameraGranted = false
  let activeBodies: MotionBody[] = []
  let app: Application | null = null
  let gameRunning = false
  let board: Board = createBoard()
  let moves = 0
  let gameLoopCallback: (() => void) | null = null
  let lastToggleTime = 0

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera access granted! Point at cells to flip them and their neighbors!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Click cells to flip them.'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  async function enterGame(): Promise<void> {
    ensureAudioUnlocked()
    showScreen('game-screen')
    gameRunning = true
    board = createBoard()
    moves = 0
    lastToggleTime = 0

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 100)))
    })

    const rect = pixiStage.getBoundingClientRect()
    const app = await initStage(pixiStage, Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)))
    if (!app) return

    // Click/tap to toggle cells
    pixiStage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!gameRunning) return
      const pixiRect = pixiStage.getBoundingClientRect()
      const tx = e.clientX - pixiRect.left
      const ty = e.clientY - pixiRect.top
      const sw = app!.screen.width
      const sh = app!.screen.height
      const gridSize = Math.min(sw, sh) * 0.7
      const offsetX = (sw - gridSize) / 2
      const offsetY = (sh - gridSize) / 2
      const cellSize = gridSize / GRID_SIZE
      const col = Math.floor((tx - offsetX) / cellSize)
      const row = Math.floor((ty - offsetY) / cellSize)
      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        toggleCell(board, row, col)
        moves++
        sfxTap()
        if (isSolved(board)) {
          sfxCorrect()
          announceAction(`Solved in ${moves} moves!`)
        }
      }
    })

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

    gameLoopCallback = () => {
      const texts: Text[] = []
      if (!app) return
      const sw = app.screen.width
      const sh = app.screen.height
      const now = performance.now()

      const gfx = new Graphics()
      gfx.rect(0, 0, sw, sh).fill({ color: C.bg })

      const gridSize = Math.min(sw, sh) * 0.7
      const offsetX = (sw - gridSize) / 2
      const offsetY = (sh - gridSize) / 2
      const cellSize = gridSize / GRID_SIZE

      // Title
      const title = new Text({ text: 'Squares Immersive', style: { fill: C.accent, fontSize: 20, fontFamily: 'system-ui', fontWeight: 'bold' } })
      title.anchor.set(0.5, 0)
      title.position.set(sw / 2, 20)
      texts.push(title)

      // Grid
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const cx = offsetX + c * cellSize
          const cy = offsetY + r * cellSize
          const isOn = board[r][c]
          gfx.roundRect(cx + 3, cy + 3, cellSize - 6, cellSize - 6, 6).fill({ color: isOn ? C.on : C.off })
          gfx.roundRect(cx + 3, cy + 3, cellSize - 6, cellSize - 6, 6).stroke({ color: 0x444466, width: 1 })
        }
      }

      // Hand tracking — hover + arms-up to toggle
      const body = cameraGranted ? activeBodies[0] : null
      if (body && gameRunning) {
        const hx = (1 - body.normalizedX) * sw
        const hy = body.normalizedY * sh
        const hCol = Math.floor((hx - offsetX) / cellSize)
        const hRow = Math.floor((hy - offsetY) / cellSize)

        if (hCol >= 0 && hCol < GRID_SIZE && hRow >= 0 && hRow < GRID_SIZE) {
          const hx2 = offsetX + hCol * cellSize + cellSize / 2
          const hy2 = offsetY + hRow * cellSize + cellSize / 2
          gfx.roundRect(offsetX + hCol * cellSize + 1, offsetY + hRow * cellSize + 1, cellSize - 2, cellSize - 2, 6).stroke({ color: C.hand, width: 3 })

          if (body.armsUp && gameRunning && now - lastToggleTime > 600) {
            toggleCell(board, hRow, hCol)
            moves++
            lastToggleTime = now
            sfxTap()
            if (isSolved(board)) {
              sfxCorrect()
              announceAction(`Solved in ${moves} moves!`)
            }
          }
        }
        gfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
        gfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })
      }

      // Moves counter
      const movesText = new Text({ text: `Moves: ${moves}`, style: { fill: C.text, fontSize: 16, fontFamily: 'system-ui' } })
      movesText.position.set(10, 10)
      texts.push(movesText)

      if (isSolved(board)) {
        const winText = new Text({ text: `🎉 Solved in ${moves} moves!`, style: { fill: C.on, fontSize: 22, fontFamily: 'system-ui', fontWeight: 'bold' } })
        winText.anchor.set(0.5, 0.5)
        winText.position.set(sw / 2, sh - 50)
        texts.push(winText)
      }

      app.stage.removeChildren()
      app.stage.addChild(gfx)
    }

    app.ticker.add(gameLoopCallback)
  }

  function resetToStart(): void {
    gameRunning = false
    if (app) {
      app.ticker.remove(gameLoopCallback!)
      app.destroy(true, { children: true, texture: true })
      app = null
    }
    stopMotionTracking()
    showScreen('start-screen')
    gameStatus.textContent = 'Ready to play!'
    board = createBoard()
    moves = 0
    if (cameraGranted && cameraPreview) {
      startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    }
  }

  document.addEventListener('restart', () => resetToStart())
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}