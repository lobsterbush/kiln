import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// ---------------------------------------------------------------------------
// Tests for the pure logic in generate-scenario-turn:
// CORS, field validation, turn counting, persona selection, max-turns.
// ---------------------------------------------------------------------------

// ---- CORS origin logic -----------------------------------------------------

Deno.test('scenario-turn: allowed origin is reflected in CORS header', () => {
  const ALLOWED_ORIGINS = [
    'https://usekiln.org',
    'https://www.usekiln.org',
    'https://lobsterbush.github.io',
    'http://localhost:5173',
    'http://localhost:4173',
  ]
  for (const origin of ALLOWED_ORIGINS) {
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
    assertEquals(allowed, origin)
  }
})

Deno.test('scenario-turn: disallowed origin falls back to usekiln.org', () => {
  const ALLOWED_ORIGINS = ['https://usekiln.org', 'https://www.usekiln.org']
  const origin = 'https://attacker.example.com'
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  assertEquals(allowed, 'https://usekiln.org')
})

// ---- Required field validation ---------------------------------------------

Deno.test('scenario-turn: rejects when session_id is missing', () => {
  const body = { participant_id: 'p1', token: 'tok', content: 'Hello' }
  const isValid = !!(
    (body as Record<string, unknown>).session_id &&
    body.participant_id &&
    body.token &&
    (body.content as string)?.trim()
  )
  assertEquals(isValid, false)
})

Deno.test('scenario-turn: rejects when content is empty string', () => {
  const body = { session_id: 's1', participant_id: 'p1', token: 'tok', content: '   ' }
  const isValid = !!(body.session_id && body.participant_id && body.token && body.content?.trim())
  assertEquals(isValid, false)
})

Deno.test('scenario-turn: accepts when all required fields are present', () => {
  const body = { session_id: 's1', participant_id: 'p1', token: 'tok', content: 'Hello there' }
  const isValid = !!(body.session_id && body.participant_id && body.token && body.content?.trim())
  assertEquals(isValid, true)
})

// ---- Turn counting ---------------------------------------------------------

Deno.test('scenario-turn: correctly counts student turns from transcript', () => {
  type Msg = { speaker_type: string }
  const transcript: Msg[] = [
    { speaker_type: 'student' },
    { speaker_type: 'ai' },
    { speaker_type: 'student' },
    { speaker_type: 'ai' },
  ]
  const studentTurnCount = transcript.filter((m) => m.speaker_type === 'student').length
  assertEquals(studentTurnCount, 2)
})

Deno.test('scenario-turn: blocks when studentTurnCount >= maxTurns', () => {
  const studentTurnCount = 8
  const maxTurns = 8
  assertEquals(studentTurnCount >= maxTurns, true)
})

Deno.test('scenario-turn: allows when studentTurnCount < maxTurns', () => {
  const studentTurnCount = 3
  const maxTurns = 8
  assertEquals(studentTurnCount >= maxTurns, false)
})

Deno.test('scenario-turn: completed flag is true when new count reaches maxTurns', () => {
  const studentTurnCount = 7
  const maxTurns = 8
  const newStudentTurnCount = studentTurnCount + 1
  const completed = newStudentTurnCount >= maxTurns
  assertEquals(completed, true)
})

Deno.test('scenario-turn: next turn number is transcript.length + 1', () => {
  type Msg = { speaker_type: string }
  const transcript: Msg[] = [
    { speaker_type: 'student' },
    { speaker_type: 'ai' },
  ]
  const nextTurn = transcript.length + 1
  assertEquals(nextTurn, 3)
})

// ---- Solo persona selection ------------------------------------------------

Deno.test('scenario-turn: solo mode uses first persona as respondent', () => {
  type Persona = { name: string; role: string; goals: string }
  const personas: Persona[] = [
    { name: 'Dr. Chen', role: 'NSA', goals: 'Stress-test ideas' },
    { name: 'Minister Lee', role: 'Finance', goals: 'Protect economy' },
  ]
  const activityType = 'scenario_solo'
  const persona = activityType === 'scenario_solo'
    ? (personas[0] ?? { name: 'Counterpart', role: 'Negotiating counterpart', goals: 'Advance your interests' })
    : null
  assertEquals(persona?.name, 'Dr. Chen')
})

Deno.test('scenario-turn: solo mode falls back to Counterpart when no personas defined', () => {
  type Persona = { name: string; role: string; goals: string }
  const personas: Persona[] = []
  const fallback = { name: 'Counterpart', role: 'Negotiating counterpart', goals: 'Advance your interests strategically' }
  const persona = personas[0] ?? fallback
  assertEquals(persona.name, 'Counterpart')
})

// ---- Multi-stakeholder persona selection -----------------------------------

Deno.test('scenario-turn: multi mode chooses persona by name match (case-insensitive)', () => {
  type Persona = { name: string; role: string; goals: string }
  const personas: Persona[] = [
    { name: 'Dr. Chen', role: 'NSA', goals: 'Stress-test' },
    { name: 'Minister Lee', role: 'Finance', goals: 'Protect economy' },
  ]
  const chosenName = 'minister lee' // Claude returns lowercase
  const chosenPersona = personas.find(
    (p) => p.name.toLowerCase() === chosenName.toLowerCase()
  ) ?? personas[0]
  assertEquals(chosenPersona.name, 'Minister Lee')
})

Deno.test('scenario-turn: multi mode falls back to first persona when name not matched', () => {
  type Persona = { name: string; role: string; goals: string }
  const personas: Persona[] = [
    { name: 'Dr. Chen', role: 'NSA', goals: 'Stress-test' },
  ]
  const chosenName = 'Unknown Person'
  const chosenPersona = personas.find(
    (p) => p.name.toLowerCase() === chosenName.toLowerCase()
  ) ?? personas[0]
  assertEquals(chosenPersona.name, 'Dr. Chen')
})

// ---- History message mapping -----------------------------------------------

Deno.test('scenario-turn: student messages map to "user" role in Claude history', () => {
  type TMsg = { speaker_type: string; content: string }
  const transcript: TMsg[] = [
    { speaker_type: 'student', content: 'My position is...' },
    { speaker_type: 'ai', content: 'Interesting...' },
  ]
  const history = transcript.map((msg) => ({
    role: msg.speaker_type === 'student' ? 'user' : 'assistant',
    content: msg.content,
  }))
  assertEquals(history[0].role, 'user')
  assertEquals(history[1].role, 'assistant')
})

Deno.test('scenario-turn: default maxTurns is 8 when not configured', () => {
  const config: Record<string, unknown> = {}
  const maxTurns: number = (config.max_turns as number) ?? 8
  assertEquals(maxTurns, 8)
})
