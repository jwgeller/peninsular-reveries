import { Application, Graphics } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame, GRID_SIZE } from './state.js'
import type { GameState, MotionBody } from './types.js'
import { setupBubblePopInput as setupJellyWobbleInput } from './input.js'
import { announceStart, announceWobble, manageFocus } from './accessibility.js'
import { sfxWobble, startAmbience, stopAmbience, setMuted } from './sounds.js'

// Re-export with game-specific name
export { setupJellyWobbleInput }

const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.getElementById('camera-denied-msg') as HTMLElement
const scoreDisplay = document.getElementById('score-display')!
const gameStatus = document.getElementById('game-status')!

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

let app: Application | null = null
let gameState: GameState = createInitialState()
let activeBodies: MotionBody[] = []
let cameraGranted = false
let gameLoopCallback: ((ticker: import('pixi.js').Ticker) => void) | null = null
let lastAnnouncedScore = 0

async function boot(): Promise<void> {
  for (const pref of ['webgpu', 'webgl', 'canvas'] as const) {
    try {
      app = new Application()
      await app.init({ preference: pref, backgroundAlpha: 0, autoDensity: true })
      pixiStage.appendChild(app.canvas)
      break
    } catch { app = null }
  }
  if (!app) { cameraPrompt.textContent = 'Unable to initialize.'; startBtn.disabled = true; return }

  setupGameMenu({ musicTrackPicker: false })
  window.addEventListener('reveries:music-change', (e) => {
    const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled
    setMuted(!enabled)
    if (!enabled) stopAmbience()
    else if (gameState.phase === 'playing') startAmbience()
  })

  setupJellyWobbleInput({
    onStart: enterGame,
    onReplay: resetToStart,
    onMenu: () => { const m = document.getElementById('settings-modal'); if (m) m.toggleAttribute('hidden') },
  })

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera ready! Press Start to wobble!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Press Start for demo!'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)
  document.addEventListener('visibilitychange', () => {
    if (!app) return
    if (document.hidden) { app.ticker.stop(); stopAmbience() }
    else { app.ticker.start(); if (gameState.phase === 'playing') startAmbience() }
  })

  announceStart()
  manageFocus('start')
}

async function enterGame(): Promise<void> {
  if (!app) return
  showScreen('game-screen')
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 600))))
  const rect = pixiStage.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
  const h = Math.max(1, Math.round(rect.height)) || window.innerHeight
  app.renderer.resize(w, h)
  app.canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:none'
  app.stage.removeChildren()

  gameState = startGame(createInitialState(), w, h)
  lastAnnouncedScore = 0

  if (!cameraGranted) {
    const demoInterval = setInterval(() => {
      if (gameState.phase !== 'playing') { clearInterval(demoInterval); return }
      activeBodies = [{
        id: 99, normalizedX: 0.3 + Math.random() * 0.4, normalizedY: 0.4 + Math.random() * 0.3,
        spreadX: 0.22, spreadY: 0.55, pixelCount: 200, active: true, armsUp: false,
      }]
    }, 2000)
  }

  startAmbience()

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = Math.min(ticker.deltaMS, 50)
    const bodiesToUse = cameraGranted ? activeBodies.slice(0, 6) : activeBodies.slice(0, 1)
    gameState = updateGame(gameState, bodiesToUse, app.screen.width, app.screen.height, deltaMs)

    app.stage.removeChildren()
    const g = new Graphics()

    // Draw jelly body using bezier curves through grid points
    const jelly = gameState.jelly
    if (jelly.length >= GRID_SIZE * GRID_SIZE) {
      const hue = gameState.jellyHue
      const mainColor = hueToHex(hue)
      const darkColor = hueToHex((hue + 20) % 360)
      const lightColor = hueToHex((hue - 20 + 360) % 360)

      // Jelly fill
      g.moveTo(jelly[0].x, jelly[0].y)
      // Top edge
      for (let c = 1; c < GRID_SIZE; c++) {
        const prev = jelly[c - 1]
        const curr = jelly[c]
        const cpx = (prev.x + curr.x) / 2
        const cpy = (prev.y + curr.y) / 2 - 5
        g.quadraticCurveTo(cpx, cpy, curr.x, curr.y)
      }
      // Right edge
      for (let r = 1; r < GRID_SIZE; r++) {
        const prev = jelly[(r - 1) * GRID_SIZE + GRID_SIZE - 1]
        const curr = jelly[r * GRID_SIZE + GRID_SIZE - 1]
        const cpx = prev.x + (curr.x - prev.x) * 0.5 + 5
        const cpy = (prev.y + curr.y) / 2
        g.quadraticCurveTo(cpx, cpy, curr.x, curr.y)
      }
      // Bottom edge
      for (let c = GRID_SIZE - 2; c >= 0; c--) {
        const prev = jelly[(GRID_SIZE - 1) * GRID_SIZE + c + 1]
        const curr = jelly[(GRID_SIZE - 1) * GRID_SIZE + c]
        const cpx = (prev.x + curr.x) / 2
        const cpy = (prev.y + curr.y) / 2 + 5
        g.quadraticCurveTo(cpx, cpy, curr.x, curr.y)
      }
      // Left edge
      for (let r = GRID_SIZE - 2; r >= 0; r--) {
        const prev = jelly[(r + 1) * GRID_SIZE]
        const curr = jelly[r * GRID_SIZE]
        const cpx = prev.x + (curr.x - prev.x) * 0.5 - 5
        const cpy = (prev.y + curr.y) / 2
        g.quadraticCurveTo(cpx, cpy, curr.x, curr.y)
      }
      g.closePath()
      g.fill({ color: mainColor, alpha: 0.7 })
      g.stroke({ color: darkColor, width: 3 })

      // Shine highlight
      const centerIdx = Math.floor(GRID_SIZE / 2) * GRID_SIZE + Math.floor(GRID_SIZE / 2)
      const centerX = jelly[centerIdx].x
      const centerY = jelly[centerIdx].y - 20
      g.circle(centerX, centerY, 25)
      g.fill({ color: lightColor, alpha: 0.4 })

      // Face - eyes
      const topLeftIdx = Math.floor(GRID_SIZE / 3) * GRID_SIZE + 1
      const topRightIdx = Math.floor(GRID_SIZE / 3) * GRID_SIZE + GRID_SIZE - 2
      const eyeY = jelly[topLeftIdx].y + 5
      const leftEyeX = jelly[topLeftIdx].x + 8
      const rightEyeX = jelly[topRightIdx].x - 8

      g.circle(leftEyeX, eyeY, 6)
      g.fill({ color: 0x000000 })
      g.circle(rightEyeX, eyeY, 6)
      g.fill({ color: 0x000000 })

      // Happy mouth
      const mouthIdx = Math.floor(GRID_SIZE / 2) * GRID_SIZE + Math.floor(GRID_SIZE / 2)
      const mouthX = jelly[mouthIdx].x
      const mouthY = jelly[mouthIdx].y + 18
      g.arc(mouthX, mouthY, 15, Math.PI, 0)
      g.stroke({ color: 0x000000, width: 3 })
    }

    // Draw particles
    for (const p of gameState.particles) {
      const lifeRatio = p.life / p.maxLife
      const r = Math.max(0.5, p.size * lifeRatio)
      g.circle(p.x, p.y, r)
      g.fill({ color: p.color, alpha: Math.max(0, lifeRatio * 0.8) })
    }

    // Body indicator
    for (const body of bodiesToUse) {
      const bx = (1 - body.normalizedX) * app.screen.width
      const by = body.normalizedY * app.screen.height
      g.circle(bx, by, 15)
      g.fill({ color: 0xffffff, alpha: 0.15 })
    }

    app.stage.addChild(g)

    // SFX
    if (gameState.wobbleScore !== lastAnnouncedScore && gameState.wobbleScore % 50 < 5) {
      sfxWobble()
      announceWobble(gameState.wobbleScore)
    }
    lastAnnouncedScore = gameState.wobbleScore
    scoreDisplay.textContent = `Wobble: ${gameState.wobbleScore}`
  }

  app.ticker.add(gameLoopCallback)
}

function resetToStart(): void {
  if (gameLoopCallback && app) { app.ticker.remove(gameLoopCallback); gameLoopCallback = null }
  stopMotionTracking(); stopAmbience()
  if (app) app.stage.removeChildren()
  gameState = createInitialState(); activeBodies = []; lastAnnouncedScore = 0
  showScreen('start-screen')
  if (cameraGranted && cameraPreview) startMotionTracking(cameraPreview, (b) => { activeBodies = b })
  announceStart(); manageFocus('start')
}

function hueToHex(hue: number): number {
  const h = ((hue % 360) + 360) % 360
  const s = 0.8, l = 0.65
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, gv = 0, b = 0
  if (h < 60) { r = c; gv = x }
  else if (h < 120) { r = x; gv = c }
  else if (h < 180) { gv = c; b = x }
  else if (h < 240) { gv = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return (Math.round((r + m) * 255) << 16) | (Math.round((gv + m) * 255) << 8) | Math.round((b + m) * 255)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
else boot()