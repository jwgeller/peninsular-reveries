import type { ItemId, ItemState, ItemTemplate, RoomDefinition, RoomId, SpotId, SpotOnState, SpotState, SpotTemplate } from './types.js'

// ── Room definitions ─────────────────────────────────────────────────────────

export const ROOMS: readonly RoomDefinition[] = [
  {
    id: 'bedroom',
    name: 'Bedroom',
    theme: 'room-bedroom',
    items: [
      { id: 'teddy-bear', name: 'teddy bear', emoji: '🧸' },
      { id: 'shirt', name: 'shirt', emoji: '👕' },
      { id: 'book', name: 'book', emoji: '📖' },
      { id: 'pillow', name: 'pillow', emoji: '💤' },
      { id: 'alarm-clock', name: 'alarm clock', emoji: '🔔' },
    ],
    spots: [
      { id: 'bed', label: 'bed', emoji: '🛏️', x: 15, y: 60 },
      { id: 'bookshelf', label: 'bookshelf', emoji: '📚', x: 10, y: 20 },
      { id: 'hanger', label: 'hanger', emoji: '👔', x: 40, y: 12 },
      { id: 'nightstand', label: 'nightstand', emoji: '🗄️', x: 55, y: 57 },
      { id: 'toy-box', label: 'toy box', emoji: '🧺', x: 78, y: 62 },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    theme: 'room-kitchen',
    items: [
      { id: 'mug', name: 'mug', emoji: '☕' },
      { id: 'pan', name: 'pan', emoji: '🍳' },
      { id: 'herb-jar', name: 'herb jar', emoji: '🌿' },
      { id: 'apple', name: 'apple', emoji: '🍎' },
      { id: 'bottle', name: 'bottle', emoji: '🧴' },
    ],
    spots: [
      { id: 'hook', label: 'hook', emoji: '🪝', x: 10, y: 14 },
      { id: 'rack', label: 'rack', emoji: '🍳', x: 30, y: 20 },
      { id: 'shelf', label: 'shelf', emoji: '🗄️', x: 54, y: 16 },
      { id: 'counter', label: 'counter', emoji: '📐', x: 75, y: 52 },
      { id: 'bowl', label: 'bowl', emoji: '🥣', x: 50, y: 66 },
    ],
  },
  {
    id: 'study',
    name: 'Study',
    theme: 'room-study',
    items: [
      { id: 'pen', name: 'pen', emoji: '🖊️' },
      { id: 'study-book', name: 'book', emoji: '📖' },
      { id: 'study-mug', name: 'mug', emoji: '☕' },
      { id: 'letter', name: 'letter', emoji: '✉️' },
      { id: 'plant', name: 'plant', emoji: '🌱' },
    ],
    spots: [
      { id: 'desk', label: 'desk', emoji: '📝', x: 12, y: 56 },
      { id: 'study-shelf', label: 'shelf', emoji: '📚', x: 10, y: 18 },
      { id: 'coaster', label: 'coaster', emoji: '⬜', x: 34, y: 58 },
      { id: 'tray', label: 'tray', emoji: '📬', x: 56, y: 42 },
      { id: 'windowsill', label: 'windowsill', emoji: '🪟', x: 82, y: 18 },
    ],
  },
]

const ROOM_IDS: readonly RoomId[] = ROOMS.map((r) => r.id)

// ── Scatter positions ─────────────────────────────────────────────────────────

/** Random integer in [min, max] (inclusive) */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate randomized floor scatter positions for items.
 * Items are scattered in the lower portion of the scene (floor area),
 * with some horizontal spread to avoid excessive overlap.
 */
function generateScatterPositions(count: number): readonly { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const MIN_GAP_X = 14
  for (let i = 0; i < count; i++) {
    let x: number
    let attempts = 0
    // Try to spread items so they don't overlap too much
    do {
      x = randInt(8, 82)
      attempts++
    } while (
      attempts < 20 &&
      positions.some((p) => Math.abs(p.x - x) < MIN_GAP_X)
    )
    const y = randInt(72, 86)
    positions.push({ x, y })
  }
  return positions
}

function scatterItems(templates: readonly ItemTemplate[]): readonly ItemState[] {
  const positions = generateScatterPositions(templates.length)
  return templates.map((tpl, i) => ({
    id: tpl.id,
    name: tpl.name,
    emoji: tpl.emoji,
    placed: false,
    spotId: null,
    floorX: positions[i].x,
    floorY: positions[i].y,
  }))
}

function initSpots(templates: readonly SpotTemplate[]): readonly SpotState[] {
  return templates.map((tpl) => ({
    id: tpl.id,
    label: tpl.label,
    emoji: tpl.emoji,
    itemId: null,
    x: tpl.x,
    y: tpl.y,
  }))
}

// ── State helpers ────────────────────────────────────────────────────────────

export function getRoomDefinition(roomId: RoomId): RoomDefinition {
  return ROOMS.find((r) => r.id === roomId) ?? ROOMS[0]
}

function countPlaced(items: readonly ItemState[]): number {
  return items.filter((item) => item.placed).length
}

function allItemsPlaced(items: readonly ItemState[]): boolean {
  return items.every((item) => item.placed)
}

// ── Public API ───────────────────────────────────────────────────────────────

export function createInitialState(): SpotOnState {
  const room = ROOMS[0]
  return {
    currentRoomId: room.id,
    phase: 'idle',
    carriedItemId: null,
    items: scatterItems(room.items),
    spots: initSpots(room.spots),
  }
}

export function pickUpItem(state: SpotOnState, itemId: ItemId): SpotOnState {
  if (state.phase !== 'idle') return state
  const item = state.items.find((i) => i.id === itemId)
  if (!item || item.placed) return state

  return {
    ...state,
    phase: 'carrying',
    carriedItemId: itemId,
  }
}

export function placeItem(state: SpotOnState, spotId: SpotId): SpotOnState {
  if (state.phase !== 'carrying' || state.carriedItemId === null) return state

  const spot = state.spots.find((s) => s.id === spotId)
  if (!spot) return state

  const carriedItem = state.items.find((i) => i.id === state.carriedItemId)
  if (!carriedItem) return state

  const nextItems = state.items.map((item) =>
    item.id === carriedItem.id
      ? { ...item, placed: true, spotId }
      : item,
  )
  const nextSpots = state.spots.map((s) =>
    s.id === spotId
      ? { ...s, itemId: carriedItem.id }
      : s.itemId === carriedItem.id
        ? { ...s, itemId: null }
        : s,
  )

  const nextPhase = allItemsPlaced(nextItems) ? 'complete' : 'idle'

  return {
    ...state,
    phase: nextPhase,
    carriedItemId: null,
    items: nextItems,
    spots: nextSpots,
  }
}

export function dropItem(state: SpotOnState): SpotOnState {
  if (state.phase !== 'carrying' || state.carriedItemId === null) return state

  return {
    ...state,
    phase: 'idle',
    carriedItemId: null,
  }
}

export function selectNextRoom(state: SpotOnState): SpotOnState {
  const currentIndex = ROOM_IDS.indexOf(state.currentRoomId)
  const nextRoomId = ROOM_IDS[(currentIndex + 1) % ROOM_IDS.length]
  const room = getRoomDefinition(nextRoomId)

  return {
    currentRoomId: nextRoomId,
    phase: 'idle',
    carriedItemId: null,
    items: scatterItems(room.items),
    spots: initSpots(room.spots),
  }
}

export { countPlaced }