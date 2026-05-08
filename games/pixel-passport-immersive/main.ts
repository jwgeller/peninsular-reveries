// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, sfxCorrect, sfxWrong, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

const C = {
  bg: 0x0a1628,
  ocean: 0x1a3a5e,
  land: 0x2a7a44,
  accent: 0x44ccff,
  hand: 0x44aaff,
  text: 0xffffff,
  stamp: 0xff6644,
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

const DESTINATIONS = [
  { name: 'Tokyo', emoji: '🗼', x: 0.78, y: 0.35 },
  { name: 'Paris', emoji: '🗼', x: 0.48, y: 0.30 },
  { name: 'Cairo', emoji: '🏛️', x: 0.55, y: 0.42 },
  { name: 'New York', emoji: '🗽', x: 0.22, y: 0.35 },
  { name: 'Sydney', emoji: '🦘', x: 0.85, y: 0.72 },
  { name: 'Rio', emoji: ' Cristo', x: 0.30, y: 0.65 },
]

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.ppi-camera-prompt') as HTMLElement
  const gameStatus = document.getElementById('game-status')!

  setupGameMenu({ musicTrackPicker: false })
  let cameraGranted = false
  let activeBodies: MotionBody[] = []
  let app: Application | null = null
  let gameRunning = false
  let stamps: Set<string> = new Set()
  let gameLoopCallback: (() => void) | null = null
  let lastSelectTime = 0

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera access granted! Point at destinations on the globe to collect passport stamps!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Click or tap destinations to explore.'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  async function enterGame(): Promise<void> {
    ensureAudioUnlocked()
    showScreen('game-screen')
    gameRunning = true
    stamps = new Set()
    lastSelectTime = 0

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 100)))
    })

    const rect = pixiStage.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))

    app = await initStage(pixiStage, w, h)
    if (!app) return

    // Click/tap destinations
    pixiStage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!app) return
      const pixiRect = pixiStage.getBoundingClientRect()
      const tx = e.clientX - pixiRect.left
      const ty = e.clientY - pixiRect.top
      const sw = app!.screen.width
      const sh = app!.screen.height
      for (const dest of DESTINATIONS) {
        const dx = dest.x * sw
        const dy = dest.y * sh
        if (Math.hypot(tx - dx, ty - dy) < 30) {
          if (!stamps.has(dest.name)) {
            stamps.add(dest.name)
            sfxSelect()
            announceAction(`Stamped: ${dest.name}!`)
          }
          break
        }
      }
    })

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

    gameLoopCallback = () => {
      const texts: Text[] = []
      if (!app || !gameRunning) return
      const sw = app.screen.width
      const sh = app.screen.height
      const now = performance.now()

      const gfx = new Graphics()
      // Background — globe
      gfx.rect(0, 0, sw, sh).fill({ color: C.bg })
      const globeCx = sw / 2
      const globeCy = sh * 0.45
      const globeR = Math.min(sw, sh) * 0.35
      gfx.circle(globeCx, globeCy, globeR).fill({ color: C.ocean })
      // Simple continents as colored shapes
      gfx.ellipse(globeCx - globeR * 0.3, globeCy - globeR * 0.15, globeR * 0.25, globeR * 0.2).fill({ color: C.land })
      gfx.ellipse(globeCx + globeR * 0.2, globeCy - globeR * 0.3, globeR * 0.15, globeR * 0.25).fill({ color: C.land })
      gfx.ellipse(globeCx + globeR * 0.1, globeCy + globeR * 0.25, globeR * 0.2, globeR * 0.15).fill({ color: C.land })

      // Destination markers
      for (const dest of DESTINATIONS) {
        const dx = dest.x * sw
        const dy = dest.y * sh
        const hasStamp = stamps.has(dest.name)
        gfx.circle(dx, dy, hasStamp ? 18 : 14).fill({ color: hasStamp ? C.stamp : C.accent, alpha: 0.7 })
        gfx.circle(dx, dy, hasStamp ? 18 : 14).stroke({ color: C.text, width: 1 })
        const label = new Text({ text: dest.name, style: { fill: C.text, fontSize: 10, fontFamily: 'system-ui' } })
        label.anchor.set(0.5, 1.5)
        label.position.set(dx, dy)
        texts.push(label)
        if (hasStamp) {
          const stampIcon = new Text({ text: '✈', style: { fontSize: 16 } })
          stampIcon.anchor.set(0.5, 0.5)
          stampIcon.position.set(dx, dy)
          texts.push(stampIcon)
        }
      }

      // Hand tracking — hover to preview, arms-up to stamp
      const body = cameraGranted ? activeBodies[0] : null
      if (body) {
        const hx = (1 - body.normalizedX) * sw
        const hy = body.normalizedY * sh
        // Highlight hovered destination
        for (const dest of DESTINATIONS) {
          const dx = dest.x * sw
          const dy = dest.y * sh
          if (Math.hypot(hx - dx, hy - dy) < 35) {
            gfx.circle(dx, dy, 22).stroke({ color: C.accent, width: 3 })
            if (body.armsUp && !stamps.has(dest.name) && now - lastSelectTime > 800) {
              stamps.add(dest.name)
              lastSelectTime = now
              sfxSelect()
              announceAction(`Stamped: ${dest.name}!`)
            }
          }
        }
        gfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
        gfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })
      }

      // Score / stamps count
      const scoreText = new Text({ text: `Stamps: ${stamps.size} / ${DESTINATIONS.length}`, style: { fill: C.accent, fontSize: 18, fontFamily: 'system-ui' } })
      scoreText.position.set(10, 10)
      texts.push(scoreText)

      if (stamps.size >= DESTINATIONS.length) {
        const winText = new Text({ text: '🌍 All stamps collected!', style: { fill: C.stamp, fontSize: 22, fontFamily: 'system-ui', fontWeight: 'bold' } })
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
    stamps = new Set()
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