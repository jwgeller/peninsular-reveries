import { Application, Container, Graphics } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame } from './state.js'
import type { GameState, MotionZone } from './types.js'
import { setupBubblePopInput as setupLeafSwirlInput } from './input.js'
import { announceSwirled, announceStart, manageFocus } from './accessibility.js'
import { sfxSwirl, sfxLeafLand, startAmbience, stopAmbience, setMuted } from './sounds.js'

export { setupLeafSwirlInput }

const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.getElementById('camera-denied-msg') as HTMLElement
const swirlDisplay = document.getElementById('swirl-display')!
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
let lastSwirled = 0

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

  setupLeafSwirlInput({
    onStart: enterGame,
    onReplay: resetToStart,
    onMenu: () => { const m = document.getElementById('settings-modal'); if (m) m.toggleAttribute('hidden') },
  })

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (zones) => { activeZones = zones })
    cameraPrompt.textContent = 'Camera ready! Move to blow leaves around!'
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

  gameState = startGame(createInitialState())
  lastSwirled = 0

  if (!cameraGranted) {
    const demoInterval = setInterval(() => {
      if (gameState.phase !== 'playing') { clearInterval(demoInterval); return }
      activeZones = [{
        id: 0, normalizedX: 0.3 + Math.random() * 0.4, normalizedY: 0.3 + Math.random() * 0.4,
        spreadX: 0.15, spreadY: 0.3, pixelCount: 100, active: true, velocityY: 0,
      }]
    }, 1200)
  }

  startAmbience()

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = Math.min(ticker.deltaMS, 50)
    const zonesToUse = cameraGranted ? activeZones.slice(0, 6) : activeZones.slice(0, 3)
    gameState = updateGame(gameState, zonesToUse, app.screen.width, app.screen.height, deltaMs)

    app.stage.removeChildren()
    const g = new Graphics()

    // Ground
    g.rect(0, app.screen.height - 40, app.screen.width, 40)
    g.fill({ color: 0x3d2b1f, alpha: 0.6 })

    // Wind particles
    for (const wp of gameState.windParticles) {
      const lifeRatio = wp.life / wp.maxLife
      g.circle(wp.x, wp.y, wp.size)
      g.fill({ color: 0xffffff, alpha: lifeRatio * wp.alpha * 0.5 })
    }

    // Leaves — use Containers for transform
    for (const leaf of gameState.leaves) {
      const alpha = leaf.settled ? Math.max(0.3, 1 - leaf.settleProgress * 0.5) : 1
      const size = 8 * leaf.scale
      const lg = new Graphics()

      if (leaf.shape === 0) {
        // Oval leaf
        lg.ellipse(leaf.x, leaf.y, size, size * 0.5)
        lg.fill({ color: hueToHex(leaf.hue), alpha })
        lg.ellipse(leaf.x, leaf.y, size * 0.7, size * 0.35)
        lg.fill({ color: hueToHex(leaf.hue + 15), alpha: alpha * 0.7 })
      } else if (leaf.shape === 1) {
        // Pointed leaf
        const cx = leaf.x
        const cy = leaf.y
        const cos = Math.cos(leaf.rotation)
        const sin = Math.sin(leaf.rotation)
        const tipY = cy - size
        const botY = cy + size
        lg.moveTo(cx, tipY)
        lg.quadraticCurveTo(cx + size * 0.8, cy - size * 0.2, cx, botY)
        lg.quadraticCurveTo(cx - size * 0.8, cy - size * 0.2, cx, tipY)
        lg.fill({ color: hueToHex(leaf.hue), alpha })
      } else {
        // Round leaf
        lg.circle(leaf.x, leaf.y, size * 0.7)
        lg.fill({ color: hueToHex(leaf.hue), alpha })
      }
      // Stem
      lg.moveTo(leaf.x, leaf.y)
      lg.lineTo(leaf.x, leaf.y + size * 0.8)
      lg.stroke({ color: hueToHex(leaf.hue - 20), width: 1, alpha })

      app.stage.addChild(lg)
    }

    app.stage.addChild(g)

    // SFX
    if (gameState.totalSwirled !== lastSwirled) {
      if (gameState.totalSwirled > lastSwirled + 3) sfxSwirl()
      sfxLeafLand()
      announceSwirled(gameState.totalSwirled)
      lastSwirled = gameState.totalSwirled
    }

    swirlDisplay.textContent = `Leaves: ${gameState.totalSwirled}`
  }

  app.ticker.add(gameLoopCallback)
}

function resetToStart(): void {
  if (gameLoopCallback && app) { app.ticker.remove(gameLoopCallback); gameLoopCallback = null }
  stopMotionTracking(); stopAmbience()
  if (app) app.stage.removeChildren()
  gameState = createInitialState(); activeZones = []; lastSwirled = 0
  showScreen('start-screen')
  if (cameraGranted && cameraPreview) startMotionTracking(cameraPreview, (z) => { activeZones = z })
  announceStart(); manageFocus('start')
}

function hueToHex(hue: number): number {
  const h = ((hue % 360) + 360) % 360
  const s = 0.75, l = 0.55
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

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
else boot()