import type { ItemState, SpotOnState, SpotState } from './types.js'
import { ROOMS, countPlaced, getRoomDefinition } from './state.js'

// ── Renderer refs ────────────────────────────────────────────────────────────

interface RendererRefs {
  readonly scene: HTMLElement
  readonly statusBar: HTMLElement
  readonly newRoomBtn: HTMLButtonElement
  readonly completionMsg: HTMLElement
}

export interface SpotOnRenderer {
  readonly scene: HTMLElement
  readonly statusBar: HTMLElement
  readonly newRoomBtn: HTMLButtonElement
  readonly completionMsg: HTMLElement
  render(state: SpotOnState): void
  syncLayout(): void
  dispose(): void
}

const ROOM_THEME_CLASSES: readonly string[] = ROOMS.map((r) => r.theme)

function byId<T extends HTMLElement>(id: string): T | null {
  const el = document.getElementById(id)
  return el instanceof HTMLElement ? (el as T) : null
}

function requireElement<T extends HTMLElement>(id: string): T {
  const el = byId<T>(id)
  if (!el) {
    throw new Error(`Spot On renderer could not find #${id}.`)
  }
  return el
}

function getItemPosition(item: ItemState, spots: readonly SpotState[]): { x: number; y: number } {
  if (item.placed && item.spotId) {
    const spot = spots.find((s) => s.id === item.spotId)
    if (spot) return { x: spot.x, y: spot.y }
  }
  return { x: item.floorX, y: item.floorY }
}

function createItemButton(item: ItemState, carried: boolean, spots: readonly SpotState[]): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'room-item'
  button.dataset.itemId = item.id
  button.setAttribute('aria-label', `${item.name}${item.placed ? ' (placed)' : ''}${carried ? ' (carrying)' : ''}`)
  button.textContent = item.emoji

  const pos = getItemPosition(item, spots)
  button.style.left = `${pos.x}%`
  button.style.top = `${pos.y}%`

  if (item.placed) {
    button.classList.add('room-item--placed')
    button.disabled = true
  }

  if (carried) {
    button.classList.add('room-item--carried')
  }

  return button
}

function createSpotDiv(spot: SpotState, carrying: boolean): HTMLDivElement {
  const div = document.createElement('div')
  div.className = 'room-spot'
  div.dataset.spotId = spot.id
  div.setAttribute('role', 'button')
  div.setAttribute('tabindex', '0')
  div.setAttribute('aria-label', `${spot.label}${spot.itemId ? ' (occupied)' : ''}`)

  if (spot.itemId) {
    div.classList.add('room-spot--occupied')
    // When occupied, show the placed item's emoji instead of the spot emoji
    const itemEl = document.createElement('span')
    itemEl.className = 'room-spot__item-emoji'
    itemEl.setAttribute('aria-hidden', 'true')
    // The item emoji will be found from state; for now show spot emoji and overlay via item
    div.textContent = spot.emoji
  } else {
    div.textContent = spot.emoji
    if (carrying) {
      div.classList.add('room-spot--highlight')
    }
  }

  div.style.left = `${spot.x}%`
  div.style.top = `${spot.y}%`

  return div
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initSpotOnRenderer(): SpotOnRenderer {
  const scene = requireElement<HTMLElement>('room-scene')
  const statusBar = requireElement<HTMLElement>('room-status')
  const newRoomBtn = requireElement<HTMLButtonElement>('new-room-btn')
  const completionMsg = requireElement<HTMLElement>('completion-msg')

  const refs: RendererRefs = {
    scene,
    statusBar,
    newRoomBtn,
    completionMsg,
  }

  let layoutFrame = 0

  const queueLayoutSync = (): void => {
    if (layoutFrame !== 0) return
    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = 0
      syncLayout()
    })
  }

  const resizeObserver = new ResizeObserver(() => {
    queueLayoutSync()
  })

  resizeObserver.observe(refs.scene)

  function syncLayout(): void {
    // Responsive layout pass — items and spots are positioned via percentages
    // so they automatically rescale. No dynamic layout adjustments needed.
  }

  function render(state: SpotOnState): void {
    const room = getRoomDefinition(state.currentRoomId)
    const carrying = state.carriedItemId !== null

    // Toggle room theme class
    for (const cls of ROOM_THEME_CLASSES) {
      refs.scene.classList.remove(cls)
    }
    refs.scene.classList.add(room.theme)

    // Toggle carrying class on scene
    if (carrying) {
      refs.scene.classList.add('room-scene--carrying')
    } else {
      refs.scene.classList.remove('room-scene--carrying')
    }

    // Toggle complete class on scene
    if (state.phase === 'complete') {
      refs.scene.classList.add('room-scene--complete')
    } else {
      refs.scene.classList.remove('room-scene--complete')
    }

    // Clear scene children
    refs.scene.replaceChildren()

    // Render spots first (lower z-index)
    const spotFrag = document.createDocumentFragment()
    for (const spot of state.spots) {
      const div = createSpotDiv(spot, carrying)
      spotFrag.appendChild(div)
    }
    refs.scene.appendChild(spotFrag)

    // Render items on top (higher z-index)
    const itemFrag = document.createDocumentFragment()
    for (const item of state.items) {
      const carried = state.carriedItemId === item.id
      const button = createItemButton(item, carried, state.spots)
      itemFrag.appendChild(button)
    }
    refs.scene.appendChild(itemFrag)

    // Completion message overlay
    if (state.phase === 'complete') {
      refs.completionMsg.classList.remove('completion-msg--hidden')
      refs.completionMsg.classList.add('completion-msg--visible')
    } else {
      refs.completionMsg.classList.remove('completion-msg--visible')
      refs.completionMsg.classList.add('completion-msg--hidden')
    }

    // Update status bar
    const placed = countPlaced(state.items)
    const total = state.items.length
    refs.statusBar.textContent = `Items placed: ${placed} / ${total}`
  }

  const handleViewportResize = (): void => {
    queueLayoutSync()
  }

  window.addEventListener('resize', handleViewportResize)

  return {
    scene: refs.scene,
    statusBar: refs.statusBar,
    newRoomBtn: refs.newRoomBtn,
    completionMsg: refs.completionMsg,
    render,
    syncLayout,
    dispose(): void {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleViewportResize)

      if (layoutFrame !== 0) {
        window.cancelAnimationFrame(layoutFrame)
        layoutFrame = 0
      }
    },
  }
}