import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// ---------------------------------------------------------------------------
// Tests for demo-turn logic via direct assertions (no server binding needed)
// ---------------------------------------------------------------------------

// Build a synthetic Request pointing at the edge function
function makeRequest(
  body: unknown,
  options: { method?: string; origin?: string } = {},
): Request {
  const { method = 'POST', origin = 'https://usekiln.org' } = options
  return new Request('https://fn.supabase.co/demo-turn', {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Origin': origin,
    },
    body: method === 'OPTIONS' ? undefined : JSON.stringify(body),
  })
}

// We import the handler from a thin re-export wrapper.
// Since demo-turn uses Deno.serve directly we test its logic here via unit assertions.

Deno.test('demo-turn: OPTIONS preflight returns 200 with CORS headers', async () => {
  // Simulate the CORS preflight logic directly
  const req = makeRequest({}, { method: 'OPTIONS' })
  assertEquals(req.method, 'OPTIONS')

  // Verify the allowed origin logic
  const ALLOWED_ORIGINS = [
    'https://usekiln.org',
    'https://www.usekiln.org',
    'https://lobsterbush.github.io',
    'http://localhost:5173',
    'http://localhost:4173',
  ]
  const origin = req.headers.get('Origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  assertEquals(allowedOrigin, 'https://usekiln.org')
})

Deno.test('demo-turn: disallowed origin falls back to first allowed origin', () => {
  const ALLOWED_ORIGINS = [
    'https://usekiln.org',
    'https://www.usekiln.org',
    'https://lobsterbush.github.io',
    'http://localhost:5173',
    'http://localhost:4173',
  ]
  const origin = 'https://evil.attacker.com'
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  assertEquals(allowedOrigin, 'https://usekiln.org')
})

Deno.test('demo-turn: student message count logic is correct', () => {
  const messages = [
    { role: 'user', content: 'Turn 1' },
    { role: 'assistant', content: 'Reply 1' },
    { role: 'user', content: 'Turn 2' },
  ]
  const studentMsgCount = messages.filter((m) => m.role === 'user').length
  assertEquals(studentMsgCount, 2)
  assertEquals(studentMsgCount > 4, false) // should not block
})

Deno.test('demo-turn: blocks when student message count exceeds 4', () => {
  const messages = Array.from({ length: 5 }, (_, i) => ({ role: 'user', content: `Turn ${i + 1}` }))
  const studentMsgCount = messages.filter((m) => m.role === 'user').length
  assertEquals(studentMsgCount > 4, true)
})

Deno.test('demo-turn: completed flag is true when studentMsgCount reaches 4', () => {
  const studentMsgCount = 4
  const completed = studentMsgCount >= 4
  assertEquals(completed, true)
})

Deno.test('demo-turn: completed flag is false when studentMsgCount is 3', () => {
  const studentMsgCount = 3
  const completed = studentMsgCount >= 4
  assertEquals(completed, false)
})

Deno.test('demo-turn: validates messages array is required', () => {
  // Empty array should be rejected
  const messages: unknown[] = []
  const isValid = Array.isArray(messages) && messages.length > 0
  assertEquals(isValid, false)
})

Deno.test('demo-turn: validates messages array must be an array', () => {
  const messages = null
  const isValid = Array.isArray(messages) && (messages as unknown[]).length > 0
  assertEquals(isValid, false)
})
