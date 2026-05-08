// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, sfxCorrect, sfxWrong, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

const C = {
  bg: 0x1a2218,
  bgLight: 0x2a3a28,
  accent: 0x88cc44,
  hand: 0x44aaff,
  item: 0xff8844,
  slot: 0x556644,
  text: 0xffffff,
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

// Spot-On items — pick up items and place them in correct spots
interface SpotItem { id: string; emoji: string; name: string; homeX: number; homeY: number }
interface SlotShape { id: string; targetItem: string; x: number; y: number }

const ITEMS: SpotItem[] = [
  { id: 'key', emoji: '🔑', name: 'Key', homeX: 0.15, homeY: 0.3 },
  { id: 'star', emoji: '⭐', name: 'Star', homeX: 0.35, homeY: 0.55 },
  { id: 'heart', emoji: '❤️', name: 'Heart', homeX: 0.55, homeY: 0.25 },
  { id: 'moon', emoji: '🌙', name: 'Moon', homeX: 0.75, homeY: 0.5 },
  { id: 'bell', emoji: '🔔', name: 'Bell', homeX: 0.25, homeY: 0.7 },
  { id: 'flower', emoji: '🌸', name: 'Flower', homeX: 0.65, homeY: 0.7 },
]

const SLOTS: SlotShape[] = [
  { id: 's1', targetItem: 'key', x: 0.8, y: 0.3 },
  { id: 's2', targetItem: 'star', x: 0.2, y: 0.45 },
  { id: 's3', targetItem: 'heart', x: 0.5, y: 0.65 },
  { id: 's4', targetItem: 'moon', x: 0.35, y: 0.2 },
  { id: 's5', targetItem: 'bell', x: 0.65, y: 0.45 },
  { id: 's6', targetItem: 'flower', x: 0.8, y: 0.65 },
]

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.soi-camera-prompt') as HTMLElement
  const gameStatus = document.getElementById('game-status')!

  setupGameMenu({ musicTrackPicker: false })
  let cameraGranted = false
  let activeBodies: MotionBody[] = []
  let app: Application | null = null
  let gameRunning = false
  let score = 0
  let placedItems: Map<string, boolean> = new Map()
  let heldItem: string | null = null
  let gameLoopCallback: (() => void) | null = null
  let lastSelectTime = 0

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera access granted! Point at items to pick them up, then point at matching spots to place them!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Click items then click spots to place them.'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  async function enterGame(): Promise<void> {
    ensureAudioUnlocked()
    showScreen('game-screen')
    gameRunning = true
    score = 0
    placedItems = new Map()
    heldItem = null
    lastSelectTime = 0

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 100)))
    })

    const rect = pixiStage.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))

    app = await initStage(pixiStage, w, h)
    if (!app) return

    // Click/tap to pick up and place items
    pixiStage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!app) return
      const pixiRect = pixiStage.getBoundingClientRect()
      const tx = e.clientX - pixiRect.left
      const ty = e.clientY - pixiRect.top
      const sw = app!.screen.width
      const sh = app!.screen.height

      if (heldItem) {
        // Try to place in a slot
        for (const slot of SLOTS) {
          const sx = slot.x * sw
          const sy = slot.y * sh
          if (Math.hypot(tx - sx, ty - sy) < 30) {
            if (slot.targetItem === heldItem && !placedItems.get(heldItem)) {
              placedItems.set(heldItem, true)
              score += 10
              sfxCorrect()
              announceAction(`Placed ${heldItem} correctly!`)
            } else if (placedItems.get(heldItem)) {
              // Already placed
            } else {
              sfxWrong()
              announceAction('Wrong spot!')
            }
            heldItem = null
            return
          }
        }
        // Deselect
        heldItem = null
      } else {
        // Try to pick up an item
        for (const item of ITEMS) {
          if (placedItems.get(item.id)) continue
          const ix = item.homeX * sw
          const iy = item.homeY * sh
          if (Math.hypot(tx - ix, ty - iy) < 25) {
            heldItem = item.id
            sfxTap()
            return
          }
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
      gfx.rect(0, 0, sw, sh).fill({ color: C.bg })
      // Room floor
      gfx.rect(0, sh * 0.6, sw, sh * 0.4).fill({ color: C.bgLight })

      // Draw slots (outlines)
      for (const slot of SLOTS) {
        const sx = slot.x * sw
        const sy = slot.y * sh
        const isPlaced = placedItems.get(slot.targetItem)
        if (isPlaced) {
          gfx.circle(sx, sy, 22).fill({ color: C.accent, alpha: 0.6 })
          const item = ITEMS.find(i => i.id === slot.targetItem)!
          const emojiText = new Text({ text: item.emoji, style: { fontSize: 20 } })
          emojiText.anchor.set(0.5, 0.5)
          emojiText.position.set(sx, sy)
          texts.push(emojiText)
        } else {
          gfx.circle(sx, sy, 22).stroke({ color: C.slot, width: 2 })
          const targetItem = ITEMS.find(i => i.id === slot.targetItem)
          const hintText = new Text({ text: targetItem?.emoji ?? '?', style: { fontSize: 16, alpha: 0.4 } })
          hintText.anchor.set(0.5, 0.5)
          hintText.position.set(sx, sy)
          texts.push(hintText)
        }
      }

      // Draw items (non-placed)
      for (const item of ITEMS) {
        if (placedItems.get(item.id)) continue
        const ix = item.homeX * sw
        const iy = item.homeY * sh
        const isHeld = heldItem === item.id
        const bounce = isHeld ? Math.sin(now * 0.01) * 3 : 0
        gfx.circle(ix, iy + bounce, isHeld ? 20 : 16).fill({ color: C.item, alpha: isHeld ? 0.9 : 0.6 })
        const emojiText = new Text({ text: item.emoji, style: { fontSize: isHeld ? 22 : 18 } })
        emojiText.anchor.set(0.5, 0.5)
        emojiText.position.set(ix, iy + bounce)
        texts.push(emojiText)
      }

      // Hand tracking — hover to select, arms-up to pick up or place
      const body = cameraGranted ? activeBodies[0] : null
      if (body) {
        const hx = (1 - body.normalizedX) * sw
        const hy = body.normalizedY * sh

        if (body.armsUp && now - lastSelectTime > 600) {
          lastSelectTime = now
          if (heldItem) {
            // Try to place in closest matching slot
            for (const slot of SLOTS) {
              const sx = slot.x * sw
              const sy = slot.y * sh
              if (Math.hypot(hx - sx, hy - sy) < 40 && slot.targetItem === heldItem && !placedItems.get(heldItem)) {
                placedItems.set(heldItem, true)
                score += 10
                heldItem = null
                sfxCorrect()
                announceAction(`Placed correctly!`)
                break
              }
            }
          } else {
            // Try to pick up closest item
            for (const item of ITEMS) {
              if (placedItems.get(item.id)) continue
              const ix = item.homeX * sw
              const iy = item.homeY * sh
              if (Math.hypot(hx - ix, hy - iy) < 35) {
                heldItem = item.id
                sfxTap()
                break
              }
            }
          }
        }

        // Cursor
        gfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
        gfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })
        if (heldItem) {
          gfx.circle(hx, hy, 14).stroke({ color: C.item, width: 2 })
        }
      }

      // HUD
      const scoreText = new Text({ text: `Score: ${score} / ${ITEMS.length * 10}`, style: { fill: C.accent, fontSize: 18, fontFamily: 'system-ui' } })
      scoreText.position.set(10, 10)
      texts.push(scoreText)

      if (heldItem) {
        const heldName = ITEMS.find(i => i.id === heldItem)?.emoji ?? ''
        const heldText = new Text({ text: `Holding: ${heldName}`, style: { fill: C.item, fontSize: 14, fontFamily: 'system-ui' } })
        heldText.position.set(10, 36)
        texts.push(heldText)
      }

      app.stage.removeChildren()
      app.stage.addChild(gfx)

      // Check win
      if (placedItems.size >= ITEMS.length) {
        const winText = new Text({ text: '🎉 All items placed!', style: { fill: C.accent, fontSize: 24, fontFamily: 'system-ui', fontWeight: 'bold' } })
        winText.anchor.set(0.5, 0.5)
        winText.position.set(sw / 2, sh / 2)
        texts.push(winText)
      }
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