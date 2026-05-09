import { Application, Graphics } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame } from './state.js'
import type { GameState, MotionBody } from './types.js'
import { setupBubblePopInput as setupStarDashInput } from './input.js'
import { announceCatch, announceStart, manageFocus } from './accessibility.js'
import { sfxCatch, sfxMiss, sfxSpawn, startAmbience, stopAmbience, setMuted } from './sounds.js'

export { setupStarDashInput }

const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.getElementById('camera-denied-msg') as HTMLElement
const scoreDisplay = document.getElementById('score-display')!
const timerDisplay = document.getElementById('timer-display')!
const streakDisplay = document.getElementById('streak-display')!
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

  setupStarDashInput({
    onStart: enterGame,
    onReplay: resetToStart,
    onMenu: () => { const m = document.getElementById('settings-modal'); if (m) m.toggleAttribute('hidden') },
  })

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera ready! Dash to catch the stars!'
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

  if (!cameraGranted) {
    const demoInterval = setInterval(() => {
      if (gameState.phase !== 'playing') { clearInterval(demoInterval); return }
      activeBodies = [{
        id: 99, normalizedX: 0.3 + Math.random() * 0.4, normalizedY: 0.3 + Math.random() * 0.4,
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

    if (gameState.phase === 'end') {
      endGame()
      return
    }

    app.stage.removeChildren()
    const g = new Graphics()

    // Constellation lines
    for (const line of gameState.constellationLines) {
      g.moveTo(line.from.x, line.from.y)
      g.lineTo(line.to.x, line.to.y)
      g.stroke({ color: 0xffffff, width: 2, alpha: line.alpha * 0.5 })
    }

    // Stars
    const now = gameState.gameTime
    for (const star of gameState.stars) {
      const age = now - star.spawnTime
      const fadeProgress = Math.min(1, age / star.lifetime)
      const pulse = 1 + Math.sin(star.pulsePhase) * 0.15
      const alpha = (1 - fadeProgress) * 0.9 + 0.1
      const size = star.size * pulse * (1 + fadeProgress * 0.3)

      // Glow
      g.circle(star.x, star.y, size * 1.8)
      g.fill({ color: hueToHex(star.hue), alpha: alpha * 0.15 })
      // Star shape (simplified as circle + cross)
      g.circle(star.x, star.y, size)
      g.fill({ color: hueToHex(star.hue), alpha })

      // Cross shimmer
      g.moveTo(star.x - size * 0.6, star.y)
      g.lineTo(star.x + size * 0.6, star.y)
      g.stroke({ color: 0xffffff, width: 1.5, alpha: alpha * 0.5 })
      g.moveTo(star.x, star.y - size * 0.6)
      g.lineTo(star.x, star.y + size * 0.6)
      g.stroke({ color: 0xffffff, width: 1.5, alpha: alpha * 0.5 })

      // Timer ring
      if (fadeProgress > 0.5) {
        const endAngle = Math.PI * 2 * (1 - fadeProgress)
        g.arc(star.x, star.y, size + 8, -Math.PI / 2, -Math.PI / 2 + endAngle)
        g.stroke({ color: 0xff4444, width: 2, alpha: alpha * 0.8 })
      }
    }

    // Motion body indicators
    for (const body of bodiesToUse) {
      const bx = (1 - body.normalizedX) * app.screen.width
      const by = body.normalizedY * app.screen.height
      g.circle(bx, by, 15)
      g.fill({ color: 0xffffff, alpha: 0.1 })
    }

    // Particles
    for (const p of gameState.particles) {
      const lifeRatio = p.life / p.maxLife
      const r = Math.max(0.5, p.size * lifeRatio)
      const color = p.hue < 0 ? 0xffffff : hueToHex(p.hue)
      g.circle(p.x, p.y, r)
      g.fill({ color, alpha: Math.max(0, lifeRatio * 0.8) })
    }

    app.stage.addChild(g)

    // SFX
    if (gameState.caughtThisFrame) {
      sfxCatch()
      announceCatch(gameState.score, gameState.streak)
    }

    // HUD
    const remaining = Math.max(0, Math.ceil((gameState.gameDuration - gameState.gameTimer) / 1000))
    scoreDisplay.textContent = `Score: ${gameState.score}`
    timerDisplay.textContent = `Time: ${remaining}s`
    streakDisplay.textContent = gameState.streak > 1 ? `🔥 ${gameState.streak}x` : ''
  }

  app.ticker.add(gameLoopCallback)
}

function endGame(): void {
  if (!app) return
  if (gameLoopCallback) { app.ticker.remove(gameLoopCallback); gameLoopCallback = null }
  stopMotionTracking(); stopAmbience()
  showScreen('end-screen')
  const endScoreMsg = document.getElementById('end-score-msg')
  if (endScoreMsg) endScoreMsg.textContent = `Final score: ${gameState.score} | Best streak: ${gameState.bestStreak}x`
  gameStatus.textContent = `Time's up! Final score: ${gameState.score}`
  setTimeout(() => resetToStart(), 5000)
}

function resetToStart(): void {
  if (gameLoopCallback && app) { app.ticker.remove(gameLoopCallback); gameLoopCallback = null }
  stopMotionTracking(); stopAmbience()
  if (app) app.stage.removeChildren()
  gameState = createInitialState(); activeBodies = []
  showScreen('start-screen')
  if (cameraGranted && cameraPreview) startMotionTracking(cameraPreview, (b) => { activeBodies = b })
  announceStart(); manageFocus('start')
}

function hueToHex(hue: number): number {
  const h = ((hue % 360) + 360) % 360
  const s = 0.9, l = 0.7
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