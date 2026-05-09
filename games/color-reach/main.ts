import { Application, Container, Graphics } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame } from './state.js'
import type { GameState, MotionZone } from './types.js'
import { setupBubblePopInput as setupColorReachInput } from './input.js'
import { announceStart, announcePlaying, announceReached, manageFocus } from './accessibility.js'
import { sfxReach, sfxSpawn, startAmbience, stopAmbience, setMuted } from './sounds.js'

// Re-export the input setup with proper name
export { setupColorReachInput }

const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.getElementById('camera-denied-msg') as HTMLElement
const scoreDisplay = document.getElementById('score-display')!
const colorDisplay = document.getElementById('color-display')!
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
let activeZones: MotionZone[] = []
let cameraGranted = false
let gameLoopCallback: ((ticker: import('pixi.js').Ticker) => void) | null = null

async function initApp(): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    try {
      const app = new Application()
      await app.init({ preference, backgroundAlpha: 0, autoDensity: true })
      pixiStage.appendChild(app.canvas)
      return app
    } catch { continue }
  }
  return null
}

async function boot(): Promise<void> {
  app = await initApp()
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize. Please try a different browser.'
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

  setupColorReachInput({
    onStart: enterGame,
    onReplay: resetToStart,
    onMenu: () => {
      const modal = document.getElementById('settings-modal')
      if (modal) modal.toggleAttribute('hidden')
    },
  })

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (zones) => { activeZones = zones })
    cameraPrompt.textContent = 'Camera ready! Press Start to play.'
  } else {
    cameraPrompt.textContent = 'Camera not available. Press Start for a demo!'
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

  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 600))))

  const rect = pixiStage.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
  const h = Math.max(1, Math.round(rect.height)) || window.innerHeight
  app.renderer.resize(w, h)
  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  app.canvas.style.display = 'block'
  app.canvas.style.touchAction = 'none'

  app.stage.removeChildren()
  gameState = startGame(createInitialState())

  if (!cameraGranted) {
    const demoInterval = setInterval(() => {
      if (gameState.phase !== 'playing') { clearInterval(demoInterval); return }
      activeZones = [{
        id: 0, normalizedX: 0.3 + Math.random() * 0.4, normalizedY: 0.3 + Math.random() * 0.4,
        spreadX: 0.15, spreadY: 0.3, pixelCount: 100, active: true, velocityY: 0,
      }]
    }, 1500)
  }

  startAmbience()
  announcePlaying()

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  let lastTargetCount = 0

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = Math.min(ticker.deltaMS, 50)
    const zonesToUse = cameraGranted ? activeZones.slice(0, 6) : activeZones.slice(0, 3)
    gameState = updateGame(gameState, zonesToUse, app.screen.width, app.screen.height, deltaMs)

    // Draw targets
    app.stage.removeChildren()
    const targetGraphics = new Graphics()

    for (const target of gameState.targets) {
      const alpha = 1 - target.fadeProgress * 0.6
      // Outer glow
      targetGraphics.circle(target.zoneX, target.zoneY, target.zoneRadius + 15)
      targetGraphics.fill({ color: hueToColor(target.hue), alpha: alpha * 0.2 })
      // Inner zone
      targetGraphics.circle(target.zoneX, target.zoneY, target.zoneRadius)
      targetGraphics.fill({ color: hueToColor(target.hue), alpha: alpha * 0.4 })
      targetGraphics.stroke({ color: hueToColor(target.hue), width: 3, alpha })
      // Pulsing ring
      const pulse = Math.sin(gameState.gameTime * 0.003) * 8
      targetGraphics.circle(target.zoneX, target.zoneY, target.zoneRadius + 20 + pulse)
      targetGraphics.stroke({ color: hueToColor(target.hue), width: 2, alpha: alpha * 0.6 })
    }

    // Draw motion zones
    for (const zone of zonesToUse) {
      if (!zone.active) continue
      const zx = zone.normalizedX * app.screen.width
      const zy = zone.normalizedY * app.screen.height
      targetGraphics.circle(zx, zy, 20)
      targetGraphics.fill({ color: 0xffffff, alpha: 0.3 })
    }

    app.stage.addChild(targetGraphics)

    // Draw particles
    const particleG = new Graphics()
    for (const p of gameState.particles) {
      const lifeRatio = p.life / p.maxLife
      const r = Math.max(0.5, p.size * lifeRatio)
      const color = p.hue < 0 ? 0xffffff : hueToColor(p.hue)
      particleG.circle(p.x, p.y, r)
      particleG.fill({ color, alpha: Math.max(0, lifeRatio) })
    }
    app.stage.addChild(particleG)

    // SFX
    if (gameState.targets.length > lastTargetCount) {
      sfxSpawn()
    }
    lastTargetCount = gameState.targets.length

    if (gameState.targetReachedThisFrame) {
      sfxReach()
      announceReached(gameState.score)
    }

    // HUD
    scoreDisplay.textContent = `Score: ${gameState.score}`
    colorDisplay.textContent = `Find: ${gameState.currentColorName}`
  }

  app.ticker.add(gameLoopCallback)
}

function resetToStart(): void {
  if (gameLoopCallback && app) { app.ticker.remove(gameLoopCallback); gameLoopCallback = null }
  stopMotionTracking()
  stopAmbience()
  if (app) app.stage.removeChildren()
  gameState = createInitialState()
  activeZones = []
  showScreen('start-screen')
  if (cameraGranted && cameraPreview) startMotionTracking(cameraPreview, (z) => { activeZones = z })
  announceStart()
  manageFocus('start')
}

function hueToColor(hue: number): number {
  const h = ((hue % 360) + 360) % 360
  const s = 0.8, l = 0.7
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return (Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}