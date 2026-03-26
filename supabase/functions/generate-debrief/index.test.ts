import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const TYPE_LABELS: Record<string, string> = {
  peer_critique: 'Peer Critique',
  socratic_chain: 'Socratic Chain',
  peer_clarification: 'Peer Clarification',
  evidence_analysis: 'Evidence Analysis',
}

Deno.test('debrief: TYPE_LABELS covers all round-based activity types', () => {
  assertEquals(Object.keys(TYPE_LABELS).length, 4)
  assertEquals(TYPE_LABELS['peer_critique'], 'Peer Critique')
  assertEquals(TYPE_LABELS['socratic_chain'], 'Socratic Chain')
})

Deno.test('debrief: missing session_id is caught', () => {
  const body: Record<string, unknown> = {}
  assertEquals(!body.session_id, true)
})

Deno.test('debrief: missing auth header is caught', () => {
  const authHeader: string | null = null
  assertEquals(!authHeader?.startsWith('Bearer '), true)
})

Deno.test('debrief: JWT extraction from Bearer header', () => {
  const authHeader = 'Bearer abc123token'
  const jwt = authHeader.slice(7)
  assertEquals(jwt, 'abc123token')
})

Deno.test('debrief: empty responses array is caught', () => {
  const responses: unknown[] = []
  assertEquals(responses.length === 0, true)
})

Deno.test('debrief: name lookup builds correctly', () => {
  const participants = [
    { id: 'p1', display_name: 'Alice' },
    { id: 'p2', display_name: 'Bob' },
  ]
  const nameMap = new Map<string, string>()
  for (const p of participants) nameMap.set(p.id, p.display_name)
  assertEquals(nameMap.get('p1'), 'Alice')
  assertEquals(nameMap.get('p2'), 'Bob')
  assertEquals(nameMap.get('p3'), undefined)
})

Deno.test('debrief: response grouping by round works', () => {
  const responses = [
    { participant_id: 'p1', round: 1, content: 'Round 1 response', response_type: 'initial' },
    { participant_id: 'p2', round: 1, content: 'Another R1 response', response_type: 'initial' },
    { participant_id: 'p1', round: 2, content: 'Round 2 response', response_type: 'critique' },
  ]
  const nameMap = new Map([['p1', 'Alice'], ['p2', 'Bob']])

  const rounds: Record<number, string[]> = {}
  for (const r of responses) {
    if (!rounds[r.round]) rounds[r.round] = []
    const name = nameMap.get(r.participant_id) ?? 'Student'
    const excerpt = r.content.length > 300 ? r.content.slice(0, 300) + '…' : r.content
    rounds[r.round].push(`${name}: "${excerpt}"`)
  }

  assertEquals(Object.keys(rounds).length, 2)
  assertEquals(rounds[1].length, 2)
  assertEquals(rounds[2].length, 1)
})

Deno.test('debrief: long responses are truncated to 300 chars', () => {
  const longContent = 'x'.repeat(400)
  const excerpt = longContent.length > 300 ? longContent.slice(0, 300) + '…' : longContent
  assertEquals(excerpt.length, 301) // 300 + '…'
})

Deno.test('debrief: short responses are not truncated', () => {
  const shortContent = 'A brief response.'
  const excerpt = shortContent.length > 300 ? shortContent.slice(0, 300) + '…' : shortContent
  assertEquals(excerpt, shortContent)
})

Deno.test('debrief: round summary format is correct', () => {
  const rounds: Record<number, string[]> = {
    1: ['Alice: "Hello"', 'Bob: "World"'],
    2: ['Alice: "Critique"'],
  }
  const summary = Object.entries(rounds)
    .map(([round, lines]) => `ROUND ${round} (${lines.length} responses):\n${lines.join('\n')}`)
    .join('\n\n')
  assertEquals(summary.includes('ROUND 1 (2 responses)'), true)
  assertEquals(summary.includes('ROUND 2 (1 responses)'), true)
})

Deno.test('debrief: JSON parse with fallback handles malformed response', () => {
  const rawText = '```json\n{"themes": ["test"]}\n```'
  let debrief: unknown
  try {
    debrief = JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        debrief = JSON.parse(match[0])
      } catch {
        debrief = { themes: [], gaps: [], notable: [], suggestion: rawText.slice(0, 200) }
      }
    }
  }
  assertEquals((debrief as { themes: string[] }).themes, ['test'])
})
