import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import {
  initStage,
  createBubbleGraphics,
  updateBubbleGraphics,
  createParticleGraphics,
  updateParticleGraphics,
} from './renderer.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame } from './state.js'
import type { GameState, MotionBody } from './types.js'
import { setupBubblePopInput } from './input.js'
import { announcePopped, announceStart, announcePlaying, manageFocus } from './accessibility.js'
import {
  sfxBubblePop,
  sfxBubbleSpawn,
  startAmbience,
  stopAmbience,
  setMuted,
} from './sounds.js'

const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.getElementById('camera-denied-msg') as HTMLElement
const poppedDisplay = document.getElementById('popped-display')!
const gameStatus = document.getElementById('game-status')!

const ALL_SCREENS = ['start-screen', 'game-screen', 'end-screen']

function showScreen(screenId: string): void {
  for (const id of ALL_SCREENS) {
    const el = document.getElementById(id)
    if (!el) continue
    const isActive = id === screenId
    el.hidden = !isActive
    el.classList.toggle('active', isActive)
    if (isActive) {
      el.removeAttribute('inert')
    } else {
      el.setAttribute('inert', '')
    }
  }
}

let app: Application | null = null
let gameState: GameState = createInitialState()
let activeBodies: MotionBody[] = []
let cameraGranted = false
let gameLoopCallback: ((ticker: Ticker) => void) | null = null
let lastAnnouncedPopped = 0

const bubbleContainers = new Map<string, Container>()
const particleGraphics: Graphics[] = []

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  window.addEventListener('reveries:music-change', (e) => {
    const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled
    setMuted(!enabled)
    if (!enabled) stopAmbience()
    else if (gameState.phase === 'playing') startAmbience()
  })

  setupBubblePopInput({
    onStart: enterGame,
    onReplay: resetToStart,
    onMenu: () => {
      const modal = document.getElementById('settings-modal')
      if (modal) {
        const isHidden = modal.hasAttribute('hidden')
        modal.toggleAttribute('hidden', !isHidden)
      }
    },
  })

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
    cameraPrompt.textContent = 'Camera access granted. Press Start to begin!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Press Start for a demo!'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  announceStart()
  manageFocus('start')
}

async function enterGame(): Promise<void> {
  if (!app) return
  showScreen('game-screen')

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 600)))
  })

  const rect = pixiStage.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
  const h = Math.max(1, Math.round(rect.height)) || window.innerHeight

  app.renderer.resize(w, h)
  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  app.canvas.style.display = 'block'
  app.canvas.style.touchAction = 'none'

  app.stage.removeChildren()
  bubbleContainers.clear()
  particleGraphics.length = 0

  gameState = startGame(createInitialState())
  lastAnnouncedPopped = 0

  if (!cameraGranted) {
    activeBodies = [{
      id: 99,
      normalizedX: 0.5,
      normalizedY: 0.55,
      spreadX: 0.22,
      spreadY: 0.55,
      pixelCount: 200,
      active: true,
      armsUp: false,
    }]
  }

  startAmbience()
  announcePlaying()

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  let lastSpawnCount = 0

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = Math.min(ticker.deltaMS, 50)

    const bodiesToUse = cameraGranted ? activeBodies.slice(0, 6) : activeBodies.slice(0, 1)
    gameState = updateGame(gameState, bodiesToUse, app.screen.width, app.screen.height, deltaMs)

    // ── Bubbles ─────────────────────────────────────────────────────
    for (const bubble of gameState.bubbles) {
      if (!bubbleContainers.has(bubble.id)) {
        const g = createBubbleGraphics(bubble)
        app.stage.addChild(g)
        bubbleContainers.set(bubble.id, g)
        if (gameState.bubbles.length > lastSpawnCount) {
          sfxBubbleSpawn()
          lastSpawnCount = gameState.bubbles.length
        }
      }
    }

    // Update bubble positions and remove finished pops
    const activeBubbleIds = new Set(gameState.bubbles.map(b => b.id))
    for (const [id, g] of bubbleContainers) {
      const bubble = gameState.bubbles.find(b => b.id === id)
      if (bubble) {
        updateBubbleGraphics(g, bubble)
      } else {
        app.stage.removeChild(g)
        bubbleContainers.delete(id)
      }
    }

    // Remove old bubble containers not in state
    for (const [id, g] of bubbleContainers) {
      if (!activeBubbleIds.has(id)) {
        app.stage.removeChild(g)
        bubbleContainers.delete(id)
      }
    }

    // ── Particles ────────────────────────────────────────────────────
    const particleKeys = new Set(gameState.particles.map((_, idx) => idx))
    for (let i = particleGraphics.length - 1; i >= 0; i--) {
      if (!particleKeys.has(i)) {
        const pg = particleGraphics[i]
        if (pg.parent) pg.parent.removeChild(pg)
        pg.destroy()
        particleGraphics.splice(i, 1)
      }
    }

    for (let i = 0; i < gameState.particles.length; i++) {
      const p = gameState.particles[i]
      let pg = particleGraphics[i]
      if (!pg) {
        pg = createParticleGraphics(p)
        app.stage.addChild(pg)
        particleGraphics[i] = pg
      }
      updateParticleGraphics(pg, p)
    }

    // ── SFX ──────────────────────────────────────────────────────────
    if (gameState.totalPopped !== lastAnnouncedPopped) {
      const diff = gameState.totalPopped - lastAnnouncedPopped
      lastAnnouncedPopped = gameState.totalPopped
      sfxBubblePop()
      announcePopped(gameState.totalPopped)
    }

    poppedDisplay.textContent = `Bubbles: ${gameState.totalPopped}`

    // ── End check ───────────────────────────────────────────────────
    if (gameState.phase === 'end') {
      endGame()
    }
  }

  app.ticker.add(gameLoopCallback)
}

function endGame(): void {
  if (!app) return
  if (gameLoopCallback) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  stopMotionTracking()
  stopAmbience()
  showScreen('end-screen')
  const endScoreMsg = document.getElementById('end-score-msg')
  if (endScoreMsg) {
    endScoreMsg.textContent = `You popped ${gameState.totalPopped} bubbles!`
  }
  gameStatus.textContent = `Game complete! You popped ${gameState.totalPopped} bubbles.`

  setTimeout(() => resetToStart(), 5000)
}

function resetToStart(): void {
  if (gameLoopCallback && app) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  stopMotionTracking()
  stopAmbience()

  if (app) {
    for (const g of bubbleContainers.values()) app.stage.removeChild(g)
    for (const pg of particleGraphics) {
      if (pg.parent) pg.parent.removeChild(pg)
      pg.destroy()
    }
    app.stage.removeChildren()
  }

  bubbleContainers.clear()
  particleGraphics.length = 0
  gameState = createInitialState()
  activeBodies = []
  lastAnnouncedPopped = 0

  showScreen('start-screen')
  gameStatus.textContent = 'Returned to start screen.'

  if (cameraGranted && cameraPreview) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
  }

  announceStart()
  manageFocus('start')
}

function handleVisibilityChange(): void {
  if (!app) return
  if (document.hidden) {
    app.ticker.stop()
    stopAmbience()
  } else {
    app.ticker.start()
    if (gameState.phase === 'playing') {
      startAmbience()
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}