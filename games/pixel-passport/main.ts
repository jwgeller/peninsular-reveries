import { bindReduceMotionToggle, bindMusicToggle, bindSfxToggle } from '../../client/preferences.js'
import { setupTabbedModal } from '../../client/modal.js'
import {
  announceDestination,
  announceFact,
  announceMarkerSelection,
  announceMemory,
  announcePhase,
  announceRoom,
  announceTravel,
  moveFocusAfterTransition,
} from './accessibility.js'
import { animateClass, pulseElement } from './animations.js'
import { DESTINATIONS, getDestination, getTransportType } from './destinations.js'
import { setupInput, type InputCallbacks } from './input.js'
import { focusSelectedMarker, renderGame, syncScreenForState } from './renderer.js'
import {
  advanceFact,
  advanceTravelProgress,
  arriveAtDestination,
  collectMemory,
  createInitialState,
  enterRoom,
  exitRoom,
  finishExplore,
  navigateGlobe,
  prepareTravel,
  returnToGlobe,
  setSelectedDestinationIndex,
  startExploreMode,
} from './state.js'
import {
  ensureAudioUnlocked,
  sfxArrive,
  sfxButton,
  sfxMarkerMove,
  sfxMemoryCollect,
  sfxPipSpeak,
  sfxTravelStart,
  startTravelLoop,
  stopTravelLoop,
} from './sounds.js'
import type { DestinationId, GameProgress, GameState, NavigationDirection } from './types.js'

const PROGRESS_STORAGE_KEY = 'pixel-passport-progress'

let state: GameState = createInitialState(loadProgress())
let lastFrame = performance.now()

function loadProgress(): GameProgress {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!stored) {
      return { collectedMemories: [] }
    }

    const parsed = JSON.parse(stored) as Partial<GameProgress>
    return {
      collectedMemories: Array.isArray(parsed.collectedMemories) ? parsed.collectedMemories as DestinationId[] : [],
    }
  } catch {
    return { collectedMemories: [] }
  }
}

function saveProgress(): void {
  const progress: GameProgress = {
    collectedMemories: [...state.collectedMemories],
  }
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
}

function getState(): GameState {
  return state
}

function element<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

function animateStateChange(previousState: GameState | undefined, nextState: GameState): void {
  if (!previousState) {
    return
  }

  if (nextState.phase === 'travel' && previousState.phase !== 'travel') {
    void animateClass(element('travel-stage'), 'travel-stage-reveal', 620)
    void animateClass(element('travel-copy'), 'copy-reveal', 460)
  }

  if (
    nextState.phase === 'explore'
    && (
      previousState.phase !== 'explore'
      || previousState.targetDestination !== nextState.targetDestination
      || previousState.factIndex !== nextState.factIndex
    )
  ) {
    void animateClass(element('explore-scene'), 'scene-reveal', 620)
    void animateClass(element('explore-guide-text'), 'copy-reveal', 460)
    void animateClass(element('explore-progress'), 'pill-reveal', 420)
  }

  if (
    nextState.phase === 'memory-collect'
    && (
      previousState.phase !== 'memory-collect'
      || previousState.targetDestination !== nextState.targetDestination
      || previousState.memoryWasNew !== nextState.memoryWasNew
    )
  ) {
    void animateClass(element('memory-stage'), 'memory-stage-reveal', 680)
    void animateClass(element('memory-copy'), 'copy-reveal', 460)
  }

  if (nextState.phase === 'room' && previousState.phase !== 'room') {
    void animateClass(element('room-stage'), 'card-settle', 560)
    void animateClass(element('room-copy'), 'copy-reveal', 420)
  }
}

function syncView(previousState?: GameState): void {
  renderGame(state)
  syncScreenForState(state)
  animateStateChange(previousState, state)
}

function selectedDestinationId(): DestinationId {
  return DESTINATIONS[state.globeSelectedIndex]?.id ?? DESTINATIONS[0].id
}

function beginExploreMode(): void {
  ensureAudioUnlocked()
  sfxButton()
  const previousState = state
  state = startExploreMode(state)
  syncView(previousState)
  announcePhase('Spin the globe and pick a place to visit.')
  moveFocusAfterTransition('globe-room-btn', 220)
  focusSelectedMarker()
}

function travelToDestination(destinationId: DestinationId): void {
  const destination = getDestination(destinationId)
  if (!destination) return

  ensureAudioUnlocked()
  const previousState = state
  state = setSelectedDestinationIndex(state, destinationId)
  const origin = getDestination(state.currentLocation)
  const transport = getTransportType(origin, destination)
  state = prepareTravel(state, destinationId, transport)
  syncView(previousState)

  sfxTravelStart(transport)
  startTravelLoop(transport)
  announceTravel(origin?.name ?? 'Home', destination.name, transport)
}

function continueFactSequence(): void {
  const destination = getDestination(state.targetDestination)
  if (!destination) return

  ensureAudioUnlocked()
  sfxButton()

  if (state.factIndex < destination.facts.length - 1) {
    const previousState = state
    state = advanceFact(state, destination.facts.length)
    syncView(previousState)
    sfxPipSpeak()
    announceFact(destination.facts[state.factIndex])
    void pulseElement(element('explore-guide-text'), 'guide-bubble-pulse')
    return
  }

  const previousState = state
  state = finishExplore(state)
  state = collectMemory(state)
  saveProgress()
  syncView(previousState)

  if (state.memoryWasNew) {
    sfxMemoryCollect()
  }

  announceMemory(destination.memoryLabel, state.memoryWasNew)
  moveFocusAfterTransition('memory-continue-btn', 220)
}

function continueMemorySequence(): void {
  ensureAudioUnlocked()
  sfxButton()

  const previousState = state
  state = returnToGlobe(state)
  syncView(previousState)
  announcePhase('Back on the globe. Pick another place to visit.')
  focusSelectedMarker()
}

function openRoom(): void {
  ensureAudioUnlocked()
  sfxButton()
  const previousState = state
  state = enterRoom(state)
  syncView(previousState)
  announceRoom(state.collectedMemories.length)
  moveFocusAfterTransition('room-back-btn', 220)
}

function closeRoom(): void {
  ensureAudioUnlocked()
  sfxButton()
  const previousState = state
  state = exitRoom(state)
  syncView(previousState)
  announcePhase('Back on the globe. Pick a place to visit.')
  focusSelectedMarker()
}

function moveSelection(direction: NavigationDirection): void {
  state = navigateGlobe(state, direction)
  renderGame(state)
  sfxMarkerMove()
  const selectedIcon = document.querySelector<HTMLElement>(
    '#globe-screen .destination-marker.is-selected .destination-marker-icon',
  )
  void pulseElement(selectedIcon, 'marker-pulse', 320)
  announceMarkerSelection(getDestination(selectedDestinationId())?.name ?? 'Destination')
  focusSelectedMarker()
}

const callbacks: InputCallbacks = {
  onStartExplore: beginExploreMode,
  onSelectDestination: travelToDestination,
  onAdvanceFact: continueFactSequence,
  onContinueMemory: continueMemorySequence,
  onEnterRoom: openRoom,
  onExitRoom: closeRoom,
  onNavigateGlobe: moveSelection,
}

function tick(now: number): void {
  const deltaMs = now - lastFrame
  lastFrame = now

  if (state.phase === 'travel') {
    const previousProgress = state.travelProgress
    state = advanceTravelProgress(state, deltaMs)
    renderGame(state)

    if (previousProgress < 1 && state.travelProgress >= 1) {
      stopTravelLoop()
      const previousState = state
      state = arriveAtDestination(state)
      syncView(previousState)
      sfxArrive()

      const destination = getDestination(state.targetDestination)
      if (destination) {
        announceDestination(destination.name, destination.country)
        sfxPipSpeak()
        announceFact(destination.facts[0])
      }

      moveFocusAfterTransition('explore-next-btn', 220)
    }
  }

  requestAnimationFrame(tick)
}

document.addEventListener('restart', () => {
  const previousState = state
  state = returnToGlobe(state)
  syncView(previousState)
  announcePhase('Back on the globe. Pick a place to visit.')
  focusSelectedMarker()
})

const modal = setupTabbedModal('settings-modal')
window.__settingsToggle = modal.toggle
bindMusicToggle('pixel-passport', document.getElementById('music-enabled-toggle') as HTMLInputElement | null, document.getElementById('music-enabled-help') as HTMLElement | null)
bindSfxToggle('pixel-passport', document.getElementById('sfx-enabled-toggle') as HTMLInputElement | null, document.getElementById('sfx-enabled-help') as HTMLElement | null)
bindReduceMotionToggle(
  document.getElementById('reduce-motion-toggle') as HTMLInputElement | null,
  document.getElementById('reduce-motion-help'),
)
setupInput(getState, callbacks)
syncView()
requestAnimationFrame(tick)

if (state.collectedMemories.length > 0) {
  announcePhase('Welcome back. Choose a place or solve a mystery.')
}