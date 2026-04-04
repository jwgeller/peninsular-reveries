import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('SITE-08: Chompers', () => {
  test('homepage exposes the Chompers card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href*="chompers"]').first()).toBeVisible()
  })

  test('game page loads with mode selection and starts in rush mode', async ({ page }) => {
    await page.goto('/chompers/')

    await expect(page.getByRole('heading', { name: 'Chompers' })).toBeVisible()
    await expect(page.getByLabel('Pick a mode')).toContainText('Rush')
    await expect(page.getByLabel('Pick a mode')).toContainText('Zen')

    await page.getByRole('button', { name: 'Start Chomping' }).click()

    await expect(page.locator('#game-screen')).toHaveClass(/active/)
    await expect(page.locator('#mode-chip')).toContainText('Rush')
    await expect(page.locator('#game-status')).toBeAttached()
    await expect(page.locator('#game-feedback')).toBeAttached()
  })

  test('survival mode selection carries into gameplay', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByLabel('Survival mode').check()
    await page.getByRole('button', { name: 'Start Chomping' }).click()

    await expect(page.locator('#mode-chip')).toContainText('Survival')
    await expect(page.locator('#lives-readout')).toBeVisible()
    await expect(page.locator('#timer-readout')).toBeHidden()
  })

  test('zen mode selection carries into gameplay with a calm progress readout', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByLabel('Zen mode').check()
    await page.getByRole('button', { name: 'Start Chomping' }).click()

    await expect(page.locator('#mode-chip')).toContainText('Zen')
    await expect(page.locator('#timer-readout')).toBeVisible()
    await expect(page.locator('#timer-readout')).toContainText('left')
    await expect(page.locator('#lives-readout')).toBeHidden()
  })

  test('settings modal opens and closes from the start screen', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('#settings-modal')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible()
    await expect(page.getByText('Gamepad: left stick or D-pad moves, A chomps.')).toBeVisible()
    await expect(page.getByText(/curated CC0 sample set/i)).toBeVisible()
    await expect(page.getByText('Kalimba (C-note)')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('#settings-modal')).toBeHidden()
  })

  test('center-lane chomp scores once the opening apple drops into range', async ({ page }) => {
    await page.goto('/chompers/')
    await page.getByRole('button', { name: 'Start Chomping' }).click()

    const arena = page.locator('#game-arena')
    const box = await arena.boundingBox()
    if (!box) {
      throw new Error('Missing game arena bounds')
    }

    await page.waitForTimeout(2500)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.82)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.82)

    await expect(page.locator('#score')).toContainText('2')
    await expect(page.locator('#game-feedback')).toContainText('Chomped Apple')
  })

  test('active game screen has no critical accessibility violations', async ({ page }) => {
    await page.goto('/chompers/')
    await page.getByRole('button', { name: 'Start Chomping' }).click()

    const results = await new AxeBuilder({ page })
      .include('#game-screen')
      .include('#game-status')
      .include('#game-feedback')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('mobile layout keeps the arena within the viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 740 })
    await page.goto('/chompers/')
    await page.getByRole('button', { name: 'Start Chomping' }).click()

    const widths = await page.evaluate(() => ({
      windowWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }))

    expect(widths.documentWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
    expect(widths.bodyWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
    await expect(page.locator('#game-arena')).toBeVisible()
    await expect(page.locator('#chomp-btn')).toBeVisible()
  })

  test('short landscape layout keeps the chomp button visible and scales the neck reach with the arena', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 })
    await page.goto('/chompers/')
    await page.getByRole('button', { name: 'Start Chomping' }).click()

    const arena = page.locator('#game-arena')
    const box = await arena.boundingBox()
    if (!box) {
      throw new Error('Missing game arena bounds')
    }

    await page.waitForTimeout(2500)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.82)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.82)
    await page.waitForTimeout(140)

    const metrics = await page.evaluate(() => {
      const arenaEl = document.getElementById('game-arena')
      const hippoEl = document.getElementById('hippo')
      const chompButton = document.getElementById('chomp-btn')
      if (!(arenaEl instanceof HTMLElement) || !(hippoEl instanceof HTMLElement) || !(chompButton instanceof HTMLElement)) {
        return null
      }

      const arenaRect = arenaEl.getBoundingClientRect()
      const buttonRect = chompButton.getBoundingClientRect()
      const neckHeight = Number.parseFloat(getComputedStyle(hippoEl).getPropertyValue('--neck-height'))

      return {
        arenaHeight: arenaRect.height,
        buttonBottom: buttonRect.bottom,
        neckHeight,
        viewportHeight: window.innerHeight,
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.buttonBottom).toBeLessThanOrEqual((metrics?.viewportHeight ?? 0) + 1)
    expect(metrics?.neckHeight ?? 0).toBeGreaterThan((metrics?.arenaHeight ?? 0) * 0.55)
  })

  test('end screen can return to mode selection', async ({ page }) => {
    await page.goto('/chompers/')

    await page.evaluate(() => {
      document.querySelector('.screen.active')?.classList.remove('active')
      document.getElementById('end-screen')?.classList.add('active')
    })

    await page.getByRole('button', { name: 'Pick Another Mode' }).click()

    await expect(page.locator('#start-screen')).toHaveClass(/active/)
    await expect(page.getByRole('button', { name: 'Start Chomping' })).toBeFocused()
  })
})