// ── Accessibility announcements ─────────────────────────────────────────────

function announce(text: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const el = document.getElementById(priority === 'assertive' ? 'game-feedback' : 'game-status')
  if (el) {
    el.textContent = text
  }
}

export function announceItemPickedUp(itemName: string): void {
  announce(`Picked up ${itemName}.`, 'assertive')
}

export function announceItemPlaced(itemName: string, spotName: string): void {
  announce(`Placed ${itemName} on ${spotName}.`, 'assertive')
}

export function announceItemDropped(itemName: string): void {
  announce(`Dropped ${itemName}.`, 'assertive')
}

export function announceRoomChange(roomName: string): void {
  announce(`Switching to ${roomName}.`, 'polite')
}

export function announceAllPlaced(): void {
  announce('All items placed! Great job!', 'assertive')
}