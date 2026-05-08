// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, sfxCorrect, sfxWrong, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

const C = { bg: 0x1a1a2e, accent: 0x66bbff, hand: 0x44aaff, letter: 0xffdd44, found: 0x44ff88, wrong: 0xff4444, text: 0xffffff }

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

const WORDS = ['CAT', 'DOG', 'SUN', 'HAT', 'RUN', 'FUN', 'BIG', 'RED', 'CUP', 'MAP']
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.swi-camera-prompt') as HTMLElement
  const gameStatus = document.getElementById('game-status')!

  setupGameMenu({ musicTrackPicker: false })
  let cameraGranted = false, activeBodies: MotionBody[] = []
  let app: Application | null = null, gameRunning = false, gameLoopCallback: (() => void) | null = null
  let currentWord = '', foundLetters: Set<number> = new Set(), score = 0, letterPositions: Array<{ letter: string; x: number; y: number }> = [], lastSelectTime = 0

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) { startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies }); cameraPrompt.textContent = 'Camera access granted! Point at letters to select them and spell the word!' }
  else { cameraPrompt.textContent = 'Camera not available. Click letters to spell the word.' }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  function startRound(): void {
    currentWord = WORDS[Math.floor(Math.random() * WORDS.length)]
    foundLetters = new Set()
    // Scatter letters + decoys
    letterPositions = []
    const allLetters = currentWord.split('').concat(LETTERS.slice(0, 8))
    // Shuffle
    for (let i = allLetters.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]] }
    for (let i = 0; i < allLetters.length; i++) {
      letterPositions.push({ letter: allLetters[i], x: 0.08 + (i % 6) * 0.15, y: 0.35 + Math.floor(i / 6) * 0.18 })
    }
  }

  async function enterGame() {
    ensureAudioUnlocked(); showScreen('game-screen'); gameRunning = true; score = 0; lastSelectTime = 0; startRound()
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100))))
    const rect = pixiStage.getBoundingClientRect()
    app = await initStage(pixiStage, Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)))
    if (!app) return

    pixiStage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!app || !gameRunning) return
      const pr = pixiStage.getBoundingClientRect()
      const tx = e.clientX - pr.left, ty = e.clientY - pr.top
      handleLetterSelect(tx, ty, app.screen.width, app.screen.height)
    })

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)
    gameLoopCallback = () => {
      const texts: Text[] = []
      if (!app || !gameRunning) return
      const sw = app.screen.width, sh = app.screen.height, now = performance.now()
      const gfx = new Graphics()
      gfx.rect(0, 0, sw, sh).fill({ color: C.bg })

      // Word display at top
      const wordDisplay = currentWord.split('').map((ch, i) => foundLetters.has(i) ? ch : '_').join(' ')
      const wordText = new Text({ text: wordDisplay, style: { fill: C.accent, fontSize: 36, fontFamily: 'system-ui', fontWeight: 'bold', letterSpacing: 8 } })
      wordText.anchor.set(0.5, 0); wordText.position.set(sw / 2, 30); texts.push(wordText)

      // Letters scattered
      for (let i = 0; i < letterPositions.length; i++) {
        const lp = letterPositions[i]
        const lx = lp.x * sw, ly = lp.y * sh
        const isTarget = currentWord.includes(lp.letter)
        gfx.circle(lx, ly, 16).fill({ color: isTarget ? C.letter : 0x444466, alpha: 0.7 })
        gfx.circle(lx, ly, 16).stroke({ color: 0x555577, width: 1 })
        const lt = new Text({ text: lp.letter, style: { fill: C.text, fontSize: 14, fontFamily: 'system-ui', fontWeight: 'bold' } })
        lt.anchor.set(0.5, 0.5); lt.position.set(lx, ly); texts.push(lt)
      }

      // Hand tracking
      const body = cameraGranted ? activeBodies[0] : null
      if (body && gameRunning) {
        const hx = (1 - body.normalizedX) * sw, hy = body.normalizedY * sh
        // Highlight nearest letter
        for (const lp of letterPositions) {
          const lx = lp.x * sw, ly = lp.y * sh
          if (Math.hypot(hx - lx, hy - ly) < 25) {
            gfx.circle(lx, ly, 20).stroke({ color: C.hand, width: 3 })
            if (body.armsUp && now - lastSelectTime > 600) {
              handleLetterSelect(hx, hy, sw, sh)
            }
          }
        }
        gfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
        gfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })
      }

      // Score
      const scoreText = new Text({ text: `Score: ${score}`, style: { fill: C.accent, fontSize: 18, fontFamily: 'system-ui' } })
      scoreText.position.set(10, 10); texts.push(scoreText)

      // Win check
      if (foundLetters.size >= currentWord.length) {
        sfxCorrect(); score += 10; startRound()
      }

      app.stage.removeChildren()
      app.stage.addChild(gfx)
      for (const t of texts) app.stage.addChild(t)
    }
    app.ticker.add(gameLoopCallback)
  }

  function handleLetterSelect(tx: number, ty: number, sw: number, sh: number) {
    for (const lp of letterPositions) {
      const lx = lp.x * sw, ly = lp.y * sh
      if (Math.hypot(tx - lx, ty - ly) < 25) {
        // Try to match this letter to the next unfound position in the word
        for (let i = 0; i < currentWord.length; i++) {
          if (!foundLetters.has(i) && currentWord[i] === lp.letter) {
            foundLetters.add(i); sfxCorrect(); announceAction(`Found ${lp.letter}!`); lastSelectTime = performance.now(); return
          }
        }
        sfxWrong(); announceAction(`${lp.letter} is not needed`); lastSelectTime = performance.now(); return
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