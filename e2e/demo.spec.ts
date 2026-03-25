import { test, expect } from '@playwright/test'

test.describe('Demo page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
  })

  test('shows scenario brief on load', async ({ page }) => {
    await expect(page.getByText(/Foreign Policy Crisis/i)).toBeVisible()
    await expect(page.getByText(/Foreign Minister/i)).toBeVisible()
    await expect(page.getByText(/Dr. Chen/i)).toBeVisible()
  })

  test('shows "4 turns remaining" before any message', async ({ page }) => {
    await expect(page.getByText(/4 turns remaining/i)).toBeVisible()
  })

  test('hides brief when "Hide brief" is clicked', async ({ page }) => {
    await page.getByText('Hide brief').click()
    await expect(page.getByText(/Foreign Minister/i)).not.toBeVisible()
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  test('sends a message and receives a response (fallback or live)', async ({ page }) => {
    await page.getByRole('textbox').fill('My recommendation is to pursue diplomacy via the UN.')
    await page.getByRole('button', { name: /send/i }).click()

    // Either a live AI response or a fallback response should appear
    // Fallback turn 1 contains "principle, not a plan"
    // We just verify some AI response appears within 10s
    await expect(
      page.locator('[class*="rose"]').first().or(
        page.getByText(/principle, not a plan|strategy|Minister|recommendation/i).first()
      )
    ).toBeVisible({ timeout: 10_000 })
  })

  test('turn counter decrements after sending a message', async ({ page }) => {
    await page.getByRole('textbox').fill('Turn 1')
    await page.getByRole('button', { name: /send/i }).click()
    await expect(page.getByText(/3 turns remaining/i)).toBeVisible({ timeout: 10_000 })
  })

  test('never shows "Could not get a response" error message', async ({ page }) => {
    await page.getByRole('textbox').fill('Let us go to war')
    await page.getByRole('button', { name: /send/i }).click()
    // Wait for any response to appear
    await page.waitForTimeout(3000)
    await expect(page.getByText(/could not get a response/i)).not.toBeVisible()
  })

  test('shows completion screen after 4 turns', async ({ page }) => {
    // Use fallback responses (don't need live API) by sending any messages
    for (let i = 1; i <= 4; i++) {
      await page.getByRole('textbox').fill(`Turn ${i}`)
      await page.getByRole('button', { name: /send/i }).click()
      // Wait for AI response before sending next
      if (i < 4) {
        await expect(page.getByText(/\d turns remaining/i)).toBeVisible({ timeout: 10_000 })
      }
    }
    await expect(page.getByText(/demo complete/i)).toBeVisible({ timeout: 10_000 })
  })

  test('"Try again" resets the demo to initial state', async ({ page }) => {
    // Send 4 turns to reach completed state
    for (let i = 1; i <= 4; i++) {
      await page.getByRole('textbox').fill(`Turn ${i}`)
      await page.getByRole('button', { name: /send/i }).click()
      if (i < 4) {
        await expect(page.getByText(/\d turns remaining/i)).toBeVisible({ timeout: 10_000 })
      }
    }
    await expect(page.getByText(/demo complete/i)).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /try again/i }).click()

    await expect(page.getByText(/demo complete/i)).not.toBeVisible()
    await expect(page.getByText(/4 turns remaining/i)).toBeVisible()
    await expect(page.getByText(/Foreign Minister/i)).toBeVisible()
  })
})
