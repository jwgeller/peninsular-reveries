// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, sfxCorrect, sfxWrong, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

const C = {
  bg: 0x1a1028,
  path: 0x4a3070,
  accent: 0xaa66ff,
  hand: 0x44aaff,
  text: 0xffffff,
  choiceA: 0x44dd88,
  choiceB: 0xff6688,
}

async function initStage(container: HTMLElement, width: number, height: number): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    try { const app = new Application(); await app.init({ preference, width, height, background: C.bg, autoDensity: true }); container.appendChild(app.canvas); return app } catch { continue }
  }
  return null
}

const ALL_SCREENS = ['start-screen', 'game-screen', 'end-screen']
function showScreen(screenId: string): void {
  for (const id of ALL_SCREENS) {
    const el = document.getElementById(id); if (!el) continue
    const isActive = id === screenId; el.hidden = !isActive; el.classList.toggle('active', isActive)
    if (isActive) el.removeAttribute('inert'); else el.setAttribute('inert', '')
  }
}

interface StoryScene { prompt: string; choiceA: string; choiceB: string; nextA: number; nextB: number }
const STORY: StoryScene[] = [
  { prompt: 'You stand at a crossroads in an enchanted forest...', choiceA: '🍄 Follow the mushrooms', choiceB: '🌙 Chase the fireflies', nextA: 1, nextB: 2 },
  { prompt: 'The mushrooms lead you to a friendly giant!', choiceA: '🤝 Accept his gift', choiceB: '🏃 Sneak past him', nextA: 3, nextB: 4 },
  { prompt: 'Fireflies reveal a hidden crystal cave!', choiceA: '💎 Take the crystal', choiceB: '✨ Listen to the whispers', nextA: 4, nextB: 3 },
  { prompt: 'You found treasure! The forest celebrates! 🎉', choiceA: '🏠 Return home', choiceB: '🗺️ Explore more', nextA: 5, nextB: 5 },
  { prompt: 'Ancient wisdom fills your mind. You are enlightened! 🌟', choiceA: '🏠 Return home', choiceB: '🗺️ Explore more', nextA: 5, nextB: 5 },
]

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.sti-camera-prompt') as HTMLElement
  const gameStatus = document.getElementById('game-status')!

  setupGameMenu({ musicTrackPicker: false })
  let cameraGranted = false, activeBodies: MotionBody[] = []
  let app: Application | null = null, gameRunning = false, sceneIndex = 0, lastSelectTime = 0
  let gameLoopCallback: (() => void) | null = null

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) { startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies }); cameraPrompt.textContent = 'Camera access granted! Lean left or right to choose, raise hand to confirm!' }
  else { cameraPrompt.textContent = 'Camera not available. Click left or right to choose.' }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  async function enterGame() {
    ensureAudioUnlocked(); showScreen('game-screen'); gameRunning = true; sceneIndex = 0; lastSelectTime = 0
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100))))
    const rect = pixiStage.getBoundingClientRect()
    app = await initStage(pixiStage, Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)))
    if (!app) return

    pixiStage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!app || !gameRunning) return
      const pr = pixiStage.getBoundingClientRect()
      const tx = e.clientX - pr.left; const tw = app!.screen.width
      chooseSide(tx < tw / 2 ? 'A' : 'B')
    })

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)
    gameLoopCallback = () => {
      const texts: Text[] = []
      if (!app || !gameRunning) return
      const sw = app.screen.width, sh = app.screen.height, now = performance.now()
      const scene = STORY[sceneIndex]
      const gfx = new Graphics()
      gfx.rect(0, 0, sw, sh).fill({ color: C.bg })
      // Path
      gfx.roundRect(sw * 0.1, sh * 0.2, sw * 0.8, sh * 0.15, 12).fill({ color: C.path })
      // Scene prompt
      const prompt = new Text({ text: scene.prompt, style: { fill: C.text, fontSize: Math.min(22, sw * 0.04), fontFamily: 'system-ui', wordWrapWidth: sw * 0.8, wordWrap: true } })
      prompt.anchor.set(0.5, 0.5); prompt.position.set(sw / 2, sh * 0.27)
      texts.push(prompt)
      // Choice A (left)
      const aBox = gfx.roundRect(sw * 0.08, sh * 0.48, sw * 0.38, sh * 0.2, 10).fill({ color: C.choiceA, alpha: 0.5 })
      const aText = new Text({ text: scene.choiceA, style: { fill: C.text, fontSize: Math.min(16, sw * 0.03), fontFamily: 'system-ui', wordWrapWidth: sw * 0.34, wordWrap: true } })
      aText.anchor.set(0.5, 0.5); aText.position.set(sw * 0.27, sh * 0.58); texts.push(aText)
      // Choice B (right)
      gfx.roundRect(sw * 0.54, sh * 0.48, sw * 0.38, sh * 0.2, 10).fill({ color: C.choiceB, alpha: 0.5 })
      const bText = new Text({ text: scene.choiceB, style: { fill: C.text, fontSize: Math.min(16, sw * 0.03), fontFamily: 'system-ui', wordWrapWidth: sw * 0.34, wordWrap: true } })
      bText.anchor.set(0.5, 0.5); bText.position.set(sw * 0.73, sh * 0.58); texts.push(bText)
      // Lean label
      const leanLabel = new Text({ text: '← Lean left or right →', style: { fill: C.accent, fontSize: 14, fontFamily: 'system-ui' } })
      leanLabel.anchor.set(0.5, 0); leanLabel.position.set(sw / 2, sh * 0.44); texts.push(leanLabel)

      // Hand tracking
      const body = cameraGranted ? activeBodies[0] : null
      if (body) {
        const hx = (1 - body.normalizedX) * sw, hy = body.normalizedY * sh
        gfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
        gfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })
        // Highlight choice
        if (hx < sw / 2) {
          gfx.roundRect(sw * 0.08, sh * 0.48, sw * 0.38, sh * 0.2, 10).stroke({ color: C.hand, width: 3 })
        } else {
          gfx.roundRect(sw * 0.54, sh * 0.48, sw * 0.38, sh * 0.2, 10).stroke({ color: C.hand, width: 3 })
        }
        if (body.armsUp && now - lastSelectTime > 1000) {
          chooseSide(hx < sw / 2 ? 'A' : 'B')
        }
      }
      app.stage.removeChildren()
      app.stage.addChild(gfx)
      for (const t of texts) app.stage.addChild(t)
    }
    app.ticker.add(gameLoopCallback)
  }

  function chooseSide(side: 'A' | 'B') {
    const scene = STORY[sceneIndex]; sfxSelect()
    const nextIndex = side === 'A' ? scene.nextA : scene.nextB
    if (nextIndex >= STORY.length) { showEndScreen(); return }
    sceneIndex = nextIndex; lastSelectTime = performance.now()
    announceAction(`Chose: ${side === 'A' ? scene.choiceA : scene.choiceB}`)
  }

  function showEndScreen() {
    gameRunning = false
    if (gameLoopCallback && app) { app.ticker.remove(gameLoopCallback); gameLoopCallback = null }
    stopMotionTracking(); showScreen('end-screen'); sfxCorrect()
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