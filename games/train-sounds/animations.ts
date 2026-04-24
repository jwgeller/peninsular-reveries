import { isReducedMotion } from '../../client/game-animations.js'

const TRAIN_EXIT_DURATION_MS = 600
const TRAIN_ENTER_DURATION_MS = 500
const HOTSPOT_PRESS_DURATION_MS = 150

export function resetTrainAnimationState(
  scene: HTMLElement | null,
  trainName: HTMLElement | null,
): void {
  if (!scene) return

  scene.classList.remove('train-exiting', 'train-entering', 'train-departing')
  scene.dataset.sceneState = 'idle'

  const displayFrame = scene.querySelector<HTMLElement>('.train-display-frame')
  if (displayFrame) {
    const display = displayFrame.querySelector<HTMLElement>('.train-display')
    if (display) {
      display.classList.remove('train-exiting', 'train-entering', 'train-departing')
      display.style.removeProperty('transform')
    }
  }

  if (trainName) {
    trainName.classList.remove('is-switching')
  }

  const hotspotButtons = scene.querySelectorAll<HTMLElement>('.train-hotspot')
  for (const button of hotspotButtons) {
    button.classList.remove('is-pressed')
  }
}

export function animateTrainSwitch(
  scene: HTMLElement | null,
  trainName: HTMLElement | null,
  _triggerButton: HTMLElement | null = null,
): void {
  if (!scene) return

  if (isReducedMotion()) {
    scene.classList.remove('train-exiting', 'train-entering')
    scene.dataset.sceneState = 'idle'
    if (trainName) {
      trainName.classList.remove('is-switching')
    }
    return
  }

  scene.classList.add('train-exiting')
  scene.dataset.sceneState = 'switching'
  if (trainName) {
    trainName.classList.add('is-switching')
  }

  const handleExitEnd = (): void => {
    scene.removeEventListener('transitionend', handleExitEnd)
    window.clearTimeout(fallbackTimer)

    scene.classList.remove('train-exiting')
    scene.classList.add('train-entering')

    const handleEnterEnd = (): void => {
      scene.removeEventListener('transitionend', handleEnterEnd)
      window.clearTimeout(enterFallbackTimer)
      scene.classList.remove('train-entering')
      scene.dataset.sceneState = 'idle'
      if (trainName) {
        trainName.classList.remove('is-switching')
      }
    }

    const enterFallbackTimer = window.setTimeout(handleEnterEnd, TRAIN_ENTER_DURATION_MS + 100)
    scene.addEventListener('transitionend', handleEnterEnd, { once: true })
  }

  const fallbackTimer = window.setTimeout(handleExitEnd, TRAIN_EXIT_DURATION_MS + 100)
  scene.addEventListener('transitionend', handleExitEnd, { once: true })
}

export function animateHotspotPress(
  _scene: HTMLElement | null,
  hotspotButton: HTMLElement | null,
): void {
  if (!hotspotButton) return

  if (isReducedMotion()) {
    hotspotButton.classList.add('is-pressed')
    hotspotButton.classList.remove('is-pressed')
    return
  }

  hotspotButton.classList.add('is-pressed')

  window.setTimeout(() => {
    hotspotButton.classList.remove('is-pressed')
  }, HOTSPOT_PRESS_DURATION_MS)
}

export function animateAllAboard(
  scene: HTMLElement | null,
  displayFrame: HTMLElement | null,
): Promise<void> {
  if (!scene || !displayFrame) return Promise.resolve()

  if (isReducedMotion()) {
    scene.classList.remove('train-departing', 'train-entering')
    return Promise.resolve()
  }

  const display = displayFrame.querySelector<HTMLElement>('.train-display')
  if (display) {
    display.classList.add('train-departing')
  }
  scene.classList.add('train-departing')
  scene.dataset.sceneState = 'departing'

  return new Promise<void>((resolve) => {
    const handleEnd = (): void => {
      displayFrame.removeEventListener('transitionend', handleEnd)
      window.clearTimeout(fallbackTimer)
      if (display) {
        display.classList.remove('train-departing')
      }
      scene.classList.remove('train-departing')
      resolve()
    }

    const fallbackTimer = window.setTimeout(handleEnd, TRAIN_EXIT_DURATION_MS + 100)
    displayFrame.addEventListener('transitionend', handleEnd, { once: true })
  })
}

export function animateTrainArrival(
  scene: HTMLElement | null,
  displayFrame: HTMLElement | null,
): Promise<void> {
  if (!scene || !displayFrame) return Promise.resolve()

  if (isReducedMotion()) {
    scene.classList.remove('train-entering')
    scene.dataset.sceneState = 'idle'
    return Promise.resolve()
  }

  const display = displayFrame.querySelector<HTMLElement>('.train-display')
  if (display) {
    display.classList.add('train-entering')
  }
  scene.classList.add('train-entering')
  scene.dataset.sceneState = 'arriving'

  return new Promise<void>((resolve) => {
    const handleEnd = (): void => {
      displayFrame.removeEventListener('transitionend', handleEnd)
      window.clearTimeout(fallbackTimer)
      if (display) {
        display.classList.remove('train-entering')
      }
      scene.classList.remove('train-entering')
      scene.dataset.sceneState = 'idle'
      resolve()
    }

    const fallbackTimer = window.setTimeout(handleEnd, TRAIN_ENTER_DURATION_MS + 100)
    displayFrame.addEventListener('transitionend', handleEnd, { once: true })
  })
}