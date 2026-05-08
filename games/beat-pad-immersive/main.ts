// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { ensureAudioUnlocked, triggerKitPad } from './sounds.js'

const C = {
  bg: 0x0d0d1a,
  padBorder: 0x333355,
  text: 0xffffff,
  hand: 0x44aaff,
  active: 0xff44cc,
}

const PAD_COLORS = [0xff4466, 0xff8844, 0xffcc44, 0x44ff88, 0x44ccff, 0x8844ff, 0xff44aa, 0xff44cc]
const PAD_LABELS = ['KICK', 'SNARE', 'CLAP', 'HI-HAT', 'TOM', 'CYMBAL', 'RIM', 'OPEN HH']

// ── PixiJS v8 initialization (lazy — called when container is visible) ──
async function initStage(container: HTMLElement, width: number, height: number): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    try {
      const app = new Application()
      await app.init({
        preference,
        width,
        height,
        background: C.bg,
        autoDensity: true,
      })
      container.appendChild(app.canvas)
      return app
    } catch { continue }
  }
  return null
}

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.bpi-camera-prompt') as HTMLElement

  setupGameMenu({ musicTrackPicker: false })

  let cameraGranted = false
  let activeBodies: MotionBody[] = []
  let app: Application | null = null
  let gameLoopCallback: (() => void) | null = null

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera access granted! Wave your hands over the pads to trigger sounds!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Click or tap pads to play.'
  }

  let padHitTimes = new Array(8).fill(0)
  let prevTriggeredPads = new Set<number>()
  let bgGfx = new Graphics()
  let padGfxList: Graphics[] = []
  let handGfx = new Graphics()

  startBtn.addEventListener('click', enterGame)

  async function enterGame(): Promise<void> {
    ensureAudioUnlocked()
    const startScreen = document.getElementById('start-screen')!
    const gameScreen = document.getElementById('game-screen')!
    startScreen.hidden = true
    startScreen.setAttribute('inert', '')
    gameScreen.hidden = false
    gameScreen.classList.add('active')
    gameScreen.removeAttribute('inert')

    // Wait for layout to settle
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 100)))
    })

    const rect = pixiStage.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))

    // Init PixiJS now that container is visible
    app = await initStage(pixiStage, w, h)
    if (!app) return

    padHitTimes = new Array(8).fill(0)
    prevTriggeredPads = new Set<number>()

    bgGfx = new Graphics()
    handGfx = new Graphics()
    padGfxList = []
    for (let i = 0; i < 8; i++) {
      const pg = new Graphics()
      padGfxList.push(pg)
    }

    app.stage.addChild(bgGfx)
    for (const pg of padGfxList) app.stage.addChild(pg)
    app.stage.addChild(handGfx)

    // Mouse/touch fallback — tap on the canvas to trigger pads
    pixiStage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!app) return
      const pixiRect = pixiStage.getBoundingClientRect()
      const tx = e.clientX - pixiRect.left
      const ty = e.clientY - pixiRect.top
      const sw = app!.screen.width
      const sh = app!.screen.height
      const padCols = 4
      const padRows = 2
      const padGap = 12
      const padW = (sw - padGap * (padCols + 1)) / padCols
      const padH = (sh * 0.55 - padGap * (padRows + 1)) / padRows
      const topOffset = sh * 0.15
      const index = Math.floor((ty - topOffset) / (padH + padGap)) * padCols + Math.floor(tx / (padW + padGap))
      if (index >= 0 && index < 8) {
        triggerKitPad(index)
        padHitTimes[index] = performance.now()
      }
    })

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

    gameLoopCallback = () => {
      if (!app) return
      const sw = app.screen.width
      const sh = app.screen.height
      const now = performance.now()
      const texts: Text[] = []

      // Background
      bgGfx.clear()
      bgGfx.rect(0, 0, sw, sh).fill({ color: C.bg })

      // Draw pads in 2x4 grid
      const padCols = 4
      const padRows = 2
      const padGap = 12
      const padW = (sw - padGap * (padCols + 1)) / padCols
      const padH = (sh * 0.55 - padGap * (padRows + 1)) / padRows
      const topOffset = sh * 0.15

      const triggeredPads = new Set<number>()

      for (let i = 0; i < 8; i++) {
        const col = i % padCols
        const row = Math.floor(i / padCols)
        const px = padGap + col * (padW + padGap)
        const py = topOffset + padGap + row * (padH + padGap)

        const timeSinceHit = now - padHitTimes[i]
        const flashAlpha = Math.max(0, 1 - timeSinceHit / 400)

        padGfxList[i].clear()
        if (flashAlpha > 0) {
          padGfxList[i].roundRect(px - 4, py - 4, padW + 8, padH + 8, 12).fill({ color: C.active, alpha: flashAlpha * 0.4 })
        }
        padGfxList[i].roundRect(px, py, padW, padH, 8).fill({ color: PAD_COLORS[i], alpha: 0.7 + flashAlpha * 0.3 })
        padGfxList[i].roundRect(px, py, padW, padH, 8).stroke({ color: C.padBorder, width: 2 })

        // Label
        const label = new Text({ text: PAD_LABELS[i], style: { fill: 0xffffff, fontSize: Math.min(14, padW / 8), fontFamily: 'system-ui', fontWeight: 'bold' } })
        label.anchor.set(0.5, 0.5)
        label.position.set(px + padW / 2, py + padH / 2)
        texts.push(label)
      }

      // Hand tracking
      handGfx.clear()
      const bodies = cameraGranted ? activeBodies : []

      for (const body of bodies) {
        const hx = (1 - body.normalizedX) * sw
        const hy = body.normalizedY * sh

        // Check which pad the hand is over
        for (let i = 0; i < 8; i++) {
          const col = i % padCols
          const row = Math.floor(i / padCols)
          const px = padGap + col * (padW + padGap)
          const py = topOffset + padGap + row * (padH + padGap)

          if (hx >= px && hx <= px + padW && hy >= py && hy <= py + padH) {
            triggeredPads.add(i)
          }
        }

        // Draw hand position
        handGfx.circle(hx, hy, 20).fill({ color: C.hand, alpha: 0.3 })
        handGfx.circle(hx, hy, 8).fill({ color: C.hand, alpha: 0.6 })
      }

      // Trigger newly hit pads
      for (const padIndex of triggeredPads) {
        if (!prevTriggeredPads.has(padIndex)) {
          triggerKitPad(padIndex)
          padHitTimes[padIndex] = now
        }
      }
      prevTriggeredPads = triggeredPads

      // Title
      const titleText = new Text({ text: 'Beat Pad Immersive', style: { fill: C.text, fontSize: 18, fontFamily: 'system-ui' } })
      titleText.position.set(10, 10)
      texts.push(titleText)

      // Re-add all elements to stage (clears old Text objects each frame)
      app.stage.removeChildren()
      app.stage.addChild(bgGfx)
      for (const pg of padGfxList) app.stage.addChild(pg)
      app.stage.addChild(handGfx)
      for (const t of texts) app.stage.addChild(t)
    }

    app.ticker.add(gameLoopCallback)
  }

  document.addEventListener('restart', () => {
    if (app) {
      app.ticker.remove(gameLoopCallback!)
      app.destroy(true, { children: true, texture: true })
      app = null
    }
    stopMotionTracking()
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}