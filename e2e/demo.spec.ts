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

    // Wait for the AI response — either live or fallback. The response appears
    // inside a bubble with "Dr. Chen" label (rose-500 text).
    await expect(
      page.getByText('Dr. Chen').nth(1) // nth(1) = the one in the chat, not the brief
    ).toBeVisible({ timeout: 15_000 })
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
    for (let i = 1; i <= 4; i++) {
      await page.getByRole('textbox').fill(`Turn ${i}`)
      await page.getByRole('button', { name: /send/i }).click()
      // Wait for the AI response bubble to appear before sending next turn
      await expect(
        page.locator('text=Dr. Chen').nth(i) // nth(i) = the i-th chat response label
      ).toBeVisible({ timeout: 15_000 })
    }
    await expect(page.getByText(/demo complete/i)).toBeVisible({ timeout: 10_000 })
  })

  test('"Try again" resets the demo to initial state', async ({ page }) => {
    for (let i = 1; i <= 4; i++) {
      await page.getByRole('textbox').fill(`Turn ${i}`)
      await page.getByRole('button', { name: /send/i }).click()
      await expect(
        page.locator('text=Dr. Chen').nth(i)
      ).toBeVisible({ timeout: 15_000 })
    }
    await expect(page.getByText(/demo complete/i)).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /try again/i }).click()

    await expect(page.getByText(/demo complete/i)).not.toBeVisible()
    await expect(page.getByText(/4 turns remaining/i)).toBeVisible()
    await expect(page.getByText(/Foreign Minister/i)).toBeVisible()
  })
})
