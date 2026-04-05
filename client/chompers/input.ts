export interface InputCallbacks {
  onSelectAnswer: (itemId: string) => void
  onOpenSettings: () => void
}

let pointerHandler: ((event: PointerEvent) => void) | null = null
let keydownHandler: ((event: KeyboardEvent) => void) | null = null
let gamepadHandle: number | null = null
let lastGamepadAction = 0

function getActiveSceneItems(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('.scene-item:not([disabled]):not([aria-hidden="true"])'),
  )
}

function findNearestInDirection(
  current: HTMLElement,
  candidates: HTMLElement[],
  direction: string,
): HTMLElement | null {
  const currentRect = current.getBoundingClientRect()
  const cx = currentRect.left + currentRect.width / 2
  const cy = currentRect.top + currentRect.height / 2

  let best: HTMLElement | null = null
  let bestDist = Infinity

  for (const candidate of candidates) {
    if (candidate === current) continue
    const rect = candidate.getBoundingClientRect()
    const px = rect.left + rect.width / 2
    const py = rect.top + rect.height / 2
    const dx = px - cx
    const dy = py - cy

    let inDirection = false
    switch (direction) {
      case 'ArrowUp': inDirection = dy < -10; break
      case 'ArrowDown': inDirection = dy > 10; break
      case 'ArrowLeft': inDirection = dx < -10; break
      case 'ArrowRight': inDirection = dx > 10; break
    }

    if (!inDirection) continue
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }

  return best
}

function getFocusedItem(): HTMLElement | null {
  const focused = document.activeElement as HTMLElement | null
  if (focused?.classList.contains('scene-item')) return focused
  return null
}

export function moveFocusToFirstItem(): void {
  const first = document.querySelector<HTMLElement>('.scene-item:not([disabled])')
  if (first) first.focus()
}

export function setupInput(callbacks: InputCallbacks): void {
  pointerHandler = (event: PointerEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-item-id]')
    if (target && !target.disabled) {
      const itemId = target.dataset.itemId
      if (itemId) callbacks.onSelectAnswer(itemId)
    }
  }
  document.addEventListener('pointerup', pointerHandler)

  keydownHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      callbacks.onOpenSettings()
      return
    }

    const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (arrows.includes(event.key)) {
      event.preventDefault()
      const items = getActiveSceneItems()
      if (items.length <= 1) return

      const focused = getFocusedItem()
      if (!focused) {
        moveFocusToFirstItem()
        return
      }

      const nearest = findNearestInDirection(focused, items, event.key)
      if (nearest) {
        focused.tabIndex = -1
        nearest.tabIndex = 0
        nearest.focus()
      }
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      const focused = getFocusedItem()
      if (focused) {
        event.preventDefault()
        const itemId = focused.dataset.itemId
        if (itemId) callbacks.onSelectAnswer(itemId)
      }
    }
  }
  document.addEventListener('keydown', keydownHandler)

  let prevDpadUp = false
  let prevDpadDown = false
  let prevDpadLeft = false
  let prevDpadRight = false
  let prevBtnA = false
  let prevBtnStart = false

  function pollGamepad(): void {
    const pads = navigator.getGamepads?.()
    const pad = pads ? pads[0] : null

    if (pad) {
      const now = Date.now()
      const debounce = 200

      const dpadUp = pad.buttons[12]?.pressed ?? false
      const dpadDown = pad.buttons[13]?.pressed ?? false
      const dpadLeft = pad.buttons[14]?.pressed ?? false
      const dpadRight = pad.buttons[15]?.pressed ?? false
      const btnA = pad.buttons[0]?.pressed ?? false
      const btnStart = pad.buttons[9]?.pressed ?? false
      const axis0 = pad.axes[0] ?? 0
      const axis1 = pad.axes[1] ?? 0

      if (now - lastGamepadAction >= debounce) {
        let direction: string | null = null

        if (dpadUp && !prevDpadUp) direction = 'ArrowUp'
        else if (dpadDown && !prevDpadDown) direction = 'ArrowDown'
        else if (dpadLeft && !prevDpadLeft) direction = 'ArrowLeft'
        else if (dpadRight && !prevDpadRight) direction = 'ArrowRight'
        else if (axis1 < -0.5) direction = 'ArrowUp'
        else if (axis1 > 0.5) direction = 'ArrowDown'
        else if (axis0 < -0.5) direction = 'ArrowLeft'
        else if (axis0 > 0.5) direction = 'ArrowRight'

        if (direction) {
          lastGamepadAction = now
          const items = getActiveSceneItems()
          const focused = getFocusedItem() ?? items[0]
          if (focused && items.length > 1) {
            const nearest = findNearestInDirection(focused, items, direction)
            if (nearest) {
              focused.tabIndex = -1
              nearest.tabIndex = 0
              nearest.focus()
            }
          }
        }

        if (btnA && !prevBtnA) {
          lastGamepadAction = now
          const focused = getFocusedItem()
          if (focused) {
            const itemId = focused.dataset.itemId
            if (itemId) callbacks.onSelectAnswer(itemId)
          }
        }

        if (btnStart && !prevBtnStart) {
          lastGamepadAction = now
          callbacks.onOpenSettings()
        }
      }

      prevDpadUp = dpadUp
      prevDpadDown = dpadDown
      prevDpadLeft = dpadLeft
      prevDpadRight = dpadRight
      prevBtnA = btnA
      prevBtnStart = btnStart
    }

    gamepadHandle = requestAnimationFrame(pollGamepad)
  }

  gamepadHandle = requestAnimationFrame(pollGamepad)
}

export function teardownInput(): void {
  if (pointerHandler) {
    document.removeEventListener('pointerup', pointerHandler)
    pointerHandler = null
  }

  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }

  if (gamepadHandle !== null) {
    cancelAnimationFrame(gamepadHandle)
    gamepadHandle = null
  }
}
