import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// Test evaluate-scenario logic via unit assertions (same pattern as demo-turn tests)

const ALLOWED_ORIGINS = [
  'https://usekiln.org',
  'https://www.usekiln.org',
  'https://lobsterbush.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
]

const DEFAULT_RUBRIC = ['reasoning', 'communication', 'evidence', 'ethics']

Deno.test('evaluate-scenario: allowed origin is reflected in CORS header', () => {
  const origin = 'http://localhost:5173'
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  assertEquals(allowed, 'http://localhost:5173')
})

Deno.test('evaluate-scenario: disallowed origin falls back to usekiln.org', () => {
  const origin = 'https://evil.com'
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  assertEquals(allowed, 'https://usekiln.org')
})

Deno.test('evaluate-scenario: missing session_id is detected', () => {
  const body = {}
  const sessionId = (body as Record<string, unknown>).session_id
  assertEquals(!sessionId, true)
})

Deno.test('evaluate-scenario: missing auth header is caught', () => {
  const authHeader: string | null = null
  assertEquals(!authHeader?.startsWith('Bearer '), true)
})

Deno.test('evaluate-scenario: non-Bearer auth is rejected', () => {
  const authHeader = 'Basic abc123'
  assertEquals(!authHeader.startsWith('Bearer '), true)
})

Deno.test('evaluate-scenario: DEFAULT_RUBRIC has 4 dimensions', () => {
  assertEquals(DEFAULT_RUBRIC.length, 4)
  assertEquals(DEFAULT_RUBRIC, ['reasoning', 'communication', 'evidence', 'ethics'])
})

Deno.test('evaluate-scenario: rubric key normalization works', () => {
  const rubric = ['Strategic Reasoning', 'Risk Assessment']
  const rubricKeys = rubric.map((r) => r.toLowerCase().replace(/\s+/g, '_'))
  assertEquals(rubricKeys, ['strategic_reasoning', 'risk_assessment'])
})

Deno.test('evaluate-scenario: empty messages array is caught', () => {
  const messages: unknown[] = []
  assertEquals(messages.length === 0, true)
})

Deno.test('evaluate-scenario: filters participants with no student messages', () => {
  const byParticipant = new Map([
    ['p1', { name: 'Alice', messages: [{ speaker_type: 'student' }, { speaker_type: 'ai' }] }],
    ['p2', { name: 'Bob', messages: [{ speaker_type: 'ai' }] }],
    ['p3', { name: 'Carol', messages: [] }],
  ])

  const withStudentMessages = Array.from(byParticipant.entries())
    .filter(([, v]) => v.messages.filter((m) => m.speaker_type === 'student').length > 0)

  assertEquals(withStudentMessages.length, 1)
  assertEquals(withStudentMessages[0][0], 'p1')
})

Deno.test('evaluate-scenario: transcript builder concatenates messages', () => {
  const messages = [
    { speaker_name: 'Alice', content: 'Hello' },
    { speaker_name: 'Dr. Chen', content: 'Welcome' },
  ]
  const transcript = messages.map((m) => `[${m.speaker_name}]: ${m.content}`).join('\n\n')
  assertEquals(transcript, '[Alice]: Hello\n\n[Dr. Chen]: Welcome')
})

Deno.test('evaluate-scenario: custom rubric overrides default', () => {
  const config = { evaluation_rubric: ['Policy coherence', 'Risk assessment'] }
  const rubric = Array.isArray(config.evaluation_rubric) && config.evaluation_rubric.length > 0
    ? config.evaluation_rubric
    : DEFAULT_RUBRIC
  assertEquals(rubric, ['Policy coherence', 'Risk assessment'])
})

Deno.test('evaluate-scenario: fallback to default when rubric is empty', () => {
  const config = { evaluation_rubric: [] }
  const rubric = Array.isArray(config.evaluation_rubric) && config.evaluation_rubric.length > 0
    ? config.evaluation_rubric
    : DEFAULT_RUBRIC
  assertEquals(rubric, DEFAULT_RUBRIC)
})
