export type RoomId = 'bedroom' | 'kitchen' | 'study'

export type ItemId = string

export type SpotId = string

export type SpotOnPhase = 'idle' | 'carrying' | 'complete'

/** Template for an item in a room definition (before scatter) */
export interface ItemTemplate {
  readonly id: ItemId
  readonly name: string
  readonly emoji: string
}

/** Template for a spot in a room definition (with fixed position) */
export interface SpotTemplate {
  readonly id: SpotId
  readonly label: string
  readonly emoji: string
  readonly x: number
  readonly y: number
}

/** Runtime item state, including randomized floor scatter position */
export interface ItemState {
  readonly id: ItemId
  readonly name: string
  readonly emoji: string
  readonly placed: boolean
  readonly spotId: SpotId | null
  readonly floorX: number
  readonly floorY: number
}

/** Runtime spot state, including occupancy */
export interface SpotState {
  readonly id: SpotId
  readonly label: string
  readonly emoji: string
  readonly itemId: ItemId | null
  readonly x: number
  readonly y: number
}

/** Room blueprint — themes, templates */
export interface RoomDefinition {
  readonly id: RoomId
  readonly name: string
  readonly theme: string
  readonly items: readonly ItemTemplate[]
  readonly spots: readonly SpotTemplate[]
}

/** Full game state */
export interface SpotOnState {
  readonly currentRoomId: RoomId
  readonly phase: SpotOnPhase
  readonly carriedItemId: ItemId | null
  readonly items: readonly ItemState[]
  readonly spots: readonly SpotState[]
}