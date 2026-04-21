// Train Sounds intentionally has no animations. These exports remain as no-ops so
// existing call sites in main.ts continue to compile without scattering conditional
// logic. If animations are reintroduced in the future, reinstate the timer-based
// class toggling pattern that previously lived here.

export function resetTrainAnimationState(
  _scene: HTMLElement | null,
  _trainName: HTMLElement | null,
): void {
  // no-op
}

export function animateTrainSwitch(
  _scene: HTMLElement | null,
  _trainName: HTMLElement | null,
  _triggerButton: HTMLElement | null = null,
): void {
  // no-op
}

export function animateHotspotPress(
  _scene: HTMLElement | null,
  _hotspotButton: HTMLElement | null,
): void {
  // no-op
}
