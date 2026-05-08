// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, sfxCorrect, sfxWrong, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

const C = { bg: 0x1e2a3e, track: 0x2a3a50, accent: 0xff8844, hand: 0x44aaff, text: 0xffffff, sky: 0x445577 }

async function initStage(container: HTMLElement, width: number, height: number): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    try { const app = new Application(); await app.init({ preference, width, height, background: C.bg, autoDensity: true }); container.appendChild(app.canvas); return app } catch { continue }
  }
  return null
}

const ALL_SCREENS = ['start-screen', 'game-screen', 'end-screen']
function showScreen(screenId: string): void {
  for (const id of ALL_SCREENS) { const el = document.getElementById(id); if (!el) continue; const isActive = id === screenId; el.hidden = !isActive; el.classList.toggle('active', isActive); if (isActive) el.removeAttribute('inert'); else el.setAttribute('inert', '') }
}

interface TrainPart { id: string; label: string; emoji: string; x: number; y: number; sound: string }
const PARTS: TrainPart[] = [
  { id: 'engine', label: 'Engine', emoji: '🚂', x: 0.15, y: 0.55, sound: 'choo choo!' },
  { id: 'coal', label: 'Coal Car', emoji: '🛤️', x: 0.35, y: 0.55, sound: 'clack clack!' },
  { id: 'passenger', label: 'Passenger', emoji: '🚃', x: 0.55, y: 0.55, sound: 'chatter chatter!' },
  { id: 'cargo', label: 'Cargo', emoji: '📦', x: 0.75, y: 0.55, sound: 'rumble rumble!' },
  { id: 'caboose', label: 'Caboose', emoji: '🛤️', x: 0.90, y: 0.55, sound: 'squeak squeak!' },
]

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.tsi-camera-prompt') as HTMLElement
  const gameStatus = document.getElementById('game-status')!

  setupGameMenu({ musicTrackPicker: false })
  let cameraGranted = false, activeBodies: MotionBody[] = []
  let app: Application | null = null, gameRunning = false, gameLoopCallback: (() => void) | null = null
  let score = 0, lastPartId = '', lastSelectTime = 0

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) { startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies }); cameraPrompt.textContent = 'Camera access granted! Point at different parts of the train to trigger their sounds!' }
  else { cameraPrompt.textContent = 'Camera not available. Click on train parts to hear their sounds.' }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  async function enterGame() {
    ensureAudioUnlocked(); showScreen('game-screen'); gameRunning = true; score = 0; lastPartId = ''; lastSelectTime = 0
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100))))
    const rect = pixiStage.getBoundingClientRect()
    app = await initStage(pixiStage, Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)))
    if (!app) return

    pixiStage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!app || !gameRunning) return
      const pr = pixiStage.getBoundingClientRect()
      const tx = e.clientX - pr.left, ty = e.clientY - pr.top
      triggerPart(tx, ty, app!.screen.width, app!.screen.height)
    })

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)
    gameLoopCallback = () => {
      if (!app || !gameRunning) return
      const sw = app.screen.width, sh = app.screen.height, now = performance.now()
      const gfx = new Graphics()
      const texts: Text[] = []

      // Sky
      gfx.rect(0, 0, sw, sh * 0.4).fill({ color: C.sky })
      // Ground
      gfx.rect(0, sh * 0.4, sw, sh * 0.6).fill({ color: C.bg })
      // Track
      gfx.rect(0, sh * 0.65, sw, sh * 0.03).fill({ color: C.track })

      // Train parts
      for (const part of PARTS) {
        const px = part.x * sw, py = part.y * sh
        const w = sw * 0.14, h = sh * 0.2
        gfx.roundRect(px - w/2, py - h/2, w, h, 6).fill({ color: C.accent, alpha: lastPartId === part.id ? 0.9 : 0.5 })
        gfx.roundRect(px - w/2, py - h/2, w, h, 6).stroke({ color: C.text, width: 1 })
        const emoji = new Text({ text: part.emoji, style: { fontSize: 28 } })
        emoji.anchor.set(0.5, 0.5); emoji.position.set(px, py - 8); texts.push(emoji)
        const label = new Text({ text: part.label, style: { fill: C.text, fontSize: 11, fontFamily: 'system-ui' } })
        label.anchor.set(0.5, 0); label.position.set(px, py + 22); texts.push(label)
      }

      // Smoke puffs
      const smokeOffset = Math.sin(now * 0.003) * 10
      for (let i = 0; i < 3; i++) {
        const sx = PARTS[0].x * sw - 10 + i * 12
        const sy = PARTS[0].y * sh - sh * 0.15 - smokeOffset - i * 15
        gfx.circle(sx, sy, 8 + i * 3).fill({ color: 0xcccccc, alpha: 0.3 - i * 0.08 })
      }

      // Hand tracking
      const body = cameraGranted ? activeBodies[0] : null
      if (body && gameRunning) {
        const hx = (1 - body.normalizedX) * sw, hy = body.normalizedY * sh
        for (const part of PARTS) {
          const px = part.x * sw, py = part.y * sh, w = sw * 0.14, h = sh * 0.2
          if (hx > px - w/2 && hx < px + w/2 && hy > py - h/2 && hy < py + h/2) {
            gfx.roundRect(px - w/2 - 3, py - h/2 - 3, w + 6, h + 6, 8).stroke({ color: C.hand, width: 3 })
            if (body.armsUp && now - lastSelectTime > 800) {
              triggerPart(hx, hy, sw, sh)
            }
          }
        }
        gfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
        gfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })
      }

      // HUD
      const scoreText = new Text({ text: `Sounds discovered: ${score} / ${PARTS.length}`, style: { fill: C.accent, fontSize: 18, fontFamily: 'system-ui' } })
      scoreText.position.set(10, sh - 30); texts.push(scoreText)

      app.stage.removeChildren()
      app.stage.addChild(gfx)
      for (const t of texts) app.stage.addChild(t)
    }
    app.ticker.add(gameLoopCallback)
  }

  const discoveredParts: Set<string> = new Set()
  function triggerPart(tx: number, ty: number, sw: number, sh: number) {
    const now = performance.now()
    if (now - lastSelectTime < 400) return
    for (const part of PARTS) {
      const px = part.x * sw, py = part.y * sh
      const w = sw * 0.14, h = sh * 0.2
      if (tx > px - w/2 && tx < px + w/2 && ty > py - h/2 && ty < py + h/2) {
        lastPartId = part.id; lastSelectTime = now
        sfxSelect(); announceAction(`${part.label} says "${part.sound}"`)
        if (!discoveredParts.has(part.id)) { discoveredParts.add(part.id); score++ }
        return
      }
    }
  }

  function resetToStart() {
    gameRunning = false
    if (app) { app.ticker.remove(gameLoopCallback!); app.destroy(true, { children: true, texture: true }); app = null }
    stopMotionTracking(); showScreen('start-screen'); gameStatus.textContent = 'Ready to play!'
    if (cameraGranted && cameraPreview) startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
  }
  document.addEventListener('restart', () => resetToStart())
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot) } else { boot() }