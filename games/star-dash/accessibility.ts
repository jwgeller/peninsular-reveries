export function announceStart(): void { const el = document.getElementById('game-status'); if (el) el.textContent = 'Star Dash ready. Dash to catch the stars before they fade!' }
export function announceCatch(score: number, streak: number): void {
  const el = document.getElementById('game-feedback')
  if (el) el.textContent = streak > 3 ? `${streak}x streak! Score: ${score}` : `Star caught! Score: ${score}`
}
export function manageFocus(screen: string): void {
  const id = screen === 'start' ? 'start-btn' : screen === 'end' ? 'replay-btn' : 'game-screen'
  const el = document.getElementById(id); if (el) requestAnimationFrame(() => el.focus())
}