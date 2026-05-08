// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, sfxCorrect, sfxWrong, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  bg: 0x0a0a2e,
  bgLight: 0x1a1a4e,
  accent: 0xff6600,
  hand: 0x44aaff,
  text: 0xffffff,
  star: 0xffcc44,
  planet: 0x44cc88,
  rocket: 0xff4400,
}

// ── PixiJS v8 initialization (lazy — called when container is visible) ──
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
  const cameraPrompt = document.querySelector('.moi-camera-prompt') as HTMLElement
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
    cameraPrompt.textContent = 'Camera access granted! Raise hand to ignite boosters, lean left/right to steer the rocket through mission phases.'
  } else {
    cameraPrompt.textContent = 'Camera not available. Click or tap to interact.'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  // Mission state
  let missionPhase = 0 // 0=launch, 1=orbit, 2=land
  let rocketY = 0
  let rocketX = 0
  let stars: Array<{ x: number; y: number; speed: number; brightness: number }> = []
  let phaseLabels = ['🚀 LAUNCH', '🛸 ORBIT', '🌑 LAND']
  let lastSelectTime = 0

  async function enterGame(): Promise<void> {
    ensureAudioUnlocked()
    showScreen('game-screen')
    gameRunning = true
    score = 0
    missionPhase = 0
    rocketY = 0
    rocketX = 0.5
    lastSelectTime = 0

    // Generate stars
    stars = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.2 + Math.random() * 1.5,
      brightness: 0.3 + Math.random() * 0.7,
    }))

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 100)))
    })

    const rect = pixiStage.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))

    app = await initStage(pixiStage, w, h)
    if (!app) return

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

    gameLoopCallback = () => {
      const texts: Text[] = []
      if (!app || !gameRunning) return
      const sw = app.screen.width
      const sh = app.screen.height
      const now = performance.now()

      // Star-field (drawn directly on a single graphics)
      const bgGfx = new Graphics()
      bgGfx.rect(0, 0, sw, sh).fill({ color: C.bg })
      for (const star of stars) {
        star.y += star.speed * 0.002
        if (star.y > 1) { star.y = 0; star.x = Math.random() }
        const sx = star.x * sw
        const sy = star.y * sh
        bgGfx.circle(sx, sy, 1 + star.brightness).fill({ color: C.star, alpha: star.brightness })
      }

      // Planet at top
      bgGfx.circle(sw * 0.5, sh * 0.12, 30).fill({ color: C.planet })

      // Phase indicator
      const phaseText = new Text({
        text: phaseLabels[missionPhase],
        style: { fill: C.accent, fontSize: 24, fontFamily: 'system-ui', fontWeight: 'bold' },
      })
      phaseText.anchor.set(0.5, 0)
      phaseText.position.set(sw / 2, 60)
      texts.push(phaseText)

      // Rocket
      const body = cameraGranted ? activeBodies[0] : null
      if (body) {
        const targetX = 1 - body.normalizedX
        rocketX += (targetX - rocketX) * 0.08

        if (body.armsUp && now - lastSelectTime > 1200) {
          sfxSelect()
          lastSelectTime = now
          score += 10
          missionPhase = (missionPhase + 1) % 3
          announceAction(`Phase: ${phaseLabels[missionPhase]}`)
        }
      } else {
        // Drift rocket slightly
        rocketX += Math.sin(now * 0.001) * 0.001
      }

      rocketY = sh * 0.55 + Math.sin(now * 0.003) * 8
      const rx = rocketX * sw
      bgGfx.circle(rx, rocketY - 18, 6).fill({ color: C.rocket })  // nose
      bgGfx.rect(rx - 6, rocketY - 12, 12, 30).fill({ color: 0xcccccc })  // body
      bgGfx.rect(rx - 10, rocketY + 18, 6, 8).fill({ color: 0x888888 }) // left fin
      bgGfx.rect(rx + 4, rocketY + 18, 6, 8).fill({ color: 0x888888 }) // right fin
      // Flame
      const flameH = 10 + Math.sin(now * 0.02) * 6
      bgGfx.circle(rx, rocketY + 30 + flameH / 2, 5).fill({ color: C.accent, alpha: 0.8 + Math.sin(now * 0.03) * 0.2 })
      bgGfx.circle(rx, rocketY + 30 + flameH, 3).fill({ color: 0xffff44, alpha: 0.6 })

      // Hand cursor
      if (body) {
        const hx = (1 - body.normalizedX) * sw
        const hy = body.normalizedY * sh
        bgGfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
        bgGfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })
      }

      // HUD
      const scoreText = new Text({ text: `Score: ${score}`, style: { fill: C.accent, fontSize: 18, fontFamily: 'system-ui' } })
      scoreText.position.set(10, 10)
      texts.push(scoreText)

      // Replace stage children
      app.stage.removeChildren()
      app.stage.addChild(bgGfx)
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
    score = 0
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