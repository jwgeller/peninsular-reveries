// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, sfxCorrect, sfxWrong, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

const C = { bg: 0x0a1a2a, water: 0x2266aa, barrier: 0x88cc44, hand: 0x44aaff, accent: 0x44ddff, text: 0xffffff }

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

const COLS = 8, ROWS = 6

interface WaterDrop { x: number; y: number; speed: number }
interface Barrier { col: number; row: number }

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.wi-camera-prompt') as HTMLElement
  const gameStatus = document.getElementById('game-status')!

  setupGameMenu({ musicTrackPicker: false })
  let cameraGranted = false, activeBodies: MotionBody[] = []
  let app: Application | null = null, gameRunning = false, gameLoopCallback: (() => void) | null = null
  let barriers: Barrier[] = [], waterDrops: WaterDrop[] = [], lastPlaceTime = 0, score = 0

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) { startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies }); cameraPrompt.textContent = 'Camera access granted! Move your hands to place barriers. Water flows around them!' }
  else { cameraPrompt.textContent = 'Camera not available. Click cells to place barriers.' }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  function spawnWater() {
    if (Math.random() < 0.15) {
      waterDrops.push({ x: Math.random() * COLS, y: 0, speed: 0.02 + Math.random() * 0.03 })
    }
  }

  async function enterGame() {
    ensureAudioUnlocked(); showScreen('game-screen'); gameRunning = true
    barriers = []; waterDrops = []; score = 0; lastPlaceTime = 0
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100))))
    const rect = pixiStage.getBoundingClientRect()
    app = await initStage(pixiStage, Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)))
    if (!app) return

    pixiStage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!app || !gameRunning) return
      const pr = pixiStage.getBoundingClientRect()
      const tx = e.clientX - pr.left, ty = e.clientY - pr.top
      const sw = app!.screen.width, sh = app!.screen.height
      const gridX = (sw - Math.min(sw, sh) * 0.9) / 2
      const gridY = sh * 0.15
      const cellSize = Math.min(sw, sh) * 0.9 / COLS
      const col = Math.floor((tx - gridX) / cellSize)
      const row = Math.floor((ty - gridY) / cellSize)
      toggleBarrier(col, row)
    })

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)
    gameLoopCallback = () => {
      const texts: Text[] = []
      if (!app || !gameRunning) return
      const sw = app.screen.width, sh = app.screen.height, now = performance.now()
      spawnWater()

      // Move water drops
      waterDrops.forEach(drop => {
        drop.y += drop.speed
        // Check if blocked by barrier
        const col = Math.floor(drop.x)
        const row = Math.floor(drop.y)
        if (barriers.some(b => b.col === col && b.row === row)) {
          drop.x += (Math.random() < 0.5 ? 1 : -1) * 0.1 // deflect
        }
      })
      waterDrops = waterDrops.filter(d => d.y < ROWS && d.x > -1 && d.x < COLS + 1)

      const gfx = new Graphics()
      gfx.rect(0, 0, sw, sh).fill({ color: C.bg })

      const gridW = Math.min(sw, sh) * 0.9
      const cellSize = gridW / COLS
      const gridX = (sw - gridW) / 2
      const gridY = sh * 0.15

      // Grid cells
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cx = gridX + c * cellSize, cy = gridY + r * cellSize
          const isBarrier = barriers.some(b => b.col === c && b.row === r)
          gfx.rect(cx + 1, cy + 1, cellSize - 2, cellSize - 2).fill({ color: isBarrier ? C.barrier : 0x112233, alpha: 0.7 })
          gfx.rect(cx + 1, cy + 1, cellSize - 2, cellSize - 2).stroke({ color: 0x223344, width: 1 })
        }
      }

      // Water drops
      for (const drop of waterDrops) {
        const dx = gridX + drop.x * cellSize, dy = gridY + drop.y * cellSize
        gfx.circle(dx, dy, 3).fill({ color: C.water, alpha: 0.7 })
      }

      // Title
      const title = new Text({ text: 'Waterwall Immersive', style: { fill: C.accent, fontSize: 20, fontFamily: 'system-ui', fontWeight: 'bold' } })
      title.anchor.set(0.5, 0); title.position.set(sw / 2, 10); texts.push(title)

      // Barrier count
      const countText = new Text({ text: `Barriers: ${barriers.length}`, style: { fill: C.text, fontSize: 14, fontFamily: 'system-ui' } })
      countText.position.set(10, sh - 30); texts.push(countText)

      // Hand tracking
      const body = cameraGranted ? activeBodies[0] : null
      if (body && gameRunning) {
        const hx = (1 - body.normalizedX) * sw, hy = body.normalizedY * sh
        const hCol = Math.floor((hx - gridX) / cellSize)
        const hRow = Math.floor((hy - gridY) / cellSize)

        if (hCol >= 0 && hCol < COLS && hRow >= 0 && hRow < ROWS) {
          const hx2 = gridX + hCol * cellSize, hy2 = gridY + hRow * cellSize
          gfx.rect(hx2, hy2, cellSize, cellSize).stroke({ color: C.hand, width: 2 })

          if (body.armsUp && now - lastPlaceTime > 400) {
            toggleBarrier(hCol, hRow)
            lastPlaceTime = now
          }
        }

        gfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
        gfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })
      }

      app.stage.removeChildren()
      app.stage.addChild(gfx)
      for (const t of texts) app.stage.addChild(t)
    }
    app.ticker.add(gameLoopCallback)
  }

  function toggleBarrier(col: number, row: number) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return
    const idx = barriers.findIndex(b => b.col === col && b.row === row)
    if (idx >= 0) { barriers.splice(idx, 1); sfxTap() } else { barriers.push({ col, row }); sfxSelect() }
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