import { getGameAudioBuses } from '../../client/game-audio.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { showScreen } from '../../client/game-screens.js'
import { isReducedMotion } from '../../client/game-animations.js'
import { getSfxEnabled } from '../../client/preferences.js'

import { announceAllAboard, announceHotspotActivated, announceTrainChange, focusStartButton, focusTrainSwitcher } from './accessibility.js'
import { animateAllAboard, animateHotspotPress, animateTrainArrival, animateTrainSwitch, resetTrainAnimationState } from './animations.js'
import { trainSoundsAttribution } from './attributions.js'
import { cleanupTrainSoundsInput, setupTrainSoundsInput } from './input.js'
import { initTrainSoundsRenderer, type TrainSoundsRenderer } from './renderer.js'
import { ensureTrainSoundsAudioUnlocked, playTrainHotspotSound, preloadTrainSoundSamples } from './sounds.js'
import {
  allAboard,
  clearDeparting,
  createInitialTrainSoundsState,
  getCurrentPreset,
  resetTrainSoundsState,
  selectHotspot,
  selectNextTrain,
  selectPreviousTrain,
} from './state.js'
import type { TrainHotspotId, TrainSoundsState } from './types.js'

type ScreenId = 'start-screen' | 'game-screen'

interface RuntimeRefs {
  readonly startButton: HTMLButtonElement
  readonly creditsMount: HTMLElement | null
  readonly screens: Record<ScreenId, HTMLElement>
}

const SCREEN_IDS: readonly ScreenId[] = ['start-screen', 'game-screen']
const HOTSPOT_STATE_CLEAR_MS = 220

let runtimeRefs: RuntimeRefs | null = null
let renderer: TrainSoundsRenderer | null = null
let state: TrainSoundsState = createInitialTrainSoundsState()
let settingsModal: ReturnType<typeof setupGameMenu> = { open() {}, close() {}, toggle() {} }
let hotspotStateTimer: number | null = null
let hotspotActivationToken = 0
let initialized = false
let allAboardInProgress = false

let startClickHandler: (() => void) | null = null
let allAboardClickHandler: (() => void) | null = null
let hotspotClickHandler: ((event: Event) => void) | null = null
let hotspotFocusHandler: ((event: FocusEvent) => void) | null = null
let restartHandler: (() => void) | null = null
let sfxChangeHandler: ((event: Event) => void) | null = null

function byId<T extends HTMLElement>(id: string): T | null {
  const element = document.getElementById(id)
  return element instanceof HTMLElement ? (element as T) : null
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = byId<T>(id)
  if (!element) {
    throw new Error(`Train Sounds runtime could not find #${id}.`)
  }
  return element
}

function collectRuntimeRefs(): RuntimeRefs {
  return {
    startButton: requireElement<HTMLButtonElement>('start-btn'),
    creditsMount: byId<HTMLElement>('train-credits'),
    screens: {
      'start-screen': requireElement<HTMLElement>('start-screen'),
      'game-screen': requireElement<HTMLElement>('game-screen'),
    },
  }
}

function clearHotspotStateTimer(): void {
  if (hotspotStateTimer !== null) {
    window.clearTimeout(hotspotStateTimer)
    hotspotStateTimer = null
  }
}

function clearTransientHotspotState(): void {
  clearHotspotStateTimer()

  if (state.pressedHotspotId !== null) {
    state = {
      ...state,
      pressedHotspotId: null,
    }
  }
}

function scheduleHotspotStateClear(hotspotId: TrainHotspotId): void {
  clearHotspotStateTimer()

  hotspotStateTimer = window.setTimeout(() => {
    hotspotStateTimer = null

    if (state.pressedHotspotId !== hotspotId) {
      return
    }

    state = {
      ...state,
      pressedHotspotId: null,
    }
  }, HOTSPOT_STATE_CLEAR_MS)
}

function setActiveScreen(screenId: ScreenId): void {
  if (!runtimeRefs) return

  showScreen(screenId, [...SCREEN_IDS])

  for (const id of SCREEN_IDS) {
    const screen = runtimeRefs.screens[id]
    const isActive = id === screenId
    screen.classList.toggle('active', isActive)
    screen.classList.remove('leaving')
  }
}

function ensureAudioReady(): void {
  getGameAudioBuses('train-sounds')
  ensureTrainSoundsAudioUnlocked()
}

function warmAudioOnFirstInteraction(): void {
  const onFirstPointerDown = (): void => {
    ensureAudioReady()
  }

  const onFirstKeyDown = (): void => {
    ensureAudioReady()
  }

  document.addEventListener('pointerdown', onFirstPointerDown, { once: true, passive: true })
  document.addEventListener('keydown', onFirstKeyDown, { once: true })
}

function renderCurrentPreset(): void {
  renderer?.render(state)
}

function populateCredits(): void {
  const mount = runtimeRefs?.creditsMount
  if (!mount) return

  const list = document.createElement('ul')
  list.className = 'train-credits-list'
  list.style.display = 'grid'
  list.style.gap = '0.85rem'
  list.style.margin = '0'
  list.style.paddingLeft = '1.1rem'

  for (const entry of trainSoundsAttribution.entries) {
    const item = document.createElement('li')
    item.style.lineHeight = '1.45'

    const title = document.createElement('strong')
    title.textContent = entry.title
    item.appendChild(title)
    item.appendChild(document.createTextNode(` by ${entry.creator}. `))

    if (entry.sourceUrl) {
      const sourceLink = document.createElement('a')
      sourceLink.href = entry.sourceUrl
      sourceLink.rel = 'noreferrer'
      sourceLink.target = '_blank'
      sourceLink.textContent = entry.source
      item.appendChild(sourceLink)
    } else {
      item.appendChild(document.createTextNode(entry.source))
    }

    item.appendChild(document.createTextNode('. '))

    if (entry.licenseUrl) {
      const licenseLink = document.createElement('a')
      licenseLink.href = entry.licenseUrl
      licenseLink.rel = 'noreferrer'
      licenseLink.target = '_blank'
      licenseLink.textContent = entry.license
      item.appendChild(licenseLink)
    } else {
      item.appendChild(document.createTextNode(entry.license))
    }

    if (entry.modifications) {
      item.appendChild(document.createTextNode(`. ${entry.modifications}`))
    }

    list.appendChild(item)
  }

  mount.replaceChildren(list)
}

function retryHotspotSoundIfNeeded(presetId: TrainSoundsState['currentPresetId'], hotspotId: TrainHotspotId): void {
  const activationToken = hotspotActivationToken

  void preloadTrainSoundSamples().then(() => {
    if (activationToken !== hotspotActivationToken) {
      return
    }

    if (!getSfxEnabled()) {
      return
    }

    if (state.currentPresetId !== presetId) {
      return
    }

    playTrainHotspotSound(presetId, hotspotId)
  })
}

function switchTrain(
  direction: 'previous' | 'next',
  triggerButton: HTMLButtonElement | null,
): void {
  if (!renderer) return

  hotspotActivationToken += 1
  clearTransientHotspotState()
  state = direction === 'previous' ? selectPreviousTrain(state) : selectNextTrain(state)
  renderCurrentPreset()
  animateTrainSwitch(renderer.scene, renderer.trainName, triggerButton)
  announceTrainChange(getCurrentPreset(state).name)
}

function findSignalHotspotId(presetId: TrainSoundsState['currentPresetId']): TrainHotspotId | null {
  const preset = getCurrentPreset({ ...state, currentPresetId: presetId })
  const signalHotspot = preset.hotspots.find((h) => h.category === 'signal')
  return signalHotspot?.id ?? null
}

function handleAllAboard(): void {
  if (!renderer || allAboardInProgress) return

  const currentPreset = getCurrentPreset(state)
  const signalHotspotId = findSignalHotspotId(state.currentPresetId)
  const currentTrainName = currentPreset.name

  // Play current train's signal sound (whistle/horn)
  if (signalHotspotId && getSfxEnabled()) {
    ensureAudioReady()
    playTrainHotspotSound(state.currentPresetId, signalHotspotId)
  }

  hotspotActivationToken += 1
  clearTransientHotspotState()

  if (isReducedMotion()) {
    // No animation: immediately switch trains
    state = allAboard(state)
    state = clearDeparting(state)
    renderCurrentPreset()
    const nextTrainName = getCurrentPreset(state).name
    announceAllAboard(currentTrainName, nextTrainName)
    return
  }

  allAboardInProgress = true

  // Animate departure then arrival
  animateAllAboard(renderer.scene, renderer.displayFrame).then(() => {
    state = allAboard(state)
    state = clearDeparting(state)
    renderCurrentPreset()

    const nextTrainName = getCurrentPreset(state).name
    announceAllAboard(currentTrainName, nextTrainName)

    return animateTrainArrival(renderer!.scene, renderer!.displayFrame)
  }).finally(() => {
    allAboardInProgress = false
  })
}

function activateHotspot(hotspotId: TrainHotspotId): void {
  if (!renderer) return

  const preset = getCurrentPreset(state)
  const hotspot = preset.hotspots.find((candidate) => candidate.id === hotspotId)
  if (!hotspot) {
    return
  }

  hotspotActivationToken += 1
  ensureAudioReady()
  clearTransientHotspotState()
  state = selectHotspot(state, hotspotId)

  const hotspotButton = renderer.getHotspotButton(hotspotId)
  animateHotspotPress(renderer.scene, hotspotButton)

  if (getSfxEnabled() && !playTrainHotspotSound(preset.id, hotspotId)) {
    retryHotspotSoundIfNeeded(preset.id, hotspotId)
  }

  announceHotspotActivated(preset.name, hotspot.label)
  scheduleHotspotStateClear(hotspotId)
}

function enterGame(): void {
  if (!renderer) return

  ensureAudioReady()
  clearTransientHotspotState()
  renderCurrentPreset()
  setActiveScreen('game-screen')
  renderer.syncLayout()
  announceTrainChange(getCurrentPreset(state).name)
  focusTrainSwitcher(240)
}

function returnToStart(): void {
  if (!renderer) return

  hotspotActivationToken += 1
  clearTransientHotspotState()
  settingsModal.close()
  resetTrainAnimationState(renderer.scene, renderer.trainName)
  state = resetTrainSoundsState()
  renderCurrentPreset()
  setActiveScreen('start-screen')
  focusStartButton(220)
}

function bindRuntimeEvents(): void {
  if (!runtimeRefs || !renderer) return

  startClickHandler = (): void => {
    enterGame()
  }
  runtimeRefs.startButton.addEventListener('click', startClickHandler)

  allAboardClickHandler = (): void => {
    handleAllAboard()
  }
  renderer.allAboardButton.addEventListener('click', allAboardClickHandler)

  hotspotClickHandler = (event: Event): void => {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    const button = target.closest<HTMLButtonElement>('.train-hotspot')
    const hotspotId = button?.dataset.hotspotId as TrainHotspotId | undefined

    if (!button || !hotspotId) {
      return
    }

    activateHotspot(hotspotId)
  }
  renderer.hotspots.addEventListener('click', hotspotClickHandler)

  hotspotFocusHandler = (event: FocusEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    const button = target.closest<HTMLButtonElement>('.train-hotspot')
    const hotspotId = button?.dataset.hotspotId as TrainHotspotId | undefined

    if (!button || !hotspotId) {
      return
    }

    const preset = getCurrentPreset(state)
    if (!preset.hotspots.some((hotspot) => hotspot.id === hotspotId)) {
      return
    }

    state = {
      ...state,
      focusedHotspotId: hotspotId,
    }
  }
  renderer.hotspots.addEventListener('focusin', hotspotFocusHandler)

  restartHandler = (): void => {
    returnToStart()
  }
  document.addEventListener('restart', restartHandler)

  sfxChangeHandler = (event: Event): void => {
    const detail = (event as CustomEvent<{ enabled: boolean }>).detail
    if (detail?.enabled) {
      ensureAudioReady()
    }
  }
  window.addEventListener('reveries:sfx-change', sfxChangeHandler)
}

function unbindRuntimeEvents(): void {
  if (runtimeRefs && startClickHandler) {
    runtimeRefs.startButton.removeEventListener('click', startClickHandler)
  }

  if (renderer && allAboardClickHandler) {
    renderer.allAboardButton.removeEventListener('click', allAboardClickHandler)
  }

  if (renderer && hotspotClickHandler) {
    renderer.hotspots.removeEventListener('click', hotspotClickHandler)
  }

  if (renderer && hotspotFocusHandler) {
    renderer.hotspots.removeEventListener('focusin', hotspotFocusHandler)
  }

  if (restartHandler) {
    document.removeEventListener('restart', restartHandler)
  }

  if (sfxChangeHandler) {
    window.removeEventListener('reveries:sfx-change', sfxChangeHandler)
  }

  startClickHandler = null
  allAboardClickHandler = null
  hotspotClickHandler = null
  hotspotFocusHandler = null
  restartHandler = null
  sfxChangeHandler = null
}

function init(): void {
  if (initialized) {
    return
  }

  initialized = true
  runtimeRefs = collectRuntimeRefs()
  renderer = initTrainSoundsRenderer()
  settingsModal = setupGameMenu({ musicTrackPicker: false })
  state = createInitialTrainSoundsState()
  resetTrainAnimationState(renderer.scene, renderer.trainName)
  renderCurrentPreset()
  populateCredits()
  bindRuntimeEvents()
  setupTrainSoundsInput({
    onStart: enterGame,
    onPreviousTrain: () => switchTrain('previous', null),
    onNextTrain: () => switchTrain('next', null),
    onAllAboard: () => handleAllAboard(),
    onToggleMenu: () => settingsModal.toggle(),
  })
  warmAudioOnFirstInteraction()
  setActiveScreen('start-screen')
  focusStartButton(0)
}

export function teardownTrainSounds(): void {
  if (!initialized) {
    return
  }

  initialized = false
  cleanupTrainSoundsInput()
  unbindRuntimeEvents()
  clearTransientHotspotState()

  if (renderer) {
    resetTrainAnimationState(renderer.scene, renderer.trainName)
    renderer.dispose()
  }

  renderer = null
  runtimeRefs = null
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}