import { test, expect } from '@playwright/test'

// NOTE: These tests require a live Supabase test project.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the test environment.
// Skip gracefully if not configured.

const SKIP_IF_NO_SUPABASE = !process.env.VITE_SUPABASE_URL || !process.env.TEST_EMAIL

test.describe('Authentication', () => {
  test.skip(SKIP_IF_NO_SUPABASE, 'Supabase test credentials not configured')

  test('sign-in with valid credentials redirects to /instructor', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /sign in/i }).click()
    await page.getByLabel(/email/i).fill(process.env.TEST_EMAIL ?? '')
    await page.getByLabel(/password/i).fill(process.env.TEST_PASSWORD ?? '')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/instructor/, { timeout: 10_000 })
  })

  test('sign-out redirects to home page', async ({ page }) => {
    // Assumes we're already signed in from the previous test
    await page.goto('/instructor')
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL('/', { timeout: 5_000 })
  })

  test('protected routes redirect unauthenticated users', async ({ page }) => {
    await page.goto('/instructor')
    // Should redirect to home or show sign-in form
    const url = page.url()
    const isHome = url.endsWith('/') || url.endsWith('/kiln/')
    const hasSignIn = await page.getByRole('button', { name: /sign in/i }).isVisible()
    expect(isHome || hasSignIn).toBeTruthy()
  })
})
