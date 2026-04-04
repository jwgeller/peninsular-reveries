const gameLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.game-card-primary'))
const gamepadHint = document.getElementById('home-gamepad-hint') as HTMLElement | null

if (gameLinks.length > 0) {
  let activeIndex = -1
  let previousPreviousPressed = false
  let previousNextPressed = false
  let previousPrimaryPressed = false

  function setGamepadMode(enabled: boolean): void {
    document.body.classList.toggle('gamepad-active', enabled)
    if (gamepadHint) {
      gamepadHint.hidden = !enabled
    }
  }

  function focusGameLink(index: number): void {
    const normalizedIndex = (index + gameLinks.length) % gameLinks.length

    if (activeIndex >= 0) {
      gameLinks[activeIndex].classList.remove('gamepad-focus')
    }

    activeIndex = normalizedIndex
    const nextLink = gameLinks[activeIndex]
    nextLink.classList.add('gamepad-focus')
    setGamepadMode(true)
    nextLink.focus({ preventScroll: true })
    nextLink.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  function clearGamepadMode(): void {
    if (activeIndex >= 0) {
      gameLinks[activeIndex].classList.remove('gamepad-focus')
    }

    activeIndex = -1
    setGamepadMode(false)
  }

  const clearOnPointer = (): void => {
    clearGamepadMode()
  }

  document.addEventListener('pointerdown', clearOnPointer)
  document.addEventListener('touchstart', clearOnPointer, { passive: true })

  const pollGamepad = (): void => {
    const pad = navigator.getGamepads?.().find((candidate) => candidate !== null)
    const axisX = pad?.axes[0] ?? 0
    const axisY = pad?.axes[1] ?? 0
    const previousPressed = Boolean(pad?.buttons[14]?.pressed) || Boolean(pad?.buttons[12]?.pressed) || axisX < -0.55 || axisY < -0.55
    const nextPressed = Boolean(pad?.buttons[15]?.pressed) || Boolean(pad?.buttons[13]?.pressed) || axisX > 0.55 || axisY > 0.55
    const primaryPressed = Boolean(pad?.buttons[0]?.pressed)

    if (previousPressed && !previousPreviousPressed) {
      focusGameLink(activeIndex === -1 ? 0 : activeIndex - 1)
    }

    if (nextPressed && !previousNextPressed) {
      focusGameLink(activeIndex === -1 ? 0 : activeIndex + 1)
    }

    if (primaryPressed && !previousPrimaryPressed) {
      if (activeIndex === -1) {
        focusGameLink(0)
      } else {
        gameLinks[activeIndex].click()
      }
    }

    previousPreviousPressed = previousPressed
    previousNextPressed = nextPressed
    previousPrimaryPressed = primaryPressed

    requestAnimationFrame(pollGamepad)
  }

  requestAnimationFrame(pollGamepad)
}