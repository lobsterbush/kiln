import { test, expect } from '@playwright/test'

test.describe('Session join flow', () => {
  test('join page renders the code entry form', async ({ page }) => {
    await page.goto('/join')
    await expect(page.getByRole('textbox')).toBeVisible()
  })

  test('invalid join code shows an error', async ({ page }) => {
    await page.goto('/join')
    const input = page.getByRole('textbox')
    await input.fill('XXXXXX')
    // Submit the form (Enter key or button click)
    await page.keyboard.press('Enter')
    // Should show error (session not found)
    await expect(page.getByText(/invalid|not found|no session/i)).toBeVisible({ timeout: 5_000 })
  })

  test('navigating to /join with ?code pre-fills the input', async ({ page }) => {
    await page.goto('/join?code=ABC123')
    const input = page.getByRole('textbox')
    // Code may be pre-filled or the page may immediately start validating
    const value = await input.inputValue()
    expect(value.toUpperCase()).toContain('ABC')
  })
})
