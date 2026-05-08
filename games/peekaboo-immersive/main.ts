// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, sfxCorrect, sfxWrong, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

const C = {
  bg: 0x1a1a33,
  bgLight: 0x2a2a55,
  accent: 0x44ddaa,
  fog: 0x6666bb,
  hand: 0x44aaff,
  found: 0xffdd44,
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

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.pi-camera-prompt') as HTMLElement
  const gameStatus = document.getElementById('game-status')!

  setupGameMenu({ musicTrackPicker: false })

  let cameraGranted = false
  let activeBodies: MotionBody[] = []
  let app: Application | null = null
  let gameRunning = false
  let score = 0
  let gameLoopCallback: (() => void) | null = null

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera access granted! Wave your hands to clear the fog and find the hidden character!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Click or tap to reveal cells.'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  // Peekaboo grid state
  const GRID_COLS = 4
  const GRID_ROWS = 3
  let fogGrid: boolean[][] = []  // true = fogged
  let hiddenCharPos = { col: 0, row: 0 }
  let revealed = false
  let lastSelectTime = 0
  let round = 0
  const TOTAL_ROUNDS = 5

  function startRound(): void {
    fogGrid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(true))
    hiddenCharPos = {
      col: Math.floor(Math.random() * GRID_COLS),
      row: Math.floor(Math.random() * GRID_ROWS),
    }
    revealed = false
    round++
  }

  async function enterGame(): Promise<void> {
    ensureAudioUnlocked()
    showScreen('game-screen')
    gameRunning = true
    score = 0
    round = 0
    startRound()

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 100)))
    })

    const rect = pixiStage.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))

    app = await initStage(pixiStage, w, h)
    if (!app) return

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

    // Click/tap to reveal cells
    pixiStage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!app || revealed) return
      const pixiRect = pixiStage.getBoundingClientRect()
      const tx = e.clientX - pixiRect.left
      const ty = e.clientY - pixiRect.top
      const sw = app.screen.width
      const sh = app.screen.height
      const topOffset = sh * 0.18
      const cellW = (sw - 40) / GRID_COLS
      const cellH = (sh * 0.6) / GRID_ROWS
      const col = Math.floor((tx - 20) / cellW)
      const row = Math.floor((ty - topOffset) / cellH)
      if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
        fogGrid[row][col] = false
        sfxTap()
        if (col === hiddenCharPos.col && row === hiddenCharPos.row) {
          revealed = true
          score += 20
          sfxCorrect()
          announceAction('Found it!')
          setTimeout(() => {
            if (round >= TOTAL_ROUNDS) {
              showEndScreen()
            } else {
              startRound()
            }
          }, 1500)
        }
      }
    })

    gameLoopCallback = () => {
      const texts: Text[] = []
      if (!app || !gameRunning) return
      const sw = app.screen.width
      const sh = app.screen.height
      const now = performance.now()

      const gfx = new Graphics()
      gfx.rect(0, 0, sw, sh).fill({ color: C.bg })

      // Title
      const title = new Text({ text: `Peekaboo Immersive — Round ${round}/${TOTAL_ROUNDS}`, style: { fill: C.accent, fontSize: 20, fontFamily: 'system-ui', fontWeight: 'bold' } })
      title.anchor.set(0.5, 0)
      title.position.set(sw / 2, 20)
      texts.push(title)

      // Grid
      const topOffset = sh * 0.18
      const cellW = (sw - 40) / GRID_COLS
      const cellH = (sh * 0.6) / GRID_ROWS

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const cx = 20 + c * cellW
          const cy = topOffset + r * cellH

          if (fogGrid[r][c]) {
            // Fogged cell
            gfx.roundRect(cx + 4, cy + 4, cellW - 8, cellH - 8, 8).fill({ color: C.fog, alpha: 0.5 })
            gfx.roundRect(cx + 4, cy + 4, cellW - 8, cellH - 8, 8).stroke({ color: C.fog, width: 1 })
          } else {
            // Revealed cell
            const isHidden = c === hiddenCharPos.col && r === hiddenCharPos.row
            gfx.roundRect(cx + 4, cy + 4, cellW - 8, cellH - 8, 8).fill({ color: C.bgLight })
            if (isHidden) {
              gfx.circle(cx + cellW / 2, cy + cellH / 2, 16).fill({ color: C.found })
              const charText = new Text({ text: '👀', style: { fontSize: 24 } })
              charText.anchor.set(0.5, 0.5)
              charText.position.set(cx + cellW / 2, cy + cellH / 2)
              texts.push(charText)
            }
          }
        }
      }

      // Hand tracking — clear fog where hand hovers
      const body = cameraGranted ? activeBodies[0] : null
      if (body && !revealed) {
        const hx = (1 - body.normalizedX) * sw
        const hy = body.normalizedY * sh

        // Clear fog on cells the hand hovers over
        const hoverCol = Math.floor((hx - 20) / cellW)
        const hoverRow = Math.floor((hy - topOffset) / cellH)
        if (hoverCol >= 0 && hoverCol < GRID_COLS && hoverRow >= 0 && hoverRow < GRID_ROWS && fogGrid[hoverRow][hoverCol]) {
          fogGrid[hoverRow][hoverCol] = false
          sfxTap()
          if (hoverCol === hiddenCharPos.col && hoverRow === hiddenCharPos.row) {
            revealed = true
            score += 20
            sfxCorrect()
            announceAction('Found it!')
            setTimeout(() => {
              if (round >= TOTAL_ROUNDS) showEndScreen()
              else startRound()
            }, 1500)
          }
        }

        gfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
        gfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })
      }

      // Score HUD
      const scoreText = new Text({ text: `Score: ${score}`, style: { fill: C.accent, fontSize: 18, fontFamily: 'system-ui' } })
      scoreText.position.set(10, sh - 40)
      texts.push(scoreText)

      app.stage.removeChildren()
      app.stage.addChild(gfx)
    }

    app.ticker.add(gameLoopCallback)
  }

  function showEndScreen(): void {
    gameRunning = false
    if (gameLoopCallback && app) {
      app.ticker.remove(gameLoopCallback)
      gameLoopCallback = null
    }
    stopMotionTracking()
    showScreen('end-screen')
    const endScoreEl = document.getElementById('end-score')
    if (endScoreEl) endScoreEl.textContent = `${score}`
    sfxCorrect()
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
    score = 0
    round = 0
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