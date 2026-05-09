export function announceStart(): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = 'Color Reach ready. Move to touch the matching color zones!'
}
export function announcePlaying(): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = 'Reach for the colors!'
}
export function announceReached(score: number): void {
  const el = document.getElementById('game-feedback')
  if (el) el.textContent = `Nice! Score: ${score}`
}
export function announceEnd(score: number): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = `Game over! Final score: ${score}`
}
export function manageFocus(screen: string): void {
  const id = screen === 'start' ? 'start-btn' : screen === 'end' ? 'replay-btn' : 'game-screen'
  const el = document.getElementById(id)
  if (el) requestAnimationFrame(() => el.focus())
}