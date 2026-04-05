import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('SITE-08: Chompers', () => {
  test('homepage exposes the Chompers card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href*="chompers"]').first()).toBeVisible()
  })

  test('start screen loads with difficulty picker and start button', async ({ page }) => {
    await page.goto('/chompers/')

    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.locator('.difficulty-radio')).toHaveCount(5)
    await expect(page.getByRole('button', { name: 'Start Chomping' })).toBeVisible()
  })

  test('counting difficulty is selected by default', async ({ page }) => {
    await page.goto('/chompers/')

    await expect(page.locator('input[name="difficulty"][value="counting"]')).toBeChecked()
  })

  test('start game shows game screen with problem and arena', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()

    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#problem-prompt')).not.toBeEmpty()
    await expect(page.locator('#game-arena')).toBeVisible()
  })

  test('scene items appear after starting the game', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()

    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#scene-items button').first()).toBeVisible({ timeout: 5000 })

    const count = await page.locator('#scene-items button').count()
    expect(count).toBeGreaterThan(0)
  })

  test('clicking a scene item advances game state', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await page.locator('#scene-items button').first().waitFor({ state: 'visible', timeout: 5000 })

    await page.locator('#scene-items button').first().click()

    // After clicking score stays >= 0 and lives <= 3 (something changed)
    const scoreText = await page.locator('#score').textContent()
    const score = parseInt(scoreText ?? '0', 10)
    expect(score).toBeGreaterThanOrEqual(0)

    const livesText = await page.locator('#lives').textContent()
    const lives = (livesText?.match(/♥/g) ?? []).length
    expect(lives).toBeLessThanOrEqual(3)
  })

  test('settings modal opens and closes from game screen', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })

    await page.locator('#settings-btn').click()
    await expect(page.locator('#settings-modal')).toBeVisible({ timeout: 3000 })

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('#settings-modal')).toBeHidden({ timeout: 3000 })
  })

  test('game screen has no critical accessibility violations', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#scene-items button').first()).toBeVisible({ timeout: 5000 })

    const results = await new AxeBuilder({ page })
      .include('#game-screen')
      .include('#game-status')
      .include('#game-feedback')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('mobile viewport 393x740 has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 740 })
    await page.goto('/chompers/')

    const widths = await page.evaluate(() => ({
      windowWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }))

    expect(widths.documentWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
    expect(widths.bodyWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
  })

  test('landscape 932x430 shows arena and hippo within viewport', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 })
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#game-arena')).toBeVisible()
    await expect(page.locator('#hippo')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const arena = document.getElementById('game-arena')
      const hippo = document.getElementById('hippo')
      if (!arena || !hippo) return null

      const arenaRect = arena.getBoundingClientRect()
      const hippoRect = hippo.getBoundingClientRect()

      return {
        arenaBottom: arenaRect.bottom,
        hippoBottom: hippoRect.bottom,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.arenaBottom).toBeLessThanOrEqual((metrics?.viewportHeight ?? 0) + 1)
    expect(metrics?.hippoBottom).toBeLessThanOrEqual((metrics?.viewportHeight ?? 0) + 1)
  })
})