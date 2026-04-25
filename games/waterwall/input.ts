import type { WaterwallCellType, WaterwallCoordinate, WaterwallConfig } from './types.js'
import type { CursorEdge } from './sounds.js'

// ── Action types ──────────────────────────────────────────────────────────────

export type WaterwallAction =
  | { readonly type: 'move'; readonly direction: 'up' | 'down' | 'left' | 'right' }
  | { readonly type: 'place' }
  | { readonly type: 'remove' }
  | { readonly type: 'drag-start' }
  | { readonly type: 'drag-extend'; readonly direction: 'up' | 'down' | 'left' | 'right' }
  | { readonly type: 'menu' }
  | { readonly type: 'pointer'; readonly coordinate: WaterwallCoordinate; readonly mode: 'place' | 'remove' }
  | { readonly type: 'pointer-move'; readonly coordinate: WaterwallCoordinate }
  | { readonly type: 'pointer-up' }
  | { readonly type: 'erase-start'; readonly coordinate: WaterwallCoordinate; readonly startTime: number }
  | { readonly type: 'erase-burst'; readonly coordinate: WaterwallCoordinate; readonly radius: number }

// ── Pure mapping functions ────────────────────────────────────────────────────

const ARROW_DIRECTIONS: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

export function mapKeyToAction(key: string, shiftKey: boolean, cellType: WaterwallCellType): WaterwallAction | null {
  const arrowDir = ARROW_DIRECTIONS[key]
  if (arrowDir) {
    return shiftKey
      ? { type: 'drag-extend', direction: arrowDir }
      : { type: 'move', direction: arrowDir }
  }

  if (key === 'Enter' || key === ' ' || key === 'Space') {
    return cellType === 'barrier' ? { type: 'remove' } : { type: 'place' }
  }

  if (key === 'Delete' || key === 'Backspace') {
    return { type: 'remove' }
  }

  if (key === 'Escape') {
    return { type: 'menu' }
  }

  return null
}

const GAMEPAD_DEAD_ZONE = 0.5

const DPAD_DIRECTIONS: Record<number, 'up' | 'down' | 'left' | 'right'> = {
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
}

export function mapGamepadToAction(
  buttons: readonly { pressed: boolean }[],
  axes: readonly number[],
  cellType: WaterwallCellType,
): WaterwallAction | null {
  if (buttons[0]?.pressed) {
    return cellType === 'barrier' ? { type: 'remove' } : { type: 'place' }
  }

  if (buttons[1]?.pressed) {
    return { type: 'remove' }
  }

  if (buttons[9]?.pressed) {
    return { type: 'menu' }
  }

  for (const [buttonIndex, direction] of Object.entries(DPAD_DIRECTIONS)) {
    if (buttons[Number(buttonIndex)]?.pressed) {
      return { type: 'move', direction }
    }
  }

  const horizontal = axes[0] ?? 0
  const vertical = axes[1] ?? 0

  if (Math.abs(horizontal) > GAMEPAD_DEAD_ZONE || Math.abs(vertical) > GAMEPAD_DEAD_ZONE) {
    if (Math.abs(horizontal) >= Math.abs(vertical)) {
      return { type: 'move', direction: horizontal < 0 ? 'left' : 'right' }
    }
    return { type: 'move', direction: vertical < 0 ? 'up' : 'down' }
  }

  return null
}

// ── Edge zone detection ───────────────────────────────────────────────────────

const EDGE_THRESHOLD = 0.15

export function getEdgeZone(row: number, column: number, rows: number, columns: number): CursorEdge | null {
  const leftBound = Math.floor(columns * EDGE_THRESHOLD)
  const rightBound = columns - 1 - Math.floor(columns * EDGE_THRESHOLD)
  const topBound = Math.floor(rows * EDGE_THRESHOLD)
  const bottomBound = rows - 1 - Math.floor(rows * EDGE_THRESHOLD)

  // Left/right edges take priority over top/bottom in corners
  if (column <= leftBound) return 'left'
  if (column >= rightBound) return 'right'
  if (row <= topBound) return 'top'
  if (row >= bottomBound) return 'bottom'

  return null
}

// ── DOM-dependent setup functions ─────────────────────────────────────────────

export function setupPointerInput(
  canvas: HTMLCanvasElement,
  config: WaterwallConfig,
  onAction: (action: WaterwallAction) => void,
  toGrid: (canvas: HTMLCanvasElement, clientX: number, clientY: number, config: WaterwallConfig) => WaterwallCoordinate | null,
  getCellType: (coord: WaterwallCoordinate) => WaterwallCellType,
): () => void {
  let pointerDown = false
  let pointerDownTime = 0
  let pointerDownCoord: WaterwallCoordinate | null = null
  let eraseHoldActive = false
  let eraseHoldTimer: ReturnType<typeof setTimeout> | null = null
  let hasMoved = false

  const ERASE_HOLD_THRESHOLD = 400 // ms

  const handlePointerDown = (event: PointerEvent): void => {
    const coord = toGrid(canvas, event.clientX, event.clientY, config)
    if (!coord) return

    pointerDown = true
    pointerDownTime = performance.now()
    pointerDownCoord = coord
    hasMoved = false
    eraseHoldActive = false

    const cellType = getCellType(coord)

    // Immediate placement on empty cells; water/barrier cells are no-op on short press
    if (cellType === 'empty') {
      onAction({ type: 'pointer', coordinate: coord, mode: 'place' })
    }

    // Start timer for erase hold detection (cancelled if user moves before threshold)
    eraseHoldTimer = setTimeout(() => {
      if (pointerDown && !hasMoved) {
        eraseHoldActive = true
        onAction({ type: 'erase-start', coordinate: coord, startTime: pointerDownTime + ERASE_HOLD_THRESHOLD })
      }
    }, ERASE_HOLD_THRESHOLD)
  }

  const handlePointerMove = (event: PointerEvent): void => {
    const coord = toGrid(canvas, event.clientX, event.clientY, config)
    if (!coord) return

    if (pointerDown) {
      // Check if moved to a different cell
      if (coord.row !== pointerDownCoord?.row || coord.column !== pointerDownCoord?.column) {
        if (!hasMoved) {
          hasMoved = true
          // Cancel erase hold timer — user is dragging, not holding
          if (eraseHoldTimer) {
            clearTimeout(eraseHoldTimer)
            eraseHoldTimer = null
          }
          // If erase hold was active (edge case: timer already fired), cancel it
          if (eraseHoldActive) {
            eraseHoldActive = false
          }
        }

        if (!eraseHoldActive) {
          // Normal drag placement — only on empty cells (water can't be replaced)
          const cellType = getCellType(coord)
          if (cellType === 'empty') {
            onAction({ type: 'pointer', coordinate: coord, mode: 'place' })
          }
        }
      }
    } else {
      onAction({ type: 'pointer-move', coordinate: coord })
    }
  }

  const handlePointerUp = (): void => {
    if (pointerDown) {
      if (eraseHoldActive && pointerDownCoord) {
        const holdDuration = performance.now() - pointerDownTime - ERASE_HOLD_THRESHOLD
        const radius = Math.min(5, 1 + (Math.max(0, holdDuration) / 2000) * 4)
        onAction({ type: 'erase-burst', coordinate: pointerDownCoord, radius })
      }

      pointerDown = false
      eraseHoldActive = false
      pointerDownCoord = null
      if (eraseHoldTimer) {
        clearTimeout(eraseHoldTimer)
        eraseHoldTimer = null
      }
      onAction({ type: 'pointer-up' })
    }
  }

  const handleContextMenu = (event: Event): void => {
    event.preventDefault()
  }

  canvas.addEventListener('pointerdown', handlePointerDown)
  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerup', handlePointerUp)
  canvas.addEventListener('pointerleave', handlePointerUp)
  canvas.addEventListener('contextmenu', handleContextMenu)

  return () => {
    canvas.removeEventListener('pointerdown', handlePointerDown)
    canvas.removeEventListener('pointermove', handlePointerMove)
    canvas.removeEventListener('pointerup', handlePointerUp)
    canvas.removeEventListener('pointerleave', handlePointerUp)
    canvas.removeEventListener('contextmenu', handleContextMenu)
    if (eraseHoldTimer) {
      clearTimeout(eraseHoldTimer)
      eraseHoldTimer = null
    }
  }
}

export function setupKeyboardInput(
  onAction: (action: WaterwallAction) => void,
  getCellType: () => WaterwallCellType,
): () => void {
  const handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

    const action = mapKeyToAction(event.key, event.shiftKey, getCellType())
    if (action) {
      event.preventDefault()
      onAction(action)
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}

const GAMEPAD_POLL_INTERVAL = 200
let gamepadTimer: ReturnType<typeof setInterval> | null = null

export function startGamepadPolling(
  onAction: (action: WaterwallAction) => void,
  getCellType: () => WaterwallCellType,
): void {
  if (gamepadTimer !== null) return

  gamepadTimer = setInterval(() => {
    const gamepads = navigator.getGamepads()
    for (const gamepad of gamepads) {
      if (!gamepad) continue
      const action = mapGamepadToAction(gamepad.buttons, gamepad.axes, getCellType())
      if (action) {
        onAction(action)
        return
      }
    }
  }, GAMEPAD_POLL_INTERVAL)
}

export function stopGamepadPolling(): void {
  if (gamepadTimer !== null) {
    clearInterval(gamepadTimer)
    gamepadTimer = null
  }
}
