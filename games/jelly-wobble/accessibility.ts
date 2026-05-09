export function announceStart(): void { const el = document.getElementById('game-status'); if (el) el.textContent = 'Jelly Wobble ready. Move near the jelly to wobble it!' }
export function announceWobble(score: number): void { const el = document.getElementById('game-feedback'); if (el) el.textContent = `Wobble score: ${score}` }
export function announceEnd(score: number): void { const el = document.getElementById('game-status'); if (el) el.textContent = `Great wobbling! Score: ${score}` }
export function manageFocus(screen: string): void {
  const id = screen === 'start' ? 'start-btn' : screen === 'end' ? 'replay-btn' : 'game-screen'
  const el = document.getElementById(id); if (el) requestAnimationFrame(() => el.focus())
}