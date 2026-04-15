export function cursorPulseAlpha(timestamp: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0.5
  return 0.5 + 0.2 * Math.sin(timestamp * 0.004 * Math.PI)
}
