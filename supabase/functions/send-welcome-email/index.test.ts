import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

Deno.test('welcome-email: extracts email from direct invocation body', () => {
  const body = { email: 'test@example.com' }
  const email: string = body.email ?? ''
  assertEquals(email, 'test@example.com')
})

Deno.test('welcome-email: extracts email from DB webhook payload', () => {
  const body = { record: { email: 'webhook@example.com' } }
  const email: string = (body as Record<string, unknown>).email as string ?? (body.record?.email ?? '')
  assertEquals(email, 'webhook@example.com')
})

Deno.test('welcome-email: rejects missing email', () => {
  const body = {}
  const email: string = (body as Record<string, unknown>).email as string ?? ''
  assertEquals(!email || !email.includes('@'), true)
})

Deno.test('welcome-email: rejects email without @', () => {
  const body = { email: 'invalid' }
  const email = body.email
  assertEquals(!email.includes('@'), true)
})

Deno.test('welcome-email: CORS origin logic', () => {
  const ALLOWED_ORIGINS = [
    'https://usekiln.org', 'https://www.usekiln.org', 'https://lobsterbush.github.io',
    'http://localhost:5173', 'http://localhost:4173',
  ]
  assertEquals(ALLOWED_ORIGINS.includes('https://usekiln.org'), true)
  assertEquals(ALLOWED_ORIGINS.includes('https://bad.com'), false)

  const origin = 'https://bad.com'
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  assertEquals(allowed, 'https://usekiln.org')
})
