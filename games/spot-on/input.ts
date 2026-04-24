import type { ItemId, SpotId, SpotOnState } from './types.js'

// ── Input callbacks ──────────────────────────────────────────────────────────

export interface SpotOnInputCallbacks {
  onStart?: () => void
  onPickUpItem?: (itemId: ItemId) => void
  onPlaceItem?: (spotId: SpotId) => void
  onDropItem?: () => void
  onNewRoom?: () => void
  onToggleMenu?: () => void
  /** Called to request focus on the nearest empty spot (for keyboard accessibility while carrying) */
  onFocusNearestEmptySpot?: () => void
}

// ── Keyboard input ───────────────────────────────────────────────────────────

function isModalOpen(): boolean {
  const modal = document.getElementById('settings-modal')
  return Boolean(modal && !modal.hidden)
}

function getFocusableItemsAndSpots(): HTMLElement[] {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.room-item:not(.room-item--placed)'))
  const spots = Array.from(document.querySelectorAll<HTMLElement>('.room-spot'))
  return [...items, ...spots].filter((el) => {
    if (!el || el.closest('[hidden]')) return false
    return el.getClientRects().length > 0
  })
}

function getEmptySpots(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.room-spot:not(.room-spot--occupied)'))
    .filter((el) => el.getClientRects().length > 0)
}

function moveFocusToNext(elements: HTMLElement[], direction: 'forward' | 'backward'): void {
  const active = document.activeElement
  if (!active || !(active instanceof HTMLElement)) {
    if (elements.length > 0) {
      elements[0].focus({ preventScroll: true })
    }
    return
  }

  const currentIndex = elements.indexOf(active)
  if (currentIndex === -1) {
    elements[0]?.focus({ preventScroll: true })
    return
  }

  if (direction === 'forward') {
    const next = elements[(currentIndex + 1) % elements.length]
    next?.focus({ preventScroll: true })
  } else {
    const prev = elements[(currentIndex - 1 + elements.length) % elements.length]
    prev?.focus({ preventScroll: true })
  }
}

function focusNearestEmptySpot(): void {
  const emptySpots = getEmptySpots()
  if (emptySpots.length > 0) {
    emptySpots[0].focus({ preventScroll: true })
  }
}

let keydownHandler: ((event: KeyboardEvent) => void) | null = null
let itemClickHandler: ((event: Event) => void) | null = null
let spotClickHandler: ((event: Event) => void) | null = null
let newRoomClickHandler: (() => void) | null = null
let startClickHandler: (() => void) | null = null
let gamepadTimer: ReturnType<typeof setInterval> | null = null

// We need read-only access to state for carrying logic
let currentState: SpotOnState | null = null

export function updateSpotOnInputState(state: SpotOnState): void {
  currentState = state
}

export function setupSpotOnInput(callbacks: SpotOnInputCallbacks = {}): void {
  cleanupSpotOnInput()

  keydownHandler = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return
    if (event.ctrlKey || event.altKey || event.metaKey) return

    const target = event.target as Element | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

    if (event.key === 'Escape') {
      event.preventDefault()
      callbacks.onDropItem?.()
      return
    }

    if (isModalOpen()) return

    if (event.key === 'Enter' || event.key === ' ') {
      if (target instanceof HTMLElement) {
        const itemId = target.dataset?.itemId
        if (itemId) {
          event.preventDefault()
          // If carrying this item, drop it
          if (currentState?.phase === 'carrying' && currentState.carriedItemId === itemId) {
            callbacks.onDropItem?.()
            return
          }
          callbacks.onPickUpItem?.(itemId as ItemId)
          return
        }
        const spotId = target.dataset?.spotId
        if (spotId) {
          event.preventDefault()
          callbacks.onPlaceItem?.(spotId as SpotId)
          return
        }
      }
    }

    if (event.key === 'Tab') {
      const elements = getFocusableItemsAndSpots()
      moveFocusToNext(elements, event.shiftKey ? 'backward' : 'forward')
      event.preventDefault()
      return
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      const elements = getFocusableItemsAndSpots()
      moveFocusToNext(elements, 'forward')
      event.preventDefault()
      return
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      const elements = getFocusableItemsAndSpots()
      moveFocusToNext(elements, 'backward')
      event.preventDefault()
      return
    }
  }

  document.addEventListener('keydown', keydownHandler)

  // Item click handling — detect carrying state
  itemClickHandler = (event: Event): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest<HTMLButtonElement>('.room-item')
    const itemId = button?.dataset.itemId
    if (!itemId) return

    // If carrying the clicked item, drop it
    if (currentState?.phase === 'carrying' && currentState.carriedItemId === itemId) {
      callbacks.onDropItem?.()
      return
    }

    callbacks.onPickUpItem?.(itemId as ItemId)
    // After picking up, move focus to nearest empty spot
    requestAnimationFrame(() => {
      focusNearestEmptySpot()
    })
  }

  // Spot click handling
  spotClickHandler = (event: Event): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const div = target.closest<HTMLElement>('.room-spot')
    const spotId = div?.dataset.spotId
    if (!spotId) return
    callbacks.onPlaceItem?.(spotId as SpotId)
  }

  document.addEventListener('click', itemClickHandler)
  document.addEventListener('click', spotClickHandler)

  // Gamepad polling (basic)
  const GAMEPAD_POLL_INTERVAL = 200
  gamepadTimer = setInterval(() => {
    const gamepads = navigator.getGamepads?.() ?? []
    for (const gamepad of gamepads) {
      if (!gamepad) continue

      // A button (button 0)
      if (gamepad.buttons[0]?.pressed) {
        const active = document.activeElement
        if (active instanceof HTMLElement) {
          active.click()
        }
      }

      // Start button (button 9) — toggle menu
      if (gamepad.buttons[9]?.pressed) {
        callbacks.onToggleMenu?.()
      }

      break
    }
  }, GAMEPAD_POLL_INTERVAL)
}

export function cleanupSpotOnInput(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }

  if (itemClickHandler) {
    document.removeEventListener('click', itemClickHandler)
    itemClickHandler = null
  }

  if (spotClickHandler) {
    document.removeEventListener('click', spotClickHandler)
    spotClickHandler = null
  }

  if (newRoomClickHandler) {
    const btn = document.getElementById('new-room-btn')
    if (btn) btn.removeEventListener('click', newRoomClickHandler)
    newRoomClickHandler = null
  }

  if (startClickHandler) {
    const btn = document.getElementById('start-btn')
    if (btn) btn.removeEventListener('click', startClickHandler)
    startClickHandler = null
  }

  if (gamepadTimer !== null) {
    clearInterval(gamepadTimer)
    gamepadTimer = null
  }

  currentState = null
}