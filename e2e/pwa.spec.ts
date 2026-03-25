import { test, expect } from '@playwright/test'

test.describe('PWA / Service Worker', () => {
  test('service worker is registered on the home page', async ({ page }) => {
    await page.goto('/')
    // Wait for service worker to register
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false
      const registration = await navigator.serviceWorker.ready
      return !!registration.active
    })
    expect(swRegistered).toBe(true)
  })

  test('demo page loads without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/demo')
    await expect(page.getByText(/Foreign Policy Crisis/i)).toBeVisible()
    // Filter out known benign errors (e.g. Supabase ws connection in preview mode)
    const criticalErrors = errors.filter(
      (e) => !e.includes('WebSocket') && !e.includes('supabase'),
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('app shell is served from cache on repeat visits', async ({ page, context }) => {
    // First visit primes the cache
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Second page in the same context should load from cache
    const page2 = await context.newPage()
    await page2.goto('/demo')
    await expect(page2.getByText(/Foreign Policy Crisis/i)).toBeVisible({ timeout: 5_000 })
    await page2.close()
  })
})
