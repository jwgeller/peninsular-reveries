export function announceStart(): void { const el = document.getElementById('game-status'); if (el) el.textContent = 'Leaf Swirl ready. Move to blow the leaves around!' }
export function announceSwirled(count: number): void { const el = document.getElementById('game-feedback'); if (el) el.textContent = `${count} leaves swirled!` }
export function manageFocus(screen: string): void {
  const id = screen === 'start' ? 'start-btn' : screen === 'end' ? 'replay-btn' : 'game-screen'
  const el = document.getElementById(id); if (el) requestAnimationFrame(() => el.focus())
}