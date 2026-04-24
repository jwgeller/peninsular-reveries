import { isReducedMotionEnabled } from '../../client/preferences.js'

// ── Animation helpers ─────────────────────────────────────────────────────────

/**
 * Animate item pickup: scale + shadow increase, 100ms.
 * Gated by isReducedMotion() — instant if reduced motion.
 */
export function animateItemPickup(
  element: HTMLElement | null,
  callback?: () => void,
): void {
  if (!element) {
    callback?.()
    return
  }

  if (isReducedMotionEnabled()) {
    callback?.()
    return
  }

  element.style.transition = 'transform 100ms ease, box-shadow 100ms ease'
  element.classList.add('room-item--anim-pickup')

  const onEnd = (): void => {
    element.removeEventListener('transitionend', onEnd)
    clearTimeout(fallback)
    callback?.()
  }

  const fallback = setTimeout(onEnd, 150)
  element.addEventListener('transitionend', onEnd, { once: true })
}

/**
 * Animate item place: translateY bounce (0 → -4px → 0), 200ms.
 * Gated by isReducedMotion() — callback immediately if reduced motion.
 */
export function animateItemPlace(
  element: HTMLElement | null,
  callback?: () => void,
): void {
  if (!element) {
    callback?.()
    return
  }

  if (isReducedMotionEnabled()) {
    callback?.()
    return
  }

  element.classList.add('room-item--anim-place')

  const onEnd = (): void => {
    element.removeEventListener('animationend', onEnd)
    clearTimeout(fallback)
    element.classList.remove('room-item--anim-place')
    callback?.()
  }

  const fallback = setTimeout(onEnd, 280)
  element.addEventListener('animationend', onEnd, { once: true })
}

/**
 * Animate room transition: opacity 1 → 0, swap (callback), 0 → 1.
 * 300ms each direction. Gated by isReducedMotion() — instant swap.
 */
export function animateRoomTransition(
  scene: HTMLElement | null,
  callback?: () => void,
): void {
  if (!scene) {
    callback?.()
    return
  }

  if (isReducedMotionEnabled()) {
    callback?.()
    return
  }

  scene.classList.add('room-scene--fading-out')

  const onFadeOut = (): void => {
    scene.removeEventListener('transitionend', onFadeOut)
    clearTimeout(fadeOutFallback)

    // Swap content in the middle
    callback?.()

    // Fade back in
    scene.classList.remove('room-scene--fading-out')
    scene.classList.add('room-scene--fading-in')

    const onFadeIn = (): void => {
      scene.removeEventListener('transitionend', onFadeIn)
      clearTimeout(fadeInFallback)
      scene.classList.remove('room-scene--fading-in')
    }

    const fadeInFallback = setTimeout(onFadeIn, 350)
    scene.addEventListener('transitionend', onFadeIn, { once: true })
  }

  const fadeOutFallback = setTimeout(onFadeOut, 350)
  scene.addEventListener('transitionend', onFadeOut, { once: true })
}

/**
 * Animate completion message: fade-in 400ms.
 * Gated by isReducedMotion() — instant show.
 */
export function animateCompletion(
  messageEl: HTMLElement | null,
  callback?: () => void,
): void {
  if (!messageEl) {
    callback?.()
    return
  }

  if (isReducedMotionEnabled()) {
    callback?.()
    return
  }

  messageEl.classList.add('completion-msg--animating')

  const onEnd = (): void => {
    messageEl.removeEventListener('transitionend', onEnd)
    clearTimeout(fallback)
    messageEl.classList.remove('completion-msg--animating')
    callback?.()
  }

  const fallback = setTimeout(onEnd, 450)
  messageEl.addEventListener('transitionend', onEnd, { once: true })
}