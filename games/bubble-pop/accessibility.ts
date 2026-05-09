export function announceStart(): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = 'Bubble Pop ready. Move in front of the camera to pop bubbles!'
}

export function announcePlaying(): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = 'Popping bubbles! Move your body to pop them.'
}

export function announcePopped(count: number): void {
  const el = document.getElementById('game-feedback')
  if (el) {
    if (count % 10 === 0) {
      el.textContent = `${count} bubbles popped!`
    } else {
      el.textContent = 'Pop!'
    }
  }
}

export function announceEnd(count: number): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = `Game over! You popped ${count} bubbles.`
}

export function manageFocus(screen: string): void {
  const targets: Record<string, string> = {
    start: 'start-btn',
    game: 'game-screen',
    end: 'replay-btn',
  }
  const id = targets[screen]
  if (!id) return
  const el = document.getElementById(id)
  if (el) {
    requestAnimationFrame(() => el.focus())
  }
}