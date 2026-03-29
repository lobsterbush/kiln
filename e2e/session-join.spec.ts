import { test, expect } from '@playwright/test'

test.describe('Session join flow', () => {
  test('join page renders the code and name inputs', async ({ page }) => {
    await page.goto('/join')
    await expect(page.getByLabel(/session code/i)).toBeVisible()
    await expect(page.getByLabel(/your name/i)).toBeVisible()
  })

  test('invalid join code shows an error', async ({ page }) => {
    await page.goto('/join')
    await page.getByLabel(/session code/i).fill('XXXXXX')
    await page.getByLabel(/your name/i).fill('Alice')
    await page.getByRole('button', { name: /join/i }).click()
    // Should show error (session not found)
    await expect(page.getByText(/not found|no session/i)).toBeVisible({ timeout: 5_000 })
  })

  test('navigating to /join with ?code pre-fills the code input', async ({ page }) => {
    await page.goto('/join?code=ABC123')
    const value = await page.getByLabel(/session code/i).inputValue()
    expect(value.toUpperCase()).toContain('ABC')
  })
})
