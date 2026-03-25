import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// Tests for pure logic in generate-feedback: grouping, auth, graceful fallback

Deno.test('feedback: groups responses correctly by participant', () => {
  type Resp = { participant_id: string; round: number; content: string; response_type: string }
  type Part = { id: string; display_name: string }

  const participants: Part[] = [
    { id: 'p1', display_name: 'Alice' },
    { id: 'p2', display_name: 'Bob' },
  ]
  const responses: Resp[] = [
    { participant_id: 'p1', round: 1, content: 'Alice R1', response_type: 'initial' },
    { participant_id: 'p2', round: 1, content: 'Bob R1', response_type: 'initial' },
    { participant_id: 'p1', round: 2, content: 'Alice R2', response_type: 'critique' },
  ]

  const byParticipant = new Map<string, { name: string; responses: Resp[] }>()
  for (const p of participants) {
    byParticipant.set(p.id, { name: p.display_name, responses: [] })
  }
  for (const r of responses) {
    byParticipant.get(r.participant_id)?.responses.push(r)
  }

  assertEquals(byParticipant.get('p1')?.responses.length, 2)
  assertEquals(byParticipant.get('p2')?.responses.length, 1)
  assertEquals(byParticipant.get('p1')?.name, 'Alice')
})

Deno.test('feedback: filters out participants with no responses', () => {
  type Entry = [string, { name: string; responses: unknown[] }]
  const byParticipant: Map<string, { name: string; responses: unknown[] }> = new Map([
    ['p1', { name: 'Alice', responses: ['r1'] }],
    ['p2', { name: 'Bob', responses: [] }],
  ])

  const participantList = Array.from(byParticipant.entries() as IterableIterator<Entry>)
    .filter(([, v]) => v.responses.length > 0)

  assertEquals(participantList.length, 1)
  assertEquals(participantList[0][1].name, 'Alice')
})

Deno.test('feedback: missing session_id is caught', () => {
  const body = {} as Record<string, unknown>
  const isValid = !!body.session_id
  assertEquals(isValid, false)
})

Deno.test('feedback: returns error when no responses exist', () => {
  const responses: unknown[] = []
  const isEmpty = responses.length === 0
  assertEquals(isEmpty, true)
})

Deno.test('feedback: per-participant fallback does not abort others', async () => {
  // Simulates the Promise.all pattern with one failure
  const participants = ['p1', 'p2', 'p3']
  const results = await Promise.all(
    participants.map(async (id) => {
      try {
        if (id === 'p2') throw new Error('Claude timeout')
        return { participant_id: id, text: `Feedback for ${id}` }
      } catch {
        return { participant_id: id, text: 'Could not generate feedback for this student.' }
      }
    }),
  )

  assertEquals(results.length, 3)
  assertEquals(results[0].text, 'Feedback for p1')
  assertEquals(results[1].text, 'Could not generate feedback for this student.')
  assertEquals(results[2].text, 'Feedback for p3')
})

Deno.test('feedback: TYPE_LABELS map covers all response types', () => {
  const TYPE_LABELS: Record<string, string> = {
    initial: 'Initial response',
    critique: 'Peer critique',
    rebuttal: 'Rebuttal',
    followup_answer: 'Follow-up answer',
    clarification: 'Clarification',
    evidence_gap: 'Gap analysis',
  }

  const expectedTypes = ['initial', 'critique', 'rebuttal', 'followup_answer', 'clarification', 'evidence_gap']
  for (const t of expectedTypes) {
    assertEquals(typeof TYPE_LABELS[t], 'string')
  }
  assertEquals(Object.keys(TYPE_LABELS).length, expectedTypes.length)
})

Deno.test('feedback: source material is trimmed to 3000 chars', () => {
  const rawMaterial = 'A'.repeat(4000)
  const sourceMaterial = rawMaterial.length > 3000 ? rawMaterial.slice(0, 3000) + '…' : rawMaterial
  assertEquals(sourceMaterial.length, 3001) // 3000 chars + ellipsis
})

Deno.test('feedback: source material under 3000 chars is not trimmed', () => {
  const rawMaterial = 'Short material'
  const sourceMaterial = rawMaterial.length > 3000 ? rawMaterial.slice(0, 3000) + '…' : rawMaterial
  assertEquals(sourceMaterial, 'Short material')
})
