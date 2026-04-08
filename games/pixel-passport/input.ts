import { DESTINATION_IDS, type DestinationId, type GameState, type NavigationDirection } from './types.js'

declare global {
  interface Window {
    __settingsToggle?: () => void
  }
}

export interface InputCallbacks {
  onStartExplore: () => void
  onSelectDestination: (destinationId: DestinationId) => void
  onAdvanceFact: () => void
  onContinueMemory: () => void
  onEnterRoom: () => void
  onExitRoom: () => void
  onNavigateGlobe: (direction: NavigationDirection) => void
}

function isModalOpen(): boolean {
  const modal = document.getElementById('settings-modal')
  return modal ? !modal.hasAttribute('hidden') : false
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
}

function currentSelectedDestination(state: GameState): DestinationId {
  return DESTINATION_IDS[state.globeSelectedIndex] ?? DESTINATION_IDS[0]
}

export function setupInput(getState: () => GameState, callbacks: InputCallbacks): void {
  document.getElementById('start-explore-btn')?.addEventListener('click', callbacks.onStartExplore)
  document.getElementById('globe-room-btn')?.addEventListener('click', callbacks.onEnterRoom)
  document.getElementById('room-back-btn')?.addEventListener('click', callbacks.onExitRoom)
  document.getElementById('explore-next-btn')?.addEventListener('click', callbacks.onAdvanceFact)
  document.getElementById('memory-continue-btn')?.addEventListener('click', callbacks.onContinueMemory)

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-destination-id]')) {
    button.addEventListener('click', () => {
      const destinationId = button.dataset.destinationId as DestinationId | undefined
      if (!destinationId) return

      const state = getState()
      if (state.phase === 'globe') {
        callbacks.onSelectDestination(destinationId)
      }
    })
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isModalOpen()) {
      event.preventDefault()
      window.__settingsToggle?.()
      return
    }

    if (isModalOpen()) return

    const state = getState()
    const inGlobe = state.phase === 'globe'
    const interactiveTarget = isInteractiveTarget(event.target)

    if (inGlobe && (event.key === 'ArrowRight' || event.key === 'ArrowDown')) {
      event.preventDefault()
      callbacks.onNavigateGlobe('next')
      return
    }

    if (inGlobe && (event.key === 'ArrowLeft' || event.key === 'ArrowUp')) {
      event.preventDefault()
      callbacks.onNavigateGlobe('previous')
      return
    }

    if ((event.key === 'Enter' || event.key === ' ') && !interactiveTarget) {
      if (state.phase === 'title') {
        event.preventDefault()
        callbacks.onStartExplore()
        return
      }

      if (state.phase === 'globe') {
        event.preventDefault()
        callbacks.onSelectDestination(currentSelectedDestination(state))
        return
      }

      if (state.phase === 'explore') {
        event.preventDefault()
        callbacks.onAdvanceFact()
        return
      }

      if (state.phase === 'memory-collect') {
        event.preventDefault()
        callbacks.onContinueMemory()
        return
      }

      if (state.phase === 'room') {
        event.preventDefault()
        callbacks.onExitRoom()
        return
      }
    }
  })

  let previousActionPressed = false
  let previousLeftPressed = false
  let previousRightPressed = false
  let previousStartPressed = false

  const pollGamepad = (): void => {
    const state = getState()
    const pad = navigator.getGamepads().find((gamepad) => gamepad !== null)
    const leftPressed = Boolean(pad?.buttons[14]?.pressed) || Boolean((pad?.axes[0] ?? 0) < -0.5)
    const rightPressed = Boolean(pad?.buttons[15]?.pressed) || Boolean((pad?.axes[0] ?? 0) > 0.5)
    const actionPressed = Boolean(pad?.buttons[0]?.pressed)
    const startPressed = Boolean(pad?.buttons[9]?.pressed)

    if (state.phase === 'globe' && rightPressed && !previousRightPressed) {
      callbacks.onNavigateGlobe('next')
    }

    if (state.phase === 'globe' && leftPressed && !previousLeftPressed) {
      callbacks.onNavigateGlobe('previous')
    }

    if (actionPressed && !previousActionPressed && !isModalOpen()) {
      if (state.phase === 'title') {
        callbacks.onStartExplore()
      } else if (state.phase === 'globe') {
        callbacks.onSelectDestination(currentSelectedDestination(state))
      } else if (state.phase === 'explore') {
        callbacks.onAdvanceFact()
      } else if (state.phase === 'memory-collect') {
        callbacks.onContinueMemory()
      } else if (state.phase === 'room') {
        callbacks.onExitRoom()
      }
    }

    if (startPressed && !previousStartPressed) {
      window.__settingsToggle?.()
    }

    previousActionPressed = actionPressed
    previousLeftPressed = leftPressed
    previousRightPressed = rightPressed
    previousStartPressed = startPressed

    requestAnimationFrame(pollGamepad)
  }

  requestAnimationFrame(pollGamepad)
}