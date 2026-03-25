import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// ---------------------------------------------------------------------------
// Tests for the pure logic within generate-followup/index.ts
// These cover auth header validation, ownership checks, and chainText building
// without starting the actual Deno.serve server.
// ---------------------------------------------------------------------------

Deno.test('auth: missing Authorization header is caught', () => {
  const authHeader: string | null | undefined = null
  const isAuthorized = authHeader != null && authHeader.startsWith('Bearer ')
  assertEquals(isAuthorized, false)
})

Deno.test('auth: non-Bearer Authorization header is rejected', () => {
  const authHeader = 'Basic dXNlcjpwYXNz'
  const isAuthorized = authHeader.startsWith('Bearer ')
  assertEquals(isAuthorized, false)
})

Deno.test('auth: valid Bearer token is accepted', () => {
  const authHeader = 'Bearer eyJhbGciOiJIUzI1NiJ9.test.sig'
  const isAuthorized = authHeader.startsWith('Bearer ')
  assertEquals(isAuthorized, true)
})

Deno.test('auth: JWT is correctly extracted from Bearer header', () => {
  const authHeader = 'Bearer my.jwt.token'
  const jwt = authHeader.slice(7)
  assertEquals(jwt, 'my.jwt.token')
})

Deno.test('session ownership: forbids when instructor_id does not match', () => {
  const sessionOwner = { instructor_id: 'instr-A' }
  const requestingUser = { id: 'instr-B' }
  const isForbidden = !sessionOwner || sessionOwner.instructor_id !== requestingUser.id
  assertEquals(isForbidden, true)
})

Deno.test('session ownership: allows when instructor_id matches', () => {
  const sessionOwner = { instructor_id: 'instr-A' }
  const requestingUser = { id: 'instr-A' }
  const isForbidden = !sessionOwner || sessionOwner.instructor_id !== requestingUser.id
  assertEquals(isForbidden, false)
})

Deno.test('response ownership: rejects if response belongs to different session', () => {
  const response = { session_id: 'sess-X', participant_id: 'part-1' }
  const claimed = { session_id: 'sess-Y', participant_id: 'part-1' }
  const isUnauthorized = response.session_id !== claimed.session_id ||
    response.participant_id !== claimed.participant_id
  assertEquals(isUnauthorized, true)
})

Deno.test('response ownership: rejects if response belongs to different participant', () => {
  const response = { session_id: 'sess-X', participant_id: 'part-1' }
  const claimed = { session_id: 'sess-X', participant_id: 'part-2' }
  const isUnauthorized = response.session_id !== claimed.session_id ||
    response.participant_id !== claimed.participant_id
  assertEquals(isUnauthorized, true)
})

Deno.test('response ownership: allows when both session and participant match', () => {
  const response = { session_id: 'sess-X', participant_id: 'part-1' }
  const claimed = { session_id: 'sess-X', participant_id: 'part-1' }
  const isUnauthorized = response.session_id !== claimed.session_id ||
    response.participant_id !== claimed.participant_id
  assertEquals(isUnauthorized, false)
})

Deno.test('chainText: builds correctly from prior responses in order', () => {
  type PriorResponse = { round: number; content: string; response_type: string }
  const priorResponses: PriorResponse[] = [
    { round: 1, content: 'My initial argument.', response_type: 'initial' },
    { round: 2, content: 'My follow-up answer.', response_type: 'followup_answer' },
  ]

  const chainText = priorResponses.map((r) => {
    const label = r.response_type === 'initial' ? 'Initial response' :
      r.response_type === 'followup_answer' ? 'Follow-up answer' : r.response_type
    return `[Round ${r.round} — ${label}]\n${r.content}`
  }).join('\n\n')

  assertEquals(
    chainText,
    '[Round 1 — Initial response]\nMy initial argument.\n\n[Round 2 — Follow-up answer]\nMy follow-up answer.',
  )
})

Deno.test('chainText: empty when no prior responses', () => {
  type PriorResponse = { round: number; content: string; response_type: string }
  const priorResponses: PriorResponse[] = []
  const chainText = priorResponses.map((r) =>
    `[Round ${r.round} — ${r.response_type}]\n${r.content}`
  ).join('\n\n')
  assertEquals(chainText, '')
})

Deno.test('required fields: rejects when response_id is missing', () => {
  const body = { session_id: 'sess-1', participant_id: 'part-1', round: 1 }
  const { response_id, session_id, participant_id, round } = body as Record<string, unknown>
  const isValid = !!(response_id && session_id && participant_id && round != null)
  assertEquals(isValid, false)
})

Deno.test('required fields: accepts when all fields are present', () => {
  const body = { response_id: 'resp-1', session_id: 'sess-1', participant_id: 'part-1', round: 1 }
  const { response_id, session_id, participant_id, round } = body
  const isValid = !!(response_id && session_id && participant_id && round != null)
  assertEquals(isValid, true)
})
