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
  let dragMode: 'place' | 'remove' = 'place'

  const handlePointerDown = (event: PointerEvent): void => {
    const coord = toGrid(canvas, event.clientX, event.clientY, config)
    if (!coord) return

    pointerDown = true
    // Right-click always removes; otherwise toggle based on current cell type
    const mode: 'place' | 'remove' = (event.button === 2 || getCellType(coord) === 'barrier') ? 'remove' : 'place'
    dragMode = mode
    onAction({ type: 'pointer', coordinate: coord, mode })
  }

  const handlePointerMove = (event: PointerEvent): void => {
    const coord = toGrid(canvas, event.clientX, event.clientY, config)
    if (!coord) return

    if (pointerDown) {
      onAction({ type: 'pointer', coordinate: coord, mode: dragMode })
    } else {
      onAction({ type: 'pointer-move', coordinate: coord })
    }
  }

  const handlePointerUp = (): void => {
    if (pointerDown) {
      pointerDown = false
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
