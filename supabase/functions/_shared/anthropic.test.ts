import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// ---------------------------------------------------------------------------
// Minimal stub for callClaude — we import the real function but intercept
// fetch so no real HTTP calls are made.
// ---------------------------------------------------------------------------

// Re-export to test the real module
import { callClaude } from './anthropic.ts'

const DUMMY_BODY = {
  model: 'claude-sonnet-4-6',
  max_tokens: 100,
  system: 'You are a test bot.',
  messages: [{ role: 'user' as const, content: 'Hello' }],
}

/** Helper: replace globalThis.fetch with a stub that returns a controlled Response */
function mockFetch(responses: Array<{ status: number; body: unknown; retryAfter?: string }>) {
  let callCount = 0
  const original = globalThis.fetch
  globalThis.fetch = async (): Promise<Response> => {
    const r = responses[callCount] ?? responses[responses.length - 1]
    callCount++
    const headers = new Headers({ 'Content-Type': 'application/json' })
    if (r.retryAfter) headers.set('retry-after', r.retryAfter)
    return new Response(JSON.stringify(r.body), { status: r.status, headers })
  }
  return () => { globalThis.fetch = original }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

Deno.test('callClaude returns parsed JSON on 200', async () => {
  const restore = mockFetch([{ status: 200, body: { content: [{ text: 'hello' }] } }])
  try {
    const result = await callClaude('key', DUMMY_BODY)
    assertEquals(result.content?.[0]?.text, 'hello')
  } finally {
    restore()
  }
})

Deno.test('callClaude throws immediately on non-retryable 400', async () => {
  const restore = mockFetch([{ status: 400, body: { error: { message: 'Bad request' } } }])
  try {
    await assertRejects(
      () => callClaude('key', DUMMY_BODY),
      Error,
      'Anthropic API 400',
    )
  } finally {
    restore()
  }
})

Deno.test('callClaude throws immediately on 401', async () => {
  const restore = mockFetch([{ status: 401, body: { error: { message: 'Unauthorized' } } }])
  try {
    await assertRejects(() => callClaude('key', DUMMY_BODY), Error, 'Anthropic API 401')
  } finally {
    restore()
  }
})

Deno.test('callClaude retries on 429 and succeeds on third attempt', async () => {
  const restore = mockFetch([
    { status: 429, body: {} },
    { status: 429, body: {} },
    { status: 200, body: { content: [{ text: 'ok after retry' }] } },
  ])
  try {
    const result = await callClaude('key', DUMMY_BODY)
    assertEquals(result.content?.[0]?.text, 'ok after retry')
  } finally {
    restore()
  }
})

Deno.test('callClaude throws after exhausting retries on 503', async () => {
  const restore = mockFetch([
    { status: 503, body: {} },
    { status: 503, body: {} },
    { status: 503, body: {} },
  ])
  try {
    await assertRejects(() => callClaude('key', DUMMY_BODY), Error, 'Anthropic API 503')
  } finally {
    restore()
  }
})

Deno.test('callClaude retries on TypeError (network failure) and succeeds', async () => {
  let calls = 0
  const original = globalThis.fetch
  globalThis.fetch = async (): Promise<Response> => {
    calls++
    if (calls < 3) throw new TypeError('Failed to fetch')
    return new Response(JSON.stringify({ content: [{ text: 'network recovered' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const result = await callClaude('key', DUMMY_BODY)
    assertEquals(result.content?.[0]?.text, 'network recovered')
  } finally {
    globalThis.fetch = original
  }
})

Deno.test('callClaude respects retry-after header for delay', async () => {
  const timings: number[] = []
  let calls = 0
  const original = globalThis.fetch
  globalThis.fetch = async (): Promise<Response> => {
    timings.push(Date.now())
    calls++
    if (calls === 1) {
      const headers = new Headers({ 'retry-after': '0' })
      return new Response('{}', { status: 429, headers })
    }
    return new Response(JSON.stringify({ content: [{ text: 'done' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const result = await callClaude('key', DUMMY_BODY)
    assertEquals(result.content?.[0]?.text, 'done')
    assertEquals(calls, 2)
  } finally {
    globalThis.fetch = original
  }
})
